import { expect, test, type Page } from '@playwright/test';

async function mockAuthenticatedSession(page: Page) {
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
}

test.describe('Area management', () => {
  test('shows empty state when no areas exist', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await page.route('**/api/v1/areas', async (route) => {
      await route.fulfill({
        json: { data: [], meta: {} },
        status: 200,
      });
    });

    await page.goto('/app/areas');

    await expect(page.getByRole('heading', { level: 1, name: 'Alanlar' })).toBeVisible();
    await expect(page.getByText('Her görevin bir alana ihtiyacı vardır.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Yeni Alan' })).toBeVisible();
  });

  test('shows area list with counts', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await page.route('**/api/v1/areas', async (route) => {
      await route.fulfill({
        json: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Kişisel Planlama',
              lifecycleState: 'ACTIVE',
              taskCount: 5,
              projectCount: 1,
              overdueTaskCount: 2,
            },
          ],
          meta: {},
        },
        status: 200,
      });
    });

    await page.goto('/app/areas');

    await expect(page.getByRole('heading', { level: 1, name: 'Alanlar' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Kişisel Planlama/ })).toBeVisible();
    await expect(page.getByText('5 görev')).toBeVisible();
    await expect(page.getByText('1 proje')).toBeVisible();
    await expect(page.getByText('2 gecikmiş')).toBeVisible();
  });

  test('creates a new area', async ({ page }) => {
    let created = false;

    await mockAuthenticatedSession(page);
    await page.route('**/api/v1/areas', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: {
            data: created
              ? [
                  {
                    id: 'new-area-id',
                    name: 'Yeni Alan',
                    lifecycleState: 'ACTIVE',
                    taskCount: 0,
                    projectCount: 0,
                    overdueTaskCount: 0,
                  },
                ]
              : [],
            meta: {},
          },
          status: 200,
        });
        return;
      }

      created = true;
      await route.fulfill({
        json: {
          data: {
            id: 'new-area-id',
            name: 'Yeni Alan',
            lifecycleState: 'ACTIVE',
            version: 1,
            statuses: [
              {
                id: 'status-1',
                name: 'Yapılacak',
                canonicalStatus: 'TO_DO',
                position: 1,
                isDefault: true,
                active: true,
              },
              {
                id: 'status-2',
                name: 'Devam Ediyor',
                canonicalStatus: 'IN_PROGRESS',
                position: 2,
                isDefault: true,
                active: true,
              },
              {
                id: 'status-3',
                name: 'Tamamlandı',
                canonicalStatus: 'COMPLETED',
                position: 3,
                isDefault: true,
                active: true,
              },
            ],
          },
        },
        status: 201,
      });
    });

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

    await page.goto('/app/areas');

    await page.getByRole('button', { name: 'Yeni Alan' }).click();
    await page.getByLabel('Alan Adı').fill('Yeni Alan');
    await page.getByRole('button', { name: 'Oluştur', exact: true }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Alanlar' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Yeni Alan' })).toBeVisible();
  });

  test('shows area detail', async ({ page }) => {
    const areaId = '123e4567-e89b-12d3-a456-426614174000';

    await mockAuthenticatedSession(page);
    await page.route(`**/api/v1/areas/${areaId}`, async (route) => {
      await route.fulfill({
        json: {
          data: {
            id: areaId,
            name: 'Kişisel Planlama',
            lifecycleState: 'ACTIVE',
            version: 1,
            taskCount: 5,
            projectCount: 2,
            statuses: [
              {
                id: 'status-1',
                name: 'Yapılacak',
                canonicalStatus: 'TO_DO',
                position: 1,
                isDefault: true,
                active: true,
              },
            ],
          },
        },
        status: 200,
      });
    });

    await page.goto(`/app/areas/${areaId}`);

    await expect(page.getByRole('heading', { level: 1, name: 'Kişisel Planlama' })).toBeVisible();
    await expect(page.getByText('Görevler').first()).toBeVisible();
    await expect(page.getByText('Projeler').first()).toBeVisible();
    await expect(page.getByText('5', { exact: true })).toBeVisible();
    await expect(page.getByText('2', { exact: true })).toBeVisible();
    await expect(page.getByText(/Yapılacak/).first()).toBeVisible();
    await expect(page.getByRole('link', { name: '← Alanlara dön' })).toBeVisible();
  });
});
