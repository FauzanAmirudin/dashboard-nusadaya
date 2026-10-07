import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { normalizeEmail } from "../src/lib/normalize";

async function main() {
	const targetEmail = normalizeEmail(
		process.env.SUPERADMIN_EMAIL || "onedatanusadaya@gmail.com",
	)!;
	console.log(`Mengupdate email superadmin menjadi: ${targetEmail}...`);

	const existing = await db.query.users.findFirst({
		where: eq(users.username, "superadmin"),
	});

	if (!existing) {
		console.error("Akun superadmin belum ditemukan di database!");
		process.exit(1);
	}

	await db
		.update(users)
		.set({
			email: targetEmail,
			updatedAt: new Date(),
		})
		.where(eq(users.id, existing.id));

	console.log(
		`✅ Sukses! Akun superadmin (ID: ${existing.id}) sekarang memiliki email: ${targetEmail}`,
	);
	process.exit(0);
}

main().catch((err) => {
	console.error("Gagal mengupdate email superadmin:", err);
	process.exit(1);
});
