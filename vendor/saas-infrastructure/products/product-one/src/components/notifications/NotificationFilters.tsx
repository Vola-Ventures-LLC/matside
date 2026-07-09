import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Inbox,
  AtSign,
  Headphones,
  CreditCard,
  Megaphone,
} from "lucide-react";
import type { NotificationFilter } from "@/hooks/useNotificationsFeed";

interface NotificationFiltersProps {
  activeFilter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  unreadCount?: number;
}

const filters: { key: NotificationFilter; label: string; icon: typeof Bell }[] = [
  { key: "all", label: "All", icon: Inbox },
  { key: "unread", label: "Unread", icon: Bell },
  { key: "mentions", label: "Mentions", icon: AtSign },
  { key: "support", label: "Support", icon: Headphones },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "updates", label: "Updates", icon: Megaphone },
];

export function NotificationFilters({
  activeFilter,
  onFilterChange,
  unreadCount = 0,
}: NotificationFiltersProps) {
  return (
    <Tabs value={activeFilter} onValueChange={(v) => onFilterChange(v as NotificationFilter)}>
      <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const showBadge = filter.key === "unread" && unreadCount > 0;
          
          return (
            <TabsTrigger
              key={filter.key}
              value={filter.key}
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{filter.label}</span>
              {showBadge && (
                <Badge 
                  variant="secondary" 
                  className="h-5 min-w-5 px-1 text-xs data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
