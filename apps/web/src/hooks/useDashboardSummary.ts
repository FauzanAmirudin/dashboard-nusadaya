import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/eden";

export interface DashboardSummaryData {
	totalStudents: number;
	byStatus: {
		AMAN: number;
		PERLU_PERHATIAN: number;
		TIDAK_AMAN: number;
	};
	byStudentStatus: {
		aktif: number;
		cuti: number;
		lulus: number;
		alumni: number;
		dropout: number;
		keluar: number;
		mengundurkanDiri: number;
	};
	panels: {
		pmb: {
			acc: number;
			aman: number;
			perluPerhatian: number;
			tidakAman: number;
		};
		crm: {
			acc: number;
			aman: number;
			perluPerhatian: number;
			tidakAman: number;
		};
		finance: {
			acc: number;
			aman: number;
			perluPerhatian: number;
			tidakAman: number;
		};
		academic: {
			acc: number;
			aman: number;
			perluPerhatian: number;
			tidakAman: number;
		};
		pa: {
			acc: number;
			aman: number;
			perluPerhatian: number;
			tidakAman: number;
		};
		internship: {
			acc: number;
			aman: number;
			perluPerhatian: number;
			tidakAman: number;
		};
	};
	evaluator: {
		layakBerangkat: number;
		disetujuiDirektur: number;
		menunggu: number;
	};
	cohorts: number[];
	updatedAt: string;
}

export function useDashboardSummary(params?: {
	cohort?: string;
	archived?: boolean;
	enabled?: boolean;
}) {
	const cohort =
		params?.cohort && params.cohort !== "all" ? params.cohort : undefined;
	const archived = params?.archived ? "true" : "false";

	return useQuery({
		queryKey: ["dashboard-summary", cohort, archived],
		queryFn: async () => {
			const queryObj: Record<string, string> = {
				archived,
			};
			if (cohort) queryObj.cohort = cohort;

			const res = await (api as any).dashboard.summary.get({
				$query: queryObj,
			});
			if (res.error) throw new Error("Gagal memuat ringkasan dashboard");
			return res.data?.data as DashboardSummaryData;
		},
		enabled: params?.enabled !== undefined ? params.enabled : true,
		staleTime: 30 * 1000,
		refetchInterval: 30 * 1000,
	});
}
