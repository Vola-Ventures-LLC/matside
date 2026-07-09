import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/auth/LoginPage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '..', '..', '.auth', 'user.json');
const adminAuthFile = path.join(__dirname, '..', '..', '.auth', 'admin.json');

setup('authenticate as user', async ({ page }) => {
  console.log('🔐 Authenticating test user...');

  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.login(
    process.env.TEST_USER_EMAIL!,
    process.env.TEST_USER_PASSWORD!
  );

  // Wait for redirect to dashboard or home
  await page.waitForURL(/\/(dashboard|home)/);

  // Verify we're logged in by checking for dashboard heading or navigation
  await expect(
    page.getByRole('heading', { name: /dashboard/i, exact: false })
  ).toBeVisible({ timeout: 10000 });

  // Save signed-in state
  await page.context().storageState({ path: authFile });
  console.log('✅ User authentication saved to .auth/user.json');
});

setup('authenticate as admin', async ({ page }) => {
  console.log('🔐 Authenticating test admin...');

  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.login(
    process.env.TEST_ADMIN_EMAIL!,
    process.env.TEST_ADMIN_PASSWORD!
  );

  // Wait for redirect
  await page.waitForURL(/\/(dashboard|home|admin)/);

  // Verify logged in by checking for dashboard heading
  await expect(
    page.getByRole('heading', { name: /dashboard/i, exact: false })
  ).toBeVisible({ timeout: 10000 });

  // Wait for role to be loaded by attempting to navigate to admin page
  // The auth system loads roles asynchronously, so we need to retry until roles load
  let attempts = 0;
  let isOnAdminPage = false;

  while (attempts < 10 && !isOnAdminPage) {
    await page.goto('/admin/users');
    await page.waitForTimeout(1500);

    const currentUrl = page.url();
    isOnAdminPage = currentUrl.includes('/admin/users');
    attempts++;
  }

  if (!isOnAdminPage) {
    console.warn('⚠️  Admin role not loading - tried 10 times');
    console.warn('   Run: pnpm test:e2e:setup-roles');
  } else {
    console.log(`   ✅ Admin role verified (loaded after ${attempts} attempt(s))`);
  }

  // Save signed-in state
  await page.context().storageState({ path: adminAuthFile });
  console.log('✅ Admin authentication saved to .auth/admin.json');
});
