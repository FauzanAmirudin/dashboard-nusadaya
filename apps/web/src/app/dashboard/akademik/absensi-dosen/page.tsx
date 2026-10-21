"use client";

import {
	BookOpen,
	Calendar,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock,
	Download,
	Eye,
	FileSpreadsheet,
	Filter,
	GraduationCap,
	Loader2,
	Search,
	ShieldCheck,
	UserCheck,
	Users,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL, getToken } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

type MeetingDetail = {
	meetingId: number;
	meetingNumber: number;
	meetingLabel: string;
	meetingDate: string;
	sessionType: string;
	teachingStatus: string;
	isTeamTeaching: boolean;
	partnerDosenName: string | null;
	teachingNotes: string | null;
};

type CourseSummary = {
	courseId: number;
	courseCode: string;
	courseName: string;
	sks: number;
	rombel: string;
	cohort: number;
	roleDiMatkul: "Utama" | "Pendamping";
	totalSesi: number;
	sesiTeori: number;
	sesiPraktik: number;
	sesiSolo: number;
	sesiTeamTeaching: number;
	sesiDetail: MeetingDetail[];
};

type DosenItem = {
	dosenId: number;
	fullName: string;
	username: string;
	email: string | null;
	totalSesiMengajar: number;
	sesiTeori: number;
	sesiPraktik: number;
	sesiSolo: number;
	sesiTeamTeaching: number;
	totalJamEstimasi: number;
	mataKuliah: CourseSummary[];
};

type RekapResponse = {
	success: boolean;
	period: {
		type: "bulanan" | "semester";
		label: string;
		startDate: string;
		endDate: string;
		month?: number;
		year?: number;
		semester?: number;
	};
	summary: {
		totalDosenDitugaskan?: number;
		totalDosenAktif: number;
		totalSesiTerlaksana: number;
		totalSesiTeamTeaching: number;
		rataRataSesiPerDosen: number;
	};
	dosenList: DosenItem[];
};

const MONTHS = [
	{ value: 1, label: "Januari" },
	{ value: 2, label: "Februari" },
	{ value: 3, label: "Maret" },
	{ value: 4, label: "April" },
	{ value: 5, label: "Mei" },
	{ value: 6, label: "Juni" },
	{ value: 7, label: "Juli" },
	{ value: 8, label: "Agustus" },
	{ value: 9, label: "September" },
	{ value: 10, label: "Oktober" },
	{ value: 11, label: "November" },
	{ value: 12, label: "Desember" },
];

