"use client";

import {
	Calendar,
	Check,
	CheckCircle,
	Clock,
	CreditCard,
	Download,
	Eye,
	HelpCircle,
	MessageCircle,
	Phone,
	RotateCcw,
	Search,
	ShieldCheck,
	Sparkles,
	Target,
	TrendingUp,
	User,
	Users,
	UtensilsCrossed,
	Wallet,
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
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";

function formatRupiah(num: number): string {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(num || 0);
}

function formatShortRupiah(num: number): string {
	if (num >= 1_000_000_000) {
		return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} M`;
	}
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")} Jt`;
	}
	if (num >= 1_000) {
		return `${(num / 1_000).toFixed(0)} Rb`;
	}
	return num.toString();
}

/** Hitung total uang masuk riil yang sudah dibayarkan oleh seorang mahasiswa */
function calculateTotalPaidStudent(s: any): number {
	let total = 0;
	const fin = s.finance;
	if (!fin) return 0;

	// 1. Registrasi Awal
	if (fin.registrasiStatus || fin.registrationPaid) {
		total += Number(fin.registrasiNominal) || 0;
	}

	// 2. Pembayaran Semester (Mandiri)
	if (s.financeInstallments && s.financeInstallments.length > 0) {
		for (const inst of s.financeInstallments) {
			total += Number(inst.nominalPaid) || 0;
		}
	} else if (fin.mandiriSemesterStatus && fin.mandiriSemesterNominal) {
		total += Number(fin.mandiriSemesterNominal) || 0;
	}

	// 3. Pembayaran Cicilan Dana Talangan (Tahap 1 & Tahap 2)
	let hasTalanganInstallments = false;
	if (
		s.financeTalanganInstallments &&
		s.financeTalanganInstallments.length > 0
	) {
		for (const inst of s.financeTalanganInstallments) {
			total += Number(inst.nominalPaid) || 0;
			hasTalanganInstallments = true;
		}
	}

	if (!hasTalanganInstallments) {
		if (fin.t1SemesterNominalDibayar) {
			total += Number(fin.t1SemesterNominalDibayar) || 0;
		}
		// Interview Magang
		if (fin.mandiriInterviewStatus) {
			total += Number(fin.mandiriInterviewNominal) || 0;
		} else if (fin.t1InterviewStatus) {
			total += Number(fin.t1InterviewNominal) || 0;
		}
		// Keberangkatan
		if (fin.mandiriKeberangkatanStatus) {
			total += Number(fin.mandiriKeberangkatanNominal) || 0;
		} else if (fin.t2KeberangkatanStatus) {
			total += Number(fin.t2KeberangkatanNominal) || 0;
		}
	} else {
		if (fin.metodePembayaran === "mandiri") {
			if (fin.mandiriInterviewStatus) {
				total += Number(fin.mandiriInterviewNominal) || 0;
			}
			if (fin.mandiriKeberangkatanStatus) {
				total += Number(fin.mandiriKeberangkatanNominal) || 0;
			}
		}
	}

	// 5. Biaya Administrasi Talangan
	if (fin.adminTalaganStatus) {
		total += Number(fin.adminTalaganNominal) || 0;
	}

	// 6. Biaya Tambahan Standar
	if (fin.toeicStatus) {
		total += Number(fin.toeicNominal) || 0;
	}
	if (fin.pasporStatus) {
		total += Number(fin.pasporNominal) || 0;
	}
	if (fin.rumahJuangStatus) {
		total += Number(fin.rumahJuangNominal) || 0;
	}

	// 7. Custom Fields
	if (s.financeCustomFields && s.financeCustomFields.length > 0) {
		for (const cf of s.financeCustomFields) {
			if (cf.status) {
				total += Number(cf.nominal) || 0;
			}
		}
	}

	return total;
}

