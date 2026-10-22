import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../../db";
import {
	academicData,
	academicDocuments,
	academicKhsTranscripts,
	auditLogs,
	courseEnrollments,
	courseGrades,
	courseMeetingAttendances,
	courseMeetings,
	courses,
	internshipData,
	internshipDocuments,
	students,
	users,
} from "../../db/schema";
import { cacheDel, cacheInvalidatePattern } from "../../lib/cache";

export interface GradeItem {
	courseId: number;
	code: string;
	name: string;
	sks: number;
	type: "teori" | "praktik";
	dosenId: number;
	dosenName?: string;
	rombel: string;
	attendancePresent: number;
	totalMeetings: number;
	attendanceRate: number;
	theoryScore: number;
	practicalScore: number;
	utsScore: number;
	uasScore: number;
	finalScore: number;
	grade: string;
	gradePoint: number; // scaled by 100: 400 for 4.00, etc.
	qualityScore: number; // sks * (gradePoint / 100)
	status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	isPassed: boolean;
}

export interface StudentAcademicSummary {
	studentId: number;
	nim: string;
	name: string;
	cohort: number;
	rombel: string;
	program: string;
	semester: number;
	totalCourses: number;
	totalSksTaken: number;
	totalSksPassed: number;
	qualityScoreTotal: number;
	gpa: number; // IPK scaled by 100
	gpaDisplay: string; // e.g. "3.75"
	allUtsPassed: boolean;
	allUasPassed: boolean;
	assignmentsCompleted: boolean;
	khsPublished: boolean;
	khsPublishedAt?: Date | null;
	syncedToMagang: boolean;
	syncedToMagangAt?: Date | null;
	pddiktiReported: boolean;
	pddiktiReportedAt?: Date | null;
	paName?: string;
	documentNo?: string;
	grades: GradeItem[];
}

/**
 * Konversi Skor Akhir (0-100) ke Huruf Mutu dan Bobot Indeks (skala 100: 4.00 -> 400)
 */
export function convertScoreToGrade(score: number): {
	grade: string;
	gradePoint: number;
	isPassed: boolean;
} {
	if (score >= 85) return { grade: "A", gradePoint: 400, isPassed: true };
	if (score >= 80) return { grade: "A-", gradePoint: 375, isPassed: true };
	if (score >= 75) return { grade: "B+", gradePoint: 350, isPassed: true };
	if (score >= 70) return { grade: "B", gradePoint: 300, isPassed: true };
	if (score >= 65) return { grade: "B-", gradePoint: 275, isPassed: true };
	if (score >= 60) return { grade: "C+", gradePoint: 250, isPassed: true };
	if (score >= 55) return { grade: "C", gradePoint: 200, isPassed: true };
	if (score >= 40) return { grade: "D", gradePoint: 100, isPassed: false };
	return { grade: "E", gradePoint: 0, isPassed: false };
}

