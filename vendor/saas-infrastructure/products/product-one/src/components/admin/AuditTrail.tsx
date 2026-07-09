import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExportButton } from "@/components/admin/ExportButton";
import { useAuditLog } from "@/hooks/useAuditLog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Search,
  RefreshCw,
  Shield,
  Eye,
  Trash2,
  Ban,
  Download,
  Palette,
  Users,
  Lock,
} from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  ip_address: string | null;
  admin_email?: string;
  target_email?: string;
}

const actionConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  VIEW_USERS: { label: "Viewed Users", icon: Users, variant: "secondary" },
  DELETE_USER_ATTEMPT: { label: "Delete Attempt", icon: Trash2, variant: "destructive" },
  BAN_USER_ATTEMPT: { label: "Ban Attempt", icon: Ban, variant: "destructive" },
  IMPERSONATE_USER: { label: "Impersonated", icon: Eye, variant: "outline" },
  DOWNLOAD_LOGO: { label: "Downloaded Logo", icon: Download, variant: "secondary" },
  DOWNLOAD_FAVICON: { label: "Downloaded Favicon", icon: Download, variant: "secondary" },
  COPY_BRAND_COLOR: { label: "Copied Color", icon: Palette, variant: "secondary" },
  VIEW_AUDIT_LOGS: { label: "Viewed Audit Logs", icon: History, variant: "secondary" },
  REFRESH_USER_LIST: { label: "Refreshed Users", icon: RefreshCw, variant: "secondary" },
  EDIT_TEMPLATE: { label: "Edited Template", icon: History, variant: "default" },
};

export function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const { logAction } = useAuditLog();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);

    // Fetch admin audit logs only (no login events)
    const { data: adminLogsData, error: adminError } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (adminError) {
      console.error("Failed to fetch audit logs:", adminError);
      setIsLoading(false);
      return;
    }

    // Get unique user IDs
    const adminIds = [...new Set(adminLogsData?.map((l) => l.admin_user_id) || [])];
    const targetIds = [...new Set(adminLogsData?.filter((l) => l.target_user_id).map((l) => l.target_user_id!) || [])];
    const allUserIds = [...new Set([...adminIds, ...targetIds])];

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, display_name")
      .in("user_id", allUserIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Enrich admin logs
    const enrichedLogs: AuditLog[] = (adminLogsData || []).map((log) => ({
      id: log.id,
      admin_user_id: log.admin_user_id,
      action: log.action,
      target_user_id: log.target_user_id,
      details: log.details as Record<string, unknown> | null,
      created_at: log.created_at,
      ip_address: log.ip_address,
      admin_email: profileMap.get(log.admin_user_id)?.email || profileMap.get(log.admin_user_id)?.display_name || "Unknown",
      target_email: log.target_user_id ? profileMap.get(log.target_user_id)?.email || "Unknown" : undefined,
    }));

    setLogs(enrichedLogs);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
    // Log that admin viewed audit logs
    logAction({ action: "VIEW_AUDIT_LOGS" });
  }, [fetchLogs, logAction]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.admin_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    const config = actionConfig[action] || { label: action, icon: Shield, variant: "secondary" as const };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return "—";
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  const columns: Column<AuditLog>[] = [
    {
      key: "created_at",
      header: "Date & Time",
      render: (log) => (
        <div>
          <div className="text-sm">{format(new Date(log.created_at), "MMM d, yyyy")}</div>
          <div className="text-xs text-muted-foreground">{format(new Date(log.created_at), "HH:mm:ss")}</div>
        </div>
      ),
      className: "whitespace-nowrap",
    },
    {
      key: "admin_email",
      header: "Admin",
      render: (log) => <span className="truncate">{log.admin_email}</span>,
      className: "max-w-[150px]",
    },
    {
      key: "action",
      header: "Action",
      render: (log) => getActionBadge(log.action),
    },
    {
      key: "target_email",
      header: "Target User",
      render: (log) => <span className="truncate">{log.target_email || "—"}</span>,
      className: "max-w-[150px]",
    },
    {
      key: "details",
      header: "Details",
      render: (log) => (
        <span className="text-xs text-muted-foreground truncate">{formatDetails(log.details)}</span>
      ),
      className: "max-w-[200px]",
      sortable: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Actions
            </CardTitle>
            <CardDescription>
              Immutable log of all administrative actions (cannot be deleted)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={filteredLogs.map(l => ({
                date: l.created_at,
                admin: l.admin_email || "",
                action: l.action,
                target_user: l.target_email || "",
                ip_address: l.ip_address || "",
                details: l.details ? JSON.stringify(l.details) : "",
              }))}
              filename="audit_logs"
            />
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.keys(actionConfig).map((action) => (
                <SelectItem key={action} value={action}>
                  {actionConfig[action].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" text="Loading admin actions..." />
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No admin actions found"
            description={
              searchQuery || actionFilter !== "all"
                ? "Try adjusting your filters"
                : "Admin actions will appear here"
            }
          />
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="rounded-md border">
              <DataTable
                data={filteredLogs}
                columns={columns}
                defaultSortKey="created_at"
                defaultSortDirection="desc"
                emptyMessage="No admin actions found"
              />
            </div>
          </ScrollArea>
        )}

        <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
          <Lock className="h-3 w-3" />
          Audit logs are immutable and cannot be modified or deleted.
        </p>
      </CardContent>
    </Card>
  );
}
