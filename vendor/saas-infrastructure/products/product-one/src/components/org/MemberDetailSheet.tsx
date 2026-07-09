import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Crown, Mail, Calendar, UserX, Check } from "lucide-react";
import { format } from "date-fns";

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

interface MemberDetailSheetProps {
  member: Member | null;
  orgName: string;
  isOpen: boolean;
  onClose: () => void;
  onMemberUpdated: () => void;
  currentUserIsOwner: boolean;
}

export function MemberDetailSheet({
  member,
  orgName,
  isOpen,
  onClose,
  onMemberUpdated,
  currentUserIsOwner,
}: MemberDetailSheetProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [permissions, setPermissions] = useState({
    can_manage_billing: member?.can_manage_billing ?? false,
    can_manage_members: member?.can_manage_members ?? false,
    can_manage_content: member?.can_manage_content ?? false,
    can_view_analytics: member?.can_view_analytics ?? false,
  });

  // Update local state when member changes
  if (member && (
    permissions.can_manage_billing !== member.can_manage_billing ||
    permissions.can_manage_members !== member.can_manage_members ||
    permissions.can_manage_content !== member.can_manage_content ||
    permissions.can_view_analytics !== member.can_view_analytics
  )) {
    setPermissions({
      can_manage_billing: member.can_manage_billing,
      can_manage_members: member.can_manage_members,
      can_manage_content: member.can_manage_content,
      can_view_analytics: member.can_view_analytics,
    });
  }

  if (!member) return null;

  const handlePermissionChange = (key: keyof typeof permissions, value: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePermissions = async () => {
    setIsSaving(true);
    
    const { error } = await supabase
      .from("organization_members")
      .update(permissions)
      .eq("id", member.id);

    setIsSaving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to update permissions",
        description: error.message,
      });
    } else {
      setShowSaveSuccess(true);
      onMemberUpdated();
      setTimeout(() => {
        setShowSaveSuccess(false);
        onClose();
      }, 1200);
    }
  };

  const handleRemoveMember = async () => {
    setIsRemoving(true);
    
    // Removing from organization_members only removes their org access
    // - User account and profile remain intact
    // - Any content they created stays attributed to them
    // - Organization data (subscriptions, credits) is tied to org, not member
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", member.id);

    setIsRemoving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to remove member",
        description: error.message,
      });
    } else {
      onMemberUpdated();
      onClose();
    }
  };

  const hasChanges = 
    permissions.can_manage_billing !== member.can_manage_billing ||
    permissions.can_manage_members !== member.can_manage_members ||
    permissions.can_manage_content !== member.can_manage_content ||
    permissions.can_view_analytics !== member.can_view_analytics;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {member.display_name || "Unknown Member"}
            {member.is_owner && <Crown className="h-4 w-4 text-primary" />}
          </SheetTitle>
          <SheetDescription>
            View and manage member details
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Member Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span>{member.email || "Not available"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Joined:</span>
              <span>{format(new Date(member.created_at), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground ml-7">Role:</span>
              <Badge variant="secondary" className="capitalize">{member.role}</Badge>
            </div>
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Permissions</h4>
            
            {member.is_owner ? (
              <p className="text-sm text-muted-foreground">
                Organization owners have full access to all features.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="billing" className="flex flex-col gap-1">
                    <span>Manage Billing</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      View and manage subscriptions, payments
                    </span>
                  </Label>
                  <Switch
                    id="billing"
                    checked={permissions.can_manage_billing}
                    onCheckedChange={(v) => handlePermissionChange("can_manage_billing", v)}
                    disabled={!currentUserIsOwner}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="members" className="flex flex-col gap-1">
                    <span>Manage Members</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Invite and remove team members
                    </span>
                  </Label>
                  <Switch
                    id="members"
                    checked={permissions.can_manage_members}
                    onCheckedChange={(v) => handlePermissionChange("can_manage_members", v)}
                    disabled={!currentUserIsOwner}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="content" className="flex flex-col gap-1">
                    <span>Manage Content</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Create and edit organization content
                    </span>
                  </Label>
                  <Switch
                    id="content"
                    checked={permissions.can_manage_content}
                    onCheckedChange={(v) => handlePermissionChange("can_manage_content", v)}
                    disabled={!currentUserIsOwner}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="analytics" className="flex flex-col gap-1">
                    <span>View Analytics</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Access performance metrics and reports
                    </span>
                  </Label>
                  <Switch
                    id="analytics"
                    checked={permissions.can_view_analytics}
                    onCheckedChange={(v) => handlePermissionChange("can_view_analytics", v)}
                    disabled={!currentUserIsOwner}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone - only for non-owners */}
          {!member.is_owner && currentUserIsOwner && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <UserX className="h-4 w-4 mr-2" />
                      Remove from Organization
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove member?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove <strong>{member.display_name || member.email}</strong> from {orgName}. 
                        They will lose access to all organization resources.
                        <br /><br />
                        <span className="text-muted-foreground">
                          Note: Their user account will remain active. They can be re-invited later.
                        </span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRemoveMember}
                        disabled={isRemoving}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isRemoving ? "Removing..." : "Remove Member"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </div>

        {/* Save button for permission changes */}
        {!member.is_owner && currentUserIsOwner && hasChanges && (
          <SheetFooter className="mt-6">
            <Button 
              onClick={handleSavePermissions} 
              disabled={isSaving || showSaveSuccess} 
              className="w-full"
            >
              {showSaveSuccess ? (
                <span className="flex items-center gap-2 animate-fade-in">
                  <Check className="h-4 w-4" />
                  Saved
                </span>
              ) : isSaving ? (
                "Saving..."
              ) : (
                "Save Changes"
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
