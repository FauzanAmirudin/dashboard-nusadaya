import {
	boolean,
	decimal,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { formResponseStatusEnum, statusEnum } from "./enums";
import { students, users } from "./shared";

// 3. PMB Data
export const pmbData = pgTable(
	"pmb_data",
	{
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
	},
	(t) => [index("idx_pmb_data_student_id").on(t.studentId)],
);

// 3a. PMB Payment Plan (Skema Keuangan)
export const pmbPaymentPlan = pgTable(
	"pmb_payment_plan",
	{
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
	},
	(t) => [index("idx_pmb_payment_plan_student_id").on(t.studentId)],
);

// 3b. PMB Fee Disbursements (Fee Mitra)
export const pmbFeeDisbursements = pgTable(
	"pmb_fee_disbursements",
	{
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
	},
	(t) => [index("idx_pmb_fee_disbursements_student_id").on(t.studentId)],
);

// 3c. PMB Documents
export const pmbDocuments = pgTable(
	"pmb_documents",
	{
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
	},
	(t) => [index("idx_pmb_documents_student_id").on(t.studentId)],
);

// 15. PMB Form Registrations
export const pmbFormTokens = pgTable(
	"pmb_form_tokens",
	{
		id: serial("id").primaryKey(),
		token: varchar("token", { length: 255 }).unique().notNull(), // UUID v4
		createdBy: integer("created_by").references(() => users.id),
		isUsed: boolean("is_used").default(false),
		usedAt: timestamp("used_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [index("idx_pmb_form_tokens_token").on(t.token)],
);

export const pmbFormResponses = pgTable(
	"pmb_form_responses",
	{
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
	},
	(t) => [index("idx_pmb_form_responses_student_id").on(t.studentId)],
);
