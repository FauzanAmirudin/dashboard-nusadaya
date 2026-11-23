import { describe, expect, it } from "bun:test";
import {
	MAX_EMERGENCY_CONTACTS,
	normalizeEmergencyContacts,
} from "../src/lib/emergency-contacts";

describe("normalizeEmergencyContacts", () => {
	it("membaca data lama (kolom tunggal) sebagai satu kontak", () => {
		const r = normalizeEmergencyContacts({
			emergencyContactName: "Budi",
			emergencyContactPhone: "0812345678",
			emergencyContactRelation: "Ayah",
		});
		expect(r.emergencyContacts).toEqual([
			{ name: "Budi", phone: "0812345678", relation: "Ayah" },
		]);
		expect(r.emergencyContactName).toBe("Budi");
	});

	it("kontak pertama dicerminkan ke kolom lama", () => {
		const r = normalizeEmergencyContacts({
			emergencyContacts: [
				{ name: "Siti", phone: "0811", relation: "Ibu" },
				{ name: "Andi", phone: "0822", relation: "Saudara", note: "Kakak" },
			],
		});
		expect(r.emergencyContactName).toBe("Siti");
		expect(r.emergencyContactPhone).toBe("0811");
		expect(r.emergencyContactRelation).toBe("Ibu");
		expect(r.emergencyContacts[1].note).toBe("Kakak");
	});

	it("membuang baris kosong dan membatasi jumlah maksimum", () => {
		const many = Array.from({ length: 6 }, (_, i) => ({
			name: `K${i}`,
			phone: `08${i}`,
			relation: "Teman",
		}));
		const r = normalizeEmergencyContacts({
			emergencyContacts: [{ name: "", phone: "", relation: "" }, ...many],
		});
		expect(r.emergencyContacts.length).toBe(MAX_EMERGENCY_CONTACTS);
		expect(r.emergencyContacts[0].name).toBe("K0");
	});

	it("menerima JSON string dan input kosong", () => {
		const r = normalizeEmergencyContacts({
			emergencyContacts: JSON.stringify([
				{ name: "A", phone: "1", relation: "Wali" },
			]),
		});
		expect(r.emergencyContacts.length).toBe(1);
		const empty = normalizeEmergencyContacts({});
		expect(empty.emergencyContacts).toEqual([]);
		expect(empty.emergencyContactName).toBeNull();
	});
});
