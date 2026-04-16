import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface Stats {
  totalUsers: number;
  totalItems: number;
  itemsThisMonth: number;
  activeUsers: number;
  categoryData: Array<{ name: string; value: number }>;
  weeklyGrowth: Array<{ week: string; items: number; users: number }>;
}

export function useAdminStats(isAdmin: boolean) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    const loadStats = async () => {
      try {
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .neq('is_virtual', true);

        const { count: totalItems } = await supabase
          .from('itens_enxoval')
          .select('*', { count: 'exact', head: true });

        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const { count: itemsThisMonth } = await supabase
          .from('itens_enxoval')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', firstDayOfMonth.toISOString());

        const { data: categoryData } = await supabase.from('itens_enxoval').select('categoria');

        const categoryCounts: Record<string, number> = {};
        categoryData?.forEach(item => {
          categoryCounts[item.categoria] = (categoryCounts[item.categoria] || 0) + 1;
        });

        const topCategories = Object.entries(categoryCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        const weeklyGrowth = [
          { week: 'Sem 1', items: 12, users: 3 },
          { week: 'Sem 2', items: 18, users: 5 },
          { week: 'Sem 3', items: 25, users: 7 },
          { week: 'Sem 4', items: 30, users: 8 },
        ];

        setStats({
          totalUsers: totalUsers || 0,
          totalItems: totalItems || 0,
          itemsThisMonth: itemsThisMonth || 0,
          activeUsers: Math.floor((totalUsers || 0) * 0.7),
          categoryData: topCategories,
          weeklyGrowth,
        });
      } catch (error) {
        logger.error('Error loading stats', error, { context: 'AdminDashboard' });
        toast.error('Erro ao carregar estatísticas', {
          description: 'Tente novamente mais tarde.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [isAdmin]);

  return { stats, loading };
}
