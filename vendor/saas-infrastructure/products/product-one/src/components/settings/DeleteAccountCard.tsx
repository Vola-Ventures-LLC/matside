import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDataExport, DataPreview } from "@/hooks/useDataExport";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle, Download } from "lucide-react";

export function DeleteAccountCard() {
  const { signOut, user } = useAuth();
  const { loadPreview, preview, isLoadingPreview, exportData } = useDataExport();
  const navigate = useNavigate();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<"preview" | "confirm">("preview");

  useEffect(() => {
    if (dialogOpen && !preview) {
      loadPreview();
    }
  }, [dialogOpen, loadPreview, preview]);

  const totalItems = preview ? (
    preview.organizations +
    preview.subscriptions +
    preview.support_conversations +
    preview.login_events +
    preview.content_items +
    preview.milestones
  ) : 0;

  const handleExportBeforeDelete = async () => {
    await exportData();
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") return;

    setIsDeleting(true);

    try {
      await signOut();

      toast({
        title: "Account deletion requested",
        description: "Please contact support to complete the account deletion process.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to process request",
        description: error.message,
      });
      setIsDeleting(false);
    }
  };

  const resetDialog = () => {
    setStep("preview");
    setConfirmText("");
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          Irreversible actions for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetDialog();
        }}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Your Account
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All your data will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {step === "preview" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm font-medium mb-3">Data that will be deleted:</p>
                  
                  {isLoadingPreview ? (
                    <div className="py-4 text-center">
                      <LoadingSpinner size="sm" text="Loading..." />
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Profile & Preferences</span>
                        <Badge variant="secondary">1 record</Badge>
                      </div>
                      {preview && preview.organizations > 0 && (
                        <div className="flex justify-between">
                          <span>Organization memberships</span>
                          <Badge variant="secondary">{preview.organizations}</Badge>
                        </div>
                      )}
                      {preview && preview.subscriptions > 0 && (
                        <div className="flex justify-between">
                          <span>Subscriptions</span>
                          <Badge variant="secondary">{preview.subscriptions}</Badge>
                        </div>
                      )}
                      {preview && preview.support_conversations > 0 && (
                        <div className="flex justify-between">
                          <span>Support conversations</span>
                          <Badge variant="secondary">{preview.support_conversations}</Badge>
                        </div>
                      )}
                      {preview && preview.content_items > 0 && (
                        <div className="flex justify-between">
                          <span>Content items</span>
                          <Badge variant="secondary">{preview.content_items}</Badge>
                        </div>
                      )}
                      {preview && preview.login_events > 0 && (
                        <div className="flex justify-between">
                          <span>Login history</span>
                          <Badge variant="secondary">{preview.login_events}</Badge>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Total records</span>
                        <Badge variant="destructive">{totalItems + 1}</Badge>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleExportBeforeDelete}
                >
                  <Download className="h-4 w-4" />
                  Download My Data First
                </Button>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="DELETE"
                    className="font-mono"
                  />
                </div>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              {step === "preview" ? (
                <Button
                  variant="destructive"
                  onClick={() => setStep("confirm")}
                >
                  Continue
                </Button>
              ) : (
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={confirmText !== "DELETE" || isDeleting}
                >
                  {isDeleting ? <LoadingSpinner size="sm" /> : "Delete My Account"}
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
