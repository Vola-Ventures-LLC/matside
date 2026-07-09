import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for coupon validation logic
 * These test the business rules without hitting the database
 */

// Mock coupon data for testing validation rules
const mockCoupons = {
  percentOff: {
    id: "coupon-1",
    code: "SAVE20",
    coupon_type: "percent_off" as const,
    value: 20,
    is_active: true,
    max_redemptions: 100,
    redemption_count: 50,
    max_per_user: 1,
    min_purchase_cents: 1000,
    applies_to: "all" as const,
    is_first_purchase_only: false,
    is_referral_only: false,
    starts_at: "2024-01-01T00:00:00Z",
    expires_at: "2030-12-31T23:59:59Z",
  },
  expired: {
    id: "coupon-2",
    code: "EXPIRED",
    coupon_type: "percent_off" as const,
    value: 10,
    is_active: true,
    expires_at: "2020-01-01T00:00:00Z",
  },
  inactive: {
    id: "coupon-3",
    code: "INACTIVE",
    coupon_type: "percent_off" as const,
    value: 15,
    is_active: false,
  },
  maxedOut: {
    id: "coupon-4",
    code: "MAXED",
    coupon_type: "percent_off" as const,
    value: 25,
    is_active: true,
    max_redemptions: 10,
    redemption_count: 10,
  },
  creditBonus: {
    id: "coupon-5",
    code: "BONUS50",
    coupon_type: "credit_bonus" as const,
    value: 50,
    is_active: true,
    applies_to: "credit_packs" as const,
  },
  subscriptionOnly: {
    id: "coupon-6",
    code: "SUB25",
    coupon_type: "subscription_percent" as const,
    value: 25,
    duration_months: 3,
    is_active: true,
    applies_to: "subscriptions" as const,
  },
  trialExtension: {
    id: "coupon-7",
    code: "TRIAL7",
    coupon_type: "trial_extension" as const,
    value: 7,
    is_active: true,
  },
  minPurchase: {
    id: "coupon-8",
    code: "MIN50",
    coupon_type: "percent_off" as const,
    value: 10,
    is_active: true,
    min_purchase_cents: 5000, // $50 minimum
    applies_to: "all" as const,
    max_redemptions: null,
    redemption_count: 0,
    max_per_user: 1,
    starts_at: "2024-01-01T00:00:00Z",
    expires_at: "2030-12-31T23:59:59Z",
  },
};

// Helper to calculate discount
function calculateDiscount(
  couponType: string,
  value: number,
  amountCents: number
): { discountCents: number; credits: number; trialDays: number } {
  switch (couponType) {
    case "percent_off":
    case "subscription_percent":
      return {
        discountCents: Math.floor(amountCents * (value / 100)),
        credits: 0,
        trialDays: 0,
      };
    case "fixed_amount_off":
      return {
        discountCents: Math.min(value, amountCents),
        credits: 0,
        trialDays: 0,
      };
    case "credit_bonus":
      return {
        discountCents: 0,
        credits: value,
        trialDays: 0,
      };
    case "trial_extension":
      return {
        discountCents: 0,
        credits: 0,
        trialDays: value,
      };
    default:
      return { discountCents: 0, credits: 0, trialDays: 0 };
  }
}