export default function MonitoringAbsensiDosenPage() {
	const { user, hasHydrated } = useAuthStore();
	const now = new Date();

	const [periodMode, setPeriodMode] = useState<"bulanan" | "semester">(
		"bulanan",
	);
	const [selectedMonth, setSelectedMonth] = useState<number>(
		now.getMonth() + 1,
	);
	const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
	const [selectedSemester, setSelectedSemester] = useState<number>(
		now.getMonth() >= 7 ? 1 : 2,
	);
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedDosenFilter, setSelectedDosenFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const [isLoading, setIsLoading] = useState(false);
	const [rekapData, setRekapData] = useState<RekapResponse | null>(null);

	// Modal detail per dosen
	const [selectedDosenDetail, setSelectedDosenDetail] =
		useState<DosenItem | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [expandedCourseIds, setExpandedCourseIds] = useState<
		Record<number, boolean>
	>({});

	const toggleCourseExpand = (courseId: number) => {
		setExpandedCourseIds((prev) => ({
			...prev,
			[courseId]: !prev[courseId],
		}));
	};

	const fetchApi = async (url: string) => {
		const token = getToken();
		const headers: HeadersInit = { "Content-Type": "application/json" };
		if (token) headers["Authorization"] = `Bearer ${token}`;
		const res = await fetch(`${API_URL}${url}`, { headers });
		return res;
	};

	const fetchRekap = async () => {
		setIsLoading(true);
		try {
			let endpoint = "";
			const params = new URLSearchParams();

			if (periodMode === "bulanan") {
				endpoint = "/courses/rekap-dosen/bulanan";
				params.append("month", selectedMonth.toString());
				params.append("year", selectedYear.toString());
			} else {
				endpoint = "/courses/rekap-dosen/semester";
				params.append("semester", selectedSemester.toString());
				params.append("year", selectedYear.toString());
			}

			if (selectedCohort !== "all") {
				params.append("cohort", selectedCohort);
			}

			if (selectedDosenFilter !== "all") {
				params.append("dosenId", selectedDosenFilter);
			}

			const res = await fetchApi(`${endpoint}?${params.toString()}`);
			const json = await res.json();
			if (res.ok && json.success) {
				setRekapData(json);
			} else {
				toast.error(json.message || "Gagal memuat rekap absensi dosen");
			}
		} catch (err: any) {
			toast.error(err.message || "Terjadi kesalahan koneksi sistem");
		} finally {
			setIsLoading(false);
		}
	};

	// Initial data loading
	useEffect(() => {
		if (hasHydrated && user) {
			fetchRekap();
		}
	}, [
		hasHydrated,
		user,
		periodMode,
		selectedMonth,
		selectedYear,
		selectedSemester,
		selectedCohort,
		selectedDosenFilter,
	]);

	// Listen for attendance updates from other tabs
	useEffect(() => {
		const handleSync = () => {
			fetchRekap();
		};
		window.addEventListener("attendance-updated", handleSync);
		return () => {
			window.removeEventListener("attendance-updated", handleSync);
		};
	}, []);

	// Filter search by lecturer name or course name
	const filteredDosenList = useMemo(() => {
		if (!rekapData?.dosenList) return [];
		if (!searchQuery.trim()) return rekapData.dosenList;

		const q = searchQuery.toLowerCase().trim();
		return rekapData.dosenList.filter((d) => {
			const nameMatch = d.fullName?.toLowerCase().includes(q);
			const courseMatch = d.mataKuliah.some(
				(mk) =>
					mk.courseName.toLowerCase().includes(q) ||
					mk.courseCode.toLowerCase().includes(q),
			);
			return nameMatch || courseMatch;
		});
	}, [rekapData, searchQuery]);

	// Ekspor CSV honorarium & presensi
	const handleExportCSV = () => {
		if (
			!rekapData ||
			!rekapData.dosenList ||
			rekapData.dosenList.length === 0
		) {
			toast.error("Tidak ada data rekapitulasi untuk diekspor");
			return;
		}

		const exportRows: any[] = [];

		rekapData.dosenList.forEach((dosen) => {
			dosen.mataKuliah.forEach((mk) => {
				mk.sesiDetail.forEach((sesi) => {
					exportRows.push({
						"Nama Dosen": dosen.fullName,
						Username: dosen.username,
						Periode: rekapData.period.label,
						"Kode MK": mk.courseCode,
						"Mata Kuliah": mk.courseName,
						Rombel: mk.rombel,
						Angkatan: mk.cohort,
						SKS: mk.sks,
						"Peran Dosen": mk.roleDiMatkul,
						"Sesi Ke": sesi.meetingNumber,
						"Label Sesi": sesi.meetingLabel,
						"Tanggal Sesi": sesi.meetingDate || "-",
						"Jenis Sesi": sesi.sessionType
							? sesi.sessionType.toUpperCase()
							: "TEORI",
						"Format Mengajar": sesi.isTeamTeaching
							? "TEAM TEACHING"
							: "TUNGGAL",
						"Partner Mengajar": sesi.partnerDosenName || "-",
						"Status Sesi": sesi.teachingStatus
							? sesi.teachingStatus.toUpperCase()
							: "TERLAKSANA",
						"Catatan Jurnal": sesi.teachingNotes || "-",
					});
				});
			});
		});

		if (exportRows.length === 0) {
			toast.error("Tidak ada sesi perkuliahan pada periode ini");
			return;
		}

		const cleanFilename = `Rekap_Presensi_Dosen_${rekapData.period.label.replace(/\s+/g, "_")}`;
		exportToCSV(exportRows, cleanFilename);
		toast.success(
			`Berhasil mengekspor ${exportRows.length} baris data presensi dosen`,
		);
	};

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-12">
			{/* Top Header Navigation */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
				<div>
					<div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
						<Link
							href="/dashboard/akademik"
							className="hover:text-blue-600 transition flex items-center gap-1"
						>
							<GraduationCap className="w-3.5 h-3.5" /> Panel Akademik
						</Link>
						<span>/</span>
						<span className="font-semibold text-slate-800">Absensi Dosen</span>
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
						Monitoring & Kontrol Absensi Dosen
						<Badge className="bg-purple-100 text-purple-800 border-purple-300 font-bold px-2.5 py-0.5 text-xs shadow-2xs">
							<ShieldCheck className="w-3.5 h-3.5 mr-1 inline" /> Kontrol
							Akademik
						</Badge>
					</h1>
					<p className="text-sm text-slate-500 mt-1">
						Pemantauan beban mengajar dosen bulanan & semesteran, kontrol
						kehadiran mengajar, dan verifikasi Team Teaching.
					</p>
				</div>

				<div className="flex items-center gap-2.5 flex-wrap">
					<Button
						onClick={handleExportCSV}
						disabled={isLoading || !rekapData || filteredDosenList.length === 0}
						className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold"
					>
						<Download className="w-4 h-4 mr-1.5" /> Ekspor Honorarium (CSV)
					</Button>
				</div>
			</div>

			{/* Filter Section */}
			<Card className="border-slate-200 shadow-xs bg-white">
				<CardContent className="p-4 space-y-4">
					<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
						{/* Tabs Mode: Bulanan vs Semester */}
						<Tabs
							value={periodMode}
							onValueChange={(val: any) => setPeriodMode(val)}
							className="w-full lg:w-auto"
						>
							<TabsList className="bg-slate-100 p-1 border border-slate-200">
								<TabsTrigger
									value="bulanan"
									className="text-xs font-semibold px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-blue-700 shadow-2xs"
								>
									<Calendar className="w-3.5 h-3.5 mr-1.5 inline" /> Rekap
									Bulanan
								</TabsTrigger>
								<TabsTrigger
									value="semester"
									className="text-xs font-semibold px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-blue-700 shadow-2xs"
								>
									<GraduationCap className="w-3.5 h-3.5 mr-1.5 inline" /> Rekap
									Semester
								</TabsTrigger>
							</TabsList>
						</Tabs>

						{/* Quick Search */}
						<div className="relative w-full lg:w-72">
							<Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Cari nama dosen atau matkul..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 h-9 text-sm border-slate-300 bg-slate-50/50 focus:bg-white"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
						{/* Month Selector (if bulanan) */}
						{periodMode === "bulanan" && (
							<div className="space-y-1">
								<Label className="text-xs font-semibold text-slate-600">
									Pilih Bulan
								</Label>
								<Select
									value={selectedMonth.toString()}
									onValueChange={(val) => setSelectedMonth(Number(val))}
								>
									<SelectTrigger className="h-9 border-slate-300 bg-white text-sm">
										<SelectValue placeholder="Pilih Bulan">
											{MONTHS.find((m) => m.value === selectedMonth)?.label ||
												"Pilih Bulan"}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{MONTHS.map((m) => (
											<SelectItem key={m.value} value={m.value.toString()}>
												{m.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						{/* Semester Selector (if semester) */}
						{periodMode === "semester" && (
							<div className="space-y-1">
								<Label className="text-xs font-semibold text-slate-600">
									Pilih Semester
								</Label>
								<Select
									value={selectedSemester.toString()}
									onValueChange={(val) => setSelectedSemester(Number(val))}
								>
									<SelectTrigger className="h-9 border-slate-300 bg-white text-sm">
										<SelectValue placeholder="Pilih Semester">
											{selectedSemester === 1
												? "Semester Ganjil (Agu - Jan)"
												: "Semester Genap (Feb - Jul)"}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1">
											Semester Ganjil (Agu - Jan)
										</SelectItem>
										<SelectItem value="2">
											Semester Genap (Feb - Jul)
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}

						{/* Year Selector */}
						<div className="space-y-1">
							<Label className="text-xs font-semibold text-slate-600">
								Tahun
							</Label>
							<Select
								value={selectedYear.toString()}
								onValueChange={(val) => setSelectedYear(Number(val))}
							>
								<SelectTrigger className="h-9 border-slate-300 bg-white text-sm">
									<SelectValue placeholder="Pilih Tahun">
										{selectedYear}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{[2024, 2025, 2026, 2027].map((yr) => (
										<SelectItem key={yr} value={yr.toString()}>
											{yr}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Cohort / Angkatan Filter */}
						<div className="space-y-1">
							<Label className="text-xs font-semibold text-slate-600">
								Angkatan
							</Label>
							<Select
								value={selectedCohort}
								onValueChange={(val: any) => setSelectedCohort(val || "all")}
							>
								<SelectTrigger className="h-9 border-slate-300 bg-white text-sm">
									<SelectValue placeholder="Semua Angkatan">
										{selectedCohort === "all"
											? "Semua Angkatan"
											: `Angkatan ${selectedCohort}`}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan</SelectItem>
									<SelectItem value="2024">Angkatan 2024</SelectItem>
									<SelectItem value="2025">Angkatan 2025</SelectItem>
									<SelectItem value="2026">Angkatan 2026</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Filter Dosen */}
						<div className="space-y-1">
							<Label className="text-xs font-semibold text-slate-600">
								Filter Dosen
							</Label>
							<Select
								value={selectedDosenFilter}
								onValueChange={(val: any) =>
									setSelectedDosenFilter(val || "all")
								}
							>
								<SelectTrigger className="h-9 border-slate-300 bg-white text-sm">
									<SelectValue placeholder="Semua Dosen">
										{selectedDosenFilter === "all"
											? "Semua Dosen"
											: rekapData?.dosenList?.find(
													(d) => d.dosenId.toString() === selectedDosenFilter,
												)?.fullName || "Pilih Dosen"}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										Semua Dosen ({rekapData?.dosenList?.length || 0})
									</SelectItem>
									{rekapData?.dosenList?.map((d) => (
										<SelectItem key={d.dosenId} value={d.dosenId.toString()}>
											{d.fullName} ({d.totalSesiMengajar} Sesi)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="border-slate-200 bg-linear-to-br from-blue-50/60 to-white shadow-2xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
								Total Sesi Terlaksana
							</p>
							<p className="text-2xl font-black text-slate-900 mt-1">
								{rekapData?.summary.totalSesiTerlaksana ?? 0}
							</p>
							<p className="text-2xs text-blue-700 font-medium mt-0.5">
								Pertemuan Sesi 1–16
							</p>
						</div>
						<div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
							<CheckCircle2 className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-slate-200 bg-linear-to-br from-purple-50/60 to-white shadow-2xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
								Sesi Team Teaching
							</p>
							<p className="text-2xl font-black text-purple-900 mt-1">
								{rekapData?.summary.totalSesiTeamTeaching ?? 0}
							</p>
							<p className="text-2xs text-purple-700 font-medium mt-0.5">
								Kedua Dosen Mengajar Bersama
							</p>
						</div>
						<div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
							<Users className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-slate-200 bg-linear-to-br from-emerald-50/60 to-white shadow-2xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
								Total Dosen Ditugaskan
							</p>
							<p className="text-2xl font-black text-emerald-900 mt-1">
								{rekapData?.summary.totalDosenDitugaskan ??
									rekapData?.dosenList?.length ??
									0}
							</p>
							<p className="text-2xs text-emerald-700 font-medium mt-0.5">
								{rekapData?.summary.totalDosenAktif ?? 0} Aktif Mengajar di
								Periode Ini
							</p>
						</div>
						<div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
							<UserCheck className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-slate-200 bg-linear-to-br from-indigo-50/60 to-white shadow-2xs">
					<CardContent className="p-4 flex items-center justify-between">
						<div>
							<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
								Rata-Rata Beban
							</p>
							<p className="text-2xl font-black text-indigo-900 mt-1">
								{rekapData?.summary.rataRataSesiPerDosen ?? 0}
							</p>
							<p className="text-2xs text-indigo-700 font-medium mt-0.5">
								Sesi per Dosen
							</p>
						</div>
						<div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
							<Clock className="w-5 h-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabel Rekapitulasi Presensi & Honorarium */}
			<Card className="border-slate-200 shadow-xs bg-white">
				<CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
							<FileSpreadsheet className="w-4 h-4 text-purple-600" />
							Rincian Beban Mengajar & Kontrol Sesi Dosen
						</CardTitle>
						<CardDescription className="text-xs text-slate-500">
							Rekapitulasi beban mengajar per dosen dengan pemisahan sesi Teori,
							Praktik, Tunggal, dan Team Teaching.
						</CardDescription>
					</div>
					<Badge
						variant="outline"
						className="text-xs border-slate-300 text-slate-600 font-medium"
					>
						Periode: {rekapData?.period.label || "-"}
					</Badge>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
							<Loader2 className="w-6 h-6 animate-spin text-blue-600" />
							<p className="text-xs">Memuat rekapitulasi data...</p>
						</div>
					) : filteredDosenList.length === 0 ? (
						<div className="p-12 text-center text-slate-400 text-sm">
							Tidak ada data mengajar dosen yang ditemukan pada periode ini.
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-slate-50/70 text-xs">
									<TableRow>
										<TableHead className="w-12 text-center font-bold">
											No
										</TableHead>
										<TableHead className="min-w-52 font-bold">
											Dosen Pengajar
										</TableHead>
										<TableHead className="text-center font-bold">
											Total Sesi
										</TableHead>
										<TableHead className="text-center font-bold">
											Teori
										</TableHead>
										<TableHead className="text-center font-bold">
											Praktik
										</TableHead>
										<TableHead className="text-center font-bold">
											Tunggal
										</TableHead>
										<TableHead className="text-center font-bold text-purple-800">
											Team Teaching
										</TableHead>
										<TableHead className="text-center font-bold">
											Estimasi Jam
										</TableHead>
										<TableHead className="w-24 text-right font-bold pr-4">
											Aksi
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody className="text-xs divide-y divide-slate-100">
									{filteredDosenList.map((dosen, idx) => (
										<TableRow
											key={dosen.dosenId}
											className="hover:bg-slate-50/60 transition-colors"
										>
											<TableCell className="text-center font-medium text-slate-500">
												{idx + 1}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<div>
														<div className="font-bold text-slate-800 text-sm">
															{dosen.fullName}
														</div>
														<div className="text-slate-400 text-2xs mt-0.5">
															@{dosen.username}
														</div>
													</div>
													{dosen.mataKuliah.length > 0 && (
														<Badge
															variant="outline"
															className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 font-medium shrink-0"
														>
															{dosen.mataKuliah.length} MK
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell className="text-center font-bold text-slate-800 text-sm">
												{dosen.totalSesiMengajar}
											</TableCell>
											<TableCell className="text-center font-medium text-slate-600">
												{dosen.sesiTeori}
											</TableCell>
											<TableCell className="text-center font-medium text-slate-600">
												{dosen.sesiPraktik}
											</TableCell>
											<TableCell className="text-center font-medium text-slate-600">
												{dosen.sesiSolo}
											</TableCell>
											<TableCell className="text-center font-bold text-purple-700 bg-purple-50/40">
												{dosen.sesiTeamTeaching > 0 ? (
													<Badge className="bg-purple-100 text-purple-900 border-purple-300 text-2xs font-bold">
														👥 {dosen.sesiTeamTeaching}
													</Badge>
												) : (
													"0"
												)}
											</TableCell>
											<TableCell className="text-center font-semibold text-slate-700">
												{dosen.totalJamEstimasi} Jam
											</TableCell>
											<TableCell className="text-right pr-4">
												<Button
													variant="outline"
													size="sm"
													className="h-7 text-xs border-slate-300 hover:bg-blue-50 hover:text-blue-700 font-semibold"
													onClick={() => {
														setSelectedDosenDetail(dosen);
														if (dosen.mataKuliah.length === 1) {
															setExpandedCourseIds({
																[dosen.mataKuliah[0].courseId]: true,
															});
														} else {
															setExpandedCourseIds({});
														}
														setIsDetailOpen(true);
													}}
												>
													<Eye className="w-3.5 h-3.5 mr-1 text-blue-600" />{" "}
													Detail
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Dialog Rincian Sesi Dosen */}
			<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
				<DialogContent className="w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden rounded-2xl shadow-2xl border border-slate-200 bg-white">
					{/* Fixed Header */}
					<div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0 pr-12">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
									<GraduationCap className="w-5 h-5" />
								</div>
								<div>
									<DialogTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
										Rincian Presensi: {selectedDosenDetail?.fullName}
									</DialogTitle>
									<DialogDescription className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
										<span>@{selectedDosenDetail?.username}</span>
										<span>•</span>
										<span>Periode {rekapData?.period.label}</span>
									</DialogDescription>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-xs px-2.5 py-1">
									{selectedDosenDetail?.totalSesiMengajar} Sesi Mengajar
								</Badge>
								<Badge
									variant="outline"
									className="text-slate-600 border-slate-200 font-semibold text-xs px-2.5 py-1"
								>
									{selectedDosenDetail?.totalJamEstimasi} Jam
								</Badge>
							</div>
						</div>
					</div>

					{/* Scrollable Content Body */}
					<div className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 space-y-6 bg-slate-50/60 max-h-[calc(90vh-130px)]">
						{/* Ringkasan Beban Dosen */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
							<div className="space-y-0.5">
								<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
									Sesi Teori
								</span>
								<p className="font-extrabold text-slate-800 text-base">
									{selectedDosenDetail?.sesiTeori}{" "}
									<span className="text-xs font-normal text-slate-500">
										Pertemuan
									</span>
								</p>
							</div>
							<div className="space-y-0.5">
								<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
									Sesi Praktik
								</span>
								<p className="font-extrabold text-slate-800 text-base">
									{selectedDosenDetail?.sesiPraktik}{" "}
									<span className="text-xs font-normal text-slate-500">
										Pertemuan
									</span>
								</p>
							</div>
							<div className="space-y-0.5">
								<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
									Sesi Tunggal
								</span>
								<p className="font-extrabold text-slate-800 text-base">
									{selectedDosenDetail?.sesiSolo}{" "}
									<span className="text-xs font-normal text-slate-500">
										Pertemuan
									</span>
								</p>
							</div>
							<div className="space-y-0.5">
								<span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">
									Team Teaching
								</span>
								<p className="font-extrabold text-purple-700 text-base">
									{selectedDosenDetail?.sesiTeamTeaching}{" "}
									<span className="text-xs font-normal text-purple-500">
										Pertemuan
									</span>
								</p>
							</div>
						</div>

						{/* Section Header Mata Kuliah Diampu */}
						<div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
							<div>
								<h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
									<BookOpen className="w-4 h-4 text-blue-600" />
									Mata Kuliah yang Diampu (
									{selectedDosenDetail?.mataKuliah.length || 0})
								</h3>
								<p className="text-2xs text-slate-500 mt-0.5">
									Klik &quot;Lihat Rincian Sesi&quot; untuk memeriksa detail
									jurnal dan kehadiran per pertemuan.
								</p>
							</div>
							{selectedDosenDetail &&
								selectedDosenDetail.mataKuliah.length > 1 && (
									<Button
										variant="ghost"
										size="sm"
										className="h-7 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold"
										onClick={() => {
											const allExpanded = selectedDosenDetail.mataKuliah.every(
												(mk) => expandedCourseIds[mk.courseId],
											);
											const nextState: Record<number, boolean> = {};
											selectedDosenDetail.mataKuliah.forEach((mk) => {
												nextState[mk.courseId] = !allExpanded;
											});
											setExpandedCourseIds(nextState);
										}}
									>
										{selectedDosenDetail.mataKuliah.every(
											(mk) => expandedCourseIds[mk.courseId],
										)
											? "Tutup Semua Rincian"
											: "Buka Semua Rincian"}
									</Button>
								)}
						</div>

						{/* Breakdown Per Mata Kuliah */}
						{selectedDosenDetail?.mataKuliah.length === 0 ? (
							<div className="p-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200">
								Dosen ini belum memiliki penugasan mata kuliah aktif.
							</div>
						) : (
							selectedDosenDetail?.mataKuliah.map((mk) => {
								const isExpanded = Boolean(expandedCourseIds[mk.courseId]);
								return (
									<div
										key={mk.courseId}
										className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs transition-all"
									>
										{/* Header Mata Kuliah */}
										<div className="bg-slate-100/70 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
											<div className="flex items-center gap-2.5">
												<div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
													<BookOpen className="w-4 h-4" />
												</div>
												<div>
													<h4 className="font-bold text-sm text-slate-900">
														{mk.courseCode} - {mk.courseName}
													</h4>
													<p className="text-2xs text-slate-500 mt-0.5">
														{mk.rombel} • Angkatan {mk.cohort} • {mk.sks} SKS •
														Peran:{" "}
														<span className="font-bold text-slate-700">
															{mk.roleDiMatkul}
														</span>
													</p>
												</div>
											</div>

											<div className="flex items-center gap-2">
												<Badge
													className={`font-bold text-xs ${
														mk.totalSesi > 0
															? "bg-blue-100 text-blue-800 border-blue-200"
															: "bg-slate-100 text-slate-500 border-slate-200"
													}`}
												>
													{mk.totalSesi} Sesi Terlaksana
												</Badge>
												<Button
													variant="outline"
													size="sm"
													className="h-7 text-xs border-slate-300 bg-white hover:bg-blue-50 hover:text-blue-700 font-semibold gap-1 shadow-2xs"
													onClick={() => toggleCourseExpand(mk.courseId)}
												>
													{isExpanded ? (
														<>
															<ChevronUp className="w-3.5 h-3.5" />
															Sembunyikan
														</>
													) : (
														<>
															<ChevronDown className="w-3.5 h-3.5 text-blue-600" />
															Lihat Rincian Sesi ({mk.sesiDetail.length})
														</>
													)}
												</Button>
											</div>
										</div>

										{/* Daftar Sesi Pertemuan (Collapsible) */}
										{isExpanded && (
											<div className="border-t border-slate-100 bg-slate-50/20 p-3">
												{mk.sesiDetail.length === 0 ? (
													<div className="p-6 text-center text-slate-400 text-xs bg-white rounded-lg border border-slate-200 italic">
														Belum ada sesi pertemuan perkuliahan yang terlaksana
														pada periode ini.
													</div>
												) : (
													<div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
														<Table className="w-full text-xs">
															<TableHeader className="bg-slate-50/80">
																<TableRow>
																	<TableHead className="w-14 text-center font-bold">
																		Sesi
																	</TableHead>
																	<TableHead className="min-w-36 font-bold">
																		Label Pertemuan
																	</TableHead>
																	<TableHead className="min-w-28 font-bold">
																		Tanggal
																	</TableHead>
																	<TableHead className="min-w-24 font-bold">
																		Jenis Sesi
																	</TableHead>
																	<TableHead className="min-w-36 font-bold">
																		Format
																	</TableHead>
																	<TableHead className="min-w-48 font-bold">
																		Jurnal / Catatan
																	</TableHead>
																</TableRow>
															</TableHeader>
															<TableBody className="divide-y divide-slate-100">
																{mk.sesiDetail.map((sesi) => (
																	<TableRow
																		key={sesi.meetingId}
																		className="hover:bg-slate-50/60"
																	>
																		<TableCell className="text-center font-bold text-slate-700">
																			P{sesi.meetingNumber}
																		</TableCell>
																		<TableCell className="font-semibold text-slate-800 max-w-[200px] break-words">
																			{sesi.meetingLabel}
																		</TableCell>
																		<TableCell className="text-slate-600 whitespace-nowrap">
																			{sesi.meetingDate
																				? new Date(
																						sesi.meetingDate,
																					).toLocaleDateString("id-ID", {
																						day: "numeric",
																						month: "short",
																						year: "numeric",
																					})
																				: "-"}
																		</TableCell>
																		<TableCell>
																			<Badge
																				variant="outline"
																				className={`capitalize text-2xs px-2 py-0.5 ${
																					sesi.sessionType === "praktik"
																						? "bg-amber-50 text-amber-800 border-amber-300"
																						: "bg-blue-50 text-blue-800 border-blue-300"
																				}`}
																			>
																				{sesi.sessionType || "teori"}
																			</Badge>
																		</TableCell>
																		<TableCell>
																			{sesi.isTeamTeaching ? (
																				<div className="space-y-0.5">
																					<Badge className="bg-purple-100 text-purple-900 border-purple-300 text-[10px] font-semibold">
																						<Users className="w-2.5 h-2.5 mr-1 inline" />{" "}
																						Team Teaching
																					</Badge>
																					{sesi.partnerDosenName && (
																						<p className="text-[10px] text-slate-500 leading-tight">
																							Bersama: {sesi.partnerDosenName}
																						</p>
																					)}
																				</div>
																			) : (
																				<Badge
																					variant="outline"
																					className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]"
																				>
																					Tunggal
																				</Badge>
																			)}
																		</TableCell>
																		<TableCell className="text-slate-600 text-xs max-w-xs break-words">
																			{sesi.teachingNotes || (
																				<span className="text-slate-300 italic">
																					-
																				</span>
																			)}
																		</TableCell>
																	</TableRow>
																))}
															</TableBody>
														</Table>
													</div>
												)}
											</div>
										)}
									</div>
								);
							})
						)}
					</div>

					{/* Fixed Footer */}
					<div className="px-6 py-3 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between">
						<p className="text-2xs text-slate-400">
							Data presensi mengajar terintegrasi dengan modul perkuliahan &
							honorarium.
						</p>
						<Button
							variant="outline"
							size="sm"
							className="h-8 px-4 text-xs font-semibold border-slate-300 hover:bg-slate-100"
							onClick={() => setIsDetailOpen(false)}
						>
							Tutup
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
