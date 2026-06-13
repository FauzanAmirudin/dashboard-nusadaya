import { eq, desc } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { db } from "../db";
import {
	academicData, courseGrades, paData, vocabLogs, counselingLogs,
	crmData,
	finalDecision,
	financeData,
	internshipData,
	users, pmbData, pmbDocuments,
	crmDocuments, crmLogs, financeDocuments, academicDocuments, courseGradeDocuments,
	students, auditLogs
} from "../db/schema";
import { authSetup } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

export const studentsRouter = new Elysia({ prefix: "/students" })
	.get("/", async () => {
		const results = await db
			.select({
				student: students,
				pmb: pmbData,
				crm: crmData,
				finance: financeData,
				academic: academicData,
				pa: paData,
				internship: internshipData,
				decision: finalDecision,
			})
			.from(students)
			.leftJoin(pmbData, eq(students.id, pmbData.studentId))
			.leftJoin(crmData, eq(students.id, crmData.studentId))
			.leftJoin(financeData, eq(students.id, financeData.studentId))
			.leftJoin(academicData, eq(students.id, academicData.studentId))
			.leftJoin(paData, eq(students.id, paData.studentId))
			.leftJoin(internshipData, eq(students.id, internshipData.studentId))
			.leftJoin(finalDecision, eq(students.id, finalDecision.studentId));

		return { success: true, data: results };
	})
	.get("/:id", async ({ params, set }) => {
		const id = parseInt(params.id);
		if (isNaN(id)) {
			set.status = 400;
			return { success: false, message: "Invalid ID" };
		}

		const results = await db
			.select({
				student: students,
				pmb: pmbData,
				crm: crmData,
				finance: financeData,
				academic: academicData,
				pa: paData,
				internship: internshipData,
				decision: finalDecision,
			})
			.from(students)
			.leftJoin(pmbData, eq(students.id, pmbData.studentId))
			.leftJoin(crmData, eq(students.id, crmData.studentId))
			.leftJoin(financeData, eq(students.id, financeData.studentId))
			.leftJoin(academicData, eq(students.id, academicData.studentId))
			.leftJoin(paData, eq(students.id, paData.studentId))
			.leftJoin(internshipData, eq(students.id, internshipData.studentId))
			.leftJoin(finalDecision, eq(students.id, finalDecision.studentId))
			.where(eq(students.id, id))
			.limit(1);

		if (results.length === 0) {
			set.status = 404;
			return { success: false, message: "Student not found" };
		}

		return { success: true, data: results[0] };
	})
	.get("/:id/status", async ({ params, set }) => {
		const id = parseInt(params.id);
		if (isNaN(id)) {
			set.status = 400;
			return { success: false, message: "Invalid ID" };
		}

		const [pmb, crm, finance, academic, pa, internship, courses, student] = await Promise.all([
			db.query.pmbData.findFirst({ where: eq(pmbData.studentId, id) }),
			db.query.crmData.findFirst({ where: eq(crmData.studentId, id) }),
			db.query.financeData.findFirst({ where: eq(financeData.studentId, id) }),
			db.query.academicData.findFirst({ where: eq(academicData.studentId, id) }),
			db.query.paData.findFirst({ where: eq(paData.studentId, id) }),
			db.query.internshipData.findFirst({ where: eq(internshipData.studentId, id) }),
			db.query.courseGrades.findMany({ where: eq(courseGrades.studentId, id) }),
			db.query.students.findFirst({ where: eq(students.id, id) }),
		]);

		if (!student) {
			set.status = 404;
			return { success: false, message: "Student not found" };
		}

		const pmbChecks = [pmb?.formReceived, pmb?.documentsComplete, pmb?.dataInputted, pmb?.initialFollowUp];
		const pmbCompleted = pmbChecks.filter(Boolean).length;
		const pmbTotal = 4;
		
		const crmChecks = [crm?.odsActive, crm?.studentMonitoring, crm?.parentFollowUp, crm?.practiceAttendance, crm?.odsDocumentation];
		const crmCompleted = crmChecks.filter(Boolean).length;
		const crmTotal = 5;

		const finChecks = [finance?.registrationPaid, finance?.semesterPaid, finance?.installmentCleared, finance?.arrearsCleared];
		const finCompleted = finChecks.filter(Boolean).length;
		const finTotal = 4;

		const acdChecks = [academic?.pddiktiInput, academic?.utsPassed, academic?.uasPassed, academic?.attitudeIndicator, academic?.assignmentsCompleted, academic?.academicCommunication];
		const acdCompleted = acdChecks.filter(Boolean).length;
		const acdTotal = 6;

		const paChecks = [pa?.counselingDone, pa?.mentalStable, pa?.disciplineGood];
		const paCompleted = paChecks.filter(Boolean).length;
		const paTotal = 3;

		const intChecks = [internship?.passportReady, internship?.interviewReady, internship?.loaReady, internship?.contractReady, internship?.mcuReady, internship?.visaReady, internship?.ticketReady, internship?.pdtReady];
		const intCompleted = intChecks.filter(Boolean).length;
		const intTotal = 8;

		const courseCompleted = courses.filter(c => c.isAcc).length;
		const courseTotal = courses.length;

		const getStatus = (comp: number, tot: number) => {
			if (tot === 0) return "PERLU_PERHATIAN";
			if (comp === tot) return "AMAN";
			if (comp === 0) return "TIDAK_AMAN";
			return "PERLU_PERHATIAN";
		};

		const panels = [
			{ id: "pmb", name: "PMB", completed: pmbCompleted, total: pmbTotal, status: getStatus(pmbCompleted, pmbTotal) },
			{ id: "crm", name: "CRM", completed: crmCompleted, total: crmTotal, status: getStatus(crmCompleted, crmTotal) },
			{ id: "finance", name: "Finance", completed: finCompleted, total: finTotal, status: getStatus(finCompleted, finTotal) },
			{ id: "akademik", name: "Akademik", completed: acdCompleted, total: acdTotal, status: getStatus(acdCompleted, acdTotal) },
			{ id: "dosen", name: "Dosen per MK", completed: courseCompleted, total: courseTotal, status: getStatus(courseCompleted, courseTotal) },
			{ id: "pa", name: "PA", completed: paCompleted, total: paTotal, status: getStatus(paCompleted, paTotal) },
			{ id: "magang", name: "Tim Magang", completed: intCompleted, total: intTotal, status: getStatus(intCompleted, intTotal) }
		];

		const totalCompleted = pmbCompleted + crmCompleted + finCompleted + acdCompleted + courseCompleted + paCompleted + intCompleted;
		const totalIndicators = pmbTotal + crmTotal + finTotal + acdTotal + courseTotal + paTotal + intTotal;

		const incompleteIndicators: Array<{ panel: string; name: string; status: string; link: string }> = [];
		if (!pmb?.formReceived) incompleteIndicators.push({ panel: "PMB", name: "Form Pendaftaran", status: "TIDAK_AMAN", link: "pmb" });
		if (!pmb?.documentsComplete) incompleteIndicators.push({ panel: "PMB", name: "Dokumen Lengkap", status: "TIDAK_AMAN", link: "pmb" });
		if (!pmb?.dataInputted) incompleteIndicators.push({ panel: "PMB", name: "Data Diinput", status: "TIDAK_AMAN", link: "pmb" });
		if (!pmb?.initialFollowUp) incompleteIndicators.push({ panel: "PMB", name: "Follow Up Awal", status: "TIDAK_AMAN", link: "pmb" });

		if (!crm?.odsActive) incompleteIndicators.push({ panel: "CRM", name: "ODS Aktif", status: "PERLU_PERHATIAN", link: "crm" });
		if (!crm?.studentMonitoring) incompleteIndicators.push({ panel: "CRM", name: "Monitoring Siswa", status: "PERLU_PERHATIAN", link: "crm" });
		if (!crm?.parentFollowUp) incompleteIndicators.push({ panel: "CRM", name: "Follow Up Ortu", status: "PERLU_PERHATIAN", link: "crm" });
		if (!crm?.practiceAttendance) incompleteIndicators.push({ panel: "CRM", name: "Kehadiran Praktek", status: "PERLU_PERHATIAN", link: "crm" });
		if (!crm?.odsDocumentation) incompleteIndicators.push({ panel: "CRM", name: "Dokumentasi ODS", status: "PERLU_PERHATIAN", link: "crm" });

		if (!finance?.registrationPaid) incompleteIndicators.push({ panel: "Finance", name: "Daftar Ulang Belum Lunas", status: "TIDAK_AMAN", link: "finance" });
		if (!finance?.semesterPaid) incompleteIndicators.push({ panel: "Finance", name: "Semester Belum Lunas", status: "TIDAK_AMAN", link: "finance" });
		if (!finance?.installmentCleared) incompleteIndicators.push({ panel: "Finance", name: "Cicilan Belum Lunas", status: "TIDAK_AMAN", link: "finance" });
		if (!finance?.arrearsCleared) incompleteIndicators.push({ panel: "Finance", name: "Tunggakan Aktif", status: "TIDAK_AMAN", link: "finance" });

		if (!academic?.pddiktiInput) incompleteIndicators.push({ panel: "Akademik", name: "Input PDDIKTI", status: "TIDAK_AMAN", link: "akademik" });
		if (!academic?.utsPassed) incompleteIndicators.push({ panel: "Akademik", name: "Lulus UTS", status: "PERLU_PERHATIAN", link: "akademik" });
		if (!academic?.uasPassed) incompleteIndicators.push({ panel: "Akademik", name: "Lulus UAS", status: "PERLU_PERHATIAN", link: "akademik" });
		if (!academic?.attitudeIndicator) incompleteIndicators.push({ panel: "Akademik", name: "Indikator Sikap", status: "PERLU_PERHATIAN", link: "akademik" });
		if (!academic?.assignmentsCompleted) incompleteIndicators.push({ panel: "Akademik", name: "Tugas Selesai", status: "PERLU_PERHATIAN", link: "akademik" });
		if (!academic?.academicCommunication) incompleteIndicators.push({ panel: "Akademik", name: "Komunikasi Akademik", status: "PERLU_PERHATIAN", link: "akademik" });

		const unaccCourses = courses.filter(c => !c.isAcc);
		if (unaccCourses.length > 0) {
			incompleteIndicators.push({ panel: "Dosen", name: `Nilai ${unaccCourses.length} MK belum di-ACC`, status: "PERLU_PERHATIAN", link: "dosen" });
		}

		if (!pa?.counselingDone) incompleteIndicators.push({ panel: "PA", name: "Sesi Konseling", status: "PERLU_PERHATIAN", link: "pa" });
		if (!pa?.mentalStable) incompleteIndicators.push({ panel: "PA", name: "Kestabilan Mental", status: "PERLU_PERHATIAN", link: "pa" });
		if (!pa?.disciplineGood) incompleteIndicators.push({ panel: "PA", name: "Kedisiplinan", status: "PERLU_PERHATIAN", link: "pa" });

		if (!internship?.passportReady) incompleteIndicators.push({ panel: "Magang", name: "Paspor", status: "TIDAK_AMAN", link: "magang" });
		if (!internship?.interviewReady) incompleteIndicators.push({ panel: "Magang", name: "Interview User", status: "PERLU_PERHATIAN", link: "magang" });
		if (!internship?.loaReady) incompleteIndicators.push({ panel: "Magang", name: "LoA", status: "PERLU_PERHATIAN", link: "magang" });
		if (!internship?.contractReady) incompleteIndicators.push({ panel: "Magang", name: "Kontrak Magang", status: "PERLU_PERHATIAN", link: "magang" });
		if (!internship?.mcuReady) incompleteIndicators.push({ panel: "Magang", name: "MCU", status: "PERLU_PERHATIAN", link: "magang" });
		if (!internship?.visaReady) incompleteIndicators.push({ panel: "Magang", name: "Visa", status: "TIDAK_AMAN", link: "magang" });
		if (!internship?.ticketReady) incompleteIndicators.push({ panel: "Magang", name: "Tiket Pesawat", status: "PERLU_PERHATIAN", link: "magang" });
		if (!internship?.pdtReady) incompleteIndicators.push({ panel: "Magang", name: "PDT (Pembekalan)", status: "PERLU_PERHATIAN", link: "magang" });

		let overallStatus = "AMAN";
		const hasTidakAman = incompleteIndicators.some(i => i.status === "TIDAK_AMAN");
		if (hasTidakAman) {
			overallStatus = "TIDAK_AMAN";
		} else if (incompleteIndicators.length > 0) {
			overallStatus = "PERLU_PERHATIAN";
		}

		if (student.overallStatus !== overallStatus) {
			await db.update(students).set({ overallStatus: overallStatus as any }).where(eq(students.id, id));
		}

		return {
			success: true,
			data: {
				overallStatus,
				totalCompleted,
				totalIndicators,
				panels,
				incompleteIndicators,
			}
		};
	})
	.put(
		"/:id/pmb",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id);

			// Update pmbData
			await db
				.update(pmbData)
				.set({
					formReceived: body.formReceived,
					documentsComplete: body.documentsComplete,
					dataInputted: body.dataInputted,
					initialFollowUp: body.initialFollowUp,
					notes: body.notes,
					updatedAt: new Date(),
				})
				.where(eq(pmbData.studentId, id));

			// Auto-calculate status based on the 4 checkboxes
			const checkboxes = [
				body.formReceived,
				body.documentsComplete,
				body.dataInputted,
				body.initialFollowUp,
			];
			const checkedCount = checkboxes.filter(Boolean).length;

			let newStatus: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
			if (checkedCount === 4) newStatus = "AMAN";
			else if (checkedCount >= 2) newStatus = "PERLU_PERHATIAN";

			await db
				.update(pmbData)
				.set({ status: newStatus })
				.where(eq(pmbData.studentId, id));

			return { success: true };
		},
		{
			body: t.Object({
				formReceived: t.Boolean(),
				documentsComplete: t.Boolean(),
				dataInputted: t.Boolean(),
				initialFollowUp: t.Boolean(),
				notes: t.Optional(t.String()),
			}),
		},
	)
	.post("/:id/pmb/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!user || (user.role !== "pmb" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id);

		// Verify that all 4 checklists are checked before ACC
		const currentPmb = await db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, id),
		});
		if (
			!currentPmb ||
			!currentPmb.formReceived ||
			!currentPmb.documentsComplete ||
			!currentPmb.dataInputted ||
			!currentPmb.initialFollowUp
		) {
			set.status = 400;
			return {
				success: false,
				message: "Semua checklist harus selesai sebelum ACC.",
			};
		}

		await db
			.update(pmbData)
			.set({
				isAcc: true,
				accAt: new Date(),
				accBy: user.id,
			})
			.where(eq(pmbData.studentId, id));

		return { success: true };
	})
	.get("/:id/pmb", async ({ params, set }) => {
		const id = Number(params.id);
		const pmb = await db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});

		if (!pmb) {
			set.status = 404;
			return { success: false, message: "PMB data not found" };
		}

		const { accBy: accByUser, ...rest } = pmb as any;
		return { success: true, data: { ...rest, accByUser } };
	})
	.get("/:id/pmb/documents", async ({ params, set }) => {
		const id = Number(params.id);
		const docs = await db.query.pmbDocuments.findMany({
			where: eq(pmbDocuments.studentId, id),
			orderBy: [desc(pmbDocuments.uploadedAt)],
			with: {
				uploadedBy: { columns: { fullName: true } },
				verifiedBy: { columns: { fullName: true } }
			}
		});

		const grouped = docs.reduce((acc, doc) => {
			if (!acc[doc.documentKey]) acc[doc.documentKey] = [];
			acc[doc.documentKey].push(doc);
			return acc;
		}, {} as Record<string, typeof docs>);

		return { success: true, data: grouped };
	})
	.post("/:id/pmb/upload/:documentKey", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const id = Number(params.id);
		const documentKey = params.documentKey;

		const allowedKeys = ["form_received", "documents_complete", "data_inputted", "initial_follow_up"];
		if (!allowedKeys.includes(documentKey)) {
			set.status = 400;
			return { success: false, message: "Document key tidak valid" };
		}

		const file = body.file as File;
		if (!file) {
			set.status = 400;
			return { success: false, message: "File tidak ditemukan" };
		}

		const MAX_SIZE = 10 * 1024 * 1024; // 10MB
		const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/zip", "application/x-zip-compressed"];
		if (file.size > MAX_SIZE) {
			set.status = 400;
			return { success: false, message: "File terlalu besar (maksimal 10MB)" };
		}
		if (!allowedTypes.includes(file.type)) {
			set.status = 400;
			return { success: false, message: "Tipe file tidak diizinkan (PDF, JPG, PNG, ZIP)" };
		}

		const uploadDir = join(process.cwd(), "uploads", "pmb", id.toString(), documentKey);
		await mkdir(uploadDir, { recursive: true });

		const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
		const fileUrl = join(uploadDir, filename);

		await Bun.write(fileUrl, await file.arrayBuffer());

		await db.insert(pmbDocuments).values({
			studentId: id,
			documentKey,
			fileName: file.name,
			fileUrl: fileUrl,
			fileSize: file.size,
			mimeType: file.type,
			uploadedBy: user.id,
		});

		return { success: true, message: "File berhasil diupload" };
	}, {
		body: t.Object({
			file: t.File()
		})
	})
	.get("/:id/pmb/documents/:docId/download", async ({ params, set }) => {
		const docId = Number(params.docId);
		const doc = await db.query.pmbDocuments.findFirst({
			where: eq(pmbDocuments.id, docId)
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		const file = Bun.file(doc.fileUrl);
		if (!await file.exists()) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan di server" };
		}

		return new Response(file, {
			headers: {
				"Content-Type": doc.mimeType || "application/octet-stream",
				"Content-Disposition": `inline; filename="${doc.fileName}"`,
			}
		});
	})
	.patch("/:id/pmb/documents/:docId/verify", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "pmb" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.update(pmbDocuments)
			.set({ isVerified: true, verifiedAt: new Date(), verifiedBy: user.id })
			.where(eq(pmbDocuments.id, Number(params.docId)));

		return { success: true };
	})
	.delete("/:id/pmb/documents/:docId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "pmb" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const docId = Number(params.docId);
		
		const doc = await db.query.pmbDocuments.findFirst({
			where: eq(pmbDocuments.id, docId)
		});
		
		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}
		
		await db.delete(pmbDocuments).where(eq(pmbDocuments.id, docId));

		// We could also delete the physical file here if needed
		// const file = Bun.file(doc.fileUrl);
		// if (await file.exists()) {
		//	  import { unlink } from "node:fs/promises";
		//	  await unlink(doc.fileUrl);
		// }
		
		return { success: true };
	})
	
	// --- CRM ROUTES ---
	.get("/:id/crm", async ({ params, set }) => {
		const id = Number(params.id);
		const crm = await db.query.crmData.findFirst({
			where: eq(crmData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});

		const logs = await db.query.crmLogs.findMany({
			where: eq(crmLogs.studentId, id),
			with: { author: { columns: { fullName: true } } },
			orderBy: (crmLogs, { desc }) => [desc(crmLogs.createdAt)],
			limit: 5,
		});

		return { success: true, data: { crm, logs } };
	})
	.get("/:id/crm/logs", async ({ params, query, set }) => {
		const id = Number(params.id);
		const limit = Number(query?.limit) || 20;
		const page = Number(query?.page) || 1;

		const logs = await db.query.crmLogs.findMany({
			where: eq(crmLogs.studentId, id),
			with: { author: { columns: { fullName: true } } },
			orderBy: (crmLogs, { desc }) => [desc(crmLogs.createdAt)],
			limit: limit,
			offset: (page - 1) * limit,
		});

		return { success: true, data: logs };
	})
	.patch("/:id/crm", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		if (user.role !== "crm" && user.role !== "superadmin" && user.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const id = Number(params.id);
		const updates = body as Record<string, any>;

		const current = await db.query.crmData.findFirst({ where: eq(crmData.studentId, id) });
		if (!current) {
			await db.insert(crmData).values({ studentId: id, ...updates });
		} else {
			await db.update(crmData).set({ ...updates, updatedAt: new Date() }).where(eq(crmData.studentId, id));
		}

		// Recalculate status
		const updated = await db.query.crmData.findFirst({ where: eq(crmData.studentId, id) });
		if (updated) {
			let checked = 0;
			if (updated.odsActive) checked++;
			if (updated.studentMonitoring) checked++;
			if (updated.parentFollowUp) checked++;
			if (updated.practiceAttendance) checked++;
			if (updated.odsDocumentation) checked++;

			let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
			if (checked === 5) status = "AMAN";
			else if (checked >= 3) status = "PERLU_PERHATIAN";

			const extraUpdates: any = { status };
			if (checked < 5 && updated.isAcc) {
				extraUpdates.isAcc = false;
				extraUpdates.accAt = null;
				extraUpdates.accBy = null;
			}

			await db.update(crmData).set(extraUpdates).where(eq(crmData.studentId, id));
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/crm/log", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		const { logText } = body as { logText: string };

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		await db.insert(crmLogs).values({
			studentId: id,
			authorId: user.id,
			logText
		});

		return { success: true };
	}, {
		body: t.Object({ logText: t.String() })
	})
	.post("/:id/crm/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const currentCrm = await db.query.crmData.findFirst({ where: eq(crmData.studentId, id) });
		if (
			!currentCrm ||
			!currentCrm.odsActive ||
			!currentCrm.studentMonitoring ||
			!currentCrm.parentFollowUp ||
			!currentCrm.practiceAttendance ||
			!currentCrm.odsDocumentation
		) {
			set.status = 400;
			return { success: false, message: "Semua checklist harus selesai sebelum ACC." };
		}

		await db.update(crmData).set({
			isAcc: true,
			accAt: new Date(),
			accBy: user.id,
		}).where(eq(crmData.studentId, id));

		return { success: true };
	})
	
	// --- CRM DOCUMENTS ---
	.get("/:id/crm/documents", async ({ params, set }) => {
		const id = Number(params.id);
		const docs = await db.query.crmDocuments.findMany({
			where: eq(crmDocuments.studentId, id),
			orderBy: [desc(crmDocuments.uploadedAt)],
			with: {
				uploadedBy: { columns: { fullName: true } },
				verifiedBy: { columns: { fullName: true } }
			}
		});

		const grouped = docs.reduce((acc, doc) => {
			if (!acc[doc.documentKey]) acc[doc.documentKey] = [];
			acc[doc.documentKey].push(doc);
			return acc;
		}, {} as Record<string, typeof docs>);

		return { success: true, data: grouped };
	})
	.post("/:id/crm/upload/:documentKey", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const id = Number(params.id);
		const documentKey = params.documentKey;

		const allowedKeys = ["odsActive", "studentMonitoring", "parentFollowUp", "practiceAttendance", "odsDocumentation"];
		if (!allowedKeys.includes(documentKey)) {
			set.status = 400;
			return { success: false, message: "Document key tidak valid" };
		}

		const file = body.file as File;
		if (!file) {
			set.status = 400;
			return { success: false, message: "File tidak ditemukan" };
		}

		const MAX_SIZE = 10 * 1024 * 1024; // 10MB
		const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/zip", "application/x-zip-compressed"];
		if (file.size > MAX_SIZE) {
			set.status = 400;
			return { success: false, message: "File terlalu besar (maksimal 10MB)" };
		}
		if (!allowedTypes.includes(file.type)) {
			set.status = 400;
			return { success: false, message: "Tipe file tidak diizinkan (PDF, JPG, PNG, ZIP)" };
		}

		const uploadDir = join(process.cwd(), "uploads", "crm", id.toString(), documentKey);
		await mkdir(uploadDir, { recursive: true });

		const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
		const fileUrl = join(uploadDir, filename);

		await Bun.write(fileUrl, await file.arrayBuffer());

		await db.insert(crmDocuments).values({
			studentId: id,
			documentKey,
			fileName: file.name,
			fileUrl: fileUrl,
			fileSize: file.size,
			mimeType: file.type,
			uploadedBy: user.id,
		});

		return { success: true, message: "File berhasil diupload" };
	}, {
		body: t.Object({
			file: t.File()
		})
	})
	.get("/:id/crm/documents/:docId/download", async ({ params, set }) => {
		const docId = Number(params.docId);
		const doc = await db.query.crmDocuments.findFirst({
			where: eq(crmDocuments.id, docId)
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		const file = Bun.file(doc.fileUrl);
		if (!await file.exists()) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan di server" };
		}

		return new Response(file, {
			headers: {
				"Content-Type": doc.mimeType || "application/octet-stream",
				"Content-Disposition": `inline; filename="${doc.fileName}"`,
			}
		});
	})
	.patch("/:id/crm/documents/:docId/verify", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "crm" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.update(crmDocuments)
			.set({ isVerified: true, verifiedAt: new Date(), verifiedBy: user.id })
			.where(eq(crmDocuments.id, Number(params.docId)));

		return { success: true };
	})
	.delete("/:id/crm/documents/:docId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "crm" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const docId = Number(params.docId);
		
		const doc = await db.query.crmDocuments.findFirst({
			where: eq(crmDocuments.id, docId)
		});
		
		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}
		
		await db.delete(crmDocuments).where(eq(crmDocuments.id, docId));
		return { success: true };
	})

	// --- FINANCE ROUTES ---
	.get("/:id/finance", async ({ params, set }) => {
		const id = Number(params.id);
		const finance = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});
		return { success: true, data: finance };
	})
	.patch("/:id/finance", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;
		
		// AUTH CHECK
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		if (user.role !== "finance" && user.role !== "superadmin" && user.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const id = Number(params.id);
		const updates = body as Record<string, any>;

		const current = await db.query.financeData.findFirst({ where: eq(financeData.studentId, id) });
		if (!current) {
			await db.insert(financeData).values({ studentId: id, ...updates });
		} else {
			// Convert ISO strings back to Date objects if needed, but JSON usually passes strings.
			// Drizzle with Postgres driver handles Date objects for timestamp fields.
			const cleanUpdates: Record<string, any> = { ...updates, updatedAt: new Date() };
			if (cleanUpdates.registrationDate) cleanUpdates.registrationDate = new Date(cleanUpdates.registrationDate);
			if (cleanUpdates.semesterDate) cleanUpdates.semesterDate = new Date(cleanUpdates.semesterDate);
			if (cleanUpdates.installmentDate) cleanUpdates.installmentDate = new Date(cleanUpdates.installmentDate);
			
			await db.update(financeData).set(cleanUpdates).where(eq(financeData.studentId, id));
		}

		// Recalculate status and auto-revoke isAcc
		const updated = await db.query.financeData.findFirst({ where: eq(financeData.studentId, id) });
		if (updated) {
			let checked = 0;
			if (updated.registrationPaid) checked++;
			if (updated.semesterPaid) checked++;
			if (updated.installmentCleared) checked++;
			if (updated.arrearsCleared) checked++;

			let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
			if (checked === 4) status = "AMAN";
			else if (checked >= 2) status = "PERLU_PERHATIAN";

			const toUpdate: any = { status };

			// AUTO-REVOKE isAcc if not all are true
			if (updated.isAcc && checked < 4) {
				toUpdate.isAcc = false;
				toUpdate.accAt = null;
				toUpdate.accBy = null;
			}

			await db.update(financeData).set(toUpdate).where(eq(financeData.studentId, id));
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/finance/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const currentFinance = await db.query.financeData.findFirst({ where: eq(financeData.studentId, id) });
		if (
			!currentFinance ||
			!currentFinance.registrationPaid ||
			!currentFinance.semesterPaid ||
			!currentFinance.installmentCleared ||
			!currentFinance.arrearsCleared
		) {
			set.status = 400;
			return { success: false, message: "Semua tagihan harus lunas / tidak ada tunggakan sebelum ACC." };
		}

		await db.update(financeData).set({
			isAcc: true,
			accAt: new Date(),
			accBy: user.id,
		}).where(eq(financeData.studentId, id));

		return { success: true };
	})
	
	// --- FINANCE DOCUMENTS ---
	.get("/:id/finance/documents", async ({ params }) => {
		const id = Number(params.id);

		const docs = await db.query.financeDocuments.findMany({
			where: eq(financeDocuments.studentId, id),
			orderBy: [desc(financeDocuments.uploadedAt)],
			with: {
				uploadedBy: { columns: { fullName: true } },
				verifiedBy: { columns: { fullName: true } },
			}
		});

		// Group by documentKey
		const grouped = docs.reduce((acc, doc) => {
			if (!acc[doc.documentKey]) acc[doc.documentKey] = [];
			acc[doc.documentKey].push(doc);
			return acc;
		}, {} as Record<string, typeof docs>);

		return { success: true, data: grouped };
	})
	.get("/:id/finance/documents/:docId/download", async ({ params, set }) => {
		const docId = Number(params.docId);
		const doc = await db.query.financeDocuments.findFirst({
			where: eq(financeDocuments.id, docId)
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		const file = Bun.file(doc.fileUrl);
		if (!await file.exists()) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan di server" };
		}

		return new Response(file, {
			headers: {
				"Content-Type": doc.mimeType || "application/octet-stream",
				"Content-Disposition": `inline; filename="${doc.fileName}"`,
			}
		});
	})
	.patch("/:id/finance/documents/:docId/verify", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "finance" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.update(financeDocuments)
			.set({ isVerified: true, verifiedAt: new Date(), verifiedBy: user.id })
			.where(eq(financeDocuments.id, Number(params.docId)));

		return { success: true };
	})
	.delete("/:id/finance/documents/:docId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "finance" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const docId = Number(params.docId);
		const doc = await db.query.financeDocuments.findFirst({
			where: eq(financeDocuments.id, docId)
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		await db.delete(financeDocuments).where(eq(financeDocuments.id, docId));
		return { success: true };
	})

	// --- ACADEMIC ROUTES ---
	.get("/:id/academic", async ({ params, set }) => {
		const id = Number(params.id);
		const academic = await db.query.academicData.findFirst({
			where: eq(academicData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});
		return { success: true, data: academic };
	})
	.patch("/:id/academic", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		if (user.role !== "akademik" && user.role !== "superadmin" && user.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const id = Number(params.id);
		const updates = body as Record<string, any>;

		const current = await db.query.academicData.findFirst({ where: eq(academicData.studentId, id) });
		if (!current) {
			await db.insert(academicData).values({ studentId: id, ...updates });
		} else {
			const cleanUpdates: Record<string, any> = { ...updates, updatedAt: new Date() };
			await db.update(academicData).set(cleanUpdates).where(eq(academicData.studentId, id));
		}

		// Recalculate status
		const updated = await db.query.academicData.findFirst({ where: eq(academicData.studentId, id) });
		if (updated) {
			let checked = 0;
			if (updated.pddiktiInput) checked++;
			
			const total = updated.attendanceTotal ?? 0;
			const present = updated.attendancePresent ?? 0;
			const attRate = total > 0 ? (present / total) * 100 : 0;
			if (attRate >= 70) checked++;
			
			if (updated.utsPassed) checked++;
			if (updated.uasPassed) checked++;
			if (updated.attitudeIndicator) checked++;
			if (updated.assignmentsCompleted) checked++;
			if (updated.academicCommunication) checked++;

			let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
			if (checked === 7) status = "AMAN";
			else if (checked >= 4) status = "PERLU_PERHATIAN";

			const toUpdate: any = { status };

			if (updated.isAcc && checked < 7) {
				toUpdate.isAcc = false;
				toUpdate.accAt = null;
				toUpdate.accBy = null;
			}

			await db.update(academicData).set(toUpdate).where(eq(academicData.studentId, id));
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/academic/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		// Academic ACC allows "warning" bypass, so we just set isAcc to true regardless of check count
		await db.update(academicData).set({
			isAcc: true,
			accAt: new Date(),
			accBy: user.id,
		}).where(eq(academicData.studentId, id));

		return { success: true };
	})
	.get("/:id/academic/documents", async ({ params }) => {
		const id = Number(params.id);
		const docs = await db.query.academicDocuments.findMany({
			where: eq(academicDocuments.studentId, id),
			orderBy: (t, { desc }) => [desc(t.uploadedAt)],
			with: {
				uploadedBy: { columns: { fullName: true } },
				verifiedBy: { columns: { fullName: true } },
			},
		});

		// Kelompokkan berdasarkan documentKey
		const grouped: Record<string, any[]> = {};
		for (const doc of docs) {
			if (!grouped[doc.documentKey]) grouped[doc.documentKey] = [];
			grouped[doc.documentKey].push(doc);
		}

		return { success: true, data: grouped };
	})
	.get("/:id/academic/documents/:docId/download", async ({ params, set }) => {
		const docId = Number(params.docId);
		const doc = await db.query.academicDocuments.findFirst({
			where: eq(academicDocuments.id, docId)
		});
		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}
		// @ts-ignore
		const file = Bun.file(doc.fileUrl);
		return new Response(file, {
			headers: {
				"Content-Type": doc.mimeType || "application/octet-stream",
				"Content-Disposition": `inline; filename="${doc.fileName}"`,
			},
		});
	})
	.patch("/:id/academic/documents/:docId/verify", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "akademik" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.update(academicDocuments)
			.set({ isVerified: true, verifiedAt: new Date(), verifiedBy: user.id })
			.where(eq(academicDocuments.id, Number(params.docId)));

		return { success: true };
	})
	.delete("/:id/academic/documents/:docId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "akademik" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const docId = Number(params.docId);
		const doc = await db.query.academicDocuments.findFirst({
			where: eq(academicDocuments.id, docId)
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		await db.delete(academicDocuments).where(eq(academicDocuments.id, docId));
		return { success: true };
	})
	
	// --- DOSEN ROUTES ---
	.get("/:id/course-grades", async ({ params, set }) => {
		const id = Number(params.id);
		const grades = await db.query.courseGrades.findMany({
			where: eq(courseGrades.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});
		return { success: true, data: grades };
	})
	.post("/:id/course-grades", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		if (user.role !== "superadmin" && user.role !== "dosen" && user.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const id = Number(params.id);
		const input = body as { courseCode: string; courseName: string; dosenId: number; };

		await db.insert(courseGrades).values({
			studentId: id,
			courseCode: input.courseCode,
			courseName: input.courseName,
			dosenId: input.dosenId,
		});

		return { success: true };
	}, {
		body: t.Object({
			courseCode: t.String(),
			courseName: t.String(),
			dosenId: t.Number(),
		})
	})
	.delete("/:id/course-grades/:courseId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || user.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden: Hanya Superadmin yang bisa menghapus MK" };
		}

		const courseId = Number(params.courseId);
		await db.delete(courseGrades).where(eq(courseGrades.id, courseId));

		return { success: true };
	})
	.patch("/:id/course-grades/:courseId", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const courseId = Number(params.courseId);
		const user = (context as any).user;
		const updates = body as Record<string, any>;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const current = await db.query.courseGrades.findFirst({ 
			where: eq(courseGrades.id, courseId)
		});

		if (!current) {
			set.status = 404;
			return { success: false, message: "Course not found" };
		}

		// Only superadmin or the assigned dosen can edit
		if (user.role !== "superadmin" && current.dosenId !== user.id) {
			set.status = 403;
			return { success: false, message: "Forbidden: Not assigned to this course" };
		}

		const cleanUpdates: Record<string, any> = { ...updates, updatedAt: new Date() };
		await db.update(courseGrades).set(cleanUpdates).where(eq(courseGrades.id, courseId));

		// Recalculate status per MK
		const updated = await db.query.courseGrades.findFirst({ where: eq(courseGrades.id, courseId) });
		if (updated) {
			let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
			const att = updated.attendanceRate || 0;
			const grade = updated.grade || "E";
			const attitude = updated.attitudeNote || "Buruk";

			// Status logic from UI Plan
			const isAmanGrade = ["A", "A-", "B+", "B"].includes(grade);
			const isPerhatianGrade = grade === "B-";
			
			if (att >= 70 && isAmanGrade && attitude === "Baik") {
				status = "AMAN";
			} else if (att >= 60 || isPerhatianGrade) {
				status = "PERLU_PERHATIAN";
			}
			// If att < 60 or grade <= C, it remains TIDAK_AMAN

			await db.update(courseGrades).set({ status }).where(eq(courseGrades.id, courseId));
		}

		// Recalculate GPA and sync to academic_data
		const allGrades = await db.query.courseGrades.findMany({
			where: eq(courseGrades.studentId, id)
		});

		const gradePoints: Record<string, number> = {
			"A": 400, "A-": 370, "B+": 330, "B": 300,
			"B-": 270, "C+": 230, "C": 200, "D": 100, "E": 0
		};

		const totalPoints = allGrades.reduce((sum, g) => sum + (gradePoints[g.grade || "E"] || 0), 0);
		const gpaScaled = allGrades.length > 0 ? Math.round(totalPoints / allGrades.length) : 0;

		const existingAcad = await db.query.academicData.findFirst({ where: eq(academicData.studentId, id) });
		if (existingAcad) {
			await db.update(academicData).set({ gpa: gpaScaled }).where(eq(academicData.studentId, id));
		} else {
			await db.insert(academicData).values({ studentId: id, gpa: gpaScaled });
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/course-grades/:courseId/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const courseId = Number(params.courseId);
		
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const current = await db.query.courseGrades.findFirst({ 
			where: eq(courseGrades.id, courseId)
		});

		if (!current) {
			set.status = 404;
			return { success: false, message: "Course not found" };
		}

		if (user.role !== "superadmin" && current.dosenId !== user.id) {
			set.status = 403;
			return { success: false, message: "Forbidden: Not assigned to this course" };
		}

		await db.update(courseGrades).set({
			isAcc: true,
			accAt: new Date(),
			accBy: user.id,
		}).where(eq(courseGrades.id, courseId));

		return { success: true };
	})
	.post("/:id/course-grades/:courseId/upload/:documentKey", async (context) => {
		const { params, request, set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const id = Number(params.id);
		const courseId = Number(params.courseId);
		const documentKey = params.documentKey;

		const allowedKeys = ["attendance_proof", "grade_card", "dispensation"];
		if (!allowedKeys.includes(documentKey)) {
			set.status = 400;
			return { success: false, message: "Document key tidak valid" };
		}

		const formData = await request.formData();
		const file = formData.get("file") as File | null;

		if (!file) {
			set.status = 400;
			return { success: false, message: "File tidak ditemukan" };
		}

		const MAX_SIZE = 10 * 1024 * 1024;
		const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/zip"];
		
		if (file.size > MAX_SIZE) {
			set.status = 400;
			return { success: false, message: "File terlalu besar (maks 10MB)" };
		}
		
		if (!allowedTypes.includes(file.type)) {
			set.status = 400;
			return { success: false, message: "Tipe file tidak diizinkan" };
		}

		const uploadDir = `./uploads/course-grades/${id}/${courseId}/${documentKey}`;
		await mkdir(uploadDir, { recursive: true });
		const filePath = `${uploadDir}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
		await Bun.write(filePath, await file.arrayBuffer());

		await db.insert(courseGradeDocuments).values({
			studentId: id,
			courseGradeId: courseId,
			documentKey,
			fileName: file.name,
			fileUrl: filePath,
			fileSize: file.size,
			mimeType: file.type,
			uploadedBy: user.id,
		});

		return { success: true, message: "File berhasil diupload" };
	})
	.get("/:id/course-grades/:courseId/documents", async ({ params }) => {
		const courseId = Number(params.courseId);
		const docs = await db.query.courseGradeDocuments.findMany({
			where: eq(courseGradeDocuments.courseGradeId, courseId),
			orderBy: (t, { desc }) => [desc(t.uploadedAt)],
			with: {
				uploadedBy: { columns: { fullName: true } },
				verifiedBy: { columns: { fullName: true } },
			},
		});

		const grouped: Record<string, any[]> = {};
		for (const doc of docs) {
			if (!grouped[doc.documentKey]) grouped[doc.documentKey] = [];
			grouped[doc.documentKey].push(doc);
		}

		return { success: true, data: grouped };
	})
	.get("/:id/course-grades/:courseId/documents/:docId/download", async ({ params, set }) => {
		const docId = Number(params.docId);
		const doc = await db.query.courseGradeDocuments.findFirst({
			where: eq(courseGradeDocuments.id, docId)
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		const file = Bun.file(doc.fileUrl);
		if (!await file.exists()) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan di server" };
		}

		return new Response(file, {
			headers: {
				"Content-Type": doc.mimeType || "application/octet-stream",
				"Content-Disposition": `inline; filename="${doc.fileName}"`,
			},
		});
	})
	.patch("/:id/course-grades/:courseId/documents/:docId/verify", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "dosen" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.update(courseGradeDocuments)
			.set({ isVerified: true, verifiedAt: new Date(), verifiedBy: user.id })
			.where(eq(courseGradeDocuments.id, Number(params.docId)));

		return { success: true };
	})
	.delete("/:id/course-grades/:courseId/documents/:docId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "dosen" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const docId = Number(params.docId);
		const doc = await db.query.courseGradeDocuments.findFirst({
			where: eq(courseGradeDocuments.id, docId)
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		await db.delete(courseGradeDocuments).where(eq(courseGradeDocuments.id, docId));
		return { success: true };
	})
	
	// --- PA ROUTES ---
	.get("/:id/pa", async ({ params }) => {
		const id = Number(params.id);
		const paInfo = await db.query.paData.findFirst({
			where: eq(paData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});
		
		const vocab = await db.query.vocabLogs.findMany({
			where: eq(vocabLogs.studentId, id),
			orderBy: (logs, { desc }) => [desc(logs.date)]
		});
		
		const counseling = await db.query.counselingLogs.findMany({
			where: eq(counselingLogs.studentId, id),
			orderBy: (logs, { desc }) => [desc(logs.date)]
		});
		
		return { 
			success: true, 
			data: paInfo || null,
			vocabLogs: vocab || [],
			counselingLogs: counseling || []
		};
	})
	.patch("/:id/pa", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const user = (context as any).user;
		const updates = body as Record<string, any>;

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const cleanUpdates: Record<string, any> = { ...updates, updatedAt: new Date() };
		await db.update(paData).set(cleanUpdates).where(eq(paData.studentId, id));

		// Recalculate status
		const current = await db.query.paData.findFirst({ where: eq(paData.studentId, id) });
		if (current) {
			const isAman = current.counselingDone && current.mentalStable && current.disciplineGood;
			const isKritis = !current.mentalStable && !current.disciplineGood;
			
			const newStatus = isAman ? "AMAN" : isKritis ? "TIDAK_AMAN" : "PERLU_PERHATIAN";
			await db.update(paData).set({ status: newStatus }).where(eq(paData.studentId, id));
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/pa/vocabulary", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const user = (context as any).user;
		const input = body as any;

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.insert(vocabLogs).values({
			studentId: id,
			addedWords: Number(input.addedWords),
			date: new Date(input.date || Date.now()),
			notes: input.notes
		});

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/pa/counseling", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const user = (context as any).user;
		const input = body as any;

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.insert(counselingLogs).values({
			studentId: id,
			condition: input.condition,
			date: new Date(input.date || Date.now()),
			notes: input.notes
		});

		// Check if counseling done (>= 3)
		const logs = await db.query.counselingLogs.findMany({ where: eq(counselingLogs.studentId, id) });
		if (logs.length >= 3) {
			await db.update(paData).set({ counselingDone: true }).where(eq(paData.studentId, id));
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/pa/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		
		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.update(paData).set({
			isAcc: true,
			accAt: new Date(),
			accBy: user.id,
		}).where(eq(paData.studentId, id));

		return { success: true };
	})
	
	// --- INTERNSHIP ROUTES ---
	.get("/:id/internship", async ({ params }) => {
		const id = Number(params.id);
		const info = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});
		
		return { success: true, data: info || null };
	})
	.patch("/:id/internship", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const user = (context as any).user;
		const updates = body as Record<string, any>;

		if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		// Convert string dates to Date objects if necessary
		const dateFields = ["passportExp", "interviewDate", "contractDate", "mcuDate", "ticketDate", "pdtDate"];
		for (const field of dateFields) {
			if (updates[field]) {
				updates[field] = new Date(updates[field]);
			}
		}

		const cleanUpdates: Record<string, any> = { ...updates, updatedAt: new Date() };
		await db.update(internshipData).set(cleanUpdates).where(eq(internshipData.studentId, id));

		// Recalculate status
		const current = await db.query.internshipData.findFirst({ where: eq(internshipData.studentId, id) });
		if (current) {
			const checks = [
				current.passportReady, current.interviewReady, current.loaReady, 
				current.contractReady, current.mcuReady, current.visaReady, 
				current.ticketReady, current.pdtReady
			];
			const completedCount = checks.filter(Boolean).length;
			let newStatus: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "PERLU_PERHATIAN";
			
			if (completedCount === 8) newStatus = "AMAN";
			else if (completedCount <= 3) newStatus = "TIDAK_AMAN";
			
			if (!current.passportReady || !current.visaReady) {
				newStatus = "TIDAK_AMAN"; // Blocking rules
			}
			
			await db.update(internshipData).set({ status: newStatus }).where(eq(internshipData.studentId, id));
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.patch("/:id/internship/schedule", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const user = (context as any).user;
		const input = body as any;

		if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.update(internshipData).set({
			estDepartureDate: input.estDepartureDate ? new Date(input.estDepartureDate) : null,
			destinationCity: input.destinationCity,
			internshipDuration: input.internshipDuration,
			internshipCompany: input.internshipCompany,
			updatedAt: new Date()
		}).where(eq(internshipData.studentId, id));

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/internship/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		
		if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.update(internshipData).set({
			isAcc: true,
			accAt: new Date(),
			accBy: user.id,
		}).where(eq(internshipData.studentId, id));

		return { success: true };
	})
	.get("/:id/final-decision", async ({ params, set }) => {
		const id = Number(params.id);
		if (isNaN(id)) {
			set.status = 400;
			return { success: false, message: "Invalid ID" };
		}

		const [decision, logs, student] = await Promise.all([
			db.query.finalDecision.findFirst({
				where: eq(finalDecision.studentId, id),
				with: {
					decidedBy: true
				}
			}),
			db.query.auditLogs.findMany({
				where: eq(auditLogs.entityId, id),
				orderBy: [desc(auditLogs.createdAt)],
				with: {
					user: true
				}
			}),
			db.query.students.findFirst({
				where: eq(students.id, id)
			})
		]);

		// Filter audit logs only for final_decision entity
		const decisionLogs = logs.filter(l => l.entity === "final_decision");

		if (!decision) {
			// Create default if not exists
			await db.insert(finalDecision).values({ studentId: id });
			const newDecision = await db.query.finalDecision.findFirst({
				where: eq(finalDecision.studentId, id)
			});
			return { success: true, data: { decision: newDecision, logs: [], student } };
		}

		return { success: true, data: { decision, logs: decisionLogs, student } };
	})
	.patch("/:id/final-decision", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);

		if (!user || (user.role !== "evaluator" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const prevDecision = await db.query.finalDecision.findFirst({
			where: eq(finalDecision.studentId, id)
		});

		await db.update(finalDecision).set({
			evaluatorDecision: (body as any).evaluatorDecision,
			evaluatorNotes: (body as any).evaluatorNotes,
			decidedAt: new Date(),
			decidedBy: user.id,
			updatedAt: new Date(),
		}).where(eq(finalDecision.studentId, id));

		if (prevDecision?.evaluatorDecision !== (body as any).evaluatorDecision) {
			await db.insert(auditLogs).values({
				userId: user.id,
				action: "UPDATE_EVALUATOR_DECISION",
				entity: "final_decision",
				entityId: id,
				details: {
					from: prevDecision?.evaluatorDecision || "menunggu",
					to: (body as any).evaluatorDecision
				}
			});
		}

		return { success: true };
	}, {
		body: t.Object({
			evaluatorDecision: t.String(),
			evaluatorNotes: t.Optional(t.String()),
		})
	})
	
	// ==========================================
	// PA (Pendamping Akademik) ROUTES
	// ==========================================
	.get("/:id/pa", async (context) => {
		const id = Number(context.params.id);
		let pa = await db.query.paData.findFirst({
			where: eq(paData.studentId, id),
			with: {
				accBy: true
			}
		});

		if (!pa) {
			await db.insert(paData).values({ studentId: id });
			pa = await db.query.paData.findFirst({
				where: eq(paData.studentId, id),
				with: {
					accBy: true
				}
			});
		}

		const vLogs = await db.query.vocabLogs.findMany({
			where: eq(vocabLogs.studentId, id),
			orderBy: [desc(vocabLogs.date)]
		});

		const cLogs = await db.query.counselingLogs.findMany({
			where: eq(counselingLogs.studentId, id),
			orderBy: [desc(counselingLogs.date)]
		});

		return { success: true, data: { data: pa, vocabLogs: vLogs, counselingLogs: cLogs } };
	})
	.patch("/:id/pa", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const pa = await db.query.paData.findFirst({ where: eq(paData.studentId, id) });
		if (!pa) return { success: false, message: "PA data not found" };

		if (pa.isAcc && user.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Cannot edit after ACC" };
		}

		await db.update(paData).set({
			...(body as any),
			updatedAt: new Date(),
		}).where(eq(paData.studentId, id));

		// Update status
		const updatedPa = await db.query.paData.findFirst({ where: eq(paData.studentId, id) });
		if (updatedPa) {
			const checks = [updatedPa.counselingDone, updatedPa.mentalStable, updatedPa.disciplineGood];
			const completed = checks.filter(Boolean).length;
			let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
			if (completed === 3) status = "AMAN";
			else if (completed > 0) status = "PERLU_PERHATIAN";

			await db.update(paData).set({ status }).where(eq(paData.studentId, id));
		}

		return { success: true };
	}, {
		body: t.Object({
			counselingDone: t.Optional(t.Boolean()),
			mentalStable: t.Optional(t.Boolean()),
			disciplineGood: t.Optional(t.Boolean()),
			vocabTarget: t.Optional(t.Number()),
			disciplineNotes: t.Optional(t.String()),
		})
	})
	.post("/:id/pa/vocabulary", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.insert(vocabLogs).values({
			studentId: id,
			addedWords: (body as any).addedWords,
			date: new Date((body as any).date),
			notes: (body as any).notes,
		});

		return { success: true };
	}, {
		body: t.Object({
			addedWords: t.Number(),
			date: t.String(),
			notes: t.Optional(t.String()),
		})
	})
	.delete("/:id/pa/vocabulary/:logId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const logId = Number(params.logId);

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.delete(vocabLogs).where(eq(vocabLogs.id, logId));
		return { success: true };
	})
	.post("/:id/pa/counseling", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.insert(counselingLogs).values({
			studentId: id,
			condition: (body as any).condition,
			date: new Date((body as any).date),
			notes: (body as any).notes,
		});

		return { success: true };
	}, {
		body: t.Object({
			condition: t.String(),
			date: t.String(),
			notes: t.String(),
		})
	})
	.delete("/:id/pa/counseling/:logId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const logId = Number(params.logId);

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.delete(counselingLogs).where(eq(counselingLogs.id, logId));
		return { success: true };
	})
	.patch("/:id/internship", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);

		if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const current = await db.query.internshipData.findFirst({ where: eq(internshipData.studentId, id) });
		if (!current) {
			set.status = 404;
			return { success: false, message: "Not found" };
		}

		// Convert string dates to Date objects where applicable
		const updates: any = { ...body, updatedAt: new Date() };
		const dateFields = ["passportExp", "interviewDate", "contractDate", "mcuDate", "ticketDate", "pdtDate"];
		dateFields.forEach(field => {
			if (updates[field] !== undefined) {
				updates[field] = updates[field] ? new Date(updates[field]) : null;
			}
		});

		// Update status calculation based on body or current
		const newState = { ...current, ...updates };
		
		const checks = [
			newState.passportReady, newState.interviewReady, newState.loaReady, 
			newState.contractReady, newState.mcuReady, newState.visaReady, 
			newState.ticketReady, newState.pdtReady
		];
		const completedCount = checks.filter(Boolean).length;
		
		if (!newState.passportReady || !newState.visaReady) {
			updates.status = "TIDAK_AMAN";
		} else if (completedCount === 8) {
			updates.status = "AMAN";
		} else if (completedCount >= 4) {
			updates.status = "PERLU_PERHATIAN";
		} else {
			updates.status = "TIDAK_AMAN";
		}

		await db.update(internshipData).set(updates).where(eq(internshipData.studentId, id));
		await db.update(students).set({ overallStatus: updates.status }).where(eq(students.id, id));

		return { success: true };
	}, {
		body: t.Object({
			passportReady: t.Optional(t.Boolean()),
			passportNo: t.Optional(t.Union([t.String(), t.Null()])),
			passportExp: t.Optional(t.Union([t.String(), t.Null()])),
			interviewReady: t.Optional(t.Boolean()),
			interviewDate: t.Optional(t.Union([t.String(), t.Null()])),
			interviewResult: t.Optional(t.Union([t.String(), t.Null()])),
			loaReady: t.Optional(t.Boolean()),
			loaCompany: t.Optional(t.Union([t.String(), t.Null()])),
			loaPosition: t.Optional(t.Union([t.String(), t.Null()])),
			contractReady: t.Optional(t.Boolean()),
			contractDate: t.Optional(t.Union([t.String(), t.Null()])),
			mcuReady: t.Optional(t.Boolean()),
			mcuPlace: t.Optional(t.Union([t.String(), t.Null()])),
			mcuDate: t.Optional(t.Union([t.String(), t.Null()])),
			mcuResult: t.Optional(t.Union([t.String(), t.Null()])),
			visaReady: t.Optional(t.Boolean()),
			visaType: t.Optional(t.Union([t.String(), t.Null()])),
			visaStatus: t.Optional(t.Union([t.String(), t.Null()])),
			visaNo: t.Optional(t.Union([t.String(), t.Null()])),
			ticketReady: t.Optional(t.Boolean()),
			ticketAirline: t.Optional(t.Union([t.String(), t.Null()])),
			ticketDate: t.Optional(t.Union([t.String(), t.Null()])),
			ticketFlight: t.Optional(t.Union([t.String(), t.Null()])),
			pdtReady: t.Optional(t.Boolean()),
			pdtDate: t.Optional(t.Union([t.String(), t.Null()])),
			pdtPlace: t.Optional(t.Union([t.String(), t.Null()])),
			notes: t.Optional(t.Union([t.String(), t.Null()]))
		})
	})
	.patch("/:id/internship/schedule", async (context) => {
		const { params, body, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);

		if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.update(internshipData).set({
			estDepartureDate: body.estDepartureDate ? new Date(body.estDepartureDate) : null,
			destinationCity: body.destinationCity,
			internshipDuration: body.internshipDuration,
			internshipCompany: body.internshipCompany,
			updatedAt: new Date(),
		}).where(eq(internshipData.studentId, id));

		return { success: true };
	}, {
		body: t.Object({
			estDepartureDate: t.Optional(t.Union([t.String(), t.Null()])),
			destinationCity: t.Optional(t.Union([t.String(), t.Null()])),
			internshipDuration: t.Optional(t.Union([t.String(), t.Null()])),
			internshipCompany: t.Optional(t.Union([t.String(), t.Null()])),
		})
	})
	.get("/:id/status", async (context) => {
		const id = Number(context.params.id);

		// Fetch all data
		const [studentRecord] = await db.select().from(students).where(eq(students.id, id));
		if (!studentRecord) {
			context.set.status = 404;
			return { success: false, message: "Student not found" };
		}

		const [pmb] = await db.select().from(pmbData).where(eq(pmbData.studentId, id));
		const [crm] = await db.select().from(crmData).where(eq(crmData.studentId, id));
		const [finance] = await db.select().from(financeData).where(eq(financeData.studentId, id));
		const [academic] = await db.select().from(academicData).where(eq(academicData.studentId, id));
		const courses = await db.select().from(courseGrades).where(eq(courseGrades.studentId, id));
		const [pa] = await db.select().from(paData).where(eq(paData.studentId, id));
		const [internship] = await db.select().from(internshipData).where(eq(internshipData.studentId, id));

		const incompleteIndicators: { panel: string; name: string; status: "TIDAK_AMAN" | "PERLU_PERHATIAN"; link: string }[] = [];
		const panels: any[] = [];

		let totalCompleted = 0;
		let totalIndicators = 0;

		// 1. PMB
		const pmbItems = [
			{ prop: pmb?.formReceived, name: "Formulir Pendaftaran" },
			{ prop: pmb?.documentsComplete, name: "Dokumen Lengkap" },
			{ prop: pmb?.dataInputted, name: "Data Diinput" },
			{ prop: pmb?.initialFollowUp, name: "Follow Up Awal" }
		];
		const pmbCompleted = pmbItems.filter(i => i.prop).length;
		pmbItems.filter(i => !i.prop).forEach(i => incompleteIndicators.push({ panel: "PMB", name: i.name, status: "TIDAK_AMAN", link: "pmb" }));
		panels.push({ id: "pmb", name: "PMB", completed: pmbCompleted, total: 4, status: pmbCompleted === 4 ? "AMAN" : pmbCompleted >= 2 ? "PERLU_PERHATIAN" : "TIDAK_AMAN" });
		totalCompleted += pmbCompleted;
		totalIndicators += 4;

		// 2. CRM
		const crmItems = [
			{ prop: crm?.odsActive, name: "ODS Aktif" },
			{ prop: crm?.studentMonitoring, name: "Monitoring Mahasiswa" },
			{ prop: crm?.parentFollowUp, name: "Follow Up Orang Tua" },
			{ prop: crm?.practiceAttendance, name: "Update Kehadiran Praktik" },
			{ prop: crm?.odsDocumentation, name: "Dokumentasi ODS" }
		];
		const crmCompleted = crmItems.filter(i => i.prop).length;
		crmItems.filter(i => !i.prop).forEach(i => incompleteIndicators.push({ panel: "CRM", name: i.name, status: "PERLU_PERHATIAN", link: "crm" }));
		panels.push({ id: "crm", name: "CRM", completed: crmCompleted, total: 5, status: crmCompleted === 5 ? "AMAN" : crmCompleted >= 3 ? "PERLU_PERHATIAN" : "TIDAK_AMAN" });
		totalCompleted += crmCompleted;
		totalIndicators += 5;

		// 3. Finance
		const financeItems = [
			{ prop: finance?.registrationPaid, name: "Registrasi Lunas" },
			{ prop: finance?.semesterPaid, name: "Semester Lunas" },
			{ prop: finance?.installmentCleared, name: "Cicilan Lunas" },
			{ prop: finance?.arrearsCleared, name: "Tunggakan Lunas" }
		];
		const financeCompleted = financeItems.filter(i => i.prop).length;
		financeItems.filter(i => !i.prop).forEach(i => incompleteIndicators.push({ panel: "Finance", name: i.name, status: "TIDAK_AMAN", link: "finance" }));
		panels.push({ id: "finance", name: "Finance", completed: financeCompleted, total: 4, status: financeCompleted === 4 ? "AMAN" : financeCompleted >= 2 ? "PERLU_PERHATIAN" : "TIDAK_AMAN" });
		totalCompleted += financeCompleted;
		totalIndicators += 4;

		// 4. Akademik
		const attendanceOk = academic ? (academic.attendanceTotal && academic.attendanceTotal > 0 && (academic.attendancePresent! / academic.attendanceTotal!) >= 0.8) : false;
		const academicItems = [
			{ prop: academic?.pddiktiInput, name: "Input PDDIKTI" },
			{ prop: attendanceOk, name: "Kehadiran (≥80%)" },
			{ prop: academic?.utsPassed, name: "Lulus UTS" },
			{ prop: academic?.uasPassed, name: "Lulus UAS" },
			{ prop: academic?.attitudeIndicator, name: "Attitude Baik" },
			{ prop: academic?.assignmentsCompleted, name: "Tugas Selesai" },
			{ prop: academic?.academicCommunication, name: "Komunikasi Akademik" }
		];
		const academicCompleted = academicItems.filter(i => i.prop).length;
		academicItems.filter(i => !i.prop).forEach(i => incompleteIndicators.push({ panel: "Akademik", name: i.name, status: "PERLU_PERHATIAN", link: "akademik" }));
		panels.push({ id: "akademik", name: "Akademik", completed: academicCompleted, total: 7, status: academicCompleted === 7 ? "AMAN" : academicCompleted >= 4 ? "PERLU_PERHATIAN" : "TIDAK_AMAN" });
		totalCompleted += academicCompleted;
		totalIndicators += 7;

		// 5. Dosen per MK
		let dosenCompleted = 0;
		const dosenTotal = courses.length * 3;
		courses.forEach(c => {
			const attOk = (c.attendanceRate || 0) >= 75;
			const gradeOk = !!c.grade;
			const accOk = !!c.isAcc;
			if (attOk) dosenCompleted++; else incompleteIndicators.push({ panel: "Dosen", name: `${c.courseName}: Kehadiran <75%`, status: "PERLU_PERHATIAN", link: "dosen" });
			if (gradeOk) dosenCompleted++; else incompleteIndicators.push({ panel: "Dosen", name: `${c.courseName}: Belum ada nilai`, status: "PERLU_PERHATIAN", link: "dosen" });
			if (accOk) dosenCompleted++; else incompleteIndicators.push({ panel: "Dosen", name: `${c.courseName}: Belum di-ACC`, status: "PERLU_PERHATIAN", link: "dosen" });
		});
		panels.push({ id: "dosen", name: "Dosen per MK", completed: dosenCompleted, total: dosenTotal, status: dosenTotal === 0 ? "AMAN" : dosenCompleted === dosenTotal ? "AMAN" : (dosenCompleted / dosenTotal) >= 0.5 ? "PERLU_PERHATIAN" : "TIDAK_AMAN" });
		totalCompleted += dosenCompleted;
		totalIndicators += dosenTotal;

		// 6. PA
		const paItems = [
			{ prop: pa?.counselingDone, name: "Konseling Dilakukan" },
			{ prop: pa?.mentalStable, name: "Mental Stabil" },
			{ prop: pa?.disciplineGood, name: "Disiplin Baik" }
		];
		const paCompleted = paItems.filter(i => i.prop).length;
		paItems.filter(i => !i.prop).forEach(i => incompleteIndicators.push({ panel: "Pendamping Akademik", name: i.name, status: "PERLU_PERHATIAN", link: "pa" }));
		panels.push({ id: "pa", name: "Pendamping Akademik", completed: paCompleted, total: 3, status: paCompleted === 3 ? "AMAN" : paCompleted >= 1 ? "PERLU_PERHATIAN" : "TIDAK_AMAN" });
		totalCompleted += paCompleted;
		totalIndicators += 3;

		// 7. Magang
		const magangItems = [
			{ prop: internship?.passportReady, name: "Paspor" },
			{ prop: internship?.interviewReady, name: "Interview User" },
			{ prop: internship?.loaReady, name: "Letter of Acceptance (LoA)" },
			{ prop: internship?.contractReady, name: "Kontrak Magang" },
			{ prop: internship?.mcuReady, name: "Medical Check Up (MCU)" },
			{ prop: internship?.visaReady, name: "Visa" },
			{ prop: internship?.ticketReady, name: "Tiket Pesawat" },
			{ prop: internship?.pdtReady, name: "PDT (Pembekalan)" }
		];
		const magangCompleted = magangItems.filter(i => i.prop).length;
		magangItems.filter(i => !i.prop).forEach(i => incompleteIndicators.push({ panel: "Tim Magang", name: i.name, status: (i.name === "Paspor" || i.name === "Visa") ? "TIDAK_AMAN" : "PERLU_PERHATIAN", link: "magang" }));
		panels.push({ id: "magang", name: "Tim Magang", completed: magangCompleted, total: 8, status: magangCompleted === 8 ? "AMAN" : magangCompleted >= 4 ? "PERLU_PERHATIAN" : "TIDAK_AMAN" });
		totalCompleted += magangCompleted;
		totalIndicators += 8;

		// Overall Status Logic
		let overallStatus = "AMAN";
		if (panels.some(p => p.status === "TIDAK_AMAN")) overallStatus = "TIDAK_AMAN";
		else if (panels.some(p => p.status === "PERLU_PERHATIAN")) overallStatus = "PERLU_PERHATIAN";

		return {
			success: true,
			data: {
				overallStatus,
				totalCompleted,
				totalIndicators,
				panels,
				incompleteIndicators
			}
		};
	});
