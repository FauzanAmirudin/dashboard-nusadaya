import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../../db";
import {
	academicAttitudeLogs,
	academicData,
	academicDocuments,
	auditLogs,
	counselingLogs,
	courseGradeDocuments,
	courseGrades,
	crmData,
	crmDocuments,
	crmLogs,
	entrepreneurshipRecords,
	feeShareRecipients,
	finalDecision,
	financeData,
	financeDocuments,
	internalNotes,
	type internshipData,
	internshipDocuments,
	paData,
	paDocuments,
	paInterviewLogs,
	paTripartiteLogs,
	pmbData,
	pmbDocuments,
	pmbFeeDisbursements,
	pmbPaymentPlan,
	postInternshipDocs,
	students,
	users,
	vocabLogs,
	weeklyEvents,
} from "../../db/schema";
import {
	invalidateMagangCaches,
	recalculateInternshipStatus,
	syncPmbIdentityToMagang,
	upsertInternshipFlags,
} from "../../lib/magang-sync";
import { hasRole } from "../../lib/permissions";
import { fileService } from "../../modules/file/service/file.service";
import { invalidateCrmCaches } from "./crm";
import { invalidateFinanceCaches } from "./finance";
import { invalidatePmbCache } from "./pmb";

const AGENCY_PAYMENT_DOC_KEYS = ["agen_dp", "agen_pelunasan"];

