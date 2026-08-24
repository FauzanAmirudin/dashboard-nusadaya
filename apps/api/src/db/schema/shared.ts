import {
	boolean,
	decimal,
	index,
	integer,
	json,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { noteTypeEnum, roleEnum, statusEnum, studentStatusEnum } from "./enums";

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
export const students = pgTable(
	"students",
	{
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
	},
	(t) => [
		index("idx_students_is_archived_updated_at").on(
			t.isArchived,
			t.updatedAt,
			t.id,
		),
		index("idx_students_cohort_archived").on(t.cohort, t.isArchived),
		index("idx_students_status_archived").on(t.overallStatus, t.isArchived),
		index("idx_students_name").on(t.name),
		index("idx_students_pa_id").on(t.paId),
	],
);

// 2a. Student Health
export const studentHealth = pgTable(
	"student_health",
	{
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
	},
	(t) => [index("idx_student_health_student_id").on(t.studentId)],
);

// 2b. Student Parents / Guardians
export const studentParents = pgTable(
	"student_parents",
	{
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
	},
	(t) => [index("idx_student_parents_student_id").on(t.studentId)],
);

// 11. Internal Notes
export const internalNotes = pgTable(
	"internal_notes",
	{
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
	},
	(t) => [index("idx_internal_notes_student_id").on(t.studentId)],
);

// 12. Audit Logs
export const auditLogs = pgTable(
	"audit_logs",
	{
		id: serial("id").primaryKey(),
		userId: integer("user_id").references(() => users.id),
		action: text("action").notNull(),
		entity: text("entity").notNull(),
		entityId: integer("entity_id"),
		details: json("details"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_audit_logs_user_id").on(t.userId),
		index("idx_audit_logs_entity").on(t.entity, t.entityId),
	],
);

// STORAGE SYSTEM — File Metadata & Backup Jobs
export const files = pgTable(
	"files",
	{
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
	},
	(t) => [
		index("idx_files_student_id").on(t.studentId),
		index("idx_files_panel_key").on(t.panel, t.documentKey),
	],
);

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
