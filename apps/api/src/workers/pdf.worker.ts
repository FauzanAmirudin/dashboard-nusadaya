import { dequeue } from "../lib/queue";

interface PdfJobPayload {
	jobId: string;
	template: string;
	studentId: number;
	outputCategory: string;
}

/**
 * PdfWorker — consumer dari queue:pdf.
 *
 * Untuk generate PDF dari template (transkrip, sertifikat, dll.):
 * - 2 worker (lebih banyak dari backup karena lebih ringan per job)
 * - Placeholder — implementasi template PDF di fase berikutnya
 */
export async function startPdfWorker(workerId = 1): Promise<void> {
	console.log(`🔄 PDF Worker #${workerId} started — listening on queue:pdf`);

	// eslint-disable-next-line no-constant-condition
	while (true) {
		try {
			const job = await dequeue<PdfJobPayload>("pdf", 5);
			if (!job) continue;

			console.log(
				`[PdfWorker#${workerId}] Processing PDF job ${job.payload.jobId} (template: ${job.payload.template})`,
			);

			// TODO: Implementasi PDF generation di fase berikutnya
			await new Promise((r) => setTimeout(r, 100));

			console.log(`[PdfWorker#${workerId}] Job ${job.payload.jobId} completed ✅`);
		} catch (err) {
			const error = err as Error;
			console.error(`[PdfWorker#${workerId}] Error:`, error.message);
			await new Promise((r) => setTimeout(r, 1000));
		}
	}
}
