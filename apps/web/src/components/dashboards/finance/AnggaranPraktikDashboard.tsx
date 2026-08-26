"use client";

import {
	AlertCircle,
	AlertTriangle,
	ArrowUpDown,
	BookOpen,
	Boxes,
	Calendar,
	Check,
	CheckCircle,
	CheckCircle2,
	ChevronRight,
	Clock,
	CreditCard,
	Download,
	Edit2,
	ExternalLink,
	Eye,
	FileDown,
	FileText,
	Filter,
	GraduationCap,
	Info,
	Layers,
	Loader2,
	Package,
	PackageCheck,
	PackageOpen,
	Paperclip,
	Plus,
	Receipt,
	RefreshCw,
	RotateCcw,
	Search,
	Sparkles,
	Trash2,
	UploadCloud,
	User,
	UtensilsCrossed,
	Wallet,
	X,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
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
import { hasRole, useAuthStore } from "@/store";
import { formatDate, formatRupiah } from "@/utils/format";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ItemKebutuhan {
	namaItem?: string;
	name?: string;
	jumlah?: number;
	qty?: number;
	satuan?: string;
	unit?: string;
	satuanHarga?: number;
	price?: number;
	subtotal?: number;
}

interface ItemSisaBahan {
	namaItem?: string;
	name?: string;
	jumlahSisa?: number;
	jumlah?: number;
	qty?: number;
	satuan?: string;
	unit?: string;
	kondisi?: string;
	condition?: string;
}

interface BudgetRequest {
	id: number;
	dosenId: number;
	courseId: number;
	course?: {
		id: number;
		name: string;
		code: string;
		peminatan?: string;
		cohort?: number;
		type?: string;
	};
	dosen?: {
		id: number;
		fullName?: string;
		username?: string;
		email?: string;
		phone?: string;
	};
	approvedBy?: {
		id: number;
		fullName?: string;
		username?: string;
	};
	daftarKebutuhan: ItemKebutuhan[];
	totalNominal: number;
	status: "menunggu" | "disetujui" | "ditolak" | string;
	catatanFinance?: string | null;
	approvedAt?: string | null;
	buktiPencairanUrl?: string | null;
	buktiPencairanFileName?: string | null;
	tanggalPencairan?: string | null;
	createdAt: string;
	updatedAt: string;
}

interface MaterialReport {
	id: number;
	budgetRequestId: number;
	dosenId: number;
	dosen?: {
		id: number;
		fullName?: string;
		username?: string;
		email?: string;
		phone?: string;
	};
	budgetRequest?: {
		id: number;
		course?: {
			id: number;
			name: string;
			code: string;
			peminatan?: string;
			cohort?: number;
		};
	};
	daftarSisaBahan: ItemSisaBahan[];
	catatanDosen?: string;
	fileUrl?: string;
	fileName?: string;
	createdAt: string;
}

export function AnggaranPraktikDashboard() {
	const { user, token } = useAuthStore();
	const isFinance = hasRole(user, "finance");
	const canManage = isFinance;

	const [activeTab, setActiveTab] = useState<"pengajuan" | "sisa-bahan">(
		"pengajuan",
	);
	const [requests, setRequests] = useState<BudgetRequest[]>([]);
	const [reports, setReports] = useState<MaterialReport[]>([]);
	const [loading, setLoading] = useState(true);

	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	// Pagination
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	// Review & Action State
	const [selectedRequest, setSelectedRequest] = useState<BudgetRequest | null>(
		null,
	);
	const [selectedReport, setSelectedReport] = useState<MaterialReport | null>(
		null,
	);
	const [isReviewOpen, setIsReviewOpen] = useState(false);
	const [isReportDetailOpen, setIsReportDetailOpen] = useState(false);
	const [isRejecting, setIsRejecting] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const [actionLoading, setActionLoading] = useState(false);

	// Bukti Pencairan State
	const [proofFile, setProofFile] = useState<File | null>(null);
	const [uploadingProof, setUploadingProof] = useState(false);
	const [isChangeProofMode, setIsChangeProofMode] = useState(false);

	const fetchData = async () => {
		try {
			setLoading(true);
			const [reqRes, repRes] = await Promise.all([
				api.finance["anggaran-praktik"].get(),
				api.finance["laporan-sisa-bahan"].get(),
			]);

			if (reqRes.data?.success) {
				setRequests((reqRes.data.data as any) || []);
			}
			if (repRes.data?.success) {
				setReports((repRes.data.data as any) || []);
			}
		} catch (e) {
			console.error("Failed to fetch anggaran praktik data", e);
			toast.error("Gagal memuat data anggaran praktik");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	// Reset pagination on filter changes
	useEffect(() => {
		setPage(1);
	}, [searchQuery, statusFilter, activeTab]);

	// KPI Metrics Calculations
	const kpi = useMemo(() => {
		const totalRequests = requests.length;
		const pendingCount = requests.filter(
			(r) => r.status === "menunggu" || !r.status,
		).length;
		const approvedRequests = requests.filter((r) => r.status === "disetujui");
		const approvedCount = approvedRequests.length;
		const approvedTotalNominal = approvedRequests.reduce(
			(acc, curr) => acc + (Number(curr.totalNominal) || 0),
			0,
		);
		const rejectedCount = requests.filter((r) => r.status === "ditolak").length;
		const totalReports = reports.length;

		return {
			totalRequests,
			pendingCount,
			approvedCount,
			approvedTotalNominal,
			rejectedCount,
			totalReports,
		};
	}, [requests, reports]);

	// Filtered Requests
	const filteredRequests = useMemo(() => {
		return requests.filter((r) => {
			const q = searchQuery.toLowerCase().trim();
			const dosenName = (
				r.dosen?.fullName ||
				r.dosen?.username ||
				""
			).toLowerCase();
			const courseName = (r.course?.name || "").toLowerCase();
			const courseCode = (r.course?.code || "").toLowerCase();
			const matchesSearch =
				!q ||
				dosenName.includes(q) ||
				courseName.includes(q) ||
				courseCode.includes(q);

			const matchesStatus =
				statusFilter === "all" ||
				(statusFilter === "menunggu" &&
					(r.status === "menunggu" || !r.status)) ||
				r.status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [requests, searchQuery, statusFilter]);

	// Filtered Reports
	const filteredReports = useMemo(() => {
		return reports.filter((r) => {
			const q = searchQuery.toLowerCase().trim();
			const dosenName = (
				r.dosen?.fullName ||
				r.dosen?.username ||
				""
			).toLowerCase();
			const courseName = (r.budgetRequest?.course?.name || "").toLowerCase();
			const courseCode = (r.budgetRequest?.course?.code || "").toLowerCase();
			return (
				!q ||
				dosenName.includes(q) ||
				courseName.includes(q) ||
				courseCode.includes(q)
			);
		});
	}, [reports, searchQuery]);

	// Paginated items
	const paginatedRequests = useMemo(() => {
		const start = (page - 1) * pageSize;
		return filteredRequests.slice(start, start + pageSize);
	}, [filteredRequests, page, pageSize]);

	const paginatedReports = useMemo(() => {
		const start = (page - 1) * pageSize;
		return filteredReports.slice(start, start + pageSize);
	}, [filteredReports, page, pageSize]);

	// Helpers
	const getFileUrl = (urlPath?: string | null) => {
		if (!urlPath) return "";
		if (urlPath.startsWith("http://") || urlPath.startsWith("https://")) {
			return urlPath;
		}
		return `${API_URL}${urlPath}`;
	};

	// Actions
	const handleApprove = async (id: number) => {
		if (!canManage) return;
		try {
			setActionLoading(true);

			// If a proof file was attached before clicking approve, upload it directly with approval
			let uploadedUrl: string | undefined;
			let uploadedName: string | undefined;

			if (proofFile) {
				const formData = new FormData();
				formData.append("file", proofFile);
				const uploadRes = await fetch(
					`${API_URL}/finance/anggaran-praktik/${id}/upload-bukti`,
					{
						method: "POST",
						headers: { Authorization: `Bearer ${token}` },
						body: formData,
					},
				);
				let uploadJson: any = {};
				try {
					const uploadText = await uploadRes.text();
					uploadJson = JSON.parse(uploadText);
				} catch {
					uploadJson = {
						success: false,
						message: "Respon server tidak valid saat upload",
					};
				}

				if (!uploadRes.ok || !uploadJson.success) {
					toast.error(
						uploadJson.message || "Gagal mengunggah berkas bukti transfer",
					);
					setActionLoading(false);
					return;
				}
				uploadedUrl = uploadJson.data?.buktiPencairanUrl;
				uploadedName = uploadJson.data?.buktiPencairanFileName;
			}

			const { data, error } = await api.finance["anggaran-praktik"][
				id.toString()
			].approve.patch(
				uploadedUrl
					? {
							buktiPencairanUrl: uploadedUrl,
							buktiPencairanFileName: uploadedName,
							tanggalPencairan: new Date().toISOString(),
						}
					: {},
			);

			if (!error && (data as any)?.success !== false) {
				toast.success("Pengajuan anggaran berhasil disetujui");
				setIsReviewOpen(false);
				setSelectedRequest(null);
				setProofFile(null);
				setIsChangeProofMode(false);
				fetchData();
			} else {
				const errMsg =
					(error as any)?.value?.message ||
					(data as any)?.message ||
					"Gagal menyetujui pengajuan anggaran";
				toast.error(errMsg);
			}
		} catch (e: any) {
			console.error("Approve error:", e);
			toast.error(
				e?.message || "Terjadi kesalahan sistem saat menyetujui anggaran",
			);
		} finally {
			setActionLoading(false);
		}
	};

	const handleUploadProof = async (requestId: number, fileToUpload?: File) => {
		const targetFile = fileToUpload || proofFile;
		if (!targetFile) {
			toast.error("Pilih file bukti pencairan terlebih dahulu (PDF/Gambar)");
			return;
		}

		setUploadingProof(true);
		try {
			const formData = new FormData();
			formData.append("file", targetFile);

			const res = await fetch(
				`${API_URL}/finance/anggaran-praktik/${requestId}/upload-bukti`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				},
			);

			let json: any = {};
			try {
				const text = await res.text();
				json = JSON.parse(text);
			} catch {
				json = { success: false, message: "Respon server tidak valid" };
			}

			if (res.ok && json.success) {
				toast.success("Bukti pencairan anggaran berhasil diunggah");
				setProofFile(null);
				setIsChangeProofMode(false);

				if (selectedRequest && selectedRequest.id === requestId) {
					setSelectedRequest({
						...selectedRequest,
						buktiPencairanUrl: json.data?.buktiPencairanUrl,
						buktiPencairanFileName: json.data?.buktiPencairanFileName,
						tanggalPencairan: json.data?.tanggalPencairan,
					});
				}
				fetchData();
			} else {
				toast.error(json.message || "Gagal mengunggah bukti pencairan");
			}
		} catch (error) {
			console.error("Upload proof error:", error);
			toast.error("Terjadi kesalahan sistem saat mengunggah berkas");
		} finally {
			setUploadingProof(false);
		}
	};

	const handleDeleteProof = async (requestId: number) => {
		setUploadingProof(true);
		try {
			const res = await fetch(
				`${API_URL}/finance/anggaran-praktik/${requestId}/bukti`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			let json: any = {};
			try {
				const text = await res.text();
				json = JSON.parse(text);
			} catch {
				json = { success: false, message: "Respon server tidak valid" };
			}
			if (res.ok && json.success) {
				toast.success("Bukti pencairan anggaran berhasil dihapus");
				if (selectedRequest && selectedRequest.id === requestId) {
					setSelectedRequest({
						...selectedRequest,
						buktiPencairanUrl: null,
						buktiPencairanFileName: null,
						tanggalPencairan: null,
					});
				}
				fetchData();
			} else {
				toast.error(json.message || "Gagal menghapus bukti pencairan");
			}
		} catch (error) {
			console.error("Delete proof error:", error);
			toast.error("Terjadi kesalahan sistem saat menghapus berkas");
		} finally {
			setUploadingProof(false);
		}
	};

	const handleReject = async (id: number) => {
		if (!canManage) return;
		if (!rejectReason.trim()) {
			toast.error("Mohon berikan catatan alasan penolakan");
			return;
		}
		try {
			setActionLoading(true);
			const { data, error } = await api.finance["anggaran-praktik"][
				id.toString()
			].reject.patch({ catatanFinance: rejectReason });
			if (!error && (data as any)?.success !== false) {
				toast.success("Pengajuan anggaran ditolak");
				setIsReviewOpen(false);
				setIsRejecting(false);
				setRejectReason("");
				setSelectedRequest(null);
				setProofFile(null);
				setIsChangeProofMode(false);
				fetchData();
			} else {
				toast.error("Gagal menolak pengajuan anggaran");
			}
		} catch (e) {
			toast.error("Terjadi kesalahan sistem saat menolak anggaran");
		} finally {
			setActionLoading(false);
		}
	};

	const handleReset = async (id: number) => {
		if (!canManage) return;
		try {
			setActionLoading(true);
			const { data, error } =
				await api.finance["anggaran-praktik"][id.toString()].reset.patch();
			if (!error && (data as any)?.success !== false) {
				toast.success("Status anggaran dikembalikan ke Menunggu");
				setIsReviewOpen(false);
				setIsRejecting(false);
				setSelectedRequest(null);
				setProofFile(null);
				setIsChangeProofMode(false);
				fetchData();
			} else {
				toast.error("Gagal mereset status anggaran");
			}
		} catch (e) {
			toast.error("Terjadi kesalahan sistem saat mereset status");
		} finally {
			setActionLoading(false);
		}
	};

	const openReview = (req: BudgetRequest) => {
		setSelectedRequest(req);
		setIsRejecting(false);
		setRejectReason(req.catatanFinance || "");
		setProofFile(null);
		setIsChangeProofMode(false);
		setIsReviewOpen(true);
	};

	const openReportDetail = (rep: MaterialReport) => {
		setSelectedReport(rep);
		setIsReportDetailOpen(true);
	};

	return (
		<div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
			{/* Top Executive Header */}
			<div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-3.5">
						<div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0517B0] border border-blue-100/80 flex items-center justify-center shadow-xs">
							<UtensilsCrossed className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
								Anggaran Praktik
							</h1>
							<p className="text-xs sm:text-sm text-slate-500 mt-1">
								Pusat peninjauan, persetujuan anggaran bahan praktik dosen per
								mata kuliah, dan rekapitulasi laporan sisa bahan.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 self-start sm:self-center">
						<Button
							variant="outline"
							size="sm"
							onClick={fetchData}
							disabled={loading}
							className="h-9 gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl"
						>
							<RefreshCw
								className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0517B0]" : ""}`}
							/>
							Muat Ulang
						</Button>
					</div>
				</div>
			</div>

			{/* 4 Executive KPI Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				{/* 1. Total Pengajuan */}
				<div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-slate-500">
							Total Pengajuan
						</span>
						<div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
							<Receipt className="w-4 h-4" />
						</div>
					</div>
					<div className="mt-3">
						<div className="text-2xl font-black text-slate-900 tracking-tight">
							{kpi.totalRequests}
						</div>
						<div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
							<span>Seluruh mata kuliah praktik</span>
						</div>
					</div>
				</div>

				{/* 2. Menunggu Persetujuan */}
				<div className="bg-white rounded-xl border border-amber-200/90 shadow-2xs p-4 flex flex-col justify-between relative overflow-hidden">
					<div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full pointer-events-none" />
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-amber-800">
							Menunggu Approval
						</span>
						<div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
							<Clock className="w-4 h-4" />
						</div>
					</div>
					<div className="mt-3">
						<div className="text-2xl font-black text-amber-700 tracking-tight">
							{kpi.pendingCount}
						</div>
						<div className="text-[11px] text-amber-600 mt-0.5 font-medium">
							{kpi.pendingCount > 0
								? "Perlu tindakan tinjauan segera"
								: "Semua pengajuan telah ditinjau"}
						</div>
					</div>
				</div>

				{/* 3. Anggaran Disetujui */}
				<div className="bg-white rounded-xl border border-emerald-200/90 shadow-2xs p-4 flex flex-col justify-between relative overflow-hidden">
					<div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full pointer-events-none" />
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-emerald-800">
							Anggaran Disetujui
						</span>
						<div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
							<CheckCircle2 className="w-4 h-4" />
						</div>
					</div>
					<div className="mt-3">
						<div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight font-mono">
							{formatRupiah(kpi.approvedTotalNominal)}
						</div>
						<div className="text-[11px] text-emerald-600 mt-0.5 font-medium">
							{kpi.approvedCount} pengajuan telah dicairkan
						</div>
					</div>
				</div>

				{/* 4. Laporan Sisa Bahan */}
				<div className="bg-white rounded-xl border border-blue-200/90 shadow-2xs p-4 flex flex-col justify-between relative overflow-hidden">
					<div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/60 rounded-bl-full pointer-events-none" />
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-[#0517B0]">
							Laporan Sisa Bahan
						</span>
						<div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0517B0] flex items-center justify-center">
							<PackageCheck className="w-4 h-4" />
						</div>
					</div>
					<div className="mt-3">
						<div className="text-2xl font-black text-[#0517B0] tracking-tight">
							{kpi.totalReports}
						</div>
						<div className="text-[11px] text-slate-500 mt-0.5 font-medium">
							Rekap pasca-praktik dosen
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
				{/* Segmented Tab Headers & Search Toolbar */}
				<div className="p-4 sm:p-5 border-b border-slate-200/90 space-y-4">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						{/* Tab Switcher */}
						<div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-full sm:w-auto">
							<button
								type="button"
								onClick={() => setActiveTab("pengajuan")}
								className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial ${
									activeTab === "pengajuan"
										? "bg-white text-[#0517B0] shadow-xs"
										: "text-slate-600 hover:text-slate-900"
								}`}
							>
								<Receipt className="w-3.5 h-3.5" />
								Pengajuan Anggaran ({requests.length})
							</button>

							<button
								type="button"
								onClick={() => setActiveTab("sisa-bahan")}
								className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial ${
									activeTab === "sisa-bahan"
										? "bg-white text-[#0517B0] shadow-xs"
										: "text-slate-600 hover:text-slate-900"
								}`}
							>
								<PackageCheck className="w-3.5 h-3.5" />
								Laporan Sisa Bahan ({reports.length})
							</button>
						</div>

						{/* Search Bar */}
						<div className="relative w-full md:w-80">
							<Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
							<Input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Cari Dosen, Mata Kuliah, Kode..."
								className="pl-9 pr-8 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							)}
						</div>
					</div>

					{/* Quick Status Filter Tabs for Pengajuan Tab */}
					{activeTab === "pengajuan" && (
						<div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
							<span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
								<Filter className="w-3 h-3" /> Status:
							</span>

							{[
								{ id: "all", label: "Semua", count: requests.length },
								{
									id: "menunggu",
									label: "Menunggu",
									count: kpi.pendingCount,
									badgeColor: "bg-amber-100 text-amber-800",
								},
								{
									id: "disetujui",
									label: "Disetujui",
									count: kpi.approvedCount,
									badgeColor: "bg-emerald-100 text-emerald-800",
								},
								{
									id: "ditolak",
									label: "Ditolak",
									count: kpi.rejectedCount,
									badgeColor: "bg-rose-100 text-rose-800",
								},
							].map((tab) => {
								const isActive = statusFilter === tab.id;
								return (
									<button
										key={tab.id}
										type="button"
										onClick={() => setStatusFilter(tab.id)}
										className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all border shrink-0 ${
											isActive
												? "bg-[#0517B0] text-white border-[#0517B0] shadow-xs"
												: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
										}`}
									>
										{tab.label}
										<span
											className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
												isActive
													? "bg-white/20 text-white"
													: tab.badgeColor || "bg-slate-200 text-slate-700"
											}`}
										>
											{tab.count}
										</span>
									</button>
								);
							})}
						</div>
					)}
				</div>

				{/* Tab 1: Tabel Pengajuan Anggaran */}
				{activeTab === "pengajuan" && (
					<div>
						{loading ? (
							<div className="py-20 flex flex-col items-center justify-center gap-3">
								<Loader2 className="w-8 h-8 text-[#0517B0] animate-spin" />
								<p className="text-xs text-slate-500 font-medium">
									Memuat data pengajuan anggaran...
								</p>
							</div>
						) : filteredRequests.length === 0 ? (
							<div className="py-20 text-center px-4">
								<div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
									<Receipt className="w-7 h-7" />
								</div>
								<h3 className="text-sm font-bold text-slate-800">
									Tidak Ada Pengajuan Anggaran
								</h3>
								<p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
									{searchQuery || statusFilter !== "all"
										? "Tidak ditemukan pengajuan anggaran yang cocok dengan kriteria filter."
										: "Belum ada pengajuan anggaran bahan praktik yang diajukan oleh Dosen."}
								</p>
								{(searchQuery || statusFilter !== "all") && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setSearchQuery("");
											setStatusFilter("all");
										}}
										className="mt-4 text-xs h-8"
									>
										Reset Filter
									</Button>
								)}
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader className="bg-slate-50/80">
										<TableRow className="border-b border-slate-200/80 hover:bg-transparent">
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">
												Dosen Pengaju
											</TableHead>
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">
												Mata Kuliah & Peminatan
											</TableHead>
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">
												Tanggal Pengajuan
											</TableHead>
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">
												Kebutuhan Bahan
											</TableHead>
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4 text-right">
												Total Nominal
											</TableHead>
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4 text-center">
												Status
											</TableHead>
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4 text-center">
												Aksi
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{paginatedRequests.map((r, idx) => {
											const dosenFullName =
												r.dosen?.fullName ||
												r.dosen?.username ||
												`Dosen ID ${r.dosenId}`;
											const initials = dosenFullName
												.split(" ")
												.map((n) => n[0])
												.slice(0, 2)
												.join("")
												.toUpperCase();

											const itemsCount = (r.daftarKebutuhan || []).length;
											const isApproved = r.status === "disetujui";
											const isRejected = r.status === "ditolak";
											const isPending = r.status === "menunggu" || !r.status;

											return (
												<TableRow
													key={r.id}
													className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${
														idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
													}`}
												>
													{/* Dosen */}
													<TableCell className="py-3.5 px-4">
														<div className="flex items-center gap-3">
															<Avatar className="w-8 h-8 rounded-full bg-blue-100 text-[#0517B0] font-bold text-xs border border-blue-200/60 shrink-0">
																<AvatarFallback className="bg-blue-100 text-[#0517B0] text-xs font-bold">
																	{initials}
																</AvatarFallback>
															</Avatar>
															<div className="min-w-0">
																<div className="text-xs font-bold text-slate-900 truncate">
																	{dosenFullName}
																</div>
																{r.dosen?.email && (
																	<div className="text-[11px] text-slate-500 truncate">
																		{r.dosen.email}
																	</div>
																)}
															</div>
														</div>
													</TableCell>

													{/* Mata Kuliah */}
													<TableCell className="py-3.5 px-4">
														<div className="space-y-1">
															<div className="text-xs font-bold text-slate-900 flex items-center gap-2">
																<span>
																	{r.course?.name ||
																		`Mata Kuliah ID ${r.courseId}`}
																</span>
																<Badge
																	variant="outline"
																	className="text-[10px] font-mono font-semibold px-1.5 py-0 bg-slate-50 text-slate-600 border-slate-200 shrink-0"
																>
																	{r.course?.code || "-"}
																</Badge>
															</div>
															<div className="flex items-center gap-1.5 flex-wrap">
																{r.course?.peminatan && (
																	<PeminatanBadge
																		peminatan={r.course.peminatan}
																		size="sm"
																	/>
																)}
																{r.course?.cohort && (
																	<span className="text-[10px] text-slate-500 font-medium">
																		Angkatan {r.course.cohort}
																	</span>
																)}
															</div>
														</div>
													</TableCell>

													{/* Tanggal */}
													<TableCell className="py-3.5 px-4">
														<div className="text-xs text-slate-700 font-medium">
															{formatDate(r.createdAt)}
														</div>
													</TableCell>

													{/* Kebutuhan Bahan */}
													<TableCell className="py-3.5 px-4">
														<Badge
															variant="outline"
															className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-semibold px-2.5 py-1 gap-1.5 inline-flex items-center"
														>
															<Package className="w-3.5 h-3.5 text-slate-500" />
															{itemsCount} Item Bahan
														</Badge>
													</TableCell>

													{/* Total Nominal */}
													<TableCell className="py-3.5 px-4 text-right">
														<div className="text-xs font-black font-mono text-slate-900">
															{formatRupiah(r.totalNominal || 0)}
														</div>
													</TableCell>

													{/* Status */}
													<TableCell className="py-3.5 px-4 text-center">
														{isPending && (
															<Badge
																variant="outline"
																className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-bold px-2.5 py-0.5 inline-flex items-center gap-1"
															>
																<Clock className="w-3 h-3" />
																Menunggu
															</Badge>
														)}
														{isApproved && (
															<div className="flex flex-col items-center gap-1">
																<Badge
																	variant="outline"
																	className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 inline-flex items-center gap-1"
																>
																	<CheckCircle2 className="w-3 h-3" />
																	Disetujui
																</Badge>
																{r.buktiPencairanUrl ? (
																	<span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
																		<Paperclip className="w-2.5 h-2.5" /> Bukti
																		Ada
																	</span>
																) : (
																	<span className="text-[10px] font-medium text-amber-600 bg-amber-50/70 px-1.5 py-0.5 rounded border border-amber-200/60">
																		Belum Ada Bukti
																	</span>
																)}
															</div>
														)}
														{isRejected && (
															<Badge
																variant="outline"
																className="bg-rose-50 text-rose-700 border-rose-200 text-[11px] font-bold px-2.5 py-0.5 inline-flex items-center gap-1"
															>
																<XCircle className="w-3 h-3" />
																Ditolak
															</Badge>
														)}
													</TableCell>

													{/* Aksi */}
													<TableCell className="py-3.5 px-4 text-center">
														<Button
															size="sm"
															onClick={() => openReview(r)}
															className={`text-xs h-8 px-3 rounded-lg font-semibold gap-1.5 shadow-2xs ${
																isPending && canManage
																	? "bg-[#0517B0] hover:bg-[#04128f] text-white"
																	: "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
															}`}
														>
															<Eye className="w-3.5 h-3.5" />
															{isPending && canManage ? "Tinjau" : "Detail"}
														</Button>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						)}

						{/* Pagination for Pengajuan */}
						<div className="p-4 border-t border-slate-200/80">
							<TablePagination
								currentPage={page}
								totalItems={filteredRequests.length}
								pageSize={pageSize}
								onPageChange={setPage}
								onPageSizeChange={setPageSize}
								pageSizeOptions={[5, 10, 20, 50]}
								itemName="Pengajuan"
							/>
						</div>
					</div>
				)}

				{/* Tab 2: Tabel Laporan Sisa Bahan */}
				{activeTab === "sisa-bahan" && (
					<div>
						{loading ? (
							<div className="py-20 flex flex-col items-center justify-center gap-3">
								<Loader2 className="w-8 h-8 text-[#0517B0] animate-spin" />
								<p className="text-xs text-slate-500 font-medium">
									Memuat data laporan sisa bahan...
								</p>
							</div>
						) : filteredReports.length === 0 ? (
							<div className="py-20 text-center px-4">
								<div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
									<PackageCheck className="w-7 h-7" />
								</div>
								<h3 className="text-sm font-bold text-slate-800">
									Tidak Ada Laporan Sisa Bahan
								</h3>
								<p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
									{searchQuery
										? "Tidak ditemukan laporan sisa bahan yang cocok dengan kata kunci pencarian."
										: "Belum ada laporan sisa bahan praktik yang dikirimkan oleh Dosen."}
								</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader className="bg-slate-50/80">
										<TableRow className="border-b border-slate-200/80 hover:bg-transparent">
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">
												Dosen Pelapor
											</TableHead>
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">
												Mata Kuliah Terkait
											</TableHead>
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">
												Tanggal Pelaporan
											</TableHead>
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">
												Rincian Sisa
											</TableHead>
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4">
												Catatan Dosen
											</TableHead>
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4 text-center">
												Lampiran
											</TableHead>
											<TableHead className="text-[11px] font-bold text-slate-600 uppercase tracking-wider py-3 px-4 text-center">
												Aksi
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{paginatedReports.map((rep, idx) => {
											const dosenFullName =
												rep.dosen?.fullName ||
												rep.dosen?.username ||
												`Dosen ID ${rep.dosenId}`;
											const initials = dosenFullName
												.split(" ")
												.map((n) => n[0])
												.slice(0, 2)
												.join("")
												.toUpperCase();

											const sisaCount = (rep.daftarSisaBahan || []).length;

											return (
												<TableRow
													key={rep.id}
													className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${
														idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
													}`}
												>
													{/* Dosen */}
													<TableCell className="py-3.5 px-4">
														<div className="flex items-center gap-3">
															<Avatar className="w-8 h-8 rounded-full bg-blue-100 text-[#0517B0] font-bold text-xs border border-blue-200/60 shrink-0">
																<AvatarFallback className="bg-blue-100 text-[#0517B0] text-xs font-bold">
																	{initials}
																</AvatarFallback>
															</Avatar>
															<div className="min-w-0">
																<div className="text-xs font-bold text-slate-900 truncate">
																	{dosenFullName}
																</div>
															</div>
														</div>
													</TableCell>

													{/* Mata Kuliah */}
													<TableCell className="py-3.5 px-4">
														<div className="space-y-1">
															<div className="text-xs font-bold text-slate-900">
																{rep.budgetRequest?.course?.name ||
																	`Pengajuan ID #${rep.budgetRequestId}`}
															</div>
															{rep.budgetRequest?.course?.peminatan && (
																<PeminatanBadge
																	peminatan={rep.budgetRequest.course.peminatan}
																	size="sm"
																/>
															)}
														</div>
													</TableCell>

													{/* Tanggal */}
													<TableCell className="py-3.5 px-4">
														<div className="text-xs text-slate-700 font-medium">
															{formatDate(rep.createdAt)}
														</div>
													</TableCell>

													{/* Rincian Sisa */}
													<TableCell className="py-3.5 px-4">
														<Badge
															variant="outline"
															className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-semibold px-2.5 py-1 gap-1.5 inline-flex items-center"
														>
															<Boxes className="w-3.5 h-3.5 text-slate-500" />
															{sisaCount} Item Sisa
														</Badge>
													</TableCell>

													{/* Catatan Dosen */}
													<TableCell className="py-3.5 px-4">
														<div className="text-xs text-slate-600 max-w-xs line-clamp-2">
															{rep.catatanDosen || "-"}
														</div>
													</TableCell>

													{/* Lampiran */}
													<TableCell className="py-3.5 px-4 text-center">
														{rep.fileUrl ? (
															<Button
																size="sm"
																variant="ghost"
																onClick={() =>
																	window.open(rep.fileUrl, "_blank")
																}
																className="text-xs h-7 gap-1 text-[#0517B0] hover:bg-blue-50 font-semibold"
															>
																<ExternalLink className="w-3 h-3" />
																Berkas
															</Button>
														) : (
															<span className="text-xs text-slate-400">-</span>
														)}
													</TableCell>

													{/* Aksi */}
													<TableCell className="py-3.5 px-4 text-center">
														<Button
															size="sm"
															variant="outline"
															onClick={() => openReportDetail(rep)}
															className="text-xs h-8 px-3 rounded-lg border-slate-200 font-semibold gap-1.5 hover:bg-slate-100 shadow-2xs"
														>
															<Eye className="w-3.5 h-3.5" />
															Detail
														</Button>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						)}

						{/* Pagination for Laporan Sisa */}
						<div className="p-4 border-t border-slate-200/80">
							<TablePagination
								currentPage={page}
								totalItems={filteredReports.length}
								pageSize={pageSize}
								onPageChange={setPage}
								onPageSizeChange={setPageSize}
								pageSizeOptions={[5, 10, 20, 50]}
								itemName="Laporan Sisa"
							/>
						</div>
					</div>
				)}
			</div>

			{/* ========================================================================= */}
			{/* DIALOG MODAL 1: Peninjauan Detail Pengajuan Anggaran (ReviewBudgetModal) */}
			{/* ========================================================================= */}
			<Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
				<DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl bg-white shadow-2xl">
					<DialogHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 shrink-0 bg-white">
						<div className="flex items-center justify-between gap-3 pr-6">
							<div className="flex items-center gap-2.5">
								<div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0517B0] border border-blue-100 flex items-center justify-center shrink-0">
									<Receipt className="w-4 h-4" />
								</div>
								<div>
									<DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
										Tinjau Pengajuan Anggaran Praktik
									</DialogTitle>
									<DialogDescription className="text-xs text-slate-500 mt-0.5">
										Verifikasi rincian kebutuhan bahan yang diajukan oleh Dosen
									</DialogDescription>
								</div>
							</div>
							{selectedRequest && (
								<Badge
									variant="outline"
									className={`text-xs font-bold px-3 py-1 shrink-0 ${
										selectedRequest.status === "disetujui"
											? "bg-emerald-50 text-emerald-700 border-emerald-200"
											: selectedRequest.status === "ditolak"
												? "bg-rose-50 text-rose-700 border-rose-200"
												: "bg-amber-50 text-amber-700 border-amber-200"
									}`}
								>
									{selectedRequest.status === "disetujui"
										? "✓ Disetujui"
										: selectedRequest.status === "ditolak"
											? "✕ Ditolak"
											: "⏳ Menunggu Approval"}
								</Badge>
							)}
						</div>
					</DialogHeader>

					{selectedRequest && (
						<div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
							{/* Summary Info Banner: 3 Column Minimalist Grid */}
							<div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
								<div>
									<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
										Mata Kuliah / Praktik
									</span>
									<div className="font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">
										{selectedRequest.course?.name ||
											`Mata Kuliah ID ${selectedRequest.courseId}`}
									</div>
									<div className="flex items-center gap-1.5 mt-1">
										<Badge
											variant="outline"
											className="text-[10px] font-mono px-1.5 py-0 bg-white text-slate-600 border-slate-200"
										>
											{selectedRequest.course?.code || "-"}
										</Badge>
										{selectedRequest.course?.peminatan && (
											<PeminatanBadge
												peminatan={selectedRequest.course.peminatan}
												size="sm"
											/>
										)}
									</div>
								</div>

								<div>
									<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
										Dosen Pengaju
									</span>
									<div className="font-bold text-slate-900 mt-0.5">
										{selectedRequest.dosen?.fullName ||
											selectedRequest.dosen?.username ||
											`Dosen ID ${selectedRequest.dosenId}`}
									</div>
									{selectedRequest.dosen?.email && (
										<div className="text-[11px] text-slate-500 mt-0.5 truncate">
											{selectedRequest.dosen.email}
										</div>
									)}
								</div>

								<div>
									<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
										Waktu Pengajuan
									</span>
									<div className="font-semibold text-slate-800 mt-0.5">
										{formatDate(selectedRequest.createdAt)}
									</div>
									{selectedRequest.course?.cohort && (
										<div className="text-[11px] text-slate-500 mt-0.5">
											Angkatan {selectedRequest.course.cohort}
										</div>
									)}
								</div>
							</div>

							{/* Tabel Rincian Kebutuhan Bahan */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
										<Package className="w-3.5 h-3.5 text-[#0517B0]" />
										Rincian Kebutuhan Bahan
									</h4>
									<span className="text-xs font-semibold text-slate-500">
										{(selectedRequest.daftarKebutuhan || []).length} Jenis Bahan
									</span>
								</div>

								<div className="border border-slate-200 rounded-xl overflow-hidden">
									<Table>
										<TableHeader className="bg-slate-50">
											<TableRow className="border-b border-slate-200">
												<TableHead className="text-[11px] font-bold text-slate-700 py-2.5 px-3 w-10 text-center">
													#
												</TableHead>
												<TableHead className="text-[11px] font-bold text-slate-700 py-2.5 px-3">
													Nama Bahan / Item
												</TableHead>
												<TableHead className="text-[11px] font-bold text-slate-700 py-2.5 px-3 text-center w-24">
													Jumlah (Qty)
												</TableHead>
												<TableHead className="text-[11px] font-bold text-slate-700 py-2.5 px-3 text-center w-20">
													Satuan
												</TableHead>
												<TableHead className="text-[11px] font-bold text-slate-700 py-2.5 px-3 text-right w-36">
													Harga Satuan
												</TableHead>
												<TableHead className="text-[11px] font-bold text-slate-700 py-2.5 px-3 text-right w-36">
													Subtotal
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{(selectedRequest.daftarKebutuhan || []).map(
												(item, i) => {
													const qty = Number(item.jumlah ?? item.qty ?? 1);
													const price = Number(
														item.satuanHarga ?? item.price ?? 0,
													);
													const subtotal = item.subtotal ?? qty * price;
													return (
														<TableRow
															key={i}
															className="border-b border-slate-100 text-xs hover:bg-slate-50/50"
														>
															<TableCell className="py-2.5 px-3 text-center text-slate-400 font-mono">
																{i + 1}
															</TableCell>
															<TableCell className="py-2.5 px-3 font-semibold text-slate-900">
																{item.namaItem || item.name || "Bahan Praktik"}
															</TableCell>
															<TableCell className="py-2.5 px-3 text-center font-bold text-slate-800">
																{qty}
															</TableCell>
															<TableCell className="py-2.5 px-3 text-center text-slate-500">
																{item.satuan || item.unit || "pcs"}
															</TableCell>
															<TableCell className="py-2.5 px-3 text-right font-mono text-slate-600">
																{formatRupiah(price)}
															</TableCell>
															<TableCell className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
																{formatRupiah(subtotal)}
															</TableCell>
														</TableRow>
													);
												},
											)}
										</TableBody>
									</Table>

									{/* Total Footer Row */}
									<div className="bg-blue-50/40 p-3 sm:p-4 border-t border-slate-200 flex items-center justify-between">
										<span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
											Total Anggaran:
										</span>
										<span className="text-base sm:text-lg font-black font-mono text-[#0517B0]">
											{formatRupiah(selectedRequest.totalNominal || 0)}
										</span>
									</div>
								</div>
							</div>

							{/* Feedback Catatan Penolakan (Riwayat) */}
							{selectedRequest.catatanFinance && !isRejecting && (
								<div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
									<div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
										<AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
										Catatan Penolakan dari Finance:
									</div>
									<p className="text-xs text-rose-700 pl-5">
										{selectedRequest.catatanFinance}
									</p>
								</div>
							)}

							{/* Info Approval & Bukti Pencairan Section (When Approved) */}
							{selectedRequest.status === "disetujui" && (
								<div className="space-y-3">
									{selectedRequest.approvedAt && (
										<div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
											<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
											<span>
												Anggaran disetujui pada{" "}
												<strong>
													{formatDate(selectedRequest.approvedAt)}
												</strong>
												{selectedRequest.approvedBy?.fullName && (
													<>
														{" "}
														oleh{" "}
														<strong>
															{selectedRequest.approvedBy.fullName}
														</strong>
													</>
												)}
											</span>
										</div>
									)}

									{/* Bukti Pencairan / Penyerahan Dana Card */}
									<div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<CreditCard className="w-4 h-4 text-[#0517B0]" />
												<span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
													Bukti Pencairan / Penyerahan Dana ke Dosen
												</span>
											</div>
											{selectedRequest.buktiPencairanUrl &&
											!isChangeProofMode ? (
												<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
													✓ Bukti Terlampir
												</Badge>
											) : (
												<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
													Belum Ada Berkas
												</Badge>
											)}
										</div>

										{selectedRequest.buktiPencairanUrl && !isChangeProofMode ? (
											<div className="bg-white border border-emerald-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
												<div className="flex items-center gap-3 min-w-0">
													<div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
														<FileText className="w-4.5 h-4.5" />
													</div>
													<div className="min-w-0">
														<p className="text-xs font-bold text-slate-900 truncate">
															{selectedRequest.buktiPencairanFileName ||
																"Bukti_Pencairan_Anggaran.pdf"}
														</p>
														<p className="text-[11px] text-slate-500 mt-0.5">
															Dicairkan pada{" "}
															{formatDate(
																selectedRequest.tanggalPencairan ||
																	selectedRequest.approvedAt,
															)}
														</p>
													</div>
												</div>

												<div className="flex items-center gap-2 shrink-0">
													<Button
														type="button"
														size="sm"
														variant="outline"
														onClick={() =>
															window.open(
																getFileUrl(selectedRequest.buktiPencairanUrl),
																"_blank",
															)
														}
														className="text-xs h-8.5 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold"
													>
														<ExternalLink className="w-3.5 h-3.5" />
														Lihat Bukti
													</Button>
													{canManage && (
														<>
															<Button
																type="button"
																size="sm"
																variant="ghost"
																onClick={() => setIsChangeProofMode(true)}
																className="text-xs h-8.5 text-slate-600 hover:text-slate-900"
															>
																Ganti
															</Button>
															<Button
																type="button"
																size="sm"
																variant="ghost"
																disabled={uploadingProof}
																onClick={() =>
																	handleDeleteProof(selectedRequest.id)
																}
																className="text-xs h-8.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
															>
																<Trash2 className="w-3.5 h-3.5" />
															</Button>
														</>
													)}
												</div>
											</div>
										) : (
											<div className="bg-white border border-dashed border-slate-300 rounded-xl p-4 space-y-3">
												<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
													<div className="flex items-center gap-3">
														<div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0517B0] flex items-center justify-center shrink-0">
															<UploadCloud className="w-5 h-5" />
														</div>
														<div>
															<p className="text-xs font-bold text-slate-800">
																Upload Slip Transfer / Tanda Terima
															</p>
															<p className="text-[11px] text-slate-500">
																Format PDF, JPG, atau PNG (Maks. 10MB)
															</p>
														</div>
													</div>

													{isChangeProofMode && (
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => {
																setIsChangeProofMode(false);
																setProofFile(null);
															}}
															className="text-xs h-8.5"
														>
															Batal Ganti
														</Button>
													)}
												</div>

												<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
													<Input
														type="file"
														accept=".pdf,.jpg,.jpeg,.png"
														onChange={(e) => {
															const f = e.target.files?.[0];
															if (f) setProofFile(f);
														}}
														className="text-xs h-9 bg-slate-50 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-[#0517B0] cursor-pointer"
													/>
													<Button
														type="button"
														size="sm"
														disabled={!proofFile || uploadingProof}
														onClick={() =>
															handleUploadProof(selectedRequest.id)
														}
														className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs h-9 px-4 font-bold shrink-0 gap-1.5 shadow-xs"
													>
														{uploadingProof ? (
															<Loader2 className="w-3.5 h-3.5 animate-spin" />
														) : (
															<UploadCloud className="w-3.5 h-3.5" />
														)}
														Simpan Bukti
													</Button>
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Optional Bukti Upload When Pending Approval */}
							{(selectedRequest.status === "menunggu" ||
								!selectedRequest.status) &&
								canManage && (
									<div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
										<div className="flex items-center justify-between">
											<label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
												<Paperclip className="w-3.5 h-3.5 text-[#0517B0]" />
												Lampirkan Bukti Transfer (Opsional):
											</label>
											{proofFile && (
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => setProofFile(null)}
													className="text-[11px] h-6 px-2 text-rose-600 hover:bg-rose-50"
												>
													Hapus Pilihan
												</Button>
											)}
										</div>
										<Input
											type="file"
											accept=".pdf,.jpg,.jpeg,.png"
											onChange={(e) => {
												const f = e.target.files?.[0];
												if (f) setProofFile(f);
											}}
											className="text-xs h-8.5 bg-white file:mr-2 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-blue-100 file:text-[#0517B0] cursor-pointer"
										/>
										<p className="text-[11px] text-slate-400">
											Anda dapat melampirkan bukti transfer sekarang atau
											mengunggahnya nanti setelah disetujui.
										</p>
									</div>
								)}

							{/* Reject Input Form (When toggled) */}
							{isRejecting && (
								<div className="p-3.5 sm:p-4 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2">
									<label className="text-xs font-bold text-rose-900 block flex items-center gap-1.5">
										<AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
										Catatan Alasan Penolakan (Wajib Diisi):
									</label>
									<Textarea
										value={rejectReason}
										onChange={(e) => setRejectReason(e.target.value)}
										placeholder="Tuliskan catatan perbaikan untuk dosen (misal: kurangi kuantitas item X atau lampirkan estimasi alternatif)..."
										className="text-xs bg-white border-rose-300 focus:border-rose-500 rounded-lg min-h-[75px]"
									/>
									<p className="text-[11px] text-rose-600">
										Catatan ini akan langsung ditampilkan ke Dosen pengampu mata
										kuliah untuk proses revisi.
									</p>
								</div>
							)}
						</div>
					)}

					<DialogFooter className="p-4 sm:p-5 pt-3 border-t border-slate-100 shrink-0 bg-slate-50/90 rounded-b-2xl flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setIsReviewOpen(false);
								setIsRejecting(false);
							}}
							disabled={actionLoading}
							className="text-xs h-9 order-2 sm:order-1"
						>
							Tutup
						</Button>

						{canManage && selectedRequest && (
							<div className="flex items-center gap-2 order-1 sm:order-2 justify-end">
								{/* If Pending: Show Approve & Reject */}
								{(selectedRequest.status === "menunggu" ||
									!selectedRequest.status) && (
									<>
										{!isRejecting ? (
											<>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setIsRejecting(true)}
													disabled={actionLoading}
													className="text-xs h-9 px-3.5 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
												>
													<XCircle className="w-3.5 h-3.5" />
													Tolak Pengajuan
												</Button>
												<Button
													size="sm"
													onClick={() => handleApprove(selectedRequest.id)}
													disabled={actionLoading}
													className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 gap-1.5 font-bold shadow-xs"
												>
													{actionLoading ? (
														<Loader2 className="w-3.5 h-3.5 animate-spin" />
													) : (
														<CheckCircle2 className="w-3.5 h-3.5" />
													)}
													Setujui Anggaran
												</Button>
											</>
										) : (
											<>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setIsRejecting(false)}
													disabled={actionLoading}
													className="text-xs h-9"
												>
													Batal
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleReject(selectedRequest.id)}
													disabled={actionLoading || !rejectReason.trim()}
													className="text-xs h-9 px-4 font-bold"
												>
													{actionLoading ? (
														<Loader2 className="w-3.5 h-3.5 animate-spin" />
													) : (
														"Konfirmasi Tolak"
													)}
												</Button>
											</>
										)}
									</>
								)}

								{/* If Already Approved or Rejected: Option to Reset */}
								{selectedRequest.status !== "menunggu" &&
									selectedRequest.status && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleReset(selectedRequest.id)}
											disabled={actionLoading}
											className="text-xs h-9 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
										>
											<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
											Kembalikan ke Menunggu
										</Button>
									)}
							</div>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ========================================================================= */}
			{/* DIALOG MODAL 2: Detail Laporan Sisa Bahan (ViewMaterialReportModal) */}
			{/* ========================================================================= */}
			<Dialog open={isReportDetailOpen} onOpenChange={setIsReportDetailOpen}>
				<DialogContent className="sm:max-w-2xl md:max-w-3xl w-[95vw] max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl bg-white shadow-2xl">
					<DialogHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 shrink-0 bg-white">
						<div className="flex items-center gap-2.5">
							<div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0517B0] border border-blue-100 flex items-center justify-center shrink-0">
								<PackageCheck className="w-4 h-4" />
							</div>
							<div>
								<DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
									Detail Laporan Sisa Bahan Praktik
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-500 mt-0.5">
									Rekapitulasi material sisa pasca-praktik dari Dosen pengampu
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					{selectedReport && (
						<div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
							{/* Info Card: 3 Columns */}
							<div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div>
									<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
										Dosen Pelapor
									</span>
									<div className="font-bold text-slate-900 mt-0.5">
										{selectedReport.dosen?.fullName ||
											selectedReport.dosen?.username ||
											`Dosen ID ${selectedReport.dosenId}`}
									</div>
								</div>

								<div>
									<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
										Mata Kuliah Terkait
									</span>
									<div className="font-bold text-slate-900 mt-0.5">
										{selectedReport.budgetRequest?.course?.name ||
											`Pengajuan ID #${selectedReport.budgetRequestId}`}
									</div>
									{selectedReport.budgetRequest?.course?.peminatan && (
										<div className="mt-1">
											<PeminatanBadge
												peminatan={
													selectedReport.budgetRequest.course.peminatan
												}
												size="sm"
											/>
										</div>
									)}
								</div>

								<div>
									<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
										Tanggal Pelaporan
									</span>
									<div className="font-semibold text-slate-800 mt-0.5">
										{formatDate(selectedReport.createdAt)}
									</div>
								</div>
							</div>

							{/* Tabel Sisa Bahan */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
										Daftar Material Sisa
									</h4>
									<span className="text-xs font-semibold text-slate-500">
										{(selectedReport.daftarSisaBahan || []).length} Item Sisa
									</span>
								</div>

								<div className="border border-slate-200 rounded-xl overflow-hidden">
									<Table>
										<TableHeader className="bg-slate-50">
											<TableRow className="border-b border-slate-200">
												<TableHead className="text-[11px] font-bold text-slate-700 py-2.5 px-3 w-10 text-center">
													#
												</TableHead>
												<TableHead className="text-[11px] font-bold text-slate-700 py-2.5 px-3">
													Nama Bahan
												</TableHead>
												<TableHead className="text-[11px] font-bold text-slate-700 py-2.5 px-3 text-center w-28">
													Jumlah Sisa
												</TableHead>
												<TableHead className="text-[11px] font-bold text-slate-700 py-2.5 px-3 text-center w-24">
													Satuan
												</TableHead>
												<TableHead className="text-[11px] font-bold text-slate-700 py-2.5 px-3 text-center w-40">
													Kondisi Bahan
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{(selectedReport.daftarSisaBahan || []).map((k, i) => {
												const condition =
													k.kondisi || k.condition || "Layak Pakai";
												const isGood =
													condition.toLowerCase().includes("baik") ||
													condition.toLowerCase().includes("layak");
												return (
													<TableRow
														key={i}
														className="border-b border-slate-100 text-xs hover:bg-slate-50/50"
													>
														<TableCell className="py-2.5 px-3 text-center text-slate-400 font-mono">
															{i + 1}
														</TableCell>
														<TableCell className="py-2.5 px-3 font-semibold text-slate-900">
															{k.namaItem || k.name || "Material"}
														</TableCell>
														<TableCell className="py-2.5 px-3 text-center font-bold text-slate-800">
															{k.jumlahSisa ?? k.jumlah ?? k.qty ?? 0}
														</TableCell>
														<TableCell className="py-2.5 px-3 text-center text-slate-500">
															{k.satuan || k.unit || "pcs"}
														</TableCell>
														<TableCell className="py-2.5 px-3 text-center">
															<Badge
																variant="outline"
																className={`text-[10px] font-semibold px-2.5 py-0.5 ${
																	isGood
																		? "bg-emerald-50 text-emerald-700 border-emerald-200"
																		: "bg-rose-50 text-rose-700 border-rose-200"
																}`}
															>
																{condition}
															</Badge>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							</div>

							{/* Catatan Dosen */}
							{selectedReport.catatanDosen && (
								<div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
									<span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
										Catatan Dosen:
									</span>
									<p className="text-xs text-slate-700">
										{selectedReport.catatanDosen}
									</p>
								</div>
							)}

							{/* Lampiran Dokumen / Foto */}
							{selectedReport.fileUrl && (
								<div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between gap-3">
									<div className="flex items-center gap-2 text-xs text-[#0517B0] font-semibold">
										<FileText className="w-4 h-4 shrink-0" />
										<span className="truncate">
											{selectedReport.fileName || "Lampiran Berkas Laporan"}
										</span>
									</div>
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											window.open(selectedReport.fileUrl, "_blank")
										}
										className="text-xs h-8 gap-1.5 border-blue-200 text-[#0517B0] hover:bg-blue-100 shrink-0 font-semibold"
									>
										<ExternalLink className="w-3.5 h-3.5" />
										Buka Berkas
									</Button>
								</div>
							)}
						</div>
					)}

					<DialogFooter className="p-4 sm:p-5 pt-3 border-t border-slate-100 shrink-0 bg-slate-50/90 rounded-b-2xl flex justify-end">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsReportDetailOpen(false)}
							className="text-xs h-9"
						>
							Tutup
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
