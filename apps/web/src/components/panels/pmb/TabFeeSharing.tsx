"use client";

import { Eye, Loader2, Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
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

	type FeeRecipient = (typeof feeShareRecipients)[number];

	const renderFee = (rec: FeeRecipient) => (
		<div className="text-sm">
			<div className="font-mono font-bold text-slate-900">
				{formatRupiah(rec.nominalFee || 0)}
			</div>
			{rec.disbursementLogs && rec.disbursementLogs.length > 0 && (
				<div className="mt-1 space-y-0.5">
					<div className="text-[11px] font-bold text-emerald-700">
						Cair: {formatRupiah(getRecipientDisbursed(rec))}
					</div>
					<div className="text-[10px] text-slate-500 font-medium">
						{rec.disbursementLogs.length} Termin tercatat
					</div>
					{rec.nominalFee > getRecipientDisbursed(rec) ? (
						<div className="text-[10px] font-semibold text-rose-600">
							Sisa: {formatRupiah(rec.nominalFee - getRecipientDisbursed(rec))}
						</div>
					) : (
						<div className="text-[10px] font-bold text-emerald-600">
							✓ Lunas Terpenuhi
						</div>
					)}
				</div>
			)}
		</div>
	);

	const renderBukti = (rec: FeeRecipient) => (
		<>
			{rec.disbursementLogs && rec.disbursementLogs.length > 0 ? (
				<div className="flex flex-col gap-1.5 items-start">
					{rec.disbursementLogs.map((log) => (
						<div
							key={log.id}
							className="p-2 rounded-lg bg-slate-50 border border-slate-200 w-full max-w-[260px]"
						>
							<div className="flex items-center justify-between gap-1.5">
								<span className="text-[11px] font-bold text-slate-800">
									T{log.terminNumber}: {formatRupiah(log.amount)}
								</span>
								{log.transferProofUrl ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-9 text-xs font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 gap-1.5 cursor-pointer px-3 shrink-0"
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
					className="h-9 px-3 text-xs font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 gap-1.5 cursor-pointer"
					title="Review Bukti Transfer"
					onClick={() => {
						const invoiceUrl = `/students/${studentId}/pmb/fee-share-recipients/${rec.id}/invoice`;
						const invoiceName = `Bukti Transfer - ${rec.namaReferral} (${rec.kategori}).pdf`;
						openDocumentReview(studentId, invoiceUrl, invoiceName, rec.id);
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
		</>
	);

	const renderStatus = (rec: FeeRecipient) => {
		const st =
			rec.statusPencairan === "sudah_dibayarkan"
				? { cls: "bg-emerald-100 text-emerald-800", text: "Lunas" }
				: rec.statusPencairan === "cair_sebagian"
					? { cls: "bg-amber-100 text-amber-800", text: "Cair sebagian" }
					: { cls: "bg-rose-100 text-rose-700", text: "Belum dibayarkan" };
		return (
			<span
				className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${st.cls}`}
			>
				{st.text}
			</span>
		);
	};

	const renderActions = (rec: FeeRecipient, full = false) => (
		<div className={`flex items-center gap-2 ${full ? "" : "justify-end"}`}>
			<Button
				variant="outline"
				onClick={() => handleOpenEditModal(rec)}
				disabled={rec.statusPencairan === "sudah_dibayarkan"}
				className={`h-10 md:h-9 px-3 text-sm text-slate-700 border-slate-200 ${full ? "flex-1" : ""}`}
			>
				Edit
			</Button>
			<Button
				variant="outline"
				onClick={() => setDeletingFeeId(rec.id)}
				disabled={rec.statusPencairan === "sudah_dibayarkan"}
				className={`h-10 md:h-9 px-3 text-sm text-rose-700 border-rose-200 hover:bg-rose-50 ${full ? "flex-1" : ""}`}
			>
				Hapus
			</Button>
		</div>
	);

	const recipientName = (rec: FeeRecipient) => (
		<div className="min-w-0">
			<p className="text-xs font-medium text-slate-500">{rec.kategori}</p>
			<p className="text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">
				{rec.namaReferral}
			</p>
			{rec.namaInstitusi && (
				<p className="text-xs text-slate-600 mt-0.5">{rec.namaInstitusi}</p>
			)}
			{(rec.namaBank || rec.noRekening) && (
				<p className="text-xs text-slate-500 mt-0.5 font-mono">
					{rec.namaBank || "Bank"} · {rec.noRekening || "-"}
				</p>
			)}
		</div>
	);

	return (
		<div className="w-full space-y-6">
			{/* Ringkasan: 3 angka, warna lembut tanpa gradien */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
					<p className="text-xs sm:text-sm font-medium text-slate-700">
						Total biaya iklan & promosi
					</p>
					<p className="mt-1 font-mono text-lg sm:text-xl font-bold text-amber-800">
						{formatRupiah(totalBiayaIklan)}
					</p>
				</div>
				<div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
					<p className="text-xs sm:text-sm font-medium text-slate-700">
						Sudah dibayarkan
					</p>
					<p className="mt-1 font-mono text-lg sm:text-xl font-bold text-emerald-700">
						{formatRupiah(totalSudahDibayar)}
					</p>
				</div>
				<div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
					<p className="text-xs sm:text-sm font-medium text-slate-700">
						Belum dibayarkan
					</p>
					<p className="mt-1 font-mono text-lg sm:text-xl font-bold text-rose-700">
						{formatRupiah(totalBelumDibayar)}
					</p>
				</div>
			</div>

			<section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
					<div className="min-w-0">
						<h3 className="text-sm sm:text-base font-bold text-slate-900">
							Penerima fee sharing
						</h3>
						<p className="text-xs text-slate-500 mt-0.5">
							Disinkronkan ke Panel Finance untuk pencairan.
						</p>
					</div>
					<div className="flex w-full items-center gap-2 sm:w-auto">
						{canEdit && (
							<Button
								onClick={handleOpenAddModal}
								className="h-10 flex-1 sm:flex-none bg-[#0517B0] hover:bg-blue-800 text-white text-sm font-semibold gap-1.5"
							>
								<Plus className="w-4 h-4" />
								Tambah penerima fee
							</Button>
						)}
					</div>
				</div>

				{feeShareRecipients.length === 0 ? (
					<p className="px-4 py-10 text-center text-sm text-slate-500">
						Belum ada penerima fee sharing yang terdaftar.
					</p>
				) : (
					<>
						{/* Desktop: tabel */}
						<div className="hidden md:block overflow-x-auto">
							<Table>
								<TableHeader className="bg-slate-100/80">
									<TableRow className="hover:bg-transparent">
										<TableHead className="pl-6 text-xs font-semibold text-slate-600">
											Penerima
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600">
											No. HP
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600">
											Fee
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600">
											Bukti transfer
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600">
											Status
										</TableHead>
										{canEdit && (
											<TableHead className="pr-6 text-right">
												<span className="sr-only">Aksi</span>
											</TableHead>
										)}
									</TableRow>
								</TableHeader>
								<TableBody>
									{feeShareRecipients.map((rec) => (
										<TableRow
											key={rec.id}
											className="align-top hover:bg-blue-50/40"
										>
											<TableCell className="pl-6 py-4 whitespace-normal">
												{recipientName(rec)}
											</TableCell>
											<TableCell className="py-4 text-sm font-mono text-slate-700">
												{rec.noHp}
											</TableCell>
											<TableCell className="py-4">{renderFee(rec)}</TableCell>
											<TableCell className="py-4">{renderBukti(rec)}</TableCell>
											<TableCell className="py-4">
												{renderStatus(rec)}
											</TableCell>
											{canEdit && (
												<TableCell className="pr-6 py-4 text-right">
													{renderActions(rec)}
												</TableCell>
											)}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* Ponsel: kartu satu kolom */}
						<ul className="md:hidden divide-y divide-slate-100">
							{feeShareRecipients.map((rec) => (
								<li key={rec.id} className="space-y-3 p-4">
									<div className="flex items-start justify-between gap-3">
										{recipientName(rec)}
										{renderStatus(rec)}
									</div>
									{rec.noHp && (
										<p className="text-sm font-mono text-slate-700">
											{rec.noHp}
										</p>
									)}
									{renderFee(rec)}
									<div>{renderBukti(rec)}</div>
									{canEdit && renderActions(rec, true)}
								</li>
							))}
						</ul>
					</>
				)}
			</section>

			{/* Dialog Tambah / Edit Penerima Fee: bottom sheet di ponsel, dialog di desktop */}
			<Dialog open={isFeeModalOpen} onOpenChange={setIsFeeModalOpen}>
				<DialogContent className="top-auto bottom-0 left-0 flex max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-b-none rounded-t-2xl p-0 sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[90dvh] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
					<DialogHeader className="border-b border-slate-200 px-4 pt-5 pb-3 pr-12 sm:px-6">
						<DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
							{editingRecipient
								? "Edit Penerima Fee Sharing"
								: "Tambah Penerima Fee Sharing"}
						</DialogTitle>
						<DialogDescription className="text-sm text-slate-500">
							Isi data penerima fee sharing untuk mahasiswa ini.
						</DialogDescription>
					</DialogHeader>

					<div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
						<fieldset className="space-y-4">
							<legend className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
								Penerima
							</legend>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="space-y-1.5">
									<Label
										htmlFor="fee-kategori"
										className="text-sm font-semibold text-slate-800"
									>
										Kategori
									</Label>
									<Select
										value={recipientForm.kategori}
										onValueChange={(val) => {
											if (val)
												setRecipientForm({ ...recipientForm, kategori: val });
										}}
									>
										<SelectTrigger
											id="fee-kategori"
											className="h-11 w-full text-base sm:text-sm"
										>
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
								<div className="space-y-1.5">
									<Label
										htmlFor="fee-institusi"
										className="text-sm font-semibold text-slate-800"
									>
										Nama institusi (opsional)
									</Label>
									<Input
										id="fee-institusi"
										value={recipientForm.namaInstitusi}
										onChange={(e) =>
											setRecipientForm({
												...recipientForm,
												namaInstitusi: e.target.value,
											})
										}
										placeholder="Contoh: SMKN 1 Banyuwangi / BKK Mandiri"
										className="h-11 text-base sm:text-sm"
									/>
								</div>
								<div className="space-y-1.5">
									<Label
										htmlFor="fee-nama"
										className="text-sm font-semibold text-slate-800"
									>
										Nama penerima *
									</Label>
									<Input
										id="fee-nama"
										value={recipientForm.namaReferral}
										onChange={(e) =>
											setRecipientForm({
												...recipientForm,
												namaReferral: e.target.value,
											})
										}
										placeholder="Contoh: Bpk. Ahmad Hidayat"
										className="h-11 text-base sm:text-sm"
									/>
								</div>
								<div className="space-y-1.5">
									<Label
										htmlFor="fee-hp"
										className="text-sm font-semibold text-slate-800"
									>
										No. HP *
									</Label>
									<Input
										id="fee-hp"
										value={recipientForm.noHp}
										onKeyDown={preventNonPhoneKey}
										onChange={(e) =>
											setRecipientForm({
												...recipientForm,
												noHp: filterPhone(e.target.value, 15),
											})
										}
										placeholder="Contoh: 08123456789"
										className="h-11 text-base sm:text-sm"
									/>
								</div>
							</div>
						</fieldset>

						<fieldset className="space-y-4">
							<legend className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
								Pembayaran fee
							</legend>
							<div className="space-y-1.5">
								<Label
									htmlFor="fee-nominal"
									className="text-sm font-semibold text-slate-800"
								>
									Nominal fee disepakati (Rp) *
								</Label>
								<div className="relative">
									<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
										Rp
									</span>
									<Input
										id="fee-nominal"
										type="text"
										inputMode="numeric"
										value={
											recipientForm.nominalFee === 0 ||
											!recipientForm.nominalFee
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
										className="pl-10 h-11 text-base sm:text-sm"
									/>
								</div>
								<p className="text-xs text-slate-500">
									Akan dicairkan oleh Finance.
								</p>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="space-y-1.5">
									<Label
										htmlFor="fee-rekening"
										className="text-sm font-semibold text-slate-800"
									>
										No. rekening (opsional)
									</Label>
									<Input
										id="fee-rekening"
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
										className="h-11 text-base sm:text-sm"
									/>
								</div>
								<div className="space-y-1.5">
									<Label
										htmlFor="fee-bank"
										className="text-sm font-semibold text-slate-800"
									>
										Bank (opsional)
									</Label>
									<Input
										id="fee-bank"
										value={recipientForm.namaBank}
										onChange={(e) =>
											setRecipientForm({
												...recipientForm,
												namaBank: e.target.value,
											})
										}
										placeholder="BCA, Mandiri, dll."
										className="h-11 text-base sm:text-sm"
									/>
								</div>
							</div>
						</fieldset>
					</div>

					<DialogFooter className="mx-0 mb-0 grid grid-cols-2 gap-2 rounded-b-none border-slate-200 bg-white px-4 py-3 sm:flex sm:rounded-b-xl sm:px-6">
						<Button
							variant="outline"
							onClick={() => setIsFeeModalOpen(false)}
							className="h-11 text-sm font-semibold"
						>
							Batal
						</Button>
						<Button
							onClick={handleSaveRecipient}
							className="h-11 bg-[#0517B0] hover:bg-blue-800 text-white text-sm font-semibold"
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
