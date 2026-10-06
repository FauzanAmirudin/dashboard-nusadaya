// Ensure localStorage polyfill is initialized before store import
if (
	typeof globalThis.localStorage === "undefined" ||
	typeof (globalThis as any).window === "undefined"
) {
	const storageMap = new Map<string, string>();
	const storage = {
		getItem: (key: string) => storageMap.get(key) ?? null,
		setItem: (key: string, value: string) => {
			storageMap.set(key, String(value));
		},
		removeItem: (key: string) => {
			storageMap.delete(key);
		},
		clear: () => {
			storageMap.clear();
		},
		key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
		get length() {
			return storageMap.size;
		},
	} as Storage;

	globalThis.localStorage = storage;
	if (typeof (globalThis as any).window === "undefined") {
		(globalThis as any).window = globalThis;
	}
	(globalThis as any).window.localStorage = storage;
}

import { create } from "zustand";
import { type User, useAuthStore } from "../../store";

let nextWebUserId = 1;

/**
 * Factory for creating mock frontend User objects.
 */
export function createMockWebUser(
	role = "mahasiswa",
	overrides?: Partial<NonNullable<User>>,
): NonNullable<User> {
	const id = overrides?.id ?? nextWebUserId++;
	return {
		id,
		username: overrides?.username ?? `${role}_${id}`,
		role,
		roles: overrides?.roles ?? [role],
		fullName: overrides?.fullName ?? `User ${role.toUpperCase()} ${id}`,
		email: overrides?.email ?? `${role}${id}@example.com`,
		phone: overrides?.phone ?? `+628120000${id.toString().padStart(4, "0")}`,
		profilePhotoUrl: overrides?.profilePhotoUrl ?? null,
		...overrides,
	};
}

export const createSuperadminWebUser = (
	overrides?: Partial<NonNullable<User>>,
) => createMockWebUser("superadmin", overrides);

export const createAkademikWebUser = (overrides?: Partial<NonNullable<User>>) =>
	createMockWebUser("akademik", overrides);

export const createFinanceWebUser = (overrides?: Partial<NonNullable<User>>) =>
	createMockWebUser("finance", overrides);

export const createCrmWebUser = (overrides?: Partial<NonNullable<User>>) =>
	createMockWebUser("crm", overrides);

export const createPmbWebUser = (overrides?: Partial<NonNullable<User>>) =>
	createMockWebUser("pmb", overrides);

export const createDosenWebUser = (overrides?: Partial<NonNullable<User>>) =>
	createMockWebUser("dosen", overrides);

export const createMahasiswaWebUser = (
	overrides?: Partial<NonNullable<User>>,
) => createMockWebUser("mahasiswa", overrides);

/**
 * Resets the global useAuthStore to its clean initial state.
 */
export function resetAuthStore() {
	useAuthStore.setState({
		user: null,
		token: null,
		isAuthenticated: false,
		hasHydrated: true,
	});
}

/**
 * Sets specific state on the global useAuthStore for test scenarios.
 */
export function setMockAuthState(state: {
	user?: User;
	token?: string | null;
	isAuthenticated?: boolean;
	hasHydrated?: boolean;
}) {
	useAuthStore.setState({
		user: state.user ?? null,
		token: state.token ?? (state.user ? "mock-jwt-token" : null),
		isAuthenticated: state.isAuthenticated ?? Boolean(state.user),
		hasHydrated: state.hasHydrated ?? true,
	});
}

/**
 * Creates an isolated, non-persisted Zustand auth store instance.
 */
export function createIsolatedAuthStore(initialUser: User = null) {
	return create<{
		user: User;
		token: string | null;
		isAuthenticated: boolean;
		hasHydrated: boolean;
		login: (user: NonNullable<User>, token: string) => void;
		logout: () => void;
		updateUser: (partialUser: Partial<NonNullable<User>>) => void;
	}>((set) => ({
		user: initialUser,
		token: initialUser ? "mock-isolated-token" : null,
		isAuthenticated: Boolean(initialUser),
		hasHydrated: true,
		login: (user, token) => set({ user, token, isAuthenticated: true }),
		logout: () => set({ user: null, token: null, isAuthenticated: false }),
		updateUser: (partialUser) =>
			set((state) => ({
				user: state.user ? { ...state.user, ...partialUser } : null,
			})),
	}));
}
