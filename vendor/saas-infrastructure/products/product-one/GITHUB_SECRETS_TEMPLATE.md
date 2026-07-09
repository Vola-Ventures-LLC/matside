# GitHub Secrets Configuration

**IMPORTANT**: Add these secrets to enable CI/CD E2E testing

**Location**: Settings → Secrets and variables → Actions → New repository secret

---

## Required Secrets (9 total)

### Supabase Configuration (3 secrets)

#### 1. VITE_SUPABASE_URL_TEST
```
https://tpfyezfosamfuswfkwjt.supabase.co
```

#### 2. VITE_SUPABASE_ANON_KEY_TEST
```
sb_publishable_0cIXpbbK3hZ6DVDA4OuOoQ_PWETcRI2
```

#### 3. SUPABASE_SERVICE_ROLE_KEY_TEST
```
<REDACTED-rotate-and-fetch-from-dashboard>
```

---

### Test User Credentials (6 secrets)

#### 4. TEST_USER_EMAIL
```
natalie.morin+e2e-user@gmail.com
```

#### 5. TEST_USER_PASSWORD
```
<REDACTED-set-your-own-test-password>
```

#### 6. TEST_ADMIN_EMAIL
```
natalie.morin+e2e-admin@gmail.com
```

#### 7. TEST_ADMIN_PASSWORD
```
<REDACTED-set-your-own-test-password>
```

#### 8. TEST_OWNER_EMAIL
```
natalie.morin+e2e-owner@gmail.com
```

#### 9. TEST_OWNER_PASSWORD
```
<REDACTED-set-your-own-test-password>
```

---

## Quick Copy-Paste Reference

| Secret Name | Value |
|-------------|-------|
| `VITE_SUPABASE_URL_TEST` | `https://tpfyezfosamfuswfkwjt.supabase.co` |
| `VITE_SUPABASE_ANON_KEY_TEST` | `sb_publishable_0cIXpbbK3hZ6DVDA4OuOoQ_PWETcRI2` |
| `SUPABASE_SERVICE_ROLE_KEY_TEST` | `<REDACTED-rotate-and-fetch-from-dashboard>` |
| `TEST_USER_EMAIL` | `natalie.morin+e2e-user@gmail.com` |
| `TEST_USER_PASSWORD` | `<REDACTED-set-your-own-test-password>` |
| `TEST_ADMIN_EMAIL` | `natalie.morin+e2e-admin@gmail.com` |
| `TEST_ADMIN_PASSWORD` | `<REDACTED-set-your-own-test-password>` |
| `TEST_OWNER_EMAIL` | `natalie.morin+e2e-owner@gmail.com` |
| `TEST_OWNER_PASSWORD` | `<REDACTED-set-your-own-test-password>` |

---

## How to Add Secrets

### Via GitHub UI

1. Go to your repository on GitHub
2. Click **Settings** (top right)
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** (green button)
5. Enter **Name** (e.g., `VITE_SUPABASE_URL_TEST`)
6. Enter **Value** (copy from table above)
7. Click **Add secret**
8. Repeat for all 9 secrets

### Verification

After adding all secrets, you should see 9 repository secrets listed:
- VITE_SUPABASE_URL_TEST
- VITE_SUPABASE_ANON_KEY_TEST
- SUPABASE_SERVICE_ROLE_KEY_TEST
- TEST_USER_EMAIL
- TEST_USER_PASSWORD
- TEST_ADMIN_EMAIL
- TEST_ADMIN_PASSWORD
- TEST_OWNER_EMAIL
- TEST_OWNER_PASSWORD

---

## Security Notes

⚠️ **IMPORTANT**:
- These secrets are only accessible in GitHub Actions
- Never commit these values to code
- Service role key bypasses RLS - use with caution
- Test accounts use `+` addressing - ensure your Gmail accepts these

---

## Testing the Configuration

After adding secrets, trigger a workflow run:

```bash
# Push to main
git push origin main

# Or manually trigger via GitHub UI:
# Actions → E2E Tests → Run workflow
```

Verify in workflow logs that environment variables are loaded (values will be masked).

---

**Status**: Copy this file to add secrets to GitHub
**Required**: All 9 secrets must be added before E2E tests will run in CI
**Documentation**: See [E2E_CI_SETUP.md](E2E_CI_SETUP.md) for complete guide

⚠️ **DELETE THIS FILE AFTER USE** - Contains sensitive credentials
