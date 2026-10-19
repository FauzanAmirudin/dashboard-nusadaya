import { Suspense } from "react";
import { KehadiranDashboard } from "@/components/panels/kehadiran/KehadiranDashboard";

export default function KehadiranPage() {
	return (
		<Suspense
			fallback={
				<div className="p-8 text-center text-slate-500">
					Memuat data kehadiran...
				</div>
			}
		>
			<KehadiranDashboard />
		</Suspense>
	);
}