export const documentsRoutes = new Elysia()
	.get("/:id/:panel/documents", async (context) => {
		const { params, set } = context;
		const studentId = Number(params.id);
		const panel = params.panel as string;

		set.headers["cache-control"] = "no-store, no-cache, must-revalidate";

		let table: any;
		switch (panel) {
			case "pmb":
				table = pmbDocuments;
				break;
			case "crm":
				table = crmDocuments;
				break;
			case "finance":
				table = financeDocuments;
				break;
			case "akademik":
				table = academicDocuments;
				break;
			case "pa":
				table = paDocuments;
				break;
			case "magang":
				table = internshipDocuments;
				break;
			case "post-internship":
				table = postInternshipDocs;
				break;
			default:
				return { success: false, message: "Invalid panel" };
		}

		const docs = await db
			.select()
			.from(table)
			.where(eq(table.studentId, studentId));
		return { success: true, data: docs };
	})
	.post(
		"/:id/:panel/documents",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const studentId = Number(params.id);
			const panel = params.panel as string;
			const documentKey = (body as any).documentKey;
			const file = (body as any).file as File;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			if (
				AGENCY_PAYMENT_DOC_KEYS.includes(documentKey) &&
				!hasRole(user, "finance", "superadmin")
			) {
				set.status = 403;
				return {
					success: false,
					message: "Bukti pembayaran agensi hanya dapat diunggah oleh Finance",
				};
			}

			if (
				file?.type !== "application/pdf" &&
				!file?.name?.toLowerCase().endsWith(".pdf")
			) {
				set.status = 400;
				return {
					success: false,
					message:
						"Seluruh dokumen keuangan dan administrasi wajib berformat PDF sesuai standar sistem",
				};
			}
			if (file.size > 5 * 1024 * 1024) {
				set.status = 400;
				return { success: false, message: "Ukuran file maksimal 5MB" };
			}

			let table: any;
			switch (panel) {
				case "pmb":
					table = pmbDocuments;
					break;
				case "crm":
					table = crmDocuments;
					break;
				case "finance":
					table = financeDocuments;
					break;
				case "akademik":
					table = academicDocuments;
					break;
				case "pa":
					table = paDocuments;
					break;
				case "magang":
					table = internshipDocuments;
					break;
				case "post-internship":
					table = postInternshipDocs;
					break;
				default:
					set.status = 400;
					return { success: false, message: "Invalid panel" };
			}

			// === Guard untuk role mahasiswa ===
			if (user && user.role === "mahasiswa" && !hasRole(user, "superadmin")) {
				// Mahasiswa hanya bisa upload ke data miliknya sendiri
				const studentRow = await db.query.students.findFirst({
					where: eq(students.id, studentId),
					columns: { studentUserId: true },
				});
				if (!studentRow || studentRow.studentUserId !== user.id) {
					set.status = 403;
					return {
						success: false,
						message: "Anda tidak diizinkan mengunggah dokumen mahasiswa lain",
					};
				}
				// Mahasiswa diizinkan upload ke panel CRM (dokumen tertentu) atau panel post-internship (3 berkas kepulangan)
				if (panel === "post-internship") {
					const postAllowedKeys = [
						"logbook",
						"laporan_akhir",
						"video_portofolio",
					];
					if (!postAllowedKeys.includes(documentKey)) {
						set.status = 403;
						return {
							success: false,
							message: "Jenis berkas kepulangan tidak valid",
						};
					}
				} else if (panel !== "crm") {
					set.status = 403;
					return {
						success: false,
						message:
							"Anda hanya diizinkan mengunggah dokumen CRM atau berkas kepulangan magang",
					};
				}

				if (panel === "crm") {
					const crmAllowedKeys = [
						"ods_1_report",
						"ods_2_report",
						"ods_3_report",
						"ods_4_report",
						"ods_5_report",
						"ods_report",
						"ods_1",
						"ods_2",
						"ods_3",
						"ods_4",
						"ods_5",
						"ods_documentation",
						"pramagang_report",
						"pramagang",
						"pramagang_documentation",
						"tri_dharma_report",
						"tri_dharma_pkm_report",
						"tri_dharma_penelitian_report",
						"tri_dharma_documentation",
					];
					const isAllowedKey =
						crmAllowedKeys.includes(documentKey) ||
						documentKey.startsWith("tri_dharma");
					if (!isAllowedKey) {
						set.status = 403;
						return {
							success: false,
							message: "Jenis dokumen tidak diizinkan untuk diupload mahasiswa",
						};
					}

					const currentCrm = await db.query.crmData.findFirst({
						where: eq(crmData.studentId, studentId),
					});
					if (currentCrm?.isAcc) {
						set.status = 403;
						return {
							success: false,
							message:
								"Panel CRM telah disetujui resmi (ACC). Dokumen tidak dapat diunggah.",
						};
					}
				}
			}

			// Upload file via FileService — tidak boleh akses filesystem langsung
			let uploadResult: { id: string; storagePath: string } | null = null;
			try {
				uploadResult = await fileService.uploadFile({
					file,
					studentId,
					category: panel,
					panel,
					documentKey,
					uploadedBy: user.id,
				});
			} catch (err) {
				const error = err as Error;
				set.status = 400;
				return { success: false, message: error.message };
			}

			const fileUrl = `/files/${uploadResult.id}/download`;
			const originalName = file.name;

			// Allow multiple files per documentKey by NOT deleting the old ones

			await db.insert(table).values({
				studentId,
				documentKey,
				fileName: originalName,
				fileUrl,
				fileSize: file.size,
				mimeType: file.type,
				uploadedBy: user.id,
			});

			// Jika panel finance: simpan bukti bayar, dan tandai LUNAS hanya bila
			// nominal tagihannya > 0. Dulu unggah bukti selalu menandai "Lunas"
			// walau nominal Rp 0, sehingga pos tanpa tagihan ikut terhitung lunas.
			if (panel === "finance") {
				const financeDocMap: Record<
					string,
					{
						status: string;
						url: string;
						paidDate?: string;
						nominal: string;
					}
				> = {
					registrasi: {
						status: "registrasiStatus",
						url: "registrasiBuktiBayarUrl",
						paidDate: "registrasiPaidDate",
						nominal: "registrasiNominal",
					},
					mandiri_interview: {
						status: "mandiriInterviewStatus",
						url: "mandiriInterviewBuktiBayarUrl",
						paidDate: "mandiriInterviewPaidDate",
						nominal: "mandiriInterviewNominal",
					},
					mandiri_kontrak_magang: {
						status: "kontrakMagangStatus",
						url: "kontrakMagangBuktiBayarUrl",
						paidDate: "kontrakMagangPaidDate",
						nominal: "mandiriInterviewNominal",
					},
					kontrak_magang: {
						status: "kontrakMagangStatus",
						url: "kontrakMagangBuktiBayarUrl",
						paidDate: "kontrakMagangPaidDate",
						nominal: "mandiriInterviewNominal",
					},
					mandiri_suhan: {
						status: "suhanStatus",
						url: "suhanBuktiBayarUrl",
						paidDate: "suhanPaidDate",
						nominal: "mandiriInterviewNominal",
					},
					suhan: {
						status: "suhanStatus",
						url: "suhanBuktiBayarUrl",
						paidDate: "suhanPaidDate",
						nominal: "mandiriInterviewNominal",
					},
					t1_interview: {
						status: "t1InterviewStatus",
						url: "t1InterviewBuktiBayarUrl",
						paidDate: "t1InterviewPaidDate",
						nominal: "t1InterviewNominal",
					},
					mandiri_keberangkatan: {
						status: "mandiriKeberangkatanStatus",
						url: "mandiriKeberangkatanBuktiBayarUrl",
						paidDate: "mandiriKeberangkatanPaidDate",
						nominal: "mandiriKeberangkatanNominal",
					},
					penempatan_keberangkatan: {
						status: "mandiriKeberangkatanStatus",
						url: "mandiriKeberangkatanBuktiBayarUrl",
						paidDate: "mandiriKeberangkatanPaidDate",
						nominal: "mandiriKeberangkatanNominal",
					},
					t2_keberangkatan: {
						status: "t2KeberangkatanStatus",
						url: "t2KeberangkatanBuktiBayarUrl",
						paidDate: "t2KeberangkatanPaidDate",
						nominal: "t2KeberangkatanNominal",
					},
					admin_talangan: {
						status: "adminTalaganStatus",
						url: "adminTalaganBuktiBayarUrl",
						nominal: "adminTalaganNominal",
					},
					toeic: {
						status: "toeicStatus",
						url: "toeicBuktiBayarUrl",
						nominal: "toeicNominal",
					},
					paspor: {
						status: "pasporStatus",
						url: "pasporBuktiBayarUrl",
						nominal: "pasporNominal",
					},
					rumah_juang: {
						status: "rumahJuangStatus",
						url: "rumahJuangBuktiBayarUrl",
						nominal: "rumahJuangNominal",
					},
				};

				const mapping = financeDocMap[documentKey];
				if (mapping) {
					const finRow = await db.query.financeData.findFirst({
						where: eq(financeData.studentId, studentId),
					});
					const nominal = Number(
						(finRow as Record<string, unknown> | undefined)?.[
							mapping.nominal
						] ?? 0,
					);
					const isBilled = nominal > 0;
					const update: Record<string, unknown> = {
						[mapping.url]: fileUrl,
						updatedAt: new Date(),
					};
					if (isBilled) {
						update[mapping.status] = true;
						if (mapping.paidDate) update[mapping.paidDate] = new Date();
					}
					await db
						.update(financeData)
						.set(update)
						.where(eq(financeData.studentId, studentId));
				}

				await invalidateFinanceCaches(studentId);
			}

			// Jika panel crm, update flag checklist & odsDetails terkait
			if (panel === "crm") {
				const crmUpdate: Record<string, any> = { updatedAt: new Date() };

				const odsIndexMap: Record<string, number> = {
					ods_1_report: 0,
					ods_1: 0,
					ods_report: 0,
					ods_2_report: 1,
					ods_2: 1,
					ods_3_report: 2,
					ods_3: 2,
					ods_4_report: 3,
					ods_4: 3,
					ods_5_report: 4,
					ods_5: 4,
				};

				// Unggah laporan ODS TIDAK lagi langsung menandai sesi selesai:
				// sesi baru selesai bila tanggal & nama industri juga terisi
				// (divalidasi saat simpan odsDetails di routes/student/crm.ts).
				if (documentKey === "pramagang_report" || documentKey === "pramagang") {
					crmUpdate.isPrammagangReport = true;
				} else if (documentKey.startsWith("tri_dharma")) {
					crmUpdate.isTriDharma = true;
				}

				const currentCrm = await db.query.crmData.findFirst({
					where: eq(crmData.studentId, studentId),
				});

				let odsList: any[] = [];
				if (currentCrm?.odsDetails) {
					try {
						odsList =
							typeof currentCrm.odsDetails === "string"
								? JSON.parse(currentCrm.odsDetails)
								: (currentCrm.odsDetails as any[]);
						if (!Array.isArray(odsList)) odsList = [];
					} catch {
						odsList = [];
					}
				}
				while (odsList.length < 5) {
					odsList.push({ date: "", industry: "", isDone: false });
				}

				if (odsIndexMap[documentKey] !== undefined) {
					const idx = odsIndexMap[documentKey];
					const row = odsList[idx] || {};
					// Selesai hanya bila tanggal & nama industri sudah terisi
					const isDone =
						Boolean(row.date) && String(row.industry ?? "").trim() !== "";
					odsList[idx] = { ...row, hasReport: true, isDone };
					crmUpdate.odsDetails = odsList;
					crmUpdate[`isOds${idx + 1}Report`] = isDone;
				}

				if (currentCrm) {
					await db
						.update(crmData)
						.set(crmUpdate)
						.where(eq(crmData.studentId, studentId));
				} else {
					await db.insert(crmData).values({
						studentId,
						...crmUpdate,
					});
				}

				await invalidateCrmCaches(studentId);
			}

			// Jika panel pmb, update field checklist terkait & invalidate cache
			if (panel === "pmb") {
				const pmbDocFieldMap: Record<string, string> = {
					pas_foto: "pasFoto",
					ktp: "docKtp",
					kk: "docKk",
					cv: "docCv",
					ijazah: "docIjazah",
					transkrip: "docTranskrip",
					passport_depan: "docPassportDepan",
					passport_visa: "docPassportVisa",
					skbm: "docSkbm",
					pre_mcu: "docPreMcu",
					mcu: "docMcu",
					bpjs: "docBpjs",
					sla: "docSla",
					sertifikasi_bahasa: "docSertifikasiBahasa",
					form_received: "formReceived",
					documents_complete: "documentsComplete",
					data_inputted: "dataInputted",
					initial_follow_up: "initialFollowUp",
				};

				const fieldToUpdate = pmbDocFieldMap[documentKey];
				if (fieldToUpdate) {
					await db
						.update(pmbData)
						.set({
							[fieldToUpdate]: true,
							updatedAt: new Date(),
						} as any)
						.where(eq(pmbData.studentId, studentId));
				}

				if (["pas_foto", "ktp", "kk", "ijazah"].includes(documentKey)) {
					await syncPmbIdentityToMagang(studentId);
				}

				await invalidatePmbCache(studentId);
			}

			// Jika panel magang: otomatis centang checklist yang sesuai dengan dokumen PDF yang diunggah
			if (panel === "magang") {
				const magangDocFieldMap: Record<
					string,
					Partial<typeof internshipData.$inferInsert>
				> = {
					pas_foto: { praPasporPasFoto: true },
					ktm: { praPasporKtm: true },
					ktp: { praPasporKtp: true },
					kk: { praPasporKk: true },
					akta_kelahiran: { praPasporAktaKelahiran: true },
					surat_izin_ortu: { praPasporSuratIzinOrtu: true },
					sl21: { praPasporSl21: true },
					gap_year: { praPasporGapYear: true },
					los: { praPasporSkma: true, praPasporLos: true },
					skma: { praPasporSkma: true, praPasporLos: true },
					rekomendasi_disdik: { praPasporRekomendasiDisdik: true },
					ijazah: { praPasporIjazah: true },
					khs: { praPasporKhs: true },
					krs: { praPasporKrs: true },
					transkrip: { praPasporTranskrip: true },
					passport: { passportReady: true },
					interview: { interviewReady: true },
					mou: { mouReady: true, moaReady: true },
					loa: { loaConfirmed: true },
					contract: { contractReady: true },
					suhan: { suhanReady: true },
					mcu: { mcuReady: true },
					visa: { visaReady: true },
					ticket: { ticketReady: true },
					dokumentasi_keberangkatan: { dokumentasiReady: true },
					mitra_agen: { agenReady: true },
					asuransi_btn_bpjs: { asuransiBtnBpjsReady: true },
					asuransi_penempatan: { asuransiPenempatanReady: true },
					surat_keterangan_ahli_waris: { ahliWarisReady: true },
					sertifikasi_bahasa: { languageCertReady: true },
				};

				const internshipUpdate: Partial<typeof internshipData.$inferInsert> = {
					...(magangDocFieldMap[documentKey] ?? {}),
				};

				if (
					documentKey === "asesmen_kompetensi" ||
					documentKey === "surat_pernyataan_keberangkatan"
				) {
					const studentInternDocs = await db
						.select({ documentKey: internshipDocuments.documentKey })
						.from(internshipDocuments)
						.where(eq(internshipDocuments.studentId, studentId));
					const keySet = new Set(studentInternDocs.map((d) => d.documentKey));
					if (documentKey === "surat_pernyataan_keberangkatan") {
						internshipUpdate.asesmenPernyataanReady = true;
					}
					if (
						keySet.has("asesmen_kompetensi") &&
						keySet.has("surat_pernyataan_keberangkatan")
					) {
						internshipUpdate.asesmenReady = true;
						internshipUpdate.pdtReady = true;
					}
				}

				if (Object.keys(internshipUpdate).length > 0) {
					await upsertInternshipFlags(studentId, internshipUpdate);
				} else {
					await recalculateInternshipStatus(studentId);
				}
			}

			// Jika panel post-internship: otomatis centang checklist syarat akhir saat berkas diunggah
			if (panel === "post-internship") {
				const postDocFieldMap: Record<
					string,
					Partial<typeof internshipData.$inferInsert>
				> = {
					logbook: { logbookReady: true },
					laporan_akhir: { laporanAkhirReady: true },
					video_portofolio: { videoDokumentasiReady: true },
				};

				const postUpdate = postDocFieldMap[documentKey];
				if (postUpdate) {
					await upsertInternshipFlags(studentId, postUpdate);
				}
			}

			return { success: true, message: "Dokumen berhasil diunggah", fileUrl };
		},
		{
			body: t.Object({
				documentKey: t.String(),
				file: t.File(),
			}),
		},
	)
	.delete("/:id/:panel/documents/:docId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const studentId = Number(params.id);
		const panel = params.panel as string;
		const docId = Number(params.docId);

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		let table: any;
		switch (panel) {
			case "pmb":
				table = pmbDocuments;
				break;
			case "crm":
				table = crmDocuments;
				break;
			case "finance":
				table = financeDocuments;
				break;
			case "akademik":
				table = academicDocuments;
				break;
			case "pa":
				table = paDocuments;
				break;
			case "magang":
				table = internshipDocuments;
				break;
			case "post-internship":
				table = postInternshipDocs;
				break;
			default:
				set.status = 400;
				return { success: false, message: "Invalid panel" };
		}

		const [targetDoc] = await db
			.select()
			.from(table)
			.where(and(eq(table.studentId, studentId), eq(table.id, docId)))
			.limit(1);

		if (
			targetDoc &&
			AGENCY_PAYMENT_DOC_KEYS.includes(targetDoc.documentKey) &&
			!hasRole(user, "finance", "superadmin")
		) {
			set.status = 403;
			return {
				success: false,
				message: "Bukti pembayaran agensi hanya dapat dihapus oleh Finance",
			};
		}

		// === Guard untuk role mahasiswa saat hapus dokumen ===
		if (user && user.role === "mahasiswa" && !hasRole(user, "superadmin")) {
			if (panel !== "crm" && panel !== "post-internship") {
				set.status = 403;
				return {
					success: false,
					message:
						"Mahasiswa hanya diizinkan menghapus dokumen CRM atau berkas kepulangan magang",
				};
			}
			// Verifikasi kepemilikan
			const studentRow = await db.query.students.findFirst({
				where: eq(students.id, studentId),
				columns: { studentUserId: true },
			});
			if (!studentRow || studentRow.studentUserId !== user.id) {
				set.status = 403;
				return {
					success: false,
					message: "Anda tidak diizinkan menghapus dokumen mahasiswa lain",
				};
			}
			// Cek apakah progress terkait sudah di-checklist (selesai)
			const docToCheck = await db.query.crmDocuments.findFirst({
				where: and(
					eq(crmDocuments.studentId, studentId),
					eq(crmDocuments.id, docId),
				),
			});
			if (docToCheck) {
				const crmRow = await db.query.crmData.findFirst({
					where: eq(crmData.studentId, studentId),
				});
				if (crmRow?.isAcc) {
					set.status = 403;
					return {
						success: false,
						message:
							"Panel CRM telah disetujui resmi (ACC). Dokumen tidak dapat dihapus.",
					};
				}
				const docKey = docToCheck.documentKey;
				// Map documentKey ke field checklist
				const odsKeyMap: Record<
					string,
					{ flagField: string; odsIndex: number }
				> = {
					ods_1_report: { flagField: "isOds1Report", odsIndex: 0 },
					ods_2_report: { flagField: "isOds2Report", odsIndex: 1 },
					ods_3_report: { flagField: "isOds3Report", odsIndex: 2 },
					ods_4_report: { flagField: "isOds4Report", odsIndex: 3 },
					ods_5_report: { flagField: "isOds5Report", odsIndex: 4 },
				};
				if (docKey === "pramagang_report") {
					if (crmRow?.isPrammagangReport) {
						set.status = 403;
						return {
							success: false,
							message:
								"Laporan Pra-Magang tidak dapat dihapus karena sudah dinyatakan selesai oleh tim CRM",
						};
					}
				} else if (odsKeyMap[docKey]) {
					const { flagField, odsIndex } = odsKeyMap[docKey];
					let odsList: any[] = [];
					if (crmRow?.odsDetails) {
						try {
							odsList =
								typeof crmRow.odsDetails === "string"
									? JSON.parse(crmRow.odsDetails)
									: (crmRow.odsDetails as any[]);
						} catch {}
					}
					const isChecked =
						Boolean((crmRow as any)?.[flagField]) ||
						Boolean(odsList[odsIndex]?.isDone);
					if (isChecked) {
						set.status = 403;
						return {
							success: false,
							message: `Laporan ODS ${odsIndex + 1} tidak dapat dihapus karena sudah dinyatakan selesai oleh tim CRM`,
						};
					}
				}
			}
		}

		let deletedCrmDocKey: string | null = null;
		let deletedPostDocKey: string | null = null;
		let deletedFileUrl: string | null = null;
		if (panel === "crm") {
			const existingDoc = await db.query.crmDocuments.findFirst({
				where: and(
					eq(crmDocuments.studentId, studentId),
					eq(crmDocuments.id, docId),
				),
			});
			if (existingDoc) {
				deletedCrmDocKey = existingDoc.documentKey;
				deletedFileUrl = existingDoc.fileUrl;
			}
		} else if (panel === "post-internship" && targetDoc) {
			deletedPostDocKey = targetDoc.documentKey;
			deletedFileUrl = targetDoc.fileUrl;
		}

		await db
			.delete(table)
			.where(and(eq(table.studentId, studentId), eq(table.id, docId)));

		if (deletedFileUrl) {
			const match = deletedFileUrl.match(/\/files\/([^/]+)\/download/);
			if (match?.[1]) {
				await fileService.deleteFile(match[1]).catch(() => {});
			}
		}

		if (panel === "crm" && deletedCrmDocKey) {
			const remainingDocs = await db.query.crmDocuments.findMany({
				where: and(
					eq(crmDocuments.studentId, studentId),
					eq(crmDocuments.documentKey, deletedCrmDocKey),
				),
			});
			if (remainingDocs.length === 0) {
				const flagMap: Record<string, string> = {
					ods_report: "isOds1Report",
					ods_1_report: "isOds1Report",
					ods_1: "isOds1Report",
					ods_2_report: "isOds2Report",
					ods_2: "isOds2Report",
					ods_3_report: "isOds3Report",
					ods_3: "isOds3Report",
					ods_4_report: "isOds4Report",
					ods_4: "isOds4Report",
					ods_5_report: "isOds5Report",
					ods_5: "isOds5Report",
					pramagang_report: "isPrammagangReport",
					tri_dharma_report: "isTriDharma",
					tri_dharma: "isTriDharma",
				};
				const crmUpdate: Record<string, any> = { updatedAt: new Date() };
				if (flagMap[deletedCrmDocKey]) {
					crmUpdate[flagMap[deletedCrmDocKey]] = false;
				}
				const odsIdxMap: Record<string, number> = {
					ods_1_report: 0,
					ods_1: 0,
					ods_report: 0,
					ods_2_report: 1,
					ods_2: 1,
					ods_3_report: 2,
					ods_3: 2,
					ods_4_report: 3,
					ods_4: 3,
					ods_5_report: 4,
					ods_5: 4,
				};
				if (odsIdxMap[deletedCrmDocKey] !== undefined) {
					const crmRow = await db.query.crmData.findFirst({
						where: eq(crmData.studentId, studentId),
					});
					let odsList: any[] = [];
					if (crmRow?.odsDetails) {
						try {
							odsList =
								typeof crmRow.odsDetails === "string"
									? JSON.parse(crmRow.odsDetails)
									: (crmRow.odsDetails as any[]);
							if (!Array.isArray(odsList)) odsList = [];
						} catch {}
					}
					const idx = odsIdxMap[deletedCrmDocKey];
					if (odsList[idx]) {
						odsList[idx] = { ...odsList[idx], isDone: false };
						crmUpdate.odsDetails = odsList;
					}
				}
				await db
					.update(crmData)
					.set(crmUpdate)
					.where(eq(crmData.studentId, studentId));
			}
		}

		if (panel === "finance") {
			await invalidateFinanceCaches(studentId);
		}

		if (panel === "crm") {
			await invalidateCrmCaches(studentId);
		}

		if (panel === "pmb") {
			await invalidatePmbCache(studentId);
		}

		if (panel === "post-internship") {
			if (deletedPostDocKey) {
				const remainingPostDocs = await db
					.select()
					.from(postInternshipDocs)
					.where(
						and(
							eq(postInternshipDocs.studentId, studentId),
							eq(postInternshipDocs.documentKey, deletedPostDocKey),
						),
					);
				const postFlagMap: Record<
					string,
					Partial<typeof internshipData.$inferInsert>
				> = {
					logbook: { logbookReady: false },
					laporan_akhir: { laporanAkhirReady: false },
					video_portofolio: { videoDokumentasiReady: false },
				};
				if (remainingPostDocs.length === 0 && postFlagMap[deletedPostDocKey]) {
					await upsertInternshipFlags(
						studentId,
						postFlagMap[deletedPostDocKey],
					);
				} else {
					await invalidateMagangCaches(studentId);
				}
			} else {
				await invalidateMagangCaches(studentId);
			}
		}

		return { success: true, message: "Dokumen berhasil dihapus" };
	})
	.patch(
		"/:id/final-decision/director-approval",
		async ({ params, body, set, user }: any) => {
			if (user?.role !== "superadmin") {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const studentId = parseInt(params.id, 10);

			// Verify final decision row exists
			let row = await db.query.finalDecision.findFirst({
				where: eq(finalDecision.studentId, studentId),
			});

			if (!row) {
				// Initialize it if it doesn't exist
				await db.insert(finalDecision).values({ studentId });
				row = await db.query.finalDecision.findFirst({
					where: eq(finalDecision.studentId, studentId),
				});
			}

			const student = await db.query.students.findFirst({
				where: eq(students.id, studentId),
			});

			// Validate if eligible (needs to be layak_berangkat AND overallStatus AMAN)
			if (body.isApproved) {
				if (row?.evaluatorDecision !== "layak_berangkat") {
					set.status = 400;
					return {
						success: false,
						message:
							"Mahasiswa belum dinyatakan layak berangkat oleh Evaluator",
					};
				}
				if (student?.overallStatus !== "AMAN") {
					set.status = 400;
					return {
						success: false,
						message:
							"Masih ada persyaratan divisi yang belum disetujui (TIDAK AMAN/PERLU PERHATIAN).",
					};
				}
			}

			const departureDate = body.departureDate
				? new Date(body.departureDate)
				: row?.departureDate;

			await db
				.update(finalDecision)
				.set({
					isApprovedByDirector: body.isApproved,
					departureDate: departureDate,
					notes: body.notes !== undefined ? body.notes : row?.notes,
					skDocumentUrl:
						body.skDocumentUrl !== undefined
							? body.skDocumentUrl
							: row?.skDocumentUrl,
					updatedAt: new Date(),
				})
				.where(eq(finalDecision.studentId, studentId));

			await db.insert(auditLogs).values({
				entity: "student",
				entityId: studentId,
				userId: user.id,
				action: body.isApproved
					? "director_approval_granted"
					: "director_approval_revoked",
				details: body,
			});

			return {
				success: true,
				message: "Persetujuan direktur berhasil diperbarui",
			};
		},
		{
			body: t.Object({
				isApproved: t.Boolean(),
				departureDate: t.Optional(t.String()),
				notes: t.Optional(t.String()),
				skDocumentUrl: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	);
