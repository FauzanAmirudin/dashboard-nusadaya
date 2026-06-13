"use client";

import {
	AlertTriangle,
	CheckCircle,
	ClipboardList,
	Clock,
	Download,
	LayoutDashboard,
	TrendingUp,
	Users,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
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
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

// Data types inferred from Eden API
type StudentData = {
	student: {
		id: number;
		nim: string;
		name: string;
		cohort: number;
		program: string;
		overallStatus: string | null;
	};
	pmb: { status: string | null } | null;
	crm: { status: string | null } | null;
	finance: { status: string | null } | null;
	academic: { status: string | null } | null;
	pa: { status: string | null } | null;
	internship: { status: string | null } | null;
	decision: { isApprovedByDirector: boolean | null } | null;
};

const STATUS_COLORS = {
	AMAN: {
		bg: "bg-emerald-500/10",
		text: "text-emerald-500",
		border: "border-emerald-500/20",
	},
	PERLU_PERHATIAN: {
		bg: "bg-amber-500/10",
		text: "text-amber-500",
		border: "border-amber-500/20",
	},
	TIDAK_AMAN: {
		bg: "bg-rose-500/10",
		text: "text-rose-500",
		border: "border-rose-500/20",
	},
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

import { PmbDashboard } from "@/components/dashboards/PmbDashboard";
import { CrmDashboard } from "@/components/dashboards/CrmDashboard";
import { AkademikDashboard } from "@/components/dashboards/AkademikDashboard";
import { DosenDashboard } from "@/components/dashboards/DosenDashboard";
import { PaDashboard } from "@/components/dashboards/PaDashboard";
import { MagangDashboard } from "@/components/dashboards/MagangDashboard";
import { FinanceDashboard } from "@/components/dashboards/FinanceDashboard";

export default function DashboardPage() {
	const router = useRouter();
	const { user, isAuthenticated, hasHydrated } = useAuthStore();
	const [data, setData] = useState<StudentData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}

		const fetchStudents = async () => {
			const { data: resData, error } = await api.students.get();
			if (!error && resData?.data) {
				setData(resData.data as unknown as StudentData[]);
			}
			setIsLoading(false);
		};

		fetchStudents();
	}, [isAuthenticated, hasHydrated, router, user]);

	if (!isAuthenticated || !user) {
		return null;
	}

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-full text-slate-400">
				Memuat data...
			</div>
		);
	}

	if (user?.role === "pmb") return <PmbDashboard data={data} searchQuery={searchQuery} setSearchQuery={setSearchQuery} user={user} />;
	if (user?.role === "crm") return <CrmDashboard data={data} searchQuery={searchQuery} setSearchQuery={setSearchQuery} user={user} />;
	if (user?.role === "akademik") return <AkademikDashboard data={data} searchQuery={searchQuery} setSearchQuery={setSearchQuery} user={user} />;
	if (user?.role === "dosen") return <DosenDashboard user={user!} />;
	if (user?.role === "pa") return <PaDashboard data={data} searchQuery={searchQuery} setSearchQuery={setSearchQuery} user={user} />;
	if (user?.role === "magang") return <MagangDashboard />;
	if (user?.role === "finance") return <FinanceDashboard data={data} searchQuery={searchQuery} setSearchQuery={setSearchQuery} user={user} />;

	// Calculate KPIs
	const totalStudents = data.length;
	const countAman = data.filter(
		(s) => s.student.overallStatus === "AMAN",
	).length;
	const countPerhatian = data.filter(
		(s) => s.student.overallStatus === "PERLU_PERHATIAN",
	).length;
	const countTidakAman = data.filter(
		(s) => s.student.overallStatus === "TIDAK_AMAN",
	).length;

	const pieData = [
		{ name: "Aman", value: countAman },
		{ name: "Perlu Perhatian", value: countPerhatian },
		{ name: "Tidak Aman", value: countTidakAman },
	];

	// Calculate Progress per division
	const calcProgress = (
		moduleName: keyof Omit<StudentData, "student" | "decision">,
	) => {
		if (totalStudents === 0) return 0;
		const amanCount = data.filter(
			(s) => s[moduleName]?.status === "AMAN",
		).length;
		return Math.round((amanCount / totalStudents) * 100);
	};

	const progresses = [
		{ name: "PMB", value: calcProgress("pmb") },
		{ name: "CRM", value: calcProgress("crm") },
		{ name: "Finance", value: calcProgress("finance") },
		{ name: "Akademik", value: calcProgress("academic") },
		{ name: "PA", value: calcProgress("pa") },
		{ name: "Magang", value: calcProgress("internship") },
	];

	const criticalAlerts = data.filter(
		(s) => s.student.overallStatus === "TIDAK_AMAN",
	);

	const filteredData = data.filter(
		(s) =>
			s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.student.nim.includes(searchQuery),
	);

	const renderStatusIcon = (status: string | null | undefined) => {
		if (status === "AMAN")
			return <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />;
		if (status === "TIDAK_AMAN")
			return <XCircle className="h-4 w-4 text-rose-500 mx-auto" />;
		return <Clock className="h-4 w-4 text-amber-500 mx-auto" />;
	};

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Selamat datang, {user.username}
					</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Sistem Pemantauan Mahasiswa Nusadaya Academy — Update:{" "}
						{new Date().toLocaleString("id-ID")}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Select defaultValue="semua">
						<SelectTrigger className="w-[180px] bg-white border-slate-200 text-slate-800">
							<SelectValue placeholder="Filter Angkatan" />
						</SelectTrigger>
						<SelectContent className="bg-white border-slate-200 text-slate-800">
							<SelectItem value="semua">Semua Angkatan</SelectItem>
							<SelectItem value="2024">Angkatan 2024</SelectItem>
							<SelectItem value="2023">Angkatan 2023</SelectItem>
						</SelectContent>
					</Select>
					<button
						type="button"
						className="flex items-center gap-2 bg-[#0517B0] hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
					>
						<Download className="h-4 w-4" />
						Export Data
					</button>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-[#0517B0]">
							<Users className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								Total Mahasiswa
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{totalStudents}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-emerald-500">
							<CheckCircle className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">🟢 Aman</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">{countAman}</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-amber-500">
							<Clock className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								🟡 Perlu Perhatian
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countPerhatian}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-rose-500">
							<XCircle className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								🔴 Tidak Aman
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countTidakAman}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Donut Chart */}
				<Card className="bg-white border-slate-200 shadow-sm col-span-1">
					<CardHeader>
						<CardTitle className="text-slate-800 flex items-center gap-2">
							<LayoutDashboard className="h-5 w-5 text-slate-500" />
							Distribusi Status
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-center">
						<div className="h-64 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={pieData}
										innerRadius={60}
										outerRadius={80}
										paddingAngle={5}
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
										}}
										itemStyle={{ color: "#0f172a" }}
									/>
									<Legend verticalAlign="bottom" height={36} />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				{/* Critical Alerts */}
				<Card className="bg-white border-slate-200 shadow-sm col-span-1">
					<CardHeader>
						<CardTitle className="text-slate-800 flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-rose-500" />
							Alert Kritis
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{criticalAlerts.length === 0 ? (
							<div className="text-center py-8 text-slate-500">
								<CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50 text-emerald-500" />
								<p>Tidak ada alert kritis saat ini.</p>
							</div>
						) : (
							criticalAlerts.map((s) => (
								<div
									key={s.student.id}
									className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 border border-rose-200"
								>
									<AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
									<div>
										<p className="text-slate-900 font-medium text-sm">
											{s.student.name}
										</p>
										<p className="text-slate-500 text-xs mt-0.5">
											Memiliki status Tidak Aman. Perlu tindakan segera.
										</p>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				{/* Progress Divisi */}
				<Card className="bg-white border-slate-200 shadow-sm col-span-1">
					<CardHeader>
						<CardTitle className="text-slate-800 flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-[#0517B0]" />
							Progress Divisi
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-5">
						{progresses.map((prog) => (
							<div key={prog.name} className="space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-slate-700 font-medium">
										{prog.name}
									</span>
									<span className="text-slate-500">{prog.value}%</span>
								</div>
								<Progress
									value={prog.value}
									className="h-2 bg-slate-100"
									indicatorClassName={
										prog.value < 50
											? "bg-rose-500"
											: prog.value < 80
												? "bg-amber-500"
												: "bg-emerald-500"
									}
								/>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