export class GradeCalculationService {
	/**
	 * Hitung nilai akhir otomatis untuk 1 mahasiswa dari seluruh komponen perkuliahan pertemuan 1-16
	 */
	static async calculateStudentGrades(
		studentId: number,
		targetSemester: number = 1,
	): Promise<StudentAcademicSummary> {
		const student = await db.query.students.findFirst({
			where: eq(students.id, studentId),
		});
		if (!student) throw new Error(`Mahasiswa ID ${studentId} tidak ditemukan`);

		// Ambil seluruh mata kuliah relevan untuk kohort dan rombel mahasiswa
		const allRelevantCourses = await db.query.courses.findMany({
			where: eq(courses.cohort, student.cohort),
			with: {
				dosen: { columns: { fullName: true } },
				meetings: {
					where: and(
						gte(courseMeetings.meetingNumber, 1),
						lte(courseMeetings.meetingNumber, 16),
					),
				},
			},
		});

		// Filter sesuai rombel jika mata kuliah terikat rombel tertentu
		let relevantCourses = allRelevantCourses.filter((c) => {
			if (
				!c.rombel ||
				c.rombel.toLowerCase() === "gabungan" ||
				c.rombel.toLowerCase() === "semua"
			)
				return true;
			if (!student.rombel) return true;
			return (
				c.rombel.trim().toLowerCase() === student.rombel.trim().toLowerCase()
			);
		});

		// Fallback: Jika tidak ada mata kuliah yang cocok dengan rombel spesifik (misal nama kelas kustom),
		// gunakan seluruh mata kuliah kurikulum angkatan tersebut
		if (relevantCourses.length === 0 && allRelevantCourses.length > 0) {
			relevantCourses = allRelevantCourses;
		}

		// Tambahkan juga mata kuliah custom enrollments (lintas angkatan)
		const customEnrollments = await db.query.courseEnrollments.findMany({
			where: eq(courseEnrollments.studentId, studentId),
			with: {
				course: {
					with: {
						dosen: { columns: { fullName: true } },
						meetings: {
							where: and(
								gte(courseMeetings.meetingNumber, 1),
								lte(courseMeetings.meetingNumber, 16),
							),
						},
					},
				},
			},
		});

		const customCourses = customEnrollments
			.map((e) => e.course)
			.filter((c): c is NonNullable<typeof c> => c !== null && c !== undefined);

		const courseIdSet = new Set(relevantCourses.map((c) => c.id));
		for (const cc of customCourses) {
			if (!courseIdSet.has(cc.id)) {
				relevantCourses.push(cc as any);
				courseIdSet.add(cc.id);
			}
		}

		const gradesResult: GradeItem[] = [];
		let totalQualityPoints = 0;
		let totalSksTaken = 0;
		let totalSksPassed = 0;
		let countUtsUnderStandard = 0;
		let countUasUnderStandard = 0;
		let totalTheoryAvgSum = 0;
		let evaluatedTheoryCount = 0;

		for (const course of relevantCourses) {
			const meetingIds = (course.meetings || []).map((m) => m.id);
			let attendances: any[] = [];
			if (meetingIds.length > 0) {
				attendances = await db.query.courseMeetingAttendances.findMany({
					where: and(
						eq(courseMeetingAttendances.studentId, studentId),
						inArray(courseMeetingAttendances.meetingId, meetingIds),
					),
				});
			}

			// 1. Presensi (Pertemuan 1 - 16)
			const presentCount = attendances.filter(
				(a) => a.status === "hadir",
			).length;
			const totalMeetings = 16;
			const attendanceRate = Math.min(
				100,
				Math.round((presentCount / totalMeetings) * 100),
			);

			// 2. Evaluasi UTS (Pertemuan 8 / meetingType == 'uts')
			const utsMeeting = course.meetings.find(
				(m) => m.meetingNumber === 8 || m.meetingType === "uts",
			);
			const utsAtt = utsMeeting
				? attendances.find((a) => a.meetingId === utsMeeting.id)
				: null;
			let utsScore = 0;
			if (utsAtt) {
				utsScore =
					utsAtt.practicalScore ??
					utsAtt.theoryScore ??
					(utsAtt.status === "hadir" ? 75 : 0);
			}

			// 3. Evaluasi UAS (Pertemuan 16 / meetingType == 'uas')
			const uasMeeting = course.meetings.find(
				(m) => m.meetingNumber === 16 || m.meetingType === "uas",
			);
			const uasAtt = uasMeeting
				? attendances.find((a) => a.meetingId === uasMeeting.id)
				: null;
			let uasScore = 0;
			if (uasAtt) {
				uasScore =
					uasAtt.practicalScore ??
					uasAtt.theoryScore ??
					(uasAtt.status === "hadir" ? 75 : 0);
			}

			// 4. Rata-rata Teori & Tugas (Reguler di luar UTS & UAS)
			const regularTheoryAttendances = attendances.filter(
				(a) =>
					(!utsMeeting || a.meetingId !== utsMeeting.id) &&
					(!uasMeeting || a.meetingId !== uasMeeting.id) &&
					a.theoryScore !== null &&
					a.theoryScore !== undefined,
			);
			const theoryScores = regularTheoryAttendances.map(
				(a) => a.theoryScore as number,
			);
			const avgTheory =
				theoryScores.length > 0
					? Math.round(
							theoryScores.reduce((acc, curr) => acc + curr, 0) /
								theoryScores.length,
						)
					: 0;

			// 5. Rata-rata Praktik / Unjuk Kerja (Reguler di luar UTS & UAS)
			const regularPracticalAttendances = attendances.filter(
				(a) =>
					(!utsMeeting || a.meetingId !== utsMeeting.id) &&
					(!uasMeeting || a.meetingId !== uasMeeting.id) &&
					a.practicalScore !== null &&
					a.practicalScore !== undefined,
			);
			const practicalScores = regularPracticalAttendances.map(
				(a) => a.practicalScore as number,
			);
			const avgPractical =
				practicalScores.length > 0
					? Math.round(
							practicalScores.reduce((acc, curr) => acc + curr, 0) /
								practicalScores.length,
						)
					: 0;

			// Fallback cerdas: Jika belum ada skor UTS/UAS eksplisit, gunakan rata-rata teori/praktik yang ada
			const effectiveUts =
				utsScore > 0 ? utsScore : Math.max(avgTheory, avgPractical, 70);
			const effectiveUas =
				uasScore > 0 ? uasScore : Math.max(avgTheory, avgPractical, 70);
			const effectiveTheory =
				avgTheory > 0
					? avgTheory
					: course.type === "praktik"
						? avgPractical
						: 70;
			const effectivePractical = avgPractical > 0 ? avgPractical : avgTheory;

			// 6. Formula Pembobotan Vokasi Nusadaya (AKD-06):
			// - Praktik: Presensi 10% + Teori 20% + Praktik 40% + UTS 15% + UAS 15%
			// - Teori:   Presensi 15% + Teori/Tugas 25% + UTS 30% + UAS 30%
			let finalScore = 0;
			if (course.type === "praktik") {
				finalScore = Math.round(
					attendanceRate * 0.1 +
						effectiveTheory * 0.2 +
						effectivePractical * 0.4 +
						effectiveUts * 0.15 +
						effectiveUas * 0.15,
				);
			} else {
				finalScore = Math.round(
					attendanceRate * 0.15 +
						effectiveTheory * 0.25 +
						effectiveUts * 0.3 +
						effectiveUas * 0.3,
				);
			}

			// Batas sanitasi skor 0 - 100
			finalScore = Math.max(0, Math.min(100, finalScore));

			const { grade, gradePoint, isPassed } = convertScoreToGrade(finalScore);
			const sks = course.sks || 2;
			const qualityScore = sks * (gradePoint / 100);

			totalSksTaken += sks;
			if (isPassed) totalSksPassed += sks;
			totalQualityPoints += qualityScore;

			if (effectiveUts < 60) countUtsUnderStandard++;
			if (effectiveUas < 60) countUasUnderStandard++;
			if (avgTheory > 0) {
				totalTheoryAvgSum += avgTheory;
				evaluatedTheoryCount++;
			}

			const courseStatus =
				attendanceRate >= 90 && isPassed
					? "AMAN"
					: attendanceRate >= 75
						? "PERLU_PERHATIAN"
						: "TIDAK_AMAN";

			const gradeItem: GradeItem = {
				courseId: course.id,
				code: course.code,
				name: course.name,
				sks,
				type: course.type as "teori" | "praktik",
				dosenId: course.dosenId,
				dosenName: (course as any).dosen?.fullName || "Dosen Pengampu",
				rombel: course.rombel,
				attendancePresent: presentCount,
				totalMeetings: 16,
				attendanceRate,
				theoryScore: effectiveTheory,
				practicalScore: effectivePractical,
				utsScore: effectiveUts,
				uasScore: effectiveUas,
				finalScore,
				grade,
				gradePoint,
				qualityScore,
				status: courseStatus,
				isPassed,
			};

			gradesResult.push(gradeItem);

			// Upsert ke courseGrades di database
			const existingGrade = await db.query.courseGrades.findFirst({
				where: and(
					eq(courseGrades.studentId, studentId),
					eq(courseGrades.courseId, course.id),
				),
			});

			if (existingGrade) {
				await db
					.update(courseGrades)
					.set({
						courseCode: course.code,
						courseName: course.name,
						dosenId: course.dosenId,
						sks,
						attendancePresent: presentCount,
						totalMeetings: 16,
						attendanceRate,
						theoryScore: effectiveTheory,
						practicalScore: effectivePractical,
						utsScore: effectiveUts,
						uasScore: effectiveUas,
						finalScore,
						grade,
						gradePoint,
						semester: targetSemester,
						status: courseStatus,
						updatedAt: new Date(),
					})
					.where(eq(courseGrades.id, existingGrade.id));
			} else {
				await db.insert(courseGrades).values({
					studentId,
					courseId: course.id,
					courseCode: course.code,
					courseName: course.name,
					dosenId: course.dosenId,
					sks,
					attendancePresent: presentCount,
					totalMeetings: 16,
					attendanceRate,
					theoryScore: effectiveTheory,
					practicalScore: effectivePractical,
					utsScore: effectiveUts,
					uasScore: effectiveUas,
					finalScore,
					grade,
					gradePoint,
					semester: targetSemester,
					status: courseStatus,
					isAcc: false,
					updatedAt: new Date(),
				});
			}
		}

		// Hitung Indeks Prestasi Kumulatif (IPK)
		const calculatedGpa =
			totalSksTaken > 0
				? Math.round((totalQualityPoints / totalSksTaken) * 100)
				: 0;

		const allUtsPassed = countUtsUnderStandard === 0;
		const allUasPassed = countUasUnderStandard === 0;
		const assignmentsCompleted =
			evaluatedTheoryCount === 0 ||
			totalTheoryAvgSum / evaluatedTheoryCount >= 65;

		// Ambil status academic_data saat ini
		const currentAcademic = await db.query.academicData.findFirst({
			where: eq(academicData.studentId, studentId),
		});

		const academicUpdates: Record<string, any> = {
			gpa: calculatedGpa,
			creditsCompleted: totalSksPassed,
			utsPassed: allUtsPassed,
			uasPassed: allUasPassed,
			assignmentsCompleted,
			updatedAt: new Date(),
		};

		if (!currentAcademic) {
			await db.insert(academicData).values({
				studentId,
				...academicUpdates,
				pddiktiInput: false,
				status: calculatedGpa >= 275 ? "AMAN" : "PERLU_PERHATIAN",
			});
		} else {
			await db
				.update(academicData)
				.set(academicUpdates)
				.where(eq(academicData.studentId, studentId));
		}

		// Bersihkan cache terkait
		await Promise.all([
			cacheDel(`cache:student:${studentId}`),
			cacheInvalidatePattern("cache:students:list:*"),
			cacheInvalidatePattern("cache:mahasiswa:*"),
		]);

		let paName = "Dosen Pembimbing Akademik";
		if (student.paId) {
			const paUser = await db.query.users.findFirst({
				where: eq(users.id, student.paId),
				columns: { fullName: true },
			});
			if (paUser?.fullName) {
				paName = paUser.fullName;
			}
		}

		const year = new Date().getFullYear();
		const docNumber = `KHS/NUSADAYA/${year}/A${student.cohort}/${student.nim || student.id}`;

		return {
			studentId: student.id,
			nim: student.nim || "-",
			name: student.name,
			cohort: student.cohort,
			rombel: student.rombel || "Kelas A",
			program: student.program || "Hospitality",
			semester: targetSemester,
			documentNo: docNumber,
			paName,
			totalCourses: relevantCourses.length,
			totalSksTaken,
			totalSksPassed,
			qualityScoreTotal: totalQualityPoints,
			gpa: calculatedGpa,
			gpaDisplay: (calculatedGpa / 100).toFixed(2),
			allUtsPassed,
			allUasPassed,
			assignmentsCompleted,
			khsPublished: currentAcademic?.khsPublished ?? false,
			khsPublishedAt: currentAcademic?.khsPublishedAt,
			syncedToMagang: currentAcademic?.syncedToMagang ?? false,
			syncedToMagangAt: currentAcademic?.syncedToMagangAt,
			pddiktiReported: currentAcademic?.pddiktiReported ?? false,
			pddiktiReportedAt: currentAcademic?.pddiktiReportedAt,
			grades: gradesResult,
		};
	}

