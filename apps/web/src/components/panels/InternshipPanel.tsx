"use client";

import {
	CheckCircle,
	CheckSquare,
	ChevronDown,
	ChevronUp,
	Clock,
	Plane,
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
	loaReady: boolean;
	loaCompany: string | null;
	loaPosition: string | null;
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
	notes: string | null;
	status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	isAcc: boolean;
	accAt: string | null;
	accBy: { fullName: string } | null;
}

interface InternshipPanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function InternshipPanel({ studentId, onUpdate }: InternshipPanelProps) {
	const { user } = useAuthStore();
	const isMagang = user?.role === "magang" || user?.role === "superadmin";
	const isSuperadmin = user?.role === "superadmin";
	const [data, setData] = useState<InternshipData | null>(null);

	const canEdit = (isMagang || isSuperadmin) && !data?.isAcc;

	const [isSaving, setIsSaving] = useState(false);

	const [expandedItem, setExpandedItem] = useState<string | null>(null);

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

	const checks = [
		data?.passportReady,
		data?.interviewReady,
		data?.loaReady,
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
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="border-b border-slate-200 pb-4">
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
				</CardHeader>
				<CardContent className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* LEFT COLUMN: DOCUMENT CHECKLIST */}
					<div>
						<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
							STATUS DOKUMEN KEBERANGKATAN
						</h3>
						<div className="space-y-3">
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

							{/* LOA */}
							<Collapsible
								open={expandedItem === "loa"}
								onOpenChange={() => toggleExpand("loa")}
								className="border rounded-lg border-slate-200 bg-white shadow-sm overflow-hidden"
							>
								<div
									className={`flex items-center p-3 transition-colors ${data?.loaReady ? "bg-emerald-50 border-b border-emerald-200" : "bg-slate-50 border-b border-slate-200 hover:bg-slate-100"}`}
								>
									<div className="mr-3">
										<Checkbox
											id="loaReady"
											checked={!!data?.loaReady}
											onCheckedChange={(checked) =>
												handleToggleField("loaReady", checked === true)
											}
											disabled={!canEdit}
											className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
										/>
									</div>
									<CollapsibleTrigger className="flex-1 text-left flex items-center justify-between text-sm font-bold text-slate-800 cursor-pointer">
										Letter of Acceptance (LoA)
										{expandedItem === "loa" ? (
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
											documentKey="loa"
											canEdit={canEdit}
										/>
									</div>
									<div className="grid grid-cols-2 gap-3 mt-3">
										<div className="space-y-1">
											<label className="text-xs font-medium text-slate-500">
												Perusahaan
											</label>
											<Input
												disabled={!canEdit}
												value={data?.loaCompany || ""}
												onChange={(e) =>
													handleLocalChange("loaCompany", e.target.value)
												}
												onBlur={() => handleBlurField("loaCompany")}
												placeholder="Nama Perusahaan"
												className="bg-white text-sm h-8"
											/>
										</div>
										<div className="space-y-1">
											<label className="text-xs font-medium text-slate-500">
												Posisi / Departemen
											</label>
											<Input
												disabled={!canEdit}
												value={data?.loaPosition || ""}
												onChange={(e) =>
													handleLocalChange("loaPosition", e.target.value)
												}
												onBlur={() => handleBlurField("loaPosition")}
												placeholder="F&B Service"
												className="bg-white text-sm h-8"
											/>
										</div>
									</div>
								</CollapsibleContent>
							</Collapsible>

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
														? new Date(data.mcuDate).toISOString().split("T")[0]
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
														? new Date(data.pdtDate).toISOString().split("T")[0]
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

					{/* RIGHT COLUMN: SCHEDULE & NOTES */}
					<div className="space-y-8">
						{/* SCHEDULE */}
						<div className="p-5 rounded-xl border border-blue-100 bg-blue-50/50 shadow-sm">
							<h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
								<Plane className="w-4 h-4" /> JADWAL KEBERANGKATAN
							</h3>

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

						{/* NOTES */}
						<div>
							<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
								CATATAN TIM MAGANG
							</h3>
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
				</CardContent>
			</Card>

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
		</div>
	);
}
