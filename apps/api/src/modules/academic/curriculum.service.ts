import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db";
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
	practicumSchedules,
	semesterRolloverLogs,
	studentSemesterRegistrations,
	students,
	users,
} from "../../db/schema";
import { cacheDel, cacheFetch, cacheInvalidatePattern } from "../../lib/cache";

// ─────────────────────────────────────────────────────────────────────────────
// 1. ACTIVE TERM PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export async function getActiveAcademicTerm() {
	return await cacheFetch(
		"cache:academic-term:active",
		async () => {
			const term = await db.query.academicTerms.findFirst({
				where: eq(academicTerms.isActive, true),
			});
			return term || null;
		},
		60,
	);
}

export async function getAcademicTermById(id: number) {
	return await db.query.academicTerms.findFirst({
		where: eq(academicTerms.id, id),
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SINGLE SOURCE OF TRUTH: GET STUDENT COURSES FOR TERM (Task 3.3)
// ─────────────────────────────────────────────────────────────────────────────

export async function getStudentCoursesForTerm(
	studentId: number,
	termId?: number,
) {
	let targetTermId = termId;
	if (!targetTermId) {
		const active = await getActiveAcademicTerm();
		targetTermId = active?.id;
	}

	// 1. Ambil pendaftaran eksplisit dari course_enrollments
	const enrollmentsQuery = db
		.select({
			enrollmentId: courseEnrollments.id,
			courseId: courses.id,
			code: courses.code,
			name: courses.name,
			sks: courses.sks,
			type: courses.type,
			cohort: courses.cohort,
			rombel: courses.rombel,
			peminatan: courses.peminatan,
			semester: courses.semester,
			status: courses.status,
			source: courseEnrollments.source,
			enrollmentStatus: courseEnrollments.status,
			enrollmentNotes: courseEnrollments.notes,
			dosenId: courses.dosenId,
			dosenPendampingId: courses.dosenPendampingId,
			masterCourseId: courses.masterCourseId,
		})
		.from(courseEnrollments)
		.innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
		.where(
			targetTermId
				? and(
						eq(courseEnrollments.studentId, studentId),
						eq(courseEnrollments.termId, targetTermId),
						eq(courseEnrollments.status, "aktif"),
					)
				: and(
						eq(courseEnrollments.studentId, studentId),
						eq(courseEnrollments.status, "aktif"),
					),
		);

	const enrolled = await enrollmentsQuery;
	if (enrolled.length > 0) {
		return enrolled;
	}

	// 2. Fallback untuk data transisi: ambil dari pencocokan angkatan & rombel
	const [student] = await db
		.select()
		.from(students)
		.where(eq(students.id, studentId));
	if (!student) return [];

	const legacyCourses = await db
		.select({
			enrollmentId: sql<number>`0`,
			courseId: courses.id,
			code: courses.code,
			name: courses.name,
			sks: courses.sks,
			type: courses.type,
			cohort: courses.cohort,
			rombel: courses.rombel,
			peminatan: courses.peminatan,
			semester: courses.semester,
			status: courses.status,
			source: sql<string>`'paket'`,
			enrollmentStatus: sql<string>`'aktif'`,
			enrollmentNotes: sql<string | null>`null`,
			dosenId: courses.dosenId,
			dosenPendampingId: courses.dosenPendampingId,
			masterCourseId: courses.masterCourseId,
		})
		.from(courses)
		.where(
			and(
				eq(courses.cohort, student.cohort),
				targetTermId ? eq(courses.termId, targetTermId) : sql`true`,
			),
		);

	return legacyCourses.filter((c) => {
		const rombelMatch =
			!c.rombel || c.rombel === student.rombel || c.rombel === "Semua";
		const peminatanMatch =
			!c.peminatan || !student.subProgram || c.peminatan === student.subProgram;
		return rombelMatch && peminatanMatch;
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PEMBUKAAN KELAS DARI PAKET KURIKULUM (Task 3.7)
// ─────────────────────────────────────────────────────────────────────────────

export async function openClassesFromPackage(params: {
	termId: number;
	curriculumId: number;
	cohort: number;
	semester: number;
	rombel: string;
	peminatan?: string;
	defaultDosenId?: number;
	createdBy?: number;
}) {
	const {
		termId,
		curriculumId,
		cohort,
		semester,
		rombel,
		peminatan,
		defaultDosenId,
		createdBy,
	} = params;

	// Ambil seluruh master course dalam paket semester ini
	const packages = await db
		.select({
			packageId: curriculumPackages.id,
			semester: curriculumPackages.semester,
			isRequired: curriculumPackages.isRequired,
			masterId: masterCourses.id,
			code: masterCourses.code,
			name: masterCourses.name,
			sks: masterCourses.sks,
			type: masterCourses.type,
		})
		.from(curriculumPackages)
		.innerJoin(
			masterCourses,
			eq(curriculumPackages.masterCourseId, masterCourses.id),
		)
		.where(
			and(
				eq(curriculumPackages.curriculumId, curriculumId),
				eq(curriculumPackages.semester, semester),
			),
		);

	// Cari fallback dosen bila defaultDosenId tidak diberikan
	let fallbackDosenId = defaultDosenId;
	if (!fallbackDosenId) {
		const anyDosen = await db.query.users.findFirst({
			where: eq(users.role, "dosen"),
		});
		fallbackDosenId = anyDosen?.id || createdBy || 32;
	}

	const createdClasses: any[] = [];
	const skippedClasses: any[] = [];

	for (const pkg of packages) {
		// Buat kode kelas unik per periode + angkatan + rombel (e.g. HK101-A-18-261)
		const classCode = `${pkg.code}-${rombel.replace(/\s+/g, "")}-${cohort}`;

		// Cek apakah kelas sudah pernah dibuka di periode ini
		const existing = await db.query.courses.findFirst({
			where: and(
				eq(courses.termId, termId),
				eq(courses.masterCourseId, pkg.masterId),
				eq(courses.cohort, cohort),
				eq(courses.rombel, rombel),
			),
		});

		if (existing) {
			skippedClasses.push({
				courseId: existing.id,
				code: existing.code,
				name: existing.name,
				reason: "Kelas sudah ada di periode ini",
			});
			continue;
		}

		// Buat kelas baru
		const [newClass] = await db
			.insert(courses)
			.values({
				code: classCode,
				name: pkg.name,
				sks: pkg.sks,
				type: pkg.type,
				dosenId: fallbackDosenId,
				peminatan: peminatan || null,
				cohort,
				rombel,
				masterCourseId: pkg.masterId,
				termId,
				semester,
				status: "dibuka",
				createdBy,
			})
			.returning();

		// Buat 16 pertemuan otomatis (sesuai standar perkuliahan)
		const meetingsToInsert = Array.from({ length: 16 }).map((_, index) => {
			const meetingNumber = index + 1;
			let meetingType: "regular" | "uts" | "uas" = "regular";
			let meetingLabel = `Pertemuan ${meetingNumber}`;
			if (meetingNumber === 8) {
				meetingType = "uts";
				meetingLabel = "Ujian Tengah Semester (UTS)";
			} else if (meetingNumber === 16) {
				meetingType = "uas";
				meetingLabel = "Ujian Akhir Semester (UAS)";
			}
			return {
				courseId: newClass.id,
				meetingNumber,
				meetingType,
				sessionType: pkg.type,
				meetingLabel,
				dosenPengajarId: fallbackDosenId,
			};
		});

		await db.insert(courseMeetings).values(meetingsToInsert);

		createdClasses.push({
			courseId: newClass.id,
			code: newClass.code,
			name: newClass.name,
			sks: newClass.sks,
			semester,
			rombel,
		});
	}

	return {
		created: createdClasses,
		skipped: skippedClasses,
		totalCreated: createdClasses.length,
		totalSkipped: skippedClasses.length,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DETEKSI BENTROK JADWAL PRIBADI MAHASISWA (Task 4.3)
// ─────────────────────────────────────────────────────────────────────────────

export async function checkStudentScheduleConflict(
	studentId: number,
	targetCourseId: number,
	termId: number,
) {
	// Ambil jadwal dari mata kuliah yang akan ditambahkan
	const targetSchedules = await db
		.select()
		.from(classSchedules)
		.where(
			and(
				eq(classSchedules.courseId, targetCourseId),
				eq(classSchedules.termId, termId),
			),
		);

	if (targetSchedules.length === 0) {
		return { hasConflict: false, conflicts: [] };
	}

	// Ambil seluruh mata kuliah yang saat ini sudah diambil mahasiswa pada periode ini
	const currentCourses = await getStudentCoursesForTerm(studentId, termId);
	const currentCourseIds = currentCourses.map((c) => c.courseId);

	if (currentCourseIds.length === 0) {
		return { hasConflict: false, conflicts: [] };
	}

	// Ambil seluruh jadwal yang sudah dimiliki mahasiswa
	const existingSchedules = await db
		.select({
			id: classSchedules.id,
			subject: classSchedules.subject,
			room: classSchedules.room,
			dayOfWeek: classSchedules.dayOfWeek,
			startTime: classSchedules.startTime,
			endTime: classSchedules.endTime,
			courseId: classSchedules.courseId,
		})
		.from(classSchedules)
		.where(
			and(
				inArray(classSchedules.courseId, currentCourseIds),
				eq(classSchedules.termId, termId),
			),
		);

	const conflicts: any[] = [];

	for (const target of targetSchedules) {
		for (const existing of existingSchedules) {
			if (existing.courseId === targetCourseId) continue;
			if (existing.dayOfWeek.toLowerCase() === target.dayOfWeek.toLowerCase()) {
				// Cek tumpang tindih waktu (start1 < end2 && end1 > start2)
				const isOverlap =
					target.startTime < existing.endTime &&
					target.endTime > existing.startTime;
				if (isOverlap) {
					conflicts.push({
						day: target.dayOfWeek,
						targetCourse: target.subject,
						targetTime: `${target.startTime} - ${target.endTime}`,
						existingCourse: existing.subject,
						existingTime: `${existing.startTime} - ${existing.endTime}`,
						room: target.room,
					});
				}
			}
		}
	}

	return {
		hasConflict: conflicts.length > 0,
		conflicts,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PENDAFTARAN KRS MASSAL DARI PAKET (Task 3.6)
// ─────────────────────────────────────────────────────────────────────────────

export async function enrollCohortRombelToPackage(params: {
	termId: number;
	cohort: number;
	rombel: string;
	semester: number;
	curriculumId: number;
	enrolledBy?: number;
}) {
	const { termId, cohort, rombel, semester, enrolledBy } = params;

	// Ambil seluruh mahasiswa aktif pada cohort dan rombel ini
	const targetStudents = await db
		.select()
		.from(students)
		.where(
			and(
				eq(students.cohort, cohort),
				eq(students.rombel, rombel),
				eq(students.isArchived, false),
			),
		);

	// Ambil kelas yang dibuka untuk paket semester ini di term terkait
	const openedClasses = await db
		.select()
		.from(courses)
		.where(
			and(
				eq(courses.termId, termId),
				eq(courses.cohort, cohort),
				eq(courses.rombel, rombel),
				eq(courses.semester, semester),
			),
		);

	let enrolledCount = 0;

	for (const s of targetStudents) {
		if (s.studentStatus === "cuti" || s.studentStatus === "lulus") continue;

		// Pastikan registrasi semester ada
		await db
			.insert(studentSemesterRegistrations)
			.values({
				studentId: s.id,
				termId,
				semester,
				status: s.studentStatus || "aktif",
				krsStatus: "disetujui",
			})
			.onConflictDoNothing();

		for (const c of openedClasses) {
			const existing = await db.query.courseEnrollments.findFirst({
				where: and(
					eq(courseEnrollments.courseId, c.id),
					eq(courseEnrollments.studentId, s.id),
				),
			});

			if (!existing) {
				await db.insert(courseEnrollments).values({
					courseId: c.id,
					studentId: s.id,
					termId,
					source: "paket",
					status: "aktif",
					addedBy: enrolledBy,
				});
				enrolledCount++;
			}
		}
	}

	return {
		totalStudents: targetStudents.length,
		totalClasses: openedClasses.length,
		enrolledCount,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PERGANTIAN SEMESTER (ROLLOVER DRY-RUN & EXECUTE) (Fase 5)
// ─────────────────────────────────────────────────────────────────────────────

export async function previewSemesterRollover(
	sourceTermId: number,
	targetTermId: number,
) {
	const sourceTerm = await getAcademicTermById(sourceTermId);
	const targetTerm = await getAcademicTermById(targetTermId);

	if (!sourceTerm || !targetTerm) {
		throw new Error("Periode akademik sumber atau tujuan tidak valid.");
	}

	const activeStudents = await db
		.select()
		.from(students)
		.where(
			and(eq(students.isArchived, false), eq(students.studentStatus, "aktif")),
		);

	// Periksa nilai yang belum terisi pada periode sumber
	const unassignedGrades = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(courseGrades)
		.where(
			and(
				eq(courseGrades.termId, sourceTermId),
				sql`${courseGrades.grade} IS NULL OR ${courseGrades.grade} = ''`,
			),
		);

	// Hitung proyeksi promosi per angkatan
	const promotionSummary: Record<
		string,
		{ currentSem: number; nextSem: number; count: number }
	> = {};
	for (const s of activeStudents) {
		const currentSem = s.currentSemester || 1;
		const nextSem = Math.min(6, currentSem + 1);
		const key = `Angkatan ${s.cohort} (Sem ${currentSem} -> ${nextSem})`;
		if (!promotionSummary[key]) {
			promotionSummary[key] = { currentSem, nextSem, count: 0 };
		}
		promotionSummary[key].count++;
	}

	return {
		sourceTerm: {
			id: sourceTerm.id,
			name: sourceTerm.name,
			status: sourceTerm.status,
		},
		targetTerm: {
			id: targetTerm.id,
			name: targetTerm.name,
			status: targetTerm.status,
		},
		totalStudentsToPromote: activeStudents.length,
		unassignedGradesCount: unassignedGrades[0]?.count || 0,
		promotionSummary,
		isReadyToClose: (unassignedGrades[0]?.count || 0) === 0,
	};
}

export async function executeSemesterRollover(
	sourceTermId: number,
	targetTermId: number,
	executedBy: number,
) {
	const sourceTerm = await getAcademicTermById(sourceTermId);
	const targetTerm = await getAcademicTermById(targetTermId);

	if (!sourceTerm || !targetTerm) {
		throw new Error("Periode sumber atau tujuan tidak ditemukan.");
	}

	console.log(
		`[Rollover] Memulai pergantian semester dari ${sourceTerm.name} ke ${targetTerm.name}...`,
	);

	// Log permulaan eksekusi
	const [logEntry] = await db
		.insert(semesterRolloverLogs)
		.values({
			sourceTermId,
			targetTermId,
			action: "execute",
			step: "started",
			status: "in_progress",
			executedBy,
		})
		.returning();

	try {
		// TAHAP 1: Kunci & Tutup Periode Sumber (Task 5.3)
		await db
			.update(academicTerms)
			.set({
				status: "ditutup",
				isActive: false,
				updatedAt: new Date(),
			})
			.where(eq(academicTerms.id, sourceTermId));

		// Kunci nilai periode sumber
		await db
			.update(courseGrades)
			.set({
				isLocked: true,
				lockedAt: new Date(),
				lockedBy: executedBy,
			})
			.where(eq(courseGrades.termId, sourceTermId));

		// TAHAP 2: Buka & Aktifkan Periode Tujuan (Task 5.5)
		await db
			.update(academicTerms)
			.set({
				status: "berjalan",
				isActive: true,
				updatedAt: new Date(),
			})
			.where(eq(academicTerms.id, targetTermId));

		// TAHAP 3: Kenaikan Semester Mahasiswa (Task 5.4)
		const activeStudents = await db
			.select()
			.from(students)
			.where(
				and(
					eq(students.isArchived, false),
					eq(students.studentStatus, "aktif"),
				),
			);

		let promotedCount = 0;
		for (const s of activeStudents) {
			const currentSem = s.currentSemester || 1;
			const nextSem = Math.min(6, currentSem + 1);

			// Update semester saat ini pada profil
			await db
				.update(students)
				.set({ currentSemester: nextSem })
				.where(eq(students.id, s.id));

			// Buat registrasi semester periode baru
			await db
				.insert(studentSemesterRegistrations)
				.values({
					studentId: s.id,
					termId: targetTermId,
					semester: nextSem,
					status: "aktif",
					krsStatus: "draft",
					sksTaken: 0,
					sksPassed: 0,
				})
				.onConflictDoNothing();

			promotedCount++;
		}

		// Log penyelesaian sukses
		await db
			.update(semesterRolloverLogs)
			.set({
				step: "completed",
				status: "success",
				summary: {
					sourceTermName: sourceTerm.name,
					targetTermName: targetTerm.name,
					promotedStudentsCount: promotedCount,
					closedAt: new Date().toISOString(),
				},
			})
			.where(eq(semesterRolloverLogs.id, logEntry.id));

		await cacheInvalidatePattern("cache:academic-term:*");
		await cacheInvalidatePattern("cache:student:*");

		console.log(
			`[Rollover] Selesai dengan sukses. ${promotedCount} mahasiswa naik semester.`,
		);

		return {
			success: true,
			sourceTerm: sourceTerm.name,
			targetTerm: targetTerm.name,
			promotedStudentsCount: promotedCount,
		};
	} catch (error: any) {
		console.error("[Rollover] Galat saat eksekusi rollover:", error);
		await db
			.update(semesterRolloverLogs)
			.set({
				step: "failed",
				status: "failed",
				errorDetails: error.message || String(error),
			})
			.where(eq(semesterRolloverLogs.id, logEntry.id));
		throw error;
	}
}
