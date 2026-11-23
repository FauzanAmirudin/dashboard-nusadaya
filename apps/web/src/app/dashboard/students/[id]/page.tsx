"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Clock,
	FileText,
	Lock,
	MoreHorizontal,
	Printer,
	XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { StudentProgress } from "@/components/StudentProgress";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PanelSkeleton } from "@/components/ui/PanelSkeleton";

const AkademikPanel = dynamic(
	() =>
		import("@/components/panels/AkademikPanel").then((m) => m.AkademikPanel),
	{ loading: () => <PanelSkeleton title="Akademik" /> },
);
const CatatanPanel = dynamic(
	() => import("@/components/panels/CatatanPanel").then((m) => m.CatatanPanel),
	{ loading: () => <PanelSkeleton title="Catatan Internal" /> },
);
const CrmPanel = dynamic(
	() => import("@/components/panels/CrmPanel").then((m) => m.CrmPanel),
	{ loading: () => <PanelSkeleton title="CRM" /> },
);
const FinalDecisionPanel = dynamic(
	() =>
		import("@/components/panels/FinalDecisionPanel").then(
			(m) => m.FinalDecisionPanel,
		),
	{ loading: () => <PanelSkeleton title="Final Decision" /> },
);
const FinancePanel = dynamic(
	() => import("@/components/panels/FinancePanel").then((m) => m.FinancePanel),
	{ loading: () => <PanelSkeleton title="Keuangan" /> },
);
const InternshipPanel = dynamic(
	() =>
		import("@/components/panels/InternshipPanel").then(
			(m) => m.InternshipPanel,
		),
	{ loading: () => <PanelSkeleton title="Magang" /> },
);
const KehadiranPanel = dynamic(
	() =>
		import("@/components/panels/KehadiranPanel").then((m) => m.KehadiranPanel),
	{ loading: () => <PanelSkeleton title="Kehadiran" /> },
);
const PaPanel = dynamic(
	() => import("@/components/panels/PaPanel").then((m) => m.PaPanel),
	{ loading: () => <PanelSkeleton title="PA" /> },
);
const PmbPanel = dynamic(
	() => import("@/components/panels/PmbPanel").then((m) => m.PmbPanel),
	{ loading: () => <PanelSkeleton title="PMB" /> },
);
const StatusPanel = dynamic(
	() => import("@/components/panels/StatusPanel").then((m) => m.StatusPanel),
	{ loading: () => <PanelSkeleton title="Status Mahasiswa" /> },
);

import { AvatarPersonFallback } from "@/components/ui/AvatarPersonFallback";
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
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelStatusBadge } from "@/components/ui/PanelStatusBadge";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useStudentDetail } from "@/hooks/useStudentsList";
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
		pa?: { id: number; fullName: string; username?: string } | null;
		studentStatus?: string | null;
		destinationCountry?: string | null;
		period?: string | null;
		profilePhotoUrl?: string | null;
		overallStatus: string | null;
		studentUserId?: number | null;
		rombel?: string | null;
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
			// PMB & Magang tidak memakai Catatan Internal (cukup panelnya sendiri)
			"crm",
			"finance",
			"dosen",
		],
	},
];

function normalizeTabId(raw: string | null | undefined): string | null {
	if (!raw) return null;
	const lower = raw.toLowerCase().trim();
	if (lower === "pmb") return "pmb";
	if (lower === "crm") return "crm";
	if (lower === "finance" || lower === "keuangan") return "finance";
	if (
		lower === "akademik" ||
		lower === "academic" ||
		lower === "kehadiran" ||
		lower === "attendance"
	)
		return "akademik";
	if (lower === "pa") return "pa";
	if (lower === "magang" || lower === "internship") return "magang";
	if (lower === "status") return "status";
	if (
		lower === "final-decision" ||
		lower === "final_decision" ||
		lower === "finalisasi" ||
		lower === "evaluator"
	)
		return "final-decision";
	if (lower === "catatan" || lower === "catatan-internal") return "catatan";
	return lower;
}

