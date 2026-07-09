# E2E CI/CD Setup Guide

This guide explains how to configure GitHub Actions to run the E2E test suite automatically on every push and pull request.

## Overview

The E2E test suite runs in GitHub Actions with:

- **2 parallel shards** for faster execution (splits 21 tests across 2 jobs)
- **Automatic artifact uploads** (HTML reports, videos, traces)
- **Retry strategy** (2 retries on failure built into Playwright config)
- **Merged HTML report** for easy debugging

## Required GitHub Secrets

Navigate to **Settings → Secrets and variables → Actions → New repository secret** and add:

### Supabase Configuration

| Secret Name                      | Value                                            | Where to Find                                                  |
| -------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| `VITE_SUPABASE_URL_TEST`         | `https://tpfyezfosamfuswfkwjt.supabase.co`       | Supabase Dashboard → Project Settings → API                    |
| `VITE_SUPABASE_ANON_KEY_TEST`    | `sb_publishable_0cIXpbbK3hZ6DVDA4OuOoQ_PWETcRI2` | Supabase Dashboard → Project Settings → API → anon/public key  |
| `SUPABASE_SERVICE_ROLE_KEY_TEST` | `<REDACTED-rotate-and-fetch-from-dashboard>`      | Supabase Dashboard → Project Settings → API → service_role key |

### Test User Credentials

| Secret Name           | Value                               | Notes                      |
| --------------------- | ----------------------------------- | -------------------------- |
| `TEST_USER_EMAIL`     | `natalie.morin+e2e-user@gmail.com`  | Regular user account       |
| `TEST_USER_PASSWORD`  | `<REDACTED-set-your-own-test-password>`                          | Password for user account  |
| `TEST_ADMIN_EMAIL`    | `natalie.morin+e2e-admin@gmail.com` | Admin role account         |
| `TEST_ADMIN_PASSWORD` | `<REDACTED-set-your-own-test-password>`                          | Password for admin account |
| `TEST_OWNER_EMAIL`    | `natalie.morin+e2e-owner@gmail.com` | Owner role account         |
| `TEST_OWNER_PASSWORD` | `<REDACTED-set-your-own-test-password>`                          | Password for owner account |

## Setup Steps

### 1. Create Test Users (One-Time Setup)

If the test users don't exist yet, run:

```bash
cd products/product-one
pnpm create-test-users
pnpm assign-test-roles
```

This creates the three test users and assigns their roles in the database.

### 2. Add GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the tables above
5. Verify all 9 secrets are added

### 3. Trigger the Workflow

The workflow runs automatically on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Only when files in `products/product-one/` or `packages/` change

**Manual trigger:**

1. Go to **Actions** tab
2. Select "E2E Tests" workflow
3. Click "Run workflow"

## Workflow Details

### Test Sharding

Tests are split into 2 parallel jobs for faster execution:

- **Shard 1/2**: Runs ~11 tests
- **Shard 2/2**: Runs ~10 tests

Total execution time: ~8-10 seconds (vs 12s sequentially)

### Artifact Uploads

The workflow uploads these artifacts for debugging:

| Artifact                   | When       | Retention |
| -------------------------- | ---------- | --------- |
| `playwright-report-merged` | Always     | 14 days   |
| `playwright-report-1`      | Always     | 14 days   |
| `playwright-report-2`      | Always     | 14 days   |
| `test-results-1`           | Always     | 7 days    |
| `test-results-2`           | Always     | 7 days    |
| `videos-1`                 | On failure | 7 days    |
| `videos-2`                 | On failure | 7 days    |

### Viewing Test Reports

1. Go to **Actions** tab
2. Click on the workflow run
3. Scroll to **Artifacts** section
4. Download `playwright-report-merged`
5. Extract and open `index.html` in a browser

### Debugging Failed Tests

If tests fail in CI:

1. **Check the workflow logs**:
   - Click on the failed job
   - Expand the "Run Playwright tests" step
   - Read the error messages

2. **Download artifacts**:
   - `playwright-report-merged`: HTML report with screenshots
   - `videos-{shard}`: Video recordings of failed tests
   - `test-results-{shard}`: Traces for debugging

