"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
	AlertTriangle,
	CheckCircle2,
	History,
	Mic,
	PenTool,
	Plane,
	RefreshCw,
	ShieldCheck,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";

interface FinalDecisionData {
	decision: {
		evaluatorDecision:
			| "menunggu"
			| "lanjut_interview"
			| "ttd_kontrak"
			| "layak_berangkat"
			| "remedial"
			| null;
		evaluatorNotes: string | null;
		decidedAt: string | Date | null;
		decidedBy: { fullName: string } | null;
		isApprovedByDirector: boolean | null;
	};
	logs: {
		id: number;
		createdAt: string | Date;
		action: string;
		details: any | null;
		user: { fullName: string } | null;
	}[];
	student: {
		overallStatus: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	};
}

const keputusanConfig = {
	menunggu: {
		icon: <RefreshCw className="w-5 h-5 text-slate-500" />,
		label: "Menunggu Evaluasi",
		color: "slate",
		description: "Belum ada keputusan yang ditetapkan",
		bg: "bg-slate-50",
		border: "border-slate-200",
		text: "text-slate-700",
	},
	lanjut_interview: {
		icon: <Mic className="w-5 h-5 text-amber-500" />,
		label: "Lanjut Interview",
		color: "amber",
		description: "Mahasiswa diizinkan mengikuti sesi interview",
		bg: "bg-amber-50",
		border: "border-amber-200",
		text: "text-amber-700",
	},
	ttd_kontrak: {
		icon: <PenTool className="w-5 h-5 text-blue-500" />,
		label: "Boleh TTD Kontrak",
		color: "blue",
		description: "Mahasiswa diizinkan menandatangani kontrak magang",
		bg: "bg-blue-50",
		border: "border-blue-200",
		text: "text-blue-700",
	},
	layak_berangkat: {
		icon: <Plane className="w-5 h-5 text-emerald-500" />,
		label: "Layak Berangkat",
		color: "emerald",
		description: "Mahasiswa dinyatakan layak untuk berangkat",
		bg: "bg-emerald-50",
		border: "border-emerald-200",
		text: "text-emerald-700",
	},
	remedial: {
		icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
		label: "Remedial",
		color: "rose",
		description: "Mahasiswa perlu perbaikan sebelum lanjut",
		bg: "bg-rose-50",
		border: "border-rose-200",
		text: "text-rose-700",
	},
};

