"use client";

import { Banknote, Eye, Loader2, Paperclip, Save, Trash2 } from "lucide-react";
import type React from "react";
import { useRef } from "react";
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

interface TalanganInstallmentModalProps {
	studentId?: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	activeStage: "tahap_1" | "tahap_2";
	activeInstallment: any;
	form: {
		nominalPaid: string;
		paymentDate: string;
		notes: string;
		file: File | null;
		buktiBayarUrl: string;
	};
	setForm: React.Dispatch<
		React.SetStateAction<{
			nominalPaid: string;
			paymentDate: string;
			notes: string;
			file: File | null;
			buktiBayarUrl: string;
		}>
	>;
	saving: boolean;
	onSave: () => void;
	preventMinus: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function TalanganInstallmentModal({
	studentId,
	open,
	onOpenChange,
	activeStage,
	activeInstallment,
	form,
	setForm,
	saving,
	onSave,
	preventMinus,
}: TalanganInstallmentModalProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const stageLabel =
		activeStage === "tahap_1"
			? "Tahap 1 (Interview & Semester)"
			: "Tahap 2 (Keberangkatan)";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-slate-900">
						<Banknote className="w-5 h-5 text-emerald-600" />
						{activeInstallment
							? `Edit Pembayaran — ${stageLabel}`
							: `Tambah Pembayaran — ${stageLabel}`}
					</DialogTitle>
					<DialogDescription className="text-xs text-slate-500">
						Catat riwayat dan bukti pembayaran untuk pinjaman dana talangan.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div>
						<Label className="text-xs font-semibold text-slate-600">
							Nominal Pembayaran (Rp) <span className="text-rose-500">*</span>
						</Label>
						<Input
							type="text"
							inputMode="numeric"
							maxLength={9}
							onKeyDown={preventNonNumericKey}
							value={form.nominalPaid}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									nominalPaid: filterNumeric(
										e.target.value,
										9,
										"Nominal pembayaran maksimal 9 digit",
									),
								}))
							}
							placeholder="0"
							className="mt-1"
						/>
						{Number(form.nominalPaid) > 0 && (
							<p className="text-xs text-slate-500 mt-1 font-mono">
								Terbaca: {formatRupiah(Number(form.nominalPaid))}
							</p>
						)}
					</div>

					<div>
						<Label className="text-xs font-semibold text-slate-600">
							Tanggal Pembayaran
						</Label>
						<Input
							type="date"
							value={form.paymentDate}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									paymentDate: e.target.value,
								}))
							}
							className="mt-1"
						/>
					</div>

					<div>
						<Label className="text-xs font-semibold text-slate-600">
							Catatan / Keterangan
						</Label>
						<Textarea
							value={form.notes}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									notes: e.target.value,
								}))
							}
							placeholder="Contoh: Pemotongan gaji bulan pertama / Transfer mandiri"
							rows={2}
							className="mt-1 text-xs"
						/>
					</div>

					{/* Upload Bukti Pembayaran */}
					<div>
						<Label className="text-xs font-semibold text-slate-600 block mb-1">
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
									setForm((prev) => ({
										...prev,
										file: f,
									}));
								}
							}}
						/>
						{form.file ? (
							<div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
								<div className="flex items-center gap-2 text-xs text-emerald-800 truncate">
									<Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
									<span className="truncate font-semibold">
										{form.file.name}
									</span>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-6 text-xs text-rose-500 hover:text-rose-700 px-1.5"
									onClick={() =>
										setForm((prev) => ({
											...prev,
											file: null,
										}))
									}
								>
									<Trash2 className="w-3.5 h-3.5" />
								</Button>
							</div>
						) : form.buktiBayarUrl ? (
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
												studentId || "review",
												form.buktiBayarUrl,
												`Bukti Bayar Talangan — ${stageLabel}.pdf`,
												activeInstallment?.id || "talangan",
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
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="w-full border-dashed text-xs text-slate-600 gap-1.5"
								onClick={() => fileInputRef.current?.click()}
							>
								<Paperclip className="w-3.5 h-3.5" /> Pilih Berkas Bukti Bayar
							</Button>
						)}
					</div>
				</div>

				<DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
						disabled={saving}
						className="text-xs h-9 px-4"
					>
						Batal
					</Button>
					<Button
						size="sm"
						onClick={onSave}
						disabled={saving}
						className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 shadow-xs"
					>
						{saving ? (
							<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
						) : (
							<Save className="w-3.5 h-3.5 mr-1.5" />
						)}
						{activeInstallment ? "Perbarui Pembayaran" : "Simpan Pembayaran"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
