import { Page, Locator } from '@playwright/test';
import { BasePage } from '../common/BasePage';

export class SignupPage extends BasePage {
  readonly displayNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signupButton: Locator;
  readonly googleSignupButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);
    this.displayNameInput = page.getByLabel(/display name|name/i);
    this.emailInput = page.getByLabel(/^email$/i);
    this.passwordInput = page.getByLabel(/^password$/i).first();
    this.confirmPasswordInput = page.getByLabel(/confirm password/i);
    this.signupButton = page.getByRole('button', { name: /sign up|create account/i });
    this.googleSignupButton = page.getByRole('button', { name: /google/i });
    this.loginLink = page.getByRole('link', { name: /sign in|log in/i });
  }

  async goto() {
    await this.page.goto('/signup');
  }

  async fillSignupForm(name: string, email: string, password: string) {
    await this.displayNameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
  }

  async submitSignup() {
    await this.signupButton.click();
  }

  async signup(name: string, email: string, password: string) {
    await this.fillSignupForm(name, email, password);
    await this.submitSignup();
  }
}
