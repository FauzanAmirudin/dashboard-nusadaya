"use client";

import {
	Award,
	CalendarDays,
	Camera,
	ClipboardCheck,
	Clock,
	Download,
	GraduationCap,
	Loader2,
	MapPin,
	RotateCcw,
	Search,
	ShieldAlert,
	ShieldCheck,
	X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL, api, getToken } from "@/lib/eden";
import { TabAllServiceMatrix } from "./tabs/TabAllServiceMatrix";
import { TabCheckpointConfig } from "./tabs/TabCheckpointConfig";
import { TabFraudFlagsReview } from "./tabs/TabFraudFlagsReview";
import { TabKehadiranPiket } from "./tabs/TabKehadiranPiket";
import { TabKepatuhanBarisPagi } from "./tabs/TabKepatuhanBarisPagi";
import { TabPresensiKuliah } from "./tabs/TabPresensiKuliah";
import { TabSelfieLiveFeed } from "./tabs/TabSelfieLiveFeed";
import type { AllServiceStudentItem, KehadiranTabKey } from "./types";

interface KehadiranDashboardProps {
	defaultTab?: KehadiranTabKey;
}

export function KehadiranDashboard({
	defaultTab = "all-service",
}: KehadiranDashboardProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const tabQuery = searchParams.get("tab") as KehadiranTabKey | null;
	const allowedTabs = [
		"all-service",
		"selfie-feed",
		"kuliah",
		"piket",
		"baris-pagi",
		"fraud-review",
		"checkpoint-config",
	];
	const initialTab: KehadiranTabKey =
		tabQuery && (allowedTabs as any).includes(tabQuery) ? tabQuery : defaultTab;

	const [activeTab, setActiveTab] = useState<KehadiranTabKey>(initialTab);

	// Sync activeTab when URL query changes (e.g. browser back/forward or sidebar click)
	useEffect(() => {
		if (tabQuery && (allowedTabs as any).includes(tabQuery)) {
			setActiveTab(tabQuery);
		}
	}, [tabQuery]);

	const handleTabChange = (val: string) => {
		const newTab = val as KehadiranTabKey;
		setActiveTab(newTab);
		const current = new URLSearchParams(
			searchParams ? Array.from(searchParams.entries()) : [],
		);
		current.set("tab", newTab);
		const search = current.toString();
		const query = search ? `?${search}` : "";
		router.replace(`/dashboard/kehadiran${query}`, { scroll: false });
	};

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
		} catch {
			toast.error("Terjadi kesalahan sistem saat memuat data mahasiswa");
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
		} catch {
			toast.error("Gagal memuat matriks All-Service");
		} finally {
			setIsLoadingAllService(false);
		}
	};

	useEffect(() => {
		fetchStudents();
	}, [activeTab]);

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

	const filteredStudents = useMemo(() => {
		return students.filter((item: any) => {
			const s = item.student;
			if (!s) return false;
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
	}, [students, cohortFilter, rombelFilter, searchQuery]);

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
		} catch {
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

			{/* Main Content Tabs: 4 Dimension Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={handleTabChange}
				className="w-full space-y-5"
			>
				{/* Top Switcher & Filter Bar */}
				<div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
					<TabsList className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-wrap max-w-full h-auto gap-1">
						<TabsTrigger
							value="all-service"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold cursor-pointer gap-2 transition-all"
						>
							<Award className="w-4 h-4 text-amber-500 shrink-0" />
							<span className="truncate">Semua</span>
						</TabsTrigger>
						<TabsTrigger
							value="selfie-feed"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold cursor-pointer gap-2 transition-all"
						>
							<Camera className="w-4 h-4 text-blue-600 shrink-0" />
							<span className="truncate">Live Feed Selfie</span>
						</TabsTrigger>
						<TabsTrigger
							value="kuliah"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold cursor-pointer gap-2 transition-all"
						>
							<GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
							<span className="truncate">Kuliah</span>
						</TabsTrigger>
						<TabsTrigger
							value="piket"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold cursor-pointer gap-2 transition-all"
						>
							<CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
							<span className="truncate">Piket</span>
						</TabsTrigger>
						<TabsTrigger
							value="baris-pagi"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold cursor-pointer gap-2 transition-all"
						>
							<ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
							<span className="truncate">Baris Pagi</span>
						</TabsTrigger>
						<TabsTrigger
							value="fraud-review"
							className="data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-xs rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold cursor-pointer gap-2 transition-all"
						>
							<ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
							<span className="truncate">Audit Fraud</span>
						</TabsTrigger>
						<TabsTrigger
							value="checkpoint-config"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold cursor-pointer gap-2 transition-all"
						>
							<MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
							<span className="truncate">Checkpoint GPS</span>
						</TabsTrigger>
					</TabsList>

					{/* Filters (relevant when inspecting All-Service or Perkuliahan) */}
					{(activeTab === "all-service" || activeTab === "kuliah") && (
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl justify-end">
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

							<div className="relative flex-1 sm:w-56">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
								<Input
									placeholder="Cari nama, NIM..."
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
					)}
				</div>

				{/* TAB 1: MATRIKS ALL-SERVICE */}
				<TabsContent
					value="all-service"
					className="space-y-4 focus-visible:outline-hidden"
				>
					<TabAllServiceMatrix
						allServiceList={allServiceList}
						isLoading={isLoadingAllService}
					/>
				</TabsContent>

				{/* TAB 2: RINCIAN PERKULIAHAN */}
				<TabsContent
					value="kuliah"
					className="space-y-4 focus-visible:outline-hidden"
				>
					<TabPresensiKuliah
						students={filteredStudents}
						isLoading={isLoading}
					/>
				</TabsContent>

				{/* TAB 3: KEHADIRAN PIKET */}
				<TabsContent
					value="piket"
					className="space-y-4 focus-visible:outline-hidden"
				>
					<TabKehadiranPiket />
				</TabsContent>

				{/* TAB 4: KEPATUHAN BARIS PAGI */}
				<TabsContent
					value="baris-pagi"
					className="space-y-4 focus-visible:outline-hidden"
				>
					<TabKepatuhanBarisPagi />
				</TabsContent>

				{/* TAB 5: LIVE FEED SELFIE & MONITORING */}
				<TabsContent
					value="selfie-feed"
					className="space-y-4 focus-visible:outline-hidden"
				>
					<TabSelfieLiveFeed />
				</TabsContent>

				{/* TAB 6: FRAUD REVIEW */}
				<TabsContent
					value="fraud-review"
					className="space-y-4 focus-visible:outline-hidden"
				>
					<TabFraudFlagsReview />
				</TabsContent>

				{/* TAB 7: CHECKPOINT CONFIG */}
				<TabsContent
					value="checkpoint-config"
					className="space-y-4 focus-visible:outline-hidden"
				>
					<TabCheckpointConfig />
				</TabsContent>
			</Tabs>
		</div>
	);
}
