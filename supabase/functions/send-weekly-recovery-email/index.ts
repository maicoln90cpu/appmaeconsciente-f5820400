import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar todas as usuárias que têm dados de recuperação pós-parto
    const { data: users, error: usersError } = await supabaseClient
      .from("profiles")
      .select("id, email, delivery_date, delivery_type")
      .not("delivery_date", "is", null);

    if (usersError) throw usersError;

    const emailsSent = [];

    for (const user of users || []) {
      // Calcular semana pós-parto
      const deliveryDate = new Date(user.delivery_date);
      const today = new Date();
      const daysSinceDelivery = Math.floor((today.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekPostpartum = Math.floor(daysSinceDelivery / 7) + 1;

      // Enviar apenas para mães nas primeiras 12 semanas
      if (weekPostpartum > 12) continue;

      // Buscar dados da semana
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      // Sintomas da semana
      const { data: symptoms } = await supabaseClient
        .from("postpartum_symptoms")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", sevenDaysAgo)
        .lte("date", todayStr);

      // Adesão a medicamentos
      const { data: medications } = await supabaseClient
        .from("postpartum_medications")
        .select("*, medication_logs(*)")
        .eq("user_id", user.id)
        .eq("is_active", true);

      // Conquistas desbloqueadas esta semana
      const { data: achievements } = await supabaseClient
        .from("postpartum_achievements")
        .select("*")
        .eq("user_id", user.id)
        .gte("unlocked_at", sevenDaysAgo);

      // Score de bem-estar
      const { data: wellnessScores } = await supabaseClient
        .from("daily_wellness_score")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", sevenDaysAgo)
        .lte("date", todayStr);

      const avgScore = wellnessScores?.length 
        ? Math.round(wellnessScores.reduce((sum, s) => sum + s.total_score, 0) / wellnessScores.length)
        : 0;

      const goodDaysCount = wellnessScores?.filter(s => s.is_good_day).length || 0;

      // Montar HTML do email
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%); padding: 30px; text-align: center; border-radius: 10px; }
            .content { padding: 20px; background: #fff; }
            .stat-card { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #e91e63; }
            .achievement { background: #fff9c4; padding: 10px; margin: 8px 0; border-radius: 6px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: #e91e63; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #e91e63;">💕 Resumo Semanal da Sua Recuperação</h1>
              <p style="margin: 10px 0 0; color: #666;">Semana ${weekPostpartum} pós-parto</p>
            </div>
            
            <div class="content">
              <h2>Olá, mamãe! 🌸</h2>
              <p>Aqui está o resumo da sua semana de recuperação (${new Date(sevenDaysAgo).toLocaleDateString('pt-BR')} a ${new Date(todayStr).toLocaleDateString('pt-BR')}):</p>
              
              <div class="stat-card">
                <h3 style="margin-top: 0;">📊 Score de Bem-Estar</h3>
                <p style="font-size: 24px; margin: 5px 0;"><strong>${avgScore}/100</strong></p>
                <p style="margin: 0;">Você teve ${goodDaysCount} ${goodDaysCount === 1 ? 'dia bom' : 'dias bons'} esta semana! 🌟</p>
              </div>

              ${symptoms && symptoms.length > 0 ? `
                <div class="stat-card">
                  <h3 style="margin-top: 0;">🩺 Sintomas Registrados</h3>
                  <p>${symptoms.length} ${symptoms.length === 1 ? 'registro' : 'registros'} de sintomas</p>
                  <p style="font-size: 13px; color: #666;">Continue monitorando sua recuperação física 💪</p>
                </div>
              ` : ''}

              ${medications && medications.length > 0 ? `
                <div class="stat-card">
                  <h3 style="margin-top: 0;">💊 Medicamentos</h3>
                  <p>${medications.length} medicamento(s) ativo(s)</p>
                  <p style="font-size: 13px; color: #666;">Lembre-se de seguir as orientações médicas</p>
                </div>
              ` : ''}

              ${achievements && achievements.length > 0 ? `
                <h3>🏆 Conquistas Desbloqueadas!</h3>
                ${achievements.map(a => `
                  <div class="achievement">
                    <strong>${a.achievement_name}</strong><br>
                    <span style="font-size: 13px; color: #666;">${a.achievement_description}</span>
                  </div>
                `).join('')}
              ` : ''}

              <h3>💙 Mensagem de Acolhimento</h3>
              <p style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                ${weekPostpartum <= 2 
                  ? "Você está nas primeiras semanas — seja gentil consigo mesma. Descanso é recuperação 💕"
                  : weekPostpartum <= 6
                  ? "Seu corpo está se curando — cada dia é um passo de amor próprio. Continue assim! 🌸"
                  : "Você já percorreu um longo caminho! Celebre cada conquista, por menor que pareça ✨"
                }
              </p>

              <center>
                <a href="${Deno.env.get("SUPABASE_URL")?.replace("https://", "https://tiyumtsvuqxolxngdfhz.")}/materiais/recuperacao-pos-parto" class="button">
                  Ver Meu Dashboard Completo
                </a>
              </center>
            </div>

            <div class="footer">
              <p>Você está recebendo este email porque está usando o Guia de Recuperação Pós-Parto.</p>
              <p>Mãe Consciente — Sua jornada de maternidade</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Enviar email via edge function de email
      const { error: emailError } = await supabaseClient.functions.invoke("send-resend-email", {
        body: {
          to: user.email,
          subject: `💕 Semana ${weekPostpartum}: Resumo da Sua Recuperação`,
          html: emailHtml,
        },
      });

      if (!emailError) {
        emailsSent.push(user.email);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailsSent.length,
        users: emailsSent 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
