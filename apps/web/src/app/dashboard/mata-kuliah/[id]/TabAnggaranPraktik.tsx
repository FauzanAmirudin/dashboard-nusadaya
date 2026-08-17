"use client";

import {
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	DollarSign,
	Download,
	Edit,
	Edit2,
	FileText,
	Loader2,
	PackageCheck,
	Plus,
	RefreshCw,
	Save,
	Trash2,
	UploadCloud,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getToken } from "@/lib/eden";
import { useAuthStore } from "@/store";
import { formatRupiah } from "@/utils/format";

interface ItemKebutuhan {
	namaItem: string;
	jumlah: number;
	satuan: string;
	satuanHarga: number;
}

interface ItemSisaBahan {
	namaItem: string;
	jumlahSisa: number;
	satuan: string;
	kondisi: string;
}

interface BudgetRequest {
	id: number;
	dosenId: number;
	daftarKebutuhan: ItemKebutuhan[];
	totalNominal: number;
	status: string; // "menunggu" | "disetujui" | "ditolak"
	catatanFinance?: string | null;
	createdAt: string;
}

interface MaterialReport {
	id: number;
	budgetRequestId: number;
	daftarSisaBahan: ItemSisaBahan[];
	catatanDosen?: string;
	fileUrl?: string;
	fileName?: string;
	createdAt: string;
}

interface TabAnggaranPraktikProps {
	courseId: string;
	canEdit: boolean;
}

