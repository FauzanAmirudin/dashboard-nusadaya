import { and, eq, gt, gte, inArray, isNull, lt, lte, or } from "drizzle-orm";
import { db } from "../src/db";
import {
	courseGrades,
	courseMeetingAttendances,
	courseMeetings,
	courses,
	students,
} from "../src/db/schema";

async function cleanAndSyncDatabase() {
	console.log("=== 1. REASSIGN ATTENDANCE ON NON-STANDARD MEETINGS ===");
	const nonStandardMeetings = await db.query.courseMeetings.findMany({
		where: or(
			lt(courseMeetings.meetingNumber, 1),
			gt(courseMeetings.meetingNumber, 16),
		),
	});
	console.log(
		`Found ${nonStandardMeetings.length} non-standard meetings (<1 or >16).`,
	);

	for (const nsm of nonStandardMeetings) {
		const atts = await db.query.courseMeetingAttendances.findMany({
			where: eq(courseMeetingAttendances.meetingId, nsm.id),
		});
		if (atts.length > 0) {
			console.log(
				`Meeting ${nsm.id} (course ${nsm.courseId}, num ${nsm.meetingNumber}) has ${atts.length} attendance records. Moving to Pertemuan 1...`,
			);
			const p1 = await db.query.courseMeetings.findFirst({
				where: and(
					eq(courseMeetings.courseId, nsm.courseId),
					eq(courseMeetings.meetingNumber, 1),
				),
			});
			if (p1) {
				for (const a of atts) {
					// Check if attendance already exists on P1 for this student
					const existingP1Att =
						await db.query.courseMeetingAttendances.findFirst({
							where: and(
								eq(courseMeetingAttendances.meetingId, p1.id),
								eq(courseMeetingAttendances.studentId, a.studentId),
							),
						});
					if (!existingP1Att) {
						await db
							.update(courseMeetingAttendances)
							.set({ meetingId: p1.id, updatedAt: new Date() })
							.where(eq(courseMeetingAttendances.id, a.id));
						console.log(
							`Reassigned attendance id ${a.id} (student ${a.studentId}) to P1 (meeting ${p1.id})`,
						);
					} else {
						await db
							.delete(courseMeetingAttendances)
							.where(eq(courseMeetingAttendances.id, a.id));
					}
				}
			}
		}
	}

	console.log("\n=== 2. DELETE NON-STANDARD MEETINGS (< 1 or > 16) ===");
	const deletedMeetings = await db
		.delete(courseMeetings)
		.where(
			or(
				lt(courseMeetings.meetingNumber, 1),
				gt(courseMeetings.meetingNumber, 16),
			),
		)
		.returning({ id: courseMeetings.id });
	console.log(
		`Deleted ${deletedMeetings.length} non-standard meetings. Each course now has strictly 16 meetings (1..16).`,
	);

	console.log("\n=== 3. CLEAN UP ORPHANED & MISMATCHED COURSE_GRADES ===");
	// First: Fix rows with courseId: null
	const nullGrades = await db.query.courseGrades.findMany({
		where: isNull(courseGrades.courseId),
	});
	console.log(`Found ${nullGrades.length} grades with courseId: null.`);

	for (const ng of nullGrades) {
		const student = await db.query.students.findFirst({
			where: eq(students.id, ng.studentId),
		});
		if (student && student.cohort) {
			const matchingCourse = await db.query.courses.findFirst({
				where: and(
					eq(courses.code, ng.courseCode),
					eq(courses.cohort, student.cohort),
				),
			});
			if (matchingCourse) {
				// Check if student already has a row for matchingCourse.id
				const existing = await db.query.courseGrades.findFirst({
					where: and(
						eq(courseGrades.studentId, student.id),
						eq(courseGrades.courseId, matchingCourse.id),
					),
				});
				if (existing) {
					console.log(
						`Deleting duplicate null row ${ng.id} for student ${student.id} course ${matchingCourse.id}`,
					);
					await db.delete(courseGrades).where(eq(courseGrades.id, ng.id));
				} else {
					console.log(
						`Linking null row ${ng.id} to course ${matchingCourse.id} (${matchingCourse.code})`,
					);
					await db
						.update(courseGrades)
						.set({
							courseId: matchingCourse.id,
							dosenId: matchingCourse.dosenId,
							courseName: matchingCourse.name,
							updatedAt: new Date(),
						})
						.where(eq(courseGrades.id, ng.id));
				}
			} else {
				console.log(
					`No matching course found for code ${ng.courseCode} cohort ${student.cohort}. Deleting row ${ng.id}...`,
				);
				await db.delete(courseGrades).where(eq(courseGrades.id, ng.id));
			}
		} else {
			await db.delete(courseGrades).where(eq(courseGrades.id, ng.id));
		}
	}

	// Remove mismatched cohort rows for students (e.g. student 10 having cohort 15 courses)
	const allStudents = await db.query.students.findMany();
	for (const s of allStudents) {
		const sGrades = await db.query.courseGrades.findMany({
			where: eq(courseGrades.studentId, s.id),
			with: { course: true },
		});

		for (const g of sGrades) {
			if (g.course && g.course.cohort !== s.cohort) {
				console.log(
					`Deleting mismatched cohort grade id ${g.id} for student ${s.id} (student cohort ${s.cohort} vs course cohort ${g.course.cohort})`,
				);
				await db.delete(courseGrades).where(eq(courseGrades.id, g.id));
			}
		}
	}

	// De-duplicate any multiple rows for same (studentId, courseId)
	const remainingGrades = await db.query.courseGrades.findMany();
	const seenPairs = new Set<string>();
	for (const g of remainingGrades) {
		if (g.courseId) {
			const key = `${g.studentId}_${g.courseId}`;
			if (seenPairs.has(key)) {
				console.log(
					`Deleting duplicate grade entry ${g.id} for student ${g.studentId} course ${g.courseId}`,
				);
				await db.delete(courseGrades).where(eq(courseGrades.id, g.id));
			} else {
				seenPairs.add(key);
			}
		}
	}

	console.log(
		"\n=== 4. RECALCULATE ALL COURSE_GRADES FROM REAL ATTENDANCES & SCORES ===",
	);
	const allValidCourses = await db.query.courses.findMany({
		with: {
			meetings: {
				where: and(
					gte(courseMeetings.meetingNumber, 1),
					lte(courseMeetings.meetingNumber, 16),
				),
			},
		},
	});

	for (const s of allStudents) {
		// Find courses for student's cohort
		const relevantCourses = allValidCourses.filter(
			(c) =>
				c.cohort === s.cohort &&
				(!c.rombel ||
					c.rombel.trim().toLowerCase() === "gabungan" ||
					!s.rombel ||
					c.rombel.trim().toLowerCase() === s.rombel.trim().toLowerCase()),
		);

		for (const c of relevantCourses) {
			const meetingIds = c.meetings.map((m) => m.id);
			let studentAtts: any[] = [];
			if (meetingIds.length > 0) {
				studentAtts = await db.query.courseMeetingAttendances.findMany({
					where: and(
						eq(courseMeetingAttendances.studentId, s.id),
						inArray(courseMeetingAttendances.meetingId, meetingIds),
					),
				});
			}

			const presentCount = studentAtts.filter(
				(a) => a.status === "hadir",
			).length;
			const totalMeetings = 16;
			const attendanceRate = Math.min(
				100,
				Math.round((presentCount / totalMeetings) * 100),
			);

			const validTheory = studentAtts
				.filter((a) => a.theoryScore !== null && a.theoryScore !== undefined)
				.map((a) => a.theoryScore as number);
			const avgTheory =
				validTheory.length > 0
					? Math.round(
							validTheory.reduce((acc, curr) => acc + curr, 0) /
								validTheory.length,
						)
					: null;

			const validPractical = studentAtts
				.filter(
					(a) => a.practicalScore !== null && a.practicalScore !== undefined,
				)
				.map((a) => a.practicalScore as number);
			const avgPractical =
				validPractical.length > 0
					? Math.round(
							validPractical.reduce((acc, curr) => acc + curr, 0) /
								validPractical.length,
						)
					: null;

			let calculatedGrade: string | null = null;
			if (avgTheory !== null || avgPractical !== null) {
				const isPractical = c.type === "praktik";
				const p = avgPractical ?? avgTheory ?? 0;
				const t = avgTheory ?? avgPractical ?? 0;
				const finalScore = isPractical ? Math.round(p * 0.8 + t * 0.2) : t;
				if (finalScore >= 85) calculatedGrade = "A";
				else if (finalScore >= 75) calculatedGrade = "B";
				else if (finalScore >= 65) calculatedGrade = "C";
				else if (finalScore >= 50) calculatedGrade = "D";
				else calculatedGrade = "E";
			}

			const status =
				attendanceRate >= 90
					? "AMAN"
					: attendanceRate >= 75
						? "PERLU_PERHATIAN"
						: "TIDAK_AMAN";

			const existingGrade = await db.query.courseGrades.findFirst({
				where: and(
					eq(courseGrades.studentId, s.id),
					eq(courseGrades.courseId, c.id),
				),
			});

			if (existingGrade) {
				await db
					.update(courseGrades)
					.set({
						courseCode: c.code,
						courseName: c.name,
						dosenId: c.dosenId,
						attendancePresent: presentCount,
						totalMeetings: 16,
						attendanceRate: attendanceRate,
						theoryScore: avgTheory,
						practicalScore: avgPractical,
						grade: calculatedGrade,
						status: status,
						isAcc: false, // Reset fake ACC to false
						updatedAt: new Date(),
					})
					.where(eq(courseGrades.id, existingGrade.id));
			} else {
				await db.insert(courseGrades).values({
					studentId: s.id,
					courseId: c.id,
					courseCode: c.code,
					courseName: c.name,
					dosenId: c.dosenId,
					attendancePresent: presentCount,
					totalMeetings: 16,
					attendanceRate: attendanceRate,
					theoryScore: avgTheory,
					practicalScore: avgPractical,
					grade: calculatedGrade,
					status: status,
					isAcc: false,
					updatedAt: new Date(),
				});
			}
		}
	}

	console.log("\n=== 5. VERIFICATION FOR STUDENT 10 (Ahmad Fauzan) ===");
	const s10Grades = await db.query.courseGrades.findMany({
		where: eq(courseGrades.studentId, 10),
		with: { course: true },
	});
	console.log(
		`Student 10 now has ${s10Grades.length} courses (expected: 6 courses for Cohort 14):`,
	);
	for (const g of s10Grades) {
		console.log({
			courseId: g.courseId,
			code: g.courseCode,
			name: g.courseName,
			present: g.attendancePresent,
			total: g.totalMeetings,
			rate: `${g.attendanceRate}%`,
			practical: g.practicalScore,
			theory: g.theoryScore,
			grade: g.grade,
			isAcc: g.isAcc,
		});
	}

	console.log(
		"\n✅ Database cleanup & synchronization completed successfully!",
	);
	process.exit(0);
}

cleanAndSyncDatabase().catch((e) => {
	console.error("Migration error:", e);
	process.exit(1);
});
