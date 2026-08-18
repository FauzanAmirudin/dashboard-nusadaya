"use client";

import {
	Calendar,
	Camera,
	Check,
	Eye,
	EyeOff,
	KeyRound,
	Loader2,
	Lock,
	Mail,
	Phone,
	Save,
	Shield,
	ShieldCheck,
	Trash2,
	User,
	UserCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL, api, getToken } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { getUserRoles, useAuthStore } from "@/store";

const ROLE_LABELS: Record<string, string> = {
	superadmin: "Super Admin",
	pmb: "Admin PMB",
	akademik: "Admin Akademik",
	finance: "Admin Finance",
	crm: "Admin CRM",
	pa: "Pembimbing Akademik (PA)",
	dosen: "Dosen Pengajar",
	evaluator: "Tim Evaluasi",
	magang: "Tim Magang",
};

const ROLE_STYLES: Record<
	string,
	{ bg: string; text: string; border: string }
> = {
	superadmin: {
		bg: "bg-purple-50",
		text: "text-purple-700",
		border: "border-purple-200",
	},
	pmb: {
		bg: "bg-blue-50",
		text: "text-blue-700",
		border: "border-blue-200",
	},
	akademik: {
		bg: "bg-emerald-50",
		text: "text-emerald-700",
		border: "border-emerald-200",
	},
	finance: {
		bg: "bg-amber-50",
		text: "text-amber-700",
		border: "border-amber-200",
	},
	crm: {
		bg: "bg-rose-50",
		text: "text-rose-700",
		border: "border-rose-200",
	},
	pa: {
		bg: "bg-teal-50",
		text: "text-teal-700",
		border: "border-teal-200",
	},
	dosen: {
		bg: "bg-indigo-50",
		text: "text-indigo-700",
		border: "border-indigo-200",
	},
	evaluator: {
		bg: "bg-cyan-50",
		text: "text-cyan-700",
		border: "border-cyan-200",
	},
	magang: {
		bg: "bg-orange-50",
		text: "text-orange-700",
		border: "border-orange-200",
	},
};

