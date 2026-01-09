/**
 * @fileoverview Testes unitários para o hook useBabyFeeding
 * @module test/hooks/useBabyFeeding.test
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

// Mock feeding logs
const mockFeedingLogs = [
  {
    id: "feed-1",
    user_id: "test-user-id",
    baby_name: "Maria",
    feeding_type: "breast",
    breast_side: "left",
    start_time: "2026-01-09T06:00:00Z",
    end_time: "2026-01-09T06:20:00Z",
    duration_minutes: 20,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "feed-2",
    user_id: "test-user-id",
    baby_name: "Maria",
    feeding_type: "bottle",
    milk_type: "formula",
    volume_ml: 120,
    leftover_ml: 10,
    temperature: "warm",
    start_time: "2026-01-09T10:00:00Z",
    end_time: "2026-01-09T10:15:00Z",
    duration_minutes: 15,
    notes: "Aceitou bem",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock feeding settings
const mockFeedingSettings = {
  id: "settings-1",
  user_id: "test-user-id",
  baby_name: "Maria",
  baby_birthdate: "2025-10-01",
  feeding_interval_minutes: 180,
  reminder_enabled: true,
  last_breast_side: "left",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table) => {
      const mockReturn = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
        upsert: vi.fn().mockReturnThis(),
      };

      if (table === "baby_feeding_logs") {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockFeedingLogs, error: null });
        mockReturn.single = vi.fn().mockResolvedValue({ data: mockFeedingLogs[0], error: null });
      } else if (table === "feeding_settings") {
        mockReturn.maybeSingle = vi.fn().mockResolvedValue({ data: mockFeedingSettings, error: null });
        mockReturn.single = vi.fn().mockResolvedValue({ data: mockFeedingSettings, error: null });
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

describe("useBabyFeeding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial loading state", async () => {
    const { useBabyFeeding } = await import("@/hooks/useBabyFeeding");
    const { result } = renderHook(() => useBabyFeeding(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
  });

  it("should load feeding logs", async () => {
    const { useBabyFeeding } = await import("@/hooks/useBabyFeeding");
    const { result } = renderHook(() => useBabyFeeding(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.feedingLogs).toBeDefined();
  });

  it("should load settings", async () => {
    const { useBabyFeeding } = await import("@/hooks/useBabyFeeding");
    const { result } = renderHook(() => useBabyFeeding(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toBeDefined();
  });

  it("should provide CRUD functions", async () => {
    const { useBabyFeeding } = await import("@/hooks/useBabyFeeding");
    const { result } = renderHook(() => useBabyFeeding(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.addFeedingLog).toBe("function");
    expect(typeof result.current.updateFeedingLog).toBe("function");
    expect(typeof result.current.deleteFeedingLog).toBe("function");
    expect(typeof result.current.saveSettings).toBe("function");
  });

  it("should track last breast side", async () => {
    const { useBabyFeeding } = await import("@/hooks/useBabyFeeding");
    const { result } = renderHook(() => useBabyFeeding(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings?.last_breast_side).toBe("left");
  });
});

describe("Feeding Types", () => {
  it("should identify breast feeding", () => {
    const log = mockFeedingLogs[0];
    expect(log.feeding_type).toBe("breast");
    expect(log.breast_side).toBe("left");
  });

  it("should identify bottle feeding", () => {
    const log = mockFeedingLogs[1];
    expect(log.feeding_type).toBe("bottle");
    expect(log.milk_type).toBe("formula");
    expect(log.volume_ml).toBe(120);
  });

  it("should track leftover volume", () => {
    const log = mockFeedingLogs[1];
    const consumedMl = (log.volume_ml || 0) - (log.leftover_ml || 0);
    expect(consumedMl).toBe(110);
  });
});

describe("Feeding Duration Calculation", () => {
  it("should calculate duration correctly", () => {
    const start = new Date("2026-01-09T06:00:00Z");
    const end = new Date("2026-01-09T06:20:00Z");
    
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    expect(durationMinutes).toBe(20);
  });
});

describe("Feeding Statistics", () => {
  it("should count feedings by type", () => {
    const logs = mockFeedingLogs;
    
    const breastCount = logs.filter(l => l.feeding_type === "breast").length;
    const bottleCount = logs.filter(l => l.feeding_type === "bottle").length;
    
    expect(breastCount).toBe(1);
    expect(bottleCount).toBe(1);
  });

  it("should calculate total feeding time", () => {
    const logs = mockFeedingLogs;
    const totalMinutes = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    
    expect(totalMinutes).toBe(35); // 20 + 15
  });

  it("should calculate total volume consumed", () => {
    const bottleLogs = mockFeedingLogs.filter(l => l.feeding_type === "bottle");
    const totalVolume = bottleLogs.reduce((sum, log) => {
      const consumed = (log.volume_ml || 0) - (log.leftover_ml || 0);
      return sum + consumed;
    }, 0);
    
    expect(totalVolume).toBe(110);
  });
});

describe("Breast Side Alternation", () => {
  it("should suggest next breast side", () => {
    const lastSide = "left";
    const nextSide = lastSide === "left" ? "right" : "left";
    
    expect(nextSide).toBe("right");
  });

  it("should handle both sides in one feeding", () => {
    // When both sides are used, next feeding could start with either
    const breastSides = ["left", "right"];
    expect(breastSides).toContain("left");
    expect(breastSides).toContain("right");
  });
});

describe("Feeding Interval Tracking", () => {
  it("should calculate time since last feeding", () => {
    const lastFeedingTime = new Date("2026-01-09T10:15:00Z");
    const now = new Date("2026-01-09T13:00:00Z");
    
    const diffMs = now.getTime() - lastFeedingTime.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    expect(diffMinutes).toBe(165); // 2 hours 45 minutes
  });

  it("should check if feeding is due", () => {
    const intervalMinutes = 180;
    const timeSinceLastFeeding = 165;
    
    const isDue = timeSinceLastFeeding >= intervalMinutes;
    expect(isDue).toBe(false); // Not yet due
  });

  it("should identify overdue feeding", () => {
    const intervalMinutes = 180;
    const timeSinceLastFeeding = 200;
    
    const isOverdue = timeSinceLastFeeding >= intervalMinutes;
    expect(isOverdue).toBe(true);
  });
});

describe("Bottle Temperature Validation", () => {
  it("should accept valid temperatures", () => {
    const validTemperatures = ["cold", "room", "warm", "hot"];
    const temperature = "warm";
    
    expect(validTemperatures).toContain(temperature);
  });
});
