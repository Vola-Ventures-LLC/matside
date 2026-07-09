# Security Secrets Configuration Guide

This guide explains how to configure GitHub repository secrets for the security scanning workflows.

## Project Secrets (Most Projects Need These)

These are the secrets your project likely needs for CI/CD builds and deployments. Add them in GitHub repo → Settings → Secrets and variables → Actions.

| Secret                        | Purpose                                  | Where to Get It                     |
| ----------------------------- | ---------------------------------------- | ----------------------------------- |
| `VITE_SUPABASE_URL`           | Supabase project URL (for CI builds)     | Supabase dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY`      | Supabase anon/public key (for CI builds) | Supabase dashboard → Settings → API |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (for CI builds)   | Stripe dashboard → API Keys         |

> **Note:** Use your **staging** Supabase project credentials for CI/CD. Production credentials go in your hosting platform (Vercel, Netlify), not GitHub Secrets.

---

## Required Secrets

### Phase 3: Snyk (Optional but Recommended)

**Secret Name:** `SNYK_TOKEN`

**How to get it:**

1. Sign up at https://snyk.io (free tier available)
2. Go to Account Settings → API Token
3. Copy the token
4. Add to GitHub: Settings → Secrets and variables → Actions → New repository secret
5. Name: `SNYK_TOKEN`, Value: paste your token

**Free Tier:** 200 tests/month

### Phase 3: Socket.dev (Optional)

**Secret Names:** `SOCKET_PROJECT_ID` and `SOCKET_API_TOKEN`

**How to get it:**

1. Sign up at https://socket.dev (free tier available)
2. Create a new project
3. Copy Project ID and API Token
4. Add both to GitHub Secrets

**Free Tier:** 70 scans/month

## Optional Secrets (For Future Use)

### OWASP ZAP (Phase 5)

No secrets needed - runs locally

### Deployment Environments

If you add deployment workflows, you may need:

- `SUPABASE_SERVICE_ROLE_KEY` - For migrations
- `STRIPE_SECRET_KEY` - For billing (never commit!)

## Verifying Setup

After adding secrets, check the workflow runs:

1. Go to Actions tab in GitHub
2. Look for workflows with "waiting for secrets"
3. Re-run failed workflows after adding secrets

## Security Best Practices

✅ **DO:**

- Use GitHub encrypted secrets
- Rotate secrets every 90 days
- Use minimum required permissions
- Use different tokens for dev/prod

❌ **DON'T:**

- Commit secrets to code
- Share secrets in chat/email
- Use personal API keys for CI
- Give secrets broad permissions

## Workflow Status Without Secrets

### Will Work Immediately (No Secrets Needed)

- ✅ CodeQL
- ✅ Semgrep
- ✅ ESLint Security
- ✅ npm audit
- ✅ Dependabot
- ✅ GitHub Secret Scanning
- ✅ TruffleHog
- ✅ License Checker
- ✅ SBOM Generation
- ✅ Pre-commit hooks

### Require Secrets (Optional)

- ⚠️ Snyk (SNYK_TOKEN) - More advanced than npm audit
- ⚠️ Socket.dev (SOCKET_PROJECT_ID + SOCKET_API_TOKEN) - Supply chain security

## Impact Without Optional Secrets

Even without Snyk and Socket.dev, you still have:

- Dependabot for vulnerability detection
- npm audit in CI
- CodeQL for code analysis
- Semgrep for security patterns
- TruffleHog for secret detection

**Recommendation:** Start without optional secrets, add them later if needed.

## Testing Workflows

### Test Without Secrets

```bash
# Trigger workflows manually
gh workflow run codeql.yml
gh workflow run semgrep.yml
gh workflow run trufflehog.yml
```

### Test With Secrets (After Adding)

```bash
gh workflow run snyk.yml
gh workflow run socket.yml
```

## Troubleshooting

**"Secret not found" error:**

- Check secret name matches exactly (case-sensitive)
- Verify secret is in repository secrets (not organization)
- Re-run workflow after adding secret

**Workflow skipped:**

- Some workflows only run on schedule or specific triggers
- Check workflow file for `on:` conditions

**Permission denied:**

- Check workflow has correct permissions block
- Verify token has required scopes

## Cost Summary

All tools used have generous free tiers:

| Tool            | Free Tier       | Cost if Exceeded |
| --------------- | --------------- | ---------------- |
| Snyk            | 200 tests/month | $99/month        |
| Socket.dev      | 70 scans/month  | $39/month        |
| CodeQL          | Unlimited (OSS) | Free forever     |
| Semgrep         | Unlimited (OSS) | Free forever     |
| Everything else | Free            | Free forever     |

**Total monthly cost:** $0 (using free tiers)

## Next Steps

1. **Immediate:** Workflows run without any secrets
2. **Week 1:** Monitor Dependabot PRs and CodeQL alerts
3. **Week 2:** Add Snyk token if you want deeper vulnerability scanning
4. **Optional:** Add Socket.dev for supply chain monitoring

Most teams never need paid tiers! The free tools provide enterprise-grade security.
