import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useBirthPlan, BirthPlanInput } from '@/hooks/useBirthPlan';
import { FileText, Save, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const STEPS = [
  { title: 'Tipo de Parto', icon: '🏥' },
  { title: 'Acompanhantes', icon: '👥' },
  { title: 'Preferências', icon: '✨' },
  { title: 'Informações Extras', icon: '📋' },
];

export function BirthPlanBuilder() {
  const { plan, isLoading, savePlan, isSaving } = useBirthPlan();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<BirthPlanInput>>({
    delivery_type: 'normal',
    anesthesia: 'indecisa',
    skin_to_skin: true,
    delayed_cord_clamping: true,
    breastfeed_first_hour: true,
    lighting_preference: 'meia_luz',
    photos_video: true,
    episiotomy_preference: 'evitar',
    placenta_preference: 'hospital',
  });

  useEffect(() => {
    if (plan) {
      const { id, user_id, created_at, updated_at, ...rest } = plan;
      setForm(rest);
    }
  }, [plan]);

  const updateField = <K extends keyof BirthPlanInput>(key: K, value: BirthPlanInput[K]) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSave = () => savePlan(form);

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(20);
    doc.text('Meu Plano de Parto', margin, y);
    y += 12;

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, y);
    y += 10;
    doc.setTextColor(0);

    const addLine = (label: string, value: string) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 55, y);
      y += 7;
    };

    const deliveryLabels: Record<string, string> = {
      normal: 'Parto Normal',
      cesarea: 'Cesárea',
      humanizado: 'Humanizado',
      agua: 'Parto na Água',
      indecisa: 'Indecisa',
    };
    const anesthesiaLabels: Record<string, string> = {
      epidural: 'Epidural',
      raquidiana: 'Raquidiana',
      combinada: 'Combinada',
      nenhuma: 'Nenhuma',
      indecisa: 'Indecisa',
    };
    const lightLabels: Record<string, string> = {
      natural: 'Natural',
      meia_luz: 'Meia-luz',
      escuro: 'Escuro',
      indiferente: 'Indiferente',
    };
    const episLabels: Record<string, string> = {
      sim: 'Sim',
      evitar: 'Evitar',
      somente_emergencia: 'Somente Emergência',
      indiferente: 'Indiferente',
    };
    const placentaLabels: Record<string, string> = {
      hospital: 'Deixar no Hospital',
      levar: 'Levar para Casa',
      encapsular: 'Encapsular',
      indiferente: 'Indiferente',
    };

    y += 3;
    doc.setFontSize(14);
    doc.text('Tipo de Parto & Anestesia', margin, y);
    y += 8;
    addLine('Tipo de parto', deliveryLabels[form.delivery_type ?? ''] ?? '—');
    addLine('Anestesia', anesthesiaLabels[form.anesthesia ?? ''] ?? '—');

    y += 5;
    doc.setFontSize(14);
    doc.text('Acompanhantes', margin, y);
    y += 8;
    addLine('Acompanhante', form.companion_name ?? '—');
    addLine('Reserva', form.companion_backup ?? '—');

    y += 5;
    doc.setFontSize(14);
    doc.text('Preferências', margin, y);
    y += 8;
    addLine('Pele a pele', form.skin_to_skin ? 'Sim' : 'Não');
    addLine('Clampeamento tardio', form.delayed_cord_clamping ? 'Sim' : 'Não');
    addLine('Amamentar 1ª hora', form.breastfeed_first_hour ? 'Sim' : 'Não');
    addLine('Iluminação', lightLabels[form.lighting_preference ?? ''] ?? '—');
    addLine('Fotos/Vídeo', form.photos_video ? 'Sim' : 'Não');
    addLine('Episiotomia', episLabels[form.episiotomy_preference ?? ''] ?? '—');
    addLine('Placenta', placentaLabels[form.placenta_preference ?? ''] ?? '—');
    if (form.music_playlist) addLine('Playlist', form.music_playlist);

    y += 5;
    doc.setFontSize(14);
    doc.text('Informações Extras', margin, y);
    y += 8;
    addLine('Hospital', form.hospital_name ?? '—');
    addLine('Pediatra', form.pediatrician_name ?? '—');
    addLine('DPP', form.due_date ?? '—');
    if (form.special_requests) {
      y += 3;
      doc.setFontSize(10);
      doc.text('Pedidos especiais:', margin, y);
      y += 6;
      const lines = doc.splitTextToSize(form.special_requests, 170);
      doc.text(lines, margin, y);
      y += lines.length * 5;
    }
    if (form.emergency_notes) {
      y += 3;
      doc.text('Notas de emergência:', margin, y);
      y += 6;
      const lines = doc.splitTextToSize(form.emergency_notes, 170);
      doc.text(lines, margin, y);
    }

    doc.save('plano-de-parto.pdf');
  };

  if (isLoading)
    return <p className="text-center text-muted-foreground py-8">Carregando plano...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Planejador de Parto
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Monte seu plano de parto passo a passo e leve impresso ao hospital 📋
          </p>
        </CardHeader>
        <CardContent>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </div>

          {/* Step 0: Tipo de Parto */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Tipo de parto preferido</Label>
                <Select
                  value={form.delivery_type}
                  onValueChange={v => updateField('delivery_type', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Parto Normal</SelectItem>
                    <SelectItem value="cesarea">Cesárea</SelectItem>
                    <SelectItem value="humanizado">Humanizado</SelectItem>
                    <SelectItem value="agua">Parto na Água</SelectItem>
                    <SelectItem value="indecisa">Ainda indecisa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Anestesia</Label>
                <Select value={form.anesthesia} onValueChange={v => updateField('anesthesia', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="epidural">Epidural</SelectItem>
                    <SelectItem value="raquidiana">Raquidiana</SelectItem>
                    <SelectItem value="combinada">Combinada</SelectItem>
                    <SelectItem value="nenhuma">Nenhuma</SelectItem>
                    <SelectItem value="indecisa">Indecisa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Episiotomia</Label>
                <Select
                  value={form.episiotomy_preference}
                  onValueChange={v => updateField('episiotomy_preference', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim, pode fazer</SelectItem>
                    <SelectItem value="evitar">Prefiro evitar</SelectItem>
                    <SelectItem value="somente_emergencia">Somente em emergência</SelectItem>
                    <SelectItem value="indiferente">Indiferente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 1: Acompanhantes */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Acompanhante principal</Label>
                <Input
                  placeholder="Ex: João (marido)"
                  value={form.companion_name ?? ''}
                  onChange={e => updateField('companion_name', e.target.value)}
                />
              </div>
              <div>
                <Label>Acompanhante reserva</Label>
                <Input
                  placeholder="Ex: Maria (mãe)"
                  value={form.companion_backup ?? ''}
                  onChange={e => updateField('companion_backup', e.target.value)}
                />
              </div>
              <div>
                <Label>Pediatra</Label>
                <Input
                  placeholder="Nome do pediatra"
                  value={form.pediatrician_name ?? ''}
                  onChange={e => updateField('pediatrician_name', e.target.value)}
                />
              </div>
              <div>
                <Label>Hospital / Maternidade</Label>
                <Input
                  placeholder="Nome do hospital"
                  value={form.hospital_name ?? ''}
                  onChange={e => updateField('hospital_name', e.target.value)}
                />
              </div>
              <div>
                <Label>Data Prevista do Parto (DPP)</Label>
                <Input
                  type="date"
                  value={form.due_date ?? ''}
                  onChange={e => updateField('due_date', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Preferências */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Contato pele a pele imediato</Label>
                <Switch
                  checked={form.skin_to_skin}
                  onCheckedChange={v => updateField('skin_to_skin', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Clampeamento tardio do cordão</Label>
                <Switch
                  checked={form.delayed_cord_clamping}
                  onCheckedChange={v => updateField('delayed_cord_clamping', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Amamentar na 1ª hora</Label>
                <Switch
                  checked={form.breastfeed_first_hour}
                  onCheckedChange={v => updateField('breastfeed_first_hour', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Fotos/Vídeo</Label>
                <Switch
                  checked={form.photos_video}
                  onCheckedChange={v => updateField('photos_video', v)}
                />
              </div>
              <div>
                <Label>Iluminação</Label>
                <Select
                  value={form.lighting_preference}
                  onValueChange={v => updateField('lighting_preference', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="meia_luz">Meia-luz</SelectItem>
                    <SelectItem value="escuro">Escuro</SelectItem>
                    <SelectItem value="indiferente">Indiferente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Placenta</Label>
                <Select
                  value={form.placenta_preference}
                  onValueChange={v => updateField('placenta_preference', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">Deixar no hospital</SelectItem>
                    <SelectItem value="levar">Levar para casa</SelectItem>
                    <SelectItem value="encapsular">Encapsular</SelectItem>
                    <SelectItem value="indiferente">Indiferente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Playlist/Música</Label>
                <Input
                  placeholder="Link da playlist ou nome"
                  value={form.music_playlist ?? ''}
                  onChange={e => updateField('music_playlist', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Extras */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Pedidos especiais</Label>
                <Textarea
                  placeholder="Ex: Quero música ambiente, quero que o pai corte o cordão..."
                  value={form.special_requests ?? ''}
                  onChange={e => updateField('special_requests', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Notas de emergência</Label>
                <Textarea
                  placeholder="Alergias, condições médicas, medicamentos..."
                  value={form.emergency_notes ?? ''}
                  onChange={e => updateField('emergency_notes', e.target.value)}
                  rows={3}
                />
              </div>

              {plan && (
                <Badge variant="secondary" className="text-xs">
                  Última atualização: {new Date(plan.updated_at).toLocaleDateString('pt-BR')}
                </Badge>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving} variant="outline" className="gap-1">
                <Save className="h-4 w-4" />
                Salvar
              </Button>

              {step === STEPS.length - 1 && (
                <Button onClick={handleExportPDF} className="gap-1">
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
              disabled={step === STEPS.length - 1}
              className="gap-1"
            >
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
