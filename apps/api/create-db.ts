import postgres from "postgres";

// Connect to default 'postgres' database
const sql = postgres("postgresql://postgres:postgres@localhost:5432/postgres");

async function main() {
	try {
		console.log('Attempting to create database "nusadaya"...');
		await sql`CREATE DATABASE nusadaya;`;
		console.log('Database "nusadaya" created successfully!');
	} catch (e: unknown) {
		const err = e as Error;
		if (err.message?.includes("already exists")) {
			console.log('Database "nusadaya" already exists.');
		} else {
			console.error("Error creating database:", e);
		}
	} finally {
		await sql.end();
	}
}

main();
