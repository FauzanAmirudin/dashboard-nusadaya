import {
	boolean,
	date,
	doublePrecision,
	index,
	integer,
	jsonb,
	pgTable,
	real,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { academicCalendars } from "./academic-calendar";
import { courses } from "./courses";
import { academicTerms } from "./curriculum";
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
		dosenPendampingId: integer("dosen_pendamping_id").references(
			() => users.id,
		),
		cohort: integer("cohort").notNull(),
		rombel: text("rombel").default("Kelas A").notNull(),
		room: text("room").notNull(),
		dayOfWeek: text("day_of_week").notNull(),
		sessionDate: date("session_date"),
		startTime: text("start_time").notNull(), // HH:MM format
		endTime: text("end_time").notNull(), // HH:MM format
		calendarId: integer("calendar_id").references(() => academicCalendars.id),
		courseId: integer("course_id").references(() => courses.id),
		termId: integer("term_id").references(() => academicTerms.id),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_class_schedules_cohort").on(t.cohort),
		index("idx_class_schedules_dosen_id").on(t.dosenId),
		index("idx_class_schedules_dosen_pendamping_id").on(t.dosenPendampingId),
		index("idx_class_schedules_calendar_id").on(t.calendarId),
		index("idx_class_schedules_course_id").on(t.courseId),
		index("idx_class_schedules_term_id").on(t.termId),
	],
);

export const practicumSchedules = pgTable(
	"practicum_schedules",
	{
		id: serial("id").primaryKey(),
		subject: text("subject").notNull(),
		dosenId: integer("dosen_id").references(() => users.id),
		dosenPendampingId: integer("dosen_pendamping_id").references(
			() => users.id,
		),
		cohort: integer("cohort").notNull(),
		rombel: text("rombel").default("Kelas A").notNull(),
		room: text("room").notNull(),
		dayOfWeek: text("day_of_week").notNull(),
		sessionDate: date("session_date"),
		startTime: text("start_time").notNull(),
		endTime: text("end_time").notNull(),
		calendarId: integer("calendar_id").references(() => academicCalendars.id),
		courseId: integer("course_id").references(() => courses.id),
		termId: integer("term_id").references(() => academicTerms.id),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_practicum_schedules_cohort").on(t.cohort),
		index("idx_practicum_schedules_dosen_id").on(t.dosenId),
		index("idx_practicum_schedules_dosen_pendamping_id").on(
			t.dosenPendampingId,
		),
		index("idx_practicum_schedules_calendar_id").on(t.calendarId),
		index("idx_practicum_schedules_course_id").on(t.courseId),
		index("idx_practicum_schedules_term_id").on(t.termId),
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
		selfieUrl: text("selfie_url"),
		latitude: doublePrecision("latitude"),
		longitude: doublePrecision("longitude"),
		gpsAccuracy: real("gps_accuracy"),
		locationName: text("location_name"),
		distanceFromCheckpoint: integer("distance_from_checkpoint"),
		checkinMethod: text("checkin_method").default("admin"), // "self_selfie" | "self_manual" | "admin"
		isWithinRadius: boolean("is_within_radius").default(true),
		selfieTakenAt: timestamp("selfie_taken_at"),
		verificationStatus: text("verification_status").default("auto_approved"), // "auto_approved" | "pending_review" | "approved" | "rejected"
		verifiedBy: integer("verified_by").references(() => users.id),
		verifiedAt: timestamp("verified_at"),
		rejectionReason: text("rejection_reason"),
		recordedBy: integer("recorded_by").references(() => users.id),
		recordedAt: timestamp("recorded_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_attendance_records_session_id").on(t.sessionId),
		index("idx_attendance_records_student_id").on(t.studentId),
		index("idx_attendance_records_verification").on(t.verificationStatus),
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
		selfieUrl: text("selfie_url"),
		latitude: doublePrecision("latitude"),
		longitude: doublePrecision("longitude"),
		gpsAccuracy: real("gps_accuracy"),
		locationName: text("location_name"),
		distanceFromCheckpoint: integer("distance_from_checkpoint"),
		checkinMethod: text("checkin_method").default("admin"),
		isWithinRadius: boolean("is_within_radius").default(true),
		selfieTakenAt: timestamp("selfie_taken_at"),
		verificationStatus: text("verification_status").default("auto_approved"),
		verifiedBy: integer("verified_by").references(() => users.id),
		verifiedAt: timestamp("verified_at"),
		rejectionReason: text("rejection_reason"),
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
		selfieUrl: text("selfie_url"),
		latitude: doublePrecision("latitude"),
		longitude: doublePrecision("longitude"),
		gpsAccuracy: real("gps_accuracy"),
		locationName: text("location_name"),
		distanceFromCheckpoint: integer("distance_from_checkpoint"),
		checkinMethod: text("checkin_method").default("admin"),
		isWithinRadius: boolean("is_within_radius").default(true),
		selfieTakenAt: timestamp("selfie_taken_at"),
		verificationStatus: text("verification_status").default("auto_approved"),
		verifiedBy: integer("verified_by").references(() => users.id),
		verifiedAt: timestamp("verified_at"),
		rejectionReason: text("rejection_reason"),
		recordedBy: integer("recorded_by").references(() => users.id),
		recordedAt: timestamp("recorded_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_pramagang_attendance_records_student_id").on(t.studentId),
		index("idx_pramagang_attendance_records_date").on(t.date),
	],
);

