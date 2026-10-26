"use client";

import {
	AlertCircle,
	ArrowLeft,
	Award,
	Building2,
	CheckCircle2,
	Copy,
	Loader2,
	Sparkles,
	UploadCloud,
	UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	getDefaultCohortOption,
	getDynamicCohortOptions,
} from "@/lib/cohort-generator";
import { API_URL, api, getToken } from "@/lib/eden";
import {
	getCities,
	getDistricts,
	getProvinces,
	getVillages,
} from "@/lib/regions";
import { useAuthStore } from "@/store";
import {
	filterNumeric,
	filterPhone,
	isValidEmail,
	preventNonNumericKey,
	preventNonPhoneKey,
} from "@/utils/form-validators";

const TABS = [
	"Keterangan Mahasiswa",
	"Keterangan Pendidikan",
	"Keterangan Kesehatan",
	"Keterangan Wali",
	"Keterangan Ayah Kandung",
	"Keterangan Ibu Kandung",
	"Informasi PMB & Rekomendasi",
];

const REFERRAL_CATEGORY_OPTIONS = [
	{ value: "sekolah", label: "Sekolah (MoU / Guru BK)" },
	{ value: "bkk_fkks", label: "BKK / FKKS" },
	{ value: "mitra_sponsor", label: "Mitra Sponsor" },
	{ value: "koordinator_ro", label: "Koordinator / RO Alumni" },
	{ value: "tim_nusadaya", label: "Staff / Tim Nusadaya" },
	{ value: "lainnya", label: "Lainnya / Mandiri" },
];

const REKOMENDASI_OPTIONS = [
	"Pendamping",
	"MoU Sekolah",
	"BKK",
	"FKKS",
	"RO Alumni",
	"Staff/Team",
	"Alumni Nusadaya",
	"Guru BK",
	"Mitra Sponsor",
	"Lainnya",
];

import { getPeminatanOption, PEMINATAN_OPTIONS } from "@/lib/peminatan";

