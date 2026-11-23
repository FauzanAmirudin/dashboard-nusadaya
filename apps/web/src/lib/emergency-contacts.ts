export const MAX_EMERGENCY_CONTACTS = 3;

export interface EmergencyContactItem {
	name: string;
	phone: string;
	relation: string;
	/** Keterangan bebas, wajib bila hubungan = "Lainnya". */
	note: string;
}

export const emptyEmergencyContact = (): EmergencyContactItem => ({
	name: "",
	phone: "",
	relation: "",
	note: "",
});

export interface RelationOption {
	value: string;
	label: string;
}

// Nilai "Kakak", "Adik", "Saudara Lain" dipertahankan agar cocok dengan data lama.
const OTHER_RELATIONS: RelationOption[] = [
	{ value: "Kakak", label: "Kakak Kandung" },
	{ value: "Adik", label: "Adik Kandung" },
	{ value: "Paman / Bibi", label: "Paman / Bibi" },
	{ value: "Saudara Lain", label: "Saudara / Kerabat Lain" },
	{ value: "Tetangga", label: "Tetangga" },
	{ value: "Teman", label: "Teman" },
	{ value: "Guru", label: "Guru" },
	{ value: "Lainnya", label: "Lainnya" },
];

/** Kontak pertama boleh orang tua / wali; kontak kedua dst. harus selain keduanya. */
export const getEmergencyRelationOptions = (index: number): RelationOption[] =>
	index === 0
		? [
				{ value: "Orang Tua", label: "Orang Tua" },
				{ value: "Wali", label: "Wali" },
				...OTHER_RELATIONS,
			]
		: OTHER_RELATIONS;

/**
 * Bentuk daftar kontak darurat dari respons / data mahasiswa.
 * Data lama (kolom tunggal) dibaca sebagai satu kontak. Selalu minimal 1 baris.
 */
export function parseEmergencyContacts(d: {
	emergencyContacts?: unknown;
	emergencyContactName?: string | null;
	emergencyContactPhone?: string | null;
	emergencyContactRelation?: string | null;
}): EmergencyContactItem[] {
	const list = Array.isArray(d.emergencyContacts)
		? (d.emergencyContacts as Array<Partial<EmergencyContactItem>>)
		: [];
	const items = list
		.filter((c) => c?.name || c?.phone)
		.slice(0, MAX_EMERGENCY_CONTACTS)
		.map((c) => ({
			name: c.name || "",
			phone: c.phone || "",
			relation: c.relation || "",
			note: c.note || "",
		}));
	if (
		items.length === 0 &&
		(d.emergencyContactName || d.emergencyContactPhone)
	) {
		items.push({
			name: d.emergencyContactName || "",
			phone: d.emergencyContactPhone || "",
			relation: d.emergencyContactRelation || "",
			note: "",
		});
	}
	return items.length > 0 ? items : [emptyEmergencyContact()];
}

/**
 * Validasi pada batas form. `validatePhone` mengembalikan pesan error atau null.
 * Kontak pertama wajib lengkap bila `required`; kontak tambahan wajib lengkap bila
 * baris tersebut ada (hapus baris bila tidak dipakai).
 */
export function validateEmergencyContacts(
	contacts: EmergencyContactItem[],
	validatePhone: (phone: string, label: string) => string | null,
	required = true,
): string | null {
	for (let i = 0; i < contacts.length; i++) {
		const c = contacts[i];
		const label = `Kontak Darurat ${i + 1}`;
		const touched = c.name.trim() || c.phone.trim() || c.relation.trim();
		if (i === 0 && !required && !touched) continue;
		if (!c.name.trim()) return `Nama ${label} wajib diisi`;
		if (!c.phone.trim()) return `Nomor WhatsApp ${label} wajib diisi`;
		const phoneErr = validatePhone(c.phone, `Nomor ${label}`);
		if (phoneErr) return phoneErr;
		if (!c.relation.trim()) return `Hubungan ${label} wajib dipilih`;
		if (c.relation === "Lainnya" && !c.note.trim())
			return `Keterangan hubungan ${label} wajib diisi`;
		if (i > 0 && ["Orang Tua", "Wali"].includes(c.relation))
			return `${label} harus selain Orang Tua atau Wali`;
	}
	return null;
}
