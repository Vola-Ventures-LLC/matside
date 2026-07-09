import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Calendar, List, LayoutGrid } from "lucide-react";
import { ContentItem } from "@/hooks/useContentPlanner";
import { cn } from "@/lib/utils";

interface ContentCalendarProps {
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
  onDateClick: (date: Date) => void;
}

type ViewMode = "month" | "week" | "list";

const statusColors: Record<string, string> = {
  idea: "bg-muted text-muted-foreground",
  draft: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  review: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  scheduled: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  published: "bg-green-500/20 text-green-700 dark:text-green-400",
  archived: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
};

const platformIcons: Record<string, string> = {
  instagram: "📷",
  facebook: "📘",
  twitter: "🐦",
  linkedin: "💼",
  email: "📧",
  website: "🌐",
};

export function ContentCalendar({ items, onItemClick, onDateClick }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);

  const days = useMemo(() => {
    const daysArray = [];
    let day = viewMode === "month" ? calendarStart : weekStart;
    const end = viewMode === "month" ? calendarEnd : weekEnd;

    while (day <= end) {
      daysArray.push(day);
      day = addDays(day, 1);
    }
    return daysArray;
  }, [viewMode, calendarStart, calendarEnd, weekStart, weekEnd]);

  const getItemsForDate = (date: Date) => {
    return items.filter((item) => {
      const itemDate = item.scheduled_for ? new Date(item.scheduled_for) : new Date(item.created_at);
      return isSameDay(itemDate, date);
    });
  };

  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className="bg-muted p-2 text-center text-sm font-medium">
          {day}
        </div>
      ))}
      {days.map((day) => {
        const dayItems = getItemsForDate(day);
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isToday = isSameDay(day, new Date());

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "bg-background p-2 min-h-[100px] cursor-pointer hover:bg-muted/50 transition-colors",
              !isCurrentMonth && "opacity-40"
            )}
            onClick={() => onDateClick(day)}
          >
            <div className={cn(
              "text-sm font-medium mb-1",
              isToday && "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
            )}>
              {format(day, "d")}
            </div>
            <div className="space-y-1">
              {dayItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "text-xs p-1 rounded truncate cursor-pointer hover:opacity-80",
                    statusColors[item.status]
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(item);
                  }}
                >
                  {item.platform && platformIcons[item.platform]} {item.title}
                </div>
              ))}
              {dayItems.length > 3 && (
                <div className="text-xs text-muted-foreground">+{dayItems.length - 3} more</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dayItems = getItemsForDate(day);
        const isToday = isSameDay(day, new Date());

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "bg-card border rounded-lg p-3 min-h-[300px] cursor-pointer hover:border-primary/50 transition-colors",
              isToday && "border-primary"
            )}
            onClick={() => onDateClick(day)}
          >
            <div className="text-center mb-3">
              <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
              <div className={cn(
                "text-lg font-bold",
                isToday && "text-primary"
              )}>
                {format(day, "d")}
              </div>
            </div>
            <div className="space-y-2">
              {dayItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "text-xs p-2 rounded cursor-pointer hover:opacity-80",
                    statusColors[item.status]
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(item);
                  }}
                >
                  <div className="font-medium truncate">
                    {item.platform && platformIcons[item.platform]} {item.title}
                  </div>
                  {item.scheduled_for && (
                    <div className="text-muted-foreground mt-1">
                      {format(new Date(item.scheduled_for), "h:mm a")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No content items yet</div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 bg-card border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onItemClick(item)}
          >
            <div className="text-2xl">{item.platform ? platformIcons[item.platform] : "📄"}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.title}</div>
              <div className="text-sm text-muted-foreground">
                {item.content_type.replace("_", " ")} • {item.scheduled_for ? format(new Date(item.scheduled_for), "MMM d, yyyy") : "Not scheduled"}
              </div>
            </div>
            <Badge className={statusColors[item.status]}>{item.status}</Badge>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg min-w-[200px] text-center">
              {viewMode === "month"
                ? format(currentDate, "MMMM yyyy")
                : `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="month">
                  <Calendar className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="week">
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "list" && renderListView()}
      </CardContent>
    </Card>
  );
}
