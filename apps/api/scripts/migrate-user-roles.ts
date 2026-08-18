import postgres from "postgres";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:5432/nusadaya";

const sql = postgres(connectionString);

async function main() {
	console.log("Adding roles column to users table if not exists...");
	await sql`
		ALTER TABLE users 
		ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]'::jsonb;
	`;

	console.log("Migrating existing user roles to roles array...");
	await sql`
		UPDATE users 
		SET roles = jsonb_build_array(role) 
		WHERE roles IS NULL OR jsonb_array_length(roles) = 0;
	`;

	console.log("Successfully migrated user roles!");
	process.exit(0);
}

main().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
