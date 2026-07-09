import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, subMonths, format, eachDayOfInterval } from "date-fns";

export type DateRange = {
  from: Date;
  to: Date;
};

export type TimePreset = "7d" | "30d" | "90d" | "12m" | "custom";

export function getDateRangeFromPreset(preset: TimePreset): DateRange {
  const to = new Date();
  let from: Date;

  switch (preset) {
    case "7d":
      from = subDays(to, 7);
      break;
    case "30d":
      from = subDays(to, 30);
      break;
    case "90d":
      from = subDays(to, 90);
      break;
    case "12m":
      from = subMonths(to, 12);
      break;
    default:
      from = subDays(to, 30);
  }

  return { from: startOfDay(from), to };
}

// User Metrics Hook
export function useUserMetrics(dateRange: DateRange) {
  return useQuery({
    queryKey: ["analytics", "users", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // New signups in range
      const { data: signups } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at");

      // Active users (logged in during range)
      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_login_at", dateRange.from.toISOString())
        .lte("last_login_at", dateRange.to.toISOString());

      // Previous period for comparison
      const periodLength = dateRange.to.getTime() - dateRange.from.getTime();
      const previousFrom = new Date(dateRange.from.getTime() - periodLength);
      const previousTo = dateRange.from;

      const { count: previousSignups } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", previousFrom.toISOString())
        .lt("created_at", previousTo.toISOString());

      // Group signups by day
      const signupsByDay = groupByDay(signups || [], "created_at", dateRange);

      const growthRate = previousSignups && previousSignups > 0
        ? (((signups?.length || 0) - previousSignups) / previousSignups) * 100
        : 0;

      return {
        totalUsers: totalUsers || 0,
        newSignups: signups?.length || 0,
        activeUsers: activeUsers || 0,
        growthRate: Math.round(growthRate * 10) / 10,
        signupsTrend: signupsByDay,
      };
    },
  });
}

// Content Performance Hook
export function useContentMetrics(dateRange: DateRange) {
  return useQuery({
    queryKey: ["analytics", "content", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      // Total published posts
      const { count: totalPosts } = await supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      // Posts in range
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, title, slug, view_count, reading_time_minutes, published_at")
        .eq("status", "published")
        .gte("published_at", dateRange.from.toISOString())
        .lte("published_at", dateRange.to.toISOString())
        .order("published_at");

      // Top posts by views (all time)
      const { data: topPosts } = await supabase
        .from("blog_posts")
        .select("id, title, slug, view_count")
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .limit(5);

      // Total views
      const { data: allPosts } = await supabase
        .from("blog_posts")
        .select("view_count")
        .eq("status", "published");

      const totalViews = allPosts?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;
      const avgReadingTime = posts?.length
        ? Math.round(posts.reduce((sum, p) => sum + (p.reading_time_minutes || 0), 0) / posts.length)
        : 0;

      // Posts published by day
      const postsByDay = groupByDay(posts || [], "published_at", dateRange);

      return {
        totalPosts: totalPosts || 0,
        postsInPeriod: posts?.length || 0,
        totalViews,
        avgReadingTime,
        topPosts: topPosts || [],
        publishTrend: postsByDay,
      };
    },
  });
}

