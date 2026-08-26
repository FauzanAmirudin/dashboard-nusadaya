"use client";

import {
	Building2,
	Clock,
	FlaskConical,
	GraduationCap,
	Loader2,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";

const DAYS_OF_WEEK = [
	"Senin",
	"Selasa",
	"Rabu",
	"Kamis",
	"Jumat",
	"Sabtu",
	"Minggu",
];

const DAY_COLORS: Record<string, string> = {
	Senin: "bg-blue-50 text-blue-700 border-blue-200/80",
	Selasa: "bg-purple-50 text-purple-700 border-purple-200/80",
	Rabu: "bg-amber-50 text-amber-700 border-amber-200/80",
	Kamis: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
	Jumat: "bg-rose-50 text-rose-700 border-rose-200/80",
	Sabtu: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
	Minggu: "bg-slate-100 text-slate-700 border-slate-200/80",
};

export function TabJadwalPraktikum({ canEdit }: { canEdit: boolean }) {
	const [schedules, setSchedules] = useState<any[]>([]);
	const [dosens, setDosens] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [cohortFilter, setCohortFilter] = useState("all");
	const [dayFilter, setDayFilter] = useState("all");

	// Modal states
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSchedule, setEditingSchedule] = useState<any>(null);
	const [deleteId, setDeleteId] = useState<number | null>(null);

	const fetchSchedules = async () => {
		setIsLoading(true);
		try {
			const query: any = {};
			if (cohortFilter !== "all") query.cohort = cohortFilter;
			if (dayFilter !== "all") query.dayOfWeek = dayFilter;

			const { data, error } = await (api as any).scheduling[
				"practicum-schedules"
			].get({
				$query: query,
			});
			if (!error && data?.success) {
				setSchedules(data.data || []);
			}
		} catch {
			toast.error("Gagal memuat jadwal praktikum");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchDosens = async () => {
		try {
			const { data, error } = await (api as any).users.get({
				$query: { role: "dosen" },
			});
			if (!error && data?.data) {
				setDosens(data.data);
			}
		} catch (error) {
			console.error("Error fetching dosens:", error);
		}
	};

	useEffect(() => {
		fetchDosens();
	}, []);

	useEffect(() => {
		fetchSchedules();
	}, [cohortFilter, dayFilter]);

	// Extract unique cohort list dynamically
	const dynamicCohorts = useMemo(() => {
		const cohorts = new Set<string>();
		schedules.forEach((s) => {
			if (s.cohort) cohorts.add(s.cohort.toString());
		});
		for (let i = 13; i <= 18; i++) cohorts.add(i.toString());
		return Array.from(cohorts).sort((a, b) => Number(b) - Number(a));
	}, [schedules]);

	// Client-side search filter
	const filteredSchedules = useMemo(() => {
		if (!searchQuery.trim()) return schedules;
		const q = searchQuery.toLowerCase();
		return schedules.filter(
			(s) =>
				s.subject?.toLowerCase().includes(q) ||
				s.room?.toLowerCase().includes(q) ||
				s.dosen?.fullName?.toLowerCase().includes(q) ||
				s.dosen?.name?.toLowerCase().includes(q) ||
				s.dayOfWeek?.toLowerCase().includes(q),
		);
	}, [schedules, searchQuery]);

	const handleDeleteConfirm = async () => {
		if (!deleteId) return;
		try {
			const { error } = await (api as any).scheduling["practicum-schedules"][
				deleteId.toString()
			].delete();
			if (!error) {
				toast.success("Jadwal praktikum berhasil dihapus");
				fetchSchedules();
			} else {
				toast.error("Gagal menghapus jadwal");
			}
		} catch {
			toast.error("Gagal menghapus jadwal");
		} finally {
			setDeleteId(null);
		}
	};

	const hasActiveFilters =
		searchQuery !== "" || cohortFilter !== "all" || dayFilter !== "all";

	const resetFilters = () => {
		setSearchQuery("");
		setCohortFilter("all");
		setDayFilter("all");
	};

	return (
		<div className="space-y-4">
			{/* Main Card Container */}
			<div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
				{/* Top Action & Toolbar */}
				<div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-4">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
								<FlaskConical className="w-4 h-4" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
										Daftar Jadwal Praktikum
									</h2>
									<span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
										{filteredSchedules.length}
									</span>
								</div>
								<p className="text-xs text-slate-500">
									Alokasi waktu praktikum kejuruan, lab bahasa, dan simulasi
									industri
								</p>
							</div>
						</div>

						{canEdit && (
							<Button
								onClick={() => {
									setEditingSchedule(null);
									setIsModalOpen(true);
								}}
								className="bg-[#0517B0] hover:bg-blue-900 text-white rounded-xl shadow-xs text-xs font-semibold px-3.5 py-2 h-9 w-full sm:w-auto"
							>
								<Plus className="w-4 h-4 mr-1.5" />
								Tambah Jadwal Praktikum
							</Button>
						)}
					</div>

					{/* Search and Filters Bar */}
					<div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
						<div className="relative flex-1 min-w-[220px]">
							<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
							<Input
								placeholder="Cari mata kuliah praktikum, instruktur, lab..."
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

						<div className="w-full sm:w-[170px]">
							<Select
								value={cohortFilter}
								onValueChange={(val) => setCohortFilter(val || "all")}
							>
								<SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 border-slate-200">
									<SelectValue placeholder="Semua Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan</SelectItem>
									{dynamicCohorts.map((cohort) => (
										<SelectItem key={cohort} value={cohort}>
											Angkatan {cohort}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="w-full sm:w-[150px]">
							<Select
								value={dayFilter}
								onValueChange={(val) => setDayFilter(val || "all")}
							>
								<SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 border-slate-200">
									<SelectValue placeholder="Semua Hari" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Hari</SelectItem>
									{DAYS_OF_WEEK.map((day) => (
										<SelectItem key={day} value={day}>
											{day}
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
								Memuat jadwal praktikum...
							</p>
						</div>
					) : filteredSchedules.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center px-4">
							<div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
								<FlaskConical className="w-6 h-6" />
							</div>
							<p className="text-sm font-semibold text-slate-800">
								Tidak ada jadwal praktikum
							</p>
							<p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
								{hasActiveFilters
									? "Tidak ada jadwal praktikum yang cocok dengan kata kunci atau filter yang dipilih."
									: "Belum ada data jadwal praktikum yang ditambahkan."}
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
										setEditingSchedule(null);
										setIsModalOpen(true);
									}}
									className="bg-[#0517B0] hover:bg-blue-900 text-white rounded-xl text-xs"
								>
									<Plus className="w-4 h-4 mr-1.5" />
									Tambah Jadwal Baru
								</Button>
							) : null}
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-slate-50/80">
									<TableRow className="border-b border-slate-100 hover:bg-transparent">
										<TableHead className="w-[140px] text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-5 py-3">
											Hari & Waktu
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3">
											Mata Kuliah Praktikum
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3">
											Instruktur / Pengampu
										</TableHead>
										<TableHead className="w-[120px] text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3">
											Angkatan
										</TableHead>
										<TableHead className="w-[130px] text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3">
											Laboratorium
										</TableHead>
										{canEdit && (
											<TableHead className="w-[100px] text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right pr-5 py-3">
												Aksi
											</TableHead>
										)}
									</TableRow>
								</TableHeader>
								<TableBody className="divide-y divide-slate-100">
									{filteredSchedules.map((s) => {
										const dayColor =
											DAY_COLORS[s.dayOfWeek] ||
											"bg-slate-50 text-slate-700 border-slate-200/80";

										return (
											<TableRow
												key={s.id}
												className="hover:bg-slate-50/60 transition-colors"
											>
												<TableCell className="pl-5 py-3.5">
													<div className="space-y-1">
														<span
															className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${dayColor}`}
														>
															{s.dayOfWeek}
														</span>
														<div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
															<Clock className="w-3.5 h-3.5 text-slate-400" />
															<span>
																{s.startTime} - {s.endTime}
															</span>
														</div>
													</div>
												</TableCell>

												<TableCell className="py-3.5">
													<div className="font-bold text-xs sm:text-sm text-slate-900">
														{s.subject}
													</div>
													{s.notes && (
														<p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
															{s.notes}
														</p>
													)}
												</TableCell>

												<TableCell className="py-3.5">
													<div className="flex items-center gap-2">
														<div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
															<User className="w-3.5 h-3.5" />
														</div>
														<span className="text-xs font-medium text-slate-800">
															{s.dosen?.fullName || s.dosen?.name || "-"}
														</span>
													</div>
												</TableCell>

												<TableCell className="py-3.5">
													<Badge
														variant="outline"
														className="bg-blue-50/50 text-[#0517B0] border-blue-200/60 text-[11px] font-semibold rounded-lg px-2 py-0.5"
													>
														<GraduationCap className="w-3 h-3 mr-1" />
														Angkatan {s.cohort}
													</Badge>
												</TableCell>

												<TableCell className="py-3.5">
													<div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/60">
														<Building2 className="w-3.5 h-3.5 text-purple-500" />
														<span>{s.room}</span>
													</div>
												</TableCell>

												{canEdit && (
													<TableCell className="text-right pr-5 py-3.5">
														<div className="flex items-center justify-end gap-1">
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#0517B0] hover:bg-blue-50"
																onClick={() => {
																	setEditingSchedule(s);
																	setIsModalOpen(true);
																}}
															>
																<Pencil className="w-3.5 h-3.5" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
																onClick={() => setDeleteId(s.id)}
															>
																<Trash2 className="w-3.5 h-3.5" />
															</Button>
														</div>
													</TableCell>
												)}
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
				<PracticumScheduleDialog
					dosens={dosens}
					schedule={editingSchedule}
					onClose={() => setIsModalOpen(false)}
					onSuccess={() => {
						setIsModalOpen(false);
						fetchSchedules();
					}}
				/>
			)}

			{/* Delete Confirmation Alert Dialog */}
			<AlertDialog
				open={deleteId !== null}
				onOpenChange={(open) => !open && setDeleteId(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base font-bold text-slate-900">
							Hapus Jadwal Praktikum
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-slate-600">
							Apakah Anda yakin ingin menghapus jadwal sesi praktikum ini?
							Tindakan ini tidak dapat dibatalkan.
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
							Hapus Jadwal
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function PracticumScheduleDialog({
	dosens,
	schedule,
	onClose,
	onSuccess,
}: {
	dosens: any[];
	schedule: any;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [isSaving, setIsSaving] = useState(false);
	const [form, setForm] = useState({
		subject: schedule?.subject || "",
		dosenId: schedule?.dosenId?.toString() || "",
		cohort: schedule?.cohort?.toString() || "",
		room: schedule?.room || "",
		dayOfWeek: schedule?.dayOfWeek || "",
		startTime: schedule?.startTime || "",
		endTime: schedule?.endTime || "",
		notes: schedule?.notes || "",
	});

	const handleSave = async () => {
		if (
			!form.subject ||
			!form.cohort ||
			!form.room ||
			!form.dayOfWeek ||
			!form.startTime ||
			!form.endTime
		) {
			toast.error(
				"Mohon lengkapi data wajib (Mata Kuliah Praktik, Angkatan, Ruangan/Lab, Hari, dan Waktu)",
			);
			return;
		}

		setIsSaving(true);
		try {
			const payload = {
				...form,
				dosenId: form.dosenId ? parseInt(form.dosenId, 10) : undefined,
			};

			let error;
			if (schedule?.id) {
				const res = await (api as any).scheduling["practicum-schedules"][
					schedule.id.toString()
				].patch(payload);
				error = res.error;
			} else {
				const res = await (api as any).scheduling["practicum-schedules"].post(
					payload,
				);
				error = res.error;

				if (error) {
					const msg =
						typeof error.value === "object" && (error.value as any)?.message
							? (error.value as any).message
							: typeof error.value === "string"
								? error.value
								: "Terjadi kesalahan saat menyimpan jadwal praktikum";
					toast.error(msg);
					setIsSaving(false);
					return;
				}
			}

			if (!error) {
				toast.success(
					schedule
						? "Jadwal praktikum diperbarui"
						: "Jadwal praktikum berhasil ditambahkan",
				);
				onSuccess();
			} else {
				toast.error(
					schedule
						? "Gagal memperbarui jadwal praktikum"
						: "Gagal menambahkan jadwal praktikum",
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
			<DialogContent className="sm:max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shadow-2xs shrink-0">
							<FlaskConical className="w-5 h-5" />
						</div>
						<div>
							<DialogTitle className="text-base font-bold text-slate-900">
								{schedule ? "Edit Jadwal Praktikum" : "Tambah Jadwal Praktikum"}
							</DialogTitle>
							<p className="text-xs text-slate-500 mt-0.5">
								Konfigurasi mata kuliah praktik, instruktur, waktu, dan
								laboratorium
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-3.5 py-3">
					<div className="space-y-1.5 col-span-2">
						<Label className="text-xs font-semibold text-slate-700">
							Mata Kuliah Praktik <span className="text-rose-500">*</span>
						</Label>
						<Input
							value={form.subject}
							onChange={(e) => setForm({ ...form, subject: e.target.value })}
							placeholder="Contoh: Praktikum Simulasi Wawancara Kerja"
							className="h-9 text-xs rounded-xl"
						/>
					</div>

					<div className="space-y-1.5 col-span-2 sm:col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Instruktur / Dosen Pengampu
						</Label>
						<Select
							value={form.dosenId}
							onValueChange={(v) => setForm({ ...form, dosenId: v })}
						>
							<SelectTrigger className="h-9 text-xs rounded-xl">
								<SelectValue placeholder="Pilih Instruktur">
									{form.dosenId
										? dosens.find((d) => d.id.toString() === form.dosenId)
												?.fullName ||
											schedule?.dosen?.fullName ||
											"Memuat..."
										: undefined}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{dosens.map((d) => (
									<SelectItem key={d.id} value={d.id.toString()}>
										{d.fullName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5 col-span-2 sm:col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Angkatan <span className="text-rose-500">*</span>
						</Label>
						<Input
							type="number"
							value={form.cohort}
							onChange={(e) => setForm({ ...form, cohort: e.target.value })}
							placeholder="Contoh: 16"
							className="h-9 text-xs rounded-xl"
						/>
					</div>

					<div className="space-y-1.5 col-span-2 sm:col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Hari <span className="text-rose-500">*</span>
						</Label>
						<Select
							value={form.dayOfWeek}
							onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}
						>
							<SelectTrigger className="h-9 text-xs rounded-xl">
								<SelectValue placeholder="Pilih Hari" />
							</SelectTrigger>
							<SelectContent>
								{DAYS_OF_WEEK.map((day) => (
									<SelectItem key={day} value={day}>
										{day}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5 col-span-2 sm:col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Ruang / Laboratorium <span className="text-rose-500">*</span>
						</Label>
						<Input
							value={form.room}
							onChange={(e) => setForm({ ...form, room: e.target.value })}
							placeholder="Contoh: Lab Komputer & Multimedia"
							className="h-9 text-xs rounded-xl"
						/>
					</div>

					<div className="space-y-1.5 col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Jam Mulai <span className="text-rose-500">*</span>
						</Label>
						<Input
							type="time"
							value={form.startTime}
							onChange={(e) => setForm({ ...form, startTime: e.target.value })}
							className="h-9 text-xs rounded-xl"
						/>
					</div>

					<div className="space-y-1.5 col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Jam Selesai <span className="text-rose-500">*</span>
						</Label>
						<Input
							type="time"
							value={form.endTime}
							onChange={(e) => setForm({ ...form, endTime: e.target.value })}
							className="h-9 text-xs rounded-xl"
						/>
					</div>

					<div className="space-y-1.5 col-span-2">
						<Label className="text-xs font-semibold text-slate-700">
							Catatan Tambahan
						</Label>
						<Textarea
							value={form.notes}
							onChange={(e) => setForm({ ...form, notes: e.target.value })}
							placeholder="Tambahkan instruksi peralatan lab atau informasi modul jika ada..."
							rows={2}
							className="text-xs rounded-xl resize-none"
						/>
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
						Simpan Jadwal
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