function getStudentStatusBadgeConfig(val: string | null | undefined) {
	if (!val) {
		return {
			label: "Aktif",
			color: "bg-emerald-50 text-emerald-700 border-emerald-200",
			dot: "bg-emerald-500",
		};
	}
	const normalized = val.toLowerCase().trim();
	if (normalized === "aktif") {
		return {
			label: "Aktif",
			color: "bg-emerald-50 text-emerald-700 border-emerald-200",
			dot: "bg-emerald-500",
		};
	}
	if (normalized === "cuti") {
		return {
			label: "Cuti",
			color: "bg-amber-50 text-amber-700 border-amber-200",
			dot: "bg-amber-500",
		};
	}
	if (
		normalized === "dropout" ||
		normalized === "drop_out" ||
		normalized === "drop out"
	) {
		return {
			label: "Drop Out",
			color: "bg-rose-50 text-rose-700 border-rose-200",
			dot: "bg-rose-500",
		};
	}
	if (
		normalized === "mengundurkan_diri" ||
		normalized === "mengundurkan diri"
	) {
		return {
			label: "Mengundurkan Diri",
			color: "bg-orange-50 text-orange-700 border-orange-200",
			dot: "bg-orange-500",
		};
	}
	if (normalized === "menunggu_pembayaran") {
		return {
			label: "Menunggu Pembayaran",
			color: "bg-slate-50 text-slate-700 border-slate-200",
			dot: "bg-slate-500",
		};
	}
	if (normalized === "lulus") {
		return {
			label: "Lulus",
			color: "bg-blue-50 text-blue-700 border-blue-200",
			dot: "bg-blue-500",
		};
	}

	const label = val
		.replace(/_/g, " ")
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");

	return {
		label,
		color: "bg-slate-100 text-slate-700 border-slate-200",
		dot: "bg-slate-500",
	};
}

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
	const queryClient = useQueryClient();
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const rawTab = searchParams.get("tab") || searchParams.get("context");
	const requestedTab = normalizeTabId(rawTab);
	const { isAuthenticated, user, hasHydrated } = useAuthStore();
	const {
		data: studentQueryData,
		isLoading,
		refetch: refetchQuery,
	} = useStudentDetail(params.id as string);

	const data = (studentQueryData as unknown as StudentDetail) || null;
	const [isArchiving, setIsArchiving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showFullBiodata, setShowFullBiodata] = useState(false);
	const [activeTab, setActiveTab] = useState(requestedTab || "");
	const [mounted, setMounted] = useState(false);
	const [updateTrigger, setUpdateTrigger] = useState(0);
	const [crmProgress, setCrmProgress] = useState<{
		completed: number;
		total: number;
	} | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);

	useEffect(() => {
		if (requestedTab && requestedTab !== "all") {
			setActiveTab(requestedTab);
		}
	}, [requestedTab]);

	useEffect(() => {
		setMounted(true);
	}, []);

	const refetchStudent = useCallback(async () => {
		setUpdateTrigger((prev) => prev + 1);
		await refetchQuery();
		queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
		queryClient.invalidateQueries({ queryKey: ["students-list"] });
	}, [refetchQuery, queryClient]);

	const handleCrmProgressChange = useCallback(
		(completed: number, total: number) => {
			setCrmProgress((prev) => {
				if (prev && prev.completed === completed && prev.total === total) {
					return prev;
				}
				return { completed, total };
			});
		},
		[],
	);

	const [akademikProgress, setAkademikProgress] = useState<{
		completed: number;
		total: number;
	} | null>(null);

	const handleAkademikProgressChange = useCallback(
		(completed: number, total: number) => {
			setAkademikProgress((prev) => {
				if (prev && prev.completed === completed && prev.total === total) {
					return prev;
				}
				return { completed, total };
			});
		},
		[],
	);

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}
	}, [isAuthenticated, hasHydrated, router]);

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
			const res = await api.students[data.student.id].delete();
			if (res.error || !res.data?.success) {
				toast.error(
					(res.data as any)?.message ||
						(res.error?.value as any)?.message ||
						"Gagal menghapus data mahasiswa.",
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
			const targetTab = requestedTab || activeTab;
			const isTargetValid = visibleLinks.some((l) => l.id === targetTab);
			if (isTargetValid) {
				setActiveTab(targetTab);
			} else if (!visibleLinks.some((l) => l.id === activeTab)) {
				setActiveTab(visibleLinks[0]?.id || "");
			}
		}
	}, [mounted, visibleLinks, requestedTab]);

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
		if (typeof window !== "undefined") {
			const url = new URL(window.location.href);
			url.searchParams.set("tab", id);
			url.searchParams.delete("context");
			window.history.replaceState(null, "", url.toString());
		}
	};

	const renderStamp = (
		title: string,
		isAcc: boolean,
		date?: string,
		accBy?: string | { fullName?: string } | null,
	) => {
		const accByName =
			typeof accBy === "object" && accBy !== null
				? accBy.fullName
				: typeof accBy === "string"
					? accBy
					: undefined;

		return (
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
						{accByName && (
							<span
								className="text-[10px] text-emerald-600 mt-0.5 truncate w-full text-center px-1"
								title={accByName}
							>
								Oleh: {accByName.split(" ")[0]}
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
	};

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
			<div className="flex flex-row items-center justify-between gap-3">
				<button
					type="button"
					onClick={() => {
						const from = searchParams.get("from");
						if (from) {
							router.push(from);
							return;
						}
						const VALID_PANEL_DASHBOARDS: Record<string, string> = {
							pmb: "/dashboard/pmb",
							crm: "/dashboard/crm",
							finance: "/dashboard/finance",
							akademik: "/dashboard/akademik",
							kehadiran: "/dashboard/kehadiran",
							pa: "/dashboard/pa",
							magang: "/dashboard/magang",
							status: "/dashboard/evaluator",
							"final-decision": "/dashboard/evaluator",
						};

						const currentContext = requestedTab || rawTab;
						if (
							currentContext &&
							currentContext !== "catatan" &&
							VALID_PANEL_DASHBOARDS[currentContext]
						) {
							router.push(VALID_PANEL_DASHBOARDS[currentContext]);
							return;
						}

						// If context is catatan or unknown, route to the user's role primary dashboard
						if (user?.role) {
							if (user.role === "superadmin") {
								router.push("/dashboard/students");
								return;
							}
							if (VALID_PANEL_DASHBOARDS[user.role]) {
								router.push(VALID_PANEL_DASHBOARDS[user.role]);
								return;
							}
							router.push(`/dashboard/${user.role}`);
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

				{hasRole(user, "superadmin", "pmb") && (
					<DropdownMenu>
						<DropdownMenuTrigger
							aria-label="Aksi mahasiswa"
							className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40"
						>
							<MoreHorizontal className="w-4 h-4" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-44">
							{hasRole(user, "superadmin") && (
								<DropdownMenuItem
									onClick={handleGenerateAccount}
									disabled={isGenerating || !!data?.student?.studentUserId}
								>
									{isGenerating
										? "Memproses..."
										: data?.student?.studentUserId
											? "Akun sudah aktif"
											: "Buat akun mahasiswa"}
								</DropdownMenuItem>
							)}
							<DropdownMenuItem onClick={handleArchive} disabled={isArchiving}>
								{isArchiving ? "Memproses..." : "Arsipkan"}
							</DropdownMenuItem>
							{hasRole(user, "superadmin") && (
								<DropdownMenuItem
									onClick={() => setShowDeleteDialog(true)}
									className="text-rose-700"
								>
									Hapus mahasiswa
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			{/* ─── HEADER MAHASISWA (ringkas: identitas inti, info sekunder di biodata) ─── */}
			<section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex min-w-0 items-start gap-3 sm:gap-4">
						<Avatar className="w-12 h-12 shrink-0 rounded-full">
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
								<AvatarPersonFallback />
							)}
						</Avatar>

						<div className="min-w-0 space-y-1">
							<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
								<h1 className="text-xl sm:text-2xl font-bold text-slate-900 [overflow-wrap:anywhere]">
									{s.name}
								</h1>
								{s.studentStatus &&
									(() => {
										const statusCfg = getStudentStatusBadgeConfig(
											s.studentStatus,
										);
										return (
											<Badge
												className={`${statusCfg.color} border text-xs font-semibold px-2.5 py-0.5`}
											>
												<span
													className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} mr-1.5 inline-block`}
												/>
												{statusCfg.label}
											</Badge>
										);
									})()}
							</div>
							<p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
								<span className="font-mono">{s.nim || "Belum ada NIM"}</span>
								<span aria-hidden="true">·</span>
								<span>Angkatan {s.cohort || "-"}</span>
								{(s.subProgram || s.program) && (
									<>
										<span aria-hidden="true">·</span>
										<span className="inline-flex items-center gap-1.5">
											{flagUrl && (
												<img
													src={flagUrl}
													alt=""
													className="w-4 h-3 object-cover rounded-xs"
												/>
											)}
											<span className="font-medium text-slate-800">
												{s.subProgram || s.program}
											</span>
											{s.subProgram && s.program && (
												<span className="text-slate-500">({s.program})</span>
											)}
										</span>
									</>
								)}
								{s.destinationCountry && (
									<>
										<span aria-hidden="true">·</span>
										<span>
											Tujuan{" "}
											<span className="font-medium text-slate-800">
												{s.destinationCountry}
											</span>
											{s.period && (
												<span className="text-slate-500"> ({s.period})</span>
											)}
										</span>
									</>
								)}
							</p>
						</div>
					</div>

					{/* Progress panel lain tetap di header; di tab PMB ringkasan ada di dalam panel */}
					{mounted && (activeTab || visibleLinks[0]?.id) !== "pmb" && (
						<div className="shrink-0 w-full lg:w-auto">
							<StudentProgress
								studentId={s.id}
								updateTrigger={updateTrigger}
								userRole={user?.role}
								overrideProgress={
									user?.role === "akademik"
										? akademikProgress
										: user?.role === "crm"
											? crmProgress
											: null
								}
							/>
						</div>
					)}
				</div>

				{/* Biodata lengkap (WA, PA, NIK, alamat, orang tua) */}
				<div className="mt-4 border-t border-slate-100 pt-2">
					<button
						type="button"
						onClick={() => setShowFullBiodata(!showFullBiodata)}
						aria-expanded={showFullBiodata}
						className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs font-semibold text-[#0517B0] hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40"
					>
						{showFullBiodata ? "Sembunyikan biodata" : "Lihat biodata lengkap"}
						{showFullBiodata ? (
							<ChevronUp className="h-3.5 w-3.5" />
						) : (
							<ChevronDown className="h-3.5 w-3.5" />
						)}
					</button>

					{showFullBiodata && (
						<div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2 md:grid-cols-4">
							<div>
								<span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
									WhatsApp
								</span>
								{s.phone ? (
									<a
										href={`https://wa.me/${s.phone.replace(/[^0-9]/g, "")}`}
										target="_blank"
										rel="noreferrer"
										className="mt-0.5 block font-mono text-sm font-medium text-emerald-700 hover:underline"
									>
										{s.phone}
									</a>
								) : (
									<span className="mt-0.5 block text-sm font-medium text-slate-900">
										-
									</span>
								)}
							</div>
							<div>
								<span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
									NIK / NISN
								</span>
								<span className="mt-0.5 block text-sm font-medium text-slate-900">
									{s.nik || "-"} / {s.nisn || "-"}
								</span>
							</div>
							<div>
								<span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
									Tempat, Tanggal Lahir
								</span>
								<span className="mt-0.5 block text-sm font-medium text-slate-900">
									{s.birthPlace || "-"},{" "}
									{s.birthDate
										? new Date(s.birthDate).toLocaleDateString("id-ID")
										: "-"}
								</span>
							</div>
							<div>
								<span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
									Jenis Kelamin
								</span>
								<span className="mt-0.5 block text-sm font-medium text-slate-900">
									{s.gender || "-"}
								</span>
							</div>
							<div>
								<span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
									Asal Sekolah
								</span>
								<span className="mt-0.5 block text-sm font-medium text-slate-900">
									{s.schoolOrigin || "-"}
								</span>
							</div>
							<div className="sm:col-span-2 md:col-span-4">
								<span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
									Alamat Lengkap
								</span>
								<span className="mt-0.5 block text-sm font-medium text-slate-900">
									{formatAddress(s)}
								</span>
							</div>
							<div>
								<span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
									Nama Orang Tua / Wali
								</span>
								<span className="mt-0.5 block text-sm font-medium text-slate-900">
									{primaryParent?.name || "-"}
								</span>
							</div>
							<div>
								<span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
									Pekerjaan / Penghasilan
								</span>
								<span className="mt-0.5 block text-sm font-medium text-slate-900">
									{primaryParent?.job || "-"} / {primaryParent?.income || "-"}
								</span>
							</div>
							<div>
								<span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
									No. HP Orang Tua
								</span>
								<span className="mt-0.5 block font-mono text-sm font-medium text-slate-900">
									{primaryParent?.phone || "-"}
								</span>
							</div>
							<div className="sm:col-span-2 md:col-span-4 border-t border-slate-200/60 pt-3">
								<span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
									Dosen Pembimbing Akademik (PA)
								</span>
								<span className="mt-0.5 block text-sm font-medium text-slate-900">
									{s.pa?.fullName || "Belum Ditentukan"}
								</span>
							</div>
						</div>
					)}
				</div>
			</section>

			{/* ─── DIVISION TABS NAVIGATION (disembunyikan bila hanya 1 tab) ─── */}
			{visibleLinks.length > 1 && (
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
			)}

			{/* PANELS CONTENT */}
			<div className={`${visibleLinks.length > 1 ? "mt-8" : ""} space-y-6`}>
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
									<CrmPanel
										studentId={s.id}
										studentData={s}
										onUpdate={refetchStudent}
										onProgressChange={handleCrmProgressChange}
									/>
								) : currentLink.id === "finance" ? (
									<FinancePanel studentId={s.id} onUpdate={refetchStudent} />
								) : currentLink.id === "akademik" ? (
									<AkademikPanel
										studentId={s.id}
										studentData={{
											nim: s.nim,
											studentStatus: s.studentStatus,
											paId: s.paId,
											rombel: (s as any).rombel,
										}}
										onUpdate={refetchStudent}
										onProgressChange={handleAkademikProgressChange}
									/>
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
								(data.pmb as any)?.accBy?.fullName ||
									(data.pmb as any)?.accByUser?.fullName ||
									(typeof (data.pmb as any)?.accBy === "string"
										? (data.pmb as any)?.accBy
										: undefined),
							)}
							{renderStamp(
								"CRM",
								!!data.crm?.isAcc,
								data.crm?.accAt
									? new Date(data.crm.accAt).toLocaleDateString("id-ID")
									: undefined,
								(data.crm as any)?.accBy?.fullName ||
									(data.crm as any)?.accByUser?.fullName ||
									(typeof (data.crm as any)?.accBy === "string"
										? (data.crm as any)?.accBy
										: undefined),
							)}
							{renderStamp(
								"Finance",
								!!data.finance?.isAcc,
								data.finance?.accAt
									? new Date(data.finance.accAt).toLocaleDateString("id-ID")
									: undefined,
								(data.finance as any)?.accBy?.fullName ||
									(data.finance as any)?.accByUser?.fullName ||
									(typeof (data.finance as any)?.accBy === "string"
										? (data.finance as any)?.accBy
										: undefined),
							)}
							{renderStamp(
								"Akademik",
								!!data.academic?.isAcc,
								data.academic?.accAt
									? new Date(data.academic.accAt).toLocaleDateString("id-ID")
									: undefined,
								(data.academic as any)?.accBy?.fullName ||
									(data.academic as any)?.accByUser?.fullName ||
									(typeof (data.academic as any)?.accBy === "string"
										? (data.academic as any)?.accBy
										: undefined),
							)}
							{/* Dosen & PA tidak lagi memberi ACC terpisah: keduanya di bawah Akademik */}
							{renderStamp(
								"Magang",
								!!data.internship?.isAcc,
								data.internship?.accAt
									? new Date(data.internship.accAt).toLocaleDateString("id-ID")
									: undefined,
								(data.internship as any)?.accBy?.fullName ||
									(data.internship as any)?.accByUser?.fullName ||
									(typeof (data.internship as any)?.accBy === "string"
										? (data.internship as any)?.accBy
										: undefined),
							)}
						</div>

						<div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
							<div>
								<h4 className="text-amber-700 font-bold flex items-center gap-2">
									{data.student.overallStatus === "AMAN" ||
									data.decision?.isApprovedByDirector ? (
										<CheckCircle className="w-4 h-4 text-emerald-600 inline" />
									) : (
										<Lock className="w-4 h-4 text-amber-600 inline" />
									)}{" "}
									Persetujuan Akhir (Direktur)
								</h4>
								{/* Teks mengikuti status nyata: dulu selalu menulis
								    "Kandidat berstatus AMAN" walau ACC masih Pending. */}
								<p className="text-sm text-amber-600/80 mt-1">
									{data.student.overallStatus === "AMAN" ||
									data.decision?.isApprovedByDirector
										? "Kandidat berstatus AMAN. Direktur dapat mengatur tanggal keberangkatan dan catatan untuk SK."
										: `Kandidat berstatus ${data.student.overallStatus || "BELUM LENGKAP"}. Menunggu ACC divisi sebelum persetujuan Direktur.`}
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
