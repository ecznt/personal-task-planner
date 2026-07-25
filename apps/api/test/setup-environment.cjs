process.env.AUTH_SECURITY_KEY = 'test-only-auth-security-key-32-chars';
process.env.COOKIE_SECURE = 'false';
process.env.DATABASE_URL =
  'postgresql://planner:planner_test@127.0.0.1:5432/personal_task_planner_test';
process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.PUBLIC_ORIGIN = 'http://127.0.0.1:3000';
process.env.TRUST_PROXY_HOPS = '0';
process.env.WORKER_LEASE_MS = '30000';
process.env.WORKER_POLL_INTERVAL_MS = '1000';
