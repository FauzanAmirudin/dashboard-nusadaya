import { dequeue } from "../lib/queue";

interface PdfJobPayload {
	jobId: string;
	template: string;
	studentId: number;
	outputCategory: string;
}

export async function startPdfWorker(workerId = 1): Promise<void> {
	console.log(`🔄 PDF Worker #${workerId} started — listening on queue:pdf`);

	// eslint-disable-next-line no-constant-condition
	while (true) {
		try {
			const job = await dequeue<PdfJobPayload>("pdf", 5);
			if (!job) {
				await new Promise((r) => setTimeout(r, 1000));
				continue;
			}

			console.log(
				`[PdfWorker#${workerId}] Processing PDF job ${job.payload.jobId} (template: ${job.payload.template})`,
			);

			await new Promise((r) => setTimeout(r, 100));

			console.log(
				`[PdfWorker#${workerId}] Job ${job.payload.jobId} completed ✅`,
			);
		} catch (err) {
			const error = err as Error;
			console.error(`[PdfWorker#${workerId}] Error:`, error.message);
			await new Promise((r) => setTimeout(r, 5000));
		}
	}
}
