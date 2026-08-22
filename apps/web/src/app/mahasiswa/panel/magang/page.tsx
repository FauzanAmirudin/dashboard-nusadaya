"use client";

import {
	AlertCircle,
	ArrowLeft,
	Book,
	Briefcase,
	Building2,
	CalendarDays,
	CheckCircle,
	CheckCircle2,
	Clock,
	Coins,
	FileCheck,
	FileText,
	GraduationCap,
	HeartPulse,
	MapPin,
	Plane,
	PlaneTakeoff,
	RefreshCw,
	ShieldCheck,
	Stethoscope,
	Ticket,
	Video,
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
import { formatRupiah } from "@/utils/format";

export default function MagangPanelMahasiswa() {
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
			const res = await api.mahasiswa.panel.magang.get();
			if (res.data?.success) {
				setData(res.data.data);
			}
		} catch (err) {
			console.error("Gagal memuat data Magang:", err);
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
				<ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
				{label}
			</span>
			{isChecked ? (
				<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-xs">
					<CheckCircle2 className="w-3 h-3 mr-1" /> Siap
				</Badge>
			) : (
				<Badge
					variant="outline"
					className="text-slate-400 bg-white border-slate-200 text-xs"
				>
					<Clock className="w-3 h-3 mr-1" /> Proses
				</Badge>
			)}
		</div>
	);

	// 11 Checklist Pra-Paspor
	const praPasporItems = [
		{
			label: "Pas Foto 4x6 (Background Putih)",
			checked: Boolean(data?.praPasporPasFoto),
		},
		{
			label: "Kartu Tanda Mahasiswa (KTM)",
			checked: Boolean(data?.praPasporKtm),
		},
		{
			label: "Kartu Tanda Penduduk (KTP)",
			checked: Boolean(data?.praPasporKtp),
		},
		{ label: "Kartu Keluarga (KK)", checked: Boolean(data?.praPasporKk) },
		{ label: "Akta Kelahiran", checked: Boolean(data?.praPasporAktaKelahiran) },
		{
			label: "Sertifikat Kelulusan SL21",
			checked: Boolean(data?.praPasporSl21),
		},
		{
			label: "Surat Keterangan Masih Aktif (SKMA)",
			checked: Boolean(data?.praPasporSkma),
		},
		{
			label: "Surat Rekomendasi Disdik",
			checked: Boolean(data?.praPasporRekomendasiDisdik),
		},
		{
			label: "Surat Pernyataan Gap Year",
			checked: Boolean(data?.praPasporGapYear),
		},
		{ label: "Status PDDIKTI Aktif", checked: Boolean(data?.praPasporPddikti) },
		{
			label: "Curriculum Vitae (CV) Bahasa Asing",
			checked: Boolean(data?.praPasporCv),
		},
	];

	const praPasporCompleted = praPasporItems.filter((i) => i.checked).length;
	const praPasporPercent = (praPasporCompleted / praPasporItems.length) * 100;

	// Checklist Dokumen & Tahapan Magang
	const mainMagangItems = [
		{ key: "passportReady", label: "Paspor Fisik Valid" },
		{ key: "interviewReady", label: "Interview Perusahaan / User" },
		{ key: "loaReady", label: "Surat Izin Masuk (LoA)" },
		{ key: "lolReady", label: "Surat Rekomendasi Kerja (LoL)" },
		{ key: "moaReady", label: "Perjanjian Kerjasama (MoA)" },
		{ key: "contractReady", label: "Kontrak Magang Resmi" },
		{ key: "mcuReady", label: "Medical Check-Up (MCU)" },
		{ key: "visaReady", label: "Penerbitan Visa Magang" },
		{ key: "ticketReady", label: "Tiket Penerbangan" },
		{ key: "pdtReady", label: "Pembekalan Pra-Keberangkatan (PDT)" },
		{ key: "dokumentasiReady", label: "Dokumentasi Keberangkatan" },
		{ key: "agenReady", label: "Verifikasi Dokumen Agen" },
	];

	const completedCount = mainMagangItems.filter(
		(item) => data?.[item.key],
	).length;
	const checklistPercentage = (completedCount / mainMagangItems.length) * 100;

	const formatDate = (dateString: string | null | undefined) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

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
								Panel Magang Luar Negeri
							</CardTitle>
							<CardDescription className="mt-1 text-sm text-slate-500">
								Validasi Berkas Pra-Paspor, Dokumen Keberangkatan & Penempatan
								Perusahaan
							</CardDescription>
						</div>
						{data?.isAcc ? (
							<Badge className="bg-emerald-500 text-white px-3.5 py-1.5 text-sm rounded-full shadow-sm font-semibold">
								<CheckCircle className="w-4 h-4 mr-1.5" /> Telah di-ACC Magang
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="text-slate-500 px-3.5 py-1.5 text-sm rounded-full bg-white border-slate-200 font-medium"
							>
								<Clock className="w-4 h-4 mr-1.5 text-amber-500" /> Dalam Proses
							</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-6 sm:p-8 space-y-8">
					{/* Section 1: Detail Penempatan & Keberangkatan */}
					<div className="bg-gradient-to-br from-indigo-900 via-[#0517B0] to-blue-600 text-white p-6 rounded-2xl shadow-md space-y-4">
						<div className="flex items-center gap-2 border-b border-white/20 pb-3">
							<PlaneTakeoff className="w-5 h-5 text-blue-200" />
							<span className="text-sm font-bold uppercase tracking-wider text-blue-100">
								Informasi Penempatan Magang
							</span>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
								<span className="text-[11px] text-blue-200 block">
									Estimasi Tanggal Terbang
								</span>
								<p className="text-sm font-bold mt-1 flex items-center gap-1.5">
									<CalendarDays className="w-3.5 h-3.5 text-blue-300" />
									{formatDate(data?.estDepartureDate)}
								</p>
							</div>
							<div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
								<span className="text-[11px] text-blue-200 block">
									Kota & Negara Tujuan
								</span>
								<p className="text-sm font-bold mt-1 flex items-center gap-1.5">
									<MapPin className="w-3.5 h-3.5 text-blue-300" />
									{data?.destinationCity || "-"}
								</p>
							</div>
							<div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
								<span className="text-[11px] text-blue-200 block">
									Instansi / Perusahaan
								</span>
								<p className="text-sm font-bold mt-1 flex items-center gap-1.5 truncate">
									<Briefcase className="w-3.5 h-3.5 text-blue-300 shrink-0" />
									<span className="truncate">
										{data?.internshipCompany || "-"}
									</span>
								</p>
							</div>
							<div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
								<span className="text-[11px] text-blue-200 block">
									Durasi Kontrak
								</span>
								<p className="text-sm font-bold mt-1 flex items-center gap-1.5">
									<Clock className="w-3.5 h-3.5 text-blue-300" />
									{data?.internshipDuration || "1 Tahun"}
								</p>
							</div>
						</div>
					</div>

					{/* Section 2: Checklist Pra-Paspor (11 Berkas) */}
					<div className="space-y-4">
						<div className="flex justify-between items-end">
							<div>
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
									<FileCheck className="w-4 h-4 text-[#0517B0]" />
									Checklist Berkas Pra-Paspor
								</h3>
								<p className="text-xs text-slate-500 mt-0.5">
									{praPasporCompleted} dari {praPasporItems.length} berkas
									pra-paspor telah diverifikasi
								</p>
							</div>
							<span className="text-base font-extrabold text-[#0517B0]">
								{Math.round(praPasporPercent)}%
							</span>
						</div>
						<Progress
							value={praPasporPercent}
							className="h-2.5 bg-slate-100 rounded-full"
						/>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{praPasporItems.map((item, idx) => (
								<div key={idx}>
									{renderChecklistItem(item.label, item.checked)}
								</div>
							))}
						</div>
					</div>

					{/* Section 3: Tahapan & Dokumen Keberangkatan */}
					<div className="pt-6 border-t border-slate-100 space-y-4">
						<div className="flex justify-between items-end">
							<div>
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
									<Plane className="w-4 h-4 text-[#0517B0]" />
									Tahapan & Dokumen Keberangkatan Magang
								</h3>
								<p className="text-xs text-slate-500 mt-0.5">
									{completedCount} dari {mainMagangItems.length} tahapan siap
								</p>
							</div>
							<span className="text-base font-extrabold text-[#0517B0]">
								{Math.round(checklistPercentage)}%
							</span>
						</div>
						<Progress
							value={checklistPercentage}
							className="h-2.5 bg-slate-100 rounded-full"
						/>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{mainMagangItems.map((item) => {
								const isChecked = Boolean(data?.[item.key]);
								return (
									<div key={item.key}>
										{renderChecklistItem(item.label, isChecked)}
									</div>
								);
							})}
						</div>
					</div>

					{/* Section 4: Rincian Paspor, Visa, MCU & Tiket */}
					<div className="pt-6 border-t border-slate-100 space-y-4">
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
							<Book className="w-4 h-4 text-slate-600" />
							Rincian Identitas & Berkas Resmi
						</h3>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{/* Paspor Card */}
							<div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
										<Book className="w-4 h-4 text-blue-600" /> Paspor
									</span>
									{data?.passportReady ? (
										<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px]">
											Siap
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-slate-500 text-[10px]"
										>
											Belum Siap
										</Badge>
									)}
								</div>
								<div className="text-xs space-y-1">
									<p className="text-slate-500">
										Nomor Paspor:{" "}
										<span className="font-bold text-slate-800 font-mono">
											{data?.passportNo || "-"}
										</span>
									</p>
									<p className="text-slate-500">
										Masa Berlaku:{" "}
										<span className="font-medium text-slate-700">
											{formatDate(data?.passportExp)}
										</span>
									</p>
								</div>
							</div>

							{/* Visa Card */}
							<div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
										<Briefcase className="w-4 h-4 text-indigo-600" /> Visa
										Magang
									</span>
									{data?.visaReady ? (
										<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px]">
											Terbit
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-slate-500 text-[10px]"
										>
											Proses
										</Badge>
									)}
								</div>
								<div className="text-xs space-y-1">
									<p className="text-slate-500">
										Nomor Visa:{" "}
										<span className="font-bold text-slate-800 font-mono">
											{data?.visaNo || "-"}
										</span>
									</p>
									<p className="text-slate-500">
										Tipe / Status:{" "}
										<span className="font-medium text-slate-700">
											{data?.visaType || "-"} ({data?.visaStatus || "Proses"})
										</span>
									</p>
								</div>
							</div>

							{/* MCU Card */}
							<div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
										<Stethoscope className="w-4 h-4 text-emerald-600" /> Medical
										Check-Up
									</span>
									{data?.mcuReady ? (
										<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px]">
											Fit / Lulus
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-slate-500 text-[10px]"
										>
											Menunggu
										</Badge>
									)}
								</div>
								<div className="text-xs space-y-1">
									<p className="text-slate-500">
										RS / Klinik:{" "}
										<span className="font-medium text-slate-700">
											{data?.mcuPlace || "-"}
										</span>
									</p>
									<p className="text-slate-500">
										Tanggal MCU:{" "}
										<span className="font-medium text-slate-700">
											{formatDate(data?.mcuDate)}
										</span>
									</p>
									<p className="text-slate-500">
										Hasil:{" "}
										<span className="font-bold text-slate-800">
											{data?.mcuResult || "-"}
										</span>
									</p>
								</div>
							</div>

							{/* Tiket Card */}
							<div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
										<Ticket className="w-4 h-4 text-amber-600" /> Tiket Pesawat
									</span>
									{data?.ticketReady ? (
										<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px]">
											Issued
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-slate-500 text-[10px]"
										>
											Belum
										</Badge>
									)}
								</div>
								<div className="text-xs space-y-1">
									<p className="text-slate-500">
										Maskapai & Flight:{" "}
										<span className="font-medium text-slate-700">
											{data?.ticketAirline || "-"} ({data?.ticketFlight || "-"})
										</span>
									</p>
									<p className="text-slate-500">
										Tanggal Terbang:{" "}
										<span className="font-medium text-slate-700">
											{formatDate(data?.ticketDate)}
										</span>
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Section 5: Dokumen Magang */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<ShieldCheck className="w-5 h-5 text-emerald-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Dokumen & Berkas Magang
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
									Belum ada dokumen magang yang diunggah.
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
