"use client";

import {
	Edit,
	Loader2,
	Plus,
	Search,
	Trash2,
	UserCog,
	Upload,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { api, API_URL, getToken } from "@/lib/eden";
import { useAuthStore } from "@/store";

type UserData = {
	id: number;
	username: string;
	fullName: string;
	role: string;
	email: string | null;
	phone: string | null;
	profilePhotoUrl: string | null;
	createdAt: string | Date;
};

const ROLE_LABELS: Record<string, string> = {
	superadmin: "Super Admin",
	pmb: "Tim PMB",
	crm: "Tim CRM",
	finance: "Finance",
	akademik: "Akademik",
	dosen: "Dosen",
	pa: "Pembimbing Akademik",
	magang: "Tim Magang",
	evaluator: "Evaluator",
};

export default function UsersManagementPage() {
	const { user } = useAuthStore();
	const [users, setUsers] = useState<UserData[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedRole, setSelectedRole] = useState("all");

	// Dialog States
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<UserData | null>(null);

	// Alert Dialog
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<number | null>(null);

	// Form States
	const [formData, setFormData] = useState({
		fullName: "",
		username: "",
		email: "",
		phone: "",
		role: "",
		password: "",
		confirmPassword: "",
		profilePhotoUrl: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const { data, error } = await api["manage-users"].get();
			if (error) throw error;
			if (data.success) {
				setUsers(data.data as unknown as UserData[]);
			}
		} catch (err) {
			console.error("Gagal mengambil data pengguna:", err);
			toast.error("Gagal mengambil data pengguna");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const filteredUsers = users.filter((u) => {
		const matchesSearch =
			u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			u.username.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesRole = selectedRole === "all" || u.role === selectedRole;
		return matchesSearch && matchesRole;
	});

	// Helper to determine allowed roles for current user
	const getAllowedRoles = () => {
		if (user?.role === "superadmin") {
			return Object.keys(ROLE_LABELS);
		} else if (user?.role === "akademik") {
			return ["pa", "dosen"];
		}
		return [];
	};

	const allowedRoles = getAllowedRoles();

	const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			setUploadingPhoto(true);
			const formDataPayload = new FormData();
			formDataPayload.append("file", file);

			const res = await fetch(`${API_URL}/files/upload`, {
				method: "POST",
				headers: { Authorization: `Bearer ${getToken()}` },
				body: formDataPayload,
			});

			if (!res.ok) throw new Error("Gagal mengunggah foto");
			const json = await res.json();
			
			if (json.success && json.url) {
				setFormData((prev) => ({ ...prev, profilePhotoUrl: json.url }));
				toast.success("Foto berhasil diunggah");
			}
		} catch (err) {
			console.error(err);
			toast.error("Gagal mengunggah foto profil");
		} finally {
			setUploadingPhoto(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleAddSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (formData.password !== formData.confirmPassword) {
			toast.error("Password tidak cocok");
			return;
		}

		try {
			setIsSubmitting(true);
			const { error } = await api["manage-users"].post(
				{
					username: formData.username,
					password: formData.password,
					fullName: formData.fullName,
					role: formData.role,
					email: formData.email || undefined,
					phone: formData.phone || undefined,
					profilePhotoUrl: formData.profilePhotoUrl || undefined,
				}
			);

			if (error) {
				const errMsg = (error.value as any)?.message || "Gagal menambahkan pengguna";
				throw new Error(errMsg);
			}

			toast.success("Pengguna berhasil ditambahkan");
			setIsAddOpen(false);
			resetForm();
			fetchUsers();
		} catch (err: any) {
			toast.error(err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingUser) return;
		if (formData.password && formData.password !== formData.confirmPassword) {
			toast.error("Password tidak cocok");
			return;
		}

		try {
			setIsSubmitting(true);
			
			// Only send fields that are present
			const payload: any = {
				fullName: formData.fullName,
				username: formData.username,
				role: formData.role,
				email: formData.email || undefined,
				phone: formData.phone || undefined,
				profilePhotoUrl: formData.profilePhotoUrl || undefined,
			};
			
			if (formData.password) {
				payload.password = formData.password;
			}

			const { error } = await api["manage-users"][editingUser.id.toString()].patch(payload);

			if (error) {
				const errMsg = (error.value as any)?.message || "Gagal memperbarui pengguna";
				throw new Error(errMsg);
			}

			toast.success("Data pengguna berhasil diperbarui");
			setIsEditOpen(false);
			setEditingUser(null);
			resetForm();
			fetchUsers();
		} catch (err: any) {
			toast.error(err.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!userToDelete) return;

		try {
			const { error } = await api["manage-users"][userToDelete.toString()].delete();

			if (error) {
				const errMsg = (error.value as any)?.message || "Gagal menghapus pengguna";
				throw new Error(errMsg);
			}

			toast.success("Pengguna berhasil dihapus");
			setDeleteConfirmOpen(false);
			setUserToDelete(null);
			fetchUsers();
		} catch (err: any) {
			toast.error(err.message);
		}
	};

	const openEditDialog = (u: UserData) => {
		setEditingUser(u);
		setFormData({
			fullName: u.fullName,
			username: u.username,
			email: u.email || "",
			phone: u.phone || "",
			role: u.role,
			profilePhotoUrl: u.profilePhotoUrl || "",
			password: "",
			confirmPassword: "",
		});
		setIsEditOpen(true);
	};

	const resetForm = () => {
		setFormData({
			fullName: "",
			username: "",
			email: "",
			phone: "",
			role: "",
			password: "",
			confirmPassword: "",
			profilePhotoUrl: "",
		});
	};

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-12">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
						<UserCog className="w-7 h-7 text-indigo-600" />
						Pengelolaan Pengguna
					</h1>
					<p className="text-slate-500 mt-1">
						Kelola data dan hak akses staf atau sistem akademik.
					</p>
				</div>
				<Button
					onClick={() => {
						resetForm();
						setIsAddOpen(true);
					}}
					className="bg-indigo-600 hover:bg-indigo-700"
				>
					<Plus className="w-4 h-4 mr-2" />
					Tambah Pengguna
				</Button>
			</div>

			<Card className="shadow-sm border-slate-200/60">
				<CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
					<div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
						<CardTitle className="text-lg text-slate-700">
							Daftar Pengguna
						</CardTitle>
						<div className="flex gap-2 w-full sm:w-auto">
							<div className="relative w-full sm:w-64">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
								<Input
									placeholder="Cari nama/username..."
									className="pl-9 bg-white"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
							<Select value={selectedRole} onValueChange={(val) => setSelectedRole(val || "all")}>
								<SelectTrigger className="w-[180px] bg-white">
									<SelectValue placeholder="Semua Peran" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Peran</SelectItem>
									{allowedRoles.map((r) => (
										<SelectItem key={r} value={r}>
											{ROLE_LABELS[r]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-slate-50">
								<TableRow>
									<TableHead className="w-[80px] text-center">Profil</TableHead>
									<TableHead>Nama & Kontak</TableHead>
									<TableHead>Username</TableHead>
									<TableHead>Peran</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={5} className="text-center py-12">
											<Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
											<p className="text-sm text-slate-500">Memuat data...</p>
										</TableCell>
									</TableRow>
								) : filteredUsers.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5} className="text-center py-12">
											<div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
												<Search className="w-6 h-6 text-slate-400" />
											</div>
											<p className="text-sm font-medium text-slate-600">
												Tidak ada pengguna ditemukan
											</p>
										</TableCell>
									</TableRow>
								) : (
									filteredUsers.map((u) => (
										<TableRow key={u.id} className="hover:bg-slate-50/50">
											<TableCell className="text-center align-middle">
												<Avatar className="h-10 w-10 mx-auto border border-slate-200">
													<AvatarImage src={u.profilePhotoUrl || undefined} />
													<AvatarFallback className="bg-indigo-50 text-indigo-600 font-medium">
														{u.fullName.substring(0, 2).toUpperCase()}
													</AvatarFallback>
												</Avatar>
											</TableCell>
											<TableCell>
												<p className="font-medium text-slate-900">
													{u.fullName}
												</p>
												<div className="flex flex-col text-xs text-slate-500 mt-1 gap-0.5">
													{u.email && <span>{u.email}</span>}
													{u.phone && <span>{u.phone}</span>}
												</div>
											</TableCell>
											<TableCell>
												<span className="text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-sm font-mono">
													@{u.username}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex flex-col items-start gap-1">
													<span className="text-sm font-medium text-slate-700">
														{ROLE_LABELS[u.role] || u.role}
													</span>
													<Badge
														variant="outline"
														className="text-[10px] bg-slate-50 text-slate-500 border-slate-200 uppercase"
													>
														{u.role}
													</Badge>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														className="h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
														onClick={() => openEditDialog(u)}
													>
														<Edit className="w-4 h-4" />
													</Button>
													{u.id !== user?.id && (
														<Button
															variant="outline"
															size="sm"
															className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
															onClick={() => {
																setUserToDelete(u.id);
																setDeleteConfirmOpen(true);
															}}
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Form Tambah/Edit Pengguna */}
			<Dialog
				open={isAddOpen || isEditOpen}
				onOpenChange={(open) => {
					if (!open) {
						setIsAddOpen(false);
						setIsEditOpen(false);
						setEditingUser(null);
						resetForm();
					}
				}}
			>
				<DialogContent className="w-full sm:max-w-3xl md:max-w-4xl lg:max-w-[800px] max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{isAddOpen ? "Tambah Pengguna Baru" : "Edit Pengguna"}
						</DialogTitle>
					</DialogHeader>

					<form
						onSubmit={isAddOpen ? handleAddSubmit : handleEditSubmit}
						className="space-y-6 mt-4"
					>
						{/* Photo Upload Section */}
						<div className="flex flex-col items-center gap-3 p-4 border border-slate-200 border-dashed rounded-xl bg-slate-50/50">
							<Avatar className="w-20 h-20 border-2 border-white shadow-sm">
								<AvatarImage src={formData.profilePhotoUrl || undefined} />
								<AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl font-medium">
									{formData.fullName
										? formData.fullName.substring(0, 2).toUpperCase()
										: "UD"}
								</AvatarFallback>
							</Avatar>
							<input
								type="file"
								ref={fileInputRef}
								className="hidden"
								accept="image/*"
								onChange={handlePhotoUpload}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => fileInputRef.current?.click()}
								disabled={uploadingPhoto}
								className="h-8"
							>
								{uploadingPhoto ? (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								) : (
									<Upload className="w-4 h-4 mr-2" />
								)}
								Upload Foto
							</Button>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Nama Lengkap *</Label>
								<Input
									required
									className="border-2 border-slate-200"
									placeholder="Cth: Dr. Budi Santoso"
									value={formData.fullName}
									onChange={(e) =>
										setFormData({ ...formData, fullName: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Username *</Label>
								<Input
									required
									className="border-2 border-slate-200"
									placeholder="Cth: budi123"
									value={formData.username}
									onChange={(e) =>
										setFormData({ ...formData, username: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Email</Label>
								<Input
									type="email"
									className="border-2 border-slate-200"
									placeholder="budi@example.com"
									value={formData.email}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>No WhatsApp</Label>
								<Input
									placeholder="081234567890"
									className="border-2 border-slate-200"
									value={formData.phone}
									onChange={(e) =>
										setFormData({ ...formData, phone: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label>Peran / Role *</Label>
								<Select
									value={formData.role || ""}
									onValueChange={(val) =>
										setFormData({ ...formData, role: val || "" })
									}
									required
								>
									<SelectTrigger className="border-2 border-slate-200">
										<SelectValue placeholder="Pilih Peran" />
									</SelectTrigger>
									<SelectContent>
										{allowedRoles.map((r) => (
											<SelectItem key={r} value={r}>
												{ROLE_LABELS[r]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2 md:col-span-2">
								<Label className="flex flex-col items-start text-left gap-1">
									<span>Password {isAddOpen && " *"}</span>
									{isEditOpen && <span className="text-xs text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
								</Label>
								<Input
									type="password"
									className="border-2 border-slate-200"
									required={isAddOpen}
									value={formData.password}
									onChange={(e) =>
										setFormData({ ...formData, password: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label>Konfirmasi Password</Label>
								<Input
									type="password"
									className="border-2 border-slate-200"
									required={isAddOpen || formData.password.length > 0}
									value={formData.confirmPassword}
									onChange={(e) =>
										setFormData({ ...formData, confirmPassword: e.target.value })
									}
								/>
							</div>
						</div>

						<div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
							<Button
								type="button"
								variant="ghost"
								onClick={() => {
									setIsAddOpen(false);
									setIsEditOpen(false);
								}}
							>
								Batal
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting}
								className="bg-indigo-600 hover:bg-indigo-700"
							>
								{isSubmitting && (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								)}
								Simpan
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Dialog Hapus */}
			<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan dan semua data terkait pengguna ini (termasuk riwayat yang diinput) berisiko kehilangan referensi pembuatnya.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setUserToDelete(null)}>Batal</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
							Ya, Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
