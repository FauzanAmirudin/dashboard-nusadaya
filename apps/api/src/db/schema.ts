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
	varchar,
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
	"mahasiswa",
]);

export const studentStatusEnum = pgEnum("student_status", [
	"aktif",
	"cuti",
	"alumni",
	"keluar",
	"dropout",
	"mengundurkan_diri",
	"lulus",
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

export const formResponseStatusEnum = pgEnum("form_response_status", [
	"PENDING",
	"APPROVED",
	"REJECTED",
]);

export const courseTypeEnum = pgEnum("course_type", ["teori", "praktik"]);

export const meetingTypeEnum = pgEnum("meeting_type", [
	"pkkmb",
	"beginning",
	"regular",
	"uts",
	"uas",
]);

export const activityTypeEnum = pgEnum("activity_type", [
	"teori",
	"tugas",
	"praktik",
	"ujian",
]);

// 1. Users (RBAC)
export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	username: text("username").unique().notNull(),
	passwordHash: text("password_hash").notNull(),
	fullName: text("full_name").notNull(),
	role: roleEnum("role").notNull(),
	roles: jsonb("roles").$type<string[]>().default([]),
	email: text("email"),
	phone: text("phone"),
	profilePhotoUrl: text("profile_photo_url"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Students
export const students = pgTable("students", {
	id: serial("id").primaryKey(),
	nim: text("nim").unique(),
	name: text("name").notNull(),
	nickname: text("nickname"), // Nama panggilan
	cohort: integer("cohort").notNull(),
	program: text("program").notNull(),
	subProgram: text("sub_program"),

	// New fields
	birthPlace: text("birth_place"),
	birthDate: timestamp("birth_date"),
	gender: text("gender"), // Laki-laki / Perempuan
	religion: text("religion"),
	nationality: text("nationality"), // Indonesia / Lainnya

	// Alamat Granular
	addressStreet: text("address_street"),
	addressRt: text("address_rt"),
	addressRw: text("address_rw"),
	addressNo: text("address_no"),
	addressVillage: text("address_village"),
	addressDistrict: text("address_district"),
	addressCity: text("address_city"),
	addressProvince: text("address_province"),
	livingWith: text("living_with"), // Orang tua / Wali / Sendiri (Kos)
	schoolOrigin: text("school_origin"),
	schoolAddress: text("school_address"),
	schoolMajor: text("school_major"),
	graduationYear: integer("graduation_year"),
	classType: text("class_type"), // Online-LMS / Offline
	academicYear: text("academic_year"),
	batch: integer("batch"),

	phone: text("phone"),
	email: text("email"),
	parentName: text("parent_name"),
	parentJob: text("parent_job"),
	parentIncome: text("parent_income"),
	parentPhone: text("parent_phone"),
	paId: integer("pa_id").references(() => users.id),
	studentStatus: studentStatusEnum("student_status").default("aktif"),
	destinationCountry: text("destination_country"),
	period: text("period"),
	profilePhotoUrl: text("profile_photo_url"),

	overallStatus: statusEnum("overall_status").default("AMAN"),
	isArchived: boolean("is_archived").default(false),
	studentUserId: integer("student_user_id").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2a. Student Health
export const studentHealth = pgTable("student_health", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	bloodType: text("blood_type"),
	diseaseHistory: text("disease_history"),
	congenitalDisease: text("congenital_disease"),
	height: integer("height"),
	weight: integer("weight"),
	clothingSize: text("clothing_size"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2b. Student Parents / Guardians
export const studentParents = pgTable("student_parents", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	type: text("type").notNull(), // "ayah" | "ibu" | "wali"
	name: text("name"),
	birthPlace: text("birth_place"),
	birthDate: timestamp("birth_date"),
	religion: text("religion"),
	nationality: text("nationality"),
	education: text("education"),
	job: text("job"),
	address: text("address"),
	phone: text("phone"),
	email: text("email"),
	status: text("status"), // "Hidup" | "Meninggal" (Untuk Ayah/Ibu)
	guardianRelation: text("guardian_relation"), // Hubungan dengan mahasiswa (Khusus Wali)
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

	// 10 Dokumen Tambahan PMB Validation Checks
	docKtp: boolean("doc_ktp").default(false),
	docKk: boolean("doc_kk").default(false),
	docCv: boolean("doc_cv").default(false),
	docIjazah: boolean("doc_ijazah").default(false),
	docTranskrip: boolean("doc_transkrip").default(false),
	docPassportDepan: boolean("doc_passport_depan").default(false),
	docPassportVisa: boolean("doc_passport_visa").default(false),
	docSkbm: boolean("doc_skbm").default(false),
	docMcu: boolean("doc_mcu").default(false),
	docSertifikasiBahasa: boolean("doc_sertifikasi_bahasa").default(false),

	// Finance Integration
	rumahJuang: boolean("rumah_juang").default(false),

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
	odsDetails: jsonb("ods_details").default("[]"),
	pramagangStartDate: timestamp("pramagang_start_date", { mode: "string" }),
	pramagangEndDate: timestamp("pramagang_end_date", { mode: "string" }),
	pramagangIndustry: varchar("pramagang_industry", { length: 255 }),
	pramagangVideoLink: text("pramagang_video_link"),
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
	logType: varchar("log_type", { length: 50 }).default("modul_crm"), // modul_crm, orang_tua_masalah, orang_tua_komunikasi, industri_masalah
	attachments: jsonb("attachments").default("[]"), // Array of photo URLs
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

	// Data Induk dari PMB / Finance
	totalBiayaPendidikan: integer("total_biaya_pendidikan").default(0),
	totalBiayaPromosi: integer("total_biaya_promosi").default(0),

	// Registrasi Awal
	registrasiNominal: integer("registrasi_nominal").default(0),
	registrasiPaidDate: timestamp("registrasi_paid_date"),
	registrasiBuktiBayarUrl: text("registrasi_bukti_bayar_url"),
	registrasiStatus: boolean("registrasi_status").default(false),

	// Metode Pembayaran Lanjutan
	metodePembayaran: text("metode_pembayaran"), // "mandiri" | "dana_talangan"

	// Dana Mandiri
	mandiriSemesterNominal: integer("mandiri_semester_nominal").default(0),
	mandiriSemesterStatus: boolean("mandiri_semester_status").default(false),
	mandiriSemesterBuktiBayarUrl: text("mandiri_semester_bukti_bayar_url"),
	mandiriInterviewNominal: integer("mandiri_interview_nominal").default(0),
	mandiriInterviewStatus: boolean("mandiri_interview_status").default(false),
	mandiriInterviewBuktiBayarUrl: text("mandiri_interview_bukti_bayar_url"),
	mandiriKeberangkatanNominal: integer("mandiri_keberangkatan_nominal").default(
		0,
	),
	mandiriKeberangkatanStatus: boolean("mandiri_keberangkatan_status").default(
		false,
	),
	mandiriKeberangkatanBuktiBayarUrl: text(
		"mandiri_keberangkatan_bukti_bayar_url",
	),

	// Dana Talangan Tahap 1 — Semester
	t1SemesterNominalTotal: integer("t1_semester_nominal_total").default(0),
	t1SemesterNominalDibayar: integer("t1_semester_nominal_dibayar").default(0),
	t1SemesterNominalTalangan: integer("t1_semester_nominal_talangan").default(0),
	t1SemesterJumlahCicilan: integer("t1_semester_jumlah_cicilan").default(0),
	t1SemesterCicilanKe: integer("t1_semester_cicilan_ke").default(0),
	t1SemesterStatus: boolean("t1_semester_status").default(false),

	// Dana Talangan Tahap 1 — Interview Magang
	t1InterviewNominal: integer("t1_interview_nominal").default(0),
	t1InterviewStatus: boolean("t1_interview_status").default(false),
	t1InterviewBuktiBayarUrl: text("t1_interview_bukti_bayar_url"),

	// Dana Talangan Tahap 2 — Keberangkatan
	t2KeberangkatanNominal: integer("t2_keberangkatan_nominal").default(0),
	t2KeberangkatanStatus: boolean("t2_keberangkatan_status").default(false),
	t2KeberangkatanBuktiBayarUrl: text("t2_keberangkatan_bukti_bayar_url"),

	// Biaya Administrasi Talangan
	adminTalaganNominal: integer("admin_talagan_nominal").default(0),
	adminTalaganMetode: text("admin_talagan_metode"), // "cash" | "transfer"
	adminTalaganBankTujuan: text("admin_talagan_bank_tujuan"),
	adminTalaganBuktiBayarUrl: text("admin_talagan_bukti_bayar_url"),
	adminTalaganStatus: boolean("admin_talagan_status").default(false),

	// Biaya Tambahan Standar
	toeicNominal: integer("toeic_nominal").default(0),
	toeicStatus: boolean("toeic_status").default(false),
	toeicBuktiBayarUrl: text("toeic_bukti_bayar_url"),
	pasporNominal: integer("paspor_nominal").default(0),
	pasporStatus: boolean("paspor_status").default(false),
	pasporBuktiBayarUrl: text("paspor_bukti_bayar_url"),
	rumahJuangAktif: boolean("rumah_juang_aktif").default(false),
	rumahJuangNominal: integer("rumah_juang_nominal").default(0),
	rumahJuangStatus: boolean("rumah_juang_status").default(false),
	rumahJuangBuktiBayarUrl: text("rumah_juang_bukti_bayar_url"),

	// Kontrol
	notes: text("notes"),
	isAcc: boolean("is_acc").default(false),
	accAt: timestamp("acc_at"),
	accBy: integer("acc_by").references(() => users.id),
	status: statusEnum("status").default("PERLU_PERHATIAN"),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const financeCustomFields = pgTable("finance_custom_fields", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	fieldType: text("field_type").notNull(), // "pembayaran_utama" | "biaya_tambahan"
	label: text("label").notNull(),
	nominal: integer("nominal").default(0),
	status: boolean("status").default(false),
	notes: text("notes"),
	buktiBayarUrl: text("bukti_bayar_url"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const financeSemesters = pgTable("finance_semesters", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	semesterNumber: integer("semester_number").notNull(), // 1–6
	totalBilled: integer("total_billed").default(0),
	isTalangan: boolean("is_talangan").default(false),
	notes: text("notes"),
	status: text("status").default("BELUM_BAYAR"), // "BELUM_BAYAR" | "SEBAGIAN" | "LUNAS"
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const financeSemesterInstallments = pgTable(
	"finance_semester_installments",
	{
		id: serial("id").primaryKey(),
		semesterId: integer("semester_id")
			.references(() => financeSemesters.id)
			.notNull(),
		installmentNumber: integer("installment_number").notNull(),
		nominalPaid: integer("nominal_paid").notNull(),
		paymentDate: timestamp("payment_date"),
		buktiBayarUrl: text("bukti_bayar_url"),
		notes: text("notes"),
		isTalangan: boolean("is_talangan").default(false),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
);

export const financeSemestersRelations = relations(
	financeSemesters,
	({ one, many }) => ({
		student: one(students, {
			fields: [financeSemesters.studentId],
			references: [students.id],
		}),
		installments: many(financeSemesterInstallments),
	}),
);

export const financeSemesterInstallmentsRelations = relations(
	financeSemesterInstallments,
	({ one }) => ({
		semester: one(financeSemesters, {
			fields: [financeSemesterInstallments.semesterId],
			references: [financeSemesters.id],
		}),
	}),
);

export const financeTalanganInstallments = pgTable(
	"finance_talangan_installments",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		stage: text("stage").notNull(), // "tahap_1" | "tahap_2"
		installmentNumber: integer("installment_number").notNull(),
		nominalPaid: integer("nominal_paid").notNull(),
		paymentDate: timestamp("payment_date"),
		buktiBayarUrl: text("bukti_bayar_url"),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
);

export const financeTalanganInstallmentsRelations = relations(
	financeTalanganInstallments,
	({ one }) => ({
		student: one(students, {
			fields: [financeTalanganInstallments.studentId],
			references: [students.id],
		}),
	}),
);

export const feeShareRecipients = pgTable("fee_share_recipients", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	namaReferral: text("nama_referral").notNull(),
	kategori: text("kategori").notNull(), // "Mitra" | "Koordinator" | "Tim Visit" | "Sekolah" | "BKK/FKKS" | "Tim Nusadaya"
	noRekening: text("no_rekening"),
	namaBank: text("nama_bank"),
	noHp: text("no_hp"),
	nominalFee: integer("nominal_fee").default(0),
	invoiceFileUrl: text("invoice_file_url"),
	statusPencairan: text("status_pencairan").default("belum_dibayarkan"), // "belum_dibayarkan" | "sudah_dibayarkan"
	tanggalCair: timestamp("tanggal_cair"),
	createdBy: integer("created_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const practicesBudgetRequests = pgTable("practices_budget_requests", {
	id: serial("id").primaryKey(),
	dosenId: integer("dosen_id")
		.references(() => users.id)
		.notNull(),
	courseId: integer("course_id")
		.references(() => courses.id)
		.notNull(),
	daftarKebutuhan: jsonb("daftar_kebutuhan").notNull(), // array of { namaItem, jumlah, satuanHarga }
	totalNominal: integer("total_nominal").default(0),
	status: text("status").default("menunggu"), // "menunggu" | "disetujui" | "ditolak"
	catatanFinance: text("catatan_finance"),
	approvedBy: integer("approved_by").references(() => users.id),
	approvedAt: timestamp("approved_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const practicesMaterialReports = pgTable("practices_material_reports", {
	id: serial("id").primaryKey(),
	budgetRequestId: integer("budget_request_id")
		.references(() => practicesBudgetRequests.id)
		.notNull(),
	dosenId: integer("dosen_id")
		.references(() => users.id)
		.notNull(),
	daftarSisaBahan: jsonb("daftar_sisa_bahan").notNull(), // array of { namaItem, jumlahSisa }
	catatanDosen: text("catatan_dosen"),
	fileUrl: text("file_url"),
	fileName: text("file_name"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const practicesBudgetRequestsRelations = relations(
	practicesBudgetRequests,
	({ one, many }) => ({
		dosen: one(users, {
			fields: [practicesBudgetRequests.dosenId],
			references: [users.id],
		}),
		course: one(courses, {
			fields: [practicesBudgetRequests.courseId],
			references: [courses.id],
		}),
		approvedBy: one(users, {
			fields: [practicesBudgetRequests.approvedBy],
			references: [users.id],
		}),
		materialReports: many(practicesMaterialReports),
	}),
);

export const practicesMaterialReportsRelations = relations(
	practicesMaterialReports,
	({ one }) => ({
		budgetRequest: one(practicesBudgetRequests, {
			fields: [practicesMaterialReports.budgetRequestId],
			references: [practicesBudgetRequests.id],
		}),
		dosen: one(users, {
			fields: [practicesMaterialReports.dosenId],
			references: [users.id],
		}),
	}),
);

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
});

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
);

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
	type: text("type").default("konseling").notNull(), // "konseling" | "konseling_mental"
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

// PA Hafalan Sessions (Setoran Hafalan)
export const paHafalanSessions = pgTable("pa_hafalan_sessions", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	language: text("language").notNull(), // "inggris" | "mandarin" | "lainnya"
	languageCustom: text("language_custom"),
	vocabCount: integer("vocab_count").default(0).notNull(),
	sentenceCount: integer("sentence_count").default(0).notNull(),
	createdBy: integer("created_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PA Student Notes (Catatan Mahasiswa)
export const paStudentNotes = pgTable("pa_student_notes", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	type: text("type").notNull(), // "kedisiplinan" | "internal"
	content: text("content").notNull(),
	createdBy: integer("created_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 9. Internship Data
export const internshipData = pgTable("internship_data", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),

	// 0. Pra-Paspor (Kelayakan)
	praPasporPasFoto: boolean("pra_paspor_pas_foto").default(false),
	praPasporKtm: boolean("pra_paspor_ktm").default(false),
	praPasporKtp: boolean("pra_paspor_ktp").default(false),
	praPasporKk: boolean("pra_paspor_kk").default(false),
	praPasporAktaKelahiran: boolean("pra_paspor_akta_kelahiran").default(false),
	praPasporSl21: boolean("pra_paspor_sl21").default(false),
	praPasporSkma: boolean("pra_paspor_skma").default(false),
	praPasporRekomendasiDisdik: boolean("pra_paspor_rekomendasi_disdik").default(
		false,
	),
	praPasporGapYear: boolean("pra_paspor_gap_year").default(false),
	praPasporPddikti: boolean("pra_paspor_pddikti").default(false),
	praPasporCv: boolean("pra_paspor_cv").default(false),

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
	pdtEndDate: timestamp("pdt_end_date"),
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
	dokumentasiReady: boolean("dokumentasi_ready").default(false),
	dokumentasiKeberangkatanLink: text("dokumentasi_keberangkatan_link"),
	agenReady: boolean("agen_ready").default(false),
	agenNegaraTujuan: text("agen_negara_tujuan"),
	agenPeminatan: text("agen_peminatan"),

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

	// 9. Post-Internship (Syarat Akhir)
	logbookReady: boolean("logbook_ready").default(false),
	laporanAkhirReady: boolean("laporan_akhir_ready").default(false),
	videoDokumentasiReady: boolean("video_dokumentasi_ready").default(false),
	videoDokumentasiLink: text("video_dokumentasi_link"),

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

// 14. Departure Assessments (Assessment Pra-keberangkatan)
export const departureAssessments = pgTable("departure_assessments", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull()
		.unique(),
	score: integer("score"), // 0-100, null = belum diisi
	notes: text("notes"),
	resultFileUrl: text("result_file_url"),
	resultFileName: text("result_file_name"),
	resultFileSize: integer("result_file_size"),
	// "belum_dimulai" | "nilai_diisi" | "pdf_diunggah" | "selesai"
	status: text("status").default("belum_dimulai").notNull(),
	assessedBy: integer("assessed_by").references(() => users.id),
	assessedAt: timestamp("assessed_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 14b. Departure Assessment Notes
export const departureAssessmentNotes = pgTable("departure_assessment_notes", {
	id: serial("id").primaryKey(),
	assessmentId: integer("assessment_id")
		.references(() => departureAssessments.id)
		.notNull(),
	content: text("content").notNull(),
	createdBy: integer("created_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const academicDataRelations = relations(
	academicData,
	({ one, many }) => ({
		student: one(students, {
			fields: [academicData.studentId],
			references: [students.id],
		}),
		accBy: one(users, {
			fields: [academicData.accBy],
			references: [users.id],
		}),
	}),
);

export const overseasProgramChecklistsRelations = relations(
	overseasProgramChecklists,
	({ one }) => ({
		student: one(students, {
			fields: [overseasProgramChecklists.studentId],
			references: [students.id],
		}),
	}),
);

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
	course: one(courses, {
		fields: [courseGrades.courseId],
		references: [courses.id],
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

export const studentsRelations = relations(students, ({ one, many }) => ({
	pa: one(users, {
		fields: [students.paId],
		references: [users.id],
	}),
	health: one(studentHealth, {
		fields: [students.id],
		references: [studentHealth.studentId],
	}),
	parents: many(studentParents),
	departureAssessment: one(departureAssessments, {
		fields: [students.id],
		references: [departureAssessments.studentId],
	}),
}));

export const departureAssessmentsRelations = relations(
	departureAssessments,
	({ one, many }) => ({
		student: one(students, {
			fields: [departureAssessments.studentId],
			references: [students.id],
		}),
		assessedByUser: one(users, {
			fields: [departureAssessments.assessedBy],
			references: [users.id],
		}),
		notes: many(departureAssessmentNotes),
	}),
);

export const departureAssessmentNotesRelations = relations(
	departureAssessmentNotes,
	({ one }) => ({
		assessment: one(departureAssessments, {
			fields: [departureAssessmentNotes.assessmentId],
			references: [departureAssessments.id],
		}),
		author: one(users, {
			fields: [departureAssessmentNotes.createdBy],
			references: [users.id],
		}),
	}),
);

export const paHafalanSessionsRelations = relations(
	paHafalanSessions,
	({ one }) => ({
		student: one(students, {
			fields: [paHafalanSessions.studentId],
			references: [students.id],
		}),
		createdByUser: one(users, {
			fields: [paHafalanSessions.createdBy],
			references: [users.id],
		}),
	}),
);

export const paStudentNotesRelations = relations(paStudentNotes, ({ one }) => ({
	student: one(students, {
		fields: [paStudentNotes.studentId],
		references: [students.id],
	}),
	createdByUser: one(users, {
		fields: [paStudentNotes.createdBy],
		references: [users.id],
	}),
}));

export const studentParentsRelations = relations(studentParents, ({ one }) => ({
	student: one(students, {
		fields: [studentParents.studentId],
		references: [students.id],
	}),
}));

export const studentHealthRelations = relations(studentHealth, ({ one }) => ({
	student: one(students, {
		fields: [studentHealth.studentId],
		references: [students.id],
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

// 15. PMB Form Registrations
export const pmbFormTokens = pgTable("pmb_form_tokens", {
	id: serial("id").primaryKey(),
	token: varchar("token", { length: 255 }).unique().notNull(), // UUID v4
	createdBy: integer("created_by").references(() => users.id),
	isUsed: boolean("is_used").default(false),
	usedAt: timestamp("used_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pmbFormResponses = pgTable("pmb_form_responses", {
	id: serial("id").primaryKey(),
	tokenId: integer("token_id")
		.references(() => pmbFormTokens.id)
		.unique()
		.notNull(),
	status: formResponseStatusEnum("status").default("PENDING"),

	// Tab 1: Keterangan Mahasiswa
	name: text("name").notNull(),
	nickname: text("nickname"),
	gender: text("gender"),
	birthPlace: text("birth_place"),
	birthDate: timestamp("birth_date"),
	religion: text("religion"),
	nationality: text("nationality"),
	addressStreet: text("address_street"),
	addressRt: text("address_rt"),
	addressRw: text("address_rw"),
	addressNo: text("address_no"),
	addressVillage: text("address_village"),
	addressDistrict: text("address_district"),
	addressCity: text("address_city"),
	addressProvince: text("address_province"),
	livingWith: text("living_with"),
	phone: text("phone"),
	email: text("email"),
	profilePhotoUrl: text("profile_photo_url"),

	// Tab 2: Pendidikan
	schoolOrigin: text("school_origin"),
	schoolAddress: text("school_address"),
	schoolMajor: text("school_major"),
	graduationYear: integer("graduation_year"),
	program: text("program"),
	subProgram: text("sub_program"),
	classType: text("class_type"),
	batch: integer("batch"),
	academicYear: text("academic_year"),

	// Tab 3: Kesehatan
	bloodType: text("blood_type"),
	diseaseHistory: text("disease_history"),
	congenitalDisease: text("congenital_disease"),
	height: decimal("height", { precision: 5, scale: 2 }),
	weight: decimal("weight", { precision: 5, scale: 2 }),
	clothingSize: text("clothing_size"),

	// Tab 4: Ayah
	ayahName: text("ayah_name"),
	ayahBirthPlace: text("ayah_birth_place"),
	ayahBirthDate: timestamp("ayah_birth_date"),
	ayahReligion: text("ayah_religion"),
	ayahNationality: text("ayah_nationality"),
	ayahEducation: text("ayah_education"),
	ayahJob: text("ayah_job"),
	ayahAddress: text("ayah_address"),
	ayahPhone: text("ayah_phone"),
	ayahEmail: text("ayah_email"),
	ayahStatus: text("ayah_status"),

	// Tab 5: Ibu
	ibuName: text("ibu_name"),
	ibuBirthPlace: text("ibu_birth_place"),
	ibuBirthDate: timestamp("ibu_birth_date"),
	ibuReligion: text("ibu_religion"),
	ibuNationality: text("ibu_nationality"),
	ibuEducation: text("ibu_education"),
	ibuJob: text("ibu_job"),
	ibuAddress: text("ibu_address"),
	ibuPhone: text("ibu_phone"),
	ibuEmail: text("ibu_email"),
	ibuStatus: text("ibu_status"),

	// Tab 6: Wali
	waliName: text("wali_name"),
	waliBirthPlace: text("wali_birth_place"),
	waliBirthDate: timestamp("wali_birth_date"),
	waliReligion: text("wali_religion"),
	waliNationality: text("wali_nationality"),
	waliEducation: text("wali_education"),
	waliJob: text("wali_job"),
	waliAddress: text("wali_address"),
	waliPhone: text("wali_phone"),
	waliEmail: text("wali_email"),
	waliGuardianRelation: text("wali_guardian_relation"),

	// Metadata
	submittedAt: timestamp("submitted_at").defaultNow().notNull(),
	processedAt: timestamp("processed_at"),
	processedBy: integer("processed_by").references(() => users.id),
	rejectionNotes: text("rejection_notes"),
	studentId: integer("student_id").references(() => students.id),
});

export const pmbFormTokensRelations = relations(pmbFormTokens, ({ one }) => ({
	creator: one(users, {
		fields: [pmbFormTokens.createdBy],
		references: [users.id],
	}),
	response: one(pmbFormResponses, {
		fields: [pmbFormTokens.id],
		references: [pmbFormResponses.tokenId],
	}),
}));

export const pmbFormResponsesRelations = relations(
	pmbFormResponses,
	({ one }) => ({
		token: one(pmbFormTokens, {
			fields: [pmbFormResponses.tokenId],
			references: [pmbFormTokens.id],
		}),
		processor: one(users, {
			fields: [pmbFormResponses.processedBy],
			references: [users.id],
		}),
		student: one(students, {
			fields: [pmbFormResponses.studentId],
			references: [students.id],
		}),
	}),
);

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE SYSTEM — File Metadata & Backup Jobs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tabel `files` — metadata semua file yang tersimpan di storage.
 *
 * PostgreSQL HANYA menyimpan metadata (path, checksum, mime_type, dll.).
 * File fisik tersimpan di local storage (atau nanti S3) via FileService.
 *
 * Prinsip:
 * - storagePath berisi path relatif dari base STORAGE_PATH
 * - filename adalah nama file fisik (ULID + ext), bukan nama asli
 * - originalName adalah nama asli dari user (disimpan untuk referensi)
 * - deletedAt digunakan untuk soft delete (audit trail), bukan hard delete langsung
 */
export const files = pgTable("files", {
	id: text("id").primaryKey(), // ULID
	studentId: integer("student_id").references(() => students.id), // null untuk file non-mahasiswa
	category: text("category").notNull(), // "identity" | "academic" | "profile" | "finance" | "internship" | "thesis" | "certificates" | "achievement" | "other"
	storageDisk: text("storage_disk").default("local").notNull(), // "local" | "s3"
	storagePath: text("storage_path").notNull(), // path relatif, e.g. "students/42/identity/01KABC.pdf"
	filename: text("filename").notNull(), // nama file fisik (ULID + ext)
	originalName: text("original_name").notNull(), // nama asli dari user, e.g. "KTP.pdf"
	extension: text("extension").notNull(), // "pdf" | "jpg" | "png" | dll.
	mimeType: text("mime_type").notNull(),
	size: integer("size").notNull(), // bytes
	checksum: text("checksum"), // sha256:<hex>
	visibility: text("visibility").default("private").notNull(), // "private" | "public"
	uploadedBy: integer("uploaded_by").references(() => users.id),
	panel: text("panel"), // "pmb" | "finance" | "akademik" | "pa" | "magang" | "dosen" | dll.
	documentKey: text("document_key"), // kunci unik per jenis dokumen dalam panel
	isVerified: boolean("is_verified").default(false),
	verifiedAt: timestamp("verified_at"),
	verifiedBy: integer("verified_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at"), // soft delete untuk audit trail
});

export const filesRelations = relations(files, ({ one }) => ({
	student: one(students, {
		fields: [files.studentId],
		references: [students.id],
	}),
	uploader: one(users, {
		fields: [files.uploadedBy],
		references: [users.id],
	}),
}));

/**
 * Tabel `backup_jobs` — tracking pekerjaan backup.
 *
 * - Status final (queued/processing/completed/failed) disimpan di PostgreSQL.
 * - Progress real-time (percentage, current_file) disimpan di Redis (bukan di sini).
 * - filters berisi kriteria backup sebagai JSON dinamis (tidak di-hardcode).
 */
export const backupJobs = pgTable("backup_jobs", {
	id: text("id").primaryKey(), // ULID
	type: text("type").notNull(), // "student" | "cohort" | "program" | "specialization" | "full"
	status: text("status").default("queued").notNull(), // "queued" | "processing" | "completed" | "failed"
	filters: jsonb("filters"), // { studentId?, cohortId?, programId?, specializationId?, category?, dateFrom?, dateTo? }
	totalFiles: integer("total_files").default(0),
	processedFiles: integer("processed_files").default(0),
	totalSize: integer("total_size").default(0), // bytes
	outputPath: text("output_path"),
	createdBy: integer("created_by").references(() => users.id),
	startedAt: timestamp("started_at"),
	completedAt: timestamp("completed_at"),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const backupJobsRelations = relations(backupJobs, ({ one }) => ({
	creator: one(users, {
		fields: [backupJobs.createdBy],
		references: [users.id],
	}),
}));

// ==========================================
// KALENDER AKADEMIK
// ==========================================

export const academicPeriodTypeEnum = pgEnum("academic_period_type", [
	"beginning_class",
	"pertemuan",
	"uts",
	"uas",
	"pkkmb",
	"custom",
]);

export const academicCalendars = pgTable("academic_calendars", {
	id: serial("id").primaryKey(),
	academicYear: text("academic_year").notNull(), // e.g. "2024/2025"
	cohort: integer("cohort").notNull(), // e.g. 13
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	status: text("status").default("active").notNull(), // "active" | "draft" | "archived"
	createdBy: integer("created_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const academicPeriods = pgTable("academic_periods", {
	id: serial("id").primaryKey(),
	calendarId: integer("calendar_id")
		.notNull()
		.references(() => academicCalendars.id, { onDelete: "cascade" }),
	title: text("title").notNull(), // e.g. "Pertemuan 1", "UTS", dsb
	description: text("description"), // Custom Deskripsi (sesuai UI)
	periodType: academicPeriodTypeEnum("period_type").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	orderIndex: integer("order_index").default(0).notNull(), // Untuk urutan tampilan
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const academicEvents = pgTable("academic_events", {
	id: serial("id").primaryKey(),
	calendarId: integer("calendar_id")
		.notNull()
		.references(() => academicCalendars.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	description: text("description"),
	startDate: date("start_date").notNull(),
	endDate: date("end_date"), // Opsional, jika null maka single-day event
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const academicCalendarsRelations = relations(
	academicCalendars,
	({ many, one }) => ({
		creator: one(users, {
			fields: [academicCalendars.createdBy],
			references: [users.id],
		}),
		periods: many(academicPeriods),
		events: many(academicEvents),
	}),
);

export const academicPeriodsRelations = relations(
	academicPeriods,
	({ one }) => ({
		calendar: one(academicCalendars, {
			fields: [academicPeriods.calendarId],
			references: [academicCalendars.id],
		}),
	}),
);

export const academicEventsRelations = relations(academicEvents, ({ one }) => ({
	calendar: one(academicCalendars, {
		fields: [academicEvents.calendarId],
		references: [academicCalendars.id],
	}),
}));

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULING (JADWAL KELAS, PRAKTIKUM, PIKET) & PENGUMUMAN
// ─────────────────────────────────────────────────────────────────────────────

export const classSchedules = pgTable("class_schedules", {
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
});

export const practicumSchedules = pgTable("practicum_schedules", {
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
});

export const dutySchedules = pgTable("duty_schedules", {
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
});

export const announcements = pgTable("announcements", {
	id: serial("id").primaryKey(),
	title: text("title").notNull(),
	description: text("description").notNull(), // Stored as HTML from tiptap
	targetCohort: integer("target_cohort"), // null means all cohorts
	publishedAt: date("published_at").notNull(),
	createdBy: integer("created_by").references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const classSchedulesRelations = relations(classSchedules, ({ one }) => ({
	dosen: one(users, {
		fields: [classSchedules.dosenId],
		references: [users.id],
	}),
	calendar: one(academicCalendars, {
		fields: [classSchedules.calendarId],
		references: [academicCalendars.id],
	}),
}));

export const practicumSchedulesRelations = relations(
	practicumSchedules,
	({ one }) => ({
		dosen: one(users, {
			fields: [practicumSchedules.dosenId],
			references: [users.id],
		}),
		calendar: one(academicCalendars, {
			fields: [practicumSchedules.calendarId],
			references: [academicCalendars.id],
		}),
	}),
);

export const dutySchedulesRelations = relations(dutySchedules, ({ one }) => ({
	calendar: one(academicCalendars, {
		fields: [dutySchedules.calendarId],
		references: [academicCalendars.id],
	}),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
	creator: one(users, {
		fields: [announcements.createdBy],
		references: [users.id],
	}),
}));

export const attendanceSessions = pgTable("attendance_sessions", {
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
});

export const attendanceRecords = pgTable("attendance_records", {
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
});

export const attendanceSessionsRelations = relations(
	attendanceSessions,
	({ one, many }) => ({
		classSchedule: one(classSchedules, {
			fields: [attendanceSessions.classScheduleId],
			references: [classSchedules.id],
		}),
		practicumSchedule: one(practicumSchedules, {
			fields: [attendanceSessions.practicumScheduleId],
			references: [practicumSchedules.id],
		}),
		dutySchedule: one(dutySchedules, {
			fields: [attendanceSessions.dutyScheduleId],
			references: [dutySchedules.id],
		}),
		creator: one(users, {
			fields: [attendanceSessions.createdBy],
			references: [users.id],
		}),
		records: many(attendanceRecords),
	}),
);

export const attendanceRecordsRelations = relations(
	attendanceRecords,
	({ one }) => ({
		session: one(attendanceSessions, {
			fields: [attendanceRecords.sessionId],
			references: [attendanceSessions.id],
		}),
		student: one(students, {
			fields: [attendanceRecords.studentId],
			references: [students.id],
		}),
		recorder: one(users, {
			fields: [attendanceRecords.recordedBy],
			references: [users.id],
		}),
	}),
);

export const odsAttendanceRecords = pgTable("ods_attendance_records", {
	id: serial("id").primaryKey(),
	studentId: integer("student_id")
		.references(() => students.id)
		.notNull(),
	date: date("date").notNull(),
	status: text("status").notNull(), // "hadir" | "alpha" | "sakit" | "izin"
	notes: text("notes"),
	recordedBy: integer("recorded_by").references(() => users.id),
	recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

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
);

export const odsAttendanceRecordsRelations = relations(
	odsAttendanceRecords,
	({ one }) => ({
		student: one(students, {
			fields: [odsAttendanceRecords.studentId],
			references: [students.id],
		}),
		recorder: one(users, {
			fields: [odsAttendanceRecords.recordedBy],
			references: [users.id],
		}),
	}),
);

export const pramagangAttendanceRecordsRelations = relations(
	pramagangAttendanceRecords,
	({ one }) => ({
		student: one(students, {
			fields: [pramagangAttendanceRecords.studentId],
			references: [students.id],
		}),
		recorder: one(users, {
			fields: [pramagangAttendanceRecords.recordedBy],
			references: [users.id],
		}),
	}),
);

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

export const coursesRelations = relations(courses, ({ one, many }) => ({
	dosen: one(users, {
		fields: [courses.dosenId],
		references: [users.id],
	}),
	meetings: many(courseMeetings),
}));

export const courseMeetingsRelations = relations(
	courseMeetings,
	({ one, many }) => ({
		course: one(courses, {
			fields: [courseMeetings.courseId],
			references: [courses.id],
		}),
		activities: many(courseMeetingActivities),
		attendances: many(courseMeetingAttendances),
	}),
);

export const courseMeetingActivitiesRelations = relations(
	courseMeetingActivities,
	({ one }) => ({
		meeting: one(courseMeetings, {
			fields: [courseMeetingActivities.meetingId],
			references: [courseMeetings.id],
		}),
	}),
);

export const courseMeetingAttendancesRelations = relations(
	courseMeetingAttendances,
	({ one }) => ({
		meeting: one(courseMeetings, {
			fields: [courseMeetingAttendances.meetingId],
			references: [courseMeetings.id],
		}),
		student: one(students, {
			fields: [courseMeetingAttendances.studentId],
			references: [students.id],
		}),
	}),
);
