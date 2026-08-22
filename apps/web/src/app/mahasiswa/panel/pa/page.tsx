"use client";

import {
	AlertCircle,
	ArrowLeft,
	BookOpen,
	Building2,
	Calendar,
	CheckCircle,
	CheckCircle2,
	Clock,
	FileText,
	HeartHandshake,
	Languages,
	MessageCircle,
	RefreshCw,
	ShieldCheck,
	Sparkles,
	UserCircle2,
	Users,
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
			console.error("Gagal memuat data PA:", err);
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
					<CheckCircle2 className="w-3 h-3 mr-1" /> Baik / Selesai
				</Badge>
			) : (
				<Badge
					variant="outline"
					className="text-slate-400 bg-white border-slate-200 text-xs"
				>
					<Clock className="w-3 h-3 mr-1" /> Perlu Perhatian
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

	// Total hafalan kata dari sessions / vocabLogs
	const totalVocabFromSessions =
		data?.hafalanSessions?.reduce(
			(sum: number, s: any) => sum + (s.vocabCount || 0),
			0,
		) || 0;
	const totalVocabFromLogs =
		data?.vocabLogs?.reduce(
			(sum: number, log: any) => sum + (log.addedWords || 0),
			0,
		) || 0;
	const totalVocab = Math.max(totalVocabFromSessions, totalVocabFromLogs);
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
								Panel Pendamping Akademik (PA)
							</CardTitle>
							<CardDescription className="mt-1 text-sm text-slate-500">
								Konseling Personal, Progres Setoran Vocab Bahasa & Evaluasi
								Interview Magang
							</CardDescription>
						</div>
						{data?.isAcc ? (
							<Badge className="bg-emerald-500 text-white px-3.5 py-1.5 text-sm rounded-full shadow-sm font-semibold">
								<CheckCircle className="w-4 h-4 mr-1.5" /> Telah di-ACC PA
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
					{/* Section 1: Status Pendampingan Dasar */}
					<div>
						<div className="flex justify-between items-end mb-3">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
								<HeartHandshake className="w-4 h-4 text-[#0517B0]" />
								Status Pendampingan & Evaluasi Karakter
							</h3>
							<span className="text-base font-extrabold text-[#0517B0]">
								{Math.round(checklistPercentage)}%
							</span>
						</div>
						<Progress
							value={checklistPercentage}
							className="h-3 bg-slate-100 mb-4 rounded-full"
						/>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							{renderChecklistItem("Sesi Konseling Awal", data?.counselingDone)}
							{renderChecklistItem("Kondisi Mental Stabil", data?.mentalStable)}
							{renderChecklistItem(
								"Kedisiplinan & Sikap Baik",
								data?.disciplineGood,
							)}
						</div>
					</div>

					{/* Catatan Kedisiplinan */}
					{data?.disciplineNotes && (
						<div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
							<AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
							<div className="flex-1">
								<h4 className="font-bold text-amber-900 text-sm">
									Catatan Kedisiplinan dari Pembimbing Akademik
								</h4>
								<p className="text-xs text-amber-800 mt-1.5 leading-relaxed whitespace-pre-wrap">
									{data.disciplineNotes}
								</p>
							</div>
						</div>
					)}

					{/* Section 2: Progress Hafalan Vocab */}
					<div className="pt-6 border-t border-slate-100 space-y-4">
						<div className="flex items-center gap-2">
							<Languages className="w-5 h-5 text-indigo-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Progress Setoran Hafalan Kosakata (Vocab)
							</h3>
						</div>

						<div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-3">
							<div className="flex justify-between items-end">
								<div>
									<h4 className="text-sm font-bold text-indigo-950">
										Pencapaian Target Hafalan
									</h4>
									<p className="text-xs text-indigo-700 mt-0.5">
										Total Hafal:{" "}
										<span className="font-bold font-mono">{totalVocab}</span>{" "}
										dari target{" "}
										<span className="font-bold font-mono">{vocabTarget}</span>{" "}
										kata
									</p>
								</div>
								<span className="text-base font-extrabold text-indigo-700">
									{Math.round(vocabPercent)}%
								</span>
							</div>
							<Progress
								value={vocabPercent}
								className="h-2.5 bg-indigo-200/50 rounded-full"
							/>
						</div>

						{/* List Riwayat Setoran Hafalan */}
						{data?.hafalanSessions?.length > 0 ||
						data?.vocabLogs?.length > 0 ? (
							<div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
								<Table>
									<TableHeader className="bg-slate-50/80">
										<TableRow>
											<TableHead className="text-xs font-bold uppercase">
												Tanggal / Waktu
											</TableHead>
											<TableHead className="text-xs font-bold uppercase">
												Bahasa
											</TableHead>
											<TableHead className="text-right text-xs font-bold uppercase">
												Jumlah Kosakata
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data.hafalanSessions && data.hafalanSessions.length > 0
											? data.hafalanSessions.map((s: any) => (
													<TableRow key={s.id} className="hover:bg-slate-50/60">
														<TableCell className="text-xs font-medium text-slate-700">
															{formatDate(s.createdAt)}
														</TableCell>
														<TableCell className="text-xs text-slate-600 capitalize">
															{s.language === "lainnya"
																? s.languageCustom
																: s.language}
														</TableCell>
														<TableCell className="text-right font-mono font-bold text-xs text-emerald-600">
															+{s.vocabCount} kata{" "}
															{s.sentenceCount
																? `(${s.sentenceCount} kalimat)`
																: ""}
														</TableCell>
													</TableRow>
												))
											: data.vocabLogs.map((log: any, idx: number) => (
													<TableRow key={idx} className="hover:bg-slate-50/60">
														<TableCell className="text-xs font-medium text-slate-700">
															{formatDate(log.date)}
														</TableCell>
														<TableCell className="text-xs text-slate-600">
															Bahasa Target
														</TableCell>
														<TableCell className="text-right font-mono font-bold text-xs text-emerald-600">
															+{log.addedWords} kata
														</TableCell>
													</TableRow>
												))}
									</TableBody>
								</Table>
							</div>
						) : (
							<div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-slate-500 text-xs">
								Belum ada riwayat setoran hafalan kosakata.
							</div>
						)}
					</div>

					{/* Section 3: Riwayat Konseling & Tripartit */}
					<div className="pt-6 border-t border-slate-100 space-y-4">
						<div className="flex items-center gap-2">
							<MessageCircle className="w-5 h-5 text-purple-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Riwayat Sesi Konseling & Tripartit
							</h3>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{/* Konseling Box */}
							<div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
								<h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
									<UserCircle2 className="w-4 h-4 text-purple-600" />
									Sesi Konseling PA
								</h4>
								{data?.counselingLogs && data.counselingLogs.length > 0 ? (
									<div className="space-y-2">
										{data.counselingLogs.map((c: any) => (
											<div
												key={c.id}
												className="p-3 bg-white rounded-xl border border-slate-100 text-xs"
											>
												<div className="flex justify-between items-center mb-1">
													<span className="font-semibold text-slate-800">
														{formatDate(c.date)}
													</span>
													<Badge
														className={
															c.condition === "Stabil"
																? "bg-emerald-100 text-emerald-800 border-0 text-[10px]"
																: "bg-amber-100 text-amber-800 border-0 text-[10px]"
														}
													>
														{c.condition || "Selesai"}
													</Badge>
												</div>
												<p className="text-slate-600 text-[11px] leading-relaxed">
													{c.notes || "Sesi konseling telah dilaksanakan."}
												</p>
											</div>
										))}
									</div>
								) : (
									<p className="text-xs text-slate-400 italic">
										Belum ada sesi konseling terdata.
									</p>
								)}
							</div>

							{/* Tripartit Box */}
							<div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
								<h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
									<Users className="w-4 h-4 text-blue-600" />
									Pertemuan Tripartit
								</h4>
								{data?.tripartiteLogs && data.tripartiteLogs.length > 0 ? (
									<div className="space-y-2">
										{data.tripartiteLogs.map((t: any) => (
											<div
												key={t.id}
												className="p-3 bg-white rounded-xl border border-slate-100 text-xs"
											>
												<div className="flex justify-between items-center mb-1">
													<span className="font-semibold text-slate-800">
														{t.contactType}: {t.contactName || "-"}
													</span>
													<span className="text-[10px] text-slate-400">
														{formatDate(t.contactDate)}
													</span>
												</div>
												<p className="text-slate-600 text-[11px] leading-relaxed">
													{t.summary ||
														"Pertemuan tripartit telah selesai diselenggarakan."}
												</p>
											</div>
										))}
									</div>
								) : (
									<p className="text-xs text-slate-400 italic">
										Belum ada catatan tripartit.
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Section 4: Riwayat Interview Magang */}
					<div className="pt-6 border-t border-slate-100 space-y-4">
						<div className="flex items-center gap-2">
							<Building2 className="w-5 h-5 text-fuchsia-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Riwayat Interview Perusahaan & User Luar Negeri
							</h3>
						</div>

						{data?.interviews && data.interviews.length > 0 ? (
							<div className="space-y-3">
								{data.interviews.map((iv: any, index: number) => (
									<div
										key={iv.id || index}
										className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
									>
										<div>
											<span className="text-xs text-slate-400 block font-medium">
												{formatDate(iv.date)} • {iv.country || "Tujuan Magang"}
											</span>
											<span className="font-bold text-slate-800 text-sm mt-0.5 block">
												{iv.companyName}
											</span>
											{iv.notes && (
												<p className="text-xs text-slate-500 mt-1 italic">
													Catatan: {iv.notes}
												</p>
											)}
										</div>
										<div className="shrink-0">
											{iv.result === "Lulus" ? (
												<Badge className="bg-emerald-100 text-emerald-800 border-0 font-bold px-3 py-1 text-xs">
													LULUS
												</Badge>
											) : iv.result === "Tidak Lulus" ? (
												<Badge
													variant="destructive"
													className="font-bold px-3 py-1 text-xs"
												>
													TIDAK LULUS
												</Badge>
											) : (
												<Badge className="bg-amber-100 text-amber-800 border-0 font-bold px-3 py-1 text-xs">
													MENUNGGU HASIL
												</Badge>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-slate-500 text-xs">
								Belum ada riwayat pelaksanaan interview magang.
							</div>
						)}
					</div>

					{/* Section 5: Dokumen PA */}
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
									Belum ada dokumen PA yang diunggah.
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
