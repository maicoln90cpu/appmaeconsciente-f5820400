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
    <TabsList className="w-full overflow-x-auto scrollbar-hide flex flex-nowrap h-auto gap-0.5 p-1 justify-start">
      {tabs.map(({ value, icon: Icon, label, shortLabel }) => (
        <TabsTrigger 
          key={value}
          value={value} 
          className="flex items-center gap-1 text-[10px] xs:text-xs sm:text-sm px-2 py-1.5 shrink-0 min-w-0"
        >
          <Icon className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 shrink-0" />
          <span className="hidden xs:inline truncate">{shortLabel}</span>
          <span className="xs:hidden">{shortLabel.substring(0, 3)}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
