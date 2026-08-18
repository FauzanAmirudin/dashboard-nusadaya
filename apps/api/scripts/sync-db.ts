import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function main() {
	console.log("Checking and syncing database columns...");
	await db.execute(
		sql`ALTER TABLE finance_data ADD COLUMN IF NOT EXISTS total_biaya_promosi integer DEFAULT 0;`,
	);

	await db.execute(
		sql`DROP TABLE IF EXISTS finance_talangan_installments CASCADE;`,
	);
	await db.execute(sql`CREATE TABLE IF NOT EXISTS finance_talangan_installments (
		id serial PRIMARY KEY,
		student_id integer NOT NULL REFERENCES students(id) ON DELETE CASCADE,
		stage text NOT NULL,
		installment_number integer NOT NULL,
		nominal_paid integer NOT NULL,
		payment_date timestamp with time zone,
		bukti_bayar_url text,
		notes text,
		created_at timestamp with time zone DEFAULT now() NOT NULL,
		updated_at timestamp with time zone DEFAULT now() NOT NULL
	);`);

	console.log("Database columns and tables synced successfully!");
	process.exit(0);
}

main().catch((err) => {
	console.error("Migration error:", err);
	process.exit(1);
});
