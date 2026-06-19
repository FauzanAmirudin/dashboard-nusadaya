"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FinalisasiDashboard } from "@/components/dashboards/FinalisasiDashboard";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function FinalisasiPage() {
	const router = useRouter();
	const { user, isAuthenticated, hasHydrated } = useAuthStore();
	const [data, setData] = useState<any[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	const fetchData = async () => {
		const { data: resData, error } = await api.students.finalization.get();
		if (!error && resData?.data) {
			setData(resData.data);
		}
		setIsLoading(false);
	};

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated || user?.role !== "superadmin") {
			router.push("/dashboard");
			return;
		}

		fetchData();
	}, [isAuthenticated, hasHydrated, router, user]);

	if (isLoading) {
		return (
			<div className="p-10 text-center text-slate-500 text-sm">
				Memuat data kandidat...
			</div>
		);
	}

	return (
		<FinalisasiDashboard
			data={data}
			searchQuery={searchQuery}
			setSearchQuery={setSearchQuery}
			user={user}
			onUpdate={fetchData}
		/>
	);
}
