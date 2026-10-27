import postgres from "postgres";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:5432/nusadaya";

const sql = postgres(connectionString);

async function main() {
	try {
		console.log("Checking and migrating finance_projection_targets table...");
		await sql`
			CREATE TABLE IF NOT EXISTS finance_projection_targets (
				id serial PRIMARY KEY,
				cohort integer NOT NULL,
				category text NOT NULL,
				year integer NOT NULL,
				month integer NOT NULL DEFAULT 0,
				period_type text DEFAULT 'monthly',
				target_nominal bigint NOT NULL DEFAULT 0,
				notes text,
				updated_by integer REFERENCES users(id),
				created_at timestamp DEFAULT now() NOT NULL,
				updated_at timestamp DEFAULT now() NOT NULL
			);
		`;

		await sql`
			CREATE INDEX IF NOT EXISTS idx_projection_targets_cohort_cat ON finance_projection_targets (cohort, category, year);
		`;

		await sql`
			CREATE UNIQUE INDEX IF NOT EXISTS idx_projection_targets_unique ON finance_projection_targets (cohort, category, year, month);
		`;

		console.log("Table and indexes created successfully!");

		// Check if initial seed targets exist
		const currentCount =
			await sql`SELECT count(*) as count FROM finance_projection_targets`;
		if (Number(currentCount[0].count) === 0) {
			console.log(
				"Seeding default projection targets for cohorts 15, 16, and global...",
			);
			const currentYear = new Date().getFullYear();

			// Cohort 15
			await sql`
				INSERT INTO finance_projection_targets (cohort, category, year, month, period_type, target_nominal, notes)
				VALUES
					(15, 'pmb', ${currentYear}, 0, 'yearly', 50000000, 'Target PMB Angkatan 15'),
					(15, 'spp_taiwan', ${currentYear}, 0, 'yearly', 100000000, 'Target SPP Taiwan Angkatan 15'),
					(15, 'spp_malaysia', ${currentYear}, 0, 'yearly', 60000000, 'Target SPP D3 Malaysia Angkatan 15'),
					(16, 'pmb', ${currentYear}, 0, 'yearly', 75000000, 'Target PMB Angkatan 16'),
					(16, 'spp_taiwan', ${currentYear}, 0, 'yearly', 150000000, 'Target SPP Taiwan Angkatan 16'),
					(16, 'spp_malaysia', ${currentYear}, 0, 'yearly', 90000000, 'Target SPP D3 Malaysia Angkatan 16'),
					(0, 'pmb', ${currentYear}, 0, 'yearly', 125000000, 'Target PMB Semua Angkatan'),
					(0, 'spp_taiwan', ${currentYear}, 0, 'yearly', 250000000, 'Target SPP Taiwan Semua Angkatan'),
					(0, 'spp_malaysia', ${currentYear}, 0, 'yearly', 150000000, 'Target SPP D3 Malaysia Semua Angkatan')
				ON CONFLICT DO NOTHING;
			`;
			console.log("Seeding default projection targets completed!");
		} else {
			console.log(
				`finance_projection_targets already has ${currentCount[0].count} records, skipping seed.`,
			);
		}
	} catch (err) {
		console.error("Migration error:", err);
		process.exit(1);
	} finally {
		await sql.end();
	}
}

main();
