import postgres from "postgres";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:5432/nusadaya";

const sql = postgres(connectionString);

async function main() {
	try {
		console.log("🚀 Starting Baris Pagi Hybrid Migration...");

		// 1. Alter morning_assembly_sessions
		console.log("Modifying morning_assembly_sessions columns...");
		await sql`
			ALTER TABLE morning_assembly_sessions 
			ADD COLUMN IF NOT EXISTS is_auto_generated boolean DEFAULT false NOT NULL;
		`;
		await sql`
			ALTER TABLE morning_assembly_sessions 
			ADD COLUMN IF NOT EXISTS session_status text DEFAULT 'scheduled' NOT NULL;
		`;
		await sql`
			ALTER TABLE morning_assembly_sessions 
			ADD COLUMN IF NOT EXISTS check_in_window_start text DEFAULT '05:30' NOT NULL;
		`;
		await sql`
			ALTER TABLE morning_assembly_sessions 
			ADD COLUMN IF NOT EXISTS check_in_window_end text DEFAULT '07:00' NOT NULL;
		`;
		await sql`
			ALTER TABLE morning_assembly_sessions 
			ADD COLUMN IF NOT EXISTS rescheduled_from date;
		`;

		// 2. Alter morning_assembly_records
		console.log("Modifying morning_assembly_records columns...");
		await sql`
			ALTER TABLE morning_assembly_records 
			ADD COLUMN IF NOT EXISTS self_checkin_at timestamp;
		`;
		await sql`
			ALTER TABLE morning_assembly_records 
			ADD COLUMN IF NOT EXISTS checkin_method text DEFAULT 'admin' NOT NULL;
		`;

		// 3. Create morning_assembly_schedule_config table
		console.log("Creating morning_assembly_schedule_config table...");
		await sql`
			CREATE TABLE IF NOT EXISTS morning_assembly_schedule_config (
				id serial PRIMARY KEY,
				cohort integer NOT NULL,
				day_of_week integer DEFAULT 1 NOT NULL,
				target_time text DEFAULT '06:22' NOT NULL,
				check_in_window_start text DEFAULT '05:30' NOT NULL,
				check_in_window_end text DEFAULT '07:00' NOT NULL,
				location text DEFAULT 'Lapangan Utama Kampus' NOT NULL,
				rombel text DEFAULT 'Semua' NOT NULL,
				is_active boolean DEFAULT true NOT NULL,
				created_by integer REFERENCES users(id),
				created_at timestamp DEFAULT now() NOT NULL,
				updated_at timestamp DEFAULT now() NOT NULL
			);
		`;

		await sql`
			CREATE INDEX IF NOT EXISTS idx_morning_assembly_config_cohort 
			ON morning_assembly_schedule_config (cohort);
		`;

		// Seed a default schedule config for cohort 16 (Monday assembly) if none exists
		const existingConfig = await sql`
			SELECT id FROM morning_assembly_schedule_config WHERE cohort = 16 LIMIT 1;
		`;
		if (existingConfig.length === 0) {
			console.log(
				"Seeding default schedule config for cohort 16 (Monday assembly)...",
			);
			await sql`
				INSERT INTO morning_assembly_schedule_config (
					cohort, day_of_week, target_time, check_in_window_start, check_in_window_end, location, rombel, is_active
				) VALUES (
					16, 1, '06:22', '05:30', '07:00', 'Lapangan Utama Kampus', 'Semua', true
				);
			`;
		}

		console.log("✅ Baris Pagi Hybrid Migration completed successfully!");
	} catch (err) {
		console.error("❌ Migration error:", err);
		process.exit(1);
	} finally {
		await sql.end();
	}
}

main();
