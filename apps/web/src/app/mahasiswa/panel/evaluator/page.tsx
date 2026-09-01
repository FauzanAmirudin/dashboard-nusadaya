"use client";

import {
	AlertCircle,
	ArrowLeft,
	Award,
	CheckCircle,
	CheckCircle2,
	Clock,
	ExternalLink,
	FileDown,
	FileText,
	Info,
	RefreshCw,
	ShieldCheck,
	Sparkles,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function EvaluatorPanelMahasiswa() {
	const { user, isAuthenticated, hasHydrated } = useAuthStore();
	const [mounted, setMounted] = useState(false);
	const [data, setData] = useState<any>(null);
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
			const res = await api.mahasiswa.panel.evaluator.get();
			if (res.data?.success) {
				setData(res.data.data);
			}
		} catch (err) {
			console.error("Gagal memuat data Evaluator:", err);
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

	const formatDate = (dateString: string | null | undefined) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	const decisionMap: Record<
		string,
		{ label: string; color: string; badge: string; desc: string }
	> = {
		layak_berangkat: {
			label: "Layak Berangkat (ACC Penuh)",
			color: "text-emerald-700 bg-emerald-50 border-emerald-200",
			badge: "bg-emerald-600 text-white",
			desc: "Seluruh kualifikasi dari 6 divisi telah terpenuhi dan disetujui. Mahasiswa siap diberangkatkan ke negara penempatan magang.",
		},
		lanjut_interview: {
			label: "Lanjut Tahap Interview User",
			color: "text-blue-700 bg-blue-50 border-blue-200",
			badge: "bg-blue-600 text-white",
			desc: "Mahasiswa direkomendasikan untuk mengikuti tahap wawancara langsung dengan pihak industri/perusahaan luar negeri.",
		},
		ttd_kontrak: {
			label: "Penandatanganan Kontrak",
			color: "text-indigo-700 bg-indigo-50 border-indigo-200",
			badge: "bg-indigo-600 text-white",
			desc: "Tahap penandatanganan dokumen perjanjian magang kerja dan surat persetujuan resmi.",
		},
		remedial: {
			label: "Perlu Remedial / Pembinaan",
			color: "text-rose-700 bg-rose-50 border-rose-200",
			badge: "bg-rose-600 text-white",
			desc: "Terdapat aspek bahasa, sikap, atau nilai akademik yang memerlukan perbaikan sebelum dapat dievaluasi kembali.",
		},
		menunggu: {
			label: "Menunggu Evaluasi",
			color: "text-amber-700 bg-amber-50 border-amber-200",
			badge: "bg-amber-500 text-white",
			desc: "Data mahasiswa sedang dalam tahap peninjauan terpadu oleh Tim Evaluator Nusadaya.",
		},
	};

	const currentDecision =
		decisionMap[data?.evaluatorDecision || "menunggu"] || decisionMap.menunggu;

	const panelList = [
		{
			key: "pmb",
			name: "1. PMB",
			path: "pmb",
			desc: "Pendaftaran & Berkas Dasar",
		},
		{
			key: "crm",
			name: "2. CRM",
			path: "crm",
			desc: "Buku Komunikasi & Praktik",
		},
		{
			key: "finance",
			name: "3. Finance",
			path: "finance",
			desc: "Administrasi & Tagihan",
		},
		{
			key: "academic",
			name: "4. Akademik",
			path: "akademik",
			desc: "Nilai & SKS Vokasi",
		},
		{ key: "pa", name: "5. PA", path: "pa", desc: "Hafalan & Konseling" },
		{
			key: "internship",
			name: "6. Magang",
			path: "magang",
			desc: "Paspor, Visa & MCU",
		},
	];

	const allPanelsAcc = panelList.every(
		(p) => data?.panels?.[p.key]?.isAcc === true,
	);
	const accCount = panelList.filter(
		(p) => data?.panels?.[p.key]?.isAcc === true,
	).length;
	const accPercent = Math.round((accCount / 6) * 100);

	return (
		<div className="max-w-4xl mx-auto space-y-6 pb-12">
			<Link
				href="/mahasiswa/dashboard"
				className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Dashboard
			</Link>

			<Card className="border-slate-200/90 shadow-sm overflow-hidden rounded-2xl">
				<div className="h-2 w-full bg-[#0517B0]"></div>
				<CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
						<div>
							<CardTitle className="text-2xl text-slate-900 flex items-center gap-2 font-bold tracking-tight">
								Panel Evaluator & Finalisasi Keberangkatan
							</CardTitle>
							<CardDescription className="mt-1 text-sm text-slate-500">
								Sidang Keputusan Akhir, Pengesahan Direktur & Penerbitan Surat
								Keputusan (SK)
							</CardDescription>
						</div>
						<Badge
							className={
								allPanelsAcc
									? "bg-emerald-500 text-white px-3.5 py-1.5 text-sm rounded-full shadow-sm font-semibold"
									: "bg-amber-500 text-white px-3.5 py-1.5 text-sm rounded-full shadow-sm font-semibold"
							}
						>
							{accCount}/6 Divisi ACC ({accPercent}%)
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="p-6 sm:p-8 space-y-8">
					{/* Section 1: Banner Keputusan Evaluator */}
					<div
						className={`p-6 rounded-2xl border ${currentDecision.color} space-y-3`}
					>
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div>
								<span className="text-xs font-bold uppercase tracking-wider block opacity-75">
									Keputusan Tim Evaluator
								</span>
								<h2 className="text-xl sm:text-2xl font-extrabold mt-1">
									{currentDecision.label}
								</h2>
							</div>
							<Badge
								className={`${currentDecision.badge} px-3.5 py-1.5 text-xs uppercase font-bold tracking-wider`}
							>
								{data?.evaluatorDecision
									? data.evaluatorDecision.replace("_", " ")
									: "MENUNGGU"}
							</Badge>
						</div>
						<p className="text-xs sm:text-sm leading-relaxed opacity-90">
							{currentDecision.desc}
						</p>

						{data?.evaluatorNotes && (
							<div className="mt-4 pt-3 border-t border-black/10 text-xs">
								<span className="font-bold block mb-1">
									Catatan Khusus Evaluator:
								</span>
								<p className="italic bg-white/70 p-3 rounded-xl border border-black/5 whitespace-pre-wrap">
									"{data.evaluatorNotes}"
								</p>
							</div>
						)}

						{data?.decidedAt && (
							<p className="text-[11px] opacity-75 pt-2">
								Ditetapkan pada: {formatDate(data.decidedAt)}
							</p>
						)}
					</div>

					{/* Section 2: Status Pengesahan Direktur & Penerbitan SK */}
					<div className="p-6 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
						<div className="flex items-center gap-2">
							<ShieldCheck className="w-5 h-5 text-[#0517B0]" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Persetujuan Direktur & Surat Keputusan (SK)
							</h3>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
							<div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
								<div>
									<span className="text-xs text-slate-500 font-semibold block">
										Persetujuan Direktur Utama
									</span>
									<span className="text-sm font-bold text-slate-800 mt-1 block">
										{data?.isApprovedByDirector
											? "Telah Disetujui (Approved)"
											: "Menunggu Pengesahan"}
									</span>
								</div>
								{data?.isApprovedByDirector ? (
									<Badge className="bg-emerald-100 text-emerald-800 border-0">
										<CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Disetujui
									</Badge>
								) : (
									<Badge variant="outline" className="text-slate-500 bg-white">
										<Clock className="w-3.5 h-3.5 mr-1" /> Pending
									</Badge>
								)}
							</div>

							<div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
								<div>
									<span className="text-xs text-slate-500 font-semibold block">
										Surat Keputusan (SK) Keberangkatan
									</span>
									<span className="text-sm font-bold text-slate-800 mt-1 block">
										{data?.skDocumentUrl
											? "Dokumen SK Terbit"
											: "Belum Diterbitkan"}
									</span>
								</div>
								{data?.skDocumentUrl ? (
									<a
										href={data.skDocumentUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#0517B0] hover:bg-blue-800 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
									>
										<FileDown className="w-3.5 h-3.5" /> Unduh SK
									</a>
								) : (
									<Badge variant="outline" className="text-slate-400 bg-white">
										Belum Ada
									</Badge>
								)}
							</div>
						</div>
					</div>

					{/* Section 3: Ringkasan Status ACC 6 Divisi with Progress Bar */}
					<div className="space-y-4 pt-2">
						<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
							<div>
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
									<Award className="w-4 h-4 text-[#0517B0]" />
									Status Rekomendasi 6 Pintu Validasi Divisi
								</h3>
								<p className="text-xs text-slate-500 mt-0.5">
									{accCount} dari 6 divisi telah memberikan status rekomendasi
									ACC
								</p>
							</div>
							<span className="text-base font-extrabold text-[#0517B0] font-mono">
								{accPercent}%
							</span>
						</div>

						<Progress
							value={accPercent}
							className="h-3 bg-slate-100 rounded-full"
						/>

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
							{panelList.map((p) => {
								const panelData = data?.panels?.[p.key];
								const isAcc = Boolean(panelData?.isAcc);

								return (
									<div
										key={p.key}
										className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col justify-between space-y-3"
									>
										<div className="flex justify-between items-start">
											<div>
												<h4 className="font-bold text-slate-900 text-sm">
													{p.name}
												</h4>
												<p className="text-[11px] text-slate-500 mt-0.5">
													{p.desc}
												</p>
												{isAcc && panelData?.accAt && (
													<p className="text-[10px] text-emerald-600 font-medium mt-1">
														ACC: {formatDate(panelData.accAt)}
													</p>
												)}
											</div>
											{isAcc ? (
												<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-bold">
													ACC
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-amber-700 border-amber-300 bg-amber-50/50 text-[10px]"
												>
													Proses
												</Badge>
											)}
										</div>

										<Link
											href={`/mahasiswa/panel/${p.path}`}
											className="inline-flex items-center justify-between text-xs text-[#0517B0] hover:text-blue-800 font-semibold pt-2 border-t border-slate-100"
										>
											<span>Buka Panel Divisi</span>
											<ExternalLink className="w-3 h-3" />
										</Link>
									</div>
								);
							})}
						</div>

						{/* Action Tip */}
						{!allPanelsAcc && (
							<div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 mt-4">
								<Info className="w-5 h-5 text-[#0517B0] shrink-0 mt-0.5" />
								<div className="text-xs text-slate-700 leading-relaxed">
									<span className="font-bold text-slate-900 block mb-0.5">
										Panduan Langkah Mahasiswa:
									</span>
									Periksa panel divisi yang masih bertanda{" "}
									<span className="font-semibold text-amber-700">"Proses"</span>{" "}
									untuk melengkapi berkas, tagihan, atau syarat kehadiran yang
									belum terpenuhi agar evaluator dapat merekomendasikan
									penerbitan SK Keberangkatan.
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
