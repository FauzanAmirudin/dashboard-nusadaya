"use client";

import {
	AlertCircle,
	ArrowLeft,
	Banknote,
	CheckCircle,
	CheckCircle2,
	CircleDollarSign,
	Clock,
	FileText,
	Landmark,
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

export default function FinancePanelMahasiswa() {
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
			const res = await api.mahasiswa.panel.finance.get();
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
					<CheckCircle2 className="w-3 h-3 mr-1" /> Lunas / Selesai
				</Badge>
			) : (
				<Badge variant="outline" className="text-slate-500 bg-white">
					<XCircle className="w-3 h-3 mr-1" /> Belum Lunas
				</Badge>
			)}
		</div>
	);

	const completedCount = [
		data?.registrationPaid,
		data?.semesterPaid,
		data?.installmentCleared,
		data?.arrearsCleared,
	].filter(Boolean).length;
	const checklistPercentage = (completedCount / 4) * 100;

	const formatCurrency = (amount: number | null | undefined) => {
		if (amount == null) return "Rp 0";
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const formatDate = (dateString: string | null | undefined) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
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
								Panel Finance
							</CardTitle>
							<CardDescription className="mt-2 text-sm">
								Administrasi Keuangan, Tagihan & Dana Talangan
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
					{/* Section 1: Checklist Status Tagihan */}
					<div>
						<div className="flex justify-between items-end mb-2">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
								<Landmark className="w-5 h-5 text-blue-600" />
								Status Kewajiban Tagihan
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
							{renderChecklistItem(
								"Biaya Registrasi Awal",
								data?.registrationPaid,
							)}
							{renderChecklistItem("Biaya Semester", data?.semesterPaid)}
							{renderChecklistItem("Cicilan Bulanan", data?.installmentCleared)}
							{renderChecklistItem("Tunggakan / Lainnya", data?.arrearsCleared)}
						</div>
					</div>

					{/* Section 2: Rincian Tagihan */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<Banknote className="w-5 h-5 text-emerald-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Rincian Pembayaran
							</h3>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
								<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Registrasi
								</p>
								<p className="text-lg font-bold text-slate-800 mt-1">
									{formatCurrency(data?.registrationAmount)}
								</p>
								<p className="text-xs text-slate-500 mt-1">
									Dibayar: {formatDate(data?.registrationDate)}
								</p>
							</div>
							<div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
								<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Semester
								</p>
								<p className="text-lg font-bold text-slate-800 mt-1">
									{formatCurrency(data?.semesterAmount)}
								</p>
								<p className="text-xs text-slate-500 mt-1">
									Dibayar: {formatDate(data?.semesterDate)}
								</p>
							</div>
							<div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
								<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Cicilan
								</p>
								<p className="text-lg font-bold text-slate-800 mt-1">
									{formatCurrency(data?.installmentAmount)}
								</p>
								<p className="text-xs text-slate-500 mt-1">
									Dibayar: {formatDate(data?.installmentDate)}
								</p>
							</div>
							<div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
								<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Tunggakan (Sisa)
								</p>
								<p className="text-lg font-bold text-rose-600 mt-1">
									{formatCurrency(data?.arrearsAmount)}
								</p>
								<p className="text-xs text-slate-500 mt-1">
									Estimasi Belum Terbayar
								</p>
							</div>
						</div>
					</div>

					{/* Section 3: Dana Talangan */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<CircleDollarSign className="w-5 h-5 text-indigo-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Pengajuan Dana Talangan
							</h3>
						</div>

						<div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 space-y-4">
							<div className="flex justify-between items-center border-b border-indigo-100 pb-3">
								<div>
									<p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">
										Penyedia Talangan
									</p>
									<p className="text-sm font-bold text-indigo-900 mt-0.5">
										{data?.danaTalaganProvider || "Belum ada pengajuan"}
									</p>
								</div>
								<Badge
									variant="outline"
									className="bg-white text-indigo-700 border-indigo-200"
								>
									{data?.danaTalaganProviderType || "-"}
								</Badge>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<p className="text-xs text-slate-500 font-semibold mb-1">
										Tahap 1
									</p>
									<p className="font-bold text-slate-800">
										{formatCurrency(data?.danaT1Amount)}
									</p>
									<div className="flex items-center justify-between mt-1">
										<span className="text-xs text-slate-500">
											{formatDate(data?.danaT1Date)}
										</span>
										{data?.isDanaT1Disbursed ? (
											<span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
												CAIR
											</span>
										) : (
											<span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
												PENDING
											</span>
										)}
									</div>
								</div>
								<div>
									<p className="text-xs text-slate-500 font-semibold mb-1">
										Tahap 2
									</p>
									<p className="font-bold text-slate-800">
										{formatCurrency(data?.danaT2Amount)}
									</p>
									<div className="flex items-center justify-between mt-1">
										<span className="text-xs text-slate-500">
											{formatDate(data?.danaT2Date)}
										</span>
										{data?.isDanaT2Disbursed ? (
											<span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
												CAIR
											</span>
										) : (
											<span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
												PENDING
											</span>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Section 4: Dokumen & Berkas Finance */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<ShieldCheck className="w-5 h-5 text-emerald-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Dokumen & Berkas Finance
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
									Status Keuangan Anda ditandai sebagai Tidak Aman. Harap segera
									hubungi bagian administrasi.
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