3. **View traces locally**:
   ```bash
   # Extract test-results artifact
   npx playwright show-trace test-results/path/to/trace.zip
   ```

## Workflow Configuration

### File Location

`.github/workflows/e2e.yml`

### Key Configuration

```yaml
strategy:
  fail-fast: false # Continue running other shards even if one fails
  matrix:
    shardIndex: [1, 2]
    shardTotal: [2]
```

### Build Step

The workflow:

1. Builds `product-one` with Vite (`pnpm build`)
2. Runs `pnpm preview` to serve the production build
3. Executes Playwright tests against `http://localhost:5173`

This matches the local development workflow.

### Retry Strategy

Playwright config includes automatic retries:

```typescript
retries: process.env.CI ? 2 : 0;
```

Failed tests retry up to 2 times before marking as failure.

## Integrating with Existing CI

The E2E workflow is separate from the main CI workflow (`.github/workflows/ci.yml`).

**Option 1: Keep separate** (current setup)

- E2E runs independently
- Faster feedback for unit tests
- Can disable E2E temporarily without affecting CI

**Option 2: Add as dependency**
Modify `ci.yml` to require E2E tests:

```yaml
jobs:
  build-and-test:
    # ... existing job ...

  e2e-tests:
    needs: build-and-test # Run after unit tests pass
    # ... e2e config ...
```

## Local Testing

Before pushing, test the workflow locally:

```bash
cd products/product-one

# Run all tests
pnpm test:e2e

# Run specific shard (like CI does)
pnpm test:e2e --shard=1/2
pnpm test:e2e --shard=2/2

# Generate HTML report
pnpm test:e2e --reporter=html
```

## Troubleshooting

### "Secrets not found" error

**Problem**: Workflow fails with missing environment variables

**Solution**:

1. Verify all 9 secrets are added to GitHub
2. Check secret names match exactly (case-sensitive)
3. Re-run the workflow

### Tests pass locally but fail in CI

**Problem**: Different behavior in CI environment

**Common causes**:

1. **Timing differences**: CI may be slower
   - Solution: Increase timeouts in affected tests
2. **Missing test data**: Users or guides not created
   - Solution: Run setup scripts manually in CI (add to workflow)
3. **Environment variables**: Different values in CI
   - Solution: Verify secrets are correct

### "Browser not found" error

**Problem**: Playwright browsers not installed

**Solution**: The workflow includes `playwright install --with-deps chromium`, which should resolve this. If it persists:

1. Check the workflow log for installation errors
2. Verify Node.js version is 18+

### Slow test execution

**Problem**: Tests taking >2 minutes

**Current performance**: ~12 seconds locally, ~8-10s in CI (with sharding)

If tests become slow:

1. Increase shard count (2 → 4)
2. Review test timeouts (currently 60s)
3. Check for network latency to Supabase

## Cost Considerations

GitHub Actions pricing (for private repos):

- **Free tier**: 2,000 minutes/month
- **Pro tier**: 3,000 minutes/month

**E2E workflow cost**:

- ~5 minutes per run (2 parallel jobs × 2.5 min each)
- ~10-20 runs per day = 50-100 minutes/day
- **Monthly**: 1,500-3,000 minutes (fits in free/pro tier)

**Optimization strategies**:

1. Run E2E only on `main` and PRs (current setup)
2. Skip E2E for documentation-only changes
3. Use `paths` filter to ignore unrelated changes

## Next Steps

After CI setup is complete:

1. **Monitor first runs**: Watch a few workflow executions to ensure stability
2. **Adjust retries**: If tests are flaky, increase retry count
3. **Add status badge**: Display test status in README
   ```markdown
   ![E2E Tests](https://github.com/username/repo/workflows/E2E%20Tests/badge.svg)
   ```
4. **Set up notifications**: Configure Slack/email alerts for failures

## Support

If you encounter issues:

1. Check workflow logs in GitHub Actions
2. Review `E2E_SUCCESS_REPORT.md` for local testing guidance
3. Consult `e2e/README.md` for test development help
