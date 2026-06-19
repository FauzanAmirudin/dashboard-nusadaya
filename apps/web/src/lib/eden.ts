import { edenTreaty } from "@elysiajs/eden";
import type { App } from "../../../api/src/index";

export const API_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Helper to get the current auth token from Zustand persisted storage
function getToken(): string | null {
	try {
		const raw = localStorage.getItem("auth-storage");
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return parsed?.state?.token ?? null;
	} catch {
		return null;
	}
}

// Create the Eden treaty client - uses Bearer token to support cross-origin requests
export const api = edenTreaty<App>(API_URL, {
	fetcher: ((url: any, options: any) => {
		const token = getToken();
		const headers = new Headers(options?.headers || {});
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}
		return fetch(url, { ...options, headers });
	}) as unknown as typeof fetch,
});
