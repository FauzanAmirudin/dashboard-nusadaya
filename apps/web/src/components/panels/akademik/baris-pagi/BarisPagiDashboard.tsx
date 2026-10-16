"use client";

import {
	AlertCircle,
	AlertTriangle,
	Award,
	Calendar as CalendarIcon,
	Check,
	CheckCircle,
	CheckCircle2,
	ChevronRight,
	Clock,
	Download,
	Eye,
	Filter,
	HelpCircle,
	Loader2,
	MapPin,
	Plus,
	RefreshCw,
	Save,
	Search,
	ShieldAlert,
	ShieldCheck,
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
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL, getToken } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

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

// Calculate on-time / late threshold against 06.22
function evaluateArrival(
	arrivalTime: string,
	targetTime: string = "06:22",
): { isLate: boolean; minutesLate: number } {
	if (!arrivalTime || !arrivalTime.includes(":")) {
		return { isLate: false, minutesLate: 0 };
	}
	const [ah, am] = arrivalTime.split(":").map((v) => parseInt(v, 10));
	const [th, tm] = targetTime.split(":").map((v) => parseInt(v, 10));

	if (isNaN(ah) || isNaN(am) || isNaN(th) || isNaN(tm)) {
		return { isLate: false, minutesLate: 0 };
	}

	const arrMinutes = ah * 60 + am;
	const tarMinutes = th * 60 + tm;
	const diff = arrMinutes - tarMinutes;

	return {
		isLate: diff > 0,
		minutesLate: diff > 0 ? diff : 0,
	};
}

interface SessionItem {
	id: number;
	cohort: number;
	rombel: string;
	sessionDate: string;
	targetTime: string;
	location: string;
	notes: string | null;
	createdBy: string;
	createdAt: string;
	stats: {
		total: number;
		hadir: number;
		terlambat: number;
		izin: number;
		sakit: number;
		alpha: number;
		complianceRate: number;
	};
}

interface MemberRecord {
	studentId: number;
	name: string;
	nim: string;
	rombel: string;
	status: "hadir" | "terlambat" | "izin" | "sakit" | "alpha" | null;
	arrivalTime: string;
	minutesLate: number;
	notes: string;
	recordId: number | null;
	recordedBy: string | null;
	recordedAt: string | null;
}

interface StudentSummaryItem {
	id: number;
	nim: string;
	name: string;
	cohort: number;
	rombel: string;
	program: string;
	subProgram: string;
	totalSesi: number;
	totalTepatWaktu: number;
	totalTerlambat: number;
	complianceRate: number;
	statusDisiplin: "DISIPLIN" | "PERLU_PEMBINAAN" | "KRITIS";
}

