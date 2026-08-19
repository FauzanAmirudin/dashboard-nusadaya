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
	Search,
	ShieldCheck,
	Sparkles,
	Target,
	TrendingUp,
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

type DatePreset =
	| "this_month"
	| "last_month"
	| "last_3_months"
	| "this_year"
	| "all"
	| "custom";

function getCountryFlag(subProgram?: string | null) {
	if (!subProgram) return null;
	const lower = subProgram.toLowerCase();
	if (lower.includes("malaysia") || lower.includes("my")) {
		return "https://flagcdn.com/w20/my.png";
	}
	if (lower.includes("taiwan") || lower.includes("tw")) {
		return "https://flagcdn.com/w20/tw.png";
	}
	if (
		lower.includes("timur tengah") ||
		lower.includes("saudi") ||
		lower.includes("arab") ||
		lower.includes("barista")
	) {
		return "https://flagcdn.com/w20/sa.png";
	}
	if (
		lower.includes("jepang") ||
		lower.includes("japan") ||
		lower.includes("jp")
	) {
		return "https://flagcdn.com/w20/jp.png";
	}
	if (lower.includes("korea") || lower.includes("kr")) {
		return "https://flagcdn.com/w20/kr.png";
	}
	if (
		lower.includes("jerman") ||
		lower.includes("germany") ||
		lower.includes("de")
	) {
		return "https://flagcdn.com/w20/de.png";
	}
	if (
		lower.includes("indonesia") ||
		lower.includes("reguler") ||
		lower.includes("id")
	) {
		return "https://flagcdn.com/w20/id.png";
	}
	return null;
}

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

