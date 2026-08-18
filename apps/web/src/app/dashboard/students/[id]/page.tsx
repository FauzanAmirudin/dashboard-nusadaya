"use client";

import {
	ArrowLeft,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Clock,
	Download,
	FileText,
	GraduationCap,
	Phone,
	Printer,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AkademikPanel } from "@/components/panels/AkademikPanel";
import { CatatanPanel } from "@/components/panels/CatatanPanel";
import { CrmPanel } from "@/components/panels/CrmPanel";
import { FinalDecisionPanel } from "@/components/panels/FinalDecisionPanel";
import { FinancePanel } from "@/components/panels/FinancePanel";
import { InternshipPanel } from "@/components/panels/InternshipPanel";
import { KehadiranPanel } from "@/components/panels/KehadiranPanel";
import { PaPanel } from "@/components/panels/PaPanel";
import { PmbPanel } from "@/components/panels/PmbPanel";
import { StatusPanel } from "@/components/panels/StatusPanel";
import { StudentProgress } from "@/components/StudentProgress";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";
import { hasRole, useAuthStore } from "@/store";

type StudentDetail = {
	student: {
		id: number;
		nim: string;
		name: string;
		cohort: number;
		program: string;
		subProgram?: string | null;
		phone?: string | null;
		nik?: string | null;
		nisn?: string | null;
		birthPlace?: string | null;
		birthDate?: string | Date | null;
		gender?: string | null;
		addressStreet?: string | null;
		addressRt?: string | null;
		addressRw?: string | null;
		addressNo?: string | null;
		addressVillage?: string | null;
		addressDistrict?: string | null;
		addressCity?: string | null;
		addressProvince?: string | null;
		schoolOrigin?: string | null;
		paId?: number | null;
		studentStatus?: string | null;
		destinationCountry?: string | null;
		period?: string | null;
		profilePhotoUrl?: string | null;
		overallStatus: string | null;
		studentUserId?: number | null;
	};
	pmb: {
		status: string | null;
		isAcc?: boolean | null;
		accAt?: string | Date | null;
		accByUser?: { fullName: string } | null;
	} | null;
	crm: {
		status: string | null;
		isAcc?: boolean | null;
		accAt?: string | Date | null;
		accByUser?: { fullName: string } | null;
	} | null;
	finance: {
		status: string | null;
		isAcc?: boolean | null;
		accAt?: string | Date | null;
		accByUser?: { fullName: string } | null;
	} | null;
	academic: {
		status: string | null;
		isAcc?: boolean | null;
		accAt?: string | Date | null;
		accByUser?: { fullName: string } | null;
	} | null;
	internship: {
		status: string | null;
		isAcc?: boolean | null;
		accAt?: string | Date | null;
		accByUser?: { fullName: string } | null;
	} | null;
	decision: {
		isApprovedByDirector: boolean | null;
		evaluatorDecision?: string | null;
	} | null;
	courseGrades?: any[];
	pa?: {
		status: string | null;
		isAcc?: boolean | null;
		accAt?: string | Date | null;
		accByUser?: { fullName: string } | null;
	} | null;
	parents?: any[];
};

const STATUS_COLORS = {
	AMAN: {
		bg: "bg-emerald-500/10",
		text: "text-emerald-500",
		border: "border-emerald-500/20",
		icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
	},
	PERLU_PERHATIAN: {
		bg: "bg-amber-500/10",
		text: "text-amber-500",
		border: "border-amber-500/20",
		icon: <Clock className="w-5 h-5 text-amber-500" />,
	},
	TIDAK_AMAN: {
		bg: "bg-rose-500/10",
		text: "text-rose-500",
		border: "border-rose-500/20",
		icon: <XCircle className="w-5 h-5 text-rose-500" />,
	},
};

