"use client";

import {
	Banknote,
	Calendar,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Edit,
	GraduationCap,
	Loader2,
	Paperclip,
	Plus,
	Save,
	Trash2,
	Wallet,
	X,
} from "lucide-react";
import React from "react";
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
import { formatRupiah } from "@/utils/format";

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
	handleDeleteInstallment: (semesterId: number, installmentId: number) => void;
	handleToggleStatus?: (fieldKey: string, nextStatus: boolean) => void;
	isInterviewLunas: boolean;
	isKeberangkatanLunas: boolean;
	intPct: number;
	kebPct: number;
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
	handleDeleteInstallment,
	handleToggleStatus,
	isInterviewLunas,
	isKeberangkatanLunas,
	intPct,
	kebPct,
	onUpdate,
}: PembayaranUtamaSectionProps) {
	const isMetodeTalangan = formData?.metodePembayaran === "dana_talangan";

	const renderSemesterCards = () => (
		<div className="space-y-4 bg-white p-5 border border-slate-200 rounded-lg shadow-sm">
			<div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-4">
				<h5 className="font-bold text-slate-800 flex items-center">
					Pembayaran 6 Semester
				</h5>
			</div>
			{loadingSemesters ? (
				<div className="flex items-center justify-center py-6 text-slate-400">
					<Loader2 className="w-5 h-5 animate-spin mr-2" />
					Memuat data semester...
				</div>
			) : (
				<div className="grid gap-3">
					{semesters.map((sem) => {
						const isExpanded = expandedSemesters.includes(sem.semesterNumber);
						const totalPaid = (sem.installments || []).reduce(
							(s: number, i: any) => s + i.nominalPaid,
							0,
						);
						const pct =
							sem.totalBilled > 0
								? Math.min(100, Math.round((totalPaid / sem.totalBilled) * 100))
								: 0;

						const statusConfig: Record<string, { label: string; cls: string }> =
							{
								LUNAS: {
									label: "Lunas",
									cls: "bg-emerald-100 text-emerald-700",
								},
								SEBAGIAN: {
									label: "Sebagian",
									cls: "bg-amber-100 text-amber-700",
								},
								BELUM_BAYAR: {
									label: "Belum Bayar",
									cls: "bg-slate-100 text-slate-500",
								},
							};
						const statusLabel =
							sem.isTalangan && isMetodeTalangan
								? {
										label: "Dana Talangan",
										cls: "bg-violet-100 text-violet-700",
									}
								: (statusConfig[sem.status] ?? statusConfig.BELUM_BAYAR);

						return (
							<div
								key={sem.id}
								className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs bg-white"
							>
								{/* Card Header Row */}
								<button
									type="button"
									className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-blue-50/30 transition-colors select-none w-full text-left"
									onClick={() => toggleSemesterExpand(sem.semesterNumber)}
								>
									<div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0517B0] flex items-center justify-center shrink-0 border border-blue-100">
										<GraduationCap className="w-4 h-4" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-bold text-slate-800 text-sm">
												Semester {sem.semesterNumber}
											</span>
											<Badge
												className={`text-[10px] px-2 py-0.2 font-bold ${statusLabel.cls}`}
											>
												{statusLabel.label}
											</Badge>
										</div>
										<div className="flex items-center gap-2 mt-1 w-full max-w-[220px]">
											<div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
												<div
													className={`h-full rounded-full transition-all duration-500 ${
														pct >= 100
															? "bg-emerald-500"
															: pct > 0
																? "bg-[#0517B0]"
																: "bg-slate-300"
													}`}
													style={{ width: `${pct}%` }}
												/>
											</div>
											<span className="text-[10px] font-mono font-bold text-slate-500">
												{pct}% ({formatRupiah(totalPaid)})
											</span>
										</div>
									</div>
									<div className="flex items-center gap-3 shrink-0">
										<div className="text-right hidden sm:block">
											<div className="text-[10px] text-slate-400 font-semibold uppercase">
												Tagihan
											</div>
											<div className="text-xs font-bold text-slate-800 font-mono">
												{formatRupiah(sem.totalBilled || 0)}
											</div>
										</div>
										{isExpanded ? (
											<ChevronUp className="w-4 h-4 text-slate-400" />
										) : (
											<ChevronDown className="w-4 h-4 text-slate-400" />
										)}
									</div>
								</button>

								{/* Expanded Body */}
								{isExpanded && (
									<div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4">
										{/* Row 1: Total Tagihan & Talangan Toggle */}
										<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
											<div className="flex-1">
												<label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
													Total Tagihan Semester
												</label>
												<div className="font-semibold text-slate-800">
													{formatRupiah(sem.totalBilled || 0)}
												</div>
											</div>

											{/* Dana Talangan status / toggle */}
											{isMetodeTalangan && (
												<div>
													{isEditingUtama ? (
														<button
															type="button"
															className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
																sem.isTalangan
																	? "bg-violet-50 border-violet-300 text-violet-700 font-semibold"
																	: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
															}`}
															onClick={() => handleToggleTalangan(sem)}
														>
															<Checkbox
																checked={sem.isTalangan}
																onCheckedChange={() =>
																	handleToggleTalangan(sem)
																}
															/>
															<span className="text-sm font-medium select-none">
																Ubah Menjadi Dana Talangan
															</span>
														</button>
													) : sem.isTalangan ? (
														<Badge className="bg-violet-100 text-violet-700 border-0 py-1.5 px-3 flex items-center gap-1.5 font-medium">
															<Banknote className="w-3.5 h-3.5" /> Dana Talangan
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="text-slate-500 border-slate-200 py-1.5 px-3 font-medium"
														>
															Dana Mandiri
														</Badge>
													)}
												</div>
											)}
										</div>

										{/* Talangan notice */}
										{sem.isTalangan && isMetodeTalangan && (
											<div className="flex items-center gap-2 p-3 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-sm">
												<Banknote className="w-4 h-4 flex-shrink-0" />
												<span>
													Semester ini menggunakan{" "}
													<strong>Dana Talangan</strong>. Pembayaran akan
													dipotong dari gaji mahasiswa.
												</span>
											</div>
										)}

										{/* Installments (Pembayaran) */}
										<div>
											<div className="flex items-center justify-between mb-2">
												<h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
													Riwayat Pembayaran
												</h5>
												<span className="text-xs text-slate-400">
													Total terbayar:{" "}
													<strong className="text-slate-600">
														{formatRupiah(totalPaid)}
													</strong>
												</span>
											</div>
											{(sem.installments || []).length === 0 ? (
												<div className="text-xs text-slate-400 italic bg-white border border-dashed border-slate-200 rounded-lg py-3 px-4 text-center">
													Belum ada pembayaran tercatat
												</div>
											) : (
												<div className="space-y-2">
													{(sem.installments || []).map((inst: any) => (
														<div
															key={inst.id}
															className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-3 py-2 shadow-sm"
														>
															<div className="flex items-center gap-2">
																<div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
																	{inst.installmentNumber}
																</div>
																<div>
																	<div className="flex items-center gap-2 flex-wrap">
																		<div className="font-semibold text-slate-800 text-sm">
																			{formatRupiah(inst.nominalPaid)}
																		</div>
																		{inst.isTalangan && isMetodeTalangan && (
																			<Badge className="bg-violet-100 text-violet-700 border-0 text-[10px] py-0 h-4">
																				Dana Talangan
																			</Badge>
																		)}
																		{inst.file ? (
																			<span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
																				<Paperclip className="w-3 h-3" />{" "}
																				{inst.file.name}
																			</span>
																		) : inst.buktiBayarUrl ? (
																			<a
																				href={`${API_URL}${inst.buktiBayarUrl.startsWith("/") ? "" : "/"}${inst.buktiBayarUrl}`}
																				target="_blank"
																				rel="noreferrer"
																				className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
																				onClick={(e) => e.stopPropagation()}
																			>
																				<Paperclip className="w-3 h-3" /> Bukti
																				Bayar
																			</a>
																		) : null}
																	</div>
																	<div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
																		<Calendar className="w-3 h-3" />
																		{inst.paymentDate
																			? new Date(
																					inst.paymentDate,
																				).toLocaleDateString("id-ID", {
																					day: "numeric",
																					month: "long",
																					year: "numeric",
																				})
																			: "-"}
																	</div>
																	{inst.notes && (
																		<div className="text-xs text-slate-400 italic mt-0.5">
																			{inst.notes}
																		</div>
																	)}
																</div>
															</div>
															{canEdit && isEditingUtama && (
																<div className="flex gap-1">
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
																		onClick={() =>
																			openInstallmentModal(sem, inst)
																		}
																	>
																		<Edit className="w-3.5 h-3.5" />
																	</Button>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-7 w-7 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
																		onClick={() =>
																			handleDeleteInstallment(sem.id, inst.id)
																		}
																	>
																		<Trash2 className="w-3.5 h-3.5" />
																	</Button>
																</div>
															)}
														</div>
													))}
												</div>
											)}

											{/* Add Installment Button */}
											{canEdit &&
												isEditingUtama &&
												(!sem.isTalangan || !isMetodeTalangan) && (
													<Button
														variant="outline"
														size="sm"
														className="mt-2 w-full border-dashed"
														onClick={() => openInstallmentModal(sem)}
													>
														<Plus className="w-3.5 h-3.5 mr-1.5" />
														Tambah Pembayaran
													</Button>
												)}
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);

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
				{/* 1. Registrasi Awal */}
				<div
					className={`p-4 rounded-xl border transition-colors space-y-3.5 ${
						formData?.registrasiStatus || isRegistrasiLunas
							? "border-emerald-200 bg-emerald-50/20 shadow-xs"
							: "border-slate-200 bg-white shadow-xs"
					}`}
				>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
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
										handleToggleStatus("registrasiStatus", Boolean(checked));
									}
								}}
								className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
							/>
							<div>
								<label
									htmlFor="chk-registrasiStatus"
									className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-2 hover:text-[#0517B0] transition-colors"
								>
									<span>1. Registrasi Awal</span>
									<Badge
										variant="outline"
										className="text-[10px] font-semibold bg-sky-50 border-sky-200 text-sky-700"
									>
										Partisi 1 ({regPct}% Total)
									</Badge>
								</label>
								<p className="text-[11px] text-slate-500 mt-0.5">
									Biaya masuk & pendaftaran awal mahasiswa
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3 shrink-0">
							<div className="text-right">
								<span className="text-xs text-slate-400 block font-normal">
									Tagihan:
								</span>
								<span className="text-base font-bold text-slate-800 font-mono">
									{formatRupiah(formData?.registrasiNominal || 0)}
								</span>
							</div>
							<div>
								{formData?.registrasiStatus || isRegistrasiLunas ? (
									<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold gap-1">
										<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />{" "}
										Lunas
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-slate-400 border-slate-200 text-xs"
									>
										Belum Lunas
									</Badge>
								)}
							</div>
						</div>
					</div>

					<div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col md:flex-row gap-6">
						<div className="flex-1 space-y-3.5">
							<div>
								<label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">
									Nominal Tagihan Registrasi
								</label>
								<div className="text-lg font-bold text-slate-800 font-mono">
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
												handleFieldChange("registrasiStatus", Boolean(checked));
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
														? String(formData.registrasiPaidDate).split("T")[0]
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
										{new Date(formData.registrasiPaidDate).toLocaleDateString(
											"id-ID",
											{
												day: "numeric",
												month: "long",
												year: "numeric",
											},
										)}
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

				<hr className="border-slate-100" />

				{/* 2. Biaya Perkuliahan (6 Semester) */}
				<div>
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<h4 className="font-semibold text-slate-800 flex items-center">
								Biaya Perkuliahan (6 Semester)
								{isSemesterAllLunas ? (
									<Badge className="ml-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
										<CheckCircle className="w-3 h-3 mr-1" /> Lunas
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="ml-3 text-slate-500 border-slate-300"
									>
										Belum Lunas ({semestersLunasCount}/6 Smt)
									</Badge>
								)}
							</h4>
							<Badge
								variant="outline"
								className="text-[10px] font-semibold bg-indigo-50 border-indigo-200 text-indigo-700"
							>
								Partisi 2 ({semPct}% Total)
							</Badge>
						</div>
					</div>

					<div className="p-4 bg-slate-50 rounded-lg border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">
								Total Tagihan Perkuliahan (6 Semester)
							</label>
							<div className="text-lg font-bold text-slate-800">
								{formatRupiah(curSemestersTotal)}
							</div>
							<div className="text-xs text-slate-400 mt-1">
								{formatRupiah(curSemesterPerSem)} per semester (6 semester)
							</div>
						</div>
						<div className="border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
							<label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">
								Total Terbayar Perkuliahan
							</label>
							<div className="text-lg font-bold text-emerald-700">
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
								{semestersLunasCount}/6 Semester Selesai / Ditalangi
							</div>
						</div>
					</div>
				</div>

				{/* Pembayaran 6 Semester */}
				<div className="space-y-4">{renderSemesterCards()}</div>

				<hr className="border-slate-100" />

				{/* Metode Pembayaran */}
				<div>
					<div className="mb-4">
						<h4 className="font-semibold text-slate-800 mb-1">
							Metode Pembayaran Lanjutan
						</h4>
						<p className="text-sm text-slate-500">
							Pilih skema pelunasan biaya pendidikan setelah registrasi awal &
							perkuliahan semester.
						</p>
					</div>

					{isEditingUtama ? (
						<Select
							value={formData?.metodePembayaran || ""}
							onValueChange={(val) =>
								handleFieldChange("metodePembayaran", val)
							}
						>
							<SelectTrigger className="w-full sm:w-[400px]">
								<SelectValue placeholder="Pilih metode pembayaran..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="mandiri">
									Dana Mandiri (Tunai/Bertahap)
								</SelectItem>
								<SelectItem value="dana_talangan">
									Dana Talangan 2 Tahap (Lembaga Keuangan)
								</SelectItem>
							</SelectContent>
						</Select>
					) : (
						<div className="inline-flex">
							<Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200 text-sm px-4 py-1.5">
								{formData?.metodePembayaran === "mandiri"
									? "Dana Mandiri"
									: formData?.metodePembayaran === "dana_talangan"
										? "Dana Talangan 2 Tahap"
										: "Belum Dipilih"}
							</Badge>
						</div>
					)}
				</div>

				{/* Kondisional Metode: Dana Mandiri */}
				{formData?.metodePembayaran === "mandiri" && (
					<div className="space-y-4 p-5 border border-blue-100 bg-blue-50/40 rounded-xl">
						<h4 className="font-bold text-blue-900 flex items-center">
							Rincian Skema Dana Mandiri (Interview & Keberangkatan)
						</h4>

						<div className="grid gap-4">
							{[
								{
									label: "Interview Magang",
									docKey: "mandiri_interview",
									nomField: "mandiriInterviewNominal",
									statusField: "mandiriInterviewStatus",
									pct: intPct,
									partisiNum: 3,
									badgeColor: "bg-amber-50 border-amber-200 text-amber-700",
									chkId: "chk-mandiriInterview",
								},
								{
									label: "Keberangkatan",
									docKey: "mandiri_keberangkatan",
									nomField: "mandiriKeberangkatanNominal",
									statusField: "mandiriKeberangkatanStatus",
									pct: kebPct,
									partisiNum: 4,
									badgeColor:
										"bg-emerald-50 border-emerald-200 text-emerald-700",
									chkId: "chk-mandiriKeberangkatan",
								},
							].map((item, idx) => {
								const isLunas = Boolean(formData?.[item.statusField]);
								return (
									<div
										key={idx}
										className={`p-4 rounded-xl border transition-colors space-y-3.5 ${
											isLunas
												? "border-emerald-200 bg-emerald-50/20 shadow-xs"
												: "border-slate-200 bg-white shadow-xs"
										}`}
									>
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100">
											<div className="flex items-center gap-3">
												<Checkbox
													id={item.chkId}
													checked={isLunas}
													disabled={!canEdit}
													onCheckedChange={(checked) => {
														if (isEditingUtama) {
															handleFieldChange(
																item.statusField,
																Boolean(checked),
															);
															if (
																checked &&
																!formData?.[`${item.statusField}PaidDate`]
															) {
																handleFieldChange(
																	`${item.statusField}PaidDate`,
																	new Date().toISOString().split("T")[0],
																);
															}
														} else if (handleToggleStatus) {
															handleToggleStatus(
																item.statusField,
																Boolean(checked),
															);
														}
													}}
													className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
												/>
												<div>
													<label
														htmlFor={item.chkId}
														className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-2 hover:text-[#0517B0] transition-colors"
													>
														<span>{item.label}</span>
														<Badge
															variant="outline"
															className={`text-[10px] font-semibold ${item.badgeColor}`}
														>
															Partisi {item.partisiNum} ({item.pct}% Total)
														</Badge>
													</label>
												</div>
											</div>
											<div className="flex items-center gap-4">
												<div className="font-bold text-slate-800 text-right font-mono">
													{formatRupiah(formData?.[item.nomField] || 0)}
												</div>
												<div>
													{isLunas ? (
														<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
															<CheckCircle className="w-3 h-3 mr-1" /> Lunas
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="text-slate-400 border-slate-200 text-[10px]"
														>
															Belum Lunas
														</Badge>
													)}
												</div>
											</div>
										</div>
										<div>
											<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
												Bukti Bayar {item.label} (PDF)
											</label>
											<DocumentUpload
												studentId={studentId}
												panel="finance"
												documentKey={item.docKey}
												canEdit={canEdit}
												onUploadSuccess={onUpdate}
												onDeleteSuccess={onUpdate}
												onUpdate={onUpdate}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
