import { useState } from 'react';

import {
  TrendingUp,
  Ruler,
  Apple,
  Calculator,
  Frown,
  Pill,
  Calendar,
  CalendarClock,
  CalendarDays,
  FileText,
  Download,
  Users,
  Bell,
  Trophy,
  Camera,
  History,
  Stethoscope,
  UtensilsCrossed,
  MoreHorizontal,
  ChevronDown,
  Eye,
  Heart,
  Baby,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useProfile } from '@/hooks/useProfile';

interface TabConfig {
  value: string;
  icon: React.ElementType;
  label: string;
}

interface TabGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  tabs: TabConfig[];
}

const tabGroups: TabGroup[] = [
  {
    id: 'hoje',
    label: 'Hoje',
    icon: TrendingUp,
    tabs: [{ value: 'overview', icon: TrendingUp, label: 'Visão Geral' }],
  },
  {
    id: 'saude',
    label: 'Saúde',
    icon: Stethoscope,
    tabs: [
      { value: 'growth', icon: Ruler, label: 'Crescimento' },
      { value: 'colic', icon: Frown, label: 'Cólicas' },
      { value: 'medications', icon: Pill, label: 'Medicamentos' },
      { value: 'jaundice', icon: Eye, label: 'Icterícia' },
      { value: 'wellness', icon: Heart, label: 'Bem-estar Mãe' },
    ],
  },
  {
    id: 'alimentacao',
    label: 'Alimentação',
    icon: UtensilsCrossed,
    tabs: [
      { value: 'food', icon: Apple, label: 'Introdução Alimentar' },
      { value: 'bottle', icon: Calculator, label: 'Mamadeira' },
    ],
  },
  {
    id: 'desenvolvimento',
    label: 'Desenvolvimento',
    icon: Baby,
    tabs: [
      { value: 'teeth', icon: Baby, label: 'Dentes' },
      { value: 'stimulation', icon: Sparkles, label: 'Estimulação' },
      { value: 'allergies', icon: ShieldAlert, label: 'Alergias' },
    ],
  },
  {
    id: 'rotina',
    label: 'Rotina',
    icon: CalendarClock,
    tabs: [
      { value: 'appointments', icon: Calendar, label: 'Consultas' },
      { value: 'routine', icon: CalendarClock, label: 'Rotina Diária' },
      { value: 'calendar', icon: CalendarDays, label: 'Calendário' },
    ],
  },
  {
    id: 'mais',
    label: 'Mais',
    icon: MoreHorizontal,
    tabs: [
      { value: 'achievements', icon: Trophy, label: 'Conquistas' },
      { value: 'firsts', icon: Camera, label: 'Primeiras Vezes' },
      { value: 'timeline', icon: History, label: 'Linha do Tempo' },
      { value: 'report', icon: FileText, label: 'Relatório' },
      { value: 'export', icon: Download, label: 'Exportar' },
      { value: 'partner', icon: Users, label: 'Parceiro' },
      { value: 'notifications', icon: Bell, label: 'Notificações' },
    ],
  },
];

export const DashboardBebeTabs = () => {
  const { profile } = useProfile();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // In simple mode, hide advanced groups
  const SIMPLE_MODE_HIDDEN = new Set(['mais']);
  const filteredGroups = profile?.simple_mode
    ? tabGroups.filter(g => !SIMPLE_MODE_HIDDEN.has(g.id))
    : tabGroups;

  // Get the tabs to show: overview is always visible, plus expanded group's tabs
  const visibleTabs: TabConfig[] = [
    { value: 'overview', icon: TrendingUp, label: 'Hoje' },
    ...(expandedGroup ? (tabGroups.find(g => g.id === expandedGroup)?.tabs ?? []) : []),
  ];

  return (
    <div className="space-y-2">
      {/* Group selector buttons (NOT TabsTriggers) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted-foreground/20">
        {filteredGroups
          .filter(g => g.id !== 'hoje')
          .map(group => {
            const GroupIcon = group.icon;
            const isExpanded = expandedGroup === group.id;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap rounded-lg border transition-colors shrink-0 ${
                  isExpanded
                    ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                    : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <GroupIcon className="h-4 w-4 shrink-0" />
                {group.label}
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
            );
          })}
      </div>

      {/* Actual TabsList with valid TabsTriggers */}
      <TabsList className="flex w-full gap-1 h-auto p-1 bg-muted/50 flex-wrap">
        {visibleTabs.map(({ value, icon: Icon, label }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
};
