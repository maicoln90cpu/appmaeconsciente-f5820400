import { EnxovalItem, Priority, Necessity } from "@/types/enxoval";

export const calculatePriority = (necessity: Necessity): Priority => {
  if (necessity === "Necessário") return "Alta";
  if (necessity === "Depois") return "Média";
  return "Baixa";
};

export const calculateSubtotalPlanned = (qty: number, price: number): number => {
  return qty * price;
};

export const calculateSubtotalPaid = (qty: number, unitPrice: number, frete: number, desconto: number): number => {
  return qty * (unitPrice + frete - desconto);
};

export const calculateSavings = (planned: number, paid: number): number => {
  return planned - paid;
};

export const calculateSavingsPercent = (planned: number, paid: number): number => {
  return planned > 0 ? ((planned - paid) / planned) * 100 : 0;
};

export const calculateTotals = (items: EnxovalItem[], budget?: number) => {
  const totalPlanned = items.reduce((sum, item) => sum + item.subtotalPlanned, 0);
  const totalPaid = items.reduce((sum, item) => sum + item.subtotalPaid, 0);
  const totalSavings = totalPlanned - totalPaid;
  const savingsPercentage = totalPlanned > 0 ? (totalSavings / totalPlanned) * 100 : 0;
  
  const itemsBought = items.filter(item => item.status === "Comprado").length;
  const itemsToBuy = items.filter(item => item.status === "A comprar").length;
  const totalItems = items.length;
  const progress = totalItems > 0 ? (itemsBought / totalItems) * 100 : 0;
  
  const orcamentoRestante = budget ? budget - totalPaid : 0;
  const ticketMedio = itemsBought > 0 ? totalPaid / itemsBought : 0;
  
  // Calcular itens supérfluos evitados
  const superfluosEvitados = items.filter(item => item.classificacao === "Supérfluo").length;
  const economiaPotencialSuperfluos = items
    .filter(item => item.classificacao === "Supérfluo")
    .reduce((sum, item) => sum + (item.precoReferencia * item.plannedQty), 0);
  
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
    economiaPotencialSuperfluos
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
