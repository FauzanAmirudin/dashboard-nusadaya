import { join } from "node:path";

/**
 * Peta label ramah-baca untuk setiap documentKey di seluruh panel & tab sistem.
 */
export const DOCUMENT_KEY_LABELS: Record<string, string> = {
	// Identitas & PMB
	profile_photo: "Foto_Profil",
	formulir_masuk: "Formulir_Masuk",
	formulir_pendaftaran: "Formulir_Pendaftaran",
	pas_foto: "Pas_Foto",
	ktm: "Kartu_Tanda_Mahasiswa",
	ktp: "Scan_eKTP",
	kk: "Kartu_Keluarga",
	akta_kelahiran: "Akta_Kelahiran",
	ijazah: "Ijazah_Terakhir",
	transkrip: "Transkrip_Nilai",
	cv: "Curriculum_Vitae",
	skbm: "SKBM_Bebas_Narkoba",
	pre_mcu: "Pra_MCU",
	mcu: "MCU_Full",
	bpjs: "BPJS_Kesehatan",
	sla: "Service_Level_Agreement",
	sertifikasi_bahasa: "Sertifikasi_Bahasa",
	surat_izin_ortu: "Surat_Izin_Orang_Tua",
	sl21: "Surat_Usia_SL21_HongTa",
	skma: "Surat_Keterangan_Mahasiswa_Aktif",
	los: "Letter_of_Student_LOS",
	rekomendasi_disdik: "Surat_Rekomendasi_Disdik",
	gap_year: "Surat_Keterangan_Gap_Year",
	passport_depan: "Paspor_Halaman_Depan",
	passport_visa: "Paspor_Halaman_Visa",

	// CRM
	ods_report: "Laporan_ODS",
	ods_1_report: "Laporan_ODS_1",
	ods_2_report: "Laporan_ODS_2",
	ods_3_report: "Laporan_ODS_3",
	ods_4_report: "Laporan_ODS_4",
	ods_5_report: "Laporan_ODS_5",
	ods_1: "Laporan_ODS_1",
	ods_2: "Laporan_ODS_2",
	ods_3: "Laporan_ODS_3",
	ods_4: "Laporan_ODS_4",
	ods_5: "Laporan_ODS_5",
	ods_documentation: "Dokumentasi_ODS",
	pramagang: "Dokumen_Pra_Magang",
	pramagang_report: "Laporan_Pra_Magang",
	pramagang_documentation: "Dokumentasi_Pra_Magang",
	tri_dharma_report: "Laporan_Tri_Dharma",
	tri_dharma_pkm_report: "Laporan_Tri_Dharma_PKM",
	tri_dharma_penelitian_report: "Laporan_Tri_Dharma_Penelitian",
	tri_dharma_documentation: "Dokumentasi_Tri_Dharma",
	study_permit: "Surat_Izin_Belajar",
	monitoring_parent: "Monitoring_Orang_Tua",
	monitoring_industry: "Monitoring_Industri",

	// Finance
	registrasi: "Bukti_Bayar_Registrasi",
	mandiri_interview: "Bukti_Bayar_Interview_Mandiri",
	mandiri_kontrak_magang: "Bukti_Bayar_Kontrak_Magang",
	kontrak_magang: "Bukti_Bayar_Kontrak_Magang",
	mandiri_suhan: "Bukti_Bayar_Suhan",
	suhan: "Dokumen_Suhan",
	t1_interview: "Bukti_Bayar_Talangan_Tahap_1",
	mandiri_keberangkatan: "Bukti_Bayar_Keberangkatan_Mandiri",
	penempatan_keberangkatan: "Bukti_Bayar_Penempatan_Keberangkatan",
	t2_keberangkatan: "Bukti_Bayar_Talangan_Tahap_2",
	admin_talangan: "Bukti_Bayar_Admin_Talangan",
	toeic: "Bukti_Bayar_TOEIC",
	paspor: "Bukti_Bayar_Paspor",
	rumah_juang: "Bukti_Bayar_Rumah_Juang",
	semester_1_inst: "Bukti_Cicilan_Semester_1",

	// Akademik & PA & Keputusan Final
	pddikti_input: "Bukti_Input_PDDIKTI",
	uts_passed: "Bukti_Lulus_UTS",
	uas_passed: "Bukti_Lulus_UAS",
	attitude_indicator: "Penilaian_Sikap",
	assignments_completed: "Bukti_Penyelesaian_Tugas",
	academic_communication: "Bukti_Komunikasi_Akademik",
	khs: "Kartu_Hasil_Studi_KHS",
	krs: "Kartu_Rencana_Studi_KRS",
	product_photo: "Foto_Produk_Praktik",
	departure_assessment: "Hasil_Asesmen_Keberangkatan",
	sk_direktur: "SK_Direktur_Kelulusan",
	taiwan_pas_foto: "Taiwan_Pas_Foto",
	taiwan_cv: "Taiwan_CV",
	taiwan_ktm: "Taiwan_KTM",
	taiwan_khs: "Taiwan_KHS",
	taiwan_sl21: "Taiwan_SL21",
	taiwan_aktif: "Taiwan_Surat_Aktif",
	taiwan_gap_year: "Taiwan_Gap_Year",
	taiwan_ijazah: "Taiwan_Ijazah",
	taiwan_surat_ortu: "Taiwan_Surat_Izin_Ortu",
	taiwan_kk: "Taiwan_KK",
	taiwan_ktp: "Taiwan_KTP",
	taiwan_akta: "Taiwan_Akta_Kelahiran",
	counseling: "Bukti_Konseling_PA",
	mental: "Evaluasi_Mental_PA",
	discipline: "Evaluasi_Kedisiplinan_PA",

	// Magang & Post-Internship
	passport: "Scan_Paspor_Resmi",
	interview: "Bukti_Wawancara_User",
	mou: "MOU_Kampus_Hotel_Mitra",
	loa: "Letter_of_Acceptance_LOA",
	contract: "Kontrak_Kerja_Magang",
	visa: "Visa_Kerja_Magang",
	ticket: "Tiket_Keberangkatan",
	asesmen_kompetensi: "Hasil_Asesmen_Kompetensi",
	surat_pernyataan_keberangkatan: "Surat_Pernyataan_Keberangkatan",
	dokumentasi_keberangkatan: "Dokumentasi_Keberangkatan",
	mitra_agen: "Dokumen_Mitra_Penempatan",
	surat_ahli_waris: "Surat_Pernyataan_Ahli_Waris",
	dokumen_tambahan_mitra: "Dokumen_Tambahan_Mitra",
	agen_dp: "Bukti_DP_Agensi",
	agen_pelunasan: "Bukti_Pelunasan_Agensi",
	logbook: "Logbook_Harian_Magang",
	laporan_akhir: "Laporan_Akhir_Magang",
	video_portofolio: "Video_Portofolio_Magang",
};

