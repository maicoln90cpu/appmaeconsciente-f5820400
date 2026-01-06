import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";

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
    name: "Ana Paula Santos",
    location: "Grávida de 6 meses - Salvador/BA",
    text: "A Mala de Maternidade organizada com checklist me deixou tranquila. Filtro de parto normal x cesárea muito útil! Compartilhei com meu marido e acompanhamos juntos.",
    rating: 5
  }
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

export function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const testimonialsInView = useInView(0.2);

  // Auto-rotate testimonials
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section 
      ref={testimonialsInView.ref as React.RefObject<HTMLElement>}
      className="py-20 md:py-28 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
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
  );
}
