"use client";

import { CalendarClock, CheckCircle, Plus } from "lucide-react";
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
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";
import { TabDanaTalangan } from "./magang/TabDanaTalangan";
import { TabDokumen } from "./magang/TabDokumen";
import { TabPraPaspor } from "./magang/TabPraPaspor";
import { TabSyaratAkhir } from "./magang/TabSyaratAkhir";

interface InternshipData {
	// Pra-Paspor
	praPasporPasFoto?: boolean;
	praPasporKtm?: boolean;
	praPasporKtp?: boolean;
	praPasporKk?: boolean;
	praPasporAktaKelahiran?: boolean;
	praPasporSl21?: boolean;
	praPasporSkma?: boolean;
	praPasporRekomendasiDisdik?: boolean;
	praPasporGapYear?: boolean;
	praPasporPddikti?: boolean;
	praPasporCv?: boolean;

	passportReady: boolean;
	passportNo: string | null;
	passportExp: string | null;
	interviewReady: boolean;
	interviewDate: string | null;
	interviewResult: string | null;
	lolReady: boolean;
	lolDate: string | null;
	lolNotes: string | null;
	loaReady?: boolean;
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
	pdtEndDate: string | null;
	pdtPlace: string | null;
	estDepartureDate: string | null;
	destinationCity: string | null;
	internshipDuration: string | null;
	internshipCompany: string | null;
	dokumentasiReady?: boolean;
	dokumentasiKeberangkatanLink: string | null;
	agenReady?: boolean;
	agenNegaraTujuan: string | null;
	agenPeminatan: string | null;

