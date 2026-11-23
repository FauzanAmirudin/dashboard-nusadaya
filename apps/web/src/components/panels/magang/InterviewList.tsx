"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/eden";
import { rowInputClass, toDateInput } from "./ChecklistRow";

type InterviewResult = "lulus" | "menunggu" | "tidak_lulus";

interface Interview {
	id: number;
	interviewDate: string | null;
	partnerName: string | null;
	result: InterviewResult;
}

const RESULT_LABEL: Record<InterviewResult, string> = {
	lulus: "Lulus",
	menunggu: "Menunggu",
	tidak_lulus: "Tidak Lulus",
};

/** Daftar wawancara user (bisa lebih dari satu): tanggal + hotel/agent + hasil. */
export function InterviewList({
	studentId,
	canEdit,
}: {
	studentId: number;
	canEdit: boolean;
}) {
	const [items, setItems] = useState<Interview[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isAdding, setIsAdding] = useState(false);
	const [savingId, setSavingId] = useState<number | null>(null);

	const endpoint = api.students[studentId.toString()].internship.interviews;

	const load = async () => {
		try {
			const res = await endpoint.get();
			if (res.data?.success) setItems(res.data.data as unknown as Interview[]);
		} catch {
			toast.error("Gagal memuat data wawancara");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, [studentId]);

	const handleAdd = async () => {
		setIsAdding(true);
		const { data, error } = await endpoint.post({ result: "menunggu" });
		if (error || !data?.success) {
			toast.error("Gagal menambah wawancara");
		} else {
			setItems((prev) => [...prev, data.data as unknown as Interview]);
		}
		setIsAdding(false);
	};

	const save = async (
		id: number,
		patch: Partial<Pick<Interview, "interviewDate" | "partnerName" | "result">>,
	) => {
		setSavingId(id);
		const { error } = await endpoint[id.toString()].patch(patch);
		if (error) {
			toast.error("Gagal menyimpan wawancara");
			await load(); // kembalikan ke data server
		} else {
			toast.success("Wawancara disimpan");
		}
		setSavingId(null);
	};

	const remove = async (id: number) => {
		const { error } = await endpoint[id.toString()].delete();
		if (error) {
			toast.error("Gagal menghapus wawancara");
		} else {
			setItems((prev) => prev.filter((i) => i.id !== id));
			toast.success("Wawancara dihapus");
		}
	};

	const setLocal = (id: number, patch: Partial<Interview>) =>
		setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

	if (isLoading) {
		return (
			<p className="flex items-center gap-2 text-xs text-slate-500">
				<Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat wawancara...
			</p>
		);
	}

	return (
		<div className="space-y-2">
			{items.length === 0 ? (
				<p className="text-xs text-slate-500">Belum ada wawancara dicatat.</p>
			) : (
				<ol className="space-y-2">
					{items.map((it, idx) => (
						<li
							key={it.id}
							className="rounded-lg border border-slate-200 bg-white p-3"
						>
							<div className="mb-2 flex items-center justify-between gap-2">
								<span className="text-xs font-semibold text-slate-700">
									Wawancara {idx + 1}
									{savingId === it.id && (
										<Loader2 className="ml-1.5 inline w-3.5 h-3.5 animate-spin text-slate-400" />
									)}
								</span>
								{canEdit && (
									<AlertDialog>
										<AlertDialogTrigger
											render={
												<Button
													variant="ghost"
													size="sm"
													className="h-8 px-2 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800 gap-1"
													aria-label={`Hapus wawancara ${idx + 1}`}
												/>
											}
										>
											<Trash2 className="w-3.5 h-3.5" />
											Hapus
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Hapus wawancara?</AlertDialogTitle>
												<AlertDialogDescription>
													Wawancara {idx + 1}
													{it.partnerName ? ` dengan ${it.partnerName}` : ""}{" "}
													akan dihapus permanen.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<div className="flex justify-end gap-2">
												<AlertDialogCancel>Batal</AlertDialogCancel>
												<AlertDialogAction onClick={() => remove(it.id)}>
													Ya, hapus
												</AlertDialogAction>
											</div>
										</AlertDialogContent>
									</AlertDialog>
								)}
							</div>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
								<div className="space-y-1">
									<label
										htmlFor={`iv-date-${it.id}`}
										className="block text-xs font-medium text-slate-600"
									>
										Tanggal
									</label>
									<Input
										id={`iv-date-${it.id}`}
										type="date"
										className={rowInputClass}
										value={toDateInput(it.interviewDate)}
										disabled={!canEdit}
										onChange={(e) =>
											setLocal(it.id, { interviewDate: e.target.value || null })
										}
										onBlur={(e) =>
											save(it.id, { interviewDate: e.target.value || null })
										}
									/>
								</div>
								<div className="space-y-1">
									<label
										htmlFor={`iv-partner-${it.id}`}
										className="block text-xs font-medium text-slate-600"
									>
										Hotel / Nama Agent
									</label>
									<Input
										id={`iv-partner-${it.id}`}
										placeholder="Contoh: Grand Hyatt / Hong Ta"
										className={rowInputClass}
										value={it.partnerName ?? ""}
										disabled={!canEdit}
										onChange={(e) =>
											setLocal(it.id, { partnerName: e.target.value })
										}
										onBlur={(e) =>
											save(it.id, { partnerName: e.target.value || null })
										}
									/>
								</div>
								<div className="space-y-1">
									<span className="block text-xs font-medium text-slate-600">
										Hasil
									</span>
									<Select
										value={it.result}
										disabled={!canEdit}
										onValueChange={(val) => {
											const result = val as InterviewResult;
											setLocal(it.id, { result });
											save(it.id, { result });
										}}
									>
										<SelectTrigger
											aria-label={`Hasil wawancara ${idx + 1}`}
											className={`w-full ${rowInputClass}`}
										>
											<SelectValue>{RESULT_LABEL[it.result]}</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{(Object.keys(RESULT_LABEL) as InterviewResult[]).map(
												(k) => (
													<SelectItem key={k} value={k}>
														{RESULT_LABEL[k]}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								</div>
							</div>
						</li>
					))}
				</ol>
			)}
			{canEdit && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleAdd}
					disabled={isAdding}
					className="h-9 gap-1.5 border-blue-200 text-sm font-semibold text-[#0517B0] hover:bg-blue-50"
				>
					{isAdding ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Plus className="w-4 h-4" />
					)}
					Tambah wawancara
				</Button>
			)}
		</div>
	);
}
