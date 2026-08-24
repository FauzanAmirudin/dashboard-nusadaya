"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye, History, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/eden";
import { BackupJobDetailPanel } from "./BackupJobDetailPanel";

export function BackupHistoryTable() {
	const [jobs, setJobs] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedJob, setSelectedJob] = useState<any | null>(null);

	const fetchJobs = async () => {
		setLoading(true);
		try {
			const response = await api.backups.get();
			if (response.data?.success) {
				setJobs(response.data?.data ?? []);
			}
		} catch (error) {
			console.error("Gagal mengambil riwayat backup", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchJobs();
	}, []);

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB", "TB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const formatBackupType = (job: any) => {
		if (!job) return "-";
		if (job.type === "cohort") {
			return job.filters?.cohortId
				? `Angkatan ${job.filters.cohortId}`
				: "Per Angkatan";
		}
		if (job.type === "student") {
			return job.filters?.nim
				? `Mahasiswa (${job.filters.nim})`
				: "Per Mahasiswa";
		}
		if (job.type === "full") {
			return "Full Backup";
		}
		return job.type;
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "completed":
				return (
					<span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
						Berhasil
					</span>
				);
			case "processing":
				return (
					<span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium animate-pulse">
						Berjalan
					</span>
				);
			case "failed":
				return (
					<span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
						Gagal
					</span>
				);
			default:
				return (
					<span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
						Menunggu
					</span>
				);
		}
	};

	return (
		<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
			<div className="p-5 border-b border-slate-200 flex items-center justify-between">
				<h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
					<History className="h-5 w-5 text-slate-500" />
					Riwayat Backup
				</h3>
				<button
					onClick={fetchJobs}
					disabled={loading}
					className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
					title="Refresh data"
				>
					<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
				</button>
			</div>

			<div className="overflow-x-auto flex-1">
				<table className="w-full text-left text-sm whitespace-nowrap">
					<thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
						<tr>
							<th className="px-6 py-4">Waktu</th>
							<th className="px-6 py-4">Tipe</th>
							<th className="px-6 py-4">Status</th>
							<th className="px-6 py-4">Ukuran</th>
							<th className="px-6 py-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{loading && jobs.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="px-6 py-12 text-center text-slate-500"
								>
									Memuat data riwayat...
								</td>
							</tr>
						) : jobs.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="px-6 py-12 text-center text-slate-500"
								>
									Belum ada riwayat backup
								</td>
							</tr>
						) : (
							jobs.map((job) => (
								<tr
									key={job.id}
									className="hover:bg-slate-50 transition-colors"
								>
									<td className="px-6 py-4 text-slate-900">
										{format(new Date(job.createdAt), "dd MMM yyyy, HH:mm", {
											locale: id,
										})}
									</td>
									<td className="px-6 py-4">
										<span className="font-medium text-slate-700">
											{formatBackupType(job)}
										</span>
									</td>
									<td className="px-6 py-4">{getStatusBadge(job.status)}</td>
									<td className="px-6 py-4 text-slate-600 font-mono text-xs">
										{formatBytes(job.totalSize)}
									</td>
									<td className="px-6 py-4 text-right flex justify-end gap-2">
										{job.status === "completed" && (
											<button
												onClick={async (e) => {
													const btn = e.currentTarget;
													btn.disabled = true;
													const originalIcon = btn.innerHTML;
													btn.innerHTML = `<span class="w-3.5 h-3.5 animate-pulse border-2 border-slate-400 border-t-transparent rounded-full inline-block"></span>`;

													try {
														// Gunakan Next.js proxy route bawaan (next.config.ts rewrites)
														const { getToken } = await import("@/lib/eden");
														const res = await fetch(
															`/api/backups/${job.id}/download`,
															{
																headers: {
																	Authorization: `Bearer ${getToken()}`,
																},
															},
														);
														if (!res.ok) throw new Error("Gagal mengunduh");
														const blob = await res.blob();
														const url = window.URL.createObjectURL(blob);
														const a = document.createElement("a");
														a.href = url;
														a.download = `backup-${job.id}.zip`;
														document.body.appendChild(a);
														a.click();
														window.URL.revokeObjectURL(url);
														document.body.removeChild(a);
													} catch (err) {
														const { toast } = await import("sonner");
														toast.error(
															"Terjadi kesalahan saat mengunduh backup.",
														);
													} finally {
														btn.disabled = false;
														btn.innerHTML = originalIcon;
													}
												}}
												className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium shadow-sm"
												title="Download .zip"
											>
												{/* biome-ignore lint/a11y/noSvgWithoutTitle: title is on the parent button */}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
													<polyline points="7 10 12 15 17 10"></polyline>
													<line x1="12" y1="15" x2="12" y2="3"></line>
												</svg>
											</button>
										)}
										<button
											onClick={() => setSelectedJob(job)}
											className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors text-xs font-medium shadow-sm"
										>
											<Eye className="w-3.5 h-3.5" />
											Detail
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{selectedJob && (
				<BackupJobDetailPanel
					job={selectedJob}
					onClose={() => setSelectedJob(null)}
				/>
			)}
		</div>
	);
}
