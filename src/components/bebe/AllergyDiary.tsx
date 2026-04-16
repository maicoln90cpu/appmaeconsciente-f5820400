import { useState, useCallback } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, AlertTriangle, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import {
  useAllergyDiary,
  REACTION_TYPES,
  ALLERGY_SYMPTOMS,
  COMMON_ALLERGENS,
} from '@/hooks/useAllergyDiary';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';

interface Props {
  babyProfileId?: string;
}

export const AllergyDiary = ({ babyProfileId }: Props) => {
  const {
    logs,
    loading,
    addLog,
    updateLog,
    removeLog,
    confirmedAllergies,
    safefoods,
    pendingWatch,
  } = useAllergyDiary(babyProfileId);
  const [open, setOpen] = useState(false);

  // Form
  const [foodName, setFoodName] = useState('');
  const [introDate, setIntroDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reactionType, setReactionType] = useState('none');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [onsetHours, setOnsetHours] = useState<string>('');
  const [actionTaken, setActionTaken] = useState('');
  const [doctorConsulted, setDoctorConsulted] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSaveRaw = useCallback(async () => {
    if (!foodName.trim()) return;
    await addLog({
      food_name: foodName.trim(),
      introduction_date: introDate,
      reaction_type: reactionType,
      reaction_severity: reactionType,
      symptoms,
      onset_time_hours: onsetHours ? Number(onsetHours) : null,
      action_taken: actionTaken || null,
      doctor_consulted: doctorConsulted,
      notes: notes || null,
    });
    setOpen(false);
    resetForm();
  }, [
    foodName,
    introDate,
    reactionType,
    symptoms,
    onsetHours,
    actionTaken,
    doctorConsulted,
    notes,
    addLog,
  ]);

  const [isSaving, handleSave] = useSubmitGuard(handleSaveRaw);

  const resetForm = () => {
    setFoodName('');
    setReactionType('none');
    setSymptoms([]);
    setOnsetHours('');
    setActionTaken('');
    setDoctorConsulted(false);
    setNotes('');
    setIntroDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const confirmAllergy = async (id: string) => {
    await updateLog(id, { is_confirmed_allergy: true });
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">🍎 Diário de Alergias</h3>
          <p className="text-sm text-muted-foreground">{logs.length} alimentos registrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Novo alimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar alimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome do alimento</Label>
                <Input
                  value={foodName}
                  onChange={e => setFoodName(e.target.value)}
                  placeholder="Ex: Ovo cozido"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMMON_ALLERGENS.filter(
                    a => !logs.some(l => l.food_name.toLowerCase() === a.toLowerCase())
                  )
                    .slice(0, 8)
                    .map(a => (
                      <Badge
                        key={a}
                        variant="outline"
                        className="cursor-pointer text-[10px]"
                        onClick={() => setFoodName(a)}
                      >
                        {a}
                      </Badge>
                    ))}
                </div>
              </div>

              <div>
                <Label>Data de introdução</Label>
                <Input type="date" value={introDate} onChange={e => setIntroDate(e.target.value)} />
              </div>

              <div>
                <Label>Tipo de reação</Label>
                <Select value={reactionType} onValueChange={setReactionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REACTION_TYPES.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reactionType !== 'none' && (
                <>
                  <div>
                    <Label>Sintomas observados</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {ALLERGY_SYMPTOMS.map(s => (
                        <Badge
                          key={s}
                          variant={symptoms.includes(s) ? 'default' : 'outline'}
                          className="cursor-pointer text-xs"
                          onClick={() =>
                            setSymptoms(prev =>
                              prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                            )
                          }
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Tempo até reação (horas)</Label>
                    <Input
                      type="number"
                      value={onsetHours}
                      onChange={e => setOnsetHours(e.target.value)}
                      placeholder="Ex: 2"
                    />
                  </div>

                  <div>
                    <Label>Ação tomada</Label>
                    <Input
                      value={actionTaken}
                      onChange={e => setActionTaken(e.target.value)}
                      placeholder="Ex: Anti-alérgico prescrito"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={doctorConsulted} onCheckedChange={setDoctorConsulted} />
                    <Label>Pediatra consultado</Label>
                  </div>
                </>
              )}

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Detalhes adicionais..."
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={!foodName.trim() || isSaving}
                className="w-full"
              >
                {isSaving ? 'Salvando...' : 'Registrar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-3 text-center">
            <ShieldCheck className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-600">{safefoods.length}</p>
            <p className="text-[10px] text-muted-foreground">Seguros</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-3 text-center">
            <Clock className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-yellow-600">{pendingWatch.length}</p>
            <p className="text-[10px] text-muted-foreground">Em observação</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-3 text-center">
            <ShieldAlert className="h-5 w-5 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-600">{confirmedAllergies.length}</p>
            <p className="text-[10px] text-muted-foreground">Confirmadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Alergias confirmadas - alerta */}
      {confirmedAllergies.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Alergias Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {confirmedAllergies.map(a => (
                <Badge key={a.id} variant="destructive">
                  {a.food_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de todos os registros */}
      {logs.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Histórico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logs.map(log => {
              const reaction = REACTION_TYPES.find(r => r.value === log.reaction_type);
              return (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{log.food_name}</p>
                      <Badge
                        variant={log.reaction_type === 'none' ? 'secondary' : 'destructive'}
                        className="text-[10px]"
                      >
                        {reaction?.label}
                      </Badge>
                      {log.is_confirmed_allergy && (
                        <Badge variant="destructive" className="text-[10px]">
                          ⚠️ Alergia
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.introduction_date), 'dd/MM/yyyy', { locale: ptBR })}
                      {log.onset_time_hours && ` • Reação em ${log.onset_time_hours}h`}
                      {log.doctor_consulted && ' • 👨‍⚕️ Pediatra consultado'}
                    </p>
                    {log.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {log.symptoms.map(s => (
                          <Badge key={s} variant="outline" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {log.reaction_type !== 'none' && !log.is_confirmed_allergy && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 mt-1"
                        onClick={() => confirmAllergy(log.id)}
                      >
                        Confirmar como alergia
                      </Button>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeLog(log.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhum alimento registrado"
          description="Comece registrando os alimentos introduzidos na dieta do bebê"
        />
      )}
    </div>
  );
};