export function TabAnggaranPraktik({
	courseId,
	canEdit,
}: TabAnggaranPraktikProps) {
	const { token } = useAuthStore();
	const authToken = token || getToken();
	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const [requests, setRequests] = useState<BudgetRequest[]>([]);
	const [reports, setReports] = useState<MaterialReport[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// Panel Edit Mode States (matching standard dashboard behavior)
	const [isEditingRequests, setIsEditingRequests] = useState(false);
	const [isEditingReports, setIsEditingReports] = useState(false);

	// Modal State Section 1: Pengajuan / Revisi
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
	const [items, setItems] = useState<ItemKebutuhan[]>([
		{ namaItem: "", jumlah: 1, satuan: "pcs", satuanHarga: 0 },
	]);

	// Modal State Section 2: Laporan Sisa Bahan
	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [editingReportId, setEditingReportId] = useState<number | null>(null);
	const [selectedRequestId, setSelectedRequestId] = useState<string>("");
	const [sisaItems, setSisaItems] = useState<ItemSisaBahan[]>([
		{ namaItem: "", jumlahSisa: 0, satuan: "pcs", kondisi: "Baik" },
	]);
	const [catatanDosen, setCatatanDosen] = useState("");
	const [reportFile, setReportFile] = useState<File | null>(null);

	const fetchRequests = async () => {
		try {
			const res = await fetch(
				`${API_URL}/courses/${courseId}/budget-requests`,
				{
					headers: { Authorization: `Bearer ${authToken}` },
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success) setRequests(json.data || []);
			}
		} catch (error) {
			console.error("Failed to fetch budget requests", error);
		}
	};

	const fetchReports = async () => {
		try {
			const res = await fetch(`${API_URL}/dosen/laporan-sisa-bahan`, {
				headers: { Authorization: `Bearer ${authToken}` },
			});
			if (res.ok) {
				const json = await res.json();
				if (json.success) setReports(json.data || []);
			}
		} catch (error) {
			console.error("Failed to fetch material reports", error);
		}
	};

	useEffect(() => {
		if (!courseId) return;
		setIsLoading(true);
		fetchRequests().finally(() => setIsLoading(false));
	}, [token, courseId]);

	// Calculate Total Nominal of Budget Request
	const totalNominalCalculated = items.reduce(
		(sum, item) =>
			sum + (Number(item.jumlah) || 0) * (Number(item.satuanHarga) || 0),
		0,
	);

	const handleAddItem = () => {
		setItems([
			...items,
			{ namaItem: "", jumlah: 1, satuan: "pcs", satuanHarga: 0 },
		]);
	};

	const handleRemoveItem = (index: number) => {
		if (items.length <= 1) return;
		setItems(items.filter((_, i) => i !== index));
	};

	const handleItemChange = (
		index: number,
		field: keyof ItemKebutuhan,
		val: any,
	) => {
		const updated = [...items];
		updated[index] = { ...updated[index], [field]: val };
		setItems(updated);
	};

	const handleOpenNewModal = () => {
		setEditingRequestId(null);
		setItems([{ namaItem: "", jumlah: 1, satuan: "pcs", satuanHarga: 0 }]);
		setIsModalOpen(true);
	};

	const handleOpenRevisiModal = (req: BudgetRequest) => {
		setEditingRequestId(req.id);
		setItems(
			req.daftarKebutuhan && req.daftarKebutuhan.length > 0
				? req.daftarKebutuhan
				: [{ namaItem: "", jumlah: 1, satuan: "pcs", satuanHarga: 0 }],
		);
		setIsModalOpen(true);
	};

	const handleSaveBudgetRequest = async () => {
		if (items.some((i) => !i.namaItem.trim() || i.satuanHarga <= 0)) {
			toast.error("Lengkapi rincian nama barang dan harga nominal per-item");
			return;
		}

		setIsSaving(true);
		try {
			const payload = {
				daftarKebutuhan: items,
				totalNominal: totalNominalCalculated,
			};

			const endpoint = editingRequestId
				? `${API_URL}/courses/${courseId}/budget-requests/${editingRequestId}`
				: `${API_URL}/courses/${courseId}/budget-requests`;
			const method = editingRequestId ? "PUT" : "POST";

			const res = await fetch(endpoint, {
				method,
				headers: {
					Authorization: `Bearer ${authToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			const json = await res.json();
			if (res.ok && json.success) {
				toast.success(
					editingRequestId
						? "Revisi pengajuan anggaran berhasil dikirimkan ke Finance"
						: "Pengajuan anggaran praktik berhasil diajukan",
				);
				setIsModalOpen(false);
				fetchRequests();
			} else {
				toast.error(json.message || "Gagal menyimpan pengajuan anggaran");
			}
		} catch (error: any) {
			console.error("Save budget request error:", error);
			toast.error(
				error?.message || "Terjadi kesalahan saat menyimpan pengajuan",
			);
		} finally {
			setIsSaving(false);
		}
	};

	// Custom Delete Confirmation Modal State
	const [deleteTarget, setDeleteTarget] = useState<{
		type: "request" | "report";
		id: number;
		name: string;
	} | null>(null);

	const confirmDelete = async () => {
		if (!deleteTarget) return;
		setIsSaving(true);
		try {
			if (deleteTarget.type === "request") {
				const res = await fetch(
					`${API_URL}/courses/${courseId}/budget-requests/${deleteTarget.id}`,
					{
						method: "DELETE",
						headers: { Authorization: `Bearer ${authToken}` },
					},
				);
				const json = await res.json();
				if (res.ok && json.success) {
					toast.success("Pengajuan anggaran berhasil dihapus");
					setDeleteTarget(null);
					fetchRequests();
				} else {
					toast.error(json.message || "Gagal menghapus pengajuan anggaran");
				}
			} else {
				// (Not actually implemented in this scope because report delete isn't fully migrated yet, but let's mock the endpoint anyway)
				const res = await fetch(
					`${API_URL}/courses/${courseId}/budget-requests/${deleteTarget.id}/report`, // Delete by report ID
					{
						method: "DELETE",
						headers: { Authorization: `Bearer ${authToken}` },
					},
				);
				const json = await res.json();
				if (res.ok && json.success) {
					toast.success("Laporan sisa bahan berhasil dihapus");
					setDeleteTarget(null);
					fetchRequests();
				} else {
					toast.error(json.message || "Gagal menghapus laporan sisa bahan");
				}
			}
		} catch (e: any) {
			console.error("Delete error:", e);
			toast.error("Terjadi kesalahan saat menghapus data");
		} finally {
			setIsSaving(false);
		}
	};

	// Section 2: Material Report Handlers
	const handleOpenNewReportModal = () => {
		setEditingReportId(null);
		setSelectedRequestId("");
		setSisaItems([
			{ namaItem: "", jumlahSisa: 0, satuan: "pcs", kondisi: "Baik" },
		]);
		setCatatanDosen("");
		setReportFile(null);
		setIsReportModalOpen(true);
	};

	const handleOpenEditReportModal = (rep: MaterialReport) => {
		setEditingReportId(rep.id);
		setSelectedRequestId(rep.budgetRequestId.toString());
		setSisaItems(
			rep.daftarSisaBahan && rep.daftarSisaBahan.length > 0
				? rep.daftarSisaBahan
				: [{ namaItem: "", jumlahSisa: 0, satuan: "pcs", kondisi: "Baik" }],
		);
		setCatatanDosen(rep.catatanDosen || "");
		setReportFile(null);
		setIsReportModalOpen(true);
	};

	const handleAddSisaItem = () => {
		setSisaItems([
			...sisaItems,
			{ namaItem: "", jumlahSisa: 0, satuan: "pcs", kondisi: "Baik" },
		]);
	};

	const handleRemoveSisaItem = (index: number) => {
		if (sisaItems.length <= 1) return;
		setSisaItems(sisaItems.filter((_, i) => i !== index));
	};

	const handleSisaItemChange = (
		index: number,
		field: keyof ItemSisaBahan,
		val: any,
	) => {
		const updated = [...sisaItems];
		updated[index] = { ...updated[index], [field]: val };
		setSisaItems(updated);
	};

	const handleSaveMaterialReport = async () => {
		if (!selectedRequestId) {
			toast.error("Pilih pengajuan praktik terlebih dahulu");
			return;
		}
		if (sisaItems.some((i) => !i.namaItem.trim())) {
			toast.error("Lengkapi rincian nama sisa bahan");
			return;
		}

		setIsSaving(true);
		try {
			const formData = new FormData();
			formData.append("budgetRequestId", selectedRequestId);
			formData.append("daftarSisaBahan", JSON.stringify(sisaItems));
			formData.append("catatanDosen", catatanDosen);
			if (reportFile) {
				formData.append("file", reportFile);
			}

			const endpoint = editingReportId
				? `${API_URL}/dosen/laporan-sisa-bahan/${editingReportId}`
				: `${API_URL}/dosen/laporan-sisa-bahan`;
			const method = editingReportId ? "PUT" : "POST";

			const res = await fetch(endpoint, {
				method,
				headers: { Authorization: `Bearer ${authToken}` },
				body: formData,
			});

			const json = await res.json();
			if (res.ok && json.success) {
				toast.success(
					editingReportId
						? "Laporan sisa bahan praktikum berhasil diperbarui"
						: "Laporan sisa bahan praktikum berhasil diunggah",
				);
				setIsReportModalOpen(false);
				setSelectedRequestId("");
				setCatatanDosen("");
				setReportFile(null);
				setEditingReportId(null);
				fetchReports();
			} else {
				toast.error(json.message || "Gagal menyimpan laporan sisa bahan");
			}
		} catch (error: any) {
			console.error("Save material report error:", error);
			toast.error(
				error?.message || "Terjadi kesalahan saat menyimpan laporan sisa bahan",
			);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center p-12">
				<Loader2 className="w-8 h-8 animate-spin text-slate-400" />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* SECTION 1: Pengajuan & Revisi Anggaran Praktik */}
			<Card className="border border-slate-200 shadow-sm">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<DollarSign className="w-4 h-4 text-emerald-600" />
							1. Pengajuan & Revisi Anggaran Praktik
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Pengajuan belanja kebutuhan praktik secara berkala dan pemantauan
							status persetujuan Finance.
						</p>
					</div>
					{canEdit && (
						<div className="flex items-center gap-2">
							{!isEditingRequests ? (
								<Button
									onClick={() => setIsEditingRequests(true)}
									size="sm"
									className="bg-[#0517B0] hover:bg-[#04128d] text-white text-xs gap-1.5 h-8 font-bold"
								>
									<Edit2 className="w-3.5 h-3.5" />
									Edit Data
								</Button>
							) : (
								<>
									<Button
										onClick={handleOpenNewModal}
										size="sm"
										className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 h-8 font-bold"
									>
										<Plus className="w-3.5 h-3.5" />
										Buat Pengajuan Baru
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsEditingRequests(false)}
										className="text-xs h-8 border-slate-300 font-semibold"
									>
										Selesai Edit
									</Button>
								</>
							)}
						</div>
					)}
				</CardHeader>
				<CardContent className="p-5 space-y-4">
					{requests.length === 0 ? (
						<div className="text-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
							<DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
							<p className="text-sm font-medium text-slate-600">
								Belum ada pengajuan anggaran praktik
							</p>
							<p className="text-xs text-slate-400 mt-1">
								Klik &quot;Edit Data&quot; lalu &quot;Buat Pengajuan Baru&quot;
								untuk mengajukan rincian anggaran.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{requests.map((req, idx) => (
								<div
									key={req.id}
									className={`p-4 rounded-xl border transition-colors space-y-3 ${
										req.status === "ditolak"
											? "border-rose-200 bg-rose-50/30"
											: req.status === "disetujui"
												? "border-emerald-200 bg-emerald-50/20"
												: "border-slate-200 bg-slate-50/50"
									}`}
								>
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
										<div className="flex items-center gap-3">
											<span className="text-xs font-bold bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center">
												{idx + 1}
											</span>
											<div>
												<h4 className="text-sm font-bold text-slate-800">
													Pengajuan Anggaran #{req.id}
												</h4>
											</div>
										</div>
										<div className="flex items-center gap-3">
											{canEdit &&
												(isEditingRequests || req.status === "ditolak") && (
													<div className="flex items-center gap-1.5">
														<Button
															onClick={() => handleOpenRevisiModal(req)}
															size="sm"
															variant="outline"
															className="text-xs h-7 gap-1 border-slate-300 hover:bg-slate-100 font-semibold text-slate-700"
														>
															<Edit2 className="w-3.5 h-3.5 text-slate-600" />
															Edit Data
														</Button>
														<Button
															onClick={() =>
																setDeleteTarget({
																	type: "request",
																	id: req.id,
																	name: `Pengajuan #${req.id}`,
																})
															}
															size="sm"
															variant="outline"
															className="text-xs h-7 gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold"
														>
															<Trash2 className="w-3.5 h-3.5" />
															Hapus
														</Button>
													</div>
												)}
											{req.status === "disetujui" && (
												<Badge className="bg-emerald-500 text-white text-xs gap-1">
													<CheckCircle2 className="w-3.5 h-3.5" />
													Disetujui Finance
												</Badge>
											)}
											{req.status === "menunggu" && (
												<Badge className="bg-amber-500 text-white text-xs gap-1">
													<AlertCircle className="w-3.5 h-3.5" />
													Menunggu Review Finance
												</Badge>
											)}
											{req.status === "ditolak" && (
												<Badge variant="destructive" className="text-xs gap-1">
													<XCircle className="w-3.5 h-3.5" />
													Ditolak / Perlu Revisi
												</Badge>
											)}
										</div>
									</div>

									{/* List Rincian Barang */}
									<div className="space-y-2">
										<span className="text-xs font-bold text-slate-700 block">
											Rincian Pembelian:
										</span>
										<div className="bg-white rounded-lg border border-slate-200 overflow-hidden text-xs">
											<table className="w-full text-left">
												<thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
													<tr>
														<th className="p-2">Nama Barang / Bahan</th>
														<th className="p-2 text-center">Jumlah</th>
														<th className="p-2 text-right">Harga Satuan</th>
														<th className="p-2 text-right">Subtotal</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-slate-100">
													{req.daftarKebutuhan?.map((item, itemIdx) => (
														<tr key={itemIdx}>
															<td className="p-2 font-medium text-slate-800">
																{item.namaItem}
															</td>
															<td className="p-2 text-center text-slate-600">
																{item.jumlah} {item.satuan}
															</td>
															<td className="p-2 text-right text-slate-600">
																{formatRupiah(item.satuanHarga)}
															</td>
															<td className="p-2 text-right font-semibold text-slate-800">
																{formatRupiah(
																	(item.jumlah || 0) * (item.satuanHarga || 0),
																)}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
										<div className="flex justify-end pt-1">
											<span className="text-xs font-bold text-slate-800">
												Total Pengajuan:{" "}
												<span className="text-indigo-700 text-sm">
													{formatRupiah(req.totalNominal)}
												</span>
											</span>
										</div>
									</div>

									{/* Catatan Revisi Finance & Action Revisi */}
									{req.status === "ditolak" && (
										<div className="p-3 bg-rose-100/60 border border-rose-200 rounded-lg space-y-2">
											<div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
												<AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
												Catatan Perbaikan dari Finance:
											</div>
											<p className="text-xs text-rose-900 leading-relaxed pl-5 font-medium">
												{req.catatanFinance ||
													"Silakan periksa kembali rincian nominal dan jumlah kebutuhan barang."}
											</p>

											{canEdit && (
												<div className="pt-1 flex justify-end gap-2">
													<Button
														onClick={() =>
															setDeleteTarget({
																type: "request",
																id: req.id,
																name: `Pengajuan #${req.id}`,
															})
														}
														size="sm"
														variant="outline"
														className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs gap-1.5 h-8 font-bold"
													>
														<Trash2 className="w-3.5 h-3.5" />
														Hapus Pengajuan
													</Button>
													<Button
														onClick={() => handleOpenRevisiModal(req)}
														size="sm"
														className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 h-8 font-bold"
													>
														<RefreshCw className="w-3.5 h-3.5" />
														Revisi & Ajukan Ulang
													</Button>
												</div>
											)}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* SECTION 2: Laporan Sisa Bahan Praktik */}
			<Card className="border border-slate-200 shadow-sm">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<PackageCheck className="w-4 h-4 text-indigo-600" />
							2. Laporan Sisa Bahan Praktik
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Pendataan sisa material/bahan praktikum yang telah digunakan
							setelah kegiatan praktik selesai.
						</p>
					</div>
					{canEdit && (
						<div className="flex items-center gap-2">
							{!isEditingReports ? (
								<Button
									onClick={() => setIsEditingReports(true)}
									size="sm"
									className="bg-[#0517B0] hover:bg-[#04128d] text-white text-xs gap-1.5 h-8 font-bold"
								>
									<Edit2 className="w-3.5 h-3.5" />
									Edit Data
								</Button>
							) : (
								<>
									<Button
										onClick={handleOpenNewReportModal}
										size="sm"
										className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 h-8 font-bold"
									>
										<UploadCloud className="w-3.5 h-3.5" />
										Unggah Laporan Sisa Bahan
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsEditingReports(false)}
										className="text-xs h-8 border-slate-300 font-semibold"
									>
										Selesai Edit
									</Button>
								</>
							)}
						</div>
					)}
				</CardHeader>
				<CardContent className="p-5 space-y-4">
					{reports.length === 0 ? (
						<div className="text-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
							<PackageCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
							<p className="text-sm font-medium text-slate-600">
								Belum ada laporan sisa bahan
							</p>
							<p className="text-xs text-slate-400 mt-1">
								Klik &quot;Edit Data&quot; lalu &quot;Unggah Laporan Sisa
								Bahan&quot; untuk mendata sisa material.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{reports.map((rep, idx) => {
								const relatedReq = requests.find(
									(r) => r.id === rep.budgetRequestId,
								);
								return (
									<div
										key={rep.id}
										className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
									>
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
											<div className="flex items-center gap-3">
												<span className="text-xs font-bold bg-indigo-100 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center">
													{idx + 1}
												</span>
												<div>
													<h4 className="text-sm font-bold text-slate-800">
														{`Pengajuan #${rep.budgetRequestId}`}
													</h4>
													<span className="text-xs text-slate-500">
														Diunggah pada:{" "}
														{new Date(rep.createdAt).toLocaleDateString(
															"id-ID",
															{
																day: "numeric",
																month: "long",
																year: "numeric",
															},
														)}
													</span>
												</div>
											</div>

											<div className="flex items-center gap-2">
												{canEdit && isEditingReports && (
													<div className="flex items-center gap-1.5">
														<Button
															onClick={() => handleOpenEditReportModal(rep)}
															size="sm"
															variant="outline"
															className="text-xs h-7 gap-1 border-slate-300 hover:bg-slate-100 font-semibold text-slate-700"
														>
															<Edit2 className="w-3.5 h-3.5 text-slate-600" />
															Edit Laporan
														</Button>
														<Button
															onClick={() =>
																setDeleteTarget({
																	type: "report",
																	id: rep.id,
																	name: `Laporan #${rep.budgetRequestId}`,
																})
															}
															size="sm"
															variant="outline"
															className="text-xs h-7 gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold"
														>
															<Trash2 className="w-3.5 h-3.5" />
															Hapus
														</Button>
													</div>
												)}
												{rep.fileName && (
													<a
														href={`${API_URL}/${rep.fileUrl?.replace(/\\/g, "/")}`}
														target="_blank"
														rel="noreferrer"
														className="inline-flex items-center gap-1.5 text-xs text-[#0517B0] font-bold hover:underline"
													>
														<Download className="w-3.5 h-3.5" />
														Unduh File Laporan
													</a>
												)}
											</div>
										</div>

										{/* Rincian Material Sisa */}
										<div className="space-y-2">
											<span className="text-xs font-bold text-slate-700 block">
												Rincian Sisa Material / Bahan:
											</span>
											<div className="bg-white rounded-lg border border-slate-200 overflow-hidden text-xs">
												<table className="w-full text-left">
													<thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
														<tr>
															<th className="p-2">Nama Barang / Bahan</th>
															<th className="p-2 text-center">Jumlah Sisa</th>
															<th className="p-2 text-center">Kondisi</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-slate-100">
														{rep.daftarSisaBahan?.map((item, itemIdx) => (
															<tr key={itemIdx}>
																<td className="p-2 font-medium text-slate-800">
																	{item.namaItem}
																</td>
																<td className="p-2 text-center text-slate-600">
																	{item.jumlahSisa} {item.satuan}
																</td>
																<td className="p-2 text-center">
																	<Badge
																		variant="outline"
																		className={
																			item.kondisi === "Baik"
																				? "bg-emerald-50 text-emerald-700 border-emerald-200"
																				: "bg-amber-50 text-amber-700 border-amber-200"
																		}
																	>
																		{item.kondisi || "Baik"}
																	</Badge>
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
											{rep.catatanDosen && (
												<p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100">
													&quot;{rep.catatanDosen}&quot;
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			{/* MODAL SECTION 1: Pengajuan & Revisi Anggaran Praktik */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="sm:max-w-5xl w-[92vw] max-h-[90vh] overflow-y-auto p-6 border border-slate-200 shadow-2xl">
					<DialogHeader className="pb-2 border-b border-slate-100">
						<DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
							<DollarSign className="w-5 h-5 text-indigo-600" />
							{editingRequestId
								? "Revisi Pengajuan Anggaran Praktik"
								: "Pengajuan Anggaran Praktik Baru"}
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Isi detail kelas, mata kuliah, dan rincian barang/bahan beserta
							nominal harganya secara lengkap.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-5 py-3">
						{/* Dynamic Items Table */}
						<div className="space-y-3 pt-2">
							<div className="flex items-center justify-between">
								<Label className="text-xs font-bold text-slate-800 block">
									Rincian Pembelian Barang & Nominal Harga *
								</Label>
								<Button
									type="button"
									onClick={handleAddItem}
									variant="outline"
									size="sm"
									className="text-xs h-8 gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
								>
									<Plus className="w-3.5 h-3.5" /> Tambah Baris Barang
								</Button>
							</div>

							<div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
								<div className="bg-slate-100/90 text-slate-700 text-xs font-bold px-4 py-2.5 grid grid-cols-12 gap-2 border-b border-slate-200">
									<div className="col-span-5">Nama Barang / Bahan</div>
									<div className="col-span-2 text-center">Jumlah</div>
									<div className="col-span-2 text-center">Satuan</div>
									<div className="col-span-2 text-right">Harga Satuan (Rp)</div>
									<div className="col-span-1 text-center">Aksi</div>
								</div>

								<div className="p-3 space-y-2.5 max-h-[350px] overflow-y-auto">
									{items.map((item, idx) => (
										<div
											key={idx}
											className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors"
										>
											<div className="col-span-5">
												<Input
													placeholder="Nama barang / bahan..."
													value={item.namaItem}
													onChange={(e) =>
														handleItemChange(idx, "namaItem", e.target.value)
													}
													className="text-xs h-9 bg-white"
												/>
											</div>
											<div className="col-span-2">
												<Input
													type="number"
													min={1}
													value={item.jumlah}
													onChange={(e) =>
														handleItemChange(
															idx,
															"jumlah",
															Number(e.target.value) || 1,
														)
													}
													className="text-xs h-9 text-center bg-white"
												/>
											</div>
											<div className="col-span-2">
												<Input
													placeholder="Satuan"
													value={item.satuan}
													onChange={(e) =>
														handleItemChange(idx, "satuan", e.target.value)
													}
													className="text-xs h-9 bg-white"
												/>
											</div>
											<div className="col-span-2">
												<Input
													type="number"
													min={0}
													placeholder="Harga Satuan"
													value={item.satuanHarga || ""}
													onChange={(e) =>
														handleItemChange(
															idx,
															"satuanHarga",
															Number(e.target.value) || 0,
														)
													}
													className="text-xs h-9 text-right font-medium bg-white"
												/>
											</div>
											<div className="col-span-1 flex justify-center">
												{items.length > 1 && (
													<Button
														type="button"
														onClick={() => handleRemoveItem(idx)}
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex justify-between items-center">
							<span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
								Total Nominal Pengajuan Anggaran:
							</span>
							<span className="font-extrabold text-indigo-700 text-base">
								{formatRupiah(totalNominalCalculated)}
							</span>
						</div>
					</div>

					<DialogFooter className="pt-3 border-t border-slate-100 gap-2">
						<Button
							variant="outline"
							onClick={() => setIsModalOpen(false)}
							disabled={isSaving}
							className="text-xs h-9 px-4"
						>
							Batal
						</Button>
						<Button
							onClick={handleSaveBudgetRequest}
							disabled={isSaving}
							className="bg-[#0517B0] hover:bg-[#04128d] text-white text-xs gap-1.5 h-9 px-6 font-bold"
						>
							{isSaving ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Save className="w-4 h-4" />
							)}
							{editingRequestId
								? "Kirim Ulang Revisi"
								: "Kirim Pengajuan Anggaran"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* MODAL SECTION 2: Laporan Sisa Bahan Praktik */}
			<Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
				<DialogContent className="sm:max-w-4xl w-[92vw] max-h-[90vh] overflow-y-auto p-6 border border-slate-200 shadow-2xl">
					<DialogHeader className="pb-2 border-b border-slate-100">
						<DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
							<PackageCheck className="w-5 h-5 text-indigo-600" />
							{editingReportId
								? "Edit Laporan Sisa Bahan Praktikum"
								: "Unggah Laporan Sisa Bahan Praktikum"}
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Pendataan sisa material dan upload berkas bukti pelaksanaan
							praktik.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-5 py-3">
						<div>
							<Label className="text-xs font-bold text-slate-700 block mb-1.5">
								Pilih Pengajuan Praktik *
							</Label>
							<Select
								value={selectedRequestId}
								onValueChange={(val) => setSelectedRequestId(val || "")}
							>
								<SelectTrigger className="text-xs h-10 bg-slate-50/50">
									<SelectValue placeholder="Pilih Mata Kuliah / Pengajuan Praktik" />
								</SelectTrigger>
								<SelectContent>
									{requests.map((r) => (
										<SelectItem key={r.id} value={r.id.toString()}>
											Pengajuan #{r.id} - {formatRupiah(r.totalNominal)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-3 pt-1">
							<div className="flex items-center justify-between">
								<Label className="text-xs font-bold text-slate-800 block">
									Rincian Sisa Material / Bahan Praktikum *
								</Label>
								<Button
									type="button"
									onClick={handleAddSisaItem}
									variant="outline"
									size="sm"
									className="text-xs h-8 gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
								>
									<Plus className="w-3.5 h-3.5" /> Tambah Item Sisa
								</Button>
							</div>

							<div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
								<div className="bg-slate-100/90 text-slate-700 text-xs font-bold px-4 py-2.5 grid grid-cols-12 gap-2 border-b border-slate-200">
									<div className="col-span-5">Nama Material Sisa</div>
									<div className="col-span-3 text-center">Jumlah Sisa</div>
									<div className="col-span-3 text-center">Satuan</div>
									<div className="col-span-1 text-center">Aksi</div>
								</div>

								<div className="p-3 space-y-2.5 max-h-[250px] overflow-y-auto">
									{sisaItems.map((item, idx) => (
										<div
											key={idx}
											className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50/70 border border-slate-200/80"
										>
											<div className="col-span-5">
												<Input
													placeholder="Nama material sisa..."
													value={item.namaItem}
													onChange={(e) =>
														handleSisaItemChange(
															idx,
															"namaItem",
															e.target.value,
														)
													}
													className="text-xs h-9 bg-white"
												/>
											</div>
											<div className="col-span-3">
												<Input
													type="number"
													min={0}
													placeholder="Jumlah"
													value={item.jumlahSisa}
													onChange={(e) =>
														handleSisaItemChange(
															idx,
															"jumlahSisa",
															Number(e.target.value) || 0,
														)
													}
													className="text-xs h-9 text-center bg-white"
												/>
											</div>
											<div className="col-span-3">
												<Input
													placeholder="Satuan"
													value={item.satuan}
													onChange={(e) =>
														handleSisaItemChange(idx, "satuan", e.target.value)
													}
													className="text-xs h-9 bg-white"
												/>
											</div>
											<div className="col-span-1 flex justify-center">
												{sisaItems.length > 1 && (
													<Button
														type="button"
														onClick={() => handleRemoveSisaItem(idx)}
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						<div>
							<Label className="text-xs font-bold text-slate-700 block mb-1.5">
								Catatan Pelaksanaan Praktik
							</Label>
							<Textarea
								placeholder="Catatan kendala atau keterangan sisa material pasca praktik..."
								value={catatanDosen}
								onChange={(e) => setCatatanDosen(e.target.value)}
								className="text-xs min-h-[80px] bg-slate-50/50"
							/>
						</div>

						<div>
							<Label className="text-xs font-bold text-slate-700 block mb-1.5">
								Upload Berkas Dokumen Laporan (PDF / Excel)
							</Label>
							<Input
								type="file"
								accept=".pdf,.xlsx,.xls,.doc,.docx"
								onChange={(e) => setReportFile(e.target.files?.[0] || null)}
								className="text-xs h-10 cursor-pointer bg-slate-50/50"
							/>
						</div>
					</div>

					<DialogFooter className="pt-3 border-t border-slate-100 gap-2">
						<Button
							variant="outline"
							onClick={() => setIsReportModalOpen(false)}
							disabled={isSaving}
							className="text-xs h-9 px-4"
						>
							Batal
						</Button>
						<Button
							onClick={handleSaveMaterialReport}
							disabled={isSaving}
							className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 h-9 px-6 font-bold"
						>
							{isSaving ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<UploadCloud className="w-4 h-4" />
							)}
							{editingReportId
								? "Simpan Perubahan Laporan"
								: "Simpan Laporan Sisa Bahan"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* MODAL HAPUS: Sleek Custom Delete Confirmation Dialog */}
			<Dialog
				open={deleteTarget !== null}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<DialogContent className="max-w-md p-6 border border-rose-100 shadow-2xl rounded-2xl">
					<DialogHeader className="space-y-2 text-center">
						<div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-1">
							<Trash2 className="w-6 h-6" />
						</div>
						<DialogTitle className="text-center text-lg font-bold text-slate-800">
							Konfirmasi Hapus{" "}
							{deleteTarget?.type === "request"
								? "Pengajuan Anggaran"
								: "Laporan Sisa Bahan"}
						</DialogTitle>
						<DialogDescription className="text-center text-xs text-slate-600 leading-relaxed">
							Apakah Anda yakin ingin menghapus data{" "}
							<span className="font-bold text-slate-900">
								&quot;{deleteTarget?.name}&quot;
							</span>
							?
							<br />
							Tindakan ini akan menghapus data secara permanen dari sistem.
						</DialogDescription>
					</DialogHeader>

					<DialogFooter className="pt-4 flex sm:flex-row flex-col-reverse gap-2 border-t border-slate-100 mt-2">
						<Button
							variant="outline"
							onClick={() => setDeleteTarget(null)}
							disabled={isSaving}
							className="w-full sm:w-1/2 text-xs h-9 border-slate-300 font-semibold"
						>
							Batal
						</Button>
						<Button
							onClick={confirmDelete}
							disabled={isSaving}
							className="w-full sm:w-1/2 bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 font-bold gap-1.5"
						>
							{isSaving ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<Trash2 className="w-3.5 h-3.5" />
							)}
							Ya, Hapus Data
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
