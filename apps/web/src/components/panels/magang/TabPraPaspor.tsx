"use client";

import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { BerkasAkademikBaak } from "./BerkasAkademikBaak";
import { ChecklistGroup, ChecklistRow } from "./ChecklistRow";

interface TabPraPasporProps {
	studentId: number;
	data: Record<string, unknown> | null;
	passportClearance: { isGapYear?: boolean } | null;
	canEdit: boolean;
	loadingItem?: string | null;
	handleToggleField: (field: string, value: unknown) => Promise<void> | void;
	fetchInternshipData: () => Promise<void>;
}

export function TabPraPaspor({
	studentId,
	data,
	passportClearance,
	canEdit,
	loadingItem = null,
	handleToggleField,
	fetchInternshipData,
}: TabPraPasporProps) {
	// Berkas Pra-Paspor Legalitas & Identitas (Segmen 19: SL-21 Hong Ta, Gap Year Flamboyan, LOS/SKMA Aktif)
	const docItems = [
		{
			label: "1. Pas Foto Terbaru",
			key: "praPasporPasFoto",
			docKey: "pas_foto",
		},
		{
			label: "2. Kartu Tanda Mahasiswa (KTM)",
			key: "praPasporKtm",
			docKey: "ktm",
		},
		{
			label: "3. Scan e-KTP",
			key: "praPasporKtp",
			docKey: "ktp",
		},
		{
			label: "4. Scan Kartu Keluarga (KK)",
			key: "praPasporKk",
			docKey: "kk",
		},
		{
			label: "5. Scan Akta Kelahiran",
			key: "praPasporAktaKelahiran",
			docKey: "akta_kelahiran",
		},
		{
			label: "6. Surat Izin Orang Tua / Wali",
			key: "praPasporSuratIzinOrtu",
			docKey: "surat_izin_ortu",
			badge: { text: "Bermaterai" },
		},
		{
			label: "7. Surat Pernyataan Usia >21 Tahun (SL-21)",
			key: "praPasporSl21",
			docKey: "sl21",
			badge: {
				text: "Khusus Mitra Hong Ta",
				className: "bg-indigo-50 text-indigo-700 border-indigo-200",
			},
			desc: "Bermaterai.",
		},
		{
			label: "8. Surat Keterangan Riwayat Gap Year",
			key: "praPasporGapYear",
			docKey: "gap_year",
			badge: {
				text: "Khusus Mitra Flamboyan",
				className: "bg-amber-50 text-amber-800 border-amber-200",
			},
			desc: "Keterangan aktivitas & kelulusan masa gap year, bermaterai.",
		},
		{
			label: "9. Letter of Student (LOS / SKMA Aktif)",
			key: "praPasporSkma",
			docKey: "los",
			badge: {
				text: "Wajib Imigrasi & Industri",
				className: "bg-emerald-50 text-emerald-700 border-emerald-200",
			},
			desc: "Bertandatangan pimpinan kampus.",
		},
		{
			label: "10. Surat Rekomendasi Disdik",
			key: "praPasporRekomendasiDisdik",
			docKey: "rekomendasi_disdik",
		},
		{
			label: "11. Ijazah Pendidikan Terakhir",
			key: "praPasporIjazah",
			docKey: "ijazah",
			badge: { text: "Asli / legalisir" },
		},
	];

	// Gap Year hanya wajib (dan ditampilkan) untuk mahasiswa gap year — sama dengan aturan ACC server
	const isGapYear = Boolean(passportClearance?.isGapYear);
	const visibleItems = docItems.filter(
		(item) => item.key !== "praPasporGapYear" || isGapYear,
	);
	// SKMA dianggap lengkap bila SKMA atau LOS tercentang (aturan server)
	const isDone = (key: string) =>
		key === "praPasporSkma"
			? Boolean(data?.praPasporSkma || data?.praPasporLos)
			: Boolean(data?.[key]);
	const completedCount = visibleItems.filter((item) => isDone(item.key)).length;

	return (
		<div className="space-y-4">
			<ChecklistGroup
				title="Berkas Pra-Paspor"
				done={completedCount}
				total={visibleItems.length}
			>
				{visibleItems.map((item) => (
					<ChecklistRow
						key={item.key}
						id={item.key}
						label={item.label.replace(/^\d+\.\s*/, "")}
						desc={item.desc}
						tag={item.badge?.text}
						checked={isDone(item.key)}
						loading={loadingItem === item.key}
						disabled={!canEdit}
						onCheckedChange={(checked) => {
							handleToggleField(item.key, checked);
							// Server menyinkronkan LOS↔SKMA; samakan juga state lokal agar centang bisa dilepas
							if (
								item.key === "praPasporSkma" &&
								!checked &&
								data?.praPasporLos
							)
								handleToggleField("praPasporLos", false);
						}}
						upload={
							<DocumentUpload
								studentId={studentId}
								panel="magang"
								documentKey={item.docKey}
								canEdit={canEdit}
								onUploadSuccess={fetchInternshipData}
							/>
						}
					/>
				))}
			</ChecklistGroup>

			<BerkasAkademikBaak
				studentId={studentId}
				data={data}
				canEdit={canEdit}
				fetchInternshipData={fetchInternshipData}
			/>
		</div>
	);
}
