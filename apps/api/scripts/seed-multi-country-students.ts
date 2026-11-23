import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
	academicData,
	crmData,
	feeShareRecipients,
	finalDecision,
	financeData,
	financeSemesters,
	internshipData,
	overseasProgramChecklists,
	paData,
	pmbData,
	pmbPaymentPlan,
	studentHealth,
	studentParents,
	students,
	users,
} from "../src/db/schema";

const MULTI_COUNTRY_STUDENTS = [
	{
		nim: "250011",
		name: "Kenjiro Pratama",
		nickname: "Kenjiro",
		gender: "Laki-laki",
		birthPlace: "Semarang",
		birthDate: "2005-03-12",
		religion: "Islam",
		nationality: "Indonesia",
		phone: "081234567111",
		email: "kenjiro.pratama@student.nusadaya.ac.id",
		schoolOrigin: "SMK Pariwisata Semarang",
		schoolMajor: "Perhotelan",
		graduationYear: 2023,
		program: "Hospitality",
		subProgram: "Taiwan-Hospitality",
		destinationCountry: "Taiwan",
		destinationCity: "Taipei",
		internshipCompany: "Grand Hotel Taipei",
		visaNo: "TW-VISA-2026-1188",
		suhanNo: "SUHAN-TW-2026-8812",
		cohort: 2025,
		batch: 16,
		rombel: "Kelas A",
	},
	{
		nim: "250012",
		name: "Aiko Rahmadani",
		nickname: "Aiko",
		gender: "Perempuan",
		birthPlace: "Surabaya",
		birthDate: "2005-07-22",
		religion: "Islam",
		nationality: "Indonesia",
		phone: "081234567112",
		email: "aiko.rahmadani@student.nusadaya.ac.id",
		schoolOrigin: "SMK Tata Boga Surabaya",
		schoolMajor: "Tata Boga",
		graduationYear: 2023,
		program: "Culinary",
		subProgram: "Jepang-Hospitality",
		destinationCountry: "Jepang",
		destinationCity: "Tokyo",
		internshipCompany: "Hilton Tokyo Bay",
		visaNo: "JP-VISA-2026-9921",
		suhanNo: null,
		cohort: 2025,
		batch: 16,
		rombel: "Kelas B",
	},
	{
		nim: "250013",
		name: "Danang Kusuma",
		nickname: "Danang",
		gender: "Laki-laki",
		birthPlace: "Yogyakarta",
		birthDate: "2004-11-05",
		religion: "Islam",
		nationality: "Indonesia",
		phone: "081234567113",
		email: "danang.kusuma@student.nusadaya.ac.id",
		schoolOrigin: "SMK Negeri 6 Yogyakarta",
		schoolMajor: "Akomodasi Perhotelan",
		graduationYear: 2023,
		program: "Front Office",
		subProgram: "Malaysia-Hospitality",
		destinationCountry: "Malaysia",
		destinationCity: "Kuala Lumpur",
		internshipCompany: "The Ritz-Carlton Kuala Lumpur",
		visaNo: "MY-VISA-2026-3341",
		suhanNo: null,
		cohort: 2025,
		batch: 16,
		rombel: "Kelas A",
	},
	{
		nim: "250014",
		name: "Siti Nurhaliza",
		nickname: "Siti",
		gender: "Perempuan",
		birthPlace: "Bandung",
		birthDate: "2005-09-18",
		religion: "Islam",
		nationality: "Indonesia",
		phone: "081234567114",
		email: "siti.nurhaliza@student.nusadaya.ac.id",
		schoolOrigin: "SMK Pariwisata Bandung",
		schoolMajor: "Food & Beverage Service",
		graduationYear: 2023,
		program: "Barista",
		subProgram: "Timur tengah-Barista",
		destinationCountry: "Timur Tengah",
		destinationCity: "Dubai",
		internshipCompany: "Burj Al Arab Hotel Dubai",
		visaNo: "UAE-VISA-2026-5519",
		suhanNo: null,
		cohort: 2025,
		batch: 16,
		rombel: "Kelas C",
	},
	{
		nim: "250015",
		name: "Reza Raditya",
		nickname: "Reza",
		gender: "Laki-laki",
		birthPlace: "Medan",
		birthDate: "2005-01-30",
		religion: "Islam",
		nationality: "Indonesia",
		phone: "081234567115",
		email: "reza.raditya@student.nusadaya.ac.id",
		schoolOrigin: "SMK Pariwisata Medan",
		schoolMajor: "Perhotelan",
		graduationYear: 2023,
		program: "Housekeeping",
		subProgram: "Indonesia-Reguler",
		destinationCountry: "Indonesia",
		destinationCity: "Bali",
		internshipCompany: "Ayana Resort & Spa Bali",
		visaNo: null,
		suhanNo: null,
		cohort: 2025,
		batch: 16,
		rombel: "Kelas B",
	},
];

