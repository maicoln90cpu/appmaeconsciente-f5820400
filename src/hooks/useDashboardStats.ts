import { useMemo } from 'react';
import { EnxovalItem, Category } from '@/types/enxoval';
import { calculateTotals } from '@/lib/calculations';

interface CategoryData {
  planned: number;
  paid: number;
}

interface ChartDataItem {
  category: string;
  planejado: number;
  pago: number;
}

interface StatusDataItem {
  name: string;
  value: number;
}

interface DashboardStats {
  totals: ReturnType<typeof calculateTotals>;
  categoryData: Record<Category, CategoryData>;
  chartData: ChartDataItem[];
  statusData: StatusDataItem[];
  progressPercentage: number;
}

export const useDashboardStats = (items: EnxovalItem[]): DashboardStats => {
  const totals = useMemo(() => calculateTotals(items), [items]);

  const categoryData = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const cat = item.category;
        if (!acc[cat]) {
          acc[cat] = { planned: 0, paid: 0 };
        }
        acc[cat].planned += item.subtotalPlanned;
        acc[cat].paid += item.subtotalPaid;
        return acc;
      },
      {} as Record<Category, CategoryData>
    );
  }, [items]);

  const chartData = useMemo(() => {
    return Object.entries(categoryData).map(([category, values]) => ({
      category,
      planejado: values.planned,
      pago: values.paid,
    }));
  }, [categoryData]);

  const statusData = useMemo(() => {
    return [
      { name: 'A comprar', value: items.filter(i => i.status === 'A comprar').length },
      { name: 'Comprado', value: items.filter(i => i.status === 'Comprado').length },
    ].filter(d => d.value > 0);
  }, [items]);

  const progressPercentage = useMemo(() => {
    return items.length > 0 ? Math.round((totals.itemsBought / items.length) * 100) : 0;
  }, [items.length, totals.itemsBought]);

  return {
    totals,
    categoryData,
    chartData,
    statusData,
    progressPercentage,
  };
};
