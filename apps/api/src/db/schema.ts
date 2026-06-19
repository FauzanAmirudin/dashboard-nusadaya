import { relations } from "drizzle-orm";
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

export const studentStatusEnum = pgEnum("student_status", [
	"aktif",
	"cuti",
	"alumni",
	"keluar",
]);

export const statusEnum = pgEnum("status", [
	"AMAN",
	"PERLU_PERHATIAN",
	"TIDAK_AMAN",
]);

export const evaluatorDecisionEnum = pgEnum("evaluator_decision", [
	"menunggu",
	"lanjut_interview",
	"ttd_kontrak",
	"layak_berangkat",
	"remedial",
]);

export const noteTypeEnum = pgEnum("note_type", [
	"pengecualian_akademik",
	"izin_resmi",
	"sedang_ods",
	"praktik_luar",
	"informasi_umum",
	"lainnya",
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

	// New fields
	phone: text("phone"),
	parentName: text("parent_name"),
	paId: integer("pa_id").references(() => users.id),
	studentStatus: studentStatusEnum("student_status").default("aktif"),
	destinationCountry: text("destination_country"),
	period: text("period"),
	profilePhotoUrl: text("profile_photo_url"),

	overallStatus: statusEnum("overall_status").default("AMAN"),
	isArchived: boolean("is_archived").default(false),
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
	formReceived: boolean("form_received").default(false),
	documentsComplete: boolean("documents_complete").default(false),
	dataInputted: boolean("data_inputted").default(false),
	initialFollowUp: boolean("initial_follow_up").default(false),
	notes: text("notes"),
	isAcc: boolean("is_acc").default(false),
	accAt: timestamp("acc_at"),
	accBy: integer("acc_by").references(() => users.id),
	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3b. PMB Documents
export const pmbDocuments = pgTable("pmb_documents", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	// Key sesuai checklist: form_received | documents_complete | data_inputted | initial_follow_up
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
});

// 4. CRM Data
export const crmData = pgTable("crm_data", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	odsActive: boolean("ods_active").default(false),
	studentMonitoring: boolean("student_monitoring").default(false),
	parentFollowUp: boolean("parent_follow_up").default(false),
	practiceAttendance: boolean("practice_attendance").default(false),
	odsDocumentation: boolean("ods_documentation").default(false),
	practiceDaysPresent: integer("practice_days_present").default(0),
	practiceDaysTotal: integer("practice_days_total").default(0),
	isAcc: boolean("is_acc").default(false),
	accAt: timestamp("acc_at"),
	accBy: integer("acc_by").references(() => users.id),
	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4b. CRM Logs (Komunikasi Orang Tua)
export const crmLogs = pgTable("crm_logs", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	authorId: integer("author_id")
		.references(() => users.id)
		.notNull(),
	logText: text("log_text").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4c. CRM Documents
export const crmDocuments = pgTable("crm_documents", {
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
});
// 5b. Finance Documents
export const financeDocuments = pgTable("finance_documents", {
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
});

// 5. Finance Data
export const financeData = pgTable("finance_data", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	registrationPaid: boolean("registration_paid").default(false),
	registrationAmount: integer("registration_amount").default(0),
	registrationDate: timestamp("registration_date"),
	semesterPaid: boolean("semester_paid").default(false),
	semesterAmount: integer("semester_amount").default(0),
	semesterDate: timestamp("semester_date"),
	installmentCleared: boolean("installment_cleared").default(false),
	installmentAmount: integer("installment_amount").default(0),
	installmentDate: timestamp("installment_date"),
	arrearsCleared: boolean("arrears_cleared").default(false),
	arrearsAmount: integer("arrears_amount").default(0),
	notes: text("notes"),
	isAcc: boolean("is_acc").default(false),
	accAt: timestamp("acc_at"),
	accBy: integer("acc_by").references(() => users.id),
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

	isAcc: boolean("is_acc").default(false),
	accAt: timestamp("acc_at"),
	accBy: integer("acc_by").references(() => users.id),
	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const academicDocuments = pgTable("academic_documents", {
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
});

// 7. Course Grades
export const courseGrades = pgTable("course_grades", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	courseCode: text("course_code").notNull(),
	courseName: text("course_name").notNull(),
	dosenId: integer("dosen_id").references(() => users.id),
	grade: text("grade"),
	attendanceRate: integer("attendance_rate").default(0),
	attitudeNote: text("attitude_note"),

	isAcc: boolean("is_acc").default(false),
	accAt: timestamp("acc_at"),
	accBy: integer("acc_by").references(() => users.id),

	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseGradeDocuments = pgTable("course_grade_documents", {
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
});

// 8. PA (Pendamping Akademik) Data
export const paData = pgTable("pa_data", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	counselingDone: boolean("counseling_done").default(false),
	mentalStable: boolean("mental_stable").default(false),
	disciplineGood: boolean("discipline_good").default(false),
	vocabTarget: integer("vocab_target").default(500),
	disciplineNotes: text("discipline_notes"),

	isAcc: boolean("is_acc").default(false),
	accAt: timestamp("acc_at"),
	accBy: integer("acc_by").references(() => users.id),

	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paDocuments = pgTable("pa_documents", {
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
});

export const vocabLogs = pgTable("vocab_logs", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	date: timestamp("date").notNull(),
	addedWords: integer("added_words").notNull(),
	notes: text("notes"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const counselingLogs = pgTable("counseling_logs", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	date: timestamp("date").notNull(),
	notes: text("notes").notNull(),
	condition: text("condition").notNull(), // "Stabil", "Perlu Perhatian", "Kritis"
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Internship Data
export const internshipData = pgTable("internship_data", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),

	// 1. Passport
	passportReady: boolean("passport_ready").default(false),
	passportNo: text("passport_no"),
	passportExp: timestamp("passport_exp"),

	// 2. Interview
	interviewReady: boolean("interview_ready").default(false),
	interviewDate: timestamp("interview_date"),
	interviewResult: text("interview_result"), // Lulus / Tidak Lulus / Pending

	// 3. LoA
	loaReady: boolean("loa_ready").default(false),
	loaCompany: text("loa_company"),
	loaPosition: text("loa_position"),

	// 4. Contract
	contractReady: boolean("contract_ready").default(false),
	contractDate: timestamp("contract_date"),

	// 5. MCU
	mcuReady: boolean("mcu_ready").default(false),
	mcuPlace: text("mcu_place"),
	mcuDate: timestamp("mcu_date"),
	mcuResult: text("mcu_result"),

	// 6. Visa
	visaReady: boolean("visa_ready").default(false),
	visaType: text("visa_type"),
	visaStatus: text("visa_status"),
	visaNo: text("visa_no"),

	// 7. Ticket
	ticketReady: boolean("ticket_ready").default(false),
	ticketAirline: text("ticket_airline"),
	ticketDate: timestamp("ticket_date"),
	ticketFlight: text("ticket_flight"),

	// 8. PDT
	pdtReady: boolean("pdt_ready").default(false),
	pdtDate: timestamp("pdt_date"),
	pdtPlace: text("pdt_place"),

	// Schedule
	estDepartureDate: timestamp("est_departure_date"),
	destinationCity: text("destination_city"),
	internshipDuration: text("internship_duration"),
	internshipCompany: text("internship_company"),

	notes: text("notes"),

	isAcc: boolean("is_acc").default(false),
	accAt: timestamp("acc_at"),
	accBy: integer("acc_by").references(() => users.id),

	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const internshipDocuments = pgTable("internship_documents", {
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
});

// 10. Final Decision
export const finalDecision = pgTable("final_decision", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	evaluatorDecision:
		evaluatorDecisionEnum("evaluator_decision").default("menunggu"),
	evaluatorNotes: text("evaluator_notes"),
	decidedAt: timestamp("decided_at"),
	decidedBy: integer("decided_by").references(() => users.id),
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
	noteType: noteTypeEnum("note_type").default("informasi_umum").notNull(),
	validFrom: timestamp("valid_from"),
	validUntil: timestamp("valid_until"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const pmbDocumentsRelations = relations(pmbDocuments, ({ one }) => ({
	uploadedBy: one(users, {
		fields: [pmbDocuments.uploadedBy],
		references: [users.id],
	}),
	verifiedBy: one(users, {
		fields: [pmbDocuments.verifiedBy],
		references: [users.id],
	}),
}));

export const crmDataRelations = relations(crmData, ({ one }) => ({
	accBy: one(users, {
		fields: [crmData.accBy],
		references: [users.id],
	}),
}));

export const crmLogsRelations = relations(crmLogs, ({ one }) => ({
	author: one(users, {
		fields: [crmLogs.authorId],
		references: [users.id],
	}),
}));

export const crmDocumentsRelations = relations(crmDocuments, ({ one }) => ({
	uploadedBy: one(users, {
		fields: [crmDocuments.uploadedBy],
		references: [users.id],
	}),
	verifiedBy: one(users, {
		fields: [crmDocuments.verifiedBy],
		references: [users.id],
	}),
}));

export const financeDataRelations = relations(financeData, ({ one }) => ({
	accBy: one(users, {
		fields: [financeData.accBy],
		references: [users.id],
	}),
}));

export const financeDocumentsRelations = relations(
	financeDocuments,
	({ one }) => ({
		uploadedBy: one(users, {
			fields: [financeDocuments.uploadedBy],
			references: [users.id],
		}),
		verifiedBy: one(users, {
			fields: [financeDocuments.verifiedBy],
			references: [users.id],
		}),
	}),
);

export const academicDataRelations = relations(academicData, ({ one }) => ({
	accBy: one(users, {
		fields: [academicData.accBy],
		references: [users.id],
	}),
}));

export const academicDocumentsRelations = relations(
	academicDocuments,
	({ one }) => ({
		uploadedBy: one(users, {
			fields: [academicDocuments.uploadedBy],
			references: [users.id],
		}),
		verifiedBy: one(users, {
			fields: [academicDocuments.verifiedBy],
			references: [users.id],
		}),
	}),
);

export const courseGradesRelations = relations(courseGrades, ({ one }) => ({
	accBy: one(users, {
		fields: [courseGrades.accBy],
		references: [users.id],
	}),
	dosen: one(users, {
		fields: [courseGrades.dosenId],
		references: [users.id],
	}),
}));

export const courseGradeDocumentsRelations = relations(
	courseGradeDocuments,
	({ one }) => ({
		uploadedBy: one(users, {
			fields: [courseGradeDocuments.uploadedBy],
			references: [users.id],
		}),
		verifiedBy: one(users, {
			fields: [courseGradeDocuments.verifiedBy],
			references: [users.id],
		}),
		courseGrade: one(courseGrades, {
			fields: [courseGradeDocuments.courseGradeId],
			references: [courseGrades.id],
		}),
	}),
);

export const paDataRelations = relations(paData, ({ one }) => ({
	accBy: one(users, {
		fields: [paData.accBy],
		references: [users.id],
	}),
}));

export const paDocumentsRelations = relations(paDocuments, ({ one }) => ({
	uploadedBy: one(users, {
		fields: [paDocuments.uploadedBy],
		references: [users.id],
	}),
	verifiedBy: one(users, {
		fields: [paDocuments.verifiedBy],
		references: [users.id],
	}),
}));

export const internshipDataRelations = relations(internshipData, ({ one }) => ({
	accBy: one(users, {
		fields: [internshipData.accBy],
		references: [users.id],
	}),
}));

export const internshipDocumentsRelations = relations(
	internshipDocuments,
	({ one }) => ({
		uploadedBy: one(users, {
			fields: [internshipDocuments.uploadedBy],
			references: [users.id],
		}),
		verifiedBy: one(users, {
			fields: [internshipDocuments.verifiedBy],
			references: [users.id],
		}),
	}),
);

export const internalNotesRelations = relations(internalNotes, ({ one }) => ({
	author: one(users, {
		fields: [internalNotes.authorId],
		references: [users.id],
	}),
	student: one(students, {
		fields: [internalNotes.studentId],
		references: [students.id],
	}),
}));

export const studentsRelations = relations(students, ({ one }) => ({
	pa: one(users, {
		fields: [students.paId],
		references: [users.id],
	}),
}));

export const finalDecisionRelations = relations(finalDecision, ({ one }) => ({
	decidedBy: one(users, {
		fields: [finalDecision.decidedBy],
		references: [users.id],
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id],
	}),
}));
