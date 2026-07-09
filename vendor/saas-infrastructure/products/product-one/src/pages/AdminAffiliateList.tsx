import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { ExportButton } from "@/components/admin/ExportButton";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Users,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_type: string;
  status: string;
  payout_method: string;
  company_name: string | null;
  created_at: string;
  approved_at: string | null;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
  referral_count?: number;
  total_commission?: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  approved: "bg-green-500/10 text-green-600 border-green-200",
  rejected: "bg-red-500/10 text-red-600 border-red-200",
  suspended: "bg-gray-500/10 text-gray-600 border-gray-200",
};

export default function AdminAffiliateList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const { logAction } = useAuditLog();

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as "pending" | "approved" | "rejected" | "suspended");
    }

    const { data: affiliatesData, error } = await query;

    if (error) {
      console.error("Error fetching affiliates:", error);
      setLoading(false);
      return;
    }

    // Fetch profiles for each affiliate
    const userIds = affiliatesData?.map((a) => a.user_id) || [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", userIds);

    // Fetch referral counts
    const { data: referrals } = await supabase
      .from("referrals")
      .select("affiliate_id");

    // Fetch commission totals
    const { data: commissions } = await supabase
      .from("commission_events")
      .select("affiliate_id, commission_cents");

    const affiliatesWithDetails = (affiliatesData || []).map((affiliate) => {
      const profile = profiles?.find((p) => p.user_id === affiliate.user_id);
      const referralCount = referrals?.filter((r) => r.affiliate_id === affiliate.id).length || 0;
      const totalCommission = commissions
        ?.filter((c) => c.affiliate_id === affiliate.id)
        .reduce((sum, c) => sum + (c.commission_cents || 0), 0) || 0;

      return {
        ...affiliate,
        profile,
        referral_count: referralCount,
        total_commission: totalCommission,
      };
    });

    setAffiliates(affiliatesWithDetails);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  const updateStatus = async (affiliateId: string, newStatus: string) => {
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "approved") {
      updates.approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("affiliates")
      .update(updates)
      .eq("id", affiliateId);

    if (error) {
      toast({ variant: "destructive", title: "Failed to update status", description: error.message });
    } else {
      toast({ title: "Status updated", description: `Affiliate has been ${newStatus}.` });
      const actionMap: Record<string, "AFFILIATE_APPROVED" | "AFFILIATE_REJECTED" | "AFFILIATE_SUSPENDED"> = {
        approved: "AFFILIATE_APPROVED",
        rejected: "AFFILIATE_REJECTED",
        suspended: "AFFILIATE_SUSPENDED",
      };
      if (actionMap[newStatus]) {
        logAction({ action: actionMap[newStatus], details: { affiliate_id: affiliateId } });
      }
      fetchAffiliates();
    }
  };

  const filteredAffiliates = affiliates.filter((affiliate) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      affiliate.profile?.display_name?.toLowerCase().includes(searchLower) ||
      affiliate.profile?.email?.toLowerCase().includes(searchLower) ||
      affiliate.company_name?.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/affiliates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Manage Affiliates</h1>
            <p className="text-muted-foreground">
              Review applications and manage affiliate accounts
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setSearchParams(value === "all" ? {} : { status: value });
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <ExportButton
              data={filteredAffiliates.map(a => ({
                name: a.profile?.display_name || "",
                email: a.profile?.email || "",
                company: a.company_name || "",
                type: a.affiliate_type,
                status: a.status,
                referrals: a.referral_count,
                earnings_cents: a.total_commission || 0,
                applied_at: a.created_at,
              }))}
              filename="affiliates"
            />
          </div>
        </CardContent>
      </Card>

      {/* Affiliates Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading affiliates..." />
            </div>
          ) : filteredAffiliates.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Users}
                title="No affiliates found"
                description={
                  statusFilter !== "all"
                    ? `No ${statusFilter} affiliates`
                    : "No affiliate applications yet"
                }
              />
            </div>
          ) : (
            <DataTable
              data={filteredAffiliates}
              columns={[
                {
                  key: "profile",
                  header: "Affiliate",
                  render: (affiliate) => (
                    <div>
                      <p className="font-medium">
                        {affiliate.profile?.display_name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {affiliate.profile?.email}
                      </p>
                      {affiliate.company_name && (
                        <p className="text-xs text-muted-foreground">
                          {affiliate.company_name}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  key: "affiliate_type",
                  header: "Type",
                  render: (affiliate) => (
                    <Badge variant="outline" className="capitalize">
                      {affiliate.affiliate_type}
                    </Badge>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (affiliate) => (
                    <Badge variant="outline" className={statusColors[affiliate.status]}>
                      {affiliate.status}
                    </Badge>
                  ),
                },
                {
                  key: "referral_count",
                  header: "Referrals",
                  headerClassName: "text-right",
                  className: "text-right",
                },
                {
                  key: "total_commission",
                  header: "Earnings",
                  headerClassName: "text-right",
                  className: "text-right",
                  render: (affiliate) => formatCurrency(affiliate.total_commission || 0),
                },
                {
                  key: "created_at",
                  header: "Applied",
                  render: (affiliate) => (
                    <span className="text-muted-foreground">
                      {format(new Date(affiliate.created_at), "MMM d, yyyy")}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  sortable: false,
                  className: "w-[50px]",
                  render: (affiliate) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {affiliate.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => updateStatus(affiliate.id, "approved")}>
                              <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(affiliate.id, "rejected")}>
                              <XCircle className="h-4 w-4 mr-2 text-destructive" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {affiliate.status === "approved" && (
                          <DropdownMenuItem onClick={() => updateStatus(affiliate.id, "suspended")}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {affiliate.status === "suspended" && (
                          <DropdownMenuItem onClick={() => updateStatus(affiliate.id, "approved")}>
                            <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ),
                },
              ]}
              defaultSortKey="created_at"
              defaultSortDirection="desc"
              emptyMessage={
                statusFilter !== "all"
                  ? `No ${statusFilter} affiliates`
                  : "No affiliate applications yet"
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
