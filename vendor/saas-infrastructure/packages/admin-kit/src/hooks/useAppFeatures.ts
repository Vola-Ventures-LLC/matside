import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@saas-infra/auth/provider";

export interface AppFeatures {
  id: string;
  name: string;
  blog_enabled: boolean;
  referrals_enabled: boolean;
  sms_enabled: boolean;
  orgs_enabled: boolean;
}

export type FeatureKey = "blog_enabled" | "referrals_enabled" | "sms_enabled" | "orgs_enabled";

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  blog_enabled: "Blog",
  referrals_enabled: "Referrals",
  sms_enabled: "SMS",
  orgs_enabled: "Organizations",
};

export interface UseAppFeaturesOptions {
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}

export function useAppFeatures(options?: UseAppFeaturesOptions) {
  const supabase = useSupabase();
  const [features, setFeatures] = useState<AppFeatures | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("apps")
      .select("id, name, blog_enabled, referrals_enabled, sms_enabled, orgs_enabled")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching app features:", error);
    } else if (data) {
      setFeatures(data as AppFeatures);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const updateFeature = async (feature: FeatureKey, value: boolean) => {
    if (!features) return false;

    const { error } = await supabase
      .from("apps")
      .update({ [feature]: value })
      .eq("id", features.id);

    if (error) {
      options?.onError?.("Error updating feature", error.message);
      return false;
    }

    setFeatures({ ...features, [feature]: value });
    options?.onSuccess?.("Feature updated", `${FEATURE_LABELS[feature]} ${value ? "enabled" : "disabled"}`);
    return true;
  };

  return {
    features,
    loading,
    fetchFeatures,
    updateFeature,
    blogEnabled: features?.blog_enabled ?? true,
    referralsEnabled: features?.referrals_enabled ?? true,
    smsEnabled: features?.sms_enabled ?? false,
    orgsEnabled: features?.orgs_enabled ?? false,
  };
}
