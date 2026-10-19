"use client";

import { KehadiranPiketDashboard } from "@/components/panels/akademik/piket/KehadiranPiketDashboard";

export function TabKehadiranPiket() {
	return (
		<div className="w-full">
			<KehadiranPiketDashboard hidePageHeader={true} />
		</div>
	);
}
