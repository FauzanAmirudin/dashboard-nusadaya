"use client";

import {
	BookOpen,
	CheckCircle,
	CheckCircle2,
	Clock,
	Download,
	Eye,
	GraduationCap,
	HelpCircle,
	MessageCircle,
	RotateCcw,
	Search,
	ShieldAlert,
	ShieldCheck,
	User,
	Users,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}: any) {
	const router = useRouter();
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [localSearch, setLocalSearch] = useState(searchQuery || "");
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 20;

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
				(s.student?.phone || "").toLowerCase().includes(q);

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

			return matchSearch && matchStatus;
		});
	}, [cohortData, localSearch, searchQuery, selectedStatus]);

	// Reset page on filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedCohort, selectedStatus, localSearch]);

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
			{ name: "Presensi Hadir (≥ 80%)", done: attendanceOk },
			{ name: "Lulus UTS", done: Boolean(s.academic?.utsPassed) },
			{ name: "Lulus UAS", done: Boolean(s.academic?.uasPassed) },
			{
				name: "Tugas Kuliah Selesai",
				done: Boolean(s.academic?.assignmentsCompleted),
			},
			{ name: "Indikator Sikap", done: Boolean(s.academic?.attitudeIndicator) },
			{
				name: "Komunikasi Akademik",
				done: Boolean(s.academic?.academicCommunication),
			},
		];
		const completed = items.filter((i) => i.done).length;
		return {
			items,
			completed,
			total: items.length,
			isDone: completed === items.length,
			attendancePct,
		};
	};

	const handleExport = () => {
		const exportData = filteredData.map((s: any) => {
			const checklist = getAcademicChecklist(s);
			return {
				NIM: s.student?.nim || "-",
				"Nama Mahasiswa": s.student?.name || "-",
				Angkatan: s.student?.cohort ? `Angkatan ${s.student.cohort}` : "-",
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
				"Tugas Selesai": s.academic?.assignmentsCompleted ? "Ya" : "Tidak",
				"Indikator Sikap": s.academic?.attitudeIndicator || "-",
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
						onClick={handleExport}
						className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9"
					>
						<Download className="w-3.5 h-3.5" />
						Export Data Akademik
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
							selectedStatus !== "all") && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setLocalSearch("");
									setSearchQuery?.("");
									setSelectedCohort("all");
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
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-28">
										Angkatan
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

											{/* Angkatan */}
											<TableCell className="text-center">
												<Badge
													variant="outline"
													className="text-xs font-bold text-slate-700 bg-slate-50 border-slate-200 px-2 py-0.5"
												>
													{s.student.cohort
														? `Angkatan ${s.student.cohort}`
														: "-"}
												</Badge>
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
		</div>
	);
}
