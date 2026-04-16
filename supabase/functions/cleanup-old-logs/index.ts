import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

/**
 * Edge function para limpeza de logs antigos
 * Deve ser executada periodicamente (cron job)
 * Mantém logs normais por 90 dias e críticos por 365 dias
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar se é admin (opcional - pode ser chamado por cron)
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);

      if (user) {
        const { data: roles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        const isAdmin = roles?.some((r) => r.role === "admin");

        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Apenas administradores podem executar limpeza" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    console.log("Iniciando limpeza de logs antigos...");

    const stats = {
      accessLogsDeleted: 0,
      securityLogsDeleted: 0,
      criticalLogsDeleted: 0,
      consentsLogsDeleted: 0,
    };

    // Limpar logs de acesso > 90 dias
    const { error: accessError } = await supabaseAdmin
      .from('user_access_logs')
      .delete()
      .lt('accessed_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
    
    if (!accessError) {
      console.log("Logs de acesso antigos removidos");
    }

    // Limpar logs de segurança não-críticos > 90 dias
    const { error: securityError } = await supabaseAdmin
      .from('security_audit_logs')
      .delete()
      .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .neq('severity', 'critical');
    
    if (!securityError) {
      console.log("Logs de segurança não-críticos antigos removidos");
    }

    // Limpar logs críticos > 365 dias
    const { error: criticalError } = await supabaseAdmin
      .from('security_audit_logs')
      .delete()
      .lt('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .eq('severity', 'critical');
    
    if (!criticalError) {
      console.log("Logs críticos antigos removidos");
    }

    // Log da limpeza
    await supabaseAdmin.from('security_audit_logs').insert({
      event_type: 'log_cleanup',
      event_description: `Limpeza de logs executada: ${JSON.stringify(stats)}`,
      metadata: stats,
      severity: 'info'
    });

    console.log("Limpeza concluída:", stats);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Limpeza de logs concluída",
        stats 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na limpeza de logs:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
