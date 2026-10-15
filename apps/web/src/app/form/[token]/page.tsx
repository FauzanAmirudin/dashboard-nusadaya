"use client";

import {
	AlertCircle,
	AlertTriangle,
	ArrowLeft,
	Building2,
	CheckCircle2,
	Copy,
	HeartPulse,
	Loader2,
	PhoneCall,
	Plus,
	Trash2,
	UploadCloud,
	UserPlus,
	Users,
	XCircle,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { API_URL } from "@/lib/eden";
import {
	filterNumeric,
	filterPhone,
	isValidEmail,
	preventNonNumericKey,
	preventNonPhoneKey,
	validateIndonesianPhone,
} from "@/utils/form-validators";

const TABS = [
	"Keterangan Mahasiswa",
	"Keterangan Pendidikan",
	"Keterangan Kesehatan",
	"Keterangan Ayah Kandung",
	"Keterangan Ibu Kandung",
	"Keterangan Wali",
	"Informasi PMB & Referensi",
	"Kontak & Darurat",
];

import { getPeminatanOption, PEMINATAN_OPTIONS } from "@/lib/peminatan";
import {
	formatReferralCategory,
	REFERRAL_CATEGORY_OPTIONS,
} from "@/lib/referral";

const mapExistingDataToFormData = (d: any) => {
	const formatDate = (val: any) => {
		if (!val) return "";
		try {
			const date = new Date(val);
			if (Number.isNaN(date.getTime())) return "";
			return date.toISOString().split("T")[0];
		} catch {
			return "";
		}
	};

	const parseNationality = (val: string | null | undefined) => {
		if (!val) return { nationality: "Indonesia", nationalityOther: "" };
		if (val === "Indonesia")
			return { nationality: "Indonesia", nationalityOther: "" };
		return { nationality: "Lainnya", nationalityOther: val };
	};

	const parseClothing = (val: string | null | undefined) => {
		if (!val) return { clothingSize: "", clothingSizeOther: "" };
		if (["XS", "S", "M", "L", "XL", "XXL"].includes(val)) {
			return { clothingSize: val, clothingSizeOther: "" };
		}
		return { clothingSize: "Lainnya", clothingSizeOther: val };
	};

	const natMhs = parseNationality(d.nationality);
	const natAyah = parseNationality(d.ayahNationality);
	const natIbu = parseNationality(d.ibuNationality);
	const natWali = parseNationality(d.waliNationality);
	const cloth = parseClothing(d.clothingSize);

	const rawFriends = Array.isArray(d.friendContacts) ? d.friendContacts : [];
	const friendCount = Math.min(Math.max(rawFriends.length, 3), 5);
	const friendContacts = Array.from({ length: friendCount }, (_, i) => ({
		name: rawFriends[i]?.name || "",
		phone: rawFriends[i]?.phone || "",
		schoolOrRelation:
			rawFriends[i]?.schoolOrRelation ||
			rawFriends[i]?.school_or_relation ||
			"",
	}));

	return {
		name: d.name || "",
		nickname: d.nickname || "",
		gender: d.gender || "",
		birthPlace: d.birthPlace || "",
		birthDate: formatDate(d.birthDate),
		religion: d.religion || "",
		nationality: natMhs.nationality,
		nationalityOther: natMhs.nationalityOther,
		addressStreet: d.addressStreet || "",
		addressRt: d.addressRt || "",
		addressRw: d.addressRw || "",
		addressNo: d.addressNo || "",
		addressVillage: d.addressVillage || "",
		addressDistrict: d.addressDistrict || "",
		addressCity: d.addressCity || "",
		addressProvince: d.addressProvince || "",
		livingWith: d.livingWith || "",
		phone: d.phone || "",
		email: d.email || "",

		schoolOrigin: d.schoolOrigin || "",
		schoolAddress: d.schoolAddress || "",
		schoolMajor: d.schoolMajor || "",
		graduationYear: d.graduationYear ? String(d.graduationYear) : "",
		program: d.program || "",
		subProgram: d.subProgram || "",
		classType: d.classType || "",
		academicYear: d.academicYear || "",
		cohort: d.batch ? String(d.batch) : "14",

		bloodType: d.bloodType || "",
		diseaseHistory: d.diseaseHistory || "",
		congenitalDisease: d.congenitalDisease || "",
		height: d.height ? String(d.height) : "",
		weight: d.weight ? String(d.weight) : "",
		clothingSize: cloth.clothingSize,
		clothingSizeOther: cloth.clothingSizeOther,

		ayahName: d.ayahName || "",
		ayahBirthPlace: d.ayahBirthPlace || "",
		ayahBirthDate: formatDate(d.ayahBirthDate),
		ayahReligion: d.ayahReligion || "",
		ayahNationality: natAyah.nationality,
		ayahNationalityOther: natAyah.nationalityOther,
		ayahEducation: d.ayahEducation || "",
		ayahJob: d.ayahJob || "",
		ayahAddress: d.ayahAddress || "",
		ayahPhone: d.ayahPhone || "",
		ayahEmail: d.ayahEmail || "",
		ayahStatus: d.ayahStatus || "Hidup",

		ibuName: d.ibuName || "",
		ibuBirthPlace: d.ibuBirthPlace || "",
		ibuBirthDate: formatDate(d.ibuBirthDate),
		ibuReligion: d.ibuReligion || "",
		ibuNationality: natIbu.nationality,
		ibuNationalityOther: natIbu.nationalityOther,
		ibuEducation: d.ibuEducation || "",
		ibuJob: d.ibuJob || "",
		ibuAddress: d.ibuAddress || "",
		ibuPhone: d.ibuPhone || "",
		ibuEmail: d.ibuEmail || "",
		ibuStatus: d.ibuStatus || "Hidup",

		waliName: d.waliName || "",
		waliBirthPlace: d.waliBirthPlace || "",
		waliBirthDate: formatDate(d.waliBirthDate),
		waliReligion: d.waliReligion || "",
		waliNationality: natWali.nationality,
		waliNationalityOther: natWali.nationalityOther,
		waliEducation: d.waliEducation || "",
		waliJob: d.waliJob || "",
		waliAddress: d.waliAddress || "",
		waliPhone: d.waliPhone || "",
		waliEmail: d.waliEmail || "",
		waliGuardianRelation: d.waliGuardianRelation || "",

		// Tab 7: Informasi PMB & Referensi
		period: d.period || "",
		rekomendasi: d.rekomendasi || "",
		timVisit: d.timVisit || "",
		timSosialisasi: d.timSosialisasi || "",
		roReferral: d.roReferral || "",
		mitraSponsor: d.mitraSponsor || "",
		koordinator: d.koordinator || "",
		referralCategory: d.referralCategory || "",
		referralInstitutionName: d.referralInstitutionName || "",
		referralContactName: d.referralContactName || "",
		referralContactPhone: d.referralContactPhone || "",

		// Tab 8: Kontak & Darurat
		emergencyContactName: d.emergencyContactName || "",
		emergencyContactPhone: d.emergencyContactPhone || "",
		emergencyContactRelation: d.emergencyContactRelation || "",
		recommendedBy: d.recommendedBy || "",
		recommenderName: d.recommenderName || "",
		friendContacts,
	};
};

interface RejectedField {
	fieldKey: string;
	fieldLabel: string;
	tabIndex: number;
	reason?: string;
}

function FieldRejectionBadge({
	fieldKey,
	map,
}: {
	fieldKey: string;
	map: Map<string, RejectedField>;
}) {
	const rej = map.get(fieldKey);
	if (!rej) return null;
	return (
		<span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full ml-1.5 shadow-2xs">
			<XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
			Perlu Diperbaiki
		</span>
	);
}

function FieldRejectionAlert({
	fieldKey,
	map,
}: {
	fieldKey: string;
	map: Map<string, RejectedField>;
}) {
	const rej = map.get(fieldKey);
	if (!rej || !rej.reason) return null;
	return (
		<div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-lg mt-1.5 flex items-start gap-2 shadow-2xs animate-in fade-in duration-200">
			<AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
			<div className="flex-1 leading-relaxed">
				<strong className="font-semibold text-rose-900">
					Catatan Revisi:{" "}
				</strong>
				<span>{rej.reason}</span>
			</div>
		</div>
	);
}

export default function FormMahasiswaPublic() {
	const params = useParams();
	const searchParams = useSearchParams();
	const token = (params?.token as string) || "";
	const [isValidating, setIsValidating] = useState(true);
	const [isValidToken, setIsValidToken] = useState(false);
	const [isApprovedMessage, setIsApprovedMessage] = useState(false);
	const [responseStatus, setResponseStatus] = useState<
		"PENDING" | "REJECTED" | "APPROVED" | null
	>(null);
	const [rejectionNotes, setRejectionNotes] = useState<string | null>(null);
	const [rejectedTabs, setRejectedTabs] = useState<number[]>([]);
	const [rejectedFields, setRejectedFields] = useState<RejectedField[]>([]);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [currentTab, setCurrentTab] = useState(0);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

	const rejectedFieldsMap = useMemo(() => {
		const map = new Map<string, RejectedField>();
		for (const f of rejectedFields) {
			map.set(f.fieldKey, f);
		}
		return map;
	}, [rejectedFields]);

	const isFieldRejected = (key: string) => rejectedFieldsMap.has(key);
	const getFieldBorderClass = (key: string, baseClass = "") => {
		if (!isFieldRejected(key)) return baseClass;
		return `${baseClass} border-rose-500 bg-rose-50/20 ring-1 ring-rose-400 focus-visible:ring-rose-500 text-rose-950`.trim();
	};

	const currentTabRejectedFields = useMemo(() => {
		return rejectedFields.filter((f) => f.tabIndex === currentTab);
	}, [rejectedFields, currentTab]);

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

		// Tab 7: Informasi PMB & Referensi
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

		// Tab 8: Kontak & Darurat
		emergencyContactName: "",
		emergencyContactPhone: "",
		emergencyContactRelation: "",
		recommendedBy: "",
		recommenderName: "",
		friendContacts: [
			{ name: "", phone: "", schoolOrRelation: "" },
			{ name: "", phone: "", schoolOrRelation: "" },
			{ name: "", phone: "", schoolOrRelation: "" },
		] as Array<{ name: string; phone: string; schoolOrRelation: string }>,
	});

	// Validasi Token & Inisialisasi
	useEffect(() => {
		if (!token) return;
		const validate = async () => {
			try {
				const res = await fetch(`${API_URL}/form/${token}`);
				const data = await res.json();
				if (!res.ok || !data.valid) {
					if (
						data.isApproved ||
						data.message?.toLowerCase().includes("disetujui")
					) {
						setIsApprovedMessage(true);
					}
					setIsValidToken(false);
					setIsValidating(false);
					return;
				}

				setIsValidToken(true);
				if (data.responseStatus) {
					setResponseStatus(data.responseStatus);
				}
				if (data.rejectionNotes) {
					setRejectionNotes(data.rejectionNotes);
				}
				if (data.rejectedTabs && Array.isArray(data.rejectedTabs)) {
					setRejectedTabs(data.rejectedTabs);
				}
				if (data.rejectedFields && Array.isArray(data.rejectedFields)) {
					setRejectedFields(data.rejectedFields);
				}

				if (data.existingData) {
					const mapped = mapExistingDataToFormData(data.existingData);
					setFormData(mapped);
					if (data.existingData.profilePhotoUrl) {
						setPreviewUrl(data.existingData.profilePhotoUrl);
					}
				}

				// Deep-link ?tab=N (Task H-4) atau auto-jump ke tab pertama yang ditolak (Task H-3)
				const qTab = searchParams?.get("tab");
				if (qTab !== null && qTab !== undefined) {
					const parsed = parseInt(qTab, 10);
					if (!Number.isNaN(parsed) && parsed >= 0 && parsed < TABS.length) {
						setCurrentTab(parsed);
					}
				} else if (data.responseStatus === "REJECTED") {
					const allRejTabs: number[] = [];
					if (data.rejectedTabs && Array.isArray(data.rejectedTabs)) {
						allRejTabs.push(...data.rejectedTabs);
					}
					if (data.rejectedFields && Array.isArray(data.rejectedFields)) {
						for (const rf of data.rejectedFields) {
							if (
								typeof rf.tabIndex === "number" &&
								!allRejTabs.includes(rf.tabIndex)
							) {
								allRejTabs.push(rf.tabIndex);
							}
						}
					}
					if (allRejTabs.length > 0) {
						const firstRejected = Math.min(...allRejTabs);
						if (firstRejected >= 0 && firstRejected < TABS.length) {
							setCurrentTab(firstRejected);
						}
					}
				}
			} catch (e) {
				console.error(e);
				setIsValidToken(false);
			} finally {
				setIsValidating(false);
			}
		};
		validate();
	}, [token, searchParams]);

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
		const checkEmpty = (
			keys: (keyof typeof formData)[],
			labels?: Record<string, string>,
		) => {
			for (const key of keys) {
				const val = formData[key];
				if (typeof val === "string" && val.trim() === "") {
					const fieldLabel = labels?.[key] || key;
					toast.error(`Kolom "${fieldLabel}" wajib diisi`);
					return false;
				}
			}
			return true;
		};

		// Tab 1: Keterangan Mahasiswa
		if (index === 0) {
			if (!profilePhoto && !previewUrl) {
				toast.error(
					"Foto profil mahasiswa wajib diunggah (Maks. 2MB, JPG/PNG)",
				);
				return false;
			}
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
			const labels: Record<string, string> = {
				email: "Email Mahasiswa",
				name: "Nama Lengkap",
				nickname: "Nama Panggilan",
				birthPlace: "Tempat Lahir",
				birthDate: "Tanggal Lahir",
				gender: "Jenis Kelamin",
				religion: "Agama",
				nationality: "Kewarganegaraan",
				phone: "Nomor HP / WhatsApp Mahasiswa",
				livingWith: "Tinggal Dengan",
				addressStreet: "Jalan / Alamat Lengkap",
				addressRt: "RT",
				addressRw: "RW",
				addressNo: "No. Rumah",
				addressVillage: "Kelurahan / Desa",
				addressDistrict: "Kecamatan",
				addressCity: "Kabupaten / Kota",
				addressProvince: "Provinsi",
			};
			if (!checkEmpty(reqKeys, labels)) return false;

			if (!isValidEmail(formData.email)) {
				toast.error(
					"Format Email mahasiswa tidak valid (contoh: nama@email.com)",
				);
				return false;
			}

			const bDate = new Date(formData.birthDate);
			if (Number.isNaN(bDate.getTime()) || bDate > new Date()) {
				toast.error(
					"Tanggal lahir mahasiswa tidak valid atau tidak boleh di masa depan",
				);
				return false;
			}

			if (
				formData.nationality === "Lainnya" &&
				!formData.nationalityOther.trim()
			) {
				toast.error("Detail kewarganegaraan lainnya wajib diisi");
				return false;
			}

			const phoneErr = validateIndonesianPhone(
				formData.phone,
				"Nomor HP / WhatsApp Mahasiswa",
			);
			if (phoneErr) {
				toast.error(phoneErr);
				return false;
			}

			// Validasi ketat tipe data integer untuk RT dan RW
			if (!/^\d+$/.test(formData.addressRt.trim())) {
				toast.error("Kolom RT hanya boleh berupa angka numerik (contoh: 001)");
				return false;
			}
			if (!/^\d+$/.test(formData.addressRw.trim())) {
				toast.error("Kolom RW hanya boleh berupa angka numerik (contoh: 002)");
				return false;
			}
		} else if (index === 1) {
			// Tab 2: Keterangan Pendidikan
			const reqKeys: (keyof typeof formData)[] = [
				"program",
				"subProgram",
				"classType",
				"cohort",
				"academicYear",
				"schoolOrigin",
				"schoolMajor",
				"graduationYear",
				"schoolAddress",
			];
			const labels: Record<string, string> = {
				program: "Program Studi",
				subProgram: "Peminatan / Sub Program",
				classType: "Pilihan Kelas",
				cohort: "Angkatan",
				academicYear: "Tahun Ajaran",
				schoolOrigin: "Nama Sekolah Asal",
				schoolMajor: "Jurusan Sekolah",
				graduationYear: "Tahun Lulus",
				schoolAddress: "Alamat Sekolah",
			};
			if (!checkEmpty(reqKeys, labels)) return false;

			const grad = Number(formData.graduationYear);
			if (
				!formData.graduationYear ||
				Number.isNaN(grad) ||
				!Number.isInteger(grad) ||
				grad < 1970 ||
				grad > 2035
			) {
				toast.error(
					"Tahun lulus harus berupa 4 digit tahun angka yang valid (1970 - 2035)",
				);
				return false;
			}

			const cNum = Number(formData.cohort);
			if (
				!formData.cohort ||
				Number.isNaN(cNum) ||
				!Number.isInteger(cNum) ||
				cNum < 1 ||
				cNum > 99
			) {
				toast.error("Angkatan harus berupa bilangan bulat integer 1 - 99");
				return false;
			}

			if (!/^\d{4}\/\d{4}$/.test(formData.academicYear.trim())) {
				toast.error("Format Tahun Ajaran harus YYYY/YYYY (contoh: 2025/2026)");
				return false;
			}
		} else if (index === 2) {
			// Tab 3: Keterangan Kesehatan
			const reqKeys: (keyof typeof formData)[] = [
				"bloodType",
				"clothingSize",
				"height",
				"weight",
				"diseaseHistory",
				"congenitalDisease",
			];
			const labels: Record<string, string> = {
				bloodType: "Golongan Darah",
				clothingSize: "Ukuran Baju",
				height: "Tinggi Badan",
				weight: "Berat Badan",
				diseaseHistory: "Riwayat Penyakit",
				congenitalDisease: "Penyakit Bawaan",
			};
			if (!checkEmpty(reqKeys, labels)) return false;

			if (
				formData.clothingSize === "Lainnya" &&
				!formData.clothingSizeOther.trim()
			) {
				toast.error("Detail ukuran baju lainnya wajib diisi");
				return false;
			}

			const h = Number(formData.height);
			if (
				!formData.height ||
				Number.isNaN(h) ||
				!Number.isInteger(h) ||
				h < 50 ||
				h > 250
			) {
				toast.error(
					"Tinggi badan harus berupa angka integer dalam rentang 50 - 250 cm",
				);
				return false;
			}
			if (h < 150 || h > 220) {
				toast.warning(
					"Catatan: Tinggi badan di luar rentang standar umum (150–220 cm). Pastikan data sudah benar.",
				);
			}

			const w = Number(formData.weight);
			if (
				!formData.weight ||
				Number.isNaN(w) ||
				!Number.isInteger(w) ||
				w < 20 ||
				w > 250
			) {
				toast.error(
					"Berat badan harus berupa angka integer dalam rentang 20 - 250 kg",
				);
				return false;
			}
			if (w < 35 || w > 160) {
				toast.warning(
					"Catatan: Berat badan di luar rentang standar umum (35–160 kg). Pastikan data sudah benar.",
				);
			}
		} else if (index === 3) {
			// Tab 4: Ayah Kandung
			if (!formData.ayahName || !formData.ayahName.trim()) {
				toast.error("Nama lengkap Ayah wajib diisi");
				return false;
			}
			if (!formData.ayahStatus) {
				toast.error("Keadaan Ayah wajib dipilih");
				return false;
			}

			if (formData.ayahStatus !== "Meninggal") {
				const reqKeys: (keyof typeof formData)[] = [
					"ayahBirthPlace",
					"ayahBirthDate",
					"ayahReligion",
					"ayahNationality",
					"ayahEducation",
					"ayahJob",
					"ayahAddress",
					"ayahPhone",
					"ayahEmail",
				];
				const labels: Record<string, string> = {
					ayahBirthPlace: "Tempat Lahir Ayah",
					ayahBirthDate: "Tanggal Lahir Ayah",
					ayahReligion: "Agama Ayah",
					ayahNationality: "Kewarganegaraan Ayah",
					ayahEducation: "Pendidikan Terakhir Ayah",
					ayahJob: "Pekerjaan Ayah",
					ayahAddress: "Alamat Lengkap Ayah",
					ayahPhone: "Nomor HP Ayah",
					ayahEmail: "Email Ayah",
				};
				if (!checkEmpty(reqKeys, labels)) return false;

				if (
					formData.ayahNationality === "Lainnya" &&
					!formData.ayahNationalityOther.trim()
				) {
					toast.error("Detail kewarganegaraan Ayah lainnya wajib diisi");
					return false;
				}

				if (!isValidEmail(formData.ayahEmail)) {
					toast.error("Format Email Ayah tidak valid (contoh: ayah@email.com)");
					return false;
				}

				const phoneErr = validateIndonesianPhone(
					formData.ayahPhone,
					"Nomor HP Ayah",
				);
				if (phoneErr) {
					toast.error(phoneErr);
					return false;
				}
			}
		} else if (index === 4) {
			// Tab 5: Ibu Kandung
			if (!formData.ibuName || !formData.ibuName.trim()) {
				toast.error("Nama lengkap Ibu wajib diisi");
				return false;
			}
			if (!formData.ibuStatus) {
				toast.error("Keadaan Ibu wajib dipilih");
				return false;
			}

			if (formData.ibuStatus !== "Meninggal") {
				const reqKeys: (keyof typeof formData)[] = [
					"ibuBirthPlace",
					"ibuBirthDate",
					"ibuReligion",
					"ibuNationality",
					"ibuEducation",
					"ibuJob",
					"ibuAddress",
					"ibuPhone",
					"ibuEmail",
				];
				const labels: Record<string, string> = {
					ibuBirthPlace: "Tempat Lahir Ibu",
					ibuBirthDate: "Tanggal Lahir Ibu",
					ibuReligion: "Agama Ibu",
					ibuNationality: "Kewarganegaraan Ibu",
					ibuEducation: "Pendidikan Terakhir Ibu",
					ibuJob: "Pekerjaan Ibu",
					ibuAddress: "Alamat Lengkap Ibu",
					ibuPhone: "Nomor HP Ibu",
					ibuEmail: "Email Ibu",
				};
				if (!checkEmpty(reqKeys, labels)) return false;

				if (
					formData.ibuNationality === "Lainnya" &&
					!formData.ibuNationalityOther.trim()
				) {
					toast.error("Detail kewarganegaraan Ibu lainnya wajib diisi");
					return false;
				}

				if (!isValidEmail(formData.ibuEmail)) {
					toast.error("Format Email Ibu tidak valid (contoh: ibu@email.com)");
					return false;
				}

				const phoneErr = validateIndonesianPhone(
					formData.ibuPhone,
					"Nomor HP Ibu",
				);
				if (phoneErr) {
					toast.error(phoneErr);
					return false;
				}
			}
		} else if (index === 5) {
			// Tab 6: Wali (Wajib diisi lengkap)
			const reqKeys: (keyof typeof formData)[] = [
				"waliName",
				"waliGuardianRelation",
				"waliBirthPlace",
				"waliBirthDate",
				"waliReligion",
				"waliNationality",
				"waliEducation",
				"waliJob",
				"waliAddress",
				"waliPhone",
				"waliEmail",
			];
			const labels: Record<string, string> = {
				waliName: "Nama Lengkap Wali",
				waliGuardianRelation: "Hubungan dengan Mahasiswa (Wali)",
				waliBirthPlace: "Tempat Lahir Wali",
				waliBirthDate: "Tanggal Lahir Wali",
				waliReligion: "Agama Wali",
				waliNationality: "Kewarganegaraan Wali",
				waliEducation: "Pendidikan Terakhir Wali",
				waliJob: "Pekerjaan Wali",
				waliAddress: "Alamat Lengkap Wali",
				waliPhone: "Nomor HP Wali",
				waliEmail: "Email Wali",
			};
			if (!checkEmpty(reqKeys, labels)) return false;

			if (
				formData.waliNationality === "Lainnya" &&
				!formData.waliNationalityOther.trim()
			) {
				toast.error("Detail kewarganegaraan Wali lainnya wajib diisi");
				return false;
			}

			if (!isValidEmail(formData.waliEmail)) {
				toast.error("Format Email Wali tidak valid (contoh: wali@email.com)");
				return false;
			}

			const phoneErr = validateIndonesianPhone(
				formData.waliPhone,
				"Nomor HP Wali",
			);
			if (phoneErr) {
				toast.error(phoneErr);
				return false;
			}
		} else if (index === 6) {
			// Tab 7: Informasi PMB & Referensi
			const reqKeys: (keyof typeof formData)[] = [
				"referralCategory",
				"referralInstitutionName",
				"referralContactName",
				"referralContactPhone",
				"period",
				"rekomendasi",
				"timVisit",
				"timSosialisasi",
				"roReferral",
				"mitraSponsor",
				"koordinator",
			];
			const labels: Record<string, string> = {
				referralCategory: "Kategori Referral",
				referralInstitutionName: "Nama Institusi / Lembaga Referral",
				referralContactName: "Nama Kontak / PIC Referral",
				referralContactPhone: "Nomor WhatsApp Kontak / PIC Referral",
				period: "Periode Keberangkatan",
				rekomendasi: "Jenis Rekomendasi",
				timVisit: "Tim Visit",
				timSosialisasi: "Tim Sosialisasi",
				roReferral: "RO Referral",
				mitraSponsor: "Mitra Sponsor",
				koordinator: "Koordinator",
			};
			if (!checkEmpty(reqKeys, labels)) return false;

			const errRefPhone = validateIndonesianPhone(
				formData.referralContactPhone,
				"Nomor WhatsApp Kontak Referral",
			);
			if (errRefPhone) {
				toast.error(errRefPhone);
				return false;
			}
		} else if (index === 7) {
			// Tab 8: Kontak Kawan & Darurat
			const reqKeys: (keyof typeof formData)[] = [
				"emergencyContactName",
				"emergencyContactPhone",
				"emergencyContactRelation",
			];
			const labels: Record<string, string> = {
				emergencyContactName: "Nama Kontak Darurat",
				emergencyContactPhone: "Nomor WhatsApp Kontak Darurat",
				emergencyContactRelation:
					"Hubungan dengan Mahasiswa pada Kontak Darurat",
			};
			if (!checkEmpty(reqKeys, labels)) return false;

			const errEmPhone = validateIndonesianPhone(
				formData.emergencyContactPhone,
				"Nomor Kontak Darurat",
			);
			if (errEmPhone) {
				toast.error(errEmPhone);
				return false;
			}

			// Validasi Pertanyaan Siapa yang Merekomendasikan
			if (!formData.recommendedBy || formData.recommendedBy.trim() === "") {
				toast.error(
					"Pertanyaan 'Siapa yang merekomendasikan Anda?' wajib dipilih",
				);
				return false;
			}
			if (
				formData.recommendedBy !==
					"Media Sosial / Website / Brosur (Mandiri)" &&
				(!formData.recommenderName || formData.recommenderName.trim() === "")
			) {
				toast.error(
					"Nama lengkap orang / pihak yang merekomendasikan wajib diisi",
				);
				return false;
			}

			// Validasi fleksibel: Wajib minimal 3 dan maksimal 5 kontak kawan/rekan lengkap
			if (formData.friendContacts.length < 3) {
				toast.error("Wajib mengisi minimal 3 kontak kawan / rekan");
				return false;
			}

			for (let i = 0; i < formData.friendContacts.length; i++) {
				const fr = formData.friendContacts[i];
				if (!fr || !fr.name.trim()) {
					toast.error(`Nama kawan ke-${i + 1} wajib diisi`);
					return false;
				}
				if (!fr.phone.trim()) {
					toast.error(
						`Nomor WhatsApp kawan ke-${i + 1} (${fr.name || `Kawan ${i + 1}`}) wajib diisi`,
					);
					return false;
				}
				const frErr = validateIndonesianPhone(
					fr.phone,
					`Nomor WhatsApp kawan ke-${i + 1} (${fr.name})`,
				);
				if (frErr) {
					toast.error(frErr);
					return false;
				}
				if (!fr.schoolOrRelation || !fr.schoolOrRelation.trim()) {
					toast.error(
						`Asal sekolah / hubungan kawan ke-${i + 1} (${fr.name}) wajib diisi`,
					);
					return false;
				}
			}
		}
		return true;
	};

	const handleTabClick = (targetTab: number) => {
		if (targetTab === currentTab) return;

		// Jika mencoba melompat ke tab depan, seluruh tab sebelumnya wajib lolos validasi ketat
		if (targetTab > currentTab) {
			for (let t = currentTab; t < targetTab; t++) {
				if (!validateTab(t)) {
					setCurrentTab(t);
					window.scrollTo({ top: 0, behavior: "smooth" });
					return;
				}
			}
		}

		// Jika kembali ke tab sebelumnya untuk melihat/mengoreksi, diizinkan
		setCurrentTab(targetTab);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const updateFriendContact = (
		idx: number,
		field: "name" | "phone" | "schoolOrRelation",
		val: string,
	) => {
		setFormData((prev) => {
			const updated = [...prev.friendContacts];
			updated[idx] = { ...updated[idx], [field]: val };
			return { ...prev, friendContacts: updated };
		});
	};

	const addFriendContact = () => {
		if (formData.friendContacts.length >= 5) {
			toast.warning("Maksimal 5 kontak kawan yang diperbolehkan");
			return;
		}
		setFormData((prev) => ({
			...prev,
			friendContacts: [
				...prev.friendContacts,
				{ name: "", phone: "", schoolOrRelation: "" },
			],
		}));
		toast.success(
			`Form kontak kawan ke-${formData.friendContacts.length + 1} ditambahkan`,
		);
	};

	const removeFriendContact = (idxToRemove: number) => {
		if (formData.friendContacts.length <= 3) {
			toast.warning("Minimal 3 kontak kawan wajib diisi");
			return;
		}
		setFormData((prev) => ({
			...prev,
			friendContacts: prev.friendContacts.filter(
				(_, idx) => idx !== idxToRemove,
			),
		}));
		toast.info("Kontak kawan berhasil dihapus");
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
		// Validasi seluruh 8 tab secara ketat dan berurutan dari Tab 1 sampai Tab 8
		for (let t = 0; t < TABS.length; t++) {
			if (!validateTab(t)) {
				setCurrentTab(t);
				window.scrollTo({ top: 0, behavior: "smooth" });
				return;
			}
		}

		setIsLoading(true);
		toast.loading("Mengirim formulir...");

		try {
			let photoUrl = "";
			if (profilePhoto) {
				photoUrl = (await uploadPhoto()) || "";
			} else if (previewUrl) {
				photoUrl = previewUrl;
			}

			const payload = {
				...formData,
				batch: Number(formData.cohort),
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
				friendContacts: formData.friendContacts
					.filter((f) => f.name.trim() !== "" && f.phone.trim() !== "")
					.map((f) => ({
						name: f.name.trim(),
						phone: f.phone.trim(),
						schoolOrRelation: f.schoolOrRelation.trim(),
					})),
			};

			const res = await fetch(`${API_URL}/form/${token}/submit`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await res.json();
			if (data.success) {
				toast.dismiss();
				if (responseStatus === "PENDING" || responseStatus === "REJECTED") {
					toast.success("Perubahan data formulir berhasil disimpan!");
				} else {
					toast.success("Formulir pendaftaran berhasil dikirim!");
				}
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
		if (isApprovedMessage) {
			return (
				<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
					<div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full text-center">
						<div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
							<CheckCircle2 className="w-8 h-8" />
						</div>
						<h1 className="text-xl font-bold text-slate-800 mb-2">
							Pendaftaran Telah Disetujui
						</h1>
						<p className="text-slate-500 mb-6">
							Pendaftaran Anda telah di-ACC dan diproses ke dalam sistem
							akademik Nusadaya Academy. Tautan formulir ini sudah tidak dapat
							diubah lagi.
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
			<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
				<div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full text-center">
					<div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
						<XCircle className="w-8 h-8" />
					</div>
					<h1 className="text-xl font-bold text-slate-800 mb-2">
						Tautan Tidak Berlaku
					</h1>
					<p className="text-slate-500">
						Tautan formulir ini sudah tidak berlaku atau tidak ditemukan.
						Silakan hubungi admin PMB Nusadaya Academy untuk mendapatkan tautan
						baru.
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
						{responseStatus === "PENDING" || responseStatus === "REJECTED"
							? "Pembaruan Berhasil Dikirim!"
							: "Pendaftaran Berhasil!"}
					</h1>
					<p className="text-slate-500 mb-6">
						{responseStatus === "PENDING" || responseStatus === "REJECTED"
							? "Terima kasih telah memperbarui data formulir pendaftaran. Tim PMB kami akan meninjau perubahan Anda."
							: "Terima kasih telah mengisi formulir pendaftaran Nusadaya Academy. Tim PMB kami akan segera menghubungi Anda."}
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

			{/* Status Banner */}
			{responseStatus === "PENDING" && (
				<div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start">
					<AlertCircle className="w-5 h-5 text-[#0517B0] shrink-0 mt-0.5" />
					<div>
						<h4 className="font-semibold text-blue-900 text-sm">
							Status: Menunggu Peninjauan Admin PMB
						</h4>
						<p className="text-sm text-blue-800 mt-0.5">
							Data formulir Anda telah tersimpan sebelumnya dan sedang dalam
							proses peninjauan. Anda masih dapat melengkapi atau mengoreksi
							data ini sebelum disetujui secara resmi oleh tim PMB.
						</p>
					</div>
				</div>
			)}

			{responseStatus === "REJECTED" && (
				<div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-sm space-y-4">
					<div className="flex gap-3 items-start">
						<div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0 mt-0.5">
							<AlertTriangle className="w-5 h-5" />
						</div>
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<h4 className="font-bold text-rose-950 text-base">
									Formulir Memerlukan Revisi
								</h4>
								<span className="text-[11px] font-bold px-2.5 py-0.5 bg-rose-200 text-rose-800 rounded-full">
									Revisi Ditandai
								</span>
							</div>
							<p className="text-sm text-rose-800 mt-1 font-medium leading-relaxed">
								{rejectionNotes ||
									"Mohon periksa dan perbaiki kolom/bagian yang ditandai revisi (centang merah) di bawah ini lalu kirim ulang formulir."}
							</p>
						</div>
					</div>

					{rejectedFields.length > 0 && (
						<div className="pt-3 border-t border-rose-200/80">
							<p className="text-xs font-semibold text-rose-900 mb-2 flex items-center gap-1.5">
								<XCircle className="w-3.5 h-3.5 text-rose-600" />
								<span>
									Kolom yang Ditandai Perlu Diperbaiki ({rejectedFields.length}{" "}
									kolom):
								</span>
							</p>
							<div className="flex flex-wrap gap-2">
								{rejectedFields.map((f, idx) => (
									<button
										key={idx}
										type="button"
										onClick={() => {
											if (f.tabIndex >= 0 && f.tabIndex < TABS.length) {
												handleTabClick(f.tabIndex);
											}
										}}
										className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-100/80 text-rose-900 border border-rose-300 rounded-lg text-xs font-semibold shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
										title={
											f.reason
												? `Catatan: ${f.reason}`
												: "Klik untuk menuju ke tab kolom ini"
										}
									>
										<span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
										<span>{f.fieldLabel}</span>
										<span className="text-[10px] text-rose-600 font-normal">
											(Tab {f.tabIndex + 1})
										</span>
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Form Header */}
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-[#0517B0]">
					Formulir Pendaftaran Mahasiswa
				</h1>
				<p className="text-slate-500 text-sm mt-1">
					Lengkapi form pendaftaran berikut secara bertahap.
				</p>
			</div>

			{/* Stepper Tabs (Sistem Revisi Bertarget - Task H-2) */}
			<div className="flex items-center space-x-2 mb-8 overflow-x-auto pb-4 hide-scrollbar">
				{TABS.map((tab, idx) => {
					const isRejected =
						rejectedTabs.includes(idx) ||
						rejectedFields.some((f) => f.tabIndex === idx);
					const isCurrent = idx === currentTab;
					const isPassed = idx < currentTab;

					return (
						<div
							key={tab}
							onClick={() => handleTabClick(idx)}
							className="flex items-center cursor-pointer group"
						>
							<div
								className={`flex items-center justify-center h-8 w-8 rounded-full border-2 text-sm font-medium shrink-0 transition-all ${
									isRejected
										? isCurrent
											? "border-rose-600 bg-rose-600 text-white ring-2 ring-rose-300"
											: "border-rose-500 bg-rose-100 text-rose-700"
										: isCurrent
											? "border-[#0517B0] bg-[#0517B0] text-white"
											: isPassed
												? "border-emerald-500 bg-emerald-500 text-white"
												: "border-slate-200 text-slate-400 bg-white"
								}`}
								title={isRejected ? "Tab ini memerlukan perbaikan" : tab}
							>
								{isRejected ? (
									<XCircle className="w-4 h-4 text-inherit" />
								) : isPassed ? (
									<CheckCircle2 className="w-4 h-4" />
								) : (
									idx + 1
								)}
							</div>
							<div className="ml-2 hidden sm:flex flex-col">
								<span
									className={`text-sm whitespace-nowrap transition-colors ${
										isRejected
											? "font-bold text-rose-700"
											: isCurrent
												? "font-semibold text-slate-900"
												: "text-slate-500"
									}`}
								>
									{tab}
								</span>
								{isRejected && (
									<span className="text-[10px] font-bold text-rose-600 tracking-tight leading-none">
										Perlu Diperbaiki
									</span>
								)}
							</div>
							{idx < TABS.length - 1 && (
								<div
									className={`h-[2px] w-8 mx-4 sm:w-12 transition-colors ${
										rejectedTabs.includes(idx) ||
										rejectedFields.some((f) => f.tabIndex === idx)
											? "bg-rose-300"
											: isPassed
												? "bg-emerald-500"
												: "bg-slate-200"
									}`}
								/>
							)}
						</div>
					);
				})}
			</div>

			{/* Form Container */}
			<div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
				{/* Banner Spesifik Per-Tab jika Tab Ini Ditolak (Task H-5) */}
				{(rejectedTabs.includes(currentTab) ||
					currentTabRejectedFields.length > 0) && (
					<div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col gap-2.5 animate-in fade-in duration-300">
						<div className="flex gap-3 items-start">
							<AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
							<div className="flex-1">
								<h4 className="font-semibold text-rose-900 text-sm flex items-center gap-2">
									<span>Tab Ini Membutuhkan Perbaikan Data</span>
									<span className="text-xs bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-medium">
										Revisi
									</span>
								</h4>
								<p className="text-sm text-rose-800 mt-1">
									{rejectionNotes
										? `Catatan Umum Admin PMB: "${rejectionNotes}"`
										: "Silakan periksa dan perbaiki isian data pada kolom yang ditandai merah di tab ini sebelum mengirim ulang formulir."}
								</p>
							</div>
						</div>

						{currentTabRejectedFields.length > 0 && (
							<div className="mt-1 pt-2.5 border-t border-rose-200/80 text-xs text-rose-900">
								<p className="font-semibold mb-1.5">
									Rincian kolom yang perlu diperbaiki di tab ini:
								</p>
								<ul className="space-y-1 list-none pl-0">
									{currentTabRejectedFields.map((f, idx) => (
										<li
											key={idx}
											className="flex items-start gap-1.5 bg-white/80 p-2 rounded-lg border border-rose-200/80"
										>
											<XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
											<div>
												<span className="font-bold text-rose-950">
													{f.fieldLabel}
												</span>
												{f.reason && (
													<span className="text-rose-800 ml-1.5">
														&mdash; <em>&ldquo;{f.reason}&rdquo;</em>
													</span>
												)}
											</div>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}

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
								className={`w-28 h-28 rounded-full border-[3px] border-dashed ${
									isFieldRejected("profilePhotoUrl")
										? "border-rose-500 ring-4 ring-rose-200 bg-rose-50/30"
										: "border-slate-300"
								} flex items-center justify-center bg-white cursor-pointer overflow-hidden group hover:border-[#0517B0] transition-colors relative shadow-sm`}
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
								<p className="text-sm font-semibold text-slate-800 flex items-center justify-center flex-wrap gap-1">
									<span>Foto Profil</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="profilePhotoUrl"
										map={rejectedFieldsMap}
									/>
								</p>
								<p className="text-xs text-slate-500 mt-1">
									Format: JPG/PNG, Maks. 2MB (Wajib)
								</p>
								<FieldRejectionAlert
									fieldKey="profilePhotoUrl"
									map={rejectedFieldsMap}
								/>
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
								<Label className="flex items-center flex-wrap gap-1">
									<span>Email</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="email"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									required
									type="email"
									placeholder="mahasiswa@email.com"
									value={formData.email}
									onChange={(e) => updateData("email", e.target.value)}
									className={getFieldBorderClass("email")}
								/>
								<FieldRejectionAlert fieldKey="email" map={rejectedFieldsMap} />
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Nama Lengkap</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="name"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									required
									placeholder="Nama Sesuai KTP"
									value={formData.name}
									onChange={(e) => updateData("name", e.target.value)}
									className={getFieldBorderClass("name")}
								/>
								<FieldRejectionAlert fieldKey="name" map={rejectedFieldsMap} />
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Nama Panggilan</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="nickname"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Nama panggilan"
									value={formData.nickname}
									onChange={(e) => updateData("nickname", e.target.value)}
									className={getFieldBorderClass("nickname")}
								/>
								<FieldRejectionAlert
									fieldKey="nickname"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Tempat Lahir</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="birthPlace"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									required
									placeholder="Kota kelahiran"
									value={formData.birthPlace}
									onChange={(e) => updateData("birthPlace", e.target.value)}
									className={getFieldBorderClass("birthPlace")}
								/>
								<FieldRejectionAlert
									fieldKey="birthPlace"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Tanggal Lahir</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="birthDate"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									required
									type="date"
									value={formData.birthDate}
									onChange={(e) => updateData("birthDate", e.target.value)}
									className={getFieldBorderClass("birthDate")}
								/>
								<FieldRejectionAlert
									fieldKey="birthDate"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Jenis Kelamin</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="gender"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.gender}
									onValueChange={(v) => updateData("gender", v)}
								>
									<SelectTrigger className={getFieldBorderClass("gender")}>
										<SelectValue placeholder="Pilih Jenis Kelamin" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Laki-laki">Laki-laki</SelectItem>
										<SelectItem value="Perempuan">Perempuan</SelectItem>
									</SelectContent>
								</Select>
								<FieldRejectionAlert
									fieldKey="gender"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Agama</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="religion"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.religion}
									onValueChange={(v) => updateData("religion", v)}
								>
									<SelectTrigger className={getFieldBorderClass("religion")}>
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
								<FieldRejectionAlert
									fieldKey="religion"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Kewarganegaraan</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="nationality"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.nationality}
									onValueChange={(v) => updateData("nationality", v)}
								>
									<SelectTrigger className={getFieldBorderClass("nationality")}>
										<SelectValue placeholder="Pilih Kewarganegaraan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Indonesia">Indonesia</SelectItem>
										<SelectItem value="Lainnya">Lainnya</SelectItem>
									</SelectContent>
								</Select>
								{formData.nationality === "Lainnya" && (
									<Input
										className={`mt-2 ${getFieldBorderClass("nationality")}`}
										placeholder="Tuliskan kewarganegaraan"
										value={formData.nationalityOther}
										onChange={(e) =>
											updateData("nationalityOther", e.target.value)
										}
									/>
								)}
								<FieldRejectionAlert
									fieldKey="nationality"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Nomor HP / WhatsApp</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="phone"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									type="tel"
									placeholder="0812xxxx"
									value={formData.phone}
									onKeyDown={preventNonPhoneKey}
									onChange={(e) =>
										updateData("phone", filterPhone(e.target.value, 15))
									}
									className={getFieldBorderClass("phone")}
								/>
								<FieldRejectionAlert fieldKey="phone" map={rejectedFieldsMap} />
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Tinggal Dengan</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="livingWith"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.livingWith}
									onValueChange={(v) => updateData("livingWith", v)}
								>
									<SelectTrigger className={getFieldBorderClass("livingWith")}>
										<SelectValue placeholder="Pilih" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Orang tua">Orang tua</SelectItem>
										<SelectItem value="Wali">Wali</SelectItem>
										<SelectItem value="Sendiri (Kos)">Sendiri (Kos)</SelectItem>
									</SelectContent>
								</Select>
								<FieldRejectionAlert
									fieldKey="livingWith"
									map={rejectedFieldsMap}
								/>
							</div>

							<div className="md:col-span-2 mt-4">
								<h4 className="font-medium text-slate-700 border-t pt-4">
									Alamat Lengkap
								</h4>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Jalan</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="addressStreet"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Nama Jalan, Perumahan, atau Gedung"
									value={formData.addressStreet}
									onChange={(e) => updateData("addressStreet", e.target.value)}
									className={getFieldBorderClass("addressStreet")}
								/>
								<FieldRejectionAlert
									fieldKey="addressStreet"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>RT</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="addressRt"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="001"
									inputMode="numeric"
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
									className={getFieldBorderClass("addressRt")}
								/>
								<FieldRejectionAlert
									fieldKey="addressRt"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>RW</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="addressRw"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="002"
									inputMode="numeric"
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
									className={getFieldBorderClass("addressRw")}
								/>
								<FieldRejectionAlert
									fieldKey="addressRw"
									map={rejectedFieldsMap}
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
								<Label className="flex items-center flex-wrap gap-1">
									<span>Kabupaten / Kota</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="addressCity"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Kabupaten / Kota"
									value={formData.addressCity}
									onChange={(e) => updateData("addressCity", e.target.value)}
									className={getFieldBorderClass("addressCity")}
								/>
								<FieldRejectionAlert
									fieldKey="addressCity"
									map={rejectedFieldsMap}
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
								<Label className="flex items-center flex-wrap gap-1">
									<span>Program Studi</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="program"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.program}
									onValueChange={(v) => updateData("program", v)}
								>
									<SelectTrigger className={getFieldBorderClass("program")}>
										<SelectValue placeholder="Pilih Program Studi" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="D3 Perhotelan">D3 Perhotelan</SelectItem>
									</SelectContent>
								</Select>
								<FieldRejectionAlert
									fieldKey="program"
									map={rejectedFieldsMap}
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Peminatan / Sub Program</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="subProgram"
										map={rejectedFieldsMap}
									/>
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
									<SelectTrigger className={getFieldBorderClass("subProgram")}>
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
								<FieldRejectionAlert
									fieldKey="subProgram"
									map={rejectedFieldsMap}
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Pilihan Kelas</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="classType"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.classType}
									onValueChange={(v) => updateData("classType", v)}
								>
									<SelectTrigger className={getFieldBorderClass("classType")}>
										<SelectValue placeholder="Online / Offline" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Offline">Offline</SelectItem>
										<SelectItem value="Online-LMS">Online-LMS</SelectItem>
									</SelectContent>
								</Select>
								<FieldRejectionAlert
									fieldKey="classType"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Angkatan</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="cohort"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									required
									placeholder="Contoh: 15 atau 16"
									inputMode="numeric"
									value={formData.cohort}
									onKeyDown={preventNonNumericKey}
									onChange={(e) => {
										const val = filterNumeric(
											e.target.value,
											2,
											"Angkatan berupa angka 1-99",
										);
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
									className={getFieldBorderClass("cohort")}
								/>
								<FieldRejectionAlert
									fieldKey="cohort"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Tahun Ajaran</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="academicYear"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Contoh: 2025/2026 atau 2026/2027"
									value={formData.academicYear}
									onChange={(e) => {
										const val = e.target.value
											.replace(/[^0-9/]/g, "")
											.slice(0, 9);
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
									className={getFieldBorderClass("academicYear")}
								/>
								<FieldRejectionAlert
									fieldKey="academicYear"
									map={rejectedFieldsMap}
								/>
							</div>

							{/* Pendidikan Sebelumnya */}
							<div className="md:col-span-2 mt-4">
								<h4 className="font-medium text-slate-700 border-t pt-4">
									Pendidikan Sebelumnya
								</h4>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Nama Sekolah Asal</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="schoolOrigin"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="SMA/SMK..."
									value={formData.schoolOrigin}
									onChange={(e) => updateData("schoolOrigin", e.target.value)}
									className={getFieldBorderClass("schoolOrigin")}
								/>
								<FieldRejectionAlert
									fieldKey="schoolOrigin"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Jurusan Sekolah</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="schoolMajor"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="IPA / IPS / Tata Boga"
									value={formData.schoolMajor}
									onChange={(e) => updateData("schoolMajor", e.target.value)}
									className={getFieldBorderClass("schoolMajor")}
								/>
								<FieldRejectionAlert
									fieldKey="schoolMajor"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Tahun Lulus</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="graduationYear"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="2023"
									inputMode="numeric"
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
									className={getFieldBorderClass("graduationYear")}
								/>
								<FieldRejectionAlert
									fieldKey="graduationYear"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Alamat Sekolah</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="schoolAddress"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Textarea
									placeholder="Alamat lengkap sekolah asal"
									value={formData.schoolAddress}
									onChange={(e) => updateData("schoolAddress", e.target.value)}
									className={getFieldBorderClass("schoolAddress")}
								/>
								<FieldRejectionAlert
									fieldKey="schoolAddress"
									map={rejectedFieldsMap}
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
								<Label className="flex items-center flex-wrap gap-1">
									<span>Golongan Darah</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="bloodType"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.bloodType}
									onValueChange={(v) => updateData("bloodType", v)}
								>
									<SelectTrigger className={getFieldBorderClass("bloodType")}>
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
								<FieldRejectionAlert
									fieldKey="bloodType"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Ukuran Baju</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="clothingSize"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.clothingSize}
									onValueChange={(v) => updateData("clothingSize", v)}
								>
									<SelectTrigger
										className={getFieldBorderClass("clothingSize")}
									>
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
										className={`mt-2 ${getFieldBorderClass("clothingSize")}`}
										placeholder="Sebutkan ukuran lainnya"
										value={formData.clothingSizeOther}
										onChange={(e) =>
											updateData("clothingSizeOther", e.target.value)
										}
									/>
								)}
								<FieldRejectionAlert
									fieldKey="clothingSize"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Tinggi Badan (cm)</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="height"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="170"
									inputMode="numeric"
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
									className={getFieldBorderClass("height")}
								/>
								{formData.height &&
									(Number(formData.height) < 150 ||
										Number(formData.height) > 220) && (
										<p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
											<AlertTriangle className="w-3.5 h-3.5" />
											Tinggi badan di luar rentang standar umum (150–220 cm)
										</p>
									)}
								<FieldRejectionAlert
									fieldKey="height"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Berat Badan (kg)</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="weight"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="60"
									inputMode="numeric"
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
									className={getFieldBorderClass("weight")}
								/>
								{formData.weight &&
									(Number(formData.weight) < 35 ||
										Number(formData.weight) > 160) && (
										<p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
											<AlertTriangle className="w-3.5 h-3.5" />
											Berat badan di luar rentang standar umum (35–160 kg)
										</p>
									)}
								<FieldRejectionAlert
									fieldKey="weight"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Riwayat Penyakit</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="diseaseHistory"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Tuliskan 'Tidak ada' jika tidak ada"
									value={formData.diseaseHistory}
									onChange={(e) => updateData("diseaseHistory", e.target.value)}
									className={getFieldBorderClass("diseaseHistory")}
								/>
								<FieldRejectionAlert
									fieldKey="diseaseHistory"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Penyakit Bawaan</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="congenitalDisease"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Tuliskan 'Tidak ada' jika tidak ada"
									value={formData.congenitalDisease}
									onChange={(e) =>
										updateData("congenitalDisease", e.target.value)
									}
									className={getFieldBorderClass("congenitalDisease")}
								/>
								<FieldRejectionAlert
									fieldKey="congenitalDisease"
									map={rejectedFieldsMap}
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
								<Label className="flex items-center flex-wrap gap-1">
									<span>Nama Ayah</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ayahName"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									required
									placeholder="Nama lengkap ayah"
									value={formData.ayahName}
									onChange={(e) => updateData("ayahName", e.target.value)}
									className={getFieldBorderClass("ayahName")}
								/>
								<FieldRejectionAlert
									fieldKey="ayahName"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Keadaan Ayah</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ayahStatus"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.ayahStatus}
									onValueChange={(v) => updateData("ayahStatus", v)}
								>
									<SelectTrigger className={getFieldBorderClass("ayahStatus")}>
										<SelectValue placeholder="Pilih Keadaan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Hidup">Hidup</SelectItem>
										<SelectItem value="Meninggal">Meninggal</SelectItem>
									</SelectContent>
								</Select>
								<FieldRejectionAlert
									fieldKey="ayahStatus"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Tempat Lahir</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ayahBirthPlace"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Kota kelahiran"
									value={formData.ayahBirthPlace}
									onChange={(e) => updateData("ayahBirthPlace", e.target.value)}
									className={getFieldBorderClass("ayahBirthPlace")}
								/>
								<FieldRejectionAlert
									fieldKey="ayahBirthPlace"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Tanggal Lahir</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ayahBirthDate"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									type="date"
									value={formData.ayahBirthDate}
									onChange={(e) => updateData("ayahBirthDate", e.target.value)}
									className={getFieldBorderClass("ayahBirthDate")}
								/>
								<FieldRejectionAlert
									fieldKey="ayahBirthDate"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Agama</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ayahReligion"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.ayahReligion}
									onValueChange={(v) => updateData("ayahReligion", v)}
								>
									<SelectTrigger
										className={getFieldBorderClass("ayahReligion")}
									>
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
								<FieldRejectionAlert
									fieldKey="ayahReligion"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Kewarganegaraan</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ayahNationality"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.ayahNationality}
									onValueChange={(v) => updateData("ayahNationality", v)}
								>
									<SelectTrigger
										className={getFieldBorderClass("ayahNationality")}
									>
										<SelectValue placeholder="Pilih Kewarganegaraan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Indonesia">Indonesia</SelectItem>
										<SelectItem value="Lainnya">Lainnya</SelectItem>
									</SelectContent>
								</Select>
								{formData.ayahNationality === "Lainnya" && (
									<Input
										className={`mt-2 ${getFieldBorderClass("ayahNationality")}`}
										placeholder="Tuliskan kewarganegaraan"
										value={formData.ayahNationalityOther}
										onChange={(e) =>
											updateData("ayahNationalityOther", e.target.value)
										}
									/>
								)}
								<FieldRejectionAlert
									fieldKey="ayahNationality"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Pendidikan Terakhir</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ayahEducation"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="SD/SMP/SMA/S1..."
									value={formData.ayahEducation}
									onChange={(e) => updateData("ayahEducation", e.target.value)}
									className={getFieldBorderClass("ayahEducation")}
								/>
								<FieldRejectionAlert
									fieldKey="ayahEducation"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Pekerjaan</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ayahJob"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Wiraswasta/PNS/Pegawai Swasta"
									value={formData.ayahJob}
									onChange={(e) => updateData("ayahJob", e.target.value)}
									className={getFieldBorderClass("ayahJob")}
								/>
								<FieldRejectionAlert
									fieldKey="ayahJob"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Nomor HP</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ayahPhone"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									type="tel"
									placeholder="0812xxxx"
									value={formData.ayahPhone}
									onKeyDown={preventNonPhoneKey}
									onChange={(e) =>
										updateData("ayahPhone", filterPhone(e.target.value, 15))
									}
									className={getFieldBorderClass("ayahPhone")}
								/>
								<FieldRejectionAlert
									fieldKey="ayahPhone"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Email</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ayahEmail"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									type="email"
									placeholder="ayah@email.com"
									value={formData.ayahEmail}
									onChange={(e) => updateData("ayahEmail", e.target.value)}
									className={getFieldBorderClass("ayahEmail")}
								/>
								<FieldRejectionAlert
									fieldKey="ayahEmail"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Alamat Lengkap</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ayahAddress"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Textarea
									placeholder="Alamat lengkap ayah"
									value={formData.ayahAddress}
									onChange={(e) => updateData("ayahAddress", e.target.value)}
									className={getFieldBorderClass("ayahAddress")}
								/>
								<FieldRejectionAlert
									fieldKey="ayahAddress"
									map={rejectedFieldsMap}
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
								<Label className="flex items-center flex-wrap gap-1">
									<span>Nama Ibu</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ibuName"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									required
									placeholder="Nama lengkap ibu"
									value={formData.ibuName}
									onChange={(e) => updateData("ibuName", e.target.value)}
									className={getFieldBorderClass("ibuName")}
								/>
								<FieldRejectionAlert
									fieldKey="ibuName"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Keadaan Ibu</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ibuStatus"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.ibuStatus}
									onValueChange={(v) => updateData("ibuStatus", v)}
								>
									<SelectTrigger className={getFieldBorderClass("ibuStatus")}>
										<SelectValue placeholder="Pilih Keadaan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Hidup">Hidup</SelectItem>
										<SelectItem value="Meninggal">Meninggal</SelectItem>
									</SelectContent>
								</Select>
								<FieldRejectionAlert
									fieldKey="ibuStatus"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Tempat Lahir</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ibuBirthPlace"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Kota kelahiran"
									value={formData.ibuBirthPlace}
									onChange={(e) => updateData("ibuBirthPlace", e.target.value)}
									className={getFieldBorderClass("ibuBirthPlace")}
								/>
								<FieldRejectionAlert
									fieldKey="ibuBirthPlace"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Tanggal Lahir</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ibuBirthDate"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									type="date"
									value={formData.ibuBirthDate}
									onChange={(e) => updateData("ibuBirthDate", e.target.value)}
									className={getFieldBorderClass("ibuBirthDate")}
								/>
								<FieldRejectionAlert
									fieldKey="ibuBirthDate"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Agama</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ibuReligion"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.ibuReligion}
									onValueChange={(v) => updateData("ibuReligion", v)}
								>
									<SelectTrigger className={getFieldBorderClass("ibuReligion")}>
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
								<FieldRejectionAlert
									fieldKey="ibuReligion"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Kewarganegaraan</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ibuNationality"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.ibuNationality}
									onValueChange={(v) => updateData("ibuNationality", v)}
								>
									<SelectTrigger
										className={getFieldBorderClass("ibuNationality")}
									>
										<SelectValue placeholder="Pilih Kewarganegaraan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Indonesia">Indonesia</SelectItem>
										<SelectItem value="Lainnya">Lainnya</SelectItem>
									</SelectContent>
								</Select>
								{formData.ibuNationality === "Lainnya" && (
									<Input
										className={`mt-2 ${getFieldBorderClass("ibuNationality")}`}
										placeholder="Tuliskan kewarganegaraan"
										value={formData.ibuNationalityOther}
										onChange={(e) =>
											updateData("ibuNationalityOther", e.target.value)
										}
									/>
								)}
								<FieldRejectionAlert
									fieldKey="ibuNationality"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Pendidikan Terakhir</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ibuEducation"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="SD/SMP/SMA/S1..."
									value={formData.ibuEducation}
									onChange={(e) => updateData("ibuEducation", e.target.value)}
									className={getFieldBorderClass("ibuEducation")}
								/>
								<FieldRejectionAlert
									fieldKey="ibuEducation"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Pekerjaan</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ibuJob"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Ibu Rumah Tangga/PNS/Dll"
									value={formData.ibuJob}
									onChange={(e) => updateData("ibuJob", e.target.value)}
									className={getFieldBorderClass("ibuJob")}
								/>
								<FieldRejectionAlert
									fieldKey="ibuJob"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Nomor HP</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ibuPhone"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									type="tel"
									placeholder="0812xxxx"
									value={formData.ibuPhone}
									onKeyDown={preventNonPhoneKey}
									onChange={(e) =>
										updateData("ibuPhone", filterPhone(e.target.value, 15))
									}
									className={getFieldBorderClass("ibuPhone")}
								/>
								<FieldRejectionAlert
									fieldKey="ibuPhone"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Email</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ibuEmail"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									type="email"
									placeholder="ibu@email.com"
									value={formData.ibuEmail}
									onChange={(e) => updateData("ibuEmail", e.target.value)}
									className={getFieldBorderClass("ibuEmail")}
								/>
								<FieldRejectionAlert
									fieldKey="ibuEmail"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Alamat Lengkap</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="ibuAddress"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Textarea
									placeholder="Alamat lengkap ibu"
									value={formData.ibuAddress}
									onChange={(e) => updateData("ibuAddress", e.target.value)}
									className={getFieldBorderClass("ibuAddress")}
								/>
								<FieldRejectionAlert
									fieldKey="ibuAddress"
									map={rejectedFieldsMap}
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
								<Label className="flex items-center flex-wrap gap-1">
									<span>Nama Wali</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="waliName"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									required
									placeholder="Nama lengkap wali"
									value={formData.waliName}
									onChange={(e) => updateData("waliName", e.target.value)}
									className={getFieldBorderClass("waliName")}
								/>
								<FieldRejectionAlert
									fieldKey="waliName"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Hubungan dengan Mahasiswa</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="waliGuardianRelation"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									required
									placeholder="Paman / Kakak / Ayah Kandung"
									value={formData.waliGuardianRelation}
									onChange={(e) =>
										updateData("waliGuardianRelation", e.target.value)
									}
									className={getFieldBorderClass("waliGuardianRelation")}
								/>
								<FieldRejectionAlert
									fieldKey="waliGuardianRelation"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Tempat Lahir</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="waliBirthPlace"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Kota kelahiran"
									value={formData.waliBirthPlace}
									onChange={(e) => updateData("waliBirthPlace", e.target.value)}
									className={getFieldBorderClass("waliBirthPlace")}
								/>
								<FieldRejectionAlert
									fieldKey="waliBirthPlace"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Tanggal Lahir</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="waliBirthDate"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									type="date"
									value={formData.waliBirthDate}
									onChange={(e) => updateData("waliBirthDate", e.target.value)}
									className={getFieldBorderClass("waliBirthDate")}
								/>
								<FieldRejectionAlert
									fieldKey="waliBirthDate"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Agama</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="waliReligion"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.waliReligion}
									onValueChange={(v) => updateData("waliReligion", v)}
								>
									<SelectTrigger
										className={getFieldBorderClass("waliReligion")}
									>
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
								<FieldRejectionAlert
									fieldKey="waliReligion"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Kewarganegaraan</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="waliNationality"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.waliNationality}
									onValueChange={(v) => updateData("waliNationality", v)}
								>
									<SelectTrigger
										className={getFieldBorderClass("waliNationality")}
									>
										<SelectValue placeholder="Pilih Kewarganegaraan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Indonesia">Indonesia</SelectItem>
										<SelectItem value="Lainnya">Lainnya</SelectItem>
									</SelectContent>
								</Select>
								{formData.waliNationality === "Lainnya" && (
									<Input
										className={`mt-2 ${getFieldBorderClass("waliNationality")}`}
										placeholder="Tuliskan kewarganegaraan"
										value={formData.waliNationalityOther}
										onChange={(e) =>
											updateData("waliNationalityOther", e.target.value)
										}
									/>
								)}
								<FieldRejectionAlert
									fieldKey="waliNationality"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Pendidikan Terakhir</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="waliEducation"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="SD/SMP/SMA/S1..."
									value={formData.waliEducation}
									onChange={(e) => updateData("waliEducation", e.target.value)}
									className={getFieldBorderClass("waliEducation")}
								/>
								<FieldRejectionAlert
									fieldKey="waliEducation"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Pekerjaan</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="waliJob"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Pekerjaan wali"
									value={formData.waliJob}
									onChange={(e) => updateData("waliJob", e.target.value)}
									className={getFieldBorderClass("waliJob")}
								/>
								<FieldRejectionAlert
									fieldKey="waliJob"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Nomor HP</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="waliPhone"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									type="tel"
									required
									placeholder="0812xxxx"
									value={formData.waliPhone}
									onKeyDown={preventNonPhoneKey}
									onChange={(e) =>
										updateData("waliPhone", filterPhone(e.target.value, 15))
									}
									className={getFieldBorderClass("waliPhone")}
								/>
								<FieldRejectionAlert
									fieldKey="waliPhone"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Email</span> <span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="waliEmail"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									type="email"
									placeholder="wali@email.com"
									value={formData.waliEmail}
									onChange={(e) => updateData("waliEmail", e.target.value)}
									className={getFieldBorderClass("waliEmail")}
								/>
								<FieldRejectionAlert
									fieldKey="waliEmail"
									map={rejectedFieldsMap}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Alamat Lengkap</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="waliAddress"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Textarea
									placeholder="Alamat lengkap wali"
									value={formData.waliAddress}
									onChange={(e) => updateData("waliAddress", e.target.value)}
									className={getFieldBorderClass("waliAddress")}
								/>
								<FieldRejectionAlert
									fieldKey="waliAddress"
									map={rejectedFieldsMap}
								/>
							</div>
						</div>
					</div>
				)}

				{/* TAB 7: Informasi PMB & Referensi */}
				{currentTab === 6 && (
					<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
						<div className="flex items-center justify-between border-b pb-2">
							<h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
								<Building2 className="w-5 h-5 text-[#0517B0]" />
								Informasi PMB & Referensi
							</h3>
							<span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#0517B0] rounded-md border border-blue-100">
								PMB
							</span>
						</div>

						{/* Referral Terstruktur (Task C-3) */}
						<div className="p-5 bg-blue-50/50 rounded-xl border border-blue-200/60 mb-2">
							<h4 className="font-semibold text-blue-950 text-sm mb-1 flex items-center gap-2">
								<Building2 className="w-4 h-4 text-[#0517B0]" />
								Asal Referral & Rekomendasi Terstruktur
							</h4>
							<p className="text-xs text-slate-500 mb-4">
								Seluruh data asal referensi dan rekomendasi pendaftaran wajib
								dilengkapi di bawah ini.
							</p>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Kategori Referral</span>{" "}
										<span className="text-red-500">*</span>
										<FieldRejectionBadge
											fieldKey="referralCategory"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Select
										value={formData.referralCategory}
										onValueChange={(v) => updateData("referralCategory", v)}
									>
										<SelectTrigger
											className={getFieldBorderClass(
												"referralCategory",
												"bg-white",
											)}
										>
											<SelectValue placeholder="Pilih Kategori Referral">
												{formData.referralCategory
													? formatReferralCategory(formData.referralCategory)
													: undefined}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{REFERRAL_CATEGORY_OPTIONS.map((opt) => (
												<SelectItem key={opt.value} value={opt.value}>
													{opt.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FieldRejectionAlert
										fieldKey="referralCategory"
										map={rejectedFieldsMap}
									/>
								</div>

								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Nama Institusi / Lembaga Referral</span>{" "}
										<span className="text-red-500">*</span>
										<FieldRejectionBadge
											fieldKey="referralInstitutionName"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Input
										placeholder="Contoh: SMKN 1 Denpasar / BKK Mandiri"
										value={formData.referralInstitutionName}
										onChange={(e) =>
											updateData("referralInstitutionName", e.target.value)
										}
										className={getFieldBorderClass(
											"referralInstitutionName",
											"bg-white",
										)}
									/>
									<FieldRejectionAlert
										fieldKey="referralInstitutionName"
										map={rejectedFieldsMap}
									/>
								</div>

								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Nama Kontak / PIC Referral</span>{" "}
										<span className="text-red-500">*</span>
										<FieldRejectionBadge
											fieldKey="referralContactName"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Input
										placeholder="Nama guru / PIC referral"
										value={formData.referralContactName}
										onChange={(e) =>
											updateData("referralContactName", e.target.value)
										}
										className={getFieldBorderClass(
											"referralContactName",
											"bg-white",
										)}
									/>
									<FieldRejectionAlert
										fieldKey="referralContactName"
										map={rejectedFieldsMap}
									/>
								</div>

								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Nomor WhatsApp Kontak / PIC Referral</span>{" "}
										<span className="text-red-500">*</span>
										<FieldRejectionBadge
											fieldKey="referralContactPhone"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Input
										type="tel"
										placeholder="0812xxxx"
										value={formData.referralContactPhone}
										onKeyDown={preventNonPhoneKey}
										onChange={(e) =>
											updateData(
												"referralContactPhone",
												filterPhone(e.target.value, 15),
											)
										}
										className={getFieldBorderClass(
											"referralContactPhone",
											"bg-white",
										)}
									/>
									<FieldRejectionAlert
										fieldKey="referralContactPhone"
										map={rejectedFieldsMap}
									/>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label>Negara Tujuan</Label>
								<Input
									readOnly
									value={
										formData.subProgram === "Malaysia-Hospitality"
											? "Malaysia"
											: formData.subProgram === "Taiwan-Hospitality"
												? "Taiwan"
												: formData.subProgram === "Timur tengah-Barista"
													? "Timur Tengah"
													: "Indonesia"
									}
									className="bg-slate-50 font-medium text-slate-700 cursor-not-allowed"
								/>
								<p className="text-[11px] text-slate-400">
									Otomatis disesuaikan dengan pilihan Peminatan di Keterangan
									Pendidikan
								</p>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Periode Keberangkatan</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="period"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Contoh: 2026/2027 atau Batch 1"
									value={formData.period}
									onChange={(e) => updateData("period", e.target.value)}
									className={getFieldBorderClass("period")}
								/>
								<FieldRejectionAlert
									fieldKey="period"
									map={rejectedFieldsMap}
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Rekomendasi</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="rekomendasi"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Select
									value={formData.rekomendasi}
									onValueChange={(v) => updateData("rekomendasi", v)}
								>
									<SelectTrigger className={getFieldBorderClass("rekomendasi")}>
										<SelectValue placeholder="Pilih Jenis Rekomendasi" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Pendamping">Pendamping</SelectItem>
										<SelectItem value="MoU Sekolah">MoU Sekolah</SelectItem>
										<SelectItem value="BKK">BKK</SelectItem>
										<SelectItem value="FKKS">FKKS</SelectItem>
										<SelectItem value="RO Alumni">RO Alumni</SelectItem>
										<SelectItem value="Staff/Team">Staff/Team</SelectItem>
										<SelectItem value="Lainnya">Lainnya</SelectItem>
									</SelectContent>
								</Select>
								<FieldRejectionAlert
									fieldKey="rekomendasi"
									map={rejectedFieldsMap}
								/>
							</div>

							<div className="space-y-2">
								<Label>
									Tim Visit <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Nama tim visit (isi '-' jika tidak ada)"
									value={formData.timVisit}
									onChange={(e) => updateData("timVisit", e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label>
									Tim Sosialisasi <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Nama tim sosialisasi (isi '-' jika tidak ada)"
									value={formData.timSosialisasi}
									onChange={(e) => updateData("timSosialisasi", e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center flex-wrap gap-1">
									<span>RO Referral</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="roReferral"
										map={rejectedFieldsMap}
									/>
								</Label>
								<Input
									placeholder="Nama RO Referral (isi '-' jika tidak ada)"
									value={formData.roReferral}
									onChange={(e) => updateData("roReferral", e.target.value)}
									className={getFieldBorderClass("roReferral")}
								/>
								<FieldRejectionAlert
									fieldKey="roReferral"
									map={rejectedFieldsMap}
								/>
							</div>

							<div className="space-y-2">
								<Label>
									Mitra Sponsor <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Nama mitra sponsor (isi '-' jika tidak ada)"
									value={formData.mitraSponsor}
									onChange={(e) => updateData("mitraSponsor", e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label>
									Koordinator <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Nama koordinator (isi '-' jika tidak ada)"
									value={formData.koordinator}
									onChange={(e) => updateData("koordinator", e.target.value)}
								/>
							</div>
						</div>
					</div>
				)}

				{/* TAB 8: Kontak Kawan & Darurat (Task D-4 & D-5) */}
				{currentTab === 7 && (
					<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
						<div className="flex items-center justify-between border-b pb-2">
							<h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
								<PhoneCall className="w-5 h-5 text-[#0517B0]" />
								Kontak Darurat, Rekomendasi & Daftar Kawan
							</h3>
							<span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#0517B0] rounded-md border border-blue-100">
								Kontak & Rekomendasi
							</span>
						</div>

						{/* Seksi Kontak Darurat */}
						<div className="p-5 bg-slate-50/70 rounded-xl border border-slate-200">
							<h4 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-2">
								<AlertCircle className="w-4 h-4 text-[#0517B0]" />
								Kontak Darurat (Keluarga / Kerabat Terdekat)
							</h4>
							<p className="text-xs text-slate-500 mb-4">
								Kontak yang dapat dihubungi oleh pihak kampus dalam situasi
								mendesak atau darurat.
							</p>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Nama Kontak Darurat</span>{" "}
										<span className="text-red-500">*</span>
										<FieldRejectionBadge
											fieldKey="emergencyContactName"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Input
										placeholder="Nama lengkap kontak darurat"
										value={formData.emergencyContactName}
										onChange={(e) =>
											updateData("emergencyContactName", e.target.value)
										}
										className={getFieldBorderClass(
											"emergencyContactName",
											"bg-white",
										)}
									/>
									<FieldRejectionAlert
										fieldKey="emergencyContactName"
										map={rejectedFieldsMap}
									/>
								</div>

								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Nomor WhatsApp Darurat</span>{" "}
										<span className="text-red-500">*</span>
										<FieldRejectionBadge
											fieldKey="emergencyContactPhone"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Input
										type="tel"
										placeholder="0812xxxx"
										value={formData.emergencyContactPhone}
										onKeyDown={preventNonPhoneKey}
										onChange={(e) =>
											updateData(
												"emergencyContactPhone",
												filterPhone(e.target.value, 15),
											)
										}
										className={getFieldBorderClass(
											"emergencyContactPhone",
											"bg-white",
										)}
									/>
									<FieldRejectionAlert
										fieldKey="emergencyContactPhone"
										map={rejectedFieldsMap}
									/>
								</div>

								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Hubungan dengan Mahasiswa</span>{" "}
										<span className="text-red-500">*</span>
										<FieldRejectionBadge
											fieldKey="emergencyContactRelation"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Select
										value={formData.emergencyContactRelation}
										onValueChange={(v) =>
											updateData("emergencyContactRelation", v)
										}
									>
										<SelectTrigger
											className={getFieldBorderClass(
												"emergencyContactRelation",
												"bg-white",
											)}
										>
											<SelectValue placeholder="Pilih Hubungan" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Orang Tua">Orang Tua</SelectItem>
											<SelectItem value="Kakak">Kakak Kandung</SelectItem>
											<SelectItem value="Adik">Adik Kandung</SelectItem>
											<SelectItem value="Paman / Bibi">Paman / Bibi</SelectItem>
											<SelectItem value="Saudara Lain">
												Saudara / Kerabat Lain
											</SelectItem>
											<SelectItem value="Tetangga">Tetangga</SelectItem>
											<SelectItem value="Lainnya">Lainnya</SelectItem>
										</SelectContent>
									</Select>
									<FieldRejectionAlert
										fieldKey="emergencyContactRelation"
										map={rejectedFieldsMap}
									/>
								</div>
							</div>
						</div>

						{/* Seksi Pemberi Rekomendasi Pendaftaran */}
						<div className="p-5 bg-slate-50/70 rounded-xl border border-slate-200">
							<h4 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-2">
								<UserPlus className="w-4 h-4 text-[#0517B0]" />
								Pemberi Rekomendasi Pendaftaran
							</h4>
							<p className="text-xs text-slate-500 mb-4">
								Informasi pihak yang mengenalkan atau merekomendasikan Anda
								untuk mendaftar di Nusadaya Academy.
							</p>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Siapa yang merekomendasikan Anda mendaftar?</span>{" "}
										<span className="text-red-500">*</span>
										<FieldRejectionBadge
											fieldKey="recommendedBy"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Select
										value={formData.recommendedBy}
										onValueChange={(v) => updateData("recommendedBy", v)}
									>
										<SelectTrigger
											className={getFieldBorderClass(
												"recommendedBy",
												"bg-white",
											)}
										>
											<SelectValue placeholder="Pilih Pemberi Rekomendasi" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Mahasiswa Aktif Nusadaya">
												Mahasiswa Aktif Nusadaya
											</SelectItem>
											<SelectItem value="Alumni Nusadaya (RO)">
												Alumni Nusadaya (RO)
											</SelectItem>
											<SelectItem value="Guru / Pihak Sekolah">
												Guru / Pihak Sekolah
											</SelectItem>
											<SelectItem value="BKK / Lembaga Mitra">
												BKK / Lembaga Mitra
											</SelectItem>
											<SelectItem value="Teman / Kawan">
												Teman / Kawan
											</SelectItem>
											<SelectItem value="Keluarga / Saudara">
												Keluarga / Saudara
											</SelectItem>
											<SelectItem value="Media Sosial / Website / Brosur (Mandiri)">
												Media Sosial / Website / Brosur (Mandiri)
											</SelectItem>
											<SelectItem value="Lainnya">Lainnya</SelectItem>
										</SelectContent>
									</Select>
									<FieldRejectionAlert
										fieldKey="recommendedBy"
										map={rejectedFieldsMap}
									/>
								</div>

								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Nama Lengkap yang Merekomendasikan</span>
										{formData.recommendedBy !==
											"Media Sosial / Website / Brosur (Mandiri)" && (
											<span className="text-red-500">*</span>
										)}
										<FieldRejectionBadge
											fieldKey="recommenderName"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Input
										placeholder={
											formData.recommendedBy ===
											"Media Sosial / Website / Brosur (Mandiri)"
												? "(Opsional) Akun medsos / brosur / website"
												: "Nama lengkap mahasiswa/alumni/guru/kerabat yang merekomendasikan"
										}
										value={formData.recommenderName}
										onChange={(e) =>
											updateData("recommenderName", e.target.value)
										}
										className={getFieldBorderClass(
											"recommenderName",
											"bg-white",
										)}
									/>
									<FieldRejectionAlert
										fieldKey="recommenderName"
										map={rejectedFieldsMap}
									/>
								</div>
							</div>
						</div>

						{/* Seksi Daftar Kontak Kawan (Fleksibel Minimal 3, Maksimal 5 Kontak) */}
						<div
							className={`p-5 bg-white rounded-xl border ${isFieldRejected("friendContacts") ? "border-rose-400 ring-2 ring-rose-200" : "border-slate-200"}`}
						>
							<div className="mb-4">
								<h4 className="font-semibold text-slate-900 text-sm flex items-center flex-wrap gap-2">
									<Users className="w-4 h-4 text-[#0517B0]" />
									<span>Daftar Kontak Kawan / Rekan</span>{" "}
									<span className="text-red-500">*</span>
									<FieldRejectionBadge
										fieldKey="friendContacts"
										map={rejectedFieldsMap}
									/>
								</h4>
								<p className="text-xs text-slate-500 mt-0.5">
									Wajib melampirkan minimal 3 kontak kawan/rekan aktif (maksimal
									5 kontak) sebagai referensi pertemanan & informasi kegiatan.
								</p>
								<FieldRejectionAlert
									fieldKey="friendContacts"
									map={rejectedFieldsMap}
								/>
							</div>

							<div className="space-y-4">
								{formData.friendContacts.map((friend, idx) => (
									<div
										key={idx}
										className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/80 flex flex-col md:flex-row gap-3 items-start md:items-center"
									>
										<div className="w-7 h-7 rounded-full bg-blue-100 text-[#0517B0] font-bold text-xs flex items-center justify-center shrink-0">
											{idx + 1}
										</div>

										<div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 w-full">
											<div className="space-y-1">
												<Label className="text-xs">
													Nama Kawan ke-{idx + 1}{" "}
													<span className="text-red-500">*</span>
												</Label>
												<Input
													placeholder={`Nama lengkap kawan ${idx + 1}`}
													value={friend.name}
													onChange={(e) =>
														updateFriendContact(idx, "name", e.target.value)
													}
													className="bg-white h-9 text-sm"
												/>
											</div>

											<div className="space-y-1">
												<Label className="text-xs">
													Nomor WhatsApp <span className="text-red-500">*</span>
												</Label>
												<Input
													type="tel"
													placeholder="0812xxxx"
													value={friend.phone}
													onKeyDown={preventNonPhoneKey}
													onChange={(e) =>
														updateFriendContact(
															idx,
															"phone",
															filterPhone(e.target.value, 15),
														)
													}
													className="bg-white h-9 text-sm"
												/>
											</div>

											<div className="space-y-1">
												<Label className="text-xs">
													Asal Sekolah / Hubungan{" "}
													<span className="text-red-500">*</span>
												</Label>
												<Input
													placeholder="Contoh: SMAN 1 Denpasar / Teman Sekolah"
													value={friend.schoolOrRelation}
													onChange={(e) =>
														updateFriendContact(
															idx,
															"schoolOrRelation",
															e.target.value,
														)
													}
													className="bg-white h-9 text-sm"
												/>
											</div>
										</div>

										{idx >= 3 ? (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeFriendContact(idx)}
												className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 self-end md:self-center h-9 px-2.5 text-xs gap-1 cursor-pointer"
												title="Hapus kontak kawan ini"
											>
												<Trash2 className="w-4 h-4" />
												<span className="md:hidden">Hapus</span>
											</Button>
										) : (
											<div className="hidden md:block w-9 shrink-0 text-center">
												<span className="text-[10px] text-slate-400 font-medium">
													Wajib
												</span>
											</div>
										)}
									</div>
								))}
							</div>

							<div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<p className="text-xs text-slate-500">
									Kontak 1–3 wajib diisi. Anda dapat menambahkan hingga maksimal
									5 kontak kawan aktif.
								</p>
								{formData.friendContacts.length < 5 ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={addFriendContact}
										className="border-dashed border-blue-300 text-[#0517B0] hover:bg-blue-50 font-semibold gap-1.5 self-start sm:self-auto cursor-pointer"
									>
										<Plus className="w-4 h-4" />
										Tambah Kontak Kawan ({formData.friendContacts.length}/5)
									</Button>
								) : (
									<span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
										✓ Maksimal 5 kontak telah terisi
									</span>
								)}
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
