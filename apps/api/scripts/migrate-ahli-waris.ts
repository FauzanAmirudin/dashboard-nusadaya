import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function migrate() {
	console.log("Applying migration columns to internship_data...");
	await db.execute(sql`
    ALTER TABLE internship_data 
      ADD COLUMN IF NOT EXISTS ahli_waris_nama text,
      ADD COLUMN IF NOT EXISTS ahli_waris_hubungan text,
      ADD COLUMN IF NOT EXISTS ahli_waris_nik text,
      ADD COLUMN IF NOT EXISTS ahli_waris_phone text,
      ADD COLUMN IF NOT EXISTS ahli_waris_alamat text,
      ADD COLUMN IF NOT EXISTS ahli_waris_bank text,
      ADD COLUMN IF NOT EXISTS ahli_waris_rekening text,
      ADD COLUMN IF NOT EXISTS ahli_waris_atas_nama text,
      ADD COLUMN IF NOT EXISTS ahli_waris_ready boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS asuransi_hong_ta_ready boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS asuransi_polis_no text;
  `);
	console.log("Migration successful!");
	const res = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'internship_data' AND (column_name LIKE 'ahli%' OR column_name LIKE 'asuransi%');
  `);
	console.log("Columns verified:", res);
	process.exit(0);
}

migrate().catch((e) => {
	console.error(e);
	process.exit(1);
});