async function seedMultiCountryStudents() {
	console.log(
		"=== Memulai Seeder Mahasiswa Multi-Negara & Multi-Penjurusan ===",
	);

	const admin = await db.query.users.findFirst({
		where: eq(users.role, "superadmin"),
	});
	const adminId = admin?.id || 11;
	const defaultPassword = "password";
	const passwordHash = await Bun.password.hash(defaultPassword);
	const now = new Date();

	for (const data of MULTI_COUNTRY_STUDENTS) {
		console.log(
			`\nMemproses Mahasiswa: ${data.name} (NIM: ${data.nim}, Negara: ${data.destinationCountry}, Jurusan: ${data.program})...`,
		);

		// 1. Akun Pengguna (Users)
		let user = await db.query.users.findFirst({
			where: eq(users.username, data.nim),
		});

		if (!user) {
			const [createdUser] = await db
				.insert(users)
				.values({
					username: data.nim,
					passwordHash,
					fullName: data.name,
					role: "mahasiswa",
					roles: ["mahasiswa"],
					email: data.email,
					phone: data.phone,
				})
				.returning();
			user = createdUser;
			console.log(
				`  ✓ Akun user berhasil dibuat (Username: ${data.nim}, Password: ${defaultPassword})`,
			);
		} else {
			await db
				.update(users)
				.set({
					email: data.email,
					phone: data.phone,
					fullName: data.name,
					passwordHash,
				})
				.where(eq(users.id, user.id));
			console.log(`  ✓ Akun user sudah ada, diperbarui.`);
		}

		// 2. Data Mahasiswa (Students)
		let student = await db.query.students.findFirst({
			where: eq(students.nim, data.nim),
		});

		const studentPayload = {
			nim: data.nim,
			name: data.name,
			nickname: data.nickname,
			cohort: data.cohort,
			batch: data.batch,
			rombel: data.rombel,
			program: data.program,
			subProgram: data.subProgram,
			destinationCountry: data.destinationCountry,
			gender: data.gender,
			birthPlace: data.birthPlace,
			birthDate: new Date(data.birthDate),
			religion: data.religion,
			nationality: data.nationality,
			phone: data.phone,
			email: data.email,
			schoolOrigin: data.schoolOrigin,
			schoolMajor: data.schoolMajor,
			graduationYear: data.graduationYear,
			addressStreet: "Jl. Pendidikan No. 10",
			addressVillage: "Kuningan",
			addressDistrict: "Setiabudi",
			addressCity: "Jakarta Selatan",
			addressProvince: "DKI Jakarta",
			livingWith: "Orang tua",
			studentStatus: "aktif" as const,
			overallStatus: "AMAN" as const,
			updatedAt: now,
		};

		if (!student) {
			const [createdStudent] = await db
				.insert(students)
				.values(studentPayload)
				.returning();
			student = createdStudent;
			console.log(`  ✓ Data mahasiswa berhasil dibuat.`);
		} else {
			await db
				.update(students)
				.set(studentPayload)
				.where(eq(students.id, student.id));
			console.log(`  ✓ Data mahasiswa sudah ada, diperbarui.`);
		}

		const sId = student.id;

		// 3. Orang Tua & Kesehatan
		await db.delete(studentParents).where(eq(studentParents.studentId, sId));
		await db.insert(studentParents).values([
			{
				studentId: sId,
				type: "ayah",
				name: `Ayah ${data.name}`,
				phone: "081234567990",
				job: "Wiraswasta",
				status: "Hidup",
			},
			{
				studentId: sId,
				type: "ibu",
				name: `Ibu ${data.name}`,
				phone: "081234567991",
				job: "Ibu Rumah Tangga",
				status: "Hidup",
			},
		]);

		await db.delete(studentHealth).where(eq(studentHealth.studentId, sId));
		await db.insert(studentHealth).values({
			studentId: sId,
			bloodType: "O",
			height: 170,
			weight: 62,
			clothingSize: "L",
			diseaseHistory: "Tidak ada",
		});

		// 4. Panel PMB: 100% Lengkap & ACC
		await db.delete(pmbData).where(eq(pmbData.studentId, sId));
		await db.insert(pmbData).values({
			studentId: sId,
			formReceived: true,
			documentsComplete: true,
			dataInputted: true,
			initialFollowUp: true,
			pasFoto: true,
			docKtp: true,
			docKk: true,
			docCv: true,
			docIjazah: true,
			docTranskrip: true,
			docPassportDepan: true,
			docSkbm: true,
			docPreMcu: true,
			docSla: true,
			isAcc: true,
			accAt: now,
			accBy: adminId,
			status: "AMAN",
			updatedAt: now,
		});

		await db.delete(pmbPaymentPlan).where(eq(pmbPaymentPlan.studentId, sId));
		await db.insert(pmbPaymentPlan).values({
			studentId: sId,
			totalBiaya: 25000000,
			pendaftaranDp: 5000000,
			dpPaymentStatus: "paid",
			dpPaymentDate: now,
			biayaTahap1: 6500000,
			biayaTahap2: 6500000,
			biayaTahap3: 7000000,
			notes: "Skema pembiayaan lengkap & terverifikasi",
		});

		await db
			.delete(feeShareRecipients)
			.where(eq(feeShareRecipients.studentId, sId));
		await db.insert(feeShareRecipients).values({
			studentId: sId,
			namaReferral: "Biro Kerjasama Industri & Edukasi",
			kategori: "Mitra",
			namaInstitusi: "Mitra Sosialisasi Nusadaya",
			noRekening: "88201928172",
			namaBank: "Bank Mandiri",
			noHp: "081234567890",
			nominalFee: 1000000,
			statusPencairan: "sudah_dibayarkan",
			tanggalCair: now,
			createdBy: adminId,
		});
		console.log("  ✓ PMB Data & Payment Plan: ACC LENGKAP.");

		// 5. Panel CRM: 100% Lengkap & ACC
		await db.delete(crmData).where(eq(crmData.studentId, sId));
		await db.insert(crmData).values({
			studentId: sId,
			isMonitoringParent: true,
			isMonitoringIndustry: true,
			isVocabComplete: true,
			practiceAttendance: true,
			isOds1Report: true,
			isOds2Report: true,
			isOds3Report: true,
			isOds4Report: true,
			isOds5Report: true,
			isPrammagangReport: true,
			isMonthlyVideo: true,
			isTriDharma: true,
			characterBuildingPassed: true,
			dormitoryActive: true,
			odsActive: true,
			isAcc: true,
			accAt: now,
			accBy: adminId,
			status: "AMAN",
			updatedAt: now,
		});
		console.log("  ✓ CRM Data: ACC LENGKAP.");

		// 6. Panel Akademik: 100% Lengkap & ACC
		await db.delete(academicData).where(eq(academicData.studentId, sId));
		await db.insert(academicData).values({
			studentId: sId,
			pddiktiInput: true,
			utsPassed: true,
			uasPassed: true,
			attitudeIndicator: true,
			assignmentsCompleted: true,
			academicCommunication: true,
			assessmentCompleted: true,
			gpa: 385,
			creditsCompleted: 24,
			khsPublished: true,
			taiwanCohort: data.destinationCountry === "Taiwan",
			isAcc: true,
			accAt: now,
			accBy: adminId,
			status: "AMAN",
			updatedAt: now,
		});

		if (data.destinationCountry === "Taiwan") {
			await db
				.delete(overseasProgramChecklists)
				.where(eq(overseasProgramChecklists.studentId, sId));
			await db.insert(overseasProgramChecklists).values({
				studentId: sId,
				programType: "taiwan",
				pasFotoChecked: true,
				cvChecked: true,
				ktmChecked: true,
				khsChecked: true,
				sl21Checked: true,
				aktifChecked: true,
				gapYearChecked: true,
				pddiktiChecked: true,
				pribadiChecked: true,
				lolChecked: true,
				loaChecked: true,
				suhhanChecked: true,
			});
		}
		console.log("  ✓ Akademik Data: ACC LENGKAP.");

		// 7. Panel PA (Pendamping Akademik): 100% Lengkap & ACC
		await db.delete(paData).where(eq(paData.studentId, sId));
		await db.insert(paData).values({
			studentId: sId,
			counselingDone: true,
			mentalStable: true,
			disciplineGood: true,
			hafalanCompleted: 30,
			hafalanTarget: 30,
			hafalanStatus: "lulus",
			isAcc: true,
			accAt: now,
			accBy: adminId,
			status: "AMAN",
			updatedAt: now,
		});
		console.log("  ✓ PA Data: ACC LENGKAP.");

		// 8. Panel Finance: Registrasi & SPP Semester 1 LUNAS & ACC
		await db.delete(financeData).where(eq(financeData.studentId, sId));
		await db.insert(financeData).values({
			studentId: sId,
			registrasiNominal: 5000000,
			registrasiPaidDate: now,
			registrasiStatus: true,
			metodePembayaran: "mandiri",
			mandiriSemesterNominal: 6500000,
			mandiriSemesterPaidDate: now,
			mandiriSemesterStatus: true,
			mandiriInterviewNominal: 3000000,
			mandiriInterviewPaidDate: now,
			mandiriInterviewStatus: true,
			kontrakMagangStatus: true,
			kontrakMagangPaidDate: now,
			suhanStatus: Boolean(data.suhanNo),
			suhanPaidDate: data.suhanNo ? now : null,
			mandiriKeberangkatanNominal: 5000000,
			mandiriKeberangkatanPaidDate: now,
			mandiriKeberangkatanStatus: true,
			isAcc: true,
			accAt: now,
			accBy: adminId,
			status: "AMAN",
			updatedAt: now,
		});

		await db
			.delete(financeSemesters)
			.where(eq(financeSemesters.studentId, sId));
		await db.insert(financeSemesters).values([
			{
				studentId: sId,
				semesterNumber: 1,
				totalBilled: 6500000,
				isTalangan: false,
				status: "LUNAS",
			},
			{
				studentId: sId,
				semesterNumber: 2,
				totalBilled: 6500000,
				isTalangan: false,
				status: "BELUM_BAYAR",
			},
		]);
		console.log("  ✓ Finance Data & Semester 1: LUNAS & ACC.");

		// 9. Panel Magang: Lolos Prasyarat + Alur Dokumen Keberangkatan Lengkap & ACC
		await db.delete(internshipData).where(eq(internshipData.studentId, sId));
		await db.insert(internshipData).values({
			studentId: sId,
			passportReady: true,
			passportNo: `X${Math.floor(1000000 + Math.random() * 9000000)}`,
			passportExp: new Date("2033-01-01"),
			interviewReady: true,
			interviewDate: now,
			interviewResult: "Lulus",
			mouReady: true,
			mouDate: now,
			mouNotes: `MOU Kerjasama dengan ${data.internshipCompany}`,
			loaConfirmed: true,
			loaDate: now,
			loaReady: true,
			loaCompany: data.internshipCompany,
			loaPosition: data.program,
			contractReady: true,
			contractDate: now,
			suhanReady: Boolean(data.suhanNo),
			suhanNo: data.suhanNo,
			suhanDate: data.suhanNo ? now : null,
			suhanNotes: data.suhanNo ? "Disetujui Biro Pariwisata Taiwan" : null,
			mcuReady: true,
			mcuResult: "fit",
			mcuPlace: "RS Pelabuhan Jakarta",
			mcuDate: now,
			visaReady: Boolean(data.visaNo),
			visaStatus: data.visaNo ? "approved" : null,
			visaType: data.visaNo ? "Internship / Work Visa" : null,
			visaNo: data.visaNo,
			ticketReady: true,
			ticketAirline: "Garuda Indonesia",
			ticketFlight: "GA-800",
			ticketDate: new Date("2026-10-15"),
			asesmenReady: true,
			asesmenDate: now,
			asesmenResult: "Sangat Baik",
			destinationCity: data.destinationCity,
			internshipCompany: data.internshipCompany,
			internshipDuration: "1 Tahun",
			agenReady: true,
			agenNegaraTujuan: data.destinationCountry,
			isAcc: true,
			accAt: now,
			accBy: adminId,
			status: "AMAN",
			updatedAt: now,
		});
		console.log("  ✓ Magang Data: LOLOS PRASYARAT + DOKUMEN LENGKAP & ACC.");

		// 10. Final Decision (Evaluasi Akhir)
		await db.delete(finalDecision).where(eq(finalDecision.studentId, sId));
		await db.insert(finalDecision).values({
			studentId: sId,
			evaluatorDecision: "layak_berangkat",
			isApprovedByDirector: true,
			decidedAt: now,
			decidedBy: adminId,
			notes:
				"Seluruh syarat PMB, CRM, Finance, Akademik, PA, dan Magang telah tuntas (Siap Berangkat).",
		});
		console.log("  ✓ Evaluasi Final Decision: LAYAK BERANGKAT.");
	}

	console.log(
		"\n=== Semua Mahasiswa Baru Berhasil Di-seed dan Siap Digunakan ===",
	);
	process.exit(0);
}

seedMultiCountryStudents().catch((err) => {
	console.error("Error executing seeder:", err);
	process.exit(1);
});
