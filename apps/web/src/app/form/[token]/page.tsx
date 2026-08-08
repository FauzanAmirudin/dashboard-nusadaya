"use client";

import { ArrowLeft, CheckCircle2, UploadCloud } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const TABS = [
	"Keterangan Mahasiswa",
	"Keterangan Pendidikan",
	"Keterangan Kesehatan",
	"Keterangan Ayah Kandung",
	"Keterangan Ibu Kandung",
	"Keterangan Wali",
];

export default function FormMahasiswaPublic() {
	const params = useParams();
	const token = params.token as string;
	const [isValidating, setIsValidating] = useState(true);
	const [isValidToken, setIsValidToken] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const [isLoading, setIsLoading] = useState(false);
	const [currentTab, setCurrentTab] = useState(0);

	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [formData, setFormData] = useState({
		name: "",
		nickname: "",
		gender: "",
		birthPlace: "",
		birthDate: "",
		religion: "",
		nationality: "Indonesia",
		nationalityOther: "",
		addressStreet: "",
		addressRt: "",
		addressRw: "",
		addressNo: "",
		addressVillage: "",
		addressDistrict: "",
		addressCity: "",
		addressProvince: "",
		livingWith: "",
		phone: "",
		email: "",
		profilePhotoUrl: "",

		schoolOrigin: "",
		schoolAddress: "",
		schoolMajor: "",
		graduationYear: "",
		program: "",
		subProgram: "",
		classType: "",
		batch: "",
		academicYear: "",

		bloodType: "",
		diseaseHistory: "",
		congenitalDisease: "",
		height: "",
		weight: "",
		clothingSize: "",
		clothingSizeOther: "",

		ayahName: "",
		ayahBirthPlace: "",
		ayahBirthDate: "",
		ayahReligion: "",
		ayahNationality: "Indonesia",
		ayahNationalityOther: "",
		ayahEducation: "",
		ayahJob: "",
		ayahAddress: "",
		ayahPhone: "",
		ayahEmail: "",
		ayahStatus: "Hidup",

		ibuName: "",
		ibuBirthPlace: "",
		ibuBirthDate: "",
		ibuReligion: "",
		ibuNationality: "Indonesia",
		ibuNationalityOther: "",
		ibuEducation: "",
		ibuJob: "",
		ibuAddress: "",
		ibuPhone: "",
		ibuEmail: "",
		ibuStatus: "Hidup",

		waliName: "",
		waliBirthPlace: "",
		waliBirthDate: "",
		waliReligion: "",
		waliNationality: "Indonesia",
		waliNationalityOther: "",
		waliEducation: "",
		waliJob: "",
		waliAddress: "",
		waliPhone: "",
		waliEmail: "",
		waliGuardianRelation: "",
	});

	const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

	// Validasi Token
	useEffect(() => {
		const validate = async () => {
			try {
				const res = await fetch(`${API_URL}/form/${token}`);
				const data = await res.json();
				if (data.valid) {
					setIsValidToken(true);
				}
			} catch (e) {
				console.error(e);
			} finally {
				setIsValidating(false);
			}
		};
		if (token) validate();
	}, [token]);

	const updateData = (key: keyof typeof formData, value: any) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 2 * 1024 * 1024) {
				toast.error("Ukuran file maksimal 2MB");
				return;
			}
			setProfilePhoto(file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	const validateTab = (index: number) => {
		if (index === 0) {
			if (!formData.name) return "Nama Lengkap wajib diisi.";
			if (!formData.birthPlace || !formData.birthDate)
				return "Tempat dan Tanggal Lahir wajib diisi.";
			if (!formData.phone) return "No HP/WhatsApp wajib diisi.";
		}
		return null;
	};

	const handleNext = () => {
		const error = validateTab(currentTab);
		if (error) {
			toast.error(error);
			return;
		}
		if (currentTab < TABS.length - 1) {
			setCurrentTab(currentTab + 1);
			window.scrollTo(0, 0);
		}
	};

	const handlePrev = () => {
		if (currentTab > 0) {
			setCurrentTab(currentTab - 1);
			window.scrollTo(0, 0);
		}
	};

	const uploadPhoto = async () => {
		if (!profilePhoto) return null;
		const fd = new FormData();
		fd.append("file", profilePhoto);
		const uploadRes = await fetch(`${API_URL}/students/upload-photo`, {
			method: "POST",
			body: fd,
		});
		if (uploadRes.ok) {
			const uploadData = await uploadRes.json();
			if (uploadData.success && uploadData.data?.url) {
				return uploadData.data.url;
			}
		}
		return null;
	};

	const handleSubmit = async () => {
		const error = validateTab(currentTab);
		if (error) {
			toast.error(error);
			return;
		}

		setIsLoading(true);
		toast.loading("Mengirim formulir...");

		try {
			// Upload foto jika ada
			let photoUrl = "";
			if (profilePhoto) {
				photoUrl = (await uploadPhoto()) || "";
			}

			const payload = { ...formData, profilePhotoUrl: photoUrl };

			const res = await fetch(`${API_URL}/form/${token}/submit`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await res.json();
			if (data.success) {
				toast.dismiss();
				toast.success("Formulir berhasil dikirim!");
				setIsSubmitted(true);
			} else {
				throw new Error(data.message || "Gagal mengirim formulir");
			}
		} catch (error: any) {
			toast.dismiss();
			toast.error(error.message || "Terjadi kesalahan pada sistem.");
		} finally {
			setIsLoading(false);
		}
	};

	if (isValidating) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0517B0]" />
			</div>
		);
	}

	if (!isValidToken && !isSubmitted) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
				<div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full text-center">
					<div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
						<CheckCircle2 className="w-8 h-8" />
					</div>
					<h1 className="text-xl font-bold text-slate-800 mb-2">
						Tautan Tidak Berlaku
					</h1>
					<p className="text-slate-500">
						Tautan formulir ini sudah tidak berlaku atau telah digunakan
						sebelumnya. Silakan hubungi admin PMB Nusadaya Academy untuk
						mendapatkan tautan baru.
					</p>
				</div>
			</div>
		);
	}

	if (isSubmitted) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
				<div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full text-center">
					<div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
						<CheckCircle2 className="w-8 h-8" />
					</div>
					<h1 className="text-xl font-bold text-slate-800 mb-2">
						Pendaftaran Berhasil!
					</h1>
					<p className="text-slate-500 mb-6">
						Terima kasih telah mengisi formulir pendaftaran Nusadaya Academy.
						Tim PMB kami akan segera menghubungi Anda.
					</p>
					<Button
						onClick={() =>
							(window.location.href = "https://nusadayaacademy.com")
						}
						className="w-full bg-[#0517B0] hover:bg-blue-800"
					>
						Kembali ke Beranda
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
			{/* Header */}
			<div className="bg-white border-b border-slate-200 sticky top-0 z-50">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-lg bg-[#0517B0] flex items-center justify-center">
							<span className="font-bold text-white text-sm">N</span>
						</div>
						<span className="font-bold text-lg tracking-tight">
							Nusadaya<span className="font-light text-[#0517B0]">Academy</span>
						</span>
					</div>
					<div className="text-sm text-slate-500 font-medium">Formulir PMB</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
					<div className="mb-8">
						<h1 className="text-2xl font-bold text-slate-800">
							Formulir Pendaftaran
						</h1>
						<p className="text-slate-500 mt-1">
							Silakan lengkapi data diri Anda pada setiap bagian di bawah ini.
						</p>
					</div>

					{/* Stepper */}
					<div className="flex overflow-x-auto gap-2 pb-4 mb-6 scrollbar-hide">
						{TABS.map((tab, idx) => (
							<button
								key={tab}
								type="button"
								onClick={() => {
									if (idx < currentTab || validateTab(currentTab) === null) {
										setCurrentTab(idx);
									} else {
										toast.error(validateTab(currentTab));
									}
								}}
								className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
									currentTab === idx
										? "bg-[#0517B0] text-white"
										: currentTab > idx
											? "bg-blue-50 text-[#0517B0]"
											: "bg-slate-100 text-slate-500"
								}`}
							>
								{idx + 1}. {tab}
							</button>
						))}
					</div>

					<div className="space-y-6">
						{currentTab === 0 && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
								{/* Foto Profil */}
								<div className="col-span-full">
									<Label className="block mb-2 text-sm font-semibold text-slate-800">
										Foto Profil
									</Label>
									<div className="flex items-center gap-6">
										<div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
											{previewUrl ? (
												<img
													src={previewUrl}
													alt="Preview"
													className="w-full h-full object-cover"
												/>
											) : (
												<UploadCloud className="w-8 h-8 text-slate-400" />
											)}
										</div>
										<div className="flex-1">
											<input
												type="file"
												accept="image/*"
												className="hidden"
												ref={fileInputRef}
												onChange={handleFileChange}
											/>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => fileInputRef.current?.click()}
												className="mb-2"
											>
												Pilih Foto
											</Button>
											<p className="text-xs text-slate-500">
												Format: JPG, PNG. Maksimal 2MB. Pas foto formal latar
												belakang bebas.
											</p>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Nama Lengkap <span className="text-rose-500">*</span>
									</Label>
									<Input
										value={formData.name}
										onChange={(e) => updateData("name", e.target.value)}
										placeholder="Sesuai ijazah"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Nama Panggilan
									</Label>
									<Input
										value={formData.nickname}
										onChange={(e) => updateData("nickname", e.target.value)}
										placeholder="Panggilan akrab"
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Tempat Lahir <span className="text-rose-500">*</span>
									</Label>
									<Input
										value={formData.birthPlace}
										onChange={(e) => updateData("birthPlace", e.target.value)}
										placeholder="Contoh: Jakarta"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Tanggal Lahir <span className="text-rose-500">*</span>
									</Label>
									<Input
										type="date"
										value={formData.birthDate}
										onChange={(e) => updateData("birthDate", e.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Jenis Kelamin
									</Label>
									<Select
										value={formData.gender}
										onValueChange={(val) => updateData("gender", val)}
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
									<Label className="text-sm font-semibold text-slate-800">
										Agama
									</Label>
									<Select
										value={formData.religion}
										onValueChange={(val) => updateData("religion", val)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pilih Agama" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Islam">Islam</SelectItem>
											<SelectItem value="Kristen Protestan">
												Kristen Protestan
											</SelectItem>
											<SelectItem value="Katolik">Katolik</SelectItem>
											<SelectItem value="Hindu">Hindu</SelectItem>
											<SelectItem value="Buddha">Buddha</SelectItem>
											<SelectItem value="Konghucu">Konghucu</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										No HP / WhatsApp <span className="text-rose-500">*</span>
									</Label>
									<Input
										value={formData.phone}
										onChange={(e) => updateData("phone", e.target.value)}
										placeholder="08xxxxxxxxxx"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Email
									</Label>
									<Input
										type="email"
										value={formData.email}
										onChange={(e) => updateData("email", e.target.value)}
										placeholder="email@contoh.com"
									/>
								</div>
								<div className="col-span-full border-t border-slate-200 pt-6 mt-2">
									<h3 className="font-bold text-slate-800 mb-4">
										Alamat Tinggal Lengkap
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2 col-span-full">
											<Label className="text-sm font-semibold text-slate-800">
												Nama Jalan / Perumahan / Banjar
											</Label>
											<Input
												value={formData.addressStreet}
												onChange={(e) =>
													updateData("addressStreet", e.target.value)
												}
												placeholder="Contoh: Jl. Merdeka Raya Kav 10"
											/>
										</div>
										<div className="space-y-2">
											<Label className="text-sm font-semibold text-slate-800">
												No Rumah
											</Label>
											<Input
												value={formData.addressNo}
												onChange={(e) =>
													updateData("addressNo", e.target.value)
												}
												placeholder="Contoh: 45A"
											/>
										</div>
										<div className="flex gap-4">
											<div className="space-y-2 w-1/2">
												<Label className="text-sm font-semibold text-slate-800">
													RT
												</Label>
												<Input
													value={formData.addressRt}
													onChange={(e) =>
														updateData("addressRt", e.target.value)
													}
													placeholder="001"
												/>
											</div>
											<div className="space-y-2 w-1/2">
												<Label className="text-sm font-semibold text-slate-800">
													RW
												</Label>
												<Input
													value={formData.addressRw}
													onChange={(e) =>
														updateData("addressRw", e.target.value)
													}
													placeholder="002"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label className="text-sm font-semibold text-slate-800">
												Kelurahan / Desa
											</Label>
											<Input
												value={formData.addressVillage}
												onChange={(e) =>
													updateData("addressVillage", e.target.value)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label className="text-sm font-semibold text-slate-800">
												Kecamatan
											</Label>
											<Input
												value={formData.addressDistrict}
												onChange={(e) =>
													updateData("addressDistrict", e.target.value)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label className="text-sm font-semibold text-slate-800">
												Kabupaten / Kota
											</Label>
											<Input
												value={formData.addressCity}
												onChange={(e) =>
													updateData("addressCity", e.target.value)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label className="text-sm font-semibold text-slate-800">
												Provinsi
											</Label>
											<Input
												value={formData.addressProvince}
												onChange={(e) =>
													updateData("addressProvince", e.target.value)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label className="text-sm font-semibold text-slate-800">
												Tinggal Bersama
											</Label>
											<Select
												value={formData.livingWith}
												onValueChange={(val) => updateData("livingWith", val)}
											>
												<SelectTrigger>
													<SelectValue placeholder="Pilih..." />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="Orang Tua">Orang Tua</SelectItem>
													<SelectItem value="Wali / Keluarga">
														Wali / Keluarga
													</SelectItem>
													<SelectItem value="Sendiri (Kos/Asrama)">
														Sendiri (Kos/Asrama)
													</SelectItem>
													<SelectItem value="Lainnya">Lainnya</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>
							</div>
						)}

						{currentTab === 1 && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Asal Sekolah
									</Label>
									<Input
										value={formData.schoolOrigin}
										onChange={(e) => updateData("schoolOrigin", e.target.value)}
										placeholder="Contoh: SMA Negeri 1 Denpasar"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Alamat Sekolah
									</Label>
									<Input
										value={formData.schoolAddress}
										onChange={(e) =>
											updateData("schoolAddress", e.target.value)
										}
										placeholder="Kota/Kabupaten asal sekolah"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Jurusan Asal Sekolah
									</Label>
									<Input
										value={formData.schoolMajor}
										onChange={(e) => updateData("schoolMajor", e.target.value)}
										placeholder="Contoh: IPA / IPS / Tata Boga"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Tahun Lulus Sekolah
									</Label>
									<Input
										type="number"
										value={formData.graduationYear}
										onChange={(e) =>
											updateData("graduationYear", e.target.value)
										}
										placeholder="Contoh: 2024"
									/>
								</div>

								<div className="col-span-full border-t border-slate-200 pt-6 mt-2">
									<h3 className="font-bold text-slate-800 mb-4">
										Pilihan Program Studi
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label className="text-sm font-semibold text-slate-800">
												Program Pilihan
											</Label>
											<Select
												value={formData.program}
												onValueChange={(val) => updateData("program", val)}
											>
												<SelectTrigger>
													<SelectValue placeholder="Pilih Program" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="Reguler">
														Program Reguler
													</SelectItem>
													<SelectItem value="Bekerja">
														Program Sambil Bekerja
													</SelectItem>
													<SelectItem value="Khusus">Program Khusus</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label className="text-sm font-semibold text-slate-800">
												Tujuan (Jika ada)
											</Label>
											<Select
												value={formData.subProgram}
												onValueChange={(val) => updateData("subProgram", val)}
											>
												<SelectTrigger>
													<SelectValue placeholder="Pilih Peminatan..." />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="Kapal Pesiar & Hotel International">
														Kapal Pesiar & Hotel International
													</SelectItem>
													<SelectItem value="Hotel Timur Tengah">
														Hotel Timur Tengah
													</SelectItem>
													<SelectItem value="Hotel / Darat Malaysia">
														Hotel / Darat Malaysia
													</SelectItem>
													<SelectItem value="College Taiwan">
														College Taiwan
													</SelectItem>
													<SelectItem value="Hotel Indonesia">
														Hotel Indonesia
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>
							</div>
						)}

						{currentTab === 2 && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Golongan Darah
									</Label>
									<Select
										value={formData.bloodType}
										onValueChange={(val) => updateData("bloodType", val)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pilih..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="A">A</SelectItem>
											<SelectItem value="B">B</SelectItem>
											<SelectItem value="AB">AB</SelectItem>
											<SelectItem value="O">O</SelectItem>
											<SelectItem value="Tidak Tahu">Tidak Tahu</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Riwayat Penyakit (Jika ada)
									</Label>
									<Input
										value={formData.diseaseHistory}
										onChange={(e) =>
											updateData("diseaseHistory", e.target.value)
										}
										placeholder="Kosongkan jika tidak ada"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Penyakit Bawaan (Jika ada)
									</Label>
									<Input
										value={formData.congenitalDisease}
										onChange={(e) =>
											updateData("congenitalDisease", e.target.value)
										}
										placeholder="Kosongkan jika tidak ada"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Ukuran Baju
									</Label>
									<Select
										value={formData.clothingSize}
										onValueChange={(val) => updateData("clothingSize", val)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pilih Ukuran" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="S">S</SelectItem>
											<SelectItem value="M">M</SelectItem>
											<SelectItem value="L">L</SelectItem>
											<SelectItem value="XL">XL</SelectItem>
											<SelectItem value="XXL">XXL</SelectItem>
											<SelectItem value="Lainnya">Lainnya...</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Tinggi Badan (cm)
									</Label>
									<Input
										type="number"
										value={formData.height}
										onChange={(e) => updateData("height", e.target.value)}
										placeholder="Contoh: 165"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Berat Badan (kg)
									</Label>
									<Input
										type="number"
										value={formData.weight}
										onChange={(e) => updateData("weight", e.target.value)}
										placeholder="Contoh: 55"
									/>
								</div>
							</div>
						)}

						{currentTab === 3 && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
								<div className="space-y-2 col-span-full md:col-span-1">
									<Label className="text-sm font-semibold text-slate-800">
										Nama Ayah
									</Label>
									<Input
										value={formData.ayahName}
										onChange={(e) => updateData("ayahName", e.target.value)}
										placeholder="Nama lengkap ayah"
									/>
								</div>
								<div className="space-y-2 col-span-full md:col-span-1">
									<Label className="text-sm font-semibold text-slate-800">
										Status
									</Label>
									<Select
										value={formData.ayahStatus}
										onValueChange={(val) => updateData("ayahStatus", val)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pilih Status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Hidup">Masih Hidup</SelectItem>
											<SelectItem value="Meninggal">Meninggal Dunia</SelectItem>
											<SelectItem value="Tidak Tahu">
												Tidak Diketahui
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Pekerjaan
									</Label>
									<Input
										value={formData.ayahJob}
										onChange={(e) => updateData("ayahJob", e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Pendidikan Terakhir
									</Label>
									<Select
										value={formData.ayahEducation}
										onValueChange={(val) => updateData("ayahEducation", val)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pilih..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="SD">SD / Sederajat</SelectItem>
											<SelectItem value="SMP">SMP / Sederajat</SelectItem>
											<SelectItem value="SMA">SMA / SMK / Sederajat</SelectItem>
											<SelectItem value="D3">Diploma 3 (D3)</SelectItem>
											<SelectItem value="S1">Sarjana (S1/D4)</SelectItem>
											<SelectItem value="S2">Magister (S2)</SelectItem>
											<SelectItem value="Lainnya">Lainnya</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										No HP / WhatsApp
									</Label>
									<Input
										value={formData.ayahPhone}
										onChange={(e) => updateData("ayahPhone", e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Tempat Lahir
									</Label>
									<Input
										value={formData.ayahBirthPlace}
										onChange={(e) =>
											updateData("ayahBirthPlace", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Tanggal Lahir
									</Label>
									<Input
										type="date"
										value={formData.ayahBirthDate}
										onChange={(e) =>
											updateData("ayahBirthDate", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2 col-span-full">
									<Label className="text-sm font-semibold text-slate-800">
										Alamat Tinggal
									</Label>
									<Textarea
										value={formData.ayahAddress}
										onChange={(e) => updateData("ayahAddress", e.target.value)}
										placeholder="Alamat lengkap ayah..."
										className="resize-none"
									/>
								</div>
							</div>
						)}

						{currentTab === 4 && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
								<div className="space-y-2 col-span-full md:col-span-1">
									<Label className="text-sm font-semibold text-slate-800">
										Nama Ibu
									</Label>
									<Input
										value={formData.ibuName}
										onChange={(e) => updateData("ibuName", e.target.value)}
										placeholder="Nama lengkap ibu"
									/>
								</div>
								<div className="space-y-2 col-span-full md:col-span-1">
									<Label className="text-sm font-semibold text-slate-800">
										Status
									</Label>
									<Select
										value={formData.ibuStatus}
										onValueChange={(val) => updateData("ibuStatus", val)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pilih Status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Hidup">Masih Hidup</SelectItem>
											<SelectItem value="Meninggal">Meninggal Dunia</SelectItem>
											<SelectItem value="Tidak Tahu">
												Tidak Diketahui
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Pekerjaan
									</Label>
									<Input
										value={formData.ibuJob}
										onChange={(e) => updateData("ibuJob", e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Pendidikan Terakhir
									</Label>
									<Select
										value={formData.ibuEducation}
										onValueChange={(val) => updateData("ibuEducation", val)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pilih..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="SD">SD / Sederajat</SelectItem>
											<SelectItem value="SMP">SMP / Sederajat</SelectItem>
											<SelectItem value="SMA">SMA / SMK / Sederajat</SelectItem>
											<SelectItem value="D3">Diploma 3 (D3)</SelectItem>
											<SelectItem value="S1">Sarjana (S1/D4)</SelectItem>
											<SelectItem value="S2">Magister (S2)</SelectItem>
											<SelectItem value="Lainnya">Lainnya</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										No HP / WhatsApp
									</Label>
									<Input
										value={formData.ibuPhone}
										onChange={(e) => updateData("ibuPhone", e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Tempat Lahir
									</Label>
									<Input
										value={formData.ibuBirthPlace}
										onChange={(e) =>
											updateData("ibuBirthPlace", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Tanggal Lahir
									</Label>
									<Input
										type="date"
										value={formData.ibuBirthDate}
										onChange={(e) => updateData("ibuBirthDate", e.target.value)}
									/>
								</div>
								<div className="space-y-2 col-span-full">
									<Label className="text-sm font-semibold text-slate-800">
										Alamat Tinggal
									</Label>
									<Textarea
										value={formData.ibuAddress}
										onChange={(e) => updateData("ibuAddress", e.target.value)}
										placeholder="Alamat lengkap ibu..."
										className="resize-none"
									/>
								</div>
							</div>
						)}

						{currentTab === 5 && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
								<div className="space-y-2 col-span-full mb-2">
									<p className="text-sm text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
										<span className="font-semibold text-[#0517B0]">
											Catatan:
										</span>{" "}
										Bagian wali dapat dikosongkan jika Anda masih tinggal dan
										ditanggung oleh orang tua.
									</p>
								</div>
								<div className="space-y-2 col-span-full md:col-span-1">
									<Label className="text-sm font-semibold text-slate-800">
										Nama Wali
									</Label>
									<Input
										value={formData.waliName}
										onChange={(e) => updateData("waliName", e.target.value)}
										placeholder="Nama lengkap wali"
									/>
								</div>
								<div className="space-y-2 col-span-full md:col-span-1">
									<Label className="text-sm font-semibold text-slate-800">
										Hubungan dengan Mahasiswa
									</Label>
									<Input
										value={formData.waliGuardianRelation}
										onChange={(e) =>
											updateData("waliGuardianRelation", e.target.value)
										}
										placeholder="Contoh: Paman, Kakak Kandung, dll"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Pekerjaan
									</Label>
									<Input
										value={formData.waliJob}
										onChange={(e) => updateData("waliJob", e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Pendidikan Terakhir
									</Label>
									<Select
										value={formData.waliEducation}
										onValueChange={(val) => updateData("waliEducation", val)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pilih..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="SD">SD / Sederajat</SelectItem>
											<SelectItem value="SMP">SMP / Sederajat</SelectItem>
											<SelectItem value="SMA">SMA / SMK / Sederajat</SelectItem>
											<SelectItem value="D3">Diploma 3 (D3)</SelectItem>
											<SelectItem value="S1">Sarjana (S1/D4)</SelectItem>
											<SelectItem value="S2">Magister (S2)</SelectItem>
											<SelectItem value="Lainnya">Lainnya</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										No HP / WhatsApp
									</Label>
									<Input
										value={formData.waliPhone}
										onChange={(e) => updateData("waliPhone", e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Tempat Lahir
									</Label>
									<Input
										value={formData.waliBirthPlace}
										onChange={(e) =>
											updateData("waliBirthPlace", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-slate-800">
										Tanggal Lahir
									</Label>
									<Input
										type="date"
										value={formData.waliBirthDate}
										onChange={(e) =>
											updateData("waliBirthDate", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2 col-span-full">
									<Label className="text-sm font-semibold text-slate-800">
										Alamat Tinggal
									</Label>
									<Textarea
										value={formData.waliAddress}
										onChange={(e) => updateData("waliAddress", e.target.value)}
										placeholder="Alamat lengkap wali..."
										className="resize-none"
									/>
								</div>
							</div>
						)}
					</div>

					{/* Footer Actions */}
					<div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-200">
						<Button
							variant="outline"
							onClick={handlePrev}
							disabled={currentTab === 0}
							className="border-slate-200 text-slate-600 font-semibold h-11 px-6"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Kembali
						</Button>

						{currentTab < TABS.length - 1 ? (
							<Button
								onClick={handleNext}
								className="bg-[#0517B0] hover:bg-blue-800 text-white font-semibold h-11 px-8 shadow-sm"
							>
								Lanjut
							</Button>
						) : (
							<Button
								onClick={handleSubmit}
								disabled={isLoading}
								className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 shadow-sm gap-2"
							>
								{isLoading ? (
									<>
										<span className="animate-spin mr-2">⏳</span>
										Mengirim...
									</>
								) : (
									<>
										<CheckCircle2 className="w-5 h-5" />
										Kirim Formulir
									</>
								)}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
