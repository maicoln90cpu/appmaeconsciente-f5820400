/**
 * Draft status indicator component
 * Shows auto-save status and draft recovery options
 */

import { useState } from 'react';
import { Cloud, CloudOff, Check, Loader2, FileText, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DraftEntry } from '@/lib/indexed-db';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DraftIndicatorProps {
  isSaving: boolean;
  hasSavedRecently: boolean;
  lastSavedAt: Date | null;
  availableDrafts: DraftEntry[];
  onLoadDraft?: (id: string) => void;
  onDeleteDraft?: (id: string) => void;
  onDeleteCurrentDraft?: () => void;
  className?: string;
  showDraftsList?: boolean;
}

export function DraftIndicator({
  isSaving,
  hasSavedRecently,
  lastSavedAt,
  availableDrafts,
  onLoadDraft,
  onDeleteDraft,
  onDeleteCurrentDraft,
  className,
  showDraftsList = true,
}: DraftIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusIcon = () => {
    if (isSaving) {
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
    }
    if (hasSavedRecently) {
      return <Check className="h-3.5 w-3.5 text-primary" />;
    }
    if (lastSavedAt) {
      return <Cloud className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    return <CloudOff className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (isSaving) return 'Salvando...';
    if (hasSavedRecently) return 'Salvo';
    if (lastSavedAt) {
      return `Salvo ${formatDistanceToNow(lastSavedAt, { addSuffix: true, locale: ptBR })}`;
    }
    return 'Não salvo';
  };

  if (!showDraftsList || availableDrafts.length === 0) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('h-7 gap-1.5 px-2 text-xs', className)}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
          {availableDrafts.length > 1 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {availableDrafts.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Rascunhos Salvos
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {availableDrafts.slice(0, 5).map(draft => {
          const draftData = draft.data as Record<string, unknown>;
          const previewText = getPreviewText(draftData);

          return (
            <DropdownMenuItem
              key={draft.id}
              className="flex items-start justify-between gap-2 py-2"
              onSelect={e => e.preventDefault()}
            >
              <button
                className="flex-1 text-left"
                onClick={() => {
                  onLoadDraft?.(draft.id);
                  setIsOpen(false);
                }}
              >
                <div className="text-sm font-medium truncate max-w-[160px]">
                  {previewText || 'Rascunho sem título'}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(draft.updatedAt, { addSuffix: true, locale: ptBR })}
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={e => {
                  e.stopPropagation();
                  onDeleteDraft?.(draft.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </DropdownMenuItem>
          );
        })}

        {availableDrafts.length > 5 && (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            +{availableDrafts.length - 5} rascunhos mais antigos
          </DropdownMenuItem>
        )}

        {onDeleteCurrentDraft && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                onDeleteCurrentDraft();
                setIsOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Descartar rascunho atual
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getPreviewText(data: Record<string, unknown>): string {
  // Try common field names for preview
  const previewFields = ['item', 'title', 'content', 'name', 'nome', 'titulo'];

  for (const field of previewFields) {
    if (data[field] && typeof data[field] === 'string') {
      const text = data[field] as string;
      return text.length > 30 ? text.substring(0, 30) + '...' : text;
    }
  }

  return '';
}
