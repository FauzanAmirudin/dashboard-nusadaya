"use client";

import {
	BookOpen,
	CheckCircle,
	CheckCircle2,
	Clock,
	FileText,
	Globe,
	Languages,
	RefreshCw,
	RotateCcw,
	Sparkles,
	UserCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/eden";

export interface HafalanSessionItem {
	id: number;
	language: string;
	languageCustom?: string | null;
	vocabCount: number;
	sentenceCount: number;
	vocabList?: string[];
	sentenceList?: string[];
	notes?: string | null;
	createdAt: string | Date;
	createdByUser?: { fullName?: string; username?: string } | null;
}

interface TabHafalanProps {
	studentId: number;
	paData: any;
	hafalanSessions?: HafalanSessionItem[];
	vocabLogs?: any[];
	crmState: any;
	canEdit: boolean;
	fetchCrmData: () => void;
	fetchPaData?: () => void;
	onUpdate: () => void;
}

export function TabHafalan({
	studentId,
	paData,
	hafalanSessions = [],
	vocabLogs = [],
	crmState,
	canEdit,
	fetchCrmData,
	fetchPaData,
	onUpdate,
}: TabHafalanProps) {
	const crm = crmState?.crm;
	const [isVocabComplete, setIsVocabComplete] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	useEffect(() => {
		if (crm) {
			setIsVocabComplete(!!crm.isVocabComplete);
		}
	}, [crm]);

	const targetVocab = paData?.vocabTarget || 500;

	// Calculate totals dynamically from modern hafalanSessions with legacy vocabLogs fallback
	const sessionWords = useMemo(() => {
		return hafalanSessions.reduce(
			(acc, s) => acc + (Number(s.vocabCount) || 0),
			0,
		);
	}, [hafalanSessions]);

	const sessionSentences = useMemo(() => {
		return hafalanSessions.reduce(
			(acc, s) => acc + (Number(s.sentenceCount) || 0),
			0,
		);
	}, [hafalanSessions]);

	const legacyWords = useMemo(() => {
		return vocabLogs.reduce(
			(acc, log) => acc + (Number(log.addedWords) || 0),
			0,
		);
	}, [vocabLogs]);

	const totalVocab = sessionWords > 0 ? sessionWords : legacyWords;
	const totalSentences = sessionSentences;

	const vocabProgress = Math.min(
		Math.round((totalVocab / targetVocab) * 100),
		100,
	);
	const isVocabDone = vocabProgress >= 100;
	const vocabProgressColor =
		vocabProgress >= 80
			? "bg-emerald-500"
			: vocabProgress >= 50
				? "bg-amber-500"
				: "bg-rose-500";

	const handleRefreshAll = async () => {
		setIsRefreshing(true);
		try {
			await Promise.all([fetchCrmData(), fetchPaData?.()]);
			toast.success("Data hafalan berhasil disinkronkan dengan akun PA!");
		} catch (err) {
			toast.error("Gagal menyinkronkan data.");
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleToggleSetujuiHafalan = async (targetValue: boolean) => {
		if (!canEdit) return;
		setIsLoading(true);
		try {
			const { error } = await api.students[studentId.toString()].crm.patch({
				isVocabComplete: targetValue,
			});
			if (error)
				throw new Error(
					targetValue
						? "Gagal menyetujui hafalan"
						: "Gagal membatalkan persetujuan",
				);

			toast.success(
				targetValue
					? "Kendali hafalan berhasil disetujui (ACC Vocab)!"
					: "Persetujuan hafalan berhasil dibatalkan",
			);
			setIsVocabComplete(targetValue);
			await Promise.all([fetchCrmData(), fetchPaData?.()]);
			onUpdate();
		} catch (error) {
			toast.error("Terjadi kesalahan saat memproses status hafalan");
		} finally {
			setIsLoading(false);
		}
	};

	const getLanguageBadgeColor = (lang: string) => {
		const l = lang.toLowerCase();
		if (l.includes("jepang")) return "bg-rose-50 text-rose-700 border-rose-200";
		if (l.includes("inggris"))
			return "bg-blue-50 text-blue-700 border-blue-200";
		if (l.includes("jerman"))
			return "bg-amber-50 text-amber-700 border-amber-200";
		if (l.includes("korea"))
			return "bg-purple-50 text-purple-700 border-purple-200";
		if (l.includes("mandarin")) return "bg-red-50 text-red-700 border-red-200";
		return "bg-indigo-50 text-indigo-700 border-indigo-200";
	};

	return (
		<div className="space-y-6">
			{/* Top Summary Metrics */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
				<Card className="border-slate-200 bg-white shadow-2xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-xs font-semibold text-slate-500">
								Total Kosakata
							</p>
							<p className="text-xl font-bold text-slate-900 mt-1">
								{totalVocab}{" "}
								<span className="text-xs font-normal text-slate-500">
									/ {targetVocab} kata
								</span>
							</p>
						</div>
						<div className="p-2.5 bg-blue-50 text-[#0517B0] rounded-xl border border-blue-100">
							<Languages className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-slate-200 bg-white shadow-2xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-xs font-semibold text-slate-500">
								Total Kalimat
							</p>
							<p className="text-xl font-bold text-slate-900 mt-1">
								{totalSentences}{" "}
								<span className="text-xs font-normal text-slate-500">
									kalimat
								</span>
							</p>
						</div>
						<div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
							<FileText className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-slate-200 bg-white shadow-2xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-xs font-semibold text-slate-500">
								Sesi Setoran PA
							</p>
							<p className="text-xl font-bold text-slate-900 mt-1">
								{hafalanSessions.length > 0
									? hafalanSessions.length
									: vocabLogs.length}{" "}
								<span className="text-xs font-normal text-slate-500">sesi</span>
							</p>
						</div>
						<div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
							<UserCheck className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-slate-200 bg-white shadow-2xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-xs font-semibold text-slate-500">Status CRM</p>
							<div className="mt-1">
								{isVocabComplete ? (
									<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-2 py-0.5">
										✓ Disetujui
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-bold px-2 py-0.5"
									>
										Proses {vocabProgress}%
									</Badge>
								)}
							</div>
						</div>
						<div
							className={`p-2.5 rounded-xl border ${
								isVocabComplete
									? "bg-emerald-50 text-emerald-700 border-emerald-100"
									: "bg-amber-50 text-amber-700 border-amber-100"
							}`}
						>
							<CheckCircle2 className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Card */}
			<Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
				<CardHeader className="bg-slate-50/80 border-b border-slate-200 py-3.5 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
							<BookOpen className="w-4 h-4 text-[#0517B0]" />
							Monitoring Setoran Vocabulary & Bahasa (Sinkronisasi PA)
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Data terintegrasi secara realtime dengan pencatatan setoran Dosen
							Pembimbing Akademik (PA).
						</p>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={handleRefreshAll}
						disabled={isRefreshing}
						className="h-8.5 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 gap-1.5 shadow-2xs"
					>
						<RefreshCw
							className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0517B0]" : "text-slate-500"}`}
						/>
						Sinkronkan Data
					</Button>
				</CardHeader>

				<CardContent className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
					{/* Left: Progress & Validation Card */}
					<div className="w-full lg:w-1/3 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-slate-200 pb-6 lg:pb-0 lg:pr-6">
						<div className="w-full text-center">
							<span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
								Capaian Target Vocabulary
							</span>

							<div className="mt-3 flex items-baseline justify-center gap-1.5">
								<span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
									{totalVocab}
								</span>
								<span className="text-sm font-semibold text-slate-500">
									/ {targetVocab} kata
								</span>
							</div>

							<div className="mt-4 relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
								<Progress
									value={vocabProgress}
									className="h-full bg-slate-100"
									indicatorClassName={vocabProgressColor}
								/>
							</div>

							<div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-600 px-0.5">
								<span>0%</span>
								<span className="text-sm font-bold text-slate-900">
									{vocabProgress}% Tercapai
								</span>
								<span>100%</span>
							</div>
						</div>

						{/* Action Validation Box */}
						<div className="mt-6 w-full pt-5 border-t border-slate-100 text-center space-y-3">
							{isVocabComplete ? (
								<div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col items-center gap-2">
									<div className="p-2 bg-emerald-100 text-emerald-700 rounded-full">
										<CheckCircle className="w-6 h-6" />
									</div>
									<div>
										<p className="text-sm font-bold text-emerald-800">
											Hafalan Telah Disetujui (CRM)
										</p>
										<p className="text-[11px] text-emerald-600 mt-0.5">
											Target bahasa telah terverifikasi untuk proses magang &
											keberangkatan.
										</p>
									</div>

									{canEdit && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleToggleSetujuiHafalan(false)}
											disabled={isLoading}
											className="mt-1 h-7 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
										>
											<RotateCcw className="w-3 h-3 mr-1" />
											Batalkan Persetujuan
										</Button>
									)}
								</div>
							) : (
								<div className="space-y-2">
									<Button
										disabled={!canEdit || isLoading}
										onClick={() => handleToggleSetujuiHafalan(true)}
										className="w-full bg-[#0517B0] hover:bg-blue-800 text-white font-bold h-10 shadow-sm text-xs sm:text-sm"
									>
										{isLoading ? (
											<span className="flex items-center gap-2">
												<RefreshCw className="w-4 h-4 animate-spin" />
												Menyimpan...
											</span>
										) : (
											<span className="flex items-center gap-2">
												<CheckCircle2 className="w-4 h-4" />
												Setujui Hafalan Mahasiswa
											</span>
										)}
									</Button>
									<p className="text-[11px] text-slate-500">
										{isVocabDone
											? "Target 100% telah terpenuhi. Klik tombol di atas untuk ACC."
											: `Target tercapai ${vocabProgress}%. Persetujuan dapat diberikan sesuai evaluasi tim CRM.`}
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Right: Detailed Logs from PA */}
					<div className="w-full lg:w-2/3 flex flex-col">
						<div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
							<h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<Sparkles className="w-4 h-4 text-amber-500" />
								Riwayat Setoran Hafalan Terverifikasi dari Dosen PA
							</h4>
							<span className="text-xs font-semibold text-slate-500">
								{hafalanSessions.length > 0
									? `${hafalanSessions.length} Sesi Tercatat`
									: vocabLogs.length > 0
										? `${vocabLogs.length} Sesi Tercatat`
										: "0 Sesi"}
							</span>
						</div>

						<ScrollArea className="h-[340px] pr-3">
							<div className="space-y-3">
								{/* 1. Modern Hafalan Sessions from PA */}
								{hafalanSessions.length > 0 &&
									hafalanSessions.map((session, idx) => {
										const langLabel =
											session.language === "Lainnya" && session.languageCustom
												? session.languageCustom
												: session.language || "Bahasa Asing";
										const dateStr = session.createdAt
											? new Date(session.createdAt).toLocaleDateString(
													"id-ID",
													{
														day: "numeric",
														month: "long",
														year: "numeric",
													},
												)
											: "-";

										return (
											<div
												key={session.id || idx}
												className="p-3.5 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-xs transition-all bg-white flex flex-col gap-2.5"
											>
												<div className="flex flex-wrap items-center justify-between gap-2">
													<div className="flex items-center gap-2">
														<Badge
															className={`${getLanguageBadgeColor(langLabel)} text-xs font-bold px-2 py-0.5 border`}
														>
															<Globe className="w-3 h-3 mr-1 inline-block" />
															{langLabel}
														</Badge>

														<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-2 py-0.5 border">
															+{session.vocabCount || 0} Kata
														</Badge>

														{session.sentenceCount > 0 && (
															<Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-bold px-2 py-0.5 border">
																+{session.sentenceCount} Kalimat
															</Badge>
														)}
													</div>

													<span className="text-[11px] font-medium text-slate-500">
														{dateStr}
													</span>
												</div>

												{/* Evaluator / PA & Notes */}
												<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs pt-1 border-t border-slate-100">
													<span className="text-slate-600">
														Penguji:{" "}
														<strong className="text-slate-800">
															{session.createdByUser?.fullName ||
																session.createdByUser?.username ||
																"Dosen Pembimbing Akademik"}
														</strong>
													</span>

													{session.notes && (
														<span className="text-slate-600 italic">
															"{session.notes}"
														</span>
													)}
												</div>

												{/* Vocab List Preview if available */}
												{Array.isArray(session.vocabList) &&
													session.vocabList.length > 0 && (
														<div className="flex flex-wrap gap-1 pt-1">
															{session.vocabList.slice(0, 10).map((w, wIdx) => (
																<span
																	key={wIdx}
																	className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono border border-slate-200"
																>
																	{w}
																</span>
															))}
															{session.vocabList.length > 10 && (
																<span className="text-[10px] text-slate-400 font-medium self-center">
																	+{session.vocabList.length - 10} lainnya
																</span>
															)}
														</div>
													)}
											</div>
										);
									})}

								{/* 2. Legacy Vocab Logs if no sessions */}
								{hafalanSessions.length === 0 &&
									vocabLogs.length > 0 &&
									vocabLogs.map((log) => (
										<div
											key={log.id}
											className="p-3.5 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-xs transition-all bg-white flex justify-between items-start"
										>
											<div>
												<div className="flex items-center gap-2 mb-1">
													<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
														+{log.addedWords} kata
													</Badge>
													<span className="text-xs text-slate-500 font-medium">
														{new Date(log.date).toLocaleDateString("id-ID", {
															day: "numeric",
															month: "long",
															year: "numeric",
														})}
													</span>
												</div>
												{log.notes && (
													<p className="text-xs text-slate-600 mt-1 italic">
														"{log.notes}"
													</p>
												)}
											</div>
										</div>
									))}

								{/* 3. Empty State */}
								{hafalanSessions.length === 0 && vocabLogs.length === 0 && (
									<div className="text-center text-slate-400 text-xs sm:text-sm py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-2 bg-slate-50/50">
										<BookOpen className="w-8 h-8 text-slate-300" />
										<p className="font-semibold text-slate-600">
											Belum ada riwayat setoran hafalan dari Dosen PA.
										</p>
										<p className="text-xs text-slate-400 max-w-sm">
											Data setoran kosakata dan kalimat akan otomatis tersinkron
											secara realtime saat Dosen PA menginput sesi hafalan
											mahasiswa.
										</p>
									</div>
								)}
							</div>
						</ScrollArea>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
