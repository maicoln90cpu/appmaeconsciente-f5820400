import { supabase } from "@/integrations/supabase/client";

// ─── Database Stats via Edge Function ───
export async function fetchDatabaseStats() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/system-health-check`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch database stats:", error);
    return null;
  }
}

// ─── Hardcoded Table Descriptions (friendly names) ───
export const TABLE_DESCRIPTIONS: Record<string, string> = {
  profiles: "Perfis de usuários cadastrados",
  posts: "Publicações da comunidade",
  comments: "Comentários nas publicações",
  post_likes: "Curtidas nas publicações",
  products: "Produtos e planos disponíveis",
  user_product_access: "Acessos de usuários a produtos",
  baby_feeding_logs: "Registros de mamadas do bebê",
  baby_sleep_logs: "Registros de sono do bebê",
  baby_vaccination_profiles: "Perfis de vacinação dos bebês",
  baby_vaccinations: "Vacinas aplicadas",
  baby_routine_logs: "Registros de rotina do bebê",
  baby_routines: "Rotinas cadastradas",
  baby_stimulation_activities: "Atividades de estimulação",
  baby_milestone_records: "Marcos de desenvolvimento",
  baby_first_times: "Álbum de primeiras vezes",
  baby_teeth_logs: "Registro de dentição",
  baby_colic_logs: "Registro de cólicas",
  baby_allergy_logs: "Registro de alergias alimentares",
  baby_medications: "Medicamentos cadastrados",
  baby_medication_logs: "Logs de administração de medicamentos",
  baby_appointments: "Consultas agendadas",
  baby_timeline_events: "Eventos na timeline do bebê",
  baby_achievements: "Conquistas do bebê",
  baby_documents_checklist: "Checklist de documentos do bebê",
  baby_room_checklist: "Checklist do quartinho",
  baby_sleep_settings: "Configurações do monitor de sono",
  baby_sleep_milestones: "Marcos de sono por faixa etária",
  blog_posts: "Posts do blog (SEO)",
  blog_settings: "Configurações do blog",
  blog_generation_logs: "Logs de geração automática do blog",
  blog_image_prompts: "Estilos de imagem do blog",
  notifications: "Notificações enviadas",
  user_notifications: "Notificações por usuário",
  itens_enxoval: "Itens do enxoval do bebê",
  config: "Configurações do usuário",
  limites_rn: "Limites de roupas recém-nascido",
  birth_plans: "Plano de parto",
  contraction_logs: "Registro de contrações",
  breast_milk_storage: "Estoque de leite materno",
  body_image_log: "Diário da imagem corporal",
  daily_wellness_score: "Score de bem-estar diário",
  user_roles: "Papéis de usuários (admin/user)",
  site_settings: "Configurações gerais do site",
  security_audit_logs: "Logs de auditoria de segurança",
  user_access_logs: "Logs de acesso de usuários",
  system_health_status: "Status de saúde do sistema",
  system_health_logs: "Histórico de saúde do sistema",
  client_error_logs: "Erros capturados no frontend",
  performance_logs: "Logs de performance de operações",
  feature_usage_logs: "Uso de funcionalidades",
  admin_audit_log: "Log de atividades administrativas",
  cron_job_logs: "Logs de tarefas agendadas",
  blocked_users: "Usuários bloqueados",
  badges: "Badges do sistema de gamificação",
  challenges: "Desafios de gamificação",
  daily_activity: "Atividade diária dos usuários",
  coupons: "Cupons de desconto",
  coupon_usage: "Uso de cupons",
  ai_engagement_logs: "Logs de engajamento automático IA",
  data_deletion_logs: "Logs de exclusão de dados (LGPD)",
};

// ─── Hardcoded Triggers Catalog ───
export const TRIGGERS_CATALOG = [
  { table: "profiles", name: "update_profiles_updated_at", event: "BEFORE UPDATE", fn: "update_updated_at_column", description: "Atualiza automaticamente o campo updated_at ao editar perfil" },
  { table: "posts", name: "check_post_rate_limit_trigger", event: "BEFORE INSERT", fn: "check_post_rate_limit", description: "Limita 1 post por minuto para evitar spam" },
  { table: "baby_feeding_logs", name: "check_feeding_rate_limit_trigger", event: "BEFORE INSERT", fn: "check_feeding_rate_limit", description: "Limita 1 registro a cada 10 segundos" },
  { table: "baby_sleep_logs", name: "check_sleep_rate_limit_trigger", event: "BEFORE INSERT", fn: "check_sleep_rate_limit", description: "Limita 1 registro a cada 10 segundos" },
  { table: "coupon_usage", name: "increment_coupon_usage_trigger", event: "AFTER INSERT", fn: "increment_coupon_usage", description: "Incrementa contador de uso do cupom" },
  { table: "notifications", name: "create_user_notifications_trigger", event: "AFTER INSERT", fn: "create_user_notifications", description: "Distribui notificação global para todos os usuários" },
  { table: "auth.users", name: "handle_new_user_profile_trigger", event: "AFTER INSERT", fn: "handle_new_user_profile", description: "Cria perfil + role + trial ao registrar usuário" },
  { table: "auth.users", name: "assign_admin_role_trigger", event: "AFTER INSERT", fn: "assign_admin_role_for_specific_email", description: "Atribui role admin para email específico" },
];

// ─── Hardcoded Cron Jobs Catalog ───
export const CRON_JOBS_CATALOG = [
  { name: "auto-engage-community", frequency: "Configurável (2x-8x/dia)", description: "Engajamento automático da comunidade com posts e comentários de usuários virtuais", status: "ativo" },
  { name: "auto-generate-blog-post", frequency: "Configurável (1x-3x/dia)", description: "Geração automática de posts para o blog usando IA", status: "ativo" },
  { name: "cleanup-old-logs", frequency: "Diário", description: "Limpeza de logs de acesso e segurança antigos (>90 dias)", status: "ativo" },
  { name: "cleanup-monitoring-logs", frequency: "Diário", description: "Limpeza de logs de monitoramento (erros 90d, performance 30d, audit 365d)", status: "ativo" },
  { name: "refresh-leaderboard", frequency: "A cada 6 horas", description: "Recalcula o ranking de gamificação com XP semanal", status: "ativo" },
];

// ─── Hardcoded Edge Functions Catalog ───
export const EDGE_FUNCTIONS_CATALOG = [
  { name: "auto-engage-community", category: "Comunidade", trigger: "pg_cron", description: "Gera posts e comentários automáticos com usuários virtuais" },
  { name: "generate-comment", category: "Comunidade", trigger: "HTTP POST", description: "Gera comentário de IA para um post específico" },
  { name: "moderate-post", category: "Comunidade", trigger: "HTTP POST", description: "Modera conteúdo de posts com IA" },
  { name: "seed-community", category: "Comunidade", trigger: "HTTP POST", description: "Popula a comunidade com posts iniciais" },
  { name: "generate-blog-post", category: "Blog", trigger: "pg_cron / HTTP", description: "Gera post completo do blog com IA (texto + imagem + SEO)" },
  { name: "track-blog-view", category: "Blog", trigger: "HTTP POST", description: "Rastreia visualizações do blog filtrando bots" },
  { name: "sitemap-xml", category: "Blog/SEO", trigger: "HTTP GET", description: "Gera sitemap XML dinâmico para o blog" },
  { name: "nutrition-chat", category: "Chatbot", trigger: "HTTP POST", description: "Chat de nutrição infantil com IA" },
  { name: "generate-nutrition-plan", category: "Nutrição", trigger: "HTTP POST", description: "Gera plano nutricional personalizado" },
  { name: "generate-meal-plan", category: "Nutrição", trigger: "HTTP POST", description: "Gera cardápio semanal personalizado" },
  { name: "generate-recipes", category: "Nutrição", trigger: "HTTP POST", description: "Gera receitas baseadas em ingredientes" },
  { name: "generate-exercises", category: "Saúde", trigger: "HTTP POST", description: "Gera plano de exercícios pós-parto" },
  { name: "check-development-alerts", category: "Bebê", trigger: "HTTP POST", description: "Verifica alertas de desenvolvimento do bebê" },
  { name: "generate-avatar", category: "Perfil", trigger: "HTTP POST", description: "Gera avatar com IA para perfil" },
  { name: "hotmart-webhook", category: "Pagamentos", trigger: "Webhook", description: "Processa webhooks da Hotmart (compras, cancelamentos)" },
  { name: "grant-trial-access", category: "Pagamentos", trigger: "HTTP POST", description: "Concede acesso trial a produtos" },
  { name: "resend-purchase-credentials", category: "Pagamentos", trigger: "HTTP POST", description: "Reenvia credenciais de compra por email" },
  { name: "apply-promotion", category: "Comercial", trigger: "HTTP POST", description: "Aplica promoções e descontos" },
  { name: "send-resend-email", category: "Notificações", trigger: "HTTP POST", description: "Envia emails transacionais via Resend" },
  { name: "send-weekly-recovery-email", category: "Notificações", trigger: "HTTP POST", description: "Envia email semanal de recuperação" },
  { name: "notify-ticket-created", category: "Suporte", trigger: "HTTP POST", description: "Notifica sobre novo ticket de suporte" },
  { name: "check-exchange-alerts", category: "Enxoval", trigger: "HTTP POST", description: "Verifica alertas de troca de tamanho" },
  { name: "create-user-admin", category: "Admin", trigger: "HTTP POST", description: "Cria usuário via painel admin" },
  { name: "delete-user-admin", category: "Admin", trigger: "HTTP POST", description: "Exclui usuário via painel admin" },
  { name: "delete-user-data", category: "LGPD", trigger: "HTTP POST", description: "Exclui todos os dados do usuário (LGPD)" },
  { name: "export-user-data", category: "LGPD", trigger: "HTTP POST", description: "Exporta dados do usuário (LGPD)" },
  { name: "export-users-crm", category: "Admin", trigger: "HTTP POST", description: "Exporta lista de usuários para CRM" },
  { name: "cleanup-old-logs", category: "Manutenção", trigger: "pg_cron", description: "Limpa logs antigos do sistema" },
  { name: "configure-auth-security", category: "Segurança", trigger: "HTTP POST", description: "Configura políticas de segurança de autenticação" },
  { name: "system-health-check", category: "Monitoramento", trigger: "HTTP POST", description: "Retorna estatísticas do banco de dados para o painel admin" },
];
