import { useState } from 'react';

import { format } from 'date-fns';
import { FileText, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { BabyMilestoneRecord, DevelopmentSummary } from '@/types/development';
import { AREA_LABELS } from '@/types/development';


interface RelatorioPediatraDialogProps {
  summary: DevelopmentSummary;
  records: BabyMilestoneRecord[];
  babyProfile: {
    baby_name: string;
    birth_date: string;
    birth_type?: string;
    birth_city?: string;
  };
}

export const RelatorioPediatraDialog = ({
  summary,
  records,
  babyProfile,
}: RelatorioPediatraDialogProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      // autoTable is imported for side effects (extends jsPDF)

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Desenvolvimento', pageWidth / 2, y, { align: 'center' });

      y += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${babyProfile.baby_name} - ${summary.age_months} meses`, pageWidth / 2, y, {
        align: 'center',
      });

      y += 15;

      // Baby Info
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Dados do Bebê', 20, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(
        `Data de nascimento: ${format(new Date(babyProfile.birth_date), 'dd/MM/yyyy')}`,
        20,
        y
      );
      y += 5;

      if (babyProfile.birth_type) {
        doc.text(`Tipo de parto: ${babyProfile.birth_type}`, 20, y);
        y += 5;
      }

      if (babyProfile.birth_city) {
        doc.text(`Local de nascimento: ${babyProfile.birth_city}`, 20, y);
        y += 5;
      }

      doc.text(`Data do relatório: ${format(new Date(), 'dd/MM/yyyy')}`, 20, y);
      y += 10;

      // Summary by Area
      const areas = [
        'motor_grosso',
        'motor_fino',
        'linguagem',
        'cognitivo',
        'social_emocional',
      ] as const;

      for (const area of areas) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        const total = summary[`${area}_total` as keyof DevelopmentSummary] as number;
        const achieved = summary[`${area}_achieved` as keyof DevelopmentSummary] as number;
        const percentage = total > 0 ? Math.round((achieved / total) * 100) : 0;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`${AREA_LABELS[area]}: ${achieved}/${total} (${percentage}%)`, 20, y);
        y += 7;

        // Achieved milestones in this area
        const achievedMilestones = records.filter(
          r => r.milestone && r.milestone.area === area && r.status === 'achieved'
        );

        if (achievedMilestones.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);

          achievedMilestones.forEach(record => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }

            const dateStr = record.achieved_date
              ? format(new Date(record.achieved_date), 'dd/MM/yyyy')
              : 'N/A';

            doc.text(`✓ ${record.milestone?.title} (${dateStr})`, 25, y);
            y += 5;

            if (record.mother_notes) {
              doc.setFontSize(8);
              doc.setTextColor(100);
              const lines = doc.splitTextToSize(`   "${record.mother_notes}"`, pageWidth - 50);
              doc.text(lines, 25, y);
              y += lines.length * 4;
              doc.setTextColor(0);
              doc.setFontSize(9);
            }
          });
        }

        y += 5;
      }

      // Attention milestones
      const attentionMilestones = records.filter(r => r.status === 'attention');

      if (attentionMilestones.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Marcos para Observar', 20, y);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        attentionMilestones.forEach(record => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          doc.text(
            `• ${record.milestone?.title} (esperado até ${record.milestone?.age_max_months} meses)`,
            25,
            y
          );
          y += 5;
        });

        y += 5;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          'Nota: Estes marcos passaram da idade típica sem registro. Vale comentar na consulta.',
          25,
          y
        );
        doc.setTextColor(0);
      }

      // Footer
      doc.addPage();
      y = 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações Importantes', 20, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const disclaimer = [
        '• Este relatório é baseado nas observações registradas pela família',
        '• Cada bebê se desenvolve em seu próprio ritmo, variações são normais',
        '• Este documento não substitui avaliação médica profissional',
        '• Em caso de dúvidas, o pediatra é sempre a melhor referência',
        '',
        'Gerado por: MÃE CONSCIENTE - Monitor de Desenvolvimento',
      ];

      disclaimer.forEach(line => {
        doc.text(line, 25, y);
        y += 5;
      });

      // Save
      doc.save(
        `relatorio-desenvolvimento-${babyProfile.baby_name.toLowerCase().replace(/\s/g, '-')}.pdf`
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Gerar Relatório PDF
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Relatório para Pediatra</DialogTitle>
          <DialogDescription>
            Gere um relatório profissional em PDF com todos os marcos de desenvolvimento registrados
            para levar à consulta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm space-y-2">
            <p>
              <strong>O relatório incluirá:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Dados do bebê e idade atual</li>
              <li>Resumo por área de desenvolvimento</li>
              <li>Lista de marcos conquistados com datas</li>
              <li>Observações registradas pela mãe</li>
              <li>Marcos que precisam de atenção</li>
            </ul>
          </div>

          <Button onClick={generatePDF} disabled={isGenerating} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Baixar Relatório PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