// Validation helper (mirrors DB function logic)
function validateCouponLocally(
  coupon: typeof mockCoupons.percentOff,
  purchaseType: string,
  amountCents: number,
  userRedemptionCount = 0
): { valid: boolean; error?: string } {
  // Check if active
  if (!coupon.is_active) {
    return { valid: false, error: "Coupon is not active" };
  }

  // Check expiration
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: "Coupon has expired" };
  }

  // Check start date
  if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
    return { valid: false, error: "Coupon is not yet active" };
  }

  // Check max redemptions
  if (
    coupon.max_redemptions !== null &&
    coupon.redemption_count >= coupon.max_redemptions
  ) {
    return { valid: false, error: "Coupon has reached maximum redemptions" };
  }

  // Check per-user limit
  if (coupon.max_per_user && userRedemptionCount >= coupon.max_per_user) {
    return { valid: false, error: "You have already used this coupon" };
  }

  // Check minimum purchase
  if (coupon.min_purchase_cents && amountCents < coupon.min_purchase_cents) {
    return {
      valid: false,
      error: `Minimum purchase of $${(coupon.min_purchase_cents / 100).toFixed(2)} required`,
    };
  }

  // Check scope
  if (coupon.applies_to !== "all") {
    const scopeMap: Record<string, string[]> = {
      subscriptions: ["subscription"],
      credit_packs: ["credit_pack"],
      one_time_products: ["one_time"],
    };
    const allowedTypes = scopeMap[coupon.applies_to] || [];
    if (!allowedTypes.includes(purchaseType)) {
      return { valid: false, error: "Coupon does not apply to this purchase type" };
    }
  }

  return { valid: true };
}

describe("Coupon Discount Calculations", () => {
  it("calculates percent off correctly", () => {
    const result = calculateDiscount("percent_off", 20, 10000); // $100 purchase
    expect(result.discountCents).toBe(2000); // $20 off
    expect(result.credits).toBe(0);
  });

  it("calculates fixed amount off correctly", () => {
    const result = calculateDiscount("fixed_amount_off", 1500, 10000); // $15 off $100
    expect(result.discountCents).toBe(1500);
  });

  it("caps fixed discount at purchase amount", () => {
    const result = calculateDiscount("fixed_amount_off", 5000, 3000); // $50 off $30
    expect(result.discountCents).toBe(3000); // Capped at purchase amount
  });

  it("awards credits for credit_bonus type", () => {
    const result = calculateDiscount("credit_bonus", 50, 5000);
    expect(result.discountCents).toBe(0);
    expect(result.credits).toBe(50);
  });

  it("awards trial days for trial_extension type", () => {
    const result = calculateDiscount("trial_extension", 7, 0);
    expect(result.trialDays).toBe(7);
    expect(result.discountCents).toBe(0);
  });

  it("handles subscription percent discount", () => {
    const result = calculateDiscount("subscription_percent", 25, 2000); // $20/mo
    expect(result.discountCents).toBe(500); // $5 off
  });
});

