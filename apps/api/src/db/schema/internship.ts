import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { statusEnum } from "./enums";
import { students, users } from "./shared";

// 9. Internship Data
export const internshipData = pgTable(
	"internship_data",
	{
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
		praPasporRekomendasiDisdik: boolean(
			"pra_paspor_rekomendasi_disdik",
		).default(false),
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
	},
	(t) => [index("idx_internship_data_student_id").on(t.studentId)],
);

export const internshipDocuments = pgTable(
	"internship_documents",
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
	(t) => [index("idx_internship_documents_student_id").on(t.studentId)],
);

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
	(t) => [index("idx_internship_monitoring_sched_student_id").on(t.studentId)],
);

// 13. Post-Internship Documents (Pasca-Magang)
export const postInternshipDocs = pgTable(
	"post_internship_docs",
	{
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
	},
	(t) => [index("idx_post_internship_docs_student_id").on(t.studentId)],
);

// 14. Departure Assessments (Assessment Pra-keberangkatan)
export const departureAssessments = pgTable(
	"departure_assessments",
	{
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
	},
	(t) => [index("idx_departure_assessments_student_id").on(t.studentId)],
);

// 14b. Departure Assessment Notes
export const departureAssessmentNotes = pgTable(
	"departure_assessment_notes",
	{
		id: serial("id").primaryKey(),
		assessmentId: integer("assessment_id")
			.references(() => departureAssessments.id)
			.notNull(),
		content: text("content").notNull(),
		createdBy: integer("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_departure_assessment_notes_assessment_id").on(t.assessmentId),
	],
);
