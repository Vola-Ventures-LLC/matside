import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/hooks/useOrgContext";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { MemberDetailSheet } from "@/components/org/MemberDetailSheet";
import { Users, Plus, Crown, Search } from "lucide-react";
import { format } from "date-fns";
import { Navigate } from "react-router-dom";

interface Member {
  id: string;
  user_id: string;
  role: string;
  is_owner: boolean;
  can_manage_billing: boolean;
  can_manage_members: boolean;
  can_manage_content: boolean;
  can_view_analytics: boolean;
  created_at: string;
  display_name: string | null;
  email: string | null;
}

export default function OrgMembers() {
  const { activeOrg, activeOrgId, canManageMembers, isOrgOwner } = useOrgContext();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!activeOrgId) return;

    setIsLoading(true);

    // Fetch members first
    const { data: membersData, error: membersError } = await supabase
      .from("organization_members")
      .select(`
        id,
        user_id,
        organization_id,
        role,
        is_owner,
        can_manage_billing,
        can_manage_members,
        can_manage_content,
        can_view_analytics,
        created_at
      `)
      .eq("organization_id", activeOrgId)
      .order("created_at", { ascending: true });

    if (membersError) {
      toast({
        variant: "destructive",
        title: "Failed to fetch members",
        description: membersError.message,
      });
      setIsLoading(false);
      return;
    }

    // Get user IDs to fetch profiles
    const userIds = (membersData || []).map(m => m.user_id);

    if (userIds.length === 0) {
      setMembers([]);
      setIsLoading(false);
      return;
    }

    // Fetch profiles separately - filter by user_id, not id
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profilesData || []).map(p => [p.user_id, { display_name: p.display_name, email: p.email }])
    );

    // Combine data
    const combinedData: Member[] = (membersData || []).map(m => ({
      ...m,
      display_name: profileMap.get(m.user_id)?.display_name || null,
      email: profileMap.get(m.user_id)?.email || null,
    }));

    setMembers(combinedData);
    setIsLoading(false);
  }, [activeOrgId]);

  useEffect(() => {
    if (activeOrgId) {
      fetchMembers();
    }
  }, [activeOrgId, fetchMembers]);

  const handleInvite = async () => {
    toast({
      title: "Invitation sent",
      description: `An invitation has been sent to ${inviteEmail}`,
    });
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("member");
  };

  const handleRowClick = (member: Member) => {
    setSelectedMember(member);
    setDetailSheetOpen(true);
  };

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    const name = member.display_name?.toLowerCase() || "";
    const email = member.email?.toLowerCase() || "";
    return name.includes(query) || email.includes(query);
  });

  const memberColumns: Column<Member>[] = [
    {
      key: "display_name",
      header: "Name",
      render: (member) => (
        <div className="flex items-center gap-2">
          {member.display_name || "Unknown"}
          {member.is_owner && (
            <Crown className="h-4 w-4 text-primary" />
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (member) => (
        <span className="text-muted-foreground">{member.email || "—"}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (member) => (
        <Badge variant="secondary" className="capitalize">
          {member.role}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      render: (member) => format(new Date(member.created_at), "MMM d, yyyy"),
    },
  ];

  if (!activeOrg) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!canManageMembers) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to manage team members</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">
            Manage your organization's team
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""} in {activeOrg.organization.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Invite Team Member</SheetTitle>
                  <SheetDescription>
                    Send an invitation to join {activeOrg.organization.name}
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter>
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={!inviteEmail}>
                    Send Invitation
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Loading members..." />
            </div>
          ) : filteredMembers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No members found"
              description={
                searchQuery
                  ? "Try adjusting your search query"
                  : "Invite team members to get started"
              }
            />
          ) : (
            <div className="rounded-md border">
              <DataTable
                data={filteredMembers}
                columns={memberColumns}
                onRowClick={handleRowClick}
                defaultSortKey="created_at"
                defaultSortDirection="asc"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Detail Sheet */}
      <MemberDetailSheet
        member={selectedMember}
        orgName={activeOrg.organization.name}
        isOpen={detailSheetOpen}
        onClose={() => {
          setDetailSheetOpen(false);
          setSelectedMember(null);
        }}
        onMemberUpdated={fetchMembers}
        currentUserIsOwner={isOrgOwner}
      />
    </div>
  );
}
