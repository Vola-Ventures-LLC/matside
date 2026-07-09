import { test, expect } from '@playwright/test';
import { SettingsPage } from '../page-objects/settings/SettingsPage';

test.describe('Settings - Profile Management', () => {
  test('should update user profile successfully', async ({ page }) => {
    const settingsPage = new SettingsPage(page);

    // Navigate to settings/profile
    await settingsPage.goto();

    // Update profile information (only name, no bio field exists)
    const testName = `E2E Test User ${Date.now()}`;

    await settingsPage.updateProfile(testName);

    // Verify success by checking that field is updated
    await expect(settingsPage.nameInput).toHaveValue(testName);
  });

  test('should navigate to profile settings from user menu', async ({ page }) => {
    const settingsPage = new SettingsPage(page);

    // Start from dashboard
    await page.goto('/dashboard');

    // Navigate via user menu
    await settingsPage.navigateToProfile();

    // Verify we're on the settings page
    await expect(page).toHaveURL(/settings/);
  });
});
