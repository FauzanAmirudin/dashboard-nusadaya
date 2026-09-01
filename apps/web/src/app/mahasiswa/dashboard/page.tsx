"use client";

import {
	AlertCircle,
	ArrowRight,
	Award,
	CheckCircle2,
	Clock,
	ExternalLink,
	FileText,
	GraduationCap,
	RefreshCw,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";
import { formatRupiah } from "@/utils/format";

export default function MahasiswaDashboard() {
	const { user, isAuthenticated, hasHydrated } = useAuthStore();
	const [mounted, setMounted] = useState(false);
	const [student, setStudent] = useState<any>(null);
	const [progress, setProgress] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setMounted(true);
		if (hasHydrated && isAuthenticated && user?.role === "mahasiswa") {
			fetchData();
		}
	}, [user, hasHydrated, isAuthenticated]);

	const fetchData = async () => {
		setLoading(true);
		try {
			const [meRes, progressRes] = await Promise.all([
				api.mahasiswa.me.get(),
				api.mahasiswa.progress.get(),
			]);

			if (meRes.data?.success) {
				setStudent(meRes.data.data);
			}
			if (progressRes.data?.success) {
				setProgress(progressRes.data.data);
			}
		} catch (err) {
			console.error("Gagal memuat dashboard:", err);
		} finally {
			setLoading(false);
		}
	};

	if (!mounted) return null;

	if (loading) {
		return (
			<div className="flex items-center justify-center h-[50vh]">
				<RefreshCw className="w-8 h-8 text-[#0517B0] animate-spin" />
			</div>
		);
	}

	const renderStatus = (
		isAcc: boolean | undefined,
		status: string | undefined,
	) => {
		if (isAcc)
			return (
				<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 font-semibold text-xs">
					<CheckCircle2 className="w-3 h-3 mr-1" /> Selesai (ACC)
				</Badge>
			);
		if (status === "AMAN")
			return (
				<Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs font-semibold">
					<CheckCircle2 className="w-3 h-3 mr-1" /> Aman
				</Badge>
			);
		if (status === "TIDAK_AMAN")
			return (
				<Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-0 text-xs font-semibold">
					<AlertCircle className="w-3 h-3 mr-1" /> Tidak Aman
				</Badge>
			);
		if (status === "PERLU_PERHATIAN")
			return (
				<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 text-xs font-semibold">
					<Clock className="w-3 h-3 mr-1" /> Dalam Proses
				</Badge>
			);
		return (
			<Badge variant="outline" className="text-slate-400 text-xs bg-white">
				Belum Diproses
			</Badge>
		);
	};

	const getPanelProgressInfo = (
		key: string,
		data: any,
	): { percent: number; label: string; subLabel?: string } => {
		if (!data) return { percent: 0, label: "Memuat data progress..." };
		switch (key) {
			case "pmb":
				return {
					percent: data.progressPercent ?? 0,
					label: `${data.completedItems ?? 0}/${data.totalItems ?? 14} Berkas & Syarat Lengkap`,
				};
			case "crm":
				return {
					percent: data.progressPercent ?? 0,
					label: `${data.completedItems ?? 0}/8 Kriteria • Hadir ODS: ${data.practiceAttendancePercent ?? 0}%`,
				};
			case "finance": {
				const isTalangan = data.metodePembayaran === "dana_talangan";
				const method = isTalangan
					? "Dana Talangan (2 Tahap)"
					: "Dana Mandiri (4 Partisi)";
				const completed = data.completedItems ?? data.completedPartitions ?? 0;
				const total = data.totalItems ?? data.totalPartitions ?? 4;
				const unit = isTalangan ? "Tahapan" : "Partisi";
				return {
					percent: data.progressPercent ?? 0,
					label: `${completed}/${total} ${unit} Lunas • ${method}`,
					subLabel:
						data.totalBiayaPendidikan > 0
							? `Terbayar: ${formatRupiah(data.totalTerbayar ?? 0)} / ${formatRupiah(data.totalBiayaPendidikan ?? 0)}`
							: undefined,
				};
			}
			case "academic":
				return {
					percent: data.progressPercent ?? 0,
					label: `IPK ${(data.gpa ?? 0).toFixed(2)} • ${data.creditsCompleted ?? 0} SKS • Hadir ${data.attendancePercent ?? 0}%`,
				};
			case "pa":
				return {
					percent: data.vocabPercent ?? 0,
					label: `Hafalan: ${data.totalVocab ?? 0}/${data.vocabTarget ?? 500} Kata (${data.vocabPercent ?? 0}%)`,
				};
			case "internship":
				return {
					percent: data.mainPercent ?? 0,
					label: `Pra-Paspor ${data.praPasporCompleted ?? 0}/11 • Tahapan ${data.mainCompleted ?? 0}/12`,
				};
			default:
				return { percent: 0, label: "-" };
		}
	};

	const panels = [
		{
			name: "PMB",
			key: "pmb",
			path: "pmb",
			desc: "Pendaftaran, Berkas Fisik & Skema DP",
		},
		{
			name: "CRM",
			key: "crm",
			path: "crm",
			desc: "Buku Komunikasi, ODS & Pra-Magang",
		},
		{
			name: "Finance",
			key: "finance",
			path: "finance",
			desc: "Partisi Biaya, 6 Semester & Talangan",
		},
		{
			name: "Akademik",
			key: "academic",
			path: "akademik",
			desc: "Nilai Mata Kuliah, SKS & Assessment",
		},
		{
			name: "PA",
			key: "pa",
			path: "pa",
			desc: "Hafalan Vocab, Konseling & Interview",
		},
		{
			name: "Magang",
			key: "internship",
			path: "magang",
			desc: "Pra-Paspor, Paspor, Visa, MCU & Tiket",
		},
	];

	return (
		<div className="space-y-6 pb-12">
			{/* HERO SECTION */}
			<Card className="border-0 shadow-md bg-gradient-to-br from-[#0517B0] via-blue-700 to-indigo-800 text-white overflow-hidden relative rounded-2xl">
				<div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
				<CardContent className="p-6 sm:p-8 relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
								Portal Mahasiswa Nusadaya
							</span>
						</div>
						<h1 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">
							Halo, {student?.name}!
						</h1>
						<p className="text-blue-100 text-sm mb-6 max-w-xl">
							Pantau secara real-time status validasi berkas, nilai akademik,
							keuangan, dan kesiapan keberangkatan magang ke luar negeri.
						</p>
						<div className="flex flex-wrap gap-2.5">
							<div className="bg-black/20 rounded-xl px-3.5 py-2 border border-white/10 backdrop-blur-xs">
								<p className="text-[11px] text-blue-200 mb-1">
									Peminatan / Program
								</p>
								<PeminatanBadge
									subProgram={student?.subProgram}
									destinationCountry={student?.destinationCountry}
									program={student?.program}
									className="bg-white/95 text-slate-900 border-white/20"
								/>
							</div>
							<div className="bg-black/20 rounded-xl px-3.5 py-2 border border-white/10 backdrop-blur-xs">
								<p className="text-[11px] text-blue-200">Angkatan</p>
								<p className="font-bold text-sm text-white mt-0.5">
									{student?.cohort ? `Batch ${student.cohort}` : "-"}
								</p>
							</div>
							<div className="bg-black/20 rounded-xl px-3.5 py-2 border border-white/10 backdrop-blur-xs">
								<p className="text-[11px] text-blue-200 mb-1">Negara Tujuan</p>
								<PeminatanBadge
									destinationCountry={student?.destinationCountry}
									showCountryOnly={true}
									className="bg-white/95 text-slate-900 border-white/20"
								/>
							</div>
						</div>
					</div>
					<div className="flex flex-col items-center md:items-end gap-2 shrink-0">
						<span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
							Status Kesiapan Keseluruhan
						</span>
						{student?.overallStatus === "AMAN" ? (
							<div className="bg-emerald-400 text-emerald-950 font-extrabold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md text-sm">
								<CheckCircle2 className="w-5 h-5" />
								AMAN & SIAP
							</div>
						) : student?.overallStatus === "TIDAK_AMAN" ? (
							<div className="bg-rose-500 text-white font-extrabold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md text-sm">
								<AlertCircle className="w-5 h-5" />
								TIDAK AMAN
							</div>
						) : (
							<div className="bg-amber-400 text-amber-950 font-extrabold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md text-sm">
								<Clock className="w-5 h-5" />
								PROSES PENGERJAAN
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* HEADING PROGRESS */}
			<div className="flex items-center justify-between mt-8 mb-2">
				<div>
					<h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
						<FileText className="w-5 h-5 text-[#0517B0]" />
						Progress Tracking 6 Divisi
					</h2>
					<p className="text-xs text-slate-500 mt-0.5">
						Rincian capaian kelengkapan berkas, pemenuhan kualifikasi & validasi
						per divisi
					</p>
				</div>
			</div>

			{/* 6 PANEL CARDS WITH PROGRESS BARS */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{panels.map((panel, idx) => {
					const panelData = progress?.[panel.key];
					const isAcc = panelData?.isAcc;
					const status = panelData?.status;
					const progressInfo = getPanelProgressInfo(panel.key, panelData);

					return (
						<Card
							key={panel.key}
							className="border-slate-200/90 shadow-xs transition-all hover:shadow-md hover:border-slate-300 rounded-2xl bg-white flex flex-col justify-between"
						>
							<CardContent className="p-5 flex flex-col h-full justify-between space-y-4">
								<div>
									<div className="flex items-center gap-3 mb-3">
										<div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm bg-[#0517B0] text-white shadow-xs shrink-0">
											{idx + 1}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between gap-1">
												<h3 className="font-bold text-slate-900 text-base truncate">
													{panel.name}
												</h3>
												{renderStatus(isAcc, status)}
											</div>
											<p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
												{panel.desc}
											</p>
										</div>
									</div>

									{/* Progress Bar & Sub-metrics */}
									<div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
										<div className="flex items-center justify-between text-xs">
											<span className="font-medium text-slate-600">
												Progres Divisi:
											</span>
											<span className="font-extrabold text-[#0517B0] font-mono">
												{progressInfo.percent}%
											</span>
										</div>
										<Progress
											value={progressInfo.percent}
											className="h-2 bg-slate-200/60 rounded-full"
										/>
										<p className="text-[11px] text-slate-600 font-medium truncate pt-0.5">
											{progressInfo.label}
										</p>
										{progressInfo.subLabel && (
											<p className="text-[10px] text-slate-500 font-mono truncate">
												{progressInfo.subLabel}
											</p>
										)}
									</div>
								</div>

								<div className="pt-2 border-t border-slate-100">
									<Link
										href={`/mahasiswa/panel/${panel.path}`}
										className="inline-flex items-center justify-center rounded-xl text-xs font-semibold transition-colors border h-9 px-3 w-full text-[#0517B0] bg-blue-50/50 hover:bg-blue-100/70 border-blue-200/60"
									>
										Lihat Rincian Panel {panel.name}{" "}
										<ExternalLink className="w-3 h-3 ml-1.5" />
									</Link>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* TAHAP FINALISASI & EVALUATOR CARD */}
			<Card className="border-slate-200/90 shadow-sm mt-8 border-t-4 border-t-[#0517B0] rounded-2xl overflow-hidden bg-white">
				<CardHeader className="pb-3 bg-slate-50/60 border-b border-slate-100">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
						<CardTitle className="text-lg text-slate-900 font-bold flex items-center gap-2">
							<Award className="w-5 h-5 text-[#0517B0]" />
							Tahap Finalisasi (Evaluator & SK Direktur)
						</CardTitle>
						<Link
							href="/mahasiswa/panel/evaluator"
							className="inline-flex items-center text-xs font-semibold text-[#0517B0] hover:text-blue-800"
						>
							Buka Panel Evaluator & SK{" "}
							<ArrowRight className="w-3.5 h-3.5 ml-1" />
						</Link>
					</div>
				</CardHeader>
				<CardContent className="p-6 space-y-4">
					<div className="flex flex-col md:flex-row gap-6 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
						<div className="flex-1">
							<p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">
								Keputusan Evaluator
							</p>
							{progress?.finalDecision?.evaluatorDecision ===
							"layak_berangkat" ? (
								<p className="font-bold text-emerald-600 flex items-center gap-2 text-sm">
									<CheckCircle2 className="w-4 h-4" /> Layak Berangkat (ACC)
								</p>
							) : progress?.finalDecision?.evaluatorDecision ? (
								<p className="font-semibold text-amber-700 capitalize text-sm">
									{progress.finalDecision.evaluatorDecision.replace("_", " ")}
								</p>
							) : (
								<p className="font-medium text-slate-400 text-sm">
									Menunggu Sidang Evaluasi
								</p>
							)}
						</div>

						<div className="hidden md:block w-px bg-slate-200"></div>

						<div className="flex-1">
							<p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">
								Persetujuan & Penerbitan SK Direktur
							</p>
							{progress?.finalDecision?.isApprovedByDirector ? (
								<p className="font-bold text-emerald-600 flex items-center gap-2 text-sm">
									<CheckCircle2 className="w-4 h-4" /> SK Direktur Telah
									Diterbitkan
								</p>
							) : (
								<p className="font-medium text-slate-400 text-sm">
									Belum Terbit / Menunggu Pengesahan
								</p>
							)}
						</div>
					</div>

					<div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
						<p className="text-xs text-slate-500 italic">
							* Pastikan seluruh 6 pintu divisi telah berstatus{" "}
							<span className="font-bold text-emerald-600">Selesai (ACC)</span>{" "}
							agar proses finalisasi dapat disahkan.
						</p>
						<Link
							href="/mahasiswa/panel/evaluator"
							className="inline-flex items-center justify-center rounded-xl text-xs font-bold transition-colors h-9 px-4 text-white bg-[#0517B0] hover:bg-blue-800 shadow-xs shrink-0 w-full sm:w-auto"
						>
							Buka Rincian Sidang Evaluasi
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
