import { beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../src/db";
import {
	academicAuditLogs,
	academicCalendars,
	academicTerms,
	classSchedules,
	courseEnrollments,
	courseGrades,
	courseMeetings,
	courses,
	curricula,
	curriculumPackages,
	masterCourses,
	semesterRolloverLogs,
	studentSemesterRegistrations,
	students,
	users,
} from "../src/db/schema";
import { cacheDel } from "../src/lib/cache";
import { JWT_SECRET } from "../src/middleware/auth";
import {
	checkStudentScheduleConflict,
	enrollCohortRombelToPackage,
	executeSemesterRollover,
	getActiveAcademicTerm,
	getStudentCoursesForTerm,
	openClassesFromPackage,
	previewSemesterRollover,
} from "../src/modules/academic/curriculum.service";
import { curriculumRouter } from "../src/routes/curriculum";

describe("Periode Akademik, Kurikulum Paket Semester, KRS & Rollover (Fase 1 s.d. 9)", () => {
	let adminUser: any;
	let adminToken: string;

	beforeAll(async () => {
		adminUser = await db.query.users.findFirst({
			where: eq(users.role, "superadmin"),
		});

		const signer = jwt({ name: "jwt", secret: JWT_SECRET });
		const mockSignApp = new Elysia()
			.use(signer)
			.get("/sign-admin", ({ jwt }: any) =>
				jwt.sign({
					id: adminUser?.id || 32,
					username: adminUser?.username || "superadmin",
					role: "superadmin",
					roles: ["superadmin"],
				}),
			);

		const res = await mockSignApp.handle(
			new Request("http://localhost/sign-admin"),
		);
		adminToken = await res.text();
	});

	it("TC-AKD-01: Pengelolaan Periode Akademik & Jaminan Periode Aktif Tunggal", async () => {
		const testYear = "2029/2030";

		// 1. Buat periode baru via router
		const app = new Elysia()
			.use(jwt({ name: "jwt", secret: JWT_SECRET }))
			.derive(async () => ({ user: adminUser }))
			.use(curriculumRouter);

		const createRes = await app.handle(
			new Request("http://localhost/academic-terms", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${adminToken}`,
				},
				body: JSON.stringify({
					academicYear: testYear,
					semesterType: "ganjil",
					name: `${testYear} Ganjil Test`,
					startDate: "2029-08-01",
					endDate: "2030-01-31",
					status: "draft",
					isActive: false,
				}),
			}),
		);

		expect(createRes.status).toBe(200);
		const createJson = await createRes.json();
		expect(createJson.success).toBe(true);
		const createdId = createJson.data.id;

		// 2. Aktifkan periode baru
		const activateRes = await app.handle(
			new Request(`http://localhost/academic-terms/${createdId}/activate`, {
				method: "PATCH",
				headers: { Authorization: `Bearer ${adminToken}` },
			}),
		);
		expect(activateRes.status).toBe(200);

		// Verifikasi hanya ada 1 periode yang berstatus isActive = true
		const activeTerms = await db
			.select()
			.from(academicTerms)
			.where(eq(academicTerms.isActive, true));
		expect(activeTerms.length).toBe(1);
		expect(activeTerms[0].id).toBe(createdId);

		// Cleanup
		await db.delete(academicTerms).where(eq(academicTerms.id, createdId));
		await db
			.update(academicTerms)
			.set({ isActive: true, status: "berjalan" })
			.where(
				sql`${academicTerms.academicYear} = '2026/2027' AND ${academicTerms.semesterType} = 'ganjil'`,
			);
		await cacheDel("cache:academic-term:active");
	});

	it("TC-AKD-02: Pembuatan Master Mata Kuliah & Paket Kurikulum Semester 1-6", async () => {
		const testCode = `TEST-MK-${Date.now()}`;

		// 1. Buat master mata kuliah
		const [master] = await db
			.insert(masterCourses)
			.values({
				code: testCode,
				name: "Testing Automation Course",
				sks: 3,
				type: "teori",
				description: "Mata kuliah uji kurikulum",
				isActive: true,
			})
			.returning();

		expect(master).toBeDefined();
		expect(master.code).toBe(testCode);

		// 2. Ambil kurikulum aktif
		const curr = await db.query.curricula.findFirst();
		expect(curr).toBeDefined();

		// 3. Masukkan master course ke paket semester 2
		const [pkg] = await db
			.insert(curriculumPackages)
			.values({
				curriculumId: curr!.id,
				masterCourseId: master.id,
				semester: 2,
				isRequired: true,
				orderIndex: 99,
			})
			.returning();

		expect(pkg).toBeDefined();
		expect(pkg.semester).toBe(2);

		// Cleanup
		await db
			.delete(curriculumPackages)
			.where(eq(curriculumPackages.id, pkg.id));
		await db.delete(masterCourses).where(eq(masterCourses.id, master.id));
	});

	it("TC-AKD-03: Pembukaan Kelas dari Paket Kurikulum (16 Pertemuan Otomatis)", async () => {
		const activeTerm = await getActiveAcademicTerm();
		expect(activeTerm).toBeDefined();

		const curr = await db.query.curricula.findFirst();
		expect(curr).toBeDefined();

		// Hapus sisa uji sebelumnya bila ada
		const oldCourses = await db
			.select({ id: courses.id })
			.from(courses)
			.where(eq(courses.cohort, 99));
		if (oldCourses.length > 0) {
			const oldIds = oldCourses.map((c) => c.id);
			await db
				.delete(courseMeetings)
				.where(inArray(courseMeetings.courseId, oldIds));
			await db.delete(courses).where(inArray(courses.id, oldIds));
		}

		const result = await openClassesFromPackage({
			termId: activeTerm!.id,
			curriculumId: curr!.id,
			cohort: 99, // dummy cohort
			semester: 1,
			rombel: "Kelas Uji",
			createdBy: adminUser.id,
		});

		expect(result).toBeDefined();
		expect(result.totalCreated).toBeGreaterThan(0);

		// Ambil kelas yang baru dibuat
		const createdClass = result.created[0];
		expect(createdClass).toBeDefined();

		// Verifikasi bahwa 16 pertemuan otomatis dibuat
		const meetings = await db
			.select()
			.from(courseMeetings)
			.where(eq(courseMeetings.courseId, createdClass.courseId))
			.orderBy(asc(courseMeetings.meetingNumber));

		expect(meetings.length).toBe(16);
		expect(meetings[7].meetingType).toBe("uts"); // Pertemuan 8 = UTS
		expect(meetings[15].meetingType).toBe("uas"); // Pertemuan 16 = UAS

		// Cleanup
		const cleanCourses = await db
			.select({ id: courses.id })
			.from(courses)
			.where(eq(courses.cohort, 99));
		if (cleanCourses.length > 0) {
			const cIds = cleanCourses.map((c) => c.id);
			await db
				.delete(courseMeetings)
				.where(inArray(courseMeetings.courseId, cIds));
			await db.delete(courses).where(inArray(courses.id, cIds));
		}
	});

	it("TC-AKD-04: Deteksi Bentrok Jadwal Level Mahasiswa (Anti-Bentrok Jadwal)", async () => {
		const activeTerm = await getActiveAcademicTerm();
		expect(activeTerm).toBeDefined();

		// Buat 2 dummy course
		const [c1] = await db
			.insert(courses)
			.values({
				code: `TEST-C1-${Date.now()}`,
				name: "Kelas Pagi A",
				cohort: 98,
				rombel: "Kelas A",
				dosenId: adminUser.id,
				termId: activeTerm!.id,
				semester: 1,
			})
			.returning();

		const [c2] = await db
			.insert(courses)
			.values({
				code: `TEST-C2-${Date.now()}`,
				name: "Kelas Pagi B (Bentrok)",
				cohort: 98,
				rombel: "Kelas B",
				dosenId: adminUser.id,
				termId: activeTerm!.id,
				semester: 1,
			})
			.returning();

		// Buat jadwal untuk c1: Senin 08:00 - 10:00
		const [sched1] = await db
			.insert(classSchedules)
			.values({
				subject: c1.name,
				courseId: c1.id,
				termId: activeTerm!.id,
				cohort: 98,
				rombel: "Kelas A",
				room: "Ruang 101",
				dayOfWeek: "Senin",
				startTime: "08:00",
				endTime: "10:00",
			})
			.returning();

		// Buat jadwal untuk c2: Senin 09:00 - 11:00 (Tumpang tindih)
		const [sched2] = await db
			.insert(classSchedules)
			.values({
				subject: c2.name,
				courseId: c2.id,
				termId: activeTerm!.id,
				cohort: 98,
				rombel: "Kelas B",
				room: "Ruang 102",
				dayOfWeek: "Senin",
				startTime: "09:00",
				endTime: "11:00",
			})
			.returning();

		// Buat mahasiswa uji dan daftarkan ke c1
		const [testStudent] = await db
			.insert(students)
			.values({
				name: "Mahasiswa Bentrok Test",
				cohort: 98,
				rombel: "Kelas A",
				program: "D3 Perhotelan",
			})
			.returning();

		await db.insert(courseEnrollments).values({
			studentId: testStudent.id,
			courseId: c1.id,
			termId: activeTerm!.id,
			source: "paket",
			status: "aktif",
		});

		// Uji fungsi deteksi bentrok saat ingin mendaftar ke c2
		const conflictResult = await checkStudentScheduleConflict(
			testStudent.id,
			c2.id,
			activeTerm!.id,
		);

		expect(conflictResult.hasConflict).toBe(true);
		expect(conflictResult.conflicts.length).toBeGreaterThan(0);
		expect(conflictResult.conflicts[0].day).toBe("Senin");

		// Cleanup
		await db
			.delete(courseEnrollments)
			.where(eq(courseEnrollments.studentId, testStudent.id));
		await db.delete(students).where(eq(students.id, testStudent.id));
		await db.delete(classSchedules).where(eq(classSchedules.id, sched1.id));
		await db.delete(classSchedules).where(eq(classSchedules.id, sched2.id));
		await db.delete(courses).where(eq(courses.cohort, 98));
	});

	it("TC-AKD-05: Alur Pergantian Semester (Rollover) - Pratinjau Dry-run & Eksekusi", async () => {
		// 1. Buat term sumber uji dan term tujuan uji
		const [sourceTerm] = await db
			.insert(academicTerms)
			.values({
				academicYear: "2030/2031",
				semesterType: "ganjil",
				name: "2030/2031 Ganjil Rollover Test",
				startDate: "2030-08-01",
				endDate: "2031-01-31",
				status: "berjalan",
				isActive: false,
			})
			.returning();

		const [targetTerm] = await db
			.insert(academicTerms)
			.values({
				academicYear: "2030/2031",
				semesterType: "genap",
				name: "2030/2031 Genap Rollover Test",
				startDate: "2031-02-01",
				endDate: "2031-07-31",
				status: "draft",
				isActive: false,
			})
			.returning();

		// 2. Jalankan pratinjau rollover (dry-run)
		const preview = await previewSemesterRollover(sourceTerm.id, targetTerm.id);
		expect(preview).toBeDefined();
		expect(preview.sourceTerm.name).toBe(sourceTerm.name);
		expect(preview.targetTerm.name).toBe(targetTerm.name);
		expect(typeof preview.totalStudentsToPromote).toBe("number");

		// 3. Jalankan eksekusi rollover
		const execution = await executeSemesterRollover(
			sourceTerm.id,
			targetTerm.id,
			adminUser.id,
		);

		expect(execution.success).toBe(true);
		expect(execution.promotedStudentsCount).toBeGreaterThan(0);

		// Verifikasi status term sumber berubah menjadi ditutup
		const closedSource = await db.query.academicTerms.findFirst({
			where: eq(academicTerms.id, sourceTerm.id),
		});
		expect(closedSource?.status).toBe("ditutup");
		expect(closedSource?.isActive).toBe(false);

		// Verifikasi status term tujuan menjadi aktif berjalan
		const activeTarget = await db.query.academicTerms.findFirst({
			where: eq(academicTerms.id, targetTerm.id),
		});
		expect(activeTarget?.status).toBe("berjalan");
		expect(activeTarget?.isActive).toBe(true);

		// Verifikasi log rollover tersimpan
		const log = await db.query.semesterRolloverLogs.findFirst({
			where: eq(semesterRolloverLogs.sourceTermId, sourceTerm.id),
		});
		expect(log).toBeDefined();
		expect(log?.status).toBe("success");

		// Kembalikan periode aktif ke 2026/2027 Ganjil
		const realActive = await db.query.academicTerms.findFirst({
			where: sql`${academicTerms.academicYear} = '2026/2027' AND ${academicTerms.semesterType} = 'ganjil'`,
		});
		if (realActive) {
			await db.update(academicTerms).set({ isActive: false });
			await db
				.update(academicTerms)
				.set({ isActive: true, status: "berjalan" })
				.where(eq(academicTerms.id, realActive.id));
		}

		// Cleanup test terms & registrations
		await db
			.delete(studentSemesterRegistrations)
			.where(eq(studentSemesterRegistrations.termId, targetTerm.id));
		await db
			.delete(semesterRolloverLogs)
			.where(eq(semesterRolloverLogs.sourceTermId, sourceTerm.id));
		await db.delete(academicTerms).where(eq(academicTerms.id, sourceTerm.id));
		await db.delete(academicTerms).where(eq(academicTerms.id, targetTerm.id));
	});
});
