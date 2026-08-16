"use client";

import {
	CheckCircle,
	Clock,
	Download,
	LayoutDashboard,
	Search,
	Users,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";

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

export function PaDashboard({ user }: any) {
	const router = useRouter();
	const [data, setData] = useState<any[]>([]);
	const [kpi, setKpi] = useState<any>({});
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			const { data: resData, error } = await api.pa.dashboard.get({
				$query: { q: searchQuery },
			});
			if (!error && resData?.data) {
				setData(resData.data.students);
				setKpi(resData.data.kpi);
			}
			setIsLoading(false);
		};
		fetchData();
	}, [searchQuery]);

	const totalStudents = kpi.totalStudents || 0;
	const countAman = kpi.aman || 0;
	const countPerhatian = kpi.perhatian || 0;
	const countTidakAman = kpi.vocabLow || 0;

	const handleExport = () => {
		const exportData = data.map((s: any) => ({
			NIM: s.nim,
			"Nama Mahasiswa": s.name,
			"Dosen PA": s.paName,
			"Konseling Dilakukan": s.counselingDone ? "Sudah" : "Belum",
			"Status PA":
				s.status === "AMAN"
					? "Aman"
					: s.status === "TIDAK_AMAN"
						? "Tidak Aman"
						: "Perlu Perhatian",
			"Disetujui Admin PA": s.isAcc ? "Sudah ACC" : "Belum",
		}));
		exportToCSV(
			exportData,
			`Data_PA_${new Date().toISOString().split("T")[0]}`,
		);
	};

	const pieData = [
		{ name: "Aman", value: countAman },
		{ name: "Perlu Perhatian", value: countPerhatian },
		{ name: "Tidak Aman", value: countTidakAman },
	];

	const filteredData = data;

	const renderProgressBadge = (s: any) => {
		const items = [
			s.pa?.interview1Completed,
			s.pa?.interview2Completed,
			s.pa?.interview3Completed,
			s.pa?.tripartiteMeetingCompleted,
		];
		const completedCount = items.filter(Boolean).length;
		const total = 4;

		return (
			<div className="flex items-center gap-2 justify-center">
				<span className="text-sm font-medium text-slate-700">
					{completedCount}/{total}
				</span>
				<div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
					<div
						className={`h-full rounded-full ${completedCount === total ? "bg-emerald-500" : "bg-blue-500"}`}
						style={{
							width: `${(completedCount / total) * 100}%`,
						}}
					/>
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Dashboard Divisi Pembimbing Akademik (PA)
					</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Selamat datang, {user?.username}. Berikut ringkasan data bimbingan
						akademik mahasiswa.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleExport}
						className="flex items-center gap-2 bg-[#0517B0] hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
					>
						<Download className="h-4 w-4" />
						Export Data PA
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
								Data PA Lengkap (Aman)
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
								PA Proses (Perhatian)
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
							<p className="text-slate-500 text-sm font-medium">Kendala PA</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countTidakAman}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="flex flex-col gap-6">
				{/* List Mahasiswa dengan Kendala */}
				<Card className="bg-white border-slate-200 shadow-sm w-full">
					<CardHeader className="border-b border-slate-200 pb-4 bg-slate-50/50">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<CardTitle className="text-slate-800 text-lg">
								Tabel Kelengkapan PA
							</CardTitle>
							<div className="relative w-full md:w-72">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
								<Input
									placeholder="Cari NIM atau Nama Mahasiswa..."
									className="pl-9 bg-white"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-4 sm:p-6">
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
										<TableHead className="text-slate-500 font-semibold py-3">
											Dosen PA
										</TableHead>
										<TableHead className="text-slate-500 font-semibold text-center py-3">
											Status PA
										</TableHead>
										<TableHead className="text-slate-500 font-semibold text-right py-3 pr-4">
											Aksi
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{isLoading ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="text-center py-8 text-slate-500"
											>
												Memuat data...
											</TableCell>
										</TableRow>
									) : (
										filteredData.map((s: any) => (
											<TableRow
												key={s.id}
												className="border-slate-200 hover:bg-blue-50/50 transition-colors"
											>
												<TableCell className="font-medium text-slate-700">
													{s.nim}
												</TableCell>
												<TableCell className="text-slate-900 font-semibold">
													{s.name}
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className="text-slate-500 border-slate-200"
													>
														{s.program}
													</Badge>
												</TableCell>
												<TableCell className="text-slate-600 font-medium text-sm">
													{s.paName}
												</TableCell>
												<TableCell className="text-center">
													{renderProgressBadge(s)}
												</TableCell>
												<TableCell className="text-right pr-4">
													<button
														type="button"
														onClick={() =>
															router.push(
																`/dashboard/students/${s.id}?context=pa`,
															)
														}
														className="text-[#0517B0] hover:text-blue-800 hover:underline text-sm font-medium"
													>
														Periksa
													</button>
												</TableCell>
											</TableRow>
										))
									)}
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