	// Syarat Akhir
	logbookReady?: boolean;
	laporanAkhirReady?: boolean;
	videoDokumentasiReady?: boolean;
	videoDokumentasiLink?: string | null;

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

export function InternshipPanel({ studentId, onUpdate }: InternshipPanelProps) {
	const { user } = useAuthStore();
	const isMagang = user?.role === "magang" || user?.role === "superadmin";
	const isSuperadmin = user?.role === "superadmin";
	const [data, setData] = useState<InternshipData | null>(null);

	const canEdit = (isMagang || isSuperadmin) && !data?.isAcc;
	const canEditPostInternship = isMagang || isSuperadmin;

	const [isSaving, setIsSaving] = useState(false);
	const [pmbPaymentData, setPmbPaymentData] = useState<any>(null);
	const [postInternshipDocs, setPostInternshipDocs] = useState<any[]>([]);

	const [passportClearance, setPassportClearance] = useState<any>(null);
	const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

	const [notes, setNotes] = useState(data?.notes || "");

	const fetchInternshipData = async () => {
		const res = await api.students[studentId.toString()].internship.get();
		if (res.data?.success && res.data.data) {
			const fetchedData = res.data.data as unknown as InternshipData;
			setData(fetchedData);
			setNotes(fetchedData.notes || "");
		}

		const pcRes =
			await api.students[studentId.toString()]["passport-clearance"].get();
		if (pcRes.data?.success) {
			setPassportClearance(pcRes.data);
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

		// Fetch magang documents
		try {
			const docsRes =
				await api.students[studentId.toString()].magang.documents.get();
			if (docsRes.data?.success) {
				setUploadedDocs(docsRes.data.data as any[]);
			}
		} catch (e) {
			console.error("Failed to fetch magang documents", e);
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

	const handleLocalChange = (field: any, value: any) => {
		if (!canEdit) return;
		setData((prev) =>
			prev ? ({ ...prev, [field]: value } as InternshipData) : null,
		);
	};

	const handleBlurField = async (field: any) => {
		if (!canEdit || !data) return;
		setIsSaving(true);
		await api.students[studentId.toString()].internship.patch({
			[field]: (data as any)[field],
		});
		onUpdate(); // Trigger parent refresh for overall status
		setIsSaving(false);
	};

	const handleToggleField = async (field: any, value: any) => {
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

	const praPasporChecks = [
		data?.praPasporPasFoto,
		data?.praPasporKtm,
		data?.praPasporKtp,
		data?.praPasporKk,
		data?.praPasporAktaKelahiran,
		data?.praPasporSl21,
		data?.praPasporSkma,
		data?.praPasporRekomendasiDisdik,
		...(passportClearance?.isGapYear ? [data?.praPasporGapYear] : []),
		data?.praPasporPddikti,
		data?.praPasporCv,
	];

	const dokumenChecks = [
		data?.passportReady,
		data?.interviewReady,
		data?.contractReady,
		data?.loaReady,
		data?.mcuReady,
		data?.visaReady,
		data?.pdtReady,
		data?.dokumentasiReady,
		data?.ticketReady,
		data?.agenReady,
	];

	const syaratAkhirChecks = [
		data?.logbookReady,
		data?.laporanAkhirReady,
		data?.videoDokumentasiReady,
	];

	const checks = [...praPasporChecks, ...dokumenChecks, ...syaratAkhirChecks];
	const validatedCount = checks.filter(Boolean).length;
	const totalCount = checks.length;

	let panelStatusBadge = (
		<Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
			🟢 {validatedCount}/{totalCount} AMAN
		</Badge>
	);
	if (data?.status === "TIDAK_AMAN") {
		panelStatusBadge = (
			<Badge className="bg-rose-50 text-rose-600 border-rose-200">
				🔴 {validatedCount}/{totalCount} TIDAK AMAN
			</Badge>
		);
	} else if (data?.status === "PERLU_PERHATIAN") {
		panelStatusBadge = (
			<Badge className="bg-amber-50 text-amber-600 border-amber-200">
				🟡 {validatedCount}/{totalCount} PROSES
			</Badge>
		);
	}

	return (
		<TooltipProvider>
			<div className="space-y-6">
				<div>
					<div className="border-b border-slate-200 pb-4 mb-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div>
								<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
									<span className="text-xl">✈️</span> Tim Magang Internasional
									<span className="ml-2 text-sm font-normal text-slate-500">
										[{validatedCount}/{totalCount}]
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
					<Tabs defaultValue="dokumen" className="w-full">
						<TabsList className="mb-6 grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg">
							<TabsTrigger
								value="pra-paspor"
								className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all font-bold"
							>
								Kelayakan Pra-Paspor
							</TabsTrigger>
							<TabsTrigger
								value="dokumen"
								className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all font-bold"
							>
								Dokumen Keberangkatan
							</TabsTrigger>
							<TabsTrigger
								value="dana-talangan"
								className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all font-bold"
							>
								Metode Pembayaran Lanjutan
							</TabsTrigger>
							<TabsTrigger
								value="syarat-akhir"
								className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all font-bold"
							>
								Syarat Akhir
							</TabsTrigger>
						</TabsList>

						<TabsContent value="pra-paspor">
							<TabPraPaspor
								studentId={studentId}
								data={data}
								passportClearance={passportClearance}
								canEdit={canEdit}
								handleToggleField={handleToggleField}
								fetchInternshipData={fetchInternshipData}
							/>
						</TabsContent>

						<TabsContent value="dokumen">
							<TabDokumen
								studentId={studentId}
								data={data}
								canEdit={canEdit}
								handleToggleField={handleToggleField}
								handleLocalChange={handleLocalChange}
								handleBlurField={handleBlurField}
								fetchInternshipData={fetchInternshipData}
								notes={notes}
								setNotes={setNotes}
								handleSaveNotes={handleSaveNotes}
								isSaving={isSaving}
							/>
						</TabsContent>

						<TabsContent value="dana-talangan">
							<TabDanaTalangan
								studentId={studentId}
								data={data}
								pmbPaymentData={pmbPaymentData}
								canEdit={canEdit}
								handleToggleField={handleToggleField}
								handleLocalChange={handleLocalChange}
								handleBlurField={handleBlurField}
							/>
						</TabsContent>

						<TabsContent value="syarat-akhir">
							<TabSyaratAkhir
								studentId={studentId}
								data={data}
								postInternshipDocs={postInternshipDocs}
								canEditPostInternship={canEdit}
								setPostInternshipDocs={setPostInternshipDocs}
								handleToggleField={handleToggleField}
								handleLocalChange={handleLocalChange}
								handleBlurField={handleBlurField}
							/>
						</TabsContent>
					</Tabs>
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
												{validatedCount < totalCount
													? `Menunggu ${totalCount - validatedCount} progres (ceklist) diselesaikan (Saat ini: ${validatedCount}/${totalCount} selesai).`
													: "Seluruh progres (ceklist) telah selesai. Silakan berikan ACC keberangkatan."}
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
											Tim Magang Internasional ini? Status mahasiswa akan
											kembali ke tahap proses.
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
															disabled={validatedCount < totalCount}
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
														menandakan bahwa seluruh progres (ceklist) magang
														mahasiswa telah selesai.
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
									{validatedCount < totalCount && (
										<TooltipContent>
											{`Selesaikan semua ${totalCount - validatedCount} progres (ceklist) yang belum dicentang terlebih dahulu`}
										</TooltipContent>
									)}
								</Tooltip>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</TooltipProvider>
	);
}
