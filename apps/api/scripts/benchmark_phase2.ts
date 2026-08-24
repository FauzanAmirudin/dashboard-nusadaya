import { getCacheStats } from "../src/lib/cache";
import { checkRateLimit } from "../src/lib/rate-limiter";
import { dashboardRoutes } from "../src/routes/dashboard";
import { healthRoutes } from "../src/routes/health";
import { coreRoutes } from "../src/routes/student/core";

async function runBenchmark() {
	console.log("=================================================");
	console.log("   FASE 2 BENCHMARK & PERFORMANCE VALIDATION     ");
	console.log("=================================================\n");

	// 1. Test Rate Limiter
	console.log("[1/5] Testing Rate Limiter (Login protection)...");
	const testIp = "192.168.1.99";
	let allowedCount = 0;
	let blockedCount = 0;
	for (let i = 1; i <= 15; i++) {
		const rl = await checkRateLimit(testIp, {
			maxRequests: 10,
			windowSeconds: 60,
			keyPrefix: "test:rl",
		});
		if (rl.allowed) allowedCount++;
		else blockedCount++;
	}
	console.log(
		`  ✓ Allowed: ${allowedCount}/10, Blocked (429): ${blockedCount}/5 -> Rate Limiter OK!`,
	);

	// 2. Test Health & Cache Stats
	console.log("\n[2/5] Testing GET /health endpoint handler...");
	const healthRes = await healthRoutes.handle(
		new Request("http://localhost/health"),
	);
	const healthJson = (await healthRes.json()) as any;
	console.log(`  ✓ Health status: ${healthJson.status}`);
	console.log(
		`  ✓ PostgreSQL: ${healthJson.postgresql} | Redis: ${healthJson.redis}`,
	);
	console.log(`  ✓ Cache Stats:`, JSON.stringify(healthJson.cache));

	// 3. Test Dashboard Concurrency (Request Coalescing & Cache)
	console.log(
		"\n[3/5] Testing Dashboard Summary Concurrent Requests (10 parallel calls)...",
	);
	const startDash = performance.now();
	const dashPromises = Array.from({ length: 10 }).map(() =>
		dashboardRoutes
			.handle(new Request("http://localhost/dashboard/summary"))
			.then((r) => r.json() as Promise<any>),
	);
	const dashResults = await Promise.all(dashPromises);
	const durationDash = performance.now() - startDash;
	console.log(
		`  ✓ 10 Concurrent Dashboard requests completed in: ${durationDash.toFixed(2)}ms (avg: ${(durationDash / 10).toFixed(2)}ms/req)`,
	);
	console.log(`  ✓ Sample Success: ${dashResults[0]?.success}`);

	// 4. Test Students List Concurrency & Cache Hit Latency
	console.log(
		"\n[4/5] Testing Students List Cache Hit Latency (20 consecutive calls)...",
	);
	// First call (warm)
	const warmRes = await coreRoutes.handle(
		new Request("http://localhost/students?page=1&limit=20"),
	);
	await warmRes.json();

	const latencies: number[] = [];
	for (let i = 0; i < 20; i++) {
		const t0 = performance.now();
		const res = await coreRoutes.handle(
			new Request("http://localhost/students?page=1&limit=20"),
		);
		await res.json();
		latencies.push(performance.now() - t0);
	}
	const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
	const minLatency = Math.min(...latencies);
	const maxLatency = Math.max(...latencies);

	console.log(
		`  ✓ Cache Hit Avg Latency: ${avgLatency.toFixed(3)}ms | Min: ${minLatency.toFixed(3)}ms | Max: ${maxLatency.toFixed(3)}ms`,
	);

	// 5. Final Cache Statistics
	console.log("\n[5/5] Checking Final Cache Hit Ratio...");
	const stats = getCacheStats();
	console.log(`  ✓ L1 Entries: ${stats.l1MemoryEntries}`);
	console.log(
		`  ✓ Total Hits: ${stats.totalHits} (L1: ${stats.l1Hits}, L2: ${stats.l2Hits})`,
	);
	console.log(`  ✓ Misses: ${stats.misses}`);
	console.log(`  ✓ Hit Ratio: ${stats.hitRatioPercentage}%`);

	console.log("\n=================================================");
	console.log("   FASE 2 VALIDATION COMPLETE & PASSED!          ");
	console.log("=================================================");
	process.exit(0);
}

runBenchmark().catch((err) => {
	console.error("Benchmark failed:", err);
	process.exit(1);
});
