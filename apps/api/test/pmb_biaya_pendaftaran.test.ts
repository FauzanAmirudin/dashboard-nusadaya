import { afterEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
	academicData,
	auditLogs,
	crmData,
	finalDecision,
	financeData,
	financeSemesters,
	internshipData,
	paData,
	pmbData,
	pmbPaymentPlan,
	studentHealth,
	studentParents,
	students,
	users,
} from "../src/db/schema";
import { createStudentPipeline } from "../src/routes/student/core";

/**
 * Gerbang biaya PMB: nominal yang diinput lewat modal (ACC formulir online
 * maupun Tambah Mahasiswa manual) harus mendarat di pmb_payment_plan dan
 * finance_data, karena Panel Finance (waiting list) membaca kolom tersebut.
 */
describe("Gerbang biaya pendaftaran PMB", () => {
	const createdStudentIds: number[] = [];

	const bersihkan = async (studentId: number) => {
		const student = await db.query.students.findFirst({
			where: eq(students.id, studentId),
		});
		await db
			.delete(financeSemesters)
			.where(eq(financeSemesters.studentId, studentId));
		await db
			.delete(finalDecision)
			.where(eq(finalDecision.studentId, studentId));
		await db
			.delete(internshipData)
			.where(eq(internshipData.studentId, studentId));
		await db.delete(paData).where(eq(paData.studentId, studentId));
		await db.delete(academicData).where(eq(academicData.studentId, studentId));
		await db.delete(financeData).where(eq(financeData.studentId, studentId));
		await db.delete(crmData).where(eq(crmData.studentId, studentId));
		await db
			.delete(pmbPaymentPlan)
			.where(eq(pmbPaymentPlan.studentId, studentId));
		await db.delete(pmbData).where(eq(pmbData.studentId, studentId));
		await db
			.delete(studentParents)
			.where(eq(studentParents.studentId, studentId));
		await db
			.delete(studentHealth)
			.where(eq(studentHealth.studentId, studentId));
		await db.delete(auditLogs).where(eq(auditLogs.entityId, studentId));
		await db.delete(students).where(eq(students.id, studentId));
		if (student?.studentUserId) {
			await db.delete(users).where(eq(users.id, student.studentUserId));
		}
	};

	afterEach(async () => {
		while (createdStudentIds.length > 0) {
			const id = createdStudentIds.pop();
			if (id) await bersihkan(id);
		}
	});

	const payloadDasar = (nama: string) => ({
		name: nama,
		program: "Indonesia",
		subProgram: "Indonesia-Reguler",
		cohort: 17,
		birthDate: "2006-05-04T00:00:00.000Z",
		studentStatus: "menunggu_pembayaran",
	});

	const adminId = async () => {
		const admin = await db.query.users.findFirst({
			where: eq(users.role, "superadmin"),
		});
		return admin?.id ?? 1;
	};

	it("menulis total biaya & DP ke pmb_payment_plan dan finance_data", async () => {
		const userId = await adminId();
		const { student } = await createStudentPipeline(
			{
				...payloadDasar(`TEST Biaya Lengkap ${Date.now()}`),
				totalBiaya: 25_000_000,
				pendaftaranDp: 10_000_000,
			},
			userId,
		);
		createdStudentIds.push(student.id);

		const plan = await db.query.pmbPaymentPlan.findFirst({
			where: eq(pmbPaymentPlan.studentId, student.id),
		});
		const fin = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, student.id),
		});

		expect(plan?.totalBiaya).toBe(25_000_000);
		expect(plan?.pendaftaranDp).toBe(10_000_000);
		expect(plan?.totalDp).toBe(10_000_000);
		expect(plan?.pembayaranAwalDp).toBe(10_000_000);
		expect(fin?.totalBiayaPendidikan).toBe(25_000_000);
		expect(fin?.registrasiNominal).toBe(10_000_000);

		// Pelunasan tetap mutlak hak Finance
		expect(plan?.statusDp).toBe(false);
		expect(fin?.registrasiStatus).toBe(false);
		expect(student.studentStatus).toBe("menunggu_pembayaran");
	});

	it("menolak DP yang melebihi total biaya dan tidak membuat mahasiswa", async () => {
		const userId = await adminId();
		const nama = `TEST Biaya Invalid ${Date.now()}`;

		await expect(
			createStudentPipeline(
				{
					...payloadDasar(nama),
					totalBiaya: 5_000_000,
					pendaftaranDp: 10_000_000,
				},
				userId,
			),
		).rejects.toThrow(/tidak boleh melebihi Total Biaya Pendidikan/);

		const tersisa = await db.query.students.findFirst({
			where: eq(students.name, nama),
		});
		expect(tersisa).toBeUndefined();
	});

	it("DP sama dengan total biaya tetap diterima", async () => {
		const userId = await adminId();
		const { student } = await createStudentPipeline(
			{
				...payloadDasar(`TEST Biaya Sama ${Date.now()}`),
				totalBiaya: 10_000_000,
				pendaftaranDp: 10_000_000,
			},
			userId,
		);
		createdStudentIds.push(student.id);

		const plan = await db.query.pmbPaymentPlan.findFirst({
			where: eq(pmbPaymentPlan.studentId, student.id),
		});
		expect(plan?.totalBiaya).toBe(10_000_000);
		expect(plan?.pendaftaranDp).toBe(10_000_000);
	});

	it("tanpa nominal, pipeline lama tetap jalan (jatuh ke pagu program)", async () => {
		const userId = await adminId();
		const { student } = await createStudentPipeline(
			payloadDasar(`TEST Biaya Default ${Date.now()}`),
			userId,
		);
		createdStudentIds.push(student.id);

		const plan = await db.query.pmbPaymentPlan.findFirst({
			where: eq(pmbPaymentPlan.studentId, student.id),
		});
		expect(plan).toBeDefined();
		expect(plan?.pendaftaranDp).not.toBeNull();
	});
});
