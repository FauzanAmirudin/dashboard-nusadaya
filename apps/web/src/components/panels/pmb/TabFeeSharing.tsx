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
	Trash2,
	UploadCloud,
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

interface FeeShareRecipient {
	id: number;
	studentId: number;
	kategori: string;
	namaReferral: string;
	noHp: string;
	noRekening?: string | null;
	namaBank?: string | null;
	nominalFee: number;
	invoiceFileUrl?: string | null;
	statusPencairan: string; // "belum_dibayarkan" | "sudah_dibayarkan"
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
		noHp: "",
		noRekening: "",
		namaBank: "",
		nominalFee: 0,
		statusPencairan: "belum_dibayarkan",
	});

	const [deletingFeeId, setDeletingFeeId] = useState<number | null>(null);
	const [uploadingFeeId, setUploadingFeeId] = useState<number | null>(null);

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
	}, [studentId]);

	const handleOpenAddModal = () => {
		setEditingRecipient(null);
		setRecipientForm({
			kategori: "Mitra",
			namaReferral: "",
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
				noHp: recipientForm.noHp,
				noRekening: recipientForm.noRekening || undefined,
				namaBank: recipientForm.namaBank || undefined,
			};
			if (!isEdit) {
				bodyPayload.nominalFee = 0;
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

		setUploadingFeeId(recipientId);
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
				fetchFeeShareRecipients();
			} else {
				toast.error("Gagal mengunggah file invoice");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		} finally {
			setUploadingFeeId(null);
		}
	};

	const formatRupiah = (num: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(num);
	};

	const totalBiayaIklan = feeShareRecipients.reduce(
		(sum, rec) => sum + (rec.nominalFee || 0),
		0,
	);
	const totalSudahDibayar = feeShareRecipients
		.filter((rec) => rec.statusPencairan === "sudah_dibayarkan")
		.reduce((sum, rec) => sum + (rec.nominalFee || 0), 0);
	const totalBelumDibayar = feeShareRecipients
		.filter((rec) => rec.statusPencairan !== "sudah_dibayarkan")
		.reduce((sum, rec) => sum + (rec.nominalFee || 0), 0);

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
					{canEdit && (
						<Button
							onClick={handleOpenAddModal}
							size="sm"
							className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
						>
							<Plus className="w-4 h-4" />
							Tambah Penerima Fee
						</Button>
					)}
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
									Invoice (PDF)
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
										<TableCell className="text-xs font-bold text-slate-800">
											{formatRupiah(rec.nominalFee || 0)}
										</TableCell>
										<TableCell>
											{rec.invoiceFileUrl ? (
												<div className="flex items-center gap-2">
													<a
														href={`${API_URL}/students/${studentId}/pmb/fee-share-recipients/${rec.id}/invoice`}
														target="_blank"
														rel="noreferrer"
														className="inline-flex items-center gap-1 text-xs text-[#0517B0] hover:underline font-semibold"
													>
														<Eye className="w-3.5 h-3.5" />
														Lihat Invoice
													</a>
												</div>
											) : (
												canEdit &&
												rec.statusPencairan !== "sudah_dibayarkan" && (
													<label className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600 cursor-pointer border border-dashed border-slate-300 rounded px-2 py-1 bg-slate-50 hover:bg-amber-50/50 transition-colors">
														{uploadingFeeId === rec.id ? (
															<Loader2 className="w-3 h-3 animate-spin" />
														) : (
															<UploadCloud className="w-3 h-3" />
														)}
														<span className="text-[11px]">Upload PDF</span>
														<input
															type="file"
															accept="application/pdf"
															className="hidden"
															onChange={(e) => {
																const file = e.target.files?.[0];
																if (file) handleInvoiceUpload(rec.id, file);
															}}
														/>
													</label>
												)
											)}
										</TableCell>
										<TableCell>
											{rec.statusPencairan === "sudah_dibayarkan" ? (
												<Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
													🟢 Sudah Dibayarkan
												</Badge>
											) : (
												<Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]">
													🔴 Belum Dibayarkan
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
								onChange={(e) =>
									setRecipientForm({ ...recipientForm, noHp: e.target.value })
								}
								placeholder="Contoh: 08123456789"
								className="mt-1 h-9 text-xs"
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label className="text-xs font-semibold text-slate-700">
									Rekening (Opsional)
								</Label>
								<Input
									value={recipientForm.noRekening}
									onChange={(e) =>
										setRecipientForm({
											...recipientForm,
											noRekening: e.target.value,
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
