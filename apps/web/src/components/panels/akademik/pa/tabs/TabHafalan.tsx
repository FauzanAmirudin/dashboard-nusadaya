"use client";

import {
	BookMarked,
	Edit2,
	Loader2,
	Plus,
	Save,
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
import { API_URL, getToken } from "@/lib/eden";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HafalanSession {
	id: number;
	language: string;
	languageCustom: string | null;
	vocabCount: number;
	sentenceCount: number;
	createdAt: string;
	updatedAt: string;
}

interface Props {
	studentId: number;
	canEdit: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LANGUAGE_LABELS: Record<string, string> = {
	inggris: "Inggris 🇬🇧",
	mandarin: "Mandarin 🇨🇳",
	lainnya: "Lainnya",
};

const LANGUAGE_COLORS: Record<string, string> = {
	inggris: "bg-blue-50 text-blue-700 border-blue-200",
	mandarin: "bg-red-50 text-red-700 border-red-200",
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

// ── Form State ────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
	language: "inggris",
	languageCustom: "",
	vocabCount: 0,
	sentenceCount: 0,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function TabHafalan({ studentId, canEdit }: Props) {
	const [sessions, setSessions] = useState<HafalanSession[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Add form
	const [showAddForm, setShowAddForm] = useState(false);
	const [addForm, setAddForm] = useState(INITIAL_FORM);
	const [isAdding, setIsAdding] = useState(false);

	// Edit dialog
	const [editingSession, setEditingSession] = useState<HafalanSession | null>(
		null,
	);
	const [editForm, setEditForm] = useState(INITIAL_FORM);
	const [isSavingEdit, setIsSavingEdit] = useState(false);

	// Delete dialog
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

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
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchData();
	}, [fetchData]);

	// ── Add ────────────────────────────────────────────────────────────────────

	const handleAdd = async () => {
		if (addForm.language === "lainnya" && !addForm.languageCustom.trim()) {
			toast.error("Nama bahasa tidak boleh kosong");
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
					vocabCount: addForm.vocabCount,
					sentenceCount: addForm.sentenceCount,
				}),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Setoran hafalan ditambahkan");
			setShowAddForm(false);
			setAddForm(INITIAL_FORM);
			fetchData();
		} catch {
			toast.error("Gagal menambahkan hafalan");
		} finally {
			setIsAdding(false);
		}
	};

	// ── Edit ───────────────────────────────────────────────────────────────────

	const handleStartEdit = (session: HafalanSession) => {
		setEditingSession(session);
		setEditForm({
			language: session.language,
			languageCustom: session.languageCustom ?? "",
			vocabCount: session.vocabCount,
			sentenceCount: session.sentenceCount,
		});
	};

	const handleSaveEdit = async () => {
		if (!editingSession) return;
		if (editForm.language === "lainnya" && !editForm.languageCustom.trim()) {
			toast.error("Nama bahasa tidak boleh kosong");
			return;
		}
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
						vocabCount: editForm.vocabCount,
						sentenceCount: editForm.sentenceCount,
					}),
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Hafalan diperbarui");
			setEditingSession(null);
			fetchData();
		} catch {
			toast.error("Gagal memperbarui hafalan");
		} finally {
			setIsSavingEdit(false);
		}
	};

	// ── Delete ─────────────────────────────────────────────────────────────────

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
					<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
						<CardContent className="p-4">
							<p className="text-xs text-slate-500 font-medium">
								Total Sesi Setoran
							</p>
							<p className="text-2xl font-bold text-slate-900 mt-1">
								{sessions.length}
							</p>
						</CardContent>
					</Card>
					<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
						<CardContent className="p-4">
							<p className="text-xs text-slate-500 font-medium">
								Total Kosakata
							</p>
							<p className="text-2xl font-bold text-slate-900 mt-1">
								{totalVocab.toLocaleString("id-ID")}
							</p>
						</CardContent>
					</Card>
					<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
						<CardContent className="p-4">
							<p className="text-xs text-slate-500 font-medium">
								Total Kalimat
							</p>
							<p className="text-2xl font-bold text-slate-900 mt-1">
								{totalSentence.toLocaleString("id-ID")}
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Main Table Card */}
				<Card className="bg-white border-slate-200 shadow-sm">
					<CardHeader className="pb-3 border-b border-slate-100">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
								<span className="w-5 h-5 rounded bg-[#0517B0]/10 flex items-center justify-center">
									<BookMarked className="w-3 h-3 text-[#0517B0]" />
								</span>
								Riwayat Setoran Hafalan
							</CardTitle>
							{canEdit && !showAddForm && (
								<Button
									size="sm"
									onClick={() => setShowAddForm(true)}
									className="h-8 text-xs gap-1.5 text-white"
									style={{ backgroundColor: "#0517B0" }}
								>
									<Plus className="w-3.5 h-3.5" />
									Tambah Hafalan
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent className="p-5 space-y-4">
						{/* Add Form */}
						{canEdit && showAddForm && (
							<div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
								<p className="text-xs font-semibold text-slate-600">
									Tambah Setoran Hafalan
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<Label className="text-xs font-medium text-slate-600">
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
											<SelectTrigger className="h-9 text-sm">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="inggris">🇬🇧 Inggris</SelectItem>
												<SelectItem value="mandarin">🇨🇳 Mandarin</SelectItem>
												<SelectItem value="lainnya">Lainnya...</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{addForm.language === "lainnya" && (
										<div className="space-y-1.5">
											<Label className="text-xs font-medium text-slate-600">
												Nama Bahasa
											</Label>
											<Input
												placeholder="Contoh: Jepang, Korea..."
												value={addForm.languageCustom}
												onChange={(e) =>
													setAddForm((p) => ({
														...p,
														languageCustom: e.target.value,
													}))
												}
												className="h-9 text-sm"
											/>
										</div>
									)}
									<div className="space-y-1.5">
										<Label className="text-xs font-medium text-slate-600">
											Jumlah Kosakata
										</Label>
										<Input
											type="number"
											min={0}
											placeholder="0"
											value={addForm.vocabCount || ""}
											onChange={(e) =>
												setAddForm((p) => ({
													...p,
													vocabCount: Math.max(0, Number(e.target.value) || 0),
												}))
											}
											className="h-9 text-sm"
										/>
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs font-medium text-slate-600">
											Jumlah Kalimat
										</Label>
										<Input
											type="number"
											min={0}
											placeholder="0"
											value={addForm.sentenceCount || ""}
											onChange={(e) =>
												setAddForm((p) => ({
													...p,
													sentenceCount: Math.max(
														0,
														Number(e.target.value) || 0,
													),
												}))
											}
											className="h-9 text-sm"
										/>
									</div>
								</div>
								<div className="flex justify-end gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											setShowAddForm(false);
											setAddForm(INITIAL_FORM);
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
									</p>
								)}
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow className="bg-slate-50/60">
										<TableHead className="text-xs font-semibold text-slate-600">
											Bahasa
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600 text-right">
											Progres Kosakata
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600 text-right">
											Progres Kalimat
										</TableHead>
										{canEdit && (
											<TableHead className="text-xs font-semibold text-slate-600 text-center">
												Aksi
											</TableHead>
										)}
									</TableRow>
								</TableHeader>
								<TableBody>
									{sessions.map((session) => (
										<TableRow
											key={session.id}
											className="hover:bg-slate-50/60 transition-colors"
										>
											<TableCell>
												<Badge
													className={`${getLanguageBadgeClass(session.language)} border text-xs`}
												>
													{getLanguageLabel(session)}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<span className="text-sm font-semibold text-slate-800">
													{session.vocabCount.toLocaleString("id-ID")}
												</span>
												<span className="text-xs text-slate-400 ml-1">
													kata
												</span>
											</TableCell>
											<TableCell className="text-right">
												<span className="text-sm font-semibold text-slate-800">
													{session.sentenceCount.toLocaleString("id-ID")}
												</span>
												<span className="text-xs text-slate-400 ml-1">
													kalimat
												</span>
											</TableCell>
											{canEdit && (
												<TableCell className="text-center">
													<div className="flex items-center justify-center gap-1">
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
													</div>
												</TableCell>
											)}
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Edit Dialog */}
			{editingSession && (
				<AlertDialog
					open={!!editingSession}
					onOpenChange={(o) => !o && setEditingSession(null)}
				>
					<AlertDialogContent className="max-w-md">
						<AlertDialogHeader>
							<AlertDialogTitle>Edit Setoran Hafalan</AlertDialogTitle>
						</AlertDialogHeader>
						<div className="space-y-3 py-2">
							<div className="space-y-1.5">
								<Label className="text-xs font-medium text-slate-600">
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
										<SelectItem value="lainnya">Lainnya...</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{editForm.language === "lainnya" && (
								<div className="space-y-1.5">
									<Label className="text-xs font-medium text-slate-600">
										Nama Bahasa
									</Label>
									<Input
										placeholder="Contoh: Jepang, Korea..."
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
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label className="text-xs font-medium text-slate-600">
										Jumlah Kosakata
									</Label>
									<Input
										type="number"
										min={0}
										value={editForm.vocabCount || ""}
										onChange={(e) =>
											setEditForm((p) => ({
												...p,
												vocabCount: Math.max(0, Number(e.target.value) || 0),
											}))
										}
										className="h-9 text-sm"
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs font-medium text-slate-600">
										Jumlah Kalimat
									</Label>
									<Input
										type="number"
										min={0}
										value={editForm.sentenceCount || ""}
										onChange={(e) =>
											setEditForm((p) => ({
												...p,
												sentenceCount: Math.max(0, Number(e.target.value) || 0),
											}))
										}
										className="h-9 text-sm"
									/>
								</div>
							</div>
						</div>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={isSavingEdit}>
								Batal
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleSaveEdit}
								disabled={isSavingEdit}
								className="text-white"
								style={{ backgroundColor: "#0517B0" }}
							>
								{isSavingEdit && (
									<Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
								)}
								Simpan
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}

			{/* Delete Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Setoran Hafalan?</AlertDialogTitle>
						<AlertDialogDescription>
							Data setoran hafalan ini akan dihapus secara permanen.
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
