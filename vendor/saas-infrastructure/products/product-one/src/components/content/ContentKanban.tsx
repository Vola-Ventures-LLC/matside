import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContentItem, ContentStatus } from "@/hooks/useContentPlanner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ContentKanbanProps {
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
  onStatusChange: (itemId: string, newStatus: ContentStatus) => void;
}

const columns: { status: ContentStatus; title: string; color: string }[] = [
  { status: "idea", title: "Ideas", color: "border-t-muted-foreground" },
  { status: "draft", title: "Drafts", color: "border-t-yellow-500" },
  { status: "review", title: "In Review", color: "border-t-blue-500" },
  { status: "scheduled", title: "Scheduled", color: "border-t-purple-500" },
  { status: "published", title: "Published", color: "border-t-green-500" },
];

const platformIcons: Record<string, string> = {
  instagram: "📷",
  facebook: "📘",
  twitter: "🐦",
  linkedin: "💼",
  email: "📧",
  website: "🌐",
};

const typeColors: Record<string, string> = {
  blog_post: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  social_media: "bg-pink-500/20 text-pink-700 dark:text-pink-400",
  email_campaign: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400",
  marketing_copy: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
};

export function ContentKanban({ items, onItemClick, onStatusChange }: ContentKanbanProps) {
  const groupedItems = useMemo(() => {
    const groups: Record<ContentStatus, ContentItem[]> = {
      idea: [],
      draft: [],
      review: [],
      scheduled: [],
      published: [],
      archived: [],
    };

    items.forEach((item) => {
      if (groups[item.status]) {
        groups[item.status].push(item);
      }
    });

    return groups;
  }, [items]);

  const handleDragStart = (e: React.DragEvent, item: ContentItem) => {
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: ContentStatus) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain");
    if (itemId) {
      onStatusChange(itemId, status);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.status}
          className="flex-shrink-0 w-72"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.status)}
        >
          <Card className={cn("h-full border-t-4", column.color)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {groupedItems[column.status].length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-2 p-1">
                  {groupedItems[column.status].map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onClick={() => onItemClick(item)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">
                            {item.platform ? platformIcons[item.platform] : "📄"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.title}</div>
                            {item.excerpt && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {item.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={cn("text-xs", typeColors[item.content_type])}>
                            {item.content_type.replace("_", " ")}
                          </Badge>
                        </div>
                        {item.scheduled_for && (
                          <div className="text-xs text-muted-foreground mt-2">
                            📅 {format(new Date(item.scheduled_for), "MMM d, h:mm a")}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {groupedItems[column.status].length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No items
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
