import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export const SizeCalculator = () => {
  const [open, setOpen] = useState(false);
  const [monthsOld, setMonthsOld] = useState<number>(0);
  const [result, setResult] = useState<string>('');

  const calculateSize = () => {
    let size = '';
    let description = '';

    if (monthsOld === 0) {
      size = 'RN (Recém-Nascido)';
      description = 'Até 3,5kg e 50cm. Use com moderação - bebês crescem rápido!';
    } else if (monthsOld <= 2) {
      size = 'P (0-3 meses)';
      description = 'De 3,5kg a 5,5kg e até 60cm. Tamanho ideal para os primeiros meses.';
    } else if (monthsOld <= 5) {
      size = 'M (3-6 meses)';
      description = 'De 5,5kg a 7,5kg e até 68cm. Bebê já está mais ativo!';
    } else if (monthsOld <= 9) {
      size = 'G (6-9 meses)';
      description = 'De 7,5kg a 9,5kg e até 75cm. Fase de muito movimento.';
    } else if (monthsOld <= 12) {
      size = 'GG (9-12 meses)';
      description = 'De 9,5kg a 12kg e até 80cm. Quase completando 1 aninho!';
    } else {
      size = '1 ano ou mais';
      description = 'Consulte tabelas específicas por idade. Cada bebê cresce em seu ritmo único!';
    }

    setResult(`${size}\n${description}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="h-4 w-4" />
          Calcular Tamanho
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calculadora de Tamanho</DialogTitle>
          <DialogDescription>
            Descubra qual tamanho de roupa é ideal para a idade do bebê.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="months">Idade do bebê (em meses)</Label>
            <Input
              id="months"
              type="number"
              min="0"
              max="24"
              value={monthsOld}
              onChange={e => setMonthsOld(Number(e.target.value))}
              placeholder="Ex: 3"
            />
          </div>

          <Button onClick={calculateSize} className="w-full">
            Calcular Tamanho Ideal
          </Button>

          {result && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <pre className="whitespace-pre-wrap text-sm">{result}</pre>
              </CardContent>
            </Card>
          )}

          <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-2">💡 Dica importante:</p>
            <p>
              Cada bebê tem seu próprio ritmo de crescimento. Use esta calculadora como referência,
              mas lembre-se que o peso e altura do seu bebê são os melhores indicadores!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
