import { useState, useEffect, useMemo } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Calendar, Clock, Eye, ArrowRight, BookOpen, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string | null;
  categories: string[];
  tags: string[];
  reading_time_min: number;
  views_count: number;
  published_at: string;
  author_name: string;
}

const POSTS_PER_PAGE = 9;

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select(
          'id, title, slug, excerpt, featured_image_url, categories, tags, reading_time_min, views_count, published_at, author_name'
        )
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      setPosts((data as BlogPost[]) || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const categories = useMemo(() => {
    const all = posts.flatMap(p => p.categories || []);
    return [...new Set(all)].sort();
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !selectedCategory || p.categories?.includes(selectedCategory);
      return matchSearch && matchCategory;
    });
  }, [posts, search, selectedCategory]);

  const heroPost = filtered[0];
  const gridPosts = filtered.slice(1, visibleCount);
  const hasMore = filtered.length > visibleCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-[400px] w-full rounded-2xl mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[340px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between">
          <Link
            to="/"
            className="text-lg sm:text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
          >
            Mãe Consciente
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild size="sm">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Início
              </Link>
            </Button>
            <Button asChild size="sm" className="shadow-glow">
              <Link to="/auth">
                Começar Agora <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 sm:py-12">
        {/* Page Title */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-display font-bold">Blog</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Dicas, guias e informações para cada fase da maternidade — da gestação ao primeiro ano
            do bebê.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Badge>
            {categories.map(cat => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum artigo encontrado</h3>
            <p className="text-muted-foreground">
              {search ? 'Tente buscar com outros termos.' : 'Em breve teremos novos conteúdos!'}
            </p>
          </div>
        ) : (
          <>
            {/* Hero Post */}
            {heroPost && (
              <Link to={`/blog/${heroPost.slug}`} className="block group mb-10">
                <article className="relative rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-lg transition-shadow">
                  <div className="grid md:grid-cols-2">
                    {heroPost.featured_image_url ? (
                      <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
                        <img
                          src={heroPost.featured_image_url}
                          alt={heroPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="eager"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] md:aspect-auto bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-primary/30" />
                      </div>
                    )}
                    <div className="p-6 sm:p-8 flex flex-col justify-center">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {heroPost.categories?.slice(0, 2).map(cat => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3 group-hover:text-primary transition-colors line-clamp-3">
                        {heroPost.title}
                      </h2>
                      <p className="text-muted-foreground mb-4 line-clamp-3">{heroPost.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(heroPost.published_at), "d 'de' MMM, yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {heroPost.reading_time_min} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {heroPost.views_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                  <article className="rounded-xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                    {post.featured_image_url ? (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-primary/30" />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {post.categories?.slice(0, 2).map(cat => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2 flex-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(post.published_at), 'd MMM yyyy', { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.reading_time_min} min
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-10">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setVisibleCount(v => v + POSTS_PER_PAGE)}
                >
                  Carregar mais artigos
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>© {new Date().getFullYear()} Mãe Consciente. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Blog;
