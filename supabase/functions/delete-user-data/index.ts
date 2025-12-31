import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

// Lista de todas as tabelas com dados do usuário
const USER_DATA_TABLES = [
  'baby_feeding_logs',
  'baby_milestone_records',
  'baby_sleep_logs',
  'baby_sleep_milestones',
  'baby_sleep_settings',
  'baby_vaccination_profiles',
  'baby_vaccinations',
  'blocked_users',
  'body_image_log',
  'breast_milk_storage',
  'config',
  'daily_wellness_score',
  'development_alert_settings',
  'emotional_logs',
  'feeding_settings',
  'itens_enxoval',
  'maternity_bag_items',
  'maternity_bag_shared_access',
  'meal_plans',
  'medication_logs',
  'notifications',
  'nutrition_chat_conversations',
  'nutrition_chat_messages',
  'post_comments',
  'post_likes',
  'post_reports',
  'postpartum_achievements',
  'postpartum_appointments',
  'postpartum_medications',
  'postpartum_symptoms',
  'posts',
  'recipes',
  'recovery_checklist',
  'shared_enxoval_links',
  'supplement_logs',
  'support_tickets',
  'ticket_messages',
  'tool_suggestions',
  'user_access_logs',
  'user_achievements',
  'user_challenges',
  'user_consents',
  'user_exercise_logs',
  'user_favorites',
  'user_follows',
  'user_food_restrictions',
  'user_notifications',
  'user_product_access',
  'user_roles',
  'user_streaks',
  'user_supplements',
  'vaccination_reminder_settings',
  'water_goals',
  'water_intake',
  'weight_tracking',
  'profiles' // Profiles por último
];

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

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { confirmEmail } = await req.json();

    // Verificar se o email de confirmação corresponde
    if (confirmEmail !== user.email) {
      return new Response(
        JSON.stringify({ error: "Email de confirmação não corresponde" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Iniciando exclusão de dados para usuário: ${user.id}`);

    const deletedTables: string[] = [];
    const errors: string[] = [];

    // Criar log de exclusão
    await supabaseAdmin
      .from('data_deletion_logs')
      .insert({
        user_id: user.id,
        user_email: user.email,
        status: 'in_progress'
      });

    // Excluir dados de cada tabela
    for (const table of USER_DATA_TABLES) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq('user_id', user.id);

        if (error) {
          console.log(`Erro ou tabela sem dados para ${table}:`, error.message);
        } else {
          deletedTables.push(table);
          console.log(`Dados excluídos da tabela: ${table}`);
        }
      } catch (err) {
        console.log(`Tabela ${table} pode não existir ou não ter user_id:`, err);
      }
    }

    // Excluir arquivos do storage (fotos de perfil)
    try {
      const { data: files } = await supabaseAdmin.storage
        .from('profile-photos')
        .list(user.id);

      if (files && files.length > 0) {
        const filePaths = files.map(f => `${user.id}/${f.name}`);
        await supabaseAdmin.storage
          .from('profile-photos')
          .remove(filePaths);
        console.log(`Arquivos de storage excluídos: ${filePaths.length}`);
      }
    } catch (err) {
      console.log("Erro ao excluir arquivos do storage:", err);
    }

    // Excluir o usuário da autenticação
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      console.error("Erro ao excluir usuário da autenticação:", deleteAuthError);
      
      // Atualizar log de exclusão com erro
      await supabaseAdmin
        .from('data_deletion_logs')
        .update({
          status: 'failed',
          error_message: deleteAuthError.message,
          tables_deleted: deletedTables
        })
        .eq('user_id', user.id)
        .eq('status', 'in_progress');

      return new Response(
        JSON.stringify({ error: "Erro ao excluir conta. Contate o suporte." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualizar log de exclusão como completo
    await supabaseAdmin
      .from('data_deletion_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        tables_deleted: deletedTables
      })
      .eq('user_id', user.id)
      .eq('status', 'in_progress');

    console.log(`Exclusão completa para usuário: ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Conta e todos os dados excluídos com sucesso",
        tablesDeleted: deletedTables.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na exclusão de dados:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
