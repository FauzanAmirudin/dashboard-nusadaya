"use client";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface OptionSelectProps {
	label: string;
	value: string;
	onChange: (next: string) => void;
	options: readonly string[];
	placeholder: string;
	required?: boolean;
	className?: string;
}

/** Label + dropdown pilihan tetap. Nilai lama di luar daftar tetap ditampilkan. */
export function OptionSelect({
	label,
	value,
	onChange,
	options,
	placeholder,
	required,
	className,
}: OptionSelectProps) {
	return (
		<div className="space-y-2 min-w-0">
			<Label>
				{label}
				{required && <span className="text-red-500"> *</span>}
			</Label>
			<Select value={value} onValueChange={(v) => onChange(v || "")}>
				<SelectTrigger className={className}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{value && !options.includes(value) && (
						<SelectItem value={value}>{value}</SelectItem>
					)}
					{options.map((o) => (
						<SelectItem key={o} value={o}>
							{o}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
