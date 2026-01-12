import { memo } from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const EnxovalTableHeader = memo(() => (
  <TableHeader>
    <TableRow className="bg-muted/50">
      <TableHead className="font-semibold">Data</TableHead>
      <TableHead className="font-semibold">Categoria</TableHead>
      <TableHead className="font-semibold">Item</TableHead>
      <TableHead className="font-semibold">Necessidade</TableHead>
      <TableHead className="font-semibold">Prioridade</TableHead>
      <TableHead className="font-semibold">Tamanho</TableHead>
      <TableHead className="font-semibold text-right">Qtd Plan.</TableHead>
      <TableHead className="font-semibold text-right">Preço Plan.</TableHead>
      <TableHead className="font-semibold text-right">Qtd Compr.</TableHead>
      <TableHead className="font-semibold text-right">Preço Pago</TableHead>
      <TableHead className="font-semibold text-right">Total Plan.</TableHead>
      <TableHead className="font-semibold text-right">Total Pago</TableHead>
      <TableHead className="font-semibold text-right">Economia</TableHead>
      <TableHead className="font-semibold">Status</TableHead>
      <TableHead className="font-semibold">Loja</TableHead>
      <TableHead className="font-semibold text-right">Ações</TableHead>
    </TableRow>
  </TableHeader>
));

EnxovalTableHeader.displayName = "EnxovalTableHeader";
