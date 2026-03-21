import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Baby, Plus, Trash2, Eye } from "lucide-react";
import { useJaundiceLogs } from "@/hooks/useJaundiceLogs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const KRAMER_ZONES = [
  { zone: 1, label: "Rosto", color: "bg-yellow-200", bilirubin: "~5 mg/dL", risk: "low" },
  { zone: 2, label: "Tronco superior", color: "bg-yellow-300", bilirubin: "~10 mg/dL", risk: "low" },
  { zone: 3, label: "Abdômen", color: "bg-yellow-400", bilirubin: "~12 mg/dL", risk: "medium" },
  { zone: 4, label: "Braços e pernas", color: "bg-orange-400", bilirubin: "~15 mg/dL", risk: "high" },
  { zone: 5, label: "Mãos e pés", color: "bg-orange-600 text-primary-foreground", bilirubin: ">15 mg/dL", risk: "critical" },
];

const ALERT_SIGNS = [
  "Sonolência excessiva",
  "Recusa alimentação",
  "Choro agudo/estridente",
  "Corpo rígido/arqueado",
  "Febre",
  "Urina escura",
  "Fezes claras/esbranquiçadas",
];

interface JaundiceMonitorProps {
  babyProfileId?: string;
}

export const JaundiceMonitor = ({ babyProfileId }: JaundiceMonitorProps) => {
  const { logs, isLoading, addLog, deleteLog, hasDangerSigns, latestLog } = useJaundiceLogs(babyProfileId);
  const [showForm, setShowForm] = useState(false);
  const [selectedZone, setSelectedZone] = useState(1);
  const [feedingWell, setFeedingWell] = useState(true);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    addLog.mutate({
      baby_profile_id: babyProfileId || null,
      log_date: new Date().toISOString().split("T")[0],
      kramer_zone: selectedZone,
      skin_color: null,
      sclera_color: null,
      feeding_well: feedingWell,
      alert_signs: selectedAlerts,
      photo_url: null,
      notes: notes || null,
    }, {
      onSuccess: () => {
        setShowForm(false);
        setSelectedZone(1);
        setFeedingWell(true);
        setSelectedAlerts([]);
        setNotes("");
      },
    });
  };

  const toggleAlert = (alert: string) => {
    setSelectedAlerts(prev =>
      prev.includes(alert) ? prev.filter(a => a !== alert) : [...prev, alert]
    );
  };

  const getZoneRiskBadge = (zone: number) => {
    if (zone <= 2) return <Badge variant="secondary" className="bg-green-100 text-green-800">Baixo risco</Badge>;
    if (zone === 3) return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
    if (zone === 4) return <Badge variant="destructive" className="bg-orange-100 text-orange-800">Alto risco</Badge>;
    return <Badge variant="destructive">Risco crítico — procure emergência</Badge>;
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Danger alert banner */}
      {hasDangerSigns && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">⚠️ Sinais de alerta detectados</p>
                <p className="text-sm text-muted-foreground mt-1">
                  O último registro indica zona Kramer {latestLog?.kramer_zone} 
                  {!latestLog?.feeding_well && " e recusa alimentar"}
                  {latestLog?.alert_signs && latestLog.alert_signs.length > 0 && ` com sinais: ${latestLog.alert_signs.join(", ")}`}.
                  <strong> Procure orientação médica.</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-yellow-500" />
                Monitor de Icterícia
              </CardTitle>
              <CardDescription>Avalie a cor da pele usando a Escala de Kramer</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" />
              Registrar
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <CardContent className="space-y-4 border-t pt-4">
            {/* Kramer zones visual */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Selecione a zona amarelada mais distante</Label>
              <div className="space-y-2">
                {KRAMER_ZONES.map(({ zone, label, color, bilirubin }) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      selectedZone === zone
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-muted"
                    } ${color}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-background/80 flex items-center justify-center font-bold text-sm">
                        {zone}
                      </div>
                      <span className="font-medium text-sm">{label}</span>
                    </div>
                    <span className="text-xs opacity-70">{bilirubin}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2">{getZoneRiskBadge(selectedZone)}</div>
            </div>

            {/* Feeding */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Switch checked={feedingWell} onCheckedChange={setFeedingWell} />
              <Label>Bebê está se alimentando bem?</Label>
            </div>

            {/* Alert signs */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Sinais de alerta (marque se presente)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALERT_SIGNS.map(sign => (
                  <label key={sign} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm">
                    <Checkbox
                      checked={selectedAlerts.includes(sign)}
                      onCheckedChange={() => toggleAlert(sign)}
                    />
                    {sign}
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <Textarea
              placeholder="Observações adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={addLog.isPending} className="flex-1">
                {addLog.isPending ? "Salvando..." : "Salvar registro"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Informational card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Baby className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Como avaliar?</p>
              <p>Pressione suavemente a pele do bebê em local com boa luz natural. Observe onde a cor amarela aparece — quanto mais distante do rosto, maior o nível de bilirrubina.</p>
              <p className="text-xs">⚠️ Esta ferramenta <strong>não substitui</strong> avaliação médica. Em caso de dúvida, procure o pediatra.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${KRAMER_ZONES[log.kramer_zone - 1].color}`}>
                      {log.kramer_zone}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Zona {log.kramer_zone} — {KRAMER_ZONES[log.kramer_zone - 1].label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.log_date), "dd/MM/yyyy", { locale: ptBR })}
                        {!log.feeding_well && " • ⚠️ Não se alimentou bem"}
                        {log.alert_signs && log.alert_signs.length > 0 && ` • ${log.alert_signs.length} alerta(s)`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteLog.mutate(log.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
