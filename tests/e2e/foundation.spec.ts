import { expect, test } from '@playwright/test';

test('serves public product, privacy, and terms entry points', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Kişisel İş Planlayıcı' }),
  ).toBeVisible();
  await expect(page.getByText(/yalnızca size ait özel bir alanda/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Hesap oluştur' })).toHaveAttribute(
    'href',
    '/register',
  );
  await expect(page.getByRole('link', { name: 'Oturum aç' })).toHaveAttribute('href', '/login');
  await expect(page.getByRole('link', { name: 'Bugün’e devam et' })).toHaveAttribute(
    'href',
    '/app/today',
  );

  await page.getByRole('link', { name: 'Gizlilik' }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Gizlilik' })).toBeVisible();
  await expect(page.getByText(/Kullanıcılar birbirlerinin verilerini göremez/)).toBeVisible();

  await page.getByRole('link', { name: 'Kullanım koşulları' }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Kullanım koşulları' })).toBeVisible();
  await expect(page.getByText(/Ekip, organizasyon, ortak çalışma, billing/)).toBeVisible();

  await expect(page.getByText(/Google ile giriş/)).toHaveCount(0);
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

test('requests a password reset without exposing account state', async ({ page }) => {
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
  await page.route('**/api/v1/auth/password-reset-requests', async (route) => {
    expect(await route.request().postDataJSON()).toEqual({
      email: 'user@example.com',
    });
    expect(route.request().headers()['x-csrf-token']).toBe('e2e-csrf-token');
    await route.fulfill({
      json: {
        data: {
          status: 'PASSWORD_RESET_EMAIL_SENT_IF_ELIGIBLE',
        },
      },
      status: 202,
    });
  });

  await page.goto('/forgot-password');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Parolanızı sıfırlayın' }),
  ).toBeVisible();
  await page.getByLabel('E-posta').fill('user@example.com');
  await page.getByRole('button', { name: 'Sıfırlama bağlantısı gönder' }).click();

  await expect(
    page.getByText('Hesap parola sıfırlamaya uygunsa bağlantı e-posta adresine gönderilecektir.'),
  ).toBeVisible();
});

test('submits a reset token from URL fragment and removes the fragment from the URL', async ({
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
  await page.route('**/api/v1/auth/password-resets', async (route) => {
    expect(await route.request().postDataJSON()).toEqual({
      password: 'a changed password',
      passwordConfirmation: 'a changed password',
      token: 'abcdefghijklmnopqrstuvwxyzABCDEF0123456789',
    });
    expect(route.request().headers()['idempotency-key']).toEqual(expect.any(String));
    expect(route.request().headers()['x-csrf-token']).toBe('e2e-csrf-token');
    await route.fulfill({
      body: '',
      status: 204,
    });
  });

  await page.goto('/reset-password#token=abcdefghijklmnopqrstuvwxyzABCDEF0123456789');
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel('Yeni parola', { exact: true }).fill('a changed password');
  await page.getByLabel('Yeni parola tekrarı').fill('a changed password');
  await page.getByRole('button', { name: 'Yeni parolayı kaydet' }).click();

  await expect(page).toHaveURL(/\/login\?passwordReset=1$/);
  await expect(page.getByText('Parola güncellendi')).toBeVisible();
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

test('serves the authenticated onboarding model explanation without creating planning data', async ({
  page,
}) => {
  let patchedTimeZone: string | undefined;

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
  await page.route('**/api/v1/auth/session', async (route) => {
    await route.fulfill({
      json: {
        data: {
          absoluteExpiresAt: '2099-01-07T00:00:00.000Z',
          authenticated: true,
          email: 'user@example.com',
          idleExpiresAt: '2099-01-01T12:00:00.000Z',
        },
      },
      status: 200,
    });
  });
  await page.route('**/api/v1/users/me', async (route) => {
    if (route.request().method() === 'PATCH') {
      expect(await route.request().postDataJSON()).toEqual({
        timeZone: 'Europe/Istanbul',
      });
      expect(route.request().headers()['if-match']).toBe('"safe-user-etag"');
      expect(route.request().headers()['x-csrf-token']).toBe('e2e-csrf-token');
      patchedTimeZone = 'Europe/Istanbul';
      await route.fulfill({
        headers: {
          ETag: '"updated-user-etag"',
        },
        json: {
          data: {
            accountLifecycleState: 'ACTIVE',
            email: 'user@example.com',
            id: '018f9f7c-0000-7000-8000-000000000001',
            inAppReminderNotificationsEnabled: true,
            onboardingState: 'PENDING',
            timeZone: 'Europe/Istanbul',
          },
        },
        status: 200,
      });
      return;
    }

    await route.fulfill({
      headers: {
        ETag: '"safe-user-etag"',
      },
      json: {
        data: {
          accountLifecycleState: 'ACTIVE',
          email: 'user@example.com',
          id: '018f9f7c-0000-7000-8000-000000000001',
          inAppReminderNotificationsEnabled: true,
          onboardingState: 'PENDING',
          timeZone: 'UTC',
        },
      },
      status: 200,
    });
  });
  await page.route('**/api/v1/users/me/onboarding-completions', async (route) => {
    throw new Error(`L-002 must not complete onboarding: ${route.request().method()}`);
  });
  await page.route('**/api/v1/areas**', async (route) => {
    throw new Error(`L-002 must not create planning data: ${route.request().method()}`);
  });

  await page.goto('/app/onboarding');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Kişisel planlama alanınızı tanıyın' }),
  ).toBeVisible();
  await expect(page.getByText(/Area zorunlu bağlamdır/)).toBeVisible();
  await expect(page.getByText(/Project opsiyoneldir/)).toBeVisible();
  await expect(page.getByText(/Task her zaman Area’ya bağlıdır/)).toBeVisible();
  await expect(page.getByText(/Bu alan yalnızca size aittir/)).toBeVisible();
  await expect(page.getByText(/Başka kullanıcıların Area, Project veya Task/)).toBeVisible();
  await expect(page.getByText(/başlangıç tercihinizi ve saat diliminizi/)).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Başlangıç tercihinizi onaylayın' }),
  ).toBeVisible();
  await page.getByLabel('Başlangıç tercihi').selectOption('CREATE_SAMPLE_DATA');
  await page.getByLabel('Saat dilimi').selectOption('Europe/Istanbul');
  await page.getByRole('button', { name: 'Tercihi ve saat dilimini onayla' }).click();
  await expect(page.getByText('Tercih ve saat dilimi onaylandı')).toBeVisible();
  expect(patchedTimeZone).toBe('Europe/Istanbul');
  await expect(page.getByText(/Google ile giriş/)).toHaveCount(0);
  await expect(page.getByText(/ortak çalışma/i)).toHaveCount(0);
});

test('redirects unauthenticated onboarding visitors to login with onboarding return target', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/session', async (route) => {
    await route.fulfill({
      json: {
        data: {
          authenticated: false,
        },
      },
      status: 200,
    });
  });

  await page.goto('/app/onboarding');

  await expect(page).toHaveURL(/\/login\?returnTo=%2Fapp%2Fonboarding$/);
});

