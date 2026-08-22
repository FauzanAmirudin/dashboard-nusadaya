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
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/utils/format";
import { StagedDocumentUpload } from "./StagedDocumentUpload";

interface BiayaTambahanSectionProps {
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
	stagedDocsTambahan: Record<string, File | null>;
	deletedDocKeysTambahan: string[];
	handleStageDoc: (section: "tambahan", docKey: string, file: File) => void;
	handleRemoveStagedDoc: (section: "tambahan", docKey: string) => void;
	handleDeleteExistingDoc: (section: "tambahan", docKey: string) => void;
	handleRestoreExistingDoc: (section: "tambahan", docKey: string) => void;
	customData: any[];
	handleCustomFieldChange: (idx: number, field: string, val: any) => void;
	triggerAddCustomField: (type: string) => void;
	triggerDeleteCustomField: (id: number) => void;
	preventMinus: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function BiayaTambahanSection({
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
	stagedDocsTambahan,
	deletedDocKeysTambahan,
	handleStageDoc,
	handleRemoveStagedDoc,
	handleDeleteExistingDoc,
	handleRestoreExistingDoc,
	customData,
	handleCustomFieldChange,
	triggerAddCustomField,
	triggerDeleteCustomField,
	preventMinus,
}: BiayaTambahanSectionProps) {
	return (
		<Card className="border border-slate-200/90 shadow-2xs overflow-hidden rounded-xl bg-white">
			<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5 sm:px-6 flex flex-row items-center justify-between">
				<div className="flex items-center gap-2.5">
					<div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100/70 shadow-2xs">
						<Sparkles className="w-4 h-4" />
					</div>
					<div>
						<CardTitle className="text-base font-bold text-slate-900 tracking-tight">
							Biaya Tambahan Lainnya
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Sertifikasi bahasa, paspor, asrama, dan pos biaya khusus lainnya
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{canEdit && !isEditingTambahan && (
						<Button
							size="sm"
							onClick={() => setIsEditingTambahan(true)}
							className="bg-[#0517B0] hover:bg-blue-800 text-white font-semibold text-xs h-8.5 rounded-lg shadow-2xs gap-1.5"
						>
							<Edit className="w-3.5 h-3.5" /> Edit Data
						</Button>
					)}
					{isEditingTambahan && (
						<>
							<Button
								size="sm"
								variant="outline"
								onClick={() => handleCancelEdit("tambahan")}
								disabled={loadingTambahan}
								className="h-8.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
							>
								<X className="w-3.5 h-3.5 mr-1" /> Batal
							</Button>
							<Button
								size="sm"
								onClick={() => triggerSave("tambahan")}
								disabled={loadingTambahan}
								className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8.5 rounded-lg shadow-2xs"
							>
								{loadingTambahan ? (
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
			<CardContent className="p-5 sm:p-6 space-y-5 bg-white">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* 1. Sertifikasi Bahasa */}
					<div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all">
						<div>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
									<Languages className="w-4 h-4 text-sky-600" />
									<span>Sertifikasi Bahasa</span>
								</div>
								{hasToeicDoc ? (
									<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
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

							<div className="space-y-3">
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
												onKeyDown={preventMinus}
												value={formData?.toeicNominal || ""}
												onChange={(e) =>
													handleFieldChange(
														"toeicNominal",
														Number(e.target.value) || 0,
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
									<StagedDocumentUpload
										docKey="toeic"
										isEditing={isEditingTambahan}
										canEdit={canEdit}
										existingDocs={financeDocs.toeic}
										stagedFile={stagedDocsTambahan.toeic}
										isDeleted={deletedDocKeysTambahan.includes("toeic")}
										onStageFile={(file) =>
											handleStageDoc("tambahan", "toeic", file)
										}
										onRemoveStagedFile={() =>
											handleRemoveStagedDoc("tambahan", "toeic")
										}
										onDeleteExistingDoc={() =>
											handleDeleteExistingDoc("tambahan", "toeic")
										}
										onRestoreExistingDoc={() =>
											handleRestoreExistingDoc("tambahan", "toeic")
										}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* 2. Paspor */}
					<div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all">
						<div>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
									<Plane className="w-4 h-4 text-indigo-600" />
									<span>Pembuatan Paspor</span>
								</div>
								{hasPasporDoc ? (
									<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
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

							<div className="space-y-3">
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
												onKeyDown={preventMinus}
												value={formData?.pasporNominal || ""}
												onChange={(e) =>
													handleFieldChange(
														"pasporNominal",
														Number(e.target.value) || 0,
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
									<StagedDocumentUpload
										docKey="paspor"
										isEditing={isEditingTambahan}
										canEdit={canEdit}
										existingDocs={financeDocs.paspor}
										stagedFile={stagedDocsTambahan.paspor}
										isDeleted={deletedDocKeysTambahan.includes("paspor")}
										onStageFile={(file) =>
											handleStageDoc("tambahan", "paspor", file)
										}
										onRemoveStagedFile={() =>
											handleRemoveStagedDoc("tambahan", "paspor")
										}
										onDeleteExistingDoc={() =>
											handleDeleteExistingDoc("tambahan", "paspor")
										}
										onRestoreExistingDoc={() =>
											handleRestoreExistingDoc("tambahan", "paspor")
										}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* 3. Fasilitas Rumah Juang */}
					<div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all">
						<div>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
									<Home className="w-4 h-4 text-amber-600" />
									<span>Rumah Juang / Asrama</span>
								</div>
								{formData?.rumahJuangAktif ? (
									hasRumahJuangDoc ? (
										<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
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

							<div className="space-y-3">
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
														onKeyDown={preventMinus}
														value={formData?.rumahJuangNominal || ""}
														onChange={(e) =>
															handleFieldChange(
																"rumahJuangNominal",
																Number(e.target.value) || 0,
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
										<StagedDocumentUpload
											docKey="rumah_juang"
											isEditing={isEditingTambahan}
											canEdit={canEdit}
											existingDocs={financeDocs.rumah_juang}
											stagedFile={stagedDocsTambahan.rumah_juang}
											isDeleted={deletedDocKeysTambahan.includes("rumah_juang")}
											onStageFile={(file) =>
												handleStageDoc("tambahan", "rumah_juang", file)
											}
											onRemoveStagedFile={() =>
												handleRemoveStagedDoc("tambahan", "rumah_juang")
											}
											onDeleteExistingDoc={() =>
												handleDeleteExistingDoc("tambahan", "rumah_juang")
											}
											onRestoreExistingDoc={() =>
												handleRestoreExistingDoc("tambahan", "rumah_juang")
											}
										/>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Custom Fields Dinamis */}
					{customData.map((cf: any, idx: number) => {
						const docKey = `custom_${cf.id || idx}`;
						const hasDoc =
							!!stagedDocsTambahan[docKey] ||
							(((financeDocs[docKey]?.length ?? 0) > 0 || !!cf.status) &&
								!deletedDocKeysTambahan.includes(docKey));

						return (
							<div
								key={cf.id || idx}
								className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all"
							>
								<div>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
											<FileText className="w-4 h-4 text-violet-600" />
											<span className="truncate">
												{cf.label || "Biaya Tambahan"}
											</span>
										</div>
										<div className="flex items-center gap-1.5">
											{hasDoc ? (
												<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
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

									<div className="space-y-3">
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
														onKeyDown={preventMinus}
														value={cf.nominal || ""}
														onChange={(e) =>
															handleCustomFieldChange(
																idx,
																"nominal",
																Number(e.target.value) || 0,
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
											<StagedDocumentUpload
												docKey={docKey}
												isEditing={isEditingTambahan}
												canEdit={canEdit}
												existingDocs={financeDocs[docKey]}
												stagedFile={stagedDocsTambahan[docKey]}
												isDeleted={deletedDocKeysTambahan.includes(docKey)}
												onStageFile={(file) =>
													handleStageDoc("tambahan", docKey, file)
												}
												onRemoveStagedFile={() =>
													handleRemoveStagedDoc("tambahan", docKey)
												}
												onDeleteExistingDoc={() =>
													handleDeleteExistingDoc("tambahan", docKey)
												}
												onRestoreExistingDoc={() =>
													handleRestoreExistingDoc("tambahan", docKey)
												}
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
