import { Button } from "@/components/ui/button";
import { FileDown, Mail, MessageCircle } from "lucide-react";
import { BabySleepLog } from "@/types/babySleep";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportSonoPDFProps {
  sleepLogs: BabySleepLog[];
  babyName?: string;
}

export const ExportSonoPDF = ({ sleepLogs, babyName }: ExportSonoPDFProps) => {
  const generateSummary = () => {
    const totalHours = sleepLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60;
    const avgHoursPerDay = sleepLogs.length > 0 ? totalHours / Math.min(sleepLogs.length, 7) : 0;
    const napsCount = sleepLogs.filter(l => l.sleep_type === 'diurno').length;

    const summary = `*Relatório de Sono - ${babyName || 'Bebê'}*\n\n` +
      `📊 *Estatísticas*\n` +
      `Total de registros: ${sleepLogs.length}\n` +
      `Total de horas: ${totalHours.toFixed(1)}h\n` +
      `Média por dia: ${avgHoursPerDay.toFixed(1)}h\n` +
      `Sonecas diurnas: ${napsCount}\n\n` +
      `📅 *Últimos registros:*\n` +
      sleepLogs.slice(0, 5).map(log => {
        const date = format(new Date(log.sleep_start), "dd/MM HH:mm", { locale: ptBR });
        const duration = log.duration_minutes 
          ? `${Math.floor(log.duration_minutes / 60)}h${log.duration_minutes % 60}m`
          : 'Em andamento';
        return `${date} - ${duration} (${log.sleep_type})`;
      }).join('\n') +
      `\n\n📱 Gerado pelo Diário de Sono do Bebê`;

    return summary;
  };

  const shareViaWhatsApp = () => {
    const summary = generateSummary();
    const url = `https://wa.me/?text=${encodeURIComponent(summary)}`;
    window.open(url, '_blank');
    toast({
      title: "WhatsApp aberto",
      description: "Compartilhe o relatório de sono!",
    });
  };

  const shareViaEmail = () => {
    const summary = generateSummary();
    const subject = `Relatório de Sono - ${babyName || 'Bebê'}`;
    const body = summary.replace(/\*/g, '').replace(/\n/g, '%0D%0A');
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mailtoUrl;
    toast({
      title: "Email aberto",
      description: "Envie o relatório para quem você quiser!",
    });
  };

  const downloadTxt = () => {
    const summary = generateSummary().replace(/\*/g, '');
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-sono-${format(new Date(), 'dd-MM-yyyy')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Arquivo baixado",
      description: "Relatório salvo com sucesso!",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <FileDown className="mr-2 h-4 w-4" />
          Exportar / Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={shareViaWhatsApp}>
          <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
          Compartilhar no WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareViaEmail}>
          <Mail className="mr-2 h-4 w-4 text-blue-600" />
          Compartilhar por Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadTxt}>
          <FileDown className="mr-2 h-4 w-4" />
          Baixar como TXT
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
