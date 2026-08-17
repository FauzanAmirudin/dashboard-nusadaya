"use client";

import {
	BookOpen,
	Download,
	Edit,
	Eye,
	Loader2,
	Plus,
	Search,
	Trash2,
} from "lucide-react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
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
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { useAuthStore } from "@/store";

type CourseData = {
	id: number;
	code: string;
	name: string;
	dosenId: number;
	dosen: { id: number; fullName: string };
	peminatan: string | null;
	cohort: number;
	type: "teori" | "praktik";
};

type DosenData = {
	id: number;
	fullName: string;
};

export default function MataKuliahPage() {
	const { user, hasHydrated } = useAuthStore();
	const [courses, setCourses] = useState<CourseData[]>([]);
	const [dosenList, setDosenList] = useState<DosenData[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [filterCohort, setFilterCohort] = useState<string>("all");
	const [filterType, setFilterType] = useState<string>("all");
	const [filterPeminatan, setFilterPeminatan] = useState<string>("all");

	// Modals
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);

	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const initialForm = {
		code: "",
		name: "",
		dosenId: "",
		peminatan: "",
		cohort: "",
		type: "teori",
	};
	const [formData, setFormData] = useState(initialForm);

	const fetchCourses = async () => {
		try {
			const { data, error } = await api.courses.get({
				$query: {
					...(filterCohort !== "all" && { cohort: filterCohort }),
					...(filterType !== "all" && { type: filterType }),
					...(filterPeminatan !== "all" && { peminatan: filterPeminatan }),
				},
			});
			if (error) throw error;
			if (data?.success) {
				setCourses(data.data as unknown as CourseData[]);
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal memuat data");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchDosen = async () => {
		try {
			const { data, error } = await api.users.get({
				$query: { role: "dosen" },
			});
			if (!error && data?.success) {
				setDosenList(data.data as any[]);
			}
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		if (hasHydrated && user) {
			setIsLoading(true);
			fetchCourses();
			if (user.role !== "dosen") {
				fetchDosen();
			}
		}
	}, [hasHydrated, user, filterCohort, filterType, filterPeminatan]);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.code || !formData.name || !formData.cohort) {
			toast.error("Mohon lengkapi data yang wajib diisi");
			return;
		}

		let dosenIdPayload = parseInt(formData.dosenId, 10);
		if (user?.role === "dosen") {
			dosenIdPayload = user.id;
		} else if (!formData.dosenId) {
			toast.error("Mohon pilih dosen pengampu");
			return;
		}

		setIsSaving(true);
		try {
			const payload = {
				code: formData.code,
				name: formData.name,
				dosenId: dosenIdPayload,
				peminatan: formData.peminatan || undefined,
				cohort: parseInt(formData.cohort, 10),
				type: formData.type as "teori" | "praktik",
			};

			if (isEditOpen && editingId) {
				const { data, error } =
					await api.courses[editingId.toString()].patch(payload);
				if (error) throw new Error(error.value?.message || "Gagal menyimpan");
				toast.success("Berhasil memperbarui mata kuliah");
			} else {
				const { data, error } = await api.courses.post(payload);
				if (error) throw new Error(error.value?.message || "Gagal menambahkan");
				toast.success("Berhasil menambahkan mata kuliah");
			}

			setIsAddOpen(false);
			setIsEditOpen(false);
			setFormData(initialForm);
			fetchCourses();
		} catch (err: any) {
			toast.error(err.message || "Terjadi kesalahan");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		setIsSaving(true);
		try {
			const { error } = await api.courses[deletingId.toString()].delete();
			if (error) throw error;
			toast.success("Berhasil menghapus mata kuliah");
			fetchCourses();
		} catch (err: any) {
			toast.error(err.message || "Gagal menghapus");
		} finally {
			setIsSaving(false);
			setDeleteConfirmOpen(false);
		}
	};

	const openEdit = (course: CourseData) => {
		setEditingId(course.id);
		setFormData({
			code: course.code,
			name: course.name,
			dosenId: course.dosenId.toString(),
			peminatan: course.peminatan || "",
			cohort: course.cohort.toString(),
			type: course.type,
		});
		setIsEditOpen(true);
	};

	const filteredCourses = courses.filter((c) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			c.name.toLowerCase().includes(query) ||
			c.code.toLowerCase().includes(query) ||
			c.dosen.fullName.toLowerCase().includes(query)
		);
	});

	// Get unique peminatan for filter
	const uniquePeminatan = Array.from(
		new Set(courses.map((c) => c.peminatan).filter(Boolean)),
	);

	const handleExport = () => {
		if (filteredCourses.length === 0) return;
		const exportData = filteredCourses.map((c) => ({
			"Kode MK": c.code,
			"Nama Mata Kuliah": c.name,
			"Dosen Pengampu": c.dosen.fullName,
			Peminatan: c.peminatan || "-",
			Angkatan: c.cohort,
			Jenis: c.type === "teori" ? "Teori" : "Praktik",
		}));
		exportToCSV(
			exportData,
			`Daftar_Mata_Kuliah_${new Date().toISOString().split("T")[0]}`,
		);
	};

	if (!hasHydrated) return null;

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
						<BookOpen className="h-6 w-6 text-blue-600" />
						{user?.role === "dosen"
							? "Mata Kuliah Yang Diampu"
							: "Manajemen Mata Kuliah"}
					</h1>
					<p className="text-slate-500 text-sm mt-1">
						{user?.role === "dosen"
							? `Daftar mata kuliah aktif yang Anda ampu (${user.fullName || user.username}) beserta akses detail 16 pertemuan, absensi, dan penilaian`
							: "Kelola master mata kuliah, penugasan dosen pengampu, dan jadwal perkuliahan"}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={handleExport}>
						<Download className="mr-2 h-4 w-4" /> Export Excel
					</Button>
					{(user?.role === "superadmin" || user?.role === "akademik") && (
						<Button
							onClick={() => {
								setFormData(initialForm);
								setIsAddOpen(true);
							}}
						>
							<Plus className="mr-2 h-4 w-4" /> Tambah Mata Kuliah
						</Button>
					)}
				</div>
			</div>

			<Card>
				<CardHeader className="pb-3 border-b">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						<CardTitle className="text-lg font-medium">
							Daftar Mata Kuliah
						</CardTitle>
						<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
								<Input
									placeholder="Cari kode/nama..."
									className="pl-9 w-full sm:w-[250px]"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
							<Select
								value={filterCohort}
								onValueChange={(v) => setFilterCohort(v || "all")}
							>
								<SelectTrigger className="w-full sm:w-[150px]">
									<SelectValue placeholder="Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan</SelectItem>
									{Array.from(
										{ length: new Date().getFullYear() - 2022 + 2 },
										(_, i) => new Date().getFullYear() + 1 - i,
									).map((c) => (
										<SelectItem key={c} value={c.toString()}>
											Angkatan {c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={filterType}
								onValueChange={(v) => setFilterType(v || "all")}
							>
								<SelectTrigger className="w-full sm:w-[130px]">
									<SelectValue placeholder="Jenis" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Jenis</SelectItem>
									<SelectItem value="teori">Teori</SelectItem>
									<SelectItem value="praktik">Praktik</SelectItem>
								</SelectContent>
							</Select>
							{uniquePeminatan.length > 0 && (
								<Select
									value={filterPeminatan}
									onValueChange={(v) => setFilterPeminatan(v || "all")}
								>
									<SelectTrigger className="w-full sm:w-[160px]">
										<SelectValue placeholder="Peminatan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Semua Peminatan</SelectItem>
										{uniquePeminatan.map((p, i) => (
											<SelectItem key={i} value={p as string}>
												{p}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50 hover:bg-slate-50">
									<TableHead>Kode</TableHead>
									<TableHead>Nama Mata Kuliah</TableHead>
									<TableHead>Dosen Pengampu</TableHead>
									<TableHead>Peminatan</TableHead>
									<TableHead className="text-center">Angkatan</TableHead>
									<TableHead>Jenis</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center py-10">
											<Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
										</TableCell>
									</TableRow>
								) : filteredCourses.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="text-center py-10 text-slate-500"
										>
											Tidak ada data mata kuliah
										</TableCell>
									</TableRow>
								) : (
									filteredCourses.map((c) => (
										<TableRow key={c.id}>
											<TableCell className="font-medium">{c.code}</TableCell>
											<TableCell>{c.name}</TableCell>
											<TableCell>{c.dosen.fullName}</TableCell>
											<TableCell>{c.peminatan || "-"}</TableCell>
											<TableCell className="text-center">
												<Badge variant="outline" className="bg-slate-50">
													AK {c.cohort}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge
													variant={c.type === "teori" ? "secondary" : "default"}
													className={
														c.type === "teori"
															? "bg-blue-100 text-blue-700"
															: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
													}
												>
													{c.type === "teori" ? "Teori" : "Praktik"}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Link href={`/dashboard/mata-kuliah/${c.id}`}>
														<Button
															variant="outline"
															size="sm"
															className="h-8 gap-1.5 font-medium text-blue-700 bg-blue-50/80 border-blue-200 hover:bg-blue-100 hover:text-blue-800 transition-colors"
															title="Buka Detail & 16 Pertemuan"
														>
															<Eye className="h-4 w-4 text-blue-600" />
															<span>Detail & 16 Pertemuan</span>
														</Button>
													</Link>
													{(user?.role === "superadmin" ||
														user?.role === "akademik") && (
														<>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8"
																onClick={() => openEdit(c)}
															>
																<Edit className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
																onClick={() => {
																	setDeletingId(c.id);
																	setDeleteConfirmOpen(true);
																}}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</>
													)}
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Modal Form */}
			<Dialog
				open={isAddOpen || isEditOpen}
				onOpenChange={(open) => {
					if (!open) {
						setIsAddOpen(false);
						setIsEditOpen(false);
					}
				}}
			>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{isAddOpen ? "Tambah Mata Kuliah Baru" : "Edit Mata Kuliah"}
						</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSave} className="space-y-4 pt-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Kode Mata Kuliah *</Label>
								<Input
									required
									placeholder="Cth: MK-001"
									className="border-2 border-slate-200"
									value={formData.code}
									onChange={(e) =>
										setFormData({ ...formData, code: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Angkatan *</Label>
								<Input
									required
									type="number"
									placeholder="Cth: 13"
									className="border-2 border-slate-200"
									value={formData.cohort}
									onChange={(e) =>
										setFormData({ ...formData, cohort: e.target.value })
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Nama Mata Kuliah *</Label>
							<Input
								required
								placeholder="Cth: Front Office Operation"
								className="border-2 border-slate-200"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
							/>
						</div>

						{user?.role !== "dosen" && (
							<div className="space-y-2">
								<Label>Dosen Pengampu *</Label>
								<Select
									value={formData.dosenId || ""}
									onValueChange={(val) =>
										setFormData({ ...formData, dosenId: val || "" })
									}
								>
									<SelectTrigger className="border-2 border-slate-200">
										<SelectValue placeholder="Pilih Dosen" />
									</SelectTrigger>
									<SelectContent>
										{dosenList.map((d) => (
											<SelectItem key={d.id} value={d.id.toString()}>
												{d.fullName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Peminatan (Opsional)</Label>
								<Input
									placeholder="Cth: F&B Service"
									className="border-2 border-slate-200"
									value={formData.peminatan}
									onChange={(e) =>
										setFormData({ ...formData, peminatan: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Jenis *</Label>
								<Select
									value={formData.type || "teori"}
									onValueChange={(val) =>
										setFormData({ ...formData, type: val || "teori" })
									}
								>
									<SelectTrigger className="border-2 border-slate-200">
										<SelectValue placeholder="Pilih Jenis" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="teori">Teori</SelectItem>
										<SelectItem value="praktik">Praktik</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="pt-4 flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsAddOpen(false);
									setIsEditOpen(false);
								}}
							>
								Batal
							</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : null}
								Simpan
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirm */}
			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Mata Kuliah?</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini tidak dapat dibatalkan. Menghapus mata kuliah juga
							akan menghapus seluruh data jadwal mengajar, presensi, dan
							penilaian di dalamnya secara permanen.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSaving}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isSaving}
							className="bg-red-600 hover:bg-red-700"
						>
							{isSaving ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : null}
							Ya, Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
