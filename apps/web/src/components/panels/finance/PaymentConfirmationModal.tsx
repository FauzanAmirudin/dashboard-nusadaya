"use client";

import {
	AlertCircle,
	Calendar,
	CheckCircle,
	CreditCard,
	Eye,
	FileText,
	Loader2,
	Paperclip,
	Save,
	Trash2,
	Undo2,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { API_URL } from "@/lib/eden";
import { openDocumentReview } from "@/utils/document-review";
import { filterNumeric, preventNonNumericKey } from "@/utils/form-validators";
import { formatRupiah } from "@/utils/format";
import { FilePreviewDialog } from "./FilePreviewDialog";

interface PaymentConfirmationModalProps {
	studentId?: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	activeInstallment: any;
	activeSemester: any;
	paymentForm: {
		paymentDate: string;
		nominalPaid: string;
		notes: string;
		file: File | null;
		buktiBayarUrl: string;
		status: string;
	};
	setPaymentForm: React.Dispatch<
		React.SetStateAction<{
			paymentDate: string;
			nominalPaid: string;
			notes: string;
			file: File | null;
			buktiBayarUrl: string;
			status: string;
		}>
	>;
	saving: boolean;
	onSave: () => void;
	onCancelPayment?: () => void;
	preventMinus: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function PaymentConfirmationModal({
	studentId,
	open,
	onOpenChange,
	activeInstallment,
	activeSemester,
	paymentForm,
	setPaymentForm,
	saving,
	onSave,
	onCancelPayment,
	preventMinus,
}: PaymentConfirmationModalProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [previewModal, setPreviewModal] = useState<{
		open: boolean;
		file?: File | null;
		fileUrl?: string | null;
		title?: string;
	}>({
		open: false,
		file: null,
		fileUrl: null,
		title: "",
	});

	const scheduledNominal =
		activeInstallment?.nominalScheduled || activeInstallment?.nominalPaid || 0;
	const isAlreadyPaid =
		activeInstallment?.status === "LUNAS" ||
		(activeInstallment?.nominalPaid > 0 &&
			activeInstallment?.status !== "BELUM_BAYAR");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[95vw] sm:max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl bg-white">
				<DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 shrink-0 bg-white pr-12">
					<DialogTitle className="flex items-center gap-2 text-slate-900 text-base sm:text-lg font-bold">
						<CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
						<span className="truncate">
							{isAlreadyPaid
								? `Perbarui Pembayaran — ${activeInstallment?.installmentMonth || "Cicilan"}`
								: `Konfirmasi Pembayaran — ${activeInstallment?.installmentMonth || "Cicilan"}`}
						</span>
					</DialogTitle>
					<DialogDescription className="text-xs text-slate-500 mt-0.5">
						Catat realisasi pembayaran dan bukti transfer untuk jadwal cicilan
						ini.
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
					{/* Ringkasan Jadwal Tagihan */}
					<div className="p-3.5 bg-gradient-to-r from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-xl space-y-2">
						<div className="flex items-center justify-between text-xs">
							<span className="text-slate-500 font-medium">
								Jadwal Periode:
							</span>
							<span className="font-bold text-indigo-900">
								{activeInstallment?.installmentMonth || "Cicilan Fleksibel"}
							</span>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span className="text-slate-500 font-medium">Jatuh Tempo:</span>
							<span className="font-semibold text-slate-700 flex items-center gap-1">
								<Calendar className="w-3.5 h-3.5 text-indigo-500" />
								{activeInstallment?.dueDate
									? new Date(activeInstallment.dueDate).toLocaleDateString(
											"id-ID",
											{
												day: "numeric",
												month: "long",
												year: "numeric",
											},
										)
									: "Belum ditentukan"}
							</span>
						</div>
						<div className="flex items-center justify-between text-xs border-t border-indigo-100/70 pt-2">
							<span className="text-slate-500 font-medium">
								Tagihan Terjadwal:
							</span>
							<span className="font-bold font-mono text-indigo-900 text-sm">
								{formatRupiah(scheduledNominal)}
							</span>
						</div>
					</div>

					{/* Nominal Pembayaran Aktual */}
					<div>
						<div className="flex items-center justify-between mb-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								Nominal Yang Dibayarkan (Rp){" "}
								<span className="text-rose-500">*</span>
							</Label>
							{scheduledNominal > 0 && (
								<button
									type="button"
									onClick={() =>
										setPaymentForm((prev) => ({
											...prev,
											nominalPaid: scheduledNominal.toString(),
										}))
									}
									className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 cursor-pointer"
								>
									Sesuai Tagihan ({formatRupiah(scheduledNominal)})
								</button>
							)}
						</div>
						<Input
							type="text"
							inputMode="numeric"
							maxLength={9}
							onKeyDown={preventMinus}
							value={paymentForm.nominalPaid}
							onChange={(e) =>
								setPaymentForm((prev) => ({
									...prev,
									nominalPaid: filterNumeric(
										e.target.value,
										9,
										"Nominal pembayaran maksimal 9 digit",
									),
								}))
							}
							placeholder="Masukkan nominal yang dibayar..."
							className="font-mono text-sm"
						/>
						<p className="text-[11px] text-slate-400 mt-1">
							Nominal aktual yang ditransfer oleh mahasiswa / wali.
						</p>
					</div>

					{/* Tanggal Pembayaran */}
					<div>
						<Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
							Tanggal Pembayaran <span className="text-rose-500">*</span>
						</Label>
						<Input
							type="date"
							value={paymentForm.paymentDate}
							onChange={(e) =>
								setPaymentForm((prev) => ({
									...prev,
									paymentDate: e.target.value,
								}))
							}
							className="text-xs"
						/>
						<p className="text-[11px] text-slate-400 mt-1">
							Tanggal mahasiswa melakukan transfer / pembayaran tunai.
						</p>
					</div>

					{/* Catatan / Keterangan Pembayaran */}
					<div>
						<Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
							Catatan / Referensi Transfer
						</Label>
						<Textarea
							value={paymentForm.notes}
							onChange={(e) =>
								setPaymentForm((prev) => ({
									...prev,
									notes: e.target.value,
								}))
							}
							placeholder="Contoh: Transfer via Bank Mandiri a.n. Mahasiswa, Referensi #123456"
							rows={2}
							className="text-xs"
						/>
					</div>

					{/* Bukti Pembayaran */}
					<div>
						<Label className="text-xs font-semibold text-slate-700 block mb-1.5">
							Bukti Pembayaran (PDF / Gambar)
						</Label>
						<input
							ref={fileInputRef}
							type="file"
							accept="application/pdf,image/*"
							className="hidden"
							onChange={(e) => {
								const f = e.target.files?.[0];
								if (f) {
									setPaymentForm((prev) => ({
										...prev,
										file: f,
									}));
								}
							}}
						/>
						{paymentForm.file ? (
							<div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
								<div className="flex items-center gap-2 text-xs text-emerald-800 truncate pr-2">
									<Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
									<span className="truncate font-semibold">
										{paymentForm.file.name}
									</span>
								</div>
								<div className="flex items-center gap-1.5 shrink-0">
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-100/60 rounded-lg cursor-pointer gap-1 shadow-2xs"
										onClick={() =>
											setPreviewModal({
												open: true,
												file: paymentForm.file,
												fileUrl: null,
												title: `Bukti Bayar — ${paymentForm.file?.name}`,
											})
										}
									>
										<Eye className="w-3.5 h-3.5" />
										Preview
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-7 px-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
										onClick={() =>
											setPaymentForm((prev) => ({ ...prev, file: null }))
										}
									>
										<Trash2 className="w-3.5 h-3.5" />
									</Button>
								</div>
							</div>
						) : paymentForm.buktiBayarUrl ? (
							<div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
								<div className="flex items-center gap-2 text-xs text-slate-700 truncate pr-2">
									<Paperclip className="w-4 h-4 text-slate-500 shrink-0" />
									<span className="truncate font-semibold">
										Bukti Bayar Terlampir
									</span>
								</div>
								<div className="flex items-center gap-1.5 shrink-0">
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-7 text-xs font-semibold text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/10 bg-white rounded-lg cursor-pointer gap-1.5 shadow-2xs"
										onClick={() =>
											openDocumentReview(
												studentId || activeInstallment?.studentId || "review",
												paymentForm.buktiBayarUrl,
												`Bukti Bayar — ${activeInstallment?.installmentMonth || "Cicilan"}.pdf`,
												activeInstallment?.id || "installment",
											)
										}
										title="Review Dokumen Bukti Bayar"
									>
										<Eye className="w-3.5 h-3.5 text-[#0517B0]" />
										<span>Review Bukti</span>
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-7 text-xs border-slate-200 hover:bg-slate-100 cursor-pointer"
										onClick={() => fileInputRef.current?.click()}
									>
										Ganti Berkas
									</Button>
								</div>
							</div>
						) : (
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="w-full border-2 border-dashed border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/20 rounded-xl py-3.5 px-4 text-center cursor-pointer transition-all"
							>
								<Paperclip className="w-4 h-4 mx-auto mb-1 text-slate-400" />
								<span className="text-xs font-semibold text-slate-600 block">
									Pilih Berkas Bukti Pembayaran
								</span>
								<span className="text-[11px] text-slate-400 block mt-0.5">
									Format PDF, JPG, PNG (Maks 10MB)
								</span>
							</button>
						)}
					</div>
				</div>

				<DialogFooter className="m-0 p-4 sm:p-5 pt-3.5 sm:pt-4 pb-5 sm:pb-6 border-t border-slate-100 bg-slate-50/90 shrink-0 flex flex-row items-center justify-between gap-3">
					<div>
						{isAlreadyPaid && onCancelPayment && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={onCancelPayment}
								disabled={saving}
								className="text-xs h-9.5 px-3 text-rose-600 hover:bg-rose-50 rounded-xl gap-1.5 cursor-pointer"
								title="Batalkan status lunas cicilan ini"
							>
								<Undo2 className="w-3.5 h-3.5" />
								Batalkan Lunas
							</Button>
						)}
					</div>

					<div className="flex items-center gap-2.5">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={saving}
							className="text-xs h-9.5 px-4 rounded-xl border-slate-200 hover:bg-slate-100 cursor-pointer"
						>
							Batal
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={onSave}
							disabled={saving}
							className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9.5 px-5 rounded-xl shadow-2xs cursor-pointer gap-1.5"
						>
							{saving ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<Save className="w-3.5 h-3.5" />
							)}
							Simpan Pembayaran
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>

			{/* Modal Pratinjau Dokumen Bukti Bayar */}
			<FilePreviewDialog
				open={previewModal.open}
				onOpenChange={(open) => setPreviewModal((prev) => ({ ...prev, open }))}
				file={previewModal.file}
				fileUrl={previewModal.fileUrl}
				title={previewModal.title}
			/>
		</Dialog>
	);
}
