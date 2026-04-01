import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Pause, Square, Baby } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TimerMamada = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [side, setSide] = useState<"left" | "right" | "bottle">("left");
  const [saved, setSaved] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

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
    } catch {
      toast.error("Erro ao salvar");
    }
  }, [elapsed, side, user, pause]);

  const reset = useCallback(() => {
    setElapsed(0);
    setSaved(false);
    startTimeRef.current = null;
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

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
    </div>
  );
};

export default TimerMamada;
