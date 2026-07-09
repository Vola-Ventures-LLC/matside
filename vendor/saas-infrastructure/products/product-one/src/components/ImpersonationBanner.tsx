import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Button } from "@/components/ui/button";
import { X, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function ImpersonationBanner() {
  const { impersonatedUser, stopImpersonating } = useAuth();
  const { logAction } = useAuditLog();

  if (!impersonatedUser) return null;

  const handleStopImpersonating = () => {
    // Log the end of impersonation
    logAction({
      action: "END_IMPERSONATION",
      targetUserId: impersonatedUser.user_id,
      details: { email: impersonatedUser.email },
    });

    stopImpersonating();

    toast({
      title: "Stopped viewing as user",
      description: "You are now viewing the app as yourself.",
    });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning text-warning-foreground px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium">
            Viewing as: {impersonatedUser.display_name || impersonatedUser.email}
          </span>
          <span className="opacity-80 text-sm">
            ({impersonatedUser.email})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStopImpersonating}
          className="text-warning-foreground hover:bg-warning-foreground/10 gap-1"
        >
          <X className="h-4 w-4" />
          Stop Viewing
        </Button>
      </div>
    </div>
  );
}
