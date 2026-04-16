import { useCallback } from 'react';

import { EnxovalItem } from '@/types/enxoval';

export const useEnxovalTableStyles = () => {
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'bg-destructive text-destructive-foreground';
      case 'Média':
        return 'bg-warning text-warning-foreground';
      case 'Baixa':
        return 'bg-muted text-muted-foreground';
      default:
        return '';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Comprado':
        return 'bg-success text-success-foreground';
      case 'A comprar':
        return 'bg-primary text-primary-foreground';
      case 'Em análise':
        return 'bg-warning text-warning-foreground';
      case 'Trocar/Devolver':
        return 'bg-destructive text-destructive-foreground';
      default:
        return '';
    }
  }, []);

  const getRowColor = useCallback((item: EnxovalItem) => {
    if (item.subtotalPaid > item.subtotalPlanned && item.subtotalPlanned > 0) {
      return 'bg-destructive/10';
    }
    if (item.savings > 0) {
      return 'bg-success/10';
    }
    return '';
  }, []);

  return {
    getPriorityColor,
    getStatusColor,
    getRowColor,
  };
};
