import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Pause, Square, Baby, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentFeeding {
  id: string;
  feeding_type: string;
  breast_side: string | null;
  start_time: string;
  duration_minutes: number | null;
}

const TimerMamada = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [side, setSide] = useState<"left" | "right" | "bottle">("left");
  const [saved, setSaved] = useState(false);
  const [recentFeedings, setRecentFeedings] = useState<RecentFeeding[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Carregar últimas 5 mamadas
  const loadRecentFeedings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("baby_feeding_logs")
      .select("id, feeding_type, breast_side, start_time, duration_minutes")
      .eq("user_id", user.id)
      .order("start_time", { ascending: false })
      .limit(5);
    if (data) setRecentFeedings(data);
  }, [user]);

  useEffect(() => { loadRecentFeedings(); }, [loadRecentFeedings]);

  const start = useCallback(() => {
    if (!startTimeRef.current) startTimeRef.current = new Date();
    setIsRunning(true);
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const stop = useCallback(async () => {
    pause();
    if (!user || elapsed < 5) return;

    const minutes = Math.round(elapsed / 60);
    try {
      const feedingType = side === "bottle" ? "bottle" : "breast";
      const breastSide = side === "bottle" ? null : side;
      await supabase.from("baby_feeding_logs").insert({
        user_id: user.id,
        feeding_type: feedingType,
        breast_side: breastSide,
        start_time: startTimeRef.current!.toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: minutes || 1,
      });
      setSaved(true);
      toast.success(`Mamada de ${minutes || 1} min registrada!`);
      loadRecentFeedings();
    } catch {
      toast.error("Erro ao salvar");
    }
  }, [elapsed, side, user, pause, loadRecentFeedings]);

  const reset = useCallback(() => {
    setElapsed(0);
    setSaved(false);
    startTimeRef.current = null;
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  // Alerta de intervalo
  const lastFeeding = recentFeedings[0];
  const timeSinceLastFeeding = lastFeeding
    ? (Date.now() - new Date(lastFeeding.start_time).getTime()) / (1000 * 60 * 60)
    : null;

  const getSideLabel = (feeding: RecentFeeding) => {
    if (feeding.feeding_type === "bottle") return "Mamadeira";
    return feeding.breast_side === "left" ? "Esquerdo" : "Direito";
  };

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/materiais")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Timer de Mamada</h1>
          <p className="text-sm text-muted-foreground">Cronômetro rápido e simples</p>
        </div>
      </div>

      {/* Alerta de intervalo */}
      {timeSinceLastFeeding !== null && !isRunning && !saved && (
        <Card className={`border ${timeSinceLastFeeding >= 3 ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30" : "border-muted"}`}>
          <CardContent className="py-3 flex items-center gap-3">
            {timeSinceLastFeeding >= 3 ? (
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm">
                Última mamada{" "}
                <span className="font-semibold">
                  {formatDistanceToNow(new Date(lastFeeding.start_time), { addSuffix: true, locale: ptBR })}
                </span>
              </p>
              {timeSinceLastFeeding >= 3 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Já se passaram mais de 3 horas. Considere oferecer o peito 💛
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Side selector */}
      <div className="flex gap-2 justify-center">
        {([["left", "Esquerdo"], ["right", "Direito"], ["bottle", "Mamadeira"]] as const).map(([key, label]) => (
          <Button key={key} variant={side === key ? "default" : "outline"} size="sm" onClick={() => setSide(key)} disabled={isRunning}>
            {label}
          </Button>
        ))}
      </div>

      {/* Timer */}
      <Card className="border-primary/30">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <p className="text-7xl font-mono font-bold tabular-nums text-primary">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>

          <div className="flex gap-3 justify-center">
            {!isRunning && !saved && (
              <Button size="lg" onClick={start} className="gap-2 px-8">
                <Play className="h-5 w-5" /> {elapsed > 0 ? "Continuar" : "Iniciar"}
              </Button>
            )}
            {isRunning && (
              <>
                <Button size="lg" variant="outline" onClick={pause} className="gap-2">
                  <Pause className="h-5 w-5" /> Pausar
                </Button>
                <Button size="lg" variant="destructive" onClick={stop} className="gap-2">
                  <Square className="h-5 w-5" /> Finalizar
                </Button>
              </>
            )}
            {saved && (
              <Button size="lg" onClick={reset} className="gap-2 px-8">
                Nova Mamada
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {saved && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">✅ Mamada registrada!</p>
            <p className="text-sm text-muted-foreground">
              {mins} min • Lado {side === "left" ? "esquerdo" : side === "right" ? "direito" : "mamadeira"}
            </p>
            <div className="border-t pt-3 mt-3">
              <p className="text-xs text-muted-foreground mb-2">Quer dashboard completo com gráficos e histórico?</p>
              <Button variant="outline" size="sm" onClick={() => navigate("/materiais/rastreador-amamentacao")} className="gap-2">
                <Baby className="h-4 w-4" /> Conhecer Rastreador de Amamentação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini-histórico últimas 5 mamadas */}
      {recentFeedings.length > 0 && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Últimas mamadas
            </h3>
            <div className="space-y-2">
              {recentFeedings.map((f) => (
                <div key={f.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {getSideLabel(f)}
                    </Badge>
                    <span className="text-muted-foreground">
                      {f.duration_minutes ? `${f.duration_minutes} min` : "—"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(f.start_time), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimerMamada;
