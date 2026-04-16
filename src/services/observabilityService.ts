import { supabase } from "@/integrations/supabase/client";

// ─── SLA/SLO: health logs for uptime, error count, latency ───
export async function fetchSLAMetrics() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 86400000).toISOString();
  const last7d = new Date(now.getTime() - 7 * 86400000).toISOString();

  // Uptime from health logs (% of "healthy" checks in 7d)
  const { data: healthLogs } = await supabase
    .from("system_health_logs")
    .select("id, status")
    .gte("recorded_at", last7d);

  const total = healthLogs?.length ?? 0;
  const healthy = healthLogs?.filter((l) => l.status === "healthy").length ?? 0;
  const uptime = total > 0 ? Math.round((healthy / total) * 10000) / 100 : 99.9;

  // Errors/day (last 24h)
  const { count: errorsToday } = await supabase
    .from("client_error_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", last24h);

  // Latency P95 from performance_logs
  const { data: perfLogs } = await supabase
    .from("performance_logs")
    .select("duration_ms")
    .gte("created_at", last7d)
    .order("duration_ms", { ascending: false })
    .limit(500);

  let p95 = 0;
  if (perfLogs && perfLogs.length > 0) {
    const idx = Math.floor(perfLogs.length * 0.05);
    p95 = perfLogs[idx]?.duration_ms ?? 0;
  }

  return { uptime, errorsToday: errorsToday ?? 0, p95Latency: p95 };
}

// ─── AI Cost from blog_generation_logs ───
export async function fetchAICosts(days: number = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from("blog_generation_logs")
    .select("id, total_cost_usd, text_cost_usd, image_cost_usd, created_at, model_used, status")
    .gte("created_at", since)
    .order("created_at");

  if (!data) return { daily: [], total: 0, textTotal: 0, imageTotal: 0 };

  const dailyMap = new Map<string, number>();
  let total = 0, textTotal = 0, imageTotal = 0;

  for (const r of data) {
    const cost = r.total_cost_usd ?? 0;
    total += cost;
    textTotal += r.text_cost_usd ?? 0;
    imageTotal += r.image_cost_usd ?? 0;
    const day = new Date(r.created_at).toLocaleDateString("pt-BR");
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + cost);
  }

  const daily = Array.from(dailyMap.entries()).map(([date, cost]) => ({ date, cost: Math.round(cost * 100) / 100 }));
  return { daily, total: Math.round(total * 100) / 100, textTotal: Math.round(textTotal * 100) / 100, imageTotal: Math.round(imageTotal * 100) / 100 };
}

// ─── Delivery Status from notifications ───
export async function fetchDeliveryStatus() {
  const last24h = new Date(Date.now() - 86400000).toISOString();
  const { data } = await supabase
    .from("notifications")
    .select("id, is_global, created_at")
    .gte("created_at", last24h);

  const { count: readCount } = await supabase
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", true)
    .gte("created_at", last24h);

  const { count: totalDelivered } = await supabase
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .gte("created_at", last24h);

  return {
    sent: data?.length ?? 0,
    delivered: totalDelivered ?? 0,
    read: readCount ?? 0,
    deliveryRate: (totalDelivered ?? 0) > 0 ? Math.round(((readCount ?? 0) / (totalDelivered ?? 1)) * 100) : 0,
  };
}

// ─── Recent Errors with spike detection ───
export async function fetchRecentErrors() {
  const last24h = new Date(Date.now() - 86400000).toISOString();
  const { data } = await supabase
    .from("client_error_logs")
    .select("id, error_message, component_name, created_at")
    .gte("created_at", last24h)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!data) return { errors: [], hourly: [], hasSpike: false };

  // Group by hour
  const hourlyMap = new Map<string, number>();
  for (const e of data) {
    const hour = new Date(e.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: undefined });
    hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + 1);
  }
  const hourly = Array.from(hourlyMap.entries()).map(([hour, count]) => ({ hour, count })).reverse();

  // Spike detection: >10 errors in any single hour
  const hasSpike = hourly.some((h) => h.count > 10);

  // Group by type
  const typeMap = new Map<string, number>();
  for (const e of data) {
    const key = e.error_message.slice(0, 80);
    typeMap.set(key, (typeMap.get(key) ?? 0) + 1);
  }
  const errors = Array.from(typeMap.entries())
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { errors, hourly, hasSpike };
}

// ─── Performance Metrics (P95/P99) ───
export async function fetchPerformanceMetrics() {
  const last7d = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data } = await supabase
    .from("performance_logs")
    .select("operation_name, operation_type, duration_ms")
    .gte("created_at", last7d)
    .order("duration_ms", { ascending: false })
    .limit(500);

  if (!data || data.length === 0) return { byType: [], slowest: [] };

  // By type
  const typeMap = new Map<string, number[]>();
  for (const l of data) {
    const arr = typeMap.get(l.operation_type) ?? [];
    arr.push(l.duration_ms);
    typeMap.set(l.operation_type, arr);
  }

  const byType = Array.from(typeMap.entries()).map(([type, durations]) => {
    durations.sort((a, b) => a - b);
    const p95 = durations[Math.floor(durations.length * 0.95)] ?? 0;
    const p99 = durations[Math.floor(durations.length * 0.99)] ?? 0;
    return { type, p95, p99, count: durations.length };
  });

  // Slowest operations
  const slowest = data.slice(0, 5).map((l) => ({
    operation: l.operation_name,
    type: l.operation_type,
    duration: l.duration_ms,
  }));

  return { byType, slowest };
}
