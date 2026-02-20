import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@saas-infra/auth/provider";
import { format, eachDayOfInterval } from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

export function useSupportSatisfactionMetrics(dateRange: DateRange) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["analytics", "support-satisfaction", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      // Get rated conversations in the date range
      const { data: ratedConversations } = await supabase
        .from("support_conversations")
        .select("id, user_rating, user_feedback, rated_at, created_at, status")
        .not("user_rating", "is", null)
        .gte("rated_at", dateRange.from.toISOString())
        .lte("rated_at", dateRange.to.toISOString())
        .order("rated_at", { ascending: false });

      // Get all conversations in range for response rate
      const { data: allConversations } = await supabase
        .from("support_conversations")
        .select("id, status, user_rating, created_at")
        .eq("status", "ended")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      // Calculate metrics
      const ratings = ratedConversations || [];
      const totalRated = ratings.length;
      const avgRating = totalRated > 0
        ? ratings.reduce((sum, c) => sum + (c.user_rating || 0), 0) / totalRated
        : 0;

      // Rating distribution
      const distribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratings.filter(c => c.user_rating === rating).length,
      }));

      // Satisfaction score (% of 4-5 star ratings)
      const satisfied = ratings.filter(c => (c.user_rating || 0) >= 4).length;
      const satisfactionRate = totalRated > 0 ? (satisfied / totalRated) * 100 : 0;

      // Response rate (% of closed conversations that got rated)
      const closedCount = allConversations?.length || 0;
      const responseRate = closedCount > 0
        ? (totalRated / closedCount) * 100
        : 0;

      // NPS calculation (% promoters - % detractors)
      const promoters = ratings.filter(c => c.user_rating === 5).length;
      const detractors = ratings.filter(c => (c.user_rating || 0) <= 3).length;
      const nps = totalRated > 0
        ? Math.round(((promoters - detractors) / totalRated) * 100)
        : 0;

      // Recent feedback with comments
      const recentFeedback = ratings
        .filter(c => c.user_feedback && c.user_feedback.trim().length > 0)
        .slice(0, 10)
        .map(c => ({
          id: c.id,
          rating: c.user_rating!,
          feedback: c.user_feedback!,
          ratedAt: c.rated_at!,
        }));

      // Trend by day
      const ratingsByDay = groupRatingsByDay(ratings, dateRange);

      // Previous period comparison
      const periodLength = dateRange.to.getTime() - dateRange.from.getTime();
      const previousFrom = new Date(dateRange.from.getTime() - periodLength);
      const previousTo = dateRange.from;

      const { data: previousRatings } = await supabase
        .from("support_conversations")
        .select("user_rating")
        .not("user_rating", "is", null)
        .gte("rated_at", previousFrom.toISOString())
        .lt("rated_at", previousTo.toISOString());

      const prevAvg = previousRatings?.length
        ? previousRatings.reduce((sum, c) => sum + (c.user_rating || 0), 0) / previousRatings.length
        : 0;
      const avgChange = prevAvg > 0
        ? ((avgRating - prevAvg) / prevAvg) * 100
        : 0;

      return {
        totalRated,
        avgRating: Math.round(avgRating * 10) / 10,
        avgRatingChange: Math.round(avgChange * 10) / 10,
        satisfactionRate: Math.round(satisfactionRate),
        responseRate: Math.round(responseRate),
        nps,
        distribution,
        recentFeedback,
        ratingsTrend: ratingsByDay,
        closedConversations: closedCount,
      };
    },
  });
}

function groupRatingsByDay(
  data: { rated_at: string | null; user_rating: number | null }[],
  dateRange: DateRange
): { date: string; avgRating: number; count: number }[] {
  const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  const dayMap = new Map<string, { sum: number; count: number }>();

  days.forEach(day => {
    dayMap.set(format(day, "yyyy-MM-dd"), { sum: 0, count: 0 });
  });

  data.forEach(item => {
    if (item.rated_at && item.user_rating) {
      const date = format(new Date(item.rated_at), "yyyy-MM-dd");
      const entry = dayMap.get(date);
      if (entry) {
        entry.sum += item.user_rating;
        entry.count += 1;
      }
    }
  });

  return Array.from(dayMap.entries()).map(([date, { sum, count }]) => ({
    date,
    avgRating: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
    count,
  }));
}
