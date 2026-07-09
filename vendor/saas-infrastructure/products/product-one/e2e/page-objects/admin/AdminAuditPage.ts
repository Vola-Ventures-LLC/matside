import { Page, Locator } from '@playwright/test';
import { BasePage } from '../common/BasePage';

export class AdminAuditPage extends BasePage {
  readonly pageHeading: Locator;
  readonly searchInput: Locator;
  readonly actionFilter: Locator;
  readonly refreshButton: Locator;
  readonly exportButton: Locator;
  readonly auditTable: Locator;
  readonly auditRows: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.getByRole('heading', { name: /audit trail/i });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.actionFilter = page.getByRole('combobox', { name: /action/i });
    this.refreshButton = page.getByRole('button', { name: /refresh/i });
    this.exportButton = page.getByRole('button', { name: /export/i });
    this.auditTable = page.getByRole('table');
    this.auditRows = page.getByRole('row');
  }

  async goto() {
    await this.page.goto('/admin/audit');
  }

  async searchLogs(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async filterByAction(action: string) {
    await this.actionFilter.click();
    await this.page.getByRole('option', { name: action }).click();
  }

  async refresh() {
    await this.refreshButton.click();
    await this.page.waitForTimeout(1000);
  }

  async getTableRowCount() {
    // Subtract 1 for header row
    return (await this.auditRows.count()) - 1;
  }

  async expectLogVisible(action: string) {
    const row = this.page.getByRole('row').filter({ hasText: action });
    await row.waitFor({ state: 'visible' });
  }
}
