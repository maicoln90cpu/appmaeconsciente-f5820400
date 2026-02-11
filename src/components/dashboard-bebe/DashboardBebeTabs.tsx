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
    <div className="relative mb-4">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent pb-1">
        <TabsList className="inline-flex w-max gap-1 h-auto p-1.5 bg-muted/50">
          {tabs.map(({ value, icon: Icon, label, shortLabel }) => (
            <TabsTrigger 
              key={value}
              value={value} 
              className="flex items-center gap-1 text-[10px] md:text-xs px-2.5 py-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
              <span className="hidden md:inline">{label}</span>
              <span className="md:hidden">{shortLabel}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </div>
  );
};
