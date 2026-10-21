"use client";

import {
	AlertTriangle,
	Calendar,
	CheckCircle,
	Clock,
	FileText,
	Loader2,
	Plus,
	ShieldAlert,
	Sparkles,
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
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	DISCIPLINE_CATEGORIES,
	getDisciplineCategoryConfig,
	type PaData,
	type StudentNote,
} from "./types";

interface TabChecklistPaProps {
	studentId: number;
	paData: PaData | null;
	disciplineNotes: StudentNote[];
	counselingLogsCount: number;
	isPa: boolean;
	canEdit: boolean;
	isSaving: boolean;
	loadingItem: string | null;
	onChecklistChange: (field: string, value: boolean) => Promise<void>;
	onSaveNotes: (notes: string) => Promise<void>;
	onAddDisciplineNote: (data: {
		content: string;
		date: string;
		category: string;
	}) => Promise<void>;
	onDeleteDisciplineNote: (noteId: number) => Promise<void>;
	onAcc: () => Promise<void>;
	onCancelAcc: () => Promise<void>;
}

function formatNoteDate(dateStr?: string | null): string {
	if (!dateStr) return "-";
	try {
		return new Intl.DateTimeFormat("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
		}).format(new Date(dateStr));
	} catch {
		return dateStr;
	}
}

