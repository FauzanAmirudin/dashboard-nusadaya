"use client";

import {
	AlertCircle,
	ArrowLeft,
	BookOpen,
	Building2,
	CalendarDays,
	Calendar as CalendarIcon,
	CheckCircle2,
	Clock,
	Download,
	Eye,
	FileText,
	GraduationCap,
	Loader2,
	Pencil,
	Plus,
	Search,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";
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
	DialogDescription,
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
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

const DEFAULT_18_PERIODS = [
	{ title: "PKKMB", periodType: "pkkmb", orderIndex: 0 },
	{ title: "Beginning Class", periodType: "beginning_class", orderIndex: 1 },
	{ title: "Pertemuan Ke-1", periodType: "pertemuan", orderIndex: 2 },
	{ title: "Pertemuan Ke-2", periodType: "pertemuan", orderIndex: 3 },
	{ title: "Pertemuan Ke-3", periodType: "pertemuan", orderIndex: 4 },
	{ title: "Pertemuan Ke-4", periodType: "pertemuan", orderIndex: 5 },
	{ title: "Pertemuan Ke-5", periodType: "pertemuan", orderIndex: 6 },
	{ title: "Pertemuan Ke-6", periodType: "pertemuan", orderIndex: 7 },
	{ title: "Pertemuan Ke-7", periodType: "pertemuan", orderIndex: 8 },
	{ title: "Pertemuan Ke-8 (UTS)", periodType: "uts", orderIndex: 9 },
	{ title: "Pertemuan Ke-9", periodType: "pertemuan", orderIndex: 10 },
	{ title: "Pertemuan Ke-10", periodType: "pertemuan", orderIndex: 11 },
	{ title: "Pertemuan Ke-11", periodType: "pertemuan", orderIndex: 12 },
	{ title: "Pertemuan Ke-12", periodType: "pertemuan", orderIndex: 13 },
	{ title: "Pertemuan Ke-13", periodType: "pertemuan", orderIndex: 14 },
	{ title: "Pertemuan Ke-14", periodType: "pertemuan", orderIndex: 15 },
	{ title: "Pertemuan Ke-15", periodType: "pertemuan", orderIndex: 16 },
	{ title: "Pertemuan Ke-16 (UAS)", periodType: "uas", orderIndex: 17 },
];

function formatDateIndonesian(dateStr: string | null | undefined): string {
	if (!dateStr) return "-";
	try {
		const parts = dateStr.split("-");
		if (parts.length === 3) {
			const year = parseInt(parts[0], 10);
			const month = parseInt(parts[1], 10) - 1;
			const day = parseInt(parts[2], 10);
			const date = new Date(year, month, day);
			return new Intl.DateTimeFormat("id-ID", {
				day: "numeric",
				month: "long",
				year: "numeric",
			}).format(date);
		}
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return dateStr;
		return new Intl.DateTimeFormat("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
		}).format(date);
	} catch {
		return dateStr;
	}
}

export function KalenderAkademikDashboard() {
	const { user } = useAuthStore();
	const canEdit = user?.role === "superadmin" || user?.role === "akademik";

	const [view, setView] = useState<"list" | "create" | "detail">("list");
	const [selectedId, setSelectedId] = useState<number | null>(null);

	return (
		<div className="space-y-6">
			{view === "list" && (
				<ListCalendarView
					canEdit={canEdit}
					onViewDetail={(id) => {
						setSelectedId(id);
						setView("detail");
					}}
					onCreateNew={() => setView("create")}
				/>
			)}

			{view === "create" && (
				<CreateCalendarView
					onBack={() => setView("list")}
					onSuccess={() => setView("list")}
				/>
			)}

			{view === "detail" && selectedId && (
				<DetailCalendarView
					calendarId={selectedId}
					canEdit={canEdit}
					onBack={() => {
						setSelectedId(null);
						setView("list");
					}}
				/>
			)}
		</div>
	);
}

