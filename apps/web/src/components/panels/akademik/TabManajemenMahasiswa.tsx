"use client";

import { CheckCircle, Loader2, Save, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";

interface TabManajemenMahasiswaProps {
	studentId: number;
	canEdit: boolean;
	acadState: any;
	onRefresh: () => void;
}

export function TabManajemenMahasiswa({
	studentId,
	canEdit,
	acadState,
	onRefresh,
}: TabManajemenMahasiswaProps) {
	const [loadingItem, setLoadingItem] = useState<string | null>(null);
	const [isSavingNotes, setIsSavingNotes] = useState(false);
	const [notes, setNotes] = useState("");

	const [localChecks, setLocalChecks] = useState({
		pddiktiInput: false,
		utsPassed: false,
		uasPassed: false,
		attitudeIndicator: false,
		assignmentsCompleted: false,
		assessmentCompleted: false,
	});

	// State untuk input presensi manual (MVP)
	const [attendanceManual, setAttendanceManual] = useState({
		attendancePiketTotal: 0,
		attendancePiketPresent: 0,
		attendanceOdsTotal: 0,
		attendanceOdsPresent: 0,
		attendancePramagangTotal: 0,
		attendancePramagangPresent: 0,
	});
	const [isSavingAttendance, setIsSavingAttendance] = useState(false);

	useEffect(() => {
		if (acadState) {
			setLocalChecks({
				pddiktiInput: !!acadState.pddiktiInput,
				utsPassed: !!acadState.utsPassed,
				uasPassed: !!acadState.uasPassed,
				attitudeIndicator: !!acadState.attitudeIndicator,
				assignmentsCompleted: !!acadState.assignmentsCompleted,
				assessmentCompleted: !!acadState.assessmentCompleted,
			});
			setNotes(acadState.notes || "");
			setAttendanceManual({
				attendancePiketTotal: acadState.attendancePiketTotal || 0,
				attendancePiketPresent: acadState.attendancePiketPresent || 0,
				attendanceOdsTotal: acadState.attendanceOdsTotal || 0,
				attendanceOdsPresent: acadState.attendanceOdsPresent || 0,
				attendancePramagangTotal: acadState.attendancePramagangTotal || 0,
				attendancePramagangPresent: acadState.attendancePramagangPresent || 0,
			});
		}
	}, [acadState]);

	const handleCheckboxChange = async (id: string, checked: boolean) => {
		if (!canEdit) return;
		const prevState = { ...localChecks };
		setLocalChecks((prev) => ({ ...prev, [id]: checked }));
		setLoadingItem(id);

		try {
			const { error } = await api.students[studentId.toString()].academic.patch(
				{
					[id]: checked,
				},
			);
			if (!error) {
				toast.success("Status berhasil disimpan");
				onRefresh();
			} else {
				setLocalChecks(prevState);
				toast.error("Gagal menyimpan perubahan");
			}
		} catch (e) {
			setLocalChecks(prevState);
			toast.error("Gagal menyimpan perubahan");
		} finally {
			setLoadingItem(null);
		}
	};

	const handleSaveNotes = async () => {
		if (!canEdit) return;
		setIsSavingNotes(true);
		try {
			const { error } = await api.students[studentId.toString()].academic.patch(
				{
					notes,
				},
			);
			if (!error) {
				toast.success("Catatan akademik disimpan");
				onRefresh();
			} else {
				toast.error("Gagal menyimpan catatan");
			}
		} catch {
			toast.error("Gagal menyimpan catatan");
		} finally {
			setIsSavingNotes(false);
		}
	};

	const handleSaveAttendance = async () => {
		if (!canEdit) return;
		setIsSavingAttendance(true);
		try {
			const { error } =
				await api.students[studentId.toString()].academic.patch(
					attendanceManual,
				);
			if (!error) {
				toast.success("Data presensi berhasil disimpan");
				onRefresh();
			} else {
				toast.error("Gagal menyimpan presensi");
			}
		} catch {
			toast.error("Gagal menyimpan presensi");
		} finally {
			setIsSavingAttendance(false);
		}
	};

	const checklistData = [
		{
			id: "pddiktiInput",
			label: "Validasi PDDIKTI",
			desc: "Status validasi data PDDIKTI mahasiswa",
			docKey: "pddikti_bukti",
			docLabel: "Bukti Validasi PDDIKTI",
		},
		{
			id: "utsPassed",
			label: "Nilai UTS",
			desc: "Status kelulusan ujian tengah semester",
			docKey: "uts_passed",
			docLabel: "Dokumen Nilai UTS",
		},
		{
			id: "uasPassed",
			label: "Nilai UAS",
			desc: "Status kelulusan ujian akhir semester",
			docKey: "uas_passed",
			docLabel: "Dokumen Nilai UAS",
		},
		{
			id: "attitudeIndicator",
			label: "Indikator Sikap",
			desc: "Penilaian sikap dan etika mahasiswa",
			docKey: "attitude_indicator",
			docLabel: "Dokumen Indikator Sikap",
		},
		{
			id: "assignmentsCompleted",
			label: "Penyelesaian Tugas",
			desc: "Penyelesaian tugas utama perkuliahan",
			docKey: "assignments_completed",
			docLabel: "Dokumen Penyelesaian Tugas",
		},
		{
			id: "assessmentCompleted",
			label: "Asesmen Pra-keberangkatan",
			desc: "Hasil asesmen kesiapan mahasiswa sebelum berangkat",
			docKey: "pre_departure_assessment",
			docLabel: "Dokumen Asesmen",
		},
	];

	// Hitung presensi terintegrasi dari academicData (Mata Kuliah)
	const mkTotal = acadState?.attendanceTotal || 0;
	const mkPresent = acadState?.attendancePresent || 0;
	const mkPercentage =
		mkTotal > 0 ? Math.round((mkPresent / mkTotal) * 100) : 0;

	return (
		<div className="space-y-6">
			{/* DOKUMEN AKADEMIK SECTION */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
					<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
						DOKUMEN AKADEMIK & STATUS
					</h3>
				</div>
				<div className="p-5 space-y-6">
					{checklistData.map((item) => {
						const isChecked = (localChecks as any)[item.id];
						return (
							<div
								key={item.id}
								className="flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm"
							>
								{/* Header & Checkbox */}
								<div
									className={`flex items-center justify-between p-4 transition-colors ${
										isChecked
											? "bg-emerald-50/50"
											: "bg-white hover:bg-slate-50/50"
									}`}
								>
									<div className="flex items-center gap-4">
										<Checkbox
											id={item.id}
											checked={isChecked}
											onCheckedChange={(c) =>
												handleCheckboxChange(item.id, c as boolean)
											}
											disabled={!canEdit || loadingItem === item.id}
											className={`w-6 h-6 rounded-md transition-all ${
												isChecked
													? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
													: ""
											}`}
										/>
										<label htmlFor={item.id} className="cursor-pointer block">
											<div
												className={`text-base font-semibold flex items-center ${
													isChecked ? "text-emerald-900" : "text-slate-700"
												}`}
											>
												{item.label}
												{loadingItem === item.id && (
													<Loader2 className="w-4 h-4 text-emerald-600 animate-spin ml-2" />
												)}
											</div>
											<p
												className={`text-sm ${isChecked ? "text-emerald-700/80" : "text-slate-500"}`}
											>
												{item.desc}
											</p>
										</label>
									</div>
									<div className="shrink-0">
										{isChecked ? (
											<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">
												✔ Selesai
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-500 border-slate-300"
											>
												Belum Selesai
											</Badge>
										)}
									</div>
								</div>

								{/* Area Upload Dokumen */}
								<div className="p-4 bg-slate-50 border-t border-slate-100">
									<div className="flex items-center justify-between mb-3">
										<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
											{item.docLabel}
										</span>
									</div>
									<DocumentUpload
										studentId={studentId}
										panel="akademik"
										documentKey={item.docKey}
										canEdit={canEdit}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* PRESENSI SECTION */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
					<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
						PEMANTAUAN PRESENSI MAHASISWA
					</h3>
					<p className="text-xs text-slate-500 mt-1">
						Data kehadiran terintegrasi dengan Panel Dosen & PA
					</p>
				</div>
				<div className="p-5">
					<Tabs defaultValue="matakuliah" className="w-full">
						<TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1.5 rounded-xl border border-slate-200 h-auto gap-1 mb-6">
							<TabsTrigger
								value="matakuliah"
								className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm"
							>
								Mata Kuliah
							</TabsTrigger>
							<TabsTrigger
								value="piket"
								className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm"
							>
								Piket
							</TabsTrigger>
							<TabsTrigger
								value="ods"
								className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm"
							>
								One Day Service
							</TabsTrigger>
							<TabsTrigger
								value="pramagang"
								className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm"
							>
								PraMagang
							</TabsTrigger>
						</TabsList>

						<TabsContent value="matakuliah" className="space-y-4">
							<div className="bg-blue-50/50 border border-blue-100 p-6 rounded-lg text-center">
								<h4 className="text-lg font-semibold text-slate-800 mb-2">
									Presensi Mata Kuliah
								</h4>
								<p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
									Data ini ditarik secara otomatis dari pencatatan presensi oleh
									Dosen melalui Panel Dosen.
								</p>
								<div className="flex items-center justify-center gap-8">
									<div className="text-center">
										<p className="text-3xl font-bold text-[#0517B0]">
											{mkPresent}
										</p>
										<p className="text-xs text-slate-500 font-medium uppercase mt-1">
											Hadir
										</p>
									</div>
									<div className="text-center">
										<p className="text-3xl font-bold text-slate-700">
											{mkTotal}
										</p>
										<p className="text-xs text-slate-500 font-medium uppercase mt-1">
											Total Pertemuan
										</p>
									</div>
									<div className="text-center">
										<p
											className={`text-3xl font-bold ${mkPercentage >= 90 ? "text-emerald-600" : "text-rose-600"}`}
										>
											{mkPercentage}%
										</p>
										<p className="text-xs text-slate-500 font-medium uppercase mt-1">
											Persentase
										</p>
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="piket" className="space-y-4">
							<div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
								<h4 className="text-md font-semibold text-slate-800 mb-4">
									Input Presensi Piket
								</h4>
								<div className="grid grid-cols-2 gap-4 max-w-md">
									<div>
										<label className="text-xs font-medium text-slate-500 mb-1 block">
											Total Kehadiran
										</label>
										<Input
											type="number"
											min={0}
											placeholder="0"
											value={
												attendanceManual.attendancePiketPresent === 0
													? ""
													: attendanceManual.attendancePiketPresent
											}
											onChange={(e) =>
												setAttendanceManual({
													...attendanceManual,
													attendancePiketPresent:
														e.target.value === ""
															? 0
															: Math.max(0, Number(e.target.value)),
												})
											}
											disabled={!canEdit}
										/>
									</div>
									<div>
										<label className="text-xs font-medium text-slate-500 mb-1 block">
											Total Jadwal
										</label>
										<Input
											type="number"
											min={0}
											placeholder="0"
											value={
												attendanceManual.attendancePiketTotal === 0
													? ""
													: attendanceManual.attendancePiketTotal
											}
											onChange={(e) =>
												setAttendanceManual({
													...attendanceManual,
													attendancePiketTotal:
														e.target.value === ""
															? 0
															: Math.max(0, Number(e.target.value)),
												})
											}
											disabled={!canEdit}
										/>
									</div>
								</div>
								{canEdit && (
									<Button
										onClick={handleSaveAttendance}
										disabled={isSavingAttendance}
										className="mt-4 bg-[#0517B0] hover:bg-blue-800 text-white"
									>
										{isSavingAttendance ? (
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										) : (
											<Save className="w-4 h-4 mr-2" />
										)}
										Simpan Presensi
									</Button>
								)}
							</div>
						</TabsContent>

						<TabsContent value="ods" className="space-y-4">
							<div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
								<h4 className="text-md font-semibold text-slate-800 mb-4">
									Input Presensi One Day Service
								</h4>
								<div className="grid grid-cols-2 gap-4 max-w-md">
									<div>
										<label className="text-xs font-medium text-slate-500 mb-1 block">
											Total Kehadiran
										</label>
										<Input
											type="number"
											min={0}
											placeholder="0"
											value={
												attendanceManual.attendanceOdsPresent === 0
													? ""
													: attendanceManual.attendanceOdsPresent
											}
											onChange={(e) =>
												setAttendanceManual({
													...attendanceManual,
													attendanceOdsPresent:
														e.target.value === ""
															? 0
															: Math.max(0, Number(e.target.value)),
												})
											}
											disabled={!canEdit}
										/>
									</div>
									<div>
										<label className="text-xs font-medium text-slate-500 mb-1 block">
											Total Jadwal
										</label>
										<Input
											type="number"
											min={0}
											placeholder="0"
											value={
												attendanceManual.attendanceOdsTotal === 0
													? ""
													: attendanceManual.attendanceOdsTotal
											}
											onChange={(e) =>
												setAttendanceManual({
													...attendanceManual,
													attendanceOdsTotal:
														e.target.value === ""
															? 0
															: Math.max(0, Number(e.target.value)),
												})
											}
											disabled={!canEdit}
										/>
									</div>
								</div>
								{canEdit && (
									<Button
										onClick={handleSaveAttendance}
										disabled={isSavingAttendance}
										className="mt-4 bg-[#0517B0] hover:bg-blue-800 text-white"
									>
										{isSavingAttendance ? (
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										) : (
											<Save className="w-4 h-4 mr-2" />
										)}
										Simpan Presensi
									</Button>
								)}
							</div>
						</TabsContent>

						<TabsContent value="pramagang" className="space-y-4">
							<div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
								<h4 className="text-md font-semibold text-slate-800 mb-4">
									Input Presensi PraMagang
								</h4>
								<div className="grid grid-cols-2 gap-4 max-w-md">
									<div>
										<label className="text-xs font-medium text-slate-500 mb-1 block">
											Total Kehadiran
										</label>
										<Input
											type="number"
											min={0}
											placeholder="0"
											value={
												attendanceManual.attendancePramagangPresent === 0
													? ""
													: attendanceManual.attendancePramagangPresent
											}
											onChange={(e) =>
												setAttendanceManual({
													...attendanceManual,
													attendancePramagangPresent:
														e.target.value === ""
															? 0
															: Math.max(0, Number(e.target.value)),
												})
											}
											disabled={!canEdit}
										/>
									</div>
									<div>
										<label className="text-xs font-medium text-slate-500 mb-1 block">
											Total Jadwal
										</label>
										<Input
											type="number"
											min={0}
											placeholder="0"
											value={
												attendanceManual.attendancePramagangTotal === 0
													? ""
													: attendanceManual.attendancePramagangTotal
											}
											onChange={(e) =>
												setAttendanceManual({
													...attendanceManual,
													attendancePramagangTotal:
														e.target.value === ""
															? 0
															: Math.max(0, Number(e.target.value)),
												})
											}
											disabled={!canEdit}
										/>
									</div>
								</div>
								{canEdit && (
									<Button
										onClick={handleSaveAttendance}
										disabled={isSavingAttendance}
										className="mt-4 bg-[#0517B0] hover:bg-blue-800 text-white"
									>
										{isSavingAttendance ? (
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										) : (
											<Save className="w-4 h-4 mr-2" />
										)}
										Simpan Presensi
									</Button>
								)}
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</div>

			{/* CATATAN AKADEMIK SECTION */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
					<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
						CATATAN AKADEMIK
					</h3>
				</div>
				<div className="p-5">
					<Textarea
						placeholder="Tambahkan catatan khusus terkait akademik mahasiswa ini..."
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						disabled={!canEdit}
						className="min-h-[100px] bg-slate-50 resize-y mb-4"
					/>
					{canEdit && (
						<div className="flex justify-end">
							<Button
								onClick={handleSaveNotes}
								disabled={isSavingNotes}
								className="bg-slate-800 hover:bg-slate-700 text-white"
							>
								{isSavingNotes ? (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								) : (
									<Save className="w-4 h-4 mr-2" />
								)}
								Simpan Catatan
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
