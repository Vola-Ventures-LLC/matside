import { AdminManagement } from "@/components/admin/AdminManagement";
import { RolePermissions } from "@/components/admin/RolePermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown } from "lucide-react";

export default function AdminRoles() {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Roles</h1>
          <p className="text-muted-foreground">
            Manage owners and administrators
          </p>
        </div>
      </div>

      <Tabs defaultValue="admins" className="space-y-4">
        <TabsList>
          <TabsTrigger value="admins">Administrators</TabsTrigger>
          <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="admins" className="space-y-4">
          <AdminManagement />
        </TabsContent>
        <TabsContent value="permissions" className="space-y-4">
          <RolePermissions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
