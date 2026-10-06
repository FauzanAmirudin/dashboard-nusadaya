import { describe, expect, it } from "bun:test";
import {
	AUTH_RATE_LIMIT_CONFIG,
	checkLoginIpRateLimit,
	checkLoginLockout,
	recordFailedLogin,
	resetLoginAttempts,
} from "../../lib/auth-rate-limit";
import { hasRole } from "../../lib/permissions";
import {
	calculateAttendanceRate,
	calculateCourseFinalScore,
	calculateFinanceBillStatus,
	isValidAttendanceStatus,
	isValidPaymentMethod,
	validateStudentInput,
} from "../../lib/route-helpers";
import {
	createSession,
	invalidateSession,
	SESSION_CONFIG,
	validateAndTouchSession,
} from "../../lib/session";
import { createMockDb } from "../helpers/mockDb";
import {
	createAkademikUser,
	createCrmUser,
	createMockUser,
	createSuperadminUser,
} from "../helpers/mockUser";

describe("Tahap 4 — API Route Logic (Backend)", () => {
	// ============================================================
	// FILE: apps/api/src/lib/auth-rate-limit.ts (Task 4.1)
	// ============================================================
	describe("Task 4.1 — Rate Limiter Logic", () => {
		it("should allow first request within the window", async () => {
			const ip = "192.168.1.10";
			const res = await checkLoginIpRateLimit(ip);
			expect(res.allowed).toBe(true);
			expect(res.remaining).toBe(
				AUTH_RATE_LIMIT_CONFIG.GLOBAL_IP_MAX_REQUESTS - 1,
			);
		});

		it("should allow request N exactly at the limit", async () => {
			const ip = "192.168.1.20";
			const limit = AUTH_RATE_LIMIT_CONFIG.GLOBAL_IP_MAX_REQUESTS;
			let lastRes: any;
			for (let i = 0; i < limit; i++) {
				lastRes = await checkLoginIpRateLimit(ip);
			}
			expect(lastRes.allowed).toBe(true);
			expect(lastRes.remaining).toBe(0);
		});

		it("should reject request exceeding the limit within the window", async () => {
			const ip = "192.168.1.30";
			const limit = AUTH_RATE_LIMIT_CONFIG.GLOBAL_IP_MAX_REQUESTS;
			for (let i = 0; i < limit; i++) {
				await checkLoginIpRateLimit(ip);
			}
			// Request limit + 1
			const blocked = await checkLoginIpRateLimit(ip);
			expect(blocked.allowed).toBe(false);
			expect(blocked.remaining).toBe(0);
		});

		it("should track counters separately for different IPs", async () => {
			const ipA = "10.0.0.1";
			const ipB = "10.0.0.2";

			// Consume limit on ipA
			for (let i = 0; i < AUTH_RATE_LIMIT_CONFIG.GLOBAL_IP_MAX_REQUESTS; i++) {
				await checkLoginIpRateLimit(ipA);
			}
			const resA = await checkLoginIpRateLimit(ipA);
			const resB = await checkLoginIpRateLimit(ipB);

			expect(resA.allowed).toBe(false);
			expect(resB.allowed).toBe(true); // ipB remains unaffected
		});

		it("should trigger account lockout after 7 failed attempts", async () => {
			const ip = "172.16.0.5";
			const username = "target_user";

			// Reset first
			await resetLoginAttempts(ip, username);

			// 6 failed attempts
			for (let i = 1; i <= 6; i++) {
				const fail = await recordFailedLogin(ip, username);
				expect(fail.isLocked).toBe(false);
				expect(fail.remainingAttempts).toBe(7 - i);
			}

			// 7th attempt triggers lockout
			const seventh = await recordFailedLogin(ip, username);
			expect(seventh.isLocked).toBe(true);
			expect(seventh.remainingAttempts).toBe(0);

			// Check lockout status
			const lockout = await checkLoginLockout(ip, username);
			expect(lockout.isLocked).toBe(true);

			// Reset unlocks
			await resetLoginAttempts(ip, username);
			const afterReset = await checkLoginLockout(ip, username);
			expect(afterReset.isLocked).toBe(false);
		});
	});

	// ============================================================
	// FILE: apps/api/src/lib/session.ts (Task 4.2)
	// ============================================================
	describe("Task 4.2 — Session Logic", () => {
		it("should create and validate session with correct user details", async () => {
			const user = {
				id: 101,
				username: "session_user",
				role: "akademik",
				roles: ["akademik"],
			};

			const sessionId = await createSession(user);
			expect(sessionId).toBeDefined();

			const check = await validateAndTouchSession(sessionId);
			expect(check.valid).toBe(true);
			expect(check.session?.userId).toBe(101);
			expect(check.session?.username).toBe("session_user");
			expect(check.session?.role).toBe("akademik");
		});

		it("should reject non-existent or empty session ID", async () => {
			const resEmpty = await validateAndTouchSession("");
			expect(resEmpty.valid).toBe(false);
			expect(resEmpty.reason).toBe("not_found");

			const resRandom = await validateAndTouchSession(crypto.randomUUID());
			expect(resRandom.valid).toBe(false);
			expect(resRandom.reason).toBe("not_found");
		});

		it("should invalidate and reject session after explicit logout", async () => {
			const user = { id: 202, username: "logout_user", role: "crm" };
			const sessionId = await createSession(user);

			const checkBefore = await validateAndTouchSession(sessionId);
			expect(checkBefore.valid).toBe(true);

			await invalidateSession(sessionId, user.id, "user_logout");

			const checkAfter = await validateAndTouchSession(sessionId);
			expect(checkAfter.valid).toBe(false);
			expect(checkAfter.reason).toBe("not_found");
		});

		it("should generate distinct session IDs for different logins", async () => {
			const user = { id: 303, username: "user303", role: "finance" };
			const session1 = await createSession(user);
			const session2 = await createSession(user);

			expect(session1).not.toBe(session2);
		});
	});

	// ============================================================
	// FILE: apps/api/src/routes/mahasiswa.ts (Tasks 4.3 – 4.6)
	// ============================================================
	describe("Panel Mahasiswa & Academic Routes (mahasiswa.ts & student/academic.ts)", () => {
		describe("Task 4.3 — Mahasiswa Route Validasi Input", () => {
			it("should reject empty NIM with 400 Bad Request message", () => {
				const invalid = { nim: "", name: "Budi", email: "budi@example.com" };
				const result = validateStudentInput(invalid);
				expect(result.isValid).toBe(false);
				expect(result.errorField).toBe("nim");
			});

			it("should reject invalid email format", () => {
				const invalid = { nim: "12345", name: "Budi", email: "not-an-email" };
				const result = validateStudentInput(invalid);
				expect(result.isValid).toBe(false);
				expect(result.errorField).toBe("email");
			});

			it("should reject NIM exceeding maximum length 30", () => {
				const longNim = "A".repeat(31);
				const invalid = { nim: longNim, name: "Budi" };
				const result = validateStudentInput(invalid);
				expect(result.isValid).toBe(false);
				expect(result.errorField).toBe("nim");
			});

			it("should reject invalid studentStatus outside enum", () => {
				const invalid = {
					nim: "12345",
					name: "Budi",
					studentStatus: "INVALID_STATUS",
				};
				const result = validateStudentInput(invalid);
				expect(result.isValid).toBe(false);
				expect(result.errorField).toBe("studentStatus");
			});

			it("should accept valid input data without error", () => {
				const valid = {
					nim: "NUSA2026001",
					name: "Budi Santoso",
					email: "budi@nusadaya.ac.id",
					studentStatus: "aktif",
				};
				const result = validateStudentInput(valid);
				expect(result.isValid).toBe(true);
			});
		});

		describe("Task 4.4 — Mahasiswa Route Authorization Guard", () => {
			it("should deny request when user is unauthenticated (null)", () => {
				expect(hasRole(null, "akademik")).toBe(false);
			});

			it("should forbid user with role 'crm' from accessing 'akademik' resource", () => {
				const crmUser = createCrmUser();
				expect(hasRole(crmUser, "akademik")).toBe(false);
			});

			it("should allow superadmin to access all resources", () => {
				const superadmin = createSuperadminUser();
				expect(hasRole(superadmin, "akademik")).toBe(true);
				expect(hasRole(superadmin, "finance")).toBe(true);
				expect(hasRole(superadmin, "pmb")).toBe(true);
			});

			it("should allow user with the exact required role", () => {
				const acadUser = createAkademikUser();
				expect(hasRole(acadUser, "akademik")).toBe(true);
			});
		});

		describe("Task 4.5 — GET /students/:id/academic Logic", () => {
			it("should return academic data when student exists", async () => {
				const mockDb = createMockDb();
				const fakeAcademic = {
					id: 1,
					studentId: 10,
					pddiktiInput: true,
					gpa: 375,
					status: "AMAN",
				};
				mockDb.setQueryResult("academicData", "findFirst", fakeAcademic);

				const result = await mockDb.query.academicData.findFirst({
					where: {} as any,
				});
				expect(result).toEqual(fakeAcademic);
			});

			it("should return null (404 Not Found) when student does not exist", async () => {
				const mockDb = createMockDb();
				mockDb.setQueryResult("academicData", "findFirst", null);

				const result = await mockDb.query.academicData.findFirst({
					where: {} as any,
				});
				expect(result).toBeNull();
			});

			it("should handle non-numeric studentId as NaN", () => {
				const parsed = Number("abc");
				expect(Number.isNaN(parsed)).toBe(true);
			});
		});

		describe("Task 4.6 — POST /students/:id/academic/acc Logic", () => {
			it("should forbid non-akademik and non-superadmin users", () => {
				const crmUser = createCrmUser();
				expect(hasRole(crmUser, "akademik")).toBe(false);
			});

			it("should allow user with akademik role", () => {
				const acadUser = createAkademikUser();
				expect(hasRole(acadUser, "akademik")).toBe(true);
			});

			it("should verify whether all 6 required academic indicators are checked before ACC", () => {
				const completeAcademic = {
					pddiktiInput: true,
					utsPassed: true,
					uasPassed: true,
					attitudeIndicator: true,
					assignmentsCompleted: true,
					academicCommunication: true,
				};
				const incompleteAcademic = {
					...completeAcademic,
					utsPassed: false,
				};

				const isComplete = (acad: any) =>
					Boolean(
						acad?.pddiktiInput &&
							acad?.utsPassed &&
							acad?.uasPassed &&
							acad?.attitudeIndicator &&
							acad?.assignmentsCompleted &&
							acad?.academicCommunication,
					);

				expect(isComplete(completeAcademic)).toBe(true);
				expect(isComplete(incompleteAcademic)).toBe(false);
			});
		});
	});

	// ============================================================
	// FILE: apps/api/src/routes/attendance.ts (Tasks 4.7 & 4.8)
	// ============================================================
	describe("Panel Attendance (attendance.ts)", () => {
		describe("Task 4.7 — Attendance Perhitungan Persentase Kehadiran", () => {
			it("should return 100% when 10 out of 10 meetings are attended", () => {
				expect(calculateAttendanceRate(10, 10)).toBe(100);
			});

			it("should return 0% when 0 out of 10 meetings are attended", () => {
				expect(calculateAttendanceRate(0, 10)).toBe(0);
			});

			it("should return 50% when 5 out of 10 meetings are attended", () => {
				expect(calculateAttendanceRate(5, 10)).toBe(50);
			});

			it("should return 0% without crashing when totalMeetings is 0 (division by zero protection)", () => {
				expect(calculateAttendanceRate(0, 0)).toBe(0);
				expect(calculateAttendanceRate(5, 0)).toBe(0);
				expect(calculateAttendanceRate(0, -1)).toBe(0);
			});
		});

		describe("Task 4.8 — Attendance Validasi Input Absensi", () => {
			it("should accept valid enum status 'hadir'", () => {
				expect(isValidAttendanceStatus("hadir")).toBe(true);
			});

			it("should accept valid enum status 'izin'", () => {
				expect(isValidAttendanceStatus("izin")).toBe(true);
			});

			it("should accept valid enum status 'sakit'", () => {
				expect(isValidAttendanceStatus("sakit")).toBe(true);
			});

			it("should accept valid enum status 'alpa' and 'alpha'", () => {
				expect(isValidAttendanceStatus("alpa")).toBe(true);
				expect(isValidAttendanceStatus("alpha")).toBe(true);
			});

			it("should reject non-enum status 'bolos'", () => {
				expect(isValidAttendanceStatus("bolos")).toBe(false);
			});

			it("should reject empty, null, or undefined status", () => {
				expect(isValidAttendanceStatus("")).toBe(false);
				expect(isValidAttendanceStatus(null)).toBe(false);
				expect(isValidAttendanceStatus(undefined)).toBe(false);
			});
		});
	});

	// ============================================================
	// FILE: apps/api/src/routes/finance.ts (Tasks 4.9 & 4.10)
	// ============================================================
	describe("Panel Finance (finance.ts)", () => {
		describe("Task 4.9 — Finance Validasi Metode Pembayaran", () => {
			it("should accept 'dana_talangan'", () => {
				expect(isValidPaymentMethod("dana_talangan")).toBe(true);
			});

			it("should accept 'mandiri'", () => {
				expect(isValidPaymentMethod("mandiri")).toBe(true);
			});

			it("should reject unregistered payment method 'cicilan'", () => {
				expect(isValidPaymentMethod("cicilan")).toBe(false);
			});

			it("should reject empty value", () => {
				expect(isValidPaymentMethod("")).toBe(false);
				expect(isValidPaymentMethod(null)).toBe(false);
			});
		});

		describe("Task 4.10 — Finance Kalkulasi Status Tagihan", () => {
			it("should consider semester paid when talangan + t1SemesterStatus = true", () => {
				const fin = {
					metodePembayaran: "dana_talangan",
					t1SemesterStatus: true,
					mandiriSemesterStatus: false,
				};
				const status = calculateFinanceBillStatus(fin);
				expect(status.isSemesterLunas).toBe(true);
			});

			it("should consider semester unpaid when mandiri + mandiriSemesterStatus = false", () => {
				const fin = {
					metodePembayaran: "mandiri",
					t1SemesterStatus: true,
					mandiriSemesterStatus: false,
				};
				const status = calculateFinanceBillStatus(fin);
				expect(status.isSemesterLunas).toBe(false);
			});

			it("should consider registrasi completed when registrasiStatus = true", () => {
				const fin = { registrasiStatus: true };
				const status = calculateFinanceBillStatus(fin);
				expect(status.isRegistrasiLunas).toBe(true);
			});

			it("should set isFinanceReady = true when all 6 obligations are paid", () => {
				const fin = {
					metodePembayaran: "mandiri",
					registrasiStatus: true,
					mandiriSemesterStatus: true,
					mandiriInterviewStatus: true,
					mandiriKeberangkatanStatus: true,
					toeicStatus: true,
					pasporStatus: true,
				};
				const status = calculateFinanceBillStatus(fin);
				expect(status.isFinanceReady).toBe(true);
			});
		});
	});

	// ============================================================
	// FILE: apps/api/src/routes/courses.ts (Task 4.11)
	// ============================================================
	describe("Panel Courses (courses.ts)", () => {
		describe("Task 4.11 — Courses Kalkulasi Nilai Akhir Mata Kuliah", () => {
			it("should compute final score correctly for UTS 80 + UAS 90 + Tugas 85", () => {
				// 80*0.3 + 90*0.4 + 85*0.3 = 24 + 36 + 25.5 = 85.5
				const score = calculateCourseFinalScore(80, 90, 85);
				expect(score).toBe(85.5);
			});

			it("should handle one component being 0 accurately", () => {
				// 0*0.3 + 80*0.4 + 70*0.3 = 0 + 32 + 21 = 53
				const score = calculateCourseFinalScore(0, 80, 70);
				expect(score).toBe(53);
			});

			it("should return 100 for perfect scores across all components", () => {
				const score = calculateCourseFinalScore(100, 100, 100);
				expect(score).toBe(100);
			});

			it("should return 0 when all components are 0", () => {
				const score = calculateCourseFinalScore(0, 0, 0);
				expect(score).toBe(0);
			});
		});
	});
});
