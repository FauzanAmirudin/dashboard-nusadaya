"use client";

import {
	BookOpen,
	CheckSquare,
	Edit,
	GraduationCap,
	Loader2,
	Plus,
	RotateCcw,
	Search,
	Settings,
	Trash2,
	Users2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
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
import { DEFAULT_ROMBEL_OPTIONS } from "@/constants/rooms";
import { api } from "@/lib/eden";
import { getPeminatanOption, PEMINATAN_OPTIONS } from "@/lib/peminatan";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

type CourseData = {
	id: number;
	code: string;
	name: string;
	sks?: number;
	rombel?: string;
	dosenId: number;
	dosen: { id: number; fullName: string };
	dosenPendampingId?: number | null;
	dosenPendamping?: { id: number; fullName: string } | null;
	peminatan: string | null;
	cohort: number;
	type: "teori" | "praktik";
};

type DosenData = {
	id: number;
	fullName: string;
};

export default function MataKuliahPage() {
	const { user, hasHydrated } = useAuthStore();
	const [courses, setCourses] = useState<CourseData[]>([]);
	const [dosenList, setDosenList] = useState<DosenData[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [filterCohort, setFilterCohort] = useState<string>("all");
	const [filterRombel, setFilterRombel] = useState<string>("all");
	const [filterType, setFilterType] = useState<string>("all");
	const [filterPeminatan, setFilterPeminatan] = useState<string>("all");

	// Modals
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [registeredCohorts, setRegisteredCohorts] = useState<number[]>([]);
	const [isCustomRombel, setIsCustomRombel] = useState(false);

	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const initialForm = {
		code: "",
		name: "",
		sks: "2",
		rombel: "Kelas A",
		dosenId: "",
		dosenPendampingId: "none",
		peminatan: "",
		cohort: "",
		type: "teori",
	};
	const [formData, setFormData] = useState(initialForm);

	const fetchCourses = async () => {
		try {
			const { data, error } = await api.courses.get({
				$query: {
					...(filterCohort !== "all" && { cohort: filterCohort }),
					...(filterRombel !== "all" && { rombel: filterRombel }),
					...(filterType !== "all" && { type: filterType }),
					...(filterPeminatan !== "all" && { peminatan: filterPeminatan }),
				},
			});
			if (error) throw error;
			if (data?.success) {
				let courseList = data.data as unknown as CourseData[];
				if (user?.role === "dosen") {
					courseList = courseList.filter(
						(c) =>
							c.dosenId === user.id ||
							c.dosen?.id === user.id ||
							c.dosenPendampingId === user.id ||
							c.dosenPendamping?.id === user.id,
					);
				}
				setCourses(courseList);

				// Extract any dosens from courses data to ensure dropdown has them
				const courseDosens: DosenData[] = [];
				courseList.forEach((c) => {
					if (c.dosen && c.dosen.id) {
						courseDosens.push({
							id: c.dosen.id,
							fullName: c.dosen.fullName || `Dosen #${c.dosen.id}`,
						});
					}
					if (c.dosenPendamping && c.dosenPendamping.id) {
						courseDosens.push({
							id: c.dosenPendamping.id,
							fullName:
								c.dosenPendamping.fullName || `Dosen #${c.dosenPendamping.id}`,
						});
					}
				});
				if (courseDosens.length > 0) {
					setDosenList((prev) => {
						const map = new Map<number, DosenData>();
						for (const d of prev) map.set(d.id, d);
						for (const d of courseDosens) map.set(d.id, d);
						return Array.from(map.values());
					});
				}
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal memuat data");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchDosen = async () => {
		try {
			const { data, error } = await (api as any).users.get({
				$query: { role: "dosen" },
			});
			if (!error && data?.data && Array.isArray(data.data)) {
				setDosenList((prev) => {
					const map = new Map<number, DosenData>();
					for (const d of prev) map.set(d.id, d);
					for (const d of data.data) {
						map.set(d.id, {
							id: d.id,
							fullName: d.fullName || d.username || `Dosen #${d.id}`,
						});
					}
					return Array.from(map.values());
				});
			}
		} catch (err) {
			console.error("Gagal memuat daftar dosen:", err);
		}
	};

	const fetchRegisteredCohorts = async () => {
		try {
			const res = await (api as any).students.cohorts.get();
			if (res.data?.success && Array.isArray(res.data.data)) {
				setRegisteredCohorts(res.data.data);
				return;
			}
			const summaryRes = await (api as any).dashboard.summary.get({
				$query: { archived: "false" },
			});
			if (summaryRes.data?.data?.cohorts) {
				setRegisteredCohorts(summaryRes.data.data.cohorts);
			}
		} catch (error) {
			console.error("Error fetching registered cohorts:", error);
		}
	};

	const broadcastCourseChange = () => {
		if (typeof window !== "undefined") {
			window.dispatchEvent(
				new CustomEvent("academic-data-updated", {
					detail: { action: "course-changed" },
				}),
			);
			window.dispatchEvent(
				new CustomEvent("course-updated", {
					detail: { action: "course-changed" },
				}),
			);
			try {
				const ch = new BroadcastChannel("dashboard-realtime-sync");
				ch.postMessage({
					type: "academic-data-updated",
					action: "course-changed",
				});
				ch.postMessage({ type: "course-updated", action: "course-changed" });
				ch.close();
			} catch {}
		}
	};

	useEffect(() => {
		if (hasHydrated && user) {
			setIsLoading(true);
			fetchCourses();
			fetchRegisteredCohorts();
			if (user.role !== "dosen") {
				fetchDosen();
			}
		}

		// Auto sync if courses updated from other tabs / sessions
		const handleCourseSync = () => {
			fetchCourses();
		};
		window.addEventListener("course-updated", handleCourseSync);

		let bc: BroadcastChannel | null = null;
		try {
			bc = new BroadcastChannel("dashboard-realtime-sync");
			bc.onmessage = (msg) => {
				if (
					msg.data?.type === "course-updated" ||
					msg.data?.type === "academic-data-updated"
				) {
					fetchCourses();
				}
			};
		} catch {}

		const handleFocus = () => {
			if (document.visibilityState === "visible") {
				fetchCourses();
			}
		};
		document.addEventListener("visibilitychange", handleFocus);
		window.addEventListener("focus", handleFocus);

		return () => {
			window.removeEventListener("course-updated", handleCourseSync);
			document.removeEventListener("visibilitychange", handleFocus);
			window.removeEventListener("focus", handleFocus);
			if (bc) bc.close();
		};
	}, [
		hasHydrated,
		user,
		filterCohort,
		filterRombel,
		filterType,
		filterPeminatan,
	]);

	const availableCohorts = useMemo(() => {
		const set = new Set<number>();
		registeredCohorts.forEach((c) => set.add(c));
		courses.forEach((c) => {
			if (c.cohort) set.add(c.cohort);
		});
		if (set.size === 0) {
			[16, 15, 14].forEach((c) => set.add(c));
		}
		return Array.from(set).sort((a, b) => Number(b) - Number(a));
	}, [registeredCohorts, courses]);

	const availableRombels = useMemo(() => {
		const fromData = courses.map((c) => c.rombel).filter(Boolean) as string[];
		const set = new Set<string>([
			"Kelas A",
			"Kelas B",
			"Kelas C",
			"Gabungan",
			...fromData,
		]);
		return Array.from(set).sort();
	}, [courses]);

	const modalCohorts = useMemo(() => {
		const set = new Set<number>(availableCohorts);
		if (formData.cohort) {
			const num = parseInt(formData.cohort, 10);
			if (!Number.isNaN(num)) set.add(num);
		}
		return Array.from(set).sort((a, b) => Number(b) - Number(a));
	}, [availableCohorts, formData.cohort]);

	const modalRombels = useMemo(() => {
		const set = new Set<string>(availableRombels);
		if (formData.rombel && formData.rombel.trim() && !isCustomRombel) {
			set.add(formData.rombel.trim());
		}
		return Array.from(set);
	}, [availableRombels, formData.rombel, isCustomRombel]);

	const modalSksOptions = useMemo(() => {
		const values = ["1", "2", "3", "4", "5", "6"];
		if (formData.sks && !values.includes(formData.sks)) {
			values.push(formData.sks);
			values.sort((a, b) => Number(a) - Number(b));
		}
		return values;
	}, [formData.sks]);

	const uniquePeminatan = useMemo(() => {
		return Array.from(
			new Set(courses.map((c) => c.peminatan).filter(Boolean)),
		) as string[];
	}, [courses]);

	const duplicateCourseCode = useMemo(() => {
		const clean = formData.code.trim().toUpperCase();
		if (!clean) return null;
		return courses.find(
			(c) => c.code.trim().toUpperCase() === clean && c.id !== editingId,
		);
	}, [formData.code, courses, editingId]);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.code || !formData.name || !formData.cohort) {
			toast.error("Mohon lengkapi data yang wajib diisi");
			return;
		}

		const cleanCode = formData.code.trim().toUpperCase();
		const existingDuplicate = courses.find(
			(c) => c.code.trim().toUpperCase() === cleanCode && c.id !== editingId,
		);
		if (existingDuplicate) {
			toast.error(
				`Kode mata kuliah '${cleanCode}' sudah digunakan oleh mata kuliah '${existingDuplicate.name}'. Kode mata kuliah harus unik (hanya satu per mata kuliah).`,
			);
			return;
		}

		let dosenIdPayload = parseInt(formData.dosenId, 10);
		if (user?.role === "dosen") {
			dosenIdPayload = user.id;
		} else if (!formData.dosenId) {
			toast.error("Mohon pilih dosen pengampu");
			return;
		}

		let dosenPendampingIdPayload: number | null = null;
		if (formData.dosenPendampingId && formData.dosenPendampingId !== "none") {
			dosenPendampingIdPayload = parseInt(formData.dosenPendampingId, 10);
			if (dosenPendampingIdPayload === dosenIdPayload) {
				toast.error("Dosen pendamping tidak boleh sama dengan dosen utama");
				return;
			}
		}

		setIsSaving(true);
		try {
			const sksVal = formData.sks ? parseInt(formData.sks, 10) : 2;
			const rombelVal = (formData.rombel || "Kelas A").trim();

			if (editingId) {
				const { data, error } = await api.courses[editingId].patch({
					code: formData.code.trim(),
					name: formData.name.trim(),
					sks: sksVal,
					rombel: rombelVal,
					dosenId: dosenIdPayload,
					dosenPendampingId: dosenPendampingIdPayload,
					peminatan: formData.peminatan || undefined,
					cohort: parseInt(formData.cohort, 10),
					type: formData.type as "teori" | "praktik",
				});
				if (error) {
					const msg =
						typeof error.value === "object" && (error.value as any)?.message
							? (error.value as any).message
							: "Gagal memperbarui data";
					toast.error(msg);
					setIsSaving(false);
					return;
				}
				if (data?.success) {
					toast.success("Mata kuliah berhasil diperbarui");
					setIsEditOpen(false);
					fetchCourses();
					broadcastCourseChange();
				}
			} else {
				const { data, error } = await api.courses.post({
					code: formData.code.trim(),
					name: formData.name.trim(),
					sks: sksVal,
					rombel: rombelVal,
					dosenId: dosenIdPayload,
					dosenPendampingId: dosenPendampingIdPayload,
					peminatan: formData.peminatan || undefined,
					cohort: parseInt(formData.cohort, 10),
					type: formData.type as "teori" | "praktik",
				});
				if (error) {
					const msg =
						typeof error.value === "object" && (error.value as any)?.message
							? (error.value as any).message
							: "Gagal menambahkan mata kuliah";
					toast.error(msg);
					setIsSaving(false);
					return;
				}
				if (data?.success) {
					toast.success("Mata kuliah berhasil ditambahkan");
					setIsAddOpen(false);
					setFormData(initialForm);
					fetchCourses();
					broadcastCourseChange();
				}
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal menyimpan data");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			const { data, error } = await api.courses[deletingId].delete();
			if (error) throw error;
			if (data?.success) {
				toast.success("Mata kuliah berhasil dihapus");
				setDeleteConfirmOpen(false);
				fetchCourses();
				broadcastCourseChange();
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal menghapus data");
		}
	};

	const openEdit = (course: CourseData) => {
		setEditingId(course.id);
		const dId = course.dosenId
			? course.dosenId.toString()
			: course.dosen?.id
				? course.dosen.id.toString()
				: "";
		const dpId = course.dosenPendampingId
			? course.dosenPendampingId.toString()
			: course.dosenPendamping?.id
				? course.dosenPendamping.id.toString()
				: "none";

		const rombelVal = course.rombel || "Kelas A";
		setFormData({
			code: course.code,
			name: course.name,
			sks: course.sks ? course.sks.toString() : "2",
			rombel: rombelVal,
			dosenId: dId,
			dosenPendampingId: dpId,
			peminatan: course.peminatan || "",
			cohort: course.cohort ? course.cohort.toString() : "",
			type: course.type || "teori",
		});
		setIsCustomRombel(
			!(DEFAULT_ROMBEL_OPTIONS as readonly string[]).includes(rombelVal),
		);

		if (course.dosen && course.dosen.id) {
			setDosenList((prev) => {
				if (!prev.some((d) => d.id === course.dosen.id)) {
					return [
						...prev,
						{
							id: course.dosen.id,
							fullName: course.dosen.fullName || `Dosen #${course.dosen.id}`,
						},
					];
				}
				return prev;
			});
		}
		if (course.dosenPendamping && course.dosenPendamping.id) {
			setDosenList((prev) => {
				if (!prev.some((d) => d.id === course.dosenPendamping?.id)) {
					return [
						...prev,
						{
							id: course.dosenPendamping!.id,
							fullName:
								course.dosenPendamping!.fullName ||
								`Dosen #${course.dosenPendamping!.id}`,
						},
					];
				}
				return prev;
			});
		}
		setIsEditOpen(true);
	};

	const filteredCourses = useMemo(() => {
		return courses.filter((c) => {
			if (
				user?.role === "dosen" &&
				c.dosenId !== user.id &&
				c.dosen?.id !== user.id &&
				c.dosenPendampingId !== user.id &&
				c.dosenPendamping?.id !== user.id
			) {
				return false;
			}
			if (!searchQuery) return true;
			const query = searchQuery.toLowerCase();
			return (
				c.name.toLowerCase().includes(query) ||
				c.code.toLowerCase().includes(query) ||
				c.dosen?.fullName?.toLowerCase().includes(query) ||
				c.dosenPendamping?.fullName?.toLowerCase().includes(query) ||
				(c.peminatan && c.peminatan.toLowerCase().includes(query))
			);
		});
	}, [courses, searchQuery, user]);

	const isFilterActive =
		searchQuery.trim() !== "" ||
		filterCohort !== "all" ||
		filterRombel !== "all" ||
		filterType !== "all" ||
		filterPeminatan !== "all";

	const resetFilters = () => {
		setSearchQuery("");
		setFilterCohort("all");
		setFilterRombel("all");
		setFilterType("all");
		setFilterPeminatan("all");
	};

	if (!hasHydrated) return null;

	return (
		<div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
				<div className="flex items-center gap-3">
					<div className="p-2.5 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-100">
						<BookOpen className="w-6 h-6" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold text-slate-900">
								{user?.role === "dosen"
									? "Mata Kuliah Yang Diampu"
									: "Manajemen Mata Kuliah"}
							</h1>
							<Badge className="bg-blue-50 text-[#0517B0] border-blue-200 text-xs">
								{user?.role === "dosen" ? "Dosen" : "Akademik"}
							</Badge>
						</div>
						<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
							{user?.role === "dosen"
								? `Daftar mata kuliah yang Anda ampu (${user.fullName || user.username}) beserta akses 16 pertemuan, presensi, dan rekap penilaian.`
								: "Kelola master mata kuliah, penugasan dosen pengampu, angkatan, dan jadwal perkuliahan."}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2.5 flex-wrap">
					{(user?.role === "superadmin" || user?.role === "akademik") && (
						<Button
							size="sm"
							onClick={() => {
								setEditingId(null);
								setFormData({
									...initialForm,
									cohort: availableCohorts[0]
										? availableCohorts[0].toString()
										: "16",
								});
								setIsCustomRombel(false);
								setIsAddOpen(true);
							}}
							className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs gap-1.5 h-9 shadow-xs"
						>
							<Plus className="w-3.5 h-3.5" />
							Tambah Mata Kuliah
						</Button>
					)}
				</div>
			</div>

			{/* Main Table Card */}
			<Card className="bg-white border-slate-200 shadow-xs overflow-hidden rounded-xl">
				<CardHeader className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col gap-4">
					<div>
						<CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
							<BookOpen className="w-4 h-4 text-[#0517B0]" />
							Daftar Mata Kuliah
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Gunakan kolom pencarian dan filter di bawah untuk memfilter
							berdasarkan angkatan, jenis, atau peminatan.
						</p>
					</div>

					{/* Search & Filter Bar */}
					<div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
						{/* Search Bar */}
						<div className="relative flex-1 max-w-md">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari mata kuliah, kode, atau dosen..."
								className="pl-9 h-9 text-xs bg-white border-slate-200 w-full"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						{/* Dropdown Filters & Reset Button */}
						<div className="flex flex-wrap items-center gap-2">
							{/* Filter Angkatan */}
							<Select
								value={filterCohort}
								onValueChange={(val) => setFilterCohort(val || "all")}
							>
								<SelectTrigger className="w-full sm:w-[140px] bg-white h-9 text-xs border-slate-200">
									<SelectValue placeholder="Angkatan">
										{filterCohort === "all"
											? "Semua Angkatan"
											: `Angkatan ${filterCohort}`}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all" className="text-xs">
										Semua Angkatan
									</SelectItem>
									{availableCohorts.map((cohort) => (
										<SelectItem
											key={cohort}
											value={cohort.toString()}
											className="text-xs"
										>
											Angkatan {cohort}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Filter Rombel */}
							<Select
								value={filterRombel}
								onValueChange={(val) => setFilterRombel(val || "all")}
							>
								<SelectTrigger className="w-full sm:w-[135px] bg-white h-9 text-xs border-slate-200">
									<SelectValue placeholder="Rombel">
										{filterRombel === "all" ? "Semua Rombel" : filterRombel}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all" className="text-xs">
										Semua Rombel
									</SelectItem>
									{availableRombels.map((rombel) => (
										<SelectItem key={rombel} value={rombel} className="text-xs">
											{rombel}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Filter Jenis */}
							<Select
								value={filterType}
								onValueChange={(val) => setFilterType(val || "all")}
							>
								<SelectTrigger className="w-full sm:w-[135px] bg-white h-9 text-xs border-slate-200">
									<SelectValue placeholder="Jenis MK">
										{filterType === "all"
											? "Semua Jenis"
											: filterType === "teori"
												? "Kelas Teori"
												: "Kelas Praktik"}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all" className="text-xs">
										Semua Jenis
									</SelectItem>
									<SelectItem value="teori" className="text-xs">
										Kelas Teori
									</SelectItem>
									<SelectItem value="praktik" className="text-xs">
										Kelas Praktik
									</SelectItem>
								</SelectContent>
							</Select>

							{/* Filter Peminatan */}
							{uniquePeminatan.length > 0 && (
								<Select
									value={filterPeminatan}
									onValueChange={(val) => setFilterPeminatan(val || "all")}
								>
									<SelectTrigger className="w-full sm:w-[165px] bg-white h-9 text-xs border-slate-200">
										<SelectValue placeholder="Peminatan">
											{filterPeminatan === "all"
												? "Semua Peminatan"
												: `Peminatan: ${filterPeminatan}`}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all" className="text-xs">
											Semua Peminatan
										</SelectItem>
										{uniquePeminatan.map((p, i) => (
											<SelectItem key={i} value={p} className="text-xs">
												{p}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}

							{/* Reset Button Inline */}
							{isFilterActive && (
								<Button
									variant="outline"
									size="sm"
									onClick={resetFilters}
									className="h-9 px-3 text-xs border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5 font-medium transition-colors"
								>
									<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
									Reset
								</Button>
							)}
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					<div className="overflow-x-auto min-w-full">
						<Table className="w-full">
							<TableHeader>
								<TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 w-28 text-xs">
										Kode & SKS
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 min-w-[200px] text-xs">
										Nama Mata Kuliah
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 min-w-[170px] text-xs">
										Dosen Pengampu
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 min-w-[150px] text-xs">
										Peminatan
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 text-center w-36 text-xs">
										Angkatan & Rombel
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 text-center w-24 text-xs">
										Jenis
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 text-right min-w-[160px] text-xs">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center py-12">
											<Loader2 className="h-6 w-6 animate-spin mx-auto text-[#0517B0] mb-2" />
											<p className="text-xs text-slate-400">
												Memuat daftar mata kuliah...
											</p>
										</TableCell>
									</TableRow>
								) : filteredCourses.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="text-center py-12 text-slate-500"
										>
											<BookOpen className="h-8 w-8 mx-auto text-slate-300 mb-2" />
											<p className="font-medium text-slate-600 text-sm">
												Tidak ada data mata kuliah
											</p>
											<p className="text-xs text-slate-400 mt-0.5">
												{isFilterActive
													? "Coba ubah filter atau kata kunci pencarian."
													: "Belum ada mata kuliah yang terdaftar."}
											</p>
											{isFilterActive && (
												<Button
													variant="outline"
													size="sm"
													onClick={resetFilters}
													className="mt-3 text-xs"
												>
													Reset Filter
												</Button>
											)}
										</TableCell>
									</TableRow>
								) : (
									filteredCourses.map((c) => (
										<TableRow
											key={c.id}
											className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
										>
											<TableCell className="py-3.5 px-4">
												<div className="flex flex-col gap-1 items-start">
													<span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
														{c.code}
													</span>
													<span className="text-[10px] font-semibold text-slate-500">
														{c.sks || 2} SKS
													</span>
												</div>
											</TableCell>
											<TableCell className="py-3.5 px-4 font-bold text-slate-900 text-sm">
												<Link
													href={`/dashboard/mata-kuliah/${c.id}`}
													className="hover:text-[#0517B0] hover:underline"
												>
													{c.name}
												</Link>
											</TableCell>
											<TableCell className="py-3.5 px-4 text-slate-700 text-xs">
												<div className="flex flex-col gap-1 items-start">
													<div className="flex items-center gap-1.5">
														<GraduationCap className="w-3.5 h-3.5 text-[#0517B0] shrink-0" />
														<span className="font-medium text-slate-800">
															{c.dosen?.fullName || "Belum Ditugaskan"}
														</span>
													</div>
													{c.dosenPendamping && (
														<div className="flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50/70 border border-purple-200/60 px-1.5 py-0.5 rounded-md font-medium">
															<span>+ {c.dosenPendamping.fullName}</span>
															<span className="text-[10px] text-purple-500 font-normal">
																(Pendamping)
															</span>
														</div>
													)}
												</div>
											</TableCell>
											<TableCell className="py-3.5 px-4">
												{c.peminatan ? (
													<PeminatanBadge subProgram={c.peminatan} size="sm" />
												) : (
													<span className="text-slate-400 text-xs">-</span>
												)}
											</TableCell>
											<TableCell className="text-center py-3.5 px-4">
												<div className="flex flex-col gap-1 items-center justify-center">
													<Badge
														variant="outline"
														className="bg-slate-50 border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-0.5"
													>
														Angkatan {c.cohort}
													</Badge>
													<Badge
														variant="outline"
														className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-semibold px-1.5 py-0.5"
													>
														<Users2 className="w-2.5 h-2.5 mr-1" />
														{c.rombel || "Kelas A"}
													</Badge>
												</div>
											</TableCell>
											<TableCell className="text-center py-3.5 px-4">
												<Badge
													className={cn(
														"text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider",
														c.type === "praktik"
															? "bg-emerald-50 text-emerald-700 border-emerald-200"
															: "bg-blue-50 text-blue-700 border-blue-200",
													)}
												>
													{c.type}
												</Badge>
											</TableCell>
											<TableCell className="text-right py-3.5 px-4">
												<div className="flex items-center justify-end gap-1.5">
													<Link href={`/dashboard/mata-kuliah/${c.id}`}>
														<Button
															size="sm"
															className="h-8 px-2.5 gap-1.5 font-bold text-xs bg-[#0517B0] hover:bg-blue-800 text-white shadow-2xs"
															title="Kelola Mata Kuliah & Sesi Pertemuan"
														>
															<Settings className="h-3.5 w-3.5" />
															<span>Sesi & Presensi</span>
														</Button>
													</Link>
													<Link href={`/dashboard/mata-kuliah/rekap/${c.id}`}>
														<Button
															variant="outline"
															size="sm"
															className="h-8 px-2 text-[#0517B0] border-blue-200 hover:bg-blue-50 text-xs"
															title="Rekap Nilai & Presensi"
														>
															<CheckSquare className="h-3.5 w-3.5" />
														</Button>
													</Link>
													{(user?.role === "superadmin" ||
														user?.role === "akademik") && (
														<>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
																onClick={() => openEdit(c)}
																title="Edit Data Mata Kuliah"
															>
																<Edit className="h-3.5 w-3.5" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
																onClick={() => {
																	setDeletingId(c.id);
																	setDeleteConfirmOpen(true);
																}}
																title="Hapus Mata Kuliah"
															>
																<Trash2 className="h-3.5 w-3.5" />
															</Button>
														</>
													)}
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Summary Counter Footer */}
					{!isLoading && filteredCourses.length > 0 && (
						<div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
							<span>
								Menampilkan{" "}
								<strong className="text-slate-700">
									{filteredCourses.length}
								</strong>{" "}
								dari{" "}
								<strong className="text-slate-700">{courses.length}</strong>{" "}
								mata kuliah
							</span>
							{isFilterActive && (
								<span className="text-[#0517B0] font-medium">Filter aktif</span>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Modal Form */}
			<Dialog
				open={isAddOpen || isEditOpen}
				onOpenChange={(open) => {
					if (!open) {
						setIsAddOpen(false);
						setIsEditOpen(false);
					}
				}}
			>
				<DialogContent className="sm:max-w-[620px] rounded-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center font-bold shadow-2xs shrink-0">
								<BookOpen className="w-5 h-5" />
							</div>
							<div>
								<DialogTitle className="text-base font-bold text-slate-900">
									{isAddOpen ? "Tambah Mata Kuliah Baru" : "Edit Mata Kuliah"}
								</DialogTitle>
							</div>
						</div>
					</DialogHeader>

					<form onSubmit={handleSave} className="space-y-4 pt-3">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-slate-700">
									Kode Mata Kuliah <span className="text-rose-500">*</span>
								</Label>
								<Input
									required
									placeholder="Contoh: MK-001"
									className={cn(
										"h-9 text-xs rounded-xl border uppercase font-mono font-bold",
										duplicateCourseCode
											? "border-rose-400 focus-visible:ring-rose-400 bg-rose-50/40 text-rose-800"
											: "border-slate-200 bg-white",
									)}
									value={formData.code}
									onChange={(e) =>
										setFormData({
											...formData,
											code: e.target.value.toUpperCase(),
										})
									}
								/>
								{duplicateCourseCode && (
									<p className="text-[11px] text-rose-600 font-medium">
										⚠️ Kode sudah digunakan oleh: &quot;
										{duplicateCourseCode.name}&quot;
									</p>
								)}
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-slate-700">
									Bobot SKS <span className="text-rose-500">*</span>
								</Label>
								<Select
									value={formData.sks || "2"}
									onValueChange={(val) =>
										setFormData({ ...formData, sks: val || "2" })
									}
								>
									<SelectTrigger className="h-9 text-xs rounded-xl border border-slate-200 bg-white">
										<SelectValue placeholder="Pilih Bobot SKS">
											{formData.sks ? `${formData.sks} SKS` : "Pilih Bobot SKS"}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{modalSksOptions.map((sks) => (
											<SelectItem key={sks} value={sks}>
												{sks === "2"
													? "2 SKS (Standar Perkuliahan)"
													: sks === "3"
														? "3 SKS"
														: sks === "4"
															? "4 SKS (Praktik Intensif)"
															: sks === "6"
																? "6 SKS (Proyek Akhir / Magang)"
																: `${sks} SKS`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-slate-700">
									Angkatan <span className="text-rose-500">*</span>
								</Label>
								<Select
									value={formData.cohort}
									onValueChange={(val) =>
										setFormData({ ...formData, cohort: val || "" })
									}
								>
									<SelectTrigger className="h-9 text-xs rounded-xl border border-slate-200 bg-white">
										<SelectValue placeholder="Pilih Angkatan">
											{formData.cohort
												? `Angkatan ${formData.cohort}`
												: "Pilih Angkatan"}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{modalCohorts.map((cohort) => (
											<SelectItem key={cohort} value={cohort.toString()}>
												Angkatan {cohort}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-slate-700">
									Rombongan Belajar <span className="text-rose-500">*</span>
								</Label>
								<Select
									value={isCustomRombel ? "custom" : formData.rombel}
									onValueChange={(val) => {
										if (val === "custom") {
											setIsCustomRombel(true);
										} else {
											setIsCustomRombel(false);
											setFormData({ ...formData, rombel: val || "Kelas A" });
										}
									}}
								>
									<SelectTrigger className="h-9 text-xs rounded-xl border border-slate-200 bg-white">
										<SelectValue placeholder="Pilih Rombongan Belajar">
											{isCustomRombel
												? "Rombongan Belajar Kustom"
												: formData.rombel || "Pilih Rombongan Belajar"}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{modalRombels.map((rombel) => (
											<SelectItem key={rombel} value={rombel}>
												{rombel}
											</SelectItem>
										))}
										<SelectItem
											value="custom"
											className="font-semibold text-[#0517B0]"
										>
											+ Input Kustom / Rombel Baru...
										</SelectItem>
									</SelectContent>
								</Select>

								{isCustomRombel && (
									<Input
										placeholder="Contoh: Kelas Eksekutif, Kelas Sore..."
										value={formData.rombel}
										onChange={(e) =>
											setFormData({ ...formData, rombel: e.target.value })
										}
										className="h-9 text-xs rounded-xl border border-slate-200 mt-1.5"
										autoFocus
									/>
								)}

								{/* Quick Preset Pills */}
								<div className="flex flex-wrap gap-1.5 pt-1">
									{DEFAULT_ROMBEL_OPTIONS.map((opt) => (
										<button
											key={opt}
											type="button"
											onClick={() => {
												setIsCustomRombel(false);
												setFormData({ ...formData, rombel: opt });
											}}
											className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
												formData.rombel === opt && !isCustomRombel
													? "bg-[#0517B0] text-white"
													: "bg-slate-100 text-slate-600 hover:bg-slate-200"
											}`}
										>
											{opt}
										</button>
									))}
								</div>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								Nama Mata Kuliah <span className="text-rose-500">*</span>
							</Label>
							<Input
								required
								placeholder="Contoh: Front Office Operation"
								className="h-9 text-xs rounded-xl border border-slate-200 font-medium"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
							/>
						</div>

						{user?.role !== "dosen" && (
							<>
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-slate-700">
										Dosen Pengampu Utama{" "}
										<span className="text-rose-500">*</span>
									</Label>
									<Select
										value={formData.dosenId || ""}
										onValueChange={(val) => {
											const newDosenId = val || "";
											// If same as pendamping, clear pendamping
											if (newDosenId === formData.dosenPendampingId) {
												setFormData({
													...formData,
													dosenId: newDosenId,
													dosenPendampingId: "none",
												});
											} else {
												setFormData({ ...formData, dosenId: newDosenId });
											}
										}}
									>
										<SelectTrigger className="h-9 text-xs rounded-xl border border-slate-200 bg-white">
											{formData.dosenId ? (
												(() => {
													const selected = dosenList.find(
														(d) => d.id.toString() === formData.dosenId,
													);
													return (
														<span className="font-medium text-slate-800">
															{selected?.fullName ||
																`Dosen #${formData.dosenId}`}
														</span>
													);
												})()
											) : (
												<span className="text-slate-400">
													Pilih Dosen Pengampu Utama
												</span>
											)}
										</SelectTrigger>
										<SelectContent>
											{dosenList.map((d) => (
												<SelectItem key={d.id} value={d.id.toString()}>
													{d.fullName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-1.5">
									<div className="flex items-center justify-between">
										<Label className="text-xs font-semibold text-slate-700">
											Dosen Pendamping{" "}
											<span className="text-[11px] font-normal text-slate-400">
												(Opsional)
											</span>
										</Label>
										{formData.dosenPendampingId &&
											formData.dosenPendampingId !== "none" && (
												<button
													type="button"
													onClick={() =>
														setFormData({
															...formData,
															dosenPendampingId: "none",
														})
													}
													className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
												>
													Hapus Pendamping
												</button>
											)}
									</div>
									<Select
										value={formData.dosenPendampingId || "none"}
										onValueChange={(val) =>
											setFormData({
												...formData,
												dosenPendampingId: val || "none",
											})
										}
									>
										<SelectTrigger className="h-9 text-xs rounded-xl border border-slate-200 bg-white">
											{formData.dosenPendampingId &&
											formData.dosenPendampingId !== "none" ? (
												(() => {
													const selected = dosenList.find(
														(d) =>
															d.id.toString() === formData.dosenPendampingId,
													);
													return (
														<span className="font-medium text-purple-700">
															+{" "}
															{selected?.fullName ||
																`Dosen #${formData.dosenPendampingId}`}{" "}
															(Pendamping)
														</span>
													);
												})()
											) : (
												<span className="text-slate-400">
													-- Tidak Ada (Hanya Satu Dosen Pengampu) --
												</span>
											)}
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">
												<span className="text-slate-500">
													-- Tidak Ada (Hanya Satu Dosen Pengampu) --
												</span>
											</SelectItem>
											{dosenList
												.filter((d) => d.id.toString() !== formData.dosenId)
												.map((d) => (
													<SelectItem key={d.id} value={d.id.toString()}>
														{d.fullName}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							</>
						)}

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-slate-700">
									Peminatan
								</Label>
								<Select
									value={formData.peminatan || "all"}
									onValueChange={(val) =>
										setFormData({
											...formData,
											peminatan: val === "all" || !val ? "" : val,
										})
									}
								>
									<SelectTrigger className="h-9 text-xs rounded-xl border border-slate-200 bg-white">
										{formData.peminatan ? (
											(() => {
												const opt =
													PEMINATAN_OPTIONS.find(
														(p) => p.value === formData.peminatan,
													) || getPeminatanOption(formData.peminatan);
												return (
													<div className="flex items-center gap-2">
														<img
															src={opt.flag}
															alt={opt.alt}
															className="w-4 h-3 object-cover rounded-[1px] shrink-0 shadow-2xs border border-slate-200"
														/>
														<span className="font-medium text-slate-800">
															{opt.label}
														</span>
													</div>
												);
											})()
										) : (
											<span className="text-slate-500">
												Semua Peminatan (Umum)
											</span>
										)}
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											<div className="flex items-center gap-2 text-slate-600">
												<span className="w-4 h-3 bg-slate-100 rounded-[1px] border border-slate-200 flex items-center justify-center text-[9px]">
													🌐
												</span>
												<span>Semua Peminatan (Mata Kuliah Umum)</span>
											</div>
										</SelectItem>
										{PEMINATAN_OPTIONS.map((item) => (
											<SelectItem key={item.value} value={item.value}>
												<div className="flex items-center gap-2">
													<img
														src={item.flag}
														alt={item.alt}
														className="w-4 h-3 object-cover rounded-[1px] shrink-0 shadow-2xs border border-slate-200"
													/>
													<span className="font-medium">{item.label}</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-slate-700">
									Jenis Perkuliahan <span className="text-rose-500">*</span>
								</Label>
								<Select
									value={formData.type || "teori"}
									onValueChange={(val) =>
										setFormData({
											...formData,
											type: (val as "teori" | "praktik") || "teori",
										})
									}
								>
									<SelectTrigger className="h-9 text-xs rounded-xl border border-slate-200 bg-white">
										<SelectValue placeholder="Pilih Jenis Perkuliahan">
											{formData.type === "praktik"
												? "Kelas Praktik"
												: "Kelas Teori"}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="teori">Kelas Teori</SelectItem>
										<SelectItem value="praktik">Kelas Praktik</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsAddOpen(false);
									setIsEditOpen(false);
								}}
								className="h-9 px-4 text-xs rounded-xl font-medium"
							>
								Batal
							</Button>
							<Button
								type="submit"
								disabled={isSaving}
								className="h-9 px-4 text-xs rounded-xl font-bold bg-[#0517B0] hover:bg-blue-800 text-white shadow-xs"
							>
								{isSaving ? (
									<>
										<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
										Menyimpan...
									</>
								) : editingId ? (
									"Perbarui Mata Kuliah"
								) : (
									"Simpan Mata Kuliah"
								)}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirm */}
			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Mata Kuliah?</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini tidak dapat dibatalkan. Menghapus mata kuliah juga
							akan menghapus seluruh data jadwal mengajar, presensi, dan
							penilaian di dalamnya secara permanen.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSaving}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isSaving}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{isSaving ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : null}
							Ya, Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
