import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, Baby, Ruler, Apple, Pill, Calendar, Moon, Milk, Activity } from "lucide-react";
import { useVaccination } from "@/hooks/useVaccination";
import { useGrowthMeasurements } from "@/hooks/useGrowthMeasurements";
import { useBabyAppointments } from "@/hooks/useBabyAppointments";
import { useBabyMedications } from "@/hooks/useBabyMedications";
import { useBabyColic } from "@/hooks/useBabyColic";
import { useFoodIntroduction } from "@/hooks/useFoodIntroduction";
import { useDevelopmentMilestones } from "@/hooks/useDevelopmentMilestones";
import { format, differenceInMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PediatricReportGeneratorProps {
  babyProfileId?: string;
}

export const PediatricReportGenerator = ({ babyProfileId }: PediatricReportGeneratorProps) => {
  const { profiles } = useVaccination();
  const { measurements } = useGrowthMeasurements(babyProfileId);
  const { pastAppointments, upcomingAppointments } = useBabyAppointments(babyProfileId);
  const { medications } = useBabyMedications(babyProfileId);
  const { colicLogs, stats: colicStats } = useBabyColic(babyProfileId);
  const { foodLogs } = useFoodIntroduction(babyProfileId);
  const { records: milestoneRecords } = useDevelopmentMilestones(babyProfileId);

  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState({
    basicInfo: true,
    growth: true,
    feeding: true,
    sleep: true,
    medications: true,
    colic: true,
    development: true,
    appointments: true,
    foodIntroduction: true,
  });

  const babyProfile = profiles.find(p => p.id === babyProfileId);

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const months = differenceInMonths(now, birth);
    const days = differenceInDays(now, birth) % 30;
    
    if (months < 1) return `${days} dias`;
    if (months < 12) return `${months} meses e ${days} dias`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years} ano${years > 1 ? 's' : ''} e ${remainingMonths} meses`;
  };

  const generatePDF = async () => {
    if (!babyProfile) return;

    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório Pediátrico", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Basic Info
      if (sections.basicInfo) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Informações do Bebê", 14, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Nome: ${babyProfile.baby_name}`, 14, yPos);
        yPos += 5;
        doc.text(`Data de Nascimento: ${format(new Date(babyProfile.birth_date), "dd/MM/yyyy", { locale: ptBR })}`, 14, yPos);
        yPos += 5;
        doc.text(`Idade Atual: ${calculateAge(babyProfile.birth_date)}`, 14, yPos);
        yPos += 5;
        if (babyProfile.birth_type) {
          doc.text(`Tipo de Parto: ${babyProfile.birth_type === 'normal' ? 'Normal' : 'Cesárea'}`, 14, yPos);
          yPos += 5;
        }
        yPos += 10;
      }

      // Growth Measurements
      if (sections.growth && measurements && measurements.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Medidas de Crescimento", 14, yPos);
        yPos += 8;

        const growthData = measurements.slice(0, 10).map(m => [
          format(new Date(m.measurement_date), "dd/MM/yyyy"),
          m.weight_kg ? `${m.weight_kg} kg` : '-',
          m.height_cm ? `${m.height_cm} cm` : '-',
          m.head_circumference_cm ? `${m.head_circumference_cm} cm` : '-',
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Data', 'Peso', 'Altura', 'Perímetro Cefálico']],
          body: growthData,
          theme: 'striped',
          headStyles: { fillColor: [147, 51, 234] },
          margin: { left: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Medications
      if (sections.medications && medications && medications.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Medicamentos em Uso", 14, yPos);
        yPos += 8;

        const medData = medications.map(m => [
          m.medication_name,
          m.dosage,
          m.frequency,
          m.time_of_day?.join(', ') || '-',
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Medicamento', 'Dosagem', 'Frequência', 'Horários']],
          body: medData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Colic Stats
      if (sections.colic && colicStats && colicStats.totalEpisodes > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Histórico de Cólicas", 14, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Total de episódios: ${colicStats.totalEpisodes}`, 14, yPos);
        yPos += 5;
        doc.text(`Episódios esta semana: ${colicStats.episodesThisWeek}`, 14, yPos);
        yPos += 5;
        doc.text(`Duração média: ${Math.round(colicStats.averageDuration)} minutos`, 14, yPos);
        yPos += 5;
        if (colicStats.mostCommonTrigger) {
          doc.text(`Gatilho mais comum: ${colicStats.mostCommonTrigger}`, 14, yPos);
          yPos += 5;
        }
        if (colicStats.mostEffectiveRelief) {
          doc.text(`Método de alívio mais eficaz: ${colicStats.mostEffectiveRelief}`, 14, yPos);
          yPos += 5;
        }
        yPos += 10;
      }

      // Development Milestones
      if (sections.development && milestoneRecords && milestoneRecords.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Marcos do Desenvolvimento", 14, yPos);
        yPos += 8;

        const achievedMilestones = milestoneRecords.filter(m => m.status === 'achieved');
        
        if (achievedMilestones.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Marcos alcançados: ${achievedMilestones.length}`, 14, yPos);
          yPos += 10;
        }
      }

      // Food Introduction
      if (sections.foodIntroduction && foodLogs && foodLogs.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Introdução Alimentar", 14, yPos);
        yPos += 8;

        const recentFoods = foodLogs.slice(0, 10).map(f => [
          f.food_name,
          f.food_category,
          format(new Date(f.introduction_date), "dd/MM/yyyy"),
          f.accepted ? 'Aceito' : 'Não aceito',
          f.reaction_type || '-',
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Alimento', 'Categoria', 'Data', 'Aceitação', 'Reação']],
          body: recentFoods,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Appointments
      if (sections.appointments) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Próximas Consultas", 14, yPos);
        yPos += 8;

        if (upcomingAppointments && upcomingAppointments.length > 0) {
          const aptData = upcomingAppointments.slice(0, 5).map(a => [
            a.title,
            format(new Date(a.scheduled_date), "dd/MM/yyyy"),
            a.scheduled_time?.slice(0, 5) || '-',
            a.doctor_name || '-',
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [['Consulta', 'Data', 'Horário', 'Profissional']],
            body: aptData,
            theme: 'striped',
            headStyles: { fillColor: [249, 115, 22] },
            margin: { left: 14 },
          });
        } else {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text("Nenhuma consulta agendada", 14, yPos);
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Página ${i} de ${pageCount} - Gerado pelo app Meu Bebê`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Save
      doc.save(`relatorio-pediatrico-${babyProfile.baby_name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!babyProfileId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Baby className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Selecione um bebê para gerar o relatório</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Relatório Pediátrico
        </CardTitle>
        <CardDescription>
          Gere um PDF completo para levar nas consultas médicas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Seções do Relatório</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {[
              { key: 'basicInfo', label: 'Dados', icon: Baby },
              { key: 'growth', label: 'Crescimento', icon: Ruler },
              { key: 'medications', label: 'Remédios', icon: Pill },
              { key: 'colic', label: 'Cólicas', icon: Activity },
              { key: 'development', label: 'Desenv.', icon: Activity },
              { key: 'foodIntroduction', label: 'Alimentar', icon: Apple },
              { key: 'appointments', label: 'Consultas', icon: Calendar },
            ].map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className={`flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                  sections[key as keyof typeof sections]
                    ? 'bg-primary/10 border-primary'
                    : 'bg-muted/50 border-muted'
                }`}
                onClick={() => toggleSection(key as keyof typeof sections)}
              >
                <Checkbox checked={sections[key as keyof typeof sections]} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-[10px] sm:text-sm truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Info */}
        {babyProfile && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Prévia do Relatório</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>👶 {babyProfile.baby_name} - {calculateAge(babyProfile.birth_date)}</p>
              <p>📊 {measurements?.length || 0} medidas de crescimento</p>
              <p>💊 {medications?.length || 0} medicamentos ativos</p>
              <p>🍎 {foodLogs?.length || 0} alimentos introduzidos</p>
              <p>📅 {upcomingAppointments?.length || 0} consultas agendadas</p>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={generatePDF}
          disabled={isGenerating}
          className="w-full gap-2"
          size="lg"
        >
          {isGenerating ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Baixar Relatório PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
