"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { AlertCircle, CheckCircle, Clock, Package, X } from "lucide-react";

interface BackupJob {
	id: string;
	status: string;
	type: string;
	filters: any;
	createdAt: string;
	completedAt: string | null;
	totalFiles: number;
	totalSize: number;
	processedFiles: number;
	errorMessage: string | null;
	outputPath: string | null;
}

interface BackupJobDetailPanelProps {
	job: BackupJob;
	onClose: () => void;
}

export function BackupJobDetailPanel({
	job,
	onClose,
}: BackupJobDetailPanelProps) {
	const formatBytes = (bytes: number) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB", "TB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	return (
		<div className="fixed inset-0 z-50 flex justify-end">
			<button
				type="button"
				aria-label="Tutup panel backdrop"
				className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm w-full h-full border-none cursor-default"
				onClick={onClose}
			/>

			<div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
					<h2 className="text-lg font-semibold text-slate-800">
						Detail Backup
					</h2>
					<button
						onClick={onClose}
						className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-6">
					<div className="space-y-6">
						{/* Status Banner */}
						<div
							className={`p-4 rounded-xl flex items-start gap-3 border ${
								job.status === "completed"
									? "bg-green-50 border-green-100"
									: job.status === "failed"
										? "bg-red-50 border-red-100"
										: "bg-blue-50 border-blue-100"
							}`}
						>
							{job.status === "completed" ? (
								<CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
							) : job.status === "failed" ? (
								<AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
							) : (
								<Clock className="w-5 h-5 text-blue-600 mt-0.5" />
							)}

							<div>
								<p
									className={`font-semibold capitalize ${
										job.status === "completed"
											? "text-green-800"
											: job.status === "failed"
												? "text-red-800"
												: "text-blue-800"
									}`}
								>
									{job.status}
								</p>
								<p className="text-sm text-slate-600 mt-1">
									ID: <span className="font-mono text-xs">{job.id}</span>
								</p>
							</div>
						</div>

						{/* Details */}
						<div className="space-y-4">
							<div>
								<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
									Tipe Backup
								</p>
								<p className="text-sm font-medium text-slate-900">
									{job.type === "cohort"
										? `Per Angkatan (Angkatan ${job.filters?.cohortId ?? "-"})`
										: job.type === "student"
											? `Per Mahasiswa (NIM ${job.filters?.nim ?? "-"})`
											: job.type === "full"
												? "Full Backup (Seluruh Sistem & Database)"
												: job.type}
								</p>
							</div>

							<div>
								<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
									Waktu Mulai
								</p>
								<p className="text-sm font-medium text-slate-900">
									{format(new Date(job.createdAt), "dd MMM yyyy, HH:mm", {
										locale: id,
									})}
								</p>
							</div>

							{job.completedAt && (
								<div>
									<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
										Waktu Selesai
									</p>
									<p className="text-sm font-medium text-slate-900">
										{format(new Date(job.completedAt), "dd MMM yyyy, HH:mm", {
											locale: id,
										})}
									</p>
								</div>
							)}

							<div>
								<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
									Cakupan / Filter
								</p>
								<div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 space-y-1">
									{job.type === "full" && (
										<p>Seluruh data database & dokumen fisik sistem</p>
									)}
									{job.type === "cohort" && (
										<p>
											Nomor Angkatan:{" "}
											<strong className="font-semibold text-slate-900">
												Angkatan {job.filters?.cohortId ?? "-"}
											</strong>
										</p>
									)}
									{job.type === "student" && (
										<p>
											NIM Mahasiswa:{" "}
											<strong className="font-mono font-semibold text-slate-900">
												{job.filters?.nim ?? "-"}
											</strong>
										</p>
									)}
									{job.type !== "full" &&
										job.type !== "cohort" &&
										job.type !== "student" && (
											<pre className="font-mono text-xs">
												{JSON.stringify(job.filters || {}, null, 2)}
											</pre>
										)}
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4 pt-2">
								<div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
									<p className="text-xs font-semibold text-slate-500 uppercase mb-1">
										Total File
									</p>
									<p className="text-lg font-bold text-slate-900">
										{job.totalFiles.toLocaleString()}
									</p>
								</div>
								<div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
									<p className="text-xs font-semibold text-slate-500 uppercase mb-1">
										Total Ukuran
									</p>
									<p className="text-lg font-bold text-slate-900">
										{formatBytes(job.totalSize)}
									</p>
								</div>
							</div>

							{job.outputPath && (
								<div className="pt-2">
									<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
										Lokasi Server
									</p>
									<div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
										<Package className="w-4 h-4 text-slate-400 shrink-0" />
										<p className="text-xs font-mono text-slate-700 break-all">
											{job.outputPath}
										</p>
									</div>
								</div>
							)}

							{job.errorMessage && (
								<div className="pt-2">
									<p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">
										Pesan Error
									</p>
									<p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-100">
										{job.errorMessage}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
					<button
						onClick={onClose}
						className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
					>
						Tutup
					</button>

					{job.status === "completed" && (
						<button
							onClick={async (e) => {
								const btn = e.currentTarget;
								btn.disabled = true;
								const originalText = btn.innerHTML;
								btn.innerHTML = `<span class="animate-pulse">Mengunduh...</span>`;

								try {
									// Gunakan Next.js proxy route bawaan (next.config.ts rewrites)
									const { getToken } = await import("@/lib/eden");
									const res = await fetch(`/api/backups/${job.id}/download`, {
										headers: {
											Authorization: `Bearer ${getToken()}`,
										},
									});

									if (!res.ok) throw new Error("Gagal mengunduh backup");

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
									toast.error("Terjadi kesalahan saat mengunduh backup.");
								} finally {
									btn.disabled = false;
									btn.innerHTML = originalText;
								}
							}}
							className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
						>
							Download .zip
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
