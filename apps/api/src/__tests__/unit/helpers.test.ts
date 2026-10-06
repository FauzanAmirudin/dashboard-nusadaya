import { describe, expect, it } from "bun:test";
import { getUserRoles, hasRole } from "../../lib/permissions";
import { createMockDb } from "../helpers/mockDb";
import {
	createAdminUser,
	createAkademikUser,
	createAnonymousUser,
	createCrmUser,
	createFinanceUser,
	createMockUser,
	createMultiRoleUser,
	createSuperadminUser,
} from "../helpers/mockUser";

describe("Backend Test Helpers", () => {
	describe("mockUser", () => {
		it("should create user with default role", () => {
			const user = createMockUser();
			expect(user.id).toBeDefined();
			expect(user.role).toBe("mahasiswa");
			expect(user.roles).toEqual(["mahasiswa"]);
		});

		it("should create superadmin and bypass role checks", () => {
			const superadmin = createSuperadminUser();
			expect(hasRole(superadmin, "akademik")).toBe(true);
			expect(hasRole(superadmin, "finance")).toBe(true);
		});

		it("should create admin as alias for superadmin", () => {
			const admin = createAdminUser();
			expect(hasRole(admin, "superadmin")).toBe(true);
		});

		it("should create finance user and match finance role only", () => {
			const finance = createFinanceUser();
			expect(hasRole(finance, "finance")).toBe(true);
			expect(hasRole(finance, "akademik")).toBe(false);
		});

		it("should create multi-role user", () => {
			const multi = createMultiRoleUser("crm", ["pmb", "akademik"]);
			expect(getUserRoles(multi)).toContain("crm");
			expect(getUserRoles(multi)).toContain("pmb");
			expect(getUserRoles(multi)).toContain("akademik");
			expect(hasRole(multi, "pmb")).toBe(true);
		});

		it("should handle anonymous user", () => {
			const anon = createAnonymousUser();
			expect(anon).toBeNull();
			expect(hasRole(anon, "mahasiswa")).toBe(false);
		});
	});

	describe("mockDb", () => {
		it("should mock findFirst and findMany query methods", async () => {
			const mockDb = createMockDb();
			mockDb.setQueryResult("users", "findFirst", { id: 10, username: "john" });
			mockDb.setQueryResult("courses", "findMany", [{ id: 1 }, { id: 2 }]);

			const user = await mockDb.query.users.findFirst({ where: {} as any });
			const courses = await mockDb.query.courses.findMany();

			expect(user).toEqual({ id: 10, username: "john" });
			expect(courses).toHaveLength(2);
			expect(mockDb.query.users.findFirst).toHaveBeenCalled();
		});

		it("should mock chainable update and insert operations", async () => {
			const mockDb = createMockDb();
			const result = await mockDb
				.update({} as any)
				.set({ name: "Updated" })
				.where({} as any)
				.returning();

			expect(result).toEqual([{ id: 1 }]);
			expect(mockDb.update).toHaveBeenCalled();
		});

		it("should execute transaction callback", async () => {
			const mockDb = createMockDb();
			let called = false;
			await mockDb.transaction(async (tx: typeof mockDb) => {
				called = true;
				expect(tx).toBeDefined();
			});
			expect(called).toBe(true);
		});
	});
});
