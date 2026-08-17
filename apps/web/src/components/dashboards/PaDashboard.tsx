"use client";

import {
	CheckCircle,
	CheckCircle2,
	Clock,
	Download,
	Eye,
	HeartHandshake,
	HelpCircle,
	Search,
	ShieldAlert,
	ShieldCheck,
	UserCheck,
	Users,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";

export function PaDashboard({ user, data: propData }: any) {
	const router = useRouter();
	const [data, setData] = useState<any[]>(propData || []);
	const [isLoading, setIsLoading] = useState(
		!propData || propData.length === 0,
	);
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	// Cohort years starting from 2022
	const cohortYears = useMemo(() => {
		const currentYear = new Date().getFullYear();
		return Array.from(
			{ length: currentYear - 2022 + 2 },
			(_, i) => currentYear + 1 - i,
		);
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const { data: resData, error } = await api.students.get();
				if (!error && resData?.data) {
					setData(resData.data);
				}
			} catch (err) {
				console.error("Failed fetching PA dashboard data", err);
			} finally {
				setIsLoading(false);
			}
		};
		if (!propData || propData.length === 0) {
			fetchData();
		} else {
			setData(propData);
			setIsLoading(false);
		}
	}, [propData]);

	// Filter by cohort first for reactive KPI
	const cohortData = useMemo(() => {
		if (!data) return [];
		if (selectedCohort === "all") return data;
		return data.filter(
			(s: any) => s.student?.cohort?.toString() === selectedCohort,
		);
	}, [data, selectedCohort]);

	// KPI Metrics based on cohortData
	const totalStudents = cohortData.length;
	const countAcc = cohortData.filter((s: any) => s.pa?.isAcc).length;
	const countAman = cohortData.filter(
		(s: any) => s.pa?.status === "AMAN",
	).length;
	const countPerhatian = cohortData.filter(
		(s: any) => s.pa?.status === "PERLU_PERHATIAN" || !s.pa?.status,
	).length;
	const countTidakAman = cohortData.filter(
		(s: any) => s.pa?.status === "TIDAK_AMAN",
	).length;
	const countInterviewsDone = cohortData.filter(
		(s: any) =>
			s.pa?.interview1Completed &&
			s.pa?.interview2Completed &&
			s.pa?.interview3Completed,
	).length;

	// Filtered students for Table
	const filteredData = useMemo(() => {
		const q = searchQuery.toLowerCase();
		return cohortData.filter((s: any) => {
			const matchSearch =
				!q ||
				(s.student?.name || "").toLowerCase().includes(q) ||
				(s.student?.nim || "").toLowerCase().includes(q) ||
				(s.student?.program || "").toLowerCase().includes(q);

			const paStatus = s.pa?.status || "PERLU_PERHATIAN";
			let matchStatus = true;
			if (selectedStatus === "aman") matchStatus = paStatus === "AMAN";
			if (selectedStatus === "perhatian")
				matchStatus = paStatus === "PERLU_PERHATIAN";
			if (selectedStatus === "tidak_aman")
				matchStatus = paStatus === "TIDAK_AMAN";
			if (selectedStatus === "acc") matchStatus = Boolean(s.pa?.isAcc);

			return matchSearch && matchStatus;
		});
	}, [cohortData, searchQuery, selectedStatus]);

	const handleExport = () => {
		const exportData = filteredData.map((s: any) => ({
			NIM: s.student?.nim || "-",
			"Nama Mahasiswa": s.student?.name || "-",
			Angkatan: s.student?.cohort || "-",
			Program: s.student?.program || "-",
			"Wawancara 1": s.pa?.interview1Completed ? "Selesai" : "Belum",
			"Wawancara 2": s.pa?.interview2Completed ? "Selesai" : "Belum",
			"Wawancara 3": s.pa?.interview3Completed ? "Selesai" : "Belum",
			"Tripartite Meeting": s.pa?.tripartiteMeetingCompleted
				? "Selesai"
				: "Belum",
			"Status PA":
				s.pa?.status === "AMAN"
					? "Aman"
					: s.pa?.status === "TIDAK_AMAN"
						? "Tidak Aman"
						: "Perlu Perhatian",
			"Status ACC PA": s.pa?.isAcc ? "Sudah ACC" : "Belum",
		}));
		exportToCSV(
			exportData,
			`Data_PA_${new Date().toISOString().split("T")[0]}`,
		);
	};

	const getPaChecklist = (pa: any) => {
		const items = [
			{ name: "Sesi Wawancara 1", done: Boolean(pa?.interview1Completed) },
			{ name: "Sesi Wawancara 2", done: Boolean(pa?.interview2Completed) },
			{ name: "Sesi Wawancara 3", done: Boolean(pa?.interview3Completed) },
			{
				name: "Tripartite Meeting",
				done: Boolean(pa?.tripartiteMeetingCompleted),
			},
		];
		const completed = items.filter((i) => i.done).length;
		return {
			items,
			completed,
			total: items.length,
			isDone: completed === items.length,
		};
	};

	if (isLoading) {
		return (
			<div className="flex flex-col justify-center items-center h-80 gap-3 text-slate-500">
				<p className="text-sm font-semibold">
					Memuat data bimbingan akademik...
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-12">
			{/* Top Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg border border-teal-100">
							<HeartHandshake className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								Dashboard Pembimbing Akademik (PA)
							</h1>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								Monitoring bimbingan konseling, rekap sesi wawancara 1-3,
								tripartite meeting, dan kelayakan mental/karakter.
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<Select
						value={selectedCohort}
						onValueChange={(val) => setSelectedCohort(val || "all")}
					>
						<SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200 font-semibold text-slate-800">
							<SelectValue placeholder="Filter Angkatan" />
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

					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9"
					>
						<Download className="w-3.5 h-3.5" />
						Export Data PA
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-blue-50 text-[#0517B0] mt-0.5">
							<Users className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								Total Mahasiswa
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{totalStudents}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-teal-600">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-teal-50 text-teal-600 mt-0.5">
							<ShieldCheck className="h-5 w-5" />
						</div>
						<div>
							<p className="text-teal-700 text-xs font-bold">ACC Pembimbing</p>
							<p className="text-2xl font-black text-teal-900 mt-0.5">
								{countAcc}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
							<CheckCircle className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								🟢 Status Aman
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countAman}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-amber-50 text-amber-600 mt-0.5">
							<Clock className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								🟡 Sesi Berjalan
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countPerhatian}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-rose-50 text-rose-600 mt-0.5">
							<XCircle className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								⛔ Kendala Bimbingan
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countTidakAman}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-indigo-600">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
							<UserCheck className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								Wawancara 1-3 Selesai
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countInterviewsDone}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Monitoring Table */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
							<HeartHandshake className="w-4 h-4 text-[#0517B0]" />
							Monitoring Bimbingan PA Mahasiswa
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Menampilkan {filteredData.length} dari {totalStudents} mahasiswa
							terdaftar.
						</p>
					</div>

					{/* Search & Filter */}
					<div className="flex flex-wrap items-center gap-2.5">
						<div className="relative w-full sm:w-60">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari NIM, Nama, Program..."
								className="pl-9 h-9 text-xs bg-white border-slate-200"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<Select
							value={selectedStatus}
							onValueChange={(val) => setSelectedStatus(val || "all")}
						>
							<SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Status PA" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Status</SelectItem>
								<SelectItem value="aman">🟢 Aman</SelectItem>
								<SelectItem value="perhatian">🟡 Berproses</SelectItem>
								<SelectItem value="tidak_aman">🔴 Kendala</SelectItem>
								<SelectItem value="acc">🛡️ Sudah ACC PA</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-slate-50 sticky top-0 z-10">
								<TableRow className="border-slate-200">
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs w-28">
										NIM
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs">
										Nama & Program
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
										Checklist PA (4)
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-28">
										Status PA
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-28">
										ACC PA
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right pr-6 w-28">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredData.map((s: any) => {
									const { items, completed, total, isDone } = getPaChecklist(
										s.pa,
									);
									const status = s.pa?.status || "PERLU_PERHATIAN";

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
														{s.student.program || "-"}
													</span>
												</div>
											</TableCell>

											{/* Checklist Progress with Tooltip */}
											<TableCell className="text-center">
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger className="w-full">
															<div className="flex flex-col items-center gap-1">
																<div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 px-1">
																	<span>
																		{completed}/{total} Sesi
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
																				: completed >= 2
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
																	Indikator Bimbingan:
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
																		<span className="text-slate-300 font-medium">
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

											{/* Status Badge */}
											<TableCell className="text-center">
												{status === "AMAN" ? (
													<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
														🟢 Aman
													</Badge>
												) : status === "PERLU_PERHATIAN" ? (
													<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">
														🟡 Berproses
													</Badge>
												) : (
													<Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold">
														⛔ Kendala
													</Badge>
												)}
											</TableCell>

											{/* ACC PA */}
											<TableCell className="text-center">
												{s.pa?.isAcc ? (
													<Badge className="bg-teal-50 text-teal-700 border-teal-200 text-xs font-bold">
														✓ ACC
													</Badge>
												) : (
													<span className="text-xs text-slate-400 italic">
														Belum
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

						{filteredData.length === 0 && (
							<div className="text-center py-12 text-slate-500">
								<HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
								<p className="text-sm font-semibold">
									Tidak ada data bimbingan PA ditemukan.
								</p>
								<p className="text-xs text-slate-400 mt-0.5">
									Coba ubah kata kunci pencarian atau filter status yang
									digunakan.
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
