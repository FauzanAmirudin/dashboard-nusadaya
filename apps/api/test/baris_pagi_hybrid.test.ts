import { beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import {
	morningAssemblyRecords,
	morningAssemblyScheduleConfig,
	morningAssemblySessions,
	students,
	users,
} from "../src/db/schema";
import { JWT_SECRET } from "../src/middleware/auth";
import {
	evaluateMorningAssemblyArrival,
	getWIBDateTime,
	isWithinWindow,
} from "../src/routes/attendance";

const API_BASE = "http://127.0.0.1:3001";

describe("AKD-05 Baris Pagi Hybrid System (Automated + Self Check-In + Reschedule)", () => {
	let adminToken: string;
	let studentToken: string;
	let testStudent: any;
	let testUser: any;
	let createdSessionId: number;

	beforeAll(async () => {
		const signer = jwt({ name: "jwt", secret: JWT_SECRET });

		// Find a student and user for testing
		testStudent = await db.query.students.findFirst({
			where: eq(students.cohort, 16),
		});

		if (!testStudent) {
			testStudent = await db.query.students.findFirst();
		}

		// Find or mock corresponding user
		if (testStudent.studentUserId) {
			testUser = await db.query.users.findFirst({
				where: eq(users.id, testStudent.studentUserId),
			});
		}
		if (!testUser) {
			// Find a user with role mahasiswa or create/mock token
			testUser = await db.query.users.findFirst({
				where: eq(users.role, "mahasiswa"),
			});
		}

		const studentUserId = testUser ? testUser.id : 999;
		const studentUsername = testStudent.nim || "mhs_test";

		// Update testStudent to link with this user if needed
		if (testUser && testStudent.studentUserId !== testUser.id) {
			await db
				.update(students)
				.set({ studentUserId: testUser.id })
				.where(eq(students.id, testStudent.id));
		}

		const mockApp = new (await import("elysia")).Elysia()
			.use(signer)
			.get("/sign-admin", ({ jwt }: any) =>
				jwt.sign({ id: 32, username: "superadmin", role: "superadmin" }),
			)
			.get("/sign-student", ({ jwt }: any) =>
				jwt.sign({
					id: studentUserId,
					username: studentUsername,
					role: "mahasiswa",
				}),
			);

		const resAdmin = await mockApp.handle(
			new Request("http://localhost/sign-admin"),
		);
		adminToken = await resAdmin.text();

		const resStudent = await mockApp.handle(
			new Request("http://localhost/sign-student"),
		);
		studentToken = await resStudent.text();
	});

	it("TC-BP-01: Unit helpers WIB datetime & window evaluation", () => {
		const { dateStr, timeStr } = getWIBDateTime();
		expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(timeStr).toMatch(/^\d{2}:\d{2}$/);

		// Window check
		expect(isWithinWindow("06:15", "05:30", "07:00")).toBe(true);
		expect(isWithinWindow("05:30", "05:30", "07:00")).toBe(true);
		expect(isWithinWindow("07:00", "05:30", "07:00")).toBe(true);
		expect(isWithinWindow("05:29", "05:30", "07:00")).toBe(false);
		expect(isWithinWindow("07:01", "05:30", "07:00")).toBe(false);

		// Punctuality check vs 06:22
		const early = evaluateMorningAssemblyArrival("06:15", "06:22");
		expect(early.status).toBe("hadir");
		expect(early.isLate).toBe(false);
		expect(early.minutesLate).toBe(0);

		const onDot = evaluateMorningAssemblyArrival("06:22", "06:22");
		expect(onDot.status).toBe("hadir");
		expect(onDot.isLate).toBe(false);

		const late = evaluateMorningAssemblyArrival("06:30", "06:22");
		expect(late.status).toBe("terlambat");
		expect(late.isLate).toBe(true);
		expect(late.minutesLate).toBe(8);
	});

	it("TC-BP-02: Manage recurring schedule config (GET & POST)", async () => {
		// Read config
		const resGet = await fetch(
			`${API_BASE}/attendance/baris-pagi/schedule-config?cohort=16`,
			{
				headers: { Authorization: `Bearer ${adminToken}` },
			},
		);
		const jsonGet = await resGet.json();
		expect(jsonGet.success).toBe(true);
		expect(Array.isArray(jsonGet.data)).toBe(true);

		// Update/create config
		const resPost = await fetch(
			`${API_BASE}/attendance/baris-pagi/schedule-config`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${adminToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					cohort: 16,
					dayOfWeek: 1, // Monday
					targetTime: "06:22",
					checkInWindowStart: "05:30",
					checkInWindowEnd: "07:00",
					location: "Lapangan Utama Kampus",
					rombel: "Semua",
					isActive: true,
				}),
			},
		);
		const jsonPost = await resPost.json();
		expect(jsonPost.success).toBe(true);
		expect(jsonPost.data.targetTime).toBe("06:22");
	});

	it("TC-BP-03: Auto-generate sessions for recurring schedule", async () => {
		const resGen = await fetch(
			`${API_BASE}/attendance/baris-pagi/generate-sessions`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${adminToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					cohort: 16,
					weeksAhead: 2,
				}),
			},
		);
		const jsonGen = await resGen.json();
		expect(jsonGen.success).toBe(true);
		expect(Array.isArray(jsonGen.data)).toBe(true);

		// Verify sessions exist in DB
		const sessions = await db.query.morningAssemblySessions.findMany({
			where: eq(morningAssemblySessions.cohort, 16),
		});
		expect(sessions.length).toBeGreaterThan(0);
		createdSessionId = sessions[0].id;
	});

	it("TC-BP-04: Student GET /baris-pagi/today endpoint", async () => {
		const resToday = await fetch(`${API_BASE}/attendance/baris-pagi/today`, {
			headers: { Authorization: `Bearer ${studentToken}` },
		});
		const jsonToday = await resToday.json();
		expect(jsonToday.success).toBe(true);
		expect(jsonToday.data).toBeDefined();
		expect(jsonToday.data.serverDate).toBeDefined();
		expect(jsonToday.data.serverTime).toBeDefined();
	});

	it("TC-BP-05: Reschedule session to a new date and verify history", async () => {
		// Pick created session
		const session = await db.query.morningAssemblySessions.findFirst({
			where: eq(morningAssemblySessions.id, createdSessionId),
		});
		expect(session).toBeDefined();

		const originalDate = session!.sessionDate;
		const newDate = "2026-11-09";

		const resReschedule = await fetch(
			`${API_BASE}/attendance/baris-pagi/sessions/${createdSessionId}/reschedule`,
			{
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${adminToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					newDate,
					reason: "Upacara Hari Pahlawan Nasional",
				}),
			},
		);
		const jsonReschedule = await resReschedule.json();
		expect(jsonReschedule.success).toBe(true);
		expect(jsonReschedule.data.sessionDate).toBe(newDate);
		expect(jsonReschedule.data.rescheduledFrom).toBe(originalDate);
		expect(jsonReschedule.data.notes).toContain("Upacara Hari Pahlawan");
	});

	it("TC-BP-06: Update session status (active, completed)", async () => {
		const resStatus = await fetch(
			`${API_BASE}/attendance/baris-pagi/sessions/${createdSessionId}/status`,
			{
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${adminToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status: "active" }),
			},
		);
		const jsonStatus = await resStatus.json();
		expect(jsonStatus.success).toBe(true);
		expect(jsonStatus.data.sessionStatus).toBe("active");
	});

	it("TC-BP-07: Auto-mark unrecorded students as alpha after session end", async () => {
		const resAlpha = await fetch(
			`${API_BASE}/attendance/baris-pagi/sessions/${createdSessionId}/auto-alpha`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${adminToken}`,
				},
			},
		);
		const jsonAlpha = await resAlpha.json();
		expect(jsonAlpha.success).toBe(true);
		expect(jsonAlpha.markedCount).toBeGreaterThanOrEqual(0);

		// Clean up created test sessions to keep db clean
		await db
			.delete(morningAssemblySessions)
			.where(eq(morningAssemblySessions.id, createdSessionId));
	});
});