export function FinalDecisionPanel({
	studentId,
	onUpdate,
	userRole,
}: {
	studentId: number;
	onUpdate: () => void;
	userRole: string;
}) {
	const [data, setData] = useState<FinalDecisionData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const [selectedDecision, setSelectedDecision] = useState<string>("menunggu");
	const [notes, setNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const canEdit = userRole === "evaluator" || userRole === "superadmin";
	const canApproveDirector = userRole === "superadmin";

	const fetchData = async () => {
		setIsLoading(true);
		const res =
			await api.students[studentId.toString()]["final-decision"].get();
		if (res.data?.success && res.data.data) {
			const fetched = res.data.data as FinalDecisionData;
			setData(fetched);
			setSelectedDecision(fetched.decision?.evaluatorDecision || "menunggu");
			setNotes(fetched.decision?.evaluatorNotes || "");
		}
		setIsLoading(false);
	};

	useEffect(() => {
		fetchData();
	}, [studentId]);

	const handleSave = async () => {
		setIsSubmitting(true);
		const res = await api.students[studentId.toString()][
			"final-decision"
		].patch({
			evaluatorDecision: selectedDecision,
			evaluatorNotes: notes,
		});

		if (res.data?.success) {
			toast.success("Keputusan final berhasil disimpan");
			fetchData();
			onUpdate();
		} else {
			toast.error(res.data?.message || "Gagal menyimpan keputusan");
		}
		setIsSubmitting(false);
	};

	const handleDirectorApproval = async () => {
		if (!data) return;
		const newVal = !data.decision.isApprovedByDirector;
		const res = await api.students[studentId.toString()]["final-decision"][
			"director-approval"
		].patch({
			isApproved: newVal,
		});

		if (res.data?.success) {
			toast.success(
				newVal
					? "Keputusan berhasil disetujui oleh Direktur"
					: "Persetujuan Direktur berhasil dicabut",
			);
			fetchData();
			onUpdate();
		} else {
			toast.error(
				res.data?.message || "Gagal memperbarui persetujuan direktur",
			);
		}
	};

	if (isLoading || !data) {
		return (
			<div className="p-8 text-center text-slate-500">
				Memuat data evaluasi...
			</div>
		);
	}

	const activeConf =
		keputusanConfig[
			data.decision.evaluatorDecision as keyof typeof keputusanConfig
		] || keputusanConfig.menunggu;
	const isWarning =
		selectedDecision === "layak_berangkat" &&
		data.student.overallStatus !== "AMAN";

	return (
		<div className="space-y-6">
			{/* STATUS AKTIF */}
			<Card
				className={`border-2 ${activeConf.border} shadow-sm overflow-hidden`}
			>
				<div
					className={`p-4 sm:p-6 ${activeConf.bg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors`}
				>
					<div className="flex items-center gap-4">
						<div className="p-3 bg-white rounded-full shadow-sm">
							{activeConf.icon}
						</div>
						<div>
							<p className="text-sm font-medium text-slate-500 mb-0.5">
								Keputusan Aktif
							</p>
							<div className="flex items-center gap-3">
								<h3 className={`text-xl font-bold ${activeConf.text}`}>
									{activeConf.label}
								</h3>
								{data.decision.isApprovedByDirector && (
									<Badge className="bg-[#0517B0]/10 text-[#0517B0] border-[#0517B0]/20 flex items-center gap-1.5 font-semibold">
										<ShieldCheck className="w-3.5 h-3.5" />
										Disetujui Direktur
									</Badge>
								)}
							</div>
						</div>
					</div>
					<div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
						<div className="text-right text-sm text-slate-600 bg-white/60 px-4 py-2 rounded-lg border border-slate-200/60 w-full sm:w-auto">
							{data.decision.decidedAt ? (
								<>
									<p className="text-left sm:text-right">
										Ditetapkan:{" "}
										<span className="font-semibold">
											{format(
												new Date(data.decision.decidedAt),
												"dd MMM yyyy, HH:mm",
												{ locale: idLocale },
											)}
										</span>
									</p>
									<p className="text-left sm:text-right">
										Oleh:{" "}
										<span className="font-semibold">
											{data.decision.decidedBy?.fullName || "-"}
										</span>
									</p>
								</>
							) : (
								<p className="font-medium text-slate-400 text-left sm:text-right">
									Belum ada penetapan
								</p>
							)}
						</div>

						{canApproveDirector && (
							<AlertDialog>
								<AlertDialogTrigger
									render={(props: any) => (
										<Button
											{...props}
											variant={
												data.decision.isApprovedByDirector
													? "outline"
													: "default"
											}
											className={
												data.decision.isApprovedByDirector
													? "border-rose-200 text-rose-700 hover:bg-rose-50 w-full sm:w-auto"
													: "bg-[#0517B0] hover:bg-[#04128A] text-white w-full sm:w-auto"
											}
										>
											{data.decision.isApprovedByDirector
												? "Cabut Persetujuan Direktur"
												: "Setujui sebagai Direktur"}
										</Button>
									)}
								/>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											{data.decision.isApprovedByDirector
												? "Cabut Persetujuan Direktur?"
												: "Berikan Persetujuan Direktur?"}
										</AlertDialogTitle>
										<AlertDialogDescription>
											Tindakan ini akan tercatat permanen di audit log sistem.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Batal</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDirectorApproval}
											className="bg-[#0517B0] hover:bg-[#04128A] text-white"
										>
											Ya, Konfirmasi
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
				</div>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* UBAH KEPUTUSAN */}
				<Card
					className={`lg:col-span-2 border-slate-200 shadow-sm ${!canEdit ? "opacity-70 pointer-events-none" : ""}`}
				>
					<CardHeader className="border-b border-slate-100 pb-4">
						<CardTitle className="text-slate-800 text-base">
							Ubah Keputusan
						</CardTitle>
						{!canEdit && (
							<p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
								<AlertTriangle className="w-4 h-4" /> Akses ditolak. Hanya
								Evaluator yang dapat mengubah form ini.
							</p>
						)}
					</CardHeader>
					<CardContent className="pt-6">
						<RadioGroup
							value={selectedDecision}
							onValueChange={setSelectedDecision}
							className="space-y-3"
						>
							{(
								[
									"lanjut_interview",
									"ttd_kontrak",
									"layak_berangkat",
									"remedial",
								] as const
							).map((key) => {
								const conf = keputusanConfig[key];
								const isActive = selectedDecision === key;
								return (
									<div key={key}>
										<Label
											htmlFor={key}
											className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
												${isActive ? `${conf.border} ${conf.bg}` : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}
											`}
										>
											<RadioGroupItem value={key} id={key} className="mt-1" />
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													{conf.icon}
													<span
														className={`font-semibold ${isActive ? conf.text : "text-slate-700"}`}
													>
														{conf.label}
													</span>
												</div>
												<p className="text-sm text-slate-500 font-normal">
													{conf.description}
												</p>
											</div>
										</Label>
									</div>
								);
							})}
						</RadioGroup>

						{isWarning && (
							<Alert
								variant="destructive"
								className="mt-6 bg-amber-50 border-amber-500 text-amber-800"
							>
								<AlertTriangle className="h-4 w-4" />
								<AlertTitle>Peringatan Konsistensi</AlertTitle>
								<AlertDescription>
									Status Akhir mahasiswa ini adalah{" "}
									<strong>
										{data.student.overallStatus.replace("_", " ")}
									</strong>
									. Keputusan "Layak Berangkat" tidak disarankan dalam kondisi
									ini kecuali Anda memiliki pertimbangan khusus.
								</AlertDescription>
							</Alert>
						)}

						<div className="mt-6 space-y-3">
							<Label className="text-slate-700 font-semibold">
								Alasan / Catatan Evaluasi
							</Label>
							<Textarea
								placeholder="Tuliskan catatan atau alasan mendetail mengenai keputusan ini..."
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="min-h-[120px] resize-none"
							/>
						</div>

						{canEdit && (
							<div className="mt-6 flex justify-end">
								<AlertDialog>
									<AlertDialogTrigger
										render={(props: any) => (
											<Button
												{...props}
												disabled={
													isSubmitting ||
													(selectedDecision ===
														data.decision.evaluatorDecision &&
														notes === data.decision.evaluatorNotes)
												}
												className="bg-[#0517B0] hover:bg-[#04128A] text-white"
											>
												Tetapkan Keputusan
											</Button>
										)}
									/>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												Konfirmasi Keputusan Final
											</AlertDialogTitle>
											<AlertDialogDescription>
												Anda akan menetapkan keputusan menjadi{" "}
												<strong>
													{
														keputusanConfig[
															selectedDecision as keyof typeof keputusanConfig
														]?.label
													}
												</strong>
												. Tindakan ini akan tercatat permanen di audit log.
												{isWarning && (
													<div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md flex items-start gap-2 text-sm text-left">
														<AlertTriangle className="w-5 h-5 shrink-0" />
														<p>
															Mengabaikan peringatan inkonsistensi status.
															Pastikan Anda memiliki wewenang untuk ini.
														</p>
													</div>
												)}
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Batal</AlertDialogCancel>
											<AlertDialogAction
												onClick={handleSave}
												className="bg-[#0517B0] hover:bg-[#04128A] text-white"
											>
												Ya, Tetapkan
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						)}
					</CardContent>
				</Card>

				{/* RIWAYAT */}
				<Card className="border-slate-200 shadow-sm flex flex-col h-[500px]">
					<CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/50">
						<CardTitle className="text-slate-800 text-base flex items-center gap-2">
							<History className="w-5 h-5 text-slate-400" />
							Riwayat Keputusan
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0 flex-1 overflow-hidden">
						<ScrollArea className="h-full">
							{data.logs.length === 0 ? (
								<div className="p-8 text-center text-slate-400 flex flex-col items-center">
									<CheckCircle2 className="w-8 h-8 mb-2 text-slate-200" />
									<p className="text-sm">Belum ada riwayat perubahan</p>
								</div>
							) : (
								<div className="p-4 space-y-6">
									{data.logs.map((log) => {
										if (
											log.action === "DIRECTOR_APPROVED" ||
											log.action === "DIRECTOR_APPROVAL_REVOKED"
										) {
											const isApprove = log.action === "DIRECTOR_APPROVED";
											return (
												<div
													key={log.id}
													className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-px before:bg-slate-200 last:before:hidden"
												>
													<div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
														<div
															className={`w-2 h-2 rounded-full ${isApprove ? "bg-[#0517B0]" : "bg-rose-500"}`}
														/>
													</div>
													<div className="mb-1 text-xs text-slate-500 font-medium">
														{format(
															new Date(log.createdAt),
															"dd MMM yyyy, HH:mm",
															{ locale: idLocale },
														)}
													</div>
													<div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
														<div className="flex items-center gap-2 mb-1">
															<ShieldCheck
																className={`w-4 h-4 ${isApprove ? "text-[#0517B0]" : "text-rose-500"}`}
															/>
															<span className="font-semibold">
																{log.user?.fullName}
															</span>
														</div>
														<p className="text-slate-600 ml-6">
															{isApprove
																? "Memberikan Persetujuan Direktur"
																: "Mencabut Persetujuan Direktur"}
														</p>
													</div>
												</div>
											);
										}

										const fromConf =
											keputusanConfig[
												(log.details?.from as keyof typeof keputusanConfig) ||
													"menunggu"
											];
										const toConf =
											keputusanConfig[
												(log.details?.to as keyof typeof keputusanConfig) ||
													"menunggu"
											];

										return (
											<div
												key={log.id}
												className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-px before:bg-slate-200 last:before:hidden"
											>
												<div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
													<div className="w-2 h-2 rounded-full bg-[#0517B0]" />
												</div>
												<div className="mb-1 text-xs text-slate-500 font-medium">
													{format(
														new Date(log.createdAt),
														"dd MMM yyyy, HH:mm",
														{ locale: idLocale },
													)}
												</div>
												<div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
													<div className="flex items-center gap-2 mb-2">
														<User className="w-4 h-4 text-slate-400" />
														<span className="font-semibold">
															{log.user?.fullName}
														</span>
													</div>
													<div className="flex items-center gap-2 flex-wrap">
														<Badge
															variant="outline"
															className={`${fromConf?.bg || "bg-slate-50"} ${fromConf?.text || "text-slate-500"} border-none font-normal`}
														>
															{fromConf?.label || log.details?.from}
														</Badge>
														<span className="text-slate-400">→</span>
														<Badge
															variant="outline"
															className={`${toConf?.bg || "bg-slate-50"} ${toConf?.text || "text-slate-500"} border-none font-semibold`}
														>
															{toConf?.label || log.details?.to}
														</Badge>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</ScrollArea>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
