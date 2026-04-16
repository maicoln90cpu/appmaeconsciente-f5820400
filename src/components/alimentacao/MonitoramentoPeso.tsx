import { useState, useEffect } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Scale, TrendingUp, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Profile } from '@/hooks/useProfile';

import { supabase } from '@/integrations/supabase/client';


interface WeightEntry {
  id: string;
  weight: number;
  week_of_pregnancy: number | null;
  belly_measurement: number | null;
  date: string;
  notes: string | null;
}

interface MonitoramentoPesoProps {
  profile: Profile;
}

export function MonitoramentoPeso({ profile }: MonitoramentoPesoProps) {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    weight: '',
    belly_measurement: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('weight_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      toast.error('Erro ao carregar registros de peso');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const weekOfPregnancy = profile.meses_gestacao
        ? Math.floor(profile.meses_gestacao * 4.33)
        : null;

      const { error } = await supabase.from('weight_tracking').insert({
        user_id: user.id,
        weight: parseFloat(formData.weight),
        belly_measurement: formData.belly_measurement
          ? parseFloat(formData.belly_measurement)
          : null,
        week_of_pregnancy: weekOfPregnancy,
        date: formData.date,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast.success('Registro adicionado com sucesso!');
      setOpen(false);
      loadEntries();
      setFormData({
        weight: '',
        belly_measurement: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      });
    } catch (error) {
      console.error('Erro ao adicionar registro:', error);
      toast.error('Erro ao adicionar registro');
    }
  };

  const chartData = entries.map(entry => ({
    date: format(new Date(entry.date), 'dd/MM', { locale: ptBR }),
    peso: entry.weight,
    barriga: entry.belly_measurement || 0,
  }));

  const latestEntry = entries[entries.length - 1];
  const firstEntry = entries[0];
  const weightGain =
    latestEntry && firstEntry ? (latestEntry.weight - firstEntry.weight).toFixed(1) : 0;

  if (loading) {
    return <div className="flex justify-center py-8">Carregando dados...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monitoramento de Peso</h2>
          <p className="text-muted-foreground">Acompanhe seu peso e medidas durante a gestação</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Registro de Peso</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="weight">Peso (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={e => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="Ex: 65.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="belly_measurement">Medida da Barriga (cm)</Label>
                <Input
                  id="belly_measurement"
                  type="number"
                  step="0.1"
                  value={formData.belly_measurement}
                  onChange={e => setFormData({ ...formData, belly_measurement: e.target.value })}
                  placeholder="Ex: 95.0"
                />
              </div>

              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Exame de rotina"
                />
              </div>

              <Button type="submit" className="w-full">
                Adicionar Registro
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Peso Atual</CardDescription>
            <CardTitle className="text-3xl">
              {latestEntry ? `${latestEntry.weight} kg` : '-'}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ganho de Peso</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-500" />
              {weightGain ? `+${weightGain} kg` : '-'}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Medida da Barriga</CardDescription>
            <CardTitle className="text-3xl">
              {latestEntry?.belly_measurement ? `${latestEntry.belly_measurement} cm` : '-'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {entries.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Gráfico de Evolução</CardTitle>
              <CardDescription>Acompanhamento do seu peso ao longo da gestação</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="peso"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Peso (kg)"
                  />
                  {chartData.some(d => d.barriga > 0) && (
                    <Line
                      type="monotone"
                      dataKey="barriga"
                      stroke="hsl(var(--secondary))"
                      strokeWidth={2}
                      name="Barriga (cm)"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Registros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entries
                  .slice()
                  .reverse()
                  .map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between border-b pb-4 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <Scale className="h-5 w-5 mt-1 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{entry.weight} kg</p>
                          {entry.belly_measurement && (
                            <p className="text-sm text-muted-foreground">
                              Barriga: {entry.belly_measurement} cm
                            </p>
                          )}
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {format(new Date(entry.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        {entry.week_of_pregnancy && (
                          <p className="text-xs text-muted-foreground">
                            {entry.week_of_pregnancy}ª semana
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Scale className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum registro de peso ainda</p>
            <p className="text-sm">Adicione seu primeiro registro para começar o acompanhamento</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
