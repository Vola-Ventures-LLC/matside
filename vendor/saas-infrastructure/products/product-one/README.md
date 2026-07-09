# Product One - Demo SaaS Application

A full-featured SaaS application demonstrating all `@saas-infra` packages in action.

## Features

This demo app showcases:

- ✅ **Authentication** — Sign up, sign in, 2FA, Google OAuth, password reset
- ✅ **User Roles** — Admin, owner, user, tester roles with permissions
- ✅ **Billing** — Subscription plans, Stripe integration, coupon system
- ✅ **Support** — AI chat support, ticketing, sentiment analysis
- ✅ **Blog** — Blog posts with categories, tags, SEO
- ✅ **Content Planner** — Multi-platform content planning
- ✅ **Organizations** — Multi-tenancy with org memberships
- ✅ **Admin Panel** — Full admin dashboard with audit logs, feature toggles
- ✅ **Email System** — Template management, branding, deliverability tracking
- ✅ **Guides** — Documentation system with role-based visibility
- ✅ **Onboarding** — Interactive onboarding flows
- ✅ **Notifications** — In-app, email, SMS, webhook notifications
- ✅ **Referrals** — Affiliate system with commission tracking
- ✅ **Rate Limiting** — Per-feature rate limits with alerts

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9.15.4+
- Supabase account (or local Supabase)

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Set Up Supabase

Create a Supabase project and get your credentials:

```bash
# Copy environment template
cp products/product-one/.env.example products/product-one/.env

# Edit .env and add your Supabase credentials
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Migrations

```bash
# Link to your Supabase project
npx supabase link --project-ref your-project-id

# Push migrations (creates all tables, RLS policies, functions)
npx supabase db push
```

### 4. Seed Sample Data (Optional)

```bash
# Run the seed script to populate demo data
node products/product-one/scripts/seed-demo-data.js
```

This creates:
- 3 demo user accounts (admin, user, tester)
- Sample blog posts and categories
- Example support conversations
- Content items in the planner
- Sample subscription plans
- Message templates
- Feature flags configuration

### 5. Start Development Server

```bash
# From monorepo root
pnpm dev:product-one

# Or from product-one directory
cd products/product-one
pnpm dev
```

Visit http://localhost:5173

## Demo Accounts

After seeding, log in with these accounts:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| admin@example.com | demo1234 | Admin | Full admin access |
| user@example.com | demo1234 | User | Standard user account |
| tester@example.com | demo1234 | Tester | Beta features enabled |

## Project Structure

```
products/product-one/
├── src/
│   ├── components/      # UI components
│   │   ├── admin/       # Admin-only components
│   │   ├── blog/        # Blog components
│   │   ├── content/     # Content planner
│   │   ├── settings/    # User settings
│   │   ├── support/     # Support system
│   │   └── ui/          # Re-exports from @saas-infra/ui
│   ├── hooks/           # Re-exports from @saas-infra packages
│   ├── pages/           # Route components (64 pages)
│   ├── integrations/    # Supabase client
│   ├── lib/             # Re-exports from @saas-infra/utils
│   └── App.tsx          # Main app with routing
├── supabase/            # Shared across monorepo
│   ├── functions/       # Edge functions (16 total)
│   └── migrations/      # Database migrations (87 files)
├── scripts/
│   └── seed-demo-data.js  # Sample data seeder
└── public/              # Static assets
```

## Exploring the Features

### As Admin

1. **Dashboard** — View analytics, user metrics, system health
2. **User Management** — CRUD users, assign roles, impersonate
3. **Content Management** — Manage blog posts, guides, changelog
4. **Email System** — Configure templates, branding, domains
5. **Billing** — Create subscription plans, manage coupons
6. **Feature Toggles** — Enable/disable features app-wide
7. **Audit Trail** — View all admin actions
8. **Support** — Manage tickets, view satisfaction metrics

### As User

1. **Profile Settings** — Update profile, change password, enable 2FA
2. **Billing** — Upgrade/downgrade subscription, apply coupons
3. **Support Chat** — Get AI-powered support
4. **Blog** — Read blog posts, search, filter by category
5. **Guides** — Browse help documentation
6. **Notifications** — Manage notification preferences
7. **Referrals** — Share referral link, track commissions (if enabled)
8. **Organizations** — Create/join organizations (if enabled)

## Package Usage Examples

This app demonstrates all `@saas-infra` packages:

### @saas-infra/auth

```tsx
// App.tsx - Wrapping with providers
<SupabaseProvider value={supabase}>
  <AuthProvider>
    <RoleContextProvider>
      <Routes>
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </RoleContextProvider>
  </AuthProvider>