const NAV_LINKS = [
	{ id: "pmb", label: "PMB", roles: ["superadmin", "pmb"] },
	{ id: "crm", label: "CRM", roles: ["superadmin", "crm"] },
	{ id: "finance", label: "Finance", roles: ["superadmin", "finance"] },
	{ id: "akademik", label: "Akademik", roles: ["superadmin", "akademik"] },
	{
		id: "kehadiran",
		label: "Kehadiran",
		roles: ["superadmin", "akademik", "dosen"],
	},
	{ id: "pa", label: "PA", roles: ["superadmin", "pa"] },
	{ id: "magang", label: "Tim Magang", roles: ["superadmin", "magang"] },
	{ id: "status", label: "Status Akhir", roles: ["superadmin", "evaluator"] },
	{
		id: "final-decision",
		label: "Keputusan Final",
		roles: ["superadmin", "evaluator"],
	},
	{
		id: "catatan",
		label: "Catatan Internal",
		roles: [
			"superadmin",
			"akademik",
			"pa",
			"pmb",
			"crm",
			"finance",
			"magang",
			"dosen",
		],
	},
];

export default function StudentDetailPage() {
	return (
		<Suspense
			fallback={
				<div className="p-10 text-center text-slate-500">Memuat profil...</div>
			}
		>
			<StudentDetailContent />
		</Suspense>
	);
}

