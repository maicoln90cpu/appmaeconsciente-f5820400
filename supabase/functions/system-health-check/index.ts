import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);

  const origin = req.headers.get("Origin");
  const headers = { ...getCorsHeaders(origin), "Content-Type": "application/json" };

  try {
    // Validate auth - admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the user is admin
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

    // Query database stats using service role
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: "DB URL not configured" }), { status: 500, headers });
    }

    // Use supabase RPC or direct queries via the admin client
    // Get table stats from information_schema
    const { data: tables, error: tablesError } = await supabase.rpc("get_database_stats");

    if (tablesError) {
      // Fallback: return basic info from known tables
      const knownTables = [
        "profiles", "posts", "comments", "products", "user_product_access",
        "baby_feeding_logs", "baby_sleep_logs", "baby_vaccination_profiles",
        "blog_posts", "notifications", "user_notifications",
        "system_health_status", "client_error_logs", "performance_logs",
        "feature_usage_logs", "admin_audit_log", "cron_job_logs",
      ];

      const tableCounts = [];
      for (const table of knownTables) {
        try {
          const { count } = await supabase
            .from(table)
            .select("*", { count: "exact", head: true });
          tableCounts.push({ table_name: table, row_count: count ?? 0 });
        } catch {
          // Skip tables that don't exist or have permission issues
        }
      }

      return new Response(JSON.stringify({
        tables: tableCounts.sort((a, b) => b.row_count - a.row_count),
        total_tables: tableCounts.length,
        total_rows: tableCounts.reduce((s, t) => s + t.row_count, 0),
        cache_hit_ratio: null,
        database_size: null,
      }), { status: 200, headers });
    }

    return new Response(JSON.stringify(tables), { status: 200, headers });
  } catch (error) {
    console.error("system-health-check error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});
