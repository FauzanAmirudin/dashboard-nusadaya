"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { api } from "@/lib/eden";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
	AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
	AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, 
	AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
	Mic, PenTool, Plane, RefreshCw, AlertTriangle, CheckCircle2, History, User 
} from "lucide-react";
import { toast } from "sonner";

interface FinalDecisionData {
	decision: {
		evaluatorDecision: "menunggu" | "lanjut_interview" | "ttd_kontrak" | "layak_berangkat" | "remedial";
		evaluatorNotes: string | null;
		decidedAt: string | null;
		decidedBy: { fullName: string } | null;
	};
	logs: {
		id: number;
		createdAt: string;
		action: string;
		details: { from: string; to: string } | null;
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
		text: "text-slate-700"
	},
	lanjut_interview: {
		icon: <Mic className="w-5 h-5 text-amber-500" />,
		label: "Lanjut Interview",
		color: "amber",
		description: "Mahasiswa diizinkan mengikuti sesi interview",
		bg: "bg-amber-50",
		border: "border-amber-200",
		text: "text-amber-700"
	},
	ttd_kontrak: {
		icon: <PenTool className="w-5 h-5 text-blue-500" />,
		label: "Boleh TTD Kontrak",
		color: "blue",
		description: "Mahasiswa diizinkan menandatangani kontrak magang",
		bg: "bg-blue-50",
		border: "border-blue-200",
		text: "text-blue-700"
	},
	layak_berangkat: {
		icon: <Plane className="w-5 h-5 text-emerald-500" />,
		label: "Layak Berangkat",
		color: "emerald",
		description: "Mahasiswa dinyatakan layak untuk berangkat",
		bg: "bg-emerald-50",
		border: "border-emerald-200",
		text: "text-emerald-700"
	},
	remedial: {
		icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
		label: "Remedial",
		color: "rose",
		description: "Mahasiswa perlu perbaikan sebelum lanjut",
		bg: "bg-rose-50",
		border: "border-rose-200",
		text: "text-rose-700"
	}
};

