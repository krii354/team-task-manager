// Pre-test environment setup. Cast process.env to any so newer TS strict
// settings don't reject NODE_ENV (typed as a readonly literal union).
const env = process.env as Record<string, string | undefined>;

env.NODE_ENV = "test";
env.JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET ?? "test-access-secret-that-is-long-enough";
env.JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET ?? "test-refresh-secret-that-is-long-enough";
env.DATABASE_URL =
  env.DATABASE_URL ??
  "postgresql://ttm_user:ttm_password@localhost:5432/team_task_manager_test?schema=public";
