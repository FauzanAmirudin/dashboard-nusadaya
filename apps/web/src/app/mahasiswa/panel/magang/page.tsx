"use client";

import {
	AlertCircle,
	ArrowLeft,
	Book,
	Briefcase,
	CalendarDays,
	CheckCircle,
	CheckCircle2,
	Clock,
	FileText,
	GraduationCap,
	MapPin,
	Plane,
	PlaneTakeoff,
	ShieldCheck,
	Stethoscope,
	Ticket,
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
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	if (!mounted) return null;

	if (loading) {
		return (
			<div className="flex items-center justify-center h-[50vh]">
				<RefreshCwIcon className="w-8 h-8 text-[#0517B0] animate-spin" />
			</div>
		);
	}

	const checklistItems = [
		{ key: "passportReady", label: "Paspor" },
		{ key: "interviewReady", label: "Interview User" },
		{ key: "contractReady", label: "Kontrak Magang & MOU" },
		{ key: "loaReady", label: "Surat Izin Penerimaan Negara Tujuan" },
		{ key: "mcuReady", label: "Medical Check-Up (MCU)" },
		{ key: "visaReady", label: "Visa" },
		{ key: "pdtReady", label: "Pembekalan (PDT)" },
		{ key: "dokumentasiReady", label: "Dokumentasi Keberangkatan" },
		{ key: "ticketReady", label: "Keberangkatan" },
		{ key: "agenReady", label: "Dokumen Agen" },
	];

	const completedCount = checklistItems.filter(
		(item) => data?.[item.key],
	).length;
	const checklistPercentage = (completedCount / 10) * 100;

	const formatDate = (dateString: string | null | undefined) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			<Link
				href="/mahasiswa/dashboard"
				className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Dashboard
			</Link>

			<Card className="border-slate-200 shadow-sm overflow-hidden">
				<div className="h-2 w-full bg-[#0517B0]"></div>
				<CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
					<div className="flex justify-between items-start">
						<div>
							<CardTitle className="text-2xl text-slate-800 flex items-center gap-2">
								Panel Magang Luar Negeri
							</CardTitle>
							<CardDescription className="mt-2 text-sm">
								Persiapan Berkas & Evaluasi Keberangkatan
							</CardDescription>
						</div>
						{data?.isAcc ? (
							<Badge className="bg-emerald-500 text-white px-3 py-1 text-sm rounded-full shadow-sm">
								<CheckCircle className="w-4 h-4 mr-1.5" /> Telah di-ACC
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="text-slate-500 px-3 py-1 text-sm rounded-full bg-white"
							>
								<Clock className="w-4 h-4 mr-1.5" /> Dalam Proses
							</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-6 space-y-8">
					{/* Section 1: Timeline Kelengkapan Berkas */}
					<div>
						<div className="flex justify-between items-end mb-2">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
								<Plane className="w-5 h-5 text-blue-600" />
								Timeline Berkas Keberangkatan
							</h3>
							<span className="text-sm font-semibold text-[#0517B0]">
								{Math.round(checklistPercentage)}%
							</span>
						</div>
						<Progress
							value={checklistPercentage}
							className="h-3 bg-slate-100 mb-6"
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{checklistItems.map((item, _index) => {
								const isChecked = data?.[item.key];
								return (
									<div
										key={item.key}
										className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg"
									>
										<span className="font-medium text-slate-700 flex items-center gap-2 text-sm">
											{item.label}
										</span>
										{isChecked ? (
											<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
												<CheckCircle2 className="w-3 h-3 mr-1" /> Siap
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-500 bg-white"
											>
												<Clock className="w-3 h-3 mr-1" /> Proses
											</Badge>
										)}
									</div>
								);
							})}
						</div>
					</div>

					{/* Section 2: Detail Keberangkatan */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<PlaneTakeoff className="w-5 h-5 text-indigo-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Detail Keberangkatan
							</h3>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
							<div>
								<span className="text-xs text-indigo-500 font-semibold block mb-1">
									Estimasi Berangkat
								</span>
								<span className="text-sm font-bold text-indigo-900 flex items-center gap-1.5 mt-1">
									<CalendarDays className="w-4 h-4" />{" "}
									{formatDate(data?.estDepartureDate)}
								</span>
							</div>
							<div>
								<span className="text-xs text-indigo-500 font-semibold block mb-1">
									Kota Tujuan
								</span>
								<span className="text-sm font-bold text-indigo-900 flex items-center gap-1.5 mt-1">
									<MapPin className="w-4 h-4" /> {data?.destinationCity || "-"}
								</span>
							</div>
							<div>
								<span className="text-xs text-indigo-500 font-semibold block mb-1">
									Nama Perusahaan
								</span>
								<span className="text-sm font-bold text-indigo-900 flex items-center gap-1.5 mt-1">
									<Briefcase className="w-4 h-4" />{" "}
									{data?.internshipCompany || "-"}
								</span>
							</div>
							<div>
								<span className="text-xs text-indigo-500 font-semibold block mb-1">
									Durasi Magang
								</span>
								<span className="text-sm font-bold text-indigo-900 flex items-center gap-1.5 mt-1">
									<Clock className="w-4 h-4" />{" "}
									{data?.internshipDuration || "-"}
								</span>
							</div>
						</div>
					</div>

					{/* Section 3: Rincian Berkas Spesifik */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<FileText className="w-5 h-5 text-slate-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Rincian Data Dokumen
							</h3>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Paspor */}
							<div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
								<h4 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
									<Book className="w-4 h-4 text-slate-500" /> Identitas Paspor
								</h4>
								<div className="space-y-1">
									<p className="text-xs text-slate-500">
										Nomor:{" "}
										<span className="font-medium text-slate-700">
											{data?.passportNo || "-"}
										</span>
									</p>
									<p className="text-xs text-slate-500">
										Berlaku s/d:{" "}
										<span className="font-medium text-slate-700">
											{formatDate(data?.passportExp)}
										</span>
									</p>
								</div>
							</div>

							{/* Visa */}
							<div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
								<h4 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
									<Briefcase className="w-4 h-4 text-slate-500" /> Data Visa
								</h4>
								<div className="space-y-1">
									<p className="text-xs text-slate-500">
										Nomor:{" "}
										<span className="font-medium text-slate-700">
											{data?.visaNo || "-"}
										</span>
									</p>
									<p className="text-xs text-slate-500">
										Tipe / Status:{" "}
										<span className="font-medium text-slate-700">
											{data?.visaType || "-"} / {data?.visaStatus || "-"}
										</span>
									</p>
								</div>
							</div>

							{/* MCU */}
							<div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
								<h4 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
									<Stethoscope className="w-4 h-4 text-slate-500" /> Medical
									Check-Up
								</h4>
								<div className="space-y-1">
									<p className="text-xs text-slate-500">
										Tanggal & Lokasi:{" "}
										<span className="font-medium text-slate-700">
											{formatDate(data?.mcuDate)} @ {data?.mcuPlace || "-"}
										</span>
									</p>
									<p className="text-xs text-slate-500">
										Hasil:{" "}
										<span className="font-medium text-slate-700">
											{data?.mcuResult || "-"}
										</span>
									</p>
								</div>
							</div>

							{/* Tiket */}
							<div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
								<h4 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
									<Ticket className="w-4 h-4 text-slate-500" /> Tiket
									Penerbangan
								</h4>
								<div className="space-y-1">
									<p className="text-xs text-slate-500">
										Maskapai (Flight):{" "}
										<span className="font-medium text-slate-700">
											{data?.ticketAirline || "-"} ({data?.ticketFlight || "-"})
										</span>
									</p>
									<p className="text-xs text-slate-500">
										Tanggal Terbang:{" "}
										<span className="font-medium text-slate-700">
											{formatDate(data?.ticketDate)}
										</span>
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Section 4: Keputusan Evaluator */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<GraduationCap className="w-5 h-5 text-emerald-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Hasil Evaluasi Akhir
							</h3>
						</div>

						<div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
							<div className="flex-1">
								<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
									Keputusan Evaluator
								</p>
								<div className="flex gap-2 items-center">
									{data?.finalDecision?.evaluatorDecision === "lulus" && (
										<Badge className="bg-emerald-500 text-sm px-3">LULUS</Badge>
									)}
									{data?.finalDecision?.evaluatorDecision === "tidak_lulus" && (
										<Badge variant="destructive" className="text-sm px-3">
											TIDAK LULUS
										</Badge>
									)}
									{data?.finalDecision?.evaluatorDecision === "menunggu" && (
										<Badge className="bg-amber-500 text-sm px-3">
											MENUNGGU
										</Badge>
									)}
									{!data?.finalDecision?.evaluatorDecision && (
										<Badge
											variant="outline"
											className="text-slate-500 text-sm px-3"
										>
											Belum Dievaluasi
										</Badge>
									)}
								</div>
							</div>
							<div className="h-10 w-px bg-slate-200"></div>
							<div className="flex-1">
								<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
									Persetujuan Direktur
								</p>
								{data?.finalDecision?.isApprovedByDirector ? (
									<div className="flex items-center gap-1.5 text-emerald-600 font-bold">
										<CheckCircle2 className="w-5 h-5" /> Disetujui
									</div>
								) : (
									<div className="flex items-center gap-1.5 text-slate-400 font-medium text-sm">
										<Clock className="w-4 h-4" /> Menunggu Pengesahan
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Section 5: Dokumen & Berkas Magang */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<ShieldCheck className="w-5 h-5 text-emerald-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Dokumen Keberangkatan
							</h3>
						</div>
						{data?.documents && data.documents.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{data.documents.map((doc: any, i: number) => (
									<div
										key={i}
										className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white"
									>
										<div className="flex items-center gap-3 overflow-hidden">
											<FileText className="w-5 h-5 text-slate-400 shrink-0" />
											<div className="truncate">
												<p className="text-sm font-semibold text-slate-700 truncate">
													{doc.documentKey.replace(/_/g, " ").toUpperCase()}
												</p>
												{doc.fileName.toLowerCase().includes("dummy") ? (
													<p className="text-xs text-amber-500 italic">
														Belum ada file valid
													</p>
												) : (
													<p className="text-xs text-slate-500 truncate">
														{doc.fileName}
													</p>
												)}
											</div>
										</div>
										<div className="shrink-0 ml-2">
											{doc.isVerified ? (
												<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 px-2 py-0.5 text-[10px] border-0">
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
							<div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
								<p className="text-sm text-slate-500">
									Belum ada dokumen yang diunggah.
								</p>
							</div>
						)}
					</div>

					{/* Warning Keseluruhan */}
					{data?.status === "TIDAK_AMAN" && (
						<div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3">
							<AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
							<div>
								<h4 className="font-semibold text-rose-800 text-sm">
									Perhatian Diperlukan
								</h4>
								<p className="text-sm text-rose-600 mt-1">
									Status Keberangkatan Anda ditandai sebagai Tidak Aman.
									Pastikan kelengkapan dokumen tidak ada yang tertinggal.
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function RefreshCwIcon(props: any) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			role="img"
			aria-label="Refresh"
		>
			<title>Refresh</title>
			<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
			<path d="M3 3v5h5" />
		</svg>
	);
}
