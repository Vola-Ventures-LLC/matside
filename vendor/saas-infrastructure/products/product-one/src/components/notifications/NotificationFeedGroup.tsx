import { NotificationFeedItem } from "./NotificationFeedItem";
import type { NotificationWithActor } from "@/hooks/useNotificationsFeed";

interface NotificationFeedGroupProps {
  title: string;
  notifications: NotificationWithActor[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationFeedGroup({
  title,
  notifications,
  onMarkAsRead,
  onDelete,
}: NotificationFeedGroupProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground px-1 sticky top-0 bg-background py-2 z-10">
        {title}
      </h3>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationFeedItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