/** Hitung timestamp aktivitas terbaru dari seorang mahasiswa */
function getStudentLatestTimestamp(s: any): number {
	let latest = 0;

	const parseTime = (val: any): number => {
		if (!val) return 0;
		const t = new Date(val).getTime();
		return Number.isNaN(t) ? 0 : t;
	};

	// 1. Finance updated_at
	latest = Math.max(latest, parseTime(s.finance?.updatedAt));

	// 2. Student updated_at & created_at
	latest = Math.max(latest, parseTime(s.student?.updatedAt));
	latest = Math.max(latest, parseTime(s.student?.createdAt));

	// 3. Installments
	if (
		Array.isArray(s.financeInstallments) &&
		s.financeInstallments.length > 0
	) {
		for (const inst of s.financeInstallments) {
			latest = Math.max(
				latest,
				parseTime(inst.paymentDate),
				parseTime(inst.createdAt),
				parseTime(inst.updatedAt),
			);
		}
	}

	// 4. Semesters
	if (Array.isArray(s.financeSemesters) && s.financeSemesters.length > 0) {
		for (const sem of s.financeSemesters) {
			latest = Math.max(
				latest,
				parseTime(sem.updatedAt),
				parseTime(sem.createdAt),
			);
		}
	}

	// 5. Custom fields
	if (
		Array.isArray(s.financeCustomFields) &&
		s.financeCustomFields.length > 0
	) {
		for (const cf of s.financeCustomFields) {
			latest = Math.max(
				latest,
				parseTime(cf.updatedAt),
				parseTime(cf.createdAt),
			);
		}
	}

	// 6. Milestone paid dates
	if (s.finance) {
		latest = Math.max(
			latest,
			parseTime(s.finance.registrasiPaidDate),
			parseTime(s.finance.mandiriSemesterPaidDate),
			parseTime(s.finance.t1SemesterPaidDate),
			parseTime(s.finance.t2KeberangkatanPaidDate),
			parseTime(s.finance.toeicPaidDate),
			parseTime(s.finance.accAt),
		);
	}

	return latest;
}

function formatWhatsAppUrl(phone: string | null | undefined) {
	if (!phone) return null;
	const clean = phone.replace(/[^0-9]/g, "");
	if (!clean) return null;
	const formatted = clean.startsWith("0") ? `62${clean.slice(1)}` : clean;
	return `https://wa.me/${formatted}`;
}

