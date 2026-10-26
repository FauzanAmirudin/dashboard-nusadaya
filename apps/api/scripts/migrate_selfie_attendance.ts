import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function runMigration() {
	console.log("🚀 Starting Selfie & Geolocation Attendance Migration...");

	// 1. ALTER TABLE attendance_records
	console.log("Adding columns to attendance_records...");
	await db.execute(sql`
		ALTER TABLE attendance_records
		ADD COLUMN IF NOT EXISTS selfie_url TEXT,
		ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
		ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
		ADD COLUMN IF NOT EXISTS gps_accuracy REAL,
		ADD COLUMN IF NOT EXISTS location_name TEXT,
		ADD COLUMN IF NOT EXISTS distance_from_checkpoint INTEGER,
		ADD COLUMN IF NOT EXISTS checkin_method TEXT DEFAULT 'admin',
		ADD COLUMN IF NOT EXISTS is_within_radius BOOLEAN DEFAULT true,
		ADD COLUMN IF NOT EXISTS selfie_taken_at TIMESTAMP,
		ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'auto_approved',
		ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(id),
		ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
		ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
	`);

	await db.execute(sql`
		CREATE INDEX IF NOT EXISTS idx_attendance_records_verification ON attendance_records(verification_status);
	`);

	// 2. ALTER TABLE morning_assembly_records
	console.log("Adding columns to morning_assembly_records...");
	await db.execute(sql`
		ALTER TABLE morning_assembly_records
		ADD COLUMN IF NOT EXISTS selfie_url TEXT,
		ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
		ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
		ADD COLUMN IF NOT EXISTS gps_accuracy REAL,
		ADD COLUMN IF NOT EXISTS location_name TEXT,
		ADD COLUMN IF NOT EXISTS distance_from_checkpoint INTEGER,
		ADD COLUMN IF NOT EXISTS is_within_radius BOOLEAN DEFAULT true,
		ADD COLUMN IF NOT EXISTS selfie_taken_at TIMESTAMP,
		ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'auto_approved',
		ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(id),
		ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
		ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
		ADD COLUMN IF NOT EXISTS face_detected BOOLEAN DEFAULT true;
	`);

	// 3. ALTER TABLE ods_attendance_records
	console.log("Adding columns to ods_attendance_records...");
	await db.execute(sql`
		ALTER TABLE ods_attendance_records
		ADD COLUMN IF NOT EXISTS selfie_url TEXT,
		ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
		ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
		ADD COLUMN IF NOT EXISTS gps_accuracy REAL,
		ADD COLUMN IF NOT EXISTS location_name TEXT,
		ADD COLUMN IF NOT EXISTS distance_from_checkpoint INTEGER,
		ADD COLUMN IF NOT EXISTS checkin_method TEXT DEFAULT 'admin',
		ADD COLUMN IF NOT EXISTS is_within_radius BOOLEAN DEFAULT true,
		ADD COLUMN IF NOT EXISTS selfie_taken_at TIMESTAMP,
		ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'auto_approved',
		ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(id),
		ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
		ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
	`);

	// 4. ALTER TABLE pramagang_attendance_records
	console.log("Adding columns to pramagang_attendance_records...");
	await db.execute(sql`
		ALTER TABLE pramagang_attendance_records
		ADD COLUMN IF NOT EXISTS selfie_url TEXT,
		ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
		ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
		ADD COLUMN IF NOT EXISTS gps_accuracy REAL,
		ADD COLUMN IF NOT EXISTS location_name TEXT,
		ADD COLUMN IF NOT EXISTS distance_from_checkpoint INTEGER,
		ADD COLUMN IF NOT EXISTS checkin_method TEXT DEFAULT 'admin',
		ADD COLUMN IF NOT EXISTS is_within_radius BOOLEAN DEFAULT true,
		ADD COLUMN IF NOT EXISTS selfie_taken_at TIMESTAMP,
		ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'auto_approved',
		ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(id),
		ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
		ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
	`);

	// 5. CREATE TABLE attendance_checkpoint_config
	console.log("Creating attendance_checkpoint_config table...");
	await db.execute(sql`
		CREATE TABLE IF NOT EXISTS attendance_checkpoint_config (
			id SERIAL PRIMARY KEY,
			type TEXT NOT NULL,
			label TEXT NOT NULL,
			latitude DOUBLE PRECISION NOT NULL,
			longitude DOUBLE PRECISION NOT NULL,
			radius_meters INTEGER DEFAULT 100 NOT NULL,
			is_active BOOLEAN DEFAULT true NOT NULL,
			cohort INTEGER,
			notes TEXT,
			created_by INTEGER REFERENCES users(id),
			created_at TIMESTAMP DEFAULT NOW() NOT NULL,
			updated_at TIMESTAMP DEFAULT NOW() NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_attendance_checkpoint_type ON attendance_checkpoint_config(type);
		CREATE INDEX IF NOT EXISTS idx_attendance_checkpoint_cohort ON attendance_checkpoint_config(cohort);
	`);

	// 6. CREATE TABLE selfie_fraud_flags
	console.log("Creating selfie_fraud_flags table...");
	await db.execute(sql`
		CREATE TABLE IF NOT EXISTS selfie_fraud_flags (
			id SERIAL PRIMARY KEY,
			attendance_type TEXT NOT NULL,
			attendance_record_id INTEGER NOT NULL,
			student_id INTEGER REFERENCES students(id) NOT NULL,
			flag_reason TEXT NOT NULL,
			flag_detail JSONB,
			reviewed_by INTEGER REFERENCES users(id),
			reviewed_at TIMESTAMP,
			is_dismissed BOOLEAN DEFAULT false NOT NULL,
			created_at TIMESTAMP DEFAULT NOW() NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_selfie_fraud_student_id ON selfie_fraud_flags(student_id);
		CREATE INDEX IF NOT EXISTS idx_selfie_fraud_type_record ON selfie_fraud_flags(attendance_type, attendance_record_id);
	`);

	// 7. Seed initial default checkpoints
	console.log("Seeding default checkpoints...");
	const types = ["baris_pagi", "kuliah", "piket", "ods"];
	for (const type of types) {
		await db.execute(sql`
			INSERT INTO attendance_checkpoint_config (type, label, latitude, longitude, radius_meters, is_active, notes)
			SELECT ${type}, ${"Kampus Nusadaya Academy Bandar Lampung"}, -5.40145, 105.2114, 150, true, 'Jl. Raden Imba Kusuma Ratu, Langkapura, Kec. Langkapura, Kota Bandar Lampung, Lampung 35116'
			WHERE NOT EXISTS (
				SELECT 1 FROM attendance_checkpoint_config WHERE type = ${type} AND cohort IS NULL
			);
		`);
	}

	console.log(
		"✅ Selfie & Geolocation attendance migration completed successfully!",
	);
	process.exit(0);
}

runMigration().catch((err) => {
	console.error("❌ Migration failed:", err);
	process.exit(1);
});
