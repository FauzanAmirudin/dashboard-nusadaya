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
			UPDATE users 
			SET roles = jsonb_build_array(role) 
			WHERE roles IS NULL OR jsonb_array_length(roles) = 0;
		`;
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
	} catch (err) {
		console.warn("[Database] Schema check warning:", err);
	}
}
