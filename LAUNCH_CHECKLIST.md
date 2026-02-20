# MatSide — Launch Checklist

A zero-to-production service account checklist. Follow phases sequentially.

> Full instructions for each service: see `saas-infrastructure/PRODUCT_LAUNCH_GUIDE.md`

---

## Phase 1: Scaffold ✅ Complete (Claude did this)

- [x] Copied product-one framework from saas-infrastructure
- [x] Set up vendor/saas-infrastructure packages (9 packages)
- [x] Configured vite, tailwind, typescript, postcss
- [x] Replaced Lovable auth env var (`VITE_SUPABASE_PUBLISHABLE_KEY` → `VITE_SUPABASE_ANON_KEY`)
- [x] Migrated UI components to thin re-exports from `@saas-infra/ui`
- [x] Set up security: husky pre-commit (JWT/Stripe/DB/Resend scanning)
- [x] CI/CD workflows: `.github/workflows/ci.yml`, `semgrep.yml`, `trufflehog.yml`
- [x] Verified `pnpm build` succeeds (2,720 modules)
- [x] Verified `pnpm test` passes
- [x] Verified `pnpm dev` starts

---

## Phase 2: Infrastructure Accounts (You set these up)

### 2.1 Supabase — Dev Project

- [ ] Go to [supabase.com](https://supabase.com) → New Project under **Vola Ventures** org
- [ ] Name: `matside-dev`
- [ ] Save database password securely
- [ ] Region: us-east-1 (or closest to users)
- [ ] Copy **Project URL** → `VITE_SUPABASE_URL`
- [ ] Copy **anon/public key** → `VITE_SUPABASE_ANON_KEY`
- [ ] Create `.env` file in matside project root:
  ```
  VITE_SUPABASE_URL=https://your-ref.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```
- [ ] Link project (Claude does this): `npx supabase link --project-ref <id>`
- [ ] Run migrations (Claude does this): `npx supabase db push`

**Auth Settings** (in Supabase dashboard):
- [ ] Authentication → URL Configuration → Site URL: `http://localhost:8080`
- [ ] Authentication → URL Configuration → Redirect URLs: add `http://localhost:8080/**`
- [ ] Authentication → Email → Enable email confirmations (or disable for dev speed)

### 2.2 Supabase — Edge Function Secrets

After dev project is created, Claude will deploy edge functions. You need to set:

- [ ] In Supabase Dashboard → Edge Functions → Secrets:
  - `RESEND_API_KEY` — used by `send-league-invite` function

### 2.3 Supabase — Production Project *(create at launch time)*

- [ ] Name: `matside-prod`
- [ ] Same setup as dev — keep env vars **completely separate**
- [ ] Never share dev and prod Supabase projects

### 2.4 Resend — Email

Used for league invitation emails via the `send-league-invite` edge function.

- [ ] Go to [resend.com](https://resend.com) → Sign up / log in under Vola Ventures account
- [ ] Create API Key: `matside-dev`
- [ ] Copy key → set as `RESEND_API_KEY` in Supabase Edge Function secrets
- [ ] Add your domain (e.g., `matside.app`) to Resend:

| Type | Name | Value |
|------|------|-------|
| MX | @ | feedback-smtp.resend.com (priority 10) |
| TXT | @ | v=spf1 include:resend.com ~all |
| CNAME | resend._domainkey | resend._domainkey.resend.com |
| TXT | _dmarc | v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com |

- [ ] Wait for domain verification (5–10 min)
- [ ] Configure Supabase Auth SMTP to use Resend:
  - Authentication → SMTP Settings → Enable Custom SMTP
  - Host: `smtp.resend.com`, Port: `465`, Username: `resend`
  - Password: Resend API Key
  - Sender: `noreply@yourdomain.com`

### 2.5 GitHub Repository

- [ ] Create repo: `Vola-Ventures-LLC/matside` (public or private)
- [ ] Add remote: `git remote add origin https://github.com/Vola-Ventures-LLC/matside.git`
- [ ] Initial push (Claude does this after you create the repo)
- [ ] GitHub Settings → Secrets and Variables → Actions → add:
  - `VITE_SUPABASE_URL` (dev project URL)
  - `VITE_SUPABASE_ANON_KEY` (dev anon key)

### 2.6 Vercel

- [ ] Go to [vercel.com](https://vercel.com) → Vola Ventures team
- [ ] New Project → Import from GitHub → `Vola-Ventures-LLC/matside`
- [ ] Framework preset: **Vite**
- [ ] Build command: `pnpm build`
- [ ] Output directory: `dist`
- [ ] Environment Variables:
  - `VITE_SUPABASE_URL` = dev project URL (Preview + Development environments)
  - `VITE_SUPABASE_ANON_KEY` = dev anon key (Preview + Development environments)
- [ ] Branch settings:
  - `main` → Production
  - `dev` → Preview
- [ ] First deploy triggered by Claude after CI passes

---

## Phase 3: Customization (Future)

These are optional but recommended before launch:

- [ ] Create app logo / wordmark (currently no logo in public/)
- [ ] Create OG image for social sharing
- [ ] Add apple-touch-icon
- [ ] Set `VITE_APP_URL` for canonical URLs if needed
- [ ] Add Google Analytics or Plausible (optional)

---

## Phase 4: Domain (Optional)

If using a custom domain (e.g., `matside.app`):

- [ ] Purchase domain (Vercel Domains or external registrar)
- [ ] Add domain in Vercel → Project → Domains
- [ ] Update DNS records
- [ ] Update Supabase Auth redirect URLs to include production domain
- [ ] Update `supabase/config.toml` `site_url` to production URL

---

## Phase 5: Pre-Launch Security

- [ ] Review CI passing on GitHub Actions
- [ ] TruffleHog scan: no secrets in git history
- [ ] Semgrep scan: no HIGH/ERROR findings
- [ ] Verify `.env` is in `.gitignore` and never committed
- [ ] Review Supabase RLS policies (Claude will audit after migrations)

---

## Quick Reference: Env Vars

| Variable | Where | Used By |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | `.env` + Vercel | Supabase client |
| `VITE_SUPABASE_ANON_KEY` | `.env` + Vercel | Supabase client |
| `RESEND_API_KEY` | Supabase Edge Function Secrets | `send-league-invite` |

---

## Status Tracker

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Scaffold (Claude) | ✅ Complete |
| 2 | Migrate from Lovable (DB, auth, edge functions) | ⏳ Waiting for Supabase dev project |
| 3 | Unit Tests | ⏳ Not started |
| 4 | Local UAT Bot Testing | ⏳ Not started |
| 5 | Deploy to Preview / CI/CD | ⏳ Waiting for GitHub + Vercel |
| 6 | Deploy to Production | ⏳ User-triggered |
