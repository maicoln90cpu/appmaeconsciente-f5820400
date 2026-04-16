import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Eye, ArrowLeft, ArrowRight, Share2, Copy, BookOpen, ChevronRight, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string | null;
  categories: string[];
  tags: string[];
  reading_time_min: number;
  views_count: number;
  published_at: string;
  author_name: string;
  meta_title: string;
  meta_description: string;
  seo_keywords: string[];
  faq_schema: { question: string; answer: string }[] | null;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string | null;
  categories: string[];
  reading_time_min: number;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function extractToc(html: string): TocItem[] {
  const regex = /<h([23])[^>]*?(?:id="([^"]*)")?[^>]*>(.*?)<\/h[23]>/gi;
  const items: TocItem[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const existingId = match[2];
    const text = match[3].replace(/<[^>]*>/g, "").trim();
    const id = existingId || text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    items.push({ id, text, level });
  }
  return items;
}

function addIdsToHeadings(html: string, toc: TocItem[]): string {
  let result = html;
  for (const item of toc) {
    const escapedText = item.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(<h${item.level}[^>]*?)(?:id="[^"]*")?([^>]*>)(${escapedText})`, "i");
    result = result.replace(regex, `$1 id="${item.id}"$2$3`);
  }
  return result;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, content, excerpt, meta_title, meta_description, featured_image_url, og_image_url, author_name, categories, tags, seo_keywords, faq_schema, internal_links, reading_time_min, views_count, published_at, created_at, updated_at, status")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPost(data as unknown as Post);
      setLoading(false);

      // Track view
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        fetch(`https://${projectId}.supabase.co/functions/v1/track-blog-view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
      } catch { /* silent */ }

      // Fetch related posts
      const { data: relatedData } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image_url, categories, reading_time_min")
        .eq("status", "published")
        .neq("slug", slug)
        .order("published_at", { ascending: false })
        .limit(20);

      if (relatedData) {
        // Shuffle and pick 3
        const shuffled = (relatedData as RelatedPost[]).sort(() => Math.random() - 0.5);
        setRelated(shuffled.slice(0, 3));
      }
    };

    fetchPost();
  }, [slug]);

  // SEO meta tags
  useEffect(() => {
    if (!post) return;
    document.title = post.meta_title || post.title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(name.startsWith("og:") ? "property" : "name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", post.meta_description || post.excerpt || "");
    setMeta("keywords", (post.seo_keywords || []).join(", "));
    setMeta("og:title", post.meta_title || post.title);
    setMeta("og:description", post.meta_description || post.excerpt || "");
    setMeta("og:type", "article");
    setMeta("og:url", window.location.href);
    if (post.featured_image_url) setMeta("og:image", post.featured_image_url);
    setMeta("twitter:card", "summary_large_image");

    // JSON-LD
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.meta_description || post.excerpt,
      image: post.featured_image_url || undefined,
      datePublished: post.published_at,
      author: { "@type": "Organization", name: post.author_name },
      publisher: { "@type": "Organization", name: "Mãe Consciente" },
      mainEntityOfPage: window.location.href,
    };

    let scriptEl = document.querySelector("#blog-jsonld");
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.setAttribute("type", "application/ld+json");
      scriptEl.id = "blog-jsonld";
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(jsonLd);

    // FAQ JSON-LD
    if (post.faq_schema?.length) {
      const faqLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faq_schema.map(f => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      };
      let faqEl = document.querySelector("#blog-faq-jsonld");
      if (!faqEl) {
        faqEl = document.createElement("script");
        faqEl.setAttribute("type", "application/ld+json");
        faqEl.id = "blog-faq-jsonld";
        document.head.appendChild(faqEl);
      }
      faqEl.textContent = JSON.stringify(faqLd);
    }

    return () => {
      document.querySelector("#blog-jsonld")?.remove();
      document.querySelector("#blog-faq-jsonld")?.remove();
    };
  }, [post]);

  const toc = useMemo(() => (post ? extractToc(post.content || "") : []), [post]);
  const processedContent = useMemo(() => {
    if (!post?.content) return "";
    return addIdsToHeadings(post.content, toc);
  }, [post, toc]);

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const title = post?.title || "";
    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`);
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
        break;
      case "copy":
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-12">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-[400px] w-full rounded-xl mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Artigo não encontrado</h1>
          <p className="text-muted-foreground mb-6">O artigo que você procura não existe ou foi removido.</p>
          <Button asChild><Link to="/blog">Voltar ao Blog</Link></Button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between">
          <Link to="/" className="text-lg sm:text-xl font-display font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Mãe Consciente
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild size="sm">
              <Link to="/blog"><ArrowLeft className="h-4 w-4 mr-1" />Blog</Link>
            </Button>
            <Button asChild size="sm" className="shadow-glow">
              <Link to="/auth">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="container max-w-4xl pt-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
          <ChevronRight className="h-3 w-3" />
          <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
          <ChevronRight className="h-3 w-3" />
          <li className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">{post.title}</li>
        </ol>
      </nav>

      <article className="container max-w-4xl py-6 sm:py-10">
        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories?.map(cat => (
              <Badge key={cat} variant="secondary">{cat}</Badge>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-display font-bold leading-tight mb-5">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="font-medium text-foreground">{post.author_name}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(post.published_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.reading_time_min} min de leitura
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {post.views_count} visualizações
            </span>
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">Compartilhar:</span>
            <Button variant="outline" size="sm" onClick={() => handleShare("whatsapp")} className="gap-1.5 text-xs">
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare("twitter")} className="gap-1.5 text-xs">
              Twitter/X
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare("copy")} className="gap-1.5 text-xs">
              <Copy className="h-3 w-3" /> Copiar
            </Button>
          </div>
        </header>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="rounded-xl overflow-hidden mb-8 border border-border/30">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-auto max-h-[500px] object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* Layout: TOC + Content */}
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
          {/* Table of Contents (Desktop sidebar) */}
          {toc.length > 2 && (
            <aside className="hidden lg:block">
              <div className="sticky top-20">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Índice</h4>
                <nav className="space-y-1.5">
                  {toc.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm hover:text-primary transition-colors ${
                        item.level === 3 ? "pl-4 text-muted-foreground" : "text-foreground/80 font-medium"
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Content */}
          <div>
            {/* Mobile TOC */}
            {toc.length > 2 && (
              <details className="lg:hidden mb-8 rounded-lg border border-border/50 bg-muted/30 p-4">
                <summary className="cursor-pointer font-semibold text-sm">📑 Índice do Artigo</summary>
                <nav className="mt-3 space-y-1.5">
                  {toc.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm hover:text-primary transition-colors ${
                        item.level === 3 ? "pl-4 text-muted-foreground" : "text-foreground/80"
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </details>
            )}

            {/* Article Body */}
            <div
              className="blog-article-content prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />

            {/* Mid-article CTA */}
            <div className="my-10 p-6 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 text-center">
              <h3 className="text-xl font-bold mb-2">🤰 Conheça nossas ferramentas!</h3>
              <p className="text-muted-foreground mb-4">
                Calculadoras, rastreadores e guias para cada fase da maternidade.
              </p>
              <Button asChild className="shadow-glow">
                <Link to="/auth">Experimentar Grátis <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 my-8">
                {post.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                ))}
              </div>
            )}

            {/* FAQ Section */}
            {post.faq_schema?.length > 0 && (
              <section className="my-10">
                <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes</h2>
                <div className="space-y-4">
                  {post.faq_schema.map((faq, i) => (
                    <details key={i} className="rounded-lg border border-border/50 bg-card p-4 group">
                      <summary className="cursor-pointer font-semibold group-open:text-primary transition-colors">
                        {faq.question}
                      </summary>
                      <p className="mt-3 text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <Separator className="my-8" />

            {/* Bottom Share */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
              <p className="text-sm text-muted-foreground">Gostou? Compartilhe com outras mães!</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleShare("whatsapp")}>WhatsApp</Button>
                <Button variant="outline" size="sm" onClick={() => handleShare("twitter")}>Twitter/X</Button>
                <Button variant="outline" size="sm" onClick={() => handleShare("copy")}><Copy className="h-3 w-3 mr-1" />Copiar</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Leia também</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(rp => (
                <Link key={rp.id} to={`/blog/${rp.slug}`} className="group">
                  <article className="rounded-xl overflow-hidden border border-border/50 bg-card hover:shadow-md transition-shadow h-full flex flex-col">
                    {rp.featured_image_url ? (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img src={rp.featured_image_url} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-primary/30" />
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 flex-1">{rp.title}</h3>
                      <span className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {rp.reading_time_min} min
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center">
          <h3 className="text-2xl font-bold mb-3">Comece sua jornada consciente 💕</h3>
          <p className="text-muted-foreground mb-5 max-w-lg mx-auto">
            Ferramentas, guias e acompanhamento para cada fase da maternidade. Experimente grátis por 7 dias.
          </p>
          <Button asChild size="lg" className="shadow-glow">
            <Link to="/auth">Começar Agora <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>© {new Date().getFullYear()} Mãe Consciente. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;
