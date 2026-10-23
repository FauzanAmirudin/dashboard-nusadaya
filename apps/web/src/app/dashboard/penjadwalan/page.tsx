import { Suspense } from "react";
import { PenjadwalanDashboard } from "@/components/panels/penjadwalan/PenjadwalanDashboard";

export default function PenjadwalanPage() {
	return (
		<Suspense
			fallback={
				<div className="p-8 text-center text-slate-500">
					Memuat penjadwalan...
				</div>
			}
		>
			<PenjadwalanDashboard />
		</Suspense>
	);
}
