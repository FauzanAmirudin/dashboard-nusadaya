import { sql } from "drizzle-orm";
import { db } from "./src/db";

async function run() {
	console.log("Dropping columns...");
	await db.execute(
		sql`ALTER TABLE students DROP COLUMN IF EXISTS address CASCADE;`,
	);
	await db.execute(
		sql`ALTER TABLE students DROP COLUMN IF EXISTS nik CASCADE;`,
	);
	await db.execute(
		sql`ALTER TABLE students DROP COLUMN IF EXISTS nisn CASCADE;`,
	);
	console.log("Columns dropped!");
	process.exit(0);
}

run();
