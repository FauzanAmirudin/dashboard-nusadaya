"use client";

import {
	AlertTriangle,
	CalendarClock,
	CheckCircle,
	CheckCircle2,
	Clock,
	CreditCard,
	FileCheck,
	FolderCheck,
	GraduationCap,
	Loader2,
	Plane,
	Plus,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AccPanelStatusCard } from "@/components/ui/AccPanelStatusCard";
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
import { PanelHeader } from "@/components/ui/PanelHeader";
import { PanelStatusBadge } from "@/components/ui/PanelStatusBadge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { hasRole, useAuthStore } from "@/store";
import { formatDeviceDateTime } from "@/utils/format";
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
	const isMagang = hasRole(
		user,
		"magang",
		"internship",
		"akademik",
		"superadmin",
	);
	const isSuperadmin = hasRole(user, "superadmin");
	const [data, setData] = useState<InternshipData | null>(null);

	const canEdit = isMagang;
	const canEditPostInternship = isMagang;

	const [isSaving, setIsSaving] = useState(false);
	const [loadingItem, setLoadingItem] = useState<string | null>(null);
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
		const { error } = await api.students[studentId.toString()].internship.patch(
			{
				[field]: (data as any)[field],
			},
		);
		if (error) {
			toast.error("Gagal menyimpan perubahan");
		} else {
			toast.success("Perubahan data berhasil disimpan");
			onUpdate();
		}
		setIsSaving(false);
	};

	const handleToggleField = async (field: any, value: any) => {
		if (!canEdit) return;
		setLoadingItem(field);
		const prevVal = data ? (data as any)[field] : undefined;

		// Optimistic update
		setData((prev) =>
			prev ? ({ ...prev, [field]: value } as InternshipData) : null,
		);

		const { error } = await api.students[studentId.toString()].internship.patch(
			{
				[field]: value,
			},
		);

		if (error) {
			setData((prev) =>
				prev ? ({ ...prev, [field]: prevVal } as InternshipData) : null,
			);
			toast.error("Gagal memperbarui status checklist");
		} else {
			toast.success("Status checklist berhasil disimpan");
			onUpdate();
		}
		setLoadingItem(null);
	};

	const handleSaveNotes = async () => {
		if (!canEdit) return;
		setIsSaving(true);
		const { error } = await api.students[studentId.toString()].internship.patch(
			{ notes },
		);
		if (error) {
			toast.error("Gagal menyimpan catatan");
		} else {
			toast.success("Catatan internal magang berhasil disimpan");
			await fetchInternshipData();
			onUpdate();
		}
		setIsSaving(false);
	};

	const handleAcc = async () => {
		setIsSaving(true);
		const { error } =
			await api.students[studentId.toString()].internship.acc.post();
		if (error) {
			toast.error("Gagal memberikan ACC Magang");
		} else {
			toast.success("Status ACC Magang berhasil disetujui");
			await fetchInternshipData();
			onUpdate();
		}
		setIsSaving(false);
	};

	const handleCancelAcc = async () => {
		setIsSaving(true);
		const { error } =
			await api.students[studentId.toString()].internship.acc.delete();
		if (error) {
			toast.error("Gagal membatalkan ACC Magang");
		} else {
			toast.success("Status ACC Magang berhasil dibatalkan");
			await fetchInternshipData();
			onUpdate();
		}
		setIsSaving(false);
	};

	const praPasporKeys = [
		"praPasporPasFoto",
		"praPasporKtm",
		"praPasporKtp",
		"praPasporKk",
		"praPasporAktaKelahiran",
		"praPasporSl21",
		"praPasporSkma",
		"praPasporRekomendasiDisdik",
		...(passportClearance?.isGapYear ? ["praPasporGapYear"] : []),
		"praPasporCv",
	];

	const praPasporCompleted = praPasporKeys.filter(
		(k) => !!(data as any)?.[k],
	).length;
	const praPasporTotal = praPasporKeys.length;

	const dokumenKeys = [
		"passportReady",
		"interviewReady",
		"lolReady",
		"loaConfirmed",
		"moaReady",
		"contractReady",
		"mcuReady",
		"visaReady",
		"ticketReady",
		"pdtReady",
		"dokumentasiReady",
		"agenReady",
	];

	const dokumenCompleted = dokumenKeys.filter(
		(k) => !!(data as any)?.[k],
	).length;
	const dokumenTotal = dokumenKeys.length;

	const syaratAkhirKeys = [
		"logbookReady",
		"laporanAkhirReady",
		"videoDokumentasiReady",
	];

	const syaratAkhirCompleted = syaratAkhirKeys.filter(
		(k) => !!(data as any)?.[k],
	).length;
	const syaratAkhirTotal = syaratAkhirKeys.length;

	// Total checklist progress
	const allChecklistKeys = [
		...praPasporKeys,
		...dokumenKeys,
		...syaratAkhirKeys,
	];
	const validatedCount = allChecklistKeys.filter(
		(k) => !!(data as any)?.[k],
	).length;
	const totalCount = allChecklistKeys.length;
	const progressPercent =
		totalCount > 0 ? Math.round((validatedCount / totalCount) * 100) : 0;

	return (
		<TooltipProvider>
			<div className="space-y-6">
				<PanelHeader
					icon={<Plane className="w-5 h-5 text-[#0517B0]" />}
					title="Divisi Magang & Penempatan Luar Negeri"
					subtitle="Monitoring berkas pra-paspor, legalitas visa, kontrak, tiket, dan evaluasi kepulangan magang"
					progressTag={
						data?.isAcc && (
							<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold gap-1">
								<CheckCircle2 className="w-3.5 h-3.5" /> ACC Disetujui
							</Badge>
						)
					}
					badge={
						<PanelStatusBadge
							isAcc={data?.isAcc}
							completed={validatedCount}
							total={totalCount}
							size="lg"
						/>
					}
				>
					{/* Progress bar */}
					<div className="space-y-1.5">
						<div className="flex justify-between text-xs text-slate-500 font-medium">
							<span>Kelengkapan Modul Magang</span>
							<span>{progressPercent}%</span>
						</div>
						<Progress
							value={progressPercent}
							className="h-2 bg-slate-200/60 [&>div]:bg-[#0517B0]"
						/>
					</div>
				</PanelHeader>

				{/* TABS NAVIGATION */}
				<Tabs defaultValue="dokumen" className="w-full">
					<TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-4 bg-slate-100 p-1 rounded-xl h-auto gap-1">
						<TabsTrigger
							value="pra-paspor"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm rounded-lg py-2.5 transition-all font-bold text-xs flex items-center justify-center gap-2"
						>
							<FolderCheck className="w-4 h-4" />
							<span>Pra-Paspor</span>
							<Badge
								variant="outline"
								className={`text-[10px] px-1.5 py-0 ${
									praPasporCompleted === praPasporTotal
										? "bg-emerald-50 text-emerald-700 border-emerald-200"
										: "bg-slate-100 text-slate-600 border-slate-200"
								}`}
							>
								{praPasporCompleted}/{praPasporTotal}
							</Badge>
						</TabsTrigger>

						<TabsTrigger
							value="dokumen"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm rounded-lg py-2.5 transition-all font-bold text-xs flex items-center justify-center gap-2"
						>
							<Plane className="w-4 h-4" />
							<span>Dokumen Terbang</span>
							<Badge
								variant="outline"
								className={`text-[10px] px-1.5 py-0 ${
									dokumenCompleted === dokumenTotal
										? "bg-emerald-50 text-emerald-700 border-emerald-200"
										: "bg-slate-100 text-slate-600 border-slate-200"
								}`}
							>
								{dokumenCompleted}/{dokumenTotal}
							</Badge>
						</TabsTrigger>

						<TabsTrigger
							value="dana-talangan"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm rounded-lg py-2.5 transition-all font-bold text-xs flex items-center justify-center gap-2"
						>
							<CreditCard className="w-4 h-4" />
							<span>Pembayaran Lanjutan</span>
						</TabsTrigger>

						<TabsTrigger
							value="syarat-akhir"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm rounded-lg py-2.5 transition-all font-bold text-xs flex items-center justify-center gap-2"
						>
							<GraduationCap className="w-4 h-4" />
							<span>Syarat Akhir</span>
							<Badge
								variant="outline"
								className={`text-[10px] px-1.5 py-0 ${
									syaratAkhirCompleted === syaratAkhirTotal
										? "bg-emerald-50 text-emerald-700 border-emerald-200"
										: "bg-slate-100 text-slate-600 border-slate-200"
								}`}
							>
								{syaratAkhirCompleted}/{syaratAkhirTotal}
							</Badge>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="pra-paspor">
						<TabPraPaspor
							studentId={studentId}
							data={data}
							passportClearance={passportClearance}
							canEdit={canEdit}
							loadingItem={loadingItem}
							handleToggleField={handleToggleField}
							fetchInternshipData={fetchInternshipData}
						/>
					</TabsContent>

					<TabsContent value="dokumen">
						<TabDokumen
							studentId={studentId}
							data={data}
							canEdit={canEdit}
							loadingItem={loadingItem}
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
							canEditPostInternship={canEditPostInternship}
							loadingItem={loadingItem}
							setPostInternshipDocs={setPostInternshipDocs}
							handleToggleField={handleToggleField}
							handleLocalChange={handleLocalChange}
							handleBlurField={handleBlurField}
						/>
					</TabsContent>
				</Tabs>

				{/* Bottom ACC Status Card */}
				<AccPanelStatusCard
					isAcc={Boolean(data?.isAcc)}
					accByUser={data?.accBy?.fullName || "Tim Magang"}
					accAt={data?.accAt}
					isReadyForAcc={validatedCount >= totalCount}
					title="ACC Divisi Magang"
					pendingTitle={
						validatedCount < totalCount
							? `Menunggu Kelengkapan Berkas (${totalCount - validatedCount} item belum selesai)`
							: "Persetujuan Akhir Divisi Magang"
					}
					pendingDescription={`Kelengkapan checklist: ${validatedCount}/${totalCount} selesai. Selesaikan semua berkas pra-paspor, dokumen, dan syarat kepulangan sebelum ACC.`}
					readyDescription="Seluruh berkas magang telah lengkap dan tervalidasi. Silakan berikan persetujuan ACC resmi sekarang."
					canEdit={isMagang}
					isSaving={isSaving}
					onAcc={handleAcc}
					onCancelAcc={handleCancelAcc}
					cancelDialogTitle="Konfirmasi Pembatalan ACC Magang"
					cancelDialogDescription="Apakah Anda yakin ingin membatalkan status ACC untuk panel Tim Magang Internasional ini? Status mahasiswa akan kembali ke tahap evaluasi berkas."
					disabledReason={`Selesaikan ${totalCount - validatedCount} item checklist terlebih dahulu sebelum ACC`}
				/>
			</div>
		</TooltipProvider>
	);
}
