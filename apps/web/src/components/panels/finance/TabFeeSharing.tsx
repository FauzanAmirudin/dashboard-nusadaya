"use client";

import {
	AlertCircle,
	AlertTriangle,
	Calendar,
	CheckCircle,
	CheckCircle2,
	Clock,
	Coins,
	CreditCard,
	Download,
	Edit2,
	Eye,
	FileText,
	Loader2,
	Lock,
	Megaphone,
	MessageSquare,
	PieChart,
	Plus,
	SlidersHorizontal,
	Trash2,
	UploadCloud,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FilePreviewDialog } from "@/components/panels/finance/FilePreviewDialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { API_URL, api, getToken } from "@/lib/eden";
import { openDocumentReview } from "@/utils/document-review";
import {
	filterFinanceInteger,
	filterFinanceIntegerString,
	preventFinanceIntegerKey,
} from "@/utils/form-validators";
import { formatDate, formatRupiah } from "@/utils/format";

interface TabFeeSharingProps {
	studentId: number;
	canEdit: boolean;
}

const CATEGORY_COLORS: Record<
	string,
	{ bg: string; text: string; border: string; bar: string }
> = {
	Mitra: {
		bg: "bg-sky-50",
		text: "text-sky-700",
		border: "border-sky-200",
		bar: "bg-sky-500",
	},
	Koordinator: {
		bg: "bg-indigo-50",
		text: "text-indigo-700",
		border: "border-indigo-200",
		bar: "bg-indigo-500",
	},
	"Tim Visit": {
		bg: "bg-emerald-50",
		text: "text-emerald-700",
		border: "border-emerald-200",
		bar: "bg-emerald-500",
	},
	Sekolah: {
		bg: "bg-purple-50",
		text: "text-purple-700",
		border: "border-purple-200",
		bar: "bg-purple-500",
	},
	"BKK/FKKS": {
		bg: "bg-amber-50",
		text: "text-amber-700",
		border: "border-amber-200",
		bar: "bg-amber-500",
	},
	"Tim Nusadaya": {
		bg: "bg-blue-50",
		text: "text-blue-700",
		border: "border-blue-200",
		bar: "bg-[#0517B0]",
	},
};

