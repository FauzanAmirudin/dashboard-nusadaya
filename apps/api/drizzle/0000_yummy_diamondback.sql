CREATE TYPE "public"."evaluator_decision" AS ENUM('menunggu', 'lanjut_interview', 'ttd_kontrak', 'layak_berangkat', 'remedial');--> statement-breakpoint
CREATE TYPE "public"."note_type" AS ENUM('pengecualian_akademik', 'izin_resmi', 'sedang_ods', 'praktik_luar', 'informasi_umum', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('superadmin', 'pmb', 'crm', 'finance', 'akademik', 'dosen', 'pa', 'magang', 'evaluator');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('AMAN', 'PERLU_PERHATIAN', 'TIDAK_AMAN');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('aktif', 'cuti', 'alumni', 'keluar');--> statement-breakpoint
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
CREATE TABLE "counseling_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
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
	"course_code" text NOT NULL,
	"course_name" text NOT NULL,
	"dosen_id" integer,
	"grade" text,
	"attendance_rate" integer DEFAULT 0,
	"attitude_note" text,
	"is_acc" boolean DEFAULT false,
	"acc_at" timestamp,
	"acc_by" integer,
	"status" "status" DEFAULT 'PERLU_PERHATIAN',
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"created_at" timestamp DEFAULT now() NOT NULL
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "final_decision_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "finance_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"registration_paid" boolean DEFAULT false,
	"registration_amount" integer DEFAULT 0,
	"registration_date" timestamp,
	"semester_paid" boolean DEFAULT false,
	"semester_amount" integer DEFAULT 0,
	"semester_date" timestamp,
	"installment_cleared" boolean DEFAULT false,
	"installment_amount" integer DEFAULT 0,
	"installment_date" timestamp,
	"arrears_cleared" boolean DEFAULT false,
	"arrears_amount" integer DEFAULT 0,
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
	"pdt_place" text,
	"est_departure_date" timestamp,
	"destination_city" text,
	"internship_duration" text,
	"internship_company" text,
	"notes" text,
	"is_acc" boolean DEFAULT false,
	"acc_at" timestamp,
	"acc_by" integer,
	"status" "status" DEFAULT 'PERLU_PERHATIAN',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "internship_data_student_id_unique" UNIQUE("student_id")
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
CREATE TABLE "pmb_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"form_received" boolean DEFAULT false,
	"documents_complete" boolean DEFAULT false,
	"data_inputted" boolean DEFAULT false,
	"initial_follow_up" boolean DEFAULT false,
	"notes" text,
	"is_acc" boolean DEFAULT false,
	"acc_at" timestamp,
	"acc_by" integer,
	"status" "status" DEFAULT 'PERLU_PERHATIAN',
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
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"nim" text NOT NULL,
	"name" text NOT NULL,
	"cohort" integer NOT NULL,
	"program" text NOT NULL,
	"phone" text,
	"parent_name" text,
	"pa_id" integer,
	"student_status" "student_status" DEFAULT 'aktif',
	"destination_country" text,
	"period" text,
	"profile_photo_url" text,
	"overall_status" "status" DEFAULT 'AMAN',
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
ALTER TABLE "academic_data" ADD CONSTRAINT "academic_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_data" ADD CONSTRAINT "academic_data_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_documents" ADD CONSTRAINT "academic_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_documents" ADD CONSTRAINT "academic_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_documents" ADD CONSTRAINT "academic_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counseling_logs" ADD CONSTRAINT "counseling_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grade_documents" ADD CONSTRAINT "course_grade_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grade_documents" ADD CONSTRAINT "course_grade_documents_course_grade_id_course_grades_id_fk" FOREIGN KEY ("course_grade_id") REFERENCES "public"."course_grades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grade_documents" ADD CONSTRAINT "course_grade_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grade_documents" ADD CONSTRAINT "course_grade_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grades" ADD CONSTRAINT "course_grades_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grades" ADD CONSTRAINT "course_grades_dosen_id_users_id_fk" FOREIGN KEY ("dosen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_grades" ADD CONSTRAINT "course_grades_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_data" ADD CONSTRAINT "crm_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_data" ADD CONSTRAINT "crm_data_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_documents" ADD CONSTRAINT "crm_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_documents" ADD CONSTRAINT "crm_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_documents" ADD CONSTRAINT "crm_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_logs" ADD CONSTRAINT "crm_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_logs" ADD CONSTRAINT "crm_logs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_decision" ADD CONSTRAINT "final_decision_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_decision" ADD CONSTRAINT "final_decision_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_data" ADD CONSTRAINT "finance_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_data" ADD CONSTRAINT "finance_data_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internship_data" ADD CONSTRAINT "internship_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internship_data" ADD CONSTRAINT "internship_data_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_data" ADD CONSTRAINT "pa_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pa_data" ADD CONSTRAINT "pa_data_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_data" ADD CONSTRAINT "pmb_data_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_data" ADD CONSTRAINT "pmb_data_acc_by_users_id_fk" FOREIGN KEY ("acc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_documents" ADD CONSTRAINT "pmb_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_documents" ADD CONSTRAINT "pmb_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmb_documents" ADD CONSTRAINT "pmb_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_pa_id_users_id_fk" FOREIGN KEY ("pa_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab_logs" ADD CONSTRAINT "vocab_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;