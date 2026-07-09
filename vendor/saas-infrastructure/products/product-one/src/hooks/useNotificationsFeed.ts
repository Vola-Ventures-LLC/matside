import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface NotificationWithActor {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: "info" | "success" | "warning" | "error";
  link: string | null;
  is_read: boolean;
  created_at: string;
  actor_id: string | null;
  action_type: string | null;
  metadata: Record<string, unknown> | null;
  actor?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export type NotificationFilter = "all" | "unread" | "mentions" | "support" | "billing" | "updates";

interface UseNotificationsFeedOptions {
  filter?: NotificationFilter;
  limit?: number;
}

export function useNotificationsFeed(options: UseNotificationsFeedOptions = {}) {
  const { filter = "all", limit = 50 } = options;
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  // Fetch notifications with actor profiles
  const fetchNotifications = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const offset = pageNum * limit;

      // Build the query
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit);

      // Apply filters
      if (filter === "unread") {
        query = query.eq("is_read", false);
      } else if (filter === "mentions") {
        query = query.eq("action_type", "mention");
      } else if (filter === "support") {
        query = query.in("action_type", ["ticket_reply", "ticket_assigned", "mention"]);
      } else if (filter === "billing") {
        query = query.in("action_type", ["payment_received", "subscription_changed", "invoice_due"]);
      } else if (filter === "updates") {
        query = query.eq("action_type", "product_update");
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch actor profiles for notifications with actor_id
      const actorIds = [...new Set((data || []).filter(n => n.actor_id).map(n => n.actor_id))];
      let actorProfiles: Record<string, { id: string; display_name: string | null; avatar_url: string | null }> = {};

      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", actorIds);

        if (profiles) {
          actorProfiles = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as typeof actorProfiles);
        }
      }

      // Merge notifications with actor data
      const notificationsWithActors: NotificationWithActor[] = (data || []).map(n => ({
        ...n,
        type: n.type as NotificationWithActor["type"],
        metadata: n.metadata as Record<string, unknown> | null,
        actor: n.actor_id ? actorProfiles[n.actor_id] || null : null,
      }));

      if (append) {
        setNotifications(prev => [...prev, ...notificationsWithActors]);
      } else {
        setNotifications(notificationsWithActors);
      }

      setHasMore(notificationsWithActors.length === limit + 1);
    } catch (error) {
      console.error("Error fetching notifications feed:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter, limit]);

  // Load more notifications
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  }, [page, fetchNotifications]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, [user?.id]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [user?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, [user?.id]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationWithActor[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach(notification => {
      const createdAt = new Date(notification.created_at);
      
      if (createdAt >= today) {
        groups.today.push(notification);
      } else if (createdAt >= yesterday) {
        groups.yesterday.push(notification);
      } else if (createdAt >= weekAgo) {
        groups.thisWeek.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });

    return groups;
  }, [notifications]);

  // Stats
  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
  }), [notifications]);

  // Initial fetch and filter changes
  useEffect(() => {
    setPage(0);
    fetchNotifications(0, false);
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-feed:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotification = payload.new as NotificationWithActor;
          
          // Fetch actor profile if needed
          if (newNotification.actor_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, display_name, avatar_url")
              .eq("id", newNotification.actor_id)
              .single();
            
            newNotification.actor = profile;
          }

          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as NotificationWithActor;
          setNotifications(prev =>
            prev.map(n => (n.id === updated.id ? { ...n, ...updated } : n))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setNotifications(prev => prev.filter(n => n.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    notifications,
    groupedNotifications,
    loading,
    hasMore,
    stats,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: () => fetchNotifications(0, false),
  };
}