export function TabFeeSharing({ studentId, canEdit }: TabFeeSharingProps) {
	const [recipients, setRecipients] = useState<any[]>([]);
	const [totalBiayaPromosi, setTotalBiayaPromosi] = useState<number>(0);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [uploadingId, setUploadingId] = useState<number | null>(null);

	// Modal State for Biaya Promosi & Iklan
	const [isPromosiModalOpen, setIsPromosiModalOpen] = useState(false);
	const [tempPromosiInput, setTempPromosiInput] = useState<string>("0");
	const [isSavingPromosi, setIsSavingPromosi] = useState(false);

	// Modal State for Multi-Termin Pencairan Fee
	const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
	const [selectedRecipientForDisburse, setSelectedRecipientForDisburse] =
		useState<any>(null);
	const [editingLogId, setEditingLogId] = useState<number | null>(null);
	const [disburseTerminNumber, setDisburseTerminNumber] = useState<number>(1);
	const [disburseAmount, setDisburseAmount] = useState<string>("");
	const [disburseDate, setDisburseDate] = useState<string>(
		new Date().toISOString().split("T")[0],
	);
	const [disburseNotes, setDisburseNotes] = useState<string>("");
	const [disburseProofFile, setDisburseProofFile] = useState<File | null>(null);
	const [isSubmittingDisburse, setIsSubmittingDisburse] = useState(false);

	// Modal State for Riwayat Termin Pencairan
	const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
	const [selectedRecipientLogs, setSelectedRecipientLogs] = useState<any>(null);
	const [deletingLogId, setDeletingLogId] = useState<number | null>(null);
	const [logToDelete, setLogToDelete] = useState<number | null>(null);

	// File Preview Dialog State
	const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
	const [previewFileName, setPreviewFileName] = useState<string>("");
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	const fetchRecipients = async () => {
		try {
			const { data, error } =
				await api.finance["fee-sharing"][studentId.toString()].get();
			if (!error && data?.success) {
				setRecipients(data.data?.recipients || []);
				setTotalBiayaPromosi(data.data?.totalBiayaPromosi ?? 0);
			}
		} catch (e) {
			console.error("Failed to fetch fee sharing data", e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRecipients();
	}, [studentId]);

	// Open Modal Biaya Promosi
	const handleOpenPromosiModal = () => {
		setTempPromosiInput(
			totalBiayaPromosi === 0 ? "" : totalBiayaPromosi.toString(),
		);
		setIsPromosiModalOpen(true);
	};

	// Save Total Biaya Promosi
	const handleSaveTotalPromosi = async () => {
		const nominal = Math.max(0, Number(tempPromosiInput) || 0);
		setIsSavingPromosi(true);
		try {
			const res = await fetch(
				`${API_URL}/finance/fee-sharing/${studentId}/total-promosi`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						totalBiayaPromosi: nominal,
					}),
				},
			);
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success("Total Biaya Promosi & Iklan berhasil disimpan");
				setTotalBiayaPromosi(nominal);
				setIsPromosiModalOpen(false);
			} else {
				toast.error(json.message || "Gagal menyimpan total biaya promosi");
			}
		} catch (e) {
			toast.error(
				"Terjadi kesalahan sistem saat menyimpan total biaya promosi",
			);
		} finally {
			setIsSavingPromosi(false);
		}
	};

	// Multi-Termin Handlers
	const handleOpenDisburseModal = (recipient: any) => {
		const logs = recipient.disbursementLogs || [];
		const totalCair = logs.reduce(
			(sum: number, l: any) => sum + (l.amount || 0),
			0,
		);
		const nominalTarget = recipient.nominalFee || 0;
		const sisaFee = Math.max(0, nominalTarget - totalCair);
		const nextTermin = logs.length + 1;

		setSelectedRecipientForDisburse(recipient);
		setEditingLogId(null);
		setDisburseTerminNumber(nextTermin);
		setDisburseAmount(sisaFee > 0 ? sisaFee.toString() : "");
		setDisburseDate(new Date().toISOString().split("T")[0]);
		setDisburseNotes(`Pencairan Fee Tahap ${nextTermin}`);
		setDisburseProofFile(null);
		setIsDisburseModalOpen(true);
	};

	const handleOpenEditLog = (recipient: any, log: any) => {
		setSelectedRecipientForDisburse(recipient);
		setEditingLogId(log.id);
		setDisburseTerminNumber(log.terminNumber || 1);
		setDisburseAmount(log.amount ? log.amount.toString() : "");
		setDisburseDate(
			log.disbursedAt
				? new Date(log.disbursedAt).toISOString().split("T")[0]
				: new Date().toISOString().split("T")[0],
		);
		setDisburseNotes(log.notes || "");
		setDisburseProofFile(null);
		setIsDisburseModalOpen(true);
	};

	const handleOpenLogsModal = (recipient: any) => {
		setSelectedRecipientLogs(recipient);
		setIsLogsModalOpen(true);
	};

	const handleOpenPreview = (url: string, name: string) => {
		setPreviewFileUrl(url);
		setPreviewFileName(name);
		setIsPreviewOpen(true);
	};

	const handleSubmitDisburse = async () => {
		if (!selectedRecipientForDisburse) return;
		const amount = Math.max(0, Number(disburseAmount) || 0);
		if (amount <= 0) {
			toast.error("Nominal pencairan fee harus lebih dari Rp 0");
			return;
		}

		setIsSubmittingDisburse(true);
		try {
			let transferProofUrl: string | undefined;
			let transferProofFileName: string | undefined;

			// Upload transfer proof file if provided
			if (disburseProofFile) {
				const formData = new FormData();
				formData.append("file", disburseProofFile);
				const uploadRes = await fetch(
					`${API_URL}/finance/fee-sharing/recipients/${selectedRecipientForDisburse.id}/upload-proof`,
					{
						method: "POST",
						headers: { Authorization: `Bearer ${getToken()}` },
						body: formData,
					},
				);
				const uploadJson = await uploadRes.json();
				if (!uploadRes.ok || !uploadJson.success) {
					toast.error(
						uploadJson.message || "Gagal mengunggah bukti transfer bank",
					);
					setIsSubmittingDisburse(false);
					return;
				}
				transferProofUrl = uploadJson.data?.transferProofUrl;
				transferProofFileName = uploadJson.data?.transferProofFileName;
			}

			let res: Response;
			if (editingLogId) {
				const updateBody: any = {
					amount,
					terminNumber: Number(disburseTerminNumber) || 1,
					disbursedAt: disburseDate
						? new Date(disburseDate).toISOString()
						: new Date().toISOString(),
					notes: disburseNotes,
				};
				if (transferProofUrl) {
					updateBody.transferProofUrl = transferProofUrl;
					updateBody.transferProofFileName = transferProofFileName;
				}
				res = await fetch(
					`${API_URL}/finance/fee-sharing/disbursements/${editingLogId}`,
					{
						method: "PUT",
						headers: {
							Authorization: `Bearer ${getToken()}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify(updateBody),
					},
				);
			} else {
				res = await fetch(
					`${API_URL}/finance/fee-sharing/recipients/${selectedRecipientForDisburse.id}/disburse`,
					{
						method: "POST",
						headers: {
							Authorization: `Bearer ${getToken()}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							amount,
							terminNumber: Number(disburseTerminNumber) || 1,
							disbursedAt: disburseDate
								? new Date(disburseDate).toISOString()
								: new Date().toISOString(),
							notes: disburseNotes,
							transferProofUrl,
							transferProofFileName,
						}),
					},
				);
			}

			const json = await res.json();
			if (res.ok && json.success) {
				toast.success(
					json.message ||
						(editingLogId
							? "Pencairan fee berhasil diperbarui"
							: "Pencairan fee berhasil dicatat"),
				);
				setIsDisburseModalOpen(false);
				setSelectedRecipientForDisburse(null);
				setEditingLogId(null);
				await fetchRecipients();
				window.dispatchEvent(
					new CustomEvent("fee-sharing-updated", {
						detail: { studentId },
					}),
				);
				if (selectedRecipientLogs) {
					const updated = await fetch(
						`${API_URL}/finance/fee-sharing/${studentId}`,
						{
							headers: { Authorization: `Bearer ${getToken()}` },
						},
					);
					const updatedJson = await updated.json();
					if (updatedJson.success) {
						const found = updatedJson.data?.recipients?.find(
							(r: any) => r.id === selectedRecipientLogs.id,
						);
						if (found) setSelectedRecipientLogs(found);
					}
				}
			} else {
				toast.error(json.message || "Gagal memproses pencairan fee");
			}
		} catch (error: any) {
			toast.error(
				error?.message || "Terjadi kesalahan saat memproses pencairan",
			);
		} finally {
			setIsSubmittingDisburse(false);
		}
	};

	const handleRequestDeleteLog = (logId: number) => {
		setLogToDelete(logId);
	};

	const handleConfirmDeleteLog = async () => {
		if (!logToDelete) return;
		const logId = logToDelete;
		setDeletingLogId(logId);
		try {
			const res = await fetch(
				`${API_URL}/finance/fee-sharing/disbursements/${logId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success("Riwayat pencairan termin berhasil dihapus");
				if (selectedRecipientLogs) {
					const updatedLogs = (
						selectedRecipientLogs.disbursementLogs || []
					).filter((l: any) => l.id !== logId);
					setSelectedRecipientLogs({
						...selectedRecipientLogs,
						disbursementLogs: updatedLogs,
					});
				}
				await fetchRecipients();
				window.dispatchEvent(
					new CustomEvent("fee-sharing-updated", {
						detail: { studentId },
					}),
				);
			} else {
				toast.error(json.message || "Gagal menghapus riwayat termin");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem saat menghapus termin");
		} finally {
			setDeletingLogId(null);
			setLogToDelete(null);
		}
	};

	const handleLocalNominalChange = (id: number, rawVal: string) => {
		const val = rawVal === "" ? 0 : Math.max(0, Number(rawVal) || 0);
		setRecipients((prev) =>
			prev.map((r) => (r.id === id ? { ...r, nominalFee: val } : r)),
		);
	};

	const handleUpdateFee = async (id: number, nominal: number) => {
		if (!canEdit) return;
		try {
			const res = await fetch(
				`${API_URL}/finance/fee-sharing/recipients/${id}`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						nominalFee: Math.max(0, Number(nominal) || 0),
					}),
				},
			);
			const json = await res.json();
			if (res.ok && !json.error) {
				toast.success("Nominal fee berhasil diperbarui");
				fetchRecipients();
			} else {
				toast.error("Gagal memperbarui nominal fee");
			}
		} catch (e) {
			toast.error("Gagal memperbarui fee");
		}
	};

	const handleUpdateStatus = async (id: number, isPaid: boolean) => {
		if (!canEdit) return;
		try {
			const res = await fetch(
				`${API_URL}/finance/fee-sharing/recipients/${id}`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						statusPencairan: isPaid ? "sudah_dibayarkan" : "belum_dibayarkan",
						tanggalCair: isPaid ? new Date().toISOString() : null,
					}),
				},
			);
			const json = await res.json();
			if (res.ok && (json.success || !json.error)) {
				toast.success(
					isPaid
						? "Status pencairan berhasil ditandai Cair"
						: "Status pencairan berhasil dibatalkan",
				);
				fetchRecipients();
			} else {
				toast.error(json.message || "Gagal memperbarui status");
			}
		} catch (e) {
			console.error("Error updating status:", e);
			toast.error("Gagal memperbarui status");
		}
	};

	const handleInvoiceUpload = async (recipientId: number, file: File) => {
		if (!canEdit) return;
		if (file.type !== "application/pdf") {
			toast.error("File invoice harus berformat PDF");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Ukuran file maksimal 5MB");
			return;
		}

		setUploadingId(recipientId);
		try {
			const formData = new FormData();
			formData.append("file", file);

			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/fee-share-recipients/${recipientId}/upload-invoice`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${getToken()}` },
					body: formData,
				},
			);
			if (res.ok) {
				toast.success("File invoice berhasil diunggah");
				fetchRecipients();
			} else {
				toast.error("Gagal mengunggah file invoice");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		} finally {
			setUploadingId(null);
		}
	};

	// Kalkulasi Alokasi & Ringkasan
	const totalFeeTerbagi = recipients.reduce(
		(acc, curr) => acc + (curr.nominalFee || 0),
		0,
	);
	const sisaAlokasi = totalBiayaPromosi - totalFeeTerbagi;
	const isMatched = totalBiayaPromosi > 0 && sisaAlokasi === 0;

	const totalSudahDibayar = recipients.reduce((sum, r) => {
		const logs = r.disbursementLogs || [];
		if (logs.length > 0) {
			return (
				sum +
				logs.reduce((subSum: number, l: any) => subSum + (l.amount || 0), 0)
			);
		}
		return (
			sum + (r.statusPencairan === "sudah_dibayarkan" ? r.nominalFee || 0 : 0)
		);
	}, 0);

	const totalBelumDibayar = Math.max(0, totalFeeTerbagi - totalSudahDibayar);

	const persentaseTerbagi =
		totalBiayaPromosi > 0
			? Math.min(100, Math.round((totalFeeTerbagi / totalBiayaPromosi) * 100))
			: 0;

	return (
		<div className="space-y-5">
			{/* ─── 1. TOP CARD: PARTISI BIAYA PROMOSI & IKLAN ─── */}
			<div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3.5">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-blue-50 text-[#0517B0] border border-blue-100/80 shadow-2xs">
							<Megaphone className="w-5 h-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
									Biaya Promosi & Iklan
								</h3>
								<Badge
									variant="outline"
									className="text-[10px] font-bold bg-blue-50/60 border-blue-200 text-[#0517B0] px-2 py-0.5"
								>
									Plafon Fee Sharing
								</Badge>
							</div>
							<p className="text-xs text-slate-500 mt-0.5">
								Total pagu promosi yang dialokasikan dan didistribusikan kepada
								penerima fee.
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2.5">
						{/* Total Biaya Promosi Badge */}
						<div className="bg-blue-50/80 border border-blue-100 text-[#0517B0] px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-2xs">
							<Coins className="w-3.5 h-3.5 text-[#0517B0]" />
							<div className="flex flex-col">
								<span className="text-[9px] font-bold uppercase tracking-wider text-blue-800">
									Total Biaya Promosi
								</span>
								<span className="text-sm font-black text-[#0517B0] leading-none">
									{formatRupiah(totalBiayaPromosi)}
								</span>
							</div>
						</div>

						{/* Status Alokasi Badge */}
						{totalBiayaPromosi > 0 ? (
							isMatched ? (
								<Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold gap-1.5">
									<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
									Alokasi Pas 100%
								</Badge>
							) : sisaAlokasi > 0 ? (
								<Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 px-2.5 py-1.5 text-xs font-semibold gap-1.5">
									<AlertCircle className="w-3.5 h-3.5 text-amber-600" />
									Sisa: {formatRupiah(sisaAlokasi)}
								</Badge>
							) : (
								<Badge className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-50 px-2.5 py-1.5 text-xs font-semibold gap-1.5">
									<AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
									Lebih: {formatRupiah(Math.abs(sisaAlokasi))}
								</Badge>
							)
						) : (
							<Badge
								variant="outline"
								className="text-slate-400 border-slate-200 text-xs px-2.5 py-1.5"
							>
								Belum Ditentukan
							</Badge>
						)}

						{canEdit && (
							<Button
								onClick={handleOpenPromosiModal}
								size="sm"
								className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 font-semibold shadow-2xs h-8.5 rounded-lg cursor-pointer"
							>
								<SlidersHorizontal className="w-3.5 h-3.5" />
								Atur Biaya Promosi
							</Button>
						)}
					</div>
				</div>

				{/* Progress Bar Proporsi Alokasi */}
				{totalBiayaPromosi > 0 && (
					<div className="space-y-2 pt-2 border-t border-slate-100">
						<div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
							<span className="flex items-center gap-1.5">
								<PieChart className="w-3.5 h-3.5 text-[#0517B0]" />
								Progres Pembagian Fee ke Penerima:
							</span>
							<span
								className={`font-bold ${
									isMatched
										? "text-emerald-700"
										: sisaAlokasi < 0
											? "text-rose-600"
											: "text-[#0517B0]"
								}`}
							>
								{formatRupiah(totalFeeTerbagi)} /{" "}
								{formatRupiah(totalBiayaPromosi)} ({persentaseTerbagi}%)
							</span>
						</div>

						{/* Multi-segment bar */}
						<div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200/80">
							{recipients.map((rec) => {
								const pct =
									totalBiayaPromosi > 0
										? ((rec.nominalFee || 0) / totalBiayaPromosi) * 100
										: 0;
								if (pct <= 0) return null;
								const styleCfg =
									CATEGORY_COLORS[rec.kategori] || CATEGORY_COLORS.Mitra;
								return (
									<div
										key={rec.id}
										style={{ width: `${pct}%` }}
										className={`h-full ${styleCfg.bar} rounded-xs transition-all duration-500`}
										title={`${rec.kategori} - ${rec.namaReferral}: ${pct.toFixed(1)}% (${formatRupiah(rec.nominalFee || 0)})`}
									/>
								);
							})}
						</div>
					</div>
				)}

				{/* 4 Metrics Summary Chips (Compact & Symmetric) */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
					<div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex flex-col justify-between">
						<span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
							Total Plafon Anggaran
						</span>
						<span className="text-xs font-bold text-slate-900 mt-1">
							{formatRupiah(totalBiayaPromosi)}
						</span>
					</div>

					<div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 flex flex-col justify-between">
						<span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
							Fee Dialokasikan
						</span>
						<span className="text-xs font-bold text-[#0517B0] mt-1">
							{formatRupiah(totalFeeTerbagi)}{" "}
							<span className="text-[10px] text-blue-600 font-normal">
								({recipients.length} org)
							</span>
						</span>
					</div>

					<div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5 flex flex-col justify-between">
						<span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
							Sudah Dicairkan
						</span>
						<span className="text-xs font-bold text-emerald-700 mt-1">
							{formatRupiah(totalSudahDibayar)}
						</span>
					</div>

					<div className="bg-amber-50/50 border border-amber-100 rounded-lg p-2.5 flex flex-col justify-between">
						<span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
							Belum Dicairkan
						</span>
						<span className="text-xs font-bold text-amber-700 mt-1">
							{formatRupiah(totalBelumDibayar)}
						</span>
					</div>
				</div>
			</div>

			{/* ─── 2. DAFTAR PENERIMA FEE SHARING TABLE ─── */}
			<Card className="border border-slate-200/90 shadow-2xs overflow-hidden rounded-xl">
				<CardHeader className="bg-slate-50/80 border-b border-slate-200/90 py-3.5 px-4 sm:px-5 flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-800 flex items-center gap-2">
							<Users className="w-3.5 h-3.5 text-[#0517B0]" />
							Daftar Penerima Fee Sharing
						</CardTitle>
						<p className="text-[11px] text-slate-500 mt-0.5">
							Penerima komisi rekomendasi/promosi dan verifikasi bukti pencairan
							invoice.
						</p>
					</div>

					{canEdit && recipients.length > 0 && (
						<div>
							{!isEditing ? (
								<Button
									onClick={() => setIsEditing(true)}
									size="sm"
									className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 h-8 font-semibold shadow-2xs rounded-lg cursor-pointer"
								>
									<Edit2 className="w-3.5 h-3.5" />
									Edit Nominal & Dokumen
								</Button>
							) : (
								<Button
									onClick={() => setIsEditing(false)}
									variant="outline"
									size="sm"
									className="text-xs h-8 bg-white border-slate-300 font-semibold shadow-2xs rounded-lg cursor-pointer"
								>
									Selesai Edit
								</Button>
							)}
						</div>
					)}
				</CardHeader>

				<CardContent className="p-0">
					{loading ? (
						<div className="p-10 flex flex-col items-center justify-center gap-2">
							<Loader2 className="w-6 h-6 animate-spin text-[#0517B0]" />
							<p className="text-xs text-slate-400 font-medium">
								Memuat daftar penerima fee...
							</p>
						</div>
					) : recipients.length === 0 ? (
						<div className="p-10 text-center space-y-2">
							<div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
								<Users className="w-5 h-5" />
							</div>
							<p className="text-xs font-semibold text-slate-700">
								Belum ada penerima fee
							</p>
							<p className="text-[11px] text-slate-400 max-w-sm mx-auto">
								Data penerima fee ditambahkan oleh Divisi PMB saat proses
								akuisisi mahasiswa.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-slate-50/70 border-b border-slate-200/80">
										<TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3">
											Penerima
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3">
											Nama & Rekening
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3">
											No. WhatsApp
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3">
											Komitmen Fee
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3">
											Realisasi Cair (Bertahap)
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3">
											Status
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3">
											Invoice PMB
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3 text-right">
											Aksi Finance
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{recipients.map((r) => {
										const styleCfg =
											CATEGORY_COLORS[r.kategori] || CATEGORY_COLORS.Mitra;
										const proporsi =
											totalBiayaPromosi > 0
												? ((r.nominalFee || 0) / totalBiayaPromosi) * 100
												: 0;

										const logs = r.disbursementLogs || [];
										const totalCair =
											logs.length > 0
												? logs.reduce(
														(sum: number, l: any) => sum + (l.amount || 0),
														0,
													)
												: r.statusPencairan === "sudah_dibayarkan"
													? r.nominalFee || 0
													: 0;
										const nominalTarget = r.nominalFee || 0;
										const sisaFee = Math.max(0, nominalTarget - totalCair);
										const isFullyPaid =
											(nominalTarget > 0 && totalCair >= nominalTarget) ||
											(logs.length === 0 &&
												r.statusPencairan === "sudah_dibayarkan");
										const isPartial = totalCair > 0 && !isFullyPaid;
										const percentCair =
											nominalTarget > 0
												? Math.min(
														100,
														Math.round((totalCair / nominalTarget) * 100),
													)
												: 0;

										return (
											<TableRow
												key={r.id}
												className="hover:bg-slate-50/70 transition-colors border-b border-slate-100"
											>
												<TableCell className="py-3">
													<div className="flex flex-col gap-1 items-start">
														<Badge
															variant="outline"
															className={`${styleCfg.bg} ${styleCfg.text} ${styleCfg.border} text-[11px] font-bold px-2 py-0.5`}
														>
															{r.kategori}
														</Badge>
														{(!r.nominalFee || r.nominalFee === 0) && (
															<Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] px-1.5 py-0.5">
																Baru dari PMB
															</Badge>
														)}
													</div>
												</TableCell>
												<TableCell className="py-3">
													<div className="font-bold text-slate-900 text-xs">
														{r.namaReferral}
													</div>
													{r.namaInstitusi && (
														<div className="text-[11px] text-blue-700 font-medium mt-0.5">
															Institusi:{" "}
															<span className="font-semibold">
																{r.namaInstitusi}
															</span>
														</div>
													)}
													{(r.namaBank || r.noRekening) && (
														<div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
															<CreditCard className="w-3 h-3 text-slate-400" />
															<span className="font-semibold text-slate-700">
																{r.namaBank || "Bank"}
															</span>
															<span>•</span>
															<span>{r.noRekening || "-"}</span>
														</div>
													)}
												</TableCell>
												<TableCell className="py-3">
													{r.noHp ? (
														<a
															href={`https://wa.me/${r.noHp.replace(/\D/g, "")}`}
															target="_blank"
															rel="noreferrer"
															className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-emerald-700 font-semibold transition-colors"
														>
															<MessageSquare className="w-3 h-3 text-emerald-600" />
															{r.noHp}
														</a>
													) : (
														<span className="text-slate-400 text-xs">-</span>
													)}
												</TableCell>
												<TableCell className="py-3">
													{isEditing ? (
														<div className="flex items-center gap-1">
															<span className="text-xs font-bold text-slate-400">
																Rp
															</span>
															<Input
																type="number"
																min={0}
																max={999999999}
																maxLength={9}
																placeholder="0"
																value={
																	r.nominalFee === 0 || r.nominalFee === "0"
																		? ""
																		: (r.nominalFee ?? "")
																}
																onKeyDown={preventFinanceIntegerKey}
																onChange={(e) =>
																	handleLocalNominalChange(
																		r.id,
																		filterFinanceIntegerString(e.target.value),
																	)
																}
																onBlur={() =>
																	handleUpdateFee(
																		r.id,
																		Math.max(0, Number(r.nominalFee) || 0),
																	)
																}
																disabled={!canEdit || isFullyPaid}
																className="w-28 h-8 text-xs font-bold bg-white text-slate-900 shadow-2xs"
															/>
														</div>
													) : (
														<div>
															<div className="font-black text-xs text-slate-900">
																{formatRupiah(r.nominalFee || 0)}
															</div>
															<div className="text-[10px] text-slate-400 font-medium">
																Porsi: {proporsi.toFixed(0)}%
															</div>
														</div>
													)}
												</TableCell>
												<TableCell className="py-3">
													<div>
														<div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
															<span>{formatRupiah(totalCair)}</span>
															{nominalTarget > 0 && (
																<span className="text-[11px] font-semibold text-slate-400">
																	({percentCair}%)
																</span>
															)}
														</div>
														{nominalTarget > 0 && (
															<div className="mt-1 space-y-1">
																<div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
																	<div
																		className={`h-full ${
																			isFullyPaid
																				? "bg-emerald-500"
																				: "bg-blue-600"
																		} transition-all`}
																		style={{ width: `${percentCair}%` }}
																	/>
																</div>
																<p className="text-[10px] text-slate-500">
																	Sisa:{" "}
																	<strong
																		className={
																			sisaFee > 0
																				? "text-rose-600"
																				: "text-emerald-700"
																		}
																	>
																		{formatRupiah(sisaFee)}
																	</strong>
																</p>
															</div>
														)}
													</div>
												</TableCell>
												<TableCell className="py-3">
													{isFullyPaid ? (
														<Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-[10px] font-bold">
															<CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />{" "}
															Lunas (100%)
														</Badge>
													) : isPartial ? (
														<Badge className="bg-blue-50 text-[#0517B0] hover:bg-blue-50 border-blue-200 text-[10px] font-bold">
															<Clock className="w-3 h-3 mr-1 text-[#0517B0]" />{" "}
															Cair Sebagian
														</Badge>
													) : (
														<Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200 text-[10px] font-bold">
															<Clock className="w-3 h-3 mr-1 text-amber-600" />{" "}
															Belum Cair
														</Badge>
													)}
												</TableCell>
												<TableCell className="py-3">
													{r.invoiceFileUrl ? (
														<div className="flex items-center gap-1.5">
															<Button
																variant="outline"
																size="sm"
																className="h-7 text-xs font-medium text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/10 gap-1.5 cursor-pointer shadow-2xs"
																title="Review Dokumen Invoice"
																onClick={() => {
																	const invoiceUrl = `/students/${studentId}/pmb/fee-share-recipients/${r.id}/invoice`;
																	const invoiceName = `Invoice - ${r.namaReferral} (${r.kategori}).pdf`;
																	openDocumentReview(
																		studentId,
																		invoiceUrl,
																		invoiceName,
																		r.id,
																	);
																}}
															>
																<Eye className="w-3.5 h-3.5" />
																<span>Review</span>
															</Button>
															{canEdit && isEditing && !isFullyPaid && (
																<label
																	className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-[#0517B0] cursor-pointer border border-dashed border-slate-300 rounded-lg px-2 py-1 bg-slate-50 hover:bg-blue-50/50 transition-colors"
																	title="Ganti Berkas Invoice (PDF)"
																>
																	{uploadingId === r.id ? (
																		<Loader2 className="w-3 h-3 animate-spin text-[#0517B0]" />
																	) : (
																		<UploadCloud className="w-3 h-3 text-[#0517B0]" />
																	)}
																	<span className="font-semibold">Ganti</span>
																	<input
																		type="file"
																		accept="application/pdf"
																		className="hidden"
																		onChange={(e) => {
																			const file = e.target.files?.[0];
																			if (file) handleInvoiceUpload(r.id, file);
																		}}
																	/>
																</label>
															)}
														</div>
													) : canEdit && isEditing ? (
														<label className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0517B0] cursor-pointer border border-dashed border-slate-300 rounded-lg px-2.5 py-1 bg-slate-50 hover:bg-blue-50/50 transition-colors">
															{uploadingId === r.id ? (
																<Loader2 className="w-3 h-3 animate-spin text-[#0517B0]" />
															) : (
																<UploadCloud className="w-3 h-3 text-[#0517B0]" />
															)}
															<span className="text-[11px] font-semibold">
																Upload PDF
															</span>
															<input
																type="file"
																accept="application/pdf"
																className="hidden"
																onChange={(e) => {
																	const file = e.target.files?.[0];
																	if (file) handleInvoiceUpload(r.id, file);
																}}
															/>
														</label>
													) : (
														<span className="text-xs text-slate-400 font-medium">
															-
														</span>
													)}
												</TableCell>
												<TableCell className="py-3 text-right">
													<div className="flex items-center justify-end gap-1.5">
														{canEdit && !isFullyPaid && (
															<Button
																size="sm"
																onClick={() => handleOpenDisburseModal(r)}
																className="h-7.5 text-xs font-semibold rounded-lg bg-[#0517B0] hover:bg-blue-800 text-white shadow-2xs gap-1 cursor-pointer"
															>
																<Plus className="w-3.5 h-3.5" />
																<span>Cairkan Termin</span>
															</Button>
														)}

														{logs.length > 0 && (
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleOpenLogsModal(r)}
																className="h-7.5 text-xs font-semibold rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 shadow-2xs gap-1 cursor-pointer"
															>
																<FileText className="w-3.5 h-3.5 text-slate-500" />
																<span>Riwayat ({logs.length})</span>
															</Button>
														)}

														{logs.length === 0 && canEdit && (
															<Button
																variant={
																	r.statusPencairan === "sudah_dibayarkan"
																		? "outline"
																		: "default"
																}
																size="sm"
																disabled={!isEditing}
																onClick={() =>
																	handleUpdateStatus(
																		r.id,
																		r.statusPencairan !== "sudah_dibayarkan",
																	)
																}
																className={`h-7.5 text-xs font-semibold rounded-lg shadow-2xs cursor-pointer ${
																	r.statusPencairan === "sudah_dibayarkan"
																		? "border-slate-300 text-slate-700 hover:bg-slate-100"
																		: "bg-emerald-600 hover:bg-emerald-700 text-white"
																}`}
															>
																{r.statusPencairan === "sudah_dibayarkan"
																	? "Batalkan"
																	: "Tandai Cair"}
															</Button>
														)}
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* ─── 3. MODAL ATUR TOTAL BIAYA PROMOSI & IKLAN ─── */}
			<Dialog open={isPromosiModalOpen} onOpenChange={setIsPromosiModalOpen}>
				<DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
					<DialogHeader className="space-y-1.5">
						<div className="flex items-center gap-2.5">
							<div className="p-2 bg-blue-50 text-[#0517B0] rounded-xl border border-blue-100 shadow-2xs">
								<Megaphone className="w-5 h-5" />
							</div>
							<div>
								<DialogTitle className="text-base font-bold text-slate-900">
									Atur Total Biaya Promosi & Iklan
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-500">
									Tentukan pagu anggaran promosi & fee sharing untuk mahasiswa
									ini.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="space-y-4 py-3">
						<div className="space-y-1.5">
							<label className="text-xs font-bold text-slate-700">
								Nominal Total Biaya Promosi (Rp)
							</label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
									Rp
								</span>
								<Input
									type="number"
									min={0}
									max={999999999}
									maxLength={9}
									placeholder="0"
									value={tempPromosiInput}
									onKeyDown={preventFinanceIntegerKey}
									onChange={(e) =>
										setTempPromosiInput(
											filterFinanceIntegerString(e.target.value),
										)
									}
									className="pl-9 font-black text-sm h-10 bg-slate-50/50 border-slate-200 rounded-lg text-slate-900 focus:bg-white transition-all shadow-2xs"
								/>
							</div>
						</div>

						{/* Quick Preset Buttons */}
						<div className="space-y-1.5">
							<span className="text-[11px] font-semibold text-slate-500">
								Preset Nominal Cepat:
							</span>
							<div className="flex flex-wrap gap-1.5">
								{[500000, 1000000, 1500000, 2000000, 2500000, 3000000].map(
									(nominal) => (
										<button
											key={nominal}
											type="button"
											onClick={() => setTempPromosiInput(nominal.toString())}
											className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-[#0517B0] hover:border-blue-200 text-slate-700 rounded-md border border-slate-200 transition-all cursor-pointer"
										>
											{formatRupiah(nominal)}
										</button>
									),
								)}
							</div>
						</div>

						{/* Live Allocation Preview in Modal */}
						<div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2">
							<div className="flex items-center justify-between text-xs">
								<span className="text-slate-500 font-medium">
									Total Terbagi Saat Ini:
								</span>
								<span className="font-bold text-slate-800">
									{formatRupiah(totalFeeTerbagi)}
								</span>
							</div>
							<div className="flex items-center justify-between text-xs">
								<span className="text-slate-500 font-medium">
									Estimasi Sisa Alokasi:
								</span>
								<span
									className={`font-bold ${
										(Number(tempPromosiInput) || 0) - totalFeeTerbagi >= 0
											? "text-emerald-700"
											: "text-rose-600"
									}`}
								>
									{formatRupiah(
										(Number(tempPromosiInput) || 0) - totalFeeTerbagi,
									)}
								</span>
							</div>
						</div>
					</div>

					<DialogFooter className="flex gap-2 sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsPromosiModalOpen(false)}
							disabled={isSavingPromosi}
							className="text-xs h-9 rounded-lg font-semibold border-slate-200 shadow-2xs"
						>
							Batal
						</Button>
						<Button
							type="button"
							onClick={handleSaveTotalPromosi}
							disabled={isSavingPromosi}
							className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs h-9 rounded-lg font-semibold shadow-2xs gap-1.5"
						>
							{isSavingPromosi ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									Menyimpan...
								</>
							) : (
								"Simpan Anggaran"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ─── 4. MODAL PENCAIRAN TERMIN FEE SHARING (BERTAHAP) ─── */}
			<Dialog open={isDisburseModalOpen} onOpenChange={setIsDisburseModalOpen}>
				<DialogContent className="max-w-lg bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
					<DialogHeader className="space-y-1.5">
						<div className="flex items-center gap-2.5">
							<div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shadow-2xs">
								<CreditCard className="w-5 h-5" />
							</div>
							<div>
								<DialogTitle className="text-base font-bold text-slate-900">
									{editingLogId
										? `Edit Pencairan Fee Sharing (Termin ${disburseTerminNumber})`
										: `Pencairan Fee Sharing (Termin ${disburseTerminNumber})`}
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-500">
									{editingLogId
										? "Perbarui rincian termin pencairan fee, nominal, atau bukti transfer."
										: "Catat pencairan bertahap untuk mitra/referral disertai bukti transfer bank (PDF)."}
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					{selectedRecipientForDisburse &&
						(() => {
							const logs = selectedRecipientForDisburse.disbursementLogs || [];
							const totalCair = logs.reduce(
								(sum: number, l: any) => sum + (l.amount || 0),
								0,
							);
							const nominalTarget =
								selectedRecipientForDisburse.nominalFee || 0;
							const sisaFee = Math.max(0, nominalTarget - totalCair);

							return (
								<div className="space-y-4 py-2">
									{/* Recipient summary banner */}
									<div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
										<div className="flex items-center justify-between">
											<span className="text-xs font-bold text-slate-900">
												{selectedRecipientForDisburse.namaReferral}
											</span>
											<Badge
												variant="outline"
												className="text-[10px] font-bold"
											>
												{selectedRecipientForDisburse.kategori}
											</Badge>
										</div>
										{(selectedRecipientForDisburse.namaBank ||
											selectedRecipientForDisburse.noRekening) && (
											<p className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
												<CreditCard className="w-3.5 h-3.5 text-slate-400" />
												{selectedRecipientForDisburse.namaBank || "Bank"} •{" "}
												{selectedRecipientForDisburse.noRekening || "-"}
											</p>
										)}
										<div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/80 text-[11px]">
											<div>
												<span className="text-slate-400 block">
													Total Komitmen:
												</span>
												<span className="font-bold text-slate-800">
													{formatRupiah(nominalTarget)}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block">
													Sudah Cair:
												</span>
												<span className="font-bold text-emerald-700">
													{formatRupiah(totalCair)}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block">Sisa Fee:</span>
												<span className="font-bold text-rose-600">
													{formatRupiah(sisaFee)}
												</span>
											</div>
										</div>
									</div>

									{/* Input Termin Number & Nominal */}
									<div className="grid grid-cols-3 gap-3">
										<div className="space-y-1">
											<label className="text-xs font-bold text-slate-700">
												Nomor Termin
											</label>
											<Input
												type="number"
												min={1}
												value={disburseTerminNumber}
												onChange={(e) =>
													setDisburseTerminNumber(
														Math.max(1, Number(e.target.value) || 1),
													)
												}
												className="h-9 text-xs font-bold text-center"
											/>
										</div>
										<div className="col-span-2 space-y-1">
											<label className="text-xs font-bold text-slate-700">
												Nominal Pencairan (Rp) *
											</label>
											<Input
												type="number"
												min={1}
												placeholder="0"
												value={disburseAmount}
												onKeyDown={preventFinanceIntegerKey}
												onChange={(e) =>
													setDisburseAmount(
														filterFinanceIntegerString(e.target.value),
													)
												}
												className="h-9 text-xs font-black text-slate-900"
											/>
										</div>
									</div>

									{/* Quick Shortcut Buttons */}
									{nominalTarget > 0 && (
										<div className="flex flex-wrap gap-1.5">
											<span className="text-[11px] font-semibold text-slate-500 w-full">
												Pilihan Cepat:
											</span>
											{totalCair === 0 && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														setDisburseAmount(
															Math.round(nominalTarget * 0.5).toString(),
														)
													}
													className="text-[11px] h-7 px-2.5 font-semibold border-blue-200 text-[#0517B0] hover:bg-blue-50 cursor-pointer"
												>
													Termin 1: 50% (
													{formatRupiah(Math.round(nominalTarget * 0.5))})
												</Button>
											)}
											{sisaFee > 0 && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => setDisburseAmount(sisaFee.toString())}
													className="text-[11px] h-7 px-2.5 font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
												>
													Pelunasan Sisa ({formatRupiah(sisaFee)})
												</Button>
											)}
										</div>
									)}

									{/* Tanggal Pencairan */}
									<div className="space-y-1">
										<label className="text-xs font-bold text-slate-700">
											Tanggal Transfer
										</label>
										<Input
											type="date"
											value={disburseDate}
											onChange={(e) => setDisburseDate(e.target.value)}
											className="h-9 text-xs"
										/>
									</div>

									{/* Bukti Transfer Bank (PDF) */}
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-slate-700 flex items-center justify-between">
											<span>Bukti Transfer Bank (Format PDF)</span>
											<span className="text-[10px] text-slate-400">
												Maks. 5MB
											</span>
										</label>
										<Input
											type="file"
											accept=".pdf,application/pdf"
											onChange={(e) => {
												const f = e.target.files?.[0];
												if (f) {
													if (
														f.type !== "application/pdf" &&
														!f.name.endsWith(".pdf")
													) {
														toast.error(
															"Bukti transfer wajib berformat PDF (.pdf)",
														);
														return;
													}
													if (f.size > 5 * 1024 * 1024) {
														toast.error("Ukuran file maksimal 5MB");
														return;
													}
													setDisburseProofFile(f);
												}
											}}
											className="text-xs h-9 bg-white file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#0517B0] cursor-pointer"
										/>
										{disburseProofFile && (
											<p className="text-[11px] text-emerald-700 font-medium">
												✓ Berkas terpilih: {disburseProofFile.name} (
												{(disburseProofFile.size / 1024).toFixed(0)} KB)
											</p>
										)}
									</div>

									{/* Catatan Transfer */}
									<div className="space-y-1">
										<label className="text-xs font-bold text-slate-700">
											Catatan / Keterangan Transfer (Opsional)
										</label>
										<Input
											placeholder="Contoh: Transfer via Rekening BTN / BNI Nusadaya"
											value={disburseNotes}
											onChange={(e) => setDisburseNotes(e.target.value)}
											className="h-9 text-xs"
										/>
									</div>
								</div>
							);
						})()}

					<DialogFooter className="flex gap-2 sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsDisburseModalOpen(false)}
							disabled={isSubmittingDisburse}
							className="text-xs h-9 rounded-lg"
						>
							Batal
						</Button>
						<Button
							type="button"
							onClick={handleSubmitDisburse}
							disabled={
								isSubmittingDisburse ||
								!disburseAmount ||
								Number(disburseAmount) <= 0
							}
							className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs h-9 rounded-lg font-bold shadow-xs gap-1.5"
						>
							{isSubmittingDisburse ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									Memproses...
								</>
							) : (
								<>
									<CheckCircle2 className="w-3.5 h-3.5" />
									{editingLogId ? "Simpan Perubahan" : "Simpan Pencairan"}
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ─── 5. MODAL RIWAYAT PENCAIRAN TERMIN FEE SHARING ─── */}
			<Dialog open={isLogsModalOpen} onOpenChange={setIsLogsModalOpen}>
				<DialogContent className="max-w-2xl bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
					<DialogHeader className="space-y-1.5">
						<div className="flex items-center gap-2.5">
							<div className="p-2 bg-blue-50 text-[#0517B0] rounded-xl border border-blue-100 shadow-2xs">
								<FileText className="w-5 h-5" />
							</div>
							<div>
								<DialogTitle className="text-base font-bold text-slate-900">
									Riwayat Pencairan Termin Fee Sharing
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-500">
									Daftar seluruh termin pencairan dana fee sharing beserta bukti
									transfer bank.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					{selectedRecipientLogs &&
						(() => {
							const logs = selectedRecipientLogs.disbursementLogs || [];
							const totalCair = logs.reduce(
								(sum: number, l: any) => sum + (l.amount || 0),
								0,
							);
							const nominalTarget = selectedRecipientLogs.nominalFee || 0;
							const sisaFee = Math.max(0, nominalTarget - totalCair);

							return (
								<div className="space-y-4 py-2">
									<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
										<div>
											<span className="font-bold text-slate-900">
												{selectedRecipientLogs.namaReferral}
											</span>
											<span className="text-slate-400 ml-2">
												({selectedRecipientLogs.kategori})
											</span>
										</div>
										<div className="flex items-center gap-3">
											<span>
												Total Cair:{" "}
												<strong className="text-emerald-700">
													{formatRupiah(totalCair)}
												</strong>
											</span>
											<span>
												Sisa:{" "}
												<strong
													className={
														sisaFee > 0 ? "text-rose-600" : "text-emerald-700"
													}
												>
													{formatRupiah(sisaFee)}
												</strong>
											</span>
										</div>
									</div>

									{logs.length === 0 ? (
										<div className="p-8 text-center text-xs text-slate-400">
											Belum ada riwayat pencairan termin untuk penerima ini.
										</div>
									) : (
										<div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
											{logs.map((log: any) => (
												<div
													key={log.id}
													className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
												>
													<div className="flex items-start gap-3 min-w-0">
														<div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0517B0] flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
															T{log.terminNumber}
														</div>
														<div className="min-w-0">
															<div className="flex items-center gap-2">
																<span className="font-black text-xs text-slate-900">
																	{formatRupiah(log.amount)}
																</span>
																<span className="text-[11px] text-slate-400">
																	• {formatDate(log.disbursedAt)}
																</span>
															</div>
															{log.notes && (
																<p className="text-[11px] text-slate-600 mt-0.5 font-medium">
																	Catatan: {log.notes}
																</p>
															)}
															{log.disbursedByUser?.fullName && (
																<p className="text-[10px] text-slate-400 mt-0.5">
																	Dicairkan oleh: {log.disbursedByUser.fullName}
																</p>
															)}
														</div>
													</div>

													<div className="flex items-center gap-2 shrink-0">
														{log.transferProofUrl ? (
															<Button
																type="button"
																variant="outline"
																size="sm"
																onClick={() =>
																	openDocumentReview(
																		studentId,
																		log.transferProofUrl,
																		log.transferProofFileName ||
																			`Bukti_Transfer_Termin_${log.terminNumber}_${selectedRecipientLogs.namaReferral}.pdf`,
																		`fee-termin-${log.id}`,
																	)
																}
																className="h-8 text-xs font-semibold text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/10 gap-1.5 cursor-pointer shadow-2xs"
																title="Review Dokumen Bukti Transfer"
															>
																<Eye className="w-3.5 h-3.5 text-[#0517B0]" />
																<span>Review Bukti</span>
															</Button>
														) : (
															<span className="text-[11px] text-slate-400 italic">
																Tanpa berkas
															</span>
														)}

														{canEdit && (
															<div className="flex items-center gap-1">
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	onClick={() => {
																		setIsLogsModalOpen(false);
																		handleOpenEditLog(
																			selectedRecipientLogs,
																			log,
																		);
																	}}
																	className="h-8 w-8 p-0 text-slate-500 hover:text-[#0517B0] hover:bg-blue-50 cursor-pointer"
																	title="Edit pencairan termin ini"
																>
																	<Edit2 className="w-3.5 h-3.5" />
																</Button>
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	disabled={deletingLogId === log.id}
																	onClick={() => handleRequestDeleteLog(log.id)}
																	className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
																	title="Hapus pencairan termin ini"
																>
																	{deletingLogId === log.id ? (
																		<Loader2 className="w-3.5 h-3.5 animate-spin" />
																	) : (
																		<Trash2 className="w-3.5 h-3.5" />
																	)}
																</Button>
															</div>
														)}
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							);
						})()}

					<DialogFooter className="flex items-center justify-between gap-2 sm:justify-between w-full">
						<div>
							{selectedRecipientLogs &&
								(() => {
									const logs = selectedRecipientLogs.disbursementLogs || [];
									const totalCair = logs.reduce(
										(sum: number, l: any) => sum + (l.amount || 0),
										0,
									);
									const sisaFee = Math.max(
										0,
										(selectedRecipientLogs.nominalFee || 0) - totalCair,
									);
									if (sisaFee > 0 && canEdit) {
										return (
											<Button
												type="button"
												size="sm"
												onClick={() => {
													setIsLogsModalOpen(false);
													handleOpenDisburseModal(selectedRecipientLogs);
												}}
												className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs h-9 rounded-lg font-bold shadow-xs gap-1.5 cursor-pointer"
											>
												<Plus className="w-3.5 h-3.5" />+ Tambah Termin
												Pencairan
											</Button>
										);
									}
									return null;
								})()}
						</div>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsLogsModalOpen(false)}
							className="text-xs h-9 rounded-lg cursor-pointer"
						>
							Tutup
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ─── 6. KONFIRMASI HAPUS PENCAIRAN TERMIN FEE SHARING ─── */}
			<AlertDialog
				open={logToDelete !== null}
				onOpenChange={(open) => !open && setLogToDelete(null)}
			>
				<AlertDialogContent className="bg-white rounded-2xl max-w-md border-slate-200 shadow-xl">
					<AlertDialogHeader>
						<div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-1 border border-rose-100">
							<AlertTriangle className="w-5 h-5" />
						</div>
						<AlertDialogTitle className="text-base font-bold text-slate-900">
							Hapus Pencairan Termin?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
							Apakah Anda yakin ingin membatalkan dan menghapus data pencairan
							termin ini? Nominal yang dibatalkan akan otomatis dikembalikan ke
							sisa tagihan fee sharing mitra/referral.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex gap-2 sm:justify-end mt-3">
						<AlertDialogCancel
							disabled={deletingLogId !== null}
							className="text-xs h-9 rounded-lg"
						>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDeleteLog}
							disabled={deletingLogId !== null}
							className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 rounded-lg font-bold shadow-xs gap-1.5"
						>
							{deletingLogId !== null ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									Menghapus...
								</>
							) : (
								"Ya, Hapus Termin"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* File Preview Dialog */}
			<FilePreviewDialog
				open={isPreviewOpen}
				onOpenChange={setIsPreviewOpen}
				fileUrl={previewFileUrl}
				title={previewFileName}
			/>
		</div>
	);
}
