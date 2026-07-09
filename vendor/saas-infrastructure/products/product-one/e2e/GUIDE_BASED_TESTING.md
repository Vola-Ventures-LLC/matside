## Guide-Based Testing Framework

This framework automatically converts your user guide articles into E2E test specifications, creating **living documentation** where:

- ✅ **Tests prove guides work** - Every guide is validated by automated tests
- ✅ **Guides document tests** - Tests follow exact user workflows from guides
- ✅ **Full regression coverage** - All documented features are tested
- ✅ **Always in sync** - Outdated guides cause test failures

This is a **Specification by Example** approach where documentation = tests = specs.

---

## How It Works

### 1. Write User Guides (Already Done!)

Your user guides in `/guides` are written in markdown with step-by-step instructions:

**Example Guide: "How to Create a Support Ticket"**

```markdown
# How to Create a Support Ticket

Need help? Here's how to submit a support request:

1. Navigate to the Support page
2. Click the "Create Ticket" button
3. Fill in the ticket title
4. Describe your issue in the description field
5. Click "Submit"
6. Verify your ticket appears in the ticket list
```

### 2. Generate Test Scaffolds

Run the test generator to convert guides → test files:

```bash
pnpm tsx scripts/generate-guide-tests.ts
```

This creates test scaffolds in `e2e/generated/`:

```typescript
// e2e/generated/support/create-support-ticket.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Support - How to Create a Support Ticket", () => {
  test("should how to create a support ticket @support @critical", async ({
    page,
  }) => {
    // 1. Navigate to the Support page
    // TODO: Add action - Navigate to the Support page
    // await page.goto('/support');
    // 2. Click the "Create Ticket" button
    // TODO: Add action - Click the "Create Ticket" button
    // await page.getByRole('button', { name: /create ticket/i }).click();
    // 3. Fill in the ticket title
    // TODO: Add action - Fill in the ticket title
    // await page.getByLabel('Title').fill('E2E Test: My support issue');
    // 4. Describe your issue in the description field
    // TODO: Add action - Describe your issue
    // await page.getByLabel('Description').fill('This is a test ticket');
    // 5. Click "Submit"
    // TODO: Add action - Click "Submit"
    // await page.getByRole('button', { name: /submit/i }).click();
    // 6. Verify your ticket appears in the ticket list
    // TODO: Add assertion - Verify your ticket appears
    // await expect(page.getByText('E2E Test: My support issue')).toBeVisible();
  });
});
```

### 3. Fill in Test Implementation

Replace `TODO` comments with actual Playwright code:

```typescript
test("should create a support ticket @support @critical", async ({ page }) => {
  // 1. Navigate to the Support page
  await page.goto("/support");

  // 2. Click the "Create Ticket" button
  await page.getByRole("button", { name: /create ticket/i }).click();

  // 3-4. Fill in ticket details
  await page.getByLabel(/title/i).fill("E2E Test: My support issue");
  await page.getByLabel(/description/i).fill("This is a test ticket");

  // 5. Click "Submit"
  await page.getByRole("button", { name: /submit/i }).click();

  // 6. Verify your ticket appears
  await expect(page.getByText("E2E Test: My support issue")).toBeVisible();
});
```

### 4. Move to Final Location

Once complete, move from `e2e/generated/` to `e2e/<section>/`:

```bash
mv e2e/generated/support/create-support-ticket.spec.ts e2e/support/
```

---

## Guide Writing Best Practices for Testability

### Use Numbered Steps

```markdown
✅ Good - Numbered steps are automatically parsed:

1. Navigate to the billing page
2. Click "Upgrade Plan"
3. Select the Pro plan
4. Verify upgrade confirmation

❌ Bad - Paragraph text can't be parsed:
First you need to go to billing, then find the upgrade button and click it...
```

### Include Verification Steps

```markdown
✅ Good - Explicit verification (generates assertions): 6. Verify the success message appears 7. Check that your plan shows "Pro"

❌ Bad - No verification: 6. Click submit
```

### Use Action Verbs

```markdown
✅ Good - Clear actions:

1. Click the "Settings" button
2. Fill in the "Email" field
3. Toggle the "Notifications" switch

❌ Bad - Vague descriptions:

1. You can go to settings
2. There's an email option
```

### Be Specific About UI Elements

```markdown
✅ Good - Specific selectors:

1. Click the "Create Ticket" button in the header
2. Fill in the "Subject" input field

❌ Bad - Ambiguous:

1. Click the button
2. Type in the box
```

---

## Test Generator CLI

### Generate All Tests

```bash
pnpm tsx scripts/generate-guide-tests.ts
```

Output:

- Test files: `e2e/generated/<section>/<article>.spec.ts`
- Coverage report: `e2e/generated/COVERAGE_REPORT.md`

### Filter by Section

Manually filter generated tests by section after generation, or edit the generator script.

### Filter by Role

Tests automatically include role tags (`@admin`, `@user`, etc.) based on guide visibility.

---

## Coverage Report

The generator creates `COVERAGE_REPORT.md` showing:

