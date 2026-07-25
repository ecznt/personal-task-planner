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

test('signs in and idempotently ends only the current browser session', async ({ page }) => {
  let authenticated = true;

  await page.route('**/api/v1/auth/csrf', async (route) => {
    await route.fulfill({
      json: {
        data: {
          expiresAt: '2099-01-01T00:00:00.000Z',
          token: 'e2e-csrf-token',
        },
      },
      status: 200,
    });
  });
  await page.route('**/api/v1/auth/sessions', async (route) => {
    expect(await route.request().postDataJSON()).toEqual({
      email: 'user@example.com',
      password: 'correct-password',
      returnTo: '/app/today',
    });
    expect(route.request().headers()['x-csrf-token']).toBe('e2e-csrf-token');
    await route.fulfill({
      json: {
        data: {
          absoluteExpiresAt: '2099-01-07T00:00:00.000Z',
          authenticated: true,
          email: 'user@example.com',
          idleExpiresAt: '2099-01-01T12:00:00.000Z',
          next: '/app/today',
        },
      },
      status: 200,
    });
  });
  await page.route('**/api/v1/auth/session', async (route) => {
    if (route.request().method() === 'DELETE') {
      expect(route.request().headers()['x-csrf-token']).toBe('e2e-csrf-token');
      authenticated = false;
      await route.fulfill({
        body: '',
        status: 204,
      });
      return;
    }

    await route.fulfill({
      json: {
        data: authenticated
          ? {
              absoluteExpiresAt: '2099-01-07T00:00:00.000Z',
              authenticated: true,
              email: 'user@example.com',
              idleExpiresAt: '2099-01-01T12:00:00.000Z',
            }
          : {
              authenticated: false,
            },
      },
      status: 200,
    });
  });

  await page.goto('/login?returnTo=%2Fapp%2Ftoday');
  await page.getByLabel('E-posta').fill('user@example.com');
  await page.getByLabel('Parola').fill('correct-password');
  await page.getByRole('button', { name: 'Oturum aç' }).click();

  await expect(page).toHaveURL(/\/app\/today$/);
  await expect(page.getByRole('heading', { name: 'Oturumunuz açık' })).toBeVisible();
  await expect(page.getByText('user@example.com')).toBeVisible();

  await page.getByRole('button', { name: 'Oturumu kapat' }).click();

  await expect(page).toHaveURL(/\/login\?signedOut=1$/);
  await expect(page.getByText('Oturum kapatıldı')).toBeVisible();

  await page.goto('/app/today');
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fapp%2Ftoday$/);
});
