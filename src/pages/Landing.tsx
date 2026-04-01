import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Users, BookOpen, HeadphonesIcon, Star, Smartphone, Share, PlusSquare, CheckCircle2, Quote, Sparkles, Heart, ShieldCheck, TrendingUp, Baby } from "lucide-react";
import { Link } from "react-router-dom";
import { InstallPrompt } from "@/components/install/InstallPrompt";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef, useCallback } from "react";

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

const features = [
  {
    icon: Package,
    title: "Controle de Enxoval",
    description: "Organize compras, compare preços entre lojas e economize até R$5.000 no enxoval do bebê.",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    icon: Moon,
    title: "Diário de Sono",
    description: "Registre padrões de sono do bebê, receba insights com IA e identifique a melhor rotina.",
    gradient: "from-indigo-500 to-blue-500"
  },
  {
    icon: Milk,
    title: "Amamentação",
    description: "Controle mamadas, ordenha, estoque de leite materno e histórico completo de alimentação.",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    icon: Baby,
    title: "Ferramentas de Gestação",
    description: "Contador de movimentos fetais, checklist de exames, plano de parto e calculadora de DPP.",
    gradient: "from-amber-500 to-orange-500"
  },
  {
    icon: Brain,
    title: "Monitor de Desenvolvimento",
    description: "Acompanhe marcos do bebê mês a mês com alertas, banco de estímulos e relatório para o pediatra.",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    icon: Calculator,
    title: "Calculadora de Fraldas",
    description: "Simule custos descartável vs pano, compare marcas e descubra quanto vai gastar — 100% GRÁTIS.",
    gradient: "from-fuchsia-500 to-pink-500",
    free: true
  }
];

const extraTools = [
  { icon: Syringe, label: "Vacinação Digital", free: true },
  { icon: Activity, label: "Recuperação Pós-Parto" },
  { icon: Apple, label: "IA Nutricional" },
  { icon: Users, label: "Comunidade Ativa" },
  { icon: Stethoscope, label: "Guia Alimentação" },
  { icon: Heart, label: "Bem-estar da Mãe" },
];

// Custom hook for intersection observer
const useInView = (options = {}) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
};

