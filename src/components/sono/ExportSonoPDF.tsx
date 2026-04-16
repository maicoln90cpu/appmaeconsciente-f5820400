import { Button } from "@/components/ui/button";
import { Download, Share2, Mail } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BabySleepLog } from "@/types/babySleep";
import { usePDFExport, shareViaWhatsApp, shareViaEmail, downloadAsText } from "@/hooks/usePDFExport";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ExportSonoPDFProps {
  sleepLogs: BabySleepLog[];
  babyName?: string;
}

export const ExportSonoPDF = ({ sleepLogs, babyName }: ExportSonoPDFProps) => {
  const { generatePDF, formatDate } = usePDFExport();

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

  const downloadPDF = async () => {
    const sortedLogs = [...sleepLogs]
      .sort((a, b) => new Date(b.sleep_start).getTime() - new Date(a.sleep_start).getTime())
      .slice(0, 30);

    const totalHours = sleepLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60;

    await generatePDF({
      title: `Diário de Sono${babyName ? ` - ${babyName}` : ''}`,
      filename: `diario-sono-${babyName || 'bebe'}`,
      sections: [
        {
          title: "Registros de Sono",
          type: "table",
          tableHead: ["Data", "Tipo", "Horário", "Duração", "Local"],
          tableBody: sortedLogs.map((log) => [
            formatDate(log.sleep_start),
            log.sleep_type === 'diurno' ? 'Diurno' : 'Noturno',
            `${format(new Date(log.sleep_start), "HH:mm")} - ${log.sleep_end ? format(new Date(log.sleep_end), "HH:mm") : "—"}`,
            log.duration_minutes ? `${Math.floor(log.duration_minutes / 60)}h${log.duration_minutes % 60}m` : "—",
            log.location || "—",
          ]),
          tableColor: [147, 51, 234],
        },
        {
          title: "Estatísticas",
          type: "stats",
          content: [
            `Total de sono registrado: ${Math.round(totalHours * 10) / 10}h`,
            `Total de registros: ${sleepLogs.length}`,
          ],
        },
      ],
      footer: "Página {page} de {pages} - Gerado pelo MÃE CONSCIENTE",
    });
  };

  const downloadTxt = () => {
    const summary = generateSummary();
    downloadAsText(summary, `diario-sono-${babyName || 'bebe'}-${format(new Date(), "dd-MM-yyyy")}.txt`);
    toast("Arquivo baixado!", { description: "Seu resumo foi salvo como TXT." });
  };

  const handleShareWhatsApp = () => {
    shareViaWhatsApp(generateSummary());
    toast("Compartilhando via WhatsApp");
  };

  const handleShareEmail = () => {
    shareViaEmail(`Diário de Sono${babyName ? ` - ${babyName}` : ''}`, generateSummary());
    toast("Abrindo email...");
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
          <DropdownMenuItem onClick={handleShareWhatsApp}>
            <Share2 className="h-4 w-4 mr-2 text-green-600" />
            Via WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareEmail}>
            <Mail className="h-4 w-4 mr-2 text-blue-600" />
            Via Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
