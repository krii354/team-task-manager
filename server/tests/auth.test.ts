/**
 * Example backend test. Uses supertest against the in-memory Express app.
 * NOTE: requires a running test database. Configure via DATABASE_URL in .env.test
 * and run `npm run db:deploy` before executing tests.
 */
import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Health endpoint", () => {
  it("returns 200 with success payload", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Auth validation", () => {
  it("rejects signup with invalid email", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      name: "Test",
      email: "not-an-email",
      password: "Password123",
    });
    expect([400, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it("rejects signup with weak password", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      name: "Test",
      email: "valid@example.com",
      password: "weak",
    });
    expect([400, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it("rejects login with missing fields", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect([400, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});
