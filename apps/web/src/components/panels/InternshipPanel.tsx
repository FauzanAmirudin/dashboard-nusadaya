"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/eden";
import { hasRole, useAuthStore } from "@/store";
import { formatDeviceDateTime } from "@/utils/format";
import {
	getAgencyPaymentReminders,
	getInternshipAccRequirements,
} from "@/utils/panel-logic";
import { TabDanaTalangan } from "./magang/TabDanaTalangan";
import { TabDokumen } from "./magang/TabDokumen";
import { TabKhsTranskrip } from "./magang/TabKhsTranskrip";
import { TabPenempatan } from "./magang/TabPenempatan";
import { TabPraPaspor } from "./magang/TabPraPaspor";
import { TabSyaratAkhir } from "./magang/TabSyaratAkhir";

interface InternshipData {
	// Pra-Paspor
	praPasporPasFoto?: boolean;
	praPasporKtm?: boolean;
	praPasporKtp?: boolean;
	praPasporKk?: boolean;
	praPasporAktaKelahiran?: boolean;
	praPasporSuratIzinOrtu?: boolean;
	praPasporSl21?: boolean;
	praPasporSkma?: boolean;
	praPasporLos?: boolean;
	praPasporRekomendasiDisdik?: boolean;
	praPasporKhs?: boolean;
	praPasporKrs?: boolean;
	praPasporTranskrip?: boolean;
	praPasporIjazah?: boolean;
	praPasporGapYear?: boolean;
	praPasporPddikti?: boolean;
	praPasporCv?: boolean;

