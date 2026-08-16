"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	CheckCircle2,
	Clock,
	Edit2,
	Eye,
	FileText,
	Loader2,
	MessageSquarePlus,
	Pencil,
	Save,
	StickyNote,
	Trash2,
	UploadCloud,
	X,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { API_URL, getToken } from "@/lib/eden";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AssessmentRecord {
	id: number;
	studentId: number;
	score: number | null;
	notes: string | null;
	resultFileUrl: string | null;
	resultFileName: string | null;
	resultFileSize: number | null;
	status: "belum_dimulai" | "nilai_diisi" | "pdf_diunggah" | "selesai";
	assessedBy: number | null;
	assessedAt: string | null;
	assessedByUser: { fullName: string; username: string } | null;
	updatedAt: string;
}

interface AssessmentNote {
	id: number;
	assessmentId: number;
	content: string;
	createdBy: number | null;
	createdAt: string;
	updatedAt: string;
	author: { fullName: string; username: string } | null;
}

interface AssessmentFormCardProps {
	studentId: number;
	assessment: AssessmentRecord | null;
	canEdit: boolean;
	token: string | null;
	onRefresh: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getGrade(score: number): { letter: string; color: string; bg: string } {
	if (score >= 90) return { letter: "A", color: "#059669", bg: "#d1fae5" };
	if (score >= 80) return { letter: "B+", color: "#0517B0", bg: "#dbeafe" };
	if (score >= 70) return { letter: "B", color: "#2563eb", bg: "#eff6ff" };
	if (score >= 60) return { letter: "C+", color: "#d97706", bg: "#fef3c7" };
	if (score >= 50) return { letter: "C", color: "#ea580c", bg: "#ffedd5" };
	return { letter: "D", color: "#dc2626", bg: "#fee2e2" };
}

function formatDateTime(dateStr: string): string {
	try {
		return new Intl.DateTimeFormat("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(dateStr));
	} catch {
		return dateStr;
	}
}

function getRelativeTime(dateStr: string): string {
	try {
		const diff = Date.now() - new Date(dateStr).getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return "Baru saja";
		if (minutes < 60) return `${minutes} menit lalu`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} jam lalu`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days} hari lalu`;
		return formatDateTime(dateStr);
	} catch {
		return dateStr;
	}
}

// ── Sub-component: Score Card ─────────────────────────────────────────────────

function ScoreCard({
	studentId,
	assessment,
	canEdit,
	onRefresh,
}: {
	studentId: number;
	assessment: AssessmentRecord | null;
	canEdit: boolean;
	onRefresh: () => void;
}) {
	const [scoreInput, setScoreInput] = useState<string>(
		assessment?.score !== null && assessment?.score !== undefined
			? String(assessment.score)
			: "",
	);
	const [isSaving, setIsSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const hasScore =
		assessment?.score !== null && assessment?.score !== undefined;
	const grade = hasScore ? getGrade(assessment!.score!) : null;

	const handleSave = async () => {
		if (scoreInput === "") {
			toast.error("Nilai tidak boleh kosong");
			return;
		}
		const scoreNum = Math.max(0, Math.min(100, Number(scoreInput) || 0));
		setIsSaving(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/departure-assessment`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ score: scoreNum }),
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Nilai berhasil disimpan");
			setIsEditing(false);
			onRefresh();
		} catch {
			toast.error("Gagal menyimpan nilai");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Card className="bg-white border-slate-200 shadow-sm h-full">
			<CardHeader className="pb-3 border-b border-slate-100">
				<CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
					<span className="w-5 h-5 rounded bg-[#0517B0]/10 flex items-center justify-center text-[10px] font-bold text-[#0517B0]">
						N
					</span>
					Nilai Assessment
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 flex flex-col gap-4">
				{/* Score display */}
				{hasScore && !isEditing ? (
					<div className="flex items-center gap-4">
						{/* Circle score */}
						<div
							className="w-20 h-20 rounded-full flex flex-col items-center justify-center shrink-0 border-4"
							style={{
								borderColor: grade!.color,
								backgroundColor: grade!.bg,
							}}
						>
							<span
								className="text-2xl font-black leading-none"
								style={{ color: grade!.color }}
							>
								{assessment!.score}
							</span>
							<span className="text-[10px] font-medium text-slate-500 mt-0.5">
								/ 100
							</span>
						</div>
						<div>
							<div
								className="text-4xl font-black leading-none mb-1"
								style={{ color: grade!.color }}
							>
								{grade!.letter}
							</div>
							<p className="text-xs text-slate-500">Nilai final</p>
							{canEdit && (
								<button
									type="button"
									onClick={() => setIsEditing(true)}
									className="mt-2 text-xs text-[#0517B0] hover:underline font-medium"
								>
									Edit nilai
								</button>
							)}
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{!hasScore && !isEditing && (
							<div className="flex items-center gap-3 py-4 text-slate-400">
								<div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
									<span className="text-xl font-bold text-slate-300">?</span>
								</div>
								<div>
									<p className="text-sm font-medium text-slate-500">
										Belum ada nilai
									</p>
									<p className="text-xs text-slate-400 mt-0.5">
										Isi nilai untuk memulai
									</p>
								</div>
							</div>
						)}

						{(isEditing || (!hasScore && canEdit)) && (
							<>
								<div className="space-y-1.5">
									<Label
										htmlFor={`score-${studentId}`}
										className="text-xs font-medium text-slate-600"
									>
										Nilai (0 – 100)
									</Label>
									<Input
										id={`score-${studentId}`}
										type="number"
										min={0}
										max={100}
										placeholder="Contoh: 85"
										value={scoreInput}
										className="w-36 h-9"
										onKeyDown={(e) => {
											if (
												e.key === "-" ||
												e.key === "e" ||
												e.key === "E"
											)
												e.preventDefault();
										}}
										onChange={(e) => {
											const raw = e.target.value;
											if (raw === "") {
												setScoreInput("");
											} else {
												const clamped = Math.max(
													0,
													Math.min(100, Number(raw) || 0),
												);
												setScoreInput(String(clamped));
											}
										}}
									/>
								</div>
								<div className="flex gap-2">
									<Button
										size="sm"
										onClick={handleSave}
										disabled={isSaving || scoreInput === ""}
										className="text-white hover:bg-blue-800 h-8 text-xs gap-1.5"
										style={{ backgroundColor: "#0517B0" }}
									>
										{isSaving ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										) : (
											<Save className="w-3.5 h-3.5" />
										)}
										Simpan
									</Button>
									{isEditing && (
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												setIsEditing(false);
												setScoreInput(String(assessment?.score ?? ""));
											}}
											className="h-8 text-xs"
										>
											Batal
										</Button>
									)}
								</div>
							</>
						)}
					</div>
				)}

				{/* Score preview saat sedang edit */}
				{isEditing && scoreInput !== "" && (
					<div className="flex items-center gap-3 pt-2 border-t border-slate-100">
						{(() => {
							const g = getGrade(Number(scoreInput));
							return (
								<>
									<div
										className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2"
										style={{
											borderColor: g.color,
											backgroundColor: g.bg,
											color: g.color,
										}}
									>
										{scoreInput}
									</div>
									<span
										className="text-2xl font-black"
										style={{ color: g.color }}
									>
										{g.letter}
									</span>
									<span className="text-xs text-slate-400">Pratinjau</span>
								</>
							);
						})()}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// ── Sub-component: PDF Card ───────────────────────────────────────────────────

function PdfCard({
	studentId,
	assessment,
	canEdit,
	token,
	onRefresh,
}: {
	studentId: number;
	assessment: AssessmentRecord | null;
	canEdit: boolean;
	token: string | null;
	onRefresh: () => void;
}) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const hasFile = Boolean(assessment?.resultFileUrl);

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.type !== "application/pdf") {
			toast.error("Hanya file PDF yang diperbolehkan");
			e.target.value = "";
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			toast.error("Ukuran file maksimal 10MB");
			e.target.value = "";
			return;
		}
		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			const res = await fetch(
				`${API_URL}/students/${studentId}/departure-assessment/upload`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${getToken()}` },
					body: formData,
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("File berhasil diunggah");
			onRefresh();
		} catch {
			toast.error("Gagal mengunggah file");
		} finally {
			setIsUploading(false);
			e.target.value = "";
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/departure-assessment/file`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("File berhasil dihapus");
			onRefresh();
		} catch {
			toast.error("Gagal menghapus file");
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	const handleReview = () => {
		const fileUrl = `/students/${studentId}/departure-assessment/file-view`;
		const fileName =
			assessment?.resultFileName || "Hasil Assessment Pra-keberangkatan.pdf";
		window.open(
			`/dashboard/students/${studentId}/documents/assessment?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fileName)}&token=${token ?? ""}`,
			"_blank",
		);
	};

	return (
		<>
			<Card className="bg-white border-slate-200 shadow-sm h-full">
				<CardHeader className="pb-3 border-b border-slate-100">
					<CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
						<span className="w-5 h-5 rounded bg-[#0517B0]/10 flex items-center justify-center text-[10px] font-bold text-[#0517B0]">
							F
						</span>
						Dokumen Hasil Assessment
					</CardTitle>
				</CardHeader>
				<CardContent className="p-5 flex flex-col gap-4">
					{hasFile ? (
						<>
							{/* File info card */}
							<div className="flex items-center gap-3 p-4 bg-blue-50/60 border border-blue-100 rounded-lg">
								<div className="w-10 h-10 rounded-lg bg-[#0517B0]/10 flex items-center justify-center shrink-0">
									<FileText className="w-5 h-5 text-[#0517B0]" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-slate-800 truncate">
										{assessment!.resultFileName ?? "hasil_assessment.pdf"}
									</p>
									<div className="flex items-center gap-2 mt-0.5">
										{assessment!.resultFileSize != null && (
											<span className="text-xs text-slate-500">
												{formatFileSize(assessment!.resultFileSize)}
											</span>
										)}
										<span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
											<CheckCircle2 className="w-3 h-3" />
											Tersimpan
										</span>
									</div>
								</div>
							</div>

							{/* Action buttons */}
							<div className="flex flex-wrap gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleReview}
									className="h-9 gap-1.5 text-xs border-[#0517B0]/20 text-[#0517B0] hover:bg-[#0517B0]/5"
								>
									<Eye className="w-3.5 h-3.5" />
									Review PDF
								</Button>
								{canEdit && (
									<>
										<Button
											variant="outline"
											size="sm"
											onClick={() => fileInputRef.current?.click()}
											disabled={isUploading}
											className="h-9 gap-1.5 text-xs"
										>
											{isUploading ? (
												<Loader2 className="w-3.5 h-3.5 animate-spin" />
											) : (
												<UploadCloud className="w-3.5 h-3.5" />
											)}
											Ganti File
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setShowDeleteDialog(true)}
											disabled={isDeleting}
											className="h-9 w-9 p-0 text-rose-500 hover:bg-rose-50 border-rose-200"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</Button>
									</>
								)}
							</div>
						</>
					) : (
						<div className="flex flex-col items-center justify-center py-6 gap-3">
							<div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
								<FileText className="w-7 h-7 text-slate-300" />
							</div>
							<div className="text-center">
								<p className="text-sm font-medium text-slate-500">
									Belum ada dokumen
								</p>
								<p className="text-xs text-slate-400 mt-0.5">
									Unggah file PDF hasil assessment
								</p>
							</div>
							{canEdit && (
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-[#0517B0] hover:text-[#0517B0] hover:bg-[#0517B0]/5 transition-colors"
								>
									{isUploading ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<UploadCloud className="w-4 h-4" />
									)}
									{isUploading ? "Mengunggah..." : "Pilih file PDF (maks. 10MB)"}
								</button>
							)}
						</div>
					)}

					{/* Hidden file input */}
					<input
						ref={fileInputRef}
						type="file"
						accept=".pdf,application/pdf"
						className="hidden"
						onChange={handleUpload}
						disabled={isUploading}
					/>
				</CardContent>
			</Card>

			{/* Delete Confirm Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Dokumen Hasil?</AlertDialogTitle>
						<AlertDialogDescription>
							File PDF hasil assessment akan dihapus secara permanen dan tidak
							dapat dipulihkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-rose-600 hover:bg-rose-700 text-white"
						>
							{isDeleting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
							Hapus Permanen
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

// ── Sub-component: Notes Section ──────────────────────────────────────────────

function NotesSection({
	studentId,
	canEdit,
}: {
	studentId: number;
	canEdit: boolean;
}) {
	const [notes, setNotes] = useState<AssessmentNote[]>([]);
	const [isLoadingNotes, setIsLoadingNotes] = useState(true);

	// Add form state
	const [newContent, setNewContent] = useState("");
	const [isAdding, setIsAdding] = useState(false);
	const [showAddForm, setShowAddForm] = useState(false);

	// Edit state
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editContent, setEditContent] = useState("");
	const [isSavingEdit, setIsSavingEdit] = useState(false);

	// Delete state
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

	const fetchNotes = useCallback(async () => {
		setIsLoadingNotes(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/departure-assessment/notes`,
				{ headers: { Authorization: `Bearer ${getToken()}` } },
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			setNotes(json.data ?? []);
		} catch {
			toast.error("Gagal memuat catatan");
		} finally {
			setIsLoadingNotes(false);
		}
	}, [studentId]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchNotes();
	}, [fetchNotes]);

	const handleAdd = async () => {
		if (!newContent.trim()) return;
		setIsAdding(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/departure-assessment/notes`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ content: newContent.trim() }),
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Catatan berhasil ditambahkan");
			setNewContent("");
			setShowAddForm(false);
			fetchNotes();
		} catch {
			toast.error("Gagal menambahkan catatan");
		} finally {
			setIsAdding(false);
		}
	};

	const handleStartEdit = (note: AssessmentNote) => {
		setEditingId(note.id);
		setEditContent(note.content);
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditContent("");
	};

	const handleSaveEdit = async (noteId: number) => {
		if (!editContent.trim()) return;
		setIsSavingEdit(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/departure-assessment/notes/${noteId}`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ content: editContent.trim() }),
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Catatan berhasil diperbarui");
			setEditingId(null);
			setEditContent("");
			fetchNotes();
		} catch {
			toast.error("Gagal memperbarui catatan");
		} finally {
			setIsSavingEdit(false);
		}
	};

	const handleConfirmDelete = (noteId: number) => {
		setPendingDeleteId(noteId);
		setShowDeleteDialog(true);
	};

	const handleDelete = async () => {
		if (!pendingDeleteId) return;
		setDeletingId(pendingDeleteId);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/departure-assessment/notes/${pendingDeleteId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Catatan berhasil dihapus");
			setShowDeleteDialog(false);
			setPendingDeleteId(null);
			fetchNotes();
		} catch {
			toast.error("Gagal menghapus catatan");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<>
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="pb-3 border-b border-slate-100">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
							<span className="w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center shrink-0">
								<StickyNote className="w-3 h-3 text-amber-600" />
							</span>
							Catatan
							<span className="text-xs font-normal text-slate-400">(opsional)</span>
							{notes.length > 0 && (
								<span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
									{notes.length}
								</span>
							)}
						</CardTitle>
						{canEdit && !showAddForm && (
							<Button
								size="sm"
								variant="outline"
								onClick={() => setShowAddForm(true)}
								className="h-7 text-xs gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
							>
								<MessageSquarePlus className="w-3.5 h-3.5" />
								Tambah Catatan
							</Button>
						)}
					</div>
				</CardHeader>

				<CardContent className="p-5 space-y-4">
					{/* Add form */}
					{canEdit && showAddForm && (
						<div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
							<div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
								<Pencil className="w-3.5 h-3.5" />
								Catatan baru
							</div>
							<Textarea
								placeholder="Tuliskan catatan assessment, misalnya: kondisi khusus, rekomendasi tindak lanjut, dsb."
								value={newContent}
								onChange={(e) => setNewContent(e.target.value)}
								rows={3}
								className="resize-none text-sm bg-white border-amber-200 focus-visible:ring-amber-400/30"
								autoFocus
							/>
							<div className="flex items-center justify-between gap-2">
								<p className="text-[11px] text-slate-400">
									{newContent.length} karakter
								</p>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											setShowAddForm(false);
											setNewContent("");
										}}
										className="h-8 text-xs gap-1"
									>
										<X className="w-3.5 h-3.5" />
										Batal
									</Button>
									<Button
										size="sm"
										onClick={handleAdd}
										disabled={isAdding || !newContent.trim()}
										className="h-8 text-xs gap-1.5 text-white"
										style={{ backgroundColor: "#d97706" }}
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
						</div>
					)}

					{/* Notes list */}
					{isLoadingNotes ? (
						<div className="flex items-center justify-center py-8 gap-2 text-slate-400">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span className="text-sm">Memuat catatan...</span>
						</div>
					) : notes.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
							<div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
								<StickyNote className="w-5 h-5 text-slate-300" />
							</div>
							<p className="text-sm text-slate-500 font-medium">Belum ada catatan</p>
							<p className="text-xs text-slate-400">
								{canEdit
									? "Klik \"Tambah Catatan\" untuk menambahkan catatan pertama"
									: "Tidak ada catatan untuk assessment ini"}
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{notes.map((note, index) => (
								<div
									key={note.id}
									className="group relative rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-150"
								>
									{/* Left accent bar */}
									<div
										className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
										style={{ backgroundColor: index % 2 === 0 ? "#0517B0" : "#d97706", left: "12px" }}
									/>

									{editingId === note.id ? (
										/* Edit mode */
										<div className="p-4 pl-6 space-y-3">
											<Textarea
												value={editContent}
												onChange={(e) => setEditContent(e.target.value)}
												rows={3}
												className="resize-none text-sm bg-white"
												autoFocus
											/>
											<div className="flex items-center justify-between gap-2">
												<p className="text-[11px] text-slate-400">
													{editContent.length} karakter
												</p>
												<div className="flex gap-2">
													<Button
														size="sm"
														variant="outline"
														onClick={handleCancelEdit}
														className="h-7 text-xs gap-1"
													>
														<X className="w-3.5 h-3.5" />
														Batal
													</Button>
													<Button
														size="sm"
														onClick={() => handleSaveEdit(note.id)}
														disabled={isSavingEdit || !editContent.trim()}
														className="h-7 text-xs gap-1.5 text-white"
														style={{ backgroundColor: "#0517B0" }}
													>
														{isSavingEdit ? (
															<Loader2 className="w-3.5 h-3.5 animate-spin" />
														) : (
															<Save className="w-3.5 h-3.5" />
														)}
														Simpan
													</Button>
												</div>
											</div>
										</div>
									) : (
										/* View mode */
										<div className="p-4 pl-6">
											<p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
												{note.content}
											</p>
											<div className="flex items-center justify-between mt-2.5 gap-2">
												<div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
													<span className="font-medium text-slate-500">
														{note.author?.fullName ?? note.author?.username ?? "Pengguna"}
													</span>
													<span>·</span>
													<span
														className="flex items-center gap-1"
														title={formatDateTime(note.createdAt)}
													>
														<Clock className="w-3 h-3" />
														{getRelativeTime(note.createdAt)}
													</span>
													{note.updatedAt !== note.createdAt && (
														<span className="text-slate-300 italic">(diedit)</span>
													)}
												</div>
												{canEdit && (
													<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
														<button
															type="button"
															onClick={() => handleStartEdit(note)}
															className="p-1.5 rounded-md hover:bg-blue-50 text-slate-400 hover:text-[#0517B0] transition-colors"
															title="Edit catatan"
														>
															<Edit2 className="w-3.5 h-3.5" />
														</button>
														<button
															type="button"
															onClick={() => handleConfirmDelete(note.id)}
															disabled={deletingId === note.id}
															className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50"
															title="Hapus catatan"
														>
															{deletingId === note.id ? (
																<Loader2 className="w-3.5 h-3.5 animate-spin" />
															) : (
																<Trash2 className="w-3.5 h-3.5" />
															)}
														</button>
													</div>
												)}
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					)}

					{/* Show add button at bottom if notes exist */}
					{canEdit && !showAddForm && notes.length > 0 && (
						<button
							type="button"
							onClick={() => setShowAddForm(true)}
							className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/40 transition-colors"
						>
							<MessageSquarePlus className="w-3.5 h-3.5" />
							Tambah catatan lagi
						</button>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirm Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Catatan?</AlertDialogTitle>
						<AlertDialogDescription>
							Catatan ini akan dihapus secara permanen dan tidak dapat dipulihkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={!!deletingId}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={!!deletingId}
							className="bg-rose-600 hover:bg-rose-700 text-white"
						>
							{deletingId && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AssessmentFormCard({
	studentId,
	assessment,
	canEdit,
	token,
	onRefresh,
}: AssessmentFormCardProps) {
	return (
		<div className="space-y-5">
			{/* Score + PDF — 2 column grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				<ScoreCard
					studentId={studentId}
					assessment={assessment}
					canEdit={canEdit}
					onRefresh={onRefresh}
				/>
				<PdfCard
					studentId={studentId}
					assessment={assessment}
					canEdit={canEdit}
					token={token}
					onRefresh={onRefresh}
				/>
			</div>

			{/* Notes — full width, independent data fetch */}
			<NotesSection
				studentId={studentId}
				canEdit={canEdit}
			/>
		</div>
	);
}
