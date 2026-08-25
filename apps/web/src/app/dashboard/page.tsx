"use client";

import {
	Activity,
	AlertCircle,
	ArrowUpRight,
	BookOpen,
	Calendar,
	CheckCircle,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock,
	Download,
	Eye,
	FileCheck,
	FileText,
	GraduationCap,
	HeartHandshake,
	HelpCircle,
	Layers,
	LayoutDashboard,
	PhoneCall,
	Plane,
	RefreshCw,
	Search,
	ShieldAlert,
	ShieldCheck,
	TrendingUp,
	UserCheck,
	Users,
	Wallet,
	XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
} from "recharts";

import { NeumorphicStatCard } from "@/components/ui/NeumorphicStatCard";
import { PanelStatusBadge } from "@/components/ui/PanelStatusBadge";
import { calculateOverallStatus, normalizeStatus } from "@/utils/status";

const AkademikDashboard = dynamic(
	() =>
		import("@/components/dashboards/AkademikDashboard").then(
			(mod) => mod.AkademikDashboard,
		),
	{ ssr: false },
);
const CrmDashboard = dynamic(
	() =>
		import("@/components/dashboards/CrmDashboard").then(
			(mod) => mod.CrmDashboard,
		),
	{ ssr: false },
);
const DosenDashboard = dynamic(
	() =>
		import("@/components/dashboards/DosenDashboard").then(
			(mod) => mod.DosenDashboard,
		),
	{ ssr: false },
);
const EvaluatorDashboard = dynamic(
	() =>
		import("@/components/dashboards/EvaluatorDashboard").then(
			(mod) => mod.EvaluatorDashboard,
		),
	{ ssr: false },
);
const FinanceDashboard = dynamic(
	() =>
		import("@/components/dashboards/FinanceDashboard").then(
			(mod) => mod.FinanceDashboard,
		),
	{ ssr: false },
);
const MagangDashboard = dynamic(
	() =>
		import("@/components/dashboards/MagangDashboard").then(
			(mod) => mod.MagangDashboard,
		),
	{ ssr: false },
);
const PaDashboard = dynamic(
	() =>
		import("@/components/dashboards/PaDashboard").then(
			(mod) => mod.PaDashboard,
		),
	{ ssr: false },
);
const PmbDashboard = dynamic(
	() =>
		import("@/components/dashboards/PmbDashboard").then(
			(mod) => mod.PmbDashboard,
		),
	{ ssr: false },
);

