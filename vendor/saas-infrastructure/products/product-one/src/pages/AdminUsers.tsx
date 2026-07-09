import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
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

import { UserDetailSheet } from "@/components/admin/UserDetailSheet";
import { ExportButton } from "@/components/admin/ExportButton";
import { Search, Users } from "lucide-react";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  last_login_at: string | null;
}

export default function AdminUsers() {
  const { user: currentUser, isOwner, startImpersonating } = useAuth();
  const { logAction } = useAuditLog();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const logActionCallback = useCallback(() => {
    logAction({ action: "VIEW_USERS" });
  }, [logAction]);

  useEffect(() => {
    fetchUsers();
    logActionCallback();
  }, [logActionCallback]);

  const fetchUsers = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch users",
        description: error.message,
      });
    } else {
      setUsers(data || []);
    }

    setIsLoading(false);
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.display_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const handleUserClick = (user: UserProfile) => {
    setSelectedUser(user);
    setSheetOpen(true);
  };

  const handleImpersonate = (user: UserProfile) => {
    logAction({
      action: "IMPERSONATE_USER",
      targetUserId: user.user_id,
      details: { email: user.email },
    });

    startImpersonating({
      user_id: user.user_id,
      display_name: user.display_name,
      email: user.email,
    });

    setSheetOpen(false);
    navigate("/dashboard");

    toast({
      title: "Viewing as user",
      description: `Now viewing the app as ${user.display_name || user.email}`,
    });
  };

  const handleRefresh = () => {
    logAction({ action: "REFRESH_USER_LIST" });
    fetchUsers();
  };

  const columns: Column<UserProfile>[] = [
    {
      key: "display_name",
      header: "Name",
      render: (user) => (
        <div className="flex items-center gap-2">
          {user.display_name || "—"}
          {user.user_id === currentUser?.id && (
            <Badge variant="secondary" className="text-xs">
              You
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (user) => user.email || "—",
    },
    {
      key: "created_at",
      header: "Created",
      render: (user) => format(new Date(user.created_at), "MMM d, yyyy"),
    },
    {
      key: "last_login_at",
      header: "Last Login",
      render: (user) =>
        user.last_login_at
          ? format(new Date(user.last_login_at), "MMM d, yyyy")
          : "Never",
    },
  ];

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            View and manage all registered users
          </p>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {users.length} total users registered. Click on a user to view details and actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={handleRefresh}>
              Refresh
            </Button>
            <ExportButton
              data={filteredUsers.map(u => ({
                name: u.display_name || "",
                email: u.email || "",
                created_at: u.created_at,
                last_login_at: u.last_login_at || "",
              }))}
              filename="users"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Loading users..." />
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description={
                searchQuery
                  ? "Try adjusting your search query"
                  : "No users have registered yet"
              }
            />
          ) : (
            <div className="rounded-md border">
              <DataTable
                data={filteredUsers}
                columns={columns}
                onRowClick={handleUserClick}
                defaultSortKey="created_at"
                defaultSortDirection="desc"
                emptyMessage="No users found"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Sheet */}
      <UserDetailSheet
        user={selectedUser}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currentUserId={currentUser?.id}
        isOwner={isOwner}
        onImpersonate={handleImpersonate}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
}
