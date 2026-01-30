/**
 * @fileoverview Hook para gerenciar medições de crescimento do bebê
 * Migrado para usar createSupabaseCRUD com QueryKeys centralizados
 */

import { useMemo } from "react";
import { createSupabaseCRUD } from "@/hooks/factories/createSupabaseCRUD";
import { QueryKeys, QueryCacheConfig } from "@/lib/query-config";
import type { Database } from "@/integrations/supabase/types";

type GrowthMeasurementRow = Database['public']['Tables']['growth_measurements']['Row'];
type GrowthMeasurementInsert = Database['public']['Tables']['growth_measurements']['Insert'];

export type GrowthMeasurement = GrowthMeasurementRow;

export interface GrowthMeasurementInput {
  baby_profile_id?: string;
  measurement_date: string;
  weight_kg?: number;
  height_cm?: number;
  head_circumference_cm?: number;
  notes?: string;
}

// WHO Growth Standards (simplified - 0-24 months)
export const WHO_WEIGHT_BOYS = [
  { month: 0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.4 },
  { month: 1, p3: 3.4, p15: 3.9, p50: 4.5, p85: 5.1, p97: 5.8 },
  { month: 2, p3: 4.3, p15: 4.9, p50: 5.6, p85: 6.3, p97: 7.1 },
  { month: 3, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.2, p97: 8.0 },
  { month: 4, p3: 5.6, p15: 6.2, p50: 7.0, p85: 7.8, p97: 8.7 },
  { month: 5, p3: 6.0, p15: 6.7, p50: 7.5, p85: 8.4, p97: 9.3 },
  { month: 6, p3: 6.4, p15: 7.1, p50: 7.9, p85: 8.8, p97: 9.8 },
  { month: 7, p3: 6.7, p15: 7.4, p50: 8.3, p85: 9.2, p97: 10.3 },
  { month: 8, p3: 6.9, p15: 7.7, p50: 8.6, p85: 9.6, p97: 10.7 },
  { month: 9, p3: 7.1, p15: 7.9, p50: 8.9, p85: 9.9, p97: 11.0 },
  { month: 10, p3: 7.4, p15: 8.2, p50: 9.2, p85: 10.2, p97: 11.4 },
  { month: 11, p3: 7.6, p15: 8.4, p50: 9.4, p85: 10.5, p97: 11.7 },
  { month: 12, p3: 7.7, p15: 8.6, p50: 9.6, p85: 10.8, p97: 12.0 },
  { month: 18, p3: 8.8, p15: 9.8, p50: 10.9, p85: 12.2, p97: 13.7 },
  { month: 24, p3: 9.7, p15: 10.8, p50: 12.2, p85: 13.6, p97: 15.3 },
];

export const WHO_WEIGHT_GIRLS = [
  { month: 0, p3: 2.4, p15: 2.8, p50: 3.2, p85: 3.7, p97: 4.2 },
  { month: 1, p3: 3.2, p15: 3.6, p50: 4.2, p85: 4.8, p97: 5.5 },
  { month: 2, p3: 3.9, p15: 4.5, p50: 5.1, p85: 5.8, p97: 6.6 },
  { month: 3, p3: 4.5, p15: 5.2, p50: 5.8, p85: 6.6, p97: 7.5 },
  { month: 4, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.3, p97: 8.2 },
  { month: 5, p3: 5.4, p15: 6.1, p50: 6.9, p85: 7.8, p97: 8.8 },
  { month: 6, p3: 5.7, p15: 6.5, p50: 7.3, p85: 8.2, p97: 9.3 },
  { month: 7, p3: 6.0, p15: 6.8, p50: 7.6, p85: 8.6, p97: 9.8 },
  { month: 8, p3: 6.3, p15: 7.0, p50: 7.9, p85: 9.0, p97: 10.2 },
  { month: 9, p3: 6.5, p15: 7.3, p50: 8.2, p85: 9.3, p97: 10.5 },
  { month: 10, p3: 6.7, p15: 7.5, p50: 8.5, p85: 9.6, p97: 10.9 },
  { month: 11, p3: 6.9, p15: 7.7, p50: 8.7, p85: 9.9, p97: 11.2 },
  { month: 12, p3: 7.0, p15: 7.9, p50: 8.9, p85: 10.1, p97: 11.5 },
  { month: 18, p3: 8.1, p15: 9.1, p50: 10.2, p85: 11.6, p97: 13.2 },
  { month: 24, p3: 9.0, p15: 10.2, p50: 11.5, p85: 13.0, p97: 14.8 },
];

