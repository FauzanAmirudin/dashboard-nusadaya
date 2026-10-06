"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/eden";

export function StudentProgress({
	studentId,
	updateTrigger,
	userRole,
	overrideProgress,
}: {
	studentId: number;
	updateTrigger?: number;
	userRole?: string;
	overrideProgress?: { completed: number; total: number } | null;
}) {
	const [total, setTotal] = useState(0);
	const [completed, setCompleted] = useState(0);

	// Sync with custom event crm-progress-sync for instantaneous 0ms reactivity
	useEffect(() => {
		const handleSync = (e: any) => {
			if (e.detail?.studentId === studentId) {
				if (userRole === "crm" || !userRole) {
					if (typeof e.detail.completed === "number") {
						setCompleted((prev) =>
							prev === e.detail.completed ? prev : e.detail.completed,
						);
					}
					if (typeof e.detail.total === "number") {
						setTotal((prev) =>
							prev === e.detail.total ? prev : e.detail.total,
						);
					}
				}
			}
		};
		window.addEventListener("crm-progress-sync", handleSync as EventListener);
		return () => {
			window.removeEventListener(
				"crm-progress-sync",
				handleSync as EventListener,
			);
		};
	}, [studentId, userRole]);

	useEffect(() => {
		const fetchStatus = async () => {
			const API_URL =
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
			const token = localStorage.getItem("auth-storage")
				? JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.token
				: null;
			try {
				const res = await fetch(
					`${API_URL}/students/${studentId}/progress?_t=${Date.now()}`,
					{
						headers: {
							...(token ? { Authorization: `Bearer ${token}` } : {}),
							"Cache-Control": "no-cache",
						},
					},
				);
				if (res.ok) {
					const json = await res.json();
					if (json.success && json.data) {
						if (userRole && userRole !== "superadmin") {
							const panelData = json.data.panels.find(
								(p: any) => p.id === userRole,
							);
							if (panelData) {
								setTotal(panelData.total);
								setCompleted(panelData.completed);
							} else {
								setTotal(json.data.totalIndicators);
								setCompleted(json.data.totalCompleted);
							}
						} else {
							setTotal(json.data.totalIndicators);
							setCompleted(json.data.totalCompleted);
						}
					}
				}
			} catch (err) {
				console.error("Failed to fetch student progress", err);
			}
		};

		fetchStatus();
	}, [studentId, updateTrigger, userRole]);

	const displayTotal =
		overrideProgress && (userRole === "crm" || !userRole)
			? overrideProgress.total
			: total;
	const displayCompleted =
		overrideProgress && (userRole === "crm" || !userRole)
			? overrideProgress.completed
			: completed;

	if (displayTotal === 0) {
		return (
			<div className="w-full md:w-64 shrink-0 bg-white p-3 rounded-lg border border-slate-200 shadow-sm animate-pulse">
				<div className="h-4 bg-slate-200 rounded w-2/3 mb-3"></div>
				<div className="h-2 bg-slate-200 rounded w-full"></div>
			</div>
		);
	}

	const progressPercent = Math.round((displayCompleted / displayTotal) * 100);

	const getRoleLabel = () => {
		if (!userRole || userRole === "superadmin")
			return "Total Progress Checklist";
		const rolesMap: Record<string, string> = {
			pmb: "Progress PMB",
			crm: "Progress CRM",
			finance: "Progress Finance",
			akademik: "Progress Akademik",
			dosen: "Progress Dosen",
			pa: "Progress PA",
			magang: "Progress Magang",
		};
		return rolesMap[userRole] || "Total Progress Checklist";
	};

	return (
		<div className="w-full md:w-64 shrink-0 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
			<div className="flex justify-between items-center mb-2">
				<span className="text-xs font-medium text-slate-700">
					{getRoleLabel()}
				</span>
				<span className="text-xs text-slate-500">
					{displayCompleted} / {displayTotal}
				</span>
			</div>
			<Progress
				value={progressPercent}
				className="h-2 bg-slate-100"
				indicatorClassName="bg-[#0517B0]"
			/>
		</div>
	);
}
