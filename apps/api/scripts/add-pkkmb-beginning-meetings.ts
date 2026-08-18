import { and, asc, eq } from "drizzle-orm";
import { db } from "../src/db";
import { courseMeetings, courses } from "../src/db/schema";

async function addPkkmbAndBeginning() {
	console.log(
		"🚀 Menambahkan PKKMB dan Beginning Class ke seluruh mata kuliah...",
	);

	const allCourses = await db.query.courses.findMany({
		with: {
			meetings: {
				orderBy: [asc(courseMeetings.meetingNumber)],
			},
		},
	});

	console.log(`Ditemukan ${allCourses.length} mata kuliah.`);

	for (const course of allCourses) {
		console.log(
			`\nMemproses MK [${course.id}] ${course.code} - ${course.name}...`,
		);

		// Check if PKKMB exists
		const hasPkkmb = course.meetings.some(
			(m) => m.meetingType === "pkkmb" || m.meetingNumber === -1,
		);

		if (!hasPkkmb) {
			console.log(`➕ Menambahkan sesi PKKMB...`);
			await db.insert(courseMeetings).values({
				courseId: course.id,
				meetingNumber: -1,
				meetingType: "pkkmb",
				meetingLabel: "PKKMB - Pengenalan Program",
				description: "Pengenalan Program Perkuliahan & Kebijakan Kampus",
			});
		} else {
			console.log(`ℹ️ Sesi PKKMB sudah ada.`);
		}

		// Check if Beginning Class exists
		const hasBeginning = course.meetings.some(
			(m) => m.meetingType === "beginning" || m.meetingNumber === 0,
		);

		if (!hasBeginning) {
			console.log(`➕ Menambahkan sesi Beginning Class...`);
			await db.insert(courseMeetings).values({
				courseId: course.id,
				meetingNumber: 0,
				meetingType: "beginning",
				meetingLabel: "Beginning Class & Kontrak Kuliah",
				description: "Orientasi Perkuliahan, Silabus, dan Kontrak Belajar",
			});
		} else {
			console.log(`ℹ️ Sesi Beginning Class sudah ada.`);
		}
	}

	console.log(
		"\n✅ Berhasil menambahkan PKKMB dan Beginning Class ke seluruh mata kuliah!",
	);
}

addPkkmbAndBeginning()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("❌ Terjadi kesalahan migrasi:", err);
		process.exit(1);
	});
