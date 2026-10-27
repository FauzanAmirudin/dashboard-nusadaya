import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_URL, getToken } from "@/lib/eden";

export interface StreamItem {
	category: "pmb" | "spp_taiwan" | "spp_malaysia";
	label: string;
	subLabel: string;
	target: number;
	realisasi: number;
	percentage: number;
	sisa: number;
	surplus: number;
}

export interface CohortBreakdownItem {
	cohort: number;
	pmb: number;
	spp_taiwan: number;
	spp_malaysia: number;
	total: number;
}

export interface FinanceProjectionsData {
	cohort: string;
	year: number;
	availableCohorts: number[];
	streams: StreamItem[];
	total: {
		target: number;
		realisasi: number;
		percentage: number;
		sisa: number;
		surplus: number;
	};
	cohortBreakdown: CohortBreakdownItem[];
}

export interface UseFinanceProjectionsParams {
	cohort?: string;
	year?: number;
	month?: number;
	startDate?: string;
	endDate?: string;
	enabled?: boolean;
}

export function useFinanceProjections(
	params: UseFinanceProjectionsParams = {},
) {
	const {
		cohort = "all",
		year = new Date().getFullYear(),
		month = 0,
		startDate,
		endDate,
		enabled = true,
	} = params;

	return useQuery({
		queryKey: [
			"finance-projections",
			{ cohort, year, month, startDate, endDate },
		],
		queryFn: async (): Promise<FinanceProjectionsData> => {
			const token = getToken();
			const searchParams = new URLSearchParams();
			if (cohort) searchParams.set("cohort", cohort);
			if (year) searchParams.set("year", year.toString());
			if (month) searchParams.set("month", month.toString());
			if (startDate) searchParams.set("startDate", startDate);
			if (endDate) searchParams.set("endDate", endDate);

			const res = await fetch(
				`${API_URL}/finance/projections?${searchParams.toString()}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				},
			);

			if (!res.ok) {
				throw new Error("Gagal memuat data proyeksi target & realisasi");
			}

			const json = await res.json();
			if (!json.success) {
				throw new Error(json.message || "Gagal memuat data proyeksi keuangan");
			}

			return json.data as FinanceProjectionsData;
		},
		enabled,
		staleTime: 15 * 1000,
		refetchInterval: 30 * 1000,
	});
}

export interface UpdateProjectionTargetsPayload {
	cohort: number;
	year: number;
	month?: number;
	targets: Array<{
		category: string;
		targetNominal: number;
		notes?: string;
	}>;
}

export function useUpdateProjectionTargets() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: UpdateProjectionTargetsPayload) => {
			const token = getToken();
			const res = await fetch(`${API_URL}/finance/projections/batch-update`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const errorJson = await res.json().catch(() => null);
				throw new Error(
					errorJson?.message || "Gagal memperbarui target proyeksi keuangan",
				);
			}

			const json = await res.json();
			return json;
		},
		onSuccess: () => {
			toast.success("Pagu target proyeksi pendapatan berhasil diperbarui!");
			queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
			queryClient.invalidateQueries({ queryKey: ["students-list"] });
		},
		onError: (err: any) => {
			toast.error(err.message || "Terjadi kesalahan saat menyimpan target");
		},
	});
}
