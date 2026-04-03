import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { withErrorHandling, createSuccessResponse, createErrorResponse, logEvent } from "../_shared/error-handler.ts";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface BlogSettings {
  ai_model: string;
  image_model: string;
  default_author: string;
  system_prompt: string;
  image_prompt_template: string;
  categories_list: string[];
  topics_pool: string[];
  auto_publish: boolean;
}

interface ImagePrompt {
  id: string;
  name: string;
  prompt_template: string;
  last_used_at: string | null;
  usage_count: number;
}

interface GeneratedPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  seo_keywords: string[];
  categories: string[];
  tags: string[];
  faq_schema: { question: string; answer: string }[];
  reading_time_min: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function selectImagePrompt(prompts: ImagePrompt[]): ImagePrompt {
  if (prompts.length === 0) throw new Error("No active image prompts found");
  if (prompts.length === 1) return prompts[0];

  // Exclude the most recently used prompt
  const sorted = [...prompts].sort((a, b) => {
    if (!a.last_used_at) return -1;
    if (!b.last_used_at) return 1;
    return new Date(a.last_used_at).getTime() - new Date(b.last_used_at).getTime();
  });

  // Pick randomly from all except the last used
  const candidates = sorted.slice(0, -1);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function selectTopic(pool: string[], recentTitles: string[]): string {
  const recentLower = recentTitles.map(t => t.toLowerCase());
  
  // Filter out topics too similar to recent posts
  const available = pool.filter(topic => {
    const topicLower = topic.toLowerCase();
    return !recentLower.some(title => 
      title.includes(topicLower.slice(0, 20)) || 
      topicLower.includes(title.slice(0, 20))
    );
  });

  const source = available.length > 0 ? available : pool;
  return source[Math.floor(Math.random() * source.length)];
}

function parseAIResponse(raw: string): GeneratedPost {
  // Try to extract JSON from the response
  let json: any;
  
  // Try direct parse first
  try {
    json = JSON.parse(raw);
  } catch {
    // Try to find JSON in the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      json = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Could not parse AI response as JSON");
    }
  }

  // Normalize content field
  let content = "";
  if (typeof json.content === "string") {
    content = json.content;
  } else if (Array.isArray(json.content)) {
    content = json.content.map((s: any) => {
      if (typeof s === "string") return s;
      if (s.html) return s.html;
      if (s.title && s.body) return `<h2>${s.title}</h2>${s.body}`;
      return JSON.stringify(s);
    }).join("\n");
  } else if (json.sections) {
    content = json.sections.map((s: any) => `<h2>${s.title || ""}</h2>${s.content || s.body || ""}`).join("\n");
  }

  const slug = json.slug || slugify(json.title || "artigo");
  const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  
  return {
    title: json.title || "Artigo sem título",
    slug: `${slug}-${Date.now().toString(36)}`,
    content,
    excerpt: (json.excerpt || json.meta_description || "").slice(0, 160),
    meta_title: (json.meta_title || json.title || "").slice(0, 60),
    meta_description: (json.meta_description || json.excerpt || "").slice(0, 155),
    seo_keywords: json.seo_keywords || json.keywords || [],
    categories: json.categories || [],
    tags: json.tags || [],
    faq_schema: json.faq_schema || json.faq || [],
    reading_time_min: json.reading_time_min || Math.max(3, Math.ceil(wordCount / 200)),
  };
}

function addInternalLinks(html: string, posts: { title: string; slug: string }[]): { html: string; links: { title: string; slug: string }[] } {
  if (!posts.length) return { html, links: [] };

  const usedLinks: { title: string; slug: string }[] = [];
  let result = html;
  const maxLinks = 8;

  for (const post of posts) {
    if (usedLinks.length >= maxLinks) break;

    // Create bigrams from post title
    const words = post.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (words.length < 2) continue;

    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      const regex = new RegExp(`(?<![<"])\\b(${bigram.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b(?![^<]*>)`, "i");
      
      if (regex.test(result)) {
        result = result.replace(regex, `<a href="/blog/${post.slug}" title="${post.title}">$1</a>`);
        usedLinks.push(post);
        break;
      }
    }
  }

  return { html: result, links: usedLinks };
}

