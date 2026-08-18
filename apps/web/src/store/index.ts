import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
	id: number;
	username: string;
	role: string;
	roles?: string[];
	fullName?: string | null;
	email?: string | null;
	phone?: string | null;
	profilePhotoUrl?: string | null;
} | null;

export function getUserRoles(user: User): string[] {
	if (!user) return [];
	if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
		return user.roles;
	}
	return user.role ? [user.role] : [];
}

export function hasRole(user: User, ...requiredRoles: string[]): boolean {
	if (!user) return false;
	const userRoles = getUserRoles(user);
	if (user.role === "superadmin" || userRoles.includes("superadmin")) {
		return true;
	}
	return requiredRoles.some((r) => userRoles.includes(r));
}

interface AuthState {
	user: User;
	token: string | null;
	isAuthenticated: boolean;
	login: (user: NonNullable<User>, token: string) => void;
	logout: () => void;
	updateUser: (partialUser: Partial<NonNullable<User>>) => void;
	hasHydrated: boolean;
	setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			token: null,
			isAuthenticated: false,
			login: (user, token) => set({ user, token, isAuthenticated: true }),
			logout: () => set({ user: null, token: null, isAuthenticated: false }),
			updateUser: (partialUser) =>
				set((state) => ({
					user: state.user ? { ...state.user, ...partialUser } : null,
				})),
			hasHydrated: false,
			setHasHydrated: (state) => set({ hasHydrated: state }),
		}),
		{
			name: "auth-storage",
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true);
			},
		},
	),
);
