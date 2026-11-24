import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { internshipData, students } from "../src/db/schema";

async function seedAhliWaris() {
	console.log(
		"Seeding sample Ahli Waris & SOP Hong Ta data for Kenjiro Pratama (250011)...",
	);

	const kenjiro = await db.query.students.findFirst({
		where: eq(students.nim, "250011"),
	});

	if (!kenjiro) {
		console.log(
			"Student Kenjiro (250011) not found, finding first Taiwan student...",
		);
		const taiwanStudent = await db.query.students.findFirst({
			where: eq(students.destinationCountry, "Taiwan"),
		});
		if (!taiwanStudent) {
			console.log("No Taiwan student found.");
			process.exit(0);
		}
		await updateStudent(taiwanStudent.id);
	} else {
		await updateStudent(kenjiro.id);
	}

	console.log("Sample Ahli Waris seeded successfully!");
	process.exit(0);
}

async function updateStudent(studentId: number) {
	await db
		.update(internshipData)
		.set({
			mitraPenempatanNama: "Hong Ta",
			internshipCompany: "Grand Hotel Taipei",
			agenNegaraTujuan: "Taiwan",
			destinationCity: "Taipei",
			internshipDuration: "12 Bulan (1 Tahun)",
			agenPeminatan: "HK",
			ahliWarisNama: "Bambang Pratama",
			ahliWarisHubungan: "Orang Tua (Ayah)",
			ahliWarisNik: "3201011203750001",
			ahliWarisPhone: "081298765432",
			ahliWarisAlamat:
				"Jl. Raya Bogor No. 45, Cibinong, Kab. Bogor, Jawa Barat",
			ahliWarisBank: "BCA",
			ahliWarisRekening: "8830192841",
			ahliWarisAtasNama: "Bambang Pratama",
			ahliWarisReady: true,
			asuransiHongTaReady: true,
			asuransiPolisNo: "HT-TW-2026-88192",
			updatedAt: new Date(),
		})
		.where(eq(internshipData.studentId, studentId));
}

seedAhliWaris().catch((e) => {
	console.error(e);
	process.exit(1);
});
