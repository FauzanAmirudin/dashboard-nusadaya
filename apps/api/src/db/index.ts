import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@127.0.0.1:5454/nusadaya";

export const client = postgres(connectionString, {
	max: Number(process.env.DB_POOL_MAX) || 20,
	idle_timeout: 30,
	connect_timeout: 10,
	max_lifetime: 60 * 30,
	connection: {
		statement_timeout: 15000,
	},
	onnotice: () => {},
});
export const db = drizzle(client, { schema });

export async function ensureDatabaseSchema() {
	try {
		await client`
			ALTER TABLE users 
			ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]'::jsonb;
		`;
		await client`
			CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users (LOWER(email)) WHERE email IS NOT NULL;
		`;
		await client`
			UPDATE users 
			SET roles = jsonb_build_array(role) 
			WHERE roles IS NULL OR jsonb_array_length(roles) = 0;
		`;

		// Otomatis sinkronisasi email superadmin untuk otentikasi OTP email
		const superadminEmail = (
			process.env.SUPERADMIN_EMAIL || "onedatanusadaya@gmail.com"
		)
			.trim()
			.toLowerCase();

		const existingSuperadmin = await client`
			SELECT id FROM users WHERE username = 'superadmin' LIMIT 1;
		`;

		if (existingSuperadmin.length > 0) {
			await client`
				UPDATE users 
				SET email = ${superadminEmail} 
				WHERE username = 'superadmin' AND (email IS NULL OR LOWER(email) != ${superadminEmail});
			`;
		} else {
			const passHash = await Bun.password.hash("password");
			await client`
				INSERT INTO users (username, password_hash, full_name, role, roles, email)
				VALUES ('superadmin', ${passHash}, 'Superadmin Nusadaya', 'superadmin', '["superadmin"]'::jsonb, ${superadminEmail})
				ON CONFLICT DO NOTHING;
			`;
		}

		// Lengkapi email staf demo bawaan yang masih kosong agar siap login via email
		await client.unsafe(`
			UPDATE users SET email = 'pmb@nusadaya.ac.id' WHERE username = 'pmb' AND email IS NULL;
			UPDATE users SET email = 'crm@nusadaya.ac.id' WHERE username = 'crm' AND email IS NULL;
			UPDATE users SET email = 'finance@nusadaya.ac.id' WHERE username = 'finance' AND email IS NULL;
			UPDATE users SET email = 'akademik@nusadaya.ac.id' WHERE username = 'akademik' AND email IS NULL;
			UPDATE users SET email = 'pa@nusadaya.ac.id' WHERE username = 'pa' AND email IS NULL;
			UPDATE users SET email = 'magang@nusadaya.ac.id' WHERE username = 'magang' AND email IS NULL;
		`);
		await client.unsafe(`
			DO $$
			BEGIN
				IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
					BEGIN
						ALTER TYPE status ADD VALUE IF NOT EXISTS 'ACC';
					EXCEPTION WHEN OTHERS THEN NULL;
					END;
					BEGIN
						ALTER TYPE status ADD VALUE IF NOT EXISTS 'PROSES';
					EXCEPTION WHEN OTHERS THEN NULL;
					END;
					BEGIN
						ALTER TYPE status ADD VALUE IF NOT EXISTS 'BUTUH_PERHATIAN';
					EXCEPTION WHEN OTHERS THEN NULL;
					END;
				END IF;
			END
			$$;
		`);

		await client.unsafe(`
			CREATE TABLE IF NOT EXISTS course_enrollments (
				id SERIAL PRIMARY KEY,
				course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
				student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
				added_by INTEGER REFERENCES users(id),
				notes TEXT,
				created_at TIMESTAMP DEFAULT NOW() NOT NULL,
				CONSTRAINT uq_course_enrollment UNIQUE (course_id, student_id)
			);
			CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
			CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
		`);

		// PMB upgrade schema assertions
		await client.unsafe(`
			ALTER TABLE pmb_form_responses
			  ADD COLUMN IF NOT EXISTS referral_category TEXT,
			  ADD COLUMN IF NOT EXISTS referral_institution_name TEXT,
			  ADD COLUMN IF NOT EXISTS referral_contact_name TEXT,
			  ADD COLUMN IF NOT EXISTS referral_contact_phone TEXT,
			  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
			  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
			  ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT,
			  ADD COLUMN IF NOT EXISTS recommended_by TEXT,
			  ADD COLUMN IF NOT EXISTS recommender_name TEXT,
			  ADD COLUMN IF NOT EXISTS friend_contacts JSONB DEFAULT '[]'::jsonb,
			  ADD COLUMN IF NOT EXISTS rejected_tabs JSONB DEFAULT '[]'::jsonb,
			  ADD COLUMN IF NOT EXISTS rejected_fields JSONB DEFAULT '[]'::jsonb,
			  ADD COLUMN IF NOT EXISTS color_blind_test TEXT,
			  ADD COLUMN IF NOT EXISTS has_tattoo BOOLEAN DEFAULT false,
			  ADD COLUMN IF NOT EXISTS has_piercing_non_standard BOOLEAN DEFAULT false,
			  ADD COLUMN IF NOT EXISTS has_major_surgery_history BOOLEAN DEFAULT false,
			  ADD COLUMN IF NOT EXISTS has_chronic_disease BOOLEAN DEFAULT false,
			  ADD COLUMN IF NOT EXISTS mcu_consent_agreed BOOLEAN DEFAULT false;

			ALTER TABLE pmb_data
			  ADD COLUMN IF NOT EXISTS referral_category TEXT,
			  ADD COLUMN IF NOT EXISTS referral_institution_name TEXT,
			  ADD COLUMN IF NOT EXISTS referral_contact_name TEXT,
			  ADD COLUMN IF NOT EXISTS referral_contact_phone TEXT,
			  ADD COLUMN IF NOT EXISTS pas_foto BOOLEAN DEFAULT FALSE;

			ALTER TABLE students
			  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
			  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
			  ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;

			ALTER TABLE fee_share_recipients
			  ADD COLUMN IF NOT EXISTS nama_institusi TEXT;

			CREATE TABLE IF NOT EXISTS student_friend_contacts (
			  id SERIAL PRIMARY KEY,
			  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
			  name TEXT NOT NULL,
			  phone TEXT NOT NULL,
			  school_or_relation TEXT,
			  follow_up_status TEXT DEFAULT 'Belum Dihubungi',
			  created_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_student_friend_contacts_student_id ON student_friend_contacts(student_id);

			CREATE TABLE IF NOT EXISTS program_fee_defaults (
			  id SERIAL PRIMARY KEY,
			  sub_program TEXT NOT NULL UNIQUE,
			  default_total_biaya INTEGER DEFAULT 0,
			  default_registrasi INTEGER DEFAULT 0,
			  default_per_semester INTEGER DEFAULT 0,
			  default_interview INTEGER DEFAULT 0,
			  default_keberangkatan INTEGER DEFAULT 0,
			  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
			  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_program_fee_defaults_sub_program ON program_fee_defaults(sub_program);

			INSERT INTO program_fee_defaults (sub_program, default_total_biaya, default_registrasi, default_per_semester, default_interview, default_keberangkatan)
			VALUES 
			  ('Indonesia-Reguler', 18000000, 3000000, 2500000, 0, 0),
			  ('Malaysia-Hospitality', 25000000, 5000000, 3500000, 2000000, 5000000),
			  ('Taiwan-Hospitality', 35000000, 5000000, 4500000, 3000000, 8000000),
			  ('Timur tengah-Barista', 28000000, 5000000, 4000000, 2500000, 6000000)
			ON CONFLICT (sub_program) DO NOTHING;

			-- Academic, Rombel, & Multi-Kelas schema extensions
			ALTER TABLE students ADD COLUMN IF NOT EXISTS rombel TEXT DEFAULT 'Kelas A';
			ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS rombel TEXT DEFAULT 'Kelas A';
			ALTER TABLE practicum_schedules ADD COLUMN IF NOT EXISTS rombel TEXT DEFAULT 'Kelas A';
			ALTER TABLE courses ADD COLUMN IF NOT EXISTS rombel TEXT DEFAULT 'Kelas A';
			ALTER TABLE courses ADD COLUMN IF NOT EXISTS sks INTEGER DEFAULT 2;

			-- Practices budget request extensions
			ALTER TABLE practices_budget_requests
			  ADD COLUMN IF NOT EXISTS bukti_pencairan_url TEXT,
			  ADD COLUMN IF NOT EXISTS bukti_pencairan_file_name TEXT,
			  ADD COLUMN IF NOT EXISTS tanggal_pencairan TIMESTAMP;

			-- DSN-01: Rekapitulasi Presensi Mengajar Dosen (Team Teaching)
			ALTER TABLE course_meetings
			  ADD COLUMN IF NOT EXISTS dosen_pengajar_id INTEGER REFERENCES users(id),
			  ADD COLUMN IF NOT EXISTS attended_dosen_ids JSONB DEFAULT '[]'::jsonb,
			  ADD COLUMN IF NOT EXISTS is_team_teaching_attended BOOLEAN DEFAULT false,
			  ADD COLUMN IF NOT EXISTS teaching_status TEXT DEFAULT 'terlaksana',
			  ADD COLUMN IF NOT EXISTS teaching_notes TEXT;

			CREATE INDEX IF NOT EXISTS idx_course_meetings_dosen_pengajar_id ON course_meetings(dosen_pengajar_id);
			CREATE INDEX IF NOT EXISTS idx_course_meetings_date ON course_meetings(meeting_date);

			DO $$
			BEGIN
				IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_code_unique') THEN
					ALTER TABLE courses ADD CONSTRAINT courses_code_unique UNIQUE (code);
				END IF;
			END $$;

			-- AKD-06: Perhitungan Nilai Otomatis & Sinkronisasi KHS ke Magang
			ALTER TABLE course_grades
			  ADD COLUMN IF NOT EXISTS sks INTEGER DEFAULT 2,
			  ADD COLUMN IF NOT EXISTS uts_score INTEGER,
			  ADD COLUMN IF NOT EXISTS uas_score INTEGER,
			  ADD COLUMN IF NOT EXISTS final_score INTEGER,
			  ADD COLUMN IF NOT EXISTS grade_point INTEGER,
			  ADD COLUMN IF NOT EXISTS semester INTEGER DEFAULT 1,
			  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
			  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
			  ADD COLUMN IF NOT EXISTS synced_to_magang BOOLEAN DEFAULT false,
			  ADD COLUMN IF NOT EXISTS synced_to_magang_at TIMESTAMP;

			ALTER TABLE academic_data
			  ADD COLUMN IF NOT EXISTS khs_published BOOLEAN DEFAULT false,
			  ADD COLUMN IF NOT EXISTS khs_published_at TIMESTAMP,
			  ADD COLUMN IF NOT EXISTS krs_published BOOLEAN DEFAULT false,
			  ADD COLUMN IF NOT EXISTS transcript_published BOOLEAN DEFAULT false,
			  ADD COLUMN IF NOT EXISTS synced_to_magang BOOLEAN DEFAULT false,
			  ADD COLUMN IF NOT EXISTS synced_to_magang_at TIMESTAMP,
			  ADD COLUMN IF NOT EXISTS synced_to_magang_by INTEGER REFERENCES users(id),
			  ADD COLUMN IF NOT EXISTS pddikti_reported BOOLEAN DEFAULT false,
			  ADD COLUMN IF NOT EXISTS pddikti_reported_at TIMESTAMP,
			  ADD COLUMN IF NOT EXISTS pddikti_reg_no TEXT,
			  ADD COLUMN IF NOT EXISTS attendance_baris_total INTEGER DEFAULT 0,
			  ADD COLUMN IF NOT EXISTS attendance_baris_present INTEGER DEFAULT 0,
			  ADD COLUMN IF NOT EXISTS attendance_baris_late INTEGER DEFAULT 0,
			  ADD COLUMN IF NOT EXISTS attendance_piket_total INTEGER DEFAULT 0,
			  ADD COLUMN IF NOT EXISTS attendance_piket_present INTEGER DEFAULT 0,
			  ADD COLUMN IF NOT EXISTS attendance_ods_total INTEGER DEFAULT 0,
			  ADD COLUMN IF NOT EXISTS attendance_ods_present INTEGER DEFAULT 0,
			  ADD COLUMN IF NOT EXISTS attendance_pramagang_total INTEGER DEFAULT 0,
			  ADD COLUMN IF NOT EXISTS attendance_pramagang_present INTEGER DEFAULT 0;

			CREATE TABLE IF NOT EXISTS academic_khs_transcripts (
				id SERIAL PRIMARY KEY,
				student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
				type TEXT DEFAULT 'khs' NOT NULL,
				semester INTEGER DEFAULT 1 NOT NULL,
				academic_year TEXT DEFAULT '2025/2026',
				document_number TEXT,
				total_sks INTEGER DEFAULT 0 NOT NULL,
				gpa INTEGER DEFAULT 0 NOT NULL,
				ips INTEGER DEFAULT 0 NOT NULL,
				grades_snapshot JSONB DEFAULT '[]'::jsonb,
				status TEXT DEFAULT 'draft' NOT NULL,
				published_by INTEGER REFERENCES users(id),
				published_at TIMESTAMP,
				synced_magang_at TIMESTAMP,
				pddikti_sync_at TIMESTAMP,
				file_url TEXT,
				created_at TIMESTAMP DEFAULT NOW() NOT NULL,
				updated_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_khs_transcripts_student_id ON academic_khs_transcripts(student_id);
			CREATE INDEX IF NOT EXISTS idx_khs_transcripts_type_sem ON academic_khs_transcripts(type, semester);

			-- Baris Pagi Hybrid & Sesi Apel
			CREATE TABLE IF NOT EXISTS morning_assembly_sessions (
				id SERIAL PRIMARY KEY,
				cohort INTEGER NOT NULL,
				rombel TEXT DEFAULT 'Semua' NOT NULL,
				session_date DATE NOT NULL,
				target_time TEXT DEFAULT '06:22' NOT NULL,
				location TEXT DEFAULT 'Lapangan Utama Kampus' NOT NULL,
				notes TEXT,
				is_auto_generated BOOLEAN DEFAULT false NOT NULL,
				session_status TEXT DEFAULT 'scheduled' NOT NULL,
				check_in_window_start TEXT DEFAULT '05:30' NOT NULL,
				check_in_window_end TEXT DEFAULT '07:00' NOT NULL,
				rescheduled_from DATE,
				created_by INTEGER REFERENCES users(id),
				created_at TIMESTAMP DEFAULT NOW() NOT NULL,
				updated_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_morning_assembly_sessions_cohort ON morning_assembly_sessions(cohort);
			CREATE INDEX IF NOT EXISTS idx_morning_assembly_sessions_date ON morning_assembly_sessions(session_date);

			ALTER TABLE morning_assembly_sessions
			  ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT false NOT NULL,
			  ADD COLUMN IF NOT EXISTS session_status TEXT DEFAULT 'scheduled' NOT NULL,
			  ADD COLUMN IF NOT EXISTS check_in_window_start TEXT DEFAULT '05:30' NOT NULL,
			  ADD COLUMN IF NOT EXISTS check_in_window_end TEXT DEFAULT '07:00' NOT NULL,
			  ADD COLUMN IF NOT EXISTS rescheduled_from DATE;

			CREATE TABLE IF NOT EXISTS morning_assembly_records (
				id SERIAL PRIMARY KEY,
				session_id INTEGER NOT NULL REFERENCES morning_assembly_sessions(id) ON DELETE CASCADE,
				student_id INTEGER NOT NULL REFERENCES students(id),
				status TEXT NOT NULL,
				arrival_time TEXT,
				minutes_late INTEGER DEFAULT 0,
				notes TEXT,
				self_checkin_at TIMESTAMP,
				checkin_method TEXT DEFAULT 'admin' NOT NULL,
				selfie_url TEXT,
				latitude DOUBLE PRECISION,
				longitude DOUBLE PRECISION,
				gps_accuracy REAL,
				location_name TEXT,
				distance_from_checkpoint INTEGER,
				is_within_radius BOOLEAN DEFAULT true,
				selfie_taken_at TIMESTAMP,
				verification_status TEXT DEFAULT 'auto_approved',
				verified_by INTEGER REFERENCES users(id),
				verified_at TIMESTAMP,
				rejection_reason TEXT,
				face_detected BOOLEAN DEFAULT true,
				recorded_by INTEGER REFERENCES users(id),
				recorded_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_morning_assembly_records_session_id ON morning_assembly_records(session_id);
			CREATE INDEX IF NOT EXISTS idx_morning_assembly_records_student_id ON morning_assembly_records(student_id);

			ALTER TABLE morning_assembly_records
			  ADD COLUMN IF NOT EXISTS self_checkin_at TIMESTAMP,
			  ADD COLUMN IF NOT EXISTS checkin_method TEXT DEFAULT 'admin' NOT NULL,
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

			CREATE TABLE IF NOT EXISTS morning_assembly_schedule_config (
				id SERIAL PRIMARY KEY,
				cohort INTEGER NOT NULL,
				day_of_week INTEGER DEFAULT 1 NOT NULL,
				target_time TEXT DEFAULT '06:22' NOT NULL,
				check_in_window_start TEXT DEFAULT '05:30' NOT NULL,
				check_in_window_end TEXT DEFAULT '07:00' NOT NULL,
				location TEXT DEFAULT 'Lapangan Utama Kampus' NOT NULL,
				rombel TEXT DEFAULT 'Semua' NOT NULL,
				is_active BOOLEAN DEFAULT true NOT NULL,
				created_by INTEGER REFERENCES users(id),
				created_at TIMESTAMP DEFAULT NOW() NOT NULL,
				updated_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_morning_assembly_config_cohort ON morning_assembly_schedule_config(cohort);

			-- Presensi Kuliah & Piket (attendance_records extensions)
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

			CREATE INDEX IF NOT EXISTS idx_attendance_records_verification ON attendance_records(verification_status);

			-- ODS Attendance Records
			CREATE TABLE IF NOT EXISTS ods_attendance_records (
				id SERIAL PRIMARY KEY,
				student_id INTEGER NOT NULL REFERENCES students(id),
				date DATE NOT NULL,
				status TEXT NOT NULL,
				notes TEXT,
				selfie_url TEXT,
				latitude DOUBLE PRECISION,
				longitude DOUBLE PRECISION,
				gps_accuracy REAL,
				location_name TEXT,
				distance_from_checkpoint INTEGER,
				checkin_method TEXT DEFAULT 'admin',
				is_within_radius BOOLEAN DEFAULT true,
				selfie_taken_at TIMESTAMP,
				verification_status TEXT DEFAULT 'auto_approved',
				verified_by INTEGER REFERENCES users(id),
				verified_at TIMESTAMP,
				rejection_reason TEXT,
				recorded_by INTEGER REFERENCES users(id),
				recorded_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_ods_attendance_records_student_id ON ods_attendance_records(student_id);
			CREATE INDEX IF NOT EXISTS idx_ods_attendance_records_date ON ods_attendance_records(date);

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

			-- Pra-Magang Attendance Records
			CREATE TABLE IF NOT EXISTS pramagang_attendance_records (
				id SERIAL PRIMARY KEY,
				student_id INTEGER NOT NULL REFERENCES students(id),
				date DATE NOT NULL,
				status TEXT NOT NULL,
				notes TEXT,
				selfie_url TEXT,
				latitude DOUBLE PRECISION,
				longitude DOUBLE PRECISION,
				gps_accuracy REAL,
				location_name TEXT,
				distance_from_checkpoint INTEGER,
				checkin_method TEXT DEFAULT 'admin',
				is_within_radius BOOLEAN DEFAULT true,
				selfie_taken_at TIMESTAMP,
				verification_status TEXT DEFAULT 'auto_approved',
				verified_by INTEGER REFERENCES users(id),
				verified_at TIMESTAMP,
				rejection_reason TEXT,
				recorded_by INTEGER REFERENCES users(id),
				recorded_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_pramagang_attendance_records_student_id ON pramagang_attendance_records(student_id);
			CREATE INDEX IF NOT EXISTS idx_pramagang_attendance_records_date ON pramagang_attendance_records(date);

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

			-- Checkpoint Config & Geolocation
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

			-- Selfie Fraud Flags
			CREATE TABLE IF NOT EXISTS selfie_fraud_flags (
				id SERIAL PRIMARY KEY,
				attendance_type TEXT NOT NULL,
				attendance_record_id INTEGER NOT NULL,
				student_id INTEGER NOT NULL REFERENCES students(id),
				flag_reason TEXT NOT NULL,
				flag_detail JSONB,
				reviewed_by INTEGER REFERENCES users(id),
				reviewed_at TIMESTAMP,
				is_dismissed BOOLEAN DEFAULT false NOT NULL,
				created_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_selfie_fraud_student_id ON selfie_fraud_flags(student_id);
			CREATE INDEX IF NOT EXISTS idx_selfie_fraud_type_record ON selfie_fraud_flags(attendance_type, attendance_record_id);

			-- PA (Pembimbing Akademik) Modules
			CREATE TABLE IF NOT EXISTS pa_hafalan_sessions (
				id SERIAL PRIMARY KEY,
				student_id INTEGER NOT NULL REFERENCES students(id),
				language TEXT NOT NULL,
				language_custom TEXT,
				vocab_count INTEGER DEFAULT 0 NOT NULL,
				sentence_count INTEGER DEFAULT 0 NOT NULL,
				vocab_list JSONB DEFAULT '[]'::jsonb NOT NULL,
				sentence_list JSONB DEFAULT '[]'::jsonb NOT NULL,
				notes TEXT,
				date TIMESTAMP DEFAULT NOW() NOT NULL,
				created_by INTEGER REFERENCES users(id),
				created_at TIMESTAMP DEFAULT NOW() NOT NULL,
				updated_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_pa_hafalan_sessions_student_id ON pa_hafalan_sessions(student_id);

			CREATE TABLE IF NOT EXISTS pa_student_notes (
				id SERIAL PRIMARY KEY,
				student_id INTEGER NOT NULL REFERENCES students(id),
				type TEXT NOT NULL,
				content TEXT NOT NULL,
				date TIMESTAMP DEFAULT NOW(),
				category TEXT DEFAULT 'umum',
				created_by INTEGER REFERENCES users(id),
				created_at TIMESTAMP DEFAULT NOW() NOT NULL,
				updated_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_pa_student_notes_student_id ON pa_student_notes(student_id);

			CREATE TABLE IF NOT EXISTS pa_tripartite_logs (
				id SERIAL PRIMARY KEY,
				student_id INTEGER NOT NULL REFERENCES students(id),
				contact_type TEXT NOT NULL,
				contact_name TEXT,
				contact_date TIMESTAMP NOT NULL,
				summary TEXT NOT NULL,
				result TEXT,
				created_by INTEGER REFERENCES users(id),
				created_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_pa_tripartite_logs_student_id ON pa_tripartite_logs(student_id);

			CREATE TABLE IF NOT EXISTS pa_interview_logs (
				id SERIAL PRIMARY KEY,
				student_id INTEGER NOT NULL REFERENCES students(id),
				interview_date TIMESTAMP NOT NULL,
				company_name TEXT NOT NULL,
				country TEXT,
				result TEXT NOT NULL,
				notes TEXT,
				created_by INTEGER REFERENCES users(id),
				created_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_pa_interview_logs_student_id ON pa_interview_logs(student_id);

			CREATE TABLE IF NOT EXISTS counseling_logs (
				id SERIAL PRIMARY KEY,
				student_id INTEGER NOT NULL REFERENCES students(id),
				type TEXT DEFAULT 'konseling' NOT NULL,
				date TIMESTAMP NOT NULL,
				notes TEXT NOT NULL,
				condition TEXT NOT NULL,
				created_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_counseling_logs_student_id ON counseling_logs(student_id);

			CREATE TABLE IF NOT EXISTS vocab_logs (
				id SERIAL PRIMARY KEY,
				student_id INTEGER NOT NULL REFERENCES students(id),
				date TIMESTAMP NOT NULL,
				added_words INTEGER NOT NULL,
				notes TEXT,
				created_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_vocab_logs_student_id ON vocab_logs(student_id);

			-- Default seedings (Idempotent)
			INSERT INTO attendance_checkpoint_config (type, label, latitude, longitude, radius_meters, is_active, notes)
			SELECT 'baris_pagi', 'Kampus Utama Nusadaya Academy Denpasar', -8.6705, 115.2126, 150, true, 'Default campus checkpoint'
			WHERE NOT EXISTS (SELECT 1 FROM attendance_checkpoint_config WHERE type = 'baris_pagi' AND cohort IS NULL);

			INSERT INTO attendance_checkpoint_config (type, label, latitude, longitude, radius_meters, is_active, notes)
			SELECT 'kuliah', 'Kampus Utama Nusadaya Academy Denpasar', -8.6705, 115.2126, 150, true, 'Default campus checkpoint'
			WHERE NOT EXISTS (SELECT 1 FROM attendance_checkpoint_config WHERE type = 'kuliah' AND cohort IS NULL);

			INSERT INTO attendance_checkpoint_config (type, label, latitude, longitude, radius_meters, is_active, notes)
			SELECT 'piket', 'Kampus Utama Nusadaya Academy Denpasar', -8.6705, 115.2126, 150, true, 'Default campus checkpoint'
			WHERE NOT EXISTS (SELECT 1 FROM attendance_checkpoint_config WHERE type = 'piket' AND cohort IS NULL);

			INSERT INTO attendance_checkpoint_config (type, label, latitude, longitude, radius_meters, is_active, notes)
			SELECT 'ods', 'Kampus Utama Nusadaya Academy Denpasar', -8.6705, 115.2126, 150, true, 'Default campus checkpoint'
			WHERE NOT EXISTS (SELECT 1 FROM attendance_checkpoint_config WHERE type = 'ods' AND cohort IS NULL);

			INSERT INTO morning_assembly_schedule_config (cohort, day_of_week, target_time, check_in_window_start, check_in_window_end, location, rombel, is_active)
			SELECT 16, 1, '06:22', '05:30', '07:00', 'Lapangan Utama Kampus', 'Semua', true
			WHERE NOT EXISTS (SELECT 1 FROM morning_assembly_schedule_config WHERE cohort = 16);
		`);
	} catch (err) {
		console.warn("[Database] Schema check warning:", err);
	}
}
