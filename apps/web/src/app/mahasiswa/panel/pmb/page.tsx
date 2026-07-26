"use client";

import {
	AlertCircle,
	ArrowLeft,
	CheckCircle,
	CheckCircle2,
	Clock,
	DollarSign,
	FileText,
	Info,
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

	const formatRupiah = (val: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(val);
	};

	const renderChecklistItem = (label: string, isChecked: boolean) => (
		<div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
			<span className="font-medium text-slate-700 flex items-center gap-2">
				<FileText className="w-4 h-4 text-slate-400" />
				{label}
			</span>
			{isChecked ? (
				<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
					<CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
				</Badge>
			) : (
				<Badge variant="outline" className="text-slate-500">
					<Clock className="w-3 h-3 mr-1" /> Pending
				</Badge>
			)}
		</div>
	);

	const completedCount = [
		data?.formReceived,
		data?.documentsComplete,
		data?.dataInputted,
		data?.initialFollowUp,
	].filter(Boolean).length;
	const progressPercentage = (completedCount / 4) * 100;

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
								Panel PMB
							</CardTitle>
							<CardDescription className="mt-2 text-sm">
								Pendaftaran & Akuisisi Mahasiswa
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
					{/* Section 1: Checklist Kelengkapan Awal */}
					<div>
						<div className="flex justify-between items-end mb-2">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Checklist Kelengkapan Awal
							</h3>
							<span className="text-sm font-semibold text-[#0517B0]">
								{Math.round(progressPercentage)}%
							</span>
						</div>
						<Progress
							value={progressPercentage}
							className="h-3 bg-slate-100 mb-4"
						/>
						<div className="space-y-3">
							{renderChecklistItem("Penerimaan Formulir", data?.formReceived)}
							{renderChecklistItem(
								"Kelengkapan Dokumen Dasar",
								data?.documentsComplete,
							)}
							{renderChecklistItem("Input Data Sistem", data?.dataInputted)}
							{renderChecklistItem("Follow Up Awal", data?.initialFollowUp)}
						</div>
					</div>

					{/* Section 2: Informasi Akuisisi */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<Info className="w-5 h-5 text-blue-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Informasi Akuisisi
							</h3>
						</div>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
							<div>
								<span className="text-xs text-slate-500 block mb-1">
									Rekomendasi
								</span>
								<span className="text-sm font-semibold text-slate-800">
									{data?.rekomendasi || "-"}
								</span>
							</div>
							<div>
								<span className="text-xs text-slate-500 block mb-1">
									Tim Visit
								</span>
								<span className="text-sm font-semibold text-slate-800">
									{data?.timVisit || "-"}
								</span>
							</div>
							<div>
								<span className="text-xs text-slate-500 block mb-1">
									Tim Sosialisasi
								</span>
								<span className="text-sm font-semibold text-slate-800">
									{data?.timSosialisasi || "-"}
								</span>
							</div>
							<div>
								<span className="text-xs text-slate-500 block mb-1">
									RO Referral
								</span>
								<span className="text-sm font-semibold text-slate-800">
									{data?.roReferral || "-"}
								</span>
							</div>
							<div>
								<span className="text-xs text-slate-500 block mb-1">
									Mitra Sponsor
								</span>
								<span className="text-sm font-semibold text-slate-800">
									{data?.mitraSponsor || "-"}
								</span>
							</div>
							<div>
								<span className="text-xs text-slate-500 block mb-1">
									Koordinator
								</span>
								<span className="text-sm font-semibold text-slate-800">
									{data?.koordinator || "-"}
								</span>
							</div>
						</div>
					</div>

					{/* Section 3: Dokumen & Berkas */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<ShieldCheck className="w-5 h-5 text-emerald-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Dokumen & Berkas
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

					{/* Section 4: Skema Keuangan Awal */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<DollarSign className="w-5 h-5 text-amber-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Skema Keuangan Awal
							</h3>
						</div>
						{data?.paymentPlan ? (
							<div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-4">
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<span className="text-xs text-amber-700/70 block mb-1 font-medium">
											Total Biaya
										</span>
										<span className="text-sm font-bold text-amber-900">
											{formatRupiah(data.paymentPlan.totalBiaya || 0)}
										</span>
									</div>
									<div>
										<span className="text-xs text-amber-700/70 block mb-1 font-medium">
											Total DP
										</span>
										<span className="text-sm font-bold text-amber-900">
											{formatRupiah(data.paymentPlan.totalDp || 0)}
										</span>
									</div>
									<div className="col-span-2">
										<span className="text-xs text-amber-700/70 block mb-1 font-medium">
											Status DP
										</span>
										<div className="mt-1">
											{data.paymentPlan.statusDp ? (
												<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
													Lunas DP
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-amber-600 border-amber-200 bg-white"
												>
													Belum Lunas
												</Badge>
											)}
										</div>
									</div>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-amber-200/50">
									<div>
										<span className="text-xs text-amber-700/70 block mb-1 font-medium">
											Termin 2
										</span>
										<div className="text-sm font-bold text-amber-900">
											{formatRupiah(data.paymentPlan.janjiTahap2Nominal || 0)}
											{data.paymentPlan.janjiTahap2 && (
												<span className="text-xs font-normal text-amber-700 ml-2">
													(
													{new Date(
														data.paymentPlan.janjiTahap2,
													).toLocaleDateString("id-ID")}
													)
												</span>
											)}
										</div>
									</div>
									<div>
										<span className="text-xs text-amber-700/70 block mb-1 font-medium">
											Termin 3
										</span>
										<div className="text-sm font-bold text-amber-900">
											{formatRupiah(data.paymentPlan.janjiTahap3Nominal || 0)}
											{data.paymentPlan.janjiTahap3 && (
												<span className="text-xs font-normal text-amber-700 ml-2">
													(
													{new Date(
														data.paymentPlan.janjiTahap3,
													).toLocaleDateString("id-ID")}
													)
												</span>
											)}
										</div>
									</div>
								</div>
								{data.paymentPlan.pengajuanDanaTalangan && (
									<div className="mt-4 p-3 bg-white/60 rounded border border-amber-200/50">
										<span className="text-xs font-bold text-amber-800 uppercase block mb-1">
											Pengajuan Dana Talangan
										</span>
										<p className="text-sm text-amber-900 whitespace-pre-wrap">
											{data.paymentPlan.pengajuanDanaTalangan}
										</p>
									</div>
								)}
							</div>
						) : (
							<div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
								<p className="text-sm text-slate-500">
									Skema keuangan belum diatur.
								</p>
							</div>
						)}
					</div>

					{/* Section 5: Fee Mitra */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<Users className="w-5 h-5 text-purple-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Fee Pencarian Mitra
							</h3>
						</div>
						{data?.fees && data.fees.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{data.fees.map((fee: any, i: number) => (
									<div
										key={i}
										className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between"
									>
										<div>
											<p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
												{fee.channel}
											</p>
											<p className="text-sm font-semibold text-slate-800">
												{fee.namaReferral}
											</p>
										</div>
										<div className="text-right flex items-center">
											<Badge
												className={
													fee.statusPencairan === "sudah"
														? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0"
														: fee.statusPencairan === "proses"
															? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-0"
															: "bg-slate-200 text-slate-600 hover:bg-slate-200 border-0"
												}
											>
												{fee.statusPencairan === "sudah"
													? "Sudah Cair"
													: fee.statusPencairan === "proses"
														? "Diproses"
														: "Belum Cair"}
											</Badge>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
								<p className="text-sm text-slate-500">
									Tidak ada data fee mitra yang terdaftar.
								</p>
							</div>
						)}
					</div>

					{data?.status === "TIDAK_AMAN" && (
						<div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3">
							<AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
							<div>
								<h4 className="font-semibold text-rose-800 text-sm">
									Perhatian Diperlukan
								</h4>
								<p className="text-sm text-rose-600 mt-1">
									Data pendaftaran Anda ditandai sebagai Tidak Aman. Mohon
									segera hubungi bagian PMB untuk informasi lebih lanjut.
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
