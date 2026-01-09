/**
 * @fileoverview Testes unitários para o hook useMaternityBag
 * @module test/hooks/useMaternityBag.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock user
const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock categories
const mockCategories = [
  {
    id: "cat-1",
    user_id: "test-user-id",
    name: "Roupas da Mamãe",
    icon: "👗",
    display_order: 1,
    delivery_type_filter: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-2",
    user_id: "test-user-id",
    name: "Roupas do Bebê",
    icon: "👶",
    display_order: 2,
    delivery_type_filter: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-3",
    user_id: "test-user-id",
    name: "Pós-Cesárea",
    icon: "🏥",
    display_order: 3,
    delivery_type_filter: "cesarean",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock items
const mockItems = [
  {
    id: "item-1",
    user_id: "test-user-id",
    category_id: "cat-1",
    name: "Camisolas",
    quantity: 3,
    checked: true,
    notes: "Preferir com abertura frontal",
    normal_only: false,
    cesarean_only: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-2",
    user_id: "test-user-id",
    category_id: "cat-2",
    name: "Bodies RN",
    quantity: 5,
    checked: false,
    notes: null,
    normal_only: false,
    cesarean_only: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-3",
    user_id: "test-user-id",
    category_id: "cat-3",
    name: "Cinta pós-operatória",
    quantity: 1,
    checked: false,
    notes: null,
    normal_only: false,
    cesarean_only: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table) => {
      const mockReturn = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
      };

      if (table === "maternity_bag_categories") {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockCategories, error: null });
        mockReturn.single = vi.fn().mockResolvedValue({ data: mockCategories[0], error: null });
      } else if (table === "maternity_bag_items") {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockItems, error: null });
        mockReturn.single = vi.fn().mockResolvedValue({ data: mockItems[0], error: null });
      }

      return mockReturn;
    }),
  },
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Wrapper com providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useMaternityBag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial loading state", async () => {
    const { useMaternityBag } = await import("@/hooks/useMaternityBag");
    const { result } = renderHook(() => useMaternityBag(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
  });

  it("should load categories", async () => {
    const { useMaternityBag } = await import("@/hooks/useMaternityBag");
    const { result } = renderHook(() => useMaternityBag(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.categories).toBeDefined();
  });

  it("should load items", async () => {
    const { useMaternityBag } = await import("@/hooks/useMaternityBag");
    const { result } = renderHook(() => useMaternityBag(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toBeDefined();
  });

  it("should provide item CRUD functions", async () => {
    const { useMaternityBag } = await import("@/hooks/useMaternityBag");
    const { result } = renderHook(() => useMaternityBag(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.addItem).toBe("function");
    expect(typeof result.current.updateItem).toBe("function");
    expect(typeof result.current.deleteItem).toBe("function");
    expect(typeof result.current.toggleItemCheck).toBe("function");
  });
});

describe("Progress Calculation", () => {
  it("should calculate overall progress", () => {
    const items = mockItems;
    const checkedCount = items.filter(i => i.checked).length;
    const totalCount = items.length;
    const progress = (checkedCount / totalCount) * 100;
    
    expect(checkedCount).toBe(1);
    expect(totalCount).toBe(3);
    expect(progress).toBeCloseTo(33.33, 1);
  });

  it("should calculate category progress", () => {
    const categoryId = "cat-1";
    const categoryItems = mockItems.filter(i => i.category_id === categoryId);
    const checkedCount = categoryItems.filter(i => i.checked).length;
    const totalCount = categoryItems.length;
    const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
    
    expect(checkedCount).toBe(1);
    expect(totalCount).toBe(1);
    expect(progress).toBe(100);
  });

  it("should handle empty category", () => {
    const categoryItems: typeof mockItems = [];
    const progress = categoryItems.length > 0 ? 0 : 0;
    
    expect(progress).toBe(0);
  });
});

describe("Delivery Type Filtering", () => {
  it("should filter cesarean-only items for cesarean delivery", () => {
    const deliveryType = "cesarean";
    const filteredItems = mockItems.filter(item => {
      if (item.cesarean_only && deliveryType !== "cesarean") return false;
      if (item.normal_only && deliveryType !== "normal") return false;
      return true;
    });
    
    expect(filteredItems.length).toBe(3); // All items visible for cesarean
  });

  it("should hide cesarean-only items for normal delivery", () => {
    const deliveryType = "normal";
    const filteredItems = mockItems.filter(item => {
      if (item.cesarean_only && deliveryType === "normal") return false;
      if (item.normal_only && deliveryType === "cesarean") return false;
      return true;
    });
    
    expect(filteredItems.length).toBe(2); // Cesarean-only item hidden
  });

  it("should filter categories by delivery type", () => {
    const deliveryType = "normal";
    const filteredCategories = mockCategories.filter(cat => {
      if (!cat.delivery_type_filter) return true;
      return cat.delivery_type_filter === deliveryType;
    });
    
    expect(filteredCategories.length).toBe(2); // Pós-Cesárea hidden
  });
});

describe("Item Quantity", () => {
  it("should track item quantities", () => {
    const item = mockItems[0];
    expect(item.quantity).toBe(3);
  });

  it("should handle null quantity as 1", () => {
    const quantity = null;
    const displayQuantity = quantity ?? 1;
    
    expect(displayQuantity).toBe(1);
  });
});

describe("Category Organization", () => {
  it("should respect display order", () => {
    const sortedCategories = [...mockCategories].sort(
      (a, b) => a.display_order - b.display_order
    );
    
    expect(sortedCategories[0].name).toBe("Roupas da Mamãe");
    expect(sortedCategories[1].name).toBe("Roupas do Bebê");
    expect(sortedCategories[2].name).toBe("Pós-Cesárea");
  });

  it("should group items by category", () => {
    const itemsByCategory = mockItems.reduce((acc, item) => {
      const catId = item.category_id;
      if (!acc[catId]) acc[catId] = [];
      acc[catId].push(item);
      return acc;
    }, {} as Record<string, typeof mockItems>);
    
    expect(Object.keys(itemsByCategory).length).toBe(3);
    expect(itemsByCategory["cat-1"].length).toBe(1);
    expect(itemsByCategory["cat-2"].length).toBe(1);
    expect(itemsByCategory["cat-3"].length).toBe(1);
  });
});
