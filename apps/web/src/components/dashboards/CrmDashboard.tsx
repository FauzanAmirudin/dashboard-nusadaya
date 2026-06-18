"use client";

import {
	CheckCircle,
	Clock,
	Download,
	LayoutDashboard,
	Users,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export function CrmDashboard({ data, searchQuery, setSearchQuery, user }: any) {
	const router = useRouter();

	const totalStudents = data.length;
	const countAman = data.filter((s: any) => s.crm?.status === "AMAN").length;
	const countPerhatian = data.filter(
		(s: any) => s.crm?.status === "PERLU_PERHATIAN" || !s.crm?.status,
	).length;
	const countTidakAman = data.filter(
		(s: any) => s.crm?.status === "TIDAK_AMAN",
	).length;

	const pieData = [
		{ name: "Aman", value: countAman },
		{ name: "Perlu Perhatian", value: countPerhatian },
		{ name: "Tidak Aman", value: countTidakAman },
	];

	const filteredData = data.filter(
		(s: any) =>
			s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.student.nim.includes(searchQuery),
	);

	const renderStatusBadge = (status: string | null | undefined) => {
		if (status === "AMAN") {
			return (
				<Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10">
					🟢 Aman
				</Badge>
			);
		}
		if (status === "TIDAK_AMAN") {
			return (
				<Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/10">
					🔴 Tdk Aman
				</Badge>
			);
		}
		return (
			<Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10">
				🟡 Perhatian
			</Badge>
		);
	};

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Dashboard Divisi CRM
					</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Selamat datang, {user.username}. Berikut ringkasan data relasi
						mahasiswa.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						className="flex items-center gap-2 bg-[#0517B0] hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
					>
						<Download className="h-4 w-4" />
						Export Data CRM
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
							<p className="text-slate-500 text-sm font-medium">
								Data CRM Lengkap (Aman)
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countAman}
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
								CRM Proses (Perhatian)
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
							<p className="text-slate-500 text-sm font-medium">Kendala CRM</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countTidakAman}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Donut Chart */}
				<Card className="bg-white border-slate-200 shadow-sm col-span-1 lg:col-span-1">
					<CardHeader>
						<CardTitle className="text-slate-800 flex items-center gap-2">
							<LayoutDashboard className="h-5 w-5 text-slate-500" />
							Distribusi Status CRM
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

				{/* List Mahasiswa dengan Kendala */}
				<Card className="bg-white border-slate-200 shadow-sm col-span-1 lg:col-span-2">
					<CardHeader>
						<CardTitle className="text-slate-800">
							Tabel Kelengkapan Mahasiswa
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="mb-4">
							<Input
								placeholder="Cari NIM atau Nama Mahasiswa..."
								className="max-w-md bg-white border-slate-200 text-slate-900"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<div className="overflow-y-auto max-h-[300px] border border-slate-200 rounded-md">
							<Table>
								<TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
									<TableRow className="border-slate-200 hover:bg-slate-50">
										<TableHead className="text-slate-500 font-semibold py-3">
											NIM
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3">
											Nama Lengkap
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3">
											Angkatan
										</TableHead>
										<TableHead className="text-slate-500 font-semibold text-center py-3">
											Status CRM
										</TableHead>
										<TableHead className="text-slate-500 font-semibold text-right py-3 pr-4">
											Aksi
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredData.map((s: any) => (
										<TableRow
											key={s.student.id}
											className="border-slate-200 hover:bg-blue-50/50 transition-colors"
										>
											<TableCell className="font-medium text-slate-700">
												{s.student.nim}
											</TableCell>
											<TableCell className="text-slate-900 font-semibold">
												{s.student.name}
											</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className="text-slate-500 border-slate-200"
												>
													{s.student.cohort}
												</Badge>
											</TableCell>
											<TableCell className="text-center">
												{renderStatusBadge(s.crm?.status)}
											</TableCell>
											<TableCell className="text-right pr-4">
												<button
													type="button"
													onClick={() =>
														router.push(`/dashboard/students/${s.student.id}`)
													}
													className="text-[#0517B0] hover:text-blue-800 hover:underline text-sm font-medium"
												>
													Periksa
												</button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							{filteredData.length === 0 && (
								<div className="text-center py-8 text-slate-500">
									Tidak ada data mahasiswa ditemukan.
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
