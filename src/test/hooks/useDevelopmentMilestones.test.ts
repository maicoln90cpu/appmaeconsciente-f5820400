/**
 * @fileoverview Testes unitários para o hook useDevelopmentMilestones
 * @module test/hooks/useDevelopmentMilestones.test
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

// Mock milestone types
const mockMilestoneTypes = [
  {
    id: "type-1",
    milestone_code: "MOTOR_HEAD_CONTROL",
    title: "Controle da cabeça",
    description: "Bebê consegue sustentar a cabeça por alguns segundos",
    area: "motor",
    age_min_months: 0,
    age_max_months: 3,
    stimulation_tips: ["Deixe o bebê de bruços", "Segure brinquedos na altura dos olhos"],
    pediatrician_alert: "Se não atingir até 4 meses, consultar pediatra",
    is_active: true,
  },
  {
    id: "type-2",
    milestone_code: "SOCIAL_SMILE",
    title: "Sorriso social",
    description: "Bebê sorri em resposta a estímulos",
    area: "social",
    age_min_months: 1,
    age_max_months: 3,
    stimulation_tips: ["Sorria para o bebê", "Converse com ele"],
    pediatrician_alert: null,
    is_active: true,
  },
  {
    id: "type-3",
    milestone_code: "MOTOR_SIT_ALONE",
    title: "Sentar sem apoio",
    description: "Bebê consegue sentar sozinho por vários segundos",
    area: "motor",
    age_min_months: 4,
    age_max_months: 7,
    stimulation_tips: ["Use almofadas ao redor", "Deixe brinquedos à frente"],
    pediatrician_alert: "Se não atingir até 9 meses, consultar pediatra",
    is_active: true,
  },
];

// Mock milestone records
const mockMilestoneRecords = [
  {
    id: "record-1",
    user_id: "test-user-id",
    baby_profile_id: "baby-1",
    milestone_type_id: "type-1",
    status: "achieved",
    achieved_date: "2026-01-01",
    mother_notes: "Conseguiu sustentar a cabeça por 5 segundos!",
    photo_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    milestone_type: mockMilestoneTypes[0],
  },
  {
    id: "record-2",
    user_id: "test-user-id",
    baby_profile_id: "baby-1",
    milestone_type_id: "type-2",
    status: "achieved",
    achieved_date: "2025-12-15",
    mother_notes: "Primeiro sorriso!",
    photo_url: "https://example.com/smile.jpg",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    milestone_type: mockMilestoneTypes[1],
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
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
      };

      if (table === "development_milestone_types") {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockMilestoneTypes, error: null });
      } else if (table === "baby_milestone_records") {
        mockReturn.order = vi.fn().mockResolvedValue({ data: mockMilestoneRecords, error: null });
        mockReturn.single = vi.fn().mockResolvedValue({ data: mockMilestoneRecords[0], error: null });
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

describe("useDevelopmentMilestones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial loading state", async () => {
    const { useDevelopmentMilestones } = await import("@/hooks/useDevelopmentMilestones");
    const { result } = renderHook(() => useDevelopmentMilestones("baby-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
  });

  it("should load milestone types", async () => {
    const { useDevelopmentMilestones } = await import("@/hooks/useDevelopmentMilestones");
    const { result } = renderHook(() => useDevelopmentMilestones("baby-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.milestoneTypes).toBeDefined();
  });

  it("should load milestone records", async () => {
    const { useDevelopmentMilestones } = await import("@/hooks/useDevelopmentMilestones");
    const { result } = renderHook(() => useDevelopmentMilestones("baby-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.records).toBeDefined();
  });

  it("should provide record functions", async () => {
    const { useDevelopmentMilestones } = await import("@/hooks/useDevelopmentMilestones");
    const { result } = renderHook(() => useDevelopmentMilestones("baby-1"), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.markAsAchieved).toBe("function");
    expect(typeof result.current.updateRecord).toBe("function");
  });
});

describe("Milestone Status", () => {
  it("should identify achieved milestones", () => {
    const record = mockMilestoneRecords[0];
    expect(record.status).toBe("achieved");
    expect(record.achieved_date).toBeDefined();
  });

  it("should check if milestone is achieved", () => {
    const milestoneTypeId = "type-1";
    const isAchieved = mockMilestoneRecords.some(
      r => r.milestone_type_id === milestoneTypeId && r.status === "achieved"
    );
    expect(isAchieved).toBe(true);
  });

  it("should check if milestone is pending", () => {
    const milestoneTypeId = "type-3";
    const isAchieved = mockMilestoneRecords.some(
      r => r.milestone_type_id === milestoneTypeId && r.status === "achieved"
    );
    expect(isAchieved).toBe(false);
  });
});

describe("Milestone Age Range", () => {
  it("should filter milestones by age", () => {
    const babyAgeMonths = 2;
    const ageMilestones = mockMilestoneTypes.filter(
      m => babyAgeMonths >= m.age_min_months && babyAgeMonths <= m.age_max_months
    );
    
    expect(ageMilestones.length).toBe(2); // Head control and social smile
    expect(ageMilestones.map(m => m.milestone_code)).toContain("MOTOR_HEAD_CONTROL");
    expect(ageMilestones.map(m => m.milestone_code)).toContain("SOCIAL_SMILE");
  });

  it("should identify overdue milestones", () => {
    const babyAgeMonths = 5;
    const overdueMilestones = mockMilestoneTypes.filter(m => {
      const isInRange = babyAgeMonths >= m.age_min_months && babyAgeMonths <= m.age_max_months;
      const isPastRange = babyAgeMonths > m.age_max_months;
      return isPastRange;
    });
    
    // Head control and social smile should be past their range
    expect(overdueMilestones.length).toBe(2);
  });

  it("should identify upcoming milestones", () => {
    const babyAgeMonths = 2;
    const upcomingMilestones = mockMilestoneTypes.filter(
      m => m.age_min_months > babyAgeMonths
    );
    
    expect(upcomingMilestones.length).toBe(1);
    expect(upcomingMilestones[0].milestone_code).toBe("MOTOR_SIT_ALONE");
  });
});

describe("Milestone Areas", () => {
  it("should categorize milestones by area", () => {
    const areas = ["motor", "social", "cognitive", "language"];
    const motorMilestones = mockMilestoneTypes.filter(m => m.area === "motor");
    const socialMilestones = mockMilestoneTypes.filter(m => m.area === "social");
    
    expect(motorMilestones.length).toBe(2);
    expect(socialMilestones.length).toBe(1);
  });

  it("should group milestones by area", () => {
    const byArea = mockMilestoneTypes.reduce((acc, m) => {
      if (!acc[m.area]) acc[m.area] = [];
      acc[m.area].push(m);
      return acc;
    }, {} as Record<string, typeof mockMilestoneTypes>);
    
    expect(Object.keys(byArea)).toContain("motor");
    expect(Object.keys(byArea)).toContain("social");
  });
});

describe("Pediatrician Alerts", () => {
  it("should identify milestones with alerts", () => {
    const milestonesWithAlerts = mockMilestoneTypes.filter(
      m => m.pediatrician_alert !== null
    );
    
    expect(milestonesWithAlerts.length).toBe(2);
  });

  it("should check if overdue milestone needs attention", () => {
    const babyAgeMonths = 5;
    const milestone = mockMilestoneTypes[0]; // Head control (0-3 months)
    const isAchieved = mockMilestoneRecords.some(
      r => r.milestone_type_id === milestone.id && r.status === "achieved"
    );
    const needsAttention = !isAchieved && babyAgeMonths > milestone.age_max_months;
    
    expect(needsAttention).toBe(false); // It's achieved
  });
});

describe("Progress Statistics", () => {
  it("should calculate achieved percentage", () => {
    const totalTypes = mockMilestoneTypes.length;
    const achievedRecords = mockMilestoneRecords.filter(r => r.status === "achieved");
    const percentage = (achievedRecords.length / totalTypes) * 100;
    
    expect(percentage).toBeCloseTo(66.67, 1); // 2 of 3
  });

  it("should count achievements by area", () => {
    const achievedByArea = mockMilestoneRecords.reduce((acc, r) => {
      if (r.status === "achieved" && r.milestone_type) {
        const area = r.milestone_type.area;
        acc[area] = (acc[area] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    expect(achievedByArea["motor"]).toBe(1);
    expect(achievedByArea["social"]).toBe(1);
  });
});
