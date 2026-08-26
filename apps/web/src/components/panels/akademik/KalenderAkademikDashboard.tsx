"use client";

import {
	ArrowLeft,
	Calendar as CalendarIcon,
	Download,
	Eye,
	FileText,
	Loader2,
	Pencil,
	Plus,
	RotateCcw,
	Search,
	Trash2,
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
		<div className="container mx-auto py-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
					<CalendarIcon className="w-8 h-8 text-primary" />
					Kalender Akademik
				</h1>
			</div>

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
// 1. LIST VIEW (Daftar Kalender Akademik tanpa Status & Filter Status)
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

	// Search & Filters State (Tanpa Status Filter)
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
	const availableCohorts = ["16", "15", "14", "13", "12", "11", "10"];

	// Filtered Calendars List
	const filteredCalendars = calendars.filter((c) => {
		const matchesSearch =
			!searchQuery ||
			c.academicYear.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.cohort.toString().includes(searchQuery);

		const matchesCohort =
			cohortFilter === "all" ||
			c.cohort.toString() === cohortFilter ||
			(Number(cohortFilter) >= 2000 &&
				c.cohort === Number(cohortFilter) - 2010);

		return matchesSearch && matchesCohort;
	});

	if (isLoading) {
		return (
			<div className="flex justify-center p-12">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<>
			<Card>
				<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<CardTitle>Daftar Kalender Akademik</CardTitle>
					{canEdit && (
						<Button onClick={onCreateNew}>
							<Plus className="w-4 h-4 mr-2" />
							Buat Kalender Baru
						</Button>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Search & Filter Bar */}
					<div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-lg border">
						{/* Search Input */}
						<div className="relative flex-1 w-full">
							<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
							<Input
								placeholder="Cari Tahun Ajaran atau Angkatan..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 bg-white"
							/>
						</div>

						{/* Filter Cohort / Angkatan */}
						<div className="w-full sm:w-[200px]">
							<Select
								value={cohortFilter}
								onValueChange={(val) => setCohortFilter(val || "all")}
							>
								<SelectTrigger className="bg-white">
									<SelectValue>
										{cohortFilter === "all"
											? "Semua Angkatan"
											: `Angkatan ${cohortFilter}`}
									</SelectValue>
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
						</div>

						{(searchQuery.trim() !== "" || cohortFilter !== "all") && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setSearchQuery("");
									setCohortFilter("all");
								}}
								className="h-10 px-3 text-xs border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5 font-medium transition-colors"
							>
								<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
								Reset
							</Button>
						)}
					</div>

					{/* Calendars Table (Tanpa Kolom Status) */}
					{filteredCalendars.length === 0 ? (
						<div className="text-center py-12 text-slate-500">
							{calendars.length === 0
								? "Belum ada data kalender akademik. Silakan buat kalender baru."
								: "Tidak ada kalender akademik yang sesuai dengan filter pencarian."}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Tahun Ajaran</TableHead>
									<TableHead>Angkatan</TableHead>
									<TableHead>Periode Tanggal</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredCalendars.map((c) => (
									<TableRow key={c.id}>
										<TableCell className="font-semibold text-slate-900">
											TA {c.academicYear}
										</TableCell>
										<TableCell>Angkatan {c.cohort}</TableCell>
										<TableCell>
											{formatDateIndonesian(c.startDate)} s.d.{" "}
											{formatDateIndonesian(c.endDate)}
										</TableCell>
										<TableCell className="text-right space-x-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => onViewDetail(c.id)}
											>
												<Eye className="w-4 h-4 mr-1" /> Detail
											</Button>
											{canEdit && (
												<Button
													variant="destructive"
													size="sm"
													onClick={() => setDeleteCalendarId(c.id)}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Confirm Delete Calendar AlertDialog */}
			<AlertDialog
				open={deleteCalendarId !== null}
				onOpenChange={(open) => !open && setDeleteCalendarId(null)}
			>
				<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Kalender Akademik</AlertDialogTitle>
						<AlertDialogDescription className="text-slate-500">
							Apakah Anda yakin ingin menghapus kalender akademik ini? Semua
							data periode dan kegiatan terkait akan ikut terhapus.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="border-slate-200 hover:bg-slate-50 text-slate-600">
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
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
			toast.error("Mohon lengkapi semua field");
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
		<Card>
			<CardHeader>
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={onBack}>
						<ArrowLeft className="w-4 h-4" />
					</Button>
					<CardTitle>Buat Kalender Akademik Baru</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="space-y-4 max-w-lg">
				<div className="space-y-2">
					<Label>Tahun Ajaran</Label>
					<Input
						placeholder="Misal: 2024/2025"
						value={form.academicYear}
						onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
					/>
				</div>
				<div className="space-y-2">
					<Label>Angkatan</Label>
					<Input
						type="number"
						placeholder="Misal: 2025"
						value={form.cohort || ""}
						onChange={(e) => setForm({ ...form, cohort: e.target.value })}
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>Tanggal Mulai</Label>
						<Input
							type="date"
							value={form.startDate}
							onChange={(e) => setForm({ ...form, startDate: e.target.value })}
						/>
					</div>
					<div className="space-y-2">
						<Label>Tanggal Selesai</Label>
						<Input
							type="date"
							value={form.endDate}
							onChange={(e) => setForm({ ...form, endDate: e.target.value })}
						/>
					</div>
				</div>

				<div className="pt-4 flex justify-end gap-2">
					<Button variant="outline" onClick={onBack}>
						Batal
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : null}
						Simpan Kalender
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// -------------------------------------------------------------
// 3. DETAIL VIEW (With Export PDF Feature, Tanpa Display Status)
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
			<div className="flex justify-center items-center p-24">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!calendar) return <div>Kalender tidak ditemukan</div>;

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
			{/* Top Header Card with Back Button & Export PDF */}
			<Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="flex items-center gap-4">
							<Button variant="ghost" size="icon" onClick={onBack}>
								<ArrowLeft className="w-5 h-5" />
							</Button>
							<div>
								<CardTitle className="text-xl font-bold">
									Detail Kalender Akademik: TA {calendar.academicYear} (Angkatan{" "}
									{calendar.cohort})
								</CardTitle>
								<p className="text-xs text-slate-500 mt-1">
									Struktur 18 minggu & kegiatan akademik
								</p>
							</div>
						</div>

						{/* EXPORT PDF BUTTON */}
						<Button
							variant="outline"
							onClick={handleExportPDF}
							disabled={isExporting}
							className="gap-2 border-primary/30 hover:bg-primary/5 text-primary self-start sm:self-auto"
						>
							{isExporting ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Download className="w-4 h-4" />
							)}
							Export PDF
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2 border-t">
						<div>
							<span className="text-slate-500 text-xs block mb-1">
								Tahun Ajaran & Angkatan
							</span>
							<span className="font-semibold text-slate-900">
								TA {calendar.academicYear} (Angkatan {calendar.cohort})
							</span>
						</div>
						<div>
							<span className="text-slate-500 text-xs block mb-1">
								Rentang Tanggal Kalender
							</span>
							<span className="font-medium text-slate-800">
								{formatDateIndonesian(calendar.startDate)} s.d.{" "}
								{formatDateIndonesian(calendar.endDate)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 2-Column Grid Layout */}
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
				{/* LEFT COLUMN: 18-WEEK TIMELINE */}
				<Card>
					<CardHeader className="border-b bg-slate-50/50">
						<CardTitle className="text-lg font-bold flex items-center justify-between">
							<span>Struktur 18 Minggu Akademik</span>
							<Badge variant="outline" className="font-normal text-xs bg-white">
								18 Pertemuan Standard
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
							{displayedPeriods.map((p: any, idx: number) => {
								const isUtsUas =
									p.periodType === "uts" || p.periodType === "uas";
								const isClass =
									p.periodType === "beginning_class" ||
									p.periodType === "pkkmb";

								return (
									<div
										key={p.id || `default-${idx}`}
										className={`p-4 border rounded-xl flex flex-col gap-2 relative transition-all ${
											isUtsUas
												? "border-amber-300 bg-amber-50/40"
												: isClass
													? "border-blue-300 bg-blue-50/30"
													: "border-slate-200 bg-white hover:border-slate-400"
										}`}
									>
										<div className="flex justify-between items-start">
											<div>
												<div className="font-bold text-slate-900 text-sm flex items-center gap-2">
													{p.title}
												</div>
												<div className="text-xs text-slate-500 mt-1 font-medium">
													{p.startDate === p.endDate
														? formatDateIndonesian(p.startDate)
														: `${formatDateIndonesian(p.startDate)} s.d. ${formatDateIndonesian(p.endDate)}`}
												</div>
											</div>
											<Badge
												variant={isUtsUas ? "default" : "outline"}
												className={
													isUtsUas
														? "bg-amber-600 hover:bg-amber-600"
														: "bg-white"
												}
											>
												{p.periodType.replace("_", " ").toUpperCase()}
											</Badge>
										</div>

										{p.description ? (
											<div className="text-xs bg-slate-50 p-2.5 rounded-lg text-slate-700 border border-slate-200/60 mt-1">
												<span className="font-semibold text-slate-500 block mb-0.5">
													Custom Deskripsi:
												</span>
												{p.description}
											</div>
										) : (
											<div className="text-xs text-slate-400 italic">
												Belum ada deskripsi khusus
											</div>
										)}

										{canEdit && (
											<Button
												size="sm"
												variant="outline"
												className="mt-2 self-end text-xs flex items-center gap-1.5 bg-white shadow-xs"
												onClick={() => setEditPeriod(p)}
											>
												<Pencil className="w-3.5 h-3.5 text-primary" /> Edit
												Deskripsi & Tanggal
											</Button>
										)}
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>

				{/* RIGHT COLUMN: KEGIATAN & ACARA TAMBAHAN */}
				<Card>
					<CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
						<div>
							<CardTitle className="text-lg font-bold">
								Kegiatan & Acara Tambahan
							</CardTitle>
							<p className="text-xs text-slate-500 mt-0.5">
								Event khusus diluar jadwal rutin 18 minggu
							</p>
						</div>
						{canEdit && (
							<Button size="sm" onClick={() => setIsEventModalOpen(true)}>
								<Plus className="w-4 h-4 mr-1" /> Tambah Kegiatan
							</Button>
						)}
					</CardHeader>
					<CardContent className="pt-6">
						{calendar.events?.length === 0 ? (
							<div className="text-sm text-slate-500 text-center py-16 border border-dashed rounded-xl bg-slate-50/50">
								Belum ada kegiatan / acara tambahan untuk kalender ini.
							</div>
						) : (
							<div className="space-y-3">
								{calendar.events?.map((e: any) => (
									<div
										key={e.id}
										className="p-4 border rounded-xl flex justify-between items-start hover:border-slate-400 bg-white transition-colors"
									>
										<div>
											<div className="font-semibold text-slate-900 text-sm">
												{e.title}
											</div>
											<div className="text-xs text-slate-500 mt-1">
												{formatDateIndonesian(e.startDate)}{" "}
												{e.endDate && e.endDate !== e.startDate
													? `s.d. ${formatDateIndonesian(e.endDate)}`
													: ""}
											</div>
											{e.description && (
												<div className="text-xs mt-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
													{e.description}
												</div>
											)}
										</div>
										{canEdit && (
											<Button
												size="icon"
												variant="ghost"
												className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
												onClick={() => setDeleteEventId(e.id)}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
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
						borderBottom: "2px solid #0f172a",
						paddingBottom: "16px",
						marginBottom: "20px",
					}}
				>
					<h2
						style={{
							fontSize: "14px",
							fontWeight: "bold",
							color: "#64748b",
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
							fontSize: "14px",
							fontWeight: "bold",
							color: "#0f172a",
							marginBottom: "10px",
							borderLeft: "4px solid #0284c7",
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
									background: "#f1f5f9",
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

				{/* Section 2: Additional Events (Only rendered if events exist) */}
				{calendar.events && calendar.events.length > 0 && (
					<div style={{ marginTop: "24px" }}>
						<h3
							style={{
								fontSize: "14px",
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
										background: "#f1f5f9",
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
				<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Kegiatan</AlertDialogTitle>
						<AlertDialogDescription className="text-slate-500">
							Apakah Anda yakin ingin menghapus kegiatan / acara tambahan ini?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="border-slate-200 hover:bg-slate-50 text-slate-600">
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteEventConfirm}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							Hapus
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
				// Update existing saved period
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
				// Insert new period into DB
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
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit: {period.title}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Tanggal Mulai</Label>
							<Input
								type="date"
								value={form.startDate}
								onChange={(e) =>
									setForm({ ...form, startDate: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Tanggal Selesai</Label>
							<Input
								type="date"
								value={form.endDate}
								onChange={(e) => setForm({ ...form, endDate: e.target.value })}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Custom Deskripsi</Label>
						<Textarea
							placeholder="Masukkan detail khusus tentang minggu/pertemuan ini"
							value={form.description}
							onChange={(e) =>
								setForm({ ...form, description: e.target.value })
							}
							rows={3}
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
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Tambah Kegiatan / Acara Tambahan</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Judul Acara</Label>
						<Input
							placeholder="Misal: Seminar Nasional / Workshop"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
						/>
					</div>
					<div className="space-y-2">
						<Label>Deskripsi Lengkap</Label>
						<Textarea
							placeholder="Detail acara, tempat, dsb."
							value={form.description}
							onChange={(e) =>
								setForm({ ...form, description: e.target.value })
							}
							rows={3}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Tanggal Mulai</Label>
							<Input
								type="date"
								value={form.startDate}
								onChange={(e) =>
									setForm({ ...form, startDate: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>s.d. Tanggal (Opsional)</Label>
							<Input
								type="date"
								value={form.endDate}
								onChange={(e) => setForm({ ...form, endDate: e.target.value })}
							/>
						</div>
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
						Simpan Kegiatan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
