"use client";

import {
	Banknote,
	Building,
	Calendar,
	CheckCircle,
	CheckCircle2,
	Edit,
	Eye,
	Info,
	Paperclip,
	Plane,
	Plus,
	SlidersHorizontal,
	Sparkles,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { FilePreviewDialog } from "@/components/panels/finance/FilePreviewDialog";
import { TalanganSchemeModal } from "@/components/panels/finance/TalanganSchemeModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/lib/eden";
import { openDocumentReview } from "@/utils/document-review";
import {
	filterFinanceInteger,
	preventFinanceIntegerKey,
} from "@/utils/form-validators";
import { formatRupiah } from "@/utils/format";

interface DanaTalanganSectionProps {
	studentId: number;
	formData: any;
	canEdit: boolean;
	isEditingUtama: boolean;
	handleFieldChange: (field: string, val: any) => void;
	intPct: number;
	kebPct: number;
	talanganSemCount: number;
	talanganSemListText: string;
	t1SemesterNominal: number;
	t1InterviewNominal: number;
	totalTahap1Nominal: number;
	totalTahap2Nominal: number;
	t1Paid: number;
	t2Paid: number;
	isTahap1Lunas: boolean;
	isTahap2Lunas: boolean;
	t1Installments: any[];
	t2Installments: any[];
	openTalanganModal: (stage: "tahap_1" | "tahap_2", inst?: any) => void;
	handleDeleteTalanganInstallment: (id: number) => void;
	hasAdminTalanganDoc: boolean;
	preventMinus: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	handleToggleStatus?: (fieldKey: string, nextStatus: boolean) => void;
	onUpdate: () => void;
}

export function DanaTalanganSection({
	studentId,
	formData,
	canEdit,
	isEditingUtama,
	handleFieldChange,
	intPct,
	kebPct,
	talanganSemCount,
	talanganSemListText,
	t1SemesterNominal,
	t1InterviewNominal,
	totalTahap1Nominal,
	totalTahap2Nominal,
	t1Paid,
	t2Paid,
	isTahap1Lunas,
	isTahap2Lunas,
	t1Installments,
	t2Installments,
	openTalanganModal,
	handleDeleteTalanganInstallment,
	hasAdminTalanganDoc,
	preventMinus,
	handleToggleStatus,
	onUpdate,
}: DanaTalanganSectionProps) {
	const [schemeModalOpen, setSchemeModalOpen] = useState(false);
	const [previewModal, setPreviewModal] = useState<{
		open: boolean;
		fileUrl: string | null;
		title: string;
	}>({ open: false, fileUrl: null, title: "" });

	if (formData?.metodePembayaran !== "dana_talangan") {
		return null;
	}

	const isSatuTahap = formData?.talanganTipe === "1_tahap";
	const effectiveT2Nominal =
		isSatuTahap && Number(formData?.talanganTotalPengajuan) > 0
			? Number(formData.talanganTotalPengajuan)
			: totalTahap2Nominal;
	const totalPengajuanDisplay =
		Number(formData?.talanganTotalPengajuan) > 0
			? Number(formData.talanganTotalPengajuan)
			: isSatuTahap
				? effectiveT2Nominal
				: totalTahap1Nominal + totalTahap2Nominal;

	const isTahap1Checked = Boolean(
		formData?.t1InterviewStatus || formData?.t1SemesterStatus || isTahap1Lunas,
	);
	const isTahap2Checked = Boolean(
		formData?.t2KeberangkatanStatus || isTahap2Lunas,
	);
	const isAdminChecked = Boolean(
		formData?.adminTalaganStatus || hasAdminTalanganDoc,
	);

	return (
		<div className="space-y-6 p-5 border border-emerald-100 bg-emerald-50/40 rounded-xl">
			{/* Header Skema Dana Talangan */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-3.5">
				<div>
					<div className="flex items-center gap-2">
						<h4 className="font-bold text-emerald-950 flex items-center gap-2 text-sm sm:text-base">
							<Sparkles className="w-4 h-4 text-emerald-600" />
							Rincian Skema Dana Talangan
						</h4>
						<Badge
							variant="outline"
							className={`text-[10px] font-bold ${
								isSatuTahap
									? "bg-emerald-100/80 border-emerald-300 text-emerald-800"
									: "bg-amber-100/80 border-amber-300 text-amber-900"
							}`}
						>
							{isSatuTahap ? "1 Tahap (Keberangkatan)" : "2 Tahap (Bertahap)"}
						</Badge>
					</div>
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-emerald-800">
						<span>
							Total Pengajuan:{" "}
							<strong className="font-mono text-emerald-950">
								{formatRupiah(totalPengajuanDisplay)}
							</strong>
						</span>
						{formData?.talanganLembaga && (
							<span>
								• Mitra: <strong>{formData.talanganLembaga}</strong>
							</span>
						)}
						{formData?.talanganNotes && (
							<span>
								• Akad: <span className="italic">{formData.talanganNotes}</span>
							</span>
						)}
					</div>
				</div>

				{canEdit && (
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() => setSchemeModalOpen(true)}
						className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100/80 text-xs font-semibold gap-1.5 shadow-2xs h-8.5 rounded-lg self-start sm:self-auto"
					>
						<SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
						Atur Skema & Plafon
					</Button>
				)}
			</div>

			<div className="grid gap-6">
				{/* 1. Card Tahap 1: Interview Magang & Semester Ditalangi (Hanya tampil jika 2 Tahap) */}
				{!isSatuTahap ? (
					<div
						className={`p-5 rounded-xl border transition-colors space-y-4 ${
							isTahap1Checked
								? "border-emerald-200 bg-emerald-50/20 shadow-xs"
								: "border-slate-200/90 bg-white shadow-2xs"
						}`}
					>
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
							<div className="flex items-start gap-3">
								<Checkbox
									id="chk-t1Status"
									checked={isTahap1Checked}
									disabled={!canEdit}
									onCheckedChange={(checked) => {
										if (isEditingUtama) {
											handleFieldChange("t1InterviewStatus", Boolean(checked));
											handleFieldChange("t1SemesterStatus", Boolean(checked));
											if (checked && !formData?.t1InterviewPaidDate) {
												handleFieldChange(
													"t1InterviewPaidDate",
													new Date().toISOString().split("T")[0],
												);
											}
										} else if (handleToggleStatus) {
											handleToggleStatus("t1InterviewStatus", Boolean(checked));
											handleToggleStatus("t1SemesterStatus", Boolean(checked));
										}
									}}
									className="mt-1 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
								/>
								<div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/20">
									<Building className="w-5 h-5 text-amber-600" />
								</div>
								<div>
									<label htmlFor="chk-t1Status">
										Tahap 1: SPP Semester 1 & Kontrak Magang/Suhan Ditalangi
									</label>
									<div className="flex items-center gap-2 mt-0.5">
										<Badge
											variant="outline"
											className="text-[10px] font-semibold bg-amber-50 border-amber-200 text-amber-700"
										>
											Partisi 3 ({intPct}% Total) + SPP Semester 1
										</Badge>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-3">
								{isTahap1Checked ? (
									<Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs py-1 px-2.5 font-bold">
										<CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />{" "}
										Lunas / Selesai
									</Badge>
								) : t1Paid > 0 ? (
									<Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs py-1 px-2.5 font-bold">
										Cicilan Sebagian (
										{totalTahap1Nominal > 0
											? Math.min(
													100,
													Math.round((t1Paid / totalTahap1Nominal) * 100),
												)
											: 0}
										%)
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-slate-500 border-slate-200 text-xs py-1 px-2.5"
									>
										Belum Lunas
									</Badge>
								)}
							</div>
						</div>

						{/* Total Biaya Tahap 1 & Metric Chips Box */}
						<div className="p-4 bg-gradient-to-r from-amber-50/70 via-slate-50/60 to-white border border-amber-200/80 rounded-xl space-y-3">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div>
									<span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
										Plafon Pinjaman Tahap 1
									</span>
									<p className="text-xs text-slate-500 mt-0.5">
										Akumulasi biaya SPP Semester 1 yang ditalangi dan biaya
										kontrak magang / Surat Suhan
									</p>
								</div>
								<div className="text-left sm:text-right">
									<span className="text-2xl font-black text-amber-900 tracking-tight font-mono block">
										{formatRupiah(totalTahap1Nominal)}
									</span>
								</div>
							</div>

							{/* 3 Metric Chips */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/60">
								<div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
									<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
										Total Tagihan
									</span>
									<span className="text-sm font-bold text-slate-800 font-mono">
										{formatRupiah(totalTahap1Nominal)}
									</span>
								</div>
								<div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
									<span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
										Sudah Terbayar
									</span>
									<span className="text-sm font-bold text-emerald-700 font-mono">
										{formatRupiah(t1Paid)}
									</span>
								</div>
								<div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
									<span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
										Sisa Tagihan
									</span>
									<span className="text-sm font-bold text-amber-800 font-mono">
										{formatRupiah(Math.max(0, totalTahap1Nominal - t1Paid))}
									</span>
								</div>
							</div>

							{/* Progress Bar */}
							<div className="space-y-1 pt-1">
								<div className="flex justify-between text-[11px] font-semibold text-slate-600">
									<span>Progres Pembayaran Tahap 1</span>
									<span className="font-mono">
										{totalTahap1Nominal > 0
											? `${Math.min(100, Math.round((t1Paid / totalTahap1Nominal) * 100))}%`
											: "0%"}
									</span>
								</div>
								<div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden border border-slate-200">
									<div
										className="h-full bg-amber-500 rounded-full transition-all duration-300"
										style={{
											width: `${totalTahap1Nominal > 0 ? Math.min(100, (t1Paid / totalTahap1Nominal) * 100) : 0}%`,
										}}
									/>
								</div>
							</div>
						</div>

						{/* Rincian Komponen Tahap 1 */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80 flex flex-col justify-between">
								<div className="flex items-center justify-between mb-1">
									<span className="text-xs font-semibold text-slate-600">
										1. Biaya Perkuliahan Ditalangi
									</span>
									<Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
										{talanganSemCount > 0
											? `${talanganSemCount} Semester`
											: "0 Semester"}
									</Badge>
								</div>
								<div className="text-base font-bold text-slate-800 font-mono">
									{formatRupiah(t1SemesterNominal)}
								</div>
								<p className="text-[11px] text-slate-500 mt-1">
									{talanganSemCount > 0
										? talanganSemListText
										: "Belum ada semester yang dialihkan ke talangan"}
								</p>
							</div>

							<div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80 flex flex-col justify-between">
								<div className="flex items-center justify-between mb-1">
									<span className="text-xs font-semibold text-slate-600">
										2. Biaya Kontrak Magang / Suhan
									</span>
									<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
										Partisi 3 ({intPct}%)
									</Badge>
								</div>
								<div className="text-base font-bold text-slate-800 font-mono">
									{formatRupiah(t1InterviewNominal)}
								</div>
								<p className="text-[11px] text-slate-500 mt-1">
									Disesuaikan otomatis dari Partisi Biaya Pendidikan
								</p>
							</div>
						</div>

						{/* Riwayat Pembayaran Cicilan Tahap 1 */}
						<div className="pt-2 space-y-3">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
										Riwayat Pembayaran Tahap 1
									</span>
									<Badge
										variant="outline"
										className="text-[10px] font-semibold bg-slate-100 border-slate-200 text-slate-700"
									>
										{t1Installments.length} Pembayaran
									</Badge>
								</div>

								{canEdit && (
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="h-8 text-xs font-semibold border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100 gap-1.5 shadow-2xs"
										onClick={() => openTalanganModal("tahap_1")}
									>
										<Plus className="w-3.5 h-3.5 text-amber-600" />
										Tambah Pembayaran Tahap 1
									</Button>
								)}
							</div>

							{t1Installments.length === 0 ? (
								<div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
									Belum ada catatan pembayaran cicilan untuk Tahap 1
								</div>
							) : (
								<div className="space-y-2">
									{t1Installments.map((inst: any, idx: number) => (
										<div
											key={inst.id}
											className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-200/90 rounded-lg"
										>
											<div className="flex items-center gap-3">
												<div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
													#{idx + 1}
												</div>
												<div>
													<span className="text-sm font-bold text-slate-800 font-mono">
														{formatRupiah(inst.nominalPaid)}
													</span>
													<div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
														<Calendar className="w-3 h-3" />
														{inst.paymentDate
															? new Date(inst.paymentDate).toLocaleDateString(
																	"id-ID",
																	{
																		day: "numeric",
																		month: "long",
																		year: "numeric",
																	},
																)
															: "-"}
														{inst.notes && <span>• {inst.notes}</span>}
													</div>
												</div>
											</div>

											<div className="flex items-center gap-1.5 shrink-0">
												{inst.buktiBayarUrl ? (
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() =>
															openDocumentReview(
																studentId,
																inst.buktiBayarUrl,
																`Bukti Pembayaran Talangan — Tahap 1 #${idx + 1}.pdf`,
																`talangan-t1-${inst.id}`,
															)
														}
														className="h-6 px-2 text-[10px] font-semibold text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/10 bg-white rounded-md gap-1 shadow-2xs cursor-pointer"
														title="Review Bukti Bayar"
													>
														<Eye className="w-3.5 h-3.5 text-[#0517B0]" />
														<span>Review Bukti</span>
													</Button>
												) : null}

												{canEdit && (
													<>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
															onClick={() => openTalanganModal("tahap_1", inst)}
															title="Edit Pembayaran"
														>
															<Edit className="w-3.5 h-3.5" />
														</Button>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
															onClick={() =>
																handleDeleteTalanganInstallment(inst.id)
															}
															title="Hapus Pembayaran"
														>
															<Trash2 className="w-3.5 h-3.5" />
														</Button>
													</>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				) : (
					<div className="p-4 rounded-xl border border-dashed border-emerald-300 bg-white/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
						<div className="flex items-start gap-3">
							<div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
								<Info className="w-4 h-4 text-emerald-700" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h5 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
										Tahap 1 (SPP & Kontrak Magang) — Tidak Digunakan
									</h5>
									<Badge
										variant="outline"
										className="text-[10px] bg-slate-100 text-slate-600 border-slate-200 font-semibold"
									>
										Skema 1 Tahap
									</Badge>
								</div>
								<p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
									Mahasiswa terdaftar pada skema Akad 1 Tahap (Keberangkatan).
									Seluruh plafon talangan sebesar{" "}
									<strong className="text-emerald-800 font-mono">
										{formatRupiah(effectiveT2Nominal)}
									</strong>{" "}
									dialokasikan penuh pada Tahap Keberangkatan / Penempatan.
								</p>
							</div>
						</div>
						{canEdit && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setSchemeModalOpen(true)}
								className="text-xs h-8 px-3 border-emerald-300 text-emerald-800 hover:bg-emerald-50 shrink-0 font-semibold"
							>
								Ubah ke 2 Tahap
							</Button>
						)}
					</div>
				)}

				{/* 2. Card Tahap 2: Keberangkatan */}
				<div
					className={`p-5 rounded-xl border transition-colors space-y-4 ${
						isTahap2Checked
							? "border-emerald-200 bg-emerald-50/20 shadow-xs"
							: "border-slate-200/90 bg-white shadow-2xs"
					}`}
				>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
						<div className="flex items-start gap-3">
							<Checkbox
								id="chk-t2Status"
								checked={isTahap2Checked}
								disabled={!canEdit}
								onCheckedChange={(checked) => {
									if (isEditingUtama) {
										handleFieldChange(
											"t2KeberangkatanStatus",
											Boolean(checked),
										);
										if (checked && !formData?.t2KeberangkatanPaidDate) {
											handleFieldChange(
												"t2KeberangkatanPaidDate",
												new Date().toISOString().split("T")[0],
											);
										}
									} else if (handleToggleStatus) {
										handleToggleStatus(
											"t2KeberangkatanStatus",
											Boolean(checked),
										);
									}
								}}
								className="mt-1 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
							/>
							<div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
								<Plane className="w-5 h-5 text-emerald-600" />
							</div>
							<div>
								<label
									htmlFor="chk-t2Status"
									className="font-bold text-slate-800 text-sm tracking-tight cursor-pointer"
								>
									{isSatuTahap
										? "Tahap Akad Tunggal: Penempatan Magang / Keberangkatan"
										: "Tahap 2: Penempatan Magang Taiwan / Keberangkatan"}
								</label>
								<div className="flex items-center gap-2 mt-0.5">
									<Badge
										variant="outline"
										className="text-[10px] font-semibold bg-emerald-50 border-emerald-200 text-emerald-700"
									>
										{isSatuTahap
											? "Akad Tunggal Keberangkatan (100% Plafon Talangan)"
											: `Partisi 4 (${kebPct}% Total Biaya Pendidikan)`}
									</Badge>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3">
							{isTahap2Checked ? (
								<Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs py-1 px-2.5 font-bold">
									<CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />{" "}
									Lunas / Selesai
								</Badge>
							) : t2Paid > 0 ? (
								<Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs py-1 px-2.5 font-bold">
									Cicilan Sebagian (
									{effectiveT2Nominal > 0
										? Math.min(
												100,
												Math.round((t2Paid / effectiveT2Nominal) * 100),
											)
										: 0}
									%)
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="text-slate-500 border-slate-200 text-xs py-1 px-2.5"
								>
									Belum Lunas
								</Badge>
							)}
						</div>
					</div>

					{/* Total Biaya Tahap 2 & Metric Chips Box */}
					<div className="p-4 bg-gradient-to-r from-emerald-50/70 via-slate-50/60 to-white border border-emerald-200/80 rounded-xl space-y-3">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div>
								<span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
									Plafon Pinjaman {isSatuTahap ? "Akad Tunggal" : "Tahap 2"}
								</span>
								<p className="text-xs text-slate-500 mt-0.5">
									{isSatuTahap
										? "Plafon penuh dana talangan dialokasikan dan dicairkan saat keberangkatan magang"
										: "Disesuaikan otomatis dari Partisi Biaya Pendidikan (Penempatan Magang / Keberangkatan)"}
								</p>
							</div>
							<div className="text-left sm:text-right">
								<span className="text-2xl font-black text-emerald-900 tracking-tight font-mono block">
									{formatRupiah(effectiveT2Nominal)}
								</span>
							</div>
						</div>

						{/* 3 Metric Chips */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-emerald-200/60">
							<div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
								<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
									Total Tagihan
								</span>
								<span className="text-sm font-bold text-slate-800 font-mono">
									{formatRupiah(effectiveT2Nominal)}
								</span>
							</div>
							<div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
								<span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
									Sudah Terbayar
								</span>
								<span className="text-sm font-bold text-emerald-700 font-mono">
									{formatRupiah(t2Paid)}
								</span>
							</div>
							<div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
								<span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
									Sisa Tagihan
								</span>
								<span className="text-sm font-bold text-amber-800 font-mono">
									{formatRupiah(Math.max(0, effectiveT2Nominal - t2Paid))}
								</span>
							</div>
						</div>

						{/* Progress Bar */}
						<div className="space-y-1 pt-1">
							<div className="flex justify-between text-[11px] font-semibold text-slate-600">
								<span>
									Progres Pembayaran{" "}
									{isSatuTahap ? "Talangan Keberangkatan" : "Tahap 2"}
								</span>
								<span className="font-mono">
									{effectiveT2Nominal > 0
										? `${Math.min(100, Math.round((t2Paid / effectiveT2Nominal) * 100))}%`
										: "0%"}
								</span>
							</div>
							<div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden border border-slate-200">
								<div
									className="h-full bg-emerald-500 rounded-full transition-all duration-300"
									style={{
										width: `${effectiveT2Nominal > 0 ? Math.min(100, (t2Paid / effectiveT2Nominal) * 100) : 0}%`,
									}}
								/>
							</div>
						</div>
					</div>

					{/* Riwayat Pembayaran Cicilan Tahap 2 */}
					<div className="pt-2 space-y-3">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								<span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
									Riwayat Pembayaran Tahap 2
								</span>
								<Badge
									variant="outline"
									className="text-[10px] font-semibold bg-slate-100 border-slate-200 text-slate-700"
								>
									{t2Installments.length} Pembayaran
								</Badge>
							</div>

							{canEdit && (
								<Button
									type="button"
									size="sm"
									variant="outline"
									className="h-8 text-xs font-semibold border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100 gap-1.5 shadow-2xs"
									onClick={() => openTalanganModal("tahap_2")}
								>
									<Plus className="w-3.5 h-3.5 text-emerald-600" />
									Tambah Pembayaran Tahap 2
								</Button>
							)}
						</div>

						{t2Installments.length === 0 ? (
							<div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
								Belum ada catatan pembayaran cicilan untuk Tahap 2
							</div>
						) : (
							<div className="space-y-2">
								{t2Installments.map((inst: any, idx: number) => (
									<div
										key={inst.id}
										className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-200/90 rounded-lg"
									>
										<div className="flex items-center gap-3">
											<div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
												#{idx + 1}
											</div>
											<div>
												<span className="text-sm font-bold text-slate-800 font-mono">
													{formatRupiah(inst.nominalPaid)}
												</span>
												<div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
													<Calendar className="w-3 h-3" />
													{inst.paymentDate
														? new Date(inst.paymentDate).toLocaleDateString(
																"id-ID",
																{
																	day: "numeric",
																	month: "long",
																	year: "numeric",
																},
															)
														: "-"}
													{inst.notes && <span>• {inst.notes}</span>}
												</div>
											</div>
										</div>

										<div className="flex items-center gap-1.5 shrink-0">
											{inst.buktiBayarUrl ? (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														openDocumentReview(
															studentId,
															inst.buktiBayarUrl,
															`Bukti Pembayaran Talangan — Tahap 2 #${idx + 1}.pdf`,
															`talangan-t2-${inst.id}`,
														)
													}
													className="h-6 px-2 text-[10px] font-semibold text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/10 bg-white rounded-md gap-1 shadow-2xs cursor-pointer"
													title="Review Bukti Bayar"
												>
													<Eye className="w-3.5 h-3.5 text-[#0517B0]" />
													<span>Review Bukti</span>
												</Button>
											) : null}

											{canEdit && (
												<>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
														onClick={() => openTalanganModal("tahap_2", inst)}
														title="Edit Pembayaran"
													>
														<Edit className="w-3.5 h-3.5" />
													</Button>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
														onClick={() =>
															handleDeleteTalanganInstallment(inst.id)
														}
														title="Hapus Pembayaran"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</Button>
												</>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Bukti Bayar Keberangkatan */}
					<div className="pt-2">
						<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
							Bukti Bayar Keberangkatan (PDF)
						</label>
						<DocumentUpload
							studentId={studentId}
							panel="finance"
							documentKey="t2_keberangkatan"
							canEdit={canEdit}
							onUploadSuccess={onUpdate}
							onDeleteSuccess={onUpdate}
							onUpdate={onUpdate}
						/>
					</div>
				</div>

				{/* 3. Card Biaya Administrasi Talangan */}
				<div
					className={`p-5 rounded-xl border transition-colors space-y-4 ${
						isAdminChecked
							? "border-emerald-200 bg-emerald-50/20 shadow-xs"
							: "border-slate-200/90 bg-white shadow-2xs"
					}`}
				>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
						<div className="flex items-center gap-2.5">
							<Checkbox
								id="chk-adminTalaganStatus"
								checked={isAdminChecked}
								disabled={!canEdit}
								onCheckedChange={(checked) => {
									if (isEditingUtama) {
										handleFieldChange("adminTalaganStatus", Boolean(checked));
										if (checked && !formData?.adminTalaganPaidDate) {
											handleFieldChange(
												"adminTalaganPaidDate",
												new Date().toISOString().split("T")[0],
											);
										}
									} else if (handleToggleStatus) {
										handleToggleStatus("adminTalaganStatus", Boolean(checked));
									}
								}}
								className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
							/>
							<div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
								<Banknote className="w-4 h-4" />
							</div>
							<div>
								<label
									htmlFor="chk-adminTalaganStatus"
									className="font-bold text-slate-800 text-sm tracking-tight cursor-pointer hover:text-[#0517B0] transition-colors block"
								>
									Biaya Administrasi & Operasional Talangan
								</label>
								<p className="text-xs text-slate-500 mt-0.5">
									Biaya administrasi perjanjian talangan & notaris (jika ada)
								</p>
							</div>
						</div>
						<div>
							{isAdminChecked ? (
								<Badge className="bg-emerald-100 text-emerald-700 border-0 font-semibold">
									<CheckCircle className="w-3.5 h-3.5 mr-1" /> Lunas / Selesai
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="text-slate-500 border-slate-300"
								>
									Belum Lunas
								</Badge>
							)}
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div>
							<label className="text-xs font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
								Nominal Administrasi
							</label>
							{isEditingUtama ? (
								<div className="relative">
									<span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
										Rp
									</span>
									<Input
										type="number"
										min={0}
										max={999999999}
										maxLength={9}
										onKeyDown={preventFinanceIntegerKey}
										value={formData?.adminTalaganNominal || ""}
										onChange={(e) =>
											handleFieldChange(
												"adminTalaganNominal",
												filterFinanceInteger(e.target.value),
											)
										}
										placeholder="0"
										className="pl-9 h-9 text-xs font-semibold"
									/>
								</div>
							) : (
								<div className="text-sm font-bold text-slate-800 font-mono">
									{formatRupiah(formData?.adminTalaganNominal || 0)}
								</div>
							)}
						</div>

						<div>
							<label className="text-xs font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
								Bank Tujuan
							</label>
							{isEditingUtama ? (
								<Input
									type="text"
									value={formData?.adminTalaganBankTujuan || ""}
									onChange={(e) =>
										handleFieldChange("adminTalaganBankTujuan", e.target.value)
									}
									placeholder="Contoh: BCA 123456789"
									className="h-9 text-xs"
								/>
							) : (
								<div className="text-xs font-medium text-slate-700">
									{formData?.adminTalaganBankTujuan || "-"}
								</div>
							)}
						</div>

						<div>
							<label className="text-xs font-semibold text-slate-500 block mb-1.5 uppercase tracking-wider">
								Bukti Bayar Administrasi (PDF)
							</label>
							<DocumentUpload
								studentId={studentId}
								panel="finance"
								documentKey="admin_talangan"
								canEdit={canEdit}
								onUploadSuccess={onUpdate}
								onDeleteSuccess={onUpdate}
								onUpdate={onUpdate}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Modal Atur Skema Talangan */}
			<TalanganSchemeModal
				open={schemeModalOpen}
				onOpenChange={setSchemeModalOpen}
				studentId={studentId}
				currentScheme={{
					talanganTipe: formData?.talanganTipe,
					talanganTotalPengajuan: formData?.talanganTotalPengajuan,
					talanganLembaga: formData?.talanganLembaga,
					talanganNotes: formData?.talanganNotes,
					t1Nominal: totalTahap1Nominal,
					t2Nominal: effectiveT2Nominal,
					totalBiayaPendidikan: formData?.totalBiayaPendidikan,
				}}
				onSuccess={() => {
					onUpdate();
				}}
			/>

			{/* Modal Pratinjau Bukti Pembayaran */}
			<FilePreviewDialog
				open={previewModal.open}
				onOpenChange={(open) => setPreviewModal((prev) => ({ ...prev, open }))}
				fileUrl={previewModal.fileUrl}
				title={previewModal.title}
			/>
		</div>
	);
}
