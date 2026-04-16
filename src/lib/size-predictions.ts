/**
 * @fileoverview Utilitários para previsão de tamanhos de roupas e fraldas
 * baseado em curvas de crescimento OMS
 */

import {
  WHO_WEIGHT_BOYS,
  WHO_WEIGHT_GIRLS,
  WHO_HEIGHT_BOYS,
  WHO_HEIGHT_GIRLS,
} from '@/hooks/useGrowthMeasurements';

// Tabela de tamanhos de roupas (Brasil)
export const CLOTHING_SIZES = [
  { size: 'RN', minWeight: 0, maxWeight: 3.5, minHeight: 0, maxHeight: 50, maxMonths: 1 },
  { size: 'P', minWeight: 3.5, maxWeight: 5.5, minHeight: 50, maxHeight: 60, maxMonths: 3 },
  { size: 'M', minWeight: 5.5, maxWeight: 7.5, minHeight: 60, maxHeight: 68, maxMonths: 6 },
  { size: 'G', minWeight: 7.5, maxWeight: 9.5, minHeight: 68, maxHeight: 75, maxMonths: 9 },
  { size: 'GG', minWeight: 9.5, maxWeight: 12, minHeight: 75, maxHeight: 80, maxMonths: 12 },
  { size: '1 ano', minWeight: 12, maxWeight: 14, minHeight: 80, maxHeight: 86, maxMonths: 18 },
  { size: '2 anos', minWeight: 14, maxWeight: 16, minHeight: 86, maxHeight: 92, maxMonths: 24 },
];

// Tabela de tamanhos de fraldas
export const DIAPER_SIZES = [
  { size: 'RN', minWeight: 0, maxWeight: 4, dailyUsage: 10, description: 'Recém-nascido' },
  { size: 'P', minWeight: 3, maxWeight: 6, dailyUsage: 8, description: 'Pequeno' },
  { size: 'M', minWeight: 5, maxWeight: 10, dailyUsage: 7, description: 'Médio' },
  { size: 'G', minWeight: 9, maxWeight: 14, dailyUsage: 6, description: 'Grande' },
  { size: 'XG', minWeight: 12, maxWeight: 18, dailyUsage: 5, description: 'Extra Grande' },
  { size: 'XXG', minWeight: 16, maxWeight: 25, dailyUsage: 4, description: 'Extra Extra Grande' },
];

export interface SizePrediction {
  size: string;
  startMonth: number;
  endMonth: number;
  durationWeeks: number;
  estimatedStartWeight: number;
  estimatedEndWeight: number;
  recommendedQuantity?: number;
  diapersNeeded?: number;
}

export interface BabyGrowthPrediction {
  currentAge: number; // months
  currentWeight?: number;
  currentHeight?: number;
  gender: 'male' | 'female';
  percentile: 'p3' | 'p15' | 'p50' | 'p85' | 'p97';
}

// Interpolar peso para um mês específico
const interpolateWeight = (
  months: number,
  gender: 'male' | 'female',
  percentile: 'p3' | 'p15' | 'p50' | 'p85' | 'p97'
): number => {
  const data = gender === 'male' ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS;

  if (months <= 0) return data[0][percentile];
  if (months >= 24) return data[data.length - 1][percentile];

  // Find surrounding months
  const lower = data.filter(d => d.month <= months).pop() || data[0];
  const upper = data.find(d => d.month > months) || data[data.length - 1];

  if (lower.month === upper.month) return lower[percentile];

  // Linear interpolation
  const ratio = (months - lower.month) / (upper.month - lower.month);
  return lower[percentile] + ratio * (upper[percentile] - lower[percentile]);
};

// Encontrar em qual mês o bebê atingirá determinado peso
const findMonthForWeight = (
  targetWeight: number,
  gender: 'male' | 'female',
  percentile: 'p3' | 'p15' | 'p50' | 'p85' | 'p97',
  startMonth: number = 0
): number => {
  for (let month = startMonth; month <= 24; month += 0.5) {
    const weight = interpolateWeight(month, gender, percentile);
    if (weight >= targetWeight) return month;
  }
  return 24;
};

