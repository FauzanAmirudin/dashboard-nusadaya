"use client";

import { Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<CardTitle>Pengumuman Akademik</CardTitle>
					{canEdit && (
						<Button
							onClick={() => {
								setSelectedAnnouncement(null);
								setIsModalOpen(true);
							}}
						>
							<Plus className="w-4 h-4 mr-2" />
							Buat Pengumuman
						</Button>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-4">
						<div className="relative flex-1 w-full sm:min-w-[300px]">
							<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
							<Input
								placeholder="Cari judul pengumuman..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="w-full sm:w-[200px]">
							<Select
								value={cohortFilter}
								onValueChange={(val) => setCohortFilter(val || "all")}
							>
								<SelectTrigger>
									<SelectValue placeholder="Semua Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan</SelectItem>
									{[...Array(5)].map((_, i) => {
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
					</div>

					{isLoading ? (
						<div className="flex justify-center p-8">
							<Loader2 className="w-6 h-6 animate-spin text-primary" />
						</div>
					) : announcements.length === 0 ? (
						<div className="text-center py-8 text-slate-500">
							Tidak ada pengumuman ditemukan.
						</div>
					) : (
						<div className="rounded-md border overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Tanggal Publish</TableHead>
										<TableHead>Judul Pengumuman</TableHead>
										<TableHead>Target Angkatan</TableHead>
										<TableHead>Dibuat Oleh</TableHead>
										<TableHead className="text-right">Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{announcements.map((a) => (
										<TableRow key={a.id}>
											<TableCell>
												{new Date(a.publishedAt).toLocaleDateString("id-ID", {
													day: "numeric",
													month: "long",
													year: "numeric",
												})}
											</TableCell>
											<TableCell className="font-medium max-w-[300px] truncate">
												{a.title}
											</TableCell>
											<TableCell>
												{a.targetCohort
													? `Angkatan ${a.targetCohort}`
													: "Semua Angkatan"}
											</TableCell>
											<TableCell>
												{a.creator?.fullName || a.creator?.name || "-"}
											</TableCell>
											<TableCell className="text-right space-x-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setSelectedAnnouncement(a);
														setIsDetailModalOpen(true);
													}}
												>
													<Eye className="w-4 h-4 mr-1" /> Baca
												</Button>
												{canEdit && (
													<>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => {
																setSelectedAnnouncement(a);
																setIsModalOpen(true);
															}}
														>
															<Pencil className="w-4 h-4 text-slate-600" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="text-red-600"
															onClick={() => setDeleteId(a.id)}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

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

			{isDetailModalOpen && selectedAnnouncement && (
				<Dialog
					open={true}
					onOpenChange={(open) => !open && setIsDetailModalOpen(false)}
				>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle className="text-xl">
								{selectedAnnouncement.title}
							</DialogTitle>
							<div className="text-xs text-slate-500 mt-2 flex gap-4">
								<span>
									Tanggal:{" "}
									{new Date(
										selectedAnnouncement.publishedAt,
									).toLocaleDateString("id-ID", {
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
								</span>
								<span>
									Target:{" "}
									{selectedAnnouncement.targetCohort
										? `Angkatan ${selectedAnnouncement.targetCohort}`
										: "Semua Angkatan"}
								</span>
							</div>
						</DialogHeader>
						<div
							className="py-4 prose prose-sm max-w-none prose-slate"
							dangerouslySetInnerHTML={{
								__html: selectedAnnouncement.description,
							}}
						/>
						<DialogFooter>
							<Button onClick={() => setIsDetailModalOpen(false)}>Tutup</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			<AlertDialog
				open={deleteId !== null}
				onOpenChange={(open) => !open && setDeleteId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Pengumuman</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini
							tidak dapat dibatalkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-red-600"
						>
							Hapus
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
			<DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{announcement ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>
							Judul Pengumuman <span className="text-red-500">*</span>
						</Label>
						<Input
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							placeholder="Masukkan judul..."
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Target Angkatan</Label>
							<Select
								value={form.targetCohort}
								onValueChange={(v) => setForm({ ...form, targetCohort: v })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Pilih Target Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan (Umum)</SelectItem>
									{[...Array(5)].map((_, i) => {
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
						<div className="space-y-2">
							<Label>
								Tanggal Publish <span className="text-red-500">*</span>
							</Label>
							<Input
								type="date"
								value={form.publishedAt}
								onChange={(e) =>
									setForm({ ...form, publishedAt: e.target.value })
								}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>
							Isi Pengumuman <span className="text-red-500">*</span>
						</Label>
						<TiptapEditor
							content={form.description}
							onChange={(html) => setForm({ ...form, description: html })}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={isSaving}>
						Batal
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : null}
						{announcement ? "Simpan Perubahan" : "Publish Pengumuman"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
