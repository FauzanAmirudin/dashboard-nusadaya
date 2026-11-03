"use client";

import {
	AlertCircle,
	ArrowUpDown,
	Award,
	BookOpen,
	Calendar,
	Check,
	CheckCircle,
	CheckCircle2,
	ChevronRight,
	Clock,
	Eye,
	FileText,
	Filter,
	Globe,
	Languages,
	MessageSquare,
	Quote,
	RefreshCw,
	RotateCcw,
	Search,
	ShieldCheck,
	Sparkles,
	Tag,
	UserCheck,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
	date?: string | Date;
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
	fetchCrmData: () => void | Promise<void>;
	fetchPaData?: () => void | Promise<void>;
	onUpdate: () => void;
	onUpdateField?: (field: string, value: any) => void;
}

interface LanguageOption {
	id: string;
	label: string;
	flag: string;
	badgeClass: string;
	pillClass: string;
}

const LANGUAGE_CONFIGS: Record<string, LanguageOption> = {
	inggris: {
		id: "inggris",
		label: "Bahasa Inggris",
		flag: "🇬🇧",
		badgeClass: "bg-blue-50 text-blue-700 border-blue-200/80",
		pillClass: "bg-blue-500",
	},
	mandarin: {
		id: "mandarin",
		label: "Bahasa Mandarin",
		flag: "🇨🇳",
		badgeClass: "bg-red-50 text-red-700 border-red-200/80",
		pillClass: "bg-red-500",
	},
	jepang: {
		id: "jepang",
		label: "Bahasa Jepang",
		flag: "🇯🇵",
		badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
		pillClass: "bg-rose-500",
	},
	jerman: {
		id: "jerman",
		label: "Bahasa Jerman",
		flag: "🇩🇪",
		badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
		pillClass: "bg-amber-500",
	},
	arab: {
		id: "arab",
		label: "Bahasa Arab",
		flag: "🇸🇦",
		badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
		pillClass: "bg-emerald-500",
	},
	korea: {
		id: "korea",
		label: "Bahasa Korea",
		flag: "🇰🇷",
		badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
		pillClass: "bg-indigo-500",
	},
	lainnya: {
		id: "lainnya",
		label: "Bahasa Lainnya",
		flag: "🌐",
		badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
		pillClass: "bg-slate-500",
	},
};

function getLanguageLabel(session: {
	language?: string;
	languageCustom?: string | null;
}) {
	if (session.language?.toLowerCase() === "lainnya" && session.languageCustom) {
		return session.languageCustom;
	}
	const key = (session.language || "").toLowerCase().trim();
	return LANGUAGE_CONFIGS[key]?.label || session.language || "Bahasa Asing";
}

function getLanguageFlag(language?: string) {
	const key = (language || "").toLowerCase().trim();
	return LANGUAGE_CONFIGS[key]?.flag || "🌐";
}

