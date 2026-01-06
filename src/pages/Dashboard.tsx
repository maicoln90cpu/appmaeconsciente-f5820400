import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight,
  Award,
  Baby, 
  BookOpen,
  Calendar, 
  Heart, 
  Moon, 
  ShoppingBag, 
  TrendingUp,
  Users,
  Utensils, 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useProfile } from "@/hooks/useProfile";
import { OnboardingWizard, OnboardingChecklist } from "@/components/onboarding";

const Dashboard = () => {
  const [showWizard, setShowWizard] = useState(false);
  const { profile } = useProfile();

  const modules = [
    {
      title: "Enxoval",
      description: "Organize e planeje seu enxoval",
      icon: ShoppingBag,
      path: "/materiais/controle-enxoval",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    },
    {
      title: "Vacinação",
      description: "Cartão de vacinação digital",
      icon: Calendar,
      path: "/materiais/cartao-vacinacao",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Alimentação",
      description: "Guia nutricional para gestantes",
      icon: Utensils,
      path: "/materiais/guia-alimentacao",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Amamentação",
      description: "Rastreador de mamadas",
      icon: Heart,
      path: "/materiais/rastreador-amamentacao",
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Sono do Bebê",
      description: "Diário de sono",
      icon: Moon,
      path: "/materiais/diario-sono",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    },
    {
      title: "Desenvolvimento",
      description: "Monitor de marcos do bebê",
      icon: Baby,
      path: "/materiais/monitor-desenvolvimento",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Mala Maternidade",
      description: "Checklist completo",
      icon: ShoppingBag,
      path: "/materiais/mala-maternidade",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      title: "Recuperação Pós-Parto",
      description: "Acompanhe sua recuperação",
      icon: TrendingUp,
      path: "/materiais/recuperacao-pos-parto",
      color: "text-teal-500",
      bgColor: "bg-teal-500/10"
    },
    {
      title: "Calculadora de Fraldas",
      description: "Calcule custos e economize",
      icon: Baby,
      path: "/materiais/calculadora-fraldas",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "Comunidade",
      description: "Conecte-se com outras mães",
      icon: Users,
      path: "/comunidade",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    },
    {
      title: "Materiais",
      description: "Conteúdos e ferramentas",
      icon: BookOpen,
      path: "/materiais",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Conquistas",
      description: "Suas conquistas e badges",
      icon: Award,
      path: "/conquistas",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    }
  ];

  // Show onboarding wizard for new users
  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      // Check if this is the first visit (no onboarding dismissed in localStorage)
      const dismissed = localStorage.getItem("onboarding_wizard_dismissed");
      if (!dismissed) {
        setShowWizard(true);
      }
    }
  }, [profile]);

  const handleCloseWizard = () => {
    setShowWizard(false);
    localStorage.setItem("onboarding_wizard_dismissed", "true");
  };

  return (
    <div className="container py-8">
      {/* Onboarding Wizard Modal */}
      <OnboardingWizard open={showWizard} onClose={handleCloseWizard} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Olá, {profile?.email?.split('@')[0] || 'Mamãe'}! 👋
        </h1>
        <p className="text-muted-foreground">
          Bem-vinda ao seu painel de maternidade consciente
        </p>
      </div>

      {/* Onboarding Checklist */}
      {profile && !profile.onboarding_completed && (
        <div className="mb-8">
          <OnboardingChecklist />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.path} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${module.color}`} />
                </div>
                <CardTitle className="text-xl">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between group" asChild>
                  <Link to={module.path}>
                    Acessar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Dica do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Explore cada módulo para desbloquear conquistas e fazer parte de uma comunidade acolhedora de mães conscientes! 🌟
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
