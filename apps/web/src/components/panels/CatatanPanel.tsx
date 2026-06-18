"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { AlertTriangle, Filter, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

const NOTE_TYPE_CONFIG = {
	pengecualian_akademik: {
		label: "Pengecualian Akademik",
		icon: "⚠️",
		badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
	},
	izin_resmi: {
		label: "Izin Resmi",
		icon: "📄",
		badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
	},
	sedang_ods: {
		label: "Sedang ODS",
		icon: "🏫",
		badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
	},
	praktik_luar: {
		label: "Praktik Luar",
		icon: "🔧",
		badgeClass: "bg-teal-100 text-teal-800 border-teal-300",
	},
	informasi_umum: {
		label: "Informasi Umum",
		icon: "ℹ️",
		badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
	},
	lainnya: {
		label: "Lainnya",
		icon: "📝",
		badgeClass: "bg-gray-100 text-gray-800 border-gray-300",
	},
};

type NoteType = keyof typeof NOTE_TYPE_CONFIG;

interface InternalNote {
	id: number;
	studentId: number;
	authorId: number;
	note: string;
	noteType: NoteType;
	validFrom: string | Date | null;
	validUntil: string | Date | null;
	createdAt: string | Date;
	updatedAt: string | Date;
	author: {
		id: number;
		fullName: string;
		role: string;
		username: string;
	};
}

