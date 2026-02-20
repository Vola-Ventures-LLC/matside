import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@saas-infra/auth/provider";
import { ExportButton } from "./ExportButton";
import { useAuditLog } from "../hooks/useAuditLog";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@saas-infra/ui/card";
import { Button } from "@saas-infra/ui/button";
import { Input } from "@saas-infra/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@saas-infra/ui/table";
import { Badge } from "@saas-infra/ui/badge";
import { ScrollArea } from "@saas-infra/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@saas-infra/ui/select";
import {
  History, Search, RefreshCw, Shield, Eye, Trash2, Ban, Download, Palette, Users, Lock,
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

interface AuditTrailProps {
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}

export function AuditTrail({ onError, onSuccess }: AuditTrailProps) {
  const supabase = useSupabase();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const { logAction } = useAuditLog();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);

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

    const adminIds = [...new Set(adminLogsData?.map((l) => l.admin_user_id) || [])];
    const targetIds = [...new Set(adminLogsData?.filter((l) => l.target_user_id).map((l) => l.target_user_id!) || [])];
    const allUserIds = [...new Set([...adminIds, ...targetIds])];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, display_name")
      .in("user_id", allUserIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

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
  }, [supabase]);

  useEffect(() => {
    fetchLogs();
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
    if (!details) return "\u2014";
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

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
              onError={onError}
              onSuccess={onSuccess}
            />
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
          <div className="flex justify-center py-8 text-muted-foreground">Loading admin actions...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Shield className="h-10 w-10 mb-2 opacity-50" />
            <p className="font-medium">No admin actions found</p>
            <p className="text-sm">
              {searchQuery || actionFilter !== "all"
                ? "Try adjusting your filters"
                : "Admin actions will appear here"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">
                          {format(new Date(log.created_at), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {log.admin_email}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {log.target_email || "\u2014"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {formatDetails(log.details)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
