import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly welcomeMessage: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeMessage = page.getByRole('heading', { name: /welcome|dashboard/i, level: 1 });
    this.userMenu = page.getByRole('button', { name: /user menu|profile/i });
    this.logoutButton = page.getByRole('menuitem', { name: /log out|sign out/i });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectWelcomeMessage(name?: string) {
    if (name) {
      await expect(this.welcomeMessage).toContainText(name);
    } else {
      await expect(this.welcomeMessage).toBeVisible();
    }
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async navigateToSettings() {
    await this.navigateToPage('Settings');
  }

  async navigateToBilling() {
    await this.navigateToPage('Billing');
  }

  async navigateToSupport() {
    await this.navigateToPage('Support');
  }

  async navigateToAdmin() {
    await this.navigateToPage('Admin');
  }
}
