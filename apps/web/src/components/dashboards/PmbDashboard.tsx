"use client";

import {
	Archive,
	CheckCircle2,
	ChevronRight,
	FilePlus,
	MessageCircle,
	MoreHorizontal,
	Phone,
	Plus,
	RotateCcw,
	Search,
	ShieldAlert,
	UserPlus,
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
import { calculateCohortFromYear } from "@/lib/cohort-generator";
import { api } from "@/lib/eden";
import { hasRole, useAuthStore } from "@/store";
import { normalizeStatus } from "@/utils/status";

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
	onUpdate,
}: any) {
	const router = useRouter();
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [localSearch, setLocalSearch] = useState(searchQuery || "");
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 20;

	useEffect(() => {
		const handleSync = () => {
			onUpdate?.();
		};
		window.addEventListener("pmb-progress-sync", handleSync);
		window.addEventListener("student-updated", handleSync);
		return () => {
			window.removeEventListener("pmb-progress-sync", handleSync);
			window.removeEventListener("student-updated", handleSync);
		};
	}, [onUpdate]);

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
					s.student?.cohort ===
						calculateCohortFromYear(Number(selectedCohort))),
		);
	}, [data, selectedCohort]);

	// Sama dengan aturan ACC: 5 berkas utama + 9 dokumen wajib = 14 (opsional tidak dihitung)
	const getPmbChecklist = (pmb: any) => {
		const items = [
			{
				name: "Formulir Masuk",
				done: Boolean(pmb?.formReceived),
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
			{
				name: "Pas Foto (Standar Visa / Formal)",
				done: Boolean(pmb?.pasFoto),
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
			{ name: "Surat SKBM", done: Boolean(pmb?.docSkbm), category: "Dokumen" },
			{
				name: "Pre-Medical Check Up",
				done: Boolean(pmb?.docPreMcu),
				category: "Dokumen",
			},
			{
				name: "Service Level Agreement (SLA)",
				done: Boolean(pmb?.docSla),
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

	// Syarat ACC per tab (sama dengan aturan ACC di server)
	const getAccTabs = (pmb: any) => {
		const { completed, total } = getPmbChecklist(pmb);
		const feeTotal = Number(pmb?.feeTotal ?? 0);
		const feePaid = Number(pmb?.feePaid ?? 0);
		return {
			dokumen: total > 0 && completed >= total,
			keuangan: Boolean(pmb?.keuanganOk),
			fee: feeTotal > 0 && feePaid === feeTotal,
		};
	};

	const getStudentPmbStatus = (pmb: any) => {
		if (pmb?.isAcc) return "ACC";
		const t = getAccTabs(pmb);
		const done = [t.dokumen, t.keuangan, t.fee].filter(Boolean).length;
		if (done === 3) return "SIAP_ACC";
		return done > 0 ? "PROSES" : "BUTUH_PERHATIAN";
	};

	// KPI berdasarkan status yang sama dengan kolom Kelengkapan
	const totalStudents = cohortData.length;
	const countAcc = cohortData.filter(
		(s: any) => getStudentPmbStatus(s.pmb) === "ACC",
	).length;
	const countSiap = cohortData.filter(
		(s: any) => getStudentPmbStatus(s.pmb) === "SIAP_ACC",
	).length;
	const countProses = cohortData.filter(
		(s: any) => getStudentPmbStatus(s.pmb) === "PROSES",
	).length;
	const countPerhatian = cohortData.filter(
		(s: any) => getStudentPmbStatus(s.pmb) === "BUTUH_PERHATIAN",
	).length;

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

			const pmbStatus = getStudentPmbStatus(s.pmb);
			let matchStatus = true;
			if (selectedStatus === "acc") matchStatus = pmbStatus === "ACC";
			if (selectedStatus === "siap") matchStatus = pmbStatus === "SIAP_ACC";
			if (selectedStatus === "proses") matchStatus = pmbStatus === "PROSES";
			if (selectedStatus === "butuh_perhatian")
				matchStatus = pmbStatus === "BUTUH_PERHATIAN";
			if (selectedStatus === "selesai")
				matchStatus = pmbStatus === "ACC" || pmbStatus === "SIAP_ACC";

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

	const kpiTiles = [
		{
			key: "all",
			label: "Total Pendaftar",
			value: totalStudents,
			tone: "bg-blue-50/70 border-blue-100 hover:border-blue-300",
			activeTone: "bg-blue-50 border-[#0517B0]",
			valueTone: "text-[#0517B0]",
		},
		{
			key: "butuh_perhatian",
			label: "Perlu Perhatian",
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
			label: "Siap ACC / ACC",
			value: countAcc + countSiap,
			tone: "bg-emerald-50/70 border-emerald-100 hover:border-emerald-300",
			activeTone: "bg-emerald-50 border-emerald-500",
			valueTone: "text-emerald-700",
		},
	];

	// Satu-satunya indikator status per baris (konsisten dengan KPI & filter)
	const STATUS_PILL: Record<
		string,
		{ label: string; className: string; dot: string }
	> = {
		ACC: {
			label: "ACC",
			className: "bg-blue-50 text-[#0517B0] border-blue-200",
			dot: "bg-[#0517B0]",
		},
		SIAP_ACC: {
			label: "Siap ACC",
			className: "bg-emerald-50 text-emerald-700 border-emerald-200",
			dot: "bg-emerald-500",
		},
		PROSES: {
			label: "Berproses",
			className: "bg-amber-50 text-amber-800 border-amber-200",
			dot: "bg-amber-500",
		},
		BUTUH_PERHATIAN: {
			label: "Perlu Perhatian",
			className: "bg-rose-50 text-rose-700 border-rose-200",
			dot: "bg-rose-500",
		},
	};

	const statusFilterLabel = (key: string) =>
		({
			acc: "Sudah ACC",
			siap: "Siap ACC",
			proses: "Berproses",
			selesai: "Siap ACC / ACC",
			butuh_perhatian: "Perlu Perhatian",
		})[key] ?? "Semua Status";

	return (
		<div className="space-y-6 pb-12">
			{/* Header ringkas: satu aksi utama + menu aksi lain */}
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0">
					<h1 className="text-xl sm:text-2xl font-bold text-slate-900">
						Dashboard PMB
					</h1>
					<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
						Verifikasi berkas dan checklist pendaftar baru.
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					{hasRole(user, "pmb") && (
						<Link href="/dashboard/students/add">
							<Button
								size="sm"
								className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs sm:text-sm gap-1.5 h-10 font-bold shadow-sm"
							>
								<UserPlus className="w-4 h-4" />
								<span className="hidden sm:inline">Tambah Mahasiswa</span>
								<span className="sm:hidden">Tambah</span>
							</Button>
						</Link>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger
							aria-label="Aksi lainnya"
							className="inline-flex size-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 outline-none"
						>
							<MoreHorizontal className="w-4 h-4" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-44">
							{hasRole(user, "pmb") && (
								<DropdownMenuItem
									onClick={() => router.push("/dashboard/students/archive")}
								>
									<Archive className="w-4 h-4" />
									Lihat Arsip
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

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
				{/* Judul + toolbar filter (baris sendiri agar tidak berdesakan) */}
				<div className="space-y-4 p-4 sm:p-6">
					<h2 className="text-base sm:text-lg font-bold text-slate-900">
						Daftar Pendaftar
					</h2>

					<div className="flex flex-col gap-2.5 md:flex-row md:items-center">
						<div className="relative w-full md:flex-1 md:max-w-md">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari nama, NIM, peminatan, WA..."
								className="pl-9 h-10 text-sm bg-white border-slate-200"
								value={searchQuery !== undefined ? searchQuery : localSearch}
								onChange={(e) => {
									setLocalSearch(e.target.value);
									setSearchQuery?.(e.target.value);
								}}
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
										{selectedStatus === "all"
											? "Semua Status"
											: statusFilterLabel(selectedStatus)}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Status</SelectItem>
									<SelectItem value="butuh_perhatian">
										Perlu Perhatian
									</SelectItem>
									<SelectItem value="proses">Berproses</SelectItem>
									<SelectItem value="siap">Siap ACC</SelectItem>
									<SelectItem value="acc">Sudah ACC</SelectItem>
									<SelectItem value="selesai">Siap ACC / ACC</SelectItem>
								</SelectContent>
							</Select>

							{/* Reset Button Inline */}
							{((searchQuery !== undefined
								? searchQuery
								: localSearch
							).trim() !== "" ||
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
									Pendaftar
								</TableHead>
								<TableHead className="py-3 text-xs font-semibold text-slate-600">
									Peminatan
								</TableHead>
								<TableHead className="hidden xl:table-cell py-3 text-xs font-semibold text-slate-600">
									WhatsApp
								</TableHead>
								<TableHead className="py-3 text-xs font-semibold text-slate-600 w-56">
									Kelengkapan
								</TableHead>
								<TableHead className="py-3 pr-6 text-right w-32">
									<span className="sr-only">Aksi</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{paginatedData.map((s: any) => {
								const tabs = getAccTabs(s.pmb);
								const pill =
									STATUS_PILL[getStudentPmbStatus(s.pmb)] ??
									STATUS_PILL.BUTUH_PERHATIAN;
								const waUrl = formatWhatsAppUrl(s.student?.phone);

								return (
									<TableRow
										key={s.student.id}
										className="border-slate-100 hover:bg-blue-50/40 transition-colors"
									>
										{/* Pendaftar */}
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

										{/* Kelengkapan: satu pill status; tooltip 3 baris (✓/✗ per tab) */}
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
														</span>
													</TooltipTrigger>
													<TooltipContent className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs">
														<ul className="space-y-1">
															{[
																["Dokumen", tabs.dokumen],
																["Skema Keuangan", tabs.keuangan],
																["Fee Sharing", tabs.fee],
															].map(([label, ok]) => (
																<li
																	key={label as string}
																	className="flex items-center gap-2"
																>
																	<span
																		className={
																			ok ? "text-emerald-400" : "text-rose-400"
																		}
																		aria-hidden="true"
																	>
																		{ok ? "✓" : "✗"}
																	</span>
																	{label as string}
																	<span className="sr-only">
																		{ok ? "lengkap" : "belum lengkap"}
																	</span>
																</li>
															))}
														</ul>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</TableCell>

										{/* Aksi: hanya tombol Periksa */}
										<TableCell className="py-4 pr-6 text-right">
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													router.push(
														`/dashboard/students/${s.student.id}?tab=pmb`,
													)
												}
												className="h-9 px-3 text-sm font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 hover:text-[#0517B0] gap-1"
												title="Periksa Berkas & Modul PMB"
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
						const pill =
							STATUS_PILL[getStudentPmbStatus(s.pmb)] ??
							STATUS_PILL.BUTUH_PERHATIAN;
						const waUrl = formatWhatsAppUrl(s.student?.phone);
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
								<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
									<span
										className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pill.className}`}
									>
										<span className={`size-1.5 rounded-full ${pill.dot}`} />
										{pill.label}
									</span>

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
										router.push(`/dashboard/students/${s.student.id}?tab=pmb`)
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
							Tidak ada pendaftar yang cocok.
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
						itemName="Pendaftar PMB"
					/>
				</div>
			</section>
		</div>
	);
}
