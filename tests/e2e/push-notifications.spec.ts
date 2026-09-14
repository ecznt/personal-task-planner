import { execSync } from 'node:child_process';

import { expect, test, type Page } from '@playwright/test';

const WEB_URL = 'http://127.0.0.1:3000';
const MAILPIT_URL = 'http://127.0.0.1:8025';
const POSTGRES_CONTAINER = 'personal-task-planner-postgres-1';

const PASSWORD = 'e2e-push-password-12345';

function dockerQuery(sql: string): string {
  return execSync(
    `docker exec -i ${POSTGRES_CONTAINER} psql -U planner -d personal_task_planner -t -A`,
    {
      input: sql,
      encoding: 'utf8',
    },
  ).trim();
}

async function fetchJson(url: string): Promise<Record<string, unknown>> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unreachable ${url}: ${response.status}`);
  }
  return (await response.json()) as Record<string, unknown>;
}

async function isLiveStackAvailable(): Promise<boolean> {
  try {
    await fetchJson(`${WEB_URL}/api/v1/version`);
    await fetchJson(`${MAILPIT_URL}/api/v1/messages?limit=1`);
    dockerQuery('select 1;');
    return true;
  } catch {
    return false;
  }
}

async function verificationCodeFor(email: string): Promise<string> {
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    const data = (await fetchJson(`${MAILPIT_URL}/api/v1/messages?limit=20`)) as unknown as {
      messages?: Array<{
        ID: string;
        To?: unknown;
      }>;
    };

    const message = (data.messages ?? []).find((item) => {
      const recipients = item.To;

      if (Array.isArray(recipients)) {
        return recipients.some((entry: { Address?: string }) => entry.Address === email);
      }

      if (typeof recipients === 'string') {
        return recipients.includes(email);
      }

      return false;
    });

    if (message !== undefined) {
      const detail = (await fetchJson(
        `${MAILPIT_URL}/api/v1/message/${message.ID}`,
      )) as unknown as { Text?: string; HTML?: string };
      const body = detail.Text ?? detail.HTML ?? '';
      const standalone = body.match(/^\d{8}$/m) ?? body.match(/(^|\D)(\d{8})($|\D)/);
      const code = standalone?.[2] ?? standalone?.[0]?.match(/\d{8}/)?.[0];

      if (code !== undefined) {
        return code;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error('Verification email or plain 8-digit code not found in MailPit');
}

async function openPreferences(page: Page): Promise<void> {
  await page.goto('/app/settings/preferences');

  if (page.url().includes('/app/onboarding')) {
    await page.getByLabel('Başlangıç tercihi').selectOption('START_EMPTY');
    await page.getByLabel('Saat dilimi').selectOption('Europe/Istanbul');
    await page.getByRole('button', { name: /Boş başla/ }).click();
    await page.waitForURL(/\/app\/today$/);
    await page.goto('/app/settings/preferences');
  }

  await expect(page.getByRole('heading', { name: 'Saat dilimi' })).toBeVisible();
}

test('registers, removes, and re-registers a web push subscription through the live stack', async ({
  page,
  context,
}) => {
  test.skip(
    !(await isLiveStackAvailable()),
    'live stack (web, api, worker, postgres, mailpit) is not running',
  );

  test.setTimeout(120_000);

  // Make the browser push-subscribe hop deterministic: prefer the real push service
  // and fall back to a synthetic registration when it is unreachable (e.g. offline CI).
  // The fallback is kept in a shared store so getSubscription() still sees it after
  // unregistering the page-side subscription (the disable flow depends on that).
  await context.addInitScript(() => {
    class GrantedNotification {
      static permission = 'granted';

      static requestPermission(): Promise<NotificationPermission> {
        return Promise.resolve('granted');
      }
    }

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: GrantedNotification,
    });

    const realSubscribe = PushManager.prototype.subscribe;
    const realGetSubscription = PushManager.prototype.getSubscription;
    let syntheticSubscription: PushSubscription | null = null;

    function createSyntheticSubscription(): PushSubscription {
      return {
        endpoint: `https://push.example.test/device-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        getKey(name: 'p256dh' | 'auth') {
          if (name === 'p256dh') {
            return new Uint8Array([200, 3, 9]).buffer;
          }
          if (name === 'auth') {
            return new Uint8Array([5, 6, 7]).buffer;
          }
          return null;
        },
        unsubscribe() {
          return Promise.resolve(true);
        },
      } as PushSubscription;
    }

    PushManager.prototype.subscribe = function subscribeWithFallback(
      options: PushSubscriptionOptionsInit,
    ): Promise<PushSubscription> {
      return Promise.race([
        realSubscribe.call(this, options).then((subscription) => {
          syntheticSubscription = null;
          return subscription;
        }),
        new Promise<PushSubscription>((resolve) => {
          const fallback = createSyntheticSubscription();
          setTimeout(() => {
            syntheticSubscription = fallback;
            resolve(fallback);
          }, 3_000);
        }),
      ]).catch(() => {
        const fallback = createSyntheticSubscription();
        syntheticSubscription = fallback;
        return fallback;
      });
    };

    PushManager.prototype.getSubscription = function getSubscriptionWithFallback() {
      return realGetSubscription
        .call(this)
        .then(
          (subscription) =>
            subscription ?? (syntheticSubscription === null ? null : syntheticSubscription),
        );
    };
  });

  await context.grantPermissions(['notifications'], { origin: WEB_URL });
  page.on('dialog', (dialog) => void dialog.accept());

  const email = `push-e2e-${Date.now()}@example.test`;

  dockerQuery(`delete from users where "primaryEmail" = '${email}';`);

  await page.goto('/register');
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Parola', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Parola tekrarı').fill(PASSWORD);
  await page.getByRole('checkbox', { name: 'Kullanım koşullarını kabul ediyorum.' }).check();
  await page.getByRole('button', { name: 'Hesap oluştur' }).click();
  await page.waitForURL(/\/verify-email$/);

  const code = await verificationCodeFor(email);

  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('8 haneli doğrulama kodu').click();
  await page.keyboard.type(code, { delay: 30 });
  await page.getByRole('button', { name: 'E-postayı doğrula' }).click();
  await expect(page.getByText('E-posta doğrulandı')).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Parola', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Oturum aç' }).click();
  await page.waitForURL(/\/app\//);

  // The preference defaults to enabled, so mounting auto-syncs an existing subscription.
  // Attach the listener before navigating so the request that fires during the page load is caught.
  const firstPostPromise = page.waitForRequest(
    (request) =>
      request.method() === 'POST' && request.url().includes('/api/v1/push-subscriptions'),
  );

  await openPreferences(page);

  const pushToggle = page.getByRole('checkbox', { name: 'Tarayıcı bildirimleri' });
  await expect(pushToggle).toBeChecked();

  const firstPost = await firstPostPromise;
  const firstRegistration = (await firstPost.postDataJSON()) as {
    endpoint: string;
  };

  await expect
    .poll(
      () =>
        dockerQuery(
          `select count(*) from push_subscriptions ps join users u on u.id = ps."userId" where u."primaryEmail" = '${email}' and ps.endpoint = '${firstRegistration.endpoint}';`,
        ),
      { timeout: 15_000 },
    )
    .toBe('1');

  // Disabling unsubscribes in the browser and removes the server-side registration.
  await pushToggle.uncheck();
  await page.waitForRequest(
    (request) =>
      request.method() === 'DELETE' && request.url().includes('/api/v1/push-subscriptions'),
  );
  await expect
    .poll(
      () =>
        dockerQuery(
          `select count(*) from push_subscriptions where "userId" = (select id from users where "primaryEmail" = '${email}');`,
        ),
      { timeout: 15_000 },
    )
    .toBe('0');

  // Re-enabling registers a fresh subscription again.
  await pushToggle.check();
  const secondPost = await page.waitForRequest(
    (request) =>
      request.method() === 'POST' && request.url().includes('/api/v1/push-subscriptions'),
  );
  const secondRegistration = (await secondPost.postDataJSON()) as {
    endpoint: string;
  };

  await expect
    .poll(
      () =>
        dockerQuery(
          `select count(*) from push_subscriptions ps join users u on u.id = ps."userId" where u."primaryEmail" = '${email}' and ps.endpoint = '${secondRegistration.endpoint}';`,
        ),
      { timeout: 15_000 },
    )
    .toBe('1');

  dockerQuery(`delete from users where "primaryEmail" = '${email}';`);
});
