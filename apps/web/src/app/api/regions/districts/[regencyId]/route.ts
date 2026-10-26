import { NextResponse } from "next/server";

const districtCache = new Map<string, Array<{ id: string; name: string }>>();

export async function GET(
	_request: Request,
	context: { params: Promise<{ regencyId: string }> },
) {
	try {
		const { regencyId } = await context.params;
		if (!regencyId) {
			return NextResponse.json([], { status: 400 });
		}

		if (districtCache.has(regencyId)) {
			return NextResponse.json(districtCache.get(regencyId));
		}

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
			return NextResponse.json([], { status: res.status });
		}

		const data = (await res.json()) as Array<{ id: string; name: string }>;
		districtCache.set(regencyId, data);
		return NextResponse.json(data);
	} catch (err: any) {
		console.error(
			"[Next.js Proxy] Error fetching districts:",
			err?.message || err,
		);
		return NextResponse.json([], { status: 500 });
	}
}
