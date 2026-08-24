"use client";

import { RefreshCw, ShieldAlert } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StudentsTableSkeleton } from "@/components/ui/StudentsTableSkeleton";
import { useStudentsList } from "@/hooks/useStudentsList";
import { hasRole, useAuthStore } from "@/store";

const AkademikDashboard = dynamic(
	() =>
		import("@/components/dashboards/AkademikDashboard").then(
			(mod) => mod.AkademikDashboard,
		),
	{ loading: () => <StudentsTableSkeleton rows={8} /> },
);
const CrmDashboard = dynamic(
	() =>
		import("@/components/dashboards/CrmDashboard").then(
			(mod) => mod.CrmDashboard,
		),
	{ loading: () => <StudentsTableSkeleton rows={8} /> },
);
const EvaluasiFinalisasiDashboard = dynamic(
	() =>
		import("@/components/dashboards/EvaluasiFinalisasiDashboard").then(
			(mod) => mod.EvaluasiFinalisasiDashboard,
		),
	{ loading: () => <StudentsTableSkeleton rows={8} /> },
);
const FinanceDashboard = dynamic(
	() =>
		import("@/components/dashboards/FinanceDashboard").then(
			(mod) => mod.FinanceDashboard,
		),
	{ loading: () => <StudentsTableSkeleton rows={8} /> },
);
const MagangDashboard = dynamic(
	() =>
		import("@/components/dashboards/MagangDashboard").then(
			(mod) => mod.MagangDashboard,
		),
	{ loading: () => <StudentsTableSkeleton rows={8} /> },
);
const PaDashboard = dynamic(
	() =>
		import("@/components/dashboards/PaDashboard").then(
			(mod) => mod.PaDashboard,
		),
	{ loading: () => <StudentsTableSkeleton rows={8} /> },
);
const PmbDashboard = dynamic(
	() =>
		import("@/components/dashboards/PmbDashboard").then(
			(mod) => mod.PmbDashboard,
		),
	{ loading: () => <StudentsTableSkeleton rows={8} /> },
);

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
			<div className="space-y-6">
				<div className="space-y-1">
					<div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
					<div className="h-4 w-96 bg-slate-100 rounded animate-pulse" />
				</div>
				<StudentsTableSkeleton rows={8} />
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
