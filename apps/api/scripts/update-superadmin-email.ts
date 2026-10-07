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

	if (existing) {
		await db
			.update(users)
			.set({
				email: targetEmail,
				updatedAt: new Date(),
			})
			.where(eq(users.id, existing.id));

		console.log(
			`✅ Sukses! Akun superadmin yang ada (ID: ${existing.id}) sekarang terhubung ke email: ${targetEmail}`,
		);
	} else {
		const passwordHash = await Bun.password.hash("password");
		const [newUser] = await db
			.insert(users)
			.values({
				username: "superadmin",
				passwordHash,
				fullName: "Superadmin Nusadaya",
				role: "superadmin",
				roles: ["superadmin"],
				email: targetEmail,
			})
			.returning();

		console.log(
			`✅ Sukses! Akun superadmin baru (ID: ${newUser.id}) berhasil dibuat dengan email: ${targetEmail}`,
		);
	}
	process.exit(0);
}

main().catch((err) => {
	console.error("Gagal mengupdate email superadmin:", err);
	process.exit(1);
});
