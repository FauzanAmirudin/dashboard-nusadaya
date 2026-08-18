"use client";

import {
	AlertCircle,
	AlertTriangle,
	Award,
	Banknote,
	Building,
	Calendar,
	CheckCircle,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	CreditCard,
	Edit,
	Eye,
	FileText,
	GraduationCap,
	Home,
	Languages,
	Loader2,
	Lock,
	Paperclip,
	PieChart,
	Plane,
	Plus,
	Save,
	SlidersHorizontal,
	Sparkles,
	Trash2,
	UploadCloud,
	Wallet,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

interface StagedDocUploadProps {
	docKey: string;
	isEditing: boolean;
	canEdit: boolean;
	existingDocs?: any[];
	stagedFile?: File | null;
	isDeleted?: boolean;
	onStageFile: (file: File) => void;
	onRemoveStagedFile: () => void;
	onDeleteExistingDoc: () => void;
	onRestoreExistingDoc: () => void;
}

function StagedDocumentUpload({
	isEditing,
	canEdit,
	existingDocs,
	stagedFile,
	isDeleted,
	onStageFile,
	onRemoveStagedFile,
	onDeleteExistingDoc,
	onRestoreExistingDoc,
}: StagedDocUploadProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const latestDoc =
		existingDocs && existingDocs.length > 0 ? existingDocs[0] : null;

	if (stagedFile) {
		return (
			<div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
				<div className="flex items-center gap-2 text-xs font-medium text-emerald-800 truncate">
					<Paperclip className="w-4 h-4 text-emerald-600 flex-shrink-0" />
					<span className="truncate font-semibold">{stagedFile.name}</span>
					<span className="text-[10px] text-emerald-600">
						({(stagedFile.size / 1024).toFixed(1)} KB)
					</span>
					<Badge className="bg-emerald-200/80 text-emerald-800 border-0 text-[9px] py-0 px-1.5 h-4 font-semibold">
						Draft Baru
					</Badge>
				</div>
				{isEditing && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
						onClick={onRemoveStagedFile}
					>
						<Trash2 className="w-3.5 h-3.5 mr-1" /> Batalkan
					</Button>
				)}
			</div>
		);
	}

	if (isDeleted) {
		return (
			<div className="flex items-center justify-between p-3 bg-rose-50/70 border border-dashed border-rose-200 rounded-lg">
				<div className="flex items-center gap-2 text-xs font-medium text-rose-700">
					<Trash2 className="w-4 h-4 flex-shrink-0" />
					<span className="italic">Berkas ditandai untuk dihapus (Draft)</span>
				</div>
				{isEditing && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-100"
						onClick={onRestoreExistingDoc}
					>
						Batalkan Hapus
					</Button>
				)}
			</div>
		);
	}

	if (latestDoc) {
		return (
			<div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
				<div className="flex items-center gap-2 text-xs font-medium text-slate-700 truncate">
					<FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
					<span className="truncate font-medium">
						{latestDoc.fileName || "Berkas Terlampir"}
					</span>
					{latestDoc.fileSize && (
						<span className="text-[10px] text-slate-400">
							({(latestDoc.fileSize / 1024).toFixed(1)} KB)
						</span>
					)}
				</div>
				<div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
					<a
						href={`${API_URL}${latestDoc.fileUrl.startsWith("/") ? "" : "/"}${latestDoc.fileUrl}`}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
					>
						<Eye className="w-3.5 h-3.5" /> Lihat Berkas
					</a>
					{isEditing && canEdit && (
						<>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100"
								onClick={() => fileInputRef.current?.click()}
							>
								Ganti
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
								onClick={onDeleteExistingDoc}
							>
								<Trash2 className="w-3.5 h-3.5" />
							</Button>
							<input
								ref={fileInputRef}
								type="file"
								accept="application/pdf,image/*"
								className="hidden"
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) onStageFile(f);
								}}
							/>
						</>
					)}
				</div>
			</div>
		);
	}

	if (!isEditing) {
		return (
			<div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400 italic">
				Belum ada berkas terunggah
			</div>
		);
	}

	return (
		<div>
			<input
				ref={fileInputRef}
				type="file"
				accept="application/pdf,image/*"
				className="hidden"
				onChange={(e) => {
					const f = e.target.files?.[0];
					if (f) onStageFile(f);
				}}
			/>
			<button
				type="button"
				onClick={() => fileInputRef.current?.click()}
				className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 rounded-lg transition-colors text-xs font-medium text-slate-600 hover:text-blue-700 cursor-pointer"
			>
				<UploadCloud className="w-4 h-4 text-slate-400" />
				<span>Pilih Berkas (PDF / Gambar)</span>
			</button>
		</div>
	);
}

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

	// Semester States
	const [semesters, setSemesters] = useState<any[]>([]);
	const [loadingSemesters, setLoadingSemesters] = useState(false);
	const [expandedSemesters, setExpandedSemesters] = useState<number[]>([]);

	// Add Installment Modal
	const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
	const [activeSemester, setActiveSemester] = useState<any>(null);
	const [activeInstallment, setActiveInstallment] = useState<any>(null);
	const [installmentLoading, setInstallmentLoading] = useState(false);
	const [installmentForm, setInstallmentForm] = useState<{
		nominalPaid: string;
		paymentDate: string;
		notes: string;
		isTalangan: boolean;
		file: File | null;
		buktiBayarUrl: string;
	}>({
		nominalPaid: "",
		paymentDate: new Date().toISOString().split("T")[0],
		notes: "",
		isTalangan: false,
		file: null,
		buktiBayarUrl: "",
	});

	const [deletedInstallments, setDeletedInstallments] = useState<
		Array<{ semesterId: number; installmentId: number }>
	>([]);

	// Talangan Installments State (Tahap 1 & Tahap 2)
	const [talanganInstallments, setTalanganInstallments] = useState<any[]>([]);
	const [loadingTalanganInstallments, setLoadingTalanganInstallments] =
		useState(false);
	const [deletedTalanganInstallmentIds, setDeletedTalanganInstallmentIds] =
		useState<number[]>([]);
	const [talanganModalOpen, setTalanganModalOpen] = useState(false);
	const [activeTalanganStage, setActiveTalanganStage] = useState<
		"tahap_1" | "tahap_2"
	>("tahap_1");
	const [activeTalanganInstallment, setActiveTalanganInstallment] =
		useState<any>(null);
	const [talanganInstallmentForm, setTalanganInstallmentForm] = useState<{
		nominalPaid: string;
		paymentDate: string;
		notes: string;
		file: File | null;
		buktiBayarUrl: string;
	}>({
		nominalPaid: "",
		paymentDate: new Date().toISOString().split("T")[0],
		notes: "",
		file: null,
		buktiBayarUrl: "",
	});

	const [financeDocs, setFinanceDocs] = useState<Record<string, any[]>>({});
	const [stagedDocsUtama, setStagedDocsUtama] = useState<
		Record<string, File | null>
	>({});
	const [deletedDocKeysUtama, setDeletedDocKeysUtama] = useState<string[]>([]);
	const [stagedDocsTambahan, setStagedDocsTambahan] = useState<
		Record<string, File | null>
	>({});
	const [deletedDocKeysTambahan, setDeletedDocKeysTambahan] = useState<
		string[]
	>([]);

	// Partition Modal States
	const [partitionModalOpen, setPartitionModalOpen] = useState(false);
	const [partitionSaving, setPartitionSaving] = useState(false);
	const [partitionTotalBiaya, setPartitionTotalBiaya] = useState<number>(0);
	const [partitionRegistrasi, setPartitionRegistrasi] = useState<number>(0);
	const [partitionSemesterPerSem, setPartitionSemesterPerSem] =
		useState<number>(0);
	const [partitionSemesterTotal, setPartitionSemesterTotal] =
		useState<number>(0);
	const [partitionInterview, setPartitionInterview] = useState<number>(0);
	const [partitionKeberangkatan, setPartitionKeberangkatan] =
		useState<number>(0);
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
		if (
			options.body &&
			!(options.body instanceof FormData) &&
			!headers.has("Content-Type")
		) {
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

	// Fetch semesters
	const fetchSemesters = async () => {
		setLoadingSemesters(true);
		try {
			const res = await fetchApi(`/students/${studentId}/finance/semesters`);
			if (res.ok) {
				const data = await res.json();
				setSemesters(data.data || []);
			}
		} catch (e) {
			console.error("Failed to fetch semesters", e);
		} finally {
			setLoadingSemesters(false);
		}
	};

	// Fetch Finance Documents for auto-status verification
	const fetchFinanceDocs = async () => {
		try {
			const res = await fetchApi(`/students/${studentId}/finance/documents`);
			if (res.ok) {
				const data = await res.json();
				if (data.success && data.data) {
					setFinanceDocs(data.data);
				}
			}
		} catch (e) {
			console.error("Failed to fetch finance documents", e);
		}
	};

	// Fetch Talangan Installments (Tahap 1 & Tahap 2)
	const fetchTalanganInstallments = async () => {
		setLoadingTalanganInstallments(true);
		try {
			const res = await fetchApi(
				`/students/${studentId}/finance/talangan-installments`,
			);
			if (res.ok) {
				const data = await res.json();
				setTalanganInstallments(data.data || []);
			}
		} catch (e) {
			console.error("Failed to fetch talangan installments", e);
		} finally {
			setLoadingTalanganInstallments(false);
		}
	};

	useEffect(() => {
		fetchSemesters();
		fetchFinanceDocs();
		fetchTalanganInstallments();
	}, [studentId]);

	const handleStageDoc = (
		section: "utama" | "tambahan",
		docKey: string,
		file: File,
	) => {
		if (section === "utama") {
			if (!isEditingUtama) {
				toast.error(
					"Silakan klik 'Edit Data' pada Pembayaran Utama terlebih dahulu.",
				);
				return;
			}
			setStagedDocsUtama((prev) => ({ ...prev, [docKey]: file }));
			setDeletedDocKeysUtama((prev) => prev.filter((k) => k !== docKey));
			toast.info(
				`Berkas '${file.name}' masuk ke draft. Klik 'Simpan' pada Pembayaran Utama untuk menyimpan permanen.`,
			);
		} else {
			if (!isEditingTambahan) {
				toast.error(
					"Silakan klik 'Edit Data' pada Biaya Tambahan terlebih dahulu.",
				);
				return;
			}
			setStagedDocsTambahan((prev) => ({ ...prev, [docKey]: file }));
			setDeletedDocKeysTambahan((prev) => prev.filter((k) => k !== docKey));
			toast.info(
				`Berkas '${file.name}' masuk ke draft. Klik 'Simpan' pada Biaya Tambahan untuk menyimpan permanen.`,
			);
		}
	};

	const handleRemoveStagedDoc = (
		section: "utama" | "tambahan",
		docKey: string,
	) => {
		if (section === "utama") {
			setStagedDocsUtama((prev) => {
				const next = { ...prev };
				delete next[docKey];
				return next;
			});
		} else {
			setStagedDocsTambahan((prev) => {
				const next = { ...prev };
				delete next[docKey];
				return next;
			});
		}
	};

	const handleDeleteExistingDoc = (
		section: "utama" | "tambahan",
		docKey: string,
	) => {
		if (section === "utama") {
			if (!isEditingUtama) return;
			setDeletedDocKeysUtama((prev) => [...prev, docKey]);
			setStagedDocsUtama((prev) => {
				const next = { ...prev };
				delete next[docKey];
				return next;
			});
		} else {
			if (!isEditingTambahan) return;
			setDeletedDocKeysTambahan((prev) => [...prev, docKey]);
			setStagedDocsTambahan((prev) => {
				const next = { ...prev };
				delete next[docKey];
				return next;
			});
		}
	};

	const handleRestoreExistingDoc = (
		section: "utama" | "tambahan",
		docKey: string,
	) => {
		if (section === "utama") {
			setDeletedDocKeysUtama((prev) => prev.filter((k) => k !== docKey));
		} else {
			setDeletedDocKeysTambahan((prev) => prev.filter((k) => k !== docKey));
		}
	};

	const toggleSemesterExpand = (num: number) => {
		setExpandedSemesters((prev) =>
			prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num],
		);
	};

	const handleToggleTalangan = (semester: any) => {
		if (!canEdit || !isEditingUtama) return;

		const targetNum = semester.semesterNumber;
		const willBeTalangan = !semester.isTalangan;

		// Cascading rule:
		// - Jika diubah menjadi Talangan: semester target dan SEMUA semester setelahnya (targetNum s.d 6) otomatis menjadi Talangan.
		// - Jika di-uncheck (kembali mandiri): semester target dan semua semester sebelumnya (1 s.d targetNum) menjadi Mandiri.
		const updatedList = semesters.map((s: any) => {
			let nextIsTalangan = s.isTalangan;
			if (willBeTalangan) {
				if (s.semesterNumber >= targetNum) {
					nextIsTalangan = true;
				}
			} else {
				if (s.semesterNumber <= targetNum) {
					nextIsTalangan = false;
				}
			}
			return { ...s, isTalangan: nextIsTalangan };
		});

		setSemesters(updatedList);

		// Hitung total nominal semua semester yang masuk skema Dana Talangan (Tahap 1)
		const totalTalanganSemesters = updatedList
			.filter((s: any) => s.isTalangan)
			.reduce((sum: number, s: any) => sum + (s.totalBilled || 0), 0);

		setFormData((prev: any) => ({
			...prev,
			t1SemesterNominalTotal: totalTalanganSemesters,
		}));
	};

	const handleSaveSemesterBilled = async (
		semester: any,
		totalBilled: number,
	) => {
		if (!canEdit) return;
		try {
			const res = await fetchApi(
				`/students/${studentId}/finance/semesters/${semester.id}`,
				{
					method: "PATCH",
					body: JSON.stringify({ totalBilled }),
				},
			);
			if (res.ok) {
				toast.success(
					`Total tagihan Semester ${semester.semesterNumber} disimpan`,
				);
				await fetchSemesters();
			} else {
				toast.error("Gagal menyimpan nominal");
			}
		} catch (e) {
			toast.error("Terjadi kesalahan");
		}
	};

	const handleSaveGlobalSemesterBilled = async (perSemesterAmount: number) => {
		if (!canEdit || semesters.length === 0) return;
		setLoadingSemesters(true);

		try {
			const promises = semesters.map((sem) =>
				fetchApi(`/students/${studentId}/finance/semesters/${sem.id}`, {
					method: "PATCH",
					body: JSON.stringify({ totalBilled: perSemesterAmount }),
				}),
			);
			const results = await Promise.all(promises);
			const allOk = results.every((r) => r.ok);

			if (allOk) {
				toast.success(
					`Berhasil menerapkan tagihan ${formatRupiah(perSemesterAmount)} ke semua 6 semester`,
				);
				await fetchSemesters();
			} else {
				toast.error("Ada beberapa semester yang gagal diperbarui");
				await fetchSemesters();
			}
		} catch (e) {
			toast.error("Terjadi kesalahan saat menyimpan global tagihan");
			setLoadingSemesters(false);
		}
	};

	const openPartitionModal = () => {
		const curTotalBiaya = finState?.totalBiayaPendidikan || 0;
		const curReg = Number(formData?.registrasiNominal) || 0;
		const curSemPer = semesters.length > 0 ? semesters[0]?.totalBilled || 0 : 0;
		const curSemTot =
			semesters.length > 0
				? semesters.reduce((sum, s) => sum + (s.totalBilled || 0), 0)
				: (Number(formData?.mandiriSemesterNominal) || 0) * 6 ||
					Number(formData?.t1SemesterNominalTotal) ||
					0;
		const curInterview =
			formData?.metodePembayaran === "dana_talangan"
				? Number(formData?.t1InterviewNominal) || 0
				: Number(formData?.mandiriInterviewNominal) || 0;
		const curKeberangkatan =
			formData?.metodePembayaran === "dana_talangan"
				? Number(formData?.t2KeberangkatanNominal) || 0
				: Number(formData?.mandiriKeberangkatanNominal) || 0;

		setPartitionTotalBiaya(curTotalBiaya);
		setPartitionRegistrasi(curReg);
		setPartitionSemesterPerSem(curSemPer || Math.round(curSemTot / 6));
		setPartitionSemesterTotal(curSemTot || curSemPer * 6);
		setPartitionInterview(curInterview);
		setPartitionKeberangkatan(curKeberangkatan);
		setPartitionModalOpen(true);
	};

	const handleSavePartition = async () => {
		if (!canEdit) return;
		setPartitionSaving(true);
		try {
			const regNom = Math.max(0, Number(partitionRegistrasi) || 0);
			const intNom = Math.max(0, Number(partitionInterview) || 0);
			const kebNom = Math.max(0, Number(partitionKeberangkatan) || 0);
			const semPerNom = Math.max(0, Number(partitionSemesterPerSem) || 0);
			const semTotNom = Math.max(0, Number(partitionSemesterTotal) || 0);

			const payload: Record<string, any> = {
				registrasiNominal: regNom,
				mandiriInterviewNominal: intNom,
				t1InterviewNominal: intNom,
				mandiriKeberangkatanNominal: kebNom,
				t2KeberangkatanNominal: kebNom,
				mandiriSemesterNominal: semPerNom,
				t1SemesterNominalTotal: semTotNom,
			};

			const { error } =
				await api.students[studentId.toString()].finance.patch(payload);
			if (error) {
				const errMsg =
					(error as any)?.value?.message ||
					(error as any)?.message ||
					"Gagal menyimpan data partisi keuangan";
				toast.error(errMsg);
				return;
			}

			// Update all semesters totalBilled
			if (semesters.length > 0) {
				const semPromises = semesters.map((sem) =>
					fetchApi(`/students/${studentId}/finance/semesters/${sem.id}`, {
						method: "PATCH",
						body: JSON.stringify({
							totalBilled: semPerNom,
						}),
					}),
				);
				await Promise.all(semPromises);
			}

			// Synchronize local form state immediately so Pembayaran Utama reflects changes
			setFormData((prev: any) => ({
				...prev,
				registrasiNominal: regNom,
				mandiriInterviewNominal: intNom,
				t1InterviewNominal: intNom,
				mandiriKeberangkatanNominal: kebNom,
				t2KeberangkatanNominal: kebNom,
				mandiriSemesterNominal: semPerNom,
				t1SemesterNominalTotal: semTotNom,
			}));

			toast.success(
				"Partisi biaya pendidikan berhasil disimpan & disinkronkan ke Pembayaran Utama!",
			);
			setPartitionModalOpen(false);
			await fetchSemesters();
			onUpdate();
		} catch (err) {
			console.error(err);
			toast.error("Terjadi kesalahan sistem saat menyimpan partisi");
		} finally {
			setPartitionSaving(false);
		}
	};

	const openInstallmentModal = (semester: any, installment: any = null) => {
		if (!isEditingUtama) {
			toast.error(
				"Silakan klik 'Edit Data' pada Pembayaran Utama terlebih dahulu untuk menambah atau mengedit pembayaran.",
			);
			return;
		}
		setActiveSemester(semester);
		setActiveInstallment(installment);
		if (installment) {
			setInstallmentForm({
				nominalPaid: (installment.nominalPaid || 0).toString(),
				paymentDate: installment.paymentDate
					? new Date(installment.paymentDate).toISOString().split("T")[0]
					: new Date().toISOString().split("T")[0],
				notes: installment.notes || "",
				isTalangan: !!installment.isTalangan,
				file: installment.file || null,
				buktiBayarUrl: installment.buktiBayarUrl || "",
			});
		} else {
			setInstallmentForm({
				nominalPaid: "",
				paymentDate: new Date().toISOString().split("T")[0],
				notes: "",
				isTalangan: false,
				file: null,
				buktiBayarUrl: "",
			});
		}
		setInstallmentModalOpen(true);
	};

	const handleSaveInstallment = () => {
		if (!isEditingUtama) {
			toast.error(
				"Silakan klik 'Edit Data' pada Pembayaran Utama terlebih dahulu.",
			);
			return;
		}
		if (
			!activeSemester ||
			(!installmentForm.nominalPaid && !installmentForm.isTalangan)
		)
			return;

		const isEdit = !!activeInstallment;
		const nomPaid = Number(installmentForm.nominalPaid) || 0;

		setSemesters((prev) =>
			prev.map((s) => {
				if (s.id !== activeSemester.id) return s;

				let updatedInstallments: any[];
				if (isEdit) {
					updatedInstallments = (s.installments || []).map((inst: any) => {
						if (inst.id === activeInstallment.id) {
							return {
								...inst,
								nominalPaid: nomPaid,
								paymentDate: installmentForm.paymentDate,
								notes: installmentForm.notes || undefined,
								isTalangan: installmentForm.isTalangan,
								file: installmentForm.file || inst.file,
								buktiBayarUrl:
									installmentForm.buktiBayarUrl || inst.buktiBayarUrl,
								isModified: !String(inst.id).startsWith("temp_"),
							};
						}
						return inst;
					});
				} else {
					const instNumber = (s.installments || []).length + 1;
					const newInst = {
						id: `temp_${Date.now()}_${Math.random()}`,
						semesterId: s.id,
						installmentNumber: instNumber,
						nominalPaid: nomPaid,
						paymentDate: installmentForm.paymentDate,
						notes: installmentForm.notes || undefined,
						isTalangan: installmentForm.isTalangan,
						file: installmentForm.file,
						buktiBayarUrl: installmentForm.buktiBayarUrl || "",
						isNew: true,
					};
					updatedInstallments = [...(s.installments || []), newInst];
				}

				const totalPaid = updatedInstallments.reduce(
					(sum: number, inst: any) => sum + (inst.nominalPaid || 0),
					0,
				);
				let newStatus = s.status;
				if (s.isTalangan) newStatus = "LUNAS";
				else if (totalPaid === 0) newStatus = "BELUM_BAYAR";
				else if (totalPaid >= (s.totalBilled || 0)) newStatus = "LUNAS";
				else newStatus = "SEBAGIAN";

				return {
					...s,
					installments: updatedInstallments,
					status: newStatus,
				};
			}),
		);

		toast.info(
			isEdit
				? "Perubahan pembayaran dicatat. Klik 'Simpan' pada Pembayaran Utama untuk menyimpan permanen."
				: "Pembayaran dicatat ke draft. Klik 'Simpan' pada Pembayaran Utama untuk menyimpan permanen.",
		);
		setInstallmentModalOpen(false);
	};

	const handleDeleteInstallment = (semesterId: number, installmentId: any) => {
		if (!isEditingUtama) {
			toast.error(
				"Silakan klik 'Edit Data' pada Pembayaran Utama terlebih dahulu untuk menghapus pembayaran.",
			);
			return;
		}

		// Jika data sudah pernah tersimpan di database (bukan ID temp lokal)
		if (
			typeof installmentId === "number" ||
			!String(installmentId).startsWith("temp_")
		) {
			setDeletedInstallments((prev) => [
				...prev,
				{ semesterId, installmentId: Number(installmentId) },
			]);
		}

		setSemesters((prev) =>
			prev.map((s) => {
				if (s.id !== semesterId) return s;
				const updatedInstallments = (s.installments || []).filter(
					(inst: any) => inst.id !== installmentId,
				);
				const totalPaid = updatedInstallments.reduce(
					(sum: number, inst: any) => sum + (inst.nominalPaid || 0),
					0,
				);
				let newStatus = s.status;
				if (s.isTalangan) newStatus = "LUNAS";
				else if (totalPaid === 0) newStatus = "BELUM_BAYAR";
				else if (totalPaid >= (s.totalBilled || 0)) newStatus = "LUNAS";
				else newStatus = "SEBAGIAN";

				return {
					...s,
					installments: updatedInstallments,
					status: newStatus,
				};
			}),
		);

		toast.info(
			"Pembayaran dihapus dari draft. Klik 'Simpan' pada Pembayaran Utama untuk menyimpan permanen.",
		);
	};

	const handleOpenAddTalanganPayment = (stage: "tahap_1" | "tahap_2") => {
		if (!isEditingUtama) {
			toast.error(
				"Silakan klik 'Edit Data' pada Pembayaran Utama terlebih dahulu untuk menambah pembayaran.",
			);
			return;
		}
		setActiveTalanganStage(stage);
		setActiveTalanganInstallment(null);
		setTalanganInstallmentForm({
			nominalPaid: "",
			paymentDate: new Date().toISOString().split("T")[0],
			notes: "",
			file: null,
			buktiBayarUrl: "",
		});
		setTalanganModalOpen(true);
	};

	const handleOpenEditTalanganPayment = (inst: any) => {
		if (!isEditingUtama) {
			toast.error(
				"Silakan klik 'Edit Data' pada Pembayaran Utama terlebih dahulu untuk mengedit pembayaran.",
			);
			return;
		}
		setActiveTalanganStage(inst.stage);
		setActiveTalanganInstallment(inst);
		setTalanganInstallmentForm({
			nominalPaid: String(inst.nominalPaid || ""),
			paymentDate: inst.paymentDate
				? new Date(inst.paymentDate).toISOString().split("T")[0]
				: new Date().toISOString().split("T")[0],
			notes: inst.notes || "",
			file: inst.file || null,
			buktiBayarUrl: inst.buktiBayarUrl || "",
		});
		setTalanganModalOpen(true);
	};

	const handleDeleteTalanganPayment = (inst: any) => {
		if (!isEditingUtama) {
			toast.error(
				"Silakan klik 'Edit Data' pada Pembayaran Utama terlebih dahulu untuk menghapus pembayaran.",
			);
			return;
		}
		if (typeof inst.id === "number" || !String(inst.id).startsWith("temp_")) {
			setDeletedTalanganInstallmentIds((prev) => [...prev, Number(inst.id)]);
		}
		setTalanganInstallments((prev) => prev.filter((i) => i.id !== inst.id));
		toast.info(
			"Pembayaran dihapus dari draft. Klik 'Simpan' pada Pembayaran Utama untuk menyimpan permanen.",
		);
	};

	const handleSaveTalanganInstallment = () => {
		if (!isEditingUtama) {
			toast.error(
				"Silakan klik 'Edit Data' pada Pembayaran Utama terlebih dahulu.",
			);
			return;
		}
		const nomPaid = Number(talanganInstallmentForm.nominalPaid) || 0;
		if (nomPaid <= 0) {
			toast.error("Nominal pembayaran harus lebih dari 0.");
			return;
		}

		const isEdit = !!activeTalanganInstallment;
		if (isEdit) {
			setTalanganInstallments((prev) =>
				prev.map((i) => {
					if (i.id === activeTalanganInstallment.id) {
						return {
							...i,
							nominalPaid: nomPaid,
							paymentDate: talanganInstallmentForm.paymentDate,
							notes: talanganInstallmentForm.notes,
							file: talanganInstallmentForm.file || i.file,
							buktiBayarUrl:
								talanganInstallmentForm.buktiBayarUrl || i.buktiBayarUrl,
							isModified: !String(i.id).startsWith("temp_"),
						};
					}
					return i;
				}),
			);
		} else {
			const stageInsts = talanganInstallments.filter(
				(i) => i.stage === activeTalanganStage,
			);
			const newInst = {
				id: `temp_${Date.now()}_${Math.random()}`,
				studentId,
				stage: activeTalanganStage,
				installmentNumber: stageInsts.length + 1,
				nominalPaid: nomPaid,
				paymentDate: talanganInstallmentForm.paymentDate,
				notes: talanganInstallmentForm.notes,
				file: talanganInstallmentForm.file,
				buktiBayarUrl: talanganInstallmentForm.buktiBayarUrl || "",
				isNew: true,
			};
			setTalanganInstallments((prev) => [...prev, newInst]);
		}

		setTalanganModalOpen(false);
		toast.info(
			isEdit
				? "Perubahan pembayaran dicatat ke draf. Klik 'Simpan' untuk menyimpan permanen."
				: "Pembayaran dicatat ke draf. Klik 'Simpan' untuk menyimpan permanen.",
		);
	};

	const handleFieldChange = (field: string, value: any) => {
		if (typeof value === "number") {
			value = Math.max(0, value);
		}
		setFormData((prev: any) => ({ ...prev, [field]: value }));
	};

	const handleNumberFieldChange = (field: string, rawVal: any) => {
		if (rawVal === "" || rawVal === undefined || rawVal === null) {
			setFormData((prev: any) => ({ ...prev, [field]: "" }));
			return;
		}
		const parsed = Number(rawVal);
		const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
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
		if (rawVal === "" || rawVal === undefined || rawVal === null) {
			setCustomData((prev) =>
				prev.map((c) => (c.id === id ? { ...c, [field]: "" } : c)),
			);
			return;
		}
		const parsed = Number(rawVal);
		const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
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

		if (section === "utama") {
			sanitizedFormData.registrasiStatus = hasRegistrasiDoc;
			sanitizedFormData.mandiriSemesterStatus = semestersLunasCount === 6;
			if (formData?.metodePembayaran === "mandiri") {
				sanitizedFormData.mandiriInterviewStatus = hasMandiriInterviewDoc;
				sanitizedFormData.mandiriKeberangkatanStatus =
					hasMandiriKeberangkatanDoc;
			} else if (formData?.metodePembayaran === "dana_talangan") {
				sanitizedFormData.t1InterviewStatus = isTahap1Lunas;
				sanitizedFormData.t1SemesterStatus = isTahap1Lunas;
				sanitizedFormData.t2KeberangkatanStatus = isTahap2Lunas;
				sanitizedFormData.adminTalaganStatus = hasAdminTalanganDoc;
				sanitizedFormData.t1SemesterNominalTotal = t1SemesterNominal;
				sanitizedFormData.t1SemesterNominalDibayar = t1Paid;
			}
		} else if (section === "tambahan") {
			sanitizedFormData.toeicStatus = hasToeicDoc;
			sanitizedFormData.pasporStatus = hasPasporDoc;
			sanitizedFormData.rumahJuangStatus = hasRumahJuangDoc;
		}

		const sanitizedCustomData = customData.map((c) => {
			const hasDoc =
				!!stagedDocsUtama[`custom_${c.id}`] ||
				!!stagedDocsTambahan[`custom_${c.id}`] ||
				(((financeDocs[`custom_${c.id}`]?.length ?? 0) > 0 || !!c.status) &&
					!deletedDocKeysUtama.includes(`custom_${c.id}`) &&
					!deletedDocKeysTambahan.includes(`custom_${c.id}`));
			return {
				...c,
				nominal: Math.max(0, Number(c.nominal) || 0),
				status: hasDoc,
			};
		});

		try {
			const { error } =
				await api.students[studentId.toString()].finance.patch(
					sanitizedFormData,
				);

			if (section === "utama") {
				// 1. Eksekusi penghapusan cicilan semester yang ditandai delete di draft
				for (const item of deletedInstallments) {
					try {
						await fetchApi(
							`/students/${studentId}/finance/semesters/${item.semesterId}/installments/${item.installmentId}`,
							{ method: "DELETE" },
						);
					} catch (delErr) {
						console.error("Failed to delete installment", delErr);
					}
				}
				setDeletedInstallments([]);

				// 2. Eksekusi penghapusan dokumen utama yang ditandai delete di draft
				for (const docKey of deletedDocKeysUtama) {
					const docs = financeDocs[docKey] || [];
					for (const doc of docs) {
						try {
							await fetchApi(
								`/students/${studentId}/finance/documents/${doc.id}`,
								{
									method: "DELETE",
								},
							);
						} catch (delDocErr) {
							console.error("Failed to delete document", delDocErr);
						}
					}
				}
				setDeletedDocKeysUtama([]);

				// 3. Eksekusi upload dokumen utama yang di-stage di draft
				for (const [docKey, file] of Object.entries(stagedDocsUtama)) {
					if (file) {
						const uploadFormData = new FormData();
						uploadFormData.append("file", file);
						uploadFormData.append("documentKey", docKey);

						try {
							await fetchApi(`/students/${studentId}/finance/documents`, {
								method: "POST",
								body: uploadFormData,
							});
						} catch (uploadDocErr) {
							console.error("Failed to upload staged doc", uploadDocErr);
						}
					}
				}
				setStagedDocsUtama({});

				// 4. Simpan status/partisi semester dan cicilannya
				for (const sem of semesters) {
					// Patch isTalangan & totalBilled pada semester
					await fetchApi(`/students/${studentId}/finance/semesters/${sem.id}`, {
						method: "PATCH",
						body: JSON.stringify({
							isTalangan: sem.isTalangan,
							totalBilled: sem.totalBilled,
						}),
					});

					// Process cicilan pada semester ini
					for (const inst of sem.installments || []) {
						let uploadedBuktiUrl = inst.buktiBayarUrl || "";

						// Jika ada file bukti bayar baru yang diunggah
						if (inst.file) {
							const uploadFormData = new FormData();
							uploadFormData.append("file", inst.file);
							uploadFormData.append(
								"documentKey",
								`semester_${sem.semesterNumber}_pembayaran_${inst.installmentNumber}`,
							);

							try {
								const uploadRes = await fetchApi(
									`/students/${studentId}/finance/documents`,
									{
										method: "POST",
										body: uploadFormData,
									},
								);
								if (uploadRes.ok) {
									const uploadJson = await uploadRes.json();
									if (uploadJson.fileUrl) {
										uploadedBuktiUrl = uploadJson.fileUrl;
									}
								}
							} catch (uploadErr) {
								console.error("Failed to upload installment file", uploadErr);
							}
						}

						// Cicilan baru yang perlu di-insert
						if (inst.isNew || String(inst.id).startsWith("temp_")) {
							await fetchApi(
								`/students/${studentId}/finance/semesters/${sem.id}/installments`,
								{
									method: "POST",
									body: JSON.stringify({
										nominalPaid: Number(inst.nominalPaid) || 0,
										paymentDate: inst.paymentDate,
										notes: inst.notes || undefined,
										isTalangan: !!inst.isTalangan,
										buktiBayarUrl: uploadedBuktiUrl || undefined,
									}),
								},
							);
						} else if (inst.isModified) {
							// Cicilan lama yang di-update
							await fetchApi(
								`/students/${studentId}/finance/semesters/${sem.id}/installments/${inst.id}`,
								{
									method: "PATCH",
									body: JSON.stringify({
										nominalPaid: Number(inst.nominalPaid) || 0,
										paymentDate: inst.paymentDate,
										notes: inst.notes || undefined,
										isTalangan: !!inst.isTalangan,
										buktiBayarUrl: uploadedBuktiUrl || undefined,
									}),
								},
							);
						}
					}
				}

				// 5. Eksekusi penghapusan cicilan dana talangan (Tahap 1 & Tahap 2)
				for (const delId of deletedTalanganInstallmentIds) {
					try {
						await fetchApi(
							`/students/${studentId}/finance/talangan-installments/${delId}`,
							{ method: "DELETE" },
						);
					} catch (delTalErr) {
						console.error("Failed to delete talangan installment", delTalErr);
					}
				}
				setDeletedTalanganInstallmentIds([]);

				// 6. Eksekusi simpan/update cicilan dana talangan (Tahap 1 & Tahap 2)
				for (const inst of talanganInstallments) {
					let uploadedBuktiUrl = inst.buktiBayarUrl || "";
					if (inst.file) {
						const uploadFormData = new FormData();
						uploadFormData.append("file", inst.file);
						uploadFormData.append(
							"documentKey",
							`talangan_${inst.stage}_pembayaran_${inst.installmentNumber}`,
						);
						try {
							const upRes = await fetchApi(
								`/students/${studentId}/finance/documents`,
								{
									method: "POST",
									body: uploadFormData,
								},
							);
							if (upRes.ok) {
								const upJson = await upRes.json();
								if (upJson.fileUrl) {
									uploadedBuktiUrl = upJson.fileUrl;
								}
							}
						} catch (uploadErr) {
							console.error(
								"Failed to upload talangan installment file",
								uploadErr,
							);
						}
					}

					if (inst.isNew || String(inst.id).startsWith("temp_")) {
						await fetchApi(
							`/students/${studentId}/finance/talangan-installments`,
							{
								method: "POST",
								body: JSON.stringify({
									stage: inst.stage,
									nominalPaid: Number(inst.nominalPaid) || 0,
									paymentDate: inst.paymentDate,
									notes: inst.notes || undefined,
									buktiBayarUrl: uploadedBuktiUrl || undefined,
								}),
							},
						);
					} else if (inst.isModified) {
						await fetchApi(
							`/students/${studentId}/finance/talangan-installments/${inst.id}`,
							{
								method: "PATCH",
								body: JSON.stringify({
									nominalPaid: Number(inst.nominalPaid) || 0,
									paymentDate: inst.paymentDate,
									notes: inst.notes || undefined,
									buktiBayarUrl: uploadedBuktiUrl || undefined,
								}),
							},
						);
					}
				}
			} else {
				// Eksekusi penghapusan dokumen tambahan yang ditandai delete di draft
				for (const docKey of deletedDocKeysTambahan) {
					const docs = financeDocs[docKey] || [];
					for (const doc of docs) {
						try {
							await fetchApi(
								`/students/${studentId}/finance/documents/${doc.id}`,
								{
									method: "DELETE",
								},
							);
						} catch (delDocErr) {
							console.error("Failed to delete document", delDocErr);
						}
					}
				}
				setDeletedDocKeysTambahan([]);

				// Eksekusi upload dokumen tambahan yang di-stage di draft
				for (const [docKey, file] of Object.entries(stagedDocsTambahan)) {
					if (file) {
						const uploadFormData = new FormData();
						uploadFormData.append("file", file);
						uploadFormData.append("documentKey", docKey);

						try {
							await fetchApi(`/students/${studentId}/finance/documents`, {
								method: "POST",
								body: uploadFormData,
							});
						} catch (uploadDocErr) {
							console.error("Failed to upload staged doc", uploadDocErr);
						}
					}
				}
				setStagedDocsTambahan({});
			}

			// Simpan custom fields
			const customPromises = sanitizedCustomData.map((c) => {
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
				toast.success(
					section === "utama"
						? "Berhasil menyimpan data Pembayaran Utama & Semester!"
						: "Berhasil menyimpan data Biaya Tambahan!",
				);
				if (section === "utama") setIsEditingUtama(false);
				else setIsEditingTambahan(false);
				await fetchSemesters();
				await fetchFinanceDocs();
				await fetchTalanganInstallments();
				onUpdate();
			} else {
				toast.error("Gagal menyimpan data");
			}
		} catch (e) {
			toast.error("Terjadi kesalahan sistem saat menyimpan");
		} finally {
			if (section === "utama") setLoadingUtama(false);
			else setLoadingTambahan(false);
		}
	};

	const handleCancelEdit = (section: "utama" | "tambahan") => {
		if (section === "utama") {
			setIsEditingUtama(false);
			setFormData(finState || {});
			setDeletedInstallments([]);
			setDeletedTalanganInstallmentIds([]);
			setStagedDocsUtama({});
			setDeletedDocKeysUtama([]);
			fetchSemesters();
			fetchFinanceDocs();
			fetchTalanganInstallments();
		} else {
			setIsEditingTambahan(false);
			setCustomData(customFields || []);
			setStagedDocsTambahan({});
			setDeletedDocKeysTambahan([]);
			fetchFinanceDocs();
		}
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
	const curRegistrasi = Number(formData?.registrasiNominal) || 0;
	const curSemestersTotal =
		semesters.length > 0
			? semesters.reduce((sum: number, s: any) => sum + (s.totalBilled || 0), 0)
			: (Number(formData?.mandiriSemesterNominal) || 0) * 6 ||
				Number(formData?.t1SemesterNominalTotal) ||
				0;
	const curSemesterPerSem =
		semesters.length > 0
			? semesters[0]?.totalBilled || 0
			: Math.round(curSemestersTotal / 6);
	const curInterview =
		formData?.metodePembayaran === "dana_talangan"
			? Number(formData?.t1InterviewNominal) || 0
			: Number(formData?.mandiriInterviewNominal) || 0;
	const curKeberangkatan =
		formData?.metodePembayaran === "dana_talangan"
			? Number(formData?.t2KeberangkatanNominal) || 0
			: Number(formData?.mandiriKeberangkatanNominal) || 0;

	const totalPartisi =
		curRegistrasi + curSemestersTotal + curInterview + curKeberangkatan;
	const sisaAlokasi = totalBiaya - totalPartisi;
	const isMatched = totalBiaya > 0 && sisaAlokasi === 0;

	const regPct =
		totalBiaya > 0
			? Math.min(100, Math.round((curRegistrasi / totalBiaya) * 100))
			: 0;
	const semPct =
		totalBiaya > 0
			? Math.min(100, Math.round((curSemestersTotal / totalBiaya) * 100))
			: 0;
	const intPct =
		totalBiaya > 0
			? Math.min(100, Math.round((curInterview / totalBiaya) * 100))
			: 0;
	const kebPct =
		totalBiaya > 0
			? Math.min(100, Math.round((curKeberangkatan / totalBiaya) * 100))
			: 0;

	const semestersLunasCount = semesters.filter(
		(s: any) =>
			((s.installments || []).reduce(
				(sum: number, i: any) => sum + (i.nominalPaid || 0),
				0,
			) >= (s.totalBilled || 0) &&
				(s.totalBilled || 0) > 0) ||
			s.isTalangan,
	).length;

	const hasRegistrasiDoc =
		!!stagedDocsUtama["registrasi"] ||
		(((financeDocs["registrasi"]?.length ?? 0) > 0 ||
			!!formData?.registrasiStatus) &&
			!deletedDocKeysUtama.includes("registrasi"));

	const hasMandiriInterviewDoc =
		!!stagedDocsUtama["mandiri_interview"] ||
		!!stagedDocsUtama["t1_interview"] ||
		(((financeDocs["mandiri_interview"]?.length ?? 0) > 0 ||
			(financeDocs["t1_interview"]?.length ?? 0) > 0 ||
			!!formData?.mandiriInterviewStatus) &&
			!deletedDocKeysUtama.includes("mandiri_interview") &&
			!deletedDocKeysUtama.includes("t1_interview"));

	const hasMandiriKeberangkatanDoc =
		!!stagedDocsUtama["mandiri_keberangkatan"] ||
		!!stagedDocsUtama["t2_keberangkatan"] ||
		(((financeDocs["mandiri_keberangkatan"]?.length ?? 0) > 0 ||
			(financeDocs["t2_keberangkatan"]?.length ?? 0) > 0 ||
			!!formData?.mandiriKeberangkatanStatus) &&
			!deletedDocKeysUtama.includes("mandiri_keberangkatan") &&
			!deletedDocKeysUtama.includes("t2_keberangkatan"));

	const hasT1InterviewDoc =
		!!stagedDocsUtama["t1_interview"] ||
		!!stagedDocsUtama["mandiri_interview"] ||
		(((financeDocs["t1_interview"]?.length ?? 0) > 0 ||
			(financeDocs["mandiri_interview"]?.length ?? 0) > 0 ||
			!!formData?.t1InterviewStatus) &&
			!deletedDocKeysUtama.includes("t1_interview") &&
			!deletedDocKeysUtama.includes("mandiri_interview"));

	const hasT2KeberangkatanDoc =
		!!stagedDocsUtama["t2_keberangkatan"] ||
		!!stagedDocsUtama["mandiri_keberangkatan"] ||
		(((financeDocs["t2_keberangkatan"]?.length ?? 0) > 0 ||
			(financeDocs["mandiri_keberangkatan"]?.length ?? 0) > 0 ||
			!!formData?.t2KeberangkatanStatus) &&
			!deletedDocKeysUtama.includes("t2_keberangkatan") &&
			!deletedDocKeysUtama.includes("mandiri_keberangkatan"));

	const hasAdminTalanganDoc =
		!!stagedDocsUtama["admin_talangan"] ||
		(((financeDocs["admin_talangan"]?.length ?? 0) > 0 ||
			!!formData?.adminTalaganStatus) &&
			!deletedDocKeysUtama.includes("admin_talangan"));

	const hasToeicDoc =
		!!stagedDocsTambahan["toeic"] ||
		(((financeDocs["toeic"]?.length ?? 0) > 0 || !!formData?.toeicStatus) &&
			!deletedDocKeysTambahan.includes("toeic"));

	const hasPasporDoc =
		!!stagedDocsTambahan["paspor"] ||
		(((financeDocs["paspor"]?.length ?? 0) > 0 || !!formData?.pasporStatus) &&
			!deletedDocKeysTambahan.includes("paspor"));

	const hasRumahJuangDoc =
		!!stagedDocsTambahan["rumah_juang"] ||
		(((financeDocs["rumah_juang"]?.length ?? 0) > 0 ||
			!!formData?.rumahJuangStatus) &&
			!deletedDocKeysTambahan.includes("rumah_juang"));

	const isRegistrasiLunas = hasRegistrasiDoc;
	const isSemesterAllLunas = semestersLunasCount === 6;

	const talanganSemesters = semesters.filter((s: any) => s.isTalangan);
	const talanganSemCount = talanganSemesters.length;
	const talanganSemListText =
		talanganSemCount > 0
			? `Semester ${talanganSemesters.map((s: any) => s.semesterNumber).join(", ")}`
			: "Belum ada semester yang dialihkan ke Dana Talangan";
	const talanganSemTotalCalc = talanganSemesters.reduce(
		(sum: number, s: any) => sum + (s.totalBilled || 0),
		0,
	);
	const t1SemesterNominal =
		talanganSemCount > 0
			? talanganSemTotalCalc
			: Number(formData?.t1SemesterNominalTotal) || 0;
	const t1InterviewNominal =
		Number(formData?.t1InterviewNominal) || curInterview || 0;
	const totalTahap1Nominal = t1SemesterNominal + t1InterviewNominal;
	const totalTahap2Nominal =
		Number(formData?.t2KeberangkatanNominal) || curKeberangkatan || 0;

	const t1Installments = talanganInstallments.filter(
		(i: any) => i.stage === "tahap_1",
	);
	const t2Installments = talanganInstallments.filter(
		(i: any) => i.stage === "tahap_2",
	);
	const t1Paid = t1Installments.reduce(
		(sum: number, i: any) => sum + (Number(i.nominalPaid) || 0),
		0,
	);
	const t2Paid = t2Installments.reduce(
		(sum: number, i: any) => sum + (Number(i.nominalPaid) || 0),
		0,
	);

	const isTahap1Lunas =
		formData?.metodePembayaran === "dana_talangan"
			? (totalTahap1Nominal > 0 && t1Paid >= totalTahap1Nominal) ||
				hasT1InterviewDoc
			: hasMandiriInterviewDoc;

	const isTahap2Lunas =
		formData?.metodePembayaran === "dana_talangan"
			? (totalTahap2Nominal > 0 && t2Paid >= totalTahap2Nominal) ||
				hasT2KeberangkatanDoc
			: hasMandiriKeberangkatanDoc;

	const isInterviewLunas = isTahap1Lunas;
	const isKeberangkatanLunas = isTahap2Lunas;

	const renderSemesterCards = () => (
		<div className="space-y-4 bg-white p-5 border border-slate-200 rounded-lg shadow-sm">
			<div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-4">
				<h5 className="font-bold text-slate-800 flex items-center">
					Pembayaran 6 Semester
				</h5>
			</div>
			{loadingSemesters ? (
				<div className="flex items-center justify-center py-6 text-slate-400">
					<Loader2 className="w-5 h-5 animate-spin mr-2" />
					Memuat data semester...
				</div>
			) : (
				<div className="grid gap-3">
					{semesters.map((sem) => {
						const isExpanded = expandedSemesters.includes(sem.semesterNumber);
						const totalPaid = (sem.installments || []).reduce(
							(s: number, i: any) => s + i.nominalPaid,
							0,
						);
						const pct =
							sem.totalBilled > 0
								? Math.min(100, Math.round((totalPaid / sem.totalBilled) * 100))
								: 0;
						const installmentCount = (sem.installments || []).length;
						const isMetode = formData?.metodePembayaran === "dana_talangan";

						// Status chip config
						const statusConfig: Record<string, { label: string; cls: string }> =
							{
								LUNAS: {
									label: "Lunas",
									cls: "bg-emerald-100 text-emerald-700",
								},
								SEBAGIAN: {
									label: "Sebagian",
									cls: "bg-amber-100 text-amber-700",
								},
								BELUM_BAYAR: {
									label: "Belum Bayar",
									cls: "bg-slate-100 text-slate-500",
								},
							};
						const statusLabel =
							sem.isTalangan && isMetode
								? {
										label: "Dana Talangan",
										cls: "bg-violet-100 text-violet-700",
									}
								: (statusConfig[sem.status] ?? statusConfig.BELUM_BAYAR);

						return (
							<div
								key={sem.id}
								className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs bg-white"
							>
								{/* Card Header Row */}
								<button
									type="button"
									className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-blue-50/30 transition-colors select-none w-full text-left"
									onClick={() => toggleSemesterExpand(sem.semesterNumber)}
								>
									<div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0517B0] flex items-center justify-center shrink-0 border border-blue-100">
										<GraduationCap className="w-4 h-4" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-bold text-slate-800 text-sm">
												Semester {sem.semesterNumber}
											</span>
											<Badge
												className={`text-[10px] px-2 py-0.2 font-bold ${statusLabel.cls}`}
											>
												{statusLabel.label}
											</Badge>
										</div>
										<div className="flex items-center gap-2 mt-1 w-full max-w-[220px]">
											<div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
												<div
													className={`h-full rounded-full transition-all duration-500 ${
														pct >= 100
															? "bg-emerald-500"
															: pct > 0
																? "bg-[#0517B0]"
																: "bg-slate-300"
													}`}
													style={{ width: `${pct}%` }}
												/>
											</div>
											<span className="text-[10px] font-mono font-bold text-slate-500">
												{pct}% ({formatRupiah(totalPaid)})
											</span>
										</div>
									</div>
									<div className="flex items-center gap-3 shrink-0">
										<div className="text-right hidden sm:block">
											<div className="text-[10px] text-slate-400 font-semibold uppercase">
												Tagihan
											</div>
											<div className="text-xs font-bold text-slate-800 font-mono">
												{formatRupiah(sem.totalBilled || 0)}
											</div>
										</div>
										{isExpanded ? (
											<ChevronUp className="w-4 h-4 text-slate-400" />
										) : (
											<ChevronDown className="w-4 h-4 text-slate-400" />
										)}
									</div>
								</button>

								{/* Expanded Body */}
								{isExpanded && (
									<div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4">
										{/* Row 1: Total Tagihan & Talangan Toggle */}
										<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
											<div className="flex-1">
												<label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
													Total Tagihan Semester
												</label>
												<div className="font-semibold text-slate-800">
													{formatRupiah(sem.totalBilled || 0)}
												</div>
											</div>

											{/* Dana Talangan status / toggle (Hanya tampil saat memilih skema Dana Talangan) */}
											{isMetode && (
												<div>
													{isEditingUtama ? (
														<button
															type="button"
															className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
																sem.isTalangan
																	? "bg-violet-50 border-violet-300 text-violet-700 font-semibold"
																	: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
															}`}
															onClick={() => handleToggleTalangan(sem)}
														>
															<Checkbox
																checked={sem.isTalangan}
																onCheckedChange={() =>
																	handleToggleTalangan(sem)
																}
															/>
															<span className="text-sm font-medium select-none">
																Ubah Menjadi Dana Talangan
															</span>
														</button>
													) : sem.isTalangan ? (
														<Badge className="bg-violet-100 text-violet-700 border-0 py-1.5 px-3 flex items-center gap-1.5 font-medium">
															<Banknote className="w-3.5 h-3.5" /> Dana Talangan
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="text-slate-500 border-slate-200 py-1.5 px-3 font-medium"
														>
															Dana Mandiri
														</Badge>
													)}
												</div>
											)}
										</div>

										{/* Talangan notice */}
										{sem.isTalangan && isMetode && (
											<div className="flex items-center gap-2 p-3 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-sm">
												<Banknote className="w-4 h-4 flex-shrink-0" />
												<span>
													Semester ini menggunakan{" "}
													<strong>Dana Talangan</strong>. Pembayaran akan
													dipotong dari gaji mahasiswa.
												</span>
											</div>
										)}

										{/* Installments (Pembayaran) */}
										<div>
											<div className="flex items-center justify-between mb-2">
												<h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
													Riwayat Pembayaran
												</h5>
												<span className="text-xs text-slate-400">
													Total terbayar:{" "}
													<strong className="text-slate-600">
														{formatRupiah(totalPaid)}
													</strong>
												</span>
											</div>
											{(sem.installments || []).length === 0 ? (
												<div className="text-xs text-slate-400 italic bg-white border border-dashed border-slate-200 rounded-lg py-3 px-4 text-center">
													Belum ada pembayaran tercatat
												</div>
											) : (
												<div className="space-y-2">
													{(sem.installments || []).map((inst: any) => (
														<div
															key={inst.id}
															className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-3 py-2 shadow-sm"
														>
															<div className="flex items-center gap-2">
																<div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
																	{inst.installmentNumber}
																</div>
																<div>
																	<div className="flex items-center gap-2 flex-wrap">
																		<div className="font-semibold text-slate-800 text-sm">
																			{formatRupiah(inst.nominalPaid)}
																		</div>
																		{inst.isTalangan && isMetode && (
																			<Badge className="bg-violet-100 text-violet-700 border-0 text-[10px] py-0 h-4">
																				Dana Talangan
																			</Badge>
																		)}
																		{inst.file ? (
																			<span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
																				<Paperclip className="w-3 h-3" />{" "}
																				{inst.file.name}
																			</span>
																		) : inst.buktiBayarUrl ? (
																			<a
																				href={`${API_URL}${inst.buktiBayarUrl.startsWith("/") ? "" : "/"}${inst.buktiBayarUrl}`}
																				target="_blank"
																				rel="noreferrer"
																				className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
																				onClick={(e) => e.stopPropagation()}
																			>
																				<Paperclip className="w-3 h-3" /> Bukti
																				Bayar
																			</a>
																		) : null}
																	</div>
																	<div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
																		<Calendar className="w-3 h-3" />
																		{inst.paymentDate
																			? new Date(
																					inst.paymentDate,
																				).toLocaleDateString("id-ID", {
																					day: "numeric",
																					month: "long",
																					year: "numeric",
																				})
																			: "-"}
																	</div>
																	{inst.notes && (
																		<div className="text-xs text-slate-400 italic mt-0.5">
																			{inst.notes}
																		</div>
																	)}
																</div>
															</div>
															{canEdit && isEditingUtama && (
																<div className="flex gap-1">
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
																		onClick={() =>
																			openInstallmentModal(sem, inst)
																		}
																	>
																		<Edit className="w-3.5 h-3.5" />
																	</Button>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-7 w-7 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
																		onClick={() =>
																			handleDeleteInstallment(sem.id, inst.id)
																		}
																	>
																		<Trash2 className="w-3.5 h-3.5" />
																	</Button>
																</div>
															)}
														</div>
													))}
												</div>
											)}

											{/* Add Installment Button - Ditutup jika semester menggunakan Dana Talangan atau jika belum mode Edit Data */}
											{canEdit &&
												isEditingUtama &&
												(!sem.isTalangan || !isMetode) && (
													<Button
														variant="outline"
														size="sm"
														className="mt-2 w-full border-dashed"
														onClick={() => openInstallmentModal(sem)}
													>
														<Plus className="w-3.5 h-3.5 mr-1.5" />
														Tambah Pembayaran
													</Button>
												)}
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);

	return (
		<div className="space-y-5">
			{/* ─── 1. CARD PARTISI & ALOKASI BIAYA PENDIDIKAN (COMPACT & MODERN) ─── */}
			<div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3.5">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-blue-50 text-[#0517B0] border border-blue-100/80 shadow-2xs">
							<PieChart className="w-5 h-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
									Partisi Biaya Pendidikan
								</h3>
								<Badge
									variant="outline"
									className="text-[10px] font-bold bg-slate-50 border-slate-200 text-slate-700 px-2 py-0.5"
								>
									{formData?.metodePembayaran === "dana_talangan"
										? "Skema Talangan"
										: "Skema Mandiri"}
								</Badge>
							</div>
							<p className="text-xs text-slate-500 mt-0.5">
								Alokasi resmi dari total biaya pendidikan ke 4 pos pembayaran
								utama
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2.5">
						{/* Total Tagihan PMB Badge */}
						<div className="bg-blue-50/80 border border-blue-100 text-[#0517B0] px-3 py-1.5 rounded-lg flex items-center gap-2">
							<Lock className="w-3.5 h-3.5 text-[#0517B0]" />
							<div className="flex flex-col">
								<span className="text-[9px] font-bold uppercase tracking-wider text-blue-800">
									Total Biaya (PMB)
								</span>
								<span className="text-sm font-black text-[#0517B0] leading-none">
									{formatRupiah(totalBiaya)}
								</span>
							</div>
						</div>

						{/* Status Alokasi Pill */}
						{totalBiaya > 0 ? (
							isMatched ? (
								<Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold gap-1.5">
									<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
									Alokasi Pas 100%
								</Badge>
							) : sisaAlokasi > 0 ? (
								<Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 px-2.5 py-1.5 text-xs font-semibold gap-1.5">
									<AlertCircle className="w-3.5 h-3.5 text-amber-600" />
									Sisa: {formatRupiah(sisaAlokasi)}
								</Badge>
							) : (
								<Badge className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-50 px-2.5 py-1.5 text-xs font-semibold gap-1.5">
									<AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
									Lebih: {formatRupiah(Math.abs(sisaAlokasi))}
								</Badge>
							)
						) : (
							<Badge
								variant="outline"
								className="text-slate-400 border-slate-200 text-xs"
							>
								Belum Ditentukan
							</Badge>
						)}

						{canEdit && (
							<Button
								onClick={openPartitionModal}
								size="sm"
								className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 font-semibold shadow-2xs h-8.5 rounded-lg"
							>
								<SlidersHorizontal className="w-3.5 h-3.5" />
								Atur Pembagian
							</Button>
						)}
					</div>
				</div>

				{/* Allocation Progress Bar & 4 Compact Metric Boxes */}
				{totalBiaya > 0 && (
					<div className="space-y-2.5 pt-2 border-t border-slate-100">
						{/* Multi-segment bar */}
						<div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200/80">
							{regPct > 0 && (
								<div
									style={{ width: `${regPct}%` }}
									className="h-full bg-sky-500 rounded-xs transition-all duration-500"
									title={`Registrasi Awal: ${regPct}% (${formatRupiah(curRegistrasi)})`}
								/>
							)}
							{semPct > 0 && (
								<div
									style={{ width: `${semPct}%` }}
									className="h-full bg-indigo-500 rounded-xs transition-all duration-500"
									title={`Perkuliahan 6 Semester: ${semPct}% (${formatRupiah(curSemestersTotal)})`}
								/>
							)}
							{intPct > 0 && (
								<div
									style={{ width: `${intPct}%` }}
									className="h-full bg-amber-500 rounded-xs transition-all duration-500"
									title={`Interview Magang: ${intPct}% (${formatRupiah(curInterview)})`}
								/>
							)}
							{kebPct > 0 && (
								<div
									style={{ width: `${kebPct}%` }}
									className="h-full bg-emerald-500 rounded-xs transition-all duration-500"
									title={`Keberangkatan: ${kebPct}% (${formatRupiah(curKeberangkatan)})`}
								/>
							)}
						</div>

						{/* 4 Compact Inline Chips */}
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
							<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
									<div>
										<p className="text-[10px] font-bold text-slate-500 uppercase">
											1. Registrasi ({regPct}%)
										</p>
										<p className="text-xs font-bold text-slate-800 font-mono">
											{formatRupiah(curRegistrasi)}
										</p>
									</div>
								</div>
								{isRegistrasiLunas ? (
									<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5 py-0 font-bold">
										Lunas
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-slate-400 border-slate-200 text-[9px] px-1.5 py-0"
									>
										Belum
									</Badge>
								)}
							</div>

							<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
									<div>
										<p className="text-[10px] font-bold text-slate-500 uppercase">
											2. 6 Semester ({semPct}%)
										</p>
										<p className="text-xs font-bold text-slate-800 font-mono">
											{formatRupiah(curSemestersTotal)}
										</p>
									</div>
								</div>
								<Badge
									className={
										semestersLunasCount === 6
											? "bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5 py-0 font-bold"
											: "bg-indigo-50 text-indigo-700 border-0 text-[9px] px-1.5 py-0 font-bold"
									}
								>
									{semestersLunasCount}/6 Smt
								</Badge>
							</div>

							<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
									<div>
										<p className="text-[10px] font-bold text-slate-500 uppercase">
											3. Interview ({intPct}%)
										</p>
										<p className="text-xs font-bold text-slate-800 font-mono">
											{formatRupiah(curInterview)}
										</p>
									</div>
								</div>
								{isInterviewLunas ? (
									<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5 py-0 font-bold">
										Lunas
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-slate-400 border-slate-200 text-[9px] px-1.5 py-0"
									>
										Belum
									</Badge>
								)}
							</div>

							<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
									<div>
										<p className="text-[10px] font-bold text-slate-500 uppercase">
											4. Berangkat ({kebPct}%)
										</p>
										<p className="text-xs font-bold text-slate-800 font-mono">
											{formatRupiah(curKeberangkatan)}
										</p>
									</div>
								</div>
								{isKeberangkatanLunas ? (
									<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5 py-0 font-bold">
										Lunas
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-slate-400 border-slate-200 text-[9px] px-1.5 py-0"
									>
										Belum
									</Badge>
								)}
							</div>
						</div>
					</div>
				)}
			</div>

			{/* ─── 2. CARD PEMBAYARAN UTAMA ─── */}
			<Card className="border border-slate-200/90 shadow-2xs overflow-hidden rounded-xl bg-white">
				<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5 sm:px-6 flex flex-row items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="p-2 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-100/70 shadow-2xs">
							<Wallet className="w-4 h-4" />
						</div>
						<div>
							<CardTitle className="text-base font-bold text-slate-900 tracking-tight">
								Pembayaran Utama
							</CardTitle>
							<p className="text-xs text-slate-500 mt-0.5">
								Pencatatan pos pembayaran perkuliahan dan program lanjutan
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{canEdit && !isEditingUtama && (
							<Button
								size="sm"
								onClick={() => setIsEditingUtama(true)}
								className="bg-[#0517B0] hover:bg-blue-800 text-white font-semibold text-xs h-8.5 rounded-lg shadow-2xs gap-1.5"
							>
								<Edit className="w-3.5 h-3.5" /> Edit Data
							</Button>
						)}
						{isEditingUtama && (
							<>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleCancelEdit("utama")}
									disabled={loadingUtama}
									className="h-8.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
								>
									<X className="w-3.5 h-3.5 mr-1" /> Batal
								</Button>
								<Button
									size="sm"
									onClick={() => triggerSave("utama")}
									disabled={loadingUtama}
									className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8.5 rounded-lg shadow-2xs"
								>
									{loadingUtama ? (
										<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
									) : (
										<Save className="w-3.5 h-3.5 mr-1.5" />
									)}
									Simpan
								</Button>
							</>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-5 sm:p-6 space-y-6 bg-white">
					{/* Registrasi */}
					<div>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<h4 className="font-semibold text-slate-800 flex items-center">
									Registrasi Awal
									{isRegistrasiLunas ? (
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
								<Badge
									variant="outline"
									className="text-[10px] font-semibold bg-sky-50 border-sky-200 text-sky-700"
								>
									Partisi 1 ({regPct}% Total)
								</Badge>
							</div>
						</div>

						<div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col md:flex-row gap-6">
							<div className="flex-1">
								<label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">
									Nominal Tagihan Registrasi
								</label>
								<div className="text-lg font-bold text-slate-800">
									{formatRupiah(formData?.registrasiNominal || 0)}
								</div>
								<p className="text-xs text-slate-400 mt-1">
									Disesuaikan otomatis melalui Partisi Biaya Pendidikan
								</p>
							</div>
							<div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
								<label className="text-xs font-semibold text-slate-500 mb-2 block uppercase tracking-wider">
									Bukti Pembayaran Registrasi (PDF)
								</label>
								<StagedDocumentUpload
									docKey="registrasi"
									isEditing={isEditingUtama}
									canEdit={canEdit}
									existingDocs={financeDocs["registrasi"]}
									stagedFile={stagedDocsUtama["registrasi"]}
									isDeleted={deletedDocKeysUtama.includes("registrasi")}
									onStageFile={(file) =>
										handleStageDoc("utama", "registrasi", file)
									}
									onRemoveStagedFile={() =>
										handleRemoveStagedDoc("utama", "registrasi")
									}
									onDeleteExistingDoc={() =>
										handleDeleteExistingDoc("utama", "registrasi")
									}
									onRestoreExistingDoc={() =>
										handleRestoreExistingDoc("utama", "registrasi")
									}
								/>
							</div>
						</div>
					</div>

					<hr className="border-slate-100" />

					{/* Biaya Perkuliahan (6 Semester) */}
					<div>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<h4 className="font-semibold text-slate-800 flex items-center">
									Biaya Perkuliahan (6 Semester)
									{isSemesterAllLunas ? (
										<Badge className="ml-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
											<CheckCircle className="w-3 h-3 mr-1" /> Lunas
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="ml-3 text-slate-500 border-slate-300"
										>
											Belum Lunas ({semestersLunasCount}/6 Smt)
										</Badge>
									)}
								</h4>
								<Badge
									variant="outline"
									className="text-[10px] font-semibold bg-indigo-50 border-indigo-200 text-indigo-700"
								>
									Partisi 2 ({semPct}% Total)
								</Badge>
							</div>
						</div>

						<div className="p-4 bg-slate-50 rounded-lg border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">
									Total Tagihan Perkuliahan (6 Semester)
								</label>
								<div className="text-lg font-bold text-slate-800">
									{formatRupiah(curSemestersTotal)}
								</div>
								<div className="text-xs text-slate-400 mt-1">
									{formatRupiah(curSemesterPerSem)} per semester (6 semester)
								</div>
							</div>
							<div className="border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
								<label className="text-xs font-semibold text-slate-500 mb-1 block uppercase tracking-wider">
									Total Terbayar Perkuliahan
								</label>
								<div className="text-lg font-bold text-emerald-700">
									{formatRupiah(
										semesters.reduce(
											(sum: number, s: any) =>
												sum +
												(s.installments || []).reduce(
													(iSum: number, inst: any) =>
														iSum + (inst.nominalPaid || 0),
													0,
												),
											0,
										),
									)}
								</div>
								<div className="text-xs text-slate-400 mt-1">
									{semestersLunasCount}/6 Semester Selesai / Ditalangi
								</div>
							</div>
						</div>
					</div>

					{/* Pembayaran 6 Semester */}
					<div className="space-y-4">{renderSemesterCards()}</div>

					<hr className="border-slate-100" />

					{/* Metode Pembayaran */}
					<div>
						<div className="mb-4">
							<h4 className="font-semibold text-slate-800 mb-1">
								Metode Pembayaran Lanjutan
							</h4>
							<p className="text-sm text-slate-500">
								Pilih skema pelunasan biaya pendidikan setelah registrasi awal &
								perkuliahan semester.
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

					{/* Kondisional Metode: Dana Mandiri */}
					{formData?.metodePembayaran === "mandiri" && (
						<div className="space-y-4 p-5 border border-blue-100 bg-blue-50/40 rounded-xl">
							<h4 className="font-bold text-blue-900 flex items-center">
								Rincian Skema Dana Mandiri (Interview & Keberangkatan)
							</h4>

							<div className="grid gap-4">
								{[
									{
										label: "Interview Magang",
										docKey: "mandiri_interview",
										nomField: "mandiriInterviewNominal",
										isLunas: isInterviewLunas,
										pct: intPct,
										partisiNum: 3,
										badgeColor: "bg-amber-50 border-amber-200 text-amber-700",
									},
									{
										label: "Keberangkatan",
										docKey: "mandiri_keberangkatan",
										nomField: "mandiriKeberangkatanNominal",
										isLunas: isKeberangkatanLunas,
										pct: kebPct,
										partisiNum: 4,
										badgeColor:
											"bg-emerald-50 border-emerald-200 text-emerald-700",
									},
								].map((item, idx) => (
									<div
										key={idx}
										className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm space-y-3"
									>
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100">
											<div className="flex items-center gap-2 font-medium text-slate-700">
												<span>{item.label}</span>
												<Badge
													variant="outline"
													className={`text-[10px] font-semibold ${item.badgeColor}`}
												>
													Partisi {item.partisiNum} ({item.pct}% Total)
												</Badge>
											</div>
											<div className="flex items-center gap-4">
												<div className="font-bold text-slate-800 text-right">
													{formatRupiah(formData?.[item.nomField] || 0)}
												</div>
												<div>
													{item.isLunas ? (
														<Badge className="bg-emerald-100 text-emerald-700 border-0">
															<CheckCircle className="w-3 h-3 mr-1" /> Lunas
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="text-slate-500 border-slate-200"
														>
															Belum Lunas
														</Badge>
													)}
												</div>
											</div>
										</div>
										<div>
											<label className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
												Bukti Bayar {item.label} (PDF)
											</label>
											<StagedDocumentUpload
												docKey={item.docKey}
												isEditing={isEditingUtama}
												canEdit={canEdit}
												existingDocs={financeDocs[item.docKey]}
												stagedFile={stagedDocsUtama[item.docKey]}
												isDeleted={deletedDocKeysUtama.includes(item.docKey)}
												onStageFile={(file) =>
													handleStageDoc("utama", item.docKey, file)
												}
												onRemoveStagedFile={() =>
													handleRemoveStagedDoc("utama", item.docKey)
												}
												onDeleteExistingDoc={() =>
													handleDeleteExistingDoc("utama", item.docKey)
												}
												onRestoreExistingDoc={() =>
													handleRestoreExistingDoc("utama", item.docKey)
												}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Kondisional Metode: Dana Talangan */}
					{formData?.metodePembayaran === "dana_talangan" && (
						<div className="space-y-6 p-5 border border-emerald-100 bg-emerald-50/40 rounded-xl">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
								<h4 className="font-bold text-emerald-900 flex items-center gap-2">
									<Sparkles className="w-4 h-4 text-emerald-600" />
									Rincian Skema Dana Talangan (2 Tahap)
								</h4>
								<span className="text-xs text-emerald-700 font-medium">
									Skema Pembiayaan Bertahap via Lembaga Keuangan
								</span>
							</div>

							<div className="grid gap-6">
								{/* Card Tahap 1: Interview Magang & Semester Ditalangi */}
								<div className="bg-white p-5 border border-slate-200/90 rounded-xl shadow-2xs space-y-4">
									{/* Header Tahap 1 */}
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
										<div className="flex items-center gap-2.5">
											<div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100/80 shadow-2xs">
												<Building className="w-4 h-4" />
											</div>
											<div>
												<div className="font-bold text-slate-800 text-base flex items-center gap-2">
													Tahap 1: Interview Magang & Semester Ditalangi
												</div>
												<div className="flex items-center gap-2 mt-0.5">
													<Badge
														variant="outline"
														className="text-[10px] font-semibold bg-amber-50 border-amber-200 text-amber-700"
													>
														Partisi 3 ({intPct}% Total) + {talanganSemCount}{" "}
														Semester
													</Badge>
												</div>
											</div>
										</div>

										<div className="flex items-center gap-3">
											{isTahap1Lunas ? (
												<Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs py-1 px-2.5 font-bold">
													<CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />{" "}
													Lunas
												</Badge>
											) : t1Paid > 0 ? (
												<Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs py-1 px-2.5 font-bold">
													Cicilan Sebagian (
													{totalTahap1Nominal > 0
														? Math.min(
																100,
																Math.round((t1Paid / totalTahap1Nominal) * 100),
															)
														: 0}
													%)
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-slate-500 border-slate-200 text-xs py-1 px-2.5"
												>
													Belum Lunas
												</Badge>
											)}
										</div>
									</div>

									{/* Total Biaya Tahap 1 & Metric Chips Box */}
									<div className="p-4 bg-gradient-to-r from-amber-50/70 via-slate-50/60 to-white border border-amber-200/80 rounded-xl space-y-3">
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
											<div>
												<span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
													Plafon Pinjaman Tahap 1
												</span>
												<p className="text-xs text-slate-500 mt-0.5">
													Akumulasi biaya perkuliahan semester yang ditalangi
													dan biaya interview magang
												</p>
											</div>
											<div className="text-left sm:text-right">
												<span className="text-2xl font-black text-amber-900 tracking-tight font-mono block">
													{formatRupiah(totalTahap1Nominal)}
												</span>
											</div>
										</div>

										{/* 3 Metric Chips */}
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/60">
											<div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
												<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
													Total Tagihan
												</span>
												<span className="text-sm font-bold text-slate-800 font-mono">
													{formatRupiah(totalTahap1Nominal)}
												</span>
											</div>
											<div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
												<span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
													Sudah Terbayar
												</span>
												<span className="text-sm font-bold text-emerald-700 font-mono">
													{formatRupiah(t1Paid)}
												</span>
											</div>
											<div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
												<span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
													Sisa Tagihan
												</span>
												<span className="text-sm font-bold text-amber-800 font-mono">
													{formatRupiah(
														Math.max(0, totalTahap1Nominal - t1Paid),
													)}
												</span>
											</div>
										</div>

										{/* Progress Bar */}
										<div className="space-y-1 pt-1">
											<div className="flex justify-between text-[11px] font-semibold text-slate-600">
												<span>Progres Pembayaran Tahap 1</span>
												<span className="font-mono">
													{totalTahap1Nominal > 0
														? `${Math.min(100, Math.round((t1Paid / totalTahap1Nominal) * 100))}%`
														: "0%"}
												</span>
											</div>
											<div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden border border-slate-200">
												<div
													className="h-full bg-amber-500 rounded-full transition-all duration-300"
													style={{
														width: `${totalTahap1Nominal > 0 ? Math.min(100, (t1Paid / totalTahap1Nominal) * 100) : 0}%`,
													}}
												/>
											</div>
										</div>
									</div>

									{/* Rincian Komponen Tahap 1 */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80 flex flex-col justify-between">
											<div className="flex items-center justify-between mb-1">
												<span className="text-xs font-semibold text-slate-600">
													1. Biaya Perkuliahan Ditalangi
												</span>
												<Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
													{talanganSemCount}/6 Semester
												</Badge>
											</div>
											<div className="text-base font-bold text-slate-800 font-mono">
												{formatRupiah(t1SemesterNominal)}
											</div>
											<p className="text-[11px] text-slate-500 mt-1">
												{talanganSemCount > 0
													? talanganSemListText
													: "Belum ada semester yang dialihkan ke talangan"}
											</p>
										</div>

										<div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80 flex flex-col justify-between">
											<div className="flex items-center justify-between mb-1">
												<span className="text-xs font-semibold text-slate-600">
													2. Biaya Interview Magang
												</span>
												<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
													Partisi 3 ({intPct}%)
												</Badge>
											</div>
											<div className="text-base font-bold text-slate-800 font-mono">
												{formatRupiah(t1InterviewNominal)}
											</div>
											<p className="text-[11px] text-slate-500 mt-1">
												Disesuaikan otomatis dari Partisi Biaya Pendidikan
											</p>
										</div>
									</div>

									{/* Riwayat Pembayaran Cicilan Tahap 1 */}
									<div className="pt-2 space-y-3">
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
													Riwayat Pembayaran Tahap 1
												</span>
												<Badge
													variant="outline"
													className="text-[10px] font-semibold bg-slate-100 border-slate-200 text-slate-700"
												>
													{t1Installments.length} Pembayaran
												</Badge>
											</div>

											{canEdit && (
												<Button
													type="button"
													size="sm"
													variant="outline"
													onClick={() =>
														handleOpenAddTalanganPayment("tahap_1")
													}
													disabled={!isEditingUtama}
													className={`h-7.5 text-xs font-semibold gap-1.5 border-dashed ${
														isEditingUtama
															? "text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer"
															: "text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
													}`}
												>
													<Plus className="w-3.5 h-3.5" />
													Tambah Pembayaran
												</Button>
											)}
										</div>

										{t1Installments.length === 0 ? (
											<div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400 italic">
												Belum ada catatan pembayaran cicilan Tahap 1.{" "}
												{isEditingUtama
													? "Klik '+ Tambah Pembayaran' di atas untuk mencatat cicilan baru."
													: "Aktifkan mode 'Edit Data' untuk menambah pembayaran."}
											</div>
										) : (
											<div className="space-y-2">
												{t1Installments.map((inst: any, iIdx: number) => (
													<div
														key={inst.id || iIdx}
														className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/90 rounded-lg gap-2 text-xs transition-colors"
													>
														<div className="flex items-center gap-3">
															<Badge
																variant="outline"
																className="text-[11px] font-mono font-bold bg-white border-slate-300 text-slate-700 shrink-0"
															>
																#{inst.installmentNumber || iIdx + 1}
															</Badge>
															<div>
																<div className="font-semibold text-slate-800 flex items-center gap-2">
																	<span>
																		{inst.paymentDate
																			? new Date(
																					inst.paymentDate,
																				).toLocaleDateString("id-ID", {
																					day: "2-digit",
																					month: "short",
																					year: "numeric",
																				})
																			: "-"}
																	</span>
																	{inst.notes && (
																		<span className="text-slate-400 font-normal">
																			· {inst.notes}
																		</span>
																	)}
																</div>
																{inst.file ? (
																	<div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-0.5">
																		<FileText className="w-3.5 h-3.5" />
																		<span>{inst.file.name} (Draf Baru)</span>
																	</div>
																) : inst.buktiBayarUrl ? (
																	<a
																		href={`${API_URL}${inst.buktiBayarUrl.startsWith("/") ? "" : "/"}${inst.buktiBayarUrl}`}
																		target="_blank"
																		rel="noreferrer"
																		className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-semibold mt-0.5"
																	>
																		<FileText className="w-3.5 h-3.5" />
																		<span>Lihat Bukti Bayar</span>
																	</a>
																) : (
																	<span className="text-[10px] text-slate-400 italic">
																		Tanpa lampiran berkas
																	</span>
																)}
															</div>
														</div>

														<div className="flex items-center justify-between sm:justify-end gap-3">
															<span className="font-bold text-slate-900 font-mono text-sm">
																{formatRupiah(inst.nominalPaid || 0)}
															</span>

															{canEdit && isEditingUtama && (
																<div className="flex items-center gap-1">
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon"
																		className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
																		onClick={() =>
																			handleOpenEditTalanganPayment(inst)
																		}
																	>
																		<Edit className="w-3.5 h-3.5" />
																	</Button>
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon"
																		className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
																		onClick={() =>
																			handleDeleteTalanganPayment(inst)
																		}
																	>
																		<Trash2 className="w-3.5 h-3.5" />
																	</Button>
																</div>
															)}
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								</div>

								{/* Card Tahap 2: Keberangkatan */}
								<div className="bg-white p-5 border border-slate-200/90 rounded-xl shadow-2xs space-y-4">
									{/* Header Tahap 2 */}
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
										<div className="flex items-center gap-2.5">
											<div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/80 shadow-2xs">
												<Plane className="w-4 h-4" />
											</div>
											<div>
												<div className="font-bold text-slate-800 text-base flex items-center gap-2">
													Tahap 2: Keberangkatan
												</div>
												<div className="flex items-center gap-2 mt-0.5">
													<Badge
														variant="outline"
														className="text-[10px] font-semibold bg-emerald-50 border-emerald-200 text-emerald-700"
													>
														Partisi 4 ({kebPct}% Total)
													</Badge>
												</div>
											</div>
										</div>

										<div className="flex items-center gap-3">
											{isTahap2Lunas ? (
												<Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs py-1 px-2.5 font-bold">
													<CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />{" "}
													Lunas
												</Badge>
											) : t2Paid > 0 ? (
												<Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs py-1 px-2.5 font-bold">
													Cicilan Sebagian (
													{totalTahap2Nominal > 0
														? Math.min(
																100,
																Math.round((t2Paid / totalTahap2Nominal) * 100),
															)
														: 0}
													%)
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-slate-500 border-slate-200 text-xs py-1 px-2.5"
												>
													Belum Lunas
												</Badge>
											)}
										</div>
									</div>

									{/* Total Biaya Tahap 2 & Metric Chips Box */}
									<div className="p-4 bg-gradient-to-r from-emerald-50/70 via-slate-50/60 to-white border border-emerald-200/80 rounded-xl space-y-3">
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
											<div>
												<span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
													Plafon Pinjaman Tahap 2
												</span>
												<p className="text-xs text-slate-500 mt-0.5">
													Alokasi biaya tiket penerbangan, visa & persiapan
													keberangkatan magang luar negeri
												</p>
											</div>
											<div className="text-left sm:text-right">
												<span className="text-2xl font-black text-emerald-900 tracking-tight font-mono block">
													{formatRupiah(totalTahap2Nominal)}
												</span>
											</div>
										</div>

										{/* 3 Metric Chips */}
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-emerald-200/60">
											<div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
												<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
													Total Tagihan
												</span>
												<span className="text-sm font-bold text-slate-800 font-mono">
													{formatRupiah(totalTahap2Nominal)}
												</span>
											</div>
											<div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
												<span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
													Sudah Terbayar
												</span>
												<span className="text-sm font-bold text-emerald-700 font-mono">
													{formatRupiah(t2Paid)}
												</span>
											</div>
											<div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80">
												<span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
													Sisa Tagihan
												</span>
												<span className="text-sm font-bold text-amber-800 font-mono">
													{formatRupiah(
														Math.max(0, totalTahap2Nominal - t2Paid),
													)}
												</span>
											</div>
										</div>

										{/* Progress Bar */}
										<div className="space-y-1 pt-1">
											<div className="flex justify-between text-[11px] font-semibold text-slate-600">
												<span>Progres Pembayaran Tahap 2</span>
												<span className="font-mono">
													{totalTahap2Nominal > 0
														? `${Math.min(100, Math.round((t2Paid / totalTahap2Nominal) * 100))}%`
														: "0%"}
												</span>
											</div>
											<div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden border border-slate-200">
												<div
													className="h-full bg-emerald-500 rounded-full transition-all duration-300"
													style={{
														width: `${totalTahap2Nominal > 0 ? Math.min(100, (t2Paid / totalTahap2Nominal) * 100) : 0}%`,
													}}
												/>
											</div>
										</div>
									</div>

									{/* Rincian Komponen Tahap 2 */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80 flex flex-col justify-between">
											<div className="flex items-center justify-between mb-1">
												<span className="text-xs font-semibold text-slate-600">
													1. Biaya Keberangkatan Magang
												</span>
												<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
													Partisi 4 ({kebPct}%)
												</Badge>
											</div>
											<div className="text-base font-bold text-slate-800 font-mono">
												{formatRupiah(totalTahap2Nominal)}
											</div>
											<p className="text-[11px] text-slate-500 mt-1">
												Disesuaikan otomatis dari Partisi Biaya Pendidikan
											</p>
										</div>

										<div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80 flex flex-col justify-between">
											<div className="flex items-center justify-between mb-1">
												<span className="text-xs font-semibold text-slate-600">
													2. Syarat Pencairan Tahap 2
												</span>
												<Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold">
													Visa Magang
												</Badge>
											</div>
											<div className="text-sm font-semibold text-slate-700">
												{formData?.t2KeberangkatanStatus
													? "Telah Dicairkan"
													: "Menunggu Approval Visa"}
											</div>
											<p className="text-[11px] text-slate-500 mt-1">
												Dicairkan menjelang keberangkatan ke luar negeri
											</p>
										</div>
									</div>

									{/* Riwayat Pembayaran Cicilan Tahap 2 */}
									<div className="pt-2 space-y-3">
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
													Riwayat Pembayaran Tahap 2
												</span>
												<Badge
													variant="outline"
													className="text-[10px] font-semibold bg-slate-100 border-slate-200 text-slate-700"
												>
													{t2Installments.length} Pembayaran
												</Badge>
											</div>

											{canEdit && (
												<Button
													type="button"
													size="sm"
													variant="outline"
													onClick={() =>
														handleOpenAddTalanganPayment("tahap_2")
													}
													disabled={!isEditingUtama}
													className={`h-7.5 text-xs font-semibold gap-1.5 border-dashed ${
														isEditingUtama
															? "text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer"
															: "text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
													}`}
												>
													<Plus className="w-3.5 h-3.5" />
													Tambah Pembayaran
												</Button>
											)}
										</div>

										{t2Installments.length === 0 ? (
											<div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400 italic">
												Belum ada catatan pembayaran cicilan Tahap 2.{" "}
												{isEditingUtama
													? "Klik '+ Tambah Pembayaran' di atas untuk mencatat cicilan baru."
													: "Aktifkan mode 'Edit Data' untuk menambah pembayaran."}
											</div>
										) : (
											<div className="space-y-2">
												{t2Installments.map((inst: any, iIdx: number) => (
													<div
														key={inst.id || iIdx}
														className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/90 rounded-lg gap-2 text-xs transition-colors"
													>
														<div className="flex items-center gap-3">
															<Badge
																variant="outline"
																className="text-[11px] font-mono font-bold bg-white border-slate-300 text-slate-700 shrink-0"
															>
																#{inst.installmentNumber || iIdx + 1}
															</Badge>
															<div>
																<div className="font-semibold text-slate-800 flex items-center gap-2">
																	<span>
																		{inst.paymentDate
																			? new Date(
																					inst.paymentDate,
																				).toLocaleDateString("id-ID", {
																					day: "2-digit",
																					month: "short",
																					year: "numeric",
																				})
																			: "-"}
																	</span>
																	{inst.notes && (
																		<span className="text-slate-400 font-normal">
																			· {inst.notes}
																		</span>
																	)}
																</div>
																{inst.file ? (
																	<div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-0.5">
																		<FileText className="w-3.5 h-3.5" />
																		<span>{inst.file.name} (Draf Baru)</span>
																	</div>
																) : inst.buktiBayarUrl ? (
																	<a
																		href={`${API_URL}${inst.buktiBayarUrl.startsWith("/") ? "" : "/"}${inst.buktiBayarUrl}`}
																		target="_blank"
																		rel="noreferrer"
																		className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-semibold mt-0.5"
																	>
																		<FileText className="w-3.5 h-3.5" />
																		<span>Lihat Bukti Bayar</span>
																	</a>
																) : (
																	<span className="text-[10px] text-slate-400 italic">
																		Tanpa lampiran berkas
																	</span>
																)}
															</div>
														</div>

														<div className="flex items-center justify-between sm:justify-end gap-3">
															<span className="font-bold text-slate-900 font-mono text-sm">
																{formatRupiah(inst.nominalPaid || 0)}
															</span>

															{canEdit && isEditingUtama && (
																<div className="flex items-center gap-1">
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon"
																		className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
																		onClick={() =>
																			handleOpenEditTalanganPayment(inst)
																		}
																	>
																		<Edit className="w-3.5 h-3.5" />
																	</Button>
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon"
																		className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
																		onClick={() =>
																			handleDeleteTalanganPayment(inst)
																		}
																	>
																		<Trash2 className="w-3.5 h-3.5" />
																	</Button>
																</div>
															)}
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Biaya Administrasi Talangan */}
							<div className="bg-amber-50/50 p-5 border border-amber-200 rounded-lg space-y-4">
								<div className="flex justify-between items-center pb-3 border-b border-amber-200/60">
									<div className="font-bold text-amber-900">
										Biaya Administrasi Talangan
									</div>
									<div>
										{hasAdminTalanganDoc ? (
											<Badge className="bg-emerald-100 text-emerald-700 border-0">
												<CheckCircle className="w-3 h-3 mr-1" /> Lunas
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-500 border-slate-300"
											>
												Belum Lunas
											</Badge>
										)}
									</div>
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
												placeholder="0"
												value={
													formData?.adminTalaganNominal === 0 ||
													formData?.adminTalaganNominal === "0"
														? ""
														: (formData?.adminTalaganNominal ?? "")
												}
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
									<StagedDocumentUpload
										docKey="admin_talangan"
										isEditing={isEditingUtama}
										canEdit={canEdit}
										existingDocs={financeDocs["admin_talangan"]}
										stagedFile={stagedDocsUtama["admin_talangan"]}
										isDeleted={deletedDocKeysUtama.includes("admin_talangan")}
										onStageFile={(file) =>
											handleStageDoc("utama", "admin_talangan", file)
										}
										onRemoveStagedFile={() =>
											handleRemoveStagedDoc("utama", "admin_talangan")
										}
										onDeleteExistingDoc={() =>
											handleDeleteExistingDoc("utama", "admin_talangan")
										}
										onRestoreExistingDoc={() =>
											handleRestoreExistingDoc("utama", "admin_talangan")
										}
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
															placeholder="0"
															value={
																f.nominal === 0 || f.nominal === "0"
																	? ""
																	: (f.nominal ?? "")
															}
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
												<StagedDocumentUpload
													docKey={`custom_${f.id}`}
													isEditing={isEditingUtama}
													canEdit={canEdit}
													existingDocs={financeDocs[`custom_${f.id}`]}
													stagedFile={stagedDocsUtama[`custom_${f.id}`]}
													isDeleted={deletedDocKeysUtama.includes(
														`custom_${f.id}`,
													)}
													onStageFile={(file) =>
														handleStageDoc("utama", `custom_${f.id}`, file)
													}
													onRemoveStagedFile={() =>
														handleRemoveStagedDoc("utama", `custom_${f.id}`)
													}
													onDeleteExistingDoc={() =>
														handleDeleteExistingDoc("utama", `custom_${f.id}`)
													}
													onRestoreExistingDoc={() =>
														handleRestoreExistingDoc("utama", `custom_${f.id}`)
													}
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

			{/* Add Installment Modal */}
			<Dialog
				open={installmentModalOpen}
				onOpenChange={setInstallmentModalOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Tambah Pembayaran{" "}
							{activeSemester
								? `— Semester ${activeSemester.semesterNumber}`
								: ""}
						</DialogTitle>
						<DialogDescription>
							{activeSemester && (
								<>
									{activeInstallment
										? `Edit Pembayaran ke-${activeInstallment.installmentNumber} · `
										: `Pembayaran ke-${(activeSemester.installments?.length ?? 0) + 1} · `}
									Total tagihan:{" "}
									{formatRupiah(activeSemester?.totalBilled || 0)}
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div>
							<label className="text-sm font-medium text-slate-700 block mb-1.5">
								Nominal Pembayaran{" "}
								{!installmentForm.isTalangan && (
									<span className="text-rose-500">*</span>
								)}
							</label>
							<Input
								type="number"
								min={1}
								onKeyDown={preventMinus}
								placeholder="Nominal (Rp)"
								value={installmentForm.nominalPaid}
								onChange={(e) =>
									setInstallmentForm((p) => ({
										...p,
										nominalPaid: e.target.value,
									}))
								}
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-700 block mb-1.5">
								Tanggal Bayar
							</label>
							<Input
								type="date"
								value={installmentForm.paymentDate}
								onChange={(e) =>
									setInstallmentForm((p) => ({
										...p,
										paymentDate: e.target.value,
									}))
								}
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-700 block mb-1.5">
								Keterangan (opsional)
							</label>
							<Input
								placeholder="Contoh: Pembayaran via transfer BCA"
								value={installmentForm.notes}
								onChange={(e) =>
									setInstallmentForm((p) => ({ ...p, notes: e.target.value }))
								}
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-700 block mb-1.5">
								Bukti Pembayaran (PDF / Gambar)
							</label>
							{installmentForm.buktiBayarUrl && !installmentForm.file && (
								<div className="flex items-center justify-between p-2.5 mb-2 bg-slate-50 border border-slate-200 rounded-lg">
									<div className="flex items-center gap-2 text-xs font-medium text-slate-700 truncate">
										<FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
										<span className="truncate">File Bukti Terlampir</span>
									</div>
									<a
										href={`${API_URL}${installmentForm.buktiBayarUrl.startsWith("/") ? "" : "/"}${installmentForm.buktiBayarUrl}`}
										target="_blank"
										rel="noreferrer"
										className="text-xs text-blue-600 hover:underline font-semibold flex-shrink-0 ml-2"
									>
										Lihat Berkas
									</a>
								</div>
							)}
							<Input
								type="file"
								accept="application/pdf,image/*"
								className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) {
										setInstallmentForm((prev) => ({
											...prev,
											file: f,
										}));
									}
								}}
							/>
							{installmentForm.file && (
								<p className="text-[11px] text-emerald-600 font-medium mt-1">
									File dipilih: {installmentForm.file.name} (
									{(installmentForm.file.size / 1024).toFixed(1)} KB)
								</p>
							)}
						</div>
						{formData?.metodePembayaran === "dana_talangan" && (
							<div>
								<div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
									<Checkbox
										id="isTalangan"
										checked={installmentForm.isTalangan}
										onCheckedChange={(checked) =>
											setInstallmentForm((p) => ({
												...p,
												isTalangan: !!checked,
											}))
										}
									/>
									<label
										htmlFor="isTalangan"
										className="text-sm font-medium leading-none cursor-pointer text-slate-700"
									>
										Gunakan Dana Talangan untuk pembayaran ini
									</label>
								</div>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setInstallmentModalOpen(false)}
							disabled={installmentLoading}
						>
							Batal
						</Button>
						<Button
							onClick={handleSaveInstallment}
							disabled={
								!installmentForm.nominalPaid && !installmentForm.isTalangan
							}
							className="bg-emerald-600 hover:bg-emerald-700"
						>
							<Plus className="w-4 h-4 mr-2" />
							Terapkan ke Draft
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Modal Tambah / Edit Pembayaran Dana Talangan (Tahap 1 & Tahap 2) */}
			<Dialog open={talanganModalOpen} onOpenChange={setTalanganModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							{activeTalanganInstallment ? (
								<Edit className="w-4 h-4 text-blue-600" />
							) : (
								<Plus className="w-4 h-4 text-emerald-600" />
							)}
							<span>
								{activeTalanganInstallment
									? "Edit Pembayaran"
									: "Tambah Pembayaran"}{" "}
								—{" "}
								{activeTalanganStage === "tahap_1"
									? "Tahap 1 (Interview & Talangan)"
									: "Tahap 2 (Keberangkatan)"}
							</span>
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							{activeTalanganStage === "tahap_1"
								? "Pencatatan pembayaran cicilan pinjaman dana talangan Tahap 1"
								: "Pencatatan pembayaran cicilan pinjaman dana talangan Tahap 2"}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Info Tagihan Ringkas */}
						<div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
							<div>
								<span className="text-slate-500 block">Total Tagihan:</span>
								<span className="font-bold text-slate-800 font-mono">
									{formatRupiah(
										activeTalanganStage === "tahap_1"
											? totalTahap1Nominal
											: totalTahap2Nominal,
									)}
								</span>
							</div>
							<div className="text-right">
								<span className="text-slate-500 block">
									Sisa Belum Terbayar:
								</span>
								<span className="font-bold text-amber-700 font-mono">
									{formatRupiah(
										Math.max(
											0,
											(activeTalanganStage === "tahap_1"
												? totalTahap1Nominal - t1Paid
												: totalTahap2Nominal - t2Paid) +
												(activeTalanganInstallment
													? Number(activeTalanganInstallment.nominalPaid) || 0
													: 0),
										),
									)}
								</span>
							</div>
						</div>

						{/* Input Nominal */}
						<div>
							<label className="text-xs font-semibold text-slate-700 block mb-1.5">
								Nominal Pembayaran (Rp) <span className="text-rose-500">*</span>
							</label>
							<Input
								type="number"
								min={1}
								onKeyDown={preventMinus}
								placeholder="0"
								value={talanganInstallmentForm.nominalPaid}
								onChange={(e) => {
									const val = e.target.value.replace(/^0+(?=\d)/, "");
									setTalanganInstallmentForm((p) => ({
										...p,
										nominalPaid: val,
									}));
								}}
								className="font-mono text-sm font-semibold"
							/>
						</div>

						{/* Input Tanggal Bayar */}
						<div>
							<label className="text-xs font-semibold text-slate-700 block mb-1.5">
								Tanggal Pembayaran
							</label>
							<Input
								type="date"
								value={talanganInstallmentForm.paymentDate}
								onChange={(e) =>
									setTalanganInstallmentForm((p) => ({
										...p,
										paymentDate: e.target.value,
									}))
								}
								className="text-xs"
							/>
						</div>

						{/* Input Keterangan */}
						<div>
							<label className="text-xs font-semibold text-slate-700 block mb-1.5">
								Keterangan / Metode (opsional)
							</label>
							<Input
								placeholder="Contoh: Transfer BCA, Tunai, Titipan Orang Tua"
								value={talanganInstallmentForm.notes}
								onChange={(e) =>
									setTalanganInstallmentForm((p) => ({
										...p,
										notes: e.target.value,
									}))
								}
								className="text-xs"
							/>
						</div>

						{/* Upload Bukti Pembayaran */}
						<div>
							<label className="text-xs font-semibold text-slate-700 block mb-1.5">
								Bukti Pembayaran (PDF / Gambar)
							</label>
							{talanganInstallmentForm.buktiBayarUrl &&
								!talanganInstallmentForm.file && (
									<div className="flex items-center justify-between p-2 mb-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
										<div className="flex items-center gap-2 truncate text-slate-700">
											<FileText className="w-4 h-4 text-blue-600 shrink-0" />
											<span className="truncate">File Bukti Terlampir</span>
										</div>
										<a
											href={`${API_URL}${talanganInstallmentForm.buktiBayarUrl.startsWith("/") ? "" : "/"}${talanganInstallmentForm.buktiBayarUrl}`}
											target="_blank"
											rel="noreferrer"
											className="text-blue-600 hover:underline font-semibold shrink-0 ml-2"
										>
											Lihat Berkas
										</a>
									</div>
								)}
							<Input
								type="file"
								accept="application/pdf,image/*"
								className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) {
										setTalanganInstallmentForm((prev) => ({
											...prev,
											file: f,
										}));
									}
								}}
							/>
							{talanganInstallmentForm.file && (
								<p className="text-[11px] text-emerald-600 font-medium mt-1">
									File dipilih: {talanganInstallmentForm.file.name} (
									{(talanganInstallmentForm.file.size / 1024).toFixed(1)} KB)
								</p>
							)}
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setTalanganModalOpen(false)}
						>
							Batal
						</Button>
						<Button
							size="sm"
							onClick={handleSaveTalanganInstallment}
							disabled={
								!talanganInstallmentForm.nominalPaid ||
								Number(talanganInstallmentForm.nominalPaid) <= 0
							}
							className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
						>
							<Plus className="w-3.5 h-3.5 mr-1.5" />
							Terapkan ke Draf
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ─── 3. CARD BIAYA TAMBAHAN LAINNYA ─── */}
			<Card className="border border-slate-200/90 shadow-2xs overflow-hidden rounded-xl bg-white">
				<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5 sm:px-6 flex flex-row items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100/70 shadow-2xs">
							<CreditCard className="w-4 h-4" />
						</div>
						<div>
							<CardTitle className="text-base font-bold text-slate-900 tracking-tight">
								Biaya Tambahan Lainnya
							</CardTitle>
							<p className="text-xs text-slate-500 mt-0.5">
								Biaya pendukung sertifikasi bahasa, paspor, dan kebutuhan
								lainnya
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{canEdit && !isEditingTambahan && (
							<Button
								size="sm"
								onClick={() => setIsEditingTambahan(true)}
								className="bg-[#0517B0] hover:bg-blue-800 text-white font-semibold text-xs h-8.5 rounded-lg shadow-2xs gap-1.5"
							>
								<Edit className="w-3.5 h-3.5" /> Edit Data
							</Button>
						)}
						{isEditingTambahan && (
							<>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleCancelEdit("tambahan")}
									disabled={loadingTambahan}
									className="h-8.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
								>
									<X className="w-3.5 h-3.5 mr-1" /> Batal
								</Button>
								<Button
									size="sm"
									onClick={() => triggerSave("tambahan")}
									disabled={loadingTambahan}
									className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8.5 rounded-lg shadow-2xs"
								>
									{loadingTambahan ? (
										<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
									) : (
										<Save className="w-3.5 h-3.5 mr-1.5" />
									)}
									Simpan
								</Button>
							</>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-5 sm:p-6 space-y-4 bg-white">
					{/* Fixed Additional Costs */}
					<div className="grid gap-4">
						{/* 1. Sertifikasi Bahasa (TOEIC / JLPT / etc) */}
						<div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-4 hover:border-indigo-200 transition-all">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
								<div className="flex items-center gap-3">
									<div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 shadow-2xs">
										<Languages className="w-5 h-5" />
									</div>
									<div>
										<h4 className="font-bold text-slate-800 text-sm sm:text-base">
											Sertifikasi Bahasa
										</h4>
										<p className="text-xs text-slate-400 font-medium">
											Ujian kompetensi bahasa asing (TOEIC, JLPT, TOCFL, atau
											setara)
										</p>
									</div>
								</div>
								<div>
									{hasToeicDoc ? (
										<Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs py-1 px-2.5">
											<CheckCircle className="w-3.5 h-3.5 mr-1" /> Lunas
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-slate-500 border-slate-200 text-xs py-1 px-2.5"
										>
											Belum Lunas
										</Badge>
									)}
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
								<div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
									<label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
										Nominal Biaya
									</label>
									{isEditingTambahan ? (
										<div className="relative">
											<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
												Rp
											</span>
											<Input
												type="number"
												min={0}
												onKeyDown={preventMinus}
												className="pl-9 h-10 text-sm font-semibold bg-white"
												placeholder="0"
												value={
													formData?.toeicNominal === 0 ||
													formData?.toeicNominal === "0"
														? ""
														: (formData?.toeicNominal ?? "")
												}
												onChange={(e) =>
													handleNumberFieldChange(
														"toeicNominal",
														e.target.value,
													)
												}
											/>
										</div>
									) : (
										<div className="text-lg font-bold text-slate-900">
											{formatRupiah(formData?.toeicNominal || 0)}
										</div>
									)}
								</div>

								<div className="md:col-span-2 space-y-1.5">
									<label className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
										Bukti Bayar Sertifikasi Bahasa (PDF)
									</label>
									<StagedDocumentUpload
										docKey="toeic"
										isEditing={isEditingTambahan}
										canEdit={canEdit}
										existingDocs={financeDocs["toeic"]}
										stagedFile={stagedDocsTambahan["toeic"]}
										isDeleted={deletedDocKeysTambahan.includes("toeic")}
										onStageFile={(file) =>
											handleStageDoc("tambahan", "toeic", file)
										}
										onRemoveStagedFile={() =>
											handleRemoveStagedDoc("tambahan", "toeic")
										}
										onDeleteExistingDoc={() =>
											handleDeleteExistingDoc("tambahan", "toeic")
										}
										onRestoreExistingDoc={() =>
											handleRestoreExistingDoc("tambahan", "toeic")
										}
									/>
								</div>
							</div>
						</div>

						{/* 2. Pembuatan Paspor */}
						<div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-4 hover:border-sky-200 transition-all">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
								<div className="flex items-center gap-3">
									<div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100/80 shadow-2xs">
										<FileText className="w-5 h-5" />
									</div>
									<div>
										<h4 className="font-bold text-slate-800 text-sm sm:text-base">
											Pembuatan Paspor
										</h4>
										<p className="text-xs text-slate-400 font-medium">
											Pengurusan dan penerbitan dokumen paspor magang
										</p>
									</div>
								</div>
								<div>
									{hasPasporDoc ? (
										<Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs py-1 px-2.5">
											<CheckCircle className="w-3.5 h-3.5 mr-1" /> Lunas
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-slate-500 border-slate-200 text-xs py-1 px-2.5"
										>
											Belum Lunas
										</Badge>
									)}
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
								<div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
									<label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
										Nominal Biaya
									</label>
									{isEditingTambahan ? (
										<div className="relative">
											<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
												Rp
											</span>
											<Input
												type="number"
												min={0}
												onKeyDown={preventMinus}
												className="pl-9 h-10 text-sm font-semibold bg-white"
												placeholder="0"
												value={
													formData?.pasporNominal === 0 ||
													formData?.pasporNominal === "0"
														? ""
														: (formData?.pasporNominal ?? "")
												}
												onChange={(e) =>
													handleNumberFieldChange(
														"pasporNominal",
														e.target.value,
													)
												}
											/>
										</div>
									) : (
										<div className="text-lg font-bold text-slate-900">
											{formatRupiah(formData?.pasporNominal || 0)}
										</div>
									)}
								</div>

								<div className="md:col-span-2 space-y-1.5">
									<label className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
										Bukti Bayar Pembuatan Paspor (PDF)
									</label>
									<StagedDocumentUpload
										docKey="paspor"
										isEditing={isEditingTambahan}
										canEdit={canEdit}
										existingDocs={financeDocs["paspor"]}
										stagedFile={stagedDocsTambahan["paspor"]}
										isDeleted={deletedDocKeysTambahan.includes("paspor")}
										onStageFile={(file) =>
											handleStageDoc("tambahan", "paspor", file)
										}
										onRemoveStagedFile={() =>
											handleRemoveStagedDoc("tambahan", "paspor")
										}
										onDeleteExistingDoc={() =>
											handleDeleteExistingDoc("tambahan", "paspor")
										}
										onRestoreExistingDoc={() =>
											handleRestoreExistingDoc("tambahan", "paspor")
										}
									/>
								</div>
							</div>
						</div>

						{/* 3. Rumah Juang */}
						<div
							className={`p-5 border rounded-xl shadow-xs space-y-4 transition-all ${
								pmbState?.rumahJuang
									? "bg-white border-amber-200 hover:border-amber-300"
									: "bg-slate-50 border-slate-200 opacity-60"
							}`}
						>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-amber-100">
								<div className="flex items-center gap-3">
									<div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80 shadow-2xs">
										<Home className="w-5 h-5" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<h4 className="font-bold text-slate-800 text-sm sm:text-base">
												Fasilitas Rumah Juang
											</h4>
											{pmbState?.rumahJuang ? (
												<Badge className="bg-amber-100 text-amber-700 border-0 text-xs font-semibold">
													Aktif Digunakan
												</Badge>
											) : (
												<Badge variant="outline" className="bg-white text-xs">
													Non-Aktif
												</Badge>
											)}
										</div>
										<p className="text-xs text-slate-400 font-medium">
											Akomodasi dan fasilitas asrama persiapan mahasiswa
										</p>
									</div>
								</div>
								<div>
									{hasRumahJuangDoc ? (
										<Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs py-1 px-2.5">
											<CheckCircle className="w-3.5 h-3.5 mr-1" /> Lunas
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-slate-500 border-slate-200 text-xs py-1 px-2.5"
										>
											Belum Lunas
										</Badge>
									)}
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
								<div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
									<label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
										Nominal Biaya
									</label>
									{isEditingTambahan ? (
										<div className="relative">
											<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
												Rp
											</span>
											<Input
												type="number"
												min={0}
												onKeyDown={preventMinus}
												className="pl-9 h-10 text-sm font-semibold bg-white"
												placeholder="0"
												value={
													formData?.rumahJuangNominal === 0 ||
													formData?.rumahJuangNominal === "0"
														? ""
														: (formData?.rumahJuangNominal ?? "")
												}
												onChange={(e) =>
													handleNumberFieldChange(
														"rumahJuangNominal",
														e.target.value,
													)
												}
												disabled={!pmbState?.rumahJuang}
											/>
										</div>
									) : (
										<div className="text-lg font-bold text-slate-900">
											{formatRupiah(formData?.rumahJuangNominal || 0)}
										</div>
									)}
								</div>

								<div className="md:col-span-2 space-y-1.5">
									<label className="text-[11px] font-semibold text-slate-600 block uppercase tracking-wider">
										Bukti Bayar Rumah Juang (PDF)
									</label>
									{pmbState?.rumahJuang ? (
										<StagedDocumentUpload
											docKey="rumah_juang"
											isEditing={isEditingTambahan}
											canEdit={canEdit}
											existingDocs={financeDocs["rumah_juang"]}
											stagedFile={stagedDocsTambahan["rumah_juang"]}
											isDeleted={deletedDocKeysTambahan.includes("rumah_juang")}
											onStageFile={(file) =>
												handleStageDoc("tambahan", "rumah_juang", file)
											}
											onRemoveStagedFile={() =>
												handleRemoveStagedDoc("tambahan", "rumah_juang")
											}
											onDeleteExistingDoc={() =>
												handleDeleteExistingDoc("tambahan", "rumah_juang")
											}
											onRestoreExistingDoc={() =>
												handleRestoreExistingDoc("tambahan", "rumah_juang")
											}
										/>
									) : (
										<div className="text-xs text-slate-400 italic bg-slate-100 p-3 rounded-lg border border-slate-200">
											Upload berkas tidak aktif karena fasilitas Rumah Juang
											mahasiswa ini berstatus Non-Aktif (diatur oleh Divisi
											PMB).
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Custom Fields Biaya Tambahan */}
					{customData.filter((f) => f.fieldType === "biaya_tambahan").length >
						0 && (
						<div className="grid gap-4 mt-4">
							{customData
								.filter((f) => f.fieldType === "biaya_tambahan")
								.map((f) => {
									const isCustomLunas =
										!!stagedDocsTambahan[`custom_${f.id}`] ||
										(((financeDocs[`custom_${f.id}`]?.length ?? 0) > 0 ||
											!!f.status) &&
											!deletedDocKeysTambahan.includes(`custom_${f.id}`));

									return (
										<div
											key={f.id}
											className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-4 hover:border-slate-300 transition-all"
										>
											<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
												<div className="flex items-center gap-3">
													<div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
														<CreditCard className="w-5 h-5" />
													</div>
													<div className="flex items-center gap-2">
														<h4 className="font-bold text-slate-800 text-sm sm:text-base">
															{f.label}
														</h4>
														{canEdit && (
															<Button
																variant="ghost"
																size="icon"
																onClick={() => triggerDeleteCustomField(f.id)}
																className="h-7 w-7 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-lg"
																title="Hapus Tagihan Ini"
															>
																<Trash2 className="w-4 h-4" />
															</Button>
														)}
													</div>
												</div>
												<div>
													{isCustomLunas ? (
														<Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs py-1 px-2.5">
															<CheckCircle className="w-3.5 h-3.5 mr-1" /> Lunas
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="text-slate-500 border-slate-200 text-xs py-1 px-2.5"
														>
															Belum Lunas
														</Badge>
													)}
												</div>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
												<div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
													<label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
														Nominal Biaya
													</label>
													{isEditingTambahan ? (
														<div className="relative">
															<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
																Rp
															</span>
															<Input
																type="number"
																min={0}
																onKeyDown={preventMinus}
																className="pl-9 h-10 text-sm font-semibold bg-white"
																placeholder="0"
																value={
																	f.nominal === 0 || f.nominal === "0"
																		? ""
																		: (f.nominal ?? "")
																}
																onChange={(e) =>
																	handleCustomNumberFieldChange(
																		f.id,
																		"nominal",
																		e.target.value,
																	)
																}
															/>
														</div>
													) : (
														<div className="text-lg font-bold text-slate-900">
															{formatRupiah(f.nominal || 0)}
														</div>
													)}
												</div>

												<div className="md:col-span-2 space-y-1.5">
													<label className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
														Bukti Bayar {f.label} (PDF)
													</label>
													<StagedDocumentUpload
														docKey={`custom_${f.id}`}
														isEditing={isEditingTambahan}
														canEdit={canEdit}
														existingDocs={financeDocs[`custom_${f.id}`]}
														stagedFile={stagedDocsTambahan[`custom_${f.id}`]}
														isDeleted={deletedDocKeysTambahan.includes(
															`custom_${f.id}`,
														)}
														onStageFile={(file) =>
															handleStageDoc("tambahan", `custom_${f.id}`, file)
														}
														onRemoveStagedFile={() =>
															handleRemoveStagedDoc(
																"tambahan",
																`custom_${f.id}`,
															)
														}
														onDeleteExistingDoc={() =>
															handleDeleteExistingDoc(
																"tambahan",
																`custom_${f.id}`,
															)
														}
														onRestoreExistingDoc={() =>
															handleRestoreExistingDoc(
																"tambahan",
																`custom_${f.id}`,
															)
														}
													/>
												</div>
											</div>
										</div>
									);
								})}
						</div>
					)}

					<Button
						variant="outline"
						className="w-full border-dashed bg-slate-50 hover:bg-slate-100 py-5 text-slate-600 font-medium"
						onClick={() => triggerAddCustomField("biaya_tambahan")}
					>
						<Plus className="w-4 h-4 mr-2" /> Tambah Biaya Lainnya
					</Button>
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

			{/* Modal Atur Pembagian Biaya Pendidikan */}
			<Dialog open={partitionModalOpen} onOpenChange={setPartitionModalOpen}>
				<DialogContent className="sm:max-w-5xl max-w-5xl w-full bg-white p-8 max-h-[92vh] overflow-y-auto">
					<DialogHeader className="pb-2">
						<DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
							<SlidersHorizontal className="w-5 h-5 text-indigo-600" />
							Atur Pembagian & Partisi Biaya Pendidikan
						</DialogTitle>
						<DialogDescription className="text-sm text-slate-500">
							Alokasikan target total biaya pendidikan mahasiswa ke dalam 4 pos
							pembayaran utama (Registrasi Awal, 6 Semester, Interview Magang,
							dan Keberangkatan).
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 py-2">
						{/* Total Biaya Tagihan (Read-Only dari PMB) */}
						<div className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-slate-200 rounded-xl space-y-3">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
									<Lock className="w-4 h-4 text-indigo-600" />
									Total Biaya Pendidikan Keseluruhan (Induk PMB)
								</label>
								<Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-50 text-xs font-semibold px-3 py-1">
									🔒 Ditetapkan oleh Divisi PMB
								</Badge>
							</div>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-5 py-4 rounded-xl border border-slate-200/80 shadow-xs gap-3">
								<div>
									<span className="text-xs text-slate-400 block font-medium">
										Total Kewajiban Biaya Mahasiswa:
									</span>
									<span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
										{formatRupiah(partitionTotalBiaya)}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className="text-xs font-semibold text-slate-600 border-slate-200 bg-slate-50 px-3 py-1.5"
									>
										Target Alokasi: 100%
									</Badge>
								</div>
							</div>
							<p className="text-xs text-slate-500 flex items-start gap-2 leading-relaxed">
								<span className="text-indigo-600 font-bold">ℹ️</span>
								<span>
									Total biaya pendidikan hanya dapat diedit oleh{" "}
									<strong>Divisi PMB</strong> pada Tab Skema Keuangan. Finance
									bertugas membagi dan menyesuaikan alokasi ke 4 pos pembayaran
									di bawah agar sinkron dengan Pembayaran Utama.
								</span>
							</p>
						</div>

						{/* 4 Komponen Inputs */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{/* 1. Registrasi Awal */}
							<div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col justify-between">
								<div>
									<div className="flex items-center justify-between mb-1">
										<label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
											<CreditCard className="w-4 h-4 text-sky-600" />
											1. Registrasi Awal
										</label>
										<span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
											{partitionTotalBiaya > 0
												? Math.round(
														(partitionRegistrasi / partitionTotalBiaya) * 100,
													)
												: 0}
											%
										</span>
									</div>
									<p className="text-[11px] text-slate-400 mb-2">
										Biaya daftar ulang & admin
									</p>
									<div className="relative">
										<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
											Rp
										</span>
										<Input
											type="number"
											min={0}
											onKeyDown={preventMinus}
											value={partitionRegistrasi || ""}
											onChange={(e) =>
												setPartitionRegistrasi(Number(e.target.value) || 0)
											}
											className="pl-9 h-10 text-sm font-semibold"
											placeholder="Nominal registrasi"
										/>
									</div>
								</div>
								<div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
									{formatRupiah(partitionRegistrasi)}
								</div>
							</div>

							{/* 2. Biaya Semester */}
							<div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between">
								<div>
									<div className="flex items-center justify-between mb-1">
										<label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
											<GraduationCap className="w-4 h-4 text-indigo-600" />
											2. 6 Semester
										</label>
										<span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
											{partitionTotalBiaya > 0
												? Math.round(
														(partitionSemesterTotal / partitionTotalBiaya) *
															100,
													)
												: 0}
											%
										</span>
									</div>
									<p className="text-[11px] text-slate-400 mb-2">
										Nominal per semester x 6
									</p>
									<div className="relative">
										<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
											Rp
										</span>
										<Input
											type="number"
											min={0}
											onKeyDown={preventMinus}
											value={partitionSemesterPerSem || ""}
											onChange={(e) => {
												const val = Number(e.target.value) || 0;
												setPartitionSemesterPerSem(val);
												setPartitionSemesterTotal(val * 6);
											}}
											className="pl-9 h-10 text-sm font-semibold"
											placeholder="Per semester"
										/>
									</div>
								</div>
								<div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
									<span>Total 6 Smt:</span>
									<span className="font-bold text-indigo-700">
										{formatRupiah(partitionSemesterTotal)}
									</span>
								</div>
							</div>

							{/* 3. Interview Magang */}
							<div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between">
								<div>
									<div className="flex items-center justify-between mb-1">
										<label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
											<Building className="w-4 h-4 text-amber-600" />
											3. Interview Magang
										</label>
										<span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
											{partitionTotalBiaya > 0
												? Math.round(
														(partitionInterview / partitionTotalBiaya) * 100,
													)
												: 0}
											%
										</span>
									</div>
									<p className="text-[11px] text-slate-400 mb-2">
										Seleksi mitra luar negeri
									</p>
									<div className="relative">
										<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
											Rp
										</span>
										<Input
											type="number"
											min={0}
											onKeyDown={preventMinus}
											value={partitionInterview || ""}
											onChange={(e) =>
												setPartitionInterview(Number(e.target.value) || 0)
											}
											className="pl-9 h-10 text-sm font-semibold"
											placeholder="Nominal interview"
										/>
									</div>
								</div>
								<div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
									{formatRupiah(partitionInterview)}
								</div>
							</div>

							{/* 4. Keberangkatan */}
							<div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between">
								<div>
									<div className="flex items-center justify-between mb-1">
										<label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
											<Plane className="w-4 h-4 text-emerald-600" />
											4. Keberangkatan
										</label>
										<span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
											{partitionTotalBiaya > 0
												? Math.round(
														(partitionKeberangkatan / partitionTotalBiaya) *
															100,
													)
												: 0}
											%
										</span>
									</div>
									<p className="text-[11px] text-slate-400 mb-2">
										Visa, tiket & keberangkatan
									</p>
									<div className="relative">
										<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
											Rp
										</span>
										<Input
											type="number"
											min={0}
											onKeyDown={preventMinus}
											value={partitionKeberangkatan || ""}
											onChange={(e) =>
												setPartitionKeberangkatan(Number(e.target.value) || 0)
											}
											className="pl-9 h-10 text-sm font-semibold"
											placeholder="Nominal keberangkatan"
										/>
									</div>
								</div>
								<div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
									{formatRupiah(partitionKeberangkatan)}
								</div>
							</div>
						</div>

						{/* Quick Helpers & Preset Buttons */}
						<div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
							<span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
								<Sparkles className="w-3.5 h-3.5 text-amber-500" /> Bantuan
								Cepat:
							</span>
							<div className="flex flex-wrap items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										const other =
											Number(partitionRegistrasi || 0) +
											Number(partitionSemesterTotal || 0) +
											Number(partitionInterview || 0);
										const rem = Math.max(
											0,
											Number(partitionTotalBiaya || 0) - other,
										);
										setPartitionKeberangkatan(rem);
									}}
									className="h-7 text-[11px] bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
								>
									Sisa ke Keberangkatan
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										const other =
											Number(partitionRegistrasi || 0) +
											Number(partitionInterview || 0) +
											Number(partitionKeberangkatan || 0);
										const rem = Math.max(
											0,
											Number(partitionTotalBiaya || 0) - other,
										);
										setPartitionSemesterTotal(rem);
										setPartitionSemesterPerSem(Math.round(rem / 6));
									}}
									className="h-7 text-[11px] bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
								>
									Sisa ke Semester (Bagi 6)
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										const total = Number(partitionTotalBiaya || 0);
										if (total > 0) {
											const reg = Math.round((total * 0.1) / 100000) * 100000;
											const semTot =
												Math.round((total * 0.5) / 600000) * 600000;
											const interview =
												Math.round((total * 0.15) / 100000) * 100000;
											const keb = total - (reg + semTot + interview);
											setPartitionRegistrasi(reg);
											setPartitionSemesterTotal(semTot);
											setPartitionSemesterPerSem(Math.round(semTot / 6));
											setPartitionInterview(interview);
											setPartitionKeberangkatan(keb > 0 ? keb : 0);
										}
									}}
									className="h-7 text-[11px] bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
								>
									Bagi Proporsional (10:50:15:25)
								</Button>
							</div>
						</div>

						{/* Live Allocation Summary Box */}
						{(() => {
							const modalTotalAllocated =
								Number(partitionRegistrasi || 0) +
								Number(partitionSemesterTotal || 0) +
								Number(partitionInterview || 0) +
								Number(partitionKeberangkatan || 0);
							const modalDiff =
								Number(partitionTotalBiaya || 0) - modalTotalAllocated;
							const modalIsMatched =
								Number(partitionTotalBiaya || 0) > 0 && modalDiff === 0;

							return (
								<div
									className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
										modalIsMatched
											? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
											: modalDiff > 0
												? "bg-amber-50/70 border-amber-200 text-amber-900"
												: "bg-rose-50/70 border-rose-200 text-rose-900"
									}`}
								>
									<div>
										<div className="flex items-center gap-2">
											{modalIsMatched ? (
												<CheckCircle2 className="w-4 h-4 text-emerald-600" />
											) : modalDiff > 0 ? (
												<AlertCircle className="w-4 h-4 text-amber-600" />
											) : (
												<AlertTriangle className="w-4 h-4 text-rose-600" />
											)}
											<span className="text-xs font-bold uppercase tracking-wider">
												{modalIsMatched
													? "Status: Alokasi Pas 100%"
													: modalDiff > 0
														? "Status: Terdapat Sisa Belum Teralokasi"
														: "Status: Total Partisi Melebihi Target"}
											</span>
										</div>
										<p className="text-xs mt-1 opacity-90">
											Total Terbagi:{" "}
											<span className="font-bold">
												{formatRupiah(modalTotalAllocated)}
											</span>{" "}
											dari{" "}
											<span className="font-bold">
												{formatRupiah(partitionTotalBiaya)}
											</span>
										</p>
									</div>

									<div className="text-right sm:border-l sm:pl-4 border-current/20">
										<span className="text-[11px] block opacity-80 uppercase font-semibold">
											{modalDiff >= 0 ? "Sisa Selisih" : "Kelebihan"}
										</span>
										<span className="text-sm font-black">
											{formatRupiah(Math.abs(modalDiff))}
										</span>
									</div>
								</div>
							);
						})()}
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setPartitionModalOpen(false)}
							disabled={partitionSaving}
							className="text-xs"
						>
							Batal
						</Button>
						<Button
							onClick={handleSavePartition}
							disabled={partitionSaving}
							className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
						>
							{partitionSaving ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Save className="w-4 h-4" />
							)}
							Terapkan & Simpan Pembagian
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
