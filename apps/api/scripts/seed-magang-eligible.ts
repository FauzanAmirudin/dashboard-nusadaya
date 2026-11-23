/**
 * Skrip one-off (demo/dev): meloloskan satu mahasiswa ke gerbang prasyarat Panel Magang.
 *
 * Prasyarat Magang (lihat src/lib/magang-prerequisites.ts & web src/utils/panel-logic.ts):
 *   ACC PMB + ACC CRM + ACC Akademik + Registrasi lunas + SPP Semester 1 lunas.
 *
 * Jalankan: bun run scripts/seed-magang-eligible.ts [NIM]   (default NIM 240002 / Budi Santoso)
 *
 * Idempoten: aman dijalankan berulang. Menulis hanya ke baris mahasiswa target.
 * CATATAN: skrip ini menembus alur ACC resmi (acc_by dibiarkan kosong, tanpa log divisi).
 * Hanya untuk data demo/pengembangan — jangan dipakai di produksi.
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
	academicData,
	crmData,
	financeData,
	internshipData,
	students,
} from "../src/db/schema";
import { computeMagangPrerequisites } from "../src/lib/magang-prerequisites";

const TARGET_NIM = process.argv[2] || "240002";

async function readPrereqState(studentId: number) {
	const [pmb, crm, academic, finance] = await Promise.all([
		db.query.pmbData.findFirst({
			where: (t, { eq: e }) => e(t.studentId, studentId),
			columns: { isAcc: true },
		}),
		db.query.crmData.findFirst({
			where: (t, { eq: e }) => e(t.studentId, studentId),
			columns: { isAcc: true },
		}),
		db.query.academicData.findFirst({
			where: (t, { eq: e }) => e(t.studentId, studentId),
			columns: { isAcc: true },
		}),
		db.query.financeData.findFirst({
			where: (t, { eq: e }) => e(t.studentId, studentId),
			columns: {
				registrasiStatus: true,
				metodePembayaran: true,
				talanganTipe: true,
				mandiriSemesterStatus: true,
				t1SemesterStatus: true,
			},
		}),
	]);
	return {
		rows: { pmb, crm, academic, finance },
		prereq: computeMagangPrerequisites({ pmb, crm, academic, finance }),
	};
}

function printPrereq(
	label: string,
	prereq: ReturnType<typeof computeMagangPrerequisites>,
) {
	console.log(`\n${label}`);
	for (const item of prereq.items) {
		console.log(`   ${item.ok ? "[v]" : "[ ]"} ${item.label}`);
	}
	console.log(
		`   => ${prereq.ok ? "LOLOS prasyarat Magang" : `kurang: ${prereq.missing.join(", ")}`}`,
	);
}

async function main() {
	const student = await db.query.students.findFirst({
		where: eq(students.nim, TARGET_NIM),
		columns: { id: true, nim: true, name: true, cohort: true, program: true },
	});

	if (!student) {
		console.error(`Mahasiswa dengan NIM ${TARGET_NIM} tidak ditemukan. Batal.`);
		process.exit(1);
	}

	console.log(
		`Target: ${student.name} (NIM ${student.nim}, ID ${student.id}, angkatan ${student.cohort}, ${student.program})`,
	);

	const before = await readPrereqState(student.id);
	printPrereq("Sebelum:", before.prereq);

	if (before.prereq.ok) {
		console.log("\nSudah memenuhi semua prasyarat. Tidak ada yang diubah.");
		process.exit(0);
	}

	const now = new Date();

	// --- CRM: checklist ODS + ACC -------------------------------------------
	if (before.rows.crm) {
		await db
			.update(crmData)
			.set({
				odsActive: true,
				studentMonitoring: true,
				parentFollowUp: true,
				practiceAttendance: true,
				odsDocumentation: true,
				isAcc: true,
				accAt: now,
				status: "AMAN",
				updatedAt: now,
			})
			.where(eq(crmData.studentId, student.id));
		console.log("- crm_data diperbarui (checklist ODS lengkap + ACC).");
	} else {
		console.warn("! crm_data tidak ada untuk mahasiswa ini — dilewati.");
	}

	// --- Akademik: ACC -------------------------------------------------------
	if (before.rows.academic) {
		await db
			.update(academicData)
			.set({ isAcc: true, accAt: now, status: "AMAN", updatedAt: now })
			.where(eq(academicData.studentId, student.id));
		console.log("- academic_data diperbarui (ACC Akademik).");
	} else {
		console.warn("! academic_data tidak ada untuk mahasiswa ini — dilewati.");
	}

	// --- Finance: Registrasi + SPP Semester 1 lunas (jalur mandiri) ---------
	if (before.rows.finance) {
		await db
			.update(financeData)
			.set({
				registrasiStatus: true,
				metodePembayaran: "mandiri",
				mandiriSemesterStatus: true,
				updatedAt: now,
			})
			.where(eq(financeData.studentId, student.id));
		console.log(
			"- finance_data diperbarui (Registrasi lunas + SPP Semester 1 lunas, metode mandiri).",
		);
	} else {
		console.warn("! finance_data tidak ada untuk mahasiswa ini — dilewati.");
	}

	// --- Magang: pastikan barisnya ada, checklist dibiarkan kosong ----------
	const internship = await db.query.internshipData.findFirst({
		where: eq(internshipData.studentId, student.id),
		columns: { id: true },
	});
	if (!internship) {
		await db.insert(internshipData).values({ studentId: student.id });
		console.log("- internship_data dibuat (checklist kosong).");
	} else {
		console.log("- internship_data sudah ada — checklist tidak disentuh.");
	}

	const after = await readPrereqState(student.id);
	printPrereq("Sesudah:", after.prereq);

	console.log(
		after.prereq.ok
			? "\nSelesai. Mahasiswa akan muncul di Dashboard Magang (status awal: Butuh Perhatian, karena checklist keberangkatan masih kosong)."
			: "\nMasih ada prasyarat yang kurang — periksa peringatan di atas.",
	);
	process.exit(0);
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