export function TabChecklistPa({
	studentId,
	paData,
	disciplineNotes,
	counselingLogsCount,
	isPa,
	canEdit,
	isSaving,
	loadingItem,
	onChecklistChange,
	onAddDisciplineNote,
	onDeleteDisciplineNote,
}: TabChecklistPaProps) {
	// Form state for adding new discipline note
	const [isAddingNote, setIsAddingNote] = useState(false);
	const [noteDate, setNoteDate] = useState(
		() => new Date().toISOString().split("T")[0],
	);
	const [noteCategory, setNoteCategory] = useState("umum");
	const [noteContent, setNoteContent] = useState("");

	// Delete state
	const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const checklistItems = [
		{
			id: "counselingDone",
			label: "Sesi Konseling",
			desc: `${counselingLogsCount} sesi telah terlaksana`,
			checked: !!paData?.counselingDone,
			docKey: "counseling_done",
			showBadge: counselingLogsCount >= 3 && !paData?.counselingDone,
		},
		{
			id: "mentalStable",
			label: "Kondisi Mental Stabil",
			desc: "Tidak ada indikasi masalah psikologis",
			checked: !!paData?.mentalStable,
			docKey: "mental_stable",
			showBadge: false,
		},
		{
			id: "disciplineGood",
			label: "Kedisiplinan Baik",
			desc: "Berdasarkan pemantauan asrama/harian",
			checked: !!paData?.disciplineGood,
			docKey: "discipline_good",
			showBadge: false,
		},
	];

	const completedCount = checklistItems.filter((i) => i.checked).length;

	const handleCreateNote = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!noteContent.trim()) {
			toast.error("Catatan kedisiplinan tidak boleh kosong");
			return;
		}

		await onAddDisciplineNote({
			content: noteContent.trim(),
			date: noteDate,
			category: noteCategory,
		});

		setNoteContent("");
		setNoteCategory("umum");
		setIsAddingNote(false);
	};

	const handleDeleteNote = async () => {
		if (!pendingDeleteId) return;
		await onDeleteDisciplineNote(pendingDeleteId);
		setShowDeleteDialog(false);
		setPendingDeleteId(null);
	};

	return (
		<div className="space-y-8">
			{/* Grid: Checklist & Catatan Kedisiplinan */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
				{/* CHECKLIST PA */}
				<div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
					<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							CHECKLIST PA
						</h3>
						<Badge
							variant="outline"
							className="text-xs bg-white text-slate-600 border-slate-200 font-semibold"
						>
							{completedCount}/3 Selesai
						</Badge>
					</div>
					<div className="p-5 space-y-4">
						{checklistItems.map((item) => (
							<div
								key={item.id}
								className="flex flex-col rounded-lg border bg-white overflow-hidden border-slate-200"
							>
								<div
									className={`flex items-center gap-4 p-4 transition-colors ${
										item.checked
											? "bg-emerald-50 border-b border-emerald-200"
											: "bg-slate-50 border-b border-slate-200"
									}`}
								>
									<Checkbox
										id={item.id}
										checked={item.checked}
										onCheckedChange={(checked) =>
											onChecklistChange(item.id, checked === true)
										}
										disabled={!canEdit || loadingItem === item.id}
										className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
									/>
									<label
										htmlFor={item.id}
										className="flex-1 cursor-pointer block"
									>
										<div className="text-sm font-bold text-slate-800 flex items-center gap-2">
											{item.label}
											{loadingItem === item.id && (
												<Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
											)}
										</div>
										<p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
									</label>
									<div>
										{item.checked ? (
											<Tooltip>
												<TooltipTrigger>
													<CheckCircle className="w-5 h-5 text-emerald-500" />
												</TooltipTrigger>
												<TooltipContent>
													Terakhir diperbarui:{" "}
													{paData?.updatedAt
														? new Date(paData.updatedAt).toLocaleString("id-ID")
														: "-"}
												</TooltipContent>
											</Tooltip>
										) : (
											<Clock className="w-5 h-5 text-slate-400" />
										)}
									</div>
								</div>
								<div className="p-4 bg-white border-t border-slate-100">
									<div className="flex items-center justify-between mb-2">
										<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
											Lampiran Dokumen
										</span>
									</div>
									<DocumentUpload
										studentId={studentId}
										panel="pa"
										documentKey={item.docKey}
										canEdit={canEdit}
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* CATATAN KEDISIPLINAN */}
				<div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
					<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<ShieldAlert className="w-4 h-4 text-amber-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								CATATAN KEDISIPLINAN
							</h3>
							<Badge
								variant="secondary"
								className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60"
							>
								{disciplineNotes.length}
							</Badge>
						</div>

						{canEdit && !isAddingNote && (
							<Button
								size="sm"
								variant="outline"
								onClick={() => setIsAddingNote(true)}
								className="h-8 text-xs font-semibold gap-1.5 border-amber-300 text-amber-900 bg-amber-50/50 hover:bg-amber-100/70"
							>
								<Plus className="w-3.5 h-3.5 text-amber-700" />
								<span>Tambah Catatan</span>
							</Button>
						)}
					</div>

					<div className="p-5 flex-1 flex flex-col space-y-4">
						{/* Form Tambah Catatan */}
						{canEdit && isAddingNote && (
							<form
								onSubmit={handleCreateNote}
								className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-3.5 shadow-2xs animate-in fade-in-50 duration-150"
							>
								<div className="flex items-center justify-between border-b border-amber-100 pb-2">
									<p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<Sparkles className="w-3.5 h-3.5 text-amber-600" />
										Input Catatan Kedisiplinan Baru
									</p>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setIsAddingNote(false)}
										className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
									>
										<X className="w-3.5 h-3.5" />
									</Button>
								</div>

								{/* Row: Tanggal & Kategori */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
											<Calendar className="w-3.5 h-3.5 text-slate-400" />
											Tanggal Kejadian / Catatan
										</Label>
										<Input
											type="date"
											value={noteDate}
											onChange={(e) => setNoteDate(e.target.value)}
											className="h-9 text-xs bg-white border-slate-200"
											required
										/>
									</div>

									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
											<AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
											Kategori / Tingkat Kedisiplinan
										</Label>
										<Select
											value={noteCategory}
											onValueChange={(val) => setNoteCategory(val || "umum")}
										>
											<SelectTrigger className="h-9 text-xs bg-white border-slate-200">
												<SelectValue placeholder="Pilih kategori" />
											</SelectTrigger>
											<SelectContent>
												{Object.entries(DISCIPLINE_CATEGORIES).map(
													([key, cfg]) => (
														<SelectItem
															key={key}
															value={key}
															className="text-xs"
														>
															<span className="font-medium">{cfg.label}</span>
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
									</div>
								</div>

								{/* Deskripsi Catatan */}
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
										<span>Uraian / Isi Catatan</span>
										<span className="text-[10px] text-slate-400 font-normal">
											{noteContent.length} karakter
										</span>
									</Label>
									<Textarea
										value={noteContent}
										onChange={(e) => setNoteContent(e.target.value)}
										placeholder="Tuliskan rincian kejadian, pelanggaran, pembinaan, atau apresiasi kedisiplinan..."
										rows={3}
										className="text-xs bg-white resize-none border-slate-200 focus:border-amber-400"
										required
										autoFocus
									/>
								</div>

								{/* Form Actions */}
								<div className="flex justify-end items-center gap-2 pt-1">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											setIsAddingNote(false);
											setNoteContent("");
										}}
										className="h-8 text-xs"
									>
										Batal
									</Button>
									<Button
										type="submit"
										size="sm"
										disabled={isSaving || !noteContent.trim()}
										className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shadow-2xs"
									>
										{isSaving ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										) : (
											<Plus className="w-3.5 h-3.5" />
										)}
										Simpan Catatan
									</Button>
								</div>
							</form>
						)}

						{/* List Catatan Kedisiplinan */}
						{disciplineNotes.length === 0 ? (
							<div className="p-8 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200 flex-1 flex flex-col items-center justify-center">
								<ShieldAlert className="w-8 h-8 text-slate-300 mb-2" />
								<p className="text-xs font-semibold text-slate-600">
									Belum ada catatan kedisiplinan
								</p>
								<p className="text-[11px] text-slate-400 mt-1 max-w-xs">
									Catatan kedisiplinan dan pembinaan yang dimasukkan di sini
									terintegrasi langsung dengan panel Akademik.
								</p>
							</div>
						) : (
							<div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
								{disciplineNotes.map((note) => {
									const catConfig = getDisciplineCategoryConfig(note.category);
									return (
										<div
											key={note.id}
											className="group relative p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all duration-150"
										>
											<div className="flex items-start justify-between gap-2.5">
												<div className="space-y-1.5 flex-1 min-w-0">
													{/* Category Badge & Date */}
													<div className="flex items-center flex-wrap gap-2">
														<span
															className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${catConfig.badgeClass}`}
														>
															{catConfig.label}
														</span>
														<span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
															<Clock className="w-3 h-3 text-slate-400" />
															{formatNoteDate(note.date || note.createdAt)}
														</span>
														{note.createdByUser?.fullName && (
															<span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
																Oleh: {note.createdByUser.fullName}
															</span>
														)}
													</div>

													{/* Content */}
													<p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
														{note.content}
													</p>
												</div>

												{/* Action Delete */}
												{canEdit && (
													<button
														type="button"
														onClick={() => {
															setPendingDeleteId(note.id);
															setShowDeleteDialog(true);
														}}
														className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-all"
														title="Hapus catatan kedisiplinan"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Dialog Konfirmasi Hapus */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Catatan Kedisiplinan?</AlertDialogTitle>
						<AlertDialogDescription>
							Catatan ini akan dihapus dari riwayat kedisiplinan mahasiswa di
							panel PA dan panel Akademik secara permanen.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSaving}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteNote}
							disabled={isSaving}
							className="bg-rose-600 hover:bg-rose-700 text-white"
						>
							{isSaving && (
								<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
							)}
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
