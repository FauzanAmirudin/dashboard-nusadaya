"use client";

import { BookMarked, Edit2, PlusCircle, Trash2 } from "lucide-react";
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
	lainnya: "Lainnya",
};

const LANGUAGE_COLORS: Record<string, string> = {
	inggris: "bg-blue-50 text-blue-700 border-blue-200",
	mandarin: "bg-red-50 text-red-700 border-red-200",
	jepang: "bg-rose-50 text-rose-700 border-rose-200",
	jerman: "bg-amber-50 text-amber-700 border-amber-200",
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
	vocabCount: "",
	sentenceCount: "",
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
	const [isEditing, setIsEditing] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);

	// Delete dialog
	const [deleteId, setDeleteId] = useState<number | null>(null);

	const totalVocab = hafalanSessions.reduce((acc, s) => acc + s.vocabCount, 0);
	const totalSentence = hafalanSessions.reduce(
		(acc, s) => acc + s.sentenceCount,
		0,
	);

	const handleSubmit = async () => {
		if (form.language === "lainnya" && !form.languageCustom.trim()) {
			toast.error("Nama bahasa kustom harus diisi");
			return;
		}

		const vCount = Number(form.vocabCount) || 0;
		const sCount = Number(form.sentenceCount) || 0;

		if (vCount <= 0 && sCount <= 0) {
			toast.error(
				"Minimal salah satu antara Kosakata atau Kalimat harus lebih dari 0",
			);
			return;
		}

		if (isEditing && editingId) {
			await onEditHafalan(editingId, {
				...form,
				vocabCount: vCount,
				sentenceCount: sCount,
			});
			setIsEditing(false);
			setEditingId(null);
		} else {
			await onAddHafalan({
				...form,
				vocabCount: vCount,
				sentenceCount: sCount,
			});
		}

		setForm(INITIAL_FORM);
	};

	const startEdit = (session: HafalanSession) => {
		setIsEditing(true);
		setEditingId(session.id);
		setForm({
			language: session.language,
			languageCustom: session.languageCustom ?? "",
			vocabCount: session.vocabCount,
			sentenceCount: session.sentenceCount,
			date: new Date(session.createdAt).toISOString().split("T")[0],
		});
	};

	const cancelEdit = () => {
		setIsEditing(false);
		setEditingId(null);
		setForm(INITIAL_FORM);
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
						<div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
									<PlusCircle className="w-4 h-4 text-blue-600" />
									{isEditing
										? "Edit Setoran Hafalan"
										: "Input Setoran Hafalan Baru"}
								</h4>
								{isEditing && (
									<Button
										variant="ghost"
										size="sm"
										onClick={cancelEdit}
										className="h-7 text-xs text-slate-500"
									>
										Batal Edit
									</Button>
								)}
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
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
											<SelectItem value="lainnya">Lainnya...</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{form.language === "lainnya" && (
									<div>
										<Label className="text-xs font-medium text-slate-700 block mb-1">
											Nama Bahasa Kustom *
										</Label>
										<Input
											placeholder="Contoh: Korea / Arab"
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

								<div>
									<Label className="text-xs font-medium text-slate-700 block mb-1">
										Jumlah Kosakata
									</Label>
									<Input
										type="number"
										min="0"
										placeholder="Contoh: 25"
										className="bg-white"
										value={form.vocabCount}
										onChange={(e) =>
											setForm((p) => ({
												...p,
												vocabCount:
													e.target.value === "" ? "" : Number(e.target.value),
											}))
										}
									/>
								</div>

								<div>
									<Label className="text-xs font-medium text-slate-700 block mb-1">
										Jumlah Kalimat
									</Label>
									<Input
										type="number"
										min="0"
										placeholder="Contoh: 10"
										className="bg-white"
										value={form.sentenceCount}
										onChange={(e) =>
											setForm((p) => ({
												...p,
												sentenceCount:
													e.target.value === "" ? "" : Number(e.target.value),
											}))
										}
									/>
								</div>
							</div>

							<div className="flex justify-end pt-1">
								<Button
									size="sm"
									onClick={handleSubmit}
									disabled={isSaving}
									className="bg-blue-600 hover:bg-blue-700 text-white font-medium gap-1.5"
								>
									<PlusCircle className="w-4 h-4" />
									{isEditing ? "Perbarui Setoran" : "Simpan Setoran"}
								</Button>
							</div>
						</div>
					)}

					{/* Tabel Riwayat Setoran Hafalan */}
					<div className="border border-slate-200 rounded-lg overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50/80">
									<TableHead className="text-xs font-semibold text-slate-600">
										Tanggal
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-600">
										Bahasa
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-600 text-center">
										Kosakata
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-600 text-center">
										Kalimat
									</TableHead>
									{canEdit && (
										<TableHead className="text-xs font-semibold text-slate-600 text-right pr-4">
											Aksi
										</TableHead>
									)}
								</TableRow>
							</TableHeader>
							<TableBody>
								{hafalanSessions.map((session) => (
									<TableRow
										key={session.id}
										className="hover:bg-slate-50/60 transition-colors"
									>
										<TableCell className="text-sm font-medium text-slate-700">
											{new Date(session.createdAt).toLocaleDateString("id-ID", {
												day: "2-digit",
												month: "short",
												year: "numeric",
											})}
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={`text-xs font-medium ${getLanguageBadgeClass(
													session.language,
												)}`}
											>
												{getLanguageLabel(session)}
											</Badge>
										</TableCell>
										<TableCell className="text-center font-bold text-emerald-700">
											+{session.vocabCount} kata
										</TableCell>
										<TableCell className="text-center font-bold text-amber-700">
											+{session.sentenceCount} kalimat
										</TableCell>
										{canEdit && (
											<TableCell className="text-right pr-4">
												<div className="flex items-center justify-end gap-1.5">
													<button
														type="button"
														onClick={() => startEdit(session)}
														className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
														title="Edit setoran ini"
													>
														<Edit2 className="w-4 h-4" />
													</button>
													<button
														type="button"
														onClick={() => setDeleteId(session.id)}
														className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
														title="Hapus setoran ini"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</TableCell>
										)}
									</TableRow>
								))}
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

			{/* Delete Dialog */}
			<AlertDialog
				open={deleteId !== null}
				onOpenChange={(open) => !open && setDeleteId(null)}
			>
				<AlertDialogContent>
					<AlertDialogTitle>Hapus Setoran Hafalan?</AlertDialogTitle>
					<AlertDialogDescription>
						Apakah Anda yakin ingin menghapus data sesi setoran hafalan ini?
						Tindakan ini tidak dapat dibatalkan.
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
