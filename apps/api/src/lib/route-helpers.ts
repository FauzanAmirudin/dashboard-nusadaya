/**
 * Pure helper and calculation functions for Backend Route Logic (Tahap 4)
 */

// ==========================================
// 1. ATTENDANCE LOGIC (Tasks 4.7 & 4.8)
// ==========================================

export const VALID_ATTENDANCE_STATUSES = [
	"hadir",
	"izin",
	"sakit",
	"alpa",
	"alpha",
] as const;

export type AttendanceStatus = (typeof VALID_ATTENDANCE_STATUSES)[number];

/**
 * Validates whether the given attendance status string is a recognized enum value.
 */
export function isValidAttendanceStatus(
	status: string | null | undefined,
): boolean {
	if (!status || typeof status !== "string") return false;
	const normalized = status.trim().toLowerCase();
	return (VALID_ATTENDANCE_STATUSES as readonly string[]).includes(normalized);
}

/**
 * Calculates attendance percentage safely without division by zero.
 */
export function calculateAttendanceRate(
	presentCount: number,
	totalMeetings: number,
): number {
	if (!totalMeetings || totalMeetings <= 0) return 0;
	if (presentCount <= 0) return 0;
	if (presentCount >= totalMeetings) return 100;
	return Math.round((presentCount / totalMeetings) * 100);
}

// ==========================================
// 2. FINANCE ROUTE VALIDATION & BILL STATUS (Tasks 4.9 & 4.10)
// ==========================================

export const VALID_PAYMENT_METHODS = ["dana_talangan", "mandiri"] as const;

export function isValidPaymentMethod(
	method: string | null | undefined,
): boolean {
	if (!method || typeof method !== "string") return false;
	return (VALID_PAYMENT_METHODS as readonly string[]).includes(
		method.trim().toLowerCase(),
	);
}

export function calculateFinanceBillStatus(finState: any): {
	isSemesterLunas: boolean;
	isRegistrasiLunas: boolean;
	isFinanceReady: boolean;
} {
	if (!finState) {
		return {
			isSemesterLunas: false,
			isRegistrasiLunas: false,
			isFinanceReady: false,
		};
	}

	const isTalangan = finState.metodePembayaran === "dana_talangan";
	const isSemesterLunas = isTalangan
		? Boolean(finState.t1SemesterStatus || finState.mandiriSemesterStatus)
		: Boolean(finState.mandiriSemesterStatus);

	const isRegistrasiLunas = Boolean(
		finState.registrasiStatus || finState.registrationPaid,
	);

	const isInterviewLunas = isTalangan
		? Boolean(finState.t1InterviewStatus)
		: Boolean(finState.mandiriInterviewStatus);

	const isKeberangkatanLunas = isTalangan
		? Boolean(finState.t2KeberangkatanStatus)
		: Boolean(finState.mandiriKeberangkatanStatus);

	const isToeicLunas = Boolean(finState.toeicStatus);
	const isPasporLunas = Boolean(finState.pasporStatus);

	const isFinanceReady =
		isRegistrasiLunas &&
		isSemesterLunas &&
		isInterviewLunas &&
		isKeberangkatanLunas &&
		isToeicLunas &&
		isPasporLunas;

	return {
		isSemesterLunas,
		isRegistrasiLunas,
		isFinanceReady,
	};
}

// ==========================================
// 3. COURSES GRADE SCORE CALCULATION (Task 4.11)
// ==========================================

export interface CourseScoreWeights {
	uts: number;
	uas: number;
	tugas: number;
}

export const DEFAULT_COURSE_WEIGHTS: CourseScoreWeights = {
	uts: 0.3,
	uas: 0.4,
	tugas: 0.3,
};

/**
 * Calculates final score based on weighted components (UTS, UAS, Tugas).
 */
export function calculateCourseFinalScore(
	uts: number,
	uas: number,
	tugas: number,
	weights: CourseScoreWeights = DEFAULT_COURSE_WEIGHTS,
): number {
	const safeUts = Math.max(0, Math.min(100, Number(uts) || 0));
	const safeUas = Math.max(0, Math.min(100, Number(uas) || 0));
	const safeTugas = Math.max(0, Math.min(100, Number(tugas) || 0));

	const totalWeight = weights.uts + weights.uas + weights.tugas;
	if (totalWeight <= 0) return 0;

	const rawScore =
		(safeUts * weights.uts +
			safeUas * weights.uas +
			safeTugas * weights.tugas) /
		totalWeight;

	return Math.round(rawScore * 100) / 100;
}

// ==========================================
// 4. MAHASISWA INPUT VALIDATION (Task 4.3)
// ==========================================

export const VALID_STUDENT_STATUSES = [
	"aktif",
	"cuti",
	"alumni",
	"keluar",
	"dropout",
	"mengundurkan_diri",
	"lulus",
] as const;

export function validateStudentInput(data: any): {
	isValid: boolean;
	errorField?: string;
	message?: string;
} {
	if (!data) {
		return { isValid: false, message: "Payload kosong" };
	}

	// 1. NIM validation
	if (!data.nim || typeof data.nim !== "string" || data.nim.trim() === "") {
		return {
			isValid: false,
			errorField: "nim",
			message: "NIM wajib diisi",
		};
	}

	if (data.nim.trim().length > 30) {
		return {
			isValid: false,
			errorField: "nim",
			message: "NIM melebihi panjang maksimal 30 karakter",
		};
	}

	// 2. Email format validation (if provided)
	if (data.email) {
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailRegex.test(String(data.email).trim())) {
			return {
				isValid: false,
				errorField: "email",
				message: "Format email tidak valid",
			};
		}
	}

	// 3. studentStatus enum validation
	if (data.studentStatus) {
		const statusNormalized = String(data.studentStatus).trim().toLowerCase();
		if (
			!(VALID_STUDENT_STATUSES as readonly string[]).includes(statusNormalized)
		) {
			return {
				isValid: false,
				errorField: "studentStatus",
				message: `Status mahasiswa '${data.studentStatus}' tidak valid`,
			};
		}
	}

	return { isValid: true };
}
