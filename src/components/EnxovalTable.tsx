import { memo, useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EnxovalItem, Config } from "@/types/enxoval";
import { formatCurrency } from "@/lib/calculations";
import { ExternalLink, Edit, Trash2, Calendar, Package, Tag, TrendingDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnxovalTableProps {
  items: EnxovalItem[];
  onEdit: (item: EnxovalItem) => void;
  onDelete: (id: string) => void;
  config: Config | null;
}

// Componente memoizado para cada linha da tabela
const TableRowMemo = memo(({ 
  item, 
  onEdit, 
  onDeleteClick,
  getRowColor,
  getPriorityColor,
  getStatusColor 
}: {
  item: EnxovalItem;
  onEdit: (item: EnxovalItem) => void;
  onDeleteClick: (id: string) => void;
  getRowColor: (item: EnxovalItem) => string;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}) => (
  <TableRow className={getRowColor(item)}>
    <TableCell>{new Date(item.date).toLocaleDateString('pt-BR')}</TableCell>
    <TableCell className="font-medium">{item.category}</TableCell>
    <TableCell>
      {item.link ? (
        <a 
          href={item.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          {item.item}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        item.item
      )}
    </TableCell>
    <TableCell>{item.necessity}</TableCell>
    <TableCell>
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className={getPriorityColor(item.priority)}>
          {item.priority}
        </Badge>
        {item.excessoRN && (
          <Badge variant="outline" className="bg-warning/20 text-warning-foreground border-warning text-xs">
            ⚠️ RN
          </Badge>
        )}
        {item.superfluoComprado && (
          <Badge variant="outline" className="bg-destructive/20 text-destructive-foreground border-destructive text-xs">
            ⚠️
          </Badge>
        )}
        {item.alertaTroca && (
          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-900 dark:text-yellow-100 border-yellow-500 text-xs">
            ⏰
          </Badge>
        )}
      </div>
    </TableCell>
    <TableCell>{item.size || "-"}</TableCell>
    <TableCell className="text-right">{item.plannedQty}</TableCell>
    <TableCell className="text-right">{formatCurrency(item.plannedPrice)}</TableCell>
    <TableCell className="text-right">{item.boughtQty}</TableCell>
    <TableCell className="text-right">{formatCurrency(item.unitPricePaid)}</TableCell>
    <TableCell className="text-right font-medium">{formatCurrency(item.subtotalPlanned)}</TableCell>
    <TableCell className="text-right font-medium">{formatCurrency(item.subtotalPaid)}</TableCell>
    <TableCell className="text-right font-semibold">
      <span className={item.savings > 0 ? "text-success" : item.savings < 0 ? "text-destructive" : ""}>
        {formatCurrency(item.savings)}
      </span>
    </TableCell>
    <TableCell>
      <Badge className={getStatusColor(item.status)}>
        {item.status}
      </Badge>
    </TableCell>
    <TableCell>{item.store || "-"}</TableCell>
    <TableCell className="text-right">
      <div className="flex gap-1 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(item)}
          className="gap-1 h-8 px-2"
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDeleteClick(item.id)}
          className="gap-1 h-8 px-2"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
));

TableRowMemo.displayName = "TableRowMemo";

// Componente memoizado para cada card mobile
const MobileCardMemo = memo(({ 
  item, 
  onEdit, 
  onDeleteClick,
  getRowColor,
  getPriorityColor,
  getStatusColor 
}: {
  item: EnxovalItem;
  onEdit: (item: EnxovalItem) => void;
  onDeleteClick: (id: string) => void;
  getRowColor: (item: EnxovalItem) => string;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}) => (
  <Card className={getRowColor(item)}>
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base font-semibold break-words">
            {item.link ? (
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                {item.item}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            ) : (
              item.item
            )}
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className={getPriorityColor(item.priority)}>
              {item.priority}
            </Badge>
            <Badge className={getStatusColor(item.status)}>
              {item.status}
            </Badge>
            {item.excessoRN && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="bg-warning/20 text-warning-foreground border-warning">
                      ⚠️ Excesso RN
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quantidade de itens RN acima do recomendado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {item.superfluoComprado && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="bg-destructive/20 text-destructive-foreground border-destructive">
                      ⚠️ Supérfluo
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Item marcado como "Não necessário" mas já comprado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {item.alertaTroca && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-900 dark:text-yellow-100 border-yellow-500">
                      ⏰ Troca próxima
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Data limite de troca se aproximando</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(item)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteClick(item.id)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3 pt-0">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">{item.category}</span>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">{item.necessity}</span>
        </div>
        {item.store && (
          <div className="text-sm">
            <span className="text-muted-foreground">Loja: </span>
            <span className="font-medium">{item.store}</span>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Planejado:</span>
          <span className="font-medium">{item.plannedQty}x {formatCurrency(item.plannedPrice)} = {formatCurrency(item.subtotalPlanned)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Comprado:</span>
          <span className="font-medium">{item.boughtQty}x {formatCurrency(item.unitPricePaid)} = {formatCurrency(item.subtotalPaid)}</span>
        </div>
        {item.savings !== 0 && (
          <div className="flex justify-between items-center text-sm pt-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              Economia:
            </span>
            <span className={`font-semibold ${item.savings > 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(item.savings)}
            </span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
));

MobileCardMemo.displayName = "MobileCardMemo";

const EnxovalTableComponent = ({ items, onEdit, onDelete, config }: EnxovalTableProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleDeleteClick = useCallback((id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (itemToDelete) {
      onDelete(itemToDelete);
      setItemToDelete(null);
    }
    setDeleteDialogOpen(false);
  }, [itemToDelete, onDelete]);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case "Alta":
        return "bg-destructive text-destructive-foreground";
      case "Média":
        return "bg-warning text-warning-foreground";
      case "Baixa":
        return "bg-muted text-muted-foreground";
      default:
        return "";
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "Comprado":
        return "bg-success text-success-foreground";
      case "A comprar":
        return "bg-primary text-primary-foreground";
      case "Em análise":
        return "bg-warning text-warning-foreground";
      case "Trocar/Devolver":
        return "bg-destructive text-destructive-foreground";
      default:
        return "";
    }
  }, []);

  const getRowColor = useCallback((item: EnxovalItem) => {
    if (item.subtotalPaid > item.subtotalPlanned && item.subtotalPlanned > 0) {
      return "bg-destructive/10";
    }
    if (item.savings > 0) {
      return "bg-success/10";
    }
    return "";
  }, []);

  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
          {items.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum item adicionado ainda. Clique em "Adicionar Item" para começar.
              </CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <MobileCardMemo
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDeleteClick={handleDeleteClick}
                getRowColor={getRowColor}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
              />
            ))
          )}
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar este item? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
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
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center text-muted-foreground py-8">
                    Nenhum item adicionado ainda. Clique em "Adicionar Item" para começar.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRowMemo
                    key={item.id}
                    item={item}
                    onEdit={onEdit}
                    onDeleteClick={handleDeleteClick}
                    getRowColor={getRowColor}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Memoização do componente principal
export const EnxovalTable = memo(EnxovalTableComponent);
