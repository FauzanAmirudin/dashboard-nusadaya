"use client";

import {
	AlertCircle,
	ArrowUpDown,
	BookMarked,
	BookOpen,
	Calendar,
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	ClipboardCopy,
	Copy,
	Edit2,
	Eye,
	FileText,
	Filter,
	Languages,
	MessageSquare,
	Plus,
	PlusCircle,
	Quote,
	RotateCcw,
	Search,
	SlidersHorizontal,
	Sparkles,
	Tag,
	Target,
	Trash2,
	Trophy,
	User,
	X,
	Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { HafalanFormState, HafalanSession } from "./types";

interface TabHafalanProps {
	studentId: number;
	hafalanSessions: HafalanSession[];
	targetVocab?: number;
	canEdit: boolean;
	isSaving: boolean;
	onAddHafalan: (form: HafalanFormState) => Promise<void>;
	onEditHafalan: (id: number, form: HafalanFormState) => Promise<void>;
	onDeleteHafalan: (id: number) => Promise<void>;
	onUpdateTargetVocab?: (newTarget: number) => Promise<void>;
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

const QUICK_EVALUATION_TAGS = [
	"⭐ Sangat Lancar",
	"👍 Cukup Lancar",
	"🗣️ Pelafalan Bagus",
	"🔄 Butuh Pengulangan",
	"📚 Kosakata Bertambah",
	"⚡ Respon Cepat",
];

function getLanguageLabel(session: HafalanSession): string {
	if (session.language === "lainnya" && session.languageCustom) {
		return session.languageCustom;
	}
	const key = (session.language || "").toLowerCase().trim();
	return LANGUAGE_CONFIGS[key]?.label ?? session.language;
}

function getLanguageFlag(language: string): string {
	const key = (language || "").toLowerCase().trim();
	return LANGUAGE_CONFIGS[key]?.flag ?? "🌐";
}

function getLanguageBadgeClass(language: string): string {
	const key = (language || "").toLowerCase().trim();
	return (
		LANGUAGE_CONFIGS[key]?.badgeClass ??
		"bg-slate-100 text-slate-700 border-slate-200"
	);
}

const INITIAL_FORM: HafalanFormState = {
	language: "inggris",
	languageCustom: "",
	vocabCount: 0,
	sentenceCount: 0,
	vocabList: [],
	sentenceList: [],
	notes: "",
	date: new Date().toISOString().split("T")[0],
};

export function TabHafalan({
	studentId,
	hafalanSessions,
	targetVocab = 500,
	canEdit,
	isSaving,
	onAddHafalan,
	onEditHafalan,
	onDeleteHafalan,
	onUpdateTargetVocab,
}: TabHafalanProps) {
	// Form state
	const [form, setForm] = useState<HafalanFormState>(INITIAL_FORM);
	const [inputVocab, setInputVocab] = useState("");
	const [inputSentence, setInputSentence] = useState("");
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);

	// Dedicated "Input Total Jumlah Hafalan" Quick Modal
	const [isQuickTotalModalOpen, setIsQuickTotalModalOpen] = useState(false);
	const [quickTotalMode, setQuickTotalMode] = useState<"add" | "set">("add");
	const [quickTotalForm, setQuickTotalForm] = useState({
		language: "inggris",
		languageCustom: "",
		vocabCount: 50,
		sentenceCount: 0,
		date: new Date().toISOString().split("T")[0],
		notes: "",
	});

	// Input modes (tag vs direct number) for standard form
	const [vocabInputMode, setVocabInputMode] = useState<"tag" | "number">("tag");
	const [sentenceInputMode, setSentenceInputMode] = useState<"tag" | "number">(
		"tag",
	);

	// Batch Paste Modal
	const [isBatchPasteOpen, setIsBatchPasteOpen] = useState(false);
	const [batchPasteText, setBatchPasteText] = useState("");

	// Edit Target Modal
	const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
	const [tempTarget, setTempTarget] = useState(targetVocab);

	// Filters & Search
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
	const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_vocab">(
		"newest",
	);

	// Delete & Detail Dialogs
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [viewSessionDetail, setViewSessionDetail] =
		useState<HafalanSession | null>(null);
	const [detailSearchQuery, setDetailSearchQuery] = useState("");

	// Clipboard state
	const [copiedSessionId, setCopiedSessionId] = useState<number | null>(null);

	// Aggregated Metrics
	const totalVocab = useMemo(
		() =>
			hafalanSessions.reduce((acc, s) => acc + (Number(s.vocabCount) || 0), 0),
		[hafalanSessions],
	);

	const totalSentence = useMemo(
		() =>
			hafalanSessions.reduce(
				(acc, s) => acc + (Number(s.sentenceCount) || 0),
				0,
			),
		[hafalanSessions],
	);

	const progressPercentage = useMemo(() => {
		if (!targetVocab || targetVocab <= 0) return 0;
		return Math.min(100, Math.round((totalVocab / targetVocab) * 100));
	}, [totalVocab, targetVocab]);

	// Language Breakdown stats
	const languageStats = useMemo(() => {
		const map: Record<string, { label: string; count: number; flag: string }> =
			{};
		for (const s of hafalanSessions) {
			const label = getLanguageLabel(s);
			const flag = getLanguageFlag(s.language);
			if (!map[label]) {
				map[label] = { label, count: 0, flag };
			}
			map[label].count += Number(s.vocabCount) || 0;
		}
		return Object.values(map).sort((a, b) => b.count - a.count);
	}, [hafalanSessions]);

	// Latest session
	const latestSession = useMemo(() => {
		if (hafalanSessions.length === 0) return null;
		return [...hafalanSessions].sort(
			(a, b) =>
				new Date(b.date || b.createdAt).getTime() -
				new Date(a.date || a.createdAt).getTime(),
		)[0];
	}, [hafalanSessions]);

	// Filtered & Sorted Sessions
	const filteredSessions = useMemo(() => {
		let list = [...hafalanSessions];

		// Language filter
		if (selectedLanguage !== "all") {
			list = list.filter((s) => s.language === selectedLanguage);
		}

		// Search Query
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			list = list.filter((s) => {
				const langName = getLanguageLabel(s).toLowerCase();
				const notes = (s.notes || "").toLowerCase();
				const recordedBy = (s.createdByUser?.fullName || "").toLowerCase();
				const hasInVocab = Array.isArray(s.vocabList)
					? s.vocabList.some((w) => String(w).toLowerCase().includes(q))
					: false;
				const hasInSentence = Array.isArray(s.sentenceList)
					? s.sentenceList.some((st) => String(st).toLowerCase().includes(q))
					: false;

				return (
					langName.includes(q) ||
					notes.includes(q) ||
					recordedBy.includes(q) ||
					hasInVocab ||
					hasInSentence
				);
			});
		}

		// Sort
		list.sort((a, b) => {
			if (sortBy === "oldest") {
				return (
					new Date(a.date || a.createdAt).getTime() -
					new Date(b.date || b.createdAt).getTime()
				);
			}
			if (sortBy === "most_vocab") {
				return (b.vocabCount || 0) - (a.vocabCount || 0);
			}
			// default newest
			return (
				new Date(b.date || b.createdAt).getTime() -
				new Date(a.date || a.createdAt).getTime()
			);
		});

		return list;
	}, [hafalanSessions, selectedLanguage, searchQuery, sortBy]);

	// Tag Handlers
	const handleAddVocabTag = (text: string) => {
		if (!text.trim()) return;
		const rawWords = text
			.split(/[,;\n]+/)
			.map((w) => w.replace(/^[\d+.\-•*)\s]+/, "").trim())
			.filter(Boolean);
		if (rawWords.length === 0) return;

		setForm((prev) => {
			const currentList = prev.vocabList || [];
			const merged = [...currentList, ...rawWords];
			return {
				...prev,
				vocabList: merged,
				vocabCount: merged.length,
			};
		});
		setInputVocab("");
	};

	const handleRemoveVocabTag = (index: number) => {
		setForm((prev) => {
			const currentList = prev.vocabList || [];
			const nextList = currentList.filter((_, i) => i !== index);
			return {
				...prev,
				vocabList: nextList,
				vocabCount: nextList.length,
			};
		});
	};

	const handleAddSentenceTag = (text: string) => {
		const clean = text.trim();
		if (!clean) return;

		setForm((prev) => {
			const currentList = prev.sentenceList || [];
			const merged = [...currentList, clean];
			return {
				...prev,
				sentenceList: merged,
				sentenceCount: merged.length,
			};
		});
		setInputSentence("");
	};

	const handleRemoveSentenceTag = (index: number) => {
		setForm((prev) => {
			const currentList = prev.sentenceList || [];
			const nextList = currentList.filter((_, i) => i !== index);
			return {
				...prev,
				sentenceList: nextList,
				sentenceCount: nextList.length,
			};
		});
	};

	// Batch Paste Execute
	const handleApplyBatchPaste = () => {
		if (!batchPasteText.trim()) return;
		const lines = batchPasteText
			.split(/\r?\n|[,;]+/)
			.map((w) => w.replace(/^[\d+.\-•*)\s]+/, "").trim())
			.filter((w) => w.length > 0);

		if (lines.length === 0) {
			toast.error("Tidak ada kata yang valid untuk ditambahkan");
			return;
		}

		setForm((prev) => {
			const current = prev.vocabList || [];
			const merged = [...current, ...lines];
			return {
				...prev,
				vocabList: merged,
				vocabCount: merged.length,
			};
		});

		toast.success(`Berhasil menambahkan ${lines.length} kosakata ke daftar`);
		setBatchPasteText("");
		setIsBatchPasteOpen(false);
	};

	// Quick evaluation append
	const handleAppendNoteTag = (evalTag: string) => {
		setForm((prev) => {
			const current = prev.notes ? prev.notes.trim() : "";
			const separator = current ? " | " : "";
			return {
				...prev,
				notes: `${current}${separator}${evalTag}`,
			};
		});
	};

	// Submit Standard Form (Add or Edit)
	const handleSubmit = async () => {
		if (form.language === "lainnya" && !form.languageCustom.trim()) {
			toast.error("Nama bahasa kustom wajib diisi");
			return;
		}

		// Flush any pending tag inputs
		const pendingVocab = inputVocab.trim();
		const finalVocabList = pendingVocab
			? [
					...(form.vocabList || []),
					...pendingVocab
						.split(/[,;\n]+/)
						.map((w) => w.replace(/^[\d+.\-•*)\s]+/, "").trim())
						.filter(Boolean),
				]
			: form.vocabList || [];

		const pendingSentence = inputSentence.trim();
		const finalSentenceList = pendingSentence
			? [...(form.sentenceList || []), pendingSentence]
			: form.sentenceList || [];

		let vCount = Number(form.vocabCount) || 0;
		if (vocabInputMode === "tag" || vCount <= 0) {
			vCount = finalVocabList.length > 0 ? finalVocabList.length : vCount;
		}

		let sCount = Number(form.sentenceCount) || 0;
		if (sentenceInputMode === "tag" || sCount <= 0) {
			sCount = finalSentenceList.length > 0 ? finalSentenceList.length : sCount;
		}

		if (vCount <= 0 && sCount <= 0) {
			toast.error(
				"Silakan masukkan jumlah atau daftar kosakata/kalimat yang dihafal",
			);
			return;
		}

		const payload: HafalanFormState = {
			...form,
			vocabCount: vCount,
			sentenceCount: sCount,
			vocabList: finalVocabList,
			sentenceList: finalSentenceList,
			notes: form.notes ? form.notes.trim() : undefined,
		};

		if (isEditing && editingId) {
			await onEditHafalan(editingId, payload);
			setIsEditing(false);
			setEditingId(null);
		} else {
			await onAddHafalan(payload);
		}

		setForm(INITIAL_FORM);
		setInputVocab("");
		setInputSentence("");
		setIsFormOpen(false);
	};

	// Submit Dedicated "Input Total Jumlah Hafalan" Quick Modal
	const handleQuickTotalSubmit = async () => {
		if (
			quickTotalForm.language === "lainnya" &&
			!quickTotalForm.languageCustom.trim()
		) {
			toast.error("Nama bahasa kustom wajib diisi");
			return;
		}

		const inputVal = Number(quickTotalForm.vocabCount) || 0;
		if (inputVal <= 0) {
			toast.error("Masukkan jumlah kosakata yang valid (lebih dari 0)");
			return;
		}

		let actualDelta = inputVal;
		let notesText = quickTotalForm.notes ? quickTotalForm.notes.trim() : "";

		if (quickTotalMode === "set") {
			// Mode setel total akumulasi: target total akhir = inputVal
			// actual delta = inputVal - totalVocab
			actualDelta = inputVal - totalVocab;
			if (actualDelta <= 0) {
				toast.error(
					`Total saat ini sudah ${totalVocab} kata. Masukkan angka target akumulasi yang lebih besar dari ${totalVocab}.`,
				);
				return;
			}
			const adjustmentNote = `[Penyesuaian Total Akumulasi ke ${inputVal} kata]`;
			notesText = notesText ? `${adjustmentNote} ${notesText}` : adjustmentNote;
		}

		const payload: HafalanFormState = {
			language: quickTotalForm.language,
			languageCustom:
				quickTotalForm.language === "lainnya"
					? quickTotalForm.languageCustom.trim()
					: "",
			vocabCount: actualDelta,
			sentenceCount: Number(quickTotalForm.sentenceCount) || 0,
			vocabList: [],
			sentenceList: [],
			notes: notesText || undefined,
			date: quickTotalForm.date,
		};

		await onAddHafalan(payload);
		setIsQuickTotalModalOpen(false);

		// Reset quick total form
		setQuickTotalForm({
			language: "inggris",
			languageCustom: "",
			vocabCount: 50,
			sentenceCount: 0,
			date: new Date().toISOString().split("T")[0],
			notes: "",
		});
	};

	const startEdit = (session: HafalanSession) => {
		setIsEditing(true);
		setIsFormOpen(true);
		setEditingId(session.id);
		setForm({
			language: session.language,
			languageCustom: session.languageCustom ?? "",
			vocabCount: session.vocabCount,
			sentenceCount: session.sentenceCount,
			vocabList: Array.isArray(session.vocabList) ? [...session.vocabList] : [],
			sentenceList: Array.isArray(session.sentenceList)
				? [...session.sentenceList]
				: [],
			notes: session.notes ?? "",
			date: new Date(session.date || session.createdAt)
				.toISOString()
				.split("T")[0],
		});
		setVocabInputMode(
			Array.isArray(session.vocabList) && session.vocabList.length > 0
				? "tag"
				: "number",
		);
		setSentenceInputMode(
			Array.isArray(session.sentenceList) && session.sentenceList.length > 0
				? "tag"
				: "number",
		);
		setInputVocab("");
		setInputSentence("");

		// Scroll to form smoothly
		window.scrollTo({ top: 350, behavior: "smooth" });
	};

	const cancelEdit = () => {
		setIsEditing(false);
		setEditingId(null);
		setForm(INITIAL_FORM);
		setInputVocab("");
		setInputSentence("");
		setIsFormOpen(false);
	};

	// Copy single session words
	const handleCopySessionWords = (session: HafalanSession) => {
		const words = Array.isArray(session.vocabList) ? session.vocabList : [];
		if (words.length === 0) {
			toast.info("Tidak ada daftar kata untuk disalin");
			return;
		}
		navigator.clipboard.writeText(words.join(", "));
		setCopiedSessionId(session.id);
		setTimeout(() => setCopiedSessionId(null), 2000);
		toast.success(`${words.length} kosakata berhasil disalin ke clipboard`);
	};

	// Computed projected total for quick modal preview
	const projectedQuickTotal = useMemo(() => {
		const val = Number(quickTotalForm.vocabCount) || 0;
		if (quickTotalMode === "set") {
			return Math.max(val, totalVocab);
		}
		return totalVocab + val;
	}, [quickTotalForm.vocabCount, quickTotalMode, totalVocab]);

	const projectedPercentage = useMemo(() => {
		if (!targetVocab || targetVocab <= 0) return 0;
		return Math.min(100, Math.round((projectedQuickTotal / targetVocab) * 100));
	}, [projectedQuickTotal, targetVocab]);

	return (
		<div className="space-y-6">
			{/* ─── 1. BENTO KPI & TARGET PROGRESS DASHBOARD ─── */}
			<div className="grid grid-cols-1 md:grid-cols-12 gap-4">
				{/* Main Target Milestone Card (Spans 6 cols on md) */}
				<div className="md:col-span-6 bg-gradient-to-br from-white to-blue-50/50 border border-blue-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
					<div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

					<div>
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								<span className="w-8 h-8 rounded-xl bg-[#0517B0]/10 flex items-center justify-center text-[#0517B0]">
									<Target className="w-4 h-4" />
								</span>
								<div>
									<h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
										Pencapaian Target Hafalan
									</h4>
									<p className="text-xs text-slate-400">
										Terintegrasi langsung dengan checklist Panel CRM
									</p>
								</div>
							</div>

							<div className="flex items-center gap-1.5">
								<Badge
									variant="outline"
									className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
										totalVocab >= targetVocab
											? "bg-emerald-50 text-emerald-700 border-emerald-300"
											: totalVocab >= targetVocab * 0.5
												? "bg-blue-50 text-blue-700 border-blue-300"
												: "bg-amber-50 text-amber-700 border-amber-300"
									}`}
								>
									{totalVocab >= targetVocab ? (
										<span className="flex items-center gap-1">
											<Trophy className="w-3 h-3 text-emerald-600" />
											Target Tercapai (CRM ACC)
										</span>
									) : (
										`${progressPercentage}% Selesai`
									)}
								</Badge>

								{canEdit && onUpdateTargetVocab && (
									<button
										type="button"
										onClick={() => {
											setTempTarget(targetVocab);
											setIsTargetModalOpen(true);
										}}
										title="Sesuaikan Target Kosakata"
										className="p-1.5 text-slate-400 hover:text-[#0517B0] hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
									>
										<SlidersHorizontal className="w-3.5 h-3.5" />
									</button>
								)}
							</div>
						</div>

						{/* Score Big Numbers */}
						<div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
							<div className="flex items-baseline gap-2">
								<span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
									{totalVocab.toLocaleString("id-ID")}
								</span>
								<span className="text-base sm:text-lg font-semibold text-slate-400">
									/ {targetVocab.toLocaleString("id-ID")} kata
								</span>
							</div>

							{/* Quick CTA to input total */}
							{canEdit && (
								<Button
									type="button"
									size="sm"
									onClick={() => setIsQuickTotalModalOpen(true)}
									className="h-8 px-3 text-xs font-bold rounded-xl bg-blue-600 hover:bg-[#0517B0] text-white shadow-2xs gap-1.5 self-start sm:self-auto"
								>
									<PlusCircle className="w-3.5 h-3.5" />
									<span>Input Total Hafalan</span>
								</Button>
							)}
						</div>

						{/* Progress Bar with Milestone Dots */}
						<div className="mt-3 space-y-1.5">
							<Progress
								value={progressPercentage}
								className="h-2.5 bg-slate-100 rounded-full overflow-hidden"
								indicatorClassName={
									totalVocab >= targetVocab
										? "bg-gradient-to-r from-emerald-500 to-teal-500"
										: "bg-gradient-to-r from-blue-600 to-[#0517B0]"
								}
							/>
							<div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
								<span>0 kata</span>
								<span>250 kata (Menengah)</span>
								<span>{targetVocab} kata (Standar CRM)</span>
							</div>
						</div>
					</div>

					{/* Language Pill Breakdown */}
					<div className="mt-4 pt-3 border-t border-blue-100/80 flex flex-wrap items-center gap-1.5">
						<span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
							<Languages className="w-3 h-3 text-slate-400" />
							Bahasa:
						</span>
						{languageStats.length > 0 ? (
							languageStats.map((item) => (
								<span
									key={item.label}
									className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-slate-700 border border-slate-200/80 shadow-2xs"
								>
									<span>{item.flag}</span>
									<span>{item.label}</span>
									<span className="font-bold text-slate-900">
										({item.count})
									</span>
								</span>
							))
						) : (
							<span className="text-[11px] text-slate-400 italic">
								Belum ada data setoran bahasa
							</span>
						)}
					</div>
				</div>

				{/* Stat Card 2: Kalimat & Praktik (Spans 3 cols on md) */}
				<div className="md:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
					<div>
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold uppercase tracking-wider text-slate-500">
								Total Kalimat
							</span>
							<span className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
								<MessageSquare className="w-4 h-4" />
							</span>
						</div>
						<div className="mt-4">
							<span className="text-3xl font-extrabold text-slate-900 tracking-tight">
								{totalSentence.toLocaleString("id-ID")}
							</span>
							<span className="text-xs text-slate-500 ml-1.5 font-medium">
								kalimat
							</span>
						</div>
						<p className="text-xs text-slate-400 mt-1">
							Struktur tata bahasa & ungkapan kerja
						</p>
					</div>

					<div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
						<span>Rata-rata/sesi:</span>
						<span className="font-bold text-slate-800">
							{hafalanSessions.length > 0
								? (totalSentence / hafalanSessions.length).toFixed(1)
								: 0}{" "}
							kalimat
						</span>
					</div>
				</div>

				{/* Stat Card 3: Status Integrasi CRM (Spans 3 cols on md) */}
				<div className="md:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
					<div>
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold uppercase tracking-wider text-slate-500">
								Integrasi CRM
							</span>
							<span
								className={`w-8 h-8 rounded-xl flex items-center justify-center ${
									totalVocab >= targetVocab
										? "bg-emerald-500/10 text-emerald-600"
										: "bg-blue-500/10 text-blue-600"
								}`}
							>
								<CheckCircle2 className="w-4 h-4" />
							</span>
						</div>
						<div className="mt-3">
							<Badge
								className={`text-xs font-bold px-2.5 py-1 ${
									totalVocab >= targetVocab
										? "bg-emerald-100 text-emerald-800 border-emerald-300"
										: "bg-amber-100 text-amber-800 border-amber-300"
								}`}
							>
								{totalVocab >= targetVocab
									? "✓ Checklist CRM Terpenuhi"
									: `Menunggu ${targetVocab - totalVocab} kata lagi`}
							</Badge>
						</div>
						<p className="text-xs text-slate-500 mt-2 leading-relaxed">
							Setiap input hafalan langsung terekam dan tersinkron ke checklist
							Buku Hafalan di Panel CRM.
						</p>
					</div>

					<div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
						<span>Total Sesi:</span>
						<span className="font-bold text-slate-800">
							{hafalanSessions.length} sesi pertemuan
						</span>
					</div>
				</div>
			</div>

			{/* ─── 2. CONTROL ACTION BAR & BUTTONS ─── */}
			<div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
					{/* Search & Filter Controls */}
					<div className="flex flex-1 flex-wrap items-center gap-2">
						{/* Search Input */}
						<div className="relative flex-1 min-w-[200px] sm:max-w-xs">
							<Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
							<Input
								placeholder="Cari kata, kalimat, catatan..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 h-9 text-xs sm:text-sm bg-slate-50/60 border-slate-200 rounded-xl focus:bg-white"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							)}
						</div>

						{/* Language Filter */}
						<div className="w-auto min-w-[130px]">
							<Select
								value={selectedLanguage}
								onValueChange={(val) => setSelectedLanguage(val || "all")}
							>
								<SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 bg-slate-50/60">
									<SelectValue placeholder="Semua Bahasa" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Bahasa</SelectItem>
									<SelectItem value="inggris">🇬🇧 Inggris</SelectItem>
									<SelectItem value="mandarin">🇨🇳 Mandarin</SelectItem>
									<SelectItem value="jepang">🇯🇵 Jepang</SelectItem>
									<SelectItem value="jerman">🇩🇪 Jerman</SelectItem>
									<SelectItem value="arab">🇸🇦 Arab</SelectItem>
									<SelectItem value="korea">🇰🇷 Korea</SelectItem>
									<SelectItem value="lainnya">🌐 Lainnya</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Sort Select */}
						<div className="w-auto min-w-[130px] hidden sm:block">
							<Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
								<SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 bg-slate-50/60">
									<SelectValue placeholder="Urutkan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="newest">Terbaru</SelectItem>
									<SelectItem value="oldest">Terlama</SelectItem>
									<SelectItem value="most_vocab">Kosakata Terbanyak</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Reset filter button */}
						{(searchQuery || selectedLanguage !== "all") && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setSearchQuery("");
									setSelectedLanguage("all");
								}}
								className="h-9 px-2 text-xs text-slate-500 hover:text-slate-800"
							>
								<RotateCcw className="w-3.5 h-3.5 mr-1" />
								Reset
							</Button>
						)}
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto">
						{/* Quick Total Input Button */}
						{canEdit && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsQuickTotalModalOpen(true)}
								className="h-9 px-3.5 text-xs font-bold rounded-xl border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 shadow-2xs flex-1 sm:flex-initial"
							>
								<Zap className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
								<span>Input Total Hafalan</span>
							</Button>
						)}

						{/* Toggle Standard Input Form Button */}
						{canEdit && (
							<Button
								type="button"
								size="sm"
								onClick={() => {
									if (isEditing) {
										cancelEdit();
									} else {
										setIsFormOpen((prev) => !prev);
									}
								}}
								className={`h-9 px-4 text-xs font-bold rounded-xl shadow-xs transition-all flex-1 sm:flex-initial ${
									isFormOpen
										? "bg-slate-800 hover:bg-slate-900 text-white"
										: "bg-[#0517B0] hover:bg-blue-700 text-white"
								}`}
							>
								{isFormOpen ? (
									<>
										<ChevronUp className="w-3.5 h-3.5 mr-1.5" />
										<span>{isEditing ? "Batal Edit" : "Tutup Form"}</span>
									</>
								) : (
									<>
										<Plus className="w-4 h-4 mr-1.5" />
										<span>Catat Rincian Tag</span>
									</>
								)}
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* ─── 3. COLLAPSIBLE INPUT / EDIT FORM (DETAILED TAG FORM) ─── */}
			{canEdit && isFormOpen && (
				<div className="bg-gradient-to-b from-blue-50/70 via-white to-white border-2 border-blue-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
					{/* Header of Form */}
					<div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
						<div className="flex items-center gap-2">
							<span className="w-7 h-7 rounded-lg bg-[#0517B0] flex items-center justify-center text-white">
								<Sparkles className="w-4 h-4" />
							</span>
							<div>
								<h3 className="text-sm font-bold text-slate-900">
									{isEditing
										? `Edit Setoran Hafalan (ID #${editingId})`
										: "Input Sesi Setoran Hafalan Baru (Rincian Tag)"}
								</h3>
								<p className="text-xs text-slate-500">
									Catat kosakata dan kalimat yang berhasil disetor mahasiswa.
									Data otomatis tersinkron ke Panel CRM.
								</p>
							</div>
						</div>

						<Button
							variant="ghost"
							size="sm"
							onClick={cancelEdit}
							className="h-8 text-xs text-slate-500 hover:text-slate-800"
						>
							<X className="w-4 h-4 mr-1" />
							Tutup
						</Button>
					</div>

					{/* Date & Language Selection */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{/* Tanggal */}
						<div>
							<Label className="text-xs font-semibold text-slate-700 block mb-1.5">
								Tanggal Setoran <span className="text-rose-500">*</span>
							</Label>
							<div className="relative">
								<Input
									type="date"
									className="bg-white rounded-xl text-xs sm:text-sm h-10 border-slate-200"
									value={form.date || new Date().toISOString().split("T")[0]}
									onChange={(e) =>
										setForm((p) => ({ ...p, date: e.target.value }))
									}
								/>
							</div>
						</div>

						{/* Bahasa */}
						<div>
							<Label className="text-xs font-semibold text-slate-700 block mb-1.5">
								Bahasa Asing <span className="text-rose-500">*</span>
							</Label>
							<Select
								value={form.language}
								onValueChange={(val) =>
									setForm((p) => ({
										...p,
										language: val ?? "inggris",
										languageCustom: val === "lainnya" ? p.languageCustom : "",
									}))
								}
							>
								<SelectTrigger className="bg-white rounded-xl text-xs sm:text-sm h-10 border-slate-200">
									<SelectValue placeholder="Pilih Bahasa">
										<span className="flex items-center gap-2">
											<span>{getLanguageFlag(form.language)}</span>
											<span>
												{LANGUAGE_CONFIGS[form.language]?.label ||
													form.language}
											</span>
										</span>
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="inggris">
										🇬🇧 Bahasa Inggris (English)
									</SelectItem>
									<SelectItem value="mandarin">
										🇨🇳 Bahasa Mandarin (中文)
									</SelectItem>
									<SelectItem value="jepang">
										🇯🇵 Bahasa Jepang (日本語)
									</SelectItem>
									<SelectItem value="jerman">
										🇩🇪 Bahasa Jerman (Deutsch)
									</SelectItem>
									<SelectItem value="arab">🇸🇦 Bahasa Arab (العربية)</SelectItem>
									<SelectItem value="korea">
										🇰🇷 Bahasa Korea (한국어)
									</SelectItem>
									<SelectItem value="lainnya">🌐 Bahasa Lainnya...</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Custom Language Name if "lainnya" */}
						{form.language === "lainnya" && (
							<div className="sm:col-span-2 lg:col-span-1">
								<Label className="text-xs font-semibold text-slate-700 block mb-1.5">
									Nama Bahasa Kustom <span className="text-rose-500">*</span>
								</Label>
								<Input
									placeholder="Contoh: Prancis, Spanyol, dll..."
									className="bg-white rounded-xl text-xs sm:text-sm h-10 border-slate-200"
									value={form.languageCustom}
									onChange={(e) =>
										setForm((p) => ({
											...p,
											languageCustom: e.target.value,
										}))
									}
								/>
							</div>
						)}
					</div>

					{/* ─── KOSAKATA INPUT SECTION ─── */}
					<div className="bg-white rounded-2xl border border-blue-200/80 p-4 space-y-3 shadow-2xs">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
							<div className="flex items-center gap-2">
								<span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
									<Tag className="w-3.5 h-3.5" />
								</span>
								<div>
									<h4 className="text-xs font-bold text-slate-800">
										Setoran Kosakata (Vocabulary)
									</h4>
									<p className="text-[11px] text-slate-400">
										Bisa menggunakan tag per kata atau langsung jumlah
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2 self-end sm:self-auto">
								{/* Mode Toggle Button */}
								<div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[11px]">
									<button
										type="button"
										onClick={() => setVocabInputMode("tag")}
										className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
											vocabInputMode === "tag"
												? "bg-white text-blue-700 shadow-2xs font-bold"
												: "text-slate-600 hover:text-slate-900"
										}`}
									>
										Rincian Tag
									</button>
									<button
										type="button"
										onClick={() => setVocabInputMode("number")}
										className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
											vocabInputMode === "number"
												? "bg-white text-blue-700 shadow-2xs font-bold"
												: "text-slate-600 hover:text-slate-900"
										}`}
									>
										Input Cepat (Jumlah)
									</button>
								</div>

								{/* Batch Paste Button */}
								{vocabInputMode === "tag" && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setIsBatchPasteOpen(true)}
										className="h-7 px-2.5 text-[11px] font-semibold text-blue-700 border-blue-200 bg-blue-50/60 hover:bg-blue-100 rounded-lg"
									>
										<ClipboardCopy className="w-3 h-3 mr-1" />
										Paste Banyak Kata
									</Button>
								)}
							</div>
						</div>

						{vocabInputMode === "tag" ? (
							<div className="space-y-3">
								<div className="flex gap-2">
									<Input
										placeholder="Ketik kosakata lalu tekan Enter atau koma (contoh: luggage, passport, departure)..."
										value={inputVocab}
										onChange={(e) => setInputVocab(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === ",") {
												e.preventDefault();
												handleAddVocabTag(inputVocab);
											}
										}}
										className="h-10 text-xs sm:text-sm bg-slate-50/60 rounded-xl"
									/>
									<Button
										type="button"
										size="sm"
										onClick={() => handleAddVocabTag(inputVocab)}
										disabled={!inputVocab.trim()}
										className="h-10 px-4 text-xs font-bold bg-[#0517B0] hover:bg-blue-700 text-white rounded-xl shrink-0"
									>
										<Plus className="w-4 h-4 mr-1" />
										Tambah
									</Button>
								</div>

								{/* Vocab Tags Cloud */}
								{(form.vocabList || []).length > 0 ? (
									<div className="space-y-2">
										<div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
											<span>
												Daftar kata terinput (
												<strong className="text-blue-700 font-bold">
													{(form.vocabList || []).length}
												</strong>{" "}
												kata):
											</span>
											<button
												type="button"
												onClick={() =>
													setForm((p) => ({
														...p,
														vocabList: [],
														vocabCount: 0,
													}))
												}
												className="text-rose-600 hover:text-rose-800 font-semibold hover:underline"
											>
												Hapus Semua Tag
											</button>
										</div>
										<div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50/80 rounded-xl border border-slate-200/80">
											{(form.vocabList || []).map((word, idx) => (
												<span
													key={idx}
													className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-blue-800 border border-blue-200 shadow-2xs"
												>
													<span>{word}</span>
													<button
														type="button"
														onClick={() => handleRemoveVocabTag(idx)}
														className="text-blue-400 hover:text-rose-600 rounded p-0.5 hover:bg-rose-50 transition-colors"
													>
														<X className="w-3 h-3" />
													</button>
												</span>
											))}
										</div>
									</div>
								) : (
									<p className="text-xs text-slate-400 italic py-1">
										Belum ada tag kata. Ketik kata di atas atau gunakan tombol
										"Paste Banyak Kata".
									</p>
								)}
							</div>
						) : (
							<div className="space-y-2">
								<Label className="text-xs font-medium text-slate-600 block">
									Total Jumlah Kata yang Dihafal:
								</Label>
								<div className="flex items-center gap-3">
									<Input
										type="number"
										min={0}
										placeholder="Contoh: 25"
										value={form.vocabCount || ""}
										onChange={(e) =>
											setForm((p) => ({
												...p,
												vocabCount: Number(e.target.value) || 0,
											}))
										}
										className="max-w-[200px] h-10 text-sm font-bold bg-slate-50/60 rounded-xl"
									/>
									<span className="text-xs text-slate-500 font-medium">
										kosakata berhasil dihafal pada sesi ini
									</span>
								</div>
							</div>
						)}
					</div>

					{/* ─── KALIMAT INPUT SECTION ─── */}
					<div className="bg-white rounded-2xl border border-amber-200/80 p-4 space-y-3 shadow-2xs">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
							<div className="flex items-center gap-2">
								<span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
									<MessageSquare className="w-3.5 h-3.5" />
								</span>
								<div>
									<h4 className="text-xs font-bold text-slate-800">
										Setoran Kalimat (Sentence Practice)
									</h4>
									<p className="text-[11px] text-slate-400">
										Ungkapan percakapan sehari-hari atau konteks magang
									</p>
								</div>
							</div>

							<div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[11px] self-end sm:self-auto">
								<button
									type="button"
									onClick={() => setSentenceInputMode("tag")}
									className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
										sentenceInputMode === "tag"
											? "bg-white text-amber-700 shadow-2xs font-bold"
											: "text-slate-600 hover:text-slate-900"
									}`}
								>
									Rincian Kalimat
								</button>
								<button
									type="button"
									onClick={() => setSentenceInputMode("number")}
									className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
										sentenceInputMode === "number"
											? "bg-white text-amber-700 shadow-2xs font-bold"
											: "text-slate-600 hover:text-slate-900"
									}`}
								>
									Input Cepat (Jumlah)
								</button>
							</div>
						</div>

						{sentenceInputMode === "tag" ? (
							<div className="space-y-3">
								<div className="flex gap-2">
									<Input
										placeholder="Ketik kalimat lengkap lalu tekan Enter (contoh: Where can I submit my report?)..."
										value={inputSentence}
										onChange={(e) => setInputSentence(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddSentenceTag(inputSentence);
											}
										}}
										className="h-10 text-xs sm:text-sm bg-slate-50/60 rounded-xl"
									/>
									<Button
										type="button"
										size="sm"
										onClick={() => handleAddSentenceTag(inputSentence)}
										disabled={!inputSentence.trim()}
										className="h-10 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shrink-0"
									>
										<Plus className="w-4 h-4 mr-1" />
										Tambah
									</Button>
								</div>

								{/* Sentences List */}
								{(form.sentenceList || []).length > 0 ? (
									<div className="space-y-2">
										<div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
											<span>
												Daftar kalimat (
												<strong className="text-amber-700 font-bold">
													{(form.sentenceList || []).length}
												</strong>{" "}
												kalimat):
											</span>
											<button
												type="button"
												onClick={() =>
													setForm((p) => ({
														...p,
														sentenceList: [],
														sentenceCount: 0,
													}))
												}
												className="text-rose-600 hover:text-rose-800 font-semibold hover:underline"
											>
												Hapus Semua Kalimat
											</button>
										</div>
										<div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50/80 rounded-xl border border-slate-200/80">
											{(form.sentenceList || []).map((sentence, idx) => (
												<div
													key={idx}
													className="flex items-start justify-between gap-2 p-2 rounded-lg text-xs bg-white text-slate-800 border border-amber-200/80 shadow-2xs"
												>
													<div className="flex items-start gap-2">
														<span className="font-bold text-amber-700 text-[11px] shrink-0 mt-0.5">
															#{idx + 1}
														</span>
														<span className="font-medium leading-relaxed">
															{sentence}
														</span>
													</div>
													<button
														type="button"
														onClick={() => handleRemoveSentenceTag(idx)}
														className="text-slate-400 hover:text-rose-600 rounded p-1 hover:bg-rose-50 transition-colors shrink-0"
													>
														<X className="w-3.5 h-3.5" />
													</button>
												</div>
											))}
										</div>
									</div>
								) : (
									<p className="text-xs text-slate-400 italic py-1">
										Belum ada kalimat yang dicatat. Ketik kalimat di atas.
									</p>
								)}
							</div>
						) : (
							<div className="space-y-2">
								<Label className="text-xs font-medium text-slate-600 block">
									Total Jumlah Kalimat:
								</Label>
								<div className="flex items-center gap-3">
									<Input
										type="number"
										min={0}
										placeholder="Contoh: 5"
										value={form.sentenceCount || ""}
										onChange={(e) =>
											setForm((p) => ({
												...p,
												sentenceCount: Number(e.target.value) || 0,
											}))
										}
										className="max-w-[200px] h-10 text-sm font-bold bg-slate-50/60 rounded-xl"
									/>
									<span className="text-xs text-slate-500 font-medium">
										kalimat dipraktikkan
									</span>
								</div>
							</div>
						)}
					</div>

					{/* ─── EVALUATION NOTES SECTION ─── */}
					<div className="space-y-2 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
						<Label className="text-xs font-semibold text-slate-700 block">
							Catatan Evaluasi / Kelancaran (Opsional)
						</Label>

						{/* Quick Tag Pills */}
						<div className="flex flex-wrap items-center gap-1.5 pb-1">
							<span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
								Tag Cepat:
							</span>
							{QUICK_EVALUATION_TAGS.map((evalTag) => (
								<button
									key={evalTag}
									type="button"
									onClick={() => handleAppendNoteTag(evalTag)}
									className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 transition-colors"
								>
									+ {evalTag}
								</button>
							))}
						</div>

						<Textarea
							placeholder="Catatan tambahan seputar pelafalan, kelancaran, intonasi, rekomendasi pertemuan selanjutnya..."
							value={form.notes || ""}
							onChange={(e) =>
								setForm((p) => ({ ...p, notes: e.target.value }))
							}
							className="bg-slate-50/60 rounded-xl text-xs sm:text-sm min-h-[70px] resize-none border-slate-200"
						/>
					</div>

					{/* ─── SAVE / CANCEL BUTTONS ─── */}
					<div className="flex items-center justify-end gap-2.5 pt-2 border-t border-blue-200/60">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={cancelEdit}
							className="h-10 px-4 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 border-slate-200"
						>
							Batal
						</Button>

						<Button
							type="button"
							size="sm"
							onClick={handleSubmit}
							disabled={isSaving}
							className="h-10 px-5 text-xs font-bold rounded-xl bg-[#0517B0] hover:bg-blue-700 text-white shadow-xs gap-1.5"
						>
							<CheckCircle2 className="w-4 h-4" />
							<span>{isEditing ? "Perbarui Setoran" : "Simpan Setoran"}</span>
						</Button>
					</div>
				</div>
			)}

			{/* ─── 4. RIWAYAT SETORAN LIST CONTAINER ─── */}
			<div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
				{/* Section Header */}
				<div className="bg-slate-50/90 border-b border-slate-200/80 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
					<div className="flex items-center gap-2.5">
						<span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
							<BookMarked className="w-4 h-4" />
						</span>
						<div>
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Riwayat Setoran Hafalan
							</h3>
							<p className="text-xs text-slate-400">
								Log lengkap pertemuan setor hafalan mahasiswa
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 self-end sm:self-auto">
						<Badge
							variant="outline"
							className="text-xs bg-white text-slate-600 border-slate-200 font-semibold px-2.5 py-1 rounded-lg"
						>
							{filteredSessions.length} dari {hafalanSessions.length} Sesi
						</Badge>
					</div>
				</div>

				{/* ─── A. DESKTOP VIEW (TABLE: md:block) ─── */}
				<div className="hidden md:block overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-slate-50/60 hover:bg-slate-50/60 border-b border-slate-200/80">
								<TableHead className="text-xs font-bold text-slate-600 min-w-[150px]">
									Tanggal & Pencatat
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-600 min-w-[130px]">
									Bahasa
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-600 min-w-[220px]">
									Kosakata Dihafal
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-600 min-w-[240px]">
									Kalimat Dihafal
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-600 min-w-[170px]">
									Catatan Evaluasi
								</TableHead>
								{canEdit && (
									<TableHead className="text-xs font-bold text-slate-600 text-center w-[100px]">
										Aksi
									</TableHead>
								)}
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredSessions.map((session) => {
								const vocabList = Array.isArray(session.vocabList)
									? session.vocabList
									: [];
								const sentenceList = Array.isArray(session.sentenceList)
									? session.sentenceList
									: [];
								const rawDate = session.date || session.createdAt;
								const formattedDate = new Date(rawDate).toLocaleDateString(
									"id-ID",
									{
										day: "numeric",
										month: "short",
										year: "numeric",
									},
								);

								return (
									<TableRow
										key={session.id}
										className="hover:bg-blue-50/30 transition-colors border-b border-slate-100"
									>
										{/* Tanggal & User */}
										<TableCell className="align-top py-3.5">
											<div className="space-y-1">
												<div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
													<Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
													<span>{formattedDate}</span>
												</div>
												{session.createdByUser?.fullName && (
													<p className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-[140px]">
														<User className="w-3 h-3 text-slate-400 shrink-0" />
														<span>{session.createdByUser.fullName}</span>
													</p>
												)}
											</div>
										</TableCell>

										{/* Bahasa Badge */}
										<TableCell className="align-top py-3.5">
											<Badge
												variant="outline"
												className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 w-fit ${getLanguageBadgeClass(
													session.language,
												)}`}
											>
												<span>{getLanguageFlag(session.language)}</span>
												<span>{getLanguageLabel(session)}</span>
											</Badge>
										</TableCell>

										{/* Kosakata */}
										<TableCell className="align-top py-3.5">
											<div className="space-y-1.5">
												<div className="flex items-center gap-1.5">
													<span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-blue-100 text-blue-800">
														+{session.vocabCount}
													</span>
													<span className="text-xs text-slate-500 font-medium">
														kosakata
													</span>
													{vocabList.length > 0 && (
														<button
															type="button"
															onClick={() => handleCopySessionWords(session)}
															className="text-slate-400 hover:text-blue-600 p-0.5 transition-colors cursor-pointer"
															title="Salin semua kata"
														>
															{copiedSessionId === session.id ? (
																<Check className="w-3.5 h-3.5 text-emerald-600" />
															) : (
																<Copy className="w-3.5 h-3.5" />
															)}
														</button>
													)}
												</div>

												{vocabList.length > 0 ? (
													<div className="flex flex-wrap gap-1 max-w-sm">
														{vocabList.slice(0, 4).map((w, wi) => (
															<span
																key={wi}
																className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50/80 text-blue-700 border border-blue-200/80"
															>
																{w}
															</span>
														))}
														{vocabList.length > 4 && (
															<button
																type="button"
																onClick={() => setViewSessionDetail(session)}
																className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer"
															>
																+{vocabList.length - 4} lainnya
															</button>
														)}
													</div>
												) : (
													<span className="text-[11px] text-slate-400 italic">
														Setoran nominal langsung
													</span>
												)}
											</div>
										</TableCell>

										{/* Kalimat */}
										<TableCell className="align-top py-3.5">
											<div className="space-y-1.5">
												<div className="flex items-center gap-1.5">
													<span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900">
														+{session.sentenceCount}
													</span>
													<span className="text-xs text-slate-500 font-medium">
														kalimat
													</span>
												</div>

												{sentenceList.length > 0 ? (
													<div className="space-y-1 max-w-md">
														{sentenceList.slice(0, 2).map((st, si) => (
															<div
																key={si}
																className="text-[11px] font-medium bg-amber-50/70 text-amber-950 border border-amber-200/80 rounded-lg px-2 py-1 line-clamp-1 flex items-start gap-1.5"
																title={st}
															>
																<span className="font-bold text-amber-700 shrink-0">
																	#{si + 1}
																</span>
																<span className="truncate">{st}</span>
															</div>
														))}
														{sentenceList.length > 2 && (
															<button
																type="button"
																onClick={() => setViewSessionDetail(session)}
																className="text-[11px] font-bold text-[#0517B0] hover:underline block pt-0.5 cursor-pointer"
															>
																+{sentenceList.length - 2} kalimat lainnya...
															</button>
														)}
													</div>
												) : (
													<span className="text-[11px] text-slate-400 italic">
														-
													</span>
												)}
											</div>
										</TableCell>

										{/* Catatan Evaluasi */}
										<TableCell className="align-top py-3.5">
											{session.notes ? (
												<div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 max-w-xs text-xs text-slate-700 leading-relaxed font-normal flex items-start gap-1.5">
													<Quote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
													<span>{session.notes}</span>
												</div>
											) : (
												<span className="text-xs text-slate-300 italic">-</span>
											)}
										</TableCell>

										{/* Action Tools */}
										{canEdit && (
											<TableCell className="align-top py-3.5 text-center">
												<div className="flex items-center justify-center gap-1">
													<button
														type="button"
														onClick={() => setViewSessionDetail(session)}
														className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
														title="Lihat Rincian Lengkap"
													>
														<Eye className="w-4 h-4" />
													</button>
													<button
														type="button"
														onClick={() => startEdit(session)}
														className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
														title="Edit Setoran Ini"
													>
														<Edit2 className="w-4 h-4" />
													</button>
													<button
														type="button"
														onClick={() => setDeleteId(session.id)}
														className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
														title="Hapus Setoran Ini"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</TableCell>
										)}
									</TableRow>
								);
							})}

							{filteredSessions.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={canEdit ? 6 : 5}
										className="text-center py-12 text-slate-400"
									>
										<div className="flex flex-col items-center justify-center gap-2 max-w-xs mx-auto">
											<span className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
												<BookOpen className="w-6 h-6" />
											</span>
											<p className="text-sm font-semibold text-slate-700">
												Tidak Ada Data Setoran
											</p>
											<p className="text-xs text-slate-400 text-center">
												{searchQuery || selectedLanguage !== "all"
													? "Tidak ditemukan data yang sesuai dengan filter atau kata kunci Anda."
													: "Mahasiswa ini belum memiliki riwayat setoran hafalan kosakata atau kalimat."}
											</p>
											{canEdit &&
												!searchQuery &&
												selectedLanguage === "all" && (
													<div className="flex items-center gap-2 mt-2">
														<Button
															size="sm"
															onClick={() => setIsQuickTotalModalOpen(true)}
															className="text-xs bg-blue-600 hover:bg-[#0517B0] text-white rounded-xl"
														>
															<PlusCircle className="w-3.5 h-3.5 mr-1" />
															Input Total Hafalan
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() => setIsFormOpen(true)}
															className="text-xs rounded-xl"
														>
															<Plus className="w-3.5 h-3.5 mr-1" />
															Catat Rincian Tag
														</Button>
													</div>
												)}
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{/* ─── B. MOBILE VIEW (RESPONSIVE CARDS FEED: block md:hidden) ─── */}
				<div className="block md:hidden divide-y divide-slate-100">
					{filteredSessions.map((session) => {
						const vocabList = Array.isArray(session.vocabList)
							? session.vocabList
							: [];
						const sentenceList = Array.isArray(session.sentenceList)
							? session.sentenceList
							: [];
						const rawDate = session.date || session.createdAt;
						const formattedDate = new Date(rawDate).toLocaleDateString(
							"id-ID",
							{
								weekday: "short",
								day: "numeric",
								month: "short",
								year: "numeric",
							},
						);

						return (
							<div
								key={session.id}
								className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition-colors"
							>
								{/* Top Row: Date & Language Badge */}
								<div className="flex items-center justify-between gap-2">
									<Badge
										variant="outline"
										className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${getLanguageBadgeClass(
											session.language,
										)}`}
									>
										<span>{getLanguageFlag(session.language)}</span>
										<span>{getLanguageLabel(session)}</span>
									</Badge>

									<span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
										<Calendar className="w-3 h-3 text-slate-400" />
										{formattedDate}
									</span>
								</div>

								{/* Stat Badges Row */}
								<div className="flex items-center gap-2">
									<div className="flex-1 bg-blue-50/80 border border-blue-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
										<span className="text-[11px] font-semibold text-blue-700">
											Kosakata
										</span>
										<span className="text-sm font-extrabold text-blue-900">
											+{session.vocabCount}
										</span>
									</div>
									<div className="flex-1 bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
										<span className="text-[11px] font-semibold text-amber-800">
											Kalimat
										</span>
										<span className="text-sm font-extrabold text-amber-950">
											+{session.sentenceCount}
										</span>
									</div>
								</div>

								{/* Words preview */}
								{vocabList.length > 0 && (
									<div className="space-y-1">
										<span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
											Kata Disetor:
										</span>
										<div className="flex flex-wrap gap-1">
											{vocabList.slice(0, 5).map((w, i) => (
												<span
													key={i}
													className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
												>
													{w}
												</span>
											))}
											{vocabList.length > 5 && (
												<button
													type="button"
													onClick={() => setViewSessionDetail(session)}
													className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 cursor-pointer"
												>
													+{vocabList.length - 5} lainnya
												</button>
											)}
										</div>
									</div>
								)}

								{/* Sentence preview */}
								{sentenceList.length > 0 && (
									<div className="space-y-1">
										<span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
											Contoh Kalimat:
										</span>
										<div className="text-xs p-2 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-950 font-medium leading-relaxed">
											"{sentenceList[0]}"
											{sentenceList.length > 1 && (
												<span className="block text-[10px] text-amber-700 font-bold mt-1">
													+{sentenceList.length - 1} kalimat lainnya...
												</span>
											)}
										</div>
									</div>
								)}

								{/* Evaluation Notes */}
								{session.notes && (
									<div className="text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2">
										<Quote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
										<span className="leading-relaxed">{session.notes}</span>
									</div>
								)}

								{/* Recorded By User */}
								{session.createdByUser?.fullName && (
									<p className="text-[11px] text-slate-400 flex items-center gap-1">
										<User className="w-3 h-3 text-slate-400" />
										Pencatat: {session.createdByUser.fullName}
									</p>
								)}

								{/* Mobile Action Footer */}
								<div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setViewSessionDetail(session)}
										className="h-8 text-xs font-semibold rounded-lg text-slate-700 flex-1 border-slate-200"
									>
										<Eye className="w-3.5 h-3.5 mr-1 text-[#0517B0]" />
										Rincian
									</Button>

									{canEdit && (
										<>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => startEdit(session)}
												className="h-8 text-xs font-semibold rounded-lg text-blue-700 border-blue-200 hover:bg-blue-50 px-3"
											>
												<Edit2 className="w-3.5 h-3.5 mr-1" />
												Edit
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => setDeleteId(session.id)}
												className="h-8 text-xs font-semibold rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 px-3"
											>
												<Trash2 className="w-3.5 h-3.5 mr-1" />
												Hapus
											</Button>
										</>
									)}
								</div>
							</div>
						);
					})}

					{filteredSessions.length === 0 && (
						<div className="py-10 px-4 text-center space-y-2">
							<span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
								<BookOpen className="w-5 h-5" />
							</span>
							<p className="text-sm font-semibold text-slate-700">
								Tidak Ada Data Sesi
							</p>
							<p className="text-xs text-slate-400">
								Belum ada catatan setoran hafalan yang cocok.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* ─── 5. FULL DETAIL DIALOG (`viewSessionDetail`) ─── */}
			{viewSessionDetail && (
				<Dialog
					open={!!viewSessionDetail}
					onOpenChange={(open) => !open && setViewSessionDetail(null)}
				>
					<DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] max-h-[90dvh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl">
						{/* Dialog Header */}
						<div className="p-5 border-b border-slate-100 bg-slate-50/80">
							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getLanguageBadgeClass(
											viewSessionDetail.language,
										)}`}
									>
										<span>{getLanguageFlag(viewSessionDetail.language)}</span>
										<span>{getLanguageLabel(viewSessionDetail)}</span>
									</Badge>
									<span className="text-xs text-slate-500 font-medium">
										Sesi #{viewSessionDetail.id}
									</span>
								</div>

								<span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
									<Calendar className="w-3.5 h-3.5 text-slate-400" />
									{new Date(
										viewSessionDetail.date || viewSessionDetail.createdAt,
									).toLocaleDateString("id-ID", {
										weekday: "long",
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
								</span>
							</div>

							<DialogTitle className="text-base font-bold text-slate-900 mt-2">
								Rincian Setoran Hafalan Siswa
							</DialogTitle>
							<DialogDescription className="text-xs text-slate-500">
								{viewSessionDetail.createdByUser?.fullName
									? `Dicatat oleh PA: ${viewSessionDetail.createdByUser.fullName}`
									: "Log sesi pendampingan akademik"}
							</DialogDescription>
						</div>

						{/* Scrollable Content Body */}
						<div className="p-5 overflow-y-auto space-y-4 flex-1">
							{/* Summary metrics pills */}
							<div className="grid grid-cols-2 gap-3">
								<div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center justify-between">
									<span className="text-xs font-semibold text-blue-800">
										Kosakata Dihafal
									</span>
									<span className="text-base font-extrabold text-blue-900">
										+{viewSessionDetail.vocabCount} kata
									</span>
								</div>
								<div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between">
									<span className="text-xs font-semibold text-amber-900">
										Kalimat Dipraktikkan
									</span>
									<span className="text-base font-extrabold text-amber-950">
										+{viewSessionDetail.sentenceCount} kalimat
									</span>
								</div>
							</div>

							{/* Kosakata Tag Cloud */}
							<div className="space-y-2 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
								<div className="flex items-center justify-between gap-2">
									<Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<Tag className="w-3.5 h-3.5 text-blue-600" />
										Daftar Lengkap Kosakata (
										{Array.isArray(viewSessionDetail.vocabList)
											? viewSessionDetail.vocabList.length
											: 0}
										)
									</Label>

									{Array.isArray(viewSessionDetail.vocabList) &&
										viewSessionDetail.vocabList.length > 0 && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() =>
													handleCopySessionWords(viewSessionDetail)
												}
												className="h-7 px-2 text-xs text-blue-700 hover:text-blue-900"
											>
												<Copy className="w-3 h-3 mr-1" />
												Salin Semua Kata
											</Button>
										)}
								</div>

								{/* Internal Search inside detail */}
								{Array.isArray(viewSessionDetail.vocabList) &&
									viewSessionDetail.vocabList.length > 10 && (
										<Input
											placeholder="Cari kata dalam sesi ini..."
											value={detailSearchQuery}
											onChange={(e) => setDetailSearchQuery(e.target.value)}
											className="h-8 text-xs bg-white rounded-lg mb-2"
										/>
									)}

								{Array.isArray(viewSessionDetail.vocabList) &&
								viewSessionDetail.vocabList.length > 0 ? (
									<div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
										{viewSessionDetail.vocabList
											.filter((w) =>
												detailSearchQuery
													? String(w)
															.toLowerCase()
															.includes(detailSearchQuery.toLowerCase())
													: true,
											)
											.map((word, wi) => (
												<span
													key={wi}
													className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-blue-800 border border-blue-200/90 shadow-2xs"
												>
													{word}
												</span>
											))}
									</div>
								) : (
									<p className="text-xs text-slate-400 italic">
										Sesi ini dicatat sebagai nominal langsung (
										{viewSessionDetail.vocabCount} kata) tanpa tag rincian kata
										per kata.
									</p>
								)}
							</div>

							{/* Kalimat List */}
							<div className="space-y-2 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
								<Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
									<MessageSquare className="w-3.5 h-3.5 text-amber-600" />
									Daftar Lengkap Kalimat (
									{Array.isArray(viewSessionDetail.sentenceList)
										? viewSessionDetail.sentenceList.length
										: 0}
									)
								</Label>

								{Array.isArray(viewSessionDetail.sentenceList) &&
								viewSessionDetail.sentenceList.length > 0 ? (
									<div className="flex flex-col gap-2 max-h-48 overflow-y-auto p-1">
										{viewSessionDetail.sentenceList.map((st, si) => (
											<div
												key={si}
												className="p-2.5 rounded-xl bg-white text-xs text-slate-800 border border-amber-200/80 shadow-2xs flex items-start justify-between gap-2"
											>
												<div className="flex items-start gap-2">
													<span className="font-bold text-amber-700 text-xs shrink-0">
														#{si + 1}
													</span>
													<span className="leading-relaxed font-medium">
														{st}
													</span>
												</div>
												<button
													type="button"
													onClick={() => {
														navigator.clipboard.writeText(st);
														toast.success("Kalimat disalin!");
													}}
													className="text-slate-400 hover:text-amber-700 p-0.5 shrink-0 cursor-pointer"
													title="Salin kalimat ini"
												>
													<Copy className="w-3.5 h-3.5" />
												</button>
											</div>
										))}
									</div>
								) : (
									<p className="text-xs text-slate-400 italic">
										Tidak ada rincian kalimat yang dicatat pada sesi ini.
									</p>
								)}
							</div>

							{/* Evaluator Notes */}
							{viewSessionDetail.notes && (
								<div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
									<Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
										<Quote className="w-3.5 h-3.5 text-slate-400" />
										Catatan Evaluasi PA
									</Label>
									<p className="text-xs text-slate-800 leading-relaxed font-normal pt-1">
										{viewSessionDetail.notes}
									</p>
								</div>
							)}
						</div>

						{/* Dialog Footer */}
						<div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
							{canEdit ? (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										startEdit(viewSessionDetail);
										setViewSessionDetail(null);
									}}
									className="text-xs font-semibold text-blue-700 border-blue-200"
								>
									<Edit2 className="w-3.5 h-3.5 mr-1" />
									Edit Sesi Ini
								</Button>
							) : (
								<div />
							)}

							<Button
								type="button"
								size="sm"
								onClick={() => setViewSessionDetail(null)}
								className="text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-4"
							>
								Tutup
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}

			{/* ─── 6. DEDICATED QUICK MODAL: INPUT TOTAL JUMLAH HAFALAN (INTEGRASI CRM) ─── */}
			<Dialog
				open={isQuickTotalModalOpen}
				onOpenChange={setIsQuickTotalModalOpen}
			>
				<DialogContent className="w-[95vw] sm:max-w-lg max-h-[85vh] max-h-[85dvh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:bg-white/20 [&_[data-slot=dialog-close]]:top-3.5 [&_[data-slot=dialog-close]]:right-3.5">
					{/* Modal Header */}
					<div className="shrink-0 bg-gradient-to-r from-blue-700 to-[#0517B0] text-white p-4 sm:p-5 relative">
						<div className="flex items-center gap-2 pr-6">
							<span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white backdrop-blur-xs shrink-0">
								<Zap className="w-4 h-4" />
							</span>
							<DialogTitle className="text-base font-bold text-white">
								Input Total Jumlah Hafalan
							</DialogTitle>
						</div>
						<DialogDescription className="text-xs text-blue-100/90 leading-relaxed mt-1">
							Catat jumlah setoran hafalan kosakata mahasiswa. Data otomatis
							terekam ke log PA dan tersinkronisasi ke checklist Buku Hafalan di
							Panel CRM.
						</DialogDescription>
					</div>

					{/* Scrollable Content Body */}
					<div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5">
						{/* Mode Toggle: Tambah vs Setel Akumulasi */}
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700 block">
								Pilih Jenis Pencatatan:
							</Label>
							<div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
								<button
									type="button"
									onClick={() => setQuickTotalMode("add")}
									className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
										quickTotalMode === "add"
											? "bg-white text-blue-700 shadow-xs"
											: "text-slate-600 hover:text-slate-900"
									}`}
								>
									<span>+ Tambah Setoran Baru</span>
									<span className="text-[10px] font-normal text-slate-400">
										Setoran sesi hari ini
									</span>
								</button>
								<button
									type="button"
									onClick={() => setQuickTotalMode("set")}
									className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
										quickTotalMode === "set"
											? "bg-white text-blue-700 shadow-xs"
											: "text-slate-600 hover:text-slate-900"
									}`}
								>
									<span>Setel Total Akhir</span>
									<span className="text-[10px] font-normal text-slate-400">
										Rekap total akumulasi
									</span>
								</button>
							</div>
						</div>

						{/* Bahasa & Tanggal */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div>
								<Label className="text-xs font-semibold text-slate-700 block mb-1">
									Bahasa Asing <span className="text-rose-500">*</span>
								</Label>
								<Select
									value={quickTotalForm.language}
									onValueChange={(val) =>
										setQuickTotalForm((p) => ({
											...p,
											language: val || "inggris",
											languageCustom: val === "lainnya" ? p.languageCustom : "",
										}))
									}
								>
									<SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/60 border-slate-200">
										<SelectValue placeholder="Pilih Bahasa" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="inggris">🇬🇧 Bahasa Inggris</SelectItem>
										<SelectItem value="mandarin">🇨🇳 Bahasa Mandarin</SelectItem>
										<SelectItem value="jepang">🇯🇵 Bahasa Jepang</SelectItem>
										<SelectItem value="jerman">🇩🇪 Bahasa Jerman</SelectItem>
										<SelectItem value="arab">🇸🇦 Bahasa Arab</SelectItem>
										<SelectItem value="korea">🇰🇷 Bahasa Korea</SelectItem>
										<SelectItem value="lainnya">🌐 Lainnya...</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label className="text-xs font-semibold text-slate-700 block mb-1">
									Tanggal Setoran <span className="text-rose-500">*</span>
								</Label>
								<Input
									type="date"
									value={quickTotalForm.date}
									onChange={(e) =>
										setQuickTotalForm((p) => ({ ...p, date: e.target.value }))
									}
									className="h-9 text-xs rounded-xl bg-slate-50/60 border-slate-200"
								/>
							</div>

							{quickTotalForm.language === "lainnya" && (
								<div className="sm:col-span-2">
									<Label className="text-xs font-semibold text-slate-700 block mb-1">
										Nama Bahasa Kustom <span className="text-rose-500">*</span>
									</Label>
									<Input
										placeholder="Contoh: Prancis, Spanyol..."
										value={quickTotalForm.languageCustom}
										onChange={(e) =>
											setQuickTotalForm((p) => ({
												...p,
												languageCustom: e.target.value,
											}))
										}
										className="h-9 text-xs rounded-xl bg-white border-slate-200"
									/>
								</div>
							)}
						</div>

						{/* Main Vocab Count Input */}
						<div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
							<div className="flex items-center justify-between">
								<Label className="text-xs font-bold text-blue-950">
									{quickTotalMode === "add"
										? "Jumlah Kosakata yang Disetor (Kata):"
										: `Setel Target Total Akumulasi (Total saat ini: ${totalVocab} kata):`}
								</Label>
								<span className="text-xs font-extrabold text-[#0517B0]">
									{quickTotalMode === "add"
										? `+${quickTotalForm.vocabCount || 0} kata`
										: `Menjadi ${quickTotalForm.vocabCount || 0} kata`}
								</span>
							</div>

							<div className="flex items-center gap-2">
								<Input
									type="number"
									min={1}
									step={5}
									value={quickTotalForm.vocabCount || ""}
									onChange={(e) =>
										setQuickTotalForm((p) => ({
											...p,
											vocabCount: Number(e.target.value) || 0,
										}))
									}
									className="h-10 text-base font-extrabold text-blue-900 bg-white rounded-xl border-blue-300"
								/>
								<span className="text-xs text-slate-500 font-bold shrink-0">
									Kata
								</span>
							</div>

							{/* Quick increment buttons */}
							<div className="flex flex-wrap items-center gap-1.5 pt-1">
								<span className="text-[10px] text-slate-400 font-bold">
									Preset Cepat:
								</span>
								{[25, 50, 100, 200, 500].map((preset) => (
									<button
										key={preset}
										type="button"
										onClick={() =>
											setQuickTotalForm((p) => ({
												...p,
												vocabCount:
													quickTotalMode === "add"
														? preset
														: totalVocab + preset,
											}))
										}
										className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
									>
										+{preset}
									</button>
								))}
							</div>
						</div>

						{/* Jumlah Kalimat (Opsional) */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div>
								<Label className="text-xs font-medium text-slate-700 block mb-1">
									Jumlah Kalimat Dipraktikkan (Opsional)
								</Label>
								<Input
									type="number"
									min={0}
									placeholder="Contoh: 5"
									value={quickTotalForm.sentenceCount || ""}
									onChange={(e) =>
										setQuickTotalForm((p) => ({
											...p,
											sentenceCount: Number(e.target.value) || 0,
										}))
									}
									className="h-9 text-xs rounded-xl bg-slate-50/60 border-slate-200"
								/>
							</div>

							<div>
								<Label className="text-xs font-medium text-slate-700 block mb-1">
									Catatan Tambahan (Opsional)
								</Label>
								<Input
									placeholder="Contoh: Lancar, setor bab 1-3..."
									value={quickTotalForm.notes}
									onChange={(e) =>
										setQuickTotalForm((p) => ({ ...p, notes: e.target.value }))
									}
									className="h-9 text-xs rounded-xl bg-slate-50/60 border-slate-200"
								/>
							</div>
						</div>

						{/* CRM Live Sync Preview Card */}
						<div className="p-3 rounded-xl border border-slate-200/90 bg-slate-50 space-y-1.5">
							<div className="flex items-center justify-between text-xs">
								<span className="font-semibold text-slate-600 flex items-center gap-1.5">
									<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
									Proyeksi Status ke Panel CRM:
								</span>
								<Badge
									variant="outline"
									className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
										projectedQuickTotal >= targetVocab
											? "bg-emerald-50 text-emerald-700 border-emerald-300"
											: "bg-blue-50 text-blue-700 border-blue-300"
									}`}
								>
									{projectedQuickTotal >= targetVocab
										? "✓ Target Terpenuhi (ACC CRM)"
										: `${projectedPercentage}% Menuju Target`}
								</Badge>
							</div>

							<div className="text-xs text-slate-600 space-y-1">
								<div className="flex justify-between text-[11px]">
									<span>Total Setelah Input:</span>
									<span className="font-bold text-slate-900">
										{projectedQuickTotal} / {targetVocab} kata
									</span>
								</div>
								<Progress
									value={projectedPercentage}
									className="h-1.5 bg-slate-200"
									indicatorClassName={
										projectedQuickTotal >= targetVocab
											? "bg-emerald-500"
											: "bg-[#0517B0]"
									}
								/>
								<p className="text-[10px] text-slate-400 pt-0.5 leading-tight">
									{projectedQuickTotal >= targetVocab
										? "🎉 Total kosakata mahasiswa mencapai target kelulusan magang. Checklist Buku Hafalan di Panel CRM akan otomatis ditandai selesai."
										: `Masih membutuhkan ${targetVocab - projectedQuickTotal} kosakata lagi untuk menyelesaikan syarat kelulusan hafalan CRM.`}
								</p>
							</div>
						</div>
					</div>

					{/* Fixed Pinned Footer (Always visible, never cut off) */}
					<DialogFooter className="shrink-0 p-3 sm:p-4 border-t border-slate-100 bg-slate-50/90 flex flex-row items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setIsQuickTotalModalOpen(false)}
							className="text-xs rounded-xl h-9 px-4"
						>
							Batal
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={handleQuickTotalSubmit}
							disabled={isSaving || Number(quickTotalForm.vocabCount) <= 0}
							className="text-xs font-bold bg-[#0517B0] hover:bg-blue-700 text-white rounded-xl h-9 px-3 sm:px-4 gap-1.5 shadow-xs shrink-0"
						>
							<CheckCircle2 className="w-4 h-4 shrink-0" />
							<span className="hidden sm:inline">
								Simpan & Sinkronkan ke CRM
							</span>
							<span className="sm:hidden">Simpan & Sync CRM</span>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ─── 7. BATCH PASTE MODAL ─── */}
			<Dialog open={isBatchPasteOpen} onOpenChange={setIsBatchPasteOpen}>
				<DialogContent className="w-[95vw] sm:max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-base font-bold flex items-center gap-2">
							<ClipboardCopy className="w-4 h-4 text-[#0517B0]" />
							Paste Banyak Kosakata Sekaligus
						</DialogTitle>
						<DialogDescription className="text-xs">
							Paste daftar kosakata dari WhatsApp, Excel, atau catatan. Format
							penomoran (1., 2., -) otomatis dibersihkan.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-2">
						<Textarea
							placeholder={`Contoh:\n1. Apple\n2. Banana\n3. Orange\n- Table\n- Chair`}
							value={batchPasteText}
							onChange={(e) => setBatchPasteText(e.target.value)}
							className="h-44 text-xs font-mono rounded-xl resize-none"
						/>
						<p className="text-[11px] text-slate-400">
							Perkiraan kata terdeteksi:{" "}
							<strong className="text-blue-700 font-bold">
								{
									batchPasteText
										.split(/\r?\n|[,;]+/)
										.map((w) => w.replace(/^[\d+.\-•*)\s]+/, "").trim())
										.filter(Boolean).length
								}
							</strong>{" "}
							kata
						</p>
					</div>

					<DialogFooter className="gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setIsBatchPasteOpen(false)}
							className="text-xs rounded-xl"
						>
							Batal
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={handleApplyBatchPaste}
							disabled={!batchPasteText.trim()}
							className="text-xs font-bold bg-[#0517B0] hover:bg-blue-700 text-white rounded-xl"
						>
							Tambahkan ke Daftar Tag
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ─── 8. EDIT TARGET MODAL ─── */}
			{canEdit && onUpdateTargetVocab && (
				<Dialog open={isTargetModalOpen} onOpenChange={setIsTargetModalOpen}>
					<DialogContent className="w-[95vw] sm:max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="text-base font-bold flex items-center gap-2">
								<Target className="w-4 h-4 text-[#0517B0]" />
								Ubah Target Kosakata Mahasiswa
							</DialogTitle>
							<DialogDescription className="text-xs">
								Tentukan target total kosakata hafalan untuk standar kelulusan
								pendampingan dan integrasi CRM.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 py-2">
							<Label className="text-xs font-semibold text-slate-700 block">
								Target Kosakata (Kata):
							</Label>
							<Input
								type="number"
								min={50}
								step={50}
								value={tempTarget}
								onChange={(e) => setTempTarget(Number(e.target.value) || 0)}
								className="h-10 text-base font-extrabold text-blue-900 rounded-xl"
							/>
							<div className="flex gap-1.5 flex-wrap">
								{[300, 500, 800, 1000].map((preset) => (
									<button
										key={preset}
										type="button"
										onClick={() => setTempTarget(preset)}
										className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
											tempTarget === preset
												? "bg-[#0517B0] text-white border-[#0517B0]"
												: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
										}`}
									>
										{preset} kata
									</button>
								))}
							</div>
						</div>

						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsTargetModalOpen(false)}
								className="text-xs rounded-xl"
							>
								Batal
							</Button>
							<Button
								type="button"
								size="sm"
								onClick={async () => {
									if (tempTarget > 0) {
										await onUpdateTargetVocab(tempTarget);
										setIsTargetModalOpen(false);
									}
								}}
								disabled={tempTarget <= 0 || isSaving}
								className="text-xs font-bold bg-[#0517B0] hover:bg-blue-700 text-white rounded-xl"
							>
								Simpan Target Baru
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* ─── 9. DELETE CONFIRMATION DIALOG ─── */}
			<AlertDialog
				open={deleteId !== null}
				onOpenChange={(open) => !open && setDeleteId(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
						<AlertCircle className="w-5 h-5 text-rose-600" />
						Hapus Sesi Setoran Hafalan?
					</AlertDialogTitle>
					<AlertDialogDescription className="text-xs leading-relaxed text-slate-600">
						Apakah Anda yakin ingin menghapus data sesi setoran hafalan beserta
						seluruh catatan daftar tag kata dan kalimat ini? Data yang terhapus
						tidak dapat dikembalikan.
					</AlertDialogDescription>
					<div className="flex justify-end gap-2.5 mt-4">
						<AlertDialogCancel
							onClick={() => setDeleteId(null)}
							className="text-xs font-semibold rounded-xl"
						>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={async () => {
								if (deleteId) {
									await onDeleteHafalan(deleteId);
									setDeleteId(null);
								}
							}}
							className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
						>
							Ya, Hapus Setoran
						</AlertDialogAction>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