serve(withErrorHandling(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);
  if (req.method !== "POST") return createErrorResponse("VALIDATION_ERROR", req, "Método não permitido");

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return createErrorResponse("CONFIG_ERROR", req, "LOVABLE_API_KEY não configurada");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Optional: accept a specific topic
  let requestedTopic: string | null = null;
  try {
    const body = await req.json();
    requestedTopic = body?.topic || null;
  } catch { /* empty body is ok */ }

  // 1. Load settings
  const { data: settings, error: settingsError } = await supabase
    .from("blog_settings")
    .select("*")
    .limit(1)
    .single();

  if (settingsError || !settings) {
    return createErrorResponse("CONFIG_ERROR", req, "Configurações do blog não encontradas");
  }

  const cfg = settings as BlogSettings;

  // 2. Load active image prompts
  const { data: imagePrompts } = await supabase
    .from("blog_image_prompts")
    .select("id, name, prompt_template, last_used_at, usage_count")
    .eq("is_active", true);

  if (!imagePrompts?.length) {
    return createErrorResponse("CONFIG_ERROR", req, "Nenhum prompt de imagem ativo");
  }

  // 3. Get recent posts for dedup + internal linking
  const { data: recentPosts } = await supabase
    .from("blog_posts")
    .select("title, slug")
    .order("created_at", { ascending: false })
    .limit(30);

  const recentTitles = (recentPosts || []).map(p => p.title);

  // 4. Select topic
  const topic = requestedTopic || selectTopic(cfg.topics_pool || [], recentTitles);
  logEvent("info", "blog_topic_selected", { topic });

  // 5. Create generation log
  const { data: logEntry } = await supabase
    .from("blog_generation_logs")
    .insert({ model_used: cfg.ai_model, status: "generating", generation_type: "text" })
    .select("id")
    .single();

  const logId = logEntry?.id;

  try {
    // 6. Generate text via AI
    logEvent("info", "blog_generating_text", { model: cfg.ai_model, topic });

    const textResponse = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.ai_model,
        messages: [
          { role: "system", content: cfg.system_prompt },
          {
            role: "user",
            content: `Escreva um artigo completo sobre: "${topic}"\n\nTópicos recentes (NÃO repita estes): ${recentTitles.slice(0, 10).join(", ")}\n\nRetorne APENAS o JSON conforme o formato especificado no system prompt.`,
          },
        ],
        temperature: 0.8,
      }),
    });

    if (!textResponse.ok) {
      const errText = await textResponse.text();
      const status = textResponse.status;
      if (status === 429) {
        if (logId) await supabase.from("blog_generation_logs").update({ status: "error", error_message: "Rate limited" }).eq("id", logId);
        return createErrorResponse("RATE_LIMITED", req, "Limite de requisições IA atingido");
      }
      if (status === 402) {
        if (logId) await supabase.from("blog_generation_logs").update({ status: "error", error_message: "Credits exhausted" }).eq("id", logId);
        return createErrorResponse("CONFIG_ERROR", req, "Créditos de IA esgotados. Adicione fundos em Settings > Workspace > Usage.");
      }
      throw new Error(`AI text generation failed (${status}): ${errText}`);
    }

    const textData = await textResponse.json();
    const rawContent = textData.choices?.[0]?.message?.content || "";
    const usage = textData.usage || {};

    // Parse the generated article
    const post = parseAIResponse(rawContent);
    logEvent("info", "blog_text_generated", { title: post.title, slug: post.slug });

    // 7. Generate image
    const selectedPrompt = selectImagePrompt(imagePrompts as ImagePrompt[]);
    const imagePromptText = selectedPrompt.prompt_template.replace(/\{\{topic\}\}/g, topic);
    logEvent("info", "blog_generating_image", { prompt_name: selectedPrompt.name });

    let featuredImageUrl = "";
    let imageCost = 0;

    try {
      const imageResponse = await fetch(LOVABLE_AI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: cfg.image_model,
          messages: [{ role: "user", content: imagePromptText }],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
        const imgData = await imageResponse.json();
        const imageBase64 = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageBase64) {
          // Extract base64 data and upload to storage
          const base64Match = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
          if (base64Match) {
            const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
            const data = base64Match[2];
            const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
            const filePath = `blog/${post.slug}.${ext}`;

            const { error: uploadError } = await supabase.storage
              .from("blog-images")
              .upload(filePath, bytes, {
                contentType: `image/${base64Match[1]}`,
                upsert: true,
              });

            if (!uploadError) {
              const { data: publicUrl } = supabase.storage.from("blog-images").getPublicUrl(filePath);
              featuredImageUrl = publicUrl.publicUrl;
              logEvent("info", "blog_image_uploaded", { url: featuredImageUrl });
            } else {
              logEvent("warn", "blog_image_upload_failed", { error: uploadError.message });
            }
          }
        }
        imageCost = 0.002;
      } else {
        logEvent("warn", "blog_image_generation_failed", { status: imageResponse.status });
        await imageResponse.text(); // consume body
      }

      // Update image prompt usage
      await supabase
        .from("blog_image_prompts")
        .update({ last_used_at: new Date().toISOString(), usage_count: selectedPrompt.usage_count + 1 })
        .eq("id", selectedPrompt.id);

    } catch (imgErr) {
      logEvent("warn", "blog_image_error", { error: imgErr instanceof Error ? imgErr.message : "unknown" });
    }

    // 8. Auto internal linking
    const publishedPosts = (recentPosts || []).filter(p => p.slug !== post.slug).slice(0, 30);
    const { html: linkedContent, links } = addInternalLinks(post.content, publishedPosts);

    // 9. Insert post
    const status = cfg.auto_publish ? "published" : "draft";
    const { data: insertedPost, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title: post.title,
        slug: post.slug,
        content: linkedContent,
        excerpt: post.excerpt,
        status,
        meta_title: post.meta_title,
        meta_description: post.meta_description,
        seo_keywords: post.seo_keywords,
        categories: post.categories,
        tags: post.tags,
        featured_image_url: featuredImageUrl || null,
        og_image_url: featuredImageUrl || null,
        author_name: cfg.default_author,
        reading_time_min: post.reading_time_min,
        is_ai_generated: true,
        model_used: cfg.ai_model,
        generation_cost_usd: 0,
        image_generation_cost_usd: imageCost,
        faq_schema: post.faq_schema,
        internal_links: links,
        published_at: cfg.auto_publish ? new Date().toISOString() : null,
      })
      .select("id, slug, title, status")
      .single();

    if (insertError) throw new Error(`Failed to insert post: ${insertError.message}`);

    // 10. Update log
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const textCost = (promptTokens * 0.15 + completionTokens * 0.60) / 1_000_000;

    if (logId) {
      await supabase.from("blog_generation_logs").update({
        post_id: insertedPost.id,
        status: "success",
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
        text_cost_usd: textCost,
        image_cost_usd: imageCost,
        total_cost_usd: textCost + imageCost,
      }).eq("id", logId);
    }

    logEvent("info", "blog_post_created", { id: insertedPost.id, slug: insertedPost.slug, status });

    return createSuccessResponse({
      post: insertedPost,
      topic,
      image_prompt_used: selectedPrompt.name,
      has_image: !!featuredImageUrl,
      internal_links_added: links.length,
    }, req, 201);

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    logEvent("error", "blog_generation_failed", { error: msg });

    if (logId) {
      await supabase.from("blog_generation_logs").update({
        status: "error",
        error_message: msg,
      }).eq("id", logId);
    }

    return createErrorResponse("AI_ERROR", req, msg);
  }
}));
