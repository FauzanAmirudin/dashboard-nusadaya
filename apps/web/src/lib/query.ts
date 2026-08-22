import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// Cache data 30 detik sebelum dianggap stale
				staleTime: 30 * 1000,
				// Simpan di memory 5 menit
				gcTime: 5 * 60 * 1000,
				// Refetch saat window focus hanya jika stale
				refetchOnWindowFocus: false,
				// Retry 1 kali jika network error
				retry: 1,
			},
		},
	});
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
	if (typeof window === "undefined") {
		// Server: selalu buat client baru
		return makeQueryClient();
	}
	// Browser: reuse client instance
	if (!browserQueryClient) browserQueryClient = makeQueryClient();
	return browserQueryClient;
}
