import { sql } from "drizzle-orm";
import postgres from "postgres";
import { db } from "./src/db";
import {
	academicData,
	counselingLogs,
	courseGrades,
	courseMeetings,
	courses,
	crmData,
	finalDecision,
	financeData,
	internshipData,
	paData,
	pmbData,
	students,
	users,
	vocabLogs,
} from "./src/db/schema";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:5432/nusadaya";
const rawClient = postgres(connectionString);

async function seed() {
	console.log("Ensuring database schema compatibility...");

	// Execute direct raw DDL queries to create all missing columns in PostgreSQL
	try {
		await rawClient.unsafe(`
			ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;
			ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;
			ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_photo_url" text;

			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "doc_ktp" boolean DEFAULT false;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "doc_kk" boolean DEFAULT false;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "doc_cv" boolean DEFAULT false;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "doc_ijazah" boolean DEFAULT false;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "doc_transkrip" boolean DEFAULT false;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "doc_passport_depan" boolean DEFAULT false;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "doc_passport_visa" boolean DEFAULT false;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "doc_skbm" boolean DEFAULT false;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "doc_mcu" boolean DEFAULT false;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "doc_sertifikasi_bahasa" boolean DEFAULT false;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "rumah_juang" boolean DEFAULT false;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "rekomendasi" text;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "tim_visit" text;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "tim_sosialisasi" text;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "ro_referral" text;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "mitra_sponsor" text;
			ALTER TABLE "pmb_data" ADD COLUMN IF NOT EXISTS "koordinator" text;
		`);
		console.log("Database schema checked and updated successfully!");
	} catch (err) {
		console.log("Schema update notice:", err);
	}

	// Wipe existing data
	await db.execute(sql`TRUNCATE TABLE users CASCADE;`);
	await db.execute(sql`TRUNCATE TABLE students CASCADE;`);
	console.log("Cleared existing data.");

	// 1. Seed Users
	const password = "password";
	const passwordHash = await Bun.password.hash(password);

	const demoAccounts = [
		{
			username: "superadmin",
			fullName: "Demo Superadmin",
			role: "superadmin" as const,
		},
		{ username: "pmb", fullName: "Divisi PMB", role: "pmb" as const },
		{ username: "crm", fullName: "Divisi CRM", role: "crm" as const },
		{
			username: "finance",
			fullName: "Divisi Finance",
			role: "finance" as const,
		},
		{
			username: "akademik",
			fullName: "Divisi Akademik",
			role: "akademik" as const,
		},
		{ username: "dosen", fullName: "Dosen Pengajar", role: "dosen" as const },
		{ username: "pa", fullName: "Pembimbing Akademik", role: "pa" as const },
		{ username: "magang", fullName: "Tim Magang", role: "magang" as const },
	];

	const insertedUsers = await db
		.insert(users)
		.values(demoAccounts.map((account) => ({ ...account, passwordHash })))
		.returning();
	console.log("Successfully seeded 9 demo accounts!");

	const dosenUser = insertedUsers.find((u) => u.role === "dosen");

	// 2. Seed Students
	const newStudents = await db
		.insert(students)
		.values([
			{
				nim: "240001",
				name: "Ahmad Fauzan",
				cohort: 2024,
				program: "Hospitality",
				overallStatus: "TIDAK_AMAN",
			},
			{
				nim: "240002",
				name: "Budi Santoso",
				cohort: 2024,
				program: "Culinary",
				overallStatus: "PERLU_PERHATIAN",
			},
			{
				nim: "240003",
				name: "Cici Amelia",
				cohort: 2024,
				program: "Hospitality",
				overallStatus: "AMAN",
			},
		])
		.returning();

	// 3. Seed Division Data for each student
	// Student 1: Ahmad (Merah - Finance nunggak)
	await db.insert(pmbData).values({
		studentId: newStudents[0].id,
		formReceived: true,
		documentsComplete: true,
		dataInputted: true,
		initialFollowUp: true,
		isAcc: true,
		accAt: new Date(),
		status: "AMAN",
	});
	await db.insert(crmData).values({
		studentId: newStudents[0].id,
		odsActive: true,
		studentMonitoring: true,
		parentFollowUp: true,
		practiceAttendance: true,
		odsDocumentation: true,
		isAcc: true,
		accAt: new Date(),
		status: "AMAN",
	});
	await db.insert(financeData).values({
		studentId: newStudents[0].id,
		// 		registrationPaid: false,
		// 		semesterPaid: false,
		// 		installmentCleared: false,
		// 		arrearsCleared: false,
		status: "TIDAK_AMAN",
	});
	await db.insert(academicData).values({
		studentId: newStudents[0].id,
		gpa: 350,
		creditsCompleted: 20,
		status: "AMAN",
	});
	await db.insert(paData).values({
		studentId: newStudents[0].id,
		counselingDone: false,
		mentalStable: true,
		disciplineGood: true,
		status: "PERLU_PERHATIAN",
	});
	await db.insert(internshipData).values({
		studentId: newStudents[0].id,
		passportReady: true,
		passportNo: "A1234567",
		passportExp: new Date("2030-01-01"),
		interviewReady: true,
		interviewDate: new Date("2026-05-15"),
		interviewResult: "Lulus",
		loaReady: true,
		loaCompany: "Grand Hyatt Taipei",
		loaPosition: "F&B Service",
		contractReady: true,
		contractDate: new Date("2026-06-01"),
		mcuReady: true,
		mcuPlace: "RS Siloam",
		mcuDate: new Date("2026-05-20"),
		mcuResult: "Lulus",
		visaReady: false,
		ticketReady: false,
		pdtReady: false,
		estDepartureDate: new Date("2026-08-01"),
		destinationCity: "Taipei, Taiwan",
		internshipDuration: "6 Bulan",
		internshipCompany: "Grand Hyatt Taipei",
		status: "PERLU_PERHATIAN",
	});
	await db.insert(finalDecision).values({ studentId: newStudents[0].id });

	// Student 2: Budi (Kuning - Akademik kurang)
	await db.insert(pmbData).values({
		studentId: newStudents[1].id,
		formReceived: true,
		documentsComplete: true,
		dataInputted: true,
		initialFollowUp: true,
		isAcc: true,
		accAt: new Date(),
		status: "AMAN",
	});
	await db.insert(crmData).values({
		studentId: newStudents[1].id,
		odsActive: true,
		studentMonitoring: false,
		parentFollowUp: false,
		practiceAttendance: false,
		odsDocumentation: false,
		status: "PERLU_PERHATIAN",
	});
	await db.insert(financeData).values({
		studentId: newStudents[1].id,
		// 		registrationPaid: true,
		// 		semesterPaid: true,
		// 		installmentCleared: true,
		// 		arrearsCleared: true,
		isAcc: true,
		accAt: new Date(),
		status: "AMAN",
	});
	await db.insert(academicData).values({
		studentId: newStudents[1].id,
		gpa: 250,
		creditsCompleted: 15,
		status: "PERLU_PERHATIAN",
	});
	await db.insert(paData).values({
		studentId: newStudents[1].id,
		counselingDone: false,
		mentalStable: false,
		disciplineGood: false,
		status: "TIDAK_AMAN",
	});
	await db.insert(internshipData).values({
		studentId: newStudents[1].id,
		passportReady: false,
		interviewReady: false,
		loaReady: false,
		contractReady: false,
		mcuReady: false,
		visaReady: false,
		ticketReady: false,
		pdtReady: false,
		status: "TIDAK_AMAN",
	});
	await db.insert(finalDecision).values({ studentId: newStudents[1].id });

	// Student 3: Cici (Hijau - Aman semua)
	await db.insert(pmbData).values({
		studentId: newStudents[2].id,
		formReceived: true,
		documentsComplete: true,
		dataInputted: true,
		initialFollowUp: true,
		isAcc: true,
		accAt: new Date(),
		status: "AMAN",
	});
	await db.insert(crmData).values({
		studentId: newStudents[2].id,
		odsActive: true,
		studentMonitoring: true,
		parentFollowUp: true,
		practiceAttendance: true,
		odsDocumentation: true,
		isAcc: true,
		accAt: new Date(),
		status: "AMAN",
	});
	await db.insert(financeData).values({
		studentId: newStudents[2].id,
		// 		registrationPaid: true,
		// 		semesterPaid: true,
		// 		installmentCleared: true,
		// 		arrearsCleared: true,
		isAcc: true,
		accAt: new Date(),
		status: "AMAN",
	});
	await db.insert(academicData).values({
		studentId: newStudents[2].id,
		gpa: 390,
		creditsCompleted: 20,
		status: "AMAN",
	});
	await db.insert(paData).values({
		studentId: newStudents[2].id,
		counselingDone: true,
		mentalStable: true,
		disciplineGood: true,
		isAcc: true,
		accAt: new Date(),
		status: "AMAN",
	});
	await db.insert(internshipData).values({
		studentId: newStudents[2].id,
		passportReady: true,
		passportNo: "C9876543",
		passportExp: new Date("2032-12-31"),
		interviewReady: true,
		interviewDate: new Date("2026-04-10"),
		interviewResult: "Lulus",
		loaReady: true,
		loaCompany: "Ritz-Carlton Tokyo",
		loaPosition: "Front Desk",
		contractReady: true,
		contractDate: new Date("2026-05-01"),
		mcuReady: true,
		mcuPlace: "RS MMC",
		mcuDate: new Date("2026-04-15"),
		mcuResult: "Lulus",
		visaReady: true,
		visaType: "Work",
		visaStatus: "Approved",
		visaNo: "V99887766",
		ticketReady: true,
		ticketAirline: "JAL",
		ticketDate: new Date("2026-07-20"),
		ticketFlight: "JL720",
		pdtReady: true,
		pdtDate: new Date("2026-07-15"),
		pdtPlace: "Kampus Utama",
		estDepartureDate: new Date("2026-07-20"),
		destinationCity: "Tokyo, Japan",
		internshipDuration: "1 Tahun",
		internshipCompany: "Ritz-Carlton Tokyo",
		isAcc: true,
		accAt: new Date(),
		status: "AMAN",
	});
	await db.insert(finalDecision).values({ studentId: newStudents[2].id });

	// Seed Master Courses & 18 Meetings for Dosen User
	if (dosenUser) {
		const masterCourses = [
			{
				code: "FO101",
				name: "Front Office",
				type: "praktik" as const,
				peminatan: "Taiwan-Hospitality",
				cohort: 2024,
			},
			{
				code: "HK101",
				name: "Housekeeping",
				type: "praktik" as const,
				peminatan: "Malaysia-Hospitality",
				cohort: 2024,
			},
			{
				code: "FB101",
				name: "Food & Beverage",
				type: "praktik" as const,
				peminatan: "Malaysia-Hospitality",
				cohort: 2024,
			},
			{
				code: "ENG101",
				name: "Bahasa Inggris",
				type: "teori" as const,
				peminatan: "Indonesia-Reguler",
				cohort: 2024,
			},
			{
				code: "ETH101",
				name: "Etika Profesi",
				type: "teori" as const,
				peminatan: "Indonesia-Reguler",
				cohort: 2024,
			},
			{
				code: "GRO101",
				name: "Grooming",
				type: "praktik" as const,
				peminatan: "Malaysia-Hospitality",
				cohort: 2024,
			},
		];

		const createdMasterCourses: any[] = [];
		for (const mc of masterCourses) {
			const [inserted] = await db
				.insert(courses)
				.values({
					code: mc.code,
					name: mc.name,
					dosenId: dosenUser.id,
					peminatan: mc.peminatan,
					cohort: mc.cohort,
					type: mc.type,
					createdBy: dosenUser.id,
				})
				.returning();
			createdMasterCourses.push(inserted);

			// Generate 18 meetings (PKKMB, Beginning, 1-14, UTS, UAS)
			const meetingsToInsert = [
				{
					courseId: inserted.id,
					meetingNumber: 0,
					meetingType: "pkkmb" as const,
					meetingLabel: "PKKMB - Pengenalan Program",
				},
				{
					courseId: inserted.id,
					meetingNumber: 1,
					meetingType: "beginning" as const,
					meetingLabel: "Beginning Class & Kontrak Kuliah",
				},
				{
					courseId: inserted.id,
					meetingNumber: 2,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 1: Pengantar & Teori Dasar",
				},
				{
					courseId: inserted.id,
					meetingNumber: 3,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 2: SOP & Standar Operasional",
				},
				{
					courseId: inserted.id,
					meetingNumber: 4,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 3: Praktik Mandiri Tahap 1",
				},
				{
					courseId: inserted.id,
					meetingNumber: 5,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 4: Praktik Terbimbing",
				},
				{
					courseId: inserted.id,
					meetingNumber: 6,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 5: Studi Kasus Lapangan",
				},
				{
					courseId: inserted.id,
					meetingNumber: 7,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 6: Simulasi & Roleplay",
				},
				{
					courseId: inserted.id,
					meetingNumber: 8,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 7: Review & Evaluasi Tengah",
				},
				{
					courseId: inserted.id,
					meetingNumber: 9,
					meetingType: "uts" as const,
					meetingLabel: "Ujian Tengah Semester (UTS)",
				},
				{
					courseId: inserted.id,
					meetingNumber: 10,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 8: Pendalaman Materi Lanjutan",
				},
				{
					courseId: inserted.id,
					meetingNumber: 11,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 9: Praktik Lanjutan Tahap 2",
				},
				{
					courseId: inserted.id,
					meetingNumber: 12,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 10: Service Excellence & Quality",
				},
				{
					courseId: inserted.id,
					meetingNumber: 13,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 11: Problem Solving & Handling",
				},
				{
					courseId: inserted.id,
					meetingNumber: 14,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 12: Project Work Kelompok",
				},
				{
					courseId: inserted.id,
					meetingNumber: 15,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 13: Presentasi Project",
				},
				{
					courseId: inserted.id,
					meetingNumber: 16,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 14: Review Akhir Semester",
				},
				{
					courseId: inserted.id,
					meetingNumber: 17,
					meetingType: "uas" as const,
					meetingLabel: "Ujian Akhir Semester (UAS)",
				},
			];
			await db.insert(courseMeetings).values(meetingsToInsert);
		}

		// Seed Course Grades for Student 1 linked with courseId
		await db.insert(courseGrades).values([
			{
				studentId: newStudents[0].id,
				courseId: createdMasterCourses[0]?.id,
				courseCode: "FO101",
				courseName: "Front Office",
				dosenId: dosenUser.id,
				grade: "A",
				attendanceRate: 85,
				attitudeNote: "Baik",
				status: "AMAN",
			},
			{
				studentId: newStudents[0].id,
				courseId: createdMasterCourses[1]?.id,
				courseCode: "HK101",
				courseName: "Housekeeping",
				dosenId: dosenUser.id,
				grade: "B+",
				attendanceRate: 72,
				attitudeNote: "Baik",
				status: "AMAN",
			},
			{
				studentId: newStudents[0].id,
				courseId: createdMasterCourses[2]?.id,
				courseCode: "FB101",
				courseName: "Food & Beverage",
				dosenId: dosenUser.id,
				grade: "B",
				attendanceRate: 65,
				attitudeNote: "Cukup",
				status: "PERLU_PERHATIAN",
			},
			{
				studentId: newStudents[0].id,
				courseId: createdMasterCourses[3]?.id,
				courseCode: "ENG101",
				courseName: "Bahasa Inggris",
				dosenId: dosenUser.id,
				grade: "A",
				attendanceRate: 90,
				attitudeNote: "Baik",
				status: "AMAN",
			},
			{
				studentId: newStudents[0].id,
				courseId: createdMasterCourses[4]?.id,
				courseCode: "ETH101",
				courseName: "Etika Profesi",
				dosenId: dosenUser.id,
				grade: "C+",
				attendanceRate: 45,
				attitudeNote: "Buruk",
				status: "TIDAK_AMAN",
			},
			{
				studentId: newStudents[0].id,
				courseId: createdMasterCourses[5]?.id,
				courseCode: "GRO101",
				courseName: "Grooming",
				dosenId: dosenUser.id,
				grade: "B+",
				attendanceRate: 78,
				attitudeNote: "Baik",
				status: "AMAN",
			},
		]);
	}

	// Seed PA Logs for Student 1
	await db.insert(vocabLogs).values([
		{
			studentId: newStudents[0].id,
			date: new Date("2026-05-25"),
			addedWords: 60,
		},
		{
			studentId: newStudents[0].id,
			date: new Date("2026-06-01"),
			addedWords: 80,
		},
		{
			studentId: newStudents[0].id,
			date: new Date("2026-06-08"),
			addedWords: 50,
		},
	]);

	await db.insert(counselingLogs).values([
		{
			studentId: newStudents[0].id,
			date: new Date("2026-05-30"),
			condition: "Perlu Perhatian",
			notes:
				"Sedikit cemas tentang program bahasa, sudah diberikan motivasi dan target kosakata",
		},
		{
			studentId: newStudents[0].id,
			date: new Date("2026-06-07"),
			condition: "Stabil",
			notes:
				"Mahasiswa menunjukkan semangat tinggi dan tidak ada indikasi kecemasan terhadap program magang",
		},
	]);

	console.log("Successfully seeded 3 dummy students with module data!");
	process.exit(0);
}

seed().catch((err) => {
	console.error("Seeding failed:", err);
	process.exit(1);
});
