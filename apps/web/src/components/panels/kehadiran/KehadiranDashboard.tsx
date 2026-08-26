"use client";

import {
	AlertCircle,
	Briefcase,
	CalendarDays,
	CheckCircle2,
	ChevronRight,
	ClipboardCheck,
	Download,
	GraduationCap,
	Loader2,
	RotateCcw,
	Search,
	Sparkles,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { api } from "@/lib/eden";
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

export function KehadiranDashboard() {
	const router = useRouter();
	const { user } = useAuthStore();
	const [students, setStudents] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [cohortFilter, setCohortFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [isExporting, setIsExporting] = useState(false);

	const fetchStudents = async () => {
		setIsLoading(true);
		try {
			const { data, error } = await api.students.get();
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

	useEffect(() => {
		fetchStudents();
	}, []);

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

	students.forEach((item: any) => {
		const courses = item.courseGrades || [];
		courses.forEach((c: any) => {
			totalMeetingsSum += c.totalMeetings || 16;
			totalPresentSum += c.attendancePresent || 0;
		});

		const acad = item.academic || {};
		totalPiketSessions += acad.attendancePiketTotal || 0;
		totalPiketPresent += acad.attendancePiketPresent || 0;
	});

	const avgAttendanceRate =
		totalMeetingsSum > 0
			? Math.round((totalPresentSum / totalMeetingsSum) * 100)
			: 0;

	const avgPiketRate =
		totalPiketSessions > 0
			? Math.round((totalPiketPresent / totalPiketSessions) * 100)
			: 0;

	const activeOdsCount = students.filter(
		(item: any) => (item.academic?.attendanceOdsTotal || 0) > 0,
	).length;

	const handleExport = async () => {
		setIsExporting(true);
		try {
			// Prepare data for Perkuliahan
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
						: 0;
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

			// Prepare data for Piket
			const dataPiket = filteredStudents.map((item: any) => {
				const s = item.student;
				const acad = item.academic || {};
				const rate =
					acad.attendancePiketTotal > 0
						? Math.round(
								(acad.attendancePiketPresent / acad.attendancePiketTotal) * 100,
							)
						: 0;
				return {
					NIM: s.nim || "-",
					Nama: s.name,
					Angkatan: `Angkatan ${s.cohort}`,
					"Total Sesi Piket": acad.attendancePiketTotal || 0,
					"Total Hadir Piket": acad.attendancePiketPresent || 0,
					"Persentase (%)": `${rate}%`,
				};
			});

			// Prepare data for ODS
			const dataOds = filteredStudents.map((item: any) => {
				const s = item.student;
				const acad = item.academic || {};
				const rate =
					acad.attendanceOdsTotal > 0
						? Math.round(
								(acad.attendanceOdsPresent / acad.attendanceOdsTotal) * 100,
							)
						: 0;
				return {
					NIM: s.nim || "-",
					Nama: s.name,
					Angkatan: `Angkatan ${s.cohort}`,
					"Total Sesi ODS": acad.attendanceOdsTotal || 0,
					"Total Hadir ODS": acad.attendanceOdsPresent || 0,
					"Persentase (%)": `${rate}%`,
				};
			});

			// Prepare data for Pra Magang
			const dataPraMagang = filteredStudents.map((item: any) => {
				const s = item.student;
				const acad = item.academic || {};
				const rate =
					acad.attendancePramagangTotal > 0
						? Math.round(
								(acad.attendancePramagangPresent /
									acad.attendancePramagangTotal) *
									100,
							)
						: 0;
				return {
					NIM: s.nim || "-",
					Nama: s.name,
					Angkatan: `Angkatan ${s.cohort}`,
					"Total Pertemuan Pra-Magang": acad.attendancePramagangTotal || 0,
					"Total Hadir Pra-Magang": acad.attendancePramagangPresent || 0,
					"Persentase (%)": `${rate}%`,
				};
			});

			const XLSX = await import("xlsx");
			const wb = XLSX.utils.book_new();

			const wsPerkuliahan = XLSX.utils.json_to_sheet(dataPerkuliahan);
			const wsPiket = XLSX.utils.json_to_sheet(dataPiket);
			const wsOds = XLSX.utils.json_to_sheet(dataOds);
			const wsPraMagang = XLSX.utils.json_to_sheet(dataPraMagang);

			XLSX.utils.book_append_sheet(wb, wsPerkuliahan, "Presensi Kuliah");
			XLSX.utils.book_append_sheet(wb, wsPiket, "Piket Harian");
			XLSX.utils.book_append_sheet(wb, wsOds, "ODS");
			XLSX.utils.book_append_sheet(wb, wsPraMagang, "Pra-Magang");

			const fileName = `Rekap_Kehadiran_${cohortFilter === "all" ? "Semua_Angkatan" : `Angkatan_${cohortFilter}`}_${new Date().toISOString().split("T")[0]}.xlsx`;
			XLSX.writeFile(wb, fileName);
			toast.success("Data rekap kehadiran berhasil diekspor");
		} catch (e) {
			toast.error("Gagal mengekspor file Excel");
		} finally {
			setIsExporting(false);
		}
	};

	const hasActiveFilter = cohortFilter !== "all" || searchQuery !== "";

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-12">
			{/* Executive Header Card */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0517B0] to-blue-600 text-white flex items-center justify-center shadow-xs ring-4 ring-blue-50 shrink-0">
						<ClipboardCheck className="w-6 h-6" />
					</div>
					<div>
						<div className="flex items-center gap-2.5">
							<h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
								Manajemen Kehadiran
							</h1>
							<Badge
								variant="secondary"
								className="bg-blue-50 text-[#0517B0] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200/60"
							>
								Panel Akademik
							</Badge>
						</div>
						<p className="text-xs sm:text-sm text-slate-500 mt-1">
							Monitoring terpadu presensi perkuliahan, piket harian, ODS, dan
							pra-magang mahasiswa
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						disabled={filteredStudents.length === 0 || isExporting}
						className="h-9 px-3.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 font-semibold gap-2 transition-all shadow-2xs"
					>
						{isExporting ? (
							<Loader2 className="w-4 h-4 animate-spin text-[#0517B0]" />
						) : (
							<Download className="w-4 h-4 text-[#0517B0]" />
						)}
						<span>Export Excel</span>
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards Grid */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				{/* 1. Total Mahasiswa */}
				<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden hover:border-slate-300 transition-all">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<p className="text-xs text-slate-500 font-medium">
								Total Mahasiswa
							</p>
							<div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center">
								<Users className="w-4 h-4" />
							</div>
						</div>
						<p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-2">
							{totalStudents}{" "}
							<span className="text-xs font-semibold text-slate-400 font-normal">
								Mahasiswa
							</span>
						</p>
						<div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-medium">
							<Sparkles className="w-3 h-3 text-[#0517B0]" />
							<span>Tersebar di {availableCohorts.length || 1} Angkatan</span>
						</div>
					</CardContent>
				</Card>

				{/* 2. Rata-rata Kehadiran Kuliah */}
				<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden hover:border-slate-300 transition-all">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<p className="text-xs text-slate-500 font-medium">
								Rata-rata Presensi Kuliah
							</p>
							<div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
								<GraduationCap className="w-4 h-4" />
							</div>
						</div>
						<p className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-tight mt-2">
							{avgAttendanceRate > 0 ? `${avgAttendanceRate}%` : "100%"}
						</p>
						<div className="w-full mt-2">
							<Progress
								value={avgAttendanceRate > 0 ? avgAttendanceRate : 100}
								className="h-1.5 bg-emerald-100 [&>div]:bg-emerald-600"
							/>
						</div>
					</CardContent>
				</Card>

				{/* 3. Presensi Piket Harian */}
				<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden hover:border-slate-300 transition-all">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<p className="text-xs text-slate-500 font-medium">
								Presensi Piket Harian
							</p>
							<div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
								<CalendarDays className="w-4 h-4" />
							</div>
						</div>
						<p className="text-xl sm:text-2xl font-bold text-amber-700 tracking-tight mt-2">
							{avgPiketRate > 0 ? `${avgPiketRate}%` : "100%"}
						</p>
						<div className="w-full mt-2">
							<Progress
								value={avgPiketRate > 0 ? avgPiketRate : 100}
								className="h-1.5 bg-amber-100 [&>div]:bg-amber-600"
							/>
						</div>
					</CardContent>
				</Card>

				{/* 4. Sesi ODS & Pra-Magang */}
				<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden hover:border-slate-300 transition-all">
					<CardContent className="p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<p className="text-xs text-slate-500 font-medium">
								Aktif ODS & Magang
							</p>
							<div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
								<Briefcase className="w-4 h-4" />
							</div>
						</div>
						<p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-2">
							{activeOdsCount > 0 ? activeOdsCount : totalStudents}{" "}
							<span className="text-xs font-semibold text-slate-400 font-normal">
								Mahasiswa
							</span>
						</p>
						<div className="flex items-center gap-1.5 text-[11px] text-emerald-600 mt-2 font-medium">
							<CheckCircle2 className="w-3 h-3 text-emerald-500" />
							<span>Terintegrasi Panel CRM</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Data Table Card */}
			<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
				{/* Toolbar Header */}
				<div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<h2 className="text-sm sm:text-base font-bold text-slate-800">
							Daftar Mahasiswa
						</h2>
						<Badge
							variant="secondary"
							className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full"
						>
							{filteredStudents.length} Mahasiswa
						</Badge>
					</div>

					{/* Search and Filters */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
						{/* Cohort Selector */}
						<div className="w-full sm:w-44 shrink-0">
							<Select
								value={cohortFilter}
								onValueChange={(v) => setCohortFilter(v || "all")}
							>
								<SelectTrigger className="h-9 text-xs bg-slate-50/70 border-slate-200 font-medium">
									<SelectValue placeholder="Semua Angkatan" />
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
						</div>

						{/* Search Input */}
						<div className="relative flex-1 sm:w-64">
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

						{/* Reset Button */}
						{hasActiveFilter && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setCohortFilter("all");
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

				{/* Table Container */}
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
						<Loader2 className="w-7 h-7 animate-spin text-[#0517B0]" />
						<span className="text-xs font-medium text-slate-500">
							Memuat data kehadiran...
						</span>
					</div>
				) : filteredStudents.length === 0 ? (
					<div className="text-center py-16 px-4 text-slate-400">
						<Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
						<p className="text-sm font-bold text-slate-700">
							Tidak ada data mahasiswa ditemukan
						</p>
						<p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
							{hasActiveFilter
								? "Coba ubah kata kunci pencarian atau reset filter angkatan."
								: "Belum ada data mahasiswa yang terdaftar dalam sistem."}
						</p>
						{hasActiveFilter && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setCohortFilter("all");
									setSearchQuery("");
								}}
								className="mt-4 text-xs"
							>
								Reset Filter
							</Button>
						)}
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
		</div>
	);
}
