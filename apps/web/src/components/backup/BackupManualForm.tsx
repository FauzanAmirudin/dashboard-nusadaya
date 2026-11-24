"use client";

import {
	AlertTriangle,
	CheckCircle,
	DatabaseBackup,
	Loader2,
	Play,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, getToken } from "@/lib/eden";

interface StudentOption {
	id: number;
	nim: string | null;
	name: string;
	cohort: number;
	program: string;
}

const PANEL_OPTIONS = [
	{ value: "", label: "Semua Panel & Tab (Direkomendasikan)" },
	{ value: "pmb", label: "Panel PMB (Checklist, Foto Profil & Fee Invoice)" },
	{ value: "crm", label: "Panel CRM (ODS, Pra-Magang & Tri Dharma)" },
	{
		value: "finance",
		label: "Panel Finance (Pembayaran, Talangan & Fee Transfer)",
	},
	{ value: "akademik", label: "Panel Akademik (Nilai, Asesmen & SK Direktur)" },
	{ value: "pa", label: "Panel PA (Bimbingan PA)" },
	{
		value: "magang",
		label: "Panel Magang (Pra-Paspor, Penempatan/Ahli Waris & Keberangkatan)",
	},
	{ value: "post-internship", label: "Panel Magang — Syarat Akhir Kepulangan" },
	{ value: "kehadiran", label: "Kehadiran (Foto Selfie Absen)" },
];

