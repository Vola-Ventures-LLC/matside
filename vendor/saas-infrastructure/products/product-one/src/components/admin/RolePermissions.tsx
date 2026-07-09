import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Shield, Lock, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RolePermission {
  id: string;
  role: string;
  permission_key: string;
  permission_name: string;
  description: string | null;
  is_enabled: boolean;
}

interface GroupedPermissions {
  [role: string]: RolePermission[];
}

const roleInfo: Record<string, { label: string; description: string; color: string }> = {
  admin: {
    label: "Admin",
    description: "Platform administrators with broad access",
    color: "default",
  },
  support: {
    label: "Support",
    description: "Customer support team members",
    color: "secondary",
  },
  content: {
    label: "Content",
    description: "Content creators and editors",
    color: "outline",
  },
  tester: {
    label: "Tester",
    description: "QA and testing team members",
    color: "destructive",
  },
};

export function RolePermissions() {
  const [permissions, setPermissions] = useState<GroupedPermissions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("role_permissions")
      .select("*")
      .order("role", { ascending: true })
      .order("permission_name", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to load permissions",
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    // Group permissions by role
    const grouped: GroupedPermissions = {};
    data?.forEach((perm) => {
      if (!grouped[perm.role]) {
        grouped[perm.role] = [];
      }
      grouped[perm.role].push(perm as RolePermission);
    });

    setPermissions(grouped);
    setIsLoading(false);
  };

  const handleTogglePermission = async (permission: RolePermission) => {
    setIsUpdating(permission.id);

    const { error } = await supabase
      .from("role_permissions")
      .update({ is_enabled: !permission.is_enabled })
      .eq("id", permission.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to update permission",
        description: error.message,
      });
      setIsUpdating(null);
      return;
    }

    // Update local state
    setPermissions((prev) => {
      const updated = { ...prev };
      updated[permission.role] = updated[permission.role].map((p) =>
        p.id === permission.id ? { ...p, is_enabled: !p.is_enabled } : p
      );
      return updated;
    });

    toast({
      title: "Permission updated",
      description: `${permission.permission_name} ${
        !permission.is_enabled ? "enabled" : "disabled"
      } for ${roleInfo[permission.role]?.label || permission.role}`,
    });

    setIsUpdating(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading role permissions..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Owner Notice */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Owner Role Permissions</CardTitle>
          </div>
          <CardDescription>
            The <strong>Owner</strong> role has unrestricted access to all features
            and cannot be modified. Only owners can manage role permissions.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Permissions by Role */}
      {Object.entries(permissions).map(([role, perms]) => {
        const info = roleInfo[role] || {
          label: role,
          description: "Custom role",
          color: "default",
        };

        return (
          <Card key={role}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {info.label}
                      <Badge variant={info.color as any}>{perms.length} permissions</Badge>
                    </CardTitle>
                    <CardDescription>{info.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {perms.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Switch
                          id={permission.id}
                          checked={permission.is_enabled}
                          onCheckedChange={() => handleTogglePermission(permission)}
                          disabled={isUpdating === permission.id}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={permission.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {permission.permission_name}
                          </Label>
                          {permission.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {permission.description && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{permission.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Badge variant={permission.is_enabled ? "default" : "secondary"}>
                          {permission.is_enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
