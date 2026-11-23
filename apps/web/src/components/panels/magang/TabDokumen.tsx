"use client";

import { Loader2 } from "lucide-react";
import type React from "react";
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

interface TabDokumenProps {
	studentId: number;
	data: any;
	destinationCountry?: string | null;
	canEdit: boolean;
	loadingItem?: string | null;
	handleToggleField: (field: string, value: any) => Promise<void> | void;
	handleLocalChange: (field: string, value: any) => void;
	handleBlurField: (field: string) => Promise<void> | void;
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
				Catat di tab Pembayaran Lanjutan.
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
					"Wawancara dengan hotel atau agent, bisa lebih dari satu kali. Centang bila sudah lolos.",
					<InterviewList studentId={studentId} canEdit={canEdit} />,
					upload("interview"),
				)}
			</ChecklistGroup>

			<ChecklistGroup
				title={isTaiwan ? "Alur Dokumen Taiwan" : "Alur Dokumen Keberangkatan"}
				done={countDone(taiwanKeys)}
				total={taiwanKeys.length}
			>
				{/* MOU disimpan ganda ke field lama MOA (kompatibilitas data) */}
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
						handleToggleField("moaReady", checked);
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
										handleBlurField("moaDate");
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
										handleBlurField("moaNotes");
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
				{/* Asesmen disimpan ganda ke field lama PDT (kompatibilitas data) */}
				<ChecklistRow
					id="asesmenReady"
					label="Asesmen & Pengarahan Keberangkatan"
					desc="Evaluasi kesiapan akhir, pembekalan budaya & SOP kerja, serta surat pernyataan keberangkatan (2 berkas)"
					checked={isChecklistDone("asesmenReady")}
					loading={loadingItem === "asesmenReady" || loadingItem === "pdtReady"}
					disabled={!canEdit}
					onCheckedChange={(checked) => {
						handleToggleField("asesmenReady", checked);
						handleToggleField("pdtReady", checked);
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
										handleBlurField("pdtDate");
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

				{row(
					"agenReady",
					"Mitra Penempatan & Dokumen Tambahan",
					"",
					grid(
						2,
						<>
							{textField(
								"internshipCompany",
								"Perusahaan Magang",
								"Nama Hotel / Resto",
							)}
							{textField(
								"destinationCity",
								"Kota Tujuan",
								"Kuala Lumpur / Taipei / dll",
							)}
							{textField(
								"internshipDuration",
								"Durasi Magang",
								"6 Bulan / 1 Tahun",
							)}
							{textField(
								"agenPeminatan",
								"Peminatan / Posisi",
								"Hospitality / Barista",
							)}
						</>,
					),
					upload("mitra_agen"),
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
