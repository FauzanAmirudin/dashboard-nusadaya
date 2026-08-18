"use client";

import { Briefcase, PlusCircle, Trash2 } from "lucide-react";
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
import type { InterviewFormState, InterviewLog } from "./types";

interface TabInterviewProps {
	studentId: number;
	interviewLogs: InterviewLog[];
	canEdit: boolean;
	isSaving: boolean;
	onAddInterview: (form: InterviewFormState) => Promise<void>;
	onDeleteInterview: (id: number) => Promise<void>;
}

export function TabInterview({
	studentId,
	interviewLogs,
	canEdit,
	isSaving,
	onAddInterview,
	onDeleteInterview,
}: TabInterviewProps) {
	const [form, setForm] = useState<InterviewFormState>({
		interviewDate: new Date().toISOString().split("T")[0],
		companyName: "",
		country: "",
		result: "Menunggu",
		notes: "",
	});

	const handleAdd = async () => {
		if (!form.companyName.trim()) {
			toast.error("Nama perusahaan harus diisi");
			return;
		}
		await onAddInterview(form);
		setForm({
			interviewDate: new Date().toISOString().split("T")[0],
			companyName: "",
			country: "",
			result: "Menunggu",
			notes: "",
		});
	};

	return (
		<div className="space-y-6">
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
							<Briefcase className="w-4 h-4" />
						</span>
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							LOG PENDAMPINGAN INTERVIEW KERJA & USER
						</h3>
					</div>
					<Badge
						variant="outline"
						className="text-xs bg-white text-slate-600 border-slate-200 font-semibold"
					>
						Total {interviewLogs.length} Sesi Interview
					</Badge>
				</div>
				<div className="p-5">
					{/* Form Tambah */}
					{canEdit && (
						<div className="p-4 rounded-xl bg-teal-50/70 border border-teal-100 mb-6 space-y-3">
							<h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
								<PlusCircle className="w-4 h-4 text-teal-700" />
								Tambah Log Pendampingan Interview
							</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
								<div>
									<label className="text-[11px] font-medium text-slate-700 block mb-1">
										Tanggal Interview *
									</label>
									<Input
										type="date"
										className="bg-white"
										value={form.interviewDate}
										onChange={(e) =>
											setForm({ ...form, interviewDate: e.target.value })
										}
									/>
								</div>
								<div>
									<label className="text-[11px] font-medium text-slate-700 block mb-1">
										Nama Perusahaan *
									</label>
									<Input
										placeholder="Contoh: Hilton Tokyo"
										className="bg-white"
										value={form.companyName}
										onChange={(e) =>
											setForm({ ...form, companyName: e.target.value })
										}
									/>
								</div>
								<div>
									<label className="text-[11px] font-medium text-slate-700 block mb-1">
										Negara Tujuan
									</label>
									<Input
										placeholder="Contoh: Jepang / Jerman"
										className="bg-white"
										value={form.country}
										onChange={(e) =>
											setForm({ ...form, country: e.target.value })
										}
									/>
								</div>
								<div>
									<label className="text-[11px] font-medium text-slate-700 block mb-1">
										Hasil Interview *
									</label>
									<Select
										value={form.result}
										onValueChange={(val) =>
											setForm({ ...form, result: val as string })
										}
									>
										<SelectTrigger className="bg-white">
											<SelectValue placeholder="Hasil" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Menunggu">⏳ Menunggu</SelectItem>
											<SelectItem value="Lulus">✅ Lulus</SelectItem>
											<SelectItem value="Tidak Lulus">
												❌ Tidak Lulus
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div>
								<label className="text-[11px] font-medium text-slate-700 block mb-1">
									Catatan Hasil Interview / Masukan Penguji
								</label>
								<Textarea
									placeholder="Catatan pertanyaan yang diajukan, performa bahasa, dan evaluasi hasil interview..."
									className="min-h-[70px] bg-white text-sm"
									value={form.notes}
									onChange={(e) => setForm({ ...form, notes: e.target.value })}
								/>
							</div>

							<div className="flex justify-end pt-1">
								<Button
									size="sm"
									onClick={handleAdd}
									disabled={isSaving}
									className="bg-teal-600 hover:bg-teal-700 text-white font-medium gap-1.5"
								>
									<PlusCircle className="w-4 h-4" /> Simpan Log Interview
								</Button>
							</div>
						</div>
					)}

					{/* Timeline Riwayat Interview */}
					<div className="space-y-4">
						{interviewLogs.map((log) => (
							<div
								key={log.id}
								className="relative pl-6 pb-2 border-l-2 border-slate-200 last:border-transparent"
							>
								<div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-white"></div>
								<div className="flex items-center justify-between mb-2">
									<h5 className="font-bold text-slate-800 text-sm">
										{log.companyName} {log.country ? `— ${log.country}` : ""}
									</h5>
									<div className="flex items-center gap-2">
										<span className="text-xs text-slate-500 font-medium">
											{new Date(log.interviewDate).toLocaleDateString("id-ID", {
												day: "2-digit",
												month: "short",
												year: "numeric",
											})}
										</span>
										{canEdit && (
											<button
												type="button"
												onClick={() => onDeleteInterview(log.id)}
												className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
												title="Hapus log interview ini"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										)}
									</div>
								</div>
								{log.notes && (
									<div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70 text-sm text-slate-700 mb-2 whitespace-pre-wrap leading-relaxed">
										"{log.notes}"
									</div>
								)}
								<div className="flex items-center gap-2 mt-2">
									<span className="text-xs text-slate-500 font-semibold uppercase">
										Hasil:
									</span>
									<Badge
										variant="outline"
										className={`font-semibold text-xs ${
											log.result === "Lulus"
												? "border-emerald-500 text-emerald-700 bg-emerald-50"
												: log.result === "Tidak Lulus"
													? "border-rose-500 text-rose-700 bg-rose-50"
													: "border-amber-500 text-amber-700 bg-amber-50"
										}`}
									>
										{log.result}
									</Badge>
								</div>
							</div>
						))}
						{interviewLogs.length === 0 && (
							<p className="text-sm text-slate-400 italic text-center py-8 border border-dashed border-slate-200 rounded-lg">
								Belum ada riwayat interview.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
