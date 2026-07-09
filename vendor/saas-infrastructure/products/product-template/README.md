# Product Template

This is a production-ready SaaS product template with all infrastructure packages pre-integrated.

## Features Included

- ✅ **Complete UI Kit**: 49 shadcn/radix components
- ✅ **Authentication**: Supabase auth with 2FA, roles, impersonation
- ✅ **Billing**: Stripe integration with subscriptions, coupons, affiliates
- ✅ **Admin Kit**: Audit logs, feature flags, data export
- ✅ **Support System**: Tickets, live chat, satisfaction metrics
- ✅ **Content Management**: Blog posts, content planner
- ✅ **Email System**: Transactional emails, domains, deliverability
- ✅ **Org Management**: Multi-tenant organizations with permissions
- ✅ **i18n/Locale**: Multi-language and timezone support
- ✅ **Performance**: Code-split with lazy loading (64% bundle reduction)

## Creating a New Product

### Option 1: Standalone Product (Recommended for Production)

Creates a **separate repository** that references packages via git:

```bash
# From infrastructure repo root
pnpm create-standalone my-product-name

# Or specify target directory
pnpm create-standalone my-product-name ~/projects
```

**Benefits:**

- ✅ Separate git repo for each product
- ✅ Independent deployment and CI/CD
- ✅ Packages stay in infrastructure repo (single source of truth)
- ✅ Update packages with `pnpm update`

**See [CREATING_PRODUCTS.md](../../CREATING_PRODUCTS.md) for detailed guide.**

### Option 2: Monorepo Product (For Testing/Demos)

Creates a product **within this monorepo**:

```bash
# From repository root
pnpm create-product my-product-name
```

**Best for:** Examples, testing infrastructure changes, rapid prototyping

## Customization Checklist

After cloning, customize these files:

### 1. Branding & Metadata

- [ ] `index.html` - Update `<title>`, favicon links, meta tags
- [ ] `public/` - Replace logo, favicon files
- [ ] `src/index.css` - Customize CSS variables for brand colors
- [ ] `vite.config.ts` - Update server port if needed

### 2. Environment Variables

Create `.env.local` in project root with:

```env
# Supabase (Required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (For billing features)
VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key

# Optional
VITE_APP_NAME=Your App Name
VITE_SUPPORT_EMAIL=support@yourapp.com
```

### 3. Routes & Navigation

- [ ] `src/App.tsx` - Add/remove routes for your product
- [ ] `src/layouts/AppLayout.tsx` - Customize sidebar navigation
- [ ] `src/pages/` - Create your custom pages

### 4. Landing Page

- [ ] `src/pages/Landing.tsx` - Replace with your hero, features, pricing
- [ ] `src/components/` - Customize shared components

### 5. Remove Unused Features (Optional)

If you don't need certain features:

**Remove Blog:**

```bash
# Remove blog pages
rm src/pages/Blog*.tsx
rm src/pages/AdminBlog*.tsx

# Remove from routes in App.tsx
# Remove from navigation in AppLayout.tsx

# Uninstall content package dependency (optional)
# Remove "@saas-infra/content" from package.json
```

**Remove Organizations:**

```bash
# Remove org pages
rm src/pages/*Org*.tsx

# Remove OrgProvider from App.tsx
# Remove OrgSwitcher from AppLayout.tsx
```

**Remove Support System:**

```bash
# Remove support pages
rm src/pages/Support*.tsx
rm src/pages/AdminSupport*.tsx

# Uninstall support package (optional)
# Remove "@saas-infra/support" from package.json
```

## Development Commands

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Build for development environment
pnpm build:dev

# Run tests
pnpm test

# Watch mode tests
pnpm test:watch

# Lint
pnpm lint

# Clean build artifacts
pnpm clean
```

## Architecture Overview

### Lazy Loading

All 62 routes are code-split using `React.lazy()` for optimal performance:

```typescript
const Dashboard = lazy(() => import("@/pages/Dashboard"));
```

### Manual Chunks

Vendor libraries are split into optimized chunks:

- `vendor-react` - React core (420 KB)
- `vendor-supabase` - Supabase client (180 KB)
- `vendor-ui` - UI components (150 KB)
- `vendor-query` - React Query (80 KB)
- `vendor-tiptap` - Rich text editor (220 KB)
- `vendor-charts` - Recharts (140 KB)
- `vendor-utils` - Utilities (60 KB)

### Package Dependencies

All infrastructure packages are included via workspace references:

```json
"@saas-infra/admin-kit": "workspace:*",
"@saas-infra/auth": "workspace:*",
"@saas-infra/billing": "workspace:*",
"@saas-infra/content": "workspace:*",
"@saas-infra/emails": "workspace:*",
"@saas-infra/support": "workspace:*",
"@saas-infra/ui": "workspace:*",
"@saas-infra/utils": "workspace:*"
```

### Re-Export Pattern

Components and hooks use thin re-exports for clean imports:

```typescript
// src/components/ui/button.tsx
export * from "@saas-infra/ui/button";

// src/hooks/useAuth.tsx
export { useAuth, AuthProvider } from "@saas-infra/auth";
```

This allows your code to use:

```typescript
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
```

## Default Accounts for Testing

When seeding the template database, create these test accounts:

- **Owner**: `owner@example.com` / `owner123`
- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

## Database Setup

See `templates/schemas/` for SQL templates to create your database:

```bash
# Apply all schema templates
npx supabase db push

# Or apply specific domains
psql -f templates/schemas/01_core_auth.sql
psql -f templates/schemas/02_billing.sql
# ... etc
```

## Next Steps

1. **Update branding** - Logo, colors, app name
2. **Configure environment** - Add your Supabase + Stripe keys
3. **Customize routes** - Add your product-specific pages
4. **Remove unused features** - Keep only what you need
5. **Test everything** - Run `pnpm test` to ensure all features work
6. **Deploy** - Follow deployment guide in root `/docs`

## Support

- **Documentation**: See root `/docs` folder
- **Monorepo Guide**: `CLAUDE.md` in root
- **Package Docs**: `packages/*/README.md`
- **Launch Guide**: `SAAS_PRODUCT_LAUNCH_GUIDE.md` in root

---

**Built with the SaaS Infrastructure monorepo** • [Repository Root](../../README.md)
