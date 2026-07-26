"use client";

import {
	Activity,
	AlertCircle,
	ArrowLeft,
	CheckCircle,
	CheckCircle2,
	ClipboardList,
	Clock,
	FileText,
	ShieldCheck,
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

	const renderChecklistItem = (label: string, isChecked: boolean) => (
		<div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
			<span className="font-medium text-slate-700 flex items-center gap-2 text-sm">
				<ShieldCheck className="w-4 h-4 text-slate-400" />
				{label}
			</span>
			{isChecked ? (
				<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
					<CheckCircle2 className="w-3 h-3 mr-1" /> Ya / Ada
				</Badge>
			) : (
				<Badge variant="outline" className="text-slate-500 bg-white">
					<XCircle className="w-3 h-3 mr-1" /> Belum / Tidak
				</Badge>
			)}
		</div>
	);

	const present = data?.practiceDaysPresent || 0;
	const total = data?.practiceDaysTotal || 0;
	const attendancePercent = total > 0 ? (present / total) * 100 : 0;

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
								Panel CRM
							</CardTitle>
							<CardDescription className="mt-2 text-sm">
								Buku Komunikasi, Kehadiran Praktik & Catatan
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
					{/* Section 1: Checklist CRM */}
					<div>
						<div className="flex justify-between items-end mb-2">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Checklist Buku Komunikasi
							</h3>
							<span className="text-sm font-semibold text-[#0517B0]">
								{Math.round(checklistPercentage)}%
							</span>
						</div>
						<Progress
							value={checklistPercentage}
							className="h-3 bg-slate-100 mb-4"
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-3">
								<h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
									ODS & Pra-Magang
								</h4>
								{renderChecklistItem(
									"Laporan ODS (Softcopy/Hardcopy)",
									data?.isOdsReport,
								)}
								{renderChecklistItem("Dokumentasi ODS", data?.odsDocumentation)}
								{renderChecklistItem(
									"Laporan Pra-Magang",
									data?.isPrammagangReport,
								)}
								{renderChecklistItem(
									"Dokumentasi Pra-Magang",
									data?.isPrammagangDocumentation,
								)}
							</div>
							<div className="space-y-3">
								<h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
									Monitoring & Persyaratan
								</h4>
								{renderChecklistItem(
									"Monitoring Orang Tua (Telp/Visit)",
									data?.isMonitoringParent,
								)}
								{renderChecklistItem(
									"Monitoring Industri",
									data?.isMonitoringIndustry,
								)}
								{renderChecklistItem(
									"Hafalan Vocab Standar",
									data?.isVocabComplete,
								)}
								{renderChecklistItem(
									"Study Permit Terbit",
									data?.hasStudyPermit,
								)}
							</div>
						</div>
					</div>

					{/* Section 2: Kehadiran Praktik & Kasus */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<Activity className="w-5 h-5 text-indigo-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Kehadiran Praktik & Catatan Kasus
							</h3>
						</div>

						<div className="space-y-6">
							<div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
								<div className="flex justify-between items-end mb-2">
									<h4 className="text-sm font-semibold text-indigo-900">
										Persentase Kehadiran Praktik
									</h4>
									<span className="text-sm font-bold text-indigo-700">
										{Math.round(attendancePercent)}%
									</span>
								</div>
								<Progress
									value={attendancePercent}
									className="h-2.5 bg-indigo-100 mb-2"
								/>
								<p className="text-xs text-indigo-600">
									Kehadiran: <span className="font-bold">{present}</span> dari
									total <span className="font-bold">{total}</span> hari yang
									diwajibkan.
								</p>
							</div>

							<div>
								{data?.hasActiveCase ? (
									<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
										<AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
										<div className="flex-1">
											<h4 className="font-bold text-amber-800 text-sm">
												Status: Ada Kasus Aktif
											</h4>
											<p className="text-sm text-amber-700 mt-2 whitespace-pre-wrap">
												{data?.caseNotes || "Tidak ada rincian catatan."}
											</p>
										</div>
									</div>
								) : (
									<div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
										<CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
										<p className="text-sm font-semibold text-emerald-700">
											Status Bersih (Tidak ada kasus aktif)
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Section 3: Dokumen & Berkas CRM */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<ShieldCheck className="w-5 h-5 text-emerald-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Dokumen & Berkas CRM
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
									Status CRM Anda ditandai sebagai Tidak Aman. Pastikan
									komunikasi dengan pembimbing tetap lancar.
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
		>
			<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
			<path d="M3 3v5h5" />
		</svg>
	);
}
