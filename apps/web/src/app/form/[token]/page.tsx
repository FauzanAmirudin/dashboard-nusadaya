"use client";

import {
	AlertCircle,
	AlertTriangle,
	Copy,
	UploadCloud,
	XCircle,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { EmergencyContactsFields } from "@/components/common/EmergencyContactsFields";
import {
	FormMessageScreen,
	FormNav,
	FormProgress,
} from "@/components/common/FormShell";
import {
	FRIEND_CONTACTS_PROMPT,
	FriendContactsFields,
} from "@/components/common/FriendContactsFields";
import { HealthQuestion } from "@/components/common/HealthQuestion";
import { OptionSelect } from "@/components/common/OptionSelect";
import { RegionFields } from "@/components/common/RegionFields";
import { YesNoWithDetail } from "@/components/common/YesNoWithDetail";
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
import { API_URL } from "@/lib/eden";
import {
	emptyEmergencyContact,
	parseEmergencyContacts,
	validateEmergencyContacts,
} from "@/lib/emergency-contacts";
import {
	INCOME_RANGE_OPTIONS,
	LAST_EDUCATION_OPTIONS,
} from "@/lib/form-options";
import {
	MANDIRI_RECOMMENDER,
	RECOMMENDED_BY_OPTIONS,
} from "@/lib/recommenders";
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
	"Keterangan Wali",
	"Keterangan Ayah Kandung",
	"Keterangan Ibu Kandung",
	"Informasi PMB",
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
		academicYear: d.academicYear || getDefaultCohortOption().academicYear,
		cohort: d.batch ? String(d.batch) : String(getDefaultCohortOption().cohort),

		bloodType: d.bloodType || "",
		diseaseHistory: d.diseaseHistory || "",
		hasBoneFracture: d.extraData?.hasBoneFracture ? "Ya" : "Tidak",
		boneFractureLocation: d.extraData?.boneFractureLocation || "",
		boneFractureYear: d.extraData?.boneFractureYear?.toString() || "",
		hasSurgery: d.extraData?.hasSurgery ? "Ya" : "Tidak",
		surgeryType: d.extraData?.surgeryType || "",
		surgeryYear: d.extraData?.surgeryYear?.toString() || "",
		lastEducation: d.extraData?.lastEducation || "",
		hasStudiedCollege: d.extraData?.priorCollege ? "Ya" : "Tidak",
		priorCollege: d.extraData?.priorCollege || "",
		ayahIncome: d.extraData?.ayahIncome || "",
		ibuIncome: d.extraData?.ibuIncome || "",
		waliIncome: d.extraData?.waliIncome || "",
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
		waliRole:
			d.waliGuardianRelation === "Ayah Kandung"
				? "ayah"
				: d.waliGuardianRelation === "Ibu Kandung"
					? "ibu"
					: d.waliName
						? "lainnya"
						: "ayah",
		waliEducation: d.waliEducation || "",
		waliJob: d.waliJob || "",
		waliAddress: d.waliAddress || "",
		waliPhone: d.waliPhone || "",
		waliEmail: d.waliEmail || "",
		waliGuardianRelation: d.waliGuardianRelation || "",

		// Tab 7: Informasi PMB & Referensi
		period: d.period || "",
		referralCategory: d.referralCategory || "",
		referralInstitutionName: d.referralInstitutionName || "",
		referralContactName: d.referralContactName || "",
		referralContactPhone: d.referralContactPhone || "",

		// Tab 8: Kontak & Darurat
		emergencyContacts: parseEmergencyContacts(d),
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
		<span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full ml-1.5">
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
		<div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-lg mt-1.5 flex items-start gap-2 animate-in fade-in duration-200">
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
	const cohortOptions = useMemo(() => getDynamicCohortOptions(), []);
	const token = (params?.token as string) || "";
	const draftKey = `pmb-form-draft:${token}`;
	const draftReady = useRef(false);
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
		academicYear: getDefaultCohortOption().academicYear,
		cohort: String(getDefaultCohortOption().cohort),

		// Tab 3: Kesehatan
		bloodType: "",
		diseaseHistory: "",
		lastEducation: "",
		hasStudiedCollege: "Tidak",
		priorCollege: "",
		ayahIncome: "",
		ibuIncome: "",
		waliIncome: "",
		hasBoneFracture: "Tidak",
		boneFractureLocation: "",
		boneFractureYear: "",
		hasSurgery: "Tidak",
		surgeryType: "",
		surgeryYear: "",
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
		waliRole: "ayah",
		waliEducation: "",
		waliJob: "",
		waliAddress: "",
		waliPhone: "",
		waliEmail: "",
		waliGuardianRelation: "",

		// Tab 7: Informasi PMB & Referensi
		period: "",
		referralCategory: "",
		referralInstitutionName: "",
		referralContactName: "",
		referralContactPhone: "",

		// Tab 8: Kontak & Darurat
		emergencyContacts: [emptyEmergencyContact()],
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
					if (
						Array.isArray(data.rejectedFields) &&
						data.rejectedFields.some((f: { fieldKey?: string }) =>
							f.fieldKey?.startsWith("wali"),
						)
					) {
						mapped.waliRole = "lainnya";
					}
					setFormData(mapped);
					if (data.existingData.profilePhotoUrl) {
						setPreviewUrl(data.existingData.profilePhotoUrl);
					}
				} else {
					// Pemulihan draf lokal (belum pernah dikirim ke server)
					try {
						const raw = localStorage.getItem(draftKey);
						if (raw) {
							const draft = JSON.parse(raw);
							if (draft?.formData?.name || draft?.formData?.phone) {
								setFormData((prev) => ({ ...prev, ...draft.formData }));
								toast.info("Draf isian sebelumnya dipulihkan.", {
									duration: 8000,
									action: {
										label: "Hapus draf",
										onClick: () => {
											localStorage.removeItem(draftKey);
											window.location.reload();
										},
									},
								});
							}
						}
					} catch {}
				}
				draftReady.current = true;

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

	// Simpan draf otomatis (hanya untuk pengisian baru) agar isian tidak hilang saat halaman dimuat ulang.
	useEffect(() => {
		if (!draftReady.current || isSubmitted || responseStatus) return;
		// Jangan simpan formulir yang masih kosong (hanya nilai bawaan).
		if (!formData.name.trim() && !formData.phone.trim()) return;
		const t = setTimeout(() => {
			try {
				localStorage.setItem(
					draftKey,
					JSON.stringify({ formData, savedAt: Date.now() }),
				);
			} catch {}
		}, 600);
		return () => clearTimeout(t);
	}, [formData, isSubmitted, responseStatus, draftKey]);

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
				if (key === "ayahIncome") next.waliIncome = value;
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
				if (key === "ibuIncome") next.waliIncome = value;
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
				"lastEducation",
				"schoolOrigin",
				"graduationYear",
				"schoolAddress",
			];
			const labels: Record<string, string> = {
				program: "Program Studi",
				subProgram: "Peminatan / Sub Program",
				classType: "Pilihan Kelas",
				cohort: "Angkatan",
				academicYear: "Tahun Ajaran",
				lastEducation: "Pendidikan Terakhir",
				schoolOrigin: "Nama Sekolah Asal",
				graduationYear: "Tahun Lulus",
				schoolAddress: "Alamat Sekolah",
			};
			if (!checkEmpty(reqKeys, labels)) return false;

			if (
				!(LAST_EDUCATION_OPTIONS as readonly string[]).includes(
					formData.lastEducation,
				)
			) {
				toast.error("Pendidikan terakhir hanya SMA, MA, SMK, atau Paket C");
				return false;
			}
			if (
				formData.hasStudiedCollege === "Ya" &&
				!formData.priorCollege.trim()
			) {
				toast.error("Nama perguruan tinggi sebelumnya wajib diisi");
				return false;
			}

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

			const thisYear = new Date().getFullYear();
			const validYear = (v: string) => {
				const y = Number(v);
				return Number.isInteger(y) && y >= 1900 && y <= thisYear;
			};
			if (formData.hasBoneFracture === "Ya") {
				if (!formData.boneFractureLocation.trim()) {
					toast.error("Bagian tubuh yang patah wajib diisi");
					return false;
				}
				if (!validYear(formData.boneFractureYear)) {
					toast.error(
						"Tahun kejadian patah tulang harus 4 digit tahun yang valid",
					);
					return false;
				}
			}
			if (formData.hasSurgery === "Ya") {
				if (!formData.surgeryType.trim()) {
					toast.error("Jenis operasi wajib diisi");
					return false;
				}
				if (!validYear(formData.surgeryYear)) {
					toast.error("Tahun operasi harus 4 digit tahun yang valid");
					return false;
				}
			}

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
		} else if (index === 4) {
			// Tab 5: Ayah Kandung
			if (!formData.ayahName || !formData.ayahName.trim()) {
				toast.error("Nama lengkap Ayah wajib diisi");
				return false;
			}
			if (!formData.ayahStatus) {
				toast.error("Keadaan Ayah wajib dipilih");
				return false;
			}

			if (formData.ayahStatus !== "Meninggal") {
				// Data inti wajib: Nama, Keadaan, Kewarganegaraan. Lainnya opsional.
				const reqKeys: (keyof typeof formData)[] = ["ayahNationality"];
				const labels: Record<string, string> = {
					ayahBirthPlace: "Tempat Lahir Ayah",
					ayahBirthDate: "Tanggal Lahir Ayah",
					ayahReligion: "Agama Ayah",
					ayahNationality: "Kewarganegaraan Ayah",
					ayahEducation: "Pendidikan Terakhir Ayah",
					ayahJob: "Pekerjaan Ayah",
					ayahIncome: "Rentang Pendapatan Ayah",
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

				if (formData.ayahEmail.trim() && !isValidEmail(formData.ayahEmail)) {
					toast.error("Format Email Ayah tidak valid (contoh: ayah@email.com)");
					return false;
				}

				const phoneErr = formData.ayahPhone.trim()
					? validateIndonesianPhone(formData.ayahPhone, "Nomor HP Ayah")
					: null;
				if (phoneErr) {
					toast.error(phoneErr);
					return false;
				}
			}
		} else if (index === 5) {
			// Tab 6: Ibu Kandung
			if (!formData.ibuName || !formData.ibuName.trim()) {
				toast.error("Nama lengkap Ibu wajib diisi");
				return false;
			}
			if (!formData.ibuStatus) {
				toast.error("Keadaan Ibu wajib dipilih");
				return false;
			}

			if (formData.ibuStatus !== "Meninggal") {
				// Data inti wajib: Nama, Keadaan, Kewarganegaraan. Lainnya opsional.
				const reqKeys: (keyof typeof formData)[] = ["ibuNationality"];
				const labels: Record<string, string> = {
					ibuBirthPlace: "Tempat Lahir Ibu",
					ibuBirthDate: "Tanggal Lahir Ibu",
					ibuReligion: "Agama Ibu",
					ibuNationality: "Kewarganegaraan Ibu",
					ibuEducation: "Pendidikan Terakhir Ibu",
					ibuJob: "Pekerjaan Ibu",
					ibuIncome: "Rentang Pendapatan Ibu",
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

				if (formData.ibuEmail.trim() && !isValidEmail(formData.ibuEmail)) {
					toast.error("Format Email Ibu tidak valid (contoh: ibu@email.com)");
					return false;
				}

				const phoneErr = formData.ibuPhone.trim()
					? validateIndonesianPhone(formData.ibuPhone, "Nomor HP Ibu")
					: null;
				if (phoneErr) {
					toast.error(phoneErr);
					return false;
				}
			}
		} else if (index === 3) {
			// Tab 4: Wali — bila ayah/ibu, data disinkronkan dari tab Ayah/Ibu
			if (formData.waliRole === "ayah" || formData.waliRole === "ibu") {
				return true;
			}
			const reqKeys: (keyof typeof formData)[] = [
				"waliName",
				"waliGuardianRelation",
				"waliBirthPlace",
				"waliBirthDate",
				"waliReligion",
				"waliNationality",
				"waliEducation",
				"waliJob",
				"waliIncome",
				"waliAddress",
				"waliPhone",
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
				waliIncome: "Rentang Pendapatan Wali",
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

			if (formData.waliEmail.trim() && !isValidEmail(formData.waliEmail)) {
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
				"period",
			];
			const labels: Record<string, string> = {
				referralCategory: "Kategori Referral",
				referralInstitutionName: "Institusi / Sekolah",
				referralContactName: "Nama PIC",
				period: "Batch Pendaftaran",
			};
			if (!checkEmpty(reqKeys, labels)) return false;

			if (formData.referralContactPhone.trim()) {
				const errRefPhone = validateIndonesianPhone(
					formData.referralContactPhone,
					"Nomor WhatsApp Kontak Referral",
				);
				if (errRefPhone) {
					toast.error(errRefPhone);
					return false;
				}
			}
			// Lanjutan tab 7: Kontak Darurat, Rekomendasi & Kawan
			const emergencyErr = validateEmergencyContacts(
				formData.emergencyContacts,
				validateIndonesianPhone,
			);
			if (emergencyErr) {
				toast.error(emergencyErr);
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
				formData.recommendedBy !== MANDIRI_RECOMMENDER &&
				(!formData.recommenderName || formData.recommenderName.trim() === "")
			) {
				toast.error(
					"Nama lengkap orang / pihak yang merekomendasikan wajib diisi",
				);
				return false;
			}

			// Validasi fleksibel: Wajib minimal 3 dan maksimal 5 kontak kawan/rekan lengkap
			if (formData.friendContacts.length < 3) {
				toast.error("Wajib mengisi minimal 3 kontak teman / rekan");
				return false;
			}

			for (let i = 0; i < formData.friendContacts.length; i++) {
				const fr = formData.friendContacts[i];
				if (!fr || !fr.name.trim()) {
					toast.error(`Nama teman ke-${i + 1} wajib diisi`);
					return false;
				}
				if (!fr.phone.trim()) {
					toast.error(
						`Nomor WhatsApp teman ke-${i + 1} (${fr.name || `Teman ${i + 1}`}) wajib diisi`,
					);
					return false;
				}
				const frErr = validateIndonesianPhone(
					fr.phone,
					`Nomor WhatsApp teman ke-${i + 1} (${fr.name})`,
				);
				if (frErr) {
					toast.error(frErr);
					return false;
				}
				if (!fr.schoolOrRelation || !fr.schoolOrRelation.trim()) {
					toast.error(
						`Asal sekolah / hubungan teman ke-${i + 1} (${fr.name}) wajib diisi`,
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

			const {
				hasBoneFracture,
				boneFractureLocation,
				boneFractureYear,
				hasSurgery,
				surgeryType,
				surgeryYear,
				lastEducation,
				hasStudiedCollege,
				priorCollege,
				ayahIncome,
				ibuIncome,
				waliIncome,
				waliRole: _waliRole,
				...baseData
			} = formData;
			const payload = {
				...baseData,
				extraData: {
					lastEducation,
					priorCollege: hasStudiedCollege === "Ya" ? priorCollege : "",
					ayahIncome,
					ibuIncome,
					waliIncome,
					hasBoneFracture: hasBoneFracture === "Ya",
					boneFractureLocation,
					boneFractureYear,
					hasSurgery: hasSurgery === "Ya",
					surgeryType,
					surgeryYear,
				},
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
				emergencyContacts: formData.emergencyContacts
					.filter((c) => c.name.trim() !== "" && c.phone.trim() !== "")
					.map((c) => ({
						name: c.name.trim(),
						phone: c.phone.trim(),
						relation: c.relation.trim(),
						...(c.note.trim() ? { note: c.note.trim() } : {}),
					})),
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
				try {
					localStorage.removeItem(draftKey);
				} catch {}
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

	const goHome = () => {
		window.location.href = "https://nusadayaacademy.com";
	};

	if (!isValidToken && !isSubmitted) {
		if (isApprovedMessage) {
			return (
				<FormMessageScreen
					title="Pendaftaran telah disetujui"
					tone="success"
					actions={
						<Button
							onClick={goHome}
							className="h-12 w-full bg-[#0517B0] text-base font-semibold hover:bg-blue-800 cursor-pointer"
						>
							Kembali ke beranda
						</Button>
					}
				>
					Pendaftaran Anda sudah diproses ke sistem OneData Nusadaya. Tautan ini
					tidak dapat diubah lagi.
				</FormMessageScreen>
			);
		}

		return (
			<FormMessageScreen title="Tautan tidak berlaku">
				Tautan formulir ini sudah tidak berlaku atau tidak ditemukan. Hubungi
				admin PMB untuk mendapatkan tautan baru.
			</FormMessageScreen>
		);
	}

	if (isSubmitted) {
		const isUpdate =
			responseStatus === "PENDING" || responseStatus === "REJECTED";
		return (
			<FormMessageScreen
				title={
					isUpdate ? "Perubahan berhasil dikirim" : "Formulir berhasil dikirim"
				}
				tone="success"
				actions={
					<>
						<Button
							onClick={() => window.open(`/form/${token}/dokumen`, "_blank")}
							className="h-12 w-full bg-[#0517B0] text-base font-semibold hover:bg-blue-800 cursor-pointer"
						>
							Unduh formulir (PDF)
						</Button>
						<Button
							variant="ghost"
							onClick={goHome}
							className="h-11 w-full text-slate-600 hover:bg-slate-100 cursor-pointer"
						>
							Kembali ke beranda
						</Button>
					</>
				}
			>
				{isUpdate
					? "Tim PMB akan meninjau perubahan Anda."
					: "Tim PMB akan segera menghubungi Anda."}
			</FormMessageScreen>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="mx-auto max-w-3xl px-4 pb-6 sm:px-6">
				{/* Header */}
				<header className="flex items-center gap-2.5 py-5">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/icon.svg" alt="" className="h-7 w-7 object-contain" />
					<span className="text-lg font-semibold tracking-tight text-slate-900">
						OneData <span className="font-light text-[#0517B0]">Nusadaya</span>
					</span>
				</header>

				<div className="mb-6">
					<h1 className="text-2xl font-semibold text-slate-900">
						Formulir Pendaftaran Mahasiswa
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Isi bertahap, data tersimpan otomatis di perangkat ini.
					</p>
				</div>

				{/* Status */}
				{responseStatus === "PENDING" && (
					<p className="mb-6 border-l-2 border-[#0517B0] pl-3 text-sm text-slate-600">
						Menunggu peninjauan tim PMB. Anda masih dapat mengoreksi data
						sebelum disetujui.
					</p>
				)}

				{responseStatus === "REJECTED" && (
					<div className="mb-6 space-y-2 border-l-2 border-rose-500 pl-3">
						<p className="text-sm font-semibold text-slate-900">
							Formulir perlu direvisi
						</p>
						<p className="text-sm text-slate-600">
							{rejectionNotes ||
								"Perbaiki kolom yang ditandai merah, lalu kirim ulang formulir."}
						</p>
						{rejectedFields.length > 0 && (
							<details className="text-sm">
								<summary className="flex min-h-11 cursor-pointer items-center text-[#0517B0]">
									Lihat {rejectedFields.length} kolom yang perlu diperbaiki
								</summary>
								<ul className="space-y-1">
									{rejectedFields.map((f, idx) => (
										<li key={idx}>
											<button
												type="button"
												onClick={() => {
													if (f.tabIndex >= 0 && f.tabIndex < TABS.length) {
														handleTabClick(f.tabIndex);
													}
												}}
												className="min-h-11 w-full text-left text-slate-700 hover:text-[#0517B0] [overflow-wrap:anywhere] cursor-pointer"
												title={f.reason ? `Catatan: ${f.reason}` : undefined}
											>
												{f.fieldLabel}
												<span className="text-slate-400">
													{" "}
													· {TABS[f.tabIndex] ?? `Langkah ${f.tabIndex + 1}`}
												</span>
											</button>
										</li>
									))}
								</ul>
							</details>
						)}
					</div>
				)}

				<FormProgress
					steps={TABS}
					current={currentTab}
					onSelect={handleTabClick}
					flagged={TABS.map((_, i) => i).filter(
						(i) =>
							rejectedTabs.includes(i) ||
							rejectedFields.some((f) => f.tabIndex === i),
					)}
				/>

				{/* Form Container */}
				<div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-8">
					{/* Catatan revisi untuk langkah ini */}
					{(rejectedTabs.includes(currentTab) ||
						currentTabRejectedFields.length > 0) && (
						<div className="mb-6 space-y-1 border-l-2 border-rose-500 pl-3 text-sm">
							<p className="font-semibold text-slate-900">
								Perbaiki bagian ini
							</p>
							{rejectionNotes && (
								<p className="text-slate-600">Catatan PMB: {rejectionNotes}</p>
							)}
							{currentTabRejectedFields.length > 0 && (
								<ul className="list-none space-y-0.5 pl-0 text-slate-600">
									{currentTabRejectedFields.map((f, idx) => (
										<li key={idx} className="[overflow-wrap:anywhere]">
											<span className="font-medium text-slate-800">
												{f.fieldLabel}
											</span>
											{f.reason && <span> — {f.reason}</span>}
										</li>
									))}
								</ul>
							)}
						</div>
					)}

					{/* TAB 1: Keterangan Mahasiswa */}
					{currentTab === 0 && (
						<div className="space-y-6 animate-in fade-in duration-200">
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
									} flex items-center justify-center bg-white cursor-pointer overflow-hidden group hover:border-[#0517B0] transition-colors relative`}
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
									<FieldRejectionAlert
										fieldKey="email"
										map={rejectedFieldsMap}
									/>
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
									<FieldRejectionAlert
										fieldKey="name"
										map={rejectedFieldsMap}
									/>
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
										<SelectTrigger
											className={getFieldBorderClass("nationality")}
										>
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
									<FieldRejectionAlert
										fieldKey="phone"
										map={rejectedFieldsMap}
									/>
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
										<SelectTrigger
											className={getFieldBorderClass("livingWith")}
										>
											<SelectValue placeholder="Pilih" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Orang tua">Orang tua</SelectItem>
											<SelectItem value="Wali">Wali</SelectItem>
											<SelectItem value="Sendiri (Kos)">
												Sendiri (Kos)
											</SelectItem>
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
										onChange={(e) =>
											updateData("addressStreet", e.target.value)
										}
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
										No. Rumah{" "}
										<span className="text-slate-400 font-normal">
											(opsional)
										</span>
									</Label>
									<Input
										placeholder="12A"
										value={formData.addressNo}
										onChange={(e) => updateData("addressNo", e.target.value)}
									/>
								</div>
								<RegionFields
									value={{
										province: formData.addressProvince,
										city: formData.addressCity,
										district: formData.addressDistrict,
										village: formData.addressVillage,
									}}
									onChange={(patch) =>
										setFormData((prev) => ({
											...prev,
											...(patch.province !== undefined && {
												addressProvince: patch.province,
											}),
											...(patch.city !== undefined && {
												addressCity: patch.city,
											}),
											...(patch.district !== undefined && {
												addressDistrict: patch.district,
											}),
											...(patch.village !== undefined && {
												addressVillage: patch.village,
											}),
										}))
									}
									extras={{
										city: {
											label: (
												<FieldRejectionBadge
													fieldKey="addressCity"
													map={rejectedFieldsMap}
												/>
											),
											alert: (
												<FieldRejectionAlert
													fieldKey="addressCity"
													map={rejectedFieldsMap}
												/>
											),
											className: getFieldBorderClass("addressCity"),
										},
									}}
								/>
							</div>
						</div>
					)}

					{/* TAB 2: Keterangan Pendidikan */}
					{currentTab === 1 && (
						<div className="space-y-6 animate-in fade-in duration-200">
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
											<SelectItem value="D3 Perhotelan">
												D3 Perhotelan
											</SelectItem>
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
										<SelectTrigger
											className={getFieldBorderClass("subProgram")}
										>
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
											<SelectItem value="Blended Learning (Online & Offline)">
												Blended Learning (Online & Offline)
											</SelectItem>
										</SelectContent>
									</Select>
									<FieldRejectionAlert
										fieldKey="classType"
										map={rejectedFieldsMap}
									/>
								</div>
								<div className="space-y-2 md:col-span-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Angkatan & Tahun Ajaran</span>{" "}
										<span className="text-red-500">*</span>
										<FieldRejectionBadge
											fieldKey="cohort"
											map={rejectedFieldsMap}
										/>
										<FieldRejectionBadge
											fieldKey="academicYear"
											map={rejectedFieldsMap}
										/>
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
										<SelectTrigger className={getFieldBorderClass("cohort")}>
											<SelectValue placeholder="Pilih Angkatan & Tahun Ajaran" />
										</SelectTrigger>
										<SelectContent>
											{formData.cohort &&
												!cohortOptions.some(
													(o) => String(o.cohort) === formData.cohort,
												) && (
													<SelectItem
														value={`${formData.cohort}|${formData.academicYear}`}
													>
														Angkatan {formData.cohort} ({formData.academicYear})
													</SelectItem>
												)}
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
									<FieldRejectionAlert
										fieldKey="cohort"
										map={rejectedFieldsMap}
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

								<div className="md:col-span-2">
									<OptionSelect
										label="Pendidikan Terakhir"
										required={true}
										value={formData.lastEducation}
										onChange={(v) => updateData("lastEducation", v)}
										options={LAST_EDUCATION_OPTIONS}
										placeholder="Pilih SMA / MA / SMK / Paket C"
									/>
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
										<span className="text-xs font-normal text-slate-400">
											(Opsional)
										</span>
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
										onChange={(e) =>
											updateData("schoolAddress", e.target.value)
										}
										className={getFieldBorderClass("schoolAddress")}
									/>
									<FieldRejectionAlert
										fieldKey="schoolAddress"
										map={rejectedFieldsMap}
									/>
								</div>
								<div className="rounded-xl border border-slate-200 bg-white px-4 md:col-span-2">
									<HealthQuestion
										label="Pernah kuliah sebelumnya?"
										noLabel="Belum pernah"
										yesLabel="Pernah"
										value={
											formData.hasStudiedCollege === "Ya" ? "ada" : "tidak"
										}
										onChange={(next) =>
											setFormData((prev) => ({
												...prev,
												hasStudiedCollege: next === "ada" ? "Ya" : "Tidak",
												priorCollege: next === "ada" ? prev.priorCollege : "",
											}))
										}
									>
										<div className="space-y-2">
											<Label>
												Nama Perguruan Tinggi{" "}
												<span className="text-red-500">*</span>
											</Label>
											<Input
												placeholder="Contoh: Universitas Lampung"
												value={formData.priorCollege}
												onChange={(e) =>
													updateData("priorCollege", e.target.value)
												}
											/>
										</div>
									</HealthQuestion>
								</div>
							</div>
						</div>
					)}

					{/* TAB 3: Keterangan Kesehatan */}
					{currentTab === 2 && (
						<div className="space-y-6 animate-in fade-in duration-200">
							<h3 className="font-semibold text-lg border-b pb-2">
								Keterangan Kesehatan
							</h3>
							<section className="space-y-3">
								<h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
									Data Fisik
								</h4>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
											<SelectTrigger
												className={getFieldBorderClass("bloodType")}
											>
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
											<span>Tinggi Badan</span>{" "}
											<span className="text-red-500">*</span>
											<FieldRejectionBadge
												fieldKey="height"
												map={rejectedFieldsMap}
											/>
										</Label>
										<div className="relative">
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
												className={`pr-10 ${getFieldBorderClass("height")}`}
											/>
											<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
												cm
											</span>
										</div>
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
											<span>Berat Badan</span>{" "}
											<span className="text-red-500">*</span>
											<FieldRejectionBadge
												fieldKey="weight"
												map={rejectedFieldsMap}
											/>
										</Label>
										<div className="relative">
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
												className={`pr-10 ${getFieldBorderClass("weight")}`}
											/>
											<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
												kg
											</span>
										</div>
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
								</div>
							</section>

							<section className="space-y-1">
								<h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
									Riwayat Kesehatan
								</h4>
								<div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-4">
									<div>
										<YesNoWithDetail
											rowLabel={
												<span className="flex items-center flex-wrap gap-1">
													Riwayat Penyakit{" "}
													<span className="text-red-500">*</span>
													<FieldRejectionBadge
														fieldKey="diseaseHistory"
														map={rejectedFieldsMap}
													/>
												</span>
											}
											value={formData.diseaseHistory}
											onChange={(v) => updateData("diseaseHistory", v)}
											placeholder="Jelaskan riwayat penyakit (jenis, tahun, kondisi saat ini)"
											detailClassName={getFieldBorderClass(
												"diseaseHistory",
												"bg-white",
											)}
										/>
										<div className="pb-3 empty:hidden">
											<FieldRejectionAlert
												fieldKey="diseaseHistory"
												map={rejectedFieldsMap}
											/>
										</div>
									</div>
									<div>
										<YesNoWithDetail
											rowLabel={
												<span className="flex items-center flex-wrap gap-1">
													Penyakit Bawaan{" "}
													<span className="text-red-500">*</span>
													<FieldRejectionBadge
														fieldKey="congenitalDisease"
														map={rejectedFieldsMap}
													/>
												</span>
											}
											value={formData.congenitalDisease}
											onChange={(v) => updateData("congenitalDisease", v)}
											placeholder="Jelaskan penyakit bawaan (jenis, sejak kapan, kondisi saat ini)"
											detailClassName={getFieldBorderClass(
												"congenitalDisease",
												"bg-white",
											)}
										/>
										<div className="pb-3 empty:hidden">
											<FieldRejectionAlert
												fieldKey="congenitalDisease"
												map={rejectedFieldsMap}
											/>
										</div>
									</div>
									<HealthQuestion
										label={
											<>
												Pernah Mengalami Patah Tulang?{" "}
												<span className="text-red-500">*</span>
											</>
										}
										noLabel="Tidak pernah"
										yesLabel="Pernah"
										value={formData.hasBoneFracture === "Ya" ? "ada" : "tidak"}
										onChange={(next) =>
											setFormData((prev) => ({
												...prev,
												hasBoneFracture: next === "ada" ? "Ya" : "Tidak",
												...(next === "tidak" && {
													boneFractureLocation: "",
													boneFractureYear: "",
												}),
											}))
										}
									>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>
													Bagian Tubuh yang Patah{" "}
													<span className="text-red-500">*</span>
												</Label>
												<Input
													placeholder="Contoh: Lengan kanan, kaki kiri"
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
													inputMode="numeric"
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
									</HealthQuestion>
									<HealthQuestion
										label={
											<>
												Pernah Menjalani Operasi?{" "}
												<span className="text-red-500">*</span>
											</>
										}
										noLabel="Tidak pernah"
										yesLabel="Pernah"
										value={formData.hasSurgery === "Ya" ? "ada" : "tidak"}
										onChange={(next) =>
											setFormData((prev) => ({
												...prev,
												hasSurgery: next === "ada" ? "Ya" : "Tidak",
												...(next === "tidak" && {
													surgeryType: "",
													surgeryYear: "",
												}),
											}))
										}
									>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>
													Jenis / Rincian Operasi{" "}
													<span className="text-red-500">*</span>
												</Label>
												<Input
													placeholder="Contoh: Usus buntu, amandel"
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
													inputMode="numeric"
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
									</HealthQuestion>
								</div>
							</section>
						</div>
					)}

					{/* TAB 5: Ayah Kandung */}
					{currentTab === 4 && (
						<div className="space-y-6 animate-in fade-in duration-200">
							<h3 className="font-semibold text-lg border-b pb-2">
								Keterangan Ayah Kandung
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Nama Ayah</span>{" "}
										<span className="text-red-500">*</span>
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
										<SelectTrigger
											className={getFieldBorderClass("ayahStatus")}
										>
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
										<FieldRejectionBadge
											fieldKey="ayahBirthPlace"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Input
										placeholder="Kota kelahiran"
										value={formData.ayahBirthPlace}
										onChange={(e) =>
											updateData("ayahBirthPlace", e.target.value)
										}
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
										<FieldRejectionBadge
											fieldKey="ayahBirthDate"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Input
										type="date"
										value={formData.ayahBirthDate}
										onChange={(e) =>
											updateData("ayahBirthDate", e.target.value)
										}
										className={getFieldBorderClass("ayahBirthDate")}
									/>
									<FieldRejectionAlert
										fieldKey="ayahBirthDate"
										map={rejectedFieldsMap}
									/>
								</div>
								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Agama</span>
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
										<FieldRejectionBadge
											fieldKey="ayahEducation"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Input
										placeholder="SD/SMP/SMA/S1..."
										value={formData.ayahEducation}
										onChange={(e) =>
											updateData("ayahEducation", e.target.value)
										}
										className={getFieldBorderClass("ayahEducation")}
									/>
									<FieldRejectionAlert
										fieldKey="ayahEducation"
										map={rejectedFieldsMap}
									/>
								</div>
								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Pekerjaan</span>{" "}
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
								<OptionSelect
									label="Rentang Pendapatan"
									required={true}
									value={formData.ayahIncome}
									onChange={(v) => updateData("ayahIncome", v)}
									options={INCOME_RANGE_OPTIONS}
									placeholder="Pilih rentang pendapatan"
								/>
								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Nomor HP</span>{" "}
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
										<span>Email</span>
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

					{/* TAB 6: Ibu Kandung */}
					{currentTab === 5 && (
						<div className="space-y-6 animate-in fade-in duration-200">
							<h3 className="font-semibold text-lg border-b pb-2">
								Keterangan Ibu Kandung
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Nama Ibu</span>{" "}
										<span className="text-red-500">*</span>
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
										<FieldRejectionBadge
											fieldKey="ibuBirthPlace"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Input
										placeholder="Kota kelahiran"
										value={formData.ibuBirthPlace}
										onChange={(e) =>
											updateData("ibuBirthPlace", e.target.value)
										}
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
										<span>Agama</span>
										<FieldRejectionBadge
											fieldKey="ibuReligion"
											map={rejectedFieldsMap}
										/>
									</Label>
									<Select
										value={formData.ibuReligion}
										onValueChange={(v) => updateData("ibuReligion", v)}
									>
										<SelectTrigger
											className={getFieldBorderClass("ibuReligion")}
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
										<span>Pekerjaan</span>{" "}
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
								<OptionSelect
									label="Rentang Pendapatan"
									required={true}
									value={formData.ibuIncome}
									onChange={(v) => updateData("ibuIncome", v)}
									options={INCOME_RANGE_OPTIONS}
									placeholder="Pilih rentang pendapatan"
								/>
								<div className="space-y-2">
									<Label className="flex items-center flex-wrap gap-1">
										<span>Nomor HP</span>{" "}
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
										<span>Email</span>
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

					{/* TAB 4: Wali */}
					{currentTab === 3 && (
						<div className="space-y-6 animate-in fade-in duration-200">
							<h3 className="font-semibold text-lg border-b pb-2">
								Keterangan Wali
							</h3>

							<div className="space-y-3">
								<Label className="text-sm font-medium">
									Siapa yang Bertindak Sebagai Wali Mahasiswa?{" "}
									<span className="text-red-500">*</span>
								</Label>
								<RadioGroup
									value={formData.waliRole || "ayah"}
									onValueChange={(val) => {
										setFormData((prev) => {
											const from = (who: "ayah" | "ibu", rel: string) => ({
												waliName: prev[`${who}Name`],
												waliGuardianRelation: rel,
												waliNationality: prev[`${who}Nationality`],
												waliNationalityOther: prev[`${who}NationalityOther`],
												waliPhone: prev[`${who}Phone`],
												waliEmail: prev[`${who}Email`],
												waliAddress: prev[`${who}Address`],
												waliBirthPlace: prev[`${who}BirthPlace`],
												waliBirthDate: prev[`${who}BirthDate`],
												waliReligion: prev[`${who}Religion`],
												waliEducation: prev[`${who}Education`],
												waliJob: prev[`${who}Job`],
												waliIncome: prev[`${who}Income`],
											});
											return {
												...prev,
												waliRole: val,
												...(val === "ayah"
													? from("ayah", "Ayah Kandung")
													: val === "ibu"
														? from("ibu", "Ibu Kandung")
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
																waliIncome: "",
															}),
											};
										});
									}}
									className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1"
								>
									<div className="flex min-h-11 items-center space-x-2.5 p-3 bg-white border rounded-md cursor-pointer hover:border-primary">
										<RadioGroupItem value="ayah" id="pub-wali-ayah" />
										<Label
											htmlFor="pub-wali-ayah"
											className="cursor-pointer font-medium text-sm"
										>
											Ayah Kandung
										</Label>
									</div>
									<div className="flex min-h-11 items-center space-x-2.5 p-3 bg-white border rounded-md cursor-pointer hover:border-primary">
										<RadioGroupItem value="ibu" id="pub-wali-ibu" />
										<Label
											htmlFor="pub-wali-ibu"
											className="cursor-pointer font-medium text-sm"
										>
											Ibu Kandung
										</Label>
									</div>
									<div className="flex min-h-11 items-center space-x-2.5 p-3 bg-white border rounded-md cursor-pointer hover:border-primary">
										<RadioGroupItem value="lainnya" id="pub-wali-lainnya" />
										<Label
											htmlFor="pub-wali-lainnya"
											className="cursor-pointer font-medium text-sm"
										>
											Wali Lainnya
										</Label>
									</div>
								</RadioGroup>
							</div>

							{formData.waliRole === "ayah" && (
								<div className="border-l-2 border-slate-300 pl-3 text-sm text-slate-600 space-y-1">
									<div className="font-medium text-slate-900">
										Data wali otomatis sama dengan Ayah Kandung
									</div>
									<p className="text-xs text-slate-600">
										Nama wali:{" "}
										<strong>
											{formData.ayahName ||
												"(akan diisi di Tab 5: Ayah Kandung)"}
										</strong>
									</p>
									<p className="text-xs text-slate-500">
										Tidak perlu mengisi ulang. Klik Lanjut untuk melengkapi data
										Ayah Kandung.
									</p>
								</div>
							)}

							{formData.waliRole === "ibu" && (
								<div className="border-l-2 border-slate-300 pl-3 text-sm text-slate-600 space-y-1">
									<div className="font-medium text-slate-900">
										Data wali otomatis sama dengan Ibu Kandung
									</div>
									<p className="text-xs text-slate-600">
										Nama wali:{" "}
										<strong>
											{formData.ibuName || "(akan diisi di Tab 6: Ibu Kandung)"}
										</strong>
									</p>
									<p className="text-xs text-slate-500">
										Tidak perlu mengisi ulang. Klik Lanjut untuk melengkapi data
										Ibu Kandung.
									</p>
								</div>
							)}

							{formData.waliRole === "lainnya" && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<Label className="flex items-center flex-wrap gap-1">
											<span>Nama Wali</span>{" "}
											<span className="text-red-500">*</span>
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
											onChange={(e) =>
												updateData("waliBirthPlace", e.target.value)
											}
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
											onChange={(e) =>
												updateData("waliBirthDate", e.target.value)
											}
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
											onChange={(e) =>
												updateData("waliEducation", e.target.value)
											}
											className={getFieldBorderClass("waliEducation")}
										/>
										<FieldRejectionAlert
											fieldKey="waliEducation"
											map={rejectedFieldsMap}
										/>
									</div>
									<div className="space-y-2">
										<Label className="flex items-center flex-wrap gap-1">
											<span>Pekerjaan</span>{" "}
											<span className="text-red-500">*</span>
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
									<OptionSelect
										label="Rentang Pendapatan"
										required={true}
										value={formData.waliIncome}
										onChange={(v) => updateData("waliIncome", v)}
										options={INCOME_RANGE_OPTIONS}
										placeholder="Pilih rentang pendapatan"
									/>
									<div className="space-y-2">
										<Label className="flex items-center flex-wrap gap-1">
											<span>Nomor HP</span>{" "}
											<span className="text-red-500">*</span>
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
											<span>Email</span>
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
											onChange={(e) =>
												updateData("waliAddress", e.target.value)
											}
											className={getFieldBorderClass("waliAddress")}
										/>
										<FieldRejectionAlert
											fieldKey="waliAddress"
											map={rejectedFieldsMap}
										/>
									</div>
								</div>
							)}
						</div>
					)}

					{/* TAB 7: Informasi PMB */}
					{currentTab === 6 && (
						<div className="space-y-8 animate-in fade-in duration-200">
							<h3 className="font-semibold text-lg border-b pb-2">
								Informasi PMB
							</h3>

							<section className="space-y-3">
								<h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
									Pendaftaran
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
										<p className="text-xs text-slate-400">
											Otomatis disesuaikan dengan pilihan Peminatan di
											Keterangan Pendidikan
										</p>
									</div>

									<div className="space-y-2">
										<Label className="flex items-center flex-wrap gap-1">
											<span>Batch Pendaftaran</span>{" "}
											<span className="text-red-500">*</span>
											<FieldRejectionBadge
												fieldKey="period"
												map={rejectedFieldsMap}
											/>
										</Label>
										<Input
											placeholder="Contoh: Batch 1 atau 2026/2027"
											value={formData.period}
											onChange={(e) => updateData("period", e.target.value)}
											className={getFieldBorderClass("period")}
										/>
										<FieldRejectionAlert
											fieldKey="period"
											map={rejectedFieldsMap}
										/>
									</div>
								</div>
							</section>

							<section className="space-y-3">
								<h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
									Asal Referral
								</h4>
								<p className="text-xs text-slate-500">
									Nomor kontak referral boleh dikosongkan bila tidak ada.
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
											<span>Institusi / Sekolah</span>{" "}
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
											<span>Nama PIC</span>{" "}
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
											<span>WhatsApp PIC</span>
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
							</section>
						</div>
					)}

					{/* TAB 7 (lanjutan): Kontak Darurat, Rekomendasi & Kawan */}
					{currentTab === 6 && (
						<div className="space-y-6 mt-8 animate-in fade-in duration-200">
							<h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
								Kontak & Rekomendasi
							</h4>

							{/* Seksi Kontak Darurat */}
							<div className="space-y-3">
								<h4 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-2">
									Kontak Darurat (Keluarga / Kerabat Terdekat)
								</h4>
								<p className="text-xs text-slate-500 mb-4">
									Kontak yang dapat dihubungi oleh pihak kampus dalam situasi
									mendesak atau darurat.
								</p>

								<EmergencyContactsFields
									contacts={formData.emergencyContacts}
									onChange={(next) => updateData("emergencyContacts", next)}
									extras={{
										label: () => (
											<>
												<FieldRejectionBadge
													fieldKey="emergencyContactName"
													map={rejectedFieldsMap}
												/>
												<FieldRejectionBadge
													fieldKey="emergencyContactPhone"
													map={rejectedFieldsMap}
												/>
												<FieldRejectionBadge
													fieldKey="emergencyContactRelation"
													map={rejectedFieldsMap}
												/>
											</>
										),
										alert: () => (
											<>
												<FieldRejectionAlert
													fieldKey="emergencyContactName"
													map={rejectedFieldsMap}
												/>
												<FieldRejectionAlert
													fieldKey="emergencyContactPhone"
													map={rejectedFieldsMap}
												/>
												<FieldRejectionAlert
													fieldKey="emergencyContactRelation"
													map={rejectedFieldsMap}
												/>
											</>
										),
										className: () =>
											getFieldBorderClass("emergencyContactName", "bg-white"),
									}}
								/>
							</div>

							{/* Seksi Pemberi Rekomendasi Pendaftaran */}
							<div className="space-y-3">
								<h4 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-2">
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
												{RECOMMENDED_BY_OPTIONS.map((opt) => (
													<SelectItem key={opt} value={opt}>
														{opt}
													</SelectItem>
												))}
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
											{formData.recommendedBy !== MANDIRI_RECOMMENDER && (
												<span className="text-red-500">*</span>
											)}
											<FieldRejectionBadge
												fieldKey="recommenderName"
												map={rejectedFieldsMap}
											/>
										</Label>
										<Input
											placeholder={
												formData.recommendedBy === MANDIRI_RECOMMENDER
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
										<span>Daftar Kontak Teman / Rekan</span>{" "}
										<span className="text-red-500">*</span>
										<FieldRejectionBadge
											fieldKey="friendContacts"
											map={rejectedFieldsMap}
										/>
									</h4>
									<p className="text-xs text-slate-500 mt-0.5">
										{FRIEND_CONTACTS_PROMPT} Wajib minimal 3 kontak (maksimal
										5).
									</p>
									<FieldRejectionAlert
										fieldKey="friendContacts"
										map={rejectedFieldsMap}
									/>
								</div>

								<FriendContactsFields
									contacts={formData.friendContacts}
									onChange={(next) => updateData("friendContacts", next)}
								/>
							</div>
						</div>
					)}
				</div>

				<FormNav
					isFirst={currentTab === 0}
					isLast={currentTab === TABS.length - 1}
					loading={isLoading}
					onBack={handlePrev}
					onNext={handleNext}
					onSubmit={handleSubmit}
					submitLabel="Kirim Formulir"
				/>
			</div>
		</div>
	);
}
