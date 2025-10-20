import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Share2, FileText, Mail } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { BabyFeedingLog, FeedingSettings } from "@/types/babyFeeding";

interface ExportAmamentacaoPDFProps {
  feedingLogs: BabyFeedingLog[];
  settings: FeedingSettings | null;
}

export const ExportAmamentacaoPDF = ({ feedingLogs, settings }: ExportAmamentacaoPDFProps) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text("Relatório de Amamentação", 14, 22);
    
    if (settings) {
      doc.setFontSize(12);
      doc.text(`Bebê: ${settings.baby_name}`, 14, 32);
      doc.text(`Data de Nascimento: ${format(new Date(settings.baby_birthdate), "dd/MM/yyyy", { locale: ptBR })}`, 14, 38);
    }
    
    doc.setFontSize(10);
    doc.text(`Relatório gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 44);

    // Estatísticas
    const totalFeedings = feedingLogs.length;
    const breastfeedingCount = feedingLogs.filter(l => l.feeding_type === "breastfeeding").length;
    const bottleCount = feedingLogs.filter(l => l.feeding_type === "bottle").length;
    const totalVolume = feedingLogs.reduce((sum, l) => sum + (l.volume_ml || 0), 0);
    
    doc.setFontSize(12);
    doc.text("Resumo Geral", 14, 54);
    doc.setFontSize(10);
    doc.text(`Total de Mamadas: ${totalFeedings}`, 14, 62);
    doc.text(`Amamentação: ${breastfeedingCount}`, 14, 68);
    doc.text(`Mamadeiras: ${bottleCount}`, 14, 74);
    doc.text(`Volume Total: ${totalVolume}ml`, 14, 80);

    // Tabela de registros
    const tableData = feedingLogs.map(log => [
      format(new Date(log.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      log.feeding_type === "breastfeeding" ? "Amamentação" : log.feeding_type === "bottle" ? "Mamadeira" : "Ordenha",
      log.duration_minutes ? `${log.duration_minutes} min` : "-",
      log.volume_ml ? `${log.volume_ml}ml` : "-",
      log.notes || "-"
    ]);

    autoTable(doc, {
      startY: 90,
      head: [["Data/Hora", "Tipo", "Duração", "Volume", "Observações"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [248, 215, 218] },
      styles: { fontSize: 8 }
    });

    return doc;
  };

  const handleExportPDF = () => {
    try {
      const doc = generatePDF();
      doc.save(`relatorio-amamentacao-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `📊 Relatório de Amamentação - ${settings?.baby_name || "Bebê"}\n\n` +
      `Total de Mamadas: ${feedingLogs.length}\n` +
      `Amamentação: ${feedingLogs.filter(l => l.feeding_type === "breastfeeding").length}\n` +
      `Mamadeiras: ${feedingLogs.filter(l => l.feeding_type === "bottle").length}\n\n` +
      `Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Relatório de Amamentação - ${settings?.baby_name || "Bebê"}`);
    const body = encodeURIComponent(
      `Relatório de Amamentação\n\n` +
      `Bebê: ${settings?.baby_name || "Não informado"}\n` +
      `Total de Mamadas: ${feedingLogs.length}\n` +
      `Amamentação: ${feedingLogs.filter(l => l.feeding_type === "breastfeeding").length}\n` +
      `Mamadeiras: ${feedingLogs.filter(l => l.feeding_type === "bottle").length}\n\n` +
      `Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Compartilhar Relatório
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Baixar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareViaWhatsApp}>
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar via WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareViaEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Enviar por Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
