import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useKickCounter } from "@/hooks/useKickCounter";
import { Play, Square, Baby, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function KickCounter() {
  const {
    sessions,
    isLoading,
    isActive,
    kickCount,
    elapsedSeconds,
    startSession,
    isStarting,
    recordKick,
    endSession,
    isEnding,
    deleteSession,
  } = useKickCounter();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            Contador de Movimentos Fetais
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            A partir de 28 semanas, conte os movimentos do bebê. O ideal é sentir 10 movimentos em até 2 horas.
          </p>
        </CardHeader>
        <CardContent>
          {isActive ? (
            <div className="flex flex-col items-center gap-6">
              <div className="text-5xl font-bold text-primary">{kickCount}</div>
              <p className="text-muted-foreground">movimentos</p>
              <div className="text-2xl font-mono text-muted-foreground">{formatTime(elapsedSeconds)}</div>

              <Button
                size="lg"
                className="w-full max-w-xs h-24 text-2xl rounded-2xl"
                onClick={recordKick}
              >
                👶 Sentiu um chute!
              </Button>

              <Button variant="outline" onClick={() => endSession()} disabled={isEnding} className="gap-2">
                <Square className="h-4 w-4" />
                Finalizar Sessão
              </Button>

              {kickCount >= 10 && (
                <Badge variant="default" className="text-sm px-4 py-2">
                  ✅ Meta atingida! Bebê está ativo.
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-center text-muted-foreground">
                Deite de lado, relaxe e comece a contar os movimentos do seu bebê.
              </p>
              <Button size="lg" onClick={() => startSession()} disabled={isStarting} className="gap-2">
                <Play className="h-4 w-4" />
                Iniciar Sessão
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Sessões</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Nenhuma sessão registrada ainda. Inicie sua primeira contagem! 💜
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 10).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">
                      {session.kick_count} movimentos
                      {session.kick_count >= 10 && <span className="ml-2">✅</span>}
                      {session.kick_count < 10 && session.ended_at && <span className="ml-2">⚠️</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(session.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {session.duration_minutes && ` · ${session.duration_minutes} min`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteSession(session.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
