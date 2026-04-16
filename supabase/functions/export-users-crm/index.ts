import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { handleCorsOptions, getCorsHeaders } from "../_shared/cors.ts";
import {
  withErrorHandling,
  logEvent,
} from "../_shared/error-handler.ts";

serve(withErrorHandling(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  logEvent('info', 'export-users-crm-start');

  // Fetch all users with their profiles and access
  const { data: profiles, error: profilesError } = await supabaseClient
    .from("profiles")
    .select(`
      *,
      user_roles!inner(role),
      user_product_access(
        product_id,
        granted_at,
        expires_at,
        products(title)
      )
    `);

  if (profilesError) {
    logEvent('error', 'profiles-fetch-failed', { error: profilesError.message });
    throw new Error(profilesError.message);
  }

  // Format data for CRM export
  const crmData = profiles.map((profile: any) => ({
    id: profile.id,
    email: profile.email,
    nome: `${profile.email.split("@")[0]}`,
    idade: profile.idade,
    cidade: profile.cidade,
    estado: profile.estado,
    perfil_completo: profile.perfil_completo,
    data_cadastro: profile.created_at,
    possui_filhos: profile.possui_filhos,
    meses_gestacao: profile.meses_gestacao,
    data_prevista_parto: profile.data_prevista_parto,
    produtos_ativos: profile.user_product_access
      ?.filter((access: any) => 
        !access.expires_at || new Date(access.expires_at) > new Date()
      )
      .map((access: any) => access.products?.title)
      .join(", ") || "Nenhum",
    tags: profile.user_roles?.map((r: any) => r.role).join(", ") || "user",
  }));

  // Convert to CSV
  const headers = Object.keys(crmData[0] || {});
  const csv = [
    headers.join(","),
    ...crmData.map((row: any) =>
      headers.map((header) => {
        const value = row[header];
        // Escape values that contain commas or quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? "";
      }).join(",")
    ),
  ].join("\n");

  logEvent('info', 'export-users-crm-complete', { 
    userCount: crmData.length 
  });

  return new Response(csv, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="usuarios_crm_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}));
