"use client";

import {
	ArrowLeft,
	Building2,
	Camera,
	CheckCircle2,
	Copy,
	Edit,
	Eye,
	FileText,
	GraduationCap,
	HeartPulse,
	Loader2,
	Mail,
	MapPin,
	MessageCircle,
	Phone,
	Save,
	School,
	ShieldCheck,
	Sparkles,
	Upload,
	User,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";
import { getPeminatanOption, PEMINATAN_OPTIONS } from "@/lib/peminatan";
import { useAuthStore } from "@/store";

export default function StudentProfilePage() {
	const router = useRouter();
	const { id } = useParams();
	const { user } = useAuthStore();

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);

	const [student, setStudent] = useState<any>(null);
	const [pmb, setPmb] = useState<any>(null);
	const [health, setHealth] = useState<any>(null);
	const [parents, setParents] = useState<any[]>([]);
	const [paUsers, setPaUsers] = useState<any[]>([]);

	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Form State for editing
	const [formData, setFormData] = useState({
		// Data Pribadi
		nim: "",
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
		profilePhoto: null as File | null,

		// Data Pendidikan
		schoolOrigin: "",
		schoolAddress: "",
		schoolMajor: "",
		graduationYear: "",
		program: "",
		subProgram: "",
		classType: "",
		academicYear: "",
		cohort: "14",
		batch: "",

		// Data Fisik & Kesehatan
		bloodType: "",
		diseaseHistory: "",
		congenitalDisease: "",
		height: "",
		weight: "",
		clothingSize: "",
		clothingSizeOther: "",

		// Data Ayah
		ayahName: "",
		ayahStatus: "Hidup",
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

		// Data Ibu
		ibuName: "",
		ibuStatus: "Hidup",
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

		// Data Wali
		waliName: "",
		waliGuardianRelation: "",
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

		// Data PMB & Keberangkatan
		paId: "",
		studentStatus: "aktif",
		destinationCountry: "",
		period: "",
		rekomendasi: "",
		timVisit: "",
		timSosialisasi: "",
		roReferral: "",
		mitraSponsor: "",
		koordinator: "",
	});

	// RBAC Guard: Superadmin & PMB only
	useEffect(() => {
		if (user && user.role !== "superadmin" && user.role !== "pmb") {
			toast.error("Anda tidak memiliki izin untuk mengakses halaman ini.");
			router.push("/dashboard");
		}
	}, [user, router]);

	// Fetch PA Users for dropdown
	useEffect(() => {
		const fetchPAs = async () => {
			try {
				const { data, error } = await api.users.get({
					$query: { role: "pa" },
				});
				if (!error && data?.data) {
					setPaUsers(data.data);
				}
			} catch (e) {
				console.error("Gagal memuat daftar PA", e);
			}
		};
		fetchPAs();
	}, []);

	// Fetch Student Data
	const fetchAllStudentData = async () => {
		if (!id) return;
		try {
			setIsLoading(true);
			const [studentRes, healthRes, parentsRes] = await Promise.all([
				api.students[id as string].get(),
				api.students[id as string].health.get(),
				api.students[id as string].parents.get(),
			]);

			if (studentRes.data?.success && studentRes.data.data?.student) {
				const std = studentRes.data.data.student;
				const pmbDataObj = studentRes.data.data.pmb;
				const healthDataObj = healthRes.data?.data;
				const parentsList = parentsRes.data?.data || [];

				setStudent(std);
				setPmb(pmbDataObj || null);
				setHealth(healthDataObj || null);
				setParents(parentsList);

				if (std.profilePhotoUrl) {
					setPreviewUrl(
						std.profilePhotoUrl.startsWith("http")
							? std.profilePhotoUrl
							: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${std.profilePhotoUrl}`,
					);
				} else {
					setPreviewUrl(null);
				}

				const ayah: any = parentsList.find((p: any) => p.type === "ayah") || {};
				const ibu: any = parentsList.find((p: any) => p.type === "ibu") || {};
				const wali: any = parentsList.find((p: any) => p.type === "wali") || {};

				// Populate Form Data
				setFormData({
					// Pribadi
					nim: std.nim || "",
					name: std.name || "",
					nickname: std.nickname || "",
					gender: std.gender || "",
					birthPlace: std.birthPlace || "",
					birthDate: std.birthDate
						? new Date(std.birthDate).toISOString().split("T")[0]
						: "",
					religion: std.religion || "",
					nationality: std.nationality || "Indonesia",
					nationalityOther:
						std.nationality && std.nationality !== "Indonesia"
							? std.nationality
							: "",
					addressStreet: std.addressStreet || "",
					addressRt: std.addressRt || "",
					addressRw: std.addressRw || "",
					addressNo: std.addressNo || "",
					addressVillage: std.addressVillage || "",
					addressDistrict: std.addressDistrict || "",
					addressCity: std.addressCity || "",
					addressProvince: std.addressProvince || "",
					livingWith: std.livingWith || "",
					phone: std.phone || "",
					email: std.email || "",
					profilePhoto: null,

					// Pendidikan
					schoolOrigin: std.schoolOrigin || "",
					schoolAddress: std.schoolAddress || "",
					schoolMajor: std.schoolMajor || "",
					graduationYear: std.graduationYear?.toString() || "",
					program: std.program || "",
					subProgram: std.subProgram || "",
					classType: std.classType || "",
					academicYear: std.academicYear || "",
					cohort: std.cohort?.toString() || "14",
					batch: std.batch?.toString() || "",

					// Fisik & Kesehatan
					bloodType: healthDataObj?.bloodType || "",
					diseaseHistory: healthDataObj?.diseaseHistory || "",
					congenitalDisease: healthDataObj?.congenitalDisease || "",
					height: healthDataObj?.height?.toString() || "",
					weight: healthDataObj?.weight?.toString() || "",
					clothingSize: healthDataObj?.clothingSize || "",
					clothingSizeOther: "",

					// Ayah
					ayahName: ayah.name || "",
					ayahStatus: ayah.status || "Hidup",
					ayahBirthPlace: ayah.birthPlace || "",
					ayahBirthDate: ayah.birthDate
						? new Date(ayah.birthDate).toISOString().split("T")[0]
						: "",
					ayahReligion: ayah.religion || "",
					ayahNationality: ayah.nationality || "Indonesia",
					ayahNationalityOther:
						ayah.nationality && ayah.nationality !== "Indonesia"
							? ayah.nationality
							: "",
					ayahEducation: ayah.education || "",
					ayahJob: ayah.job || "",
					ayahAddress: ayah.address || "",
					ayahPhone: ayah.phone || "",
					ayahEmail: ayah.email || "",

					// Ibu
					ibuName: ibu.name || "",
					ibuStatus: ibu.status || "Hidup",
					ibuBirthPlace: ibu.birthPlace || "",
					ibuBirthDate: ibu.birthDate
						? new Date(ibu.birthDate).toISOString().split("T")[0]
						: "",
					ibuReligion: ibu.religion || "",
					ibuNationality: ibu.nationality || "Indonesia",
					ibuNationalityOther:
						ibu.nationality && ibu.nationality !== "Indonesia"
							? ibu.nationality
							: "",
					ibuEducation: ibu.education || "",
					ibuJob: ibu.job || "",
					ibuAddress: ibu.address || "",
					ibuPhone: ibu.phone || "",
					ibuEmail: ibu.email || "",

					// Wali
					waliName: wali.name || "",
					waliGuardianRelation: wali.guardianRelation || "",
					waliBirthPlace: wali.birthPlace || "",
					waliBirthDate: wali.birthDate
						? new Date(wali.birthDate).toISOString().split("T")[0]
						: "",
					waliReligion: wali.religion || "",
					waliNationality: wali.nationality || "Indonesia",
					waliNationalityOther:
						wali.nationality && wali.nationality !== "Indonesia"
							? wali.nationality
							: "",
					waliEducation: wali.education || "",
					waliJob: wali.job || "",
					waliAddress: wali.address || "",
					waliPhone: wali.phone || "",
					waliEmail: wali.email || "",

					// PMB
					paId: std.paId?.toString() || "",
					studentStatus: std.studentStatus || "aktif",
					destinationCountry: std.destinationCountry || "",
					period: std.period || "",
					rekomendasi: pmbDataObj?.rekomendasi || "",
					timVisit: pmbDataObj?.timVisit || "",
					timSosialisasi: pmbDataObj?.timSosialisasi || "",
					roReferral: pmbDataObj?.roReferral || "",
					mitraSponsor: pmbDataObj?.mitraSponsor || "",
					koordinator: pmbDataObj?.koordinator || "",
				});
			} else {
				toast.error("Gagal memuat profil mahasiswa");
			}
		} catch (e) {
			console.error(e);
			toast.error("Gagal memuat profil mahasiswa");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchAllStudentData();
	}, [id]);

	const updateData = (key: keyof typeof formData, value: any) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 2 * 1024 * 1024) {
				toast.error("Ukuran file foto maksimal 2MB");
				return;
			}
			updateData("profilePhoto", file);
			setPreviewUrl(URL.createObjectURL(file));
		}
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

	const handleSaveProfile = async () => {
		if (!formData.name?.trim()) {
			toast.error("Nama lengkap mahasiswa wajib diisi.");
			return;
		}

		setIsSaving(true);
		try {
			// Build parents list
			const parentsListPayload = [];

			if (formData.ayahName?.trim()) {
				parentsListPayload.push({
					type: "ayah",
					name: formData.ayahName.trim(),
					birthPlace: formData.ayahBirthPlace || undefined,
					birthDate: formData.ayahBirthDate
						? new Date(formData.ayahBirthDate).toISOString()
						: undefined,
					religion: formData.ayahReligion || undefined,
					nationality:
						formData.ayahNationality === "Lainnya"
							? formData.ayahNationalityOther || undefined
							: formData.ayahNationality || undefined,
					education: formData.ayahEducation || undefined,
					job: formData.ayahJob || undefined,
					address: formData.ayahAddress || undefined,
					phone: formData.ayahPhone || undefined,
					email: formData.ayahEmail || undefined,
					status: formData.ayahStatus || undefined,
				});
			}

			if (formData.ibuName?.trim()) {
				parentsListPayload.push({
					type: "ibu",
					name: formData.ibuName.trim(),
					birthPlace: formData.ibuBirthPlace || undefined,
					birthDate: formData.ibuBirthDate
						? new Date(formData.ibuBirthDate).toISOString()
						: undefined,
					religion: formData.ibuReligion || undefined,
					nationality:
						formData.ibuNationality === "Lainnya"
							? formData.ibuNationalityOther || undefined
							: formData.ibuNationality || undefined,
					education: formData.ibuEducation || undefined,
					job: formData.ibuJob || undefined,
					address: formData.ibuAddress || undefined,
					phone: formData.ibuPhone || undefined,
					email: formData.ibuEmail || undefined,
					status: formData.ibuStatus || undefined,
				});
			}

			if (formData.waliName?.trim()) {
				parentsListPayload.push({
					type: "wali",
					name: formData.waliName.trim(),
					birthPlace: formData.waliBirthPlace || undefined,
					birthDate: formData.waliBirthDate
						? new Date(formData.waliBirthDate).toISOString()
						: undefined,
					religion: formData.waliReligion || undefined,
					nationality:
						formData.waliNationality === "Lainnya"
							? formData.waliNationalityOther || undefined
							: formData.waliNationality || undefined,
					education: formData.waliEducation || undefined,
					job: formData.waliJob || undefined,
					address: formData.waliAddress || undefined,
					phone: formData.waliPhone || undefined,
					email: formData.waliEmail || undefined,
					guardianRelation: formData.waliGuardianRelation || undefined,
				});
			}

			const payload = {
				// Tab 1: Pribadi
				nim: formData.nim || undefined,
				name: formData.name.trim(),
				nickname: formData.nickname || undefined,
				gender: formData.gender || undefined,
				birthPlace: formData.birthPlace || undefined,
				birthDate: formData.birthDate
					? new Date(formData.birthDate).toISOString()
					: undefined,
				religion: formData.religion || undefined,
				nationality:
					formData.nationality === "Lainnya"
						? formData.nationalityOther || undefined
						: formData.nationality || undefined,
				addressStreet: formData.addressStreet || undefined,
				addressRt: formData.addressRt || undefined,
				addressRw: formData.addressRw || undefined,
				addressNo: formData.addressNo || undefined,
				addressVillage: formData.addressVillage || undefined,
				addressDistrict: formData.addressDistrict || undefined,
				addressCity: formData.addressCity || undefined,
				addressProvince: formData.addressProvince || undefined,
				livingWith: formData.livingWith || undefined,
				phone: formData.phone || undefined,
				email: formData.email || undefined,

				// Tab 2: Pendidikan
				schoolOrigin: formData.schoolOrigin || undefined,
				schoolAddress: formData.schoolAddress || undefined,
				schoolMajor: formData.schoolMajor || undefined,
				graduationYear: formData.graduationYear
					? parseInt(formData.graduationYear, 10)
					: undefined,
				program: formData.program || "Reguler",
				subProgram: formData.subProgram || undefined,
				classType: formData.classType || undefined,
				academicYear: formData.academicYear || undefined,
				cohort: parseInt(formData.cohort || "14", 10),
				batch: formData.batch ? parseInt(formData.batch, 10) : undefined,

				// Tab 3: Kesehatan
				bloodType: formData.bloodType || undefined,
				diseaseHistory: formData.diseaseHistory || undefined,
				congenitalDisease: formData.congenitalDisease || undefined,
				height: formData.height ? parseInt(formData.height, 10) : undefined,
				weight: formData.weight ? parseInt(formData.weight, 10) : undefined,
				clothingSize:
					formData.clothingSize === "Lainnya"
						? formData.clothingSizeOther || undefined
						: formData.clothingSize || undefined,

				// Tab 4, 5, 6: Parents
				parents: parentsListPayload.length > 0 ? parentsListPayload : undefined,

				// PMB & Info Tambahan
				paId: formData.paId ? parseInt(formData.paId, 10) : undefined,
				studentStatus: formData.studentStatus || "aktif",
				destinationCountry: formData.destinationCountry || undefined,
				period: formData.period || undefined,
				rekomendasi: formData.rekomendasi || undefined,
				timVisit: formData.timVisit || undefined,
				timSosialisasi: formData.timSosialisasi || undefined,
				roReferral: formData.roReferral || undefined,
				mitraSponsor: formData.mitraSponsor || undefined,
				koordinator: formData.koordinator || undefined,
			};

			const { data: resData, error } =
				await api.students[id as string].put(payload);

			if (error || !resData?.success) {
				toast.error(
					resData?.message ||
						error?.value?.message ||
						"Gagal memperbarui data profil mahasiswa.",
				);
				setIsSaving(false);
				return;
			}

			// Upload Foto Profil jika ada file baru dipilih
			if (formData.profilePhoto) {
				const uploadRes = await api.students[id as string][
					"profile-photo"
				].post({
					file: formData.profilePhoto,
				});

				if (!uploadRes.data?.success) {
					toast.warning(
						"Data berhasil disimpan, namun gagal memperbarui foto profil.",
					);
				}
			}

			toast.success("Profil mahasiswa berhasil diperbarui!");
			setIsEditMode(false);
			await fetchAllStudentData();
		} catch (err: any) {
			console.error("Gagal simpan data mahasiswa:", err);
			toast.error("Terjadi kesalahan sistem saat menyimpan data.");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="p-12 flex flex-col items-center justify-center min-h-[500px]">
				<Loader2 className="w-10 h-10 text-[#0517B0] animate-spin mb-3" />
				<p className="text-slate-500 font-medium text-sm">
					Memuat rincian profil mahasiswa...
				</p>
			</div>
		);
	}

	if (!student) {
		return (
			<div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
				<h2 className="text-xl font-bold text-slate-800 mb-2">
					Data Mahasiswa Tidak Ditemukan
				</h2>
				<p className="text-slate-500 text-sm mb-6">
					Mahasiswa dengan ID ini mungkin telah dihapus atau dipindahkan.
				</p>
				<Button
					variant="outline"
					onClick={() => router.push("/dashboard/students")}
				>
					Kembali ke Daftar Mahasiswa
				</Button>
			</div>
		);
	}

	const ayah = parents.find((p: any) => p.type === "ayah") || null;
	const ibu = parents.find((p: any) => p.type === "ibu") || null;
	const wali = parents.find((p: any) => p.type === "wali") || null;

	const DataRow = ({
		label,
		value,
		subValue,
	}: {
		label: string;
		value?: string | number | null;
		subValue?: string | null;
	}) => (
		<div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 border-b border-slate-100 last:border-0 text-xs">
			<div className="text-slate-500 font-medium">{label}</div>
			<div className="sm:col-span-2 font-semibold text-slate-900 flex flex-col">
				<span>{value || "-"}</span>
				{subValue && (
					<span className="text-[11px] text-slate-400 font-normal mt-0.5">
						{subValue}
					</span>
				)}
			</div>
		</div>
	);

	const waUrl = student.phone
		? `https://wa.me/${student.phone.replace(/[^0-9]/g, "")}`
		: null;

	const formatFullAddress = (s: any) => {
		const parts = [];
		if (s.addressStreet) parts.push(s.addressStreet);
		if (s.addressRt || s.addressRw)
			parts.push(`RT ${s.addressRt || "-"}/RW ${s.addressRw || "-"}`);
		if (s.addressNo) parts.push(`No. ${s.addressNo}`);
		if (s.addressVillage) parts.push(`Desa/Kel. ${s.addressVillage}`);
		if (s.addressDistrict) parts.push(`Kec. ${s.addressDistrict}`);
		if (s.addressCity) parts.push(s.addressCity);
		if (s.addressProvince) parts.push(`Prov. ${s.addressProvince}`);
		return parts.length > 0 ? parts.join(", ") : "-";
	};

	return (
		<div className="pb-24 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
			{/* Top Bar Navigation */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.push("/dashboard/students")}
						className="border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer h-9 px-3"
					>
						<ArrowLeft className="w-4 h-4 mr-1.5" />
						Daftar Mahasiswa
					</Button>
					<div>
						<h1 className="text-lg sm:text-xl font-bold text-slate-900">
							Detail Profil Mahasiswa
						</h1>
						<p className="text-xs text-slate-500">
							Informasi menyeluruh hasil pendaftaran & biodata resmi mahasiswa
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
					{!isEditMode ? (
						<Button
							size="sm"
							onClick={() => setIsEditMode(true)}
							className="bg-[#0517B0] hover:bg-[#04128A] text-white text-xs font-semibold h-9 shadow-xs cursor-pointer"
						>
							<Edit className="w-3.5 h-3.5 mr-1.5" />
							Edit Profil
						</Button>
					) : (
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={isSaving}
								onClick={() => {
									setIsEditMode(false);
									fetchAllStudentData();
								}}
								className="text-xs border-slate-200 hover:bg-slate-100 text-slate-700 h-9 cursor-pointer"
							>
								<X className="w-3.5 h-3.5 mr-1" />
								Batal
							</Button>
							<Button
								size="sm"
								disabled={isSaving}
								onClick={handleSaveProfile}
								className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 shadow-xs cursor-pointer"
							>
								{isSaving ? (
									<>
										<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
										Menyimpan...
									</>
								) : (
									<>
										<Save className="w-3.5 h-3.5 mr-1.5" />
										Simpan Perubahan
									</>
								)}
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Mode Alert Banner */}
			{isEditMode && (
				<div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-amber-800 text-xs">
					<div className="flex items-center gap-2 font-medium">
						<Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
						<span>
							Anda sedang dalam <strong>Mode Edit</strong>. Silakan ubah data
							yang diperlukan dan klik tombol <strong>Simpan Perubahan</strong>.
						</span>
					</div>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => setIsEditMode(false)}
						className="h-7 text-xs text-amber-700 hover:bg-amber-100"
					>
						Keluar Mode Edit
					</Button>
				</div>
			)}

			{/* Executive Profile Card Header */}
			<div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
				<div className="flex flex-col md:flex-row items-start md:items-center gap-5">
					{/* Avatar & Photo Picker */}
					<div className="relative group shrink-0">
						<Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-blue-50 shadow-md rounded-2xl overflow-hidden">
							<AvatarImage
								src={previewUrl || ""}
								alt={student.name}
								className="object-cover"
							/>
							<AvatarFallback className="bg-linear-to-br from-[#0517B0] to-blue-600 text-white font-black text-2xl rounded-2xl flex items-center justify-center">
								{student.name ? student.name.charAt(0).toUpperCase() : "M"}
							</AvatarFallback>
						</Avatar>

						{isEditMode && (
							<>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="absolute inset-0 bg-black/50 text-white rounded-2xl flex flex-col items-center justify-center text-[10px] font-semibold opacity-90 hover:opacity-100 transition-opacity cursor-pointer p-2 text-center backdrop-blur-2xs"
									title="Ubah Foto Profil"
								>
									<Camera className="w-5 h-5 mb-1" />
									<span>Ganti Foto</span>
								</button>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleFileChange}
								/>
							</>
						)}
					</div>

					{/* Profile Identity Details */}
					<div className="flex-1 space-y-2">
						<div className="flex flex-wrap items-center gap-2.5">
							<h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
								{student.name}
							</h2>
							{student.studentStatus && (
								<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs uppercase px-2.5 py-0.5">
									● {student.studentStatus}
								</Badge>
							)}
							<Badge
								variant="outline"
								className="bg-slate-50 text-slate-700 border-slate-200 text-xs font-bold font-mono px-2.5 py-0.5"
							>
								Angkatan {student.cohort || "-"}
							</Badge>
						</div>

						<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
							<span className="font-mono bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200/80 text-[11px]">
								NIM: {student.nim || "Belum ada NIM"}
							</span>
							{student.nickname && (
								<span className="text-slate-500 font-medium">
									Panggilan:{" "}
									<strong className="text-slate-800">{student.nickname}</strong>
								</span>
							)}
							<div className="flex items-center gap-1.5 font-semibold text-slate-800">
								<GraduationCap className="w-4 h-4 text-[#0517B0]" />
								<span>{student.program || "Reguler"}</span>
								<PeminatanBadge
									subProgram={student.subProgram}
									destinationCountry={student.destinationCountry}
									program={student.program}
								/>
							</div>
						</div>

						{/* Quick Contacts Bar */}
						<div className="pt-2 flex flex-wrap items-center gap-3">
							{student.phone && (
								<a
									href={waUrl || "#"}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg transition-colors"
								>
									<MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
									<span className="font-mono">{student.phone}</span>
								</a>
							)}
							{student.email && (
								<a
									href={`mailto:${student.email}`}
									className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg transition-colors"
								>
									<Mail className="w-3.5 h-3.5 text-slate-500" />
									<span>{student.email}</span>
								</a>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* ========================================================================= */}
			{/* VIEW MODE: COMPREHENSIVE CARDS DISPLAY */}
			{/* ========================================================================= */}
			{!isEditMode ? (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Card 1: Data Pribadi & Kontak */}
					<Card className="shadow-2xs border-slate-200/90 bg-white">
						<CardHeader className="py-3.5 px-5 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<User className="w-4 h-4 text-[#0517B0]" />
								Data Pribadi & Domisili
							</CardTitle>
							<Badge
								variant="outline"
								className="text-[10px] font-semibold text-slate-500 bg-white"
							>
								Pribadi
							</Badge>
						</CardHeader>
						<CardContent className="p-5">
							<DataRow label="Nama Lengkap" value={student.name} />
							<DataRow label="Nama Panggilan" value={student.nickname} />
							<DataRow label="Jenis Kelamin" value={student.gender} />
							<DataRow
								label="Tempat, Tanggal Lahir"
								value={`${student.birthPlace || "-"}, ${student.birthDate ? new Date(student.birthDate).toLocaleDateString("id-ID") : "-"}`}
							/>
							<DataRow label="Agama" value={student.religion} />
							<DataRow label="Kewarganegaraan" value={student.nationality} />
							<DataRow label="No. Handphone (WA)" value={student.phone} />
							<DataRow label="Alamat Email" value={student.email} />
							<DataRow label="Tinggal Bersama" value={student.livingWith} />
							<DataRow
								label="Alamat Lengkap"
								value={formatFullAddress(student)}
							/>
						</CardContent>
					</Card>

					{/* Card 2: Riwayat Pendidikan & Program */}
					<Card className="shadow-2xs border-slate-200/90 bg-white">
						<CardHeader className="py-3.5 px-5 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<School className="w-4 h-4 text-[#0517B0]" />
								Riwayat Pendidikan & Program
							</CardTitle>
							<Badge
								variant="outline"
								className="text-[10px] font-semibold text-slate-500 bg-white"
							>
								Akademik
							</Badge>
						</CardHeader>
						<CardContent className="p-5">
							<DataRow label="Asal Sekolah" value={student.schoolOrigin} />
							<DataRow label="Alamat Sekolah" value={student.schoolAddress} />
							<DataRow label="Jurusan di Sekolah" value={student.schoolMajor} />
							<DataRow label="Tahun Kelulusan" value={student.graduationYear} />
							<DataRow label="Program Pilihan" value={student.program} />
							<div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 border-b border-slate-100 text-xs">
								<div className="text-slate-500 font-medium">
									Sub Program / Peminatan
								</div>
								<div className="sm:col-span-2">
									<PeminatanBadge
										subProgram={student.subProgram}
										destinationCountry={student.destinationCountry}
										program={student.program}
									/>
								</div>
							</div>
							<DataRow label="Tipe Kelas" value={student.classType} />
							<DataRow label="Tahun Ajaran" value={student.academicYear} />
							<DataRow
								label="Angkatan (Cohort) / Batch"
								value={`Angkatan ${student.cohort || "-"} ${student.batch ? `(Batch ${student.batch})` : ""}`}
							/>
						</CardContent>
					</Card>

					{/* Card 3: Keterangan Fisik & Kesehatan */}
					<Card className="shadow-2xs border-slate-200/90 bg-white">
						<CardHeader className="py-3.5 px-5 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<HeartPulse className="w-4 h-4 text-rose-600" />
								Keterangan Fisik & Kesehatan
							</CardTitle>
							<Badge
								variant="outline"
								className="text-[10px] font-semibold text-slate-500 bg-white"
							>
								Kesehatan
							</Badge>
						</CardHeader>
						<CardContent className="p-5">
							<DataRow
								label="Golongan Darah"
								value={health?.bloodType ? `Golongan ${health.bloodType}` : "-"}
							/>
							<DataRow
								label="Tinggi / Berat Badan"
								value={
									health?.height || health?.weight
										? `${health?.height || "-"} cm / ${health?.weight || "-"} kg`
										: "-"
								}
							/>
							<DataRow
								label="Ukuran Baju / Seragam"
								value={health?.clothingSize}
							/>
							<DataRow
								label="Riwayat Penyakit"
								value={health?.diseaseHistory}
							/>
							<DataRow
								label="Penyakit Bawaan"
								value={health?.congenitalDisease}
							/>
						</CardContent>
					</Card>

					{/* Card 4: Informasi PMB, Referensi & Keberangkatan */}
					<Card className="shadow-2xs border-slate-200/90 bg-white">
						<CardHeader className="py-3.5 px-5 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<Building2 className="w-4 h-4 text-[#0517B0]" />
								Informasi PMB & Referensi
							</CardTitle>
							<Badge
								variant="outline"
								className="text-[10px] font-semibold text-slate-500 bg-white"
							>
								PMB
							</Badge>
						</CardHeader>
						<CardContent className="p-5">
							<DataRow label="Status Mahasiswa" value={student.studentStatus} />
							<DataRow
								label="Pembimbing Akademik (PA)"
								value={
									paUsers.find((p) => p.id === student.paId)?.fullName ||
									"Belum ditentukan"
								}
							/>
							<DataRow
								label="Negara Tujuan"
								value={student.destinationCountry}
							/>
							<DataRow label="Periode Keberangkatan" value={student.period} />
							<DataRow label="Rekomendasi" value={pmb?.rekomendasi} />
							<DataRow label="Tim Visit" value={pmb?.timVisit} />
							<DataRow label="Tim Sosialisasi" value={pmb?.timSosialisasi} />
							<DataRow label="RO Referral" value={pmb?.roReferral} />
							<DataRow label="Mitra Sponsor" value={pmb?.mitraSponsor} />
							<DataRow label="Koordinator" value={pmb?.koordinator} />
						</CardContent>
					</Card>

					{/* Card 5: Data Keluarga & Orang Tua (Full Width) */}
					<Card className="shadow-2xs border-slate-200/90 bg-white lg:col-span-2">
						<CardHeader className="py-3.5 px-5 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<Users className="w-4 h-4 text-[#0517B0]" />
								Data Orang Tua & Wali Lengkap
							</CardTitle>
							<Badge
								variant="outline"
								className="text-[10px] font-semibold text-slate-500 bg-white"
							>
								Keluarga
							</Badge>
						</CardHeader>
						<CardContent className="p-5">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{/* Ayah */}
								<div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 space-y-2">
									<div className="flex items-center justify-between pb-2 border-b border-slate-200">
										<h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
											<User className="w-3.5 h-3.5 text-blue-600" /> Ayah
											Kandung
										</h4>
										<Badge
											variant="outline"
											className="text-[10px] font-bold bg-white"
										>
											{ayah?.status || "Hidup"}
										</Badge>
									</div>
									{ayah?.name ? (
										<div className="space-y-1.5 text-xs pt-1">
											<div>
												<span className="text-slate-400 block text-[10px]">
													Nama
												</span>
												<span className="font-semibold text-slate-800">
													{ayah.name}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Tempat, Tgl Lahir
												</span>
												<span className="font-medium text-slate-700">
													{ayah.birthPlace || "-"},{" "}
													{ayah.birthDate
														? new Date(ayah.birthDate).toLocaleDateString(
																"id-ID",
															)
														: "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Agama / Kewarganegaraan
												</span>
												<span className="font-medium text-slate-700">
													{ayah.religion || "-"} / {ayah.nationality || "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Pendidikan / Pekerjaan
												</span>
												<span className="font-medium text-slate-700">
													{ayah.education || "-"} / {ayah.job || "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													No. HP / Email
												</span>
												<span className="font-mono text-slate-700">
													{ayah.phone || "-"} / {ayah.email || "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Alamat
												</span>
												<span className="font-medium text-slate-700">
													{ayah.address || "-"}
												</span>
											</div>
										</div>
									) : (
										<p className="text-xs text-slate-400 italic py-4 text-center">
											Data Ayah belum diisi
										</p>
									)}
								</div>

								{/* Ibu */}
								<div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 space-y-2">
									<div className="flex items-center justify-between pb-2 border-b border-slate-200">
										<h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
											<User className="w-3.5 h-3.5 text-rose-500" /> Ibu Kandung
										</h4>
										<Badge
											variant="outline"
											className="text-[10px] font-bold bg-white"
										>
											{ibu?.status || "Hidup"}
										</Badge>
									</div>
									{ibu?.name ? (
										<div className="space-y-1.5 text-xs pt-1">
											<div>
												<span className="text-slate-400 block text-[10px]">
													Nama
												</span>
												<span className="font-semibold text-slate-800">
													{ibu.name}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Tempat, Tgl Lahir
												</span>
												<span className="font-medium text-slate-700">
													{ibu.birthPlace || "-"},{" "}
													{ibu.birthDate
														? new Date(ibu.birthDate).toLocaleDateString(
																"id-ID",
															)
														: "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Agama / Kewarganegaraan
												</span>
												<span className="font-medium text-slate-700">
													{ibu.religion || "-"} / {ibu.nationality || "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Pendidikan / Pekerjaan
												</span>
												<span className="font-medium text-slate-700">
													{ibu.education || "-"} / {ibu.job || "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													No. HP / Email
												</span>
												<span className="font-mono text-slate-700">
													{ibu.phone || "-"} / {ibu.email || "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Alamat
												</span>
												<span className="font-medium text-slate-700">
													{ibu.address || "-"}
												</span>
											</div>
										</div>
									) : (
										<p className="text-xs text-slate-400 italic py-4 text-center">
											Data Ibu belum diisi
										</p>
									)}
								</div>

								{/* Wali */}
								<div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 space-y-2">
									<div className="flex items-center justify-between pb-2 border-b border-slate-200">
										<h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
											<User className="w-3.5 h-3.5 text-amber-600" /> Wali (Jika
											Ada)
										</h4>
										{wali?.guardianRelation && (
											<Badge
												variant="outline"
												className="text-[10px] font-bold bg-white text-slate-700"
											>
												{wali.guardianRelation}
											</Badge>
										)}
									</div>
									{wali?.name ? (
										<div className="space-y-1.5 text-xs pt-1">
											<div>
												<span className="text-slate-400 block text-[10px]">
													Nama Wali
												</span>
												<span className="font-semibold text-slate-800">
													{wali.name}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Hubungan
												</span>
												<span className="font-medium text-slate-700">
													{wali.guardianRelation || "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Tempat, Tgl Lahir
												</span>
												<span className="font-medium text-slate-700">
													{wali.birthPlace || "-"},{" "}
													{wali.birthDate
														? new Date(wali.birthDate).toLocaleDateString(
																"id-ID",
															)
														: "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Agama / Kewarganegaraan
												</span>
												<span className="font-medium text-slate-700">
													{wali.religion || "-"} / {wali.nationality || "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Pendidikan / Pekerjaan
												</span>
												<span className="font-medium text-slate-700">
													{wali.education || "-"} / {wali.job || "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													No. HP / Email
												</span>
												<span className="font-mono text-slate-700">
													{wali.phone || "-"} / {wali.email || "-"}
												</span>
											</div>
											<div>
												<span className="text-slate-400 block text-[10px]">
													Alamat
												</span>
												<span className="font-medium text-slate-700">
													{wali.address || "-"}
												</span>
											</div>
										</div>
									) : (
										<p className="text-xs text-slate-400 italic py-4 text-center">
											Data Wali tidak diisi
										</p>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			) : (
				/* ========================================================================= */
				/* EDIT MODE: FULL INTERACTIVE MULTI-SECTION FORM */
				/* ========================================================================= */
				<div className="space-y-6">
					{/* Section 1: Data Pribadi */}
					<Card className="shadow-2xs border-slate-200 bg-white">
						<CardHeader className="py-3.5 px-5 bg-slate-50 border-b border-slate-200">
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<User className="w-4 h-4 text-[#0517B0]" />
								1. Data Pribadi & Domisili
							</CardTitle>
						</CardHeader>
						<CardContent className="p-5 space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div>
									<Label className="text-xs font-semibold">
										Nama Lengkap <span className="text-red-500">*</span>
									</Label>
									<Input
										value={formData.name}
										onChange={(e) => updateData("name", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="Nama lengkap sesuai KTP/Ijazah"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">
										Nama Panggilan (Nickname)
									</Label>
									<Input
										value={formData.nickname}
										onChange={(e) => updateData("nickname", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="Nama panggilan"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">NIM</Label>
									<Input
										value={formData.nim}
										onChange={(e) => updateData("nim", e.target.value)}
										className="h-9 text-xs mt-1 font-mono"
										placeholder="NIM mahasiswa"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
								<div>
									<Label className="text-xs font-semibold">Jenis Kelamin</Label>
									<Select
										value={formData.gender}
										onValueChange={(val) => updateData("gender", val)}
									>
										<SelectTrigger className="h-9 text-xs mt-1">
											<SelectValue placeholder="Pilih Gender" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Laki-laki">Laki-laki</SelectItem>
											<SelectItem value="Perempuan">Perempuan</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label className="text-xs font-semibold">Tempat Lahir</Label>
									<Input
										value={formData.birthPlace}
										onChange={(e) => updateData("birthPlace", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="Kota/Kabupaten kelahiran"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">Tanggal Lahir</Label>
									<Input
										type="date"
										value={formData.birthDate}
										onChange={(e) => updateData("birthDate", e.target.value)}
										className="h-9 text-xs mt-1"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">Agama</Label>
									<Select
										value={formData.religion}
										onValueChange={(val) => updateData("religion", val)}
									>
										<SelectTrigger className="h-9 text-xs mt-1">
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
											<SelectItem value="Khonghucu">Khonghucu</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div>
									<Label className="text-xs font-semibold">
										No. Handphone (WhatsApp)
									</Label>
									<Input
										value={formData.phone}
										onChange={(e) => updateData("phone", e.target.value)}
										className="h-9 text-xs mt-1 font-mono"
										placeholder="08xxxxxxxxxx"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">Alamat Email</Label>
									<Input
										type="email"
										value={formData.email}
										onChange={(e) => updateData("email", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="email@example.com"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">
										Tinggal Bersama
									</Label>
									<Select
										value={formData.livingWith}
										onValueChange={(val) => updateData("livingWith", val)}
									>
										<SelectTrigger className="h-9 text-xs mt-1">
											<SelectValue placeholder="Pilih Status Domisili" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Bersama Orang Tua">
												Bersama Orang Tua
											</SelectItem>
											<SelectItem value="Bersama Wali">Bersama Wali</SelectItem>
											<SelectItem value="Kost / Kontrak">
												Kost / Kontrak
											</SelectItem>
											<SelectItem value="Rumah Sendiri">
												Rumah Sendiri
											</SelectItem>
											<SelectItem value="Lainnya">Lainnya</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-3 pt-2 border-t border-slate-100">
								<Label className="text-xs font-bold text-slate-700">
									Alamat Domisili Lengkap
								</Label>
								<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
									<div className="sm:col-span-2">
										<Label className="text-[11px] text-slate-500">
											Nama Jalan / Dusun
										</Label>
										<Input
											value={formData.addressStreet}
											onChange={(e) =>
												updateData("addressStreet", e.target.value)
											}
											className="h-9 text-xs mt-1"
											placeholder="Jl. Merdeka No..."
										/>
									</div>
									<div>
										<Label className="text-[11px] text-slate-500">
											RT / RW
										</Label>
										<div className="flex items-center gap-2 mt-1">
											<Input
												value={formData.addressRt}
												onChange={(e) =>
													updateData("addressRt", e.target.value)
												}
												className="h-9 text-xs w-1/2"
												placeholder="RT 01"
											/>
											<Input
												value={formData.addressRw}
												onChange={(e) =>
													updateData("addressRw", e.target.value)
												}
												className="h-9 text-xs w-1/2"
												placeholder="RW 02"
											/>
										</div>
									</div>
									<div>
										<Label className="text-[11px] text-slate-500">
											Nomor Rumah
										</Label>
										<Input
											value={formData.addressNo}
											onChange={(e) => updateData("addressNo", e.target.value)}
											className="h-9 text-xs mt-1"
											placeholder="No. 12"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
									<div>
										<Label className="text-[11px] text-slate-500">
											Desa / Kelurahan
										</Label>
										<Input
											value={formData.addressVillage}
											onChange={(e) =>
												updateData("addressVillage", e.target.value)
											}
											className="h-9 text-xs mt-1"
											placeholder="Kelurahan"
										/>
									</div>
									<div>
										<Label className="text-[11px] text-slate-500">
											Kecamatan
										</Label>
										<Input
											value={formData.addressDistrict}
											onChange={(e) =>
												updateData("addressDistrict", e.target.value)
											}
											className="h-9 text-xs mt-1"
											placeholder="Kecamatan"
										/>
									</div>
									<div>
										<Label className="text-[11px] text-slate-500">
											Kabupaten / Kota
										</Label>
										<Input
											value={formData.addressCity}
											onChange={(e) =>
												updateData("addressCity", e.target.value)
											}
											className="h-9 text-xs mt-1"
											placeholder="Kota/Kab"
										/>
									</div>
									<div>
										<Label className="text-[11px] text-slate-500">
											Provinsi
										</Label>
										<Input
											value={formData.addressProvince}
											onChange={(e) =>
												updateData("addressProvince", e.target.value)
											}
											className="h-9 text-xs mt-1"
											placeholder="Provinsi"
										/>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Section 2: Data Pendidikan & Program */}
					<Card className="shadow-2xs border-slate-200 bg-white">
						<CardHeader className="py-3.5 px-5 bg-slate-50 border-b border-slate-200">
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<School className="w-4 h-4 text-[#0517B0]" />
								2. Riwayat Pendidikan & Program
							</CardTitle>
						</CardHeader>
						<CardContent className="p-5 space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div>
									<Label className="text-xs font-semibold">Asal Sekolah</Label>
									<Input
										value={formData.schoolOrigin}
										onChange={(e) => updateData("schoolOrigin", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="SMA/SMK Negeri 1..."
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">
										Jurusan di Sekolah
									</Label>
									<Input
										value={formData.schoolMajor}
										onChange={(e) => updateData("schoolMajor", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="IPA / IPS / Perhotelan..."
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">Tahun Lulus</Label>
									<Input
										type="number"
										value={formData.graduationYear}
										onChange={(e) =>
											updateData("graduationYear", e.target.value)
										}
										className="h-9 text-xs mt-1"
										placeholder="2023"
									/>
								</div>
							</div>

							<div>
								<Label className="text-xs font-semibold">Alamat Sekolah</Label>
								<Input
									value={formData.schoolAddress}
									onChange={(e) => updateData("schoolAddress", e.target.value)}
									className="h-9 text-xs mt-1"
									placeholder="Alamat lengkap sekolah asal"
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
								<div>
									<Label className="text-xs font-semibold">
										Program Pilihan
									</Label>
									<Select
										value={formData.program}
										onValueChange={(val) => updateData("program", val)}
									>
										<SelectTrigger className="h-9 text-xs mt-1">
											<SelectValue placeholder="Pilih Program" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Reguler">Reguler</SelectItem>
											<SelectItem value="Eksekutif">Eksekutif</SelectItem>
											<SelectItem value="FastTrack">FastTrack</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label className="text-xs font-semibold">
										Peminatan / Sub-Program
									</Label>
									<Select
										value={formData.subProgram}
										onValueChange={(val) => {
											updateData("subProgram", val);
											const opt = getPeminatanOption(val);
											if (opt?.countryName) {
												updateData("destinationCountry", opt.countryName);
											}
										}}
									>
										<SelectTrigger className="h-9 text-xs mt-1">
											<SelectValue placeholder="Pilih Peminatan" />
										</SelectTrigger>
										<SelectContent>
											{PEMINATAN_OPTIONS.map((item) => (
												<SelectItem key={item.value} value={item.value}>
													{item.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label className="text-xs font-semibold">Tipe Kelas</Label>
									<Select
										value={formData.classType}
										onValueChange={(val) => updateData("classType", val)}
									>
										<SelectTrigger className="h-9 text-xs mt-1">
											<SelectValue placeholder="Pilih Tipe Kelas" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Offline">Offline</SelectItem>
											<SelectItem value="Online-LMS">Online-LMS</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label className="text-xs font-semibold">
										Angkatan (Cohort)
									</Label>
									<Input
										type="number"
										value={formData.cohort}
										onChange={(e) => updateData("cohort", e.target.value)}
										className="h-9 text-xs mt-1 font-mono"
										placeholder="14"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<Label className="text-xs font-semibold">Tahun Ajaran</Label>
									<Input
										value={formData.academicYear}
										onChange={(e) => updateData("academicYear", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="2024/2025"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">
										Batch (Opsional)
									</Label>
									<Input
										type="number"
										value={formData.batch}
										onChange={(e) => updateData("batch", e.target.value)}
										className="h-9 text-xs mt-1 font-mono"
										placeholder="Contoh: 1"
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Section 3: Data Fisik & Kesehatan */}
					<Card className="shadow-2xs border-slate-200 bg-white">
						<CardHeader className="py-3.5 px-5 bg-slate-50 border-b border-slate-200">
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<HeartPulse className="w-4 h-4 text-rose-600" />
								3. Keterangan Fisik & Kesehatan
							</CardTitle>
						</CardHeader>
						<CardContent className="p-5 space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
								<div>
									<Label className="text-xs font-semibold">
										Golongan Darah
									</Label>
									<Select
										value={formData.bloodType}
										onValueChange={(val) => updateData("bloodType", val)}
									>
										<SelectTrigger className="h-9 text-xs mt-1">
											<SelectValue placeholder="Pilih Gol. Darah" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="A">A</SelectItem>
											<SelectItem value="B">B</SelectItem>
											<SelectItem value="AB">AB</SelectItem>
											<SelectItem value="O">O</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label className="text-xs font-semibold">
										Tinggi Badan (cm)
									</Label>
									<Input
										type="number"
										value={formData.height}
										onChange={(e) => updateData("height", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="170"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">
										Berat Badan (kg)
									</Label>
									<Input
										type="number"
										value={formData.weight}
										onChange={(e) => updateData("weight", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="60"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">
										Ukuran Baju / Seragam
									</Label>
									<Select
										value={formData.clothingSize}
										onValueChange={(val) => updateData("clothingSize", val)}
									>
										<SelectTrigger className="h-9 text-xs mt-1">
											<SelectValue placeholder="Ukuran Baju" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="S">S</SelectItem>
											<SelectItem value="M">M</SelectItem>
											<SelectItem value="L">L</SelectItem>
											<SelectItem value="XL">XL</SelectItem>
											<SelectItem value="XXL">XXL</SelectItem>
											<SelectItem value="XXXL">XXXL</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<Label className="text-xs font-semibold">
										Riwayat Penyakit Ringan/Sedang
									</Label>
									<Textarea
										value={formData.diseaseHistory}
										onChange={(e) =>
											updateData("diseaseHistory", e.target.value)
										}
										className="text-xs mt-1 h-20"
										placeholder="Pernah dirawat karena maag, tifus, patah tulang, dll..."
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">
										Penyakit Bawaan / Alergi Kronis
									</Label>
									<Textarea
										value={formData.congenitalDisease}
										onChange={(e) =>
											updateData("congenitalDisease", e.target.value)
										}
										className="text-xs mt-1 h-20"
										placeholder="Asma, buta warna, hepatitis, alergi obat, dll..."
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Section 4: Data Orang Tua & Wali */}
					<Card className="shadow-2xs border-slate-200 bg-white">
						<CardHeader className="py-3.5 px-5 bg-slate-50 border-b border-slate-200">
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<Users className="w-4 h-4 text-[#0517B0]" />
								4. Data Lengkap Orang Tua & Wali
							</CardTitle>
						</CardHeader>
						<CardContent className="p-5 space-y-6">
							{/* Form Ayah */}
							<div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/40 space-y-3.5">
								<div className="flex items-center justify-between pb-2 border-b border-slate-200">
									<h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
										<User className="w-4 h-4 text-blue-600" /> Data Ayah Kandung
									</h4>
									<div className="flex items-center gap-2">
										<Label className="text-[11px] text-slate-500">
											Status:
										</Label>
										<Select
											value={formData.ayahStatus}
											onValueChange={(val) => updateData("ayahStatus", val)}
										>
											<SelectTrigger className="h-7 text-xs w-28 bg-white">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Hidup">Hidup</SelectItem>
												<SelectItem value="Meninggal">Meninggal</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div>
										<Label className="text-[11px] font-semibold">
											Nama Lengkap Ayah
										</Label>
										<Input
											value={formData.ayahName}
											onChange={(e) => updateData("ayahName", e.target.value)}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="Nama ayah kandung"
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											Tempat Lahir
										</Label>
										<Input
											value={formData.ayahBirthPlace}
											onChange={(e) =>
												updateData("ayahBirthPlace", e.target.value)
											}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="Kota kelahiran"
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											Tanggal Lahir
										</Label>
										<Input
											type="date"
											value={formData.ayahBirthDate}
											onChange={(e) =>
												updateData("ayahBirthDate", e.target.value)
											}
											className="h-9 text-xs mt-1 bg-white"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
									<div>
										<Label className="text-[11px] font-semibold">Agama</Label>
										<Select
											value={formData.ayahReligion}
											onValueChange={(val) => updateData("ayahReligion", val)}
										>
											<SelectTrigger className="h-9 text-xs mt-1 bg-white">
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
												<SelectItem value="Khonghucu">Khonghucu</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											Pendidikan Terakhir
										</Label>
										<Input
											value={formData.ayahEducation}
											onChange={(e) =>
												updateData("ayahEducation", e.target.value)
											}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="SMA / S1 / S2..."
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											Pekerjaan
										</Label>
										<Input
											value={formData.ayahJob}
											onChange={(e) => updateData("ayahJob", e.target.value)}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="PNS / Swasta / Wiraswasta..."
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											No. Handphone / WA
										</Label>
										<Input
											value={formData.ayahPhone}
											onChange={(e) => updateData("ayahPhone", e.target.value)}
											className="h-9 text-xs mt-1 font-mono bg-white"
											placeholder="08xxxxxxxxxx"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div>
										<Label className="text-[11px] font-semibold">
											Alamat Email Ayah
										</Label>
										<Input
											type="email"
											value={formData.ayahEmail}
											onChange={(e) => updateData("ayahEmail", e.target.value)}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="email.ayah@example.com"
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											Alamat Lengkap Tinggal Ayah
										</Label>
										<Input
											value={formData.ayahAddress}
											onChange={(e) =>
												updateData("ayahAddress", e.target.value)
											}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="Alamat tempat tinggal ayah"
										/>
									</div>
								</div>
							</div>

							{/* Form Ibu */}
							<div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/40 space-y-3.5">
								<div className="flex items-center justify-between pb-2 border-b border-slate-200">
									<h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
										<User className="w-4 h-4 text-rose-500" /> Data Ibu Kandung
									</h4>
									<div className="flex items-center gap-2">
										<Label className="text-[11px] text-slate-500">
											Status:
										</Label>
										<Select
											value={formData.ibuStatus}
											onValueChange={(val) => updateData("ibuStatus", val)}
										>
											<SelectTrigger className="h-7 text-xs w-28 bg-white">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Hidup">Hidup</SelectItem>
												<SelectItem value="Meninggal">Meninggal</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div>
										<Label className="text-[11px] font-semibold">
											Nama Lengkap Ibu
										</Label>
										<Input
											value={formData.ibuName}
											onChange={(e) => updateData("ibuName", e.target.value)}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="Nama ibu kandung"
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											Tempat Lahir
										</Label>
										<Input
											value={formData.ibuBirthPlace}
											onChange={(e) =>
												updateData("ibuBirthPlace", e.target.value)
											}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="Kota kelahiran"
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											Tanggal Lahir
										</Label>
										<Input
											type="date"
											value={formData.ibuBirthDate}
											onChange={(e) =>
												updateData("ibuBirthDate", e.target.value)
											}
											className="h-9 text-xs mt-1 bg-white"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
									<div>
										<Label className="text-[11px] font-semibold">Agama</Label>
										<Select
											value={formData.ibuReligion}
											onValueChange={(val) => updateData("ibuReligion", val)}
										>
											<SelectTrigger className="h-9 text-xs mt-1 bg-white">
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
												<SelectItem value="Khonghucu">Khonghucu</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											Pendidikan Terakhir
										</Label>
										<Input
											value={formData.ibuEducation}
											onChange={(e) =>
												updateData("ibuEducation", e.target.value)
											}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="SMA / S1..."
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											Pekerjaan
										</Label>
										<Input
											value={formData.ibuJob}
											onChange={(e) => updateData("ibuJob", e.target.value)}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="Ibu Rumah Tangga / PNS..."
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											No. Handphone / WA
										</Label>
										<Input
											value={formData.ibuPhone}
											onChange={(e) => updateData("ibuPhone", e.target.value)}
											className="h-9 text-xs mt-1 font-mono bg-white"
											placeholder="08xxxxxxxxxx"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div>
										<Label className="text-[11px] font-semibold">
											Alamat Email Ibu
										</Label>
										<Input
											type="email"
											value={formData.ibuEmail}
											onChange={(e) => updateData("ibuEmail", e.target.value)}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="email.ibu@example.com"
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											Alamat Lengkap Tinggal Ibu
										</Label>
										<Input
											value={formData.ibuAddress}
											onChange={(e) => updateData("ibuAddress", e.target.value)}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="Alamat tempat tinggal ibu"
										/>
									</div>
								</div>
							</div>

							{/* Form Wali */}
							<div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/40 space-y-3.5">
								<div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
									<h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
										<User className="w-4 h-4 text-amber-600" /> Data Wali
										(Opsional)
									</h4>
									<div className="flex items-center gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={copyFromAyah}
											className="h-7 text-[11px] bg-white border-blue-200 text-[#0517B0] hover:bg-blue-50"
										>
											<Copy className="w-3 h-3 mr-1" /> Salin Ayah
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={copyFromIbu}
											className="h-7 text-[11px] bg-white border-rose-200 text-rose-700 hover:bg-rose-50"
										>
											<Copy className="w-3 h-3 mr-1" /> Salin Ibu
										</Button>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
									<div className="sm:col-span-2">
										<Label className="text-[11px] font-semibold">
											Nama Lengkap Wali
										</Label>
										<Input
											value={formData.waliName}
											onChange={(e) => updateData("waliName", e.target.value)}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="Nama wali mahasiswa"
										/>
									</div>
									<div className="sm:col-span-2">
										<Label className="text-[11px] font-semibold">
											Hubungan Wali dengan Mahasiswa
										</Label>
										<Input
											value={formData.waliGuardianRelation}
											onChange={(e) =>
												updateData("waliGuardianRelation", e.target.value)
											}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="Contoh: Paman / Kakek / Kakak Kandung"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div>
										<Label className="text-[11px] font-semibold">
											Tempat Lahir
										</Label>
										<Input
											value={formData.waliBirthPlace}
											onChange={(e) =>
												updateData("waliBirthPlace", e.target.value)
											}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="Kota kelahiran"
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											Tanggal Lahir
										</Label>
										<Input
											type="date"
											value={formData.waliBirthDate}
											onChange={(e) =>
												updateData("waliBirthDate", e.target.value)
											}
											className="h-9 text-xs mt-1 bg-white"
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">Agama</Label>
										<Select
											value={formData.waliReligion}
											onValueChange={(val) => updateData("waliReligion", val)}
										>
											<SelectTrigger className="h-9 text-xs mt-1 bg-white">
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
												<SelectItem value="Khonghucu">Khonghucu</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div>
										<Label className="text-[11px] font-semibold">
											Pekerjaan
										</Label>
										<Input
											value={formData.waliJob}
											onChange={(e) => updateData("waliJob", e.target.value)}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="Pekerjaan wali"
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">
											No. Handphone / WA
										</Label>
										<Input
											value={formData.waliPhone}
											onChange={(e) => updateData("waliPhone", e.target.value)}
											className="h-9 text-xs mt-1 font-mono bg-white"
											placeholder="08xxxxxxxxxx"
										/>
									</div>
									<div>
										<Label className="text-[11px] font-semibold">Email</Label>
										<Input
											type="email"
											value={formData.waliEmail}
											onChange={(e) => updateData("waliEmail", e.target.value)}
											className="h-9 text-xs mt-1 bg-white"
											placeholder="email.wali@example.com"
										/>
									</div>
								</div>

								<div>
									<Label className="text-[11px] font-semibold">
										Alamat Lengkap Tinggal Wali
									</Label>
									<Input
										value={formData.waliAddress}
										onChange={(e) => updateData("waliAddress", e.target.value)}
										className="h-9 text-xs mt-1 bg-white"
										placeholder="Alamat tempat tinggal wali"
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Section 5: Informasi PMB & Keberangkatan */}
					<Card className="shadow-2xs border-slate-200 bg-white">
						<CardHeader className="py-3.5 px-5 bg-slate-50 border-b border-slate-200">
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<Building2 className="w-4 h-4 text-[#0517B0]" />
								5. Informasi PMB, Referensi & Keberangkatan
							</CardTitle>
						</CardHeader>
						<CardContent className="p-5 space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
								<div>
									<Label className="text-xs font-semibold">
										Status Mahasiswa
									</Label>
									<Select
										value={formData.studentStatus}
										onValueChange={(val) => updateData("studentStatus", val)}
									>
										<SelectTrigger className="h-9 text-xs mt-1">
											<SelectValue placeholder="Pilih Status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="aktif">Aktif</SelectItem>
											<SelectItem value="cuti">Cuti</SelectItem>
											<SelectItem value="lulus">Lulus</SelectItem>
											<SelectItem value="keluar">Keluar</SelectItem>
											<SelectItem value="drop_out">Drop Out</SelectItem>
											<SelectItem value="non_aktif">Non Aktif</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label className="text-xs font-semibold">
										Dosen Pembimbing Akademik (PA)
									</Label>
									<Select
										value={formData.paId}
										onValueChange={(val) => updateData("paId", val)}
									>
										<SelectTrigger className="h-9 text-xs mt-1">
											<SelectValue placeholder="Pilih Dosen PA" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="">Belum Ditentukan</SelectItem>
											{paUsers.map((pa) => (
												<SelectItem key={pa.id} value={pa.id.toString()}>
													{pa.fullName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label className="text-xs font-semibold">Negara Tujuan</Label>
									<Input
										value={formData.destinationCountry}
										onChange={(e) =>
											updateData("destinationCountry", e.target.value)
										}
										className="h-9 text-xs mt-1"
										placeholder="Malaysia / Taiwan / dll"
									/>
								</div>

								<div>
									<Label className="text-xs font-semibold">
										Periode Keberangkatan
									</Label>
									<Input
										value={formData.period}
										onChange={(e) => updateData("period", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="Contoh: Ganjil 2025"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
								<div>
									<Label className="text-xs font-semibold">
										Rekomendasi Dari
									</Label>
									<Input
										value={formData.rekomendasi}
										onChange={(e) => updateData("rekomendasi", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="Nama pemberi rekomendasi"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">Tim Visit</Label>
									<Input
										value={formData.timVisit}
										onChange={(e) => updateData("timVisit", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="Petugas tim visit"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">
										Tim Sosialisasi
									</Label>
									<Input
										value={formData.timSosialisasi}
										onChange={(e) =>
											updateData("timSosialisasi", e.target.value)
										}
										className="h-9 text-xs mt-1"
										placeholder="Petugas sosialisasi"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div>
									<Label className="text-xs font-semibold">RO Referral</Label>
									<Input
										value={formData.roReferral}
										onChange={(e) => updateData("roReferral", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="Kode / nama referral"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">Mitra Sponsor</Label>
									<Input
										value={formData.mitraSponsor}
										onChange={(e) => updateData("mitraSponsor", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="Mitra / sponsor pembiayaan"
									/>
								</div>
								<div>
									<Label className="text-xs font-semibold">
										Koordinator PMB
									</Label>
									<Input
										value={formData.koordinator}
										onChange={(e) => updateData("koordinator", e.target.value)}
										className="h-9 text-xs mt-1"
										placeholder="Koordinator PMB"
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Sticky Bottom Save Action Bar */}
					<div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-300 shadow-xl flex items-center justify-between gap-4">
						<div className="flex items-center gap-2 text-xs text-slate-600">
							<ShieldCheck className="w-4 h-4 text-emerald-600" />
							<span>
								Pastikan seluruh data sudah benar sebelum menyimpan perubahan.
							</span>
						</div>
						<div className="flex items-center gap-2.5">
							<Button
								variant="outline"
								size="sm"
								disabled={isSaving}
								onClick={() => {
									setIsEditMode(false);
									fetchAllStudentData();
								}}
								className="text-xs h-9 border-slate-200 hover:bg-slate-100 cursor-pointer"
							>
								Batal
							</Button>
							<Button
								size="sm"
								disabled={isSaving}
								onClick={handleSaveProfile}
								className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4 shadow-sm cursor-pointer"
							>
								{isSaving ? (
									<>
										<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
										Menyimpan...
									</>
								) : (
									<>
										<Save className="w-3.5 h-3.5 mr-1.5" />
										Simpan Perubahan
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
