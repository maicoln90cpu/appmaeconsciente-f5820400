import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoutinePlanner } from '@/components/bebe/RoutinePlanner';

const PlanejadorRotina = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/materiais')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Planejador de Rotina</h1>
          <p className="text-sm text-muted-foreground">
            Monte a rotina diária do bebê com templates por idade
          </p>
        </div>
      </div>

      <RoutinePlanner />
    </div>
  );
};

export default PlanejadorRotina;
