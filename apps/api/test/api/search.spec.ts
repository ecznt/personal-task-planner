import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { SearchService } from '../../src/modules/planning/application/search.service';
import { SearchController } from '../../src/modules/planning/transport/search.controller';
import { AccountsRepository } from '../../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../../src/modules/accounts/security/auth-security.service';
import { ProblemDetailsFilter } from '../../src/platform/http/problem-details.filter';

describe('search task list HTTP contract', () => {
  let app: INestApplication;
  const searchService = {
    searchTasks: jest.fn<SearchService['searchTasks']>(),
  };
  const accountsRepository = {
    findAuthenticatedSession: jest
      .fn<AccountsRepository['findAuthenticatedSession']>()
      .mockResolvedValue({ userId: 'user-id' } as never),
  };
  const authSecurityService = {
    hashSecret: jest.fn<AuthSecurityService['hashSecret']>().mockReturnValue('hashed-token'),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        { provide: SearchService, useValue: searchService },
        { provide: AccountsRepository, useValue: accountsRepository },
        { provide: AuthSecurityService, useValue: authSecurityService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ProblemDetailsFilter(app.get(HttpAdapterHost)));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    accountsRepository.findAuthenticatedSession.mockResolvedValue({ userId: 'user-id' } as never);
    authSecurityService.hashSecret.mockReturnValue('hashed-token');
  });

  describe('GET /search/tasks', () => {
    it('searches tasks with default parameters', async () => {
      searchService.searchTasks.mockResolvedValue({
        outcome: 'SUCCESS',
        data: [],
        hasMore: false,
      });

      const response = await request(app.getHttpServer())
        .get('/search/tasks')
        .query({ q: 'grocery' })
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(response.body).toEqual({
        data: [],
        page: { hasMore: false },
      });
      expect(searchService.searchTasks).toHaveBeenCalledWith({
        userId: 'user-id',
        q: 'grocery',
        limit: 20,
        sort: 'relevance',
        order: 'desc',
      });
    });

    it('passes dateState and timezone parameters', async () => {
      searchService.searchTasks.mockResolvedValue({
        outcome: 'SUCCESS',
        data: [],
        hasMore: false,
      });

      await request(app.getHttpServer())
        .get('/search/tasks')
        .query({ q: 'taxes', dateState: 'overdue', timezone: 'UTC' })
        .set('Cookie', 'planner-session=token')
        .expect(200);

      expect(searchService.searchTasks).toHaveBeenCalledWith({
        userId: 'user-id',
        q: 'taxes',
        limit: 20,
        sort: 'relevance',
        order: 'desc',
        dateState: 'overdue',
        timezone: 'UTC',
      });
    });

    it('returns 400 without a search term', async () => {
      await request(app.getHttpServer())
        .get('/search/tasks')
        .set('Cookie', 'planner-session=token')
        .expect(400);
    });

    it('returns 400 for invalid dateState parameter', async () => {
      await request(app.getHttpServer())
        .get('/search/tasks')
        .query({ q: 'taxes', dateState: 'invalid' })
        .set('Cookie', 'planner-session=token')
        .expect(400);
    });
  });
});