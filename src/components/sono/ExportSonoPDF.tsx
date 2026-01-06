import { Button } from "@/components/ui/button";
import { Download, Share2, Mail } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BabySleepLog } from "@/types/babySleep";
import { useToast } from "@/hooks/useToast";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExportSonoPDFProps {
  sleepLogs: BabySleepLog[];
  babyName?: string;
}

export const ExportSonoPDF = ({ sleepLogs, babyName }: ExportSonoPDFProps) => {
  const { toast } = useToast();

  const generateSummary = () => {
    const sortedLogs = [...sleepLogs].sort(
      (a, b) => new Date(b.sleep_start).getTime() - new Date(a.sleep_start).getTime()
    );

    const last7Days = sortedLogs.slice(0, 20);
    
    let summary = `📊 Diário de Sono${babyName ? ` - ${babyName}` : ''}\n`;
    summary += `Data: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}\n\n`;
    summary += `🌙 Últimos Registros de Sono:\n\n`;

    last7Days.forEach((log) => {
      const date = format(new Date(log.sleep_start), "dd/MM/yyyy", { locale: ptBR });
      const startTime = format(new Date(log.sleep_start), "HH:mm", { locale: ptBR });
      const endTime = log.sleep_end ? format(new Date(log.sleep_end), "HH:mm", { locale: ptBR }) : "Em andamento";
      const duration = log.duration_minutes ? `${Math.floor(log.duration_minutes / 60)}h${log.duration_minutes % 60}m` : "—";
      const type = log.sleep_type === 'diurno' ? '☀️ Diurno' : '🌙 Noturno';
      
      summary += `${date} | ${type}\n`;
      summary += `  ⏰ ${startTime} - ${endTime} (${duration})\n`;
      if (log.location) summary += `  📍 ${log.location}\n`;
      if (log.notes) summary += `  📝 ${log.notes}\n`;
      summary += '\n';
    });

    const totalHours = sleepLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60;
    summary += `\n📈 Total registrado: ${Math.round(totalHours * 10) / 10}h\n`;
    summary += `📅 ${sleepLogs.length} registros no total`;

    return summary;
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;

    // Título
    doc.setFontSize(20);
    doc.text(`Diário de Sono${babyName ? ` - ${babyName}` : ''}`, 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, yPosition);
    yPosition += 15;

    // Logs
    const sortedLogs = [...sleepLogs].sort(
      (a, b) => new Date(b.sleep_start).getTime() - new Date(a.sleep_start).getTime()
    );

    const last30Days = sortedLogs.slice(0, 30);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Registros de Sono", 20, yPosition);
    yPosition += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    last30Days.forEach((log) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      const date = format(new Date(log.sleep_start), "dd/MM/yyyy", { locale: ptBR });
      const startTime = format(new Date(log.sleep_start), "HH:mm", { locale: ptBR });
      const endTime = log.sleep_end ? format(new Date(log.sleep_end), "HH:mm", { locale: ptBR }) : "Em andamento";
      const duration = log.duration_minutes ? `${Math.floor(log.duration_minutes / 60)}h${log.duration_minutes % 60}m` : "—";
      const type = log.sleep_type === 'diurno' ? 'Diurno' : 'Noturno';

      doc.setFont("helvetica", "bold");
      doc.text(`${date} - ${type}`, 20, yPosition);
      yPosition += 5;

      doc.setFont("helvetica", "normal");
      doc.text(`  Horário: ${startTime} - ${endTime} (${duration})`, 20, yPosition);
      yPosition += 4;

      if (log.location) {
        doc.text(`  Local: ${log.location}`, 20, yPosition);
        yPosition += 4;
      }

      if (log.wakeup_mood) {
        doc.text(`  Humor ao acordar: ${log.wakeup_mood}`, 20, yPosition);
        yPosition += 4;
      }

      if (log.notes) {
        doc.setFontSize(8);
        doc.text(`  Observações: ${log.notes}`, 20, yPosition);
        doc.setFontSize(9);
        yPosition += 4;
      }

      yPosition += 3;
    });

    // Estatísticas
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Estatísticas", 20, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const totalHours = sleepLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60;
    doc.text(`Total de sono registrado: ${Math.round(totalHours * 10) / 10}h`, 20, yPosition);
    yPosition += 5;
    doc.text(`Total de registros: ${sleepLogs.length}`, 20, yPosition);

    doc.save(`diario-sono-${babyName || 'bebe'}-${format(new Date(), "dd-MM-yyyy")}.pdf`);

    toast({
      title: "PDF gerado com sucesso!",
      description: "Seu diário de sono foi baixado.",
    });
  };

  const downloadTxt = () => {
    const summary = generateSummary();
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diario-sono-${babyName || 'bebe'}-${format(new Date(), "dd-MM-yyyy")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Arquivo baixado!",
      description: "Seu resumo foi salvo como TXT.",
    });
  };

  const shareViaWhatsApp = () => {
    const summary = generateSummary();
    const url = `https://wa.me/?text=${encodeURIComponent(summary)}`;
    window.open(url, '_blank');
    toast({
      title: "Compartilhando via WhatsApp",
    });
  };

  const shareViaEmail = () => {
    const summary = generateSummary();
    const subject = `Diário de Sono${babyName ? ` - ${babyName}` : ''}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`;
    window.location.href = url;
    toast({
      title: "Abrindo email...",
    });
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={downloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF Completo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadTxt}>
            <Download className="h-4 w-4 mr-2" />
            Baixar Resumo (TXT)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={shareViaWhatsApp}>
            <Share2 className="h-4 w-4 mr-2 text-green-600" />
            Via WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareViaEmail}>
            <Mail className="h-4 w-4 mr-2 text-blue-600" />
            Via Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
