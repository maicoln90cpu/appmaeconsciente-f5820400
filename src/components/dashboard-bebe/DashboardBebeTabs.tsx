import { useState } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, Ruler, Apple, Calculator, Frown, Pill, Calendar, 
  CalendarClock, CalendarDays, FileText, Download, Users, Bell, 
  Trophy, Camera, History, Heart, Stethoscope, UtensilsCrossed,
  MoreHorizontal, ChevronDown
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
    id: "hoje",
    label: "Hoje",
    icon: TrendingUp,
    tabs: [
      { value: "overview", icon: TrendingUp, label: "Visão Geral" },
    ],
  },
  {
    id: "saude",
    label: "Saúde",
    icon: Stethoscope,
    tabs: [
      { value: "growth", icon: Ruler, label: "Crescimento" },
      { value: "colic", icon: Frown, label: "Cólicas" },
      { value: "medications", icon: Pill, label: "Medicamentos" },
    ],
  },
  {
    id: "alimentacao",
    label: "Alimentação",
    icon: UtensilsCrossed,
    tabs: [
      { value: "food", icon: Apple, label: "Introdução Alimentar" },
      { value: "bottle", icon: Calculator, label: "Mamadeira" },
    ],
  },
  {
    id: "rotina",
    label: "Rotina",
    icon: CalendarClock,
    tabs: [
      { value: "appointments", icon: Calendar, label: "Consultas" },
      { value: "routine", icon: CalendarClock, label: "Rotina Diária" },
      { value: "calendar", icon: CalendarDays, label: "Calendário" },
    ],
  },
  {
    id: "mais",
    label: "Mais",
    icon: MoreHorizontal,
    tabs: [
      { value: "achievements", icon: Trophy, label: "Conquistas" },
      { value: "firsts", icon: Camera, label: "Primeiras Vezes" },
      { value: "timeline", icon: History, label: "Linha do Tempo" },
      { value: "report", icon: FileText, label: "Relatório" },
      { value: "export", icon: Download, label: "Exportar" },
      { value: "partner", icon: Users, label: "Parceiro" },
      { value: "notifications", icon: Bell, label: "Notificações" },
    ],
  },
];

export const DashboardBebeTabs = () => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {/* Primary group selector - always visible */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted-foreground/20">
        {tabGroups.map((group) => {
          const GroupIcon = group.icon;
          const isExpanded = expandedGroup === group.id;
          
          // For "Hoje" group with single tab, render as direct TabsTrigger
          if (group.tabs.length === 1) {
            return (
              <TabsTrigger
                key={group.id}
                value={group.tabs[0].value}
                onClick={() => setExpandedGroup(null)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <GroupIcon className="h-4 w-4 shrink-0" />
                {group.label}
              </TabsTrigger>
            );
          }

          return (
            <button
              key={group.id}
              onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm whitespace-nowrap rounded-lg border transition-colors ${
                isExpanded
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <GroupIcon className="h-4 w-4 shrink-0" />
              {group.label}
              <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          );
        })}
      </div>

      {/* Expanded sub-tabs */}
      {expandedGroup && (
        <div className="flex gap-1 flex-wrap p-2 bg-muted/30 rounded-lg border border-border/50 animate-fade-in">
          {tabGroups
            .find((g) => g.id === expandedGroup)
            ?.tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <TabIcon className="h-3.5 w-3.5 shrink-0" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
        </div>
      )}
    </div>
  );
};