export const morningAssemblySessions = pgTable(
	"morning_assembly_sessions",
	{
		id: serial("id").primaryKey(),
		cohort: integer("cohort").notNull(),
		rombel: text("rombel").default("Semua").notNull(), // "Kelas A" | "Kelas B" | "Semua"
		sessionDate: date("session_date").notNull(),
		targetTime: text("target_time").default("06:22").notNull(), // Standar patokan kedatangan 06.22
		location: text("location").default("Lapangan Utama Kampus").notNull(),
		notes: text("notes"),
		isAutoGenerated: boolean("is_auto_generated").default(false).notNull(),
		sessionStatus: text("session_status").default("scheduled").notNull(), // "scheduled" | "active" | "completed" | "cancelled"
		checkInWindowStart: text("check_in_window_start")
			.default("05:30")
			.notNull(),
		checkInWindowEnd: text("check_in_window_end").default("07:00").notNull(),
		rescheduledFrom: date("rescheduled_from"),
		createdBy: integer("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_morning_assembly_sessions_cohort").on(t.cohort),
		index("idx_morning_assembly_sessions_date").on(t.sessionDate),
	],
);

export const morningAssemblyRecords = pgTable(
	"morning_assembly_records",
	{
		id: serial("id").primaryKey(),
		sessionId: integer("session_id")
			.references(() => morningAssemblySessions.id, { onDelete: "cascade" })
			.notNull(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		status: text("status").notNull(), // "hadir" | "terlambat" | "izin" | "sakit" | "alpha"
		arrivalTime: text("arrival_time"), // Contoh: "06:18" atau "06:31"
		minutesLate: integer("minutes_late").default(0), // Menit keterlambatan jika > 06.22
		notes: text("notes"),
		selfCheckinAt: timestamp("self_checkin_at"),
		checkinMethod: text("checkin_method").default("admin").notNull(), // "self" | "self_selfie" | "admin"
		selfieUrl: text("selfie_url"),
		latitude: doublePrecision("latitude"),
		longitude: doublePrecision("longitude"),
		gpsAccuracy: real("gps_accuracy"),
		locationName: text("location_name"),
		distanceFromCheckpoint: integer("distance_from_checkpoint"),
		isWithinRadius: boolean("is_within_radius").default(true),
		selfieTakenAt: timestamp("selfie_taken_at"),
		verificationStatus: text("verification_status").default("auto_approved"),
		verifiedBy: integer("verified_by").references(() => users.id),
		verifiedAt: timestamp("verified_at"),
		rejectionReason: text("rejection_reason"),
		faceDetected: boolean("face_detected").default(true),
		recordedBy: integer("recorded_by").references(() => users.id),
		recordedAt: timestamp("recorded_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_morning_assembly_records_session_id").on(t.sessionId),
		index("idx_morning_assembly_records_student_id").on(t.studentId),
	],
);

export const morningAssemblyScheduleConfig = pgTable(
	"morning_assembly_schedule_config",
	{
		id: serial("id").primaryKey(),
		cohort: integer("cohort").notNull(),
		dayOfWeek: integer("day_of_week").default(1).notNull(), // 0 = Minggu, 1 = Senin, ...
		targetTime: text("target_time").default("06:22").notNull(),
		checkInWindowStart: text("check_in_window_start")
			.default("05:30")
			.notNull(),
		checkInWindowEnd: text("check_in_window_end").default("07:00").notNull(),
		location: text("location").default("Lapangan Utama Kampus").notNull(),
		rombel: text("rombel").default("Semua").notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		createdBy: integer("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [index("idx_morning_assembly_config_cohort").on(t.cohort)],
);

export const attendanceCheckpointConfig = pgTable(
	"attendance_checkpoint_config",
	{
		id: serial("id").primaryKey(),
		type: text("type").notNull(), // "kuliah" | "piket" | "baris_pagi" | "ods"
		label: text("label").notNull(), // e.g. "Gedung Utama Kampus"
		latitude: doublePrecision("latitude").notNull(),
		longitude: doublePrecision("longitude").notNull(),
		radiusMeters: integer("radius_meters").default(100).notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		cohort: integer("cohort"), // null = berlaku untuk semua angkatan
		notes: text("notes"),
		createdBy: integer("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_attendance_checkpoint_type").on(t.type),
		index("idx_attendance_checkpoint_cohort").on(t.cohort),
	],
);

export const selfieFraudFlags = pgTable(
	"selfie_fraud_flags",
	{
		id: serial("id").primaryKey(),
		attendanceType: text("attendance_type").notNull(), // "kuliah" | "piket" | "baris_pagi" | "ods"
		attendanceRecordId: integer("attendance_record_id").notNull(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		flagReason: text("flag_reason").notNull(), // "gps_accuracy_too_low" | "outside_radius" | "virtual_camera_suspected" | "gps_spoofing_suspected" | "duplicate_submission"
		flagDetail: jsonb("flag_detail"),
		reviewedBy: integer("reviewed_by").references(() => users.id),
		reviewedAt: timestamp("reviewed_at"),
		isDismissed: boolean("is_dismissed").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_selfie_fraud_student_id").on(t.studentId),
		index("idx_selfie_fraud_type_record").on(
			t.attendanceType,
			t.attendanceRecordId,
		),
	],
);
