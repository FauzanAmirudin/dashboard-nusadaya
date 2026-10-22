import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../src/db";
import {
	courseMeetingActivities,
	courseMeetingAttendances,
	courseMeetings,
	courses,
} from "../src/db/schema";

async function main() {
	console.log(
		"🛠️  Normalizing database courses & meetings structure (strictly 16 meetings)...",
	);

	// 1. Ensure table schema columns exist
	await db.execute(sql`
		ALTER TABLE course_meetings ADD COLUMN IF NOT EXISTS session_type text;
		ALTER TABLE course_meeting_attendances ADD COLUMN IF NOT EXISTS theory_score integer;
		ALTER TABLE course_meeting_attendances ADD COLUMN IF NOT EXISTS practical_score integer;
		ALTER TABLE course_meeting_attendances ALTER COLUMN status DROP NOT NULL;
	`);
	console.log("✅ Schema columns verified.");

	// 2. Fetch all courses
	const allCourses = await db.query.courses.findMany({
		orderBy: (courses, { asc }) => [asc(courses.id)],
	});
	console.log(`Found ${allCourses.length} courses to check/restructure.\n`);

	let modifiedCount = 0;

	for (const course of allCourses) {
		const existingMeetings = await db.query.courseMeetings.findMany({
			where: eq(courseMeetings.courseId, course.id),
			orderBy: (meetings, { asc }) => [asc(meetings.meetingNumber)],
		});

		// Check if meetings are already strictly 1..16 with 8=uts, 16=uas
		const isAlreadyClean =
			existingMeetings.length === 16 &&
			existingMeetings.every((m, idx) => {
				const expectedNumber = idx + 1;
				if (m.meetingNumber !== expectedNumber) return false;
				if (expectedNumber === 8 && m.meetingType !== "uts") return false;
				if (expectedNumber === 16 && m.meetingType !== "uas") return false;
				if (
					expectedNumber !== 8 &&
					expectedNumber !== 16 &&
					m.meetingType !== "regular"
				)
					return false;
				return true;
			});

		if (isAlreadyClean) {
			console.log(
				`✓ Course [${course.id}] ${course.code} - ${course.name}: Already 16 standard meetings.`,
			);
			continue;
		}

		modifiedCount++;
		console.log(
			`⚙️ Restructuring Course [${course.id}] ${course.code} - ${course.name} (had ${existingMeetings.length} meetings)...`,
		);

		// Check if any attendances exist
		const meetingIds = existingMeetings.map((m) => m.id);
		let attendanceCount = 0;
		if (meetingIds.length > 0) {
			const atts = await db
				.select({ count: sql<number>`count(*)` })
				.from(courseMeetingAttendances)
				.where(inArray(courseMeetingAttendances.meetingId, meetingIds));
			attendanceCount = Number(atts[0]?.count || 0);
		}

		if (attendanceCount === 0) {
			// No attendances exist: Clean wipe and generate fresh 1..16 meetings
			if (meetingIds.length > 0) {
				await db
					.delete(courseMeetingActivities)
					.where(inArray(courseMeetingActivities.meetingId, meetingIds));
				await db
					.delete(courseMeetingAttendances)
					.where(inArray(courseMeetingAttendances.meetingId, meetingIds));
				await db
					.delete(courseMeetings)
					.where(inArray(courseMeetings.id, meetingIds));
			}

			const toInsert = [];
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

				toInsert.push({
					courseId: course.id,
					meetingNumber: i,
					meetingType: mType,
					meetingLabel: mLabel,
				});
			}

			await db.insert(courseMeetings).values(toInsert);
			console.log(
				`  -> Successfully re-created 16 clean meetings (1-7 regular, 8 UTS, 9-15 regular, 16 UAS).`,
			);
		} else {
			// Attendances exist: carefully preserve meetings with data
			console.log(
				`  -> Preserving existing attendances (${attendanceCount} records found)...`,
			);

			// Delete meetings outside 1..16 or with pkkmb/beginning that have no attendances
			for (const m of existingMeetings) {
				if (
					m.meetingNumber < 1 ||
					m.meetingNumber > 16 ||
					m.meetingType === "pkkmb" ||
					m.meetingType === "beginning"
				) {
					const mAtt = await db
						.select({ count: sql<number>`count(*)` })
						.from(courseMeetingAttendances)
						.where(eq(courseMeetingAttendances.meetingId, m.id));
					if (Number(mAtt[0]?.count || 0) === 0) {
						await db
							.delete(courseMeetingActivities)
							.where(eq(courseMeetingActivities.meetingId, m.id));
						await db.delete(courseMeetings).where(eq(courseMeetings.id, m.id));
						console.log(
							`     Removed unused obsolete meeting #${m.meetingNumber} (ID ${m.id})`,
						);
					}
				}
			}

			// Map remaining meetings by meetingNumber
			const remaining = await db.query.courseMeetings.findMany({
				where: eq(courseMeetings.courseId, course.id),
			});
			const mapByNum = new Map<number, (typeof remaining)[0]>();
			for (const m of remaining) {
				if (m.meetingNumber >= 1 && m.meetingNumber <= 16) {
					mapByNum.set(m.meetingNumber, m);
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

				const existing = mapByNum.get(i);
				if (existing) {
					await db
						.update(courseMeetings)
						.set({
							meetingType: mType,
							meetingLabel:
								existing.meetingLabel &&
								!existing.meetingLabel.startsWith("Pertemuan ") &&
								i !== 8 &&
								i !== 16
									? existing.meetingLabel
									: mLabel,
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
			console.log(`  -> Synced 16 meetings for course [${course.code}].`);
		}
	}

	console.log(
		`\n🎉 Done! Restructured ${modifiedCount} courses. All courses now have strictly 16 meetings (UTS=P8, UAS=P16).`,
	);
	process.exit(0);
}

main().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
