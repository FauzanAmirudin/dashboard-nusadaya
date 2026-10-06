import { beforeEach, describe, expect, it } from "bun:test";
import { getUserRoles, hasRole, useAuthStore } from "../../store";
import {
	createAkademikWebUser,
	createFinanceWebUser,
	createMockWebUser,
	createSuperadminWebUser,
	resetAuthStore,
	setMockAuthState,
} from "../helpers/mockStore";

describe("Frontend Test Helpers", () => {
	beforeEach(() => {
		resetAuthStore();
	});

	describe("mockStore - User Factory", () => {
		it("should create default mock user with role and roles", () => {
			const user = createMockWebUser("mahasiswa");
			expect(user.id).toBeDefined();
			expect(user.role).toBe("mahasiswa");
			expect(user.roles).toEqual(["mahasiswa"]);
		});

		it("should create superadmin user and verify role permission", () => {
			const superadmin = createSuperadminWebUser();
			expect(hasRole(superadmin, "superadmin")).toBe(true);
			expect(hasRole(superadmin, "finance")).toBe(true);
		});

		it("should create finance user and verify strict role check", () => {
			const finance = createFinanceWebUser();
			expect(hasRole(finance, "finance")).toBe(true);
			expect(hasRole(finance, "akademik")).toBe(false);
		});
	});

	describe("mockStore - Zustand Store Manipulation", () => {
		it("should initialize with empty state after reset", () => {
			const state = useAuthStore.getState();
			expect(state.user).toBeNull();
			expect(state.isAuthenticated).toBe(false);
		});

		it("should update auth state via setMockAuthState", () => {
			const akademikUser = createAkademikWebUser();
			setMockAuthState({ user: akademikUser });

			const state = useAuthStore.getState();
			expect(state.isAuthenticated).toBe(true);
			expect(state.user?.role).toBe("akademik");
			expect(getUserRoles(state.user)).toContain("akademik");
		});

		it("should handle login and logout store actions", () => {
			const user = createMockWebUser("crm");
			useAuthStore.getState().login(user, "test-token-123");

			let state = useAuthStore.getState();
			expect(state.isAuthenticated).toBe(true);
			expect(state.token).toBe("test-token-123");

			useAuthStore.getState().logout();
			state = useAuthStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
		});
	});
});
