import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/eden";

export interface StudentListItem {
	student: {
		id: number;
		nim: string | null;
		name: string;
		nickname?: string | null;
		cohort: number;
		program: string;
		subProgram?: string | null;
		phone?: string | null;
		studentStatus?: string | null;
		overallStatus: string | null;
		profilePhotoUrl?: string | null;
		updatedAt: string;
		createdAt: string;
	};
	pmb: { id: number; status: string | null; isAcc?: boolean } | null;
	crm: { id: number; status: string | null; isAcc?: boolean } | null;
	finance: { id: number; status: string | null; isAcc?: boolean } | null;
	academic: { id: number; status: string | null; isAcc?: boolean } | null;
	pa: { id: number; status: string | null; isAcc?: boolean } | null;
	internship: { id: number; status: string | null; isAcc?: boolean } | null;
	decision: {
		id: number;
		evaluatorDecision?: string | null;
		isApprovedByDirector?: boolean | null;
		departureDate?: string | null;
		notes?: string | null;
	} | null;
	courseGrades?: Array<any>;
	financeSemesters?: Array<any>;
	financeInstallments?: Array<any>;
	financeCustomFields?: Array<any>;
	financeTalanganInstallments?: Array<any>;
}

export interface StudentsListResponse {
	data: StudentListItem[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface UseStudentsListParams {
	page?: number;
	limit?: number;
	cohort?: string;
	status?: string;
	search?: string;
	archived?: boolean;
	all?: boolean;
}

export function useStudentsList(params: UseStudentsListParams = {}) {
	const {
		page = 1,
		limit = 50,
		cohort,
		status,
		search,
		archived = false,
		all = false,
	} = params;

	const cleanCohort = cohort && cohort !== "all" ? cohort : undefined;
	const cleanStatus = status && status !== "all" ? status : undefined;
	const cleanSearch = search?.trim() ? search.trim() : undefined;

	return useQuery({
		queryKey: [
			"students-list",
			{
				page,
				limit,
				cohort: cleanCohort,
				status: cleanStatus,
				search: cleanSearch,
				archived,
				all,
			},
		],
		queryFn: async () => {
			const queryObj: Record<string, string> = {
				page: page.toString(),
				limit: limit.toString(),
				archived: archived ? "true" : "false",
			};
			if (cleanCohort) queryObj.cohort = cleanCohort;
			if (cleanStatus) queryObj.status = cleanStatus;
			if (cleanSearch) queryObj.search = cleanSearch;
			if (all) queryObj.all = "true";

			const res = await api.students.get({
				$query: queryObj as any,
			});

			if (res.error) {
				console.error("[useStudentsList] API Error:", res.error);
				throw new Error("Gagal mengambil data mahasiswa");
			}

			// Eden Treaty wraps the response body in res.data.
			// API returns: { success: true, data: [...], meta: {...} }
			// So res.data = { success, data, meta }; res.data.data = the array
			const body = res.data as any;
			const rawData = body?.data;
			const dataList: StudentListItem[] = Array.isArray(rawData) ? rawData : [];
			const meta = body?.meta || {
				page,
				limit,
				total: dataList.length,
				totalPages: Math.ceil(dataList.length / limit) || 1,
			};

			if (process.env.NODE_ENV !== "production") {
				console.log(
					`[useStudentsList] Fetched ${dataList.length} students, total=${meta.total}`,
				);
			}

			return {
				data: dataList,
				meta,
			};
		},
		placeholderData: keepPreviousData,
		staleTime: 30 * 1000, // 30 seconds fresh data window
		gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
		retry: 2,
		retryDelay: 1000,
	});
}

/**
 * Hook for fetching single student detail with TanStack React Query caching.
 */
export function useStudentDetail(id: number | string | null | undefined) {
	const studentId = id ? id.toString() : "";
	return useQuery({
		queryKey: ["student", studentId],
		queryFn: async () => {
			if (!studentId) return null;
			const res = await (api.students as any)[studentId].get();
			if (res.error) {
				throw new Error(
					res.error?.value?.message || "Gagal mengambil data detail mahasiswa",
				);
			}
			return res.data?.data || null;
		},
		enabled: Boolean(studentId),
		staleTime: 60 * 1000, // 1 minute fresh cache
		gcTime: 10 * 60 * 1000, // 10 minutes retention
	});
}

/**
 * Prefetch single student detail for instant page transitions on row hover.
 */
export function prefetchStudentDetail(
	queryClient: import("@tanstack/react-query").QueryClient,
	id: number,
) {
	if (!id || Number.isNaN(id)) return;
	const studentId = id.toString();
	return queryClient.prefetchQuery({
		queryKey: ["student", studentId],
		queryFn: async () => {
			const res = await (api.students as any)[studentId].get();
			return res.data?.data || null;
		},
		staleTime: 60 * 1000,
	});
}
