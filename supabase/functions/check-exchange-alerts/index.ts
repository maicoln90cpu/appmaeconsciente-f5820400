import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (_req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar todas as configurações de usuários
    const { data: configs, error: configError } = await supabase
      .from("config")
      .select("user_id, dias_alerta_troca");

    if (configError) throw configError;

    console.log(`Verificando alertas de troca para ${configs?.length || 0} usuários`);

    for (const config of configs || []) {
      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", config.user_id)
        .single();

      if (!profile?.email) continue;

      // Calcular data limite baseado nos dias de alerta
      const today = new Date();
      const alertDate = new Date();
      alertDate.setDate(today.getDate() + config.dias_alerta_troca);

      // Buscar itens com data de troca próxima
      const { data: items } = await supabase
        .from("itens_enxoval")
        .select("item, loja, data_limite_troca")
        .eq("user_id", config.user_id)
        .eq("status", "Comprado")
        .not("data_limite_troca", "is", null)
        .lte("data_limite_troca", alertDate.toISOString().split('T')[0])
        .gte("data_limite_troca", today.toISOString().split('T')[0]);

      if (!items || items.length === 0) continue;

      console.log(`Enviando alerta para ${profile.email} - ${items.length} itens próximos da data de troca`);

      // Enviar email de alerta
      await supabase.functions.invoke("send-resend-email", {
        body: {
          to: profile.email,
          subject: "⏰ Alerta: Itens próximos da data de troca!",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">Alerta de Data de Troca</h2>
              <p>Olá!</p>
              <p>Os seguintes itens do seu enxoval estão próximos da data limite de troca:</p>
              <ul>
                ${items.map(item => `
                  <li>
                    <strong>${item.item}</strong>
                    ${item.loja ? ` - ${item.loja}` : ''}
                    <br>
                    <small>Data limite: ${new Date(item.data_limite_troca).toLocaleDateString('pt-BR')}</small>
                  </li>
                `).join('')}
              </ul>
              <p>Não esqueça de verificar se precisa fazer alguma troca!</p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                Este é um lembrete automático do seu Controle de Enxoval.
              </p>
            </div>
          `,
        },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Alertas verificados para ${configs?.length || 0} usuários` 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error("Erro ao verificar alertas:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});