import { Page, Locator } from '@playwright/test';
import { BasePage } from '../common/BasePage';

export class SettingsPage extends BasePage {
  readonly userMenuButton: Locator;
  readonly settingsLink: Locator;
  readonly profileTab: Locator;
  readonly nameInput: Locator;
  readonly bioTextarea: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.userMenuButton = page.getByRole('button', { name: /user menu|profile|account/i });
    this.settingsLink = page.getByRole('link', { name: /settings/i });
    this.profileTab = page.getByRole('tab', { name: /profile/i });
    // Looking for "Display Name" or "Name" input
    this.nameInput = page.getByLabel(/display name|name/i).first();
    this.bioTextarea = page.getByLabel(/bio/i);
    // Actual button text is "Save changes"
    this.saveButton = page.getByRole('button', { name: /save changes/i });
  }

  async goto() {
    await this.page.goto('/settings');
  }

  async navigateToProfile() {
    // Check if we're already on settings page
    const currentUrl = this.page.url();
    if (!currentUrl.includes('/settings')) {
      await this.goto();
    }

    // Click profile tab if it exists
    const tabVisible = await this.profileTab.isVisible().catch(() => false);
    if (tabVisible) {
      await this.profileTab.click();
    }
  }

  async updateProfile(name: string, bio?: string) {
    await this.navigateToProfile();

    if (name) {
      await this.nameInput.clear();
      await this.nameInput.fill(name);
    }

    // Bio field doesn't exist in current Settings page
    // Commenting out for now
    // if (bio) {
    //   await this.bioTextarea.clear();
    //   await this.bioTextarea.fill(bio);
    // }

    await this.saveButton.click();
    // Settings page shows visual "Saved" indicator, not toast
    await this.page.waitForTimeout(1000);
  }
}
