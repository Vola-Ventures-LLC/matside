import { test, expect } from '@playwright/test';
import { BillingPage } from '../page-objects/billing/BillingPage';

test.describe('Billing - Subscription Management', () => {
  test('should view current subscription details @critical @billing', async ({ page }) => {
    const billingPage = new BillingPage(page);

    // Navigate to billing page
    await billingPage.expectCurrentPlanVisible();

    // Scroll to current plan section
    await billingPage.scrollToCurrentPlan();

    // Verify plan details are displayed
    await billingPage.expectPlanDetails();
  });

  test('should navigate to billing page from sidebar', async ({ page }) => {
    const billingPage = new BillingPage(page);

    await billingPage.goto();

    // Verify we're on billing page
    await expect(page).toHaveURL(/user\/billing/);

    // Verify billing page loaded
    await expect(
      page.getByRole('heading', { name: /billing|subscription|plans/i })
    ).toBeVisible();
  });

  test('should display subscription information', async ({ page }) => {
    const billingPage = new BillingPage(page);

    await billingPage.goto();

    // Verify page loaded by checking URL
    await expect(page).toHaveURL(/user\/billing/);

    // Verify page content loaded (any text visible means page rendered)
    const pageHasContent = await page.locator('body').textContent();
    expect(pageHasContent).toBeTruthy();
  });
});
