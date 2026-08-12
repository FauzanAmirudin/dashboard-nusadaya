import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { internshipData, pmbData, students } from "../db/schema";
import { requireRole } from "../middleware/rbac";

export const magangRouter = new Elysia({ prefix: "/magang" })
	.use(requireRole(["magang", "superadmin"]))
	.get("/dashboard", async () => {
		const results = await db
			.select({
				student: students,
				internship: internshipData,
				pmb: pmbData,
			})
			.from(students)
			.leftJoin(internshipData, eq(students.id, internshipData.studentId))
			.leftJoin(pmbData, eq(students.id, pmbData.studentId))
			.orderBy(desc(students.createdAt));

		// Calculate KPIs
		const totalStudents = results.length;
		let readyToDepart = 0;
		let processing = 0;
		let actionNeeded = 0;

		const mappedStudents = results.map(({ student, internship, pmb }) => {
			const isGapYear = pmb?.isGapYear || false;
			const checks = [
				internship?.praPasporPasFoto,
				internship?.praPasporKtm,
				internship?.praPasporKtp,
				internship?.praPasporKk,
				internship?.praPasporAktaKelahiran,
				internship?.praPasporSl21,
				internship?.praPasporSkma,
				internship?.praPasporRekomendasiDisdik,
				...(isGapYear ? [internship?.praPasporGapYear] : []),
				internship?.praPasporPddikti,
				internship?.praPasporCv,
				internship?.passportReady,
				internship?.interviewReady,
				internship?.contractReady,
				internship?.loaReady,
				internship?.mcuReady,
				internship?.visaReady,
				internship?.pdtReady,
				internship?.dokumentasiReady,
				internship?.ticketReady,
				internship?.agenReady,
				internship?.logbookReady,
				internship?.laporanAkhirReady,
				internship?.videoDokumentasiReady,
			];
			const completedCount = checks.filter(Boolean).length;
			const totalCount = checks.length;
			let status = "TIDAK_AMAN";

			if (completedCount === totalCount) {
				status = "AMAN";
				readyToDepart++;
			} else if (completedCount >= Math.floor(totalCount / 2)) {
				status = "PERLU_PERHATIAN";
				processing++;
			} else {
				status = "TIDAK_AMAN";
				actionNeeded++;
			}

			return {
				id: student.id,
				nim: student.nim,
				name: student.name,
				program: student.program,
				subProgram: student.subProgram,
				cohort: student.cohort,
				academicYear: student.academicYear,
				phone: student.phone,
				destinationCity: internship?.destinationCity || "-",
				internshipCompany: internship?.internshipCompany || "-",
				completedDocs: completedCount,
				totalDocs: totalCount,
				status: status,
				estDepartureDate: internship?.estDepartureDate,
				passportReady: internship?.passportReady,
				visaReady: internship?.visaReady,
				mcuReady: internship?.mcuReady,
			};
		});

		return {
			success: true,
			data: {
				kpi: {
					totalStudents,
					readyToDepart,
					processing,
					actionNeeded,
				},
				students: mappedStudents,
			},
		};
	});
