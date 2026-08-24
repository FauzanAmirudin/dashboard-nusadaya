import { pgEnum } from "drizzle-orm/pg-core";

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
	"ACC",
	"AMAN",
	"PROSES",
	"BUTUH_PERHATIAN",
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

export const academicPeriodTypeEnum = pgEnum("academic_period_type", [
	"beginning_class",
	"pertemuan",
	"uts",
	"uas",
	"pkkmb",
	"custom",
]);
