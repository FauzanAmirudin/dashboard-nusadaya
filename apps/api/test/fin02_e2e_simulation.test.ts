import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { app } from "../src";
import { db } from "../src/db";
import {
	financeData,
	financeSemesterInstallments,
	financeSemesters,
	students,
} from "../src/db/schema";

describe("FIN-02 E2E Simulation & Cross-Module Verification", () => {
	it("TC-FIN02-SIM-01: Partition setup, monthly installment, separate Kontrak vs Suhan, & 4-termin sync", async () => {
		// 1. Find or pick student 11
		const student = await db.query.students.findFirst({
			where: eq(students.id, 11),
		});
		expect(student).toBeDefined();

		// Ensure clean test state for student 11
		await db
			.insert(financeData)
			.values({
				studentId: 11,
				totalBiayaPendidikan: 20000000,
				registrasiNominal: 2000000,
				registrasiStatus: true,
				registrasiPaidDate: new Date(),
				mandiriSemesterNominal: 8000000,
				mandiriSemesterStatus: true,
				mandiriSemesterPaidDate: new Date(),
				mandiriInterviewNominal: 5000000,
				mandiriInterviewStatus: false,
				kontrakMagangStatus: false,
				suhanStatus: false,
				mandiriKeberangkatanNominal: 5000000,
				mandiriKeberangkatanStatus: false,
				metodePembayaran: "mandiri",
			})
			.onConflictDoUpdate({
				target: financeData.studentId,
				set: {
					totalBiayaPendidikan: 20000000,
					registrasiNominal: 2000000,
					registrasiStatus: true,
					mandiriSemesterNominal: 8000000,
					mandiriSemesterStatus: true,
					mandiriInterviewNominal: 5000000,
					mandiriInterviewStatus: false,
					kontrakMagangStatus: false,
					suhanStatus: false,
					mandiriKeberangkatanNominal: 5000000,
					mandiriKeberangkatanStatus: false,
					metodePembayaran: "mandiri",
				},
			});

		// 2. Simulate flexible installment on Semester 1 with installmentMonth
		let sem1 = await db.query.financeSemesters.findFirst({
			where: eq(financeSemesters.studentId, 11),
		});
		if (!sem1) {
			const [inserted] = await db
				.insert(financeSemesters)
				.values({
					studentId: 11,
					semesterNumber: 1,
					totalBilled: 8000000,
					status: "BELUM_BAYAR",
				})
				.returning();
			sem1 = inserted;
		}

		// Insert monthly installment
		const [inst] = await db
			.insert(financeSemesterInstallments)
			.values({
				semesterId: sem1.id,
				installmentNumber: 1,
				nominalPaid: 2000000,
				installmentMonth: "Cicilan Bulan Agustus",
				periodNotes: "Cicilan awal perkuliahan persiapan",
				paymentDate: new Date(),
			})
			.returning();

		expect(inst.installmentMonth).toBe("Cicilan Bulan Agustus");
		expect(inst.periodNotes).toBe("Cicilan awal perkuliahan persiapan");

		// 3. Simulate separate approval of Kontrak Magang (Slot A) and Suhan (Slot B)
		// Update Kontrak Magang first
		await db
			.update(financeData)
			.set({
				kontrakMagangStatus: true,
				kontrakMagangPaidDate: new Date(),
				kontrakMagangBuktiBayarUrl: "/files/test_kontrak.pdf",
				// Backward compatibility sync
				mandiriInterviewStatus: true,
			})
			.where(eq(financeData.studentId, 11));

		let fin = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, 11),
		});
		expect(fin?.kontrakMagangStatus).toBe(true);
		expect(fin?.suhanStatus).toBe(false);
		expect(fin?.mandiriInterviewStatus).toBe(true);

		// Now update Suhan (Slot B)
		await db
			.update(financeData)
			.set({
				suhanStatus: true,
				suhanPaidDate: new Date(),
				suhanBuktiBayarUrl: "/files/test_suhan.pdf",
			})
			.where(eq(financeData.studentId, 11));

		fin = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, 11),
		});
		expect(fin?.kontrakMagangStatus).toBe(true);
		expect(fin?.suhanStatus).toBe(true);

		// 4. Simulate Termin 4 Penempatan Magang / Keberangkatan
		await db
			.update(financeData)
			.set({
				mandiriKeberangkatanStatus: true,
				mandiriKeberangkatanPaidDate: new Date(),
				mandiriKeberangkatanBuktiBayarUrl: "/files/test_keberangkatan.pdf",
			})
			.where(eq(financeData.studentId, 11));

		fin = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, 11),
		});
		expect(fin?.mandiriKeberangkatanStatus).toBe(true);

		// 5. Test GET /students/11/finance endpoint returns all updated fields
		const getRes = await app.handle(
			new Request("http://localhost:3001/students/11/finance", {
				method: "GET",
			}),
		);
		expect(getRes.status).toBe(200);
		const getJson = (await getRes.json()) as any;
		expect(getJson.success).toBe(true);
		expect(getJson.data.kontrakMagangStatus).toBe(true);
		expect(getJson.data.suhanStatus).toBe(true);
		expect(getJson.data.mandiriKeberangkatanStatus).toBe(true);
		expect(getJson.data.mandiriSemesterStatus).toBe(true);
		expect(getJson.data.registrasiStatus).toBe(true);
	});
});
