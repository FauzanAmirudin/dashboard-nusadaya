"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { api } from "@/lib/eden";

interface DocFile {
	id: number;
	documentKey: string;
	fileName: string;
	fileUrl: string;
	isVerified: boolean;
	uploadedAt: string;
	uploadedByUser?: { fullName: string } | null;
	verifiedByUser?: { fullName: string } | null;
}

interface TabChecklistProps {
	studentId: number;
	pmbData: any;
	canEdit: boolean;
	documents: Record<string, DocFile[]>;
	fetchDocuments: () => void;
	onUpdate: () => void;
}

const ADDITIONAL_DOCS = [
	{
		key: "ktp",
		propKey: "docKtp",
		label: "KTP (Kartu Tanda Penduduk)",
		desc: "Scan / Foto KTP asli yang masih berlaku dan terbaca jelas",
		isOptional: false,
	},
	{
		key: "kk",
		propKey: "docKk",
		label: "Kartu Keluarga (KK)",
		desc: "Scan Kartu Keluarga terbaru sesuai data pendaftaran",
		isOptional: false,
	},
	{
		key: "cv",
		propKey: "docCv",
		label: "Curriculum Vitae (CV)",
		desc: "Berkas riwayat hidup resmi mahasiswa dalam format PDF",
		isOptional: false,
	},
	{
		key: "ijazah",
		propKey: "docIjazah",
		label: "Ijazah Pendidikan Terakhir",
		desc: "Scan legalisir Ijazah SMA/SMK/Diploma/S1 asli",
		isOptional: false,
	},
	{
		key: "transkrip",
		propKey: "docTranskrip",
		label: "Transkrip Nilai / SKL",
		desc: "Scan Transkrip Nilai atau Surat Keterangan Lulus resmi",
		isOptional: false,
	},
	{
		key: "passport_depan",
		propKey: "docPassportDepan",
		label: "Paspor Halaman Depan (Identitas)",
		desc: "Halaman identitas paspor berstandar internasional",
		isOptional: false,
	},
	{
		key: "passport_visa",
		propKey: "docPassportVisa",
		label: "Paspor Halaman Visa / Tambahan (Opsional)",
		desc: "Halaman catatan visa atau lembar pengesahan paspor (Opsional di awal, tidak mengunci ACC PMB)",
		isOptional: true,
	},
	{
		key: "skbm",
		propKey: "docSkbm",
		label: "Surat Keterangan Bebas Masalah (SKBM / SKCK)",
		desc: "Surat berkelakuan baik resmi dari kepolisian / instansi berwenang",
		isOptional: false,
	},
	{
		key: "pre_mcu",
		propKey: "docPreMcu",
		label: "Pre-Medical Check Up (Pra-MCU Skrining Awal)",
		desc: "Skrining awal: Tes buta warna Ishihara, bebas tato/tindik, riwayat fisik & operasi",
		isOptional: false,
	},
	{
		key: "sla",
		propKey: "docSla",
		label: "Service Level Agreement (SLA)",
		desc: "Dokumen kesepakatan tingkat layanan (SLA) yang telah disetujui",
		isOptional: false,
	},
	{
		key: "sertifikasi_bahasa",
		propKey: "docSertifikasiBahasa",
		label: "Sertifikasi Bahasa (TOEIC / JLPT / Topik - Opsional PMB)",
		desc: "Sertifikat kompetensi bahasa sesuai negara tujuan (Dikelola di Panel Magang, tidak mengunci ACC PMB)",
		isOptional: true,
	},
	{
		key: "bpjs",
		propKey: "docBpjs",
		label: "BPJS / Asuransi Kesehatan",
		desc: "Scan Kartu BPJS / KIS / Asuransi Kesehatan aktif (Opsional, tidak membatalkan ACC)",
		isOptional: true,
	},
];

