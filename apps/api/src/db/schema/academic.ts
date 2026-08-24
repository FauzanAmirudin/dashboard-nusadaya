import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { courses } from "./courses";
import { statusEnum } from "./enums";
import { students, users } from "./shared";

// 6. Academic Data
export const academicData = pgTable(
	"academic_data",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull()
			.unique(),
		gpa: integer("gpa").default(0), // scaled by 100
		creditsCompleted: integer("credits_completed").default(0),

		// New Academic Checklist Fields
		pddiktiInput: boolean("pddikti_input").default(false),
		attendanceTotal: integer("attendance_total").default(0),
		attendancePresent: integer("attendance_present").default(0),
		attendanceAlphaNote: text("attendance_alpha_note"),
		utsPassed: boolean("uts_passed").default(false),
		uasPassed: boolean("uas_passed").default(false),
		attitudeIndicator: boolean("attitude_indicator").default(false),
		assignmentsCompleted: boolean("assignments_completed").default(false),
		academicCommunication: boolean("academic_communication").default(false),
		notes: text("notes"),

		// New fields for Manajemen Mahasiswa
		assessmentCompleted: boolean("assessment_completed").default(false),
		attendancePiketTotal: integer("attendance_piket_total").default(0),
		attendancePiketPresent: integer("attendance_piket_present").default(0),
		attendanceOdsTotal: integer("attendance_ods_total").default(0),
		attendanceOdsPresent: integer("attendance_ods_present").default(0),
		attendancePramagangTotal: integer("attendance_pramagang_total").default(0),
		attendancePramagangPresent: integer("attendance_pramagang_present").default(
			0,
		),

		isAcc: boolean("is_acc").default(false),
		accAt: timestamp("acc_at"),
		accBy: integer("acc_by").references(() => users.id),
		status: statusEnum("status").default("PERLU_PERHATIAN"),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [index("idx_academic_data_student_id").on(t.studentId)],
);

export const overseasProgramChecklists = pgTable(
	"overseas_program_checklists",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		programType: text("program_type").notNull().default("taiwan"), // e.g., 'taiwan'
		cohort: text("cohort"), // e.g. '13/14'
		pasFotoChecked: boolean("pas_foto_checked").default(false),
		cvChecked: boolean("cv_checked").default(false),
		ktmChecked: boolean("ktm_checked").default(false),
		khsChecked: boolean("khs_checked").default(false),
		sl21Checked: boolean("sl21_checked").default(false),
		aktifChecked: boolean("aktif_checked").default(false),
		gapYearChecked: boolean("gap_year_checked").default(false),
		pddiktiChecked: boolean("pddikti_checked").default(false),
		pribadiChecked: boolean("pribadi_checked").default(false),
		lolChecked: boolean("lol_checked").default(false),
		loaChecked: boolean("loa_checked").default(false),
		suhhanChecked: boolean("suhhan_checked").default(false),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [index("idx_overseas_checklists_student_id").on(t.studentId)],
);

export const academicDocuments = pgTable(
	"academic_documents",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		documentKey: text("document_key").notNull(),
		fileName: text("file_name").notNull(),
		fileUrl: text("file_url").notNull(),
		fileSize: integer("file_size"),
		mimeType: text("mime_type"),
		uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
		uploadedBy: integer("uploaded_by").references(() => users.id),
		isVerified: boolean("is_verified").default(false),
		verifiedAt: timestamp("verified_at"),
		verifiedBy: integer("verified_by").references(() => users.id),
	},
	(t) => [index("idx_academic_documents_student_id").on(t.studentId)],
);

