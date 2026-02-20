# @saas-infra/billing

Subscription billing components and hooks for Stripe integration with Supabase.

## Features

- **Subscription Plans** — Display and manage subscription tiers
- **Stripe Setup** — Configuration guidance for Stripe Connect
- **Coupons** — Full coupon lifecycle (create, validate, redeem, expire)
- **Usage Tracking** — Track metered usage for usage-based billing
- **Dependency Injection** — Uses `useSupabase()` from @saas-infra/auth

## Installation

```bash
pnpm add @saas-infra/billing @saas-infra/auth
```

## Setup

This package requires `@saas-infra/auth` for Supabase client injection:

```tsx
import { SupabaseProvider, AuthProvider } from "@saas-infra/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  return (
    <SupabaseProvider value={supabase}>
      <AuthProvider>
        {/* Your app */}
      </AuthProvider>
    </SupabaseProvider>
  );
}
```

## Usage

### Subscription Plans Component

Display subscription tiers with upgrade/downgrade capabilities:

```tsx
import { SubscriptionPlans } from "@saas-infra/billing";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";

function PricingPage() {
  return (
    <SubscriptionPlans
      emptyState={<EmptyState title="No plans available" />}
      loadingSpinner={<LoadingSpinner />}
      onError={(title, desc) => toast.error(title, { description: desc })}
      onSuccess={(title, desc) => toast.success(title, { description: desc })}
    />
  );
}
```

**Props:**
- `emptyState?: ReactNode` — Shown when no plans exist
- `loadingSpinner?: ReactNode` — Loading indicator
- `onError?: (title, description) => void` — Error notification callback
- `onSuccess?: (title, description) => void` — Success notification callback

### Stripe Setup Banner

Guide admins through Stripe configuration:

```tsx
import { StripeSetupBanner } from "@saas-infra/billing";

function AdminDashboard() {
  return (
    <div>
      <StripeSetupBanner />
      {/* Rest of admin UI */}
    </div>
  );
}
```

The banner automatically checks if Stripe is configured and shows step-by-step setup instructions if not.

### Coupon Management Hook

```tsx
import { useCoupons } from "@saas-infra/billing";
import { toast } from "sonner";

function CouponManager() {
  const {
    coupons,
    isLoading,
    createCoupon,
    validateCoupon,
    redeemCoupon,
    expireCoupon,
  } = useCoupons({
    onSuccess: (title, desc) => toast.success(title, { description: desc }),
    onError: (title, desc) => toast.error(title, { description: desc }),
  });

  const handleCreate = async () => {
    await createCoupon({
      code: "SUMMER2024",
      discount_percent: 20,
      max_uses: 100,
      valid_until: "2024-09-01",
    });
  };

  const handleValidate = async (code: string) => {
    const isValid = await validateCoupon(code);
    console.log("Valid:", isValid);
  };

  const handleRedeem = async (code: string) => {
    const success = await redeemCoupon(code);
    if (success) {
      console.log("Coupon applied!");
    }
  };

  return (
    <div>
      <h2>Coupons</h2>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {coupons.map(coupon => (
            <li key={coupon.id}>
              {coupon.code} - {coupon.discount_percent}% off
              <button onClick={() => expireCoupon(coupon.id)}>
                Expire
              </button>
            </li>
          ))}
        </ul>
      )}

      <button onClick={handleCreate}>Create Coupon</button>
    </div>
  );
}
```

## API Reference

### `<SubscriptionPlans />`

Component that displays subscription tiers and handles plan changes.

**Props:**
```tsx
interface SubscriptionPlansProps {
  emptyState?: ReactNode;
  loadingSpinner?: ReactNode;
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}
```

**Features:**
- Displays all active subscription plans
- Shows current user's plan with badge
- Upgrade/downgrade buttons
- Free tier support
- Trial period display
- Feature comparison
- Auto-refreshes after plan changes

### `<StripeSetupBanner />`

Component that guides admins through Stripe Connect setup.

Shows a dismissible banner with:
1. Create Stripe account instructions
2. Configure webhook endpoints
3. Add API keys to secrets
4. Test webhook delivery

Auto-hides when Stripe is configured.

### `useCoupons(options?)`

Hook for managing discount coupons.

**Options:**
```tsx
interface UseCouponsOptions {
  onSuccess?: (title: string, description: string) => void;
  onError?: (title: string, description: string) => void;
}
```

**Returns:**
```tsx
{
  coupons: Coupon[];
  isLoading: boolean;
  createCoupon: (data: CreateCouponData) => Promise<void>;
  validateCoupon: (code: string) => Promise<boolean>;
  redeemCoupon: (code: string) => Promise<boolean>;
  expireCoupon: (id: string) => Promise<void>;
}
```

**Coupon Data:**
```tsx
interface CreateCouponData {
  code: string;
  discount_percent?: number;
  discount_amount?: number;
  max_uses?: number;
  valid_until?: string; // ISO date
  scope?: "all" | "specific_plans";
  applicable_plan_ids?: string[];
}
```

## Database Schema

Required tables (see `templates/schemas/02_billing.sql`):

- `apps` — App configuration with Stripe settings
- `app_stripe_configs` — Stripe API keys and webhook secrets
- `subscription_plans` — Plan tiers and pricing
- `user_subscriptions` — User subscription records
- `coupons` — Discount coupon definitions
- `coupon_redemptions` — Coupon usage tracking
- `usage_records` — Metered usage data

## Stripe Integration

### Edge Functions

The billing system expects these Supabase edge functions:

- `stripe-webhook` — Handle Stripe webhook events (subscription changes, payment success/failure)

### Environment Variables

Required in Supabase:
- `STRIPE_SECRET_KEY` — Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` — Webhook signing secret

## TypeScript

All exports are fully typed:

```tsx
import type { Coupon, SubscriptionPlan } from "@saas-infra/billing";
```

## Examples

### Full Pricing Page

```tsx
import { SubscriptionPlans } from "@saas-infra/billing";
import { useAuth } from "@saas-infra/auth";
import { toast } from "sonner";

function PricingPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-2">
        Choose Your Plan
      </h1>
      <p className="text-center text-muted-foreground mb-12">
        Upgrade or downgrade at any time
      </p>

      <SubscriptionPlans
        onError={(title, desc) => toast.error(title, { description: desc })}
        onSuccess={(title, desc) => toast.success(title, { description: desc })}
      />

      {!user && (
        <p className="text-center mt-8 text-sm text-muted-foreground">
          Sign in to manage your subscription
        </p>
      )}
    </div>
  );
}
```

### Coupon Input Field

```tsx
import { useCoupons } from "@saas-infra/billing";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function CouponInput() {
  const { validateCoupon, redeemCoupon } = useCoupons();
  const [code, setCode] = useState("");
  const [isValid, setIsValid] = useState(false);

  const handleCheck = async () => {
    const valid = await validateCoupon(code);
    setIsValid(valid);
  };

  const handleApply = async () => {
    const success = await redeemCoupon(code);
    if (success) {
      setCode("");
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter coupon code"
      />
      <Button onClick={handleCheck}>Check</Button>
      {isValid && (
        <Button onClick={handleApply}>Apply</Button>
      )}
    </div>
  );
}
```
