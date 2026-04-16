import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, FileText, Baby } from 'lucide-react';
import { useVaccination } from '@/hooks/useVaccination';
import { useGrowthMeasurements } from '@/hooks/useGrowthMeasurements';
import { useBabyAppointments } from '@/hooks/useBabyAppointments';
import { useBabyMedications } from '@/hooks/useBabyMedications';
import { useBabyColic } from '@/hooks/useBabyColic';
import { useFoodIntroduction } from '@/hooks/useFoodIntroduction';
import { useBabyRoutines } from '@/hooks/useBabyRoutines';
import { format } from 'date-fns';

interface DataExporterProps {
  babyProfileId?: string;
}

export const DataExporter = ({ babyProfileId }: DataExporterProps) => {
  const { profiles } = useVaccination();
  const { measurements } = useGrowthMeasurements(babyProfileId);
  const { appointments } = useBabyAppointments(babyProfileId);
  const { medications } = useBabyMedications(babyProfileId);
  const { colicLogs } = useBabyColic(babyProfileId);
  const { foodLogs } = useFoodIntroduction(babyProfileId);
  const { routines } = useBabyRoutines(babyProfileId);

  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'json'>('xlsx');
  const [sections, setSections] = useState({
    profile: true,
    growth: true,
    appointments: true,
    medications: true,
    colic: true,
    food: true,
    routines: true,
  });

  const babyProfile = profiles.find(p => p.id === babyProfileId);

  const exportToExcel = async () => {
    if (!babyProfile) return;

    setIsExporting(true);

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      // Profile Sheet
      if (sections.profile) {
        const profileData = [
          {
            Nome: babyProfile.baby_name,
            'Data de Nascimento': format(new Date(babyProfile.birth_date), 'dd/MM/yyyy'),
            'Tipo de Parto': babyProfile.birth_type || '-',
            'Cidade de Nascimento': babyProfile.birth_city || '-',
          },
        ];
        const profileSheet = XLSX.utils.json_to_sheet(profileData);
        XLSX.utils.book_append_sheet(workbook, profileSheet, 'Perfil');
      }

      // Growth Sheet
      if (sections.growth && measurements && measurements.length > 0) {
        const growthData = measurements.map(m => ({
          Data: format(new Date(m.measurement_date), 'dd/MM/yyyy'),
          'Peso (kg)': m.weight_kg || '-',
          'Altura (cm)': m.height_cm || '-',
          'Perímetro Cefálico (cm)': m.head_circumference_cm || '-',
          Observações: m.notes || '-',
        }));
        const growthSheet = XLSX.utils.json_to_sheet(growthData);
        XLSX.utils.book_append_sheet(workbook, growthSheet, 'Crescimento');
      }

      // Appointments Sheet
      if (sections.appointments && appointments && appointments.length > 0) {
        const aptData = appointments.map(a => ({
          Título: a.title,
          Tipo: a.appointment_type,
          Data: format(new Date(a.scheduled_date), 'dd/MM/yyyy'),
          Horário: a.scheduled_time || '-',
          Médico: a.doctor_name || '-',
          Local: a.location || '-',
          Concluída: a.completed ? 'Sim' : 'Não',
          Observações: a.notes || '-',
        }));
        const aptSheet = XLSX.utils.json_to_sheet(aptData);
        XLSX.utils.book_append_sheet(workbook, aptSheet, 'Consultas');
      }

      // Medications Sheet
      if (sections.medications && medications && medications.length > 0) {
        const medData = medications.map(m => ({
          Medicamento: m.medication_name,
          Dosagem: m.dosage,
          Frequência: m.frequency,
          Horários: m.time_of_day?.join(', ') || '-',
          'Data Início': format(new Date(m.start_date), 'dd/MM/yyyy'),
          'Data Fim': m.end_date ? format(new Date(m.end_date), 'dd/MM/yyyy') : '-',
          Ativo: m.is_active ? 'Sim' : 'Não',
          Observações: m.notes || '-',
        }));
        const medSheet = XLSX.utils.json_to_sheet(medData);
        XLSX.utils.book_append_sheet(workbook, medSheet, 'Medicamentos');
      }

      // Colic Sheet
      if (sections.colic && colicLogs && colicLogs.length > 0) {
        const colicData = colicLogs.map(c => ({
          'Data/Hora': format(new Date(c.start_time), 'dd/MM/yyyy HH:mm'),
          'Duração (min)': c.duration_minutes || '-',
          Intensidade: c.intensity ? `${c.intensity}/5` : '-',
          Gatilhos: c.triggers?.join(', ') || '-',
          'Métodos de Alívio': c.relief_methods?.join(', ') || '-',
          Observações: c.notes || '-',
        }));
        const colicSheet = XLSX.utils.json_to_sheet(colicData);
        XLSX.utils.book_append_sheet(workbook, colicSheet, 'Cólicas');
      }

      // Food Introduction Sheet
      if (sections.food && foodLogs && foodLogs.length > 0) {
        const foodData = foodLogs.map(f => ({
          Alimento: f.food_name,
          Categoria: f.food_category,
          'Data Introdução': format(new Date(f.introduction_date), 'dd/MM/yyyy'),
          Aceito: f.accepted ? 'Sim' : 'Não',
          'Tipo de Reação': f.reaction_type || '-',
          Sintomas: f.reaction_symptoms?.join(', ') || '-',
          'É Alergênico': f.is_allergenic ? 'Sim' : 'Não',
          Observações: f.notes || '-',
        }));
        const foodSheet = XLSX.utils.json_to_sheet(foodData);
        XLSX.utils.book_append_sheet(workbook, foodSheet, 'Introdução Alimentar');
      }

      // Routines Sheet
      if (sections.routines && routines && routines.length > 0) {
        const routineData = routines.map(r => ({
          Título: r.title,
          Tipo: r.routine_type,
          Horário: r.scheduled_time,
          'Duração (min)': r.duration_minutes || '-',
          'Dias da Semana':
            r.days_of_week
              ?.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d])
              .join(', ') || '-',
          Ativo: r.is_active ? 'Sim' : 'Não',
          Observações: r.notes || '-',
        }));
        const routineSheet = XLSX.utils.json_to_sheet(routineData);
        XLSX.utils.book_append_sheet(workbook, routineSheet, 'Rotinas');
      }

      // Save file
      const fileName = `dados-${babyProfile.baby_name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    if (!babyProfile) return;

    setIsExporting(true);

    try {
      const data: Record<string, any> = {
        exportDate: new Date().toISOString(),
        babyName: babyProfile.baby_name,
      };

      if (sections.profile) data.profile = babyProfile;
      if (sections.growth) data.growth = measurements;
      if (sections.appointments) data.appointments = appointments;
      if (sections.medications) data.medications = medications;
      if (sections.colic) data.colicLogs = colicLogs;
      if (sections.food) data.foodIntroduction = foodLogs;
      if (sections.routines) data.routines = routines;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${babyProfile.baby_name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'xlsx') {
      exportToExcel();
    } else {
      exportToJSON();
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
          <p>Selecione um bebê para exportar dados</p>
        </CardContent>
      </Card>
    );
  }

  const dataCounts = {
    profile: 1,
    growth: measurements?.length || 0,
    appointments: appointments?.length || 0,
    medications: medications?.length || 0,
    colic: colicLogs?.length || 0,
    food: foodLogs?.length || 0,
    routines: routines?.length || 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Exportação de Dados
        </CardTitle>
        <CardDescription>Faça backup dos dados do bebê em Excel ou JSON</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div className="flex gap-2">
          <Button
            variant={exportFormat === 'xlsx' ? 'default' : 'outline'}
            onClick={() => setExportFormat('xlsx')}
            className="flex-1 gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel (.xlsx)
          </Button>
          <Button
            variant={exportFormat === 'json' ? 'default' : 'outline'}
            onClick={() => setExportFormat('json')}
            className="flex-1 gap-2"
          >
            <FileText className="h-4 w-4" />
            JSON
          </Button>
        </div>

        {/* Section Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Dados para Exportar</Label>
          <div className="space-y-2">
            {[
              { key: 'profile', label: 'Perfil do Bebê' },
              { key: 'growth', label: 'Medidas de Crescimento' },
              { key: 'appointments', label: 'Consultas' },
              { key: 'medications', label: 'Medicamentos' },
              { key: 'colic', label: 'Registros de Cólica' },
              { key: 'food', label: 'Introdução Alimentar' },
              { key: 'routines', label: 'Rotinas' },
            ].map(({ key, label }) => (
              <div
                key={key}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  sections[key as keyof typeof sections]
                    ? 'bg-primary/10 border-primary'
                    : 'bg-muted/50 border-muted'
                }`}
                onClick={() => toggleSection(key as keyof typeof sections)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={sections[key as keyof typeof sections]} />
                  <span className="text-sm">{label}</span>
                </div>
                <Badge variant="secondary">
                  {dataCounts[key as keyof typeof dataCounts]} registros
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting || !Object.values(sections).some(v => v)}
          className="w-full gap-2"
          size="lg"
        >
          {isExporting ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Exportar {exportFormat === 'xlsx' ? 'Excel' : 'JSON'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
