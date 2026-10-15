"use client";

import {
	AlertCircle,
	AlertTriangle,
	ArrowLeft,
	Building2,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	FileText,
	Loader2,
	User,
	XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/eden";
import { formatReferralCategory } from "@/lib/referral";

export default function ResponseDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params?.id as string;

	const [data, setData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);

	const [isApproveOpen, setIsApproveOpen] = useState(false);
	const [isRejectOpen, setIsRejectOpen] = useState(false);
	const [rejectionNotes, setRejectionNotes] = useState("");
	const [selectedRejectTabs, setSelectedRejectTabs] = useState<number[]>([]);
	const [selectedRejectFields, setSelectedRejectFields] = useState<
		Array<{
			fieldKey: string;
			fieldLabel: string;
			tabIndex: number;
			reason?: string;
		}>
	>([]);
	const [activeRejectTabModal, setActiveRejectTabModal] = useState<number>(0);
	const [isProcessing, setIsProcessing] = useState(false);

	const TAB_OPTIONS = [
		{ id: 0, label: "Tab 1: Keterangan Mahasiswa" },
		{ id: 1, label: "Tab 2: Keterangan Pendidikan" },
		{ id: 2, label: "Tab 3: Keterangan Kesehatan" },
		{ id: 3, label: "Tab 4: Keterangan Ayah Kandung" },
		{ id: 4, label: "Tab 5: Keterangan Ibu Kandung" },
		{ id: 5, label: "Tab 6: Keterangan Wali" },
		{ id: 6, label: "Tab 7: Informasi PMB & Referensi" },
		{ id: 7, label: "Tab 8: Kontak Kawan & Darurat" },
	];

	const REJECTABLE_FIELDS: Record<
		number,
		{ tabLabel: string; fields: Array<{ key: string; label: string }> }
	> = {
		0: {
			tabLabel: "Tab 1: Mahasiswa",
			fields: [
				{ key: "profilePhotoUrl", label: "Foto Profil Mahasiswa" },
				{ key: "name", label: "Nama Lengkap" },
				{ key: "nickname", label: "Nama Panggilan" },
				{ key: "email", label: "Alamat Email" },
				{ key: "phone", label: "Nomor WhatsApp Mahasiswa" },
				{ key: "birthPlace", label: "Tempat Lahir" },
				{ key: "birthDate", label: "Tanggal Lahir" },
				{ key: "gender", label: "Jenis Kelamin" },
				{ key: "religion", label: "Agama" },
				{ key: "nationality", label: "Kewarganegaraan" },
				{ key: "livingWith", label: "Tinggal Bersama" },
				{ key: "addressStreet", label: "Jalan / No. Rumah" },
				{ key: "addressRt", label: "RT / RW" },
				{ key: "addressCity", label: "Kabupaten/Kota & Provinsi" },
			],
		},
		1: {
			tabLabel: "Tab 2: Pendidikan",
			fields: [
				{ key: "schoolOrigin", label: "Nama Sekolah Asal" },
				{ key: "schoolMajor", label: "Jurusan Sekolah Asal" },
				{ key: "graduationYear", label: "Tahun Kelulusan" },
				{ key: "schoolAddress", label: "Alamat Sekolah Asal" },
				{ key: "program", label: "Program Studi" },
				{ key: "subProgram", label: "Peminatan / Sub Program" },
				{ key: "classType", label: "Pilihan Kelas" },
				{ key: "cohort", label: "Angkatan & Tahun Ajaran" },
			],
		},
		2: {
			tabLabel: "Tab 3: Kesehatan",
			fields: [
				{ key: "bloodType", label: "Golongan Darah" },
				{ key: "height", label: "Tinggi Badan (cm)" },
				{ key: "weight", label: "Berat Badan (kg)" },
				{ key: "clothingSize", label: "Ukuran Baju" },
				{ key: "diseaseHistory", label: "Riwayat Penyakit" },
				{ key: "congenitalDisease", label: "Penyakit Bawaan" },
				{ key: "colorBlindTest", label: "Hasil Tes Buta Warna" },
				{ key: "hasTattoo", label: "Pemeriksaan Tato" },
				{ key: "hasPiercingNonStandard", label: "Pemeriksaan Tindik" },
				{ key: "hasMajorSurgeryHistory", label: "Riwayat Operasi Besar" },
				{ key: "hasChronicDisease", label: "Penyakit Kronis" },
				{ key: "mcuConsentAgreed", label: "Kesediaan Ikut MCU Resmi" },
			],
		},
		3: {
			tabLabel: "Tab 4: Ayah",
			fields: [
				{ key: "ayahName", label: "Nama Lengkap Ayah" },
				{ key: "ayahStatus", label: "Keadaan Ayah (Hidup/Meninggal)" },
				{ key: "ayahPhone", label: "Nomor WhatsApp Ayah" },
				{ key: "ayahEmail", label: "Alamat Email Ayah" },
				{ key: "ayahJob", label: "Pekerjaan Ayah" },
				{ key: "ayahEducation", label: "Pendidikan Ayah" },
				{ key: "ayahAddress", label: "Alamat Lengkap Ayah" },
			],
		},
		4: {
			tabLabel: "Tab 5: Ibu",
			fields: [
				{ key: "ibuName", label: "Nama Lengkap Ibu" },
				{ key: "ibuStatus", label: "Keadaan Ibu (Hidup/Meninggal)" },
				{ key: "ibuPhone", label: "Nomor WhatsApp Ibu" },
				{ key: "ibuEmail", label: "Alamat Email Ibu" },
				{ key: "ibuJob", label: "Pekerjaan Ibu" },
				{ key: "ibuEducation", label: "Pendidikan Ibu" },
				{ key: "ibuAddress", label: "Alamat Lengkap Ibu" },
			],
		},
		5: {
			tabLabel: "Tab 6: Wali",
			fields: [
				{ key: "waliName", label: "Nama Lengkap Wali" },
				{
					key: "waliGuardianRelation",
					label: "Hubungan Wali dengan Mahasiswa",
				},
				{ key: "waliPhone", label: "Nomor WhatsApp Wali" },
				{ key: "waliEmail", label: "Alamat Email Wali" },
				{ key: "waliJob", label: "Pekerjaan Wali" },
				{ key: "waliAddress", label: "Alamat Lengkap Wali" },
			],
		},
		6: {
			tabLabel: "Tab 7: Referensi",
			fields: [
				{ key: "referralCategory", label: "Kategori Sumber Referral" },
				{
					key: "referralInstitutionName",
					label: "Nama Institusi / Lembaga Referral",
				},
				{ key: "referralContactName", label: "Nama Kontak PIC Referral" },
				{ key: "referralContactPhone", label: "Nomor WhatsApp PIC Referral" },
				{ key: "period", label: "Periode Keberangkatan" },
				{ key: "rekomendasi", label: "Jenis Rekomendasi" },
				{ key: "roReferral", label: "RO Referral" },
			],
		},
		7: {
			tabLabel: "Tab 8: Kontak",
			fields: [
				{ key: "emergencyContactName", label: "Nama Kontak Darurat" },
				{
					key: "emergencyContactPhone",
					label: "Nomor WhatsApp Kontak Darurat",
				},
				{ key: "emergencyContactRelation", label: "Hubungan Kontak Darurat" },
				{ key: "recommendedBy", label: "Pihak yang Merekomendasikan" },
				{ key: "recommenderName", label: "Nama yang Merekomendasikan" },
				{ key: "friendContacts", label: "Daftar Nomor Kawan / Rekan" },
			],
		},
	};

	const toggleRejectTab = (tabId: number) => {
		setSelectedRejectTabs((prev) =>
			prev.includes(tabId)
				? prev.filter((id) => id !== tabId)
				: [...prev, tabId],
		);
	};

	const toggleRejectField = (
		fieldKey: string,
		fieldLabel: string,
		tabIndex: number,
	) => {
		setSelectedRejectFields((prev) => {
			const exists = prev.find((f) => f.fieldKey === fieldKey);
			if (exists) {
				const updated = prev.filter((f) => f.fieldKey !== fieldKey);
				const hasOtherInTab = updated.some((f) => f.tabIndex === tabIndex);
				if (!hasOtherInTab) {
					setSelectedRejectTabs((tabs) => tabs.filter((t) => t !== tabIndex));
				}
				return updated;
			} else {
				if (!selectedRejectTabs.includes(tabIndex)) {
					setSelectedRejectTabs((tabs) => [...tabs, tabIndex]);
				}
				return [...prev, { fieldKey, fieldLabel, tabIndex, reason: "" }];
			}
		});
	};

	const updateFieldReason = (fieldKey: string, reason: string) => {
		setSelectedRejectFields((prev) =>
			prev.map((f) => (f.fieldKey === fieldKey ? { ...f, reason } : f)),
		);
	};

	const toggleSelectAllInActiveTab = () => {
		const currentFields = REJECTABLE_FIELDS[activeRejectTabModal]?.fields || [];
		const allSelected = currentFields.every((f) =>
			selectedRejectFields.some((item) => item.fieldKey === f.key),
		);

		if (allSelected) {
			const keysToRemove = new Set(currentFields.map((f) => f.key));
			setSelectedRejectFields((prev) =>
				prev.filter((item) => !keysToRemove.has(item.fieldKey)),
			);
			setSelectedRejectTabs((prev) =>
				prev.filter((t) => t !== activeRejectTabModal),
			);
		} else {
			const existingKeys = new Set(selectedRejectFields.map((f) => f.fieldKey));
			const toAdd = currentFields
				.filter((f) => !existingKeys.has(f.key))
				.map((f) => ({
					fieldKey: f.key,
					fieldLabel: f.label,
					tabIndex: activeRejectTabModal,
					reason: "",
				}));

			setSelectedRejectFields((prev) => [...prev, ...toAdd]);
			if (!selectedRejectTabs.includes(activeRejectTabModal)) {
				setSelectedRejectTabs((prev) => [...prev, activeRejectTabModal]);
			}
		}
	};

	const fetchData = async () => {
		try {
			const res = await authFetch(`/pmb/form-responses/${id}`);
			const result = await res.json();
			if (result.success) {
				setData(result.data);
			} else {
				toast.error(result.message || "Data pendaftar tidak ditemukan.");
				router.push("/dashboard/pmb");
			}
		} catch (error) {
			console.error(error);
			toast.error("Gagal mengambil data.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (id) {
			fetchData();
		}
	}, [id]);

	const handleApprove = async () => {
		setIsProcessing(true);
		try {
			const res = await authFetch(`/pmb/form-responses/${id}/approve`, {
				method: "PATCH",
			});
			const result = await res.json();
			if (result.success) {
				toast.success("Data pendaftar berhasil disetujui!");
				setIsApproveOpen(false);
				fetchData(); // reload data
			} else {
				toast.error(result.message || "Gagal menyetujui data");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleRejectSubmit = async () => {
		const derivedTabs = Array.from(
			new Set([
				...selectedRejectTabs,
				...selectedRejectFields.map((f) => f.tabIndex),
			]),
		);

		if (derivedTabs.length === 0 && selectedRejectFields.length === 0) {
			toast.error("Pilih minimal 1 tab atau kolom yang perlu diperbaiki!");
			return;
		}

		if (!rejectionNotes.trim() && selectedRejectFields.length === 0) {
			toast.error("Berikan catatan penolakan atau tandai kolom yang salah!");
			return;
		}

		setIsProcessing(true);
		try {
			const res = await authFetch(`/pmb/form-responses/${id}/reject`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					rejectionNotes:
						rejectionNotes.trim() ||
						"Mohon periksa dan perbaiki kolom bertanda merah pada formulir pendaftaran Anda.",
					rejectedTabs: derivedTabs,
					rejectedFields: selectedRejectFields,
				}),
			});
			const result = await res.json();
			if (result.success) {
				toast.success(
					"Data pendaftar berhasil ditolak dengan instruksi revisi",
				);
				setIsRejectOpen(false);
				setSelectedRejectTabs([]);
				setSelectedRejectFields([]);
				fetchData(); // reload data
			} else {
				toast.error(result.message || "Gagal menolak data");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsProcessing(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-screen pb-20">
				<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
			</div>
		);
	}

	if (!data) return null;

	const isPending = data.status === "PENDING";

	return (
		<div className="space-y-6 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
			{/* Header */}
			<div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						className="text-slate-500"
						onClick={() => router.push("/dashboard/pmb")}
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Kembali
					</Button>
					<div>
						<h1 className="text-xl font-bold text-slate-800">
							Detail Pendaftar: {data.name}
						</h1>
						<p className="text-sm text-slate-500 flex items-center gap-2">
							<FileText className="w-4 h-4" />
							ID Form: #{data.id} &bull;{" "}
							{new Date(data.submittedAt).toLocaleDateString("id-ID", {
								day: "numeric",
								month: "long",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
					</div>
				</div>
				<div>
					{data.status === "APPROVED" ? (
						<Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 text-sm">
							Disetujui
						</Badge>
					) : data.status === "REJECTED" ? (
						<Badge className="bg-rose-100 text-rose-700 border-none px-3 py-1 text-sm">
							Ditolak
						</Badge>
					) : (
						<Badge className="bg-amber-100 text-amber-700 border-none px-3 py-1 text-sm">
							Menunggu Review
						</Badge>
					)}
				</div>
			</div>

			{/* Rejection Alert */}
			{data.status === "REJECTED" && (
				<div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex gap-3.5 items-start">
					<XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
					<div className="space-y-3 w-full">
						<div>
							<h4 className="font-bold text-rose-900 text-sm">
								Data Pendaftar Berstatus Perlu Revisi
							</h4>
							{data.rejectionNotes && (
								<p className="text-sm text-rose-800 mt-1 font-medium bg-white/70 p-2.5 rounded-lg border border-rose-100">
									&ldquo;{data.rejectionNotes}&rdquo;
								</p>
							)}
						</div>

						{/* Detail Kolom yang Ditolak (Centang Merah Granular) */}
						{Array.isArray(data.rejectedFields) &&
							data.rejectedFields.length > 0 && (
								<div className="space-y-1.5 pt-1">
									<span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
										<AlertCircle className="w-3.5 h-3.5 text-rose-600" />
										Kolom Spesifik yang Harus Diperbaiki Mahasiswa (
										{data.rejectedFields.length}):
									</span>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
										{data.rejectedFields.map((field: any, idx: number) => (
											<div
												key={idx}
												className="p-2 bg-white rounded-lg border border-rose-200 text-xs text-rose-900 shadow-2xs"
											>
												<div className="flex items-center justify-between font-semibold">
													<span className="flex items-center gap-1.5">
														<XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
														{field.fieldLabel}
													</span>
													<Badge className="bg-rose-100 text-rose-800 border-none text-[10px] px-1.5 py-0">
														Tab {field.tabIndex + 1}
													</Badge>
												</div>
												{field.reason && (
													<p className="text-[11px] text-rose-700 mt-1 bg-rose-50/60 p-1.5 rounded">
														Catatan: {field.reason}
													</p>
												)}
											</div>
										))}
									</div>
								</div>
							)}

						{Array.isArray(data.rejectedTabs) &&
							data.rejectedTabs.length > 0 && (
								<div className="flex flex-wrap items-center gap-1.5 pt-1">
									<span className="text-xs text-rose-700 font-medium">
										Segmen Tab Terdampak:
									</span>
									{data.rejectedTabs.map((tabId: number) => (
										<Badge
											key={tabId}
											className="bg-rose-100 text-rose-800 border-rose-300 text-[11px]"
										>
											{TAB_OPTIONS[tabId]?.label || `Tab ${tabId + 1}`}
										</Badge>
									))}
								</div>
							)}
					</div>
				</div>
			)}

			{/* Approval Note */}
			{data.status === "APPROVED" && data.processor && (
				<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 items-start">
					<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
					<div>
						<h4 className="font-semibold text-emerald-800">Telah Disetujui</h4>
						<p className="text-sm text-emerald-700 mt-1">
							Disetujui oleh: {data.processor.fullName} pada{" "}
							{new Date(data.processedAt).toLocaleString("id-ID")}
						</p>
					</div>
				</div>
			)}

			{/* Main Content Layout */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Tab 1: Keterangan Mahasiswa */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
					<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2 border-b pb-2">
						<User className="w-5 h-5" /> Keterangan Mahasiswa
					</h3>
					{data.profilePhotoUrl && (
						<div className="flex justify-center py-4">
							<img
								src={data.profilePhotoUrl}
								alt="Foto Profil"
								className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 shadow-sm"
							/>
						</div>
					)}
					<div className="grid grid-cols-3 gap-y-3 text-sm">
						<span className="text-slate-500">Nama Lengkap</span>
						<span className="col-span-2 font-medium">{data.name}</span>
						<span className="text-slate-500">Nama Panggilan</span>
						<span className="col-span-2 font-medium">
							{data.nickname || "-"}
						</span>
						<span className="text-slate-500">Email</span>
						<span className="col-span-2 font-medium">{data.email || "-"}</span>
						<span className="text-slate-500">No. HP</span>
						<span className="col-span-2 font-medium">{data.phone || "-"}</span>
						<span className="text-slate-500">Kewarganegaraan</span>
						<span className="col-span-2 font-medium">
							{data.nationality || "-"}
						</span>
						<span className="text-slate-500">Tempat, Tgl Lahir</span>
						<span className="col-span-2 font-medium">
							{data.birthPlace},{" "}
							{data.birthDate
								? new Date(data.birthDate).toLocaleDateString("id-ID")
								: "-"}
						</span>
						<span className="text-slate-500">Jenis Kelamin</span>
						<span className="col-span-2 font-medium">{data.gender || "-"}</span>
						<span className="text-slate-500">Agama</span>
						<span className="col-span-2 font-medium">
							{data.religion || "-"}
						</span>
						<span className="text-slate-500">Tinggal Dengan</span>
						<span className="col-span-2 font-medium">
							{data.livingWith || "-"}
						</span>
						<span className="text-slate-500">Alamat Lengkap</span>
						<span className="col-span-2 font-medium">
							{data.addressStreet} No. {data.addressNo} RT {data.addressRt}/RW{" "}
							{data.addressRw}, {data.addressVillage}, {data.addressDistrict},{" "}
							{data.addressCity}, {data.addressProvince}
						</span>
					</div>
				</div>

				{/* Tab 2: Pendidikan */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
					<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2 border-b pb-2">
						Keterangan Pendidikan
					</h3>
					<div className="grid grid-cols-3 gap-y-3 text-sm">
						<span className="text-slate-500">Asal Sekolah</span>
						<span className="col-span-2 font-medium">
							{data.schoolOrigin || "-"}
						</span>
						<span className="text-slate-500">Jurusan Sekolah</span>
						<span className="col-span-2 font-medium">
							{data.schoolMajor || "-"}
						</span>
						<span className="text-slate-500">Tahun Lulus</span>
						<span className="col-span-2 font-medium">
							{data.graduationYear || "-"}
						</span>
						<span className="text-slate-500">Alamat Sekolah</span>
						<span className="col-span-2 font-medium">
							{data.schoolAddress || "-"}
						</span>

						<div className="col-span-3 border-t my-2" />

						<span className="text-slate-500">Program Diminati</span>
						<span className="col-span-2 font-medium">
							{data.program || "-"}
						</span>
						<span className="text-slate-500">Peminatan</span>
						<div className="col-span-2">
							<PeminatanBadge
								subProgram={data.subProgram}
								program={data.program}
							/>
						</div>
						<span className="text-slate-500">Pilihan Kelas</span>
						<span className="col-span-2 font-medium">
							{data.classType || "-"}
						</span>
						<span className="text-slate-500">Angkatan</span>
						<span className="col-span-2 font-medium">{data.cohort || "-"}</span>
						<span className="text-slate-500">Batch</span>
						<span className="col-span-2 font-medium">{data.batch || "-"}</span>
						<span className="text-slate-500">Tahun Ajaran</span>
						<span className="col-span-2 font-medium">
							{data.academicYear || "-"}
						</span>
					</div>
				</div>

				{/* Tab 3: Kesehatan */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
					<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2 border-b pb-2">
						Keterangan Kesehatan
					</h3>
					<div className="grid grid-cols-3 gap-y-3 text-sm">
						<span className="text-slate-500">Golongan Darah</span>
						<span className="col-span-2 font-medium">
							{data.bloodType || "-"}
						</span>
						<span className="text-slate-500">Tinggi Badan</span>
						<span className="col-span-2 font-medium">
							{data.height ? `${data.height} cm` : "-"}
						</span>
						<span className="text-slate-500">Berat Badan</span>
						<span className="col-span-2 font-medium">
							{data.weight ? `${data.weight} kg` : "-"}
						</span>
						<span className="text-slate-500">Ukuran Baju</span>
						<span className="col-span-2 font-medium">
							{data.clothingSize || "-"}
						</span>
						<span className="text-slate-500">Riwayat Penyakit</span>
						<span className="col-span-2 font-medium">
							{data.diseaseHistory || "-"}
						</span>
						<span className="text-slate-500">Penyakit Bawaan</span>
						<span className="col-span-2 font-medium">
							{data.congenitalDisease || "-"}
						</span>
					</div>
				</div>

				{/* Tab 4: Ayah */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
					<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2 border-b pb-2">
						Keterangan Ayah Kandung
					</h3>
					<div className="grid grid-cols-3 gap-y-3 text-sm">
						<span className="text-slate-500">Nama Ayah</span>
						<span className="col-span-2 font-medium">
							{data.ayahName || "-"}
						</span>
						<span className="text-slate-500">Keadaan</span>
						<span className="col-span-2 font-medium">
							{data.ayahStatus || "-"}
						</span>
						<span className="text-slate-500">Kewarganegaraan</span>
						<span className="col-span-2 font-medium">
							{data.ayahNationality || "-"}
						</span>
						<span className="text-slate-500">Tempat, Tgl Lahir</span>
						<span className="col-span-2 font-medium">
							{data.ayahBirthPlace || "-"},{" "}
							{data.ayahBirthDate
								? new Date(data.ayahBirthDate).toLocaleDateString("id-ID")
								: "-"}
						</span>
						<span className="text-slate-500">Agama</span>
						<span className="col-span-2 font-medium">
							{data.ayahReligion || "-"}
						</span>
						<span className="text-slate-500">Pendidikan Terakhir</span>
						<span className="col-span-2 font-medium">
							{data.ayahEducation || "-"}
						</span>
						<span className="text-slate-500">Pekerjaan</span>
						<span className="col-span-2 font-medium">
							{data.ayahJob || "-"}
						</span>
						<span className="text-slate-500">No. HP</span>
						<span className="col-span-2 font-medium">
							{data.ayahPhone || "-"}
						</span>
						<span className="text-slate-500">Email</span>
						<span className="col-span-2 font-medium">
							{data.ayahEmail || "-"}
						</span>
						<span className="text-slate-500">Alamat Lengkap</span>
						<span className="col-span-2 font-medium">
							{data.ayahAddress || "-"}
						</span>
					</div>
				</div>

				{/* Tab 5: Ibu */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
					<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2 border-b pb-2">
						Keterangan Ibu Kandung
					</h3>
					<div className="grid grid-cols-3 gap-y-3 text-sm">
						<span className="text-slate-500">Nama Ibu</span>
						<span className="col-span-2 font-medium">
							{data.ibuName || "-"}
						</span>
						<span className="text-slate-500">Keadaan</span>
						<span className="col-span-2 font-medium">
							{data.ibuStatus || "-"}
						</span>
						<span className="text-slate-500">Kewarganegaraan</span>
						<span className="col-span-2 font-medium">
							{data.ibuNationality || "-"}
						</span>
						<span className="text-slate-500">Tempat, Tgl Lahir</span>
						<span className="col-span-2 font-medium">
							{data.ibuBirthPlace || "-"},{" "}
							{data.ibuBirthDate
								? new Date(data.ibuBirthDate).toLocaleDateString("id-ID")
								: "-"}
						</span>
						<span className="text-slate-500">Agama</span>
						<span className="col-span-2 font-medium">
							{data.ibuReligion || "-"}
						</span>
						<span className="text-slate-500">Pendidikan Terakhir</span>
						<span className="col-span-2 font-medium">
							{data.ibuEducation || "-"}
						</span>
						<span className="text-slate-500">Pekerjaan</span>
						<span className="col-span-2 font-medium">{data.ibuJob || "-"}</span>
						<span className="text-slate-500">No. HP</span>
						<span className="col-span-2 font-medium">
							{data.ibuPhone || "-"}
						</span>
						<span className="text-slate-500">Email</span>
						<span className="col-span-2 font-medium">
							{data.ibuEmail || "-"}
						</span>
						<span className="text-slate-500">Alamat Lengkap</span>
						<span className="col-span-2 font-medium">
							{data.ibuAddress || "-"}
						</span>
					</div>
				</div>

				{/* Tab 6: Wali */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
					<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2 border-b pb-2">
						Keterangan Wali
					</h3>
					<div className="grid grid-cols-3 gap-y-3 text-sm">
						<span className="text-slate-500">Nama Wali</span>
						<span className="col-span-2 font-medium">
							{data.waliName || "-"}
						</span>
						<span className="text-slate-500">Hubungan</span>
						<span className="col-span-2 font-medium">
							{data.waliGuardianRelation || "-"}
						</span>
						<span className="text-slate-500">Kewarganegaraan</span>
						<span className="col-span-2 font-medium">
							{data.waliNationality || "-"}
						</span>
						<span className="text-slate-500">Tempat, Tgl Lahir</span>
						<span className="col-span-2 font-medium">
							{data.waliBirthPlace || "-"},{" "}
							{data.waliBirthDate
								? new Date(data.waliBirthDate).toLocaleDateString("id-ID")
								: "-"}
						</span>
						<span className="text-slate-500">Agama</span>
						<span className="col-span-2 font-medium">
							{data.waliReligion || "-"}
						</span>
						<span className="text-slate-500">Pendidikan Terakhir</span>
						<span className="col-span-2 font-medium">
							{data.waliEducation || "-"}
						</span>
						<span className="text-slate-500">Pekerjaan</span>
						<span className="col-span-2 font-medium">
							{data.waliJob || "-"}
						</span>
						<span className="text-slate-500">No. HP</span>
						<span className="col-span-2 font-medium">
							{data.waliPhone || "-"}
						</span>
						<span className="text-slate-500">Email</span>
						<span className="col-span-2 font-medium">
							{data.waliEmail || "-"}
						</span>
						<span className="text-slate-500">Alamat Lengkap</span>
						<span className="col-span-2 font-medium">
							{data.waliAddress || "-"}
						</span>
					</div>
				</div>

				{/* Tab 7: Informasi PMB & Referensi */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4 md:col-span-2">
					<div className="flex items-center justify-between border-b pb-2">
						<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2">
							<Building2 className="w-5 h-5" /> Informasi PMB & Referensi
						</h3>
						<Badge
							variant="outline"
							className="text-[10px] font-semibold text-slate-500 bg-white"
						>
							PMB
						</Badge>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
						<div className="grid grid-cols-3 gap-y-3">
							<span className="text-slate-500">Status Mahasiswa</span>
							<span className="col-span-2 font-medium">
								Calon Mahasiswa (Aktif)
							</span>

							<span className="text-slate-500">Negara Tujuan</span>
							<span className="col-span-2 font-medium">
								{data.subProgram === "Malaysia-Hospitality"
									? "Malaysia"
									: data.subProgram === "Taiwan-Hospitality"
										? "Taiwan"
										: data.subProgram === "Timur tengah-Barista"
											? "Timur Tengah"
											: "Indonesia"}
							</span>

							<span className="text-slate-500">Periode Keberangkatan</span>
							<span className="col-span-2 font-medium">
								{data.period || "-"}
							</span>

							<span className="text-slate-500">Rekomendasi</span>
							<span className="col-span-2 font-medium">
								{data.rekomendasi || "-"}
							</span>
						</div>

						<div className="grid grid-cols-3 gap-y-3">
							<span className="text-slate-500">Tim Visit</span>
							<span className="col-span-2 font-medium">
								{data.timVisit || "-"}
							</span>

							<span className="text-slate-500">Tim Sosialisasi</span>
							<span className="col-span-2 font-medium">
								{data.timSosialisasi || "-"}
							</span>

							<span className="text-slate-500">RO Referral</span>
							<span className="col-span-2 font-medium">
								{data.roReferral || "-"}
							</span>

							<span className="text-slate-500">Mitra Sponsor</span>
							<span className="col-span-2 font-medium">
								{data.mitraSponsor || "-"}
							</span>

							<span className="text-slate-500">Koordinator</span>
							<span className="col-span-2 font-medium">
								{data.koordinator || "-"}
							</span>
						</div>

						<div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
							<h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-3">
								Data Asal Referral Terstruktur (Integrasi Finance)
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
								<div className="grid grid-cols-3 gap-y-3">
									<span className="text-slate-500">Kategori Referral</span>
									<span className="col-span-2 font-medium">
										{formatReferralCategory(data.referralCategory)}
									</span>
									<span className="text-slate-500">Nama Institusi</span>
									<span className="col-span-2 font-medium">
										{data.referralInstitutionName || "-"}
									</span>
								</div>
								<div className="grid grid-cols-3 gap-y-3">
									<span className="text-slate-500">Nama Kontak PIC</span>
									<span className="col-span-2 font-medium">
										{data.referralContactName || "-"}
									</span>
									<span className="text-slate-500">No. WhatsApp PIC</span>
									<span className="col-span-2 font-medium">
										{data.referralContactPhone || "-"}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Tab 8: Kontak Darurat & Rekan Kawan */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-6 md:col-span-2">
					<div className="flex items-center justify-between border-b pb-2">
						<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2">
							<User className="w-5 h-5" /> Kontak Darurat & Daftar Rekan Kawan
						</h3>
						<Badge
							variant="outline"
							className="text-[10px] font-semibold text-slate-500 bg-white"
						>
							Tab 8
						</Badge>
					</div>

					{/* Kontak Darurat */}
					<div>
						<h4 className="font-semibold text-slate-800 text-sm mb-3">
							Kontak Darurat Mahasiswa
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border rounded-lg text-sm">
							<div>
								<span className="text-slate-500 block text-xs">
									Nama Lengkap
								</span>
								<span className="font-medium text-slate-800">
									{data.emergencyContactName || "-"}
								</span>
							</div>
							<div>
								<span className="text-slate-500 block text-xs">
									Nomor WhatsApp
								</span>
								<span className="font-medium text-slate-800">
									{data.emergencyContactPhone || "-"}
								</span>
							</div>
							<div>
								<span className="text-slate-500 block text-xs">Hubungan</span>
								<span className="font-medium text-slate-800">
									{data.emergencyContactRelation || "-"}
								</span>
							</div>
						</div>
					</div>

					{/* Pemberi Rekomendasi */}
					<div>
						<h4 className="font-semibold text-slate-800 text-sm mb-3">
							Pemberi Rekomendasi Pendaftaran
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border rounded-lg text-sm">
							<div>
								<span className="text-slate-500 block text-xs">
									Pihak yang Merekomendasikan
								</span>
								<span className="font-medium text-slate-800">
									{data.recommendedBy || "-"}
								</span>
							</div>
							<div>
								<span className="text-slate-500 block text-xs">
									Nama Lengkap yang Merekomendasikan
								</span>
								<span className="font-medium text-slate-800">
									{data.recommenderName || "-"}
								</span>
							</div>
						</div>
					</div>

					{/* Kontak Kawan */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<h4 className="font-semibold text-slate-800 text-sm">
								Daftar Kontak Kawan / Rekan (
								{Array.isArray(data.friendContacts)
									? data.friendContacts.length
									: 0}{" "}
								Kontak Tercatat)
							</h4>
							<span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0517B0] border border-blue-200">
								Min. 3 — Maks. 5
							</span>
						</div>
						{Array.isArray(data.friendContacts) &&
						data.friendContacts.length > 0 ? (
							<div className="border rounded-lg overflow-hidden">
								<table className="w-full text-sm">
									<thead className="bg-slate-50 border-b text-xs font-semibold text-slate-600">
										<tr>
											<th className="py-2.5 px-4 text-left">No</th>
											<th className="py-2.5 px-4 text-left">Nama Kawan</th>
											<th className="py-2.5 px-4 text-left">Nomor WhatsApp</th>
											<th className="py-2.5 px-4 text-left">
												Asal Sekolah / Hubungan
											</th>
										</tr>
									</thead>
									<tbody className="divide-y text-slate-700">
										{data.friendContacts.map((friend: any, index: number) => (
											<tr key={index} className="hover:bg-slate-50/50">
												<td className="py-2.5 px-4 font-mono text-xs text-slate-400">
													{index + 1}
												</td>
												<td className="py-2.5 px-4 font-medium">
													{friend.name || "-"}
												</td>
												<td className="py-2.5 px-4">{friend.phone || "-"}</td>
												<td className="py-2.5 px-4">
													{friend.schoolOrRelation || "-"}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-lg">
								Belum ada daftar kontak kawan yang tercatat.
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Actions for PENDING status */}
			{isPending && (
				<div className="bg-white border rounded-xl p-6 shadow-sm sticky bottom-6 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
					<div>
						<h4 className="font-semibold">Tinjau Data Pendaftar</h4>
						<p className="text-sm text-slate-500">
							Pastikan data lengkap sebelum disetujui.
						</p>
					</div>
					<div className="flex gap-3">
						<Button
							variant="outline"
							className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-11 px-6"
							onClick={() => setIsRejectOpen(true)}
						>
							<XCircle className="w-5 h-5 mr-2" />
							Tolak
						</Button>
						<Button
							className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8 shadow-md"
							onClick={() => setIsApproveOpen(true)}
							disabled={isProcessing}
						>
							{isProcessing ? (
								<>
									<Loader2 className="w-5 h-5 mr-2 animate-spin" />
									Memproses...
								</>
							) : (
								<>
									<CheckCircle2 className="w-5 h-5 mr-2" />
									Setujui & Daftarkan
								</>
							)}
						</Button>
					</div>
				</div>
			)}

			{/* Modal Setuju */}
			<Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Setujui Pendaftar</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-4">
						<p className="text-slate-600">
							Apakah Anda yakin ingin menyetujui data ini? Mahasiswa baru akan
							otomatis ditambahkan ke sistem akademik.
						</p>
						<div className="flex justify-end gap-3 pt-4">
							<Button variant="outline" onClick={() => setIsApproveOpen(false)}>
								Batal
							</Button>
							<Button
								className="bg-emerald-600 hover:bg-emerald-700 text-white"
								onClick={handleApprove}
								disabled={isProcessing}
							>
								{isProcessing ? "Memproses..." : "Konfirmasi Setujui"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Modal Tolak dengan Penandaan Kolom Granular (Task No. 1) */}
			<Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
				<DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl border-slate-200">
					{/* Modal Header */}
					<DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
								<XCircle className="w-6 h-6" />
							</div>
							<div>
								<DialogTitle className="text-lg font-bold text-slate-900 leading-tight">
									Tolak & Tandai Bagian yang Perlu Direvisi
								</DialogTitle>
								<p className="text-xs text-slate-500 mt-1">
									Pilih tab dan centang kolom yang bermasalah agar mahasiswa
									tahu persis bagian mana yang perlu diperbaiki (Centang Merah).
								</p>
							</div>
						</div>
					</DialogHeader>

					{/* Modal Body (Scrollable) */}
					<div className="flex-1 overflow-y-auto p-6 space-y-6">
						{/* Step 1: Pilih Tab & Centang Kolom */}
						<div>
							<div className="flex items-center justify-between mb-2.5">
								<label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
									<span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
										1
									</span>
									<span>Pilih Tab & Centang Kolom yang Salah</span>
								</label>
								<span className="text-[11px] text-slate-500 font-medium">
									{selectedRejectFields.length} kolom dipilih
								</span>
							</div>

							{/* Tab Bar Selector (Grid 4 col di mobile, 8 col di desktop - Tidak akan terpotong!) */}
							<div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200/80">
								{TAB_OPTIONS.map((t) => {
									const fieldCountInTab = selectedRejectFields.filter(
										(f) => f.tabIndex === t.id,
									).length;
									const isTabSelected = selectedRejectTabs.includes(t.id);
									const isActiveTab = activeRejectTabModal === t.id;

									return (
										<button
											key={t.id}
											type="button"
											onClick={() => setActiveRejectTabModal(t.id)}
											className={`relative text-xs py-2 px-1 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
												isActiveTab
													? "bg-[#0517B0] text-white shadow-sm ring-2 ring-[#0517B0]/20"
													: isTabSelected
														? "bg-rose-100 text-rose-800 border border-rose-300 font-bold"
														: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/70"
											}`}
											title={t.label}
										>
											<span className="text-[11px] leading-tight truncate max-w-full">
												Tab {t.id + 1}
											</span>
											{fieldCountInTab > 0 && (
												<span
													className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
														isActiveTab
															? "bg-white text-[#0517B0]"
															: "bg-rose-600 text-white"
													}`}
												>
													{fieldCountInTab}
												</span>
											)}
										</button>
									);
								})}
							</div>

							{/* Checklist Kolom per Tab Aktif */}
							<div className="mt-3 bg-slate-50/70 rounded-xl border border-slate-200 p-4">
								<div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
									<div>
										<h5 className="text-xs font-bold text-slate-900">
											{TAB_OPTIONS[activeRejectTabModal]?.label}
										</h5>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Centang kolom yang perlu diperbaiki oleh mahasiswa:
										</p>
									</div>

									{/* Tombol Pilih Semua */}
									<button
										type="button"
										onClick={toggleSelectAllInActiveTab}
										className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
									>
										{REJECTABLE_FIELDS[activeRejectTabModal]?.fields.every(
											(f) =>
												selectedRejectFields.some(
													(item) => item.fieldKey === f.key,
												),
										)
											? "Batal Pilih Semua"
											: "Pilih Semua di Tab Ini"}
									</button>
								</div>

								<div className="space-y-2 max-h-60 overflow-y-auto pr-1">
									{REJECTABLE_FIELDS[activeRejectTabModal]?.fields.map((f) => {
										const currentField = selectedRejectFields.find(
											(item) => item.fieldKey === f.key,
										);
										const isChecked = Boolean(currentField);

										return (
											<div
												key={f.key}
												className={`p-3 rounded-xl border transition-all ${
													isChecked
														? "bg-rose-50/90 border-rose-300 ring-1 ring-rose-200 shadow-2xs"
														: "bg-white border-slate-200 hover:border-slate-300"
												}`}
											>
												<label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-800">
													<input
														type="checkbox"
														checked={isChecked}
														onChange={() =>
															toggleRejectField(
																f.key,
																f.label,
																activeRejectTabModal,
															)
														}
														className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
													/>
													<span
														className={`flex-1 ${isChecked ? "font-bold text-rose-950" : "text-slate-700"}`}
													>
														{f.label}
													</span>
													{isChecked && (
														<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
															Revisi
														</span>
													)}
												</label>

												{/* Input Catatan Khusus per Kolom jika dicentang */}
												{isChecked && (
													<div className="mt-2.5 pl-6">
														<Input
															placeholder="Catatan koreksi (misal: 'Foto wajib berpakaian rapi', 'No WA tidak aktif')"
															value={currentField?.reason || ""}
															onChange={(e) =>
																updateFieldReason(f.key, e.target.value)
															}
															className="h-8 text-xs bg-white border-rose-200 focus-visible:ring-rose-400 placeholder:text-slate-400 text-slate-800"
														/>
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</div>

						{/* Ringkasan Kolom yang Dipilih */}
						{selectedRejectFields.length > 0 && (
							<div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
										<XCircle className="w-3.5 h-3.5 text-rose-600" />
										<span>
											Total Kolom Diberi Centang Merah (
											{selectedRejectFields.length}):
										</span>
									</span>
									<button
										type="button"
										onClick={() => {
											setSelectedRejectFields([]);
											setSelectedRejectTabs([]);
										}}
										className="text-[11px] font-medium text-rose-700 hover:text-rose-900 underline cursor-pointer"
									>
										Hapus Semua Pilihan
									</button>
								</div>
								<div className="flex flex-wrap gap-1.5">
									{selectedRejectFields.map((f) => (
										<span
											key={f.fieldKey}
											className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white text-rose-900 px-2.5 py-1 rounded-lg border border-rose-300 shadow-2xs"
										>
											<span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
											<span>{f.fieldLabel}</span>
											<span className="text-[10px] text-rose-600 font-normal">
												(Tab {f.tabIndex + 1})
											</span>
											<button
												type="button"
												onClick={() =>
													toggleRejectField(
														f.fieldKey,
														f.fieldLabel,
														f.tabIndex,
													)
												}
												className="ml-1 text-slate-400 hover:text-rose-700 font-bold cursor-pointer"
												title="Hapus kolom ini"
											>
												&times;
											</button>
										</span>
									))}
								</div>
							</div>
						)}

						{/* Step 2: Catatan Umum Penolakan */}
						<div className="space-y-1.5">
							<label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
								<span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
									2
								</span>
								<span>Catatan Arahan Umum untuk Mahasiswa</span>
								<span className="text-rose-500 font-bold">*</span>
							</label>
							<Textarea
								placeholder="Tuliskan arahan umum agar mahasiswa memahami apa yang perlu dilakukan..."
								value={rejectionNotes}
								onChange={(e) => setRejectionNotes(e.target.value)}
								rows={3}
								className="text-xs bg-white text-slate-800"
							/>
						</div>
					</div>

					{/* Modal Footer (Sticky at bottom, high contrast) */}
					<div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
						<div>
							<span className="text-xs font-semibold text-slate-600">
								{selectedRejectFields.length > 0 ? (
									<span className="text-rose-700 font-bold">
										{selectedRejectFields.length} kolom ditandai revisi
									</span>
								) : (
									<span className="text-slate-500">
										Belum ada kolom ditandai
									</span>
								)}
							</span>
						</div>

						<div className="flex items-center gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsRejectOpen(false)}
								className="border-slate-300 text-slate-700 hover:bg-slate-100 font-medium h-10 px-4 cursor-pointer"
							>
								Batal
							</Button>
							<Button
								type="button"
								onClick={handleRejectSubmit}
								disabled={isProcessing}
								className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 !text-white font-semibold h-10 px-5 shadow-sm gap-2 transition-all cursor-pointer"
							>
								{isProcessing ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin text-white" />
										<span className="text-white">Menyimpan Penolakan...</span>
									</>
								) : (
									<>
										<XCircle className="w-4 h-4 text-white" />
										<span className="text-white font-semibold">
											Kirim Penolakan & Instruksi Revisi
										</span>
									</>
								)}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