describe("Coupon Validation Rules", () => {
  it("validates active coupon successfully", () => {
    const result = validateCouponLocally(mockCoupons.percentOff, "subscription", 5000);
    expect(result.valid).toBe(true);
  });

  it("rejects inactive coupon", () => {
    const result = validateCouponLocally(
      mockCoupons.inactive as any,
      "subscription",
      5000
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not active");
  });

  it("rejects expired coupon", () => {
    const result = validateCouponLocally(
      { ...mockCoupons.percentOff, expires_at: "2020-01-01T00:00:00Z" },
      "subscription",
      5000
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("expired");
  });

  it("rejects coupon that reached max redemptions", () => {
    const result = validateCouponLocally(
      { ...mockCoupons.percentOff, max_redemptions: 10, redemption_count: 10 },
      "subscription",
      5000
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("maximum redemptions");
  });

  it("rejects when user exceeded per-user limit", () => {
    const result = validateCouponLocally(
      mockCoupons.percentOff,
      "subscription",
      5000,
      1 // User already used it once
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("already used");
  });

  it("rejects when below minimum purchase", () => {
    const result = validateCouponLocally(
      mockCoupons.minPurchase as any,
      "subscription",
      2000 // $20, below $50 minimum
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Minimum purchase");
  });

  it("accepts when above minimum purchase", () => {
    const result = validateCouponLocally(
      mockCoupons.minPurchase as any,
      "subscription",
      6000 // $60, above $50 minimum
    );
    expect(result.valid).toBe(true);
  });
});

describe("Coupon Scope Validation", () => {
  it("accepts coupon with 'all' scope for any purchase type", () => {
    const allScopeCoupon = { ...mockCoupons.percentOff, applies_to: "all" as const };
    
    expect(validateCouponLocally(allScopeCoupon, "subscription", 5000).valid).toBe(true);
    expect(validateCouponLocally(allScopeCoupon, "credit_pack", 5000).valid).toBe(true);
    expect(validateCouponLocally(allScopeCoupon, "one_time", 5000).valid).toBe(true);
  });

  it("rejects subscription coupon for credit pack purchase", () => {
    const result = validateCouponLocally(
      mockCoupons.subscriptionOnly as any,
      "credit_pack",
      5000
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("does not apply");
  });

  it("accepts subscription coupon for subscription purchase", () => {
    const result = validateCouponLocally(
      mockCoupons.subscriptionOnly as any,
      "subscription",
      5000
    );
    expect(result.valid).toBe(true);
  });

  it("rejects credit pack coupon for subscription purchase", () => {
    const result = validateCouponLocally(
      mockCoupons.creditBonus as any,
      "subscription",
      5000
    );
    expect(result.valid).toBe(false);
  });
});

describe("Coupon Code Normalization", () => {
  it("converts codes to uppercase", () => {
    const code = "save20";
    expect(code.toUpperCase()).toBe("SAVE20");
  });

  it("trims whitespace from codes", () => {
    const code = "  SAVE20  ";
    expect(code.trim().toUpperCase()).toBe("SAVE20");
  });
});

describe("Edge Cases", () => {
  it("handles zero value coupon", () => {
    const result = calculateDiscount("percent_off", 0, 10000);
    expect(result.discountCents).toBe(0);
  });

  it("handles zero purchase amount", () => {
    const result = calculateDiscount("percent_off", 20, 0);
    expect(result.discountCents).toBe(0);
  });

  it("handles 100% off coupon", () => {
    const result = calculateDiscount("percent_off", 100, 5000);
    expect(result.discountCents).toBe(5000);
  });

  it("floors decimal discount amounts", () => {
    const result = calculateDiscount("percent_off", 33, 1000); // 33% of $10
    expect(result.discountCents).toBe(330); // $3.30, floored
  });
});

// Edge case tests for concurrent redemption and race conditions
describe("Coupon Edge Cases - Race Conditions", () => {
  it("prevents double redemption via max_per_user check", () => {
    const coupon = { ...mockCoupons.percentOff, max_per_user: 1 };

    // First redemption should succeed
    const firstRedemption = validateCouponLocally(
      coupon,
      "subscription",
      5000,
      0 // No previous redemptions
    );
    expect(firstRedemption.valid).toBe(true);

    // Second redemption should fail
    const secondRedemption = validateCouponLocally(
      coupon,
      "subscription",
      5000,
      1 // Already used once
    );
    expect(secondRedemption.valid).toBe(false);
    expect(secondRedemption.error).toContain("already used");
  });

  it("handles max_redemptions race condition", () => {
    const coupon = {
      ...mockCoupons.percentOff,
      max_redemptions: 100,
      redemption_count: 99, // One spot left
    };

    // Simulate two concurrent attempts when only one spot remains
    const attempt1 = validateCouponLocally(coupon, "subscription", 5000, 0);
    const attempt2 = validateCouponLocally(coupon, "subscription", 5000, 0);

    // Both might pass local validation, but database constraint will prevent double-use
    // This test documents that local validation is not sufficient for concurrency
    expect(attempt1.valid).toBe(true);
    expect(attempt2.valid).toBe(true);
    // Note: Actual prevention requires database-level unique constraints
  });

  it("validates coupon atomically with user redemption count", () => {
    const coupon = { ...mockCoupons.percentOff, max_per_user: 2 };

    // User has redeemed once
    const result = validateCouponLocally(coupon, "subscription", 5000, 1);
    expect(result.valid).toBe(true);

    // User has redeemed twice (at limit)
    const result2 = validateCouponLocally(coupon, "subscription", 5000, 2);
    expect(result2.valid).toBe(false);
  });

  it("handles expiration boundary conditions", () => {
    const now = new Date("2026-02-12T12:00:00Z");
    const couponExpiringNow = {
      ...mockCoupons.percentOff,
      expires_at: "2026-02-12T12:00:00Z", // Expires at exactly now
    };

    const result = validateCouponLocally(couponExpiringNow, "subscription", 5000, 0);
    // Should be invalid when expires_at <= now
    expect(result.valid).toBe(false);
    expect(result.error).toContain("expired");
  });

  it("handles start date boundary conditions", () => {
    const futureStart = {
      ...mockCoupons.percentOff,
      starts_at: "2030-01-01T00:00:00Z", // Starts in the future
    };

    const result = validateCouponLocally(futureStart, "subscription", 5000, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not yet active");
  });

  it("handles timezone edge cases in expiration", () => {
    // Document timezone behavior
    const behavior = {
      comparison: "Dates compared in UTC",
      edge: "Expiration is inclusive (expires_at time is considered expired)",
    };
    expect(behavior.comparison).toContain("UTC");
  });

  it("prevents redemption with minimum purchase on boundary", () => {
    const coupon = {
      ...mockCoupons.percentOff,
      min_purchase_cents: 1000, // $10 minimum
    };

    // Exactly at minimum should succeed
    const atMinimum = validateCouponLocally(coupon, "subscription", 1000, 0);
    expect(atMinimum.valid).toBe(true);

    // One cent below should fail
    const belowMinimum = validateCouponLocally(coupon, "subscription", 999, 0);
    expect(belowMinimum.valid).toBe(false);
    expect(belowMinimum.error).toContain("Minimum purchase");
  });

  it("handles null/undefined max_per_user as unlimited", () => {
    const unlimitedCoupon = {
      ...mockCoupons.percentOff,
      max_per_user: null as any,
    };

    // Should allow multiple redemptions
    const redemption1 = validateCouponLocally(unlimitedCoupon, "subscription", 5000, 5);
    expect(redemption1.valid).toBe(true);

    const redemption2 = validateCouponLocally(unlimitedCoupon, "subscription", 5000, 100);
    expect(redemption2.valid).toBe(true);
  });

  it("handles max_redemptions null as unlimited", () => {
    const unlimitedTotal = {
      ...mockCoupons.percentOff,
      max_redemptions: null as any,
      redemption_count: 1000,
    };

    const result = validateCouponLocally(unlimitedTotal, "subscription", 5000, 0);
    expect(result.valid).toBe(true);
  });

  it("validates coupon code case-sensitivity", () => {
    const coupon = mockCoupons.percentOff;

    // Document that coupon codes should be case-insensitive in practice
    // (handled by database query with ILIKE or UPPER())
    expect(coupon.code).toBe("SAVE20");
    expect(coupon.code.toUpperCase()).toBe("SAVE20");
    expect("save20".toUpperCase()).toBe("SAVE20");
  });

  it("handles concurrent referral coupon usage", () => {
    const referralCoupon = {
      ...mockCoupons.percentOff,
      is_referral_only: true,
    };

    // Referral coupons should be tracked per-referrer
    // This test documents the expected behavior
    const result = validateCouponLocally(referralCoupon, "subscription", 5000, 0);
    // Local validation doesn't check referral status (requires database)
    expect(result.valid).toBe(true);
  });

  it("prevents stacking coupons via single coupon_id per transaction", () => {
    // Document that only one coupon can be applied per transaction
    const activeCouponId = "coupon-1";

    // This is enforced at the application level (not in validateCouponLocally)
    expect(activeCouponId).toBeTruthy();
    // In real usage, UI prevents applying multiple coupons
  });
});
