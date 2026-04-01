import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Ruler } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GrowthChart } from "@/components/crescimento/GrowthChart";

const DiarioCrescimento = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/materiais")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Diário de Crescimento</h1>
            <Badge className="bg-primary/10 text-primary">Curvas OMS</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Registre peso, altura e perímetro cefálico com gráficos oficiais da OMS</p>
        </div>
      </div>

      <GrowthChart />
    </div>
  );
};

export default DiarioCrescimento;
