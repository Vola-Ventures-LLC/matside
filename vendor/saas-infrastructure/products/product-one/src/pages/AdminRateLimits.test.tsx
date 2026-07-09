import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock dependencies
vi.mock("@/hooks/useRateLimitMonitoring", () => ({
  useRateLimitMonitoring: () => ({
    alerts: [],
    stats: {
      totalAlerts24h: 42,
      blockedRequests24h: 7,
      warningAlerts24h: 35,
      uniqueUsersAffected: 12,
      uniqueIPsAffected: 8,
      topEndpoints: [{ endpoint: "onboarding-chat", count: 20 }],
    },
    topOffenders: [],
    usageSummary: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRateLimitChartData: () => ({
    timeSeriesData: [],
    pieChartData: [],
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user" },
    isAdmin: true,
    isOwner: true,
    isLoading: false,
  }),
}));

describe("AdminRateLimits Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it("should export AdminRateLimits as default", async () => {
    const module = await import("@/pages/AdminRateLimits");
    expect(module.default).toBeDefined();
  });

  it("should have correct page structure", async () => {
    const AdminRateLimits = (await import("@/pages/AdminRateLimits")).default;
    
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminRateLimits />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Check for main heading
    expect(getByText("Rate Limit Monitoring")).toBeInTheDocument();
    
    // Check for tabs
    expect(getByText("Live Alerts")).toBeInTheDocument();
    expect(getByText("Top Offenders")).toBeInTheDocument();
    expect(getByText("Analytics")).toBeInTheDocument();
  });

  it("should display stats cards with correct values", async () => {
    const AdminRateLimits = (await import("@/pages/AdminRateLimits")).default;
    
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminRateLimits />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Stats from mock should be displayed
    expect(getByText("42")).toBeInTheDocument(); // totalAlerts24h
    expect(getByText("7")).toBeInTheDocument(); // blockedRequests24h
    expect(getByText("35")).toBeInTheDocument(); // warningAlerts24h
  });

  it("should have refresh button", async () => {
    const AdminRateLimits = (await import("@/pages/AdminRateLimits")).default;
    
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminRateLimits />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(getByText("Refresh")).toBeInTheDocument();
  });
});

describe("Rate Limit Components", () => {
  it("should export RateLimitStatsCards", async () => {
    const module = await import("@/components/admin/rate-limits");
    expect(module.RateLimitStatsCards).toBeDefined();
  });

  it("should export RateLimitAlertsTable", async () => {
    const module = await import("@/components/admin/rate-limits");
    expect(module.RateLimitAlertsTable).toBeDefined();
  });

  it("should export RateLimitTopOffenders", async () => {
    const module = await import("@/components/admin/rate-limits");
    expect(module.RateLimitTopOffenders).toBeDefined();
  });

  it("should export RateLimitCharts", async () => {
    const module = await import("@/components/admin/rate-limits");
    expect(module.RateLimitCharts).toBeDefined();
  });
});
