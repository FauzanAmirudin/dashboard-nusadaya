import { beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import {
	attendanceCheckpointConfig,
	morningAssemblyRecords,
	morningAssemblySessions,
	selfieFraudFlags,
	students,
	users,
} from "../src/db/schema";
import {
	calculateDistanceMeters,
	detectGpsSpoofingRisk,
	getCheckpointForSession,
	isWithinRadius,
} from "../src/lib/geolocation";
import { isRedisReady, redis } from "../src/lib/redis";
import { JWT_SECRET } from "../src/middleware/auth";
import { getWIBDateTime } from "../src/routes/attendance";

const API_BASE = "http://127.0.0.1:3001";

describe("Sistem Absensi Selfie + GPS (Kuliah, Piket, Baris Pagi, ODS)", () => {
	let adminToken: string;
	let studentToken: string;
	let testStudent: any;
	let testUser: any;
	let testSessionId: number;

	beforeAll(async () => {
		const signer = jwt({ name: "jwt", secret: JWT_SECRET });

		// 1. Ambil data mahasiswa untuk testing
		testStudent = await db.query.students.findFirst({
			where: eq(students.cohort, 16),
		});
		if (!testStudent) {
			testStudent = await db.query.students.findFirst();
		}

		if (!testStudent) {
			throw new Error("Data mahasiswa untuk test tidak ditemukan di database.");
		}

		// 2. Hubungkan mahasiswa dengan user auth
		if (testStudent.studentUserId) {
			testUser = await db.query.users.findFirst({
				where: eq(users.id, testStudent.studentUserId),
			});
		}
		if (!testUser) {
			testUser = await db.query.users.findFirst({
				where: eq(users.role, "mahasiswa"),
			});
		}

		if (testUser && testStudent.studentUserId !== testUser.id) {
			await db
				.update(students)
				.set({ studentUserId: testUser.id })
				.where(eq(students.id, testStudent.id));
		}

		const studentUserId = testUser ? testUser.id : 999;
		const studentUsername = testStudent.nim || "mhs_selfie_test";

		// 3. Generate tokens
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

		// 4. Siapkan sesi baris pagi hari ini untuk testing check-in
		const { dateStr } = getWIBDateTime();
		const existingSession = await db.query.morningAssemblySessions.findFirst({
			where: and(
				eq(morningAssemblySessions.sessionDate, dateStr),
				eq(morningAssemblySessions.cohort, testStudent.cohort),
			),
		});

		if (!existingSession) {
			const [created] = await db
				.insert(morningAssemblySessions)
				.values({
					cohort: testStudent.cohort,
					rombel: testStudent.rombel || "Semua",
					sessionDate: dateStr,
					targetTime: "06:22",
					checkInWindowStart: "00:01",
					checkInWindowEnd: "23:59",
					location: "Lapangan Utama Kampus",
					notes: "Sesi test selfie attendance",
					sessionStatus: "active",
					createdBy: 32,
				})
				.returning();
			testSessionId = created.id;
		} else {
			testSessionId = existingSession.id;
			// Pastikan window terbuka untuk test
			await db
				.update(morningAssemblySessions)
				.set({
					checkInWindowStart: "00:01",
					checkInWindowEnd: "23:59",
					sessionStatus: "active",
				})
				.where(eq(morningAssemblySessions.id, testSessionId));
		}

		// Bersihkan record lama untuk mahasiswa ini pada sesi ini agar test idempoten
		await db
			.delete(morningAssemblyRecords)
			.where(
				and(
					eq(morningAssemblyRecords.sessionId, testSessionId),
					eq(morningAssemblyRecords.studentId, testStudent.id),
				),
			);

		if (isRedisReady()) {
			await redis.del(`rl:selfie:selfie:baris_pagi:${testStudent.id}`);
			await redis.del(
				`lock:attendance:baris_pagi:${testSessionId}:${testStudent.id}`,
			);
		}
	});

	// =========================================================================
	// 1. UNIT TEST: FUNGSI GEOLOKASI & DETEKSI SPOOFING
	// =========================================================================
	describe("1. Geolocation & Spoofing Risk Utilities", () => {
		it("menghitung jarak 0 meter jika koordinat identik", () => {
			const dist = calculateDistanceMeters(
				-8.6705,
				115.2126,
				-8.6705,
				115.2126,
			);
			expect(dist).toBe(0);
		});

		it("menghitung jarak Haversine antar 2 titik di Bali dengan presisi wajar", () => {
			// Titik Kampus (-8.6705, 115.2126) ke Lapangan Renon (-8.6725, 115.2340) ~ 2.3km
			const dist = calculateDistanceMeters(-8.6705, 115.2126, -8.6725, 115.234);
			expect(dist).toBeGreaterThan(2000);
			expect(dist).toBeLessThan(2600);
		});

		it("mengecek radius secara tepat (isWithinRadius)", () => {
			const center = { latitude: -8.6705, longitude: 115.2126 };
			const near = { latitude: -8.6706, longitude: 115.2127 }; // ~15 meter
			const far = { latitude: -8.7, longitude: 115.2126 }; // ~3.2 km

			expect(isWithinRadius(near, center, 150)).toBe(true);
			expect(isWithinRadius(far, center, 150)).toBe(false);
		});

		it("mendeteksi koordinat normal di Indonesia dengan akurasi wajar", () => {
			const result = detectGpsSpoofingRisk(12, -8.6705, 115.2126);
			expect(result.isSuspicious).toBe(false);
		});

		it("menandai anomali bila akurasi GPS terlalu rendah (> 500m)", () => {
			const result = detectGpsSpoofingRisk(650, -8.6705, 115.2126);
			expect(result.isSuspicious).toBe(true);
			expect(result.reason).toBe("gps_accuracy_too_low");
		});

		it("menandai anomali bila akurasi GPS tidak valid (<= 0 atau NaN)", () => {
			const res1 = detectGpsSpoofingRisk(0, -8.6705, 115.2126);
			expect(res1.isSuspicious).toBe(true);

			const res2 = detectGpsSpoofingRisk(-5, -8.6705, 115.2126);
			expect(res2.isSuspicious).toBe(true);
		});

		it("menandai anomali bila koordinat berada di luar wilayah Indonesia", () => {
			// London: 51.5074, -0.1278
			const result = detectGpsSpoofingRisk(10, 51.5074, -0.1278);
			expect(result.isSuspicious).toBe(true);
			expect(result.reason).toBe("gps_spoofing_suspected");
		});

		it("mengambil checkpoint aktif dari database atau fallback kampus default", async () => {
			const checkpoint = await getCheckpointForSession("baris_pagi", 16);
			expect(checkpoint).toBeDefined();
			expect(typeof checkpoint.latitude).toBe("number");
			expect(typeof checkpoint.longitude).toBe("number");
			expect(checkpoint.radiusMeters).toBeGreaterThan(0);
		});
	});

	// =========================================================================
	// 2. CHECKPOINT CONFIGURATION CRUD API
	// =========================================================================
	describe("2. Checkpoint Configuration API", () => {
		let createdConfigId: number;

		it("GET /attendance/checkpoint-config/active mengembalikan checkpoint aktif", async () => {
			const res = await fetch(
				`${API_BASE}/attendance/checkpoint-config/active?type=baris_pagi&cohort=16`,
			);
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data).toBeDefined();
			expect(json.data.radiusMeters).toBeGreaterThan(0);
		});

		it("GET /attendance/checkpoint-config (Staff) mengembalikan daftar checkpoint", async () => {
			const res = await fetch(`${API_BASE}/attendance/checkpoint-config`, {
				headers: { Authorization: `Bearer ${adminToken}` },
			});
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(Array.isArray(json.data)).toBe(true);
		});

		it("POST /attendance/checkpoint-config membuat titik checkpoint baru", async () => {
			const res = await fetch(`${API_BASE}/attendance/checkpoint-config`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${adminToken}`,
				},
				body: JSON.stringify({
					type: "kuliah",
					label: "Gedung Teori A Test",
					latitude: -8.671,
					longitude: 115.213,
					radiusMeters: 100,
					isActive: true,
					notes: "Dibuat via automated test",
				}),
			});
			const json = await res.json();
			expect([200, 201]).toContain(res.status);
			expect(json.success).toBe(true);
			expect(json.data.id).toBeDefined();
			createdConfigId = json.data.id;
		});

		it("DELETE /attendance/checkpoint-config/:id menghapus checkpoint test", async () => {
			if (!createdConfigId) return;
			const res = await fetch(
				`${API_BASE}/attendance/checkpoint-config/${createdConfigId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${adminToken}` },
				},
			);
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
		});
	});

	// =========================================================================
	// 3. INTEGRATION TEST: SELFIE CHECK-IN DENGAN FOTO & GEOLOKASI
	// =========================================================================
	describe("3. Selfie Check-in Submission & Verification Flow", () => {
		// Mock file foto selfie berukuran valid (JPEG)
		const createMockPhotoBlob = (name = "selfie.jpg") => {
			// Minimal valid JPEG header (FF D8 FF E0 ...)
			const bytes = new Uint8Array([
				0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
				0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
				0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
				0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
				0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
				0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
				0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
				0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x10,
				0x00, 0x10, 0x01, 0x01, 0x11, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
				0x00, 0x00, 0x3f, 0x00, 0xbf, 0x00, 0xff, 0xd9,
			]);
			return new File([bytes], name, { type: "image/jpeg" });
		};

		it("menolak presensi jika foto selfie tidak dilampirkan", async () => {
			const form = new FormData();
			form.append("latitude", "-8.6705");
			form.append("longitude", "115.2126");
			form.append("accuracy", "15");
			form.append("sessionId", testSessionId.toString());
			form.append("clientTimestamp", Date.now().toString());

			const res = await fetch(
				`${API_BASE}/attendance/baris-pagi/selfie-checkin`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${studentToken}` },
					body: form,
				},
			);
			const json = await res.json();
			expect(res.status).toBe(400);
			expect(json.success).toBe(false);
			expect(json.message).toBeDefined();
		});

		it("menolak presensi jika clientTimestamp terpaut lebih dari 5 menit (anti-replay)", async () => {
			const form = new FormData();
			form.append("photo", createMockPhotoBlob());
			form.append("latitude", "-8.6705");
			form.append("longitude", "115.2126");
			form.append("accuracy", "15");
			form.append("sessionId", testSessionId.toString());
			// Timestamp 10 menit yang lalu
			form.append("clientTimestamp", (Date.now() - 10 * 60 * 1000).toString());

			const res = await fetch(
				`${API_BASE}/attendance/baris-pagi/selfie-checkin`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${studentToken}` },
					body: form,
				},
			);
			const json = await res.json();
			expect(res.status).toBe(400);
			expect(json.success).toBe(false);
			expect(json.message).toContain("Timestamp perangkat tidak sinkron");
		});

		it("berhasil melakukan selfie check-in dalam radius kampus (Happy Path)", async () => {
			const form = new FormData();
			form.append("photo", createMockPhotoBlob("selfie_test_valid.jpg"));
			// Koordinat tepat di Kampus Nusadaya Denpasar
			form.append("latitude", "-8.6705");
			form.append("longitude", "115.2126");
			form.append("accuracy", "12");
			form.append("sessionId", testSessionId.toString());
			form.append("clientTimestamp", Date.now().toString());

			const res = await fetch(
				`${API_BASE}/attendance/baris-pagi/selfie-checkin`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${studentToken}` },
					body: form,
				},
			);
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data).toBeDefined();
			expect(json.data.isWithinRadius).toBe(true);
			expect(json.data.verificationStatus).toBe("auto_approved");
			expect(json.data.record.checkinMethod).toBe("self_selfie");
			expect(json.data.record.selfieUrl).toContain("/files/");
		});

		it("menolak duplikasi presensi pada sesi yang sama (409 Conflict)", async () => {
			if (isRedisReady()) {
				await redis.del(`rl:selfie:selfie:baris_pagi:${testStudent.id}`);
			}
			const form = new FormData();
			form.append("photo", createMockPhotoBlob("selfie_duplicate.jpg"));
			form.append("latitude", "-8.6705");
			form.append("longitude", "115.2126");
			form.append("accuracy", "12");
			form.append("sessionId", testSessionId.toString());
			form.append("clientTimestamp", Date.now().toString());

			const res = await fetch(
				`${API_BASE}/attendance/baris-pagi/selfie-checkin`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${studentToken}` },
					body: form,
				},
			);
			const json = await res.json();
			expect(res.status).toBe(409);
			expect(json.success).toBe(false);
			expect(json.message).toMatch(
				/(sudah melakukan presensi|sedang diproses)/,
			);
		});
	});

	// =========================================================================
	// 4. INTEGRATION TEST: STAFF MONITORING & VERIFIKASI MANUAL
	// =========================================================================
	describe("4. Staff Monitoring, Live Feed, and Manual Verification", () => {
		let recordToVerifyId: number;

		it("GET /attendance/selfie/live-feed mengembalikan rekaman 5 menit terakhir", async () => {
			const res = await fetch(
				`${API_BASE}/attendance/selfie/live-feed?type=baris_pagi&sessionId=${testSessionId}`,
				{
					headers: { Authorization: `Bearer ${adminToken}` },
				},
			);
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(Array.isArray(json.data)).toBe(true);
		});

		it("GET /attendance/selfie/records menampilkan daftar foto selfie terverifikasi & pending", async () => {
			const res = await fetch(
				`${API_BASE}/attendance/selfie/records?type=baris_pagi`,
				{
					headers: { Authorization: `Bearer ${adminToken}` },
				},
			);
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(Array.isArray(json.data)).toBe(true);
			if (json.data.length > 0) {
				recordToVerifyId = json.data[0].id;
			}
		});

		it("PATCH /attendance/selfie/:recordId/verify memungkinkan staff menyetujui (approve) presensi", async () => {
			if (!recordToVerifyId) return;
			const res = await fetch(
				`${API_BASE}/attendance/selfie/${recordToVerifyId}/verify`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${adminToken}`,
					},
					body: JSON.stringify({
						attendanceType: "baris_pagi",
						action: "approve",
					}),
				},
			);
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data.verificationStatus).toBe("approved");
		});

		it("PATCH /attendance/selfie/:recordId/verify memungkinkan staff menolak (reject) dengan alasan", async () => {
			if (!recordToVerifyId) return;
			const res = await fetch(
				`${API_BASE}/attendance/selfie/${recordToVerifyId}/verify`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${adminToken}`,
					},
					body: JSON.stringify({
						attendanceType: "baris_pagi",
						action: "reject",
						rejectionReason: "Foto wajah tidak jelas atau terpotong",
					}),
				},
			);
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data.verificationStatus).toBe("rejected");
			expect(json.data.rejectionReason).toContain("Foto wajah tidak jelas");
		});
	});

	// =========================================================================
	// 5. KEAMANAN & AUTHORIZATION
	// =========================================================================
	describe("5. Security & Authorization Constraints", () => {
		it("menolak akses live feed tanpa login (401 Unauthorized)", async () => {
			const res = await fetch(
				`${API_BASE}/attendance/selfie/live-feed?type=baris_pagi`,
			);
			expect([401, 403]).toContain(res.status);
		});

		it("menolak akses endpoint verifikasi untuk role selain staff/akademik/superadmin (403 Forbidden)", async () => {
			const res = await fetch(`${API_BASE}/attendance/selfie/999/verify`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${studentToken}`, // Role mahasiswa mencoba verifikasi
				},
				body: JSON.stringify({
					attendanceType: "baris_pagi",
					action: "approve",
				}),
			});
			expect(res.status).toBe(403);
		});

		it("menolak perubahan konfigurasi checkpoint oleh role mahasiswa (403 Forbidden)", async () => {
			const res = await fetch(`${API_BASE}/attendance/checkpoint-config`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${studentToken}`,
				},
				body: JSON.stringify({
					type: "kuliah",
					label: "Test Hacking Checkpoint",
					latitude: 0,
					longitude: 0,
				}),
			});
			expect(res.status).toBe(403);
		});
	});
});
