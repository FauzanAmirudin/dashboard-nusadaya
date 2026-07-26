import { eq, isNull } from "drizzle-orm";
import { db } from "../src/db";
import { students, users } from "../src/db/schema";

async function run() {
	console.log("Mencari mahasiswa yang belum memiliki akun...");
	const allStudents = await db.query.students.findMany({
		where: isNull(students.studentUserId),
	});

	console.log(
		`Ditemukan ${allStudents.length} mahasiswa yang belum memiliki akun.`,
	);

	if (allStudents.length === 0) {
		console.log("Selesai!");
		process.exit(0);
	}

	const passwordHash = await Bun.password.hash("password");

	for (const s of allStudents) {
		console.log(`Membuat akun untuk: ${s.nim} - ${s.name}`);
		const [newUser] = await db
			.insert(users)
			.values({
				username: s.nim,
				passwordHash,
				fullName: s.name,
				role: "mahasiswa",
			})
			.returning();

		await db
			.update(students)
			.set({
				studentUserId: newUser.id,
				updatedAt: new Date(),
			})
			.where(eq(students.id, s.id));
	}

	console.log("Semua akun mahasiswa telah berhasil dibuat!");
	process.exit(0);
}

run().catch(console.error);
