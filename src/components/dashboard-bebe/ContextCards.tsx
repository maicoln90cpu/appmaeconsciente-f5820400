import { useEffect, useState } from 'react';

import { format, differenceInDays, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Syringe,
  Brain,
  Droplets,
  Calendar,
  Sparkles,
  Baby,
  TrendingUp,
  Moon,
  Apple,
  Heart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { useProfile } from '@/hooks/useProfile';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ContextCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; path: string };
  color: string;
}

export const ContextCards = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [cards, setCards] = useState<ContextCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && profile) buildCards();
  }, [user?.id, profile]);

  const buildCards = async () => {
    const newCards: ContextCard[] = [];
    const fase = profile?.fase_maternidade || inferPhase();

    try {
      if (fase === 'gestante') {
        await buildGestanteCards(newCards);
      } else {
        await buildPosPartoCards(newCards);
      }

      // Always add daily tip
      addDailyTip(newCards, fase);
    } catch (e) {
      console.error('Error building context cards:', e);
    }

    setCards(newCards.slice(0, 4)); // max 4 cards
    setLoading(false);
  };

  const inferPhase = (): string => {
    if (profile?.delivery_date) return 'pos-parto';
    if (profile?.data_prevista_parto || profile?.meses_gestacao) return 'gestante';
    return 'pos-parto'; // default
  };

  const buildGestanteCards = async (cards: ContextCard[]) => {
    // DPP countdown
    if (profile?.data_prevista_parto) {
      const dpp = new Date(profile.data_prevista_parto);
      const daysLeft = differenceInDays(dpp, new Date());
      if (daysLeft > 0) {
        cards.push({
          id: 'dpp',
          icon: <Calendar className="h-5 w-5 text-pink-500" />,
          title: `${daysLeft} dias para o parto`,
          description: `Data prevista: ${format(dpp, 'dd/MM/yyyy')}`,
          action: { label: 'Gestação', path: '/materiais/ferramentas-gestacao' },
          color: 'border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/20',
        });
      }
    }

    // Maternity bag reminder (after week 32)
    if (profile?.meses_gestacao && profile.meses_gestacao >= 8) {
      cards.push({
        id: 'mala',
        icon: <Heart className="h-5 w-5 text-rose-500" />,
        title: 'Hora da mala maternidade!',
        description: 'A partir do 8º mês, prepare sua mala',
        action: { label: 'Montar mala', path: '/materiais/mala-maternidade' },
        color: 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20',
      });
    }

    // Enxoval reminder
    cards.push({
      id: 'enxoval',
      icon: <Baby className="h-5 w-5 text-teal-500" />,
      title: 'Enxoval organizado?',
      description: 'Controle suas compras e orçamento',
      action: { label: 'Ver enxoval', path: '/materiais/controle-enxoval' },
      color: 'border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20',
    });
  };

  const buildPosPartoCards = async (cards: ContextCard[]) => {
    if (!user?.id) return;

    // Upcoming vaccines
    const { data: babyProfiles } = await supabase
      .from('baby_vaccination_profiles')
      .select('id, baby_name, birth_date')
      .eq('user_id', user.id)
      .limit(1);

    if (babyProfiles && babyProfiles.length > 0) {
      const baby = babyProfiles[0];
      const ageMonths = differenceInMonths(new Date(), new Date(baby.birth_date));

      // Milestone card
      cards.push({
        id: 'milestone',
        icon: <Brain className="h-5 w-5 text-violet-500" />,
        title: `${baby.baby_name}: ${ageMonths} meses`,
        description: 'Veja os marcos de desenvolvimento esperados',
        action: { label: 'Ver marcos', path: '/materiais/monitor-desenvolvimento' },
        color: 'border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20',
      });

      // Vaccine check
      const { count } = await supabase
        .from('baby_vaccinations')
        .select('id', { count: 'exact', head: true })
        .eq('baby_profile_id', baby.id);

      cards.push({
        id: 'vacinas',
        icon: <Syringe className="h-5 w-5 text-emerald-500" />,
        title: `${count || 0} vacinas registradas`,
        description: 'Confira o calendário de vacinação',
        action: { label: 'Vacinas', path: '/materiais/cartao-vacinacao' },
        color: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20',
      });
    }

    // Recent sleep quality
    const { data: recentSleep } = await supabase
      .from('baby_sleep_logs')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    if (recentSleep && recentSleep.length > 0) {
      const totalMin = recentSleep.reduce((s, l) => s + (l.duration_minutes || 0), 0);
      const hours = (totalMin / 60).toFixed(1);
      cards.push({
        id: 'sono',
        icon: <Moon className="h-5 w-5 text-indigo-500" />,
        title: `${hours}h de sono hoje`,
        description: `${recentSleep.length} registros nas últimas 24h`,
        action: { label: 'Diário', path: '/materiais/diario-sono' },
        color: 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20',
      });
    }
  };

  const addDailyTip = (cards: ContextCard[], fase: string) => {
    const gestanteTips = [
      'Beba 2L de água por dia para manter-se hidratada 💧',
      'Alimentos ricos em ferro ajudam na gestação 🥬',
      'Exercícios de respiração ajudam a relaxar 🧘‍♀️',
    ];
    const posPartoTips = [
      'Descanse quando o bebê dormir — você merece! 😴',
      'Registre as mamadas para acompanhar padrões 📝',
      'Movimente-se com caminhadas leves 🚶‍♀️',
    ];
    const tips = fase === 'gestante' ? gestanteTips : posPartoTips;
    const dayIndex = new Date().getDate() % tips.length;

    cards.push({
      id: 'tip',
      icon: <Sparkles className="h-5 w-5 text-amber-500" />,
      title: 'Dica do dia',
      description: tips[dayIndex],
      color: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20',
    });
  };

  if (loading) return null;
  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map(card => (
        <Card key={card.id} className={`border ${card.color} transition-all`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{card.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
                {card.action && (
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-auto mt-1 text-xs"
                    onClick={() => navigate(card.action!.path)}
                  >
                    {card.action.label} →
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
