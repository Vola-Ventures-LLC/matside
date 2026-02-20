import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../provider";

export interface TOTPEnrollment {
  factorId: string;
  qrSvg: string;
  secret: string;
}

export interface Use2FAOptions {
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}

export function use2FA(options?: Use2FAOptions) {
  const supabase = useSupabase();
  const [isEnabled, setIsEnabled] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const notify = {
    error: (title: string, description: string) => options?.onError?.(title, description),
    success: (title: string, description: string) => options?.onSuccess?.(title, description),
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const verified = data.totp.find((f) => f.status === "verified");
      setIsEnabled(!!verified);
      setFactorId(verified?.id ?? null);
    } catch (err) {
      console.error("2FA refresh error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enroll = async (): Promise<TOTPEnrollment | null> => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });
      if (error) throw error;
      return {
        factorId: data.id,
        qrSvg: data.totp.qr_code,
        secret: data.totp.secret,
      };
    } catch (err) {
      notify.error("Setup failed", err instanceof Error ? err.message : "Failed to start 2FA setup");
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  const verifyEnrollment = async (enrollFactorId: string, code: string): Promise<boolean> => {
    setActionLoading(true);
    try {
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: enrollFactorId });
      if (challengeErr) throw challengeErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: enrollFactorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyErr) throw verifyErr;
      await refresh();
      notify.success("2FA enabled", "Two-factor authentication is now active");
      return true;
    } catch (err) {
      notify.error("Verification failed", err instanceof Error ? err.message : "Invalid code");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const disable2FA = async (code: string): Promise<boolean> => {
    if (!factorId) {
      notify.error("Error", "No active 2FA factor found");
      return false;
    }
    setActionLoading(true);
    try {
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr) throw challengeErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyErr) throw verifyErr;
      const { error: unenrollErr } = await supabase.auth.mfa.unenroll({ factorId });
      if (unenrollErr) throw unenrollErr;
      await refresh();
      notify.success("2FA disabled", "Two-factor authentication has been disabled");
      return true;
    } catch (err) {
      notify.error("Failed", err instanceof Error ? err.message : "Could not disable 2FA");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    isEnabled,
    loading,
    actionLoading,
    isRequired: false,
    preferredMethod: "totp" as const,
    enroll,
    verifyEnrollment,
    disable2FA,
    refresh,
  };
}
