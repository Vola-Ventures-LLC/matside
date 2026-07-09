import { useState } from "react";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { NotificationFilters } from "@/components/notifications/NotificationFilters";
import { NotificationFeedGroup } from "@/components/notifications/NotificationFeedGroup";
import { useNotificationsFeed, NotificationFilter } from "@/hooks/useNotificationsFeed";

export default function Notifications() {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  
  const {
    groupedNotifications,
    loading,
    hasMore,
    stats,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  } = useNotificationsFeed({ filter });

  const hasNotifications = 
    groupedNotifications.today.length > 0 ||
    groupedNotifications.yesterday.length > 0 ||
    groupedNotifications.thisWeek.length > 0 ||
    groupedNotifications.earlier.length > 0;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground text-sm">
              {stats.unread > 0 
                ? `${stats.unread} unread notification${stats.unread === 1 ? "" : "s"}`
                : "You're all caught up!"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {stats.unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Mark all read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <NotificationFilters
            activeFilter={filter}
            onFilterChange={setFilter}
            unreadCount={stats.unread}
          />
        </CardHeader>
        <CardContent className="pt-0">
          {loading && !hasNotifications ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !hasNotifications ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description={
                filter === "all"
                  ? "You don't have any notifications yet. They'll appear here when something happens."
                  : `No ${filter} notifications found. Try a different filter.`
              }
            />
          ) : (
            <div className="space-y-6">
              <NotificationFeedGroup
                title="Today"
                notifications={groupedNotifications.today}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
              <NotificationFeedGroup
                title="Yesterday"
                notifications={groupedNotifications.yesterday}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
              <NotificationFeedGroup
                title="This Week"
                notifications={groupedNotifications.thisWeek}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
              <NotificationFeedGroup
                title="Earlier"
                notifications={groupedNotifications.earlier}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
