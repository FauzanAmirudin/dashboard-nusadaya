import { db } from "../src/db";
import { users } from "../src/db/schema";

const STAFF_ROLES = [
	"superadmin",
	"akademik",
	"finance",
	"pmb",
	"crm",
	"dosen",
	"pa",
	"magang",
];

async function main() {
	console.log("=== AUDIT KESIAPAN EMAIL PENGGUNA (OTP 2FA) ===");
	const allUsers = await db.query.users.findMany({
		columns: {
			id: true,
			username: true,
			fullName: true,
			role: true,
			email: true,
		},
	});

	const missingStaff: any[] = [];
	const readyStaff: any[] = [];

	for (const u of allUsers) {
		const isStaff = STAFF_ROLES.includes(u.role);
		if (isStaff) {
			if (!u.email || u.email.trim() === "") {
				missingStaff.push(u);
			} else {
				readyStaff.push(u);
			}
		}
	}

	console.log(`\nTotal akun staf: ${readyStaff.length + missingStaff.length}`);
	console.log(`✅ Staf dengan email aktif (${readyStaff.length}):`);
	for (const u of readyStaff) {
		console.log(
			`   - [${u.role.toUpperCase()}] ${u.username} (${u.fullName}) -> ${u.email}`,
		);
	}

	console.log(
		`\n⚠️ Staf TANPA email / Belum siap OTP (${missingStaff.length}):`,
	);
	for (const u of missingStaff) {
		console.log(
			`   - [${u.role.toUpperCase()}] ${u.username} (${u.fullName}) -> EMAIL KOSONG`,
		);
	}

	console.log(
		"\nCatatan: Akun staf tanpa email akan ditolak login (fail-closed) demi keamanan setelah kebijakan OTP diaktifkan.",
	);
	process.exit(0);
}

main().catch((err) => {
	console.error("Audit error:", err);
	process.exit(1);
});
