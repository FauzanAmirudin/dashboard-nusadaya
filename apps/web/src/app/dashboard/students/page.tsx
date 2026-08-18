"use client";

import {
	Archive,
	CheckCircle,
	CheckCircle2,
	Clock,
	Download,
	Edit,
	Eye,
	GraduationCap,
	HeartHandshake,
	HelpCircle,
	MessageCircle,
	Phone,
	Plane,
	Plus,
	RefreshCw,
	Search,
	ShieldAlert,
	ShieldCheck,
	UserCheck,
	UserPlus,
	Users,
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
import { useAuthStore } from "@/store";

type StudentData = {
	student: {
		id: number;
		nim: string;
		name: string;
		nickname?: string | null;
		cohort: number;
		academicYear?: string | null;
		period?: string | null;
		program: string;
		subProgram?: string | null;
		destinationCountry?: string | null;
		phone?: string;
		overallStatus: string | null;
		studentStatus?: string | null;
		paId?: number | null;
	};
	pmb: any | null;
	crm: any | null;
	finance: any | null;
	academic: any | null;
	pa: any | null;
	internship: any | null;
	decision: {
		isApprovedByDirector: boolean | null;
		evaluatorDecision?: string | null;
		departureDate?: string | null;
		notes?: string | null;
	} | null;
	courseGrades?: Array<{
		id: number | string;
		isAcc?: boolean;
		attendancePresent?: number;
		totalMeetings?: number;
		grade?: string;
	}>;
};

// WhatsApp Link Helper
function formatWhatsAppUrl(phone: string | null | undefined) {
	if (!phone) return null;
	const clean = phone.replace(/[^0-9]/g, "");
	if (!clean) return null;
	const formatted = clean.startsWith("0") ? `62${clean.slice(1)}` : clean;
	return `https://wa.me/${formatted}`;
}

// Academic Year Helper
function getAcademicYear(student: any) {
	if (student?.academicYear) return student.academicYear;
	if (student?.cohort && !isNaN(Number(student.cohort))) {
		const startYear = 2010 + Number(student.cohort);
		return `${startYear}/${startYear + 1}`;
	}
	return student?.period || "-";
}

// Checklist Helpers for Division Progress
const getPmbChecklist = (pmb: any) => {
	const items = [
		{ name: "Pendaftaran Akun", done: true },
		{ name: "Data Pribadi & Kontak", done: Boolean(pmb?.personalDataComplete) },
		{ name: "Pilihan Peminatan/Program", done: Boolean(pmb?.programSelected) },
		{ name: "Biodata Orang Tua", done: Boolean(pmb?.parentDataComplete) },
		{
			name: "Riwayat Pendidikan",
			done: Boolean(pmb?.educationHistoryComplete),
		},
		{ name: "Dokumen KTP", done: Boolean(pmb?.docKtp) },
		{ name: "Dokumen Kartu Keluarga", done: Boolean(pmb?.docKk) },
		{ name: "Dokumen Ijazah / SKL", done: Boolean(pmb?.docIjazah) },
		{ name: "Dokumen Akta Kelahiran", done: Boolean(pmb?.docAkta) },
		{ name: "Pas Foto Berwarna", done: Boolean(pmb?.docFoto) },
		{ name: "Surat Pernyataan / Izin", done: Boolean(pmb?.docSuratPernyataan) },
		{ name: "Dokumen Paspor", done: Boolean(pmb?.docPaspor) },
		{ name: "Tes Minat & Bakat", done: Boolean(pmb?.testPassed) },
		{ name: "Wawancara PMB", done: Boolean(pmb?.interviewPassed) },
	];
	const completed = items.filter((i) => i.done).length;
	return {
		items,
		completed,
		total: items.length,
		isDone: completed === items.length,
	};
};

const getCrmChecklist = (crm: any) => {
	const items = [
		{ name: "Pendataan Kontak & Minat", done: Boolean(crm?.contactFollowedUp) },
		{
			name: "Konsultasi Program & Karir",
			done: Boolean(crm?.careerConsultationDone),
		},
		{
			name: "Verifikasi Lokasi & Minat Kerja",
			done: Boolean(crm?.locationPreferenceVerified),
		},
		{
			name: "Praktik Industri / On-Site",
			done: Boolean(crm?.practiceAttendance || crm?.isMonitoringIndustry),
		},
		{
			name: "Evaluasi Sikap & Kedisiplinan",
			done: Boolean(crm?.attitudeScore && crm.attitudeScore >= 75),
		},
		{
			name: "Rekomendasi Siap Magang",
			done: Boolean(crm?.isRecommendedForInternship),
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

const getAcademicChecklist = (s: any) => {
	let totalPertemuan = 0;
	let totalHadir = 0;
	let allGradesValid = false;
	if (s.courseGrades && s.courseGrades.length > 0) {
		s.courseGrades.forEach((c: any) => {
			totalPertemuan += c.totalMeetings || 16;
			totalHadir += c.attendancePresent || 0;
		});
		allGradesValid = s.courseGrades.every(
			(c: any) => c.grade && c.grade !== "E" && c.isAcc,
		);
	}
	const attendancePct =
		totalPertemuan > 0 ? Math.round((totalHadir / totalPertemuan) * 100) : 0;
	const isAttendancePassed = attendancePct >= 80;

	const items = [
		{ name: "Presensi Kuliah (Min 80%)", done: isAttendancePassed },
		{ name: "Nilai Mata Kuliah & UTS/UAS", done: allGradesValid },
		{
			name: "Bimbingan Studi Dosen",
			done: Boolean(s.academic?.studyGuidanceDone),
		},
		{
			name: "Uji Kompetensi Dasar",
			done: Boolean(s.academic?.competencyTestPassed),
		},
		{
			name: "Kelengkapan Modul Praktik",
			done: Boolean(s.academic?.practicumCompleted),
		},
		{ name: "KRS Disetujui", done: Boolean(s.academic?.krsApproved) },
		{ name: "KHS Semester Final", done: Boolean(s.academic?.khsFinalized) },
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

const getFinanceChecklist = (finance: any) => {
	const isTalangan = finance?.paymentScheme === "TALANGAN";
	const isMandiri = finance?.paymentScheme === "MANDIRI";

	const items = [
		{
			name: "Biaya Registrasi Awal",
			done: Boolean(finance?.registrasiStatus || finance?.registrationPaid),
		},
		{
			name: isMandiri
				? "Pembayaran Mandiri"
				: isTalangan
					? "Angsuran Talangan T1"
					: "Semester / Mandiri",
			done: Boolean(
				finance?.mandiriSemesterStatus ||
					finance?.t1SemesterStatus ||
					finance?.semesterPaid,
			),
		},
		{
			name: "Biaya Uji Kompetensi",
			done: Boolean(finance?.competencyTestPaid),
		},
		{
			name: "Biaya Visa & Dokumen Magang",
			done: Boolean(finance?.visaDocPaid),
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

const getInternshipChecklist = (internship: any) => {
	const items = [
		{ name: "Paspor Siap", done: Boolean(internship?.passportReady) },
		{ name: "Visa Disetujui", done: Boolean(internship?.visaReady) },
		{ name: "Medical Check Up (MCU)", done: Boolean(internship?.mcuReady) },
		{ name: "Tiket Keberangkatan", done: Boolean(internship?.ticketReady) },
		{
			name: "Letter of Acceptance (LoA)",
			done: Boolean(internship?.loaConfirmed),
		},
		{
			name: "Kontrak Kerja Industri",
			done: Boolean(internship?.contractReady),
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

const getPaChecklist = (pa: any) => {
	const items = [
		{ name: "Sesi 1: Perkenalan & Adaptasi", done: Boolean(pa?.session1Done) },
		{ name: "Sesi 2: Monitoring Akademik", done: Boolean(pa?.session2Done) },
		{
			name: "Sesi 3: Kesiapan Magang & Karir",
			done: Boolean(pa?.session3Done),
		},
		{
			name: "Sesi 4: Evaluasi Final Pra-Terbang",
			done: Boolean(pa?.session4Done),
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

// Helper for Superadmin 7-module status
const getRealtimeOverallStatus = (s: StudentData) => {
	const panels = [
		s.pmb?.isAcc ? "AMAN" : s.pmb?.status || "PERLU_PERHATIAN",
		s.crm?.isAcc ? "AMAN" : s.crm?.status || "PERLU_PERHATIAN",
		s.finance?.isAcc ? "AMAN" : s.finance?.status || "PERLU_PERHATIAN",
		s.academic?.isAcc ? "AMAN" : s.academic?.status || "PERLU_PERHATIAN",
		s.pa?.isAcc ? "AMAN" : s.pa?.status || "PERLU_PERHATIAN",
		s.internship?.isAcc ? "AMAN" : s.internship?.status || "PERLU_PERHATIAN",
	];

	if (panels.includes("TIDAK_AMAN")) return "TIDAK_AMAN";
	if (panels.includes("PERLU_PERHATIAN")) return "PERLU_PERHATIAN";
	return "AMAN";
};

const getStudentAccDetails = (s: StudentData) => {
	const isDosenAcc =
		s.courseGrades &&
		s.courseGrades.length > 0 &&
		s.courseGrades.every((g) => g.isAcc);

	const modules = [
		{
			key: "pmb",
			name: "PMB",
			isAcc: Boolean(s.pmb?.isAcc),
			status: s.pmb?.status || "PERLU_PERHATIAN",
		},
		{
			key: "crm",
			name: "CRM",
			isAcc: Boolean(s.crm?.isAcc),
			status: s.crm?.status || "PERLU_PERHATIAN",
		},
		{
			key: "finance",
			name: "Finance",
			isAcc: Boolean(s.finance?.isAcc),
			status: s.finance?.status || "PERLU_PERHATIAN",
		},
		{
			key: "academic",
			name: "Akademik",
			isAcc: Boolean(s.academic?.isAcc),
			status: s.academic?.status || "PERLU_PERHATIAN",
		},
		{
			key: "dosen",
			name: "Dosen MK",
			isAcc: Boolean(isDosenAcc),
			status: isDosenAcc ? "AMAN" : "PERLU_PERHATIAN",
		},
		{
			key: "pa",
			name: "PA",
			isAcc: Boolean(s.pa?.isAcc),
			status: s.pa?.status || "PERLU_PERHATIAN",
		},
		{
			key: "internship",
			name: "Magang",
			isAcc: Boolean(s.internship?.isAcc),
			status: s.internship?.status || "PERLU_PERHATIAN",
		},
	];

	const accCount = modules.filter((m) => m.isAcc).length;
	return { modules, accCount, isAllAcc: accCount === 7 };
};

export default function StudentsPage() {
	const router = useRouter();
	const { isAuthenticated, hasHydrated, user } = useAuthStore();

	const [data, setData] = useState<StudentData[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchStudents = async () => {
		try {
			const { data: resData, error } = await api.students.get();
			if (!error && resData?.data) {
				setData(resData.data as unknown as StudentData[]);
			}
		} catch (err) {
			console.error("Failed to load students", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}

		fetchStudents();
		const interval = setInterval(fetchStudents, 15000);
		return () => clearInterval(interval);
	}, [isAuthenticated, hasHydrated, router]);

	if (isLoading) {
		return (
			<div className="flex flex-col justify-center items-center h-80 gap-3 text-slate-500">
				<RefreshCw className="w-8 h-8 animate-spin text-[#0517B0]" />
				<p className="text-sm font-semibold">Memuat data semua mahasiswa...</p>
			</div>
		);
	}

	const role = user?.role || "superadmin";

	if (role === "superadmin" || role === "director" || role === "direktur") {
		return <SuperadminStudentsView data={data} user={user} />;
	}

	// Division-specific view for PMB, CRM, Akademik, Finance, Magang, PA, Evaluasi, Dosen
	return <DivisionStudentsView data={data} user={user} role={role} />;
}

// -------------------------------------------------------------
// DIVISION-SPECIFIC VIEW (PMB, CRM, Akademik, Finance, Magang, PA, etc.)
// -------------------------------------------------------------
function DivisionStudentsView({
	data,
	user,
	role,
}: {
	data: StudentData[];
	user: any;
	role: string;
}) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 20;

	// Cohort years
	const cohortYears = useMemo(() => {
		const currentYear = new Date().getFullYear();
		return Array.from(
			{ length: currentYear - 2022 + 2 },
			(_, i) => currentYear + 1 - i,
		);
	}, []);

	// Role configuration: title, context tab, checklist resolver
	const config = useMemo(() => {
		switch (role) {
			case "pmb":
				return {
					title: "Daftar Mahasiswa - Divisi PMB",
					subtitle:
						"Menampilkan semua mahasiswa terdaftar dan progres berkas pendaftaran PMB.",
					context: "pmb",
					progressLabel: "Progress PMB (14)",
					getChecklist: (s: StudentData) => getPmbChecklist(s.pmb),
					getStatus: (s: StudentData) => s.pmb?.status || "PERLU_PERHATIAN",
					getIsAcc: (s: StudentData) => Boolean(s.pmb?.isAcc),
				};
			case "crm":
				return {
					title: "Daftar Mahasiswa - Divisi CRM",
					subtitle:
						"Menampilkan semua mahasiswa terdaftar dan progres konsultasi/monitoring CRM.",
					context: "crm",
					progressLabel: "Progress CRM (6)",
					getChecklist: (s: StudentData) => getCrmChecklist(s.crm),
					getStatus: (s: StudentData) => s.crm?.status || "PERLU_PERHATIAN",
					getIsAcc: (s: StudentData) => Boolean(s.crm?.isAcc),
				};
			case "finance":
				return {
					title: "Daftar Mahasiswa - Divisi Keuangan",
					subtitle:
						"Menampilkan semua mahasiswa terdaftar dan progres kewajiban pembayaran keuangan.",
					context: "finance",
					progressLabel: "Progress Bayar (4)",
					getChecklist: (s: StudentData) => getFinanceChecklist(s.finance),
					getStatus: (s: StudentData) => s.finance?.status || "PERLU_PERHATIAN",
					getIsAcc: (s: StudentData) => Boolean(s.finance?.isAcc),
				};
			case "magang":
				return {
					title: "Daftar Mahasiswa - Divisi Magang & Hublu",
					subtitle:
						"Menampilkan semua mahasiswa terdaftar dan progres kelengkapan dokumen keberangkatan magang.",
					context: "magang",
					progressLabel: "Progress Magang (6)",
					getChecklist: (s: StudentData) =>
						getInternshipChecklist(s.internship),
					getStatus: (s: StudentData) =>
						s.internship?.status || "PERLU_PERHATIAN",
					getIsAcc: (s: StudentData) => Boolean(s.internship?.isAcc),
				};
			case "pa":
				return {
					title: "Daftar Mahasiswa Bimbingan PA",
					subtitle: `Menampilkan daftar mahasiswa bimbingan dari Pembimbing Akademik: ${user?.fullName || "Anda"}.`,
					context: "pa",
					progressLabel: "Progress PA (4)",
					getChecklist: (s: StudentData) => getPaChecklist(s.pa),
					getStatus: (s: StudentData) => s.pa?.status || "PERLU_PERHATIAN",
					getIsAcc: (s: StudentData) => Boolean(s.pa?.isAcc),
				};
			case "akademik":
			case "dosen":
			default:
				return {
					title: "Daftar Mahasiswa - Divisi Akademik",
					subtitle:
						"Menampilkan semua mahasiswa terdaftar dan progres evaluasi akademik serta presensi.",
					context: "akademik",
					progressLabel: "Progress Akademik (7)",
					getChecklist: (s: StudentData) => getAcademicChecklist(s),
					getStatus: (s: StudentData) =>
						s.academic?.status || "PERLU_PERHATIAN",
					getIsAcc: (s: StudentData) => Boolean(s.academic?.isAcc),
				};
		}
	}, [role, user?.fullName]);

	// Filter data by PA assignment if user is role 'pa'
	const baseData = useMemo(() => {
		if (!data) return [];
		if (role === "pa" && user?.id) {
			return data.filter((s: any) => s.student?.paId === user.id);
		}
		return data;
	}, [data, role, user?.id]);

	// Filter data by Cohort, Status, and Search
	const filteredData = useMemo(() => {
		return baseData.filter((s) => {
			const q = searchQuery.toLowerCase();
			const matchSearch =
				!q ||
				(s.student?.name || "").toLowerCase().includes(q) ||
				(s.student?.nim || "").toLowerCase().includes(q) ||
				(s.student?.phone || "").toLowerCase().includes(q) ||
				(s.student?.program || "").toLowerCase().includes(q);

			const matchCohort =
				selectedCohort === "all" ||
				s.student?.cohort?.toString() === selectedCohort;

			const status = config.getStatus(s);
			const isAcc = config.getIsAcc(s);

			let matchStatus = true;
			if (selectedStatus === "aman") matchStatus = status === "AMAN";
			if (selectedStatus === "perhatian")
				matchStatus = status === "PERLU_PERHATIAN";
			if (selectedStatus === "tidak_aman")
				matchStatus = status === "TIDAK_AMAN";
			if (selectedStatus === "acc") matchStatus = isAcc;

			return matchSearch && matchCohort && matchStatus;
		});
	}, [baseData, searchQuery, selectedCohort, selectedStatus, config]);

	// Reset page on filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedCohort, selectedStatus, searchQuery]);

	const paginatedData = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredData.slice(start, start + pageSize);
	}, [filteredData, currentPage]);

	// KPI Metrics based on baseData
	const totalStudents = baseData.length;
	const countAcc = baseData.filter((s) => config.getIsAcc(s)).length;
	const countAman = baseData.filter(
		(s) => config.getStatus(s) === "AMAN",
	).length;
	const countPerhatian = baseData.filter(
		(s) => config.getStatus(s) === "PERLU_PERHATIAN" || !config.getStatus(s),
	).length;
	const countTidakAman = baseData.filter(
		(s) => config.getStatus(s) === "TIDAK_AMAN",
	).length;

	const handleExport = () => {
		if (filteredData.length > 0) {
			const exportData = filteredData.map((s) => {
				const checklist = config.getChecklist(s);
				return {
					NIM: s.student?.nim || "-",
					"Nama Mahasiswa": s.student?.name || "-",
					Angkatan: s.student?.cohort || "-",
					"Tahun Ajaran": getAcademicYear(s.student),
					Peminatan: s.student?.subProgram || s.student?.program || "-",
					"No WhatsApp": s.student?.phone || "-",
					Progress: `${checklist.completed}/${checklist.total} (${Math.round((checklist.completed / checklist.total) * 100)}%)`,
					Status: config.getStatus(s),
					ACC: config.getIsAcc(s) ? "Sudah ACC" : "Belum",
				};
			});
			exportToCSV(
				exportData,
				`Data_Mahasiswa_${role.toUpperCase()}_${new Date().toISOString().split("T")[0]}`,
			);
		}
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-100">
							<Users className="w-6 h-6" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-2xl font-bold text-slate-900">
									{config.title}
								</h1>
								{role === "pa" && (
									<Badge className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
										Bimbingan Anda
									</Badge>
								)}
							</div>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								{config.subtitle}
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

					{role === "pmb" && (
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
						Export CSV
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-600">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
							<ShieldCheck className="h-5 w-5" />
						</div>
						<div>
							<p className="text-emerald-700 text-xs font-bold">
								Sudah ACC Divisi
							</p>
							<p className="text-2xl font-black text-emerald-900 mt-0.5">
								{countAcc}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-emerald-50 text-emerald-500 mt-0.5">
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
						<div className="p-2 rounded-lg bg-amber-50 text-amber-500 mt-0.5">
							<Clock className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								🟡 Berproses / Perhatian
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countPerhatian}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Table Card */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
							<Users className="w-4 h-4 text-[#0517B0]" />
							Daftar Mahasiswa Terdaftar
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Menampilkan {filteredData.length} dari {totalStudents} mahasiswa.
						</p>
					</div>

					{/* Filters & Search */}
					<div className="flex flex-wrap items-center gap-2.5">
						<div className="relative w-full sm:w-60">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari NIM, Nama, No HP..."
								className="pl-9 h-9 text-xs bg-white border-slate-200"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<Select
							value={selectedCohort}
							onValueChange={(val) => setSelectedCohort(val || "all")}
						>
							<SelectTrigger className="w-[125px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Angkatan" />
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

						<Select
							value={selectedStatus}
							onValueChange={(val) => setSelectedStatus(val || "all")}
						>
							<SelectTrigger className="w-[135px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Status Filter" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Status</SelectItem>
								<SelectItem value="aman">🟢 Aman</SelectItem>
								<SelectItem value="perhatian">🟡 Berproses</SelectItem>
								<SelectItem value="tidak_aman">🔴 Kendala</SelectItem>
								<SelectItem value="acc">🛡️ Sudah ACC</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-slate-50 sticky top-0 z-10">
								<TableRow className="border-slate-200">
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs">
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
										{config.progressLabel}
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right pr-6 w-24">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedData.map((s) => {
									const { items, completed, total, isDone } =
										config.getChecklist(s);
									const waUrl = formatWhatsAppUrl(s.student?.phone);

									return (
										<TableRow
											key={s.student.id}
											className="border-slate-100 hover:bg-blue-50/40 transition-colors"
										>
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

											<TableCell className="text-center font-medium text-xs text-slate-700">
												{getAcademicYear(s.student)}
											</TableCell>

											<TableCell>
												<PeminatanBadge
													subProgram={s.student.subProgram}
													destinationCountry={s.student.destinationCountry}
													program={s.student.program}
												/>
											</TableCell>

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
																				: completed >= Math.ceil(total / 2)
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
																	Indikator Divisi:
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

											{/* Action */}
											<TableCell className="text-right pr-6">
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														router.push(
															`/dashboard/students/${s.student.id}?context=${config.context}`,
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
									Tidak ada data mahasiswa ditemukan.
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
							itemName="Mahasiswa"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// -------------------------------------------------------------
// SUPERADMIN & DIRECTOR MASTER VIEW (7 Modul, ACC Master, Full Details)
// -------------------------------------------------------------
function SuperadminStudentsView({
	data,
	user,
}: {
	data: StudentData[];
	user: any;
}) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 20;

	// Cohort years starting from 2022 downwards
	const cohortYears = useMemo(() => {
		const currentYear = new Date().getFullYear();
		return Array.from(
			{ length: currentYear - 2022 + 2 },
			(_, i) => currentYear + 1 - i,
		);
	}, []);

	// Filtered students by Cohort, Status, and Search
	const filteredData = useMemo(() => {
		return data.filter((s) => {
			const q = searchQuery.toLowerCase();
			const matchSearch =
				!q ||
				(s.student?.name || "").toLowerCase().includes(q) ||
				(s.student?.nim || "").toLowerCase().includes(q) ||
				(s.student?.phone || "").toLowerCase().includes(q) ||
				(s.student?.program || "").toLowerCase().includes(q);

			const matchCohort =
				selectedCohort === "all" ||
				s.student?.cohort?.toString() === selectedCohort;

			const rtStatus = getRealtimeOverallStatus(s);
			const { isAllAcc } = getStudentAccDetails(s);
			let matchStatus = true;
			if (selectedStatus === "aman") matchStatus = rtStatus === "AMAN";
			if (selectedStatus === "perhatian")
				matchStatus = rtStatus === "PERLU_PERHATIAN";
			if (selectedStatus === "tidak_aman")
				matchStatus = rtStatus === "TIDAK_AMAN";
			if (selectedStatus === "acc_lengkap") matchStatus = isAllAcc;
			if (selectedStatus === "layak_berangkat")
				matchStatus =
					s.decision?.evaluatorDecision === "layak_berangkat" ||
					s.decision?.isApprovedByDirector === true;

			return matchSearch && matchCohort && matchStatus;
		});
	}, [data, searchQuery, selectedCohort, selectedStatus]);

	// Reset page on filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedCohort, selectedStatus, searchQuery]);

	const paginatedData = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredData.slice(start, start + pageSize);
	}, [filteredData, currentPage]);

	const cohortData = useMemo(() => {
		if (selectedCohort === "all") return data;
		return data.filter((s) => s.student?.cohort?.toString() === selectedCohort);
	}, [data, selectedCohort]);

	// KPI Stats based on selected cohort
	const totalStudents = cohortData.length;
	const countAman = cohortData.filter(
		(s) => getRealtimeOverallStatus(s) === "AMAN",
	).length;
	const countPerhatian = cohortData.filter(
		(s) => getRealtimeOverallStatus(s) === "PERLU_PERHATIAN",
	).length;
	const countTidakAman = cohortData.filter(
		(s) => getRealtimeOverallStatus(s) === "TIDAK_AMAN",
	).length;
	const countAccLengkap = cohortData.filter(
		(s) => getStudentAccDetails(s).isAllAcc,
	).length;
	const countLayakBerangkat = cohortData.filter(
		(s) =>
			s.decision?.evaluatorDecision === "layak_berangkat" ||
			s.decision?.isApprovedByDirector === true,
	).length;

	const handleExport = () => {
		if (filteredData.length > 0) {
			const exportData = filteredData.map((s) => {
				const { accCount } = getStudentAccDetails(s);
				return {
					NIM: s.student.nim,
					"Nama Mahasiswa": s.student.name,
					"Program Studi": s.student.program,
					Angkatan: s.student.cohort,
					"Tahun Ajaran": getAcademicYear(s.student),
					"No HP": s.student.phone || "-",
					"Progress ACC": `${accCount}/7 Modul`,
					"Status PMB": s.pmb?.status || "-",
					"Status CRM": s.crm?.status || "-",
					"Status Finance": s.finance?.status || "-",
					"Status Akademik": s.academic?.status || "-",
					"Status PA": s.pa?.status || "-",
					"Status Magang": s.internship?.status || "-",
					"Status Keseluruhan": getRealtimeOverallStatus(s),
					"Keputusan Evaluator": s.decision?.evaluatorDecision || "menunggu",
					"Disetujui Direktur": s.decision?.isApprovedByDirector
						? "Ya"
						: "Belum",
					"Tgl Keberangkatan": s.decision?.departureDate
						? new Date(s.decision.departureDate).toLocaleDateString("id-ID")
						: "-",
				};
			});
			exportToCSV(
				exportData,
				`Data_Master_Semua_Mahasiswa_${new Date().toISOString().split("T")[0]}`,
			);
		}
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-100">
							<Users className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								Pusat Data Master Mahasiswa (Superadmin)
							</h1>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								Pusat data master mahasiswa, status kelengkapan 7 divisi, dan
								manajemen akun.
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

					<Link href="/dashboard/students/archive">
						<Button
							variant="outline"
							size="sm"
							className="border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100 text-xs gap-1.5 h-9 font-semibold"
						>
							<Archive className="w-3.5 h-3.5 text-amber-700" />
							Arsip
						</Button>
					</Link>

					<Link href="/dashboard/students/add">
						<Button
							size="sm"
							className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 h-9 font-bold shadow-sm"
						>
							<UserPlus className="w-3.5 h-3.5" />
							Tambah Mahasiswa
						</Button>
					</Link>

					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9"
					>
						<Download className="w-3.5 h-3.5" />
						Export CSV
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

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-600">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
							<ShieldCheck className="h-5 w-5" />
						</div>
						<div>
							<p className="text-emerald-700 text-xs font-bold">
								ACC Lengkap 7/7
							</p>
							<p className="text-2xl font-black text-emerald-900 mt-0.5">
								{countAccLengkap}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-emerald-50 text-emerald-500 mt-0.5">
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
						<div className="p-2 rounded-lg bg-amber-50 text-amber-500 mt-0.5">
							<Clock className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								🟡 Perlu Perhatian
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countPerhatian}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-rose-50 text-rose-500 mt-0.5">
							<XCircle className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								⛔ Tidak Aman
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
							<Plane className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								Layak Berangkat
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countLayakBerangkat}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Master Table Card */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
							<Users className="w-4 h-4 text-[#0517B0]" />
							Daftar Master Mahasiswa
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Menampilkan {filteredData.length} dari {totalStudents} mahasiswa
							terdaftar.
						</p>
					</div>

					{/* Filters & Search */}
					<div className="flex flex-wrap items-center gap-2.5">
						<div className="relative w-full sm:w-60">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari NIM, Nama, No HP..."
								className="pl-9 h-9 text-xs bg-white border-slate-200"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<Select
							value={selectedCohort}
							onValueChange={(val) => setSelectedCohort(val || "all")}
						>
							<SelectTrigger className="w-[125px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Angkatan" />
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

						<Select
							value={selectedStatus}
							onValueChange={(val) => setSelectedStatus(val || "all")}
						>
							<SelectTrigger className="w-[135px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Status Filter" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Status</SelectItem>
								<SelectItem value="aman">🟢 Aman</SelectItem>
								<SelectItem value="perhatian">🟡 Perlu Perhatian</SelectItem>
								<SelectItem value="tidak_aman">🔴 Tidak Aman</SelectItem>
								<SelectItem value="acc_lengkap">🛡️ ACC Lengkap (7/7)</SelectItem>
								<SelectItem value="layak_berangkat">
									✈️ Layak Berangkat
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-slate-50 sticky top-0 z-10">
								<TableRow className="border-slate-200">
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs">
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
										Progress 7 Modul
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-48">
										Status Divisi (P C F A D PA M)
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-28">
										Kondisi
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
										Keputusan Final
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right pr-6 w-36">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedData.map((s) => {
									const { modules, accCount, isAllAcc } =
										getStudentAccDetails(s);
									const rtStatus = getRealtimeOverallStatus(s);
									const waUrl = formatWhatsAppUrl(s.student?.phone);

									return (
										<TableRow
											key={s.student.id}
											className="border-slate-100 hover:bg-blue-50/40 transition-colors"
										>
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

											<TableCell className="text-center font-medium text-xs text-slate-700">
												{getAcademicYear(s.student)}
											</TableCell>

											<TableCell>
												<PeminatanBadge
													subProgram={s.student.subProgram}
													destinationCountry={s.student.destinationCountry}
													program={s.student.program}
												/>
											</TableCell>

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

											{/* Progress Bar with Enhanced Tooltip */}
											<TableCell className="text-center">
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger className="w-full">
															<div className="flex flex-col items-center gap-1">
																<div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 px-1">
																	<span>{accCount}/7 ACC</span>
																	<span
																		className={
																			isAllAcc
																				? "text-emerald-600"
																				: "text-slate-500"
																		}
																	>
																		{Math.round((accCount / 7) * 100)}%
																	</span>
																</div>
																<div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
																	<div
																		className={`h-full rounded-full transition-all duration-300 ${
																			isAllAcc
																				? "bg-emerald-500"
																				: accCount >= 4
																					? "bg-blue-500"
																					: "bg-amber-500"
																		}`}
																		style={{
																			width: `${(accCount / 7) * 100}%`,
																		}}
																	/>
																</div>
															</div>
														</TooltipTrigger>
														<TooltipContent className="w-64 p-3.5 bg-slate-950 text-white rounded-xl shadow-2xl border border-slate-800 text-xs flex flex-col space-y-2 z-50">
															<div className="flex items-center justify-between border-b border-slate-800 pb-1.5 w-full">
																<span className="font-bold text-slate-100 text-xs">
																	Rincian ACC 7 Divisi:
																</span>
																<span className="text-[11px] font-mono text-emerald-400 font-bold">
																	{accCount}/7 ACC
																</span>
															</div>
															<div className="flex flex-col space-y-1.5 w-full">
																{modules.map((m) => (
																	<div
																		key={m.name}
																		className="flex items-center justify-between text-[11px] w-full"
																	>
																		<span className="text-slate-300 font-medium">
																			{m.name}
																		</span>
																		<span
																			className={`font-semibold ${
																				m.isAcc
																					? "text-emerald-400"
																					: "text-slate-500"
																			}`}
																		>
																			{m.isAcc ? "✓ ACC" : "Belum ACC"}
																		</span>
																	</div>
																))}
															</div>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>

											{/* Mini Module Indicators */}
											<TableCell className="text-center">
												<div className="flex items-center justify-center gap-1">
													{modules.map((m) => (
														<TooltipProvider key={m.name}>
															<Tooltip>
																<TooltipTrigger>
																	<span
																		className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-black ${
																			m.isAcc
																				? "bg-emerald-100 text-emerald-800 border border-emerald-300"
																				: "bg-slate-100 text-slate-400 border border-slate-200"
																		}`}
																	>
																		{m.name[0]}
																	</span>
																</TooltipTrigger>
																<TooltipContent className="text-xs">
																	<p className="font-semibold">{m.name}</p>
																	<p className="text-[11px] text-slate-300">
																		{m.isAcc ? "Sudah di-ACC" : "Belum ACC"}
																	</p>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													))}
												</div>
											</TableCell>

											{/* Condition Badge */}
											<TableCell className="text-center">
												{rtStatus === "AMAN" ? (
													<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
														🟢 Aman
													</Badge>
												) : rtStatus === "PERLU_PERHATIAN" ? (
													<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">
														🟡 Perhatian
													</Badge>
												) : (
													<Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold">
														⛔ Blocking
													</Badge>
												)}
											</TableCell>

											{/* Final Decision Badge */}
											<TableCell className="text-center">
												{s.decision?.evaluatorDecision === "layak_berangkat" ? (
													<Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs">
														🟢 Layak
													</Badge>
												) : s.decision?.evaluatorDecision === "ttd_kontrak" ? (
													<Badge className="bg-blue-50 text-blue-700 border-blue-300 font-semibold text-xs">
														🔵 Kontrak
													</Badge>
												) : s.decision?.evaluatorDecision ===
													"lanjut_interview" ? (
													<Badge className="bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs">
														🟡 Interview
													</Badge>
												) : s.decision?.evaluatorDecision === "remedial" ? (
													<Badge className="bg-rose-50 text-rose-700 border-rose-300 font-semibold text-xs">
														🔴 Remedial
													</Badge>
												) : (
													<span className="text-xs text-slate-400 italic">
														Menunggu
													</span>
												)}
											</TableCell>

											{/* Actions */}
											<TableCell className="text-right pr-6">
												<div className="flex items-center justify-end gap-1.5">
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
													<Button
														size="sm"
														variant="ghost"
														onClick={() =>
															router.push(
																`/dashboard/students/${s.student.id}/edit`,
															)
														}
														className="h-8 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2"
														title="Edit Data Mahasiswa"
													>
														<Edit className="w-3.5 h-3.5" />
													</Button>
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
									Tidak ada data mahasiswa ditemukan.
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
							itemName="Mahasiswa"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
