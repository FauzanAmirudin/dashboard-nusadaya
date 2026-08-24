"use client";

import {
	AlertTriangle,
	CheckCircle,
	DatabaseBackup,
	Loader2,
	Play,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/eden";

export function BackupManualForm() {
	const [type, setType] = useState("full");
	const [nim, setNim] = useState("");
	const [cohortId, setCohortId] = useState("");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Progress state
	const [jobId, setJobId] = useState<string | null>(null);
	const [progress, setProgress] = useState<any>(null);

	// Polling effect
	useEffect(() => {
		if (!jobId) return;

		const interval = setInterval(async () => {
			try {
				const res = await api.backups[jobId].get();
				if (res.data?.success) {
					setProgress(res.data?.data ?? null);
					// Hentikan polling jika sudah selesai/gagal
					const dataObj = res.data?.data as any;
					const status = dataObj?.status;
					if (status === "completed" || status === "failed") {
						clearInterval(interval);
						setLoading(false);
					}
				}
			} catch (err) {
				console.error("Polling error", err);
			}
		}, 3000); // Poll setiap 3 detik

		return () => clearInterval(interval);
	}, [jobId]);

	const handleStartBackup = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setJobId(null);
		setProgress(null);

		try {
			const payload: any = { type };
			if (type === "student") {
				if (!nim) {
					setError("NIM Mahasiswa wajib diisi untuk backup per mahasiswa.");
					setLoading(false);
					return;
				}
				payload.filters = { nim: nim.trim() };
			} else if (type === "cohort") {
				if (!cohortId) {
					setError("Nomor angkatan wajib diisi (Contoh: 14, 15, dst).");
					setLoading(false);
					return;
				}
				payload.filters = { cohortId: parseInt(cohortId, 10) };
			}

			const res = await api.backups.post(payload);

			if (res.data?.success) {
				setJobId(res.data?.data?.jobId ?? null);
				// Awal progress
				setProgress({ status: "queued", percentage: 0 });
			} else {
				setError(res.data?.message || "Gagal memulai backup.");
				setLoading(false);
			}
		} catch (err: any) {
			setError(err.message || "Terjadi kesalahan koneksi.");
			setLoading(false);
		}
	};

	return (
		<div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
			<h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
				<DatabaseBackup className="h-5 w-5 text-indigo-600" />
				Jalankan Backup Manual
			</h3>
			<p className="text-sm text-slate-500 mb-6">
				Picu proses pencadangan secara manual tanpa menunggu jadwal malam hari.
			</p>

			{/* Progress Card (tampil jika sedang berjalan atau baru selesai) */}
			{progress && (
				<div
					className={`mb-6 p-5 rounded-xl border ${
						progress.status === "completed"
							? "bg-green-50 border-green-200"
							: progress.status === "failed"
								? "bg-red-50 border-red-200"
								: "bg-indigo-50 border-indigo-200"
					}`}
				>
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							{progress.status === "processing" ||
							progress.status === "queued" ? (
								<Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
							) : progress.status === "completed" ? (
								<CheckCircle className="w-5 h-5 text-green-600" />
							) : (
								<AlertTriangle className="w-5 h-5 text-red-600" />
							)}
							<span
								className={`font-semibold capitalize ${
									progress.status === "completed"
										? "text-green-800"
										: progress.status === "failed"
											? "text-red-800"
											: "text-indigo-800"
								}`}
							>
								{progress.status === "queued"
									? "Menunggu Antrean..."
									: progress.status === "processing"
										? "Sedang Memproses..."
										: progress.status === "completed"
											? "Backup Selesai!"
											: "Backup Gagal"}
							</span>
						</div>
						<span className="font-mono text-sm font-bold text-slate-700">
							{progress.percentage ?? 0}%
						</span>
					</div>

					<div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
						<div
							className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
								progress.status === "completed"
									? "bg-green-500"
									: progress.status === "failed"
										? "bg-red-500"
										: "bg-indigo-600"
							}`}
							style={{ width: `${progress.percentage ?? 0}%` }}
						/>
					</div>

					<div className="mt-3 flex flex-col gap-1 text-xs text-slate-600">
						<div className="flex justify-between items-center">
							<span>
								{progress.status === "completed" &&
								(progress.total ?? 0) === 0 ? (
									<span className="text-emerald-700 font-medium">
										Semua metadata sistem & struktur direktori berhasil
										dicadangkan (0 berkas fisik).
									</span>
								) : (
									<>
										File diproses:{" "}
										<strong className="font-semibold text-slate-800">
											{progress.processed || 0}
										</strong>{" "}
										/ {progress.total || 0}
									</>
								)}
							</span>
							{progress.currentFile && progress.status === "processing" && (
								<span className="truncate max-w-[200px] text-slate-400 font-mono">
									{progress.currentFile}
								</span>
							)}
						</div>
						{progress.status === "failed" && (
							<span className="text-red-600 font-medium">
								{progress.errorMessage ||
									"Terjadi kegagalan saat mengeksekusi backup."}
							</span>
						)}
					</div>
				</div>
			)}

			<form onSubmit={handleStartBackup} className="space-y-4">
				{error && (
					<div className="p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg flex items-start gap-2">
						<AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
						<p>{error}</p>
					</div>
				)}

				<div>
					<label className="block text-sm font-medium text-slate-700 mb-1">
						Tipe Backup
					</label>
					<select
						value={type}
						onChange={(e) => setType(e.target.value)}
						disabled={loading}
						className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2 px-3 border outline-none bg-white"
					>
						<option value="full">
							Full Backup (Seluruh Sistem & Database)
						</option>
						<option value="cohort">Per Angkatan</option>
						<option value="student">Per Mahasiswa (NIM)</option>
					</select>
				</div>

				{type === "student" && (
					<div className="animate-in fade-in slide-in-from-top-2">
						<label className="block text-sm font-medium text-slate-700 mb-1">
							NIM Mahasiswa
						</label>
						<input
							type="text"
							value={nim}
							onChange={(e) => setNim(e.target.value)}
							disabled={loading}
							placeholder="Masukkan NIM Mahasiswa (Contoh: 250005)"
							className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2 px-3 border outline-none bg-white font-mono"
						/>
					</div>
				)}

				{type === "cohort" && (
					<div className="animate-in fade-in slide-in-from-top-2">
						<label className="block text-sm font-medium text-slate-700 mb-1">
							Nomor Angkatan
						</label>
						<input
							type="number"
							min="1"
							step="1"
							value={cohortId}
							onChange={(e) => setCohortId(e.target.value)}
							disabled={loading}
							placeholder="Masukkan Angkatan (Contoh: 14, 15, dst)"
							className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2 px-3 border outline-none bg-white font-mono"
						/>
					</div>
				)}

				<div className="pt-4 border-t border-slate-100">
					<button
						type="submit"
						disabled={loading}
						className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-white font-medium shadow-sm transition-all ${
							loading
								? "bg-slate-400 cursor-not-allowed"
								: "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md"
						}`}
					>
						{loading ? (
							<Loader2 className="w-5 h-5 animate-spin" />
						) : (
							<Play className="w-5 h-5 fill-white" />
						)}
						{loading ? "Memproses..." : "Mulai Backup Sekarang"}
					</button>
				</div>
			</form>
		</div>
	);
}
