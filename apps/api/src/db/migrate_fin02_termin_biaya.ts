import postgres from "postgres";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@127.0.0.1:5454/nusadaya";

const sql = postgres(connectionString);

export async function runFin02Migration() {
	try {
		console.log(
			"Running FIN-02 database migration: 4 Termin Biaya Baku & Dokumen Kontrak/Suhan...",
		);

		await sql.unsafe(`
			-- Kolom tanggal pembayaran legacy
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS mandiri_semester_paid_date TIMESTAMP;
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS mandiri_interview_paid_date TIMESTAMP;
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS mandiri_keberangkatan_paid_date TIMESTAMP;

			-- Termin 3: Kontrak Magang & Surat Suhan
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS kontrak_magang_status BOOLEAN DEFAULT false;
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS kontrak_magang_bukti_bayar_url TEXT;
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS kontrak_magang_paid_date TIMESTAMP;

			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS suhan_status BOOLEAN DEFAULT false;
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS suhan_bukti_bayar_url TEXT;
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS suhan_paid_date TIMESTAMP;

			-- Talangan timestamps
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS t1_semester_paid_date TIMESTAMP;
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS t1_interview_paid_date TIMESTAMP;
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS t2_keberangkatan_paid_date TIMESTAMP;

			-- finance_semester_installments: label bulan & catatan periode fleksibel
			ALTER TABLE finance_semester_installments ADD COLUMN IF NOT EXISTS installment_month TEXT;
			ALTER TABLE finance_semester_installments ADD COLUMN IF NOT EXISTS period_notes TEXT;
		`);

		console.log("Columns verified and created successfully.");

		// Backfill existing Termin 3 interview data into kontrak magang for backward compatibility
		await sql.unsafe(`
			UPDATE finance_data
			SET
				kontrak_magang_status = COALESCE(kontrak_magang_status, mandiri_interview_status, false),
				kontrak_magang_bukti_bayar_url = COALESCE(kontrak_magang_bukti_bayar_url, mandiri_interview_bukti_bayar_url)
			WHERE mandiri_interview_status = true AND (kontrak_magang_status IS NULL OR kontrak_magang_status = false);
		`);

		console.log("FIN-02 database migration completed successfully!");
	} catch (err) {
		console.error("Migration error in FIN-02:", err);
		throw err;
	} finally {
		await sql.end();
	}
}

if (import.meta.main) {
	runFin02Migration()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
