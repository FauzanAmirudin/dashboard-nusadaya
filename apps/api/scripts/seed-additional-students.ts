import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { students, users } from "../src/db/schema";
import { createStudentPipeline } from "../src/routes/student/core";

const additionalStudentsData = [
	{
		// 1. Keterangan Mahasiswa
		nim: "240004",
		name: "Rizky Firmansyah",
		nickname: "Rizky",
		gender: "Laki-laki",
		birthPlace: "Denpasar",
		birthDate: "2005-04-15",
		religion: "Islam",
		nationality: "Indonesia",
		addressStreet: "Jl. Teuku Umar No. 88",
		addressRt: "02",
		addressRw: "04",
		addressNo: "88",
		addressVillage: "Dauh Puri Kauh",
		addressDistrict: "Denpasar Barat",
		addressCity: "Kota Denpasar",
		addressProvince: "Bali",
		livingWith: "Orang tua",
		phone: "081234567891",
		email: "rizky.firmansyah@student.nusadaya.ac.id",

		// 2. Keterangan Pendidikan & PMB
		schoolOrigin: "SMK Pariwisata Denpasar",
		schoolAddress: "Jl. Bedugul No. 12, Denpasar",
		schoolMajor: "Perhotelan",
		graduationYear: 2023,
		program: "Hospitality",
		subProgram: "Malaysia-Hospitality",
		classType: "Reguler",
		academicYear: "2024/2025",
		cohort: 15,
		batch: 15,
		rombel: "Kelas A",
		studentStatus: "aktif" as const,
		destinationCountry: "Malaysia",
		period: "1 Tahun",
		rekomendasi: "Alumni Nusadaya",
		timVisit: "Tim A PMB",
		timSosialisasi: "Tim Sosialisasi Bali",
		roReferral: "I Made Suwandi",
		referralCategory: "tim_nusadaya",
		referralContactName: "I Made Suwandi",

		// 3. Keterangan Kesehatan
		bloodType: "O",
		diseaseHistory: "Tidak ada",
		congenitalDisease: "Tidak ada",
		height: 172,
		weight: 65,
		clothingSize: "L",

		// 4. Keterangan Orang Tua & Wali
		parents: [
			{
				type: "ayah",
				name: "Hendra Firmansyah",
				birthPlace: "Banyuwangi",
				birthDate: "1975-08-10",
				religion: "Islam",
				nationality: "Indonesia",
				education: "S1",
				job: "Wiraswasta",
				address: "Jl. Teuku Umar No. 88, Denpasar",
				phone: "081234567801",
				email: "hendra.firmansyah@gmail.com",
				status: "Hidup",
			},
			{
				type: "ibu",
				name: "Dewi Suryaningsih",
				birthPlace: "Denpasar",
				birthDate: "1978-11-20",
				religion: "Islam",
				nationality: "Indonesia",
				education: "D3",
				job: "Ibu Rumah Tangga",
				address: "Jl. Teuku Umar No. 88, Denpasar",
				phone: "081234567802",
				email: "dewi.suryaningsih@gmail.com",
				status: "Hidup",
			},
			{
				type: "wali",
				name: "Hendra Firmansyah",
				guardianRelation: "Ayah Kandung",
				phone: "081234567801",
				address: "Jl. Teuku Umar No. 88, Denpasar",
				job: "Wiraswasta",
			},
		],
	},
	{
		// 1. Keterangan Mahasiswa
		nim: "240005",
		name: "Ni Putu Saraswati",
		nickname: "Saras",
		gender: "Perempuan",
		birthPlace: "Gianyar",
		birthDate: "2005-09-22",
		religion: "Hindu",
		nationality: "Indonesia",
		addressStreet: "Jl. Raya Ubud No. 45",
		addressRt: "01",
		addressRw: "02",
		addressNo: "45",
		addressVillage: "Ubud",
		addressDistrict: "Ubud",
		addressCity: "Kab. Gianyar",
		addressProvince: "Bali",
		livingWith: "Orang tua",
		phone: "081298765432",
		email: "putu.saraswati@student.nusadaya.ac.id",

		// 2. Keterangan Pendidikan & PMB
		schoolOrigin: "SMK Negeri 1 Gianyar",
		schoolAddress: "Jl. Ciung Wanara No. 5, Gianyar",
		schoolMajor: "Tata Boga (Culinary)",
		graduationYear: 2023,
		program: "Culinary",
		subProgram: "Taiwan-Hospitality",
		classType: "Reguler",
		academicYear: "2024/2025",
		cohort: 15,
		batch: 15,
		rombel: "Kelas B",
		studentStatus: "aktif" as const,
		destinationCountry: "Taiwan",
		period: "1 Tahun",
		rekomendasi: "Guru BKK",
		timVisit: "Tim B PMB",
		timSosialisasi: "Tim Sosialisasi Bali",
		mitraSponsor: "Mitra Karir Global",
		referralCategory: "mitra_sponsor",
		referralInstitutionName: "Mitra Karir Global",
		referralContactName: "Budi Santoso, M.Pd",

		// 3. Keterangan Kesehatan
		bloodType: "B",
		diseaseHistory: "Tidak ada",
		congenitalDisease: "Tidak ada",
		height: 163,
		weight: 52,
		clothingSize: "M",

		// 4. Keterangan Orang Tua & Wali
		parents: [
			{
				type: "ayah",
				name: "I Wayan Sudarma",
				birthPlace: "Gianyar",
				birthDate: "1974-05-14",
				religion: "Hindu",
				nationality: "Indonesia",
				education: "SMA",
				job: "Pemandu Wisata",
				address: "Jl. Raya Ubud No. 45, Gianyar",
				phone: "081338765401",
				email: "wayan.sudarma@gmail.com",
				status: "Hidup",
			},
			{
				type: "ibu",
				name: "Ni Ketut Astini",
				birthPlace: "Gianyar",
				birthDate: "1977-03-08",
				religion: "Hindu",
				nationality: "Indonesia",
				education: "SMA",
				job: "Pedagang",
				address: "Jl. Raya Ubud No. 45, Gianyar",
				phone: "081338765402",
				email: "ketut.astini@gmail.com",
				status: "Hidup",
			},
			{
				type: "wali",
				name: "I Wayan Sudarma",
				guardianRelation: "Ayah Kandung",
				phone: "081338765401",
				address: "Jl. Raya Ubud No. 45, Gianyar",
				job: "Pemandu Wisata",
			},
		],
	},
];

