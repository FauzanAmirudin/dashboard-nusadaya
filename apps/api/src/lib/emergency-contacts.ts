export const MAX_EMERGENCY_CONTACTS = 3;

export interface EmergencyContact {
	name: string;
	phone: string;
	relation: string;
	note?: string;
}

interface EmergencyContactsInput {
	emergencyContacts?: unknown;
	emergencyContactName?: string | null;
	emergencyContactPhone?: string | null;
	emergencyContactRelation?: string | null;
}

/**
 * Normalisasi daftar kontak darurat (maks. MAX_EMERGENCY_CONTACTS).
 * Kontak pertama juga dikembalikan sebagai kolom lama (name/phone/relation)
 * agar laporan PA & CRM yang masih membaca kolom tunggal tetap bekerja.
 * Data lama (hanya kolom tunggal) dibaca sebagai satu kontak.
 */
export function normalizeEmergencyContacts(input: EmergencyContactsInput) {
	let raw: unknown = input.emergencyContacts;
	if (typeof raw === "string") {
		try {
			raw = JSON.parse(raw);
		} catch {
			raw = [];
		}
	}

	const contacts: EmergencyContact[] = (Array.isArray(raw) ? raw : [])
		.map((c: any) => ({
			name: String(c?.name ?? "").trim(),
			phone: String(c?.phone ?? "").trim(),
			relation: String(c?.relation ?? "").trim(),
			...(c?.note && String(c.note).trim()
				? { note: String(c.note).trim() }
				: {}),
		}))
		.filter((c) => c.name || c.phone)
		.slice(0, MAX_EMERGENCY_CONTACTS);

	if (
		contacts.length === 0 &&
		(input.emergencyContactName || input.emergencyContactPhone)
	) {
		contacts.push({
			name: (input.emergencyContactName || "").trim(),
			phone: (input.emergencyContactPhone || "").trim(),
			relation: (input.emergencyContactRelation || "").trim(),
		});
	}

	const first = contacts[0];
	return {
		emergencyContacts: contacts,
		emergencyContactName: first?.name || null,
		emergencyContactPhone: first?.phone || null,
		emergencyContactRelation: first?.relation || null,
	};
}
