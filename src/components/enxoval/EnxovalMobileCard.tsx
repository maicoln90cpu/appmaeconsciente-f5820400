import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EnxovalItem } from "@/types/enxoval";
import { formatCurrency } from "@/lib/calculations";
import { ExternalLink, Edit, Trash2, Calendar, Package, Tag, TrendingDown } from "lucide-react";

interface EnxovalMobileCardProps {
  item: EnxovalItem;
  onEdit: (item: EnxovalItem) => void;
  onDeleteClick: (id: string) => void;
  getRowColor: (item: EnxovalItem) => string;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

export const EnxovalMobileCard = memo(({ 
  item, 
  onEdit, 
  onDeleteClick,
  getRowColor,
  getPriorityColor,
  getStatusColor 
}: EnxovalMobileCardProps) => (
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

EnxovalMobileCard.displayName = "EnxovalMobileCard";
