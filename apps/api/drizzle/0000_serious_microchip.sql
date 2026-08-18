CREATE TYPE "public"."academic_period_type" AS ENUM('beginning_class', 'pertemuan', 'uts', 'uas', 'pkkmb', 'custom');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('teori', 'tugas', 'praktik', 'ujian');--> statement-breakpoint
CREATE TYPE "public"."course_type" AS ENUM('teori', 'praktik');--> statement-breakpoint
CREATE TYPE "public"."evaluator_decision" AS ENUM('menunggu', 'lanjut_interview', 'ttd_kontrak', 'layak_berangkat', 'remedial');--> statement-breakpoint
CREATE TYPE "public"."form_response_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."meeting_type" AS ENUM('pkkmb', 'beginning', 'regular', 'uts', 'uas');--> statement-breakpoint
CREATE TYPE "public"."note_type" AS ENUM('pengecualian_akademik', 'izin_resmi', 'sedang_ods', 'praktik_luar', 'informasi_umum', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('superadmin', 'pmb', 'crm', 'finance', 'akademik', 'dosen', 'pa', 'magang', 'evaluator', 'mahasiswa');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('AMAN', 'PERLU_PERHATIAN', 'TIDAK_AMAN');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('aktif', 'cuti', 'alumni', 'keluar', 'dropout', 'mengundurkan_diri', 'lulus');--> statement-breakpoint
CREATE TABLE "academic_attitude_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"course_grade_id" integer NOT NULL,
	"dosen_id" integer NOT NULL,
	"discipline_score" integer DEFAULT 0,
	"activeness_score" integer DEFAULT 0,
	"date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_calendars" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year" text NOT NULL,
	"cohort" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"gpa" integer DEFAULT 0,
	"credits_completed" integer DEFAULT 0,
	"pddikti_input" boolean DEFAULT false,
	"attendance_total" integer DEFAULT 0,
	"attendance_present" integer DEFAULT 0,
	"attendance_alpha_note" text,
	"uts_passed" boolean DEFAULT false,
	"uas_passed" boolean DEFAULT false,
	"attitude_indicator" boolean DEFAULT false,
	"assignments_completed" boolean DEFAULT false,
	"academic_communication" boolean DEFAULT false,
	"notes" text,
	"assessment_completed" boolean DEFAULT false,
	"attendance_piket_total" integer DEFAULT 0,
	"attendance_piket_present" integer DEFAULT 0,
	"attendance_ods_total" integer DEFAULT 0,
	"attendance_ods_present" integer DEFAULT 0,
	"attendance_pramagang_total" integer DEFAULT 0,
	"attendance_pramagang_present" integer DEFAULT 0,
	"is_acc" boolean DEFAULT false,
	"acc_at" timestamp,
	"acc_by" integer,
	"status" "status" DEFAULT 'PERLU_PERHATIAN',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "academic_data_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "academic_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"document_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" integer,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by" integer
);
--> statement-breakpoint
CREATE TABLE "academic_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"calendar_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"calendar_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"period_type" "academic_period_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_cohort" integer,
	"published_at" date NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"recorded_by" integer,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_type" text NOT NULL,
	"class_schedule_id" integer,
	"practicum_schedule_id" integer,
	"duty_schedule_id" integer,
	"cohort" integer NOT NULL,
	"subject" text NOT NULL,
	"session_date" date NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"room" text NOT NULL,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" integer,
	"details" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backup_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"filters" jsonb,
	"total_files" integer DEFAULT 0,
	"processed_files" integer DEFAULT 0,
	"total_size" integer DEFAULT 0,
	"output_path" text,
	"created_by" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"dosen_id" integer,
	"cohort" integer NOT NULL,
	"room" text NOT NULL,
	"day_of_week" text NOT NULL,
	"session_date" date,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"calendar_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counseling_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"type" text DEFAULT 'konseling' NOT NULL,
	"date" timestamp NOT NULL,
	"notes" text NOT NULL,
	"condition" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_grade_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"course_grade_id" integer NOT NULL,
	"document_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" integer,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by" integer
);
--> statement-breakpoint
CREATE TABLE "course_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"course_id" integer,
	"course_code" text NOT NULL,
	"course_name" text NOT NULL,
	"dosen_id" integer,
	"grade" text,
	"attendance_rate" integer DEFAULT 0,
	"attitude_note" text,
	"practical_score" integer DEFAULT 0,
	"theory_score" integer DEFAULT 0,
	"entrepreneur_score" integer DEFAULT 0,
	"kwu_score" integer DEFAULT 0,
	"product_photo_url" text,
	"total_meetings" integer DEFAULT 16,
	"attendance_present" integer DEFAULT 0,
	"is_acc" boolean DEFAULT false,
	"acc_at" timestamp,
	"acc_by" integer,
	"has_kwu" boolean DEFAULT false,
	"status" "status" DEFAULT 'PERLU_PERHATIAN',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_meeting_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"score" integer,
	"notes" text,
	"document_url" text,
	"document_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_meeting_attendances" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"meeting_number" integer NOT NULL,
	"meeting_type" "meeting_type" NOT NULL,
	"meeting_label" text NOT NULL,
	"description" text,
	"meeting_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"dosen_id" integer NOT NULL,
	"peminatan" text,
	"cohort" integer NOT NULL,
	"type" "course_type" DEFAULT 'teori' NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "crm_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"ods_active" boolean DEFAULT false,
	"student_monitoring" boolean DEFAULT false,
	"parent_follow_up" boolean DEFAULT false,
	"practice_attendance" boolean DEFAULT false,
	"ods_documentation" boolean DEFAULT false,
	"practice_days_present" integer DEFAULT 0,
	"practice_days_total" integer DEFAULT 0,
	"is_monitoring_parent" boolean DEFAULT false,
	"is_monitoring_industry" boolean DEFAULT false,
	"is_vocab_complete" boolean DEFAULT false,
	"has_study_permit" boolean DEFAULT false,
	"is_ods_report" boolean DEFAULT false,
	"is_pramagang_report" boolean DEFAULT false,
	"is_pramagang_documentation" boolean DEFAULT false,
	"has_active_case" boolean DEFAULT false,
	"ods_details" jsonb DEFAULT '[]',
	"pramagang_start_date" timestamp,
	"pramagang_end_date" timestamp,
	"pramagang_industry" varchar(255),
	"pramagang_video_link" text,
	"case_notes" text,
	"is_acc" boolean DEFAULT false,
	"acc_at" timestamp,
	"acc_by" integer,
	"status" "status" DEFAULT 'PERLU_PERHATIAN',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crm_data_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "crm_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"document_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" integer,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by" integer
);
--> statement-breakpoint
CREATE TABLE "crm_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"log_text" text NOT NULL,
	"log_type" varchar(50) DEFAULT 'modul_crm',
	"attachments" jsonb DEFAULT '[]',
	"start_time" text,
	"end_time" text,
	"media" text,
	"location" text,
	"topic" text,
	"agreements" jsonb DEFAULT '[]',
	"follow_ups" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departure_assessment_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departure_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"score" integer,
	"notes" text,
	"result_file_url" text,
	"result_file_name" text,
	"result_file_size" integer,
	"status" text DEFAULT 'belum_dimulai' NOT NULL,
	"assessed_by" integer,
	"assessed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departure_assessments_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "duty_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"cohort" integer NOT NULL,
	"group_name" text NOT NULL,
	"members" jsonb NOT NULL,
	"room" text NOT NULL,
	"day_of_week" text NOT NULL,
	"session_date" date,
	"start_time" text,
	"end_time" text,
	"calendar_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entrepreneurship_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"course_grade_id" integer NOT NULL,
	"business_type" text NOT NULL,
	"production_qty" integer DEFAULT 0,
	"revenue_total" integer DEFAULT 0,
	"profit_sharing_student" integer DEFAULT 0,
	"profit_sharing_dosen" integer DEFAULT 0,
	"profit_sharing_lembaga" integer DEFAULT 0,
	"week_date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_share_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"nama_referral" text NOT NULL,
	"kategori" text NOT NULL,
	"no_rekening" text,
	"nama_bank" text,
	"no_hp" text,
	"nominal_fee" integer DEFAULT 0,
	"invoice_file_url" text,
	"status_pencairan" text DEFAULT 'belum_dibayarkan',
	"tanggal_cair" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" integer,
	"category" text NOT NULL,
	"storage_disk" text DEFAULT 'local' NOT NULL,
	"storage_path" text NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"extension" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"checksum" text,
	"visibility" text DEFAULT 'private' NOT NULL,
	"uploaded_by" integer,
	"panel" text,
	"document_key" text,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "final_decision" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"evaluator_decision" "evaluator_decision" DEFAULT 'menunggu',
	"evaluator_notes" text,
	"decided_at" timestamp,
	"decided_by" integer,
	"is_approved_by_director" boolean DEFAULT false,
	"departure_date" timestamp,
	"notes" text,
	"confidential_notes" text,
	"sk_document_url" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "final_decision_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "finance_custom_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"field_type" text NOT NULL,
	"label" text NOT NULL,
	"nominal" integer DEFAULT 0,
	"status" boolean DEFAULT false,
	"notes" text,
	"bukti_bayar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"total_biaya_pendidikan" integer DEFAULT 0,
	"registrasi_nominal" integer DEFAULT 0,
	"registrasi_paid_date" timestamp,
	"registrasi_bukti_bayar_url" text,
	"registrasi_status" boolean DEFAULT false,
	"metode_pembayaran" text,
	"mandiri_semester_nominal" integer DEFAULT 0,
	"mandiri_semester_status" boolean DEFAULT false,
	"mandiri_semester_bukti_bayar_url" text,
	"mandiri_interview_nominal" integer DEFAULT 0,
	"mandiri_interview_status" boolean DEFAULT false,
	"mandiri_interview_bukti_bayar_url" text,
	"mandiri_keberangkatan_nominal" integer DEFAULT 0,
	"mandiri_keberangkatan_status" boolean DEFAULT false,
	"mandiri_keberangkatan_bukti_bayar_url" text,
	"t1_semester_nominal_total" integer DEFAULT 0,
	"t1_semester_nominal_dibayar" integer DEFAULT 0,
	"t1_semester_nominal_talangan" integer DEFAULT 0,
	"t1_semester_jumlah_cicilan" integer DEFAULT 0,
	"t1_semester_cicilan_ke" integer DEFAULT 0,
	"t1_semester_status" boolean DEFAULT false,
	"t1_interview_nominal" integer DEFAULT 0,
	"t1_interview_status" boolean DEFAULT false,
	"t1_interview_bukti_bayar_url" text,
	"t2_keberangkatan_nominal" integer DEFAULT 0,
	"t2_keberangkatan_status" boolean DEFAULT false,
	"t2_keberangkatan_bukti_bayar_url" text,
	"admin_talagan_nominal" integer DEFAULT 0,
	"admin_talagan_metode" text,
	"admin_talagan_bank_tujuan" text,
	"admin_talagan_bukti_bayar_url" text,
	"admin_talagan_status" boolean DEFAULT false,
	"toeic_nominal" integer DEFAULT 0,
	"toeic_status" boolean DEFAULT false,
	"toeic_bukti_bayar_url" text,
	"paspor_nominal" integer DEFAULT 0,
	"paspor_status" boolean DEFAULT false,
	"paspor_bukti_bayar_url" text,
	"rumah_juang_aktif" boolean DEFAULT false,
	"rumah_juang_nominal" integer DEFAULT 0,
	"rumah_juang_status" boolean DEFAULT false,
	"rumah_juang_bukti_bayar_url" text,
	"notes" text,
	"is_acc" boolean DEFAULT false,
	"acc_at" timestamp,
	"acc_by" integer,
	"status" "status" DEFAULT 'PERLU_PERHATIAN',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "finance_data_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "finance_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"document_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" integer,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by" integer
);
--> statement-breakpoint
CREATE TABLE "finance_semester_installments" (
	"id" serial PRIMARY KEY NOT NULL,
	"semester_id" integer NOT NULL,
	"installment_number" integer NOT NULL,
	"nominal_paid" integer NOT NULL,
	"payment_date" timestamp,
	"bukti_bayar_url" text,
	"notes" text,
	"is_talangan" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_semesters" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"semester_number" integer NOT NULL,
	"total_billed" integer DEFAULT 0,
	"is_talangan" boolean DEFAULT false,
	"notes" text,
	"status" text DEFAULT 'BELUM_BAYAR',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"note" text NOT NULL,
	"note_type" "note_type" DEFAULT 'informasi_umum' NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internship_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"pra_paspor_pas_foto" boolean DEFAULT false,
	"pra_paspor_ktm" boolean DEFAULT false,
	"pra_paspor_ktp" boolean DEFAULT false,
	"pra_paspor_kk" boolean DEFAULT false,
	"pra_paspor_akta_kelahiran" boolean DEFAULT false,
	"pra_paspor_sl21" boolean DEFAULT false,
	"pra_paspor_skma" boolean DEFAULT false,
	"pra_paspor_rekomendasi_disdik" boolean DEFAULT false,
	"pra_paspor_gap_year" boolean DEFAULT false,
	"pra_paspor_pddikti" boolean DEFAULT false,
	"pra_paspor_cv" boolean DEFAULT false,
	"passport_ready" boolean DEFAULT false,
	"passport_no" text,
	"passport_exp" timestamp,
	"interview_ready" boolean DEFAULT false,
	"interview_date" timestamp,
	"interview_result" text,
	"loa_ready" boolean DEFAULT false,
	"loa_company" text,
	"loa_position" text,
	"contract_ready" boolean DEFAULT false,
	"contract_date" timestamp,
	"mcu_ready" boolean DEFAULT false,
	"mcu_place" text,
	"mcu_date" timestamp,
	"mcu_result" text,
	"visa_ready" boolean DEFAULT false,
	"visa_type" text,
	"visa_status" text,
	"visa_no" text,
	"ticket_ready" boolean DEFAULT false,
	"ticket_airline" text,
	"ticket_date" timestamp,
	"ticket_flight" text,
	"pdt_ready" boolean DEFAULT false,
	"pdt_date" timestamp,
	"pdt_end_date" timestamp,
	"pdt_place" text,
	"lol_ready" boolean DEFAULT false,
	"lol_date" timestamp,
	"lol_notes" text,
	"loa_confirmed" boolean DEFAULT false,
	"loa_date" timestamp,
	"moa_ready" boolean DEFAULT false,
	"moa_date" timestamp,
	"moa_notes" text,
	"est_departure_date" timestamp,
	"destination_city" text,
	"internship_duration" text,
	"internship_company" text,
	"dokumentasi_ready" boolean DEFAULT false,
	"dokumentasi_keberangkatan_link" text,
	"agen_ready" boolean DEFAULT false,
	"agen_negara_tujuan" text,
	"agen_peminatan" text,
	"dana_tahap1_amount" integer DEFAULT 0,
	"dana_tahap1_date" timestamp,
	"dana_tahap1_notes" text,
	"is_dana_tahap1_disbursed" boolean DEFAULT false,
	"dana_tahap2_amount" integer DEFAULT 0,
	"dana_tahap2_date" timestamp,
	"dana_tahap2_notes" text,
	"is_dana_tahap2_disbursed" boolean DEFAULT false,
	"logbook_ready" boolean DEFAULT false,
	"laporan_akhir_ready" boolean DEFAULT false,
	"video_dokumentasi_ready" boolean DEFAULT false,
	"video_dokumentasi_link" text,
	"notes" text,
	"is_acc" boolean DEFAULT false,
	"acc_at" timestamp,
	"acc_by" integer,
	"status" "status" DEFAULT 'PERLU_PERHATIAN',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "internship_data_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "internship_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"document_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" integer,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by" integer
);
--> statement-breakpoint
CREATE TABLE "internship_monitoring_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"completed_at" timestamp,
	"monitoring_notes" text,
	"condition" text,
	"conducted_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_business_parameters" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_unit_id" text NOT NULL,
	"parameter_name" text NOT NULL,
	"formula_value" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "master_event_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_key" text NOT NULL,
	"event_name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "master_event_types_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "master_service_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"category_name" text NOT NULL,
	"is_enabled" boolean DEFAULT true,
	CONSTRAINT "master_service_tags_service_id_unique" UNIQUE("service_id")
);
--> statement-breakpoint
CREATE TABLE "ods_attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"date" date NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"recorded_by" integer,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overseas_program_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"program_type" text DEFAULT 'taiwan' NOT NULL,
	"cohort" text,
	"pas_foto_checked" boolean DEFAULT false,
	"cv_checked" boolean DEFAULT false,
	"ktm_checked" boolean DEFAULT false,
	"khs_checked" boolean DEFAULT false,
	"sl21_checked" boolean DEFAULT false,
	"aktif_checked" boolean DEFAULT false,
	"gap_year_checked" boolean DEFAULT false,
	"pddikti_checked" boolean DEFAULT false,
	"pribadi_checked" boolean DEFAULT false,
	"lol_checked" boolean DEFAULT false,
	"loa_checked" boolean DEFAULT false,
	"suhhan_checked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pa_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"counseling_done" boolean DEFAULT false,
	"mental_stable" boolean DEFAULT false,
	"discipline_good" boolean DEFAULT false,
	"vocab_target" integer DEFAULT 500,
	"discipline_notes" text,
	"is_acc" boolean DEFAULT false,
	"acc_at" timestamp,
	"acc_by" integer,
	"status" "status" DEFAULT 'PERLU_PERHATIAN',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pa_data_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "pa_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"document_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" integer,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by" integer
);
--> statement-breakpoint
CREATE TABLE "pa_hafalan_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"language" text NOT NULL,
	"language_custom" text,
	"vocab_count" integer DEFAULT 0 NOT NULL,
	"sentence_count" integer DEFAULT 0 NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pa_interview_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"interview_date" timestamp NOT NULL,
	"company_name" text NOT NULL,
	"country" text,
	"result" text NOT NULL,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pa_student_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pa_tripartite_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"contact_type" text NOT NULL,
	"contact_name" text,
	"contact_date" timestamp NOT NULL,
	"summary" text NOT NULL,
	"result" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmb_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"form_received" boolean DEFAULT false,
	"documents_complete" boolean DEFAULT false,
	"data_inputted" boolean DEFAULT false,
	"initial_follow_up" boolean DEFAULT false,
	"is_gap_year" boolean DEFAULT false,
	"notes" text,
	"is_acc" boolean DEFAULT false,
	"acc_at" timestamp,
	"acc_by" integer,
	"status" "status" DEFAULT 'PERLU_PERHATIAN',
	"rekomendasi" text,
	"tim_visit" text,
	"tim_sosialisasi" text,
	"ro_referral" text,
	"mitra_sponsor" text,
	"koordinator" text,
	"doc_ktp" boolean DEFAULT false,
	"doc_kk" boolean DEFAULT false,
	"doc_cv" boolean DEFAULT false,
	"doc_ijazah" boolean DEFAULT false,
	"doc_transkrip" boolean DEFAULT false,
	"doc_passport_depan" boolean DEFAULT false,
	"doc_passport_visa" boolean DEFAULT false,
	"doc_skbm" boolean DEFAULT false,
	"doc_mcu" boolean DEFAULT false,
	"doc_sertifikasi_bahasa" boolean DEFAULT false,
	"rumah_juang" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pmb_data_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "pmb_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"document_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" integer,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by" integer
);
--> statement-breakpoint
CREATE TABLE "pmb_fee_disbursements" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"channel" text NOT NULL,
	"nama_referral" text NOT NULL,
	"nominal_fee" integer DEFAULT 0,
	"status_pencairan" text DEFAULT 'belum',
	"tanggal_cair" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmb_form_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_id" integer NOT NULL,
	"status" "form_response_status" DEFAULT 'PENDING',
	"name" text NOT NULL,
	"nickname" text,
	"gender" text,
	"birth_place" text,
	"birth_date" timestamp,
	"religion" text,
	"nationality" text,
	"address_street" text,
	"address_rt" text,
	"address_rw" text,
	"address_no" text,
	"address_village" text,
	"address_district" text,
	"address_city" text,
	"address_province" text,
	"living_with" text,
	"phone" text,
	"email" text,
	"profile_photo_url" text,
	"school_origin" text,
	"school_address" text,
	"school_major" text,
	"graduation_year" integer,
	"program" text,
	"sub_program" text,
	"class_type" text,
	"batch" integer,
	"academic_year" text,
	"blood_type" text,
	"disease_history" text,
	"congenital_disease" text,
	"height" numeric(5, 2),
	"weight" numeric(5, 2),
	"clothing_size" text,
	"ayah_name" text,
	"ayah_birth_place" text,
	"ayah_birth_date" timestamp,
	"ayah_religion" text,
	"ayah_nationality" text,
	"ayah_education" text,
	"ayah_job" text,
	"ayah_address" text,
	"ayah_phone" text,
	"ayah_email" text,
	"ayah_status" text,
	"ibu_name" text,
	"ibu_birth_place" text,
	"ibu_birth_date" timestamp,
	"ibu_religion" text,
	"ibu_nationality" text,
	"ibu_education" text,
	"ibu_job" text,
	"ibu_address" text,
	"ibu_phone" text,
	"ibu_email" text,
	"ibu_status" text,
	"wali_name" text,
	"wali_birth_place" text,
	"wali_birth_date" timestamp,
	"wali_religion" text,
	"wali_nationality" text,
	"wali_education" text,
	"wali_job" text,
	"wali_address" text,
	"wali_phone" text,
	"wali_email" text,
	"wali_guardian_relation" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"processed_by" integer,
	"rejection_notes" text,
	"student_id" integer,
	CONSTRAINT "pmb_form_responses_token_id_unique" UNIQUE("token_id")
);
--> statement-breakpoint
CREATE TABLE "pmb_form_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(255) NOT NULL,
	"created_by" integer,
	"is_used" boolean DEFAULT false,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pmb_form_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "pmb_payment_plan" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"total_biaya" integer DEFAULT 0,
	"pendaftaran_dp" integer DEFAULT 0,
	"total_dp" integer DEFAULT 0,
	"pembayaran_awal_dp" integer DEFAULT 0,
	"status_dp" boolean DEFAULT false,
	"janji_tahap2" timestamp,
	"janji_tahap2_nominal" integer DEFAULT 0,
	"janji_tahap2_notes" text,
	"janji_tahap3" timestamp,
	"janji_tahap3_nominal" integer DEFAULT 0,
	"janji_tahap3_notes" text,
	"pengajuan_dana_talangan" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pmb_payment_plan_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "post_internship_docs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"document_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" integer,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by" integer
);
--> statement-breakpoint
CREATE TABLE "practices_budget_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"dosen_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"daftar_kebutuhan" jsonb NOT NULL,
	"total_nominal" integer DEFAULT 0,
	"status" text DEFAULT 'menunggu',
	"catatan_finance" text,
	"approved_by" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practices_material_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"budget_request_id" integer NOT NULL,
	"dosen_id" integer NOT NULL,
	"daftar_sisa_bahan" jsonb NOT NULL,
	"catatan_dosen" text,
	"file_url" text,
	"file_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practicum_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"dosen_id" integer,
	"cohort" integer NOT NULL,
	"room" text NOT NULL,
	"day_of_week" text NOT NULL,
	"session_date" date,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"calendar_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pramagang_attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"date" date NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"recorded_by" integer,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_health" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"blood_type" text,
	"disease_history" text,
	"congenital_disease" text,
	"height" integer,
	"weight" integer,
	"clothing_size" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_health_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "student_parents" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"type" text NOT NULL,
	"name" text,
	"birth_place" text,
	"birth_date" timestamp,
	"religion" text,
	"nationality" text,
	"education" text,
	"job" text,
	"address" text,
	"phone" text,
	"email" text,
	"status" text,
	"guardian_relation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"nim" text,
	"name" text NOT NULL,
	"nickname" text,
	"cohort" integer NOT NULL,
	"program" text NOT NULL,
	"sub_program" text,
	"birth_place" text,
	"birth_date" timestamp,
	"gender" text,
	"religion" text,
	"nationality" text,
	"address_street" text,
	"address_rt" text,
	"address_rw" text,
	"address_no" text,
	"address_village" text,
	"address_district" text,
	"address_city" text,
	"address_province" text,
	"living_with" text,
	"school_origin" text,
	"school_address" text,
	"school_major" text,
	"graduation_year" integer,
	"class_type" text,
	"academic_year" text,
	"batch" integer,
	"phone" text,
	"email" text,
	"parent_name" text,
	"parent_job" text,
	"parent_income" text,
	"parent_phone" text,
	"pa_id" integer,
	"student_status" "student_status" DEFAULT 'aktif',
	"destination_country" text,
	"period" text,
	"profile_photo_url" text,
	"overall_status" "status" DEFAULT 'AMAN',
	"is_archived" boolean DEFAULT false,
	"student_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_nim_unique" UNIQUE("nim")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"role" "role" NOT NULL,
	"email" text,
	"phone" text,
	"profile_photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vocab_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"added_words" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocational_budget_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_name" text NOT NULL,
	"subject" text NOT NULL,
	"week_number" integer NOT NULL,
	"request_date" date NOT NULL,
	"materials" jsonb NOT NULL,
	"total_estimate" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'pending',
	"notes" text,
	"submitted_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocational_leftovers" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_name" text NOT NULL,
	"subject" text NOT NULL,
	"report_date" date NOT NULL,
	"material_name" text NOT NULL,
	"qty" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"condition" text NOT NULL,
	"notes" text,
	"reported_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocational_monthly_budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_name" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"max_budget" numeric(12, 2) NOT NULL,
	"approved_total" numeric(12, 2) DEFAULT '0',
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"event_date" timestamp NOT NULL,
	"description" text,
	"document_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_attitude_logs" ADD CONSTRAINT "academic_attitude_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_attitude_logs" ADD CONSTRAINT "academic_attitude_logs_course_grade_id_course_grades_id_fk" FOREIGN KEY ("course_grade_id") REFERENCES "public"."course_grades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_attitude_logs" ADD CONSTRAINT "academic_attitude_logs_dosen_id_users_id_fk" FOREIGN KEY ("dosen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_calendars" ADD CONSTRAINT "academic_calendars_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_data" ADD CONSTRAINT "academic_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_data" ADD CONSTRAINT "academic_data_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_documents" ADD CONSTRAINT "academic_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_documents" ADD CONSTRAINT "academic_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_documents" ADD CONSTRAINT "academic_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_events" ADD CONSTRAINT "academic_events_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_periods" ADD CONSTRAINT "academic_periods_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_attendance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_class_schedule_id_class_schedules_id_fk" FOREIGN KEY ("class_schedule_id") REFERENCES "public"."class_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_practicum_schedule_id_practicum_schedules_id_fk" FOREIGN KEY ("practicum_schedule_id") REFERENCES "public"."practicum_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_duty_schedule_id_duty_schedules_id_fk" FOREIGN KEY ("duty_schedule_id") REFERENCES "public"."duty_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_jobs" ADD CONSTRAINT "backup_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_dosen_id_users_id_fk" FOREIGN KEY ("dosen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counseling_logs" ADD CONSTRAINT "counseling_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grade_documents" ADD CONSTRAINT "course_grade_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grade_documents" ADD CONSTRAINT "course_grade_documents_course_grade_id_course_grades_id_fk" FOREIGN KEY ("course_grade_id") REFERENCES "public"."course_grades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grade_documents" ADD CONSTRAINT "course_grade_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grade_documents" ADD CONSTRAINT "course_grade_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grades" ADD CONSTRAINT "course_grades_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grades" ADD CONSTRAINT "course_grades_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grades" ADD CONSTRAINT "course_grades_dosen_id_users_id_fk" FOREIGN KEY ("dosen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grades" ADD CONSTRAINT "course_grades_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_meeting_activities" ADD CONSTRAINT "course_meeting_activities_meeting_id_course_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."course_meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_meeting_attendances" ADD CONSTRAINT "course_meeting_attendances_meeting_id_course_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."course_meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_meeting_attendances" ADD CONSTRAINT "course_meeting_attendances_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_meetings" ADD CONSTRAINT "course_meetings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_dosen_id_users_id_fk" FOREIGN KEY ("dosen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_data" ADD CONSTRAINT "crm_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_data" ADD CONSTRAINT "crm_data_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_documents" ADD CONSTRAINT "crm_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_documents" ADD CONSTRAINT "crm_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_documents" ADD CONSTRAINT "crm_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_logs" ADD CONSTRAINT "crm_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_logs" ADD CONSTRAINT "crm_logs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departure_assessment_notes" ADD CONSTRAINT "departure_assessment_notes_assessment_id_departure_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."departure_assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departure_assessment_notes" ADD CONSTRAINT "departure_assessment_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departure_assessments" ADD CONSTRAINT "departure_assessments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departure_assessments" ADD CONSTRAINT "departure_assessments_assessed_by_users_id_fk" FOREIGN KEY ("assessed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_schedules" ADD CONSTRAINT "duty_schedules_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrepreneurship_records" ADD CONSTRAINT "entrepreneurship_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrepreneurship_records" ADD CONSTRAINT "entrepreneurship_records_course_grade_id_course_grades_id_fk" FOREIGN KEY ("course_grade_id") REFERENCES "public"."course_grades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_share_recipients" ADD CONSTRAINT "fee_share_recipients_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_share_recipients" ADD CONSTRAINT "fee_share_recipients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_decision" ADD CONSTRAINT "final_decision_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_decision" ADD CONSTRAINT "final_decision_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_custom_fields" ADD CONSTRAINT "finance_custom_fields_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_data" ADD CONSTRAINT "finance_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_data" ADD CONSTRAINT "finance_data_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_semester_installments" ADD CONSTRAINT "finance_semester_installments_semester_id_finance_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."finance_semesters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_semesters" ADD CONSTRAINT "finance_semesters_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internship_data" ADD CONSTRAINT "internship_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internship_data" ADD CONSTRAINT "internship_data_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internship_documents" ADD CONSTRAINT "internship_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internship_documents" ADD CONSTRAINT "internship_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internship_documents" ADD CONSTRAINT "internship_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internship_monitoring_schedule" ADD CONSTRAINT "internship_monitoring_schedule_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internship_monitoring_schedule" ADD CONSTRAINT "internship_monitoring_schedule_conducted_by_users_id_fk" FOREIGN KEY ("conducted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ods_attendance_records" ADD CONSTRAINT "ods_attendance_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ods_attendance_records" ADD CONSTRAINT "ods_attendance_records_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overseas_program_checklists" ADD CONSTRAINT "overseas_program_checklists_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_data" ADD CONSTRAINT "pa_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_data" ADD CONSTRAINT "pa_data_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_documents" ADD CONSTRAINT "pa_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_documents" ADD CONSTRAINT "pa_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_documents" ADD CONSTRAINT "pa_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_hafalan_sessions" ADD CONSTRAINT "pa_hafalan_sessions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_hafalan_sessions" ADD CONSTRAINT "pa_hafalan_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_interview_logs" ADD CONSTRAINT "pa_interview_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_interview_logs" ADD CONSTRAINT "pa_interview_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_student_notes" ADD CONSTRAINT "pa_student_notes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_student_notes" ADD CONSTRAINT "pa_student_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_tripartite_logs" ADD CONSTRAINT "pa_tripartite_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_tripartite_logs" ADD CONSTRAINT "pa_tripartite_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_data" ADD CONSTRAINT "pmb_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_data" ADD CONSTRAINT "pmb_data_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_documents" ADD CONSTRAINT "pmb_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_documents" ADD CONSTRAINT "pmb_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_documents" ADD CONSTRAINT "pmb_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_fee_disbursements" ADD CONSTRAINT "pmb_fee_disbursements_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_form_responses" ADD CONSTRAINT "pmb_form_responses_token_id_pmb_form_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."pmb_form_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_form_responses" ADD CONSTRAINT "pmb_form_responses_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_form_responses" ADD CONSTRAINT "pmb_form_responses_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_form_tokens" ADD CONSTRAINT "pmb_form_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_payment_plan" ADD CONSTRAINT "pmb_payment_plan_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_internship_docs" ADD CONSTRAINT "post_internship_docs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_internship_docs" ADD CONSTRAINT "post_internship_docs_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_internship_docs" ADD CONSTRAINT "post_internship_docs_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practices_budget_requests" ADD CONSTRAINT "practices_budget_requests_dosen_id_users_id_fk" FOREIGN KEY ("dosen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practices_budget_requests" ADD CONSTRAINT "practices_budget_requests_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practices_budget_requests" ADD CONSTRAINT "practices_budget_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practices_material_reports" ADD CONSTRAINT "practices_material_reports_budget_request_id_practices_budget_requests_id_fk" FOREIGN KEY ("budget_request_id") REFERENCES "public"."practices_budget_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practices_material_reports" ADD CONSTRAINT "practices_material_reports_dosen_id_users_id_fk" FOREIGN KEY ("dosen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practicum_schedules" ADD CONSTRAINT "practicum_schedules_dosen_id_users_id_fk" FOREIGN KEY ("dosen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practicum_schedules" ADD CONSTRAINT "practicum_schedules_calendar_id_academic_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."academic_calendars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pramagang_attendance_records" ADD CONSTRAINT "pramagang_attendance_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pramagang_attendance_records" ADD CONSTRAINT "pramagang_attendance_records_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_health" ADD CONSTRAINT "student_health_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_pa_id_users_id_fk" FOREIGN KEY ("pa_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab_logs" ADD CONSTRAINT "vocab_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocational_budget_requests" ADD CONSTRAINT "vocational_budget_requests_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocational_leftovers" ADD CONSTRAINT "vocational_leftovers_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocational_monthly_budgets" ADD CONSTRAINT "vocational_monthly_budgets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_events" ADD CONSTRAINT "weekly_events_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;