import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { DEFAULT_RN_LIMITS } from "@/constants/rnLimits";

export const RNGuideTable = () => {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Adapte ao clima/local e ao seu hospital. Se tiver dúvidas, compre menos RN e complemente depois.
        </AlertDescription>
      </Alert>
      
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Item</TableHead>
              <TableHead className="font-semibold text-center">Máx. RN</TableHead>
              <TableHead className="font-semibold">Quando aumentar</TableHead>
              <TableHead className="font-semibold">Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DEFAULT_RN_LIMITS.map((limite) => (
              <TableRow key={limite.item}>
                <TableCell className="font-medium">{limite.item}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                    {limite.limite}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {limite.quando_aumentar || '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {limite.observacoes || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
        <p className="font-semibold mb-2">💡 Racional:</p>
        <p>
          A fase RN dura poucas semanas; por isso o teto é baixo para evitar desperdício. 
          A regra geral é priorizar tamanho P para o grosso das compras e manter RN apenas 
          para a mala da maternidade + primeiros dias.
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-center">
        <p className="text-base text-muted-foreground italic">
          "Cada peça escolhida com consciência vale mais do que um armário cheio de excessos. Confie na sua intuição — e no seu método."
        </p>
      </div>
    </div>
  );
};
