"use client";

import {
	ChevronRight,
	MessageCircle,
	RotateCcw,
	Search,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
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
import {
	calculateCohortFromYear,
	getAcademicYearFromCohort,
} from "@/lib/cohort-generator";
import {
	getAgencyPaymentReminders,
	getMagangDashboardChecklist,
	getMagangDashboardStatus,
	getMagangPrerequisites,
} from "@/utils/panel-logic";
import type { PanelStatusType } from "@/utils/status";

function formatWhatsAppUrl(phone: string | null | undefined) {
	if (!phone) return null;
	const clean = phone.replace(/[^0-9]/g, "");
	if (!clean) return null;
	const formatted = clean.startsWith("0") ? `62${clean.slice(1)}` : clean;
	return `https://wa.me/${formatted}`;
}

// Satu-satunya indikator status per baris (konsisten dengan KPI, filter & export)
const STATUS_PILL: Record<
	PanelStatusType,
	{ label: string; className: string; dot: string }
> = {
	ACC: {
		label: "ACC",
		className: "bg-blue-50 text-[#0517B0] border-blue-200",
		dot: "bg-[#0517B0]",
	},
	AMAN: {
		label: "Aman",
		className: "bg-emerald-50 text-emerald-700 border-emerald-200",
		dot: "bg-emerald-500",
	},
	PROSES: {
		label: "Berproses",
		className: "bg-amber-50 text-amber-800 border-amber-200",
		dot: "bg-amber-500",
	},
	BUTUH_PERHATIAN: {
		label: "Butuh Perhatian",
		className: "bg-rose-50 text-rose-700 border-rose-200",
		dot: "bg-rose-500",
	},
};

const STATUS_FILTER_LABEL: Record<string, string> = {
	butuh_perhatian: "Butuh Perhatian",
	proses: "Berproses",
	aman: "Aman",
	acc: "Sudah ACC",
	selesai: "Aman / ACC",
	paspor: "Paspor Siap",
	agensi: "Pembayaran agensi tertunda",
};

const isPassportReady = (s: any) =>
	Boolean(s.internship?.passportReady || s.finance?.pasporStatus);

export function MagangDashboard({
	hideHeader = false,
	data = [],
	onUpdate,
}: {
	hideHeader?: boolean;
	data?: any[];
	onUpdate?: () => void;
} = {}) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const pageSize = 20;

	// Hanya mahasiswa yang sudah ACC seluruh panel yang masuk Panel Magang
	const baseData = useMemo(
		() => (data || []).filter((s: any) => getMagangPrerequisites(s).ok),
		[data],
	);

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
		if (selectedCohort === "all") return baseData;
		return baseData.filter(
			(s: any) =>
				s.student?.cohort?.toString() === selectedCohort ||
				(Number(selectedCohort) >= 2000 &&
					s.student?.cohort ===
						calculateCohortFromYear(Number(selectedCohort))),
		);
	}, [baseData, selectedCohort]);

	// KPI berdasarkan status yang sama dengan kolom Kesiapan
	const countBy = (status: PanelStatusType) =>
		cohortData.filter(
			(s: any) =>
				getMagangDashboardStatus(
					s.internship,
					s.student?.destinationCountry,
				) === status,
		).length;
	const totalStudents = cohortData.length;
	const countAcc = countBy("ACC");
	const countAman = countBy("AMAN");
	const countProses = countBy("PROSES");
	const countPerhatian = countBy("BUTUH_PERHATIAN");

	// Filtered students for Table
	const filteredData = useMemo(() => {
		const q = searchQuery.toLowerCase();
		return cohortData.filter((s: any) => {
			const matchSearch =
				!q ||
				(s.student?.name || "").toLowerCase().includes(q) ||
				(s.student?.nim || "").toLowerCase().includes(q) ||
				(s.student?.program || "").toLowerCase().includes(q) ||
				(s.student?.subProgram || "").toLowerCase().includes(q) ||
				(s.student?.destinationCountry || "").toLowerCase().includes(q) ||
				(s.student?.phone || "").toLowerCase().includes(q) ||
				(s.internship?.internshipCompany || "").toLowerCase().includes(q);

			const status = getMagangDashboardStatus(
				s.internship,
				s.student?.destinationCountry,
			);
			let matchStatus = true;
			if (selectedStatus === "acc") matchStatus = status === "ACC";
			if (selectedStatus === "aman") matchStatus = status === "AMAN";
			if (selectedStatus === "proses") matchStatus = status === "PROSES";
			if (selectedStatus === "butuh_perhatian")
				matchStatus = status === "BUTUH_PERHATIAN";
			if (selectedStatus === "selesai")
				matchStatus = status === "ACC" || status === "AMAN";
			if (selectedStatus === "paspor") matchStatus = isPassportReady(s);
			if (selectedStatus === "agensi")
				matchStatus =
					getAgencyPaymentReminders(s.internship, s.student?.destinationCountry)
						.length > 0;

			return matchSearch && matchStatus;
		});
	}, [cohortData, searchQuery, selectedStatus]);

	// Reset page on filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedCohort, selectedStatus, searchQuery]);

	const paginatedData = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredData.slice(start, start + pageSize);
	}, [filteredData, currentPage]);

	const handleRefresh = () => {
		setIsRefreshing(true);
		onUpdate?.();
		setTimeout(() => setIsRefreshing(false), 600);
	};

	const kpiTiles = [
		{
			key: "all",
			label: "Total Mahasiswa",
			value: totalStudents,
			tone: "bg-blue-50/70 border-blue-100 hover:border-blue-300",
			activeTone: "bg-blue-50 border-[#0517B0]",
			valueTone: "text-[#0517B0]",
		},
		{
			key: "butuh_perhatian",
			label: "Butuh Perhatian",
			value: countPerhatian,
			tone: "bg-rose-50/70 border-rose-100 hover:border-rose-300",
			activeTone: "bg-rose-50 border-rose-500",
			valueTone: "text-rose-700",
		},
		{
			key: "proses",
			label: "Berproses",
			value: countProses,
			tone: "bg-amber-50/70 border-amber-100 hover:border-amber-300",
			activeTone: "bg-amber-50 border-amber-500",
			valueTone: "text-amber-700",
		},
		{
			key: "selesai",
			label: "Aman / ACC",
			value: countAman + countAcc,
			tone: "bg-emerald-50/70 border-emerald-100 hover:border-emerald-300",
			activeTone: "bg-emerald-50 border-emerald-500",
			valueTone: "text-emerald-700",
		},
	];

	const statusFilterLabel = (key: string) =>
		STATUS_FILTER_LABEL[key] ?? "Semua Status";

	const hasActiveFilter =
		searchQuery.trim() !== "" ||
		selectedCohort !== "all" ||
		selectedStatus !== "all";

	return (
		<div className="space-y-6 pb-12">
			{/* Header ringkas: judul + menu aksi */}
			{!hideHeader && (
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0">
						<h1 className="text-xl sm:text-2xl font-bold text-slate-900">
							Dashboard Magang
						</h1>
						<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
							Kesiapan keberangkatan dan penempatan mahasiswa magang.
						</p>
					</div>
				</div>
			)}

			{/* KPI: 4 kartu, klik untuk memfilter tabel */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				{kpiTiles.map((k) => {
					const active = selectedStatus === k.key;
					return (
						<button
							key={k.key}
							type="button"
							aria-pressed={active}
							onClick={() =>
								setSelectedStatus(active || k.key === "all" ? "all" : k.key)
							}
							className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40 ${
								active ? k.activeTone : k.tone
							}`}
						>
							<span
								className={`block text-2xl sm:text-3xl font-bold leading-none tabular-nums ${k.valueTone}`}
							>
								{k.value}
							</span>
							<span className="mt-1.5 block text-xs sm:text-sm font-medium leading-tight text-slate-700">
								{k.label}
							</span>
						</button>
					);
				})}
			</div>

			{selectedStatus !== "all" && (
				<div className="flex items-center gap-2 text-xs text-slate-600">
					<span>Filter aktif:</span>
					<button
						type="button"
						onClick={() => setSelectedStatus("all")}
						className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium hover:bg-slate-50"
					>
						{statusFilterLabel(selectedStatus)}
						<X className="w-3 h-3" />
					</button>
				</div>
			)}

			<section className="rounded-xl border border-slate-200 bg-white">
				{/* Judul + toolbar filter */}
				<div className="space-y-4 p-4 sm:p-6">
					<h2 className="text-base sm:text-lg font-bold text-slate-900">
						Daftar Mahasiswa Magang
					</h2>

					<div className="flex flex-col gap-2.5 md:flex-row md:items-center">
						<div className="relative w-full md:flex-1 md:max-w-md">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari nama, NIM, peminatan, penempatan..."
								className="pl-9 h-10 text-sm bg-white border-slate-200"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-2.5 md:flex md:items-center">
							<Select
								value={selectedCohort}
								onValueChange={(val) => setSelectedCohort(val || "all")}
							>
								<SelectTrigger className="w-full md:w-44 h-10 text-sm bg-white border-slate-200">
									<SelectValue placeholder="Angkatan">
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
								<SelectTrigger className="w-full md:w-52 h-10 text-sm bg-white border-slate-200">
									<SelectValue placeholder="Status Filter">
										{statusFilterLabel(selectedStatus)}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Status</SelectItem>
									<SelectItem value="butuh_perhatian">
										Butuh Perhatian
									</SelectItem>
									<SelectItem value="proses">Berproses</SelectItem>
									<SelectItem value="aman">Aman</SelectItem>
									<SelectItem value="acc">Sudah ACC</SelectItem>
									<SelectItem value="selesai">Aman / ACC</SelectItem>
									<SelectItem value="paspor">Paspor Siap</SelectItem>
									<SelectItem value="agensi">
										Pembayaran agensi tertunda
									</SelectItem>
								</SelectContent>
							</Select>

							{hasActiveFilter && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setSearchQuery("");
										setSelectedCohort("all");
										setSelectedStatus("all");
									}}
									className="col-span-2 md:col-span-1 h-10 px-3 text-sm border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5 font-medium"
								>
									<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
									Reset
								</Button>
							)}
						</div>
					</div>
				</div>

				{/* Desktop & tablet: tabel */}
				<div className="hidden md:block overflow-x-auto border-t border-slate-200">
					<Table>
						<TableHeader className="bg-slate-100/80">
							<TableRow className="border-slate-200 hover:bg-transparent">
								<TableHead className="py-3 pl-6 text-xs font-semibold text-slate-600">
									Mahasiswa
								</TableHead>
								<TableHead className="py-3 text-xs font-semibold text-slate-600">
									Peminatan
								</TableHead>
								<TableHead className="hidden lg:table-cell py-3 text-xs font-semibold text-slate-600">
									Penempatan
								</TableHead>
								<TableHead className="hidden xl:table-cell py-3 text-xs font-semibold text-slate-600">
									WhatsApp
								</TableHead>
								<TableHead className="py-3 text-xs font-semibold text-slate-600 w-44">
									Kesiapan
								</TableHead>
								<TableHead className="py-3 pr-6 text-right w-32">
									<span className="sr-only">Aksi</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{paginatedData.map((s: any) => {
								const { items, completed, total } = getMagangDashboardChecklist(
									s.internship,
									s.student?.destinationCountry,
								);
								const pill =
									STATUS_PILL[
										getMagangDashboardStatus(
											s.internship,
											s.student?.destinationCountry,
										)
									];
								const waUrl = formatWhatsAppUrl(s.student?.phone);
								const company = s.internship?.internshipCompany;

								return (
									<TableRow
										key={s.student.id}
										className="border-slate-100 hover:bg-blue-50/40 transition-colors"
									>
										{/* Mahasiswa */}
										<TableCell className="py-4 pl-6 whitespace-normal min-w-0">
											<Link
												href={`/dashboard/students/${s.student.id}/profile`}
												className="font-semibold text-slate-900 text-sm hover:text-[#0517B0] hover:underline underline-offset-2 [overflow-wrap:anywhere] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40"
												title="Lihat profil mahasiswa"
											>
												{s.student.name}
											</Link>
											<div className="mt-0.5 text-xs text-slate-500">
												<span className="font-mono">
													{s.student.nim || "Belum ada NIM"}
												</span>
												{s.student.cohort && (
													<span> · Angkatan {s.student.cohort}</span>
												)}
											</div>
											{/* Penempatan di bawah nama saat kolomnya disembunyikan (<1024px) */}
											{company && (
												<div className="lg:hidden mt-1 text-xs text-slate-600 [overflow-wrap:anywhere]">
													{company}
												</div>
											)}
											{/* WA di bawah nama saat kolom WhatsApp disembunyikan (<1280px) */}
											{waUrl && (
												<a
													href={waUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="xl:hidden mt-1 inline-flex items-center gap-1 text-xs font-mono text-slate-600 hover:text-emerald-700"
													aria-label={`Chat WhatsApp ${s.student.name}`}
												>
													<MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
													{s.student.phone}
												</a>
											)}
										</TableCell>

										{/* Peminatan (dengan bendera) */}
										<TableCell className="py-4 whitespace-normal">
											<PeminatanBadge
												subProgram={s.student.subProgram}
												destinationCountry={s.student.destinationCountry}
												program={s.student.program}
												variant="inline"
												className="text-sm"
											/>
										</TableCell>

										{/* Penempatan */}
										<TableCell className="hidden lg:table-cell py-4 whitespace-normal text-sm text-slate-700">
											{company || <span className="text-slate-400">—</span>}
										</TableCell>

										{/* WhatsApp */}
										<TableCell className="hidden xl:table-cell py-4">
											{s.student?.phone ? (
												waUrl ? (
													<a
														href={waUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1.5 text-sm font-mono text-slate-700 hover:text-emerald-700 transition-colors"
														title="Chat WhatsApp"
													>
														<MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
														{s.student.phone}
													</a>
												) : (
													<span className="text-sm font-mono text-slate-700">
														{s.student.phone}
													</span>
												)
											) : (
												<span className="text-slate-400 text-sm">—</span>
											)}
										</TableCell>

										{/* Kesiapan: satu pill status; tooltip ✓/✗ per tahap */}
										<TableCell className="py-4">
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40">
														<span
															className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pill.className}`}
														>
															<span
																className={`size-1.5 rounded-full ${pill.dot}`}
															/>
															{pill.label}
															<span className="font-normal tabular-nums opacity-70">
																{completed}/{total}
															</span>
														</span>
													</TooltipTrigger>
													<TooltipContent className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs">
														<ul className="space-y-1">
															{items.map((it) => (
																<li
																	key={it.name}
																	className="flex items-center gap-2"
																>
																	<span
																		className={
																			it.done
																				? "text-emerald-400"
																				: "text-rose-400"
																		}
																		aria-hidden="true"
																	>
																		{it.done ? "✓" : "✗"}
																	</span>
																	{it.name}
																	<span className="sr-only">
																		{it.done ? "siap" : "belum siap"}
																	</span>
																</li>
															))}
														</ul>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
											{getAgencyPaymentReminders(
												s.internship,
												s.student?.destinationCountry,
											).length > 0 && (
												<div className="mt-1 text-xs font-medium text-amber-800">
													⚠ Pembayaran agensi tertunda
												</div>
											)}
										</TableCell>

										{/* Aksi: hanya tombol Periksa */}
										<TableCell className="py-4 pr-6 text-right">
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													router.push(
														`/dashboard/students/${s.student.id}?tab=magang`,
													)
												}
												className="h-9 px-3 text-sm font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 hover:text-[#0517B0] gap-1"
												title="Periksa Berkas & Modul Magang"
											>
												Periksa
												<ChevronRight className="w-4 h-4" />
											</Button>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>

				{/* Mobile: daftar satu kolom, tanpa scroll horizontal */}
				<ul className="md:hidden divide-y divide-slate-100 border-t border-slate-200">
					{paginatedData.map((s: any) => {
						const { completed, total } = getMagangDashboardChecklist(
							s.internship,
							s.student?.destinationCountry,
						);
						const pill =
							STATUS_PILL[
								getMagangDashboardStatus(
									s.internship,
									s.student?.destinationCountry,
								)
							];
						const waUrl = formatWhatsAppUrl(s.student?.phone);
						const company = s.internship?.internshipCompany;
						return (
							<li key={s.student.id} className="space-y-2.5 p-4">
								<div className="min-w-0">
									<Link
										href={`/dashboard/students/${s.student.id}/profile`}
										className="font-semibold text-slate-900 text-base [overflow-wrap:anywhere] hover:text-[#0517B0]"
									>
										{s.student.name}
									</Link>
									<div className="mt-0.5 text-xs text-slate-500">
										<span className="font-mono">
											{s.student.nim || "Belum ada NIM"}
										</span>
										{s.student.cohort && (
											<span> · Angkatan {s.student.cohort}</span>
										)}
									</div>
								</div>
								<PeminatanBadge
									subProgram={s.student.subProgram}
									destinationCountry={s.student.destinationCountry}
									program={s.student.program}
									variant="inline"
									className="text-sm min-w-0"
								/>
								{company && (
									<p className="text-sm text-slate-700 [overflow-wrap:anywhere]">
										<span className="text-slate-500">Penempatan: </span>
										{company}
									</p>
								)}
								<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
									<span
										className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pill.className}`}
									>
										<span className={`size-1.5 rounded-full ${pill.dot}`} />
										{pill.label}
										<span className="font-normal tabular-nums opacity-70">
											{completed}/{total}
										</span>
									</span>
									{getAgencyPaymentReminders(
										s.internship,
										s.student?.destinationCountry,
									).length > 0 && (
										<span className="text-xs font-medium text-amber-800">
											⚠ Pembayaran agensi tertunda
										</span>
									)}

									{waUrl && (
										<a
											href={waUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex min-h-11 items-center gap-1 text-xs font-mono text-slate-700"
											aria-label={`Chat WhatsApp ${s.student.name}`}
										>
											<MessageCircle className="w-4 h-4 text-emerald-600" />
											{s.student.phone}
										</a>
									)}
								</div>
								<Button
									variant="outline"
									onClick={() =>
										router.push(
											`/dashboard/students/${s.student.id}?tab=magang`,
										)
									}
									className="w-full h-11 text-sm font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 hover:text-[#0517B0] gap-1"
								>
									Periksa
									<ChevronRight className="w-4 h-4" />
								</Button>
							</li>
						);
					})}
				</ul>

				{filteredData.length === 0 && (
					<div className="border-t border-slate-200 px-4 py-12 text-center">
						<p className="text-sm font-semibold text-slate-700">
							Tidak ada mahasiswa magang yang cocok.
						</p>
						<p className="text-sm text-slate-500 mt-1">
							Ubah kata kunci atau filter, atau tekan Reset.
						</p>
					</div>
				)}

				<div className="border-t border-slate-200">
					<TablePagination
						currentPage={currentPage}
						totalItems={filteredData.length}
						pageSize={pageSize}
						onPageChange={setCurrentPage}
						itemName="Mahasiswa Magang"
					/>
				</div>
			</section>
		</div>
	);
}
