import { getToken } from "@/lib/eden";

/**
 * Membuka pratinjau dokumen / bukti pembayaran menggunakan standard Document Review Page
 * yang konsisten dengan fitur review dokumen di semua panel (PMB, Magang, Akademik, PA, CRM).
 */
export function openDocumentReview(
	studentId: number | string = "review",
	fileUrl: string | null | undefined,
	fileName?: string | null,
	docId: number | string = "review",
) {
	if (!fileUrl) return;

	const token = getToken();
	const cleanUrl = fileUrl.startsWith("./") ? fileUrl.slice(1) : fileUrl;
	const finalName =
		fileName || cleanUrl.split("/").pop()?.split("?")[0] || "Dokumen_Bukti.pdf";

	const reviewUrl = `/dashboard/students/${studentId}/documents/${docId}?url=${encodeURIComponent(
		cleanUrl,
	)}&name=${encodeURIComponent(finalName)}&token=${token || ""}`;

	window.open(reviewUrl, "_blank");
}