	/**
	 * AKD-06: Hitung Transkrip Nilai Kumulatif Mahasiswa Keseluruhan Masa Studi
	 */
	static async calculateStudentTranscript(studentId: number) {
		const student = await db.query.students.findFirst({
			where: eq(students.id, studentId),
		});
		if (!student) throw new Error(`Mahasiswa ID ${studentId} tidak ditemukan`);

		// Pastikan nilai terhitung terkini dari semester berjalan
		await GradeCalculationService.calculateStudentGrades(studentId, 1);

		// Ambil seluruh course_grades mahasiswa ini dari seluruh semester yang pernah ditempuh
		const allGrades = await db.query.courseGrades.findMany({
			where: eq(courseGrades.studentId, studentId),
			orderBy: [asc(courseGrades.semester), asc(courseGrades.courseCode)],
		});

		let totalQualityPoints = 0;
		let totalSksTaken = 0;
		let totalSksPassed = 0;

		const transcriptItems = allGrades.map((g, idx) => {
			const sks = g.sks || 2;
			const finalScore = g.finalScore ?? 0;
			const { grade, gradePoint, isPassed } = convertScoreToGrade(finalScore);
			const qualityScore = sks * (gradePoint / 100);

			totalSksTaken += sks;
			if (isPassed) totalSksPassed += sks;
			totalQualityPoints += qualityScore;

			return {
				no: idx + 1,
				courseId: g.courseId,
				code: g.courseCode,
				name: g.courseName,
				sks,
				semester: g.semester || 1,
				finalScore,
				grade: g.grade || grade,
				gradePoint,
				qualityScore,
				isPassed,
			};
		});

		const calculatedGpa =
			totalSksTaken > 0
				? Math.round((totalQualityPoints / totalSksTaken) * 100)
				: 0;
		const gpaNum = calculatedGpa / 100;

		let predikat = "MEMUASKAN";
		if (gpaNum >= 3.51) {
			predikat = "DENGAN PUJIAN (CUMLAUDE)";
		} else if (gpaNum >= 3.0) {
			predikat = "SANGAT MEMUASKAN";
		}

		let paName = "Dosen Pembimbing Akademik";
		if (student.paId) {
			const paUser = await db.query.users.findFirst({
				where: eq(users.id, student.paId),
				columns: { fullName: true },
			});
			if (paUser?.fullName) {
				paName = paUser.fullName;
			}
		}

		const year = new Date().getFullYear();
		const documentNo = `TRX/NUSADAYA/${year}/A${student.cohort}/${student.nim || student.id}`;

		return {
			studentId: student.id,
			nim: student.nim || "-",
			name: student.name,
			cohort: student.cohort,
			rombel: student.rombel || "Kelas A",
			program: student.program || "Hospitality",
			documentNo,
			paName,
			totalCourses: transcriptItems.length,
			totalSksTaken,
			totalSksPassed,
			qualityScoreTotal: totalQualityPoints,
			gpa: calculatedGpa,
			gpaDisplay: gpaNum.toFixed(2),
			predikatKelulusan: predikat,
			grades: transcriptItems,
		};
	}