</SupabaseProvider>
```

### @saas-infra/billing

```tsx
// PricingPage.tsx
import { SubscriptionPlans } from "@saas-infra/billing";

<SubscriptionPlans
  onSuccess={(t, d) => toast.success(t, { description: d })}
  onError={(t, d) => toast.error(t, { description: d })}
/>
```

### @saas-infra/support

```tsx
// SupportPage.tsx
import { useSupportChat } from "@saas-infra/support";

const { messages, startConversation, sendMessage } = useSupportChat();
```

### @saas-infra/content

```tsx
// BlogPage.tsx
import { useBlogPosts } from "@saas-infra/content";

const { posts, isLoading } = useBlogPosts();
```

### @saas-infra/emails

```tsx
// AdminEmailPage.tsx
import { EmailHealth, MessageTemplates } from "@saas-infra/emails";

<EmailHealth webhookUrl={webhookUrl} />
<MessageTemplates renderEditor={MyEditor} />
```

## Development

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test
```

### Lint

```bash
pnpm lint
```

### Type Check

```bash
tsc --noEmit
```

## Environment Variables

Required variables in `.env`:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Analytics, Error Tracking, etc.
# VITE_SENTRY_DSN=...
# VITE_GOOGLE_ANALYTICS_ID=...
```

## Edge Functions

This app uses 16 Supabase edge functions:

- `support-chat` — AI support conversations
- `send-email` — Email sending with templates
- `send-ticket-response-email` — Support ticket notifications
- `inbound-email` — Email-to-ticket conversion
- `resend-webhook` — Email delivery tracking
- `stripe-webhook` — Stripe payment events
- Plus 10 more for AI, notifications, analytics

Deploy functions:

```bash
npx supabase functions deploy
```

## Database Schema

87 migrations create 86+ tables across 18 domains:

- **Auth** — Profiles, roles, 2FA, login events
- **Billing** — Subscriptions, coupons, usage tracking
- **Support** — Conversations, tickets, sentiment analysis
- **Content** — Blog, content planner, guides
- **Admin** — Audit logs, feature flags, webhooks
- **Organizations** — Multi-tenancy, memberships
- **Notifications** — Multi-channel notifications
- **And more...**

See `templates/schemas/` for organized SQL templates.

## Tech Stack

- **Frontend** — React 18, Vite 5, TypeScript 5.8
- **Styling** — Tailwind CSS 3, shadcn/ui
- **Backend** — Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **State** — TanStack Query, React Context
- **Testing** — Vitest, Testing Library
- **Deployment** — Static hosting (Vercel, Netlify, etc.)

## Performance

- **Build size** — ~3.2MB (minified)
- **First load** — Sub-second on fast connection
- **Lighthouse** — 90+ performance score

Consider code splitting for production:

```ts
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@saas-infra/ui'],
        },
      },
    },
  },
};
```

## Deployment

### Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build
pnpm build

# Deploy dist/
netlify deploy --prod --dir=dist
```

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 4173
CMD ["pnpm", "preview"]
```

## Customization

This is a **demo/example app** — use it as a starting point for your own SaaS:

1. **Rebrand** — Update colors, logo, app name
2. **Remove features** — Delete unused pages/components
3. **Add features** — Build on the existing foundation
4. **Customize schema** — Modify database tables for your domain
5. **Configure edge functions** — Update AI prompts, email templates

## Support

- 📚 Package docs: See `packages/*/README.md`
- 🗄️ Database schema: See `templates/schemas/`
- 🎯 Plan: See `plans/saas-infrastructure-transformation.md`

## License

This demo app is part of the SaaS Infrastructure toolkit.
