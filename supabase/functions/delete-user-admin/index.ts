import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { handleCorsOptions } from "../_shared/cors.ts";
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandling,
  parseRequestBody,
  logEvent,
} from "../_shared/error-handler.ts";

serve(withErrorHandling(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

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

  // Verificar se o usuário que está fazendo a requisição é admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return createErrorResponse('UNAUTHORIZED', req);
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);

  if (!user) {
    return createErrorResponse('UNAUTHORIZED', req);
  }

  // Verificar se o usuário é admin
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isAdmin = roles?.some((r) => r.role === "admin");

  if (!isAdmin) {
    return createErrorResponse('ADMIN_REQUIRED', req);
  }

  // Obter o ID do usuário a ser excluído
  const { data: body, error: parseError } = await parseRequestBody<{ userId: string }>(req);
  
  if (parseError || !body) {
    return createErrorResponse('VALIDATION_ERROR', req, parseError || 'Invalid request body');
  }

  const { userId } = body;

  if (!userId) {
    return createErrorResponse('MISSING_FIELD', req, 'userId is required');
  }

  // Prevenir que o admin exclua a si mesmo
  if (userId === user.id) {
    return createErrorResponse('VALIDATION_ERROR', req, 'Você não pode excluir sua própria conta');
  }

  logEvent('info', 'delete-user-attempt', { targetUserId: userId, adminId: user.id });

  // Excluir o usuário
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    logEvent('error', 'delete-user-failed', { error: deleteError.message });
    return createErrorResponse('DATABASE_ERROR', req, deleteError.message);
  }

  logEvent('info', 'delete-user-success', { targetUserId: userId });
  return createSuccessResponse({ success: true }, req);
}));
