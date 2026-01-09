/**
 * @fileoverview Hook para gerenciar registros de cólica do bebê
 * Migrado para usar createSupabaseCRUD
 */

import { useMemo } from "react";
import { createSupabaseCRUD } from "@/hooks/factories/createSupabaseCRUD";
import type { Database } from "@/integrations/supabase/types";

type BabyColicsRow = Database['public']['Tables']['baby_colic_logs']['Row'];
type BabyColicsInsert = Database['public']['Tables']['baby_colic_logs']['Insert'];

export type BabyColicLog = BabyColicsRow;

export const COLIC_TRIGGERS = [
  'Após mamada',
  'Gases',
  'Fome',
  'Cansaço',
  'Superestimulação',
  'Mudança de rotina',
  'Desconhecido',
] as const;

export const RELIEF_METHODS = [
  'Colo',
  'Massagem abdominal',
  'Exercício de bicicleta',
  'Banho morno',
  'Ruído branco',
  'Passeio de carro',
  'Balanço/embalo',
  'Chupeta',
  'Enrolar no cueiro',
  'Posição de avião',
] as const;

// Base hook using factory
const useColicBase = createSupabaseCRUD<BabyColicsRow, BabyColicsInsert>({
  tableName: 'baby_colic_logs',
  queryKey: ['baby-colic-logs'],
  orderBy: 'start_time',
  orderDirection: 'desc',
  messages: {
    addSuccess: 'Episódio de cólica registrado',
    addError: 'Erro ao registrar episódio',
    updateSuccess: 'Episódio atualizado',
    deleteSuccess: 'Episódio removido',
  },
});

function getMostCommon(arr: string[]): string | null {
  if (arr.length === 0) return null;
  const counts = arr.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

export const useBabyColic = (babyProfileId?: string) => {
  const base = useColicBase();

  // Filter by baby profile if provided
  const colicLogs = useMemo(() => {
    if (!babyProfileId) return base.data;
    return base.data.filter(log => log.baby_profile_id === babyProfileId);
  }, [base.data, babyProfileId]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!colicLogs || colicLogs.length === 0) return null;

    const logsWithDuration = colicLogs.filter(l => l.duration_minutes);
    const avgDuration = logsWithDuration.length > 0 
      ? logsWithDuration.reduce((acc, l) => acc + (l.duration_minutes || 0), 0) / logsWithDuration.length
      : 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return {
      totalEpisodes: colicLogs.length,
      averageDuration: avgDuration,
      mostCommonTrigger: getMostCommon(colicLogs.flatMap(l => l.triggers || [])),
      mostEffectiveRelief: getMostCommon(colicLogs.flatMap(l => l.relief_methods || [])),
      episodesThisWeek: colicLogs.filter(l => new Date(l.start_time) >= weekAgo).length,
    };
  }, [colicLogs]);

  return {
    colicLogs,
    stats,
    isLoading: base.isLoading,
    addColicLog: base.add,
    updateColicLog: base.update,
    deleteColicLog: base.remove,
    isAdding: base.isAdding,
  };
};
