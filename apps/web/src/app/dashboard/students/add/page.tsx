"use client";

import { ArrowLeft, Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function AddStudentPage() {
	const router = useRouter();
	const { user } = useAuthStore();
	const [isLoading, setIsLoading] = useState(false);
	const [paUsers, setPaUsers] = useState<any[]>([]);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [formData, setFormData] = useState({
		nim: "",
		name: "",
		cohort: new Date().getFullYear().toString(),
		program: "",
		phone: "",
		parentName: "",
		paId: "",
		studentStatus: "aktif",
		destinationCountry: "",
		period: "",
		profilePhoto: null as File | null,
	});

	// Restrict to superadmin & pmb
	useEffect(() => {
		if (user && user.role !== "superadmin" && user.role !== "pmb") {
			toast.error("Anda tidak memiliki akses ke halaman ini.");
			router.push("/dashboard");
		}
	}, [user, router]);

	useEffect(() => {
		const fetchPAs = async () => {
			const { data, error } = await api.users.get({
				$query: { role: "pa" },
			});
			if (!error && data?.data) {
				setPaUsers(data.data);
			}
		};
		fetchPAs();
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 2 * 1024 * 1024) {
				toast.error("Ukuran file maksimal 2MB");
				return;
			}
			setFormData({ ...formData, profilePhoto: file });
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!formData.nim ||
			!formData.name ||
			!formData.cohort ||
			!formData.program
		) {
			toast.error("Mohon lengkapi field wajib (NIM, Nama, Angkatan, Program)");
			return;
		}

		setIsLoading(true);
		try {
			const { data: resData, error } = await api.students.post({
				nim: formData.nim,
				name: formData.name,
				cohort: parseInt(formData.cohort, 10),
				program: formData.program,
				phone: formData.phone || undefined,
				parentName: formData.parentName || undefined,
				paId: formData.paId ? parseInt(formData.paId, 10) : undefined,
				studentStatus: formData.studentStatus || "aktif",
				destinationCountry: formData.destinationCountry || undefined,
				period: formData.period || undefined,
			});

			if (error || !resData?.success || !resData.data) {
				toast.error(
					resData?.message ||
						error?.value?.message ||
						"Gagal menambahkan mahasiswa",
				);
				setIsLoading(false);
				return;
			}

			const newStudentId = resData.data.id;

			if (formData.profilePhoto) {
				const token = useAuthStore.getState().token;
				const API_URL =
					process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

				const uploadFormData = new FormData();
				uploadFormData.append("file", formData.profilePhoto);

				const uploadRes = await fetch(
					`${API_URL}/students/${newStudentId}/profile-photo`,
					{
						method: "POST",
						headers: {
							Authorization: `Bearer ${token}`,
						},
						body: uploadFormData,
					},
				);

				if (!uploadRes.ok) {
					toast.error(
						"Mahasiswa berhasil dibuat, tapi gagal mengupload foto profil.",
					);
				}
			}

			toast.success("Mahasiswa berhasil ditambahkan!");

			// Redirect back based on role
			if (user?.role === "superadmin") {
				router.push("/dashboard/students");
			} else {
				router.push("/dashboard");
			}
		} catch (err: any) {
			console.error(err);
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="pb-20">
			{/* Top Actions */}
			<div className="flex justify-between items-center mb-6">
				<Link
					href={
						user?.role === "superadmin" ? "/dashboard/students" : "/dashboard"
					}
					className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
				>
					<ArrowLeft className="w-4 h-4" />
					Kembali
				</Link>
			</div>

			<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-5xl mx-auto">
				<div className="mb-6 border-b border-slate-100 pb-4">
					<h1 className="text-2xl font-bold text-[#0517B0]">
						Tambah Mahasiswa Baru
					</h1>
					<p className="text-slate-500 text-sm mt-1">
						Lengkapi form pendaftaran berikut dengan data yang valid.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-8">
					{/* Foto Profil */}
					<div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-xl border border-slate-100">
						<button
							type="button"
							className="w-28 h-28 rounded-full border-[3px] border-dashed border-slate-300 flex items-center justify-center bg-white cursor-pointer overflow-hidden group hover:border-[#0517B0] transition-colors relative shadow-sm"
							onClick={() => fileInputRef.current?.click()}
						>
							{previewUrl ? (
								<img
									src={previewUrl}
									alt="Preview"
									className="w-full h-full object-cover"
								/>
							) : (
								<UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-[#0517B0] transition-colors" />
							)}
							<div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
								<span className="text-white text-sm font-medium">
									Ubah Foto
								</span>
							</div>
						</button>
						<div className="text-center mt-4">
							<p className="text-sm font-semibold text-slate-800">
								Foto Profil
							</p>
							<p className="text-xs text-slate-500 mt-1">
								Format: JPG/PNG, Maks. 2MB (Opsional)
							</p>
						</div>
						<input
							type="file"
							ref={fileInputRef}
							className="hidden"
							accept="image/*"
							onChange={handleFileChange}
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Kolom Kiri: Identitas Utama */}
						<div className="space-y-5">
							<h3 className="font-semibold text-[#0517B0] border-b border-slate-100 pb-3 mb-2 flex items-center gap-2">
								<span className="w-6 h-6 rounded bg-[#0517B0]/10 flex items-center justify-center text-sm">
									1
								</span>
								Identitas Dasar
							</h3>

							<div className="space-y-2">
								<Label htmlFor="nim" className="text-slate-700">
									NPM / NIM <span className="text-red-500">*</span>
								</Label>
								<Input
									id="nim"
									required
									placeholder="Contoh: 12345678"
									value={formData.nim}
									onChange={(e) =>
										setFormData({ ...formData, nim: e.target.value })
									}
									className="h-10 bg-slate-50 focus-visible:bg-white"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="name" className="text-slate-700">
									Nama Lengkap <span className="text-red-500">*</span>
								</Label>
								<Input
									id="name"
									required
									placeholder="Nama Sesuai KTP"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									className="h-10 bg-slate-50 focus-visible:bg-white"
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="cohort" className="text-slate-700">
										Angkatan <span className="text-red-500">*</span>
									</Label>
									<Input
										id="cohort"
										type="number"
										required
										placeholder="2024"
										value={formData.cohort}
										onChange={(e) =>
											setFormData({ ...formData, cohort: e.target.value })
										}
										className="h-10 bg-slate-50 focus-visible:bg-white"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="program" className="text-slate-700">
										Program <span className="text-red-500">*</span>
									</Label>
									<Select
										required
										value={formData.program}
										onValueChange={(val) =>
											setFormData({ ...formData, program: val || "" })
										}
									>
										<SelectTrigger className="h-10 w-full bg-slate-50 focus:bg-white">
											<SelectValue placeholder="Pilih Program" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Hospitality">Hospitality</SelectItem>
											<SelectItem value="Culinary">Culinary</SelectItem>
											<SelectItem value="Cruise Line">Cruise Line</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="studentStatus" className="text-slate-700">
									Status Mahasiswa
								</Label>
								<Select
									value={formData.studentStatus}
									onValueChange={(val) =>
										setFormData({ ...formData, studentStatus: val || "" })
									}
								>
									<SelectTrigger className="h-10 bg-slate-50 focus:bg-white">
										<SelectValue placeholder="Pilih Status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="aktif">Aktif</SelectItem>
										<SelectItem value="cuti">Cuti</SelectItem>
										<SelectItem value="alumni">Alumni</SelectItem>
										<SelectItem value="keluar">Keluar</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Kolom Kanan: Informasi Tambahan */}
						<div className="space-y-5">
							<h3 className="font-semibold text-[#0517B0] border-b border-slate-100 pb-3 mb-2 flex items-center gap-2">
								<span className="w-6 h-6 rounded bg-[#0517B0]/10 flex items-center justify-center text-sm">
									2
								</span>
								Informasi Kontak & Program
							</h3>

							<div className="space-y-2">
								<Label htmlFor="phone" className="text-slate-700">
									Nomor WhatsApp
								</Label>
								<Input
									id="phone"
									type="tel"
									placeholder="Contoh: 08123456789"
									value={formData.phone}
									onChange={(e) =>
										setFormData({ ...formData, phone: e.target.value })
									}
									className="h-10 bg-slate-50 focus-visible:bg-white"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="parentName" className="text-slate-700">
									Nama Orang Tua
								</Label>
								<Input
									id="parentName"
									placeholder="Nama Ayah / Ibu"
									value={formData.parentName}
									onChange={(e) =>
										setFormData({ ...formData, parentName: e.target.value })
									}
									className="h-10 bg-slate-50 focus-visible:bg-white"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="paId" className="text-slate-700">
									Pendamping Akademik (PA)
								</Label>
								<Select
									value={formData.paId}
									onValueChange={(val) =>
										setFormData({ ...formData, paId: val || "" })
									}
								>
									<SelectTrigger className="h-10 w-full bg-slate-50 focus:bg-white">
										<SelectValue placeholder="Pilih Pendamping" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="unassigned">Belum Ditentukan</SelectItem>
										{paUsers.map((pa) => (
											<SelectItem key={pa.id} value={pa.id.toString()}>
												{pa.fullName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label
										htmlFor="destinationCountry"
										className="text-slate-700"
									>
										Negara Tujuan
									</Label>
									<Input
										id="destinationCountry"
										placeholder="Misal: Jepang"
										value={formData.destinationCountry}
										onChange={(e) =>
											setFormData({
												...formData,
												destinationCountry: e.target.value,
											})
										}
										className="h-10 bg-slate-50 focus-visible:bg-white"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="period" className="text-slate-700">
										Periode
									</Label>
									<Input
										id="period"
										placeholder="Misal: 2024/2025"
										value={formData.period}
										onChange={(e) =>
											setFormData({ ...formData, period: e.target.value })
										}
										className="h-10 bg-slate-50 focus-visible:bg-white"
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="pt-6 mt-6 border-t border-slate-200 flex justify-end gap-4">
						<Link
							href={
								user?.role === "superadmin"
									? "/dashboard/students"
									: "/dashboard"
							}
						>
							<Button
								type="button"
								variant="outline"
								disabled={isLoading}
								className="min-w-[120px]"
							>
								Batal
							</Button>
						</Link>
						<Button
							type="submit"
							className="bg-[#0517B0] hover:bg-blue-800 text-white min-w-[140px]"
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								"Simpan Data"
							)}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
