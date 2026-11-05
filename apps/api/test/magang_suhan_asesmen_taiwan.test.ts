import { beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { app } from "../src";
import { db } from "../src/db";
import { internshipData, students } from "../src/db/schema";

describe("Verifikasi Alur 6 Dokumen Taiwan, MCU Full, dan Asesmen (Segmen 20 & 22)", () => {
	let superToken = "";

	beforeAll(async () => {
		const signer = jwt({
			name: "jwt",
			secret: process.env.JWT_SECRET || "nusadaya-dev-jwt-secret-key-32chars!",
		});
		const mockSignApp = new Elysia()
			.use(signer)
			.get("/sign-super", ({ jwt }: any) =>
				jwt.sign({
					id: 999,
					username: "superadmin",
					role: "superadmin",
					roles: ["superadmin"],
				}),
			);
		const resSuper = await mockSignApp.handle(
			new Request("http://localhost/sign-super"),
		);
		superToken = await resSuper.text();
	});

	it("harus berhasil mengupdate MOU, LOA tanpa LOL, Kontrak, Suhan, MCU Full, dan Asesmen 2-Slot", async () => {
		const student = await db.query.students.findFirst();
		if (!student) {
			console.warn("Skip test: tidak ada data mahasiswa");
			return;
		}

		// Update internship data via PATCH
		const res = await app.handle(
			new Request(`http://localhost:3001/students/${student.id}/internship`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${superToken}`,
				},
				body: JSON.stringify({
					// Alur 6 Dokumen Taiwan
					mouReady: true,
					mouDate: "2026-09-01T00:00:00.000Z",
					mouNotes: "MOU Kampus & Grand Hotel Taipei",
					loaConfirmed: true,
					loaDate: "2026-09-05T00:00:00.000Z",
					contractReady: true,
					contractDate: "2026-09-10T00:00:00.000Z",
					suhanReady: true,
					suhanNo: "SUHAN-TW-2026-9918",
					suhanDate: "2026-09-15T00:00:00.000Z",
					suhanNotes: "Disetujui Biro Pariwisata Taiwan",
					mcuReady: true,
					mcuPlace: "RS Pelabuhan Jakarta",
					mcuResult: "fit",
					visaReady: true,
					visaNo: "TW-VISA-2026-7788",
					ticketReady: true,
					// Asesmen dan Pengarahan
					asesmenReady: true,
					asesmenDate: "2026-09-20T00:00:00.000Z",
					pdtPlace: "Kampus Nusadaya",
				}),
			}),
		);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);

		// Periksa di database langsung
		const row = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, student.id),
		});

		expect(row).toBeDefined();
		expect(row?.mouReady).toBe(true);
		expect(row?.moaReady).toBe(true); // Verifikasi backward compatibility sync
		expect(row?.loaConfirmed).toBe(true);
		expect(row?.contractReady).toBe(true);
		expect(row?.suhanReady).toBe(true);
		expect(row?.suhanNo).toBe("SUHAN-TW-2026-9918");
		expect(row?.mcuReady).toBe(true);
		expect(row?.visaReady).toBe(true);
		expect(row?.ticketReady).toBe(true);
		expect(row?.asesmenReady).toBe(true);
		expect(row?.pdtReady).toBe(true); // Verifikasi backward compatibility sync
	});
});
