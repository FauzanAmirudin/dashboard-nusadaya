"use client";

import { ChevronDown, Info, Loader2, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
	ChecklistGroup,
	ChecklistRow,
	RowField,
	rowInputClass,
	toDateInput,
} from "./ChecklistRow";

/** Field form Detail Penempatan & Ahli Waris — disimpan bersama lewat satu tombol. */
const PENEMPATAN_FIELDS = [
	"mitraPenempatanNama",
	"internshipCompany",
	"agenNegaraTujuan",
	"destinationCity",
	"internshipDuration",
	"agenPeminatan",
	"estDepartureDate",
	// Pencatatan Ahli Waris & Asuransi Santunan Musibah (Segmen 22, 23, 24)
	"ahliWarisNama",
	"ahliWarisHubungan",
	"ahliWarisNik",
	"ahliWarisPhone",
	"ahliWarisAlamat",
	"ahliWarisBank",
	"ahliWarisRekening",
	"ahliWarisAtasNama",
	"asuransiPolisNo",
] as const;

interface TabPenempatanProps {
	studentId: number;
	data: Record<string, unknown> | null;
	canEdit: boolean;
	loadingItem?: string | null;
	handleToggleField: (field: string, value: unknown) => Promise<void> | void;
	handleLocalChange: (field: string, value: unknown) => void;
	handleSaveFields: (patch: Record<string, unknown>) => Promise<boolean>;
	isSaving: boolean;
	fetchInternshipData: () => Promise<void>;
}