export function BarisPagiDashboard() {
	const { user } = useAuthStore();
	const isStaff = user?.role === "superadmin" || user?.role === "akademik";

	const [activeTab, setActiveTab] = useState<"board" | "sessions" | "rekap">(
		"board",
	);

	// Sessions state
	const [sessions, setSessions] = useState<SessionItem[]>([]);
	const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
		null,
	);
	const [isLoadingSessions, setIsLoadingSessions] = useState(false);

	// Board state
	const [currentSession, setCurrentSession] = useState<SessionItem | null>(
		null,
	);
	const [members, setMembers] = useState<MemberRecord[]>([]);
	const [isLoadingBoard, setIsLoadingBoard] = useState(false);
	const [isSavingBoard, setIsSavingBoard] = useState(false);
	const [boardSearch, setBoardSearch] = useState("");
	const [boardStatusFilter, setBoardStatusFilter] = useState("all");

	// Summary / Rekap state
	const [summaryList, setSummaryList] = useState<StudentSummaryItem[]>([]);
	const [isLoadingSummary, setIsLoadingSummary] = useState(false);
	const [summaryFilterCohort, setSummaryFilterCohort] = useState("all");
	const [summaryFilterRombel, setSummaryFilterRombel] = useState("all");
	const [summarySearch, setSummarySearch] = useState("");

	// Create Session Dialog
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [createForm, setCreateForm] = useState({
		cohort: "16",
		rombel: "Semua",
		sessionDate: new Date().toISOString().split("T")[0],
		targetTime: "06:22",
		location: "Lapangan Utama Kampus",
		notes: "Apel baris pagi kedisiplinan mingguan",
	});
	const [isCreating, setIsCreating] = useState(false);

	// Delete confirmation dialog
	const [sessionToDelete, setSessionToDelete] = useState<SessionItem | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);

	// Fetch sessions list
	const fetchSessions = async () => {
		setIsLoadingSessions(true);
		try {
			const token = getToken();
			const res = await fetch(`${API_URL}/attendance/baris-pagi/sessions`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const json = await res.json();
			if (json.success) {
				const list = json.data || [];
				setSessions(list);
				if (list.length > 0 && !selectedSessionId) {
					setSelectedSessionId(list[0].id);
				}
			} else {
				toast.error(json.message || "Gagal memuat sesi baris pagi");
			}
		} catch {
			toast.error("Kesalahan jaringan saat memuat sesi baris pagi");
		} finally {
			setIsLoadingSessions(false);
		}
	};

	// Fetch board detail for selected session
	const fetchBoardData = async (sessionId: number) => {
		setIsLoadingBoard(true);
		try {
			const token = getToken();
			const res = await fetch(
				`${API_URL}/attendance/baris-pagi/sessions/${sessionId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			const json = await res.json();
			if (json.success) {
				setCurrentSession(json.data.session);
				setMembers(json.data.members || []);
			} else {
				toast.error(json.message || "Gagal memuat rincian sesi");
			}
		} catch {
			toast.error("Gagal memuat peserta sesi baris pagi");
		} finally {
			setIsLoadingBoard(false);
		}
	};

	// Fetch summary list
	const fetchSummary = async () => {
		setIsLoadingSummary(true);
		try {
			const token = getToken();
			const params = new URLSearchParams();
			if (summaryFilterCohort !== "all")
				params.append("cohort", summaryFilterCohort);
			if (summaryFilterRombel !== "all")
				params.append("rombel", summaryFilterRombel);
			if (summarySearch) params.append("search", summarySearch);

			const res = await fetch(
				`${API_URL}/attendance/baris-pagi/student-summary?${params.toString()}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			const json = await res.json();
			if (json.success) {
				setSummaryList(json.data || []);
			}
		} catch {
			toast.error("Gagal memuat rekap kepatuhan mahasiswa");
		} finally {
			setIsLoadingSummary(false);
		}
	};

	useEffect(() => {
		fetchSessions();
	}, []);

	useEffect(() => {
		if (selectedSessionId) {
			fetchBoardData(selectedSessionId);
		}
	}, [selectedSessionId]);

	useEffect(() => {
		if (activeTab === "rekap") {
			fetchSummary();
		}
	}, [activeTab, summaryFilterCohort, summaryFilterRombel, summarySearch]);

	// Handle Create Session
	const handleCreateSession = async () => {
		if (!createForm.sessionDate || !createForm.cohort) {
			toast.error("Tanggal dan Angkatan wajib diisi");
			return;
		}
		setIsCreating(true);
		try {
			const token = getToken();
			const res = await fetch(`${API_URL}/attendance/baris-pagi/sessions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(createForm),
			});
			const json = await res.json();
			if (json.success) {
				toast.success("Sesi baris pagi mingguan berhasil dibuat!");
				setIsCreateOpen(false);
				await fetchSessions();
				if (json.data?.id) {
					setSelectedSessionId(json.data.id);
					setActiveTab("board");
				}
			} else {
				toast.error(json.message || "Gagal membuat sesi");
			}
		} catch {
			toast.error("Kesalahan jaringan saat membuat sesi");
		} finally {
			setIsCreating(false);
		}
	};

	// Handle Delete Session
	const handleDeleteSession = async () => {
		if (!sessionToDelete) return;
		setIsDeleting(true);
		try {
			const token = getToken();
			const res = await fetch(
				`${API_URL}/attendance/baris-pagi/sessions/${sessionToDelete.id}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			const json = await res.json();
			if (json.success) {
				toast.success("Sesi baris pagi berhasil dihapus");
				setSessionToDelete(null);
				await fetchSessions();
				if (selectedSessionId === sessionToDelete.id) {
					setSelectedSessionId(null);
					setCurrentSession(null);
					setMembers([]);
				}
			} else {
				toast.error(json.message || "Gagal menghapus sesi");
			}
		} catch {
			toast.error("Gagal menghapus sesi baris pagi");
		} finally {
			setIsDeleting(false);
		}
	};

	// In-board member changes
	const handleMemberStatusChange = (
		studentId: number,
		newStatus: "hadir" | "terlambat" | "izin" | "sakit" | "alpha",
	) => {
		setMembers((prev) =>
			prev.map((m) => {
				if (m.studentId !== studentId) return m;

				let arrivalTime = m.arrivalTime;
				let minutesLate = 0;

				// Smart preset arrival time based on status
				if (
					newStatus === "hadir" &&
					(!arrivalTime || m.status === "terlambat")
				) {
					arrivalTime = "06:18";
				} else if (
					newStatus === "terlambat" &&
					(!arrivalTime || m.status === "hadir")
				) {
					arrivalTime = "06:28";
					minutesLate = 6;
				} else if (
					newStatus === "izin" ||
					newStatus === "sakit" ||
					newStatus === "alpha"
				) {
					arrivalTime = "";
					minutesLate = 0;
				}

				return {
					...m,
					status: newStatus,
					arrivalTime,
					minutesLate,
				};
			}),
		);
	};

	const handleMemberArrivalTimeChange = (
		studentId: number,
		newTime: string,
	) => {
		const targetTime = currentSession?.targetTime || "06:22";
		const { isLate, minutesLate } = evaluateArrival(newTime, targetTime);

		setMembers((prev) =>
			prev.map((m) => {
				if (m.studentId !== studentId) return m;

				let status = m.status;
				if (status === "hadir" || status === "terlambat" || !status) {
					status = isLate ? "terlambat" : "hadir";
				}

				return {
					...m,
					arrivalTime: newTime,
					status,
					minutesLate,
				};
			}),
		);
	};

	const handleMemberNotesChange = (studentId: number, notes: string) => {
		setMembers((prev) =>
			prev.map((m) => (m.studentId === studentId ? { ...m, notes } : m)),
		);
	};

	// Bulk Action: Mark all on time (06.20)
	const handleMarkAllOnTime = () => {
		setMembers((prev) =>
			prev.map((m) => ({
				...m,
				status: "hadir",
				arrivalTime: "06:20",
				minutesLate: 0,
			})),
		);
		toast.success("Semua mahasiswa ditandai Hadir Tepat Waktu (06:20 WIB)");
	};

	// Save board changes
	const handleSaveBoard = async () => {
		if (!selectedSessionId) return;
		setIsSavingBoard(true);
		try {
			const token = getToken();
			const payload = {
				records: members
					.filter((m) => m.status !== null)
					.map((m) => ({
						studentId: m.studentId,
						status: m.status,
						arrivalTime: m.arrivalTime || null,
						notes: m.notes || null,
					})),
			};

			const res = await fetch(
				`${API_URL}/attendance/baris-pagi/sessions/${selectedSessionId}/records`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(payload),
				},
			);
			const json = await res.json();
			if (json.success) {
				toast.success(
					"Presensi baris pagi mingguan berhasil disimpan & disinkronkan ke nilai mahasiswa!",
				);
				await fetchBoardData(selectedSessionId);
				await fetchSessions();
			} else {
				toast.error(json.message || "Gagal menyimpan presensi");
			}
		} catch {
			toast.error("Kesalahan jaringan saat menyimpan presensi");
		} finally {
			setIsSavingBoard(false);
		}
	};

	// Filtered board members
	const filteredMembers = useMemo(() => {
		return members.filter((m) => {
			const matchSearch =
				boardSearch === "" ||
				m.name.toLowerCase().includes(boardSearch.toLowerCase()) ||
				m.nim.toLowerCase().includes(boardSearch.toLowerCase());

			const matchStatus =
				boardStatusFilter === "all" ||
				(boardStatusFilter === "unrecorded"
					? !m.status
					: m.status === boardStatusFilter);

			return matchSearch && matchStatus;
		});
	}, [members, boardSearch, boardStatusFilter]);

	// Board Stats
	const boardStats = useMemo(() => {
		const total = members.length;
		const hadir = members.filter((m) => m.status === "hadir").length;
		const terlambat = members.filter((m) => m.status === "terlambat").length;
		const izin = members.filter((m) => m.status === "izin").length;
		const sakit = members.filter((m) => m.status === "sakit").length;
		const alpha = members.filter((m) => m.status === "alpha").length;
		const unrecorded = members.filter((m) => !m.status).length;
		const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;
		return { total, hadir, terlambat, izin, sakit, alpha, unrecorded, rate };
	}, [members]);

	// Export Summary to CSV
	const handleExportSummaryCSV = () => {
		if (summaryList.length === 0) {
			toast.error("Tidak ada data untuk diekspor");
			return;
		}
		const exportData = summaryList.map((s, idx) => ({
			No: idx + 1,
			NIM: s.nim,
			Nama: s.name,
			Angkatan: s.cohort,
			Rombel: s.rombel,
			Program: s.program,
			Total_Sesi: s.totalSesi,
			Tepat_Waktu: s.totalTepatWaktu,
			Terlambat: s.totalTerlambat,
			Kepatuhan_Persen: `${s.complianceRate}%`,
			Status_Kedisiplinan: s.statusDisiplin,
		}));
		exportToCSV(
			exportData,
			`Rekap_Kepatuhan_Baris_Pagi_0622_${new Date().toISOString().split("T")[0]}`,
		);
	};

	return (
		<div className="space-y-6">
			{/* Top Header Banner */}
			<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
				<div className="flex items-center gap-3.5">
					<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-900 text-white flex items-center justify-center shadow-xs ring-4 ring-blue-50 shrink-0">
						<ShieldCheck className="w-6 h-6" />
					</div>
					<div>
						<div className="flex items-center gap-2.5 flex-wrap">
							<h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
								Kepatuhan Baris Pagi
							</h1>
							<Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border border-amber-300 font-bold text-xs px-2.5 py-0.5 rounded-full">
								<Clock className="w-3.5 h-3.5 mr-1 text-amber-700" />
								Standar 06.22 WIB
							</Badge>
							<Badge
								variant="secondary"
								className="bg-blue-50 text-[#0517B0] text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200"
							>
								Panel Akademik
							</Badge>
						</div>
						<p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
							Pencatatan kehadiran apel baris pagi mingguan dan evaluasi jam
							kedatangan aktual mahasiswa (threshold baku 06.22) untuk integrasi
							matriks All-Service.
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2.5 w-full sm:w-auto">
					{isStaff && (
						<Button
							onClick={() => setIsCreateOpen(true)}
							className="bg-[#0517B0] hover:bg-blue-800 text-white shadow-xs rounded-xl font-semibold text-xs sm:text-sm gap-2"
						>
							<Plus className="w-4 h-4" />
							<span>Buat Sesi Baris Pagi</span>
						</Button>
					)}
					<Button
						variant="outline"
						size="icon"
						onClick={() => {
							fetchSessions();
							if (selectedSessionId) fetchBoardData(selectedSessionId);
							if (activeTab === "rekap") fetchSummary();
							toast.info("Data diperbarui");
						}}
						className="rounded-xl border-slate-200"
						title="Segarkan Data"
					>
						<RefreshCw className="w-4 h-4 text-slate-600" />
					</Button>
				</div>
			</div>

			{/* Tabs Segment */}
			<Tabs
				value={activeTab}
				onValueChange={(val) => setActiveTab(val as any)}
				className="w-full space-y-6"
			>
				<TabsList className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 shadow-2xs grid grid-cols-3 max-w-md h-auto">
					<TabsTrigger
						value="board"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold cursor-pointer"
					>
						Board Presensi
					</TabsTrigger>
					<TabsTrigger
						value="sessions"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold cursor-pointer"
					>
						Riwayat Sesi ({sessions.length})
					</TabsTrigger>
					<TabsTrigger
						value="rekap"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold cursor-pointer"
					>
						Rekap Kedisiplinan
					</TabsTrigger>
				</TabsList>

				{/* TAB 1: BOARD PRESENSI SESI */}
				<TabsContent value="board" className="space-y-6">
					{/* Session Selector Bar */}
					<div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
						<div className="flex items-center gap-3 w-full md:w-auto">
							<span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
								Pilih Sesi:
							</span>
							<Select
								value={selectedSessionId ? selectedSessionId.toString() : ""}
								onValueChange={(v) =>
									setSelectedSessionId(v ? parseInt(v, 10) : null)
								}
							>
								<SelectTrigger className="w-full md:w-[320px] rounded-xl text-xs sm:text-sm bg-slate-50 font-medium">
									<SelectValue placeholder="Pilih sesi baris pagi..." />
								</SelectTrigger>
								<SelectContent>
									{sessions.map((s) => (
										<SelectItem key={s.id} value={s.id.toString()}>
											{s.sessionDate} • Angkatan {s.cohort} ({s.rombel})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{currentSession && (
							<div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
								<span className="flex items-center gap-1 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
									<MapPin className="w-3.5 h-3.5 text-slate-500" />
									{currentSession.location}
								</span>
								<span className="flex items-center gap-1 font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
									<Clock className="w-3.5 h-3.5 text-amber-600" />
									Target: {currentSession.targetTime} WIB
								</span>
							</div>
						)}
					</div>

					{/* No Session State */}
					{sessions.length === 0 ? (
						<div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-4 shadow-2xs">
							<div className="w-14 h-14 rounded-full bg-blue-50 text-[#0517B0] mx-auto flex items-center justify-center">
								<Clock className="w-7 h-7" />
							</div>
							<div className="space-y-1">
								<h3 className="text-base font-bold text-slate-900">
									Belum Ada Sesi Baris Pagi
								</h3>
								<p className="text-xs text-slate-500 max-w-md mx-auto">
									Silakan buat sesi apel baris pagi baru untuk memulai
									pencatatan kehadiran dan jam kedatangan mahasiswa.
								</p>
							</div>
							{isStaff && (
								<Button
									onClick={() => setIsCreateOpen(true)}
									className="bg-[#0517B0] hover:bg-blue-800 text-white rounded-xl text-xs font-semibold gap-2"
								>
									<Plus className="w-4 h-4" />
									Buat Sesi Pertama
								</Button>
							)}
						</div>
					) : isLoadingBoard ? (
						<div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
							<Loader2 className="w-7 h-7 animate-spin text-[#0517B0]" />
							<span className="text-xs font-medium text-slate-500">
								Memuat data presensi sesi...
							</span>
						</div>
					) : (
						<>
							{/* Session Stats KPI Row */}
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
								<Card className="border-slate-200/90 shadow-2xs">
									<CardContent className="p-3.5 space-y-1">
										<span className="text-[11px] font-medium text-slate-500">
											Total Peserta
										</span>
										<div className="text-xl font-black text-slate-900">
											{boardStats.total}
										</div>
									</CardContent>
								</Card>

								<Card className="border-emerald-200/70 bg-emerald-50/20 shadow-2xs">
									<CardContent className="p-3.5 space-y-1">
										<span className="text-[11px] font-semibold text-emerald-700">
											Tepat Waktu (≤06.22)
										</span>
										<div className="text-xl font-black text-emerald-700">
											{boardStats.hadir}
										</div>
									</CardContent>
								</Card>

								<Card className="border-amber-200/70 bg-amber-50/20 shadow-2xs">
									<CardContent className="p-3.5 space-y-1">
										<span className="text-[11px] font-semibold text-amber-700">
											Terlambat (&gt;06.22)
										</span>
										<div className="text-xl font-black text-amber-700">
											{boardStats.terlambat}
										</div>
									</CardContent>
								</Card>

								<Card className="border-blue-200/70 bg-blue-50/20 shadow-2xs">
									<CardContent className="p-3.5 space-y-1">
										<span className="text-[11px] font-semibold text-blue-700">
											Izin / Sakit
										</span>
										<div className="text-xl font-black text-blue-700">
											{boardStats.izin + boardStats.sakit}
										</div>
									</CardContent>
								</Card>

								<Card className="border-rose-200/70 bg-rose-50/20 shadow-2xs">
									<CardContent className="p-3.5 space-y-1">
										<span className="text-[11px] font-semibold text-rose-700">
											Alpha (Alpa)
										</span>
										<div className="text-xl font-black text-rose-700">
											{boardStats.alpha}
										</div>
									</CardContent>
								</Card>

								<Card className="border-indigo-200/70 bg-indigo-50/20 shadow-2xs">
									<CardContent className="p-3.5 space-y-1">
										<span className="text-[11px] font-semibold text-indigo-700">
											Kepatuhan Sesi
										</span>
										<div className="text-xl font-black text-indigo-900">
											{boardStats.rate}%
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Actions & Filters Bar */}
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
								<div className="flex items-center gap-2.5 flex-1">
									<div className="relative flex-1 max-w-xs">
										<Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
										<Input
											placeholder="Cari nama atau NIM..."
											value={boardSearch}
											onChange={(e) => setBoardSearch(e.target.value)}
											className="pl-9 h-9 text-xs rounded-xl"
										/>
									</div>
									<Select
										value={boardStatusFilter}
										onValueChange={(val) => setBoardStatusFilter(val || "all")}
									>
										<SelectTrigger className="w-[140px] h-9 text-xs rounded-xl">
											<SelectValue placeholder="Semua Status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Semua Status</SelectItem>
											<SelectItem value="hadir">Tepat Waktu</SelectItem>
											<SelectItem value="terlambat">Terlambat</SelectItem>
											<SelectItem value="izin">Izin</SelectItem>
											<SelectItem value="sakit">Sakit</SelectItem>
											<SelectItem value="alpha">Alpha</SelectItem>
											<SelectItem value="unrecorded">Belum Diisi</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{isStaff && (
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={handleMarkAllOnTime}
											className="rounded-xl text-xs font-semibold border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5"
										>
											<Check className="w-3.5 h-3.5" />
											Semua Tepat Waktu (06.20)
										</Button>
										<Button
											size="sm"
											onClick={handleSaveBoard}
											disabled={isSavingBoard}
											className="bg-[#0517B0] hover:bg-blue-800 text-white rounded-xl text-xs font-semibold gap-1.5 shadow-xs"
										>
											{isSavingBoard ? (
												<Loader2 className="w-3.5 h-3.5 animate-spin" />
											) : (
												<Save className="w-3.5 h-3.5" />
											)}
											<span>Simpan Presensi Sesi</span>
										</Button>
									</div>
								)}
							</div>

							{/* Members Table */}
							<div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
								<div className="overflow-x-auto">
									<table className="w-full text-left text-xs border-collapse">
										<thead>
											<tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
												<th className="py-3 px-4 w-12 text-center">No</th>
												<th className="py-3 px-4">NIM & Mahasiswa</th>
												<th className="py-3 px-4">Rombel</th>
												<th className="py-3 px-4 w-36">
													Jam Kedatangan (06.22)
												</th>
												<th className="py-3 px-4 w-72">Status Presensi</th>
												<th className="py-3 px-4">Catatan</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-100">
											{filteredMembers.map((m, idx) => {
												const { isLate, minutesLate } = evaluateArrival(
													m.arrivalTime,
													currentSession?.targetTime || "06:22",
												);
												return (
													<tr
														key={m.studentId}
														className={cn(
															"hover:bg-slate-50/60 transition-colors",
															m.status === "terlambat" && "bg-amber-50/20",
															m.status === "alpha" && "bg-rose-50/20",
														)}
													>
														<td className="py-3 px-4 text-center text-slate-400 font-mono">
															{idx + 1}
														</td>
														<td className="py-3 px-4">
															<div className="font-semibold text-slate-900">
																{m.name}
															</div>
															<div className="text-[11px] text-slate-500 font-mono">
																{m.nim}
															</div>
														</td>
														<td className="py-3 px-4">
															<Badge
																variant="secondary"
																className="text-[10px] font-mono px-2 py-0"
															>
																{m.rombel}
															</Badge>
														</td>
														<td className="py-3 px-4">
															<div className="space-y-1">
																<Input
																	type="time"
																	disabled={!isStaff}
																	value={m.arrivalTime}
																	onChange={(e) =>
																		handleMemberArrivalTimeChange(
																			m.studentId,
																			e.target.value,
																		)
																	}
																	className={cn(
																		"h-8 text-xs font-mono font-semibold rounded-lg px-2",
																		m.arrivalTime &&
																			(isLate
																				? "border-amber-400 bg-amber-50/40 text-amber-900"
																				: "border-emerald-400 bg-emerald-50/40 text-emerald-900"),
																	)}
																/>
																{m.arrivalTime && (
																	<div className="text-[10px] font-bold">
																		{isLate ? (
																			<span className="text-amber-700 flex items-center gap-1">
																				<Clock className="w-3 h-3 shrink-0" />
																				Terlambat +{minutesLate} mnt
																			</span>
																		) : (
																			<span className="text-emerald-700 flex items-center gap-1">
																				<Check className="w-3 h-3 shrink-0" />
																				Tepat Waktu (≤06.22)
																			</span>
																		)}
																	</div>
																)}
															</div>
														</td>
														<td className="py-3 px-4">
															<div className="flex items-center gap-1 flex-wrap">
																<Button
																	type="button"
																	size="sm"
																	disabled={!isStaff}
																	onClick={() =>
																		handleMemberStatusChange(
																			m.studentId,
																			"hadir",
																		)
																	}
																	className={cn(
																		"h-7 px-2 text-[11px] font-semibold rounded-lg transition-all",
																		m.status === "hadir"
																			? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs ring-2 ring-emerald-300"
																			: "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200",
																	)}
																>
																	Hadir (06.22)
																</Button>
																<Button
																	type="button"
																	size="sm"
																	disabled={!isStaff}
																	onClick={() =>
																		handleMemberStatusChange(
																			m.studentId,
																			"terlambat",
																		)
																	}
																	className={cn(
																		"h-7 px-2 text-[11px] font-semibold rounded-lg transition-all",
																		m.status === "terlambat"
																			? "bg-amber-600 hover:bg-amber-700 text-white shadow-2xs ring-2 ring-amber-300"
																			: "bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200",
																	)}
																>
																	Terlambat
																</Button>
																<Button
																	type="button"
																	size="sm"
																	disabled={!isStaff}
																	onClick={() =>
																		handleMemberStatusChange(
																			m.studentId,
																			"izin",
																		)
																	}
																	className={cn(
																		"h-7 px-2 text-[11px] font-semibold rounded-lg transition-all",
																		m.status === "izin"
																			? "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs ring-2 ring-blue-300"
																			: "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200",
																	)}
																>
																	Izin
																</Button>
																<Button
																	type="button"
																	size="sm"
																	disabled={!isStaff}
																	onClick={() =>
																		handleMemberStatusChange(
																			m.studentId,
																			"sakit",
																		)
																	}
																	className={cn(
																		"h-7 px-2 text-[11px] font-semibold rounded-lg transition-all",
																		m.status === "sakit"
																			? "bg-purple-600 hover:bg-purple-700 text-white shadow-2xs ring-2 ring-purple-300"
																			: "bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200",
																	)}
																>
																	Sakit
																</Button>
																<Button
																	type="button"
																	size="sm"
																	disabled={!isStaff}
																	onClick={() =>
																		handleMemberStatusChange(
																			m.studentId,
																			"alpha",
																		)
																	}
																	className={cn(
																		"h-7 px-2 text-[11px] font-semibold rounded-lg transition-all",
																		m.status === "alpha"
																			? "bg-rose-600 hover:bg-rose-700 text-white shadow-2xs ring-2 ring-rose-300"
																			: "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200",
																	)}
																>
																	Alpha
																</Button>
															</div>
														</td>
														<td className="py-3 px-4">
															<Input
																disabled={!isStaff}
																placeholder="Catatan..."
																value={m.notes}
																onChange={(e) =>
																	handleMemberNotesChange(
																		m.studentId,
																		e.target.value,
																	)
																}
																className="h-8 text-xs rounded-lg"
															/>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>
						</>
					)}
				</TabsContent>

				{/* TAB 2: RIWAYAT SESI */}
				<TabsContent value="sessions" className="space-y-4">
					<div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
						<div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
							<div>
								<h3 className="text-sm sm:text-base font-bold text-slate-900">
									Riwayat Seluruh Sesi Baris Pagi
								</h3>
								<p className="text-xs text-slate-500">
									Daftar tanggal apel baris pagi yang telah diselenggarakan
								</p>
							</div>
							{isStaff && (
								<Button
									size="sm"
									onClick={() => setIsCreateOpen(true)}
									className="bg-[#0517B0] hover:bg-blue-800 text-white rounded-xl text-xs font-semibold gap-1.5"
								>
									<Plus className="w-3.5 h-3.5" />
									Tambah Sesi
								</Button>
							)}
						</div>

						{sessions.length === 0 ? (
							<div className="p-12 text-center text-slate-400 text-xs">
								Belum ada sesi baris pagi tercatat.
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs border-collapse">
									<thead>
										<tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
											<th className="py-3 px-4">Tanggal Sesi</th>
											<th className="py-3 px-4">Angkatan & Rombel</th>
											<th className="py-3 px-4">Lokasi & Standar</th>
											<th className="py-3 px-4">Statistik Hadir / Terlambat</th>
											<th className="py-3 px-4">Kepatuhan Sesi</th>
											<th className="py-3 px-4">Pencatat</th>
											<th className="py-3 px-4 text-right">Aksi</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100 font-normal">
										{sessions.map((s) => (
											<tr
												key={s.id}
												className="hover:bg-slate-50/60 transition-colors"
											>
												<td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
													<div className="flex items-center gap-2">
														<CalendarIcon className="w-4 h-4 text-[#0517B0]" />
														<span>{formatDateIndo(s.sessionDate)}</span>
													</div>
												</td>
												<td className="py-3 px-4 text-slate-700 whitespace-nowrap">
													<span className="font-semibold">
														Angkatan {s.cohort}
													</span>{" "}
													•{" "}
													<Badge
														variant="outline"
														className="text-[10px] font-mono px-1.5 py-0"
													>
														{s.rombel}
													</Badge>
												</td>
												<td className="py-3 px-4 text-slate-600 whitespace-nowrap">
													<div className="flex items-center gap-1.5">
														<MapPin className="w-3.5 h-3.5 text-slate-400" />
														<span>{s.location}</span>
														<Badge className="bg-amber-100 text-amber-900 text-[10px] font-mono px-1.5 py-0">
															{s.targetTime} WIB
														</Badge>
													</div>
												</td>
												<td className="py-3 px-4 whitespace-nowrap">
													<div className="text-[11px] space-y-0.5">
														<div>
															<span className="font-bold text-emerald-700">
																{s.stats.hadir} Hadir (≤06.22)
															</span>{" "}
															•{" "}
															<span className="font-bold text-amber-700">
																{s.stats.terlambat} Terlambat
															</span>
														</div>
														<div className="text-slate-400 text-[10px]">
															Izin: {s.stats.izin} | Sakit: {s.stats.sakit} |
															Alpha: {s.stats.alpha} (Total: {s.stats.total})
														</div>
													</div>
												</td>
												<td className="py-3 px-4 whitespace-nowrap">
													<div className="flex items-center gap-2">
														<Progress
															value={s.stats.complianceRate}
															className="w-16 h-1.5 bg-slate-100"
														/>
														<span className="font-mono font-bold text-slate-900">
															{s.stats.complianceRate}%
														</span>
													</div>
												</td>
												<td className="py-3 px-4 text-slate-500 whitespace-nowrap">
													{s.createdBy}
												</td>
												<td className="py-3 px-4 text-right whitespace-nowrap">
													<div className="flex items-center justify-end gap-1.5">
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																setSelectedSessionId(s.id);
																setActiveTab("board");
															}}
															className="h-7 px-2.5 text-xs rounded-lg gap-1 border-slate-200"
														>
															<Eye className="w-3.5 h-3.5 text-slate-600" />
															Buka Board
														</Button>
														{isStaff && (
															<Button
																variant="ghost"
																size="icon"
																onClick={() => setSessionToDelete(s)}
																className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
															>
																<Trash2 className="w-3.5 h-3.5" />
															</Button>
														)}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</TabsContent>

				{/* TAB 3: REKAP KEPATUHAN MAHASISWA */}
				<TabsContent value="rekap" className="space-y-6">
					{/* Filters & Export */}
					<div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
						<div className="flex items-center gap-2.5 flex-1 flex-wrap">
							<div className="relative flex-1 min-w-[200px] max-w-xs">
								<Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
								<Input
									placeholder="Cari nama atau NIM..."
									value={summarySearch}
									onChange={(e) => setSummarySearch(e.target.value)}
									className="pl-9 h-9 text-xs rounded-xl"
								/>
							</div>

							<Select
								value={summaryFilterCohort}
								onValueChange={(val) => setSummaryFilterCohort(val || "all")}
							>
								<SelectTrigger className="w-[130px] h-9 text-xs rounded-xl">
									<SelectValue placeholder="Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan</SelectItem>
									<SelectItem value="16">Angkatan 16</SelectItem>
									<SelectItem value="17">Angkatan 17</SelectItem>
									<SelectItem value="15">Angkatan 15</SelectItem>
								</SelectContent>
							</Select>

							<Select
								value={summaryFilterRombel}
								onValueChange={(val) => setSummaryFilterRombel(val || "all")}
							>
								<SelectTrigger className="w-[130px] h-9 text-xs rounded-xl">
									<SelectValue placeholder="Rombel" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Rombel</SelectItem>
									<SelectItem value="Kelas A">Kelas A</SelectItem>
									<SelectItem value="Kelas B">Kelas B</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Button
							variant="outline"
							size="sm"
							onClick={handleExportSummaryCSV}
							className="rounded-xl text-xs font-semibold gap-2 border-slate-200 shadow-2xs"
						>
							<Download className="w-3.5 h-3.5 text-slate-600" />
							Ekspor Rekap CSV
						</Button>
					</div>

					{/* Rekap Table */}
					<div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
						{isLoadingSummary ? (
							<div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
								<Loader2 className="w-6 h-6 animate-spin text-[#0517B0]" />
								<span className="text-xs font-medium text-slate-500">
									Memuat rekapitulasi kepatuhan...
								</span>
							</div>
						) : summaryList.length === 0 ? (
							<div className="p-12 text-center text-slate-400 text-xs">
								Tidak ada data mahasiswa ditemukan.
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs border-collapse">
									<thead>
										<tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
											<th className="py-3 px-4 w-12 text-center">No</th>
											<th className="py-3 px-4">NIM & Nama Mahasiswa</th>
											<th className="py-3 px-4">Angkatan & Rombel</th>
											<th className="py-3 px-4">Program</th>
											<th className="py-3 px-4 text-center">Total Sesi</th>
											<th className="py-3 px-4 text-center">
												Tepat Waktu (≤06.22)
											</th>
											<th className="py-3 px-4 text-center">
												Terlambat (&gt;06.22)
											</th>
											<th className="py-3 px-4">Kepatuhan (%)</th>
											<th className="py-3 px-4 text-center">
												Status Kedisiplinan
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100 font-normal">
										{summaryList.map((s, idx) => {
											let badgeColor =
												"bg-emerald-50 text-emerald-700 border-emerald-200";
											let statusLabel = "DISIPLIN TINGGI";
											if (s.statusDisiplin === "PERLU_PEMBINAAN") {
												badgeColor =
													"bg-amber-50 text-amber-700 border-amber-200";
												statusLabel = "PERLU PEMBINAAN";
											} else if (s.statusDisiplin === "KRITIS") {
												badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
												statusLabel = "STATUS KRITIS";
											}

											return (
												<tr
													key={s.id}
													className="hover:bg-slate-50/60 transition-colors"
												>
													<td className="py-3 px-4 text-center text-slate-400 font-mono">
														{idx + 1}
													</td>
													<td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
														<Link
															href={`/dashboard/students/${s.id}`}
															className="hover:text-[#0517B0] transition-colors"
														>
															{s.name}
														</Link>
														<div className="text-[11px] text-slate-400 font-mono font-normal">
															{s.nim}
														</div>
													</td>
													<td className="py-3 px-4 text-slate-600 whitespace-nowrap">
														Angkatan {s.cohort} •{" "}
														<span className="font-semibold text-slate-800">
															{s.rombel}
														</span>
													</td>
													<td className="py-3 px-4 text-slate-600 whitespace-nowrap">
														{s.program}
													</td>
													<td className="py-3 px-4 text-center font-bold text-slate-800">
														{s.totalSesi}
													</td>
													<td className="py-3 px-4 text-center font-bold text-emerald-700">
														{s.totalTepatWaktu}
													</td>
													<td className="py-3 px-4 text-center font-bold text-amber-700">
														{s.totalTerlambat}
													</td>
													<td className="py-3 px-4 whitespace-nowrap">
														<div className="flex items-center gap-2">
															<Progress
																value={s.complianceRate}
																className="w-16 h-1.5 bg-slate-100"
															/>
															<span className="font-mono font-bold text-slate-900">
																{s.complianceRate}%
															</span>
														</div>
													</td>
													<td className="py-3 px-4 text-center whitespace-nowrap">
														<Badge
															className={cn(
																"text-[10px] font-bold border",
																badgeColor,
															)}
														>
															{statusLabel}
														</Badge>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</TabsContent>
			</Tabs>

			{/* DIALOG CREATE SESSION */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
							<ShieldCheck className="w-5 h-5 text-[#0517B0]" />
							Buat Sesi Baris Pagi Baru
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Atur sesi apel baris pagi mingguan dengan batas jam kedatangan
							baku 06.22 WIB.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Tanggal Sesi Apel</Label>
							<Input
								type="date"
								value={createForm.sessionDate}
								onChange={(e) =>
									setCreateForm((p) => ({ ...p, sessionDate: e.target.value }))
								}
								className="rounded-xl text-xs"
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Angkatan</Label>
								<Select
									value={createForm.cohort}
									onValueChange={(val) =>
										setCreateForm((p) => ({ ...p, cohort: val || "16" }))
									}
								>
									<SelectTrigger className="rounded-xl text-xs">
										<SelectValue placeholder="Pilih angkatan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="16">Angkatan 16</SelectItem>
										<SelectItem value="17">Angkatan 17</SelectItem>
										<SelectItem value="15">Angkatan 15</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Rombel Target</Label>
								<Select
									value={createForm.rombel}
									onValueChange={(val) =>
										setCreateForm((p) => ({ ...p, rombel: val || "Semua" }))
									}
								>
									<SelectTrigger className="rounded-xl text-xs">
										<SelectValue placeholder="Pilih rombel" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Semua">Semua Rombel</SelectItem>
										<SelectItem value="Kelas A">Kelas A</SelectItem>
										<SelectItem value="Kelas B">Kelas B</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">
									Standar Jam Datang
								</Label>
								<Input
									type="time"
									value={createForm.targetTime}
									onChange={(e) =>
										setCreateForm((p) => ({ ...p, targetTime: e.target.value }))
									}
									className="rounded-xl text-xs font-mono font-bold text-amber-900 bg-amber-50/50 border-amber-300"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Lokasi Apel</Label>
								<Input
									value={createForm.location}
									onChange={(e) =>
										setCreateForm((p) => ({ ...p, location: e.target.value }))
									}
									placeholder="Lapangan Utama"
									className="rounded-xl text-xs"
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Catatan / Agenda</Label>
							<Input
								value={createForm.notes}
								onChange={(e) =>
									setCreateForm((p) => ({ ...p, notes: e.target.value }))
								}
								placeholder="Misal: Apel kedisiplinan awal bulan..."
								className="rounded-xl text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setIsCreateOpen(false)}
							className="rounded-xl text-xs"
						>
							Batal
						</Button>
						<Button
							onClick={handleCreateSession}
							disabled={isCreating}
							className="bg-[#0517B0] hover:bg-blue-800 text-white rounded-xl text-xs font-semibold"
						>
							{isCreating ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
							) : null}
							Buat Sesi
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* DIALOG DELETE CONFIRM */}
			<Dialog
				open={!!sessionToDelete}
				onOpenChange={(open) => !open && setSessionToDelete(null)}
			>
				<DialogContent className="max-w-sm rounded-2xl">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<Trash2 className="w-5 h-5 text-rose-600" />
							Hapus Sesi Baris Pagi?
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Sesi tanggal{" "}
							<span className="font-semibold text-slate-800">
								{sessionToDelete?.sessionDate}
							</span>{" "}
							beserta seluruh data presensi mahasiswa di dalamnya akan dihapus.
							Agregat nilai kepatuhan mahasiswa akan disinkronkan kembali.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setSessionToDelete(null)}
							className="rounded-xl text-xs"
						>
							Batal
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteSession}
							disabled={isDeleting}
							className="rounded-xl text-xs font-semibold"
						>
							{isDeleting ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
							) : null}
							Hapus Sesi
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
