import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = {
	id: number;
	username: string;
	role: string;
} | null;

interface AuthState {
	user: User;
	token: string | null;
	isAuthenticated: boolean;
	login: (user: NonNullable<User>, token: string) => void;
	logout: () => void;
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
