import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { monotonicFactory } from "ulidx";
import { app } from "../src";
import { db } from "../src/db";
import {
	academicDocuments,
	backupJobs,
	crmDocuments,
	departureAssessments,
	feeShareRecipients,
	files,
	finalDecision,
	financeDocuments,
	internshipDocuments,
	paDocuments,
	pmbDocuments,
	postInternshipDocs,
	students,
	users,
} from "../src/db/schema";
import { resolveBackupPath, resolveStoragePath } from "../src/lib/paths";
import { backupService } from "../src/modules/backup/service/backup.service";
import {
	buildClearBackupFilename,
	formatStudentFolderName,
	resolvePanelAndTabSubdir,
} from "../src/modules/backup/utils/backup-naming";
import { fileService } from "../src/modules/file/service/file.service";

const ulid = monotonicFactory();

// Minimal valid PDF header + body (lolos validateMagicBytes)
function createMockPdf(tag: string): File {
	const pdfContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n% ${tag}\n%%EOF\n`;
	return new File([pdfContent], `${tag}.pdf`, { type: "application/pdf" });
}

// Minimal valid 1x1 PNG (lolos validateMagicBytes)
function createMockPng(name = "foto_profil.png"): File {
	const pngBytes = new Uint8Array([
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
		0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
		0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
		0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
		0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
		0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
	]);
	return new File([pngBytes], name, { type: "image/png" });
}

describe("Backup Naming & Path Resolution Unit Tests", () => {
	it("resolveStoragePath & resolveBackupPath konsisten di workspace maupun env override", () => {
		const storage = resolveStoragePath();
		const backup = resolveBackupPath();
		expect(storage.endsWith("storage")).toBe(true);
		expect(backup.endsWith("backups")).toBe(true);
	});

	it("formatStudentFolderName membentuk nama folder jelas per mahasiswa (NIM & Calon Mhs)", () => {
		expect(
			formatStudentFolderName({
				id: 21,
				nim: "250011",
				name: "Kenjiro Pratama",
			}),
		).toBe("250011_Kenjiro_Pratama");

		expect(
			formatStudentFolderName({
				id: 88,
				nim: null,
				name: "Calon/Mhs: Test*",
			}),
		).toBe("ID88_Calon_Mhs_Test");
	});

	it("resolvePanelAndTabSubdir memetakan seluruh panel & tab ke folder terstruktur", () => {
		expect(resolvePanelAndTabSubdir("pmb", "pmb", "ktp")).toBe(
			join("01_PMB", "Checklist_Dokumen"),
		);
		expect(resolvePanelAndTabSubdir("pmb", "profile", "profile_photo")).toBe(
			join("01_PMB", "Foto_Profil"),
		);
		expect(resolvePanelAndTabSubdir("crm", "crm", "ods_1_report")).toBe(
			join("02_CRM", "ODS"),
		);
		expect(resolvePanelAndTabSubdir("crm", "crm", "pramagang_report")).toBe(
			join("02_CRM", "Pra_Magang"),
		);
		expect(resolvePanelAndTabSubdir("crm", "crm", "tri_dharma_report")).toBe(
			join("02_CRM", "Tri_Dharma"),
		);
		expect(resolvePanelAndTabSubdir("finance", "finance", "registrasi")).toBe(
			join("03_Finance", "Pembayaran_Utama"),
		);
		expect(resolvePanelAndTabSubdir("finance", "finance", "t1_interview")).toBe(
			join("03_Finance", "Dana_Talangan"),
		);
		expect(
			resolvePanelAndTabSubdir("finance", "finance", "fee_transfer_12_123"),
		).toBe(join("03_Finance", "Fee_Sharing"));
		expect(
			resolvePanelAndTabSubdir("akademik", "academic", "departure_assessment"),
		).toBe(join("04_Akademik", "Asesmen_Keberangkatan"));
		expect(
			resolvePanelAndTabSubdir("akademik", "academic", "sk_direktur"),
		).toBe(join("04_Akademik", "SK_Direktur"));
		expect(resolvePanelAndTabSubdir("pa", "pa", "counseling")).toBe(
			join("05_PA", "Bimbingan_PA"),
		);
		expect(resolvePanelAndTabSubdir("magang", "magang", "sl21")).toBe(
			join("06_Magang", "01_Pra_Paspor"),
		);
		expect(
			resolvePanelAndTabSubdir("magang", "magang", "surat_ahli_waris"),
		).toBe(join("06_Magang", "02_Penempatan_dan_Ahli_Waris"));
		expect(resolvePanelAndTabSubdir("magang", "magang", "suhan")).toBe(
			join("06_Magang", "03_Dokumen_Keberangkatan"),
		);
		expect(
			resolvePanelAndTabSubdir("post-internship", "post-internship", "logbook"),
		).toBe(join("06_Magang", "05_Syarat_Akhir_Kepulangan"));
		expect(
			resolvePanelAndTabSubdir("kehadiran", "selfie_absen", "baris_pagi_1_1"),
		).toBe(join("07_Kehadiran_Selfie", "Baris_Pagi"));
	});

	it("buildClearBackupFilename menghasilkan nama file deskriptif & unik tanpa ekstensi ganda", () => {
		const filename = buildClearBackupFilename({
			id: "01TESTBACKUPABCDEF",
			documentKey: "surat_ahli_waris",
			originalName: "berkas_keluarga.pdf",
			extension: "pdf",
			createdAt: new Date("2026-11-24T09:15:30Z"),
		});
		expect(filename).toContain("Surat_Pernyataan_Ahli_Waris");
		expect(filename).toContain("berkas_keluarga");
		expect(filename).toContain("ABCDEF");
		expect(filename.endsWith(".pdf")).toBe(true);
		expect(filename.endsWith(".pdf.pdf")).toBe(false);
	});
});

describe("Backup End-to-End Semua Panel & Tab Per Mahasiswa", () => {
	let superToken = "";
	let superUserId = 1;
	let testStudentId: number;
	const testNim = `99${Date.now().toString().slice(-6)}`;
	const testName = "Ahmad Test Backup Lengkap";
	let testRecipientId: number | null = null;
	let backupJobId: string | null = null;
	let backupOutputDir: string | null = null;
	const uploadedFileIds: string[] = [];

	beforeAll(async () => {
		const adminUser = await db.query.users.findFirst({
			where: eq(users.role, "superadmin"),
		});
		if (adminUser) {
			superUserId = adminUser.id;
		}

		const signer = jwt({
			name: "jwt",
			secret: process.env.JWT_SECRET || "nusadaya-dev-jwt-secret-key-32chars!",
		});
		const mockSignApp = new Elysia()
			.use(signer)
			.get("/sign-super", ({ jwt }: any) =>
				jwt.sign({
					id: superUserId,
					username: adminUser?.username || "superadmin",
					role: "superadmin",
					roles: ["superadmin"],
				}),
			);
		const resSuper = await mockSignApp.handle(
			new Request("http://localhost/sign-super"),
		);
		superToken = await resSuper.text();

		// Buat 1 mahasiswa uji baru (dan foto profil awal sebelum student tercipta)
		const prePhotoFd = new FormData();
		prePhotoFd.append("file", createMockPng("foto_awal_pmb.png"));
		prePhotoFd.append("category", "profile");
		prePhotoFd.append("panel", "pmb");
		prePhotoFd.append("documentKey", "profile_photo");
		prePhotoFd.append("visibility", "public");

		const prePhotoRes = await app.handle(
			new Request("http://localhost:3001/files/upload", {
				method: "POST",
				headers: { Authorization: `Bearer ${superToken}` },
				body: prePhotoFd,
			}),
		);
		const prePhotoJson = (await prePhotoRes.json()) as any;
		expect(prePhotoJson.success).toBe(true);
		uploadedFileIds.push(prePhotoJson.data.id);

		const createRes = await app.handle(
			new Request("http://localhost:3001/students", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${superToken}`,
				},
				body: JSON.stringify({
					nim: testNim,
					name: testName,
					cohort: 16,
					program: "Hospitality",
					subProgram: "Taiwan-Hospitality",
					destinationCountry: "Taiwan",
					profilePhotoUrl: `/files/${prePhotoJson.data.id}/download`,
				}),
			}),
		);
		const createJson = (await createRes.json()) as any;
		expect(createRes.status).toBe(200);
		expect(createJson.success).toBe(true);
		testStudentId = createJson.data.id;

		// Tambah penerima fee sharing untuk menguji bukti transfer fee sharing
		const [rec] = await db
			.insert(feeShareRecipients)
			.values({
				studentId: testStudentId,
				namaReferral: "Guru BK Test",
				kategori: "Sekolah",
				nominalFee: 500000,
			})
			.returning();
		testRecipientId = rec.id;
	});

	afterAll(async () => {
		// Cleanup menyeluruh agar DB & disk bersih
		if (backupOutputDir && existsSync(backupOutputDir)) {
			await rm(backupOutputDir, { recursive: true, force: true });
		}
		if (backupJobId) {
			await db.delete(backupJobs).where(eq(backupJobs.id, backupJobId));
		}
		if (testStudentId) {
			await db
				.delete(pmbDocuments)
				.where(eq(pmbDocuments.studentId, testStudentId));
			await db
				.delete(crmDocuments)
				.where(eq(crmDocuments.studentId, testStudentId));
			await db
				.delete(financeDocuments)
				.where(eq(financeDocuments.studentId, testStudentId));
			await db
				.delete(academicDocuments)
				.where(eq(academicDocuments.studentId, testStudentId));
			await db
				.delete(paDocuments)
				.where(eq(paDocuments.studentId, testStudentId));
			await db
				.delete(internshipDocuments)
				.where(eq(internshipDocuments.studentId, testStudentId));
			await db
				.delete(postInternshipDocs)
				.where(eq(postInternshipDocs.studentId, testStudentId));
			await db
				.delete(departureAssessments)
				.where(eq(departureAssessments.studentId, testStudentId));
			await db
				.delete(feeShareRecipients)
				.where(eq(feeShareRecipients.studentId, testStudentId));
			await db
				.delete(finalDecision)
				.where(eq(finalDecision.studentId, testStudentId));
		}
		for (const fid of uploadedFileIds) {
			try {
				await fileService.deleteFile(fid);
			} catch {}
		}
		if (testStudentId) {
			// Delete files referencing studentId & student row via core delete
			const studentFiles = await db.query.files.findMany({
				where: eq(files.studentId, testStudentId),
			});
			for (const sf of studentFiles) {
				try {
					await fileService.deleteFile(sf.id);
				} catch {}
			}
			await db.delete(files).where(eq(files.studentId, testStudentId));
			await app.handle(
				new Request(`http://localhost:3001/students/${testStudentId}`, {
					method: "DELETE",
					headers: { Authorization: `Bearer ${superToken}` },
				}),
			);
		}
	});

	it("mengupload dokumen di setiap panel & tab lalu membackup semuanya tanpa ada yang terlewat", async () => {
		const uploadPanelDoc = async (
			panel: string,
			documentKey: string,
			fileNameTag: string,
		) => {
			const fd = new FormData();
			fd.append("documentKey", documentKey);
			fd.append("file", createMockPdf(fileNameTag));
			const res = await app.handle(
				new Request(
					`http://localhost:3001/students/${testStudentId}/${panel}/documents`,
					{
						method: "POST",
						headers: { Authorization: `Bearer ${superToken}` },
						body: fd,
					},
				),
			);
			const json = (await res.json()) as any;
			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
		};

		// Upload lintas seluruh panel & tab
		await uploadPanelDoc("pmb", "ktp", "scan_ktp_mhs");
		await uploadPanelDoc("crm", "ods_1_report", "laporan_ods_1");
		await uploadPanelDoc("crm", "tri_dharma_report", "laporan_tridharma");
		await uploadPanelDoc("finance", "registrasi", "bukti_reg");
		await uploadPanelDoc("akademik", "khs", "khs_sem1");
		await uploadPanelDoc("pa", "counseling", "catatan_konseling_pa");
		await uploadPanelDoc("magang", "sl21", "surat_sl21");
		await uploadPanelDoc(
			"magang",
			"surat_ahli_waris",
			"surat_ahli_waris_keluarga",
		);
		await uploadPanelDoc("magang", "suhan", "izin_suhan_taiwan");
		await uploadPanelDoc("post-internship", "logbook", "logbook_harian");

		// Upload Asesmen Keberangkatan (dulu terlewat karena Bun.write ke uploads/)
		const depFd = new FormData();
		depFd.append("file", createMockPdf("asesmen_keberangkatan_resmi"));
		const depRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${testStudentId}/departure-assessment/upload`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${superToken}` },
					body: depFd,
				},
			),
		);
		const depJson = (await depRes.json()) as any;
		expect(depRes.status).toBe(200);
		expect(depJson.success).toBe(true);
		expect(depJson.data.resultFileUrl).toMatch(/^\/files\/.+\/download$/);

		// Upload SK Direktur
		const skFd = new FormData();
		skFd.append("file", createMockPdf("sk_direktur_kelulusan"));
		const skRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${testStudentId}/final-decision/sk-upload`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${superToken}` },
					body: skFd,
				},
			),
		);
		const skJson = (await skRes.json()) as any;
		expect(skRes.status).toBe(200);
		expect(skJson.success).toBe(true);

		// Upload Bukti Transfer Fee Sharing (dulu terlewat karena studentId null)
		if (testRecipientId) {
			const feeFd = new FormData();
			feeFd.append("file", createMockPdf("bukti_tf_fee_sharing"));
			const feeRes = await app.handle(
				new Request(
					`http://localhost:3001/finance/fee-sharing/recipients/${testRecipientId}/upload-proof`,
					{
						method: "POST",
						headers: { Authorization: `Bearer ${superToken}` },
						body: feeFd,
					},
				),
			);
			const feeJson = (await feeRes.json()) as any;
			expect(feeRes.status).toBe(200);
			expect(feeJson.success).toBe(true);
		}

		// Jalankan backup per mahasiswa langsung via BackupService (teruji deterministik tanpa menunggu polling worker)
		backupJobId = ulid();
		await db.insert(backupJobs).values({
			id: backupJobId,
			type: "student",
			status: "queued",
			filters: { studentId: testStudentId, nim: testNim },
			createdBy: superUserId,
		});

		await backupService.executeBackup(backupJobId, "student", {
			studentId: testStudentId,
			nim: testNim,
		});

		const jobRow = await db.query.backupJobs.findFirst({
			where: eq(backupJobs.id, backupJobId),
		});
		expect(jobRow?.status).toBe("completed");
		expect(jobRow?.outputPath).toBeTruthy();
		backupOutputDir = jobRow!.outputPath!;

		// Total expected: 1 profile_photo + 10 panel docs + 1 departure_assessment + 1 sk_direktur + 1 fee_transfer = 14 files!
		expect(jobRow?.totalFiles).toBe(14);

		// Baca & validasi manifest.json dan keberadaan setiap file fisik di folder backup
		const manifestRaw = await readFile(
			join(backupOutputDir, "manifest.json"),
			"utf-8",
		);
		const manifest = JSON.parse(manifestRaw);
		expect(manifest.total_files).toBe(14);
		expect(manifest.files.length).toBe(14);

		const paths: string[] = manifest.files.map((f: any) => f.path);
		const expectedFolderPrefix = `students/${testNim}_Ahmad_Test_Backup_Lengkap`;

		// Verifikasi penamaan folder per panel & tab serta penamaan file jelas
		expect(
			paths.some((p) =>
				p.startsWith(`${expectedFolderPrefix}/01_PMB/Foto_Profil/Foto_Profil`),
			),
		).toBe(true);
		expect(
			paths.some((p) =>
				p.startsWith(
					`${expectedFolderPrefix}/01_PMB/Checklist_Dokumen/Scan_eKTP`,
				),
			),
		).toBe(true);
		expect(
			paths.some((p) =>
				p.startsWith(`${expectedFolderPrefix}/02_CRM/ODS/Laporan_ODS_1`),
			),
		).toBe(true);
		expect(
			paths.some((p) =>
				p.startsWith(
					`${expectedFolderPrefix}/02_CRM/Tri_Dharma/Laporan_Tri_Dharma`,
				),
			),
		).toBe(true);
		expect(
			paths.some((p) =>
				p.startsWith(
					`${expectedFolderPrefix}/03_Finance/Pembayaran_Utama/Bukti_Bayar_Registrasi`,
				),
			),
		).toBe(true);
		expect(
			paths.some((p) =>
				p.startsWith(`${expectedFolderPrefix}/03_Finance/Fee_Sharing/`),
			),
		).toBe(true);
		expect(
			paths.some((p) =>
				p.startsWith(
					`${expectedFolderPrefix}/04_Akademik/Asesmen_Keberangkatan/Hasil_Asesmen_Keberangkatan`,
				),
			),
		).toBe(true);
		expect(
			paths.some((p) =>
				p.startsWith(
					`${expectedFolderPrefix}/04_Akademik/SK_Direktur/SK_Direktur_Kelulusan`,
				),
			),
		).toBe(true);
		expect(
			paths.some((p) =>
				p.startsWith(
					`${expectedFolderPrefix}/05_PA/Bimbingan_PA/Bukti_Konseling_PA`,
				),
			),
		).toBe(true);
		expect(
			paths.some((p) =>
				p.startsWith(
					`${expectedFolderPrefix}/06_Magang/01_Pra_Paspor/Surat_Usia_SL21_HongTa`,
				),
			),
		).toBe(true);
		expect(
			paths.some((p) =>
				p.startsWith(
					`${expectedFolderPrefix}/06_Magang/02_Penempatan_dan_Ahli_Waris/Surat_Pernyataan_Ahli_Waris`,
				),
			),
		).toBe(true);
		expect(
			paths.some((p) =>
				p.startsWith(
					`${expectedFolderPrefix}/06_Magang/03_Dokumen_Keberangkatan/Dokumen_Suhan`,
				),
			),
		).toBe(true);
		expect(
			paths.some((p) =>
				p.startsWith(
					`${expectedFolderPrefix}/06_Magang/05_Syarat_Akhir_Kepulangan/Logbook_Harian_Magang`,
				),
			),
		).toBe(true);

		// Pastikan setiap file di manifest benar-benar ada secara fisik di outputDir
		for (const f of manifest.files) {
			const fullPath = join(backupOutputDir, f.path);
			expect(existsSync(fullPath)).toBe(true);
		}

		// Verifikasi endpoint GET /backups/stats
		const statsRes = await app.handle(
			new Request("http://localhost:3001/backups/stats", {
				headers: { Authorization: `Bearer ${superToken}` },
			}),
		);
		expect(statsRes.status).toBe(200);
		const statsJson = (await statsRes.json()) as any;
		expect(statsJson.success).toBe(true);
		expect(statsJson.data.totalBackupSize).toBeGreaterThan(0);

		// Verifikasi endpoint streaming download ZIP (GET /backups/:id/download)
		const dlRes = await app.handle(
			new Request(`http://localhost:3001/backups/${backupJobId}/download`, {
				headers: { Authorization: `Bearer ${superToken}` },
			}),
		);
		expect(dlRes.status).toBe(200);
		expect(dlRes.headers.get("Content-Type")).toBe("application/zip");
		expect(dlRes.headers.get("Content-Disposition")).toContain(
			`Backup_Mahasiswa_${testNim}`,
		);
		const zipBuf = Buffer.from(await dlRes.arrayBuffer());
		// Signature magic bytes ZIP file: "PK" (0x50, 0x4B)
		expect(zipBuf[0]).toBe(0x50);
		expect(zipBuf[1]).toBe(0x4b);
		expect(zipBuf.length).toBeGreaterThan(500);
	}, 30000);
});
