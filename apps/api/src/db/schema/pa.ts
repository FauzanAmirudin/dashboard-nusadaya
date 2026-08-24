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

// 8. PA (Pendamping Akademik) Data
export const paData = pgTable(
	"pa_data",
	{
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
	},
	(t) => [index("idx_pa_data_student_id").on(t.studentId)],
);

export const paDocuments = pgTable(
	"pa_documents",
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
	(t) => [index("idx_pa_documents_student_id").on(t.studentId)],
);

export const vocabLogs = pgTable(
	"vocab_logs",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		date: timestamp("date").notNull(),
		addedWords: integer("added_words").notNull(),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [index("idx_vocab_logs_student_id").on(t.studentId)],
);

export const counselingLogs = pgTable(
	"counseling_logs",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		type: text("type").default("konseling").notNull(), // "konseling" | "konseling_mental"
		date: timestamp("date").notNull(),
		notes: text("notes").notNull(),
		condition: text("condition").notNull(), // "Stabil", "Perlu Perhatian", "Kritis"
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [index("idx_counseling_logs_student_id").on(t.studentId)],
);

export const paTripartiteLogs = pgTable(
	"pa_tripartite_logs",
	{
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
	},
	(t) => [index("idx_pa_tripartite_logs_student_id").on(t.studentId)],
);

export const paInterviewLogs = pgTable(
	"pa_interview_logs",
	{
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
	},
	(t) => [index("idx_pa_interview_logs_student_id").on(t.studentId)],
);

// PA Hafalan Sessions (Setoran Hafalan)
export const paHafalanSessions = pgTable(
	"pa_hafalan_sessions",
	{
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
	},
	(t) => [index("idx_pa_hafalan_sessions_student_id").on(t.studentId)],
);

// PA Student Notes (Catatan Mahasiswa)
export const paStudentNotes = pgTable(
	"pa_student_notes",
	{
		id: serial("id").primaryKey(),
		studentId: integer("student_id")
			.references(() => students.id)
			.notNull(),
		type: text("type").notNull(), // "kedisiplinan" | "internal"
		content: text("content").notNull(),
		createdBy: integer("created_by").references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [index("idx_pa_student_notes_student_id").on(t.studentId)],
);