	passportReady: boolean;
	passportNo: string | null;
	passportExp: string | null;
	interviewReady: boolean;
	interviewDate: string | null;
	interviewResult: string | null;
	mouReady?: boolean;
	mouDate?: string | null;
	mouNotes?: string | null;
	loaReady?: boolean;
	loaConfirmed: boolean;
	loaDate: string | null;
	contractReady: boolean;
	contractDate: string | null;
	suhanReady?: boolean;
	suhanNo?: string | null;
	suhanDate?: string | null;
	suhanNotes?: string | null;
	moaReady?: boolean;
	moaDate?: string | null;
	moaNotes?: string | null;
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
	pdtReady?: boolean;
	pdtDate?: string | null;
	pdtEndDate?: string | null;
	pdtPlace?: string | null;
	asesmenReady?: boolean;
	asesmenDate?: string | null;
	asesmenResult?: string | null;
	asesmenNotes?: string | null;
	asesmenPernyataanReady?: boolean;
	destinationCity: string | null;
	internshipDuration: string | null;
	internshipCompany: string | null;
	dokumentasiReady?: boolean;
	dokumentasiKeberangkatanLink: string | null;
	agenReady?: boolean;
	agenNegaraTujuan: string | null;
	agenPeminatan: string | null;
	mitraPenempatanNama?: string | null;

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

export function InternshipPanel({
	studentId,
	destinationCountry,
	onUpdate,
}: InternshipPanelProps) {
	const { user } = useAuthStore();
	const isMagang = hasRole(
		user,
		"magang",
		"internship",
		"akademik",
		"superadmin",
	);
	// Hak ACC sama dengan server (POST/DELETE /internship/acc)
	const canAcc = hasRole(user, "magang", "internship", "superadmin");
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
	const [isLoaded, setIsLoaded] = useState(false);
	const [activeTab, setActiveTab] = useState<string | null>(null);
	const [prereq, setPrereq] = useState<{
		items: { key: string; label: string; ok: boolean }[];
		ok: boolean;
		missing: string[];
	} | null>(null);

	const fetchInternshipData = async () => {
		const res = await api.students[studentId.toString()].internship.get();
		if (res.data?.success && res.data.data) {
			const fetchedData = res.data.data as unknown as InternshipData;
			setData(fetchedData);
			setNotes(fetchedData.notes || "");
		}

		// Prasyarat Magang (sumber: server, aturan yang sama dengan validasi ACC)
		try {
			const preRes =
				await api.students[studentId.toString()].internship.prerequisites.get();
			if (preRes.data?.success) setPrereq(preRes.data.data);
		} catch (e) {
			console.error("Failed to fetch magang prerequisites", e);
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
		setIsLoaded(true);
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

	/**
	 * Simpan satu field. `value` diisi pemanggil agar nilainya diambil dari event
	 * (bukan dari state closure yang bisa tertinggal satu ketukan).
	 */
	const handleBlurField = async (field: any, value?: unknown) => {
		if (!canEdit || !data) return;
		setIsSaving(true);
		const payload = value !== undefined ? value : (data as any)[field];
		const { error } = await api.students[studentId.toString()].internship.patch(
			{
				[field]: payload,
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

	/** Simpan beberapa field sekaligus dalam satu permintaan (form Detail Penempatan). */
	const handleSaveFields = async (patch: Record<string, unknown>) => {
		if (!canEdit || !data) return false;
		setIsSaving(true);
		const { error } = await api.students[studentId.toString()].internship.patch(
			patch as any,
		);
		setIsSaving(false);
		if (error) {
			toast.error("Gagal menyimpan perubahan");
			return false;
		}
		toast.success("Detail penempatan berhasil disimpan");
		onUpdate();
		return true;
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
		try {
			const res =
				await api.students[studentId.toString()].internship.acc.post();
			if (res.error || !res.data?.success) {
				toast.error(
					(res.data as any)?.message ||
						(res.error as any)?.value?.message ||
						"Gagal memberikan ACC Magang",
				);
			} else {
				toast.success("Status ACC Magang berhasil disetujui");
				await fetchInternshipData();
				onUpdate();
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal memberikan ACC Magang");
		}
		setIsSaving(false);
	};

	const handleCancelAcc = async () => {
		setIsSaving(true);
		try {
			const res =
				await api.students[studentId.toString()].internship.acc.delete();
			if (res.error || !res.data?.success) {
				toast.error(
					(res.data as any)?.message ||
						(res.error as any)?.value?.message ||
						"Gagal membatalkan ACC Magang",
				);
			} else {
				toast.success("Status ACC Magang berhasil dibatalkan");
				await fetchInternshipData();
				onUpdate();
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal membatalkan ACC Magang");
		}
		setIsSaving(false);
	};

	// Syarat ACC per grup (aturan sama dengan getInternshipChecks di server)
	const req = getInternshipAccRequirements(
		data as unknown as Record<string, unknown>,
		Boolean(passportClearance?.isGapYear),
		destinationCountry,
	);
	const isAcc = Boolean(data?.isAcc);
	const agencyReminders = getAgencyPaymentReminders(
		data as unknown as Record<string, unknown>,
		destinationCountry,
	);
	const accByName = data?.accBy?.fullName || "Tim Magang";

	const prereqOk = Boolean(prereq?.ok);
	const nextStep = !isLoaded
		? "Memuat syarat ACC..."
		: !prereqOk
			? "Prasyarat belum terpenuhi"
			: !req.praPaspor.ok
				? "Lengkapi Pra-Paspor"
				: !req.dokumen.ok
					? "Lengkapi Dokumen Keberangkatan"
					: "Lengkapi Syarat Akhir";

	// Tab pertama yang belum lengkap dibuka otomatis
	const defaultTab = !req.praPaspor.ok
		? "pra-paspor"
		: !req.dokumen.ok
			? "dokumen"
			: !req.syaratAkhir.ok
				? "syarat-akhir"
				: "pra-paspor";

	const accButton = (extraClass = "") => (
		<Button
			onClick={handleAcc}
			disabled={!req.ok || !prereqOk || isSaving || !isLoaded}
			className={`h-11 bg-[#0517B0] hover:bg-blue-800 text-white text-sm font-semibold ${extraClass}`}
		>
			{isSaving
				? "Memproses..."
				: req.ok && prereqOk
					? "Beri ACC Magang"
					: nextStep}
		</Button>
	);

	const requirementRows = [
		{
			key: "pra-paspor",
			label: "Pra-Paspor",
			ok: req.praPaspor.ok,
			detail: `${req.praPaspor.done}/${req.praPaspor.total} berkas wajib`,
		},
		{
			key: "dokumen",
			label: "Dokumen Keberangkatan",
			ok: req.dokumen.ok,
			detail: `${req.dokumen.done}/${req.dokumen.total} dokumen`,
		},
		{
			key: "syarat-akhir",
			label: "Syarat Akhir",
			ok: req.syaratAkhir.ok,
			detail: `${req.syaratAkhir.done}/${req.syaratAkhir.total} berkas kepulangan`,
		},
	];

	// Ponsel: titik status (hemat ruang); tablet/desktop: badge teks
	const tabBadge = (ok: boolean, text: string) => (
		<>
			<span
				aria-hidden="true"
				className={`size-2 shrink-0 rounded-full sm:hidden ${ok ? "bg-emerald-500" : "bg-amber-500"}`}
			/>
			<span
				aria-hidden="true"
				className={`hidden sm:inline-flex ml-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
			>
				{text}
			</span>
			<span className="sr-only">
				{ok ? "(lengkap)" : `(belum lengkap: ${text})`}
			</span>
		</>
	);

	const tabClass =
		"min-h-11 h-auto min-w-0 xl:flex-none gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-1.5 sm:px-4 py-2 text-center text-[13px] sm:text-sm font-semibold text-slate-600 hover:bg-white/70 hover:text-slate-900 data-active:border-slate-200 data-active:bg-white data-active:text-[#0517B0] data-active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40";

	// Label pendek di bawah lg agar 6 tab muat dalam grid 3 kolom
	const tabLabel = (short: string, full: string) => (
		<>
			<span className="lg:hidden">{short}</span>
			<span className="hidden lg:inline">{full}</span>
		</>
	);

	return (
		<div className="space-y-6">
			{/* Prasyarat Magang belum terpenuhi: data tetap bisa diisi, ACC dikunci */}
			{prereq && !prereq.ok && !isAcc && (
				<section
					role="status"
					className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:px-6"
				>
					<h2 className="text-sm font-bold text-amber-900">
						Mahasiswa belum memenuhi prasyarat Magang
					</h2>
					<p className="mt-0.5 text-sm text-amber-900">
						Berkas tetap bisa dilengkapi, tetapi ACC Magang baru bisa diberikan
						setelah semua prasyarat terpenuhi.
					</p>
					<ul className="mt-2 flex flex-wrap gap-2">
						{prereq.items.map((it) => (
							<li
								key={it.key}
								className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
									it.ok
										? "border-emerald-200 bg-white text-emerald-800"
										: "border-amber-300 bg-white text-amber-900"
								}`}
							>
								<span aria-hidden="true">{it.ok ? "✓" : "✗"}</span>
								{it.label}
								<span className="sr-only">
									{it.ok ? "terpenuhi" : "belum terpenuhi"}
								</span>
							</li>
						))}
					</ul>
				</section>
			)}

			{/* Ringkasan: syarat ACC per grup + satu aksi utama */}
			<section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:p-6">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div className="min-w-0 flex-1">
						<h2 className="text-base font-bold text-slate-900">
							Syarat ACC Magang
						</h2>
						<p className="mt-0.5 text-sm text-slate-700">
							{isAcc ? (
								<>
									<span className="font-semibold text-emerald-700">
										Sudah ACC
									</span>{" "}
									oleh {accByName}
									{data?.accAt ? ` · ${formatDeviceDateTime(data.accAt)}` : ""}
								</>
							) : req.ok ? (
								"Semua syarat terpenuhi. Siap diberi ACC."
							) : (
								"ACC bisa diberikan setelah ketiga kelompok di bawah lengkap."
							)}
						</p>
						<ul className="mt-3 grid gap-2 sm:grid-cols-3">
							{requirementRows.map((r) => (
								<li
									key={r.key}
									className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${r.ok ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-white"}`}
								>
									<span
										aria-hidden="true"
										className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${r.ok ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-700"}`}
									>
										{r.ok ? "✓" : "!"}
									</span>
									<span className="min-w-0">
										<span className="block text-sm font-semibold text-slate-900">
											{r.label}
											<span className="sr-only">
												{r.ok ? " (lengkap)" : " (belum lengkap)"}
											</span>
										</span>
										<span className="block text-xs text-slate-600">
											{r.detail}
										</span>
									</span>
								</li>
							))}
						</ul>
						{/* Pengingat termin pembayaran kampus ke agensi (tidak mengunci ACC) */}
						{agencyReminders.length > 0 && (
							<ul role="status" className="mt-3 space-y-1.5">
								{agencyReminders.map((r) => (
									<li
										key={r.key}
										className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
									>
										<span className="font-semibold">Pengingat agensi:</span>{" "}
										{r.text}
									</li>
								))}
							</ul>
						)}
					</div>

					{canAcc &&
						(isAcc ? (
							<AlertDialog>
								<AlertDialogTrigger
									render={
										<Button
											variant="outline"
											disabled={isSaving}
											className="h-11 border-slate-200 text-slate-700 text-sm font-semibold"
										/>
									}
								>
									Batalkan ACC
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											Konfirmasi Pembatalan ACC Magang
										</AlertDialogTitle>
										<AlertDialogDescription>
											Apakah Anda yakin ingin membatalkan status ACC untuk panel
											Magang mahasiswa ini? Status mahasiswa akan kembali ke
											tahap evaluasi berkas.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<div className="flex justify-end gap-2">
										<AlertDialogCancel>Batal</AlertDialogCancel>
										<AlertDialogAction onClick={handleCancelAcc}>
											Ya, batalkan ACC
										</AlertDialogAction>
									</div>
								</AlertDialogContent>
							</AlertDialog>
						) : (
							<div className="hidden sm:block shrink-0">{accButton()}</div>
						))}
				</div>
			</section>

			{/* Sub-tab bergaya tombol segmen, urut sesuai alur magang */}
			<Tabs
				value={activeTab ?? defaultTab}
				onValueChange={setActiveTab}
				className="w-full space-y-6"
			>
				<TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 xl:inline-flex xl:w-auto">
					<TabsTrigger value="pra-paspor" className={tabClass}>
						Pra-Paspor
						{tabBadge(
							req.praPaspor.ok,
							`${req.praPaspor.done}/${req.praPaspor.total}`,
						)}
					</TabsTrigger>
					<TabsTrigger value="khs-transkrip" className={tabClass}>
						{tabLabel("Nilai", "Nilai Akademik")}
					</TabsTrigger>
					<TabsTrigger value="penempatan" className={tabClass}>
						Penempatan
					</TabsTrigger>
					<TabsTrigger value="dokumen" className={tabClass}>
						{tabLabel("Dokumen", "Dokumen Keberangkatan")}
						{tabBadge(
							req.dokumen.ok,
							`${req.dokumen.done}/${req.dokumen.total}`,
						)}
					</TabsTrigger>
					<TabsTrigger value="dana-talangan" className={tabClass}>
						{tabLabel("Pembayaran", "Pembayaran Lanjutan")}
						{agencyReminders.length > 0 &&
							tabBadge(false, `${agencyReminders.length} pengingat`)}
					</TabsTrigger>
					<TabsTrigger value="syarat-akhir" className={tabClass}>
						{tabLabel("Akhir", "Syarat Akhir")}
						{tabBadge(
							req.syaratAkhir.ok,
							`${req.syaratAkhir.done}/${req.syaratAkhir.total}`,
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="pra-paspor">
					<TabPraPaspor
						studentId={studentId}
						data={data as unknown as Record<string, unknown>}
						passportClearance={passportClearance}
						canEdit={canEdit}
						loadingItem={loadingItem}
						handleToggleField={handleToggleField}
						fetchInternshipData={fetchInternshipData}
					/>
				</TabsContent>

				<TabsContent value="khs-transkrip">
					<TabKhsTranskrip studentId={studentId} />
				</TabsContent>

				<TabsContent value="penempatan">
					<TabPenempatan
						studentId={studentId}
						data={data as unknown as Record<string, unknown>}
						canEdit={canEdit}
						loadingItem={loadingItem}
						handleToggleField={handleToggleField}
						handleLocalChange={handleLocalChange}
						handleSaveFields={handleSaveFields}
						isSaving={isSaving}
						fetchInternshipData={fetchInternshipData}
					/>
				</TabsContent>

				<TabsContent value="dokumen">
					<TabDokumen
						studentId={studentId}
						data={data}
						destinationCountry={destinationCountry}
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

			{/* Ponsel: aksi utama menempel di bawah, dalam jangkauan ibu jari */}
			{canAcc && !isAcc && (
				<div className="sm:hidden sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
					{accButton("w-full")}
				</div>
			)}
		</div>
	);
}
