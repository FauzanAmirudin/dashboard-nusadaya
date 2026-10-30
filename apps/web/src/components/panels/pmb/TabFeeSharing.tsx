"use client";

import {
	CheckCircle,
	Clock,
	CreditCard,
	Edit2,
	Eye,
	Loader2,
	Megaphone,
	Plus,
	RefreshCw,
	Trash2,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { API_URL, getToken } from "@/lib/eden";
import { openDocumentReview } from "@/utils/document-review";
import {
	filterNumeric,
	filterPhone,
	preventNonNumericKey,
	preventNonPhoneKey,
} from "@/utils/form-validators";

interface FeeDisbursementLog {
	id: number;
	terminNumber: number;
	amount: number;
	transferProofUrl?: string | null;
	transferProofFileName?: string | null;
	notes?: string | null;
	disbursedAt: string;
}

interface FeeShareRecipient {
	id: number;
	studentId: number;
	kategori: string;
	namaReferral: string;
	namaInstitusi?: string | null;
	noHp: string;
	noRekening?: string | null;
	namaBank?: string | null;
	nominalFee: number;
	invoiceFileUrl?: string | null;
	statusPencairan: string; // "belum_dibayarkan" | "cair_sebagian" | "sudah_dibayarkan"
	disbursementLogs?: FeeDisbursementLog[];
	createdAt: string;
}

interface TabFeeSharingProps {
	studentId: number;
	canEdit: boolean;
	onUpdate: () => void;
}

export function TabFeeSharing({
	studentId,
	canEdit,
	onUpdate,
}: TabFeeSharingProps) {
	const [feeShareRecipients, setFeeShareRecipients] = useState<
		FeeShareRecipient[]
	>([]);
	const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
	const [editingRecipient, setEditingRecipient] =
		useState<FeeShareRecipient | null>(null);
	const [recipientForm, setRecipientForm] = useState({
		kategori: "Mitra",
		namaReferral: "",
		namaInstitusi: "",
		noHp: "",
		noRekening: "",
		namaBank: "",
		nominalFee: 0,
		statusPencairan: "belum_dibayarkan",
	});

	const [deletingFeeId, setDeletingFeeId] = useState<number | null>(null);

	const fetchFeeShareRecipients = async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/fee-share-recipients`,
				{
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success) setFeeShareRecipients(json.data);
			}
		} catch (error) {
			console.error("Failed to fetch fee share recipients", error);
		}
	};

	useEffect(() => {
		fetchFeeShareRecipients();

		const handleFeeUpdate = (e: any) => {
			if (!e.detail?.studentId || e.detail.studentId === studentId) {
				fetchFeeShareRecipients();
			}
		};

		window.addEventListener("fee-sharing-updated", handleFeeUpdate);
		window.addEventListener("focus", fetchFeeShareRecipients);
		const interval = setInterval(fetchFeeShareRecipients, 10000);

		return () => {
			window.removeEventListener("fee-sharing-updated", handleFeeUpdate);
			window.removeEventListener("focus", fetchFeeShareRecipients);
			clearInterval(interval);
		};
	}, [studentId]);

	const handleOpenAddModal = () => {
		setEditingRecipient(null);
		setRecipientForm({
			kategori: "Mitra",
			namaReferral: "",
			namaInstitusi: "",
			noHp: "",
			noRekening: "",
			namaBank: "",
			nominalFee: 0,
			statusPencairan: "belum_dibayarkan",
		});
		setIsFeeModalOpen(true);
	};

	const handleOpenEditModal = (rec: FeeShareRecipient) => {
		setEditingRecipient(rec);
		setRecipientForm({
			kategori: rec.kategori || "Mitra",
			namaReferral: rec.namaReferral || "",
			namaInstitusi: rec.namaInstitusi || "",
			noHp: rec.noHp || "",
			noRekening: rec.noRekening || "",
			namaBank: rec.namaBank || "",
			nominalFee: rec.nominalFee || 0,
			statusPencairan: rec.statusPencairan || "belum_dibayarkan",
		});
		setIsFeeModalOpen(true);
	};

	const handleSaveRecipient = async () => {
		if (!canEdit) return;
		if (!recipientForm.namaReferral.trim() || !recipientForm.noHp.trim()) {
			toast.error("Nama dan No. HP wajib diisi");
			return;
		}

		try {
			const isEdit = !!editingRecipient;
			const url = isEdit
				? `${API_URL}/students/${studentId}/pmb/fee-share-recipients/${editingRecipient.id}`
				: `${API_URL}/students/${studentId}/pmb/fee-share-recipients`;

			const method = isEdit ? "PATCH" : "POST";
			const bodyPayload: any = {
				kategori: recipientForm.kategori,
				namaReferral: recipientForm.namaReferral,
				namaInstitusi: recipientForm.namaInstitusi || undefined,
				noHp: recipientForm.noHp,
				noRekening: recipientForm.noRekening || undefined,
				namaBank: recipientForm.namaBank || undefined,
				nominalFee: Math.max(
					0,
					Math.floor(Number(recipientForm.nominalFee)) || 0,
				),
			};
			if (!isEdit) {
				bodyPayload.statusPencairan = "belum_dibayarkan";
			}

			const res = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${getToken()}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(bodyPayload),
			});

			if (res.ok) {
				toast.success(
					isEdit
						? "Penerima fee berhasil diperbarui"
						: "Penerima fee berhasil ditambahkan",
				);
				setIsFeeModalOpen(false);
				fetchFeeShareRecipients();
				onUpdate();
			} else {
				toast.error("Gagal menyimpan data penerima fee");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
	};

	const handleDeleteRecipient = async (recipientId: number) => {
		if (!canEdit) return;
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/fee-share-recipients/${recipientId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (res.ok) {
				toast.success("Penerima fee berhasil dihapus secara permanen");
				fetchFeeShareRecipients();
				onUpdate();
			} else {
				toast.error("Gagal menghapus penerima fee");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		} finally {
			setDeletingFeeId(null);
		}
	};

	const formatRupiah = (num: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(num);
	};

	const getRecipientDisbursed = (rec: FeeShareRecipient) => {
		if (rec.disbursementLogs && rec.disbursementLogs.length > 0) {
			return rec.disbursementLogs.reduce(
				(sum, l) => sum + (Number(l.amount) || 0),
				0,
			);
		}
		return rec.statusPencairan === "sudah_dibayarkan"
			? Number(rec.nominalFee) || 0
			: 0;
	};

	const totalBiayaIklan = feeShareRecipients.reduce(
		(sum, rec) => sum + (rec.nominalFee || 0),
		0,
	);
	const totalSudahDibayar = feeShareRecipients.reduce(
		(sum, rec) => sum + getRecipientDisbursed(rec),
		0,
	);
	const totalBelumDibayar = Math.max(0, totalBiayaIklan - totalSudahDibayar);

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
					<CardContent className="p-4 flex items-center gap-4">
						<div className="p-3 bg-amber-500/10 rounded-xl">
							<Megaphone className="w-6 h-6 text-amber-600" />
						</div>
						<div>
							<p className="text-xs font-semibold text-slate-500 mb-1">
								Total Biaya Iklan & Promosi
							</p>
							<h3 className="text-lg font-bold text-slate-800">
								{formatRupiah(totalBiayaIklan)}
							</h3>
						</div>
					</CardContent>
				</Card>

				<Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
					<CardContent className="p-4 flex items-center gap-4">
						<div className="p-3 bg-emerald-500/10 rounded-xl">
							<CheckCircle className="w-6 h-6 text-emerald-600" />
						</div>
						<div>
							<p className="text-xs font-semibold text-slate-500 mb-1">
								Total Sudah Dibayarkan
							</p>
							<h3 className="text-lg font-bold text-emerald-700">
								{formatRupiah(totalSudahDibayar)}
							</h3>
						</div>
					</CardContent>
				</Card>

				<Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-rose-50 to-rose-100/50">
					<CardContent className="p-4 flex items-center gap-4">
						<div className="p-3 bg-rose-500/10 rounded-xl">
							<Clock className="w-6 h-6 text-rose-600" />
						</div>
						<div>
							<p className="text-xs font-semibold text-slate-500 mb-1">
								Total Belum Dibayarkan
							</p>
							<h3 className="text-lg font-bold text-rose-700">
								{formatRupiah(totalBelumDibayar)}
							</h3>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="border border-slate-200 shadow-sm">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<Users className="w-4 h-4 text-amber-600" />
							Daftar Penerima Fee Sharing
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Input data penerima fee yang nantinya akan disinkronkan ke Panel
							Finance
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={fetchFeeShareRecipients}
							className="h-8 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-100 gap-1.5 cursor-pointer shadow-2xs"
							title="Segarkan data dari Finance secara realtime"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							<span>Segarkan</span>
						</Button>
						{canEdit && (
							<Button
								onClick={handleOpenAddModal}
								size="sm"
								className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shadow-2xs"
							>
								<Plus className="w-4 h-4" />
								Tambah Penerima Fee
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader className="bg-slate-50/50">
							<TableRow>
								<TableHead className="text-xs font-bold text-slate-700">
									Penerima
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-700">
									Nama
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-700">
									No. HP
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-700">
									Fee (Nominal)
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-700">
									Bukti Transfer / Dokumen
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-700">
									Status
								</TableHead>
								{canEdit && (
									<TableHead className="text-xs font-bold text-slate-700 text-right">
										Aksi
									</TableHead>
								)}
							</TableRow>
						</TableHeader>
						<TableBody>
							{feeShareRecipients.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={canEdit ? 7 : 6}
										className="text-center py-8 text-xs text-slate-400"
									>
										Belum ada penerima fee sharing yang terdaftar.
									</TableCell>
								</TableRow>
							) : (
								feeShareRecipients.map((rec) => (
									<TableRow key={rec.id} className="hover:bg-slate-50/60">
										<TableCell>
											<Badge
												variant="outline"
												className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-semibold"
											>
												{rec.kategori}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="font-semibold text-slate-800 text-xs">
												{rec.namaReferral}
											</div>
											{rec.namaInstitusi && (
												<div className="text-[10px] text-blue-700 font-medium mt-0.5">
													Institusi: {rec.namaInstitusi}
												</div>
											)}
											{(rec.namaBank || rec.noRekening) && (
												<div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
													<CreditCard className="w-3 h-3" />
													{rec.namaBank || "Bank"} - {rec.noRekening || "-"}
												</div>
											)}
										</TableCell>
										<TableCell className="text-xs text-slate-600 font-medium">
											{rec.noHp}
										</TableCell>
										<TableCell className="text-xs">
											<div className="font-black text-slate-900">
												{formatRupiah(rec.nominalFee || 0)}
											</div>
											{rec.disbursementLogs &&
												rec.disbursementLogs.length > 0 && (
													<div className="mt-1 space-y-0.5">
														<div className="text-[11px] font-bold text-emerald-700">
															Cair: {formatRupiah(getRecipientDisbursed(rec))}
														</div>
														<div className="text-[10px] text-slate-500 font-medium">
															{rec.disbursementLogs.length} Termin tercatat
														</div>
														{rec.nominalFee > getRecipientDisbursed(rec) ? (
															<div className="text-[10px] font-semibold text-rose-600">
																Sisa:{" "}
																{formatRupiah(
																	rec.nominalFee - getRecipientDisbursed(rec),
																)}
															</div>
														) : (
															<div className="text-[10px] font-bold text-emerald-600">
																✓ Lunas Terpenuhi
															</div>
														)}
													</div>
												)}
										</TableCell>
										<TableCell>
											{rec.disbursementLogs &&
											rec.disbursementLogs.length > 0 ? (
												<div className="flex flex-col gap-1.5 items-start">
													{rec.disbursementLogs.map((log) => (
														<div
															key={log.id}
															className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/90 w-full max-w-[220px] shadow-2xs"
														>
															<div className="flex items-center justify-between gap-1.5">
																<span className="text-[11px] font-bold text-slate-800">
																	T{log.terminNumber}:{" "}
																	{formatRupiah(log.amount)}
																</span>
																{log.transferProofUrl ? (
																	<Button
																		type="button"
																		variant="outline"
																		size="sm"
																		className="h-6 text-[10px] font-semibold text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/10 gap-1 cursor-pointer shadow-2xs px-2 shrink-0"
																		title={`Review Bukti Termin ${log.terminNumber}`}
																		onClick={() => {
																			openDocumentReview(
																				studentId,
																				log.transferProofUrl,
																				log.transferProofFileName ||
																					`Bukti_Termin_${log.terminNumber}_${rec.namaReferral}.pdf`,
																				`fee-termin-${log.id}`,
																			);
																		}}
																	>
																		<Eye className="w-3 h-3 text-[#0517B0]" />
																		<span>Review Bukti</span>
																	</Button>
																) : (
																	<span className="text-[10px] text-slate-400 italic">
																		Tanpa berkas
																	</span>
																)}
															</div>
															{log.notes && (
																<p
																	className="text-[10px] text-slate-500 truncate"
																	title={log.notes}
																>
																	{log.notes}
																</p>
															)}
														</div>
													))}
												</div>
											) : rec.invoiceFileUrl ? (
												<Button
													type="button"
													variant="outline"
													size="sm"
													className="h-7 text-xs font-semibold text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/10 gap-1.5 cursor-pointer shadow-2xs"
													title="Review Bukti Transfer"
													onClick={() => {
														const invoiceUrl = `/students/${studentId}/pmb/fee-share-recipients/${rec.id}/invoice`;
														const invoiceName = `Bukti Transfer - ${rec.namaReferral} (${rec.kategori}).pdf`;
														openDocumentReview(
															studentId,
															invoiceUrl,
															invoiceName,
															rec.id,
														);
													}}
												>
													<Eye className="w-3.5 h-3.5 text-[#0517B0]" />
													<span>Review Bukti</span>
												</Button>
											) : (
												<span className="text-[11px] text-slate-400 italic">
													Belum diunggah Finance
												</span>
											)}
										</TableCell>
										<TableCell>
											{rec.statusPencairan === "sudah_dibayarkan" ? (
												<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
													✓ Lunas (100%)
												</Badge>
											) : rec.statusPencairan === "cair_sebagian" ? (
												<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
													⏳ Cair Sebagian
												</Badge>
											) : (
												<Badge className="bg-rose-50 text-rose-600 border-rose-200 text-[10px] font-medium">
													Belum Dibayarkan
												</Badge>
											)}
										</TableCell>
										{canEdit && (
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleOpenEditModal(rec)}
														disabled={
															rec.statusPencairan === "sudah_dibayarkan"
														}
														className="h-7 w-7 p-0 text-slate-500 hover:text-[#0517B0] disabled:opacity-30"
													>
														<Edit2 className="w-3.5 h-3.5" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setDeletingFeeId(rec.id)}
														disabled={
															rec.statusPencairan === "sudah_dibayarkan"
														}
														className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600 disabled:opacity-30"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</Button>
												</div>
											</TableCell>
										)}
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Dialog Modal Tambah / Edit Fee Share Recipient */}
			<Dialog open={isFeeModalOpen} onOpenChange={setIsFeeModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-800">
							{editingRecipient
								? "Edit Penerima Fee Sharing"
								: "Tambah Penerima Fee Sharing"}
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Isi data penerima fee sharing untuk mahasiswa ini.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div>
							<Label className="text-xs font-semibold text-slate-700">
								Penerima (Kategori)
							</Label>
							<Select
								value={recipientForm.kategori}
								onValueChange={(val) => {
									if (val)
										setRecipientForm({ ...recipientForm, kategori: val });
								}}
							>
								<SelectTrigger className="mt-1 h-9 text-xs">
									<SelectValue placeholder="Pilih Kategori" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Mitra">Mitra</SelectItem>
									<SelectItem value="Koordinator">Koordinator</SelectItem>
									<SelectItem value="Tim Visit">Tim Visit</SelectItem>
									<SelectItem value="Sekolah">Sekolah</SelectItem>
									<SelectItem value="BKK/FKKS">BKK/FKKS</SelectItem>
									<SelectItem value="Tim Nusadaya">Tim Nusadaya</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-700">
								Nama Institusi / Asal Referral (Opsional)
							</Label>
							<Input
								value={recipientForm.namaInstitusi}
								onChange={(e) =>
									setRecipientForm({
										...recipientForm,
										namaInstitusi: e.target.value,
									})
								}
								placeholder="Contoh: SMKN 1 Banyuwangi / BKK Mandiri"
								className="mt-1 h-9 text-xs"
							/>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-700">
								Nama Penerima / Referral *
							</Label>
							<Input
								value={recipientForm.namaReferral}
								onChange={(e) =>
									setRecipientForm({
										...recipientForm,
										namaReferral: e.target.value,
									})
								}
								placeholder="Contoh: Bpk. Ahmad Hidayat"
								className="mt-1 h-9 text-xs"
							/>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-700">
								No. HP *
							</Label>
							<Input
								value={recipientForm.noHp}
								onKeyDown={preventNonPhoneKey}
								onChange={(e) =>
									setRecipientForm({
										...recipientForm,
										noHp: filterPhone(e.target.value, 15),
									})
								}
								placeholder="Contoh: 08123456789"
								className="mt-1 h-9 text-xs"
							/>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-700">
								Nominal Fee Disepakati (Rp) *
							</Label>
							<div className="relative mt-1">
								<span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
									Rp
								</span>
								<Input
									type="text"
									inputMode="numeric"
									value={
										recipientForm.nominalFee === 0 || !recipientForm.nominalFee
											? ""
											: recipientForm.nominalFee
									}
									onKeyDown={preventNonNumericKey}
									onChange={(e) => {
										const val = e.target.value.replace(/[^0-9]/g, "");
										setRecipientForm({
											...recipientForm,
											nominalFee: val ? parseInt(val, 10) : 0,
										});
									}}
									placeholder="Contoh: 2500000"
									className="pl-9 h-9 text-xs font-semibold"
								/>
							</div>
							<p className="text-[10px] text-slate-500 mt-1">
								Nominal deal/pagu komisi yang disepakati oleh tim PMB dengan
								pihak referral (akan dicairkan oleh Finance).
							</p>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label className="text-xs font-semibold text-slate-700">
									Rekening (Opsional)
								</Label>
								<Input
									value={recipientForm.noRekening}
									onKeyDown={preventNonNumericKey}
									onChange={(e) =>
										setRecipientForm({
											...recipientForm,
											noRekening: filterNumeric(
												e.target.value,
												30,
												"No. Rekening hanya boleh berisi angka",
											),
										})
									}
									placeholder="No. Rekening"
									className="mt-1 h-9 text-xs"
								/>
							</div>
							<div>
								<Label className="text-xs font-semibold text-slate-700">
									Bank (Opsional)
								</Label>
								<Input
									value={recipientForm.namaBank}
									onChange={(e) =>
										setRecipientForm({
											...recipientForm,
											namaBank: e.target.value,
										})
									}
									placeholder="BCA, Mandiri, dll."
									className="mt-1 h-9 text-xs"
								/>
							</div>
						</div>
					</div>

					<DialogFooter className="gap-2 pt-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsFeeModalOpen(false)}
							className="text-xs h-8"
						>
							Batal
						</Button>
						<Button
							size="sm"
							onClick={handleSaveRecipient}
							className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
						>
							Simpan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* AlertDialog Hapus Permanen Fee Share Recipient */}
			<AlertDialog
				open={deletingFeeId !== null}
				onOpenChange={(open) => !open && setDeletingFeeId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base font-bold text-slate-800">
							Hapus Permanen Penerima Fee?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-slate-600">
							Tindakan ini akan menghapus data penerima fee beserta berkas
							invoice secara permanen dari database. Data yang dihapus tidak
							dapat dikembalikan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-2">
						<AlertDialogCancel className="text-xs h-8">Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								deletingFeeId && handleDeleteRecipient(deletingFeeId)
							}
							className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8"
						>
							Hapus Permanen
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
