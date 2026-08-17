"use client";

import {
	CheckCircle,
	CheckCircle2,
	Clock,
	Download,
	Eye,
	HeartHandshake,
	HelpCircle,
	PhoneCall,
	Search,
	ShieldAlert,
	ShieldCheck,
	Users,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import { exportToCSV } from "@/lib/export";

export function CrmDashboard({
	data = [],
	searchQuery,
	setSearchQuery,
	user,
}: any) {
	const router = useRouter();
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [localSearch, setLocalSearch] = useState(searchQuery || "");

	// Cohort years starting from 2022
	const cohortYears = useMemo(() => {
		const currentYear = new Date().getFullYear();
		return Array.from(
			{ length: currentYear - 2022 + 2 },
			(_, i) => currentYear + 1 - i,
		);
	}, []);

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
	const countAcc = cohortData.filter((s: any) => s.crm?.isAcc).length;
	const countAman = cohortData.filter(
		(s: any) => s.crm?.status === "AMAN",
	).length;
	const countPerhatian = cohortData.filter(
		(s: any) => s.crm?.status === "PERLU_PERHATIAN" || !s.crm?.status,
	).length;
	const countTidakAman = cohortData.filter(
		(s: any) => s.crm?.status === "TIDAK_AMAN",
	).length;
	const countPracticeOk = cohortData.filter(
		(s: any) => s.crm?.practiceAttendance || s.crm?.isMonitoringIndustry,
	).length;

	// Filtered students for Table
	const filteredData = useMemo(() => {
		const q = (searchQuery || localSearch).toLowerCase();
		return cohortData.filter((s: any) => {
			const matchSearch =
				!q ||
				(s.student?.name || "").toLowerCase().includes(q) ||
				(s.student?.nim || "").toLowerCase().includes(q) ||
				(s.student?.program || "").toLowerCase().includes(q);

			const crmStatus = s.crm?.status || "PERLU_PERHATIAN";
			let matchStatus = true;
			if (selectedStatus === "aman") matchStatus = crmStatus === "AMAN";
			if (selectedStatus === "perhatian")
				matchStatus = crmStatus === "PERLU_PERHATIAN";
			if (selectedStatus === "tidak_aman")
				matchStatus = crmStatus === "TIDAK_AMAN";
			if (selectedStatus === "acc") matchStatus = Boolean(s.crm?.isAcc);

			return matchSearch && matchStatus;
		});
	}, [cohortData, searchQuery, localSearch, selectedStatus]);

	const handleExport = () => {
		const exportData = filteredData.map((s: any) => ({
			NIM: s.student?.nim || "-",
			"Nama Mahasiswa": s.student?.name || "-",
			Angkatan: s.student?.cohort || "-",
			Program: s.student?.program || "-",
			"Monitoring Ortu": s.crm?.isMonitoringParent ? "Selesai" : "Belum",
			"Monitoring Industri": s.crm?.isMonitoringIndustry ? "Selesai" : "Belum",
			"Kendali Vocab": s.crm?.isVocabComplete ? "Selesai" : "Belum",
			"Surat Izin Belajar": s.crm?.hasStudyPermit ? "Ada" : "Tidak",
			"Rekap Kehadiran": s.crm?.practiceAttendance ? "Selesai" : "Belum",
			"Hari Hadir Praktik": s.crm?.practiceDaysPresent || 0,
			"Total Hari Praktik": s.crm?.practiceDaysTotal || 0,
			"Laporan ODS": s.crm?.isOdsReport ? "Selesai" : "Belum",
			"Dokumentasi ODS": s.crm?.odsDocumentation ? "Selesai" : "Belum",
			"Status CRM":
				s.crm?.status === "AMAN"
					? "Aman"
					: s.crm?.status === "TIDAK_AMAN"
						? "Tidak Aman"
						: "Perlu Perhatian",
			"Status ACC CRM": s.crm?.isAcc ? "Sudah ACC" : "Belum",
		}));
		exportToCSV(
			exportData,
			`Data_CRM_${new Date().toISOString().split("T")[0]}`,
		);
	};

	const getCrmChecklist = (crm: any) => {
		const items = [
			{
				name: "Monitoring Orang Tua",
				done: Boolean(crm?.isMonitoringParent || crm?.parentFollowUp),
			},
			{
				name: "Monitoring Industri",
				done: Boolean(crm?.isMonitoringIndustry || crm?.studentMonitoring),
			},
			{ name: "Kendali Vocab/Bahasa", done: Boolean(crm?.isVocabComplete) },
			{ name: "Surat Izin Belajar", done: Boolean(crm?.hasStudyPermit) },
			{ name: "Presensi Praktik ODS", done: Boolean(crm?.practiceAttendance) },
			{ name: "Dokumentasi ODS", done: Boolean(crm?.odsDocumentation) },
		];
		const completed = items.filter((i) => i.done).length;
		return {
			items,
			completed,
			total: items.length,
			isDone: completed === items.length,
		};
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Top Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-violet-50 text-violet-600 rounded-lg border border-violet-100">
							<PhoneCall className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								Dashboard Divisi CRM
							</h1>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								Monitoring relasi industri, komunikasi orang tua/wali, kendali
								vocab, dan presensi praktik ODS.
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
						Export Data CRM
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

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-violet-600">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-violet-50 text-violet-600 mt-0.5">
							<ShieldCheck className="h-5 w-5" />
						</div>
						<div>
							<p className="text-violet-700 text-xs font-bold">
								ACC Divisi CRM
							</p>
							<p className="text-2xl font-black text-violet-900 mt-0.5">
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
								🟡 Berproses
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
								⛔ Ada Kendala
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
							<HeartHandshake className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								Presensi Praktik OK
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countPracticeOk}
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
							<Users className="w-4 h-4 text-[#0517B0]" />
							Daftar Monitoring Mahasiswa CRM
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
								value={searchQuery !== undefined ? searchQuery : localSearch}
								onChange={(e) => {
									setLocalSearch(e.target.value);
									setSearchQuery?.(e.target.value);
								}}
							/>
						</div>

						<Select
							value={selectedStatus}
							onValueChange={(val) => setSelectedStatus(val || "all")}
						>
							<SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Status CRM" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Status</SelectItem>
								<SelectItem value="aman">🟢 Aman</SelectItem>
								<SelectItem value="perhatian">🟡 Berproses</SelectItem>
								<SelectItem value="tidak_aman">🔴 Kendala</SelectItem>
								<SelectItem value="acc">🛡️ Sudah ACC CRM</SelectItem>
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
										Checklist CRM (6)
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-32">
										Hari Praktik
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-28">
										Status CRM
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-28">
										ACC CRM
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right pr-6 w-28">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredData.map((s: any) => {
									const { items, completed, total, isDone } = getCrmChecklist(
										s.crm,
									);
									const status = s.crm?.status || "PERLU_PERHATIAN";

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
																	Indikator CRM:
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

											<TableCell className="text-center text-xs font-mono text-slate-700">
												{s.crm?.practiceDaysPresent !== undefined ? (
													<span>
														<strong className="text-slate-900">
															{s.crm.practiceDaysPresent}
														</strong>
														<span className="text-slate-400">
															/{s.crm.practiceDaysTotal || 0} Hari
														</span>
													</span>
												) : (
													<span className="text-slate-400 italic">-</span>
												)}
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

											{/* ACC CRM */}
											<TableCell className="text-center">
												{s.crm?.isAcc ? (
													<Badge className="bg-violet-50 text-violet-700 border-violet-200 text-xs font-bold">
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
									Tidak ada data CRM ditemukan.
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
