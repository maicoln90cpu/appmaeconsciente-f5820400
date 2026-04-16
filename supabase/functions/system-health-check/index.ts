import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

/**
 * System Health Check — Edge Function
 *
 * Dois modos de execução:
 * 1. Manual (admin via dashboard): requer Authorization header com token de admin
 * 2. Cron (pg_cron a cada 30min): detecta source=pg_cron no body, usa anon key como auth
 *
 * Salva resultados em system_health_logs e detecta degradação consecutiva.
 */

const KNOWN_TABLES = [
  "profiles", "posts", "comments", "products", "user_product_access",
  "baby_feeding_logs", "baby_sleep_logs", "baby_vaccination_profiles",
  "blog_posts", "notifications", "user_notifications",
  "system_health_status", "client_error_logs", "performance_logs",
  "feature_usage_logs", "admin_audit_log", "cron_job_logs",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);

  const origin = req.headers.get("Origin");
  const headers = { ...getCorsHeaders(origin), "Content-Type": "application/json" };
  const requestId = req.headers.get("x-request-id") || "no-rid";

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Detect cron vs manual call
    let isCron = false;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        isCron = body?.source === "pg_cron";
      } catch {
        // Not JSON body — treat as manual
      }
    }

    // Manual call: validate admin auth
    if (!isCron) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers });
      }
    }

    console.log(`[rid:${requestId}] Health check started (mode: ${isCron ? "cron" : "manual"})`);

    // ─── Collect health metrics ───────────────────────────────────────
    const tableCounts: { table_name: string; row_count: number }[] = [];
    let errorCount = 0;
    let slowQueryCount = 0;

    // Table row counts
    for (const table of KNOWN_TABLES) {
      try {
        const { count } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true });
        tableCounts.push({ table_name: table, row_count: count ?? 0 });
      } catch {
        // Skip inaccessible tables
      }
    }

    // Recent errors (last 30 min)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { count: recentErrors } = await supabase
      .from("client_error_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyMinAgo);
    errorCount = recentErrors ?? 0;

    // Recent slow queries (last 30 min)
    const { count: recentSlow } = await supabase
      .from("performance_logs")
      .select("id", { count: "exact", head: true })
      .eq("is_slow", true)
      .gte("created_at", thirtyMinAgo);
    slowQueryCount = recentSlow ?? 0;

    // ─── Calculate health score (0-100) ───────────────────────────────
    let score = 100;

    // Penalize errors: -5 per error, max -40
    score -= Math.min(errorCount * 5, 40);

    // Penalize slow queries: -3 per slow query, max -30
    score -= Math.min(slowQueryCount * 3, 30);

    // Penalize if critical tables are empty (profiles, products)
    const profilesCount = tableCounts.find(t => t.table_name === "profiles")?.row_count ?? 0;
    if (profilesCount === 0) score -= 10;

    score = Math.max(0, Math.min(100, score));

    const status = score >= 80 ? "healthy" : score >= 50 ? "degraded" : "critical";

    const healthResult = {
      tables: tableCounts.sort((a, b) => b.row_count - a.row_count),
      total_tables: tableCounts.length,
      total_rows: tableCounts.reduce((s, t) => s + t.row_count, 0),
      score,
      status,
      errors_last_30m: errorCount,
      slow_queries_last_30m: slowQueryCount,
      checked_at: new Date().toISOString(),
    };

    // ─── Persist to system_health_logs ────────────────────────────────
    await supabase.from("system_health_logs").insert({
      module_name: "system",
      score,
      status,
    });

    // Also update system_health_status (upsert)
    await supabase.from("system_health_status").upsert({
      module_name: "system",
      score,
      status,
      checked_at: new Date().toISOString(),
      metrics: {
        total_tables: tableCounts.length,
        total_rows: healthResult.total_rows,
        errors_last_30m: errorCount,
        slow_queries_last_30m: slowQueryCount,
      },
      issues: errorCount > 10
        ? [{ type: "error_spike", message: `${errorCount} erros nos últimos 30min` }]
        : [],
      recommendations: score < 80
        ? ["Verificar logs de erro recentes", "Investigar queries lentas"]
        : [],
    }, { onConflict: "module_name" });

    // ─── Degradation detection: 3 consecutive bad checks → alert ──────
    if (score < 70) {
      const { data: recentLogs } = await supabase
        .from("system_health_logs")
        .select("score")
        .eq("module_name", "system")
        .order("recorded_at", { ascending: false })
        .limit(3);

      const consecutiveBad = (recentLogs || []).every((l: { score: number }) => l.score < 70);

      if (consecutiveBad && (recentLogs?.length ?? 0) >= 3) {
        // Get admin user IDs for notification
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (admins && admins.length > 0) {
          const adminId = admins[0].user_id;

          // Create a global notification for admins
          await supabase.from("notifications").insert({
            title: "⚠️ Sistema degradado",
            message: `Score de saúde: ${score}/100 por 3 verificações consecutivas. Erros: ${errorCount}, Queries lentas: ${slowQueryCount}. Verifique o painel de observabilidade.`,
            type: "system",
            is_global: false,
            created_by: adminId,
          });

          // Insert individual notifications for each admin
          for (const admin of admins) {
            await supabase.from("user_notifications").insert({
              user_id: admin.user_id,
              notification_id: (await supabase
                .from("notifications")
                .select("id")
                .eq("title", "⚠️ Sistema degradado")
                .order("created_at", { ascending: false })
                .limit(1)
                .single()).data?.id,
            });
          }

          console.log(`[rid:${requestId}] ALERT: System degraded for 3+ checks, admins notified`);
        }
      }
    }

    console.log(`[rid:${requestId}] Health check complete: score=${score}, status=${status}`);

    return new Response(JSON.stringify(healthResult), { status: 200, headers });
  } catch (error) {
    console.error(`[rid:${requestId}] system-health-check error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});
