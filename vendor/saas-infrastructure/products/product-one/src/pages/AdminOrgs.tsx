import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { OrgDetailSheet } from "@/components/admin/OrgDetailSheet";
import { ExportButton } from "@/components/admin/ExportButton";
import { Search, Building2 } from "lucide-react";
import { format } from "date-fns";

interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export default function AdminOrgs() {
  const { isOwner } = useAuth();
  const { logAction } = useAuditLog();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const logActionCallback = useCallback(() => {
    logAction({ action: "VIEW_ORGANIZATIONS" });
  }, [logAction]);

  useEffect(() => {
    fetchOrgs();
    logActionCallback();
  }, [logActionCallback]);

  const fetchOrgs = async () => {
    setIsLoading(true);

    // Fetch organizations with member count
    const { data, error } = await supabase
      .from("organizations")
      .select(`
        *,
        organization_members(count)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch organizations",
        description: error.message,
      });
    } else {
      const orgsWithCount = (data || []).map((org: any) => ({
        ...org,
        member_count: org.organization_members?.[0]?.count || 0,
      }));
      setOrgs(orgsWithCount);
    }

    setIsLoading(false);
  };

  const filteredOrgs = orgs.filter((org) => {
    const query = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(query) ||
      org.slug.toLowerCase().includes(query)
    );
  });

  const handleOrgClick = (org: Organization) => {
    setSelectedOrg(org);
    setSheetOpen(true);
  };

  const handleRefresh = () => {
    logAction({ action: "REFRESH_ORG_LIST" });
    fetchOrgs();
  };

  const columns: Column<Organization>[] = [
    {
      key: "name",
      header: "Name",
      render: (org) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {org.name}
        </div>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (org) => <Badge variant="secondary">{org.slug}</Badge>,
    },
    {
      key: "member_count",
      header: "Members",
      render: (org) => org.member_count,
    },
    {
      key: "created_at",
      header: "Created",
      render: (org) => format(new Date(org.created_at), "MMM d, yyyy"),
    },
  ];

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Organization Management</h1>
          <p className="text-muted-foreground">
            View and manage all organizations
          </p>
        </div>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>
            {orgs.length} total organizations. Click on an organization to view details and members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={handleRefresh}>
              Refresh
            </Button>
            <ExportButton
              data={filteredOrgs.map(o => ({
                name: o.name,
                slug: o.slug,
                members: o.member_count || 0,
                created_at: o.created_at,
              }))}
              filename="organizations"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Loading organizations..." />
            </div>
          ) : filteredOrgs.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No organizations found"
              description={
                searchQuery
                  ? "Try adjusting your search query"
                  : "No organizations have been created yet"
              }
            />
          ) : (
            <div className="rounded-md border">
              <DataTable
                data={filteredOrgs}
                columns={columns}
                onRowClick={handleOrgClick}
                defaultSortKey="created_at"
                defaultSortDirection="desc"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Org Detail Sheet */}
      <OrgDetailSheet
        org={selectedOrg}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onOrgUpdated={fetchOrgs}
      />
    </div>
  );
}