const Landing = () => {
  const [featuredMaterials, setFeaturedMaterials] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const featuresInView = useInView();
  const testimonialsInView = useInView();
  const ctaInView = useInView();

  useEffect(() => {
    loadFeaturedMaterials();
  }, []);

  // Testimonials autoplay
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

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
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 glass">
        <div className="container flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
          <h1 className="text-lg xs:text-xl sm:text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate min-w-0 flex-1">
            <span className="hidden xs:inline">Mãe Consciente</span>
            <span className="xs:hidden">M.C.</span>
          </h1>
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild className="gap-1 sm:gap-2 shadow-glow text-xs sm:text-sm px-2.5 sm:px-4 h-8 sm:h-10">
              <Link to="/auth">
                <span className="hidden xs:inline">Começar Agora</span>
                <span className="xs:hidden">Começar</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Staggered Animation */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 gradient-hero opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_50%)]" />
        
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            {/* Animated Badge */}
            <div 
              className="inline-flex items-center gap-2 mb-6 animate-fade-in"
              style={{ animationDelay: '0ms' }}
            >
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium border border-primary/20 bg-primary/5 text-primary animate-pulse-soft">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Novo: IA Nutricional
              </Badge>
            </div>
            
            <h2 
              className="text-4xl font-display font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 animate-fade-in"
              style={{ animationDelay: '100ms' }}
            >
               Tudo para sua{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                gestação e pós-parto
              </span>{" "}em um só app
            </h2>
            
            <p 
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in"
              style={{ animationDelay: '200ms' }}
            >
              Ferramentas inteligentes, comunidade acolhedora e suporte especializado para você planejar cada detalhe com economia e sem desperdícios.
            </p>
            
            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in"
              style={{ animationDelay: '300ms' }}
            >
              <Button size="lg" asChild className="gap-2 shadow-glow hover:shadow-elevated transition-all duration-300 hover:scale-105">
                <Link to="/auth">
                  Começar Gratuitamente <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2 hover-lift">
                <Link to="/auth">
                  <Heart className="h-5 w-5" /> Ver Comunidade
                </Link>
              </Button>
            </div>

            {/* Social Proof Mini */}
            <div 
              className="mt-12 flex items-center justify-center gap-4 text-sm text-muted-foreground animate-fade-in"
              style={{ animationDelay: '400ms' }}
            >
              <div className="flex -space-x-2">
                {['F', 'M', 'C', 'P'].map((letter, i) => (
                  <Avatar key={i} className="w-8 h-8 border-2 border-background">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/40 text-primary font-semibold">
                      {letter}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span>+5.000 mães já utilizam</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Cards with Gradient Icons & 3D Hover */}
      <section 
        ref={featuresInView.ref}
        className="py-20 bg-surface-1"
      >
        <div className="container">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas completas para cada fase da sua jornada maternal
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className={`group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-elevated ${
                  featuresInView.isInView ? 'animate-fade-in' : 'opacity-0'
                }`}
                style={{ 
                  animationDelay: featuresInView.isInView ? `${index * 100}ms` : '0ms',
                  transform: 'perspective(1000px)',
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left - rect.width / 2) / 20;
                  const y = (e.clientY - rect.top - rect.height / 2) / 20;
                  e.currentTarget.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
                }}
              >
                <CardContent className="pt-6 pb-6">
                  {/* Icon with gradient background */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <h4 className="text-xl font-display font-semibold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
                
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Materiais em Destaque */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Materiais em Destaque
            </h3>
            <p className="text-lg text-muted-foreground">
              Recursos exclusivos para sua jornada
            </p>
          </div>
          
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {featuredMaterials.map((product, index) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 border-border/50 hover:border-primary/30"
                >
                  <CardContent className="pt-6 flex flex-col h-full">
                    <div className="mb-4">
                      {product.is_free ? (
                        <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20">
                          Gratuito
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                          R$ {product.price?.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-xl font-display font-semibold mb-2 group-hover:text-primary transition-colors">
                      {product.title}
                    </h4>
                    <p className="text-muted-foreground mb-4 flex-1 text-sm leading-relaxed">
                      {product.short_description || product.description.substring(0, 100) + "..."}
                    </p>
                    <Button className="w-full group-hover:shadow-glow transition-shadow" asChild>
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

      {/* Testimonials Carousel */}
      <section 
        ref={testimonialsInView.ref}
        className="py-20 bg-surface-1 overflow-hidden"
      >
        <div className="container">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-display font-bold mb-4">
              O que dizem nossas usuárias
            </h3>
            <p className="text-lg text-muted-foreground">
              Histórias reais de mães como você
            </p>
          </div>

          {/* Carousel Container */}
          <div 
            className="relative max-w-4xl mx-auto"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Animated Quote Mark */}
            <Quote className="absolute -top-4 -left-4 md:-top-8 md:-left-8 h-16 w-16 md:h-24 md:w-24 text-primary/10 animate-pulse-soft" />
            
            {/* Main Testimonial Card */}
            <Card className="relative border-none shadow-elevated bg-card">
              <CardContent className="pt-12 pb-8 px-8 md:px-12">
                <div className="text-center">
                  {/* Avatar with gradient border */}
                  <div className="inline-flex p-1 rounded-full bg-gradient-to-br from-primary to-primary/50 mb-6">
                    <Avatar className="h-20 w-20 border-4 border-background">
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/40 text-primary">
                        {testimonials[currentTestimonial].name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="h-5 w-5 fill-warning text-warning"
                        style={{ animationDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>
                  
                  <blockquote className="text-lg md:text-xl text-foreground/90 mb-6 leading-relaxed italic">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>
                  
                  <div>
                    <p className="font-display font-semibold text-lg">
                      {testimonials[currentTestimonial].name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {testimonials[currentTestimonial].location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'bg-primary w-8' 
                      : 'bg-primary/30 hover:bg-primary/50'
                  }`}
                  aria-label={`Ver depoimento ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Mini testimonials grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12 max-w-6xl mx-auto">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <Card 
                key={index} 
                className={`border-border/50 hover:border-primary/30 cursor-pointer transition-all duration-300 hover:shadow-medium ${
                  testimonialsInView.isInView ? 'animate-fade-in' : 'opacity-0'
                }`}
                style={{ animationDelay: testimonialsInView.isInView ? `${index * 100}ms` : '0ms' }}
                onClick={() => setCurrentTestimonial(index)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-0.5 rounded-full bg-gradient-to-br from-primary/50 to-primary/30">
                      <Avatar className="h-10 w-10 border-2 border-background">
                        <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                          {testimonial.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{testimonial.location}</p>
                    </div>
                    <div className="flex">
                      {[...Array(Math.min(3, testimonial.rating))].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-warning text-warning" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seção "Baixe o App" */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Baixe Nosso App
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Instale na tela inicial e tenha acesso rápido, offline e notificações personalizadas
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {/* iOS */}
            <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-medium group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                    <Share className="h-5 w-5 text-foreground" />
                  </div>
                  iPhone (iOS)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Abra o site no Safari',
                  'Toque no botão Compartilhar',
                  'Selecione "Adicionar à Tela de Início"',
                  'Toque em "Adicionar" e pronto!'
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {i + 1}
                    </div>
                    <p className="text-sm pt-0.5">{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Android */}
            <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-medium group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30">
                    <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  Android
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Abra o site no Chrome',
                  'Toque no menu (3 pontos)',
                  'Selecione "Instalar app"',
                  'Confirme e pronto!'
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {i + 1}
                    </div>
                    <p className="text-sm pt-0.5">{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-display font-semibold mb-4">Benefícios do App Instalado:</h3>
            <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { icon: CheckCircle2, text: 'Acesso offline' },
                { icon: CheckCircle2, text: 'Carregamento rápido' },
                { icon: CheckCircle2, text: 'Ícone na tela inicial' }
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 justify-center p-3 rounded-lg bg-success/5">
                  <benefit.icon className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final - Gradient Mesh Background */}
      <section 
        ref={ctaInView.ref}
        className="relative py-24 overflow-hidden"
      >
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        {/* Blur circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/15 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div 
            className={`mx-auto max-w-3xl text-center ${
              ctaInView.isInView ? 'animate-fade-in' : 'opacity-0'
            }`}
          >
            {/* Social Proof Counter */}
            <div className="inline-flex items-center gap-3 mb-8 px-6 py-3 rounded-full bg-card/80 backdrop-blur border border-border/50 shadow-medium">
              <div className="flex -space-x-2">
                {['F', 'M', 'C', 'P', 'B'].map((letter, i) => (
                  <Avatar key={i} className="w-8 h-8 border-2 border-background">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/30 to-primary/50 text-primary font-semibold">
                      {letter}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-lg text-primary">5.000+</p>
                <p className="text-xs text-muted-foreground">mães já utilizam</p>
              </div>
            </div>
            
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Pronta para começar sua{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                jornada?
              </span>
            </h3>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
              Junte-se a milhares de mães que já estão planejando uma maternidade mais consciente e econômica.
            </p>
            
            <Button 
              size="lg" 
              asChild 
              className="gap-2 px-8 py-6 text-lg shadow-glow animate-pulse-soft hover:animate-none hover:scale-105 transition-all duration-300"
            >
              <Link to="/auth">
                Criar Conta Grátis <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            
            <p className="mt-6 text-sm text-muted-foreground">
              Sem cartão de crédito • Acesso imediato • Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-surface-1">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h2 className="text-xl font-display font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-1">
                Mãe Consciente
              </h2>
              <p className="text-sm text-muted-foreground">
                © 2025 Todos os direitos reservados.
              </p>
            </div>
            <div className="flex gap-6">
              <Link to="/suporte" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Suporte
              </Link>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Termos
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
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