export function FinanceDashboard({ user, data = [] }: any) {
	const router = useRouter();
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<
		"recent" | "oldest" | "name" | "paid_desc"
	>("recent");

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
	const countAcc = cohortData.filter((s: any) => s.finance?.isAcc).length;
	const countAman = cohortData.filter(
		(s: any) => s.finance?.status === "AMAN",
	).length;
	const countProses = cohortData.filter(
		(s: any) => s.finance?.status === "PROSES",
	).length;
	const countPerhatian = cohortData.filter(
		(s: any) =>
			s.finance?.status === "BUTUH_PERHATIAN" ||
			s.finance?.status === "PERLU_PERHATIAN" ||
			s.finance?.status === "TIDAK_AMAN" ||
			!s.finance?.status,
	).length;
	const countTidakAman = countPerhatian;
	const countLunasRegistrasi = cohortData.filter(
		(s: any) => s.finance?.registrasiStatus || s.finance?.registrationPaid,
	).length;

	// Filtered & Sorted students for Table (Default: Dynamic Updated At)
	const filteredData = useMemo(() => {
		const q = searchQuery.toLowerCase();
		const result = cohortData.filter((s: any) => {
			const matchSearch =
				!q ||
				(s.student?.name || "").toLowerCase().includes(q) ||
				(s.student?.nim || "").toLowerCase().includes(q) ||
				(s.student?.phone || "").toLowerCase().includes(q) ||
				(s.student?.academicYear || "").toLowerCase().includes(q) ||
				(s.student?.program || "").toLowerCase().includes(q) ||
				(s.student?.subProgram || "").toLowerCase().includes(q);

			const financeStatus = s.finance?.status || "PERLU_PERHATIAN";
			let matchStatus = true;
			if (selectedStatus === "acc") matchStatus = Boolean(s.finance?.isAcc);
			if (selectedStatus === "aman") matchStatus = financeStatus === "AMAN";
			if (selectedStatus === "proses" || selectedStatus === "perhatian")
				matchStatus =
					financeStatus === "PROSES" || financeStatus === "PERLU_PERHATIAN";
			if (
				selectedStatus === "butuh_perhatian" ||
				selectedStatus === "tidak_aman"
			)
				matchStatus =
					financeStatus === "BUTUH_PERHATIAN" ||
					financeStatus === "TIDAK_AMAN" ||
					financeStatus === "PERLU_PERHATIAN";

			return matchSearch && matchStatus;
		});

		// Urutan Dinamis (Default: Paling baru diperbarui / dibuat di paling ATAS)
		return [...result].sort((a: any, b: any) => {
			if (sortBy === "name") {
				return (a.student?.name || "").localeCompare(b.student?.name || "");
			}
			if (sortBy === "paid_desc") {
				const diff =
					calculateTotalPaidStudent(b) - calculateTotalPaidStudent(a);
				if (diff !== 0) return diff;
				return (b.student?.id || 0) - (a.student?.id || 0);
			}
			if (sortBy === "oldest") {
				const timeA = getStudentLatestTimestamp(a);
				const timeB = getStudentLatestTimestamp(b);
				if (timeA !== timeB) return timeA - timeB;
				return (a.student?.id || 0) - (b.student?.id || 0);
			}
			// Default: "recent" (updatedAt/createdAt terbaru berada di paling ATAS)
			const timeA = getStudentLatestTimestamp(a);
			const timeB = getStudentLatestTimestamp(b);
			if (timeB !== timeA) {
				return timeB - timeA; // Descending: Terbaru -> Terlama
			}
			// Tie-breaker: ID terbesar (mahasiswa terdaftar paling baru) di paling atas
			return (b.student?.id || 0) - (a.student?.id || 0);
		});
	}, [cohortData, searchQuery, selectedStatus, sortBy]);

	// Reset page on filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedCohort, selectedStatus, searchQuery]);

	const paginatedData = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredData.slice(start, start + pageSize);
	}, [filteredData, currentPage]);

	const handleExport = () => {
		const exportData = filteredData.map((s: any) => ({
			Nama: s.student?.name || "-",
			NIM: s.student?.nim || "-",
			Angkatan: s.student?.cohort || "-",
			"Tahun Ajaran": s.student?.academicYear || "-",
			"Program Studi": s.student?.program || "-",
			Peminatan: s.student?.subProgram || "-",
			"No. HP/WhatsApp": s.student?.phone || "-",
			"Total Terbayar": formatRupiah(calculateTotalPaidStudent(s)),
			"Status Registrasi": s.finance?.registrasiStatus ? "Lunas" : "Belum",
			"Cicilan Mandiri / T1":
				s.finance?.mandiriSemesterStatus || s.finance?.t1SemesterStatus
					? "Lunas"
					: "Belum",
			"Biaya Sertifikasi Bahasa": s.finance?.toeicStatus ? "Lunas" : "Belum",
			"Biaya Paspor": s.finance?.pasporStatus ? "Lunas" : "Belum",
			"Status Finance":
				s.finance?.status === "AMAN"
					? "Aman"
					: s.finance?.status === "TIDAK_AMAN"
						? "Tidak Aman"
						: "Perlu Perhatian",
			"Status ACC Finance": s.finance?.isAcc ? "Sudah ACC" : "Belum",
			"Terakhir Diperbarui": s.finance?.updatedAt
				? new Date(s.finance.updatedAt).toLocaleString("id-ID")
				: "-",
		}));
		exportToCSV(
			exportData,
			`Data_Finance_${selectedCohort !== "all" ? `Angkatan_${selectedCohort}_` : ""}${new Date().toISOString().split("T")[0]}`,
		);
	};

	const getFinanceChecklist = (fin: any, destCountry?: string | null) => {
		const isTalangan = fin?.metodePembayaran === "dana_talangan";
		const isSemesterDone = isTalangan
			? Boolean(fin?.t1SemesterStatus || fin?.mandiriSemesterStatus)
			: Boolean(fin?.mandiriSemesterStatus);
		const isInterviewDone = isTalangan
			? Boolean(fin?.t1InterviewStatus)
			: Boolean(
					fin?.kontrakMagangStatus ||
						fin?.suhanStatus ||
						fin?.mandiriInterviewStatus,
				);
		const isKeberangkatanDone = isTalangan
			? Boolean(fin?.t2KeberangkatanStatus)
			: Boolean(fin?.mandiriKeberangkatanStatus);

		const penempatanLabel = (destCountry || "")
			.toLowerCase()
			.includes("malaysia")
			? "Penempatan Magang D3 Malaysia / Keberangkatan"
			: "Penempatan Magang Taiwan / Keberangkatan";

		const items = [
			{
				name: "Registrasi / Pendaftaran",
				done: Boolean(fin?.registrasiStatus || fin?.registrationPaid),
			},
			{
				name: isTalangan
					? "Pembayaran SPP Semester 1 (Talangan)"
					: "Pembayaran SPP Semester 1",
				done: isSemesterDone,
			},
			{
				name: "Kontrak Magang / Suhan",
				done: isInterviewDone,
			},
			{
				name: penempatanLabel,
				done: isKeberangkatanDone,
			},
			{ name: "Biaya Sertifikasi Bahasa", done: Boolean(fin?.toeicStatus) },
			{ name: "Biaya Paspor & Dokumen", done: Boolean(fin?.pasporStatus) },
		];
		const completed = items.filter((i) => i.done).length;
		return {
			items,
			completed,
			total: items.length,
			isDone: completed === items.length,
		};
	};

	// KPI card data for compact summary in Light Theme
	const kpiCards = [
		{
			label: "Total Mahasiswa",
			value: totalStudents,
			icon: Users,
			color: "blue" as const,
		},
		{
			label: "Aman / Lunas",
			value: countAman,
			icon: CheckCircle,
			color: "emerald" as const,
		},
		{
			label: "Sedang Proses",
			value: countPerhatian,
			icon: Clock,
			color: "amber" as const,
		},
		{
			label: "Menunggak",
			value: countTidakAman,
			icon: XCircle,
			color: "rose" as const,
		},
		{
			label: "ACC Finance",
			value: countAcc,
			icon: ShieldCheck,
			color: "indigo" as const,
		},
		{
			label: "Lunas Registrasi",
			value: countLunasRegistrasi,
			icon: CreditCard,
			color: "sky" as const,
		},
	];

	return (
		<div className="space-y-5 pb-12">
			{/* ─── 1. TOP COMPACT HEADER BAR ─── */}
			<div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-blue-50 text-[#0517B0] rounded-xl border border-blue-100/80 shadow-2xs">
							<Wallet className="w-5 h-5" />
						</div>
						<div>
							<h1 className="text-xl font-bold text-slate-900 tracking-tight">
								Dashboard Finance
							</h1>
							<p className="text-slate-500 text-xs mt-0.5">
								Pusat kendali transaksi uang masuk dan monitoring kepatuhan
								pembayaran mahasiswa.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Select
							value={selectedCohort}
							onValueChange={(val) => setSelectedCohort(val || "all")}
						>
							<SelectTrigger className="w-[150px] h-8.5 text-xs bg-white border-slate-200 font-semibold text-slate-700 shadow-2xs rounded-lg">
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

						<Link href="/dashboard/finance/proyeksi">
							<Button
								variant="outline"
								size="sm"
								className="border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-[#0517B0] hover:border-blue-200 text-xs gap-1.5 h-8.5 font-semibold shadow-2xs rounded-lg transition-all"
							>
								<TrendingUp className="w-3.5 h-3.5 text-blue-600" />
								Proyeksi & Realisasi
							</Button>
						</Link>

						<Link href="/dashboard/finance/anggaran-praktik">
							<Button
								variant="outline"
								size="sm"
								className="border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-[#0517B0] hover:border-blue-200 text-xs gap-1.5 h-8.5 font-semibold shadow-2xs rounded-lg transition-all"
							>
								<UtensilsCrossed className="w-3.5 h-3.5 text-slate-500" />
								Anggaran Praktik
							</Button>
						</Link>

						<Button
							variant="outline"
							size="sm"
							onClick={handleExport}
							className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-8.5 font-semibold shadow-2xs rounded-lg"
						>
							<Download className="w-3.5 h-3.5 text-slate-500" />
							Export CSV
						</Button>
					</div>
				</div>
			</div>

			{/* ─── 2. RINGKASAN STATUS MAHASISWA (COMPACT KPI CARDS) ─── */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
				{kpiCards.map((kpi) => (
					<NeumorphicStatCard
						key={kpi.label}
						label={kpi.label}
						value={kpi.value}
						icon={kpi.icon}
						color={kpi.color}
					/>
				))}
			</div>

			{/* ─── 3. KOMPONEN 1: TABEL KELENGKAPAN FINANCE (MONITORING UTAMA) ─── */}
			<Card className="bg-white border-slate-200/90 shadow-2xs overflow-hidden rounded-xl">
				<CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3">
					{/* Row 1: Title + Count + Search + Sort */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div className="flex items-center gap-2.5">
							<div className="p-2 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-100/70 shadow-2xs">
								<Wallet className="w-4 h-4" />
							</div>
							<div className="flex items-center gap-2">
								<CardTitle className="text-base font-bold text-slate-900 tracking-tight">
									Data Keuangan Mahasiswa
								</CardTitle>
								<span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-mono border border-slate-200/60">
									{filteredData.length} Mahasiswa
								</span>
							</div>
						</div>

						{/* Right Controls: Search + Sort */}
						<div className="flex items-center gap-2">
							{/* Compact Search Bar */}
							<div className="relative w-full sm:w-60">
								<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
								<Input
									placeholder="Cari nama, NIM, kontak..."
									className="pl-8 h-8.5 text-xs bg-slate-50/80 border-slate-200 focus:bg-white focus:border-[#0517B0]/40 rounded-lg shadow-2xs transition-colors"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>

							{/* Clean Sort Dropdown */}
							<Select
								value={sortBy}
								onValueChange={(val: any) => setSortBy(val)}
							>
								<SelectTrigger className="w-[145px] h-8.5 text-xs bg-white border-slate-200 font-medium text-slate-700 shadow-2xs rounded-lg">
									<SelectValue placeholder="Urutkan">
										{sortBy === "recent" && "Terbaru"}
										{sortBy === "oldest" && "Terlama"}
										{sortBy === "name" && "Nama (A-Z)"}
										{sortBy === "paid_desc" && "Total Bayar"}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="recent">Terbaru</SelectItem>
									<SelectItem value="oldest">Terlama</SelectItem>
									<SelectItem value="name">Nama (A-Z)</SelectItem>
									<SelectItem value="paid_desc">Total Bayar</SelectItem>
								</SelectContent>
							</Select>

							{(searchQuery.trim() !== "" ||
								sortBy !== "recent" ||
								selectedCohort !== "all" ||
								selectedStatus !== "all") && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setSearchQuery("");
										setSortBy("recent");
										setSelectedCohort("all");
										setSelectedStatus("all");
									}}
									className="h-8.5 px-2.5 text-xs border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5 font-medium shadow-2xs rounded-lg transition-colors"
								>
									<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
									Reset
								</Button>
							)}
						</div>
					</div>

					{/* Row 2: Status Filter Tabs (Segmented Control) */}
					<div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto">
						{[
							{ key: "all", label: "Semua", count: totalStudents },
							{ key: "acc", label: "Sudah ACC", count: countAcc },
							{ key: "aman", label: "Aman", count: countAman },
							{
								key: "proses",
								label: "Berproses",
								count: countProses || countPerhatian,
							},
							{
								key: "butuh_perhatian",
								label: "Butuh Perhatian",
								count: countPerhatian,
							},
						].map((tab) => (
							<button
								key={tab.key}
								type="button"
								onClick={() => setSelectedStatus(tab.key)}
								className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
									selectedStatus === tab.key
										? "bg-white text-slate-900 shadow-xs font-bold"
										: "text-slate-600 hover:text-slate-900 hover:bg-white/50"
								}`}
							>
								<span>{tab.label}</span>
								<span
									className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
										selectedStatus === tab.key
											? "bg-slate-100 text-slate-800"
											: "bg-slate-200/70 text-slate-500"
									}`}
								>
									{tab.count}
								</span>
							</button>
						))}
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
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right w-36">
										Total Pembayaran
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
										Progress (6)
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
										Status Finance
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right pr-6 w-24">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedData.map((s: any, idx: number) => {
									const { items, completed, total, isDone } =
										getFinanceChecklist(
											s.finance,
											s.student?.destinationCountry,
										);
									const totalPaid = calculateTotalPaidStudent(s);
									const waUrl = formatWhatsAppUrl(s.student?.phone);

									return (
										<TableRow
											key={s.student.id}
											className="border-slate-100 hover:bg-blue-50/40 transition-colors"
										>
											{/* 1. Nama & NIM */}
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

											{/* 2. Angkatan */}
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

											{/* 3. Tahun Ajaran */}
											<TableCell className="text-center font-medium text-xs text-slate-700">
												{s.student.academicYear ||
													(s.student.cohort &&
													!Number.isNaN(Number(s.student.cohort))
														? `${2010 + Number(s.student.cohort)}/${2011 + Number(s.student.cohort)}`
														: s.student.period || (
																<span className="text-slate-400 italic">-</span>
															))}
											</TableCell>

											{/* 4. Peminatan */}
											<TableCell>
												<PeminatanBadge
													subProgram={s.student.subProgram}
													program={s.student.program}
													destinationCountry={s.student.destinationCountry}
												/>
											</TableCell>

											{/* 5. No. WhatsApp */}
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

											{/* 6. Total Pembayaran */}
											<TableCell className="text-right">
												<div className="font-bold text-xs text-slate-900 font-mono">
													{formatRupiah(totalPaid)}
												</div>
												<div className="text-[10px] text-slate-400 mt-0.5 font-medium">
													{s.finance?.metodePembayaran === "dana_talangan"
														? "Dana Talangan"
														: "Dana Mandiri"}
												</div>
											</TableCell>

											{/* 7. Progress Checklist with Tooltip */}
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
																	Checklist Keuangan (6):
																</span>
																<span className="text-[11px] font-mono text-emerald-400 font-bold">
																	{completed}/{total} Lunas
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
																			{it.done ? "✓ Lunas" : "Belum"}
																		</span>
																	</div>
																))}
															</div>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>

											{/* 8. Status Finance */}
											<TableCell className="text-center">
												<PanelStatusBadge
													status={s.finance?.status}
													isAcc={s.finance?.isAcc}
													completed={completed}
													total={total}
													size="sm"
												/>
											</TableCell>

											{/* 9. Aksi */}
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
														href={`/dashboard/students/${s.student.id}?tab=finance`}
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
									Tidak ada data keuangan mahasiswa ditemukan.
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
							itemName="Mahasiswa Keuangan"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
