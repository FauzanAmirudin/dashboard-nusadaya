"use client";

import {
	Building2,
	CalendarDays,
	ChevronDown,
	Clock,
	GraduationCap,
	Loader2,
	Lock,
	Pencil,
	Plus,
	RotateCcw,
	Search,
	Trash2,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

export function TabJadwalPiket({ canEdit }: { canEdit: boolean }) {
	const [schedules, setSchedules] = useState<any[]>([]);
	const [students, setStudents] = useState<any[]>([]);
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
				"duty-schedules"
			].get({
				$query: query,
			});
			if (!error && data?.success) {
				setSchedules(data.data || []);
			}
		} catch {
			toast.error("Gagal memuat jadwal piket");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchStudents = async () => {
		try {
			const { data, error } = await api.students.get();
			if (!error && data?.data) {
				setStudents(data.data.map((item: any) => item.student));
			}
		} catch (error) {
			console.error("Error fetching students:", error);
		}
	};

	useEffect(() => {
		fetchStudents();
	}, []);

	useEffect(() => {
		fetchSchedules();
	}, [cohortFilter, dayFilter]);

	// Extract unique cohorts dynamically
	const dynamicCohorts = useMemo(() => {
		const cohorts = new Set<string>();
		schedules.forEach((s) => {
			if (s.cohort) cohorts.add(s.cohort.toString());
		});
		for (let i = 13; i <= 18; i++) cohorts.add(i.toString());
		return Array.from(cohorts).sort((a, b) => Number(b) - Number(a));
	}, [schedules]);

	// Filter schedules client side
	const filteredSchedules = useMemo(() => {
		if (!searchQuery.trim()) return schedules;
		const q = searchQuery.toLowerCase();
		return schedules.filter(
			(s) =>
				s.groupName?.toLowerCase().includes(q) ||
				s.room?.toLowerCase().includes(q) ||
				s.dayOfWeek?.toLowerCase().includes(q) ||
				(Array.isArray(s.members) &&
					s.members.some(
						(m: any) =>
							m.name?.toLowerCase().includes(q) || (m.nim && m.nim.includes(q)),
					)),
		);
	}, [schedules, searchQuery]);

	const handleDeleteConfirm = async () => {
		if (!deleteId) return;
		try {
			const { error } = await (api as any).scheduling["duty-schedules"][
				deleteId.toString()
			].delete();
			if (!error) {
				toast.success("Jadwal piket berhasil dihapus");
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
							<div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
								<Users className="w-4 h-4" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
										Daftar Jadwal Piket Mahasiswa
									</h2>
									<span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
										{filteredSchedules.length}
									</span>
								</div>
								<p className="text-xs text-slate-500">
									Pembagian kelompok piket kebersihan dan ketertiban area kampus
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
								Tambah Kelompok Piket
							</Button>
						)}
					</div>

					{/* Search and Filters Bar */}
					<div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
						<div className="relative flex-1 min-w-[220px]">
							<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
							<Input
								placeholder="Cari kelompok, nama mahasiswa, ruangan..."
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
								Memuat jadwal piket...
							</p>
						</div>
					) : filteredSchedules.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center px-4">
							<div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
								<Users className="w-6 h-6" />
							</div>
							<p className="text-sm font-semibold text-slate-800">
								Tidak ada jadwal piket
							</p>
							<p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
								{hasActiveFilters
									? "Tidak ada kelompok piket yang cocok dengan kata kunci atau filter yang dipilih."
									: "Belum ada kelompok jadwal piket yang ditambahkan."}
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
									Tambah Kelompok Baru
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
										<TableHead className="w-[180px] text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3">
											Kelompok & Angkatan
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3">
											Anggota Kelompok
										</TableHead>
										<TableHead className="w-[140px] text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3">
											Area / Ruangan
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
																{s.startTime && s.endTime
																	? `${s.startTime} - ${s.endTime}`
																	: "Sepanjang Hari"}
															</span>
														</div>
													</div>
												</TableCell>

												<TableCell className="py-3.5">
													<div className="font-bold text-xs sm:text-sm text-slate-900">
														{s.groupName}
													</div>
													<Badge
														variant="outline"
														className="bg-blue-50/50 text-[#0517B0] border-blue-200/60 text-[10px] font-semibold rounded-md px-1.5 py-0 mt-1"
													>
														<GraduationCap className="w-3 h-3 mr-1" />
														Angkatan {s.cohort}
													</Badge>
												</TableCell>

												<TableCell className="py-3.5">
													<div className="flex flex-wrap gap-1.5 max-w-lg">
														{Array.isArray(s.members) &&
														s.members.length > 0 ? (
															s.members.map((m: any, i: number) => (
																<span
																	key={i}
																	className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70"
																>
																	<span className="w-1.5 h-1.5 rounded-full bg-[#0517B0]" />
																	{m.name}
																</span>
															))
														) : (
															<span className="text-xs text-slate-400 italic">
																Belum ada anggota
															</span>
														)}
													</div>
												</TableCell>

												<TableCell className="py-3.5">
													<div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
														<Building2 className="w-3.5 h-3.5 text-amber-600" />
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
				<DutyScheduleDialog
					students={students}
					schedule={editingSchedule}
					existingSchedules={schedules}
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
							Hapus Jadwal Piket
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-slate-600">
							Apakah Anda yakin ingin menghapus kelompok piket ini? Tindakan ini
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
							Hapus Jadwal
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function DutyScheduleDialog({
	students,
	schedule,
	existingSchedules = [],
	onClose,
	onSuccess,
}: {
	students: any[];
	schedule: any;
	existingSchedules?: any[];
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [isSaving, setIsSaving] = useState(false);
	const [form, setForm] = useState({
		cohort: schedule?.cohort?.toString() || "",
		groupName: schedule?.groupName || "",
		room: schedule?.room || "",
		dayOfWeek: schedule?.dayOfWeek || "",
		startTime: schedule?.startTime || "",
		endTime: schedule?.endTime || "",
	});

	const [selectedMembers, setSelectedMembers] = useState<any[]>(
		schedule?.members || [],
	);
	const [studentSearch, setStudentSearch] = useState("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Handle click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Build map of students who already have a duty schedule in other groups
	const assignedStudentsMap = useMemo(() => {
		const map = new Map<number, { groupName: string; dayOfWeek: string }>();
		if (!existingSchedules) return map;

		for (const sched of existingSchedules) {
			if (schedule?.id && sched.id === schedule.id) continue;

			if (Array.isArray(sched.members)) {
				for (const m of sched.members) {
					const memberId = m.id || m.studentId;
					if (memberId) {
						map.set(Number(memberId), {
							groupName: sched.groupName || "Kelompok Lain",
							dayOfWeek: sched.dayOfWeek || "-",
						});
					}
				}
			}
		}
		return map;
	}, [existingSchedules, schedule]);

	// Filter available students
	const availableStudents = useMemo(() => {
		return students.filter(
			(s) =>
				(form.cohort ? s.cohort === parseInt(form.cohort, 10) : true) &&
				!selectedMembers.find((m) => m.id === s.id) &&
				!assignedStudentsMap.has(s.id),
		);
	}, [students, form.cohort, selectedMembers, assignedStudentsMap]);

	const filteredStudents = useMemo(() => {
		if (!studentSearch.trim()) return availableStudents;
		const q = studentSearch.toLowerCase();
		return availableStudents.filter(
			(s) => s.name.toLowerCase().includes(q) || (s.nim && s.nim.includes(q)),
		);
	}, [availableStudents, studentSearch]);

	// If search query matches an already assigned student
	const alreadyAssignedSearchResults = useMemo(() => {
		if (!studentSearch.trim()) return [];
		const q = studentSearch.toLowerCase();
		return students.filter(
			(s) =>
				(form.cohort ? s.cohort === parseInt(form.cohort, 10) : true) &&
				assignedStudentsMap.has(s.id) &&
				!selectedMembers.find((m) => m.id === s.id) &&
				(s.name.toLowerCase().includes(q) || (s.nim && s.nim.includes(q))),
		);
	}, [
		students,
		form.cohort,
		assignedStudentsMap,
		selectedMembers,
		studentSearch,
	]);

	const handleAddMember = (student: any) => {
		if (assignedStudentsMap.has(student.id)) {
			const assigned = assignedStudentsMap.get(student.id);
			toast.error(
				`Mahasiswa ${student.name} sudah mendapat jadwal di "${assigned?.groupName}" (Hari ${assigned?.dayOfWeek}) dan tidak dapat dipilih lagi.`,
			);
			return;
		}

		setSelectedMembers([
			...selectedMembers,
			{ id: student.id, name: student.name, nim: student.nim },
		]);
		setStudentSearch("");
	};

	const handleRemoveMember = (id: number) => {
		setSelectedMembers(selectedMembers.filter((m) => m.id !== id));
	};

	const handleSave = async () => {
		if (
			!form.cohort ||
			!form.groupName ||
			!form.room ||
			!form.dayOfWeek ||
			selectedMembers.length === 0
		) {
			toast.error(
				"Mohon lengkapi Angkatan, Nama Kelompok, Ruangan, Hari, dan setidaknya 1 Anggota Mahasiswa",
			);
			return;
		}

		setIsSaving(true);
		try {
			const payload = {
				...form,
				startTime: form.startTime || undefined,
				endTime: form.endTime || undefined,
				members: selectedMembers,
			};

			let error;
			if (schedule?.id) {
				const res = await (api as any).scheduling["duty-schedules"][
					schedule.id.toString()
				].patch(payload);
				error = res.error;
			} else {
				const res = await (api as any).scheduling["duty-schedules"].post(
					payload,
				);
				error = res.error;

				if (error) {
					const msg =
						typeof error.value === "object" && (error.value as any)?.message
							? (error.value as any).message
							: typeof error.value === "string"
								? error.value
								: "Terjadi kesalahan saat menyimpan jadwal";
					toast.error(msg);
					setIsSaving(false);
					return;
				}
			}

			if (!error) {
				toast.success(
					schedule
						? "Jadwal piket diperbarui"
						: "Jadwal piket berhasil ditambahkan",
				);
				onSuccess();
			} else {
				toast.error(
					schedule ? "Gagal memperbarui jadwal" : "Gagal menambahkan jadwal",
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
						<div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shadow-2xs shrink-0">
							<Users className="w-5 h-5" />
						</div>
						<div>
							<DialogTitle className="text-base font-bold text-slate-900">
								{schedule ? "Edit Jadwal Piket" : "Tambah Jadwal Piket"}
							</DialogTitle>
							<p className="text-xs text-slate-500 mt-0.5">
								Atur kelompok piket, hari penugasan, area, dan anggota mahasiswa
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-3.5 py-3">
					<div className="space-y-1.5 col-span-2 sm:col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Angkatan <span className="text-rose-500">*</span>
						</Label>
						<Input
							type="number"
							value={form.cohort}
							onChange={(e) => {
								setForm({ ...form, cohort: e.target.value });
								if (form.cohort !== e.target.value) setSelectedMembers([]);
							}}
							placeholder="Contoh: 16"
							className="h-9 text-xs rounded-xl"
						/>
					</div>

					<div className="space-y-1.5 col-span-2 sm:col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Nama Kelompok <span className="text-rose-500">*</span>
						</Label>
						<Input
							value={form.groupName}
							onChange={(e) => setForm({ ...form, groupName: e.target.value })}
							placeholder="Contoh: Kelompok Piket A"
							className="h-9 text-xs rounded-xl"
						/>
					</div>

					{/* Anggota Mahasiswa Multi-Select */}
					<div className="space-y-1.5 col-span-2">
						<div className="flex items-center justify-between">
							<Label className="text-xs font-semibold text-slate-700">
								Anggota Mahasiswa <span className="text-rose-500">*</span>
							</Label>
							<span className="text-[11px] text-slate-500 font-medium">
								{selectedMembers.length} Mahasiswa Terpilih
							</span>
						</div>

						<div className="border rounded-xl p-3 space-y-2.5 bg-slate-50/70 border-slate-200">
							{/* Selected Badges */}
							{selectedMembers.length > 0 && (
								<div className="flex flex-wrap gap-1.5 pb-1">
									{selectedMembers.map((m) => (
										<span
											key={m.id}
											className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 shadow-2xs text-slate-800"
										>
											<span>{m.name}</span>
											<button
												type="button"
												onClick={() => handleRemoveMember(m.id)}
												className="hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-md p-0.5 transition-colors"
											>
												<X className="w-3.5 h-3.5" />
											</button>
										</span>
									))}
								</div>
							)}

							{/* Search & Selector Dropdown */}
							<div className="relative" ref={dropdownRef}>
								<div className="relative flex items-center">
									<Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
									<Input
										placeholder={
											form.cohort
												? "Ketik nama mahasiswa untuk menambahkan..."
												: "Isi angkatan terlebih dahulu..."
										}
										value={studentSearch}
										onChange={(e) => {
											setStudentSearch(e.target.value);
											setIsDropdownOpen(true);
										}}
										onFocus={() => setIsDropdownOpen(true)}
										onClick={() => setIsDropdownOpen(true)}
										disabled={!form.cohort}
										className="pl-9 pr-9 h-9 text-xs rounded-xl bg-white border-slate-200"
									/>
									<ChevronDown
										className={`absolute right-3 w-4 h-4 text-slate-400 pointer-events-none transition-transform duration-200 ${
											isDropdownOpen ? "rotate-180 text-[#0517B0]" : ""
										}`}
									/>
								</div>

								{isDropdownOpen && form.cohort && (
									<div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95">
										<div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
											<span>
												Mahasiswa Tersedia ({availableStudents.length})
											</span>
											{filteredStudents.length > 5 && (
												<span className="text-[10px] text-[#0517B0] bg-blue-50 px-1.5 py-0.5 rounded font-medium">
													Scroll ke bawah
												</span>
											)}
										</div>

										<div className="max-h-[200px] overflow-y-auto divide-y divide-slate-100">
											{filteredStudents.length > 0 ||
											alreadyAssignedSearchResults.length > 0 ? (
												<>
													{filteredStudents.map((s) => (
														<div
															key={s.id}
															className="px-3 py-2 text-xs cursor-pointer hover:bg-blue-50/80 transition-colors flex items-center justify-between group"
															onMouseDown={(e) => {
																e.preventDefault();
																handleAddMember(s);
															}}
														>
															<div className="flex items-center gap-2.5 min-w-0">
																<div className="w-6 h-6 rounded-full bg-blue-100 text-[#0517B0] font-bold text-[10px] flex items-center justify-center shrink-0">
																	{s.name
																		? s.name.charAt(0).toUpperCase()
																		: "M"}
																</div>
																<div className="truncate">
																	<div className="font-semibold text-slate-800 group-hover:text-[#0517B0] truncate">
																		{s.name}
																	</div>
																	<div className="text-[10px] text-slate-400 font-mono">
																		NIM: {s.nim || "-"}
																	</div>
																</div>
															</div>
															<span className="text-[10px] font-semibold text-[#0517B0] bg-blue-50 group-hover:bg-[#0517B0] group-hover:text-white px-2 py-0.5 rounded transition-colors shrink-0 ml-2">
																+ Tambah
															</span>
														</div>
													))}

													{alreadyAssignedSearchResults.map((s) => {
														const assigned = assignedStudentsMap.get(s.id);
														return (
															<div
																key={s.id}
																className="px-3 py-2 text-xs bg-slate-50 opacity-60 cursor-not-allowed flex items-center justify-between"
															>
																<div className="flex items-center gap-2 min-w-0">
																	<div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0">
																		{s.name
																			? s.name.charAt(0).toUpperCase()
																			: "M"}
																	</div>
																	<div className="truncate">
																		<div className="font-medium text-slate-600 truncate">
																			{s.name}
																		</div>
																		<div className="text-[10px] text-slate-400 font-mono">
																			NIM: {s.nim || "-"}
																		</div>
																	</div>
																</div>
																<span className="text-[10px] font-medium text-slate-600 bg-slate-200 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ml-2">
																	<Lock className="w-3 h-3 text-slate-500" />
																	{assigned?.groupName} ({assigned?.dayOfWeek})
																</span>
															</div>
														);
													})}
												</>
											) : (
												<div className="p-4 text-xs text-slate-500 text-center">
													{studentSearch
														? `Tidak ada mahasiswa "${studentSearch}" yang tersedia`
														: "Semua mahasiswa angkatan ini telah memiliki jadwal piket"}
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="space-y-1.5 col-span-2 sm:col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Hari Piket <span className="text-rose-500">*</span>
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
							Area / Ruangan <span className="text-rose-500">*</span>
						</Label>
						<Input
							value={form.room}
							onChange={(e) => setForm({ ...form, room: e.target.value })}
							placeholder="Contoh: Seluruh Lantai 1 & Lobby"
							className="h-9 text-xs rounded-xl"
						/>
					</div>

					<div className="space-y-1.5 col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Jam Mulai{" "}
							<span className="text-slate-400 font-normal">(Opsional)</span>
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
							Jam Selesai{" "}
							<span className="text-slate-400 font-normal">(Opsional)</span>
						</Label>
						<Input
							type="time"
							value={form.endTime}
							onChange={(e) => setForm({ ...form, endTime: e.target.value })}
							className="h-9 text-xs rounded-xl"
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
						Simpan Jadwal Piket
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
