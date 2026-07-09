import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExportButton } from "@/components/admin/ExportButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogIn, Search, RefreshCw, LogOut } from "lucide-react";
import { format } from "date-fns";

interface LoginEvent {
  id: string;
  user_id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_email?: string;
}

export default function AdminLoginEvents() {
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);

    const { data: loginEventsData, error } = await supabase
      .from("login_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Failed to fetch login events:", error);
      setIsLoading(false);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(loginEventsData?.map((e) => e.user_id) || [])];

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, display_name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Enrich events
    const enrichedEvents: LoginEvent[] = (loginEventsData || []).map((event) => ({
      ...event,
      user_email: profileMap.get(event.user_id)?.email || 
                  profileMap.get(event.user_id)?.display_name || 
                  "Unknown",
    }));

    setEvents(enrichedEvents);
    setIsLoading(false);
  };

  const filteredEvents = events.filter((event) => {
    if (searchQuery === "") return true;
    return (
      event.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.ip_address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getEventBadge = (eventType: string) => {
    const isLogin = eventType.toLowerCase() === "login";
    return (
      <Badge variant={isLogin ? "default" : "secondary"} className="gap-1">
        {isLogin ? <LogIn className="h-3 w-3" /> : <LogOut className="h-3 w-3" />}
        {isLogin ? "Login" : "Logout"}
      </Badge>
    );
  };

  const columns: Column<LoginEvent>[] = [
    {
      key: "created_at",
      header: "Date & Time",
      render: (event) => (
        <div>
          <div className="text-sm">
            {format(new Date(event.created_at), "MMM d, yyyy")}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(event.created_at), "HH:mm:ss")}
          </div>
        </div>
      ),
      className: "whitespace-nowrap",
    },
    {
      key: "user_email",
      header: "User",
      render: (event) => event.user_email,
      className: "max-w-[150px] truncate",
    },
    {
      key: "event_type",
      header: "Event",
      render: (event) => getEventBadge(event.event_type),
    },
    {
      key: "ip_address",
      header: "IP Address",
      render: (event) => (
        <span className="text-sm text-muted-foreground">
          {event.ip_address || "—"}
        </span>
      ),
    },
    {
      key: "user_agent",
      header: "User Agent",
      render: (event) => (
        <span className="text-xs text-muted-foreground">
          {event.user_agent || "—"}
        </span>
      ),
      className: "max-w-[200px] truncate",
    },
  ];

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <LogIn className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Login Events</h1>
          <p className="text-muted-foreground">
            Track user login and logout activity
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                User Sessions
              </CardTitle>
              <CardDescription>
                Recent login and logout events across all users
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <ExportButton
                data={filteredEvents.map(e => ({
                  date: e.created_at,
                  user: e.user_email || "",
                  event_type: e.event_type,
                  ip_address: e.ip_address || "",
                  user_agent: e.user_agent || "",
                }))}
                filename="login_events"
              />
              <Button variant="outline" size="sm" onClick={fetchEvents}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by user or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Loading login events..." />
            </div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              icon={LogIn}
              title="No login events found"
              description={
                searchQuery
                  ? "Try adjusting your search"
                  : "User login activity will appear here"
              }
            />
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="rounded-md border">
                <DataTable
                  data={filteredEvents}
                  columns={columns}
                  defaultSortKey="created_at"
                  defaultSortDirection="desc"
                />
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