export const WHO_HEIGHT_BOYS = [
  { month: 0, p3: 46.1, p15: 47.9, p50: 49.9, p85: 51.8, p97: 53.7 },
  { month: 1, p3: 50.8, p15: 52.8, p50: 54.7, p85: 56.7, p97: 58.6 },
  { month: 2, p3: 54.4, p15: 56.4, p50: 58.4, p85: 60.4, p97: 62.4 },
  { month: 3, p3: 57.3, p15: 59.4, p50: 61.4, p85: 63.5, p97: 65.5 },
  { month: 4, p3: 59.7, p15: 61.8, p50: 63.9, p85: 66.0, p97: 68.0 },
  { month: 5, p3: 61.7, p15: 63.8, p50: 65.9, p85: 68.0, p97: 70.1 },
  { month: 6, p3: 63.3, p15: 65.5, p50: 67.6, p85: 69.8, p97: 71.9 },
  { month: 7, p3: 64.8, p15: 67.0, p50: 69.2, p85: 71.3, p97: 73.5 },
  { month: 8, p3: 66.2, p15: 68.4, p50: 70.6, p85: 72.8, p97: 75.0 },
  { month: 9, p3: 67.5, p15: 69.7, p50: 72.0, p85: 74.2, p97: 76.5 },
  { month: 10, p3: 68.7, p15: 71.0, p50: 73.3, p85: 75.6, p97: 77.9 },
  { month: 11, p3: 69.9, p15: 72.2, p50: 74.5, p85: 76.9, p97: 79.2 },
  { month: 12, p3: 71.0, p15: 73.4, p50: 75.7, p85: 78.1, p97: 80.5 },
  { month: 18, p3: 76.9, p15: 79.6, p50: 82.3, p85: 85.0, p97: 87.7 },
  { month: 24, p3: 81.7, p15: 84.8, p50: 87.8, p85: 90.9, p97: 93.9 },
];

export const WHO_HEIGHT_GIRLS = [
  { month: 0, p3: 45.4, p15: 47.3, p50: 49.1, p85: 51.0, p97: 52.9 },
  { month: 1, p3: 49.8, p15: 51.7, p50: 53.7, p85: 55.6, p97: 57.6 },
  { month: 2, p3: 53.0, p15: 55.0, p50: 57.1, p85: 59.1, p97: 61.1 },
  { month: 3, p3: 55.6, p15: 57.7, p50: 59.8, p85: 61.9, p97: 64.0 },
  { month: 4, p3: 57.8, p15: 59.9, p50: 62.1, p85: 64.3, p97: 66.4 },
  { month: 5, p3: 59.6, p15: 61.8, p50: 64.0, p85: 66.2, p97: 68.5 },
  { month: 6, p3: 61.2, p15: 63.5, p50: 65.7, p85: 68.0, p97: 70.3 },
  { month: 7, p3: 62.7, p15: 65.0, p50: 67.3, p85: 69.6, p97: 71.9 },
  { month: 8, p3: 64.0, p15: 66.4, p50: 68.7, p85: 71.1, p97: 73.5 },
  { month: 9, p3: 65.3, p15: 67.7, p50: 70.1, p85: 72.6, p97: 75.0 },
  { month: 10, p3: 66.5, p15: 69.0, p50: 71.5, p85: 73.9, p97: 76.4 },
  { month: 11, p3: 67.7, p15: 70.3, p50: 72.8, p85: 75.3, p97: 77.8 },
  { month: 12, p3: 68.9, p15: 71.4, p50: 74.0, p85: 76.6, p97: 79.2 },
  { month: 18, p3: 74.9, p15: 77.8, p50: 80.7, p85: 83.6, p97: 86.5 },
  { month: 24, p3: 80.0, p15: 83.2, p50: 86.4, p85: 89.6, p97: 92.9 },
];

// Base hook using factory com QueryKeys centralizados
const useGrowthBase = createSupabaseCRUD<GrowthMeasurementRow, GrowthMeasurementInsert>({
  tableName: 'growth_measurements',
  queryKey: QueryKeys.growthMeasurements(),
  orderBy: 'measurement_date',
  orderDirection: 'asc',
  messages: {
    addSuccess: 'Medição registrada com sucesso!',
    addError: 'Erro ao registrar medição',
    updateSuccess: 'Medição atualizada!',
    deleteSuccess: 'Medição removida!',
  },
});

export const useGrowthMeasurements = (babyProfileId?: string) => {
  const base = useGrowthBase();

  // Filter by baby profile if provided
  const measurements = useMemo(() => {
    if (!babyProfileId) return base.data;
    return base.data.filter(m => m.baby_profile_id === babyProfileId);
  }, [base.data, babyProfileId]);

  // Get latest measurement
  const latestMeasurement = useMemo(() => 
    measurements[measurements.length - 1] || null,
    [measurements]
  );

  // Calculate percentile
  const calculatePercentile = (
    value: number,
    ageMonths: number,
    type: "weight" | "height",
    gender: "male" | "female"
  ): string => {
    const data =
      type === "weight"
        ? gender === "male"
          ? WHO_WEIGHT_BOYS
          : WHO_WEIGHT_GIRLS
        : gender === "male"
        ? WHO_HEIGHT_BOYS
        : WHO_HEIGHT_GIRLS;

    // Find closest age
    const closest = data.reduce((prev, curr) =>
      Math.abs(curr.month - ageMonths) < Math.abs(prev.month - ageMonths) ? curr : prev
    );

    if (value <= closest.p3) return "<3";
    if (value <= closest.p15) return "3-15";
    if (value <= closest.p50) return "15-50";
    if (value <= closest.p85) return "50-85";
    if (value <= closest.p97) return "85-97";
    return ">97";
  };

  return {
    measurements,
    latestMeasurement,
    isLoading: base.isLoading,
    addMeasurement: base.add,
    updateMeasurement: base.update,
    deleteMeasurement: base.remove,
    isAdding: base.isAdding,
    calculatePercentile,
    WHO_WEIGHT_BOYS,
    WHO_WEIGHT_GIRLS,
    WHO_HEIGHT_BOYS,
    WHO_HEIGHT_GIRLS,
  };
};