export function FinalDecisionPanel({ studentId, onUpdate }: { studentId: number, onUpdate: () => void }) {
	const [data, setData] = useState<FinalDecisionData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	
	const [selectedDecision, setSelectedDecision] = useState<string>("menunggu");
	const [notes, setNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchData = async () => {
		setIsLoading(true);
		const res = await api.students[studentId.toString()]['final-decision'].get();
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
		const res = await api.students[studentId.toString()]['final-decision'].patch({
			evaluatorDecision: selectedDecision,
			evaluatorNotes: notes
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

	if (isLoading || !data) {
		return <div className="p-8 text-center text-slate-500">Memuat data evaluasi...</div>;
	}

	const activeConf = keputusanConfig[data.decision.evaluatorDecision];
	const isWarning = selectedDecision === "layak_berangkat" && data.student.overallStatus !== "AMAN";

	return (
		<div className="space-y-6">
			{/* STATUS AKTIF */}
			<Card className={`border-2 ${activeConf.border} shadow-sm overflow-hidden`}>
				<div className={`p-4 sm:p-6 ${activeConf.bg} flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors`}>
					<div className="flex items-center gap-4">
						<div className="p-3 bg-white rounded-full shadow-sm">
							{activeConf.icon}
						</div>
						<div>
							<p className="text-sm font-medium text-slate-500 mb-0.5">Keputusan Aktif</p>
							<h3 className={`text-xl font-bold ${activeConf.text}`}>{activeConf.label}</h3>
						</div>
					</div>
					<div className="text-right text-sm text-slate-600 bg-white/60 px-4 py-2 rounded-lg border border-slate-200/60">
						{data.decision.decidedAt ? (
							<>
								<p>Ditetapkan: <span className="font-semibold">{format(new Date(data.decision.decidedAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}</span></p>
								<p>Oleh: <span className="font-semibold">{data.decision.decidedBy?.fullName || "-"}</span></p>
							</>
						) : (
							<p className="font-medium text-slate-400">Belum ada penetapan</p>
						)}
					</div>
				</div>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* UBAH KEPUTUSAN */}
				<Card className="lg:col-span-2 border-slate-200 shadow-sm">
					<CardHeader className="border-b border-slate-100 pb-4">
						<CardTitle className="text-slate-800 text-base">Ubah Keputusan</CardTitle>
					</CardHeader>
					<CardContent className="pt-6">
						<RadioGroup value={selectedDecision} onValueChange={setSelectedDecision} className="space-y-3">
							{(["lanjut_interview", "ttd_kontrak", "layak_berangkat", "remedial"] as const).map((key) => {
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
													<span className={`font-semibold ${isActive ? conf.text : "text-slate-700"}`}>
														{conf.label}
													</span>
												</div>
												<p className="text-sm text-slate-500 font-normal">{conf.description}</p>
											</div>
										</Label>
									</div>
								);
							})}
						</RadioGroup>

						{isWarning && (
							<Alert variant="destructive" className="mt-6 bg-amber-50 border-amber-500 text-amber-800">
								<AlertTriangle className="h-4 w-4" />
								<AlertTitle>Peringatan Konsistensi</AlertTitle>
								<AlertDescription>
									Status Akhir mahasiswa ini adalah <strong>{data.student.overallStatus.replace('_', ' ')}</strong>. 
									Keputusan "Layak Berangkat" tidak disarankan dalam kondisi ini kecuali Anda memiliki pertimbangan khusus.
								</AlertDescription>
							</Alert>
						)}

						<div className="mt-6 space-y-3">
							<Label className="text-slate-700 font-semibold">Alasan / Catatan Evaluasi</Label>
							<Textarea 
								placeholder="Tuliskan catatan atau alasan mendetail mengenai keputusan ini..."
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="min-h-[120px] resize-none"
							/>
						</div>

						<div className="mt-6 flex justify-end">
							<AlertDialog>
								<AlertDialogTrigger render={(props) => (
									<Button {...props} disabled={isSubmitting || (selectedDecision === data.decision.evaluatorDecision && notes === data.decision.evaluatorNotes)} className="bg-[#0517B0] hover:bg-[#04128A] text-white">
										Tetapkan Keputusan
									</Button>
								)} />
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Konfirmasi Keputusan Final</AlertDialogTitle>
										<AlertDialogDescription>
											Anda akan menetapkan keputusan menjadi <strong>{keputusanConfig[selectedDecision as keyof typeof keputusanConfig]?.label}</strong>.
											Tindakan ini akan tercatat permanen di audit log.
											{isWarning && (
												<div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md flex items-start gap-2 text-sm">
													<AlertTriangle className="w-5 h-5 shrink-0" />
													<p>Mengabaikan peringatan inkonsistensi status. Pastikan Anda memiliki wewenang untuk ini.</p>
												</div>
											)}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Batal</AlertDialogCancel>
										<AlertDialogAction onClick={handleSave} className="bg-[#0517B0] hover:bg-[#04128A] text-white">
											Ya, Tetapkan
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
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
										const fromConf = keputusanConfig[(log.details?.from as keyof typeof keputusanConfig) || "menunggu"];
										const toConf = keputusanConfig[(log.details?.to as keyof typeof keputusanConfig) || "menunggu"];
										return (
											<div key={log.id} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-px before:bg-slate-200 last:before:hidden">
												<div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
													<div className="w-2 h-2 rounded-full bg-[#0517B0]" />
												</div>
												<div className="mb-1 text-xs text-slate-500 font-medium">
													{format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
												</div>
												<div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
													<div className="flex items-center gap-2 mb-2">
														<User className="w-4 h-4 text-slate-400" />
														<span className="font-semibold">{log.user?.fullName}</span>
													</div>
													<div className="flex items-center gap-2 flex-wrap">
														<Badge variant="outline" className={`${fromConf.bg} ${fromConf.text} border-none font-normal`}>
															{fromConf.label}
														</Badge>
														<span className="text-slate-400">→</span>
														<Badge variant="outline" className={`${toConf.bg} ${toConf.text} border-none font-semibold`}>
															{toConf.label}
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
