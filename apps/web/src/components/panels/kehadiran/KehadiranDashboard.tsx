"use client";

import {
	AlertCircle,
	AlertTriangle,
	Award,
	Briefcase,
	CalendarDays,
	CheckCircle2,
	ChevronRight,
	ClipboardCheck,
	Clock,
	Download,
	GraduationCap,
	Loader2,
	RotateCcw,
	Search,
	ShieldAlert,
	ShieldCheck,
	Sparkles,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import { Progress } from "@/components/ui/progress";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL, api, getToken } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

function getInitials(name: string): string {
	if (!name) return "M";
	const parts = name
		.replace(/^(Drs\.|Dr\.|Prof\.|Ir\.|H\.|Hj\.)\s+/i, "")
		.split(" ")
		.filter(Boolean);
	if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

interface AllServiceStudentItem {
	id: number;
	nim: string;
	name: string;
	cohort: number;
	rombel: string;
	program: string;
	subProgram: string;
	kuliah: {
		totalMeetings: number;
		presentCount: number;
		rate: number;
	};
	piket: {
		totalSessions: number;
		presentCount: number;
		rate: number;
	};
	barisPagi: {
		totalSessions: number;
		tepatWaktuCount: number;
		terlambatCount: number;
		rate: number;
	};
	allServiceScore: number;
	allServiceStatus: "DISIPLIN" | "PERLU_PEMBINAAN" | "KRITIS";
}

export function KehadiranDashboard() {
	const router = useRouter();
	const { user } = useAuthStore();
	const [activeTab, setActiveTab] = useState<"all-service" | "kuliah">(
		"all-service",
	);

	const [students, setStudents] = useState<any[]>([]);
	const [allServiceList, setAllServiceList] = useState<AllServiceStudentItem[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingAllService, setIsLoadingAllService] = useState(true);
	const [cohortFilter, setCohortFilter] = useState<string>("all");
	const [rombelFilter, setRombelFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [isExporting, setIsExporting] = useState(false);

	const fetchStudents = async () => {
		setIsLoading(true);
		try {
			const { data, error } = await api.students.get({
				$query: { all: "true" },
			});
			if (!error && data?.data) {
				setStudents(data.data);
			} else {
				toast.error("Gagal memuat daftar mahasiswa");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchAllServiceData = async () => {
		setIsLoadingAllService(true);
		try {
			const token = getToken();
			const params = new URLSearchParams();
			if (cohortFilter !== "all") params.append("cohort", cohortFilter);
			if (rombelFilter !== "all") params.append("rombel", rombelFilter);
			if (searchQuery) params.append("search", searchQuery);

			const res = await fetch(
				`${API_URL}/attendance/all-service/summary?${params.toString()}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			const json = await res.json();
			if (json.success) {
				setAllServiceList(json.data || []);
			}
		} catch (error) {
			toast.error("Gagal memuat matriks All-Service");
		} finally {
			setIsLoadingAllService(false);
		}
	};

	useEffect(() => {
		fetchStudents();
	}, []);

	useEffect(() => {
		fetchAllServiceData();
	}, [cohortFilter, rombelFilter, searchQuery]);

	// Dynamic Cohort List from student data
	const availableCohorts = Array.from(
		new Set(
			students
				.map((item: any) => item.student?.cohort)
				.filter((c: any) => typeof c === "number" && !isNaN(c)),
		),
	).sort((a: any, b: any) => b - a);

	const filteredStudents = students.filter((item: any) => {
		const s = item.student;
		if (cohortFilter !== "all" && s.cohort !== parseInt(cohortFilter, 10))
			return false;
		if (rombelFilter !== "all" && s.rombel !== rombelFilter) return false;
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			if (
				!s.name.toLowerCase().includes(query) &&
				!(s.nim && s.nim.toLowerCase().includes(query)) &&
				!(s.program && s.program.toLowerCase().includes(query)) &&
				!(s.subProgram && s.subProgram.toLowerCase().includes(query))
			) {
				return false;
			}
		}
		return true;
	});

	// Calculate High-level Metrics
	const totalStudents = students.length;

	let totalMeetingsSum = 0;
	let totalPresentSum = 0;
	let totalPiketSessions = 0;
	let totalPiketPresent = 0;
	let totalBarisSessions = 0;
	let totalBarisTepatWaktu = 0;

	students.forEach((item: any) => {
		const courses = item.courseGrades || [];
		courses.forEach((c: any) => {
			totalMeetingsSum += c.totalMeetings || 16;
			totalPresentSum += c.attendancePresent || 0;
		});

		const acad = item.academic || {};
		totalPiketSessions += acad.attendancePiketTotal || 0;
		totalPiketPresent += acad.attendancePiketPresent || 0;
		totalBarisSessions += acad.attendanceBarisTotal || 0;
		totalBarisTepatWaktu += acad.attendanceBarisPresent || 0;
	});

	const avgAttendanceRate =
		totalMeetingsSum > 0
			? Math.round((totalPresentSum / totalMeetingsSum) * 100)
			: 100;

	const avgPiketRate =
		totalPiketSessions > 0
			? Math.round((totalPiketPresent / totalPiketSessions) * 100)
			: 100;

	const avgBarisRate =
		totalBarisSessions > 0
			? Math.round((totalBarisTepatWaktu / totalBarisSessions) * 100)
			: 100;

	const activeOdsCount = students.filter(
		(item: any) => (item.academic?.attendanceOdsTotal || 0) > 0,
	).length;

	// Export Comprehensive All-Service Multi-Sheet Excel
	const handleExport = async () => {
		setIsExporting(true);
		try {
			// Sheet 1: Matriks All-Service Terpadu
			const dataAllService = allServiceList.map((item, idx) => ({
				No: idx + 1,
				NIM: item.nim,
				Nama: item.name,
				Angkatan: `Angkatan ${item.cohort}`,
				Rombel: item.rombel,
				Peminatan: item.subProgram || item.program,
				"Kuliah Hadir / Total": `${item.kuliah.presentCount} / ${item.kuliah.totalMeetings}`,
				"Kuliah Rate (%)": `${item.kuliah.rate}%`,
				"Piket Hadir / Total": `${item.piket.presentCount} / ${item.piket.totalSessions}`,
				"Piket Rate (%)": `${item.piket.rate}%`,
				"Baris Tepat Waktu (≤06.22) / Total": `${item.barisPagi.tepatWaktuCount} / ${item.barisPagi.totalSessions}`,
				"Baris Terlambat (>06.22)": item.barisPagi.terlambatCount,
				"Baris Rate (%)": `${item.barisPagi.rate}%`,
				"Indeks All-Service (50% Kuliah + 25% Piket + 25% Baris)": `${item.allServiceScore}%`,
				"Status Kedisiplinan": item.allServiceStatus,
			}));

			// Sheet 2: Presensi Kuliah
			const dataPerkuliahan = filteredStudents.map((item: any) => {
				const s = item.student;
				const courses = item.courseGrades || [];
				let totalPertemuan = 0;
				let totalHadir = 0;
				courses.forEach((c: any) => {
					totalPertemuan += c.totalMeetings || 16;
					totalHadir += c.attendancePresent || 0;
				});
				const rate =
					totalPertemuan > 0
						? Math.round((totalHadir / totalPertemuan) * 100)
						: 100;
				return {
					NIM: s.nim || "-",
					Nama: s.name,
					Peminatan: s.subProgram || s.program || "-",
					"Dosen PA": s.paName || "-",
					Angkatan: `Angkatan ${s.cohort}`,
					"Total Pertemuan": totalPertemuan,
					"Total Hadir": totalHadir,
					"Persentase (%)": `${rate}%`,
				};
			});

			// Sheet 3: Piket Harian
			const dataPiket = filteredStudents.map((item: any) => {
				const s = item.student;
				const acad = item.academic || {};
				const rate =
					acad.attendancePiketTotal > 0
						? Math.round(
								(acad.attendancePiketPresent / acad.attendancePiketTotal) * 100,
							)
						: 100;
				return {
					NIM: s.nim || "-",
					Nama: s.name,
					Angkatan: `Angkatan ${s.cohort}`,
					"Total Sesi Piket": acad.attendancePiketTotal || 0,
					"Total Hadir Piket": acad.attendancePiketPresent || 0,
					"Persentase (%)": `${rate}%`,
				};
			});

			// Sheet 4: Baris Pagi (06.22)
			const dataBarisPagi = filteredStudents.map((item: any) => {
				const s = item.student;
				const acad = item.academic || {};
				const total = acad.attendanceBarisTotal || 0;
				const tepat = acad.attendanceBarisPresent || 0;
				const late = acad.attendanceBarisLate || 0;
				const rate = total > 0 ? Math.round((tepat / total) * 100) : 100;
				return {
					NIM: s.nim || "-",
					Nama: s.name,
					Angkatan: `Angkatan ${s.cohort}`,
					"Total Sesi Baris Pagi": total,
					"Tepat Waktu (≤06.22)": tepat,
					"Terlambat (>06.22)": late,
					"Persentase Kepatuhan (%)": `${rate}%`,
				};
			});

			// Sheet 5: ODS & Pra-Magang
			const dataOds = filteredStudents.map((item: any) => {
				const s = item.student;
				const acad = item.academic || {};
				const rateOds =
					acad.attendanceOdsTotal > 0
						? Math.round(
								(acad.attendanceOdsPresent / acad.attendanceOdsTotal) * 100,
							)
						: 100;
				return {
					NIM: s.nim || "-",
					Nama: s.name,
					Angkatan: `Angkatan ${s.cohort}`,
					"Total Sesi ODS": acad.attendanceOdsTotal || 0,
					"Total Hadir ODS": acad.attendanceOdsPresent || 0,
					"Persentase ODS (%)": `${rateOds}%`,
				};
			});

			const XLSX = await import("xlsx");
			const wb = XLSX.utils.book_new();

			const wsAllService = XLSX.utils.json_to_sheet(dataAllService);
			const wsPerkuliahan = XLSX.utils.json_to_sheet(dataPerkuliahan);
			const wsPiket = XLSX.utils.json_to_sheet(dataPiket);
			const wsBaris = XLSX.utils.json_to_sheet(dataBarisPagi);
			const wsOds = XLSX.utils.json_to_sheet(dataOds);

			XLSX.utils.book_append_sheet(wb, wsAllService, "Matriks All-Service");
			XLSX.utils.book_append_sheet(wb, wsPerkuliahan, "Presensi Kuliah");
			XLSX.utils.book_append_sheet(wb, wsPiket, "Piket Harian");
			XLSX.utils.book_append_sheet(wb, wsBaris, "Baris Pagi (06.22)");
			XLSX.utils.book_append_sheet(wb, wsOds, "ODS & Pra-Magang");

			const fileName = `Rekap_All_Service_Kehadiran_${cohortFilter === "all" ? "Semua_Angkatan" : `Angkatan_${cohortFilter}`}_${new Date().toISOString().split("T")[0]}.xlsx`;
			XLSX.writeFile(wb, fileName);
			toast.success(
				"Laporan All-Service Kehadiran multi-sheet berhasil diekspor!",
			);
		} catch (e) {
			toast.error("Gagal mengekspor file Excel");
		} finally {
			setIsExporting(false);
		}
	};

	const hasActiveFilter =
		cohortFilter !== "all" || rombelFilter !== "all" || searchQuery !== "";

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-12">
			{/* Executive Header Card */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0517B0] to-blue-600 text-white flex items-center justify-center shadow-xs ring-4 ring-blue-50 shrink-0">
						<ClipboardCheck className="w-6 h-6" />
					</div>
					<div>
						<div className="flex items-center gap-2.5 flex-wrap">
							<h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
								Manajemen Kehadiran & All-Service
							</h1>
							<Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border border-amber-300 font-bold text-xs px-2.5 py-0.5 rounded-full">
								<Clock className="w-3.5 h-3.5 mr-1 text-amber-700" />
								Baris 06.22
							</Badge>
							<Badge
								variant="secondary"
								className="bg-blue-50 text-[#0517B0] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200/60"
							>
								Panel Akademik
							</Badge>
						</div>
						<p className="text-xs sm:text-sm text-slate-500 mt-1">
							Monitoring menyeluruh (All-Service) mencakup 3 pilar: Presensi
							Perkuliahan (50%), Piket Kebersihan (25%), dan Apel Baris Pagi
							06.22 (25%).
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						disabled={isExporting}
						className="h-9 px-3.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 font-semibold gap-2 transition-all shadow-2xs"
					>
						{isExporting ? (
							<Loader2 className="w-4 h-4 animate-spin text-[#0517B0]" />
						) : (
							<Download className="w-4 h-4 text-[#0517B0]" />
						)}
						<span>Export Excel (Multi-Sheet)</span>
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards Grid - 4 Pillars */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				{/* 1. Presensi Perkuliahan (50%) */}
				<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden hover:border-slate-300 transition-all">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<div>
								<span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
									Pilar 1 (Bobot 50%)
								</span>
								<p className="text-xs text-slate-500 font-medium mt-1">
									Presensi Kuliah
								</p>
							</div>
							<div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center">
								<GraduationCap className="w-4 h-4" />
							</div>
						</div>
						<p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-2">
							{avgAttendanceRate}%
						</p>
						<div className="w-full mt-2">
							<Progress
								value={avgAttendanceRate}
								className="h-1.5 bg-blue-100 [&>div]:bg-[#0517B0]"
							/>
						</div>
					</CardContent>
				</Card>

				{/* 2. Presensi Piket Kebersihan (25%) */}
				<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden hover:border-slate-300 transition-all">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<div>
								<span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
									Pilar 2 (Bobot 25%)
								</span>
								<p className="text-xs text-slate-500 font-medium mt-1">
									Piket Kebersihan
								</p>
							</div>
							<div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
								<CalendarDays className="w-4 h-4" />
							</div>
						</div>
						<p className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-tight mt-2">
							{avgPiketRate}%
						</p>
						<div className="w-full mt-2">
							<Progress
								value={avgPiketRate}
								className="h-1.5 bg-emerald-100 [&>div]:bg-emerald-600"
							/>
						</div>
					</CardContent>
				</Card>

				{/* 3. Kepatuhan Baris Pagi 06.22 (25%) */}
				<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden hover:border-slate-300 transition-all">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<div>
								<span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
									Pilar 3 (Bobot 25%)
								</span>
								<p className="text-xs text-slate-500 font-medium mt-1">
									Baris Pagi (06.22)
								</p>
							</div>
							<div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
								<ShieldCheck className="w-4 h-4" />
							</div>
						</div>
						<p className="text-xl sm:text-2xl font-bold text-amber-700 tracking-tight mt-2">
							{avgBarisRate}%
						</p>
						<div className="w-full mt-2">
							<Progress
								value={avgBarisRate}
								className="h-1.5 bg-amber-100 [&>div]:bg-amber-600"
							/>
						</div>
					</CardContent>
				</Card>

				{/* 4. Konsolidasi Mahasiswa Aktif */}
				<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden hover:border-slate-300 transition-all">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<div>
								<span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
									Institusi
								</span>
								<p className="text-xs text-slate-500 font-medium mt-1">
									Total Mahasiswa
								</p>
							</div>
							<div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
								<Users className="w-4 h-4" />
							</div>
						</div>
						<p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-2">
							{totalStudents}{" "}
							<span className="text-xs font-semibold text-slate-400 font-normal">
								Mahasiswa
							</span>
						</p>
						<div className="flex items-center gap-1.5 text-[11px] text-emerald-600 mt-2 font-medium">
							<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
							<span>Semua Peminatan Aktif</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Tabs: All-Service Matrix vs Perkuliahan */}
			<Tabs
				value={activeTab}
				onValueChange={(val) => setActiveTab(val as any)}
				className="w-full space-y-5"
			>
				{/* Top Switcher & Filter Bar */}
				<div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
					<TabsList className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 shadow-2xs grid grid-cols-2 max-w-sm h-auto">
						<TabsTrigger
							value="all-service"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold cursor-pointer gap-2"
						>
							<Award className="w-4 h-4 text-amber-500" />
							<span>Matriks All-Service</span>
						</TabsTrigger>
						<TabsTrigger
							value="kuliah"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold cursor-pointer gap-2"
						>
							<GraduationCap className="w-4 h-4" />
							<span>Rincian Perkuliahan</span>
						</TabsTrigger>
					</TabsList>

					{/* Filters */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-2xl justify-end">
						<Select
							value={cohortFilter}
							onValueChange={(v) => setCohortFilter(v || "all")}
						>
							<SelectTrigger className="h-9 text-xs bg-slate-50/70 border-slate-200 font-medium w-full sm:w-36">
								<SelectValue placeholder="Angkatan" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Angkatan</SelectItem>
								{availableCohorts.map((c: any) => (
									<SelectItem key={c} value={c.toString()}>
										Angkatan {c}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={rombelFilter}
							onValueChange={(v) => setRombelFilter(v || "all")}
						>
							<SelectTrigger className="h-9 text-xs bg-slate-50/70 border-slate-200 font-medium w-full sm:w-32">
								<SelectValue placeholder="Rombel" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Rombel</SelectItem>
								<SelectItem value="Kelas A">Kelas A</SelectItem>
								<SelectItem value="Kelas B">Kelas B</SelectItem>
							</SelectContent>
						</Select>

						<div className="relative flex-1 sm:w-60">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Cari nama, NIM, peminatan..."
								className="pl-8 pr-7 h-9 text-xs bg-slate-50/70 border-slate-200"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							)}
						</div>

						{hasActiveFilter && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setCohortFilter("all");
									setRombelFilter("all");
									setSearchQuery("");
								}}
								className="h-9 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium gap-1.5 shrink-0"
							>
								<RotateCcw className="w-3.5 h-3.5" />
								<span>Reset</span>
							</Button>
						)}
					</div>
				</div>

				{/* TAB 1: MATRIKS ALL-SERVICE (3 PILAR TERKONSOLIDASI) */}
				<TabsContent value="all-service" className="space-y-4">
					<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
						{isLoadingAllService ? (
							<div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
								<Loader2 className="w-7 h-7 animate-spin text-[#0517B0]" />
								<span className="text-xs font-medium text-slate-500">
									Menghitung indeks All-Service mahasiswa...
								</span>
							</div>
						) : allServiceList.length === 0 ? (
							<div className="text-center py-16 px-4 text-slate-400">
								<Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
								<p className="text-sm font-bold text-slate-700">
									Tidak ada data mahasiswa ditemukan
								</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-slate-50/75 hover:bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
											<TableHead className="pl-5 min-w-[200px]">
												Mahasiswa
											</TableHead>
											<TableHead className="min-w-[130px]">
												Angkatan & Rombel
											</TableHead>
											<TableHead className="min-w-[150px]">
												1. Kuliah (50%)
											</TableHead>
											<TableHead className="min-w-[150px]">
												2. Piket (25%)
											</TableHead>
											<TableHead className="min-w-[160px]">
												3. Baris 06.22 (25%)
											</TableHead>
											<TableHead className="min-w-[140px] text-center">
												Indeks All-Service
											</TableHead>
											<TableHead className="text-center pr-5 w-[110px]">
												Aksi
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{allServiceList.map((item) => {
											const initials = getInitials(item.name);
											let badgeColor =
												"bg-emerald-50 text-emerald-700 border-emerald-200";
											let statusLabel = "DISIPLIN";
											if (item.allServiceStatus === "PERLU_PEMBINAAN") {
												badgeColor =
													"bg-amber-50 text-amber-700 border-amber-200";
												statusLabel = "PEMBINAAN";
											} else if (item.allServiceStatus === "KRITIS") {
												badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
												statusLabel = "KRITIS";
											}

											return (
												<TableRow
													key={item.id}
													onClick={() =>
														router.push(
															`/dashboard/students/${item.id}?context=kehadiran`,
														)
													}
													className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
												>
													{/* Mahasiswa Info */}
													<TableCell className="pl-5 py-3.5">
														<div className="flex items-center gap-3">
															<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/60 text-[#0517B0] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
																{initials}
															</div>
															<div className="space-y-0.5 min-w-0">
																<p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#0517B0] transition-colors truncate">
																	{item.name}
																</p>
																<div className="flex items-center gap-1.5">
																	<span className="font-mono text-[11px] text-slate-500 font-medium">
																		{item.nim}
																	</span>
																	<span className="text-slate-300">•</span>
																	<span className="text-[11px] text-slate-500 truncate max-w-[120px]">
																		{item.subProgram || item.program}
																	</span>
																</div>
															</div>
														</div>
													</TableCell>

													{/* Angkatan & Rombel */}
													<TableCell className="py-3.5">
														<div className="space-y-0.5">
															<Badge
																variant="secondary"
																className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
															>
																Angkatan {item.cohort}
															</Badge>
															<div className="text-[11px] font-mono font-medium text-slate-600 pl-0.5">
																{item.rombel}
															</div>
														</div>
													</TableCell>

													{/* Pilar 1: Perkuliahan */}
													<TableCell className="py-3.5">
														<div className="space-y-1 max-w-[130px]">
															<div className="flex items-center justify-between text-[11px]">
																<span className="font-bold text-slate-800">
																	{item.kuliah.rate}%
																</span>
																<span className="text-slate-400 text-[10px]">
																	{item.kuliah.presentCount}/
																	{item.kuliah.totalMeetings} Sesi
																</span>
															</div>
															<Progress
																value={item.kuliah.rate}
																className="h-1.5 bg-slate-100 [&>div]:bg-[#0517B0]"
															/>
														</div>
													</TableCell>

													{/* Pilar 2: Piket */}
													<TableCell className="py-3.5">
														<div className="space-y-1 max-w-[130px]">
															<div className="flex items-center justify-between text-[11px]">
																<span className="font-bold text-emerald-700">
																	{item.piket.rate}%
																</span>
																<span className="text-slate-400 text-[10px]">
																	{item.piket.presentCount}/
																	{item.piket.totalSessions} Piket
																</span>
															</div>
															<Progress
																value={item.piket.rate}
																className="h-1.5 bg-slate-100 [&>div]:bg-emerald-600"
															/>
														</div>
													</TableCell>

													{/* Pilar 3: Baris Pagi (06.22) */}
													<TableCell className="py-3.5">
														<div className="space-y-1 max-w-[140px]">
															<div className="flex items-center justify-between text-[11px]">
																<span className="font-bold text-amber-700">
																	{item.barisPagi.rate}%
																</span>
																<span className="text-slate-400 text-[10px]">
																	{item.barisPagi.tepatWaktuCount}/
																	{item.barisPagi.totalSessions} Apel
																</span>
															</div>
															<Progress
																value={item.barisPagi.rate}
																className="h-1.5 bg-slate-100 [&>div]:bg-amber-600"
															/>
															{item.barisPagi.terlambatCount > 0 && (
																<div className="text-[10px] text-amber-700 font-medium">
																	Terlambat: {item.barisPagi.terlambatCount}x
																</div>
															)}
														</div>
													</TableCell>

													{/* Indeks All-Service */}
													<TableCell className="py-3.5 text-center">
														<div className="space-y-1">
															<span className="text-base font-black text-slate-900 tracking-tight">
																{item.allServiceScore}%
															</span>
															<div>
																<Badge
																	className={cn(
																		"text-[10px] font-bold border",
																		badgeColor,
																	)}
																>
																	{statusLabel}
																</Badge>
															</div>
														</div>
													</TableCell>

													{/* Action */}
													<TableCell className="pr-5 py-3.5 text-center">
														<Link
															href={`/dashboard/students/${item.id}?context=kehadiran`}
															onClick={(e) => e.stopPropagation()}
														>
															<Button
																size="sm"
																className="h-8 px-3 text-xs bg-slate-50 hover:bg-[#0517B0] text-slate-700 hover:text-white border border-slate-200 hover:border-[#0517B0] font-semibold gap-1 rounded-xl transition-all shadow-2xs group-hover:bg-[#0517B0] group-hover:text-white group-hover:border-[#0517B0]"
															>
																<span>Detail</span>
																<ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
															</Button>
														</Link>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						)}
					</Card>
				</TabsContent>

				{/* TAB 2: RINCIAN PERKULIAHAN */}
				<TabsContent value="kuliah" className="space-y-4">
					<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
						{isLoading ? (
							<div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
								<Loader2 className="w-7 h-7 animate-spin text-[#0517B0]" />
								<span className="text-xs font-medium text-slate-500">
									Memuat rincian perkuliahan...
								</span>
							</div>
						) : filteredStudents.length === 0 ? (
							<div className="text-center py-16 px-4 text-slate-400">
								<Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
								<p className="text-sm font-bold text-slate-700">
									Tidak ada data mahasiswa ditemukan
								</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-slate-50/75 hover:bg-slate-50/75 border-b border-slate-200">
											<TableHead className="text-xs font-semibold text-slate-700 pl-5 min-w-[200px]">
												Mahasiswa
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-700 min-w-[150px]">
												Peminatan
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-700 min-w-[140px]">
												Dosen (PA)
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-700 min-w-[160px]">
												Presensi Kuliah
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-700 min-w-[130px]">
												Angkatan / T.A.
											</TableHead>
											<TableHead className="text-xs font-semibold text-slate-700 text-center pr-5 w-[110px]">
												Aksi
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredStudents.map((item: any) => {
											const s = item.student;
											const currentYear = new Date().getFullYear();
											const ta = `${currentYear}/${currentYear + 1}`;
											const initials = getInitials(s.name);

											// Calculate student attendance
											const courses = item.courseGrades || [];
											let studentMeetings = 0;
											let studentPresent = 0;
											courses.forEach((c: any) => {
												studentMeetings += c.totalMeetings || 16;
												studentPresent += c.attendancePresent || 0;
											});
											const studentRate =
												studentMeetings > 0
													? Math.round((studentPresent / studentMeetings) * 100)
													: 100;

											const isGoodAttendance = studentRate >= 80;
											const isMediumAttendance =
												studentRate >= 60 && studentRate < 80;

											return (
												<TableRow
													key={s.id}
													onClick={() =>
														router.push(
															`/dashboard/students/${s.id}?context=kehadiran`,
														)
													}
													className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
												>
													{/* Mahasiswa Info */}
													<TableCell className="pl-5 py-3.5">
														<div className="flex items-center gap-3">
															<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/60 text-[#0517B0] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
																{initials}
															</div>
															<div className="space-y-0.5 min-w-0">
																<p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#0517B0] transition-colors truncate">
																	{s.name}
																</p>
																<div className="flex items-center gap-1.5">
																	{s.nim ? (
																		<span className="font-mono text-[11px] text-slate-500 font-medium">
																			{s.nim}
																		</span>
																	) : (
																		<span className="text-[11px] text-slate-400 italic">
																			NIM Belum Ada
																		</span>
																	)}
																</div>
															</div>
														</div>
													</TableCell>

													{/* Peminatan Badge */}
													<TableCell className="py-3.5">
														<PeminatanBadge
															peminatan={s.subProgram || s.program}
															variant="subtle"
															size="sm"
														/>
													</TableCell>

													{/* Dosen PA */}
													<TableCell className="py-3.5">
														{s.paName ? (
															<div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
																<UserCheck className="w-3.5 h-3.5 text-[#0517B0] shrink-0" />
																<span
																	className="truncate max-w-[130px]"
																	title={s.paName}
																>
																	{s.paName}
																</span>
															</div>
														) : (
															<span className="text-xs text-slate-400 italic">
																Belum Ditentukan
															</span>
														)}
													</TableCell>

													{/* Presensi Kuliah Progress */}
													<TableCell className="py-3.5">
														<div className="space-y-1.5 max-w-[140px]">
															<div className="flex items-center justify-between text-[11px]">
																<span
																	className={cn(
																		"font-bold",
																		isGoodAttendance
																			? "text-emerald-700"
																			: isMediumAttendance
																				? "text-amber-700"
																				: "text-rose-700",
																	)}
																>
																	{studentRate}%
																</span>
																<span className="text-slate-400">
																	{studentPresent}/{studentMeetings || 16} Hadir
																</span>
															</div>
															<Progress
																value={studentRate}
																className={cn(
																	"h-1.5 bg-slate-100",
																	isGoodAttendance
																		? "[&>div]:bg-emerald-500"
																		: isMediumAttendance
																			? "[&>div]:bg-amber-500"
																			: "[&>div]:bg-rose-500",
																)}
															/>
														</div>
													</TableCell>

													{/* Angkatan & Tahun Ajaran */}
													<TableCell className="py-3.5">
														<div className="space-y-1">
															<Badge
																variant="secondary"
																className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md"
															>
																Angkatan {s.cohort}
															</Badge>
															<p className="text-[10px] text-slate-400 font-medium pl-0.5">
																T.A. {ta}
															</p>
														</div>
													</TableCell>

													{/* CTA Aksi */}
													<TableCell className="pr-5 py-3.5 text-center">
														<Link
															href={`/dashboard/students/${s.id}?context=kehadiran`}
															onClick={(e) => e.stopPropagation()}
														>
															<Button
																size="sm"
																className="h-8 px-3 text-xs bg-slate-50 hover:bg-[#0517B0] text-slate-700 hover:text-white border border-slate-200 hover:border-[#0517B0] font-semibold gap-1 rounded-xl transition-all shadow-2xs group-hover:bg-[#0517B0] group-hover:text-white group-hover:border-[#0517B0]"
															>
																<span>Detail</span>
																<ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
															</Button>
														</Link>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						)}
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
