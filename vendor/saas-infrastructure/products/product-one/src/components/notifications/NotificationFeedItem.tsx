import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Trash2,
  MoreHorizontal,
  AtSign,
  MessageSquare,
  CreditCard,
  Bell,
  Megaphone,
  UserPlus,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NotificationWithActor } from "@/hooks/useNotificationsFeed";

interface NotificationFeedItemProps {
  notification: NotificationWithActor;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const typeIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const typeColors = {
  info: "text-blue-500 bg-blue-500/10",
  success: "text-green-500 bg-green-500/10",
  warning: "text-yellow-500 bg-yellow-500/10",
  error: "text-destructive bg-destructive/10",
};

const actionTypeIcons: Record<string, typeof Info> = {
  mention: AtSign,
  ticket_reply: MessageSquare,
  ticket_assigned: UserPlus,
  payment_received: CreditCard,
  subscription_changed: CreditCard,
  product_update: Megaphone,
  default: Bell,
};

const actionTypeLabels: Record<string, string> = {
  mention: "Mention",
  ticket_reply: "Reply",
  ticket_assigned: "Assignment",
  payment_received: "Payment",
  subscription_changed: "Subscription",
  product_update: "Update",
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function NotificationFeedItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationFeedItemProps) {
  const TypeIcon = typeIcons[notification.type];
  const ActionIcon = actionTypeIcons[notification.action_type || "default"] || Bell;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  const content = (
    <div
      className={cn(
        "flex gap-4 p-4 transition-colors hover:bg-muted/50 rounded-lg border",
        !notification.is_read && "bg-primary/5 border-primary/20",
        notification.is_read && "border-transparent"
      )}
    >
      {/* Actor Avatar or Icon */}
      <div className="shrink-0">
        {notification.actor ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src={notification.actor.avatar_url || undefined} />
            <AvatarFallback className={typeColors[notification.type]}>
              {getInitials(notification.actor.display_name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn("p-2 rounded-full", typeColors[notification.type])}>
            <TypeIcon className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {notification.actor && (
              <span className="font-medium text-sm">
                {notification.actor.display_name || "Someone"}
              </span>
            )}
            {notification.action_type && actionTypeLabels[notification.action_type] && (
              <Badge variant="secondary" className="text-xs gap-1">
                <ActionIcon className="h-3 w-3" />
                {actionTypeLabels[notification.action_type]}
              </Badge>
            )}
            {!notification.is_read && (
              <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.preventDefault()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!notification.is_read && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onMarkAsRead(notification.id);
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(notification.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <p className={cn("text-sm", !notification.is_read && "font-medium")}>
          {notification.title}
        </p>

        {/* Message */}
        {notification.message && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {notification.link && (
            <span className="text-xs text-primary flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              View details
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link
        to={notification.link}
        className="group block"
        onClick={handleClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="group cursor-pointer" onClick={handleClick}>
      {content}
    </div>
  );
}
