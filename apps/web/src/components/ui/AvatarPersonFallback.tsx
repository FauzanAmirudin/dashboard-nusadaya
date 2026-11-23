import { AvatarFallback } from "@/components/ui/avatar";

/**
 * Siluet orang sebagai fallback avatar saat pengguna belum punya foto profil.
 * SVG murni (tanpa dependensi) dan memakai `currentColor`, sehingga warnanya
 * mengikuti kelas teks induk dan tetap tajam di ukuran berapa pun.
 */
export function PersonSilhouette({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 64 64"
			aria-hidden="true"
			focusable="false"
			className={className}
			fill="currentColor"
		>
			<circle cx="32" cy="21" r="11" />
			<path d="M32 36c-9.4 0-17 7.6-17 17v3h34v-3c0-9.4-7.6-17-17-17Z" />
		</svg>
	);
}

/**
 * Pembungkus siap pakai untuk <Avatar>. Dipakai di seluruh aplikasi agar
 * fallback avatar seragam, menggantikan inisial nama.
 */
export function AvatarPersonFallback({
	className,
	iconClassName = "h-3/5 w-3/5",
}: {
	className?: string;
	iconClassName?: string;
}) {
	return (
		<AvatarFallback
			className={`flex items-center justify-center bg-slate-200 text-slate-600 ${className ?? ""}`}
		>
			<PersonSilhouette className={iconClassName} />
		</AvatarFallback>
	);
}
