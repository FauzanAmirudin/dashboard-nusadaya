import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { academicCalendars } from "./academic-calendar";
import { courseTypeEnum } from "./enums";
import { students, users } from "./shared";

// ==========================================
// 1. MASTER MATA KULIAH (Katalog Statis)
// ==========================================
export const masterCourses = pgTable(
	"master_courses",
	{
		id: serial("id").primaryKey(),
		code: text("code").notNull().unique(),
		name: text("name").notNull(),
		sks: integer("sks").notNull().default(2),
		type: courseTypeEnum("type").notNull().default("teori"),
		description: text("description"),
		isActive: boolean("is_active").default(true).notNull(),
		createdBy: integer("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_master_courses_code").on(t.code),
		index("idx_master_courses_name").on(t.name),
	],
);

// ==========================================
// 2. PERIODE AKADEMIK GLOBAL (Academic Terms)
// ==========================================
export const academicTerms = pgTable(
	"academic_terms",
	{
		id: serial("id").primaryKey(),
		academicYear: text("academic_year").notNull(), // e.g. "2026/2027"
		semesterType: text("semester_type").notNull(), // "ganjil" | "genap"
		name: text("name").notNull(), // e.g. "2026/2027 Ganjil"
		startDate: date("start_date").notNull(),
		endDate: date("end_date").notNull(),
		krsStartDate: date("krs_start_date"),
		krsEndDate: date("krs_end_date"),
		gradeLockDate: date("grade_lock_date"),
		status: text("status").default("draft").notNull(), // "draft" | "krs" | "berjalan" | "penilaian" | "ditutup"
		isActive: boolean("is_active").default(false).notNull(),
		calendarId: integer("calendar_id").references(() => academicCalendars.id),
		createdBy: integer("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		unique("uq_academic_terms_year_sem").on(t.academicYear, t.semesterType),
		index("idx_academic_terms_is_active").on(t.isActive),
		index("idx_academic_terms_status").on(t.status),
	],
);

// ==========================================
// 3. KURIKULUM & PAKET SEMESTER
// ==========================================
export const curricula = pgTable(
	"curricula",
	{
		id: serial("id").primaryKey(),
		name: text("name").notNull(), // e.g. "Kurikulum D3 Perhotelan 2024"
		program: text("program").notNull().default("D3 Perhotelan"),
		subProgram: text("sub_program"), // e.g. "Indonesia-Reguler", null = berlaku umum
		startCohort: integer("start_cohort").notNull(), // e.g. 14
		endCohort: integer("end_cohort"), // null = masih berlaku
		maxSksPerSemester: integer("max_sks_per_semester").default(24).notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		createdBy: integer("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_curricula_program_sub").on(t.program, t.subProgram),
		index("idx_curricula_is_active").on(t.isActive),
	],
);

export const curriculumPackages = pgTable(
	"curriculum_packages",
	{
		id: serial("id").primaryKey(),
		curriculumId: integer("curriculum_id")
			.notNull()
			.references(() => curricula.id, { onDelete: "cascade" }),
		masterCourseId: integer("master_course_id")
			.notNull()
			.references(() => masterCourses.id, { onDelete: "cascade" }),
		semester: integer("semester").notNull(), // 1 - 6
		isRequired: boolean("is_required").default(true).notNull(),
		orderIndex: integer("order_index").default(0).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		unique("uq_curriculum_course").on(t.curriculumId, t.masterCourseId),
		index("idx_curriculum_packages_sem").on(t.curriculumId, t.semester),
	],
);

// ==========================================
// 4. REGISTRASI SEMESTER MAHASISWA
// ==========================================
export const studentSemesterRegistrations = pgTable(
	"student_semester_registrations",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.notNull()
			.references(() => students.id, { onDelete: "cascade" }),
		termId: integer("term_id")
			.notNull()
			.references(() => academicTerms.id),
		semester: integer("semester").notNull(), // 1 - 6
		status: text("status").default("aktif").notNull(), // "aktif" | "cuti" | "lulus" | "keluar"
		krsStatus: text("krs_status").default("draft").notNull(), // "draft" | "disetujui" | "terkunci"
		ips: integer("ips").default(0), // scaled by 100
		ipk: integer("ipk").default(0), // scaled by 100
		sksTaken: integer("sks_taken").default(0).notNull(),
		sksPassed: integer("sks_passed").default(0).notNull(),
		approvedBy: integer("approved_by").references(() => users.id),
		approvedAt: timestamp("approved_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		unique("uq_student_term_registration").on(t.studentId, t.termId),
		index("idx_student_sem_reg_student").on(t.studentId),
		index("idx_student_sem_reg_term").on(t.termId),
		index("idx_student_sem_reg_status").on(t.status),
	],
);

// ==========================================
// 5. LOG PERGANTIAN SEMESTER & AUDIT AKADEMIK
// ==========================================
export const semesterRolloverLogs = pgTable(
	"semester_rollover_logs",
	{
		id: serial("id").primaryKey(),
		sourceTermId: integer("source_term_id").references(() => academicTerms.id),
		targetTermId: integer("target_term_id").references(() => academicTerms.id),
		action: text("action").notNull(), // "preview" | "execute" | "rollback" | "reopen"
		step: text("step"),
		status: text("status").notNull(), // "success" | "failed" | "in_progress"
		summary: jsonb("summary").default({}),
		errorDetails: text("error_details"),
		executedBy: integer("executed_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_rollover_logs_target").on(t.targetTermId),
		index("idx_rollover_logs_created").on(t.createdAt),
	],
);

export const academicAuditLogs = pgTable(
	"academic_audit_logs",
	{
		id: serial("id").primaryKey(),
		termId: integer("term_id").references(() => academicTerms.id),
		studentId: integer("student_id").references(() => students.id),
		action: text("action").notNull(), // "krs_add" | "krs_drop" | "krs_override" | "grade_correction" | "term_reopen"
		details: jsonb("details").default({}),
		reason: text("reason").notNull(),
		performedBy: integer("performed_by")
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_academic_audit_term").on(t.termId),
		index("idx_academic_audit_student").on(t.studentId),
	],
);