// Prever tamanhos de roupas
export const predictClothingSizes = (prediction: BabyGrowthPrediction): SizePrediction[] => {
  const results: SizePrediction[] = [];
  const { gender, percentile, currentAge } = prediction;

  CLOTHING_SIZES.forEach((sizeInfo, index) => {
    // Encontrar quando o bebê atinge o peso mínimo deste tamanho
    const startMonth =
      index === 0 ? 0 : findMonthForWeight(sizeInfo.minWeight, gender, percentile, 0);

    // Encontrar quando o bebê ultrapassa o peso máximo
    const endMonth = findMonthForWeight(sizeInfo.maxWeight, gender, percentile, startMonth);

    // Só incluir tamanhos que ainda serão usados
    if (endMonth > currentAge || startMonth <= currentAge) {
      const durationWeeks = Math.round((endMonth - startMonth) * 4.33);

      results.push({
        size: sizeInfo.size,
        startMonth: Math.max(0, startMonth),
        endMonth: Math.min(24, endMonth),
        durationWeeks: Math.max(1, durationWeeks),
        estimatedStartWeight: interpolateWeight(startMonth, gender, percentile),
        estimatedEndWeight: interpolateWeight(endMonth, gender, percentile),
        recommendedQuantity: getRecommendedClothingQuantity(sizeInfo.size, durationWeeks),
      });
    }
  });

  return results;
};

// Prever tamanhos de fraldas
export const predictDiaperSizes = (prediction: BabyGrowthPrediction): SizePrediction[] => {
  const results: SizePrediction[] = [];
  const { gender, percentile, currentAge } = prediction;

  DIAPER_SIZES.forEach((sizeInfo, index) => {
    const startMonth =
      index === 0 ? 0 : findMonthForWeight(sizeInfo.minWeight, gender, percentile, 0);

    const endMonth = findMonthForWeight(sizeInfo.maxWeight, gender, percentile, startMonth);

    if (endMonth > currentAge || startMonth <= currentAge) {
      const durationWeeks = Math.round((endMonth - startMonth) * 4.33);
      const daysInSize = durationWeeks * 7;
      const diapersNeeded = Math.ceil(daysInSize * sizeInfo.dailyUsage);

      results.push({
        size: sizeInfo.size,
        startMonth: Math.max(0, startMonth),
        endMonth: Math.min(24, endMonth),
        durationWeeks: Math.max(1, durationWeeks),
        estimatedStartWeight: interpolateWeight(startMonth, gender, percentile),
        estimatedEndWeight: interpolateWeight(endMonth, gender, percentile),
        diapersNeeded,
      });
    }
  });

  return results;
};

// Quantidade recomendada de roupas por tamanho
const getRecommendedClothingQuantity = (size: string, durationWeeks: number): number => {
  const baseQuantities: Record<string, number> = {
    RN: 6, // Usam pouco tempo
    P: 8,
    M: 10,
    G: 10,
    GG: 10,
    '1 ano': 12,
    '2 anos': 12,
  };

  const base = baseQuantities[size] || 8;

  // Ajustar baseado na duração
  if (durationWeeks < 4) return Math.ceil(base * 0.5);
  if (durationWeeks < 8) return Math.ceil(base * 0.75);
  return base;
};

// Obter tamanho atual baseado no peso
export const getCurrentClothingSize = (weightKg: number): string => {
  for (const size of CLOTHING_SIZES) {
    if (weightKg >= size.minWeight && weightKg < size.maxWeight) {
      return size.size;
    }
  }
  return CLOTHING_SIZES[CLOTHING_SIZES.length - 1].size;
};

// Obter tamanho de fralda atual baseado no peso
export const getCurrentDiaperSize = (weightKg: number): string => {
  for (const size of DIAPER_SIZES) {
    if (weightKg >= size.minWeight && weightKg <= size.maxWeight) {
      return size.size;
    }
  }
  return DIAPER_SIZES[DIAPER_SIZES.length - 1].size;
};

// Calcular quando trocar de tamanho
export const getNextSizeChange = (
  currentWeightKg: number,
  ageMonths: number,
  gender: 'male' | 'female',
  percentile: 'p3' | 'p15' | 'p50' | 'p85' | 'p97'
): { nextSize: string; estimatedMonthsUntilChange: number } | null => {
  const currentSize = getCurrentClothingSize(currentWeightKg);
  const currentIndex = CLOTHING_SIZES.findIndex(s => s.size === currentSize);

  if (currentIndex < 0 || currentIndex >= CLOTHING_SIZES.length - 1) {
    return null;
  }

  const nextSizeInfo = CLOTHING_SIZES[currentIndex + 1];
  const monthForNextSize = findMonthForWeight(
    nextSizeInfo.minWeight,
    gender,
    percentile,
    ageMonths
  );

  return {
    nextSize: nextSizeInfo.size,
    estimatedMonthsUntilChange: Math.max(0, monthForNextSize - ageMonths),
  };
};

// Formatar meses para exibição
export const formatMonthRange = (startMonth: number, endMonth: number): string => {
  const formatMonth = (m: number) => {
    if (m === 0) return 'Nascimento';
    if (m < 1) return `${Math.round(m * 30)} dias`;
    if (m === 1) return '1 mês';
    return `${Math.round(m)} meses`;
  };

  return `${formatMonth(startMonth)} → ${formatMonth(endMonth)}`;
};