export function TabChecklist({
	studentId,
	pmbData,
	canEdit,
	documents = {},
	fetchDocuments,
	onUpdate,
}: TabChecklistProps) {
	const queryClient = useQueryClient();
	const [loadingItem, setLoadingItem] = useState<string | null>(null);

	const [localChecks, setLocalChecks] = useState<Record<string, boolean>>({
		formReceived: !!pmbData?.formReceived,
		documentsComplete: !!pmbData?.documentsComplete,
		dataInputted: !!pmbData?.dataInputted,
		initialFollowUp: !!pmbData?.initialFollowUp,
		pasFoto: !!pmbData?.pasFoto,
		docKtp: !!pmbData?.docKtp,
		docKk: !!pmbData?.docKk,
		docCv: !!pmbData?.docCv,
		docIjazah: !!pmbData?.docIjazah,
		docTranskrip: !!pmbData?.docTranskrip,
		docPassportDepan: !!pmbData?.docPassportDepan,
		docPassportVisa: !!pmbData?.docPassportVisa,
		docSkbm: !!pmbData?.docSkbm,
		docPreMcu: !!pmbData?.docPreMcu,
		docMcu: !!pmbData?.docMcu,
		docBpjs: !!pmbData?.docBpjs,
		docSla: !!pmbData?.docSla,
		docSertifikasiBahasa: !!pmbData?.docSertifikasiBahasa,
	});

	useEffect(() => {
		setLocalChecks({
			formReceived: !!pmbData?.formReceived,
			documentsComplete: !!pmbData?.documentsComplete,
			dataInputted: !!pmbData?.dataInputted,
			initialFollowUp: !!pmbData?.initialFollowUp,
			pasFoto: !!pmbData?.pasFoto,
			docKtp: !!pmbData?.docKtp,
			docKk: !!pmbData?.docKk,
			docCv: !!pmbData?.docCv,
			docIjazah: !!pmbData?.docIjazah,
			docTranskrip: !!pmbData?.docTranskrip,
			docPassportDepan: !!pmbData?.docPassportDepan,
			docPassportVisa: !!pmbData?.docPassportVisa,
			docSkbm: !!pmbData?.docSkbm,
			docPreMcu: !!pmbData?.docPreMcu,
			docMcu: !!pmbData?.docMcu,
			docBpjs: !!pmbData?.docBpjs,
			docSla: !!pmbData?.docSla,
			docSertifikasiBahasa: !!pmbData?.docSertifikasiBahasa,
		});
	}, [pmbData]);

	const mainChecklist = [
		{
			id: "formReceived",
			documentKey: "form_received",
			label: "Formulir Masuk",
			desc: "Formulir pendaftaran telah diterima dan diverifikasi",
			checked: localChecks.formReceived,
		},
		{
			id: "dataInputted",
			documentKey: "data_inputted",
			label: "Input Data Awal",
			desc: "Data mahasiswa telah diinput ke sistem dashboard",
			checked: localChecks.dataInputted,
		},
		{
			id: "initialFollowUp",
			documentKey: "initial_follow_up",
			label: "Follow Up Awal",
			desc: "Kontak awal dan konfirmasi orang tua/wali selesai",
			checked: localChecks.initialFollowUp,
		},
		{
			id: "pasFoto",
			documentKey: "pas_foto",
			label: "Pas Foto (Standar Visa / Formal)",
			desc: "Pas foto formal terbaru calon mahasiswa (standar paspor/visa)",
			checked: localChecks.pasFoto,
		},
	];

	const completedMainCount = [
		localChecks.formReceived,
		localChecks.dataInputted,
		localChecks.initialFollowUp,
		localChecks.pasFoto,
	].filter(Boolean).length;

	const requiredDocs = ADDITIONAL_DOCS.filter((d) => !d.isOptional);
	const completedRequiredDocsCount = requiredDocs.filter(
		(d) => localChecks[d.propKey],
	).length;
	const totalCompletedDocsCount = ADDITIONAL_DOCS.filter(
		(d) => localChecks[d.propKey],
	).length;

	const handleCheckboxChange = async (propKey: string, checked: boolean) => {
		if (!canEdit) return;

		const prevState = { ...localChecks };
		const newState = { ...prevState, [propKey]: checked };
		setLocalChecks(newState);
		setLoadingItem(propKey);

		const payload = {
			formReceived: newState.formReceived,
			documentsComplete: newState.documentsComplete,
			dataInputted: newState.dataInputted,
			initialFollowUp: newState.initialFollowUp,
			pasFoto: newState.pasFoto,
			docKtp: newState.docKtp,
			docKk: newState.docKk,
			docCv: newState.docCv,
			docIjazah: newState.docIjazah,
			docTranskrip: newState.docTranskrip,
			docPassportDepan: newState.docPassportDepan,
			docPassportVisa: newState.docPassportVisa,
			docSkbm: newState.docSkbm,
			docPreMcu: newState.docPreMcu,
			docMcu: newState.docMcu,
			docBpjs: newState.docBpjs,
			docSla: newState.docSla,
			docSertifikasiBahasa: newState.docSertifikasiBahasa,
		};

		const { error } = await api.students[studentId.toString()].pmb.put(payload);
		if (error) {
			setLocalChecks(prevState);
			toast.error("Gagal menyimpan perubahan status checklist");
		} else {
			toast.success("Status checklist berhasil disimpan");

			// 1. Invalidate TanStack query cache untuk instant synchronization
			queryClient.invalidateQueries({ queryKey: ["students-list"] });
			queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
			queryClient.invalidateQueries({
				queryKey: ["student", studentId.toString()],
			});
			queryClient.invalidateQueries({
				queryKey: ["student-detail", studentId.toString()],
			});

			// 2. Hitung progress baru untuk 0ms real-time header sync
			const updatedMainCompleted = [
				newState.formReceived,
				newState.dataInputted,
				newState.initialFollowUp,
				newState.pasFoto,
			].filter(Boolean).length;
			const updatedRequiredDocsCompleted = ADDITIONAL_DOCS.filter(
				(d) => !d.isOptional && newState[d.propKey],
			).length;
			const updatedTotal = updatedMainCompleted + updatedRequiredDocsCompleted;

			window.dispatchEvent(
				new CustomEvent("pmb-progress-sync", {
					detail: {
						studentId,
						completed: updatedTotal,
						total: 13,
					},
				}),
			);
			window.dispatchEvent(
				new CustomEvent("student-updated", { detail: { studentId } }),
			);

			// 3. Broadcast channel untuk sinkronisasi antar tab browser
			try {
				if (typeof BroadcastChannel !== "undefined") {
					const channel = new BroadcastChannel("dashboard-realtime-sync");
					channel.postMessage({ type: "pmb-updated", studentId });
					channel.close();
				}
			} catch {}

			onUpdate();
		}
		setLoadingItem(null);
	};

	const optionalDocs = ADDITIONAL_DOCS.filter((d) => d.isOptional);

	// Label tanpa penanda "(Opsional)" karena sudah dikelompokkan
	const cleanLabel = (label: string) =>
		label
			.replace(/\s*-\s*Opsional PMB/g, "")
			.replace(/\s*\(Opsional\)/g, "")
			.trim();

	// Satu baris dokumen: checkbox + label + deskripsi singkat + unggah berkas
	const renderRow = (row: {
		key: string;
		checkboxId: string;
		propKey: string;
		label: string;
		desc: string;
		checked: boolean;
		documentKey: string;
		action?: React.ReactNode;
	}) => (
		<li
			key={row.key}
			className={`px-4 py-4 sm:px-6 transition-colors ${row.checked ? "bg-emerald-50/60" : "bg-white"}`}
		>
			<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] md:items-start md:gap-6">
				<div className="flex min-w-0 items-start gap-3">
					<Checkbox
						id={row.checkboxId}
						checked={row.checked}
						disabled={!canEdit || loadingItem === row.propKey}
						onCheckedChange={(checked) =>
							handleCheckboxChange(row.propKey, !!checked)
						}
						className="mt-0.5 size-5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
					/>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<label
								htmlFor={row.checkboxId}
								className="text-sm font-semibold text-slate-900 cursor-pointer [overflow-wrap:anywhere]"
							>
								{cleanLabel(row.label)}
							</label>
							{loadingItem === row.propKey && (
								<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 shrink-0" />
							)}
						</div>
						<p
							className="mt-0.5 text-xs text-slate-500 line-clamp-2"
							title={row.desc}
						>
							{row.desc}
						</p>
						{row.action}
					</div>
				</div>
				<div className="min-w-0 pl-8 md:pl-0">
					<DocumentUpload
						studentId={studentId}
						panel="pmb"
						documentKey={row.documentKey}
						onUploadSuccess={() => {
							fetchDocuments();
							if (!row.checked) {
								handleCheckboxChange(row.propKey, true);
							}
						}}
						canEdit={canEdit}
					/>
				</div>
			</div>
		</li>
	);

	const docRow = (doc: (typeof ADDITIONAL_DOCS)[number]) =>
		renderRow({
			key: doc.key,
			checkboxId: `doc-${doc.key}`,
			propKey: doc.propKey,
			label: doc.label,
			desc: doc.desc,
			checked: !!localChecks[doc.propKey],
			documentKey: doc.key,
		});

	const groupHeader = (title: string, done: number, total: number) => (
		<div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
			<h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
			<span
				className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
					done >= total
						? "bg-emerald-100 text-emerald-800"
						: "bg-amber-100 text-amber-800"
				}`}
			>
				{done} / {total} selesai
			</span>
		</div>
	);

	return (
		<div className="w-full space-y-6">
			{/* 1. Berkas Utama (wajib) */}
			<section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
				{groupHeader("Berkas Utama", completedMainCount, mainChecklist.length)}
				<ul className="divide-y divide-slate-100">
					{mainChecklist.map((item) =>
						renderRow({
							key: item.id,
							checkboxId: item.id,
							propKey: item.id,
							label: item.label,
							desc: item.desc,
							checked: item.checked,
							documentKey: item.documentKey,
							// Formulir Masuk: cetak → tanda tangan ortu → unggah di baris ini
							action:
								item.id === "formReceived" ? (
									<a
										href={`/dashboard/students/${studentId}/formulir`}
										target="_blank"
										rel="noopener noreferrer"
										className="mt-1.5 inline-flex min-h-9 items-center text-xs font-semibold text-[#0517B0] hover:underline"
									>
										Cetak formulir untuk tanda tangan orang tua →
									</a>
								) : undefined,
						}),
					)}
				</ul>
			</section>

			{/* 2. Dokumen Wajib */}
			<section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
				{groupHeader(
					"Dokumen Wajib",
					completedRequiredDocsCount,
					requiredDocs.length,
				)}
				<ul className="divide-y divide-slate-100">
					{requiredDocs.map(docRow)}
				</ul>
			</section>

			{/* 3. Dokumen Opsional (tidak mengunci ACC) */}
			<Collapsible className="overflow-hidden rounded-xl border border-slate-200 bg-white">
				<CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between gap-3 bg-slate-50 px-4 sm:px-6 text-left hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0517B0]/40">
					<span className="text-sm font-semibold text-slate-700">
						Dokumen opsional ({optionalDocs.length})
						<span className="ml-2 font-normal text-slate-500">
							tidak mempengaruhi ACC
						</span>
					</span>
					<ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-data-[panel-open]:rotate-180" />
				</CollapsibleTrigger>
				<CollapsibleContent>
					<ul className="divide-y divide-slate-100 border-t border-slate-200">
						{optionalDocs.map(docRow)}
					</ul>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
