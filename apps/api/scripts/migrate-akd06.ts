import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function runMigration() {
	console.log(
		"🚀 Starting database migration for AKD-06: Perhitungan Nilai Otomatis & Sinkronisasi KHS ke Magang...",
	);

	await db.execute(sql`
		-- 1. Updates on course_grades
		ALTER TABLE "course_grades" ADD COLUMN IF NOT EXISTS "sks" integer DEFAULT 2;
		ALTER TABLE "course_grades" ADD COLUMN IF NOT EXISTS "uts_score" integer;
		ALTER TABLE "course_grades" ADD COLUMN IF NOT EXISTS "uas_score" integer;
		ALTER TABLE "course_grades" ADD COLUMN IF NOT EXISTS "final_score" integer;
		ALTER TABLE "course_grades" ADD COLUMN IF NOT EXISTS "grade_point" integer;
		ALTER TABLE "course_grades" ADD COLUMN IF NOT EXISTS "semester" integer DEFAULT 1;
		ALTER TABLE "course_grades" ADD COLUMN IF NOT EXISTS "is_published" boolean DEFAULT false;
		ALTER TABLE "course_grades" ADD COLUMN IF NOT EXISTS "published_at" timestamp;
		ALTER TABLE "course_grades" ADD COLUMN IF NOT EXISTS "synced_to_magang" boolean DEFAULT false;
		ALTER TABLE "course_grades" ADD COLUMN IF NOT EXISTS "synced_to_magang_at" timestamp;

		-- 2. Updates on academic_data
		ALTER TABLE "academic_data" ADD COLUMN IF NOT EXISTS "khs_published" boolean DEFAULT false;
		ALTER TABLE "academic_data" ADD COLUMN IF NOT EXISTS "khs_published_at" timestamp;
		ALTER TABLE "academic_data" ADD COLUMN IF NOT EXISTS "krs_published" boolean DEFAULT false;
		ALTER TABLE "academic_data" ADD COLUMN IF NOT EXISTS "transcript_published" boolean DEFAULT false;
		ALTER TABLE "academic_data" ADD COLUMN IF NOT EXISTS "synced_to_magang" boolean DEFAULT false;
		ALTER TABLE "academic_data" ADD COLUMN IF NOT EXISTS "synced_to_magang_at" timestamp;
		ALTER TABLE "academic_data" ADD COLUMN IF NOT EXISTS "synced_to_magang_by" integer REFERENCES "users"("id");
		ALTER TABLE "academic_data" ADD COLUMN IF NOT EXISTS "pddikti_reported" boolean DEFAULT false;
		ALTER TABLE "academic_data" ADD COLUMN IF NOT EXISTS "pddikti_reported_at" timestamp;
		ALTER TABLE "academic_data" ADD COLUMN IF NOT EXISTS "pddikti_reg_no" text;

		-- 3. Create table academic_khs_transcripts
		CREATE TABLE IF NOT EXISTS "academic_khs_transcripts" (
			"id" serial PRIMARY KEY NOT NULL,
			"student_id" integer NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
			"type" text DEFAULT 'khs' NOT NULL,
			"semester" integer DEFAULT 1 NOT NULL,
			"academic_year" text DEFAULT '2025/2026',
			"document_number" text,
			"total_sks" integer DEFAULT 0 NOT NULL,
			"gpa" integer DEFAULT 0 NOT NULL,
			"ips" integer DEFAULT 0 NOT NULL,
			"grades_snapshot" jsonb DEFAULT '[]'::jsonb,
			"status" text DEFAULT 'draft' NOT NULL,
			"published_by" integer REFERENCES "users"("id"),
			"published_at" timestamp,
			"synced_magang_at" timestamp,
			"pddikti_sync_at" timestamp,
			"file_url" text,
			"created_at" timestamp DEFAULT now() NOT NULL,
			"updated_at" timestamp DEFAULT now() NOT NULL
		);

		CREATE INDEX IF NOT EXISTS "idx_khs_transcripts_student_id" ON "academic_khs_transcripts"("student_id");
		CREATE INDEX IF NOT EXISTS "idx_khs_transcripts_type_sem" ON "academic_khs_transcripts"("type", "semester");
	`);

	console.log("✅ AKD-06 schema migration completed successfully!");
	process.exit(0);
}

runMigration().catch((err) => {
	console.error("❌ Migration error:", err);
	process.exit(1);
});
