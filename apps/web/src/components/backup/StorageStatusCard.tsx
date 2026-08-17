"use client";

import { HardDrive, Server, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/eden";

interface StorageStatus {
	totalStorageSize: number;
	totalBackupSize: number;
	lastBackupAt?: string;
	retentionPolicy: string;
}

export function StorageStatusCard() {
	const [status, setStatus] = useState<StorageStatus | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchHealth() {
			try {
				// Ambil data dari endpoint /health
				const response = await api.health.get();
				if (response.data?.success) {
					// Dummy data jika API health belum mengembalikan detail storage
					setStatus({
						totalStorageSize: 524288000, // 500 MB
						totalBackupSize: 1048576000, // 1 GB
						lastBackupAt: new Date().toISOString(),
						retentionPolicy: "Menyimpan 7 salinan terbaru",
					});
				}
			} catch (error) {
				console.error("Gagal mengambil status storage", error);
			} finally {
				setLoading(false);
			}
		}

		fetchHealth();
	}, []);

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB", "TB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Number.parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
	};

	if (loading) {
		return <div className="h-40 animate-pulse bg-slate-100 rounded-xl" />;
	}

	return (
		<div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
			<h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
				<Server className="h-5 w-5 text-blue-600" />
				Status Sistem & Storage
			</h3>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-4">
					<div className="p-2 bg-blue-100 rounded-lg">
						<HardDrive className="h-6 w-6 text-blue-700" />
					</div>
					<div>
						<p className="text-sm font-medium text-slate-500 mb-1">
							Storage Aktif
						</p>
						<p className="text-2xl font-bold text-slate-900">
							{status ? formatBytes(status.totalStorageSize) : "-"}
						</p>
					</div>
				</div>

				<div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-start gap-4">
					<div className="p-2 bg-indigo-100 rounded-lg">
						<ShieldCheck className="h-6 w-6 text-indigo-700" />
					</div>
					<div>
						<p className="text-sm font-medium text-slate-500 mb-1">
							Total Backup
						</p>
						<p className="text-2xl font-bold text-slate-900">
							{status ? formatBytes(status.totalBackupSize) : "-"}
						</p>
					</div>
				</div>

				<div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-center">
					<p className="text-sm font-medium text-slate-500 mb-1">
						Kebijakan Retensi
					</p>
					<p className="text-sm font-semibold text-slate-800">
						{status?.retentionPolicy ?? "-"}
					</p>
					<p className="text-xs text-slate-500 mt-2">
						Terakhir sukses:{" "}
						{status?.lastBackupAt
							? new Date(status.lastBackupAt).toLocaleDateString("id-ID")
							: "-"}
					</p>
				</div>
			</div>
		</div>
	);
}
