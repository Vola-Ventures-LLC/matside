import { useState } from "react";
import { usePhoneNumber } from "@/hooks/usePhoneNumber";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Phone,
  Plus,
  CheckCircle2,
  XCircle,
  Trash2,
  MessageSquare,
  Bell,
  Shield,
} from "lucide-react";

export function PhoneNumberSettings() {
  const {
    phones,
    preferences,
    loading,
    actionLoading,
    startVerification,
    confirmVerification,
    deletePhone,
    updatePreferences,
  } = usePhoneNumber();

  const [isAdding, setIsAdding] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  const handleStartVerification = async () => {
    if (!newPhone.trim()) return;

    const success = await startVerification(newPhone);
    if (success) {
      setVerifyingPhone(newPhone);
      setIsAdding(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!verifyingPhone || verificationCode.length !== 6) return;

    const success = await confirmVerification(verifyingPhone, verificationCode);
    if (success) {
      setVerifyingPhone(null);
      setVerificationCode("");
      setNewPhone("");
    }
  };

  const handleResendCode = async () => {
    if (!verifyingPhone) return;
    await startVerification(verifyingPhone);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <LoadingSpinner text="Loading phone settings..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phone Numbers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Phone Numbers</CardTitle>
              <CardDescription>
                Add a phone number for SMS notifications and 2FA
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing phones */}
          {phones.map((phone) => (
            <div
              key={phone.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="font-mono">{phone.phone_number}</div>
                {phone.is_verified ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="mr-1 h-3 w-3" />
                    Unverified
                  </Badge>
                )}
                {phone.is_primary && (
                  <Badge variant="outline">Primary</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!phone.is_verified && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVerifyingPhone(phone.phone_number);
                      startVerification(phone.phone_number);
                    }}
                    disabled={actionLoading}
                  >
                    Verify
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePhone(phone.id)}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}

          {/* Verification flow */}
          {verifyingPhone && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
              <div>
                <p className="font-medium">Enter verification code</p>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to {verifyingPhone}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <InputOTP
                  value={verificationCode}
                  onChange={setVerificationCode}
                  maxLength={6}
                >
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
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleConfirmVerification}
                  disabled={verificationCode.length !== 6 || actionLoading}
                >
                  {actionLoading ? <LoadingSpinner size="sm" /> : "Verify"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={actionLoading}
                >
                  Resend code
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setVerifyingPhone(null);
                    setVerificationCode("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Add new phone */}
          {isAdding ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-phone">Phone Number</Label>
                <Input
                  id="new-phone"
                  placeholder="+1 (555) 123-4567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your phone number with country code
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleStartVerification}
                  disabled={!newPhone.trim() || actionLoading}
                >
                  {actionLoading ? <LoadingSpinner size="sm" /> : "Send code"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setNewPhone("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsAdding(true)}
              disabled={verifyingPhone !== null}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add phone number
            </Button>
          )}
        </CardContent>
      </Card>

      {/* SMS Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">SMS Preferences</CardTitle>
              <CardDescription>
                Control what SMS messages you receive
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Receive login verification codes via SMS
                </p>
              </div>
            </div>
            <Switch
              checked={preferences?.two_factor_enabled ?? false}
              onCheckedChange={(checked) =>
                updatePreferences({ two_factor_enabled: checked })
              }
              disabled={actionLoading || phones.filter((p) => p.is_verified).length === 0}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Transactional Messages</p>
                <p className="text-sm text-muted-foreground">
                  Order confirmations, account alerts
                </p>
              </div>
            </div>
            <Switch
              checked={preferences?.transactional_enabled ?? true}
              onCheckedChange={(checked) =>
                updatePreferences({ transactional_enabled: checked })
              }
              disabled={actionLoading}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Task Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Scheduled reminders and notifications
                </p>
              </div>
            </div>
            <Switch
              checked={preferences?.reminders_enabled ?? false}
              onCheckedChange={(checked) =>
                updatePreferences({ reminders_enabled: checked })
              }
              disabled={actionLoading}
            />
          </div>

          {phones.filter((p) => p.is_verified).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Add and verify a phone number to enable SMS preferences
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
