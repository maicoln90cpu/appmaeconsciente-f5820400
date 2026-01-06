import { Button } from "@/components/ui/button";
import { Download, Share2, Mail } from "lucide-react";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/useToast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ChecklistItem {
  id: string;
  name: string;
  quantity?: string;
  category: string;
  checked: boolean;
  note?: string;
}

interface ExportPDFProps {
  motherItems: ChecklistItem[];
  babyItems: ChecklistItem[];
  companionItems: ChecklistItem[];
  hospital: string;
  deliveryType: string;
}

export const ExportPDF = ({
  motherItems,
  babyItems,
  companionItems,
  hospital,
  deliveryType,
}: ExportPDFProps) => {
  const { toast } = useToast();

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;

    // Título
    doc.setFontSize(20);
    doc.text("Checklist de Mala da Maternidade", 20, yPosition);
    yPosition += 10;

    // Informações gerais
    doc.setFontSize(10);
    if (hospital && hospital !== "none") {
      doc.text(`Hospital: ${hospital}`, 20, yPosition);
      yPosition += 6;
    }
    if (deliveryType !== "indefinido") {
      doc.text(`Tipo de Parto: ${deliveryType === "normal" ? "Normal" : "Cesárea"}`, 20, yPosition);
      yPosition += 6;
    }
    yPosition += 4;

    const addSection = (title: string, items: ChecklistItem[]) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, 20, yPosition);
      yPosition += 8;

      let currentCategory = "";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      items.forEach(item => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }

        if (item.category !== currentCategory) {
          currentCategory = item.category;
          doc.setFont("helvetica", "bold");
          doc.text(`  ${currentCategory}:`, 20, yPosition);
          yPosition += 6;
          doc.setFont("helvetica", "normal");
        }

        // Checkbox
        doc.rect(25, yPosition - 3, 3, 3);
        if (item.checked) {
          doc.text("✓", 25.5, yPosition);
        }

        // Item name
        let itemText = `  ${item.name}`;
        if (item.quantity) {
          itemText += ` (${item.quantity})`;
        }
        doc.text(itemText, 30, yPosition);
        yPosition += 5;

        if (item.note) {
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(`     Nota: ${item.note}`, 30, yPosition);
          doc.setTextColor(0);
          doc.setFontSize(10);
          yPosition += 4;
        }
      });

      yPosition += 6;
    };

    addSection("👩 Mala da Mãe", motherItems);
    addSection("👶 Mala do Bebê", babyItems);
    addSection("👤 Mala do Acompanhante", companionItems);

    // Dicas no final
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("💡 Dicas Importantes:", 20, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const tips = [
      "• Coloque etiquetas com seu nome em todas as malas",
      "• Deixe a mala no porta-malas do carro após 37 semanas",
      "• Tenha cópias digitais dos documentos no celular",
      "• Confirme com o hospital o que eles fornecem",
    ];

    tips.forEach(tip => {
      doc.text(tip, 20, yPosition);
      yPosition += 5;
    });

    doc.save("checklist-mala-maternidade.pdf");

    toast({
      title: "PDF gerado com sucesso!",
      description: "Seu checklist foi baixado.",
    });
  };

  const getShareText = () => {
    const totalItems = motherItems.length + babyItems.length + companionItems.length;
    const checkedItems =
      motherItems.filter(i => i.checked).length +
      babyItems.filter(i => i.checked).length +
      companionItems.filter(i => i.checked).length;

    return `Estou preparando minha mala da maternidade! 🎒\n\nProgresso: ${checkedItems}/${totalItems} itens prontos (${Math.round((checkedItems / totalItems) * 100)}%)\n\n👩 Mala da Mãe: ${motherItems.filter(i => i.checked).length}/${motherItems.length}\n👶 Mala do Bebê: ${babyItems.filter(i => i.checked).length}/${babyItems.length}\n👤 Mala do Acompanhante: ${companionItems.filter(i => i.checked).length}/${companionItems.length}`;
  };

  const shareViaWhatsApp = () => {
    const text = getShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast({
      title: "Compartilhando via WhatsApp",
    });
  };

  const shareViaEmail = () => {
    const text = getShareText();
    const subject = "Meu Checklist de Mala da Maternidade";
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    window.location.href = url;
    toast({
      title: "Abrindo email...",
    });
  };

  const shareGeneric = async () => {
    const text = getShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Checklist de Mala da Maternidade",
          text: text,
        });
        toast({
          title: "Compartilhado com sucesso!",
        });
      } catch (error) {
        // Usuário cancelou
      }
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(text);
      toast({
        title: "Copiado para a área de transferência!",
        description: "Cole onde quiser compartilhar.",
      });
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={generatePDF} className="w-full" variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Baixar PDF
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full" variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar Progresso
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={shareViaWhatsApp}>
            <Share2 className="h-4 w-4 mr-2 text-green-600" />
            Compartilhar via WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareViaEmail}>
            <Mail className="h-4 w-4 mr-2 text-blue-600" />
            Compartilhar via Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareGeneric}>
            <Share2 className="h-4 w-4 mr-2" />
            Outras opções
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