test('reauthenticates and starts account deletion from the danger area', async ({ page }) => {
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
  await page.route('**/api/v1/users/me', async (route) => {
    await route.fulfill({
      headers: {
        ETag: '"safe-user-etag"',
      },
      json: {
        data: {
          accountLifecycleState: 'ACTIVE',
          email: 'user@example.com',
          id: '018f9f7c-0000-7000-8000-000000000001',
          inAppReminderNotificationsEnabled: true,
          onboardingState: 'PENDING',
          timeZone: 'UTC',
        },
      },
      status: 200,
    });
  });
  await page.route('**/api/v1/auth/reauthentications', async (route) => {
    expect(await route.request().postDataJSON()).toEqual({
      action: 'ACCOUNT_DELETION',
      password: 'correct-password',
    });
    expect(route.request().headers()['x-csrf-token']).toBe('e2e-csrf-token');
    await route.fulfill({
      json: {
        data: {
          action: 'ACCOUNT_DELETION',
          expiresAt: '2099-01-01T00:15:00.000Z',
          status: 'REAUTHENTICATED',
        },
      },
      status: 200,
    });
  });
  await page.route('**/api/v1/users/me/account-deletions', async (route) => {
    expect(await route.request().postDataJSON()).toEqual({
      acknowledgedPermanentDeletion: true,
      confirmation: 'DELETE_MY_ACCOUNT',
    });
    expect(route.request().headers()['if-match']).toBe('"safe-user-etag"');
    expect(route.request().headers()['idempotency-key']).toEqual(expect.any(String));
    expect(route.request().headers()['x-csrf-token']).toBe('e2e-csrf-token');
    await route.fulfill({
      json: {
        data: {
          accessRevokedAt: '2099-01-01T00:00:00.000Z',
          primaryPurgePending: true,
          processId: '018f9f7c-0000-7000-8000-000000000099',
          requestedAt: '2099-01-01T00:00:00.000Z',
          state: 'PENDING_PRIMARY_PURGE',
        },
      },
      status: 202,
    });
  });

  await page.goto('/app/settings/account');
  await expect(page.getByRole('heading', { name: 'Hesap' })).toBeVisible();
  await expect(page.getByText(/user@example.com hesabı için/)).toBeVisible();
  await page.getByLabel('Parolanız').fill('correct-password');
  await page.getByLabel('Onay metni: DELETE_MY_ACCOUNT').fill('DELETE_MY_ACCOUNT');
  await page
    .getByLabel('Hesap silme işleminin kalıcı olduğunu ve erişimin hemen kapatılacağını anlıyorum.')
    .click();
  await page.getByRole('button', { name: 'Hesabımı sil' }).click();

  await expect(page).toHaveURL(/\/account-deletion-started$/);
  await expect(page.getByRole('heading', { name: 'Hesap silme başlatıldı' })).toBeVisible();
});
