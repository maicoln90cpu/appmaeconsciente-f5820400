import { supabase } from '@/integrations/supabase/client';

// ─── Health Status ───
export async function fetchHealthStatus() {
  const { data, error } = await supabase
    .from('system_health_status')
    .select(
      'id, module_name, status, score, metrics, issues, recommendations, checked_at, updated_at'
    )
    .order('module_name');
  if (error) throw error;
  return data ?? [];
}

// ─── Health Logs (Trends) ───
export async function fetchHealthLogs(days: number = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from('system_health_logs')
    .select('id, module_name, score, status, recorded_at')
    .gte('recorded_at', since)
    .order('recorded_at');
  if (error) throw error;
  return data ?? [];
}

// ─── Client Error Logs ───
export async function fetchClientErrors(days: number = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from('client_error_logs')
    .select('id, component_name, error_message, stack_trace, url, user_id, metadata, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

// ─── Performance Logs ───
export async function fetchPerformanceLogs(days: number = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from('performance_logs')
    .select('id, operation_name, operation_type, duration_ms, is_slow, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

// ─── Feature Usage Logs ───
export async function fetchFeatureUsage(days: number = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from('feature_usage_logs')
    .select('id, feature_name, user_id, metadata, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return data ?? [];
}

// ─── Audit Log ───
export async function fetchAuditLog(days: number = 30) {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select(
      'id, admin_id, action, entity_type, entity_id, old_values, new_values, metadata, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

// ─── Cron Job Logs ───
export async function fetchCronJobLogs(days: number = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from('cron_job_logs')
    .select(
      'id, job_name, schedule, status, duration_ms, error_message, executed_at, metadata, created_at'
    )
    .gte('created_at', since)
    .order('executed_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

// ─── Helpers ───
export function groupErrorsByComponent(errors: Awaited<ReturnType<typeof fetchClientErrors>>) {
  const map = new Map<
    string,
    { component: string; message: string; count: number; lastOccurrence: string }
  >();
  for (const e of errors) {
    const key = `${e.component_name ?? 'unknown'}::${e.error_message}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      if (e.created_at > existing.lastOccurrence) existing.lastOccurrence = e.created_at;
    } else {
      map.set(key, {
        component: e.component_name ?? 'Desconhecido',
        message: e.error_message,
        count: 1,
        lastOccurrence: e.created_at,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function aggregatePerformance(logs: Awaited<ReturnType<typeof fetchPerformanceLogs>>) {
  const map = new Map<string, { operation: string; type: string; durations: number[] }>();
  for (const l of logs) {
    const key = `${l.operation_name}::${l.operation_type}`;
    const existing = map.get(key);
    if (existing) {
      existing.durations.push(l.duration_ms);
    } else {
      map.set(key, {
        operation: l.operation_name,
        type: l.operation_type,
        durations: [l.duration_ms],
      });
    }
  }
  return Array.from(map.values())
    .map(v => {
      const sorted = v.durations.sort((a, b) => a - b);
      const avg = Math.round(sorted.reduce((s, d) => s + d, 0) / sorted.length);
      const max = sorted[sorted.length - 1];
      return { operation: v.operation, type: v.type, avg, max, count: sorted.length };
    })
    .sort((a, b) => b.avg - a.avg);
}

export function aggregateFeatureUsage(logs: Awaited<ReturnType<typeof fetchFeatureUsage>>) {
  const map = new Map<string, number>();
  for (const l of logs) {
    map.set(l.feature_name, (map.get(l.feature_name) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function aggregateCronJobs(logs: Awaited<ReturnType<typeof fetchCronJobLogs>>) {
  const map = new Map<
    string,
    {
      job: string;
      schedule: string;
      runs: number;
      successes: number;
      totalDuration: number;
      lastRun: string;
      lastStatus: string;
    }
  >();
  for (const l of logs) {
    const existing = map.get(l.job_name);
    if (existing) {
      existing.runs++;
      if (l.status === 'success') existing.successes++;
      existing.totalDuration += l.duration_ms ?? 0;
      if (l.executed_at > existing.lastRun) {
        existing.lastRun = l.executed_at;
        existing.lastStatus = l.status;
      }
    } else {
      map.set(l.job_name, {
        job: l.job_name,
        schedule: l.schedule ?? '—',
        runs: 1,
        successes: l.status === 'success' ? 1 : 0,
        totalDuration: l.duration_ms ?? 0,
        lastRun: l.executed_at,
        lastStatus: l.status,
      });
    }
  }
  return Array.from(map.values()).map(v => ({
    ...v,
    avgDuration: v.runs > 0 ? Math.round(v.totalDuration / v.runs) : 0,
    successRate: v.runs > 0 ? Math.round((v.successes / v.runs) * 100) : 0,
  }));
}

export function exportAuditLogCSV(data: Awaited<ReturnType<typeof fetchAuditLog>>) {
  const BOM = '\uFEFF';
  const header = 'Data/Hora,Admin ID,Ação,Tipo Entidade,ID Entidade,Detalhes\n';
  const rows = data
    .map(r => {
      const date = new Date(r.created_at).toLocaleString('pt-BR');
      const details = r.metadata ? JSON.stringify(r.metadata) : '';
      return `"${date}","${r.admin_id}","${r.action}","${r.entity_type ?? ''}","${r.entity_id ?? ''}","${details.replace(/"/g, '""')}"`;
    })
    .join('\n');
  const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
