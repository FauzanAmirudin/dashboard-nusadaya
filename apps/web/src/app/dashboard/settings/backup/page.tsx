"use client";

import { History, Settings2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { BackupHistoryTable } from "@/components/backup/BackupHistoryTable";
import { BackupManualForm } from "@/components/backup/BackupManualForm";
import { StorageStatusCard } from "@/components/backup/StorageStatusCard";
import { Button } from "@/components/ui/button";
import { hasRole, useAuthStore } from "@/store";

export default function BackupSettingsPage() {
	const { user, hasHydrated } = useAuthStore();
	const [activeTab, setActiveTab] = useState<"history" | "manual">("history");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const handleBackupCompleted = useCallback(() => {
		setRefreshTrigger((prev) => prev + 1);
	}, []);

	if (!hasHydrated) return null;

	if (!hasRole(user, "superadmin")) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
				<div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
					<ShieldAlert className="w-8 h-8" />
				</div>
				<h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
				<p className="text-sm text-slate-500 max-w-md mb-6">
					Halaman Backup &amp; Sistem hanya dapat diakses oleh Administrator
					(Superadmin).
				</p>
				<Link href="/dashboard">
					<Button variant="outline">Kembali ke Dashboard</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-10">
			<div>
				<h1 className="text-2xl font-bold text-slate-900 tracking-tight">
					Backup &amp; Sistem
				</h1>
				<p className="text-sm text-slate-500 mt-1">
					Kelola pencadangan dokumen seluruh panel &amp; tab per mahasiswa,
					lihat riwayat, dan pantau penggunaan storage server.
				</p>
			</div>

			<StorageStatusCard refreshTrigger={refreshTrigger} />

			<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[540px]">
				<div className="flex border-b border-slate-200 shrink-0">
					<button
						type="button"
						onClick={() => setActiveTab("history")}
						className={`flex-1 py-4 px-6 text-sm font-medium flex justify-center items-center gap-2 transition-colors border-b-2 ${
							activeTab === "history"
								? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
								: "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
						}`}
					>
						<History className="w-4 h-4" />
						Riwayat Backup
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("manual")}
						className={`flex-1 py-4 px-6 text-sm font-medium flex justify-center items-center gap-2 transition-colors border-b-2 ${
							activeTab === "manual"
								? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
								: "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
						}`}
					>
						<Settings2 className="w-4 h-4" />
						Jalankan Backup Manual
					</button>
				</div>

				<div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6">
					{activeTab === "history" ? (
						<div className="h-full">
							<BackupHistoryTable refreshTrigger={refreshTrigger} />
						</div>
					) : (
						<div className="max-w-2xl mx-auto py-2">
							<BackupManualForm onBackupCompleted={handleBackupCompleted} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
