"use client";

import { PlusCircle, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TripartiteFormState, TripartiteLog } from "./types";

interface TabTripartitProps {
	studentId: number;
	tripartiteLogs: TripartiteLog[];
	canEdit: boolean;
	isSaving: boolean;
	onAddTripartite: (form: TripartiteFormState) => Promise<void>;
	onDeleteTripartite: (id: number) => Promise<void>;
}

export function TabTripartit({
	studentId,
	tripartiteLogs,
	canEdit,
	isSaving,
	onAddTripartite,
	onDeleteTripartite,
}: TabTripartitProps) {
	const [form, setForm] = useState<TripartiteFormState>({
		contactType: "Orang Tua",
		contactName: "",
		contactDate: new Date().toISOString().split("T")[0],
		summary: "",
		result: "",
	});

	const handleAdd = async () => {
		if (!form.summary.trim()) {
			toast.error("Ringkasan pembicaraan harus diisi");
			return;
		}
		await onAddTripartite(form);
		setForm({
			contactType: "Orang Tua",
			contactName: "",
			contactDate: new Date().toISOString().split("T")[0],
			summary: "",
			result: "",
		});
	};

	return (
		<div className="space-y-6">
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
							<Users className="w-4 h-4" />
						</span>
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							LOG KOMUNIKASI TRIPARTIT (ORANG TUA & PIHAK EKSTERNAL)
						</h3>
					</div>
					<Badge
						variant="outline"
						className="text-xs bg-white text-slate-600 border-slate-200 font-semibold"
					>
						Total {tripartiteLogs.length} Catatan
					</Badge>
				</div>
				<div className="p-5">
					{/* Form Tambah */}
					{canEdit && (
						<div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 mb-6 space-y-3">
							<h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
								<PlusCircle className="w-4 h-4 text-indigo-700" />
								Tambah Catatan Komunikasi Tripartit
							</h4>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
								<div>
									<label className="text-[11px] font-medium text-slate-700 block mb-1">
										Pihak Dihubungi *
									</label>
									<Select
										value={form.contactType}
										onValueChange={(val) =>
											setForm({ ...form, contactType: val as string })
										}
									>
										<SelectTrigger className="bg-white">
											<SelectValue placeholder="Pihak Dihubungi" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Orang Tua">
												Orang Tua / Wali
											</SelectItem>
											<SelectItem value="Mitra PJTKI">Mitra PJTKI</SelectItem>
											<SelectItem value="Koordinator Lapangan">
												Koordinator Lapangan
											</SelectItem>
											<SelectItem value="Instansi / Sponsor">
												Instansi / Sponsor
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<label className="text-[11px] font-medium text-slate-700 block mb-1">
										Tanggal Kontak *
									</label>
									<Input
										type="date"
										className="bg-white"
										value={form.contactDate}
										onChange={(e) =>
											setForm({ ...form, contactDate: e.target.value })
										}
									/>
								</div>
								<div>
									<label className="text-[11px] font-medium text-slate-700 block mb-1">
										Nama Kontak (Opsional)
									</label>
									<Input
										placeholder="Contoh: Bpk. Sugeng (Ayah)"
										className="bg-white"
										value={form.contactName}
										onChange={(e) =>
											setForm({ ...form, contactName: e.target.value })
										}
									/>
								</div>
							</div>

							<div>
								<label className="text-[11px] font-medium text-slate-700 block mb-1">
									Ringkasan Pembicaraan *
								</label>
								<Textarea
									placeholder="Tulis ringkasan hasil komunikasi atau diskusi tripartit..."
									className="min-h-[80px] bg-white text-sm"
									value={form.summary}
									onChange={(e) =>
										setForm({ ...form, summary: e.target.value })
									}
								/>
							</div>

							<div>
								<label className="text-[11px] font-medium text-slate-700 block mb-1">
									Tindak Lanjut / Kesepakatan Hasil
								</label>
								<Input
									placeholder="Contoh: Orang tua menyetujui jadwal tambahan bimbingan"
									className="bg-white"
									value={form.result}
									onChange={(e) => setForm({ ...form, result: e.target.value })}
								/>
							</div>

							<div className="flex justify-end pt-1">
								<Button
									size="sm"
									onClick={handleAdd}
									disabled={isSaving}
									className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium gap-1.5"
								>
									<PlusCircle className="w-4 h-4" /> Simpan Catatan Tripartit
								</Button>
							</div>
						</div>
					)}

					{/* Timeline Riwayat Tripartit */}
					<div className="space-y-4">
						{tripartiteLogs.map((log) => (
							<div
								key={log.id}
								className="relative pl-6 pb-2 border-l-2 border-slate-200 last:border-transparent"
							>
								<div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white"></div>
								<div className="flex items-center justify-between mb-2">
									<h5 className="font-bold text-slate-800 text-sm">
										{log.contactType}{" "}
										{log.contactName ? `(${log.contactName})` : ""}
									</h5>
									<div className="flex items-center gap-2">
										<span className="text-xs text-slate-500 font-medium">
											{new Date(log.contactDate).toLocaleDateString("id-ID", {
												day: "2-digit",
												month: "short",
												year: "numeric",
											})}
										</span>
										{canEdit && (
											<button
												type="button"
												onClick={() => onDeleteTripartite(log.id)}
												className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
												title="Hapus log ini"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										)}
									</div>
								</div>
								<div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70 text-sm text-slate-700 mb-2 whitespace-pre-wrap leading-relaxed">
									"{log.summary}"
								</div>
								{log.result && (
									<div className="flex items-center gap-2 mt-2">
										<span className="text-xs text-slate-500 font-semibold uppercase">
											Hasil:
										</span>
										<span className="text-sm text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
											{log.result}
										</span>
									</div>
								)}
							</div>
						))}
						{tripartiteLogs.length === 0 && (
							<p className="text-sm text-slate-400 italic text-center py-8 border border-dashed border-slate-200 rounded-lg">
								Belum ada riwayat komunikasi tripartit.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
