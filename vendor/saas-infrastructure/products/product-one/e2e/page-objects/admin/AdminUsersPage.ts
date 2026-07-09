import { Page, Locator } from '@playwright/test';
import { BasePage } from '../common/BasePage';

export class AdminUsersPage extends BasePage {
  readonly pageHeading: Locator;
  readonly searchInput: Locator;
  readonly refreshButton: Locator;
  readonly exportButton: Locator;
  readonly userTable: Locator;
  readonly userRows: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.getByRole('heading', { name: /users|user management/i });
    this.searchInput = page.getByPlaceholder(/search users/i);
    this.refreshButton = page.getByRole('button', { name: /refresh/i });
    this.exportButton = page.getByRole('button', { name: /export/i });
    this.userTable = page.getByRole('table');
    this.userRows = page.getByRole('row');
  }

  async goto() {
    await this.page.goto('/admin/users');
  }

  async searchUsers(query: string) {
    await this.searchInput.fill(query);
    // Wait a bit for search to filter results
    await this.page.waitForTimeout(500);
  }

  async refresh() {
    await this.refreshButton.click();
    await this.page.waitForTimeout(1000);
  }

  async clickUserRow(email: string) {
    const row = this.page.getByRole('row').filter({ hasText: email });
    await row.click();
  }

  async getUserRowByEmail(email: string) {
    return this.page.getByRole('row').filter({ hasText: email });
  }

  async expectUserVisible(email: string) {
    const row = await this.getUserRowByEmail(email);
    await row.waitFor({ state: 'visible' });
  }

  async getTableRowCount() {
    // Subtract 1 for header row
    return (await this.userRows.count()) - 1;
  }
}
