"use client";

import {
	CheckCircle,
	Edit,
	FileText,
	Home,
	Languages,
	Loader2,
	Plane,
	Plus,
	Save,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import {
	filterFinanceInteger,
	preventFinanceIntegerKey,
} from "@/utils/form-validators";
import { formatRupiah } from "@/utils/format";

interface BiayaTambahanSectionProps {
	studentId: number;
	canEdit: boolean;
	isEditingTambahan: boolean;
	setIsEditingTambahan: (val: boolean) => void;
	loadingTambahan: boolean;
	handleCancelEdit: (section: "tambahan") => void;
	triggerSave: (section: "tambahan") => void;
	formData: any;
	handleFieldChange: (field: string, val: any) => void;
	hasToeicDoc: boolean;
	hasPasporDoc: boolean;
	hasRumahJuangDoc: boolean;
	financeDocs: Record<string, any[]>;
	customData: any[];
	handleCustomFieldChange: (idx: number, field: string, val: any) => void;
	triggerAddCustomField: (type: string) => void;
	triggerDeleteCustomField: (id: number) => void;
	preventMinus: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	handleToggleStatus?: (fieldKey: string, nextStatus: boolean) => void;
	handleToggleCustomStatus?: (
		fieldId: number,
		nextStatus: "lunas" | "belum_lunas",
	) => void;
	onUpdate: () => void;
}

export function BiayaTambahanSection({
	studentId,
	canEdit,
	isEditingTambahan,
	setIsEditingTambahan,
	loadingTambahan,
	handleCancelEdit,
	triggerSave,
	formData,
	handleFieldChange,
	hasToeicDoc,
	hasPasporDoc,
	hasRumahJuangDoc,
	financeDocs,
	customData,
	handleCustomFieldChange,
	triggerAddCustomField,
	triggerDeleteCustomField,
	handleToggleStatus,
	handleToggleCustomStatus,
	onUpdate,
}: BiayaTambahanSectionProps) {
	const isToeicChecked = Boolean(formData?.toeicStatus || hasToeicDoc);
	const isPasporChecked = Boolean(formData?.pasporStatus || hasPasporDoc);
	const isRumahJuangChecked = Boolean(
		formData?.rumahJuangStatus || hasRumahJuangDoc,
	);

	return (
		<Card className="border-0 shadow-sm ring-1 ring-slate-200/80 rounded-xl overflow-hidden">
			<CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 px-5 sm:px-6 py-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<CardTitle className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
							<Sparkles className="w-5 h-5 text-indigo-600" />
							Biaya Tambahan & Fasilitas Lainnya
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Kelola biaya sertifikasi, paspor, asrama dan pos biaya tambahan
							lainnya
						</p>
					</div>

					{canEdit && (
						<div className="flex items-center gap-2 self-end sm:self-auto">
							{isEditingTambahan ? (
								<>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => handleCancelEdit("tambahan")}
										disabled={loadingTambahan}
										className="h-8 text-xs font-semibold border-slate-300"
									>
										<X className="w-3.5 h-3.5 mr-1" /> Batal
									</Button>
									<Button
										type="button"
										size="sm"
										onClick={() => triggerSave("tambahan")}
										disabled={loadingTambahan}
										className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
									>
										{loadingTambahan ? (
											<>
												<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{" "}
												Menyimpan...
											</>
										) : (
											<>
												<Save className="w-3.5 h-3.5 mr-1" /> Simpan
											</>
										)}
									</Button>
								</>
							) : (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setIsEditingTambahan(true)}
									className="h-8 text-xs font-semibold border-slate-300 hover:bg-slate-50 gap-1"
								>
									<Edit className="w-3.5 h-3.5" /> Edit Biaya Tambahan
								</Button>
							)}
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent className="p-5 sm:p-6 space-y-6 bg-white">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* 1. Sertifikasi Bahasa */}
					<div
						className={`p-4 rounded-xl border transition-colors space-y-3.5 flex flex-col justify-between shadow-2xs hover:border-slate-300 ${
							isToeicChecked
								? "border-emerald-200 bg-emerald-50/20"
								: "border-slate-200/80 bg-slate-50"
						}`}
					>
						<div>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2.5">
									<Checkbox
										id="chk-toeicStatus"
										checked={isToeicChecked}
										disabled={!canEdit}
										onCheckedChange={(checked) => {
											if (isEditingTambahan) {
												handleFieldChange("toeicStatus", Boolean(checked));
												if (checked && !formData?.toeicPaidDate) {
													handleFieldChange(
														"toeicPaidDate",
														new Date().toISOString().split("T")[0],
													);
												}
											} else if (handleToggleStatus) {
												handleToggleStatus("toeicStatus", Boolean(checked));
											}
										}}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<Languages className="w-4 h-4 text-sky-600" />
									<label
										htmlFor="chk-toeicStatus"
										className="font-bold text-slate-800 text-sm cursor-pointer hover:text-[#0517B0] transition-colors"
									>
										Sertifikasi Bahasa
									</label>
								</div>
								{isToeicChecked ? (
									<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold">
										<CheckCircle className="w-3 h-3 mr-1" /> Lunas
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-slate-500 border-slate-200 text-[10px]"
									>
										Belum Lunas
									</Badge>
								)}
							</div>

							<div className="space-y-3 pt-1">
								<div>
									<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
										Nominal Tagihan
									</label>
									{isEditingTambahan ? (
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
												value={formData?.toeicNominal || ""}
												onChange={(e) =>
													handleFieldChange(
														"toeicNominal",
														filterFinanceInteger(e.target.value),
													)
												}
												placeholder="0"
												className="pl-9 h-9 text-xs font-semibold"
											/>
										</div>
									) : (
										<div className="text-sm font-bold text-slate-800 font-mono">
											{formatRupiah(formData?.toeicNominal || 0)}
										</div>
									)}
								</div>

								<div>
									<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
										Bukti Pembayaran (PDF)
									</label>
									<DocumentUpload
										studentId={studentId}
										panel="finance"
										documentKey="toeic"
										canEdit={canEdit}
										onUploadSuccess={onUpdate}
										onDeleteSuccess={onUpdate}
										onUpdate={onUpdate}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* 2. Paspor */}
					<div
						className={`p-4 rounded-xl border transition-colors space-y-3.5 flex flex-col justify-between shadow-2xs hover:border-slate-300 ${
							isPasporChecked
								? "border-emerald-200 bg-emerald-50/20"
								: "border-slate-200/80 bg-slate-50"
						}`}
					>
						<div>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2.5">
									<Checkbox
										id="chk-pasporStatus"
										checked={isPasporChecked}
										disabled={!canEdit}
										onCheckedChange={(checked) => {
											if (isEditingTambahan) {
												handleFieldChange("pasporStatus", Boolean(checked));
												if (checked && !formData?.pasporPaidDate) {
													handleFieldChange(
														"pasporPaidDate",
														new Date().toISOString().split("T")[0],
													);
												}
											} else if (handleToggleStatus) {
												handleToggleStatus("pasporStatus", Boolean(checked));
											}
										}}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<Plane className="w-4 h-4 text-indigo-600" />
									<label
										htmlFor="chk-pasporStatus"
										className="font-bold text-slate-800 text-sm cursor-pointer hover:text-[#0517B0] transition-colors"
									>
										Pembuatan Paspor
									</label>
								</div>
								{isPasporChecked ? (
									<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold">
										<CheckCircle className="w-3 h-3 mr-1" /> Lunas
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-slate-500 border-slate-200 text-[10px]"
									>
										Belum Lunas
									</Badge>
								)}
							</div>

							<div className="space-y-3 pt-1">
								<div>
									<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
										Nominal Tagihan
									</label>
									{isEditingTambahan ? (
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
												value={formData?.pasporNominal || ""}
												onChange={(e) =>
													handleFieldChange(
														"pasporNominal",
														filterFinanceInteger(e.target.value),
													)
												}
												placeholder="0"
												className="pl-9 h-9 text-xs font-semibold"
											/>
										</div>
									) : (
										<div className="text-sm font-bold text-slate-800 font-mono">
											{formatRupiah(formData?.pasporNominal || 0)}
										</div>
									)}
								</div>

								<div>
									<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
										Bukti Pembayaran (PDF)
									</label>
									<DocumentUpload
										studentId={studentId}
										panel="finance"
										documentKey="paspor"
										canEdit={canEdit}
										onUploadSuccess={onUpdate}
										onDeleteSuccess={onUpdate}
										onUpdate={onUpdate}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* 3. Fasilitas Rumah Juang */}
					<div
						className={`p-4 rounded-xl border transition-colors space-y-3.5 flex flex-col justify-between shadow-2xs hover:border-slate-300 ${
							isRumahJuangChecked
								? "border-emerald-200 bg-emerald-50/20"
								: "border-slate-200/80 bg-slate-50"
						}`}
					>
						<div>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2.5">
									<Checkbox
										id="chk-rumahJuangStatus"
										checked={isRumahJuangChecked}
										disabled={!canEdit}
										onCheckedChange={(checked) => {
											if (isEditingTambahan) {
												handleFieldChange("rumahJuangStatus", Boolean(checked));
												if (checked && !formData?.rumahJuangPaidDate) {
													handleFieldChange(
														"rumahJuangPaidDate",
														new Date().toISOString().split("T")[0],
													);
												}
											} else if (handleToggleStatus) {
												handleToggleStatus(
													"rumahJuangStatus",
													Boolean(checked),
												);
											}
										}}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<Home className="w-4 h-4 text-amber-600" />
									<label
										htmlFor="chk-rumahJuangStatus"
										className="font-bold text-slate-800 text-sm cursor-pointer hover:text-[#0517B0] transition-colors"
									>
										Rumah Juang / Asrama
									</label>
								</div>
								{formData?.rumahJuangAktif ? (
									isRumahJuangChecked ? (
										<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold">
											<CheckCircle className="w-3 h-3 mr-1" /> Lunas
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-slate-500 border-slate-200 text-[10px]"
										>
											Belum Lunas
										</Badge>
									)
								) : (
									<Badge
										variant="outline"
										className="text-slate-400 border-slate-200 text-[10px]"
									>
										Tidak Aktif
									</Badge>
								)}
							</div>

							<div className="space-y-3 pt-1">
								<div>
									<div className="flex items-center gap-2 mb-1.5">
										{isEditingTambahan ? (
											<div className="flex items-center gap-2">
												<Checkbox
													id="rumahJuangAktif"
													checked={!!formData?.rumahJuangAktif}
													onCheckedChange={(checked) =>
														handleFieldChange("rumahJuangAktif", !!checked)
													}
												/>
												<label
													htmlFor="rumahJuangAktif"
													className="text-[11px] font-semibold text-slate-700 cursor-pointer"
												>
													Mahasiswa Menggunakan Rumah Juang
												</label>
											</div>
										) : (
											<span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
												Status Fasilitas:{" "}
												<span className="font-bold text-slate-700">
													{formData?.rumahJuangAktif ? "Aktif" : "Tidak Aktif"}
												</span>
											</span>
										)}
									</div>

									{formData?.rumahJuangAktif && (
										<div>
											<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
												Nominal Tagihan
											</label>
											{isEditingTambahan ? (
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
														value={formData?.rumahJuangNominal || ""}
														onChange={(e) =>
															handleFieldChange(
																"rumahJuangNominal",
																filterFinanceInteger(e.target.value),
															)
														}
														placeholder="0"
														className="pl-9 h-9 text-xs font-semibold"
													/>
												</div>
											) : (
												<div className="text-sm font-bold text-slate-800 font-mono">
													{formatRupiah(formData?.rumahJuangNominal || 0)}
												</div>
											)}
										</div>
									)}
								</div>

								{formData?.rumahJuangAktif && (
									<div>
										<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
											Bukti Pembayaran (PDF)
										</label>
										<DocumentUpload
											studentId={studentId}
											panel="finance"
											documentKey="rumah_juang"
											canEdit={canEdit}
											onUploadSuccess={onUpdate}
											onDeleteSuccess={onUpdate}
											onUpdate={onUpdate}
										/>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Custom Fields Dinamis */}
					{customData.map((cf: any, idx: number) => {
						const docKey = `custom_${cf.id || idx}`;
						const isCfLunas =
							cf.status === "lunas" ||
							cf.status === "sudah_bayar" ||
							cf.status === "selesai" ||
							(financeDocs[docKey]?.length ?? 0) > 0;

						return (
							<div
								key={cf.id || idx}
								className={`p-4 rounded-xl border transition-colors space-y-3.5 flex flex-col justify-between shadow-2xs hover:border-slate-300 ${
									isCfLunas
										? "border-emerald-200 bg-emerald-50/20"
										: "border-slate-200/80 bg-slate-50"
								}`}
							>
								<div>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2.5">
											<Checkbox
												id={`chk-custom-${cf.id || idx}`}
												checked={isCfLunas}
												disabled={!canEdit}
												onCheckedChange={(checked) => {
													const nextStatus = checked ? "lunas" : "belum_lunas";
													if (isEditingTambahan) {
														handleCustomFieldChange(idx, "status", nextStatus);
													} else if (cf.id && handleToggleCustomStatus) {
														handleToggleCustomStatus(cf.id, nextStatus);
													} else {
														handleCustomFieldChange(idx, "status", nextStatus);
													}
												}}
												className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
											/>
											<FileText className="w-4 h-4 text-violet-600" />
											<label
												htmlFor={`chk-custom-${cf.id || idx}`}
												className="font-bold text-slate-800 text-sm truncate cursor-pointer hover:text-[#0517B0] transition-colors"
											>
												{cf.label || "Biaya Tambahan"}
											</label>
										</div>
										<div className="flex items-center gap-1.5">
											{isCfLunas ? (
												<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold">
													<CheckCircle className="w-3 h-3 mr-1" /> Lunas
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-slate-500 border-slate-200 text-[10px]"
												>
													Belum Lunas
												</Badge>
											)}
											{canEdit && isEditingTambahan && cf.id && (
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
													onClick={() => triggerDeleteCustomField(cf.id)}
												>
													<Trash2 className="w-3 h-3" />
												</Button>
											)}
										</div>
									</div>

									<div className="space-y-3 pt-1">
										<div>
											<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
												Nominal Tagihan
											</label>
											{isEditingTambahan ? (
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
														value={cf.nominal || ""}
														onChange={(e) =>
															handleCustomFieldChange(
																idx,
																"nominal",
																filterFinanceInteger(e.target.value),
															)
														}
														placeholder="0"
														className="pl-9 h-9 text-xs font-semibold"
													/>
												</div>
											) : (
												<div className="text-sm font-bold text-slate-800 font-mono">
													{formatRupiah(cf.nominal || 0)}
												</div>
											)}
										</div>

										<div>
											<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
												Bukti Pembayaran (PDF)
											</label>
											<DocumentUpload
												studentId={studentId}
												panel="finance"
												documentKey={docKey}
												canEdit={canEdit}
												onUploadSuccess={onUpdate}
												onDeleteSuccess={onUpdate}
												onUpdate={onUpdate}
											/>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Tombol Tambah Pos Biaya */}
				{canEdit && (
					<div className="pt-2 border-t border-slate-100 flex justify-end">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => triggerAddCustomField("additional")}
							className="text-xs font-semibold border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
						>
							<Plus className="w-3.5 h-3.5 text-indigo-600" />
							Tambah Pos Biaya Lainnya
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