const MAGANG_PRA_PASPOR_KEYS = new Set([
	"pas_foto",
	"ktm",
	"ktp",
	"kk",
	"akta_kelahiran",
	"surat_izin_ortu",
	"sl21",
	"gap_year",
	"los",
	"skma",
	"rekomendasi_disdik",
	"ijazah",
	"khs",
	"krs",
	"transkrip",
	"cv",
]);

const MAGANG_PENEMPATAN_KEYS = new Set([
	"surat_ahli_waris",
	"dokumen_tambahan_mitra",
	"mitra_agen",
]);

const MAGANG_DOKUMEN_KEBERANGKATAN_KEYS = new Set([
	"passport",
	"interview",
	"mou",
	"loa",
	"contract",
	"suhan",
	"mcu",
	"visa",
	"ticket",
	"asesmen_kompetensi",
	"surat_pernyataan_keberangkatan",
	"dokumentasi_keberangkatan",
	"sertifikasi_bahasa",
]);

const MAGANG_SYARAT_AKHIR_KEYS = new Set([
	"logbook",
	"laporan_akhir",
	"video_portofolio",
]);

/**
 * Sanitasi segmen nama folder/file agar aman di Windows & Linux (POSIX).
 */
export function sanitizeSegment(raw: string, maxLen = 70): string {
	const withoutCtrl = Array.from(raw.normalize("NFKD"))
		.map((ch) => (ch.charCodeAt(0) < 32 ? "_" : ch))
		.join("");
	const cleaned = withoutCtrl
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[<>:"/\\|?*]/g, "_")
		.replace(/\s+/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/g, "");
	const truncated = cleaned.slice(0, maxLen).replace(/^_+|_+$/g, "");
	return truncated || "file";
}

/**
 * Format nama folder mahasiswa yang jelas: `{NIM}_{Nama}` atau `ID{id}_{Nama}`.
 */
export function formatStudentFolderName(student: {
	id: number;
	nim?: string | null;
	name?: string | null;
}): string {
	const prefix =
		student.nim && student.nim.trim() !== ""
			? sanitizeSegment(student.nim.trim(), 30)
			: `ID${student.id}`;
	const safeName = student.name
		? sanitizeSegment(student.name.trim(), 60)
		: "Mahasiswa";
	return `${prefix}_${safeName}`;
}

/**
 * Memetakan kombinasi (panel, category, documentKey) ke struktur folder Panel & Tab yang jelas.
 */
export function resolvePanelAndTabSubdir(
	panel?: string | null,
	category?: string | null,
	documentKey?: string | null,
): string {
	const p = (panel || "").toLowerCase().trim();
	const c = (category || "").toLowerCase().trim();
	const k = (documentKey || "").toLowerCase().trim();

	// Foto profil
	if (k === "profile_photo" || c === "profile" || p === "mahasiswa") {
		return p === "mahasiswa" && k !== "profile_photo"
			? join("08_Lainnya", "Mahasiswa")
			: join("01_PMB", "Foto_Profil");
	}

	// 1. Panel PMB
	if (p === "pmb" || (p === "" && c === "pmb")) {
		if (k.startsWith("fee_invoice")) {
			return join("01_PMB", "Fee_Sharing");
		}
		return join("01_PMB", "Checklist_Dokumen");
	}

	// 2. Panel CRM
	if (p === "crm" || c === "monitoring") {
		if (k.includes("ods")) return join("02_CRM", "ODS");
		if (k.includes("pramagang") || k.includes("pra_magang")) {
			return join("02_CRM", "Pra_Magang");
		}
		if (k.includes("tri_dharma") || k.includes("tridharma")) {
			return join("02_CRM", "Tri_Dharma");
		}
		return join("02_CRM", "Monitoring_Pembiasaan");
	}

	// 3. Panel Finance
	if (p === "finance" || c === "finance") {
		if (k.startsWith("fee_transfer") || k.startsWith("fee_invoice")) {
			return join("03_Finance", "Fee_Sharing");
		}
		if (
			k.startsWith("t1_") ||
			k.startsWith("t2_") ||
			k.includes("talangan") ||
			k.includes("talagan")
		) {
			return join("03_Finance", "Dana_Talangan");
		}
		if (
			k.startsWith("toeic") ||
			k.startsWith("paspor") ||
			k.startsWith("rumah_juang")
		) {
			return join("03_Finance", "Biaya_Tambahan");
		}
		if (
			k.startsWith("registrasi") ||
			k.startsWith("mandiri_") ||
			k.startsWith("kontrak_magang") ||
			k.startsWith("suhan") ||
			k.startsWith("penempatan") ||
			k.startsWith("semester_")
		) {
			return join("03_Finance", "Pembayaran_Utama");
		}
		return join("03_Finance", "Lainnya");
	}

	// 4. Panel Akademik & Keputusan Final
	if (p === "akademik" || p === "academic" || c === "academic") {
		if (k === "sk_direktur") return join("04_Akademik", "SK_Direktur");
		if (k === "departure_assessment") {
			return join("04_Akademik", "Asesmen_Keberangkatan");
		}
		if (k === "product_photo" || k.startsWith("course_")) {
			return join("04_Akademik", "Nilai_Mata_Kuliah");
		}
		return join("04_Akademik", "Dokumen_Akademik");
	}

	// 5. Panel PA
	if (p === "pa") {
		return join("05_PA", "Bimbingan_PA");
	}

	// 6. Panel Magang & Syarat Akhir
	if (p === "post-internship") {
		return join("06_Magang", "05_Syarat_Akhir_Kepulangan");
	}
	if (p === "magang" || c === "magang" || c === "internship") {
		if (MAGANG_PRA_PASPOR_KEYS.has(k)) {
			return join("06_Magang", "01_Pra_Paspor");
		}
		if (MAGANG_PENEMPATAN_KEYS.has(k)) {
			return join("06_Magang", "02_Penempatan_dan_Ahli_Waris");
		}
		if (MAGANG_DOKUMEN_KEBERANGKATAN_KEYS.has(k)) {
			return join("06_Magang", "03_Dokumen_Keberangkatan");
		}
		if (k.startsWith("agen_")) {
			return join("06_Magang", "04_Pembayaran_Agensi");
		}
		if (MAGANG_SYARAT_AKHIR_KEYS.has(k)) {
			return join("06_Magang", "05_Syarat_Akhir_Kepulangan");
		}
		return join("06_Magang", "Lainnya");
	}

	// 7. Kehadiran / Selfie Absen
	if (p === "kehadiran" || c === "selfie_absen") {
		if (k.startsWith("baris_pagi")) {
			return join("07_Kehadiran_Selfie", "Baris_Pagi");
		}
		if (k.startsWith("kuliah")) return join("07_Kehadiran_Selfie", "Kuliah");
		if (k.startsWith("piket")) return join("07_Kehadiran_Selfie", "Piket");
		if (k.startsWith("ods")) return join("07_Kehadiran_Selfie", "ODS");
		return join("07_Kehadiran_Selfie", "Lainnya");
	}

	// Fallback aman
	const fallbackCat = sanitizeSegment(p || c || "Umum", 40);
	return join("08_Lainnya", fallbackCat);
}

function formatCompactTimestamp(dateInput?: Date | string | null): string {
	const d = dateInput ? new Date(dateInput) : new Date();
	if (Number.isNaN(d.getTime())) return "00000000-000000";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/**
 * Bangun nama file yang jelas, deskriptif, dan anti-tabrakan (unik).
 * Contoh: `Surat_Pernyataan_Ahli_Waris__scan_ahli_waris__20261124-091500_A1B2C3.pdf`
 */
export function buildClearBackupFilename(params: {
	id: string;
	documentKey?: string | null;
	originalName: string;
	extension?: string | null;
	createdAt?: Date | string | null;
}): string {
	const rawExt = (
		params.extension ||
		params.originalName.split(".").pop() ||
		"pdf"
	)
		.replace(/^\./, "")
		.toLowerCase();
	const ext = sanitizeSegment(rawExt, 10) || "pdf";

	// Ambil nama asli tanpa ekstensi
	const extSuffix = `.${rawExt}`;
	const rawBase = params.originalName.toLowerCase().endsWith(extSuffix)
		? params.originalName.slice(0, -extSuffix.length)
		: params.originalName.replace(/\.[^/.]+$/, "");
	const baseSanitized = sanitizeSegment(rawBase, 45);

	// Ambil label ramah-baca dari documentKey
	const docKey = (params.documentKey || "").trim();
	const docLabel = docKey
		? DOCUMENT_KEY_LABELS[docKey.toLowerCase()] || sanitizeSegment(docKey, 45)
		: "Dokumen";

	const ts = formatCompactTimestamp(params.createdAt);
	const uniqueShort = sanitizeSegment(params.id.slice(-6), 10);

	// Hindari pengulangan jika nama asli sudah sangat mirip dengan label
	const parts: string[] = [docLabel];
	if (
		baseSanitized &&
		baseSanitized.toLowerCase() !== docLabel.toLowerCase() &&
		baseSanitized.toLowerCase() !== "file"
	) {
		parts.push(baseSanitized);
	}
	parts.push(`${ts}_${uniqueShort}`);

	return `${parts.join("__")}.${ext}`;
}
