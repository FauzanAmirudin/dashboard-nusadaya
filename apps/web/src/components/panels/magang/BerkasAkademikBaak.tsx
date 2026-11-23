"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { API_URL, getToken } from "@/lib/eden";
import { ChecklistGroup } from "./ChecklistRow";

const BAAK_ITEMS = [
	{
		key: "praPasporKhs",
		docKey: "khs",
		label: "KHS (Kartu Hasil Studi)",
	},
	{
		key: "praPasporKrs",
		docKey: "krs",
		label: "KRS (Kartu Rencana Studi)",
	},
	{
		key: "praPasporTranskrip",
		docKey: "transkrip",
		label: "Transkrip Akademik Kumulatif",
	},
];

/**
 * Tiga berkas akademik (KHS, KRS, Transkrip) — bagian dari 13 syarat Pra-Paspor.
 * Status ketiganya tidak dicentang manual: diisi otomatis oleh sinkronisasi
 * BAAK Akademik (`syncKhsToMagang`). Nilai perkuliahannya sendiri ada di tab
 * Nilai Akademik.
 */
export function BerkasAkademikBaak({
	studentId,
	data,
	canEdit,
	fetchInternshipData,
}: {
	studentId: number;
	data: Record<string, unknown> | null;
	canEdit: boolean;
	fetchInternshipData: () => Promise<void>;
}) {
	const [isSyncing, setIsSyncing] = useState(false);

	const items = BAAK_ITEMS.map((it) => ({
		...it,
		done: Boolean(data?.[it.key]),
	}));
	const doneCount = items.filter((it) => it.done).length;

	const handleSyncFromAcademic = async () => {
		setIsSyncing(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/academic/sync-to-magang`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			const json = await res.json();
			if (json.success) {
				toast.success(
					"KHS, KRS & Transkrip berhasil disinkronkan dari BAAK Akademik!",
				);
				await fetchInternshipData();
			} else {
				toast.error(json.message || "Gagal sinkronisasi data akademik");
			}
		} catch (err: unknown) {
			toast.error(
				err instanceof Error ? err.message : "Gagal terhubung ke server",
			);
		} finally {
			setIsSyncing(false);
		}
	};

	return (
		<ChecklistGroup
			title="Berkas Akademik (dari BAAK)"
			done={doneCount}
			total={items.length}
		>
			<li className="space-y-4 px-4 py-4 sm:px-6">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0">
						<p className="text-xs text-slate-500">
							Tercentang otomatis saat BAAK Akademik melakukan sinkronisasi,
							bukan dicentang manual.
						</p>
						<ul className="mt-2 flex flex-wrap gap-2">
							{items.map((it) => (
								<li
									key={it.key}
									className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
										it.done
											? "border-emerald-200 bg-emerald-50 text-emerald-800"
											: "border-amber-200 bg-amber-50 text-amber-800"
									}`}
								>
									<span aria-hidden="true">{it.done ? "✓" : "!"}</span>
									{it.label.split(" (")[0]}
									<span className="sr-only">
										{it.done ? "sudah tersinkron" : "belum tersinkron"}
									</span>
								</li>
							))}
						</ul>
					</div>

					{doneCount < items.length && (
						<Button
							type="button"
							onClick={handleSyncFromAcademic}
							disabled={!canEdit || isSyncing}
							className="h-10 shrink-0 gap-1.5 bg-[#0517B0] px-4 text-xs font-bold text-white hover:bg-blue-800"
						>
							{isSyncing ? (
								<>
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
									Menyinkronkan...
								</>
							) : (
								<>
									<RefreshCw className="h-3.5 w-3.5" />
									Sinkronkan dari BAAK
								</>
							)}
						</Button>
					)}
				</div>

				<ul className="divide-y divide-slate-100 border-t border-slate-100">
					{items.map((it) => (
						<li key={it.docKey} className="py-3">
							<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] md:items-start md:gap-6">
								<div className="min-w-0">
									<p className="text-sm font-semibold text-slate-900">
										{it.label}
									</p>
								</div>
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey={it.docKey}
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</li>
					))}
				</ul>
			</li>
		</ChecklistGroup>
	);
}
