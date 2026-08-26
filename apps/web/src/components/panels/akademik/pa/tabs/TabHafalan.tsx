"use client";

import {
	BookMarked,
	Edit2,
	Eye,
	HelpCircle,
	Loader2,
	MessageSquare,
	Plus,
	Save,
	Sparkles,
	Tag,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { API_URL, getToken } from "@/lib/eden";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HafalanSession {
	id: number;
	language: string;
	languageCustom: string | null;
	vocabCount: number;
	sentenceCount: number;
	vocabList?: string[];
	sentenceList?: string[];
	notes?: string | null;
	createdAt: string;
	updatedAt: string;
}

interface Props {
	studentId: number;
	canEdit: boolean;
}

interface HafalanForm {
	language: string;
	languageCustom: string;
	vocabCount: number;
	sentenceCount: number;
	vocabList: string[];
	sentenceList: string[];
	notes: string;
	date: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LANGUAGE_LABELS: Record<string, string> = {
	inggris: "Inggris 🇬🇧",
	mandarin: "Mandarin 🇨🇳",
	jepang: "Jepang 🇯🇵",
	jerman: "Jerman 🇩🇪",
	arab: "Arab 🇸🇦",
	korea: "Korea 🇰🇷",
	lainnya: "Lainnya",
};

const LANGUAGE_COLORS: Record<string, string> = {
	inggris: "bg-blue-50 text-blue-700 border-blue-200",
	mandarin: "bg-red-50 text-red-700 border-red-200",
	jepang: "bg-rose-50 text-rose-700 border-rose-200",
	jerman: "bg-amber-50 text-amber-700 border-amber-200",
	arab: "bg-emerald-50 text-emerald-700 border-emerald-200",
	korea: "bg-indigo-50 text-indigo-700 border-indigo-200",
	lainnya: "bg-slate-100 text-slate-600 border-slate-200",
};

function getLanguageLabel(session: HafalanSession): string {
	if (session.language === "lainnya" && session.languageCustom) {
		return session.languageCustom;
	}
	return LANGUAGE_LABELS[session.language] ?? session.language;
}

function getLanguageBadgeClass(language: string): string {
	return LANGUAGE_COLORS[language] ?? LANGUAGE_COLORS.lainnya;
}

// ── Initial Form State ────────────────────────────────────────────────────────

const INITIAL_FORM: HafalanForm = {
	language: "inggris",
	languageCustom: "",
	vocabCount: 0,
	sentenceCount: 0,
	vocabList: [],
	sentenceList: [],
	notes: "",
	date: new Date().toISOString().split("T")[0],
};

// ── Component ─────────────────────────────────────────────────────────────────

export function TabHafalan({ studentId, canEdit }: Props) {
	const [sessions, setSessions] = useState<HafalanSession[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Add form state
	const [showAddForm, setShowAddForm] = useState(false);
	const [addForm, setAddForm] = useState<HafalanForm>(INITIAL_FORM);
	const [inputAddVocab, setInputAddVocab] = useState("");
	const [inputAddSentence, setInputAddSentence] = useState("");
	const [isAdding, setIsAdding] = useState(false);

	// Edit dialog state
	const [editingSession, setEditingSession] = useState<HafalanSession | null>(
		null,
	);
	const [editForm, setEditForm] = useState<HafalanForm>(INITIAL_FORM);
	const [inputEditVocab, setInputEditVocab] = useState("");
	const [inputEditSentence, setInputEditSentence] = useState("");
	const [isSavingEdit, setIsSavingEdit] = useState(false);

	// Delete dialog state
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// View full detail dialog
	const [viewSessionDetail, setViewSessionDetail] =
		useState<HafalanSession | null>(null);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`${API_URL}/students/${studentId}/pa`, {
				headers: { Authorization: `Bearer ${getToken()}` },
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			setSessions(json.data?.hafalanSessions ?? []);
		} catch {
			toast.error("Gagal memuat data hafalan");
		} finally {
			setIsLoading(false);
		}
	}, [studentId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// ── Tag Helpers (Vocab & Sentence) ─────────────────────────────────────────

	const handleAddVocabTags = (text: string, isEdit: boolean) => {
		if (!text.trim()) return;
		// Split by comma or newline if user pasted comma-separated words
		const rawWords = text
			.split(/[,;\n]+/)
			.map((w) => w.trim())
			.filter(Boolean);

		if (rawWords.length === 0) return;

		if (isEdit) {
			setEditForm((prev) => {
				const merged = [...prev.vocabList, ...rawWords];
				return {
					...prev,
					vocabList: merged,
					vocabCount: merged.length,
				};
			});
			setInputEditVocab("");
		} else {
			setAddForm((prev) => {
				const merged = [...prev.vocabList, ...rawWords];
				return {
					...prev,
					vocabList: merged,
					vocabCount: merged.length,
				};
			});
			setInputAddVocab("");
		}
	};

	const handleRemoveVocabTag = (index: number, isEdit: boolean) => {
		if (isEdit) {
			setEditForm((prev) => {
				const nextList = prev.vocabList.filter((_, i) => i !== index);
				return {
					...prev,
					vocabList: nextList,
					vocabCount: nextList.length,
				};
			});
		} else {
			setAddForm((prev) => {
				const nextList = prev.vocabList.filter((_, i) => i !== index);
				return {
					...prev,
					vocabList: nextList,
					vocabCount: nextList.length,
				};
			});
		}
	};

	const handleAddSentenceTag = (text: string, isEdit: boolean) => {
		const clean = text.trim();
		if (!clean) return;

		if (isEdit) {
			setEditForm((prev) => {
				const merged = [...prev.sentenceList, clean];
				return {
					...prev,
					sentenceList: merged,
					sentenceCount: merged.length,
				};
			});
			setInputEditSentence("");
		} else {
			setAddForm((prev) => {
				const merged = [...prev.sentenceList, clean];
				return {
					...prev,
					sentenceList: merged,
					sentenceCount: merged.length,
				};
			});
			setInputAddSentence("");
		}
	};

	const handleRemoveSentenceTag = (index: number, isEdit: boolean) => {
		if (isEdit) {
			setEditForm((prev) => {
				const nextList = prev.sentenceList.filter((_, i) => i !== index);
				return {
					...prev,
					sentenceList: nextList,
					sentenceCount: nextList.length,
				};
			});
		} else {
			setAddForm((prev) => {
				const nextList = prev.sentenceList.filter((_, i) => i !== index);
				return {
					...prev,
					sentenceList: nextList,
					sentenceCount: nextList.length,
				};
			});
		}
	};

	// ── Add Session ────────────────────────────────────────────────────────────

	const handleAdd = async () => {
		if (addForm.language === "lainnya" && !addForm.languageCustom.trim()) {
			toast.error("Nama bahasa tidak boleh kosong");
			return;
		}

		// Also check if there's text currently in the input that hasn't been submitted with Enter
		const pendingVocab = inputAddVocab.trim();
		const finalVocabList = pendingVocab
			? [
					...addForm.vocabList,
					...pendingVocab
						.split(/[,;\n]+/)
						.map((w) => w.trim())
						.filter(Boolean),
				]
			: addForm.vocabList;

		const pendingSentence = inputAddSentence.trim();
		const finalSentenceList = pendingSentence
			? [...addForm.sentenceList, pendingSentence]
			: addForm.sentenceList;

		const finalVocabCount =
			addForm.vocabCount > 0 ? addForm.vocabCount : finalVocabList.length;
		const finalSentenceCount =
			addForm.sentenceCount > 0
				? addForm.sentenceCount
				: finalSentenceList.length;

		if (finalVocabCount === 0 && finalSentenceCount === 0) {
			toast.error("Silakan masukkan setoran kosakata atau kalimat");
			return;
		}

		setIsAdding(true);
		try {
			const res = await fetch(`${API_URL}/students/${studentId}/pa/hafalan`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${getToken()}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					language: addForm.language,
					languageCustom:
						addForm.language === "lainnya"
							? addForm.languageCustom.trim()
							: null,
					vocabCount: finalVocabCount,
					sentenceCount: finalSentenceCount,
					vocabList: finalVocabList,
					sentenceList: finalSentenceList,
					notes: addForm.notes.trim() || null,
					date: addForm.date
						? new Date(addForm.date).toISOString()
						: new Date().toISOString(),
				}),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Setoran hafalan berhasil ditambahkan");
			setShowAddForm(false);
			setAddForm(INITIAL_FORM);
			setInputAddVocab("");
			setInputAddSentence("");
			fetchData();
		} catch {
			toast.error("Gagal menambahkan hafalan");
		} finally {
			setIsAdding(false);
		}
	};

	// ── Edit Session ───────────────────────────────────────────────────────────

	const handleStartEdit = (session: HafalanSession) => {
		setEditingSession(session);
		setEditForm({
			language: session.language,
			languageCustom: session.languageCustom ?? "",
			vocabCount: session.vocabCount,
			sentenceCount: session.sentenceCount,
			vocabList: Array.isArray(session.vocabList) ? [...session.vocabList] : [],
			sentenceList: Array.isArray(session.sentenceList)
				? [...session.sentenceList]
				: [],
			notes: session.notes ?? "",
			date: new Date(session.createdAt).toISOString().split("T")[0],
		});
		setInputEditVocab("");
		setInputEditSentence("");
	};

	const handleSaveEdit = async () => {
		if (!editingSession) return;
		if (editForm.language === "lainnya" && !editForm.languageCustom.trim()) {
			toast.error("Nama bahasa tidak boleh kosong");
			return;
		}

		const pendingVocab = inputEditVocab.trim();
		const finalVocabList = pendingVocab
			? [
					...editForm.vocabList,
					...pendingVocab
						.split(/[,;\n]+/)
						.map((w) => w.trim())
						.filter(Boolean),
				]
			: editForm.vocabList;

		const pendingSentence = inputEditSentence.trim();
		const finalSentenceList = pendingSentence
			? [...editForm.sentenceList, pendingSentence]
			: editForm.sentenceList;

		const finalVocabCount =
			editForm.vocabCount > 0 ? editForm.vocabCount : finalVocabList.length;
		const finalSentenceCount =
			editForm.sentenceCount > 0
				? editForm.sentenceCount
				: finalSentenceList.length;

		setIsSavingEdit(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/hafalan/${editingSession.id}`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						language: editForm.language,
						languageCustom:
							editForm.language === "lainnya"
								? editForm.languageCustom.trim()
								: null,
						vocabCount: finalVocabCount,
						sentenceCount: finalSentenceCount,
						vocabList: finalVocabList,
						sentenceList: finalSentenceList,
						notes: editForm.notes.trim() || null,
						date: editForm.date
							? new Date(editForm.date).toISOString()
							: undefined,
					}),
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Setoran hafalan diperbarui");
			setEditingSession(null);
			fetchData();
		} catch {
			toast.error("Gagal memperbarui hafalan");
		} finally {
			setIsSavingEdit(false);
		}
	};

	// ── Delete Session ─────────────────────────────────────────────────────────

	const handleDelete = async () => {
		if (!pendingDeleteId) return;
		setIsDeleting(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/hafalan/${pendingDeleteId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Hafalan dihapus");
			setShowDeleteDialog(false);
			setPendingDeleteId(null);
			fetchData();
		} catch {
			toast.error("Gagal menghapus hafalan");
		} finally {
			setIsDeleting(false);
		}
	};

	// ── Totals ─────────────────────────────────────────────────────────────────

	const totalVocab = sessions.reduce((acc, s) => acc + s.vocabCount, 0);
	const totalSentence = sessions.reduce((acc, s) => acc + s.sentenceCount, 0);

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<>
			<div className="space-y-5">
				{/* Summary Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden hover:border-slate-300 transition-all">
						<CardContent className="p-4 sm:p-5 flex items-center gap-4">
							<div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center shrink-0 shadow-2xs">
								<BookMarked className="w-5 h-5" />
							</div>
							<div className="space-y-0.5">
								<p className="text-xs text-slate-500 font-medium">
									Total Sesi Setoran
								</p>
								<p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
									{sessions.length}{" "}
									<span className="text-xs font-semibold text-slate-400 font-normal">
										Sesi
									</span>
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden hover:border-slate-300 transition-all">
						<CardContent className="p-4 sm:p-5 flex items-center gap-4">
							<div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
								<Tag className="w-5 h-5" />
							</div>
							<div className="space-y-0.5">
								<p className="text-xs text-slate-500 font-medium">
									Total Kosakata
								</p>
								<p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
									{totalVocab.toLocaleString("id-ID")}{" "}
									<span className="text-xs font-semibold text-slate-400 font-normal">
										Kata
									</span>
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden hover:border-slate-300 transition-all">
						<CardContent className="p-4 sm:p-5 flex items-center gap-4">
							<div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
								<MessageSquare className="w-5 h-5" />
							</div>
							<div className="space-y-0.5">
								<p className="text-xs text-slate-500 font-medium">
									Total Kalimat
								</p>
								<p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
									{totalSentence.toLocaleString("id-ID")}{" "}
									<span className="text-xs font-semibold text-slate-400 font-normal">
										Kalimat
									</span>
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Main Card */}
				<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
					<CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-white">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center shrink-0 shadow-2xs">
									<BookMarked className="w-5 h-5" />
								</div>
								<div>
									<CardTitle className="text-sm sm:text-base font-bold text-slate-800">
										Riwayat Setoran Hafalan
									</CardTitle>
									<p className="text-xs text-slate-500 mt-0.5">
										Pemantauan progres penguasaan bahasa asing mahasiswa
									</p>
								</div>
							</div>
							{canEdit && !showAddForm && (
								<Button
									size="sm"
									onClick={() => setShowAddForm(true)}
									className="h-8 text-xs gap-1.5 text-white bg-[#0517B0] hover:bg-[#0517B0]/90 shadow-2xs font-semibold"
								>
									<Plus className="w-3.5 h-3.5" />
									<span>Tambah Hafalan</span>
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent className="p-5 space-y-4">
						{/* Add Form */}
						{canEdit && showAddForm && (
							<div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5 space-y-4 shadow-xs">
								<div className="flex items-center justify-between border-b border-blue-200/80 pb-2.5">
									<p className="text-sm font-bold text-slate-800 flex items-center gap-2">
										<Sparkles className="w-4 h-4 text-[#0517B0]" />
										Tambah Setoran Hafalan Baru
									</p>
									<Badge
										variant="outline"
										className="bg-white text-[#0517B0] border-blue-200 text-xs font-semibold"
									>
										Tag Mode Aktif
									</Badge>
								</div>

								{/* Top Inputs: Tanggal & Bahasa */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<Label className="text-xs font-medium text-slate-700">
											Tanggal Setoran *
										</Label>
										<Input
											type="date"
											value={
												addForm.date || new Date().toISOString().split("T")[0]
											}
											onChange={(e) =>
												setAddForm((p) => ({
													...p,
													date: e.target.value,
												}))
											}
											className="h-9 text-sm bg-white"
										/>
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs font-medium text-slate-700">
											Bahasa
										</Label>
										<Select
											value={addForm.language}
											onValueChange={(v) =>
												setAddForm((p) => ({
													...p,
													language: v ?? "inggris",
													languageCustom: "",
												}))
											}
										>
											<SelectTrigger className="h-9 text-sm bg-white">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="inggris">🇬🇧 Inggris</SelectItem>
												<SelectItem value="mandarin">🇨🇳 Mandarin</SelectItem>
												<SelectItem value="jepang">🇯🇵 Jepang</SelectItem>
												<SelectItem value="jerman">🇩🇪 Jerman</SelectItem>
												<SelectItem value="arab">🇸🇦 Arab</SelectItem>
												<SelectItem value="korea">🇰🇷 Korea</SelectItem>
												<SelectItem value="lainnya">Lainnya...</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{addForm.language === "lainnya" && (
										<div className="space-y-1.5 sm:col-span-2">
											<Label className="text-xs font-medium text-slate-700">
												Nama Bahasa Lainnya *
											</Label>
											<Input
												placeholder="Contoh: Prancis, Spanyol..."
												value={addForm.languageCustom}
												onChange={(e) =>
													setAddForm((p) => ({
														...p,
														languageCustom: e.target.value,
													}))
												}
												className="h-9 text-sm bg-white"
											/>
										</div>
									)}
								</div>

								{/* Tag Section 1: Kosakata (Per Kata) */}
								<div className="space-y-2 bg-white/90 p-3.5 rounded-xl border border-blue-100 shadow-2xs">
									<div className="flex items-center justify-between">
										<Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
											<Tag className="w-3.5 h-3.5 text-blue-600" />
											Catat Kosakata yang Dihafal (Per Kata)
										</Label>
										<Badge
											variant="secondary"
											className="bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200"
										>
											{addForm.vocabList.length} kata
										</Badge>
									</div>

									{/* Input box */}
									<div className="flex gap-2">
										<Input
											placeholder="Ketik kata lalu tekan Enter atau koma (contoh: apple, spoon, kitchen)..."
											value={inputAddVocab}
											onChange={(e) => setInputAddVocab(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === ",") {
													e.preventDefault();
													handleAddVocabTags(inputAddVocab, false);
												}
											}}
											className="h-9 text-sm bg-white"
										/>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => handleAddVocabTags(inputAddVocab, false)}
											disabled={!inputAddVocab.trim()}
											className="h-9 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shrink-0 font-semibold"
										>
											<Plus className="w-3.5 h-3.5 mr-1" />
											Tambah
										</Button>
									</div>

									{/* Tags chips container */}
									{addForm.vocabList.length > 0 ? (
										<div className="flex flex-wrap gap-1.5 pt-1.5 max-h-36 overflow-y-auto pr-1">
											{addForm.vocabList.map((word, idx) => (
												<span
													key={idx}
													className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/90 shadow-2xs group animate-in fade-in zoom-in-95 duration-150"
												>
													<span>{word}</span>
													<button
														type="button"
														onClick={() => handleRemoveVocabTag(idx, false)}
														className="text-blue-500 hover:text-blue-900 rounded p-0.5 hover:bg-blue-200/50 transition-colors"
														title="Hapus kata"
													>
														<X className="w-3 h-3" />
													</button>
												</span>
											))}
										</div>
									) : (
										<p className="text-[11px] text-slate-400 italic pt-0.5">
											Belum ada kosakata yang dicatat. Ketik kata di atas untuk
											menambahkan tag kata.
										</p>
									)}
								</div>

								{/* Tag Section 2: Kalimat (Per Kalimat) */}
								<div className="space-y-2 bg-white/90 p-3.5 rounded-xl border border-amber-100 shadow-2xs">
									<div className="flex items-center justify-between">
										<Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
											<MessageSquare className="w-3.5 h-3.5 text-amber-600" />
											Catat Kalimat yang Dihafal (Per Kalimat)
										</Label>
										<Badge
											variant="secondary"
											className="bg-amber-50 text-amber-800 font-semibold text-xs border border-amber-200"
										>
											{addForm.sentenceList.length} kalimat
										</Badge>
									</div>

									{/* Input box */}
									<div className="flex gap-2">
										<Input
											placeholder="Ketik kalimat lengkap lalu tekan Enter (contoh: I would like to order a glass of water)..."
											value={inputAddSentence}
											onChange={(e) => setInputAddSentence(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddSentenceTag(inputAddSentence, false);
												}
											}}
											className="h-9 text-sm bg-white"
										/>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												handleAddSentenceTag(inputAddSentence, false)
											}
											disabled={!inputAddSentence.trim()}
											className="h-9 px-3 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 shrink-0 font-semibold"
										>
											<Plus className="w-3.5 h-3.5 mr-1" />
											Tambah
										</Button>
									</div>

									{/* Tags chips container */}
									{addForm.sentenceList.length > 0 ? (
										<div className="flex flex-col gap-1.5 pt-1.5 max-h-40 overflow-y-auto pr-1">
											{addForm.sentenceList.map((sentence, idx) => (
												<div
													key={idx}
													className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs bg-amber-50/90 text-amber-950 border border-amber-200 shadow-2xs animate-in fade-in zoom-in-95 duration-150"
												>
													<div className="flex items-start gap-2">
														<span className="font-bold text-amber-700 shrink-0">
															#{idx + 1}
														</span>
														<span className="font-medium">{sentence}</span>
													</div>
													<button
														type="button"
														onClick={() => handleRemoveSentenceTag(idx, false)}
														className="text-amber-600 hover:text-amber-950 rounded p-0.5 hover:bg-amber-200/50 transition-colors shrink-0"
														title="Hapus kalimat"
													>
														<X className="w-3.5 h-3.5" />
													</button>
												</div>
											))}
										</div>
									) : (
										<p className="text-[11px] text-slate-400 italic pt-0.5">
											Belum ada kalimat yang dicatat. Ketik kalimat di atas
											untuk menambahkan tag kalimat.
										</p>
									)}
								</div>

								{/* Section 3: Catatan Tambahan (Opsional) */}
								<div className="space-y-1.5">
									<Label className="text-xs font-medium text-slate-700">
										Catatan Evaluasi / Keterangan (Opsional)
									</Label>
									<Input
										placeholder="Catatan tambahan seputar kelancaran pengucapan atau intonasi..."
										value={addForm.notes}
										onChange={(e) =>
											setAddForm((p) => ({ ...p, notes: e.target.value }))
										}
										className="h-9 text-sm bg-white"
									/>
								</div>

								{/* Action Buttons */}
								<div className="flex justify-end gap-2 pt-2 border-t border-blue-200/60">
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											setShowAddForm(false);
											setAddForm(INITIAL_FORM);
											setInputAddVocab("");
											setInputAddSentence("");
										}}
										className="h-8 text-xs gap-1"
									>
										<X className="w-3.5 h-3.5" />
										Batal
									</Button>
									<Button
										size="sm"
										onClick={handleAdd}
										disabled={isAdding}
										className="h-8 text-xs gap-1.5 text-white"
										style={{ backgroundColor: "#0517B0" }}
									>
										{isAdding ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										) : (
											<Save className="w-3.5 h-3.5" />
										)}
										Simpan
									</Button>
								</div>
							</div>
						)}

						{/* Table */}
						{isLoading ? (
							<div className="flex items-center justify-center py-12 gap-2 text-slate-400">
								<Loader2 className="w-5 h-5 animate-spin" />
								<span className="text-sm">Memuat data...</span>
							</div>
						) : sessions.length === 0 ? (
							<div className="text-center py-12 text-slate-400">
								<BookMarked className="w-10 h-10 mx-auto mb-3 text-slate-300" />
								<p className="text-sm font-medium text-slate-500">
									Belum ada setoran hafalan
								</p>
								{canEdit && (
									<p className="text-xs text-slate-400 mt-1">
										Klik "Tambah Hafalan" untuk menambahkan setoran pertama
										beserta catatan kosakata & kalimat
									</p>
								)}
							</div>
						) : (
							<div className="rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
								<Table>
									<TableHeader>
										<TableRow className="bg-slate-50/80">
											<TableHead className="text-xs font-semibold text-slate-700 min-w-[150px]">
												Bahasa & Tanggal
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-700 min-w-[220px]">
												Kosakata Dihafal
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-700 min-w-[260px]">
												Kalimat Dihafal
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-700 min-w-[160px]">
												Catatan / Evaluasi
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-700 text-center w-[100px]">
												Aksi
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{sessions.map((session) => {
											const vocabList = Array.isArray(session.vocabList)
												? session.vocabList
												: [];
											const sentenceList = Array.isArray(session.sentenceList)
												? session.sentenceList
												: [];
											const formattedDate = new Date(
												session.createdAt,
											).toLocaleDateString("id-ID", {
												day: "numeric",
												month: "short",
												year: "numeric",
											});

											return (
												<TableRow
													key={session.id}
													className="hover:bg-slate-50/60 transition-colors"
												>
													{/* Bahasa & Tanggal */}
													<TableCell className="align-top">
														<Badge
															className={`${getLanguageBadgeClass(session.language)} border text-xs font-semibold`}
														>
															{getLanguageLabel(session)}
														</Badge>
														<p className="text-xs text-slate-500 font-medium mt-1">
															{formattedDate}
														</p>
													</TableCell>

													{/* Kosakata */}
													<TableCell className="align-top">
														<div className="space-y-1.5">
															<div className="flex items-center gap-1.5">
																<span className="text-sm font-bold text-slate-900">
																	{session.vocabCount.toLocaleString("id-ID")}
																</span>
																<span className="text-xs text-slate-500">
																	kata
																</span>
															</div>

															{vocabList.length > 0 ? (
																<div className="flex flex-wrap gap-1 max-w-sm">
																	{vocabList.slice(0, 5).map((word, wIdx) => (
																		<span
																			key={wIdx}
																			className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
																		>
																			{word}
																		</span>
																	))}
																	{vocabList.length > 5 && (
																		<button
																			type="button"
																			onClick={() =>
																				setViewSessionDetail(session)
																			}
																			className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
																		>
																			+{vocabList.length - 5} lainnya
																		</button>
																	)}
																</div>
															) : (
																<span className="text-xs text-slate-400 italic">
																	- tidak ada daftar tag -
																</span>
															)}
														</div>
													</TableCell>

													{/* Kalimat */}
													<TableCell className="align-top">
														<div className="space-y-1.5">
															<div className="flex items-center gap-1.5">
																<span className="text-sm font-bold text-slate-900">
																	{session.sentenceCount.toLocaleString(
																		"id-ID",
																	)}
																</span>
																<span className="text-xs text-slate-500">
																	kalimat
																</span>
															</div>

															{sentenceList.length > 0 ? (
																<div className="flex flex-col gap-1 max-w-md">
																	{sentenceList
																		.slice(0, 2)
																		.map((sentence, sIdx) => (
																			<div
																				key={sIdx}
																				className="text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200 rounded-md px-2 py-1 leading-snug line-clamp-1"
																				title={sentence}
																			>
																				<span className="font-bold text-amber-700 mr-1">
																					#{sIdx + 1}
																				</span>
																				{sentence}
																			</div>
																		))}
																	{sentenceList.length > 2 && (
																		<button
																			type="button"
																			onClick={() =>
																				setViewSessionDetail(session)
																			}
																			className="text-left text-[11px] font-bold text-[#0517B0] hover:underline"
																		>
																			+{sentenceList.length - 2} kalimat
																			lainnya...
																		</button>
																	)}
																</div>
															) : (
																<span className="text-xs text-slate-400 italic">
																	- tidak ada daftar tag -
																</span>
															)}
														</div>
													</TableCell>

													{/* Catatan */}
													<TableCell className="align-top">
														{session.notes ? (
															<p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50 p-2 rounded-lg border border-slate-200">
																{session.notes}
															</p>
														) : (
															<span className="text-xs text-slate-400 italic">
																-
															</span>
														)}
													</TableCell>

													{/* Aksi */}
													<TableCell className="align-top text-center">
														<div className="flex items-center justify-center gap-1">
															{(vocabList.length > 0 ||
																sentenceList.length > 0) && (
																<button
																	type="button"
																	onClick={() => setViewSessionDetail(session)}
																	className="p-1.5 rounded-md hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
																	title="Lihat Rincian Lengkap"
																>
																	<Eye className="w-3.5 h-3.5" />
																</button>
															)}
															{canEdit && (
																<>
																	<button
																		type="button"
																		onClick={() => handleStartEdit(session)}
																		className="p-1.5 rounded-md hover:bg-blue-50 text-slate-400 hover:text-[#0517B0] transition-colors"
																		title="Edit"
																	>
																		<Edit2 className="w-3.5 h-3.5" />
																	</button>
																	<button
																		type="button"
																		onClick={() => {
																			setPendingDeleteId(session.id);
																			setShowDeleteDialog(true);
																		}}
																		className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
																		title="Hapus"
																	>
																		<Trash2 className="w-3.5 h-3.5" />
																	</button>
																</>
															)}
														</div>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Edit Dialog */}
			{editingSession && (
				<Dialog
					open={!!editingSession}
					onOpenChange={(o) => !o && setEditingSession(null)}
				>
					<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-base">
								<Edit2 className="w-4 h-4 text-[#0517B0]" />
								Edit Setoran Hafalan & Daftar Tag
							</DialogTitle>
							<DialogDescription className="text-xs">
								Perbarui data bahasa, tanggal, serta daftar tag kosakata dan
								kalimat yang dihafal.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="text-xs font-medium text-slate-700">
										Tanggal Setoran *
									</Label>
									<Input
										type="date"
										value={
											editForm.date || new Date().toISOString().split("T")[0]
										}
										onChange={(e) =>
											setEditForm((p) => ({
												...p,
												date: e.target.value,
											}))
										}
										className="h-9 text-sm"
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs font-medium text-slate-700">
										Bahasa
									</Label>
									<Select
										value={editForm.language}
										onValueChange={(v) =>
											setEditForm((p) => ({
												...p,
												language: v ?? "inggris",
												languageCustom: "",
											}))
										}
									>
										<SelectTrigger className="h-9 text-sm">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="inggris">🇬🇧 Inggris</SelectItem>
											<SelectItem value="mandarin">🇨🇳 Mandarin</SelectItem>
											<SelectItem value="jepang">🇯🇵 Jepang</SelectItem>
											<SelectItem value="jerman">🇩🇪 Jerman</SelectItem>
											<SelectItem value="arab">🇸🇦 Arab</SelectItem>
											<SelectItem value="korea">🇰🇷 Korea</SelectItem>
											<SelectItem value="lainnya">Lainnya...</SelectItem>
										</SelectContent>
									</Select>
								</div>
								{editForm.language === "lainnya" && (
									<div className="space-y-1.5 sm:col-span-2">
										<Label className="text-xs font-medium text-slate-700">
											Nama Bahasa *
										</Label>
										<Input
											placeholder="Contoh: Prancis, Spanyol..."
											value={editForm.languageCustom}
											onChange={(e) =>
												setEditForm((p) => ({
													...p,
													languageCustom: e.target.value,
												}))
											}
											className="h-9 text-sm"
										/>
									</div>
								)}
							</div>

							{/* Edit Vocab Tags */}
							<div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
								<div className="flex items-center justify-between">
									<Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<Tag className="w-3.5 h-3.5 text-blue-600" />
										Daftar Kosakata (Per Kata)
									</Label>
									<Badge
										variant="secondary"
										className="bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200"
									>
										{editForm.vocabList.length} kata
									</Badge>
								</div>

								<div className="flex gap-2">
									<Input
										placeholder="Ketik kata lalu tekan Enter atau koma..."
										value={inputEditVocab}
										onChange={(e) => setInputEditVocab(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === ",") {
												e.preventDefault();
												handleAddVocabTags(inputEditVocab, true);
											}
										}}
										className="h-9 text-sm bg-white"
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => handleAddVocabTags(inputEditVocab, true)}
										disabled={!inputEditVocab.trim()}
										className="h-9 px-3 text-xs bg-blue-50 text-blue-700 border-blue-200 shrink-0 font-semibold"
									>
										<Plus className="w-3.5 h-3.5 mr-1" />
										Tambah
									</Button>
								</div>

								{editForm.vocabList.length > 0 ? (
									<div className="flex flex-wrap gap-1.5 pt-1 max-h-32 overflow-y-auto">
										{editForm.vocabList.map((word, idx) => (
											<span
												key={idx}
												className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs"
											>
												<span>{word}</span>
												<button
													type="button"
													onClick={() => handleRemoveVocabTag(idx, true)}
													className="text-blue-500 hover:text-blue-900 rounded p-0.5 hover:bg-blue-200/50 transition-colors"
												>
													<X className="w-3 h-3" />
												</button>
											</span>
										))}
									</div>
								) : (
									<p className="text-[11px] text-slate-400 italic">
										Belum ada tag kosakata
									</p>
								)}
							</div>

							{/* Edit Sentence Tags */}
							<div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
								<div className="flex items-center justify-between">
									<Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<MessageSquare className="w-3.5 h-3.5 text-amber-600" />
										Daftar Kalimat (Per Kalimat)
									</Label>
									<Badge
										variant="secondary"
										className="bg-amber-50 text-amber-800 font-semibold text-xs border border-amber-200"
									>
										{editForm.sentenceList.length} kalimat
									</Badge>
								</div>

								<div className="flex gap-2">
									<Input
										placeholder="Ketik kalimat lalu tekan Enter..."
										value={inputEditSentence}
										onChange={(e) => setInputEditSentence(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddSentenceTag(inputEditSentence, true);
											}
										}}
										className="h-9 text-sm bg-white"
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											handleAddSentenceTag(inputEditSentence, true)
										}
										disabled={!inputEditSentence.trim()}
										className="h-9 px-3 text-xs bg-amber-50 text-amber-800 border-amber-200 shrink-0 font-semibold"
									>
										<Plus className="w-3.5 h-3.5 mr-1" />
										Tambah
									</Button>
								</div>

								{editForm.sentenceList.length > 0 ? (
									<div className="flex flex-col gap-1.5 pt-1 max-h-36 overflow-y-auto">
										{editForm.sentenceList.map((sentence, idx) => (
											<div
												key={idx}
												className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-md text-xs bg-amber-50/90 text-amber-950 border border-amber-200 shadow-2xs"
											>
												<div className="flex items-start gap-2">
													<span className="font-bold text-amber-700 shrink-0">
														#{idx + 1}
													</span>
													<span className="font-medium">{sentence}</span>
												</div>
												<button
													type="button"
													onClick={() => handleRemoveSentenceTag(idx, true)}
													className="text-amber-600 hover:text-amber-950 rounded p-0.5 hover:bg-amber-200/50 transition-colors"
												>
													<X className="w-3.5 h-3.5" />
												</button>
											</div>
										))}
									</div>
								) : (
									<p className="text-[11px] text-slate-400 italic">
										Belum ada tag kalimat
									</p>
								)}
							</div>

							{/* Edit Notes */}
							<div className="space-y-1.5">
								<Label className="text-xs font-medium text-slate-700">
									Catatan Evaluasi / Keterangan (Opsional)
								</Label>
								<Input
									placeholder="Catatan evaluasi..."
									value={editForm.notes}
									onChange={(e) =>
										setEditForm((p) => ({ ...p, notes: e.target.value }))
									}
									className="h-9 text-sm"
								/>
							</div>
						</div>

						<div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setEditingSession(null)}
								disabled={isSavingEdit}
							>
								Batal
							</Button>
							<Button
								size="sm"
								onClick={handleSaveEdit}
								disabled={isSavingEdit}
								className="text-white"
								style={{ backgroundColor: "#0517B0" }}
							>
								{isSavingEdit && (
									<Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
								)}
								Simpan Perubahan
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}

			{/* View Full Detail Dialog */}
			{viewSessionDetail && (
				<Dialog
					open={!!viewSessionDetail}
					onOpenChange={(o) => !o && setViewSessionDetail(null)}
				>
					<DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-base">
								<BookMarked className="w-4 h-4 text-[#0517B0]" />
								Rincian Setoran Hafalan — {getLanguageLabel(viewSessionDetail)}
							</DialogTitle>
							<DialogDescription className="text-xs">
								Tanggal Setoran:{" "}
								{new Date(viewSessionDetail.createdAt).toLocaleDateString(
									"id-ID",
									{
										weekday: "long",
										day: "numeric",
										month: "long",
										year: "numeric",
									},
								)}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							{/* Vocab List */}
							<div className="space-y-2 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
								<div className="flex items-center justify-between">
									<p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<Tag className="w-3.5 h-3.5 text-blue-600" />
										Daftar Kosakata ({viewSessionDetail.vocabCount} kata)
									</p>
								</div>
								{Array.isArray(viewSessionDetail.vocabList) &&
								viewSessionDetail.vocabList.length > 0 ? (
									<div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
										{viewSessionDetail.vocabList.map((w, i) => (
											<span
												key={i}
												className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
											>
												{w}
											</span>
										))}
									</div>
								) : (
									<p className="text-xs text-slate-400 italic">
										Tidak ada rincian tag kata tersimpan
									</p>
								)}
							</div>

							{/* Sentence List */}
							<div className="space-y-2 bg-amber-50/40 p-4 rounded-xl border border-amber-100">
								<div className="flex items-center justify-between">
									<p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<MessageSquare className="w-3.5 h-3.5 text-amber-600" />
										Daftar Kalimat ({viewSessionDetail.sentenceCount} kalimat)
									</p>
								</div>
								{Array.isArray(viewSessionDetail.sentenceList) &&
								viewSessionDetail.sentenceList.length > 0 ? (
									<div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
										{viewSessionDetail.sentenceList.map((s, i) => (
											<div
												key={i}
												className="text-xs font-medium bg-amber-50/90 text-amber-950 border border-amber-200 rounded-md p-2"
											>
												<span className="font-bold text-amber-700 mr-1.5">
													#{i + 1}
												</span>
												{s}
											</div>
										))}
									</div>
								) : (
									<p className="text-xs text-slate-400 italic">
										Tidak ada rincian tag kalimat tersimpan
									</p>
								)}
							</div>

							{/* Notes */}
							{viewSessionDetail.notes && (
								<div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
									<p className="text-xs font-semibold text-slate-600">
										Catatan Evaluasi:
									</p>
									<p className="text-xs text-slate-800">
										{viewSessionDetail.notes}
									</p>
								</div>
							)}
						</div>

						<div className="flex justify-end pt-2 border-t border-slate-100">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setViewSessionDetail(null)}
							>
								Tutup
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}

			{/* Delete Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Setoran Hafalan?</AlertDialogTitle>
						<AlertDialogDescription>
							Data setoran hafalan beserta seluruh catatan tag kata dan kalimat
							ini akan dihapus secara permanen.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-rose-600 hover:bg-rose-700 text-white"
						>
							{isDeleting && (
								<Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
							)}
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
