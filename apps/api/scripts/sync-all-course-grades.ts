import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../src/db";
import {
	courseGrades,
	courseMeetingAttendances,
	courseMeetings,
	courses,
	students,
} from "../src/db/schema";

async function main() {
	console.log(
		"🔄 Synchronizing all course_grades with real meeting attendances...",
	);

	const allGrades = await db.query.courseGrades.findMany({
		with: {
			course: {
				with: {
					meetings: true,
				},
			},
		},
	});

	console.log(
		`Found ${allGrades.length} course_grades records to audit & synchronize.`,
	);

	let updatedCount = 0;

	for (const g of allGrades) {
		if (!g.courseId || !g.course) {
			continue;
		}

		const meetingIds = (g.course.meetings || []).map((m) => m.id);
		let realAtts: any[] = [];

		if (meetingIds.length > 0) {
			realAtts = await db.query.courseMeetingAttendances.findMany({
				where: and(
					eq(courseMeetingAttendances.studentId, g.studentId),
					inArray(courseMeetingAttendances.meetingId, meetingIds),
				),
			});
		}

		const presentCount = realAtts.filter(
			(a) => a.status === "hadir" || a.status === "susulan",
		).length;
		const totalMeetings = 16;
		const attendanceRate = Math.min(
			100,
			Math.round((presentCount / totalMeetings) * 100),
		);

		const validTheories = realAtts
			.filter((a) => a.theoryScore !== null && a.theoryScore !== undefined)
			.map((a) => a.theoryScore as number);
		const avgTheory =
			validTheories.length > 0
				? Math.round(
						validTheories.reduce((acc, curr) => acc + curr, 0) /
							validTheories.length,
					)
				: null;

		const validPracticals = realAtts
			.filter(
				(a) => a.practicalScore !== null && a.practicalScore !== undefined,
			)
			.map((a) => a.practicalScore as number);
		const avgPractical =
			validPracticals.length > 0
				? Math.round(
						validPracticals.reduce((acc, curr) => acc + curr, 0) /
							validPracticals.length,
					)
				: null;

		const isPracticalCourse = g.course.type === "praktik";
		let calculatedGrade: string | null = null;
		if (avgTheory !== null || avgPractical !== null) {
			const p = avgPractical ?? avgTheory ?? 0;
			const t = avgTheory ?? avgPractical ?? 0;
			const finalScore = isPracticalCourse ? Math.round(p * 0.8 + t * 0.2) : t;
			if (finalScore >= 85) calculatedGrade = "A";
			else if (finalScore >= 75) calculatedGrade = "B";
			else if (finalScore >= 65) calculatedGrade = "C";
			else if (finalScore >= 50) calculatedGrade = "D";
			else calculatedGrade = "E";
		}

		const newStatus =
			attendanceRate >= 90
				? "AMAN"
				: attendanceRate >= 75
					? "PERLU_PERHATIAN"
					: "TIDAK_AMAN";

		const newIsAcc = presentCount > 0 ? g.isAcc || false : false;

		// Check if update is needed
		const needsUpdate =
			g.attendancePresent !== presentCount ||
			g.totalMeetings !== totalMeetings ||
			g.attendanceRate !== attendanceRate ||
			g.theoryScore !== avgTheory ||
			g.practicalScore !== avgPractical ||
			g.grade !== calculatedGrade ||
			g.isAcc !== newIsAcc;

		if (needsUpdate) {
			await db
				.update(courseGrades)
				.set({
					attendancePresent: presentCount,
					totalMeetings: totalMeetings,
					attendanceRate: attendanceRate,
					theoryScore: avgTheory,
					practicalScore: avgPractical,
					grade: calculatedGrade,
					status: newStatus,
					isAcc: newIsAcc,
					updatedAt: new Date(),
				})
				.where(eq(courseGrades.id, g.id));
			updatedCount++;
		}
	}

	console.log(
		`✅ Synchronization completed. Updated ${updatedCount} course_grades records to match actual database attendance!`,
	);
	process.exit(0);
}

main().catch((err) => {
	console.error("Sync error:", err);
	process.exit(1);
});
