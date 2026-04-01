import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FoodIntroductionDiary } from "@/components/alimentacao-bebe/FoodIntroductionDiary";

const IntroducaoAlimentar = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/materiais")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Introdução Alimentar</h1>
          <p className="text-sm text-muted-foreground">Calendário BLW/Tradicional com registro de reações alérgicas</p>
        </div>
      </div>

      <FoodIntroductionDiary />
    </div>
  );
};

export default IntroducaoAlimentar;
