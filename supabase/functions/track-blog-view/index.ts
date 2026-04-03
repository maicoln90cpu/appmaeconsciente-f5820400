import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { withErrorHandling, createSuccessResponse, createErrorResponse } from "../_shared/error-handler.ts";

// In-memory dedup: IP+slug → timestamp (30 min window)
const viewCache = new Map<string, number>();
const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // cleanup every 10 min

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of viewCache) {
    if (now - ts > DEDUP_WINDOW_MS) viewCache.delete(key);
  }
}, CACHE_CLEANUP_INTERVAL);

const BOT_REGEX = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|mediapartners|google|baidu|yandex|duckduck/i;

serve(withErrorHandling(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);
  if (req.method !== "POST") return createErrorResponse("VALIDATION_ERROR", req, "Método não permitido");

  const body = await req.json();
  const slug = body?.slug;

  if (!slug || typeof slug !== "string") {
    return createErrorResponse("MISSING_FIELD", req, "slug é obrigatório");
  }

  // Filter bots
  const userAgent = req.headers.get("user-agent") || "";
  if (BOT_REGEX.test(userAgent)) {
    return createSuccessResponse({ tracked: false, reason: "bot" }, req);
  }

  // IP dedup
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
             req.headers.get("x-real-ip") || "unknown";
  const dedupKey = `${ip}:${slug}`;
  const lastView = viewCache.get(dedupKey);

  if (lastView && Date.now() - lastView < DEDUP_WINDOW_MS) {
    return createSuccessResponse({ tracked: false, reason: "duplicate" }, req);
  }

  viewCache.set(dedupKey, Date.now());

  // Increment views
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  await supabase.rpc("increment_blog_views", { p_slug: slug });

  return createSuccessResponse({ tracked: true }, req);
}));