// Revenue & Billing Hook
export function useRevenueMetrics(dateRange: DateRange) {
  return useQuery({
    queryKey: ["analytics", "revenue", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      // Active user subscriptions
      const { data: userSubs } = await supabase
        .from("user_subscriptions")
        .select("status, plan_id, created_at")
        .in("status", ["active", "trialing"]);

      // Active org subscriptions
      const { data: orgSubs } = await supabase
        .from("org_subscriptions")
        .select("status, plan_id, seat_count, created_at")
        .in("status", ["active", "trialing"]);

      // Get plans for MRR calculation
      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("id, price_cents, interval, seat_price_cents");

      // Credit transactions in range
      const { data: creditTxns } = await supabase
        .from("credit_transactions")
        .select("amount, transaction_type, created_at")
        .eq("transaction_type", "purchase")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      // Calculate MRR
      const planMap = new Map(plans?.map(p => [p.id, p]) || []);
      let mrr = 0;

      userSubs?.forEach(sub => {
        const plan = planMap.get(sub.plan_id);
        if (plan) {
          const monthly = plan.interval === "year" ? plan.price_cents / 12 : plan.price_cents;
          mrr += monthly;
        }
      });

      orgSubs?.forEach(sub => {
        const plan = planMap.get(sub.plan_id);
        if (plan) {
          const base = plan.interval === "year" ? plan.price_cents / 12 : plan.price_cents;
          const seats = (sub.seat_count || 1) * (plan.seat_price_cents || 0);
          const seatsMonthly = plan.interval === "year" ? seats / 12 : seats;
          mrr += base + seatsMonthly;
        }
      });

      // Subscription status breakdown
      const { data: allUserSubs } = await supabase
        .from("user_subscriptions")
        .select("status");
      const { data: allOrgSubs } = await supabase
        .from("org_subscriptions")
        .select("status");

      const statusCounts: Record<string, number> = {};
      [...(allUserSubs || []), ...(allOrgSubs || [])].forEach(sub => {
        statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
      });

      // Churn - canceled in period
      const { count: churned } = await supabase
        .from("user_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "canceled")
        .gte("updated_at", dateRange.from.toISOString())
        .lte("updated_at", dateRange.to.toISOString());

      const totalActive = (userSubs?.length || 0) + (orgSubs?.length || 0);
      const churnRate = totalActive > 0 ? ((churned || 0) / (totalActive + (churned || 0))) * 100 : 0;

      // Credit sales by day
      const creditsByDay = groupByDay(creditTxns || [], "created_at", dateRange);

      return {
        mrr: mrr / 100, // Convert to dollars
        activeSubscriptions: totalActive,
        creditSales: creditTxns?.reduce((sum, t) => sum + t.amount, 0) || 0,
        churnRate: Math.round(churnRate * 10) / 10,
        statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        creditTrend: creditsByDay,
      };
    },
  });
}

// Email Health Hook
export function useEmailMetrics(dateRange: DateRange) {
  return useQuery({
    queryKey: ["analytics", "email", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const { data: events } = await supabase
        .from("email_events")
        .select("event_type, created_at")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      const counts: Record<string, number> = {};
      events?.forEach(e => {
        counts[e.event_type] = (counts[e.event_type] || 0) + 1;
      });

      const sent = counts["sent"] || counts["email.sent"] || 0;
      const delivered = counts["delivered"] || counts["email.delivered"] || 0;
      const opened = counts["opened"] || counts["email.opened"] || 0;
      const bounced = counts["bounced"] || counts["email.bounced"] || 0;
      const complained = counts["complained"] || counts["email.complained"] || 0;

      const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
      const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;

      // Events by day
      const eventsByDay = groupByDay(events || [], "created_at", dateRange);

      return {
        sent,
        delivered,
        opened,
        bounced,
        complained,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        openRate: Math.round(openRate * 10) / 10,
        bounceRate: Math.round(bounceRate * 10) / 10,
        eventTrend: eventsByDay,
      };
    },
  });
}

// Helper to group data by day
function groupByDay<T extends Record<string, unknown>>(
  data: T[],
  dateField: keyof T,
  dateRange: DateRange
): { date: string; count: number }[] {
  const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  const countMap = new Map<string, number>();

  // Initialize all days with 0
  days.forEach(day => {
    countMap.set(format(day, "yyyy-MM-dd"), 0);
  });

  // Count items per day
  data.forEach(item => {
    const date = format(new Date(item[dateField] as string), "yyyy-MM-dd");
    countMap.set(date, (countMap.get(date) || 0) + 1);
  });

  return Array.from(countMap.entries()).map(([date, count]) => ({ date, count }));
}
