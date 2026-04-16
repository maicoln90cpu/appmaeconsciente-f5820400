import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

import { handleCorsOptions, getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);

  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  try {
    const { userId, userName } = await req.json();
    if (!userId || !userName) {
      return new Response(JSON.stringify({ error: "userId e userName são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prompt variado para gerar selfies de mães brasileiras realistas
    const styles = [
      "casual selfie with warm smile, natural lighting, blurred home background",
      "selfie at a park, sunlight, relaxed expression, slightly windswept hair",
      "mirror selfie at home, cozy outfit, soft lighting, friendly smile",
      "selfie holding a coffee cup, morning light, kitchen background, genuine smile",
      "outdoor selfie, golden hour lighting, natural makeup, joyful expression",
    ];
    const style = styles[Math.floor(Math.random() * styles.length)];

    const prompt = `Photorealistic portrait photo of a Brazilian woman named ${userName}, age 25-38, ${style}. She looks like a real person, not AI-generated. No text, no watermarks, no artifacts. High quality smartphone photo look.`;

    console.log(`Generating avatar for ${userName} (${userId})`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: `Erro no gateway IA: ${aiResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl || !imageUrl.startsWith("data:image")) {
      console.error("No image in AI response");
      return new Response(JSON.stringify({ error: "IA não retornou imagem" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64
    const base64Data = imageUrl.split(",")[1];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Determine extension from mime type
    const mimeMatch = imageUrl.match(/^data:(image\/\w+);/);
    const ext = mimeMatch ? mimeMatch[1].split("/")[1].replace("jpeg", "jpg") : "png";
    const storagePath = `virtual/${userId}.${ext}`;

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(storagePath, bytes, {
        contentType: mimeMatch ? mimeMatch[1] : "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(JSON.stringify({ error: `Erro no upload: ${uploadError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(storagePath);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ foto_perfil_url: publicUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return new Response(JSON.stringify({ error: `Erro ao atualizar perfil: ${updateError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Avatar generated and uploaded for ${userName}: ${publicUrl}`);

    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-avatar error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
