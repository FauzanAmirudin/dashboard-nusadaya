"use client";

import {
	AlertCircle,
	AlertTriangle,
	CheckCircle,
	CheckCircle2,
	Clock,
	Coins,
	CreditCard,
	Edit2,
	Eye,
	Loader2,
	Lock,
	Megaphone,
	MessageSquare,
	PieChart,
	SlidersHorizontal,
	UploadCloud,
	Users,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { API_URL, api, getToken } from "@/lib/eden";
import { formatRupiah } from "@/utils/format";

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

	// Open Modal
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

	const totalSudahDibayar = recipients
		.filter((r) => r.statusPencairan === "sudah_dibayarkan")
		.reduce((sum, r) => sum + (r.nominalFee || 0), 0);

	const totalBelumDibayar = recipients
		.filter((r) => r.statusPencairan !== "sudah_dibayarkan")
		.reduce((sum, r) => sum + (r.nominalFee || 0), 0);

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
											Proporsi
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3">
											Fee (Nominal)
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3">
											Invoice (PDF)
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3">
											Status
										</TableHead>
										<TableHead className="text-[11px] font-bold text-slate-700 uppercase tracking-wider py-3 text-right">
											Aksi
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

										return (
											<TableRow
												key={r.id}
												className="hover:bg-slate-50/70 transition-colors border-b border-slate-100"
											>
												<TableCell className="py-3">
													<Badge
														variant="outline"
														className={`${styleCfg.bg} ${styleCfg.text} ${styleCfg.border} text-[11px] font-bold px-2 py-0.5`}
													>
														{r.kategori}
													</Badge>
												</TableCell>
												<TableCell className="py-3">
													<div className="font-bold text-slate-900 text-xs">
														{r.namaReferral}
													</div>
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
													<Badge
														variant="outline"
														className="text-[11px] font-bold text-slate-600 bg-slate-50 border-slate-200"
													>
														{proporsi.toFixed(0)}%
													</Badge>
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
																placeholder="0"
																value={
																	r.nominalFee === 0 || r.nominalFee === "0"
																		? ""
																		: (r.nominalFee ?? "")
																}
																onKeyDown={(e) => {
																	if (
																		e.key === "-" ||
																		e.key === "e" ||
																		e.key === "E"
																	)
																		e.preventDefault();
																}}
																onChange={(e) =>
																	handleLocalNominalChange(r.id, e.target.value)
																}
																onBlur={() =>
																	handleUpdateFee(
																		r.id,
																		Math.max(0, Number(r.nominalFee) || 0),
																	)
																}
																disabled={
																	!canEdit ||
																	r.statusPencairan === "sudah_dibayarkan"
																}
																className="w-32 h-8 text-xs font-bold bg-white text-slate-900 shadow-2xs"
															/>
														</div>
													) : (
														<div className="font-black text-xs text-slate-900">
															{formatRupiah(r.nominalFee || 0)}
														</div>
													)}
												</TableCell>
												<TableCell className="py-3">
													{r.invoiceFileUrl ? (
														<a
															href={`${API_URL}/students/${studentId}/pmb/fee-share-recipients/${r.id}/invoice`}
															target="_blank"
															rel="noreferrer"
															className="inline-flex items-center gap-1 text-xs text-[#0517B0] hover:text-blue-800 font-bold underline underline-offset-2 transition-colors"
														>
															<Eye className="w-3.5 h-3.5" />
															Lihat Invoice
														</a>
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
															Belum diunggah
														</span>
													)}
												</TableCell>
												<TableCell className="py-3">
													{r.statusPencairan === "sudah_dibayarkan" ? (
														<Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-[10px] font-bold">
															<CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />{" "}
															Cair
														</Badge>
													) : (
														<Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200 text-[10px] font-bold">
															<Clock className="w-3 h-3 mr-1 text-amber-600" />{" "}
															Pending
														</Badge>
													)}
												</TableCell>
												<TableCell className="py-3 text-right">
													{canEdit && (
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
																	: "bg-[#0517B0] hover:bg-blue-800 text-white"
															}`}
														>
															{r.statusPencairan === "sudah_dibayarkan"
																? "Batalkan Cair"
																: "Tandai Cair"}
														</Button>
													)}
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
									placeholder="0"
									value={tempPromosiInput}
									onKeyDown={(e) => {
										if (e.key === "-" || e.key === "e" || e.key === "E")
											e.preventDefault();
									}}
									onChange={(e) => {
										const val = e.target.value;
										if (val === "") {
											setTempPromosiInput("");
										} else {
											const clean = val.replace(/^0+(?=\d)/, "");
											setTempPromosiInput(clean);
										}
									}}
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
		</div>
	);
}