export default function AddStudentPage() {
	const router = useRouter();
	const { user } = useAuthStore();
	const [isLoading, setIsLoading] = useState(false);
	const [currentTab, setCurrentTab] = useState(0);

	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Cascading administrative region state
	const [districtOptions, setDistrictOptions] = useState<string[]>([]);
	const [villageOptions, setVillageOptions] = useState<string[]>([]);
	const [loadingDistricts, setLoadingDistricts] = useState(false);
	const [loadingVillages, setLoadingVillages] = useState(false);
	const cohortOptions = getDynamicCohortOptions();
	const defaultCohort = getDefaultCohortOption();

	const [formData, setFormData] = useState({
		// Tab 1: Mahasiswa
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

		// Tab 2: Pendidikan
		schoolOrigin: "",
		schoolAddress: "",
		schoolMajor: "",
		graduationYear: "",
		program: "",
		subProgram: "",
		classType: "",
		academicYear: defaultCohort.academicYear,
		cohort: defaultCohort.cohort.toString(),

		// Data Tambahan bawaan
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
		referralCategory: "",
		referralInstitutionName: "",
		referralContactName: "",
		referralContactPhone: "",
		emergencyContactName: "",
		emergencyContactPhone: "",
		emergencyContactRelation: "",

		// Tab 3: Kesehatan
		bloodType: "",
		diseaseHistory: "",
		congenitalDisease: "",
		height: "",
		weight: "",
		clothingSize: "",
		clothingSizeOther: "",
		hasBoneFracture: "Tidak",
		boneFractureLocation: "",
		boneFractureYear: "",
		hasSurgery: "Tidak",
		surgeryType: "",
		surgeryYear: "",
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
		waliRole: "ayah",
	});

	// Restrict to superadmin & pmb
	useEffect(() => {
		if (user && user.role !== "superadmin" && user.role !== "pmb") {
			toast.error("Anda tidak memiliki akses ke halaman ini.");
			router.push("/dashboard");
		}
	}, [user, router]);

	// Load from local storage
	useEffect(() => {
		const saved = localStorage.getItem("addStudentFormData");
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				setFormData((prev) => ({ ...prev, ...parsed }));
			} catch (e) {}
		}
	}, []);

	// Save to local storage when formData changes
	useEffect(() => {
		const { profilePhoto, ...toSave } = formData;
		localStorage.setItem("addStudentFormData", JSON.stringify(toSave));
	}, [formData]);

	// Load districts whenever province or city changes
	useEffect(() => {
		let isMounted = true;
		if (formData.addressProvince && formData.addressCity) {
			setLoadingDistricts(true);
			getDistricts(formData.addressProvince, formData.addressCity).then(
				(dists) => {
					if (isMounted) {
						setDistrictOptions(dists);
						setLoadingDistricts(false);
					}
				},
			);
		} else {
			setDistrictOptions([]);
		}
		return () => {
			isMounted = false;
		};
	}, [formData.addressProvince, formData.addressCity]);

	// Load villages whenever province, city, or district changes
	useEffect(() => {
		let isMounted = true;
		if (
			formData.addressProvince &&
			formData.addressCity &&
			formData.addressDistrict
		) {
			setLoadingVillages(true);
			getVillages(
				formData.addressProvince,
				formData.addressCity,
				formData.addressDistrict,
			).then((vils) => {
				if (isMounted) {
					setVillageOptions(vils);
					setLoadingVillages(false);
				}
			});
		} else {
			setVillageOptions([]);
		}
		return () => {
			isMounted = false;
		};
	}, [
		formData.addressProvince,
		formData.addressCity,
		formData.addressDistrict,
	]);

	const updateData = (key: keyof typeof formData, value: any) => {
		setFormData((prev) => {
			const next = { ...prev, [key]: value };
			if (next.waliRole === "ayah") {
				if (key === "ayahName") next.waliName = value;
				if (key === "ayahBirthPlace") next.waliBirthPlace = value;
				if (key === "ayahBirthDate") next.waliBirthDate = value;
				if (key === "ayahReligion") next.waliReligion = value;
				if (key === "ayahNationality") next.waliNationality = value;
				if (key === "ayahNationalityOther") next.waliNationalityOther = value;
				if (key === "ayahEducation") next.waliEducation = value;
				if (key === "ayahJob") next.waliJob = value;
				if (key === "ayahAddress") next.waliAddress = value;
				if (key === "ayahPhone") next.waliPhone = value;
				if (key === "ayahEmail") next.waliEmail = value;
				next.waliGuardianRelation = "Ayah Kandung";
			} else if (next.waliRole === "ibu") {
				if (key === "ibuName") next.waliName = value;
				if (key === "ibuBirthPlace") next.waliBirthPlace = value;
				if (key === "ibuBirthDate") next.waliBirthDate = value;
				if (key === "ibuReligion") next.waliReligion = value;
				if (key === "ibuNationality") next.waliNationality = value;
				if (key === "ibuNationalityOther") next.waliNationalityOther = value;
				if (key === "ibuEducation") next.waliEducation = value;
				if (key === "ibuJob") next.waliJob = value;
				if (key === "ibuAddress") next.waliAddress = value;
				if (key === "ibuPhone") next.waliPhone = value;
				if (key === "ibuEmail") next.waliEmail = value;
				next.waliGuardianRelation = "Ibu Kandung";
			}
			return next;
		});
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 2 * 1024 * 1024) {
				toast.error("Ukuran file maksimal 2MB");
				return;
			}
			updateData("profilePhoto", file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	const validateTab = (index: number) => {
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
				toast.error(
					"Mohon lengkapi seluruh field di Keterangan Mahasiswa (Kecuali NIM & No. Rumah)",
				);
				return false;
			}
			if (!isValidEmail(formData.email)) {
				toast.error(
					"Format Email mahasiswa tidak valid (contoh: nama@email.com)",
				);
				return false;
			}
			if (formData.phone.length < 8) {
				toast.error("Nomor HP / WhatsApp minimal 8 digit");
				return false;
			}
		} else if (index === 1) {
			const reqKeys: (keyof typeof formData)[] = [
				"schoolOrigin",
				"graduationYear",
				"schoolAddress",
				"program",
				"cohort",
				"academicYear",
			];
			if (!checkEmpty(reqKeys)) {
				toast.error(
					"Mohon lengkapi seluruh field di Keterangan Pendidikan (Jurusan Sekolah opsional)",
				);
				return false;
			}
			const grad = Number(formData.graduationYear);
			if (Number.isNaN(grad) || grad < 1970 || grad > 2035) {
				toast.error(
					"Tahun lulus harus berupa 4 digit tahun yang valid (1970 - 2035)",
				);
				return false;
			}
			const cNum = Number(formData.cohort);
			if (Number.isNaN(cNum) || cNum < 1 || cNum > 99) {
				toast.error("Angkatan harus berupa angka 1 - 99");
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
			const h = Number(formData.height);
			if (Number.isNaN(h) || h < 50 || h > 250) {
				toast.error("Tinggi badan harus dalam rentang 50 - 250 cm");
				return false;
			}
			const w = Number(formData.weight);
			if (Number.isNaN(w) || w < 20 || w > 250) {
				toast.error("Berat badan harus dalam rentang 20 - 250 kg");
				return false;
			}
			if (formData.hasBoneFracture === "Ya") {
				if (
					!formData.boneFractureLocation ||
					!formData.boneFractureLocation.trim()
				) {
					toast.error(
						"Bagian tubuh yang patah wajib diisi jika pernah patah tulang",
					);
					return false;
				}
				const y = Number(formData.boneFractureYear);
				if (Number.isNaN(y) || y < 1970 || y > 2035) {
					toast.error(
						"Tahun kejadian patah tulang harus berupa 4 digit tahun yang valid",
					);
					return false;
				}
			}
			if (formData.hasSurgery === "Ya") {
				if (!formData.surgeryType || !formData.surgeryType.trim()) {
					toast.error(
						"Jenis/deskripsi operasi wajib diisi jika pernah operasi",
					);
					return false;
				}
				const y = Number(formData.surgeryYear);
				if (Number.isNaN(y) || y < 1970 || y > 2035) {
					toast.error("Tahun operasi harus berupa 4 digit tahun yang valid");
					return false;
				}
			}
		} else if (index === 3) {
			if (formData.waliRole === "ayah" || formData.waliRole === "ibu") {
				// Wali tersinkronisasi otomatis dengan Ayah / Ibu di tab berikutnya
				return true;
			}
			const reqKeys: (keyof typeof formData)[] = [
				"waliName",
				"waliGuardianRelation",
				"waliNationality",
			];
			if (
				formData.waliNationality === "Lainnya" &&
				!formData.waliNationalityOther
			) {
				toast.error("Detail kewarganegaraan lainnya wali wajib diisi");
				return false;
			}
			if (!checkEmpty(reqKeys)) {
				toast.error(
					"Mohon lengkapi Nama Wali, Hubungan, dan Kewarganegaraan Wali",
				);
				return false;
			}
			if (formData.waliEmail && !isValidEmail(formData.waliEmail)) {
				toast.error("Format Email Wali tidak valid");
				return false;
			}
			if (formData.waliPhone && formData.waliPhone.length < 8) {
				toast.error("Nomor HP Wali minimal 8 digit");
				return false;
			}
		} else if (index === 4) {
			const reqKeys: (keyof typeof formData)[] = [
				"ayahName",
				"ayahStatus",
				"ayahNationality",
			];
			if (
				formData.ayahNationality === "Lainnya" &&
				!formData.ayahNationalityOther
			) {
				toast.error("Detail kewarganegaraan lainnya ayah wajib diisi");
				return false;
			}
			if (!checkEmpty(reqKeys)) {
				toast.error("Mohon lengkapi Nama, Keadaan, dan Kewarganegaraan Ayah");
				return false;
			}
			if (formData.ayahEmail && !isValidEmail(formData.ayahEmail)) {
				toast.error("Format Email Ayah tidak valid");
				return false;
			}
			if (formData.ayahPhone && formData.ayahPhone.length < 8) {
				toast.error("Nomor HP Ayah minimal 8 digit");
				return false;
			}
		} else if (index === 5) {
			const reqKeys: (keyof typeof formData)[] = [
				"ibuName",
				"ibuStatus",
				"ibuNationality",
			];
			if (
				formData.ibuNationality === "Lainnya" &&
				!formData.ibuNationalityOther
			) {
				toast.error("Detail kewarganegaraan lainnya ibu wajib diisi");
				return false;
			}
			if (!checkEmpty(reqKeys)) {
				toast.error("Mohon lengkapi Nama, Keadaan, dan Kewarganegaraan Ibu");
				return false;
			}
			if (formData.ibuEmail && !isValidEmail(formData.ibuEmail)) {
				toast.error("Format Email Ibu tidak valid");
				return false;
			}
			if (formData.ibuPhone && formData.ibuPhone.length < 8) {
				toast.error("Nomor HP Ibu minimal 8 digit");
				return false;
			}
		} else if (index === 6) {
			if (
				formData.referralContactPhone &&
				formData.referralContactPhone.length < 8
			) {
				toast.error("Nomor WhatsApp Kontak Referral minimal 8 digit");
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
			waliEducation: prev.ibuEducation,
			waliJob: prev.ibuJob,
			waliAddress: prev.ibuAddress,
			waliPhone: prev.ibuPhone,
			waliEmail: prev.ibuEmail,
			waliGuardianRelation: "Ibu Kandung",
		}));
		toast.success("Data wali berhasil disalin dari data Ibu");
	};

	const handleSubmit = async () => {
		if (!validateTab(currentTab)) return;

		setIsLoading(true);
		try {
			// Build parents array
			const parents = [];
			if (formData.ayahName) {
				parents.push({
					type: "ayah",
					name: formData.ayahName,
					birthPlace: formData.ayahBirthPlace || undefined,
					birthDate: formData.ayahBirthDate
						? new Date(formData.ayahBirthDate).toISOString()
						: undefined,
					religion: formData.ayahReligion || undefined,
					nationality:
						formData.ayahNationality === "Lainnya"
							? formData.ayahNationalityOther
							: formData.ayahNationality || undefined,
					education: formData.ayahEducation || undefined,
					job: formData.ayahJob || undefined,
					address: formData.ayahAddress || undefined,
					phone: formData.ayahPhone || undefined,
					email: formData.ayahEmail || undefined,
					status: formData.ayahStatus || undefined,
				});
			}
			if (formData.ibuName) {
				parents.push({
					type: "ibu",
					name: formData.ibuName,
					birthPlace: formData.ibuBirthPlace || undefined,
					birthDate: formData.ibuBirthDate
						? new Date(formData.ibuBirthDate).toISOString()
						: undefined,
					religion: formData.ibuReligion || undefined,
					nationality:
						formData.ibuNationality === "Lainnya"
							? formData.ibuNationalityOther
							: formData.ibuNationality || undefined,
					education: formData.ibuEducation || undefined,
					job: formData.ibuJob || undefined,
					address: formData.ibuAddress || undefined,
					phone: formData.ibuPhone || undefined,
					email: formData.ibuEmail || undefined,
					status: formData.ibuStatus || undefined,
				});
			}
			if (formData.waliRole === "ayah") {
				if (formData.ayahName) {
					parents.push({
						type: "wali",
						name: formData.ayahName,
						birthPlace: formData.ayahBirthPlace || undefined,
						birthDate: formData.ayahBirthDate
							? new Date(formData.ayahBirthDate).toISOString()
							: undefined,
						religion: formData.ayahReligion || undefined,
						nationality:
							formData.ayahNationality === "Lainnya"
								? formData.ayahNationalityOther
								: formData.ayahNationality || undefined,
						education: formData.ayahEducation || undefined,
						job: formData.ayahJob || undefined,
						address: formData.ayahAddress || undefined,
						phone: formData.ayahPhone || undefined,
						email: formData.ayahEmail || undefined,
						status: formData.ayahStatus || undefined,
						guardianRelation: "Ayah Kandung",
					});
				}
			} else if (formData.waliRole === "ibu") {
				if (formData.ibuName) {
					parents.push({
						type: "wali",
						name: formData.ibuName,
						birthPlace: formData.ibuBirthPlace || undefined,
						birthDate: formData.ibuBirthDate
							? new Date(formData.ibuBirthDate).toISOString()
							: undefined,
						religion: formData.ibuReligion || undefined,
						nationality:
							formData.ibuNationality === "Lainnya"
								? formData.ibuNationalityOther
								: formData.ibuNationality || undefined,
						education: formData.ibuEducation || undefined,
						job: formData.ibuJob || undefined,
						address: formData.ibuAddress || undefined,
						phone: formData.ibuPhone || undefined,
						email: formData.ibuEmail || undefined,
						status: formData.ibuStatus || undefined,
						guardianRelation: "Ibu Kandung",
					});
				}
			} else if (formData.waliName) {
				parents.push({
					type: "wali",
					name: formData.waliName,
					birthPlace: formData.waliBirthPlace || undefined,
					birthDate: formData.waliBirthDate
						? new Date(formData.waliBirthDate).toISOString()
						: undefined,
					religion: formData.waliReligion || undefined,
					nationality:
						formData.waliNationality === "Lainnya"
							? formData.waliNationalityOther
							: formData.waliNationality || undefined,
					education: formData.waliEducation || undefined,
					job: formData.waliJob || undefined,
					address: formData.waliAddress || undefined,
					phone: formData.waliPhone || undefined,
					email: formData.waliEmail || undefined,
					guardianRelation: formData.waliGuardianRelation || undefined,
				});
			}

			// 1. Upload foto profil jika ada file yang dipilih
			let profilePhotoUrl: string | undefined;
			if (formData.profilePhoto) {
				try {
					const uploadFd = new FormData();
					uploadFd.append("file", formData.profilePhoto);
					uploadFd.append("category", "profile");
					uploadFd.append("panel", "pmb");
					uploadFd.append("documentKey", "profile_photo");
					uploadFd.append("visibility", "public");

					const token = getToken();
					const uploadRes = await fetch(`${API_URL}/files/upload`, {
						method: "POST",
						headers: token ? { Authorization: `Bearer ${token}` } : {},
						body: uploadFd,
					});
					const uploadJson = await uploadRes.json();
					if (uploadJson.success && uploadJson.data?.id) {
						profilePhotoUrl = `/files/${uploadJson.data.id}/download`;
					}
				} catch (photoErr) {
					console.error("Gagal mengunggah foto profil awal:", photoErr);
				}
			}

			const payload = {
				// Tab 1
				nim: formData.nim || undefined,
				name: formData.name,
				nickname: formData.nickname || undefined,
				gender: formData.gender || undefined,
				birthPlace: formData.birthPlace || undefined,
				birthDate: formData.birthDate
					? new Date(formData.birthDate).toISOString()
					: undefined,
				religion: formData.religion || undefined,
				nationality:
					formData.nationality === "Lainnya"
						? formData.nationalityOther
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
				profilePhotoUrl: profilePhotoUrl || undefined,

				// Tab 2
				schoolOrigin: formData.schoolOrigin || undefined,
				schoolAddress: formData.schoolAddress || undefined,
				schoolMajor: formData.schoolMajor || undefined,
				graduationYear: formData.graduationYear
					? parseInt(formData.graduationYear, 10)
					: undefined,
				program: formData.program,
				subProgram: formData.subProgram || undefined,
				classType: formData.classType || undefined,
				academicYear: formData.academicYear || undefined,
				cohort: parseInt(formData.cohort, 10),
				batch: formData.cohort ? parseInt(formData.cohort, 10) : undefined,

				// Tab 3
				bloodType: formData.bloodType || undefined,
				diseaseHistory: formData.diseaseHistory || undefined,
				congenitalDisease: formData.congenitalDisease || undefined,
				height: formData.height ? parseInt(formData.height, 10) : undefined,
				weight: formData.weight ? parseInt(formData.weight, 10) : undefined,
				clothingSize:
					formData.clothingSize === "Lainnya"
						? formData.clothingSizeOther
						: formData.clothingSize || undefined,
				hasBoneFracture: formData.hasBoneFracture === "Ya",
				boneFractureLocation:
					formData.hasBoneFracture === "Ya"
						? formData.boneFractureLocation || undefined
						: undefined,
				boneFractureYear:
					formData.hasBoneFracture === "Ya" && formData.boneFractureYear
						? parseInt(formData.boneFractureYear, 10)
						: undefined,
				hasSurgery: formData.hasSurgery === "Ya",
				surgeryType:
					formData.hasSurgery === "Ya"
						? formData.surgeryType || undefined
						: undefined,
				surgeryYear:
					formData.hasSurgery === "Ya" && formData.surgeryYear
						? parseInt(formData.surgeryYear, 10)
						: undefined,

				// Parents
				parents: parents.length > 0 ? parents : undefined,

				// Extras
				paId:
					formData.paId && formData.paId !== "unassigned"
						? parseInt(formData.paId, 10)
						: undefined,
				studentStatus: formData.studentStatus || "aktif",
				destinationCountry: formData.destinationCountry || undefined,
				period: formData.period || undefined,
				rekomendasi: formData.rekomendasi || undefined,
				timVisit: formData.timVisit || undefined,
				timSosialisasi: formData.timSosialisasi || undefined,
				roReferral: formData.roReferral || undefined,
				mitraSponsor: formData.mitraSponsor || undefined,
				koordinator: formData.koordinator || undefined,
				referralCategory: formData.referralCategory || undefined,
				referralInstitutionName: formData.referralInstitutionName || undefined,
				referralContactName: formData.referralContactName || undefined,
				referralContactPhone: formData.referralContactPhone || undefined,
				emergencyContactName: formData.emergencyContactName || undefined,
				emergencyContactPhone: formData.emergencyContactPhone || undefined,
				emergencyContactRelation:
					formData.emergencyContactRelation || undefined,
			};

			const { data: resData, error } = await api.students.post(payload);

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

			// 2. Jika ada file foto profil, sinkronkan juga via endpoint profile-photo mahasiswa
			if (formData.profilePhoto) {
				try {
					const photoFd = new FormData();
					photoFd.append("file", formData.profilePhoto);
					const token = getToken();
					const photoRes = await fetch(
						`${API_URL}/students/${newStudentId}/profile-photo`,
						{
							method: "POST",
							headers: token ? { Authorization: `Bearer ${token}` } : {},
							body: photoFd,
						},
					);
					const photoJson = await photoRes.json();
					if (!photoJson.success) {
						console.warn(
							"Sinkronisasi foto profil mahasiswa:",
							photoJson.message,
						);
					}
				} catch (photoUploadErr) {
					console.warn(
						"Gagal upload foto via student profile-photo:",
						photoUploadErr,
					);
				}
			}

			toast.success("Mahasiswa berhasil ditambahkan!");
			localStorage.removeItem("addStudentFormData");
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
		<div className="pb-20 max-w-5xl mx-auto">
			{/* Top Actions */}
			<div className="flex justify-between items-center mb-6">
				<button
					type="button"
					onClick={() => {
						if (typeof window !== "undefined" && window.history.length > 1) {
							router.back();
						} else {
							router.push("/dashboard");
						}
					}}
					className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium cursor-pointer"
				>
					<ArrowLeft className="w-4 h-4" />
					Kembali
				</button>
			</div>

			{/* Form Header */}
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-[#0517B0]">
					Tambah Mahasiswa Baru
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
								<Label>NIM / NIS</Label>
								<Input
									placeholder="Nomor Induk"
									value={formData.nim}
									onKeyDown={preventNonNumericKey}
									onChange={(e) =>
										updateData(
											"nim",
											filterNumeric(
												e.target.value,
												20,
												"NIM hanya boleh berisi angka",
											),
										)
									}
								/>
								<p className="text-xs text-slate-400">
									Opsional. Sesuai standarisasi OneData, NIM resmi dirilis
									setelah berkas PMB disetujui (ACC) dan pembayaran Registrasi
									Awal lunas di Finance. Jika dikosongkan, username login akun
									mahasiswa menggunakan Email.
								</p>
							</div>
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
									onKeyDown={preventNonPhoneKey}
									onChange={(e) =>
										updateData("phone", filterPhone(e.target.value, 15))
									}
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
									onKeyDown={preventNonNumericKey}
									onChange={(e) =>
										updateData(
											"addressRt",
											filterNumeric(
												e.target.value,
												5,
												"RT hanya boleh berupa angka",
											),
										)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									RW <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="002"
									value={formData.addressRw}
									onKeyDown={preventNonNumericKey}
									onChange={(e) =>
										updateData(
											"addressRw",
											filterNumeric(
												e.target.value,
												5,
												"RW hanya boleh berupa angka",
											),
										)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									No. Rumah{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
								</Label>
								<Input
									placeholder="12A"
									value={formData.addressNo}
									onChange={(e) => updateData("addressNo", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Provinsi <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.addressProvince}
									onValueChange={(val) => {
										const v = val || "";
										setFormData((prev) => ({
											...prev,
											addressProvince: v,
											addressCity: "",
											addressDistrict: "",
											addressVillage: "",
										}));
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Provinsi" />
									</SelectTrigger>
									<SelectContent>
										{getProvinces().map((p) => (
											<SelectItem key={p} value={p}>
												{p}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									Kabupaten / Kota <span className="text-red-500">*</span>
								</Label>
								<Select
									disabled={!formData.addressProvince}
									value={formData.addressCity}
									onValueChange={(val) => {
										const v = val || "";
										setFormData((prev) => ({
											...prev,
											addressCity: v,
											addressDistrict: "",
											addressVillage: "",
										}));
									}}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												!formData.addressProvince
													? "Pilih provinsi dahulu"
													: "Pilih Kabupaten / Kota"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{formData.addressCity &&
											!getCities(formData.addressProvince).includes(
												formData.addressCity,
											) && (
												<SelectItem value={formData.addressCity}>
													{formData.addressCity}
												</SelectItem>
											)}
										{getCities(formData.addressProvince).map((c) => (
											<SelectItem key={c} value={c}>
												{c}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									Kecamatan <span className="text-red-500">*</span>
								</Label>
								<Select
									disabled={!formData.addressCity || loadingDistricts}
									value={formData.addressDistrict}
									onValueChange={(val) => {
										const v = val || "";
										setFormData((prev) => ({
											...prev,
											addressDistrict: v,
											addressVillage: "",
										}));
									}}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												!formData.addressCity
													? "Pilih kab/kota dahulu"
													: loadingDistricts
														? "Memuat kecamatan..."
														: "Pilih Kecamatan"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{formData.addressDistrict &&
											!districtOptions.includes(formData.addressDistrict) && (
												<SelectItem value={formData.addressDistrict}>
													{formData.addressDistrict}
												</SelectItem>
											)}
										{districtOptions.map((d) => (
											<SelectItem key={d} value={d}>
												{d}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									Kelurahan / Desa <span className="text-red-500">*</span>
								</Label>
								<Select
									disabled={!formData.addressDistrict || loadingVillages}
									value={formData.addressVillage}
									onValueChange={(val) =>
										updateData("addressVillage", val || "")
									}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												!formData.addressDistrict
													? "Pilih kecamatan dahulu"
													: loadingVillages
														? "Memuat kelurahan..."
														: "Pilih Kelurahan / Desa"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{formData.addressVillage &&
											!villageOptions.includes(formData.addressVillage) && (
												<SelectItem value={formData.addressVillage}>
													{formData.addressVillage}
												</SelectItem>
											)}
										{villageOptions.map((v) => (
											<SelectItem key={v} value={v}>
												{v}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
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
									required
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

							<div className="space-y-2 md:col-span-2">
								<Label>
									Pilihan Kelas <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.classType}
									onValueChange={(v) => updateData("classType", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Tipe Kelas" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Offline">Offline</SelectItem>
										<SelectItem value="Online-LMS">Online-LMS</SelectItem>
										<SelectItem value="Blended Learning (Online & Offline)">
											Blended Learning (Online & Offline)
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label>
									Angkatan & Tahun Ajaran{" "}
									<span className="text-red-500">*</span>
								</Label>
								<Select
									value={
										formData.cohort && formData.academicYear
											? `${formData.cohort}|${formData.academicYear}`
											: ""
									}
									onValueChange={(val) => {
										const [cVal, yVal] = (val || "").split("|");
										setFormData((prev) => ({
											...prev,
											cohort: cVal || "",
											academicYear: yVal || "",
										}));
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih Angkatan & Tahun Ajaran" />
									</SelectTrigger>
									<SelectContent>
										{cohortOptions.map((opt) => (
											<SelectItem
												key={opt.cohort}
												value={`${opt.cohort}|${opt.academicYear}`}
											>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									Pilihan dihitung otomatis: Angkatan {formData.cohort || "-"}{" "}
									(Tahun Ajaran {formData.academicYear || "-"})
								</p>
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
									Jurusan Sekolah{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
								</Label>
								<Input
									placeholder="IPA / IPS / Kejuruan..."
									value={formData.schoolMajor}
									onChange={(e) => updateData("schoolMajor", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Tahun Lulus <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="2023"
									value={formData.graduationYear}
									onKeyDown={preventNonNumericKey}
									onChange={(e) =>
										updateData(
											"graduationYear",
											filterNumeric(
												e.target.value,
												4,
												"Tahun lulus harus berupa 4 digit angka",
											),
										)
									}
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
										<SelectItem value="Belum Diketahui">
											Belum Diketahui
										</SelectItem>
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
									placeholder="170"
									value={formData.height}
									onKeyDown={preventNonNumericKey}
									onChange={(e) =>
										updateData(
											"height",
											filterNumeric(
												e.target.value,
												3,
												"Tinggi badan berupa angka (cm)",
											),
										)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Berat Badan (kg) <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="60"
									value={formData.weight}
									onKeyDown={preventNonNumericKey}
									onChange={(e) =>
										updateData(
											"weight",
											filterNumeric(
												e.target.value,
												3,
												"Berat badan berupa angka (kg)",
											),
										)
									}
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
							{/* Riwayat Patah Tulang */}
							<div className="space-y-4 md:col-span-2 p-4 border rounded-lg bg-slate-50/50">
								<div className="space-y-2">
									<Label className="text-sm font-medium">
										Pernah Mengalami Patah Tulang?{" "}
										<span className="text-red-500">*</span>
									</Label>
									<RadioGroup
										value={formData.hasBoneFracture}
										onValueChange={(val) => {
											setFormData((prev) => ({
												...prev,
												hasBoneFracture: val,
												boneFractureLocation:
													val === "Tidak" ? "" : prev.boneFractureLocation,
												boneFractureYear:
													val === "Tidak" ? "" : prev.boneFractureYear,
											}));
										}}
										className="flex gap-6 mt-1"
									>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="Tidak" id="bone-no" />
											<Label
												htmlFor="bone-no"
												className="cursor-pointer font-normal"
											>
												Tidak Pernah
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="Ya" id="bone-yes" />
											<Label
												htmlFor="bone-yes"
												className="cursor-pointer font-normal"
											>
												Pernah
											</Label>
										</div>
									</RadioGroup>
								</div>

								{formData.hasBoneFracture === "Ya" && (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t mt-3">
										<div className="space-y-2">
											<Label>
												Bagian Tubuh yang Patah{" "}
												<span className="text-red-500">*</span>
											</Label>
											<Input
												placeholder="Contoh: Lengan Kanan, Kaki Kiri, Tulang Selangka"
												value={formData.boneFractureLocation}
												onChange={(e) =>
													updateData("boneFractureLocation", e.target.value)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>
												Tahun Kejadian <span className="text-red-500">*</span>
											</Label>
											<Input
												placeholder="Contoh: 2021"
												maxLength={4}
												value={formData.boneFractureYear}
												onKeyDown={preventNonNumericKey}
												onChange={(e) =>
													updateData(
														"boneFractureYear",
														filterNumeric(
															e.target.value,
															4,
															"Tahun harus berupa 4 digit angka",
														),
													)
												}
											/>
										</div>
									</div>
								)}
							</div>

							{/* Riwayat Operasi */}
							<div className="space-y-4 md:col-span-2 p-4 border rounded-lg bg-slate-50/50">
								<div className="space-y-2">
									<Label className="text-sm font-medium">
										Pernah Menjalani Operasi?{" "}
										<span className="text-red-500">*</span>
									</Label>
									<RadioGroup
										value={formData.hasSurgery}
										onValueChange={(val) => {
											setFormData((prev) => ({
												...prev,
												hasSurgery: val,
												surgeryType: val === "Tidak" ? "" : prev.surgeryType,
												surgeryYear: val === "Tidak" ? "" : prev.surgeryYear,
											}));
										}}
										className="flex gap-6 mt-1"
									>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="Tidak" id="surgery-no" />
											<Label
												htmlFor="surgery-no"
												className="cursor-pointer font-normal"
											>
												Tidak Pernah
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="Ya" id="surgery-yes" />
											<Label
												htmlFor="surgery-yes"
												className="cursor-pointer font-normal"
											>
												Pernah
											</Label>
										</div>
									</RadioGroup>
								</div>

								{formData.hasSurgery === "Ya" && (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t mt-3">
										<div className="space-y-2">
											<Label>
												Jenis / Rincian Operasi{" "}
												<span className="text-red-500">*</span>
											</Label>
											<Input
												placeholder="Contoh: Operasi Usus Buntu, Amandel, Patah Tulang"
												value={formData.surgeryType}
												onChange={(e) =>
													updateData("surgeryType", e.target.value)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label>
												Tahun Operasi <span className="text-red-500">*</span>
											</Label>
											<Input
												placeholder="Contoh: 2022"
												maxLength={4}
												value={formData.surgeryYear}
												onKeyDown={preventNonNumericKey}
												onChange={(e) =>
													updateData(
														"surgeryYear",
														filterNumeric(
															e.target.value,
															4,
															"Tahun harus berupa 4 digit angka",
														),
													)
												}
											/>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* TAB 4: Wali */}
				{currentTab === 3 && (
					<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
						<h3 className="font-semibold text-lg border-b pb-2">
							Keterangan Wali
						</h3>

						{/* Pertanyaan Penentu Peran Wali */}
						<div className="space-y-3 p-4 border rounded-lg bg-slate-50/70">
							<Label className="text-sm font-medium">
								Siapa yang Bertindak Sebagai Wali Mahasiswa?{" "}
								<span className="text-red-500">*</span>
							</Label>
							<RadioGroup
								value={formData.waliRole || "ayah"}
								onValueChange={(val) => {
									setFormData((prev) => ({
										...prev,
										waliRole: val,
										...(val === "ayah"
											? {
													waliName: prev.ayahName,
													waliGuardianRelation: "Ayah Kandung",
													waliNationality: prev.ayahNationality,
													waliNationalityOther: prev.ayahNationalityOther,
													waliPhone: prev.ayahPhone,
													waliEmail: prev.ayahEmail,
													waliAddress: prev.ayahAddress,
													waliBirthPlace: prev.ayahBirthPlace,
													waliBirthDate: prev.ayahBirthDate,
													waliReligion: prev.ayahReligion,
													waliEducation: prev.ayahEducation,
													waliJob: prev.ayahJob,
												}
											: val === "ibu"
												? {
														waliName: prev.ibuName,
														waliGuardianRelation: "Ibu Kandung",
														waliNationality: prev.ibuNationality,
														waliNationalityOther: prev.ibuNationalityOther,
														waliPhone: prev.ibuPhone,
														waliEmail: prev.ibuEmail,
														waliAddress: prev.ibuAddress,
														waliBirthPlace: prev.ibuBirthPlace,
														waliBirthDate: prev.ibuBirthDate,
														waliReligion: prev.ibuReligion,
														waliEducation: prev.ibuEducation,
														waliJob: prev.ibuJob,
													}
												: {
														waliName: "",
														waliGuardianRelation: "",
														waliNationality: "Indonesia",
														waliNationalityOther: "",
														waliPhone: "",
														waliEmail: "",
														waliAddress: "",
														waliBirthPlace: "",
														waliBirthDate: "",
														waliReligion: "",
														waliEducation: "",
														waliJob: "",
													}),
									}));
								}}
								className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1"
							>
								<div className="flex items-center space-x-2.5 p-3 bg-white border rounded-md shadow-xs cursor-pointer hover:border-primary">
									<RadioGroupItem value="ayah" id="add-wali-ayah" />
									<Label
										htmlFor="add-wali-ayah"
										className="cursor-pointer font-medium text-sm"
									>
										Ayah Kandung
									</Label>
								</div>
								<div className="flex items-center space-x-2.5 p-3 bg-white border rounded-md shadow-xs cursor-pointer hover:border-primary">
									<RadioGroupItem value="ibu" id="add-wali-ibu" />
									<Label
										htmlFor="add-wali-ibu"
										className="cursor-pointer font-medium text-sm"
									>
										Ibu Kandung
									</Label>
								</div>
								<div className="flex items-center space-x-2.5 p-3 bg-white border rounded-md shadow-xs cursor-pointer hover:border-primary">
									<RadioGroupItem value="lainnya" id="add-wali-lainnya" />
									<Label
										htmlFor="add-wali-lainnya"
										className="cursor-pointer font-medium text-sm"
									>
										Wali Lainnya
									</Label>
								</div>
							</RadioGroup>
						</div>

						{/* Tampilan Konfirmasi Otomatis bila Ayah Kandung */}
						{formData.waliRole === "ayah" && (
							<div className="p-4 border border-blue-200 bg-blue-50/60 rounded-lg text-sm text-blue-950 space-y-2">
								<div className="font-semibold flex items-center gap-2 text-blue-900">
									<CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
									Data Wali Tersinkronisasi Otomatis dengan Ayah Kandung
								</div>
								<p className="text-xs text-blue-800">
									Nama Wali:{" "}
									<strong>
										{formData.ayahName || "(Akan diisi di Tab 4: Ayah Kandung)"}
									</strong>{" "}
									| Status: <strong>{formData.ayahStatus}</strong> |
									Kewarganegaraan: <strong>{formData.ayahNationality}</strong>
								</p>
								<p className="text-[11px] text-blue-600">
									Sistem akan otomatis menggunakan identitas Ayah Kandung
									sebagai wali tanpa perlu pengisian berulang. Silakan klik
									tombol &apos;Selanjutnya&apos; untuk melengkapi data Ayah
									Kandung.
								</p>
							</div>
						)}

						{/* Tampilan Konfirmasi Otomatis bila Ibu Kandung */}
						{formData.waliRole === "ibu" && (
							<div className="p-4 border border-blue-200 bg-blue-50/60 rounded-lg text-sm text-blue-950 space-y-2">
								<div className="font-semibold flex items-center gap-2 text-blue-900">
									<CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
									Data Wali Tersinkronisasi Otomatis dengan Ibu Kandung
								</div>
								<p className="text-xs text-blue-800">
									Nama Wali:{" "}
									<strong>
										{formData.ibuName || "(Akan diisi di Tab 5: Ibu Kandung)"}
									</strong>{" "}
									| Status: <strong>{formData.ibuStatus}</strong> |
									Kewarganegaraan: <strong>{formData.ibuNationality}</strong>
								</p>
								<p className="text-[11px] text-blue-600">
									Sistem akan otomatis menggunakan identitas Ibu Kandung sebagai
									wali tanpa perlu pengisian berulang. Silakan klik tombol
									&apos;Selanjutnya&apos; untuk melengkapi data orang tua.
								</p>
							</div>
						)}

						{/* Form Mandiri bila Wali Lainnya */}
						{formData.waliRole === "lainnya" && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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
										placeholder="Paman / Bibi / Kakek / Saudara Kandung"
										value={formData.waliGuardianRelation}
										onChange={(e) =>
											updateData("waliGuardianRelation", e.target.value)
										}
									/>
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
										Tempat Lahir{" "}
										<span className="text-muted-foreground text-xs font-normal">
											(Opsional)
										</span>
									</Label>
									<Input
										placeholder="Kota kelahiran"
										value={formData.waliBirthPlace}
										onChange={(e) =>
											updateData("waliBirthPlace", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>
										Tanggal Lahir{" "}
										<span className="text-muted-foreground text-xs font-normal">
											(Opsional)
										</span>
									</Label>
									<Input
										type="date"
										value={formData.waliBirthDate}
										onChange={(e) =>
											updateData("waliBirthDate", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>
										Agama{" "}
										<span className="text-muted-foreground text-xs font-normal">
											(Opsional)
										</span>
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
										Pendidikan Terakhir{" "}
										<span className="text-muted-foreground text-xs font-normal">
											(Opsional)
										</span>
									</Label>
									<Input
										placeholder="SD/SMP/SMA/S1..."
										value={formData.waliEducation}
										onChange={(e) =>
											updateData("waliEducation", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>
										Pekerjaan{" "}
										<span className="text-muted-foreground text-xs font-normal">
											(Opsional)
										</span>
									</Label>
									<Input
										placeholder="Pekerjaan wali"
										value={formData.waliJob}
										onChange={(e) => updateData("waliJob", e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label>
										Nomor HP{" "}
										<span className="text-muted-foreground text-xs font-normal">
											(Opsional)
										</span>
									</Label>
									<Input
										type="tel"
										placeholder="0812xxxx"
										value={formData.waliPhone}
										onKeyDown={preventNonPhoneKey}
										onChange={(e) =>
											updateData("waliPhone", filterPhone(e.target.value, 15))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>
										Email{" "}
										<span className="text-muted-foreground text-xs font-normal">
											(Opsional)
										</span>
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
										Alamat Lengkap{" "}
										<span className="text-muted-foreground text-xs font-normal">
											(Opsional)
										</span>
									</Label>
									<Textarea
										placeholder="Alamat lengkap wali"
										value={formData.waliAddress}
										onChange={(e) => updateData("waliAddress", e.target.value)}
									/>
								</div>
							</div>
						)}
					</div>
				)}

				{/* TAB 5: Ayah Kandung */}
				{currentTab === 4 && (
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
									Tempat Lahir{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
								</Label>
								<Input
									placeholder="Kota kelahiran"
									value={formData.ayahBirthPlace}
									onChange={(e) => updateData("ayahBirthPlace", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Tanggal Lahir{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
								</Label>
								<Input
									type="date"
									value={formData.ayahBirthDate}
									onChange={(e) => updateData("ayahBirthDate", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Agama{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
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
									Pendidikan Terakhir{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
								</Label>
								<Input
									placeholder="SD/SMP/SMA/S1..."
									value={formData.ayahEducation}
									onChange={(e) => updateData("ayahEducation", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Pekerjaan{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
								</Label>
								<Input
									placeholder="Wiraswasta/PNS/Pegawai Swasta"
									value={formData.ayahJob}
									onChange={(e) => updateData("ayahJob", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Nomor HP{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
								</Label>
								<Input
									type="tel"
									placeholder="0812xxxx"
									value={formData.ayahPhone}
									onKeyDown={preventNonPhoneKey}
									onChange={(e) =>
										updateData("ayahPhone", filterPhone(e.target.value, 15))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Email{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
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
									Alamat Lengkap{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
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

				{/* TAB 6: Ibu Kandung */}
				{currentTab === 5 && (
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
									Tempat Lahir{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
								</Label>
								<Input
									placeholder="Kota kelahiran"
									value={formData.ibuBirthPlace}
									onChange={(e) => updateData("ibuBirthPlace", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Tanggal Lahir{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
								</Label>
								<Input
									type="date"
									value={formData.ibuBirthDate}
									onChange={(e) => updateData("ibuBirthDate", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Agama{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
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
									Pendidikan Terakhir{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
								</Label>
								<Input
									placeholder="SD/SMP/SMA/S1..."
									value={formData.ibuEducation}
									onChange={(e) => updateData("ibuEducation", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Pekerjaan{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
								</Label>
								<Input
									placeholder="Ibu Rumah Tangga/PNS/Dll"
									value={formData.ibuJob}
									onChange={(e) => updateData("ibuJob", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Nomor HP{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
								</Label>
								<Input
									type="tel"
									placeholder="0812xxxx"
									value={formData.ibuPhone}
									onKeyDown={preventNonPhoneKey}
									onChange={(e) =>
										updateData("ibuPhone", filterPhone(e.target.value, 15))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									Email{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
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
									Alamat Lengkap{" "}
									<span className="text-muted-foreground text-xs font-normal">
										(Opsional)
									</span>
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

				{/* TAB 7: Informasi PMB, Rekomendasi & Referral */}
				{currentTab === 6 && (
					<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
							<div>
								<h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
									<Building2 className="w-5 h-5 text-[#0517B0]" />
									Informasi PMB, Rekomendasi & Referral
								</h3>
								<p className="text-xs text-slate-500 mt-0.5">
									Lengkapi data asal rekomendasi pendaftaran dan tim akuisisi
									PMB.
								</p>
							</div>
							<span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#0517B0] rounded-md border border-blue-100 self-start sm:self-auto">
								Panel PMB
							</span>
						</div>

						{/* Seksi 1: Asal Referral & Rekomendasi Terstruktur */}
						<div className="p-5 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white rounded-xl border border-blue-200/70 space-y-4 shadow-xs">
							<div className="flex items-center gap-2">
								<div className="p-1.5 bg-blue-100 text-[#0517B0] rounded-lg">
									<Award className="w-4 h-4" />
								</div>
								<div>
									<h4 className="font-semibold text-slate-900 text-sm">
										Asal Rekomendasi & Referral Terstruktur
									</h4>
									<p className="text-[11px] text-slate-500">
										Data pihak yang merekomendasikan pendaftar untuk fee
										sharing, komisi, dan tracking referral PMB.
									</p>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
								{/* Rekomendasi */}
								<div className="space-y-2">
									<Label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
										<span>Jenis Rekomendasi</span>
										<span className="text-red-500">*</span>
									</Label>
									<Select
										value={formData.rekomendasi}
										onValueChange={(v) => updateData("rekomendasi", v)}
									>
										<SelectTrigger className="bg-white">
											<SelectValue placeholder="Pilih Jenis Rekomendasi" />
										</SelectTrigger>
										<SelectContent>
											{REKOMENDASI_OPTIONS.map((item) => (
												<SelectItem key={item} value={item}>
													{item}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Kategori Referral */}
								<div className="space-y-2">
									<Label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
										<span>Kategori Referral</span>
									</Label>
									<Select
										value={formData.referralCategory}
										onValueChange={(v) => updateData("referralCategory", v)}
									>
										<SelectTrigger className="bg-white">
											<SelectValue placeholder="Pilih Kategori Referral" />
										</SelectTrigger>
										<SelectContent>
											{REFERRAL_CATEGORY_OPTIONS.map((opt) => (
												<SelectItem key={opt.value} value={opt.value}>
													{opt.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Nama Institusi / Lembaga Referral */}
								<div className="space-y-2">
									<Label className="text-xs font-semibold text-slate-700">
										Nama Institusi / Lembaga / Sekolah Referral
									</Label>
									<Input
										placeholder="Contoh: SMKN 1 Denpasar / BKK Karya Mandiri"
										value={formData.referralInstitutionName}
										onChange={(e) =>
											updateData("referralInstitutionName", e.target.value)
										}
										className="bg-white"
									/>
								</div>

								{/* Nama Kontak PIC Referral */}
								<div className="space-y-2">
									<Label className="text-xs font-semibold text-slate-700">
										Nama Kontak / Guru / PIC yang Merekomendasikan
									</Label>
									<Input
										placeholder="Nama lengkap pemberi rekomendasi"
										value={formData.referralContactName}
										onChange={(e) =>
											updateData("referralContactName", e.target.value)
										}
										className="bg-white"
									/>
								</div>

								{/* No HP Kontak Referral */}
								<div className="space-y-2 md:col-span-2">
									<Label className="text-xs font-semibold text-slate-700">
										No. WhatsApp / HP Kontak Referral
									</Label>
									<Input
										type="tel"
										placeholder="0812xxxx (untuk komunikasi fee share atau validasi)"
										value={formData.referralContactPhone}
										onKeyDown={preventNonPhoneKey}
										onChange={(e) =>
											updateData(
												"referralContactPhone",
												filterPhone(e.target.value, 15),
											)
										}
										className="bg-white"
									/>
								</div>
							</div>
						</div>

						{/* Seksi 2: Tim Akuisisi PMB & Periode */}
						<div className="p-5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-4">
							<div className="flex items-center gap-2">
								<div className="p-1.5 bg-slate-200/70 text-slate-700 rounded-lg">
									<UserPlus className="w-4 h-4" />
								</div>
								<div>
									<h4 className="font-semibold text-slate-900 text-sm">
										Tim Akuisisi PMB & Periode Studi
									</h4>
									<p className="text-[11px] text-slate-500">
										Informasi penanggung jawab akuisisi dan jadwal keberangkatan
										mahasiswa.
									</p>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
								{/* Periode Keberangkatan */}
								<div className="space-y-2">
									<Label className="text-xs font-semibold text-slate-700">
										Periode Keberangkatan / Intake
									</Label>
									<Input
										placeholder="Contoh: 2026/2027 atau Batch 1"
										value={formData.period}
										onChange={(e) => updateData("period", e.target.value)}
										className="bg-white"
									/>
								</div>

								{/* Tim Visit */}
								<div className="space-y-2">
									<Label className="text-xs font-semibold text-slate-700">
										Tim Visit PMB
									</Label>
									<Input
										placeholder="Nama tim visit (isi '-' jika tidak ada)"
										value={formData.timVisit}
										onChange={(e) => updateData("timVisit", e.target.value)}
										className="bg-white"
									/>
								</div>

								{/* Tim Sosialisasi */}
								<div className="space-y-2">
									<Label className="text-xs font-semibold text-slate-700">
										Tim Sosialisasi PMB
									</Label>
									<Input
										placeholder="Nama tim sosialisasi (isi '-' jika tidak ada)"
										value={formData.timSosialisasi}
										onChange={(e) =>
											updateData("timSosialisasi", e.target.value)
										}
										className="bg-white"
									/>
								</div>

								{/* RO Referral */}
								<div className="space-y-2">
									<Label className="text-xs font-semibold text-slate-700">
										RO Referral
									</Label>
									<Input
										placeholder="Nama / kode RO Referral"
										value={formData.roReferral}
										onChange={(e) => updateData("roReferral", e.target.value)}
										className="bg-white"
									/>
								</div>

								{/* Mitra Sponsor */}
								<div className="space-y-2">
									<Label className="text-xs font-semibold text-slate-700">
										Mitra Sponsor
									</Label>
									<Input
										placeholder="Nama mitra sponsor pembiayaan"
										value={formData.mitraSponsor}
										onChange={(e) => updateData("mitraSponsor", e.target.value)}
										className="bg-white"
									/>
								</div>

								{/* Koordinator PMB */}
								<div className="space-y-2">
									<Label className="text-xs font-semibold text-slate-700">
										Koordinator PMB
									</Label>
									<Input
										placeholder="Nama koordinator PMB"
										value={formData.koordinator}
										onChange={(e) => updateData("koordinator", e.target.value)}
										className="bg-white"
									/>
								</div>
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
						>
							Sebelumnya
						</Button>
					) : (
						<div></div> // Spacer
					)}

					{currentTab < TABS.length - 1 ? (
						<Button
							type="button"
							className="bg-[#0517B0] hover:bg-blue-800 text-white min-w-[120px]"
							onClick={handleNext}
						>
							Selanjutnya
						</Button>
					) : (
						<Button
							type="button"
							className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px]"
							onClick={handleSubmit}
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								"Simpan Mahasiswa"
							)}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
