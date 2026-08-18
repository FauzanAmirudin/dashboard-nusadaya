import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../src/db";
import {
	courseMeetingActivities,
	courseMeetingAttendances,
	courseMeetings,
	courses,
} from "../src/db/schema";

async function main() {
	console.log("🛠️  Migrating database schema for courses & meetings...");

	// 1. Alter tables
	await db.execute(sql`
		ALTER TABLE course_meetings ADD COLUMN IF NOT EXISTS session_type text;
		ALTER TABLE course_meeting_attendances ADD COLUMN IF NOT EXISTS theory_score integer;
		ALTER TABLE course_meeting_attendances ADD COLUMN IF NOT EXISTS practical_score integer;
		ALTER TABLE course_meeting_attendances ALTER COLUMN status DROP NOT NULL;
	`);
	console.log("✅ Schema columns altered successfully.");

	// 2. Fetch all courses
	const allCourses = await db.query.courses.findMany();
	console.log(`Found ${allCourses.length} courses to restructure.`);

	for (const course of allCourses) {
		console.log(`Processing course [${course.code}] ${course.name}...`);

		// Fetch existing meetings
		const existingMeetings = await db.query.courseMeetings.findMany({
			where: eq(courseMeetings.courseId, course.id),
			orderBy: (meetings, { asc }) => [asc(meetings.meetingNumber)],
		});

		// Find invalid meetings (meetingNumber < 1 or meetingNumber > 16, or pkkmb/beginning)
		const meetingsToDelete = existingMeetings.filter(
			(m) =>
				m.meetingNumber < 1 ||
				m.meetingNumber > 16 ||
				m.meetingType === "pkkmb" ||
				m.meetingType === "beginning",
		);

		if (meetingsToDelete.length > 0) {
			const toDeleteIds = meetingsToDelete.map((m) => m.id);
			await db
				.delete(courseMeetingActivities)
				.where(inArray(courseMeetingActivities.meetingId, toDeleteIds));
			await db
				.delete(courseMeetingAttendances)
				.where(inArray(courseMeetingAttendances.meetingId, toDeleteIds));
			await db
				.delete(courseMeetings)
				.where(inArray(courseMeetings.id, toDeleteIds));
			console.log(
				`  - Cleaned up ${meetingsToDelete.length} obsolete meetings.`,
			);
		}

		// Re-fetch remaining valid meetings
		const validMeetings = await db.query.courseMeetings.findMany({
			where: eq(courseMeetings.courseId, course.id),
		});

		const meetingMap = new Map<number, (typeof validMeetings)[0]>();
		for (const m of validMeetings) {
			if (m.meetingNumber >= 1 && m.meetingNumber <= 16) {
				meetingMap.set(m.meetingNumber, m);
			}
		}

		// Ensure 1..16 are set accurately
		for (let i = 1; i <= 16; i++) {
			let mType: "regular" | "uts" | "uas" = "regular";
			let mLabel = `Pertemuan ${i}`;

			if (i === 8) {
				mType = "uts";
				mLabel = "Ujian Tengah Semester (UTS)";
			} else if (i === 16) {
				mType = "uas";
				mLabel = "Ujian Akhir Semester (UAS)";
			}

			const existing = meetingMap.get(i);
			if (existing) {
				await db
					.update(courseMeetings)
					.set({
						meetingType: mType,
						meetingLabel: mLabel,
						updatedAt: new Date(),
					})
					.where(eq(courseMeetings.id, existing.id));
			} else {
				await db.insert(courseMeetings).values({
					courseId: course.id,
					meetingNumber: i,
					meetingType: mType,
					meetingLabel: mLabel,
				});
			}
		}
		console.log(`  - Verified & synced 16 meetings for ${course.code}.`);
	}

	console.log(
		"🎉 All courses & meetings successfully migrated to 16 meetings (UTS=8, UAS=16)!",
	);
	process.exit(0);
}

main().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
