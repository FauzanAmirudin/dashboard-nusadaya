import { db } from "../src/db";
import {
	checkLoginLockout,
	recordFailedLogin,
	resetLoginAttempts,
} from "../src/lib/auth-rate-limit";
import { isRedisReady, redis } from "../src/lib/redis";
import {
	createSession,
	invalidateSession,
	SESSION_CONFIG,
	validateAndTouchSession,
} from "../src/lib/session";

async function runAuthTimeoutTests() {
	console.log("=================================================");
	console.log("🧪 MENJALANKAN TEST SUITE: RATE LIMIT & IDLE SESSION");
	console.log("=================================================\n");

	const testIp = "192.168.99.10";
	const testUsername = "tester_timeout_user";

	// Cleanup test keys before starting
	await resetLoginAttempts(testIp, testUsername);

	// -----------------------------------------------------------------
	// TEST 1: Rate Limiter & Brute Force Lockout (7 Percobaan, 7 Menit)
	// -----------------------------------------------------------------
	console.log("▶ [TEST 1] Menguji Brute Force Lockout (7x percobaan gagal)...");

	// 1.1 First check should not be locked
	const initialLockout = await checkLoginLockout(testIp, testUsername);
	if (initialLockout.isLocked) {
		throw new Error("❌ GAGAL: Akun baru seharusnya belum locked.");
	}
	console.log("  ✓ Status awal: Tidak terkunci, sisa percobaan 7.");

	// 1.2 Record 6 failed attempts
	for (let i = 1; i <= 6; i++) {
		const res = await recordFailedLogin(testIp, testUsername);
		if (res.isLocked) {
			throw new Error(`❌ GAGAL: Percobaan ke-${i} seharusnya belum locked.`);
		}
		if (res.remainingAttempts !== 7 - i) {
			throw new Error(
				`❌ GAGAL: Sisa percobaan tidak cocok (dapat ${res.remainingAttempts}, harap ${7 - i}).`,
			);
		}
	}
	console.log(
		"  ✓ Berhasil mencatat 6 kali percobaan gagal berturut-turut. Sisa percobaan: 1.",
	);

	// 1.3 Record 7th failed attempt -> MUST LOCK
	const seventhAttempt = await recordFailedLogin(testIp, testUsername);
	if (!seventhAttempt.isLocked) {
		throw new Error("❌ GAGAL: Percobaan ke-7 seharusnya memicu LOCKOUT.");
	}
	if (
		seventhAttempt.resetInSeconds <= 0 ||
		seventhAttempt.resetInSeconds > 420
	) {
		throw new Error(
			`❌ GAGAL: Durasi lockout tidak valid (${seventhAttempt.resetInSeconds}s, harap ~420s).`,
		);
	}
	console.log(
		`  ✓ Percobaan ke-7 berhasil memicu LOCKOUT 7 menit (Reset dalam ${seventhAttempt.resetInSeconds} detik).`,
	);

	// 1.4 Check lockout query before DB
	const lockCheck = await checkLoginLockout(testIp, testUsername);
	if (!lockCheck.isLocked) {
		throw new Error(
			"❌ GAGAL: checkLoginLockout harus mendeteksi status locked.",
		);
	}
	console.log("  ✓ Pengecekan lockout pra-DB berhasil memblokir request.");

	// 1.5 Reset login counter
	await resetLoginAttempts(testIp, testUsername);
	const postReset = await checkLoginLockout(testIp, testUsername);
	if (postReset.isLocked) {
		throw new Error(
			"❌ GAGAL: resetLoginAttempts harus membersihkan status lockout.",
		);
	}
	console.log("  ✓ Reset counter berhasil saat login sukses.\n");

	// -----------------------------------------------------------------
	// TEST 2: Server-side Session Tracking & Idle Timeout (Redis)
	// -----------------------------------------------------------------
	console.log("▶ [TEST 2] Menguji Server-side Session & Idle Timeout...");

	// Look up an existing user for testing foreign key audit log
	const existingUser = await db.query.users.findFirst();
	const mockUser = {
		id: existingUser ? existingUser.id : 1,
		username: existingUser ? existingUser.username : testUsername,
		role: existingUser ? existingUser.role : "admin",
		roles:
			existingUser?.roles && existingUser.roles.length > 0
				? existingUser.roles
				: ["admin"],
	};

	// Wait for Redis connection if connecting
	if (!isRedisReady()) {
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	// 2.1 Create session
	const sessionId = await createSession(mockUser, {
		ip: testIp,
		userAgent: "TestRunner/1.0",
	});
	if (!sessionId) {
		throw new Error("❌ GAGAL: Gagal membuat sessionId.");
	}
	console.log(`  ✓ Berhasil membuat sesi baru di Redis: ${sessionId}`);

	// 2.2 Validate active session
	const activeValidation = await validateAndTouchSession(sessionId);
	if (!activeValidation.valid || !activeValidation.session) {
		throw new Error("❌ GAGAL: Sesi aktif baru seharusnya valid.");
	}
	if (activeValidation.session.userId !== mockUser.id) {
		throw new Error("❌ GAGAL: Data user di sesi tidak sesuai.");
	}
	console.log(
		`  ✓ Validasi sesi aktif sukses. Sisa waktu idle: ${activeValidation.remainingSeconds} detik (~30 menit).`,
	);

	// 2.3 Simulate idle timeout (tamper lastActivity to > 30 mins ago)
	if (isRedisReady()) {
		const sessionKey = `session:${sessionId}`;
		const raw = await redis.get(sessionKey);
		if (raw) {
			const parsed = JSON.parse(raw);
			// Set last activity to 35 minutes ago
			parsed.lastActivity = Date.now() - 35 * 60 * 1000;
			await redis.set(sessionKey, JSON.stringify(parsed), "EX", 3600);
		}
	}

	const idleValidation = await validateAndTouchSession(sessionId);
	if (idleValidation.valid) {
		throw new Error("❌ GAGAL: Sesi yang idle > 30 menit seharusnya ditolak!");
	}
	if (idleValidation.reason !== "idle_timeout") {
		throw new Error(
			`❌ GAGAL: Alasan pembatalan harus idle_timeout (didapat: ${idleValidation.reason}).`,
		);
	}
	console.log(
		"  ✓ Sesi idle > 30 menit berhasil ditolak otomatis dengan status 'idle_timeout'.",
	);

	// 2.4 Test manual invalidation (logout)
	const session2Id = await createSession(mockUser);
	await invalidateSession(session2Id, mockUser.id, "user_logout");
	const logoutValidation = await validateAndTouchSession(session2Id);
	if (logoutValidation.valid) {
		throw new Error(
			"❌ GAGAL: Sesi yang telah di-invalidate seharusnya tidak valid.",
		);
	}
	console.log(
		"  ✓ Invalidation sesi manual (logout) berhasil menghapus sesi dari Redis.\n",
	);

	console.log("=================================================");
	console.log("🎉 SEMUA TEST BERHASIL DENGAN SEMPURNA! (100% PASS)");
	console.log("=================================================");
	process.exit(0);
}

runAuthTimeoutTests().catch((err) => {
	console.error("\n❌ TEST ERROR:", err);
	process.exit(1);
});
