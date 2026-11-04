"use client";

import {
	Activity,
	AlertCircle,
	ArrowLeft,
	BookOpen,
	Briefcase,
	Calendar,
	Check,
	CheckCircle,
	CheckCircle2,
	Clock,
	ExternalLink,
	GraduationCap,
	HeartHandshake,
	Info,
	Layers,
	Lock,
	MapPin,
	MessageSquare,
	Pencil,
	Plus,
	RefreshCw,
	School,
	Send,
	ShieldCheck,
	Sparkles,
	Trash2,
	Upload,
	Video,
	X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

const MONTH_NAMES = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

const TRI_DHARMA_CATEGORIES = [
	{ value: "pkm", label: "Pengabdian Kepada Masyarakat (PKM)" },
	{ value: "penelitian", label: "Penelitian (Dosen & Mahasiswa)" },
];

const TRI_DHARMA_LOCATIONS = [
	{ value: "sekolah_mitra", label: "Sekolah Mitra" },
	{ value: "desa_binaan", label: "Desa Binaan" },
];

export default function CrmPanelMahasiswa() {
	const { user, token, isAuthenticated, hasHydrated } = useAuthStore();
	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const [mounted, setMounted] = useState(false);
	const [data, setData] = useState<any>(null);
	const [studentId, setStudentId] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);

	// Mode Edit States
	const [isEditingOds, setIsEditingOds] = useState(false);
	const [isEditingPramagang, setIsEditingPramagang] = useState(false);
	const [isEditingMonthly, setIsEditingMonthly] = useState(false);
	const [isEditingTriDharma, setIsEditingTriDharma] = useState(false);

	// Tri Dharma Inputs - Segmen 9 (PKM & Penelitian)
	const [editingTriDharmaId, setEditingTriDharmaId] = useState<string | null>(
		null,
	);
	const [triDharmaCategory, setTriDharmaCategory] = useState<
		"pkm" | "penelitian"
	>("pkm");
	const [triDharmaLocationType, setTriDharmaLocationType] = useState<
		"sekolah_mitra" | "desa_binaan"
	>("sekolah_mitra");
	const [triDharmaLocationName, setTriDharmaLocationName] = useState("");
	const [triDharmaTitle, setTriDharmaTitle] = useState("");
	const [triDharmaDate, setTriDharmaDate] = useState("");
	const [triDharmaLecturer, setTriDharmaLecturer] = useState("");
	const [triDharmaDescription, setTriDharmaDescription] = useState("");
	const [isSubmittingTriDharma, setIsSubmittingTriDharma] = useState(false);
	const [isDeletingTriDharmaId, setIsDeletingTriDharmaId] = useState<
		string | null
	>(null);

	const resetTriDharmaForm = useCallback(() => {
		setEditingTriDharmaId(null);
		setTriDharmaCategory("pkm");
		setTriDharmaLocationType("sekolah_mitra");
		setTriDharmaLocationName("");
		setTriDharmaTitle("");
		setTriDharmaDate("");
		setTriDharmaLecturer("");
		setTriDharmaDescription("");
	}, []);

	// Unggah Mandiri Inputs - Segmen 9 (Pra-Magang)
	const [pramagangVideoLink, setPramagangVideoLink] = useState("");
	const [isSubmittingPramagang, setIsSubmittingPramagang] = useState(false);

	// Unggah Mandiri Inputs - Segmen 10 (Konten Bulanan)
	const [editingMonthlyVideoId, setEditingMonthlyVideoId] = useState<
		string | null
	>(null);
	const [monthlyVideoMonth, setMonthlyVideoMonth] = useState<string>(
		MONTH_NAMES[new Date().getMonth()],
	);
	const [monthlyVideoYear, setMonthlyVideoYear] = useState<number>(
		new Date().getFullYear(),
	);
	const [monthlyVideoPlatform, setMonthlyVideoPlatform] =
		useState("Instagram Reel");
	const [monthlyVideoTitle, setMonthlyVideoTitle] = useState("");
	const [monthlyVideoLink, setMonthlyVideoLink] = useState("");
	const [isSubmittingMonthly, setIsSubmittingMonthly] = useState(false);
	const [isDeletingMonthlyId, setIsDeletingMonthlyId] = useState<string | null>(
		null,
	);

	const resetMonthlyForm = useCallback(() => {
		setEditingMonthlyVideoId(null);
		setMonthlyVideoMonth(MONTH_NAMES[new Date().getMonth()]);
		setMonthlyVideoYear(new Date().getFullYear());
		setMonthlyVideoPlatform("Instagram Reel");
		setMonthlyVideoTitle("");
		setMonthlyVideoLink("");
	}, []);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const res = await (api.mahasiswa.panel as any).crm.get();
			if (res.data?.success) {
				const crmData = res.data.data;
				setData(crmData);
				if (crmData.studentId) {
					setStudentId(crmData.studentId);
				} else if ((user as any)?.studentId) {
					setStudentId((user as any).studentId);
				}
				if (crmData.pramagangVideoLink) {
					setPramagangVideoLink(crmData.pramagangVideoLink);
				}
			}
		} catch (err) {
			console.error("Gagal memuat data CRM:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		setMounted(true);
		if (hasHydrated && isAuthenticated && user?.role === "mahasiswa") {
			fetchData();
		}
	}, [user, hasHydrated, isAuthenticated, fetchData]);

	if (!mounted) return null;

	if (loading) {
		return (
			<div className="flex items-center justify-center h-[50vh]">
				<RefreshCw className="w-8 h-8 text-[#0517B0] animate-spin" />
			</div>
		);
	}

	// Parse monthlyVideos
	let monthlyVideosList: any[] = [];
	if (data?.monthlyVideos) {
		try {
			monthlyVideosList =
				typeof data.monthlyVideos === "string"
					? JSON.parse(data.monthlyVideos)
					: data.monthlyVideos;
			if (!Array.isArray(monthlyVideosList)) monthlyVideosList = [];
		} catch {
			monthlyVideosList = [];
		}
	}
	if (monthlyVideosList.length === 0 && data?.monthlyVideoLink) {
		monthlyVideosList = [
			{
				id: "legacy",
				month: "Januari",
				year: new Date().getFullYear(),
				title: data.monthlyVideoTitle || "Video Konten Promosi Bulanan",
				platform: data.monthlyVideoPlatform || "Instagram",
				videoLink: data.monthlyVideoLink,
				status: data.monthlyVideoStatus || "MENUNGGU_REVIEW",
				notes: data.monthlyVideoNotes,
				submittedAt: data.monthlyVideoSubmittedAt,
				reviewedAt: data.monthlyVideoReviewedAt,
			},
		];
	}

	const handleSubmitPramagangVideo = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!pramagangVideoLink.trim()) {
			toast.error("Tautan video laporan pra-magang wajib diisi");
			return;
		}

		setIsSubmittingPramagang(true);
		try {
			const res = await fetch(
				`${API_URL}/mahasiswa/panel/crm/pramagang-video`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ videoLink: pramagangVideoLink.trim() }),
				},
			);
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(
					json.message || "Gagal menyetor video laporan pra-magang",
				);
			}
			toast.success(
				"Tautan video pra-magang berhasil disetor dan menunggu review admin CRM!",
			);
			setIsEditingPramagang(false);
			fetchData();
		} catch (err: any) {
			toast.error(err.message || "Terjadi kesalahan saat menyetor video");
		} finally {
			setIsSubmittingPramagang(false);
		}
	};

	const handleSubmitMonthlyVideo = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!monthlyVideoLink.trim()) {
			toast.error("Tautan video konten bulanan wajib diisi");
			return;
		}

		// Validasi tautan tidak boleh sama dengan yang sudah pernah disetor
		const cleanLink = monthlyVideoLink.trim().toLowerCase();
		const isDuplicate = monthlyVideosList.some(
			(v: any) =>
				v.videoLink?.trim()?.toLowerCase() === cleanLink &&
				(!editingMonthlyVideoId || v.id !== editingMonthlyVideoId),
		);
		if (isDuplicate) {
			toast.error(
				"Tautan video ini sudah pernah disetorkan! Silakan gunakan tautan video konten yang berbeda.",
			);
			return;
		}

		setIsSubmittingMonthly(true);
		try {
			const res = await fetch(`${API_URL}/mahasiswa/panel/crm/monthly-video`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					videoLink: monthlyVideoLink.trim(),
					month: monthlyVideoMonth,
					year: Number(monthlyVideoYear) || new Date().getFullYear(),
					title:
						monthlyVideoTitle.trim() ||
						`Video Konten Promosi ${monthlyVideoMonth} ${monthlyVideoYear}`,
					platform: monthlyVideoPlatform || "Instagram Reel",
					editId: editingMonthlyVideoId || undefined,
				}),
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.message || "Gagal menyetor video konten bulanan");
			}
			toast.success(
				editingMonthlyVideoId
					? `Tautan video konten (${monthlyVideoMonth} ${monthlyVideoYear}) berhasil diperbarui!`
					: `Tautan video konten bulanan (${monthlyVideoMonth} ${monthlyVideoYear}) berhasil disetor dan menunggu review admin CRM!`,
			);
			resetMonthlyForm();
			setIsEditingMonthly(false);
			fetchData();
		} catch (err: any) {
			toast.error(err.message || "Terjadi kesalahan saat menyetor video");
		} finally {
			setIsSubmittingMonthly(false);
		}
	};

	const handleDeleteMonthlyVideo = async (videoId: string) => {
		try {
			setIsDeletingMonthlyId(videoId);
			const res = await fetch(
				`${API_URL}/mahasiswa/panel/crm/monthly-video/${videoId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.message || "Gagal menghapus video konten bulanan");
			}
			toast.success("Video konten bulanan berhasil dihapus");
			if (editingMonthlyVideoId === videoId) {
				resetMonthlyForm();
				setIsEditingMonthly(false);
			}
			fetchData();
		} catch (err: any) {
			toast.error(err.message || "Terjadi kesalahan saat menghapus video");
		} finally {
			setIsDeletingMonthlyId(null);
		}
	};

	const handleStartEditMonthlyVideo = (item: any) => {
		setEditingMonthlyVideoId(item.id);
		setMonthlyVideoMonth(item.month || MONTH_NAMES[new Date().getMonth()]);
		setMonthlyVideoYear(item.year || new Date().getFullYear());
		setMonthlyVideoPlatform(item.platform || "Instagram Reel");
		setMonthlyVideoTitle(item.title || "");
		setMonthlyVideoLink(item.videoLink || "");
		setIsEditingMonthly(true);
	};

	const handleSubmitTriDharma = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!triDharmaLocationName.trim() || !triDharmaTitle.trim()) {
			toast.error("Nama lokasi dan judul/topik kegiatan wajib diisi");
			return;
		}
		setIsSubmittingTriDharma(true);
		try {
			const res = await fetch(`${API_URL}/mahasiswa/panel/crm/tri-dharma`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					id: editingTriDharmaId || undefined,
					category: triDharmaCategory,
					locationType: triDharmaLocationType,
					locationName: triDharmaLocationName.trim(),
					title: triDharmaTitle.trim(),
					date: triDharmaDate,
					lecturerName: triDharmaLecturer.trim(),
					description: triDharmaDescription.trim(),
				}),
			});
			const json = await res.json();
			if (json.success) {
				toast.success(
					editingTriDharmaId
						? "Data kegiatan Tri Dharma berhasil diperbarui"
						: "Kegiatan Tri Dharma berhasil disetorkan dan menunggu review admin",
				);
				resetTriDharmaForm();
				setIsEditingTriDharma(false);
				fetchData();
			} else {
				toast.error(json.message || "Gagal menyetorkan kegiatan Tri Dharma");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan sistem saat menyetorkan data");
		} finally {
			setIsSubmittingTriDharma(false);
		}
	};

	const handleDeleteTriDharma = async (activityId: string) => {
		if (!confirm("Apakah Anda yakin ingin menghapus kegiatan Tri Dharma ini?"))
			return;
		setIsDeletingTriDharmaId(activityId);
		try {
			const res = await fetch(
				`${API_URL}/mahasiswa/panel/crm/tri-dharma/${activityId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			const json = await res.json();
			if (json.success) {
				toast.success("Kegiatan Tri Dharma berhasil dihapus");
				fetchData();
			} else {
				toast.error(json.message || "Gagal menghapus kegiatan");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan saat menghapus");
		} finally {
			setIsDeletingTriDharmaId(null);
		}
	};

	const renderChecklistItem = (
		label: string,
		isChecked: boolean,
		key?: string | number,
	) => (
		<div
			key={key ?? label}
			className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl transition-colors hover:bg-slate-100/60"
		>
			<span className="font-medium text-slate-700 flex items-center gap-2.5 text-sm">
				<ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
				{label}
			</span>
			{isChecked ? (
				<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-xs">
					<CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
				</Badge>
			) : (
				<Badge
					variant="outline"
					className="text-slate-400 bg-white border-slate-200 text-xs"
				>
					<Clock className="w-3 h-3 mr-1" /> Belum
				</Badge>
			)}
		</div>
	);

	const renderStatusChecklistItem = (
		label: string,
		status?: string | null,
		isDone?: boolean,
		key?: string | number,
	) => {
		let badgeNode = (
			<Badge
				variant="outline"
				className="text-slate-400 bg-white border-slate-200 text-xs"
			>
				<Clock className="w-3 h-3 mr-1" /> Belum Disetor
			</Badge>
		);

		if (isDone || status === "DISETUJUI") {
			badgeNode = (
				<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-xs">
					<CheckCircle2 className="w-3 h-3 mr-1" /> Disetujui
				</Badge>
			);
		} else if (status === "MENUNGGU_REVIEW") {
			badgeNode = (
				<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 text-xs animate-pulse">
					<Clock className="w-3 h-3 mr-1" /> Menunggu Review
				</Badge>
			);
		} else if (status === "PERLU_REVISI") {
			badgeNode = (
				<Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-0 text-xs font-semibold">
					<AlertCircle className="w-3 h-3 mr-1" /> Perlu Revisi
				</Badge>
			);
		}

		return (
			<div
				key={key ?? label}
				className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl transition-colors hover:bg-slate-100/60"
			>
				<span className="font-medium text-slate-700 flex items-center gap-2.5 text-sm">
					<ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
					{label}
				</span>
				{badgeNode}
			</div>
		);
	};

	const present = data?.practiceDaysPresent || 0;
	const total = data?.practiceDaysTotal || 0;
	const attendancePercent =
		total > 0 ? Math.min((present / total) * 100, 100) : 0;

	// Parse odsDetails
	let odsList: any[] = [];
	if (data?.odsDetails) {
		try {
			odsList =
				typeof data.odsDetails === "string"
					? JSON.parse(data.odsDetails)
					: data.odsDetails;
			if (!Array.isArray(odsList)) odsList = [];
		} catch {
			odsList = [];
		}
	}

	const odsFlags = [
		Boolean(data?.isOds1Report || odsList[0]?.isDone),
		Boolean(data?.isOds2Report || odsList[1]?.isDone),
		Boolean(data?.isOds3Report || odsList[2]?.isDone),
		Boolean(data?.isOds4Report || odsList[3]?.isDone),
		Boolean(data?.isOds5Report || odsList[4]?.isDone),
	];

	const isPramagangDone = Boolean(
		data?.isPrammagangReport || data?.pramagangVideoStatus === "DISETUJUI",
	);
	const isMonthlyDone = Boolean(
		data?.isMonthlyVideo ||
			data?.monthlyVideoStatus === "DISETUJUI" ||
			monthlyVideosList.some((v: any) => v.status === "DISETUJUI"),
	);

	const triDharmaList: any[] = Array.isArray(data?.triDharmaDetails)
		? data.triDharmaDetails
		: [];
	const isTriDharmaDone = Boolean(
		data?.isTriDharma ||
			triDharmaList.some(
				(act: any) => act.status === "DISETUJUI" || Boolean(act.isDone),
			),
	);

	const completedCount = [
		data?.isMonitoringParent,
		data?.isMonitoringIndustry,
		data?.isVocabComplete,
		data?.practiceAttendance,
		...odsFlags,
		isPramagangDone,
		isMonthlyDone,
		isTriDharmaDone,
	].filter(Boolean).length;
	const totalCrmChecks = 12;
	const checklistPercentage = (completedCount / totalCrmChecks) * 100;

	const formatDate = (dateString: string | null | undefined) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	const odsDocKeys = [
		"ods_1_report",
		"ods_2_report",
		"ods_3_report",
		"ods_4_report",
		"ods_5_report",
	];

	const isCrmAcc = Boolean(data?.isAcc);

	return (
		<div className="max-w-4xl mx-auto space-y-6 pb-12">
			<Link
				href="/mahasiswa/dashboard"
				className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Dashboard
			</Link>

			{/* Header Card */}
			<Card className="border-slate-200/90 shadow-sm overflow-hidden rounded-2xl">
				<div className="h-2 w-full bg-[#0517B0]"></div>
				<CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
						<div>
							<CardTitle className="text-2xl text-slate-900 flex items-center gap-2 font-bold tracking-tight">
								Panel CRM (Customer Relationship Management)
							</CardTitle>
							<CardDescription className="mt-1 text-sm text-slate-500">
								Monitoring Kegiatan Praktik, ODS, Pra-Magang, Konten Bulanan
								&amp; Buku Komunikasi
							</CardDescription>
						</div>
						{isCrmAcc ? (
							<div className="flex flex-col items-end gap-1">
								<Badge className="bg-emerald-500 text-white px-3.5 py-1.5 text-sm rounded-full shadow-sm font-semibold">
									<CheckCircle className="w-4 h-4 mr-1.5" /> Telah di-ACC CRM
								</Badge>
								{data?.accAt && (
									<span className="text-[11px] text-slate-500 font-medium">
										Disetujui: {formatDate(data.accAt)}
									</span>
								)}
							</div>
						) : (
							<Badge
								variant="outline"
								className="text-slate-500 px-3.5 py-1.5 text-sm rounded-full bg-white border-slate-200 font-medium"
							>
								<Clock className="w-4 h-4 mr-1.5 text-amber-500" /> Sedang
								Diproses
							</Badge>
						)}
					</div>
				</CardHeader>

				<CardContent className="p-6 sm:p-8 space-y-8">
					{/* Section 1: Progress Checklist (11 Kriteria) */}
					<div>
						<div className="flex justify-between items-end mb-3">
							<div>
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
									<BookOpen className="w-4 h-4 text-[#0517B0]" />
									Checklist Validasi CRM &amp; Buku Komunikasi
								</h3>
								<p className="text-xs text-slate-500 mt-0.5">
									{completedCount} dari {totalCrmChecks} kriteria telah
									terpenuhi
								</p>
							</div>
							<span className="text-base font-extrabold text-[#0517B0]">
								{Math.round(checklistPercentage)}%
							</span>
						</div>
						<Progress
							value={checklistPercentage}
							className="h-3 bg-slate-100 mb-6 rounded-full"
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-3">
								<h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
									ODS &amp; Laporan Pra-Magang
								</h4>
								{odsDocKeys.map((docKey, i) =>
									renderChecklistItem(
										`Laporan ODS ${i + 1}`,
										odsFlags[i],
										docKey,
									),
								)}
								{renderStatusChecklistItem(
									"Tri Dharma (PKM & Penelitian)",
									triDharmaList.length > 0
										? triDharmaList[0].status
										: undefined,
									isTriDharmaDone,
								)}
								{renderStatusChecklistItem(
									"Laporan Video Pra-Magang (Segmen 9)",
									data?.pramagangVideoStatus,
									isPramagangDone,
								)}
								{renderStatusChecklistItem(
									"Video Konten Bulanan (Segmen 10)",
									data?.monthlyVideoStatus,
									isMonthlyDone,
								)}
							</div>
							<div className="space-y-3">
								<h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Monitoring, Hafalan &amp; Presensi
								</h4>
								{renderChecklistItem(
									"Monitoring Orang Tua (Telp / Visit)",
									Boolean(data?.isMonitoringParent),
								)}
								{renderChecklistItem(
									"Monitoring Kunjungan Industri",
									Boolean(data?.isMonitoringIndustry),
								)}
								{renderChecklistItem(
									"Kelulusan Hafalan Vocab Standar",
									Boolean(data?.isVocabComplete),
								)}
								{renderChecklistItem(
									"Presensi / Kehadiran Praktik ODS",
									Boolean(data?.practiceAttendance),
								)}
							</div>
						</div>
					</div>

					<Separator />

					{/* Section 2: Upload Laporan ODS */}
					{studentId ? (
						<div>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
								<div className="flex items-center gap-2">
									<Layers className="w-5 h-5 text-indigo-600" />
									<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
										Upload Laporan ODS
									</h3>
								</div>
								{isCrmAcc ? (
									<Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs px-3 py-1 font-semibold flex items-center gap-1.5 self-start sm:self-auto">
										<Lock className="w-3.5 h-3.5" /> Terkunci (ACC CRM)
									</Badge>
								) : (
									<div className="self-start sm:self-auto">
										{!isEditingOds ? (
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => setIsEditingOds(true)}
												className="h-8 text-xs font-semibold text-[#0517B0] border-[#0517B0]/30 hover:bg-[#0517B0]/10 gap-1.5 shadow-2xs"
											>
												<Pencil className="w-3.5 h-3.5" /> Edit Data ODS
											</Button>
										) : (
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => setIsEditingOds(false)}
												className="h-8 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 gap-1.5 shadow-2xs"
											>
												<Check className="w-3.5 h-3.5 text-emerald-600" />{" "}
												Selesai Edit
											</Button>
										)}
									</div>
								)}
							</div>
							<p className="text-xs text-slate-500 mb-5 flex items-start gap-1.5">
								<Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
								Upload laporan ODS (PDF, maks 5MB per file). Laporan
								diverifikasi tim CRM sebelum checklist dikonfirmasi. File tidak
								dapat dihapus atau diubah setelah progress disetujui / di-ACC.
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{odsDocKeys.map((docKey, i) => {
									const isDone = odsFlags[i];
									return (
										<div
											key={docKey}
											className={`p-4 rounded-2xl border ${isDone ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200/80"}`}
										>
											<div className="flex items-center justify-between mb-3">
												<h4 className="text-sm font-semibold text-slate-800">
													Laporan ODS {i + 1}
												</h4>
												{isDone ? (
													<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] gap-1 font-semibold">
														<CheckCircle2 className="w-3 h-3" /> Selesai
													</Badge>
												) : (
													<Badge
														variant="outline"
														className="text-slate-400 border-slate-200 text-[10px]"
													>
														<Upload className="w-3 h-3 mr-1" /> Menunggu
													</Badge>
												)}
											</div>
											{isDone && (
												<div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 rounded-lg px-2.5 py-1.5 mb-3">
													<Lock className="w-3 h-3 shrink-0" />
													<span>
														Laporan dikunci — sudah diverifikasi tim CRM
													</span>
												</div>
											)}
											<DocumentUpload
												studentId={studentId}
												panel="crm"
												documentKey={docKey}
												layout="stacked"
												canEdit={isEditingOds && !isDone && !isCrmAcc}
												canDelete={isEditingOds && !isDone && !isCrmAcc}
												onUploadSuccess={fetchData}
												onDeleteSuccess={fetchData}
												viewUrlBase="/mahasiswa/dokumen"
											/>
										</div>
									);
								})}
							</div>
						</div>
					) : null}

					{studentId ? <Separator /> : null}

					{/* Section 3: Upload Laporan Pra-Magang (PDF) */}
					{studentId ? (
						<div>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
								<div className="flex items-center gap-2">
									<Briefcase className="w-5 h-5 text-blue-600" />
									<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
										Upload Berkas Laporan Pra-Magang (PDF)
									</h3>
								</div>
								{isCrmAcc || data?.isPrammagangReport ? (
									<Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs px-3 py-1 font-semibold flex items-center gap-1.5 self-start sm:self-auto">
										<Lock className="w-3.5 h-3.5" /> Terkunci (ACC)
									</Badge>
								) : (
									<div className="self-start sm:self-auto">
										{!isEditingOds ? (
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => setIsEditingOds(true)}
												className="h-8 text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 gap-1.5 shadow-2xs"
											>
												<Pencil className="w-3.5 h-3.5" /> Edit Berkas
											</Button>
										) : (
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => setIsEditingOds(false)}
												className="h-8 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 gap-1.5 shadow-2xs"
											>
												<Check className="w-3.5 h-3.5 text-emerald-600" />{" "}
												Selesai Edit
											</Button>
										)}
									</div>
								)}
							</div>
							<p className="text-xs text-slate-500 mb-5 flex items-start gap-1.5">
								<Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
								Upload berkas laporan akhir pra-magang dalam format PDF (maks
								5MB). Berkas akan ditinjau oleh tim CRM.
							</p>
							<div className="p-4 rounded-2xl border bg-slate-50 border-slate-200/80 max-w-sm">
								<div className="flex items-center justify-between mb-3">
									<h4 className="text-sm font-semibold text-slate-800">
										Laporan Kegiatan Pra-Magang
									</h4>
									{data?.isPrammagangReport ? (
										<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] gap-1 font-semibold">
											<CheckCircle2 className="w-3 h-3" /> Selesai
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-slate-400 border-slate-200 text-[10px]"
										>
											<Upload className="w-3 h-3 mr-1" /> Menunggu
										</Badge>
									)}
								</div>
								{data?.isPrammagangReport && (
									<div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 rounded-lg px-2.5 py-1.5 mb-3">
										<Lock className="w-3 h-3 shrink-0" />
										<span>Laporan dikunci — sudah diverifikasi tim CRM</span>
									</div>
								)}
								<DocumentUpload
									studentId={studentId}
									panel="crm"
									documentKey="pramagang_report"
									layout="stacked"
									canEdit={
										isEditingOds && !data?.isPrammagangReport && !isCrmAcc
									}
									canDelete={
										isEditingOds && !data?.isPrammagangReport && !isCrmAcc
									}
									onUploadSuccess={fetchData}
									onDeleteSuccess={fetchData}
									viewUrlBase="/mahasiswa/dokumen"
								/>
							</div>
						</div>
					) : null}

					{studentId ? <Separator /> : null}

					{/* Section 4: TRI DHARMA PERGURUAN TINGGI (PKM & PENELITIAN - SEGMEN 9) */}
					{studentId ? (
						<div className="space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div className="flex items-center gap-2">
									<GraduationCap className="w-5 h-5 text-purple-600 shrink-0" />
									<div>
										<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
											Tri Dharma Perguruan Tinggi: PKM &amp; Penelitian
										</h3>
										<p className="text-xs text-slate-500">
											Pelaksanaan kegiatan pengabdian masyarakat (PKM) atau
											penelitian di sekolah mitra maupun desa binaan bersama
											dosen pembimbing (Segmen 9).
										</p>
									</div>
								</div>

								{isCrmAcc ? (
									<Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs px-3 py-1 font-semibold flex items-center gap-1.5 self-start sm:self-auto">
										<Lock className="w-3.5 h-3.5" /> Terkunci (ACC)
									</Badge>
								) : (
									<div className="self-start sm:self-auto">
										{!isEditingTriDharma ? (
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													resetTriDharmaForm();
													setIsEditingTriDharma(true);
												}}
												className="h-8 text-xs font-semibold text-purple-700 border-purple-200 hover:bg-purple-50 gap-1.5 shadow-2xs"
											>
												<Plus className="w-3.5 h-3.5" /> Tambah / Ajukan
												Kegiatan
											</Button>
										) : (
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													resetTriDharmaForm();
													setIsEditingTriDharma(false);
												}}
												className="h-8 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 gap-1.5 shadow-2xs"
											>
												<X className="w-3.5 h-3.5" /> Tutup Form
											</Button>
										)}
									</div>
								)}
							</div>

							{/* Form Pengajuan / Edit Kegiatan Tri Dharma */}
							{isEditingTriDharma && !isCrmAcc && (
								<form
									onSubmit={handleSubmitTriDharma}
									className="p-5 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-4 shadow-sm"
								>
									<div className="flex items-center justify-between pb-2 border-b border-purple-100">
										<h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
											<Pencil className="w-3.5 h-3.5" />
											{editingTriDharmaId
												? "Edit Pengajuan Kegiatan Tri Dharma"
												: "Form Setor Kegiatan Tri Dharma Baru"}
										</h4>
										{editingTriDharmaId && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={resetTriDharmaForm}
												className="h-6 text-[11px] text-slate-500 hover:text-slate-800"
											>
												Batalkan Edit
											</Button>
										)}
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
										<div>
											<Label className="text-[11px] font-bold text-slate-700 block mb-1">
												Kategori Kegiatan{" "}
												<span className="text-rose-500">*</span>
											</Label>
											<Select
												value={triDharmaCategory}
												onValueChange={(val: any) => setTriDharmaCategory(val)}
											>
												<SelectTrigger className="h-8 text-xs bg-white">
													<SelectValue placeholder="Pilih Kategori">
														{TRI_DHARMA_CATEGORIES.find(
															(c) => c.value === triDharmaCategory,
														)?.label || "Pilih Kategori"}
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													{TRI_DHARMA_CATEGORIES.map((cat) => (
														<SelectItem
															key={cat.value}
															value={cat.value}
															className="text-xs"
														>
															{cat.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div>
											<Label className="text-[11px] font-bold text-slate-700 block mb-1">
												Tipe Lokasi Pelaksanaan{" "}
												<span className="text-rose-500">*</span>
											</Label>
											<Select
												value={triDharmaLocationType}
												onValueChange={(val: any) =>
													setTriDharmaLocationType(val)
												}
											>
												<SelectTrigger className="h-8 text-xs bg-white">
													<SelectValue placeholder="Pilih Tipe Lokasi">
														{TRI_DHARMA_LOCATIONS.find(
															(loc) => loc.value === triDharmaLocationType,
														)?.label || "Pilih Tipe Lokasi"}
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													{TRI_DHARMA_LOCATIONS.map((loc) => (
														<SelectItem
															key={loc.value}
															value={loc.value}
															className="text-xs"
														>
															{loc.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="sm:col-span-2">
											<Label className="text-[11px] font-bold text-slate-700 block mb-1">
												Nama{" "}
												{triDharmaLocationType === "desa_binaan"
													? "Desa Binaan"
													: "Sekolah Mitra"}{" "}
												<span className="text-rose-500">*</span>
											</Label>
											<Input
												placeholder={
													triDharmaLocationType === "desa_binaan"
														? "Contoh: Desa Binaan Sabah Balau, Lampung Selatan"
														: "Contoh: SMK Negeri 1 Bandar Lampung"
												}
												value={triDharmaLocationName}
												onChange={(e) =>
													setTriDharmaLocationName(e.target.value)
												}
												className="h-8 text-xs bg-white"
												required
											/>
										</div>

										<div className="sm:col-span-2">
											<Label className="text-[11px] font-bold text-slate-700 block mb-1">
												Judul / Topik Kegiatan{" "}
												<span className="text-rose-500">*</span>
											</Label>
											<Input
												placeholder="Contoh: Sosialisasi Penerapan Higiene & Sanitasi di Kantin Sekolah"
												value={triDharmaTitle}
												onChange={(e) => setTriDharmaTitle(e.target.value)}
												className="h-8 text-xs bg-white"
												required
											/>
										</div>

										<div>
											<Label className="text-[11px] font-bold text-slate-700 block mb-1">
												Tanggal Pelaksanaan
											</Label>
											<Input
												type="date"
												value={triDharmaDate}
												onChange={(e) => setTriDharmaDate(e.target.value)}
												className="h-8 text-xs bg-white"
											/>
										</div>

										<div>
											<Label className="text-[11px] font-bold text-slate-700 block mb-1">
												Dosen Pembimbing / Pendamping
											</Label>
											<Input
												placeholder="Contoh: Dr. Budi Santoso, M.Par"
												value={triDharmaLecturer}
												onChange={(e) => setTriDharmaLecturer(e.target.value)}
												className="h-8 text-xs bg-white"
											/>
										</div>

										<div className="sm:col-span-2">
											<Label className="text-[11px] font-bold text-slate-700 block mb-1">
												Deskripsi / Ringkasan Pelaksanaan (Opsional)
											</Label>
											<Textarea
												placeholder="Tuliskan ringkasan kegiatan dan peran mahasiswa..."
												value={triDharmaDescription}
												onChange={(e) =>
													setTriDharmaDescription(e.target.value)
												}
												className="text-xs bg-white min-h-[50px]"
											/>
										</div>
									</div>

									<div className="flex justify-end gap-2 pt-2 border-t border-purple-100">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => {
												resetTriDharmaForm();
												setIsEditingTriDharma(false);
											}}
											className="h-8 text-xs"
										>
											Batal
										</Button>
										<Button
											type="submit"
											size="sm"
											disabled={isSubmittingTriDharma}
											className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
										>
											{isSubmittingTriDharma ? (
												<>
													<RefreshCw className="w-3.5 h-3.5 animate-spin" />
													Menyimpan...
												</>
											) : (
												<>
													<Send className="w-3.5 h-3.5" />
													{editingTriDharmaId
														? "Simpan Perubahan"
														: "Setorkan Kegiatan"}
												</>
											)}
										</Button>
									</div>
								</form>
							)}

							{/* Daftar Kegiatan Tri Dharma yang Disetor */}
							{triDharmaList.length === 0 ? (
								<div className="p-6 rounded-2xl border border-dashed border-purple-200 bg-purple-50/20 text-center">
									<BookOpen className="w-8 h-8 text-purple-300 mx-auto mb-2" />
									<p className="text-xs font-semibold text-slate-700">
										Belum ada kegiatan Tri Dharma yang disetorkan
									</p>
									<p className="text-[11px] text-slate-500 mt-0.5">
										Klik tombol "Tambah / Ajukan Kegiatan" di atas untuk
										menyetorkan laporan kegiatan PKM atau Penelitian Anda.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{triDharmaList.map((act: any) => {
										const isApproved =
											act.status === "DISETUJUI" || Boolean(act.isDone);
										const isRevision = act.status === "PERLU_REVISI";

										return (
											<div
												key={act.id}
												className={`p-4 rounded-2xl border transition-all space-y-3 ${
													isApproved
														? "border-emerald-200 bg-emerald-50/20"
														: isRevision
															? "border-rose-200 bg-rose-50/20"
															: "border-slate-200 bg-white"
												}`}
											>
												<div className="flex flex-wrap items-center justify-between gap-2">
													<div className="flex flex-wrap items-center gap-1.5">
														<Badge
															className={
																act.category === "penelitian"
																	? "bg-purple-100 text-purple-800 border-0 text-[10px] font-bold"
																	: "bg-blue-100 text-blue-800 border-0 text-[10px] font-bold"
															}
														>
															{TRI_DHARMA_CATEGORIES.find(
																(c) => c.value === act.category,
															)?.label ||
																(act.category === "penelitian"
																	? "Penelitian"
																	: "Pengabdian (PKM)")}
														</Badge>

														<Badge
															variant="outline"
															className={
																act.locationType === "desa_binaan"
																	? "bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] gap-1 font-semibold"
																	: "bg-amber-50 text-amber-800 border-amber-300 text-[10px] gap-1 font-semibold"
															}
														>
															{act.locationType === "desa_binaan" ? (
																<MapPin className="w-3 h-3 text-emerald-600" />
															) : (
																<School className="w-3 h-3 text-amber-600" />
															)}
															{TRI_DHARMA_LOCATIONS.find(
																(loc) => loc.value === act.locationType,
															)?.label ||
																(act.locationType === "desa_binaan"
																	? "Desa Binaan"
																	: "Sekolah Mitra")}
														</Badge>
													</div>

													{isApproved ? (
														<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-bold gap-1">
															<CheckCircle2 className="w-3 h-3" /> Disetujui
														</Badge>
													) : isRevision ? (
														<Badge className="bg-rose-100 text-rose-800 border-0 text-[10px] font-bold gap-1">
															<AlertCircle className="w-3 h-3" /> Perlu Revisi
														</Badge>
													) : (
														<Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] font-bold gap-1 animate-pulse">
															<Clock className="w-3 h-3" /> Menunggu Review
														</Badge>
													)}
												</div>

												<div>
													<h4 className="text-sm font-bold text-slate-800 leading-snug">
														{act.title || "Tanpa Judul"}
													</h4>
													<p className="text-xs text-slate-600 font-medium mt-1">
														<span className="font-semibold text-slate-700">
															Lokasi:
														</span>{" "}
														{act.locationName || "-"}
													</p>
												</div>

												<div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
													<div>
														<span className="text-[10px] uppercase font-bold text-slate-400 block">
															Tanggal
														</span>
														<span className="text-slate-700 font-medium">
															{formatDate(act.date)}
														</span>
													</div>
													<div>
														<span className="text-[10px] uppercase font-bold text-slate-400 block">
															Dosen Pembimbing
														</span>
														<span className="text-slate-700 font-medium truncate block">
															{act.lecturerName || "-"}
														</span>
													</div>
												</div>

												{act.description && (
													<p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
														{act.description}
													</p>
												)}

												{act.reviewNotes && (
													<div
														className={`text-xs p-2.5 rounded-lg border flex items-start gap-2 ${
															isRevision
																? "bg-rose-50 border-rose-200 text-rose-800"
																: "bg-emerald-50 border-emerald-200 text-emerald-800"
														}`}
													>
														<AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
														<div>
															<p className="font-bold text-[11px]">
																Catatan Admin CRM:
															</p>
															<p className="text-[11px] mt-0.5">
																{act.reviewNotes}
															</p>
														</div>
													</div>
												)}

												{/* Upload Laporan Kegiatan PDF */}
												<div className="pt-2 border-t border-slate-100">
													<div className="flex items-center justify-between mb-1.5">
														<Label className="text-[10px] uppercase font-bold text-slate-500 block">
															Laporan / Bukti Berkas PDF
														</Label>
													</div>
													<DocumentUpload
														studentId={studentId}
														panel="crm"
														documentKey={`tri_dharma_${act.id}_report`}
														layout="stacked"
														canEdit={!isApproved && !isCrmAcc}
														canDelete={!isApproved && !isCrmAcc}
														onUploadSuccess={fetchData}
														onDeleteSuccess={fetchData}
														viewUrlBase="/mahasiswa/dokumen"
													/>
												</div>

												{/* Tombol Aksi Mahasiswa */}
												{!isApproved && !isCrmAcc && (
													<div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => {
																setEditingTriDharmaId(act.id);
																setTriDharmaCategory(act.category || "pkm");
																setTriDharmaLocationType(
																	act.locationType || "sekolah_mitra",
																);
																setTriDharmaLocationName(
																	act.locationName || "",
																);
																setTriDharmaTitle(act.title || "");
																setTriDharmaDate(act.date || "");
																setTriDharmaLecturer(act.lecturerName || "");
																setTriDharmaDescription(act.description || "");
																setIsEditingTriDharma(true);
															}}
															className="text-xs h-7 px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
														>
															<Pencil className="w-3 h-3 mr-1" /> Edit
														</Button>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => handleDeleteTriDharma(act.id)}
															disabled={isDeletingTriDharmaId === act.id}
															className="text-xs h-7 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
														>
															<Trash2 className="w-3 h-3 mr-1" /> Hapus
														</Button>
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					) : null}

					{studentId ? <Separator /> : null}

					{/* Section 5: UNGGAH MANDIRI MAHASISWA: VIDEO PRA-MAGANG & KONTEN BULANAN (Segmen 9 & 10) */}
					<div>
						<div className="flex items-center gap-2 mb-2">
							<Sparkles className="w-5 h-5 text-amber-500" />
							<div>
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
									Unggah Mandiri Mahasiswa: Video Pra-Magang &amp; Konten
									Bulanan
								</h3>
								<p className="text-xs text-slate-500">
									Setorkan tautan video laporan pra-magang dan video promosi /
									kegiatan bulanan Anda untuk ditinjau oleh Admin CRM (Segmen 9
									&amp; 10).
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
							{/* Card Segmen 9: Tautan Video Laporan Pra-Magang */}
							<div
								className={`p-5 rounded-2xl border transition-all ${
									data?.pramagangVideoStatus === "DISETUJUI"
										? "bg-emerald-50/40 border-emerald-200"
										: data?.pramagangVideoStatus === "PERLU_REVISI"
											? "bg-rose-50/40 border-rose-200"
											: data?.pramagangVideoStatus === "MENUNGGU_REVIEW"
												? "bg-amber-50/40 border-amber-200"
												: "bg-slate-50 border-slate-200/90"
								}`}
							>
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-2">
										<Video className="w-4 h-4 text-blue-600 shrink-0" />
										<h4 className="text-sm font-bold text-slate-800">
											Segmen 9: Video Pra-Magang
										</h4>
									</div>
									<div className="flex items-center gap-2">
										{data?.pramagangVideoStatus === "DISETUJUI" ? (
											<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-bold">
												<CheckCircle2 className="w-3 h-3 mr-1" /> Disetujui
											</Badge>
										) : data?.pramagangVideoStatus === "MENUNGGU_REVIEW" ? (
											<Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] font-bold animate-pulse">
												<Clock className="w-3 h-3 mr-1" /> Menunggu Review
											</Badge>
										) : data?.pramagangVideoStatus === "PERLU_REVISI" ? (
											<Badge className="bg-rose-100 text-rose-800 border-0 text-[10px] font-bold">
												<AlertCircle className="w-3 h-3 mr-1" /> Perlu Revisi
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-400 border-slate-200 text-[10px]"
											>
												Belum Disetor
											</Badge>
										)}

										{/* Toggle Edit Button */}
										{!isCrmAcc &&
											data?.pramagangVideoStatus !== "DISETUJUI" && (
												<div>
													{!isEditingPramagang ? (
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => setIsEditingPramagang(true)}
															className="h-7 text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 gap-1 px-2"
														>
															<Pencil className="w-3 h-3" />
															{data?.pramagangVideoLink ? "Edit" : "Setor"}
														</Button>
													) : (
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => {
																setIsEditingPramagang(false);
																setPramagangVideoLink(
																	data?.pramagangVideoLink || "",
																);
															}}
															className="h-7 text-xs text-slate-500 hover:text-slate-700 px-2"
														>
															Batal
														</Button>
													)}
												</div>
											)}
									</div>
								</div>

								<p className="text-xs text-slate-500 mb-4 leading-relaxed">
									Kewajiban menyetorkan tautan video laporan kegiatan pra-magang
									(YouTube / Google Drive / medsos publik).
								</p>

								{/* Revision Alert Box */}
								{data?.pramagangVideoStatus === "PERLU_REVISI" && (
									<div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
										<span className="font-bold flex items-center gap-1.5">
											<AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
											Catatan Revisi dari Admin CRM:
										</span>
										<p className="whitespace-pre-wrap pl-5 text-rose-700">
											{data?.pramagangVideoNotes ||
												"Tautan video tidak dapat diakses atau belum memenuhi kriteria."}
										</p>
									</div>
								)}

								{/* Approved Info Box */}
								{data?.pramagangVideoStatus === "DISETUJUI" && (
									<div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
										<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
										<span>
											Video telah disetujui resmi oleh Admin CRM. Checklist
											laporan pra-magang telah terpenuhi (Terkunci).
										</span>
									</div>
								)}

								{/* Waiting Review Info Box */}
								{data?.pramagangVideoStatus === "MENUNGGU_REVIEW" && (
									<div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
										<Clock className="w-4 h-4 text-amber-600 shrink-0" />
										<span>
											Tautan video telah disetor dan sedang dalam antrean review
											admin.
										</span>
									</div>
								)}

								{/* Existing Video Link Preview */}
								{data?.pramagangVideoLink && (
									<div className="mb-3 p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs">
										<div className="min-w-0 flex-1">
											<span className="text-[11px] text-slate-400 block font-medium">
												Tautan Disetor:
											</span>
											<span className="text-slate-700 truncate block font-mono font-medium">
												{data.pramagangVideoLink}
											</span>
										</div>
										<a
											href={data.pramagangVideoLink}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold shrink-0 transition-colors"
										>
											<ExternalLink className="w-3.5 h-3.5" /> Buka
										</a>
									</div>
								)}

								{!data?.pramagangVideoLink && !isEditingPramagang && (
									<div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-400">
										Belum ada tautan video pra-magang yang disetor. Klik tombol{" "}
										<b>Setor</b> di atas untuk menyetor tautan.
									</div>
								)}

								{/* Form Input - Hanya muncul saat mode edit */}
								{isEditingPramagang && (
									<form
										onSubmit={handleSubmitPramagangVideo}
										className="space-y-3 pt-2 border-t border-slate-200/60 mt-3"
									>
										<div>
											<Label className="text-xs font-semibold text-slate-700 block mb-1">
												{data?.pramagangVideoLink
													? "Perbarui Tautan Video (URL):"
													: "Masukkan Tautan Video (URL):"}
											</Label>
											<Input
												type="url"
												placeholder="https://youtube.com/... atau https://drive.google.com/..."
												value={pramagangVideoLink}
												onChange={(e) => setPramagangVideoLink(e.target.value)}
												disabled={isSubmittingPramagang}
												className="text-xs bg-white"
												required
											/>
										</div>
										<div className="flex gap-2">
											<Button
												type="submit"
												size="sm"
												disabled={
													isSubmittingPramagang || !pramagangVideoLink.trim()
												}
												className="flex-1 bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs shadow-xs"
											>
												{isSubmittingPramagang ? (
													<>
														<RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
														Menyimpan...
													</>
												) : (
													<>
														<Send className="w-3.5 h-3.5 mr-1.5" />
														{data?.pramagangVideoLink
															? "Kirim Ulang Tautan"
															: "Setor Video Pra-Magang"}
													</>
												)}
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													setIsEditingPramagang(false);
													setPramagangVideoLink(data?.pramagangVideoLink || "");
												}}
												className="text-xs text-slate-600"
											>
												Batal
											</Button>
										</div>
									</form>
								)}
							</div>

							{/* Card Segmen 10: Kewajiban 1 Video Konten Promosi / Kegiatan Bulanan */}
							<div
								className={`p-5 rounded-2xl border transition-all ${
									isMonthlyDone
										? "bg-purple-50/40 border-purple-200"
										: "bg-slate-50 border-slate-200/90"
								}`}
							>
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-2">
										<Video className="w-4 h-4 text-purple-600 shrink-0" />
										<h4 className="text-sm font-bold text-slate-800">
											Segmen 10: Video Konten Bulanan
										</h4>
									</div>

									{isCrmAcc ? (
										<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-bold">
											<Lock className="w-3 h-3 mr-1" /> Terkunci (ACC)
										</Badge>
									) : (
										<div>
											{!isEditingMonthly ? (
												<Button
													type="button"
													size="sm"
													onClick={() => {
														resetMonthlyForm();
														setIsEditingMonthly(true);
													}}
													className="h-7 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white gap-1 px-2.5 shadow-2xs"
												>
													<Plus className="w-3 h-3" /> Setor Video
												</Button>
											) : (
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => {
														setIsEditingMonthly(false);
														resetMonthlyForm();
													}}
													className="h-7 text-xs text-slate-500 hover:text-slate-700 px-2"
												>
													Tutup Form
												</Button>
											)}
										</div>
									)}
								</div>

								<p className="text-xs text-slate-500 mb-4 leading-relaxed">
									Kewajiban 1 video konten promosi/kegiatan bulanan di media
									sosial (Instagram Reel / TikTok / YouTube Shorts). Anda dapat
									menyetorkan video per bulan.
								</p>

								{/* Form Input - Hanya muncul saat mode edit */}
								{isEditingMonthly && (
									<form
										onSubmit={handleSubmitMonthlyVideo}
										className="space-y-3 p-4 bg-white border border-purple-200 rounded-xl mb-4 shadow-2xs"
									>
										<div className="flex items-center justify-between pb-2 border-b border-slate-100">
											<span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
												<Pencil className="w-3.5 h-3.5 text-purple-600" />
												{editingMonthlyVideoId
													? "Perbarui Tautan Video Bulanan"
													: "Setor Video Konten Bulanan Baru"}
											</span>
											{editingMonthlyVideoId && (
												<Badge
													variant="outline"
													className="text-[10px] border-purple-200 text-purple-700"
												>
													Mode Edit
												</Badge>
											)}
										</div>

										<div className="grid grid-cols-2 gap-2">
											<div>
												<Label className="text-xs font-semibold text-slate-700 block mb-1">
													Pilih Bulan:
												</Label>
												<select
													value={monthlyVideoMonth}
													onChange={(e) => setMonthlyVideoMonth(e.target.value)}
													disabled={isSubmittingMonthly}
													className="w-full text-xs bg-white border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-600 font-medium"
												>
													{MONTH_NAMES.map((m) => (
														<option key={m} value={m}>
															{m}
														</option>
													))}
												</select>
											</div>
											<div>
												<Label className="text-xs font-semibold text-slate-700 block mb-1">
													Tahun:
												</Label>
												<Input
													type="number"
													min="2024"
													max="2035"
													value={monthlyVideoYear}
													onChange={(e) =>
														setMonthlyVideoYear(Number(e.target.value))
													}
													disabled={isSubmittingMonthly}
													className="text-xs bg-white"
												/>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-2">
											<div>
												<Label className="text-xs font-semibold text-slate-700 block mb-1">
													Platform Medsos:
												</Label>
												<select
													value={monthlyVideoPlatform}
													onChange={(e) =>
														setMonthlyVideoPlatform(e.target.value)
													}
													disabled={isSubmittingMonthly}
													className="w-full text-xs bg-white border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-600 font-medium"
												>
													<option value="Instagram Reel">Instagram Reel</option>
													<option value="TikTok">TikTok</option>
													<option value="YouTube Shorts">YouTube Shorts</option>
													<option value="Facebook">Facebook</option>
													<option value="Lainnya">Lainnya</option>
												</select>
											</div>
											<div>
												<Label className="text-xs font-semibold text-slate-700 block mb-1">
													Judul / Tema Video:
												</Label>
												<Input
													type="text"
													placeholder="Misal: Praktik Table Manner"
													value={monthlyVideoTitle}
													onChange={(e) => setMonthlyVideoTitle(e.target.value)}
													disabled={isSubmittingMonthly}
													className="text-xs bg-white"
												/>
											</div>
										</div>

										<div>
											<Label className="text-xs font-semibold text-slate-700 block mb-1">
												Tautan Video Konten (URL):
											</Label>
											<Input
												type="url"
												placeholder="https://www.instagram.com/reel/... atau https://vt.tiktok.com/..."
												value={monthlyVideoLink}
												onChange={(e) => setMonthlyVideoLink(e.target.value)}
												disabled={isSubmittingMonthly}
												className="text-xs bg-white"
												required
											/>
											<span className="text-[10px] text-slate-400 mt-1 block">
												*Pastikan tautan bersifat publik dan belum pernah
												disetorkan sebelumnya.
											</span>
										</div>

										<div className="flex gap-2 pt-1">
											<Button
												type="submit"
												size="sm"
												disabled={
													isSubmittingMonthly || !monthlyVideoLink.trim()
												}
												className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs"
											>
												{isSubmittingMonthly ? (
													<>
														<RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
														Menyimpan...
													</>
												) : (
													<>
														<Send className="w-3.5 h-3.5 mr-1.5" />
														{editingMonthlyVideoId
															? "Simpan Pembaruan"
															: "Kirim Video Bulanan"}
													</>
												)}
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													setIsEditingMonthly(false);
													resetMonthlyForm();
												}}
												className="text-xs text-slate-600"
											>
												Batal
											</Button>
										</div>
									</form>
								)}

								{/* Daftar Video Konten Bulanan Tersimpan */}
								<div className="space-y-3">
									<div className="flex items-center justify-between text-xs font-bold text-slate-700">
										<span>Riwayat Setoran Video Bulanan:</span>
										<Badge variant="secondary" className="text-[10px]">
											{monthlyVideosList.length} Video
										</Badge>
									</div>

									{monthlyVideosList.length === 0 ? (
										<div className="p-4 bg-white border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-400">
											Belum ada video konten bulanan yang disetorkan. Klik{" "}
											<b>Setor Video</b> di atas untuk mulai menyetor tugas
											bulanan.
										</div>
									) : (
										monthlyVideosList.map((item: any, idx: number) => {
											const isApproved = item.status === "DISETUJUI";
											const isPending = item.status === "MENUNGGU_REVIEW";
											const isRevision = item.status === "PERLU_REVISI";
											const canEditItem = !isApproved && !isCrmAcc;

											return (
												<div
													key={item.id || idx}
													className={`p-3.5 bg-white border rounded-xl text-xs space-y-2 transition-all ${
														isApproved
															? "border-emerald-200 shadow-2xs"
															: isRevision
																? "border-rose-200"
																: "border-slate-200"
													}`}
												>
													<div className="flex items-start justify-between gap-2">
														<div>
															<div className="flex items-center gap-1.5 flex-wrap">
																<Badge className="bg-purple-100 text-purple-900 hover:bg-purple-100 border-0 text-[10px] font-bold">
																	{item.month || "Bulanan"} {item.year || ""}
																</Badge>
																<Badge
																	variant="outline"
																	className="text-[10px] border-slate-200 text-slate-600"
																>
																	{item.platform || "Medsos"}
																</Badge>
															</div>
															<p className="font-bold text-slate-800 text-xs mt-1.5 line-clamp-1">
																{item.title || "Video Konten Bulanan"}
															</p>
														</div>

														<div className="flex items-center gap-1.5 shrink-0">
															{isApproved ? (
																<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-bold">
																	<CheckCircle2 className="w-3 h-3 mr-1" />{" "}
																	Disetujui
																</Badge>
															) : isPending ? (
																<Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] font-bold animate-pulse">
																	<Clock className="w-3 h-3 mr-1" /> Menunggu
																</Badge>
															) : (
																<Badge className="bg-rose-100 text-rose-800 border-0 text-[10px] font-bold">
																	<AlertCircle className="w-3 h-3 mr-1" />{" "}
																	Revisi
																</Badge>
															)}

															{/* Edit & Delete Action for this item */}
															{canEditItem && (
																<div className="flex items-center gap-1 ml-1">
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		onClick={() =>
																			handleStartEditMonthlyVideo(item)
																		}
																		className="h-6.5 px-2 text-[11px] text-blue-700 hover:bg-blue-50 font-semibold"
																		title="Edit data video ini"
																	>
																		<Pencil className="w-3 h-3 mr-0.5" /> Edit
																	</Button>

																	<AlertDialog>
																		<AlertDialogTrigger
																			render={
																				<Button
																					type="button"
																					variant="ghost"
																					size="sm"
																					disabled={
																						isDeletingMonthlyId === item.id
																					}
																					className="h-6.5 px-1.5 text-[11px] text-slate-400 hover:text-rose-600 hover:bg-rose-50"
																					title="Hapus video ini"
																				>
																					{isDeletingMonthlyId === item.id ? (
																						<RefreshCw className="w-3 h-3 animate-spin text-rose-500" />
																					) : (
																						<Trash2 className="w-3 h-3" />
																					)}
																				</Button>
																			}
																		/>
																		<AlertDialogContent className="bg-white border-slate-200 text-slate-800 rounded-2xl">
																			<AlertDialogTitle>
																				Hapus Video Konten Bulanan
																			</AlertDialogTitle>
																			<AlertDialogDescription className="text-slate-500 text-xs">
																				Apakah Anda yakin ingin menghapus video
																				konten bulan{" "}
																				<b>
																					{item.month} {item.year}
																				</b>
																				? Tindakan ini tidak dapat dibatalkan.
																			</AlertDialogDescription>
																			<div className="flex justify-end gap-3 mt-4">
																				<AlertDialogCancel className="bg-transparent border-slate-200 hover:bg-slate-50 text-slate-600 h-8 text-xs">
																					Batal
																				</AlertDialogCancel>
																				<AlertDialogAction
																					onClick={() =>
																						handleDeleteMonthlyVideo(item.id)
																					}
																					className="bg-rose-600 hover:bg-rose-700 text-white h-8 text-xs font-bold"
																				>
																					Ya, Hapus
																				</AlertDialogAction>
																			</div>
																		</AlertDialogContent>
																	</AlertDialog>
																</div>
															)}
														</div>
													</div>

													<div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
														<span className="text-slate-500 font-mono text-[11px] truncate flex-1">
															{item.videoLink}
														</span>
														<a
															href={item.videoLink}
															target="_blank"
															rel="noopener noreferrer"
															className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold shrink-0 underline text-xs"
														>
															<ExternalLink className="w-3.5 h-3.5" /> Buka
														</a>
													</div>

													{item.notes && (
														<div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800">
															<span className="font-bold block">
																Catatan Review:
															</span>
															{item.notes}
														</div>
													)}
												</div>
											);
										})
									)}
								</div>
							</div>
						</div>
					</div>

					<Separator />

					{/* Section 5: Kehadiran Praktik & Info Pra-Magang */}
					<div>
						<div className="flex items-center gap-2 mb-4">
							<Activity className="w-5 h-5 text-indigo-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Kehadiran Praktik &amp; Informasi Pra-Magang
							</h3>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Kehadiran Praktik */}
							<div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-between">
								<div>
									<div className="flex justify-between items-end mb-2">
										<h4 className="text-sm font-bold text-indigo-950">
											Persentase Kehadiran Praktik
										</h4>
										<span className="text-base font-extrabold text-indigo-700">
											{Math.round(attendancePercent)}%
										</span>
									</div>
									<Progress
										value={attendancePercent}
										className="h-2.5 bg-indigo-200/50 mb-3 rounded-full"
									/>
									<p className="text-xs text-indigo-700">
										Kehadiran: <span className="font-bold">{present} hari</span>{" "}
										dari total kewajiban{" "}
										<span className="font-bold">{total} hari</span>.
									</p>
								</div>
								<div className="mt-4 pt-3 border-t border-indigo-100/80 flex items-center justify-between text-xs text-indigo-900">
									<span>Status Absensi Praktik:</span>
									<Badge
										className={
											data?.practiceAttendance
												? "bg-emerald-100 text-emerald-800 border-0"
												: "bg-amber-100 text-amber-800 border-0"
										}
									>
										{data?.practiceAttendance
											? "Memenuhi Target"
											: "Belum Memenuhi"}
									</Badge>
								</div>
							</div>

							{/* Data Pra-Magang */}
							<div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
								<h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
									<Briefcase className="w-4 h-4 text-blue-600" />
									Data Penempatan Pra-Magang
								</h4>
								<div className="space-y-2 text-xs">
									<div className="flex justify-between">
										<span className="text-slate-500">Industri / Mitra:</span>
										<span className="font-semibold text-slate-800 text-right">
											{data?.pramagangIndustry || "Belum ditentukan"}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-slate-500">Periode Pra-Magang:</span>
										<span className="font-semibold text-slate-800 text-right">
											{data?.pramagangStartDate
												? formatDate(data.pramagangStartDate)
												: "-"}{" "}
											s/d{" "}
											{data?.pramagangEndDate
												? formatDate(data.pramagangEndDate)
												: "-"}
										</span>
									</div>
									<div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
										<span className="text-slate-500">
											Izin Belajar (Study Permit):
										</span>
										<Badge
											className={
												data?.hasStudyPermit
													? "bg-emerald-100 text-emerald-800 border-0 text-[10px]"
													: "bg-slate-100 text-slate-600 border-0 text-[10px]"
											}
										>
											{data?.hasStudyPermit ? "Telah Terbit" : "Belum Ada"}
										</Badge>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Section 6: Catatan Kasus */}
					<div className="pt-2 border-t border-slate-100">
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
							<MessageSquare className="w-4 h-4 text-slate-600" />
							Catatan Kasus &amp; Pendampingan CRM
						</h3>
						{data?.hasActiveCase ? (
							<div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
								<div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
									<AlertCircle className="w-4 h-4 text-amber-600" />
									Terdapat Catatan Kasus Aktif
								</div>
								<p className="text-xs text-amber-800 leading-relaxed whitespace-pre-wrap">
									{data?.caseNotes ||
										"Tidak ada detail catatan tambahan dari tim CRM."}
								</p>
							</div>
						) : (
							<div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
								<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
								<p className="text-xs font-semibold text-emerald-800">
									Status Catatan Bersih (Tidak ada catatan kasus aktif atau
									pelanggaran).
								</p>
							</div>
						)}
					</div>

					{/* Section 7: Log Komunikasi */}
					{data?.logs && data.logs.length > 0 && (
						<div className="pt-2 border-t border-slate-100">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
								<HeartHandshake className="w-4 h-4 text-purple-600" />
								Riwayat Sesi Komunikasi CRM
							</h3>
							<div className="space-y-2.5">
								{data.logs.map((log: any) => (
									<div
										key={log.id}
										className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
									>
										<div>
											<span className="font-semibold text-slate-800 block">
												{log.topic || "Sesi Komunikasi Monitoring"}
											</span>
											<span className="text-slate-500 mt-0.5 block">
												Media: {log.media || "Tatap Muka"} • Lokasi:{" "}
												{log.location || "Kampus / Online"}
											</span>
										</div>
										<span className="text-slate-400 font-medium shrink-0 ml-3">
											{formatDate(log.createdAt)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
