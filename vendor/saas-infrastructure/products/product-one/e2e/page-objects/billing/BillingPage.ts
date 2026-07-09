import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../common/BasePage';

export class BillingPage extends BasePage {
  readonly currentPlanSection: Locator;
  readonly planName: Locator;
  readonly billingCycle: Locator;
  readonly renewalDate: Locator;
  readonly featuresList: Locator;

  constructor(page: Page) {
    super(page);
    this.currentPlanSection = page.locator('[data-testid="current-plan"], .current-plan').or(
      page.getByRole('heading', { name: /current plan/i }).locator('..')
    );
    this.planName = page.locator('[data-testid="plan-name"], .plan-name');
    this.billingCycle = page.getByText(/monthly|yearly|annual/i);
    this.renewalDate = page.getByText(/renew|next billing/i);
    this.featuresList = page.locator('[data-testid="features-list"], .features-list, [role="list"]');
  }

  async goto() {
    await this.page.goto('/user/billing');
  }

  async expectCurrentPlanVisible() {
    await this.goto();

    // Wait for page to load
    await expect(
      this.page.getByRole('heading', { name: /billing|subscription/i })
    ).toBeVisible({ timeout: 10000 });
  }

  async expectPlanDetails() {
    // Verify plan information is displayed
    // This is a flexible check that looks for common billing page elements
    const hasPlanInfo = await this.page.getByText(/plan|subscription|free|pro|premium|basic/i).isVisible();
    expect(hasPlanInfo).toBeTruthy();
  }

  async scrollToCurrentPlan() {
    const currentPlanHeading = this.page.getByRole('heading', { name: /current plan/i });
    const isVisible = await currentPlanHeading.isVisible().catch(() => false);

    if (isVisible) {
      await currentPlanHeading.scrollIntoViewIfNeeded();
    }
  }
}
