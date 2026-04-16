/**
 * @fileoverview Funções de cálculo para o gerenciador de enxoval
 * @module lib/calculations
 *
 * Contém todas as funções de cálculo financeiro e estatístico
 * utilizadas no planejamento e acompanhamento do enxoval.
 */

import { EnxovalItem, Priority, Necessity } from '@/types/enxoval';

/**
 * Determina a prioridade do item baseado na necessidade
 *
 * Regra de negócio:
 * - Necessário → Alta prioridade
 * - Depois → Média prioridade
 * - Não (supérfluo) → Baixa prioridade
 *
 * @param necessity - Nível de necessidade do item
 * @returns Prioridade calculada
 */
export const calculatePriority = (necessity: Necessity): Priority => {
  if (necessity === 'Necessário') return 'Alta';
  if (necessity === 'Depois') return 'Média';
  return 'Baixa';
};

/**
 * Calcula o subtotal planejado (quantidade × preço unitário)
 *
 * @param qty - Quantidade planejada
 * @param price - Preço unitário planejado
 * @returns Subtotal planejado em reais
 */
export const calculateSubtotalPlanned = (qty: number, price: number): number => {
  return qty * price;
};

/**
 * Calcula o subtotal realmente pago considerando frete e desconto
 *
 * Fórmula: quantidade × (preço_unitário + frete - desconto)
 *
 * @param qty - Quantidade comprada
 * @param unitPrice - Preço unitário pago
 * @param frete - Valor do frete (rateado por unidade)
 * @param desconto - Desconto aplicado (por unidade)
 * @returns Subtotal pago em reais
 */
export const calculateSubtotalPaid = (
  qty: number,
  unitPrice: number,
  frete: number,
  desconto: number
): number => {
  return qty * (unitPrice + frete - desconto);
};

/**
 * Calcula a economia absoluta (planejado - pago)
 * Valor positivo indica economia, negativo indica gasto extra
 *
 * @param planned - Valor planejado
 * @param paid - Valor efetivamente pago
 * @returns Economia em reais (pode ser negativo)
 */
export const calculateSavings = (planned: number, paid: number): number => {
  return planned - paid;
};

/**
 * Calcula o percentual de economia em relação ao planejado
 *
 * @param planned - Valor planejado (denominador)
 * @param paid - Valor pago
 * @returns Percentual de economia (0-100, pode ser negativo)
 */
export const calculateSavingsPercent = (planned: number, paid: number): number => {
  return planned > 0 ? ((planned - paid) / planned) * 100 : 0;
};

/**
 * Interface com todos os totais calculados do enxoval
 */
interface EnxovalTotals {
  /** Soma de todos os subtotais planejados */
  totalPlanned: number;
  /** Soma de todos os subtotais pagos */
  totalPaid: number;
  /** Economia total (planejado - pago) */
  totalSavings: number;
  /** Percentual de economia geral */
  savingsPercentage: number;
  /** Quantidade de itens já comprados */
  itemsBought: number;
  /** Quantidade de itens pendentes */
  itemsToBuy: number;
  /** Total de itens na lista */
  totalItems: number;
  /** Percentual de progresso (0-100) */
  progress: number;
  /** Orçamento restante (se definido) */
  orcamentoRestante: number;
  /** Ticket médio por item comprado */
  ticketMedio: number;
  /** Quantidade de itens supérfluos na lista */
  superfluosEvitados: number;
  /** Valor potencial economizado ao evitar supérfluos */
  economiaPotencialSuperfluos: number;
}

/**
 * Calcula todos os totais e estatísticas do enxoval
 *
 * Agrupa múltiplos cálculos em uma única função para performance
 * e consistência dos dados exibidos no dashboard.
 *
 * @param items - Lista de itens do enxoval
 * @param budget - Orçamento total definido (opcional)
 * @returns Objeto com todos os totais calculados
 *
 * @example
 * ```tsx
 * const totals = calculateTotals(items, config?.orcamento_total);
 *
 * console.log(`Economia: ${formatCurrency(totals.totalSavings)}`);
 * console.log(`Progresso: ${totals.progress.toFixed(1)}%`);
 * ```
 */
export const calculateTotals = (items: EnxovalItem[], budget?: number): EnxovalTotals => {
  const totalPlanned = items.reduce((sum, item) => sum + item.subtotalPlanned, 0);
  const totalPaid = items.reduce((sum, item) => sum + item.subtotalPaid, 0);
  const totalSavings = totalPlanned - totalPaid;
  const savingsPercentage = totalPlanned > 0 ? (totalSavings / totalPlanned) * 100 : 0;

  const itemsBought = items.filter(item => item.status === 'Comprado').length;
  const itemsToBuy = items.filter(item => item.status === 'A comprar').length;
  const totalItems = items.length;
  const progress = totalItems > 0 ? (itemsBought / totalItems) * 100 : 0;

  const orcamentoRestante = budget ? budget - totalPaid : 0;
  const ticketMedio = itemsBought > 0 ? totalPaid / itemsBought : 0;

  // Análise de itens supérfluos (classificados como não essenciais)
  const superfluosEvitados = items.filter(item => item.classificacao === 'Supérfluo').length;
  const economiaPotencialSuperfluos = items
    .filter(item => item.classificacao === 'Supérfluo')
    .reduce((sum, item) => sum + item.precoReferencia * item.plannedQty, 0);

  return {
    totalPlanned,
    totalPaid,
    totalSavings,
    savingsPercentage,
    itemsBought,
    itemsToBuy,
    totalItems,
    progress,
    orcamentoRestante,
    ticketMedio,
    superfluosEvitados,
    economiaPotencialSuperfluos,
  };
};

/**
 * Formata um valor numérico como moeda brasileira (BRL)
 *
 * @param value - Valor em reais
 * @returns String formatada (ex: "R$ 1.234,56")
 *
 * @example
 * ```tsx
 * formatCurrency(1234.56) // => "R$ 1.234,56"
 * formatCurrency(0) // => "R$ 0,00"
 * formatCurrency(-50) // => "-R$ 50,00"
 * ```
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
