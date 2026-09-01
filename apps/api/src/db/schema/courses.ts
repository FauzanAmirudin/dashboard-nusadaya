import {
	date,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { activityTypeEnum, courseTypeEnum, meetingTypeEnum } from "./enums";
import { students, users } from "./shared";

// ─────────────────────────────────────────────────────────────────────────────
// MANAJEMEN MATA KULIAH (COURSES)
// ─────────────────────────────────────────────────────────────────────────────

export const courses = pgTable("courses", {
	id: serial("id").primaryKey(),
	code: text("code").unique().notNull(),
	name: text("name").notNull(),
	dosenId: integer("dosen_id")
		.references(() => users.id)
		.notNull(),
	peminatan: text("peminatan"),
	cohort: integer("cohort").notNull(),
	type: courseTypeEnum("type").default("teori").notNull(),
	createdBy: integer("created_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseMeetings = pgTable("course_meetings", {
	id: serial("id").primaryKey(),
	courseId: integer("course_id")
		.references(() => courses.id)
		.notNull(),
	meetingNumber: integer("meeting_number").notNull(), // 1 to 16
	meetingType: meetingTypeEnum("meeting_type").notNull(), // regular, uts, uas
	sessionType: text("session_type"), // "teori" | "praktik" | "keduanya"
	meetingLabel: text("meeting_label").notNull(),
	description: text("description"),
	meetingDate: date("meeting_date"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseMeetingActivities = pgTable("course_meeting_activities", {
	id: serial("id").primaryKey(),
	meetingId: integer("meeting_id")
		.references(() => courseMeetings.id)
		.notNull(),
	activityType: activityTypeEnum("activity_type").notNull(),
	score: integer("score"),
	notes: text("notes"),
	documentUrl: text("document_url"),
	documentName: text("document_name"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseMeetingAttendances = pgTable("course_meeting_attendances", {
	id: serial("id").primaryKey(),
	meetingId: integer("meeting_id")
		.references(() => courseMeetings.id)
		.notNull(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	status: text("status"), // hadir, izin, sakit, alpha, or null if unassigned
	theoryScore: integer("theory_score"),
	practicalScore: integer("practical_score"),
	notes: text("notes"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseEnrollments = pgTable(
	"course_enrollments",
	{
		id: serial("id").primaryKey(),
		courseId: integer("course_id")
			.references(() => courses.id)
			.notNull(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		addedBy: integer("added_by").references(() => users.id),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_course_enrollments_course_id").on(t.courseId),
		index("idx_course_enrollments_student_id").on(t.studentId),
		unique("uq_course_enrollment").on(t.courseId, t.studentId),
	],
);
