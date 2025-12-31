import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

// Tabelas com dados do usuário para exportar
const USER_DATA_TABLES = [
  { name: 'profiles', label: 'Perfil' },
  { name: 'baby_feeding_logs', label: 'Registros de Amamentação' },
  { name: 'baby_milestone_records', label: 'Marcos de Desenvolvimento' },
  { name: 'baby_sleep_logs', label: 'Registros de Sono' },
  { name: 'baby_vaccination_profiles', label: 'Perfis de Vacinação' },
  { name: 'baby_vaccinations', label: 'Vacinas Aplicadas' },
  { name: 'body_image_log', label: 'Diário de Autoestima' },
  { name: 'breast_milk_storage', label: 'Estoque de Leite' },
  { name: 'config', label: 'Configurações' },
  { name: 'emotional_logs', label: 'Registros Emocionais' },
  { name: 'itens_enxoval', label: 'Itens do Enxoval' },
  { name: 'maternity_bag_items', label: 'Itens da Mala de Maternidade' },
  { name: 'meal_plans', label: 'Planos de Refeição' },
  { name: 'medication_logs', label: 'Registros de Medicamentos' },
  { name: 'notifications', label: 'Notificações' },
  { name: 'nutrition_chat_conversations', label: 'Conversas de Nutrição' },
  { name: 'nutrition_chat_messages', label: 'Mensagens de Nutrição' },
  { name: 'post_comments', label: 'Comentários' },
  { name: 'posts', label: 'Publicações' },
  { name: 'postpartum_achievements', label: 'Conquistas Pós-Parto' },
  { name: 'postpartum_appointments', label: 'Consultas Pós-Parto' },
  { name: 'postpartum_medications', label: 'Medicamentos Pós-Parto' },
  { name: 'postpartum_symptoms', label: 'Sintomas Pós-Parto' },
  { name: 'recipes', label: 'Receitas Salvas' },
  { name: 'recovery_checklist', label: 'Checklist de Recuperação' },
  { name: 'supplement_logs', label: 'Suplementos' },
  { name: 'support_tickets', label: 'Tickets de Suporte' },
  { name: 'user_achievements', label: 'Conquistas' },
  { name: 'user_consents', label: 'Consentimentos' },
  { name: 'user_exercise_logs', label: 'Exercícios' },
  { name: 'user_favorites', label: 'Favoritos' },
  { name: 'user_food_restrictions', label: 'Restrições Alimentares' },
  { name: 'user_supplements', label: 'Suplementos Ativos' },
  { name: 'water_intake', label: 'Consumo de Água' },
  { name: 'weight_tracking', label: 'Acompanhamento de Peso' }
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

    console.log(`Exportando dados para usuário: ${user.id}`);

    const exportData: Record<string, any> = {
      _meta: {
        exportDate: new Date().toISOString(),
        userId: user.id,
        email: user.email,
        format: 'LGPD/GDPR Data Export',
        version: '1.0'
      }
    };

    // Buscar dados de cada tabela
    for (const table of USER_DATA_TABLES) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table.name)
          .select('*')
          .eq('user_id', user.id);

        if (!error && data && data.length > 0) {
          exportData[table.label] = data;
          console.log(`Exportando ${data.length} registros de ${table.name}`);
        }
      } catch (err) {
        console.log(`Tabela ${table.name} não encontrada ou sem dados:`, err);
      }
    }

    // Buscar dados do profile por ID (não user_id)
    try {
      const { data: profileData, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && profileData) {
        exportData['Perfil'] = profileData;
      }
    } catch (err) {
      console.log("Erro ao buscar profile:", err);
    }

    // Registrar o consentimento de exportação
    await supabaseAdmin
      .from('user_consents')
      .insert({
        user_id: user.id,
        consent_type: 'data_export',
        consent_version: '1.0',
        accepted: true,
        accepted_at: new Date().toISOString()
      });

    console.log(`Exportação completa para usuário: ${user.id}`);

    return new Response(
      JSON.stringify(exportData, null, 2),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="meus-dados-${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    );
  } catch (error) {
    console.error("Erro na exportação de dados:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
