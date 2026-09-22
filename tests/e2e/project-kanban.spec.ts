import { expect, test, type Page } from '@playwright/test';

const PROJECT_ID = '223e4567-e89b-12d3-a456-426614174004';
const STATUS_TODO = 'status-1';
const STATUS_DONE = 'status-2';

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
  await page.route('**/api/v1/areas', async (route) => {
    await route.fulfill({ json: { data: [], meta: {} }, status: 200 });
  });
  await page.route('**/api/v1/labels', async (route) => {
    await route.fulfill({ json: { data: [], meta: {} }, status: 200 });
  });
}

async function mockProjectDetail(page: Page) {
  await page.route(`**/api/v1/projects/${PROJECT_ID}`, async (route) => {
    await route.fulfill({
      json: {
        data: {
          id: PROJECT_ID,
          areaId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Yayın Planı',
          lifecycleState: 'ACTIVE',
          version: 1,
          taskCount: 1,
          completedTaskCount: 0,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      },
      status: 200,
    });
  });
  await page.route('**/api/v1/projects?*', async (route) => {
    await route.fulfill({ json: { data: [], meta: {} }, status: 200 });
  });
  await page.route('**/api/v1/projects', async (route) => {
    await route.fulfill({ json: { data: [], meta: {} }, status: 200 });
  });
}

function kanbanPayload() {
  return {
    statuses: [
      { id: STATUS_TODO, name: 'Yapılacak', canonicalStatus: 'TO_DO', position: 1 },
      { id: STATUS_DONE, name: 'Tamamlandı', canonicalStatus: 'COMPLETED', position: 2 },
    ],
    columns: [
      {
        statusId: STATUS_TODO,
        count: 1,
        tasks: [
          {
            id: '323e4567-e89b-12d3-a456-426614174010',
            title: 'Baslık taslağı',
            priority: 'HIGH',
            canonicalStatus: 'TO_DO',
            dueAt: null,
            plannedAt: null,
            lifecycleState: 'ACTIVE',
            version: 4,
            labels: [],
            project: null,
          },
        ],
      },
      { statusId: STATUS_DONE, count: 0, tasks: [] },
    ],
  };
}

function mockKanban(page: Page) {
  return page.route(`**/api/v1/projects/${PROJECT_ID}/kanban`, async (route) => {
    await route.fulfill({ json: kanbanPayload(), status: 200 });
  });
}

function mockKanbanMove(page: Page) {
  const requests: { url: string; ifMatch: string | null; body: unknown }[] = [];
  page.route(`**/api/v1/projects/${PROJECT_ID}/kanban-moves`, async (route) => {
    requests.push({
      url: route.request().url(),
      ifMatch: route.request().headers()['if-match'] ?? null,
      body: route.request().postDataJSON(),
    });
    await route.fulfill({
      json: {
        data: {
          id: '323e4567-e89b-12d3-a456-426614174010',
          areaId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Baslık taslağı',
          priority: 'HIGH',
          canonicalStatus: 'COMPLETED',
          lifecycleState: 'ACTIVE',
          version: 5,
          labels: [],
          areaStatusId: STATUS_DONE,
        },
      },
      status: 200,
    });
  });
  return requests;
}

async function openProjectKanban(page: Page) {
  await page.goto(`/app/projects/${PROJECT_ID}`);
  await page.getByRole('button', { name: 'Kanban' }).click();
  await expect(page.getByRole('heading', { name: 'Yapılacak' })).toBeVisible();
}

test('loads the project kanban board via the view toggle', async ({ page }) => {
  await mockAuthenticatedSession(page);
  await mockProjectDetail(page);
  await mockKanban(page);

  await openProjectKanban(page);

  await expect(page.getByRole('heading', { name: 'Tamamlandı' })).toBeVisible();
  await expect(page.getByText('Baslık taslağı')).toBeVisible();
});

test('persists kanban filters in the project URL', async ({ page }) => {
  await mockAuthenticatedSession(page);
  await mockProjectDetail(page);
  await mockKanban(page);

  const requests: string[] = [];
  await page.route(`**/api/v1/projects/${PROJECT_ID}/kanban?*`, async (route) => {
    requests.push(route.request().url());
    await route.fulfill({ json: kanbanPayload(), status: 200 });
  });

  await openProjectKanban(page);

  await page.getByLabel('Öncelik:').selectOption({ label: 'Yüksek' });

  await expect(page).toHaveURL(new RegExp(`/app/projects/${PROJECT_ID}\\?priority=HIGH$`));
  await expect.poll(() => requests.some((url) => url.includes('priority=HIGH'))).toBe(true);
});

test('moves a task between statuses with the arrow button', async ({ page }) => {
  await mockAuthenticatedSession(page);
  await mockProjectDetail(page);
  await mockKanban(page);
  const moveRequests = mockKanbanMove(page);

  await openProjectKanban(page);

  await page.getByRole('button', { name: 'Baslık taslağı görevini sonraki duruma taşı' }).click();

  await expect.poll(() => moveRequests.length).toBeGreaterThan(0);
  expect(moveRequests[0].body).toEqual({
    taskId: '323e4567-e89b-12d3-a456-426614174010',
    targetAreaStatusId: STATUS_DONE,
  });
  expect(moveRequests[0].ifMatch).toBe('4');
});

test('completing a task fires the completion celebration', async ({ page }) => {
  await mockAuthenticatedSession(page);
  await mockProjectDetail(page);
  await mockKanban(page);
  await mockKanbanMove(page);

  await openProjectKanban(page);

  const celebrationLayer = page.locator('div.pointer-events-none.fixed.inset-0.z-50');

  await expect(celebrationLayer).toBeVisible();
  await expect(celebrationLayer.locator('span')).toHaveCount(0);

  await page.getByRole('button', { name: 'Baslık taslağı görevini sonraki duruma taşı' }).click();

  await expect.poll(() => celebrationLayer.locator('span').count()).toBeGreaterThan(0);
});
