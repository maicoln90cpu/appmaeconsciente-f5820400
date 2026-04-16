import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pill, Check, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Supplement {
  id: string;
  supplement_name: string;
  dosage: string;
  frequency: string;
  times_per_day: number;
  time_of_day: string[];
  start_date: string;
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
}

interface SupplementLog {
  id: string;
  supplement_id: string;
  taken_at: string;
  scheduled_time: string;
}

export function ControleSuplemento() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [logs, setLogs] = useState<SupplementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    supplement_name: '',
    dosage: '',
    frequency: 'diario',
    times_per_day: 1,
    time_of_day: ['08:00'],
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    notes: '',
  });

  useEffect(() => {
    loadSupplements();
    loadTodayLogs();
  }, []);

  const loadSupplements = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_supplements')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('supplement_name');

      if (error) throw error;
      setSupplements(data || []);
    } catch (error) {
      console.error('Erro ao carregar suplementos:', error);
      toast.error('Erro ao carregar suplementos');
    } finally {
      setLoading(false);
    }
  };

  const loadTodayLogs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('supplement_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('taken_at', `${today}T00:00:00`)
        .lte('taken_at', `${today}T23:59:59`);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('user_supplements').insert({
        user_id: user.id,
        ...formData,
      });

      if (error) throw error;

      toast.success('Suplemento adicionado com sucesso!');
      setOpen(false);
      loadSupplements();
      setFormData({
        supplement_name: '',
        dosage: '',
        frequency: 'diario',
        times_per_day: 1,
        time_of_day: ['08:00'],
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
        notes: '',
      });
    } catch (error) {
      console.error('Erro ao adicionar suplemento:', error);
      toast.error('Erro ao adicionar suplemento');
    }
  };

  const markAsTaken = async (supplementId: string, scheduledTime: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('supplement_logs').insert({
        user_id: user.id,
        supplement_id: supplementId,
        scheduled_time: scheduledTime,
      });

      if (error) throw error;

      toast.success('Suplemento registrado!');
      loadTodayLogs();
    } catch (error) {
      console.error('Erro ao registrar suplemento:', error);
      toast.error('Erro ao registrar suplemento');
    }
  };

  const deleteSupplement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_supplements')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast.success('Suplemento removido');
      loadSupplements();
    } catch (error) {
      console.error('Erro ao remover suplemento:', error);
      toast.error('Erro ao remover suplemento');
    }
  };

  const isTimeTaken = (supplementId: string, time: string) => {
    return logs.some(log => log.supplement_id === supplementId && log.scheduled_time === time);
  };

  if (loading) {
    return <div className="flex justify-center py-8">Carregando suplementos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Controle de Suplementos</h2>
          <p className="text-muted-foreground">Gerencie seus suplementos e lembretes diários</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Suplemento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Suplemento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="supplement_name">Nome do Suplemento</Label>
                <Input
                  id="supplement_name"
                  value={formData.supplement_name}
                  onChange={e => setFormData({ ...formData, supplement_name: e.target.value })}
                  placeholder="Ex: Ácido Fólico"
                  required
                />
              </div>

              <div>
                <Label htmlFor="dosage">Dosagem</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={e => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="Ex: 400mcg"
                  required
                />
              </div>

              <div>
                <Label htmlFor="frequency">Frequência</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={value => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="dia_alternado">Dia Alternado</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time_of_day[0]}
                  onChange={e => setFormData({ ...formData, time_of_day: [e.target.value] })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Tomar com suco de laranja"
                />
              </div>

              <Button type="submit" className="w-full">
                Adicionar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {supplements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Pill className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum suplemento cadastrado ainda</p>
            <p className="text-sm">Adicione seus suplementos para começar o controle</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {supplements.map(supplement => (
            <Card key={supplement.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{supplement.supplement_name}</CardTitle>
                    <CardDescription>
                      {supplement.dosage} •{' '}
                      {supplement.frequency === 'diario'
                        ? 'Diário'
                        : supplement.frequency === 'dia_alternado'
                          ? 'Dia Alternado'
                          : 'Semanal'}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteSupplement(supplement.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {supplement.time_of_day.map(time => {
                    const taken = isTimeTaken(supplement.id, time);
                    return (
                      <Button
                        key={time}
                        variant={taken ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => !taken && markAsTaken(supplement.id, time)}
                        disabled={taken}
                      >
                        {taken ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Clock className="mr-2 h-4 w-4" />
                        )}
                        {time}
                        {taken && ' ✓'}
                      </Button>
                    );
                  })}
                </div>
                {supplement.notes && (
                  <p className="text-sm text-muted-foreground mt-3">💡 {supplement.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
