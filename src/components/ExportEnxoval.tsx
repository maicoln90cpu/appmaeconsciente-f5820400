import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { EnxovalItem } from "@/types/enxoval";
import { getLastAutoTableY } from "@/types/jspdf";
import { formatCurrency } from "@/lib/calculations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ExportEnxovalProps {
  items: EnxovalItem[];
}

export const ExportEnxoval = ({ items }: ExportEnxovalProps) => {

  const exportToPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable")
    ]);

    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Meu Enxoval do Bebê", 14, 20);
    
    const tableData = items.map(item => [
      item.category,
      item.item,
      item.necessity,
      item.plannedQty.toString(),
      formatCurrency(item.plannedPrice),
      item.boughtQty.toString(),
      formatCurrency(item.unitPricePaid),
      formatCurrency(item.subtotalPaid),
      item.status,
    ]);

    autoTable(doc, {
      head: [["Categoria", "Item", "Necessidade", "Qtd Plan.", "Preço Plan.", "Qtd Comp.", "Preço Pago", "Total", "Status"]],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    const totalPaid = items.reduce((sum, item) => sum + item.subtotalPaid, 0);
    const finalY = getLastAutoTableY(doc, 30);
    
    doc.setFontSize(12);
    doc.text(`Total Gasto: ${formatCurrency(totalPaid)}`, 14, finalY + 10);
    
    doc.save("enxoval.pdf");
    
    toast("PDF Gerado", { description: "Seu enxoval foi exportado com sucesso!" });
  };

  const exportToExcel = async () => {
    const XLSX = await import("xlsx");

    const worksheetData = items.map(item => ({
      Data: item.date ? new Date(item.date).toLocaleDateString('pt-BR') : '',
      Categoria: item.category,
      Item: item.item,
      Necessidade: item.necessity,
      Prioridade: item.priority,
      Tamanho: item.size || '',
      "Qtd Planejada": item.plannedQty,
      "Preço Planejado": item.plannedPrice,
      "Qtd Comprada": item.boughtQty,
      "Preço Pago": item.unitPricePaid,
      Frete: item.frete,
      Desconto: item.desconto,
      "Total Planejado": item.subtotalPlanned,
      "Total Pago": item.subtotalPaid,
      Economia: item.savings,
      Status: item.status,
      Loja: item.store || '',
      Link: item.link || '',
      Observações: item.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enxoval");
    
    XLSX.writeFile(workbook, "enxoval.xlsx");
    
    toast("Excel Gerado", { description: "Seu enxoval foi exportado com sucesso!" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar para PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar para Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
