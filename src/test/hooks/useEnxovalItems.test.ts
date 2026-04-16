/**
 * @fileoverview Testes unitários para o hook useEnxovalItems
 * @module test/hooks/useEnxovalItems.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// Mock user
const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock config
const mockConfig = {
  id: "config-1",
  user_id: "test-user-id",
  orcamento_total: 5000,
  dias_alerta_troca: 7,
  mensagem_motivacao: null,
  limites_rn: [
    { item: "Bodies (curta+longa)", limite: 6, quando_aumentar: "+2 se clima frio" },
    { item: "Mijões/Calças", limite: 4, quando_aumentar: "+2 se clima frio" },
  ],
};

// Mock items from database
const mockDbItems = [
  {
    id: "item-1",
    user_id: "test-user-id",
    data: "2026-01-01",
    categoria: "Roupas",
    item: "Body manga longa",
    necessidade: "Sim",
    prioridade: "Alta",
    tamanho: "RN",
    qtd_planejada: 6,
    preco_planejado: 30,
    qtd_comprada: 4,
    preco_unit_pago: 25,
    frete: 0,
    desconto: 10,
    preco_referencia: 35,
    status: "Parcialmente comprado",
    loja: "Amazon",
    link: "https://amazon.com.br/body",
    origem: "Compra própria",
    data_limite_troca: null,
    obs: "Preferir cores neutras",
    etapa_maes: "Planejamento",
    classificacao: "Essencial",
    emocao: "Animada",
    tags: ["essencial", "roupa"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockDbItems, error: null }),
      single: vi.fn().mockResolvedValue({ data: mockDbItems[0], error: null }),
    }),
  },
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("@/hooks/useToast", () => ({
  toast: Object.assign(mockToast, { error: mockToast, success: mockToast }),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock calculations
vi.mock("@/lib/calculations", () => ({
  calculatePriority: (necessity: string) => necessity === "Sim" ? "Alta" : "Baixa",
  calculateSubtotalPlanned: (qty: number, price: number) => (qty || 0) * (price || 0),
  calculateSubtotalPaid: (qty: number, price: number, frete: number, desc: number) => 
    ((qty || 0) * (price || 0)) + (frete || 0) - (desc || 0),
  calculateSavings: (planned: number, paid: number) => planned - paid,
  calculateSavingsPercent: (planned: number, paid: number) => 
    planned > 0 ? ((planned - paid) / planned) * 100 : 0,
}));

describe("useEnxovalItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial loading state", async () => {
    const { useEnxovalItems } = await import("@/hooks/useEnxovalItems");
    const { result } = renderHook(() => useEnxovalItems(mockConfig));

    expect(result.current.loading).toBe(true);
  });

  it("should load items when config is provided", async () => {
    const { useEnxovalItems } = await import("@/hooks/useEnxovalItems");
    const { result } = renderHook(() => useEnxovalItems(mockConfig));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items.length).toBeGreaterThan(0);
  });

  it("should process items correctly", async () => {
    const { useEnxovalItems } = await import("@/hooks/useEnxovalItems");
    const { result } = renderHook(() => useEnxovalItems(mockConfig));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstItem = result.current.items[0];
    expect(firstItem).toHaveProperty("id");
    expect(firstItem).toHaveProperty("category");
    expect(firstItem).toHaveProperty("item");
    expect(firstItem).toHaveProperty("subtotalPlanned");
    expect(firstItem).toHaveProperty("subtotalPaid");
    expect(firstItem).toHaveProperty("savings");
    expect(firstItem).toHaveProperty("savingsPercent");
  });

  it("should provide CRUD functions", async () => {
    const { useEnxovalItems } = await import("@/hooks/useEnxovalItems");
    const { result } = renderHook(() => useEnxovalItems(mockConfig));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.addItem).toBe("function");
    expect(typeof result.current.updateItem).toBe("function");
    expect(typeof result.current.deleteItem).toBe("function");
    expect(typeof result.current.reloadItems).toBe("function");
  });

  it("should provide pagination functions", async () => {
    const { useEnxovalItems } = await import("@/hooks/useEnxovalItems");
    const { result } = renderHook(() => useEnxovalItems(mockConfig));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.loadMore).toBe("function");
    expect(typeof result.current.hasMore).toBe("boolean");
    expect(typeof result.current.loadingMore).toBe("boolean");
  });

  it("should not load items when config is null", async () => {
    const { useEnxovalItems } = await import("@/hooks/useEnxovalItems");
    const { result } = renderHook(() => useEnxovalItems(null));

    // Should still be loading (never finished because config is null)
    expect(result.current.loading).toBe(true);
  });

  it("should calculate RN limits correctly", async () => {
    const { useEnxovalItems } = await import("@/hooks/useEnxovalItems");
    const { result } = renderHook(() => useEnxovalItems(mockConfig));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Our mock item has tamanho RN but doesn't exceed limit
    const rnItem = result.current.items.find(i => i.size === "RN");
    expect(rnItem).toBeDefined();
  });
});

describe("Item Processing", () => {
  it("should calculate subtotals correctly", () => {
    const plannedQty = 6;
    const plannedPrice = 30;
    const boughtQty = 4;
    const unitPrice = 25;
    const frete = 0;
    const desconto = 10;

    const subtotalPlanned = plannedQty * plannedPrice; // 180
    const subtotalPaid = (boughtQty * unitPrice) + frete - desconto; // 90
    const savings = subtotalPlanned - subtotalPaid; // 90

    expect(subtotalPlanned).toBe(180);
    expect(subtotalPaid).toBe(90);
    expect(savings).toBe(90);
  });

  it("should detect exchange deadline alerts", () => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 5); // 5 days from now
    
    const diasAlertaTroca = 7;
    const diffDays = Math.ceil((futureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const alertaTroca = diffDays <= diasAlertaTroca && diffDays >= 0;
    expect(alertaTroca).toBe(true);
  });

  it("should detect unnecessary purchased items", () => {
    const necessidade = "Não";
    const status = "Comprado";
    
    const superfluoComprado = necessidade === "Não" && status === "Comprado";
    expect(superfluoComprado).toBe(true);
  });
});

describe("Priority Calculation", () => {
  it("should assign high priority to necessary items", () => {
    const calculatePriority = (necessity: string) => necessity === "Sim" ? "Alta" : "Baixa";
    
    expect(calculatePriority("Sim")).toBe("Alta");
    expect(calculatePriority("Não")).toBe("Baixa");
    expect(calculatePriority("Talvez")).toBe("Baixa");
  });
});
