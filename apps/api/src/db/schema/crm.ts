import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { statusEnum } from "./enums";
import { students, users } from "./shared";

// 4. CRM Data
export const crmData = pgTable(
	"crm_data",
	{
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
		isOds1Report: boolean("is_ods_1_report").default(false),
		isOds2Report: boolean("is_ods_2_report").default(false),
		isOds3Report: boolean("is_ods_3_report").default(false),
		isOds4Report: boolean("is_ods_4_report").default(false),
		isOds5Report: boolean("is_ods_5_report").default(false),
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
		pramagangVideoStatus: varchar("pramagang_video_status", {
			length: 50,
		}).default("BELUM_DIUNGGAH"),
		pramagangVideoNotes: text("pramagang_video_notes"),
		pramagangVideoSubmittedAt: timestamp("pramagang_video_submitted_at"),
		pramagangVideoReviewedAt: timestamp("pramagang_video_reviewed_at"),
		pramagangVideoReviewedBy: integer("pramagang_video_reviewed_by").references(
			() => users.id,
		),

		// Segmen 10: Kewajiban 1 Video Konten Promosi / Kegiatan Bulanan (Unggah Mandiri Mahasiswa)
		monthlyVideoLink: text("monthly_video_link"),
		monthlyVideoTitle: varchar("monthly_video_title", { length: 255 }),
		monthlyVideoPlatform: varchar("monthly_video_platform", { length: 50 }),
		monthlyVideoStatus: varchar("monthly_video_status", { length: 50 }).default(
			"BELUM_DIUNGGAH",
		),
		monthlyVideoNotes: text("monthly_video_notes"),
		monthlyVideoSubmittedAt: timestamp("monthly_video_submitted_at"),
		monthlyVideoReviewedAt: timestamp("monthly_video_reviewed_at"),
		monthlyVideoReviewedBy: integer("monthly_video_reviewed_by").references(
			() => users.id,
		),
		isMonthlyVideo: boolean("is_monthly_video").default(false),
		monthlyVideos: jsonb("monthly_videos").default("[]"),

		// Segmen 9: Integrasi Tri Dharma Perguruan Tinggi (PKM & Penelitian di Sekolah Mitra / Desa Binaan)
		isTriDharma: boolean("is_tri_dharma").default(false),
		triDharmaDetails: jsonb("tri_dharma_details").default("[]"),

		caseNotes: text("case_notes"),
		isAcc: boolean("is_acc").default(false),
		accAt: timestamp("acc_at"),
		accBy: integer("acc_by").references(() => users.id),
		status: statusEnum("status").default("PERLU_PERHATIAN"),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [index("idx_crm_data_student_id").on(t.studentId)],
);

// 4b. CRM Logs (Komunikasi Orang Tua)
export const crmLogs = pgTable(
	"crm_logs",
	{
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
	},
	(t) => [index("idx_crm_logs_student_id").on(t.studentId)],
);

// 4c. CRM Documents
export const crmDocuments = pgTable(
	"crm_documents",
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
	(t) => [index("idx_crm_documents_student_id").on(t.studentId)],
);