async function seedAdditionalStudents() {
	console.log("=== SEED 2 MAHASISWA BARU (FORMAT FORM PMB LENGKAP) ===");

	// Ambil superadmin sebagai user pencatat pendaftaran
	const [adminUser] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.role, "superadmin"))
		.limit(1);

	const adminId = adminUser?.id || 1;

	for (const data of additionalStudentsData) {
		console.log(`\nMemproses mahasiswa: ${data.name} (NIM: ${data.nim})...`);

		// Cek apakah mahasiswa dengan NIM ini sudah ada
		const existingStudent = await db.query.students.findFirst({
			where: eq(students.nim, data.nim),
		});

		if (existingStudent) {
			console.log(
				`Mahasiswa ${data.name} (NIM: ${data.nim}) sudah ada dengan ID ${existingStudent.id}. Melewati penambahan.`,
			);
			continue;
		}

		// Jalankan createStudentPipeline (sama persis dengan alur form submit di panel PMB)
		try {
			const result = await createStudentPipeline(data, adminId);
			console.log(
				`Berhasil menambahkan: ${result.student.name} (ID: ${result.student.id}, NIM: ${result.student.nim})`,
			);
			console.log(`   - Akun User Mahasiswa: ${result.student.nim}`);
			console.log(
				`   - Relasi Panel Terbuat: pmb_data, finance_data, academic_data, crm_data, pa_data, internship_data, final_decision`,
			);
		} catch (err: any) {
			console.error(`Gagal menambahkan ${data.name}:`, err.message || err);
		}
	}

	console.log("\nSelesai menjalankan seed data mahasiswa!");
	process.exit(0);
}

seedAdditionalStudents().catch((err) => {
	console.error("Fatal error saat seeding mahasiswa:", err);
	process.exit(1);
});
