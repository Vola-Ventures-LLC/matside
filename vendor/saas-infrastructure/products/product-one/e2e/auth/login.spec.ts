import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/auth/LoginPage';
import { DashboardPage } from '../page-objects/common/DashboardPage';

test.describe('User Authentication - Login', () => {
  test('should login with valid credentials @smoke @critical', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Navigate to login page
    await loginPage.goto();

    // Verify login page loads
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    // Perform login
    await loginPage.login(
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!
    );

    // Verify redirect to dashboard
    await dashboardPage.waitForUrl(/\/(dashboard|home)/);

    // Verify user is logged in
    await dashboardPage.expectWelcomeMessage();
  });

  test('should show error with invalid password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Try login with wrong password
    await loginPage.login(
      process.env.TEST_USER_EMAIL!,
      'WrongPassword123!'
    );

    // Verify error toast appears
    await loginPage.expectLoginError('Sign in failed');
  });

  test('should show error with non-existent email', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Try login with non-existent user
    await loginPage.login(
      'nonexistent@example.com',
      'SomePassword123!'
    );

    // Verify error toast appears
    await loginPage.expectLoginError('Sign in failed');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Click forgot password link
    await loginPage.clickForgotPassword();

    // Verify navigation
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('should navigate to signup page', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Click signup link
    await loginPage.clickSignup();

    // Verify navigation
    await expect(page).toHaveURL(/signup/);
  });
});
