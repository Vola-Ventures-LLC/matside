import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface RateLimitAlert {
  id: string;
  user_id: string | null;
  ip_address: string | null;
  endpoint: string;
  alert_type: "warning" | "blocked" | "threshold";
  usage_count: number;
  limit_value: number;
  usage_percent: number;
  window_minutes: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RateLimitUsageSummary {
  endpoint: string;
  alert_type: string;
  alert_count: number;
  unique_users: number;
  unique_ips: number;
  avg_usage_percent: number;
  max_usage_percent: number;
  hour: string;
}

export interface RateLimitTopOffender {
  identifier: string;
  identifier_type: "user" | "ip";
  user_id: string | null;
  ip_address: string | null;
  total_alerts: number;
  blocked_count: number;
  warning_count: number;
  endpoints_affected: string[];
  last_alert_at: string;
}

export interface RateLimitStats {
  totalAlerts24h: number;
  blockedRequests24h: number;
  warningAlerts24h: number;
  uniqueUsersAffected: number;
  uniqueIPsAffected: number;
  topEndpoints: { endpoint: string; count: number }[];
}

interface UseRateLimitMonitoringOptions {
  enableRealtime?: boolean;
  limit?: number;
}

export function useRateLimitMonitoring(options: UseRateLimitMonitoringOptions = {}) {
  const { enableRealtime = true, limit = 100 } = options;
  const { user, isAdmin, isOwner } = useAuth();
  const { toast } = useToast();

  const [alerts, setAlerts] = useState<RateLimitAlert[]>([]);
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [topOffenders, setTopOffenders] = useState<RateLimitTopOffender[]>([]);
  const [usageSummary, setUsageSummary] = useState<RateLimitUsageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    if (!user || (!isAdmin && !isOwner)) return;

    try {
      const { data, error: fetchError } = await supabase
        .from("rate_limit_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      setAlerts((data || []) as RateLimitAlert[]);
    } catch (err) {
      console.error("Error fetching rate limit alerts:", err);
      setError("Failed to fetch alerts");
    }
  }, [user, isAdmin, isOwner, limit]);

  // Fetch aggregated stats
  const fetchStats = useCallback(async () => {
    if (!user || (!isAdmin && !isOwner)) return;

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: alertData, error: alertError } = await supabase
        .from("rate_limit_alerts")
        .select("*")
        .gte("created_at", twentyFourHoursAgo);

      if (alertError) throw alertError;

      const alertsData = (alertData || []) as RateLimitAlert[];

      // Calculate stats
      const blockedCount = alertsData.filter((a) => a.alert_type === "blocked").length;
      const warningCount = alertsData.filter((a) => a.alert_type === "warning").length;
      const uniqueUsers = new Set(alertsData.filter((a) => a.user_id).map((a) => a.user_id)).size;
      const uniqueIPs = new Set(alertsData.filter((a) => a.ip_address).map((a) => a.ip_address)).size;

      // Top endpoints
      const endpointCounts: Record<string, number> = {};
      alertsData.forEach((a) => {
        endpointCounts[a.endpoint] = (endpointCounts[a.endpoint] || 0) + 1;
      });
      const topEndpoints = Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalAlerts24h: alertsData.length,
        blockedRequests24h: blockedCount,
        warningAlerts24h: warningCount,
        uniqueUsersAffected: uniqueUsers,
        uniqueIPsAffected: uniqueIPs,
        topEndpoints,
      });
    } catch (err) {
      console.error("Error fetching rate limit stats:", err);
    }
  }, [user, isAdmin, isOwner]);

  // Fetch top offenders (view)
  const fetchTopOffenders = useCallback(async () => {
    if (!user || (!isAdmin && !isOwner)) return;

    try {
      // Fetch from the view - we'll get the raw data and type it
      const { data, error: fetchError } = await supabase
        .from("rate_limit_top_offenders")
        .select("*")
        .limit(20);

      if (fetchError) throw fetchError;
      setTopOffenders((data || []) as RateLimitTopOffender[]);
    } catch (err) {
      console.error("Error fetching top offenders:", err);
    }
  }, [user, isAdmin, isOwner]);

  // Fetch usage summary (view)
  const fetchUsageSummary = useCallback(async () => {
    if (!user || (!isAdmin && !isOwner)) return;

    try {
      const { data, error: fetchError } = await supabase
        .from("rate_limit_usage_summary")
        .select("*")
        .limit(100);

      if (fetchError) throw fetchError;
      setUsageSummary((data || []) as RateLimitUsageSummary[]);
    } catch (err) {
      console.error("Error fetching usage summary:", err);
    }
  }, [user, isAdmin, isOwner]);

  // Fetch all data
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchAlerts(), fetchStats(), fetchTopOffenders(), fetchUsageSummary()]);
    setLoading(false);
  }, [fetchAlerts, fetchStats, fetchTopOffenders, fetchUsageSummary]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    if (!user || (!isAdmin && !isOwner)) {
      setLoading(false);
      return;
    }

    refetch();

    if (!enableRealtime) return;

    // Subscribe to real-time alerts
    const channel = supabase
      .channel("rate-limit-alerts-monitor")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rate_limit_alerts",
        },
        (payload) => {
          const newAlert = payload.new as RateLimitAlert;
          setAlerts((prev) => [newAlert, ...prev].slice(0, limit));

          // Update stats
          setStats((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              totalAlerts24h: prev.totalAlerts24h + 1,
              blockedRequests24h:
                newAlert.alert_type === "blocked" ? prev.blockedRequests24h + 1 : prev.blockedRequests24h,
              warningAlerts24h:
                newAlert.alert_type === "warning" ? prev.warningAlerts24h + 1 : prev.warningAlerts24h,
            };
          });

          // Show toast for blocked alerts
          if (newAlert.alert_type === "blocked") {
            toast({
              title: "Rate Limit Block",
              description: `${newAlert.endpoint}: User/IP blocked after ${newAlert.usage_count} requests`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, isOwner, enableRealtime, limit, refetch, toast]);

  return {
    alerts,
    stats,
    topOffenders,
    usageSummary,
    loading,
    error,
    refetch,
  };
}

// Hook for chart data formatting
export function useRateLimitChartData(usageSummary: RateLimitUsageSummary[]) {
  // Group by hour for time series
  const hourlyData = usageSummary.reduce(
    (acc, item) => {
      const hour = new Date(item.hour).toISOString();
      if (!acc[hour]) {
        acc[hour] = { hour, blocked: 0, warning: 0, threshold: 0 };
      }
      if (item.alert_type === "blocked") acc[hour].blocked += item.alert_count;
      if (item.alert_type === "warning") acc[hour].warning += item.alert_count;
      if (item.alert_type === "threshold") acc[hour].threshold += item.alert_count;
      return acc;
    },
    {} as Record<string, { hour: string; blocked: number; warning: number; threshold: number }>
  );

  const timeSeriesData = Object.values(hourlyData)
    .sort((a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime())
    .slice(-48); // Last 48 hours

  // Group by endpoint for pie chart
  const endpointData = usageSummary.reduce(
    (acc, item) => {
      if (!acc[item.endpoint]) {
        acc[item.endpoint] = { endpoint: item.endpoint, count: 0 };
      }
      acc[item.endpoint].count += item.alert_count;
      return acc;
    },
    {} as Record<string, { endpoint: string; count: number }>
  );

  const pieChartData = Object.values(endpointData).sort((a, b) => b.count - a.count);

  return { timeSeriesData, pieChartData };
}