```markdown
# Guide-Based Test Coverage Report

**Generated**: 2026-02-13T...
**Total Guides**: 47
**Testable Guides**: 38 (81%)

## Coverage by Section

### Getting Started

- **Total Articles**: 8
- **Testable**: 7
- **Coverage**: 88%

### Billing & Subscriptions

- **Total Articles**: 12
- **Testable**: 11
- **Coverage**: 92%

### Admin Features

- **Total Articles**: 15
- **Testable**: 12
- **Coverage**: 80%

## Priority Breakdown

- **critical**: 15 tests
- **high**: 12 tests
- **medium**: 8 tests
- **low**: 3 tests
```

---

## Workflow: Guides → Tests

### Phase 1: Initial Generation

```bash
# Generate test scaffolds from all guides
pnpm tsx scripts/generate-guide-tests.ts

# Review coverage report
cat e2e/generated/COVERAGE_REPORT.md
```

### Phase 2: Implementation

For each generated test file:

1. **Review the test steps** - Do they match the guide?
2. **Fill in TODO comments** - Add actual Playwright selectors
3. **Test locally** - `pnpm test:e2e e2e/generated/<section>/<file>.spec.ts`
4. **Fix any issues** - Update selectors, add waits, handle edge cases

### Phase 3: Finalize

1. **Move to permanent location**

   ```bash
   mv e2e/generated/support/*.spec.ts e2e/support/
   ```

2. **Update documentation**
   - Mark as completed in IMPLEMENTATION_LOG.md
   - Update DOCUMENTATION_INDEX.md

3. **Commit**
   ```bash
   git add e2e/support/
   git commit -m "test: add guide-based tests for support features"
   ```

### Phase 4: Maintenance

When guides change:

1. **Re-run generator** to detect changes
2. **Update affected tests**
3. **Re-run tests** to verify guides still work

---

## Manual Guide-Based Tests

For complex workflows not fully captured in numbered steps, create manual guide-based tests:

**Template**: `e2e/<section>/<feature>-guide.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

/**
 * Guide-based test: <Feature Name>
 * Source: /guides/<section>/<article>
 *
 * This test follows the exact user workflow described in the guide.
 * If this test fails, the guide may be outdated or incorrect.
 */

test.describe("User Guide: <Feature Name>", () => {
  test("should complete <workflow> as documented in guide @guide @critical", async ({
    page,
  }) => {
    // Follow guide steps exactly...
  });
});
```

---

## Advantages of This Approach

### 1. Comprehensive Coverage

Every documented feature = tested feature. No gaps between what you claim works and what actually works.

### 2. Living Documentation

Tests validate guides. Failed tests = outdated guides. This keeps documentation accurate.

### 3. User-Centric Testing

Tests follow real user workflows, not just technical specs. This catches UX issues.

### 4. Faster Test Writing

Guide steps → test steps. No need to design test scenarios from scratch.

### 5. Regression Protection

Changes that break documented workflows immediately fail tests.

### 6. Onboarding Aid

New team members can read guides AND see test implementations side-by-side.

---

## Integration with Existing Tests

Guide-based tests **complement** feature-focused tests:

### Feature Tests (Existing)

```typescript
// e2e/support/ticket-creation.spec.ts
// Focus: Technical verification of ticket creation

test("should create ticket with API response", async ({ page }) => {
  await page.goto("/support");
  await page.getByRole("button", { name: /create/i }).click();
  // ... detailed technical checks
});
```

### Guide-Based Tests (New)

```typescript
// e2e/support/create-support-ticket-guide.spec.ts
// Focus: User workflow from documentation

test("should create ticket following user guide @guide", async ({ page }) => {
  // Exact steps from user guide...
});
```

Both test types are valuable:

- **Feature tests**: Technical correctness, edge cases, error handling
- **Guide tests**: User workflows, documentation accuracy, happy path

---

## Tags

Guide-based tests automatically include tags:

- `@guide` - All guide-based tests
- `@critical`, `@high`, `@medium`, `@low` - Priority based on guide analysis
- `@admin`, `@user`, `@owner` - Role-based (from guide visibility)
- `@billing`, `@support`, `@auth`, etc. - Feature area tags

Run specific guide tests:

```bash
pnpm test:e2e --grep @guide           # All guide-based tests
pnpm test:e2e --grep "@guide.*@critical"  # Critical guide tests
pnpm test:e2e --grep "@guide.*@admin"     # Admin guide tests
```

---

## FAQ

### Q: What if a guide doesn't have numbered steps?

A: The generator will create a placeholder test. You can either:

1. Update the guide to include numbered steps
2. Write the test manually following the guide content

### Q: Can I edit generated tests?

A: Yes! Generated tests are scaffolds. Fill in TODO comments and customize as needed.

### Q: What happens when guides change?

A: Re-run the generator. Compare new scaffolds with existing tests and update accordingly.

### Q: Should I delete generated/ folder?

A: After moving tests to final locations, yes. The `generated/` folder is temporary.

### Q: Do I need to test EVERY guide?

A: Focus on guides describing user actions. Conceptual/informational guides don't need tests.

---

## Next Steps

1. **Run the generator**:

   ```bash
   pnpm tsx scripts/generate-guide-tests.ts
   ```

2. **Review coverage report**:

   ```bash
   cat e2e/generated/COVERAGE_REPORT.md
   ```

3. **Pick a high-priority test** and implement it

4. **Run the test**:

   ```bash
   pnpm test:e2e e2e/generated/<section>/<file>.spec.ts
   ```

5. **Move to final location** when passing

6. **Repeat** until all guides are tested!

---

**Living Documentation = Always Accurate Documentation** 📚✨
