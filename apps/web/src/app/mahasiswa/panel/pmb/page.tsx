"use client";

import {
	AlertCircle,
	ArrowLeft,
	Building,
	CheckCircle,
	CheckCircle2,
	Clock,
	DollarSign,
	FileCheck,
	FileText,
	Info,
	RefreshCw,
	ShieldCheck,
	Users,
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
import { formatRupiah } from "@/utils/format";

export default function PmbPanelMahasiswa() {
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
			const res = await api.mahasiswa.panel.pmb.get();
			if (res.data?.success) {
				setData(res.data.data);
			}
		} catch (err) {
			console.error("Gagal mengambil data PMB:", err);
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

	const renderChecklistItem = (label: string, isChecked: boolean) => (
		<div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl transition-colors hover:bg-slate-100/60">
			<span className="font-medium text-slate-700 flex items-center gap-2.5 text-sm">
				<FileText className="w-4 h-4 text-slate-400 shrink-0" />
				{label}
			</span>
			{isChecked ? (
				<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-xs">
					<CheckCircle2 className="w-3 h-3 mr-1" /> Lengkap
				</Badge>
			) : (
				<Badge
					variant="outline"
					className="text-slate-400 bg-white border-slate-200 text-xs"
				>
					<Clock className="w-3 h-3 mr-1" /> Belum
				</Badge>
			)}
		</div>
	);

	const mainChecklist = [
		{ label: "Penerimaan Formulir", checked: Boolean(data?.formReceived) },
		{
			label: "Kelengkapan Dokumen Dasar",
			checked: Boolean(data?.documentsComplete),
		},
		{ label: "Input Data Sistem", checked: Boolean(data?.dataInputted) },
		{ label: "Follow Up Awal", checked: Boolean(data?.initialFollowUp) },
	];

	const docChecklist = [
		{ label: "Kartu Tanda Penduduk (KTP)", checked: Boolean(data?.docKtp) },
		{ label: "Kartu Keluarga (KK)", checked: Boolean(data?.docKk) },
		{ label: "Curriculum Vitae (CV)", checked: Boolean(data?.docCv) },
		{ label: "Ijazah Terakhir", checked: Boolean(data?.docIjazah) },
		{ label: "Transkrip Nilai", checked: Boolean(data?.docTranskrip) },
		{ label: "Paspor Halaman Depan", checked: Boolean(data?.docPassportDepan) },
		{ label: "Paspor Halaman Visa", checked: Boolean(data?.docPassportVisa) },
		{
			label: "Surat Keterangan Bebas Narkoba (SKBM)",
			checked: Boolean(data?.docSkbm),
		},
		{ label: "Surat Keterangan MCU", checked: Boolean(data?.docMcu) },
		{
			label: "Sertifikasi Bahasa (TOEIC/JLPT/TOCFL)",
			checked: Boolean(data?.docSertifikasiBahasa),
		},
	];

	const mainCompletedCount = mainChecklist.filter((c) => c.checked).length;
	const docCompletedCount = docChecklist.filter((c) => c.checked).length;
	const totalCompleted = mainCompletedCount + docCompletedCount;
	const totalItems = 14;
	const progressPercentage = (totalCompleted / totalItems) * 100;

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
								Panel PMB (Penerimaan Mahasiswa Baru)
							</CardTitle>
							<CardDescription className="mt-1 text-sm text-slate-500">
								Status Verifikasi Berkas Pendaftaran & Skema Keuangan Awal
							</CardDescription>
						</div>
						{data?.isAcc ? (
							<Badge className="bg-emerald-500 text-white px-3.5 py-1.5 text-sm rounded-full shadow-sm font-semibold">
								<CheckCircle className="w-4 h-4 mr-1.5" /> Telah di-ACC PMB
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="text-slate-500 px-3.5 py-1.5 text-sm rounded-full bg-white border-slate-200 font-medium"
							>
								<Clock className="w-4 h-4 mr-1.5 text-amber-500" /> Sedang
								Diproses
							</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-6 sm:p-8 space-y-8">
					{/* Section 1: Progress & Checklist Utama */}
					<div>
						<div className="flex justify-between items-end mb-3">
							<div>
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
									<FileCheck className="w-4 h-4 text-[#0517B0]" />
									Progres Validasi Berkas Mahasiswa
								</h3>
								<p className="text-xs text-slate-500 mt-0.5">
									{totalCompleted} dari {totalItems} item checklist telah
									terpenuhi ({mainCompletedCount}/4 Utama • {docCompletedCount}
									/10 Dokumen)
								</p>
							</div>
							<span className="text-base font-extrabold text-[#0517B0]">
								{Math.round(progressPercentage)}%
							</span>
						</div>
						<Progress
							value={progressPercentage}
							className="h-3 bg-slate-100 mb-6 rounded-full"
						/>

						{/* 4 Checklist Utama */}
						<div className="space-y-2 mb-6">
							<h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
								1. Validasi Administrasi Utama
							</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{mainChecklist.map((item, idx) => (
									<div key={idx}>
										{renderChecklistItem(item.label, item.checked)}
									</div>
								))}
							</div>
						</div>

						{/* 10 Checklist Dokumen Fisik */}
						<div className="space-y-2">
							<h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
								2. Kelengkapan Berkas Fisik & Dokumen
							</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{docChecklist.map((item, idx) => (
									<div key={idx}>
										{renderChecklistItem(item.label, item.checked)}
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Section 2: Fasilitas Rumah Juang & Informasi Akuisisi */}
					<div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
							<div>
								<span className="text-xs text-blue-700/80 block font-semibold uppercase tracking-wider">
									Fasilitas Asrama
								</span>
								<p className="text-sm font-bold text-blue-950 mt-1 flex items-center gap-1.5">
									<Building className="w-4 h-4 text-blue-600" />
									Rumah Juang
								</p>
							</div>
							<Badge
								className={
									data?.rumahJuang
										? "bg-emerald-100 text-emerald-800 border-0"
										: "bg-slate-100 text-slate-600 border-0"
								}
							>
								{data?.rumahJuang ? "Aktif / Terdaftar" : "Tidak Aktif"}
							</Badge>
						</div>

						<div className="p-4 bg-slate-50 rounded-xl border border-slate-100 md:col-span-2">
							<div className="flex items-center gap-2 mb-2">
								<Info className="w-4 h-4 text-blue-600" />
								<span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
									Informasi Rekomendasi & Akuisisi
								</span>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
								<div>
									<span className="text-slate-500 block">Rekomendasi</span>
									<span className="font-semibold text-slate-800">
										{data?.rekomendasi || "-"}
									</span>
								</div>
								<div>
									<span className="text-slate-500 block">Tim Visit</span>
									<span className="font-semibold text-slate-800">
										{data?.timVisit || "-"}
									</span>
								</div>
								<div>
									<span className="text-slate-500 block">Tim Sosialisasi</span>
									<span className="font-semibold text-slate-800">
										{data?.timSosialisasi || "-"}
									</span>
								</div>
								<div>
									<span className="text-slate-500 block">RO Referral</span>
									<span className="font-semibold text-slate-800">
										{data?.roReferral || "-"}
									</span>
								</div>
								<div>
									<span className="text-slate-500 block">Mitra Sponsor</span>
									<span className="font-semibold text-slate-800">
										{data?.mitraSponsor || "-"}
									</span>
								</div>
								<div>
									<span className="text-slate-500 block">Koordinator</span>
									<span className="font-semibold text-slate-800">
										{data?.koordinator || "-"}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Section 3: Skema Keuangan Awal */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<DollarSign className="w-5 h-5 text-amber-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Skema Keuangan Pendaftaran (PMB)
							</h3>
						</div>
						{data?.paymentPlan ? (
							<div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200/60 space-y-4">
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<span className="text-xs text-amber-800/70 block mb-1 font-medium">
											Total Biaya Pendidikan
										</span>
										<span className="text-base font-bold text-amber-950 font-mono">
											{formatRupiah(data.paymentPlan.totalBiaya || 0)}
										</span>
									</div>
									<div>
										<span className="text-xs text-amber-800/70 block mb-1 font-medium">
											Total DP yang Disepakati
										</span>
										<span className="text-base font-bold text-amber-950 font-mono">
											{formatRupiah(data.paymentPlan.totalDp || 0)}
										</span>
									</div>
									<div>
										<span className="text-xs text-amber-800/70 block mb-1 font-medium">
											Pembayaran Awal DP
										</span>
										<span className="text-base font-bold text-amber-950 font-mono">
											{formatRupiah(data.paymentPlan.pembayaranAwalDp || 0)}
										</span>
									</div>
									<div>
										<span className="text-xs text-amber-800/70 block mb-1 font-medium">
											Status Pelunasan DP
										</span>
										<div className="mt-0.5">
											{data.paymentPlan.statusDp ? (
												<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 font-semibold">
													<CheckCircle2 className="w-3 h-3 mr-1" /> Lunas DP
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-amber-700 border-amber-300 bg-white font-medium"
												>
													<Clock className="w-3 h-3 mr-1" /> Belum Lunas
												</Badge>
											)}
										</div>
									</div>
								</div>

								{/* Janji Bayar Termin 2 & 3 */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-amber-200/50">
									<div className="p-3 bg-white/70 rounded-xl border border-amber-200/50">
										<span className="text-xs text-amber-800 block mb-1 font-semibold">
											Janji Bayar Tahap 2 (Termin 2)
										</span>
										<div className="text-sm font-bold text-amber-950 font-mono">
											{formatRupiah(data.paymentPlan.janjiTahap2Nominal || 0)}
											{data.paymentPlan.janjiTahap2 && (
												<span className="text-xs font-normal text-amber-700 ml-2 font-sans">
													(Jatuh Tempo:{" "}
													{new Date(
														data.paymentPlan.janjiTahap2,
													).toLocaleDateString("id-ID", {
														day: "numeric",
														month: "short",
														year: "numeric",
													})}
													)
												</span>
											)}
										</div>
										{data.paymentPlan.janjiTahap2Notes && (
											<p className="text-xs text-amber-700 mt-1 italic">
												Catatan: {data.paymentPlan.janjiTahap2Notes}
											</p>
										)}
									</div>
									<div className="p-3 bg-white/70 rounded-xl border border-amber-200/50">
										<span className="text-xs text-amber-800 block mb-1 font-semibold">
											Janji Bayar Tahap 3 (Termin 3)
										</span>
										<div className="text-sm font-bold text-amber-950 font-mono">
											{formatRupiah(data.paymentPlan.janjiTahap3Nominal || 0)}
											{data.paymentPlan.janjiTahap3 && (
												<span className="text-xs font-normal text-amber-700 ml-2 font-sans">
													(Jatuh Tempo:{" "}
													{new Date(
														data.paymentPlan.janjiTahap3,
													).toLocaleDateString("id-ID", {
														day: "numeric",
														month: "short",
														year: "numeric",
													})}
													)
												</span>
											)}
										</div>
										{data.paymentPlan.janjiTahap3Notes && (
											<p className="text-xs text-amber-700 mt-1 italic">
												Catatan: {data.paymentPlan.janjiTahap3Notes}
											</p>
										)}
									</div>
								</div>

								{data.paymentPlan.pengajuanDanaTalangan && (
									<div className="mt-3 p-3 bg-white/80 rounded-xl border border-amber-200/60">
										<span className="text-xs font-bold text-amber-800 uppercase block mb-1">
											Pengajuan Dana Talangan PMB
										</span>
										<p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">
											{data.paymentPlan.pengajuanDanaTalangan}
										</p>
									</div>
								)}
							</div>
						) : (
							<div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
								<p className="text-sm text-slate-500">
									Skema keuangan awal belum dikonfigurasi oleh PMB.
								</p>
							</div>
						)}
					</div>

					{/* Section 4: Dokumen Digital Terunggah */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<ShieldCheck className="w-5 h-5 text-emerald-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Berkas Digital PMB yang Terunggah
							</h3>
						</div>
						{data?.documents && data.documents.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{data.documents.map((doc: any, i: number) => (
									<div
										key={i}
										className="flex items-center justify-between p-3.5 border border-slate-200/80 rounded-xl bg-white shadow-xs"
									>
										<div className="flex items-center gap-3 overflow-hidden">
											<FileText className="w-5 h-5 text-slate-400 shrink-0" />
											<div className="truncate">
												<p className="text-sm font-semibold text-slate-700 truncate">
													{doc.documentKey.replace(/_/g, " ").toUpperCase()}
												</p>
												<p className="text-xs text-slate-500 truncate">
													{doc.fileName}
												</p>
											</div>
										</div>
										<div className="shrink-0 ml-2">
											{doc.isVerified ? (
												<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 px-2 py-0.5 text-[10px] border-0">
													Terverifikasi
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-slate-500 px-2 py-0.5 text-[10px] bg-white"
												>
													Menunggu
												</Badge>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
								<p className="text-sm text-slate-500">
									Belum ada dokumen digital PMB yang terunggah.
								</p>
							</div>
						)}
					</div>

					{/* Warning Keseluruhan jika Tidak Aman */}
					{data?.status === "TIDAK_AMAN" && (
						<div className="mt-8 p-4 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-3">
							<AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
							<div>
								<h4 className="font-semibold text-rose-800 text-sm">
									Perhatian Diperlukan
								</h4>
								<p className="text-sm text-rose-600 mt-1">
									Data pendaftaran Anda ditandai sebagai Perlu Perhatian/Tidak
									Aman. Mohon segera lengkapi dokumen yang kurang atau hubungi
									tim PMB Nusadaya.
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
