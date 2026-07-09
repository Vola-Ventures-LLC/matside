import { test, expect } from '@playwright/test';
import { AdminAuditPage } from '../page-objects/admin/AdminAuditPage';

test.describe('Admin - Audit Logs', () => {
  test('should display audit trail @admin @critical', async ({ page }) => {
    const auditPage = new AdminAuditPage(page);

    await auditPage.goto();

    // Verify page loaded
    await expect(auditPage.pageHeading).toBeVisible();

    // Verify table is visible
    await expect(auditPage.auditTable).toBeVisible();

    // Should have at least one audit log entry
    const rowCount = await auditPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should navigate to audit logs from admin dashboard', async ({ page }) => {
    const auditPage = new AdminAuditPage(page);

    // Start from admin dashboard
    await page.goto('/admin');

    // Look for Audit link in navigation
    const auditLink = page.getByRole('link', { name: /audit/i });
    await auditLink.click();

    // Should navigate to audit page
    await expect(page).toHaveURL(/admin\/audit/);

    // Page should be loaded
    await expect(auditPage.pageHeading).toBeVisible();
  });

  test('should search audit logs @admin', async ({ page }) => {
    const auditPage = new AdminAuditPage(page);

    await auditPage.goto();

    // Get initial row count
    const initialCount = await auditPage.getTableRowCount();

    // Search for "VIEW"
    await auditPage.searchLogs('VIEW');

    // Wait for filtering
    await page.waitForTimeout(1000);

    // Should have results
    const filteredCount = await auditPage.getTableRowCount();
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('should refresh audit logs @admin', async ({ page }) => {
    const auditPage = new AdminAuditPage(page);

    await auditPage.goto();

    // Click refresh button
    await auditPage.refresh();

    // Table should still be visible
    await expect(auditPage.auditTable).toBeVisible();

    // Should still have logs
    const rowCount = await auditPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should show export button @admin', async ({ page }) => {
    const auditPage = new AdminAuditPage(page);

    await auditPage.goto();

    // Export button should be visible
    await expect(auditPage.exportButton).toBeVisible();
  });
});
