import { Page } from '@playwright/test';

export const USER = {
  email: 'test@test.com',
  password: 'password',
};

export async function login({ page }: { page: Page }) {
  await page.goto('/login');

  await page.getByRole('textbox', { name: /email/i }).fill(USER.email);
  await page.getByRole('textbox', { name: /password/i }).fill(USER.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL('/');
}
