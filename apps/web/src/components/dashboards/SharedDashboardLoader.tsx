"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AkademikDashboard } from "@/components/dashboards/AkademikDashboard";
import { CrmDashboard } from "@/components/dashboards/CrmDashboard";
import { EvaluasiFinalisasiDashboard } from "@/components/dashboards/EvaluasiFinalisasiDashboard";
import { FinanceDashboard } from "@/components/dashboards/FinanceDashboard";
import { MagangDashboard } from "@/components/dashboards/MagangDashboard";
import { PaDashboard } from "@/components/dashboards/PaDashboard";
import { PmbDashboard } from "@/components/dashboards/PmbDashboard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/eden";
import { hasRole, useAuthStore } from "@/store";

const MODULE_ROLES: Record<string, string[]> = {
	pmb: ["superadmin", "pmb"],
	crm: ["superadmin", "crm"],
	akademik: ["superadmin", "akademik"],
	pa: ["superadmin", "pa"],
	magang: ["superadmin", "magang"],
	finance: ["superadmin", "finance"],
	evaluator: ["superadmin", "evaluator"],
};

export function SharedDashboardLoader({
	module,
}: {
	module:
		| "pmb"
		| "crm"
		| "akademik"
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

	const allowedRoles = MODULE_ROLES[module] || ["superadmin"];
	const isAllowed = hasRole(user, ...allowedRoles);

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) return router.push("/login");

		if (!isAllowed) {
			setIsLoading(false);
			return;
		}

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
	}, [isAuthenticated, hasHydrated, isAllowed, router]);

	if (isLoading)
		return (
			<div className="p-10 text-center text-slate-500 text-sm">
				Memuat data...
			</div>
		);

	if (!isAllowed) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto my-12">
				<div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
					<ShieldAlert className="w-7 h-7" />
				</div>
				<h2 className="text-xl font-bold text-slate-900 mb-1.5">
					Akses Ditolak
				</h2>
				<p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-xs">
					Akun Anda tidak memiliki izin untuk mengakses{" "}
					<strong>Panel {module.toUpperCase()}</strong>.
				</p>
				<Link href="/dashboard">
					<Button className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs sm:text-sm h-10 px-5">
						Kembali ke Dashboard
					</Button>
				</Link>
			</div>
		);
	}

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
	if (module === "pa") return <PaDashboard user={user} />;
	if (module === "magang") return <MagangDashboard />;
	if (module === "finance") return <FinanceDashboard user={user} />;
	if (module === "evaluator")
		return (
			<EvaluasiFinalisasiDashboard
				data={data}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				user={user}
				onUpdate={() => {
					api.students.get().then((res) => {
						if (res.data?.data) setData(res.data.data);
					});
				}}
			/>
		);

	return (
		<div className="p-10 text-center text-slate-500 text-sm">
			Modul belum tersedia.
		</div>
	);
}
