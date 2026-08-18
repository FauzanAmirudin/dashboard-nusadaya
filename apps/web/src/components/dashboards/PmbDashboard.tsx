"use client";

import {
	CheckCircle,
	CheckCircle2,
	CheckSquare,
	Clock,
	Download,
	Eye,
	FilePlus,
	FileText,
	HelpCircle,
	MessageCircle,
	Phone,
	Plus,
	Search,
	ShieldAlert,
	ShieldCheck,
	UserPlus,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { exportToCSV } from "@/lib/export";
import { FormMahasiswaModule } from "./pmb/FormMahasiswaModule";

function formatWhatsAppUrl(phone: string | null | undefined) {
	if (!phone) return null;
	const clean = phone.replace(/[^0-9]/g, "");
	if (!clean) return null;
	const formatted = clean.startsWith("0") ? `62${clean.slice(1)}` : clean;
	return `https://wa.me/${formatted}`;
}

export function PmbDashboard({
	data = [],
	searchQuery,
	setSearchQuery,
	user,
}: any) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("overview");
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [localSearch, setLocalSearch] = useState(searchQuery || "");
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 20;

	// Available cohorts dynamically derived from student data
	const availableCohorts = useMemo(() => {
		const cohorts = new Set<string>();
		if (data && data.length > 0) {
			data.forEach((s: any) => {
				if (s.student?.cohort) cohorts.add(s.student.cohort.toString());
			});
		}
		// Default fallback cohorts (16, 15, 14, 13, 12, etc.)
		["16", "15", "14", "13", "12", "11", "10"].forEach((c) => cohorts.add(c));
		return Array.from(cohorts).sort((a, b) => {
			const numA = Number(a);
			const numB = Number(b);
			if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
			return b.localeCompare(a);
		});
	}, [data]);

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
	const countAcc = cohortData.filter((s: any) => s.pmb?.isAcc).length;
	const countAman = cohortData.filter(
		(s: any) => s.pmb?.status === "AMAN",
	).length;
	const countPerhatian = cohortData.filter(
		(s: any) => s.pmb?.status === "PERLU_PERHATIAN" || !s.pmb?.status,
	).length;
	const countTidakAman = cohortData.filter(
		(s: any) => s.pmb?.status === "TIDAK_AMAN",
	).length;

	const getPmbChecklist = (pmb: any) => {
		const items = [
			{
				name: "Formulir Masuk",
				done: Boolean(pmb?.formReceived),
				category: "Utama",
			},
			{
				name: "Berkas Lengkap",
				done: Boolean(pmb?.documentsComplete),
				category: "Utama",
			},
			{
				name: "Input Data Awal",
				done: Boolean(pmb?.dataInputted),
				category: "Utama",
			},
			{
				name: "Follow Up Awal",
				done: Boolean(pmb?.initialFollowUp),
				category: "Utama",
			},
			{ name: "KTP", done: Boolean(pmb?.docKtp), category: "Dokumen" },
			{
				name: "Kartu Keluarga (KK)",
				done: Boolean(pmb?.docKk),
				category: "Dokumen",
			},
			{
				name: "Curriculum Vitae (CV)",
				done: Boolean(pmb?.docCv),
				category: "Dokumen",
			},
			{
				name: "Ijazah Terakhir",
				done: Boolean(pmb?.docIjazah),
				category: "Dokumen",
			},
			{
				name: "Transkrip Nilai",
				done: Boolean(pmb?.docTranskrip),
				category: "Dokumen",
			},
			{
				name: "Paspor Halaman Depan",
				done: Boolean(pmb?.docPassportDepan),
				category: "Dokumen",
			},
			{
				name: "Paspor Halaman Visa",
				done: Boolean(pmb?.docPassportVisa),
				category: "Dokumen",
			},
			{ name: "Surat SKBM", done: Boolean(pmb?.docSkbm), category: "Dokumen" },
			{
				name: "Hasil Lab MCU",
				done: Boolean(pmb?.docMcu),
				category: "Dokumen",
			},
			{
				name: "Sertifikasi Bahasa",
				done: Boolean(pmb?.docSertifikasiBahasa),
				category: "Dokumen",
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

	const countFormComplete = cohortData.filter((s: any) => {
		return getPmbChecklist(s.pmb).isDone;
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

			const pmbStatus = s.pmb?.status || "PERLU_PERHATIAN";
			let matchStatus = true;
			if (selectedStatus === "aman") matchStatus = pmbStatus === "AMAN";
			if (selectedStatus === "perhatian")
				matchStatus = pmbStatus === "PERLU_PERHATIAN";
			if (selectedStatus === "tidak_aman")
				matchStatus = pmbStatus === "TIDAK_AMAN";
			if (selectedStatus === "acc") matchStatus = Boolean(s.pmb?.isAcc);

			return matchSearch && matchStatus;
		});
	}, [cohortData, searchQuery, localSearch, selectedStatus]);

	// Reset page on filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedCohort, selectedStatus, localSearch]);

	const paginatedData = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredData.slice(start, start + pageSize);
	}, [filteredData, currentPage]);

	const handleExport = () => {
		const exportData = filteredData.map((s: any) => {
			const checklist = getPmbChecklist(s.pmb);
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
				"Progress Checklist": `${checklist.completed}/14 Item (${Math.round((checklist.completed / 14) * 100)}%)`,
				"Formulir Masuk": s.pmb?.formReceived ? "Sudah" : "Belum",
				"Berkas Lengkap": s.pmb?.documentsComplete ? "Sudah" : "Belum",
				"Data Terinput": s.pmb?.dataInputted ? "Sudah" : "Belum",
				"Follow Up Awal": s.pmb?.initialFollowUp ? "Sudah" : "Belum",
				"Status Checklist PMB":
					s.pmb?.status === "AMAN"
						? "Aman"
						: s.pmb?.status === "TIDAK_AMAN"
							? "Tidak Aman"
							: "Perlu Perhatian",
				"Status ACC PMB": s.pmb?.isAcc ? "Sudah ACC" : "Belum",
			};
		});
		exportToCSV(
			exportData,
			`Data_PMB_${new Date().toISOString().split("T")[0]}`,
		);
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Top Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg border border-sky-100">
							<FileText className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								Dashboard Divisi PMB
							</h1>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								Penerimaan Mahasiswa Baru, verifikasi berkas formulir, dan
								checklist registrasi.
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<Select
						value={selectedCohort}
						onValueChange={(val) => setSelectedCohort(val || "all")}
					>
						<SelectTrigger className="w-[180px] h-9 text-xs bg-white border-slate-200 font-semibold text-slate-800">
							<SelectValue placeholder="Filter Angkatan" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Angkatan</SelectItem>
							{availableCohorts.map((cohort) => {
								const cNum = Number(cohort);
								const ayLabel =
									!isNaN(cNum) && cNum >= 10 && cNum <= 30
										? ` (${2010 + cNum}/${2011 + cNum})`
										: "";
								return (
									<SelectItem key={cohort} value={cohort}>
										Angkatan {cohort}
										{ayLabel}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>

					{(user?.role === "pmb" || user?.role === "superadmin") && (
						<Link href="/dashboard/students/add">
							<Button
								size="sm"
								className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 h-9 font-bold shadow-sm"
							>
								<UserPlus className="w-3.5 h-3.5" />
								Tambah Mahasiswa
							</Button>
						</Link>
					)}

					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9"
					>
						<Download className="w-3.5 h-3.5" />
						Export Data PMB
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
								Total Pendaftar
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{totalStudents}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-sky-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-sky-50 text-sky-600 mt-0.5">
							<ShieldCheck className="h-5 w-5" />
						</div>
						<div>
							<p className="text-sky-700 text-xs font-bold">ACC Divisi PMB</p>
							<p className="text-2xl font-black text-sky-900 mt-0.5">
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
								⛔ Kendala Berkas
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
							<CheckSquare className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								Checklist Lengkap
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countFormComplete}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-4"
			>
				<TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
					<TabsTrigger
						value="overview"
						className="data-[state=active]:bg-[#0517B0] data-[state=active]:text-white text-xs font-semibold px-4 py-2"
					>
						Daftar Mahasiswa PMB
					</TabsTrigger>
					<TabsTrigger
						value="forms"
						className="data-[state=active]:bg-[#0517B0] data-[state=active]:text-white text-xs font-semibold px-4 py-2"
					>
						Formulir Registrasi Online
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4 m-0">
					<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
						<CardHeader className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div>
								<CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
									<Users className="w-4 h-4 text-[#0517B0]" />
									Monitoring Data Penerimaan Mahasiswa
								</CardTitle>
								<p className="text-xs text-slate-500 mt-0.5">
									Menampilkan {filteredData.length} dari {totalStudents}{" "}
									mahasiswa terdaftar.
								</p>
							</div>

							{/* Search & Filter Bar */}
							<div className="flex flex-wrap items-center gap-2.5">
								<div className="relative w-full sm:w-64">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
									<Input
										placeholder="Cari Nama, NIM, Peminatan, WA..."
										className="pl-9 h-9 text-xs bg-white border-slate-200"
										value={
											searchQuery !== undefined ? searchQuery : localSearch
										}
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
										<SelectValue placeholder="Status PMB" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Semua Status</SelectItem>
										<SelectItem value="aman">🟢 Aman</SelectItem>
										<SelectItem value="perhatian">🟡 Berproses</SelectItem>
										<SelectItem value="tidak_aman">🔴 Kendala</SelectItem>
										<SelectItem value="acc">🛡️ Sudah ACC PMB</SelectItem>
									</SelectContent>
								</Select>
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
												Progress (14)
											</TableHead>
											<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-28">
												Status PMB
											</TableHead>
											<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-24">
												ACC PMB
											</TableHead>
											<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right pr-6 w-24">
												Aksi
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{paginatedData.map((s: any) => {
											const { items, completed, isDone } = getPmbChecklist(
												s.pmb,
											);
											const status = s.pmb?.status || "PERLU_PERHATIAN";
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
															!isNaN(Number(s.student.cohort))
																? `${2010 + Number(s.student.cohort)}/${2011 + Number(s.student.cohort)}`
																: s.student.period || (
																		<span className="text-slate-400 italic">
																			-
																		</span>
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

													{/* Progress Checklist with Tooltip */}
													<TableCell className="text-center">
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger className="w-full">
																	<div className="flex flex-col items-center gap-1">
																		<div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 px-1">
																			<span>{completed}/14 Item</span>
																			<span
																				className={
																					isDone
																						? "text-emerald-600"
																						: "text-slate-500"
																				}
																			>
																				{Math.round((completed / 14) * 100)}%
																			</span>
																		</div>
																		<div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
																			<div
																				className={`h-full rounded-full transition-all duration-300 ${
																					isDone
																						? "bg-emerald-500"
																						: completed >= 7
																							? "bg-blue-500"
																							: "bg-amber-500"
																				}`}
																				style={{
																					width: `${(completed / 14) * 100}%`,
																				}}
																			/>
																		</div>
																	</div>
																</TooltipTrigger>
																<TooltipContent className="w-64 p-3.5 bg-slate-950 text-white rounded-xl shadow-2xl border border-slate-800 text-xs flex flex-col space-y-2 z-50 max-h-72 overflow-y-auto">
																	<div className="flex items-center justify-between border-b border-slate-800 pb-1.5 w-full">
																		<span className="font-bold text-slate-100 text-xs">
																			Checklist PMB (14):
																		</span>
																		<span className="text-[11px] font-mono text-emerald-400 font-bold">
																			{completed}/14 Selesai
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

													{/* Status PMB */}
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

													{/* ACC PMB */}
													<TableCell className="text-center">
														{s.pmb?.isAcc ? (
															<Badge className="bg-sky-50 text-sky-700 border-sky-200 text-xs font-bold">
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
																router.push(
																	`/dashboard/students/${s.student.id}?context=pmb`,
																)
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
											Tidak ada data pendaftar PMB ditemukan.
										</p>
										<p className="text-xs text-slate-400 mt-0.5">
											Coba ubah kata kunci pencarian atau filter status yang
											digunakan.
										</p>
									</div>
								)}

								<TablePagination
									currentPage={currentPage}
									totalItems={filteredData.length}
									pageSize={pageSize}
									onPageChange={setCurrentPage}
									itemName="Pendaftar PMB"
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="forms" className="m-0">
					<FormMahasiswaModule />
				</TabsContent>
			</Tabs>
		</div>
	);
}
