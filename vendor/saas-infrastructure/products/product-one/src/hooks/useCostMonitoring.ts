import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

// Cost estimates per unit (in cents, based on typical pricing)
export const COST_RATES = {
  ai: {
    // Per 1M tokens, divided to get per-token cost in cents
    inputTokenCostPer1M: 15, // $0.15 per 1M input tokens
    outputTokenCostPer1M: 60, // $0.60 per 1M output tokens
  },
  email: {
    // Cost per email by domain category
    transactional: 0.1, // $0.001 per email
    marketing: 0.1,
    support: 0.1,
    billing: 0.1,
    notifications: 0.1,
    outbound: 0.1,
  },
  sms: {
    // Cost per SMS segment
    perSegment: 0.75, // $0.0075 per segment
  },
  storage: {
    // Cost per GB stored per month
    perGBMonth: 2.5, // $0.025 per GB/month
    // Cost per GB transferred
    perGBTransfer: 9, // $0.09 per GB bandwidth
  },
  stripe: {
    // Stripe fee structure
    percentFee: 2.9, // 2.9%
    fixedFeeCents: 30, // $0.30 per transaction
  },
};

export interface UsageRecord {
  id: string;
  user_id: string;
  organization_id: string | null;
  resource_type: "ai" | "email" | "sms" | "storage" | "stripe";
  category: string;
  tokens_input: number;
  tokens_output: number;
  units: number;
  model: string | null;
  estimated_cost_cents: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CostBreakdown {
  resource_type: string;
  category: string;
  total_tokens_input: number;
  total_tokens_output: number;
  total_units: number;
  total_cost_cents: number;
  request_count: number;
  first_usage: string;
  last_usage: string;
}

export interface AccountCostSummary {
  user_id: string;
  email?: string;
  display_name?: string;
  ai_support_cost: number;
  ai_onboarding_cost: number;
  ai_features_cost: number;
  ai_ticket_cost: number;
  email_by_subdomain: Record<string, number>;
  sms_cost: number;
  storage_cost: number;
  stripe_fees: number;
  total_cost: number;
  first_usage: string | null;
  last_usage: string | null;
}

export interface CostStats {
  total_ai_cost: number;
  total_email_cost: number;
  total_sms_cost: number;
  total_storage_cost: number;
  total_stripe_fees: number;
  total_cost: number;
  ai_by_category: Record<string, number>;
  email_by_subdomain: Record<string, number>;
  account_count: number;
}

export interface CostTrend {
  date: string;
  ai_cost: number;
  email_cost: number;
  sms_cost: number;
  storage_cost: number;
  stripe_fees: number;
  total_cost: number;
}

export function useCostMonitoring(dateRange?: { start: Date; end: Date }) {
  const [realTimeUpdates, setRealTimeUpdates] = useState(0);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("usage-records-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "usage_records",
        },
        () => {
          setRealTimeUpdates((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch overall stats
  const statsQuery = useQuery({
    queryKey: ["cost-stats", dateRange?.start, dateRange?.end, realTimeUpdates],
    queryFn: async (): Promise<CostStats> => {
      let query = supabase.from("usage_records").select("*");

      if (dateRange?.start) {
        query = query.gte("created_at", dateRange.start.toISOString());
      }
      if (dateRange?.end) {
        query = query.lte("created_at", dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const records = data as UsageRecord[];

      // Calculate stats
      let total_ai_cost = 0;
      let total_email_cost = 0;
      let total_sms_cost = 0;
      let total_storage_cost = 0;
      let total_stripe_fees = 0;
      const ai_by_category: Record<string, number> = {};
      const email_by_subdomain: Record<string, number> = {};
      const users = new Set<string>();

      records.forEach((record) => {
        users.add(record.user_id);
        const cost = Number(record.estimated_cost_cents) || 0;

        if (record.resource_type === "ai") {
          total_ai_cost += cost;
          ai_by_category[record.category] =
            (ai_by_category[record.category] || 0) + cost;
        } else if (record.resource_type === "email") {
          total_email_cost += cost;
          email_by_subdomain[record.category] =
            (email_by_subdomain[record.category] || 0) + cost;
        } else if (record.resource_type === "sms") {
          total_sms_cost += cost;
        } else if (record.resource_type === "storage") {
          total_storage_cost += cost;
        } else if (record.resource_type === "stripe") {
          total_stripe_fees += cost;
        }
      });

      return {
        total_ai_cost,
        total_email_cost,
        total_sms_cost,
        total_storage_cost,
        total_stripe_fees,
        total_cost: total_ai_cost + total_email_cost + total_sms_cost + total_storage_cost + total_stripe_fees,
        ai_by_category,
        email_by_subdomain,
        account_count: users.size,
      };
    },
  });

  // Fetch per-account breakdown
  const accountsQuery = useQuery({
    queryKey: ["cost-accounts", dateRange?.start, dateRange?.end, realTimeUpdates],
    queryFn: async (): Promise<AccountCostSummary[]> => {
      let query = supabase.from("usage_records").select("*");

      if (dateRange?.start) {
        query = query.gte("created_at", dateRange.start.toISOString());
      }
      if (dateRange?.end) {
        query = query.lte("created_at", dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const records = data as UsageRecord[];

      // Group by user
      const userMap = new Map<string, AccountCostSummary>();

      records.forEach((record) => {
        if (!userMap.has(record.user_id)) {
          userMap.set(record.user_id, {
            user_id: record.user_id,
            ai_support_cost: 0,
            ai_onboarding_cost: 0,
            ai_features_cost: 0,
            ai_ticket_cost: 0,
            email_by_subdomain: {},
            sms_cost: 0,
            storage_cost: 0,
            stripe_fees: 0,
            total_cost: 0,
            first_usage: null,
            last_usage: null,
          });
        }

        const summary = userMap.get(record.user_id)!;
        const cost = Number(record.estimated_cost_cents) || 0;
        summary.total_cost += cost;

        // Track first/last usage
        if (!summary.first_usage || record.created_at < summary.first_usage) {
          summary.first_usage = record.created_at;
        }
        if (!summary.last_usage || record.created_at > summary.last_usage) {
          summary.last_usage = record.created_at;
        }

        if (record.resource_type === "ai") {
          if (record.category === "support-chat") {
            summary.ai_support_cost += cost;
          } else if (record.category === "onboarding-chat") {
            summary.ai_onboarding_cost += cost;
          } else if (record.category === "content-ai") {
            summary.ai_features_cost += cost;
          } else if (record.category === "ticket-ai-draft") {
            summary.ai_ticket_cost += cost;
          }
        } else if (record.resource_type === "email") {
          summary.email_by_subdomain[record.category] =
            (summary.email_by_subdomain[record.category] || 0) + cost;
        } else if (record.resource_type === "sms") {
          summary.sms_cost += cost;
        } else if (record.resource_type === "storage") {
          summary.storage_cost += cost;
        } else if (record.resource_type === "stripe") {
          summary.stripe_fees += cost;
        }
      });

      // Fetch user profiles
      const userIds = Array.from(userMap.keys());
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email, display_name")
          .in("user_id", userIds);

        profiles?.forEach((profile) => {
          const summary = userMap.get(profile.user_id);
          if (summary) {
            summary.email = profile.email || undefined;
            summary.display_name = profile.display_name || undefined;
          }
        });
      }

      return Array.from(userMap.values()).sort(
        (a, b) => b.total_cost - a.total_cost
      );
    },
  });

  // Fetch trends over time
  const trendsQuery = useQuery({
    queryKey: ["cost-trends", dateRange?.start, dateRange?.end, realTimeUpdates],
    queryFn: async (): Promise<CostTrend[]> => {
      let query = supabase.from("usage_records").select("*");

      if (dateRange?.start) {
        query = query.gte("created_at", dateRange.start.toISOString());
      }
      if (dateRange?.end) {
        query = query.lte("created_at", dateRange.end.toISOString());
      }

      const { data, error } = await query.order("created_at", { ascending: true });
      if (error) throw error;

      const records = data as UsageRecord[];

      // Group by date
      const dateMap = new Map<string, CostTrend>();

      records.forEach((record) => {
        const date = record.created_at.split("T")[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            ai_cost: 0,
            email_cost: 0,
            sms_cost: 0,
            storage_cost: 0,
            stripe_fees: 0,
            total_cost: 0,
          });
        }

        const trend = dateMap.get(date)!;
        const cost = Number(record.estimated_cost_cents) || 0;
        trend.total_cost += cost;

        if (record.resource_type === "ai") {
          trend.ai_cost += cost;
        } else if (record.resource_type === "email") {
          trend.email_cost += cost;
        } else if (record.resource_type === "sms") {
          trend.sms_cost += cost;
        } else if (record.resource_type === "storage") {
          trend.storage_cost += cost;
        } else if (record.resource_type === "stripe") {
          trend.stripe_fees += cost;
        }
      });

      return Array.from(dateMap.values());
    },
  });

  return {
    stats: statsQuery.data,
    accounts: accountsQuery.data,
    trends: trendsQuery.data,
    isLoading:
      statsQuery.isLoading || accountsQuery.isLoading || trendsQuery.isLoading,
    error: statsQuery.error || accountsQuery.error || trendsQuery.error,
    refetch: () => {
      statsQuery.refetch();
      accountsQuery.refetch();
      trendsQuery.refetch();
    },
  };
}

// Helper to format cost in dollars
export function formatCost(cents: number): string {
  const dollars = cents / 100;
  if (dollars < 0.01) {
    return `$${dollars.toFixed(4)}`;
  }
  return `$${dollars.toFixed(2)}`;
}

// Helper to estimate token cost
export function estimateTokenCost(
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost =
    (inputTokens / 1_000_000) * COST_RATES.ai.inputTokenCostPer1M;
  const outputCost =
    (outputTokens / 1_000_000) * COST_RATES.ai.outputTokenCostPer1M;
  return inputCost + outputCost;
}

// Helper to estimate Stripe fees for a transaction
export function estimateStripeFee(amountCents: number): number {
  // Stripe charges 2.9% + $0.30 per transaction
  const percentFee = (amountCents * COST_RATES.stripe.percentFee) / 100;
  const fixedFee = COST_RATES.stripe.fixedFeeCents;
  return percentFee + fixedFee;
}

// Helper to estimate storage cost
export function estimateStorageCost(
  fileSizeBytes: number,
  isUpload: boolean = true
): number {
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);
  // For uploads, charge both storage and transfer
  // Storage: $0.025/GB/month, Transfer: $0.09/GB
  if (isUpload) {
    return (fileSizeGB * COST_RATES.storage.perGBMonth) + (fileSizeGB * COST_RATES.storage.perGBTransfer);
  }
  // For downloads, just transfer cost
  return fileSizeGB * COST_RATES.storage.perGBTransfer;
}
