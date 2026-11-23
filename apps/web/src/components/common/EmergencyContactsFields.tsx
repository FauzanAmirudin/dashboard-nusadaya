"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
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
import {
	type EmergencyContactItem,
	emptyEmergencyContact,
	getEmergencyRelationOptions,
	MAX_EMERGENCY_CONTACTS,
} from "@/lib/emergency-contacts";
import { filterPhone, preventNonPhoneKey } from "@/utils/form-validators";

interface EmergencyContactsFieldsProps {
	contacts: EmergencyContactItem[];
	onChange: (next: EmergencyContactItem[]) => void;
	/** Tampilkan tanda wajib pada kontak pertama. */
	required?: boolean;
	/** Slot penolakan revisi PMB (hanya untuk form tautan). */
	extras?: {
		label?: (index: number) => ReactNode;
		alert?: (index: number) => ReactNode;
		className?: (index: number) => string | undefined;
	};
}

export function EmergencyContactsFields({
	contacts,
	onChange,
	required = true,
	extras,
}: EmergencyContactsFieldsProps) {
	const update = (index: number, patch: Partial<EmergencyContactItem>) =>
		onChange(contacts.map((c, i) => (i === index ? { ...c, ...patch } : c)));

	return (
		<div className="space-y-4">
			{contacts.map((c, idx) => {
				const relationOptions = getEmergencyRelationOptions(idx);
				const star = required && idx === 0;
				return (
					<div
						key={idx}
						className="p-4 bg-white rounded-xl border border-slate-200 space-y-3"
					>
						<div className="flex items-center justify-between gap-2">
							<span className="text-xs font-semibold text-slate-600">
								Kontak Darurat {idx + 1}
								{idx > 0 && (
									<span className="font-normal text-slate-400">
										{" "}
										— selain orang tua / wali
									</span>
								)}
							</span>
							{idx > 0 && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => onChange(contacts.filter((_, i) => i !== idx))}
									className="h-9 px-2.5 text-xs gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
									aria-label={`Hapus kontak darurat ${idx + 1}`}
								>
									<Trash2 className="w-4 h-4" />
									Hapus
								</Button>
							)}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2 min-w-0">
								<Label className="flex items-center flex-wrap gap-1">
									<span>Nama Kontak Darurat</span>
									{star && <span className="text-red-500">*</span>}
									{idx === 0 && extras?.label?.(idx)}
								</Label>
								<Input
									placeholder="Nama lengkap kontak darurat"
									value={c.name}
									onChange={(e) => update(idx, { name: e.target.value })}
									className={extras?.className?.(idx) ?? "bg-white"}
								/>
								{idx === 0 && extras?.alert?.(idx)}
							</div>

							<div className="space-y-2 min-w-0">
								<Label>
									Nomor WhatsApp Darurat
									{star && <span className="text-red-500"> *</span>}
								</Label>
								<Input
									type="tel"
									placeholder="0812xxxx"
									value={c.phone}
									onKeyDown={preventNonPhoneKey}
									onChange={(e) =>
										update(idx, { phone: filterPhone(e.target.value, 15) })
									}
									className="bg-white"
								/>
							</div>

							<div className="space-y-2 min-w-0">
								<Label>
									Hubungan dengan Mahasiswa
									{star && <span className="text-red-500"> *</span>}
								</Label>
								<Select
									value={c.relation}
									onValueChange={(v) =>
										update(idx, { relation: v || "", note: "" })
									}
								>
									<SelectTrigger className="bg-white">
										<SelectValue placeholder="Pilih Hubungan" />
									</SelectTrigger>
									<SelectContent>
										{c.relation &&
											!relationOptions.some((o) => o.value === c.relation) && (
												<SelectItem value={c.relation}>{c.relation}</SelectItem>
											)}
										{relationOptions.map((o) => (
											<SelectItem key={o.value} value={o.value}>
												{o.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{c.relation === "Lainnya" && (
							<div className="space-y-2">
								<Label>
									Keterangan Hubungan <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Contoh: Tetangga dekat, ketua RT, dsb."
									value={c.note}
									onChange={(e) => update(idx, { note: e.target.value })}
									className="bg-white"
								/>
							</div>
						)}
					</div>
				);
			})}

			{contacts.length < MAX_EMERGENCY_CONTACTS ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => onChange([...contacts, emptyEmergencyContact()])}
					className="border-dashed border-blue-300 text-[#0517B0] hover:bg-blue-50 font-semibold gap-1.5 cursor-pointer"
				>
					<Plus className="w-4 h-4" />
					Tambah Kontak Darurat ({contacts.length}/{MAX_EMERGENCY_CONTACTS})
				</Button>
			) : (
				<p className="text-xs text-slate-500">
					Maksimal {MAX_EMERGENCY_CONTACTS} kontak darurat.
				</p>
			)}
		</div>
	);
}
