/**
 * @fileoverview Testes para funções de cálculo do enxoval
 * @module test/lib/calculations.test
 */

import { describe, it, expect } from 'vitest';

import {
  calculatePriority,
  calculateSubtotalPlanned,
  calculateSubtotalPaid,
  calculateSavings,
  calculateSavingsPercent,
  calculateTotals,
  formatCurrency,
} from '@/lib/calculations';

import { EnxovalItem } from '@/types/enxoval';

describe('calculatePriority', () => {
  it("should return 'Alta' for 'Necessário'", () => {
    expect(calculatePriority('Necessário')).toBe('Alta');
  });

  it("should return 'Média' for 'Depois'", () => {
    expect(calculatePriority('Depois')).toBe('Média');
  });

  it("should return 'Baixa' for 'Não'", () => {
    expect(calculatePriority('Não')).toBe('Baixa');
  });
});

describe('calculateSubtotalPlanned', () => {
  it('should calculate correctly for positive values', () => {
    expect(calculateSubtotalPlanned(5, 10)).toBe(50);
  });

  it('should return 0 for zero quantity', () => {
    expect(calculateSubtotalPlanned(0, 10)).toBe(0);
  });

  it('should return 0 for zero price', () => {
    expect(calculateSubtotalPlanned(5, 0)).toBe(0);
  });

  it('should handle decimal values', () => {
    expect(calculateSubtotalPlanned(3, 19.99)).toBeCloseTo(59.97);
  });
});

describe('calculateSubtotalPaid', () => {
  it('should calculate correctly with all values', () => {
    // qty * (unitPrice + frete - desconto)
    // 2 * (50 + 10 - 5) = 2 * 55 = 110
    expect(calculateSubtotalPaid(2, 50, 10, 5)).toBe(110);
  });

  it('should handle zero frete and desconto', () => {
    expect(calculateSubtotalPaid(3, 20, 0, 0)).toBe(60);
  });

  it('should handle when desconto equals frete', () => {
    expect(calculateSubtotalPaid(2, 30, 10, 10)).toBe(60);
  });
});

describe('calculateSavings', () => {
  it('should return positive when planned > paid', () => {
    expect(calculateSavings(100, 80)).toBe(20);
  });

  it('should return negative when paid > planned', () => {
    expect(calculateSavings(80, 100)).toBe(-20);
  });

  it('should return zero when equal', () => {
    expect(calculateSavings(100, 100)).toBe(0);
  });
});

describe('calculateSavingsPercent', () => {
  it('should calculate percentage correctly', () => {
    expect(calculateSavingsPercent(100, 80)).toBe(20);
  });

  it('should return 0 when planned is 0', () => {
    expect(calculateSavingsPercent(0, 50)).toBe(0);
  });

  it('should return negative percentage when over budget', () => {
    expect(calculateSavingsPercent(100, 120)).toBe(-20);
  });
});

describe('calculateTotals', () => {
  const mockItems: EnxovalItem[] = [
    {
      id: '1',
      item: 'Body',
      category: 'Roupas',
      necessity: 'Necessário',
      priority: 'Alta',
      plannedQty: 5,
      plannedPrice: 20,
      boughtQty: 5,
      unitPricePaid: 18,
      frete: 0,
      desconto: 0,
      precoReferencia: 25,
      subtotalPlanned: 100,
      subtotalPaid: 90,
      savings: 10,
      savingsPercent: 10,
      status: 'Comprado',
      tags: [],
    },
    {
      id: '2',
      item: 'Macacão',
      category: 'Roupas',
      necessity: 'Depois',
      priority: 'Média',
      plannedQty: 3,
      plannedPrice: 50,
      boughtQty: 0,
      unitPricePaid: 0,
      frete: 0,
      desconto: 0,
      precoReferencia: 60,
      subtotalPlanned: 150,
      subtotalPaid: 0,
      savings: 150,
      savingsPercent: 100,
      status: 'A comprar',
      classificacao: 'Supérfluo',
      tags: [],
    },
  ];

  it('should calculate totalPlanned correctly', () => {
    const result = calculateTotals(mockItems);
    expect(result.totalPlanned).toBe(250);
  });

  it('should calculate totalPaid correctly', () => {
    const result = calculateTotals(mockItems);
    expect(result.totalPaid).toBe(90);
  });

  it('should calculate progress correctly', () => {
    const result = calculateTotals(mockItems);
    expect(result.progress).toBe(50); // 1 of 2 items bought
  });

  it('should count items correctly', () => {
    const result = calculateTotals(mockItems);
    expect(result.itemsBought).toBe(1);
    expect(result.itemsToBuy).toBe(1);
    expect(result.totalItems).toBe(2);
  });

  it('should calculate superfluos correctly', () => {
    const result = calculateTotals(mockItems);
    expect(result.superfluosEvitados).toBe(1);
  });

  it('should handle empty array', () => {
    const result = calculateTotals([]);
    expect(result.totalPlanned).toBe(0);
    expect(result.totalPaid).toBe(0);
    expect(result.progress).toBe(0);
  });

  it('should calculate orcamentoRestante with budget', () => {
    const result = calculateTotals(mockItems, 500);
    expect(result.orcamentoRestante).toBe(410);
  });
});

describe('formatCurrency', () => {
  it('should format positive values correctly', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1.234,56');
    expect(result).toContain('R$');
  });

  it('should format zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0,00');
  });

  it('should format negative values correctly', () => {
    const result = formatCurrency(-50);
    expect(result).toContain('50,00');
  });
});
