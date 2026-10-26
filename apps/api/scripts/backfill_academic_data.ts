import { eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import {
	academicAuditLogs,
	academicCalendars,
	academicTerms,
	classSchedules,
	courseEnrollments,
	courseGrades,
	courses,
	curricula,
	curriculumPackages,
	masterCourses,
	practicumSchedules,
	studentSemesterRegistrations,
	students,
} from "../src/db/schema";

export async function runAcademicBackfill() {
	console.log("=== MEMULAI BACKFILL AKADEMIK (FASE 2) ===");

	// ----------------------------------------------------
	// 1. BACKFILL PERIODE AKADEMIK (Task 2.2)
	// ----------------------------------------------------
	console.log("1. Menginisialisasi Periode Akademik...");

	// Term 1: 2025/2026 Genap (Historis - Ditutup)
	let [histTerm] = await db
		.select()
		.from(academicTerms)
		.where(
			sql`${academicTerms.academicYear} = '2025/2026' AND ${academicTerms.semesterType} = 'genap'`,
		);
	if (!histTerm) {
		const [created] = await db
			.insert(academicTerms)
			.values({
				academicYear: "2025/2026",
				semesterType: "genap",
				name: "2025/2026 Genap",
				startDate: "2026-02-01",
				endDate: "2026-07-31",
				status: "ditutup",
				isActive: false,
			})
			.returning();
		histTerm = created;
		console.log("-> Periode historis 2025/2026 Genap dibuat");
	}

	// Term 2: 2026/2027 Ganjil (Aktif Berjalan)
	let [activeTerm] = await db
		.select()
		.from(academicTerms)
		.where(
			sql`${academicTerms.academicYear} = '2026/2027' AND ${academicTerms.semesterType} = 'ganjil'`,
		);
	if (!activeTerm) {
		const [created] = await db
			.insert(academicTerms)
			.values({
				academicYear: "2026/2027",
				semesterType: "ganjil",
				name: "2026/2027 Ganjil",
				startDate: "2026-08-01",
				endDate: "2027-01-31",
				krsStartDate: "2026-08-01",
				krsEndDate: "2026-08-31",
				gradeLockDate: "2027-01-31",
				status: "berjalan",
				isActive: true,
			})
			.returning();
		activeTerm = created;
		console.log("-> Periode aktif 2026/2027 Ganjil dibuat");
	} else if (!activeTerm.isActive) {
		await db
			.update(academicTerms)
			.set({ isActive: true, status: "berjalan" })
			.where(eq(academicTerms.id, activeTerm.id));
	}

	// Term 3: 2026/2027 Genap (Masa Datang - Draft)
	let [upcomingTerm] = await db
		.select()
		.from(academicTerms)
		.where(
			sql`${academicTerms.academicYear} = '2026/2027' AND ${academicTerms.semesterType} = 'genap'`,
		);
	if (!upcomingTerm) {
		const [created] = await db
			.insert(academicTerms)
			.values({
				academicYear: "2026/2027",
				semesterType: "genap",
				name: "2026/2027 Genap",
				startDate: "2027-02-01",
				endDate: "2027-07-31",
				status: "draft",
				isActive: false,
			})
			.returning();
		upcomingTerm = created;
		console.log("-> Periode draft 2026/2027 Genap dibuat");
	}

	// ----------------------------------------------------
	// 2. BACKFILL MASTER MATA KULIAH (Task 2.1)
	// ----------------------------------------------------
	console.log("2. Membentuk Katalog Master Mata Kuliah...");
	const existingCourses = await db.select().from(courses);
	const masterCodeMap = new Map<string, number>();

	for (const c of existingCourses) {
		let [master] = await db
			.select()
			.from(masterCourses)
			.where(eq(masterCourses.code, c.code));

		if (!master) {
			const [created] = await db
				.insert(masterCourses)
				.values({
					code: c.code,
					name: c.name,
					sks: c.sks || 2,
					type: c.type || "teori",
					description: `Mata kuliah kurikulum ${c.name}`,
					isActive: true,
				})
				.returning();
			master = created;
			console.log(`-> Master dibuat: [${master.code}] ${master.name}`);
		}
		masterCodeMap.set(c.code, master.id);

		// Tautkan course ke masterCourseId dan termId
		const semNum =
			c.cohort === 18 ? 1 : c.cohort === 17 ? 3 : c.cohort === 16 ? 5 : 1;
		await db
			.update(courses)
			.set({
				masterCourseId: master.id,
				termId: activeTerm.id,
				semester: semNum,
				status: "dibuka",
			})
			.where(eq(courses.id, c.id));
	}
	console.log(
		`-> ${existingCourses.length} kelas tertaut ke Master Mata Kuliah`,
	);

	// ----------------------------------------------------
	// 3. KURIKULUM & PAKET SEMESTER (Task 2.3)
	// ----------------------------------------------------
	console.log("3. Menetapkan Kurikulum & Paket Semester...");
	let [curr] = await db
		.select()
		.from(curricula)
		.where(eq(curricula.name, "Kurikulum D3 Perhotelan Vokasi"));

	if (!curr) {
		const [created] = await db
			.insert(curricula)
			.values({
				name: "Kurikulum D3 Perhotelan Vokasi",
				program: "D3 Perhotelan",
				startCohort: 14,
				maxSksPerSemester: 24,
				isActive: true,
			})
			.returning();
		curr = created;
		console.log("-> Kurikulum D3 Perhotelan Vokasi dibuat");
	}

	// Buat paket semester 1, 2, 3, 4 untuk master courses
	const allMasters = await db.select().from(masterCourses);
	for (let i = 0; i < allMasters.length; i++) {
		const m = allMasters[i];
		// Bagi mata kuliah ke semester 1, 2, 3, 4 secara berurutan
		const sem = (i % 4) + 1;
		const existingPkg = await db
			.select()
			.from(curriculumPackages)
			.where(
				sql`${curriculumPackages.curriculumId} = ${curr.id} AND ${curriculumPackages.masterCourseId} = ${m.id}`,
			);

		if (existingPkg.length === 0) {
			await db.insert(curriculumPackages).values({
				curriculumId: curr.id,
				masterCourseId: m.id,
				semester: sem,
				isRequired: true,
				orderIndex: i,
			});
		}
	}
	console.log("-> Paket kurikulum semester 1 s.d. 4 berhasil dipetakan");

	// ----------------------------------------------------
	// 4. REGISTRASI SEMESTER MAHASISWA (Task 2.4)
	// ----------------------------------------------------
	console.log("4. Mendaftarkan Registrasi Semester Mahasiswa...");
	const allStudents = await db.select().from(students);

	for (const s of allStudents) {
		// Hitung posisi semester berdasarkan angkatan (Task 0.3)
		// Cohort 18 -> Semester 1 (Ganjil 2026/2027)
		// Cohort 17 -> Semester 3
		// Cohort 16 -> Semester 5
		// Cohort 15 -> Semester 6
		// Cohort 14 -> Semester 6
		let sem = 1;
		if (s.cohort === 18) sem = 1;
		else if (s.cohort === 17) sem = 3;
		else if (s.cohort === 16) sem = 5;
		else if (s.cohort <= 15) sem = 6;

		// Update kolom ringkas currentSemester
		await db
			.update(students)
			.set({ currentSemester: sem })
			.where(eq(students.id, s.id));

		// Insert or update student_semester_registrations
		const existingReg = await db
			.select()
			.from(studentSemesterRegistrations)
			.where(
				sql`${studentSemesterRegistrations.studentId} = ${s.id} AND ${studentSemesterRegistrations.termId} = ${activeTerm.id}`,
			);

		if (existingReg.length === 0) {
			await db.insert(studentSemesterRegistrations).values({
				studentId: s.id,
				termId: activeTerm.id,
				semester: sem,
				status: (s.studentStatus as any) || "aktif",
				krsStatus: "disetujui",
				sksTaken: 0,
				sksPassed: 0,
			});
		}
	}
	console.log(
		`-> ${allStudents.length} mahasiswa memiliki registrasi semester aktif`,
	);

	// ----------------------------------------------------
	// 5. MATERIALISASI KRS KANONIK (Task 2.5)
	// ----------------------------------------------------
	console.log("5. Mematerialisasi KRS (Pendaftaran Eksplisit)...");
	const activeCourses = await db.select().from(courses);
	let enrollCount = 0;

	for (const s of allStudents) {
		if (s.studentStatus === "cuti" || s.studentStatus === "lulus") continue;

		// Cari mata kuliah yang sesuai dengan angkatan & rombel mahasiswa
		const matchingCourses = activeCourses.filter((c) => {
			const cohortMatch = c.cohort === s.cohort;
			const rombelMatch =
				!c.rombel || c.rombel === s.rombel || c.rombel === "Semua";
			const peminatanMatch =
				!c.peminatan || !s.subProgram || c.peminatan === s.subProgram;
			return cohortMatch && rombelMatch && peminatanMatch;
		});

		for (const c of matchingCourses) {
			const existingEnroll = await db
				.select()
				.from(courseEnrollments)
				.where(
					sql`${courseEnrollments.courseId} = ${c.id} AND ${courseEnrollments.studentId} = ${s.id}`,
				);

			if (existingEnroll.length === 0) {
				await db.insert(courseEnrollments).values({
					courseId: c.id,
					studentId: s.id,
					termId: activeTerm.id,
					source: "paket",
					status: "aktif",
					notes: "Pendaftaran otomatis paket semester",
				});
				enrollCount++;
			} else if (!existingEnroll[0].termId) {
				await db
					.update(courseEnrollments)
					.set({ termId: activeTerm.id, source: "paket", status: "aktif" })
					.where(eq(courseEnrollments.id, existingEnroll[0].id));
			}
		}
	}
	console.log(
		`-> ${enrollCount} pendaftaran KRS eksplisit paket berhasil dimaterialisasi`,
	);

	// ----------------------------------------------------
	// 6. PERBAIKAN RIWAYAT NILAI (Task 2.6)
	// ----------------------------------------------------
	console.log("6. Menghubungkan Riwayat Nilai ke Periode & KRS...");
	const allGrades = await db.select().from(courseGrades);
	let linkedGradesCount = 0;

	for (const g of allGrades) {
		if (!g.termId && g.courseId) {
			const [enroll] = await db
				.select()
				.from(courseEnrollments)
				.where(
					sql`${courseEnrollments.courseId} = ${g.courseId} AND ${courseEnrollments.studentId} = ${g.studentId}`,
				);

			await db
				.update(courseGrades)
				.set({
					termId: activeTerm.id,
					enrollmentId: enroll?.id || null,
					attempt: 1,
				})
				.where(eq(courseGrades.id, g.id));
			linkedGradesCount++;
		}
	}
	console.log(`-> ${linkedGradesCount} riwayat nilai tertaut ke Periode Aktif`);

	// ----------------------------------------------------
	// 7. TAUTKAN JADWAL KE KELAS & PERIODE (Task 2.7)
	// ----------------------------------------------------
	console.log("7. Menautkan Jadwal Kuliah & Praktikum ke Kelas...");
	const allClassSchedules = await db.select().from(classSchedules);
	let linkedClassSchedCount = 0;

	for (const cs of allClassSchedules) {
		// Cari course yang cocok nama & cohort
		const matchingCourse = activeCourses.find(
			(c) =>
				c.cohort === cs.cohort &&
				(c.name.toLowerCase() === cs.subject.toLowerCase() ||
					cs.subject.toLowerCase().includes(c.name.toLowerCase()) ||
					c.name.toLowerCase().includes(cs.subject.toLowerCase())),
		);

		await db
			.update(classSchedules)
			.set({
				termId: activeTerm.id,
				courseId: matchingCourse?.id || null,
			})
			.where(eq(classSchedules.id, cs.id));
		linkedClassSchedCount++;
	}

	const allPracSchedules = await db.select().from(practicumSchedules);
	for (const ps of allPracSchedules) {
		const matchingCourse = activeCourses.find(
			(c) =>
				c.cohort === ps.cohort &&
				(c.name.toLowerCase() === ps.subject.toLowerCase() ||
					ps.subject.toLowerCase().includes(c.name.toLowerCase()) ||
					c.name.toLowerCase().includes(ps.subject.toLowerCase())),
		);

		await db
			.update(practicumSchedules)
			.set({
				termId: activeTerm.id,
				courseId: matchingCourse?.id || null,
			})
			.where(eq(practicumSchedules.id, ps.id));
	}
	console.log(
		`-> ${linkedClassSchedCount + allPracSchedules.length} jadwal terhubung ke Periode Aktif & Kelas`,
	);

	console.log("=== BACKFILL AKADEMIK (FASE 2) SELESAI DENGAN SUKSES ===");
}
