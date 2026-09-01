"use client";

import {
	AlertCircle,
	ArrowLeft,
	ArrowRight,
	Calendar as CalendarIcon,
	Check,
	CheckCircle,
	CheckCircle2,
	ClipboardCheck,
	Clock,
	Download,
	Edit,
	Eye,
	HelpCircle,
	Loader2,
	MapPin,
	MessageCircle,
	RefreshCw,
	Save,
	Search,
	Sparkles,
	Trash2,
	UserCheck,
	Users,
	X,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/TablePagination";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { API_URL, api, getToken } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { cn } from "@/lib/utils";
import { hasRole, useAuthStore } from "@/store";

// Helper WhatsApp link
function formatWhatsAppUrl(phone: string | null | undefined) {
	if (!phone) return null;
	const clean = phone.replace(/[^0-9]/g, "");
	if (!clean) return null;
	const formatted = clean.startsWith("0") ? `62${clean.slice(1)}` : clean;
	return `https://wa.me/${formatted}`;
}

// Format Indonesian Date
function formatDateIndo(dateStr: string): string {
	try {
		const parts = dateStr.split("-");
		if (parts.length === 3) {
			const year = parseInt(parts[0], 10);
			const month = parseInt(parts[1], 10) - 1;
			const day = parseInt(parts[2], 10);
			const date = new Date(year, month, day);
			return new Intl.DateTimeFormat("id-ID", {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric",
			}).format(date);
		}
		return dateStr;
	} catch {
		return dateStr;
	}
}

type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpha" | null;

interface MemberItem {
	studentId: number;
	name: string;
	nim: string;
	status: AttendanceStatus;
	notes: string;
	recordId?: number | null;
	recordedBy?: string | null;
	recordedAt?: string | null;
}

interface GroupDailyBoard {
	schedule: {
		id: number;
		cohort: number;
		groupName: string;
		room: string;
		dayOfWeek: string;
		startTime: string | null;
		endTime: string | null;
		sessionDate: string | null;
		notes: string | null;
	};
	session: any;
	sessionId: number | null;
	isRecorded: boolean;
	isCompleted: boolean;
	lastRecordedBy: string | null;
	sessionNotes: string;
	members: MemberItem[];
	stats: {
		total: number;
		hadir: number;
		izin: number;
		sakit: number;
		alpha: number;
		unrecorded: number;
		attendanceRate: number;
	};
}

export function KehadiranPiketDashboard() {
	const { user } = useAuthStore();
	const canEdit = hasRole(user, "akademik") || hasRole(user, "superadmin");

	// Active tab: 'board' | 'history' | 'students'
	const [activeTab, setActiveTab] = useState<"board" | "history" | "students">(
		"board",
	);

	// Date filter for Board
	const [selectedDate, setSelectedDate] = useState<string>(() => {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, "0");
		const dd = String(today.getDate()).padStart(2, "0");
		return `${yyyy}-${mm}-${dd}`;
	});

	const [cohortFilter, setCohortFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [showAllDays, setShowAllDays] = useState(false);

	// Board State
	const [boardData, setBoardData] = useState<{
		date: string;
		dayName: string;
		groups: GroupDailyBoard[];
		summary: {
			totalGroups: number;
			recordedGroups: number;
			totalStudents: number;
			hadir: number;
			izin: number;
			sakit: number;
			alpha: number;
			unrecorded: number;
			attendanceRate: number;
		};
	} | null>(null);

	// Local draft state for live editing before save per group
	// Map of dutyScheduleId -> { members: MemberItem[], sessionNotes: string, isModified: boolean }
	const [groupDrafts, setGroupDrafts] = useState<
		Record<
			number,
			{
				members: MemberItem[];
				sessionNotes: string;
				isModified: boolean;
			}
		>
	>({});

	const [isBoardLoading, setIsBoardLoading] = useState(true);
	const [savingGroupId, setSavingGroupId] = useState<number | null>(null);
	const [attendanceModalGroup, setAttendanceModalGroup] =
		useState<GroupDailyBoard | null>(null);

	// History Tab State
	const [historyData, setHistoryData] = useState<any[]>([]);
	const [isHistoryLoading, setIsHistoryLoading] = useState(false);
	const [historyDateFrom, setHistoryDateFrom] = useState("");
	const [historyDateTo, setHistoryDateTo] = useState("");
	const [historySearch, setHistorySearch] = useState("");
	const [historyCohort, setHistoryCohort] = useState("all");
	const [historyPage, setHistoryPage] = useState(1);
	const historyPageSize = 10;

	// View Session Detail Modal
	const [selectedHistorySession, setSelectedHistorySession] = useState<
		any | null
	>(null);

	// Student Summary Tab State
	const [studentSummaryData, setStudentSummaryData] = useState<any[]>([]);
	const [isStudentSummaryLoading, setIsStudentSummaryLoading] = useState(false);
	const [studentSearch, setStudentSearch] = useState("");
	const [studentCohort, setStudentCohort] = useState("all");
	const [studentStatusFilter, setStudentStatusFilter] = useState("all");
	const [studentPage, setStudentPage] = useState(1);
	const studentPageSize = 20;

	// Dynamic Registered Cohorts generator from live piket & student data
	const cohortYears = useMemo(() => {
		const set = new Set<string | number>();
		if (boardData?.groups) {
			boardData.groups.forEach((g: any) => {
				if (g.schedule?.cohort) set.add(g.schedule.cohort);
			});
		}
		if (historyData && historyData.length > 0) {
			historyData.forEach((h: any) => {
				if (h.cohort) set.add(h.cohort);
				if (h.schedule?.cohort) set.add(h.schedule.cohort);
			});
		}
		if (studentSummaryData && studentSummaryData.length > 0) {
			studentSummaryData.forEach((s: any) => {
				if (s.cohort) set.add(s.cohort);
				if (s.student?.cohort) set.add(s.student.cohort);
			});
		}
		return Array.from(set)
			.map((c) => Number(c))
			.filter((c) => !Number.isNaN(c) && c > 0)
			.sort((a, b) => b - a);
	}, [boardData?.groups, historyData, studentSummaryData]);

	// ==========================================
	// 1. FETCH DAILY BOARD
	// ==========================================
	const fetchDailyBoard = async () => {
		setIsBoardLoading(true);
		try {
			const queryParams = new URLSearchParams({
				date: selectedDate,
				cohort: cohortFilter,
				allDays: showAllDays ? "true" : "false",
			});
			if (searchQuery) queryParams.set("search", searchQuery);

			const res = await fetch(
				`${API_URL}/attendance/piket/daily-board?${queryParams.toString()}`,
				{
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			const json = await res.json();
			if (json.success && json.data) {
				setBoardData(json.data);
				// Initialize drafts
				const initialDrafts: Record<
					number,
					{
						members: MemberItem[];
						sessionNotes: string;
						isModified: boolean;
					}
				> = {};
				json.data.groups.forEach((g: GroupDailyBoard) => {
					initialDrafts[g.schedule.id] = {
						members: g.members.map((m) => ({ ...m })),
						sessionNotes: g.sessionNotes || "",
						isModified: false,
					};
				});
				setGroupDrafts(initialDrafts);
			} else {
				toast.error("Gagal memuat papan presensi harian");
			}
		} catch (err) {
			console.error("Error fetching daily board:", err);
			toast.error("Terjadi kesalahan koneksi server");
		} finally {
			setIsBoardLoading(false);
		}
	};

	// ==========================================
	// 2. FETCH HISTORY
	// ==========================================
	const fetchHistory = async () => {
		setIsHistoryLoading(true);
		try {
			const queryParams = new URLSearchParams();
			if (historyCohort !== "all") queryParams.set("cohort", historyCohort);
			if (historyDateFrom) queryParams.set("dateFrom", historyDateFrom);
			if (historyDateTo) queryParams.set("dateTo", historyDateTo);
			if (historySearch) queryParams.set("search", historySearch);

			const res = await fetch(
				`${API_URL}/attendance/piket/rekap-history?${queryParams.toString()}`,
				{
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			const json = await res.json();
			if (json.success && json.data) {
				setHistoryData(json.data);
			}
		} catch (err) {
			console.error("Error fetching history:", err);
			toast.error("Gagal memuat riwayat presensi piket");
		} finally {
			setIsHistoryLoading(false);
		}
	};

	// ==========================================
	// 3. FETCH STUDENT SUMMARY
	// ==========================================
	const fetchStudentSummary = async () => {
		setIsStudentSummaryLoading(true);
		try {
			const queryParams = new URLSearchParams();
			if (studentCohort !== "all") queryParams.set("cohort", studentCohort);
			if (studentSearch) queryParams.set("search", studentSearch);
			if (studentStatusFilter !== "all")
				queryParams.set("status", studentStatusFilter);

			const res = await fetch(
				`${API_URL}/attendance/piket/student-summary?${queryParams.toString()}`,
				{
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			const json = await res.json();
			if (json.success && json.data) {
				setStudentSummaryData(json.data);
			}
		} catch (err) {
			console.error("Error fetching student summary:", err);
			toast.error("Gagal memuat rekap mahasiswa");
		} finally {
			setIsStudentSummaryLoading(false);
		}
	};

	useEffect(() => {
		if (activeTab === "board") {
			fetchDailyBoard();
		} else if (activeTab === "history") {
			fetchHistory();
		} else if (activeTab === "students") {
			fetchStudentSummary();
		}
	}, [
		activeTab,
		selectedDate,
		cohortFilter,
		showAllDays,
		historyCohort,
		historyDateFrom,
		historyDateTo,
		studentCohort,
		studentStatusFilter,
	]);

	// Handlers for Date Navigation
	const handleDateChange = (newDateStr: string) => {
		setSelectedDate(newDateStr);
	};

	const handleShiftDate = (days: number) => {
		const current = new Date(selectedDate + "T00:00:00Z");
		current.setUTCDate(current.getUTCDate() + days);
		const yyyy = current.getUTCFullYear();
		const mm = String(current.getUTCMonth() + 1).padStart(2, "0");
		const dd = String(current.getUTCDate()).padStart(2, "0");
		setSelectedDate(`${yyyy}-${mm}-${dd}`);
	};

	const handleSetToday = () => {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, "0");
		const dd = String(today.getDate()).padStart(2, "0");
		setSelectedDate(`${yyyy}-${mm}-${dd}`);
	};

	// Draft updates
	const handleMemberStatusChange = (
		scheduleId: number,
		studentId: number,
		newStatus: "hadir" | "izin" | "sakit" | "alpha",
	) => {
		setGroupDrafts((prev) => {
			const current = prev[scheduleId];
			if (!current) return prev;
			const updatedMembers = current.members.map((m) => {
				if (m.studentId === studentId) {
					return { ...m, status: newStatus };
				}
				return m;
			});
			return {
				...prev,
				[scheduleId]: {
					...current,
					members: updatedMembers,
					isModified: true,
				},
			};
		});
	};

	const handleMemberNotesChange = (
		scheduleId: number,
		studentId: number,
		notes: string,
	) => {
		setGroupDrafts((prev) => {
			const current = prev[scheduleId];
			if (!current) return prev;
			const updatedMembers = current.members.map((m) => {
				if (m.studentId === studentId) {
					return { ...m, notes };
				}
				return m;
			});
			return {
				...prev,
				[scheduleId]: {
					...current,
					members: updatedMembers,
					isModified: true,
				},
			};
		});
	};

	const handleGroupSessionNotesChange = (scheduleId: number, notes: string) => {
		setGroupDrafts((prev) => {
			const current = prev[scheduleId];
			if (!current) return prev;
			return {
				...prev,
				[scheduleId]: {
					...current,
					sessionNotes: notes,
					isModified: true,
				},
			};
		});
	};

	const handleMarkAllHadir = (scheduleId: number) => {
		setGroupDrafts((prev) => {
			const current = prev[scheduleId];
			if (!current) return prev;
			const updatedMembers = current.members.map((m) => ({
				...m,
				status: "hadir" as AttendanceStatus,
			}));
			return {
				...prev,
				[scheduleId]: {
					...current,
					members: updatedMembers,
					isModified: true,
				},
			};
		});
		toast.info("Semua anggota ditandai Hadir (Draft)");
	};

	// Save attendance for a single group
	const handleSaveGroupAttendance = async (scheduleId: number) => {
		const draft = groupDrafts[scheduleId];
		if (!draft) return;

		setSavingGroupId(scheduleId);
		try {
			const recordsToSave = draft.members
				.filter((m) => m.status !== null)
				.map((m) => ({
					studentId: m.studentId,
					status: m.status as "hadir" | "izin" | "sakit" | "alpha",
					notes: m.notes || undefined,
				}));

			if (recordsToSave.length === 0) {
				toast.warning("Pilih setidaknya 1 status kehadiran sebelum menyimpan");
				setSavingGroupId(null);
				return;
			}

			const payload = {
				dutyScheduleId: scheduleId,
				sessionDate: selectedDate,
				notes: draft.sessionNotes || undefined,
				records: recordsToSave,
			};

			const res = await fetch(`${API_URL}/attendance/piket/daily-board/save`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getToken()}`,
				},
				body: JSON.stringify(payload),
			});

			const json = await res.json();
			if (json.success) {
				toast.success("Presensi piket berhasil disimpan");
				// Mark as clean draft
				setGroupDrafts((prev) => ({
					...prev,
					[scheduleId]: {
						...prev[scheduleId],
						isModified: false,
					},
				}));
				fetchDailyBoard();
			} else {
				toast.error(json.message || "Gagal menyimpan presensi");
			}
		} catch (err) {
			console.error("Save error:", err);
			toast.error("Gagal menyimpan data presensi");
		} finally {
			setSavingGroupId(null);
		}
	};

	// Export Handlers
	const handleExportBoard = () => {
		if (!boardData || boardData.groups.length === 0) {
			toast.error("Tidak ada data presensi untuk diekspor");
			return;
		}

		const exportRows: any[] = [];
		boardData.groups.forEach((g) => {
			const draft = groupDrafts[g.schedule.id];
			const members = draft ? draft.members : g.members;
			members.forEach((m) => {
				exportRows.push({
					Tanggal: boardData.date,
					Hari: boardData.dayName,
					"Kelompok Piket": g.schedule.groupName,
					Ruangan: g.schedule.room,
					"Jam Piket":
						g.schedule.startTime && g.schedule.endTime
							? `${g.schedule.startTime} - ${g.schedule.endTime}`
							: "-",
					Angkatan: g.schedule.cohort,
					NIM: m.nim,
					"Nama Mahasiswa": m.name,
					"Status Kehadiran":
						m.status === "hadir"
							? "Hadir"
							: m.status === "izin"
								? "Izin"
								: m.status === "sakit"
									? "Sakit"
									: m.status === "alpha"
										? "Alpha"
										: "Belum Diisi",
					Keterangan: m.notes || "-",
					"Catatan Kelompok": draft?.sessionNotes || g.sessionNotes || "-",
				});
			});
		});

		exportToCSV(exportRows, `Presensi_Piket_${boardData.date}`);
	};

	const handleExportHistory = () => {
		if (historyData.length === 0) {
			toast.error("Tidak ada data riwayat untuk diekspor");
			return;
		}

		const exportRows: any[] = [];
		historyData.forEach((s) => {
			s.records.forEach((r: any) => {
				exportRows.push({
					"Tanggal Piket": s.sessionDate,
					"Nama Kelompok": s.groupName,
					Ruangan: s.room,
					Angkatan: s.cohort,
					NIM: r.student?.nim || "-",
					"Nama Mahasiswa": r.student?.name || "-",
					Status:
						r.status === "hadir"
							? "Hadir"
							: r.status === "izin"
								? "Izin"
								: r.status === "sakit"
									? "Sakit"
									: "Alpha",
					Catatan: r.notes || "-",
					"Dicatat Oleh": s.recordedBy,
				});
			});
		});

		exportToCSV(
			exportRows,
			`Rekap_Riwayat_Piket_${new Date().toISOString().split("T")[0]}`,
		);
	};

	const handleExportStudentSummary = () => {
		if (studentSummaryData.length === 0) {
			toast.error("Tidak ada data rekap mahasiswa untuk diekspor");
			return;
		}

		const exportRows = studentSummaryData.map((s) => ({
			NIM: s.nim || "-",
			"Nama Mahasiswa": s.name,
			Angkatan: s.cohort,
			Program: s.program || "-",
			"Total Jadwal Piket": s.totalJadwal,
			"Total Hadir": s.totalHadir,
			"Persentase Kehadiran": `${s.attendanceRate}%`,
			"Status Kepatuhan":
				s.complianceStatus === "AMAN"
					? "Aman (≥85%)"
					: s.complianceStatus === "PERLU_PERHATIAN"
						? "Perlu Perhatian (70-84%)"
						: "Tidak Aman (<70%)",
		}));

		exportToCSV(
			exportRows,
			`Rekap_Kepatuhan_Piket_Mahasiswa_${new Date().toISOString().split("T")[0]}`,
		);
	};

	// Paginated Data
	const paginatedHistory = useMemo(() => {
		const start = (historyPage - 1) * historyPageSize;
		return historyData.slice(start, start + historyPageSize);
	}, [historyData, historyPage]);

	const paginatedStudents = useMemo(() => {
		const start = (studentPage - 1) * studentPageSize;
		return studentSummaryData.slice(start, start + studentPageSize);
	}, [studentSummaryData, studentPage]);

	return (
		<div className="space-y-6 pb-12">
			{/* Top Executive Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-100">
							<Sparkles className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								Manajemen Kehadiran Piket
							</h1>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								Pengelolaan presensi harian kelompok piket kampus, monitoring
								kepatuhan kebersihan, dan rekapitulasi kehadiran mahasiswa.
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<Link
						href="/dashboard/penjadwalan"
						className={cn(
							buttonVariants({ variant: "outline", size: "sm" }),
							"border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9",
						)}
					>
						<Clock className="w-3.5 h-3.5 text-slate-500" />
						Atur Jadwal Kelompok Piket
					</Link>

					{activeTab === "board" && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleExportBoard}
							className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9"
						>
							<Download className="w-3.5 h-3.5" />
							Export Presensi Hari Ini
						</Button>
					)}

					{activeTab === "history" && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleExportHistory}
							className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9"
						>
							<Download className="w-3.5 h-3.5" />
							Export Riwayat CSV
						</Button>
					)}

					{activeTab === "students" && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleExportStudentSummary}
							className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9"
						>
							<Download className="w-3.5 h-3.5" />
							Export Rekap Mahasiswa
						</Button>
					)}
				</div>
			</div>

			{/* KPI Summary Cards */}
			{boardData && activeTab === "board" && (
				<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
					<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
						<CardContent className="p-4 flex items-start gap-3">
							<div className="p-2 rounded-lg bg-blue-50 text-[#0517B0] mt-0.5">
								<Users className="h-5 w-5" />
							</div>
							<div>
								<p className="text-slate-500 text-xs font-semibold">
									Kelompok Bertugas
								</p>
								<p className="text-2xl font-black text-slate-900 mt-0.5">
									{boardData.summary.totalGroups}
								</p>
								<p className="text-[11px] text-slate-400 font-medium">
									{boardData.summary.recordedGroups} Sesi Tersimpan
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
						<CardContent className="p-4 flex items-start gap-3">
							<div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
								<UserCheck className="h-5 w-5" />
							</div>
							<div>
								<p className="text-slate-500 text-xs font-semibold">
									Mahasiswa Piket
								</p>
								<p className="text-2xl font-black text-slate-900 mt-0.5">
									{boardData.summary.totalStudents}
								</p>
								<p className="text-[11px] text-slate-400 font-medium">
									Total Terjadwal
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
						<CardContent className="p-4 flex items-start gap-3">
							<div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
								<CheckCircle className="h-5 w-5" />
							</div>
							<div>
								<p className="text-slate-500 text-xs font-semibold">
									Hadir Piket
								</p>
								<p className="text-2xl font-black text-emerald-700 mt-0.5">
									{boardData.summary.hadir}
								</p>
								<p className="text-[11px] text-emerald-600 font-medium">
									{boardData.summary.totalStudents > 0
										? `${Math.round((boardData.summary.hadir / boardData.summary.totalStudents) * 100)}% dari jadwal`
										: "0%"}
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
						<CardContent className="p-4 flex items-start gap-3">
							<div className="p-2 rounded-lg bg-amber-50 text-amber-600 mt-0.5">
								<Clock className="h-5 w-5" />
							</div>
							<div>
								<p className="text-slate-500 text-xs font-semibold">
									Izin / Sakit
								</p>
								<p className="text-2xl font-black text-amber-700 mt-0.5">
									{boardData.summary.izin + boardData.summary.sakit}
								</p>
								<p className="text-[11px] text-slate-400 font-medium">
									{boardData.summary.izin} Izin, {boardData.summary.sakit} Sakit
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
						<CardContent className="p-4 flex items-start gap-3">
							<div className="p-2 rounded-lg bg-rose-50 text-rose-600 mt-0.5">
								<XCircle className="h-5 w-5" />
							</div>
							<div>
								<p className="text-slate-500 text-xs font-semibold">
									Alpha / Belum
								</p>
								<p className="text-2xl font-black text-rose-700 mt-0.5">
									{boardData.summary.alpha + boardData.summary.unrecorded}
								</p>
								<p className="text-[11px] text-rose-600 font-medium">
									{boardData.summary.alpha} Alpha,{" "}
									{boardData.summary.unrecorded} Belum
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-teal-500">
						<CardContent className="p-4 flex items-start gap-3">
							<div className="p-2 rounded-lg bg-teal-50 text-teal-600 mt-0.5">
								<ClipboardCheck className="h-5 w-5" />
							</div>
							<div>
								<p className="text-slate-500 text-xs font-semibold">
									Kepatuhan Hari Ini
								</p>
								<p className="text-2xl font-black text-slate-900 mt-0.5">
									{boardData.summary.attendanceRate}%
								</p>
								<div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
									<div
										className="bg-teal-500 h-full rounded-full transition-all duration-300"
										style={{ width: `${boardData.summary.attendanceRate}%` }}
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Main Segmented Navigation Bar */}
			<div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
				<div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
					<button
						type="button"
						onClick={() => setActiveTab("board")}
						className={cn(
							"px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2",
							activeTab === "board"
								? "bg-white text-[#0517B0] shadow-xs"
								: "text-slate-600 hover:text-slate-900",
						)}
					>
						<ClipboardCheck className="w-4 h-4" />
						Presensi Harian Kelompok
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("history")}
						className={cn(
							"px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2",
							activeTab === "history"
								? "bg-white text-[#0517B0] shadow-xs"
								: "text-slate-600 hover:text-slate-900",
						)}
					>
						<Clock className="w-4 h-4" />
						Riwayat Presensi Piket
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("students")}
						className={cn(
							"px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2",
							activeTab === "students"
								? "bg-white text-[#0517B0] shadow-xs"
								: "text-slate-600 hover:text-slate-900",
						)}
					>
						<Users className="w-4 h-4" />
						Monitoring Kepatuhan Mahasiswa
					</button>
				</div>

				{activeTab === "board" && (
					<div className="flex items-center gap-2 flex-wrap">
						{/* Date Control Toolbar */}
						<div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => handleShiftDate(-1)}
								className="h-7 w-7 text-slate-600 hover:bg-slate-200"
								title="Hari Sebelumnya"
							>
								<ArrowLeft className="h-3.5 w-3.5" />
							</Button>

							<Button
								variant="ghost"
								size="sm"
								onClick={handleSetToday}
								className="h-7 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
							>
								Hari Ini
							</Button>

							<Button
								variant="ghost"
								size="icon"
								onClick={() => handleShiftDate(1)}
								className="h-7 w-7 text-slate-600 hover:bg-slate-200"
								title="Hari Berikutnya"
							>
								<ArrowRight className="h-3.5 w-3.5" />
							</Button>
						</div>

						<Input
							type="date"
							value={selectedDate}
							onChange={(e) => handleDateChange(e.target.value)}
							className="w-[145px] h-9 text-xs font-semibold border-slate-200 bg-white"
						/>
					</div>
				)}
			</div>

			{/* ========================================================================= */}
			{/* TAB 1: LIVE ATTENDANCE BOARD                                              */}
			{/* ========================================================================= */}
			{activeTab === "board" && (
				<div className="space-y-6">
					{/* Filter & Search Bar */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
						<div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-[#0517B0]">
								<CalendarIcon className="w-4 h-4" />
								<span className="text-xs font-bold">
									{formatDateIndo(selectedDate)}
								</span>
								{boardData?.dayName && (
									<Badge className="bg-[#0517B0] text-white text-[10px] uppercase font-bold py-0.5 px-1.5">
										{boardData.dayName}
									</Badge>
								)}
							</div>

							<Select
								value={cohortFilter}
								onValueChange={(val) => setCohortFilter(val || "all")}
							>
								<SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200 font-semibold text-slate-800">
									<SelectValue placeholder="Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan</SelectItem>
									{cohortYears.map((year) => (
										<SelectItem key={year} value={year.toString()}>
											Angkatan {year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Button
								variant={showAllDays ? "default" : "outline"}
								size="sm"
								onClick={() => setShowAllDays(!showAllDays)}
								className={cn(
									"text-xs h-9 font-medium",
									showAllDays
										? "bg-slate-800 text-white hover:bg-slate-900"
										: "border-slate-200 text-slate-700 hover:bg-slate-50",
								)}
							>
								{showAllDays
									? "✓ Menampilkan Semua Hari"
									: "Tampilkan Semua Hari"}
							</Button>
						</div>

						<div className="flex items-center gap-2 w-full md:w-auto">
							<div className="relative w-full md:w-64">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
								<Input
									placeholder="Cari kelompok, ruangan, nama..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-8 h-9 text-xs border-slate-200 bg-white"
								/>
							</div>

							<Button
								variant="outline"
								size="icon"
								onClick={fetchDailyBoard}
								className="h-9 w-9 border-slate-200 text-slate-600 hover:bg-slate-50"
								title="Muat Ulang"
							>
								<RefreshCw
									className={cn(
										"h-4 w-4",
										isBoardLoading && "animate-spin text-[#0517B0]",
									)}
								/>
							</Button>
						</div>
					</div>

					{/* Loading State */}
					{isBoardLoading ? (
						<div className="flex flex-col justify-center items-center h-80 gap-3 text-slate-500 bg-white rounded-xl border border-slate-200">
							<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
							<p className="text-sm font-semibold">
								Memuat daftar kelompok piket...
							</p>
						</div>
					) : !boardData || boardData.groups.length === 0 ? (
						<div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 text-center space-y-3">
							<div className="p-3 bg-slate-100 rounded-full text-slate-400">
								<Users className="w-8 h-8" />
							</div>
							<h3 className="text-base font-bold text-slate-800">
								Tidak Ada Kelompok Piket Terjadwal
							</h3>
							<p className="text-slate-500 text-xs max-w-md">
								Tidak ada jadwal piket yang terdaftar untuk hari{" "}
								<span className="font-semibold text-slate-700">
									{boardData?.dayName || "ini"}
								</span>{" "}
								pada tanggal {formatDateIndo(selectedDate)}.
							</p>
							<div className="flex gap-2 pt-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowAllDays(true)}
									className="text-xs"
								>
									Lihat Semua Kelompok Piket
								</Button>
								<Link
									href="/dashboard/penjadwalan"
									className={cn(
										buttonVariants({ size: "sm" }),
										"text-xs bg-[#0517B0] hover:bg-[#0517B0]/90 text-white font-semibold",
									)}
								>
									+ Buat Jadwal Piket Baru
								</Link>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
							{boardData.groups.map((group) => {
								const draft = groupDrafts[group.schedule.id];
								const members = draft ? draft.members : group.members;
								const isModified = draft?.isModified;

								const hadirCount = members.filter(
									(m) => m.status === "hadir",
								).length;
								const izinCount = members.filter(
									(m) => m.status === "izin",
								).length;
								const sakitCount = members.filter(
									(m) => m.status === "sakit",
								).length;
								const alphaCount = members.filter(
									(m) => m.status === "alpha",
								).length;
								const unrecordedCount = members.filter((m) => !m.status).length;
								const totalMembers = members.length;

								return (
									<Card
										key={group.schedule.id}
										className={cn(
											"bg-white shadow-xs border transition-all duration-200 hover:shadow-md flex flex-col justify-between rounded-xl overflow-hidden group",
											isModified
												? "border-amber-400 ring-2 ring-amber-100"
												: group.isRecorded
													? "border-slate-200 hover:border-slate-300"
													: "border-slate-200 border-dashed hover:border-slate-400",
										)}
									>
										{/* Card Header */}
										<div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-2">
											<div className="flex justify-between items-start gap-2">
												<div className="space-y-1">
													<h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-[#0517B0] transition-colors">
														{group.schedule.groupName}
													</h3>
													<div className="flex items-center gap-1.5 flex-wrap">
														<Badge
															variant="outline"
															className="text-[10px] bg-white text-slate-600 border-slate-200"
														>
															Angkatan {group.schedule.cohort}
														</Badge>
														<Badge className="bg-blue-50 text-[#0517B0] border-blue-200 hover:bg-blue-50 text-[10px] font-bold">
															{group.schedule.dayOfWeek}
														</Badge>
													</div>
												</div>

												{/* Status Badge */}
												<div>
													{isModified ? (
														<Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold animate-pulse">
															✏️ Draf
														</Badge>
													) : group.isRecorded ? (
														<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
															<CheckCircle2 className="w-3 h-3 text-emerald-600" />
															Tersimpan
														</Badge>
													) : (
														<Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
															Belum Diisi
														</Badge>
													)}
												</div>
											</div>

											{/* Location & Time */}
											<div className="flex items-center gap-3 text-xs text-slate-500 pt-1 flex-wrap">
												<span className="flex items-center gap-1 font-medium text-slate-700">
													<MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
													{group.schedule.room}
												</span>
												{group.schedule.startTime && group.schedule.endTime && (
													<span className="flex items-center gap-1 text-slate-500">
														<Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
														{group.schedule.startTime} -{" "}
														{group.schedule.endTime} WIB
													</span>
												)}
											</div>
										</div>

										{/* Card Body: Attendance Summary & Member List Preview */}
										<CardContent className="p-4 sm:p-5 space-y-4 flex-1">
											{/* Progress Bar & Ratio */}
											<div className="space-y-1.5">
												<div className="flex justify-between items-center text-xs font-semibold">
													<span className="text-slate-700">
														Kehadiran Mahasiswa
													</span>
													<span className="text-slate-500 font-mono text-[11px]">
														{hadirCount}/{totalMembers} Hadir (
														{totalMembers > 0
															? Math.round((hadirCount / totalMembers) * 100)
															: 0}
														%)
													</span>
												</div>

												<div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden">
													<div
														style={{
															width: `${totalMembers > 0 ? (hadirCount / totalMembers) * 100 : 0}%`,
														}}
														className="bg-emerald-500 h-full transition-all duration-300"
													/>
													<div
														style={{
															width: `${totalMembers > 0 ? (izinCount / totalMembers) * 100 : 0}%`,
														}}
														className="bg-amber-500 h-full transition-all duration-300"
													/>
													<div
														style={{
															width: `${totalMembers > 0 ? (sakitCount / totalMembers) * 100 : 0}%`,
														}}
														className="bg-blue-500 h-full transition-all duration-300"
													/>
													<div
														style={{
															width: `${totalMembers > 0 ? (alphaCount / totalMembers) * 100 : 0}%`,
														}}
														className="bg-rose-500 h-full transition-all duration-300"
													/>
												</div>

												{/* Mini Status Breakdown */}
												<div className="flex items-center gap-2 pt-1 text-[11px] font-medium flex-wrap">
													<span className="text-emerald-700 flex items-center gap-1">
														<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
														{hadirCount} Hadir
													</span>
													<span className="text-slate-300">•</span>
													<span className="text-amber-700 flex items-center gap-1">
														<span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
														{izinCount} Izin
													</span>
													<span className="text-slate-300">•</span>
													<span className="text-blue-700 flex items-center gap-1">
														<span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
														{sakitCount} Sakit
													</span>
													<span className="text-slate-300">•</span>
													<span className="text-rose-700 flex items-center gap-1">
														<span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
														{alphaCount} Alpha
													</span>
												</div>
											</div>

											{/* Member Chips Preview */}
											<div className="space-y-1.5 pt-1">
												<span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
													Anggota Kelompok ({totalMembers})
												</span>
												<div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
													{members.map((m, idx) => (
														<span
															key={m.studentId || idx}
															className={cn(
																"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
																m.status === "hadir"
																	? "bg-emerald-50 text-emerald-800 border-emerald-200"
																	: m.status === "izin"
																		? "bg-amber-50 text-amber-800 border-amber-200"
																		: m.status === "sakit"
																			? "bg-blue-50 text-blue-800 border-blue-200"
																			: m.status === "alpha"
																				? "bg-rose-50 text-rose-800 border-rose-200"
																				: "bg-slate-50 text-slate-600 border-slate-200",
															)}
														>
															<span
																className={cn(
																	"w-1.5 h-1.5 rounded-full shrink-0",
																	m.status === "hadir"
																		? "bg-emerald-500"
																		: m.status === "izin"
																			? "bg-amber-500"
																			: m.status === "sakit"
																				? "bg-blue-500"
																				: m.status === "alpha"
																					? "bg-rose-500"
																					: "bg-slate-300",
																)}
															/>
															<span className="truncate max-w-[130px]">
																{m.name}
															</span>
														</span>
													))}
												</div>
											</div>
										</CardContent>

										{/* Card Footer Action */}
										<div className="p-4 border-t border-slate-100 bg-slate-50/40 flex items-center gap-2">
											<Button
												onClick={() => setAttendanceModalGroup(group)}
												className={cn(
													"flex-1 font-semibold text-xs h-9 gap-1.5 shadow-xs transition-all",
													group.isRecorded
														? "bg-white hover:bg-slate-50 text-slate-800 border border-slate-200"
														: "bg-[#0517B0] hover:bg-[#0517B0]/90 text-white",
												)}
											>
												{group.isRecorded ? (
													<>
														<Edit className="w-3.5 h-3.5 text-slate-500" />
														Kelola & Edit Presensi
													</>
												) : (
													<>
														<ClipboardCheck className="w-3.5 h-3.5" />
														Isi Presensi Kelompok
													</>
												)}
											</Button>
										</div>
									</Card>
								);
							})}
						</div>
					)}
				</div>
			)}

			{/* ========================================================================= */}
			{/* TAB 2: RIWAYAT & REKAP PRESENSI PIKET                                     */}
			{/* ========================================================================= */}
			{activeTab === "history" && (
				<div className="space-y-6">
					{/* Filter Toolbar */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
						<div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
							<Select
								value={historyCohort}
								onValueChange={(val) => setHistoryCohort(val || "all")}
							>
								<SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200 font-semibold text-slate-800">
									<SelectValue placeholder="Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan</SelectItem>
									{cohortYears.map((year) => (
										<SelectItem key={year} value={year.toString()}>
											Angkatan {year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<div className="flex items-center gap-2 text-xs">
								<Input
									type="date"
									placeholder="Dari Tanggal"
									value={historyDateFrom}
									onChange={(e) => setHistoryDateFrom(e.target.value)}
									className="h-9 text-xs border-slate-200 bg-white w-36"
								/>
								<span className="text-slate-400">s/d</span>
								<Input
									type="date"
									placeholder="Sampai Tanggal"
									value={historyDateTo}
									onChange={(e) => setHistoryDateTo(e.target.value)}
									className="h-9 text-xs border-slate-200 bg-white w-36"
								/>
							</div>

							{(historyDateFrom || historyDateTo) && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setHistoryDateFrom("");
										setHistoryDateTo("");
									}}
									className="h-9 text-xs text-slate-500 hover:text-slate-700"
								>
									Reset Tanggal
								</Button>
							)}
						</div>

						<div className="flex items-center gap-2 w-full md:w-auto">
							<div className="relative w-full md:w-64">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
								<Input
									placeholder="Cari kelompok, ruangan, mahasiswa..."
									value={historySearch}
									onChange={(e) => setHistorySearch(e.target.value)}
									className="pl-8 h-9 text-xs border-slate-200 bg-white"
								/>
							</div>

							<Button
								variant="outline"
								size="icon"
								onClick={fetchHistory}
								className="h-9 w-9 border-slate-200 text-slate-600 hover:bg-slate-50"
							>
								<RefreshCw
									className={cn(
										"h-4 w-4",
										isHistoryLoading && "animate-spin text-[#0517B0]",
									)}
								/>
							</Button>
						</div>
					</div>

					{/* History Table */}
					<Card className="bg-white border-slate-200 shadow-xs">
						<CardContent className="p-0">
							{isHistoryLoading ? (
								<div className="flex flex-col justify-center items-center h-64 gap-3 text-slate-500">
									<Loader2 className="w-7 h-7 animate-spin text-[#0517B0]" />
									<p className="text-xs font-semibold">
										Memuat riwayat presensi piket...
									</p>
								</div>
							) : historyData.length === 0 ? (
								<div className="text-center py-12 text-slate-500 text-sm">
									Belum ada riwayat sesi presensi piket yang tercatat.
								</div>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader className="bg-slate-50/80">
											<TableRow>
												<TableHead className="text-xs font-bold text-slate-700">
													Tanggal Piket
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700">
													Kelompok & Ruangan
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700">
													Angkatan
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700 text-center">
													Total
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700 text-center">
													Hadir
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700 text-center">
													Izin/Sakit
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700 text-center">
													Alpha
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700 text-center">
													Tingkat Kehadiran
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700">
													Pencatat
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700 text-right">
													Aksi
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody className="divide-y divide-slate-100 text-xs">
											{paginatedHistory.map((session) => (
												<TableRow
													key={session.id}
													className="hover:bg-slate-50/60"
												>
													<TableCell className="font-semibold text-slate-800">
														{formatDateIndo(session.sessionDate)}
														<div className="text-[11px] text-slate-400 font-normal">
															{session.startTime} - {session.endTime} WIB
														</div>
													</TableCell>

													<TableCell>
														<div className="font-bold text-slate-900">
															{session.groupName}
														</div>
														<div className="text-[11px] text-slate-500 flex items-center gap-1">
															<MapPin className="w-3 h-3 text-slate-400" />
															{session.room}
														</div>
													</TableCell>

													<TableCell>
														<Badge
															variant="outline"
															className="bg-slate-50 border-slate-200 text-slate-700 text-[11px]"
														>
															Angkatan {session.cohort}
														</Badge>
													</TableCell>

													<TableCell className="text-center font-bold text-slate-700">
														{session.stats.total}
													</TableCell>

													<TableCell className="text-center">
														<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold text-[11px]">
															{session.stats.hadir}
														</Badge>
													</TableCell>

													<TableCell className="text-center">
														<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-bold text-[11px]">
															{session.stats.izin + session.stats.sakit}
														</Badge>
													</TableCell>

													<TableCell className="text-center">
														<Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 font-bold text-[11px]">
															{session.stats.alpha}
														</Badge>
													</TableCell>

													<TableCell className="text-center">
														<div className="flex items-center justify-center gap-1.5 font-bold">
															<span
																className={cn(
																	session.stats.attendanceRate >= 80
																		? "text-emerald-700"
																		: session.stats.attendanceRate >= 60
																			? "text-amber-700"
																			: "text-rose-700",
																)}
															>
																{session.stats.attendanceRate}%
															</span>
														</div>
													</TableCell>

													<TableCell className="text-slate-600">
														{session.recordedBy}
													</TableCell>

													<TableCell className="text-right">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => setSelectedHistorySession(session)}
															className="h-7 text-xs font-semibold text-[#0517B0] hover:bg-blue-50"
														>
															<Eye className="w-3.5 h-3.5 mr-1" />
															Rincian
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}

							{historyData.length > historyPageSize && (
								<div className="p-4 border-t border-slate-100">
									<TablePagination
										currentPage={historyPage}
										totalPages={Math.ceil(historyData.length / historyPageSize)}
										onPageChange={setHistoryPage}
									/>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{/* ========================================================================= */}
			{/* TAB 3: MONITORING KEPATUHAN PER MAHASISWA                                  */}
			{/* ========================================================================= */}
			{activeTab === "students" && (
				<div className="space-y-6">
					{/* Toolbar */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
						<div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
							<Select
								value={studentCohort}
								onValueChange={(val) => setStudentCohort(val || "all")}
							>
								<SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200 font-semibold text-slate-800">
									<SelectValue placeholder="Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan</SelectItem>
									{cohortYears.map((year) => (
										<SelectItem key={year} value={year.toString()}>
											Angkatan {year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Status Filter Pills */}
							<div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
								<button
									type="button"
									onClick={() => setStudentStatusFilter("all")}
									className={cn(
										"px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
										studentStatusFilter === "all"
											? "bg-white text-slate-800 shadow-xs"
											: "text-slate-600 hover:text-slate-900",
									)}
								>
									Semua
								</button>
								<button
									type="button"
									onClick={() => setStudentStatusFilter("aman")}
									className={cn(
										"px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
										studentStatusFilter === "aman"
											? "bg-emerald-600 text-white shadow-xs"
											: "text-slate-600 hover:text-emerald-700",
									)}
								>
									Aman (≥85%)
								</button>
								<button
									type="button"
									onClick={() => setStudentStatusFilter("perhatian")}
									className={cn(
										"px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
										studentStatusFilter === "perhatian"
											? "bg-amber-500 text-white shadow-xs"
											: "text-slate-600 hover:text-amber-700",
									)}
								>
									Perlu Perhatian
								</button>
								<button
									type="button"
									onClick={() => setStudentStatusFilter("tidak_aman")}
									className={cn(
										"px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
										studentStatusFilter === "tidak_aman"
											? "bg-rose-600 text-white shadow-xs"
											: "text-slate-600 hover:text-rose-700",
									)}
								>
									Tidak Aman (&lt;70%)
								</button>
							</div>
						</div>

						<div className="flex items-center gap-2 w-full md:w-auto">
							<div className="relative w-full md:w-64">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
								<Input
									placeholder="Cari NIM, nama mahasiswa..."
									value={studentSearch}
									onChange={(e) => setStudentSearch(e.target.value)}
									className="pl-8 h-9 text-xs border-slate-200 bg-white"
								/>
							</div>

							<Button
								variant="outline"
								size="icon"
								onClick={fetchStudentSummary}
								className="h-9 w-9 border-slate-200 text-slate-600 hover:bg-slate-50"
							>
								<RefreshCw
									className={cn(
										"h-4 w-4",
										isStudentSummaryLoading && "animate-spin text-[#0517B0]",
									)}
								/>
							</Button>
						</div>
					</div>

					{/* Student Summary Table */}
					<Card className="bg-white border-slate-200 shadow-xs">
						<CardContent className="p-0">
							{isStudentSummaryLoading ? (
								<div className="flex flex-col justify-center items-center h-64 gap-3 text-slate-500">
									<Loader2 className="w-7 h-7 animate-spin text-[#0517B0]" />
									<p className="text-xs font-semibold">
										Memuat data kepatuhan mahasiswa...
									</p>
								</div>
							) : studentSummaryData.length === 0 ? (
								<div className="text-center py-12 text-slate-500 text-sm">
									Tidak ada data mahasiswa yang cocok dengan filter.
								</div>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader className="bg-slate-50/80">
											<TableRow>
												<TableHead className="text-xs font-bold text-slate-700">
													NIM & Nama Mahasiswa
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700">
													Angkatan
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700">
													Program & Peminatan
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700 text-center">
													Total Jadwal
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700 text-center">
													Total Hadir
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700 text-center">
													Persentase (%)
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700 text-center">
													Status Kepatuhan
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700 text-right">
													Aksi
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody className="divide-y divide-slate-100 text-xs">
											{paginatedStudents.map((s) => {
												const waUrl = formatWhatsAppUrl(s.phone);
												return (
													<TableRow key={s.id} className="hover:bg-slate-50/60">
														<TableCell>
															<div className="flex items-center gap-2.5">
																<div className="w-7 h-7 rounded-full bg-[#0517B0]/10 text-[#0517B0] font-bold text-xs flex items-center justify-center">
																	{s.name.substring(0, 2).toUpperCase()}
																</div>
																<div>
																	<p className="font-bold text-slate-800">
																		{s.name}
																	</p>
																	<p className="text-[11px] text-slate-400 font-mono">
																		NIM: {s.nim || "-"}
																	</p>
																</div>
															</div>
														</TableCell>

														<TableCell>
															<Badge
																variant="outline"
																className="bg-slate-50 border-slate-200 text-slate-700 text-[11px]"
															>
																Angkatan {s.cohort}
															</Badge>
														</TableCell>

														<TableCell>
															<div className="font-medium text-slate-700">
																{s.program || "-"}
															</div>
															{s.subProgram && (
																<div className="text-[11px] text-slate-500">
																	{s.subProgram}
																</div>
															)}
														</TableCell>

														<TableCell className="text-center font-semibold text-slate-700">
															{s.totalJadwal} sesi
														</TableCell>

														<TableCell className="text-center font-bold text-emerald-700">
															{s.totalHadir} hadir
														</TableCell>

														<TableCell className="text-center">
															<div className="flex flex-col items-center gap-1">
																<span className="font-bold text-slate-800">
																	{s.attendanceRate}%
																</span>
																<div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
																	<div
																		className={cn(
																			"h-full rounded-full",
																			s.attendanceRate >= 85
																				? "bg-emerald-500"
																				: s.attendanceRate >= 70
																					? "bg-amber-500"
																					: "bg-rose-500",
																		)}
																		style={{ width: `${s.attendanceRate}%` }}
																	/>
																</div>
															</div>
														</TableCell>

														<TableCell className="text-center">
															{s.complianceStatus === "AMAN" ? (
																<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[11px]">
																	🟢 Aman
																</Badge>
															) : s.complianceStatus === "PERLU_PERHATIAN" ? (
																<Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[11px]">
																	🟡 Perlu Perhatian
																</Badge>
															) : (
																<Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold text-[11px]">
																	🔴 Tidak Aman
																</Badge>
															)}
														</TableCell>

														<TableCell className="text-right space-x-1.5">
															{waUrl && (
																<a
																	href={waUrl}
																	target="_blank"
																	rel="noreferrer"
																	className={cn(
																		buttonVariants({
																			variant: "ghost",
																			size: "icon",
																		}),
																		"h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
																	)}
																	title="Kirim WhatsApp"
																>
																	<MessageCircle className="w-3.5 h-3.5" />
																</a>
															)}

															<Link
																href={`/dashboard/students/${s.id}`}
																className={cn(
																	buttonVariants({
																		variant: "outline",
																		size: "sm",
																	}),
																	"h-7 text-xs font-semibold text-slate-700 hover:bg-slate-100",
																)}
															>
																Detail
															</Link>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							)}

							{studentSummaryData.length > studentPageSize && (
								<div className="p-4 border-t border-slate-100">
									<TablePagination
										currentPage={studentPage}
										totalPages={Math.ceil(
											studentSummaryData.length / studentPageSize,
										)}
										onPageChange={setStudentPage}
									/>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{/* Modal Detail Sesi Riwayat */}
			{selectedHistorySession && (
				<Dialog
					open={!!selectedHistorySession}
					onOpenChange={(open) => !open && setSelectedHistorySession(null)}
				>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
								<ClipboardCheck className="w-5 h-5 text-[#0517B0]" />
								Rincian Sesi Presensi Piket
							</DialogTitle>
							<DialogDescription className="text-xs text-slate-500">
								{selectedHistorySession.groupName} —{" "}
								{formatDateIndo(selectedHistorySession.sessionDate)}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							{/* Session Banner */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
								<div>
									<span className="text-slate-400 block text-[11px]">
										Ruangan / Area
									</span>
									<span className="font-bold text-slate-800">
										{selectedHistorySession.room}
									</span>
								</div>
								<div>
									<span className="text-slate-400 block text-[11px]">
										Waktu Piket
									</span>
									<span className="font-bold text-slate-800">
										{selectedHistorySession.startTime} -{" "}
										{selectedHistorySession.endTime} WIB
									</span>
								</div>
								<div>
									<span className="text-slate-400 block text-[11px]">
										Angkatan
									</span>
									<span className="font-bold text-slate-800">
										Angkatan {selectedHistorySession.cohort}
									</span>
								</div>
								<div>
									<span className="text-slate-400 block text-[11px]">
										Dicatat Oleh
									</span>
									<span className="font-bold text-slate-800">
										{selectedHistorySession.recordedBy}
									</span>
								</div>
							</div>

							{selectedHistorySession.notes && (
								<div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-xs text-blue-900">
									<span className="font-bold block mb-0.5">Catatan Piket:</span>
									{selectedHistorySession.notes}
								</div>
							)}

							{/* Members Attendance Table */}
							<div className="border border-slate-200 rounded-lg overflow-hidden">
								<Table>
									<TableHeader className="bg-slate-50">
										<TableRow>
											<TableHead className="text-xs font-bold">NIM</TableHead>
											<TableHead className="text-xs font-bold">
												Nama Mahasiswa
											</TableHead>
											<TableHead className="text-xs font-bold text-center">
												Status
											</TableHead>
											<TableHead className="text-xs font-bold">
												Keterangan
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody className="divide-y divide-slate-100 text-xs">
										{selectedHistorySession.records.map((r: any) => (
											<TableRow key={r.id}>
												<TableCell className="font-mono text-slate-500">
													{r.student?.nim || "-"}
												</TableCell>
												<TableCell className="font-bold text-slate-800">
													{r.student?.name || "-"}
												</TableCell>
												<TableCell className="text-center">
													{r.status === "hadir" ? (
														<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold">
															Hadir
														</Badge>
													) : r.status === "izin" ? (
														<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-bold">
															Izin
														</Badge>
													) : r.status === "sakit" ? (
														<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-bold">
															Sakit
														</Badge>
													) : (
														<Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 font-bold">
															Alpha
														</Badge>
													)}
												</TableCell>
												<TableCell className="text-slate-600">
													{r.notes || "-"}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>

						<DialogFooter>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setSelectedHistorySession(null)}
								className="text-xs"
							>
								Tutup
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* Modal Input & Kelola Presensi Harian Kelompok */}
			{attendanceModalGroup && (
				<GroupAttendanceDialog
					group={attendanceModalGroup}
					boardDate={selectedDate}
					boardDayName={boardData?.dayName || "Hari Ini"}
					canEdit={canEdit}
					draft={groupDrafts[attendanceModalGroup.schedule.id]}
					isSaving={savingGroupId === attendanceModalGroup.schedule.id}
					onClose={() => setAttendanceModalGroup(null)}
					onStatusChange={handleMemberStatusChange}
					onNotesChange={handleMemberNotesChange}
					onSessionNotesChange={handleGroupSessionNotesChange}
					onMarkAllHadir={handleMarkAllHadir}
					onSave={async (scheduleId) => {
						await handleSaveGroupAttendance(scheduleId);
						setAttendanceModalGroup(null);
					}}
				/>
			)}
		</div>
	);
}

/**
 * Modal Dialog untuk Input & Kelola Detail Kehadiran Kelompok Piket
 */
function GroupAttendanceDialog({
	group,
	boardDate,
	boardDayName,
	canEdit,
	draft,
	isSaving,
	onClose,
	onStatusChange,
	onNotesChange,
	onSessionNotesChange,
	onMarkAllHadir,
	onSave,
}: {
	group: GroupDailyBoard;
	boardDate: string;
	boardDayName: string;
	canEdit: boolean;
	draft:
		| {
				members: MemberItem[];
				sessionNotes: string;
				isModified: boolean;
		  }
		| undefined;
	isSaving: boolean;
	onClose: () => void;
	onStatusChange: (
		scheduleId: number,
		studentId: number,
		status: "hadir" | "izin" | "sakit" | "alpha",
	) => void;
	onNotesChange: (scheduleId: number, studentId: number, notes: string) => void;
	onSessionNotesChange: (scheduleId: number, notes: string) => void;
	onMarkAllHadir: (scheduleId: number) => void;
	onSave: (scheduleId: number) => Promise<void>;
}) {
	const members = draft ? draft.members : group.members;
	const sessionNotes =
		draft !== undefined ? draft.sessionNotes : group.sessionNotes || "";
	const isModified = draft?.isModified || false;

	const hadirCount = members.filter((m) => m.status === "hadir").length;
	const izinCount = members.filter((m) => m.status === "izin").length;
	const sakitCount = members.filter((m) => m.status === "sakit").length;
	const alphaCount = members.filter((m) => m.status === "alpha").length;
	const unrecordedCount = members.filter((m) => !m.status).length;
	const totalMembers = members.length;

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-slate-200 shadow-2xl">
				{/* Modal Header */}
				<div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 rounded-t-2xl">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
						<div className="space-y-1">
							<div className="flex items-center gap-2 flex-wrap">
								<div className="p-1.5 bg-blue-100 text-[#0517B0] rounded-md">
									<ClipboardCheck className="w-5 h-5" />
								</div>
								<h2 className="text-lg font-bold text-slate-900">
									{group.schedule.groupName}
								</h2>
								<Badge
									variant="outline"
									className="text-[11px] bg-white text-slate-700 border-slate-200"
								>
									Angkatan {group.schedule.cohort}
								</Badge>
								<Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-[11px] font-bold">
									{group.schedule.dayOfWeek}
								</Badge>
							</div>

							<div className="flex items-center gap-3.5 text-xs text-slate-500 flex-wrap pt-0.5">
								<span className="flex items-center gap-1 font-medium text-slate-700">
									<CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
									{boardDayName}, {formatDateIndo(boardDate)}
								</span>
								<span className="flex items-center gap-1">
									<MapPin className="w-3.5 h-3.5 text-slate-400" />
									{group.schedule.room}
								</span>
								{group.schedule.startTime && group.schedule.endTime && (
									<span className="flex items-center gap-1">
										<Clock className="w-3.5 h-3.5 text-slate-400" />
										{group.schedule.startTime} - {group.schedule.endTime} WIB
									</span>
								)}
							</div>
						</div>

						{/* Quick Action: Mark All Hadir */}
						{canEdit && (
							<Button
								type="button"
								size="sm"
								onClick={() => onMarkAllHadir(group.schedule.id)}
								className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-xs shrink-0 self-end sm:self-auto h-8"
							>
								<Check className="w-3.5 h-3.5" />
								Tandai Semua Hadir
							</Button>
						)}
					</div>
				</div>

				{/* Modal Body */}
				<div className="p-5 sm:p-6 space-y-5 bg-white">
					{/* Live Progress Bar & Quick Stats */}
					<div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
						<div className="flex justify-between items-center text-xs font-semibold">
							<div className="flex items-center gap-3">
								<span className="text-emerald-700 flex items-center gap-1">
									<span className="w-2 h-2 rounded-full bg-emerald-500" />
									{hadirCount} Hadir
								</span>
								<span className="text-amber-700 flex items-center gap-1">
									<span className="w-2 h-2 rounded-full bg-amber-500" />
									{izinCount} Izin
								</span>
								<span className="text-blue-700 flex items-center gap-1">
									<span className="w-2 h-2 rounded-full bg-blue-500" />
									{sakitCount} Sakit
								</span>
								<span className="text-rose-700 flex items-center gap-1">
									<span className="w-2 h-2 rounded-full bg-rose-500" />
									{alphaCount} Alpha
								</span>
							</div>
							<span className="text-slate-500 font-mono text-[11px]">
								{totalMembers - unrecordedCount}/{totalMembers} Mahasiswa
								Tercatat
							</span>
						</div>

						<div className="w-full bg-slate-200/80 rounded-full h-2 flex overflow-hidden">
							<div
								style={{
									width: `${totalMembers > 0 ? (hadirCount / totalMembers) * 100 : 0}%`,
								}}
								className="bg-emerald-500 h-full transition-all duration-300"
							/>
							<div
								style={{
									width: `${totalMembers > 0 ? (izinCount / totalMembers) * 100 : 0}%`,
								}}
								className="bg-amber-500 h-full transition-all duration-300"
							/>
							<div
								style={{
									width: `${totalMembers > 0 ? (sakitCount / totalMembers) * 100 : 0}%`,
								}}
								className="bg-blue-500 h-full transition-all duration-300"
							/>
							<div
								style={{
									width: `${totalMembers > 0 ? (alphaCount / totalMembers) * 100 : 0}%`,
								}}
								className="bg-rose-500 h-full transition-all duration-300"
							/>
						</div>
					</div>

					{/* Member Attendance Rows */}
					<div className="space-y-2">
						<Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
							Daftar Anggota Kelompok ({totalMembers} Mahasiswa)
						</Label>
						<div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
							{members.map((member, index) => (
								<div
									key={member.studentId || index}
									className="p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-50/60 transition-colors"
								>
									{/* Student Info */}
									<div className="flex items-center gap-3 min-w-0">
										<div className="w-8 h-8 rounded-full bg-blue-100 text-[#0517B0] flex items-center justify-center font-bold text-xs shrink-0">
											{member.name.substring(0, 2).toUpperCase()}
										</div>
										<div className="min-w-0">
											<p className="text-sm font-bold text-slate-900 truncate">
												{member.name}
											</p>
											<p className="text-xs text-slate-400 font-mono">
												NIM: {member.nim || "-"}
											</p>
										</div>
									</div>

									{/* Status Buttons & Notes */}
									<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
										{/* Segmented Status Toggle */}
										<div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
											<button
												type="button"
												disabled={!canEdit}
												onClick={() =>
													onStatusChange(
														group.schedule.id,
														member.studentId,
														"hadir",
													)
												}
												className={cn(
													"px-3 py-1.5 text-xs font-bold rounded-md transition-all text-center",
													member.status === "hadir"
														? "bg-emerald-600 text-white shadow-xs"
														: "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70",
												)}
											>
												Hadir
											</button>
											<button
												type="button"
												disabled={!canEdit}
												onClick={() =>
													onStatusChange(
														group.schedule.id,
														member.studentId,
														"izin",
													)
												}
												className={cn(
													"px-3 py-1.5 text-xs font-bold rounded-md transition-all text-center",
													member.status === "izin"
														? "bg-amber-500 text-white shadow-xs"
														: "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70",
												)}
											>
												Izin
											</button>
											<button
												type="button"
												disabled={!canEdit}
												onClick={() =>
													onStatusChange(
														group.schedule.id,
														member.studentId,
														"sakit",
													)
												}
												className={cn(
													"px-3 py-1.5 text-xs font-bold rounded-md transition-all text-center",
													member.status === "sakit"
														? "bg-blue-600 text-white shadow-xs"
														: "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70",
												)}
											>
												Sakit
											</button>
											<button
												type="button"
												disabled={!canEdit}
												onClick={() =>
													onStatusChange(
														group.schedule.id,
														member.studentId,
														"alpha",
													)
												}
												className={cn(
													"px-3 py-1.5 text-xs font-bold rounded-md transition-all text-center",
													member.status === "alpha"
														? "bg-rose-600 text-white shadow-xs"
														: "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70",
												)}
											>
												Alpha
											</button>
										</div>

										{/* Member Note Input */}
										<Input
											placeholder="Keterangan..."
											disabled={!canEdit}
											value={member.notes || ""}
											onChange={(e) =>
												onNotesChange(
													group.schedule.id,
													member.studentId,
													e.target.value,
												)
											}
											className="h-8 text-xs w-full sm:w-32 border-slate-200 bg-white"
										/>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Group General Notes */}
					<div className="space-y-1.5">
						<Label className="text-xs font-bold text-slate-700">
							Catatan Kebersihan / Kendala Piket (Opsional)
						</Label>
						<Input
							placeholder="Tuliskan catatan kondisi ruangan atau evaluasi kebersihan kelompok..."
							disabled={!canEdit}
							value={sessionNotes}
							onChange={(e) =>
								onSessionNotesChange(group.schedule.id, e.target.value)
							}
							className="h-9 text-xs border-slate-200 bg-white"
						/>
					</div>
				</div>

				{/* Modal Footer */}
				<div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 rounded-b-2xl">
					<div className="text-xs text-slate-500 font-medium text-center sm:text-left">
						{isModified && (
							<span className="text-amber-600 font-semibold flex items-center gap-1 justify-center sm:justify-start">
								<span>✏️</span> Perubahan belum disimpan permanen
							</span>
						)}
					</div>

					<div className="flex items-center gap-2 justify-end">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onClose}
							disabled={isSaving}
							className="h-9 px-4 text-xs font-medium border-slate-200"
						>
							Batal
						</Button>
						{canEdit && (
							<Button
								type="button"
								size="sm"
								disabled={isSaving}
								onClick={() => onSave(group.schedule.id)}
								className="h-9 px-5 text-xs font-bold gap-1.5 bg-[#0517B0] hover:bg-[#0517B0]/90 text-white shadow-xs"
							>
								{isSaving ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5" />
								)}
								Simpan Presensi
							</Button>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
