import { test, expect } from '@playwright/test';
import { AdminUsersPage } from '../page-objects/admin/AdminUsersPage';

test.describe('Admin - User Management', () => {
  test('should display users list @admin @critical', async ({ page }) => {
    const adminUsersPage = new AdminUsersPage(page);

    await adminUsersPage.goto();

    // Verify page loaded
    await expect(adminUsersPage.pageHeading).toBeVisible();

    // Verify table is visible
    await expect(adminUsersPage.userTable).toBeVisible();

    // Should have at least one user (the admin)
    const rowCount = await adminUsersPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should search users by email @admin', async ({ page }) => {
    const adminUsersPage = new AdminUsersPage(page);

    await adminUsersPage.goto();

    // Get initial row count
    const initialCount = await adminUsersPage.getTableRowCount();

    // Search for admin user email
    await adminUsersPage.searchUsers(process.env.TEST_ADMIN_EMAIL || '');

    // Wait for filtering
    await page.waitForTimeout(1000);

    // Should have fewer results
    const filteredCount = await adminUsersPage.getTableRowCount();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Admin user should be visible
    await adminUsersPage.expectUserVisible(process.env.TEST_ADMIN_EMAIL || '');
  });

  test('should refresh users list @admin', async ({ page }) => {
    const adminUsersPage = new AdminUsersPage(page);

    await adminUsersPage.goto();

    // Click refresh button
    await adminUsersPage.refresh();

    // Table should still be visible
    await expect(adminUsersPage.userTable).toBeVisible();

    // Should still have users
    const rowCount = await adminUsersPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should navigate to admin users from admin dashboard', async ({ page }) => {
    const adminUsersPage = new AdminUsersPage(page);

    // Start from admin dashboard
    await page.goto('/admin');

    // Look for Users link in navigation
    const usersLink = page.getByRole('link', { name: /^users$/i });
    await usersLink.click();

    // Should navigate to users page
    await expect(page).toHaveURL(/admin\/users/);

    // Page should be loaded
    await expect(adminUsersPage.pageHeading).toBeVisible();
  });

  test('should show export button @admin', async ({ page }) => {
    const adminUsersPage = new AdminUsersPage(page);

    await adminUsersPage.goto();

    // Export button should be visible
    await expect(adminUsersPage.exportButton).toBeVisible();
  });
});
