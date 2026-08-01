import postgres from "postgres";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:5432/nusadaya";

const sql = postgres(connectionString);

async function main() {
	try {
		console.log("Checking and migrating practice budget tables...");
		await sql`
			CREATE TABLE IF NOT EXISTS practices_budget_requests (
				id serial PRIMARY KEY,
				dosen_id integer NOT NULL,
				nama_kelas text,
				mata_kuliah text NOT NULL,
				daftar_kebutuhan jsonb NOT NULL,
				total_nominal integer DEFAULT 0,
				status text DEFAULT 'menunggu',
				catatan_finance text,
				approved_by integer,
				approved_at timestamp,
				created_at timestamp DEFAULT now(),
				updated_at timestamp DEFAULT now()
			);
		`;

		await sql`
			ALTER TABLE practices_budget_requests ADD COLUMN IF NOT EXISTS nama_kelas text;
		`;
		await sql`
			ALTER TABLE practices_budget_requests ADD COLUMN IF NOT EXISTS catatan_finance text;
		`;

		await sql`
			CREATE TABLE IF NOT EXISTS practices_material_reports (
				id serial PRIMARY KEY,
				budget_request_id integer NOT NULL,
				dosen_id integer NOT NULL,
				daftar_sisa_bahan jsonb NOT NULL,
				catatan_dosen text,
				file_url text,
				file_name text,
				created_at timestamp DEFAULT now()
			);
		`;

		console.log("Migration successful!");
	} catch (err) {
		console.error("Migration error:", err);
	} finally {
		await sql.end();
	}
}

main();
