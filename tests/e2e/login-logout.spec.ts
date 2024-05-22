import { test, expect, type Page } from '@playwright/test';
import { USER } from './utils';

// TODO:
// user can sign up
// logged out user can only access home/login/signup
// logged in user can not access login/signup
// logged in user can add an expense
// logged in user can edit an expense (remove attachment)
// logged in user can edit an expense (add attachment)
// logged in user can edit an expense (replace attachment)
// logged in user can delete an expense (replace attachment)
// logged in user can generate a report
// logged in user can delete profile

// Annotate entire file as serial.
test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page.close();
});

test.only('logged out users can not access protected pages', async () => {
  await page.goto('/');

  // Logged out user sees the logged out homepage
  await expect(page).toHaveTitle(/expense manager/i);
  await expect(
    page.getByText('Expense manager', { exact: true })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  await page.getByRole('link', { name: /log in/i }).click();

  let reportError;
  try {
    await page.goto('/report');
  } catch (e: unknown) {
    reportError = e as Error;
  }

  expect(reportError?.message).toContain(
    'interrupted by another navigation to "http://127.0.0.1:3000/login'
  );

  await page.waitForURL('/login');
});

test('logged out user can log in', async () => {
  await page.goto('/');

  // Logged out user sees the logged out homepage
  await expect(page).toHaveTitle(/expense manager/i);
  await expect(
    page.getByText('Expense manager', { exact: true })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  await page.getByRole('link', { name: /log in/i }).click();

  // Wait for log in page to load
  await page.waitForURL('/login');
  await expect(page.getByText(/sign in to expense manager/i)).toBeVisible();

  await page.getByRole('textbox', { name: /email/i }).fill(USER.email);
  await page.getByRole('textbox', { name: /password/i }).fill(USER.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for logged in home (dashboard) to load
  await page.waitForURL('/');
  await expect(
    page.getByRole('list').getByRole('link', { name: 'Add expense' })
  ).toBeVisible();
  await expect(page.getByText('Dashboard', { exact: true })).toBeVisible();
});

test('logged in user can log out', async () => {
  // Logged in user sees the dashboard
  await expect(page.getByText('Dashboard', { exact: true })).toBeVisible();

  // Open profile popover
  await page.getByRole('button', { name: /profile/i }).click();
  await expect(page.getByText(USER.email)).toBeVisible();
  await page.getByRole('button', { name: /logout/i }).click();

  // Logged out user sees the logged out home
  await expect(page.getByText('Expense manager')).toBeVisible();
  await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
});