	/**
	 * Hitung nilai akhir massal (batch) untuk seluruh mahasiswa dalam kohort / rombel
	 */
	static async calculateCohortGrades(cohort: number, rombel?: string) {
		const allStudents = await db.query.students.findMany({
			where: eq(students.cohort, cohort),
		});

		const filtered =
			rombel && rombel !== "all"
				? allStudents.filter((s) => s.rombel === rombel)
				: allStudents;

		const results: StudentAcademicSummary[] = [];
		for (const s of filtered) {
			const res = await GradeCalculationService.calculateStudentGrades(s.id);
			results.push(res);
		}

		return {
			cohort,
			rombel: rombel || "Semua",
			totalProcessed: results.length,
			results,
		};
	}

	/**
	 * Terbitkan dokumen KHS / Transkrip resmi dengan penomoran dokumen baku Nusadaya
	 */
	static async publishKhsDocument(
		studentId: number,
		semester: number = 1,
		publishedBy?: number,
	) {
		// Hitung ulang nilai agar snapshot terbaru
		const summary = await GradeCalculationService.calculateStudentGrades(
			studentId,
			semester,
		);

		// Format penomoran dokumen: KHS/NUSADAYA/{Tahun}/{Angkatan}/{NIM}
		const year = new Date().getFullYear();
		const docNumber = `KHS/NUSADAYA/${year}/A${summary.cohort}/${summary.nim || summary.studentId}`;

		// Validasi apakah user ID ada di tabel users
		let validPublisherId: number | null = null;
		if (publishedBy) {
			const u = await db.query.users.findFirst({
				where: eq(users.id, publishedBy),
				columns: { id: true },
			});
			if (u) validPublisherId = u.id;
		}

		// Buat snapshot di academic_khs_transcripts
		const [khsRecord] = await db
			.insert(academicKhsTranscripts)
			.values({
				studentId,
				type: "khs",
				semester,
				academicYear: `${year}/${year + 1}`,
				documentNumber: docNumber,
				totalSks: summary.totalSksTaken,
				gpa: summary.gpa,
				ips: summary.gpa,
				gradesSnapshot: summary.grades,
				status: "published",
				publishedBy: validPublisherId,
				publishedAt: new Date(),
			})
			.returning();

		// Update flag di academic_data
		await db
			.update(academicData)
			.set({
				khsPublished: true,
				khsPublishedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(academicData.studentId, studentId));

		// Update flag di course_grades
		await db
			.update(courseGrades)
			.set({
				isPublished: true,
				publishedAt: new Date(),
			})
			.where(eq(courseGrades.studentId, studentId));

		// Catat audit log
		await db.insert(auditLogs).values({
			userId: validPublisherId,
			action: "PUBLISH_KHS",
			entity: "student",
			entityId: studentId,
			details: {
				documentNumber: docNumber,
				semester,
				gpa: summary.gpaDisplay,
				totalSks: summary.totalSksTaken,
			},
		});

		// Tambahkan juga ke academic_documents agar tersimpan sebagai arsip resmi
		await db.insert(academicDocuments).values({
			studentId,
			documentKey: "khs",
			fileName: `KHS_Resmi_Semester_${semester}_${summary.nim}.pdf`,
			fileUrl: `/api/students/${studentId}/academic/khs/download?semester=${semester}`,
			mimeType: "application/pdf",
			isVerified: true,
			verifiedAt: new Date(),
			verifiedBy: validPublisherId,
		});

		return {
			success: true,
			documentNumber: docNumber,
			publishedAt: khsRecord.publishedAt,
			summary,
		};
	}

	/**
	 * Sinkronisasi KHS, KRS & Transkrip ke Modul Magang (Segmen 19)
	 * Otomatis memvalidasi berkas pra-paspor tanpa perlu upload scan manual
	 */
	static async syncKhsToMagang(studentId: number, adminId?: number) {
		const student = await db.query.students.findFirst({
			where: eq(students.id, studentId),
		});
		if (!student) throw new Error("Mahasiswa tidak ditemukan");

		let validAdminId: number | null = null;
		if (adminId) {
			const u = await db.query.users.findFirst({
				where: eq(users.id, adminId),
				columns: { id: true },
			});
			if (u) validAdminId = u.id;
		}

		// Pastikan nilai sudah terhitung
		const summary =
			await GradeCalculationService.calculateStudentGrades(studentId);

		// 1. Update internship_data secara atomik
		const existingInternship = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, studentId),
		});

		if (existingInternship) {
			await db
				.update(internshipData)
				.set({
					praPasporKhs: true,
					praPasporKrs: true,
					praPasporTranskrip: true,
				})
				.where(eq(internshipData.studentId, studentId));
		} else {
			await db.insert(internshipData).values({
				studentId,
				praPasporKhs: true,
				praPasporKrs: true,
				praPasporTranskrip: true,
			});
		}

		// 2. Hubungkan ke internship_documents jika belum ada
		const existingInternDocs = await db.query.internshipDocuments.findMany({
			where: eq(internshipDocuments.studentId, studentId),
		});

		const internDocKeys = new Set(existingInternDocs.map((d) => d.documentKey));

		if (!internDocKeys.has("khs")) {
			await db.insert(internshipDocuments).values({
				studentId,
				documentKey: "khs",
				fileName: `KHS_Akademik_Tersinkron_${student.nim || studentId}.pdf`,
				fileUrl: `/api/students/${studentId}/academic/khs/download`,
				isVerified: true,
				verifiedAt: new Date(),
				verifiedBy: validAdminId,
			});
		}

		if (!internDocKeys.has("transkrip")) {
			await db.insert(internshipDocuments).values({
				studentId,
				documentKey: "transkrip",
				fileName: `Transkrip_Akademik_Tersinkron_${student.nim || studentId}.pdf`,
				fileUrl: `/api/students/${studentId}/academic/transkrip/download`,
				isVerified: true,
				verifiedAt: new Date(),
				verifiedBy: validAdminId,
			});
		}

		// 3. Update flag di academic_data
		await db
			.update(academicData)
			.set({
				syncedToMagang: true,
				syncedToMagangAt: new Date(),
				syncedToMagangBy: validAdminId,
				updatedAt: new Date(),
			})
			.where(eq(academicData.studentId, studentId));

		// 4. Update status di course_grades
		await db
			.update(courseGrades)
			.set({
				syncedToMagang: true,
				syncedToMagangAt: new Date(),
			})
			.where(eq(courseGrades.studentId, studentId));

		// Catat ke audit log
		await db.insert(auditLogs).values({
			userId: validAdminId,
			action: "SYNC_KHS_TO_MAGANG",
			entity: "student",
			entityId: studentId,
			details: {
				nim: student.nim,
				gpa: summary.gpaDisplay,
				totalSks: summary.totalSksTaken,
				praPasporKhs: true,
				praPasporKrs: true,
				praPasporTranskrip: true,
			},
		});

		await Promise.all([
			cacheDel(`cache:student:${studentId}`),
			cacheInvalidatePattern("cache:students:list:*"),
		]);

		return {
			success: true,
			message: "KHS, KRS & Transkrip berhasil disinkronkan ke Modul Magang",
			syncedAt: new Date(),
			summary,
		};
	}

	/**
	 * Sinkronisasi Massal (Batch) Seluruh Mahasiswa Kohort ke Modul Magang
	 */
	static async syncAllToMagang(cohort: number, adminId?: number) {
		const allStudents = await db.query.students.findMany({
			where: eq(students.cohort, cohort),
		});

		const results: any[] = [];
		for (const s of allStudents) {
			try {
				const res = await GradeCalculationService.syncKhsToMagang(
					s.id,
					adminId,
				);
				results.push({ studentId: s.id, name: s.name, success: true });
			} catch (err: any) {
				results.push({
					studentId: s.id,
					name: s.name,
					success: false,
					error: err.message,
				});
			}
		}

		return {
			cohort,
			totalProcessed: allStudents.length,
			syncedCount: results.filter((r) => r.success).length,
			results,
		};
	}

	/**
	 * Ekspor data format Neo Feeder PDDIKTI (Segmen 14)
	 * Jenis template:
	 * - 'krs': Kartu Rencana Studi (Aktivitas Kuliah Mahasiswa)
	 * - 'khs': Nilai Perkuliahan Semester
	 * - 'kelulusan': Rekapitulasi SKS & Status Kelulusan PDDIKTI
	 */
	static async exportPddiktiData(
		cohort?: number,
		exportType: "krs" | "khs" | "kelulusan" = "khs",
	) {
		const studentsQuery = cohort ? eq(students.cohort, cohort) : undefined;

		const studentList = await db.query.students.findMany({
			where: studentsQuery,
		});

		const studentIds = studentList.map((s) => s.id);
		let allGrades: any[] = [];
		let allAcademic: any[] = [];

		if (studentIds.length > 0) {
			[allGrades, allAcademic] = await Promise.all([
				db.query.courseGrades.findMany({
					where: inArray(courseGrades.studentId, studentIds),
				}),
				db.query.academicData.findMany({
					where: inArray(academicData.studentId, studentIds),
				}),
			]);
		}

		const gradesByStudent = new Map<number, any[]>();
		for (const g of allGrades) {
			if (!gradesByStudent.has(g.studentId))
				gradesByStudent.set(g.studentId, []);
			gradesByStudent.get(g.studentId)!.push(g);
		}

		const academicByStudent = new Map<number, any>();
		for (const a of allAcademic) {
			academicByStudent.set(a.studentId, a);
		}

		if (exportType === "krs") {
			const headers = [
				"NIM",
				"Nama Mahasiswa",
				"Angkatan",
				"Rombel",
				"Kode Program Studi",
				"Semester",
				"Kode Mata Kuliah",
				"Nama Mata Kuliah",
				"Bobot SKS",
			];

			const rows: string[][] = [];
			for (const s of studentList) {
				const grades = gradesByStudent.get(s.id) || [];
				for (const g of grades) {
					rows.push([
						`"${s.nim || s.id}"`,
						`"${s.name}"`,
						`"${s.cohort}"`,
						`"${s.rombel || "Kelas A"}"`,
						`"${s.program || "HOSPITALITY"}"`,
						`"${g.semester || 1}"`,
						`"${g.courseCode}"`,
						`"${g.courseName}"`,
						`"${g.sks || 2}"`,
					]);
				}
			}

			const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
				"\n",
			);
			return {
				type: "krs",
				filename: `FEEDER_PDDIKTI_KRS_A${cohort || "SEMUA"}.csv`,
				csv,
			};
		}

		if (exportType === "kelulusan") {
			const headers = [
				"NIM",
				"Nama Mahasiswa",
				"Angkatan",
				"Program Studi",
				"Total SKS Ditempuh",
				"Total SKS Lulus",
				"IPK Kumulatif",
				"Status Mahasiswa",
				"Status PDDIKTI",
			];

			const rows = studentList.map((s) => {
				const acad = academicByStudent.get(s.id);
				const gpaVal = acad?.gpa ? (acad.gpa / 100).toFixed(2) : "0.00";
				return [
					`"${s.nim || s.id}"`,
					`"${s.name}"`,
					`"${s.cohort}"`,
					`"${s.program || "Hospitality"}"`,
					`"${acad?.creditsCompleted || 0}"`,
					`"${acad?.creditsCompleted || 0}"`,
					`"${gpaVal}"`,
					`"${(s.studentStatus || "aktif").toUpperCase()}"`,
					`"${acad?.pddiktiInput ? "TERLAPOR" : "BELUM"}"`,
				];
			});

			const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
				"\n",
			);
			return {
				type: "kelulusan",
				filename: `FEEDER_PDDIKTI_KELULUSAN_A${cohort || "SEMUA"}.csv`,
				csv,
			};
		}

		// Default: 'khs' (Nilai Perkuliahan)
		const headers = [
			"NIM",
			"Nama Mahasiswa",
			"Angkatan",
			"Semester",
			"Kode Mata Kuliah",
			"Nama Mata Kuliah",
			"SKS",
			"Nilai Angka",
			"Nilai Huruf",
			"Bobot Indeks",
			"Status Kelulusan",
		];

		const rows: string[][] = [];
		for (const s of studentList) {
			const grades = gradesByStudent.get(s.id) || [];
			for (const g of grades) {
				const isPassed = (g.gradePoint ?? 0) >= 200;
				rows.push([
					`"${s.nim || s.id}"`,
					`"${s.name}"`,
					`"${s.cohort}"`,
					`"${g.semester || 1}"`,
					`"${g.courseCode}"`,
					`"${g.courseName}"`,
					`"${g.sks || 2}"`,
					`"${g.finalScore ?? g.practicalScore ?? 0}"`,
					`"${g.grade || "E"}"`,
					`"${((g.gradePoint ?? 0) / 100).toFixed(2)}"`,
					`"${isPassed ? "LULUS" : "TIDAK LULUS"}"`,
				]);
			}
		}

		const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
		return {
			type: "khs",
			filename: `FEEDER_PDDIKTI_KHS_NILAI_A${cohort || "SEMUA"}.csv`,
			csv,
		};
	}
}
