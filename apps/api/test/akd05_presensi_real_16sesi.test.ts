import { beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import {
	courseGrades,
	courseMeetingAttendances,
	courseMeetings,
	courses,
	students,
	users,
} from "../src/db/schema";
import { JWT_SECRET } from "../src/middleware/auth";

const API_BASE = "http://127.0.0.1:3001";

describe("AKD-05 Presensi Sesi Kuliah & Sinkronisasi Real-Time (16 Pertemuan)", () => {
	let adminToken: string;
	let dosenToken: string;
	let testStudent: any;
	let testCourse: any;

	beforeAll(async () => {
		const signer = jwt({ name: "jwt", secret: JWT_SECRET });
		const mockApp = new (await import("elysia")).Elysia()
			.use(signer)
			.get("/sign-admin", ({ jwt }: any) =>
				jwt.sign({ id: 1, username: "admin", role: "superadmin" }),
			)
			.get("/sign-dosen", ({ jwt }: any) =>
				jwt.sign({ id: 37, username: "dosen1", role: "dosen" }),
			);

		const resAdmin = await mockApp.handle(
			new Request("http://localhost/sign-admin"),
		);
		adminToken = await resAdmin.text();

		const resDosen = await mockApp.handle(
			new Request("http://localhost/sign-dosen"),
		);
		dosenToken = await resDosen.text();

		// Ensure student 10 is enrolled in matching rombel/peminatan and course 17 has lecturer 37
		await db
			.update(students)
			.set({
				rombel: "Kelas A",
				program: "Hospitality",
				subProgram: "Taiwan-Hospitality",
			})
			.where(eq(students.id, 10));

		await db
			.update(courses)
			.set({ dosenId: 37, rombel: "Kelas A", peminatan: "Taiwan-Hospitality" })
			.where(eq(courses.id, 17));

		// Get student 10 (Ahmad Fauzan, Cohort 14)
		testStudent = await db.query.students.findFirst({
			where: eq(students.id, 10),
		});

		// Get course 17 (FO101, Front Office)
		testCourse = await db.query.courses.findFirst({
			where: eq(courses.id, 17),
			with: {
				meetings: {
					orderBy: (m, { asc }) => [asc(m.meetingNumber)],
				},
			},
		});

		// Clean up any previous test attendances for student 10 in course 17
		const testMeetingIds = testCourse.meetings.map((m: any) => m.id);
		await db
			.delete(courseMeetingAttendances)
			.where(
				and(
					eq(courseMeetingAttendances.studentId, 10),
					inArray(courseMeetingAttendances.meetingId, testMeetingIds),
				),
			);

		await db
			.update(courseGrades)
			.set({
				attendancePresent: 0,
				totalMeetings: 16,
				attendanceRate: 0,
				practicalScore: null,
				theoryScore: null,
				grade: null,
			})
			.where(
				and(eq(courseGrades.studentId, 10), eq(courseGrades.courseId, 17)),
			);
	});

	it("TC-AKD05-01: Jumlah pertemuan per mata kuliah harus tepat 16 sesi (tidak ada PKKMB/BC di jadwal kuliah)", async () => {
		const res = await fetch(`${API_BASE}/courses/${testCourse.id}/meetings`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});
		expect(res.status).toBe(200);
		const json = (await res.json()) as any;
		expect(json.success).toBe(true);

		const meetings = json.data as any[];
		expect(meetings.length).toBe(16);

		// Pertemuan 1 s/d 16
		const numbers = meetings.map((m) => m.meetingNumber);
		expect(numbers).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]);

		// Meeting 8 harus UTS, Meeting 16 harus UAS
		const m8 = meetings.find((m) => m.meetingNumber === 8);
		const m16 = meetings.find((m) => m.meetingNumber === 16);
		expect(m8.meetingType).toBe("uts");
		expect(m16.meetingType).toBe("uas");
	});

	it("TC-AKD05-02: Endpoint presensi mata kuliah mahasiswa harus menampilkan data real dan 16 sesi per mata kuliah", async () => {
		const res = await fetch(
			`${API_BASE}/attendance/mahasiswa/${testStudent.id}/mata-kuliah`,
			{
				headers: { Authorization: `Bearer ${adminToken}` },
			},
		);
		expect(res.status).toBe(200);
		const json = (await res.json()) as any;
		expect(json.success).toBe(true);

		const grades = json.data.grades as any[];
		expect(grades.length).toBeGreaterThan(0);

		// Cari Front Office (FO101)
		const foGrade = grades.find((g) => g.courseId === 17);
		expect(foGrade).toBeDefined();
		expect(foGrade.totalMeetings).toBe(16);
		expect(foGrade.meetings.length).toBe(16);

		// Sebelum diisi oleh dosen, presensi harus 0% dan bukan data mock palsu (95/94 A)
		expect(foGrade.attendancePresent).toBe(0);
		expect(foGrade.attendanceRate).toBe(0);
		expect(foGrade.practicalScore).toBeNull();
		expect(foGrade.theoryScore).toBeNull();
		expect(["-", null]).toContain(foGrade.grade);
	});

	it("TC-AKD05-03: Input presensi & nilai dari Panel Dosen harus langsung tersinkronisasi ke tab kehadiran mahasiswa dengan pembagi 16", async () => {
		// Dosen mengisi presensi Pertemuan 1 untuk mahasiswa 10: Hadir, Teori 88, Praktik 92
		const m1 = testCourse.meetings.find((m: any) => m.meetingNumber === 1);
		expect(m1).toBeDefined();

		const submitRes = await fetch(
			`${API_BASE}/courses/${testCourse.id}/meetings/${m1.id}/attendances`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${dosenToken}`,
				},
				body: JSON.stringify({
					attendances: [
						{
							studentId: testStudent.id,
							status: "hadir",
							theoryScore: 88,
							practicalScore: 92,
							notes: "Aktif dan tepat waktu",
						},
					],
				}),
			},
		);
		expect(submitRes.status).toBe(200);

		// Verifikasi pembacaan dari tab presensi mahasiswa
		const verifyRes = await fetch(
			`${API_BASE}/attendance/mahasiswa/${testStudent.id}/mata-kuliah`,
			{
				headers: { Authorization: `Bearer ${adminToken}` },
			},
		);
		const verifyJson = (await verifyRes.json()) as any;
		const foGrade = verifyJson.data.grades.find((g: any) => g.courseId === 17);

		expect(foGrade).toBeDefined();
		expect(foGrade.attendancePresent).toBe(1);
		expect(foGrade.totalMeetings).toBe(16);
		// 1 dari 16 = 6%
		expect(foGrade.attendanceRate).toBe(6);
		expect(foGrade.theoryScore).toBe(88);
		expect(["A", "B+"]).toContain(foGrade.grade); // Mengikuti pembobotan vokasi AKD-06 (presensi + teori + praktik)

		// Rincian Pertemuan 1
		const m1Detail = foGrade.meetings.find((m: any) => m.meetingNumber === 1);
		expect(m1Detail.status).toBe("hadir");
		expect(m1Detail.theoryScore).toBe(88);
		expect(m1Detail.practicalScore).toBe(92);
		expect(m1Detail.notes).toBe("Aktif dan tepat waktu");
	});

	it("TC-AKD05-04: Koreksi presensi per pertemuan dari Tab Mahasiswa harus tersinkronisasi kembali ke agregat", async () => {
		const m2 = testCourse.meetings.find((m: any) => m.meetingNumber === 2);
		expect(m2).toBeDefined();

		// Akademik menginput presensi pertemuan 2 via endpoint mahasiswa
		const patchRes = await fetch(
			`${API_BASE}/attendance/mahasiswa/${testStudent.id}/mata-kuliah-meeting/${testCourse.id}/${m2.id}`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${adminToken}`,
				},
				body: JSON.stringify({
					status: "hadir",
					theoryScore: 85,
					practicalScore: 90,
					notes: "Koreksi kehadiran P2",
				}),
			},
		);
		expect(patchRes.status).toBe(200);

		// Cek hasil agregat: Sekarang 2 sesi hadir dari 16 sesi = 13%
		const checkRes = await fetch(
			`${API_BASE}/attendance/mahasiswa/${testStudent.id}/mata-kuliah`,
			{
				headers: { Authorization: `Bearer ${adminToken}` },
			},
		);
		const checkJson = (await checkRes.json()) as any;
		const foGrade = checkJson.data.grades.find((g: any) => g.courseId === 17);

		expect(foGrade.attendancePresent).toBe(2);
		expect(foGrade.totalMeetings).toBe(16);
		expect(foGrade.attendanceRate).toBe(13); // round(2/16 * 100) = 13%
	});
});
