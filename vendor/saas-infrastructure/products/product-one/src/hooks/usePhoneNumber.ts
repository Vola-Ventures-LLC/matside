import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface PhoneNumber {
  id: string;
  user_id: string;
  phone_number: string;
  country_code: string;
  is_verified: boolean;
  verified_at: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface SmsPreferences {
  id: string;
  user_id: string;
  two_factor_enabled: boolean;
  transactional_enabled: boolean;
  reminders_enabled: boolean;
  marketing_enabled: boolean;
}

export function usePhoneNumber() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [phones, setPhones] = useState<PhoneNumber[]>([]);
  const [preferences, setPreferences] = useState<SmsPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPhones = useCallback(async () => {
    if (!user) {
      setPhones([]);
      setPreferences(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [phonesResult, prefsResult] = await Promise.all([
        supabase
          .from("user_phone_numbers")
          .select("*")
          .eq("user_id", user.id)
          .order("is_primary", { ascending: false }),
        supabase
          .from("sms_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (phonesResult.error) {
        console.error("Error fetching phone numbers:", phonesResult.error);
      } else {
        setPhones(phonesResult.data as PhoneNumber[]);
      }

      if (prefsResult.error && prefsResult.error.code !== "PGRST116") {
        console.error("Error fetching SMS preferences:", prefsResult.error);
      } else if (prefsResult.data) {
        setPreferences(prefsResult.data as SmsPreferences);
      }
    } catch (err) {
      console.error("Phone fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPhones();
  }, [fetchPhones]);

  const primaryPhone = phones.find((p) => p.is_primary && p.is_verified) || null;
  const hasVerifiedPhone = phones.some((p) => p.is_verified);

  const startVerification = async (phoneNumber: string): Promise<boolean> => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: { action: "verify-phone", phoneNumber },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Verification code sent",
          description: "Check your phone for the 6-digit code",
        });
        await fetchPhones();
        return true;
      }

      throw new Error(data.error || "Failed to send verification code");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to send code",
        description: err instanceof Error ? err.message : "Could not send verification SMS",
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const confirmVerification = async (phoneNumber: string, code: string): Promise<boolean> => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: { action: "confirm-verification", phoneNumber, verificationCode: code },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Phone verified",
          description: "Your phone number has been verified successfully",
        });
        await fetchPhones();
        return true;
      }

      throw new Error(data.error || "Verification failed");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: err instanceof Error ? err.message : "Invalid or expired code",
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const deletePhone = async (phoneId: string): Promise<boolean> => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("user_phone_numbers")
        .delete()
        .eq("id", phoneId);

      if (error) throw error;

      toast({ title: "Phone removed", description: "Phone number has been deleted" });
      await fetchPhones();
      return true;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: err instanceof Error ? err.message : "Could not remove phone number",
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const updatePreferences = async (
    updates: Partial<Pick<SmsPreferences, "two_factor_enabled" | "transactional_enabled" | "reminders_enabled" | "marketing_enabled">>
  ): Promise<boolean> => {
    if (!user) return false;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("sms_preferences")
        .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });

      if (error) throw error;

      await fetchPhones();
      toast({ title: "Preferences updated" });
      return true;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not update preferences",
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    phones,
    preferences,
    primaryPhone,
    hasVerifiedPhone,
    loading,
    actionLoading,
    startVerification,
    confirmVerification,
    deletePhone,
    updatePreferences,
    refresh: fetchPhones,
  };
}
