"use client";

import {
	CheckCircle,
	CheckSquare,
	ChevronDown,
	Clock,
	Edit2,
	Loader2,
	PlusCircle,
	Save,
	Square,
	Trash2,
	X,
	XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

interface PaData {
	counselingDone: boolean;
	mentalStable: boolean;
	disciplineGood: boolean;
	vocabTarget: number;
	disciplineNotes: string | null;
	status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	isAcc: boolean;
	accAt: string | null;
	accBy: { fullName: string } | null;
}

interface VocabLog {
	id: number;
	date: string;
	addedWords: number;
	notes: string | null;
}

interface CounselingLog {
	id: number;
	date: string;
	notes: string;
	condition: string;
}

interface PaPanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function PaPanel({ studentId, onUpdate }: PaPanelProps) {
	const { user } = useAuthStore();
	const isPa = user?.role === "pa" || user?.role === "superadmin";
	const isSuperadmin = user?.role === "superadmin";

	const [paData, setPaData] = useState<PaData | null>(null);
	const [vocabLogs, setVocabLogs] = useState<VocabLog[]>([]);
	const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const canEdit = (isPa || isSuperadmin) && !paData?.isAcc;

	const fetchPaData = async () => {
		const { data, error } = await api.students[studentId.toString()].pa.get();
		if (!error && data) {
			setPaData(data.data.data as unknown as PaData);
			setVocabLogs(data.data.vocabLogs as unknown as VocabLog[]);
			setCounselingLogs(data.data.counselingLogs as unknown as CounselingLog[]);
		}
		setIsLoading(false);
	};

	useEffect(() => {
		fetchPaData();
	}, [studentId]);

	// Checklist Forms
	const handleChecklistChange = async (field: string, value: boolean) => {
		if (!canEdit) return;
		setIsSaving(true);
		await api.students[studentId.toString()].pa.patch({ [field]: value });
		await fetchPaData();
		onUpdate();
		setIsSaving(false);
	};

	// Discipline Notes
	const [disciplineNotes, setDisciplineNotes] = useState("");
	const [isEditingNotes, setIsEditingNotes] = useState(false);

	useEffect(() => {
		if (paData) setDisciplineNotes(paData.disciplineNotes || "");
	}, [paData]);

	const handleSaveNotes = async () => {
		setIsSaving(true);
		await api.students[studentId.toString()].pa.patch({ disciplineNotes });
		setIsEditingNotes(false);
		await fetchPaData();
		onUpdate();
		setIsSaving(false);
	};

	// Vocab Logic
	const totalVocab = vocabLogs.reduce((acc, log) => acc + log.addedWords, 0);
	const targetVocab = paData?.vocabTarget || 500;
	const vocabProgress = Math.min(
		100,
		Math.round((totalVocab / targetVocab) * 100),
	);

	const vocabProgressColor =
		vocabProgress >= 80
			? "bg-emerald-500"
			: vocabProgress >= 50
				? "bg-amber-500"
				: "bg-rose-500";

	const [vocabForm, setVocabForm] = useState({
		addedWords: 0,
		date: new Date().toISOString().split("T")[0],
		notes: "",
	});

	const handleAddVocab = async () => {
		if (vocabForm.addedWords <= 0) return;
		setIsSaving(true);
		await api.students[studentId.toString()].pa.vocabulary.post({
			addedWords: vocabForm.addedWords,
			date: vocabForm.date,
			notes: vocabForm.notes,
		});
		setVocabForm({
			addedWords: 0,
			date: new Date().toISOString().split("T")[0],
			notes: "",
		});
		await fetchPaData();
		onUpdate();
		setIsSaving(false);
	};

	const handleDeleteVocab = async (logId: number) => {
		setIsSaving(true);
		await api.students[studentId.toString()].pa.vocabulary[
			logId.toString()
		].delete();
		await fetchPaData();
		onUpdate();
		setIsSaving(false);
	};

	// Counseling Logic
	const [counselingForm, setCounselingForm] = useState({
		date: new Date().toISOString().split("T")[0],
		condition: "Stabil",
		notes: "",
	});

	const handleAddCounseling = async () => {
		if (!counselingForm.notes) return;
		setIsSaving(true);
		await api.students[studentId.toString()].pa.counseling.post({
			date: counselingForm.date,
			condition: counselingForm.condition,
			notes: counselingForm.notes,
		});
		setCounselingForm({
			date: new Date().toISOString().split("T")[0],
			condition: "Stabil",
			notes: "",
		});
		await fetchPaData();
		onUpdate();
		setIsSaving(false);
	};

	const handleDeleteCounseling = async (logId: number) => {
		setIsSaving(true);
		await api.students[studentId.toString()].pa.counseling[
			logId.toString()
		].delete();
		await fetchPaData();
		onUpdate();
		setIsSaving(false);
	};

	const handleAcc = async () => {
		setIsSaving(true);
		await api.students[studentId.toString()].pa.acc.post();
		await fetchPaData();
		onUpdate();
		setIsSaving(false);
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-20 text-slate-500">
				<Loader2 className="w-6 h-6 animate-spin mr-2" />
				Memuat data PA...
			</div>
		);
	}

	let panelStatusBadge = (
		<Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
			🟢 AMAN
		</Badge>
	);
	if (paData?.status === "TIDAK_AMAN") {
		panelStatusBadge = (
			<Badge className="bg-rose-50 text-rose-600 border-rose-200">
				🔴 TIDAK AMAN
			</Badge>
		);
	} else if (paData?.status === "PERLU_PERHATIAN") {
		panelStatusBadge = (
			<Badge className="bg-amber-50 text-amber-600 border-amber-200">
				🟡 PERLU PERHATIAN
			</Badge>
		);
	}

	return (
		<div className="space-y-6">
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="border-b border-slate-200 pb-4">
					<div className="flex justify-between items-center">
						<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
							<span className="text-xl">🤝</span> PA — Pendamping Akademik
						</CardTitle>
						<div className="flex items-center gap-3">
							<Badge
								variant="outline"
								className="border-slate-200 text-slate-500 bg-white"
							>
								Dikelola oleh: Admin PA
							</Badge>
							{panelStatusBadge}
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* LEFT COLUMN: CHECKLIST & DISCIPLINE */}
					<div className="space-y-8">
						<div>
							<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
								CHECKLIST PA
							</h3>
							<div className="space-y-3">
								<div
									className={`w-full flex items-center justify-between p-4 rounded-lg border ${paData?.counselingDone ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}
								>
									<div className="flex items-center gap-3">
										<div
											className="cursor-pointer"
											onClick={() =>
												canEdit &&
												handleChecklistChange(
													"counselingDone",
													!paData?.counselingDone,
												)
											}
										>
											{paData?.counselingDone ? (
												<CheckSquare className="w-5 h-5 text-emerald-600" />
											) : (
												<Square className="w-5 h-5 text-slate-400" />
											)}
										</div>
										<div
											className="text-left cursor-pointer"
											onClick={() =>
												canEdit &&
												handleChecklistChange(
													"counselingDone",
													!paData?.counselingDone,
												)
											}
										>
											<p
												className={`font-medium ${paData?.counselingDone ? "text-emerald-800" : "text-slate-700"}`}
											>
												Sesi Konseling
											</p>
											<p className="text-xs text-slate-500 mt-0.5">
												{counselingLogs.length} sesi telah terlaksana
											</p>
										</div>
									</div>
									{counselingLogs.length >= 3 && !paData?.counselingDone && (
										<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">
											Klik untuk Centang
										</Badge>
									)}
								</div>

								<div
									className={`w-full flex items-center justify-between p-4 rounded-lg border ${paData?.mentalStable ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}
								>
									<div className="flex items-center gap-3">
										<div
											className="cursor-pointer"
											onClick={() =>
												canEdit &&
												handleChecklistChange(
													"mentalStable",
													!paData?.mentalStable,
												)
											}
										>
											{paData?.mentalStable ? (
												<CheckSquare className="w-5 h-5 text-emerald-600" />
											) : (
												<Square className="w-5 h-5 text-slate-400" />
											)}
										</div>
										<div
											className="text-left cursor-pointer"
											onClick={() =>
												canEdit &&
												handleChecklistChange(
													"mentalStable",
													!paData?.mentalStable,
												)
											}
										>
											<p
												className={`font-medium ${paData?.mentalStable ? "text-emerald-800" : "text-slate-700"}`}
											>
												Kondisi Mental Stabil
											</p>
											<p className="text-xs text-slate-500 mt-0.5">
												Tidak ada indikasi masalah psikologis
											</p>
										</div>
									</div>
								</div>

								<div
									className={`w-full flex items-center justify-between p-4 rounded-lg border ${paData?.disciplineGood ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}
								>
									<div className="flex items-center gap-3">
										<div
											className="cursor-pointer"
											onClick={() =>
												canEdit &&
												handleChecklistChange(
													"disciplineGood",
													!paData?.disciplineGood,
												)
											}
										>
											{paData?.disciplineGood ? (
												<CheckSquare className="w-5 h-5 text-emerald-600" />
											) : (
												<Square className="w-5 h-5 text-slate-400" />
											)}
										</div>
										<div
											className="text-left cursor-pointer"
											onClick={() =>
												canEdit &&
												handleChecklistChange(
													"disciplineGood",
													!paData?.disciplineGood,
												)
											}
										>
											<p
												className={`font-medium ${paData?.disciplineGood ? "text-emerald-800" : "text-slate-700"}`}
											>
												Kedisiplinan Baik
											</p>
											<p className="text-xs text-slate-500 mt-0.5">
												Berdasarkan pemantauan asrama/harian
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
									CATATAN KEDISIPLINAN
								</h3>
								{canEdit && !isEditingNotes && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setIsEditingNotes(true)}
										className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
									>
										<Edit2 className="w-4 h-4 mr-1" /> Edit
									</Button>
								)}
							</div>

							{isEditingNotes ? (
								<div className="space-y-3">
									<Textarea
										value={disciplineNotes}
										onChange={(e) => setDisciplineNotes(e.target.value)}
										placeholder="Ketik catatan pelanggaran atau penghargaan..."
										className="min-h-[120px]"
									/>
									<div className="flex justify-end gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setIsEditingNotes(false)}
										>
											Batal
										</Button>
										<Button
											size="sm"
											onClick={handleSaveNotes}
											disabled={isSaving}
										>
											Simpan Catatan
										</Button>
									</div>
								</div>
							) : (
								<div className="p-4 rounded-lg bg-slate-50 border border-slate-200 min-h-[120px] text-sm text-slate-700 whitespace-pre-wrap">
									{paData?.disciplineNotes || (
										<span className="text-slate-400 italic">
											Belum ada catatan kedisiplinan.
										</span>
									)}
								</div>
							)}
						</div>
					</div>

					{/* RIGHT COLUMN: VOCAB & COUNSELING LOGS */}
					<div className="space-y-8">
						{/* VOCABULARY */}
						<div>
							<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
								SETORAN VOCABULARY
							</h3>
							<div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm mb-4">
								<div className="flex justify-between text-sm font-medium mb-2">
									<span className="text-slate-500">
										Target: {targetVocab} kata
									</span>
									<span className="text-blue-700">
										Tercapai: {totalVocab} kata
									</span>
								</div>
								<div className="flex items-center gap-3">
									<Progress
										value={vocabProgress}
										className="h-2 flex-1"
										indicatorClassName={vocabProgressColor}
									/>
									<span className="text-sm font-bold text-slate-700 w-10 text-right">
										{vocabProgress}%
									</span>
								</div>
							</div>

							{canEdit && (
								<div className="p-4 rounded-lg bg-blue-50 border border-blue-100 mb-4 space-y-3">
									<h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">
										Update Setoran Baru
									</h4>
									<div className="flex gap-2">
										<Input
											type="number"
											placeholder="Jumlah kata"
											className="w-32 bg-white"
											value={vocabForm.addedWords || ""}
											onChange={(e) =>
												setVocabForm({
													...vocabForm,
													addedWords: Number(e.target.value),
												})
											}
										/>
										<Input
											type="date"
											className="flex-1 bg-white"
											value={vocabForm.date}
											onChange={(e) =>
												setVocabForm({ ...vocabForm, date: e.target.value })
											}
										/>
									</div>
									<div className="flex gap-2">
										<Input
											type="text"
											placeholder="Catatan opsional (ex: Unit 1-5)"
											className="flex-1 bg-white"
											value={vocabForm.notes}
											onChange={(e) =>
												setVocabForm({ ...vocabForm, notes: e.target.value })
											}
										/>
										<Button
											size="sm"
											onClick={handleAddVocab}
											disabled={isSaving}
											className="shrink-0 bg-blue-600 hover:bg-blue-700"
										>
											<PlusCircle className="w-4 h-4 mr-1" /> Tambah
										</Button>
									</div>
								</div>
							)}

							<div className="max-h-[160px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
								{vocabLogs.map((log) => (
									<div
										key={log.id}
										className="flex justify-between items-center p-3 rounded-md bg-slate-50 border border-slate-100 text-sm"
									>
										<div className="flex items-center gap-3">
											<span className="w-2 h-2 rounded-full bg-blue-400"></span>
											<span className="text-slate-600 font-medium">
												{new Date(log.date).toLocaleDateString("id-ID", {
													day: "2-digit",
													month: "short",
													year: "numeric",
												})}
											</span>
											{log.notes && (
												<span className="text-slate-400 text-xs italic">
													— {log.notes}
												</span>
											)}
										</div>
										<div className="flex items-center gap-2">
											<span className="font-bold text-slate-700">
												+{log.addedWords} kata
											</span>
											{canEdit && (
												<button
													type="button"
													onClick={() => handleDeleteVocab(log.id)}
													className="text-slate-400 hover:text-rose-500 transition-colors"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											)}
										</div>
									</div>
								))}
								{vocabLogs.length === 0 && (
									<p className="text-sm text-slate-500 italic text-center py-4">
										Belum ada riwayat setoran.
									</p>
								)}
							</div>
						</div>

						{/* COUNSELING */}
						<div>
							<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
								LOG SESI KONSELING
							</h3>

							{canEdit && (
								<div className="p-4 rounded-lg bg-amber-50 border border-amber-100 mb-4 space-y-3">
									<h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
										Tambah Log Sesi
									</h4>
									<div className="flex gap-2">
										<Input
											type="date"
											className="flex-1 bg-white"
											value={counselingForm.date}
											onChange={(e) =>
												setCounselingForm({
													...counselingForm,
													date: e.target.value,
												})
											}
										/>
										<Select
											value={counselingForm.condition ?? ""}
											onValueChange={(val) =>
												setCounselingForm({
													...counselingForm,
													condition: val as string,
												})
											}
										>
											<SelectTrigger className="w-[160px] bg-white">
												<SelectValue placeholder="Kondisi" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Stabil">🟢 Stabil</SelectItem>
												<SelectItem value="Perlu Perhatian">
													🟡 Perlu Perhatian
												</SelectItem>
												<SelectItem value="Kritis">🔴 Kritis</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<Textarea
										placeholder="Catatan hasil konseling..."
										className="min-h-[80px] bg-white"
										value={counselingForm.notes}
										onChange={(e) =>
											setCounselingForm({
												...counselingForm,
												notes: e.target.value,
											})
										}
									/>
									<div className="flex justify-end">
										<Button
											size="sm"
											onClick={handleAddCounseling}
											disabled={isSaving}
											className="bg-amber-600 hover:bg-amber-700 text-white"
										>
											Simpan Sesi
										</Button>
									</div>
								</div>
							)}

							<div className="space-y-4">
								{counselingLogs.map((log, idx) => {
									const isStabil = log.condition === "Stabil";
									const isPerhatian = log.condition === "Perlu Perhatian";
									const conditionColor = isStabil
										? "bg-emerald-100 text-emerald-700"
										: isPerhatian
											? "bg-amber-100 text-amber-700"
											: "bg-rose-100 text-rose-700";

									return (
										<div
											key={log.id}
											className="relative pl-6 pb-2 border-l-2 border-slate-200 last:border-transparent"
										>
											<div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white"></div>
											<div className="flex items-center justify-between mb-2">
												<h5 className="font-bold text-slate-800 text-sm">
													Sesi #{counselingLogs.length - idx}
												</h5>
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
															onClick={() => handleDeleteCounseling(log.id)}
															className="text-slate-400 hover:text-rose-500 transition-colors"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													)}
												</div>
											</div>
											<div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 mb-2 whitespace-pre-wrap">
												"{log.notes}"
											</div>
											<div className="flex items-center gap-2">
												<span className="text-xs text-slate-500">
													Status Kondisi:
												</span>
												<Badge
													variant="secondary"
													className={`${conditionColor} hover:${conditionColor} border-none font-medium`}
												>
													{log.condition}
												</Badge>
											</div>
										</div>
									);
								})}
								{counselingLogs.length === 0 && (
									<p className="text-sm text-slate-500 italic py-2">
										Belum ada riwayat konseling.
									</p>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Status ACC Panel Card */}
			<Card
				className={`border shadow-sm overflow-hidden ${paData?.isAcc ? "bg-slate-50 border-slate-200" : "bg-blue-50 border-blue-200"}`}
			>
				<CardContent className="p-0">
					<div className="flex flex-col sm:flex-row items-center justify-between p-6">
						<div className="flex items-center gap-4 mb-4 sm:mb-0">
							{paData?.isAcc ? (
								<>
									<div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
										<CheckCircle className="w-6 h-6 text-slate-600" />
									</div>
									<div>
										<h4 className="text-slate-800 font-bold text-lg">
											✅ Disetujui (ACC) oleh {paData.accBy?.fullName || "PA"}
										</h4>
										<p className="text-sm text-slate-600">
											Pada{" "}
											{new Date(paData.accAt!).toLocaleDateString("id-ID", {
												day: "numeric",
												month: "long",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}{" "}
											WIB
										</p>
									</div>
								</>
							) : (
								<>
									<div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
										<CheckCircle className="w-6 h-6 text-blue-600" />
									</div>
									<div>
										<h4 className="text-blue-900 font-bold text-lg">
											ACC Panel Pendamping Akademik
										</h4>
										<p className="text-sm text-blue-700 max-w-md">
											Tandai bahwa progres pendampingan mahasiswa telah selesai
											atau mencapai target.
										</p>
									</div>
								</>
							)}
						</div>

						{isPa && !paData?.isAcc && (
							<AlertDialog>
								<AlertDialogTrigger
									render={
										<Button className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
											Berikan ACC
										</Button>
									}
								/>
								<AlertDialogContent>
									<AlertDialogTitle>Konfirmasi ACC PA</AlertDialogTitle>
									<AlertDialogDescription>
										Apakah Anda yakin ingin memberikan ACC? Ini akan mengunci
										seluruh data *Checklist*, Catatan, dan Setoran Vocabulary
										agar tidak bisa diubah lagi.
									</AlertDialogDescription>
									<div className="flex justify-end gap-3 mt-4">
										<AlertDialogCancel>Batal</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleAcc}
											className="bg-blue-600 hover:bg-blue-700"
										>
											Ya, Berikan ACC
										</AlertDialogAction>
									</div>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
