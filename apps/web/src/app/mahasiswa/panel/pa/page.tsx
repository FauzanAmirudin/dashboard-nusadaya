"use client";

import {
	AlertCircle,
	ArrowLeft,
	Building2,
	CheckCircle,
	CheckCircle2,
	Clock,
	FileText,
	HeartHandshake,
	Languages,
	ShieldCheck,
	UserCircle2,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function PaPanelMahasiswa() {
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
			const res = await api.mahasiswa.panel.pa.get();
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
					<CheckCircle2 className="w-3 h-3 mr-1" /> Ya / Baik
				</Badge>
			) : (
				<Badge variant="outline" className="text-slate-500 bg-white">
					<XCircle className="w-3 h-3 mr-1" /> Belum / Perlu Perhatian
				</Badge>
			)}
		</div>
	);

	const completedCount = [
		data?.counselingDone,
		data?.mentalStable,
		data?.disciplineGood,
	].filter(Boolean).length;
	const checklistPercentage = (completedCount / 3) * 100;

	// Calculate cumulative vocab from vocabLogs
	const totalVocab =
		data?.vocabLogs?.reduce(
			(sum: number, log: any) => sum + (log.addedWords || 0),
			0,
		) || 0;
	const vocabTarget = data?.vocabTarget || 500;
	const vocabPercent = Math.min((totalVocab / vocabTarget) * 100, 100);

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
								Panel Pendamping Akademik
							</CardTitle>
							<CardDescription className="mt-2 text-sm">
								Konseling, Hafalan Vocab & Persiapan Interview
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
					{/* Section 1: Checklist Pendampingan */}
					<div>
						<div className="flex justify-between items-end mb-2">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
								<HeartHandshake className="w-5 h-5 text-blue-600" />
								Status Pendampingan Dasar
							</h3>
							<span className="text-sm font-semibold text-[#0517B0]">
								{Math.round(checklistPercentage)}%
							</span>
						</div>
						<Progress
							value={checklistPercentage}
							className="h-3 bg-slate-100 mb-4"
						/>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{renderChecklistItem("Sesi Konseling Awal", data?.counselingDone)}
							{renderChecklistItem("Kondisi Mental Stabil", data?.mentalStable)}
							{renderChecklistItem(
								"Kedisiplinan & Sikap",
								data?.disciplineGood,
							)}
						</div>
					</div>

					{/* Section 2: Catatan Kedisiplinan */}
					{data?.disciplineNotes && (
						<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
							<AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
							<div className="flex-1">
								<h4 className="font-bold text-amber-800 text-sm">
									Catatan Kedisiplinan dari PA
								</h4>
								<p className="text-sm text-amber-700 mt-2 whitespace-pre-wrap">
									{data.disciplineNotes}
								</p>
							</div>
						</div>
					)}

					{/* Section 3: Progress Hafalan Vocab */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<Languages className="w-5 h-5 text-indigo-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Progress Hafalan Vocab
							</h3>
						</div>

						<div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 mb-4">
							<div className="flex justify-between items-end mb-2">
								<h4 className="text-sm font-semibold text-indigo-900">
									Pencapaian Target: {vocabTarget} Kata
								</h4>
								<span className="text-sm font-bold text-indigo-700">
									{Math.round(vocabPercent)}%
								</span>
							</div>
							<Progress
								value={vocabPercent}
								className="h-2.5 bg-indigo-100 mb-2"
							/>
							<p className="text-xs text-indigo-600">
								Total hafal: <span className="font-bold">{totalVocab}</span>{" "}
								dari target <span className="font-bold">{vocabTarget}</span>{" "}
								kata.
							</p>
						</div>

						{data?.vocabLogs && data.vocabLogs.length > 0 ? (
							<div className="border border-slate-200 rounded-lg overflow-hidden">
								<Table>
									<TableHeader className="bg-slate-50">
										<TableRow>
											<TableHead className="w-1/2 text-center border-r border-slate-200">
												Tanggal
											</TableHead>
											<TableHead className="w-1/2 text-center">
												Jumlah Setoran
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data.vocabLogs.map((log: any, index: number) => (
											<TableRow key={index}>
												<TableCell className="font-medium text-slate-700 text-sm text-center border-r border-slate-200">
													{formatDate(log.date)}
												</TableCell>
												<TableCell className="text-slate-600 text-sm text-center">
													+{log.addedWords} kata
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						) : (
							<div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center text-slate-500 text-sm">
								Belum ada riwayat setoran hafalan vocab.
							</div>
						)}
					</div>

					{/* Section 4: Riwayat Interview Perusahaan */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<Building2 className="w-5 h-5 text-fuchsia-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Riwayat Interview Magang
							</h3>
						</div>

						{data?.interviews && data.interviews.length > 0 ? (
							<div className="space-y-3">
								{data.interviews.map((iv: any, index: number) => (
									<div
										key={index}
										className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm"
									>
										<div className="flex flex-col">
											<span className="text-xs text-slate-500 mb-1">
												{formatDate(iv.date)}
											</span>
											<span className="font-bold text-slate-800">
												{iv.companyName}
											</span>
										</div>
										<div>
											{iv.result === "Lulus" && (
												<Badge className="bg-emerald-500">LULUS</Badge>
											)}
											{iv.result === "Tidak Lulus" && (
												<Badge variant="destructive">TIDAK LULUS</Badge>
											)}
											{iv.result === "Menunggu" && (
												<Badge className="bg-amber-500">MENUNGGU</Badge>
											)}
											{!["Lulus", "Tidak Lulus", "Menunggu"].includes(
												iv.result,
											) && <Badge variant="outline">{iv.result}</Badge>}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center text-slate-500 text-sm">
								Belum ada riwayat mengikuti interview.
							</div>
						)}
					</div>

					{/* Section 5: Dokumen & Berkas PA */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<ShieldCheck className="w-5 h-5 text-emerald-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Dokumen Pendampingan Akademik
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
									Status Anda ditandai sebagai Tidak Aman. Harap segera
									menghubungi pembimbing akademik Anda.
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
