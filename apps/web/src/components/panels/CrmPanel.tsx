"use client";

import {
	CheckCircle,
	Clock,
	DollarSign,
	Eye,
	FileText,
	Globe,
	Loader2,
	Trash2,
	UploadCloud,
	User,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";
import { formatRupiah } from "@/utils/format";

interface DocFile {
	id: number;
	documentKey: string;
	fileName: string;
	fileUrl: string;
	isVerified: boolean;
	uploadedAt: string;
	uploadedByUser?: { fullName: string } | null;
	verifiedByUser?: { fullName: string } | null;
}

interface CrmPanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function CrmPanel({ studentId, onUpdate }: CrmPanelProps) {
	const { user, token } = useAuthStore();
	const isCrmAdmin = user?.role === "crm" || user?.role === "superadmin";
	const isSuperadmin = user?.role === "superadmin";
	const canEdit = isCrmAdmin;

	const [isSavingLog, setIsSavingLog] = useState(false);
	const [logModalOpen, setLogModalOpen] = useState(false);
	const [newLog, setNewLog] = useState({
		startTime: "",
		endTime: "",
		media: "",
		location: "",
		topic: "",
		logText: "",
	});
	const [agreements, setAgreements] = useState<string[]>([]);
	const [followUps, setFollowUps] = useState<
		{ task: string; date: string; assignee: string; status: string }[]
	>([]);

	const [crmState, setCrmState] = useState<{
		crm: any;
		logs: any[];
		finance?: any;
		pmb?: any;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [loadingItem, setLoadingItem] = useState<string | null>(null);

	const crm = crmState?.crm;
	const logs = crmState?.logs || [];

	const [attendancePresent, setAttendancePresent] = useState<number | string>(
		0,
	);
	const [attendanceTotal, setAttendanceTotal] = useState<number | string>(0);

	const [localChecks, setLocalChecks] = useState({
		isMonitoringParent: false,
		isMonitoringIndustry: false,
		isVocabComplete: false,
		practiceAttendance: false,
		isOdsReport: false,
		odsDocumentation: false,
		isPrammagangReport: false,
		isPrammagangDocumentation: false,
	});
	const [hasActiveCase, setHasActiveCase] = useState(false);
	const [caseNotes, setCaseNotes] = useState("");

	const [documents, setDocuments] = useState<Record<string, DocFile[]>>({});
	const [uploadingKey, setUploadingKey] = useState<string | null>(null);
	const [viewingDocId, setViewingDocId] = useState<number | null>(null);

	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const [showAllLogs, setShowAllLogs] = useState(false);
	const [isDeleteDocOpen, setIsDeleteDocOpen] = useState(false);
	const [selectedDocToDelete, setSelectedDocToDelete] = useState<number | null>(null);

	const fetchCrmData = async () => {
		try {
			const { data, error } =
				await api.students[studentId.toString()].crm.get();
			if (!error && data?.success) {
				setCrmState(data.data as any);
			}
		} catch (error) {
			console.error("Failed to fetch CRM data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchDocuments = async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/documents`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success) {
					setDocuments(json.data);
				}
			}
		} catch (error) {
			console.error("Failed to fetch CRM documents", error);
		}
	};

	useEffect(() => {
		fetchCrmData();
		fetchDocuments();
	}, [studentId, token]);

	useEffect(() => {
		if (crm) {
			setLocalChecks({
				isMonitoringParent: !!crm.isMonitoringParent,
				isMonitoringIndustry: !!crm.isMonitoringIndustry,
				isVocabComplete: !!crm.isVocabComplete,
				practiceAttendance: !!crm.practiceAttendance,
				isOdsReport: !!crm.isOdsReport,
				odsDocumentation: !!crm.odsDocumentation,
				isPrammagangReport: !!crm.isPrammagangReport,
				isPrammagangDocumentation: !!crm.isPrammagangDocumentation,
			});
			setHasActiveCase(!!crm.hasActiveCase);
			setCaseNotes(crm.caseNotes || "");
			setAttendancePresent(crm.practiceDaysPresent || 0);
			setAttendanceTotal(crm.practiceDaysTotal || 0);
		}
	}, [crm]);

	const handleShowAllLogs = async () => {
		try {
			const { data, error } =
				await api.students[studentId.toString()].crm.logs.get();
			if (!error && data?.success) {
				setCrmState((prev) =>
					prev ? { ...prev, logs: data.data as any } : null,
				);
				setShowAllLogs(true);
			} else {
				toast.error("Gagal mengambil seluruh log komunikasi.");
			}
		} catch (error) {
			console.error("Failed to fetch all logs:", error);
			toast.error("Gagal mengambil seluruh log komunikasi.");
		}
	};

	const handleCheckboxChange = async (id: string, checked: boolean) => {
		if (!canEdit) return;

		const prevState = { ...localChecks };
		setLocalChecks((prev) => ({ ...prev, [id]: checked }));
		setLoadingItem(id);

		const payload = { [id]: checked };

		try {
			const { error } =
				await api.students[studentId.toString()].crm.patch(payload);

			if (error) {
				throw new Error("Gagal menyimpan perubahan");
			}

			toast.success("Berhasil disimpan");
			fetchCrmData();
			onUpdate();
		} catch (error) {
			setLocalChecks(prevState);
			toast.error("Gagal menyimpan perubahan");
		} finally {
			setLoadingItem(null);
		}
	};

	const handleCaseSave = async () => {
		if (!canEdit) return;
		try {
			const { error } = await api.students[studentId.toString()].crm.patch({
				hasActiveCase,
				caseNotes,
			});
			if (error) throw new Error("Gagal menyimpan data case");
			toast.success("Catatan kasus berhasil disimpan");
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Gagal menyimpan catatan kasus");
		}
	};

	const handleAttendanceSave = async () => {
		if (!canEdit) return;
		const payload = {
			practiceDaysPresent: Number(attendancePresent) || 0,
			practiceDaysTotal: Number(attendanceTotal) || 0,
		};

		try {
			const { error } =
				await api.students[studentId.toString()].crm.patch(payload);

			if (error) {
				throw new Error("Gagal menyimpan kehadiran");
			}

			toast.success("Data kehadiran berhasil disimpan");
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Gagal menyimpan kehadiran");
		}
	};

	const handleFileUpload = async (
		documentKey: string,
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploadingKey(documentKey);
		const formData = new FormData();
		formData.append("file", file);

		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/upload/${documentKey}`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
					body: formData,
				},
			);
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success("File berhasil diupload");
				fetchDocuments();
			} else {
				toast.error(json.message || "Gagal mengupload file");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
		setUploadingKey(null);

		// Reset file input
		e.target.value = "";
	};

	const handleViewDocument = (docId: number) => {
		window.open(
			`/api/students/${studentId}/crm/documents/${docId}/download`,
			"_blank",
		);
	};

	const handleVerifyDocument = async (docId: number) => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/documents/${docId}/verify`,
				{
					method: "PATCH",
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (res.ok) {
				toast.success("Dokumen ditandai terverifikasi");
				fetchDocuments();
			} else {
				toast.error("Gagal memverifikasi dokumen");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
	};

	const confirmDeleteDocument = (docId: number) => {
		setSelectedDocToDelete(docId);
		setIsDeleteDocOpen(true);
	};

	const handleDeleteDocument = async () => {
		if (!selectedDocToDelete) return;

		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/documents/${selectedDocToDelete}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (res.ok) {
				toast.success("Dokumen berhasil dihapus");
				setIsDeleteDocOpen(false);
				setSelectedDocToDelete(null);
				fetchDocuments();
			} else {
				toast.error("Gagal menghapus dokumen");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
	};

	const handleSaveLog = async () => {
		if (!newLog.logText.trim() || !canEdit) return;
		setIsSavingLog(true);

		try {
			const payload = {
				...newLog,
				agreements: agreements.filter((a) => a.trim() !== ""),
				followUps: followUps.filter((f) => f.task.trim() !== ""),
			};

			const { error } =
				await api.students[studentId.toString()].crm.log.post(payload);

			if (error) {
				throw new Error("Gagal menambah log");
			}

			toast.success("Log komunikasi berhasil ditambahkan");
			setLogModalOpen(false);
			setNewLog({
				startTime: "",
				endTime: "",
				media: "",
				location: "",
				topic: "",
				logText: "",
			});
			setAgreements([]);
			setFollowUps([]);
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Gagal menambah log");
		} finally {
			setIsSavingLog(false);
		}
	};

	const handleAddAgreement = () => setAgreements([...agreements, ""]);
	const handleUpdateAgreement = (index: number, val: string) => {
		const newArr = [...agreements];
		newArr[index] = val;
		setAgreements(newArr);
	};
	const handleRemoveAgreement = (index: number) =>
		setAgreements(agreements.filter((_, i) => i !== index));

	const handleAddFollowUp = () =>
		setFollowUps([
			...followUps,
			{ task: "", date: "", assignee: "", status: "Proses" },
		]);
	const handleUpdateFollowUp = (index: number, field: string, val: string) => {
		const newArr = [...followUps];
		newArr[index] = { ...newArr[index], [field]: val };
		setFollowUps(newArr);
	};
	const handleRemoveFollowUp = (index: number) =>
		setFollowUps(followUps.filter((_, i) => i !== index));

	const handleAcc = async () => {
		if (!isCrmAdmin) return;
		try {
			const { error } = await api.students[studentId.toString()].crm.acc.post();

			if (error) {
				throw new Error("Gagal memberikan ACC");
			}

			toast.success("ACC CRM berhasil dicatat");
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Gagal memberikan ACC");
		}
	};

	const handleCancelAcc = async () => {
		if (!isCrmAdmin) return;
		setIsSavingLog(true);
		try {
			const { error } =
				await api.students[studentId.toString()].crm.acc.delete();
			if (error) throw new Error("Gagal membatalkan ACC");
			toast.success("ACC CRM berhasil dibatalkan");
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Gagal membatalkan ACC");
		} finally {
			setIsSavingLog(false);
		}
	};

	const CHECKLIST_CATEGORIES = [
		{
			category: "Modul Monitoring",
			icon: "📡",
			items: [
				{
					id: "isMonitoringParent",
					label: "Monitoring Orang Tua",
					desc: "Catatan komunikasi orang tua/wali mahasiswa",
					docKey: "parent_follow_up",
					checked: localChecks.isMonitoringParent,
				},
				{
					id: "isMonitoringIndustry",
					label: "Monitoring Industri",
					desc: "Catatan kesiapan dan penyesuaian dengan industri",
					docKey: "industry_monitoring",
					checked: localChecks.isMonitoringIndustry,
				},
			],
		},
		{
			category: "Modul Vocab",
			icon: "📖",
			items: [
				{
					id: "isVocabComplete",
					label: "Buku Kendali Vocab",
					desc: "Penguasaan kosakata/bahasa asing",
					docKey: "vocab_book",
					checked: localChecks.isVocabComplete,
				},
			],
		},
		{
			category: "Modul Kehadiran",
			icon: "📅",
			items: [
				{
					id: "practiceAttendance",
					label: "Rekap Kehadiran Praktik",
					desc: "Catatan kehadiran kelas harian",
					docKey: "practice_attendance",
					checked: localChecks.practiceAttendance,
				},
			],
		},
		{
			category: "Modul ODS (One Day Service)",
			icon: "🏫",
			items: [
				{
					id: "isOdsReport",
					label: "Laporan ODS",
					desc: "Laporan pelaksanaan kegiatan ODS",
					docKey: "ods_report",
					checked: localChecks.isOdsReport,
				},
				{
					id: "odsDocumentation",
					label: "Dokumentasi ODS",
					desc: "Foto/video kegiatan ODS",
					docKey: "ods_documentation",
					checked: localChecks.odsDocumentation,
				},
			],
		},
		{
			category: "Modul Pramagang",
			icon: "💼",
			items: [
				{
					id: "isPrammagangReport",
					label: "Laporan Pramagang",
					desc: "Laporan pelaksanaan kegiatan Pramagang",
					docKey: "pramagang_report",
					checked: localChecks.isPrammagangReport,
				},
				{
					id: "isPrammagangDocumentation",
					label: "Dokumentasi Pramagang",
					desc: "Foto/video kegiatan Pramagang",
					docKey: "pramagang_documentation",
					checked: localChecks.isPrammagangDocumentation,
				},
			],
		},
	];

	const ALL_CHECKLIST_IDS = [
		"isMonitoringParent",
		"isMonitoringIndustry",
		"isVocabComplete",
		"practiceAttendance",
		"isOdsReport",
		"odsDocumentation",
		"isPrammagangReport",
		"isPrammagangDocumentation",
	];

	const completedCount = ALL_CHECKLIST_IDS.filter(
		(id) => localChecks[id as keyof typeof localChecks],
	).length;
	const totalChecks = 8;

	let statusBadge = (
		<Badge className="bg-rose-50 text-rose-600 border-rose-200">
			🔴 TIDAK AMAN
		</Badge>
	);
	if (completedCount === totalChecks) {
		statusBadge = (
			<Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
				🟢 AMAN
			</Badge>
		);
	} else if (completedCount >= 4) {
		statusBadge = (
			<Badge className="bg-amber-50 text-amber-600 border-amber-200">
				🟡 PERLU PERHATIAN
			</Badge>
		);
	}

	const attTotal = Number(attendanceTotal) || 0;
	const attPresent = Number(attendancePresent) || 0;
	const attendancePercentage =
		attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-48 text-slate-400">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	return (
		<TooltipProvider>
			<div className="space-y-6">
				<div>
					<div className="border-b border-slate-200 pb-4 mb-6">
						<div className="flex justify-between items-center">
							<h2 className="text-slate-800 text-lg font-bold flex items-center gap-2">
								<span className="text-xl">📞</span> CRM — Customer Relationship
								Management
								<span className="ml-2 text-sm font-normal text-slate-500">
									[{completedCount}/{totalChecks}]
								</span>
							</h2>
							<div className="flex items-center gap-3">
								{isSuperadmin && !isCrmAdmin && (
									<Badge
										variant="outline"
										className="text-slate-400 border-slate-300"
									>
										👁 Mode Lihat Saja
									</Badge>
								)}
								<Badge
									variant="outline"
									className="border-slate-200 text-slate-500 bg-white"
								>
									Dikelola oleh: Admin CRM
								</Badge>
								{statusBadge}
							</div>
						</div>
					</div>
				</div>

				<Tabs defaultValue="registrasi-awal" className="w-full">
					<TabsList className="mb-6 grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
						<TabsTrigger
							value="registrasi-awal"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<span>💳</span> 1. Monitoring Registrasi Awal
						</TabsTrigger>
						<TabsTrigger
							value="modul-crm"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<span>📞</span> 2. Monitoring & Modul Evaluasi CRM
						</TabsTrigger>
					</TabsList>

					<TabsContent value="registrasi-awal" className="space-y-6">
						{/* Status Pelunasan Registrasi Awal (Finance Real-Time) */}
						<Card className="border border-slate-200 shadow-sm">
							<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
								<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
									<DollarSign className="w-4 h-4 text-emerald-600" />
									Status Pelunasan Registrasi Awal (Sinkronisasi Finance)
								</CardTitle>
								{crmState?.finance?.registrasiStatus ? (
									<Badge className="bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold gap-1">
										<CheckCircle className="w-3.5 h-3.5" />
										LUNAS REGISTRASI
									</Badge>
								) : (
									<Badge
										variant="destructive"
										className="text-xs font-bold gap-1"
									>
										<XCircle className="w-3.5 h-3.5" />
										BELUM LUNAS
									</Badge>
								)}
							</CardHeader>
							<CardContent className="p-5 space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
										<span className="text-[11px] font-semibold text-slate-500 block uppercase">
											Nominal Pembayaran Registrasi
										</span>
										<span className="text-base font-bold text-slate-800 mt-1 block">
											{formatRupiah(crmState?.finance?.registrasiNominal || 0)}
										</span>
									</div>
									<div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
										<span className="text-[11px] font-semibold text-slate-500 block uppercase">
											Tanggal Pembayaran Registrasi
										</span>
										<span className="text-sm font-bold text-slate-800 mt-1 block">
											{crmState?.finance?.registrasiPaidDate
												? new Date(
														crmState.finance.registrasiPaidDate,
													).toLocaleDateString("id-ID", {
														day: "numeric",
														month: "long",
														year: "numeric",
													})
												: "Belum dibayar"}
										</span>
									</div>
									<div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
										<span className="text-[11px] font-semibold text-slate-500 block uppercase">
											Bukti Pembayaran Registrasi (PDF)
										</span>
										{crmState?.finance?.registrasiBuktiBayarUrl ? (
											<a
												href={`${API_URL}/uploads/${crmState.finance.registrasiBuktiBayarUrl}`}
												target="_blank"
												rel="noreferrer"
												className="inline-flex items-center gap-1.5 text-xs text-[#0517B0] font-bold hover:underline mt-1"
											>
												<Eye className="w-4 h-4" />
												Lihat Bukti Bayar PDF
											</a>
										) : (
											<span className="text-xs text-slate-400 font-medium mt-1">
												Belum ada bukti bayar PDF
											</span>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Checklist Berkas & ACC PMB */}
						<Card className="border border-slate-200 shadow-sm">
							<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
								<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
									<FileText className="w-4 h-4 text-indigo-600" />
									Checklist Berkas & ACC PMB (Registrasi Awal)
								</CardTitle>
								{crmState?.pmb?.isAcc ? (
									<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-bold">
										🟢 ACC PMB: {crmState?.pmb?.accBy?.fullName || "Admin PMB"}
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-slate-500 border-slate-300 text-xs"
									>
										🟡 Menunggu ACC PMB
									</Badge>
								)}
							</CardHeader>
							<CardContent className="p-5 space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
									<div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
										<div>
											<span className="text-xs font-bold text-slate-800 block">
												Formulir Masuk
											</span>
											<span className="text-[11px] text-slate-500">
												Pendaftaran Awal
											</span>
										</div>
										{crmState?.pmb?.formReceived ? (
											<Badge className="bg-emerald-500 text-white text-[10px]">
												Selesai
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-400 text-[10px]"
											>
												Belum
											</Badge>
										)}
									</div>

									<div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
										<div>
											<span className="text-xs font-bold text-slate-800 block">
												Berkas Lengkap
											</span>
											<span className="text-[11px] text-slate-500">
												Fisik Berkas
											</span>
										</div>
										{crmState?.pmb?.documentsComplete ? (
											<Badge className="bg-emerald-500 text-white text-[10px]">
												Selesai
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-400 text-[10px]"
											>
												Belum
											</Badge>
										)}
									</div>

									<div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
										<div>
											<span className="text-xs font-bold text-slate-800 block">
												Input Data Awal
											</span>
											<span className="text-[11px] text-slate-500">
												Entri Sistem
											</span>
										</div>
										{crmState?.pmb?.dataInputted ? (
											<Badge className="bg-emerald-500 text-white text-[10px]">
												Selesai
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-400 text-[10px]"
											>
												Belum
											</Badge>
										)}
									</div>

									<div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
										<div>
											<span className="text-xs font-bold text-slate-800 block">
												Follow Up Awal
											</span>
											<span className="text-[11px] text-slate-500">
												Kontak Awal
											</span>
										</div>
										{crmState?.pmb?.initialFollowUp ? (
											<Badge className="bg-emerald-500 text-white text-[10px]">
												Selesai
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-400 text-[10px]"
											>
												Belum
											</Badge>
										)}
									</div>
								</div>

								{/* Data Akuisisi & Referral info */}
								<div className="pt-3 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
									<div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
										<span className="text-[11px] font-bold text-indigo-900 block">
											Jalur Rekomendasi / Referral
										</span>
										<span className="text-xs font-semibold text-indigo-700 mt-0.5 block">
											{crmState?.pmb?.rekomendasi || "-"}
										</span>
									</div>
									<div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
										<span className="text-[11px] font-bold text-indigo-900 block">
											Tim Visit / Sosialisasi
										</span>
										<span className="text-xs font-semibold text-indigo-700 mt-0.5 block">
											{crmState?.pmb?.timVisit ||
												crmState?.pmb?.timSosialisasi ||
												"-"}
										</span>
									</div>
									<div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
										<span className="text-[11px] font-bold text-indigo-900 block">
											RO Referral / Koordinator
										</span>
										<span className="text-xs font-semibold text-indigo-700 mt-0.5 block">
											{crmState?.pmb?.roReferral ||
												crmState?.pmb?.koordinator ||
												"-"}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="modul-crm" className="space-y-6">
						{CHECKLIST_CATEGORIES.map((category, catIdx) => (
							<div
								key={catIdx}
								className="mb-8 last:mb-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
							>
								<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
									<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
										<span>{category.icon}</span>
										{category.category}
									</h3>
								</div>
								<div className="p-5 space-y-4">
									{category.items.map((item) => (
										<div
											key={item.id}
											className="flex flex-col rounded-lg border bg-white overflow-hidden border-slate-200"
										>
											<div
												className={`flex items-center gap-4 p-4 transition-colors ${
													item.checked
														? "bg-emerald-50 border-b border-emerald-200"
														: "bg-slate-50 border-b border-slate-200"
												}`}
											>
												<Checkbox
													id={item.id}
													checked={item.checked}
													onCheckedChange={(c) =>
														handleCheckboxChange(item.id, c === true)
													}
													disabled={!canEdit || loadingItem === item.id}
													className={`w-6 h-6 rounded-md ${
														item.checked
															? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
															: ""
													}`}
												/>
												<label
													htmlFor={item.id}
													className="flex-1 cursor-pointer block"
												>
													<div
														className={`text-base font-semibold block ${
															item.checked
																? "text-emerald-900"
																: "text-slate-700"
														}`}
													>
														{item.label}
														{loadingItem === item.id && (
															<Loader2 className="w-3 h-3 text-emerald-600 animate-spin ml-2 inline" />
														)}
													</div>
													<p
														className={`text-sm mt-1 ${
															item.checked
																? "text-emerald-700"
																: "text-slate-500"
														}`}
													>
														{item.desc}
													</p>
												</label>
												<div>
													{item.checked ? (
														<CheckCircle className="w-6 h-6 text-emerald-500" />
													) : (
														<div className="w-6 h-6 rounded-full border-2 border-slate-300" />
													)}
												</div>
											</div>

											{/* Sub-component for Kehadiran Praktik */}
											{item.id === "practiceAttendance" && item.checked && (
												<div className="p-4 bg-white border-b border-slate-100">
													<div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
														<div>
															<label className="text-xs font-semibold text-slate-500 mb-1 block">
																Hadir
															</label>
															<Input
																type="number"
																value={attendancePresent}
																onChange={(e) =>
																	setAttendancePresent(
																		e.target.value === ""
																			? ""
																			: Number(e.target.value),
																	)
																}
																disabled={!canEdit}
																className="w-24 text-center font-bold text-slate-700"
															/>
														</div>
														<div className="text-slate-400 font-medium pb-2">
															dari
														</div>
														<div>
															<label className="text-xs font-semibold text-slate-500 mb-1 block">
																Total Hari
															</label>
															<Input
																type="number"
																value={attendanceTotal}
																onChange={(e) =>
																	setAttendanceTotal(
																		e.target.value === ""
																			? ""
																			: Number(e.target.value),
																	)
																}
																disabled={!canEdit}
																className="w-24 text-center font-bold text-slate-700"
															/>
														</div>
														{canEdit && (
															<Button
																variant="secondary"
																onClick={handleAttendanceSave}
																className="ml-auto text-blue-700 bg-blue-50 hover:bg-blue-100"
															>
																Simpan
															</Button>
														)}
													</div>
													<div className="flex items-center gap-3 mt-2">
														<span className="text-sm font-semibold text-slate-600 min-w-[100px]">
															Persentase: {attendancePercentage}%
														</span>
														<Progress
															value={attendancePercentage}
															className="h-2.5 bg-slate-100 flex-1"
															indicatorClassName="bg-blue-600"
														/>
													</div>
												</div>
											)}

											{/* Area Dokumen CRM (sekarang selalu tampil di bawah checklist) */}
											<div className="p-4 bg-white border-t border-slate-100 last:border-0">
												<div className="flex items-center justify-between mb-2">
													<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
														Lampiran Dokumen CRM
													</span>
												</div>
												<DocumentUpload
													studentId={studentId}
													panel="crm"
													documentKey={item.docKey}
													canEdit={canEdit}
												/>
											</div>
										</div>
									))}
								</div>
							</div>
						))}

						{/* Section Case/Masalah */}
						<div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
							<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
									<span className="text-xl">⚠️</span> CASE / MASALAH
								</h3>
							</div>
							<div className="p-5">
								<div className="flex items-center gap-3 mb-4">
									<Checkbox
										id="hasActiveCase"
										checked={hasActiveCase}
										onCheckedChange={(checked) =>
											setHasActiveCase(checked === true)
										}
										disabled={!canEdit}
										className="w-5 h-5"
									/>
									<label
										htmlFor="hasActiveCase"
										className="text-sm font-semibold text-slate-700 cursor-pointer"
									>
										Tandai mahasiswa memiliki masalah (Active Case)
									</label>
								</div>
								{hasActiveCase && (
									<div className="mt-3">
										<label className="text-xs font-semibold text-slate-500 mb-2 block">
											Catatan Masalah (Kendala)
										</label>
										<Textarea
											value={caseNotes}
											onChange={(e) => setCaseNotes(e.target.value)}
											disabled={!canEdit}
											placeholder="Tuliskan kendala yang dihadapi mahasiswa..."
											className="min-h-[100px] mb-3"
										/>
									</div>
								)}
								{canEdit && (
									<Button onClick={handleCaseSave} className="w-full sm:w-auto">
										Simpan Catatan Kasus
									</Button>
								)}
							</div>
						</div>

						<div className="mt-8 border-t border-slate-200 pt-6">
							<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
								LOG KOMUNIKASI ORANG TUA
							</h3>

							{canEdit && !crm?.isAcc && (
								<div className="flex justify-end mb-6">
									<Button
										onClick={() => setLogModalOpen(true)}
										className="bg-[#0517B0] hover:bg-blue-800 text-white"
									>
										+ Tambah Log Komunikasi
									</Button>
									<Dialog open={logModalOpen} onOpenChange={setLogModalOpen}>
										<DialogContent className="w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-50 p-0 border-0 shadow-2xl">
											<div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
												<DialogTitle className="text-xl font-bold text-[#0517B0] flex items-center gap-2">
													<FileText className="w-5 h-5" /> Tambah Notulensi
													Komunikasi
												</DialogTitle>
											</div>

											<div className="p-6 space-y-6">
												{/* Info Percakapan */}
												<Card className="border-slate-200 shadow-sm">
													<CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
														<CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
															<Clock className="w-4 h-4 text-blue-500" />{" "}
															Informasi Percakapan
														</CardTitle>
													</CardHeader>
													<CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
														<div className="space-y-1.5">
															<label className="text-sm font-semibold text-slate-700">
																Media Komunikasi
															</label>
															<Select
																value={newLog.media}
																onValueChange={(val) =>
																	setNewLog({ ...newLog, media: val || "" })
																}
															>
																<SelectTrigger className="bg-white border-slate-200 shadow-sm h-10">
																	<SelectValue placeholder="Pilih Media Komunikasi" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="WhatsApp">
																		WhatsApp
																	</SelectItem>
																	<SelectItem value="Telepon">
																		Telepon
																	</SelectItem>
																	<SelectItem value="Email">Email</SelectItem>
																	<SelectItem value="Tatap Muka">
																		Tatap Muka
																	</SelectItem>
																	<SelectItem value="Zoom/Google Meet">
																		Zoom/Google Meet
																	</SelectItem>
																	<SelectItem value="Lainnya">
																		Lainnya
																	</SelectItem>
																</SelectContent>
															</Select>
														</div>
														<div className="space-y-1.5">
															<label className="text-sm font-semibold text-slate-700">
																Topik Pembahasan
															</label>
															<Select
																value={newLog.topic}
																onValueChange={(val) =>
																	setNewLog({ ...newLog, topic: val || "" })
																}
															>
																<SelectTrigger className="bg-white border-slate-200 shadow-sm h-10">
																	<SelectValue placeholder="Pilih Topik Utama" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="Akademik">
																		Akademik
																	</SelectItem>
																	<SelectItem value="Kehadiran">
																		Kehadiran
																	</SelectItem>
																	<SelectItem value="Pelanggaran Disiplin">
																		Pelanggaran Disiplin
																	</SelectItem>
																	<SelectItem value="Konseling">
																		Konseling
																	</SelectItem>
																	<SelectItem value="Lainnya">
																		Lainnya
																	</SelectItem>
																</SelectContent>
															</Select>
														</div>
														<div className="grid grid-cols-2 gap-4">
															<div className="space-y-1.5">
																<label className="text-sm font-semibold text-slate-700">
																	Jam Mulai
																</label>
																<Input
																	type="time"
																	value={newLog.startTime}
																	onChange={(e) =>
																		setNewLog({
																			...newLog,
																			startTime: e.target.value,
																		})
																	}
																	className="bg-white border-slate-200 shadow-sm h-10"
																/>
															</div>
															<div className="space-y-1.5">
																<label className="text-sm font-semibold text-slate-700">
																	Jam Selesai
																</label>
																<Input
																	type="time"
																	value={newLog.endTime}
																	onChange={(e) =>
																		setNewLog({
																			...newLog,
																			endTime: e.target.value,
																		})
																	}
																	className="bg-white border-slate-200 shadow-sm h-10"
																/>
															</div>
														</div>
														{newLog.media === "Tatap Muka" && (
															<div className="space-y-1.5">
																<label className="text-sm font-semibold text-slate-700">
																	Lokasi Pertemuan
																</label>
																<Input
																	value={newLog.location}
																	onChange={(e) =>
																		setNewLog({
																			...newLog,
																			location: e.target.value,
																		})
																	}
																	placeholder="Contoh: Ruang Rapat Akademik"
																	className="bg-white border-slate-200 shadow-sm h-10"
																/>
															</div>
														)}
													</CardContent>
												</Card>

												{/* Ringkasan */}
												<Card className="border-slate-200 shadow-sm">
													<CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
														<CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
															<FileText className="w-4 h-4 text-purple-500" />{" "}
															Ringkasan Percakapan (Notulensi)
														</CardTitle>
													</CardHeader>
													<CardContent className="pt-4">
														<Textarea
															placeholder="Tuliskan intisari atau ringkasan percakapan secara detail dan jelas..."
															value={newLog.logText}
															onChange={(e) =>
																setNewLog({
																	...newLog,
																	logText: e.target.value,
																})
															}
															className="min-h-[120px] bg-white border-slate-200 shadow-sm focus-visible:ring-[#0517B0] text-sm leading-relaxed"
														/>
													</CardContent>
												</Card>

												{/* Hasil Kesepakatan */}
												<Card className="border-slate-200 shadow-sm overflow-hidden">
													<CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4 flex flex-row items-center justify-between space-y-0">
														<CardTitle className="text-base font-bold text-emerald-800 flex items-center gap-2">
															<CheckCircle className="w-4 h-4" /> Hasil
															Kesepakatan
														</CardTitle>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={handleAddAgreement}
															className="h-8 bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
														>
															+ Tambah Kesepakatan
														</Button>
													</CardHeader>
													<CardContent className="pt-4 bg-white">
														{agreements.length === 0 ? (
															<p className="text-sm text-slate-400 italic text-center py-4 bg-slate-50 rounded border border-dashed border-slate-200">
																Belum ada kesepakatan yang dicatat.
															</p>
														) : (
															<div className="space-y-3">
																{agreements.map((agr, idx) => (
																	<div
																		key={idx}
																		className="flex gap-3 items-center group"
																	>
																		<div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
																			<CheckCircle className="w-4 h-4" />
																		</div>
																		<Input
																			value={agr}
																			onChange={(e) =>
																				handleUpdateAgreement(
																					idx,
																					e.target.value,
																				)
																			}
																			placeholder="Tulis rincian kesepakatan di sini..."
																			className="flex-1 h-10 border-slate-200 focus-visible:ring-emerald-500 shadow-sm"
																		/>
																		<Button
																			type="button"
																			variant="ghost"
																			size="icon"
																			onClick={() => handleRemoveAgreement(idx)}
																			className="h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
																		>
																			<Trash2 className="w-4 h-4" />
																		</Button>
																	</div>
																))}
															</div>
														)}
													</CardContent>
												</Card>

												{/* Tindak Lanjut */}
												<Card className="border-slate-200 shadow-sm overflow-hidden">
													<CardHeader className="bg-amber-50/50 border-b border-amber-100 pb-4 flex flex-row items-center justify-between space-y-0">
														<CardTitle className="text-base font-bold text-amber-800 flex items-center gap-2">
															<User className="w-4 h-4" /> Tindak Lanjut (Follow
															Up)
														</CardTitle>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={handleAddFollowUp}
															className="h-8 bg-white border-amber-200 text-amber-700 hover:bg-amber-50"
														>
															+ Tambah Penugasan
														</Button>
													</CardHeader>
													<CardContent className="pt-4 bg-white">
														{followUps.length === 0 ? (
															<p className="text-sm text-slate-400 italic text-center py-4 bg-slate-50 rounded border border-dashed border-slate-200">
																Belum ada penugasan atau tindak lanjut.
															</p>
														) : (
															<div className="space-y-4">
																{followUps.map((fu, idx) => (
																	<div
																		key={idx}
																		className="grid grid-cols-12 gap-4 bg-slate-50/80 p-4 rounded-lg border border-slate-200 relative group"
																	>
																		<div className="col-span-12 md:col-span-5 space-y-1.5">
																			<label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
																				Tugas / Target
																			</label>
																			<Input
																				value={fu.task}
																				onChange={(e) =>
																					handleUpdateFollowUp(
																						idx,
																						"task",
																						e.target.value,
																					)
																				}
																				placeholder="Deskripsi tugas..."
																				className="h-9 bg-white border-slate-200 shadow-sm"
																			/>
																		</div>
																		<div className="col-span-6 md:col-span-3 space-y-1.5">
																			<label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
																				Tgl. Target
																			</label>
																			<Input
																				type="date"
																				value={fu.date}
																				onChange={(e) =>
																					handleUpdateFollowUp(
																						idx,
																						"date",
																						e.target.value,
																					)
																				}
																				className="h-9 bg-white border-slate-200 shadow-sm"
																			/>
																		</div>
																		<div className="col-span-6 md:col-span-3 space-y-1.5">
																			<label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
																				Penanggung Jawab
																			</label>
																			<Input
																				value={fu.assignee}
																				onChange={(e) =>
																					handleUpdateFollowUp(
																						idx,
																						"assignee",
																						e.target.value,
																					)
																				}
																				placeholder="Nama PIC..."
																				className="h-9 bg-white border-slate-200 shadow-sm"
																			/>
																		</div>
																		<div className="col-span-12 md:col-span-1 flex items-end justify-end">
																			<Button
																				type="button"
																				variant="ghost"
																				size="icon"
																				onClick={() =>
																					handleRemoveFollowUp(idx)
																				}
																				className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50"
																			>
																				<Trash2 className="w-4 h-4" />
																			</Button>
																		</div>
																	</div>
																))}
															</div>
														)}
													</CardContent>
												</Card>
											</div>

											<DialogFooter className="sticky bottom-0 z-10 bg-white p-4 border-t border-slate-200 flex items-center justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
												<Button
													variant="outline"
													onClick={() => setLogModalOpen(false)}
													className="h-10 px-6 font-semibold"
												>
													Batal
												</Button>
												<Button
													onClick={handleSaveLog}
													disabled={isSavingLog || !newLog.logText.trim()}
													className="h-10 px-8 bg-[#0517B0] hover:bg-blue-800 text-white font-bold shadow-md"
												>
													{isSavingLog && (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													)}
													Simpan Log Percakapan
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</div>
							)}

							<div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
								{logs.length === 0 ? (
									<p className="text-slate-500 text-sm italic">
										Belum ada log komunikasi.
									</p>
								) : (
									logs.map((log: any) => (
										<div key={log.id} className="relative">
											<div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-[3px] border-white ring-1 ring-slate-200" />
											<div className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-2">
												<span>
													📅{" "}
													{new Date(log.createdAt).toLocaleString("id-ID", {
														dateStyle: "full",
													})}
												</span>
												<span className="text-slate-300">|</span>
												<span className="flex items-center gap-1">
													<Clock className="w-3.5 h-3.5" />{" "}
													{log.startTime || "--:--"} - {log.endTime || "--:--"}{" "}
													WIB
												</span>
												<span className="text-slate-300">|</span>
												<span className="flex items-center gap-1">
													<User className="w-3.5 h-3.5" /> oleh:{" "}
													<strong className="text-slate-700">
														{log.author?.fullName || "Admin CRM"}
													</strong>
												</span>
											</div>

											<div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
												<div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap gap-4 items-center">
													{log.media && (
														<div>
															<span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
																Media
															</span>
															<Badge
																variant="outline"
																className="bg-white font-semibold text-[#0517B0]"
															>
																{log.media}
															</Badge>
														</div>
													)}
													{log.topic && (
														<div>
															<span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
																Topik
															</span>
															<Badge
																variant="outline"
																className="bg-white font-semibold text-rose-600"
															>
																{log.topic}
															</Badge>
														</div>
													)}
													{log.location && (
														<div>
															<span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
																Lokasi
															</span>
															<span className="text-sm font-medium text-slate-700">
																{log.location}
															</span>
														</div>
													)}
												</div>
												<div className="p-4 space-y-4">
													<div>
														<h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
															Ringkasan Percakapan
														</h5>
														<p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
															{log.logText}
														</p>
													</div>

													{log.agreements &&
														Array.isArray(log.agreements) &&
														log.agreements.length > 0 && (
															<div className="bg-emerald-50/50 p-3 rounded border border-emerald-100">
																<h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-2">
																	<CheckCircle className="w-4 h-4" /> Hasil
																	Kesepakatan
																</h5>
																<ul className="space-y-1.5">
																	{log.agreements.map(
																		(agr: string, i: number) => (
																			<li
																				key={i}
																				className="text-sm text-emerald-900 flex items-start gap-2"
																			>
																				<span className="text-emerald-500 font-bold mt-0.5">
																					✓
																				</span>{" "}
																				{agr}
																			</li>
																		),
																	)}
																</ul>
															</div>
														)}

													{log.followUps &&
														Array.isArray(log.followUps) &&
														log.followUps.length > 0 && (
															<div>
																<h5 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-2">
																	⚡ Tindak Lanjut
																</h5>
																<div className="overflow-x-auto border border-slate-200 rounded">
																	<table className="w-full text-left text-sm">
																		<thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
																			<tr>
																				<th className="p-2 border-b">
																					Tugas / Target
																				</th>
																				<th className="p-2 border-b w-32">
																					Batas Waktu
																				</th>
																				<th className="p-2 border-b w-32">
																					PIC
																				</th>
																			</tr>
																		</thead>
																		<tbody className="divide-y divide-slate-100">
																			{log.followUps.map(
																				(fu: any, i: number) => (
																					<tr key={i} className="bg-white">
																						<td className="p-2 font-medium text-slate-700">
																							{fu.task}
																						</td>
																						<td className="p-2 text-slate-600">
																							{fu.date
																								? new Date(
																										fu.date,
																									).toLocaleDateString("id-ID")
																								: "-"}
																						</td>
																						<td className="p-2 text-slate-600">
																							{fu.assignee || "-"}
																						</td>
																					</tr>
																				),
																			)}
																		</tbody>
																	</table>
																</div>
															</div>
														)}
												</div>
											</div>
										</div>
									))
								)}
								{!showAllLogs && logs.length >= 5 && (
									<button
										onClick={handleShowAllLogs}
										className="text-[#0517B0] text-sm mt-4 hover:underline font-medium relative -left-6 bg-white px-2"
									>
										Lihat Semua Log ↓
									</button>
								)}
							</div>
						</div>

						{/* Status ACC Card */}
						<Card className="bg-slate-50 border-slate-200 shadow-sm overflow-hidden">
							<CardContent className="p-0">
								<div className="flex flex-col sm:flex-row items-center justify-between p-6">
									<div className="flex flex-1 items-center gap-4 mb-4 sm:mb-0 w-full">
										{crm?.isAcc ? (
											<div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
												<div className="flex items-center gap-4">
													<div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
														<CheckCircle className="w-6 h-6 text-emerald-600" />
													</div>
													<div>
														<h4 className="text-emerald-700 font-bold text-lg">
															✅ ACC CRM Diberikan
														</h4>
														<p className="text-sm text-slate-600">
															Oleh{" "}
															<span className="font-semibold">
																{crm?.accBy?.fullName || "Admin CRM"}
															</span>{" "}
															pada{" "}
															{new Date(crm.accAt).toLocaleString("id-ID", {
																dateStyle: "medium",
																timeStyle: "short",
															})}{" "}
															WIB
														</p>
													</div>
												</div>
												{isCrmAdmin && (
													<AlertDialog>
														<AlertDialogTrigger
															render={
																<Button
																	variant="outline"
																	className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0"
																	disabled={isSavingLog}
																>
																	{isSavingLog
																		? "Membatalkan..."
																		: "Batalkan ACC"}
																</Button>
															}
														/>
														<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
															<AlertDialogTitle>
																Konfirmasi Pembatalan ACC CRM
															</AlertDialogTitle>
															<AlertDialogDescription className="text-slate-500">
																Apakah Anda yakin ingin membatalkan status ACC
																untuk panel CRM ini? Status mahasiswa akan
																kembali ke tahap proses.
															</AlertDialogDescription>
															<div className="flex justify-end gap-3 mt-4">
																<AlertDialogCancel className="bg-transparent border-slate-200 hover:bg-slate-50">
																	Batal
																</AlertDialogCancel>
																<AlertDialogAction
																	onClick={handleCancelAcc}
																	className="bg-rose-600 hover:bg-rose-700 text-white"
																>
																	Ya, Batalkan ACC
																</AlertDialogAction>
															</div>
														</AlertDialogContent>
													</AlertDialog>
												)}
											</div>
										) : (
											<>
												<div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
													<Clock className="w-6 h-6 text-slate-500" />
												</div>
												<div>
													<h4 className="text-slate-700 font-bold text-lg">
														⏳ Menunggu ACC CRM
													</h4>
													<p className="text-sm text-slate-500">
														Belum ada persetujuan. Selesaikan semua checklist
														untuk memberikan ACC.
													</p>
												</div>
											</>
										)}
									</div>

									{isCrmAdmin && !crm?.isAcc && (
										<Tooltip>
											<TooltipTrigger
												render={<span className="inline-block" />}
											>
												<span>
													<AlertDialog>
														<AlertDialogTrigger
															disabled={completedCount < totalChecks}
															className="w-full sm:w-auto bg-[#0517B0] hover:bg-blue-800 text-white font-bold px-8 py-2 rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
														>
															✔ ACC CRM →
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogTitle>
																Konfirmasi ACC CRM
															</AlertDialogTitle>
															<AlertDialogDescription>
																Anda akan memberikan persetujuan final untuk
																tahap CRM mahasiswa ini. Tindakan ini akan
																dicatat beserta nama dan waktu persetujuan Anda.
																Pastikan semua data sudah valid.
															</AlertDialogDescription>
															<div className="flex justify-end gap-3 mt-4">
																<AlertDialogCancel className="border-slate-200">
																	Batal
																</AlertDialogCancel>
																<AlertDialogAction
																	onClick={handleAcc}
																	className="bg-[#0517B0] hover:bg-blue-800 text-white"
																>
																	Ya, ACC Sekarang
																</AlertDialogAction>
															</div>
														</AlertDialogContent>
													</AlertDialog>
												</span>
											</TooltipTrigger>
											{completedCount < totalChecks && (
												<TooltipContent>
													Lengkapi semua {totalChecks - completedCount}{" "}
													checklist terlebih dahulu
												</TooltipContent>
											)}
										</Tooltip>
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				<Dialog open={isDeleteDocOpen} onOpenChange={setIsDeleteDocOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Konfirmasi Hapus</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 pt-4">
							<p className="text-slate-600">
								Apakah Anda yakin ingin menghapus dokumen ini?
							</p>
							<div className="flex justify-end gap-3 pt-4">
								<Button variant="outline" onClick={() => setIsDeleteDocOpen(false)}>
									Batal
								</Button>
								<Button
									variant="destructive"
									onClick={handleDeleteDocument}
								>
									Hapus Dokumen
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</TooltipProvider>
	);
}
