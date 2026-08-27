"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

/**
 * Idle Timer Configuration:
 * - IDLE_TIMEOUT_MS: 30 minutes (1800000 ms)
 * - WARNING_BEFORE_MS: 2 minutes (120000 ms)
 * - THROTTLE_ACTIVITY_MS: 5 seconds (to prevent excessive writes)
 */
export const IDLE_CONFIG = {
	IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
	WARNING_BEFORE_MS: 2 * 60 * 1000, // 2 minutes before timeout
	THROTTLE_ACTIVITY_MS: 5 * 1000, // 5 seconds
	STORAGE_KEY: "nusadaya_last_activity",
	CHANNEL_NAME: "nusadaya_session_channel",
};

export type SessionBroadcastMessage =
	| { type: "ACTIVITY"; timestamp: number }
	| { type: "STAY_LOGGED_IN"; timestamp: number }
	| { type: "IDLE_TIMEOUT" }
	| { type: "LOGOUT" };

export function useIdleTimer() {
	const { isAuthenticated, logout, hasHydrated } = useAuthStore();
	const [isWarningOpen, setIsWarningOpen] = useState(false);
	const [remainingSeconds, setRemainingSeconds] = useState(
		Math.floor(IDLE_CONFIG.WARNING_BEFORE_MS / 1000),
	);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const lastActivityRef = useRef<number>(Date.now());
	const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
	const throttleTimerRef = useRef<number>(0);

	// Safe local storage getter
	const getLastActivityFromStorage = useCallback((): number => {
		if (typeof window === "undefined") return Date.now();
		try {
			const saved = localStorage.getItem(IDLE_CONFIG.STORAGE_KEY);
			return saved ? parseInt(saved, 10) : Date.now();
		} catch {
			return Date.now();
		}
	}, []);

	// Safe local storage setter
	const setLastActivityToStorage = useCallback((time: number) => {
		if (typeof window === "undefined") return;
		try {
			localStorage.setItem(IDLE_CONFIG.STORAGE_KEY, time.toString());
		} catch {
			// ignore storage errors
		}
	}, []);

	// Broadcast message to other tabs
	const broadcast = useCallback((msg: SessionBroadcastMessage) => {
		try {
			if (broadcastChannelRef.current) {
				broadcastChannelRef.current.postMessage(msg);
			}
		} catch {
			// ignore broadcast errors
		}
	}, []);

	// Record client activity (throttled)
	const recordActivity = useCallback(
		(syncWithTabs = true) => {
			const now = Date.now();
			// Throttle recording
			if (now - throttleTimerRef.current < IDLE_CONFIG.THROTTLE_ACTIVITY_MS) {
				return;
			}
			throttleTimerRef.current = now;
			lastActivityRef.current = now;
			setLastActivityToStorage(now);

			if (syncWithTabs) {
				broadcast({ type: "ACTIVITY", timestamp: now });
			}
		},
		[broadcast, setLastActivityToStorage],
	);

	// Action to trigger logout
	const performLogout = useCallback(
		(reason: "idle" | "manual" = "idle") => {
			setIsWarningOpen(false);
			logout();
			if (reason === "idle") {
				broadcast({ type: "IDLE_TIMEOUT" });
				if (typeof window !== "undefined") {
					window.location.href = "/login?reason=idle";
				}
			} else {
				broadcast({ type: "LOGOUT" });
				if (typeof window !== "undefined") {
					window.location.href = "/login";
				}
			}
		},
		[logout, broadcast],
	);

	// Action when user clicks "Tetap Masuk"
	const stayLoggedIn = useCallback(async () => {
		setIsRefreshing(true);
		try {
			// Call backend touch endpoint to extend session in Redis
			await api.auth.touch.post();
		} catch (err) {
			console.warn("[IdleTimer] Failed to touch backend session:", err);
		} finally {
			setIsRefreshing(false);
		}

		const now = Date.now();
		lastActivityRef.current = now;
		setLastActivityToStorage(now);
		setIsWarningOpen(false);
		setRemainingSeconds(Math.floor(IDLE_CONFIG.WARNING_BEFORE_MS / 1000));
		broadcast({ type: "STAY_LOGGED_IN", timestamp: now });
	}, [broadcast, setLastActivityToStorage]);

	// BroadcastChannel & Cross-tab event listener setup
	useEffect(() => {
		if (typeof window === "undefined" || !isAuthenticated || !hasHydrated) {
			return;
		}

		// Initialize BroadcastChannel
		try {
			const channel = new BroadcastChannel(IDLE_CONFIG.CHANNEL_NAME);
			broadcastChannelRef.current = channel;

			channel.onmessage = (event: MessageEvent<SessionBroadcastMessage>) => {
				const data = event.data;
				if (!data) return;

				if (data.type === "ACTIVITY" || data.type === "STAY_LOGGED_IN") {
					lastActivityRef.current = data.timestamp;
					setIsWarningOpen(false);
					setRemainingSeconds(Math.floor(IDLE_CONFIG.WARNING_BEFORE_MS / 1000));
				} else if (data.type === "IDLE_TIMEOUT") {
					logout();
					window.location.href = "/login?reason=idle";
				} else if (data.type === "LOGOUT") {
					logout();
					window.location.href = "/login";
				}
			};
		} catch {
			// BroadcastChannel not supported in ancient browsers, fallback to storage listener
		}

		// Storage event listener fallback
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === IDLE_CONFIG.STORAGE_KEY && e.newValue) {
				const time = parseInt(e.newValue, 10);
				lastActivityRef.current = time;
				setIsWarningOpen(false);
			}
		};
		window.addEventListener("storage", handleStorageChange);

		return () => {
			if (broadcastChannelRef.current) {
				broadcastChannelRef.current.close();
				broadcastChannelRef.current = null;
			}
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [isAuthenticated, hasHydrated, logout]);

	// Activity event listeners on window
	useEffect(() => {
		if (typeof window === "undefined" || !isAuthenticated || !hasHydrated) {
			return;
		}

		// Initial load: sync with storage
		const storedTime = getLastActivityFromStorage();
		lastActivityRef.current = Math.max(storedTime, Date.now());

		const handleUserActivity = () => {
			// If warning is already showing, user must explicitly click "Tetap Masuk"
			if (!isWarningOpen) {
				recordActivity(true);
			}
		};

		const activityEvents = [
			"mousemove",
			"mousedown",
			"keydown",
			"touchstart",
			"scroll",
			"click",
		];

		activityEvents.forEach((evt) => {
			window.addEventListener(evt, handleUserActivity, { passive: true });
		});

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible" && !isWarningOpen) {
				recordActivity(true);
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			activityEvents.forEach((evt) => {
				window.removeEventListener(evt, handleUserActivity);
			});
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [
		isAuthenticated,
		hasHydrated,
		isWarningOpen,
		recordActivity,
		getLastActivityFromStorage,
	]);

	// Main interval timer checking idle elapsed duration
	useEffect(() => {
		if (!isAuthenticated || !hasHydrated) return;

		const timer = setInterval(() => {
			const now = Date.now();
			// Check storage in case another tab updated it
			const stored = getLastActivityFromStorage();
			const activeTime = Math.max(lastActivityRef.current, stored);
			const elapsed = now - activeTime;
			const timeUntilTimeout = IDLE_CONFIG.IDLE_TIMEOUT_MS - elapsed;

			// 1. Time is completely up -> Auto logout
			if (timeUntilTimeout <= 0) {
				performLogout("idle");
				return;
			}

			// 2. In warning window (last 2 minutes)
			if (timeUntilTimeout <= IDLE_CONFIG.WARNING_BEFORE_MS) {
				setIsWarningOpen(true);
				setRemainingSeconds(Math.max(0, Math.ceil(timeUntilTimeout / 1000)));
			} else {
				if (isWarningOpen) {
					setIsWarningOpen(false);
				}
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [
		isAuthenticated,
		hasHydrated,
		isWarningOpen,
		getLastActivityFromStorage,
		performLogout,
	]);

	return {
		isWarningOpen,
		remainingSeconds,
		isRefreshing,
		stayLoggedIn,
		logout: () => performLogout("manual"),
		recordActivity,
	};
}
