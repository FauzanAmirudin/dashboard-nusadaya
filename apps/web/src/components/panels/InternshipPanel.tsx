"use client";

import {
	AlertCircle,
	CalendarClock,
	CheckCircle,
	CheckSquare,
	ChevronDown,
	ChevronUp,
	Clock,
	Plane,
	Plus,
	Save,
	Square,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

interface InternshipData {
	passportReady: boolean;
	passportNo: string | null;
	passportExp: string | null;
	interviewReady: boolean;
	interviewDate: string | null;
	interviewResult: string | null;
	lolReady: boolean;
	lolDate: string | null;
	lolNotes: string | null;
	loaConfirmed: boolean;
	loaDate: string | null;
	moaReady: boolean;
	moaDate: string | null;
	moaNotes: string | null;
	contractReady: boolean;
	contractDate: string | null;
	mcuReady: boolean;
	mcuPlace: string | null;
	mcuDate: string | null;
	mcuResult: string | null;
	visaReady: boolean;
	visaType: string | null;
	visaStatus: string | null;
	visaNo: string | null;
	ticketReady: boolean;
	ticketAirline: string | null;
	ticketDate: string | null;
	ticketFlight: string | null;
	pdtReady: boolean;
	pdtDate: string | null;
	pdtPlace: string | null;
	estDepartureDate: string | null;
	destinationCity: string | null;
	internshipDuration: string | null;
	internshipCompany: string | null;
	danaTahap1Amount: number | null;
	danaTahap1Date: string | null;
	danaTahap1Notes: string | null;
	isDanaTahap1Disbursed: boolean;
	danaTahap2Amount: number | null;
	danaTahap2Date: string | null;
	danaTahap2Notes: string | null;
	isDanaTahap2Disbursed: boolean;
	notes: string | null;
	status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	isAcc: boolean;
	accAt: string | null;
	accBy: { fullName: string } | null;
}

interface InternshipPanelProps {
	studentId: number;
	destinationCountry?: string | null;
	onUpdate: () => void;
}

export function InternshipPanel({
	studentId,
	destinationCountry,
	onUpdate,
}: InternshipPanelProps) {
	const { user } = useAuthStore();
	const isMagang = user?.role === "magang" || user?.role === "superadmin";
	const isSuperadmin = user?.role === "superadmin";
	const [data, setData] = useState<InternshipData | null>(null);

	const isTaiwan = destinationCountry
		? destinationCountry.toLowerCase().includes("taiwan")
		: false;

	const canEdit = (isMagang || isSuperadmin) && !data?.isAcc;
	const canEditPostInternship = isMagang || isSuperadmin;

	const [isSaving, setIsSaving] = useState(false);
	const [activeTab, setActiveTab] = useState<
		"pra-paspor" | "dokumen" | "dana-talangan" | "syarat-akhir"
	>("dokumen");
	const [pmbPaymentData, setPmbPaymentData] = useState<any>(null);
	const [postInternshipDocs, setPostInternshipDocs] = useState<any[]>([]);

	const [expandedItem, setExpandedItem] = useState<string | null>(null);

	const [passportClearance, setPassportClearance] = useState<any>(null);
	const [monitoringHistory, setMonitoringHistory] = useState<any[]>([]);

	const toggleExpand = (item: string) => {
		setExpandedItem(expandedItem === item ? null : item);
	};

	const fetchInternshipData = async () => {
		const res = await api.students[studentId.toString()].internship.get();
		if (res.data?.success && res.data.data) {
			const fetchedData = res.data.data as unknown as InternshipData;
			setData(fetchedData);
			setScheduleForm({
				estDepartureDate: fetchedData.estDepartureDate
					? new Date(fetchedData.estDepartureDate).toISOString().split("T")[0]
					: "",
				destinationCity: fetchedData.destinationCity || "",
				internshipDuration: fetchedData.internshipDuration || "",
				internshipCompany: fetchedData.internshipCompany || "",
			});
			setNotes(fetchedData.notes || "");
		}

		const pcRes =
			await api.students[studentId.toString()]["passport-clearance"].get();
		if (pcRes.data?.success) {
			setPassportClearance(pcRes.data);
		}

		// Fetch monitoring history
		const monRes =
			await api.magang.monitoring.student[studentId.toString()].get();
		if (monRes.data?.success) {
			setMonitoringHistory(monRes.data.data as any[]);
		}

		// Fetch PMB context for Dana Talangan
		try {
			const pmbRes = await api.students[studentId.toString()].pmb.get();
			if (pmbRes.data?.success) {
				setPmbPaymentData((pmbRes.data.data as any)?.paymentPlan || null);
			}
		} catch (e) {
			console.error("Failed to fetch PMB data in Internship Panel", e);
		}

		// Fetch Post Internship Docs
		try {
			const postRes =
				await api.students[studentId.toString()][
					"post-internship"
				].documents.get();
			if (postRes.data?.success) {
				setPostInternshipDocs(postRes.data.data as any[]);
			}
		} catch (e) {
			console.error("Failed to fetch post internship docs", e);
		}
	};

	useEffect(() => {
		fetchInternshipData();
	}, [studentId]);

	const handleLocalChange = (field: keyof InternshipData, value: any) => {
		if (!canEdit) return;
		setData((prev) =>
			prev ? ({ ...prev, [field]: value } as InternshipData) : null,
		);
	};

	const handleBlurField = async (field: keyof InternshipData) => {
		if (!canEdit || !data) return;
		setIsSaving(true);
		await api.students[studentId.toString()].internship.patch({
			[field]: data[field],
		});
		onUpdate(); // Trigger parent refresh for overall status
		setIsSaving(false);
	};

	const handleToggleField = async (field: keyof InternshipData, value: any) => {
		if (!canEdit) return;
		setData((prev) =>
			prev ? ({ ...prev, [field]: value } as InternshipData) : null,
		);
		setIsSaving(true);
		await api.students[studentId.toString()].internship.patch({
			[field]: value,
		});
		onUpdate();
		setIsSaving(false);
	};

	const handleToggleTaiwanChain = async (checked: boolean) => {
		if (!canEdit) return;
		setData((prev) =>
			prev
				? ({
						...prev,
						lolReady: checked,
						loaConfirmed: checked,
						moaReady: checked,
					} as InternshipData)
				: null,
		);
		setIsSaving(true);
		await api.students[studentId.toString()].internship.patch({
			lolReady: checked,
			loaConfirmed: checked,
			moaReady: checked,
		});
		onUpdate();
		setIsSaving(false);
	};

	const [scheduleForm, setScheduleForm] = useState({
		estDepartureDate: data?.estDepartureDate
			? new Date(data.estDepartureDate).toISOString().split("T")[0]
			: "",
		destinationCity: data?.destinationCity || "",
		internshipDuration: data?.internshipDuration || "",
		internshipCompany: data?.internshipCompany || "",
	});

	const handleSaveSchedule = async () => {
		if (!canEdit) return;
		setIsSaving(true);
		await api.students[studentId.toString()].internship.schedule.patch(
			scheduleForm,
		);
		await fetchInternshipData();
		onUpdate();
		setIsSaving(false);
	};

	const [notes, setNotes] = useState(data?.notes || "");
	const handleSaveNotes = async () => {
		if (!canEdit) return;
		setIsSaving(true);
		await api.students[studentId.toString()].internship.patch({ notes });
		await fetchInternshipData();
		onUpdate();
		setIsSaving(false);
	};

	const handleAcc = async () => {
		setIsSaving(true);
		await api.students[studentId.toString()].internship.acc.post();
		await fetchInternshipData();
		onUpdate();
		setIsSaving(false);
	};

	const handleCancelAcc = async () => {
		setIsSaving(true);
		await api.students[studentId.toString()].internship.acc.delete();
		await fetchInternshipData();
		onUpdate();
		setIsSaving(false);
	};

	const handleAddMonitoring = async () => {
		if (!canEdit) return;
		setIsSaving(true);
		const nextDate = new Date();
		nextDate.setMonth(nextDate.getMonth() + 3);
		await api.magang.monitoring.post({
			studentId: studentId,
			scheduledDate: nextDate.toISOString(),
		});
		await fetchInternshipData();
		setIsSaving(false);
	};

	const checks = [
		data?.passportReady,
		data?.interviewReady,
		data?.lolReady,
		data?.loaConfirmed,
		data?.moaReady,
		data?.contractReady,
		data?.mcuReady,
		data?.visaReady,
		data?.ticketReady,
		data?.pdtReady,
	];
	const completedCount = checks.filter(Boolean).length;

	let panelStatusBadge = (
		<Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
			🟢 {completedCount}/8 AMAN
		</Badge>
	);
	if (data?.status === "TIDAK_AMAN") {
		panelStatusBadge = (
			<Badge className="bg-rose-50 text-rose-600 border-rose-200">
				🔴 {completedCount}/8 TIDAK AMAN
			</Badge>
		);
	} else if (data?.status === "PERLU_PERHATIAN") {
		panelStatusBadge = (
			<Badge className="bg-amber-50 text-amber-600 border-amber-200">
				🟡 {completedCount}/8 PROSES
			</Badge>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<div className="border-b border-slate-200 pb-4 mb-6">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div>
							<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
								<span className="text-xl">✈️</span> Tim Magang Internasional
								<span className="ml-2 text-sm font-normal text-slate-500">
									[{completedCount}/8]
								</span>
							</CardTitle>
							<p className="text-sm text-slate-500 mt-1">
								Dikelola oleh: Tim Magang | Tujuan:{" "}
								{data?.destinationCity || "Belum ditentukan"}
							</p>
						</div>
						<div className="flex items-center gap-3">
							{isSuperadmin && !isMagang && (
								<Badge
									variant="outline"
									className="text-slate-400 border-slate-300"
								>
									👁 Mode Lihat Saja
								</Badge>
							)}
							{panelStatusBadge}
						</div>
					</div>
				</div>

				{/* TABS NAVIGATION */}
				<div className="flex space-x-2 border-b border-slate-200 mb-6">
					<button
						onClick={() => setActiveTab("pra-paspor")}
						className={`px-4 py-2 font-medium text-sm ${activeTab === "pra-paspor" ? "border-b-2 border-[#0517B0] text-[#0517B0]" : "text-slate-500 hover:text-slate-700"}`}
					>
						Kelayakan Pra-Paspor
					</button>
					<button
						onClick={() => setActiveTab("dokumen")}
						className={`px-4 py-2 font-medium text-sm ${activeTab === "dokumen" ? "border-b-2 border-[#0517B0] text-[#0517B0]" : "text-slate-500 hover:text-slate-700"}`}
					>
						Dokumen Keberangkatan
					</button>
					<button
						onClick={() => setActiveTab("dana-talangan")}
						className={`px-4 py-2 font-medium text-sm ${activeTab === "dana-talangan" ? "border-b-2 border-[#0517B0] text-[#0517B0]" : "text-slate-500 hover:text-slate-700"}`}
					>
						Dana Talangan
					</button>
					<button
						onClick={() => setActiveTab("syarat-akhir")}
						className={`px-4 py-2 font-medium text-sm ${activeTab === "syarat-akhir" ? "border-b-2 border-[#0517B0] text-[#0517B0]" : "text-slate-500 hover:text-slate-700"}`}
					>
						Dokumen Syarat Akhir
					</button>
				</div>

				{activeTab === "pra-paspor" && (
					<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
						<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								STATUS KELAYAKAN PRA-PASPOR (9 SYARAT)
							</h3>
						</div>
						<div className="p-5">
							<div className="mb-4">
								<h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
									<span>Kelengkapan Berkas Sidik Paspor</span>
									{passportClearance?.isAllClear ? (
										<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
											Lengkap
										</Badge>
									) : (
										<Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">
											Belum Lengkap
										</Badge>
									)}
								</h4>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
									{[
										{
											label: "Pas Foto",
											key: "pasFoto",
											panel: "pmb",
											docKey: "pas_foto",
										},
										{
											label: "CV Format Industri",
											key: "cv",
											panel: "pmb",
											docKey: "cv",
										},
										{
											label: "KTM Aktif",
											key: "ktm",
											panel: "pmb",
											docKey: "ktm",
										},
										{
											label: "KHS Semester Berjalan",
											key: "khs",
											panel: "akademik",
											docKey: "khs",
										},
										{
											label: "Statement Letter (SL21)",
											key: "sl21",
											panel: "pmb",
											docKey: "sl21",
										},
										{
											label: "Surat Ket. Mahasiswa Aktif",
											key: "skma",
											panel: "pmb",
											docKey: "skma",
										},
										...(passportClearance?.isGapYear
											? [
													{
														label: "Dokumen Gap Year",
														key: "gapYear",
														panel: "pmb",
														docKey: "gap_year",
													},
												]
											: []),
										{
											label: "Scan KTP/KK/Akta",
											key: "ktpKkAkta",
											panel: "pmb",
											docKey: "ktp_kk_akta",
										},
										{
											label: "NIM Tervalidasi PDDikti",
											key: "pddikti",
											panel: null,
											docKey: null,
										},
									].map((item, idx) => (
										<div
											key={idx}
											className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
										>
											<div className="flex items-start gap-3 mb-3">
												<div className="mt-0.5 shrink-0">
													{passportClearance?.checks?.[item.key] ? (
														<CheckCircle className="w-5 h-5 text-emerald-500" />
													) : (
														<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
													)}
												</div>
												<span
													className={`text-sm font-bold ${passportClearance?.checks?.[item.key] ? "text-slate-800" : "text-slate-600"}`}
												>
													{item.label}
												</span>
											</div>
											<div className="mt-auto pt-2 border-t border-slate-200/60">
												{item.panel ? (
													<DocumentUpload
														studentId={studentId}
														panel={item.panel as any}
														documentKey={item.docKey!}
														canEdit={canEdit}
														onUploadSuccess={fetchInternshipData}
													/>
												) : (
													<div className="text-xs text-slate-500 italic py-2 flex items-center justify-center bg-white rounded border border-slate-200 border-dashed">
														Divalidasi oleh Tim Akademik
													</div>
												)}
											</div>
										</div>
									))}
								</div>

								<div className="flex justify-end mt-6">
									<Tooltip>
										<TooltipTrigger render={<span className="inline-block" />}>
											<span>
												<Button
													disabled={!passportClearance?.isAllClear}
													className="bg-[#0517B0] hover:bg-blue-800 text-white disabled:bg-slate-300 disabled:text-slate-500 text-sm h-10 px-6"
												>
													<DocumentUpload
														studentId={studentId}
														panel="magang"
														documentKey="passportRecommendation"
														canEdit={canEdit && !!passportClearance?.isAllClear}
														hideLabel={true}
													/>
													Surat Rekomendasi Sidik Paspor
												</Button>
											</span>
										</TooltipTrigger>
										{!passportClearance?.isAllClear && (
											<TooltipContent>
												<p>Lengkapi 9 berkas kelayakan terlebih dahulu</p>
											</TooltipContent>
										)}
									</Tooltip>
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === "dana-talangan" && (
					<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
						<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
								💰 DANA TALANGAN (BANK TARA)
							</h3>
						</div>

						{pmbPaymentData && (
							<div className="bg-slate-50 border-b border-slate-200 p-4 mx-5 mt-5 rounded-lg border">
								<h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
									📋 Konteks Pengajuan PMB (Read-Only)
								</h4>

								{pmbPaymentData.pengajuanDanaTalangan ? (
									<div className="bg-amber-50 border border-amber-200 rounded-md p-3">
										<div className="flex items-center gap-2 text-amber-700 mb-1">
											<AlertCircle className="w-4 h-4" />
											<span className="text-xs font-bold uppercase tracking-wider">
												Ada Pengajuan Dana Talangan
											</span>
										</div>
										<p className="text-sm text-amber-900 whitespace-pre-wrap">
											{pmbPaymentData.pengajuanDanaTalangan}
										</p>
										<div className="mt-3 text-xs text-amber-800 font-medium">
											<span className="mr-4">
												Total Biaya PMB: Rp{" "}
												{pmbPaymentData.totalBiaya?.toLocaleString("id-ID") ||
													0}
											</span>
											<span>
												Total DP: Rp{" "}
												{pmbPaymentData.totalDp?.toLocaleString("id-ID") || 0}
											</span>
										</div>
									</div>
								) : (
									<div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 flex items-center gap-2 text-emerald-700">
										<CheckCircle className="w-4 h-4" />
										<span className="text-xs font-bold uppercase tracking-wider">
											Tidak Ada Pengajuan Dana Talangan dari PMB
										</span>
									</div>
								)}
							</div>
						)}

						<div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
							{/* Tahap 1 */}
							<div className="space-y-4 border border-slate-200 rounded-lg p-5">
								<h4 className="text-sm font-bold text-slate-800 border-b pb-2">
									TAHAP 1 - BIAYA AWAL
								</h4>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="isDanaTahap1Disbursed"
										checked={!!data?.isDanaTahap1Disbursed}
										onCheckedChange={(checked) =>
											handleToggleField(
												"isDanaTahap1Disbursed",
												checked === true,
											)
										}
										disabled={!canEdit}
									/>
									<label
										htmlFor="isDanaTahap1Disbursed"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Telah Dicairkan
									</label>
								</div>

								<div className="space-y-2">
									<label className="text-xs font-medium text-slate-500">
										Jumlah (Rp)
									</label>
									<Input
										disabled={!canEdit}
										type="number"
										value={data?.danaTahap1Amount || ""}
										onChange={(e) =>
											handleLocalChange(
												"danaTahap1Amount",
												parseInt(e.target.value) || 0,
											)
										}
										onBlur={() => handleBlurField("danaTahap1Amount")}
										className="bg-white"
										placeholder="0"
									/>
								</div>

								<div className="space-y-2">
									<label className="text-xs font-medium text-slate-500">
										Tanggal Pencairan
									</label>
									<Input
										disabled={!canEdit}
										type="date"
										value={
											data?.danaTahap1Date
												? new Date(data.danaTahap1Date)
														.toISOString()
														.split("T")[0]
												: ""
										}
										onChange={(e) =>
											handleLocalChange("danaTahap1Date", e.target.value)
										}
										onBlur={() => handleBlurField("danaTahap1Date")}
										className="bg-white"
									/>
								</div>

								<div className="space-y-2">
									<label className="text-xs font-medium text-slate-500">
										Catatan
									</label>
									<Textarea
										disabled={!canEdit}
										value={data?.danaTahap1Notes || ""}
										onChange={(e) =>
											handleLocalChange("danaTahap1Notes", e.target.value)
										}
										onBlur={() => handleBlurField("danaTahap1Notes")}
										className="bg-white min-h-[80px]"
										placeholder="Tambahkan catatan..."
									/>
								</div>
							</div>

							{/* Tahap 2 */}
							<div className="space-y-4 border border-slate-200 rounded-lg p-5 relative">
								{!data?.visaReady && (
									<div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300">
										<div className="bg-white p-3 rounded-full shadow-sm mb-2">
											<Square className="w-6 h-6 text-slate-400" />
										</div>
										<p className="text-sm font-bold text-slate-700">
											TAHAP 2 TERKUNCI
										</p>
										<p className="text-xs text-slate-500 max-w-[200px] text-center mt-1">
											Hanya bisa dicairkan setelah status Visa berstatus READY.
										</p>
									</div>
								)}
								<h4 className="text-sm font-bold text-slate-800 border-b pb-2 flex justify-between items-center">
									<span>TAHAP 2 - SETELAH VISA</span>
									{!data?.visaReady && (
										<Badge variant="secondary" className="text-[10px]">
											Terkunci
										</Badge>
									)}
								</h4>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="isDanaTahap2Disbursed"
										checked={!!data?.isDanaTahap2Disbursed}
										onCheckedChange={(checked) =>
											handleToggleField(
												"isDanaTahap2Disbursed",
												checked === true,
											)
										}
										disabled={!canEdit || !data?.visaReady}
									/>
									<label
										htmlFor="isDanaTahap2Disbursed"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Telah Dicairkan
									</label>
								</div>

								<div className="space-y-2">
									<label className="text-xs font-medium text-slate-500">
										Jumlah (Rp)
									</label>
									<Input
										disabled={!canEdit || !data?.visaReady}
										type="number"
										value={data?.danaTahap2Amount || ""}
										onChange={(e) =>
											handleLocalChange(
												"danaTahap2Amount",
												parseInt(e.target.value) || 0,
											)
										}
										onBlur={() => handleBlurField("danaTahap2Amount")}
										className="bg-white"
										placeholder="0"
									/>
								</div>

								<div className="space-y-2">
									<label className="text-xs font-medium text-slate-500">
										Tanggal Pencairan
									</label>
									<Input
										disabled={!canEdit || !data?.visaReady}
										type="date"
										value={
											data?.danaTahap2Date
												? new Date(data.danaTahap2Date)
														.toISOString()
														.split("T")[0]
												: ""
										}
										onChange={(e) =>
											handleLocalChange("danaTahap2Date", e.target.value)
										}
										onBlur={() => handleBlurField("danaTahap2Date")}
										className="bg-white"
									/>
								</div>

								<div className="space-y-2">
									<label className="text-xs font-medium text-slate-500">
										Catatan
									</label>
									<Textarea
										disabled={!canEdit || !data?.visaReady}
										value={data?.danaTahap2Notes || ""}
										onChange={(e) =>
											handleLocalChange("danaTahap2Notes", e.target.value)
										}
										onBlur={() => handleBlurField("danaTahap2Notes")}
										className="bg-white min-h-[80px]"
										placeholder="Tambahkan catatan..."
									/>
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === "dokumen" && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						{/* LEFT COLUMN: DOCUMENT CHECKLIST */}
						<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
							<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
									STATUS DOKUMEN KEBERANGKATAN
								</h3>
							</div>
							<div className="p-5 space-y-3">
								{/* PASSPORT */}
								<Collapsible
									open={expandedItem === "passport"}
									onOpenChange={() => toggleExpand("passport")}
									className="border rounded-lg border-slate-200 bg-white shadow-sm overflow-hidden"
								>
									<div
										className={`flex items-center p-3 transition-colors ${data?.passportReady ? "bg-emerald-50 border-b border-emerald-200" : "bg-slate-50 border-b border-slate-200 hover:bg-slate-100"}`}
									>
										<div className="mr-3">
											<Checkbox
												id="passportReady"
												checked={!!data?.passportReady}
												onCheckedChange={(checked) =>
													handleToggleField("passportReady", checked === true)
												}
												disabled={!canEdit}
												className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
											/>
										</div>
										<CollapsibleTrigger className="flex-1 text-left flex items-center justify-between text-sm font-bold text-slate-800 cursor-pointer">
											Paspor
											{expandedItem === "passport" ? (
												<ChevronUp className="w-4 h-4 text-slate-400" />
											) : (
												<ChevronDown className="w-4 h-4 text-slate-400" />
											)}
										</CollapsibleTrigger>
									</div>
									<CollapsibleContent className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50">
										<div className="pt-2 mb-3">
											<div className="flex items-center justify-between mb-2">
												<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
													Lampiran Dokumen
												</span>
											</div>
											<DocumentUpload
												studentId={studentId}
												panel="magang"
												documentKey="passport"
												canEdit={canEdit}
											/>
										</div>
										<div className="grid grid-cols-2 gap-3 mt-3">
											<div className="space-y-1">
												<label className="text-xs font-medium text-slate-500">
													No. Paspor
												</label>
												<Input
													disabled={!canEdit}
													value={data?.passportNo || ""}
													onChange={(e) =>
														handleLocalChange("passportNo", e.target.value)
													}
													onBlur={() => handleBlurField("passportNo")}
													placeholder="A1234567"
													className="bg-white text-sm h-8"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-xs font-medium text-slate-500">
													Tanggal Expired
												</label>
												<Input
													disabled={!canEdit}
													type="date"
													value={
														data?.passportExp
															? new Date(data.passportExp)
																	.toISOString()
																	.split("T")[0]
															: ""
													}
													onChange={(e) =>
														handleLocalChange("passportExp", e.target.value)
													}
													onBlur={() => handleBlurField("passportExp")}
													className="bg-white text-sm h-8"
												/>
											</div>
										</div>
									</CollapsibleContent>
								</Collapsible>

								{/* INTERVIEW */}
								<Collapsible
									open={expandedItem === "interview"}
									onOpenChange={() => toggleExpand("interview")}
									className="border rounded-lg border-slate-200 bg-white shadow-sm overflow-hidden"
								>
									<div
										className={`flex items-center p-3 transition-colors ${data?.interviewReady ? "bg-emerald-50 border-b border-emerald-200" : "bg-slate-50 border-b border-slate-200 hover:bg-slate-100"}`}
									>
										<div className="mr-3">
											<Checkbox
												id="interviewReady"
												checked={!!data?.interviewReady}
												onCheckedChange={(checked) =>
													handleToggleField("interviewReady", checked === true)
												}
												disabled={!canEdit}
												className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
											/>
										</div>
										<CollapsibleTrigger className="flex-1 text-left flex items-center justify-between text-sm font-bold text-slate-800 cursor-pointer">
											Interview User
											{expandedItem === "interview" ? (
												<ChevronUp className="w-4 h-4 text-slate-400" />
											) : (
												<ChevronDown className="w-4 h-4 text-slate-400" />
											)}
										</CollapsibleTrigger>
									</div>
									<CollapsibleContent className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50">
										<div className="pt-2 mb-3">
											<div className="flex items-center justify-between mb-2">
												<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
													Lampiran Dokumen
												</span>
											</div>
											<DocumentUpload
												studentId={studentId}
												panel="magang"
												documentKey="interview"
												canEdit={canEdit}
											/>
										</div>
										<div className="grid grid-cols-2 gap-3 mt-3">
											<div className="space-y-1">
												<label className="text-xs font-medium text-slate-500">
													Tanggal Interview
												</label>
												<Input
													disabled={!canEdit}
													type="date"
													value={
														data?.interviewDate
															? new Date(data.interviewDate)
																	.toISOString()
																	.split("T")[0]
															: ""
													}
													onChange={(e) =>
														handleLocalChange("interviewDate", e.target.value)
													}
													onBlur={() => handleBlurField("interviewDate")}
													className="bg-white text-sm h-8"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-xs font-medium text-slate-500">
													Hasil
												</label>
												<Select
													disabled={!canEdit}
													value={data?.interviewResult ?? ""}
													onValueChange={(val) =>
														handleToggleField("interviewResult", val)
													}
												>
													<SelectTrigger className="bg-white h-8 text-sm">
														<SelectValue placeholder="Status" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="Lulus">Lulus</SelectItem>
														<SelectItem value="Pending">Pending</SelectItem>
														<SelectItem value="Tidak Lulus">
															Tidak Lulus
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
									</CollapsibleContent>
								</Collapsible>

								{/* RANTAI KONTRAK TAIWAN (LoL -> LoA -> MoA) */}
								{isTaiwan && (
									<Collapsible
										open={expandedItem === "rantai-kontrak"}
										onOpenChange={() => toggleExpand("rantai-kontrak")}
										className="border rounded-lg border-slate-200 bg-white shadow-sm overflow-hidden"
									>
										<div
											className={`flex items-center p-3 transition-colors ${data?.lolReady && data?.loaConfirmed && data?.moaReady ? "bg-emerald-50 border-b border-emerald-200" : "bg-slate-50 border-b border-slate-200 hover:bg-slate-100"}`}
										>
											<div className="mr-3">
												<Checkbox
													id="taiwanChainReady"
													checked={
														!!(
															data?.lolReady &&
															data?.loaConfirmed &&
															data?.moaReady
														)
													}
													onCheckedChange={(checked) =>
														handleToggleTaiwanChain(checked === true)
													}
													disabled={!canEdit}
													className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
												/>
											</div>
											<CollapsibleTrigger className="flex-1 text-left flex items-center justify-between text-sm font-bold text-slate-800 cursor-pointer pl-2">
												Rantai Kontrak Taiwan (LoL → LoA → MoA)
												{expandedItem === "rantai-kontrak" ? (
													<ChevronUp className="w-4 h-4 text-slate-400" />
												) : (
													<ChevronDown className="w-4 h-4 text-slate-400" />
												)}
											</CollapsibleTrigger>
										</div>
										<CollapsibleContent className="px-4 pb-4 pt-4 border-t border-slate-100 bg-slate-50 space-y-6">
											{/* State 1: LoL */}
											<div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
												{data?.lolReady && (
													<div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
												)}
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center gap-2">
														<div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
															1
														</div>
														<h4 className="font-bold text-slate-800 text-sm">
															Letter of Offer (LoL)
														</h4>
													</div>
													<Checkbox
														checked={!!data?.lolReady}
														onCheckedChange={(checked) =>
															handleToggleField("lolReady", checked === true)
														}
														disabled={!canEdit}
														className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
													/>
												</div>
												<div className="grid grid-cols-2 gap-3 pl-8">
													<div className="space-y-1">
														<label className="text-xs font-medium text-slate-500">
															Tanggal LoL
														</label>
														<Input
															type="date"
															value={
																data?.lolDate
																	? new Date(data.lolDate)
																			.toISOString()
																			.split("T")[0]
																	: ""
															}
															onChange={(e) =>
																handleLocalChange("lolDate", e.target.value)
															}
															onBlur={() => handleBlurField("lolDate")}
															disabled={!canEdit}
															className="h-8 text-sm bg-white"
														/>
													</div>
													<div className="space-y-1">
														<label className="text-xs font-medium text-slate-500">
															Catatan LoL
														</label>
														<Input
															value={data?.lolNotes || ""}
															onChange={(e) =>
																handleLocalChange("lolNotes", e.target.value)
															}
															onBlur={() => handleBlurField("lolNotes")}
															disabled={!canEdit}
															className="h-8 text-sm bg-white"
															placeholder="Catatan..."
														/>
													</div>
												</div>
											</div>

											{/* State 2: LoA */}
											<div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
												{data?.loaConfirmed && (
													<div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
												)}
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center gap-2">
														<div
															className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${data?.lolReady ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}
														>
															2
														</div>
														<h4
															className={`font-bold text-sm ${data?.lolReady ? "text-slate-800" : "text-slate-400"}`}
														>
															Letter of Acceptance (LoA)
														</h4>
													</div>
													<Tooltip>
														<TooltipTrigger>
															<div>
																<Checkbox
																	checked={!!data?.loaConfirmed}
																	onCheckedChange={(checked) =>
																		handleToggleField(
																			"loaConfirmed",
																			checked === true,
																		)
																	}
																	disabled={!canEdit || !data?.lolReady}
																	className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
																/>
															</div>
														</TooltipTrigger>
														{!data?.lolReady && (
															<TooltipContent>
																<p>
																	Selesaikan Letter of Offer (LoL) terlebih
																	dahulu.
																</p>
															</TooltipContent>
														)}
													</Tooltip>
												</div>
												<div className="pl-8 mb-3">
													<DocumentUpload
														studentId={studentId}
														panel="magang"
														documentKey="loa"
														canEdit={canEdit && !!data?.lolReady}
													/>
												</div>
												<div className="pl-8">
													<div className="space-y-1 w-1/2 pr-1.5">
														<label className="text-xs font-medium text-slate-500">
															Tanggal LoA
														</label>
														<Input
															type="date"
															value={
																data?.loaDate
																	? new Date(data.loaDate)
																			.toISOString()
																			.split("T")[0]
																	: ""
															}
															onChange={(e) =>
																handleLocalChange("loaDate", e.target.value)
															}
															onBlur={() => handleBlurField("loaDate")}
															disabled={!canEdit || !data?.lolReady}
															className="h-8 text-sm bg-white"
														/>
													</div>
												</div>
											</div>

											{/* State 3: MoA */}
											<div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
												{data?.moaReady && (
													<div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
												)}
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center gap-2">
														<div
															className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${data?.loaConfirmed ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}
														>
															3
														</div>
														<h4
															className={`font-bold text-sm ${data?.loaConfirmed ? "text-slate-800" : "text-slate-400"}`}
														>
															Dokumen Suhhan / MoA
														</h4>
													</div>
													<Tooltip>
														<TooltipTrigger>
															<div>
																<Checkbox
																	checked={!!data?.moaReady}
																	onCheckedChange={(checked) =>
																		handleToggleField(
																			"moaReady",
																			checked === true,
																		)
																	}
																	disabled={!canEdit || !data?.loaConfirmed}
																	className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
																/>
															</div>
														</TooltipTrigger>
														{!data?.loaConfirmed && (
															<TooltipContent>
																<p>
																	Selesaikan Letter of Acceptance (LoA) terlebih
																	dahulu.
																</p>
															</TooltipContent>
														)}
													</Tooltip>
												</div>
												<div className="pl-8 mb-3">
													<DocumentUpload
														studentId={studentId}
														panel="magang"
														documentKey="moa"
														canEdit={canEdit && !!data?.loaConfirmed}
													/>
												</div>
												<div className="grid grid-cols-2 gap-3 pl-8">
													<div className="space-y-1">
														<label className="text-xs font-medium text-slate-500">
															Tanggal MoA
														</label>
														<Input
															type="date"
															value={
																data?.moaDate
																	? new Date(data.moaDate)
																			.toISOString()
																			.split("T")[0]
																	: ""
															}
															onChange={(e) =>
																handleLocalChange("moaDate", e.target.value)
															}
															onBlur={() => handleBlurField("moaDate")}
															disabled={!canEdit || !data?.loaConfirmed}
															className="h-8 text-sm bg-white"
														/>
													</div>
													<div className="space-y-1">
														<label className="text-xs font-medium text-slate-500">
															No / Catatan MoA
														</label>
														<Input
															value={data?.moaNotes || ""}
															onChange={(e) =>
																handleLocalChange("moaNotes", e.target.value)
															}
															onBlur={() => handleBlurField("moaNotes")}
															disabled={!canEdit || !data?.loaConfirmed}
															className="h-8 text-sm bg-white"
															placeholder="Nomor dokumen..."
														/>
													</div>
												</div>
											</div>
										</CollapsibleContent>
									</Collapsible>
								)}

								{/* KONTRAK */}
								<Collapsible
									open={expandedItem === "contract"}
									onOpenChange={() => toggleExpand("contract")}
									className="border rounded-lg border-slate-200 bg-white shadow-sm overflow-hidden"
								>
									<div
										className={`flex items-center p-3 transition-colors ${data?.contractReady ? "bg-emerald-50 border-b border-emerald-200" : "bg-slate-50 border-b border-slate-200 hover:bg-slate-100"}`}
									>
										<div className="mr-3">
											<Checkbox
												id="contractReady"
												checked={!!data?.contractReady}
												onCheckedChange={(checked) =>
													handleToggleField("contractReady", checked === true)
												}
												disabled={!canEdit}
												className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
											/>
										</div>
										<CollapsibleTrigger className="flex-1 text-left flex items-center justify-between text-sm font-bold text-slate-800 cursor-pointer">
											Kontrak Magang
											{expandedItem === "contract" ? (
												<ChevronUp className="w-4 h-4 text-slate-400" />
											) : (
												<ChevronDown className="w-4 h-4 text-slate-400" />
											)}
										</CollapsibleTrigger>
									</div>
									<CollapsibleContent className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50">
										<div className="pt-2 mb-3">
											<div className="flex items-center justify-between mb-2">
												<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
													Lampiran Dokumen
												</span>
											</div>
											<DocumentUpload
												studentId={studentId}
												panel="magang"
												documentKey="contract"
												canEdit={canEdit}
											/>
										</div>
										<div className="grid grid-cols-2 gap-3 mt-3">
											<div className="space-y-1 col-span-2">
												<label className="text-xs font-medium text-slate-500">
													Tanggal TTD Kontrak
												</label>
												<Input
													disabled={!canEdit}
													type="date"
													value={
														data?.contractDate
															? new Date(data.contractDate)
																	.toISOString()
																	.split("T")[0]
															: ""
													}
													onChange={(e) =>
														handleLocalChange("contractDate", e.target.value)
													}
													onBlur={() => handleBlurField("contractDate")}
													className="bg-white text-sm h-8"
												/>
											</div>
										</div>
									</CollapsibleContent>
								</Collapsible>

								{/* MCU */}
								<Collapsible
									open={expandedItem === "mcu"}
									onOpenChange={() => toggleExpand("mcu")}
									className="border rounded-lg border-slate-200 bg-white shadow-sm overflow-hidden"
								>
									<div
										className={`flex items-center p-3 transition-colors ${data?.mcuReady ? "bg-emerald-50 border-b border-emerald-200" : "bg-slate-50 border-b border-slate-200 hover:bg-slate-100"}`}
									>
										<div className="mr-3">
											<Checkbox
												id="mcuReady"
												checked={!!data?.mcuReady}
												onCheckedChange={(checked) =>
													handleToggleField("mcuReady", checked === true)
												}
												disabled={!canEdit}
												className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
											/>
										</div>
										<CollapsibleTrigger className="flex-1 text-left flex items-center justify-between text-sm font-bold text-slate-800 cursor-pointer">
											Medical Check Up (MCU)
											{expandedItem === "mcu" ? (
												<ChevronUp className="w-4 h-4 text-slate-400" />
											) : (
												<ChevronDown className="w-4 h-4 text-slate-400" />
											)}
										</CollapsibleTrigger>
									</div>
									<CollapsibleContent className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50">
										<div className="pt-2 mb-3">
											<div className="flex items-center justify-between mb-2">
												<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
													Lampiran Dokumen
												</span>
											</div>
											<DocumentUpload
												studentId={studentId}
												panel="magang"
												documentKey="mcu"
												canEdit={canEdit}
											/>
										</div>
										<div className="grid grid-cols-2 gap-3 mt-3">
											<div className="space-y-1 col-span-2">
												<label className="text-xs font-medium text-slate-500">
													Klinik / Tempat MCU
												</label>
												<Input
													disabled={!canEdit}
													value={data?.mcuPlace || ""}
													onChange={(e) =>
														handleLocalChange("mcuPlace", e.target.value)
													}
													onBlur={() => handleBlurField("mcuPlace")}
													placeholder="Nama Klinik"
													className="bg-white text-sm h-8"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-xs font-medium text-slate-500">
													Tanggal MCU
												</label>
												<Input
													disabled={!canEdit}
													type="date"
													value={
														data?.mcuDate
															? new Date(data.mcuDate)
																	.toISOString()
																	.split("T")[0]
															: ""
													}
													onChange={(e) =>
														handleLocalChange("mcuDate", e.target.value)
													}
													onBlur={() => handleBlurField("mcuDate")}
													className="bg-white text-sm h-8"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-xs font-medium text-slate-500">
													Hasil
												</label>
												<Select
													disabled={!canEdit}
													value={data?.mcuResult ?? ""}
													onValueChange={(val) =>
														handleToggleField("mcuResult", val)
													}
												>
													<SelectTrigger className="bg-white h-8 text-sm">
														<SelectValue placeholder="Status" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="Fit">Fit</SelectItem>
														<SelectItem value="Unfit">Unfit</SelectItem>
														<SelectItem value="Pending">Pending</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
									</CollapsibleContent>
								</Collapsible>

								{/* VISA */}
								<Collapsible
									open={expandedItem === "visa"}
									onOpenChange={() => toggleExpand("visa")}
									className="border rounded-lg border-slate-200 bg-white shadow-sm overflow-hidden"
								>
									<div
										className={`flex items-center p-3 transition-colors ${data?.visaReady ? "bg-emerald-50 border-b border-emerald-200" : "bg-slate-50 border-b border-slate-200 hover:bg-slate-100"}`}
									>
										<div className="mr-3">
											<Checkbox
												id="visaReady"
												checked={!!data?.visaReady}
												onCheckedChange={(checked) =>
													handleToggleField("visaReady", checked === true)
												}
												disabled={!canEdit}
												className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
											/>
										</div>
										<CollapsibleTrigger className="flex-1 text-left flex items-center justify-between text-sm font-bold text-slate-800 cursor-pointer">
											Visa
											{expandedItem === "visa" ? (
												<ChevronUp className="w-4 h-4 text-slate-400" />
											) : (
												<ChevronDown className="w-4 h-4 text-slate-400" />
											)}
										</CollapsibleTrigger>
									</div>
									<CollapsibleContent className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50">
										<div className="pt-2 mb-3">
											<div className="flex items-center justify-between mb-2">
												<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
													Lampiran Dokumen
												</span>
											</div>
											<DocumentUpload
												studentId={studentId}
												panel="magang"
												documentKey="visa"
												canEdit={canEdit}
											/>
										</div>
										<div className="grid grid-cols-2 gap-3 mt-3">
											<div className="space-y-1">
												<label className="text-xs font-medium text-slate-500">
													Jenis Visa
												</label>
												<Input
													disabled={!canEdit}
													value={data?.visaType || ""}
													onChange={(e) =>
														handleLocalChange("visaType", e.target.value)
													}
													onBlur={() => handleBlurField("visaType")}
													placeholder="Working Holiday / Student"
													className="bg-white text-sm h-8"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-xs font-medium text-slate-500">
													Status Proses
												</label>
												<Select
													disabled={!canEdit}
													value={data?.visaStatus ?? ""}
													onValueChange={(val) =>
														handleToggleField("visaStatus", val)
													}
												>
													<SelectTrigger className="bg-white h-8 text-sm">
														<SelectValue placeholder="Status" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="Persiapan Dokumen">
															Persiapan Dokumen
														</SelectItem>
														<SelectItem value="Proses Kedutaan">
															Proses Kedutaan
														</SelectItem>
														<SelectItem value="Approved">Approved</SelectItem>
														<SelectItem value="Ditolak">Ditolak</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-1 col-span-2">
												<label className="text-xs font-medium text-slate-500">
													Nomor Visa
												</label>
												<Input
													disabled={!canEdit}
													value={data?.visaNo || ""}
													onChange={(e) =>
														handleLocalChange("visaNo", e.target.value)
													}
													onBlur={() => handleBlurField("visaNo")}
													placeholder="Hanya diisi jika approved"
													className="bg-white text-sm h-8"
												/>
											</div>
										</div>
									</CollapsibleContent>
								</Collapsible>

								{/* TICKET */}
								<Collapsible
									open={expandedItem === "ticket"}
									onOpenChange={() => toggleExpand("ticket")}
									className="border rounded-lg border-slate-200 bg-white shadow-sm overflow-hidden"
								>
									<div
										className={`flex items-center p-3 transition-colors ${data?.ticketReady ? "bg-emerald-50 border-b border-emerald-200" : "bg-slate-50 border-b border-slate-200 hover:bg-slate-100"}`}
									>
										<div className="mr-3">
											<Checkbox
												id="ticketReady"
												checked={!!data?.ticketReady}
												onCheckedChange={(checked) =>
													handleToggleField("ticketReady", checked === true)
												}
												disabled={!canEdit}
												className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
											/>
										</div>
										<CollapsibleTrigger className="flex-1 text-left flex items-center justify-between text-sm font-bold text-slate-800 cursor-pointer">
											Tiket Pesawat
											{expandedItem === "ticket" ? (
												<ChevronUp className="w-4 h-4 text-slate-400" />
											) : (
												<ChevronDown className="w-4 h-4 text-slate-400" />
											)}
										</CollapsibleTrigger>
									</div>
									<CollapsibleContent className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50">
										<div className="pt-2 mb-3">
											<div className="flex items-center justify-between mb-2">
												<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
													Lampiran Dokumen
												</span>
											</div>
											<DocumentUpload
												studentId={studentId}
												panel="magang"
												documentKey="ticket"
												canEdit={canEdit}
											/>
										</div>
										<div className="grid grid-cols-2 gap-3 mt-3">
											<div className="space-y-1 col-span-2">
												<label className="text-xs font-medium text-slate-500">
													Maskapai
												</label>
												<Input
													disabled={!canEdit}
													value={data?.ticketAirline || ""}
													onChange={(e) =>
														handleLocalChange("ticketAirline", e.target.value)
													}
													onBlur={() => handleBlurField("ticketAirline")}
													placeholder="Singapore Airlines"
													className="bg-white text-sm h-8"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-xs font-medium text-slate-500">
													Tanggal Berangkat
												</label>
												<Input
													disabled={!canEdit}
													type="date"
													value={
														data?.ticketDate
															? new Date(data.ticketDate)
																	.toISOString()
																	.split("T")[0]
															: ""
													}
													onChange={(e) =>
														handleLocalChange("ticketDate", e.target.value)
													}
													onBlur={() => handleBlurField("ticketDate")}
													className="bg-white text-sm h-8"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-xs font-medium text-slate-500">
													No Penerbangan
												</label>
												<Input
													disabled={!canEdit}
													value={data?.ticketFlight || ""}
													onChange={(e) =>
														handleLocalChange("ticketFlight", e.target.value)
													}
													onBlur={() => handleBlurField("ticketFlight")}
													placeholder="SQ950"
													className="bg-white text-sm h-8"
												/>
											</div>
										</div>
									</CollapsibleContent>
								</Collapsible>

								{/* PDT */}
								<Collapsible
									open={expandedItem === "pdt"}
									onOpenChange={() => toggleExpand("pdt")}
									className="border rounded-lg border-slate-200 bg-white shadow-sm overflow-hidden"
								>
									<div
										className={`flex items-center p-3 transition-colors ${data?.pdtReady ? "bg-emerald-50 border-b border-emerald-200" : "bg-slate-50 border-b border-slate-200 hover:bg-slate-100"}`}
									>
										<div className="mr-3">
											<Checkbox
												id="pdtReady"
												checked={!!data?.pdtReady}
												onCheckedChange={(checked) =>
													handleToggleField("pdtReady", checked === true)
												}
												disabled={!canEdit}
												className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
											/>
										</div>
										<CollapsibleTrigger className="flex-1 text-left flex items-center justify-between text-sm font-bold text-slate-800 cursor-pointer">
											PDT (Pembekalan)
											{expandedItem === "pdt" ? (
												<ChevronUp className="w-4 h-4 text-slate-400" />
											) : (
												<ChevronDown className="w-4 h-4 text-slate-400" />
											)}
										</CollapsibleTrigger>
									</div>
									<CollapsibleContent className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50">
										<div className="pt-2 mb-3">
											<div className="flex items-center justify-between mb-2">
												<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
													Lampiran Dokumen
												</span>
											</div>
											<DocumentUpload
												studentId={studentId}
												panel="magang"
												documentKey="pdt"
												canEdit={canEdit}
											/>
										</div>
										<div className="grid grid-cols-2 gap-3 mt-3">
											<div className="space-y-1">
												<label className="text-xs font-medium text-slate-500">
													Tanggal PDT
												</label>
												<Input
													disabled={!canEdit}
													type="date"
													value={
														data?.pdtDate
															? new Date(data.pdtDate)
																	.toISOString()
																	.split("T")[0]
															: ""
													}
													onChange={(e) =>
														handleLocalChange("pdtDate", e.target.value)
													}
													onBlur={() => handleBlurField("pdtDate")}
													className="bg-white text-sm h-8"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-xs font-medium text-slate-500">
													Tempat
												</label>
												<Input
													disabled={!canEdit}
													value={data?.pdtPlace || ""}
													onChange={(e) =>
														handleLocalChange("pdtPlace", e.target.value)
													}
													onBlur={() => handleBlurField("pdtPlace")}
													placeholder="Kampus Utama"
													className="bg-white text-sm h-8"
												/>
											</div>
										</div>
									</CollapsibleContent>
								</Collapsible>
							</div>
						</div>

						{/* PASCA-MAGANG */}
						<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
							<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
									🎓 TUGAS AKHIR MAHASISWA (PASCA-MAGANG)
								</h3>
							</div>
							<div className="p-5 space-y-4">
								<p className="text-xs text-slate-500 mb-2">
									Modul ini digunakan untuk mengunggah dokumen pasca-magang
									sebagai syarat kelulusan program.
								</p>

								{/* Logbook */}
								<div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
									<div>
										<h4 className="text-sm font-bold text-slate-800">
											1. Logbook Kegiatan
										</h4>
										<p className="text-xs text-slate-500">
											Format PDF (Maks 5MB)
										</p>
									</div>
									<DocumentUpload
										studentId={studentId}
										panel="post-internship"
										documentKey="logbook"
										canEdit={canEdit}
										hideLabel={false}
									/>
								</div>

								{/* Laporan */}
								<div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
									<div>
										<h4 className="text-sm font-bold text-slate-800">
											2. Laporan Akhir Magang
										</h4>
										<p className="text-xs text-slate-500">
											Format PDF (Maks 5MB)
										</p>
									</div>
									<DocumentUpload
										studentId={studentId}
										panel="post-internship"
										documentKey="laporan"
										canEdit={canEdit}
										hideLabel={false}
									/>
								</div>

								{/* Video */}
								<div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
									<div>
										<h4 className="text-sm font-bold text-slate-800">
											3. Video Dokumentasi
										</h4>
										<p className="text-xs text-slate-500">
											Upload PDF berisi Link YouTube
										</p>
									</div>
									<DocumentUpload
										studentId={studentId}
										panel="post-internship"
										documentKey="video"
										canEdit={canEdit}
										hideLabel={false}
									/>
								</div>
							</div>
						</div>

						{/* RIGHT COLUMN: SCHEDULE & NOTES */}
						<div className="space-y-8">
							{/* SCHEDULE */}
							<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
								<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
									<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
										<Plane className="w-4 h-4" /> JADWAL KEBERANGKATAN
									</h3>
								</div>
								<div className="p-5">
									<div className="grid grid-cols-2 gap-4">
										<div className="col-span-2 space-y-1.5">
											<label className="text-sm font-medium text-blue-900">
												Hotel/Perusahaan
											</label>
											<Input
												disabled={!canEdit}
												value={scheduleForm.internshipCompany || ""}
												onChange={(e) =>
													setScheduleForm({
														...scheduleForm,
														internshipCompany: e.target.value,
													})
												}
												className="bg-white border-blue-200 focus-visible:ring-blue-500"
												placeholder="Nama institusi penerima"
											/>
										</div>
										<div className="space-y-1.5">
											<label className="text-sm font-medium text-blue-900">
												Kota Tujuan
											</label>
											<Input
												disabled={!canEdit}
												value={scheduleForm.destinationCity || ""}
												onChange={(e) =>
													setScheduleForm({
														...scheduleForm,
														destinationCity: e.target.value,
													})
												}
												className="bg-white border-blue-200 focus-visible:ring-blue-500"
												placeholder="Kota, Negara"
											/>
										</div>
										<div className="space-y-1.5">
											<label className="text-sm font-medium text-blue-900">
												Durasi
											</label>
											<Select
												disabled={!canEdit}
												value={scheduleForm.internshipDuration ?? undefined}
												onValueChange={(val) =>
													setScheduleForm({
														...scheduleForm,
														internshipDuration: val || "",
													})
												}
											>
												<SelectTrigger className="bg-white border-blue-200">
													<SelectValue placeholder="Pilih durasi" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="3 Bulan">3 Bulan</SelectItem>
													<SelectItem value="6 Bulan">6 Bulan</SelectItem>
													<SelectItem value="1 Tahun">1 Tahun</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="col-span-2 space-y-1.5">
											<label className="text-sm font-medium text-blue-900">
												Estimasi Keberangkatan
											</label>
											<Input
												disabled={!canEdit}
												type="date"
												value={scheduleForm.estDepartureDate || ""}
												onChange={(e) =>
													setScheduleForm({
														...scheduleForm,
														estDepartureDate: e.target.value,
													})
												}
												className="bg-white border-blue-200 focus-visible:ring-blue-500"
											/>
										</div>
									</div>

									{canEdit && (
										<div className="mt-4 flex justify-end">
											<Button
												onClick={handleSaveSchedule}
												disabled={isSaving}
												className="bg-blue-600 hover:bg-blue-700 text-white"
											>
												<Save className="w-4 h-4 mr-2" /> Simpan Jadwal
											</Button>
										</div>
									)}
								</div>
							</div>

							{/* NOTES */}
							<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
								<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
									<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
										CATATAN TIM MAGANG
									</h3>
								</div>
								<div className="p-5">
									<Textarea
										disabled={!canEdit}
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										className="min-h-[160px] bg-slate-50 border-slate-200"
										placeholder="Kendala kelengkapan dokumen, reschedule interview, dsb..."
									/>
									{canEdit && (
										<div className="mt-3 flex justify-end">
											<Button
												onClick={handleSaveNotes}
												disabled={isSaving}
												variant="outline"
												className="text-slate-700"
											>
												Simpan Catatan
											</Button>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
				{activeTab === "syarat-akhir" && (
					<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
						<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								DOKUMEN SYARAT KELULUSAN AKHIR (POST-INTERNSHIP)
							</h3>
						</div>
						<div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{[
								{
									label: "Buku Harian Magang (Logbook)",
									key: "logbook",
									desc: "PDF, disahkan pembimbing lapangan.",
								},
								{
									label: "Laporan Akhir Magang",
									key: "laporan_akhir",
									desc: "Laporan komprehensif akhir dalam format PDF.",
								},
								{
									label: "Video Dokumentasi Magang",
									key: "video_dokumentasi",
									desc: "File video atau dokumen berisi link YouTube.",
								},
							].map((item, idx) => (
								<div
									key={idx}
									className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm"
								>
									<div className="mb-4">
										<h4 className="font-bold text-slate-800 text-sm mb-1">
											{item.label}
										</h4>
										<p className="text-xs text-slate-500">{item.desc}</p>
									</div>

									<div className="mt-auto pt-4 border-t border-slate-200/60">
										<div className="flex items-center justify-between mb-3">
											<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
												File Dokumen
											</span>
											{postInternshipDocs.some(
												(d) => d.documentKey === item.key,
											) ? (
												<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[10px]">
													Tersimpan
												</Badge>
											) : (
												<Badge className="bg-slate-200 text-slate-600 hover:bg-slate-200 border-none text-[10px]">
													Belum Ada
												</Badge>
											)}
										</div>
										<DocumentUpload
											studentId={studentId}
											panel="post-internship"
											documentKey={item.key}
											canEdit={canEditPostInternship}
											onUploadSuccess={() => {
												api.students[studentId.toString()][
													"post-internship"
												].documents
													.get()
													.then((res) => {
														if (res.data?.success)
															setPostInternshipDocs(res.data.data as any[]);
													});
											}}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Status ACC Panel Card */}
			<Card
				className={`border shadow-sm overflow-hidden ${data?.isAcc ? "bg-slate-50 border-slate-200" : "bg-blue-50 border-blue-200"}`}
			>
				<CardContent className="p-0">
					<div className="flex flex-col sm:flex-row items-center justify-between p-6">
						<div className="flex items-center gap-4 mb-4 sm:mb-0">
							{data?.isAcc ? (
								<>
									<div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
										<CheckCircle className="w-6 h-6 text-slate-600" />
									</div>
									<div>
										<h4 className="text-slate-800 font-bold text-lg">
											✅ Disetujui (ACC) oleh{" "}
											{data.accBy?.fullName || "Tim Magang"}
										</h4>
										<p className="text-sm text-slate-600">
											Pada{" "}
											{new Date(data.accAt!).toLocaleDateString("id-ID", {
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
											ACC Tim Magang Internasional
										</h4>
										<p className="text-sm text-blue-700 max-w-md">
											{completedCount < 8
												? `Menunggu ${8 - completedCount} dokumen tersisa untuk dilengkapi.`
												: "Seluruh dokumen telah lengkap. Silakan berikan ACC keberangkatan."}
										</p>
									</div>
								</>
							)}
						</div>

						{isMagang && data?.isAcc && (
							<AlertDialog>
								<AlertDialogTrigger
									render={
										<Button
											variant="outline"
											className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0"
											disabled={isSaving}
										>
											{isSaving ? "Membatalkan..." : "Batalkan ACC"}
										</Button>
									}
								/>
								<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
									<AlertDialogTitle>
										Konfirmasi Pembatalan ACC Magang
									</AlertDialogTitle>
									<AlertDialogDescription className="text-slate-500">
										Apakah Anda yakin ingin membatalkan status ACC untuk panel
										Tim Magang Internasional ini? Status mahasiswa akan kembali
										ke tahap proses.
									</AlertDialogDescription>
									<div className="flex justify-end gap-3 mt-4">
										<AlertDialogCancel className="bg-transparent border-slate-200 hover:bg-slate-50">
											Batal
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleCancelAcc}
											className="bg-rose-600 hover:bg-rose-700 text-white"
										>
											Ya, Batalkan ACC
										</AlertDialogAction>
									</div>
								</AlertDialogContent>
							</AlertDialog>
						)}

						{isMagang && !data?.isAcc && (
							<Tooltip>
								<TooltipTrigger render={<span className="inline-block" />}>
									<span>
										<AlertDialog>
											<AlertDialogTrigger
												render={
													<Button
														disabled={completedCount < 8}
														className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
													>
														Berikan ACC
													</Button>
												}
											/>
											<AlertDialogContent>
												<AlertDialogTitle>
													Konfirmasi ACC Magang
												</AlertDialogTitle>
												<AlertDialogDescription>
													Apakah Anda yakin ingin memberikan ACC? Tindakan ini
													menandakan bahwa seluruh dokumen keberangkatan
													mahasiswa telah valid dan lengkap.
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
									</span>
								</TooltipTrigger>
								{completedCount < 8 && (
									<TooltipContent>
										Lengkapi semua {8 - completedCount} persyaratan dokumen
										terlebih dahulu
									</TooltipContent>
								)}
							</Tooltip>
						)}
					</div>
				</CardContent>
			</Card>

			{/* MONITORING BERKALA */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-8">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center">
					<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
						<CalendarClock className="w-4 h-4 text-slate-500" /> MONITORING
						BERKALA
					</h3>
					{canEdit && (
						<Button
							onClick={handleAddMonitoring}
							disabled={isSaving}
							variant="outline"
							size="sm"
							className="h-8 text-xs bg-white"
						>
							<Plus className="w-3 h-3 mr-1" /> Tambah Jadwal (3 Bln)
						</Button>
					)}
				</div>
				<div className="p-5">
					<p className="text-xs text-slate-500 mb-4">
						Pantau kondisi mahasiswa selama magang (terjadwal per 3 bulan).
					</p>

					{monitoringHistory.length === 0 ? (
						<div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
							Belum ada riwayat atau jadwal monitoring.
						</div>
					) : (
						<div className="space-y-4">
							{monitoringHistory.map((item, idx) => (
								<div
									key={item.id}
									className="flex gap-4 border-l-2 border-slate-200 pl-4 relative"
								>
									<div
										className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${item.completedAt ? (item.condition === "Baik" ? "bg-emerald-500" : item.condition === "Perlu Perhatian" ? "bg-amber-500" : "bg-rose-500") : "bg-slate-300"}`}
									/>
									<div className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-lg">
										<div className="flex justify-between items-start mb-1">
											<span className="text-sm font-bold text-slate-700">
												{new Date(item.scheduledDate).toLocaleDateString(
													"id-ID",
													{ day: "numeric", month: "short", year: "numeric" },
												)}
												{item.completedAt && (
													<span className="ml-2 font-normal text-slate-500">
														({item.condition})
													</span>
												)}
											</span>
											{!item.completedAt && canEdit && (
												<Badge
													variant="outline"
													className="text-[10px] cursor-pointer hover:bg-slate-100"
												>
													Catat Hasil
												</Badge>
											)}
										</div>
										<p className="text-xs text-slate-600 mt-1">
											{item.monitoringNotes ||
												(item.completedAt ? "-" : "Belum dilaksanakan")}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
