"use client";

import { ChevronDown, Loader2 } from "lucide-react";
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

/** Field form Detail Penempatan — disimpan bersama lewat satu tombol. */
const PENEMPATAN_FIELDS = [
	"mitraPenempatanNama",
	"internshipCompany",
	"agenNegaraTujuan",
	"destinationCity",
	"internshipDuration",
	"agenPeminatan",
	"estDepartureDate",
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
						Detail Penempatan
					</h3>
				</div>

				<div className="space-y-6 p-4 sm:p-6">
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

					<div className="space-y-3">
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

			{/* Verifikasi (field yang sama dengan "Mitra Penempatan" di Dokumen Keberangkatan) */}
			<ChecklistGroup
				title="Verifikasi Penempatan"
				done={isVerified ? 1 : 0}
				total={1}
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
