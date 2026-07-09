# E2E Testing Quick Start Guide

## 🎯 Overview

You now have **two powerful E2E testing approaches**:

1. **Traditional Feature Tests** - Test specific features and edge cases
2. **Guide-Based Tests** - Convert user guides → comprehensive regression tests

This gives you **living documentation** where tests prove your guides work, and guides document what's tested.

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Set Up Environment

```bash
cd products/product-one

# Copy environment template
cp .env.test.example .env.test

# Edit .env.test with your dev Supabase credentials
# (Just copy from your existing .env file)
```

### Step 2: Create Test Users in Supabase

Go to [Supabase Dashboard](https://app.supabase.com) → Authentication → Add User:

- Email: `test-user@example.com`, Password: `TestPassword123!`
- Email: `test-admin@example.com`, Password: `AdminPassword123!`

### Step 3: Install Dependencies (if not done)

```bash
pnpm install
pnpm exec playwright install --with-deps chromium
```

### Step 4: Build the App

```bash
pnpm build
```

### Step 5: Run Your First Test

```bash
# Run tests in UI mode (recommended for first run)
pnpm test:e2e:ui

# Or run all tests headless
pnpm test:e2e
```

---

## 📚 Guide-Based Testing (New!)

### What Is It?

Convert your user guides into E2E tests automatically:

**User Guide** (already exists):

```markdown
# How to Create a Support Ticket

1. Navigate to the Support page
2. Click "Create Ticket" button
3. Fill in title and description
4. Click "Submit"
5. Verify ticket appears in list
```

**Generated Test** (automatic):

```typescript
test("should create support ticket @guide @support", async ({ page }) => {
  // 1. Navigate to the Support page
  await page.goto("/support");

  // 2. Click "Create Ticket" button
  await page.getByRole("button", { name: /create ticket/i }).click();

  // ... etc
});
```

### Generate Tests from Guides

```bash
# Generate test scaffolds from all published user guides
pnpm test:generate-from-guides
```

This creates:

- `e2e/generated/<section>/<article>.spec.ts` - Test scaffolds
- `e2e/generated/COVERAGE_REPORT.md` - Coverage analysis

### Implement Generated Tests

1. **Review generated tests** in `e2e/generated/`
2. **Fill in TODO comments** with actual Playwright selectors
3. **Test locally**: `pnpm test:e2e e2e/generated/<path>`
4. **Move to final location** when passing:
   ```bash
   mv e2e/generated/support/create-ticket.spec.ts e2e/support/
   ```

**See full guide**: [`e2e/GUIDE_BASED_TESTING.md`](e2e/GUIDE_BASED_TESTING.md)

---

## 📁 Project Structure

```
products/product-one/
├── playwright.config.ts           # Playwright configuration
├── .env.test                      # Your test credentials (gitignored)
├── .env.test.example              # Template
├── e2e/
│   ├── auth/                      # Authentication tests
│   │   ├── auth.setup.ts          # Creates .auth/*.json files
│   │   └── login.spec.ts          # Login flow tests (5 tests)
│   ├── billing/                   # (Ready for Phase 2)
│   ├── admin/                     # (Ready for Phase 3)
│   ├── support/                   # (Ready for Phase 3)
│   ├── content/                   # (Ready for Phase 3)
│   ├── page-objects/              # Page Object Model
│   │   ├── common/BasePage.ts     # Base class
│   │   ├── common/DashboardPage.ts
│   │   └── auth/LoginPage.ts
│   ├── fixtures/                  # Custom fixtures
│   │   └── database.fixture.ts    # DB cleanup
│   ├── utils/
│   │   ├── global-setup.ts        # Env verification
│   │   └── guide-test-generator.ts  # Guide → test converter
│   ├── generated/                 # Auto-generated test scaffolds
│   ├── GUIDE_BASED_TESTING.md     # Guide-based testing docs
│   └── README.md                  # E2E testing docs
└── scripts/
    └── generate-guide-tests.ts    # CLI script
```

---

## 🎮 Available Commands

### Running Tests

```bash
# All tests (headless)
pnpm test:e2e

# UI mode (interactive, best for writing tests)
pnpm test:e2e:ui

# Specific test file
pnpm test:e2e auth/login.spec.ts

# Tests with specific tag
pnpm test:e2e --grep @smoke
pnpm test:e2e --grep @critical
pnpm test:e2e --grep @guide

# Debug mode (step through with inspector)
pnpm test:e2e:debug auth/login.spec.ts

# Headed mode (see browser)
pnpm test:e2e:headed

# View last HTML report
pnpm test:e2e:report
```

### Test Generation

```bash
# Generate tests from user guides
pnpm test:generate-from-guides

# View coverage report
cat e2e/generated/COVERAGE_REPORT.md
```

---

## 🏗️ Two Testing Approaches

### Approach 1: Traditional Feature Tests

**When to use**: Testing specific features, edge cases, error handling

**Example**: `e2e/auth/login.spec.ts`

```typescript
test("should show error with invalid password", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("user@example.com", "WrongPassword");
  await expect(loginPage.errorMessage).toBeVisible();
});
```

**Characteristics**:

- ✅ Detailed technical verification
- ✅ Edge cases and error scenarios
- ✅ Fine-grained control

### Approach 2: Guide-Based Tests

**When to use**: Testing complete user workflows, validating documentation

**Example**: Auto-generated from user guide

```typescript
test("should create support ticket (from guide) @guide", async ({ page }) => {
  // Follows exact steps from user guide...
  // If test fails, guide is outdated or incorrect
});
```

**Characteristics**:

- ✅ Comprehensive user workflows
- ✅ Validates documentation accuracy
- ✅ Full regression coverage
- ✅ Auto-generated scaffolds

**Use both!** They complement each other.

---

## 📊 Test Coverage Strategy

### Phase 1: Foundation (✅ Complete)

- ✅ Playwright setup
- ✅ Base infrastructure (BasePage, fixtures)
- ✅ First auth tests (5 tests)
- ✅ Guide-based test generator

### Phase 2: Critical Paths

**Traditional tests** for:

- [ ] Signup flow
- [ ] Password reset
- [ ] 2FA setup/login
- [ ] Subscription purchase
- [ ] Support ticket creation

### Phase 3: Guide-Based Coverage

**Generated from guides**:

- [ ] Run `pnpm test:generate-from-guides`
- [ ] Implement high-priority tests first
- [ ] Achieve 80%+ guide coverage

### Phase 4: Complete Coverage

- [ ] Admin features
- [ ] All guide workflows
- [ ] CI/CD integration

---

## 🎯 Recommended Workflow

### Daily Development

1. **Write/update user guides** for new features
2. **Generate tests** from guides: `pnpm test:generate-from-guides`
3. **Implement generated tests** alongside feature code
4. **Run tests**: `pnpm test:e2e`

### Before Deployment

1. **Run full test suite**: `pnpm test:e2e`
2. **Check guide coverage**: `cat e2e/generated/COVERAGE_REPORT.md`
3. **All critical tests passing**: `pnpm test:e2e --grep @critical`

---

## 💡 Pro Tips

### For Guide Authors

- ✅ Use numbered steps (auto-parsed by generator)
- ✅ Include verification steps ("Verify X appears")
- ✅ Be specific about UI elements ("Click the 'Submit' button")
- ✅ Use action verbs (Click, Fill, Navigate, Verify)

### For Test Writers

- ✅ Start with guide-based tests (faster)
- ✅ Add traditional tests for edge cases
- ✅ Use Page Object Model for maintainability
- ✅ Tag tests appropriately (`@smoke`, `@critical`, `@guide`)
- ✅ Prefix test data with `"E2E Test:"` for easy cleanup

### For Debugging

- ✅ Use UI mode: `pnpm test:e2e:ui`
- ✅ Use debug mode: `pnpm test:e2e:debug`
- ✅ Check trace files after failures
- ✅ View HTML report: `pnpm test:e2e:report`

---

## 📖 Documentation

- **[e2e/README.md](e2e/README.md)** - Comprehensive E2E testing guide
- **[e2e/GUIDE_BASED_TESTING.md](e2e/GUIDE_BASED_TESTING.md)** - Guide-based testing framework
- **[PRODUCT_LAUNCH_GUIDE.md](../PRODUCT_LAUNCH_GUIDE.md)** - Full deployment guide

---

## 🤝 Getting Help

### Test Failures

1. **Check test output** for error messages
2. **View trace**: `npx playwright show-trace test-results/.../trace.zip`
3. **Run in debug mode**: `pnpm test:e2e:debug <file>`
4. **Check if guide is outdated** (for guide-based tests)

### Missing Test Users

- Create in Supabase Dashboard → Authentication → Add User
- Or run SQL in Supabase SQL Editor (see `e2e/README.md`)

### Environment Issues

- Verify `.env.test` has correct Supabase credentials
- Check `pnpm preview` works manually
- Ensure app builds: `pnpm build`

---

## 🚀 Next Steps

**Right now (5 minutes)**:

1. ✅ Complete Quick Start above
2. ✅ Run first test: `pnpm test:e2e:ui`

**Today (1 hour)**: 3. Generate tests from guides: `pnpm test:generate-from-guides` 4. Review coverage report 5. Implement 1-2 high-priority guide-based tests

**This week**: 6. Complete Phase 2 (critical path tests) 7. Achieve 50%+ guide coverage 8. Set up CI/CD (Phase 5)

---

**Living Documentation = Always Accurate Documentation** 📚✨

**Questions?** Check `e2e/README.md` and `e2e/GUIDE_BASED_TESTING.md`
