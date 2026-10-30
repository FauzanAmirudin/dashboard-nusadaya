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

			-- finance_semester_installments: label bulan & catatan periode fleksibel, penjadwalan & status
			ALTER TABLE finance_semester_installments ADD COLUMN IF NOT EXISTS installment_month TEXT;
			ALTER TABLE finance_semester_installments ADD COLUMN IF NOT EXISTS period_notes TEXT;
			ALTER TABLE finance_semester_installments ADD COLUMN IF NOT EXISTS nominal_scheduled INTEGER DEFAULT 0;
			ALTER TABLE finance_semester_installments ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
			ALTER TABLE finance_semester_installments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'BELUM_BAYAR';

			-- Skema Fleksibel Dana Talangan (1 Tahap vs 2 Tahap - Segmen 12)
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS talangan_tipe TEXT DEFAULT '2_tahap';
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS talangan_total_pengajuan INTEGER DEFAULT 0;
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS talangan_lembaga TEXT;
			ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS talangan_notes TEXT;
		`);

		console.log("Columns verified and created successfully.");

		// Backfill existing installments into nominal_scheduled and status
		await sql.unsafe(`
			UPDATE finance_semester_installments
			SET
				nominal_scheduled = COALESCE(NULLIF(nominal_scheduled, 0), nominal_paid, 0),
				status = CASE WHEN COALESCE(nominal_paid, 0) > 0 THEN 'LUNAS' ELSE 'BELUM_BAYAR' END
			WHERE nominal_scheduled IS NULL OR nominal_scheduled = 0;
		`);

		// Backfill existing Termin 3 interview data into kontrak magang for backward compatibility
		await sql.unsafe(`
			UPDATE finance_data
			SET
				kontrak_magang_status = COALESCE(kontrak_magang_status, mandiri_interview_status, false),
				kontrak_magang_bukti_bayar_url = COALESCE(kontrak_magang_bukti_bayar_url, mandiri_interview_bukti_bayar_url)
			WHERE mandiri_interview_status = true AND (kontrak_magang_status IS NULL OR kontrak_magang_status = false);
		`);

		// Segmen 13: Tabel Riwayat Pencairan Fee Sharing Bertahap (Multi-Termin)
		await sql.unsafe(`
			CREATE TABLE IF NOT EXISTS fee_disbursement_logs (
				id SERIAL PRIMARY KEY,
				recipient_id INTEGER NOT NULL REFERENCES fee_share_recipients(id) ON DELETE CASCADE,
				student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
				termin_number INTEGER NOT NULL,
				amount INTEGER NOT NULL DEFAULT 0,
				transfer_proof_url TEXT,
				transfer_proof_file_name TEXT,
				disbursed_at TIMESTAMP NOT NULL DEFAULT NOW(),
				disbursed_by INTEGER REFERENCES users(id),
				notes TEXT,
				created_at TIMESTAMP NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMP NOT NULL DEFAULT NOW()
			);

			CREATE INDEX IF NOT EXISTS idx_fee_disbursement_logs_recipient_id ON fee_disbursement_logs(recipient_id);
			CREATE INDEX IF NOT EXISTS idx_fee_disbursement_logs_student_id ON fee_disbursement_logs(student_id);
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
