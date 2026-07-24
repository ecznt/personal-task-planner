import { expect, test } from '@playwright/test';

test('serves the production-built Turkish foundation shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Kişisel İş Planlayıcı' }),
  ).toBeVisible();
  await expect(page.getByText(/Ürün özellikleri henüz başlamadı/)).toBeVisible();
});
