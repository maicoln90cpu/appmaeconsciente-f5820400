import { useCallback } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import type { jsPDF } from 'jspdf';

import { getLastAutoTableY } from '@/types/jspdf';


export interface PDFSection {
  title: string;
  type: 'text' | 'table' | 'stats';
  content?: string[];
  tableHead?: string[];
  tableBody?: string[][];
  tableColor?: [number, number, number];
}

export interface PDFConfig {
  title: string;
  subtitle?: string;
  filename: string;
  sections: PDFSection[];
  footer?: string;
}

interface PDFExportReturn {
  generatePDF: (config: PDFConfig) => Promise<void>;
  loadJsPDF: () => Promise<typeof import('jspdf').default>;
  loadAutoTable: () => Promise<typeof import('jspdf-autotable').default>;
  formatDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
}

export const usePDFExport = (): PDFExportReturn => {
  const loadJsPDF = useCallback(async () => {
    const { default: jsPDF } = await import('jspdf');
    return jsPDF;
  }, []);

  const loadAutoTable = useCallback(async () => {
    const { default: autoTable } = await import('jspdf-autotable');
    return autoTable;
  }, []);

  const formatDate = useCallback((date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'dd/MM/yyyy', { locale: ptBR });
  }, []);

  const formatDateTime = useCallback((date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  }, []);

  const addSection = useCallback(
    (
      doc: jsPDF,
      section: PDFSection,
      yPos: number,
      autoTable: typeof import('jspdf-autotable').default
    ): number => {
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = yPos;

      // Verificar if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Section title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, 14, y);
      y += 8;

      if (section.type === 'text' && section.content) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        section.content.forEach(line => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 14, y);
          y += 5;
        });
        y += 5;
      }

      if (section.type === 'table' && section.tableHead && section.tableBody) {
        autoTable(doc, {
          startY: y,
          head: [section.tableHead],
          body: section.tableBody,
          theme: 'striped',
          headStyles: {
            fillColor: section.tableColor || [147, 51, 234],
          },
          margin: { left: 14 },
        });
        y = getLastAutoTableY(doc, y) + 10;
      }

      if (section.type === 'stats' && section.content) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        section.content.forEach(line => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 14, y);
          y += 5;
        });
        y += 5;
      }

      return y;
    },
    []
  );

  const generatePDF = useCallback(
    async (config: PDFConfig) => {
      try {
        const [jsPDF, autoTable] = await Promise.all([loadJsPDF(), loadAutoTable()]);

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;

        // Header / Title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(config.title, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        // Subtitle
        if (config.subtitle) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text(config.subtitle, pageWidth / 2, yPos, { align: 'center' });
          yPos += 8;
        }

        // Generated date
        doc.setFontSize(10);
        doc.text(`Gerado em: ${formatDateTime(new Date())}`, pageWidth / 2, yPos, {
          align: 'center',
        });
        yPos += 15;

        // Sections
        for (const section of config.sections) {
          yPos = addSection(doc, section, yPos, autoTable);
        }

        // Footer on all pages
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.text(
            config.footer || `Página ${i} de ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }

        // Save
        doc.save(`${config.filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

        toast('PDF gerado com sucesso!', { description: 'Seu relatório foi baixado.' });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Erro ao gerar PDF', { description: 'Tente novamente.' });
      }
    },
    [loadJsPDF, loadAutoTable, formatDateTime, addSection, toast]
  );

  return {
    generatePDF,
    loadJsPDF,
    loadAutoTable,
    formatDate,
    formatDateTime,
  };
};

// Utility functions for sharing
export const shareViaWhatsApp = (text: string): void => {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

export const shareViaEmail = (subject: string, body: string): void => {
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
};

export const downloadAsText = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
