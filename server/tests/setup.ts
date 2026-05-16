process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-access-secret-that-is-long-enough";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret-that-is-long-enough";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://ttm_user:ttm_password@localhost:5432/team_task_manager_test?schema=public";
