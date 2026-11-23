"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { filterPhone, preventNonPhoneKey } from "@/utils/form-validators";

export interface FriendContactItem {
	name: string;
	phone: string;
	schoolOrRelation: string;
}

export const MIN_FRIEND_CONTACTS = 3;
export const MAX_FRIEND_CONTACTS = 5;

export const emptyFriendContacts = (): FriendContactItem[] =>
	Array.from({ length: MIN_FRIEND_CONTACTS }, () => ({
		name: "",
		phone: "",
		schoolOrRelation: "",
	}));

/** Pesan error pertama, atau null bila daftar kontak prospek valid. */
export function validateFriendContacts(
	contacts: FriendContactItem[],
	validatePhone: (phone: string, label: string) => string | null,
): string | null {
	if (contacts.length < MIN_FRIEND_CONTACTS)
		return `Wajib mengisi minimal ${MIN_FRIEND_CONTACTS} kontak prospek`;
	for (let i = 0; i < contacts.length; i++) {
		const f = contacts[i];
		if (!f.name.trim()) return `Nama kontak prospek ke-${i + 1} wajib diisi`;
		if (!f.phone.trim())
			return `Nomor WhatsApp kontak prospek ke-${i + 1} wajib diisi`;
		const err = validatePhone(
			f.phone,
			`Nomor WhatsApp kontak prospek ke-${i + 1}`,
		);
		if (err) return err;
		if (!f.schoolOrRelation.trim())
			return `Asal sekolah / hubungan kontak prospek ke-${i + 1} wajib diisi`;
	}
	return null;
}

interface FriendContactsFieldsProps {
	contacts: FriendContactItem[];
	onChange: (next: FriendContactItem[]) => void;
}

/** Kalimat arahan untuk daftar kontak prospek. */
export const FRIEND_CONTACTS_PROMPT =
	"Kontak teman atau rekan yang ingin kamu rekomendasikan agar dapat manfaat kuliah dan magang berpenghasilan dari Nusadaya.";

export function FriendContactsFields({
	contacts,
	onChange,
}: FriendContactsFieldsProps) {
	const update = (index: number, patch: Partial<FriendContactItem>) =>
		onChange(contacts.map((c, i) => (i === index ? { ...c, ...patch } : c)));

	return (
		<div className="space-y-4">
			{contacts.map((f, idx) => (
				<div
					key={idx}
					className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/80 flex flex-col md:flex-row gap-3 items-start md:items-center"
				>
					<div className="w-7 h-7 rounded-full bg-blue-100 text-[#0517B0] font-bold text-xs flex items-center justify-center shrink-0">
						{idx + 1}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 w-full min-w-0">
						<div className="space-y-1 min-w-0">
							<Label className="text-xs">
								Nama Kontak ke-{idx + 1} <span className="text-red-500">*</span>
							</Label>
							<Input
								placeholder="Nama lengkap"
								value={f.name}
								onChange={(e) => update(idx, { name: e.target.value })}
								className="bg-white h-9 text-sm"
							/>
						</div>
						<div className="space-y-1 min-w-0">
							<Label className="text-xs">
								Nomor WhatsApp <span className="text-red-500">*</span>
							</Label>
							<Input
								type="tel"
								placeholder="0812xxxx"
								value={f.phone}
								onKeyDown={preventNonPhoneKey}
								onChange={(e) =>
									update(idx, { phone: filterPhone(e.target.value, 15) })
								}
								className="bg-white h-9 text-sm"
							/>
						</div>
						<div className="space-y-1 min-w-0">
							<Label className="text-xs">
								Asal Sekolah / Hubungan <span className="text-red-500">*</span>
							</Label>
							<Input
								placeholder="Contoh: SMAN 1 Denpasar / Teman Sekolah"
								value={f.schoolOrRelation}
								onChange={(e) =>
									update(idx, { schoolOrRelation: e.target.value })
								}
								className="bg-white h-9 text-sm"
							/>
						</div>
					</div>
					{idx >= MIN_FRIEND_CONTACTS ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => onChange(contacts.filter((_, i) => i !== idx))}
							className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 self-end md:self-center h-9 px-2.5 text-xs gap-1 cursor-pointer"
							aria-label={`Hapus kontak prospek ${idx + 1}`}
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

			<div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<p className="text-xs text-slate-500">
					Kontak 1–{MIN_FRIEND_CONTACTS} wajib diisi. Dapat ditambah hingga{" "}
					{MAX_FRIEND_CONTACTS} kontak.
				</p>
				{contacts.length < MAX_FRIEND_CONTACTS && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() =>
							onChange([
								...contacts,
								{ name: "", phone: "", schoolOrRelation: "" },
							])
						}
						className="border-dashed border-blue-300 text-[#0517B0] hover:bg-blue-50 font-semibold gap-1.5 self-start sm:self-auto cursor-pointer"
					>
						<Plus className="w-4 h-4" />
						Tambah Kontak ({contacts.length}/{MAX_FRIEND_CONTACTS})
					</Button>
				)}
			</div>
		</div>
	);
}
