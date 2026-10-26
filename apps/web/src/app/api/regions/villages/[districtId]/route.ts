import { NextResponse } from "next/server";

const villageCache = new Map<string, Array<{ id: string; name: string }>>();

export async function GET(
	_request: Request,
	context: { params: Promise<{ districtId: string }> },
) {
	try {
		const { districtId } = await context.params;
		if (!districtId) {
			return NextResponse.json([], { status: 400 });
		}

		if (villageCache.has(districtId)) {
			return NextResponse.json(villageCache.get(districtId));
		}

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
			return NextResponse.json([], { status: res.status });
		}

		const data = (await res.json()) as Array<{ id: string; name: string }>;
		villageCache.set(districtId, data);
		return NextResponse.json(data);
	} catch (err: any) {
		console.error(
			"[Next.js Proxy] Error fetching villages:",
			err?.message || err,
		);
		return NextResponse.json([], { status: 500 });
	}
}
