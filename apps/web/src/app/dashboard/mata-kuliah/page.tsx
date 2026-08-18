"use client";

import {
	BookOpen,
	CheckSquare,
	Download,
	Edit,
	Eye,
	Loader2,
	Plus,
	Search,
	Settings,
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

function getPeminatanBadge(peminatan: string | null) {
	if (!peminatan) return <span className="text-slate-400 text-xs">-</span>;

	const lower = peminatan.toLowerCase();
	let flagUrl = "https://flagcdn.com/w20/id.png";
	let countryAlt = "ID";

	if (lower.includes("malaysia")) {
		flagUrl = "https://flagcdn.com/w20/my.png";
		countryAlt = "MY";
	} else if (lower.includes("taiwan")) {
		flagUrl = "https://flagcdn.com/w20/tw.png";
		countryAlt = "TW";
	} else if (
		lower.includes("timur tengah") ||
		lower.includes("saudi") ||
		lower.includes("barista")
	) {
		flagUrl = "https://flagcdn.com/w20/sa.png";
		countryAlt = "SA";
	} else if (lower.includes("jepang") || lower.includes("japan")) {
		flagUrl = "https://flagcdn.com/w20/jp.png";
		countryAlt = "JP";
	} else if (lower.includes("indonesia") || lower.includes("reguler")) {
		flagUrl = "https://flagcdn.com/w20/id.png";
		countryAlt = "ID";
	}

	return (
		<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200/80 text-slate-700 whitespace-nowrap shadow-2xs">
			<img
				src={flagUrl}
				alt={countryAlt}
				className="w-4 h-2.5 object-cover rounded-[1px] shadow-2xs"
			/>
			<span>{peminatan}</span>
		</span>
	);
}

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
				let courseList = data.data as unknown as CourseData[];
				if (user?.role === "dosen") {
					courseList = courseList.filter(
						(c) => c.dosenId === user.id || c.dosen?.id === user.id,
					);
				}
				setCourses(courseList);
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
			if (editingId) {
				const { data, error } = await api.courses[editingId].patch({
					code: formData.code,
					name: formData.name,
					dosenId: dosenIdPayload,
					peminatan: formData.peminatan || undefined,
					cohort: parseInt(formData.cohort, 10),
					type: formData.type as "teori" | "praktik",
				});
				if (error) throw error;
				if (data?.success) {
					toast.success("Mata kuliah berhasil diperbarui");
					setIsEditOpen(false);
					fetchCourses();
				}
			} else {
				const { data, error } = await api.courses.post({
					code: formData.code,
					name: formData.name,
					dosenId: dosenIdPayload,
					peminatan: formData.peminatan || undefined,
					cohort: parseInt(formData.cohort, 10),
					type: formData.type as "teori" | "praktik",
				});
				if (error) throw error;
				if (data?.success) {
					toast.success("Mata kuliah berhasil ditambahkan");
					setIsAddOpen(false);
					setFormData(initialForm);
					fetchCourses();
				}
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal menyimpan data");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			const { data, error } = await api.courses[deletingId].delete();
			if (error) throw error;
			if (data?.success) {
				toast.success("Mata kuliah berhasil dihapus");
				setDeleteConfirmOpen(false);
				fetchCourses();
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal menghapus data");
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
		if (
			user?.role === "dosen" &&
			c.dosenId !== user.id &&
			c.dosen?.id !== user.id
		) {
			return false;
		}
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			c.name.toLowerCase().includes(query) ||
			c.code.toLowerCase().includes(query) ||
			c.dosen?.fullName?.toLowerCase().includes(query)
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
			"Dosen Pengampu": c.dosen?.fullName || "-",
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

			<Card className="shadow-xs border-slate-200 overflow-hidden">
				<CardHeader className="bg-slate-50/50 border-b border-slate-200 p-4">
					<div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
						<div className="relative w-full md:w-80">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Cari mata kuliah, kode, atau dosen..."
								className="pl-9 bg-white h-9 text-sm"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<div className="flex flex-wrap gap-2 w-full md:w-auto">
							<Select
								value={filterCohort}
								onValueChange={(v) => setFilterCohort(v || "all")}
							>
								<SelectTrigger className="w-full sm:w-[150px] bg-white h-9 text-sm">
									<SelectValue placeholder="Semua Angkatan" />
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
								<SelectTrigger className="w-full sm:w-[130px] bg-white h-9 text-sm">
									<SelectValue placeholder="Semua Jenis">
										{filterType === "all"
											? "Semua Jenis"
											: filterType === "teori"
												? "Teori"
												: "Praktik"}
									</SelectValue>
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
									<SelectTrigger className="w-full sm:w-[170px] bg-white h-9 text-sm">
										<SelectValue placeholder="Semua Peminatan">
											{filterPeminatan === "all"
												? "Semua Peminatan"
												: filterPeminatan}
										</SelectValue>
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
					<div className="overflow-x-auto min-w-full">
						<Table className="w-full">
							<TableHeader>
								<TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 w-28">
										Kode
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 min-w-[200px]">
										Nama Mata Kuliah
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 min-w-[170px]">
										Dosen Pengampu
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 min-w-[180px]">
										Peminatan
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 text-center w-28">
										Angkatan
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 text-center w-24">
										Jenis
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 text-right min-w-[130px]">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center py-12">
											<Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
											<p className="text-xs text-slate-400">
												Memuat daftar mata kuliah...
											</p>
										</TableCell>
									</TableRow>
								) : filteredCourses.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="text-center py-12 text-slate-500"
										>
											<BookOpen className="h-8 w-8 mx-auto text-slate-300 mb-2" />
											<p className="font-medium text-slate-600">
												Tidak ada data mata kuliah
											</p>
											<p className="text-xs text-slate-400 mt-0.5">
												Coba ubah filter atau kata kunci pencarian
											</p>
										</TableCell>
									</TableRow>
								) : (
									filteredCourses.map((c) => (
										<TableRow
											key={c.id}
											className="hover:bg-slate-50/70 transition-colors"
										>
											<TableCell className="font-mono font-semibold text-slate-800 py-3 px-4 text-sm">
												{c.code}
											</TableCell>
											<TableCell className="font-medium text-slate-900 py-3 px-4 text-sm">
												{c.name}
											</TableCell>
											<TableCell className="text-slate-600 py-3 px-4 text-sm">
												{c.dosen?.fullName || "-"}
											</TableCell>
											<TableCell className="py-3 px-4">
												{getPeminatanBadge(c.peminatan)}
											</TableCell>
											<TableCell className="text-center py-3 px-4">
												<Badge
													variant="outline"
													className="bg-slate-100/70 border-slate-200 text-slate-700 font-medium text-xs"
												>
													AK {c.cohort}
												</Badge>
											</TableCell>
											<TableCell className="text-center py-3 px-4">
												<Badge
													variant={c.type === "teori" ? "secondary" : "default"}
													className={
														c.type === "teori"
															? "bg-blue-50 text-blue-700 border-blue-200/60 hover:bg-blue-100 text-xs"
															: "bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100 text-xs"
													}
												>
													{c.type === "teori" ? "Teori" : "Praktik"}
												</Badge>
											</TableCell>
											<TableCell className="text-right py-3 px-4">
												<div className="flex items-center justify-end gap-1.5">
													<Link href={`/dashboard/mata-kuliah/${c.id}`}>
														<Button
															variant="outline"
															size="sm"
															className="h-8 px-3 gap-1.5 font-medium text-blue-700 bg-blue-50/90 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-2xs cursor-pointer"
															title="Kelola Mata Kuliah & Sesi Pertemuan"
														>
															<Settings className="h-3.5 w-3.5" />
															<span>Kelola</span>
														</Button>
													</Link>
													{(user?.role === "superadmin" ||
														user?.role === "akademik") && (
														<>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
																onClick={() => openEdit(c)}
																title="Edit Data Mata Kuliah"
															>
																<Edit className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
																onClick={() => {
																	setDeletingId(c.id);
																	setDeleteConfirmOpen(true);
																}}
																title="Hapus Mata Kuliah"
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
