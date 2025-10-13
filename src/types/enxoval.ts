export type Category = 
  | "Roupas" 
  | "Higiene" 
  | "Quarto" 
  | "Alimentação" 
  | "Mãe" 
  | "Extras";

export type Necessity = "Necessário" | "Depois" | "Não";

export type Priority = "Alta" | "Média" | "Baixa";

export type Status = "A comprar" | "Comprado";

export type Size = "RN" | "P" | "M" | "G" | "Opcional";

export type Origin = "Novo" | "Usado" | "Brechó";

export type EtapaMaes = "Mapear" | "Avaliar" | "Enxugar" | "Sustentar";

export type Classificacao = "Essencial" | "Pode Esperar" | "Supérfluo";

export type Emocao = "😌 útil" | "💸 impulso" | "🧡 amor";

export interface EnxovalItem {
  id: string;
  date?: string;
  category: Category;
  item: string;
  necessity: Necessity;
  priority: Priority;
  size?: Size;
  plannedQty: number;
  plannedPrice: number;
  boughtQty: number;
  unitPricePaid: number;
  frete: number;
  desconto: number;
  precoReferencia: number;
  subtotalPlanned: number;
  subtotalPaid: number;
  savings: number;
  savingsPercent: number;
  store?: string;
  link?: string;
  status: Status;
  origin?: Origin;
  dataLimiteTroca?: string;
  notes?: string;
  excessoRN?: boolean;
  superfluoComprado?: boolean;
  alertaTroca?: boolean;
  etapaMaes?: EtapaMaes;
  classificacao?: Classificacao;
  emocao?: Emocao;
}

export interface Budget {
  total: number;
  byCategory: Record<Category, number>;
}

export interface RNLimit {
  id?: string;
  item: string;
  limite: number;
  quando_aumentar?: string;
  observacoes?: string;
}

export interface Config {
  id?: string;
  orcamento_total: number;
  dias_alerta_troca: number;
  limites_rn: RNLimit[];
  mensagem_motivacao?: string;
}
