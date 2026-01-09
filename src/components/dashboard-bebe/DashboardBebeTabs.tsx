import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, Ruler, Apple, Calculator, Frown, Pill, Calendar, 
  CalendarClock, CalendarDays, FileText, Download, Users, Bell, 
  Trophy, Camera, History 
} from "lucide-react";

interface TabConfig {
  value: string;
  icon: React.ElementType;
  label: string;
  shortLabel: string;
}

const tabs: TabConfig[] = [
  { value: "overview", icon: TrendingUp, label: "Visão Geral", shortLabel: "Geral" },
  { value: "growth", icon: Ruler, label: "Crescimento", shortLabel: "Cresc." },
  { value: "food", icon: Apple, label: "Alimentação", shortLabel: "Alim." },
  { value: "bottle", icon: Calculator, label: "Mamadeira", shortLabel: "Mam." },
  { value: "colic", icon: Frown, label: "Cólicas", shortLabel: "Cól." },
  { value: "medications", icon: Pill, label: "Medicamentos", shortLabel: "Med." },
  { value: "appointments", icon: Calendar, label: "Consultas", shortLabel: "Cons." },
  { value: "routine", icon: CalendarClock, label: "Rotina", shortLabel: "Rot." },
  { value: "calendar", icon: CalendarDays, label: "Calendário", shortLabel: "Cal." },
  { value: "report", icon: FileText, label: "Relatório", shortLabel: "Rel." },
  { value: "export", icon: Download, label: "Exportar", shortLabel: "Exp." },
  { value: "partner", icon: Users, label: "Parceiro", shortLabel: "Parc." },
  { value: "notifications", icon: Bell, label: "Notificações", shortLabel: "Notif." },
  { value: "achievements", icon: Trophy, label: "Conquistas", shortLabel: "Conq." },
  { value: "firsts", icon: Camera, label: "Primeiras Vezes", shortLabel: "1ªs" },
  { value: "timeline", icon: History, label: "Linha do Tempo", shortLabel: "Tempo" },
];

export const DashboardBebeTabs = () => {
  return (
    <TabsList className="flex flex-wrap h-auto gap-1 p-1">
      {tabs.map(({ value, icon: Icon, label, shortLabel }) => (
        <TabsTrigger 
          key={value}
          value={value} 
          className="flex items-center gap-1 text-xs sm:text-sm"
        >
          <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{shortLabel}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
