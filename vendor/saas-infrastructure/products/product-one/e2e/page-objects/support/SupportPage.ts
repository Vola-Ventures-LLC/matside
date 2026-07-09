import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../common/BasePage';

export class SupportPage extends BasePage {
  readonly createTicketButton: Locator;
  readonly titleInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly categorySelect: Locator;
  readonly submitButton: Locator;
  readonly ticketList: Locator;

  constructor(page: Page) {
    super(page);
    // Actual button text is "New Request"
    this.createTicketButton = page.getByRole('button', { name: /new request/i });
    this.titleInput = page.getByLabel(/title|subject/i);
    this.descriptionTextarea = page.getByLabel(/description|message|details/i);
    this.categorySelect = page.getByLabel(/category|type/i);
    this.submitButton = page.getByRole('button', { name: /submit|send|create/i });
    this.ticketList = page.locator('[data-testid="ticket-list"], .ticket-list, [role="list"]');
  }

  async goto() {
    await this.page.goto('/support');
  }

  async createTicket(title: string, description: string, category?: string) {
    await this.goto();

    // Click create ticket button
    await this.createTicketButton.click();

    // Fill in form
    await this.titleInput.fill(title);
    await this.descriptionTextarea.fill(description);

    // Select category if provided and field exists
    if (category) {
      const categoryVisible = await this.categorySelect.isVisible().catch(() => false);
      if (categoryVisible) {
        await this.categorySelect.selectOption(category);
      }
    }

    // Submit
    await this.submitButton.click();
    await this.waitForSuccessToast();
  }

  async expectTicketInList(title: string) {
    await expect(this.page.getByText(title)).toBeVisible({ timeout: 10000 });
  }

  async expectTicketId() {
    // Look for ticket ID pattern (UUID or numeric ID)
    await expect(
      this.page.getByText(/ticket #|id:|ticket id/i)
    ).toBeVisible({ timeout: 5000 });
  }
}
