"use client";

import {
	BookOpen,
	Building2,
	CheckCircle2,
	Edit,
	FolderPlus,
	GraduationCap,
	Layers,
	ListFilter,
	Loader2,
	Plus,
	Search,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { API_URL, getToken } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function KurikulumPage() {
	const { user } = useAuthStore();
	const canEdit = user?.role === "superadmin" || user?.role === "akademik";

	const [activeTab, setActiveTab] = useState("kurikulum");
	const [curricula, setCurricula] = useState<any[]>([]);
	const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>("");
	const [selectedCurriculum, setSelectedCurriculum] = useState<any>(null);

	const [masterCoursesList, setMasterCoursesList] = useState<any[]>([]);
	const [activeTerm, setActiveTerm] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [searchMaster, setSearchMaster] = useState("");

	// Master Course Modal State
	const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
	const [masterForm, setMasterForm] = useState({
		code: "",
		name: "",
		sks: 2,
		type: "teori",
		description: "",
		isActive: true,
	});

	// Add to Package Modal State
	const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
	const [packageForm, setPackageForm] = useState({
		masterCourseId: "",
		semester: 1,
		isRequired: true,
	});

	// Open Classes Modal State
	const [isOpenClassesModalOpen, setIsOpenClassesModalOpen] = useState(false);
	const [openClassesForm, setOpenClassesForm] = useState({
		cohort: 18,
		semester: 1,
		rombel: "Kelas A",
	});
	const [isOpeningClasses, setIsOpeningClasses] = useState(false);

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const [curRes, masterRes, termRes] = await Promise.all([
				fetch(`${API_URL}/curricula`, {
					headers: { Authorization: `Bearer ${getToken()}` },
				}),
				fetch(`${API_URL}/master-courses`, {
					headers: { Authorization: `Bearer ${getToken()}` },
				}),
				fetch(`${API_URL}/academic-terms/active`, {
					headers: { Authorization: `Bearer ${getToken()}` },
				}),
			]);

			if (curRes.ok) {
				const json = await curRes.json();
				if (json.success) {
					setCurricula(json.data || []);
					if (json.data && json.data.length > 0) {
						setSelectedCurriculumId(json.data[0].id.toString());
						setSelectedCurriculum(json.data[0]);
					}
				}
			}
			if (masterRes.ok) {
				const json = await masterRes.json();
				if (json.success) setMasterCoursesList(json.data || []);
			}
			if (termRes.ok) {
				const json = await termRes.json();
				if (json.success) setActiveTerm(json.data);
			}
		} catch (e) {
			console.error("Gagal memuat data kurikulum", e);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleCurriculumChange = (id: string | null) => {
		const v = id || "";
		setSelectedCurriculumId(v);
		const found = curricula.find((c) => c.id.toString() === v);
		setSelectedCurriculum(found || null);
	};

	const handleCreateMasterCourse = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await fetch(`${API_URL}/master-courses`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getToken()}`,
				},
				body: JSON.stringify(masterForm),
			});
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success("Master mata kuliah berhasil dibuat");
				setIsMasterModalOpen(false);
				setMasterForm({
					code: "",
					name: "",
					sks: 2,
					type: "teori",
					description: "",
					isActive: true,
				});
				fetchData();
			} else {
				toast.error(json.message || "Gagal membuat master mata kuliah");
			}
		} catch {
			toast.error("Kesalahan jaringan");
		}
	};

	const handleAddToPackage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedCurriculumId || !packageForm.masterCourseId) return;

		try {
			const res = await fetch(
				`${API_URL}/curricula/${selectedCurriculumId}/packages`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${getToken()}`,
					},
					body: JSON.stringify({
						masterCourseId: parseInt(packageForm.masterCourseId, 10),
						semester: Number(packageForm.semester),
						isRequired: packageForm.isRequired,
					}),
				},
			);
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success("Mata kuliah berhasil dimasukkan ke paket semester");
				setIsPackageModalOpen(false);
				fetchData();
			} else {
				toast.error(json.message || "Gagal menambahkan mata kuliah ke paket");
			}
		} catch {
			toast.error("Kesalahan jaringan");
		}
	};

	const handleRemoveFromPackage = async (packageId: number) => {
		if (!confirm("Hapus mata kuliah ini dari paket kurikulum?")) return;
		try {
			const res = await fetch(
				`${API_URL}/curricula/${selectedCurriculumId}/packages/${packageId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (res.ok) {
				toast.success("Mata kuliah dihapus dari paket");
				fetchData();
			} else {
				toast.error("Gagal menghapus mata kuliah");
			}
		} catch {
			toast.error("Kesalahan jaringan");
		}
	};

	const handleOpenClasses = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!activeTerm) {
			toast.error("Belum ada periode akademik yang aktif");
			return;
		}
		setIsOpeningClasses(true);
		try {
			const res = await fetch(`${API_URL}/curriculum/open-classes`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getToken()}`,
				},
				body: JSON.stringify({
					termId: activeTerm.id,
					curriculumId: parseInt(selectedCurriculumId, 10),
					cohort: Number(openClassesForm.cohort),
					semester: Number(openClassesForm.semester),
					rombel: openClassesForm.rombel,
				}),
			});
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success(
					json.message || "Kelas berhasil dibuka dari paket kurikulum!",
				);
				setIsOpenClassesModalOpen(false);
			} else {
				toast.error(json.message || "Gagal membuka kelas");
			}
		} catch {
			toast.error("Kesalahan saat membuka kelas");
		} finally {
			setIsOpeningClasses(false);
		}
	};

	// Group packages per semester (1 s.d. 6)
	const packagesBySemester: Record<number, any[]> = {
		1: [],
		2: [],
		3: [],
		4: [],
		5: [],
		6: [],
	};
	if (selectedCurriculum?.packages) {
		for (const p of selectedCurriculum.packages) {
			if (packagesBySemester[p.semester]) {
				packagesBySemester[p.semester].push(p);
			}
		}
	}

	const filteredMasterCourses = masterCoursesList.filter(
		(m) =>
			m.code.toLowerCase().includes(searchMaster.toLowerCase()) ||
			m.name.toLowerCase().includes(searchMaster.toLowerCase()),
	);

	return (
		<div className="space-y-6">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
				<div>
					<h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
						<GraduationCap className="w-5 h-5 text-[#0517B0]" />
						Kurikulum Paket Semester & Master Mata Kuliah
					</h1>
					<p className="text-xs text-slate-500 mt-1">
						Penyusunan kurikulum resmi semester 1 s.d. 6 dan katalog master mata
						kuliah terpadu
					</p>
				</div>
				<div className="flex items-center gap-2">
					{canEdit && (
						<>
							<Button
								onClick={() => setIsMasterModalOpen(true)}
								size="sm"
								variant="outline"
								className="border-slate-300 text-slate-700 text-xs gap-1.5 h-9"
							>
								<Plus className="w-3.5 h-3.5" /> Tambah Master MK
							</Button>
							<Button
								onClick={() => setIsOpenClassesModalOpen(true)}
								size="sm"
								className="bg-[#0517B0] hover:bg-blue-800 text-white font-semibold text-xs gap-1.5 h-9"
							>
								<Layers className="w-3.5 h-3.5" /> Buka Kelas dari Paket
							</Button>
						</>
					)}
				</div>
			</div>

			{/* Main Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-4"
			>
				<TabsList className="bg-slate-100 p-1 border border-slate-200 rounded-lg">
					<TabsTrigger
						value="kurikulum"
						className="text-xs font-semibold gap-1.5"
					>
						<BookOpen className="w-3.5 h-3.5" /> Kurikulum Paket Semester (1 -
						6)
					</TabsTrigger>
					<TabsTrigger value="master" className="text-xs font-semibold gap-1.5">
						<ListFilter className="w-3.5 h-3.5" /> Katalog Master Mata Kuliah (
						{masterCoursesList.length})
					</TabsTrigger>
				</TabsList>

				{/* TAB 1: KURIKULUM & PAKET SEMESTER */}
				<TabsContent value="kurikulum" className="space-y-4">
					<Card className="border border-slate-200 shadow-xs">
						<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-6 flex flex-row items-center justify-between">
							<div className="flex items-center gap-3">
								<Label className="text-xs font-bold text-slate-700">
									Pilih Kurikulum:
								</Label>
								<Select
									value={selectedCurriculumId}
									onValueChange={handleCurriculumChange}
								>
									<SelectTrigger className="w-[280px] h-8 text-xs bg-white">
										<SelectValue placeholder="Pilih Kurikulum" />
									</SelectTrigger>
									<SelectContent>
										{curricula.map((c) => (
											<SelectItem key={c.id} value={c.id.toString()}>
												{c.name} (Angkatan {c.startCohort}+)
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{canEdit && selectedCurriculum && (
								<Button
									size="sm"
									variant="outline"
									onClick={() => setIsPackageModalOpen(true)}
									className="text-xs h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1.5"
								>
									<Plus className="w-3.5 h-3.5" /> Masukkan Mata Kuliah ke Paket
								</Button>
							)}
						</CardHeader>

						<CardContent className="p-6">
							{/* Grid 6 Kolom Semester */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
								{[1, 2, 3, 4, 5, 6].map((sem) => {
									const semPackages = packagesBySemester[sem] || [];
									const totalSks = semPackages.reduce(
										(acc, p) => acc + (p.masterCourse?.sks || 2),
										0,
									);
									const isGanjil = sem % 2 === 1;

									return (
										<div
											key={sem}
											className="border border-slate-200 rounded-xl bg-slate-50/40 p-4 space-y-3 flex flex-col justify-between shadow-2xs hover:border-indigo-200 transition-colors"
										>
											<div>
												<div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
													<div>
														<h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
															<span>Semester {sem}</span>
															<span className="text-[10px] font-normal text-slate-500">
																({isGanjil ? "Ganjil" : "Genap"})
															</span>
														</h3>
													</div>
													<Badge
														variant="outline"
														className={`text-[10px] font-bold ${
															totalSks > 24
																? "bg-rose-50 text-rose-700 border-rose-300"
																: "bg-white text-indigo-700 border-indigo-200"
														}`}
													>
														{totalSks} SKS
													</Badge>
												</div>

												{semPackages.length === 0 ? (
													<p className="text-[11px] text-slate-400 py-6 text-center italic">
														{sem >= 5
															? "Fokus Magang / OJT"
															: "Belum ada mata kuliah dalam paket"}
													</p>
												) : (
													<div className="space-y-2 mt-3">
														{semPackages.map((pkg) => (
															<div
																key={pkg.id}
																className="p-2.5 bg-white border border-slate-200/90 rounded-lg text-xs space-y-1 shadow-2xs group flex items-start justify-between gap-2"
															>
																<div>
																	<div className="flex items-center gap-1.5 font-bold text-slate-800">
																		<span className="font-mono text-[10px] text-indigo-600 px-1 bg-indigo-50 rounded">
																			{pkg.masterCourse?.code}
																		</span>
																		<span>{pkg.masterCourse?.name}</span>
																	</div>
																	<p className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
																		<span>{pkg.masterCourse?.sks} SKS</span>
																		<span>•</span>
																		<span className="capitalize">
																			{pkg.masterCourse?.type}
																		</span>
																	</p>
																</div>
																{canEdit && (
																	<Button
																		size="icon"
																		variant="ghost"
																		onClick={() =>
																			handleRemoveFromPackage(pkg.id)
																		}
																		className="h-6 w-6 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
																	>
																		<Trash2 className="w-3.5 h-3.5" />
																	</Button>
																)}
															</div>
														))}
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* TAB 2: KATALOG MASTER MATA KULIAH */}
				<TabsContent value="master" className="space-y-4">
					<Card className="border border-slate-200 shadow-xs">
						<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-6 flex flex-row items-center justify-between">
							<div className="relative w-72">
								<Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
								<Input
									placeholder="Cari kode atau nama mata kuliah..."
									value={searchMaster}
									onChange={(e) => setSearchMaster(e.target.value)}
									className="h-9 pl-9 text-xs bg-white"
								/>
							</div>
							{canEdit && (
								<Button
									size="sm"
									onClick={() => setIsMasterModalOpen(true)}
									className="text-xs h-9 bg-[#0517B0] text-white gap-1.5"
								>
									<Plus className="w-3.5 h-3.5" /> Tambah Master MK Baru
								</Button>
							)}
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow className="bg-slate-50 text-[11px] font-bold text-slate-600">
										<TableHead>Kode MK</TableHead>
										<TableHead>Nama Mata Kuliah</TableHead>
										<TableHead>Bobot SKS</TableHead>
										<TableHead>Tipe</TableHead>
										<TableHead>Deskripsi</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredMasterCourses.map((m) => (
										<TableRow
											key={m.id}
											className="text-xs hover:bg-slate-50/60"
										>
											<TableCell className="font-mono font-bold text-indigo-700">
												{m.code}
											</TableCell>
											<TableCell className="font-semibold text-slate-900">
												{m.name}
											</TableCell>
											<TableCell>{m.sks} SKS</TableCell>
											<TableCell className="capitalize">{m.type}</TableCell>
											<TableCell className="text-slate-500 max-w-xs truncate">
												{m.description || "-"}
											</TableCell>
											<TableCell>
												{m.isActive ? (
													<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
														Aktif
													</Badge>
												) : (
													<Badge
														variant="outline"
														className="text-slate-400 text-[10px]"
													>
														Non-Aktif
													</Badge>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* DIALOG: Tambah Master MK Baru */}
			<Dialog open={isMasterModalOpen} onOpenChange={setIsMasterModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900">
							Tambah Master Mata Kuliah
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Katalog statis mata kuliah yang dapat digunakan di berbagai
							kurikulum dan semester
						</DialogDescription>
					</DialogHeader>
					<form
						onSubmit={handleCreateMasterCourse}
						className="space-y-3.5 pt-2"
					>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs">Kode Mata Kuliah *</Label>
								<Input
									placeholder="Contoh: HK101"
									value={masterForm.code}
									onChange={(e) =>
										setMasterForm({ ...masterForm, code: e.target.value })
									}
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs">Bobot SKS *</Label>
								<Input
									type="number"
									min={1}
									max={6}
									value={masterForm.sks}
									onChange={(e) =>
										setMasterForm({
											...masterForm,
											sks: parseInt(e.target.value, 10) || 2,
										})
									}
									required
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">Nama Mata Kuliah *</Label>
							<Input
								placeholder="Contoh: Housekeeping & Room Management"
								value={masterForm.name}
								onChange={(e) =>
									setMasterForm({ ...masterForm, name: e.target.value })
								}
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">Tipe Perkuliahan</Label>
							<Select
								value={masterForm.type}
								onValueChange={(val) =>
									setMasterForm({ ...masterForm, type: val || "teori" })
								}
							>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="teori">Teori</SelectItem>
									<SelectItem value="praktik">Praktik</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">Deskripsi (Opsional)</Label>
							<Textarea
								placeholder="Silabus ringkas atau tujuan pembelajaran..."
								value={masterForm.description}
								onChange={(e) =>
									setMasterForm({ ...masterForm, description: e.target.value })
								}
								rows={2}
								className="text-xs"
							/>
						</div>
						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsMasterModalOpen(false)}
							>
								Batal
							</Button>
							<Button
								type="submit"
								size="sm"
								className="bg-[#0517B0] text-white"
							>
								Simpan Master MK
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* DIALOG: Masukkan MK ke Paket Kurikulum */}
			<Dialog open={isPackageModalOpen} onOpenChange={setIsPackageModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900">
							Masukkan MK ke Paket Semester
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Menentukan mata kuliah diambil pada semester berapa di kurikulum
							ini
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleAddToPackage} className="space-y-4 pt-2">
						<div className="space-y-1.5">
							<Label className="text-xs">
								Pilih Mata Kuliah (Katalog Master)
							</Label>
							<Select
								value={packageForm.masterCourseId}
								onValueChange={(val) =>
									setPackageForm({ ...packageForm, masterCourseId: val || "" })
								}
							>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue placeholder="Pilih Mata Kuliah" />
								</SelectTrigger>
								<SelectContent className="max-h-56">
									{masterCoursesList.map((m) => (
										<SelectItem key={m.id} value={m.id.toString()}>
											[{m.code}] {m.name} ({m.sks} SKS - {m.type})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">Ditempatkan Pada Semester</Label>
							<Select
								value={packageForm.semester.toString()}
								onValueChange={(val) =>
									setPackageForm({
										...packageForm,
										semester: parseInt(val || "1", 10),
									})
								}
							>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">Semester 1 (Ganjil)</SelectItem>
									<SelectItem value="2">Semester 2 (Genap)</SelectItem>
									<SelectItem value="3">Semester 3 (Ganjil)</SelectItem>
									<SelectItem value="4">Semester 4 (Genap)</SelectItem>
									<SelectItem value="5">Semester 5 (Ganjil)</SelectItem>
									<SelectItem value="6">Semester 6 (Genap)</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsPackageModalOpen(false)}
							>
								Batal
							</Button>
							<Button
								type="submit"
								size="sm"
								className="bg-[#0517B0] text-white"
							>
								Tambahkan ke Paket
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* DIALOG: Buka Kelas dari Paket untuk Periode Aktif */}
			<Dialog
				open={isOpenClassesModalOpen}
				onOpenChange={setIsOpenClassesModalOpen}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<Layers className="w-4 h-4 text-indigo-600" />
							Buka Kelas dari Paket Kurikulum
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Membuka seluruh kelas mata kuliah paket semester secara otomatis
							untuk periode aktif ({activeTerm?.name})
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleOpenClasses} className="space-y-4 pt-2">
						<div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs space-y-1 text-indigo-950">
							<p>
								Periode Aktif:{" "}
								<strong>{activeTerm?.name || "Belum dipilih"}</strong>
							</p>
							<p>
								Kurikulum: <strong>{selectedCurriculum?.name}</strong>
							</p>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs">Angkatan Sasaran</Label>
								<Input
									type="number"
									value={openClassesForm.cohort}
									onChange={(e) =>
										setOpenClassesForm({
											...openClassesForm,
											cohort: parseInt(e.target.value, 10) || 18,
										})
									}
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs">Semester Paket</Label>
								<Select
									value={openClassesForm.semester.toString()}
									onValueChange={(val) =>
										setOpenClassesForm({
											...openClassesForm,
											semester: parseInt(val || "1", 10),
										})
									}
								>
									<SelectTrigger className="h-9 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1">Semester 1 (Ganjil)</SelectItem>
										<SelectItem value="2">Semester 2 (Genap)</SelectItem>
										<SelectItem value="3">Semester 3 (Ganjil)</SelectItem>
										<SelectItem value="4">Semester 4 (Genap)</SelectItem>
										<SelectItem value="5">Semester 5 (Ganjil)</SelectItem>
										<SelectItem value="6">Semester 6 (Genap)</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs">Rombel</Label>
							<Input
								placeholder="Kelas A"
								value={openClassesForm.rombel}
								onChange={(e) =>
									setOpenClassesForm({
										...openClassesForm,
										rombel: e.target.value,
									})
								}
								required
							/>
						</div>

						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsOpenClassesModalOpen(false)}
							>
								Batal
							</Button>
							<Button
								type="submit"
								size="sm"
								disabled={isOpeningClasses}
								className="bg-[#0517B0] text-white"
							>
								{isOpeningClasses ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
								) : null}
								Buka Seluruh Kelas Paket
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
