import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@saas-infra/auth/provider";

export type CouponType =
  | "credit_bonus"
  | "subscription_percent"
  | "fixed_amount_off"
  | "percent_off"
  | "trial_extension"
  | "free_upgrade";

export type CouponScope = "all" | "subscriptions" | "credit_packs" | "one_time_products";

export interface Coupon {
  id: string;
  app_id: string;
  code: string;
  name: string;
  description: string | null;
  coupon_type: CouponType;
  value: number;
  duration_months: number | null;
  upgrade_to_plan_id: string | null;
  applies_to: CouponScope;
  specific_product_ids: string[];
  min_purchase_cents: number;
  max_redemptions: number | null;
  max_per_user: number;
  redemption_count: number;
  is_first_purchase_only: boolean;
  is_stackable: boolean;
  is_referral_only: boolean;
  referrer_reward_type: CouponType | null;
  referrer_reward_value: number | null;
  referee_reward_type: CouponType | null;
  referee_reward_value: number | null;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  user_id: string | null;
  organization_id: string | null;
  referral_id: string | null;
  purchase_type: string;
  purchase_id: string;
  original_amount_cents: number;
  discount_amount_cents: number;
  credits_awarded: number;
  trial_days_added: number;
  referrer_credits_awarded: number;
  referrer_discount_applied: boolean;
  stripe_promotion_code_id: string | null;
  created_at: string;
  coupon?: Coupon;
}

export interface CouponFormData {
  code: string;
  name: string;
  description?: string;
  coupon_type: CouponType;
  value: number;
  duration_months?: number;
  applies_to: CouponScope;
  min_purchase_cents?: number;
  max_redemptions?: number;
  max_per_user?: number;
  is_first_purchase_only?: boolean;
  is_stackable?: boolean;
  is_referral_only?: boolean;
  referrer_reward_type?: CouponType;
  referrer_reward_value?: number;
  referee_reward_type?: CouponType;
  referee_reward_value?: number;
  starts_at?: string;
  expires_at?: string;
  is_active?: boolean;
}

export interface UseCouponsOptions {
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description?: string) => void;
}

export function useCoupons(options?: UseCouponsOptions) {
  const supabase = useSupabase();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redemptions, setRedemptions] = useState<CouponRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [appId, setAppId] = useState<string | null>(null);

  const fetchAppId = useCallback(async () => {
    const { data } = await supabase.from("apps").select("id").limit(1).single();
    if (data) setAppId(data.id);
    return data?.id;
  }, [supabase]);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      options?.onError?.("Failed to load coupons", error.message);
    } else {
      setCoupons((data as Coupon[]) || []);
    }
    setLoading(false);
  }, [supabase, options]);

  const fetchRedemptions = useCallback(async (couponId?: string) => {
    let query = supabase
      .from("coupon_redemptions")
      .select("*, coupon:coupons(*)")
      .order("created_at", { ascending: false });

    if (couponId) {
      query = query.eq("coupon_id", couponId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to fetch redemptions:", error);
    } else {
      setRedemptions((data as CouponRedemption[]) || []);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAppId().then(() => fetchCoupons());
  }, [fetchAppId, fetchCoupons]);

  const createCoupon = async (formData: CouponFormData) => {
    let currentAppId = appId;
    if (!currentAppId) {
      currentAppId = (await fetchAppId()) ?? null;
    }
    if (!currentAppId) {
      options?.onError?.("No app configured", "Create an app first");
      return null;
    }

    const { data, error } = await supabase
      .from("coupons")
      .insert({
        app_id: currentAppId,
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        coupon_type: formData.coupon_type,
        value: formData.value,
        duration_months: formData.duration_months || null,
        applies_to: formData.applies_to,
        min_purchase_cents: formData.min_purchase_cents || 0,
        max_redemptions: formData.max_redemptions || null,
        max_per_user: formData.max_per_user || 1,
        is_first_purchase_only: formData.is_first_purchase_only || false,
        is_stackable: formData.is_stackable || false,
        is_referral_only: formData.is_referral_only || false,
        referrer_reward_type: formData.referrer_reward_type || null,
        referrer_reward_value: formData.referrer_reward_value || null,
        referee_reward_type: formData.referee_reward_type || null,
        referee_reward_value: formData.referee_reward_value || null,
        starts_at: formData.starts_at || new Date().toISOString(),
        expires_at: formData.expires_at || null,
        is_active: formData.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      options?.onError?.("Failed to create coupon", error.message);
      return null;
    }

    options?.onSuccess?.("Coupon created", `Code: ${formData.code.toUpperCase()}`);
    await fetchCoupons();
    return data as Coupon;
  };

  const updateCoupon = async (id: string, updates: Partial<CouponFormData>) => {
    const { error } = await supabase
      .from("coupons")
      .update({
        ...updates,
        code: updates.code?.toUpperCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      options?.onError?.("Failed to update coupon", error.message);
      return false;
    }

    options?.onSuccess?.("Coupon updated");
    await fetchCoupons();
    return true;
  };

  const toggleCouponActive = async (id: string, isActive: boolean) => {
    return updateCoupon(id, { is_active: isActive });
  };

  const deleteCoupon = async (id: string) => {
    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) {
      options?.onError?.("Failed to delete coupon", error.message);
      return false;
    }

    options?.onSuccess?.("Coupon deleted");
    await fetchCoupons();
    return true;
  };

  const validateCoupon = async (
    code: string,
    userId: string,
    purchaseType: string,
    purchaseId: string,
    amountCents: number
  ) => {
    const { data, error } = await supabase.rpc("validate_coupon", {
      p_code: code,
      p_user_id: userId,
      p_purchase_type: purchaseType,
      p_purchase_id: purchaseId,
      p_amount_cents: amountCents,
    });

    if (error) {
      return { valid: false, error: error.message };
    }

    return data as {
      valid: boolean;
      error?: string;
      coupon_id?: string;
      coupon_type?: CouponType;
      discount_cents?: number;
      credits_awarded?: number;
      trial_days_added?: number;
      duration_months?: number;
      referrer_reward_type?: CouponType;
      referrer_reward_value?: number;
    };
  };

  return {
    coupons,
    redemptions,
    loading,
    fetchCoupons,
    fetchRedemptions,
    createCoupon,
    updateCoupon,
    toggleCouponActive,
    deleteCoupon,
    validateCoupon,
  };
}
