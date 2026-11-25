"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
	getAgencyPaymentReminders,
	isTaiwanDestination,
} from "@/utils/panel-logic";
import {
	ChecklistGroup,
	ChecklistRow,
	OptionalGroup,
	RowField,
	rowInputClass,
	toDateInput,
} from "./ChecklistRow";
import { InterviewList } from "./InterviewList";

interface EmergencyContactSummary {
	name: string;
	relation: string;
	phone: string;
}

interface TabDokumenProps {
	studentId: number;
	data: any;
	destinationCountry?: string | null;
	canEdit: boolean;
	loadingItem?: string | null;
	handleToggleField: (field: string, value: any) => Promise<void> | void;
	handleLocalChange: (field: string, value: any) => void;
	handleBlurField: (field: string) => Promise<void> | void;
	handleSaveFields?: (patch: Record<string, unknown>) => Promise<boolean>;
	onOpenPenempatan?: () => void;
	emergencyContact?: EmergencyContactSummary | null;
	fetchInternshipData: () => Promise<void>;
	notes: string;
	setNotes: (val: string) => void;
	handleSaveNotes: () => Promise<void> | void;
	isSaving: boolean;
}

export function TabDokumen({
	studentId,
	data,
	destinationCountry,
	canEdit,
	loadingItem = null,
	handleToggleField,
	handleLocalChange,
	handleBlurField,
	handleSaveFields,
	onOpenPenempatan,
	emergencyContact,
	fetchInternshipData,
	notes,
	setNotes,
	handleSaveNotes,
	isSaving,
}: TabDokumenProps) {
	// Sama dengan aturan ACC (calculateInternshipDokumenChecklist / server): MOU↔MOA, Asesmen↔PDT
	const isChecklistDone = (key: string) => {
		if (key === "mouReady") return Boolean(data?.mouReady ?? data?.moaReady);
		if (key === "asesmenReady")
			return Boolean(data?.asesmenReady ?? data?.pdtReady);
		return Boolean(data?.[key]);
	};

	// --- Field detail (perilaku simpan sama seperti sebelumnya: ubah lokal, simpan saat blur) ---
	const textField = (field: string, label: string, placeholder: string) => (
		<RowField label={label} htmlFor={`f-${field}`}>
			<Input
				id={`f-${field}`}
				placeholder={placeholder}
				className={rowInputClass}
				value={data?.[field] || ""}
				disabled={!canEdit}
				onChange={(e) => handleLocalChange(field, e.target.value)}
				onBlur={() => handleBlurField(field)}
			/>
		</RowField>
	);

	const dateField = (field: string, label: string) => (
		<RowField label={label} htmlFor={`f-${field}`}>
			<Input
				id={`f-${field}`}
				type="date"
				className={rowInputClass}
				value={toDateInput(data?.[field])}
				disabled={!canEdit}
				onChange={(e) => handleLocalChange(field, e.target.value)}
				onBlur={() => handleBlurField(field)}
			/>
		</RowField>
	);

	// Pilihan langsung tersimpan saat diganti
	const selectField = (
		field: string,
		label: string,
		fallback: string,
		options: [string, string][],
	) => (
		<RowField label={label}>
			<Select
				value={data?.[field] || fallback}
				disabled={!canEdit}
				onValueChange={(val) => {
					handleLocalChange(field, val);
					handleToggleField(field, val);
				}}
			>
				<SelectTrigger className={`w-full ${rowInputClass}`}>
					<SelectValue placeholder={`Pilih ${label}`} />
				</SelectTrigger>
				<SelectContent>
					{options.map(([value, text]) => (
						<SelectItem key={value} value={value}>
							{text}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</RowField>
	);

	const upload = (documentKey: string) => (
		<DocumentUpload
			studentId={studentId}
			panel="magang"
			documentKey={documentKey}
			canEdit={canEdit}
			onUploadSuccess={fetchInternshipData}
		/>
	);

	const grid = (cols: 2 | 3, children: React.ReactNode) => (
		<div
			className={`grid grid-cols-1 gap-3 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
		>
			{children}
		</div>
	);

	// Baris checklist standar (satu field boolean)
	const row = (
		key: string,
		label: string,
		desc: string,
		fields: React.ReactNode,
		uploadNode: React.ReactNode,
		warning?: string,
	) => (
		<ChecklistRow
			key={key}
			id={key}
			label={label}
			step={stepOf(key)}
			desc={desc}
			warning={warning}
			checked={isChecklistDone(key)}
			loading={loadingItem === key}
			disabled={!canEdit}
			onCheckedChange={(checked) => handleToggleField(key, checked)}
			upload={uploadNode}
		>
			{fields}
		</ChecklistRow>
	);

	// --- Grup 1: Seleksi ---
	const seleksiKeys = ["passportReady", "interviewReady"];
	// --- Grup 2: Alur Dokumen Taiwan (urutan baku) ---
	// Suhan (izin Biro Pariwisata Taiwan) hanya berlaku untuk tujuan Taiwan
	const isTaiwan = isTaiwanDestination(destinationCountry);
	const TAIWAN_STEPS: [string, string][] = [
		["mouReady", "MOU"],
		["loaConfirmed", "LOA"],
		["contractReady", "Kontrak"],
		...(isTaiwan ? ([["suhanReady", "Suhan"]] as [string, string][]) : []),
		["mcuReady", "MCU Full"],
		["visaReady", "Visa"],
		["ticketReady", "Tiket"],
	];
	const taiwanKeys = TAIWAN_STEPS.map(([k]) => k);
	// --- Grup 3: Keberangkatan ---
	const keberangkatanKeys = ["asesmenReady", "dokumentasiReady", "agenReady"];
	// --- Grup 4: Asuransi & Ahli Waris (wajib sebelum ACC) ---
	const asuransiAhliWarisKeys = [
		"asuransiBtnBpjsReady",
		"asuransiPenempatanReady",
		"ahliWarisReady",
	];
	const countDone = (keys: string[]) =>
		keys.filter((k) => isChecklistDone(k)).length;

	// Nomor langkah mengikuti daftar aktif, supaya tetap urut saat Suhan
	// tidak ditampilkan (tujuan non-Taiwan).
	const stepOf = (key: string) => {
		const idx = taiwanKeys.indexOf(key);
		return idx >= 0 ? idx + 1 : undefined;
	};

	// Peringatan (tidak mengunci): langkah dicentang padahal langkah sebelumnya belum
	const seqWarning = (key: string) => {
		const idx = taiwanKeys.indexOf(key);
		if (idx <= 0 || !isChecklistDone(key)) return undefined;
		const pending = TAIWAN_STEPS.slice(0, idx)
			.filter(([k]) => !isChecklistDone(k))
			.map(([, label]) => label);
		return pending.length
			? `Langkah sebelumnya belum selesai: ${pending.join(", ")}`
			: undefined;
	};

	// Pengingat termin pembayaran kampus ke agensi, tampil di antara langkah terkait
	const reminders = getAgencyPaymentReminders(data, destinationCountry);
	// Satu ringkasan tenang di atas daftar, tidak lagi menyela ritme langkah
	const reminderSummary = reminders.length ? (
		<section
			role="status"
			className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:px-6"
		>
			<p className="text-sm font-semibold text-amber-900">
				Pengingat pembayaran agensi
			</p>
			<ul className="mt-1 space-y-0.5 text-sm text-amber-900">
				{reminders.map((r) => (
					<li key={r.key}>{r.text}</li>
				))}
			</ul>
			<p className="mt-1 text-xs text-amber-800">
				Diproses &amp; dicatat oleh Finance — pantau statusnya di tab Pembayaran
				Lanjutan.
			</p>
		</section>
	) : null;

	return (
		<div className="space-y-6">
			{reminderSummary}

			<ChecklistGroup
				title="Seleksi"
				done={countDone(seleksiKeys)}
				total={seleksiKeys.length}
			>
				{row(
					"passportReady",
					"Paspor Resmi",
					"Scan paspor asli dengan masa berlaku minimal 18 bulan",
					grid(
						2,
						<>
							{textField("passportNo", "Nomor Paspor", "Contoh: A12345678")}
							{dateField("passportExp", "Masa Berlaku")}
						</>,
					),
					upload("passport"),
				)}

				{row(
					"interviewReady",
					"Wawancara User (Interview)",
					"Wawancara dengan hotel atau agent, bisa lebih dari satu kali. Otomatis tercentang jika ada yang Lulus.",
					<InterviewList
						studentId={studentId}
						canEdit={canEdit}
						onSaved={fetchInternshipData}
					/>,
					upload("interview"),
				)}
			</ChecklistGroup>

			<ChecklistGroup
				title={isTaiwan ? "Alur Dokumen Taiwan" : "Alur Dokumen Keberangkatan"}
				done={countDone(taiwanKeys)}
				total={taiwanKeys.length}
			>
				{/* MOU disinkronkan ke field lama MOA oleh server */}
				<ChecklistRow
					id="mouReady"
					label="MOU Kampus & Hotel Mitra"
					step={stepOf("mouReady")}
					desc="Nota kesepahaman kerja sama kampus dan hotel mitra."
					checked={isChecklistDone("mouReady")}
					loading={loadingItem === "mouReady" || loadingItem === "moaReady"}
					disabled={!canEdit}
					onCheckedChange={(checked) => {
						handleToggleField("mouReady", checked);
					}}
					upload={upload("mou")}
				>
					{grid(
						2,
						<>
							<RowField label="Tanggal Terbit MOU" htmlFor="f-mouDate">
								<Input
									id="f-mouDate"
									type="date"
									className={rowInputClass}
									value={toDateInput(data?.mouDate || data?.moaDate)}
									disabled={!canEdit}
									onChange={(e) => {
										handleLocalChange("mouDate", e.target.value);
										handleLocalChange("moaDate", e.target.value);
									}}
									onBlur={() => {
										handleBlurField("mouDate");
									}}
								/>
							</RowField>
							<RowField label="Catatan MOU" htmlFor="f-mouNotes">
								<Input
									id="f-mouNotes"
									placeholder="Catatan nomor / klausul MOU"
									className={rowInputClass}
									value={data?.mouNotes || data?.moaNotes || ""}
									disabled={!canEdit}
									onChange={(e) => {
										handleLocalChange("mouNotes", e.target.value);
										handleLocalChange("moaNotes", e.target.value);
									}}
									onBlur={() => {
										handleBlurField("mouNotes");
									}}
								/>
							</RowField>
						</>,
					)}
				</ChecklistRow>

				{row(
					"loaConfirmed",
					"Letter of Acceptance (LOA)",
					"Surat penerimaan dan konfirmasi penempatan resmi dari mitra industri / hotel",
					grid(2, dateField("loaDate", "Tanggal Konfirmasi LOA")),
					upload("loa"),
					seqWarning("loaConfirmed"),
				)}

				{row(
					"contractReady",
					"Kontrak Kerja Magang",
					"",
					grid(2, dateField("contractDate", "Tanggal Tanda Tangan Kontrak")),
					upload("contract"),
					seqWarning("contractReady"),
				)}

				{/* Suhan hanya untuk tujuan Taiwan */}
				{isTaiwan &&
					row(
						"suhanReady",
						"Suhan (Izin Magang Taiwan)",
						"Surat persetujuan magang dari Biro Pariwisata Taiwan",
						grid(
							3,
							<>
								{textField("suhanNo", "Nomor Izin Suhan", "Nomor izin Suhan")}
								{dateField("suhanDate", "Tanggal Terbit")}
								{textField("suhanNotes", "Catatan", "Keterangan perizinan")}
							</>,
						),
						upload("suhan"),
						seqWarning("suhanReady"),
					)}

				{row(
					"mcuReady",
					"Medical Check Up (MCU) Full",
					"Pemeriksaan kesehatan menyeluruh standar penempatan di RS/klinik rujukan",
					grid(
						3,
						<>
							{textField("mcuPlace", "Tempat / RS", "RS / Lab Klinik")}
							{dateField("mcuDate", "Tanggal MCU")}
							{selectField("mcuResult", "Hasil MCU", "fit", [
								["fit", "FIT (Layak)"],
								["unfit", "UNFIT (Tidak Layak)"],
							])}
						</>,
					),
					upload("mcu"),
					seqWarning("mcuReady"),
				)}

				{row(
					"visaReady",
					"Visa Kerja / Magang",
					"",
					grid(
						3,
						<>
							{textField("visaType", "Tipe Visa", "Internship / Work")}
							{textField("visaNo", "Nomor Visa", "No. Visa")}
							{selectField("visaStatus", "Status Visa", "process", [
								["approved", "Disetujui (Approved)"],
								["process", "Proses (Under Review)"],
								["reject", "Ditolak (Rejected)"],
							])}
						</>,
					),
					upload("visa"),
					seqWarning("visaReady"),
				)}

				{row(
					"ticketReady",
					"Tiket Keberangkatan",
					"",
					grid(
						3,
						<>
							{textField("ticketAirline", "Maskapai", "Garuda / AirAsia / dll")}
							{textField("ticketFlight", "No. Flight", "GA-880")}
							{dateField("ticketDate", "Tanggal Terbang")}
						</>,
					),
					upload("ticket"),
					seqWarning("ticketReady"),
				)}
			</ChecklistGroup>

			<ChecklistGroup
				title="Keberangkatan"
				done={countDone(keberangkatanKeys)}
				total={keberangkatanKeys.length}
			>
				{/* Asesmen disinkronkan ke field lama PDT oleh server */}
				<ChecklistRow
					id="asesmenReady"
					label="Asesmen & Pengarahan Keberangkatan"
					desc="Evaluasi kesiapan akhir, pembekalan budaya & SOP kerja, serta surat pernyataan keberangkatan (2 berkas)"
					checked={isChecklistDone("asesmenReady")}
					loading={loadingItem === "asesmenReady" || loadingItem === "pdtReady"}
					disabled={!canEdit}
					onCheckedChange={(checked) => {
						handleToggleField("asesmenReady", checked);
					}}
					upload={
						<>
							<div className="space-y-1">
								<p className="text-xs font-medium text-slate-600">
									Berkas 1: Hasil Asesmen & Pengarahan
								</p>
								{upload("asesmen_kompetensi")}
							</div>
							<div className="space-y-1">
								<p className="text-xs font-medium text-slate-600">
									Berkas 2: Surat Pernyataan Keberangkatan
								</p>
								{upload("surat_pernyataan_keberangkatan")}
							</div>
						</>
					}
				>
					{grid(
						3,
						<>
							{textField(
								"pdtPlace",
								"Tempat Asesmen",
								"Kampus / Balai Latihan",
							)}
							<RowField label="Tanggal Mulai" htmlFor="f-asesmenDate">
								<Input
									id="f-asesmenDate"
									type="date"
									className={rowInputClass}
									value={toDateInput(data?.asesmenDate || data?.pdtDate)}
									disabled={!canEdit}
									onChange={(e) => {
										handleLocalChange("asesmenDate", e.target.value);
										handleLocalChange("pdtDate", e.target.value);
									}}
									onBlur={() => {
										handleBlurField("asesmenDate");
									}}
								/>
							</RowField>
							{dateField("pdtEndDate", "Tanggal Selesai")}
						</>,
					)}
				</ChecklistRow>

				{row(
					"dokumentasiReady",
					"Dokumentasi Pelepasan & Bandara",
					"",
					textField(
						"dokumentasiKeberangkatanLink",
						"Link Dokumentasi (Google Drive / Cloud)",
						"https://drive.google.com/...",
					),
					upload("dokumentasi_keberangkatan"),
				)}

				<li
					className={`px-4 py-4 sm:px-6 transition-colors ${isChecklistDone("agenReady") ? "bg-emerald-50/60" : "bg-white"}`}
				>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div className="min-w-0 flex-1 space-y-2">
							<div className="flex flex-wrap items-center gap-2">
								<span className="text-sm font-semibold text-slate-900">
									Mitra Penempatan &amp; Dokumen Tambahan
								</span>
								<span
									className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
										isChecklistDone("agenReady")
											? "border-emerald-200 bg-emerald-100 text-emerald-800"
											: "border-amber-200 bg-amber-50 text-amber-800"
									}`}
								>
									{isChecklistDone("agenReady")
										? "Terverifikasi"
										: "Belum diverifikasi"}
								</span>
							</div>
							<p className="text-xs text-slate-500">
								Diisi satu kali di tab Penempatan (otomatis tersinkron ke sini).
							</p>
							<div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs sm:grid-cols-4">
								<div>
									<span className="block text-slate-500">
										Perusahaan / Hotel
									</span>
									<span className="font-medium text-slate-800">
										{data?.internshipCompany || "-"}
									</span>
								</div>
								<div>
									<span className="block text-slate-500">Kota Tujuan</span>
									<span className="font-medium text-slate-800">
										{data?.destinationCity || "-"}
									</span>
								</div>
								<div>
									<span className="block text-slate-500">Durasi</span>
									<span className="font-medium text-slate-800">
										{data?.internshipDuration || "-"}
									</span>
								</div>
								<div>
									<span className="block text-slate-500">Departemen</span>
									<span className="font-medium text-slate-800">
										{data?.agenPeminatan || "-"}
									</span>
								</div>
							</div>
						</div>
						{onOpenPenempatan && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onOpenPenempatan}
								className="h-9 shrink-0 border-blue-200 text-xs font-semibold text-[#0517B0] hover:bg-blue-50"
							>
								Atur di Tab Penempatan
							</Button>
						)}
					</div>
				</li>
			</ChecklistGroup>

			<ChecklistGroup
				title="Asuransi & Ahli Waris"
				done={countDone(asuransiAhliWarisKeys)}
				total={asuransiAhliWarisKeys.length}
			>
				{row(
					"asuransiBtnBpjsReady",
					"BPJS Ketenagakerjaan (BTN / Mandiri)",
					"Kepesertaan asuransi ketenagakerjaan Indonesia.",
					grid(
						2,
						<>
							{textField(
								"asuransiBtnBpjsNo",
								"Nomor KPJ / Polis",
								"Contoh: 24012345678",
							)}
							{dateField("asuransiBtnBpjsDate", "Tanggal Aktif")}
						</>,
					),
					upload("asuransi_btn_bpjs"),
				)}

				{row(
					"asuransiPenempatanReady",
					"Asuransi Kerja Penempatan",
					"Asuransi kecelakaan kerja lokal di negara tujuan.",
					grid(
						2,
						<>
							{textField(
								"asuransiPenempatanProvider",
								"Penyelenggara / Mitra",
								"Nama penyedia / mitra asuransi",
							)}
							{textField(
								"asuransiPenempatanNo",
								"Nomor Polis",
								"Contoh: TW-INS-2026-001",
							)}
							{dateField("asuransiPenempatanDate", "Tanggal Berlaku")}
						</>,
					),
					upload("asuransi_penempatan"),
				)}

				{row(
					"ahliWarisReady",
					"Ahli Waris Keluarga",
					"Identitas penerima santunan sesuai KK / Akta.",
					<div className="space-y-3">
						{canEdit && emergencyContact?.name && (
							<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2">
								<p className="text-xs text-slate-700">
									Kontak darurat PMB:{" "}
									<span className="font-semibold text-slate-900">
										{emergencyContact.name}
									</span>{" "}
									({emergencyContact.relation}
									{emergencyContact.phone ? ` · ${emergencyContact.phone}` : ""}
									)
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={isSaving}
									onClick={async () => {
										const patch = {
											ahliWarisNama: emergencyContact.name,
											ahliWarisHubungan: emergencyContact.relation,
											ahliWarisKontak: emergencyContact.phone || null,
										};
										handleLocalChange("ahliWarisNama", patch.ahliWarisNama);
										handleLocalChange(
											"ahliWarisHubungan",
											patch.ahliWarisHubungan,
										);
										handleLocalChange(
											"ahliWarisKontak",
											patch.ahliWarisKontak ?? "",
										);
										if (handleSaveFields) {
											await handleSaveFields(patch);
										}
									}}
									className="h-8 border-blue-200 bg-white text-xs font-semibold text-[#0517B0] hover:bg-blue-50"
								>
									Salin dari Kontak Darurat PMB
								</Button>
							</div>
						)}
						{grid(
							2,
							<>
								{textField(
									"ahliWarisNama",
									"Nama Ahli Waris",
									"Sesuai KTP / KK",
								)}
								{textField(
									"ahliWarisHubungan",
									"Hubungan",
									"Ayah / Ibu / Wali",
								)}
								{textField(
									"ahliWarisKontak",
									"No. HP / Rekening",
									"Contoh: 081234567890",
								)}
								{textField(
									"ahliWarisNotes",
									"Catatan SOP Mitra",
									"Catatan tambahan ahli waris",
								)}
							</>,
						)}
						<Collapsible defaultOpen={false}>
							<CollapsibleTrigger className="group inline-flex min-h-11 items-center gap-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40">
								Ketentuan ahli waris
								<ChevronDown className="size-3.5 transition-transform group-data-[panel-open]:rotate-180" />
							</CollapsibleTrigger>
							<CollapsibleContent>
								<p className="pb-1 text-xs leading-relaxed text-slate-500">
									Pencatatan ini hanya untuk acuan penyaluran santunan ke
									keluarga di Indonesia. Penetapan ahli waris merupakan ranah
									agensi asuransi dan hukum keluarga; kampus tidak
									menandatangani surat penetapan ahli waris.
								</p>
							</CollapsibleContent>
						</Collapsible>
					</div>,
					upload("surat_keterangan_ahli_waris"),
				)}
			</ChecklistGroup>

			<OptionalGroup title="Sertifikasi Bahasa Asing">
				{row(
					"languageCertReady",
					"Sertifikasi Bahasa Asing",
					"Sertifikasi bahasa kerja (TOEIC / JLPT / TOPIK / TOCFL) menjelang keberangkatan",
					grid(
						3,
						<>
							{selectField("languageCertName", "Jenis Sertifikasi", "TOEIC", [
								["TOEIC", "TOEIC (English)"],
								["JLPT", "JLPT (Jepang)"],
								["Topik", "TOPIK (Korea)"],
								["TOCFL", "TOCFL (Mandarin)"],
								["Lainnya", "Lainnya"],
							])}
							{dateField("languageCertDate", "Tanggal Tes / Lulus")}
							{textField(
								"languageCertScore",
								"Skor / Hasil",
								"Contoh: 650 / N3 / Level 2",
							)}
						</>,
					),
					upload("sertifikasi_bahasa"),
				)}
			</OptionalGroup>

			{/* Catatan internal divisi */}
			<section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-3">
				<div className="flex items-center justify-between gap-3">
					<label
						htmlFor="magang-notes"
						className="text-sm sm:text-base font-bold text-slate-900"
					>
						Catatan Divisi Magang
					</label>
					{canEdit && (
						<Button
							size="sm"
							onClick={handleSaveNotes}
							disabled={isSaving}
							className="h-9 bg-[#0517B0] hover:bg-blue-800 text-white text-sm font-semibold"
						>
							{isSaving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
							Simpan Catatan
						</Button>
					)}
				</div>
				<Textarea
					id="magang-notes"
					value={notes}
					disabled={!canEdit}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Catatan koordinasi, kendala visa, atau catatan khusus keberangkatan mahasiswa..."
					className="min-h-[96px] text-sm bg-white resize-none"
				/>
			</section>
		</div>
	);
}
