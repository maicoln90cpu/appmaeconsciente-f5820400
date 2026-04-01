import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Baby, Apple, ArrowLeft } from "lucide-react";
import { differenceInDays, addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const FRUIT_COMPARISONS: Record<number, { fruit: string; size: string }> = {
  4: { fruit: "🫐", size: "Semente de papoula" },
  5: { fruit: "🫐", size: "Semente de gergelim" },
  6: { fruit: "🫐", size: "Grão de lentilha" },
  7: { fruit: "🫐", size: "Mirtilo" },
  8: { fruit: "🫒", size: "Framboesa" },
  9: { fruit: "🍇", size: "Uva" },
  10: { fruit: "🫒", size: "Azeitona" },
  11: { fruit: "🍓", size: "Morango" },
  12: { fruit: "🍑", size: "Ameixa" },
  13: { fruit: "🍋", size: "Limão" },
  14: { fruit: "🍊", size: "Nectarina" },
  15: { fruit: "🍎", size: "Maçã" },
  16: { fruit: "🥑", size: "Abacate" },
  17: { fruit: "🍐", size: "Pera" },
  18: { fruit: "🫑", size: "Pimentão" },
  19: { fruit: "🥭", size: "Manga" },
  20: { fruit: "🍌", size: "Banana" },
  21: { fruit: "🥕", size: "Cenoura" },
  22: { fruit: "🌽", size: "Espiga de milho" },
  23: { fruit: "🥭", size: "Manga grande" },
  24: { fruit: "🌽", size: "Milho" },
  25: { fruit: "🥦", size: "Couve-flor" },
  26: { fruit: "🥬", size: "Alface" },
  27: { fruit: "🥦", size: "Brócolis" },
  28: { fruit: "🍆", size: "Berinjela" },
  29: { fruit: "🎃", size: "Abóbora pequena" },
  30: { fruit: "🥒", size: "Pepino" },
  31: { fruit: "🥥", size: "Coco" },
  32: { fruit: "🍈", size: "Melão cantalupo" },
  33: { fruit: "🍍", size: "Abacaxi" },
  34: { fruit: "🍍", size: "Abacaxi grande" },
  35: { fruit: "🍈", size: "Melão" },
  36: { fruit: "🥬", size: "Alface romana" },
  37: { fruit: "🥬", size: "Acelga" },
  38: { fruit: "🎃", size: "Abóbora" },
  39: { fruit: "🍉", size: "Mini melancia" },
  40: { fruit: "🍉", size: "Melancia" },
  41: { fruit: "🍉", size: "Melancia grande" },
  42: { fruit: "🍉", size: "Melancia (pronto!)" },
};

const CalculadoraSemanas = () => {
  const navigate = useNavigate();
  const [dum, setDum] = useState("");

  const result = useMemo(() => {
    if (!dum) return null;
    const dumDate = new Date(dum + "T00:00:00");
    const today = new Date();
    const totalDays = differenceInDays(today, dumDate);

    if (totalDays < 0 || totalDays > 300) return null;

    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    const dpp = addDays(dumDate, 280);
    const daysRemaining = differenceInDays(dpp, today);
    const trimester = weeks < 13 ? 1 : weeks < 27 ? 2 : 3;
    const progressPercent = Math.min((totalDays / 280) * 100, 100);
    const months = Math.floor(weeks / 4.33);
    const fruit = FRUIT_COMPARISONS[weeks] || FRUIT_COMPARISONS[42];

    return { weeks, days, dpp, daysRemaining, trimester, progressPercent, months, fruit };
  }, [dum]);

  const trimesterLabel = result?.trimester === 1 ? "1º Trimestre" : result?.trimester === 2 ? "2º Trimestre" : "3º Trimestre";
  const trimesterColor = result?.trimester === 1 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : result?.trimester === 2 ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300";

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/materiais")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Calculadora de Semanas</h1>
          <p className="text-sm text-muted-foreground">Descubra em que semana você está</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Data da Última Menstruação (DUM)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="dum">Informe a data</Label>
          <Input id="dum" type="date" value={dum} onChange={(e) => setDum(e.target.value)} max={format(new Date(), "yyyy-MM-dd")} />
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Main result */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Você está com</p>
              <p className="text-5xl font-bold text-primary">
                {result.weeks}<span className="text-2xl">s</span> {result.days > 0 && <>{result.days}<span className="text-2xl">d</span></>}
              </p>
              <p className="text-sm text-muted-foreground">≈ {result.months} meses de gestação</p>
              <Badge className={trimesterColor}>{trimesterLabel}</Badge>
              <Progress value={result.progressPercent} className="h-3 mt-4" />
              <p className="text-xs text-muted-foreground">{result.progressPercent.toFixed(0)}% da gestação concluída</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {/* DPP */}
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <Baby className="h-8 w-8 mx-auto text-pink-500" />
                <p className="text-xs text-muted-foreground">Data Provável do Parto</p>
                <p className="font-bold text-lg">{format(result.dpp, "dd/MM/yyyy", { locale: ptBR })}</p>
                <p className="text-xs text-muted-foreground">Faltam {Math.max(0, result.daysRemaining)} dias</p>
              </CardContent>
            </Card>

            {/* Fruit */}
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <p className="text-4xl">{result.fruit?.fruit}</p>
                <p className="text-xs text-muted-foreground">Tamanho do bebê</p>
                <p className="font-bold text-sm">{result.fruit?.size}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default CalculadoraSemanas;
