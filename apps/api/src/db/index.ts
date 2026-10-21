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
		`);
	} catch (err) {
		console.warn("[Database] Schema check warning:", err);
	}
}
