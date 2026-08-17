"use client";

import { History, Settings2 } from "lucide-react";
import { useState } from "react";
import { BackupHistoryTable } from "@/components/backup/BackupHistoryTable";
import { BackupManualForm } from "@/components/backup/BackupManualForm";

export default function BackupSettingsPage() {
	const [activeTab, setActiveTab] = useState<"history" | "manual">("history");

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-10">
			<div>
				<h1 className="text-2xl font-bold text-slate-900 tracking-tight">
					Backup & Sistem
				</h1>
				<p className="text-sm text-slate-500 mt-1">
					Kelola pencadangan data, lihat riwayat, dan pantau penggunaan storage
					server.
				</p>
			</div>

			<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
				<div className="flex border-b border-slate-200 shrink-0">
					<button
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

				<div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
					{activeTab === "history" ? (
						<div className="h-full">
							<BackupHistoryTable />
						</div>
					) : (
						<div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
							<BackupManualForm />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
