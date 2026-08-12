import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TabDokumenProps {
	studentId: number;
	data: any;
	canEdit: boolean;
	handleToggleField: (field: string, value: any) => void;
	handleLocalChange: (field: string, value: any) => void;
	handleBlurField: (field: string) => void;
	fetchInternshipData: () => Promise<void>;
	notes: string;
	setNotes: (val: string) => void;
	handleSaveNotes: () => void;
	isSaving: boolean;
}

export function TabDokumen({
	studentId,
	data,
	canEdit,
	handleToggleField,
	handleLocalChange,
	handleBlurField,
	fetchInternshipData,
	notes,
	setNotes,
	handleSaveNotes,
	isSaving,
}: TabDokumenProps) {
	const [isEditMode, setIsEditMode] = useState(false);

	return (
		<div className="space-y-8">
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
					<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
						STATUS DOKUMEN KEBERANGKATAN
					</h3>
					<Button
						variant={isEditMode ? "default" : "outline"}
						size="sm"
						onClick={() => setIsEditMode(!isEditMode)}
						className={
							isEditMode ? "bg-[#0517B0] hover:bg-blue-800 text-white" : ""
						}
						disabled={!canEdit}
					>
						{isEditMode ? "Tutup Mode Edit" : "Edit Dokumen"}
					</Button>
				</div>

				<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* 1. Paspor */}
					<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm">
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEdit && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField("passportReady", !data?.passportReady)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.passportReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.passportReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${data?.passportReady ? "text-slate-800" : "text-slate-600"}`}
							>
								Paspor
							</h4>
						</div>
						<div className="space-y-3">
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Nomor Paspor
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										value={data?.passportNo || ""}
										onChange={(e) =>
											handleLocalChange("passportNo", e.target.value)
										}
										onBlur={() => handleBlurField("passportNo")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
										placeholder="Contoh: A1234567"
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Tanggal Expired
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										type="date"
										value={
											data?.passportExp
												? new Date(data.passportExp).toISOString().split("T")[0]
												: ""
										}
										onChange={(e) =>
											handleLocalChange("passportExp", e.target.value)
										}
										onBlur={() => handleBlurField("passportExp")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
									/>
								</div>
							</div>
							<div className="pt-2">
								<label className="text-xs font-medium text-slate-500 mb-2 block">
									Lampiran Dokumen
								</label>
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="paspor"
									canEdit={canEdit && isEditMode}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>
					</div>

					{/* 2. Interview User */}
					<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm">
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEdit && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField("interviewReady", !data?.interviewReady)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.interviewReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.interviewReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${data?.interviewReady ? "text-slate-800" : "text-slate-600"}`}
							>
								Interview User
							</h4>
						</div>
						<div className="space-y-3">
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Nama Hotel
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										value={data?.internshipCompany || ""}
										onChange={(e) =>
											handleLocalChange("internshipCompany", e.target.value)
										}
										onBlur={() => handleBlurField("internshipCompany")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
										placeholder="Nama Hotel/Perusahaan"
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Tanggal Interview
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										type="date"
										value={
											data?.interviewDate
												? new Date(data.interviewDate)
														.toISOString()
														.split("T")[0]
												: ""
										}
										onChange={(e) =>
											handleLocalChange("interviewDate", e.target.value)
										}
										onBlur={() => handleBlurField("interviewDate")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
									/>
								</div>
							</div>
							<div className="pt-2">
								<label className="text-xs font-medium text-slate-500 mb-2 block">
									Lampiran Dokumen
								</label>
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="interview_user"
									canEdit={canEdit && isEditMode}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>
					</div>

					{/* 3. Kontrak Magang & MOU */}
					<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm">
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEdit && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField("contractReady", !data?.contractReady)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.contractReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.contractReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${data?.contractReady ? "text-slate-800" : "text-slate-600"}`}
							>
								Kontrak Magang & MOU
							</h4>
						</div>
						<div className="space-y-3">
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Tanggal Kontrak Magang
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										type="date"
										value={
											data?.contractDate
												? new Date(data.contractDate)
														.toISOString()
														.split("T")[0]
												: ""
										}
										onChange={(e) =>
											handleLocalChange("contractDate", e.target.value)
										}
										onBlur={() => handleBlurField("contractDate")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Tanggal MOU
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										type="date"
										value={
											data?.moaDate
												? new Date(data.moaDate).toISOString().split("T")[0]
												: ""
										}
										onChange={(e) =>
											handleLocalChange("moaDate", e.target.value)
										}
										onBlur={() => handleBlurField("moaDate")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
									/>
								</div>
							</div>
							<div className="pt-2">
								<label className="text-xs font-medium text-slate-500 mb-2 block">
									Lampiran Dokumen
								</label>
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="kontrak_mou"
									canEdit={canEdit && isEditMode}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>
					</div>

					{/* 4. Surat Izin Penerimaan Negara Tujuan */}
					<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm">
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEdit && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField("loaReady", !data?.loaReady)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.loaReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.loaReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${data?.loaReady ? "text-slate-800" : "text-slate-600"}`}
							>
								Surat Izin Penerimaan Negara Tujuan
							</h4>
						</div>
						<div className="space-y-3">
							<div className="pt-2">
								<label className="text-xs font-medium text-slate-500 mb-2 block">
									Lampiran Dokumen
								</label>
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="surat_izin_negara"
									canEdit={canEdit && isEditMode}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>
					</div>

					{/* 5. Medical Check-UP (MCU) */}
					<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm">
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEdit && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField("mcuReady", !data?.mcuReady)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.mcuReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.mcuReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${data?.mcuReady ? "text-slate-800" : "text-slate-600"}`}
							>
								Medical Check-UP (MCU)
							</h4>
						</div>
						<div className="space-y-3">
							<div className="space-y-1">
								<label className="text-xs font-medium text-slate-500">
									Klinik / Tempat MCU
								</label>
								<Input
									disabled={!canEdit || !isEditMode}
									value={data?.mcuPlace || ""}
									onChange={(e) =>
										handleLocalChange("mcuPlace", e.target.value)
									}
									onBlur={() => handleBlurField("mcuPlace")}
									className={
										!canEdit || !isEditMode
											? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
											: "bg-white h-8 text-sm"
									}
									placeholder="Nama Klinik/Rumah Sakit"
								/>
							</div>
							<div className="pt-2">
								<label className="text-xs font-medium text-slate-500 mb-2 block">
									Lampiran Dokumen
								</label>
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="mcu"
									canEdit={canEdit && isEditMode}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>
					</div>

					{/* 6. Visa */}
					<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm">
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEdit && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField("visaReady", !data?.visaReady)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.visaReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.visaReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${data?.visaReady ? "text-slate-800" : "text-slate-600"}`}
							>
								Visa
							</h4>
						</div>
						<div className="space-y-3">
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Jenis Visa
									</label>
									<Select
										disabled={!canEdit || !isEditMode}
										value={data?.visaType ?? ""}
										onValueChange={(val) => handleToggleField("visaType", val)}
									>
										<SelectTrigger
											className={
												!canEdit || !isEditMode
													? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
													: "bg-white h-8 text-sm"
											}
										>
											<SelectValue placeholder="Pilih Jenis Visa" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Internship">Internship</SelectItem>
											<SelectItem value="Worker">Worker</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Nomor Visa
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										value={data?.visaNo || ""}
										onChange={(e) =>
											handleLocalChange("visaNo", e.target.value)
										}
										onBlur={() => handleBlurField("visaNo")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
										placeholder="Nomor Visa"
									/>
								</div>
							</div>
							<div className="pt-2">
								<label className="text-xs font-medium text-slate-500 mb-2 block">
									Lampiran Dokumen
								</label>
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="visa"
									canEdit={canEdit && isEditMode}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>
					</div>

					{/* 7. Pembekalan (PDT) */}
					<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm md:col-span-2">
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEdit && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField("pdtReady", !data?.pdtReady)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.pdtReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.pdtReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${data?.pdtReady ? "text-slate-800" : "text-slate-600"}`}
							>
								Pembekalan (PDT)
							</h4>
						</div>
						<div className="space-y-3">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Tanggal Mulai
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										type="date"
										value={
											data?.pdtDate
												? new Date(data.pdtDate).toISOString().split("T")[0]
												: ""
										}
										onChange={(e) =>
											handleLocalChange("pdtDate", e.target.value)
										}
										onBlur={() => handleBlurField("pdtDate")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Tanggal Selesai
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										type="date"
										value={
											data?.pdtEndDate
												? new Date(data.pdtEndDate).toISOString().split("T")[0]
												: ""
										}
										onChange={(e) =>
											handleLocalChange("pdtEndDate", e.target.value)
										}
										onBlur={() => handleBlurField("pdtEndDate")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Tempat Pembekalan
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										value={data?.pdtPlace || ""}
										onChange={(e) =>
											handleLocalChange("pdtPlace", e.target.value)
										}
										onBlur={() => handleBlurField("pdtPlace")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
										placeholder="Nama Tempat"
									/>
								</div>
							</div>
							<div className="pt-2">
								<label className="text-xs font-medium text-slate-500 mb-2 block">
									Lampiran Dokumen (Opsional)
								</label>
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="pdt"
									canEdit={canEdit && isEditMode}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>
					</div>

					{/* 8. Dokumentasi Keberangkatan */}
					<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm md:col-span-2">
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEdit && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField(
												"dokumentasiReady",
												!data?.dokumentasiReady,
											)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.dokumentasiReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.dokumentasiReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${data?.dokumentasiReady ? "text-slate-800" : "text-slate-600"}`}
							>
								Dokumentasi Keberangkatan
							</h4>
						</div>
						<div className="space-y-3">
							<div className="space-y-1">
								<label className="text-xs font-medium text-slate-500">
									Tautan Video
								</label>
								{!canEdit || !isEditMode ? (
									<div className="h-8 flex items-center bg-slate-50 border-transparent px-3 rounded-md">
										{data?.dokumentasiKeberangkatanLink ? (
											<a
												href={data.dokumentasiKeberangkatanLink}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm font-semibold text-blue-600 hover:underline truncate"
											>
												{data.dokumentasiKeberangkatanLink}
											</a>
										) : (
											<span className="text-sm font-semibold text-slate-800">
												-
											</span>
										)}
									</div>
								) : (
									<Input
										disabled={!canEdit || !isEditMode}
										type="url"
										value={data?.dokumentasiKeberangkatanLink || ""}
										onChange={(e) =>
											handleLocalChange(
												"dokumentasiKeberangkatanLink",
												e.target.value,
											)
										}
										onBlur={() =>
											handleBlurField("dokumentasiKeberangkatanLink")
										}
										className="bg-white h-8 text-sm"
										placeholder="https://youtube.com/..."
									/>
								)}
							</div>
							<div className="pt-2">
								<label className="text-xs font-medium text-slate-500 mb-2 block">
									Lampiran Foto/Dokumen
								</label>
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="dokumentasi_keberangkatan"
									canEdit={canEdit && isEditMode}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>
					</div>

					{/* 9. Keberangkatan */}
					<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm md:col-span-2">
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEdit && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField("ticketReady", !data?.ticketReady)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.ticketReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.ticketReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${data?.ticketReady ? "text-slate-800" : "text-slate-600"}`}
							>
								Keberangkatan
							</h4>
						</div>
						<div className="space-y-3">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Maskapai
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										value={data?.ticketAirline || ""}
										onChange={(e) =>
											handleLocalChange("ticketAirline", e.target.value)
										}
										onBlur={() => handleBlurField("ticketAirline")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
										placeholder="Nama Maskapai"
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Tanggal Berangkat
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										type="date"
										value={
											data?.ticketDate
												? new Date(data.ticketDate).toISOString().split("T")[0]
												: ""
										}
										onChange={(e) =>
											handleLocalChange("ticketDate", e.target.value)
										}
										onBlur={() => handleBlurField("ticketDate")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										No. Penerbangan
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										value={data?.ticketFlight || ""}
										onChange={(e) =>
											handleLocalChange("ticketFlight", e.target.value)
										}
										onBlur={() => handleBlurField("ticketFlight")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
										placeholder="Contoh: SQ950"
									/>
								</div>
							</div>
							<div className="pt-2">
								<label className="text-xs font-medium text-slate-500 mb-2 block">
									Upload Tiket
								</label>
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="tiket_keberangkatan"
									canEdit={canEdit && isEditMode}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>
					</div>

					{/* 10. Dokumen Agen */}
					<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm md:col-span-2">
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEdit && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField("agenReady", !data?.agenReady)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.agenReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.agenReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${data?.agenReady ? "text-slate-800" : "text-slate-600"}`}
							>
								Dokumen Agen
							</h4>
						</div>
						<div className="space-y-3">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Negara Tujuan
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										value={data?.agenNegaraTujuan || ""}
										onChange={(e) =>
											handleLocalChange("agenNegaraTujuan", e.target.value)
										}
										onBlur={() => handleBlurField("agenNegaraTujuan")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
										placeholder="Nama Negara"
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium text-slate-500">
										Peminatan
									</label>
									<Input
										disabled={!canEdit || !isEditMode}
										value={data?.agenPeminatan || ""}
										onChange={(e) =>
											handleLocalChange("agenPeminatan", e.target.value)
										}
										onBlur={() => handleBlurField("agenPeminatan")}
										className={
											!canEdit || !isEditMode
												? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none h-8 text-sm"
												: "bg-white h-8 text-sm"
										}
										placeholder="Program/Peminatan"
									/>
								</div>
							</div>
							<div className="pt-2">
								<label className="text-xs font-medium text-slate-500 mb-2 block">
									Upload Laporan (Custom Field)
								</label>
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="dokumen_agen"
									canEdit={canEdit && isEditMode}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* RIGHT COLUMN: SCHEDULE & NOTES */}
			<div className="space-y-8">
				{/* NOTES */}
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							CATATAN TIM MAGANG
						</h3>
					</div>
					<div className="p-5">
						<Textarea
							disabled={!canEdit}
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							className={
								!canEdit
									? "bg-slate-50 border-transparent text-slate-800 font-semibold disabled:opacity-100 disabled:cursor-default shadow-none min-h-[160px]"
									: "min-h-[160px] bg-slate-50 border-slate-200"
							}
							placeholder="Kendala kelengkapan dokumen, reschedule interview, dsb..."
						/>
						{canEdit && (
							<div className="mt-3 flex justify-end">
								<Button
									onClick={handleSaveNotes}
									disabled={isSaving}
									variant="outline"
									className="text-slate-700"
								>
									Simpan Catatan
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
