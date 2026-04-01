import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ShieldCheck, TrendingUp, Baby, Star, Users, BookOpen, HeadphonesIcon } from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Heart className="h-8 w-8" />,
    title: "Feito com Carinho",
    description: "Cada ferramenta foi desenvolvida pensando nas necessidades reais de mães brasileiras"
  },
  {
    icon: <ShieldCheck className="h-8 w-8" />,
    title: "100% Seguro",
    description: "Seus dados são protegidos com criptografia de ponta e nunca compartilhados"
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Economia Comprovada",
    description: "Nossas usuárias economizam em média R$ 2.000+ no enxoval do bebê"
  },
  {
    icon: <Baby className="h-8 w-8" />,
    title: "Suporte Especializado",
    description: "Equipe preparada para ajudar em cada etapa da sua jornada maternal"
  }
];

const stats = [
  { value: "10.000+", label: "Mães Atendidas", icon: <Users className="h-6 w-6" /> },
  { value: "50.000+", label: "Itens Rastreados", icon: <BookOpen className="h-6 w-6" /> },
  { value: "4.9★", label: "Avaliação Média", icon: <Star className="h-6 w-6" /> },
  { value: "24/7", label: "Suporte Ativo", icon: <HeadphonesIcon className="h-6 w-6" /> }
];

/**
 * Custom hook for intersection observer
 */
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

export function FeaturesSection() {
  const featuresInView = useInView(0.2);

  return (
    <section 
      ref={featuresInView.ref as React.RefObject<HTMLElement>}
      className="py-20 md:py-28 bg-muted/30"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Por que escolher a Mãe Consciente?
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mais do que ferramentas, oferecemos uma comunidade de apoio para sua jornada maternal
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`text-center border-none shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 ${
                featuresInView.isInView ? 'animate-fade-in' : 'opacity-0'
              }`}
              style={{ animationDelay: featuresInView.isInView ? `${index * 100}ms` : '0ms' }}
            >
              <CardHeader>
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`text-center p-6 rounded-2xl bg-background shadow-soft ${
                featuresInView.isInView ? 'animate-fade-in' : 'opacity-0'
              }`}
              style={{ animationDelay: featuresInView.isInView ? `${(index + 4) * 100}ms` : '0ms' }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                {stat.icon}
              </div>
              <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
