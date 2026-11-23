import { eq } from "drizzle-orm";
import { db } from "../db";
import { academicData, crmData, financeData, pmbData } from "../db/schema";

/**
 * Prasyarat mahasiswa diproses Panel Magang:
 * ACC PMB + ACC CRM + ACC Akademik + Finance sebagian (Registrasi & SPP Semester 1 lunas).
 * Termin Kontrak/Suhan & Keberangkatan dibayar selama proses magang, jadi bukan prasyarat.
 *
 * Cermin di web: getMagangPrerequisites (apps/web/src/utils/panel-logic.ts).
 */
export interface MagangPrereqInput {
	pmb?: { isAcc?: boolean | null } | null;
	crm?: { isAcc?: boolean | null } | null;
	academic?: { isAcc?: boolean | null } | null;
	finance?: {
		registrasiStatus?: boolean | null;
		metodePembayaran?: string | null;
		talanganTipe?: string | null;
		mandiriSemesterStatus?: boolean | null;
		t1SemesterStatus?: boolean | null;
	} | null;
}

export interface MagangPrerequisites {
	items: { key: string; label: string; ok: boolean }[];
	ok: boolean;
	missing: string[];
}

/** SPP Semester 1 lunas — aturan sama dengan ACC Finance (routes/student/finance.ts). */
export function isSemester1Paid(f: MagangPrereqInput["finance"]): boolean {
	const isTalangan = f?.metodePembayaran === "dana_talangan";
	if (isTalangan) {
		return (
			f?.talanganTipe === "1_tahap" ||
			Boolean(f?.t1SemesterStatus || f?.mandiriSemesterStatus)
		);
	}
	return Boolean(f?.mandiriSemesterStatus);
}

export function computeMagangPrerequisites(
	input: MagangPrereqInput,
): MagangPrerequisites {
	const items = [
		{ key: "pmb", label: "ACC PMB", ok: Boolean(input.pmb?.isAcc) },
		{ key: "crm", label: "ACC CRM", ok: Boolean(input.crm?.isAcc) },
		{
			key: "akademik",
			label: "ACC Akademik",
			ok: Boolean(input.academic?.isAcc),
		},
		{
			key: "registrasi",
			label: "Registrasi lunas",
			ok: Boolean(input.finance?.registrasiStatus),
		},
		{
			key: "spp1",
			label: "SPP Semester 1 lunas",
			ok: isSemester1Paid(input.finance),
		},
	];
	const missing = items.filter((i) => !i.ok).map((i) => i.label);
	return { items, ok: missing.length === 0, missing };
}

export async function getMagangPrerequisites(
	studentId: number,
): Promise<MagangPrerequisites> {
	const [pmb, crm, academic, finance] = await Promise.all([
		db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, studentId),
			columns: { isAcc: true },
		}),
		db.query.crmData.findFirst({
			where: eq(crmData.studentId, studentId),
			columns: { isAcc: true },
		}),
		db.query.academicData.findFirst({
			where: eq(academicData.studentId, studentId),
			columns: { isAcc: true },
		}),
		db.query.financeData.findFirst({
			where: eq(financeData.studentId, studentId),
			columns: {
				registrasiStatus: true,
				metodePembayaran: true,
				talanganTipe: true,
				mandiriSemesterStatus: true,
				t1SemesterStatus: true,
			},
		}),
	]);
	return computeMagangPrerequisites({ pmb, crm, academic, finance });
}
