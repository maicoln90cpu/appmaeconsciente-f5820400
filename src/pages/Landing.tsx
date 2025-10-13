import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, BookOpen, HeadphonesIcon, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
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
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-primary">
              <CardContent className="pt-6">
                <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                  Gratuito
                </div>
                <h4 className="text-xl font-semibold mb-2">Controle de Enxoval</h4>
                <p className="text-muted-foreground mb-4">
                  Sistema completo para planejar seu enxoval com economia e inteligência.
                </p>
                <Button className="w-full" asChild>
                  <Link to="/auth">Acessar Grátis</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="opacity-75">
              <CardContent className="pt-6">
                <div className="inline-block px-3 py-1 bg-muted text-muted-foreground text-sm font-medium rounded-full mb-4">
                  Em breve
                </div>
                <h4 className="text-xl font-semibold mb-2">Planilha de Tamanhos</h4>
                <p className="text-muted-foreground mb-4">
                  Descubra os tamanhos ideais por estação e idade do bebê.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Em breve
                </Button>
              </CardContent>
            </Card>

            <Card className="opacity-75">
              <CardContent className="pt-6">
                <div className="inline-block px-3 py-1 bg-muted text-muted-foreground text-sm font-medium rounded-full mb-4">
                  Em breve
                </div>
                <h4 className="text-xl font-semibold mb-2">Calculadora Premium</h4>
                <p className="text-muted-foreground mb-4">
                  Ferramentas avançadas para um planejamento ainda mais preciso.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Em breve
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="container py-16 bg-muted/50">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-3xl font-bold text-center mb-12">
            O que dizem nossas usuárias
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Economizei mais de R$ 2.000 no enxoval graças aos alertas inteligentes. Não comprei nada supérfluo!"
                </p>
                <p className="font-semibold">Ana Paula, mãe de primeira viagem</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "A comunidade é incrível! Aprendi muito com outras mães e me senti acolhida durante toda a gestação."
                </p>
                <p className="font-semibold">Juliana Santos, grávida de 7 meses</p>
              </CardContent>
            </Card>
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
    </div>
  );
};

export default Landing;
