import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Users, BookOpen, HeadphonesIcon, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { InstallPrompt } from "@/components/install/InstallPrompt";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  title: string;
  description: string;
  short_description: string | null;
  price: number | null;
  is_free: boolean;
  slug: string;
}

interface Testimonial {
  name: string;
  location: string;
  text: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: "Fernanda Lima",
    location: "1º filho - São Paulo/SP",
    text: "O Controle de Enxoval me salvou! Consegui rastrear cada item, comparar preços e não esquecer nada. Economizei mais de R$ 3.500 comprando apenas o necessário.",
    rating: 5
  },
  {
    name: "Mariana Costa",
    location: "Grávida de 8 meses - Belo Horizonte/MG",
    text: "A Calculadora de Fraldas foi uma revelação! Descobri que fraldas de pano realmente compensam no longo prazo. O cálculo detalhado me deu segurança para investir.",
    rating: 5
  },
  {
    name: "Camila Rodrigues",
    location: "Mãe de gêmeos - Rio de Janeiro/RJ",
    text: "Com gêmeos, o Diário de Sono foi essencial. Consegui identificar padrões, ajustar rotinas e finalmente dormir melhor. Dashboard visual super intuitivo!",
    rating: 5
  },
  {
    name: "Patrícia Alves",
    location: "2º filho - Curitiba/PR",
    text: "O Rastreador de Amamentação me ajudou a controlar mamadas, estoque de leite e até prever quando ordenhar. Como segunda mãe, isso foi um luxo de organização!",
    rating: 5
  },
  {
    name: "Beatriz Santos",
    location: "Nutricionista e grávida - Salvador/BA",
    text: "O Guia de Alimentação superou minhas expectativas! Planos semanais, receitas por trimestre e controle de suplementos. Tudo validado e seguro.",
    rating: 5
  },
  {
    name: "Roberta Mendes",
    location: "Mãe solo - Porto Alegre/RS",
    text: "A comunidade foi meu suporte emocional. Compartilhar dúvidas, ver fotos de outras mães e receber incentivo fez toda diferença na minha jornada solo.",
    rating: 5
  },
  {
    name: "Juliana Freitas",
    location: "Médica pediatra - Brasília/DF",
    text: "Como pediatra, indico o Cartão de Vacinação Digital! Mães organizadas facilitam meu trabalho. Lembretes, registro de reações e relatórios em PDF são incríveis.",
    rating: 5
  }
];

const Landing = () => {
  const [featuredMaterials, setFeaturedMaterials] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedMaterials();
  }, []);

  const loadFeaturedMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, description, short_description, price, is_free, slug")
        .eq("is_active", true)
        .neq("slug", "clube-premium")
        .order("display_order")
        .limit(6);

      if (error) throw error;
      setFeaturedMaterials(data || []);
    } catch (error) {
      console.error("Erro ao carregar materiais:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Maternidade Consciente
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Sua jornada para uma{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              maternidade consciente
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Ferramentas inteligentes, comunidade acolhedora e suporte especializado para você planejar cada detalhe com economia e sem desperdícios.
          </p>
          <Button size="lg" asChild className="gap-2">
            <Link to="/auth">
              Começar Gratuitamente <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Benefícios */}
      <section className="container py-16 bg-muted/50">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-3xl font-bold text-center mb-12">
            Tudo que você precisa em um só lugar
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <Users className="h-12 w-12 mb-4 text-primary" />
                <h4 className="text-xl font-semibold mb-2">Comunidade</h4>
                <p className="text-muted-foreground">
                  Conecte-se com outras mães, compartilhe experiências, fotos e aprenda juntas nessa jornada especial.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <BookOpen className="h-12 w-12 mb-4 text-primary" />
                <h4 className="text-xl font-semibold mb-2">Materiais</h4>
                <p className="text-muted-foreground">
                  Ferramentas práticas e conteúdos exclusivos para planejar seu enxoval, orçamento e muito mais.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <HeadphonesIcon className="h-12 w-12 mb-4 text-primary" />
                <h4 className="text-xl font-semibold mb-2">Suporte</h4>
                <p className="text-muted-foreground">
                  Tire suas dúvidas com nossa equipe especializada sempre que precisar de ajuda.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Materiais em Destaque */}
      <section className="container py-16">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-3xl font-bold text-center mb-12">
            Materiais em Destaque
          </h3>
          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6 space-y-4">
                    <div className="h-8 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-20 bg-muted rounded" />
                    <div className="h-10 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredMaterials.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="pt-6 flex flex-col h-full">
                    <div className="mb-4">
                      {product.is_free ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                          Gratuito
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                          R$ {product.price?.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-xl font-semibold mb-2">{product.title}</h4>
                    <p className="text-muted-foreground mb-4 flex-1 text-sm">
                      {product.short_description || product.description.substring(0, 100) + "..."}
                    </p>
                    <Button className="w-full" asChild>
                      <Link to="/auth">
                        {product.is_free ? "Acessar Grátis" : "Experimentar Grátis"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Depoimentos */}
      <section className="container py-16 bg-muted/50">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12">
            O que dizem nossas usuárias
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    "{testimonial.text}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-3xl font-bold mb-6">
            Pronta para começar sua jornada?
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se a milhares de mães que já estão planejando uma maternidade mais consciente e econômica.
          </p>
          <Button size="lg" asChild className="gap-2">
            <Link to="/auth">
              Criar Conta Grátis <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Maternidade Consciente. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <Link to="/suporte" className="text-sm text-muted-foreground hover:text-foreground">
                Suporte
              </Link>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Termos
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacidade
              </a>
            </div>
          </div>
        </div>
      </footer>

      <InstallPrompt />
    </div>
  );
};

export default Landing;
