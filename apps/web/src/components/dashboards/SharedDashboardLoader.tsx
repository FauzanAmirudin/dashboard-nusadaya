"use client";

import { RefreshCw, ShieldAlert } from "lucide-react";
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
import { useStudentsList } from "@/hooks/useStudentsList";
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
	const [searchQuery, setSearchQuery] = useState("");
	const router = useRouter();

	const allowedRoles = MODULE_ROLES[module] || ["superadmin"];
	const isAllowed = hasRole(user, ...allowedRoles);

	// Fetch slim student list with TanStack query caching (all: true for panel aggregated metrics)
	const {
		data: studentsResult,
		isLoading,
		isError,
		refetch,
	} = useStudentsList({
		all: true,
	});

	const data = (studentsResult?.data || []) as any[];

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, hasHydrated, router]);

	if (!hasHydrated || isLoading)
		return (
			<div className="flex flex-col justify-center items-center h-80 gap-3 text-slate-500">
				<RefreshCw className="w-8 h-8 animate-spin text-[#0517B0]" />
				<p className="text-sm font-semibold">
					Memuat data Panel {module.toUpperCase()}...
				</p>
			</div>
		);

	if (isError) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto my-12">
				<div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
					<ShieldAlert className="w-6 h-6" />
				</div>
				<h3 className="text-base font-bold text-slate-800 mb-1">
					Gagal Memuat Data
				</h3>
				<p className="text-xs text-slate-500 mb-4">
					Tidak dapat terhubung ke server backend atau sesi kedaluwarsa.
				</p>
				<Button
					onClick={() => refetch()}
					className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs h-9 px-4 gap-1.5"
				>
					<RefreshCw className="w-3.5 h-3.5" />
					Coba Lagi
				</Button>
			</div>
		);
	}

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
	if (module === "pa") return <PaDashboard user={user} data={data} />;
	if (module === "magang") return <MagangDashboard data={data} />;
	if (module === "finance") return <FinanceDashboard user={user} data={data} />;
	if (module === "evaluator")
		return (
			<EvaluasiFinalisasiDashboard
				data={data}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				user={user}
				onUpdate={() => {
					refetch();
				}}
			/>
		);

	return (
		<div className="p-10 text-center text-slate-500 text-sm">
			Modul belum tersedia.
		</div>
	);
}
