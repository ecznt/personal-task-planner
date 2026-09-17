import 'reflect-metadata';

import { resolve } from 'node:path';

import * as dotenv from 'dotenv';

dotenv.config({
  path: resolve(process.cwd(), '../../.env'),
});

process.env.DATABASE_URL ??=
  'postgresql://planner:planner_dev@127.0.0.1:5432/personal_task_planner';

import { PrismaService } from '../src/platform/database/prisma.service';
import { AccountsRepository } from '../src/modules/accounts/infrastructure/accounts.repository';
import { AuthSecurityService } from '../src/modules/accounts/security/auth-security.service';
import { LoginService } from '../src/modules/accounts/application/login.service';

const EMAIL = 'dummy@example.com';
const PASSWORD = 'correct horse battery staple';
const NETWORK_ADDRESS = '192.0.2.14';

async function verifySeed(): Promise<void> {
  const prisma = new PrismaService();
  await prisma.$connect();

  const repository = new AccountsRepository(prisma);
  const security = new AuthSecurityService();
  const login = new LoginService(repository, security);

  // 1. The seeded user must be log-in-able with the known password — this is
  //    the exact service the running API uses to authenticate real logins.
  const loginResult = await login.execute({
    email: EMAIL,
    networkAddress: NETWORK_ADDRESS,
    password: PASSWORD,
    returnTo: '/app/today',
  });
  if (loginResult.outcome !== 'AUTHENTICATED') {
    throw new Error(`Expected the user to be log-in-able; got ${loginResult.outcome}.`);
  }
  console.log(`LOGIN OK — authenticated ${loginResult.primaryEmail}`);

  // 2. The CREATE_SAMPLE_DATA graph must be present: the vast, comprehensive
  //    sample provisioning incl. a colored label (the label-color feature).
  const [areas, projects, labels, tasks, checklistItems, sessions] =
    await Promise.all([
      prisma.area.count(),
      prisma.project.count(),
      prisma.label.count(),
      prisma.task.count(),
      prisma.checklistItem.count(),
      prisma.session.count(),
    ]);

  const coloredLabel = await prisma.label.findFirst({
    where: {
      color: {
        not: null,
      },
    },
    select: {
      name: true,
      color: true,
    },
  });

  console.log({ areas, projects, labels, tasks, checklistItems, sessions, coloredLabel });

  if (
    areas === 0 ||
    projects === 0 ||
    labels === 0 ||
    tasks === 0 ||
    checklistItems === 0 ||
    coloredLabel === null
  ) {
    throw new Error(
      'Expected CREATE_SAMPLE_DATA to have provisioned the full planning graph incl. a colored label.',
    );
  }

  await prisma.$disconnect();
  console.log('SEED VERIFY OK');
}

verifySeed().catch(async (error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
