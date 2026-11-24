"use client";

import { HardDrive, Server, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/eden";

interface StorageStatus {
	totalStorageSize: number;
	totalStorageFiles: number;
	totalBackupSize: number;
	activeDbFiles: number;
	completedBackupsCount: number;
	lastBackupAt?: string | null;
	lastBackupType?: string | null;
	retentionPolicy: string;
}

export function StorageStatusCard({
	refreshTrigger = 0,
}: {
	refreshTrigger?: number;
}) {
	const [status, setStatus] = useState<StorageStatus | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		async function fetchStats() {
			try {
				const token = getToken();
				const res = await fetch("/api/backups/stats", {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				if (!res.ok) return;
				const json = await res.json();
				if (!cancelled && json?.success && json.data) {
					setStatus(json.data);
				}
			} catch (error) {
				console.error("Gagal mengambil status storage", error);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		fetchStats();
		return () => {
			cancelled = true;
		};
	}, [refreshTrigger]);

	const formatBytes = (bytes: number) => {
		if (!bytes || bytes <= 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB", "TB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	if (loading) {
		return <div className="h-36 animate-pulse bg-slate-100 rounded-xl" />;
	}

	return (
		<div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
			<h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
				<Server className="h-5 w-5 text-blue-600" />
				Status Sistem &amp; Storage
			</h3>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
				<div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-3.5">
					<div className="p-2.5 bg-blue-100 rounded-lg shrink-0">
						<HardDrive className="h-5 w-5 text-blue-700" />
					</div>
					<div>
						<p className="text-xs font-medium text-slate-500 mb-0.5">
							Storage Aktif
						</p>
						<p className="text-xl sm:text-2xl font-bold text-slate-900">
							{status ? formatBytes(status.totalStorageSize) : "0 B"}
						</p>
						<p className="text-xs text-slate-500 mt-0.5">
							{status
								? `${status.activeDbFiles.toLocaleString("id-ID")} berkas terindeks`
								: "-"}
						</p>
					</div>
				</div>

				<div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start gap-3.5">
					<div className="p-2.5 bg-indigo-100 rounded-lg shrink-0">
						<ShieldCheck className="h-5 w-5 text-indigo-700" />
					</div>
					<div>
						<p className="text-xs font-medium text-slate-500 mb-0.5">
							Total Backup Tersimpan
						</p>
						<p className="text-xl sm:text-2xl font-bold text-slate-900">
							{status ? formatBytes(status.totalBackupSize) : "0 B"}
						</p>
						<p className="text-xs text-slate-500 mt-0.5">
							{status
								? `${status.completedBackupsCount.toLocaleString("id-ID")} backup selesai`
								: "-"}
						</p>
					</div>
				</div>

				<div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center">
					<p className="text-xs font-medium text-slate-500 mb-1">
						Kebijakan Retensi
					</p>
					<p className="text-sm font-semibold text-slate-800">
						{status?.retentionPolicy ??
							"Maks. 5 Full Backup Harian & 5 salinan per Mahasiswa"}
					</p>
					<p className="text-xs text-slate-500 mt-2">
						Terakhir sukses:{" "}
						<span className="font-medium text-slate-700">
							{status?.lastBackupAt
								? new Date(status.lastBackupAt).toLocaleString("id-ID", {
										dateStyle: "medium",
										timeStyle: "short",
									})
								: "Belum ada backup"}
						</span>
					</p>
				</div>
			</div>
		</div>
	);
}
