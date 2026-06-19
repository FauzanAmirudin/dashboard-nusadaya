"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AkademikDashboard } from "@/components/dashboards/AkademikDashboard";
import { CrmDashboard } from "@/components/dashboards/CrmDashboard";
import { DosenDashboard } from "@/components/dashboards/DosenDashboard";
import { EvaluatorDashboard } from "@/components/dashboards/EvaluatorDashboard";
import { FinanceDashboard } from "@/components/dashboards/FinanceDashboard";
import { MagangDashboard } from "@/components/dashboards/MagangDashboard";
import { PaDashboard } from "@/components/dashboards/PaDashboard";
import { PmbDashboard } from "@/components/dashboards/PmbDashboard";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export function SharedDashboardLoader({
	module,
}: {
	module:
		| "pmb"
		| "crm"
		| "akademik"
		| "dosen"
		| "pa"
		| "magang"
		| "finance"
		| "evaluator";
}) {
	const { user, isAuthenticated, hasHydrated } = useAuthStore();
	const [data, setData] = useState<any[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) return router.push("/login");

		const fetchStudents = async () => {
			const { data: resData, error } = await api.students.get();
			if (!error && resData?.data) {
				setData(resData.data);
			}
			setIsLoading(false);
		};
		fetchStudents();
		const interval = setInterval(fetchStudents, 15000);
		return () => clearInterval(interval);
	}, [isAuthenticated, hasHydrated, router]);

	if (isLoading)
		return (
			<div className="p-10 text-center text-slate-500 text-sm">
				Memuat data...
			</div>
		);

	if (module === "pmb")
		return (
			<PmbDashboard
				data={data}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				user={user}
			/>
		);
	if (module === "crm")
		return (
			<CrmDashboard
				data={data}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				user={user}
			/>
		);
	if (module === "akademik")
		return (
			<AkademikDashboard
				data={data}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				user={user}
			/>
		);
	if (module === "dosen") return <DosenDashboard user={user!} />;
	if (module === "pa")
		return (
			<PaDashboard
				data={data}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				user={user}
			/>
		);
	if (module === "magang") return <MagangDashboard />;
	if (module === "finance")
		return (
			<FinanceDashboard
				data={data}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				user={user}
			/>
		);
	if (module === "evaluator")
		return (
			<EvaluatorDashboard
				data={data}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				user={user}
			/>
		);

	return (
		<div className="p-10 text-center text-slate-500 text-sm">
			Modul belum tersedia.
		</div>
	);
}
