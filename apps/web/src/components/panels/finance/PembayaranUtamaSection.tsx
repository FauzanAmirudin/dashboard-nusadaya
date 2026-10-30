"use client";

import {
	AlertCircle,
	Banknote,
	Calendar,
	CheckCircle,
	Clock,
	CreditCard,
	Edit,
	Eye,
	FileText,
	GraduationCap,
	Info,
	Loader2,
	Paperclip,
	Plus,
	Save,
	Sparkles,
	Trash2,
	Wallet,
	X,
} from "lucide-react";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { API_URL } from "@/lib/eden";
import { openDocumentReview } from "@/utils/document-review";
import { formatRupiah } from "@/utils/format";
import { FilePreviewDialog } from "./FilePreviewDialog";

interface PembayaranUtamaSectionProps {
	studentId: number;
	canEdit: boolean;
	isEditingUtama: boolean;
	setIsEditingUtama: (val: boolean) => void;
	loadingUtama: boolean;
	handleCancelEdit: (section: "utama") => void;
	triggerSave: (section: "utama") => void;
	formData: any;
	handleFieldChange: (field: string, val: any) => void;
	isRegistrasiLunas: boolean;
	regPct: number;
	financeDocs: Record<string, any[]>;
	isSemesterAllLunas: boolean;
	semPct: number;
	curSemestersTotal: number;
	curSemesterPerSem: number;
	semesters: any[];
	semestersLunasCount: number;
	loadingSemesters: boolean;
	expandedSemesters: number[];
	toggleSemesterExpand: (num: number) => void;
	handleToggleTalangan: (semester: any) => void;
	openInstallmentModal: (semester: any, installment?: any) => void;
	openScheduleModal?: (semester: any, installment?: any) => void;
	openPaymentModal?: (semester: any, installment: any) => void;
	handleDeleteInstallment: (semesterId: number, installmentId: number) => void;
	handleToggleStatus?: (fieldKey: string, nextStatus: boolean) => void;
	isInterviewLunas: boolean;
	isKeberangkatanLunas: boolean;
	intPct: number;
	kebPct: number;
	destinationCountry?: string | null;
	onUpdate: () => void;
}

