import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAppFeatures } from "@/hooks/useAppFeatures";
import { useOnboarding } from "@/hooks/useOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Camera, Check, Sparkles } from "lucide-react";
import { TwoFactorSettings } from "@/components/auth/TwoFactorSettings";
import { PhoneNumberSettings } from "@/components/settings/PhoneNumberSettings";
import { LocaleSettings } from "@/components/settings/LocaleSettings";
import { DataExportCard } from "@/components/settings/DataExportCard";
import { DeleteAccountCard } from "@/components/settings/DeleteAccountCard";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";

export default function Settings() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { smsEnabled } = useAppFeatures();
  const { isDismissed, isComplete, resumeConversation } = useOnboarding();
  const [isResumingOnboarding, setIsResumingOnboarding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Sync display name when profile loads
  useEffect(() => {
    if (profile?.display_name && !displayName) {
      setDisplayName(profile.display_name);
    }
  }, [profile?.display_name, displayName]);

  // Sync email when user loads
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user?.email, email]);

  // Auto-hide success states after animation
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => setUploadSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  const initials =
    profile?.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || user?.email?.[0].toUpperCase() || "U";

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    // Update profile display name
    const { error: profileError } = await updateProfile({ display_name: displayName });

    if (profileError) {
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: profileError.message,
      });
      setIsSaving(false);
      return;
    }

    // Update email if changed
    if (email && email !== user?.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email });

      if (emailError) {
        toast({
          variant: "destructive",
          title: "Failed to update email",
          description: emailError.message,
        });
        setIsSaving(false);
        return;
      }

      // Keep toast for email change since it requires user action
      toast({
        title: "Check your email",
        description: "Please confirm your new email address.",
      });
    }

    setIsSaving(false);
    setSaveSuccess(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file.",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await updateProfile({
        avatar_url: `${publicUrl}?t=${Date.now()}`,
      });

      if (updateError) throw updateError;

      await refreshProfile();
      setUploadSuccess(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to upload avatar",
        description: error.message,
      });
    }

    setIsUploading(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile and account settings
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your public profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
              >
                {isUploading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Profile Picture</p>
                {uploadSuccess && (
                  <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 animate-fade-in">
                    <Check className="h-3.5 w-3.5" />
                    Updated
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                JPG, PNG, or GIF. Max 5MB.
              </p>
            </div>
          </div>

          <Separator />

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {email !== user?.email && (
              <p className="text-xs text-muted-foreground">
                You'll need to verify your new email address after saving.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <LoadingSpinner size="sm" /> : "Save changes"}
            </Button>
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 animate-fade-in">
                <Check className="h-4 w-4" />
                Saved
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Preferences */}
      <NotificationPreferences />

      {/* Phone & SMS Settings - only show if SMS feature is enabled */}
      {smsEnabled && <PhoneNumberSettings />}

      {/* Regional Settings (Locale/Timezone) */}
      <LocaleSettings />

      {/* Two-Factor Authentication */}
      <TwoFactorSettings />

      {/* Data Export (GDPR) */}
      <DataExportCard />

      {/* Resume Setup Guide - only show if dismissed and not complete */}
      {isDismissed && !isComplete && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Setup Guide</CardTitle>
            </div>
            <CardDescription>
              Resume the guided setup to complete your account configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={async () => {
                setIsResumingOnboarding(true);
                await resumeConversation();
                setIsResumingOnboarding(false);
                window.location.href = "/";
              }}
              disabled={isResumingOnboarding}
            >
              {isResumingOnboarding ? <LoadingSpinner size="sm" /> : "Resume Setup Guide"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <DeleteAccountCard />
    </div>
  );
}
