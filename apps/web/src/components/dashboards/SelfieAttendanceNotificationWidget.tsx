"use client";

import {
	AlertTriangle,
	ArrowRight,
	Camera,
	Clock,
	Compass,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { API_URL, getToken } from "@/lib/eden";
import { cn } from "@/lib/utils";

export function SelfieAttendanceNotificationWidget() {
	const [stats, setStats] = useState<{
		pendingReview: number;
		fraudFlags: number;
	}>({
		pendingReview: 0,
		fraudFlags: 0,
	});

	const fetchStats = async () => {
		try {
			const token = getToken();
			if (!token) return;

			const [recRes, flagRes] = await Promise.all([
				fetch(
					`${API_URL}/attendance/selfie/records?verificationStatus=pending_review&limit=100`,
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				),
				fetch(`${API_URL}/attendance/selfie/fraud-flags?isDismissed=false`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
			]);

			const recJson = await recRes.json();
			const flagJson = await flagRes.json();

			setStats({
				pendingReview:
					recJson.success && Array.isArray(recJson.data)
						? recJson.data.length
						: 0,
				fraudFlags:
					flagJson.success && Array.isArray(flagJson.data)
						? flagJson.data.length
						: 0,
			});
		} catch (err) {
			// Non-blocking error
		}
	};

	useEffect(() => {
		fetchStats();
		// Poll every 60 seconds (Task 3.8)
		const interval = setInterval(fetchStats, 60000);
		return () => clearInterval(interval);
	}, []);

	if (stats.pendingReview === 0 && stats.fraudFlags === 0) {
		return null;
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
			{/* Pending Review Selfie Alert */}
			{stats.pendingReview > 0 && (
				<Link
					href="/dashboard/kehadiran?tab=selfie-feed"
					className="group block p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all"
				>
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
								<Camera className="w-5 h-5 animate-pulse" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h4 className="font-extrabold text-sm text-amber-950">
										Verifikasi Presensi Selfie
									</h4>
									<Badge className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0 border-0">
										{stats.pendingReview} PERLU ACC
									</Badge>
								</div>
								<p className="text-xs text-amber-800/90 mt-0.5">
									Ada foto selfie mahasiswa menunggu validasi staf atau dosen.
								</p>
							</div>
						</div>
						<ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
					</div>
				</Link>
			)}

			{/* Fraud Flags Alert */}
			{stats.fraudFlags > 0 && (
				<Link
					href="/dashboard/kehadiran?tab=fraud-review"
					className="group block p-4 rounded-2xl bg-rose-50/80 border border-rose-200/90 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all"
				>
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
								<ShieldAlert className="w-5 h-5" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h4 className="font-extrabold text-sm text-rose-950">
										Dugaan Anomali Lokasi / GPS
									</h4>
									<Badge className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0 border-0 animate-pulse">
										{stats.fraudFlags} FLAG AKTIF
									</Badge>
								</div>
								<p className="text-xs text-rose-800/90 mt-0.5">
									Presensi tercatat di luar radius kampus atau akurasi GPS
									mencurigakan.
								</p>
							</div>
						</div>
						<ArrowRight className="w-4 h-4 text-rose-600 group-hover:translate-x-1 transition-transform shrink-0" />
					</div>
				</Link>
			)}
		</div>
	);
}
