import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	decimal,
	integer,
	json,
	jsonb,
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
	subProgram: text("sub_program"),

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
	isGapYear: boolean("is_gap_year").default(false),
	notes: text("notes"),
	isAcc: boolean("is_acc").default(false),
	accAt: timestamp("acc_at"),
	accBy: integer("acc_by").references(() => users.id),
	status: statusEnum("status").default("PERLU_PERHATIAN"),

	// Data Akuisisi (Baru)
	rekomendasi: text("rekomendasi"), // "Pendamping" | "MoU Sekolah" | "BKK" | "FKKS" | "RO Alumni" | "Staff/Team"
	timVisit: text("tim_visit"),
	timSosialisasi: text("tim_sosialisasi"),
	roReferral: text("ro_referral"),
	mitraSponsor: text("mitra_sponsor"),
	koordinator: text("koordinator"),

	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3a. PMB Payment Plan (Skema Keuangan)
export const pmbPaymentPlan = pgTable("pmb_payment_plan", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	totalBiaya: integer("total_biaya").default(0),
	pendaftaranDp: integer("pendaftaran_dp").default(0),
	totalDp: integer("total_dp").default(0),
	pembayaranAwalDp: integer("pembayaran_awal_dp").default(0),
	statusDp: boolean("status_dp").default(false), // true = LUNAS DP
	janjiTahap2: timestamp("janji_tahap2"),
	janjiTahap2Nominal: integer("janji_tahap2_nominal").default(0),
	janjiTahap2Notes: text("janji_tahap2_notes"),
	janjiTahap3: timestamp("janji_tahap3"),
	janjiTahap3Nominal: integer("janji_tahap3_nominal").default(0),
	janjiTahap3Notes: text("janji_tahap3_notes"),
	pengajuanDanaTalangan: text("pengajuan_dana_talangan"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3b. PMB Fee Disbursements (Fee Mitra)
export const pmbFeeDisbursements = pgTable("pmb_fee_disbursements", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	channel: text("channel").notNull(),
	namaReferral: text("nama_referral").notNull(),
	nominalFee: integer("nominal_fee").default(0),
	statusPencairan: text("status_pencairan").default("belum"), // "sudah" | "proses" | "belum"
	tanggalCair: timestamp("tanggal_cair"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3c. PMB Documents
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
	// New CRM Fields (v2)
	isMonitoringParent: boolean("is_monitoring_parent").default(false),
	isMonitoringIndustry: boolean("is_monitoring_industry").default(false),
	isVocabComplete: boolean("is_vocab_complete").default(false),
	hasStudyPermit: boolean("has_study_permit").default(false),
	isOdsReport: boolean("is_ods_report").default(false),
	isPrammagangReport: boolean("is_pramagang_report").default(false),
	isPrammagangDocumentation: boolean("is_pramagang_documentation").default(
		false,
	),
	hasActiveCase: boolean("has_active_case").default(false),
	caseNotes: text("case_notes"),
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
	// New CRM v2 Log Fields
	startTime: text("start_time"), // format: HH:mm
	endTime: text("end_time"), // format: HH:mm
	media: text("media"),
	location: text("location"),
	topic: text("topic"),
	agreements: jsonb("agreements").default("[]"), // Array of strings
	followUps: jsonb("follow_ups").default("[]"), // Array of { task, date, assignee, status }
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

	// Fee Sharing
	vMitra: integer("v_mitra").default(0),
	vKoordinator: integer("v_koordinator").default(0),

	// Invoice PMB
	invoiceFileUrl: text("invoice_file_url"),
	invoiceFileName: text("invoice_file_name"),
	invoiceUploadedAt: timestamp("invoice_uploaded_at"),
	invoiceUploadedBy: integer("invoice_uploaded_by").references(() => users.id),

	// Dana Talangan 2-Tahap
	danaTalaganProvider: text("dana_talangan_provider"),
	danaTalaganProviderType: text("dana_talangan_provider_type"),
	danaT1Amount: integer("dana_t1_amount").default(0),
	danaT1Date: timestamp("dana_t1_date"),
	danaT1Notes: text("dana_t1_notes"),
	isDanaT1Disbursed: boolean("is_dana_t1_disbursed").default(false),
	danaT2Amount: integer("dana_t2_amount").default(0),
	danaT2Date: timestamp("dana_t2_date"),
	danaT2Notes: text("dana_t2_notes"),
	isDanaT2Disbursed: boolean("is_dana_t2_disbursed").default(false),

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

	// Taiwan Cohort 13/14 Flag & Checks
	taiwanCohort: boolean("taiwan_cohort").default(false),
	taiwanPasFotoChecked: boolean("taiwan_pas_foto_checked").default(false),
	taiwanCvChecked: boolean("taiwan_cv_checked").default(false),
	taiwanKtmChecked: boolean("taiwan_ktm_checked").default(false),
	taiwanKhsChecked: boolean("taiwan_khs_checked").default(false),
	taiwanSl21Checked: boolean("taiwan_sl21_checked").default(false),
	taiwanAktifChecked: boolean("taiwan_aktif_checked").default(false),
	taiwanGapYearChecked: boolean("taiwan_gap_year_checked").default(false),
	taiwanPddiktiChecked: boolean("taiwan_pddikti_checked").default(false),
	taiwanPribadiChecked: boolean("taiwan_pribadi_checked").default(false),
	taiwanLolChecked: boolean("taiwan_lol_checked").default(false),
	taiwanLoaChecked: boolean("taiwan_loa_checked").default(false),
	taiwanSuhhanChecked: boolean("taiwan_suhhan_checked").default(false),

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

// 7a. Academic Attitude Logs
export const academicAttitudeLogs = pgTable("academic_attitude_logs", {
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
});

// 7b. Entrepreneurship Records (KWU)
export const entrepreneurshipRecords = pgTable("entrepreneurship_records", {
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
});

// 7c. Weekly Events
export const weeklyEvents = pgTable("weekly_events", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	eventType: text("event_type").notNull(),
	eventDate: timestamp("event_date").notNull(),
	description: text("description"),
	documentUrl: text("document_url"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const paTripartiteLogs = pgTable("pa_tripartite_logs", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	contactType: text("contact_type").notNull(), // "Orang Tua", "Mitra PJTKI", "Koordinator Lapangan"
	contactName: text("contact_name"),
	contactDate: timestamp("contact_date").notNull(),
	summary: text("summary").notNull(),
	result: text("result"),
	createdBy: integer("created_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paInterviewLogs = pgTable("pa_interview_logs", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	interviewDate: timestamp("interview_date").notNull(),
	companyName: text("company_name").notNull(),
	country: text("country"),
	result: text("result").notNull(), // "Lulus", "Tidak Lulus", "Menunggu"
	notes: text("notes"),
	createdBy: integer("created_by").references(() => users.id),
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

	// State Machine Kontrak Taiwan (LoL->LoA->MoA)
	lolReady: boolean("lol_ready").default(false),
	lolDate: timestamp("lol_date"),
	lolNotes: text("lol_notes"),
	loaConfirmed: boolean("loa_confirmed").default(false),
	loaDate: timestamp("loa_date"),
	moaReady: boolean("moa_ready").default(false),
	moaDate: timestamp("moa_date"),
	moaNotes: text("moa_notes"),

	// Schedule
	estDepartureDate: timestamp("est_departure_date"),
	destinationCity: text("destination_city"),
	internshipDuration: text("internship_duration"),
	internshipCompany: text("internship_company"),

	// Dana Talangan - Tahap 1
	danaTahap1Amount: integer("dana_tahap1_amount").default(0),
	danaTahap1Date: timestamp("dana_tahap1_date"),
	danaTahap1Notes: text("dana_tahap1_notes"),
	isDanaTahap1Disbursed: boolean("is_dana_tahap1_disbursed").default(false),

	// Dana Talangan - Tahap 2
	danaTahap2Amount: integer("dana_tahap2_amount").default(0),
	danaTahap2Date: timestamp("dana_tahap2_date"),
	danaTahap2Notes: text("dana_tahap2_notes"),
	isDanaTahap2Disbursed: boolean("is_dana_tahap2_disbursed").default(false),

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

export const internshipMonitoringSchedule = pgTable(
	"internship_monitoring_schedule",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		scheduledDate: timestamp("scheduled_date").notNull(),
		completedAt: timestamp("completed_at"),
		monitoringNotes: text("monitoring_notes"),
		condition: text("condition"), // "Baik" | "Perlu Perhatian" | "Kritis"
		conductedBy: integer("conducted_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
);

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
	confidentialNotes: text("confidential_notes"),
	skDocumentUrl: text("sk_document_url"),
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

// 13. Post-Internship Documents (Pasca-Magang)
export const postInternshipDocs = pgTable("post_internship_docs", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	documentKey: text("document_key").notNull(), // "logbook", "laporan", "video"
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
export const pmbDataRelations = relations(pmbData, ({ one }) => ({
	accBy: one(users, {
		fields: [pmbData.accBy],
		references: [users.id],
	}),
}));

export const pmbPaymentPlanRelations = relations(pmbPaymentPlan, ({ one }) => ({
	student: one(students, {
		fields: [pmbPaymentPlan.studentId],
		references: [students.id],
	}),
}));

export const pmbFeeDisbursementsRelations = relations(
	pmbFeeDisbursements,
	({ one }) => ({
		student: one(students, {
			fields: [pmbFeeDisbursements.studentId],
			references: [students.id],
		}),
	}),
);

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
	invoiceUploadedBy: one(users, {
		fields: [financeData.invoiceUploadedBy],
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

export const paTripartiteLogsRelations = relations(
	paTripartiteLogs,
	({ one }) => ({
		createdBy: one(users, {
			fields: [paTripartiteLogs.createdBy],
			references: [users.id],
		}),
	}),
);

export const paInterviewLogsRelations = relations(
	paInterviewLogs,
	({ one }) => ({
		createdBy: one(users, {
			fields: [paInterviewLogs.createdBy],
			references: [users.id],
		}),
	}),
);

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

export const academicAttitudeLogsRelations = relations(
	academicAttitudeLogs,
	({ one }) => ({
		dosenId: one(users, {
			fields: [academicAttitudeLogs.dosenId],
			references: [users.id],
		}),
	}),
);

// 14. Vocational Budgets & Requests
export const vocationalMonthlyBudgets = pgTable("vocational_monthly_budgets", {
	id: serial("id").primaryKey(),
	className: text("class_name").notNull(),
	month: integer("month").notNull(),
	year: integer("year").notNull(),
	maxBudget: decimal("max_budget", { precision: 12, scale: 2 }).notNull(),
	approvedTotal: decimal("approved_total", { precision: 12, scale: 2 }).default(
		"0",
	),
	notes: text("notes"),
	createdBy: integer("created_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vocationalBudgetRequests = pgTable("vocational_budget_requests", {
	id: serial("id").primaryKey(),
	className: text("class_name").notNull(),
	subject: text("subject").notNull(),
	weekNumber: integer("week_number").notNull(),
	requestDate: date("request_date").notNull(),
	materials: jsonb("materials").notNull(), // [{ name, qty, unit, estPrice }]
	totalEstimate: decimal("total_estimate", {
		precision: 12,
		scale: 2,
	}).notNull(),
	status: text("status").default("pending"), // pending | approved | rejected
	notes: text("notes"),
	submittedBy: integer("submitted_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vocationalMonthlyBudgetsRelations = relations(
	vocationalMonthlyBudgets,
	({ one }) => ({
		creator: one(users, {
			fields: [vocationalMonthlyBudgets.createdBy],
			references: [users.id],
		}),
	}),
);

export const vocationalBudgetRequestsRelations = relations(
	vocationalBudgetRequests,
	({ one }) => ({
		submitter: one(users, {
			fields: [vocationalBudgetRequests.submittedBy],
			references: [users.id],
		}),
	}),
);

export const vocationalLeftovers = pgTable("vocational_leftovers", {
	id: serial("id").primaryKey(),
	className: text("class_name").notNull(),
	subject: text("subject").notNull(),
	reportDate: date("report_date").notNull(),
	materialName: text("material_name").notNull(),
	qty: decimal("qty", { precision: 10, scale: 2 }).notNull(),
	unit: text("unit").notNull(),
	condition: text("condition").notNull(), // "Layak Pakai" | "Rusak/Kadaluarsa"
	notes: text("notes"),
	reportedBy: integer("reported_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vocationalLeftoversRelations = relations(
	vocationalLeftovers,
	({ one }) => ({
		reporter: one(users, {
			fields: [vocationalLeftovers.reportedBy],
			references: [users.id],
		}),
	}),
);
