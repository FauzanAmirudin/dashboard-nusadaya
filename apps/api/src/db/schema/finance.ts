import {
	boolean,
	date,
	decimal,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { courses } from "./courses";
import { statusEnum } from "./enums";
import { students, users } from "./shared";

// 5. Finance Documents
export const financeDocuments = pgTable(
	"finance_documents",
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
	(t) => [index("idx_finance_documents_student_id").on(t.studentId)],
);

// 5. Finance Data
export const financeData = pgTable(
	"finance_data",
	{
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
		mandiriKeberangkatanNominal: integer(
			"mandiri_keberangkatan_nominal",
		).default(0),
		mandiriKeberangkatanStatus: boolean("mandiri_keberangkatan_status").default(
			false,
		),
		mandiriKeberangkatanBuktiBayarUrl: text(
			"mandiri_keberangkatan_bukti_bayar_url",
		),

		// Dana Talangan Tahap 1 — Semester
		t1SemesterNominalTotal: integer("t1_semester_nominal_total").default(0),
		t1SemesterNominalDibayar: integer("t1_semester_nominal_dibayar").default(0),
		t1SemesterNominalTalangan: integer("t1_semester_nominal_talangan").default(
			0,
		),
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
	},
	(t) => [index("idx_finance_data_student_id").on(t.studentId)],
);

export const financeCustomFields = pgTable(
	"finance_custom_fields",
	{
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
	},
	(t) => [index("idx_finance_custom_fields_student_id").on(t.studentId)],
);

export const financeSemesters = pgTable(
	"finance_semesters",
	{
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
	},
	(t) => [index("idx_finance_semesters_student_id").on(t.studentId)],
);

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
	(t) => [index("idx_finance_semester_installments_sem_id").on(t.semesterId)],
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
	(t) => [
		index("idx_finance_talangan_installments_student_id").on(t.studentId),
	],
);

export const feeShareRecipients = pgTable(
	"fee_share_recipients",
	{
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
	},
	(t) => [index("idx_fee_share_recipients_student_id").on(t.studentId)],
);

export const practicesBudgetRequests = pgTable(
	"practices_budget_requests",
	{
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
		buktiPencairanUrl: text("bukti_pencairan_url"),
		buktiPencairanFileName: text("bukti_pencairan_file_name"),
		tanggalPencairan: timestamp("tanggal_pencairan"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_practices_budget_requests_dosen_id").on(t.dosenId),
		index("idx_practices_budget_requests_course_id").on(t.courseId),
	],
);

export const practicesMaterialReports = pgTable(
	"practices_material_reports",
	{
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
	},
	(t) => [
		index("idx_practices_material_reports_request_id").on(t.budgetRequestId),
	],
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
