"use client";

import { AlertCircle, Lock, Save, Upload, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function MahasiswaProfil() {
	const { user, isAuthenticated, hasHydrated } = useAuthStore();
	const [mounted, setMounted] = useState(false);
	const [student, setStudent] = useState<any>(null);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	// Form states
	const [phone, setPhone] = useState("");
	const [nik, setNik] = useState("");
	const [nisn, setNisn] = useState("");
	const [birthPlace, setBirthPlace] = useState("");
	const [birthDate, setBirthDate] = useState("");
	const [gender, setGender] = useState("");
	const [address, setAddress] = useState("");
	const [schoolOrigin, setSchoolOrigin] = useState("");

	const [parentName, setParentName] = useState("");
	const [parentJob, setParentJob] = useState("");
	const [parentIncome, setParentIncome] = useState("");
	const [parentPhone, setParentPhone] = useState("");

	useEffect(() => {
		setMounted(true);
		if (hasHydrated && isAuthenticated && user?.role === "mahasiswa") {
			fetchData();
		}
	}, [user, hasHydrated, isAuthenticated]);

	const fetchData = async () => {
		try {
			const res = await api.mahasiswa.me.get();
			if (res.data?.success && res.data.data) {
				const data = res.data.data as any;
				setStudent(data);

				// Populate form
				setPhone(data?.phone || "");
				setNik(data?.nik || "");
				setNisn(data?.nisn || "");
				setBirthPlace(data?.birthPlace || "");
				setBirthDate(data?.birthDate ? data.birthDate.split("T")[0] : "");
				setGender(data?.gender || "");
				setAddress(data?.address || "");
				setSchoolOrigin(data?.schoolOrigin || "");

				setParentName(data?.parentName || "");
				setParentJob(data?.parentJob || "");
				setParentIncome(data?.parentIncome || "");
				setParentPhone(data?.parentPhone || "");
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleSave = async () => {
		setIsSubmitting(true);
		try {
			const res = await api.mahasiswa.profil.patch({
				phone,
				nik,
				nisn,
				birthPlace,
				birthDate: birthDate ? new Date(birthDate).toISOString() : undefined,
				gender,
				address,
				schoolOrigin,
				parentName,
				parentJob,
				parentIncome,
				parentPhone,
			});
			if (res.data?.success) {
				toast.success("Profil berhasil diperbarui");
				fetchData();
			} else {
				toast.error(res.data?.message || "Gagal memperbarui profil");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("Format file harus berupa gambar");
			return;
		}
		if (file.size > 2 * 1024 * 1024) {
			toast.error("Ukuran maksimal file foto adalah 2MB");
			return;
		}

		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);

			const token = localStorage.getItem("auth-storage")
				? JSON.parse(localStorage.getItem("auth-storage") as string)?.state
						?.token
				: "";

			const uploadRes = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/mahasiswa/profil/photo`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				},
			);

			const data = await uploadRes.json();

			if (data.success) {
				toast.success("Foto profil berhasil diperbarui");
				fetchData();
			} else {
				toast.error(data.message || "Gagal mengunggah foto");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan saat mengunggah foto");
		} finally {
			setIsUploading(false);
			if (e.target) e.target.value = "";
		}
	};

	if (!mounted) return null;

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<Card className="border-slate-200 shadow-sm overflow-hidden">
				<div className="h-2 w-full bg-[#0517B0]"></div>
				<CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
					<CardTitle className="text-2xl text-slate-800">
						Profil & Biodata Mahasiswa
					</CardTitle>
					<CardDescription className="text-sm mt-1">
						Lengkapi data diri Anda sesuai dengan identitas kependudukan yang
						sah. Beberapa data akademik dikunci dan hanya dapat diubah oleh
						administrator.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-6">
					{/* FOTO PROFIL */}
					<div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-slate-100">
						<Avatar className="h-32 w-32 border-4 border-white shadow-md">
							<AvatarImage
								src={
									student?.profilePhotoUrl
										? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${student.profilePhotoUrl}`
										: ""
								}
							/>
							<AvatarFallback className="bg-blue-50 text-[#0517B0]">
								<User className="h-12 w-12" />
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col items-center sm:items-start gap-2">
							<h3 className="text-lg font-semibold text-slate-800">
								Foto Profil
							</h3>
							<p className="text-sm text-slate-500 text-center sm:text-left mb-2 max-w-sm">
								Gunakan pas foto formal berlatar belakang warna solid
								(merah/biru). Maksimal ukuran file 2MB.
							</p>
							<div className="relative">
								<Button
									disabled={isUploading}
									variant="outline"
									className="border-[#0517B0] text-[#0517B0] hover:bg-blue-50"
								>
									{isUploading ? (
										"Mengunggah..."
									) : (
										<>
											<Upload className="w-4 h-4 mr-2" /> Unggah Foto Baru
										</>
									)}
								</Button>
								<input
									type="file"
									accept="image/*"
									className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
									onChange={handlePhotoUpload}
									disabled={isUploading || !student}
								/>
							</div>
						</div>
					</div>

					{/* DATA READ-ONLY */}
					<div className="mb-10">
						<div className="flex items-center gap-2 mb-4">
							<Lock className="w-4 h-4 text-slate-500" />
							<h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
								Data Akademik (Terkunci)
							</h3>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
							<div>
								<Label className="text-xs text-slate-500 font-semibold mb-1 block">
									Nama Lengkap
								</Label>
								<p className="font-medium text-slate-800 text-sm truncate">
									{student?.name || "-"}
								</p>
							</div>
							<div>
								<Label className="text-xs text-slate-500 font-semibold mb-1 block">
									NIM
								</Label>
								<p className="font-medium text-slate-800 text-sm">
									{student?.nim || "-"}
								</p>
							</div>
							<div>
								<Label className="text-xs text-slate-500 font-semibold mb-1 block">
									Program & Angkatan
								</Label>
								<p className="font-medium text-slate-800 text-sm">
									{student?.program || "-"} ({student?.cohort})
								</p>
							</div>
							<div>
								<Label className="text-xs text-slate-500 font-semibold mb-1 block">
									Dosen PA
								</Label>
								<p className="font-medium text-slate-800 text-sm truncate">
									{student?.pa?.fullName || "Belum Ditentukan"}
								</p>
							</div>
						</div>
					</div>

					{/* DATA EDITABLE: PRIBADI */}
					<div className="mb-10">
						<h3 className="text-sm font-bold text-[#0517B0] uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
							Informasi Pribadi
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
							<div className="space-y-2">
								<Label>Nomor Induk Kependudukan (NIK)</Label>
								<Input
									value={nik}
									onChange={(e) => setNik(e.target.value)}
									placeholder="16 digit NIK KTP"
									maxLength={16}
								/>
							</div>
							<div className="space-y-2">
								<Label>NISN (Nomor Induk Siswa Nasional)</Label>
								<Input
									value={nisn}
									onChange={(e) => setNisn(e.target.value)}
									placeholder="NISN Anda"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Tempat Lahir</Label>
									<Input
										value={birthPlace}
										onChange={(e) => setBirthPlace(e.target.value)}
										placeholder="Kota kelahiran"
									/>
								</div>
								<div className="space-y-2">
									<Label>Tanggal Lahir</Label>
									<Input
										type="date"
										value={birthDate}
										onChange={(e) => setBirthDate(e.target.value)}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label>Jenis Kelamin</Label>
								<Select
									value={gender}
									onValueChange={(val) => setGender(val || "")}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Jenis Kelamin" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Laki-laki">Laki-laki</SelectItem>
										<SelectItem value="Perempuan">Perempuan</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Nomor Telepon / WhatsApp Aktif</Label>
								<Input
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									placeholder="Contoh: 081234567890"
								/>
							</div>
							<div className="space-y-2">
								<Label>Asal Sekolah (SMA/SMK/Sederajat)</Label>
								<Input
									value={schoolOrigin}
									onChange={(e) => setSchoolOrigin(e.target.value)}
									placeholder="Nama sekolah asal"
								/>
							</div>
							<div className="md:col-span-2 space-y-2">
								<Label>Alamat Lengkap Sesuai KTP</Label>
								<Textarea
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									placeholder="Jalan, RT/RW, Desa/Kelurahan, Kecamatan, Kota/Kabupaten, Provinsi, Kode Pos"
									className="resize-none h-20"
								/>
							</div>
						</div>
					</div>

					{/* DATA EDITABLE: ORANG TUA */}
					<div className="mb-8">
						<h3 className="text-sm font-bold text-[#0517B0] uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
							Informasi Orang Tua / Wali
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
							<div className="space-y-2">
								<Label>Nama Orang Tua / Wali</Label>
								<Input
									value={parentName}
									onChange={(e) => setParentName(e.target.value)}
									placeholder="Nama lengkap orang tua"
								/>
							</div>
							<div className="space-y-2">
								<Label>Nomor Telepon Orang Tua</Label>
								<Input
									value={parentPhone}
									onChange={(e) => setParentPhone(e.target.value)}
									placeholder="Nomor kontak orang tua darurat"
								/>
							</div>
							<div className="space-y-2">
								<Label>Pekerjaan Orang Tua</Label>
								<Input
									value={parentJob}
									onChange={(e) => setParentJob(e.target.value)}
									placeholder="Pekerjaan saat ini"
								/>
							</div>
							<div className="space-y-2">
								<Label>Estimasi Penghasilan per Bulan</Label>
								<Select
									value={parentIncome}
									onValueChange={(val) => setParentIncome(val || "")}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Kisaran Penghasilan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="< Rp 1.000.000">
											Kurang dari Rp 1.000.000
										</SelectItem>
										<SelectItem value="Rp 1.000.000 - Rp 3.000.000">
											Rp 1.000.000 - Rp 3.000.000
										</SelectItem>
										<SelectItem value="Rp 3.000.000 - Rp 5.000.000">
											Rp 3.000.000 - Rp 5.000.000
										</SelectItem>
										<SelectItem value="Rp 5.000.000 - Rp 10.000.000">
											Rp 5.000.000 - Rp 10.000.000
										</SelectItem>
										<SelectItem value="> Rp 10.000.000">
											Lebih dari Rp 10.000.000
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg">
						<div className="flex items-center gap-3">
							<AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
							<p className="text-sm text-blue-800">
								Pastikan semua data terisi dengan benar. Data ini akan digunakan
								untuk keperluan pemberkasan.
							</p>
						</div>
						<Button
							onClick={handleSave}
							disabled={isSubmitting}
							className="bg-[#0517B0] hover:bg-[#04128A] text-white whitespace-nowrap ml-4"
						>
							{isSubmitting ? (
								"Menyimpan..."
							) : (
								<>
									<Save className="w-4 h-4 mr-2" /> Simpan Data
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
