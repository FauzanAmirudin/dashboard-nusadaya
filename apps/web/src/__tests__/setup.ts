// Global test setup for frontend (apps/web)
import { afterEach, beforeEach } from "bun:test";

(process.env as Record<string, string | undefined>).NODE_ENV = "test";
process.env.NEXT_PUBLIC_API_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// In-memory mock localStorage for Zustand persist and browser storage
if (typeof globalThis.localStorage === "undefined") {
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

beforeEach(() => {
	globalThis.localStorage.clear();
});

afterEach(() => {
	// Cleanup
});
