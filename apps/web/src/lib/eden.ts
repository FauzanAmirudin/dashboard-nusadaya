import { edenTreaty } from "@elysiajs/eden";
import type { App } from "../../../api/src/index";

export const API_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Helper to get the current auth token from Zustand persisted storage
export function getToken(): string | null {
	try {
		const raw = localStorage.getItem("auth-storage");
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return parsed?.state?.token ?? null;
	} catch {
		return null;
	}
}

function cleanUrl(rawUrl: string | URL): string {
	try {
		const urlObj =
			typeof rawUrl === "string" ? new URL(rawUrl) : new URL(rawUrl.toString());
		const params = new URLSearchParams(urlObj.search);
		const keysToDelete: string[] = [];

		params.forEach((val, key) => {
			if (val === "undefined" || val === "null" || val === "") {
				keysToDelete.push(key);
			}
		});

		keysToDelete.forEach((key) => params.delete(key));
		urlObj.search = params.toString();
		return urlObj.toString();
	} catch {
		return rawUrl.toString();
	}
}

// Create the Eden treaty client with resilient error handling
export const api = edenTreaty<App>(API_URL, {
	fetcher: (async (url: any, options: any) => {
		const token = getToken();
		const headers = new Headers(options?.headers || {});
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}
		const finalUrl = cleanUrl(url);
		try {
			const res = await fetch(finalUrl, { ...options, headers });
			return res;
		} catch (err: any) {
			console.warn(
				"[API Network] Failed to reach server:",
				err?.message || err,
			);
			return new Response(
				JSON.stringify({
					success: false,
					message: "Tidak dapat terhubung ke server backend.",
				}),
				{
					status: 503,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	}) as unknown as typeof fetch,
});
