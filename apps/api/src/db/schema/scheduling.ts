import {
	date,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { academicCalendars } from "./academic-calendar";
import { students, users } from "./shared";

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULING (JADWAL KELAS, PRAKTIKUM, PIKET) & PENGUMUMAN
// ─────────────────────────────────────────────────────────────────────────────

export const classSchedules = pgTable(
	"class_schedules",
	{
		id: serial("id").primaryKey(),
		subject: text("subject").notNull(),
		dosenId: integer("dosen_id").references(() => users.id),
		cohort: integer("cohort").notNull(),
		room: text("room").notNull(),
		dayOfWeek: text("day_of_week").notNull(),
		sessionDate: date("session_date"),
		startTime: text("start_time").notNull(), // HH:MM format
		endTime: text("end_time").notNull(), // HH:MM format
		calendarId: integer("calendar_id").references(() => academicCalendars.id),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_class_schedules_cohort").on(t.cohort),
		index("idx_class_schedules_dosen_id").on(t.dosenId),
		index("idx_class_schedules_calendar_id").on(t.calendarId),
	],
);

export const practicumSchedules = pgTable(
	"practicum_schedules",
	{
		id: serial("id").primaryKey(),
		subject: text("subject").notNull(),
		dosenId: integer("dosen_id").references(() => users.id),
		cohort: integer("cohort").notNull(),
		room: text("room").notNull(),
		dayOfWeek: text("day_of_week").notNull(),
		sessionDate: date("session_date"),
		startTime: text("start_time").notNull(),
		endTime: text("end_time").notNull(),
		calendarId: integer("calendar_id").references(() => academicCalendars.id),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_practicum_schedules_cohort").on(t.cohort),
		index("idx_practicum_schedules_dosen_id").on(t.dosenId),
		index("idx_practicum_schedules_calendar_id").on(t.calendarId),
	],
);

export const dutySchedules = pgTable(
	"duty_schedules",
	{
		id: serial("id").primaryKey(),
		cohort: integer("cohort").notNull(),
		groupName: text("group_name").notNull(),
		members: jsonb("members").notNull(), // Array of { studentId, studentName, studentNIM }
		room: text("room").notNull(),
		dayOfWeek: text("day_of_week").notNull(),
		sessionDate: date("session_date"),
		startTime: text("start_time"),
		endTime: text("end_time"),
		calendarId: integer("calendar_id").references(() => academicCalendars.id),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_duty_schedules_cohort").on(t.cohort),
		index("idx_duty_schedules_calendar_id").on(t.calendarId),
	],
);

export const announcements = pgTable(
	"announcements",
	{
		id: serial("id").primaryKey(),
		title: text("title").notNull(),
		description: text("description").notNull(), // Stored as HTML from tiptap
		targetCohort: integer("target_cohort"), // null means all cohorts
		publishedAt: date("published_at").notNull(),
		createdBy: integer("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [index("idx_announcements_target_cohort").on(t.targetCohort)],
);

export const attendanceSessions = pgTable(
	"attendance_sessions",
	{
		id: serial("id").primaryKey(),
		sessionType: text("session_type").notNull(), // "kelas" | "praktikum" | "piket"
		classScheduleId: integer("class_schedule_id").references(
			() => classSchedules.id,
		),
		practicumScheduleId: integer("practicum_schedule_id").references(
			() => practicumSchedules.id,
		),
		dutyScheduleId: integer("duty_schedule_id").references(
			() => dutySchedules.id,
		),
		cohort: integer("cohort").notNull(),
		subject: text("subject").notNull(),
		sessionDate: date("session_date").notNull(),
		startTime: text("start_time").notNull(),
		endTime: text("end_time").notNull(),
		room: text("room").notNull(),
		notes: text("notes"),
		createdBy: integer("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_attendance_sessions_cohort").on(t.cohort),
		index("idx_attendance_sessions_session_date").on(t.sessionDate),
	],
);

export const attendanceRecords = pgTable(
	"attendance_records",
	{
		id: serial("id").primaryKey(),
		sessionId: integer("session_id")
			.references(() => attendanceSessions.id, { onDelete: "cascade" })
			.notNull(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		status: text("status").notNull(), // "hadir" | "alpha" | "sakit" | "izin"
		notes: text("notes"),
		recordedBy: integer("recorded_by").references(() => users.id),
		recordedAt: timestamp("recorded_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_attendance_records_session_id").on(t.sessionId),
		index("idx_attendance_records_student_id").on(t.studentId),
	],
);

export const odsAttendanceRecords = pgTable(
	"ods_attendance_records",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		date: date("date").notNull(),
		status: text("status").notNull(), // "hadir" | "alpha" | "sakit" | "izin"
		notes: text("notes"),
		recordedBy: integer("recorded_by").references(() => users.id),
		recordedAt: timestamp("recorded_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_ods_attendance_records_student_id").on(t.studentId),
		index("idx_ods_attendance_records_date").on(t.date),
	],
);

export const pramagangAttendanceRecords = pgTable(
	"pramagang_attendance_records",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		date: date("date").notNull(),
		status: text("status").notNull(), // "hadir" | "alpha" | "sakit" | "izin"
		notes: text("notes"),
		recordedBy: integer("recorded_by").references(() => users.id),
		recordedAt: timestamp("recorded_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_pramagang_attendance_records_student_id").on(t.studentId),
		index("idx_pramagang_attendance_records_date").on(t.date),
	],
);
