import { and, eq, sql } from "drizzle-orm";
import postgres from "postgres";
import { db } from "../src/db";
import {
	academicData,
	courseGrades,
	courseMeetingActivities,
	courseMeetingAttendances,
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
} from "../src/db/schema";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:5432/nusadaya";
const rawClient = postgres(connectionString);

async function seedBatch() {
	console.log("=== MEMULAI BATCH SEEDER (10 Dosen, 10 PA, 10 Mahasiswa) ===");

	// 1. Pastikan kolom-kolom DDL sudah lengkap di database
	try {
		await rawClient.unsafe(`
			ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;
			ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;
			ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_photo_url" text;

			ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "pa_id" integer;
			ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "student_user_id" integer;

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
		`);
	} catch (err) {
		console.log("DDL sync passed");
	}

	const password = "password";
	const passwordHash = await Bun.password.hash(password);

	// -------------------------------------------------------------
	// 2. Buat 10 User Dosen
	// -------------------------------------------------------------
	const dosenList = [
		{
			username: "dosen",
			fullName: "Dosen Pengajar",
			role: "dosen" as const,
			email: "dosen@nusadaya.ac.id",
			phone: "081234567000",
		},
		{
			username: "dosen1",
			fullName: "Dr. Hendra Gunawan, M.Pd.",
			role: "dosen" as const,
			email: "dosen1@nusadaya.ac.id",
			phone: "081234567001",
		},
		{
			username: "dosen2",
			fullName: "Siti Rahmawati, S.E., M.M.",
			role: "dosen" as const,
			email: "dosen2@nusadaya.ac.id",
			phone: "081234567002",
		},
		{
			username: "dosen3",
			fullName: "Budi Prasetyo, S.Kom., M.Kom.",
			role: "dosen" as const,
			email: "dosen3@nusadaya.ac.id",
			phone: "081234567003",
		},
		{
			username: "dosen4",
			fullName: "Dewi Lestari, S.Par., M.Par.",
			role: "dosen" as const,
			email: "dosen4@nusadaya.ac.id",
			phone: "081234567004",
		},
		{
			username: "dosen5",
			fullName: "Agus Setiawan, S.T., M.Sc.",
			role: "dosen" as const,
			email: "dosen5@nusadaya.ac.id",
			phone: "081234567005",
		},
		{
			username: "dosen6",
			fullName: "Nurul Hidayah, S.Pd., M.Pd.",
			role: "dosen" as const,
			email: "dosen6@nusadaya.ac.id",
			phone: "081234567006",
		},
		{
			username: "dosen7",
			fullName: "Eko Saputra, S.S., M.Hum.",
			role: "dosen" as const,
			email: "dosen7@nusadaya.ac.id",
			phone: "081234567007",
		},
		{
			username: "dosen8",
			fullName: "Rina Kusuma, S.Si., M.Si.",
			role: "dosen" as const,
			email: "dosen8@nusadaya.ac.id",
			phone: "081234567008",
		},
		{
			username: "dosen9",
			fullName: "Fajar Pratama, S.Kom., M.Kom.",
			role: "dosen" as const,
			email: "dosen9@nusadaya.ac.id",
			phone: "081234567009",
		},
		{
			username: "dosen10",
			fullName: "Anisa Wulandari, S.E., M.M.",
			role: "dosen" as const,
			email: "dosen10@nusadaya.ac.id",
			phone: "081234567010",
		},
	];

	console.log("Menyimpan 10 Akun Dosen...");
	const createdDosen: any[] = [];
	for (const d of dosenList) {
		const [existing] = await db
			.select()
			.from(users)
			.where(eq(users.username, d.username));
		if (existing) {
			await db
				.update(users)
				.set({
					fullName: d.fullName,
					email: d.email,
					phone: d.phone,
					passwordHash,
				})
				.where(eq(users.id, existing.id));
			createdDosen.push(existing);
		} else {
			const [inserted] = await db
				.insert(users)
				.values({ ...d, passwordHash })
				.returning();
			createdDosen.push(inserted);
		}
	}
	console.log(
		`✓ ${createdDosen.length} User Dosen berhasil ditambahkan/diperbarui!`,
	);

	// -------------------------------------------------------------
	// 3. Buat 10 User Pembimbing Akademik (PA)
	// -------------------------------------------------------------
	const paList = [
		{
			username: "pa1",
			fullName: "Dr. Maya Indah Permata, M.Pd.",
			role: "pa" as const,
			email: "pa1@nusadaya.ac.id",
			phone: "082134567001",
		},
		{
			username: "pa2",
			fullName: "Bambang Wijaya, S.Pd., M.Ed.",
			role: "pa" as const,
			email: "pa2@nusadaya.ac.id",
			phone: "082134567002",
		},
		{
			username: "pa3",
			fullName: "dr. Ratna Sari, M.Biomed.",
			role: "pa" as const,
			email: "pa3@nusadaya.ac.id",
			phone: "082134567003",
		},
		{
			username: "pa4",
			fullName: "Drs. Joko Purwanto, M.M.",
			role: "pa" as const,
			email: "pa4@nusadaya.ac.id",
			phone: "082134567004",
		},
		{
			username: "pa5",
			fullName: "Sri Wahyuni, S.Pd., M.Pd.",
			role: "pa" as const,
			email: "pa5@nusadaya.ac.id",
			phone: "082134567005",
		},
		{
			username: "pa6",
			fullName: "Ahmad Ridwan, S.T., M.Sc.",
			role: "pa" as const,
			email: "pa6@nusadaya.ac.id",
			phone: "082134567006",
		},
		{
			username: "pa7",
			fullName: "Fitri Handayani, S.Par., M.Par.",
			role: "pa" as const,
			email: "pa7@nusadaya.ac.id",
			phone: "082134567007",
		},
		{
			username: "pa8",
			fullName: "Hadi Pranoto, S.T., M.Kom.",
			role: "pa" as const,
			email: "pa8@nusadaya.ac.id",
			phone: "082134567008",
		},
		{
			username: "pa9",
			fullName: "Yuliana Dewi, S.Si., M.Si.",
			role: "pa" as const,
			email: "pa9@nusadaya.ac.id",
			phone: "082134567009",
		},
		{
			username: "pa10",
			fullName: "Rizky Firmansyah, S.Pd., M.Pd.",
			role: "pa" as const,
			email: "pa10@nusadaya.ac.id",
			phone: "082134567010",
		},
	];

	console.log("Menyimpan 10 Akun Pembimbing Akademik (PA)...");
	const createdPA: any[] = [];
	for (const p of paList) {
		const [existing] = await db
			.select()
			.from(users)
			.where(eq(users.username, p.username));
		if (existing) {
			await db
				.update(users)
				.set({
					fullName: p.fullName,
					email: p.email,
					phone: p.phone,
					passwordHash,
				})
				.where(eq(users.id, existing.id));
			createdPA.push(existing);
		} else {
			const [inserted] = await db
				.insert(users)
				.values({ ...p, passwordHash })
				.returning();
			createdPA.push(inserted);
		}
	}
	console.log(`✓ ${createdPA.length} User PA berhasil ditambahkan/diperbarui!`);

	// -------------------------------------------------------------
	// 4. Buat 10 User Mahasiswa & Data Mahasiswa (Terdistribusi ke 10 PA)
	// -------------------------------------------------------------
	const mhsData = [
		{
			username: "mahasiswa1",
			nim: "250001",
			name: "Aditya Pratama",
			nickname: "Adit",
			gender: "Laki-laki",
			cohort: 15,
			academicYear: "2025/2026",
			program: "Hospitality",
			subProgram: "Malaysia-Hospitality",
			destinationCountry: "Malaysia",
			email: "mhs1@student.nusadaya.ac.id",
			phone: "085712345001",
			overallStatus: "AMAN" as const,
		},
		{
			username: "mahasiswa2",
			nim: "250002",
			name: "Bella Safitri",
			nickname: "Bella",
			gender: "Perempuan",
			cohort: 15,
			academicYear: "2025/2026",
			program: "Culinary",
			subProgram: "Taiwan-Hospitality",
			destinationCountry: "Taiwan",
			email: "mhs2@student.nusadaya.ac.id",
			phone: "085712345002",
			overallStatus: "PERLU_PERHATIAN" as const,
		},
		{
			username: "mahasiswa3",
			nim: "250003",
			name: "Dimas Anggara",
			nickname: "Dimas",
			gender: "Laki-laki",
			cohort: 15,
			academicYear: "2025/2026",
			program: "Barista",
			subProgram: "Timur tengah-Barista",
			destinationCountry: "Timur Tengah",
			email: "mhs3@student.nusadaya.ac.id",
			phone: "085712345003",
			overallStatus: "AMAN" as const,
		},
		{
			username: "mahasiswa4",
			nim: "250004",
			name: "Eka Putri Rahayu",
			nickname: "Eka",
			gender: "Perempuan",
			cohort: 15,
			academicYear: "2025/2026",
			program: "Front Office",
			subProgram: "Malaysia-Hospitality",
			destinationCountry: "Malaysia",
			email: "mhs4@student.nusadaya.ac.id",
			phone: "085712345004",
			overallStatus: "AMAN" as const,
		},
		{
			username: "mahasiswa5",
			nim: "250005",
			name: "Faris Maulana",
			nickname: "Faris",
			gender: "Laki-laki",
			cohort: 15,
			academicYear: "2025/2026",
			program: "Housekeeping",
			subProgram: "Taiwan-Hospitality",
			destinationCountry: "Taiwan",
			email: "mhs5@student.nusadaya.ac.id",
			phone: "085712345005",
			overallStatus: "TIDAK_AMAN" as const,
		},
		{
			username: "mahasiswa6",
			nim: "250006",
			name: "Gita Gutawa",
			nickname: "Gita",
			gender: "Perempuan",
			cohort: 15,
			academicYear: "2025/2026",
			program: "Hospitality",
			subProgram: "Indonesia-Reguler",
			destinationCountry: "Indonesia",
			email: "mhs6@student.nusadaya.ac.id",
			phone: "085712345006",
			overallStatus: "PERLU_PERHATIAN" as const,
		},
		{
			username: "mahasiswa7",
			nim: "250007",
			name: "Hilman Syahputra",
			nickname: "Hilman",
			gender: "Laki-laki",
			cohort: 15,
			academicYear: "2025/2026",
			program: "Culinary",
			subProgram: "Malaysia-Hospitality",
			destinationCountry: "Malaysia",
			email: "mhs7@student.nusadaya.ac.id",
			phone: "085712345007",
			overallStatus: "AMAN" as const,
		},
		{
			username: "mahasiswa8",
			nim: "250008",
			name: "Intan Permata",
			nickname: "Intan",
			gender: "Perempuan",
			cohort: 15,
			academicYear: "2025/2026",
			program: "Barista",
			subProgram: "Timur tengah-Barista",
			destinationCountry: "Timur Tengah",
			email: "mhs8@student.nusadaya.ac.id",
			phone: "085712345008",
			overallStatus: "AMAN" as const,
		},
		{
			username: "mahasiswa9",
			nim: "250009",
			name: "Julian Alamsyah",
			nickname: "Julian",
			gender: "Laki-laki",
			cohort: 15,
			academicYear: "2025/2026",
			program: "Front Office",
			subProgram: "Taiwan-Hospitality",
			destinationCountry: "Taiwan",
			email: "mhs9@student.nusadaya.ac.id",
			phone: "085712345009",
			overallStatus: "PERLU_PERHATIAN" as const,
		},
		{
			username: "mahasiswa10",
			nim: "250010",
			name: "Karin Novilda",
			nickname: "Karin",
			gender: "Perempuan",
			cohort: 15,
			academicYear: "2025/2026",
			program: "Hospitality",
			subProgram: "Malaysia-Hospitality",
			destinationCountry: "Malaysia",
			email: "mhs10@student.nusadaya.ac.id",
			phone: "085712345010",
			overallStatus: "AMAN" as const,
		},
	];

	console.log(
		"Menyimpan 10 Mahasiswa & Menghubungkan ke 10 PA secara merata...",
	);

	for (let i = 0; i < mhsData.length; i++) {
		const m = mhsData[i];
		const assignedPA = createdPA[i % createdPA.length]; // Distribusi merata 1:1 ke PA 1 s.d PA 10

		// 4a. Buat atau perbarui User Mahasiswa
		let studentUser;
		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.username, m.username));
		if (existingUser) {
			await db
				.update(users)
				.set({ fullName: m.name, email: m.email, phone: m.phone, passwordHash })
				.where(eq(users.id, existingUser.id));
			studentUser = existingUser;
		} else {
			const [newUser] = await db
				.insert(users)
				.values({
					username: m.username,
					fullName: m.name,
					role: "mahasiswa",
					email: m.email,
					phone: m.phone,
					passwordHash,
				})
				.returning();
			studentUser = newUser;
		}

		// 4b. Buat atau perbarui Data Student
		let studentRecord;
		const [existingStudent] = await db
			.select()
			.from(students)
			.where(eq(students.nim, m.nim));
		if (existingStudent) {
			const [updated] = await db
				.update(students)
				.set({
					name: m.name,
					nickname: m.nickname,
					cohort: m.cohort,
					academicYear: m.academicYear,
					program: m.program,
					subProgram: m.subProgram,
					gender: m.gender,
					email: m.email,
					phone: m.phone,
					paId: assignedPA.id,
					studentUserId: studentUser.id,
					overallStatus: m.overallStatus,
					destinationCountry: m.destinationCountry,
					updatedAt: new Date(),
				})
				.where(eq(students.id, existingStudent.id))
				.returning();
			studentRecord = updated;
		} else {
			const [created] = await db
				.insert(students)
				.values({
					nim: m.nim,
					name: m.name,
					nickname: m.nickname,
					cohort: m.cohort,
					academicYear: m.academicYear,
					program: m.program,
					subProgram: m.subProgram,
					gender: m.gender,
					email: m.email,
					phone: m.phone,
					paId: assignedPA.id,
					studentUserId: studentUser.id,
					overallStatus: m.overallStatus,
					destinationCountry: m.destinationCountry,
					studentStatus: "aktif",
				})
				.returning();
			studentRecord = created;
		}

		const sId = studentRecord.id;

		// 4c. Buat / Sync Data 7 Modul
		// 1. PMB Data (Lengkap dengan 14 checklist)
		const [existingPmb] = await db
			.select()
			.from(pmbData)
			.where(eq(pmbData.studentId, sId));
		if (!existingPmb) {
			await db.insert(pmbData).values({
				studentId: sId,
				formReceived: true,
				documentsComplete: true,
				dataInputted: true,
				initialFollowUp: true,
				docKtp: true,
				docKk: true,
				docCv: true,
				docIjazah: true,
				docTranskrip: true,
				docPassportDepan: true,
				docPassportVisa: true,
				docSkbm: true,
				docMcu: true,
				docSertifikasiBahasa: true,
				isAcc: true,
				accAt: new Date(),
				status: "AMAN",
			});
		}

		// 2. CRM Data
		const [existingCrm] = await db
			.select()
			.from(crmData)
			.where(eq(crmData.studentId, sId));
		if (!existingCrm) {
			await db.insert(crmData).values({
				studentId: sId,
				odsActive: true,
				studentMonitoring: true,
				parentFollowUp: true,
				practiceAttendance: true,
				odsDocumentation: true,
				isAcc: true,
				accAt: new Date(),
				status: "AMAN",
			});
		}

		// 3. Finance Data
		const [existingFinance] = await db
			.select()
			.from(financeData)
			.where(eq(financeData.studentId, sId));
		if (!existingFinance) {
			await db.insert(financeData).values({
				studentId: sId,
				isAcc: m.overallStatus === "AMAN",
				status: m.overallStatus === "AMAN" ? "AMAN" : "PERLU_PERHATIAN",
			});
		}

		// 4. Academic Data
		const [existingAcademic] = await db
			.select()
			.from(academicData)
			.where(eq(academicData.studentId, sId));
		if (!existingAcademic) {
			await db.insert(academicData).values({
				studentId: sId,
				gpa: m.overallStatus === "AMAN" ? 375 : 310,
				creditsCompleted: 24,
				status: m.overallStatus === "AMAN" ? "AMAN" : "PERLU_PERHATIAN",
			});
		}

		// 5. PA Data
		const [existingPaData] = await db
			.select()
			.from(paData)
			.where(eq(paData.studentId, sId));
		if (!existingPaData) {
			await db.insert(paData).values({
				studentId: sId,
				counselingDone: true,
				mentalStable: true,
				disciplineGood: true,
				isAcc: true,
				status: "AMAN",
			});
		}

		// 6. Internship Data
		const [existingInternship] = await db
			.select()
			.from(internshipData)
			.where(eq(internshipData.studentId, sId));
		if (!existingInternship) {
			await db.insert(internshipData).values({
				studentId: sId,
				passportReady: true,
				interviewReady: true,
				loaReady: true,
				contractReady: true,
				mcuReady: true,
				destinationCity:
					m.destinationCountry === "Malaysia" ? "Kuala Lumpur" : "Taipei",
				internshipDuration: "6 Bulan",
				status: "AMAN",
			});
		}

		// 7. Final Decision
		const [existingDecision] = await db
			.select()
			.from(finalDecision)
			.where(eq(finalDecision.studentId, sId));
		if (!existingDecision) {
			await db.insert(finalDecision).values({
				studentId: sId,
				evaluatorDecision: "menunggu",
			});
		}

		console.log(
			`✓ Mahasiswa [${m.nim}] ${m.name} -> Terhubung ke Pembimbing: ${assignedPA.fullName} (${assignedPA.username})`,
		);
	}

	// -------------------------------------------------------------
	// 5. Buat Mata Kuliah untuk 10 Dosen & Generate 18 Pertemuan
	// -------------------------------------------------------------
	console.log(
		"\nMenyimpan Mata Kuliah untuk 10 Dosen & Membuat 18 Pertemuan...",
	);
	const courseDefinitions = [
		// 6 Mata Kuliah untuk Akun Demo Dosen (username: "dosen")
		{
			code: "FO101",
			name: "Front Office",
			dosenUsername: "dosen",
			peminatan: "Taiwan-Hospitality",
			cohort: 14,
			type: "praktik" as const,
		},
		{
			code: "HK101",
			name: "Housekeeping",
			dosenUsername: "dosen",
			peminatan: "Malaysia-Hospitality",
			cohort: 14,
			type: "praktik" as const,
		},
		{
			code: "FB101",
			name: "Food & Beverage",
			dosenUsername: "dosen",
			peminatan: "Malaysia-Hospitality",
			cohort: 14,
			type: "praktik" as const,
		},
		{
			code: "ENG101",
			name: "Bahasa Inggris",
			dosenUsername: "dosen",
			peminatan: "Indonesia-Reguler",
			cohort: 14,
			type: "teori" as const,
		},
		{
			code: "ETH101",
			name: "Etika Profesi",
			dosenUsername: "dosen",
			peminatan: "Indonesia-Reguler",
			cohort: 14,
			type: "teori" as const,
		},
		{
			code: "GRO101",
			name: "Grooming",
			dosenUsername: "dosen",
			peminatan: "Malaysia-Hospitality",
			cohort: 14,
			type: "praktik" as const,
		},

		// 10 Mata Kuliah untuk Dosen 1 s.d 10 (username: "dosen1" .. "dosen10")
		{
			code: "MK-HOSP-101",
			name: "Food & Beverage Service Operation",
			dosenUsername: "dosen1",
			peminatan: "Malaysia-Hospitality",
			cohort: 15,
			type: "praktik" as const,
		},
		{
			code: "MK-MGMT-102",
			name: "Manajemen & Tata Kelola Perhotelan",
			dosenUsername: "dosen2",
			peminatan: "Indonesia-Reguler",
			cohort: 15,
			type: "teori" as const,
		},
		{
			code: "MK-BAR-103",
			name: "Coffee Brewing & Espresso Specialist",
			dosenUsername: "dosen3",
			peminatan: "Timur tengah-Barista",
			cohort: 15,
			type: "praktik" as const,
		},
		{
			code: "MK-FO-104",
			name: "Front Office Operation & System",
			dosenUsername: "dosen4",
			peminatan: "Taiwan-Hospitality",
			cohort: 15,
			type: "praktik" as const,
		},
		{
			code: "MK-HK-105",
			name: "Housekeeping & Room Management",
			dosenUsername: "dosen5",
			peminatan: "Malaysia-Hospitality",
			cohort: 15,
			type: "praktik" as const,
		},
		{
			code: "MK-HYG-106",
			name: "Hygiene, Sanitasi & K3 Perhotelan",
			dosenUsername: "dosen6",
			peminatan: "Indonesia-Reguler",
			cohort: 15,
			type: "teori" as const,
		},
		{
			code: "MK-ENG-107",
			name: "Bahasa Inggris Komunikasi Vokasi",
			dosenUsername: "dosen7",
			peminatan: "Malaysia-Hospitality",
			cohort: 15,
			type: "teori" as const,
		},
		{
			code: "MK-CUL-108",
			name: "Seni Kuliner Nusantara & Oriental",
			dosenUsername: "dosen8",
			peminatan: "Taiwan-Hospitality",
			cohort: 15,
			type: "praktik" as const,
		},
		{
			code: "MK-KWU-109",
			name: "Digital Marketing & Kewirausahaan",
			dosenUsername: "dosen9",
			peminatan: "Indonesia-Reguler",
			cohort: 15,
			type: "teori" as const,
		},
		{
			code: "MK-BAR-110",
			name: "Beverage Mixology & Latte Art",
			dosenUsername: "dosen10",
			peminatan: "Timur tengah-Barista",
			cohort: 15,
			type: "praktik" as const,
		},
	];

	for (const def of courseDefinitions) {
		const dosen = createdDosen.find((d) => d.username === def.dosenUsername);
		if (!dosen) continue;

		let course;
		const [existingCourse] = await db
			.select()
			.from(courses)
			.where(eq(courses.code, def.code));
		if (existingCourse) {
			const [updated] = await db
				.update(courses)
				.set({
					name: def.name,
					dosenId: dosen.id,
					peminatan: def.peminatan,
					cohort: def.cohort,
					type: def.type,
					updatedAt: new Date(),
				})
				.where(eq(courses.id, existingCourse.id))
				.returning();
			course = updated;
		} else {
			const [inserted] = await db
				.insert(courses)
				.values({
					code: def.code,
					name: def.name,
					dosenId: dosen.id,
					peminatan: def.peminatan,
					cohort: def.cohort,
					type: def.type,
					createdBy: dosen.id,
				})
				.returning();
			course = inserted;
		}

		// Check / generate 18 meetings
		const existingMeetings = await db
			.select()
			.from(courseMeetings)
			.where(eq(courseMeetings.courseId, course.id));
		if (existingMeetings.length === 0) {
			const meetingsToInsert = [
				{
					courseId: course.id,
					meetingNumber: 0,
					meetingType: "pkkmb" as const,
					meetingLabel: "PKKMB - Pengenalan Program",
				},
				{
					courseId: course.id,
					meetingNumber: 1,
					meetingType: "beginning" as const,
					meetingLabel: "Beginning Class & Kontrak Kuliah",
				},
				{
					courseId: course.id,
					meetingNumber: 2,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 1: Pengantar & Teori Dasar",
				},
				{
					courseId: course.id,
					meetingNumber: 3,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 2: SOP & Standar Operasional",
				},
				{
					courseId: course.id,
					meetingNumber: 4,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 3: Praktik Mandiri Tahap 1",
				},
				{
					courseId: course.id,
					meetingNumber: 5,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 4: Praktik Terbimbing",
				},
				{
					courseId: course.id,
					meetingNumber: 6,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 5: Studi Kasus Lapangan",
				},
				{
					courseId: course.id,
					meetingNumber: 7,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 6: Simulasi & Roleplay",
				},
				{
					courseId: course.id,
					meetingNumber: 8,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 7: Review & Evaluasi Tengah",
				},
				{
					courseId: course.id,
					meetingNumber: 9,
					meetingType: "uts" as const,
					meetingLabel: "Ujian Tengah Semester (UTS)",
				},
				{
					courseId: course.id,
					meetingNumber: 10,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 8: Pendalaman Materi Lanjutan",
				},
				{
					courseId: course.id,
					meetingNumber: 11,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 9: Praktik Lanjutan Tahap 2",
				},
				{
					courseId: course.id,
					meetingNumber: 12,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 10: Service Excellence & Quality",
				},
				{
					courseId: course.id,
					meetingNumber: 13,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 11: Problem Solving & Handling",
				},
				{
					courseId: course.id,
					meetingNumber: 14,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 12: Project Work Kelompok",
				},
				{
					courseId: course.id,
					meetingNumber: 15,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 13: Presentasi Project",
				},
				{
					courseId: course.id,
					meetingNumber: 16,
					meetingType: "regular" as const,
					meetingLabel: "Pertemuan 14: Review Akhir Semester",
				},
				{
					courseId: course.id,
					meetingNumber: 17,
					meetingType: "uas" as const,
					meetingLabel: "Ujian Akhir Semester (UAS)",
				},
			];
			await db.insert(courseMeetings).values(meetingsToInsert);
		}

		console.log(
			`✓ Mata Kuliah [${course.code}] ${course.name} -> Diampu oleh: ${dosen.fullName} (${dosen.username})`,
		);
	}

	// -------------------------------------------------------------
	// 6. Daftarkan Mahasiswa ke Mata Kuliah Dosen (course_grades)
	// -------------------------------------------------------------
	console.log(
		"\nMendaftarkan Mahasiswa ke Mata Kuliah Dosen (course_grades)...",
	);
	const allCreatedCourses = await db.select().from(courses);
	const allStudents = await db.select().from(students);

	for (const std of allStudents) {
		// Hubungkan mahasiswa ke mata kuliah yang relevan
		const relevantCourses = allCreatedCourses.filter(
			(c) =>
				c.peminatan === std.subProgram ||
				c.cohort === std.cohort ||
				c.peminatan === "Indonesia-Reguler" ||
				c.peminatan === "Malaysia-Hospitality",
		);

		for (const crs of relevantCourses) {
			const [existingGrade] = await db
				.select()
				.from(courseGrades)
				.where(
					and(
						eq(courseGrades.studentId, std.id),
						eq(courseGrades.courseCode, crs.code),
					),
				);

			if (!existingGrade) {
				await db.insert(courseGrades).values({
					studentId: std.id,
					courseId: crs.id,
					courseCode: crs.code,
					courseName: crs.name,
					dosenId: crs.dosenId,
					grade: "A",
					attendanceRate: 90,
					practicalScore: 88,
					theoryScore: 85,
					entrepreneurScore: 80,
					totalMeetings: 16,
					attendancePresent: 14,
					attitudeNote:
						"Sikap perkuliahan sangat baik dan aktif dalam praktikum.",
					status: "AMAN",
					isAcc: true,
					accAt: new Date(),
				});
			}
		}
	}
	console.log(
		"✓ Seluruh Mahasiswa berhasil terdaftar ke kelas dosen pengampu!",
	);

	console.log("\n=======================================================");
	console.log("🎉 BATCH SEEDING SELESAI DENGAN SUKSES!");
	console.log("=======================================================");
	console.log("• 10 Akun Dosen : dosen1 s.d dosen10 (Password: password)");
	console.log(
		"• 10 Mata Kuliah: Terhubung langsung ke masing-masing 10 Dosen lengkap dengan 18 pertemuan",
	);
	console.log("• 10 Akun PA    : pa1 s.d pa10 (Password: password)");
	console.log(
		"• 10 Mahasiswa  : mahasiswa1 s.d mahasiswa10 (Password: password)",
	);
	console.log(
		"• Setiap Mahasiswa telah otomatis terdaftar ke masing-masing PA (1 mahasiswa per PA).",
	);
	console.log(
		"• Seluruh Mahasiswa telah otomatis terdaftar ke kelas mata kuliah Dosen.",
	);
	console.log("=======================================================\n");

	process.exit(0);
}

seedBatch().catch((err) => {
	console.error("Seeding batch failed:", err);
	process.exit(1);
});
