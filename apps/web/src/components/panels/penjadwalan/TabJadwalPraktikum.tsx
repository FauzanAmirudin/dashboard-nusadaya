"use client";

import {
	Building2,
	Clock,
	Download,
	FlaskConical,
	GraduationCap,
	Loader2,
	Pencil,
	Plus,
	Printer,
	RotateCcw,
	Search,
	Trash2,
	User,
	Users2,
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
import { DEFAULT_ROMBEL_OPTIONS, STANDARDIZED_ROOMS } from "@/constants/rooms";
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { PrintableScheduleView } from "./PrintableScheduleView";

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
	const [courses, setCourses] = useState<any[]>([]);
	const [registeredCohorts, setRegisteredCohorts] = useState<number[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [cohortFilter, setCohortFilter] = useState("all");
	const [rombelFilter, setRombelFilter] = useState("all");
	const [dayFilter, setDayFilter] = useState("all");
	const [peminatanFilter, setPeminatanFilter] = useState("all");

	// Modal states
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSchedule, setEditingSchedule] = useState<any>(null);
	const [deleteId, setDeleteId] = useState<number | null>(null);

	const fetchSchedules = async () => {
		setIsLoading(true);
		try {
			const query: any = {};
			if (cohortFilter !== "all") query.cohort = cohortFilter;
			if (rombelFilter !== "all") query.rombel = rombelFilter;
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

	const fetchCourses = async () => {
		try {
			const { data, error } = await (api as any).courses.get();
			if (!error && data?.success && Array.isArray(data.data)) {
				setCourses(data.data);
			}
		} catch (error) {
			console.error("Error fetching courses:", error);
		}
	};

	const fetchRegisteredCohorts = async () => {
		try {
			const res = await (api as any).students.cohorts.get();
			if (res.data?.success && Array.isArray(res.data.data)) {
				setRegisteredCohorts(res.data.data);
				return;
			}
			const summaryRes = await (api as any).dashboard.summary.get({
				$query: { archived: "false" },
			});
			if (summaryRes.data?.data?.cohorts) {
				setRegisteredCohorts(summaryRes.data.data.cohorts);
			}
		} catch (error) {
			console.error("Error fetching registered cohorts:", error);
		}
	};

	useEffect(() => {
		fetchDosens();
		fetchCourses();
		fetchRegisteredCohorts();
	}, []);

	useEffect(() => {
		fetchSchedules();
	}, [cohortFilter, rombelFilter, dayFilter]);

	// Extract unique cohort list dynamically from registered students, courses, and schedules
	const dynamicCohorts = useMemo(() => {
		const cohorts = new Set<string>();
		registeredCohorts.forEach((c) => cohorts.add(c.toString()));
		courses.forEach((c) => {
			if (c.cohort) cohorts.add(c.cohort.toString());
		});
		schedules.forEach((s) => {
			if (s.cohort) cohorts.add(s.cohort.toString());
		});
		if (cohorts.size === 0) {
			[16, 15, 14].forEach((c) => cohorts.add(c.toString()));
		}
		return Array.from(cohorts).sort((a, b) => Number(b) - Number(a));
	}, [registeredCohorts, courses, schedules]);

	// Extract unique rombel list dynamically
	const dynamicRombels = useMemo(() => {
		const rombels = new Set<string>(["Kelas A", "Kelas B"]);
		schedules.forEach((s) => {
			if (s.rombel) rombels.add(s.rombel);
		});
		return Array.from(rombels).sort();
	}, [schedules]);

	// Extract unique peminatan list dynamically from courses
	const availablePeminatans = useMemo(() => {
		const set = new Set<string>();
		courses.forEach((c) => {
			if (c.peminatan && c.peminatan.trim()) {
				set.add(c.peminatan.trim());
			}
		});
		return Array.from(set).sort();
	}, [courses]);

	// Client-side search and peminatan filter
	const filteredSchedules = useMemo(() => {
		return schedules.filter((s) => {
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				const match =
					s.subject?.toLowerCase().includes(q) ||
					s.room?.toLowerCase().includes(q) ||
					s.rombel?.toLowerCase().includes(q) ||
					s.dosen?.fullName?.toLowerCase().includes(q) ||
					s.dosen?.name?.toLowerCase().includes(q) ||
					s.dosenPendamping?.fullName?.toLowerCase().includes(q) ||
					s.dayOfWeek?.toLowerCase().includes(q);
				if (!match) return false;
			}

			if (peminatanFilter !== "all") {
				const matched = courses.find(
					(c) =>
						c.name.toLowerCase() === (s.subject || "").toLowerCase() ||
						`${c.code} - ${c.name}`.toLowerCase() ===
							(s.subject || "").toLowerCase(),
				);
				if (!matched || matched.peminatan !== peminatanFilter) {
					return false;
				}
			}

			return true;
		});
	}, [schedules, searchQuery, peminatanFilter, courses]);

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
		searchQuery !== "" ||
		cohortFilter !== "all" ||
		rombelFilter !== "all" ||
		dayFilter !== "all" ||
		peminatanFilter !== "all";

	const resetFilters = () => {
		setSearchQuery("");
		setCohortFilter("all");
		setRombelFilter("all");
		setDayFilter("all");
		setPeminatanFilter("all");
	};

	const handleExportCSV = () => {
		if (filteredSchedules.length === 0) {
			toast.error("Tidak ada data jadwal praktikum untuk diekspor");
			return;
		}

		const exportData = filteredSchedules.map((s, idx) => {
			const dosenUtama = s.dosen?.fullName || s.dosen?.name || "-";
			const dosenPendamping =
				s.dosenPendamping?.fullName || s.dosenPendamping?.name || "-";
			return {
				No: idx + 1,
				Hari: s.dayOfWeek || "-",
				"Jam Mulai": s.startTime || "-",
				"Jam Selesai": s.endTime || "-",
				"Mata Kuliah / Sesi": s.subject || "-",
				"Dosen Pengampu / Instruktur": dosenUtama,
				"Instruktur Pendamping": dosenPendamping,
				Laboratorium: s.room || "-",
				"Rombongan Belajar": s.rombel || "-",
				Angkatan: s.cohort ? `Angkatan ${s.cohort}` : "-",
				Catatan: s.notes || "-",
			};
		});

		// Format penamaan file sesuai instruksi:
		// "Jadwal Praktikum NusadayaAcademy" + (Angkatan jika bukan all) + (Minat jika difilter) + (Rombel jika bukan all)
		const nameParts: string[] = ["Jadwal Praktikum NusadayaAcademy"];
		if (cohortFilter !== "all") {
			nameParts.push(`Angkatan ${cohortFilter}`);
		}
		if (peminatanFilter !== "all") {
			nameParts.push(`Minat ${peminatanFilter}`);
		}
		if (rombelFilter !== "all") {
			nameParts.push(rombelFilter);
		}
		const filename = nameParts.join(" ");

		exportToCSV(exportData, filename);
		toast.success(
			`Berhasil mengekspor ${filteredSchedules.length} data jadwal praktikum`,
		);
	};

	const handlePrint = () => {
		const originalTitle = document.title;
		const nameParts: string[] = ["Jadwal Praktikum NusadayaAcademy"];
		if (cohortFilter !== "all") {
			nameParts.push(`Angkatan ${cohortFilter}`);
		}
		if (peminatanFilter !== "all") {
			nameParts.push(`Minat ${peminatanFilter}`);
		}
		if (rombelFilter !== "all") {
			nameParts.push(rombelFilter);
		}
		document.title = nameParts.join(" ");
		window.print();
		setTimeout(() => {
			document.title = originalTitle;
		}, 1000);
	};

	return (
		<>
			<div className="space-y-4 no-print print:hidden">
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

							<div className="flex items-center gap-2 w-full sm:w-auto">
								<Button
									variant="outline"
									onClick={handleExportCSV}
									disabled={filteredSchedules.length === 0}
									className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold px-3 py-2 h-9"
								>
									<Download className="w-4 h-4 mr-1.5 text-emerald-600" />
									Export CSV
								</Button>

								<Button
									variant="outline"
									onClick={handlePrint}
									className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold px-3 py-2 h-9"
								>
									<Printer className="w-4 h-4 mr-1.5" />
									Cetak Jadwal
								</Button>

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
						</div>

						{/* Search and Filters Bar */}
						<div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
							<div className="relative flex-1 min-w-[220px]">
								<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
								<Input
									placeholder="Cari mata kuliah praktikum, instruktur, lab, rombel..."
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

							<div className="w-full sm:w-[160px]">
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
									value={rombelFilter}
									onValueChange={(val) => setRombelFilter(val || "all")}
								>
									<SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 border-slate-200">
										<SelectValue placeholder="Semua Rombel" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Semua Rombel</SelectItem>
										{dynamicRombels.map((rombel) => (
											<SelectItem key={rombel} value={rombel}>
												{rombel}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Filter Peminatan */}
							{availablePeminatans.length > 0 && (
								<div className="w-full sm:w-[160px]">
									<Select
										value={peminatanFilter}
										onValueChange={(val) => setPeminatanFilter(val || "all")}
									>
										<SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 border-slate-200">
											<SelectValue placeholder="Semua Minat" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Semua Minat</SelectItem>
											{availablePeminatans.map((p) => (
												<SelectItem key={p} value={p}>
													{p}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}

							<div className="w-full sm:w-[140px]">
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
											<TableHead className="w-[140px] text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3">
												Angkatan & Rombel
											</TableHead>
											<TableHead className="w-[150px] text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3">
												Laboratorium / Ruang
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
														<div className="flex flex-col gap-1 items-start">
															<div className="flex items-center gap-2">
																<div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
																	<User className="w-3.5 h-3.5" />
																</div>
																<span className="text-xs font-medium text-slate-800">
																	{s.dosen?.fullName || s.dosen?.name || "-"}
																</span>
															</div>
															{s.dosenPendamping && (
																<div className="flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50/70 border border-purple-200/60 px-1.5 py-0.5 rounded-md font-medium ml-8">
																	<span>
																		+{" "}
																		{s.dosenPendamping.fullName ||
																			s.dosenPendamping.name}
																	</span>
																	<span className="text-[10px] text-purple-500 font-normal">
																		(Pendamping)
																	</span>
																</div>
															)}
														</div>
													</TableCell>

													<TableCell className="py-3.5">
														<div className="flex flex-col gap-1 items-start">
															<Badge
																variant="outline"
																className="bg-blue-50/50 text-[#0517B0] border-blue-200/60 text-[11px] font-semibold rounded-lg px-2 py-0.5"
															>
																<GraduationCap className="w-3 h-3 mr-1" />
																Angkatan {s.cohort}
															</Badge>
															<Badge
																variant="outline"
																className="bg-purple-50 text-purple-700 border-purple-200/70 text-[10px] font-semibold rounded-md px-1.5 py-0.5"
															>
																<Users2 className="w-2.5 h-2.5 mr-1" />
																{s.rombel || "Kelas A"}
															</Badge>
														</div>
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
						courses={courses}
						cohortOptions={dynamicCohorts}
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

			<PrintableScheduleView
				title="JADWAL PRAKTIKUM & LABORATORIUM"
				schedules={filteredSchedules}
				cohortFilter={cohortFilter}
				rombelFilter={rombelFilter}
				dayFilter={dayFilter}
				peminatanFilter={peminatanFilter}
			/>
		</>
	);
}

function PracticumScheduleDialog({
	dosens,
	courses = [],
	cohortOptions = [],
	schedule,
	onClose,
	onSuccess,
}: {
	dosens: any[];
	courses?: any[];
	cohortOptions?: string[];
	schedule: any;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [isSaving, setIsSaving] = useState(false);
	const initialRoom = schedule?.room || "Ruang Kelas 1";
	const isStandardRoom = (STANDARDIZED_ROOMS as readonly string[]).includes(
		initialRoom,
	);

	const [roomType, setRoomType] = useState<string>(
		isStandardRoom ? initialRoom : "custom",
	);
	const [customRoom, setCustomRoom] = useState<string>(
		isStandardRoom ? "" : initialRoom,
	);

	// Determine matched course from registered courses
	const matchedCourse = courses.find(
		(c) =>
			c.name.toLowerCase() === (schedule?.subject || "").toLowerCase() ||
			`${c.code} - ${c.name}`.toLowerCase() ===
				(schedule?.subject || "").toLowerCase(),
	);

	const [selectedCourseId, setSelectedCourseId] = useState<string>(
		matchedCourse
			? matchedCourse.id.toString()
			: schedule?.subject
				? "custom"
				: "",
	);

	const [form, setForm] = useState({
		subject: schedule?.subject || "",
		dosenId: schedule?.dosenId?.toString() || "",
		dosenPendampingId: schedule?.dosenPendampingId
			? schedule.dosenPendampingId.toString()
			: schedule?.dosenPendamping?.id
				? schedule.dosenPendamping.id.toString()
				: "none",
		cohort:
			schedule?.cohort?.toString() ||
			(cohortOptions[0] ? cohortOptions[0].toString() : "16"),
		rombel: schedule?.rombel || "Kelas A",
		dayOfWeek: schedule?.dayOfWeek || "",
		startTime: schedule?.startTime || "",
		endTime: schedule?.endTime || "",
		notes: schedule?.notes || "",
	});

	const modalCohorts = useMemo(() => {
		const set = new Set<string>(cohortOptions.map(String));
		if (form.cohort) set.add(form.cohort.toString());
		if (schedule?.cohort) set.add(schedule.cohort.toString());
		if (set.size === 0) {
			[16, 15, 14].forEach((c) => set.add(c.toString()));
		}
		return Array.from(set).sort((a, b) => Number(b) - Number(a));
	}, [cohortOptions, form.cohort, schedule?.cohort]);

	const handleCourseSelect = (val: string | null) => {
		if (!val) return;
		setSelectedCourseId(val);
		if (val === "custom") return;
		const c = courses.find((item) => item.id.toString() === val);
		if (c) {
			setForm((prev) => ({
				...prev,
				subject: c.name,
				dosenId: c.dosenId ? c.dosenId.toString() : prev.dosenId,
				dosenPendampingId: c.dosenPendampingId
					? c.dosenPendampingId.toString()
					: c.dosenPendamping?.id
						? c.dosenPendamping.id.toString()
						: prev.dosenPendampingId,
				cohort: c.cohort ? c.cohort.toString() : prev.cohort,
				rombel: c.rombel || prev.rombel,
			}));
		}
	};

	const handleSave = async () => {
		const targetRoom = roomType === "custom" ? customRoom.trim() : roomType;

		if (
			!form.subject ||
			!form.cohort ||
			!targetRoom ||
			!form.rombel ||
			!form.dayOfWeek ||
			!form.startTime ||
			!form.endTime
		) {
			toast.error(
				"Mohon lengkapi data wajib (Mata Kuliah Praktik, Angkatan, Rombel, Ruangan/Lab, Hari, dan Waktu)",
			);
			return;
		}

		const dosenIdVal = form.dosenId ? parseInt(form.dosenId, 10) : undefined;
		const dosenPendampingIdVal =
			form.dosenPendampingId && form.dosenPendampingId !== "none"
				? parseInt(form.dosenPendampingId, 10)
				: null;

		if (
			dosenIdVal &&
			dosenPendampingIdVal &&
			dosenIdVal === dosenPendampingIdVal
		) {
			toast.error("Dosen pendamping tidak boleh sama dengan dosen utama");
			return;
		}

		setIsSaving(true);
		try {
			const payload = {
				...form,
				room: targetRoom,
				rombel: form.rombel.trim(),
				dosenId: dosenIdVal,
				dosenPendampingId: dosenPendampingIdVal,
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
			}

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

			toast.success(
				schedule
					? "Jadwal praktikum diperbarui"
					: "Jadwal praktikum berhasil ditambahkan",
			);
			onSuccess();
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
								Konfigurasi mata kuliah praktik, rombel, waktu, dan standarisasi
								ruangan
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-3.5 py-3">
					<div className="space-y-1.5 col-span-2">
						<div className="flex items-center justify-between">
							<Label className="text-xs font-semibold text-slate-700">
								Mata Kuliah Praktik <span className="text-rose-500">*</span>
							</Label>
							{courses.length > 0 && selectedCourseId !== "custom" && (
								<button
									type="button"
									onClick={() => setSelectedCourseId("custom")}
									className="text-[11px] text-[#0517B0] hover:underline font-medium"
								>
									+ Input Teks Manual
								</button>
							)}
							{courses.length > 0 && selectedCourseId === "custom" && (
								<button
									type="button"
									onClick={() => setSelectedCourseId("")}
									className="text-[11px] text-[#0517B0] hover:underline font-medium"
								>
									← Pilih dari Dropdown
								</button>
							)}
						</div>

						{courses.length > 0 && selectedCourseId !== "custom" ? (
							<Select
								value={selectedCourseId}
								onValueChange={(val) => handleCourseSelect(val || "")}
							>
								<SelectTrigger className="h-9 text-xs rounded-xl">
									<SelectValue placeholder="-- Pilih Mata Kuliah Praktik --">
										{selectedCourseId
											? (() => {
													const c = courses.find(
														(item) => item.id.toString() === selectedCourseId,
													);
													return c
														? `${c.code ? `[${c.code}] ` : ""}${c.name} (Angkatan ${c.cohort}${c.rombel ? ` - ${c.rombel}` : ""})`
														: form.subject || "Pilih Mata Kuliah Praktik";
												})()
											: form.subject || "Pilih Mata Kuliah Praktik"}
									</SelectValue>
								</SelectTrigger>
								<SelectContent className="max-h-60">
									<SelectItem
										value="custom"
										className="font-semibold text-[#0517B0]"
									>
										+ Input Manual / Teks Kustom...
									</SelectItem>
									{courses.map((c) => (
										<SelectItem key={c.id} value={c.id.toString()}>
											<div className="flex items-center gap-1.5">
												{c.code && (
													<span className="font-mono font-bold text-slate-600">
														[{c.code}]
													</span>
												)}
												<span className="font-medium text-slate-900">
													{c.name}
												</span>
												<span className="text-[11px] text-slate-400">
													(Angk. {c.cohort} • {c.rombel || "Semua"} •{" "}
													{c.type === "praktik" ? "Praktik" : "Teori"})
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<Input
								value={form.subject}
								onChange={(e) => setForm({ ...form, subject: e.target.value })}
								placeholder="Contoh: Praktikum Simulasi Wawancara Kerja"
								className="h-9 text-xs rounded-xl"
							/>
						)}

						{selectedCourseId && selectedCourseId !== "custom" && (
							<p className="text-[11px] text-emerald-600 font-medium">
								✓ Otomatis mengisi dosen/instruktur, angkatan, dan rombel dari
								mata kuliah terdaftar
							</p>
						)}
					</div>

					<div className="space-y-1.5 col-span-2 sm:col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Instruktur / Dosen Utama
						</Label>
						<Select
							value={form.dosenId}
							onValueChange={(v) => {
								const newDosenId = v || "";
								if (newDosenId === form.dosenPendampingId) {
									setForm({
										...form,
										dosenId: newDosenId,
										dosenPendampingId: "none",
									});
								} else {
									setForm({ ...form, dosenId: newDosenId });
								}
							}}
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
						<div className="flex items-center justify-between">
							<Label className="text-xs font-semibold text-slate-700">
								Dosen Pendamping / Asisten Lab{" "}
								<span className="text-[11px] font-normal text-slate-400">
									(Opsional)
								</span>
							</Label>
							{form.dosenPendampingId && form.dosenPendampingId !== "none" && (
								<button
									type="button"
									onClick={() =>
										setForm({ ...form, dosenPendampingId: "none" })
									}
									className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
								>
									Hapus
								</button>
							)}
						</div>
						<Select
							value={form.dosenPendampingId || "none"}
							onValueChange={(v) =>
								setForm({ ...form, dosenPendampingId: v || "none" })
							}
						>
							<SelectTrigger className="h-9 text-xs rounded-xl">
								{form.dosenPendampingId && form.dosenPendampingId !== "none" ? (
									(() => {
										const selected = dosens.find(
											(d) => d.id.toString() === form.dosenPendampingId,
										);
										return (
											<span className="font-medium text-purple-700">
												+{" "}
												{selected?.fullName ||
													`Dosen #${form.dosenPendampingId}`}{" "}
												(Pendamping)
											</span>
										);
									})()
								) : (
									<span className="text-slate-400">
										-- Tidak Ada Pendamping --
									</span>
								)}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">
									<span className="text-slate-500">
										-- Tidak Ada Pendamping --
									</span>
								</SelectItem>
								{dosens
									.filter((d) => d.id.toString() !== form.dosenId)
									.map((d) => (
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
						<Select
							value={form.cohort}
							onValueChange={(val) => setForm({ ...form, cohort: val || "" })}
						>
							<SelectTrigger className="h-9 text-xs rounded-xl">
								<SelectValue placeholder="Pilih Angkatan">
									{form.cohort ? `Angkatan ${form.cohort}` : "Pilih Angkatan"}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{modalCohorts.map((c) => (
									<SelectItem key={c} value={c}>
										Angkatan {c}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Rombongan Belajar Dynamic Input */}
					<div className="space-y-1.5 col-span-2 sm:col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Rombongan Belajar <span className="text-rose-500">*</span>
						</Label>
						<Input
							value={form.rombel}
							onChange={(e) => setForm({ ...form, rombel: e.target.value })}
							placeholder="Contoh: Kelas A, Kelas B, Gabungan..."
							className="h-9 text-xs rounded-xl"
						/>
						{/* Quick preset pills */}
						<div className="flex flex-wrap gap-1.5 pt-1">
							{DEFAULT_ROMBEL_OPTIONS.map((opt) => (
								<button
									key={opt}
									type="button"
									onClick={() => setForm({ ...form, rombel: opt })}
									className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
										form.rombel === opt
											? "bg-[#0517B0] text-white"
											: "bg-slate-100 text-slate-600 hover:bg-slate-200"
									}`}
								>
									{opt}
								</button>
							))}
						</div>
					</div>

					{/* Standarisasi Ruangan / Laboratorium */}
					<div className="space-y-1.5 col-span-2 sm:col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Ruangan / Laboratorium <span className="text-rose-500">*</span>
						</Label>
						<Select
							value={roomType}
							onValueChange={(val) => {
								const cleanVal = val || "";
								setRoomType(cleanVal);
								if (cleanVal !== "custom") setCustomRoom("");
							}}
						>
							<SelectTrigger className="h-9 text-xs rounded-xl">
								<SelectValue placeholder="Pilih Ruang / Lab" />
							</SelectTrigger>
							<SelectContent>
								{STANDARDIZED_ROOMS.map((r) => (
									<SelectItem key={r} value={r}>
										{r}
									</SelectItem>
								))}
								<SelectItem value="custom">
									-- Ruangan Lainnya (Kustom) --
								</SelectItem>
							</SelectContent>
						</Select>
						{roomType === "custom" && (
							<Input
								value={customRoom}
								onChange={(e) => setCustomRoom(e.target.value)}
								placeholder="Ketik nama laboratorium / ruangan..."
								className="h-8 text-xs rounded-lg mt-1.5"
							/>
						)}
					</div>

					<div className="space-y-1.5 col-span-2 sm:col-span-1">
						<Label className="text-xs font-semibold text-slate-700">
							Hari <span className="text-rose-500">*</span>
						</Label>
						<Select
							value={form.dayOfWeek}
							onValueChange={(v) => setForm({ ...form, dayOfWeek: v || "" })}
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

					<div className="space-y-1.5 col-span-2 sm:col-span-1 grid grid-cols-2 gap-2">
						<div>
							<Label className="text-xs font-semibold text-slate-700">
								Jam Mulai <span className="text-rose-500">*</span>
							</Label>
							<Input
								type="time"
								value={form.startTime}
								onChange={(e) =>
									setForm({ ...form, startTime: e.target.value })
								}
								className="h-9 text-xs rounded-xl"
							/>
						</div>
						<div>
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
