import { execSync } from 'node:child_process';

import { expect, test } from '@playwright/test';

const WEB_URL = 'http://127.0.0.1:3000';
const MAILPIT_URL = 'http://127.0.0.1:8025';
const POSTGRES_CONTAINER = 'personal-task-planner-postgres-1';

const PASSWORD = 'e2e-calendar-password-12345';
const TIMEZONE = 'Europe/Istanbul';

test.use({ timezoneId: TIMEZONE });

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

function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

test('creates a task from the calendar day quick-add through the live stack', async ({ page }) => {
  test.skip(
    !(await isLiveStackAvailable()),
    'live stack (web, api, worker, postgres, mailpit) is not running',
  );

  test.setTimeout(120_000);

  const email = `calendar-e2e-${Date.now()}@example.test`;

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

  await page.goto('/app/calendar');

  if (page.url().includes('/app/onboarding')) {
    await page.getByLabel('Başlangıç tercihi').selectOption('START_EMPTY');
    await page.getByLabel('Saat dilimi').selectOption(TIMEZONE);
    await page.getByRole('button', { name: /Boş başla/ }).click();
    await page.waitForURL(/\/app\/today$/);
    await page.goto('/app/calendar');
  }

  // The Takvim entry is desktop-sidebar only (not in the mobile bottom nav).
  await expect(
    page.getByRole('link', { name: 'Takvim', exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/app\/calendar$/);

  const dateKey = todayKey();

  await page
    .getByRole('button', { name: `${dateKey} tarihine görev ekle` })
    .click();

  await expect(page.getByRole('heading', { name: 'Yeni görev' })).toBeVisible();
  await expect(page.getByLabel('Başlangıç Tarihi')).toHaveValue(`${dateKey}T09:00`);

  const title = 'Takvim hızlı görev';
  await page.getByLabel('Başlık').fill(title);
  await page.getByRole('button', { name: 'Oluştur' }).click();

  await expect(page.getByText('Görev eklendi')).toBeVisible();

  // The created task appears in today's calendar cell.
  await expect(page.getByRole('link', { name: title })).toBeVisible();

  await expect
    .poll(
      () =>
        dockerQuery(
          `select count(*) from tasks t join users u on u.id = t."userId" where u."primaryEmail" = '${email}' and t.title = '${title}' and t."plannedAt" is not null;`,
        ),
      { timeout: 15_000 },
    )
    .toBe('1');

  dockerQuery(`delete from users where "primaryEmail" = '${email}';`);
});