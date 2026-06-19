"use client";

import {
	AlertTriangle,
	ArrowRight,
	Clock,
	Download,
	LayoutDashboard,
	PlaneTakeoff,
	Search,
	Users,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { useAuthStore } from "@/store";

const PIE_COLORS = ["#10b981", "#f59e0b", "#f43f5e"];

interface DashboardData {
	kpi: {
		totalStudents: number;
		readyToDepart: number;
		processing: number;
		actionNeeded: number;
	};
	students: Array<{
		id: number;
		nim: string;
		name: string;
		program: string;
		destinationCity: string;
		completedDocs: number;
		status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	}>;
}

export function MagangDashboard() {
	const router = useRouter();
	const { user } = useAuthStore();
	const [data, setData] = useState<DashboardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const fetchDashboard = async () => {
			setIsLoading(true);
			// Currently not implementing search on backend for simplicity in this iteration,
			// but we will filter on the frontend for now or just fetch all.
			// Let's assume frontend filtering for small data size.
			const { data: res, error } = await api.magang.dashboard.get();
			if (!error && res?.data) {
				setData(res.data as unknown as DashboardData);
			}
			setIsLoading(false);
		};

		fetchDashboard();
	}, []);

	const handleExport = async () => {
		const { data: resData } = await api.students.get();
		if (resData?.data) {
			const exportData = (resData.data as any[]).map((s: any) => ({
				NIM: s.student.nim,
				"Nama Mahasiswa": s.student.name,
				Paspor: s.internship?.passportReady ? "Selesai" : "Belum",
				Visa: s.internship?.visaReady ? "Selesai" : "Belum",
				MCU: s.internship?.mcuReady ? "Selesai" : "Belum",
				Tiket: s.internship?.ticketReady ? "Selesai" : "Belum",
				LoA: s.internship?.loaReady ? "Selesai" : "Belum",
				"Kontrak Kerja": s.internship?.contractReady ? "Selesai" : "Belum",
				Interview: s.internship?.interviewReady ? "Selesai" : "Belum",
				"Estimasi Keberangkatan": s.decision?.departureDate
					? new Date(s.decision.departureDate).toLocaleDateString()
					: "-",
				"Disetujui Admin Magang": s.internship?.isAcc ? "Sudah ACC" : "Belum",
			}));
			exportToCSV(
				exportData,
				`Data_Magang_${new Date().toISOString().split("T")[0]}`,
			);
		}
	};

	if (isLoading && !data) {
		return (
			<div className="flex justify-center items-center h-64 text-slate-500">
				Memuat dashboard Magang...
			</div>
		);
	}

	if (!data) return null;

	const renderStatusBadge = (status: string, label?: string) => {
		if (status === "AMAN") {
			return (
				<Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10">
					{label || "🟢 Aman"}
				</Badge>
			);
		}
		if (status === "TIDAK_AMAN") {
			return (
				<Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/10">
					{label || "🔴 Tdk Aman"}
				</Badge>
			);
		}
		return (
			<Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10">
				{label || "🟡 Perhatian"}
			</Badge>
		);
	};

	const filteredStudents = data.students.filter(
		(s) =>
			s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.nim.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const countAman = filteredStudents.filter((s) => s.status === "AMAN").length;
	const countPerhatian = filteredStudents.filter(
		(s) => s.status === "PERLU_PERHATIAN",
	).length;
	const countTidakAman = filteredStudents.filter(
		(s) => s.status === "TIDAK_AMAN",
	).length;

	const pieData = [
		{ name: "Aman", value: countAman },
		{ name: "Perlu Perhatian", value: countPerhatian },
		{ name: "Tidak Aman", value: countTidakAman },
	];

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Dashboard Tim Magang Internasional
					</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Selamat datang, {(user as any)?.fullName || user?.username}. Pantau
						progres dokumen keberangkatan mahasiswa.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleExport}
						className="flex items-center gap-2 bg-[#0517B0] hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
					>
						<Download className="h-4 w-4" />
						Export Data Magang
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
								{data.kpi.totalStudents}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-emerald-500">
							<PlaneTakeoff className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								Siap Berangkat (Aman)
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{data.kpi.readyToDepart}
							</p>
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
								Sedang Proses (Perhatian)
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{data.kpi.processing}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-rose-500">
							<AlertTriangle className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								Perlu Tindakan (Tdk Aman)
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{data.kpi.actionNeeded}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Donut Chart */}
				<Card className="bg-white border-slate-200 shadow-sm col-span-1 lg:col-span-1">
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
						<div className="mt-4 w-full space-y-2">
							<div className="flex justify-between text-sm">
								<span className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-emerald-500" /> Aman
								</span>
								<span className="font-semibold text-slate-700">
									{countAman}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-amber-500" /> Perlu
									Perhatian
								</span>
								<span className="font-semibold text-slate-700">
									{countPerhatian}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-rose-500" /> Tidak
									Aman
								</span>
								<span className="font-semibold text-slate-700">
									{countTidakAman}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Table */}
				<Card className="bg-white border-slate-200 shadow-sm col-span-1 lg:col-span-2 overflow-hidden">
					<CardHeader className="border-b border-slate-200 pb-4 bg-slate-50/50">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<CardTitle className="text-slate-800 text-lg">
								Daftar Kesiapan Dokumen Mahasiswa
							</CardTitle>
							<div className="relative w-full md:w-72">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
								<Input
									placeholder="Cari NIM atau Nama..."
									className="pl-9 bg-white"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader className="bg-slate-50">
								<TableRow>
									<TableHead className="font-semibold text-slate-600">
										NIM / Nama
									</TableHead>
									<TableHead className="font-semibold text-slate-600">
										Program
									</TableHead>
									<TableHead className="font-semibold text-slate-600">
										Tujuan
									</TableHead>
									<TableHead className="font-semibold text-slate-600">
										Progres Dokumen
									</TableHead>
									<TableHead className="font-semibold text-slate-600">
										Status
									</TableHead>
									<TableHead className="text-right font-semibold text-slate-600">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredStudents.length > 0 ? (
									filteredStudents.slice(0, 5).map((s) => (
										<TableRow key={s.id} className="hover:bg-slate-50/50">
											<TableCell>
												<div className="font-medium text-slate-900">
													{s.name}
												</div>
												<div className="text-xs text-slate-500">{s.nim}</div>
											</TableCell>
											<TableCell className="text-slate-600">
												{s.program}
											</TableCell>
											<TableCell className="text-slate-600">
												{s.destinationCity || "-"}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium text-slate-700">
														{s.completedDocs}/8
													</span>
													<div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
														<div
															className={`h-full rounded-full ${s.completedDocs === 8 ? "bg-emerald-500" : "bg-blue-500"}`}
															style={{
																width: `${(s.completedDocs / 8) * 100}%`,
															}}
														/>
													</div>
												</div>
											</TableCell>
											<TableCell>{renderStatusBadge(s.status)}</TableCell>
											<TableCell className="text-right">
												<button
													type="button"
													className="text-[#0517B0] hover:text-blue-800 hover:underline text-sm font-medium"
													onClick={() =>
														router.push(
															`/dashboard/students/${s.id}#panel-magang`,
														)
													}
												>
													Periksa
												</button>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={6}
											className="h-32 text-center text-slate-500"
										>
											Tidak ada mahasiswa ditemukan.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