import { SharedDashboardLoader } from "@/components/dashboards/SharedDashboardLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { type StudentListItem, useStudentsList } from "@/hooks/useStudentsList";
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { hasRole, useAuthStore } from "@/store";

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
	const router = useRouter();
	const { user, isAuthenticated, hasHydrated } = useAuthStore();

	const [page, setPage] = useState(1);
	const limit = 50;
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [isExporting, setIsExporting] = useState(false);

	// Reset page when filter changes
	useEffect(() => {
		setPage(1);
	}, [searchQuery, selectedCohort, selectedStatus]);

	// Server-Side Summary Aggregation (super fast SQL aggregation, cached)
	const {
		data: summary,
		isLoading: isSummaryLoading,
		refetch: refetchSummary,
	} = useDashboardSummary({ cohort: selectedCohort });

	// Server-Side Paginated Students Query
	const {
		data: studentsResult,
		isLoading: isStudentsLoading,
		isFetching,
		refetch: refetchStudents,
	} = useStudentsList({
		page,
		limit,
		cohort: selectedCohort,
		status: selectedStatus,
		search: searchQuery,
	});

	const students = studentsResult?.data || [];
	const meta = studentsResult?.meta || {
		page: 1,
		limit: 50,
		total: 0,
		totalPages: 1,
	};

	// Cohorts from summary or fallback
	const cohortYears = useMemo(() => {
		if (summary?.cohorts && summary.cohorts.length > 0) {
			return summary.cohorts;
		}
		return [16, 15, 14, 13, 12, 11, 10];
	}, [summary?.cohorts]);

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}

		if (user?.role === "dosen") {
			router.push("/dashboard/mata-kuliah");
		}
	}, [isAuthenticated, hasHydrated, router, user]);

	// Helper for checking module ACCs & 4-category status
	const getStudentAccDetails = (s: StudentListItem) => {
		const modules = [
			{
				key: "pmb",
				name: "PMB",
				isAcc: Boolean(s.pmb?.isAcc),
				status: normalizeStatus(s.pmb?.status, Boolean(s.pmb?.isAcc)),
			},
			{
				key: "crm",
				name: "CRM",
				isAcc: Boolean(s.crm?.isAcc),
				status: normalizeStatus(s.crm?.status, Boolean(s.crm?.isAcc)),
			},
			{
				key: "finance",
				name: "Finance",
				isAcc: Boolean(s.finance?.isAcc),
				status: normalizeStatus(s.finance?.status, Boolean(s.finance?.isAcc)),
			},
			{
				key: "academic",
				name: "Akademik",
				isAcc: Boolean(s.academic?.isAcc),
				status: normalizeStatus(s.academic?.status, Boolean(s.academic?.isAcc)),
			},
			{
				key: "pa",
				name: "PA",
				isAcc: Boolean(s.pa?.isAcc),
				status: normalizeStatus(s.pa?.status, Boolean(s.pa?.isAcc)),
			},
			{
				key: "internship",
				name: "Magang",
				isAcc: Boolean(s.internship?.isAcc),
				status: normalizeStatus(
					s.internship?.status,
					Boolean(s.internship?.isAcc),
				),
			},
		];

		const accCount = modules.filter((m) => m.isAcc).length;
		const overallStatus =
			s.student?.overallStatus ||
			calculateOverallStatus(modules.map((m) => m.status));

		return {
			modules,
			accCount,
			isAllAcc: accCount === 6,
			overallStatus,
		};
	};

	// Helper for calculating accurate overall real-time status
	const getRealtimeOverallStatus = (s: StudentListItem) => {
		return getStudentAccDetails(s).overallStatus;
	};

	// On-Demand Fast Export to CSV (fetches full list only on click)
	const handleExport = async () => {
		try {
			setIsExporting(true);
			const res = await api.students.get({
				$query: {
					all: "true",
					cohort: selectedCohort !== "all" ? selectedCohort : undefined,
					status: selectedStatus !== "all" ? selectedStatus : undefined,
					search: searchQuery.trim() || undefined,
				},
			});

			const fullData = (res.data?.data as unknown as StudentListItem[]) || [];
			if (fullData.length > 0) {
				const exportData = fullData.map((s) => {
					const { accCount } = getStudentAccDetails(s);
					return {
						NIM: s.student.nim || "-",
						"Nama Mahasiswa": s.student.name,
						"Program Studi": s.student.program,
						Angkatan: s.student.cohort,
						"Progress ACC": `${accCount}/6 Modul`,
						"Status PMB": s.pmb?.status || "-",
						"Status CRM": s.crm?.status || "-",
						"Status Finance": s.finance?.status || "-",
						"Status Akademik": s.academic?.status || "-",
						"Status PA": s.pa?.status || "-",
						"Status Magang": s.internship?.status || "-",
						"Status Keseluruhan": getRealtimeOverallStatus(s),
						"Keputusan Evaluator": s.decision?.evaluatorDecision || "menunggu",
						"Disetujui Direktur": s.decision?.isApprovedByDirector
							? "Ya"
							: "Belum",
						"Tgl Keberangkatan": s.decision?.departureDate
							? new Date(s.decision.departureDate).toLocaleDateString("id-ID")
							: "-",
					};
				});
				exportToCSV(
					exportData,
					`Dashboard_Nusadaya_${new Date().toISOString().split("T")[0]}`,
				);
			}
		} catch (err) {
			console.error("Export failed:", err);
		} finally {
			setIsExporting(false);
		}
	};

	if (!isAuthenticated || !user) {
		return null;
	}

	if (isSummaryLoading && isStudentsLoading) {
		return (
			<div className="flex flex-col justify-center items-center h-80 gap-3 text-slate-500">
				<RefreshCw className="w-8 h-8 animate-spin text-[#0517B0]" />
				<p className="text-sm font-semibold">
					Memuat data monitoring real-time...
				</p>
			</div>
		);
	}

	// Superadmin & Directors view the Master Executive Dashboard
	if (
		user?.role === "superadmin" ||
		user?.role === "director" ||
		user?.role === "direktur"
	) {
		// Proceed down to Superadmin Executive Dashboard
	} else if (user?.role === "dosen") {
		return <DosenDashboard user={user} />;
	} else if (user?.role === "pmb") {
		return <SharedDashboardLoader module="pmb" />;
	} else if (user?.role === "crm") {
		return <SharedDashboardLoader module="crm" />;
	} else if (user?.role === "akademik") {
		return <SharedDashboardLoader module="akademik" />;
	} else if (user?.role === "pa") {
		return <SharedDashboardLoader module="pa" />;
	} else if (user?.role === "magang") {
		return <SharedDashboardLoader module="magang" />;
	} else if (user?.role === "finance") {
		return <SharedDashboardLoader module="finance" />;
	} else if (user?.role === "evaluator") {
		return <SharedDashboardLoader module="evaluator" />;
	} else if (hasRole(user, "pmb")) {
		return <SharedDashboardLoader module="pmb" />;
	} else if (hasRole(user, "crm")) {
		return <SharedDashboardLoader module="crm" />;
	} else if (hasRole(user, "akademik")) {
		return <SharedDashboardLoader module="akademik" />;
	} else if (hasRole(user, "pa")) {
		return <SharedDashboardLoader module="pa" />;
	} else if (hasRole(user, "magang")) {
		return <SharedDashboardLoader module="magang" />;
	} else if (hasRole(user, "finance")) {
		return <SharedDashboardLoader module="finance" />;
	} else if (hasRole(user, "evaluator")) {
		return <SharedDashboardLoader module="evaluator" />;
	} else if (hasRole(user, "dosen")) {
		return <DosenDashboard user={user} />;
	}

	// Superadmin Guard: Non-superadmin should never reach the master dashboard
	if (!hasRole(user, "superadmin")) {
		return (
			<div className="p-12 text-center text-slate-500">
				<p className="text-base font-bold text-slate-700">
					Selamat datang di Nusadaya Academy
				</p>
				<p className="text-xs text-slate-400 mt-1">
					Silakan pilih menu panel di bilah samping navigasi.
				</p>
			</div>
		);
	}

	// ==========================================
	// SUPERADMIN DASHBOARD (DATA-DRIVEN FROM SERVER SUMMARY)
	// ==========================================
	const totalStudents = summary?.totalStudents || 0;
	const countAman = summary?.byStatus?.AMAN || 0;
	const countPerhatian = summary?.byStatus?.PERLU_PERHATIAN || 0;
	const countTidakAman = summary?.byStatus?.TIDAK_AMAN || 0;
	const countLayakBerangkat = summary?.evaluator?.layakBerangkat || 0;

	const pieData = [
		{ name: "Aman", value: countAman },
		{ name: "Perlu Perhatian", value: countPerhatian },
		{ name: "Tidak Aman", value: countTidakAman },
	];

	const divisionStats = [
		{
			key: "pmb",
			name: "PMB",
			href: "/dashboard/pmb",
			icon: FileText,
			color: "text-sky-600 bg-sky-50 border-sky-200",
			accCount: summary?.panels?.pmb?.acc || 0,
			rate: totalStudents
				? Math.round(((summary?.panels?.pmb?.acc || 0) / totalStudents) * 100)
				: 0,
		},
		{
			key: "crm",
			name: "CRM",
			href: "/dashboard/crm",
			icon: PhoneCall,
			color: "text-violet-600 bg-violet-50 border-violet-200",
			accCount: summary?.panels?.crm?.acc || 0,
			rate: totalStudents
				? Math.round(((summary?.panels?.crm?.acc || 0) / totalStudents) * 100)
				: 0,
		},
		{
			key: "finance",
			name: "Finance",
			href: "/dashboard/finance",
			icon: Wallet,
			color: "text-emerald-600 bg-emerald-50 border-emerald-200",
			accCount: summary?.panels?.finance?.acc || 0,
			rate: totalStudents
				? Math.round(
						((summary?.panels?.finance?.acc || 0) / totalStudents) * 100,
					)
				: 0,
		},
		{
			key: "academic",
			name: "Akademik",
			href: "/dashboard/akademik",
			icon: GraduationCap,
			color: "text-amber-600 bg-amber-50 border-amber-200",
			accCount: summary?.panels?.academic?.acc || 0,
			rate: totalStudents
				? Math.round(
						((summary?.panels?.academic?.acc || 0) / totalStudents) * 100,
					)
				: 0,
		},
		{
			key: "pa",
			name: "PA",
			href: "/dashboard/pa",
			icon: HeartHandshake,
			color: "text-teal-600 bg-teal-50 border-teal-200",
			accCount: summary?.panels?.pa?.acc || 0,
			rate: totalStudents
				? Math.round(((summary?.panels?.pa?.acc || 0) / totalStudents) * 100)
				: 0,
		},
		{
			key: "internship",
			name: "Magang",
			href: "/dashboard/magang",
			icon: Plane,
			color: "text-cyan-600 bg-cyan-50 border-cyan-200",
			accCount: summary?.panels?.internship?.acc || 0,
			rate: totalStudents
				? Math.round(
						((summary?.panels?.internship?.acc || 0) / totalStudents) * 100,
					)
				: 0,
		},
	];

	return (
		<div className="space-y-6 pb-12">
			{/* Top Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-100">
							<LayoutDashboard className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								Dashboard Super Admin
							</h1>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								Pusat komando & monitoring seluruh progres mahasiswa secara
								real-time antar divisi.
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<Button
						size="sm"
						onClick={handleExport}
						disabled={isExporting}
						className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 h-9"
					>
						{isExporting ? (
							<RefreshCw className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Download className="w-3.5 h-3.5" />
						)}
						{isExporting ? "Mengekspor..." : "Export Data"}
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
				<NeumorphicStatCard
					label="Total Mahasiswa"
					value={totalStudents}
					icon={<Users className="h-5 w-5" />}
					color="blue"
				/>
				<NeumorphicStatCard
					label="PMB Ter-ACC"
					value={summary?.panels?.pmb?.acc || 0}
					icon={<ShieldCheck className="h-5 w-5" />}
					color="emerald"
				/>
				<NeumorphicStatCard
					label="Status Aman"
					value={countAman}
					icon={<CheckCircle className="h-5 w-5" />}
					color="green"
				/>
				<NeumorphicStatCard
					label="Perlu Perhatian"
					value={countPerhatian}
					icon={<Clock className="h-5 w-5" />}
					color="amber"
				/>
				<NeumorphicStatCard
					label="Tidak Aman"
					value={countTidakAman}
					icon={<XCircle className="h-5 w-5" />}
					color="rose"
				/>
				<NeumorphicStatCard
					label="Layak Berangkat"
					value={countLayakBerangkat}
					icon={<Plane className="h-5 w-5" />}
					color="indigo"
				/>
			</div>

			{/* Middle Section: Visual Charts & Division Performance */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* 1. Donut Chart Distribusi Status */}
				<Card className="bg-white border-slate-200 shadow-sm col-span-1">
					<CardHeader className="border-b border-slate-100 pb-3">
						<CardTitle className="text-slate-800 text-base flex items-center justify-between">
							<span className="flex items-center gap-2">
								<Activity className="h-4 w-4 text-[#0517B0]" />
								Distribusi Status Mahasiswa
							</span>
							<Badge variant="outline" className="text-[11px] text-slate-500">
								{totalStudents} Mhs
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-4 flex flex-col items-center">
						<div className="h-56 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={pieData}
										innerRadius={55}
										outerRadius={75}
										paddingAngle={4}
										dataKey="value"
									>
										{pieData.map((entry, index) => (
											<Cell
												key={`cell-${entry.name}`}
												fill={PIE_COLORS[index % PIE_COLORS.length]}
											/>
										))}
									</Pie>
									<RechartsTooltip
										contentStyle={{
											backgroundColor: "#ffffff",
											borderColor: "#e2e8f0",
											color: "#0f172a",
											borderRadius: "8px",
											fontSize: "12px",
										}}
									/>
									<Legend
										verticalAlign="bottom"
										height={36}
										iconType="circle"
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>

						{/* Breakdown List */}
						<div className="grid grid-cols-3 w-full gap-2 pt-2 border-t border-slate-100 text-center">
							<div className="p-2 rounded bg-emerald-50/50">
								<span className="text-[11px] text-emerald-700 font-semibold block">
									Aman
								</span>
								<span className="text-sm font-black text-emerald-900">
									{countAman}
								</span>
							</div>
							<div className="p-2 rounded bg-amber-50/50">
								<span className="text-[11px] text-amber-700 font-semibold block">
									Perhatian
								</span>
								<span className="text-sm font-black text-amber-900">
									{countPerhatian}
								</span>
							</div>
							<div className="p-2 rounded bg-rose-50/50">
								<span className="text-[11px] text-rose-700 font-semibold block">
									Tidak Aman
								</span>
								<span className="text-sm font-black text-rose-900">
									{countTidakAman}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 2. Progres & Tingkat ACC 6 Divisi */}
				<Card className="bg-white border-slate-200 shadow-sm col-span-1 lg:col-span-2">
					<CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
						<CardTitle className="text-slate-800 text-base flex items-center gap-2">
							<TrendingUp className="h-4 w-4 text-[#0517B0]" />
							Tingkat Kelengkapan & ACC per Divisi
						</CardTitle>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => router.push("/dashboard/evaluator")}
							className="text-xs text-[#0517B0] hover:text-blue-800 hover:bg-blue-50 gap-1 h-7"
						>
							Buka Keputusan Final
							<ArrowUpRight className="w-3.5 h-3.5" />
						</Button>
					</CardHeader>
					<CardContent className="pt-4 space-y-3.5">
						{divisionStats.map((div) => {
							const Icon = div.icon;
							return (
								<div key={div.key} className="space-y-1.5">
									<div className="flex items-center justify-between text-xs">
										<div className="flex items-center gap-2">
											<div className={`p-1 rounded ${div.color}`}>
												<Icon className="w-3.5 h-3.5" />
											</div>
											<span className="font-bold text-slate-800">
												{div.name}
											</span>
											<span className="text-slate-400 font-normal">
												({div.accCount} dari {totalStudents} mahasiswa ACC)
											</span>
										</div>
										<span className="font-bold text-slate-700">
											{div.rate}%
										</span>
									</div>
									<Progress
										value={div.rate}
										className="h-2 bg-slate-100"
										indicatorClassName={
											div.rate >= 80
												? "bg-emerald-500"
												: div.rate >= 50
													? "bg-blue-500"
													: "bg-amber-500"
										}
									/>
								</div>
							);
						})}
					</CardContent>
				</Card>
			</div>

			{/* Bottom Section: Integrated Student Progress Table */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
							<Users className="w-4 h-4 text-[#0517B0]" />
							Tabel Monitoring Mahasiswa Real-Time
							{isFetching && (
								<RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400 ml-1" />
							)}
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Daftar seluruh mahasiswa dan status kelengkapan 6 divisi secara
							live. Menampilkan {students.length} dari {meta.total} mahasiswa.
						</p>
					</div>

					{/* Filters & Search */}
					<div className="flex flex-wrap items-center gap-2.5">
						<div className="relative w-full sm:w-56">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari NIM atau Nama..."
								className="pl-9 h-9 text-xs bg-white border-slate-200"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<Select
							value={selectedCohort}
							onValueChange={(val) => setSelectedCohort(val || "all")}
						>
							<SelectTrigger className="w-[125px] h-9 text-xs bg-white border-slate-200">
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

						<Select
							value={selectedStatus}
							onValueChange={(val) => setSelectedStatus(val || "all")}
						>
							<SelectTrigger className="w-[135px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Status Filter" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Status</SelectItem>
								<SelectItem value="aman">Aman</SelectItem>
								<SelectItem value="perhatian">Perlu Perhatian</SelectItem>
								<SelectItem value="tidak_aman">Tidak Aman</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-slate-50 sticky top-0 z-10">
								<TableRow className="border-slate-200">
									<TableHead className="py-3 font-bold text-slate-700 text-xs w-28">
										NIM
									</TableHead>
									<TableHead className="py-3 font-bold text-slate-700 text-xs">
										Nama & Program
									</TableHead>
									<TableHead className="py-3 font-bold text-slate-700 text-xs text-center w-36">
										Progress 6 Modul
									</TableHead>
									<TableHead className="py-3 font-bold text-slate-700 text-xs text-center w-48">
										Status Divisi (P C F A PA M)
									</TableHead>
									<TableHead className="py-3 font-bold text-slate-700 text-xs text-center w-28">
										Kondisi
									</TableHead>
									<TableHead className="py-3 font-bold text-slate-700 text-xs text-center w-36">
										Keputusan Final
									</TableHead>
									<TableHead className="py-3 font-bold text-slate-700 text-xs text-right pr-6 w-28">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{students.map((s) => {
									const { modules, accCount, isAllAcc } =
										getStudentAccDetails(s);
									const rtStatus = getRealtimeOverallStatus(s);

									return (
										<TableRow
											key={s.student.id}
											className="border-slate-100 hover:bg-blue-50/40 transition-colors"
										>
											<TableCell className="font-mono text-xs font-bold text-slate-700">
												{s.student.nim || "-"}
											</TableCell>
											<TableCell>
												<div className="font-bold text-slate-900 text-sm">
													{s.student.name}
												</div>
												<div className="flex items-center gap-2 mt-0.5">
													<Badge
														variant="outline"
														className="text-[10px] px-1.5 py-0 text-slate-500 border-slate-200"
													>
														Angkatan {s.student.cohort}
													</Badge>
													<span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
														{s.student.program}
													</span>
												</div>
											</TableCell>

											{/* Progress Bar with Tooltip */}
											<TableCell className="text-center">
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger className="w-full cursor-pointer">
															<div className="flex flex-col items-center gap-1">
																<div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 px-1">
																	<span>{accCount}/6 ACC</span>
																	<span
																		className={
																			isAllAcc
																				? "text-emerald-600"
																				: "text-slate-500"
																		}
																	>
																		{Math.round((accCount / 6) * 100)}%
																	</span>
																</div>
																<div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
																	<div
																		className={`h-full rounded-full transition-all duration-300 ${
																			isAllAcc
																				? "bg-emerald-500"
																				: accCount >= 4
																					? "bg-blue-500"
																					: "bg-amber-500"
																		}`}
																		style={{
																			width: `${(accCount / 6) * 100}%`,
																		}}
																	/>
																</div>
															</div>
														</TooltipTrigger>
														<TooltipContent className="w-64 p-3.5 bg-slate-950 text-white rounded-xl shadow-2xl border border-slate-800 text-xs flex flex-col space-y-2 z-50">
															<div className="flex items-center justify-between border-b border-slate-800 pb-1.5 w-full">
																<span className="font-bold text-slate-100 text-xs">
																	Rincian Status 6 Divisi:
																</span>
																<span className="text-[11px] font-mono text-emerald-400 font-bold">
																	{accCount}/6 ACC
																</span>
															</div>
															<div className="flex flex-col space-y-1.5 w-full">
																{modules.map((m) => (
																	<div
																		key={m.name}
																		className="flex items-center justify-between text-[11px] w-full"
																	>
																		<span className="text-slate-300 font-medium">
																			{m.name}
																		</span>
																		<PanelStatusBadge
																			status={m.status}
																			size="sm"
																			useShortLabel
																		/>
																	</div>
																))}
															</div>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>

											{/* Mini Module Indicators with 4-category colors */}
											<TableCell className="text-center">
												<div className="flex items-center justify-center gap-1">
													{modules.map((m) => (
														<TooltipProvider key={m.name}>
															<Tooltip>
																<TooltipTrigger>
																	<span
																		className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-black transition-transform hover:scale-110 ${
																			m.status === "ACC"
																				? "bg-emerald-100 text-emerald-800 border border-emerald-400"
																				: m.status === "AMAN"
																					? "bg-emerald-50 text-emerald-700 border border-emerald-300"
																					: m.status === "PROSES"
																						? "bg-amber-50 text-amber-800 border border-amber-300"
																						: "bg-rose-50 text-rose-800 border border-rose-300"
																		}`}
																	>
																		{m.name[0]}
																	</span>
																</TooltipTrigger>
																<TooltipContent className="text-xs p-2">
																	<p className="font-bold">
																		{m.name}:{" "}
																		{m.status === "ACC"
																			? "Disetujui (ACC)"
																			: m.status === "AMAN"
																				? "Aman"
																				: m.status === "PROSES"
																					? "Berproses"
																					: "Butuh Perhatian"}
																	</p>
																	<p className="text-[11px] text-slate-300">
																		{m.isAcc
																			? "✓ Sudah di-ACC"
																			: "Belum di-ACC"}
																	</p>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													))}
												</div>
											</TableCell>

											{/* Unified Condition Badge */}
											<TableCell className="text-center">
												<PanelStatusBadge status={rtStatus} />
											</TableCell>

											{/* Final Decision */}
											<TableCell className="text-center">
												{s.decision?.evaluatorDecision === "layak_berangkat" ? (
													<Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs">
														Layak
													</Badge>
												) : s.decision?.evaluatorDecision === "ttd_kontrak" ? (
													<Badge className="bg-blue-50 text-blue-700 border-blue-300 font-semibold text-xs">
														Kontrak
													</Badge>
												) : s.decision?.evaluatorDecision ===
													"lanjut_interview" ? (
													<Badge className="bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs">
														Interview
													</Badge>
												) : s.decision?.evaluatorDecision === "remedial" ? (
													<Badge className="bg-rose-50 text-rose-700 border-rose-300 font-semibold text-xs">
														Remedial
													</Badge>
												) : (
													<span className="text-xs text-slate-400 italic">
														Menunggu
													</span>
												)}
											</TableCell>

											{/* Action */}
											<TableCell className="text-right pr-6">
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														router.push(`/dashboard/students/${s.student.id}`)
													}
													className="h-8 text-xs font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 gap-1 px-2.5"
												>
													<Eye className="w-3.5 h-3.5" />
													Periksa
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>

						{students.length === 0 && (
							<div className="text-center py-12 text-slate-500">
								<HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
								<p className="text-sm font-semibold">
									Tidak ada data mahasiswa ditemukan.
								</p>
								<p className="text-xs text-slate-400 mt-0.5">
									Coba ubah kata kunci pencarian atau filter status yang
									digunakan.
								</p>
							</div>
						)}
					</div>

					{/* Pagination Footer */}
					{meta.total > 0 && (
						<div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
							<div className="text-xs text-slate-500 font-medium">
								Menampilkan{" "}
								<span className="font-bold text-slate-800">
									{(meta.page - 1) * meta.limit + 1}
								</span>{" "}
								-{" "}
								<span className="font-bold text-slate-800">
									{Math.min(meta.page * meta.limit, meta.total)}
								</span>{" "}
								dari{" "}
								<span className="font-bold text-slate-800">{meta.total}</span>{" "}
								mahasiswa
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={meta.page <= 1 || isStudentsLoading}
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									className="h-8 px-2.5 text-xs text-slate-700 gap-1"
								>
									<ChevronLeft className="w-3.5 h-3.5" />
									Sebelumnya
								</Button>

								<span className="text-xs font-semibold text-slate-700 px-2">
									Halaman {meta.page} dari {meta.totalPages}
								</span>

								<Button
									variant="outline"
									size="sm"
									disabled={meta.page >= meta.totalPages || isStudentsLoading}
									onClick={() =>
										setPage((p) => Math.min(meta.totalPages, p + 1))
									}
									className="h-8 px-2.5 text-xs text-slate-700 gap-1"
								>
									Selanjutnya
									<ChevronRight className="w-3.5 h-3.5" />
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