export function CatatanPanel({ studentId }: { studentId: number }) {
	const { user } = useAuthStore();
	const [notes, setNotes] = useState<InternalNote[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [filterType, setFilterType] = useState<string>("semua");

	// Dialog state
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingNote, setEditingNote] = useState<InternalNote | null>(null);
	const [formNote, setFormNote] = useState("");
	const [formNoteType, setFormNoteType] = useState<NoteType>("informasi_umum");
	const [formValidFrom, setFormValidFrom] = useState("");
	const [formValidUntil, setFormValidUntil] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const canWrite = user && ["superadmin", "akademik", "pa"].includes(user.role);

	const fetchNotes = async () => {
		setIsLoading(true);
		const res = await api.students[studentId.toString()]["internal-notes"].get(
			filterType !== "semua" ? { $query: { type: filterType } } : undefined,
		);

		if (res.data?.success && Array.isArray(res.data.data)) {
			setNotes(res.data.data as InternalNote[]);
		}
		setIsLoading(false);
	};

	useEffect(() => {
		fetchNotes();
	}, [studentId, filterType]);

	const handleOpenAdd = () => {
		setEditingNote(null);
		setFormNote("");
		setFormNoteType("informasi_umum");
		setFormValidFrom("");
		setFormValidUntil("");
		setIsDialogOpen(true);
	};

	const handleOpenEdit = (note: InternalNote) => {
		setEditingNote(note);
		setFormNote(note.note);
		setFormNoteType(note.noteType);
		setFormValidFrom(
			note.validFrom
				? new Date(note.validFrom).toISOString().split("T")[0]
				: "",
		);
		setFormValidUntil(
			note.validUntil
				? new Date(note.validUntil).toISOString().split("T")[0]
				: "",
		);
		setIsDialogOpen(true);
	};

	const handleSubmit = async () => {
		if (formNote.trim().length < 5) {
			toast.error("Catatan terlalu pendek (minimal 5 karakter)");
			return;
		}

		setIsSubmitting(true);
		try {
			const payload = {
				note: formNote,
				noteType: formNoteType,
				validFrom: formValidFrom || null,
				validUntil: formValidUntil || null,
			};

			if (editingNote) {
				const res =
					await api.students[studentId.toString()]["internal-notes"][
						editingNote.id.toString()
					].patch(payload);
				if (res.data?.success) {
					toast.success("Catatan berhasil diperbarui");
					setIsDialogOpen(false);
					fetchNotes();
				} else {
					toast.error("Gagal memperbarui catatan");
				}
			} else {
				const res =
					await api.students[studentId.toString()]["internal-notes"].post(
						payload,
					);
				if (res.data?.success) {
					toast.success("Catatan baru berhasil ditambahkan");
					setIsDialogOpen(false);
					fetchNotes();
				} else {
					toast.error("Gagal menambahkan catatan");
				}
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		}
		setIsSubmitting(false);
	};

	const handleDelete = async (noteId: number) => {
		try {
			const res =
				await api.students[studentId.toString()]["internal-notes"][
					noteId.toString()
				].delete();
			if (res.data?.success) {
				toast.success("Catatan berhasil dihapus");
				fetchNotes();
			} else {
				toast.error("Gagal menghapus catatan");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		}
	};

	if (isLoading && notes.length === 0) {
		return (
			<div className="p-8 text-center text-slate-500">
				Memuat catatan internal...
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
				<div>
					<h3 className="font-semibold text-slate-800 flex items-center gap-2">
						📝 Catatan Internal & Pengecualian
					</h3>
					<p className="text-sm text-slate-500 mt-1">
						{canWrite
							? "Kelola catatan dan log pengecualian mahasiswa"
							: "Anda hanya memiliki akses membaca catatan ini"}
					</p>
				</div>
				<div className="flex items-center gap-3 w-full sm:w-auto">
					<div className="flex items-center gap-2 w-full sm:w-auto">
						<Filter className="w-4 h-4 text-slate-400 shrink-0" />
						<Select
							value={filterType}
							onValueChange={(val) => setFilterType(val || "semua")}
						>
							<SelectTrigger className="w-full sm:w-[180px] bg-white">
								<SelectValue placeholder="Semua Kategori" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="semua">Semua Kategori</SelectItem>
								{Object.entries(NOTE_TYPE_CONFIG).map(([key, conf]) => (
									<SelectItem key={key} value={key}>
										{conf.icon} {conf.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{canWrite && (
						<Button
							onClick={handleOpenAdd}
							className="bg-[#0517B0] hover:bg-[#04128A] text-white whitespace-nowrap shrink-0"
						>
							<Plus className="w-4 h-4 mr-2" />
							Catatan
						</Button>
					)}
				</div>
			</div>

			<ScrollArea className="h-[600px] pr-4">
				{notes.length === 0 ? (
					<div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-200">
						<p className="text-slate-500 mb-2">
							Belum ada catatan untuk kategori ini.
						</p>
						{canWrite && filterType === "semua" && (
							<Button
								variant="outline"
								onClick={handleOpenAdd}
								className="mt-2 text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/5"
							>
								+ Tambah Catatan Pertama
							</Button>
						)}
					</div>
				) : (
					<div className="space-y-4">
						{notes.map((note) => {
							const isAuthor = note.authorId === user?.id;
							const isSuperadmin = user?.role === "superadmin";
							const canEditDelete = isAuthor || isSuperadmin;
							const conf =
								NOTE_TYPE_CONFIG[note.noteType] || NOTE_TYPE_CONFIG.lainnya;

							let periodText = "";
							if (note.validFrom && note.validUntil) {
								periodText = `${format(new Date(note.validFrom), "dd MMM yy")} - ${format(new Date(note.validUntil), "dd MMM yy")}`;
							} else if (note.validFrom) {
								periodText = `Mulai ${format(new Date(note.validFrom), "dd MMM yy")}`;
							} else if (note.validUntil) {
								periodText = `Hingga ${format(new Date(note.validUntil), "dd MMM yy")}`;
							}

							return (
								<Card
									key={note.id}
									className="border-l-4 overflow-hidden transition-all hover:shadow-md"
									style={{
										borderLeftColor: conf.badgeClass.includes("amber")
											? "#d97706"
											: conf.badgeClass.includes("blue")
												? "#2563eb"
												: conf.badgeClass.includes("purple")
													? "#9333ea"
													: conf.badgeClass.includes("teal")
														? "#0d9488"
														: "#94a3b8",
									}}
								>
									<CardContent className="p-0">
										<div className="p-4 sm:p-5">
											<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
												<div>
													<div className="flex items-center gap-2 mb-2">
														<Badge
															className={`${conf.badgeClass} rounded-md px-2 py-0.5 text-xs font-semibold`}
														>
															{conf.icon} {conf.label}
														</Badge>
														{periodText && (
															<Badge
																variant="outline"
																className="text-xs bg-white text-slate-600 border-slate-200"
															>
																⏱️ {periodText}
															</Badge>
														)}
													</div>
													<div className="text-sm text-slate-500 font-medium">
														{format(
															new Date(note.createdAt),
															"dd MMM yyyy • HH:mm",
															{ locale: idLocale },
														)}{" "}
														WIB
														<span className="mx-2 text-slate-300">|</span>
														<span className="text-slate-700 font-semibold">
															{note.author.fullName}
														</span>
														<span className="text-xs text-slate-400 ml-1">
															({note.author.role})
														</span>
													</div>
												</div>

												{canEditDelete && (
													<div className="flex items-center gap-1 self-end sm:self-start">
														<Button
															variant="ghost"
															size="sm"
															className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
															onClick={() => handleOpenEdit(note)}
														>
															<Pencil className="w-4 h-4" />
														</Button>
														<AlertDialog>
															<AlertDialogTrigger
																render={(props: any) => (
																	<Button
																		{...props}
																		variant="ghost"
																		size="sm"
																		className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
																	>
																		<Trash2 className="w-4 h-4" />
																	</Button>
																)}
															/>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Hapus Catatan?
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Tindakan ini tidak dapat dibatalkan. Catatan
																		akan dihapus secara permanen.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Batal</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() => handleDelete(note.id)}
																		className="bg-rose-600 hover:bg-rose-700 text-white"
																	>
																		Ya, Hapus
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</div>
												)}
											</div>
											<div className="bg-slate-50/50 p-3 sm:p-4 rounded-lg border border-slate-100 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
												{note.note}
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</ScrollArea>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{editingNote
								? "Edit Catatan Internal"
								: "Tambah Catatan Internal"}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-5 py-4">
						<div className="space-y-3">
							<Label className="text-slate-700 font-semibold">
								Tipe Catatan
							</Label>
							<RadioGroup
								value={formNoteType}
								onValueChange={(val) => setFormNoteType(val as NoteType)}
								className="grid grid-cols-2 gap-3"
							>
								{Object.entries(NOTE_TYPE_CONFIG).map(([key, conf]) => (
									<Label
										key={key}
										htmlFor={`type-${key}`}
										className={`
										flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
										${formNoteType === key ? "border-[#0517B0] bg-[#0517B0]/5" : "border-slate-200 hover:border-slate-300"}
									`}
									>
										<RadioGroupItem
											value={key}
											id={`type-${key}`}
											className="sr-only"
										/>
										<span className="text-base">{conf.icon}</span>
										<span
											className={`text-sm font-medium ${formNoteType === key ? "text-[#0517B0]" : "text-slate-700"}`}
										>
											{conf.label}
										</span>
									</Label>
								))}
							</RadioGroup>
						</div>

						<div className="space-y-3">
							<Label className="text-slate-700 font-semibold">
								Isi Catatan <span className="text-rose-500">*</span>
							</Label>
							<Textarea
								placeholder="Deskripsikan pengecualian, informasi, atau log yang relevan..."
								value={formNote}
								onChange={(e) => setFormNote(e.target.value)}
								className="min-h-[120px] resize-none"
							/>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label className="text-slate-700 font-semibold">
									Periode Berlaku (Opsional)
								</Label>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<Label className="text-xs text-slate-500">
										Mulai Tanggal
									</Label>
									<Input
										type="date"
										value={formValidFrom}
										onChange={(e) => setFormValidFrom(e.target.value)}
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs text-slate-500">
										Hingga Tanggal
									</Label>
									<Input
										type="date"
										value={formValidUntil}
										onChange={(e) => setFormValidUntil(e.target.value)}
									/>
								</div>
							</div>
							{(formNoteType === "pengecualian_akademik" ||
								formNoteType === "sedang_ods") && (
								<p className="text-xs text-amber-600 bg-amber-50 p-2 rounded flex items-start gap-1.5 border border-amber-200 mt-2">
									<AlertTriangle className="w-4 h-4 shrink-0" />
									Tipe catatan ini akan dibaca oleh panel Akademik sebagai
									pengecualian yang valid selama periode berlaku. Pastikan
									tanggal diisi jika relevan.
								</p>
							)}
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
							Batal
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={isSubmitting}
							className="bg-[#0517B0] hover:bg-[#04128A] text-white"
						>
							{isSubmitting ? "Menyimpan..." : "Simpan Catatan"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
