import { eq, isNull } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { normalizeEmail } from "../src/lib/normalize";

const DEMO_EMAILS: Record<string, string> = {
	pmb: "pmb@nusadaya.ac.id",
	crm: "crm@nusadaya.ac.id",
	finance: "finance@nusadaya.ac.id",
	akademik: "akademik@nusadaya.ac.id",
	pa: "pa@nusadaya.ac.id",
	magang: "magang@nusadaya.ac.id",
};

async function main() {
	console.log(
		"Memperbarui akun staf tanpa email untuk mendukung login via email...",
	);

	for (const [username, email] of Object.entries(DEMO_EMAILS)) {
		const targetEmail = normalizeEmail(email)!;
		const user = await db.query.users.findFirst({
			where: eq(users.username, username),
		});

		if (user && !user.email) {
			await db
				.update(users)
				.set({ email: targetEmail, updatedAt: new Date() })
				.where(eq(users.id, user.id));
			console.log(`✅ [${username}] -> ${targetEmail}`);
		}
	}

	console.log("Selesai memperbarui akun demo.");
	process.exit(0);
}

main().catch((err) => {
	console.error("Gagal memperbarui email demo:", err);
	process.exit(1);
});
