"use client";

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
import { BiayaTambahanSection } from "./BiayaTambahanSection";
import { CustomFieldModal } from "./CustomFieldModal";
import { DanaTalanganSection } from "./DanaTalanganSection";
import { InstallmentModal } from "./InstallmentModal";
import { PartisiBiayaCard } from "./PartisiBiayaCard";
import { PartitionModal } from "./PartitionModal";
import { PembayaranUtamaSection } from "./PembayaranUtamaSection";
import { TalanganInstallmentModal } from "./TalanganInstallmentModal";

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

	const openInstallmentModal = (semester: any, installment?: any) => {
		if (!canEdit || !isEditingUtama) {
			toast.error(
				"Silakan klik 'Edit Data' pada Pembayaran Utama terlebih dahulu untuk menambah atau mengedit cicilan.",
			);
			return;
		}
		setActiveSemester(semester);
		setActiveInstallment(installment || null);
		if (installment) {
			setInstallmentForm({
				nominalPaid: installment.nominalPaid.toString(),
				paymentDate: installment.paymentDate
					? installment.paymentDate.split("T")[0]
					: new Date().toISOString().split("T")[0],
				notes: installment.notes || "",
				isTalangan: installment.isTalangan ?? false,
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

	const saveInstallmentModal = () => {
		const nominal = Number(installmentForm.nominalPaid);
		if (!nominal || nominal <= 0) {
			toast.error("Nominal pembayaran harus lebih dari 0");
			return;
		}

		const semId = activeSemester.id;

		if (activeInstallment) {
			setSemesters((prevSemesters) =>
				prevSemesters.map((s) => {
					if (s.id !== semId) return s;
					const updatedInstallments = (s.installments || []).map(
						(inst: any) => {
							if (inst.id === activeInstallment.id) {
								return {
									...inst,
									nominalPaid: nominal,
									paymentDate: installmentForm.paymentDate,
									notes: installmentForm.notes,
									isTalangan: installmentForm.isTalangan,
									file: installmentForm.file || inst.file,
									buktiBayarUrl:
										installmentForm.buktiBayarUrl || inst.buktiBayarUrl,
									isDraftEdited: true,
								};
							}
							return inst;
						},
					);
					const totalPaid = updatedInstallments.reduce(
						(sum: number, i: any) => sum + i.nominalPaid,
						0,
					);
					const status =
						totalPaid >= (s.totalBilled || 0) && (s.totalBilled || 0) > 0
							? "LUNAS"
							: totalPaid > 0
								? "SEBAGIAN"
								: "BELUM_BAYAR";
					return {
						...s,
						installments: updatedInstallments,
						status: s.isTalangan ? "LUNAS" : status,
					};
				}),
			);
			toast.info(
				"Perubahan pembayaran masuk ke draft. Klik 'Simpan' pada Pembayaran Utama untuk menyimpan permanen.",
			);
		} else {
			const tempId = -Date.now();
			const newInst = {
				id: tempId,
				semesterId: semId,
				installmentNumber: (activeSemester.installments || []).length + 1,
				nominalPaid: nominal,
				paymentDate: installmentForm.paymentDate,
				notes: installmentForm.notes,
				isTalangan: installmentForm.isTalangan,
				file: installmentForm.file,
				buktiBayarUrl: installmentForm.buktiBayarUrl || "",
				isDraftNew: true,
			};

			setSemesters((prevSemesters) =>
				prevSemesters.map((s) => {
					if (s.id !== semId) return s;
					const updatedInstallments = [...(s.installments || []), newInst];
					const totalPaid = updatedInstallments.reduce(
						(sum: number, i: any) => sum + i.nominalPaid,
						0,
					);
					const status =
						totalPaid >= (s.totalBilled || 0) && (s.totalBilled || 0) > 0
							? "LUNAS"
							: totalPaid > 0
								? "SEBAGIAN"
								: "BELUM_BAYAR";
					return {
						...s,
						installments: updatedInstallments,
						status: s.isTalangan ? "LUNAS" : status,
					};
				}),
			);
			toast.info(
				"Pembayaran baru masuk ke draft. Klik 'Simpan' pada Pembayaran Utama untuk menyimpan permanen.",
			);
		}

		setInstallmentModalOpen(false);
	};

	const handleDeleteInstallment = (
		semesterId: number,
		installmentId: number,
	) => {
		if (!canEdit || !isEditingUtama) return;

		setDeletedInstallments((prev) => [...prev, { semesterId, installmentId }]);

		setSemesters((prevSemesters) =>
			prevSemesters.map((s) => {
				if (s.id !== semesterId) return s;
				const filtered = (s.installments || []).filter(
					(i: any) => i.id !== installmentId,
				);
				const reindexed = filtered.map((inst: any, idx: number) => ({
					...inst,
					installmentNumber: idx + 1,
				}));
				const totalPaid = reindexed.reduce(
					(sum: number, i: any) => sum + i.nominalPaid,
					0,
				);
				const status =
					totalPaid >= (s.totalBilled || 0) && (s.totalBilled || 0) > 0
						? "LUNAS"
						: totalPaid > 0
							? "SEBAGIAN"
							: "BELUM_BAYAR";
				return {
					...s,
					installments: reindexed,
					status: s.isTalangan ? "LUNAS" : status,
				};
			}),
		);
		toast.info(
			"Pembayaran ditandai untuk dihapus (Draft). Klik 'Simpan' pada Pembayaran Utama untuk menyimpan permanen.",
		);
	};

	// Talangan Installment Modal Handlers
	const openTalanganModal = (
		stage: "tahap_1" | "tahap_2",
		installment?: any,
	) => {
		if (!canEdit || !isEditingUtama) {
			toast.error(
				"Silakan klik 'Edit Data' pada Pembayaran Utama terlebih dahulu untuk mencatat pembayaran talangan.",
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

	const saveTalanganModal = () => {
		const nominal = Number(talanganInstallmentForm.nominalPaid);
		if (!nominal || nominal <= 0) {
			toast.error("Nominal pembayaran harus lebih dari 0");
			return;
		}

		if (activeTalanganInstallment) {
			setTalanganInstallments((prev) =>
				prev.map((inst) => {
					if (inst.id === activeTalanganInstallment.id) {
						return {
							...inst,
							nominalPaid: nominal,
							paymentDate: talanganInstallmentForm.paymentDate,
							notes: talanganInstallmentForm.notes,
							file: talanganInstallmentForm.file || inst.file,
							buktiBayarUrl:
								talanganInstallmentForm.buktiBayarUrl || inst.buktiBayarUrl,
							isDraftEdited: true,
						};
					}
					return inst;
				}),
			);
			toast.info(
				"Perubahan pembayaran talangan masuk ke draft. Klik 'Simpan' pada Pembayaran Utama untuk menyimpan permanen.",
			);
		} else {
			const tempId = -Date.now();
			const newInst = {
				id: tempId,
				studentId,
				stage: activeTalanganStage,
				installmentNumber:
					talanganInstallments.filter((i) => i.stage === activeTalanganStage)
						.length + 1,
				nominalPaid: nominal,
				paymentDate: talanganInstallmentForm.paymentDate,
				notes: talanganInstallmentForm.notes,
				file: talanganInstallmentForm.file,
				buktiBayarUrl: talanganInstallmentForm.buktiBayarUrl || "",
				isDraftNew: true,
			};
			setTalanganInstallments((prev) => [...prev, newInst]);
			toast.info(
				"Pembayaran talangan baru masuk ke draft. Klik 'Simpan' pada Pembayaran Utama untuk menyimpan permanen.",
			);
		}

		setTalanganModalOpen(false);
	};

	const handleDeleteTalanganInstallment = (id: number) => {
		if (!canEdit || !isEditingUtama) return;
		setDeletedTalanganInstallmentIds((prev) => [...prev, id]);
		setTalanganInstallments((prev) => prev.filter((i) => i.id !== id));
		toast.info(
			"Pembayaran talangan ditandai untuk dihapus (Draft). Klik 'Simpan' pada Pembayaran Utama untuk menyimpan permanen.",
		);
	};

	// Partition Modal Handlers
	const openPartitionModal = () => {
		const tb = finState?.totalBiayaPendidikan || 0;
		setPartitionTotalBiaya(tb);

		const reg = Number(formData?.registrasiNominal) || 0;
		setPartitionRegistrasi(reg);

		const semTotal =
			semesters.length > 0
				? semesters.reduce((sum, s) => sum + (s.totalBilled || 0), 0)
				: (Number(formData?.mandiriSemesterNominal) || 0) * 6 ||
					Number(formData?.t1SemesterNominalTotal) ||
					0;
		setPartitionSemesterTotal(semTotal);
		setPartitionSemesterPerSem(
			semesters.length > 0
				? semesters[0]?.totalBilled || 0
				: Math.round(semTotal / 6),
		);

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
		setPartitionSaving(true);
		try {
			const resFin = await fetchApi(`/students/${studentId}/finance`, {
				method: "PATCH",
				body: JSON.stringify({
					registrasiNominal: partitionRegistrasi,
					mandiriSemesterNominal: partitionSemesterPerSem,
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
								body: JSON.stringify({ totalBilled: partitionSemesterPerSem }),
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

	const triggerSave = (section: "utama" | "tambahan") => {
		setSectionToSave(section);
		setSaveConfirmOpen(true);
	};

	const executeSaveUtama = async () => {
		setLoadingUtama(true);
		try {
			// 1. Upload Staged Documents
			for (const [docKey, file] of Object.entries(stagedDocsUtama)) {
				if (file) {
					const fd = new FormData();
					fd.append("file", file);
					const uploadRes = await fetchApi(
						`/students/${studentId}/finance/documents/${docKey}`,
						{ method: "POST", body: fd },
					);
					if (!uploadRes.ok) {
						toast.error(`Gagal mengunggah berkas untuk ${docKey}`);
					}
				}
			}

			// 2. Delete Staged Deleted Documents
			for (const docKey of deletedDocKeysUtama) {
				const existing = financeDocs[docKey];
				if (existing && existing.length > 0) {
					for (const doc of existing) {
						await fetchApi(
							`/students/${studentId}/finance/documents/${doc.id.toString()}`,
							{ method: "DELETE" },
						);
					}
				}
			}

			// 3. Process Deleted Semester Installments
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
						const upRes = await fetchApi(
							`/students/${studentId}/finance/documents/semester_${sem.semesterNumber}_inst`,
							{ method: "POST", body: fd },
						);
						if (upRes.ok) {
							const upData = await upRes.json();
							buktiBayarUrl = upData.fileUrl;
						}
					}

					if (inst.isDraftNew) {
						await fetchApi(
							`/students/${studentId}/finance/semesters/${sem.id.toString()}/installments`,
							{
								method: "POST",
								body: JSON.stringify({
									nominalPaid: inst.nominalPaid,
									paymentDate: inst.paymentDate,
									notes: inst.notes,
									isTalangan: inst.isTalangan,
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
									nominalPaid: inst.nominalPaid,
									paymentDate: inst.paymentDate,
									notes: inst.notes,
									isTalangan: inst.isTalangan,
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
					const upRes = await fetchApi(
						`/students/${studentId}/finance/documents/talangan_${inst.stage}_inst`,
						{ method: "POST", body: fd },
					);
					if (upRes.ok) {
						const upData = await upRes.json();
						buktiBayarUrl = upData.fileUrl;
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
		setLoadingTambahan(true);
		try {
			// 1. Upload Staged Documents
			for (const [docKey, file] of Object.entries(stagedDocsTambahan)) {
				if (file) {
					const fd = new FormData();
					fd.append("file", file);
					const uploadRes = await fetchApi(
						`/students/${studentId}/finance/documents/${docKey}`,
						{ method: "POST", body: fd },
					);
					if (!uploadRes.ok) {
						toast.error(`Gagal mengunggah berkas untuk ${docKey}`);
					}
				}
			}

			// 2. Delete Staged Deleted Documents
			for (const docKey of deletedDocKeysTambahan) {
				const existing = financeDocs[docKey];
				if (existing && existing.length > 0) {
					for (const doc of existing) {
						await fetchApi(
							`/students/${studentId}/finance/documents/${doc.id.toString()}`,
							{ method: "DELETE" },
						);
					}
				}
			}

			// 3. Save standard fields
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
			/>

			{/* 2. Pembayaran Utama Section */}
			<PembayaranUtamaSection
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
				stagedDocsUtama={stagedDocsUtama}
				deletedDocKeysUtama={deletedDocKeysUtama}
				handleStageDoc={handleStageDoc}
				handleRemoveStagedDoc={handleRemoveStagedDoc}
				handleDeleteExistingDoc={handleDeleteExistingDoc}
				handleRestoreExistingDoc={handleRestoreExistingDoc}
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
				openInstallmentModal={openInstallmentModal}
				handleDeleteInstallment={handleDeleteInstallment}
				isInterviewLunas={isInterviewLunas}
				isKeberangkatanLunas={isKeberangkatanLunas}
				intPct={intPct}
				kebPct={kebPct}
			/>

			{/* 3. Dana Talangan Section */}
			<DanaTalanganSection
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
				financeDocs={financeDocs}
				stagedDocsUtama={stagedDocsUtama}
				deletedDocKeysUtama={deletedDocKeysUtama}
				handleStageDoc={handleStageDoc}
				handleRemoveStagedDoc={handleRemoveStagedDoc}
				handleDeleteExistingDoc={handleDeleteExistingDoc}
				handleRestoreExistingDoc={handleRestoreExistingDoc}
				hasAdminTalanganDoc={hasAdminTalanganDoc}
				preventMinus={preventMinus}
			/>

			{/* 4. Biaya Tambahan Section */}
			<BiayaTambahanSection
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
				stagedDocsTambahan={stagedDocsTambahan}
				deletedDocKeysTambahan={deletedDocKeysTambahan}
				handleStageDoc={handleStageDoc}
				handleRemoveStagedDoc={handleRemoveStagedDoc}
				handleDeleteExistingDoc={handleDeleteExistingDoc}
				handleRestoreExistingDoc={handleRestoreExistingDoc}
				customData={customData}
				handleCustomFieldChange={handleCustomFieldChange}
				triggerAddCustomField={triggerAddCustomField}
				triggerDeleteCustomField={triggerDeleteCustomField}
				preventMinus={preventMinus}
			/>

			{/* Modal Atur Pembagian Biaya Pendidikan */}
			<PartitionModal
				open={partitionModalOpen}
				onOpenChange={setPartitionModalOpen}
				saving={partitionSaving}
				totalBiaya={partitionTotalBiaya}
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

			{/* Modal Tambah/Edit Cicilan Semester */}
			<InstallmentModal
				open={installmentModalOpen}
				onOpenChange={setInstallmentModalOpen}
				activeSemester={activeSemester}
				activeInstallment={activeInstallment}
				installmentForm={installmentForm}
				setInstallmentForm={setInstallmentForm}
				isMetodeTalangan={formData?.metodePembayaran === "dana_talangan"}
				saving={installmentLoading}
				onSave={saveInstallmentModal}
				preventMinus={preventMinus}
			/>

			{/* Modal Tambah/Edit Cicilan Talangan */}
			<TalanganInstallmentModal
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
		</div>
	);
}
