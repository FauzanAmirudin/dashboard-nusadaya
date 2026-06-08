import {
	boolean,
	integer,
	json,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", [
	"superadmin",
	"pmb",
	"crm",
	"finance",
	"akademik",
	"dosen",
	"pa",
	"magang",
	"evaluator",
]);

export const statusEnum = pgEnum("status", [
	"AMAN",
	"PERLU_PERHATIAN",
	"TIDAK_AMAN",
]);

// 1. Users (RBAC)
export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	username: text("username").unique().notNull(),
	passwordHash: text("password_hash").notNull(),
	fullName: text("full_name").notNull(),
	role: roleEnum("role").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Students
export const students = pgTable("students", {
	id: serial("id").primaryKey(),
	nim: text("nim").unique().notNull(),
	name: text("name").notNull(),
	cohort: integer("cohort").notNull(),
	program: text("program").notNull(),
	overallStatus: statusEnum("overall_status").default("AMAN"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. PMB Data
export const pmbData = pgTable("pmb_data", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	documentsComplete: boolean("documents_complete").default(false),
	medicalCheckupPassed: boolean("medical_checkup_passed").default(false),
	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. CRM Data
export const crmData = pgTable("crm_data", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	parentConsultationDone: boolean("parent_consultation_done").default(false),
	parentAgreementSigned: boolean("parent_agreement_signed").default(false),
	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Finance Data
export const financeData = pgTable("finance_data", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	tuitionPaid: boolean("tuition_paid").default(false),
	depositPaid: boolean("deposit_paid").default(false),
	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 6. Academic Data
export const academicData = pgTable("academic_data", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	gpa: integer("gpa").default(0), // scaled by 100
	creditsCompleted: integer("credits_completed").default(0),
	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 7. Course Grades
export const courseGrades = pgTable("course_grades", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	courseCode: text("course_code").notNull(),
	grade: text("grade"),
	attendanceRate: integer("attendance_rate").default(0),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 8. PA (Pendamping Akademik) Data
export const paData = pgTable("pa_data", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	counselingSessions: integer("counseling_sessions").default(0),
	behavioralScore: integer("behavioral_score").default(0),
	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 9. Internship Data
export const internshipData = pgTable("internship_data", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	passportReady: boolean("passport_ready").default(false),
	visaReady: boolean("visa_ready").default(false),
	languageTestPassed: boolean("language_test_passed").default(false),
	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 10. Final Decision
export const finalDecision = pgTable("final_decision", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	isApprovedByDirector: boolean("is_approved_by_director").default(false),
	departureDate: timestamp("departure_date"),
	notes: text("notes"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 11. Internal Notes
export const internalNotes = pgTable("internal_notes", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	authorId: integer("author_id")
		.references(() => users.id)
		.notNull(),
	note: text("note").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 12. Audit Logs
export const auditLogs = pgTable("audit_logs", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").references(() => users.id),
	action: text("action").notNull(),
	entity: text("entity").notNull(),
	entityId: integer("entity_id"),
	details: json("details"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
