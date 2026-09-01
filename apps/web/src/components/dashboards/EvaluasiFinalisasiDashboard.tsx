"use client";

import {
	AlertTriangle,
	Calendar,
	CheckCircle,
	CheckCircle2,
	Clock,
	Download,
	Edit3,
	Eye,
	FileCheck,
	FileText,
	GraduationCap,
	HeartHandshake,
	HelpCircle,
	Layers,
	MessageCircle,
	Plane,
	Printer,
	RefreshCw,
	RotateCcw,
	Search,
	ShieldAlert,
	ShieldCheck,
	User,
	UserCheck,
	Users,
	Wallet,
	XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeumorphicStatCard } from "@/components/ui/NeumorphicStatCard";
import { PanelStatusBadge } from "@/components/ui/PanelStatusBadge";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import {
	calculateOverallStatus,
	calculateProgressStatus,
	normalizeStatus,
	type PanelStatusType,
} from "@/utils/status";

// Checklist Helpers for Division Progress (matching /dashboard/students)
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
			name: "Dokumen Persetujuan Ortu",
			done: Boolean(crm?.parentApprovalLetter || crm?.parentConsent),
		},
		{
			name: "Pernyataan Komitmen",
			done: Boolean(crm?.commitmentStatement || crm?.commitmentLetter),
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
	const items = [
		{ name: "Lulus Ujian Masuk", done: Boolean(s.academic?.entryExamPassed) },
		{
			name: "Placement Test Bahasa",
			done: Boolean(s.academic?.placementTestPassed),
		},
		{
			name: "Kehadiran Min. 80%",
			done: Boolean(
				s.academic?.attendancePercentage &&
					s.academic.attendancePercentage >= 80,
			),
		},
		{
			name: "Bebas Masalah Disiplin",
			done: Boolean(s.academic?.disciplinaryClean),
		},
		{
			name: "Ujian Akhir Semester / Modul",
			done: Boolean(s.academic?.finalExamPassed),
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
			name: isTalangan
				? "Perkuliahan Semester (Talangan)"
				: "Perkuliahan 6 Semester",
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
		{
			name: "Biaya Sertifikasi Bahasa (TOEIC)",
			done: Boolean(fin?.toeicStatus),
		},
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
		{ name: "Konseling Selesai", done: Boolean(pa?.counselingDone) },
		{ name: "Mental Stabil", done: Boolean(pa?.mentalStable) },
		{ name: "Disiplin Baik", done: Boolean(pa?.disciplineGood) },
	];
	const completed = items.filter((i) => i.done).length;
	return {
		items,
		completed,
		total: items.length,
		isDone: completed === items.length,
	};
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
	if (student?.cohort && !Number.isNaN(Number(student.cohort))) {
		const startYear = 2010 + Number(student.cohort);
		return `${startYear}/${startYear + 1}`;
	}
	return student?.period || "-";
}

// Calculate 7-Module Details
const getStudentAccDetails = (s: any) => {
	const pmbCl = getPmbChecklist(s.pmb);
	const crmCl = getCrmChecklist(s.crm);
	const finCl = getFinanceChecklist(s.finance);
	const acadCl = getAcademicChecklist(s);
	const paCl = getPaChecklist(s.pa);
	const internCl = getInternshipChecklist(s.internship);

	const isDosenAcc =
		s.courseGrades &&
		s.courseGrades.length > 0 &&
		s.courseGrades.every((g: any) => g.isAcc);

	const modules: Array<{
		key: string;
		name: string;
		shortCode: string;
		isAcc: boolean;
		completed: number;
		total: number;
		status: PanelStatusType;
	}> = [
		{
			key: "pmb",
			name: "PMB",
			shortCode: "P",
			isAcc: Boolean(s.pmb?.isAcc),
			completed: pmbCl.completed,
			total: pmbCl.total,
			status: calculateProgressStatus(
				pmbCl.completed,
				pmbCl.total,
				s.pmb?.isAcc,
			),
		},
		{
			key: "crm",
			name: "CRM",
			shortCode: "C",
			isAcc: Boolean(s.crm?.isAcc),
			completed: crmCl.completed,
			total: crmCl.total,
			status: calculateProgressStatus(
				crmCl.completed,
				crmCl.total,
				s.crm?.isAcc,
			),
		},
		{
			key: "finance",
			name: "Finance",
			shortCode: "F",
			isAcc: Boolean(s.finance?.isAcc),
			completed: finCl.completed,
			total: finCl.total,
			status: calculateProgressStatus(
				finCl.completed,
				finCl.total,
				s.finance?.isAcc,
			),
		},
		{
			key: "academic",
			name: "Akademik",
			shortCode: "A",
			isAcc: Boolean(s.academic?.isAcc),
			completed: acadCl.completed,
			total: acadCl.total,
			status: calculateProgressStatus(
				acadCl.completed,
				acadCl.total,
				s.academic?.isAcc,
			),
		},
		{
			key: "dosen",
			name: "Dosen MK",
			shortCode: "D",
			isAcc: Boolean(isDosenAcc),
			completed: isDosenAcc ? 1 : 0,
			total: 1,
			status: calculateProgressStatus(isDosenAcc ? 1 : 0, 1, isDosenAcc),
		},
		{
			key: "pa",
			name: "PA",
			shortCode: "PA",
			isAcc: Boolean(s.pa?.isAcc),
			completed: paCl.completed,
			total: paCl.total,
			status: calculateProgressStatus(paCl.completed, paCl.total, s.pa?.isAcc),
		},
		{
			key: "internship",
			name: "Magang",
			shortCode: "M",
			isAcc: Boolean(s.internship?.isAcc),
			completed: internCl.completed,
			total: internCl.total,
			status: calculateProgressStatus(
				internCl.completed,
				internCl.total,
				s.internship?.isAcc,
			),
		},
	];

	const accCount = modules.filter((m) => m.isAcc).length;
	const overallStatus = calculateOverallStatus(modules);

	return { modules, accCount, isAllAcc: accCount === 7, overallStatus };
};

interface EvaluasiFinalisasiDashboardProps {
	data: any[];
	searchQuery: string;
	setSearchQuery: (val: string) => void;
	user: any;
	onUpdate?: () => void;
}

export function EvaluasiFinalisasiDashboard({
	data,
	searchQuery,
	setSearchQuery,
	user,
	onUpdate,
}: EvaluasiFinalisasiDashboardProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialTab =
		searchParams.get("tab") === "finalisasi" ? "finalisasi" : "evaluasi";

	const [activeTab, setActiveTab] = useState<string>(initialTab);
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedDecisionFilter, setSelectedDecisionFilter] =
		useState<string>("all");
	const [selectedStatusFilter, setSelectedStatusFilter] =
		useState<string>("all");
	const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

	// Quick Decision Modal State
	const [decisionModalOpen, setDecisionModalOpen] = useState(false);
	const [activeStudent, setActiveStudent] = useState<any | null>(null);
	const [selectedDecision, setSelectedDecision] = useState<string>("menunggu");
	const [decisionNotes, setDecisionNotes] = useState<string>("");
	const [isSavingDecision, setIsSavingDecision] = useState(false);

	// Departure Setting Modal State
	const [departureModalOpen, setDepartureModalOpen] = useState(false);
	const [departureStudent, setDepartureStudent] = useState<any | null>(null);
	const [departureDate, setDepartureDate] = useState<string>("");
	const [directorNotes, setDirectorNotes] = useState<string>("");
	const [confidentialNotes, setConfidentialNotes] = useState<string>("");
	const [isSavingDeparture, setIsSavingDeparture] = useState(false);

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

	// Filtered for Main Table (Evaluasi Tab)
	const filteredData = useMemo(() => {
		if (!data) return [];
		return data.filter((s: any) => {
			// Search filter
			const q = searchQuery.toLowerCase();
			const matchSearch =
				!q ||
				(s.student?.name || "").toLowerCase().includes(q) ||
				(s.student?.nim || "").toLowerCase().includes(q) ||
				(s.student?.phone || "").toLowerCase().includes(q) ||
				(s.student?.program || "").toLowerCase().includes(q);

			// Cohort filter
			const matchCohort =
				selectedCohort === "all" ||
				s.student?.cohort?.toString() === selectedCohort ||
				(Number(selectedCohort) >= 2000 &&
					s.student?.cohort === Number(selectedCohort) - 2010);

			// Decision filter
			const studentDecision = s.decision?.evaluatorDecision || "menunggu";
			const matchDecision =
				selectedDecisionFilter === "all" ||
				studentDecision === selectedDecisionFilter;

			// Status filter
			const { isAllAcc, overallStatus } = getStudentAccDetails(s);
			let matchStatus = true;
			if (selectedStatusFilter === "acc_lengkap") matchStatus = isAllAcc;
			if (selectedStatusFilter === "aman")
				matchStatus = overallStatus === "AMAN";
			if (selectedStatusFilter === "proses")
				matchStatus = overallStatus === "PROSES";
			if (selectedStatusFilter === "butuh_perhatian")
				matchStatus = overallStatus === "BUTUH_PERHATIAN";
			if (selectedStatusFilter === "layak_berangkat")
				matchStatus =
					s.decision?.evaluatorDecision === "layak_berangkat" ||
					s.decision?.isApprovedByDirector === true;

			return matchSearch && matchCohort && matchDecision && matchStatus;
		});
	}, [
		data,
		searchQuery,
		selectedCohort,
		selectedDecisionFilter,
		selectedStatusFilter,
	]);

	// Filtered for Candidates Tab (Layak Berangkat or Approved)
	const candidatesData = useMemo(() => {
		return filteredData.filter(
			(s: any) =>
				s.decision?.evaluatorDecision === "layak_berangkat" ||
				s.decision?.isApprovedByDirector === true,
		);
	}, [filteredData]);

	// Pagination States
	const [evaluasiPage, setEvaluasiPage] = useState(1);
	const [evaluasiPageSize, setEvaluasiPageSize] = useState(20);
	const [finalisasiPage, setFinalisasiPage] = useState(1);
	const [finalisasiPageSize, setFinalisasiPageSize] = useState(20);

	useEffect(() => {
		setEvaluasiPage(1);
		setFinalisasiPage(1);
	}, [
		searchQuery,
		selectedCohort,
		selectedDecisionFilter,
		selectedStatusFilter,
	]);

	const paginatedEvaluasiData = useMemo(() => {
		const start = (evaluasiPage - 1) * evaluasiPageSize;
		return filteredData.slice(start, start + evaluasiPageSize);
	}, [filteredData, evaluasiPage, evaluasiPageSize]);

	const paginatedFinalisasiData = useMemo(() => {
		const start = (finalisasiPage - 1) * finalisasiPageSize;
		return candidatesData.slice(start, start + finalisasiPageSize);
	}, [candidatesData, finalisasiPage, finalisasiPageSize]);

	const cohortData = useMemo(() => {
		if (!data) return [];
		if (selectedCohort === "all") return data;
		return data.filter(
			(s: any) => s.student?.cohort?.toString() === selectedCohort,
		);
	}, [data, selectedCohort]);

	// KPI Stats based on selected cohort (matching /dashboard/students)
	const totalStudents = cohortData.length;
	const countAccLengkap = cohortData.filter(
		(s: any) => getStudentAccDetails(s).isAllAcc,
	).length;
	const countAman = cohortData.filter(
		(s: any) => getStudentAccDetails(s).overallStatus === "AMAN",
	).length;
	const countProses = cohortData.filter(
		(s: any) => getStudentAccDetails(s).overallStatus === "PROSES",
	).length;
	const countPerhatian = cohortData.filter(
		(s: any) => getStudentAccDetails(s).overallStatus === "BUTUH_PERHATIAN",
	).length;
	const countLayakBerangkat = cohortData.filter(
		(s: any) =>
			s.decision?.evaluatorDecision === "layak_berangkat" ||
			s.decision?.isApprovedByDirector === true,
	).length;

	// Handle Quick Decision Modal open
	const handleOpenDecision = (studentItem: any) => {
		setActiveStudent(studentItem);
		setSelectedDecision(studentItem.decision?.evaluatorDecision || "menunggu");
		setDecisionNotes(studentItem.decision?.evaluatorNotes || "");
		setDecisionModalOpen(true);
	};

	// Save Quick Decision
	const handleSaveDecision = async () => {
		if (!activeStudent) return;
		setIsSavingDecision(true);
		try {
			const res = await api.students[activeStudent.student.id.toString()][
				"final-decision"
			].patch({
				evaluatorDecision: selectedDecision,
				evaluatorNotes: decisionNotes || undefined,
			});

			if (res.data?.success) {
				toast.success(
					`Keputusan untuk ${activeStudent.student.name} berhasil disimpan`,
				);
				setDecisionModalOpen(false);
				onUpdate?.();
			} else {
				toast.error(res.data?.message || "Gagal menyimpan keputusan");
			}
		} catch (err: any) {
			toast.error(err?.message || "Terjadi kesalahan");
		} finally {
			setIsSavingDecision(false);
		}
	};

	// Handle Open Departure Setting
	const handleOpenDeparture = (studentItem: any) => {
		setDepartureStudent(studentItem);
		setDepartureDate(
			studentItem.decision?.departureDate
				? new Date(studentItem.decision.departureDate)
						.toISOString()
						.split("T")[0]
				: "",
		);
		setDirectorNotes(studentItem.decision?.notes || "");
		setConfidentialNotes(studentItem.decision?.confidentialNotes || "");
		setDepartureModalOpen(true);
	};

	// Save Departure & Director Approval
	const handleSaveDeparture = async (isApproved: boolean) => {
		if (!departureStudent) return;
		setIsSavingDeparture(true);
		try {
			const res = await api.students[departureStudent.student.id][
				"final-decision"
			]["director-approval"].patch({
				isApproved,
				departureDate: departureDate || undefined,
				notes: directorNotes || undefined,
			});

			if (confidentialNotes) {
				await api.students[departureStudent.student.id]["final-decision"][
					"confidential-notes"
				].patch({
					confidentialNotes,
				});
			}

			if (res.data?.success) {
				toast.success(
					isApproved
						? `Persetujuan & Jadwal ${departureStudent.student.name} berhasil disimpan`
						: "Persetujuan dicabut",
				);
				setDepartureModalOpen(false);
				onUpdate?.();
			} else {
				toast.error(res.data?.message || "Gagal memproses data");
			}
		} catch (err: any) {
			toast.error(err?.message || "Terjadi kesalahan saat menyimpan");
		} finally {
			setIsSavingDeparture(false);
		}
	};

	// Export CSV handler
	const handleExport = (tab: "evaluasi" | "finalisasi") => {
		if (tab === "evaluasi") {
			const exportData = filteredData.map((s: any) => {
				const { accCount, overallStatus } = getStudentAccDetails(s);
				return {
					NIM: s.student.nim,
					"Nama Mahasiswa": s.student.name,
					Angkatan: s.student.cohort,
					"Tahun Ajaran": getAcademicYear(s.student),
					"No HP": s.student.phone || "-",
					Program: s.student.program,
					"Progress ACC": `${accCount}/7 Modul`,
					"Status Keseluruhan": overallStatus,
					"Keputusan Final":
						s.decision?.evaluatorDecision === "layak_berangkat"
							? "Layak Berangkat"
							: s.decision?.evaluatorDecision === "ttd_kontrak"
								? "TTD Kontrak"
								: s.decision?.evaluatorDecision === "lanjut_interview"
									? "Lanjut Interview"
									: s.decision?.evaluatorDecision === "remedial"
										? "Remedial / Tunda"
										: "Menunggu",
					"Catatan Evaluator": s.decision?.evaluatorNotes || "-",
				};
			});
			exportToCSV(
				exportData,
				`Evaluasi_Finalisasi_${new Date().toISOString().split("T")[0]}`,
			);
		} else {
			const exportData = candidatesData.map((s: any) => {
				return {
					NIM: s.student.nim,
					"Nama Mahasiswa": s.student.name,
					Angkatan: s.student.cohort,
					"Tahun Ajaran": getAcademicYear(s.student),
					"No HP": s.student.phone || "-",
					Program: s.student.program,
					"Tgl Keberangkatan": s.decision?.departureDate
						? new Date(s.decision.departureDate).toLocaleDateString("id-ID")
						: "Belum Diatur",
					"Status Persetujuan Direktur": s.decision?.isApprovedByDirector
						? "Disetujui"
						: "Menunggu",
					"Catatan Direktur": s.decision?.notes || "-",
				};
			});
			exportToCSV(
				exportData,
				`Kandidat_Keberangkatan_SK_${new Date().toISOString().split("T")[0]}`,
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
							<ShieldCheck className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								Panel Finalisasi & SK
							</h1>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								Pusat evaluasi progres real-time antar divisi dan penetapan
								keputusan kelayakan keberangkatan mahasiswa.
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
						<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
						Terhubung Real-Time
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setIsRefreshing(true);
							onUpdate?.();
							setTimeout(() => setIsRefreshing(false), 600);
						}}
						disabled={isRefreshing}
						className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9"
					>
						<RefreshCw
							className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0517B0]" : ""}`}
						/>
						Refresh
					</Button>
					<Button
						size="sm"
						onClick={() => handleExport(activeTab as any)}
						className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 h-9 font-bold shadow-sm"
					>
						<Download className="w-3.5 h-3.5" />
						Export CSV ({activeTab === "evaluasi" ? "Evaluasi" : "Finalisasi"})
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards (matching /dashboard/students) */}
			<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
				<NeumorphicStatCard
					label="Total Mahasiswa"
					value={totalStudents}
					icon={<Users className="h-5 w-5" />}
					color="blue"
				/>
				<NeumorphicStatCard
					label="ACC Lengkap 7/7"
					value={countAccLengkap}
					icon={<ShieldCheck className="h-5 w-5" />}
					color="emerald"
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
					icon={<AlertTriangle className="h-5 w-5" />}
					color="rose"
				/>
				<NeumorphicStatCard
					label="Layak Berangkat"
					value={countLayakBerangkat}
					icon={<GraduationCap className="h-5 w-5" />}
					color="indigo"
				/>
			</div>

			{/* Main Card with Tabs */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					{/* Tabs Header Toolbar */}
					<div className="border-b border-slate-200 bg-slate-50/50 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div>
							<TabsList className="bg-slate-200/80 p-1 rounded-lg">
								<TabsTrigger
									value="evaluasi"
									className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm text-xs sm:text-sm font-bold gap-2 px-4 py-2 cursor-pointer"
								>
									<UserCheck className="w-4 h-4" />
									1. Evaluasi & Progres Real-Time
									<Badge
										variant="secondary"
										className="ml-1 text-[11px] bg-blue-100 text-[#0517B0] px-1.5 py-0.2"
									>
										{filteredData.length}
									</Badge>
								</TabsTrigger>
								<TabsTrigger
									value="finalisasi"
									className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm text-xs sm:text-sm font-bold gap-2 px-4 py-2 cursor-pointer"
								>
									<ShieldCheck className="w-4 h-4" />
									2. Finalisasi Keberangkatan & SK
									<Badge
										variant="secondary"
										className="ml-1 text-[11px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2"
									>
										{candidatesData.length}
									</Badge>
								</TabsTrigger>
							</TabsList>
							<p className="text-xs text-slate-500 mt-2">
								Menampilkan{" "}
								{activeTab === "evaluasi"
									? filteredData.length
									: candidatesData.length}{" "}
								dari {totalStudents} mahasiswa terdaftar.
							</p>
						</div>

						{/* Filters & Search Toolbar */}
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
								<SelectTrigger className="w-[130px] h-9 text-xs bg-white border-slate-200 cursor-pointer">
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

							{activeTab === "evaluasi" && (
								<>
									<Select
										value={selectedStatusFilter}
										onValueChange={(val) =>
											setSelectedStatusFilter(val || "all")
										}
									>
										<SelectTrigger className="w-[155px] h-9 text-xs bg-white border-slate-200 cursor-pointer">
											<SelectValue placeholder="Status Filter">
												{selectedStatusFilter === "all"
													? "Semua Status"
													: selectedStatusFilter === "acc_lengkap"
														? "ACC Lengkap (7/7)"
														: selectedStatusFilter === "aman"
															? "Aman"
															: selectedStatusFilter === "proses"
																? "Berproses"
																: selectedStatusFilter === "butuh_perhatian"
																	? "Butuh Perhatian"
																	: "Layak Berangkat"}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Semua Status</SelectItem>
											<SelectItem value="acc_lengkap">
												ACC Lengkap (7/7)
											</SelectItem>
											<SelectItem value="aman">Aman</SelectItem>
											<SelectItem value="proses">Berproses</SelectItem>
											<SelectItem value="butuh_perhatian">
												Butuh Perhatian
											</SelectItem>
											<SelectItem value="layak_berangkat">
												Layak Berangkat
											</SelectItem>
										</SelectContent>
									</Select>

									<Select
										value={selectedDecisionFilter}
										onValueChange={(val) =>
											setSelectedDecisionFilter(val || "all")
										}
									>
										<SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200 cursor-pointer">
											<SelectValue placeholder="Keputusan" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Semua Keputusan</SelectItem>
											<SelectItem value="layak_berangkat">
												Layak Berangkat
											</SelectItem>
											<SelectItem value="ttd_kontrak">TTD Kontrak</SelectItem>
											<SelectItem value="lanjut_interview">
												Lanjut Interview
											</SelectItem>
											<SelectItem value="remedial">Remedial / Tunda</SelectItem>
											<SelectItem value="menunggu">Menunggu</SelectItem>
										</SelectContent>
									</Select>
								</>
							)}

							{/* Reset Button Inline */}
							{(searchQuery.trim() !== "" ||
								selectedCohort !== "all" ||
								selectedStatusFilter !== "all" ||
								selectedDecisionFilter !== "all") && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setSearchQuery("");
										setSelectedCohort("all");
										setSelectedStatusFilter("all");
										setSelectedDecisionFilter("all");
									}}
									className="h-9 px-3 text-xs border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5 font-medium transition-colors"
								>
									<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
									Reset
								</Button>
							)}
						</div>
					</div>

					{/* TAB 1: Evaluasi & Progres Real-Time */}
					<TabsContent value="evaluasi" className="p-0 m-0">
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
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
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
									{paginatedEvaluasiData.map((s: any) => {
										const { modules, accCount, isAllAcc, overallStatus } =
											getStudentAccDetails(s);
										const waUrl = formatWhatsAppUrl(s.student?.phone);

										return (
											<TableRow
												key={s.student.id}
												className="border-slate-100 hover:bg-blue-50/40 transition-colors cursor-pointer"
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
													{getAcademicYear(s.student)}
												</TableCell>

												{/* Peminatan */}
												<TableCell>
													<PeminatanBadge
														subProgram={s.student.subProgram}
														destinationCountry={s.student.destinationCountry}
														program={s.student.program}
													/>
												</TableCell>

												{/* No WhatsApp */}
												<TableCell>
													{s.student?.phone ? (
														waUrl ? (
															<a
																href={waUrl}
																target="_blank"
																rel="noopener noreferrer"
																className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition-colors group"
																title="Chat WhatsApp"
																onClick={(e) => e.stopPropagation()}
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
															<TooltipTrigger className="w-full cursor-pointer">
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
																		Rincian Status 7 Divisi:
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
																			<PanelStatusBadge
																				status={m.status}
																				size="sm"
																				useShortLabel
																			/>
																		</div>
																	))}
																</div>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</TableCell>

												{/* Mini Module Indicators (P C F A D PA M) */}
												<TableCell className="text-center">
													<div className="flex items-center justify-center gap-1">
														{modules.map((m) => (
															<TooltipProvider key={m.name}>
																<Tooltip>
																	<TooltipTrigger>
																		<span
																			className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-black transition-transform hover:scale-110 ${
																				m.status === "ACC"
																					? "bg-emerald-100 text-emerald-800 border border-emerald-400"
																					: m.status === "AMAN"
																						? "bg-emerald-50 text-emerald-700 border border-emerald-300"
																						: m.status === "PROSES"
																							? "bg-amber-50 text-amber-800 border border-amber-300"
																							: "bg-rose-50 text-rose-800 border border-rose-300"
																			}`}
																		>
																			{m.shortCode}
																		</span>
																	</TooltipTrigger>
																	<TooltipContent className="text-xs p-2">
																		<p className="font-bold">
																			{m.name}:{" "}
																			{m.status === "ACC"
																				? "Disetujui (ACC)"
																				: m.status === "AMAN"
																					? "Aman"
																					: m.status === "PROSES"
																						? "Berproses"
																						: "Butuh Perhatian"}
																		</p>
																		<p className="text-[11px] text-slate-300">
																			{m.isAcc
																				? "✓ Sudah di-ACC"
																				: `${m.completed}/${m.total} Selesai`}
																		</p>
																	</TooltipContent>
																</Tooltip>
															</TooltipProvider>
														))}
													</div>
												</TableCell>

												{/* Unified Condition Badge */}
												<TableCell className="text-center">
													<PanelStatusBadge status={overallStatus} />
												</TableCell>

												{/* Final Decision Badge */}
												<TableCell className="text-center">
													{s.decision?.evaluatorDecision ===
													"layak_berangkat" ? (
														<Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs">
															Layak
														</Badge>
													) : s.decision?.evaluatorDecision ===
														"ttd_kontrak" ? (
														<Badge className="bg-blue-50 text-blue-700 border-blue-300 font-semibold text-xs">
															Kontrak
														</Badge>
													) : s.decision?.evaluatorDecision ===
														"lanjut_interview" ? (
														<Badge className="bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs">
															Interview
														</Badge>
													) : s.decision?.evaluatorDecision === "remedial" ? (
														<Badge className="bg-rose-50 text-rose-700 border-rose-300 font-semibold text-xs">
															Remedial
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
															onClick={(e) => {
																e.stopPropagation();
																router.push(
																	`/dashboard/students/${s.student.id}/profile`,
																);
															}}
															className="h-8 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 gap-1 px-2.5 shadow-2xs cursor-pointer"
															title="Lihat Detail Profil Mahasiswa"
														>
															<User className="w-3.5 h-3.5 text-[#0517B0]" />
															Lihat
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={(e) => {
																e.stopPropagation();
																router.push(
																	`/dashboard/students/${s.student.id}?tab=final-decision`,
																);
															}}
															className="h-8 text-xs font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 gap-1 px-2.5 shadow-2xs cursor-pointer"
															title="Periksa Detail Lengkap Mahasiswa"
														>
															<Eye className="w-3.5 h-3.5" />
															Periksa
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={(e) => {
																e.stopPropagation();
																handleOpenDecision(s);
															}}
															className="h-8 text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1 px-2.5 shadow-2xs cursor-pointer"
															title="Beri Keputusan Evaluator"
														>
															<Edit3 className="w-3.5 h-3.5 text-emerald-600" />
															Keputusan
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
								currentPage={evaluasiPage}
								pageSize={evaluasiPageSize}
								totalItems={filteredData.length}
								onPageChange={setEvaluasiPage}
								itemName="Mahasiswa"
							/>
						</div>
					</TabsContent>

					{/* TAB 2: Finalisasi Keberangkatan & SK */}
					<TabsContent value="finalisasi" className="p-0 m-0">
						<div className="p-4 bg-emerald-50/60 border-b border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
								<span>
									Halaman ini menampilkan mahasiswa yang telah berstatus{" "}
									<strong>Layak Berangkat</strong> untuk penetapan jadwal,
									catatan resmi, dan penerbitan{" "}
									<strong>Surat Keputusan (SK)</strong>.
								</span>
							</div>
							<Badge className="bg-emerald-600 text-white font-bold">
								{candidatesData.length} Kandidat Siap Berangkat
							</Badge>
						</div>

						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-slate-50 sticky top-0 z-10">
									<TableRow className="border-slate-200">
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs">
											Nama Kandidat & NIM
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
											Tgl Keberangkatan
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
											Status Persetujuan
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right pr-6 w-64">
											Dokumen & Aksi
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedFinalisasiData.map((s: any) => {
										const isApproved =
											s.decision?.isApprovedByDirector === true;
										const hasDeparture = Boolean(s.decision?.departureDate);
										const waUrl = formatWhatsAppUrl(s.student?.phone);

										return (
											<TableRow
												key={s.student.id}
												className="border-slate-100 hover:bg-emerald-50/30 transition-colors cursor-pointer"
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
													{s.decision?.notes && (
														<div className="text-[11px] text-slate-500 italic mt-0.5 truncate max-w-xs">
															&ldquo;{s.decision.notes}&rdquo;
														</div>
													)}
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
													{getAcademicYear(s.student)}
												</TableCell>

												{/* Peminatan */}
												<TableCell>
													<PeminatanBadge
														subProgram={s.student.subProgram}
														destinationCountry={s.student.destinationCountry}
														program={s.student.program}
													/>
												</TableCell>

												{/* No WhatsApp */}
												<TableCell>
													{s.student?.phone ? (
														waUrl ? (
															<a
																href={waUrl}
																target="_blank"
																rel="noopener noreferrer"
																className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition-colors group"
																title="Chat WhatsApp"
																onClick={(e) => e.stopPropagation()}
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

												{/* Tgl Keberangkatan */}
												<TableCell className="text-center font-medium">
													{s.decision?.departureDate ? (
														<div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#0517B0] rounded-md font-semibold text-xs border border-blue-100">
															<Calendar className="w-3.5 h-3.5 text-[#0517B0]" />
															{new Date(
																s.decision.departureDate,
															).toLocaleDateString("id-ID", {
																day: "2-digit",
																month: "short",
																year: "numeric",
															})}
														</div>
													) : (
														<span className="text-slate-400 italic text-xs">
															Belum Diatur
														</span>
													)}
												</TableCell>

												{/* Status Persetujuan */}
												<TableCell className="text-center">
													{isApproved ? (
														<Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs gap-1">
															<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
															Disetujui
														</Badge>
													) : (
														<Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-xs gap-1">
															<Clock className="w-3.5 h-3.5 text-amber-600" />
															Menunggu
														</Badge>
													)}
												</TableCell>

												{/* Dokumen & Aksi */}
												<TableCell className="text-right pr-6">
													<div className="flex items-center justify-end gap-1.5">
														<Button
															size="sm"
															variant="outline"
															onClick={(e) => {
																e.stopPropagation();
																router.push(
																	`/dashboard/students/${s.student.id}/profile`,
																);
															}}
															className="h-8 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 gap-1 px-2.5 shadow-2xs cursor-pointer"
															title="Lihat Detail Profil Mahasiswa"
														>
															<User className="w-3.5 h-3.5 text-[#0517B0]" />
															Lihat
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={(e) => {
																e.stopPropagation();
																router.push(
																	`/dashboard/students/${s.student.id}?tab=final-decision`,
																);
															}}
															className="h-8 text-xs font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 gap-1 px-2.5 shadow-2xs cursor-pointer"
															title="Periksa Detail Lengkap Mahasiswa"
														>
															<Eye className="w-3.5 h-3.5" />
															Periksa
														</Button>

														{/* Data PDF Button */}
														<Button
															variant="outline"
															size="sm"
															onClick={(e) => {
																e.stopPropagation();
																router.push(
																	`/dashboard/finalisasi/${s.student.id}/data`,
																);
															}}
															className="h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1 px-2 shadow-2xs cursor-pointer"
															title="Cetak Data Rekap Finalisasi (PDF)"
														>
															<FileText className="w-3.5 h-3.5 text-slate-500" />
															Data PDF
														</Button>

														{/* Departure & Approval Settings Modal */}
														<Button
															variant="outline"
															size="sm"
															onClick={(e) => {
																e.stopPropagation();
																handleOpenDeparture(s);
															}}
															className="h-8 text-xs font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1 px-2 shadow-2xs cursor-pointer"
														>
															<Calendar className="w-3.5 h-3.5" />
															Atur Jadwal
														</Button>

														{/* Cetak SK Button */}
														<Button
															size="sm"
															disabled={!hasDeparture}
															onClick={(e) => {
																e.stopPropagation();
																router.push(
																	`/dashboard/finalisasi/${s.student.id}/sk`,
																);
															}}
															className={`h-8 text-xs font-bold gap-1.5 px-3 ${
																hasDeparture
																	? "bg-[#0517B0] hover:bg-blue-800 text-white shadow-2xs cursor-pointer"
																	: "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
															}`}
															title={
																!hasDeparture
																	? "Harap atur tanggal keberangkatan terlebih dahulu"
																	: "Cetak SK Resmi"
															}
														>
															<Printer className="w-3.5 h-3.5" />
															Cetak SK
														</Button>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>

							{candidatesData.length === 0 && (
								<div className="text-center py-12 text-slate-500">
									<HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
									<p className="text-sm font-semibold">
										Belum ada kandidat keberangkatan.
									</p>
									<p className="text-xs text-slate-400 mt-0.5">
										Tetapkan keputusan <strong>Layak Berangkat</strong> pada tab
										Evaluasi untuk memasukkan mahasiswa ke dalam daftar ini.
									</p>
								</div>
							)}

							<TablePagination
								currentPage={finalisasiPage}
								pageSize={finalisasiPageSize}
								totalItems={candidatesData.length}
								onPageChange={setFinalisasiPage}
								itemName="Kandidat"
							/>
						</div>
					</TabsContent>
				</Tabs>
			</Card>

			{/* QUICK DECISION MODAL */}
			<Dialog open={decisionModalOpen} onOpenChange={setDecisionModalOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-slate-900 text-lg">
							<Edit3 className="w-5 h-5 text-[#0517B0]" />
							Beri Keputusan Evaluasi Mahasiswa
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Tetapkan status kelayakan untuk{" "}
							<strong>{activeStudent?.student?.name}</strong> (
							{activeStudent?.student?.nim}).
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label className="text-xs font-bold text-slate-700">
								Status Keputusan
							</Label>
							<RadioGroup
								value={selectedDecision}
								onValueChange={setSelectedDecision}
								className="grid grid-cols-2 gap-2"
							>
								<div className="flex items-center space-x-2 border border-slate-200 rounded-lg p-2.5 hover:bg-slate-50 cursor-pointer">
									<RadioGroupItem value="layak_berangkat" id="r_layak" />
									<Label
										htmlFor="r_layak"
										className="text-xs font-semibold text-emerald-700 cursor-pointer"
									>
										Layak Berangkat
									</Label>
								</div>
								<div className="flex items-center space-x-2 border border-slate-200 rounded-lg p-2.5 hover:bg-slate-50 cursor-pointer">
									<RadioGroupItem value="ttd_kontrak" id="r_kontrak" />
									<Label
										htmlFor="r_kontrak"
										className="text-xs font-semibold text-blue-700 cursor-pointer"
									>
										TTD Kontrak
									</Label>
								</div>
								<div className="flex items-center space-x-2 border border-slate-200 rounded-lg p-2.5 hover:bg-slate-50 cursor-pointer">
									<RadioGroupItem value="lanjut_interview" id="r_interview" />
									<Label
										htmlFor="r_interview"
										className="text-xs font-semibold text-amber-700 cursor-pointer"
									>
										Lanjut Interview
									</Label>
								</div>
								<div className="flex items-center space-x-2 border border-slate-200 rounded-lg p-2.5 hover:bg-slate-50 cursor-pointer">
									<RadioGroupItem value="remedial" id="r_remedial" />
									<Label
										htmlFor="r_remedial"
										className="text-xs font-semibold text-rose-700 cursor-pointer"
									>
										Remedial / Tunda
									</Label>
								</div>
							</RadioGroup>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700">
								Catatan Evaluator (Opsional)
							</Label>
							<Textarea
								placeholder="Tambahkan catatan khusus evaluasi untuk mahasiswa ini..."
								value={decisionNotes}
								onChange={(e) => setDecisionNotes(e.target.value)}
								className="text-xs min-h-[80px]"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDecisionModalOpen(false)}
							className="text-xs"
						>
							Batal
						</Button>
						<Button
							size="sm"
							onClick={handleSaveDecision}
							disabled={isSavingDecision}
							className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5"
						>
							{isSavingDecision ? "Menyimpan..." : "Simpan Keputusan"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* DEPARTURE & APPROVAL MODAL */}
			<Dialog open={departureModalOpen} onOpenChange={setDepartureModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-slate-900 text-lg">
							<Calendar className="w-5 h-5 text-[#0517B0]" />
							Atur Keberangkatan & SK Mahasiswa
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Atur jadwal terbang dan persetujuan direktur untuk{" "}
							<strong>{departureStudent?.student?.name}</strong>.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700">
								Tanggal Keberangkatan
							</Label>
							<Input
								type="date"
								value={departureDate}
								onChange={(e) => setDepartureDate(e.target.value)}
								className="text-xs h-9"
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700">
								Catatan Direktur (Akan tampil pada SK)
							</Label>
							<Textarea
								placeholder="Catatan resmi persetujuan direktur..."
								value={directorNotes}
								onChange={(e) => setDirectorNotes(e.target.value)}
								className="text-xs min-h-[70px]"
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700">
								Catatan Rahasia (Hanya Internal)
							</Label>
							<Textarea
								placeholder="Catatan khusus internal manajemen..."
								value={confidentialNotes}
								onChange={(e) => setConfidentialNotes(e.target.value)}
								className="text-xs min-h-[60px]"
							/>
						</div>
					</div>

					<DialogFooter className="flex-col sm:flex-row gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDepartureModalOpen(false)}
							className="text-xs"
						>
							Tutup
						</Button>
						<div className="flex items-center gap-2">
							{departureStudent?.decision?.isApprovedByDirector && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleSaveDeparture(false)}
									disabled={isSavingDeparture}
									className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
								>
									Cabut ACC
								</Button>
							)}
							<Button
								size="sm"
								onClick={() => handleSaveDeparture(true)}
								disabled={isSavingDeparture}
								className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
							>
								{isSavingDeparture ? "Menyimpan..." : "Setujui & Simpan"}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
