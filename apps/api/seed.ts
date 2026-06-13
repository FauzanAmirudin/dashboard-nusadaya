import { db } from "./src/db";
import {
	users,
	students,
	pmbData,
	crmData,
	financeData,
	academicData,
	internshipData,
	finalDecision,
	courseGrades,
	paData,
	vocabLogs,
	counselingLogs,
} from "./src/db/schema";
import { sql } from "drizzle-orm";

async function seed() {
	console.log("Starting database seeding...");

	// Wipe existing data
	await db.execute(sql`TRUNCATE TABLE users CASCADE;`);
	await db.execute(sql`TRUNCATE TABLE students CASCADE;`);
	console.log("Cleared existing data.");

	// 1. Seed Users
	const password = "password";
	const passwordHash = await Bun.password.hash(password);

	const demoAccounts = [
		{ username: "superadmin", fullName: "Demo Superadmin", role: "superadmin" as const },
		{ username: "pmb", fullName: "Divisi PMB", role: "pmb" as const },
		{ username: "crm", fullName: "Divisi CRM", role: "crm" as const },
		{ username: "finance", fullName: "Divisi Finance", role: "finance" as const },
		{ username: "akademik", fullName: "Divisi Akademik", role: "akademik" as const },
		{ username: "dosen", fullName: "Dosen Pengajar", role: "dosen" as const },
		{ username: "pa", fullName: "Pembimbing Akademik", role: "pa" as const },
		{ username: "magang", fullName: "Tim Magang", role: "magang" as const },
		{ username: "evaluator", fullName: "Tim Evaluator", role: "evaluator" as const },
	];

	const insertedUsers = await db.insert(users).values(
		demoAccounts.map((account) => ({ ...account, passwordHash }))
	).returning();
	console.log("Successfully seeded 9 demo accounts!");
	
	const dosenUser = insertedUsers.find(u => u.role === "dosen");

	// 2. Seed Students
	const newStudents = await db.insert(students).values([
		{ nim: "240001", name: "Ahmad Fauzan", cohort: 2024, program: "Hospitality", overallStatus: "TIDAK_AMAN" },
		{ nim: "240002", name: "Budi Santoso", cohort: 2024, program: "Culinary", overallStatus: "PERLU_PERHATIAN" },
		{ nim: "240003", name: "Cici Amelia", cohort: 2024, program: "Hospitality", overallStatus: "AMAN" },
	]).returning();

	// 3. Seed Division Data for each student
	// Student 1: Ahmad (Merah - Finance nunggak)
	await db.insert(pmbData).values({ studentId: newStudents[0].id, formReceived: true, documentsComplete: true, dataInputted: true, initialFollowUp: true, isAcc: true, accAt: new Date(), status: "AMAN" });
	await db.insert(crmData).values({ studentId: newStudents[0].id, odsActive: true, studentMonitoring: true, parentFollowUp: true, practiceAttendance: true, odsDocumentation: true, isAcc: true, accAt: new Date(), status: "AMAN" });
	await db.insert(financeData).values({ studentId: newStudents[0].id, registrationPaid: false, semesterPaid: false, installmentCleared: false, arrearsCleared: false, status: "TIDAK_AMAN" });
	await db.insert(academicData).values({ studentId: newStudents[0].id, gpa: 350, creditsCompleted: 20, status: "AMAN" });
	await db.insert(paData).values({ studentId: newStudents[0].id, counselingDone: false, mentalStable: true, disciplineGood: true, status: "PERLU_PERHATIAN" });
	await db.insert(internshipData).values({ studentId: newStudents[0].id, passportReady: true, passportNo: "A1234567", passportExp: new Date("2030-01-01"), interviewReady: true, interviewDate: new Date("2026-05-15"), interviewResult: "Lulus", loaReady: true, loaCompany: "Grand Hyatt Taipei", loaPosition: "F&B Service", contractReady: true, contractDate: new Date("2026-06-01"), mcuReady: true, mcuPlace: "RS Siloam", mcuDate: new Date("2026-05-20"), mcuResult: "Lulus", visaReady: false, ticketReady: false, pdtReady: false, estDepartureDate: new Date("2026-08-01"), destinationCity: "Taipei, Taiwan", internshipDuration: "6 Bulan", internshipCompany: "Grand Hyatt Taipei", status: "PERLU_PERHATIAN" });
	await db.insert(finalDecision).values({ studentId: newStudents[0].id });

	// Student 2: Budi (Kuning - Akademik kurang)
	await db.insert(pmbData).values({ studentId: newStudents[1].id, formReceived: true, documentsComplete: true, dataInputted: true, initialFollowUp: true, isAcc: true, accAt: new Date(), status: "AMAN" });
	await db.insert(crmData).values({ studentId: newStudents[1].id, odsActive: true, studentMonitoring: false, parentFollowUp: false, practiceAttendance: false, odsDocumentation: false, status: "PERLU_PERHATIAN" });
	await db.insert(financeData).values({ studentId: newStudents[1].id, registrationPaid: true, semesterPaid: true, installmentCleared: true, arrearsCleared: true, isAcc: true, accAt: new Date(), status: "AMAN" });
	await db.insert(academicData).values({ studentId: newStudents[1].id, gpa: 250, creditsCompleted: 15, status: "PERLU_PERHATIAN" });
	await db.insert(paData).values({ studentId: newStudents[1].id, counselingDone: false, mentalStable: false, disciplineGood: false, status: "TIDAK_AMAN" });
	await db.insert(internshipData).values({ studentId: newStudents[1].id, passportReady: false, interviewReady: false, loaReady: false, contractReady: false, mcuReady: false, visaReady: false, ticketReady: false, pdtReady: false, status: "TIDAK_AMAN" });
	await db.insert(finalDecision).values({ studentId: newStudents[1].id });

	// Student 3: Cici (Hijau - Aman semua)
	await db.insert(pmbData).values({ studentId: newStudents[2].id, formReceived: true, documentsComplete: true, dataInputted: true, initialFollowUp: true, isAcc: true, accAt: new Date(), status: "AMAN" });
	await db.insert(crmData).values({ studentId: newStudents[2].id, odsActive: true, studentMonitoring: true, parentFollowUp: true, practiceAttendance: true, odsDocumentation: true, isAcc: true, accAt: new Date(), status: "AMAN" });
	await db.insert(financeData).values({ studentId: newStudents[2].id, registrationPaid: true, semesterPaid: true, installmentCleared: true, arrearsCleared: true, isAcc: true, accAt: new Date(), status: "AMAN" });
	await db.insert(academicData).values({ studentId: newStudents[2].id, gpa: 390, creditsCompleted: 20, status: "AMAN" });
	await db.insert(paData).values({ studentId: newStudents[2].id, counselingDone: true, mentalStable: true, disciplineGood: true, isAcc: true, accAt: new Date(), status: "AMAN" });
	await db.insert(internshipData).values({ studentId: newStudents[2].id, passportReady: true, passportNo: "C9876543", passportExp: new Date("2032-12-31"), interviewReady: true, interviewDate: new Date("2026-04-10"), interviewResult: "Lulus", loaReady: true, loaCompany: "Ritz-Carlton Tokyo", loaPosition: "Front Desk", contractReady: true, contractDate: new Date("2026-05-01"), mcuReady: true, mcuPlace: "RS MMC", mcuDate: new Date("2026-04-15"), mcuResult: "Lulus", visaReady: true, visaType: "Work", visaStatus: "Approved", visaNo: "V99887766", ticketReady: true, ticketAirline: "JAL", ticketDate: new Date("2026-07-20"), ticketFlight: "JL720", pdtReady: true, pdtDate: new Date("2026-07-15"), pdtPlace: "Kampus Utama", estDepartureDate: new Date("2026-07-20"), destinationCity: "Tokyo, Japan", internshipDuration: "1 Tahun", internshipCompany: "Ritz-Carlton Tokyo", isAcc: true, accAt: new Date(), status: "AMAN" });
	await db.insert(finalDecision).values({ studentId: newStudents[2].id });

	// Seed Course Grades for Student 1
	if (dosenUser) {
		await db.insert(courseGrades).values([
			{ studentId: newStudents[0].id, courseCode: "FO101", courseName: "Front Office", dosenId: dosenUser.id, grade: "A", attendanceRate: 85, attitudeNote: "Baik", status: "AMAN" },
			{ studentId: newStudents[0].id, courseCode: "HK101", courseName: "Housekeeping", dosenId: dosenUser.id, grade: "B+", attendanceRate: 72, attitudeNote: "Baik", status: "AMAN" },
			{ studentId: newStudents[0].id, courseCode: "FB101", courseName: "Food & Beverage", dosenId: dosenUser.id, grade: "B", attendanceRate: 65, attitudeNote: "Cukup", status: "PERLU_PERHATIAN" },
			{ studentId: newStudents[0].id, courseCode: "ENG101", courseName: "Bahasa Inggris", dosenId: dosenUser.id, grade: "A", attendanceRate: 90, attitudeNote: "Baik", status: "AMAN" },
			{ studentId: newStudents[0].id, courseCode: "ETH101", courseName: "Etika Profesi", dosenId: dosenUser.id, grade: "C+", attendanceRate: 45, attitudeNote: "Buruk", status: "TIDAK_AMAN" },
			{ studentId: newStudents[0].id, courseCode: "GRO101", courseName: "Grooming", dosenId: dosenUser.id, grade: "B+", attendanceRate: 78, attitudeNote: "Baik", status: "AMAN" },
		]);
	}

	// Seed PA Logs for Student 1
	await db.insert(vocabLogs).values([
		{ studentId: newStudents[0].id, date: new Date("2026-05-25"), addedWords: 60 },
		{ studentId: newStudents[0].id, date: new Date("2026-06-01"), addedWords: 80 },
		{ studentId: newStudents[0].id, date: new Date("2026-06-08"), addedWords: 50 },
	]);

	await db.insert(counselingLogs).values([
		{ studentId: newStudents[0].id, date: new Date("2026-05-30"), condition: "Perlu Perhatian", notes: "Sedikit cemas tentang program bahasa, sudah diberikan motivasi dan target kosakata" },
		{ studentId: newStudents[0].id, date: new Date("2026-06-07"), condition: "Stabil", notes: "Mahasiswa menunjukkan semangat tinggi dan tidak ada indikasi kecemasan terhadap program magang" },
	]);

	console.log("Successfully seeded 3 dummy students with module data!");
	process.exit(0);
}

seed().catch((err) => {
	console.error("Seeding failed:", err);
	process.exit(1);
});
