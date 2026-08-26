"use client";

import {
	BookMarked,
	Edit2,
	Eye,
	MessageSquare,
	Plus,
	PlusCircle,
	Sparkles,
	Tag,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
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
import type { HafalanFormState, HafalanSession } from "./types";

interface TabHafalanProps {
	studentId: number;
	hafalanSessions: HafalanSession[];
	canEdit: boolean;
	isSaving: boolean;
	onAddHafalan: (form: HafalanFormState) => Promise<void>;
	onEditHafalan: (id: number, form: HafalanFormState) => Promise<void>;
	onDeleteHafalan: (id: number) => Promise<void>;
}

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
	canEdit,
	isSaving,
	onAddHafalan,
	onEditHafalan,
	onDeleteHafalan,
}: TabHafalanProps) {
	// Form state
	const [form, setForm] = useState<HafalanFormState>(INITIAL_FORM);
	const [inputVocab, setInputVocab] = useState("");
	const [inputSentence, setInputSentence] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);

	// Delete & Detail Dialog
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [viewSessionDetail, setViewSessionDetail] =
		useState<HafalanSession | null>(null);

	const totalVocab = hafalanSessions.reduce((acc, s) => acc + s.vocabCount, 0);
	const totalSentence = hafalanSessions.reduce(
		(acc, s) => acc + s.sentenceCount,
		0,
	);

	const handleAddVocabTag = (text: string) => {
		if (!text.trim()) return;
		const rawWords = text
			.split(/[,;\n]+/)
			.map((w) => w.trim())
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

	const handleSubmit = async () => {
		if (form.language === "lainnya" && !form.languageCustom.trim()) {
			toast.error("Nama bahasa kustom harus diisi");
			return;
		}

		const pendingVocab = inputVocab.trim();
		const finalVocabList = pendingVocab
			? [
					...(form.vocabList || []),
					...pendingVocab
						.split(/[,;\n]+/)
						.map((w) => w.trim())
						.filter(Boolean),
				]
			: form.vocabList || [];

		const pendingSentence = inputSentence.trim();
		const finalSentenceList = pendingSentence
			? [...(form.sentenceList || []), pendingSentence]
			: form.sentenceList || [];

		const vCount =
			Number(form.vocabCount) > 0
				? Number(form.vocabCount)
				: finalVocabList.length;
		const sCount =
			Number(form.sentenceCount) > 0
				? Number(form.sentenceCount)
				: finalSentenceList.length;

		if (vCount <= 0 && sCount <= 0) {
			toast.error(
				"Silakan masukkan setoran kosakata atau kalimat yang dihafal",
			);
			return;
		}

		if (isEditing && editingId) {
			await onEditHafalan(editingId, {
				...form,
				vocabCount: vCount,
				sentenceCount: sCount,
				vocabList: finalVocabList,
				sentenceList: finalSentenceList,
			});
			setIsEditing(false);
			setEditingId(null);
		} else {
			await onAddHafalan({
				...form,
				vocabCount: vCount,
				sentenceCount: sCount,
				vocabList: finalVocabList,
				sentenceList: finalSentenceList,
			});
		}

		setForm(INITIAL_FORM);
		setInputVocab("");
		setInputSentence("");
	};

	const startEdit = (session: HafalanSession) => {
		setIsEditing(true);
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
			date: new Date(session.createdAt).toISOString().split("T")[0],
		});
		setInputVocab("");
		setInputSentence("");
	};

	const cancelEdit = () => {
		setIsEditing(false);
		setEditingId(null);
		setForm(INITIAL_FORM);
		setInputVocab("");
		setInputSentence("");
	};

	return (
		<div className="space-y-6">
			{/* Summary Cards KPI */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
					<CardContent className="p-4">
						<p className="text-xs text-slate-500 font-medium">
							Total Sesi Setoran
						</p>
						<p className="text-2xl font-bold text-slate-900 mt-1">
							{hafalanSessions.length}
						</p>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
					<CardContent className="p-4">
						<p className="text-xs text-slate-500 font-medium">Total Kosakata</p>
						<p className="text-2xl font-bold text-emerald-600 mt-1">
							{totalVocab.toLocaleString("id-ID")}{" "}
							<span className="text-xs text-slate-500 font-normal">kata</span>
						</p>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
					<CardContent className="p-4">
						<p className="text-xs text-slate-500 font-medium">Total Kalimat</p>
						<p className="text-2xl font-bold text-amber-600 mt-1">
							{totalSentence.toLocaleString("id-ID")}{" "}
							<span className="text-xs text-slate-500 font-normal">
								kalimat
							</span>
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Card */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
							<BookMarked className="w-4 h-4" />
						</span>
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							SETORAN HAFALAN (KOSAKATA & KALIMAT)
						</h3>
					</div>
					<Badge
						variant="outline"
						className="text-xs bg-white text-slate-600 border-slate-200 font-semibold"
					>
						{hafalanSessions.length} Sesi Terdata
					</Badge>
				</div>

				<div className="p-5 space-y-6">
					{/* Form Input / Edit */}
					{canEdit && (
						<div className="p-4 sm:p-5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-4 shadow-xs">
							<div className="flex items-center justify-between border-b border-blue-200/80 pb-2.5">
								<h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
									<Sparkles className="w-4 h-4 text-blue-600" />
									{isEditing
										? "Edit Setoran Hafalan & Daftar Tag"
										: "Input Setoran Hafalan Baru"}
								</h4>
								{isEditing && (
									<Button
										variant="ghost"
										size="sm"
										onClick={cancelEdit}
										className="h-7 text-xs text-slate-600 hover:text-slate-900"
									>
										<X className="w-3.5 h-3.5 mr-1" />
										Batal Edit
									</Button>
								)}
							</div>

							{/* Tanggal & Bahasa */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<Label className="text-xs font-medium text-slate-700 block mb-1">
										Tanggal Setoran *
									</Label>
									<Input
										type="date"
										className="bg-white"
										value={form.date || new Date().toISOString().split("T")[0]}
										onChange={(e) =>
											setForm((p) => ({ ...p, date: e.target.value }))
										}
									/>
								</div>

								<div>
									<Label className="text-xs font-medium text-slate-700 block mb-1">
										Bahasa *
									</Label>
									<Select
										value={form.language}
										onValueChange={(val) =>
											setForm((p) => ({
												...p,
												language: val ?? "inggris",
												languageCustom:
													val === "lainnya" ? p.languageCustom : "",
											}))
										}
									>
										<SelectTrigger className="bg-white">
											<SelectValue placeholder="Pilih Bahasa" />
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

								{form.language === "lainnya" && (
									<div className="sm:col-span-2">
										<Label className="text-xs font-medium text-slate-700 block mb-1">
											Nama Bahasa Kustom *
										</Label>
										<Input
											placeholder="Contoh: Prancis, Spanyol..."
											className="bg-white"
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

							{/* Section Tag Kosakata (Per Kata) */}
							<div className="space-y-2 bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs">
								<div className="flex items-center justify-between">
									<Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<Tag className="w-3.5 h-3.5 text-blue-600" />
										Catat Kosakata yang Dihafal (Per Kata)
									</Label>
									<Badge
										variant="secondary"
										className="bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200"
									>
										{(form.vocabList || []).length} kata
									</Badge>
								</div>

								<div className="flex gap-2">
									<Input
										placeholder="Ketik kata lalu tekan Enter atau koma (contoh: apple, spoon, kitchen)..."
										value={inputVocab}
										onChange={(e) => setInputVocab(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === ",") {
												e.preventDefault();
												handleAddVocabTag(inputVocab);
											}
										}}
										className="h-9 text-sm bg-white"
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => handleAddVocabTag(inputVocab)}
										disabled={!inputVocab.trim()}
										className="h-9 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shrink-0 font-semibold"
									>
										<Plus className="w-3.5 h-3.5 mr-1" />
										Tambah
									</Button>
								</div>

								{(form.vocabList || []).length > 0 ? (
									<div className="flex flex-wrap gap-1.5 pt-1 max-h-32 overflow-y-auto pr-1">
										{(form.vocabList || []).map((word, idx) => (
											<span
												key={idx}
												className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs"
											>
												<span>{word}</span>
												<button
													type="button"
													onClick={() => handleRemoveVocabTag(idx)}
													className="text-blue-500 hover:text-blue-900 rounded p-0.5 hover:bg-blue-200/50 transition-colors"
												>
													<X className="w-3 h-3" />
												</button>
											</span>
										))}
									</div>
								) : (
									<p className="text-[11px] text-slate-400 italic">
										Belum ada tag kata. Ketik kata di atas untuk mencatat.
									</p>
								)}
							</div>

							{/* Section Tag Kalimat (Per Kalimat) */}
							<div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs">
								<div className="flex items-center justify-between">
									<Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<MessageSquare className="w-3.5 h-3.5 text-amber-600" />
										Catat Kalimat yang Dihafal (Per Kalimat)
									</Label>
									<Badge
										variant="secondary"
										className="bg-amber-50 text-amber-800 font-semibold text-xs border border-amber-200"
									>
										{(form.sentenceList || []).length} kalimat
									</Badge>
								</div>

								<div className="flex gap-2">
									<Input
										placeholder="Ketik kalimat lengkap lalu tekan Enter (contoh: Good morning, how can I help you?)..."
										value={inputSentence}
										onChange={(e) => setInputSentence(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddSentenceTag(inputSentence);
											}
										}}
										className="h-9 text-sm bg-white"
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => handleAddSentenceTag(inputSentence)}
										disabled={!inputSentence.trim()}
										className="h-9 px-3 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 shrink-0 font-semibold"
									>
										<Plus className="w-3.5 h-3.5 mr-1" />
										Tambah
									</Button>
								</div>

								{(form.sentenceList || []).length > 0 ? (
									<div className="flex flex-col gap-1.5 pt-1 max-h-36 overflow-y-auto pr-1">
										{(form.sentenceList || []).map((sentence, idx) => (
											<div
												key={idx}
												className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs bg-amber-50/90 text-amber-950 border border-amber-200 shadow-2xs"
											>
												<div className="flex items-start gap-2">
													<span className="font-bold text-amber-700 shrink-0">
														#{idx + 1}
													</span>
													<span className="font-medium">{sentence}</span>
												</div>
												<button
													type="button"
													onClick={() => handleRemoveSentenceTag(idx)}
													className="text-amber-600 hover:text-amber-950 rounded p-0.5 hover:bg-amber-200/50 transition-colors shrink-0"
												>
													<X className="w-3 h-3" />
												</button>
											</div>
										))}
									</div>
								) : (
									<p className="text-[11px] text-slate-400 italic">
										Belum ada tag kalimat. Ketik kalimat di atas untuk mencatat.
									</p>
								)}
							</div>

							{/* Notes */}
							<div>
								<Label className="text-xs font-medium text-slate-700 block mb-1">
									Catatan Evaluasi / Keterangan (Opsional)
								</Label>
								<Input
									placeholder="Catatan tambahan seputar kelancaran/evaluasi..."
									className="bg-white"
									value={form.notes || ""}
									onChange={(e) =>
										setForm((p) => ({ ...p, notes: e.target.value }))
									}
								/>
							</div>

							<div className="flex justify-end pt-1 border-t border-blue-200/60">
								<Button
									size="sm"
									onClick={handleSubmit}
									disabled={isSaving}
									className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 px-4 shadow-sm"
								>
									<PlusCircle className="w-4 h-4" />
									{isEditing ? "Perbarui Setoran" : "Simpan Setoran"}
								</Button>
							</div>
						</div>
					)}

					{/* Tabel Riwayat Setoran Hafalan */}
					<div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50/80">
									<TableHead className="text-xs font-semibold text-slate-700 min-w-[140px]">
										Tanggal & Bahasa
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-700 min-w-[200px]">
										Kosakata Dihafal
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-700 min-w-[240px]">
										Kalimat Dihafal
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-700 min-w-[150px]">
										Catatan
									</TableHead>
									{canEdit && (
										<TableHead className="text-xs font-semibold text-slate-700 text-center w-[90px]">
											Aksi
										</TableHead>
									)}
								</TableRow>
							</TableHeader>
							<TableBody>
								{hafalanSessions.map((session) => {
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
											<TableCell className="align-top">
												<Badge
													variant="outline"
													className={`text-xs font-semibold ${getLanguageBadgeClass(
														session.language,
													)}`}
												>
													{getLanguageLabel(session)}
												</Badge>
												<p className="text-xs text-slate-500 font-medium mt-1">
													{formattedDate}
												</p>
											</TableCell>

											<TableCell className="align-top">
												<div className="space-y-1">
													<div className="flex items-center gap-1.5">
														<span className="font-bold text-slate-900 text-sm">
															+{session.vocabCount}
														</span>
														<span className="text-xs text-slate-500">kata</span>
													</div>
													{vocabList.length > 0 ? (
														<div className="flex flex-wrap gap-1 max-w-xs">
															{vocabList.slice(0, 4).map((w, wi) => (
																<span
																	key={wi}
																	className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
																>
																	{w}
																</span>
															))}
															{vocabList.length > 4 && (
																<button
																	type="button"
																	onClick={() => setViewSessionDetail(session)}
																	className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
																>
																	+{vocabList.length - 4} lainnya
																</button>
															)}
														</div>
													) : null}
												</div>
											</TableCell>

											<TableCell className="align-top">
												<div className="space-y-1">
													<div className="flex items-center gap-1.5">
														<span className="font-bold text-slate-900 text-sm">
															+{session.sentenceCount}
														</span>
														<span className="text-xs text-slate-500">
															kalimat
														</span>
													</div>
													{sentenceList.length > 0 ? (
														<div className="flex flex-col gap-1 max-w-sm">
															{sentenceList.slice(0, 2).map((s, si) => (
																<div
																	key={si}
																	className="text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200 rounded-md px-2 py-0.5 line-clamp-1"
																	title={s}
																>
																	<span className="font-bold text-amber-700 mr-1">
																		#{si + 1}
																	</span>
																	{s}
																</div>
															))}
															{sentenceList.length > 2 && (
																<button
																	type="button"
																	onClick={() => setViewSessionDetail(session)}
																	className="text-left text-[11px] font-bold text-[#0517B0] hover:underline"
																>
																	+{sentenceList.length - 2} kalimat lainnya...
																</button>
															)}
														</div>
													) : null}
												</div>
											</TableCell>

											<TableCell className="align-top">
												{session.notes ? (
													<p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50 p-2 rounded-lg border border-slate-200 max-w-xs">
														{session.notes}
													</p>
												) : (
													<span className="text-xs text-slate-400 italic">
														-
													</span>
												)}
											</TableCell>

											{canEdit && (
												<TableCell className="align-top text-center">
													<div className="flex items-center justify-center gap-1">
														{(vocabList.length > 0 ||
															sentenceList.length > 0) && (
															<button
																type="button"
																onClick={() => setViewSessionDetail(session)}
																className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
																title="Lihat Rincian Tag"
															>
																<Eye className="w-3.5 h-3.5" />
															</button>
														)}
														<button
															type="button"
															onClick={() => startEdit(session)}
															className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
															title="Edit setoran ini"
														>
															<Edit2 className="w-3.5 h-3.5" />
														</button>
														<button
															type="button"
															onClick={() => setDeleteId(session.id)}
															className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
															title="Hapus setoran ini"
														>
															<Trash2 className="w-3.5 h-3.5" />
														</button>
													</div>
												</TableCell>
											)}
										</TableRow>
									);
								})}
								{hafalanSessions.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={canEdit ? 5 : 4}
											className="text-center py-8 text-sm text-slate-400 italic"
										>
											Belum ada data riwayat setoran hafalan (kosakata &
											kalimat).
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>

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
								<p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
									<Tag className="w-3.5 h-3.5 text-blue-600" />
									Daftar Kosakata ({viewSessionDetail.vocabCount} kata)
								</p>
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
								<p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
									<MessageSquare className="w-3.5 h-3.5 text-amber-600" />
									Daftar Kalimat ({viewSessionDetail.sentenceCount} kalimat)
								</p>
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
			<AlertDialog
				open={deleteId !== null}
				onOpenChange={(open) => !open && setDeleteId(null)}
			>
				<AlertDialogContent>
					<AlertDialogTitle>Hapus Setoran Hafalan?</AlertDialogTitle>
					<AlertDialogDescription>
						Apakah Anda yakin ingin menghapus data sesi setoran hafalan beserta
						seluruh catatan tag kata dan kalimat ini? Tindakan ini tidak dapat
						dibatalkan.
					</AlertDialogDescription>
					<div className="flex justify-end gap-3 mt-4">
						<AlertDialogCancel onClick={() => setDeleteId(null)}>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={async () => {
								if (deleteId) {
									await onDeleteHafalan(deleteId);
									setDeleteId(null);
								}
							}}
							className="bg-rose-600 hover:bg-rose-700 text-white"
						>
							Ya, Hapus
						</AlertDialogAction>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
