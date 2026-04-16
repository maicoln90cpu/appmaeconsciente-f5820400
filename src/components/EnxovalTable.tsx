import { memo, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { EnxovalItem, Config } from '@/types/enxoval';
import { useIsMobile } from '@/hooks/useMobile';
import {
  EnxovalTableRow,
  EnxovalMobileCard,
  EnxovalDeleteDialog,
  EnxovalTableHeader,
  useEnxovalTableStyles,
} from '@/components/enxoval';

interface EnxovalTableProps {
  items: EnxovalItem[];
  onEdit: (item: EnxovalItem) => void;
  onDelete: (id: string) => void;
  config: Config | null;
}

const EnxovalTableComponent = ({ items, onEdit, onDelete }: EnxovalTableProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { getPriorityColor, getStatusColor, getRowColor } = useEnxovalTableStyles();

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
            items.map(item => (
              <EnxovalMobileCard
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

        <EnxovalDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
        />
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <EnxovalTableHeader />
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center text-muted-foreground py-8">
                    Nenhum item adicionado ainda. Clique em "Adicionar Item" para começar.
                  </TableCell>
                </TableRow>
              ) : (
                items.map(item => (
                  <EnxovalTableRow
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

      <EnxovalDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </>
  );
};

// Memoização do componente principal
export const EnxovalTable = memo(EnxovalTableComponent);
