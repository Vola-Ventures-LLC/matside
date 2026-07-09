import { useState } from "react";
import { Shield, ShieldOff, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { use2FA } from "@saas-infra/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type SetupStep = "idle" | "enrolling" | "verifying";

interface SetupState {
  step: SetupStep;
  factorId: string;
  qrSvg: string;
  secret: string;
}

export function TwoFactorSettings() {
  const { isEnabled, loading, actionLoading, isRequired, enroll, verifyEnrollment, disable2FA } = use2FA();

  const [setup, setSetup] = useState<SetupState | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [secretCopied, setSecretCopied] = useState(false);

  const handleStartSetup = async () => {
    const enrollment = await enroll();
    if (enrollment) {
      setSetup({ step: "enrolling", ...enrollment });
      setSetupCode("");
    }
  };

  const handleVerifySetup = async () => {
    if (!setup) return;
    const success = await verifyEnrollment(setup.factorId, setupCode);
    if (success) {
      setSetup(null);
      setSetupCode("");
    }
  };

  const handleCancelSetup = () => {
    setSetup(null);
    setSetupCode("");
  };

  const handleDisable = async () => {
    const success = await disable2FA(disableCode);
    if (success) {
      setShowDisable(false);
      setDisableCode("");
    }
  };

  const copySecret = async () => {
    if (!setup?.secret) return;
    await navigator.clipboard.writeText(setup.secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
            </div>
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <CardDescription>
            Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isRequired && !isEnabled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is required for admin accounts. Please set it up to continue using admin features.
              </AlertDescription>
            </Alert>
          )}

          {isEnabled ? (
            <>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Authentication Method</div>
                  <div className="text-sm text-muted-foreground">Authenticator App (TOTP)</div>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDisable(true)}
                disabled={isRequired}
              >
                <ShieldOff className="h-4 w-4 mr-2" />
                Disable Two-Factor Authentication
              </Button>
              {isRequired && (
                <p className="text-xs text-muted-foreground text-center">
                  2FA cannot be disabled for admin accounts
                </p>
              )}
            </>
          ) : (
            <Button className="w-full" onClick={handleStartSetup} disabled={actionLoading}>
              {actionLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Set Up Two-Factor Authentication
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Setup Sheet */}
      <Sheet open={!!setup} onOpenChange={(open) => { if (!open) handleCancelSetup(); }}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Set Up Two-Factor Authentication</SheetTitle>
            <SheetDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit code to verify.
            </SheetDescription>
          </SheetHeader>
          {setup && (
            <div className="space-y-6 mt-6">
              <div className="flex justify-center">
                <div
                  className="border rounded-lg p-2 bg-white"
                  dangerouslySetInnerHTML={{ __html: setup.qrSvg }}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground text-center">
                  Can't scan? Enter this key manually:
                </p>
                <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm break-all">
                  <span className="flex-1">{setup.secret}</span>
                  <Button variant="ghost" size="sm" onClick={copySecret} className="flex-shrink-0">
                    {secretCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">Enter the 6-digit code from your app</p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={setupCode} onChange={setSetupCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </div>
          )}
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={handleCancelSetup}>Cancel</Button>
            <Button
              onClick={handleVerifySetup}
              disabled={setupCode.length !== 6 || actionLoading}
            >
              {actionLoading ? <LoadingSpinner size="sm" /> : "Enable 2FA"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Disable Sheet */}
      <Sheet open={showDisable} onOpenChange={setShowDisable}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Disable Two-Factor Authentication</SheetTitle>
            <SheetDescription>
              Enter your current verification code to confirm. This will make your account less secure.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={disableCode} onChange={setDisableCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDisable(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disableCode.length !== 6 || actionLoading}
            >
              {actionLoading ? <LoadingSpinner size="sm" /> : "Disable 2FA"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
