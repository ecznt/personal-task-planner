import { expect, test } from '@playwright/test';

test('serves the production-built Turkish foundation shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Kişisel İş Planlayıcı' }),
  ).toBeVisible();
  await expect(page.getByText(/Ürün özellikleri henüz başlamadı/)).toBeVisible();
});

test('serves the manual email verification form without exposing a code in the URL', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/csrf', async (route) => {
    await route.fulfill({
      json: {
        data: {
          expiresAt: new Date(Date.now() + 30 * 60 * 1_000).toISOString(),
          token: 'e2e-csrf-token',
        },
      },
      status: 200,
    });
  });
  await page.goto('/verify-email');

  await expect(
    page.getByRole('heading', { level: 1, name: 'E-postanızı kontrol edin' }),
  ).toBeVisible();
  await expect(page.getByLabel('E-posta')).toBeVisible();
  await expect(page.getByLabel('8 haneli doğrulama kodu')).toBeVisible();
  await expect(page.getByRole('button', { name: 'E-postayı doğrula' })).toBeVisible();
  await expect(page).toHaveURL(/\/verify-email$/);
});