function getLanguageBadgeClass(language?: string) {
	const key = (language || "").toLowerCase().trim();
	return (
		LANGUAGE_CONFIGS[key]?.badgeClass ||
		"bg-slate-50 text-slate-700 border-slate-200"
	);
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
	onUpdateField,
}: TabHafalanProps) {
	const crm = crmState?.crm;
	const [isVocabComplete, setIsVocabComplete] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedLanguageFilter, setSelectedLanguageFilter] = useState("all");
	const [detailSession, setDetailSession] = useState<HafalanSessionItem | null>(
		null,
	);

	useEffect(() => {
		if (crm) {
			setIsVocabComplete(!!crm.isVocabComplete);
		}
	}, [crm]);

	const targetVocab = paData?.vocabTarget || crmState?.pa?.vocabTarget || 500;

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
	const isVocabDone = totalVocab >= targetVocab;

	// Language Breakdown calculation
	const languageStats = useMemo(() => {
		const map = new Map<
			string,
			{ label: string; flag: string; count: number }
		>();
		for (const s of hafalanSessions) {
			const label = getLanguageLabel(s);
			const flag = getLanguageFlag(s.language);
			const existing = map.get(label) || { label, flag, count: 0 };
			existing.count += Number(s.vocabCount) || 0;
			map.set(label, existing);
		}
		return Array.from(map.values()).sort((a, b) => b.count - a.count);
	}, [hafalanSessions]);

	// Filtered & sorted sessions (Strictly sorted descending: newest first)
	const filteredSessions = useMemo(() => {
		return [...hafalanSessions]
			.filter((s) => {
				const label = getLanguageLabel(s).toLowerCase();
				const notes = (s.notes || "").toLowerCase();
				const examiner = (
					s.createdByUser?.fullName ||
					s.createdByUser?.username ||
					""
				).toLowerCase();
				const query = searchQuery.toLowerCase().trim();

				const matchesQuery =
					!query ||
					label.includes(query) ||
					notes.includes(query) ||
					examiner.includes(query);

				const matchesLang =
					selectedLanguageFilter === "all" ||
					s.language?.toLowerCase() === selectedLanguageFilter.toLowerCase();

				return matchesQuery && matchesLang;
			})
			.sort((a, b) => {
				const timeA = new Date(a.date || a.createdAt || 0).getTime();
				const timeB = new Date(b.date || b.createdAt || 0).getTime();
				if (timeB !== timeA) return timeB - timeA;
				return (Number(b.id) || 0) - (Number(a.id) || 0);
			});
	}, [hafalanSessions, searchQuery, selectedLanguageFilter]);

	// Real-time synchronization handler
	const handleRefreshAll = useCallback(
		async (silent = false) => {
			if (!silent) setIsRefreshing(true);
			try {
				await Promise.all([fetchCrmData(), fetchPaData?.()]);
				setLastSyncTime(new Date());
				if (!silent) {
					toast.success("Data hafalan berhasil disinkronkan dengan akun PA!");
				}
			} catch {
				if (!silent) {
					toast.error("Gagal menyinkronkan data.");
				}
			} finally {
				if (!silent) setIsRefreshing(false);
			}
		},
		[fetchCrmData, fetchPaData],
	);

	// Auto-polling every 25 seconds when TabHafalan is active
	useEffect(() => {
		const interval = setInterval(() => {
			handleRefreshAll(true);
		}, 25000);
		return () => clearInterval(interval);
	}, [handleRefreshAll]);

	// Listen to real-time custom events when PA updates data
	useEffect(() => {
		const handleSyncEvent = (e: any) => {
			if (!e?.detail || e.detail.studentId === studentId) {
				handleRefreshAll(true);
			}
		};

		window.addEventListener("student-pa-hafalan-synced", handleSyncEvent);
		window.addEventListener("student-data-updated", handleSyncEvent);

		return () => {
			window.removeEventListener("student-pa-hafalan-synced", handleSyncEvent);
			window.removeEventListener("student-data-updated", handleSyncEvent);
		};
	}, [studentId, handleRefreshAll]);

	// Toggle ACC Vocab CRM handler
	const handleToggleSetujuiHafalan = async (targetValue: boolean) => {
		if (!canEdit) return;
		onUpdateField?.("isVocabComplete", targetValue);
		setIsVocabComplete(targetValue);
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
					? "Checklist Buku Hafalan berhasil disetujui (ACC CRM)!"
					: "Persetujuan checklist hafalan berhasil dibatalkan",
			);
			await Promise.all([fetchCrmData(), fetchPaData?.()]);
			onUpdate();
		} catch {
			onUpdateField?.("isVocabComplete", !targetValue);
			setIsVocabComplete(!targetValue);
			toast.error("Terjadi kesalahan saat memproses status hafalan");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Top Summary Metrics Bento Grid */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				{/* 1. Total Kosakata */}
				<div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
					<div>
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Total Kosakata
						</span>
						<div className="flex items-baseline gap-1 mt-1">
							<span className="text-2xl font-black text-slate-900 tracking-tight">
								{totalVocab.toLocaleString("id-ID")}
							</span>
							<span className="text-xs font-semibold text-slate-400">
								/ {targetVocab} kata
							</span>
						</div>
						<div className="mt-1">
							<span
								className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
									isVocabDone
										? "bg-emerald-50 text-emerald-700"
										: "bg-blue-50 text-blue-700"
								}`}
							>
								{vocabProgress}% Tercapai
							</span>
						</div>
					</div>
					<div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center shrink-0 border border-blue-100">
						<Languages className="w-5 h-5" />
					</div>
				</div>

				{/* 2. Total Kalimat */}
				<div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
					<div>
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Total Kalimat
						</span>
						<div className="flex items-baseline gap-1 mt-1">
							<span className="text-2xl font-black text-slate-900 tracking-tight">
								{totalSentences.toLocaleString("id-ID")}
							</span>
							<span className="text-xs font-semibold text-slate-400">
								kalimat
							</span>
						</div>
						<p className="text-[10px] text-slate-400 mt-1">
							Praktik struktur & tata bahasa
						</p>
					</div>
					<div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
						<FileText className="w-5 h-5" />
					</div>
				</div>

				{/* 3. Sesi Setoran PA */}
				<div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
					<div>
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Sesi Terverifikasi
						</span>
						<div className="flex items-baseline gap-1 mt-1">
							<span className="text-2xl font-black text-slate-900 tracking-tight">
								{hafalanSessions.length > 0
									? hafalanSessions.length
									: vocabLogs.length}
							</span>
							<span className="text-xs font-semibold text-slate-400">
								sesi PA
							</span>
						</div>
						<p className="text-[10px] text-slate-400 mt-1">
							Tercatat langsung oleh Dosen PA
						</p>
					</div>
					<div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
						<UserCheck className="w-5 h-5" />
					</div>
				</div>

				{/* 4. Status Checklist CRM */}
				<div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
					<div>
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Checklist CRM
						</span>
						<div className="mt-1.5">
							{isVocabComplete ? (
								<Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-extrabold px-2.5 py-0.5">
									✓ Disetujui (ACC)
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="bg-amber-50 text-amber-700 border-amber-300 text-xs font-bold px-2 py-0.5"
								>
									Menunggu ACC ({vocabProgress}%)
								</Badge>
							)}
						</div>
						<p className="text-[10px] text-slate-400 mt-1">
							1 dari 10 syarat kelulusan CRM
						</p>
					</div>
					<div
						className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
							isVocabComplete
								? "bg-emerald-50 text-emerald-700 border-emerald-100"
								: "bg-amber-50 text-amber-700 border-amber-100"
						}`}
					>
						<CheckCircle2 className="w-5 h-5" />
					</div>
				</div>
			</div>

			{/* Main Container Card */}
			<Card className="border border-slate-200/90 shadow-sm overflow-hidden bg-white rounded-2xl">
				{/* Top Live Sync Header */}
				<CardHeader className="bg-slate-50/90 border-b border-slate-200/80 py-4 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<div className="flex items-center gap-2">
							<CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
								<BookOpen className="w-4 h-4 text-[#0517B0]" />
								Monitoring Setoran Vocabulary & Bahasa (Sinkronisasi PA)
							</CardTitle>
						</div>
						<div className="flex flex-wrap items-center gap-2.5 mt-1">
							<p className="text-xs text-slate-500">
								Data hafalan terintegrasi secara realtime dengan pencatatan
								Dosen Pembimbing Akademik (PA).
							</p>
							<span className="hidden sm:inline text-slate-300">•</span>
							<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-700">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
								</span>
								<span>Real-Time PA</span>
							</div>
						</div>
					</div>

					{/* Action: Manual Real-time Refresh */}
					<div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
						<span className="text-[11px] text-slate-400 font-medium hidden md:inline">
							Sinkron:{" "}
							{lastSyncTime.toLocaleTimeString("id-ID", {
								hour: "2-digit",
								minute: "2-digit",
								second: "2-digit",
							})}{" "}
							WIB
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleRefreshAll(false)}
							disabled={isRefreshing}
							className="h-8.5 text-xs font-bold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 hover:text-[#0517B0] gap-1.5 rounded-xl shadow-2xs cursor-pointer"
						>
							<RefreshCw
								className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0517B0]" : "text-slate-500"}`}
							/>
							<span>
								{isRefreshing ? "Menyinkronkan..." : "Sinkronkan Data"}
							</span>
						</Button>
					</div>
				</CardHeader>

				{/* Content Grid: Left (Target & ACC) + Right (Session Feed) */}
				<CardContent className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
					{/* ─── LEFT COLUMN: Capaian Target & Kendali ACC CRM ─── */}
					<div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 pb-6 lg:pb-0 lg:pr-6 space-y-6">
						{/* Target Overview Card */}
						<div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-blue-50/50 to-slate-50/50 border border-blue-100/80 space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
									<Award className="w-3.5 h-3.5 text-[#0517B0]" />
									Capaian Target Vocabulary
								</span>
								<Badge
									variant="outline"
									className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
										isVocabDone
											? "bg-emerald-50 text-emerald-700 border-emerald-300"
											: "bg-blue-50 text-blue-700 border-blue-200"
									}`}
								>
									{isVocabDone ? "✓ Target Terpenuhi" : "Dalam Pendampingan"}
								</Badge>
							</div>

							{/* Big Numbers */}
							<div className="flex items-baseline justify-between">
								<div className="flex items-baseline gap-1.5">
									<span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
										{totalVocab.toLocaleString("id-ID")}
									</span>
									<span className="text-sm sm:text-base font-semibold text-slate-400">
										/ {targetVocab.toLocaleString("id-ID")} kata
									</span>
								</div>
								<span className="text-xl font-black text-[#0517B0]">
									{vocabProgress}%
								</span>
							</div>

							{/* Progress Bar */}
							<div className="space-y-1.5">
								<Progress
									value={vocabProgress}
									className="h-3 bg-slate-200/80 rounded-full overflow-hidden"
									indicatorClassName={
										isVocabDone
											? "bg-gradient-to-r from-emerald-500 to-teal-500"
											: "bg-gradient-to-r from-blue-600 to-[#0517B0]"
									}
								/>
								<div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
									<span>0 kata</span>
									<span>
										{isVocabDone
											? "🎉 Syarat kelulusan tercapai"
											: `Sisa ${targetVocab - totalVocab} kata lagi`}
									</span>
									<span>{targetVocab} kata</span>
								</div>
							</div>

							{/* Language Distribution Breakdown */}
							<div className="pt-3 border-t border-blue-100 flex flex-wrap items-center gap-1.5">
								<span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
									<Globe className="w-3 h-3 text-slate-400" />
									Rincian Bahasa:
								</span>
								{languageStats.length > 0 ? (
									languageStats.map((item) => (
										<span
											key={item.label}
											className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
										>
											<span>{item.flag}</span>
											<span>{item.label}</span>
											<span className="font-bold text-slate-900">
												({item.count} kata)
											</span>
										</span>
									))
								) : (
									<span className="text-[11px] text-slate-400 italic">
										Belum ada catatan setoran
									</span>
								)}
							</div>
						</div>

						{/* Action Validation / CRM ACC Box */}
						<div className="w-full pt-4 border-t border-slate-100 space-y-3">
							<div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
								<ShieldCheck className="w-4 h-4 text-[#0517B0]" />
								<span>Kendali Validasi Buku Hafalan (CRM)</span>
							</div>

							{isVocabComplete ? (
								<div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex flex-col items-center text-center gap-2">
									<div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
										<CheckCircle className="w-5 h-5" />
									</div>
									<div>
										<p className="text-sm font-bold text-emerald-900">
											Checklist Buku Hafalan Telah Disetujui (ACC CRM)
										</p>
										<p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
											Syarat kelulusan hafalan bahasa mahasiswa telah
											tervalidasi untuk keberangkatan magang.
										</p>
									</div>

									{canEdit && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleToggleSetujuiHafalan(false)}
											disabled={isLoading}
											className="mt-1 h-8 text-xs font-semibold text-rose-600 hover:bg-rose-100/60 hover:text-rose-700 rounded-xl"
										>
											<RotateCcw className="w-3.5 h-3.5 mr-1" />
											Batalkan Persetujuan ACC
										</Button>
									)}
								</div>
							) : (
								<div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
									<Button
										disabled={!canEdit || isLoading}
										onClick={() => handleToggleSetujuiHafalan(true)}
										className={`w-full font-bold h-10.5 rounded-xl text-xs sm:text-sm shadow-xs transition-all cursor-pointer ${
											isVocabDone
												? "bg-emerald-600 hover:bg-emerald-700 text-white"
												: "bg-[#0517B0] hover:bg-blue-800 text-white"
										}`}
									>
										{isLoading ? (
											<span className="flex items-center gap-2">
												<RefreshCw className="w-4 h-4 animate-spin" />
												Menyimpan...
											</span>
										) : (
											<span className="flex items-center gap-2">
												<CheckCircle2 className="w-4 h-4" />
												<span>
													{isVocabDone
														? "✓ Setujui Hafalan (Target Terpenuhi)"
														: "Setujui Hafalan Mahasiswa (ACC)"}
												</span>
											</span>
										)}
									</Button>
									<p className="text-[11px] text-slate-500 text-center leading-relaxed">
										{isVocabDone
											? "Target kelulusan telah 100% terpenuhi oleh Dosen PA. Klik tombol di atas untuk menandai checklist CRM selesai."
											: `Target tercapai ${vocabProgress}%. Sisa ${targetVocab - totalVocab} kata lagi. Persetujuan dapat diberikan bila ada dispensasi dari tim CRM.`}
									</p>
								</div>
							)}
						</div>
					</div>

					{/* ─── RIGHT COLUMN: Riwayat Setoran Hafalan Terverifikasi dari PA ─── */}
					<div className="lg:col-span-7 flex flex-col space-y-3">
						{/* Right Header & Filters */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
							<div className="flex items-center gap-2">
								<Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
								<h4 className="text-sm font-bold text-slate-900">
									Riwayat Setoran dari Dosen PA
								</h4>
								<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#0517B0] border border-blue-200">
									{hafalanSessions.length} Sesi
								</span>
								<span className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-medium items-center gap-1 hidden sm:inline-flex">
									<ArrowUpDown className="w-3 h-3 text-slate-400" />
									Terbaru
								</span>
							</div>

							{/* Search input for sessions */}
							{hafalanSessions.length > 0 && (
								<div className="relative w-full sm:w-56">
									<Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
									<Input
										placeholder="Cari bahasa / catatan..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="h-8 pl-8 text-xs rounded-xl bg-slate-50/70 border-slate-200"
									/>
									{searchQuery && (
										<button
											type="button"
											onClick={() => setSearchQuery("")}
											className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
										>
											<X className="w-3 h-3" />
										</button>
									)}
								</div>
							)}
						</div>

						{/* Scrollable Session Cards Feed */}
						<ScrollArea className="h-[430px] pr-2">
							<div className="space-y-3">
								{/* 1. Modern Hafalan Sessions from PA */}
								{filteredSessions.length > 0 &&
									filteredSessions.map((session, idx) => {
										const langLabel = getLanguageLabel(session);
										const flag = getLanguageFlag(session.language);
										const badgeClass = getLanguageBadgeClass(session.language);

										const sessionDate = session.date || session.createdAt;
										const dateStr = sessionDate
											? new Date(sessionDate).toLocaleDateString("id-ID", {
													day: "numeric",
													month: "long",
													year: "numeric",
												})
											: "-";

										return (
											<div
												key={session.id || idx}
												className="p-4 border border-slate-200/90 rounded-2xl hover:border-blue-300 hover:shadow-xs transition-all bg-white flex flex-col gap-2.5 group"
											>
												{/* Header row: Language badge, word chips, date */}
												<div className="flex flex-wrap items-center justify-between gap-2">
													<div className="flex flex-wrap items-center gap-1.5">
														<Badge
															className={`${badgeClass} text-xs font-bold px-2.5 py-0.5 border shadow-2xs`}
														>
															<span className="mr-1">{flag}</span>
															<span>{langLabel}</span>
														</Badge>

														<Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold px-2 py-0.5 border">
															+{session.vocabCount || 0} Kata
														</Badge>

														{session.sentenceCount > 0 && (
															<Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-bold px-2 py-0.5 border">
																+{session.sentenceCount} Kalimat
															</Badge>
														)}
													</div>

													<span className="text-xs font-medium text-slate-500 flex items-center gap-1">
														<Calendar className="w-3.5 h-3.5 text-slate-400" />
														{dateStr}
													</span>
												</div>

												{/* Examiner / PA & Notes row */}
												<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs pt-1.5 border-t border-slate-100">
													<span className="text-slate-600 flex items-center gap-1">
														<span className="text-slate-400">Penguji:</span>
														<strong className="text-slate-800 font-semibold">
															{session.createdByUser?.fullName ||
																session.createdByUser?.username ||
																"Dosen Pembimbing Akademik"}
														</strong>
													</span>

													{session.notes && (
														<span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 italic text-[11px]">
															<Quote className="w-2.5 h-2.5 text-slate-400 shrink-0" />
															<span>{session.notes}</span>
														</span>
													)}
												</div>

												{/* Action & Preview footer */}
												<div className="flex items-center justify-between pt-1">
													<div className="flex items-center gap-1">
														{Array.isArray(session.vocabList) &&
														session.vocabList.length > 0 ? (
															<div className="flex items-center gap-1 text-[11px] text-slate-500">
																<Tag className="w-3 h-3 text-blue-500" />
																<span>
																	{session.vocabList.length} rincian kata
																	tersimpan
																</span>
															</div>
														) : (
															<span className="text-[11px] text-slate-400">
																Input Total Akumulasi PA
															</span>
														)}
													</div>

													{/* Button: Open Detail Modal */}
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => setDetailSession(session)}
														className="h-7 px-2.5 text-[11px] font-bold text-blue-700 hover:bg-blue-50 hover:text-[#0517B0] rounded-lg gap-1 cursor-pointer"
													>
														<Eye className="w-3.5 h-3.5" />
														<span>Lihat Detail Kata</span>
													</Button>
												</div>
											</div>
										);
									})}

								{/* 2. Legacy Vocab Logs if no modern sessions */}
								{hafalanSessions.length === 0 &&
									vocabLogs.length > 0 &&
									[...vocabLogs]
										.sort(
											(a, b) =>
												new Date(b.date || b.createdAt || 0).getTime() -
												new Date(a.date || a.createdAt || 0).getTime(),
										)
										.map((log) => (
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

								{/* 3. Empty State (No sessions or search empty) */}
								{filteredSessions.length === 0 &&
									hafalanSessions.length > 0 && (
										<div className="text-center py-8 text-slate-400 text-xs">
											Tidak ada setoran hafalan yang cocok dengan pencarian "
											{searchQuery}".
										</div>
									)}

								{hafalanSessions.length === 0 && vocabLogs.length === 0 && (
									<div className="text-center text-slate-400 text-xs sm:text-sm py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-2.5 bg-slate-50/50">
										<div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0517B0] flex items-center justify-center">
											<BookOpen className="w-6 h-6" />
										</div>
										<p className="font-bold text-slate-700">
											Belum ada riwayat setoran hafalan dari Dosen PA.
										</p>
										<p className="text-xs text-slate-400 max-w-sm leading-relaxed">
											Data setoran kosakata dan kalimat akan otomatis
											tersinkronisasi secara realtime begitu Dosen PA menginput
											sesi hafalan mahasiswa di panel PA.
										</p>
									</div>
								)}
							</div>
						</ScrollArea>
					</div>
				</CardContent>
			</Card>

			{/* ─── MODAL DETAIL SESI HAFALAN DARI PA ─── */}
			{detailSession && (
				<Dialog
					open={!!detailSession}
					onOpenChange={(open) => !open && setDetailSession(null)}
				>
					<DialogContent className="w-[95vw] sm:max-w-lg max-h-[85vh] max-h-[85dvh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl">
						{/* Header */}
						<div className="shrink-0 bg-gradient-to-r from-blue-700 to-[#0517B0] text-white p-4 sm:p-5">
							<div className="flex items-center justify-between gap-2">
								<Badge className="bg-white/20 text-white border-transparent text-xs font-bold px-2.5 py-0.5">
									<span className="mr-1">
										{getLanguageFlag(detailSession.language)}
									</span>
									<span>{getLanguageLabel(detailSession)}</span>
								</Badge>
								<span className="text-xs text-blue-100 flex items-center gap-1">
									<Calendar className="w-3.5 h-3.5" />
									{new Date(
										detailSession.date || detailSession.createdAt,
									).toLocaleDateString("id-ID", {
										weekday: "long",
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
								</span>
							</div>

							<DialogTitle className="text-base font-bold text-white mt-2">
								Rincian Setoran Hafalan Siswa
							</DialogTitle>
							<DialogDescription className="text-xs text-blue-100/90 mt-0.5">
								Diverifikasi oleh:{" "}
								<strong className="text-white">
									{detailSession.createdByUser?.fullName ||
										detailSession.createdByUser?.username ||
										"Dosen PA"}
								</strong>
							</DialogDescription>
						</div>

						{/* Scrollable Content Body */}
						<div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
							{/* Metrics summary */}
							<div className="grid grid-cols-2 gap-3">
								<div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200">
									<span className="text-[11px] font-semibold text-blue-800 block">
										Kosakata Disetor:
									</span>
									<span className="text-xl font-black text-blue-950">
										+{detailSession.vocabCount} kata
									</span>
								</div>
								<div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200">
									<span className="text-[11px] font-semibold text-purple-800 block">
										Kalimat Dipraktikkan:
									</span>
									<span className="text-xl font-black text-purple-950">
										+{detailSession.sentenceCount} kalimat
									</span>
								</div>
							</div>

							{/* Notes if available */}
							{detailSession.notes && (
								<div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
									<span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
										Catatan & Evaluasi Dosen PA:
									</span>
									<p className="text-xs text-slate-700 italic">
										"{detailSession.notes}"
									</p>
								</div>
							)}

							{/* Vocab Tags Cloud */}
							{Array.isArray(detailSession.vocabList) &&
							detailSession.vocabList.length > 0 ? (
								<div className="space-y-2">
									<span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
										<Tag className="w-3.5 h-3.5 text-blue-600" />
										Daftar Kosakata yang Disetor (
										{detailSession.vocabList.length} kata):
									</span>
									<div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-48 overflow-y-auto">
										{detailSession.vocabList.map((word, wIdx) => (
											<span
												key={wIdx}
												className="px-2 py-1 bg-white border border-slate-200 text-slate-800 text-xs font-mono rounded-lg shadow-2xs"
											>
												{word}
											</span>
										))}
									</div>
								</div>
							) : (
								<div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
									<p className="text-xs text-slate-500">
										Sesi ini dicatat menggunakan input total kumulatif (+
										{detailSession.vocabCount} kata) oleh Dosen PA.
									</p>
								</div>
							)}

							{/* Sentence List if available */}
							{Array.isArray(detailSession.sentenceList) &&
								detailSession.sentenceList.length > 0 && (
									<div className="space-y-2">
										<span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
											<MessageSquare className="w-3.5 h-3.5 text-purple-600" />
											Kalimat yang Dipraktikkan (
											{detailSession.sentenceList.length}):
										</span>
										<div className="space-y-1.5 max-h-44 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
											{detailSession.sentenceList.map((sentence, sIdx) => (
												<div
													key={sIdx}
													className="text-xs text-slate-700 p-2 bg-white rounded-lg border border-slate-100"
												>
													<span className="font-bold text-slate-400 mr-1.5">
														{sIdx + 1}.
													</span>
													{sentence}
												</div>
											))}
										</div>
									</div>
								)}
						</div>

						{/* Pinned Footer */}
						<DialogFooter className="shrink-0 p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
							<Button
								type="button"
								size="sm"
								onClick={() => setDetailSession(null)}
								className="text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-4"
							>
								Tutup
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