function StudentDetailContent() {
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const context = searchParams.get("context");
	const { isAuthenticated, user, hasHydrated } = useAuthStore();
	const [data, setData] = useState<StudentDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isArchiving, setIsArchiving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showFullBiodata, setShowFullBiodata] = useState(false);
	const [activeTab, setActiveTab] = useState(context || "");
	const [mounted, setMounted] = useState(false);
	const [updateTrigger, setUpdateTrigger] = useState(0);
	const [isGenerating, setIsGenerating] = useState(false);

	useEffect(() => {
		if (context && context !== "all") {
			setActiveTab(context);
		}
	}, [context]);

	const [isExporting, setIsExporting] = useState(false);
	const [exportJobId, setExportJobId] = useState<string | null>(null);
	const [exportStatus, setExportStatus] = useState<string | null>(null);
	const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(
		null,
	);

	useEffect(() => {
		setMounted(true);
	}, []);

	const refetchStudent = useCallback(async () => {
		if (!params.id) return;
		try {
			const { data: resData, error } =
				await api.students[params.id as string].get();
			if (!error && resData?.data) {
				setData(resData.data as unknown as StudentDetail);
				setUpdateTrigger((prev) => prev + 1);
			}
		} catch (err) {
			console.error("Failed refetching student detail", err);
		}
	}, [params.id]);

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}

		setIsLoading(true);
		refetchStudent().finally(() => setIsLoading(false));

		// Real-time background sync every 15 seconds
		const syncInterval = setInterval(() => {
			refetchStudent();
		}, 15000);

		return () => clearInterval(syncInterval);
	}, [params.id, isAuthenticated, hasHydrated, router, refetchStudent]);

	const handleGenerateAccount = async () => {
		if (!data?.student?.id) return;
		setIsGenerating(true);
		try {
			const res =
				await api.students[data.student.id]["generate-account"].post();
			if (res.data?.success) {
				toast.success(res.data.message);
				refetchStudent();
			} else {
				toast.error(res.data?.message || "Gagal membuat akun.");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan sistem saat menghubungi server.");
		} finally {
			setIsGenerating(false);
		}
	};

	useEffect(() => {
		if (!exportJobId) return;
		const interval = setInterval(async () => {
			try {
				const res = await api.exports[exportJobId].get();
				if (res.data?.success) {
					const status = res.data?.data?.status;
					setExportStatus(status ?? null);
					if (status === "completed") {
						setExportDownloadUrl(res.data?.data?.downloadUrl ?? null);
						clearInterval(interval);
						setIsExporting(false);
						toast.success("File ZIP siap diunduh!");
					} else if (status === "failed") {
						clearInterval(interval);
						setIsExporting(false);
						toast.error("Gagal membuat file ZIP.");
					}
				}
			} catch (err) {
				console.error("Polling export error", err);
			}
		}, 2000);
		return () => clearInterval(interval);
	}, [exportJobId]);

	const handleExportFiles = async () => {
		if (!data?.student?.id) return;
		setIsExporting(true);
		setExportStatus("queued");
		setExportJobId(null);
		setExportDownloadUrl(null);
		try {
			const res = await api.exports.student[data.student.id].post();
			if (res.data?.success) {
				setExportJobId(res.data?.data?.jobId ?? null);
				toast.info("Sedang menyiapkan file ZIP...");
			} else {
				toast.error(res.data?.message || "Gagal memulai ekspor.");
				setIsExporting(false);
			}
		} catch (err) {
			toast.error("Terjadi kesalahan koneksi saat ekspor.");
			setIsExporting(false);
		}
	};

	const handleArchive = async () => {
		if (!data?.student?.id) return;
		setIsArchiving(true);
		try {
			const { error } = await api.students[data.student.id].archive.patch();
			if (error) {
				toast.error("Gagal mengarsipkan data.");
				return;
			}
			toast.success("Mahasiswa berhasil diarsipkan.");
			router.push("/dashboard/students");
		} catch (err) {
			toast.error("Terjadi kesalahan sistem.");
		} finally {
			setIsArchiving(false);
		}
	};

	const handleDelete = async () => {
		if (!data?.student?.id) return;
		setIsDeleting(true);
		try {
			const { error } = await api.students[data.student.id].delete();
			if (error) {
				toast.error(
					"Gagal menghapus data mahasiswa. Anda mungkin tidak memiliki izin.",
				);
				return;
			}
			toast.success(
				"Mahasiswa beserta semua datanya berhasil dihapus permanen.",
			);
			setShowDeleteDialog(false);
			router.push("/dashboard/students");
		} catch (err) {
			toast.error("Terjadi kesalahan sistem saat menghapus data.");
		} finally {
			setIsDeleting(false);
		}
	};

	const [isApprovingDirector, setIsApprovingDirector] = useState(false);
	const [departureDate, setDepartureDate] = useState<string>("");
	const [directorNotes, setDirectorNotes] = useState<string>("");

	const visibleLinks = NAV_LINKS.filter((link) => {
		if (!mounted || !user) return false;
		return hasRole(user, ...link.roles);
	});

	useEffect(() => {
		if (mounted && visibleLinks.length > 0) {
			const isCurrentActiveValid = visibleLinks.some((l) => l.id === activeTab);
			if (!isCurrentActiveValid) {
				setActiveTab(visibleLinks[0]?.id || "");
			}
		}
	}, [mounted, visibleLinks, activeTab]);

	const handleDirectorApproval = async () => {
		if (!data) return;
		setIsApprovingDirector(true);
		try {
			const newVal = !data.decision?.isApprovedByDirector;
			const res = await api.students[params.id as string]["final-decision"][
				"director-approval"
			].patch({
				isApproved: newVal,
				departureDate: departureDate || undefined,
				notes: directorNotes || undefined,
			});

			if (res.data?.success) {
				toast.success(
					newVal
						? "Keputusan berhasil disetujui oleh Direktur"
						: "Persetujuan Direktur berhasil dicabut",
				);
				refetchStudent();
			} else {
				toast.error(
					res.data?.message || "Gagal memperbarui persetujuan direktur",
				);
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem saat menghubungi server.");
		} finally {
			setIsApprovingDirector(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-full text-slate-500">
				Memuat profil mahasiswa...
			</div>
		);
	}

	if (!data) {
		return (
			<div className="text-center py-20 text-rose-400">
				Data mahasiswa tidak ditemukan.
			</div>
		);
	}

	const s = data.student;
	const sColor = s.overallStatus
		? STATUS_COLORS[s.overallStatus as keyof typeof STATUS_COLORS]
		: STATUS_COLORS.PERLU_PERHATIAN;

	const getInitials = (name?: string) => {
		if (!name) return "M";
		const parts = name.trim().split(/\s+/);
		if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	};

	const getCountryFlag = (subProgram?: string | null, dest?: string | null) => {
		const text = `${subProgram || ""} ${dest || ""}`.toLowerCase();
		if (text.includes("malaysia") || text.includes("my")) {
			return "https://flagcdn.com/w20/my.png";
		}
		if (text.includes("taiwan") || text.includes("tw")) {
			return "https://flagcdn.com/w20/tw.png";
		}
		if (
			text.includes("timur tengah") ||
			text.includes("saudi") ||
			text.includes("arab") ||
			text.includes("barista")
		) {
			return "https://flagcdn.com/w20/sa.png";
		}
		if (
			text.includes("jepang") ||
			text.includes("japan") ||
			text.includes("jp")
		) {
			return "https://flagcdn.com/w20/jp.png";
		}
		if (text.includes("korea") || text.includes("kr")) {
			return "https://flagcdn.com/w20/kr.png";
		}
		if (
			text.includes("jerman") ||
			text.includes("germany") ||
			text.includes("de")
		) {
			return "https://flagcdn.com/w20/de.png";
		}
		if (
			text.includes("singapura") ||
			text.includes("singapore") ||
			text.includes("sg")
		) {
			return "https://flagcdn.com/w20/sg.png";
		}
		if (
			text.includes("australia") ||
			text.includes("aussie") ||
			text.includes("au")
		) {
			return "https://flagcdn.com/w20/au.png";
		}
		if (
			text.includes("thailand") ||
			text.includes("thai") ||
			text.includes("th")
		) {
			return "https://flagcdn.com/w20/th.png";
		}
		if (
			text.includes("indonesia") ||
			text.includes("reguler") ||
			text.includes("domestik") ||
			text.includes("id")
		) {
			return "https://flagcdn.com/w20/id.png";
		}
		return null;
	};

	const formatAddress = (s: any) => {
		const parts = [];
		if (s.addressStreet) parts.push(s.addressStreet);
		if (s.addressRt || s.addressRw) {
			parts.push(`RT ${s.addressRt || "-"}/RW ${s.addressRw || "-"}`);
		}
		if (s.addressNo) parts.push(`No. ${s.addressNo}`);
		if (s.addressVillage) parts.push(s.addressVillage);
		if (s.addressDistrict) parts.push(s.addressDistrict);
		if (s.addressCity) parts.push(s.addressCity);
		if (s.addressProvince) parts.push(s.addressProvince);
		return parts.length > 0 ? parts.join(", ") : "-";
	};

	const primaryParent =
		data.parents?.find((p: any) => p.type === "ayah") ||
		data.parents?.find((p: any) => p.type === "ibu") ||
		data.parents?.find((p: any) => p.type === "wali");

	const scrollToAnchor = (id: string) => {
		setActiveTab(id);
	};

	const renderStamp = (
		title: string,
		isAcc: boolean,
		date?: string,
		accBy?: string,
	) => (
		<div className="flex flex-col items-center p-3 border border-slate-200 rounded-md bg-slate-50 min-w-[120px] max-w-[150px]">
			<span className="text-xs font-semibold text-slate-500 mb-2 truncate w-full text-center">
				{title}
			</span>
			{isAcc ? (
				<>
					<CheckCircle className="w-6 h-6 text-emerald-500 mb-1" />
					<span className="text-[10px] text-emerald-400">ACC</span>
					{date && (
						<span className="text-[10px] text-slate-500 mt-1">{date}</span>
					)}
					{accBy && (
						<span
							className="text-[10px] text-emerald-600 mt-0.5 truncate w-full text-center px-1"
							title={accBy}
						>
							Oleh: {accBy.split(" ")[0]}
						</span>
					)}
				</>
			) : (
				<>
					<Clock className="w-6 h-6 text-slate-600 mb-1" />
					<span className="text-[10px] text-slate-500">Pending</span>
				</>
			)}
		</div>
	);

	const flagUrl = getCountryFlag(s.subProgram, s.destinationCountry);

	return (
		<div className="pb-20 relative space-y-4">
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Apakah Anda yakin ingin menghapus?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini tidak dapat dibatalkan. Menghapus mahasiswa ini akan
							secara permanen menghapus semua data yang berkaitan, termasuk
							catatan akademik, keuangan, CRM, dan PMB.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleDelete();
							}}
							disabled={isDeleting}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{isDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* ─── TOP BAR ACTIONS ─── */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
				<button
					type="button"
					onClick={() => {
						const from = searchParams.get("from");
						if (from) {
							router.push(from);
							return;
						}
						if (context && context !== "all") {
							const target =
								context === "final-decision" ? "evaluator" : context;
							router.push(`/dashboard/${target}`);
							return;
						}
						if (typeof window !== "undefined" && window.history.length > 1) {
							router.back();
						} else {
							router.push("/dashboard");
						}
					}}
					className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-xs font-semibold cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					Kembali ke Dashboard
				</button>

				<div className="flex flex-wrap items-center gap-2">
					{hasRole(user, "superadmin") && (
						<Button
							size="sm"
							variant="outline"
							onClick={handleGenerateAccount}
							disabled={isGenerating || !!data?.student?.studentUserId}
							className="bg-blue-50 text-[#0517B0] border-blue-200 hover:bg-blue-100 text-xs h-8.5 font-semibold"
						>
							{isGenerating
								? "Memproses..."
								: data?.student?.studentUserId
									? "Akun Aktif"
									: "Buat Akun"}
						</Button>
					)}
					{hasRole(user, "superadmin") && (
						<Button
							size="sm"
							variant="outline"
							onClick={
								exportStatus === "completed" && exportDownloadUrl
									? () => {
											window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/exports/${exportJobId}/download`;
										}
									: handleExportFiles
							}
							disabled={isExporting}
							className="text-xs h-8.5 font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
						>
							<Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
							{isExporting ? "Menyiapkan..." : "Unduh Berkas"}
						</Button>
					)}
					{hasRole(user, "superadmin", "pmb") && (
						<>
							<Button
								size="sm"
								variant="outline"
								onClick={handleArchive}
								disabled={isArchiving}
								className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs h-8.5 font-semibold"
							>
								{isArchiving ? "Memproses..." : "Arsip"}
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => setShowDeleteDialog(true)}
								className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 text-xs h-8.5 font-semibold"
							>
								Hapus
							</Button>
						</>
					)}
				</div>
			</div>

			{/* ─── HEADER DETAIL MAHASISWA (COMPACT & MODERN EXECUTIVE CARD) ─── */}
			<div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3.5">
				<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
					{/* Left: Profile Summary */}
					<div className="flex items-start gap-3.5">
						<Avatar className="w-13 h-13 border-2 border-blue-100 shadow-2xs shrink-0 rounded-full">
							{s.profilePhotoUrl ? (
								<img
									src={
										s.profilePhotoUrl.startsWith("http")
											? s.profilePhotoUrl
											: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${s.profilePhotoUrl}`
									}
									alt={s.name}
									className="w-full h-full object-cover rounded-full"
								/>
							) : (
								<AvatarFallback className="bg-linear-to-br from-[#0517B0] to-blue-600 text-white text-base font-black flex items-center justify-center">
									{getInitials(s.name)}
								</AvatarFallback>
							)}
						</Avatar>

						<div className="space-y-1">
							<div className="flex flex-wrap items-center gap-2">
								<h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
									{s.name}
								</h1>
								{s.studentStatus && (
									<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5">
										● {s.studentStatus}
									</Badge>
								)}
								<Badge
									variant="outline"
									className="text-xs px-2 py-0.5 font-semibold text-slate-700 border-slate-200 bg-slate-100/80 font-mono"
								>
									Angkatan {s.cohort || "-"}
								</Badge>
								{user?.role === "superadmin" && s.overallStatus && (
									<Badge
										className={`${sColor.bg} ${sColor.text} ${sColor.border} border uppercase px-2 py-0.5 text-[10px] font-bold`}
									>
										<span className="mr-1">
											{s.overallStatus === "AMAN"
												? "🟢"
												: s.overallStatus === "TIDAK_AMAN"
													? "🔴"
													: "🟡"}
										</span>
										{s.overallStatus?.replace("_", " ")}
									</Badge>
								)}
							</div>
							{/* Essential Metadata Strip */}
							<div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 pt-0.5">
								<span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-semibold border border-slate-200/60 text-[11px]">
									NIM: {s.nim || "Belum ada NIM"}
								</span>

								<div className="flex items-center gap-1.5 font-semibold text-slate-800">
									<GraduationCap className="w-3.5 h-3.5 text-[#0517B0]" />
									<span>{s.program || "-"}</span>
									{s.subProgram && (
										<span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold bg-slate-100/90 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
											{flagUrl ? (
												<img
													src={flagUrl}
													alt={s.subProgram}
													className="w-4 h-3 object-cover rounded-xs shadow-2xs inline-block"
												/>
											) : (
												<span className="text-xs">🌐</span>
											)}
											<span>{s.subProgram}</span>
										</span>
									)}
								</div>

								{s.destinationCountry && (
									<div className="flex items-center gap-1.5 font-medium text-slate-600 bg-blue-50/60 border border-blue-100 px-2 py-0.5 rounded-md">
										{flagUrl && (
											<img
												src={flagUrl}
												alt={s.destinationCountry}
												className="w-4 h-3 object-cover rounded-xs shadow-2xs"
											/>
										)}
										<span>Tujuan:</span>
										<span className="font-semibold text-[#0517B0]">
											{s.destinationCountry}
										</span>
										{s.period && (
											<span className="text-slate-400">({s.period})</span>
										)}
									</div>
								)}

								{s.phone && (
									<a
										href={`https://wa.me/${s.phone.replace(/[^0-9]/g, "")}`}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-600 font-medium transition-colors"
										title="Buka WhatsApp"
									>
										<Phone className="w-3.5 h-3.5 text-emerald-600" />
										<span className="font-mono text-xs">{s.phone}</span>
									</a>
								)}
							</div>
						</div>
					</div>

					{/* Right: Progress Overview */}
					<div className="shrink-0 w-full lg:w-auto">
						<StudentProgress
							studentId={s.id}
							updateTrigger={updateTrigger}
							userRole={user?.role}
						/>
					</div>
				</div>

				{/* Collapsible Biodata Toggle */}
				<div className="pt-2 border-t border-slate-100 flex items-center justify-between">
					<button
						type="button"
						onClick={() => setShowFullBiodata(!showFullBiodata)}
						className="text-xs font-semibold text-[#0517B0] hover:text-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer"
					>
						<FileText className="w-3.5 h-3.5" />
						<span>
							{showFullBiodata
								? "Sembunyikan Biodata Lengkap"
								: "Lihat Biodata Lengkap (NIK, Alamat, Orang Tua)"}
						</span>
						{showFullBiodata ? (
							<ChevronUp className="w-3.5 h-3.5" />
						) : (
							<ChevronDown className="w-3.5 h-3.5" />
						)}
					</button>
				</div>

				{/* Collapsible Biodata Content */}
				{showFullBiodata && (
					<div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-in fade-in duration-200">
						<div>
							<span className="text-slate-400 font-medium block text-[11px]">
								NIK / NISN
							</span>
							<span className="font-semibold text-slate-800">
								{s.nik || "-"} / {s.nisn || "-"}
							</span>
						</div>
						<div>
							<span className="text-slate-400 font-medium block text-[11px]">
								Tempat, Tanggal Lahir
							</span>
							<span className="font-semibold text-slate-800">
								{s.birthPlace || "-"},{" "}
								{s.birthDate
									? new Date(s.birthDate).toLocaleDateString("id-ID")
									: "-"}
							</span>
						</div>
						<div>
							<span className="text-slate-400 font-medium block text-[11px]">
								Jenis Kelamin
							</span>
							<span className="font-semibold text-slate-800">
								{s.gender || "-"}
							</span>
						</div>
						<div>
							<span className="text-slate-400 font-medium block text-[11px]">
								Asal Sekolah
							</span>
							<span className="font-semibold text-slate-800">
								{s.schoolOrigin || "-"}
							</span>
						</div>
						<div className="col-span-2 md:col-span-4">
							<span className="text-slate-400 font-medium block text-[11px]">
								Alamat Lengkap
							</span>
							<span className="font-medium text-slate-700">
								{formatAddress(s)}
							</span>
						</div>
						<div>
							<span className="text-slate-400 font-medium block text-[11px]">
								Nama Orang Tua / Wali
							</span>
							<span className="font-semibold text-slate-800">
								{primaryParent?.name || "-"}
							</span>
						</div>
						<div>
							<span className="text-slate-400 font-medium block text-[11px]">
								Pekerjaan / Penghasilan
							</span>
							<span className="font-semibold text-slate-800">
								{primaryParent?.job || "-"} / {primaryParent?.income || "-"}
							</span>
						</div>
						<div>
							<span className="text-slate-400 font-medium block text-[11px]">
								No. HP Orang Tua
							</span>
							<span className="font-semibold text-slate-800 font-mono">
								{primaryParent?.phone || "-"}
							</span>
						</div>
					</div>
				)}
			</div>

			{/* ─── DIVISION TABS NAVIGATION (SEGMENTED PILLS) ─── */}
			<div className="flex overflow-x-auto gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 hide-scrollbar w-fit max-w-full">
				{mounted &&
					visibleLinks.map((link) => (
						<button
							type="button"
							key={link.id}
							onClick={() => scrollToAnchor(link.id)}
							className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
								(activeTab || visibleLinks[0]?.id) === link.id
									? "bg-white text-[#0517B0] shadow-xs font-bold"
									: "text-slate-600 hover:text-slate-900 hover:bg-white/50"
							}`}
						>
							{link.label}
						</button>
					))}
			</div>

			{/* PANELS CONTENT */}
			<div className="mt-8 space-y-6">
				{mounted &&
					(() => {
						const currentLink = visibleLinks.find(
							(l) => l.id === (activeTab || visibleLinks[0]?.id),
						);
						if (!currentLink) return null;

						return (
							<div
								id={`panel-${currentLink.id}`}
								key={currentLink.id}
								className="animate-in fade-in duration-300"
							>
								{currentLink.id === "pmb" ? (
									<PmbPanel
										studentId={s.id}
										pmbData={data.pmb}
										studentData={{
											nim: s.nim,
											studentStatus: s.studentStatus,
											paId: s.paId,
										}}
										onUpdate={refetchStudent}
									/>
								) : currentLink.id === "crm" ? (
									<CrmPanel studentId={s.id} onUpdate={refetchStudent} />
								) : currentLink.id === "finance" ? (
									<FinancePanel studentId={s.id} onUpdate={refetchStudent} />
								) : currentLink.id === "akademik" ? (
									<AkademikPanel studentId={s.id} onUpdate={refetchStudent} />
								) : currentLink.id === "kehadiran" ? (
									<KehadiranPanel studentId={s.id} />
								) : currentLink.id === "pa" ? (
									<PaPanel studentId={s.id} onUpdate={refetchStudent} />
								) : currentLink.id === "magang" ? (
									<InternshipPanel
										studentId={s.id}
										destinationCountry={s.destinationCountry}
										onUpdate={refetchStudent}
									/>
								) : currentLink.id === "status" ? (
									<StatusPanel
										studentId={s.id}
										onNavigate={(tab) => {
											setActiveTab(tab);
										}}
									/>
								) : currentLink.id === "final-decision" ? (
									<FinalDecisionPanel
										studentId={s.id}
										onUpdate={refetchStudent}
										userRole={user?.role || ""}
									/>
								) : currentLink.id === "catatan" ? (
									<CatatanPanel studentId={s.id} />
								) : (
									<Card className="bg-white border-slate-200 shadow-sm">
										<CardHeader className="border-b border-slate-200 pb-4">
											<div className="flex justify-between items-center">
												<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
													Panel {currentLink.label}
												</CardTitle>
												<Badge
													variant="outline"
													className="border-slate-200 text-slate-500"
												>
													Dikelola oleh Admin {currentLink.label}
												</Badge>
											</div>
										</CardHeader>
										<CardContent className="py-12 flex flex-col items-center justify-center text-slate-400">
											<FileText className="w-12 h-12 mb-3 opacity-20" />
											<p>
												Konten Panel {currentLink.label} akan di-inject di sini.
											</p>
										</CardContent>
									</Card>
								)}
							</div>
						);
					})()}
			</div>

			{user?.role === "superadmin" && (
				<>
					<Separator className="my-10 bg-slate-200" />

					{/* DIGITAL STAMP FOOTER */}
					<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
						<div className="absolute top-0 right-0 w-32 h-32 bg-[#0517B0]/5 rounded-full blur-3xl" />
						<h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
							<CheckCircle className="w-5 h-5 text-[#0517B0]" />
							Jejak Persetujuan Digital
						</h3>

						<div className="flex flex-wrap gap-4 mb-8">
							{renderStamp(
								"PMB",
								!!data.pmb?.isAcc,
								data.pmb?.accAt
									? new Date(data.pmb.accAt).toLocaleDateString("id-ID")
									: undefined,
								data.pmb?.accByUser?.fullName,
							)}
							{renderStamp(
								"CRM",
								!!data.crm?.isAcc,
								data.crm?.accAt
									? new Date(data.crm.accAt).toLocaleDateString("id-ID")
									: undefined,
								data.crm?.accByUser?.fullName,
							)}
							{renderStamp(
								"Finance",
								!!data.finance?.isAcc,
								data.finance?.accAt
									? new Date(data.finance.accAt).toLocaleDateString("id-ID")
									: undefined,
								data.finance?.accByUser?.fullName,
							)}
							{renderStamp(
								"Akademik",
								!!data.academic?.isAcc,
								data.academic?.accAt
									? new Date(data.academic.accAt).toLocaleDateString("id-ID")
									: undefined,
								data.academic?.accByUser?.fullName,
							)}
							{renderStamp(
								"Dosen",
								Boolean(
									data.courseGrades &&
										data.courseGrades.length > 0 &&
										data.courseGrades.every((g: any) => g.isAcc),
								),
								data.courseGrades &&
									data.courseGrades.length > 0 &&
									data.courseGrades.every((g: any) => g.isAcc)
									? new Date(
											Math.max(
												...data.courseGrades.map((g: any) =>
													new Date(g.accAt || 0).getTime(),
												),
											),
										).toLocaleDateString("id-ID")
									: undefined,
							)}
							{renderStamp(
								"PA",
								!!data.pa?.isAcc,
								data.pa?.accAt
									? new Date(data.pa.accAt).toLocaleDateString("id-ID")
									: undefined,
								data.pa?.accByUser?.fullName,
							)}
							{renderStamp(
								"Magang",
								!!data.internship?.isAcc,
								data.internship?.accAt
									? new Date(data.internship.accAt).toLocaleDateString("id-ID")
									: undefined,
								data.internship?.accByUser?.fullName,
							)}
						</div>

						<div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
							<div>
								<h4 className="text-amber-700 font-bold flex items-center gap-2">
									{data.student.overallStatus === "AMAN" ||
									data.decision?.isApprovedByDirector
										? "✅"
										: "🔐"}{" "}
									Persetujuan Akhir (Direktur)
								</h4>
								<p className="text-sm text-amber-600/80 mt-1">
									Kandidat berstatus AMAN. Direktur dapat mengatur tanggal
									keberangkatan dan catatan untuk SK.
								</p>
							</div>
							<AlertDialog>
								<AlertDialogTrigger
									render={(props: any) => (
										<Button
											{...props}
											disabled={
												data.student.overallStatus !== "AMAN" ||
												data.decision?.evaluatorDecision !==
													"layak_berangkat" ||
												isApprovingDirector
											}
											variant={
												data.decision?.isApprovedByDirector
													? "outline"
													: "default"
											}
											className={
												data.decision?.isApprovedByDirector ||
												data.student.overallStatus === "AMAN"
													? "bg-[#0517B0] hover:bg-blue-800 text-white w-full sm:w-auto"
													: "bg-amber-500 hover:bg-amber-600 text-black font-bold disabled:bg-slate-200 disabled:text-slate-400 w-full sm:w-auto"
											}
										>
											{isApprovingDirector
												? "Memproses..."
												: data.decision?.isApprovedByDirector ||
														data.student.overallStatus === "AMAN"
													? "Atur Keberangkatan"
													: "Berikan Keputusan Final"}
										</Button>
									)}
								/>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											{data.decision?.isApprovedByDirector ||
											data.student.overallStatus === "AMAN"
												? "Atur Keberangkatan & SK"
												: "Konfirmasi Persetujuan Direktur"}
										</AlertDialogTitle>
										<AlertDialogDescription>
											{data.decision?.isApprovedByDirector ||
											data.student.overallStatus === "AMAN"
												? "Lengkapi tanggal rencana keberangkatan dan catatan tambahan untuk dicetak pada SK."
												: "Apakah Anda yakin memberikan status LAYAK BERANGKAT dan menyetujui keberangkatan kandidat ini?"}
										</AlertDialogDescription>
									</AlertDialogHeader>
									{!data.decision?.isApprovedByDirector && (
										<div className="grid gap-4 py-4">
											<div className="grid gap-2">
												<Label htmlFor="departure">
													Tanggal Keberangkatan (Opsional)
												</Label>
												<Input
													id="departure"
													type="date"
													value={departureDate}
													onChange={(e) => setDepartureDate(e.target.value)}
												/>
											</div>
											<div className="grid gap-2">
												<Label htmlFor="notes">
													Catatan Tambahan (Opsional)
												</Label>
												<Textarea
													id="notes"
													placeholder="Catatan dari Direktur..."
													value={directorNotes}
													onChange={(e) => setDirectorNotes(e.target.value)}
												/>
											</div>
										</div>
									)}
									<AlertDialogFooter>
										<AlertDialogCancel>Batal</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDirectorApproval}
											className="bg-[#0517B0] hover:bg-[#04128A] text-white"
										>
											Ya, Konfirmasi
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
