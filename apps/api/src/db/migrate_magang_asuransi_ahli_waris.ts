import postgres from "postgres";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@127.0.0.1:5454/nusadaya";

const sql = postgres(connectionString);

/** Menambahkan kolom Asuransi BTN BPJS TK, Asuransi Penempatan Lokal, dan Ahli Waris ke `internship_data`. */
export async function runMagangAsuransiAhliWarisMigration() {
	try {
		console.log(
			"Running Magang Asuransi & Ahli Waris migration (MAG-10 & MAG-11)...",
		);

		await sql.unsafe(`
			-- 1. Asuransi BTN BPJS TK (Indonesia)
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS asuransi_btn_bpjs_ready BOOLEAN DEFAULT false;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS asuransi_btn_bpjs_no TEXT;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS asuransi_btn_bpjs_date TIMESTAMP;

			-- 2. Asuransi Kecelakaan Kerja Penempatan Lokal (Taiwan / Malaysia)
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS asuransi_penempatan_ready BOOLEAN DEFAULT false;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS asuransi_penempatan_provider TEXT;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS asuransi_penempatan_no TEXT;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS asuransi_penempatan_date TIMESTAMP;

			-- 3. Verifikasi Identitas Ahli Waris Keluarga (SOP Agensi Hong Ta)
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS ahli_waris_ready BOOLEAN DEFAULT false;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS ahli_waris_nama TEXT;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS ahli_waris_hubungan TEXT;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS ahli_waris_kontak TEXT;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS ahli_waris_notes TEXT;
		`);

		console.log(
			"Migration Magang Asuransi & Ahli Waris successfully executed.",
		);
		return true;
	} catch (err) {
		console.error("Migration Magang Asuransi & Ahli Waris failed:", err);
		throw err;
	} finally {
		await sql.end();
	}
}

if (
	require.main === module ||
	process.argv[1]?.includes("migrate_magang_asuransi_ahli_waris")
) {
	runMagangAsuransiAhliWarisMigration()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