export function TabPenempatan({
	studentId,
	data,
	canEdit,
	loadingItem = null,
	handleToggleField,
	handleLocalChange,
	handleSaveFields,
	isSaving,
	fetchInternshipData,
}: TabPenempatanProps) {
	const isVerified = Boolean(data?.agenReady);
	const isLoading = loadingItem === "agenReady";

	// 5 Departemen Utama Perhotelan sesuai mandat Notula Segmen 21
	const DEPARTEMEN_OPTIONS = [
		{ value: "HK", label: "HK — Housekeeping (Tata Graha)" },
		{ value: "FBS", label: "FBS — Food & Beverage Service (Layanan Restoran)" },
		{
			value: "FBP",
			label: "FBP — Food & Beverage Product (Tata Boga & Dapur)",
		},
		{ value: "FO", label: "FO — Front Office (Kantor Depan & Tamu)" },
		{ value: "Barista", label: "Barista — Spesialis Kopi & Minuman" },
	];

	const DURASI_OPTIONS = [
		"6 Bulan",
		"12 Bulan (1 Tahun)",
		"18 Bulan",
		"24 Bulan (2 Tahun)",
	];

	const NEGARA_OPTIONS = [
		"Taiwan",
		"Malaysia",
		"Jepang",
		"Timur Tengah",
		"Lainnya",
	];

	const HUBUNGAN_OPTIONS = [
		{ value: "Orang Tua (Ayah)", label: "Orang Tua (Ayah Kandung)" },
		{ value: "Orang Tua (Ibu)", label: "Orang Tua (Ibu Kandung)" },
		{ value: "Suami / Istri", label: "Suami / Istri Sah" },
		{ value: "Anak Kandung", label: "Anak Kandung" },
		{ value: "Kakak Kandung", label: "Kakak Kandung" },
		{ value: "Adik Kandung", label: "Adik Kandung" },
		{ value: "Wali Sah", label: "Wali Sah / Keluarga Lainnya" },
	];

	const BANK_OPTIONS = [
		{ value: "BCA", label: "Bank Central Asia (BCA)" },
		{ value: "Mandiri", label: "Bank Mandiri" },
		{ value: "BRI", label: "Bank Rakyat Indonesia (BRI)" },
		{ value: "BNI", label: "Bank Negara Indonesia (BNI)" },
		{ value: "BSI", label: "Bank Syariah Indonesia (BSI)" },
		{ value: "BTN", label: "Bank Tabungan Negara (BTN)" },
		{ value: "CIMB", label: "Bank CIMB Niaga" },
		{ value: "Lainnya", label: "Bank Lainnya" },
	];

	// Perubahan ditahan di state sampai tombol Simpan ditekan. Nilai kosong tampil sebagai
	// placeholder, bukan nilai bawaan palsu yang belum pernah tersimpan.
	const selectField = (
		field: string,
		label: string,
		options: { value: string; label: string }[],
	) => (
		<RowField label={label}>
			<Select
				value={(data?.[field] as string) || ""}
				disabled={!canEdit}
				onValueChange={(val) => handleLocalChange(field, val)}
			>
				<SelectTrigger className={`w-full ${rowInputClass}`}>
					<SelectValue placeholder={`Pilih ${label}`} />
				</SelectTrigger>
				<SelectContent>
					{options.map((o) => (
						<SelectItem key={o.value} value={o.value}>
							{o.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</RowField>
	);

	const textField = (field: string, label: string, placeholder: string) => (
		<RowField label={label} htmlFor={`f-${field}`}>
			<Input
				id={`f-${field}`}
				placeholder={placeholder}
				className={rowInputClass}
				value={(data?.[field] as string) || ""}
				disabled={!canEdit}
				onChange={(e) => handleLocalChange(field, e.target.value)}
			/>
		</RowField>
	);

	const asOptions = (list: string[]) =>
		list.map((v) => ({ value: v, label: v }));

	// Nilai sekarang, dinormalkan agar bisa dibandingkan apa adanya.
	// Tanggal selalu dibaca sebagai "YYYY-MM-DD": server mengembalikan Date,
	// sedangkan input mengisi string — tanpa ini keduanya selalu dianggap beda.
	const readField = (key: string) =>
		key === "estDepartureDate"
			? toDateInput(data?.[key])
			: ((data?.[key] as string | null | undefined) ?? "");

	const current = PENEMPATAN_FIELDS.reduce<Record<string, string>>(
		(acc, key) => {
			acc[key] = readField(key);
			return acc;
		},
		{},
	);
	const currentKey = JSON.stringify(current);

	// Cuplikan nilai terakhir yang tersimpan, untuk tahu apakah ada perubahan
	const [saved, setSaved] = useState<string | null>(null);
	useEffect(() => {
		// Isi cuplikan sekali saat data pertama kali tersedia
		if (saved === null && data) setSaved(JSON.stringify(current));
		// currentKey cukup sebagai penanda isi; `current` berganti identitas tiap render
	}, [data, saved, currentKey]);

	const isDirty = saved !== null && currentKey !== saved;

	const handleSave = async () => {
		const patch = PENEMPATAN_FIELDS.reduce<Record<string, unknown>>(
			(acc, key) => {
				acc[key] = current[key] === "" ? null : current[key];
				return acc;
			},
			{},
		);
		const ok = await handleSaveFields(patch);
		if (ok) setSaved(currentKey);
	};

	return (
		<div className="space-y-6">
			<section className="rounded-xl border border-slate-200 bg-white">
				<div className="border-b border-slate-200 px-4 py-3 sm:px-6">
					<h3 className="text-sm font-semibold text-slate-900 sm:text-base">
						Detail Penempatan &amp; Mitra Magang
					</h3>
				</div>

				<div className="space-y-6 p-4 sm:p-6">
					{/* 1. Mitra & Lokasi */}
					<div className="space-y-3">
						<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
							Mitra &amp; Lokasi
						</p>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
							{/* Mitra disimpan juga ke internshipCompany (kompatibilitas data) */}
							<RowField
								label="Mitra Penempatan"
								htmlFor="f-mitraPenempatanNama"
							>
								<Input
									id="f-mitraPenempatanNama"
									placeholder="Contoh: Hong Ta / Flamboyan / MBM"
									className={rowInputClass}
									value={(data?.mitraPenempatanNama as string) || ""}
									disabled={!canEdit}
									onChange={(e) =>
										handleLocalChange("mitraPenempatanNama", e.target.value)
									}
								/>
							</RowField>

							<RowField
								label="Nama Hotel / Perusahaan"
								htmlFor="f-internshipCompany"
							>
								<Input
									id="f-internshipCompany"
									placeholder="Contoh: Grand Hyatt Taipei"
									className={rowInputClass}
									value={(data?.internshipCompany as string) || ""}
									disabled={!canEdit}
									onChange={(e) =>
										handleLocalChange("internshipCompany", e.target.value)
									}
								/>
							</RowField>

							{selectField(
								"agenNegaraTujuan",
								"Negara Tujuan",
								asOptions(NEGARA_OPTIONS),
							)}

							<RowField label="Kota Tujuan" htmlFor="f-destinationCity">
								<Input
									id="f-destinationCity"
									placeholder="Contoh: Taipei / Taichung / KL"
									className={rowInputClass}
									value={(data?.destinationCity as string) || ""}
									disabled={!canEdit}
									onChange={(e) =>
										handleLocalChange("destinationCity", e.target.value)
									}
								/>
							</RowField>
						</div>
					</div>

					{/* 2. Jadwal & Posisi */}
					<div className="space-y-3 border-t border-slate-100 pt-5">
						<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
							Jadwal &amp; Posisi
						</p>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{selectField(
								"internshipDuration",
								"Durasi Magang",
								asOptions(DURASI_OPTIONS),
							)}

							{selectField("agenPeminatan", "Departemen", DEPARTEMEN_OPTIONS)}

							<RowField
								label="Estimasi Tanggal Terbang"
								htmlFor="f-estDepartureDate"
							>
								<Input
									id="f-estDepartureDate"
									type="date"
									className={rowInputClass}
									value={toDateInput(data?.estDepartureDate)}
									disabled={!canEdit}
									onChange={(e) =>
										handleLocalChange("estDepartureDate", e.target.value)
									}
								/>
							</RowField>
						</div>
					</div>

					{/* 3. SEGMEN 22 & 23: Pencatatan Ahli Waris & Asuransi Santunan Musibah */}
					<div className="space-y-4 border-t border-slate-200 pt-6">
						<div>
							<div className="flex items-center gap-2">
								<ShieldAlert className="size-4.5 text-[#0517B0]" />
								<p className="text-xs font-bold uppercase tracking-wider text-[#0517B0]">
									Pencatatan Ahli Waris &amp; Asuransi Musibah (SOP Hong Ta /
									Mitra Penempatan)
								</p>
							</div>
							<p className="mt-1 text-xs text-slate-600">
								Pencatatan identitas keluarga dan rekening penyaluran santunan
								bila terjadi musibah sakit/kecelakaan di luar negeri.
							</p>
						</div>

						{/* Disclaimer Batas Tanggung Jawab Kampus (Notula Segmen 22 & 23) */}
						<div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 sm:p-4 text-xs text-blue-900 space-y-1">
							<div className="flex items-center gap-1.5 font-bold text-blue-950">
								<Info className="size-4 shrink-0 text-[#0517B0]" />
								<span>Batas Tanggung Jawab &amp; Kebijakan Kampus</span>
							</div>
							<p className="leading-relaxed text-blue-900/90 pl-5.5">
								Pencatatan identitas ahli waris ini berfungsi semata-mata
								sebagai referensi resmi administrasi bagi kampus untuk
								meneruskan informasi kepada pihak agensi luar negeri (seperti
								Hong Ta) dan lembaga asuransi bila terjadi musibah. Kampus{" "}
								<strong>
									tidak bertindak sebagai penjamin penetapan hak waris perdata
								</strong>{" "}
								dan dibebaskan dari segala tuntutan atau perselisihan pembagian
								waris internal keluarga.
							</p>
						</div>

						{/* Form Data Ahli Waris */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
							{textField(
								"ahliWarisNama",
								"Nama Lengkap Ahli Waris",
								"Nama orang tua / wali sah",
							)}
							{selectField(
								"ahliWarisHubungan",
								"Hubungan Keluarga",
								HUBUNGAN_OPTIONS,
							)}
							{textField(
								"ahliWarisNik",
								"NIK KTP Ahli Waris",
								"16 digit NIK KTP",
							)}
							{textField(
								"ahliWarisPhone",
								"No. HP / WhatsApp",
								"Contoh: 081234567890",
							)}
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{textField(
								"ahliWarisAlamat",
								"Alamat Domisili Ahli Waris",
								"Alamat lengkap tempat tinggal ahli waris di Indonesia",
							)}
							{textField(
								"asuransiPolisNo",
								"Nomor Polis / Sertifikat Asuransi",
								"No. polis perlindungan kerja / Hong Ta",
							)}
						</div>

						{/* Form Rekening Penyaluran Santunan */}
						<div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
							<p className="text-xs font-semibold text-slate-800">
								Rekening Bank Penyaluran Hak Santunan (Keluarga di Indonesia)
							</p>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
								{selectField("ahliWarisBank", "Nama Bank", BANK_OPTIONS)}
								{textField(
									"ahliWarisRekening",
									"Nomor Rekening",
									"Nomor rekening bank aktif",
								)}
								{textField(
									"ahliWarisAtasNama",
									"Nama Pemilik Rekening",
									"Harus selaras nama ahli waris",
								)}
							</div>
						</div>

						{/* Slot Berkas Unggahan: Surat Pernyataan Ahli Waris */}
						<div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 space-y-2">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div>
									<p className="text-xs font-semibold text-slate-800">
										Unggah Surat Pernyataan Penetapan Ahli Waris (Bermaterai)
									</p>
									<p className="text-[11px] text-slate-500">
										Surat pernyataan penunjukan resmi bertandatangan mahasiswa
										dan orang tua/keluarga di atas materai Rp 10.000.
									</p>
								</div>
								<div className="shrink-0">
									<DocumentUpload
										studentId={studentId}
										panel="magang"
										documentKey="surat_ahli_waris"
										canEdit={canEdit}
										onUploadSuccess={fetchInternshipData}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
						{isDirty && (
							<p role="status" className="text-xs font-medium text-amber-700">
								Belum disimpan
							</p>
						)}
						<Button
							type="button"
							onClick={handleSave}
							disabled={!canEdit || !isDirty || isSaving}
							className="h-11 w-full gap-1.5 bg-[#0517B0] px-5 text-sm font-bold text-white hover:bg-blue-800 sm:w-auto"
						>
							{isSaving && <Loader2 className="size-4 animate-spin" />}
							{isSaving ? "Menyimpan..." : "Simpan Perubahan"}
						</Button>
					</div>
				</div>
			</section>

			{/* Verifikasi (Penempatan & SOP Asuransi / Ahli Waris) */}
			<ChecklistGroup
				title="Verifikasi Penempatan & Asuransi SOP Hong Ta"
				done={
					(isVerified ? 1 : 0) +
					(data?.ahliWarisReady ? 1 : 0) +
					(data?.asuransiHongTaReady ? 1 : 0)
				}
				total={3}
			>
				<ChecklistRow
					id="tabPenempatan-agenReady"
					label="Mitra penempatan & lokasi magang sudah diverifikasi"
					desc="Kuota dan departemen hotel sudah dikonfirmasi."
					checked={isVerified}
					loading={isLoading}
					disabled={!canEdit}
					onCheckedChange={(checked) => handleToggleField("agenReady", checked)}
				/>
				<ChecklistRow
					id="tabPenempatan-ahliWarisReady"
					label="Identitas & Berkas Penetapan Ahli Waris Lengkap"
					desc="Keluarga telah menetapkan ahli waris & rekening penyaluran santunan bermaterai tanpa membebani kampus."
					checked={Boolean(data?.ahliWarisReady)}
					loading={loadingItem === "ahliWarisReady"}
					disabled={!canEdit}
					onCheckedChange={(checked) =>
						handleToggleField("ahliWarisReady", checked)
					}
				/>
				<ChecklistRow
					id="tabPenempatan-asuransiHongTaReady"
					label="SOP Asuransi Hong Ta / Perlindungan Kerja Dikonfirmasi"
					desc="Skema asuransi kecelakaan/kesehatan kerja luar negeri telah diverifikasi bersama mitra penempatan."
					checked={Boolean(data?.asuransiHongTaReady)}
					loading={loadingItem === "asuransiHongTaReady"}
					disabled={!canEdit}
					onCheckedChange={(checked) =>
						handleToggleField("asuransiHongTaReady", checked)
					}
				/>
			</ChecklistGroup>

			{/* Sekunder: hanya sebagian mitra memintanya — dilipat agar tidak menyita perhatian */}
			<Collapsible className="overflow-hidden rounded-xl border border-slate-200 bg-white">
				<CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0517B0]/40 sm:px-6">
					<span className="text-sm font-semibold text-slate-700">
						Dokumen Tambahan dari Mitra
						<span className="ml-2 font-normal text-slate-500">
							opsional, sebelum visa
						</span>
					</span>
					<ChevronDown className="size-4 shrink-0 text-slate-500 transition-transform group-data-[panel-open]:rotate-180" />
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="space-y-3 border-t border-slate-200 p-4 sm:p-6">
						<p className="text-xs text-slate-500">
							Misalnya Surat Tunda Wisuda (Postpone Graduation), Landing Permit,
							atau Surat Pernyataan Lembaga.
						</p>
						<DocumentUpload
							studentId={studentId}
							panel="magang"
							documentKey="dokumen_tambahan_mitra"
							canEdit={canEdit}
							onUploadSuccess={fetchInternshipData}
						/>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
