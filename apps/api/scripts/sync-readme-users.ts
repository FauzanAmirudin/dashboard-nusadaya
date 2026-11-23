import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { students, users } from "../src/db/schema";

/**
 * Script untuk menyelaraskan seluruh akun pengguna/admin di basis data
 * agar 100% konsisten dan sesuai dengan tabel "Daftar Akun Demo & Matriks Hak Akses (RBAC)" di README.md
 */
async function main() {
	console.log("=== SINKRONISASI AKUN ADMIN & PENGGUNA SESUAI README.MD ===");

	const passwordHash = await Bun.password.hash("password");

	// 1. Akun Divisi Operasional & Manajemen
	const operationalStaff = [
		{
			username: "superadmin",
			fullName: "Superadmin Nusadaya",
			role: "superadmin" as const,
			roles: ["superadmin"],
			email: "onedatanusadaya@gmail.com",
			phone: "081234567890",
		},
		{
			username: "pmb",
			fullName: "Divisi PMB",
			role: "pmb" as const,
			roles: ["pmb"],
			email: "pmb@nusadaya.ac.id",
			phone: "081234567891",
		},
		{
			username: "crm",
			fullName: "Divisi CRM",
			role: "crm" as const,
			roles: ["crm"],
			email: "crm@nusadaya.ac.id",
			phone: "081234567892",
		},
		{
			username: "finance",
			fullName: "Divisi Finance",
			role: "finance" as const,
			roles: ["finance"],
			email: "finance@nusadaya.ac.id",
			phone: "081234567893",
		},
		{
			username: "akademik",
			fullName: "Divisi Akademik",
			role: "akademik" as const,
			roles: ["akademik"],
			email: "akademik@nusadaya.ac.id",
			phone: "081234567894",
		},
		{
			username: "magang",
			fullName: "Tim Magang",
			role: "magang" as const,
			roles: ["magang"],
			email: "magang@nusadaya.ac.id",
			phone: "081234567897",
		},
		{
			username: "pa",
			fullName: "Koordinator Pembimbing Akademik",
			role: "pa" as const,
			roles: ["pa"],
			email: "pa@nusadaya.ac.id",
			phone: "081234567896",
		},
		{
			username: "dosen",
			fullName: "Dosen Pengajar",
			role: "dosen" as const,
			roles: ["dosen"],
			email: "dosen@nusadaya.ac.id",
			phone: "081234567000",
		},
	];

	// 2. Akun Dosen Pembimbing Akademik (PA)
	const paStaff = [
		{
			username: "pa1",
			fullName: "Dr. Maya Indah Permata, M.Pd.",
			role: "pa" as const,
			roles: ["pa"],
			email: "pa1@nusadaya.ac.id",
			phone: "082134567001",
		},
		{
			username: "pa2",
			fullName: "Bambang Wijaya, S.Pd., M.Ed.",
			role: "pa" as const,
			roles: ["pa"],
			email: "pa2@nusadaya.ac.id",
			phone: "082134567002",
		},
		{
			username: "pa3",
			fullName: "dr. Ratna Sari, M.Biomed.",
			role: "pa" as const,
			roles: ["pa"],
			email: "pa3@nusadaya.ac.id",
			phone: "082134567003",
		},
		{
			username: "pa4",
			fullName: "Drs. Joko Purwanto, M.M.",
			role: "pa" as const,
			roles: ["pa"],
			email: "pa4@nusadaya.ac.id",
			phone: "082134567004",
		},
		{
			username: "pa5",
			fullName: "Sri Wahyuni, S.Pd., M.Pd.",
			role: "pa" as const,
			roles: ["pa"],
			email: "pa5@nusadaya.ac.id",
			phone: "082134567005",
		},
		{
			username: "pa6",
			fullName: "Ahmad Ridwan, S.T., M.Sc.",
			role: "pa" as const,
			roles: ["pa"],
			email: "pa6@nusadaya.ac.id",
			phone: "082134567006",
		},
		{
			username: "pa7",
			fullName: "Fitri Handayani, S.Par., M.Par.",
			role: "pa" as const,
			roles: ["pa"],
			email: "pa7@nusadaya.ac.id",
			phone: "082134567007",
		},
		{
			username: "pa8",
			fullName: "Hadi Pranoto, S.T., M.Kom.",
			role: "pa" as const,
			roles: ["pa"],
			email: "pa8@nusadaya.ac.id",
			phone: "082134567008",
		},
		{
			username: "pa9",
			fullName: "Yuliana Dewi, S.Si., M.Si.",
			role: "pa" as const,
			roles: ["pa", "crm"], // Role Ganda per README
			email: "pa9@nusadaya.ac.id",
			phone: "082134567009",
		},
		{
			username: "pa10",
			fullName: "Rizky Firmansyah, S.Pd., M.Pd.",
			role: "pa" as const,
			roles: ["pa", "akademik"], // Role Ganda per README
			email: "pa10@nusadaya.ac.id",
			phone: "082134567010",
		},
	];

	// 3. Akun Dosen Pengampu
	const dosenStaff = [
		{
			username: "dosen1",
			fullName: "Dr. Hendra Gunawan, M.Pd.",
			role: "dosen" as const,
			roles: ["dosen"],
			email: "dosen1@nusadaya.ac.id",
			phone: "081234567001",
		},
		{
			username: "dosen2",
			fullName: "Siti Rahmawati, S.E., M.M.",
			role: "dosen" as const,
			roles: ["dosen"],
			email: "dosen2@nusadaya.ac.id",
			phone: "081234567002",
		},
		{
			username: "dosen3",
			fullName: "Budi Prasetyo, S.Kom., M.Kom.",
			role: "dosen" as const,
			roles: ["dosen"],
			email: "dosen3@nusadaya.ac.id",
			phone: "081234567003",
		},
		{
			username: "dosen4",
			fullName: "Dewi Lestari, S.Par., M.Par.",
			role: "dosen" as const,
			roles: ["dosen"],
			email: "dosen4@nusadaya.ac.id",
			phone: "081234567004",
		},
		{
			username: "dosen5",
			fullName: "Agus Setiawan, S.T., M.Sc.",
			role: "dosen" as const,
			roles: ["dosen"],
			email: "dosen5@nusadaya.ac.id",
			phone: "081234567005",
		},
		{
			username: "dosen6",
			fullName: "Nurul Hidayah, S.Pd., M.Pd.",
			role: "dosen" as const,
			roles: ["dosen"],
			email: "dosen6@nusadaya.ac.id",
			phone: "081234567006",
		},
		{
			username: "dosen7",
			fullName: "Eko Saputra, S.S., M.Hum.",
			role: "dosen" as const,
			roles: ["dosen"],
			email: "dosen7@nusadaya.ac.id",
			phone: "081234567007",
		},
		{
			username: "dosen8",
			fullName: "Rina Kusuma, S.Si., M.Si.",
			role: "dosen" as const,
			roles: ["dosen"],
			email: "dosen8@nusadaya.ac.id",
			phone: "081234567008",
		},
		{
			username: "dosen9",
			fullName: "Fajar Pratama, S.Kom., M.Kom.",
			role: "dosen" as const,
			roles: ["dosen"],
			email: "dosen9@nusadaya.ac.id",
			phone: "081234567009",
		},
		{
			username: "dosen10",
			fullName: "Anisa Wulandari, S.E., M.M.",
			role: "dosen" as const,
			roles: ["dosen"],
			email: "dosen10@nusadaya.ac.id",
			phone: "081234567010",
		},
	];

	// 4. Akun Portal Mahasiswa
	const mahasiswaStaff = [
		{
			username: "mahasiswa1",
			fullName: "Aditya Pratama",
			role: "mahasiswa" as const,
			roles: ["mahasiswa"],
			email: "mhs1@student.nusadaya.ac.id",
			phone: "083134567001",
		},
		{
			username: "mahasiswa2",
			fullName: "Bella Safitri",
			role: "mahasiswa" as const,
			roles: ["mahasiswa"],
			email: "mhs2@student.nusadaya.ac.id",
			phone: "083134567002",
		},
		{
			username: "mahasiswa3",
			fullName: "Dimas Anggara",
			role: "mahasiswa" as const,
			roles: ["mahasiswa"],
			email: "mhs3@student.nusadaya.ac.id",
			phone: "083134567003",
		},
		{
			username: "mahasiswa4",
			fullName: "Eka Putri Rahayu",
			role: "mahasiswa" as const,
			roles: ["mahasiswa"],
			email: "mhs4@student.nusadaya.ac.id",
			phone: "083134567004",
		},
		{
			username: "mahasiswa5",
			fullName: "Faris Maulana",
			role: "mahasiswa" as const,
			roles: ["mahasiswa"],
			email: "mhs5@student.nusadaya.ac.id",
			phone: "083134567005",
		},
		{
			username: "mahasiswa6",
			fullName: "Gita Gutawa",
			role: "mahasiswa" as const,
			roles: ["mahasiswa"],
			email: "mhs6@student.nusadaya.ac.id",
			phone: "083134567006",
		},
		{
			username: "mahasiswa7",
			fullName: "Hilman Syahputra",
			role: "mahasiswa" as const,
			roles: ["mahasiswa"],
			email: "mhs7@student.nusadaya.ac.id",
			phone: "083134567007",
		},
		{
			username: "mahasiswa8",
			fullName: "Intan Permata",
			role: "mahasiswa" as const,
			roles: ["mahasiswa"],
			email: "mhs8@student.nusadaya.ac.id",
			phone: "083134567008",
		},
		{
			username: "mahasiswa9",
			fullName: "Julian Alamsyah",
			role: "mahasiswa" as const,
			roles: ["mahasiswa"],
			email: "mhs9@student.nusadaya.ac.id",
			phone: "083134567009",
		},
		{
			username: "mahasiswa10",
			fullName: "Karin Novilda",
			role: "mahasiswa" as const,
			roles: ["mahasiswa"],
			email: "mhs10@student.nusadaya.ac.id",
			phone: "083134567010",
		},
	];

	const allTargetUsers = [
		...operationalStaff,
		...paStaff,
		...dosenStaff,
		...mahasiswaStaff,
	];

	let updatedCount = 0;
	let insertedCount = 0;

	for (const acc of allTargetUsers) {
		const [existing] = await db
			.select()
			.from(users)
			.where(eq(users.username, acc.username));

		if (existing) {
			await db
				.update(users)
				.set({
					fullName: acc.fullName,
					role: acc.role,
					roles: acc.roles,
					email: acc.email,
					phone: acc.phone,
					passwordHash,
					updatedAt: new Date(),
				})
				.where(eq(users.id, existing.id));
			updatedCount++;
		} else {
			await db.insert(users).values({
				username: acc.username,
				fullName: acc.fullName,
				role: acc.role,
				roles: acc.roles,
				email: acc.email,
				phone: acc.phone,
				passwordHash,
			});
			insertedCount++;
		}
	}

	console.log(
		`✓ Sinkronisasi selesai: ${updatedCount} akun diperbarui, ${insertedCount} akun baru dibuat.`,
	);

	// Sinkronisasi akun mahasiswa angkatan 24 (240001 s.d. 240003) agar bisa login dengan NIM
	const nimStudents = [
		{
			nim: "240001",
			name: "Ahmad Fauzan",
			email: "ahmad.fauzan@student.nusadaya.ac.id",
		},
		{
			nim: "240002",
			name: "Budi Santoso",
			email: "budi.santoso@student.nusadaya.ac.id",
		},
		{
			nim: "240003",
			name: "Cici Amelia",
			email: "cici.amelia@student.nusadaya.ac.id",
		},
	];

	for (const s of nimStudents) {
		const [existing] = await db
			.select()
			.from(users)
			.where(eq(users.username, s.nim));

		if (!existing) {
			await db.insert(users).values({
				username: s.nim,
				fullName: s.name,
				role: "mahasiswa",
				roles: ["mahasiswa"],
				email: s.email,
				passwordHash,
			});
			console.log(`✓ Akun login mahasiswa ${s.nim} (${s.name}) dibuat.`);
		}
	}

	console.log("\nSemua akun telah diselaraskan dengan README.md!");
	process.exit(0);
}

main().catch((err) => {
	console.error("Gagal melakukan sinkronisasi akun:", err);
	process.exit(1);
});
