"use client";

import {
	Award,
	BookOpen,
	Calculator,
	CheckCircle,
	CheckCircle2,
	Clock,
	Download,
	Eye,
	FileCheck,
	FileSpreadsheet,
	GraduationCap,
	HelpCircle,
	MessageCircle,
	RotateCcw,
	Search,
	Send,
	ShieldAlert,
	ShieldCheck,
	User,
	UserCheck,
	Users,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SelfieAttendanceNotificationWidget } from "@/components/dashboards/SelfieAttendanceNotificationWidget";
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
import { NeumorphicStatCard } from "@/components/ui/NeumorphicStatCard";
import { PanelStatusBadge } from "@/components/ui/PanelStatusBadge";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getToken } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { normalizeStatus } from "@/utils/status";

function formatWhatsAppUrl(phone: string | null | undefined) {
	if (!phone) return null;
	const clean = phone.replace(/[^0-9]/g, "");
	if (!clean) return null;
	const formatted = clean.startsWith("0") ? `62${clean.slice(1)}` : clean;
	return `https://wa.me/${formatted}`;
}

export function AkademikDashboard({
	data = [],
	searchQuery,
	setSearchQuery,
	user,
	onUpdate,
}: any) {
	const router = useRouter();
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedRombel, setSelectedRombel] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [localSearch, setLocalSearch] = useState(searchQuery || "");
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 20;

	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	// AKD-06 Batch Operation Modals
	const [isBatchCalcOpen, setIsBatchCalcOpen] = useState(false);
	const [isCalculating, setIsCalculating] = useState(false);
	const [targetCalcCohort, setTargetCalcCohort] = useState<string>("14");
	const [targetCalcRombel, setTargetCalcRombel] = useState<string>("all");

	const [isBatchSyncMagangOpen, setIsBatchSyncMagangOpen] = useState(false);
	const [isSyncingMagang, setIsSyncingMagang] = useState(false);
	const [targetSyncCohort, setTargetSyncCohort] = useState<string>("14");

	const [isPddiktiExportOpen, setIsPddiktiExportOpen] = useState(false);
	const [pddiktiExportType, setPddiktiExportType] = useState<
		"krs" | "khs" | "kelulusan"
	>("khs");
	const [pddiktiCohort, setPddiktiCohort] = useState<string>("all");

	const handleRunBatchCalculation = async () => {
		setIsCalculating(true);
		try {
			const res = await fetch(`${API_URL}/academic/calculate-all-grades`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${getToken()}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					cohort: Number(targetCalcCohort),
					rombel: targetCalcRombel === "all" ? undefined : targetCalcRombel,
				}),
			});
			const json = await res.json();
			if (json.success) {
				toast.success(
					json.message || "Kalkulasi nilai otomatis massal selesai!",
				);
				setIsBatchCalcOpen(false);
				onUpdate?.();
			} else {
				toast.error(json.message || "Gagal menghitung nilai massal");
			}
		} catch {
			toast.error("Terjadi kesalahan jaringan saat menghitung nilai massal");
		} finally {
			setIsCalculating(false);
		}
	};

	const handleRunBatchSyncMagang = async () => {
		setIsSyncingMagang(true);
		try {
			const res = await fetch(`${API_URL}/academic/sync-all-to-magang`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${getToken()}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					cohort: Number(targetSyncCohort),
				}),
			});
			const json = await res.json();
			if (json.success) {
				toast.success(
					json.message || "Sinkronisasi KHS ke Modul Magang berhasil!",
				);
				setIsBatchSyncMagangOpen(false);
				onUpdate?.();
			} else {
				toast.error(json.message || "Gagal menyinkronkan ke Magang");
			}
		} catch {
			toast.error("Terjadi kesalahan jaringan saat sinkronisasi Magang");
		} finally {
			setIsSyncingMagang(false);
		}
	};

	const handleDownloadPddikti = () => {
		const cohortParam =
			pddiktiCohort === "all" ? "" : `&cohort=${pddiktiCohort}`;
		const url = `${API_URL}/academic/pddikti/export?type=${pddiktiExportType}${cohortParam}`;
		window.open(url, "_blank");
		setIsPddiktiExportOpen(false);
		toast.success("File CSV Feeder PDDIKTI sedang diunduh");
	};

	// Available cohorts dynamically derived strictly from student data
	const availableCohorts = useMemo(() => {
		const cohorts = new Set<string>();
		if (data && data.length > 0) {
			data.forEach((s: any) => {
				if (s.student?.cohort) cohorts.add(s.student.cohort.toString());
			});
		}
		return Array.from(cohorts).sort((a, b) => {
			const numA = Number(a);
			const numB = Number(b);
			if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numB - numA;
			return b.localeCompare(a);
		});
	}, [data]);

	// Available rombels dynamically derived strictly from student data
	const availableRombels = useMemo(() => {
		const rombels = new Set<string>();
		if (data && data.length > 0) {
			data.forEach((s: any) => {
				if (s.student?.rombel) {
					rombels.add(s.student.rombel.trim());
				}
			});
		}
		if (rombels.size === 0) {
			rombels.add("Kelas A");
			rombels.add("Kelas B");
		}
		return Array.from(rombels).sort();
	}, [data]);

	// Filter by cohort first for reactive KPI
	const cohortData = useMemo(() => {
		if (!data) return [];
		if (selectedCohort === "all") return data;
		return data.filter(
			(s: any) =>
				s.student?.cohort?.toString() === selectedCohort ||
				(Number(selectedCohort) >= 2000 &&
					s.student?.cohort === Number(selectedCohort) - 2010),
		);
	}, [data, selectedCohort]);

	// KPI Metrics based on cohortData
	const totalStudents = cohortData.length;
	const countAcc = cohortData.filter((s: any) => s.academic?.isAcc).length;
	const countAman = cohortData.filter(
		(s: any) =>
			normalizeStatus(s.academic?.status, s.academic?.isAcc) === "AMAN",
	).length;
	const countProses = cohortData.filter(
		(s: any) =>
			normalizeStatus(s.academic?.status, s.academic?.isAcc) === "PROSES",
	).length;
	const countPerhatian = cohortData.filter(
		(s: any) =>
			normalizeStatus(s.academic?.status, s.academic?.isAcc) ===
			"BUTUH_PERHATIAN",
	).length;
	const countAttendanceOk = cohortData.filter((s: any) => {
		const total = s.academic?.attendanceTotal || 0;
		const present = s.academic?.attendancePresent || 0;
		return total > 0 && present / total >= 0.8;
	}).length;

	// Filtered students for Table
	const filteredData = useMemo(() => {
		const q = (searchQuery || localSearch).toLowerCase();
		return cohortData.filter((s: any) => {
			const matchSearch =
				!q ||
				(s.student?.name || "").toLowerCase().includes(q) ||
				(s.student?.nim || "").toLowerCase().includes(q) ||
				(s.student?.program || "").toLowerCase().includes(q) ||
				(s.student?.subProgram || "").toLowerCase().includes(q) ||
				(s.student?.destinationCountry || "").toLowerCase().includes(q) ||
				(s.student?.phone || "").toLowerCase().includes(q) ||
				(s.student?.rombel || "").toLowerCase().includes(q);

			const academicStatus = normalizeStatus(
				s.academic?.status,
				s.academic?.isAcc,
			);
			let matchStatus = true;
			if (selectedStatus === "acc") matchStatus = academicStatus === "ACC";
			if (selectedStatus === "aman") matchStatus = academicStatus === "AMAN";
			if (selectedStatus === "proses")
				matchStatus = academicStatus === "PROSES";
			if (selectedStatus === "butuh_perhatian")
				matchStatus = academicStatus === "BUTUH_PERHATIAN";

			const studentRombel = (s.student?.rombel || "Kelas A").trim();
			const matchRombel =
				selectedRombel === "all" ||
				studentRombel.toLowerCase() === selectedRombel.toLowerCase();

			return matchSearch && matchStatus && matchRombel;
		});
	}, [cohortData, localSearch, searchQuery, selectedStatus, selectedRombel]);

	// Reset page on filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedCohort, selectedRombel, selectedStatus, localSearch]);

	const paginatedData = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredData.slice(start, start + pageSize);
	}, [filteredData, currentPage]);

	const getAcademicChecklist = (s: any) => {
		const totalKehadiran = s.academic?.attendanceTotal || 0;
		const hadirKehadiran = s.academic?.attendancePresent || 0;
		const attendanceOk =
			totalKehadiran > 0 && hadirKehadiran / totalKehadiran >= 0.8;
		const attendancePct =
			totalKehadiran > 0
				? Math.round((hadirKehadiran / totalKehadiran) * 100)
				: 0;

		const items = [
			{ name: "Input PDDIKTI", done: Boolean(s.academic?.pddiktiInput) },
			{ name: "Lulus UTS", done: Boolean(s.academic?.utsPassed) },
			{ name: "Lulus UAS", done: Boolean(s.academic?.uasPassed) },
			{ name: "Indikator Sikap", done: Boolean(s.academic?.attitudeIndicator) },
			{
				name: "Tugas Kuliah Selesai",
				done: Boolean(s.academic?.assignmentsCompleted),
			},
			{
				name: "Komunikasi Akademik",
				done: Boolean(s.academic?.academicCommunication),
			},
			{
				name: "Asesmen Pra-keberangkatan",
				done: Boolean(s.academic?.assessmentCompleted),
			},
		];
		const completed = items.filter((i) => i.done).length;
		return {
			items,
			completed,
			total: items.length,
			isDone: completed === items.length,
			attendancePct,
			attendanceOk,
		};
	};

	const handleExport = () => {
		const exportData = filteredData.map((s: any) => {
			const checklist = getAcademicChecklist(s);
			return {
				NIM: s.student?.nim || "-",
				"Nama Mahasiswa": s.student?.name || "-",
				Angkatan: s.student?.cohort ? `Angkatan ${s.student.cohort}` : "-",
				Rombel: s.student?.rombel || "Kelas A",
				"Tahun Ajaran": s.student?.academicYear || s.student?.period || "-",
				Peminatan:
					s.student?.subProgram ||
					s.student?.destinationCountry ||
					s.student?.program ||
					"-",
				"No. WhatsApp": s.student?.phone || "-",
				"Progress Checklist": `${checklist.completed}/7 Item (${Math.round((checklist.completed / 7) * 100)}%)`,
				"Input PDDIKTI": s.academic?.pddiktiInput ? "Sudah" : "Belum",
				"Lulus UTS": s.academic?.utsPassed ? "Ya" : "Tidak",
				"Lulus UAS": s.academic?.uasPassed ? "Ya" : "Tidak",
				"Indikator Sikap": s.academic?.attitudeIndicator ? "Ya" : "Tidak",
				"Tugas Selesai": s.academic?.assignmentsCompleted ? "Ya" : "Tidak",
				"Komunikasi Akademik": s.academic?.academicCommunication
					? "Ya"
					: "Tidak",
				"Asesmen Pra-keberangkatan": s.academic?.assessmentCompleted
					? "Ya"
					: "Tidak",
				"Presensi (≥80%)": checklist.attendanceOk ? "Memenuhi" : "Belum",
				"Status Akademik": s.academic?.isAcc
					? "Sudah ACC"
					: s.academic?.status === "AMAN"
						? "Aman"
						: s.academic?.status === "PROSES"
							? "Berproses"
							: "Butuh Perhatian",
			};
		});
		exportToCSV(
			exportData,
			`Data_Akademik_${new Date().toISOString().split("T")[0]}`,
		);
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Top Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
							<GraduationCap className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								Dashboard Divisi Akademik
							</h1>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								Monitoring kelulusan UTS/UAS, presensi kehadiran (≥ 80%), input
								PDDIKTI, dan penilaian sikap mahasiswa.
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsBatchCalcOpen(true)}
						className="border-indigo-200 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100 text-xs gap-1.5 h-9 font-semibold shadow-2xs"
					>
						<Calculator className="w-3.5 h-3.5 text-indigo-600" />
						Kalkulasi Nilai Otomatis
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsBatchSyncMagangOpen(true)}
						className="border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 text-xs gap-1.5 h-9 font-semibold shadow-2xs"
					>
						<Send className="w-3.5 h-3.5 text-emerald-600" />
						Sync KHS ke Magang
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsPddiktiExportOpen(true)}
						className="border-blue-200 text-blue-700 bg-blue-50/60 hover:bg-blue-100 text-xs gap-1.5 h-9 font-semibold shadow-2xs"
					>
						<FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
						Feeder PDDIKTI
					</Button>
					<Link href="/dashboard/akademik/absensi-dosen">
						<Button
							variant="outline"
							size="sm"
							className="border-purple-200 text-purple-700 bg-purple-50/40 hover:bg-purple-100/70 text-xs gap-1.5 h-9 font-semibold"
						>
							<UserCheck className="w-3.5 h-3.5 text-purple-600" />
							Absensi Dosen
						</Button>
					</Link>
					{onUpdate && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onUpdate()}
							className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9"
						>
							<RotateCcw className="w-3.5 h-3.5" />
							Segarkan Data
						</Button>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9"
					>
						<Download className="w-3.5 h-3.5" />
						Export Data Akademik
					</Button>
				</div>
			</div>

			{/* Selfie Attendance Verification & Fraud Alerts */}
			<SelfieAttendanceNotificationWidget />

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
				<NeumorphicStatCard
					label="Total Mahasiswa"
					value={totalStudents}
					icon={<Users className="h-5 w-5" />}
					color="blue"
				/>
				<NeumorphicStatCard
					label="ACC Akademik"
					value={countAcc}
					icon={<ShieldCheck className="h-5 w-5" />}
					color="sky"
				/>
				<NeumorphicStatCard
					label="Status Aman"
					value={countAman}
					icon={<CheckCircle className="h-5 w-5" />}
					color="green"
				/>
				<NeumorphicStatCard
					label="Berproses"
					value={countProses}
					icon={<Clock className="h-5 w-5" />}
					color="amber"
				/>
				<NeumorphicStatCard
					label="Butuh Perhatian"
					value={countPerhatian}
					icon={<XCircle className="h-5 w-5" />}
					color="rose"
				/>
				<NeumorphicStatCard
					label="Absensi ≥ 80%"
					value={countAttendanceOk}
					icon={<BookOpen className="h-5 w-5" />}
					color="indigo"
				/>
			</div>

			{/* Main Monitoring Table */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
							<GraduationCap className="w-4 h-4 text-[#0517B0]" />
							Monitoring Progres Akademik Mahasiswa
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Menampilkan {filteredData.length} dari {totalStudents} mahasiswa
							terdaftar.
						</p>
					</div>

					{/* Search & Filter */}
					<div className="flex flex-wrap items-center gap-2.5">
						<div className="relative w-full sm:w-64">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari Nama, NIM, Peminatan, WA..."
								className="pl-9 h-9 text-xs bg-white border-slate-200"
								value={searchQuery !== undefined ? searchQuery : localSearch}
								onChange={(e) => {
									setLocalSearch(e.target.value);
									setSearchQuery?.(e.target.value);
								}}
							/>
						</div>

						<Select
							value={selectedCohort}
							onValueChange={(val) => setSelectedCohort(val || "all")}
						>
							<SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Semua Angkatan">
									{selectedCohort === "all"
										? "Semua Angkatan"
										: `Angkatan ${selectedCohort}`}
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

						<Select
							value={selectedRombel}
							onValueChange={(val) => setSelectedRombel(val || "all")}
						>
							<SelectTrigger className="w-[130px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Semua Rombel">
									{selectedRombel === "all" ? "Semua Rombel" : selectedRombel}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Rombel</SelectItem>
								{availableRombels.map((rombel) => (
									<SelectItem key={rombel} value={rombel}>
										{rombel}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={selectedStatus}
							onValueChange={(val) => setSelectedStatus(val || "all")}
						>
							<SelectTrigger className="w-[155px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Status Filter">
									{selectedStatus === "all"
										? "Semua Status"
										: selectedStatus === "acc"
											? "Sudah ACC"
											: selectedStatus === "aman"
												? "Aman"
												: selectedStatus === "proses"
													? "Berproses"
													: "Butuh Perhatian"}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Status</SelectItem>
								<SelectItem value="acc">Sudah ACC</SelectItem>
								<SelectItem value="aman">Aman</SelectItem>
								<SelectItem value="proses">Berproses</SelectItem>
								<SelectItem value="butuh_perhatian">Butuh Perhatian</SelectItem>
							</SelectContent>
						</Select>

						{/* Reset Button Inline */}
						{((searchQuery !== undefined ? searchQuery : localSearch).trim() !==
							"" ||
							selectedCohort !== "all" ||
							selectedRombel !== "all" ||
							selectedStatus !== "all") && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setLocalSearch("");
									setSearchQuery?.("");
									setSelectedCohort("all");
									setSelectedRombel("all");
									setSelectedStatus("all");
								}}
								className="h-9 px-3 text-xs border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5 font-medium transition-colors"
							>
								<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
								Reset
							</Button>
						)}
					</div>
				</CardHeader>

				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-slate-50 sticky top-0 z-10">
								<TableRow className="border-slate-200">
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs min-w-[180px]">
										Nama Mahasiswa & NIM
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-32">
										Angkatan & Rombel
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-32">
										Tahun Ajaran
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs min-w-[160px]">
										Peminatan
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs min-w-[140px]">
										No. WhatsApp
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
										Progress (7)
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
										Status Akademik
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right pr-6 w-24">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedData.map((s: any) => {
									const { items, completed, total, isDone } =
										getAcademicChecklist(s);
									const waUrl = formatWhatsAppUrl(s.student?.phone);

									return (
										<TableRow
											key={s.student.id}
											className="border-slate-100 hover:bg-blue-50/40 transition-colors"
										>
											{/* Nama & NIM */}
											<TableCell>
												<div className="font-bold text-slate-900 text-sm">
													{s.student.name}
												</div>
												<div className="flex items-center gap-1.5 mt-0.5">
													<span className="font-mono text-xs font-semibold text-slate-500">
														{s.student.nim || "Belum ada NIM"}
													</span>
													{s.student.nickname && (
														<span className="text-[11px] text-slate-400">
															({s.student.nickname})
														</span>
													)}
												</div>
											</TableCell>

											{/* Angkatan & Rombel */}
											<TableCell className="text-center">
												<div className="flex flex-col items-center gap-1">
													<Badge
														variant="outline"
														className="text-xs font-bold text-slate-700 bg-slate-50 border-slate-200 px-2 py-0.5"
													>
														{s.student.cohort
															? `Angkatan ${s.student.cohort}`
															: "-"}
													</Badge>
													<Badge
														variant="secondary"
														className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0"
													>
														{s.student.rombel || "Kelas A"}
													</Badge>
												</div>
											</TableCell>

											{/* Tahun Ajaran */}
											<TableCell className="text-center font-medium text-xs text-slate-700">
												{s.student.academicYear ||
													(s.student.cohort &&
													!Number.isNaN(Number(s.student.cohort))
														? `${2010 + Number(s.student.cohort)}/${2011 + Number(s.student.cohort)}`
														: s.student.period || (
																<span className="text-slate-400 italic">-</span>
															))}
											</TableCell>

											{/* Peminatan with Country Flag */}
											<TableCell>
												<PeminatanBadge
													subProgram={s.student.subProgram}
													destinationCountry={s.student.destinationCountry}
													program={s.student.program}
												/>
											</TableCell>

											{/* No. WhatsApp */}
											<TableCell>
												{s.student?.phone ? (
													waUrl ? (
														<a
															href={waUrl}
															target="_blank"
															rel="noopener noreferrer"
															className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition-colors group"
															title="Chat WhatsApp"
														>
															<MessageCircle className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
															<span className="font-mono">
																{s.student.phone}
															</span>
														</a>
													) : (
														<span className="text-xs font-mono text-slate-700">
															{s.student.phone}
														</span>
													)
												) : (
													<span className="text-slate-400 text-xs italic">
														-
													</span>
												)}
											</TableCell>

											{/* Checklist Progress with Tooltip */}
											<TableCell className="text-center">
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger className="w-full">
															<div className="flex flex-col items-center gap-1">
																<div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 px-1">
																	<span>
																		{completed}/{total} Item
																	</span>
																	<span
																		className={
																			isDone
																				? "text-emerald-600"
																				: "text-slate-500"
																		}
																	>
																		{Math.round((completed / total) * 100)}%
																	</span>
																</div>
																<div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
																	<div
																		className={`h-full rounded-full transition-all duration-300 ${
																			isDone
																				? "bg-emerald-500"
																				: completed >= 3
																					? "bg-blue-500"
																					: "bg-amber-500"
																		}`}
																		style={{
																			width: `${(completed / total) * 100}%`,
																		}}
																	/>
																</div>
															</div>
														</TooltipTrigger>
														<TooltipContent className="w-64 p-3.5 bg-slate-950 text-white rounded-xl shadow-2xl border border-slate-800 text-xs flex flex-col space-y-2 z-50">
															<div className="flex items-center justify-between border-b border-slate-800 pb-1.5 w-full">
																<span className="font-bold text-slate-100 text-xs">
																	Indikator Akademik (7):
																</span>
																<span className="text-[11px] font-mono text-emerald-400 font-bold">
																	{completed}/{total} Selesai
																</span>
															</div>
															<div className="flex flex-col space-y-1.5 w-full">
																{items.map((it) => (
																	<div
																		key={it.name}
																		className="flex items-center justify-between text-[11px] w-full"
																	>
																		<span className="text-slate-300 font-medium truncate max-w-[150px]">
																			{it.name}
																		</span>
																		<span
																			className={`font-semibold ${
																				it.done
																					? "text-emerald-400"
																					: "text-slate-500"
																			}`}
																		>
																			{it.done ? "✓ Selesai" : "Belum"}
																		</span>
																	</div>
																))}
															</div>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>

											{/* Status Akademik */}
											<TableCell className="text-center">
												<PanelStatusBadge
													status={s.academic?.status}
													isAcc={s.academic?.isAcc}
													completed={completed}
													total={total}
													size="sm"
												/>
											</TableCell>

											{/* Action */}
											<TableCell className="text-right pr-6">
												<div className="flex items-center justify-end gap-1.5">
													<Link
														href={`/dashboard/students/${s.student.id}/profile`}
													>
														<Button
															size="sm"
															variant="outline"
															className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 gap-1 font-medium"
														>
															<User className="w-3.5 h-3.5 text-slate-500" />
															Lihat
														</Button>
													</Link>
													<Link
														href={`/dashboard/students/${s.student.id}?tab=akademik&subtab=nilai-khs`}
													>
														<Button
															size="sm"
															variant="outline"
															className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 gap-1 font-semibold"
															title="Buka Lembar Nilai & KHS (AKD-06)"
														>
															<Award className="w-3.5 h-3.5 text-amber-600" />
															KHS
														</Button>
													</Link>
													<Link
														href={`/dashboard/students/${s.student.id}?tab=akademik`}
													>
														<Button
															size="sm"
															variant="outline"
															className="h-8 text-xs border-blue-200 text-[#0517B0] hover:bg-blue-50 hover:border-blue-300 gap-1 font-bold shadow-2xs"
														>
															<Eye className="w-3.5 h-3.5" />
															Periksa
														</Button>
													</Link>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>

						{filteredData.length === 0 && (
							<div className="text-center py-12 text-slate-500">
								<HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
								<p className="text-sm font-semibold">
									Tidak ada data mahasiswa akademik ditemukan.
								</p>
								<p className="text-xs text-slate-400 mt-0.5">
									Coba ubah kata kunci pencarian atau filter yang digunakan.
								</p>
							</div>
						)}

						<TablePagination
							currentPage={currentPage}
							totalItems={filteredData.length}
							pageSize={pageSize}
							onPageChange={setCurrentPage}
							itemName="Mahasiswa Akademik"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Modal Batch Kalkulasi Nilai Otomatis (AKD-06) */}
			<Dialog open={isBatchCalcOpen} onOpenChange={setIsBatchCalcOpen}>
				<DialogContent className="max-w-md bg-white">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-slate-900">
							<Calculator className="w-5 h-5 text-indigo-600" />
							Kalkulasi Nilai Otomatis Massal (AKD-06)
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500 leading-relaxed">
							Sistem akan menghitung nilai akhir mahasiswa (Presensi 15%, Teori
							25%, Praktik 40%, UTS 10%, UAS 10%) untuk seluruh mata kuliah
							dalam angkatan/rombel yang dipilih, menghasilkan huruf mutu, SKS
							lulus, dan IPK/IPS berbobot secara otomatis.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">
								Pilih Angkatan Target:
							</label>
							<Select
								value={targetCalcCohort}
								onValueChange={(val) => setTargetCalcCohort(val || "14")}
							>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue placeholder="Pilih Angkatan" />
								</SelectTrigger>
								<SelectContent>
									{availableCohorts.map((cohort) => (
										<SelectItem key={cohort} value={cohort}>
											Angkatan {cohort}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">
								Filter Rombel / Kelas:
							</label>
							<Select
								value={targetCalcRombel}
								onValueChange={(val) => setTargetCalcRombel(val || "all")}
							>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue placeholder="Pilih Rombel" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										Semua Rombel (Seluruh Kelas)
									</SelectItem>
									{availableRombels.map((rombel) => (
										<SelectItem key={rombel} value={rombel}>
											{rombel}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900 space-y-1">
							<div className="font-semibold flex items-center gap-1.5">
								<CheckCircle2 className="w-4 h-4 text-indigo-600" />
								Otomatisasi BAAK Nusadaya:
							</div>
							<p className="text-[11px] text-indigo-700 leading-relaxed">
								Nilai akhir yang telah terkalkulasi akan memperbarui status
								indikator UTS, UAS, dan IPK mahasiswa di dashboard serta
								mempersiapkan KHS siap terbit.
							</p>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsBatchCalcOpen(false)}
							disabled={isCalculating}
						>
							Batal
						</Button>
						<Button
							size="sm"
							onClick={handleRunBatchCalculation}
							disabled={isCalculating}
							className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
						>
							{isCalculating ? (
								<>
									<Clock className="w-3.5 h-3.5 animate-spin" />
									Menghitung Nilai...
								</>
							) : (
								<>
									<Calculator className="w-3.5 h-3.5" />
									Mulai Kalkulasi Nilai
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Modal Batch Sinkronisasi ke Modul Magang (AKD-06 & Segmen 19) */}
			<Dialog
				open={isBatchSyncMagangOpen}
				onOpenChange={setIsBatchSyncMagangOpen}
			>
				<DialogContent className="max-w-md bg-white">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-slate-900">
							<Send className="w-5 h-5 text-emerald-600" />
							Sinkronisasi KHS ke Modul Magang
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500 leading-relaxed">
							Menghubungkan rekapitulasi KHS dan transkrip akademik mahasiswa
							yang telah tervalidasi ke modul Magang (Pra-Paspor: KHS, KRS, dan
							Transkrip Akademik). Mahasiswa tidak perlu mengunggah ulang
							dokumen KHS secara manual.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">
								Pilih Angkatan Mahasiswa:
							</label>
							<Select
								value={targetSyncCohort}
								onValueChange={(val) => setTargetSyncCohort(val || "14")}
							>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue placeholder="Pilih Angkatan" />
								</SelectTrigger>
								<SelectContent>
									{availableCohorts.map((cohort) => (
										<SelectItem key={cohort} value={cohort}>
											Angkatan {cohort}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-xs text-emerald-900 space-y-1">
							<div className="font-semibold flex items-center gap-1.5">
								<CheckCircle2 className="w-4 h-4 text-emerald-600" />
								Eliminasi Redundansi Dokumen (Segmen 19):
							</div>
							<p className="text-[11px] text-emerald-700 leading-relaxed">
								Sistem secara otomatis menandai checklist Pra-Paspor Magang
								untuk KHS, KRS, dan Transkrip serta melampirkan berkas resmi
								yang diterbitkan divisi Akademik.
							</p>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsBatchSyncMagangOpen(false)}
							disabled={isSyncingMagang}
						>
							Batal
						</Button>
						<Button
							size="sm"
							onClick={handleRunBatchSyncMagang}
							disabled={isSyncingMagang}
							className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
						>
							{isSyncingMagang ? (
								<>
									<Clock className="w-3.5 h-3.5 animate-spin" />
									Menyinkronkan...
								</>
							) : (
								<>
									<Send className="w-3.5 h-3.5" />
									Sinkronkan Seluruh Mahasiswa
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Modal Ekspor Feeder PDDIKTI (Segmen 14) */}
			<Dialog open={isPddiktiExportOpen} onOpenChange={setIsPddiktiExportOpen}>
				<DialogContent className="max-w-md bg-white">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-slate-900">
							<FileSpreadsheet className="w-5 h-5 text-blue-600" />
							Ekspor Feeder PDDIKTI (Standar Resmi)
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500 leading-relaxed">
							Unduh berkas CSV format Neo Feeder PDDIKTI untuk pelaporan berkala
							aktivitas perkuliahan mahasiswa Nusadaya Academy ke pangkalan data
							perguruan tinggi.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">
								Jenis Data Ekspor:
							</label>
							<Select
								value={pddiktiExportType}
								onValueChange={(val: any) => setPddiktiExportType(val)}
							>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue placeholder="Pilih Jenis Data" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="khs">
										KHS & Nilai Akhir Perkuliahan (Feeder KHS)
									</SelectItem>
									<SelectItem value="krs">
										KRS & Aktivitas Perkuliahan (Feeder KRS)
									</SelectItem>
									<SelectItem value="kelulusan">
										Rekap Kelulusan & IPK Akhir Mahasiswa
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-700">
								Filter Angkatan:
							</label>
							<Select
								value={pddiktiCohort}
								onValueChange={(val) => setPddiktiCohort(val || "all")}
							>
								<SelectTrigger className="h-9 text-xs">
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
						</div>

						<div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900 space-y-1">
							<div className="font-semibold flex items-center gap-1.5">
								<CheckCircle2 className="w-4 h-4 text-blue-600" />
								Format Standar Neo Feeder:
							</div>
							<p className="text-[11px] text-blue-700 leading-relaxed">
								Header kolom dan pemisah koma sesuai format import Neo Feeder
								PDDIKTI Kemendikbudristek RI.
							</p>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPddiktiExportOpen(false)}
						>
							Batal
						</Button>
						<Button
							size="sm"
							onClick={handleDownloadPddikti}
							className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
						>
							<Download className="w-3.5 h-3.5" />
							Unduh Berkas CSV
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
