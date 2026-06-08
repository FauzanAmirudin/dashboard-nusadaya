import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = {
	id: number;
	username: string;
	role: string;
} | null;

interface AuthState {
	user: User;
	isAuthenticated: boolean;
	login: (user: NonNullable<User>) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			isAuthenticated: false,
			login: (user) => set({ user, isAuthenticated: true }),
			logout: () => set({ user: null, isAuthenticated: false }),
		}),
		{
			name: "auth-storage",
		},
	),
);
