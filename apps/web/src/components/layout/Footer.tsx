export function Footer() {
	const now = new Date();
	const dateStr = now.toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});

	return (
		<footer className="border-t border-[#1E293B] bg-[#0F172A] px-6 py-3 shrink-0">
			<div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-slate-500">
				<span>© 2026 Nusadaya Academy · Sistem Internal · v1.0.0</span>
				<span>Last update: {dateStr}</span>
			</div>
		</footer>
	);
}
