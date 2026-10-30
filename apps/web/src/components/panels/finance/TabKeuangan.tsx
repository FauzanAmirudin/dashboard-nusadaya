"use client";

import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
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
import { API_URL, getToken } from "@/lib/eden";
import { formatRupiah } from "@/utils/format";
import { BiayaTambahanSection } from "./BiayaTambahanSection";
import { CustomFieldModal } from "./CustomFieldModal";
import { DanaTalanganSection } from "./DanaTalanganSection";
import { InstallmentModal } from "./InstallmentModal";
import { PartisiBiayaCard } from "./PartisiBiayaCard";
import { PartitionModal } from "./PartitionModal";
import { PaymentConfirmationModal } from "./PaymentConfirmationModal";
import { PembayaranUtamaSection } from "./PembayaranUtamaSection";
import { TalanganInstallmentModal } from "./TalanganInstallmentModal";

interface TabKeuanganProps {
	studentId: number;
	finState: any;
	pmbState: any;
	customFields: any[];
	canEdit: boolean;
	destinationCountry?: string | null;
	onUpdate: () => void;
}

export function TabKeuangan({
	studentId,
	finState,
	pmbState,
	customFields,
	canEdit,
	destinationCountry,
	onUpdate,
}: TabKeuanganProps) {
	const queryClient = useQueryClient();
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

	// Add / Edit Schedule Modal
	const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
	const [activeSemester, setActiveSemester] = useState<any>(null);
	const [activeInstallment, setActiveInstallment] = useState<any>(null);
	const [installmentLoading, setInstallmentLoading] = useState(false);
	const [scheduleForm, setScheduleForm] = useState<{
		nominalScheduled: string;
		dueDate: string;
		notes: string;
		installmentMonth: string;
		periodNotes?: string;
	}>({
		nominalScheduled: "",
		dueDate: new Date().toISOString().split("T")[0],
		notes: "",
		installmentMonth: "",
		periodNotes: "",
	});

	// Payment Confirmation Modal
	const [paymentConfirmModalOpen, setPaymentConfirmModalOpen] = useState(false);
	const [paymentActiveInstallment, setPaymentActiveInstallment] =
		useState<any>(null);
	const [paymentActiveSemester, setPaymentActiveSemester] = useState<any>(null);
	const [paymentForm, setPaymentForm] = useState<{
		paymentDate: string;
		nominalPaid: string;
		notes: string;
		file: File | null;
		buktiBayarUrl: string;
		status: string;
	}>({
		paymentDate: new Date().toISOString().split("T")[0],
		nominalPaid: "",
		notes: "",
		file: null,
		buktiBayarUrl: "",
		status: "LUNAS",
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

	const [installmentToDelete, setInstallmentToDelete] = useState<{
		semesterId: number;
		installmentId: number;
	} | null>(null);
	const [talanganToDelete, setTalanganToDelete] = useState<number | null>(null);
	const [isDeletingInstallment, setIsDeletingInstallment] = useState(false);

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

	// PMB DP extraction for seamless integration
	const pmbDp =
		Number(pmbState?.pmbDp) ||
		Number(pmbState?.totalDp) ||
		Number(pmbState?.pendaftaranDp) ||
		Number(pmbState?.paymentPlan?.totalDp) ||
		Number(pmbState?.paymentPlan?.pendaftaranDp) ||
		Number(finState?.pmbDp) ||
		0;

	// Initialize form data when state changes
	useEffect(() => {
		if (finState) {
			const initialForm = { ...finState };
			if (
				(!initialForm.registrasiNominal ||
					Number(initialForm.registrasiNominal) === 0) &&
				pmbDp > 0
			) {
				initialForm.registrasiNominal = pmbDp;
			}
			setFormData(initialForm);
		}
		if (customFields) {
			setCustomData(customFields);
		}
	}, [finState, customFields, pmbDp]);

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
			return {
				...s,
				isTalangan: nextIsTalangan,
				status: nextIsTalangan ? "LUNAS" : s.status,
			};
		});

		setSemesters(updatedList);

		const updatedTalanganSemesters = updatedList.filter(
			(s: any) => s.isTalangan,
		);
		const newTalanganTotal = updatedTalanganSemesters.reduce(
			(sum: number, s: any) => sum + (s.totalBilled || 0),
			0,
		);

		setFormData((prev: any) => ({
			...prev,
			t1SemesterNominalTotal: newTalanganTotal,
			t1SemesterStatus: updatedTalanganSemesters.length > 0,
		}));

		if (willBeTalangan) {
			toast.info(
				`Semester ${targetNum} sampai 6 dialihkan ke Dana Talangan (Draft). Tagihan otomatis diakumulasikan ke Plafon Tahap 1.`,
			);
		} else {
			toast.info(
				`Semester 1 sampai ${targetNum} dikembalikan ke Dana Mandiri (Draft).`,
			);
		}
	};

	const openScheduleModal = (semester: any, installment?: any) => {
		if (!canEdit) {
			toast.error("Anda tidak memiliki akses untuk mengubah data keuangan.");
			return;
		}
		setActiveSemester(semester);
		setActiveInstallment(installment || null);
		if (installment) {
			setScheduleForm({
				nominalScheduled: (installment.nominalScheduled !== undefined &&
				installment.nominalScheduled !== null
					? installment.nominalScheduled
					: installment.nominalPaid || ""
				).toString(),
				dueDate: installment.dueDate
					? installment.dueDate.split("T")[0]
					: installment.paymentDate
						? installment.paymentDate.split("T")[0]
						: new Date().toISOString().split("T")[0],
				notes: installment.notes || "",
				installmentMonth: installment.installmentMonth || "",
				periodNotes: installment.periodNotes || "",
			});
		} else {
			setScheduleForm({
				nominalScheduled: "",
				dueDate: new Date().toISOString().split("T")[0],
				notes: "",
				installmentMonth: "",
				periodNotes: "",
			});
		}
		setInstallmentModalOpen(true);
	};

	const openInstallmentModal = openScheduleModal;

	const saveScheduleModal = async () => {
		const nominal = Number(scheduleForm.nominalScheduled);
		if (!nominal || nominal <= 0) {
			toast.error("Nominal tagihan cicilan harus lebih dari 0");
			return;
		}
		if (!scheduleForm.installmentMonth?.trim()) {
			toast.error("Pilih atau isi bulan / periode cicilan");
			return;
		}
		if (!activeSemester?.id) {
			toast.error("Data semester tidak ditemukan");
			return;
		}

		// Validasi kapasitas sisa pagu SPP Semester jika pagu sudah ditentukan (> 0)
		const semTotalBilled = Number(activeSemester?.totalBilled) || 0;
		if (semTotalBilled > 0) {
			const existingOtherScheduled = (activeSemester?.installments || [])
				.filter(
					(inst: any) => !activeInstallment || inst.id !== activeInstallment.id,
				)
				.reduce(
					(sum: number, inst: any) =>
						sum + (Number(inst.nominalScheduled) || 0),
					0,
				);
			const maxCapacity = Math.max(0, semTotalBilled - existingOtherScheduled);
			if (nominal > maxCapacity) {
				toast.error(
					`Nominal tagihan cicilan (${formatRupiah(nominal)}) melebihi sisa pagu SPP yang tersedia (${formatRupiah(maxCapacity)} dari total pagu ${formatRupiah(semTotalBilled)}).`,
					{ duration: 5000 },
				);
				return;
			}
		}

		const semId = activeSemester.id;
		setInstallmentLoading(true);

		try {
			if (activeInstallment && activeInstallment.id > 0) {
				const res = await fetchApi(
					`/students/${studentId}/finance/semesters/${semId.toString()}/installments/${activeInstallment.id.toString()}`,
					{
						method: "PATCH",
						body: JSON.stringify({
							nominalScheduled: nominal,
							dueDate: scheduleForm.dueDate || null,
							notes: scheduleForm.notes || null,
							installmentMonth: scheduleForm.installmentMonth,
							periodNotes: scheduleForm.periodNotes || null,
						}),
					},
				);
				if (!res.ok) {
					const err = await res.json();
					throw new Error(err.message || "Gagal memperbarui jadwal cicilan");
				}
				toast.success("Jadwal cicilan berhasil diperbarui!");
			} else {
				const res = await fetchApi(
					`/students/${studentId}/finance/semesters/${semId.toString()}/installments`,
					{
						method: "POST",
						body: JSON.stringify({
							nominalScheduled: nominal,
							dueDate: scheduleForm.dueDate || null,
							status: "BELUM_BAYAR",
							nominalPaid: 0,
							paymentDate: null,
							notes: scheduleForm.notes || null,
							isTalangan: false,
							installmentMonth: scheduleForm.installmentMonth,
							periodNotes: scheduleForm.periodNotes || null,
							buktiBayarUrl: null,
						}),
					},
				);
				if (!res.ok) {
					const err = await res.json();
					throw new Error(err.message || "Gagal menyimpan jadwal cicilan baru");
				}
				toast.success("Jadwal cicilan baru berhasil disimpan!");
			}

			setInstallmentModalOpen(false);
			await fetchSemesters();
			onUpdate();
			queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
			queryClient.invalidateQueries({ queryKey: ["students-list"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
		} catch (e: any) {
			toast.error(e.message || "Terjadi kesalahan saat menyimpan jadwal");
		} finally {
			setInstallmentLoading(false);
		}
	};

	const saveInstallmentModal = saveScheduleModal;

	const openPaymentModal = (semester: any, installment: any) => {
		if (!canEdit) {
			toast.error("Anda tidak memiliki akses untuk mengubah data keuangan.");
			return;
		}
		setPaymentActiveSemester(semester);
		setPaymentActiveInstallment(installment);
		const schedNominal =
			installment.nominalScheduled !== undefined &&
			installment.nominalScheduled !== null
				? installment.nominalScheduled
				: installment.nominalPaid || 0;
		const paidNominal =
			installment.nominalPaid > 0 ? installment.nominalPaid : schedNominal;

		setPaymentForm({
			paymentDate: installment.paymentDate
				? installment.paymentDate.split("T")[0]
				: new Date().toISOString().split("T")[0],
			nominalPaid: paidNominal ? paidNominal.toString() : "",
			notes: installment.notes || "",
			file: installment.file || null,
			buktiBayarUrl: installment.buktiBayarUrl || "",
			status:
				installment.status ||
				(installment.nominalPaid > 0 ? "LUNAS" : "BELUM_BAYAR"),
		});
		setPaymentConfirmModalOpen(true);
	};

	const savePaymentModal = async () => {
		const nominal = Number(paymentForm.nominalPaid);
		if (!nominal || nominal <= 0) {
			toast.error("Nominal pembayaran harus lebih dari 0");
			return;
		}
		if (!paymentActiveInstallment || !paymentActiveSemester) return;

		const semId = paymentActiveSemester.id;
		setInstallmentLoading(true);

		try {
			let buktiBayarUrl = paymentForm.buktiBayarUrl || "";

			// Upload berkas bukti bayar jika ada file baru yang dipilih
			if (paymentForm.file) {
				const fd = new FormData();
				fd.append("file", paymentForm.file);
				fd.append("studentId", studentId.toString());
				fd.append("category", "finance");
				fd.append("panel", "finance");
				fd.append("documentKey", "semester_1_installment");

				const upRes = await fetchApi("/files/upload", {
					method: "POST",
					body: fd,
				});

				if (!upRes.ok) {
					const upErr = await upRes.json().catch(() => ({}));
					throw new Error(
						upErr.message || "Gagal mengunggah berkas bukti bayar",
					);
				}
				const upData = await upRes.json();
				if (upData?.data?.id) {
					buktiBayarUrl = `/files/${upData.data.id}/download`;
				}
			}

			const res = await fetchApi(
				`/students/${studentId}/finance/semesters/${semId.toString()}/installments/${paymentActiveInstallment.id.toString()}`,
				{
					method: "PATCH",
					body: JSON.stringify({
						nominalPaid: nominal,
						paymentDate:
							paymentForm.paymentDate || new Date().toISOString().split("T")[0],
						notes: paymentForm.notes || null,
						buktiBayarUrl: buktiBayarUrl || null,
						status: "LUNAS",
					}),
				},
			);

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.message || "Gagal menyimpan realisasi pembayaran");
			}

			toast.success("Pembayaran cicilan berhasil dicatat & disimpan!");
			setPaymentConfirmModalOpen(false);
			await fetchSemesters();
			onUpdate();
			queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
			queryClient.invalidateQueries({ queryKey: ["students-list"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
		} catch (e: any) {
			toast.error(e.message || "Terjadi kesalahan saat menyimpan pembayaran");
		} finally {
			setInstallmentLoading(false);
		}
	};

	const cancelPaymentModal = async () => {
		if (!paymentActiveInstallment || !paymentActiveSemester) return;
		const semId = paymentActiveSemester.id;
		setInstallmentLoading(true);

		try {
			const res = await fetchApi(
				`/students/${studentId}/finance/semesters/${semId.toString()}/installments/${paymentActiveInstallment.id.toString()}`,
				{
					method: "PATCH",
					body: JSON.stringify({
						nominalPaid: 0,
						paymentDate: null,
						status: "BELUM_BAYAR",
						buktiBayarUrl: null,
					}),
				},
			);

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.message || "Gagal membatalkan status lunas");
			}

			toast.success(
				"Status pembayaran cicilan dibatalkan (kembali ke Belum Bayar)",
			);
			setPaymentConfirmModalOpen(false);
			await fetchSemesters();
			onUpdate();
			queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
			queryClient.invalidateQueries({ queryKey: ["students-list"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
		} catch (e: any) {
			toast.error(e.message || "Terjadi kesalahan sistem");
		} finally {
			setInstallmentLoading(false);
		}
	};

	const handleDeleteInstallment = (
		semesterId: number,
		installmentId: number,
	) => {
		if (!canEdit) return;
		setInstallmentToDelete({ semesterId, installmentId });
	};

	const confirmDeleteInstallment = async () => {
		if (!installmentToDelete || !canEdit) return;
		setIsDeletingInstallment(true);
		const { semesterId, installmentId } = installmentToDelete;
		try {
			if (installmentId > 0) {
				const res = await fetchApi(
					`/students/${studentId}/finance/semesters/${semesterId.toString()}/installments/${installmentId.toString()}`,
					{ method: "DELETE" },
				);
				if (!res.ok) {
					const err = await res.json();
					throw new Error(err.message || "Gagal menghapus jadwal cicilan");
				}
				toast.success("Jadwal cicilan berhasil dihapus!");
			}
			await fetchSemesters();
			onUpdate();
			queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
			queryClient.invalidateQueries({ queryKey: ["students-list"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
		} catch (e: any) {
			toast.error(e.message || "Gagal menghapus jadwal cicilan");
		} finally {
			setIsDeletingInstallment(false);
			setInstallmentToDelete(null);
		}
	};

	// Talangan Installment Modal Handlers
	const openTalanganModal = (
		stage: "tahap_1" | "tahap_2",
		installment?: any,
	) => {
		if (!canEdit) {
			toast.error(
				"Anda tidak memiliki akses untuk mencatat pembayaran talangan.",
			);
			return;
		}
		setActiveTalanganStage(stage);
		setActiveTalanganInstallment(installment || null);
		if (installment) {
			setTalanganInstallmentForm({
				nominalPaid: installment.nominalPaid.toString(),
				paymentDate: installment.paymentDate
					? installment.paymentDate.split("T")[0]
					: new Date().toISOString().split("T")[0],
				notes: installment.notes || "",
				file: installment.file || null,
				buktiBayarUrl: installment.buktiBayarUrl || "",
			});
		} else {
			setTalanganInstallmentForm({
				nominalPaid: "",
				paymentDate: new Date().toISOString().split("T")[0],
				notes: "",
				file: null,
				buktiBayarUrl: "",
			});
		}
		setTalanganModalOpen(true);
	};

	const saveTalanganModal = async () => {
		const nominal = Number(talanganInstallmentForm.nominalPaid);
		if (!nominal || nominal <= 0) {
			toast.error("Nominal pembayaran harus lebih dari 0");
			return;
		}

		setInstallmentLoading(true);
		try {
			let buktiBayarUrl = talanganInstallmentForm.buktiBayarUrl || "";

			if (talanganInstallmentForm.file) {
				const fd = new FormData();
				fd.append("file", talanganInstallmentForm.file);
				fd.append("studentId", studentId.toString());
				fd.append("category", "finance");
				fd.append("panel", "finance");
				fd.append("documentKey", `talangan_${activeTalanganStage}_inst`);

				const upRes = await fetchApi("/files/upload", {
					method: "POST",
					body: fd,
				});

				if (!upRes.ok) {
					const upErr = await upRes.json().catch(() => ({}));
					throw new Error(
						upErr.message || "Gagal mengunggah berkas bukti bayar",
					);
				}
				const upData = await upRes.json();
				if (upData?.data?.id) {
					buktiBayarUrl = `/files/${upData.data.id}/download`;
				}
			}

			if (activeTalanganInstallment && activeTalanganInstallment.id > 0) {
				const res = await fetchApi(
					`/students/${studentId}/finance/talangan-installments/${activeTalanganInstallment.id}`,
					{
						method: "PATCH",
						body: JSON.stringify({
							nominalPaid: nominal,
							paymentDate:
								talanganInstallmentForm.paymentDate ||
								new Date().toISOString().split("T")[0],
							notes: talanganInstallmentForm.notes || null,
							buktiBayarUrl: buktiBayarUrl || null,
						}),
					},
				);
				if (!res.ok) {
					const err = await res.json().catch(() => ({}));
					throw new Error(
						err.message || "Gagal memperbarui pembayaran talangan",
					);
				}
				toast.success("Pembayaran talangan berhasil diperbarui!");
			} else {
				const res = await fetchApi(
					`/students/${studentId}/finance/talangan-installments`,
					{
						method: "POST",
						body: JSON.stringify({
							stage: activeTalanganStage,
							nominalPaid: nominal,
							paymentDate:
								talanganInstallmentForm.paymentDate ||
								new Date().toISOString().split("T")[0],
							notes: talanganInstallmentForm.notes || null,
							buktiBayarUrl: buktiBayarUrl || null,
						}),
					},
				);
				if (!res.ok) {
					const err = await res.json().catch(() => ({}));
					throw new Error(err.message || "Gagal mencatat pembayaran talangan");
				}
				toast.success("Pembayaran talangan berhasil dicatat!");
			}

			setTalanganModalOpen(false);
			await fetchTalanganInstallments();
			onUpdate();
			queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
			queryClient.invalidateQueries({ queryKey: ["students-list"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
		} catch (e: any) {
			toast.error(
				e.message || "Terjadi kesalahan saat menyimpan pembayaran talangan",
			);
		} finally {
			setInstallmentLoading(false);
		}
	};

	const handleDeleteTalanganInstallment = (id: number) => {
		if (!canEdit) return;
		setTalanganToDelete(id);
	};

	const confirmDeleteTalanganInstallment = async () => {
		if (!talanganToDelete || !canEdit) return;
		setIsDeletingInstallment(true);
		const id = talanganToDelete;
		try {
			const res = await fetchApi(
				`/students/${studentId}/finance/talangan-installments/${id}`,
				{ method: "DELETE" },
			);
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.message || "Gagal menghapus pembayaran talangan");
			}
			toast.success("Pembayaran talangan berhasil dihapus!");
			await fetchTalanganInstallments();
			onUpdate();
			queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
			queryClient.invalidateQueries({ queryKey: ["students-list"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
		} catch (e: any) {
			toast.error(e.message || "Gagal menghapus pembayaran talangan");
		} finally {
			setIsDeletingInstallment(false);
			setTalanganToDelete(null);
		}
	};

	// Partition Modal Handlers
	const openPartitionModal = () => {
		const tb = finState?.totalBiayaPendidikan || 0;
		setPartitionTotalBiaya(tb);

		if (tb === 0) {
			setPartitionRegistrasi(0);
			setPartitionSemesterTotal(0);
			setPartitionSemesterPerSem(0);
			setPartitionInterview(0);
			setPartitionKeberangkatan(0);
			setPartitionModalOpen(true);
			return;
		}

		let reg = Number(formData?.registrasiNominal) || 0;
		if (reg === 0 && pmbDp > 0) {
			reg = pmbDp;
		}
		setPartitionRegistrasi(reg);

		const semTotal =
			semesters.length > 0
				? semesters.find((s: any) => s.semesterNumber === 1)?.totalBilled ||
					semesters.reduce((sum, s) => sum + (s.totalBilled || 0), 0)
				: Number(formData?.mandiriSemesterNominal) ||
					Number(formData?.t1SemesterNominalTotal) ||
					0;
		setPartitionSemesterTotal(semTotal);
		setPartitionSemesterPerSem(semTotal);

		const intv =
			formData?.metodePembayaran === "dana_talangan"
				? Number(formData?.t1InterviewNominal) || 0
				: Number(formData?.mandiriInterviewNominal) || 0;
		setPartitionInterview(intv);

		const keb =
			formData?.metodePembayaran === "dana_talangan"
				? Number(formData?.t2KeberangkatanNominal) || 0
				: Number(formData?.mandiriKeberangkatanNominal) || 0;
		setPartitionKeberangkatan(keb);

		setPartitionModalOpen(true);
	};

	const handleSavePartition = async () => {
		if (!partitionTotalBiaya || partitionTotalBiaya <= 0) {
			toast.error(
				"Total Biaya Pendidikan belum ditentukan oleh PMB (Rp 0). Pembagian partisi belum dapat disimpan.",
			);
			return;
		}

		const totalAllocated =
			Number(partitionRegistrasi || 0) +
			Number(partitionSemesterTotal || 0) +
			Number(partitionInterview || 0) +
			Number(partitionKeberangkatan || 0);

		if (totalAllocated > partitionTotalBiaya) {
			toast.error(
				`Total pembagian termin (${formatRupiah(totalAllocated)}) melebihi Total Biaya Pendidikan (${formatRupiah(partitionTotalBiaya)}). Kelebihan: ${formatRupiah(totalAllocated - partitionTotalBiaya)}.`,
				{ duration: 5000 },
			);
			return;
		}

		if (totalAllocated !== partitionTotalBiaya) {
			toast.error(
				`Total pembagian termin belum pas 100% (${formatRupiah(totalAllocated)} dari ${formatRupiah(partitionTotalBiaya)}). Selisih: ${formatRupiah(Math.abs(partitionTotalBiaya - totalAllocated))}.`,
				{ duration: 5000 },
			);
			return;
		}

		setPartitionSaving(true);
		try {
			const resFin = await fetchApi(`/students/${studentId}/finance`, {
				method: "PATCH",
				body: JSON.stringify({
					registrasiNominal: partitionRegistrasi,
					mandiriSemesterNominal: partitionSemesterTotal,
					mandiriInterviewNominal: partitionInterview,
					t1InterviewNominal: partitionInterview,
					mandiriKeberangkatanNominal: partitionKeberangkatan,
					t2KeberangkatanNominal: partitionKeberangkatan,
				}),
			});

			if (!resFin.ok) {
				const err = await resFin.json();
				throw new Error(err.message || "Gagal memperbarui partisi keuangan");
			}

			if (semesters.length > 0) {
				await Promise.all(
					semesters.map((s) =>
						fetchApi(
							`/students/${studentId}/finance/semesters/${s.id.toString()}`,
							{
								method: "PATCH",
								body: JSON.stringify({
									totalBilled:
										s.semesterNumber === 1 ? partitionSemesterTotal : 0,
								}),
							},
						),
					),
				);
			}

			toast.success(
				"Partisi & Pembagian Biaya Pendidikan berhasil disimpan dan disinkronkan!",
			);
			setPartitionModalOpen(false);
			fetchSemesters();
			onUpdate();
			queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
			queryClient.invalidateQueries({ queryKey: ["students-list"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
		} catch (e: any) {
			toast.error(e.message || "Terjadi kesalahan saat menyimpan partisi");
		} finally {
			setPartitionSaving(false);
		}
	};

	const handleFieldChange = (field: string, value: any) => {
		setFormData((prev: any) => ({ ...prev, [field]: value }));
	};

	const handleCustomFieldChange = (index: number, field: string, val: any) => {
		setCustomData((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [field]: val };
			return next;
		});
	};

	const handleToggleStatus = async (fieldKey: string, nextStatus: boolean) => {
		if (!canEdit) return;
		const previousVal = formData?.[fieldKey];
		const dateKey = `${fieldKey.replace("Status", "")}PaidDate`;
		const previousPaidDate = formData?.[dateKey];

		try {
			const updatePayload: Record<string, any> = { [fieldKey]: nextStatus };
			if (nextStatus && !formData?.[dateKey]) {
				updatePayload[dateKey] = new Date().toISOString();
			}

			// Optimistic UI state update (seamless, no page reload)
			setFormData((prev: any) => ({ ...prev, ...updatePayload }));

			const res = await fetchApi(`/students/${studentId}/finance`, {
				method: "PATCH",
				body: JSON.stringify(updatePayload),
			});

			if (res.ok) {
				toast.success(
					`Status ${nextStatus ? "Lunas" : "Belum Lunas"} berhasil diperbarui`,
				);
				queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
				queryClient.invalidateQueries({ queryKey: ["students-list"] });
				queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
			} else {
				// Revert on error
				setFormData((prev: any) => ({
					...prev,
					[fieldKey]: previousVal,
					...(previousPaidDate !== undefined
						? { [dateKey]: previousPaidDate }
						: {}),
				}));
				const err = await res.json();
				toast.error(err.message || "Gagal memperbarui status");
			}
		} catch (e: any) {
			setFormData((prev: any) => ({
				...prev,
				[fieldKey]: previousVal,
			}));
			toast.error(e.message || "Terjadi kesalahan sistem");
		}
	};

	const handleToggleCustomStatus = async (
		fieldId: number,
		nextStatus: "lunas" | "belum_lunas",
	) => {
		if (!canEdit) return;
		const previousCustom = [...customData];
		try {
			setCustomData((prev) =>
				prev.map((cf) =>
					cf.id === fieldId ? { ...cf, status: nextStatus } : cf,
				),
			);
			const res = await fetchApi(
				`/finance/student/${studentId}/custom-field/${fieldId}`,
				{
					method: "PATCH",
					body: JSON.stringify({ status: nextStatus }),
				},
			);
			if (res.ok) {
				toast.success(
					`Status pos biaya berhasil ditandai ${nextStatus === "lunas" ? "Lunas" : "Belum Lunas"}`,
				);
			} else {
				setCustomData(previousCustom);
				toast.error("Gagal memperbarui status pos biaya");
			}
		} catch (e: any) {
			setCustomData(previousCustom);
			toast.error("Terjadi kesalahan saat memperbarui status");
		}
	};

	const triggerSave = (section: "utama" | "tambahan") => {
		setSectionToSave(section);
		setSaveConfirmOpen(true);
	};

	const executeSaveUtama = async () => {
		setSaveConfirmOpen(false);
		setLoadingUtama(true);
		try {
			// 1. Process Deleted Semester Installments
			for (const item of deletedInstallments) {
				if (item.installmentId > 0) {
					await fetchApi(
						`/students/${studentId}/finance/semesters/${item.semesterId.toString()}/installments/${item.installmentId.toString()}`,
						{ method: "DELETE" },
					);
				}
			}

			// 4. Process Staged Semester Updates & Installments
			for (const sem of semesters) {
				await fetchApi(
					`/students/${studentId}/finance/semesters/${sem.id.toString()}`,
					{
						method: "PATCH",
						body: JSON.stringify({
							totalBilled: sem.totalBilled,
							isTalangan: sem.isTalangan,
							notes: sem.notes,
						}),
					},
				);

				for (const inst of sem.installments || []) {
					let buktiBayarUrl = inst.buktiBayarUrl || "";
					if (inst.file) {
						const fd = new FormData();
						fd.append("file", inst.file);
						fd.append("studentId", studentId.toString());
						fd.append("category", "finance");
						fd.append("panel", "finance");
						fd.append("documentKey", `semester_${sem.semesterNumber}_inst`);
						const upRes = await fetchApi("/files/upload", {
							method: "POST",
							body: fd,
						});
						if (upRes.ok) {
							const upData = await upRes.json();
							if (upData?.data?.id) {
								buktiBayarUrl = `/files/${upData.data.id}/download`;
							}
						}
					}

					if (inst.isDraftNew) {
						await fetchApi(
							`/students/${studentId}/finance/semesters/${sem.id.toString()}/installments`,
							{
								method: "POST",
								body: JSON.stringify({
									nominalScheduled:
										inst.nominalScheduled !== undefined &&
										inst.nominalScheduled !== null
											? Number(inst.nominalScheduled)
											: Number(inst.nominalPaid) || 0,
									dueDate: inst.dueDate || null,
									status:
										inst.status ||
										(Number(inst.nominalPaid) > 0 ? "LUNAS" : "BELUM_BAYAR"),
									nominalPaid: Number(inst.nominalPaid) || 0,
									paymentDate: inst.paymentDate || null,
									notes: inst.notes || null,
									isTalangan: inst.isTalangan ?? false,
									installmentMonth: inst.installmentMonth,
									periodNotes: inst.periodNotes,
									buktiBayarUrl,
								}),
							},
						);
					} else if (inst.isDraftEdited && inst.id > 0) {
						await fetchApi(
							`/students/${studentId}/finance/semesters/${sem.id.toString()}/installments/${inst.id.toString()}`,
							{
								method: "PATCH",
								body: JSON.stringify({
									nominalScheduled:
										inst.nominalScheduled !== undefined &&
										inst.nominalScheduled !== null
											? Number(inst.nominalScheduled)
											: Number(inst.nominalPaid) || 0,
									dueDate: inst.dueDate || null,
									status:
										inst.status ||
										(Number(inst.nominalPaid) > 0 ? "LUNAS" : "BELUM_BAYAR"),
									nominalPaid: Number(inst.nominalPaid) || 0,
									paymentDate: inst.paymentDate || null,
									notes: inst.notes || null,
									isTalangan: inst.isTalangan,
									installmentMonth: inst.installmentMonth,
									periodNotes: inst.periodNotes,
									buktiBayarUrl,
								}),
							},
						);
					}
				}
			}

			// 5. Process Deleted Talangan Installments
			for (const id of deletedTalanganInstallmentIds) {
				if (id > 0) {
					await fetchApi(
						`/students/${studentId}/finance/talangan-installments/${id.toString()}`,
						{ method: "DELETE" },
					);
				}
			}

			// 6. Process Staged Talangan Installments
			for (const inst of talanganInstallments) {
				let buktiBayarUrl = inst.buktiBayarUrl || "";
				if (inst.file) {
					const fd = new FormData();
					fd.append("file", inst.file);
					fd.append("studentId", studentId.toString());
					fd.append("category", "finance");
					fd.append("panel", "finance");
					fd.append("documentKey", `talangan_${inst.stage}_inst`);
					const upRes = await fetchApi("/files/upload", {
						method: "POST",
						body: fd,
					});
					if (upRes.ok) {
						const upData = await upRes.json();
						if (upData?.data?.id) {
							buktiBayarUrl = `/files/${upData.data.id}/download`;
						}
					}
				}

				if (inst.isDraftNew) {
					await fetchApi(
						`/students/${studentId}/finance/talangan-installments`,
						{
							method: "POST",
							body: JSON.stringify({
								stage: inst.stage,
								nominalPaid: inst.nominalPaid,
								paymentDate: inst.paymentDate,
								notes: inst.notes,
								buktiBayarUrl,
							}),
						},
					);
				} else if (inst.isDraftEdited && inst.id > 0) {
					await fetchApi(
						`/students/${studentId}/finance/talangan-installments/${inst.id.toString()}`,
						{
							method: "PATCH",
							body: JSON.stringify({
								nominalPaid: inst.nominalPaid,
								paymentDate: inst.paymentDate,
								notes: inst.notes,
								buktiBayarUrl,
							}),
						},
					);
				}
			}

			// 7. Save Main Finance Data
			const cleanData = { ...formData };
			delete cleanData.id;
			delete cleanData.studentId;
			delete cleanData.createdAt;
			delete cleanData.updatedAt;
			delete cleanData.isAcc;
			delete cleanData.accAt;
			delete cleanData.accBy;

			cleanData.registrasiStatus = Boolean(
				formData?.registrasiStatus || isRegistrasiLunas,
			);
			if (cleanData.registrasiStatus && !cleanData.registrasiPaidDate) {
				cleanData.registrasiPaidDate = new Date().toISOString();
			}

			const res = await fetchApi(`/students/${studentId}/finance`, {
				method: "PATCH",
				body: JSON.stringify(cleanData),
			});

			if (res.ok) {
				toast.success("Data Pembayaran Utama berhasil disimpan!");
				setIsEditingUtama(false);
				setStagedDocsUtama({});
				setDeletedDocKeysUtama([]);
				setDeletedInstallments([]);
				setDeletedTalanganInstallmentIds([]);
				fetchSemesters();
				fetchFinanceDocs();
				fetchTalanganInstallments();
				onUpdate();
				queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
				queryClient.invalidateQueries({ queryKey: ["students-list"] });
				queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
			} else {
				const err = await res.json();
				toast.error(err.message || "Gagal menyimpan pembayaran utama");
			}
		} catch (e: any) {
			toast.error(e.message || "Terjadi kesalahan saat menyimpan");
		} finally {
			setLoadingUtama(false);
		}
	};

	const executeSaveTambahan = async () => {
		setSaveConfirmOpen(false);
		setLoadingTambahan(true);
		try {
			// 1. Save standard fields
			const cleanData = {
				toeicNominal: formData.toeicNominal,
				pasporNominal: formData.pasporNominal,
				rumahJuangAktif: formData.rumahJuangAktif,
				rumahJuangNominal: formData.rumahJuangNominal,
			};

			const res = await fetchApi(`/students/${studentId}/finance`, {
				method: "PATCH",
				body: JSON.stringify(cleanData),
			});

			// 4. Save custom fields
			for (const cf of customData) {
				if (cf.id) {
					await fetchApi(
						`/finance/student/${studentId}/custom-field/${cf.id.toString()}`,
						{
							method: "PATCH",
							body: JSON.stringify({
								nominal: cf.nominal,
								status: cf.status,
								notes: cf.notes,
							}),
						},
					);
				}
			}

			if (res.ok) {
				toast.success("Biaya Tambahan berhasil disimpan!");
				setIsEditingTambahan(false);
				setStagedDocsTambahan({});
				setDeletedDocKeysTambahan([]);
				fetchFinanceDocs();
				onUpdate();
				queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
				queryClient.invalidateQueries({ queryKey: ["students-list"] });
			} else {
				toast.error("Gagal menyimpan biaya tambahan");
			}
		} catch (e: any) {
			toast.error(e.message || "Terjadi kesalahan");
		} finally {
			setLoadingTambahan(false);
		}
	};

	const handleCancelEdit = (section: "utama" | "tambahan") => {
		if (section === "utama") {
			setIsEditingUtama(false);
			setFormData(finState || {});
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

	// Partisi Calculations
	const totalBiaya = finState?.totalBiayaPendidikan || 0;
	const curRegistrasi = Number(formData?.registrasiNominal) || 0;
	const curSemestersTotal =
		semesters.length > 0
			? semesters.find((s: any) => s.semesterNumber === 1)?.totalBilled ||
				semesters.reduce((sum: number, s: any) => sum + (s.totalBilled || 0), 0)
			: Number(formData?.mandiriSemesterNominal) ||
				Number(formData?.t1SemesterNominalTotal) ||
				0;
	const curSemesterPerSem = curSemestersTotal;
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
		!!stagedDocsUtama.registrasi ||
		(((financeDocs.registrasi?.length ?? 0) > 0 ||
			!!formData?.registrasiStatus) &&
			!deletedDocKeysUtama.includes("registrasi"));

	const hasMandiriInterviewDoc =
		!!stagedDocsUtama.mandiri_interview ||
		!!stagedDocsUtama.t1_interview ||
		(((financeDocs.mandiri_interview?.length ?? 0) > 0 ||
			(financeDocs.t1_interview?.length ?? 0) > 0 ||
			!!formData?.mandiriInterviewStatus) &&
			!deletedDocKeysUtama.includes("mandiri_interview") &&
			!deletedDocKeysUtama.includes("t1_interview"));

	const hasMandiriKeberangkatanDoc =
		!!stagedDocsUtama.mandiri_keberangkatan ||
		!!stagedDocsUtama.t2_keberangkatan ||
		(((financeDocs.mandiri_keberangkatan?.length ?? 0) > 0 ||
			(financeDocs.t2_keberangkatan?.length ?? 0) > 0 ||
			!!formData?.mandiriKeberangkatanStatus) &&
			!deletedDocKeysUtama.includes("mandiri_keberangkatan") &&
			!deletedDocKeysUtama.includes("t2_keberangkatan"));

	const hasT1InterviewDoc =
		!!stagedDocsUtama.t1_interview ||
		!!stagedDocsUtama.mandiri_interview ||
		(((financeDocs.t1_interview?.length ?? 0) > 0 ||
			(financeDocs.mandiri_interview?.length ?? 0) > 0 ||
			!!formData?.t1InterviewStatus) &&
			!deletedDocKeysUtama.includes("t1_interview") &&
			!deletedDocKeysUtama.includes("mandiri_interview"));

	const hasT2KeberangkatanDoc =
		!!stagedDocsUtama.t2_keberangkatan ||
		!!stagedDocsUtama.mandiri_keberangkatan ||
		(((financeDocs.t2_keberangkatan?.length ?? 0) > 0 ||
			(financeDocs.mandiri_keberangkatan?.length ?? 0) > 0 ||
			!!formData?.t2KeberangkatanStatus) &&
			!deletedDocKeysUtama.includes("t2_keberangkatan") &&
			!deletedDocKeysUtama.includes("mandiri_keberangkatan"));

	const hasAdminTalanganDoc =
		!!stagedDocsUtama.admin_talangan ||
		(((financeDocs.admin_talangan?.length ?? 0) > 0 ||
			!!formData?.adminTalaganStatus) &&
			!deletedDocKeysUtama.includes("admin_talangan"));

	const hasToeicDoc =
		!!stagedDocsTambahan.toeic ||
		(((financeDocs.toeic?.length ?? 0) > 0 || !!formData?.toeicStatus) &&
			!deletedDocKeysTambahan.includes("toeic"));

	const hasPasporDoc =
		!!stagedDocsTambahan.paspor ||
		(((financeDocs.paspor?.length ?? 0) > 0 || !!formData?.pasporStatus) &&
			!deletedDocKeysTambahan.includes("paspor"));

	const hasRumahJuangDoc =
		!!stagedDocsTambahan.rumah_juang ||
		(((financeDocs.rumah_juang?.length ?? 0) > 0 ||
			!!formData?.rumahJuangStatus) &&
			!deletedDocKeysTambahan.includes("rumah_juang"));

	const isRegistrasiLunas = hasRegistrasiDoc;
	const sem1 = semesters.find((s: any) => s.semesterNumber === 1);
	const sem1Paid = (sem1?.installments || []).reduce(
		(sum: number, i: any) => sum + (i.nominalPaid || 0),
		0,
	);
	const isSemesterAllLunas = sem1
		? (sem1Paid >= (sem1.totalBilled || 0) && (sem1.totalBilled || 0) > 0) ||
			!!sem1.isTalangan
		: false;

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
	const isTalanganSatuTahap = formData?.talanganTipe === "1_tahap";
	const totalTahap1Nominal = isTalanganSatuTahap
		? 0
		: t1SemesterNominal + t1InterviewNominal;
	const totalTahap2Nominal =
		isTalanganSatuTahap && Number(formData?.talanganTotalPengajuan) > 0
			? Number(formData.talanganTotalPengajuan)
			: Number(formData?.t2KeberangkatanNominal) || curKeberangkatan || 0;

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
			? isTalanganSatuTahap
				? true
				: (totalTahap1Nominal > 0 && t1Paid >= totalTahap1Nominal) ||
					hasT1InterviewDoc
			: hasMandiriInterviewDoc;

	const isTahap2Lunas =
		formData?.metodePembayaran === "dana_talangan"
			? (totalTahap2Nominal > 0 && t2Paid >= totalTahap2Nominal) ||
				hasT2KeberangkatanDoc
			: hasMandiriKeberangkatanDoc;

	const isInterviewLunas = isTahap1Lunas;
	const isKeberangkatanLunas = isTahap2Lunas;

	return (
		<div className="space-y-5">
			{/* 1. Partisi Biaya Card */}
			<PartisiBiayaCard
				totalBiaya={totalBiaya}
				formData={formData}
				sisaAlokasi={sisaAlokasi}
				isMatched={isMatched}
				canEdit={canEdit}
				openPartitionModal={openPartitionModal}
				regPct={regPct}
				semPct={semPct}
				intPct={intPct}
				kebPct={kebPct}
				curRegistrasi={curRegistrasi}
				curSemestersTotal={curSemestersTotal}
				curInterview={curInterview}
				curKeberangkatan={curKeberangkatan}
				isRegistrasiLunas={isRegistrasiLunas}
				semestersLunasCount={semestersLunasCount}
				isInterviewLunas={isInterviewLunas}
				isKeberangkatanLunas={isKeberangkatanLunas}
				hasAdminTalanganDoc={hasAdminTalanganDoc}
				adminTalaganNominal={Number(formData?.adminTalaganNominal) || 0}
				totalTahap1Nominal={totalTahap1Nominal}
				totalTahap2Nominal={totalTahap2Nominal}
				t1Paid={t1Paid}
				t2Paid={t2Paid}
				isTahap1Lunas={isTahap1Lunas}
				isTahap2Lunas={isTahap2Lunas}
				destinationCountry={destinationCountry}
				pmbDp={pmbDp}
			/>

			{/* 2. Pembayaran Utama Section */}
			<PembayaranUtamaSection
				studentId={studentId}
				canEdit={canEdit}
				isEditingUtama={isEditingUtama}
				setIsEditingUtama={setIsEditingUtama}
				loadingUtama={loadingUtama}
				handleCancelEdit={handleCancelEdit}
				triggerSave={triggerSave}
				formData={formData}
				handleFieldChange={handleFieldChange}
				isRegistrasiLunas={isRegistrasiLunas}
				regPct={regPct}
				financeDocs={financeDocs}
				isSemesterAllLunas={isSemesterAllLunas}
				semPct={semPct}
				curSemestersTotal={curSemestersTotal}
				curSemesterPerSem={curSemesterPerSem}
				semesters={semesters}
				semestersLunasCount={semestersLunasCount}
				loadingSemesters={loadingSemesters}
				expandedSemesters={expandedSemesters}
				toggleSemesterExpand={toggleSemesterExpand}
				handleToggleTalangan={handleToggleTalangan}
				openInstallmentModal={openScheduleModal}
				openScheduleModal={openScheduleModal}
				openPaymentModal={openPaymentModal}
				handleDeleteInstallment={handleDeleteInstallment}
				isInterviewLunas={isInterviewLunas}
				isKeberangkatanLunas={isKeberangkatanLunas}
				intPct={intPct}
				kebPct={kebPct}
				destinationCountry={destinationCountry}
				handleToggleStatus={handleToggleStatus}
				onUpdate={() => {
					fetchFinanceDocs();
					onUpdate();
				}}
			/>

			{/* 3. Dana Talangan Section */}
			<DanaTalanganSection
				studentId={studentId}
				formData={formData}
				canEdit={canEdit}
				isEditingUtama={isEditingUtama}
				handleFieldChange={handleFieldChange}
				intPct={intPct}
				kebPct={kebPct}
				talanganSemCount={talanganSemCount}
				talanganSemListText={talanganSemListText}
				t1SemesterNominal={t1SemesterNominal}
				t1InterviewNominal={t1InterviewNominal}
				totalTahap1Nominal={totalTahap1Nominal}
				totalTahap2Nominal={totalTahap2Nominal}
				t1Paid={t1Paid}
				t2Paid={t2Paid}
				isTahap1Lunas={isTahap1Lunas}
				isTahap2Lunas={isTahap2Lunas}
				t1Installments={t1Installments}
				t2Installments={t2Installments}
				openTalanganModal={openTalanganModal}
				handleDeleteTalanganInstallment={handleDeleteTalanganInstallment}
				hasAdminTalanganDoc={hasAdminTalanganDoc}
				preventMinus={preventMinus}
				handleToggleStatus={handleToggleStatus}
				onUpdate={() => {
					fetchFinanceDocs();
					onUpdate();
				}}
			/>

			{/* 4. Biaya Tambahan Section */}
			<BiayaTambahanSection
				studentId={studentId}
				canEdit={canEdit}
				isEditingTambahan={isEditingTambahan}
				setIsEditingTambahan={setIsEditingTambahan}
				loadingTambahan={loadingTambahan}
				handleCancelEdit={handleCancelEdit}
				triggerSave={triggerSave}
				formData={formData}
				handleFieldChange={handleFieldChange}
				hasToeicDoc={hasToeicDoc}
				hasPasporDoc={hasPasporDoc}
				hasRumahJuangDoc={hasRumahJuangDoc}
				financeDocs={financeDocs}
				customData={customData}
				handleCustomFieldChange={handleCustomFieldChange}
				triggerAddCustomField={triggerAddCustomField}
				triggerDeleteCustomField={triggerDeleteCustomField}
				preventMinus={preventMinus}
				handleToggleStatus={handleToggleStatus}
				handleToggleCustomStatus={handleToggleCustomStatus}
				onUpdate={() => {
					fetchFinanceDocs();
					onUpdate();
				}}
			/>

			{/* Modal Atur Pembagian Biaya Pendidikan */}
			<PartitionModal
				open={partitionModalOpen}
				onOpenChange={setPartitionModalOpen}
				saving={partitionSaving}
				totalBiaya={partitionTotalBiaya}
				pmbDp={pmbDp}
				registrasi={partitionRegistrasi}
				setRegistrasi={setPartitionRegistrasi}
				semesterPerSem={partitionSemesterPerSem}
				setSemesterPerSem={setPartitionSemesterPerSem}
				semesterTotal={partitionSemesterTotal}
				setSemesterTotal={setPartitionSemesterTotal}
				interview={partitionInterview}
				setInterview={setPartitionInterview}
				keberangkatan={partitionKeberangkatan}
				setKeberangkatan={setPartitionKeberangkatan}
				onSave={handleSavePartition}
				preventMinus={preventMinus}
			/>

			{/* Modal Jadwalkan Cicilan Semester 1 */}
			<InstallmentModal
				open={installmentModalOpen}
				onOpenChange={setInstallmentModalOpen}
				activeSemester={activeSemester}
				activeInstallment={activeInstallment}
				scheduleForm={scheduleForm}
				setScheduleForm={setScheduleForm}
				saving={installmentLoading}
				onSave={saveScheduleModal}
				preventMinus={preventMinus}
				totalBilled={activeSemester?.totalBilled || 0}
				totalScheduled={(activeSemester?.installments || []).reduce(
					(sum: number, i: any) =>
						sum +
						(Number(
							i.nominalScheduled !== undefined && i.nominalScheduled !== null
								? i.nominalScheduled
								: i.nominalPaid,
						) || 0),
					0,
				)}
				remainingUnscheduled={Math.max(
					0,
					(activeSemester?.totalBilled || 0) -
						(activeSemester?.installments || [])
							.filter((i: any) => i.id !== activeInstallment?.id)
							.reduce(
								(sum: number, i: any) =>
									sum +
									(Number(
										i.nominalScheduled !== undefined &&
											i.nominalScheduled !== null
											? i.nominalScheduled
											: i.nominalPaid,
									) || 0),
								0,
							),
				)}
			/>

			{/* Modal Konfirmasi Pembayaran Cicilan */}
			<PaymentConfirmationModal
				studentId={studentId}
				open={paymentConfirmModalOpen}
				onOpenChange={setPaymentConfirmModalOpen}
				activeSemester={paymentActiveSemester}
				activeInstallment={paymentActiveInstallment}
				paymentForm={paymentForm}
				setPaymentForm={setPaymentForm}
				saving={installmentLoading}
				onSave={savePaymentModal}
				onCancelPayment={cancelPaymentModal}
				preventMinus={preventMinus}
			/>

			{/* Modal Tambah/Edit Cicilan Talangan */}
			<TalanganInstallmentModal
				studentId={studentId}
				open={talanganModalOpen}
				onOpenChange={setTalanganModalOpen}
				activeStage={activeTalanganStage}
				activeInstallment={activeTalanganInstallment}
				form={talanganInstallmentForm}
				setForm={setTalanganInstallmentForm}
				saving={installmentLoading}
				onSave={saveTalanganModal}
				preventMinus={preventMinus}
			/>

			{/* Modal Tambah Custom Field */}
			<CustomFieldModal
				open={addPromptOpen}
				onOpenChange={setAddPromptOpen}
				fieldType={addPromptType}
				fieldLabel={newFieldLabel}
				setFieldLabel={setNewFieldLabel}
				isAdding={isAddingField}
				onConfirm={confirmAddCustomField}
			/>

			{/* Alert Dialog Konfirmasi Simpan */}
			<AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Konfirmasi Simpan Perubahan</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menyimpan seluruh perubahan data dan
							berkas pada bagian{" "}
							<strong>
								{sectionToSave === "utama"
									? "Pembayaran Utama"
									: "Biaya Tambahan"}
							</strong>
							?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={loadingUtama || loadingTambahan}>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setSaveConfirmOpen(false);
								if (sectionToSave === "utama") {
									executeSaveUtama();
								} else if (sectionToSave === "tambahan") {
									executeSaveTambahan();
								}
							}}
							disabled={loadingUtama || loadingTambahan}
							className="bg-emerald-600 hover:bg-emerald-700 text-white"
						>
							Ya, Simpan Perubahan
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Alert Dialog Konfirmasi Hapus Custom Field */}
			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Pos Biaya Tambahan</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus pos biaya tambahan ini secara
							permanen? Data yang telah dihapus tidak dapat dipulihkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeletingField}>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDeleteCustomField}
							disabled={isDeletingField}
							className="bg-rose-600 hover:bg-rose-700 text-white"
						>
							Hapus Permanen
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			{/* Alert Dialog Konfirmasi Hapus Jadwal Cicilan Utama */}
			<AlertDialog
				open={installmentToDelete !== null}
				onOpenChange={(open) => !open && setInstallmentToDelete(null)}
			>
				<AlertDialogContent className="bg-white rounded-2xl max-w-md border-slate-200 shadow-xl">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base font-bold text-slate-900">
							Hapus Jadwal Cicilan?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
							Apakah Anda yakin ingin menghapus data jadwal pembayaran cicilan
							ini? Total tagihan dan kalkulasi sisa pembayaran akan diperbarui
							otomatis.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex gap-2 sm:justify-end mt-3">
						<AlertDialogCancel
							disabled={isDeletingInstallment}
							className="text-xs h-9 rounded-lg"
						>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDeleteInstallment}
							disabled={isDeletingInstallment}
							className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 rounded-lg font-bold shadow-xs"
						>
							{isDeletingInstallment ? "Menghapus..." : "Ya, Hapus Cicilan"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Alert Dialog Konfirmasi Hapus Pembayaran Dana Talangan */}
			<AlertDialog
				open={talanganToDelete !== null}
				onOpenChange={(open) => !open && setTalanganToDelete(null)}
			>
				<AlertDialogContent className="bg-white rounded-2xl max-w-md border-slate-200 shadow-xl">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base font-bold text-slate-900">
							Hapus Pembayaran Talangan?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
							Apakah Anda yakin ingin menghapus data pembayaran talangan ini?
							Data yang dihapus akan mengembalikan sisa kewajiban pinjaman
							talangan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex gap-2 sm:justify-end mt-3">
						<AlertDialogCancel
							disabled={isDeletingInstallment}
							className="text-xs h-9 rounded-lg"
						>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDeleteTalanganInstallment}
							disabled={isDeletingInstallment}
							className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 rounded-lg font-bold shadow-xs"
						>
							{isDeletingInstallment ? "Menghapus..." : "Ya, Hapus Pembayaran"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
