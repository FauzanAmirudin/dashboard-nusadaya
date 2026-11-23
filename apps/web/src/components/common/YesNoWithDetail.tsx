"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { HealthQuestion, YesNoToggle } from "./HealthQuestion";

/** Teks yang disimpan bila jawabannya "Tidak ada". */
export const NONE_TEXT = "Tidak ada";

/** Nilai lama seperti "-", "tidak ada", "nihil" dianggap "Tidak ada". */
export const isNoneText = (v: string) =>
	/^(-+|tidak\s*ada|tdk\s*ada|nihil|none|tidak)$/i.test(v.trim());

interface YesNoWithDetailProps {
	/** Teks tersimpan: kosong (belum dijawab), "Tidak ada", atau penjelasan. */
	value: string;
	onChange: (next: string) => void;
	placeholder?: string;
	/** Class untuk kolom penjelasan (mis. border penolakan revisi). */
	detailClassName?: string;
	/** Bila diisi, tampil sebagai baris pertanyaan (label kiri, pilihan kanan). */
	rowLabel?: ReactNode;
}

/**
 * Pilihan Ada / Tidak ada. Bila "Ada", muncul kolom penjelasan.
 * Disimpan sebagai satu string agar kolom database yang ada tidak berubah:
 * "Tidak ada" atau isi penjelasan; kosong berarti belum dijawab / penjelasan kosong.
 */
export function YesNoWithDetail({
	value,
	onChange,
	placeholder = "Jelaskan (jenis, sejak kapan, kondisi saat ini)",
	detailClassName,
	rowLabel,
}: YesNoWithDetailProps) {
	// Pilihan yang ditekan pengguna. Selama belum menekan apa pun, pilihan
	// disimpulkan dari data yang ada (prefill / data lama) — bukan ditafsir ulang
	// setiap ketikan, supaya teks seperti "tidak pernah dirawat" tidak terhapus.
	const [choice, setChoice] = useState<"" | "ada" | "tidak">("");
	const mode: "" | "ada" | "tidak" =
		choice || (value.trim() ? (isNoneText(value) ? "tidak" : "ada") : "");

	const onToggle = (next: "ada" | "tidak") => {
		setChoice(next);
		if (next === "tidak") onChange(NONE_TEXT);
		else if (isNoneText(value)) onChange("");
	};

	const detail = (
		<Textarea
			placeholder={placeholder}
			value={mode === "tidak" ? "" : value}
			onChange={(e) => onChange(e.target.value)}
			rows={3}
			className={detailClassName ?? "bg-white"}
		/>
	);

	if (rowLabel) {
		return (
			<HealthQuestion label={rowLabel} value={mode} onChange={onToggle}>
				{detail}
			</HealthQuestion>
		);
	}

	return (
		<div className="space-y-2">
			<YesNoToggle
				value={mode}
				onChange={onToggle}
				ariaLabel="Ada atau tidak ada"
			/>
			{mode === "ada" && detail}
		</div>
	);
}
