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

function taskPayload(description: string) {
  return {
    data: {
      id: '223e4567-e89b-12d3-a456-426614174001',
      areaId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Markdown görev',
      description,
      plannedAt: null,
      dueAt: null,
      priority: 'MEDIUM',
      areaStatusId: 'status-1',
      canonicalStatus: 'TO_DO',
      lifecycleState: 'ACTIVE',
      version: 1,
      labels: [],
      checklistItems: [],
      projectId: null,
      parentTaskId: null,
      subtaskCount: 0,
      completedSubtaskCount: 0,
      parentTask: null,
      subtasks: [],
      recurrence: null,
    },
  };
}

test('renders the task description as safe markdown', async ({ page }) => {
  await mockAuthenticatedSession(page);
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
  await page.route('**/api/v1/tasks/223e4567-e89b-12d3-a456-426614174001', async (route) => {
    await route.fulfill({
      json: taskPayload('# Notlar\n\n**kalın**: [güvenli](https://example.com)'),
      status: 200,
    });
  });
  await page.route('**/api/v1/projects*', async (route) => {
    await route.fulfill({
      json: { data: [], meta: {} },
      status: 200,
    });
  });

  await page.goto('/app/areas/tasks/223e4567-e89b-12d3-a456-426614174001');

  await expect(page.getByText('Markdown görev', { exact: true })).toBeVisible();
  const description = page.getByTestId('task-description-render');
  await expect(description.getByRole('heading', { name: 'Notlar' })).toBeVisible();
  await expect(description.getByText('kalın')).toBeVisible();
  await expect(description.getByRole('link', { name: 'güvenli' })).toHaveAttribute(
    'href',
    'https://example.com/',
  );
});

test('blocks javascript links and injected HTML in the description', async ({ page }) => {
  await mockAuthenticatedSession(page);
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
  await page.route('**/api/v1/tasks/223e4567-e89b-12d3-a456-426614174001', async (route) => {
    await route.fulfill({
      json: taskPayload('[tıkla](javascript:alert(1)) <img src=x onerror=alert(1)>'),
      status: 200,
    });
  });
  await page.route('**/api/v1/projects*', async (route) => {
    await route.fulfill({
      json: { data: [], meta: {} },
      status: 200,
    });
  });

  await page.goto('/app/areas/tasks/223e4567-e89b-12d3-a456-426614174001');

  const description = page.getByTestId('task-description-render');
  await expect(description.getByRole('link')).toHaveCount(0);
  await expect(description.locator('img')).toHaveCount(0);
  await expect(
    description.getByText('[tıkla](javascript:alert(1)) <img src=x onerror=alert(1)>'),
  ).toBeVisible();
});
