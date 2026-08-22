"use client";

import {
	ArrowLeft,
	CheckCircle2,
	Copy,
	Loader2,
	UploadCloud,
} from "lucide-react";
import { useParams } from "next/navigation";
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

import { getPeminatanOption, PEMINATAN_OPTIONS } from "@/lib/peminatan";

export default function FormMahasiswaPublic() {
	const params = useParams();
	const token = (params?.token as string) || "";
	const [isValidating, setIsValidating] = useState(true);
	const [isValidToken, setIsValidToken] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [currentTab, setCurrentTab] = useState(0);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

	const [formData, setFormData] = useState({
		// Tab 1: Mahasiswa
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

		// Tab 2: Pendidikan
		schoolOrigin: "",
		schoolAddress: "",
		schoolMajor: "",
		graduationYear: "",
		program: "",
		subProgram: "",
		classType: "",
		academicYear: "",
		cohort: "14",

		// Tab 3: Kesehatan
		bloodType: "",
		diseaseHistory: "",
		congenitalDisease: "",
		height: "",
		weight: "",
		clothingSize: "",
		clothingSizeOther: "",

		// Tab 4: Ayah
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

		// Tab 5: Ibu
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

		// Tab 6: Wali
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

	// Validasi Token
	useEffect(() => {
		if (!token) return;
		const validate = async () => {
			try {
				const res = await fetch(`${API_URL}/form/${token}`);
				if (!res.ok) {
					setIsValidToken(false);
					setIsValidating(false);
					return;
				}
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
		validate();
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

	const validateTab = (index: number): boolean => {
		const checkEmpty = (keys: (keyof typeof formData)[]) => {
			for (const key of keys) {
				const val = formData[key];
				if (typeof val === "string" && val.trim() === "") {
					return false;
				}
			}
			return true;
		};

		if (index === 0) {
			const reqKeys: (keyof typeof formData)[] = [
				"email",
				"name",
				"nickname",
				"birthPlace",
				"birthDate",
				"gender",
				"religion",
				"nationality",
				"phone",
				"livingWith",
				"addressStreet",
				"addressRt",
				"addressRw",
				"addressNo",
				"addressVillage",
				"addressDistrict",
				"addressCity",
				"addressProvince",
			];
			if (formData.nationality === "Lainnya" && !formData.nationalityOther) {
				toast.error("Detail kewarganegaraan lainnya wajib diisi");
				return false;
			}
			if (!checkEmpty(reqKeys)) {
				toast.error("Mohon lengkapi seluruh field di Keterangan Mahasiswa");
				return false;
			}
		} else if (index === 1) {
			const reqKeys: (keyof typeof formData)[] = [
				"schoolOrigin",
				"schoolMajor",
				"graduationYear",
				"schoolAddress",
				"program",
				"cohort",
				"academicYear",
			];
			if (!checkEmpty(reqKeys)) {
				toast.error("Mohon lengkapi seluruh field di Keterangan Pendidikan");
				return false;
			}
		} else if (index === 2) {
			const reqKeys: (keyof typeof formData)[] = [
				"bloodType",
				"diseaseHistory",
				"congenitalDisease",
				"height",
				"weight",
				"clothingSize",
			];
			if (formData.clothingSize === "Lainnya" && !formData.clothingSizeOther) {
				toast.error("Detail ukuran baju wajib diisi");
				return false;
			}
			if (!checkEmpty(reqKeys)) {
				toast.error("Mohon lengkapi seluruh field di Keterangan Kesehatan");
				return false;
			}
		} else if (index === 3) {
			const reqKeys: (keyof typeof formData)[] = [
				"ayahName",
				"ayahStatus",
				"ayahBirthPlace",
				"ayahBirthDate",
				"ayahReligion",
				"ayahEducation",
				"ayahJob",
				"ayahAddress",
				"ayahPhone",
				"ayahEmail",
			];
			if (!checkEmpty(reqKeys)) {
				toast.error("Mohon lengkapi seluruh field data Ayah");
				return false;
			}
		} else if (index === 4) {
			const reqKeys: (keyof typeof formData)[] = [
				"ibuName",
				"ibuStatus",
				"ibuBirthPlace",
				"ibuBirthDate",
				"ibuReligion",
				"ibuEducation",
				"ibuJob",
				"ibuAddress",
				"ibuPhone",
				"ibuEmail",
			];
			if (!checkEmpty(reqKeys)) {
				toast.error("Mohon lengkapi seluruh field data Ibu");
				return false;
			}
		} else if (index === 5) {
			const reqKeys: (keyof typeof formData)[] = [
				"waliName",
				"waliGuardianRelation",
				"waliBirthPlace",
				"waliBirthDate",
				"waliReligion",
				"waliEducation",
				"waliJob",
				"waliAddress",
				"waliPhone",
				"waliEmail",
			];
			if (!checkEmpty(reqKeys)) {
				toast.error("Mohon lengkapi seluruh field data Wali");
				return false;
			}
		}
		return true;
	};

	const handleNext = () => {
		if (validateTab(currentTab)) {
			setCurrentTab((prev) => Math.min(prev + 1, TABS.length - 1));
			window.scrollTo(0, 0);
		}
	};

	const handlePrev = () => {
		setCurrentTab((prev) => Math.max(prev - 1, 0));
		window.scrollTo(0, 0);
	};

	const copyFromAyah = () => {
		setFormData((prev) => ({
			...prev,
			waliName: prev.ayahName,
			waliBirthPlace: prev.ayahBirthPlace,
			waliBirthDate: prev.ayahBirthDate,
			waliReligion: prev.ayahReligion,
			waliNationality: prev.ayahNationality,
			waliNationalityOther: prev.ayahNationalityOther,
			waliEducation: prev.ayahEducation,
			waliJob: prev.ayahJob,
			waliAddress: prev.ayahAddress,
			waliPhone: prev.ayahPhone,
			waliEmail: prev.ayahEmail,
			waliGuardianRelation: "Ayah Kandung",
		}));
		toast.success("Data wali berhasil disalin dari data Ayah");
	};

	const copyFromIbu = () => {
		setFormData((prev) => ({
			...prev,
			waliName: prev.ibuName,
			waliBirthPlace: prev.ibuBirthPlace,
			waliBirthDate: prev.ibuBirthDate,
			waliReligion: prev.ibuReligion,
			waliNationality: prev.ibuNationality,
			waliNationalityOther: prev.ibuNationalityOther,
			waliEducation: prev.ibuEducation,
			waliJob: prev.ibuJob,
			waliAddress: prev.ibuAddress,
			waliPhone: prev.ibuPhone,
			waliEmail: prev.ibuEmail,
			waliGuardianRelation: "Ibu Kandung",
		}));
		toast.success("Data wali berhasil disalin dari data Ibu");
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
		if (!validateTab(currentTab)) return;

		setIsLoading(true);
		toast.loading("Mengirim formulir...");

		try {
			let photoUrl = "";
			if (profilePhoto) {
				photoUrl = (await uploadPhoto()) || "";
			}

			const payload = {
				...formData,
				profilePhotoUrl: photoUrl,
				nationality:
					formData.nationality === "Lainnya"
						? formData.nationalityOther
						: formData.nationality,
				ayahNationality:
					formData.ayahNationality === "Lainnya"
						? formData.ayahNationalityOther
						: formData.ayahNationality,
				ibuNationality:
					formData.ibuNationality === "Lainnya"
						? formData.ibuNationalityOther
						: formData.ibuNationality,
				waliNationality:
					formData.waliNationality === "Lainnya"
						? formData.waliNationalityOther
						: formData.waliNationality,
				clothingSize:
					formData.clothingSize === "Lainnya"
						? formData.clothingSizeOther
						: formData.clothingSize,
			};

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
		} catch (error: unknown) {
			toast.dismiss();
			toast.error(
				(error instanceof Error ? error.message : null) ||
					"Terjadi kesalahan pada sistem.",
			);
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
		<div className="pb-20 max-w-5xl mx-auto px-4 sm:px-6">
			{/* Header */}
			<div className="flex justify-between items-center mb-6 pt-6">
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

			{/* Form Header */}
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-[#0517B0]">
					Formulir Pendaftaran Mahasiswa
				</h1>
				<p className="text-slate-500 text-sm mt-1">
					Lengkapi form pendaftaran berikut secara bertahap.
				</p>
			</div>

			{/* Stepper Tabs */}
			<div className="flex items-center space-x-2 mb-8 overflow-x-auto pb-4 hide-scrollbar">
				{TABS.map((tab, idx) => (
					<div key={tab} className="flex items-center">
						<div
							className={`flex items-center justify-center h-8 w-8 rounded-full border-2 text-sm font-medium shrink-0 transition-colors ${
								idx === currentTab
									? "border-[#0517B0] bg-[#0517B0] text-white"
									: idx < currentTab
										? "border-emerald-500 bg-emerald-500 text-white"
										: "border-slate-200 text-slate-400 bg-white"
							}`}
						>
							{idx < currentTab ? (
								<CheckCircle2 className="w-4 h-4" />
							) : (
								idx + 1
							)}
						</div>
						<span
							className={`ml-2 text-sm whitespace-nowrap hidden sm:block ${
								idx === currentTab
									? "font-semibold text-slate-900"
									: "text-slate-500"
							}`}
						>
							{tab}
						</span>
						{idx < TABS.length - 1 && (
							<div
								className={`h-[2px] w-8 mx-4 sm:w-12 ${
									idx < currentTab ? "bg-emerald-500" : "bg-slate-200"
								}`}
							/>
						)}
					</div>
				))}
			</div>

			{/* Form Container */}
			<div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
				{/* TAB 1: Keterangan Mahasiswa */}
				{currentTab === 0 && (
					<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
						<h3 className="font-semibold text-lg border-b pb-2">
							Keterangan Mahasiswa
						</h3>

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

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label>
									Email <span className="text-red-500">*</span>
								</Label>
								<Input
									required
									type="email"
									placeholder="mahasiswa@email.com"
									value={formData.email}
									onChange={(e) => updateData("email", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Nama Lengkap <span className="text-red-500">*</span>
								</Label>
								<Input
									required
									placeholder="Nama Sesuai KTP"
									value={formData.name}
									onChange={(e) => updateData("name", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Nama Panggilan <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Nama panggilan"
									value={formData.nickname}
									onChange={(e) => updateData("nickname", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Tempat Lahir <span className="text-red-500">*</span>
								</Label>
								<Input
									required
									placeholder="Kota kelahiran"
									value={formData.birthPlace}
									onChange={(e) => updateData("birthPlace", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Tanggal Lahir <span className="text-red-500">*</span>
								</Label>
								<Input
									required
									type="date"
									value={formData.birthDate}
									onChange={(e) => updateData("birthDate", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Jenis Kelamin <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.gender}
									onValueChange={(v) => updateData("gender", v)}
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
								<Label>
									Agama <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.religion}
									onValueChange={(v) => updateData("religion", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Agama" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Islam">Islam</SelectItem>
										<SelectItem value="Kristen Protestan">
											Kristen Protestan
										</SelectItem>
										<SelectItem value="Kristen Katolik">
											Kristen Katolik
										</SelectItem>
										<SelectItem value="Hindu">Hindu</SelectItem>
										<SelectItem value="Buddha">Buddha</SelectItem>
										<SelectItem value="Konghucu">Konghucu</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									Kewarganegaraan <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.nationality}
									onValueChange={(v) => updateData("nationality", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Kewarganegaraan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Indonesia">Indonesia</SelectItem>
										<SelectItem value="Lainnya">Lainnya</SelectItem>
									</SelectContent>
								</Select>
								{formData.nationality === "Lainnya" && (
									<Input
										className="mt-2"
										placeholder="Tuliskan kewarganegaraan"
										value={formData.nationalityOther}
										onChange={(e) =>
											updateData("nationalityOther", e.target.value)
										}
									/>
								)}
							</div>
							<div className="space-y-2">
								<Label>
									Nomor HP / WhatsApp <span className="text-red-500">*</span>
								</Label>
								<Input
									type="tel"
									placeholder="0812xxxx"
									value={formData.phone}
									onChange={(e) => updateData("phone", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Tinggal Dengan <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.livingWith}
									onValueChange={(v) => updateData("livingWith", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Orang tua">Orang tua</SelectItem>
										<SelectItem value="Wali">Wali</SelectItem>
										<SelectItem value="Sendiri (Kos)">Sendiri (Kos)</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="md:col-span-2 mt-4">
								<h4 className="font-medium text-slate-700 border-t pt-4">
									Alamat Lengkap
								</h4>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label>
									Jalan <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Nama Jalan, Perumahan, atau Gedung"
									value={formData.addressStreet}
									onChange={(e) => updateData("addressStreet", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									RT <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="001"
									value={formData.addressRt}
									onChange={(e) => updateData("addressRt", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									RW <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="002"
									value={formData.addressRw}
									onChange={(e) => updateData("addressRw", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									No. Rumah <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="12A"
									value={formData.addressNo}
									onChange={(e) => updateData("addressNo", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Kelurahan / Desa <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Kelurahan"
									value={formData.addressVillage}
									onChange={(e) => updateData("addressVillage", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Kecamatan <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Kecamatan"
									value={formData.addressDistrict}
									onChange={(e) =>
										updateData("addressDistrict", e.target.value)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Kabupaten / Kota <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Kabupaten / Kota"
									value={formData.addressCity}
									onChange={(e) => updateData("addressCity", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Provinsi <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Provinsi"
									value={formData.addressProvince}
									onChange={(e) =>
										updateData("addressProvince", e.target.value)
									}
								/>
							</div>
						</div>
					</div>
				)}

				{/* TAB 2: Keterangan Pendidikan */}
				{currentTab === 1 && (
					<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
						<h3 className="font-semibold text-lg border-b pb-2">
							Keterangan Pendidikan
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Pendidikan Saat Ini */}
							<div className="md:col-span-2">
								<h4 className="font-medium text-slate-700">
									Pendidikan Saat Ini
								</h4>
							</div>

							<div className="space-y-2">
								<Label>
									Program Studi <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.program}
									onValueChange={(v) => updateData("program", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Program Studi" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="D3 Perhotelan">D3 Perhotelan</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>
									Peminatan / Sub Program{" "}
									<span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.subProgram}
									onValueChange={(v) => {
										const val = v || "";
										const dest =
											val === "Malaysia-Hospitality"
												? "Malaysia"
												: val === "Taiwan-Hospitality"
													? "Taiwan"
													: val === "Timur tengah-Barista"
														? "Timur Tengah"
														: "Indonesia";
										setFormData((prev) => ({
											...prev,
											subProgram: val,
											destinationCountry: dest,
										}));
									}}
								>
									<SelectTrigger>
										{formData.subProgram ? (
											(() => {
												const opt = getPeminatanOption(formData.subProgram);
												return (
													<div className="flex items-center gap-2">
														<img
															src={opt?.flag}
															alt={opt?.alt || "Flag"}
															className="w-4 h-3 object-cover rounded-[1px] shrink-0"
														/>
														<span>{opt?.label}</span>
													</div>
												);
											})()
										) : (
											<span className="text-muted-foreground">
												Pilih Peminatan
											</span>
										)}
									</SelectTrigger>
									<SelectContent>
										{PEMINATAN_OPTIONS.map((item) => (
											<SelectItem key={item.value} value={item.value}>
												<div className="flex items-center gap-2">
													<img
														src={item.flag}
														alt={item.alt}
														className="w-4 h-3 object-cover rounded-[1px] shrink-0"
													/>
													<span>{item.label}</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>
									Pilihan Kelas <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.classType}
									onValueChange={(v) => updateData("classType", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Online / Offline" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Offline">Offline</SelectItem>
										<SelectItem value="Online-LMS">Online-LMS</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									Angkatan <span className="text-red-500">*</span>
								</Label>
								<Input
									required
									type="number"
									placeholder="Contoh: 15 atau 16"
									value={formData.cohort}
									onChange={(e) => {
										const val = e.target.value;
										const cNum = parseInt(val, 10);
										if (!Number.isNaN(cNum) && cNum >= 1 && cNum <= 99) {
											const startYear = 2010 + cNum;
											setFormData((prev) => ({
												...prev,
												cohort: val,
												academicYear: `${startYear}/${startYear + 1}`,
											}));
										} else {
											updateData("cohort", val);
										}
									}}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Tahun Ajaran <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Contoh: 2025/2026 atau 2026/2027"
									value={formData.academicYear}
									onChange={(e) => {
										const val = e.target.value;
										const match = val.match(/20(\d{2})/);
										if (match) {
											const startYear = parseInt(match[0], 10);
											const calculatedCohort = (startYear - 2010).toString();
											setFormData((prev) => ({
												...prev,
												academicYear: val,
												cohort: calculatedCohort,
											}));
										} else {
											updateData("academicYear", val);
										}
									}}
								/>
							</div>

							{/* Pendidikan Sebelumnya */}
							<div className="md:col-span-2 mt-4">
								<h4 className="font-medium text-slate-700 border-t pt-4">
									Pendidikan Sebelumnya
								</h4>
							</div>

							<div className="space-y-2">
								<Label>
									Nama Sekolah Asal <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="SMA/SMK..."
									value={formData.schoolOrigin}
									onChange={(e) => updateData("schoolOrigin", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Jurusan Sekolah <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="IPA / IPS / Tata Boga"
									value={formData.schoolMajor}
									onChange={(e) => updateData("schoolMajor", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Tahun Lulus <span className="text-red-500">*</span>
								</Label>
								<Input
									type="number"
									placeholder="2023"
									value={formData.graduationYear}
									onChange={(e) => updateData("graduationYear", e.target.value)}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label>
									Alamat Sekolah <span className="text-red-500">*</span>
								</Label>
								<Textarea
									placeholder="Alamat lengkap sekolah asal"
									value={formData.schoolAddress}
									onChange={(e) => updateData("schoolAddress", e.target.value)}
								/>
							</div>
						</div>
					</div>
				)}

				{/* TAB 3: Keterangan Kesehatan */}
				{currentTab === 2 && (
					<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
						<h3 className="font-semibold text-lg border-b pb-2">
							Keterangan Kesehatan
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label>
									Golongan Darah <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.bloodType}
									onValueChange={(v) => updateData("bloodType", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Gol. Darah" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="A+">A+</SelectItem>
										<SelectItem value="A-">A-</SelectItem>
										<SelectItem value="B+">B+</SelectItem>
										<SelectItem value="B-">B-</SelectItem>
										<SelectItem value="AB+">AB+</SelectItem>
										<SelectItem value="AB-">AB-</SelectItem>
										<SelectItem value="O+">O+</SelectItem>
										<SelectItem value="O-">O-</SelectItem>
										<SelectItem value="O">O</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									Ukuran Baju <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.clothingSize}
									onValueChange={(v) => updateData("clothingSize", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Ukuran" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="XS">XS</SelectItem>
										<SelectItem value="S">S</SelectItem>
										<SelectItem value="M">M</SelectItem>
										<SelectItem value="L">L</SelectItem>
										<SelectItem value="XL">XL</SelectItem>
										<SelectItem value="XXL">XXL</SelectItem>
										<SelectItem value="Lainnya">Lainnya</SelectItem>
									</SelectContent>
								</Select>
								{formData.clothingSize === "Lainnya" && (
									<Input
										className="mt-2"
										placeholder="Sebutkan ukuran lainnya"
										value={formData.clothingSizeOther}
										onChange={(e) =>
											updateData("clothingSizeOther", e.target.value)
										}
									/>
								)}
							</div>
							<div className="space-y-2">
								<Label>
									Tinggi Badan (cm) <span className="text-red-500">*</span>
								</Label>
								<Input
									type="number"
									placeholder="170"
									value={formData.height}
									onChange={(e) => updateData("height", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Berat Badan (kg) <span className="text-red-500">*</span>
								</Label>
								<Input
									type="number"
									placeholder="60"
									value={formData.weight}
									onChange={(e) => updateData("weight", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Riwayat Penyakit <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Tuliskan 'Tidak ada' jika tidak ada"
									value={formData.diseaseHistory}
									onChange={(e) => updateData("diseaseHistory", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Penyakit Bawaan <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Tuliskan 'Tidak ada' jika tidak ada"
									value={formData.congenitalDisease}
									onChange={(e) =>
										updateData("congenitalDisease", e.target.value)
									}
								/>
							</div>
						</div>
					</div>
				)}

				{/* TAB 4: Ayah Kandung */}
				{currentTab === 3 && (
					<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
						<h3 className="font-semibold text-lg border-b pb-2">
							Keterangan Ayah Kandung
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label>
									Nama Ayah <span className="text-red-500">*</span>
								</Label>
								<Input
									required
									placeholder="Nama lengkap ayah"
									value={formData.ayahName}
									onChange={(e) => updateData("ayahName", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Keadaan Ayah <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.ayahStatus}
									onValueChange={(v) => updateData("ayahStatus", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Keadaan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Hidup">Hidup</SelectItem>
										<SelectItem value="Meninggal">Meninggal</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									Tempat Lahir <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Kota kelahiran"
									value={formData.ayahBirthPlace}
									onChange={(e) => updateData("ayahBirthPlace", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Tanggal Lahir <span className="text-red-500">*</span>
								</Label>
								<Input
									type="date"
									value={formData.ayahBirthDate}
									onChange={(e) => updateData("ayahBirthDate", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Agama <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.ayahReligion}
									onValueChange={(v) => updateData("ayahReligion", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Agama" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Islam">Islam</SelectItem>
										<SelectItem value="Kristen Protestan">
											Kristen Protestan
										</SelectItem>
										<SelectItem value="Kristen Katolik">
											Kristen Katolik
										</SelectItem>
										<SelectItem value="Hindu">Hindu</SelectItem>
										<SelectItem value="Buddha">Buddha</SelectItem>
										<SelectItem value="Konghucu">Konghucu</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									Kewarganegaraan <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.ayahNationality}
									onValueChange={(v) => updateData("ayahNationality", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Kewarganegaraan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Indonesia">Indonesia</SelectItem>
										<SelectItem value="Lainnya">Lainnya</SelectItem>
									</SelectContent>
								</Select>
								{formData.ayahNationality === "Lainnya" && (
									<Input
										className="mt-2"
										placeholder="Tuliskan kewarganegaraan"
										value={formData.ayahNationalityOther}
										onChange={(e) =>
											updateData("ayahNationalityOther", e.target.value)
										}
									/>
								)}
							</div>
							<div className="space-y-2">
								<Label>
									Pendidikan Terakhir <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="SD/SMP/SMA/S1..."
									value={formData.ayahEducation}
									onChange={(e) => updateData("ayahEducation", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Pekerjaan <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Wiraswasta/PNS/Pegawai Swasta"
									value={formData.ayahJob}
									onChange={(e) => updateData("ayahJob", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Nomor HP <span className="text-red-500">*</span>
								</Label>
								<Input
									type="tel"
									placeholder="0812xxxx"
									value={formData.ayahPhone}
									onChange={(e) => updateData("ayahPhone", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Email <span className="text-red-500">*</span>
								</Label>
								<Input
									type="email"
									placeholder="ayah@email.com"
									value={formData.ayahEmail}
									onChange={(e) => updateData("ayahEmail", e.target.value)}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label>
									Alamat Lengkap <span className="text-red-500">*</span>
								</Label>
								<Textarea
									placeholder="Alamat lengkap ayah"
									value={formData.ayahAddress}
									onChange={(e) => updateData("ayahAddress", e.target.value)}
								/>
							</div>
						</div>
					</div>
				)}

				{/* TAB 5: Ibu Kandung */}
				{currentTab === 4 && (
					<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
						<h3 className="font-semibold text-lg border-b pb-2">
							Keterangan Ibu Kandung
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label>
									Nama Ibu <span className="text-red-500">*</span>
								</Label>
								<Input
									required
									placeholder="Nama lengkap ibu"
									value={formData.ibuName}
									onChange={(e) => updateData("ibuName", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Keadaan Ibu <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.ibuStatus}
									onValueChange={(v) => updateData("ibuStatus", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Keadaan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Hidup">Hidup</SelectItem>
										<SelectItem value="Meninggal">Meninggal</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									Tempat Lahir <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Kota kelahiran"
									value={formData.ibuBirthPlace}
									onChange={(e) => updateData("ibuBirthPlace", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Tanggal Lahir <span className="text-red-500">*</span>
								</Label>
								<Input
									type="date"
									value={formData.ibuBirthDate}
									onChange={(e) => updateData("ibuBirthDate", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Agama <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.ibuReligion}
									onValueChange={(v) => updateData("ibuReligion", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Agama" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Islam">Islam</SelectItem>
										<SelectItem value="Kristen Protestan">
											Kristen Protestan
										</SelectItem>
										<SelectItem value="Kristen Katolik">
											Kristen Katolik
										</SelectItem>
										<SelectItem value="Hindu">Hindu</SelectItem>
										<SelectItem value="Buddha">Buddha</SelectItem>
										<SelectItem value="Konghucu">Konghucu</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									Kewarganegaraan <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.ibuNationality}
									onValueChange={(v) => updateData("ibuNationality", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Kewarganegaraan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Indonesia">Indonesia</SelectItem>
										<SelectItem value="Lainnya">Lainnya</SelectItem>
									</SelectContent>
								</Select>
								{formData.ibuNationality === "Lainnya" && (
									<Input
										className="mt-2"
										placeholder="Tuliskan kewarganegaraan"
										value={formData.ibuNationalityOther}
										onChange={(e) =>
											updateData("ibuNationalityOther", e.target.value)
										}
									/>
								)}
							</div>
							<div className="space-y-2">
								<Label>
									Pendidikan Terakhir <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="SD/SMP/SMA/S1..."
									value={formData.ibuEducation}
									onChange={(e) => updateData("ibuEducation", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Pekerjaan <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Ibu Rumah Tangga/PNS/Dll"
									value={formData.ibuJob}
									onChange={(e) => updateData("ibuJob", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Nomor HP <span className="text-red-500">*</span>
								</Label>
								<Input
									type="tel"
									placeholder="0812xxxx"
									value={formData.ibuPhone}
									onChange={(e) => updateData("ibuPhone", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Email <span className="text-red-500">*</span>
								</Label>
								<Input
									type="email"
									placeholder="ibu@email.com"
									value={formData.ibuEmail}
									onChange={(e) => updateData("ibuEmail", e.target.value)}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label>
									Alamat Lengkap <span className="text-red-500">*</span>
								</Label>
								<Textarea
									placeholder="Alamat lengkap ibu"
									value={formData.ibuAddress}
									onChange={(e) => updateData("ibuAddress", e.target.value)}
								/>
							</div>
						</div>
					</div>
				)}

				{/* TAB 6: Wali */}
				{currentTab === 5 && (
					<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
							<h3 className="font-semibold text-lg">Keterangan Wali</h3>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={copyFromAyah}
									disabled={!formData.ayahName}
									className="text-xs"
								>
									<Copy className="w-3 h-3 mr-1" /> Salin Data Ayah
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={copyFromIbu}
									disabled={!formData.ibuName}
									className="text-xs"
								>
									<Copy className="w-3 h-3 mr-1" /> Salin Data Ibu
								</Button>
							</div>
						</div>

						<p className="text-sm text-slate-500">
							Wali wajib diisi. Silakan gunakan tombol di atas untuk menyalin
							data otomatis jika wali adalah Ayah atau Ibu, atau isi form ini
							secara manual jika walinya berbeda.
						</p>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label>
									Nama Wali <span className="text-red-500">*</span>
								</Label>
								<Input
									required
									placeholder="Nama lengkap wali"
									value={formData.waliName}
									onChange={(e) => updateData("waliName", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Hubungan dengan Mahasiswa{" "}
									<span className="text-red-500">*</span>
								</Label>
								<Input
									required
									placeholder="Paman / Kakak / Ayah Kandung"
									value={formData.waliGuardianRelation}
									onChange={(e) =>
										updateData("waliGuardianRelation", e.target.value)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Tempat Lahir <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Kota kelahiran"
									value={formData.waliBirthPlace}
									onChange={(e) => updateData("waliBirthPlace", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Tanggal Lahir <span className="text-red-500">*</span>
								</Label>
								<Input
									type="date"
									value={formData.waliBirthDate}
									onChange={(e) => updateData("waliBirthDate", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Agama <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.waliReligion}
									onValueChange={(v) => updateData("waliReligion", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Agama" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Islam">Islam</SelectItem>
										<SelectItem value="Kristen Protestan">
											Kristen Protestan
										</SelectItem>
										<SelectItem value="Kristen Katolik">
											Kristen Katolik
										</SelectItem>
										<SelectItem value="Hindu">Hindu</SelectItem>
										<SelectItem value="Buddha">Buddha</SelectItem>
										<SelectItem value="Konghucu">Konghucu</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									Kewarganegaraan <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.waliNationality}
									onValueChange={(v) => updateData("waliNationality", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Kewarganegaraan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Indonesia">Indonesia</SelectItem>
										<SelectItem value="Lainnya">Lainnya</SelectItem>
									</SelectContent>
								</Select>
								{formData.waliNationality === "Lainnya" && (
									<Input
										className="mt-2"
										placeholder="Tuliskan kewarganegaraan"
										value={formData.waliNationalityOther}
										onChange={(e) =>
											updateData("waliNationalityOther", e.target.value)
										}
									/>
								)}
							</div>
							<div className="space-y-2">
								<Label>
									Pendidikan Terakhir <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="SD/SMP/SMA/S1..."
									value={formData.waliEducation}
									onChange={(e) => updateData("waliEducation", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Pekerjaan <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Pekerjaan wali"
									value={formData.waliJob}
									onChange={(e) => updateData("waliJob", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Nomor HP <span className="text-red-500">*</span>
								</Label>
								<Input
									type="tel"
									required
									placeholder="0812xxxx"
									value={formData.waliPhone}
									onChange={(e) => updateData("waliPhone", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Email <span className="text-red-500">*</span>
								</Label>
								<Input
									type="email"
									placeholder="wali@email.com"
									value={formData.waliEmail}
									onChange={(e) => updateData("waliEmail", e.target.value)}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label>
									Alamat Lengkap <span className="text-red-500">*</span>
								</Label>
								<Textarea
									placeholder="Alamat lengkap wali"
									value={formData.waliAddress}
									onChange={(e) => updateData("waliAddress", e.target.value)}
								/>
							</div>
						</div>
					</div>
				)}

				{/* Bottom Navigation */}
				<div className="pt-8 mt-8 border-t border-slate-200 flex justify-between items-center">
					{currentTab > 0 ? (
						<Button
							type="button"
							variant="outline"
							onClick={handlePrev}
							disabled={isLoading}
							className="border-slate-200 text-slate-600 font-semibold h-11 px-6"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Sebelumnya
						</Button>
					) : (
						<div />
					)}

					{currentTab < TABS.length - 1 ? (
						<Button
							type="button"
							className="bg-[#0517B0] hover:bg-blue-800 text-white font-semibold h-11 px-8 shadow-sm"
							onClick={handleNext}
						>
							Lanjut
						</Button>
					) : (
						<Button
							type="button"
							className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 shadow-sm gap-2"
							onClick={handleSubmit}
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Loader2 className="w-5 h-5 animate-spin" />
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
	);
}