export default function ProfilePage() {
	const { user, hasHydrated, updateUser } = useAuthStore();
	const [activeTab, setActiveTab] = useState("info");
	const [isLoading, setIsLoading] = useState(true);

	// Profile Form State
	const [profileForm, setProfileForm] = useState({
		fullName: "",
		username: "",
		email: "",
		phone: "",
		profilePhotoUrl: "",
		role: "",
		roles: [] as string[],
		createdAt: "",
	});
	const [isSavingProfile, setIsSavingProfile] = useState(false);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Password Form State
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmNewPassword: "",
	});
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSavingPassword, setIsSavingPassword] = useState(false);

	// Fetch full profile data from API
	const fetchProfileData = async () => {
		try {
			setIsLoading(true);
			const { data, error } = await api.auth.profile.get();
			if (error) {
				const errMsg =
					(error as any)?.value?.message ||
					(error as any)?.message ||
					"Gagal memuat profil";
				toast.error(errMsg);
				return;
			}
			if (data?.success && data?.data) {
				const u = data.data;
				setProfileForm({
					fullName: u.fullName || "",
					username: u.username || "",
					email: u.email || "",
					phone: u.phone || "",
					profilePhotoUrl: u.profilePhotoUrl || "",
					role: u.role || "",
					roles: u.roles || (u.role ? [u.role] : []),
					createdAt: u.createdAt
						? new Date(u.createdAt).toLocaleDateString("id-ID", {
								day: "numeric",
								month: "long",
								year: "numeric",
							})
						: "-",
				});
				// Sync Zustand store
				updateUser({
					fullName: u.fullName,
					username: u.username,
					email: u.email,
					phone: u.phone,
					profilePhotoUrl: u.profilePhotoUrl,
					role: u.role,
					roles: u.roles,
				});
			}
		} catch (err: any) {
			console.error("Failed to load profile:", err);
			toast.error("Gagal memuat data profil");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (hasHydrated) {
			fetchProfileData();
		}
	}, [hasHydrated]);

	// Handle Photo Upload
	const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Client side validation
		if (!file.type.startsWith("image/")) {
			toast.error("File harus berupa gambar (JPG/PNG/WEBP)");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Ukuran file maksimal 5MB");
			return;
		}

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
				setProfileForm((prev) => ({ ...prev, profilePhotoUrl: json.url }));
				toast.success(
					"Foto profil berhasil diunggah. Klik 'Simpan Perubahan' untuk menerapkan.",
				);
			}
		} catch (err) {
			console.error(err);
			toast.error("Gagal mengunggah foto profil");
		} finally {
			setUploadingPhoto(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	// Handle Save Profile
	const handleSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!profileForm.fullName.trim()) {
			toast.error("Nama lengkap wajib diisi.");
			return;
		}
		if (!profileForm.username.trim()) {
			toast.error("Username wajib diisi.");
			return;
		}

		try {
			setIsSavingProfile(true);
			const { data, error } = await api.auth.profile.put({
				fullName: profileForm.fullName.trim(),
				username: profileForm.username.trim(),
				email: profileForm.email.trim() || undefined,
				phone: profileForm.phone.trim() || undefined,
				profilePhotoUrl: profileForm.profilePhotoUrl || undefined,
			});

			if (error) {
				const errMsg =
					(error as any)?.value?.message ||
					(error as any)?.message ||
					"Gagal memperbarui profil";
				toast.error(errMsg);
				return;
			}

			if (data?.success && data?.data) {
				toast.success("Profil berhasil diperbarui!");
				updateUser({
					fullName: data.data.fullName,
					username: data.data.username,
					email: data.data.email || undefined,
					phone: data.data.phone || undefined,
					profilePhotoUrl: data.data.profilePhotoUrl || undefined,
					role: data.data.role,
					roles: data.data.roles,
				});
			}
		} catch (err: any) {
			console.error("Save profile error:", err);
			toast.error(err?.message || "Gagal memperbarui data profil.");
		} finally {
			setIsSavingProfile(false);
		}
	};

	// Handle Change Password
	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!passwordForm.currentPassword) {
			toast.error("Password saat ini wajib diisi.");
			return;
		}
		if (!passwordForm.newPassword) {
			toast.error("Password baru wajib diisi.");
			return;
		}
		if (passwordForm.newPassword.length < 6) {
			toast.error("Password baru minimal 6 karakter.");
			return;
		}
		if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
			toast.error("Konfirmasi password baru tidak cocok.");
			return;
		}

		try {
			setIsSavingPassword(true);
			const { data, error } = await api.auth["change-password"].post({
				currentPassword: passwordForm.currentPassword,
				newPassword: passwordForm.newPassword,
				confirmNewPassword: passwordForm.confirmNewPassword,
			});

			if (error) {
				const errMsg =
					(error as any)?.value?.message ||
					(error as any)?.message ||
					"Gagal memperbarui password";
				toast.error(errMsg);
				return;
			}

			if (data?.success) {
				toast.success("Password berhasil diubah!");
				setPasswordForm({
					currentPassword: "",
					newPassword: "",
					confirmNewPassword: "",
				});
			}
		} catch (err: any) {
			console.error("Change password error:", err);
			toast.error(err?.message || "Gagal memperbarui kata sandi.");
		} finally {
			setIsSavingPassword(false);
		}
	};

	const userRoles = getUserRoles(user);
	const userInitials = (
		profileForm.fullName ||
		user?.fullName ||
		user?.username ||
		"U"
	)
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
				<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
				<p className="text-sm font-medium text-slate-500">
					Memuat profil pengguna...
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-12 max-w-6xl mx-auto">
			{/* Page Header */}
			<div className="flex flex-col gap-1 border-b border-slate-200 pb-5">
				<div className="flex items-center gap-2">
					<div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center font-bold">
						<UserCheck className="w-5 h-5" />
					</div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">
						Profil Saya
					</h1>
				</div>
				<p className="text-xs sm:text-sm text-slate-500">
					Kelola informasi data diri, foto profil, peran akun, dan konfigurasi
					keamanan kata sandi Anda.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				{/* Left Column: Profile Card & Overview */}
				<div className="lg:col-span-4 space-y-6">
					<Card className="border-slate-200/80 shadow-sm overflow-hidden bg-white">
						<div className="h-24 bg-gradient-to-r from-[#0517B0] via-blue-700 to-indigo-700 relative" />
						<CardContent className="pt-0 relative px-6 pb-6 text-center">
							{/* Avatar Container with Upload overlay */}
							<div className="relative -mt-12 mb-4 inline-block group">
								<Avatar className="w-24 h-24 border-4 border-white shadow-md bg-slate-100 ring-2 ring-slate-100">
									<AvatarImage
										src={
											profileForm.profilePhotoUrl
												? `${API_URL}${profileForm.profilePhotoUrl}`
												: ""
										}
										alt={profileForm.fullName}
										className="object-cover"
									/>
									<AvatarFallback className="bg-gradient-to-tr from-[#0517B0] to-blue-600 text-white font-bold text-2xl">
										{userInitials}
									</AvatarFallback>
								</Avatar>

								{/* Quick Change Avatar Button */}
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									disabled={uploadingPhoto}
									className="absolute bottom-0 right-0 p-2 bg-slate-900/85 hover:bg-slate-900 text-white rounded-full shadow-lg transition-transform transform group-hover:scale-105"
									title="Ubah Foto Profil"
								>
									{uploadingPhoto ? (
										<Loader2 className="w-4 h-4 animate-spin text-white" />
									) : (
										<Camera className="w-4 h-4" />
									)}
								</button>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handlePhotoUpload}
									accept="image/*"
									className="hidden"
								/>
							</div>

							<h2 className="text-lg font-bold text-slate-900 leading-tight">
								{profileForm.fullName || "Pengguna"}
							</h2>
							<p className="text-xs font-semibold text-slate-500 mt-0.5">
								@{profileForm.username || "username"}
							</p>

							{/* Role Badges */}
							<div className="flex flex-wrap items-center justify-center gap-1.5 mt-3.5">
								{userRoles.map((r) => {
									const style = ROLE_STYLES[r] || {
										bg: "bg-slate-50",
										text: "text-slate-700",
										border: "border-slate-200",
									};
									return (
										<Badge
											key={r}
											variant="outline"
											className={cn(
												"text-[11px] font-semibold px-2.5 py-0.5 capitalize shadow-none",
												style.bg,
												style.text,
												style.border,
											)}
										>
											{ROLE_LABELS[r] || r}
										</Badge>
									);
								})}
							</div>

							{profileForm.profilePhotoUrl && (
								<div className="mt-4 pt-3 border-t border-slate-100 flex justify-center">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => {
											setProfileForm((prev) => ({
												...prev,
												profilePhotoUrl: "",
											}));
											toast.info(
												"Foto profil dihapus. Klik 'Simpan Perubahan' untuk menerapkan.",
											);
										}}
										className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 gap-1.5 font-medium"
									>
										<Trash2 className="w-3.5 h-3.5" />
										Hapus Foto
									</Button>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Metadata Info Card */}
					<Card className="border-slate-200/80 shadow-sm bg-white">
						<CardHeader className="pb-3 pt-5 px-5">
							<CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
								Detail Informasi Akun
							</CardTitle>
						</CardHeader>
						<CardContent className="px-5 pb-5 space-y-3.5 text-xs">
							<div className="flex items-center justify-between py-1.5 border-b border-slate-100">
								<span className="text-slate-500 flex items-center gap-1.5">
									<Shield className="w-3.5 h-3.5 text-slate-400" />
									ID Akun
								</span>
								<span className="font-mono font-bold text-slate-800">
									#{user?.id ?? "-"}
								</span>
							</div>

							<div className="flex items-center justify-between py-1.5 border-b border-slate-100">
								<span className="text-slate-500 flex items-center gap-1.5">
									<Calendar className="w-3.5 h-3.5 text-slate-400" />
									Terdaftar Sejak
								</span>
								<span className="font-medium text-slate-800">
									{profileForm.createdAt}
								</span>
							</div>

							<div className="flex items-center justify-between py-1.5">
								<span className="text-slate-500 flex items-center gap-1.5">
									<ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
									Status Akun
								</span>
								<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold">
									Aktif
								</Badge>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Column: Settings Tabs (Profile & Password) */}
				<div className="lg:col-span-8">
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-5 h-11">
							<TabsTrigger
								value="info"
								className="text-xs sm:text-sm font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm rounded-lg"
							>
								<User className="w-4 h-4" />
								Data Pribadi
							</TabsTrigger>
							<TabsTrigger
								value="security"
								className="text-xs sm:text-sm font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm rounded-lg"
							>
								<KeyRound className="w-4 h-4" />
								Keamanan & Kata Sandi
							</TabsTrigger>
						</TabsList>

						{/* TAB 1: DATA PRIBADI */}
						<TabsContent
							value="info"
							className="mt-0 focus-visible:outline-none"
						>
							<Card className="border-slate-200/80 shadow-sm bg-white">
								<CardHeader className="border-b border-slate-100 pb-4">
									<CardTitle className="text-base font-bold text-slate-900">
										Edit Informasi Pribadi
									</CardTitle>
									<CardDescription className="text-xs text-slate-500">
										Perbarui nama lengkap, username, email, dan nomor telepon
										kontak Anda.
									</CardDescription>
								</CardHeader>

								<form onSubmit={handleSaveProfile}>
									<CardContent className="space-y-4 pt-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											{/* Full Name */}
											<div className="space-y-1.5">
												<Label className="text-xs font-semibold text-slate-700">
													Nama Lengkap <span className="text-red-500">*</span>
												</Label>
												<div className="relative">
													<User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
													<Input
														value={profileForm.fullName}
														onChange={(e) =>
															setProfileForm((prev) => ({
																...prev,
																fullName: e.target.value,
															}))
														}
														placeholder="Nama Lengkap Anda"
														className="pl-9 h-10 text-xs sm:text-sm bg-slate-50/50 focus:bg-white"
														required
													/>
												</div>
											</div>

											{/* Username */}
											<div className="space-y-1.5">
												<Label className="text-xs font-semibold text-slate-700">
													Username <span className="text-red-500">*</span>
												</Label>
												<div className="relative">
													<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
														@
													</span>
													<Input
														value={profileForm.username}
														onChange={(e) =>
															setProfileForm((prev) => ({
																...prev,
																username: e.target.value
																	.toLowerCase()
																	.replace(/[^a-z0-9_.-]/g, ""),
															}))
														}
														placeholder="username_anda"
														className="pl-8 h-10 text-xs sm:text-sm font-mono bg-slate-50/50 focus:bg-white"
														required
													/>
												</div>
											</div>

											{/* Email */}
											<div className="space-y-1.5">
												<Label className="text-xs font-semibold text-slate-700">
													Alamat Email
												</Label>
												<div className="relative">
													<Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
													<Input
														type="email"
														value={profileForm.email}
														onChange={(e) =>
															setProfileForm((prev) => ({
																...prev,
																email: e.target.value,
															}))
														}
														placeholder="nama@nusadaya.ac.id"
														className="pl-9 h-10 text-xs sm:text-sm bg-slate-50/50 focus:bg-white"
													/>
												</div>
											</div>

											{/* Phone */}
											<div className="space-y-1.5">
												<Label className="text-xs font-semibold text-slate-700">
													Nomor WhatsApp / Telepon
												</Label>
												<div className="relative">
													<Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
													<Input
														type="tel"
														value={profileForm.phone}
														onChange={(e) =>
															setProfileForm((prev) => ({
																...prev,
																phone: e.target.value.replace(/[^0-9+]/g, ""),
															}))
														}
														placeholder="08123456789"
														className="pl-9 h-10 text-xs sm:text-sm bg-slate-50/50 focus:bg-white"
													/>
												</div>
											</div>
										</div>

										{/* Roles Information (Read-only) */}
										<div className="pt-3 border-t border-slate-100">
											<Label className="text-xs font-semibold text-slate-700 mb-2 block">
												Peran & Hak Akses Akun
											</Label>
											<div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
												<div className="flex flex-wrap items-center gap-1.5">
													{userRoles.map((r) => (
														<Badge
															key={r}
															variant="secondary"
															className="text-xs font-semibold bg-white border border-slate-200 text-slate-800 capitalize shadow-none"
														>
															{ROLE_LABELS[r] || r}
														</Badge>
													))}
												</div>
												<span className="text-[11px] text-slate-400 font-medium">
													Dikonfigurasi oleh Super Admin
												</span>
											</div>
										</div>
									</CardContent>

									<CardFooter className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
										<Button
											type="submit"
											disabled={isSavingProfile}
											className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs sm:text-sm gap-2 h-10 px-5 shadow-sm"
										>
											{isSavingProfile ? (
												<>
													<Loader2 className="w-4 h-4 animate-spin" />
													Menyimpan...
												</>
											) : (
												<>
													<Save className="w-4 h-4" />
													Simpan Perubahan
												</>
											)}
										</Button>
									</CardFooter>
								</form>
							</Card>
						</TabsContent>

						{/* TAB 2: KEAMANAN & GANTI PASSWORD */}
						<TabsContent
							value="security"
							className="mt-0 focus-visible:outline-none"
						>
							<Card className="border-slate-200/80 shadow-sm bg-white">
								<CardHeader className="border-b border-slate-100 pb-4">
									<CardTitle className="text-base font-bold text-slate-900">
										Ubah Kata Sandi
									</CardTitle>
									<CardDescription className="text-xs text-slate-500">
										Pastikan kata sandi baru Anda unik, kuat, dan minimal
										terdiri dari 6 karakter.
									</CardDescription>
								</CardHeader>

								<form onSubmit={handleChangePassword}>
									<CardContent className="space-y-4 pt-6 max-w-xl">
										{/* Current Password */}
										<div className="space-y-1.5">
											<Label className="text-xs font-semibold text-slate-700">
												Kata Sandi Saat Ini{" "}
												<span className="text-red-500">*</span>
											</Label>
											<div className="relative">
												<Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
												<Input
													type={showCurrentPassword ? "text" : "password"}
													value={passwordForm.currentPassword}
													onChange={(e) =>
														setPasswordForm((prev) => ({
															...prev,
															currentPassword: e.target.value,
														}))
													}
													placeholder="Masukkan password saat ini"
													className="pl-9 pr-10 h-10 text-xs sm:text-sm bg-slate-50/50 focus:bg-white"
													required
												/>
												<button
													type="button"
													onClick={() =>
														setShowCurrentPassword((prev) => !prev)
													}
													className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
												>
													{showCurrentPassword ? (
														<EyeOff className="w-4 h-4" />
													) : (
														<Eye className="w-4 h-4" />
													)}
												</button>
											</div>
										</div>

										{/* New Password */}
										<div className="space-y-1.5">
											<Label className="text-xs font-semibold text-slate-700">
												Kata Sandi Baru <span className="text-red-500">*</span>
											</Label>
											<div className="relative">
												<KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
												<Input
													type={showNewPassword ? "text" : "password"}
													value={passwordForm.newPassword}
													onChange={(e) =>
														setPasswordForm((prev) => ({
															...prev,
															newPassword: e.target.value,
														}))
													}
													placeholder="Minimal 6 karakter"
													className="pl-9 pr-10 h-10 text-xs sm:text-sm bg-slate-50/50 focus:bg-white"
													required
												/>
												<button
													type="button"
													onClick={() => setShowNewPassword((prev) => !prev)}
													className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
												>
													{showNewPassword ? (
														<EyeOff className="w-4 h-4" />
													) : (
														<Eye className="w-4 h-4" />
													)}
												</button>
											</div>
											{passwordForm.newPassword &&
												passwordForm.newPassword.length < 6 && (
													<p className="text-[11px] text-amber-600 font-medium">
														Password terlalu pendek (minimal 6 karakter)
													</p>
												)}
										</div>

										{/* Confirm New Password */}
										<div className="space-y-1.5">
											<Label className="text-xs font-semibold text-slate-700">
												Konfirmasi Kata Sandi Baru{" "}
												<span className="text-red-500">*</span>
											</Label>
											<div className="relative">
												<KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
												<Input
													type={showConfirmPassword ? "text" : "password"}
													value={passwordForm.confirmNewPassword}
													onChange={(e) =>
														setPasswordForm((prev) => ({
															...prev,
															confirmNewPassword: e.target.value,
														}))
													}
													placeholder="Ketik ulang password baru"
													className="pl-9 pr-10 h-10 text-xs sm:text-sm bg-slate-50/50 focus:bg-white"
													required
												/>
												<button
													type="button"
													onClick={() =>
														setShowConfirmPassword((prev) => !prev)
													}
													className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
												>
													{showConfirmPassword ? (
														<EyeOff className="w-4 h-4" />
													) : (
														<Eye className="w-4 h-4" />
													)}
												</button>
											</div>
											{passwordForm.confirmNewPassword &&
												passwordForm.newPassword !==
													passwordForm.confirmNewPassword && (
													<p className="text-[11px] text-rose-600 font-medium">
														Konfirmasi password tidak cocok
													</p>
												)}
											{passwordForm.confirmNewPassword &&
												passwordForm.newPassword ===
													passwordForm.confirmNewPassword &&
												passwordForm.newPassword.length >= 6 && (
													<p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
														<Check className="w-3.5 h-3.5" />
														Password cocok
													</p>
												)}
										</div>
									</CardContent>

									<CardFooter className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
										<Button
											type="submit"
											disabled={
												isSavingPassword ||
												!passwordForm.currentPassword ||
												!passwordForm.newPassword ||
												passwordForm.newPassword !==
													passwordForm.confirmNewPassword ||
												passwordForm.newPassword.length < 6
											}
											className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs sm:text-sm gap-2 h-10 px-5 shadow-sm"
										>
											{isSavingPassword ? (
												<>
													<Loader2 className="w-4 h-4 animate-spin" />
													Memperbarui...
												</>
											) : (
												<>
													<KeyRound className="w-4 h-4" />
													Perbarui Kata Sandi
												</>
											)}
										</Button>
									</CardFooter>
								</form>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