/** Hitung transaksi masuk mahasiswa dalam rentang tanggal tertentu */
function calculateTransactionsInDateRange(
	s: any,
	startDate: Date,
	endDate: Date,
): number {
	let total = 0;
	const fin = s.finance;
	if (!fin) return 0;

	const isWithin = (d?: string | Date | null) => {
		if (!d) return false;
		const dateObj = new Date(d);
		if (isNaN(dateObj.getTime())) return false;
		return dateObj >= startDate && dateObj <= endDate;
	};

	// 1. Installments semester (Mandiri)
	let hasInstallments = false;
	if (s.financeInstallments && s.financeInstallments.length > 0) {
		for (const inst of s.financeInstallments) {
			const d = inst.paymentDate || inst.createdAt;
			if (isWithin(d)) {
				total += Number(inst.nominalPaid) || 0;
				hasInstallments = true;
			}
		}
	}

	if (!hasInstallments) {
		if (
			fin.mandiriSemesterStatus &&
			isWithin(fin.mandiriSemesterPaidDate || fin.updatedAt)
		) {
			total += Number(fin.mandiriSemesterNominal) || 0;
		}
	}

	// 2. Installments Dana Talangan (Tahap 1 & Tahap 2)
	let hasTalanganInst = false;
	if (
		s.financeTalanganInstallments &&
		s.financeTalanganInstallments.length > 0
	) {
		for (const inst of s.financeTalanganInstallments) {
			const d = inst.paymentDate || inst.createdAt;
			if (isWithin(d)) {
				total += Number(inst.nominalPaid) || 0;
				hasTalanganInst = true;
			}
		}
	}

	if (!hasTalanganInst) {
		if (
			fin.t1SemesterNominalDibayar &&
			isWithin(fin.t1SemesterPaidDate || fin.updatedAt)
		) {
			total += Number(fin.t1SemesterNominalDibayar) || 0;
		}
		// Interview Magang
		if (fin.mandiriInterviewStatus && isWithin(fin.updatedAt)) {
			total += Number(fin.mandiriInterviewNominal) || 0;
		} else if (fin.t1InterviewStatus && isWithin(fin.updatedAt)) {
			total += Number(fin.t1InterviewNominal) || 0;
		}
		// Keberangkatan
		if (
			fin.mandiriKeberangkatanStatus &&
			isWithin(fin.t2KeberangkatanPaidDate || fin.updatedAt)
		) {
			total += Number(fin.mandiriKeberangkatanNominal) || 0;
		} else if (
			fin.t2KeberangkatanStatus &&
			isWithin(fin.t2KeberangkatanPaidDate || fin.updatedAt)
		) {
			total += Number(fin.t2KeberangkatanNominal) || 0;
		}
	}

	// 3. Registrasi Awal
	if (fin.registrasiStatus || fin.registrationPaid) {
		const d = fin.registrasiPaidDate || fin.updatedAt;
		if (isWithin(d)) {
			total += Number(fin.registrasiNominal) || 0;
		}
	}

	// 5. Admin Talangan
	if (fin.adminTalaganStatus && isWithin(fin.updatedAt)) {
		total += Number(fin.adminTalaganNominal) || 0;
	}

	// 6. Biaya Tambahan
	if (fin.toeicStatus && isWithin(fin.toeicPaidDate || fin.updatedAt)) {
		total += Number(fin.toeicNominal) || 0;
	}
	if (fin.pasporStatus && isWithin(fin.updatedAt)) {
		total += Number(fin.pasporNominal) || 0;
	}
	if (fin.rumahJuangStatus && isWithin(fin.updatedAt)) {
		total += Number(fin.rumahJuangNominal) || 0;
	}

	// 7. Custom Fields
	if (s.financeCustomFields && s.financeCustomFields.length > 0) {
		for (const cf of s.financeCustomFields) {
			if (cf.status && isWithin(cf.createdAt || cf.updatedAt)) {
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
		return isNaN(t) ? 0 : t;
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

export function FinanceDashboard({ user, data: propData }: any) {
	const router = useRouter();
	const [data, setData] = useState<any[]>(propData || []);
	const [isLoading, setIsLoading] = useState(
		!propData || propData.length === 0,
	);
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<
		"recent" | "oldest" | "name" | "paid_desc"
	>("recent");

	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 20;

	// State Fitur Proyeksi Pendapatan per Bulan (Komponen 2)
	const [datePreset, setDatePreset] = useState<DatePreset>("this_month");
	const [customStartDate, setCustomStartDate] = useState<string>(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1)
			.toISOString()
			.split("T")[0];
	});
	const [customEndDate, setCustomEndDate] = useState<string>(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth() + 1, 0)
			.toISOString()
			.split("T")[0];
	});

	// Target Proyeksi Pendapatan (Manual Input with Local Storage persistence)
	const targetStorageKey = `nusadaya_finance_projection_target_${selectedCohort}`;
	const [targetNominal, setTargetNominal] = useState<number>(50_000_000);
	const [isEditingTarget, setIsEditingTarget] = useState(false);
	const [tempTargetInput, setTempTargetInput] = useState<string>("50000000");

	// Load target from localStorage on mount or cohort change
	useEffect(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(targetStorageKey);
			if (saved && !isNaN(Number(saved)) && Number(saved) > 0) {
				setTargetNominal(Number(saved));
				setTempTargetInput(saved);
			} else {
				setTargetNominal(50_000_000);
				setTempTargetInput("50000000");
			}
		}
	}, [selectedCohort, targetStorageKey]);

	const handleSaveTarget = () => {
		const val = Math.max(0, Number(tempTargetInput) || 0);
		setTargetNominal(val);
		if (typeof window !== "undefined") {
			localStorage.setItem(targetStorageKey, val.toString());
		}
		setIsEditingTarget(false);
	};

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
				console.error("Failed fetching finance dashboard data", err);
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

	// Menghitung Rentang Tanggal Aktif
	const activeDateRange = useMemo(() => {
		const now = new Date();
		if (datePreset === "this_month") {
			const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
			const end = new Date(
				now.getFullYear(),
				now.getMonth() + 1,
				0,
				23,
				59,
				59,
				999,
			);
			const label = start.toLocaleDateString("id-ID", {
				month: "long",
				year: "numeric",
			});
			return { start, end, label: `Bulan Ini (${label})` };
		}
		if (datePreset === "last_month") {
			const start = new Date(
				now.getFullYear(),
				now.getMonth() - 1,
				1,
				0,
				0,
				0,
				0,
			);
			const end = new Date(
				now.getFullYear(),
				now.getMonth(),
				0,
				23,
				59,
				59,
				999,
			);
			const label = start.toLocaleDateString("id-ID", {
				month: "long",
				year: "numeric",
			});
			return { start, end, label: `Bulan Lalu (${label})` };
		}
		if (datePreset === "last_3_months") {
			const start = new Date(
				now.getFullYear(),
				now.getMonth() - 2,
				1,
				0,
				0,
				0,
				0,
			);
			const end = new Date(
				now.getFullYear(),
				now.getMonth() + 1,
				0,
				23,
				59,
				59,
				999,
			);
			return { start, end, label: "3 Bulan Terakhir" };
		}
		if (datePreset === "this_year") {
			const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
			const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
			return { start, end, label: `Tahun Ini (${now.getFullYear()})` };
		}
		if (datePreset === "custom" && customStartDate && customEndDate) {
			const start = new Date(`${customStartDate}T00:00:00`);
			const end = new Date(`${customEndDate}T23:59:59`);
			const startStr = start.toLocaleDateString("id-ID", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
			const endStr = end.toLocaleDateString("id-ID", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
			return { start, end, label: `${startStr} - ${endStr}` };
		}
		// All time
		const start = new Date(2020, 0, 1);
		const end = new Date(2035, 11, 31);
		return { start, end, label: "Semua Waktu" };
	}, [datePreset, customStartDate, customEndDate]);

	// Kalkulasi Realisasi Riil Otomatis Berdasarkan Periode
	const realisasiRiilPeriod = useMemo(() => {
		if (!cohortData || cohortData.length === 0) return 0;
		return cohortData.reduce((acc: number, s: any) => {
			return (
				acc +
				calculateTransactionsInDateRange(
					s,
					activeDateRange.start,
					activeDateRange.end,
				)
			);
		}, 0);
	}, [cohortData, activeDateRange]);

	// Persentase Ketercapaian Target
	const achievementPercentage = useMemo(() => {
		if (!targetNominal || targetNominal <= 0) return 0;
		const pct = (realisasiRiilPeriod / targetNominal) * 100;
		return Number(pct.toFixed(1));
	}, [realisasiRiilPeriod, targetNominal]);

	const sisaTarget = Math.max(0, targetNominal - realisasiRiilPeriod);

	// KPI Metrics based on cohortData
	const totalStudents = cohortData.length;
	const countAcc = cohortData.filter((s: any) => s.finance?.isAcc).length;
	const countAman = cohortData.filter(
		(s: any) => s.finance?.status === "AMAN",
	).length;
	const countPerhatian = cohortData.filter(
		(s: any) => s.finance?.status === "PERLU_PERHATIAN" || !s.finance?.status,
	).length;
	const countTidakAman = cohortData.filter(
		(s: any) => s.finance?.status === "TIDAK_AMAN",
	).length;
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
			if (selectedStatus === "aman") matchStatus = financeStatus === "AMAN";
			if (selectedStatus === "perhatian")
				matchStatus = financeStatus === "PERLU_PERHATIAN";
			if (selectedStatus === "tidak_aman")
				matchStatus = financeStatus === "TIDAK_AMAN";
			if (selectedStatus === "acc") matchStatus = Boolean(s.finance?.isAcc);

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

	const getFinanceChecklist = (fin: any) => {
		const isTalangan = fin?.metodePembayaran === "dana_talangan";
		const isSemesterDone = isTalangan
			? Boolean(fin?.t1SemesterStatus || fin?.mandiriSemesterStatus)
			: Boolean(fin?.mandiriSemesterStatus);
		const isInterviewDone = isTalangan
			? Boolean(fin?.t1InterviewStatus)
			: Boolean(fin?.mandiriInterviewStatus);
		const isKeberangkatanDone = isTalangan
			? Boolean(fin?.t2KeberangkatanStatus)
			: Boolean(fin?.mandiriKeberangkatanStatus);

		const items = [
			{
				name: "Registrasi / Pendaftaran",
				done: Boolean(fin?.registrasiStatus || fin?.registrationPaid),
			},
			{
				name: isTalangan ? "Perkuliahan 6 Semester" : "Perkuliahan 6 Semester",
				done: isSemesterDone,
			},
			{
				name: isTalangan ? "Interview Magang (Tahap 1)" : "Interview Magang",
				done: isInterviewDone,
			},
			{
				name: isTalangan ? "Keberangkatan (Tahap 2)" : "Keberangkatan",
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

	if (isLoading) {
		return (
			<div className="flex flex-col justify-center items-center h-80 gap-4">
				<div className="relative">
					<div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#0517B0] animate-spin" />
				</div>
				<div className="text-center">
					<p className="text-sm font-bold text-slate-700">
						Memuat Dashboard Finance
					</p>
					<p className="text-xs text-slate-400 mt-0.5">
						Mengambil data keuangan mahasiswa...
					</p>
				</div>
			</div>
		);
	}

	// KPI card data for compact summary in Light Theme
	const kpiCards = [
		{
			label: "Total Mahasiswa",
			value: totalStudents,
			icon: Users,
			iconBg: "bg-blue-50 text-[#0517B0]",
			valueColor: "text-slate-900",
		},
		{
			label: "Aman / Lunas",
			value: countAman,
			icon: CheckCircle,
			iconBg: "bg-emerald-50 text-emerald-600",
			indicator: "🟢",
			valueColor: "text-emerald-700",
		},
		{
			label: "Sedang Proses",
			value: countPerhatian,
			icon: Clock,
			iconBg: "bg-amber-50 text-amber-600",
			indicator: "🟡",
			valueColor: "text-amber-700",
		},
		{
			label: "Menunggak",
			value: countTidakAman,
			icon: XCircle,
			iconBg: "bg-rose-50 text-rose-600",
			indicator: "⛔",
			valueColor: "text-rose-700",
		},
		{
			label: "ACC Finance",
			value: countAcc,
			icon: ShieldCheck,
			iconBg: "bg-indigo-50 text-indigo-600",
			indicator: "🛡️",
			valueColor: "text-indigo-700",
		},
		{
			label: "Lunas Registrasi",
			value: countLunasRegistrasi,
			icon: CreditCard,
			iconBg: "bg-sky-50 text-sky-600",
			valueColor: "text-slate-900",
		},
	];

	// Date preset buttons config
	const datePresetButtons: { key: DatePreset; label: string }[] = [
		{ key: "this_month", label: "Bulan Ini" },
		{ key: "last_month", label: "Bulan Lalu" },
		{ key: "last_3_months", label: "3 Bulan" },
		{ key: "this_year", label: "Tahun Ini" },
		{ key: "custom", label: "Kustom" },
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
								{cohortYears.map((year) => (
									<SelectItem key={year} value={year.toString()}>
										Angkatan {year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

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
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
				{kpiCards.map((kpi) => {
					const Icon = kpi.icon;
					return (
						<div
							key={kpi.label}
							className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between"
						>
							<div>
								<p className="text-slate-500 text-[11px] font-semibold flex items-center gap-1">
									{kpi.indicator && <span>{kpi.indicator}</span>}
									<span>{kpi.label}</span>
								</p>
								<p
									className={`text-2xl font-black ${kpi.valueColor} mt-0.5 tracking-tight`}
								>
									{kpi.value}
								</p>
							</div>
							<div className={`p-2 rounded-lg ${kpi.iconBg} shrink-0`}>
								<Icon className="h-4 w-4" />
							</div>
						</div>
					);
				})}
			</div>

			{/* ─── 3. KOMPONEN 2: PROYEKSI & REALISASI PENDAPATAN (CLEAN & SIMPLE WIDGET) ─── */}
			<Card className="bg-white border-slate-200/90 shadow-2xs overflow-hidden rounded-xl">
				<CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-linear-to-r from-blue-50/50 via-indigo-50/20 to-white">
					<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
						<div className="flex items-center gap-2.5">
							<div className="p-2 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-200/60 shadow-2xs">
								<TrendingUp className="w-4 h-4" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<CardTitle className="text-base font-bold text-slate-900 tracking-tight">
										Proyeksi & Realisasi Pendapatan
									</CardTitle>
									<Badge className="bg-blue-50 text-[#0517B0] border-blue-200 text-[10px] font-bold px-2 py-0.5">
										<div className="w-1.5 h-1.5 rounded-full bg-[#0517B0] animate-pulse mr-1" />
										Live Tracking
									</Badge>
								</div>
								<p className="text-xs text-slate-500 mt-0.5">
									Ringkasan uang masuk riil dan ketercapaian target periode
									terpilih.
								</p>
							</div>
						</div>

						{/* Quick Date Presets & Date Range Selector (Aligned Right with Slide-down Animation) */}
						<div className="flex flex-col items-end gap-1.5 w-full lg:w-auto">
							<div className="flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200 shadow-2xs self-end">
								{datePresetButtons.map((btn) => (
									<button
										key={btn.key}
										type="button"
										onClick={() => setDatePreset(btn.key)}
										className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
											datePreset === btn.key
												? "bg-[#0517B0] text-white shadow-xs font-bold"
												: "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
										}`}
									>
										{btn.label}
									</button>
								))}
							</div>

							{datePreset === "custom" && (
								<div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200/90 shadow-2xs self-end animate-slide-down">
									<Calendar className="w-3.5 h-3.5 text-[#0517B0] shrink-0" />
									<div className="flex items-center gap-1.5 text-xs">
										<input
											type="date"
											value={customStartDate}
											onChange={(e) => setCustomStartDate(e.target.value)}
											className="bg-transparent text-xs text-slate-800 font-semibold outline-hidden cursor-pointer"
										/>
										<span className="text-slate-400 font-medium">s/d</span>
										<input
											type="date"
											value={customEndDate}
											onChange={(e) => setCustomEndDate(e.target.value)}
											className="bg-transparent text-xs text-slate-800 font-semibold outline-hidden cursor-pointer"
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-4 sm:p-5 space-y-4">
					{/* 4 Cards Grid Metrics (Simple & Concise) */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						{/* 1. Realisasi Riil */}
						<div className="bg-linear-to-br from-blue-50/70 via-blue-50/20 to-white border border-blue-200/70 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
									<Wallet className="w-3.5 h-3.5 text-[#0517B0]" />
									Realisasi Masuk
								</span>
								<Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] px-1.5 py-0 font-bold">
									Terkumpul
								</Badge>
							</div>
							<div className="mt-2.5">
								<p className="text-2xl font-black text-[#0517B0] tracking-tight leading-none">
									{formatRupiah(realisasiRiilPeriod)}
								</p>
								<p className="text-[11px] text-slate-500 mt-1.5 font-medium truncate">
									Periode: {activeDateRange.label}
								</p>
							</div>
						</div>

						{/* 2. Target Proyeksi (Manual Input Editable) */}
						<div className="bg-linear-to-br from-indigo-50/60 via-indigo-50/20 to-white border border-indigo-200/70 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
									<Target className="w-3.5 h-3.5 text-[#0517B0]" />
									Target Proyeksi
								</span>
								{!isEditingTarget && (
									<button
										type="button"
										onClick={() => {
											setTempTargetInput(targetNominal.toString());
											setIsEditingTarget(true);
										}}
										className="text-xs text-[#0517B0] hover:text-blue-800 font-bold underline underline-offset-2 transition-colors"
									>
										Ubah
									</button>
								)}
							</div>

							<div className="mt-2.5">
								{isEditingTarget ? (
									<div className="space-y-1.5">
										<div className="flex items-center gap-1.5">
											<span className="text-xs text-slate-500 font-bold">
												Rp
											</span>
											<Input
												type="number"
												min={0}
												placeholder="0"
												value={tempTargetInput === "0" ? "" : tempTargetInput}
												onChange={(e) => setTempTargetInput(e.target.value)}
												className="h-7 text-xs font-bold bg-white border-blue-400 text-slate-900 shadow-2xs"
												autoFocus
											/>
										</div>
										<div className="flex items-center gap-1">
											<Button
												size="sm"
												onClick={handleSaveTarget}
												className="h-6 text-[11px] bg-[#0517B0] hover:bg-blue-800 text-white font-semibold px-2 shadow-2xs"
											>
												Simpan
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => setIsEditingTarget(false)}
												className="h-6 text-[11px] text-slate-500 hover:text-slate-800 px-1.5"
											>
												Batal
											</Button>
										</div>
									</div>
								) : (
									<>
										<p className="text-2xl font-black text-slate-900 tracking-tight leading-none">
											{formatRupiah(targetNominal)}
										</p>
										<div className="flex items-center gap-1 mt-1.5 flex-wrap">
											{[50_000_000, 100_000_000, 250_000_000, 500_000_000].map(
												(preset) => (
													<button
														key={preset}
														type="button"
														onClick={() => {
															setTargetNominal(preset);
															localStorage.setItem(
																targetStorageKey,
																preset.toString(),
															);
														}}
														className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold transition-all ${
															targetNominal === preset
																? "bg-[#0517B0] border-[#0517B0] text-white shadow-2xs font-bold"
																: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
														}`}
													>
														{formatShortRupiah(preset)}
													</button>
												),
											)}
										</div>
									</>
								)}
							</div>
						</div>

						{/* 3. Persentase Ketercapaian */}
						<div className="bg-linear-to-br from-sky-50/60 via-blue-50/20 to-white border border-sky-200/70 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
									<Sparkles className="w-3.5 h-3.5 text-blue-600" />
									Ketercapaian
								</span>
								<Badge
									className={`text-[10px] px-1.5 py-0 font-bold ${
										achievementPercentage >= 100
											? "bg-blue-100 text-[#0517B0] border-blue-200"
											: achievementPercentage >= 50
												? "bg-sky-100 text-sky-800 border-sky-200"
												: "bg-amber-100 text-amber-800 border-amber-200"
									}`}
								>
									{achievementPercentage >= 100
										? "✓ Tercapai"
										: achievementPercentage >= 50
											? "📈 Berjalan Baik"
											: "⏳ Perlu Dikejar"}
								</Badge>
							</div>
							<div className="mt-2.5">
								<div className="flex items-baseline gap-1.5">
									<p
										className={`text-2xl font-black tracking-tight leading-none ${
											achievementPercentage >= 100
												? "text-[#0517B0]"
												: achievementPercentage >= 50
													? "text-blue-600"
													: "text-amber-600"
										}`}
									>
										{achievementPercentage}%
									</p>
									<span className="text-xs text-slate-500 font-medium">
										dari target
									</span>
								</div>
								<p className="text-[11px] text-slate-400 mt-1.5">
									Persentase realisasi uang masuk
								</p>
							</div>
						</div>

						{/* 4. Sisa / Selisih Target */}
						<div className="bg-linear-to-br from-slate-50/80 via-slate-50/30 to-white border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
									<Clock className="w-3.5 h-3.5 text-slate-500" />
									{realisasiRiilPeriod >= targetNominal
										? "Surplus Target"
										: "Sisa Target"}
								</span>
								<span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
									{selectedCohort === "all"
										? "Semua"
										: `Angkatan ${selectedCohort}`}
								</span>
							</div>
							<div className="mt-2.5">
								<p
									className={`text-2xl font-black tracking-tight leading-none ${
										realisasiRiilPeriod >= targetNominal
											? "text-[#0517B0]"
											: "text-rose-600"
									}`}
								>
									{realisasiRiilPeriod >= targetNominal
										? `+${formatRupiah(realisasiRiilPeriod - targetNominal)}`
										: formatRupiah(sisaTarget)}
								</p>
								<p className="text-[11px] text-slate-400 mt-1.5">
									{realisasiRiilPeriod >= targetNominal
										? "Target telah tercapai penuh 🎉"
										: "Nominal yang masih harus dikejar"}
								</p>
							</div>
						</div>
					</div>

					{/* Simple Integrated Progress Bar */}
					<div className="space-y-1.5 bg-slate-50/90 p-3 rounded-xl border border-slate-200/70">
						<div className="flex items-center justify-between text-xs font-bold">
							<span className="text-slate-600 flex items-center gap-1.5">
								<div className="w-2 h-2 rounded-full bg-[#0517B0] animate-pulse" />
								Progres Ketercapaian Target ({activeDateRange.label}):
							</span>
							<span className="text-[#0517B0] font-mono text-xs font-extrabold">
								{formatRupiah(realisasiRiilPeriod)} /{" "}
								{formatRupiah(targetNominal)}{" "}
								<span className="text-slate-500 font-bold">
									({achievementPercentage}%)
								</span>
							</span>
						</div>
						<div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden border border-slate-300/50 p-0.5">
							<div
								className={`h-full rounded-full transition-all duration-500 ${
									achievementPercentage >= 100
										? "bg-linear-to-r from-blue-600 to-[#0517B0] shadow-sm"
										: achievementPercentage >= 50
											? "bg-linear-to-r from-sky-500 to-blue-600 shadow-sm"
											: "bg-linear-to-r from-amber-500 to-blue-600"
								}`}
								style={{
									width: `${Math.min(100, achievementPercentage)}%`,
								}}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* ─── 4. KOMPONEN 1: TABEL KELENGKAPAN FINANCE (MONITORING UTAMA) ─── */}
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
										{sortBy === "recent" && "🕒 Terbaru"}
										{sortBy === "oldest" && "🕒 Terlama"}
										{sortBy === "name" && "🔤 Nama (A-Z)"}
										{sortBy === "paid_desc" && "💰 Total Bayar"}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="recent">🕒 Terbaru</SelectItem>
									<SelectItem value="oldest">🕒 Terlama</SelectItem>
									<SelectItem value="name">🔤 Nama (A-Z)</SelectItem>
									<SelectItem value="paid_desc">💰 Total Bayar</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Row 2: Status Filter Tabs (Segmented Control) */}
					<div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto">
						{[
							{ key: "all", label: "Semua", count: totalStudents },
							{ key: "aman", label: "🟢 Aman / Lunas", count: countAman },
							{
								key: "perhatian",
								label: "🟡 Sedang Proses",
								count: countPerhatian,
							},
							{
								key: "tidak_aman",
								label: "⛔ Menunggak",
								count: countTidakAman,
							},
							{ key: "acc", label: "🛡️ ACC Finance", count: countAcc },
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
									<TableHead className="py-3 px-4 font-bold text-slate-700 text-xs uppercase tracking-wider">
										Nama Mahasiswa
									</TableHead>
									<TableHead className="py-3 px-3 font-bold text-slate-700 text-xs text-center w-24 uppercase tracking-wider">
										Angkatan
									</TableHead>
									<TableHead className="py-3 px-3 font-bold text-slate-700 text-xs text-center w-28 uppercase tracking-wider">
										Tahun Ajaran
									</TableHead>
									<TableHead className="py-3 px-3 font-bold text-slate-700 text-xs uppercase tracking-wider">
										Program Studi & Peminatan
									</TableHead>
									<TableHead className="py-3 px-3 font-bold text-slate-700 text-xs w-36 uppercase tracking-wider">
										No. HP/WhatsApp
									</TableHead>
									<TableHead className="py-3 px-3 font-bold text-slate-700 text-xs text-right w-36 uppercase tracking-wider">
										Total Pembayaran
									</TableHead>
									<TableHead className="py-3 px-3 font-bold text-slate-700 text-xs text-center w-32 uppercase tracking-wider">
										Status Pembayaran
									</TableHead>
									<TableHead className="py-3 px-3 font-bold text-slate-700 text-xs text-center w-36 uppercase tracking-wider">
										Progres
									</TableHead>
									<TableHead className="py-3 px-4 font-bold text-slate-700 text-xs text-right pr-6 w-24 uppercase tracking-wider">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedData.map((s: any, idx: number) => {
									const { items, completed, total, isDone } =
										getFinanceChecklist(s.finance);
									const unpaidItems = items.filter((it) => !it.done);
									const flagUrl = getCountryFlag(s.student?.subProgram);
									const totalPaid = calculateTotalPaidStudent(s);
									const financeStatus = s.finance?.status || "PERLU_PERHATIAN";
									const isAmanOrLunas =
										financeStatus === "AMAN" || unpaidItems.length === 0;
									const waUrl = formatWhatsAppUrl(s.student?.phone);

									return (
										<TableRow
											key={s.student.id}
											className={`border-slate-100 hover:bg-blue-50/40 transition-colors ${
												idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
											}`}
										>
											{/* 1. Nama Mahasiswa */}
											<TableCell className="px-4 py-3">
												<div className="font-bold text-slate-900 text-sm">
													{s.student.name}
												</div>
												{s.student.nim ? (
													<div className="font-mono text-[11px] text-slate-400 font-semibold mt-0.5">
														{s.student.nim}
													</div>
												) : (
													<div className="text-[11px] text-slate-400 italic mt-0.5">
														Belum ada NIM
													</div>
												)}
											</TableCell>

											{/* 2. Angkatan (Angka saja) */}
											<TableCell className="px-3 py-3 text-center">
												<Badge
													variant="outline"
													className="text-xs px-2.5 py-0.5 font-semibold text-slate-700 border-slate-200 bg-slate-100/80 font-mono"
												>
													{s.student.cohort || "-"}
												</Badge>
											</TableCell>

											{/* 3. Tahun Ajaran */}
											<TableCell className="px-3 py-3 text-center font-medium text-xs text-slate-600 font-mono">
												{s.student.academicYear || "-"}
											</TableCell>

											{/* 4. Program Studi & Peminatan (dengan Bendera) */}
											<TableCell className="px-3 py-3">
												<div className="font-semibold text-slate-800 text-xs">
													{s.student.program || "-"}
												</div>
												{s.student.subProgram ? (
													<div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 font-medium">
														{flagUrl ? (
															<img
																src={flagUrl}
																alt={s.student.subProgram}
																className="w-4 h-3 object-cover rounded-xs shadow-2xs inline-block"
															/>
														) : (
															<span className="text-xs">🌐</span>
														)}
														<span>{s.student.subProgram}</span>
													</div>
												) : (
													<div className="text-[11px] text-slate-400 italic mt-0.5">
														-
													</div>
												)}
											</TableCell>

											{/* 5. No. HP/WhatsApp */}
											<TableCell className="px-3 py-3 text-xs font-mono">
												{s.student.phone ? (
													<a
														href={`https://wa.me/${s.student.phone.replace(/[^0-9]/g, "")}`}
														target="_blank"
														rel="noreferrer"
														className="inline-flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 font-medium transition-colors group/wa"
														title="Buka WhatsApp"
													>
														<Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0 group-hover/wa:scale-110 transition-transform" />
														<span>{s.student.phone}</span>
													</a>
												) : (
													<span className="text-slate-400 italic">-</span>
												)}
											</TableCell>

											{/* 6. Total Pembayaran yang Diinput */}
											<TableCell className="px-3 py-3 text-right">
												<div className="font-bold text-xs text-slate-900 font-mono">
													{formatRupiah(totalPaid)}
												</div>
												<div className="text-[10px] text-slate-400 mt-0.5 font-medium">
													{s.finance?.metodePembayaran === "dana_talangan"
														? "Dana Talangan"
														: "Dana Mandiri"}
												</div>
											</TableCell>

											{/* 7. Status Pembayaran (Tooltip Khusus Item Belum Lunas / Tidak Muncul jika Lunas) */}
											<TableCell className="px-3 py-3 text-center">
												{isAmanOrLunas ? (
													/* Jika sudah Aman/Lunas: Tooltip TIDAK muncul */
													<div className="inline-flex flex-col items-center">
														<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold">
															🟢 Aman (Lunas)
														</Badge>
														{s.finance?.isAcc && (
															<div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center justify-center gap-0.5">
																<Check className="w-3 h-3" /> ACC Finance
															</div>
														)}
													</div>
												) : (
													/* Jika Menunggak / Belum Lunas: Menampilkan Tooltip Khusus Item Menunggak */
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger className="inline-flex flex-col items-center cursor-pointer group/status">
																{financeStatus === "PERLU_PERHATIAN" ? (
																	<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-bold transition-all group-hover/status:scale-105 group-hover/status:shadow-2xs">
																		🟡 Sedang Proses
																	</Badge>
																) : (
																	<Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[11px] font-bold transition-all group-hover/status:scale-105 group-hover/status:shadow-2xs">
																		⛔ Menunggak
																	</Badge>
																)}
																{s.finance?.isAcc && (
																	<div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center justify-center gap-0.5">
																		<Check className="w-3 h-3" /> ACC Finance
																	</div>
																)}
															</TooltipTrigger>
															<TooltipContent className="w-68 p-3 bg-slate-950 text-white rounded-xl shadow-2xl border border-rose-950/80 text-xs flex flex-col space-y-2 z-50">
																<div className="flex items-center justify-between border-b border-slate-800 pb-1.5 w-full">
																	<div className="flex items-center gap-1.5">
																		<div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
																		<span className="font-bold text-rose-200 text-xs">
																			Pos Belum Lunas:
																		</span>
																	</div>
																	<span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-950/80 border border-rose-800/60 px-1.5 py-0.5 rounded">
																		{unpaidItems.length} Pos
																	</span>
																</div>

																<div className="flex flex-col space-y-1.5 w-full pt-0.5">
																	{unpaidItems.map((it) => (
																		<div
																			key={it.name}
																			className="flex items-center justify-between text-[11px] bg-rose-950/30 border border-rose-900/40 rounded-lg px-2.5 py-1"
																		>
																			<span className="text-slate-200 font-medium">
																				{it.name}
																			</span>
																			<span className="font-bold text-rose-400 text-[10px]">
																				✕ Belum Lunas
																			</span>
																		</div>
																	))}
																</div>

																<p className="text-[10px] text-slate-400 italic pt-0.5 border-t border-slate-900">
																	Klik &ldquo;Periksa&rdquo; untuk kelola
																	pembayaran.
																</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												)}
											</TableCell>

											{/* 8. Progres (Checklist Tooltip) */}
											<TableCell className="px-3 py-3 text-center">
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger className="w-full">
															<div className="flex flex-col items-center gap-1">
																<div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 px-1">
																	<span>
																		{completed}/{total} Item
																	</span>
																</div>
																<div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden border border-slate-200">
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
																	Checklist Keuangan:
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
																			{it.done ? "✓ Lunas" : "Belum"}
																		</span>
																	</div>
																))}
															</div>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>

											{/* 9. Aksi */}
											<TableCell className="px-4 py-3 text-right pr-6">
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														router.push(
															`/dashboard/students/${s.student.id}?context=finance`,
														)
													}
													className="h-8 text-xs font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 gap-1 px-2.5 shadow-2xs"
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
