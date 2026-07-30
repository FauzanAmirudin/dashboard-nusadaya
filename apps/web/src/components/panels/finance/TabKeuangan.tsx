"use client";

import {
	CheckCircle,
	Edit,
	FileText,
	Loader2,
	Plus,
	Save,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { API_URL, api, getToken } from "@/lib/eden";
import { formatRupiah } from "@/utils/format";

interface TabKeuanganProps {
	studentId: number;
	finState: any;
	pmbState: any;
	customFields: any[];
	canEdit: boolean;
	onUpdate: () => void;
}

export function TabKeuangan({
	studentId,
	finState,
	pmbState,
	customFields,
	canEdit,
	onUpdate,
}: TabKeuanganProps) {
	const [loadingUtama, setLoadingUtama] = useState(false);
	const [loadingTambahan, setLoadingTambahan] = useState(false);
	const [isEditingUtama, setIsEditingUtama] = useState(false);
	const [isEditingTambahan, setIsEditingTambahan] = useState(false);
	const [formData, setFormData] = useState<any>({});
	const [customData, setCustomData] = useState<any[]>([]);

	// Dialog States
	const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
	const [sectionToSave, setSectionToSave] = useState<
		"utama" | "tambahan" | null
	>(null);

	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<number | null>(null);

	const [addPromptOpen, setAddPromptOpen] = useState(false);
	const [addPromptType, setAddPromptType] = useState<string>("");
	const [newFieldLabel, setNewFieldLabel] = useState("");
	const [isAddingField, setIsAddingField] = useState(false);
	const [isDeletingField, setIsDeletingField] = useState(false);

	const fetchApi = (endpoint: string, options: RequestInit = {}) => {
		const token = getToken();
		const headers = new Headers(options.headers || {});
		if (token) headers.set("Authorization", `Bearer ${token}`);
		if (options.body && !headers.has("Content-Type")) {
			headers.set("Content-Type", "application/json");
		}
		return fetch(`${API_URL}${endpoint}`, { ...options, headers });
	};

	// Helper to prevent negative numbers
	const preventMinus = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
			e.preventDefault();
		}
	};

	// Initialize form data when state changes
	useEffect(() => {
		if (finState) {
			setFormData(finState);
		}
		if (customFields) {
			setCustomData(customFields);
		}
	}, [finState, customFields]);

	const handleFieldChange = (field: string, value: any) => {
		if (typeof value === "number") {
			value = Math.max(0, value);
		}
		setFormData((prev: any) => ({ ...prev, [field]: value }));
	};

	const handleNumberFieldChange = (field: string, rawVal: any) => {
		const val = Math.max(0, Number(rawVal) || 0);
		setFormData((prev: any) => ({ ...prev, [field]: val }));
	};

	const handleCustomFieldChange = (id: number, field: string, value: any) => {
		if (field === "nominal" && typeof value === "number") {
			value = Math.max(0, value);
		}
		setCustomData((prev) =>
			prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
		);
	};

	const handleCustomNumberFieldChange = (
		id: number,
		field: string,
		rawVal: any,
	) => {
		const val = Math.max(0, Number(rawVal) || 0);
		setCustomData((prev) =>
			prev.map((c) => (c.id === id ? { ...c, [field]: val } : c)),
		);
	};

	const triggerSave = (section: "utama" | "tambahan") => {
		if (!canEdit) return;
		setSectionToSave(section);
		setSaveConfirmOpen(true);
	};

	const confirmSave = async () => {
		if (!sectionToSave) return;
		const section = sectionToSave;
		setSaveConfirmOpen(false);
		setSectionToSave(null);

		if (section === "utama") setLoadingUtama(true);
		else setLoadingTambahan(true);

		// Sanitize data before sending
		const sanitizedFormData = { ...formData };
		Object.keys(sanitizedFormData).forEach((key) => {
			if (typeof sanitizedFormData[key] === "number") {
				sanitizedFormData[key] = Math.max(0, sanitizedFormData[key]);
			}
		});

		const sanitizedCustomData = customData.map((c) => ({
			...c,
			nominal: Math.max(0, Number(c.nominal) || 0),
		}));

		try {
			const { error } =
				await api.students[studentId.toString()].finance.patch(
					sanitizedFormData,
				);

			const customPromises = sanitizedCustomData.map(async (c) => {
				return fetchApi(
					`/finance/student/${studentId}/custom-field/${c.id.toString()}`,
					{
						method: "PATCH",
						body: JSON.stringify({ nominal: c.nominal, status: c.status }),
					},
				);
			});

			await Promise.all(customPromises);

			if (!error) {
				toast.success("Berhasil menyimpan perubahan keuangan!");
				if (section === "utama") setIsEditingUtama(false);
				else setIsEditingTambahan(false);
				onUpdate();
			} else {
				toast.error("Gagal menyimpan data utama");
			}
		} catch (e) {
			toast.error("Terjadi kesalahan sistem saat menyimpan");
		} finally {
			if (section === "utama") setLoadingUtama(false);
			else setLoadingTambahan(false);
		}
	};

	const handleCancelEdit = (section: "utama" | "tambahan") => {
		if (section === "utama") setIsEditingUtama(false);
		else setIsEditingTambahan(false);
		setFormData(finState || {});
		setCustomData(customFields || []);
	};

	const triggerAddCustomField = (type: string) => {
		if (!canEdit) return;
		setAddPromptType(type);
		setNewFieldLabel("");
		setAddPromptOpen(true);
	};

	const confirmAddCustomField = async () => {
		if (!newFieldLabel.trim()) return;
		setIsAddingField(true);
		try {
			const res = await fetchApi(`/finance/student/${studentId}/custom-field`, {
				method: "POST",
				body: JSON.stringify({
					fieldType: addPromptType,
					label: newFieldLabel.trim(),
					nominal: 0,
					status: false,
				}),
			});
			if (res.ok) {
				toast.success("Biaya berhasil ditambahkan");
				setAddPromptOpen(false);
				onUpdate();
			} else toast.error("Gagal menambahkan biaya");
		} catch (e) {
			toast.error("Gagal menambahkan biaya");
		} finally {
			setIsAddingField(false);
		}
	};

	const triggerDeleteCustomField = (id: number) => {
		if (!canEdit) return;
		setItemToDelete(id);
		setDeleteConfirmOpen(true);
	};

	const confirmDeleteCustomField = async () => {
		if (!itemToDelete) return;
		setIsDeletingField(true);
		try {
			const res = await fetchApi(
				`/finance/student/${studentId}/custom-field/${itemToDelete.toString()}`,
				{ method: "DELETE" },
			);
			if (res.ok) {
				toast.success("Biaya dihapus");
				setDeleteConfirmOpen(false);
				setItemToDelete(null);
				onUpdate();
			} else toast.error("Gagal menghapus biaya");
		} catch (e) {
			toast.error("Gagal menghapus biaya");
		} finally {
			setIsDeletingField(false);
		}
	};

	const totalBiaya = finState?.totalBiayaPendidikan || 0;

	return (
		<div className="space-y-6">
			{/* Header Actions & Total Biaya */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
				<div>
					<h3 className="text-xl font-bold text-slate-800">
						Rincian Keuangan Mahasiswa
					</h3>
					<p className="text-sm text-slate-500 mt-1">
						Total kewajiban biaya pendidikan yang harus diselesaikan
					</p>
				</div>
				<div className="flex items-center gap-4">
					<div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-lg flex flex-col items-end">
						<span className="text-xs font-semibold uppercase tracking-wider opacity-80">
							Total Tagihan
						</span>
						<span className="text-xl font-black">
							{formatRupiah(totalBiaya)}
						</span>
					</div>
				</div>
			</div>

			{/* Pembayaran Utama */}
			<Card className="border-0 shadow-sm ring-1 ring-slate-200">
				<CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
					<CardTitle className="text-base font-bold text-slate-800 flex items-center">
						<div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
						Pembayaran Utama
					</CardTitle>
					<div className="flex items-center gap-2">
						{canEdit && !isEditingUtama && (
							<Button
								size="sm"
								onClick={() => setIsEditingUtama(true)}
								className="bg-slate-800 hover:bg-slate-700"
							>
								<Edit className="w-4 h-4 mr-2" /> Edit Data
							</Button>
						)}
						{isEditingUtama && (
							<>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleCancelEdit("utama")}
									disabled={loadingUtama}
								>
									<X className="w-4 h-4 mr-2" /> Batal
								</Button>
								<Button
									size="sm"
									onClick={() => triggerSave("utama")}
									disabled={loadingUtama}
									className="bg-emerald-600 hover:bg-emerald-700"
								>
									{loadingUtama ? (
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									) : (
										<Save className="w-4 h-4 mr-2" />
									)}
									Simpan
								</Button>
							</>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-6 space-y-8 bg-white">
					{/* Registrasi */}
					<div>
						<div className="flex items-center justify-between mb-4">
							<h4 className="font-semibold text-slate-800 flex items-center">
								Registrasi Awal
								{formData?.registrasiStatus ? (
									<Badge className="ml-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
										<CheckCircle className="w-3 h-3 mr-1" /> Lunas
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="ml-3 text-slate-500 border-slate-300"
									>
										Belum Lunas
									</Badge>
								)}
							</h4>
							{isEditingUtama && (
								<div className="flex items-center space-x-2">
									<Checkbox
										id="regStatus"
										checked={formData?.registrasiStatus}
										onCheckedChange={(c) =>
											handleFieldChange("registrasiStatus", !!c)
										}
									/>
									<label
										htmlFor="regStatus"
										className="text-sm font-medium leading-none cursor-pointer"
									>
										Tandai Lunas
									</label>
								</div>
							)}
						</div>

						<div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col md:flex-row gap-6">
							<div className="flex-1">
								<label className="text-xs font-semibold text-slate-500 mb-2 block uppercase tracking-wider">
									Nominal Tagihan
								</label>
								{isEditingUtama ? (
									<Input
										type="number"
										min={0}
										onKeyDown={preventMinus}
										value={formData?.registrasiNominal || 0}
										onChange={(e) =>
											handleNumberFieldChange(
												"registrasiNominal",
												e.target.value,
											)
										}
										className="max-w-xs font-medium"
									/>
								) : (
									<div className="text-lg font-semibold text-slate-800">
										{formatRupiah(formData?.registrasiNominal || 0)}
									</div>
								)}
							</div>
							<div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
								<label className="text-xs font-semibold text-slate-500 mb-2 block uppercase tracking-wider">
									Bukti Pembayaran Registrasi (PDF)
								</label>
								<DocumentUpload
									studentId={studentId}
									panel="finance"
									documentKey="registrasi"
									canEdit={canEdit}
									onUploadSuccess={onUpdate}
								/>
							</div>
						</div>
					</div>

					<hr className="border-slate-100" />

					{/* Metode Pembayaran */}
					<div>
						<div className="mb-4">
							<h4 className="font-semibold text-slate-800 mb-1">
								Metode Pembayaran Lanjutan
							</h4>
							<p className="text-sm text-slate-500">
								Pilih skema pelunasan biaya pendidikan setelah registrasi awal.
							</p>
						</div>

						{isEditingUtama ? (
							<Select
								value={formData?.metodePembayaran || ""}
								onValueChange={(val) =>
									handleFieldChange("metodePembayaran", val)
								}
							>
								<SelectTrigger className="w-full sm:w-[400px]">
									<SelectValue placeholder="Pilih metode pembayaran..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="mandiri">
										Dana Mandiri (Tunai/Bertahap)
									</SelectItem>
									<SelectItem value="dana_talangan">
										Dana Talangan 2 Tahap (Lembaga Keuangan)
									</SelectItem>
								</SelectContent>
							</Select>
						) : (
							<div className="inline-flex">
								<Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200 text-sm px-4 py-1.5">
									{formData?.metodePembayaran === "mandiri"
										? "Dana Mandiri"
										: formData?.metodePembayaran === "dana_talangan"
											? "Dana Talangan 2 Tahap"
											: "Belum Dipilih"}
								</Badge>
							</div>
						)}
					</div>

					{/* Kondisional Metode */}
					{formData?.metodePembayaran === "mandiri" && (
						<div className="space-y-4 p-5 border border-blue-100 bg-blue-50/40 rounded-xl">
							<h4 className="font-bold text-blue-900 flex items-center">
								Rincian Skema Dana Mandiri
							</h4>

							<div className="grid gap-4">
								{[
									{
										label: "Pembayaran Semester",
										docKey: "mandiri_semester",
										nomField: "mandiriSemesterNominal",
										statusField: "mandiriSemesterStatus",
									},
									{
										label: "Interview Magang",
										docKey: "mandiri_interview",
										nomField: "mandiriInterviewNominal",
										statusField: "mandiriInterviewStatus",
									},
									{
										label: "Keberangkatan",
										docKey: "mandiri_keberangkatan",
										nomField: "mandiriKeberangkatanNominal",
										statusField: "mandiriKeberangkatanStatus",
									},
								].map((item, idx) => (
									<div
										key={idx}
										className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm space-y-3"
									>
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100">
											<div className="font-medium text-slate-700">
												{item.label}
											</div>
											<div className="flex items-center gap-6">
												{isEditingUtama ? (
													<Input
														type="number"
														min={0}
														onKeyDown={preventMinus}
														className="w-32 text-right"
														value={formData?.[item.nomField] || 0}
														onChange={(e) =>
															handleNumberFieldChange(
																item.nomField,
																e.target.value,
															)
														}
													/>
												) : (
													<div className="font-semibold text-slate-800 w-32 text-right">
														{formatRupiah(formData?.[item.nomField] || 0)}
													</div>
												)}

												{isEditingUtama ? (
													<div className="flex items-center gap-2 w-24">
														<Checkbox
															checked={formData?.[item.statusField]}
															onCheckedChange={(c) =>
																handleFieldChange(item.statusField, !!c)
															}
														/>
														<span className="text-sm">Lunas</span>
													</div>
												) : (
													<div className="w-24">
														{formData?.[item.statusField] ? (
															<Badge className="bg-emerald-100 text-emerald-700 border-0">
																<CheckCircle className="w-3 h-3 mr-1" /> Lunas
															</Badge>
														) : (
															<Badge
																variant="outline"
																className="text-slate-500"
															>
																Belum
															</Badge>
														)}
													</div>
												)}
											</div>
										</div>
										<div>
											<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
												Bukti Bayar {item.label} (PDF)
											</label>
											<DocumentUpload
												studentId={studentId}
												panel="finance"
												documentKey={item.docKey}
												canEdit={canEdit}
												onUploadSuccess={onUpdate}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{formData?.metodePembayaran === "dana_talangan" && (
						<div className="space-y-6 p-5 border border-emerald-100 bg-emerald-50/40 rounded-xl">
							<h4 className="font-bold text-emerald-900">
								Rincian Skema Dana Talangan
							</h4>

							{/* Tahap 1 Semester */}
							<div className="bg-white p-5 border border-slate-200 rounded-lg shadow-sm space-y-4">
								<div className="flex justify-between items-center pb-3 border-b border-slate-100">
									<div className="font-bold text-slate-800">
										Tahap 1: Semester
									</div>
									{isEditingUtama ? (
										<div className="flex items-center gap-2">
											<Checkbox
												checked={formData?.t1SemesterStatus}
												onCheckedChange={(c) =>
													handleFieldChange("t1SemesterStatus", !!c)
												}
											/>
											<span className="text-sm font-medium">Lunas</span>
										</div>
									) : formData?.t1SemesterStatus ? (
										<Badge className="bg-emerald-100 text-emerald-700 border-0">
											Lunas
										</Badge>
									) : (
										<Badge variant="outline">Belum Lunas</Badge>
									)}
								</div>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
									{[
										{ label: "Total Biaya", field: "t1SemesterNominalTotal" },
										{
											label: "Nominal Talangan",
											field: "t1SemesterNominalTalangan",
										},
										{
											label: "Jumlah Cicilan (Bulan)",
											field: "t1SemesterJumlahCicilan",
										},
										{ label: "Cicilan Ke-", field: "t1SemesterCicilanKe" },
									].map((item, idx) => (
										<div key={idx}>
											<label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
												{item.label}
											</label>
											{isEditingUtama ? (
												<Input
													type="number"
													min={0}
													onKeyDown={preventMinus}
													value={formData?.[item.field] || 0}
													onChange={(e) =>
														handleNumberFieldChange(item.field, e.target.value)
													}
												/>
											) : (
												<div className="font-medium text-slate-800">
													{item.field.includes("Nominal")
														? formatRupiah(formData?.[item.field] || 0)
														: formData?.[item.field] || 0}
												</div>
											)}
										</div>
									))}
								</div>

								<div className="pt-2 border-t border-slate-100">
									<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
										Bukti Bayar Tahap 1 Semester (PDF)
									</label>
									<DocumentUpload
										studentId={studentId}
										panel="finance"
										documentKey="t1_semester"
										canEdit={canEdit}
										onUploadSuccess={onUpdate}
									/>
								</div>
							</div>

							{/* Tahap 1 Interview & Tahap 2 */}
							<div className="grid gap-4">
								{[
									{
										label: "Tahap 1: Interview Magang",
										docKey: "t1_interview",
										nomField: "t1InterviewNominal",
										statusField: "t1InterviewStatus",
									},
									{
										label: "Tahap 2: Keberangkatan",
										docKey: "t2_keberangkatan",
										nomField: "t2KeberangkatanNominal",
										statusField: "t2KeberangkatanStatus",
									},
								].map((item, idx) => (
									<div
										key={idx}
										className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm space-y-3"
									>
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100">
											<div className="font-medium text-slate-700">
												{item.label}
											</div>
											<div className="flex items-center gap-6">
												{isEditingUtama ? (
													<Input
														type="number"
														min={0}
														onKeyDown={preventMinus}
														className="w-32 text-right"
														value={formData?.[item.nomField] || 0}
														onChange={(e) =>
															handleNumberFieldChange(
																item.nomField,
																e.target.value,
															)
														}
													/>
												) : (
													<div className="font-semibold text-slate-800 w-32 text-right">
														{formatRupiah(formData?.[item.nomField] || 0)}
													</div>
												)}

												{isEditingUtama ? (
													<div className="flex items-center gap-2 w-24">
														<Checkbox
															checked={formData?.[item.statusField]}
															onCheckedChange={(c) =>
																handleFieldChange(item.statusField, !!c)
															}
														/>
														<span className="text-sm">Lunas</span>
													</div>
												) : (
													<div className="w-24">
														{formData?.[item.statusField] ? (
															<Badge className="bg-emerald-100 text-emerald-700 border-0">
																<CheckCircle className="w-3 h-3 mr-1" /> Lunas
															</Badge>
														) : (
															<Badge
																variant="outline"
																className="text-slate-500"
															>
																Belum
															</Badge>
														)}
													</div>
												)}
											</div>
										</div>
										<div>
											<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
												Bukti Bayar {item.label} (PDF)
											</label>
											<DocumentUpload
												studentId={studentId}
												panel="finance"
												documentKey={item.docKey}
												canEdit={canEdit}
												onUploadSuccess={onUpdate}
											/>
										</div>
									</div>
								))}
							</div>

							{/* Biaya Administrasi Talangan */}
							<div className="bg-amber-50/50 p-5 border border-amber-200 rounded-lg space-y-4">
								<div className="flex justify-between items-center pb-3 border-b border-amber-200/60">
									<div className="font-bold text-amber-900">
										Biaya Administrasi Talangan
									</div>
									{isEditingUtama ? (
										<div className="flex items-center gap-2">
											<Checkbox
												checked={formData?.adminTalaganStatus}
												onCheckedChange={(c) =>
													handleFieldChange("adminTalaganStatus", !!c)
												}
											/>
											<span className="text-sm font-medium">Lunas</span>
										</div>
									) : formData?.adminTalaganStatus ? (
										<Badge className="bg-emerald-100 text-emerald-700 border-0">
											Lunas
										</Badge>
									) : (
										<Badge variant="outline">Belum Lunas</Badge>
									)}
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div>
										<label className="text-xs text-slate-500 font-semibold block mb-2">
											Nominal
										</label>
										{isEditingUtama ? (
											<Input
												type="number"
												min={0}
												onKeyDown={preventMinus}
												value={formData?.adminTalaganNominal || 0}
												onChange={(e) =>
													handleNumberFieldChange(
														"adminTalaganNominal",
														e.target.value,
													)
												}
											/>
										) : (
											<div className="font-medium">
												{formatRupiah(formData?.adminTalaganNominal || 0)}
											</div>
										)}
									</div>
									<div>
										<label className="text-xs text-slate-500 font-semibold block mb-2">
											Metode
										</label>
										{isEditingUtama ? (
											<Select
												value={formData?.adminTalaganMetode || "transfer"}
												onValueChange={(v) =>
													handleFieldChange("adminTalaganMetode", v)
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Metode" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="transfer">Transfer</SelectItem>
													<SelectItem value="cash">Cash</SelectItem>
												</SelectContent>
											</Select>
										) : (
											<div className="font-medium capitalize">
												{formData?.adminTalaganMetode || "transfer"}
											</div>
										)}
									</div>
									<div>
										<label className="text-xs text-slate-500 font-semibold block mb-2">
											Bank Tujuan
										</label>
										{isEditingUtama ? (
											<Input
												value={formData?.adminTalaganBankTujuan || ""}
												onChange={(e) =>
													handleFieldChange(
														"adminTalaganBankTujuan",
														e.target.value,
													)
												}
											/>
										) : (
											<div className="font-medium">
												{formData?.adminTalaganBankTujuan || "-"}
											</div>
										)}
									</div>
								</div>

								<div className="pt-2 border-t border-amber-200/60">
									<label className="text-[11px] font-semibold text-slate-600 block mb-1 uppercase tracking-wider">
										Bukti Bayar Administrasi Talangan (PDF)
									</label>
									<DocumentUpload
										studentId={studentId}
										panel="finance"
										documentKey="admin_talangan"
										canEdit={canEdit}
										onUploadSuccess={onUpdate}
									/>
								</div>
							</div>
						</div>
					)}

					{/* Custom Fields Pembayaran Utama */}
					{customData.filter((f) => f.fieldType === "pembayaran_utama").length >
						0 && (
						<div className="mt-6 space-y-3">
							<h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">
								Item Tambahan Utama
							</h4>
							<div className="grid gap-3">
								{customData
									.filter((f) => f.fieldType === "pembayaran_utama")
									.map((f) => (
										<div
											key={f.id}
											className="bg-slate-50 p-4 border border-slate-200 rounded-lg shadow-sm space-y-3"
										>
											<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-200/60">
												<div className="font-medium text-slate-700 flex items-center">
													{f.label}
													{canEdit && (
														<Button
															variant="ghost"
															size="icon"
															onClick={() => triggerDeleteCustomField(f.id)}
															className="h-6 w-6 ml-2 text-rose-500 hover:bg-rose-100 hover:text-rose-700"
															title="Hapus Permanen"
														>
															<Trash2 className="w-3.5 h-3.5" />
														</Button>
													)}
												</div>
												<div className="flex items-center gap-6">
													{isEditingUtama ? (
														<Input
															type="number"
															min={0}
															onKeyDown={preventMinus}
															className="w-32 text-right"
															value={f.nominal || 0}
															onChange={(e) =>
																handleCustomNumberFieldChange(
																	f.id,
																	"nominal",
																	e.target.value,
																)
															}
														/>
													) : (
														<div className="font-semibold text-slate-800 w-32 text-right">
															{formatRupiah(f.nominal || 0)}
														</div>
													)}
													{isEditingUtama ? (
														<div className="flex items-center gap-2 w-24">
															<Checkbox
																checked={f.status}
																onCheckedChange={(c) =>
																	handleCustomFieldChange(f.id, "status", !!c)
																}
															/>
															<span className="text-sm">Lunas</span>
														</div>
													) : (
														<div className="w-24">
															{f.status ? (
																<Badge className="bg-emerald-100 text-emerald-700 border-0">
																	<CheckCircle className="w-3 h-3 mr-1" /> Lunas
																</Badge>
															) : (
																<Badge
																	variant="outline"
																	className="text-slate-500"
																>
																	Belum
																</Badge>
															)}
														</div>
													)}
												</div>
											</div>
											<div>
												<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
													Bukti Bayar {f.label} (PDF)
												</label>
												<DocumentUpload
													studentId={studentId}
													panel="finance"
													documentKey={`custom_${f.id}`}
													canEdit={canEdit}
													onUploadSuccess={onUpdate}
												/>
											</div>
										</div>
									))}
							</div>
						</div>
					)}

					{isEditingUtama && (
						<Button
							variant="outline"
							className="w-full border-dashed bg-slate-50 hover:bg-slate-100"
							onClick={() => triggerAddCustomField("pembayaran_utama")}
						>
							<Plus className="w-4 h-4 mr-2" /> Tambah Item Tagihan
						</Button>
					)}
				</CardContent>
			</Card>

			{/* Biaya Tambahan */}
			<Card className="border-0 shadow-sm ring-1 ring-slate-200">
				<CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
					<CardTitle className="text-base font-bold text-slate-800 flex items-center">
						<div className="w-2 h-6 bg-rose-500 rounded-full mr-3"></div>
						Biaya Tambahan Lainnya
					</CardTitle>
					<div className="flex items-center gap-2">
						{canEdit && !isEditingTambahan && (
							<Button
								size="sm"
								onClick={() => setIsEditingTambahan(true)}
								className="bg-slate-800 hover:bg-slate-700"
							>
								<Edit className="w-4 h-4 mr-2" /> Edit Data
							</Button>
						)}
						{isEditingTambahan && (
							<>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleCancelEdit("tambahan")}
									disabled={loadingTambahan}
								>
									<X className="w-4 h-4 mr-2" /> Batal
								</Button>
								<Button
									size="sm"
									onClick={() => triggerSave("tambahan")}
									disabled={loadingTambahan}
									className="bg-emerald-600 hover:bg-emerald-700"
								>
									{loadingTambahan ? (
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									) : (
										<Save className="w-4 h-4 mr-2" />
									)}
									Simpan
								</Button>
							</>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-6 space-y-4 bg-white">
					{/* Fixed Additional Costs */}
					<div className="grid gap-4">
						{[
							{
								label: "Ujian TOEIC",
								docKey: "toeic",
								nomField: "toeicNominal",
								statusField: "toeicStatus",
							},
							{
								label: "Pembuatan Paspor",
								docKey: "paspor",
								nomField: "pasporNominal",
								statusField: "pasporStatus",
							},
						].map((item, idx) => (
							<div
								key={idx}
								className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm space-y-3"
							>
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100">
									<div className="font-medium text-slate-700">{item.label}</div>
									<div className="flex items-center gap-6">
										{isEditingTambahan ? (
											<Input
												type="number"
												min={0}
												onKeyDown={preventMinus}
												className="w-32 text-right"
												value={formData?.[item.nomField] || 0}
												onChange={(e) =>
													handleNumberFieldChange(item.nomField, e.target.value)
												}
											/>
										) : (
											<div className="font-semibold text-slate-800 w-32 text-right">
												{formatRupiah(formData?.[item.nomField] || 0)}
											</div>
										)}

										{isEditingTambahan ? (
											<div className="flex items-center gap-2 w-24">
												<Checkbox
													checked={formData?.[item.statusField]}
													onCheckedChange={(c) =>
														handleFieldChange(item.statusField, !!c)
													}
												/>
												<span className="text-sm">Lunas</span>
											</div>
										) : (
											<div className="w-24">
												{formData?.[item.statusField] ? (
													<Badge className="bg-emerald-100 text-emerald-700 border-0">
														<CheckCircle className="w-3 h-3 mr-1" /> Lunas
													</Badge>
												) : (
													<Badge variant="outline" className="text-slate-500">
														Belum
													</Badge>
												)}
											</div>
										)}
									</div>
								</div>
								<div>
									<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
										Bukti Bayar {item.label} (PDF)
									</label>
									<DocumentUpload
										studentId={studentId}
										panel="finance"
										documentKey={item.docKey}
										canEdit={canEdit}
										onUploadSuccess={onUpdate}
									/>
								</div>
							</div>
						))}
					</div>

					{/* Rumah Juang */}
					<div
						className={`p-4 border rounded-lg shadow-sm space-y-3 ${pmbState?.rumahJuang ? "bg-amber-50/50 border-amber-200" : "bg-slate-50 border-slate-200 opacity-60"}`}
					>
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-amber-200/60">
							<div className="font-medium text-slate-800 flex items-center gap-2">
								Fasilitas Rumah Juang
								{pmbState?.rumahJuang ? (
									<Badge className="bg-amber-100 text-amber-700 border-0">
										Aktif Digunakan
									</Badge>
								) : (
									<Badge variant="outline" className="bg-white">
										Non-Aktif
									</Badge>
								)}
							</div>
							<div className="flex items-center gap-6">
								{isEditingTambahan ? (
									<Input
										type="number"
										min={0}
										onKeyDown={preventMinus}
										className="w-32 text-right bg-white"
										value={formData?.rumahJuangNominal || 0}
										onChange={(e) =>
											handleNumberFieldChange(
												"rumahJuangNominal",
												e.target.value,
											)
										}
										disabled={!pmbState?.rumahJuang}
									/>
								) : (
									<div className="font-semibold text-slate-800 w-32 text-right">
										{formatRupiah(formData?.rumahJuangNominal || 0)}
									</div>
								)}

								{isEditingTambahan ? (
									<div className="flex items-center gap-2 w-24">
										<Checkbox
											checked={formData?.rumahJuangStatus}
											onCheckedChange={(c) =>
												handleFieldChange("rumahJuangStatus", !!c)
											}
											disabled={!pmbState?.rumahJuang}
										/>
										<span className="text-sm">Lunas</span>
									</div>
								) : (
									<div className="w-24">
										{formData?.rumahJuangStatus ? (
											<Badge className="bg-emerald-100 text-emerald-700 border-0">
												<CheckCircle className="w-3 h-3 mr-1" /> Lunas
											</Badge>
										) : (
											<Badge variant="outline" className="text-slate-500">
												Belum
											</Badge>
										)}
									</div>
								)}
							</div>
						</div>
						<div>
							<label className="text-[11px] font-semibold text-slate-600 block mb-1 uppercase tracking-wider">
								Bukti Bayar Rumah Juang (PDF)
							</label>
							{pmbState?.rumahJuang ? (
								<DocumentUpload
									studentId={studentId}
									panel="finance"
									documentKey="rumah_juang"
									canEdit={canEdit}
									onUploadSuccess={onUpdate}
								/>
							) : (
								<div className="text-xs text-slate-400 italic bg-slate-100 p-2.5 rounded border border-slate-200">
									Upload berkas tidak aktif karena fasilitas Rumah Juang
									mahasiswa ini berstatus Non-Aktif.
								</div>
							)}
						</div>
					</div>

					{/* Custom Fields Biaya Tambahan */}
					{customData.filter((f) => f.fieldType === "biaya_tambahan").length >
						0 && (
						<div className="mt-4 grid gap-3">
							{customData
								.filter((f) => f.fieldType === "biaya_tambahan")
								.map((f) => (
									<div
										key={f.id}
										className="bg-slate-50 p-4 border border-slate-200 rounded-lg shadow-sm space-y-3"
									>
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-200/60">
											<div className="font-medium text-slate-700 flex items-center">
												{f.label}
												{canEdit && (
													<Button
														variant="ghost"
														size="icon"
														onClick={() => triggerDeleteCustomField(f.id)}
														className="h-6 w-6 ml-2 text-rose-500 hover:bg-rose-100 hover:text-rose-700"
														title="Hapus Permanen"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</Button>
												)}
											</div>
											<div className="flex items-center gap-6">
												{isEditingTambahan ? (
													<Input
														type="number"
														min={0}
														onKeyDown={preventMinus}
														className="w-32 text-right"
														value={f.nominal || 0}
														onChange={(e) =>
															handleCustomNumberFieldChange(
																f.id,
																"nominal",
																e.target.value,
															)
														}
													/>
												) : (
													<div className="font-semibold text-slate-800 w-32 text-right">
														{formatRupiah(f.nominal || 0)}
													</div>
												)}
												{isEditingTambahan ? (
													<div className="flex items-center gap-2 w-24">
														<Checkbox
															checked={f.status}
															onCheckedChange={(c) =>
																handleCustomFieldChange(f.id, "status", !!c)
															}
														/>
														<span className="text-sm">Lunas</span>
													</div>
												) : (
													<div className="w-24">
														{f.status ? (
															<Badge className="bg-emerald-100 text-emerald-700 border-0">
																<CheckCircle className="w-3 h-3 mr-1" /> Lunas
															</Badge>
														) : (
															<Badge
																variant="outline"
																className="text-slate-500"
															>
																Belum
															</Badge>
														)}
													</div>
												)}
											</div>
										</div>
										<div>
											<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
												Bukti Bayar {f.label} (PDF)
											</label>
											<DocumentUpload
												studentId={studentId}
												panel="finance"
												documentKey={`custom_${f.id}`}
												canEdit={canEdit}
												onUploadSuccess={onUpdate}
											/>
										</div>
									</div>
								))}
						</div>
					)}

					{isEditingTambahan && (
						<Button
							variant="outline"
							className="w-full border-dashed bg-slate-50 hover:bg-slate-100"
							onClick={() => triggerAddCustomField("biaya_tambahan")}
						>
							<Plus className="w-4 h-4 mr-2" /> Tambah Biaya Lainnya
						</Button>
					)}
				</CardContent>
			</Card>

			{/* Dialogs */}

			<AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Konfirmasi Simpan Data</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menyimpan perubahan data keuangan ini ke
							server? Pastikan nominal yang dimasukkan sudah benar.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={loadingUtama || loadingTambahan}>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmSave}
							disabled={loadingUtama || loadingTambahan}
							className="bg-emerald-600 hover:bg-emerald-700"
						>
							{loadingUtama || loadingTambahan ? (
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							) : null}
							Simpan Perubahan
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Item Biaya</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus item biaya tambahan ini secara
							permanen?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeletingField}>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDeleteCustomField}
							disabled={isDeletingField}
							className="bg-rose-600 hover:bg-rose-700"
						>
							{isDeletingField ? (
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							) : null}
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog open={addPromptOpen} onOpenChange={setAddPromptOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tambah Item Tagihan Baru</DialogTitle>
						<DialogDescription>
							Masukkan nama biaya tambahan (misal: "Seragam", "Asuransi", dll).
							Nominal dapat diatur setelah item ditambahkan.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Input
							placeholder="Nama item biaya..."
							value={newFieldLabel}
							onChange={(e) => setNewFieldLabel(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									confirmAddCustomField();
								}
							}}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setAddPromptOpen(false)}
							disabled={isAddingField}
						>
							Batal
						</Button>
						<Button
							onClick={confirmAddCustomField}
							disabled={isAddingField || !newFieldLabel.trim()}
							className="bg-emerald-600 hover:bg-emerald-700"
						>
							{isAddingField ? (
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							) : null}
							Tambahkan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
