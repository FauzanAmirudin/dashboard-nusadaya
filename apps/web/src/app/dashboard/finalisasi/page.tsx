"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FinalisasiRedirectPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/dashboard/evaluator?tab=finalisasi");
	}, [router]);

	return (
		<div className="p-10 text-center text-slate-500 text-sm">
			Mengalihkan ke Panel Keputusan Final...
		</div>
	);
}