// -------------------------------------------------------------
// 1. LIST VIEW (Daftar Kalender Akademik)
// -------------------------------------------------------------
function ListCalendarView({
	canEdit,
	onViewDetail,
	onCreateNew,
}: {
	canEdit: boolean;
	onViewDetail: (id: number) => void;
	onCreateNew: () => void;
}) {
	const [calendars, setCalendars] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [deleteCalendarId, setDeleteCalendarId] = useState<number | null>(null);

	// Search & Filters State
	const [searchQuery, setSearchQuery] = useState("");
	const [cohortFilter, setCohortFilter] = useState("all");

	const fetchCalendars = async () => {
		setIsLoading(true);
		try {
			const { data, error } = await api["academic-calendars"].get({
				$query: { limit: "50" },
			});
			if (!error && data?.success) {
				setCalendars(data.data || []);
			}
		} catch (error) {
			toast.error("Gagal memuat daftar kalender");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCalendars();
	}, []);

	const handleDeleteConfirm = async () => {
		if (!deleteCalendarId) return;
		try {
			const { error } =
				await api["academic-calendars"][deleteCalendarId.toString()].delete();
			if (!error) {
				toast.success("Kalender berhasil dihapus");
				fetchCalendars();
			} else {
				toast.error("Gagal menghapus kalender");
			}
		} catch (error) {
			toast.error("Gagal menghapus kalender");
		} finally {
			setDeleteCalendarId(null);
		}
	};

	// Available Cohort Options for Filter
	const availableCohorts = Array.from(
		new Set(calendars.map((c) => c.cohort?.toString()).filter(Boolean)),
	).sort((a, b) => Number(b) - Number(a));

	// Filtered Calendars List
	const filteredCalendars = calendars.filter((c) => {
		const matchesSearch =
			!searchQuery ||
			c.academicYear?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.cohort?.toString().includes(searchQuery);

		const matchesCohort =
			cohortFilter === "all" || c.cohort?.toString() === cohortFilter;

		return matchesSearch && matchesCohort;
	});

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
				<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
				<span className="text-xs font-medium text-slate-500">
					Memuat daftar kalender akademik...
				</span>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Executive Header Banner */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
				<div className="flex items-center gap-3.5">
					<div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0517B0] to-blue-600 text-white flex items-center justify-center shadow-2xs ring-4 ring-blue-50 shrink-0">
						<CalendarDays className="w-5 h-5" />
					</div>
					<div>
						<div className="flex items-center gap-2.5">
							<h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
								Kalender Akademik
							</h1>
							<Badge
								variant="secondary"
								className="bg-blue-50 text-[#0517B0] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-200/60"
							>
								Panel Akademik
							</Badge>
						</div>
						<p className="text-xs text-slate-500 mt-0.5">
							Master jadwal perkuliahan, rentang 18 minggu, UTS, UAS, dan agenda
							akademik
						</p>
					</div>
				</div>

				{canEdit && (
					<Button
						onClick={onCreateNew}
						className="h-9 text-xs text-white bg-[#0517B0] hover:bg-[#0517B0]/90 font-semibold shadow-2xs gap-1.5 shrink-0"
					>
						<Plus className="w-4 h-4" />
						<span>Buat Kalender Baru</span>
					</Button>
				)}
			</div>

			{/* Top 3 KPI Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center shrink-0">
							<CalendarIcon className="w-5 h-5" />
						</div>
						<div>
							<span className="text-xs font-medium text-slate-500 block">
								Total Kalender Terdaftar
							</span>
							<span className="text-base font-bold text-slate-800">
								{calendars.length} Tahun Ajaran
							</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
							<GraduationCap className="w-5 h-5" />
						</div>
						<div>
							<span className="text-xs font-medium text-slate-500 block">
								Angkatan Terdata
							</span>
							<span className="text-base font-bold text-slate-800">
								{availableCohorts.length > 0
									? `${availableCohorts.length} Angkatan Aktif`
									: "Belum Ada"}
							</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
							<Sparkles className="w-5 h-5" />
						</div>
						<div>
							<span className="text-xs font-medium text-slate-500 block">
								Standar Semester
							</span>
							<span className="text-base font-bold text-slate-800">
								18 Minggu Akademik
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Card: Search & Table */}
			<div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
				{/* Smart Toolbar */}
				<div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
					<div className="relative flex-1 w-full">
						<Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
						<Input
							placeholder="Cari Tahun Ajaran atau Angkatan..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 pr-8 h-9 text-xs bg-slate-50/50 border-slate-200"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>

					<div className="w-full sm:w-56 shrink-0 flex items-center gap-2">
						<Select
							value={cohortFilter}
							onValueChange={(val) => setCohortFilter(val || "all")}
						>
							<SelectTrigger className="h-9 text-xs bg-slate-50/50 border-slate-200 w-full">
								<SelectValue placeholder="Semua Angkatan" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Angkatan</SelectItem>
								{availableCohorts.map((cohort) => (
									<SelectItem key={cohort} value={cohort}>
										Angkatan {cohort}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{(searchQuery || cohortFilter !== "all") && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setSearchQuery("");
									setCohortFilter("all");
								}}
								className="h-9 text-xs text-slate-500 hover:text-slate-800 shrink-0 px-2"
							>
								Reset
							</Button>
						)}
					</div>
				</div>

				{/* Table Data */}
				{filteredCalendars.length === 0 ? (
					<div className="text-center py-16 text-slate-400">
						<CalendarIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
						<h3 className="text-sm font-bold text-slate-700">
							{calendars.length === 0
								? "Belum ada kalender akademik terdaftar"
								: "Tidak ada kalender yang sesuai dengan filter"}
						</h3>
						<p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
							{calendars.length === 0
								? "Silakan buat master kalender akademik baru untuk mengelola agenda semester."
								: "Coba ubah kata kunci pencarian atau reset filter angkatan."}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50/60 hover:bg-slate-50/60 border-slate-100">
									<TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3.5 pl-5">
										Tahun Ajaran
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3.5">
										Angkatan
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3.5">
										Rentang Tanggal
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3.5 text-right pr-5">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredCalendars.map((c) => (
									<TableRow
										key={c.id}
										className="hover:bg-slate-50/60 border-slate-100 transition-colors"
									>
										<TableCell className="py-3.5 pl-5">
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
													TA
												</div>
												<span className="font-bold text-slate-900 text-sm">
													{c.academicYear}
												</span>
											</div>
										</TableCell>
										<TableCell className="py-3.5">
											<Badge
												variant="outline"
												className="bg-slate-50 text-slate-700 font-mono text-xs border-slate-200 px-2.5 py-0.5"
											>
												Angkatan {c.cohort}
											</Badge>
										</TableCell>
										<TableCell className="py-3.5">
											<div className="flex items-center gap-1.5 text-xs text-slate-600">
												<CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
												<span>
													{formatDateIndonesian(c.startDate)} s.d.{" "}
													{formatDateIndonesian(c.endDate)}
												</span>
											</div>
										</TableCell>
										<TableCell className="py-3.5 text-right pr-5">
											<div className="flex items-center justify-end gap-1.5">
												<Button
													variant="outline"
													size="sm"
													onClick={() => onViewDetail(c.id)}
													className="h-8 text-xs text-[#0517B0] border-blue-200 hover:bg-blue-50 font-semibold gap-1"
												>
													<Eye className="w-3.5 h-3.5" />
													<span>Detail</span>
												</Button>
												{canEdit && (
													<Button
														variant="ghost"
														size="icon"
														onClick={() => setDeleteCalendarId(c.id)}
														className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</Button>
												)}
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>

			{/* Confirm Delete Calendar AlertDialog */}
			<AlertDialog
				open={deleteCalendarId !== null}
				onOpenChange={(open) => !open && setDeleteCalendarId(null)}
			>
				<AlertDialogContent className="bg-white border-slate-200/90 rounded-2xl p-6 text-slate-800">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base font-bold text-slate-900">
							Hapus Master Kalender Akademik
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-slate-500">
							Apakah Anda yakin ingin menghapus kalender akademik ini? Seluruh
							data periode 18 minggu dan kegiatan tambahan terkait akan ikut
							terhapus permanen.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-2 pt-2">
						<AlertDialogCancel className="h-9 text-xs border-slate-200 hover:bg-slate-50 text-slate-600">
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
						>
							Hapus Kalender
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// -------------------------------------------------------------
// 2. CREATE VIEW (Form Tambah Kalender)
// -------------------------------------------------------------
function CreateCalendarView({
	onBack,
	onSuccess,
}: {
	onBack: () => void;
	onSuccess: () => void;
}) {
	const [form, setForm] = useState({
		academicYear: "",
		cohort: "",
		startDate: "",
		endDate: "",
	});
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		if (
			!form.academicYear ||
			!form.cohort ||
			!form.startDate ||
			!form.endDate
		) {
			toast.error("Mohon lengkapi seluruh kolom isian");
			return;
		}

		if (new Date(form.startDate) > new Date(form.endDate)) {
			toast.error("Tanggal selesai harus setelah tanggal mulai");
			return;
		}

		setIsSaving(true);
		try {
			const { error } = await api["academic-calendars"].post(form);
			if (!error) {
				toast.success("Kalender akademik berhasil dibuat!");
				onSuccess();
			} else {
				toast.error("Gagal membuat kalender");
			}
		} catch (error) {
			toast.error("Gagal membuat kalender");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header Navigation */}
			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					size="sm"
					onClick={onBack}
					className="h-8.5 text-xs text-slate-600 bg-white border-slate-200/90 shadow-2xs gap-1.5"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					<span>Kembali ke Daftar</span>
				</Button>
			</div>

			{/* Form Card */}
			<div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-6 sm:p-8 max-w-2xl">
				<div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-6">
					<div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center shrink-0 shadow-2xs">
						<CalendarDays className="w-5 h-5" />
					</div>
					<div>
						<h2 className="text-base font-bold text-slate-900 tracking-tight">
							Buat Kalender Akademik Baru
						</h2>
						<p className="text-xs text-slate-500">
							Tentukan tahun ajaran, angkatan, dan rentang tanggal pelaksanaan
							semester
						</p>
					</div>
				</div>

				<div className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-700">
								Tahun Ajaran <span className="text-rose-500">*</span>
							</Label>
							<Input
								placeholder="Contoh: 2024/2025"
								value={form.academicYear}
								onChange={(e) =>
									setForm({ ...form, academicYear: e.target.value })
								}
								className="h-9 text-xs bg-white"
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-700">
								Angkatan <span className="text-rose-500">*</span>
							</Label>
							<Input
								type="number"
								placeholder="Contoh: 16"
								value={form.cohort || ""}
								onChange={(e) => setForm({ ...form, cohort: e.target.value })}
								className="h-9 text-xs bg-white"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-700">
								Tanggal Mulai <span className="text-rose-500">*</span>
							</Label>
							<Input
								type="date"
								value={form.startDate}
								onChange={(e) =>
									setForm({ ...form, startDate: e.target.value })
								}
								className="h-9 text-xs bg-white"
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-700">
								Tanggal Selesai <span className="text-rose-500">*</span>
							</Label>
							<Input
								type="date"
								value={form.endDate}
								onChange={(e) => setForm({ ...form, endDate: e.target.value })}
								className="h-9 text-xs bg-white"
							/>
						</div>
					</div>

					<div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
						<Button variant="outline" onClick={onBack} className="h-9 text-xs">
							Batal
						</Button>
						<Button
							onClick={handleSave}
							disabled={isSaving}
							className="h-9 text-xs text-white bg-[#0517B0] hover:bg-[#0517B0]/90 font-semibold shadow-2xs gap-1.5"
						>
							{isSaving ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<Plus className="w-3.5 h-3.5" />
							)}
							<span>Simpan Master Kalender</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

// -------------------------------------------------------------
// 3. DETAIL VIEW (With Export PDF Feature)
// -------------------------------------------------------------
function DetailCalendarView({
	calendarId,
	canEdit,
	onBack,
}: {
	calendarId: number;
	canEdit: boolean;
	onBack: () => void;
}) {
	const [calendar, setCalendar] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isExporting, setIsExporting] = useState(false);

	// Modals State
	const [editPeriod, setEditPeriod] = useState<any>(null);
	const [isEventModalOpen, setIsEventModalOpen] = useState(false);
	const [deleteEventId, setDeleteEventId] = useState<number | null>(null);

	const fetchDetail = async () => {
		setIsLoading(true);
		try {
			const { data, error } =
				await api["academic-calendars"][calendarId.toString()].get();
			if (!error && data?.success) {
				setCalendar(data.data);
			}
		} catch (error) {
			toast.error("Gagal memuat detail kalender");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchDetail();
	}, [calendarId]);

	const handleDeleteEventConfirm = async () => {
		if (!deleteEventId) return;
		try {
			const { error } =
				await api["academic-calendars"][calendarId.toString()].events[
					deleteEventId.toString()
				].delete();
			if (!error) {
				toast.success("Kegiatan berhasil dihapus");
				fetchDetail();
			} else {
				toast.error("Gagal menghapus kegiatan");
			}
		} catch {
			toast.error("Gagal menghapus kegiatan");
		} finally {
			setDeleteEventId(null);
		}
	};

	const handleExportPDF = async () => {
		if (!calendar) return;
		setIsExporting(true);
		try {
			const { toPng } = await import("html-to-image");
			const { default: jsPDF } = await import("jspdf");

			const element = document.getElementById("academic-calendar-pdf-template");
			if (!element) {
				toast.error("Template PDF tidak ditemukan");
				return;
			}

			// Render template temporarily
			element.style.display = "block";
			const dataUrl = await toPng(element, { quality: 0.98, pixelRatio: 2 });
			element.style.display = "none";

			const pdf = new jsPDF({
				orientation: "portrait",
				unit: "mm",
				format: "a4",
			});

			const imgProps = pdf.getImageProperties(dataUrl);
			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
			const pageHeight = pdf.internal.pageSize.getHeight();

			let heightLeft = pdfHeight;
			let position = 0;

			pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, pdfHeight);
			heightLeft -= pageHeight;

			while (heightLeft > 0) {
				position = heightLeft - pdfHeight;
				pdf.addPage();
				pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, pdfHeight);
				heightLeft -= pageHeight;
			}

			pdf.save(
				`Kalender_Akademik_TA_${calendar.academicYear.replace("/", "-")}_Angkatan_${calendar.cohort}.pdf`,
			);
			toast.success("Kalender Akademik berhasil di-export ke PDF!");
		} catch (err) {
			console.error("Export PDF Error:", err);
			toast.error("Gagal men-generate PDF");
		} finally {
			setIsExporting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
				<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
				<span className="text-xs font-medium text-slate-500">
					Memuat rincian kalender akademik...
				</span>
			</div>
		);
	}

	if (!calendar) {
		return (
			<div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-2xs">
				<CalendarIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
				<h3 className="text-sm font-bold text-slate-700">
					Kalender tidak ditemukan
				</h3>
				<Button
					variant="outline"
					size="sm"
					onClick={onBack}
					className="mt-4 h-8.5 text-xs"
				>
					Kembali ke Daftar
				</Button>
			</div>
		);
	}

	// Build guaranteed 18 periods
	const existingPeriodsMap = new Map();
	(calendar.periods || []).forEach((p: any) => {
		existingPeriodsMap.set(p.title, p);
	});

	const displayedPeriods = DEFAULT_18_PERIODS.map((defItem) => {
		const foundInDb = existingPeriodsMap.get(defItem.title);
		if (foundInDb) return foundInDb;
		return {
			id: null,
			title: defItem.title,
			periodType: defItem.periodType,
			orderIndex: defItem.orderIndex,
			startDate: calendar.startDate,
			endDate: calendar.endDate,
			description: "",
		};
	});

	return (
		<div className="space-y-6">
			{/* Top Executive Header Card with Back Action & Export PDF */}
			<div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-3.5">
						<Button
							variant="outline"
							size="icon"
							onClick={onBack}
							className="h-9 w-9 text-slate-600 bg-white border-slate-200/90 rounded-xl hover:bg-slate-50 shadow-2xs shrink-0"
						>
							<ArrowLeft className="w-4 h-4" />
						</Button>
						<div>
							<div className="flex items-center gap-2.5 flex-wrap">
								<h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
									TA {calendar.academicYear} — Angkatan {calendar.cohort}
								</h1>
								<Badge
									variant="secondary"
									className="bg-blue-50 text-[#0517B0] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-200/60"
								>
									Master Kalender
								</Badge>
							</div>
							<p className="text-xs text-slate-500 mt-0.5">
								Struktur 18 minggu perkuliahan & agenda acara akademik
							</p>
						</div>
					</div>

					{/* EXPORT PDF BUTTON */}
					<Button
						variant="outline"
						onClick={handleExportPDF}
						disabled={isExporting}
						className="h-9 text-xs text-[#0517B0] border-blue-200 hover:bg-blue-50 font-semibold gap-1.5 shadow-2xs self-start sm:self-auto"
					>
						{isExporting ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Download className="w-3.5 h-3.5" />
						)}
						<span>Export PDF</span>
					</Button>
				</div>

				{/* Metadata Chips Bar */}
				<div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
					<div className="flex items-center gap-1.5">
						<CalendarDays className="w-3.5 h-3.5 text-[#0517B0]" />
						<span className="text-slate-500 font-medium">
							Periode Kalender:
						</span>
						<span className="font-semibold text-slate-800">
							{formatDateIndonesian(calendar.startDate)} s.d.{" "}
							{formatDateIndonesian(calendar.endDate)}
						</span>
					</div>
					<div className="flex items-center gap-1.5">
						<BookOpen className="w-3.5 h-3.5 text-[#0517B0]" />
						<span className="text-slate-500 font-medium">Pertemuan:</span>
						<span className="font-semibold text-slate-800">
							18 Sesi (PKKMB, BC, 14 Kuliah, UTS, UAS)
						</span>
					</div>
				</div>
			</div>

			{/* 2-Column Grid Layout */}
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
				{/* LEFT COLUMN: 18-WEEK TIMELINE */}
				<div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
					<div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<CalendarDays className="w-4 h-4 text-[#0517B0]" />
							<h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
								Struktur 18 Minggu Perkuliahan
							</h3>
						</div>
						<Badge
							variant="outline"
							className="text-[10px] font-semibold bg-slate-50 text-slate-600 border-slate-200"
						>
							18 Sesi Standard
						</Badge>
					</div>

					<div className="p-4 sm:p-5 space-y-3 overflow-y-auto max-h-[750px]">
						{displayedPeriods.map((p: any, idx: number) => {
							const isUtsUas = p.periodType === "uts" || p.periodType === "uas";
							const isClass =
								p.periodType === "beginning_class" || p.periodType === "pkkmb";

							return (
								<div
									key={p.id || `default-${idx}`}
									className={cn(
										"p-4 rounded-xl border transition-all space-y-2",
										isUtsUas
											? "bg-amber-50/40 border-amber-200/80 shadow-2xs"
											: isClass
												? "bg-blue-50/30 border-blue-200/80 shadow-2xs"
												: "bg-white border-slate-200/80 shadow-2xs hover:border-slate-300",
									)}
								>
									<div className="flex justify-between items-start gap-2">
										<div className="space-y-0.5">
											<div className="flex items-center gap-2">
												<span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
													#{idx + 1}
												</span>
												<h4 className="font-bold text-slate-900 text-xs sm:text-sm">
													{p.title}
												</h4>
											</div>
											<div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium pl-7">
												<Clock className="w-3 h-3 text-slate-400 shrink-0" />
												<span>
													{p.startDate === p.endDate
														? formatDateIndonesian(p.startDate)
														: `${formatDateIndonesian(p.startDate)} s.d. ${formatDateIndonesian(p.endDate)}`}
												</span>
											</div>
										</div>

										<Badge
											variant={isUtsUas ? "default" : "outline"}
											className={cn(
												"text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md",
												isUtsUas
													? "bg-amber-600 hover:bg-amber-600 text-white"
													: isClass
														? "bg-blue-50 text-[#0517B0] border-blue-200"
														: "bg-slate-50 text-slate-600 border-slate-200",
											)}
										>
											{p.periodType.replace("_", " ")}
										</Badge>
									</div>

									{p.description ? (
										<div className="text-xs bg-white/80 p-2.5 rounded-lg text-slate-700 border border-slate-200/60 mt-1">
											<span className="font-semibold text-slate-500 text-[10px] uppercase block mb-0.5">
												Catatan / Keterangan:
											</span>
											{p.description}
										</div>
									) : (
										<p className="text-[11px] text-slate-400 italic pl-7">
											Belum ada deskripsi khusus
										</p>
									)}

									{canEdit && (
										<div className="flex justify-end pt-1">
											<Button
												size="sm"
												variant="ghost"
												className="h-7 text-xs text-[#0517B0] hover:bg-blue-50 font-semibold gap-1"
												onClick={() => setEditPeriod(p)}
											>
												<Pencil className="w-3 h-3" />
												<span>Edit Tanggal & Catatan</span>
											</Button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* RIGHT COLUMN: KEGIATAN & ACARA TAMBAHAN */}
				<div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
					<div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
						<div>
							<div className="flex items-center gap-2">
								<Sparkles className="w-4 h-4 text-[#0517B0]" />
								<h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
									Kegiatan & Acara Tambahan
								</h3>
							</div>
							<p className="text-[11px] text-slate-500 mt-0.5">
								Agenda khusus di luar jadwal perkuliahan 18 minggu
							</p>
						</div>

						{canEdit && (
							<Button
								size="sm"
								onClick={() => setIsEventModalOpen(true)}
								className="h-8 text-xs text-white bg-[#0517B0] hover:bg-[#0517B0]/90 font-semibold gap-1 shadow-2xs"
							>
								<Plus className="w-3.5 h-3.5" />
								<span>Tambah Acara</span>
							</Button>
						)}
					</div>

					<div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[750px]">
						{calendar.events?.length === 0 ? (
							<div className="text-center py-16 text-slate-400 bg-slate-50/60 rounded-xl border border-slate-200/80">
								<CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
								<p className="text-xs font-medium text-slate-500">
									Belum ada kegiatan atau acara tambahan yang dijadwalkan.
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{calendar.events?.map((e: any) => (
									<div
										key={e.id}
										className="p-4 border border-slate-200/80 rounded-xl bg-white shadow-2xs hover:border-slate-300 transition-colors flex justify-between items-start gap-3"
									>
										<div className="space-y-1 flex-1 min-w-0">
											<h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
												{e.title}
											</h4>
											<div className="flex items-center gap-1.5 text-[11px] text-slate-500">
												<Clock className="w-3 h-3 text-slate-400 shrink-0" />
												<span>
													{formatDateIndonesian(e.startDate)}{" "}
													{e.endDate && e.endDate !== e.startDate
														? `s.d. ${formatDateIndonesian(e.endDate)}`
														: ""}
												</span>
											</div>
											{e.description && (
												<p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
													{e.description}
												</p>
											)}
										</div>

										{canEdit && (
											<Button
												size="icon"
												variant="ghost"
												className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 rounded-lg shrink-0"
												onClick={() => setDeleteEventId(e.id)}
											>
												<Trash2 className="w-3.5 h-3.5" />
											</Button>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* HIDDEN PRINT/EXPORT TEMPLATE FOR PDF */}
			<div
				id="academic-calendar-pdf-template"
				style={{
					display: "none",
					width: "794px",
					background: "#ffffff",
					padding: "32px",
					fontFamily: "sans-serif",
				}}
			>
				{/* PDF Header */}
				<div
					style={{
						textAlign: "center",
						borderBottom: "2px solid #0517B0",
						paddingBottom: "16px",
						marginBottom: "20px",
					}}
				>
					<h2
						style={{
							fontSize: "14px",
							fontWeight: "bold",
							color: "#0517B0",
							textTransform: "uppercase",
							letterSpacing: "1px",
							margin: 0,
						}}
					>
						Nusadaya Academy
					</h2>
					<h1
						style={{
							fontSize: "22px",
							fontWeight: "800",
							color: "#0f172a",
							margin: "6px 0",
						}}
					>
						KALENDER AKADEMIK
					</h1>
					<p
						style={{
							fontSize: "13px",
							color: "#334155",
							margin: 0,
							fontWeight: "600",
						}}
					>
						Tahun Ajaran {calendar.academicYear} — Angkatan {calendar.cohort}
					</p>
					<p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
						Rentang Waktu: {formatDateIndonesian(calendar.startDate)} s.d.{" "}
						{formatDateIndonesian(calendar.endDate)}
					</p>
				</div>

				{/* Section 1: 18 Weeks Schedule Table */}
				<div style={{ marginBottom: "24px" }}>
					<h3
						style={{
							fontSize: "13px",
							fontWeight: "bold",
							color: "#0f172a",
							marginBottom: "10px",
							borderLeft: "4px solid #0517B0",
							paddingLeft: "8px",
						}}
					>
						JADWAL MINGGU PERTEMUAN & UTS/UAS
					</h3>
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							fontSize: "11px",
							color: "#1e293b",
						}}
					>
						<thead>
							<tr
								style={{
									background: "#f8fafc",
									textAlign: "left",
									color: "#475569",
								}}
							>
								<th
									style={{
										border: "1px solid #cbd5e1",
										padding: "8px 10px",
										width: "35px",
										textAlign: "center",
									}}
								>
									No
								</th>
								<th
									style={{
										border: "1px solid #cbd5e1",
										padding: "8px 10px",
										width: "180px",
									}}
								>
									Pertemuan / Agenda
								</th>
								<th
									style={{
										border: "1px solid #cbd5e1",
										padding: "8px 10px",
										width: "80px",
										textAlign: "center",
									}}
								>
									Jenis
								</th>
								<th
									style={{
										border: "1px solid #cbd5e1",
										padding: "8px 10px",
										width: "220px",
									}}
								>
									Tanggal / Rentang Tanggal
								</th>
								<th
									style={{ border: "1px solid #cbd5e1", padding: "8px 10px" }}
								>
									Deskripsi Khusus
								</th>
							</tr>
						</thead>
						<tbody>
							{displayedPeriods.map((p: any, idx: number) => {
								const isUtsUas =
									p.periodType === "uts" || p.periodType === "uas";
								return (
									<tr
										key={idx}
										style={{
											background: isUtsUas
												? "#fef3c7"
												: idx % 2 === 0
													? "#ffffff"
													: "#f8fafc",
										}}
									>
										<td
											style={{
												border: "1px solid #cbd5e1",
												padding: "6px 10px",
												textAlign: "center",
												fontWeight: "bold",
											}}
										>
											{idx + 1}
										</td>
										<td
											style={{
												border: "1px solid #cbd5e1",
												padding: "6px 10px",
												fontWeight: isUtsUas ? "bold" : "600",
											}}
										>
											{p.title}
										</td>
										<td
											style={{
												border: "1px solid #cbd5e1",
												padding: "6px 10px",
												textAlign: "center",
												textTransform: "uppercase",
												fontSize: "10px",
												fontWeight: "600",
											}}
										>
											{p.periodType}
										</td>
										<td
											style={{
												border: "1px solid #cbd5e1",
												padding: "6px 10px",
											}}
										>
											{p.startDate === p.endDate
												? formatDateIndonesian(p.startDate)
												: `${formatDateIndonesian(p.startDate)} s.d. ${formatDateIndonesian(p.endDate)}`}
										</td>
										<td
											style={{
												border: "1px solid #cbd5e1",
												padding: "6px 10px",
												color: p.description ? "#0f172a" : "#94a3b8",
												fontStyle: p.description ? "normal" : "italic",
											}}
										>
											{p.description || "-"}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{/* Section 2: Additional Events */}
				{calendar.events && calendar.events.length > 0 && (
					<div style={{ marginTop: "24px" }}>
						<h3
							style={{
								fontSize: "13px",
								fontWeight: "bold",
								color: "#0f172a",
								marginBottom: "10px",
								borderLeft: "4px solid #16a34a",
								paddingLeft: "8px",
							}}
						>
							KEGIATAN & ACARA TAMBAHAN
						</h3>
						<table
							style={{
								width: "100%",
								borderCollapse: "collapse",
								fontSize: "11px",
								color: "#1e293b",
							}}
						>
							<thead>
								<tr
									style={{
										background: "#f8fafc",
										textAlign: "left",
										color: "#475569",
									}}
								>
									<th
										style={{
											border: "1px solid #cbd5e1",
											padding: "8px 10px",
											width: "35px",
											textAlign: "center",
										}}
									>
										No
									</th>
									<th
										style={{
											border: "1px solid #cbd5e1",
											padding: "8px 10px",
											width: "200px",
										}}
									>
										Nama Kegiatan
									</th>
									<th
										style={{
											border: "1px solid #cbd5e1",
											padding: "8px 10px",
											width: "220px",
										}}
									>
										Tanggal Waktu
									</th>
									<th
										style={{ border: "1px solid #cbd5e1", padding: "8px 10px" }}
									>
										Deskripsi Lengkap
									</th>
								</tr>
							</thead>
							<tbody>
								{calendar.events.map((e: any, idx: number) => (
									<tr
										key={idx}
										style={{
											background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
										}}
									>
										<td
											style={{
												border: "1px solid #cbd5e1",
												padding: "6px 10px",
												textAlign: "center",
												fontWeight: "bold",
											}}
										>
											{idx + 1}
										</td>
										<td
											style={{
												border: "1px solid #cbd5e1",
												padding: "6px 10px",
												fontWeight: "600",
											}}
										>
											{e.title}
										</td>
										<td
											style={{
												border: "1px solid #cbd5e1",
												padding: "6px 10px",
											}}
										>
											{formatDateIndonesian(e.startDate)}{" "}
											{e.endDate && e.endDate !== e.startDate
												? `s.d. ${formatDateIndonesian(e.endDate)}`
												: ""}
										</td>
										<td
											style={{
												border: "1px solid #cbd5e1",
												padding: "6px 10px",
												color: e.description ? "#0f172a" : "#94a3b8",
											}}
										>
											{e.description || "-"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* PDF Footer */}
				<div
					style={{
						marginTop: "32px",
						paddingTop: "16px",
						borderTop: "1px solid #e2e8f0",
						display: "flex",
						justifyContent: "space-between",
						fontSize: "10px",
						color: "#94a3b8",
					}}
				>
					<span>
						Dicetak dari Sistem Dashboard Nusadaya — Kalender Akademik
					</span>
					<span>
						{new Date().toLocaleDateString("id-ID", {
							day: "numeric",
							month: "long",
							year: "numeric",
						})}
					</span>
				</div>
			</div>

			{/* Modal Edit Periode (Custom Deskripsi + Tanggal) */}
			{editPeriod && (
				<EditPeriodDialog
					calendarId={calendarId}
					period={editPeriod}
					onClose={() => setEditPeriod(null)}
					onSuccess={() => {
						setEditPeriod(null);
						fetchDetail();
					}}
				/>
			)}

			{/* Modal Tambah Event */}
			{isEventModalOpen && (
				<CreateEventDialog
					calendarId={calendarId}
					onClose={() => setIsEventModalOpen(false)}
					onSuccess={() => {
						setIsEventModalOpen(false);
						fetchDetail();
					}}
				/>
			)}

			{/* Confirm Delete Event AlertDialog */}
			<AlertDialog
				open={deleteEventId !== null}
				onOpenChange={(open) => !open && setDeleteEventId(null)}
			>
				<AlertDialogContent className="bg-white border-slate-200/90 rounded-2xl p-6 text-slate-800">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base font-bold text-slate-900">
							Hapus Kegiatan / Acara
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-slate-500">
							Apakah Anda yakin ingin menghapus kegiatan / acara tambahan ini?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-2 pt-2">
						<AlertDialogCancel className="h-9 text-xs border-slate-200 hover:bg-slate-50 text-slate-600">
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteEventConfirm}
							className="h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
						>
							Hapus Kegiatan
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// -------------------------------------------------------------
// MODAL: Edit Periode (Custom Deskripsi + Tanggal)
// -------------------------------------------------------------
function EditPeriodDialog({
	calendarId,
	period,
	onClose,
	onSuccess,
}: {
	calendarId: number;
	period: any;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [form, setForm] = useState({
		startDate: period.startDate,
		endDate: period.endDate,
		description: period.description || "",
	});
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			if (period.id) {
				const { error } = await api["academic-calendars"][
					calendarId.toString()
				].periods[period.id.toString()].patch({
					startDate: form.startDate,
					endDate: form.endDate,
					description: form.description,
				});
				if (!error) {
					toast.success("Periode berhasil diperbarui");
					onSuccess();
				} else {
					toast.error("Gagal memperbarui periode");
				}
			} else {
				const { error } = await api["academic-calendars"][
					calendarId.toString()
				].periods.post({
					title: period.title,
					periodType: period.periodType,
					startDate: form.startDate,
					endDate: form.endDate,
					description: form.description,
					orderIndex: period.orderIndex,
				});
				if (!error) {
					toast.success("Periode berhasil disimpan");
					onSuccess();
				} else {
					toast.error("Gagal menyimpan periode");
				}
			}
		} catch {
			toast.error("Gagal menyimpan periode");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md rounded-2xl p-6">
				<DialogHeader>
					<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
						<Pencil className="w-4 h-4 text-[#0517B0]" />
						<span>Edit Periode: {period.title}</span>
					</DialogTitle>
					<DialogDescription className="text-xs text-slate-500">
						Atur rentang tanggal dan catatan deskripsi khusus untuk minggu ini
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-3.5 py-2">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-700">
								Tanggal Mulai
							</Label>
							<Input
								type="date"
								className="h-9 text-xs bg-white"
								value={form.startDate}
								onChange={(e) =>
									setForm({ ...form, startDate: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-700">
								Tanggal Selesai
							</Label>
							<Input
								type="date"
								className="h-9 text-xs bg-white"
								value={form.endDate}
								onChange={(e) => setForm({ ...form, endDate: e.target.value })}
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs font-medium text-slate-700">
							Catatan Deskripsi Khusus (Opsional)
						</Label>
						<Textarea
							placeholder="Masukkan detail khusus tentang agenda minggu ini..."
							value={form.description}
							onChange={(e) =>
								setForm({ ...form, description: e.target.value })
							}
							rows={3}
							className="text-xs bg-white resize-none"
						/>
					</div>
				</div>
				<DialogFooter className="gap-2 pt-2">
					<Button
						variant="outline"
						onClick={onClose}
						disabled={isSaving}
						className="h-9 text-xs"
					>
						Batal
					</Button>
					<Button
						onClick={handleSave}
						disabled={isSaving}
						className="h-9 text-xs text-white bg-[#0517B0] hover:bg-[#0517B0]/90 font-semibold shadow-2xs"
					>
						{isSaving ? (
							<Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
						) : null}
						Simpan Penyesuaian
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// -------------------------------------------------------------
// MODAL: Tambah Kegiatan (Acara Tambahan)
// -------------------------------------------------------------
function CreateEventDialog({
	calendarId,
	onClose,
	onSuccess,
}: {
	calendarId: number;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [form, setForm] = useState({
		title: "",
		description: "",
		startDate: "",
		endDate: "",
	});
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		if (!form.title || !form.startDate) {
			toast.error("Judul dan Tanggal Mulai wajib diisi");
			return;
		}

		setIsSaving(true);
		try {
			const { error } = await api["academic-calendars"][
				calendarId.toString()
			].events.post({
				title: form.title,
				description: form.description,
				startDate: form.startDate,
				endDate: form.endDate || undefined,
			});
			if (!error) {
				toast.success("Kegiatan berhasil ditambahkan");
				onSuccess();
			} else {
				toast.error("Gagal menambah kegiatan");
			}
		} catch {
			toast.error("Gagal menambah kegiatan");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md rounded-2xl p-6">
				<DialogHeader>
					<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
						<Sparkles className="w-4 h-4 text-[#0517B0]" />
						<span>Tambah Kegiatan & Acara Tambahan</span>
					</DialogTitle>
					<DialogDescription className="text-xs text-slate-500">
						Tambahkan agenda seminar, workshop, atau acara khusus kampus
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-3.5 py-2">
					<div className="space-y-1.5">
						<Label className="text-xs font-medium text-slate-700">
							Judul Acara / Kegiatan <span className="text-rose-500">*</span>
						</Label>
						<Input
							placeholder="Contoh: Seminar Nasional / Workshop Industri"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							className="h-9 text-xs bg-white"
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-700">
								Tanggal Mulai <span className="text-rose-500">*</span>
							</Label>
							<Input
								type="date"
								value={form.startDate}
								onChange={(e) =>
									setForm({ ...form, startDate: e.target.value })
								}
								className="h-9 text-xs bg-white"
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-700">
								Tanggal Selesai (Opsional)
							</Label>
							<Input
								type="date"
								value={form.endDate}
								onChange={(e) => setForm({ ...form, endDate: e.target.value })}
								className="h-9 text-xs bg-white"
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs font-medium text-slate-700">
							Deskripsi & Lokasi (Opsional)
						</Label>
						<Textarea
							placeholder="Detail acara, tempat pelaksanaan, atau pemateri..."
							value={form.description}
							onChange={(e) =>
								setForm({ ...form, description: e.target.value })
							}
							rows={3}
							className="text-xs bg-white resize-none"
						/>
					</div>
				</div>
				<DialogFooter className="gap-2 pt-2">
					<Button
						variant="outline"
						onClick={onClose}
						disabled={isSaving}
						className="h-9 text-xs"
					>
						Batal
					</Button>
					<Button
						onClick={handleSave}
						disabled={isSaving}
						className="h-9 text-xs text-white bg-[#0517B0] hover:bg-[#0517B0]/90 font-semibold shadow-2xs gap-1.5"
					>
						{isSaving ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Plus className="w-3.5 h-3.5" />
						)}
						<span>Simpan Kegiatan</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
