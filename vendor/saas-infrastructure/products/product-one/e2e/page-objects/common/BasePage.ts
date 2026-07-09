import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common navigation
  async goto(path: string) {
    await this.page.goto(path);
  }

  // Common waits
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForUrl(url: string | RegExp) {
    await this.page.waitForURL(url);
  }

  // Common actions
  async fillInput(locator: Locator, value: string) {
    await locator.fill(value);
  }

  async clickButton(locator: Locator) {
    await locator.click();
  }

  // Toast notifications (sonner)
  async waitForSuccessToast(message?: string) {
    const toast = this.page.getByRole('status');
    if (message) {
      await toast.filter({ hasText: message }).waitFor({ timeout: 5000 });
    } else {
      await toast.first().waitFor({ timeout: 5000 });
    }
  }

  async waitForErrorToast(message?: string) {
    const toast = this.page.getByRole('status');
    if (message) {
      await toast.filter({ hasText: message }).waitFor({ timeout: 5000 });
    } else {
      await toast.first().waitFor({ timeout: 5000 });
    }
  }

  // Sidebar navigation
  getSidebarLink(text: string): Locator {
    return this.page.getByRole('navigation').getByRole('link', { name: text });
  }

  async navigateToPage(linkText: string) {
    await this.getSidebarLink(linkText).click();
  }

  // Common form helpers
  async submitForm(formName?: string) {
    if (formName) {
      await this.page.getByRole('form', { name: formName }).getByRole('button', { name: /submit|save|continue/i }).click();
    } else {
      await this.page.getByRole('button', { name: /submit|save|continue/i }).click();
    }
  }

  // Loading state
  async waitForLoading() {
    // Wait for any loading spinners to disappear
    const loader = this.page.getByRole('status', { name: /loading/i });
    await loader.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Ignore if no loader present
    });
  }
}
