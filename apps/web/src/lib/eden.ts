import { edenTreaty } from "@elysiajs/eden";
import type { App } from "../../../api/src/index";

export const API_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

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

/**
 * Helper to resolve uploaded file path into fully qualified URL with JWT query param
 * Works for relative paths (e.g. /files/:id/download) and absolute URLs
 */
export function getFileUrl(url: string | null | undefined): string {
	if (!url) return "";
	const token = getToken();
	let fullUrl = url;
	if (!url.startsWith("http://") && !url.startsWith("https://")) {
		const cleanPath = url.startsWith("/") ? url : `/${url}`;
		fullUrl = `${API_URL}${cleanPath}`;
	}
	if (token && !fullUrl.includes("token=")) {
		const separator = fullUrl.includes("?") ? "&" : "?";
		fullUrl += `${separator}token=${encodeURIComponent(token)}`;
	}
	return fullUrl;
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
			const res = await fetch(finalUrl, {
				...options,
				headers,
				credentials: "include",
			});

			// Handle 401 Unauthorized / Idle Timeout from backend
			if (res.status === 401) {
				try {
					const cloned = res.clone();
					const body = await cloned.json();
					if (body?.code === "IDLE_TIMEOUT") {
						if (typeof window !== "undefined") {
							// Clear auth storage & redirect to login with idle reason
							localStorage.removeItem("auth-storage");
							try {
								const channel = new BroadcastChannel(
									"nusadaya_session_channel",
								);
								channel.postMessage({ type: "IDLE_TIMEOUT" });
								channel.close();
							} catch {
								// ignore
							}
							if (!window.location.pathname.includes("/login")) {
								window.location.href = "/login?reason=idle";
							}
						}
					}
				} catch {
					// Ignore json parsing error on 401 response
				}
			}

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

// Export universal authenticated fetch helper
export async function authFetch(
	urlOrPath: string,
	options: RequestInit = {},
): Promise<Response> {
	const rawUrl = urlOrPath.startsWith("http")
		? urlOrPath
		: `${API_URL}${urlOrPath.startsWith("/") ? "" : "/"}${urlOrPath}`;
	const finalUrl = cleanUrl(rawUrl);

	const token = getToken();
	const headers = new Headers(options.headers || {});
	if (token && !headers.has("Authorization")) {
		headers.set("Authorization", `Bearer ${token}`);
	}

	try {
		const res = await fetch(finalUrl, {
			...options,
			headers,
			credentials: options.credentials || "include",
		});

		// Tangani 401 Unauthorized / Idle Timeout dari backend
		if (res.status === 401) {
			if (typeof window !== "undefined") {
				try {
					const cloned = res.clone();
					const body = await cloned.json();
					if (body?.code === "IDLE_TIMEOUT") {
						localStorage.removeItem("auth-storage");
						try {
							const channel = new BroadcastChannel("nusadaya_session_channel");
							channel.postMessage({ type: "IDLE_TIMEOUT" });
							channel.close();
						} catch {}
						if (!window.location.pathname.includes("/login")) {
							window.location.href = "/login?reason=idle";
						}
						return res;
					}
				} catch {}
				// 401 umum (token invalid / missing)
				localStorage.removeItem("auth-storage");
				if (!window.location.pathname.includes("/login")) {
					window.location.href = "/login";
				}
			}
		}

		return res;
	} catch (err: any) {
		console.warn("[authFetch] Failed to reach server:", err?.message || err);
		throw err;
	}
}
