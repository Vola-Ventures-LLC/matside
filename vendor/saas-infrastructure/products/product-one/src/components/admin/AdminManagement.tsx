import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Crown, Shield, UserPlus, Trash2, Search, Users } from "lucide-react";

interface AdminUser {
  id: string;
  user_id: string;
  role: "admin" | "owner";
  created_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

export function AdminManagement() {
  const { user: currentUser, isOwner } = useAuth();
  const { logAction } = useAuditLog();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "owner">("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);

    // Fetch all admin/owner roles with profile data
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("*")
      .in("role", ["admin", "owner"])
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Failed to fetch admins" });
      setIsLoading(false);
      return;
    }

    // Fetch profiles for these users
    if (roles && roles.length > 0) {
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", userIds);

      const adminsWithProfiles: AdminUser[] = roles.map((role) => ({
        id: role.id,
        user_id: role.user_id,
        role: role.role as "admin" | "owner",
        created_at: role.created_at,
        profile: profiles?.find((p) => p.user_id === role.user_id),
      }));

      setAdmins(adminsWithProfiles);
    } else {
      setAdmins([]);
    }

    setIsLoading(false);
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) {
      toast({ variant: "destructive", title: "Email is required" });
      return;
    }

    setIsSubmitting(true);

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", newAdminEmail)
      .single();

    if (profileError || !profile) {
      toast({
        variant: "destructive",
        title: "User not found",
        description: "No user exists with that email address",
      });
      setIsSubmitting(false);
      return;
    }

    // Check if user already has this role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", profile.user_id)
      .eq("role", newAdminRole)
      .single();

    if (existingRole) {
      toast({
        variant: "destructive",
        title: "Role already exists",
        description: `User already has the ${newAdminRole} role`,
      });
      setIsSubmitting(false);
      return;
    }

    // Add the role
    const { error } = await supabase.from("user_roles").insert({
      user_id: profile.user_id,
      role: newAdminRole,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to add role",
        description: error.message,
      });
    } else {
      toast({ title: `${newAdminRole === "owner" ? "Owner" : "Admin"} added successfully` });
      await logAction({
        action: "VIEW_USERS",
        targetUserId: profile.user_id,
        details: { role_added: newAdminRole, email: newAdminEmail },
      });
      fetchAdmins();
      setDialogOpen(false);
      setNewAdminEmail("");
      setNewAdminRole("admin");
    }

    setIsSubmitting(false);
  };

  const handleRemoveAdmin = async () => {
    if (!selectedAdmin) return;

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", selectedAdmin.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to remove role",
        description: error.message,
      });
    } else {
      toast({ title: "Role removed successfully" });
      fetchAdmins();
    }

    setDeleteDialogOpen(false);
    setSelectedAdmin(null);
  };

  const filteredAdmins = admins.filter((admin) => {
    const query = searchQuery.toLowerCase();
    return (
      admin.profile?.display_name?.toLowerCase().includes(query) ||
      admin.profile?.email?.toLowerCase().includes(query)
    );
  });

  const getRoleBadge = (role: string) => {
    if (role === "owner") {
      return (
        <Badge className="bg-primary hover:bg-primary/90 gap-1">
          <Crown className="h-3 w-3" />
          Owner
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Shield className="h-3 w-3" />
        Admin
      </Badge>
    );
  };

  const columns: Column<AdminUser>[] = [
    {
      key: "user",
      header: "User",
      render: (admin) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {admin.profile?.display_name || "Unknown"}
            {admin.user_id === currentUser?.id && (
              <Badge variant="outline" className="text-xs">
                You
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {admin.profile?.email}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (admin) => getRoleBadge(admin.role),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-[100px]",
      sortable: false,
      render: (admin) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelectedAdmin(admin);
            setDeleteDialogOpen(true);
          }}
          disabled={admin.user_id === currentUser?.id}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  // Only owners can manage admins
  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Admin Management</CardTitle>
              <CardDescription>Manage super admin access</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Only owners can manage admin roles. Contact an owner to request changes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription>
              Manage owners and admins. Owners can manage users and finances.
            </CardDescription>
            <Button onClick={() => setDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Role Explanation */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="font-medium">Owners</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Full access including user management, finances, and admin management.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Admins</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Access to content management, blog, templates, and other features.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search admins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredAdmins.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No admins found"
              description={
                searchQuery
                  ? "Try adjusting your search"
                  : "Add your first admin to get started"
              }
            />
          ) : (
            <div className="rounded-md border">
              <DataTable
                data={filteredAdmins}
                columns={columns}
                defaultSortKey="role"
                defaultSortDirection="asc"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Admin Sheet */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Admin</SheetTitle>
            <SheetDescription>
              Grant admin or owner permissions to a user
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>User Email</Label>
              <Input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={newAdminRole}
                onValueChange={(v) => setNewAdminRole(v as "admin" | "owner")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="owner">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-primary" />
                      Owner
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Admin"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Remove Admin Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedAdmin?.profile?.email}'s{" "}
              {selectedAdmin?.role} role? They will lose access to admin features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAdmin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
