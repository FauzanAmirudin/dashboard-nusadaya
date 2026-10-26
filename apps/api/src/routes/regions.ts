import { Elysia, t } from "elysia";

// Cache in-memory untuk mempercepat respon dan mencegah rate-limiting dari GitHub Pages
const districtCache = new Map<string, Array<{ id: string; name: string }>>();
const villageCache = new Map<string, Array<{ id: string; name: string }>>();

export const regionsRoutes = new Elysia({ prefix: "/regions" })
	.get(
		"/districts/:regencyId",
		async ({
			params: { regencyId },
			set,
		}): Promise<Array<{ id: string; name: string }>> => {
			if (!regencyId) {
				set.status = 400;
				return [];
			}

			const cached = districtCache.get(regencyId);
			if (cached) {
				return cached;
			}

			try {
				const res = await fetch(
					`https://emsifa.github.io/api-wilayah-indonesia/api/districts/${regencyId}.json`,
					{
						headers: {
							"User-Agent": "Nusadaya-Dashboard/1.0",
							Accept: "application/json",
						},
						signal: AbortSignal.timeout(8000),
					},
				);

				if (!res.ok) {
					set.status = res.status;
					return [];
				}

				const data = (await res.json()) as Array<{ id: string; name: string }>;
				districtCache.set(regencyId, data);
				return data;
			} catch (err: any) {
				console.error(
					`[Regions API] Error fetching districts for regency ${regencyId}:`,
					err?.message || err,
				);
				set.status = 500;
				return [];
			}
		},
		{
			params: t.Object({
				regencyId: t.String(),
			}),
		},
	)
	.get(
		"/villages/:districtId",
		async ({
			params: { districtId },
			set,
		}): Promise<Array<{ id: string; name: string }>> => {
			if (!districtId) {
				set.status = 400;
				return [];
			}

			const cached = villageCache.get(districtId);
			if (cached) {
				return cached;
			}

			try {
				const res = await fetch(
					`https://emsifa.github.io/api-wilayah-indonesia/api/villages/${districtId}.json`,
					{
						headers: {
							"User-Agent": "Nusadaya-Dashboard/1.0",
							Accept: "application/json",
						},
						signal: AbortSignal.timeout(8000),
					},
				);

				if (!res.ok) {
					set.status = res.status;
					return [];
				}

				const data = (await res.json()) as Array<{ id: string; name: string }>;
				villageCache.set(districtId, data);
				return data;
			} catch (err: any) {
				console.error(
					`[Regions API] Error fetching villages for district ${districtId}:`,
					err?.message || err,
				);
				set.status = 500;
				return [];
			}
		},
		{
			params: t.Object({
				districtId: t.String(),
			}),
		},
	);
