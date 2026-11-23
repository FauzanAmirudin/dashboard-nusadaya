import { eq } from "drizzle-orm";
import { db } from "../db";
import { feeShareRecipients, pmbData, pmbPaymentPlan } from "../db/schema";

/**
 * Syarat ACC PMB: ketiga tab Panel PMB harus lengkap.
 * - Dokumen: 4 berkas utama + 9 dokumen wajib (13).
 * - Skema Keuangan: Total Biaya > 0 dan Nominal DP > 0.
 * - Fee Sharing: minimal 1 penerima dan SEMUA penerima sudah dibayarkan Finance.
 */
export const PMB_REQUIRED_DOC_FIELDS = [
	"formReceived",
	"dataInputted",
	"initialFollowUp",
	"pasFoto",
	"docKtp",
	"docKk",
	"docCv",
	"docIjazah",
	"docTranskrip",
	"docPassportDepan",
	"docSkbm",
	"docPreMcu",
	"docSla",
] as const;

export interface PmbAccRequirements {
	dokumen: { ok: boolean; done: number; total: number };
	keuangan: { ok: boolean; totalBiaya: number; dp: number };
	feeSharing: { ok: boolean; paid: number; total: number };
	ok: boolean;
	missing: string[];
}

export async function getPmbAccRequirements(
	studentId: number,
): Promise<PmbAccRequirements> {
	const [pmb, plan, recipients] = await Promise.all([
		db.query.pmbData.findFirst({ where: eq(pmbData.studentId, studentId) }),
		db.query.pmbPaymentPlan.findFirst({
			where: eq(pmbPaymentPlan.studentId, studentId),
			columns: { totalBiaya: true, pendaftaranDp: true },
		}),
		db.query.feeShareRecipients.findMany({
			where: eq(feeShareRecipients.studentId, studentId),
			columns: { statusPencairan: true },
		}),
	]);

	const docDone = PMB_REQUIRED_DOC_FIELDS.filter((k) =>
		Boolean((pmb as Record<string, unknown> | undefined)?.[k]),
	).length;
	const dokumen = {
		ok: docDone === PMB_REQUIRED_DOC_FIELDS.length,
		done: docDone,
		total: PMB_REQUIRED_DOC_FIELDS.length,
	};

	const totalBiaya = plan?.totalBiaya ?? 0;
	const dp = plan?.pendaftaranDp ?? 0;
	const keuangan = { ok: totalBiaya > 0 && dp > 0, totalBiaya, dp };

	const paid = recipients.filter(
		(r) => r.statusPencairan === "sudah_dibayarkan",
	).length;
	const feeSharing = {
		ok: recipients.length > 0 && paid === recipients.length,
		paid,
		total: recipients.length,
	};

	const missing: string[] = [];
	if (!dokumen.ok)
		missing.push(`Dokumen (${dokumen.done}/${dokumen.total} berkas wajib)`);
	if (!keuangan.ok)
		missing.push("Skema Keuangan (total biaya & DP pendaftaran)");
	if (!feeSharing.ok)
		missing.push(
			feeSharing.total === 0
				? "Fee Sharing (belum ada penerima)"
				: `Fee Sharing (${paid}/${recipients.length} penerima sudah dibayarkan Finance)`,
		);

	return {
		dokumen,
		keuangan,
		feeSharing,
		ok: missing.length === 0,
		missing,
	};
}
