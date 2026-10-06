import { describe, expect, it } from "bun:test";
import { type AuthUser, getUserRoles, hasRole } from "../../lib/permissions";
import {
	createAnonymousUser,
	createCrmUser,
	createFinanceUser,
	createMockUser,
	createMultiRoleUser,
	createSuperadminUser,
} from "../helpers/mockUser";

describe("Tahap 2: Authorization dan Permission Layer (permissions.ts)", () => {
	// Task 2.1: getUserRoles()
	describe("Task 2.1 — getUserRoles()", () => {
		it("should return single role in array for user with primary role", () => {
			const user = createCrmUser();
			const roles = getUserRoles(user);
			expect(roles).toEqual(["crm"]);
		});

		it("should return both primary role and additional roles from roles array", () => {
			const user: AuthUser = {
				id: 1,
				username: "multi_user",
				role: "crm",
				roles: ["pmb", "crm", "akademik"],
			};
			const roles = getUserRoles(user);
			expect(roles).toHaveLength(3);
			expect(roles).toContain("crm");
			expect(roles).toContain("pmb");
			expect(roles).toContain("akademik");
		});

		it("should deduplicate roles when primary role exists in roles array", () => {
			const user: AuthUser = {
				id: 2,
				username: "dedup_user",
				role: "finance",
				roles: ["finance", "FINANCE", " finance "],
			};
			const roles = getUserRoles(user);
			expect(roles).toEqual(["finance"]);
		});

		it("should return empty array when user is null", () => {
			const user = createAnonymousUser();
			expect(getUserRoles(user)).toEqual([]);
		});

		it("should normalize uppercase role to lowercase", () => {
			const user: AuthUser = {
				id: 3,
				username: "upper_user",
				role: "CRM",
				roles: ["PMB", "DOSEN"],
			};
			const roles = getUserRoles(user);
			expect(roles).toContain("crm");
			expect(roles).toContain("pmb");
			expect(roles).toContain("dosen");
			expect(roles).not.toContain("CRM");
		});

		it("should trim whitespace from roles", () => {
			const user: AuthUser = {
				id: 4,
				username: "spaced_user",
				role: "  akademik  ",
				roles: ["  magang  ", " "],
			};
			const roles = getUserRoles(user);
			expect(roles).toContain("akademik");
			expect(roles).toContain("magang");
			expect(roles).not.toContain("  akademik  ");
		});

		it("should handle user with undefined roles array safely", () => {
			const user: AuthUser = {
				id: 5,
				username: "no_roles_arr",
				role: "dosen",
			};
			const roles = getUserRoles(user);
			expect(roles).toEqual(["dosen"]);
		});
	});

	// Task 2.2: hasRole() — SECURITY CRITICAL
	describe("Task 2.2 — hasRole() — SECURITY CRITICAL", () => {
		it("should grant superadmin full access to any role", () => {
			const superadmin = createSuperadminUser();
			expect(hasRole(superadmin, "crm")).toBe(true);
			expect(hasRole(superadmin, "pmb")).toBe(true);
			expect(hasRole(superadmin, "finance")).toBe(true);
			expect(hasRole(superadmin, "akademik")).toBe(true);
			expect(hasRole(superadmin, "evaluator")).toBe(true);
			expect(hasRole(superadmin, "arbitrary_custom_role")).toBe(true);
		});

		it("should grant access when user has the exact matching role", () => {
			const crmUser = createCrmUser();
			expect(hasRole(crmUser, "crm")).toBe(true);
		});

		it("should forbid access when user does not have the required role", () => {
			const crmUser = createCrmUser();
			expect(hasRole(crmUser, "pmb")).toBe(false);
			expect(hasRole(crmUser, "finance")).toBe(false);
			expect(hasRole(crmUser, "akademik")).toBe(false);
		});

		it("should return false for null (unauthenticated) user under all circumstances", () => {
			const anon = createAnonymousUser();
			expect(hasRole(anon, "crm")).toBe(false);
			expect(hasRole(anon, "superadmin")).toBe(false);
			expect(hasRole(anon, "mahasiswa")).toBe(false);
		});

		it("should grant access if role is present in additional roles array", () => {
			const user: AuthUser = {
				id: 10,
				username: "hybrid_staff",
				role: "dosen",
				roles: ["dosen", "akademik"],
			};
			expect(hasRole(user, "dosen")).toBe(true);
			expect(hasRole(user, "akademik")).toBe(true);
			expect(hasRole(user, "finance")).toBe(false);
		});

		it("should return true if user possesses any of multiple required roles", () => {
			const financeUser = createFinanceUser();
			// Resource accessible by either finance or superadmin or pmb
			expect(hasRole(financeUser, "pmb", "finance", "akademik")).toBe(true);
			// Resource accessible only by pmb or akademik
			expect(hasRole(financeUser, "pmb", "akademik")).toBe(false);
		});

		it("should perform case-insensitive role comparisons", () => {
			const user: AuthUser = {
				id: 11,
				username: "case_test",
				role: "CRM",
				roles: ["PMB"],
			};
			// User role uppercase, requirement lowercase
			expect(hasRole(user, "crm")).toBe(true);
			expect(hasRole(user, "pmb")).toBe(true);
			// Requirement uppercase, user role lowercase
			const lowerUser = createCrmUser();
			expect(hasRole(lowerUser, "CRM")).toBe(true);
		});

		it("should grant bypass if superadmin is in additional roles array even if primary role is different", () => {
			const disguisedSuperadmin: AuthUser = {
				id: 99,
				username: "disguised",
				role: "dosen",
				roles: ["dosen", "superadmin"],
			};
			expect(hasRole(disguisedSuperadmin, "finance")).toBe(true);
			expect(hasRole(disguisedSuperadmin, "pmb")).toBe(true);
		});

		it("should deny access when user has empty role and roles", () => {
			const emptyUser: AuthUser = {
				id: 100,
				username: "empty_role",
				role: "",
				roles: [],
			};
			expect(hasRole(emptyUser, "crm")).toBe(false);
			expect(hasRole(emptyUser, "superadmin")).toBe(false);
		});
	});
});