export function BackupManualForm({
	onBackupCompleted,
}: {
	onBackupCompleted?: () => void;
}) {
	const [type, setType] = useState("full");
	const [selectedStudentId, setSelectedStudentId] = useState("");
	const [nim, setNim] = useState("");
	const [studentSearch, setStudentSearch] = useState("");
	const [studentsList, setStudentsList] = useState<StudentOption[]>([]);
	const [cohortId, setCohortId] = useState("");
	const [programId, setProgramId] = useState("");
	const [panelFilter, setPanelFilter] = useState("");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Progress state
	const [jobId, setJobId] = useState<string | null>(null);
	const [progress, setProgress] = useState<any>(null);

	// Load daftar mahasiswa untuk dropdown pemilihan per mahasiswa
	useEffect(() => {
		let cancelled = false;
		async function loadStudents() {
			try {
				const token = getToken();
				const res = await fetch("/api/students?limit=250", {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				if (!res.ok) return;
				const json = await res.json();
				if (!cancelled && json?.success && Array.isArray(json.data)) {
					const opts: StudentOption[] = json.data
						.map((row: any) => {
							const s = row.student ?? row;
							return {
								id: s.id,
								nim: s.nim ?? null,
								name: s.name ?? "Tanpa Nama",
								cohort: s.cohort ?? 0,
								program: s.program ?? "-",
							};
						})
						.sort((a: StudentOption, b: StudentOption) =>
							a.name.localeCompare(b.name),
						);
					setStudentsList(opts);
				}
			} catch (err) {
				console.error("Gagal memuat daftar mahasiswa untuk backup", err);
			}
		}
		loadStudents();
		return () => {
			cancelled = true;
		};
	}, []);

	// Polling effect
	useEffect(() => {
		if (!jobId) return;

		const interval = setInterval(async () => {
			try {
				const res = await api.backups[jobId].get();
				if (res.data?.success) {
					setProgress(res.data?.data ?? null);
					const dataObj = res.data?.data as any;
					const status = dataObj?.status;
					if (status === "completed" || status === "failed") {
						clearInterval(interval);
						setLoading(false);
						if (status === "completed") {
							onBackupCompleted?.();
						}
					}
				}
			} catch (err) {
				console.error("Polling error", err);
			}
		}, 2000);

		return () => clearInterval(interval);
	}, [jobId, onBackupCompleted]);

	const handleStartBackup = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setJobId(null);
		setProgress(null);

		try {
			const payload: any = { type, filters: {} };
			if (panelFilter) {
				payload.filters.panel = panelFilter;
			}

			if (type === "student") {
				if (selectedStudentId) {
					const found = studentsList.find(
						(s) => String(s.id) === selectedStudentId,
					);
					payload.filters.studentId = Number(selectedStudentId);
					if (found?.nim) {
						payload.filters.nim = found.nim;
					}
				} else if (nim.trim()) {
					payload.filters.nim = nim.trim();
				} else {
					setError(
						"Pilih mahasiswa dari daftar atau masukkan NIM untuk backup per mahasiswa.",
					);
					setLoading(false);
					return;
				}
			} else if (type === "cohort") {
				if (!cohortId) {
					setError("Nomor angkatan wajib diisi (Contoh: 14, 15, 16, 17).");
					setLoading(false);
					return;
				}
				payload.filters.cohortId = parseInt(cohortId, 10);
			} else if (type === "program") {
				if (!programId.trim()) {
					setError("Program studi wajib dipilih atau diisi.");
					setLoading(false);
					return;
				}
				payload.filters.programId = programId.trim();
			}

			const res = await api.backups.post(payload);

			if (res.data?.success) {
				setJobId(res.data?.data?.jobId ?? null);
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

	const filteredStudents = studentsList.filter((s) => {
		if (!studentSearch.trim()) return true;
		const q = studentSearch.toLowerCase();
		return (
			s.name.toLowerCase().includes(q) ||
			(s.nim || "").toLowerCase().includes(q) ||
			String(s.id).includes(q)
		);
	});

	const availablePrograms = Array.from(
		new Set(studentsList.map((s) => s.program).filter((p) => p && p !== "-")),
	).sort();

	return (
		<div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
			<h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
				<DatabaseBackup className="h-5 w-5 text-indigo-600" />
				Jalankan Backup Manual
			</h3>
			<p className="text-sm text-slate-500 mb-6">
				Seluruh berkas dari semua panel &amp; tab mahasiswa dicadangkan dengan
				struktur folder{" "}
				<span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
					NIM_Nama/Panel/Tab/Dokumen
				</span>
				.
			</p>

			{/* Progress Card */}
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
								(progress.totalFiles ?? progress.total ?? 0) === 0 ? (
									<span className="text-emerald-700 font-medium">
										Struktur direktori &amp; manifest.json berhasil dicadangkan
										(0 berkas fisik).
									</span>
								) : (
									<>
										File diproses:{" "}
										<strong className="font-semibold text-slate-800">
											{progress.processedFiles ?? progress.processed ?? 0}
										</strong>{" "}
										/ {progress.totalFiles ?? progress.total ?? 0}
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
							Full Backup (Seluruh Mahasiswa, Panel &amp; Sistem)
						</option>
						<option value="student">Per Mahasiswa (Nama / NIM)</option>
						<option value="cohort">Per Angkatan</option>
						<option value="program">Per Program Studi</option>
					</select>
				</div>

				{type === "student" && (
					<div className="space-y-3 animate-in fade-in slide-in-from-top-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
						<div>
							<label className="block text-xs font-semibold text-slate-600 mb-1">
								Cari &amp; Pilih Mahasiswa
							</label>
							<input
								type="text"
								value={studentSearch}
								onChange={(e) => setStudentSearch(e.target.value)}
								disabled={loading}
								placeholder="Ketik nama atau NIM mahasiswa..."
								className="w-full rounded-lg border-slate-300 shadow-sm text-sm py-1.5 px-3 border outline-none bg-white mb-2"
							/>
							<select
								value={selectedStudentId}
								onChange={(e) => {
									setSelectedStudentId(e.target.value);
									if (e.target.value) setNim("");
								}}
								disabled={loading}
								className="w-full rounded-lg border-slate-300 shadow-sm text-sm py-2 px-3 border outline-none bg-white"
							>
								<option value="">
									-- Pilih Mahasiswa ({filteredStudents.length} tersedia) --
								</option>
								{filteredStudents.map((s) => (
									<option key={s.id} value={String(s.id)}>
										{s.nim ? `[${s.nim}]` : `[Calon Mhs ID-${s.id}]`} {s.name} —{" "}
										{s.program} (Angkatan {s.cohort})
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-xs font-medium text-slate-500 mb-1">
								Atau masukkan NIM manual
							</label>
							<input
								type="text"
								value={nim}
								onChange={(e) => {
									setNim(e.target.value);
									if (e.target.value) setSelectedStudentId("");
								}}
								disabled={loading}
								placeholder="Contoh: 250011"
								className="w-full rounded-lg border-slate-300 shadow-sm text-sm py-2 px-3 border outline-none bg-white font-mono"
							/>
						</div>
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
							placeholder="Masukkan Angkatan (Contoh: 14, 15, 16, 17)"
							className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2 px-3 border outline-none bg-white font-mono"
						/>
					</div>
				)}

				{type === "program" && (
					<div className="animate-in fade-in slide-in-from-top-2">
						<label className="block text-sm font-medium text-slate-700 mb-1">
							Program Studi
						</label>
						<select
							value={programId}
							onChange={(e) => setProgramId(e.target.value)}
							disabled={loading}
							className="w-full rounded-lg border-slate-300 shadow-sm text-sm py-2 px-3 border outline-none bg-white"
						>
							<option value="">-- Pilih Program Studi --</option>
							{availablePrograms.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>
					</div>
				)}

				<div>
					<label className="block text-sm font-medium text-slate-700 mb-1">
						Cakupan Panel Dokumen
					</label>
					<select
						value={panelFilter}
						onChange={(e) => setPanelFilter(e.target.value)}
						disabled={loading}
						className="w-full rounded-lg border-slate-300 shadow-sm text-sm py-2 px-3 border outline-none bg-white"
					>
						{PANEL_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>

				<div className="pt-4 border-t border-slate-100">
					<button
						type="submit"
						disabled={loading}
						className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-white font-medium shadow-sm transition-all ${
							loading
								? "bg-slate-400 cursor-not-allowed"
								: "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md cursor-pointer"
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