// 7. Course Grades
export const courseGrades = pgTable(
	"course_grades",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		courseId: integer("course_id").references(() => courses.id),
		courseCode: text("course_code").notNull(),
		courseName: text("course_name").notNull(),
		dosenId: integer("dosen_id").references(() => users.id),
		grade: text("grade"),
		attendanceRate: integer("attendance_rate").default(0), // percentage
		attitudeNote: text("attitude_note"),

		// Skema Nilai Vokasi
		practicalScore: integer("practical_score").default(0),
		theoryScore: integer("theory_score").default(0),
		entrepreneurScore: integer("entrepreneur_score").default(0),
		kwuScore: integer("kwu_score").default(0),
		productPhotoUrl: text("product_photo_url"),
		totalMeetings: integer("total_meetings").default(16),
		attendancePresent: integer("attendance_present").default(0),

		isAcc: boolean("is_acc").default(false),
		accAt: timestamp("acc_at"),
		accBy: integer("acc_by").references(() => users.id),

		hasKwu: boolean("has_kwu").default(false),

		status: statusEnum("status").default("PERLU_PERHATIAN"),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_course_grades_student_id").on(t.studentId),
		index("idx_course_grades_course_id").on(t.courseId),
	],
);

export const courseGradeDocuments = pgTable(
	"course_grade_documents",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		courseGradeId: integer("course_grade_id")
			.references(() => courseGrades.id)
			.notNull(),
		documentKey: text("document_key").notNull(),
		fileName: text("file_name").notNull(),
		fileUrl: text("file_url").notNull(),
		fileSize: integer("file_size"),
		mimeType: text("mime_type"),
		uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
		uploadedBy: integer("uploaded_by").references(() => users.id),
		isVerified: boolean("is_verified").default(false),
		verifiedAt: timestamp("verified_at"),
		verifiedBy: integer("verified_by").references(() => users.id),
	},
	(t) => [
		index("idx_course_grade_docs_student_id").on(t.studentId),
		index("idx_course_grade_docs_grade_id").on(t.courseGradeId),
	],
);

// 7a. Academic Attitude Logs
export const academicAttitudeLogs = pgTable(
	"academic_attitude_logs",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		courseGradeId: integer("course_grade_id")
			.references(() => courseGrades.id)
			.notNull(),
		dosenId: integer("dosen_id")
			.references(() => users.id)
			.notNull(),
		disciplineScore: integer("discipline_score").default(0), // 1-5
		activenessScore: integer("activeness_score").default(0), // 1-5
		date: timestamp("date").notNull(),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_academic_attitude_logs_student_id").on(t.studentId),
		index("idx_academic_attitude_logs_grade_id").on(t.courseGradeId),
	],
);

// 7b. Entrepreneurship Records (KWU)
export const entrepreneurshipRecords = pgTable(
	"entrepreneurship_records",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		courseGradeId: integer("course_grade_id")
			.references(() => courseGrades.id)
			.notNull(),
		businessType: text("business_type").notNull(),
		productionQty: integer("production_qty").default(0),
		revenueTotal: integer("revenue_total").default(0),
		profitSharingStudent: integer("profit_sharing_student").default(0),
		profitSharingDosen: integer("profit_sharing_dosen").default(0),
		profitSharingLembaga: integer("profit_sharing_lembaga").default(0),
		weekDate: timestamp("week_date").notNull(),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_entrepreneurship_records_student_id").on(t.studentId),
		index("idx_entrepreneurship_records_grade_id").on(t.courseGradeId),
	],
);

// 7c. Weekly Events
export const weeklyEvents = pgTable(
	"weekly_events",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		eventType: text("event_type").notNull(),
		eventDate: timestamp("event_date").notNull(),
		description: text("description"),
		documentUrl: text("document_url"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [index("idx_weekly_events_student_id").on(t.studentId)],
);

// 7d. Master Configurations
export const masterEventTypes = pgTable("master_event_types", {
	id: serial("id").primaryKey(),
	configKey: text("config_key").notNull().unique(),
	eventName: text("event_name").notNull(),
	isActive: boolean("is_active").default(true),
});

export const masterBusinessParameters = pgTable("master_business_parameters", {
	id: serial("id").primaryKey(),
	businessUnitId: text("business_unit_id").notNull(),
	parameterName: text("parameter_name").notNull(),
	formulaValue: text("formula_value").notNull(), // text to support decimal/ratios
	description: text("description"),
});

export const masterServiceTags = pgTable("master_service_tags", {
	id: serial("id").primaryKey(),
	serviceId: text("service_id").notNull().unique(),
	categoryName: text("category_name").notNull(),
	isEnabled: boolean("is_enabled").default(true),
});