export function PembayaranUtamaSection({
	studentId,
	canEdit,
	isEditingUtama,
	setIsEditingUtama,
	loadingUtama,
	handleCancelEdit,
	triggerSave,
	formData,
	handleFieldChange,
	isRegistrasiLunas,
	regPct,
	financeDocs,
	isSemesterAllLunas,
	semPct,
	curSemestersTotal,
	curSemesterPerSem,
	semesters,
	semestersLunasCount,
	loadingSemesters,
	expandedSemesters,
	toggleSemesterExpand,
	handleToggleTalangan,
	openInstallmentModal,
	openScheduleModal,
	openPaymentModal,
	handleDeleteInstallment,
	handleToggleStatus,
	isInterviewLunas,
	isKeberangkatanLunas,
	intPct,
	kebPct,
	destinationCountry,
	onUpdate,
}: PembayaranUtamaSectionProps) {
	const isMetodeTalangan = formData?.metodePembayaran === "dana_talangan";
	const destCountry = formData?.destinationCountry || destinationCountry;
	const isMalaysia = (destCountry || "").toLowerCase().includes("malaysia");
	const penempatanLabel = isMalaysia
		? "Penempatan Magang D3 Malaysia / Keberangkatan"
		: "Penempatan Magang Taiwan / Keberangkatan";

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

	const renderSemesterCards = () => {
		const sem1 = semesters.find((s) => s.semesterNumber === 1);
		const sem1TotalBilled = sem1?.totalBilled || 0;
		const sem1Installments = sem1?.installments || [];

		// Total nominal yang telah dijadwalkan
		const sem1TotalScheduled = sem1Installments.reduce(
			(s: number, i: any) =>
				s +
				(Number(
					i.nominalScheduled !== undefined && i.nominalScheduled !== null
						? i.nominalScheduled
						: i.nominalPaid,
				) || 0),
			0,
		);

		// Total nominal yang telah terealisasi / terbayar
		const sem1TotalPaid = sem1Installments.reduce(
			(s: number, i: any) =>
				s +
				(i.status === "LUNAS" ||
				(i.nominalPaid > 0 && i.status !== "BELUM_BAYAR")
					? Number(i.nominalPaid) || 0
					: 0),
			0,
		);

		const sem1RemainingUnscheduled = Math.max(
			0,
			sem1TotalBilled - sem1TotalScheduled,
		);
		const sem1RemainingReal = Math.max(0, sem1TotalBilled - sem1TotalPaid);

		const sem1SchedPct =
			sem1TotalBilled > 0
				? Math.min(
						100,
						Math.round((sem1TotalScheduled / sem1TotalBilled) * 100),
					)
				: 0;
		const sem1PaidPct =
			sem1TotalBilled > 0
				? Math.min(100, Math.round((sem1TotalPaid / sem1TotalBilled) * 100))
				: 0;

		const sem1Status =
			sem1?.isTalangan && isMetodeTalangan
				? {
						label: "Dana Talangan",
						cls: "bg-violet-100 text-violet-700 border-violet-200",
					}
				: sem1TotalPaid >= sem1TotalBilled && sem1TotalBilled > 0
					? {
							label: "Lunas",
							cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
						}
					: sem1TotalPaid > 0
						? {
								label: "Sebagian",
								cls: "bg-amber-100 text-amber-800 border-amber-200",
							}
						: {
								label: "Belum Bayar",
								cls: "bg-slate-100 text-slate-600 border-slate-200",
							};

		return (
			<div className="space-y-4 bg-white p-5 border border-slate-200/90 rounded-2xl shadow-2xs">
				{/* Header Termin 2 */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100 font-bold text-sm">
							2
						</div>
						<div>
							<h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
								Pembayaran SPP Semester 1 (Cicilan Bulanan Mandiri)
							</h5>
							<p className="text-xs text-slate-500">
								{isMetodeTalangan
									? "Skema Dana Talangan: Biaya SPP dicover lembaga pembiayaan mitra."
									: "Penjadwalan rencana cicilan per bulan & pencatatan konfirmasi realisasi pembayaran."}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Badge
							className={`text-xs px-2.5 py-0.5 font-bold ${sem1Status.cls}`}
						>
							{sem1Status.label}
						</Badge>
					</div>
				</div>

				{loadingSemesters ? (
					<div className="flex items-center justify-center py-6 text-slate-400">
						<Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
						Memuat data semester & jadwal cicilan...
					</div>
				) : (
					<div className="space-y-4">
						{/* 4 Cards Metrics Penjadwalan & Realisasi */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl">
							{/* 1. Pagu Total Tagihan */}
							<div className="p-3 bg-white border border-slate-200/70 rounded-lg shadow-2xs space-y-1">
								<div className="flex items-center justify-between text-slate-400">
									<span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
										Pagu SPP Smt 1
									</span>
									<GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
								</div>
								<div className="text-sm sm:text-base font-bold font-mono text-slate-900 truncate">
									{formatRupiah(sem1TotalBilled)}
								</div>
								<div className="text-[10px] text-slate-400">
									Alokasi partisi 2
								</div>
							</div>

							{/* 2. Total Terjadwal */}
							<div className="p-3 bg-white border border-blue-100 rounded-lg shadow-2xs space-y-1">
								<div className="flex items-center justify-between text-blue-600">
									<span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
										Total Terjadwal
									</span>
									<Calendar className="w-3.5 h-3.5" />
								</div>
								<div className="text-sm sm:text-base font-bold font-mono text-blue-800 truncate">
									{formatRupiah(sem1TotalScheduled)}
								</div>
								<div className="text-[10px] text-blue-600 font-medium truncate">
									{sem1SchedPct}% terjadwal • Sisa:{" "}
									{formatRupiah(sem1RemainingUnscheduled)}
								</div>
							</div>

							{/* 3. Total Terbayar (Realisasi) */}
							<div className="p-3 bg-white border border-emerald-100 rounded-lg shadow-2xs space-y-1">
								<div className="flex items-center justify-between text-emerald-600">
									<span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
										Total Terbayar
									</span>
									<CheckCircle className="w-3.5 h-3.5" />
								</div>
								<div className="text-sm sm:text-base font-bold font-mono text-emerald-800 truncate">
									{formatRupiah(sem1TotalPaid)}
								</div>
								<div className="text-[10px] text-emerald-600 font-medium truncate">
									{sem1PaidPct}% terealisasi
								</div>
							</div>

							{/* 4. Sisa Tagihan Riil */}
							<div
								className={`p-3 bg-white border rounded-lg shadow-2xs space-y-1 ${
									sem1RemainingReal > 0
										? "border-amber-200 bg-amber-50/30"
										: "border-emerald-200 bg-emerald-50/30"
								}`}
							>
								<div className="flex items-center justify-between">
									<span
										className={`text-[11px] font-semibold uppercase tracking-wider ${
											sem1RemainingReal > 0
												? "text-amber-800"
												: "text-emerald-800"
										}`}
									>
										Sisa Tagihan Riil
									</span>
									<AlertCircle
										className={`w-3.5 h-3.5 ${
											sem1RemainingReal > 0
												? "text-amber-600"
												: "text-emerald-600"
										}`}
									/>
								</div>
								<div
									className={`text-sm sm:text-base font-bold font-mono truncate ${
										sem1RemainingReal > 0
											? "text-amber-900"
											: "text-emerald-900"
									}`}
								>
									{formatRupiah(sem1RemainingReal)}
								</div>
								<div
									className={`text-[10px] font-medium truncate ${
										sem1RemainingReal > 0
											? "text-amber-700"
											: "text-emerald-700"
									}`}
								>
									{sem1RemainingReal > 0 ? "Perlu pelunasan" : "Tagihan lunas"}
								</div>
							</div>
						</div>

						{/* Progress Bar Realisasi */}
						<div className="space-y-1">
							<div className="flex justify-between text-[11px] font-medium text-slate-500">
								<span>Progres Realisasi Pembayaran SPP Smt 1</span>
								<span className="font-mono font-bold text-slate-700">
									{sem1PaidPct}% ({formatRupiah(sem1TotalPaid)} /{" "}
									{formatRupiah(sem1TotalBilled)})
								</span>
							</div>
							<div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
								<div
									style={{ width: `${sem1PaidPct}%` }}
									className={`h-full transition-all duration-500 rounded-full ${
										sem1PaidPct >= 100
											? "bg-emerald-500"
											: sem1PaidPct > 0
												? "bg-indigo-600"
												: "bg-slate-300"
									}`}
								/>
							</div>
						</div>

						{/* Notice Dana Talangan jika metode talangan */}
						{isMetodeTalangan && (
							<div className="p-3 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-between text-xs text-violet-800">
								<div className="flex items-center gap-2">
									<Banknote className="w-4 h-4 text-violet-600 shrink-0" />
									<span>
										Mahasiswa ini berstatus <strong>Dana Talangan</strong>.
										Pembayaran SPP perkuliahan semester ditalangi mitra lembaga
										keuangan.
									</span>
								</div>
								{canEdit && isEditingUtama && sem1 && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => handleToggleTalangan(sem1)}
										className="h-7 text-xs bg-white text-violet-700 border-violet-200 hover:bg-violet-50"
									>
										{sem1.isTalangan
											? "Alihkan ke Mandiri"
											: "Ubah ke Talangan"}
									</Button>
								)}
							</div>
						)}

						{/* Riwayat & Jadwal Cicilan Bulanan */}
						<div className="space-y-2.5">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<h6 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
									<Calendar className="w-3.5 h-3.5 text-indigo-600" />
									Jadwal Rencana & Konfirmasi Pembayaran Cicilan
								</h6>
								<span className="text-xs text-slate-400">
									{sem1Installments.length} Jadwal Cicilan (
									{
										sem1Installments.filter(
											(i: any) =>
												i.status === "LUNAS" ||
												(i.nominalPaid > 0 && i.status !== "BELUM_BAYAR"),
										).length
									}{" "}
									Lunas)
								</span>
							</div>

							{sem1Installments.length === 0 ? (
								<div className="text-xs text-slate-500 italic bg-slate-50 border border-dashed border-slate-200 rounded-xl py-6 px-4 text-center space-y-1">
									<p>
										Belum ada jadwal cicilan bulanan yang dibuat untuk Semester
										1.
									</p>
									{canEdit && (
										<p className="text-slate-400 not-italic text-[11px]">
											Klik tombol "+ Tambah Jadwal Cicilan" di bawah untuk
											menentukan jadwal pembayaran berikutnya (bulan apa,
											tanggal jatuh tempo, dan nominalnya).
										</p>
									)}
								</div>
							) : (
								<div className="space-y-2.5">
									{sem1Installments.map((inst: any, idx: number) => {
										const isPaid =
											inst.status === "LUNAS" ||
											(inst.nominalPaid > 0 && inst.status !== "BELUM_BAYAR");
										const schedNominal =
											inst.nominalScheduled !== undefined &&
											inst.nominalScheduled !== null
												? inst.nominalScheduled
												: inst.nominalPaid || 0;

										return (
											<div
												key={inst.id}
												className={`flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl p-3.5 gap-3 transition-all ${
													isPaid
														? "bg-emerald-50/20 border-emerald-200/90 shadow-2xs"
														: "bg-white border-slate-200/90 shadow-2xs hover:border-indigo-200"
												}`}
											>
												<div className="flex items-start gap-3 min-w-0">
													<div
														className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${
															isPaid
																? "bg-emerald-100 text-emerald-800 border-emerald-200"
																: "bg-indigo-50 text-indigo-700 border-indigo-100"
														}`}
													>
														{inst.installmentNumber || idx + 1}
													</div>

													<div className="space-y-1.5 min-w-0">
														{/* Header: Periode, Jatuh Tempo, Status */}
														<div className="flex items-center gap-2 flex-wrap">
															{inst.installmentMonth ? (
																<Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[11px] py-0.5 font-bold">
																	{inst.installmentMonth}
																</Badge>
															) : (
																<Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[11px]">
																	Cicilan {idx + 1}
																</Badge>
															)}

															{isPaid ? (
																<Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] py-0.5 font-bold gap-1">
																	<CheckCircle className="w-3 h-3 text-emerald-600" />{" "}
																	Lunas / Terbayar
																</Badge>
															) : (
																<Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] py-0.5 font-bold gap-1">
																	<Clock className="w-3 h-3 text-amber-600" />{" "}
																	Menunggu Pembayaran
																</Badge>
															)}

															{inst.isTalangan && (
																<Badge className="bg-violet-100 text-violet-700 border-0 text-[10px] py-0.5">
																	Talangan
																</Badge>
															)}
														</div>

														{/* Info Tagihan Terjadwal & Realisasi */}
														<div className="flex items-center gap-3 text-xs flex-wrap">
															<span className="text-slate-600">
																Tagihan Jadwal:{" "}
																<strong className="font-mono text-slate-900 font-bold">
																	{formatRupiah(schedNominal)}
																</strong>
															</span>

															{inst.dueDate && (
																<span className="flex items-center gap-1 text-slate-500">
																	<Calendar className="w-3 h-3 text-indigo-500" />
																	Jatuh Tempo:{" "}
																	<span className="font-medium">
																		{new Date(inst.dueDate).toLocaleDateString(
																			"id-ID",
																			{
																				day: "numeric",
																				month: "short",
																				year: "numeric",
																			},
																		)}
																	</span>
																</span>
															)}
														</div>

														{/* Status Realisasi Pembayaran jika sudah bayar */}
														{isPaid && (
															<div className="p-2 bg-emerald-50/80 border border-emerald-200/70 rounded-lg text-xs space-y-1">
																<div className="flex items-center gap-2 flex-wrap text-emerald-900">
																	<span>
																		Realisasi Bayar:{" "}
																		<strong className="font-mono font-bold text-emerald-800">
																			{formatRupiah(inst.nominalPaid)}
																		</strong>
																	</span>
																	{inst.paymentDate && (
																		<span>
																			pada{" "}
																			{new Date(
																				inst.paymentDate,
																			).toLocaleDateString("id-ID", {
																				day: "numeric",
																				month: "long",
																				year: "numeric",
																			})}
																		</span>
																	)}
																</div>

																{inst.file ? (
																	<div className="flex items-center gap-2 flex-wrap pt-0.5">
																		<span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 truncate max-w-[240px]">
																			<Paperclip className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
																			<span className="truncate">
																				Berkas baru: {inst.file.name}
																			</span>
																		</span>
																		<Button
																			type="button"
																			variant="outline"
																			size="sm"
																			onClick={(e) => {
																				e.stopPropagation();
																				setPreviewModal({
																					open: true,
																					file: inst.file,
																					fileUrl: null,
																					title: `Bukti Bayar (${inst.installmentMonth || "Cicilan"})`,
																				});
																			}}
																			className="h-6 px-2 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border-indigo-200 rounded-md gap-1 cursor-pointer shadow-2xs"
																		>
																			<Eye className="w-3 h-3" /> Preview Berkas
																		</Button>
																	</div>
																) : inst.buktiBayarUrl ? (
																	<div className="flex items-center gap-2 flex-wrap pt-0.5">
																		<Button
																			type="button"
																			variant="outline"
																			size="sm"
																			onClick={(e) => {
																				e.stopPropagation();
																				openDocumentReview(
																					studentId,
																					inst.buktiBayarUrl,
																					`Bukti Bayar - ${inst.installmentMonth || `Cicilan ke-${idx + 1}`}.pdf`,
																					inst.id,
																				);
																			}}
																			className="h-6 px-2.5 text-[10px] font-semibold text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/10 bg-white rounded-md gap-1.5 cursor-pointer shadow-2xs"
																			title="Review Dokumen Bukti Bayar"
																		>
																			<Eye className="w-3.5 h-3.5 text-[#0517B0]" />
																			<span>Review Bukti</span>
																		</Button>
																	</div>
																) : null}
															</div>
														)}

														{inst.notes && (
															<p className="text-[11px] text-slate-500 italic">
																Catatan: {inst.notes}
															</p>
														)}
													</div>
												</div>

												{/* Action Buttons */}
												{canEdit && (
													<div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
														{!isPaid ? (
															<Button
																type="button"
																size="sm"
																onClick={() =>
																	openPaymentModal
																		? openPaymentModal(sem1, inst)
																		: openInstallmentModal(sem1, inst)
																}
																className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-lg shadow-2xs gap-1.5 cursor-pointer"
																title="Catat dan konfirmasi pembayaran cicilan ini"
															>
																<CheckCircle className="w-3.5 h-3.5" />{" "}
																Konfirmasi Bayar
															</Button>
														) : (
															<Button
																type="button"
																variant="outline"
																size="sm"
																onClick={() =>
																	openPaymentModal
																		? openPaymentModal(sem1, inst)
																		: openInstallmentModal(sem1, inst)
																}
																className="text-xs h-8 px-2.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer"
																title="Lihat atau edit detail bukti bayar"
															>
																<FileText className="w-3.5 h-3.5 text-indigo-600" />{" "}
																Detail Bayar
															</Button>
														)}

														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg cursor-pointer"
															onClick={() =>
																openScheduleModal
																	? openScheduleModal(sem1, inst)
																	: openInstallmentModal(sem1, inst)
															}
															title="Edit rencana jadwal cicilan"
														>
															<Edit className="w-3.5 h-3.5" />
														</Button>

														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg cursor-pointer"
															onClick={() =>
																handleDeleteInstallment(sem1.id, inst.id)
															}
															title="Hapus jadwal cicilan"
														>
															<Trash2 className="w-3.5 h-3.5" />
														</Button>
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}

							{/* Add Schedule Button */}
							{canEdit && sem1 && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="mt-2 w-full border-dashed border-indigo-200 bg-indigo-50/40 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 font-bold text-xs h-9 rounded-xl cursor-pointer shadow-2xs gap-1.5"
									onClick={() =>
										openScheduleModal
											? openScheduleModal(sem1)
											: openInstallmentModal(sem1)
									}
								>
									<Plus className="w-4 h-4" />+ Tambah Jadwal Cicilan Bulanan
									(SPP Smt 1)
								</Button>
							)}
						</div>
					</div>
				)}
			</div>
		);
	};

	return (
		<Card className="border border-slate-200/90 shadow-2xs overflow-hidden rounded-xl bg-white">
			<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5 sm:px-6 flex flex-row items-center justify-between">
				<div className="flex items-center gap-2.5">
					<div className="p-2 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-100/70 shadow-2xs">
						<Wallet className="w-4 h-4" />
					</div>
					<div>
						<CardTitle className="text-base font-bold text-slate-900 tracking-tight">
							Pembayaran Utama
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Pencatatan pos pembayaran perkuliahan dan program lanjutan
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{canEdit && !isEditingUtama && (
						<Button
							size="sm"
							onClick={() => setIsEditingUtama(true)}
							className="bg-[#0517B0] hover:bg-blue-800 text-white font-semibold text-xs h-8.5 rounded-lg shadow-2xs gap-1.5"
						>
							<Edit className="w-3.5 h-3.5" /> Edit Data
						</Button>
					)}
					{isEditingUtama && (
						<>
							<Button
								size="sm"
								variant="outline"
								onClick={() => handleCancelEdit("utama")}
								disabled={loadingUtama}
								className="h-8.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
							>
								<X className="w-3.5 h-3.5 mr-1" /> Batal
							</Button>
							<Button
								size="sm"
								onClick={() => triggerSave("utama")}
								disabled={loadingUtama}
								className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8.5 rounded-lg shadow-2xs"
							>
								{loadingUtama ? (
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5 mr-1.5" />
								)}
								Simpan
							</Button>
						</>
					)}
				</div>
			</CardHeader>
			<CardContent className="p-5 sm:p-6 space-y-6 bg-white">
				{/* Banner Notice when Total Biaya is 0 / not determined yet by PMB */}
				{(formData?.totalBiayaPendidikan || 0) === 0 && (
					<div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-xs text-amber-950 shadow-2xs">
						<AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
						<div className="space-y-0.5">
							<span className="font-bold text-amber-950">
								Menunggu Penetapan Biaya PMB (Nilai Saat Ini: Rp 0)
							</span>
							<p className="text-amber-800 leading-relaxed">
								Mahasiswa ini belum memiliki penentuan Total Biaya Pendidikan
								dan DP dari PMB. Seluruh pos tagihan termin saat ini bernilai{" "}
								<strong>Rp 0</strong>. Setelah PMB mengisi data di{" "}
								<strong>Panel PMB &gt; Tab Skema Keuangan</strong>, nominal akan
								otomatis tersinkronisasi dan rincian pembagian termin dapat
								diproses.
							</p>
						</div>
					</div>
				)}

				{/* Metode Pembayaran Lanjutan */}
				<div className="space-y-4">
					<div>
						<h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
							<CreditCard className="w-4 h-4 text-indigo-600" />
							Metode Pembayaran Lanjutan
						</h4>
						<p className="text-sm text-slate-500">
							Pilih skema pelunasan biaya pendidikan setelah registrasi awal &
							perkuliahan semester berjalan.
						</p>
					</div>

					{isEditingUtama ? (
						<div className="space-y-3">
							<Select
								value={formData?.metodePembayaran || ""}
								onValueChange={(val) =>
									handleFieldChange("metodePembayaran", val)
								}
							>
								<SelectTrigger className="w-full sm:w-[540px] h-auto min-h-11 py-2.5 px-3.5 bg-white border-slate-300 hover:border-slate-400 focus:border-indigo-500 rounded-xl shadow-2xs transition-all">
									<SelectValue placeholder="Pilih skema metode pembayaran lanjutan...">
										{formData?.metodePembayaran === "mandiri" ? (
											<div className="flex items-center gap-2 text-left">
												<span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
												<span className="font-semibold text-slate-900 text-sm">
													Dana Mandiri
												</span>
												<span className="text-xs text-slate-500 font-normal">
													(Tunai / Bertahap Mahasiswa)
												</span>
											</div>
										) : formData?.metodePembayaran === "dana_talangan" ? (
											<div className="flex items-center gap-2 text-left">
												<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
												<span className="font-semibold text-slate-900 text-sm">
													Dana Talangan 2 Tahap
												</span>
												<span className="text-xs text-slate-500 font-normal">
													(Fasilitas Lembaga Mitra)
												</span>
											</div>
										) : undefined}
									</SelectValue>
								</SelectTrigger>
								<SelectContent className="w-full sm:w-[540px] p-2 rounded-xl border-slate-200 shadow-xl bg-white">
									<SelectItem
										value="mandiri"
										className="py-3 px-3.5 rounded-xl cursor-pointer transition-colors focus:bg-blue-50/80 items-start gap-2.5 data-[state=checked]:bg-blue-50/50"
									>
										<div className="flex flex-col gap-1 text-left w-full min-w-0 pr-4">
											<div className="flex items-center justify-between gap-2">
												<div className="flex items-center gap-2">
													<span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
													<span className="font-bold text-slate-900 text-sm">
														Dana Mandiri
													</span>
												</div>
												<span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200/80">
													Reguler / Tunai
												</span>
											</div>
											<p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-normal">
												Pembayaran langsung oleh mahasiswa/wali per termin: SPP
												Semester 1, Kontrak Magang / Suhan, dan Penempatan
												Taiwan.
											</p>
										</div>
									</SelectItem>

									<SelectItem
										value="dana_talangan"
										className="py-3 px-3.5 rounded-xl cursor-pointer transition-colors focus:bg-emerald-50/80 items-start gap-2.5 data-[state=checked]:bg-emerald-50/50 mt-1.5"
									>
										<div className="flex flex-col gap-1 text-left w-full min-w-0 pr-4">
											<div className="flex items-center justify-between gap-2">
												<div className="flex items-center gap-2">
													<span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
													<span className="font-bold text-slate-900 text-sm">
														Dana Talangan 2 Tahap
													</span>
												</div>
												<span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200/80">
													Mitra Finansial
												</span>
											</div>
											<p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-normal">
												Pembiayaan ditalangi lembaga mitra dalam 2 tahap: Tahap
												1 (Perkuliahan Semester) dan Tahap 2 (Kontrak, Suhan &
												Tiket). Pelunasan dicicil saat magang.
											</p>
										</div>
									</SelectItem>
								</SelectContent>
							</Select>

							{/* Keterangan detail skema aktif saat editing */}
							{formData?.metodePembayaran === "mandiri" && (
								<div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5 text-xs text-blue-950 sm:w-[540px]">
									<Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
									<p className="leading-relaxed">
										<strong>Skema Terpilih: Dana Mandiri</strong> — Biaya
										Registrasi Awal, SPP Semester 1 (cicilan bulanan), Termin 3
										(Kontrak Magang / Suhan), dan Termin 4 (Penempatan Magang
										Taiwan) dibayarkan langsung secara mandiri oleh
										mahasiswa/wali ke institusi.
									</p>
								</div>
							)}
							{formData?.metodePembayaran === "dana_talangan" && (
								<div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950 sm:w-[540px]">
									<Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
									<p className="leading-relaxed">
										<strong>Skema Terpilih: Dana Talangan 2 Tahap</strong> —
										Biaya ditalangi oleh lembaga pembiayaan mitra. Bagian
										keuangan dapat mengelola administrasi talangan,
										memverifikasi pencairan Tahap 1 & 2, serta memonitor cicilan
										pelunasan saat mahasiswa bekerja di Taiwan.
									</p>
								</div>
							)}
						</div>
					) : (
						<div className="space-y-3">
							<div className="inline-flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
								<div className="flex items-center gap-2">
									<span
										className={`w-2.5 h-2.5 rounded-full ${
											formData?.metodePembayaran === "mandiri"
												? "bg-blue-500"
												: formData?.metodePembayaran === "dana_talangan"
													? "bg-emerald-500"
													: "bg-slate-300"
										}`}
									/>
									<span className="font-semibold text-sm text-slate-800">
										{formData?.metodePembayaran === "mandiri"
											? "Dana Mandiri (Tunai / Bertahap)"
											: formData?.metodePembayaran === "dana_talangan"
												? "Dana Talangan 2 Tahap (Lembaga Mitra)"
												: "Metode Belum Dipilih"}
									</span>
								</div>
								<Badge
									className={`text-xs px-2.5 py-0.5 font-bold ${
										formData?.metodePembayaran === "mandiri"
											? "bg-blue-100 text-blue-800 border-blue-200"
											: formData?.metodePembayaran === "dana_talangan"
												? "bg-emerald-100 text-emerald-800 border-emerald-200"
												: "bg-slate-100 text-slate-600 border-slate-200"
									}`}
								>
									{formData?.metodePembayaran === "mandiri"
										? "Reguler Mandiri"
										: formData?.metodePembayaran === "dana_talangan"
											? "Mitra Finansial"
											: "Perlu Ditentukan"}
								</Badge>
							</div>

							{!formData?.metodePembayaran && (
								<div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900 max-w-xl">
									<AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
									<p>
										Metode pembayaran lanjutan belum ditentukan. Klik tombol{" "}
										<strong>Edit Data</strong> di kanan atas untuk memilih
										antara skema <strong>Dana Mandiri</strong> atau{" "}
										<strong>Dana Talangan 2 Tahap</strong> agar rincian 4 termin
										tagihan ditampilkan.
									</p>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Kondisional Metode: 4 Termin Baku Dana Mandiri */}
				{formData?.metodePembayaran === "mandiri" && (
					<div className="space-y-6 pt-2">
						{/* Header Banner 4 Termin Mandiri */}
						<div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-indigo-50/30 to-slate-50 border border-blue-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
							<div className="flex items-center gap-3">
								<div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
									<CreditCard className="w-5 h-5" />
								</div>
								<div>
									<h4 className="font-extrabold text-blue-950 text-base sm:text-lg">
										4 Termin Pembayaran Skema Dana Mandiri
									</h4>
									<p className="text-xs text-blue-800/80 mt-0.5">
										Sesuai standar FIN-02: Pembayaran reguler mandiri mahasiswa
										dipisahkan secara terstruktur ke dalam 4 termin baku
									</p>
								</div>
							</div>
							<Badge className="bg-blue-600 text-white font-bold text-xs px-3 py-1 shadow-2xs self-start sm:self-auto">
								Skema Mandiri Aktif
							</Badge>
						</div>

						{/* 1. Termin 1: Registrasi Awal */}
						<div
							className={`p-5 rounded-2xl border transition-all space-y-4 shadow-2xs ${
								formData?.registrasiStatus || isRegistrasiLunas
									? "border-emerald-200/90 bg-emerald-50/15"
									: "border-slate-200/90 bg-white"
							}`}
						>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5 border-slate-100">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-registrasiStatus"
										checked={Boolean(
											formData?.registrasiStatus || isRegistrasiLunas,
										)}
										disabled={!canEdit}
										onCheckedChange={(checked) => {
											if (isEditingUtama) {
												handleFieldChange("registrasiStatus", Boolean(checked));
												if (checked && !formData?.registrasiPaidDate) {
													handleFieldChange(
														"registrasiPaidDate",
														new Date().toISOString().split("T")[0],
													);
												}
											} else if (handleToggleStatus) {
												handleToggleStatus(
													"registrasiStatus",
													Boolean(checked),
												);
											}
										}}
										className="mt-1 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-registrasiStatus"
											className="text-sm sm:text-base font-bold text-slate-900 cursor-pointer flex items-center gap-2 hover:text-[#0517B0] transition-colors"
										>
											<span>Termin 1: Registrasi Awal</span>
											<Badge
												variant="outline"
												className="text-[10px] font-bold bg-sky-50 border-sky-200 text-sky-700"
											>
												Partisi 1 ({regPct}% Total)
											</Badge>
										</label>
										<p className="text-xs text-slate-500 mt-0.5">
											Biaya masuk & uang muka (DP) pendaftaran awal mahasiswa
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3 shrink-0">
									<div className="text-right">
										<span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
											Tagihan Termin 1:
										</span>
										<span className="text-base font-bold text-slate-900 font-mono">
											{formatRupiah(formData?.registrasiNominal || 0)}
										</span>
									</div>
									<div>
										{formData?.registrasiStatus || isRegistrasiLunas ? (
											<Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold gap-1 px-2.5 py-0.5">
												<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />{" "}
												Lunas
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-500 border-slate-300 text-xs px-2.5 py-0.5"
											>
												Belum Lunas
											</Badge>
										)}
									</div>
								</div>
							</div>

							<div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-6">
								<div className="flex-1 space-y-3.5">
									<div>
										<label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">
											Nominal Tagihan Registrasi
										</label>
										<div className="text-lg font-bold text-slate-900 font-mono">
											{formatRupiah(formData?.registrasiNominal || 0)}
										</div>
										<p className="text-xs text-slate-400 mt-1">
											Disesuaikan otomatis melalui Partisi Biaya Pendidikan
										</p>
									</div>

									{/* Status & Tanggal Pembayaran */}
									{isEditingUtama ? (
										<div className="space-y-3 pt-2.5 border-t border-slate-200/80">
											<div className="flex items-center space-x-2">
												<Checkbox
													id="registrasiStatusCheckbox"
													checked={Boolean(
														formData?.registrasiStatus || isRegistrasiLunas,
													)}
													onCheckedChange={(checked) => {
														handleFieldChange(
															"registrasiStatus",
															Boolean(checked),
														);
														if (checked && !formData?.registrasiPaidDate) {
															handleFieldChange(
																"registrasiPaidDate",
																new Date().toISOString().split("T")[0],
															);
														}
													}}
												/>
												<label
													htmlFor="registrasiStatusCheckbox"
													className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
												>
													Tandai Lunas Pembayaran Registrasi
												</label>
											</div>

											{(formData?.registrasiStatus || isRegistrasiLunas) && (
												<div>
													<label className="text-[11px] font-medium text-slate-500 mb-1 block">
														Tanggal Pembayaran Registrasi
													</label>
													<input
														type="date"
														value={
															formData?.registrasiPaidDate
																? String(formData.registrasiPaidDate).split(
																		"T",
																	)[0]
																: new Date().toISOString().split("T")[0]
														}
														onChange={(e) =>
															handleFieldChange(
																"registrasiPaidDate",
																e.target.value,
															)
														}
														className="w-full text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white"
													/>
												</div>
											)}
										</div>
									) : (
										formData?.registrasiPaidDate && (
											<div className="pt-2 border-t border-slate-200/60 text-xs text-slate-500">
												<span className="font-medium text-slate-700">
													Tanggal Bayar:{" "}
												</span>
												{new Date(
													formData.registrasiPaidDate,
												).toLocaleDateString("id-ID", {
													day: "numeric",
													month: "long",
													year: "numeric",
												})}
											</div>
										)
									)}
								</div>
								<div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
									<label className="text-xs font-semibold text-slate-500 mb-2 block uppercase tracking-wider">
										Bukti Pembayaran Registrasi (PDF)
									</label>
									<DocumentUpload
										studentId={studentId}
										panel="finance"
										documentKey="registrasi"
										canEdit={canEdit}
										onUploadSuccess={onUpdate}
										onDeleteSuccess={onUpdate}
										onUpdate={onUpdate}
									/>
								</div>
							</div>
						</div>

						{/* 2. Termin 2: Pembayaran SPP Semester 1 (Cicilan Bulanan Mandiri) */}
						<div
							className={`p-5 rounded-2xl border transition-all space-y-4 shadow-2xs ${
								isSemesterAllLunas
									? "border-emerald-200/90 bg-emerald-50/15"
									: "border-slate-200/90 bg-white"
							}`}
						>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5 border-slate-100">
								<div>
									<h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
										<span>
											Termin 2: Pembayaran SPP Semester 1 (Cicilan Bulanan)
										</span>
										<Badge
											variant="outline"
											className="text-[10px] font-bold bg-indigo-50 border-indigo-200 text-indigo-700"
										>
											Partisi 2 ({semPct}% Total)
										</Badge>
									</h4>
									<p className="text-xs text-slate-500 mt-0.5">
										Biaya perkuliahan Semester 1 (dicicil secara bulanan dan
										fleksibel oleh mahasiswa)
									</p>
								</div>
								<div className="flex items-center gap-3 shrink-0">
									<div className="text-right">
										<span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
											Pagu SPP Smt 1:
										</span>
										<span className="text-base font-bold text-slate-900 font-mono">
											{formatRupiah(curSemestersTotal)}
										</span>
									</div>
									<div>
										{isSemesterAllLunas ? (
											<Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold gap-1 px-2.5 py-0.5">
												<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />{" "}
												Lunas
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-500 border-slate-300 text-xs px-2.5 py-0.5"
											>
												Belum Lunas
											</Badge>
										)}
									</div>
								</div>
							</div>

							<div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">
										Total Tagihan SPP Semester 1
									</label>
									<div className="text-lg font-bold text-slate-900 font-mono">
										{formatRupiah(curSemestersTotal)}
									</div>
									<div className="text-xs text-slate-400 mt-1">
										Pagu Alokasi Biaya SPP Semester 1
									</div>
								</div>
								<div className="border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
									<label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">
										Total Terbayar Perkuliahan
									</label>
									<div className="text-lg font-bold text-emerald-700 font-mono">
										{formatRupiah(
											semesters.reduce(
												(sum: number, s: any) =>
													sum +
													(s.installments || []).reduce(
														(iSum: number, inst: any) =>
															iSum + (inst.nominalPaid || 0),
														0,
													),
												0,
											),
										)}
									</div>
									<div className="text-xs text-slate-400 mt-1">
										{isSemesterAllLunas ? "Lunas" : "Dalam Proses Cicilan"}
									</div>
								</div>
							</div>

							{/* Riwayat & Input Cicilan Bulanan */}
							<div className="space-y-4 pt-1">{renderSemesterCards()}</div>
						</div>

						<div className="grid gap-5">
							{/* 3. Termin 3: Kontrak Magang / Suhan */}
							<div
								className={`p-5 rounded-2xl border transition-all space-y-4 shadow-2xs ${
									isInterviewLunas ||
									(formData?.kontrakMagangStatus && formData?.suhanStatus) ||
									formData?.mandiriInterviewStatus
										? "border-emerald-200/90 bg-emerald-50/15"
										: "border-slate-200/90 bg-white"
								}`}
							>
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5 border-slate-100">
									<div className="flex items-start gap-3">
										<Checkbox
											id="chk-mandiriInterview"
											checked={Boolean(
												isInterviewLunas ||
													(formData?.kontrakMagangStatus &&
														formData?.suhanStatus) ||
													formData?.mandiriInterviewStatus,
											)}
											disabled={!canEdit}
											onCheckedChange={(checked) => {
												if (isEditingUtama) {
													handleFieldChange(
														"kontrakMagangStatus",
														Boolean(checked),
													);
													handleFieldChange("suhanStatus", Boolean(checked));
													handleFieldChange(
														"mandiriInterviewStatus",
														Boolean(checked),
													);
													if (checked && !formData?.mandiriInterviewPaidDate) {
														handleFieldChange(
															"mandiriInterviewPaidDate",
															new Date().toISOString().split("T")[0],
														);
													}
												} else if (handleToggleStatus) {
													handleToggleStatus(
														"kontrakMagangStatus",
														Boolean(checked),
													);
													handleToggleStatus("suhanStatus", Boolean(checked));
													handleToggleStatus(
														"mandiriInterviewStatus",
														Boolean(checked),
													);
												}
											}}
											className="mt-1 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
										/>
										<div>
											<label
												htmlFor="chk-mandiriInterview"
												className="text-sm sm:text-base font-bold text-slate-900 cursor-pointer flex items-center gap-2 hover:text-[#0517B0] transition-colors"
											>
												<span>Termin 3: Kontrak Magang / Suhan</span>
												<Badge
													variant="outline"
													className="text-[10px] font-bold bg-amber-50 border-amber-200 text-amber-700"
												>
													Partisi 3 ({intPct}% Total)
												</Badge>
											</label>
											<p className="text-xs text-slate-500 mt-0.5">
												Biaya proses turun kontrak kerja & surat izin Suhan
												Taiwan
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3 shrink-0">
										<div className="text-right">
											<span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
												Tagihan Termin 3:
											</span>
											<span className="text-base font-bold text-slate-900 font-mono">
												{formatRupiah(formData?.mandiriInterviewNominal || 0)}
											</span>
										</div>
										<div>
											{isInterviewLunas ||
											(formData?.kontrakMagangStatus &&
												formData?.suhanStatus) ||
											formData?.mandiriInterviewStatus ? (
												<Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold gap-1 px-2.5 py-0.5">
													<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />{" "}
													Lunas
												</Badge>
											) : formData?.kontrakMagangStatus ? (
												<Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-bold px-2.5 py-0.5">
													Kontrak Siap
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-slate-500 border-slate-300 text-xs px-2.5 py-0.5"
												>
													Belum Lunas
												</Badge>
											)}
										</div>
									</div>
								</div>

								{/* Banner Alur Dokumen Segmen 11 & 20 */}
								<div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2 text-xs text-amber-900">
									<span className="font-bold shrink-0">Alur Resmi:</span>
									<span>
										Dokumen Kontrak Magang kerja industri diterbitkan lebih
										dahulu, disusul oleh Surat Suhan (persetujuan izin magang
										resmi Taiwan).
									</span>
								</div>

								{/* Slot Pemisahan Dokumen Kontrak Magang vs Suhan */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
									{/* Slot A: Dokumen Kontrak Magang */}
									<div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2.5">
										<div className="flex items-center justify-between">
											<span className="text-xs font-bold text-slate-800">
												Slot A: Dokumen Kontrak Magang
											</span>
											{formData?.kontrakMagangStatus ||
											formData?.mandiriInterviewStatus ? (
												<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
													<CheckCircle className="w-3 h-3 mr-1" /> Terverifikasi
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-slate-400 border-slate-200 text-[10px]"
												>
													Belum Terbit
												</Badge>
											)}
										</div>
										<p className="text-[11px] text-slate-500">
											Kontrak kerja resmi dari pihak industri Taiwan untuk
											mahasiswa.
										</p>
										{isEditingUtama && (
											<div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
												<Checkbox
													id="kontrakMagangCheckbox"
													checked={Boolean(formData?.kontrakMagangStatus)}
													onCheckedChange={(checked) =>
														handleFieldChange(
															"kontrakMagangStatus",
															Boolean(checked),
														)
													}
												/>
												<label
													htmlFor="kontrakMagangCheckbox"
													className="text-xs text-slate-700 font-medium cursor-pointer"
												>
													Tandai Kontrak Magang Terbit
												</label>
											</div>
										)}
										<div className="pt-1">
											<DocumentUpload
												studentId={studentId}
												panel="finance"
												documentKey="mandiri_kontrak_magang"
												canEdit={canEdit}
												onUploadSuccess={onUpdate}
												onDeleteSuccess={onUpdate}
												onUpdate={onUpdate}
											/>
										</div>
									</div>

									{/* Slot B: Dokumen Surat Suhan */}
									<div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2.5">
										<div className="flex items-center justify-between">
											<span className="text-xs font-bold text-slate-800">
												Slot B: Dokumen Surat Suhan
											</span>
											{formData?.suhanStatus ||
											formData?.mandiriInterviewStatus ? (
												<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
													<CheckCircle className="w-3 h-3 mr-1" /> Terverifikasi
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-slate-400 border-slate-200 text-[10px]"
												>
													Belum Terbit
												</Badge>
											)}
										</div>
										<p className="text-[11px] text-slate-500">
											Surat izin kerja dan magang resmi pemerintah Taiwan
											(Suhan).
										</p>
										{isEditingUtama && (
											<div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
												<Checkbox
													id="suhanCheckbox"
													checked={Boolean(formData?.suhanStatus)}
													onCheckedChange={(checked) =>
														handleFieldChange("suhanStatus", Boolean(checked))
													}
												/>
												<label
													htmlFor="suhanCheckbox"
													className="text-xs text-slate-700 font-medium cursor-pointer"
												>
													Tandai Surat Suhan Terbit
												</label>
											</div>
										)}
										<div className="pt-1">
											<DocumentUpload
												studentId={studentId}
												panel="finance"
												documentKey="mandiri_suhan"
												canEdit={canEdit}
												onUploadSuccess={onUpdate}
												onDeleteSuccess={onUpdate}
												onUpdate={onUpdate}
											/>
										</div>
									</div>
								</div>

								{/* Tanggal Pelunasan Termin 3 */}
								{isEditingUtama ? (
									<div className="pt-2 border-t border-slate-100">
										<label className="text-[11px] font-medium text-slate-500 mb-1 block">
											Tanggal Pelunasan Termin 3 (Kontrak & Suhan)
										</label>
										<input
											type="date"
											value={
												formData?.mandiriInterviewPaidDate
													? String(formData.mandiriInterviewPaidDate).split(
															"T",
														)[0]
													: ""
											}
											onChange={(e) =>
												handleFieldChange(
													"mandiriInterviewPaidDate",
													e.target.value,
												)
											}
											className="w-full sm:w-64 text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white"
										/>
									</div>
								) : (
									formData?.mandiriInterviewPaidDate && (
										<div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
											<span className="font-medium text-slate-700">
												Tanggal Pelunasan:{" "}
											</span>
											{new Date(
												formData.mandiriInterviewPaidDate,
											).toLocaleDateString("id-ID", {
												day: "numeric",
												month: "long",
												year: "numeric",
											})}
										</div>
									)
								)}

								{/* Form Upload Bukti Pembayaran Termin 3 */}
								<div className="pt-3 border-t border-slate-100">
									<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
										Bukti Pembayaran Termin 3: Kontrak Magang / Suhan (PDF)
									</label>
									<DocumentUpload
										studentId={studentId}
										panel="finance"
										documentKey="mandiri_interview"
										canEdit={canEdit}
										onUploadSuccess={onUpdate}
										onDeleteSuccess={onUpdate}
										onUpdate={onUpdate}
									/>
								</div>
							</div>

							{/* 4. Termin 4: Penempatan Magang / Keberangkatan */}
							<div
								className={`p-5 rounded-2xl border transition-all space-y-4 shadow-2xs ${
									isKeberangkatanLunas || formData?.mandiriKeberangkatanStatus
										? "border-emerald-200/90 bg-emerald-50/15"
										: "border-slate-200/90 bg-white"
								}`}
							>
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5 border-slate-100">
									<div className="flex items-start gap-3">
										<Checkbox
											id="chk-mandiriKeberangkatan"
											checked={Boolean(
												isKeberangkatanLunas ||
													formData?.mandiriKeberangkatanStatus,
											)}
											disabled={!canEdit}
											onCheckedChange={(checked) => {
												if (isEditingUtama) {
													handleFieldChange(
														"mandiriKeberangkatanStatus",
														Boolean(checked),
													);
													if (
														checked &&
														!formData?.mandiriKeberangkatanPaidDate
													) {
														handleFieldChange(
															"mandiriKeberangkatanPaidDate",
															new Date().toISOString().split("T")[0],
														);
													}
												} else if (handleToggleStatus) {
													handleToggleStatus(
														"mandiriKeberangkatanStatus",
														Boolean(checked),
													);
												}
											}}
											className="mt-1 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
										/>
										<div>
											<label
												htmlFor="chk-mandiriKeberangkatan"
												className="text-sm sm:text-base font-bold text-slate-900 cursor-pointer flex items-center gap-2 hover:text-[#0517B0] transition-colors"
											>
												<span>Termin 4: {penempatanLabel}</span>
												<Badge
													variant="outline"
													className="text-[10px] font-bold bg-emerald-50 border-emerald-200 text-emerald-700"
												>
													Partisi 4 ({kebPct}% Total)
												</Badge>
											</label>
											<p className="text-xs text-slate-500 mt-0.5">
												Biaya penempatan magang, visa kerja resmi, dan tiket
												penerbangan
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3 shrink-0">
										<div className="text-right">
											<span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
												Tagihan Termin 4:
											</span>
											<span className="text-base font-bold text-slate-900 font-mono">
												{formatRupiah(
													formData?.mandiriKeberangkatanNominal || 0,
												)}
											</span>
										</div>
										<div>
											{isKeberangkatanLunas ||
											formData?.mandiriKeberangkatanStatus ? (
												<Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold gap-1 px-2.5 py-0.5">
													<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />{" "}
													Lunas
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-slate-500 border-slate-300 text-xs px-2.5 py-0.5"
												>
													Belum Lunas
												</Badge>
											)}
										</div>
									</div>
								</div>

								{/* Tanggal Bayar Termin 4 */}
								{isEditingUtama ? (
									<div className="pt-1">
										<label className="text-[11px] font-medium text-slate-500 mb-1 block">
											Tanggal Pembayaran Termin 4
										</label>
										<input
											type="date"
											value={
												formData?.mandiriKeberangkatanPaidDate
													? String(formData.mandiriKeberangkatanPaidDate).split(
															"T",
														)[0]
													: ""
											}
											onChange={(e) =>
												handleFieldChange(
													"mandiriKeberangkatanPaidDate",
													e.target.value,
												)
											}
											className="w-full sm:w-64 text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white"
										/>
									</div>
								) : (
									formData?.mandiriKeberangkatanPaidDate && (
										<div className="pt-1 text-xs text-slate-500">
											<span className="font-medium text-slate-700">
												Tanggal Bayar:{" "}
											</span>
											{new Date(
												formData.mandiriKeberangkatanPaidDate,
											).toLocaleDateString("id-ID", {
												day: "numeric",
												month: "long",
												year: "numeric",
											})}
										</div>
									)
								)}

								<div>
									<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
										Bukti Bayar Penempatan / Keberangkatan & Visa (PDF)
									</label>
									<DocumentUpload
										studentId={studentId}
										panel="finance"
										documentKey="penempatan_keberangkatan"
										canEdit={canEdit}
										onUploadSuccess={onUpdate}
										onDeleteSuccess={onUpdate}
										onUpdate={onUpdate}
									/>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Kondisional Metode: Dana Talangan Notice */}
				{formData?.metodePembayaran === "dana_talangan" && (
					<div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-950 shadow-xs">
						<Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
						<div className="space-y-1">
							<span className="font-bold text-emerald-950 block text-sm">
								Skema Terpilih: Dana Talangan 2 Tahap (Mitra Finansial)
							</span>
							<p className="text-emerald-800 leading-relaxed">
								Mahasiswa menggunakan fasilitas Dana Talangan Lembaga Mitra.
								Rincian biaya perkuliahan ditalangi, administrasi talangan,
								pencairan Tahap 1 & 2, serta monitoring cicilan magang dikelola
								pada kartu <strong>Rincian Skema Dana Talangan</strong> di
								bawah.
							</p>
						</div>
					</div>
				)}
			</CardContent>

			{/* Modal Pratinjau Dokumen Bukti Bayar */}
			<FilePreviewDialog
				open={previewModal.open}
				onOpenChange={(open) => setPreviewModal((prev) => ({ ...prev, open }))}
				file={previewModal.file}
				fileUrl={previewModal.fileUrl}
				title={previewModal.title}
			/>
		</Card>
	);
}
