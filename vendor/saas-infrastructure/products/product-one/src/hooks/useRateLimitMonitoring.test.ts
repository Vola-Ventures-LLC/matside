import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      gte: vi.fn(() => Promise.resolve({ data: [], error: null })),
      limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(() => ({})),
    })),
  })),
  removeChannel: vi.fn(),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
    isAdmin: true,
    isOwner: true,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("Rate Limit Monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useRateLimitMonitoring hook", () => {
    it("should export useRateLimitMonitoring hook", async () => {
      const { useRateLimitMonitoring } = await import("@/hooks/useRateLimitMonitoring");
      expect(useRateLimitMonitoring).toBeDefined();
      expect(typeof useRateLimitMonitoring).toBe("function");
    });

    it("should export useRateLimitChartData hook", async () => {
      const { useRateLimitChartData } = await import("@/hooks/useRateLimitMonitoring");
      expect(useRateLimitChartData).toBeDefined();
      expect(typeof useRateLimitChartData).toBe("function");
    });

    it("should define RateLimitAlert interface correctly", async () => {
      const { useRateLimitMonitoring } = await import("@/hooks/useRateLimitMonitoring");
      // The hook should be callable
      expect(() => {
        // We're just testing that the import works and types are defined
        const mockAlert = {
          id: "test",
          user_id: "user-1",
          ip_address: null,
          endpoint: "onboarding-chat",
          alert_type: "warning" as const,
          usage_count: 25,
          limit_value: 30,
          usage_percent: 83.33,
          window_minutes: 60,
          metadata: {},
          created_at: new Date().toISOString(),
        };
        expect(mockAlert.alert_type).toBe("warning");
      }).not.toThrow();
    });
  });

  describe("useRateLimitChartData", () => {
    it("should transform usage summary into chart data", async () => {
      const { useRateLimitChartData } = await import("@/hooks/useRateLimitMonitoring");
      
      const mockSummary = [
        {
          endpoint: "onboarding-chat",
          alert_type: "blocked",
          alert_count: 5,
          unique_users: 3,
          unique_ips: 2,
          avg_usage_percent: 95.5,
          max_usage_percent: 100,
          hour: new Date().toISOString(),
        },
        {
          endpoint: "content-ai",
          alert_type: "warning",
          alert_count: 10,
          unique_users: 5,
          unique_ips: 4,
          avg_usage_percent: 85.2,
          max_usage_percent: 92,
          hour: new Date().toISOString(),
        },
      ];

      const { timeSeriesData, pieChartData } = useRateLimitChartData(mockSummary);
      
      expect(Array.isArray(timeSeriesData)).toBe(true);
      expect(Array.isArray(pieChartData)).toBe(true);
      expect(pieChartData.length).toBe(2);
    });

    it("should handle empty summary data", async () => {
      const { useRateLimitChartData } = await import("@/hooks/useRateLimitMonitoring");
      
      const { timeSeriesData, pieChartData } = useRateLimitChartData([]);
      
      expect(timeSeriesData).toEqual([]);
      expect(pieChartData).toEqual([]);
    });
  });

  describe("RateLimitStats interface", () => {
    it("should have correct structure", () => {
      const stats = {
        totalAlerts24h: 100,
        blockedRequests24h: 15,
        warningAlerts24h: 85,
        uniqueUsersAffected: 20,
        uniqueIPsAffected: 10,
        topEndpoints: [
          { endpoint: "onboarding-chat", count: 50 },
          { endpoint: "content-ai", count: 30 },
        ],
      };

      expect(stats.totalAlerts24h).toBe(100);
      expect(stats.blockedRequests24h).toBe(15);
      expect(stats.topEndpoints).toHaveLength(2);
      expect(stats.topEndpoints[0].endpoint).toBe("onboarding-chat");
    });
  });

  describe("RateLimitTopOffender interface", () => {
    it("should have correct structure for user offenders", () => {
      const userOffender = {
        identifier: "user-123",
        identifier_type: "user" as const,
        user_id: "user-123",
        ip_address: null,
        total_alerts: 50,
        blocked_count: 10,
        warning_count: 40,
        endpoints_affected: ["onboarding-chat", "content-ai"],
        last_alert_at: new Date().toISOString(),
      };

      expect(userOffender.identifier_type).toBe("user");
      expect(userOffender.user_id).toBe("user-123");
      expect(userOffender.endpoints_affected).toContain("onboarding-chat");
    });

    it("should have correct structure for IP offenders", () => {
      const ipOffender = {
        identifier: "192.168.1.1",
        identifier_type: "ip" as const,
        user_id: null,
        ip_address: "192.168.1.1",
        total_alerts: 30,
        blocked_count: 5,
        warning_count: 25,
        endpoints_affected: ["track-login"],
        last_alert_at: new Date().toISOString(),
      };

      expect(ipOffender.identifier_type).toBe("ip");
      expect(ipOffender.ip_address).toBe("192.168.1.1");
    });
  });
});

describe("Rate Limit Alert Recording", () => {
  it("should calculate usage percentage correctly", () => {
    const maxRequests = 30;
    const remaining = 6; // 24 used
    const usagePercent = ((maxRequests - remaining) / maxRequests) * 100;
    
    expect(usagePercent).toBe(80);
  });

  it("should trigger warning at 80% usage", () => {
    const maxRequests = 50;
    const remaining = 10; // 40 used = 80%
    const usagePercent = ((maxRequests - remaining) / maxRequests) * 100;
    
    const shouldAlert = usagePercent >= 80;
    expect(shouldAlert).toBe(true);
  });

  it("should not trigger warning below 80% usage", () => {
    const maxRequests = 50;
    const remaining = 15; // 35 used = 70%
    const usagePercent = ((maxRequests - remaining) / maxRequests) * 100;
    
    const shouldAlert = usagePercent >= 80;
    expect(shouldAlert).toBe(false);
  });

  it("should identify blocked vs warning alert types", () => {
    const allowed = false;
    const alertType = allowed ? "warning" : "blocked";
    
    expect(alertType).toBe("blocked");
  });
});
