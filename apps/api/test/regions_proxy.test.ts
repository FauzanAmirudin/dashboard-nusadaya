import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("Regions API Proxy Test", () => {
	it("GET /regions/districts/:regencyId mengambil data kecamatan tanpa CORS issue", async () => {
		const res = await app.handle(
			new Request("http://localhost/regions/districts/1871"),
		);
		expect(res.status).toBe(200);

		const data = (await res.json()) as Array<{ id: string; name: string }>;
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBeGreaterThan(0);
		expect(data.some((d) => d.name.toUpperCase().includes("TELUK"))).toBe(true);
	});

	it("GET /regions/villages/:districtId mengambil data kelurahan/desa", async () => {
		const res = await app.handle(
			new Request("http://localhost/regions/villages/1871010"),
		);
		expect(res.status).toBe(200);

		const data = (await res.json()) as Array<{ id: string; name: string }>;
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBeGreaterThan(0);
	});
});
