"use client";

import {
	CalendarDays,
	Eye,
	GraduationCap,
	Loader2,
	Megaphone,
	Pencil,
	Plus,
	RotateCcw,
	Search,
	Trash2,
	User,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import {
	Dialog,
	DialogContent,
	DialogFooter,
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
import { TiptapEditor } from "@/components/ui/TiptapEditor";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/eden";

export function TabPengumuman({
	canEdit,
	user,
}: {
	canEdit: boolean;
	user: any;
}) {
	const [announcements, setAnnouncements] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Filters
	const [cohortFilter, setCohortFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");

	// Modal states
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
	const [deleteId, setDeleteId] = useState<number | null>(null);

	const fetchAnnouncements = async () => {
		setIsLoading(true);
		try {
			const query: any = {};
			if (cohortFilter !== "all") query.targetCohort = cohortFilter;
			if (searchQuery) query.search = searchQuery;

			const { data, error } = await (api as any).scheduling.announcements.get({
				$query: query,
			});
			if (!error && data?.success) {
				setAnnouncements(data.data || []);
			}
		} catch {
			toast.error("Gagal memuat pengumuman");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			fetchAnnouncements();
		}, 300);
		return () => clearTimeout(timeoutId);
	}, [cohortFilter, searchQuery]);

	// Extract unique cohorts dynamically
	const dynamicCohorts = useMemo(() => {
		const cohorts = new Set<string>();
		announcements.forEach((a) => {
			if (a.targetCohort) cohorts.add(a.targetCohort.toString());
		});
		for (let i = 13; i <= 18; i++) cohorts.add(i.toString());
		return Array.from(cohorts).sort((a, b) => Number(b) - Number(a));
	}, [announcements]);

	const handleDeleteConfirm = async () => {
		if (!deleteId) return;
		try {
			const { error } = await (api as any).scheduling.announcements[
				deleteId.toString()
			].delete();
			if (!error) {
				toast.success("Pengumuman berhasil dihapus");
				fetchAnnouncements();
			} else {
				toast.error("Gagal menghapus pengumuman");
			}
		} catch {
			toast.error("Gagal menghapus pengumuman");
		} finally {
			setDeleteId(null);
		}
	};

	const hasActiveFilters = searchQuery !== "" || cohortFilter !== "all";

	const resetFilters = () => {
		setSearchQuery("");
		setCohortFilter("all");
	};

	// Helper to strip html tags for preview snippet
	const stripHtml = (html: string) => {
		if (!html) return "";
		return html.replace(/<[^>]*>?/gm, "").trim();
	};

	return (
		<div className="space-y-4">
			{/* Main Card Container */}
			<div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
				{/* Top Action & Toolbar */}
				<div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-4">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
								<Megaphone className="w-4 h-4" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
										Pengumuman Akademik
									</h2>
									<span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
										{announcements.length}
									</span>
								</div>
								<p className="text-xs text-slate-500">
									Pusat siaran informasi resmi, edaran akademik, dan agenda
									kampus
								</p>
							</div>
						</div>

						{canEdit && (
							<Button
								onClick={() => {
									setSelectedAnnouncement(null);
									setIsModalOpen(true);
								}}
								className="bg-[#0517B0] hover:bg-blue-900 text-white rounded-xl shadow-xs text-xs font-semibold px-3.5 py-2 h-9 w-full sm:w-auto"
							>
								<Plus className="w-4 h-4 mr-1.5" />
								Buat Pengumuman
							</Button>
						)}
					</div>

					{/* Search and Filters Bar */}
					<div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
						<div className="relative flex-1 min-w-[240px]">
							<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
							<Input
								placeholder="Cari judul pengumuman atau konten..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 pr-8 h-9 text-xs rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							)}
						</div>

						<div className="w-full sm:w-[180px]">
							<Select
								value={cohortFilter}
								onValueChange={(val) => setCohortFilter(val || "all")}
							>
								<SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 border-slate-200">
									<SelectValue placeholder="Semua Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan (Umum)</SelectItem>
									{dynamicCohorts.map((cohort) => (
										<SelectItem key={cohort} value={cohort}>
											Angkatan {cohort}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{hasActiveFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={resetFilters}
								className="h-9 px-2.5 text-xs text-slate-600 hover:text-slate-900 rounded-xl"
							>
								<RotateCcw className="w-3.5 h-3.5 mr-1" />
								Reset
							</Button>
						)}
					</div>
				</div>

				{/* Table Body */}
				<div className="p-0">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-16 gap-3">
							<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
							<p className="text-xs text-slate-500 font-medium">
								Memuat pengumuman...
							</p>
						</div>
					) : announcements.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center px-4">
							<div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
								<Megaphone className="w-6 h-6" />
							</div>
							<p className="text-sm font-semibold text-slate-800">
								Tidak ada pengumuman
							</p>
							<p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
								{hasActiveFilters
									? "Tidak ada pengumuman yang cocok dengan filter atau kata kunci yang dicari."
									: "Belum ada pengumuman akademik yang dipublikasikan."}
							</p>
							{hasActiveFilters ? (
								<Button
									variant="outline"
									size="sm"
									onClick={resetFilters}
									className="rounded-xl text-xs"
								>
									Reset Filter
								</Button>
							) : canEdit ? (
								<Button
									onClick={() => {
										setSelectedAnnouncement(null);
										setIsModalOpen(true);
									}}
									className="bg-[#0517B0] hover:bg-blue-900 text-white rounded-xl text-xs"
								>
									<Plus className="w-4 h-4 mr-1.5" />
									Buat Pengumuman Baru
								</Button>
							) : null}
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-slate-50/80">
									<TableRow className="border-b border-slate-100 hover:bg-transparent">
										<TableHead className="w-[140px] text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-5 py-3">
											Tanggal Publish
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3">
											Judul & Ringkasan
										</TableHead>
										<TableHead className="w-[160px] text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3">
											Target Sasaran
										</TableHead>
										<TableHead className="w-[160px] text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3">
											Diterbitkan Oleh
										</TableHead>
										<TableHead className="w-[140px] text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right pr-5 py-3">
											Aksi
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody className="divide-y divide-slate-100">
									{announcements.map((a) => {
										const previewText = stripHtml(a.description);

										return (
											<TableRow
												key={a.id}
												className="hover:bg-slate-50/60 transition-colors"
											>
												<TableCell className="pl-5 py-3.5 align-top">
													<div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
														<CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
														<span>
															{new Date(a.publishedAt).toLocaleDateString(
																"id-ID",
																{
																	day: "numeric",
																	month: "short",
																	year: "numeric",
																},
															)}
														</span>
													</div>
												</TableCell>

												<TableCell className="py-3.5">
													<div className="space-y-1 max-w-xl">
														<div className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
															{a.title}
														</div>
														{previewText && (
															<p className="text-xs text-slate-500 line-clamp-1">
																{previewText}
															</p>
														)}
													</div>
												</TableCell>

												<TableCell className="py-3.5 align-top">
													{a.targetCohort ? (
														<Badge
															variant="outline"
															className="bg-blue-50 text-[#0517B0] border-blue-200/60 text-[11px] font-semibold rounded-lg px-2 py-0.5"
														>
															<GraduationCap className="w-3 h-3 mr-1" />
															Angkatan {a.targetCohort}
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="bg-emerald-50 text-emerald-700 border-emerald-200/60 text-[11px] font-semibold rounded-lg px-2 py-0.5"
														>
															Semua Angkatan
														</Badge>
													)}
												</TableCell>

												<TableCell className="py-3.5 align-top">
													<div className="flex items-center gap-2">
														<div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
															<User className="w-3.5 h-3.5" />
														</div>
														<span className="text-xs font-medium text-slate-800 truncate max-w-[130px]">
															{a.creator?.fullName ||
																a.creator?.name ||
																"Admin"}
														</span>
													</div>
												</TableCell>

												<TableCell className="text-right pr-5 py-3.5 align-top">
													<div className="flex items-center justify-end gap-1">
														<Button
															variant="outline"
															size="sm"
															className="h-8 px-2.5 text-xs text-[#0517B0] bg-blue-50/50 hover:bg-blue-50 border-blue-200/60 rounded-lg font-medium"
															onClick={() => {
																setSelectedAnnouncement(a);
																setIsDetailModalOpen(true);
															}}
														>
															<Eye className="w-3.5 h-3.5 mr-1" /> Baca
														</Button>

														{canEdit && (
															<>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#0517B0] hover:bg-blue-50"
																	onClick={() => {
																		setSelectedAnnouncement(a);
																		setIsModalOpen(true);
																	}}
																>
																	<Pencil className="w-3.5 h-3.5" />
																</Button>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
																	onClick={() => setDeleteId(a.id)}
																>
																	<Trash2 className="w-3.5 h-3.5" />
																</Button>
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
				</div>
			</div>

			{/* Form Modal Dialog */}
			{isModalOpen && (
				<AnnouncementDialog
					announcement={selectedAnnouncement}
					onClose={() => setIsModalOpen(false)}
					onSuccess={() => {
						setIsModalOpen(false);
						fetchAnnouncements();
					}}
				/>
			)}

			{/* Detail View Reader Modal */}
			{isDetailModalOpen && selectedAnnouncement && (
				<Dialog
					open={true}
					onOpenChange={(open) => !open && setIsDetailModalOpen(false)}
				>
					<DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader className="border-b border-slate-100 pb-3">
							<div className="flex items-center gap-2 mb-1.5">
								{selectedAnnouncement.targetCohort ? (
									<Badge
										variant="outline"
										className="bg-blue-50 text-[#0517B0] border-blue-200/60 text-[11px] font-semibold rounded-lg px-2 py-0.5"
									>
										<GraduationCap className="w-3 h-3 mr-1" />
										Angkatan {selectedAnnouncement.targetCohort}
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="bg-emerald-50 text-emerald-700 border-emerald-200/60 text-[11px] font-semibold rounded-lg px-2 py-0.5"
									>
										Semua Angkatan
									</Badge>
								)}
							</div>
							<DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
								{selectedAnnouncement.title}
							</DialogTitle>
							<div className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-4">
								<span className="flex items-center gap-1.5">
									<CalendarDays className="w-3.5 h-3.5 text-slate-400" />
									{new Date(
										selectedAnnouncement.publishedAt,
									).toLocaleDateString("id-ID", {
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
								</span>
								<span className="flex items-center gap-1.5">
									<User className="w-3.5 h-3.5 text-slate-400" />
									Oleh:{" "}
									{selectedAnnouncement.creator?.fullName ||
										selectedAnnouncement.creator?.name ||
										"Admin Akademik"}
								</span>
							</div>
						</DialogHeader>

						<div
							className="py-4 prose prose-sm max-w-none prose-slate text-slate-800 leading-relaxed"
							dangerouslySetInnerHTML={{
								__html: selectedAnnouncement.description,
							}}
						/>

						<DialogFooter className="border-t border-slate-100 pt-3">
							<Button
								onClick={() => setIsDetailModalOpen(false)}
								className="rounded-xl text-xs bg-slate-800 hover:bg-slate-900 text-white font-medium"
							>
								Tutup
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* Delete Confirmation Alert Dialog */}
			<AlertDialog
				open={deleteId !== null}
				onOpenChange={(open) => !open && setDeleteId(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base font-bold text-slate-900">
							Hapus Pengumuman
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-slate-600">
							Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini
							tidak dapat dibatalkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl text-xs">
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs"
						>
							Hapus Pengumuman
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function AnnouncementDialog({
	announcement,
	onClose,
	onSuccess,
}: {
	announcement: any;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [isSaving, setIsSaving] = useState(false);
	const [form, setForm] = useState({
		title: announcement?.title || "",
		description: announcement?.description || "",
		targetCohort: announcement?.targetCohort?.toString() || "all",
		publishedAt:
			announcement?.publishedAt || new Date().toISOString().split("T")[0],
	});

	const handleSave = async () => {
		if (!form.title || !form.description || !form.publishedAt) {
			toast.error("Mohon lengkapi Judul, Deskripsi, dan Tanggal Publish");
			return;
		}

		setIsSaving(true);
		try {
			const payload = {
				...form,
				targetCohort:
					form.targetCohort === "all"
						? undefined
						: parseInt(form.targetCohort, 10),
			};

			let error;
			if (announcement?.id) {
				const res = await (api as any).scheduling.announcements[
					announcement.id.toString()
				].patch(payload);
				error = res.error;
			} else {
				const res = await (api as any).scheduling.announcements.post(payload);
				error = res.error;
			}

			if (!error) {
				toast.success(
					announcement
						? "Pengumuman diperbarui"
						: "Pengumuman berhasil dipublish",
				);
				onSuccess();
			} else {
				toast.error(
					announcement
						? "Gagal memperbarui pengumuman"
						: "Gagal mempublish pengumuman",
				);
			}
		} catch (err: any) {
			toast.error(err?.message || "Terjadi kesalahan");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-2xs shrink-0">
							<Megaphone className="w-5 h-5" />
						</div>
						<div>
							<DialogTitle className="text-base font-bold text-slate-900">
								{announcement ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
							</DialogTitle>
							<p className="text-xs text-slate-500 mt-0.5">
								Publikasikan siaran informasi akademik untuk mahasiswa
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-3.5 py-3">
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-slate-700">
							Judul Pengumuman <span className="text-rose-500">*</span>
						</Label>
						<Input
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							placeholder="Contoh: Pengumuman Pelaksanaan Ujian Tengah Semester (UTS) Genap"
							className="h-9 text-xs rounded-xl"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3.5">
						<div className="space-y-1.5 col-span-2 sm:col-span-1">
							<Label className="text-xs font-semibold text-slate-700">
								Target Angkatan
							</Label>
							<Select
								value={form.targetCohort}
								onValueChange={(v) => setForm({ ...form, targetCohort: v })}
							>
								<SelectTrigger className="h-9 text-xs rounded-xl">
									<SelectValue placeholder="Pilih Target Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan (Umum)</SelectItem>
									{[...Array(6)].map((_, i) => {
										const num = 13 + i;
										return (
											<SelectItem key={num} value={num.toString()}>
												Angkatan {num}
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5 col-span-2 sm:col-span-1">
							<Label className="text-xs font-semibold text-slate-700">
								Tanggal Publish <span className="text-rose-500">*</span>
							</Label>
							<Input
								type="date"
								value={form.publishedAt}
								onChange={(e) =>
									setForm({ ...form, publishedAt: e.target.value })
								}
								className="h-9 text-xs rounded-xl"
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-slate-700">
							Isi Pengumuman <span className="text-rose-500">*</span>
						</Label>
						<div className="border border-slate-200 rounded-xl overflow-hidden">
							<TiptapEditor
								content={form.description}
								onChange={(html) => setForm({ ...form, description: html })}
							/>
						</div>
					</div>
				</div>

				<DialogFooter className="gap-2 pt-2 border-t border-slate-100">
					<Button
						variant="outline"
						onClick={onClose}
						disabled={isSaving}
						className="rounded-xl text-xs"
					>
						Batal
					</Button>
					<Button
						onClick={handleSave}
						disabled={isSaving}
						className="bg-[#0517B0] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold"
					>
						{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
						{announcement ? "Simpan Perubahan" : "Publish Pengumuman"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
