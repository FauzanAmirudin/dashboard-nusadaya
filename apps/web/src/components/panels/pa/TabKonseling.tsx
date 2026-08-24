"use client";

import {
	AlertTriangle,
	CheckCircle,
	MessageCircle,
	PlusCircle,
	Trash2,
} from "lucide-react";
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
import type { CounselingFormState, CounselingLog } from "./types";

interface TabKonselingProps {
	studentId: number;
	counselingLogs: CounselingLog[];
	canEdit: boolean;
	isSaving: boolean;
	onAddCounseling: (form: CounselingFormState) => Promise<void>;
	onDeleteCounseling: (id: number) => Promise<void>;
}

export function TabKonseling({
	studentId,
	counselingLogs,
	canEdit,
	isSaving,
	onAddCounseling,
	onDeleteCounseling,
}: TabKonselingProps) {
	const [form, setForm] = useState<CounselingFormState>({
		type: "konseling",
		date: new Date().toISOString().split("T")[0],
		condition: "Stabil",
		notes: "",
	});

	const handleAdd = async () => {
		if (!form.notes.trim()) {
			toast.error("Catatan konseling harus diisi");
			return;
		}

		await onAddCounseling(form);
		setForm({
			type: "konseling",
			date: new Date().toISOString().split("T")[0],
			condition: "Stabil",
			notes: "",
		});
	};

	return (
		<div className="space-y-6">
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
							<MessageCircle className="w-4 h-4" />
						</span>
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							LOG SESI KONSELING & PENDAMPINGAN PA
						</h3>
					</div>
					<Badge
						variant="outline"
						className="text-xs bg-white text-slate-600 border-slate-200 font-semibold"
					>
						Total {counselingLogs.length} Sesi
					</Badge>
				</div>
				<div className="p-5">
					{/* Form Tambah */}
					{canEdit && (
						<div className="p-5 rounded-xl bg-amber-50/70 border border-amber-200/80 mb-6 space-y-4">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
									<PlusCircle className="w-4 h-4 text-amber-700" />
									Tambah Log Sesi Konseling Baru
								</h4>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div>
									<label className="text-[11px] font-medium text-slate-700 block mb-1">
										Tipe Konseling
									</label>
									<Select
										value={form.type ?? "konseling"}
										onValueChange={(val) =>
											setForm({ ...form, type: val as string })
										}
									>
										<SelectTrigger className="bg-white">
											<SelectValue placeholder="Tipe Sesi" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="konseling">
												Sesi Konseling Akademik
											</SelectItem>
											<SelectItem value="konseling_mental">
												Konseling Mental / Psikologis
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<label className="text-[11px] font-medium text-slate-700 block mb-1">
										Tanggal Sesi *
									</label>
									<Input
										type="date"
										className="bg-white"
										value={form.date}
										onChange={(e) => setForm({ ...form, date: e.target.value })}
									/>
								</div>
								<div>
									<label className="text-[11px] font-medium text-slate-700 block mb-1">
										Status Kondisi Mahasiswa *
									</label>
									<Select
										value={form.condition}
										onValueChange={(val) =>
											setForm({ ...form, condition: val as string })
										}
									>
										<SelectTrigger className="bg-white">
											<SelectValue placeholder="Kondisi" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Stabil">Stabil</SelectItem>
											<SelectItem value="Perlu Perhatian">
												Perlu Perhatian
											</SelectItem>
											<SelectItem value="Kritis">Kritis</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div>
								<label className="text-[11px] font-medium text-slate-700 block mb-1">
									Catatan Hasil Konseling *
								</label>
								<Textarea
									placeholder="Tuliskan catatan hasil konseling, respon bimbingan, komitmen perubahan, serta tindak lanjut yang disepakati..."
									className="min-h-[100px] bg-white text-sm"
									value={form.notes}
									onChange={(e) => setForm({ ...form, notes: e.target.value })}
								/>
							</div>

							<div className="flex justify-end pt-1">
								<Button
									size="sm"
									onClick={handleAdd}
									disabled={isSaving}
									className="bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1.5"
								>
									<PlusCircle className="w-4 h-4" /> Simpan Sesi Konseling
								</Button>
							</div>
						</div>
					)}

					{/* Timeline Riwayat Konseling */}
					<div className="space-y-4">
						{counselingLogs.map((log, idx) => {
							const isStabil = log.condition === "Stabil";
							const isPerhatian = log.condition === "Perlu Perhatian";
							const conditionColor = isStabil
								? "bg-emerald-100 text-emerald-700 border-emerald-200"
								: isPerhatian
									? "bg-amber-100 text-amber-700 border-amber-200"
									: "bg-rose-100 text-rose-700 border-rose-200";

							return (
								<div
									key={log.id}
									className="relative pl-6 pb-2 border-l-2 border-slate-200 last:border-transparent"
								>
									<div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white"></div>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<h5 className="font-bold text-slate-800 text-sm">
												Sesi #{counselingLogs.length - idx}
											</h5>
											{log.type === "konseling_mental" && (
												<Badge
													variant="outline"
													className="text-[10px] bg-purple-50 text-purple-700 border-purple-200"
												>
													Mental
												</Badge>
											)}
										</div>
										<div className="flex items-center gap-2">
											<span className="text-xs text-slate-500 font-medium">
												{new Date(log.date).toLocaleDateString("id-ID", {
													day: "2-digit",
													month: "long",
													year: "numeric",
												})}
											</span>
											{canEdit && (
												<button
													type="button"
													onClick={() => onDeleteCounseling(log.id)}
													className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
													title="Hapus sesi ini"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											)}
										</div>
									</div>
									<div className="p-4 bg-slate-50 rounded-lg border border-slate-200/70 text-sm text-slate-700 mb-2 whitespace-pre-wrap leading-relaxed">
										"{log.notes}"
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-slate-500 font-medium">
											Status Kondisi:
										</span>
										<Badge
											variant="secondary"
											className={`${conditionColor} font-semibold text-xs`}
										>
											{log.condition}
										</Badge>
									</div>
								</div>
							);
						})}
						{counselingLogs.length === 0 && (
							<p className="text-sm text-slate-400 italic text-center py-8 border border-dashed border-slate-200 rounded-lg">
								Belum ada riwayat konseling.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
