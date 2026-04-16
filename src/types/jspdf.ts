import type { jsPDF } from 'jspdf';

/**
 * Extended jsPDF type that includes the lastAutoTable property
 * added by jspdf-autotable plugin
 */
export interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

/**
 * Type guard to safely access lastAutoTable
 */
export const getLastAutoTableY = (doc: jsPDF, defaultY: number = 30): number => {
  const extendedDoc = doc as unknown as jsPDFWithAutoTable;
  return extendedDoc.lastAutoTable?.finalY ?? defaultY;
};
