import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { UserSupportActivity } from "./UserSupportActivity";
import {
  User,
  Mail,
  Calendar,
  Clock,
  Ban,
  Trash2,
  Eye,
  Shield,
  AlertTriangle,
  MailX,
  RotateCcw,
  MessageSquare,
  Settings,
  ShieldOff,
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  last_login_at: string | null;
}

interface EmailPreferences {
  is_hard_bounced: boolean;
  last_bounce_reason: string | null;
  hard_bounced_at: string | null;
}

interface UserDetailSheetProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string | undefined;
  isOwner: boolean;
  onImpersonate: (user: UserProfile) => void;
  onUserUpdated: () => void;
}

type BanDuration = "1h" | "24h" | "7d" | "30d" | "permanent";

const banDurationLabels: Record<BanDuration, string> = {
  "1h": "1 hour",
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days",
  permanent: "Permanently",
};

export function UserDetailSheet({
  user,
  open,
  onOpenChange,
  currentUserId,
  isOwner,
  onImpersonate,
  onUserUpdated,
}: UserDetailSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [banDuration, setBanDuration] = useState<BanDuration>("24h");
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "ban" | "delete" | null;
    open: boolean;
  }>({ type: null, open: false });
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  const isSelf = user?.user_id === currentUserId;

  const fetchEmailPrefs = useCallback(async () => {
    if (!user) {
      setEmailPrefs(null);
      return;
    }

    const { data } = await supabase
      .from("email_preferences")
      .select("is_hard_bounced, last_bounce_reason, hard_bounced_at")
      .eq("user_id", user.user_id)
      .single();

    if (data) {
      setEmailPrefs(data);
    }
  }, [user]);

  // Fetch email preferences when user changes
  useEffect(() => {
    fetchEmailPrefs();
  }, [fetchEmailPrefs]);

  const handleAction = async (action: "ban" | "unban" | "delete") => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: {
          action,
          targetUserId: user.user_id,
          banDuration: action === "ban" ? banDuration : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message,
      });

      onUserUpdated();
      
      if (action === "delete") {
        onOpenChange(false);
      }
    } catch (err) {
      console.error(`${action} error:`, err);
      toast({
        variant: "destructive",
        title: `Failed to ${action} user`,
        description: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
      setConfirmDialog({ type: null, open: false });
    }
  };

  const handleReactivateEmail = async () => {
    if (!user) return;

    setIsReactivating(true);
    try {
      const { data: result, error } = await supabase.rpc("reactivate_email", {
        p_user_id: user.user_id,
        p_admin_id: currentUserId,
      });

      if (error) throw error;

      toast({
        title: "Email reactivated",
        description: `Email sending has been re-enabled for ${user.email}`,
      });

      setEmailPrefs({ is_hard_bounced: false, last_bounce_reason: null, hard_bounced_at: null });
      onUserUpdated();
    } catch (err) {
      console.error("Reactivate email error:", err);
      toast({
        variant: "destructive",
        title: "Failed to reactivate email",
        description: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setIsReactivating(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {user.display_name || "Unnamed User"}
            </SheetTitle>
            <SheetDescription>
              User details, support activity, and administrative actions
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="info" className="mt-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="info" className="gap-1.5">
                <User className="h-3.5 w-3.5" />
                Info
              </TabsTrigger>
              <TabsTrigger value="support" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Support
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                Actions
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="mt-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email || "No email"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-sm text-muted-foreground">
                      {user.last_login_at
                        ? format(new Date(user.last_login_at), "MMMM d, yyyy 'at' h:mm a")
                        : "Never logged in"}
                    </p>
                  </div>
                </div>

                {isSelf && (
                  <Badge variant="secondary" className="mt-2">
                    <Shield className="h-3 w-3 mr-1" />
                    This is your account
                  </Badge>
                )}
              </div>

              {/* Email Status - Show if bounced */}
              {emailPrefs?.is_hard_bounced && (
                <>
                  <Separator />
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <MailX className="h-5 w-5 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-destructive">Email Sending Halted</p>
                        <p className="text-sm text-muted-foreground">
                          Emails to this user have been paused due to bounces or complaints.
                          {emailPrefs.last_bounce_reason && (
                            <span className="block mt-1 text-xs">
                              Reason: {emailPrefs.last_bounce_reason}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleReactivateEmail}
                      disabled={isReactivating}
                    >
                      {isReactivating ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reactivate Email Sending
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="mt-4">
              <UserSupportActivity 
                userId={user.user_id} 
                onNavigateAway={() => onOpenChange(false)}
              />
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="mt-4 space-y-4">
              {/* View as User */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">View as User</p>
                    <p className="text-sm text-muted-foreground">
                      See the application exactly as this user would see it.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onImpersonate(user)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Start Viewing as User
                </Button>
              </div>

              {/* Ban User */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Ban className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Ban User</p>
                    <p className="text-sm text-muted-foreground">
                      Prevent this user from signing in.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={banDuration}
                    onValueChange={(v) => setBanDuration(v as BanDuration)}
                    disabled={isSelf}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(banDurationLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950"
                    disabled={isSelf || isLoading}
                    onClick={() => setConfirmDialog({ type: "ban", open: true })}
                  >
                    Ban
                  </Button>
                </div>
                {isSelf && (
                  <p className="text-xs text-muted-foreground">
                    You cannot ban yourself
                  </p>
                )}
              </div>

              {/* Reset 2FA */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldOff className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Reset Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Disable 2FA for this user if they've lost access to their device.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isSelf}
                  onClick={() => {
                    toast({
                      title: "Reset 2FA",
                      description: "To remove a user's 2FA factor, go to Supabase Dashboard → Authentication → Users, find the user, and delete their MFA factor.",
                    });
                  }}
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Reset 2FA
                </Button>
              </div>

              {/* Delete User - Owner only */}
              <div className="rounded-lg border border-destructive/30 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-destructive">Delete User</p>
                      <Badge variant="outline" className="text-xs">
                        Owner Only
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Permanently remove this user and all their data.
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={isSelf || !isOwner || isLoading}
                  onClick={() => setConfirmDialog({ type: "delete", open: true })}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User Permanently
                </Button>
                {!isOwner && (
                  <p className="text-xs text-muted-foreground">
                    Only owners can delete users
                  </p>
                )}
                {isSelf && (
                  <p className="text-xs text-muted-foreground">
                    You cannot delete yourself
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <LoadingSpinner size="lg" text="Processing..." />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Ban Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.type === "ban" && confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ type: "ban", open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Ban User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban <strong>{user.email}</strong> for{" "}
              <strong>{banDurationLabels[banDuration]}</strong>?
              <br /><br />
              They will be immediately logged out and unable to sign in until 
              the ban is lifted or expires.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction("ban")}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? "Banning..." : "Ban User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.type === "delete" && confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ type: "delete", open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete User Permanently
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong>{user.email}</strong>?
              <br /><br />
              This action <strong>cannot be undone</strong>. All user data will 
              be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction("delete")}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
