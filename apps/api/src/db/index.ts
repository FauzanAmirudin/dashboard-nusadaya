import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:5432/nusadaya";

export const client = postgres(connectionString, {
	max: 25,
	idle_timeout: 30,
	connect_timeout: 10,
	max_lifetime: 60 * 30,
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
	} catch (err) {
		console.warn("[Database] Schema check warning:", err);
	}
}
