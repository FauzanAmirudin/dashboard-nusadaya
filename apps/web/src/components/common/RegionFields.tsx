"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getCities,
	getDistricts,
	getProvinces,
	getVillages,
} from "@/lib/regions";

export interface RegionValue {
	province: string;
	city: string;
	district: string;
	village: string;
}

type RegionKey = keyof RegionValue;

interface RegionFieldsProps {
	value: RegionValue;
	onChange: (patch: Partial<RegionValue>) => void;
	/** Slot opsional per field (mis. badge penolakan revisi PMB). */
	extras?: Partial<
		Record<
			RegionKey,
			{ label?: ReactNode; alert?: ReactNode; className?: string }
		>
	>;
}

/**
 * Dropdown bertingkat Provinsi → Kab/Kota → Kecamatan → Kelurahan/Desa.
 * Merender 4 sel grid (fragment) agar bisa disisipkan ke grid form yang ada.
 * Sumber data sama dengan form tambah/edit mahasiswa (`@/lib/regions`).
 */
export function RegionFields({ value, onChange, extras }: RegionFieldsProps) {
	const [districts, setDistricts] = useState<string[]>([]);
	const [villages, setVillages] = useState<string[]>([]);
	const [loadingDistricts, setLoadingDistricts] = useState(false);
	const [loadingVillages, setLoadingVillages] = useState(false);

	useEffect(() => {
		let alive = true;
		if (value.province && value.city) {
			setLoadingDistricts(true);
			getDistricts(value.province, value.city).then((list) => {
				if (alive) {
					setDistricts(list);
					setLoadingDistricts(false);
				}
			});
		} else {
			setDistricts([]);
		}
		return () => {
			alive = false;
		};
	}, [value.province, value.city]);

	useEffect(() => {
		let alive = true;
		if (value.province && value.city && value.district) {
			setLoadingVillages(true);
			getVillages(value.province, value.city, value.district).then((list) => {
				if (alive) {
					setVillages(list);
					setLoadingVillages(false);
				}
			});
		} else {
			setVillages([]);
		}
		return () => {
			alive = false;
		};
	}, [value.province, value.city, value.district]);

	const cities = getCities(value.province);

	// Pertahankan nilai tersimpan yang tidak ada di daftar (data lama / ketikan bebas).
	const withCurrent = (options: string[], current: string) =>
		current && !options.includes(current) ? [current, ...options] : options;

	const field = (
		key: RegionKey,
		label: string,
		select: ReactNode,
	): ReactNode => (
		<div className="space-y-2">
			<Label className="flex items-center flex-wrap gap-1">
				<span>{label}</span> <span className="text-red-500">*</span>
				{extras?.[key]?.label}
			</Label>
			{select}
			{extras?.[key]?.alert}
		</div>
	);

	return (
		<>
			{field(
				"province",
				"Provinsi",
				<Select
					value={value.province}
					onValueChange={(v) =>
						onChange({
							province: v || "",
							city: "",
							district: "",
							village: "",
						})
					}
				>
					<SelectTrigger className={extras?.province?.className}>
						<SelectValue placeholder="Pilih Provinsi" />
					</SelectTrigger>
					<SelectContent>
						{withCurrent(getProvinces(), value.province).map((p) => (
							<SelectItem key={p} value={p}>
								{p}
							</SelectItem>
						))}
					</SelectContent>
				</Select>,
			)}
			{field(
				"city",
				"Kabupaten / Kota",
				<Select
					disabled={!value.province}
					value={value.city}
					onValueChange={(v) =>
						onChange({ city: v || "", district: "", village: "" })
					}
				>
					<SelectTrigger className={extras?.city?.className}>
						<SelectValue
							placeholder={
								value.province
									? "Pilih Kabupaten / Kota"
									: "Pilih provinsi dahulu"
							}
						/>
					</SelectTrigger>
					<SelectContent>
						{withCurrent(cities, value.city).map((c) => (
							<SelectItem key={c} value={c}>
								{c}
							</SelectItem>
						))}
					</SelectContent>
				</Select>,
			)}
			{field(
				"district",
				"Kecamatan",
				<Select
					disabled={!value.city || loadingDistricts}
					value={value.district}
					onValueChange={(v) => onChange({ district: v || "", village: "" })}
				>
					<SelectTrigger className={extras?.district?.className}>
						<SelectValue
							placeholder={
								!value.city
									? "Pilih kab/kota dahulu"
									: loadingDistricts
										? "Memuat kecamatan..."
										: "Pilih Kecamatan"
							}
						/>
					</SelectTrigger>
					<SelectContent>
						{withCurrent(districts, value.district).map((d) => (
							<SelectItem key={d} value={d}>
								{d}
							</SelectItem>
						))}
					</SelectContent>
				</Select>,
			)}
			{field(
				"village",
				"Kelurahan / Desa",
				<Select
					disabled={!value.district || loadingVillages}
					value={value.village}
					onValueChange={(v) => onChange({ village: v || "" })}
				>
					<SelectTrigger className={extras?.village?.className}>
						<SelectValue
							placeholder={
								!value.district
									? "Pilih kecamatan dahulu"
									: loadingVillages
										? "Memuat kelurahan..."
										: "Pilih Kelurahan / Desa"
							}
						/>
					</SelectTrigger>
					<SelectContent>
						{withCurrent(villages, value.village).map((v) => (
							<SelectItem key={v} value={v}>
								{v}
							</SelectItem>
						))}
					</SelectContent>
				</Select>,
			)}
		</>
	);
}
