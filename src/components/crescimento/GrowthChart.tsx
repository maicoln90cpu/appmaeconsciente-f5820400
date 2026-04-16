/**
 * @fileoverview Gráfico de crescimento com curvas OMS
 */

import { useState } from 'react';

import { format, differenceInMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Ruler, Scale, TrendingUp, Loader2, Trash2, FileDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


import {
  useGrowthMeasurements,
  WHO_WEIGHT_BOYS,
  WHO_WEIGHT_GIRLS,
  WHO_HEIGHT_BOYS,
  WHO_HEIGHT_GIRLS,
} from '@/hooks/useGrowthMeasurements';
import { useVaccination } from '@/hooks/useVaccination';


import { cn } from '@/lib/utils';

interface GrowthChartProps {
  babyProfileId?: string;
}

export const GrowthChart = ({ babyProfileId }: GrowthChartProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [newMeasurement, setNewMeasurement] = useState({
    measurement_date: format(new Date(), 'yyyy-MM-dd'),
    weight_kg: '',
    height_cm: '',
    head_circumference_cm: '',
    notes: '',
  });

  const {
    measurements,
    isLoading,
    addMeasurement,
    deleteMeasurement,
    isAdding,
    calculatePercentile,
    latestMeasurement,
  } = useGrowthMeasurements(babyProfileId);

  const { profiles } = useVaccination();
  const selectedProfile = profiles.find(p => p.id === babyProfileId);
  const birthDate = selectedProfile?.birth_date;

  // Prepare chart data with WHO curves
  const prepareChartData = (type: 'weight' | 'height') => {
    const whoData =
      type === 'weight'
        ? gender === 'male'
          ? WHO_WEIGHT_BOYS
          : WHO_WEIGHT_GIRLS
        : gender === 'male'
          ? WHO_HEIGHT_BOYS
          : WHO_HEIGHT_GIRLS;

    return whoData.map(who => {
      const measurement = measurements.find(m => {
        if (!birthDate) return false;
        const ageMonths = differenceInMonths(parseISO(m.measurement_date), parseISO(birthDate));
        return Math.abs(ageMonths - who.month) < 0.5;
      });

      return {
        month: who.month,
        p3: who.p3,
        p15: who.p15,
        p50: who.p50,
        p85: who.p85,
        p97: who.p97,
        value: measurement
          ? type === 'weight'
            ? measurement.weight_kg
            : measurement.height_cm
          : null,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMeasurement({
      baby_profile_id: babyProfileId,
      measurement_date: newMeasurement.measurement_date,
      weight_kg: newMeasurement.weight_kg ? parseFloat(newMeasurement.weight_kg) : undefined,
      height_cm: newMeasurement.height_cm ? parseFloat(newMeasurement.height_cm) : undefined,
      head_circumference_cm: newMeasurement.head_circumference_cm
        ? parseFloat(newMeasurement.head_circumference_cm)
        : undefined,
      notes: newMeasurement.notes || undefined,
    });
    setIsDialogOpen(false);
    setNewMeasurement({
      measurement_date: format(new Date(), 'yyyy-MM-dd'),
      weight_kg: '',
      height_cm: '',
      head_circumference_cm: '',
      notes: '',
    });
  };

  // Calculate current percentiles
  const getCurrentPercentiles = () => {
    if (!latestMeasurement || !birthDate) return null;
    const ageMonths = differenceInMonths(
      parseISO(latestMeasurement.measurement_date),
      parseISO(birthDate)
    );

    return {
      weight: latestMeasurement.weight_kg
        ? calculatePercentile(latestMeasurement.weight_kg, ageMonths, 'weight', gender)
        : null,
      height: latestMeasurement.height_cm
        ? calculatePercentile(latestMeasurement.height_cm, ageMonths, 'height', gender)
        : null,
    };
  };

  const percentiles = getCurrentPercentiles();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">Gráfico de Crescimento</span>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              Acompanhe o desenvolvimento com curvas OMS
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={gender} onValueChange={v => setGender(v as 'male' | 'female')}>
              <SelectTrigger className="w-24 sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">👦 Menino</SelectItem>
                <SelectItem value="female">👧 Menina</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 flex-1 sm:flex-none">
                  <Plus className="h-4 w-4" />
                  <span className="hidden xs:inline">Nova Medição</span>
                  <span className="xs:hidden">Medir</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Nova Medição</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newMeasurement.measurement_date}
                      onChange={e =>
                        setNewMeasurement({ ...newMeasurement, measurement_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.001"
                        placeholder="Ex: 3.500"
                        value={newMeasurement.weight_kg}
                        onChange={e =>
                          setNewMeasurement({ ...newMeasurement, weight_kg: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Altura (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 50.0"
                        value={newMeasurement.height_cm}
                        onChange={e =>
                          setNewMeasurement({ ...newMeasurement, height_cm: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="head">Perímetro Cefálico (cm)</Label>
                    <Input
                      id="head"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 35.0"
                      value={newMeasurement.head_circumference_cm}
                      onChange={e =>
                        setNewMeasurement({
                          ...newMeasurement,
                          head_circumference_cm: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Input
                      id="notes"
                      placeholder="Ex: Consulta de rotina"
                      value={newMeasurement.notes}
                      onChange={e =>
                        setNewMeasurement({ ...newMeasurement, notes: e.target.value })
                      }
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isAdding}>
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar Medição
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Stats */}
        {latestMeasurement && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Scale className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{latestMeasurement.weight_kg || '-'} kg</p>
              <p className="text-xs text-muted-foreground">Peso</p>
              {percentiles?.weight && (
                <Badge variant="outline" className="mt-1">
                  Percentil {percentiles.weight}
                </Badge>
              )}
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Ruler className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{latestMeasurement.height_cm || '-'} cm</p>
              <p className="text-xs text-muted-foreground">Altura</p>
              {percentiles?.height && (
                <Badge variant="outline" className="mt-1">
                  Percentil {percentiles.height}
                </Badge>
              )}
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="h-5 w-5 mx-auto mb-1 text-primary">🧠</div>
              <p className="text-2xl font-bold">
                {latestMeasurement.head_circumference_cm || '-'} cm
              </p>
              <p className="text-xs text-muted-foreground">P. Cefálico</p>
            </div>
          </div>
        )}

        {/* Charts */}
        <Tabs defaultValue="weight">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weight">Peso</TabsTrigger>
            <TabsTrigger value="height">Altura</TabsTrigger>
          </TabsList>
          <TabsContent
            value="weight"
            className="h-80 [&_.recharts-legend-wrapper]:hidden sm:[&_.recharts-legend-wrapper]:block"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={prepareChartData('weight')}
                margin={{ left: 0, right: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={35} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value?.toFixed(2),
                    name === 'value' ? 'Medição' : `Percentil ${name.replace('p', '')}`,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="p97" fill="#f0f9ff" stroke="#bae6fd" name="p97" />
                <Area type="monotone" dataKey="p85" fill="#e0f2fe" stroke="#7dd3fc" name="p85" />
                <Area type="monotone" dataKey="p50" fill="#bae6fd" stroke="#38bdf8" name="p50" />
                <Line
                  type="monotone"
                  dataKey="p15"
                  stroke="#7dd3fc"
                  strokeDasharray="5 5"
                  name="p15"
                />
                <Line
                  type="monotone"
                  dataKey="p3"
                  stroke="#bae6fd"
                  strokeDasharray="5 5"
                  name="p3"
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#ec4899"
                  strokeWidth={3}
                  dot={{ fill: '#ec4899', r: 6 }}
                  name="Bebê"
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent
            value="height"
            className="h-80 [&_.recharts-legend-wrapper]:hidden sm:[&_.recharts-legend-wrapper]:block"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={prepareChartData('height')}
                margin={{ left: 0, right: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={35} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value?.toFixed(1),
                    name === 'value' ? 'Medição' : `Percentil ${name.replace('p', '')}`,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="p97" fill="#f0fdf4" stroke="#bbf7d0" name="p97" />
                <Area type="monotone" dataKey="p85" fill="#dcfce7" stroke="#86efac" name="p85" />
                <Area type="monotone" dataKey="p50" fill="#bbf7d0" stroke="#4ade80" name="p50" />
                <Line
                  type="monotone"
                  dataKey="p15"
                  stroke="#86efac"
                  strokeDasharray="5 5"
                  name="p15"
                />
                <Line
                  type="monotone"
                  dataKey="p3"
                  stroke="#bbf7d0"
                  strokeDasharray="5 5"
                  name="p3"
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 6 }}
                  name="Bebê"
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Measurements History */}
        {measurements.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Histórico de Medições</h4>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  try {
                    const { default: jsPDF } = await import('jspdf');
                    const { default: autoTable } = await import('jspdf-autotable');
                    const doc = new jsPDF();

                    doc.setFontSize(18);
                    doc.text('Relatório de Crescimento', 14, 22);
                    doc.setFontSize(10);
                    doc.text(
                      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
                      14,
                      30
                    );
                    if (selectedProfile) {
                      doc.text(
                        `Bebê: ${selectedProfile.baby_name} | Sexo: ${gender === 'male' ? 'Masculino' : 'Feminino'}`,
                        14,
                        36
                      );
                    }

                    // Latest stats
                    if (latestMeasurement) {
                      doc.setFontSize(12);
                      doc.text('Última Medição', 14, 46);
                      doc.setFontSize(10);
                      const stats = [];
                      if (latestMeasurement.weight_kg)
                        stats.push(
                          `Peso: ${latestMeasurement.weight_kg} kg${percentiles?.weight ? ` (Percentil ${percentiles.weight})` : ''}`
                        );
                      if (latestMeasurement.height_cm)
                        stats.push(
                          `Altura: ${latestMeasurement.height_cm} cm${percentiles?.height ? ` (Percentil ${percentiles.height})` : ''}`
                        );
                      if (latestMeasurement.head_circumference_cm)
                        stats.push(`P. Cefálico: ${latestMeasurement.head_circumference_cm} cm`);
                      doc.text(stats.join('  |  '), 14, 52);
                    }

                    // Table
                    const tableData = [...measurements]
                      .reverse()
                      .map(m => [
                        format(parseISO(m.measurement_date), 'dd/MM/yyyy'),
                        m.weight_kg ? `${m.weight_kg} kg` : '-',
                        m.height_cm ? `${m.height_cm} cm` : '-',
                        m.head_circumference_cm ? `${m.head_circumference_cm} cm` : '-',
                        m.notes || '',
                      ]);

                    autoTable(doc, {
                      startY: 58,
                      head: [['Data', 'Peso', 'Altura', 'P. Cefálico', 'Observações']],
                      body: tableData,
                      styles: { fontSize: 9 },
                      headStyles: { fillColor: [236, 72, 153] },
                    });

                    doc.save('relatorio-crescimento.pdf');
                    toast.success('PDF exportado com sucesso!');
                  } catch (err) {
                    toast.error('Erro ao gerar PDF');
                  }
                }}
              >
                <FileDown className="h-3.5 w-3.5" />
                Exportar PDF
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...measurements].reverse().map(m => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {format(parseISO(m.measurement_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {m.weight_kg && <span>{m.weight_kg}kg</span>}
                      {m.height_cm && <span>{m.height_cm}cm</span>}
                      {m.head_circumference_cm && <span>PC: {m.head_circumference_cm}cm</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMeasurement(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {measurements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma medição registrada ainda.</p>
            <p className="text-sm">Adicione a primeira medição para ver o gráfico.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
