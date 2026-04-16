import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Share2, FileText, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { usePDFExport, shareViaWhatsApp, shareViaEmail } from '@/hooks/usePDFExport';

import type { BabyFeedingLog, FeedingSettings } from '@/types/babyFeeding';


interface ExportAmamentacaoPDFProps {
  feedingLogs: BabyFeedingLog[];
  settings: FeedingSettings | null;
}

export const ExportAmamentacaoPDF = ({ feedingLogs, settings }: ExportAmamentacaoPDFProps) => {
  const { generatePDF, formatDate } = usePDFExport();

  const breastfeedingCount = feedingLogs.filter(l => l.feeding_type === 'breastfeeding').length;
  const bottleCount = feedingLogs.filter(l => l.feeding_type === 'bottle').length;
  const totalVolume = feedingLogs.reduce((sum, l) => sum + (l.volume_ml || 0), 0);

  const handleExportPDF = async () => {
    try {
      await generatePDF({
        title: 'Relatório de Amamentação',
        subtitle: settings ? `Bebê: ${settings.baby_name}` : undefined,
        filename: `relatorio-amamentacao`,
        sections: [
          ...(settings
            ? [
                {
                  title: 'Dados do Bebê',
                  type: 'text' as const,
                  content: [
                    `Nome: ${settings.baby_name}`,
                    `Data de Nascimento: ${formatDate(settings.baby_birthdate)}`,
                  ],
                },
              ]
            : []),
          {
            title: 'Resumo Geral',
            type: 'stats' as const,
            content: [
              `Total de Mamadas: ${feedingLogs.length}`,
              `Amamentação: ${breastfeedingCount}`,
              `Mamadeiras: ${bottleCount}`,
              `Volume Total: ${totalVolume}ml`,
            ],
          },
          {
            title: 'Registros',
            type: 'table' as const,
            tableHead: ['Data/Hora', 'Tipo', 'Duração', 'Volume', 'Observações'],
            tableBody: feedingLogs.map(log => [
              format(new Date(log.start_time), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
              log.feeding_type === 'breastfeeding'
                ? 'Amamentação'
                : log.feeding_type === 'bottle'
                  ? 'Mamadeira'
                  : 'Ordenha',
              log.duration_minutes ? `${log.duration_minutes} min` : '-',
              log.volume_ml ? `${log.volume_ml}ml` : '-',
              log.notes || '-',
            ]),
            tableColor: [248, 215, 218],
          },
        ],
        footer: 'Gerado pelo MÃE CONSCIENTE',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const getSummaryText = () => {
    return (
      `📊 Relatório de Amamentação - ${settings?.baby_name || 'Bebê'}\n\n` +
      `Total de Mamadas: ${feedingLogs.length}\n` +
      `Amamentação: ${breastfeedingCount}\n` +
      `Mamadeiras: ${bottleCount}\n\n` +
      `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
    );
  };

  const handleShareWhatsApp = () => {
    shareViaWhatsApp(getSummaryText());
  };

  const handleShareEmail = () => {
    shareViaEmail(`Relatório de Amamentação - ${settings?.baby_name || 'Bebê'}`, getSummaryText());
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
        <DropdownMenuItem onClick={handleShareWhatsApp}>
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar via WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Enviar por Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
