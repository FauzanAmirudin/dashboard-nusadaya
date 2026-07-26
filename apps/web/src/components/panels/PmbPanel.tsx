"use client";

import {
	AlertCircle,
	Check,
	CheckCircle,
	CheckCircle2,
	Clock,
	DollarSign,
	Edit2,
	Eye,
	FileText,
	Loader2,
	Plus,
	Save,
	Trash2,
	UploadCloud,
	Users,
	X,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

interface PmbPanelProps {
	studentId: number;
	pmbData: any;
	onUpdate: () => void;
}

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

export function PmbPanel({ studentId, pmbData, onUpdate }: PmbPanelProps) {
	const { user } = useAuthStore();
	const isPmbAdmin = user?.role === "pmb" || user?.role === "superadmin";
	const isSuperadmin = user?.role === "superadmin";
	const canEdit = isPmbAdmin || isSuperadmin;

	const [isSaving, setIsSaving] = useState(false);
	const [notes, setNotes] = useState(pmbData?.notes || "");
	const [loadingItem, setLoadingItem] = useState<string | null>(null);

	const [localChecks, setLocalChecks] = useState({
		formReceived: !!pmbData?.formReceived,
		documentsComplete: !!pmbData?.documentsComplete,
		dataInputted: !!pmbData?.dataInputted,
		initialFollowUp: !!pmbData?.initialFollowUp,
	});

	const [acquisition, setAcquisition] = useState({
		rekomendasi: pmbData?.rekomendasi || "",
		timVisit: pmbData?.timVisit || "",
		timSosialisasi: pmbData?.timSosialisasi || "",
		roReferral: pmbData?.roReferral || "",
		mitraSponsor: pmbData?.mitraSponsor || "",
		koordinator: pmbData?.koordinator || "",
	});

	const [paymentPlan, setPaymentPlan] = useState({
		totalBiaya: pmbData?.paymentPlan?.totalBiaya || 0,
		pendaftaranDp: pmbData?.paymentPlan?.pendaftaranDp || 0,
		totalDp: pmbData?.paymentPlan?.totalDp || 0,
		pembayaranAwalDp: pmbData?.paymentPlan?.pembayaranAwalDp || 0,
		statusDp: !!pmbData?.paymentPlan?.statusDp,
		janjiTahap2: pmbData?.paymentPlan?.janjiTahap2
			? new Date(pmbData.paymentPlan.janjiTahap2).toISOString().slice(0, 10)
			: "",
		janjiTahap2Nominal: pmbData?.paymentPlan?.janjiTahap2Nominal || 0,
		janjiTahap2Notes: pmbData?.paymentPlan?.janjiTahap2Notes || "",
		janjiTahap3: pmbData?.paymentPlan?.janjiTahap3
			? new Date(pmbData.paymentPlan.janjiTahap3).toISOString().slice(0, 10)
			: "",
		janjiTahap3Nominal: pmbData?.paymentPlan?.janjiTahap3Nominal || 0,
		janjiTahap3Notes: pmbData?.paymentPlan?.janjiTahap3Notes || "",
		pengajuanDanaTalangan: pmbData?.paymentPlan?.pengajuanDanaTalangan || "",
	});

	const [documents, setDocuments] = useState<Record<string, DocFile[]>>({});
	const [fees, setFees] = useState<any[]>([]);
	const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
	const [isEditingMetrics, setIsEditingMetrics] = useState({
		totalBiaya: false,
		pendaftaranDp: false,
		totalDp: false,
		pembayaranAwalDp: false,
	});
	const [isEditingTahap2, setIsEditingTahap2] = useState(
		!pmbData?.paymentPlan?.janjiTahap2,
	);
	const [isEditingTahap3, setIsEditingTahap3] = useState(
		!pmbData?.paymentPlan?.janjiTahap3,
	);
	const [isEditingDanaTalangan, setIsEditingDanaTalangan] = useState(false);
	const [financeData, setFinanceData] = useState<any>(null);
	const [newFee, setNewFee] = useState({
		channel: "",
		namaReferral: "",
		nominalFee: 0,
		statusPencairan: "belum",
		tanggalCair: "",
	});

	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	useEffect(() => {
		setLocalChecks({
			formReceived: !!pmbData?.formReceived,
			documentsComplete: !!pmbData?.documentsComplete,
			dataInputted: !!pmbData?.dataInputted,
			initialFollowUp: !!pmbData?.initialFollowUp,
		});
		setNotes(pmbData?.notes || "");
		setAcquisition({
			rekomendasi: pmbData?.rekomendasi || "",
			timVisit: pmbData?.timVisit || "",
			timSosialisasi: pmbData?.timSosialisasi || "",
			roReferral: pmbData?.roReferral || "",
			mitraSponsor: pmbData?.mitraSponsor || "",
			koordinator: pmbData?.koordinator || "",
		});
		if (pmbData?.paymentPlan) {
			setPaymentPlan({
				totalBiaya: pmbData.paymentPlan.totalBiaya || 0,
				pendaftaranDp: pmbData.paymentPlan.pendaftaranDp || 0,
				totalDp: pmbData.paymentPlan.totalDp || 0,
				pembayaranAwalDp: pmbData.paymentPlan.pembayaranAwalDp || 0,
				statusDp: !!pmbData.paymentPlan.statusDp,
				janjiTahap2: pmbData.paymentPlan.janjiTahap2
					? new Date(pmbData.paymentPlan.janjiTahap2).toISOString().slice(0, 10)
					: "",
				janjiTahap2Nominal: pmbData.paymentPlan.janjiTahap2Nominal || 0,
				janjiTahap2Notes: pmbData.paymentPlan.janjiTahap2Notes || "",
				janjiTahap3: pmbData.paymentPlan.janjiTahap3
					? new Date(pmbData.paymentPlan.janjiTahap3).toISOString().slice(0, 10)
					: "",
				janjiTahap3Nominal: pmbData.paymentPlan.janjiTahap3Nominal || 0,
				janjiTahap3Notes: pmbData.paymentPlan.janjiTahap3Notes || "",
				pengajuanDanaTalangan: pmbData.paymentPlan.pengajuanDanaTalangan || "",
			});
			setIsEditingTahap2(!pmbData.paymentPlan.janjiTahap2);
			setIsEditingTahap3(!pmbData.paymentPlan.janjiTahap3);
		}
	}, [pmbData]);

	const fetchDocuments = async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/documents`,
				{
					headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success) {
					setDocuments(json.data);
				}
			}
		} catch (error) {
			console.error("Failed to fetch PMB documents", error);
		}
	};

	const fetchFees = async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/fee-disbursements`,
				{
					headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success) setFees(json.data);
			}
		} catch (error) {
			console.error("Failed to fetch fees", error);
		}
	};

	const fetchFinanceData = async () => {
		try {
			const res = await fetch(`${API_URL}/students/${studentId}/finance`, {
				headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
			});
			if (res.ok) {
				const json = await res.json();
				if (json.success) setFinanceData(json.data);
			}
		} catch (e) {
			console.error("Failed to fetch finance data in PMB Panel", e);
		}
	};

	useEffect(() => {
		fetchDocuments();
		fetchFees();
		fetchFinanceData();
	}, [studentId]);

	const checklist = [
		{
			id: "formReceived",
			documentKey: "form_received",
			label: "Formulir Masuk",
			desc: "Formulir pendaftaran telah diterima",
			checked: localChecks.formReceived,
		},
		{
			id: "documentsComplete",
			documentKey: "documents_complete",
			label: "Berkas Lengkap",
			desc: "Semua dokumen fisik tersedia",
			checked: localChecks.documentsComplete,
		},
		{
			id: "dataInputted",
			documentKey: "data_inputted",
			label: "Input Data Awal",
			desc: "Data mahasiswa telah diinput ke sistem",
			checked: localChecks.dataInputted,
		},
		{
			id: "initialFollowUp",
			documentKey: "initial_follow_up",
			label: "Follow Up Awal",
			desc: "Kontak awal dengan mahasiswa/orang tua selesai",
			checked: localChecks.initialFollowUp,
		},
	];

	const completedCount = Object.values(localChecks).filter(Boolean).length;
	let statusBadge = (
		<Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">
			🔴 TIDAK AMAN
		</Badge>
	);
	if (completedCount === 4) {
		statusBadge = (
			<Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
				🟢 AMAN
			</Badge>
		);
	} else if (completedCount >= 2) {
		statusBadge = (
			<Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
				🟡 PERLU PERHATIAN
			</Badge>
		);
	}

	const handleCheckboxChange = async (id: string, checked: boolean) => {
		if (!canEdit) return;

		const prevState = { ...localChecks };
		setLocalChecks((prev) => ({ ...prev, [id]: checked }));
		setLoadingItem(id);

		const payload = {
			...prevState,
			[id]: checked,
			notes: notes,
			rekomendasi: acquisition.rekomendasi,
			timVisit: acquisition.timVisit,
			timSosialisasi: acquisition.timSosialisasi,
			roReferral: acquisition.roReferral,
		};

		const { error } = await api.students[studentId.toString()].pmb.put(payload);
		if (error) {
			setLocalChecks(prevState);
			toast.error("Gagal menyimpan perubahan");
		} else {
			toast.success("Berhasil disimpan");
			onUpdate();
		}
		setLoadingItem(null);
	};

	const saveAcquisitionAndNotes = async () => {
		if (!canEdit) return;
		setIsSaving(true);
		const payload = {
			...localChecks,
			notes: notes,
			rekomendasi: acquisition.rekomendasi,
			timVisit: acquisition.timVisit,
			timSosialisasi: acquisition.timSosialisasi,
			roReferral: acquisition.roReferral,
			mitraSponsor: acquisition.mitraSponsor,
			koordinator: acquisition.koordinator,
		};
		const { error } = await api.students[studentId.toString()].pmb.put(payload);
		if (error) {
			toast.error("Gagal menyimpan data");
		} else {
			toast.success("Data berhasil disimpan");
			onUpdate();
		}
		setIsSaving(false);
	};

	const savePaymentPlan = async () => {
		if (!canEdit) return;
		setIsSaving(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/payment-plan`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${useAuthStore.getState().token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...paymentPlan,
						totalBiaya: Number(paymentPlan.totalBiaya),
						pendaftaranDp: Number(paymentPlan.pendaftaranDp),
						totalDp: Number(paymentPlan.totalDp),
						pembayaranAwalDp: Number(paymentPlan.pembayaranAwalDp),
						janjiTahap2Nominal: Number(paymentPlan.janjiTahap2Nominal),
						janjiTahap3Nominal: Number(paymentPlan.janjiTahap3Nominal),
					}),
				},
			);
			if (res.ok) {
				toast.success("Skema Keuangan berhasil disimpan");
				onUpdate();
			} else {
				toast.error("Gagal menyimpan Skema Keuangan");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
		setIsSaving(false);
	};

	const handleAddFee = async () => {
		if (!canEdit) return;
		if (!newFee.channel || !newFee.namaReferral) {
			toast.error("Mohon lengkapi channel dan nama referral");
			return;
		}

		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/fee-disbursements`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${useAuthStore.getState().token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...newFee,
						nominalFee: Number(newFee.nominalFee),
					}),
				},
			);
			if (res.ok) {
				toast.success("Fee berhasil ditambahkan");
				setIsFeeModalOpen(false);
				setNewFee({
					channel: "",
					namaReferral: "",
					nominalFee: 0,
					statusPencairan: "belum",
					tanggalCair: "",
				});
				fetchFees();
			} else {
				toast.error("Gagal menambahkan fee");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
	};

	const handleDeleteFee = async (feeId: number) => {
		if (!isSuperadmin) {
			toast.error("Hanya superadmin yang dapat menghapus fee");
			return;
		}
		if (!confirm("Apakah Anda yakin ingin menghapus fee ini?")) return;

		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/fee-disbursements/${feeId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
				},
			);
			if (res.ok) {
				toast.success("Fee berhasil dihapus");
				fetchFees();
			} else {
				toast.error("Gagal menghapus fee");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
	};

	const handleAcc = async () => {
		if (!isPmbAdmin) return;
		const { error } = await api.students[studentId.toString()].pmb.acc.post({});
		if (error) {
			toast.error("Gagal memberikan ACC");
		} else {
			toast.success("ACC PMB berhasil dicatat");
			onUpdate();
		}
	};

	const handleCancelAcc = async () => {
		if (!isPmbAdmin) return;
		setIsSaving(true);
		const { error } = await api.students[studentId.toString()].pmb.acc.delete();
		if (error) {
			toast.error("Gagal membatalkan ACC");
		} else {
			toast.success("ACC PMB berhasil dibatalkan");
			onUpdate();
		}
		setIsSaving(false);
	};

	const formatRupiah = (val: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(val || 0);
	};

	const totalCair = fees
		.filter((f) => f.statusPencairan === "sudah")
		.reduce((acc, curr) => acc + curr.nominalFee, 0);
	const totalProses = fees
		.filter((f) => f.statusPencairan === "proses")
		.reduce((acc, curr) => acc + curr.nominalFee, 0);
	const totalBelum = fees
		.filter((f) => f.statusPencairan === "belum")
		.reduce((acc, curr) => acc + curr.nominalFee, 0);

	return (
		<TooltipProvider>
			<div>
				{/* Header */}
				<div className="border-b border-slate-200 pb-4 mb-6">
					<div className="flex justify-between items-center">
						<div>
							<div className="flex items-center gap-3">
								<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
									<FileText className="w-5 h-5 text-[#0517B0]" />
									PMB — Penerimaan Mahasiswa Baru
								</CardTitle>
								{isSuperadmin && !isPmbAdmin && (
									<Badge
										variant="outline"
										className="text-slate-400 border-slate-300"
									>
										👁 Mode Lihat Saja
									</Badge>
								)}
							</div>
							<p className="text-sm text-slate-500 mt-1">
								Dikelola oleh: Admin PMB
							</p>
						</div>
						<div className="flex items-center gap-3">
							<span className="text-sm font-medium text-slate-500">
								{completedCount}/4
							</span>
							{statusBadge}
						</div>
					</div>
				</div>

				<div className="py-6 space-y-6">
					{/* Data Akuisisi (Ringkasan) */}
					<Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
						<CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
							<CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
								<Users className="w-4 h-4 text-[#0517B0]" />
								Data Akuisisi
							</CardTitle>
						</CardHeader>
						<CardContent className="p-5">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
								<div className="space-y-1">
									<Label className="text-xs text-slate-500 font-semibold uppercase">
										Rekomendasi
									</Label>
									<Select
										disabled={!canEdit}
										value={acquisition.rekomendasi}
										onValueChange={(val) =>
											setAcquisition({ ...acquisition, rekomendasi: val })
										}
									>
										<SelectTrigger className="w-full bg-slate-50 border-slate-200 h-9">
											<SelectValue placeholder="Pilih Channel" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Pendamping">Pendamping</SelectItem>
											<SelectItem value="MoU Sekolah">MoU Sekolah</SelectItem>
											<SelectItem value="BKK">BKK</SelectItem>
											<SelectItem value="FKKS">FKKS</SelectItem>
											<SelectItem value="RO Alumni">RO Alumni</SelectItem>
											<SelectItem value="Staff/Team">Staff/Team</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<Label className="text-xs text-slate-500 font-semibold uppercase">
										RO Mahasiswa/Alumni/Staff
									</Label>
									<Input
										disabled={!canEdit}
										value={acquisition.roReferral}
										onChange={(e) =>
											setAcquisition({
												...acquisition,
												roReferral: e.target.value,
											})
										}
										className="h-9 bg-slate-50 border-slate-200"
										placeholder="Nama Referal RO"
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs text-slate-500 font-semibold uppercase">
										Tim Visit
									</Label>
									<Input
										disabled={!canEdit}
										value={acquisition.timVisit}
										onChange={(e) =>
											setAcquisition({
												...acquisition,
												timVisit: e.target.value,
											})
										}
										className="h-9 bg-slate-50 border-slate-200"
										placeholder="Nama Tim Visit"
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs text-slate-500 font-semibold uppercase">
										Tim Sosialisasi
									</Label>
									<Input
										disabled={!canEdit}
										value={acquisition.timSosialisasi}
										onChange={(e) =>
											setAcquisition({
												...acquisition,
												timSosialisasi: e.target.value,
											})
										}
										className="h-9 bg-slate-50 border-slate-200"
										placeholder="Nama Tim Sosialisasi"
									/>
								</div>
							</div>

							<div className="mt-4 pt-4 border-t border-slate-100">
								<h4 className="font-semibold text-xs text-slate-500 uppercase mb-4 flex items-center gap-2">
									Data Mitra (Opsional)
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
									<div className="space-y-1">
										<Label className="text-xs text-slate-500 font-semibold uppercase">
											Mitra / Sponsor
										</Label>
										<Input
											disabled={!canEdit}
											value={acquisition.mitraSponsor}
											onChange={(e) =>
												setAcquisition({
													...acquisition,
													mitraSponsor: e.target.value,
												})
											}
											className="h-9 bg-slate-50 border-slate-200"
											placeholder="Nama mitra atau sponsor"
										/>
									</div>
									<div className="space-y-1">
										<Label className="text-xs text-slate-500 font-semibold uppercase">
											Koordinator
										</Label>
										<Input
											disabled={!canEdit}
											value={acquisition.koordinator}
											onChange={(e) =>
												setAcquisition({
													...acquisition,
													koordinator: e.target.value,
												})
											}
											className="h-9 bg-slate-50 border-slate-200"
											placeholder="Nama koordinator mitra"
										/>
									</div>
								</div>
							</div>

							{canEdit && (
								<div className="flex justify-end">
									<Button
										variant="outline"
										size="sm"
										onClick={saveAcquisitionAndNotes}
										disabled={isSaving}
										className="bg-blue-50 border-[#0517B0]/30 text-[#0517B0] hover:bg-blue-100"
									>
										{isSaving ? "Menyimpan..." : "Simpan Data Akuisisi"}
									</Button>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Checklist Kelengkapan Awal */}
					<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
						<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Checklist Kelengkapan Awal
							</h3>
						</div>
						<div className="p-5 space-y-3">
							{checklist.map((item) => {
								return (
									<div
										key={item.id}
										className="flex flex-col rounded-lg border bg-white overflow-hidden border-slate-200"
									>
										<div
											className={`flex items-center gap-4 p-4 transition-colors ${
												item.checked
													? "bg-emerald-50 border-emerald-200"
													: "bg-slate-50 border-slate-200"
											}`}
										>
											<Checkbox
												id={item.id}
												checked={item.checked}
												onCheckedChange={(checked) =>
													handleCheckboxChange(item.id, checked === true)
												}
												disabled={!canEdit || loadingItem === item.id}
												className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
											/>
											<label
												htmlFor={item.id}
												className="flex-1 cursor-pointer block"
											>
												<div className="text-sm font-bold text-slate-800 flex items-center gap-2">
													{item.label}
													{loadingItem === item.id && (
														<Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
													)}
												</div>
												<p className="text-xs text-slate-500 mt-0.5">
													{item.desc}
												</p>
											</label>
											<div>
												{item.checked ? (
													<Tooltip>
														<TooltipTrigger>
															<CheckCircle className="w-5 h-5 text-emerald-500" />
														</TooltipTrigger>
														<TooltipContent>
															Terakhir diperbarui:{" "}
															{pmbData?.updatedAt
																? new Date(pmbData.updatedAt).toLocaleString(
																		"id-ID",
																	)
																: "-"}
														</TooltipContent>
													</Tooltip>
												) : (
													<Clock className="w-5 h-5 text-slate-400" />
												)}
											</div>
										</div>
										<div className="bg-slate-50/50 p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
											<p className="text-xs text-slate-500 font-medium whitespace-nowrap mt-2">
												Dokumen Terkait:
											</p>
											<div className="w-full">
												<DocumentUpload
													studentId={studentId}
													panel="pmb"
													documentKey={item.documentKey}
													canEdit={canEdit}
													onUploadSuccess={fetchDocuments}
												/>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Dokumen Mahasiswa (Slot Terpisah) */}
					<Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
						<CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
							<CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Dokumen Mahasiswa
							</CardTitle>
						</CardHeader>
						<CardContent className="p-5">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{[
									{ key: "ktp", label: "Kartu Tanda Penduduk (KTP)" },
									{ key: "kartu_keluarga", label: "Kartu Keluarga (KK)" },
									{ key: "cv", label: "Curriculum Vitae (CV)" },
									{ key: "ijazah", label: "Ijazah Terakhir" },
									{ key: "paspor_depan", label: "Paspor (Halaman Depan)" },
									{ key: "paspor_visa", label: "Paspor (Halaman Visa)" },
								].map((docType) => (
									<div
										key={docType.key}
										className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col justify-between"
									>
										<div className="mb-2">
											<h4 className="text-xs font-bold text-slate-800">
												{docType.label}
											</h4>
										</div>
										<DocumentUpload
											studentId={studentId}
											panel="pmb"
											documentKey={docType.key}
											canEdit={canEdit}
											onUploadSuccess={fetchDocuments}
										/>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Skema Keuangan PMB */}
					<Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
						<CardHeader className="bg-slate-50 border-b border-slate-200 py-4 flex flex-row items-center justify-between">
							<CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
								<DollarSign className="w-4 h-4 text-emerald-600" />
								Skema Keuangan PMB
							</CardTitle>
							<Badge
								variant={paymentPlan.statusDp ? "default" : "destructive"}
								className={
									paymentPlan.statusDp
										? "bg-emerald-500 hover:bg-emerald-600"
										: ""
								}
							>
								{paymentPlan.statusDp ? "LUNAS DP" : "BELUM LUNAS"}
							</Badge>
						</CardHeader>
						<CardContent className="p-5">
							{/* Ringkasan Keuangan (Card Metrics) */}
							<div className="mb-6">
								<h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
									Ringkasan Keuangan
								</h3>
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
									{/* Status Pembayaran Edit */}
									<div className="border border-slate-200 rounded-lg p-4 flex flex-col justify-center items-center bg-slate-50/50">
										<span className="text-xs font-semibold text-slate-500 mb-2">
											Status Pembayaran
										</span>
										<div className="flex items-center gap-2">
											<Checkbox
												checked={paymentPlan.statusDp}
												onCheckedChange={(val) =>
													setPaymentPlan({
														...paymentPlan,
														statusDp: val === true,
													})
												}
												disabled={!canEdit}
												className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
											/>
											<Label
												className={`text-sm font-bold ${paymentPlan.statusDp ? "text-emerald-600" : "text-slate-600"}`}
											>
												{paymentPlan.statusDp ? "LUNAS DP" : "BELUM LUNAS"}
											</Label>
										</div>
									</div>

									{/* Total Biaya */}
									<div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-center group relative">
										<div className="flex items-center justify-between mb-2">
											<span className="text-xs font-semibold text-slate-500">
												Total Biaya
											</span>
											{canEdit && (
												<button
													onClick={() =>
														setIsEditingMetrics((prev) => ({
															...prev,
															totalBiaya: !prev.totalBiaya,
														}))
													}
													className="text-slate-400 hover:text-[#0517B0] transition-colors"
												>
													{isEditingMetrics.totalBiaya ? (
														<Check className="w-3.5 h-3.5 text-emerald-600" />
													) : (
														<Edit2 className="w-3.5 h-3.5" />
													)}
												</button>
											)}
										</div>
										{isEditingMetrics.totalBiaya ? (
											<div className="relative">
												<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
													Rp
												</span>
												<Input
													type="number"
													value={paymentPlan.totalBiaya || ""}
													onChange={(e) =>
														setPaymentPlan({
															...paymentPlan,
															totalBiaya: Number(e.target.value),
														})
													}
													className="pl-8 h-9 font-semibold text-slate-800"
													autoFocus
													onBlur={() =>
														setIsEditingMetrics((prev) => ({
															...prev,
															totalBiaya: false,
														}))
													}
												/>
											</div>
										) : (
											<div className="h-9 flex items-center">
												<span className="text-lg font-bold text-slate-800">
													{formatRupiah(paymentPlan.totalBiaya || 0)}
												</span>
											</div>
										)}
									</div>

									{/* Pendaftaran DP */}
									<div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-center group relative">
										<div className="flex items-center justify-between mb-2">
											<span className="text-xs font-semibold text-slate-500">
												Pendaftaran DP
											</span>
											{canEdit && (
												<button
													onClick={() =>
														setIsEditingMetrics((prev) => ({
															...prev,
															pendaftaranDp: !prev.pendaftaranDp,
														}))
													}
													className="text-slate-400 hover:text-[#0517B0] transition-colors"
												>
													{isEditingMetrics.pendaftaranDp ? (
														<Check className="w-3.5 h-3.5 text-emerald-600" />
													) : (
														<Edit2 className="w-3.5 h-3.5" />
													)}
												</button>
											)}
										</div>
										{isEditingMetrics.pendaftaranDp ? (
											<div className="relative">
												<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
													Rp
												</span>
												<Input
													type="number"
													value={paymentPlan.pendaftaranDp || ""}
													onChange={(e) =>
														setPaymentPlan({
															...paymentPlan,
															pendaftaranDp: Number(e.target.value),
														})
													}
													className="pl-8 h-9 font-semibold text-slate-800"
													autoFocus
													onBlur={() =>
														setIsEditingMetrics((prev) => ({
															...prev,
															pendaftaranDp: false,
														}))
													}
												/>
											</div>
										) : (
											<div className="h-9 flex items-center">
												<span className="text-lg font-bold text-slate-800">
													{formatRupiah(paymentPlan.pendaftaranDp || 0)}
												</span>
											</div>
										)}
									</div>

									{/* Total DP */}
									<div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-center group relative">
										<div className="flex items-center justify-between mb-2">
											<span className="text-xs font-semibold text-slate-500">
												Total DP
											</span>
											{canEdit && (
												<button
													onClick={() =>
														setIsEditingMetrics((prev) => ({
															...prev,
															totalDp: !prev.totalDp,
														}))
													}
													className="text-slate-400 hover:text-[#0517B0] transition-colors"
												>
													{isEditingMetrics.totalDp ? (
														<Check className="w-3.5 h-3.5 text-emerald-600" />
													) : (
														<Edit2 className="w-3.5 h-3.5" />
													)}
												</button>
											)}
										</div>
										{isEditingMetrics.totalDp ? (
											<div className="relative">
												<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
													Rp
												</span>
												<Input
													type="number"
													value={paymentPlan.totalDp || ""}
													onChange={(e) =>
														setPaymentPlan({
															...paymentPlan,
															totalDp: Number(e.target.value),
														})
													}
													className="pl-8 h-9 font-semibold text-slate-800"
													autoFocus
													onBlur={() =>
														setIsEditingMetrics((prev) => ({
															...prev,
															totalDp: false,
														}))
													}
												/>
											</div>
										) : (
											<div className="h-9 flex items-center">
												<span className="text-lg font-bold text-slate-800">
													{formatRupiah(paymentPlan.totalDp || 0)}
												</span>
											</div>
										)}
									</div>

									{/* Pembayaran Awal DP */}
									<div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-center group relative">
										<div className="flex items-center justify-between mb-2">
											<span className="text-xs font-semibold text-slate-500">
												Pembayaran Awal DP
											</span>
											{canEdit && (
												<button
													onClick={() =>
														setIsEditingMetrics((prev) => ({
															...prev,
															pembayaranAwalDp: !prev.pembayaranAwalDp,
														}))
													}
													className="text-slate-400 hover:text-[#0517B0] transition-colors"
												>
													{isEditingMetrics.pembayaranAwalDp ? (
														<Check className="w-3.5 h-3.5 text-emerald-600" />
													) : (
														<Edit2 className="w-3.5 h-3.5" />
													)}
												</button>
											)}
										</div>
										{isEditingMetrics.pembayaranAwalDp ? (
											<div className="relative">
												<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
													Rp
												</span>
												<Input
													type="number"
													value={paymentPlan.pembayaranAwalDp || ""}
													onChange={(e) =>
														setPaymentPlan({
															...paymentPlan,
															pembayaranAwalDp: Number(e.target.value),
														})
													}
													className="pl-8 h-9 font-semibold text-slate-800"
													autoFocus
													onBlur={() =>
														setIsEditingMetrics((prev) => ({
															...prev,
															pembayaranAwalDp: false,
														}))
													}
												/>
											</div>
										) : (
											<div className="h-9 flex items-center">
												<span className="text-lg font-bold text-slate-800">
													{formatRupiah(paymentPlan.pembayaranAwalDp || 0)}
												</span>
											</div>
										)}
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* Janji Pembayaran (Termin) */}
								<div>
									<h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
										Janji Pembayaran (Termin)
									</h3>
									<div className="space-y-4">
										{/* Tahap 2 */}
										<div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2">
													<Clock className="w-4 h-4 text-amber-500" />
													<h4 className="text-sm font-bold text-slate-800">
														Janji Pembayaran Tahap 2
													</h4>
												</div>
												<div className="flex items-center gap-2">
													{paymentPlan.janjiTahap2 && (
														<Badge
															className={
																new Date(paymentPlan.janjiTahap2) <
																new Date(new Date().setHours(0, 0, 0, 0))
																	? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
																	: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100"
															}
															variant="outline"
														>
															{new Date(paymentPlan.janjiTahap2) <
															new Date(new Date().setHours(0, 0, 0, 0))
																? "Menunggu"
																: "Belum Jatuh Tempo"}
														</Badge>
													)}
													{canEdit && !isEditingTahap2 && (
														<button
															onClick={() => setIsEditingTahap2(true)}
															className="text-slate-400 hover:text-[#0517B0] transition-colors ml-2"
														>
															<Edit2 className="w-4 h-4" />
														</button>
													)}
												</div>
											</div>

											{!isEditingTahap2 && paymentPlan.janjiTahap2 ? (
												<div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 mt-2">
													<div>
														<span className="text-[10px] text-slate-500 font-semibold block mb-1">
															Tanggal Jatuh Tempo
														</span>
														<span className="text-sm font-semibold text-slate-800">
															{new Date(
																paymentPlan.janjiTahap2,
															).toLocaleDateString("id-ID", {
																day: "numeric",
																month: "long",
																year: "numeric",
															})}
														</span>
													</div>
													<div>
														<span className="text-[10px] text-slate-500 font-semibold block mb-1">
															Nominal (Rp)
														</span>
														<span className="text-sm font-semibold text-slate-800">
															{formatRupiah(
																paymentPlan.janjiTahap2Nominal || 0,
															)}
														</span>
													</div>
													<div className="col-span-2">
														<span className="text-[10px] text-slate-500 font-semibold block mb-1">
															Catatan Tambahan
														</span>
														<span className="text-sm text-slate-700 italic">
															{paymentPlan.janjiTahap2Notes || "-"}
														</span>
													</div>
												</div>
											) : (
												<div className="bg-slate-50 p-3 rounded-md border border-slate-100 relative">
													<div className="grid grid-cols-2 gap-3 mb-3">
														<div>
															<span className="text-[10px] text-slate-500 font-semibold block mb-1">
																Tanggal Jatuh Tempo
															</span>
															<Input
																type="date"
																disabled={!canEdit}
																value={paymentPlan.janjiTahap2}
																onChange={(e) =>
																	setPaymentPlan({
																		...paymentPlan,
																		janjiTahap2: e.target.value,
																	})
																}
																className="bg-white h-9 text-sm"
															/>
														</div>
														<div>
															<span className="text-[10px] text-slate-500 font-semibold block mb-1">
																Nominal (Rp)
															</span>
															<Input
																type="number"
																disabled={!canEdit}
																value={paymentPlan.janjiTahap2Nominal || ""}
																onChange={(e) =>
																	setPaymentPlan({
																		...paymentPlan,
																		janjiTahap2Nominal: Number(e.target.value),
																	})
																}
																className="bg-white h-9 text-sm"
															/>
														</div>
													</div>
													<Input
														disabled={!canEdit}
														value={paymentPlan.janjiTahap2Notes}
														onChange={(e) =>
															setPaymentPlan({
																...paymentPlan,
																janjiTahap2Notes: e.target.value,
															})
														}
														placeholder="Catatan tambahan (opsional)"
														className="bg-white h-8 text-xs mb-2"
													/>
													{canEdit && (
														<div className="flex justify-end gap-2 mt-2">
															<Button
																variant="ghost"
																size="sm"
																className="h-7 text-xs text-slate-500"
																onClick={() => setIsEditingTahap2(false)}
															>
																Batal
															</Button>
															<Button
																size="sm"
																className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
																onClick={() => setIsEditingTahap2(false)}
															>
																Selesai
															</Button>
														</div>
													)}
												</div>
											)}
										</div>

										{/* Tahap 3 */}
										<div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2">
													<Clock className="w-4 h-4 text-indigo-500" />
													<h4 className="text-sm font-bold text-slate-800">
														Janji Pembayaran Tahap 3
													</h4>
												</div>
												<div className="flex items-center gap-2">
													{paymentPlan.janjiTahap3 && (
														<Badge
															className={
																new Date(paymentPlan.janjiTahap3) <
																new Date(new Date().setHours(0, 0, 0, 0))
																	? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
																	: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100"
															}
															variant="outline"
														>
															{new Date(paymentPlan.janjiTahap3) <
															new Date(new Date().setHours(0, 0, 0, 0))
																? "Menunggu"
																: "Belum Jatuh Tempo"}
														</Badge>
													)}
													{canEdit && !isEditingTahap3 && (
														<button
															onClick={() => setIsEditingTahap3(true)}
															className="text-slate-400 hover:text-[#0517B0] transition-colors ml-2"
														>
															<Edit2 className="w-4 h-4" />
														</button>
													)}
												</div>
											</div>

											{!isEditingTahap3 && paymentPlan.janjiTahap3 ? (
												<div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 mt-2">
													<div>
														<span className="text-[10px] text-slate-500 font-semibold block mb-1">
															Tanggal Jatuh Tempo
														</span>
														<span className="text-sm font-semibold text-slate-800">
															{new Date(
																paymentPlan.janjiTahap3,
															).toLocaleDateString("id-ID", {
																day: "numeric",
																month: "long",
																year: "numeric",
															})}
														</span>
													</div>
													<div>
														<span className="text-[10px] text-slate-500 font-semibold block mb-1">
															Nominal (Rp)
														</span>
														<span className="text-sm font-semibold text-slate-800">
															{formatRupiah(
																paymentPlan.janjiTahap3Nominal || 0,
															)}
														</span>
													</div>
													<div className="col-span-2">
														<span className="text-[10px] text-slate-500 font-semibold block mb-1">
															Catatan Tambahan
														</span>
														<span className="text-sm text-slate-700 italic">
															{paymentPlan.janjiTahap3Notes || "-"}
														</span>
													</div>
												</div>
											) : (
												<div className="bg-slate-50 p-3 rounded-md border border-slate-100 relative">
													<div className="grid grid-cols-2 gap-3 mb-3">
														<div>
															<span className="text-[10px] text-slate-500 font-semibold block mb-1">
																Tanggal Jatuh Tempo
															</span>
															<Input
																type="date"
																disabled={!canEdit}
																value={paymentPlan.janjiTahap3}
																onChange={(e) =>
																	setPaymentPlan({
																		...paymentPlan,
																		janjiTahap3: e.target.value,
																	})
																}
																className="bg-white h-9 text-sm"
															/>
														</div>
														<div>
															<span className="text-[10px] text-slate-500 font-semibold block mb-1">
																Nominal (Rp)
															</span>
															<Input
																type="number"
																disabled={!canEdit}
																value={paymentPlan.janjiTahap3Nominal || ""}
																onChange={(e) =>
																	setPaymentPlan({
																		...paymentPlan,
																		janjiTahap3Nominal: Number(e.target.value),
																	})
																}
																className="bg-white h-9 text-sm"
															/>
														</div>
													</div>
													<Input
														disabled={!canEdit}
														value={paymentPlan.janjiTahap3Notes}
														onChange={(e) =>
															setPaymentPlan({
																...paymentPlan,
																janjiTahap3Notes: e.target.value,
															})
														}
														placeholder="Catatan tambahan (opsional)"
														className="bg-white h-8 text-xs mb-2"
													/>
													{canEdit && (
														<div className="flex justify-end gap-2 mt-2">
															<Button
																variant="ghost"
																size="sm"
																className="h-7 text-xs text-slate-500"
																onClick={() => setIsEditingTahap3(false)}
															>
																Batal
															</Button>
															<Button
																size="sm"
																className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
																onClick={() => setIsEditingTahap3(false)}
															>
																Selesai
															</Button>
														</div>
													)}
												</div>
											)}
										</div>
									</div>
								</div>

								{/* Pengajuan Dana Talangan */}
								<div>
									<h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
										Pengajuan Dana Talangan
									</h3>
									<div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm h-full flex flex-col">
										{!isEditingDanaTalangan &&
										!paymentPlan.pengajuanDanaTalangan ? (
											<div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-emerald-50/50 rounded-lg border border-emerald-100 border-dashed">
												<CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3" />
												<h4 className="text-sm font-bold text-emerald-800 mb-1">
													Tidak Ada Pengajuan Dana Talangan
												</h4>
												<p className="text-xs text-emerald-600/80 mb-4 max-w-[250px]">
													Mahasiswa tidak memerlukan bantuan pembiayaan
													sementara saat ini.
												</p>
												{canEdit && (
													<Button
														size="sm"
														variant="outline"
														className="h-8 text-xs bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-100"
														onClick={() => setIsEditingDanaTalangan(true)}
													>
														<Plus className="w-3.5 h-3.5 mr-1" /> Tambah
														Pengajuan
													</Button>
												)}
											</div>
										) : !isEditingDanaTalangan &&
											paymentPlan.pengajuanDanaTalangan ? (
											<div className="flex-1 flex flex-col">
												<div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100">
													<div className="flex items-center gap-2 text-amber-600">
														<AlertCircle className="w-5 h-5" />
														<h4 className="text-sm font-bold">
															Ada Pengajuan Dana Talangan
														</h4>
													</div>
													{canEdit && (
														<button
															onClick={() => setIsEditingDanaTalangan(true)}
															className="text-slate-400 hover:text-[#0517B0] transition-colors"
														>
															<Edit2 className="w-4 h-4" />
														</button>
													)}
												</div>
												<div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100 flex-1">
													<span className="text-[10px] text-amber-700/70 font-semibold block mb-2 uppercase tracking-wider">
														Detail Pengajuan / Alasan
													</span>
													<p className="text-sm text-amber-900 whitespace-pre-wrap">
														{paymentPlan.pengajuanDanaTalangan}
													</p>
												</div>

												{/* Status Pencairan dari Finance */}
												<div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
													<div className="flex-1">
														<span className="text-[10px] text-slate-500 font-semibold block mb-1">
															Status Pencairan Tahap 1
														</span>
														{financeData?.isDanaT1Disbursed ? (
															<Badge
																className="bg-emerald-100 text-emerald-700 border-emerald-200"
																variant="outline"
															>
																Sudah Dicairkan
															</Badge>
														) : (
															<Badge
																className="bg-slate-100 text-slate-600 border-slate-200"
																variant="outline"
															>
																Belum Dicairkan
															</Badge>
														)}
													</div>
													<div className="flex-1">
														<span className="text-[10px] text-slate-500 font-semibold block mb-1">
															Status Pencairan Tahap 2
														</span>
														{financeData?.isDanaT2Disbursed ? (
															<Badge
																className="bg-emerald-100 text-emerald-700 border-emerald-200"
																variant="outline"
															>
																Sudah Dicairkan
															</Badge>
														) : (
															<Badge
																className="bg-slate-100 text-slate-600 border-slate-200"
																variant="outline"
															>
																Belum Dicairkan
															</Badge>
														)}
													</div>
												</div>
											</div>
										) : (
											<div className="flex-1 flex flex-col">
												<div className="flex items-center justify-between mb-3">
													<span className="text-xs text-slate-500 block">
														Catat pengajuan dana talangan mahasiswa di sini jika
														membutuhkan bantuan pembiayaan sementara.
													</span>
												</div>
												<Textarea
													disabled={!canEdit}
													value={paymentPlan.pengajuanDanaTalangan}
													onChange={(e) =>
														setPaymentPlan({
															...paymentPlan,
															pengajuanDanaTalangan: e.target.value,
														})
													}
													placeholder="Tuliskan detail pengajuan dana talangan (alasan, nominal, kesepakatan)..."
													className="resize-none bg-slate-50 flex-1 min-h-[150px] mb-3 focus-visible:ring-amber-500"
													autoFocus
												/>
												{canEdit && (
													<div className="flex justify-end gap-2">
														<Button
															variant="ghost"
															size="sm"
															className="h-8 text-xs text-slate-500"
															onClick={() => setIsEditingDanaTalangan(false)}
														>
															Batal
														</Button>
														<Button
															size="sm"
															className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white"
															onClick={() => setIsEditingDanaTalangan(false)}
														>
															Selesai Input
														</Button>
													</div>
												)}
											</div>
										)}
									</div>
								</div>
							</div>

							{canEdit && (
								<div className="flex justify-end mt-8 pt-4 border-t border-slate-100">
									<Button
										onClick={savePaymentPlan}
										disabled={isSaving}
										className="bg-[#0517B0] hover:bg-[#04128c] text-white px-8"
									>
										{isSaving
											? "Menyimpan..."
											: "Simpan Seluruh Skema Keuangan"}
									</Button>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Fee Pencairan Mitra */}
					<Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
						<CardHeader className="bg-slate-50 border-b border-slate-200 py-4 flex flex-row items-center justify-between">
							<CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Fee Pencairan Mitra / Referral
							</CardTitle>
							{canEdit && (
								<Dialog open={isFeeModalOpen} onOpenChange={setIsFeeModalOpen}>
									<DialogTrigger
										render={
											<Button
												size="sm"
												className="bg-[#0517B0] hover:bg-blue-800 h-8 text-xs"
											>
												<Plus className="w-4 h-4 mr-1" /> Tambah Fee
											</Button>
										}
									/>
									<DialogContent className="bg-white">
										<DialogHeader>
											<DialogTitle>Tambah Rekord Fee Mitra</DialogTitle>
										</DialogHeader>
										<div className="grid gap-4 py-4">
											<div className="grid grid-cols-4 items-center gap-4">
												<Label className="text-right text-xs">Channel</Label>
												<Select
													value={newFee.channel}
													onValueChange={(val) =>
														setNewFee({ ...newFee, channel: val || "" })
													}
												>
													<SelectTrigger className="col-span-3">
														<SelectValue placeholder="Pilih Channel" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="Sekolah MoU">
															Sekolah MoU
														</SelectItem>
														<SelectItem value="BKK">BKK</SelectItem>
														<SelectItem value="FKKS">FKKS</SelectItem>
														<SelectItem value="RO Mahasiswa/Alumni">
															RO Mahasiswa/Alumni
														</SelectItem>
														<SelectItem value="Staff/Team">
															Staff/Team
														</SelectItem>
														<SelectItem value="Pendamping">
															Pendamping
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="grid grid-cols-4 items-center gap-4">
												<Label className="text-right text-xs">Nama Mitra</Label>
												<Input
													value={newFee.namaReferral}
													onChange={(e) =>
														setNewFee({
															...newFee,
															namaReferral: e.target.value,
														})
													}
													className="col-span-3"
													placeholder="Cth: SMK N 3 Malang"
												/>
											</div>
											<div className="grid grid-cols-4 items-center gap-4">
												<Label className="text-right text-xs">
													Nominal (Rp)
												</Label>
												<Input
													type="number"
													value={newFee.nominalFee}
													onChange={(e) =>
														setNewFee({
															...newFee,
															nominalFee: Number(e.target.value),
														})
													}
													className="col-span-3"
												/>
											</div>
											<div className="grid grid-cols-4 items-center gap-4">
												<Label className="text-right text-xs">Status</Label>
												<Select
													value={newFee.statusPencairan}
													onValueChange={(val) =>
														setNewFee({
															...newFee,
															statusPencairan: val || "belum",
														})
													}
												>
													<SelectTrigger className="col-span-3">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="belum">
															Belum Dicairkan
														</SelectItem>
														<SelectItem value="proses">Dalam Proses</SelectItem>
														<SelectItem value="sudah">
															Sudah Dicairkan
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
											{newFee.statusPencairan === "sudah" && (
												<div className="grid grid-cols-4 items-center gap-4">
													<Label className="text-right text-xs">Tgl Cair</Label>
													<Input
														type="date"
														value={newFee.tanggalCair}
														onChange={(e) =>
															setNewFee({
																...newFee,
																tanggalCair: e.target.value,
															})
														}
														className="col-span-3"
													/>
												</div>
											)}
										</div>
										<DialogFooter>
											<Button
												variant="outline"
												onClick={() => setIsFeeModalOpen(false)}
											>
												Batal
											</Button>
											<Button onClick={handleAddFee} className="bg-[#0517B0]">
												Simpan Fee
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							)}
						</CardHeader>
						<CardContent className="p-5">
							{/* Summary Cards */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
								<div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col justify-center">
									<p className="text-xs text-emerald-700 font-bold uppercase mb-1">
										Total Sudah Cair
									</p>
									<p className="text-xl font-bold text-emerald-700">
										{formatRupiah(totalCair)}
									</p>
								</div>
								<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col justify-center">
									<p className="text-xs text-amber-700 font-bold uppercase mb-1">
										Dalam Proses
									</p>
									<p className="text-xl font-bold text-amber-700">
										{formatRupiah(totalProses)}
									</p>
								</div>
								<div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex flex-col justify-center">
									<p className="text-xs text-rose-700 font-bold uppercase mb-1">
										Belum Dicairkan
									</p>
									<p className="text-xl font-bold text-rose-700">
										{formatRupiah(totalBelum)}
									</p>
								</div>
							</div>

							<div className="border border-slate-200 rounded-md overflow-hidden">
								<Table>
									<TableHeader className="bg-slate-50">
										<TableRow>
											<TableHead className="text-xs font-semibold py-3">
												Channel
											</TableHead>
											<TableHead className="text-xs font-semibold py-3">
												Nama Mitra/Referral
											</TableHead>
											<TableHead className="text-xs font-semibold py-3 text-right">
												Nominal Fee
											</TableHead>
											<TableHead className="text-xs font-semibold py-3 text-center">
												Status
											</TableHead>
											<TableHead className="text-xs font-semibold py-3">
												Tanggal Cair
											</TableHead>
											{canEdit && (
												<TableHead className="text-xs font-semibold py-3 text-right">
													Aksi
												</TableHead>
											)}
										</TableRow>
									</TableHeader>
									<TableBody>
										{fees.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="text-center text-slate-400 py-6 text-sm"
												>
													Belum ada data pencairan fee mitra.
												</TableCell>
											</TableRow>
										) : (
											fees.map((fee) => (
												<TableRow key={fee.id}>
													<TableCell className="text-sm font-medium text-slate-700">
														{fee.channel}
													</TableCell>
													<TableCell className="text-sm font-bold text-slate-900">
														{fee.namaReferral}
													</TableCell>
													<TableCell className="text-sm font-medium text-slate-700 text-right">
														{formatRupiah(fee.nominalFee)}
													</TableCell>
													<TableCell className="text-center">
														{fee.statusPencairan === "sudah" && (
															<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
																Sudah Dicairkan
															</Badge>
														)}
														{fee.statusPencairan === "proses" && (
															<Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
																Proses
															</Badge>
														)}
														{fee.statusPencairan === "belum" && (
															<Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">
																Belum Dicairkan
															</Badge>
														)}
													</TableCell>
													<TableCell className="text-sm text-slate-600">
														{fee.tanggalCair
															? new Date(fee.tanggalCair).toLocaleDateString(
																	"id-ID",
																)
															: "-"}
													</TableCell>
													{canEdit && (
														<TableCell className="text-right">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleDeleteFee(fee.id)}
																className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0"
															>
																<Trash2 className="w-4 h-4" />
															</Button>
														</TableCell>
													)}
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>

					{/* Catatan PMB */}
					<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
						<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Catatan PMB
							</h3>
						</div>
						<div className="p-5">
							<Textarea
								placeholder="Tambahkan catatan terkait penerimaan mahasiswa ini..."
								className="min-h-[100px] bg-slate-50 border-slate-200 text-slate-800 resize-none focus-visible:ring-[#0517B0]"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								readOnly={!canEdit}
							/>
							{canEdit && (
								<div className="flex justify-end mt-3">
									<Button
										variant="outline"
										onClick={saveAcquisitionAndNotes}
										disabled={isSaving || notes === (pmbData?.notes || "")}
										className="bg-blue-50 border-[#0517B0]/30 text-[#0517B0] hover:bg-blue-100 hover:text-blue-800"
									>
										{isSaving ? "Menyimpan..." : "Simpan Catatan"}
									</Button>
								</div>
							)}
						</div>
					</div>

					<div className="pt-4 mt-6 border-t border-slate-200">
						{pmbData?.isAcc ? (
							<div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md gap-4">
								<div className="flex items-center gap-2">
									<CheckCircle className="w-5 h-5 text-emerald-500" />
									<span className="text-sm font-medium text-emerald-600">
										ACC PMB —{" "}
										{pmbData.accByUser?.fullName
											? `${pmbData.accByUser.fullName} · `
											: ""}
										{new Date(pmbData.accAt).toLocaleString("id-ID")} WIB
									</span>
								</div>
								{isPmbAdmin && (
									<AlertDialog>
										<AlertDialogTrigger
											render={
												<Button
													variant="outline"
													size="sm"
													className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 w-full sm:w-auto h-8 px-3 text-xs"
													disabled={isSaving}
												>
													{isSaving ? "Membatalkan..." : "Batalkan ACC"}
												</Button>
											}
										/>
										<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
											<AlertDialogTitle>
												Konfirmasi Pembatalan ACC PMB
											</AlertDialogTitle>
											<AlertDialogDescription className="text-slate-500">
												Apakah Anda yakin ingin membatalkan status ACC untuk
												panel PMB ini? Status mahasiswa akan kembali ke tahap
												proses.
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
							</div>
						) : isPmbAdmin ? (
							<AlertDialog>
								<Tooltip>
									<TooltipTrigger render={<span className="inline-block" />}>
										<AlertDialogTrigger
											render={
												<Button
													disabled={completedCount < 4}
													className="bg-[#0517B0] hover:bg-blue-800 text-white w-full sm:w-auto"
												>
													✔ ACC PMB →
												</Button>
											}
										/>
									</TooltipTrigger>
									{completedCount < 4 && (
										<TooltipContent>
											Lengkapi semua {4 - completedCount} checklist terlebih
											dahulu
										</TooltipContent>
									)}
								</Tooltip>
								<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
									<AlertDialogTitle>Konfirmasi ACC PMB</AlertDialogTitle>
									<AlertDialogDescription className="text-slate-500">
										Anda akan memberikan persetujuan untuk panel PMB mahasiswa
										ini. Tindakan ini akan dicatat beserta timestamp Anda.
									</AlertDialogDescription>
									<div className="flex justify-end gap-3 mt-4">
										<AlertDialogCancel className="bg-transparent border-slate-200 hover:bg-slate-50">
											Batal
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleAcc}
											className="bg-[#0517B0] hover:bg-blue-800"
										>
											Ya, ACC Sekarang
										</AlertDialogAction>
									</div>
								</AlertDialogContent>
							</AlertDialog>
						) : null}
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}
