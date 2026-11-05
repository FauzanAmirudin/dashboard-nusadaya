import postgres from "postgres";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@127.0.0.1:5454/nusadaya";

const sql = postgres(connectionString);

export async function runMagangDokumenMigration() {
	try {
		console.log(
			"Running Magang Dokumen migration: MOU, Suhan, MCU Full, dan Asesmen 2-Slot...",
		);

		await sql.unsafe(`
			-- 1. MOU Kampus & Hotel Mitra (menggantikan / melengkapi MOA)
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS mou_ready BOOLEAN DEFAULT false;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS mou_date TIMESTAMP;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS mou_notes TEXT;

			-- 2. Suhan (Surat Persetujuan Magang Mahasiswa WNI di Taiwan)
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS suhan_ready BOOLEAN DEFAULT false;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS suhan_no TEXT;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS suhan_date TIMESTAMP;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS suhan_notes TEXT;

			-- 3. Asesmen dan Pengarahan Keberangkatan (melengkapi PDT)
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS asesmen_ready BOOLEAN DEFAULT false;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS asesmen_date TIMESTAMP;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS asesmen_result TEXT;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS asesmen_notes TEXT;
			ALTER TABLE internship_data ADD COLUMN IF NOT EXISTS asesmen_pernyataan_ready BOOLEAN DEFAULT false;
		`);

		// Sinkronisasi data lama jika ada
		await sql.unsafe(`
			UPDATE internship_data 
			SET mou_ready = moa_ready 
			WHERE moa_ready = true AND (mou_ready IS NULL OR mou_ready = false);

			UPDATE internship_data 
			SET mou_date = moa_date 
			WHERE moa_date IS NOT NULL AND mou_date IS NULL;

			UPDATE internship_data 
			SET mou_notes = moa_notes 
			WHERE moa_notes IS NOT NULL AND mou_notes IS NULL;

			UPDATE internship_data 
			SET asesmen_ready = pdt_ready 
			WHERE pdt_ready = true AND (asesmen_ready IS NULL OR asesmen_ready = false);

			UPDATE internship_data 
			SET asesmen_date = pdt_date 
			WHERE pdt_date IS NOT NULL AND asesmen_date IS NULL;
		`);

		console.log("Migration Magang Dokumen successfully executed.");
		return true;
	} catch (err) {
		console.error("Migration Magang Dokumen failed:", err);
		throw err;
	}
}

if (
	require.main === module ||
	process.argv[1]?.includes("migrate_magang_suhan_asesmen")
) {
	runMagangDokumenMigration()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
