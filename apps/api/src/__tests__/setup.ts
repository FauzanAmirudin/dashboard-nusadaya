// Global test setup for backend (apps/api)
import { afterEach, beforeEach } from "bun:test";

// Configure default test environment variables
(process.env as Record<string, string | undefined>).NODE_ENV = "test";
process.env.DATABASE_URL =
	process.env.DATABASE_URL || "postgresql://mock:mock@localhost:5432/test_db";
process.env.JWT_SECRET =
	process.env.JWT_SECRET || "test-jwt-secret-key-for-unit-testing-32chars";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

beforeEach(() => {
	// Reset any mock states if necessary before each test
});

afterEach(() => {
	// Clean up after each test
});
