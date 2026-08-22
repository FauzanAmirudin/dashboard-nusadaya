"use client";

import {
	Activity,
	AlertCircle,
	ArrowLeft,
	BookOpen,
	Briefcase,
	Building2,
	Calendar,
	CheckCircle,
	CheckCircle2,
	Clock,
	FileText,
	HeartHandshake,
	MessageSquare,
	RefreshCw,
	ShieldCheck,
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

export default function CrmPanelMahasiswa() {
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
			const res = await api.mahasiswa.panel.crm.get();
			if (res.data?.success) {
				setData(res.data.data);
			}
		} catch (err) {
			console.error("Gagal memuat data CRM:", err);
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
					<CheckCircle2 className="w-3 h-3 mr-1" /> Selesai / Ada
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

	const present = data?.practiceDaysPresent || 0;
	const total = data?.practiceDaysTotal || 0;
	const attendancePercent =
		total > 0 ? Math.min((present / total) * 100, 100) : 0;

	const completedCount = [
		data?.isOdsReport,
		data?.odsDocumentation,
		data?.isPrammagangReport,
		data?.isPrammagangDocumentation,
		data?.isMonitoringParent,
		data?.isMonitoringIndustry,
		data?.isVocabComplete,
		data?.hasStudyPermit,
	].filter(Boolean).length;
	const checklistPercentage = (completedCount / 8) * 100;

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
								Panel CRM (Customer Relationship Management)
							</CardTitle>
							<CardDescription className="mt-1 text-sm text-slate-500">
								Monitoring Kegiatan Praktik, ODS, Pra-Magang & Komunikasi
								Pembimbing
							</CardDescription>
						</div>
						{data?.isAcc ? (
							<Badge className="bg-emerald-500 text-white px-3.5 py-1.5 text-sm rounded-full shadow-sm font-semibold">
								<CheckCircle className="w-4 h-4 mr-1.5" /> Telah di-ACC CRM
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
					{/* Section 1: Checklist Buku Komunikasi & Monitoring */}
					<div>
						<div className="flex justify-between items-end mb-3">
							<div>
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
									<BookOpen className="w-4 h-4 text-[#0517B0]" />
									Checklist Validasi CRM & Buku Komunikasi
								</h3>
								<p className="text-xs text-slate-500 mt-0.5">
									{completedCount} dari 8 kriteria telah terpenuhi
								</p>
							</div>
							<span className="text-base font-extrabold text-[#0517B0]">
								{Math.round(checklistPercentage)}%
							</span>
						</div>
						<Progress
							value={checklistPercentage}
							className="h-3 bg-slate-100 mb-6 rounded-full"
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-3">
								<h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
									ODS & Pra-Magang
								</h4>
								{renderChecklistItem(
									"Laporan ODS (Softcopy / Hardcopy)",
									data?.isOdsReport,
								)}
								{renderChecklistItem(
									"Dokumentasi Foto/Video ODS",
									data?.odsDocumentation,
								)}
								{renderChecklistItem(
									"Laporan Kegiatan Pra-Magang",
									data?.isPrammagangReport,
								)}
								{renderChecklistItem(
									"Dokumentasi Pra-Magang",
									data?.isPrammagangDocumentation,
								)}
							</div>
							<div className="space-y-3">
								<h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Monitoring & Legalitas
								</h4>
								{renderChecklistItem(
									"Monitoring Orang Tua (Telp / Visit)",
									data?.isMonitoringParent,
								)}
								{renderChecklistItem(
									"Monitoring Kunjungan Industri",
									data?.isMonitoringIndustry,
								)}
								{renderChecklistItem(
									"Kelulusan Hafalan Vocab Standar",
									data?.isVocabComplete,
								)}
								{renderChecklistItem(
									"Penerbitan Study Permit",
									data?.hasStudyPermit,
								)}
							</div>
						</div>
					</div>

					{/* Section 2: Kehadiran Praktik & Detail Pra-Magang */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<Activity className="w-5 h-5 text-indigo-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Kehadiran Praktik & Informasi Pra-Magang
							</h3>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Card Kehadiran Praktik */}
							<div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-between">
								<div>
									<div className="flex justify-between items-end mb-2">
										<h4 className="text-sm font-bold text-indigo-950">
											Persentase Kehadiran Praktik
										</h4>
										<span className="text-base font-extrabold text-indigo-700">
											{Math.round(attendancePercent)}%
										</span>
									</div>
									<Progress
										value={attendancePercent}
										className="h-2.5 bg-indigo-200/50 mb-3 rounded-full"
									/>
									<p className="text-xs text-indigo-700">
										Kehadiran: <span className="font-bold">{present} hari</span>{" "}
										dari total kewajiban{" "}
										<span className="font-bold">{total} hari</span>.
									</p>
								</div>
								<div className="mt-4 pt-3 border-t border-indigo-100/80 flex items-center justify-between text-xs text-indigo-900">
									<span>Status Absensi Praktik:</span>
									<Badge
										className={
											data?.practiceAttendance
												? "bg-emerald-100 text-emerald-800 border-0"
												: "bg-amber-100 text-amber-800 border-0"
										}
									>
										{data?.practiceAttendance
											? "Memenuhi Target"
											: "Belum Memenuhi"}
									</Badge>
								</div>
							</div>

							{/* Card Detail Pra-Magang */}
							<div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
								<h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
									<Briefcase className="w-4 h-4 text-blue-600" />
									Data Penempatan Pra-Magang
								</h4>
								<div className="space-y-2 text-xs">
									<div className="flex justify-between">
										<span className="text-slate-500">Industri / Mitra:</span>
										<span className="font-semibold text-slate-800 text-right">
											{data?.pramagangIndustry || "Belum ditentukan"}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-slate-500">Periode Pra-Magang:</span>
										<span className="font-semibold text-slate-800 text-right">
											{data?.pramagangStartDate
												? formatDate(data.pramagangStartDate)
												: "-"}{" "}
											s/d{" "}
											{data?.pramagangEndDate
												? formatDate(data.pramagangEndDate)
												: "-"}
										</span>
									</div>
									{data?.pramagangVideoLink && (
										<div className="pt-2">
											<a
												href={data.pramagangVideoLink}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
											>
												<Video className="w-3.5 h-3.5" /> Lihat Video
												Dokumentasi Pra-Magang
											</a>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Section 3: Status Kasus Aktif */}
					<div className="pt-6 border-t border-slate-100">
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
							<MessageSquare className="w-4 h-4 text-slate-600" />
							Catatan Kasus & Pendampingan CRM
						</h3>

						{data?.hasActiveCase ? (
							<div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
								<div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
									<AlertCircle className="w-4 h-4 text-amber-600" />
									Terdapat Catatan Kasus Aktif
								</div>
								<p className="text-xs text-amber-800 leading-relaxed whitespace-pre-wrap">
									{data?.caseNotes ||
										"Tidak ada detail catatan tambahan dari tim CRM."}
								</p>
							</div>
						) : (
							<div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
								<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
								<p className="text-xs font-semibold text-emerald-800">
									Status Catatan Bersih (Tidak ada catatan kasus aktif atau
									pelanggaran).
								</p>
							</div>
						)}
					</div>

					{/* Section 4: Log Komunikasi Terakhir */}
					{data?.logs && data.logs.length > 0 && (
						<div className="pt-6 border-t border-slate-100">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
								<HeartHandshake className="w-4 h-4 text-purple-600" />
								Riwayat Sesi Komunikasi CRM
							</h3>
							<div className="space-y-2.5">
								{data.logs.map((log: any) => (
									<div
										key={log.id}
										className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
									>
										<div>
											<span className="font-semibold text-slate-800 block">
												{log.topic || "Sesi Komunikasi Monitoring"}
											</span>
											<span className="text-slate-500 mt-0.5 block">
												Media: {log.media || "Tatap Muka"} • Lokasi:{" "}
												{log.location || "Kampus / Online"}
											</span>
										</div>
										<span className="text-slate-400 font-medium shrink-0 ml-3">
											{formatDate(log.createdAt)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Section 5: Dokumen CRM */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<ShieldCheck className="w-5 h-5 text-emerald-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Dokumen & Berkas Terkait CRM
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
									Belum ada dokumen CRM yang diunggah.
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
