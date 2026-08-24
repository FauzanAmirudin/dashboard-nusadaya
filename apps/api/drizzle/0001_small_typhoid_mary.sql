ALTER TYPE "public"."status" ADD VALUE 'ACC' BEFORE 'AMAN';--> statement-breakpoint
ALTER TYPE "public"."status" ADD VALUE 'PROSES' BEFORE 'PERLU_PERHATIAN';--> statement-breakpoint
ALTER TYPE "public"."status" ADD VALUE 'BUTUH_PERHATIAN' BEFORE 'PERLU_PERHATIAN';--> statement-breakpoint
CREATE TABLE "finance_talangan_installments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"stage" text NOT NULL,
	"installment_number" integer NOT NULL,
	"nominal_paid" integer NOT NULL,
	"payment_date" timestamp,
	"bukti_bayar_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_meeting_attendances" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "course_meeting_attendances" ADD COLUMN "theory_score" integer;--> statement-breakpoint
ALTER TABLE "course_meeting_attendances" ADD COLUMN "practical_score" integer;--> statement-breakpoint
ALTER TABLE "course_meetings" ADD COLUMN "session_type" text;--> statement-breakpoint
ALTER TABLE "finance_data" ADD COLUMN "total_biaya_promosi" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "roles" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "finance_talangan_installments" ADD CONSTRAINT "finance_talangan_installments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;