import { db } from './src/db'; 
import { sql } from 'drizzle-orm'; 

async function dropAll() {
    await db.execute(sql`DROP SCHEMA public CASCADE;`);
    await db.execute(sql`CREATE SCHEMA public;`);
    console.log('Dropped all tables in public schema');
    process.exit(0);
}

dropAll();
