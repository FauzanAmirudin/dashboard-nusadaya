import { describe, expect, it } from "bun:test";
import {
	buildAkademikChecklist,
	calculateCrmChecklist,
	calculateFinanceChecklist,
	calculateInternshipDokumenChecklist,
	calculatePaChecklist,
	calculatePmbChecklist,
	calculatePraPasporChecklist,
	canEditPa,
	canGivePmbAcc,
	canMakeFinalDecision,
	checkPembiasaanEligible,
	getAgencyPaymentReminders,
	getAgencyPaymentTermsSummary,
	getAkademikStatus,
	getFinancePaymentStatus,
	getGpaGrade,
	getInternshipAccRequirements,
	getKeputusanConfig,
	getMagangDashboardChecklist,
	getMagangDashboardStatus,
	getMagangPrerequisites,
	getPenempatanLabel,
	isTaiwanDestination,
	updateCrmField,
} from "../../utils/panel-logic";
import { calculateOverallStatus } from "../../utils/status";
import {
	createAkademikWebUser,
	createCrmWebUser,
	createFinanceWebUser,
	createSuperadminWebUser,
} from "../helpers/mockStore";

describe("Tahap 3 — Panel Business Logic", () => {
	// ============================================================
	// PANEL: CRM (Tasks 3.1 & 3.2)
	// ============================================================
	describe("Panel CRM (CrmPanel)", () => {
		describe("Task 3.1 — CRM Checklist Completion Count", () => {
			it("should return completedCount = 12 when all 12 indicators are true", () => {
				const fullCrm = {
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
				};
				const result = calculateCrmChecklist(fullCrm);
				expect(result.completedCount).toBe(12);
				expect(result.totalChecks).toBe(12);
				expect(result.isAllChecksDone).toBe(true);
			});

			it("should return completedCount = 0 when no indicators are active", () => {
				const emptyCrm = {};
				const result = calculateCrmChecklist(emptyCrm);
				expect(result.completedCount).toBe(0);
				expect(result.isAllChecksDone).toBe(false);
			});

			it("should return completedCount = 1 when only isMonitoringParent is true", () => {
				const crm = { isMonitoringParent: true };
				const result = calculateCrmChecklist(crm);
				expect(result.completedCount).toBe(1);
				expect(result.isAllChecksDone).toBe(false);
			});

			it("should count ODS from odsDetails[n].isDone fallback when isOdsNReport is false", () => {
				const crm = {
					isOds1Report: false,
					odsDetails: [{ isDone: true }, { isDone: false }],
				};
				const result = calculateCrmChecklist(crm);
				expect(result.completedCount).toBe(1);
			});

			it("should not double-count when both isOds1Report and odsDetails[0].isDone are true", () => {
				const crm = {
					isOds1Report: true,
					odsDetails: [{ isDone: true }],
				};
				const result = calculateCrmChecklist(crm);
				expect(result.completedCount).toBe(1);
			});

			it("should correctly calculate partial completion of 5 items", () => {
				const crm = {
					isMonitoringParent: true,
					isMonitoringIndustry: true,
					isVocabComplete: true,
					practiceAttendance: true,
					isPrammagangReport: true,
				};
				const result = calculateCrmChecklist(crm);
				expect(result.completedCount).toBe(5);
				expect(result.isAllChecksDone).toBe(false);
			});
		});

		describe("Task 3.2 — CRM handleUpdateCrmField()", () => {
			it("should immutably update existing field without altering other fields", () => {
				const prevState = {
					crm: { isMonitoringParent: false, isVocabComplete: true },
					logs: ["log1"],
				};
				const nextState = updateCrmField(prevState, "isMonitoringParent", true);
				expect(nextState.crm.isMonitoringParent).toBe(true);
				expect(nextState.crm.isVocabComplete).toBe(true);
				expect(prevState.crm.isMonitoringParent).toBe(false); // Immutability test
			});

			it("should add a new field if it did not exist before", () => {
				const prevState: { crm: Record<string, any>; logs: any[] } = {
					crm: { notes: "test" },
					logs: [],
				};
				const nextState = updateCrmField(prevState, "isOds1Report", true);
				expect(nextState.crm.isOds1Report).toBe(true);
				expect(nextState.crm.notes).toBe("test");
			});

			it("should return null/unchanged if state is null without crashing", () => {
				const result = updateCrmField(null, "isMonitoringParent", true);
				expect(result).toBeNull();
			});

			it("should set field value to false and not delete it when false is provided", () => {
				const prevState = { crm: { isMonitoringParent: true }, logs: [] };
				const nextState = updateCrmField(
					prevState,
					"isMonitoringParent",
					false,
				);
				expect(nextState.crm.isMonitoringParent).toBe(false);
				expect("isMonitoringParent" in nextState.crm).toBe(true);
			});
		});
	});

	// ============================================================
	// PANEL: PMB (Tasks 3.3 & 3.4)
	// ============================================================
	describe("Panel PMB (PmbPanel)", () => {
		describe("Task 3.3 — PMB Checklist Completion Count (14 Item Wajib Pendaftaran)", () => {
			it("should count mainCompletedCount = 4 (Berkas Lengkap tidak dihitung lagi)", () => {
				const pmbData = {
					formReceived: true,
					documentsComplete: true,
					dataInputted: true,
					initialFollowUp: true,
					pasFoto: true,
				};
				const result = calculatePmbChecklist(pmbData);
				expect(result.mainCompletedCount).toBe(4);
				expect(result.requiredDocsCompletedCount).toBe(0);
				expect(result.totalRequiredCompleted).toBe(4);
				expect(result.isAllChecklistDone).toBe(false);
			});

			it("should count requiredDocsCompletedCount = 9 when all 9 required registration docs are true", () => {
				const pmbData = {
					docKtp: true,
					docKk: true,
					docCv: true,
					docIjazah: true,
					docTranskrip: true,
					docPassportDepan: true,
					docSkbm: true,
					docPreMcu: true,
					docSla: true,
					// Berkas berikut opsional di PMB dan dikelola di Magang
					docPassportVisa: false,
					docMcu: false,
					docSertifikasiBahasa: false,
				};
				const result = calculatePmbChecklist(pmbData);
				expect(result.requiredDocsCompletedCount).toBe(9);
				expect(result.mainCompletedCount).toBe(0);
				expect(result.totalRequiredCompleted).toBe(9);
				expect(result.isAllChecklistDone).toBe(false);
			});

			it("should return 13/13 and isAllChecklistDone = true when all 13 mandatory items are complete without passport visa, MCU full, or language cert", () => {
				const completePmb = {
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
					// Opsional (tidak memblokir kelulusan ACC PMB)
					docPassportVisa: false,
					docMcu: false,
					docSertifikasiBahasa: false,
					docBpjs: false,
				};
				const result = calculatePmbChecklist(completePmb);
				expect(result.totalRequiredCompleted).toBe(13);
				expect(result.isAllChecklistDone).toBe(true);
			});

			it("should return isAllChecklistDone = false when only 12 of 13 are done", () => {
				const almostCompletePmb = {
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
					docSla: false, // 1 wajib kurang
				};
				const result = calculatePmbChecklist(almostCompletePmb);
				expect(result.totalRequiredCompleted).toBe(12);
				expect(result.isAllChecklistDone).toBe(false);
			});

			it("should return totalRequiredCompleted14 = 0 for empty data", () => {
				expect(calculatePmbChecklist({}).totalRequiredCompleted14).toBe(0);
			});

			it("should handle null or undefined pmbData safely without crash", () => {
				const resNull = calculatePmbChecklist(null);
				expect(resNull.totalRequiredCompleted14).toBe(0);
				expect(resNull.isAllChecklistDone).toBe(false);

				const resUndef = calculatePmbChecklist(undefined);
				expect(resUndef.totalRequiredCompleted14).toBe(0);
			});
		});

		describe("Task 3.4 — PMB isAllChecklistDone ACC Gate (14 Indikator Baru)", () => {
			it("should allow ACC when 14/14 mandatory items are completed even if visa, MCU full, and language cert are empty", () => {
				const completePmb = {
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
					// Opsional
					docPassportVisa: false,
					docMcu: false,
					docSertifikasiBahasa: false,
				};
				expect(canGivePmbAcc(completePmb)).toBe(true);
			});

			it("should disable ACC when 13/14 mandatory items are completed", () => {
				const missingOne = {
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
					docSla: false,
				};
				expect(canGivePmbAcc(missingOne)).toBe(false);
			});

			it("should disable ACC when 0/14 items are completed", () => {
				expect(canGivePmbAcc({})).toBe(false);
			});
		});
	});

	// ============================================================
	// PANEL: FINANCE (Tasks 3.5 & 3.6)
	// ============================================================
	describe("Panel Finance (FinancePanel)", () => {
		describe("Task 3.5 — Finance Checklist Metode Pembayaran Talangan vs Mandiri", () => {
			it("should identify isTalangan = true for metodePembayaran = 'dana_talangan'", () => {
				const fin = { metodePembayaran: "dana_talangan" };
				expect(getFinancePaymentStatus(fin).isTalangan).toBe(true);
			});

			it("should identify isTalangan = false for metodePembayaran = 'mandiri'", () => {
				const fin = { metodePembayaran: "mandiri" };
				expect(getFinancePaymentStatus(fin).isTalangan).toBe(false);
			});

			it("should use t1SemesterStatus OR mandiriSemesterStatus when talangan", () => {
				const fin1 = {
					metodePembayaran: "dana_talangan",
					t1SemesterStatus: true,
					mandiriSemesterStatus: false,
				};
				expect(getFinancePaymentStatus(fin1).isSemesterDone).toBe(true);

				const fin2 = {
					metodePembayaran: "dana_talangan",
					t1SemesterStatus: false,
					mandiriSemesterStatus: true,
				};
				expect(getFinancePaymentStatus(fin2).isSemesterDone).toBe(true);
			});

			it("should only use mandiriSemesterStatus when mandiri", () => {
				const fin = {
					metodePembayaran: "mandiri",
					t1SemesterStatus: true,
					mandiriSemesterStatus: false,
				};
				expect(getFinancePaymentStatus(fin).isSemesterDone).toBe(false);
			});

			it("should resolve isInterviewDone correctly for talangan and mandiri", () => {
				const talangan = {
					metodePembayaran: "dana_talangan",
					t1InterviewStatus: true,
					mandiriInterviewStatus: false,
				};
				expect(getFinancePaymentStatus(talangan).isInterviewDone).toBe(true);

				const mandiri = {
					metodePembayaran: "mandiri",
					t1InterviewStatus: true,
					mandiriInterviewStatus: false,
				};
				expect(getFinancePaymentStatus(mandiri).isInterviewDone).toBe(false);
			});

			it("should resolve isKeberangkatanDone correctly for talangan and mandiri", () => {
				const talangan = {
					metodePembayaran: "dana_talangan",
					t2KeberangkatanStatus: true,
					mandiriKeberangkatanStatus: false,
				};
				expect(getFinancePaymentStatus(talangan).isKeberangkatanDone).toBe(
					true,
				);

				const mandiri = {
					metodePembayaran: "mandiri",
					t2KeberangkatanStatus: true,
					mandiriKeberangkatanStatus: false,
				};
				expect(getFinancePaymentStatus(mandiri).isKeberangkatanDone).toBe(
					false,
				);
			});
		});

		describe("Task 3.6 — Finance Checklist Completion Count (6 Item)", () => {
			it("should return completedCount = 6 and isFinanceReady = true when all 6 items are paid", () => {
				const fullFin = {
					registrasiStatus: true,
					metodePembayaran: "mandiri",
					mandiriSemesterStatus: true,
					mandiriInterviewStatus: true,
					mandiriKeberangkatanStatus: true,
					toeicStatus: true,
					pasporStatus: true,
				};
				const res = calculateFinanceChecklist(fullFin);
				expect(res.completedCount).toBe(6);
				expect(res.isFinanceReady).toBe(true);
			});

			it("should return isFinanceReady = false when registrasi is unpaid", () => {
				const fin = {
					registrasiStatus: false,
					metodePembayaran: "mandiri",
					mandiriSemesterStatus: true,
					mandiriInterviewStatus: true,
					mandiriKeberangkatanStatus: true,
					toeicStatus: true,
					pasporStatus: true,
				};
				const res = calculateFinanceChecklist(fin);
				expect(res.isFinanceReady).toBe(false);
				expect(res.completedCount).toBe(5);
			});

			it("should count 4 when only TOEIC and paspor are unpaid", () => {
				const fin = {
					registrasiStatus: true,
					metodePembayaran: "mandiri",
					mandiriSemesterStatus: true,
					mandiriInterviewStatus: true,
					mandiriKeberangkatanStatus: true,
					toeicStatus: false,
					pasporStatus: false,
				};
				const res = calculateFinanceChecklist(fin);
				expect(res.completedCount).toBe(4);
				expect(res.isFinanceReady).toBe(false);
			});

			it("should return 0 when nothing is paid", () => {
				const res = calculateFinanceChecklist({});
				expect(res.completedCount).toBe(0);
				expect(res.isFinanceReady).toBe(false);
			});

			it("should handle null finState safely", () => {
				const res = calculateFinanceChecklist(null);
				expect(res.completedCount).toBe(0);
				expect(res.isFinanceReady).toBe(false);
			});

			it("FIN-02: should format official names for 4 termin baku in calculateFinanceChecklist", () => {
				const fin = {
					registrasiStatus: true,
					metodePembayaran: "mandiri",
					mandiriSemesterStatus: true,
					kontrakMagangStatus: true,
					suhanStatus: true,
					mandiriKeberangkatanStatus: true,
					toeicStatus: true,
					pasporStatus: true,
				};
				const resTaiwan = calculateFinanceChecklist(fin, "Taiwan");
				expect(resTaiwan.items[1].name).toBe("Pembayaran SPP Semester 1");
				expect(resTaiwan.items[2].name).toBe("Kontrak Magang / Suhan");
				expect(resTaiwan.items[3].name).toBe(
					"Penempatan Magang Taiwan / Keberangkatan",
				);
				expect(resTaiwan.completedCount).toBe(6);

				const resMalaysia = calculateFinanceChecklist(fin, "Malaysia");
				expect(resMalaysia.items[3].name).toBe(
					"Penempatan Magang D3 Malaysia / Keberangkatan",
				);
			});

			it("FIN-02: getPenempatanLabel returns dynamic labels based on country", () => {
				expect(getPenempatanLabel("Taiwan-Hospitality")).toBe(
					"Penempatan Magang Taiwan / Keberangkatan",
				);
				expect(getPenempatanLabel("Malaysia-Hospitality")).toBe(
					"Penempatan Magang D3 Malaysia / Keberangkatan",
				);
			});

			it("FIN-02: getFinancePaymentStatus recognizes kontrakMagangStatus and suhanStatus", () => {
				const finKontrak = {
					metodePembayaran: "mandiri",
					kontrakMagangStatus: true,
				};
				expect(getFinancePaymentStatus(finKontrak).isInterviewDone).toBe(true);

				const finSuhan = {
					metodePembayaran: "mandiri",
					suhanStatus: true,
				};
				expect(getFinancePaymentStatus(finSuhan).isInterviewDone).toBe(true);
			});

			it("FIN-02: Tracking Sisa Tagihan SPP Semester 1 calculates balance, percentage and status accurately", () => {
				const sem1TotalBilled = 10200000;
				const installments = [
					{
						id: 1,
						nominalPaid: 1700000,
						installmentMonth: "Cicilan Bulan Agustus",
					},
					{
						id: 2,
						nominalPaid: 1700000,
						installmentMonth: "Cicilan Bulan September",
					},
				];

				const totalPaid = installments.reduce(
					(sum, i) => sum + i.nominalPaid,
					0,
				);
				const remaining = Math.max(0, sem1TotalBilled - totalPaid);
				const pct = Math.round((totalPaid / sem1TotalBilled) * 100);

				expect(totalPaid).toBe(3400000);
				expect(remaining).toBe(6800000);
				expect(pct).toBe(33);

				const getStatus = (paid: number, billed: number) => {
					if (paid >= billed && billed > 0) return "Lunas";
					if (paid > 0) return "Sebagian";
					return "Belum Bayar";
				};

				expect(getStatus(totalPaid, sem1TotalBilled)).toBe("Sebagian");
				expect(getStatus(0, sem1TotalBilled)).toBe("Belum Bayar");
				expect(getStatus(10200000, sem1TotalBilled)).toBe("Lunas");
			});
		});
	});

	// ============================================================
	// PANEL: AKADEMIK (Tasks 3.7, 3.8, & 3.9)
	// ============================================================
	describe("Panel Akademik (AkademikPanel)", () => {
		describe("Task 3.7 — Akademik Checklist Base vs Taiwan Cohort", () => {
			it("should return 8 base items when taiwanCohort is false", () => {
				const checklist = buildAkademikChecklist({ taiwanCohort: false });
				expect(checklist).toHaveLength(8);
			});

			it("should include the PA item as part of Akademik progress", () => {
				const checklist = buildAkademikChecklist({ taiwanCohort: false });
				expect(checklist.some((i) => i.id === "paCompleted")).toBe(true);
			});

			it("should return 20 items (8 base + 12 Taiwan) when taiwanCohort is true", () => {
				const checklist = buildAkademikChecklist({ taiwanCohort: true });
				expect(checklist).toHaveLength(20);
			});

			it("should force-disable taiwanLoaChecked if taiwanLolChecked is false", () => {
				const checklist = buildAkademikChecklist({
					taiwanCohort: true,
					taiwanLolChecked: false,
				});
				const loaItem = checklist.find((i) => i.id === "taiwanLoaChecked");
				expect(loaItem?.forceDisabled).toBe(true);
			});

			it("should enable taiwanLoaChecked once taiwanLolChecked is true", () => {
				const checklist = buildAkademikChecklist({
					taiwanCohort: true,
					taiwanLolChecked: true,
				});
				const loaItem = checklist.find((i) => i.id === "taiwanLoaChecked");
				expect(loaItem?.forceDisabled).toBe(false);
			});

			it("should force-disable taiwanSuhhanChecked if taiwanLoaChecked is false", () => {
				const checklist = buildAkademikChecklist({
					taiwanCohort: true,
					taiwanLolChecked: true,
					taiwanLoaChecked: false,
				});
				const suhhanItem = checklist.find(
					(i) => i.id === "taiwanSuhhanChecked",
				);
				expect(suhhanItem?.forceDisabled).toBe(true);
			});
		});

		describe("Task 3.8 — Akademik getGpaGrade()", () => {
			it("should return 'A' for GPA 3.70 (370 scaled)", () => {
				expect(getGpaGrade(370)).toBe("A");
			});

			it("should return 'B+' for GPA 3.50 (350 scaled)", () => {
				expect(getGpaGrade(350)).toBe("B+");
			});

			it("should return 'B' for GPA 3.10 (310 scaled)", () => {
				expect(getGpaGrade(310)).toBe("B");
			});

			it("should return 'C+' for GPA 2.80 (280 scaled)", () => {
				expect(getGpaGrade(280)).toBe("C+");
			});

			it("should return 'C' for GPA 2.50 (250 scaled)", () => {
				expect(getGpaGrade(250)).toBe("C");
			});

			it("should return 'D' for GPA 1.50 (150 scaled)", () => {
				expect(getGpaGrade(150)).toBe("D");
			});

			it("should return 'D' for GPA 0", () => {
				expect(getGpaGrade(0)).toBe("D");
			});

			it("should return 'A' for perfect GPA 4.00 (400 scaled)", () => {
				expect(getGpaGrade(400)).toBe("A");
			});

			it("should correctly handle exact boundary 370 ('A') vs 369 ('B+')", () => {
				expect(getGpaGrade(370)).toBe("A");
				expect(getGpaGrade(369)).toBe("B+");
			});
		});

		describe("Task 3.9 — Akademik Status Badge Logic", () => {
			it("should return 'AMAN' when completedCount === totalCount", () => {
				expect(getAkademikStatus(7, 7)).toBe("AMAN");
				expect(getAkademikStatus(19, 19)).toBe("AMAN");
			});

			it("should return 'PERLU PERHATIAN' when completedCount >= floor(total / 2) but not 100%", () => {
				// 7 items: floor(7/2) = 3
				expect(getAkademikStatus(3, 7)).toBe("PERLU PERHATIAN");
				expect(getAkademikStatus(6, 7)).toBe("PERLU PERHATIAN");
			});

			it("should return 'TIDAK AMAN' when completedCount < floor(total / 2)", () => {
				// 7 items: < 3
				expect(getAkademikStatus(2, 7)).toBe("TIDAK AMAN");
				expect(getAkademikStatus(1, 7)).toBe("TIDAK AMAN");
			});

			it("should return 'TIDAK AMAN' when completedCount is 0", () => {
				expect(getAkademikStatus(0, 7)).toBe("TIDAK AMAN");
			});
		});
	});

	// ============================================================
	// PANEL: PA (Tasks 3.10 & 3.11)
	// ============================================================
	describe("Panel PA (PaPanel)", () => {
		describe("Task 3.10 — PA Checklist Completion Count (3 Item)", () => {
			it("should return completedCount = 3 and isAllChecksDone = true when all 3 items are done", () => {
				const paData = {
					counselingDone: true,
					mentalStable: true,
					disciplineGood: true,
				};
				const res = calculatePaChecklist(paData);
				expect(res.completedCount).toBe(3);
				expect(res.totalChecks).toBe(3);
				expect(res.isAllChecksDone).toBe(true);
			});

			it("should return completedCount = 1 and isAllChecksDone = false when only counseling is done", () => {
				const paData = { counselingDone: true };
				const res = calculatePaChecklist(paData);
				expect(res.completedCount).toBe(1);
				expect(res.isAllChecksDone).toBe(false);
			});

			it("should return completedCount = 0 when all items are false", () => {
				const res = calculatePaChecklist({});
				expect(res.completedCount).toBe(0);
				expect(res.isAllChecksDone).toBe(false);
			});

			it("should handle null paData safely", () => {
				const res = calculatePaChecklist(null);
				expect(res.completedCount).toBe(0);
				expect(res.isAllChecksDone).toBe(false);
			});
		});

		describe("Task 3.11 — PA Role Permission", () => {
			it("should allow edit for user with role 'pa'", () => {
				const paUser = { id: 1, username: "pa", role: "pa", roles: ["pa"] };
				expect(canEditPa(paUser)).toBe(true);
			});

			it("should allow edit for user with role 'akademik'", () => {
				const acadUser = createAkademikWebUser();
				expect(canEditPa(acadUser)).toBe(true);
			});

			it("should allow edit for user with role 'superadmin'", () => {
				const adminUser = createSuperadminWebUser();
				expect(canEditPa(adminUser)).toBe(true);
			});

			it("should deny edit for user with role 'crm'", () => {
				const crmUser = createCrmWebUser();
				expect(canEditPa(crmUser)).toBe(false);
			});

			it("should deny edit for user with role 'finance'", () => {
				const finUser = createFinanceWebUser();
				expect(canEditPa(finUser)).toBe(false);
			});

			it("should deny edit for unauthenticated (null) user", () => {
				expect(canEditPa(null)).toBe(false);
			});
		});
	});

	// ============================================================
	// PANEL: INTERNSHIP / MAGANG (Tasks 3.12 & 3.13)
	// ============================================================
	describe("Panel Internship (InternshipPanel)", () => {
		describe("Task 3.12 — Internship Pra-Paspor Checklist (16 Item)", () => {
			it("should return completedCount = 16 when all 16 items are true", () => {
				const all16Data = {
					praPasporPasFoto: true,
					praPasporKtm: true,
					praPasporKtp: true,
					praPasporKk: true,
					praPasporAktaKelahiran: true,
					praPasporSuratIzinOrtu: true,
					praPasporSl21: true,
					praPasporSkma: true,
					praPasporRekomendasiDisdik: true,
					praPasporKhs: true,
					praPasporKrs: true,
					praPasporTranskrip: true,
					praPasporIjazah: true,
					praPasporGapYear: true,
					praPasporBukuRekening: true,
					praPasporSertifikatBahasa: true,
				};
				const res = calculatePraPasporChecklist(all16Data);
				expect(res.completedCount).toBe(16);
				expect(res.totalCount).toBe(16);
			});

			it("should return completedCount = 0 when no items are true", () => {
				const res = calculatePraPasporChecklist({});
				expect(res.completedCount).toBe(0);
				expect(res.totalCount).toBe(16);
			});

			it("should return completedCount = 10 for partial 10 items", () => {
				const partialData = {
					praPasporPasFoto: true,
					praPasporKtm: true,
					praPasporKtp: true,
					praPasporKk: true,
					praPasporAktaKelahiran: true,
					praPasporSuratIzinOrtu: true,
					praPasporSl21: true,
					praPasporSkma: true,
					praPasporRekomendasiDisdik: true,
					praPasporKhs: true,
				};
				const res = calculatePraPasporChecklist(partialData);
				expect(res.completedCount).toBe(10);
			});

			it("should handle null internshipData safely without crash", () => {
				const res = calculatePraPasporChecklist(null);
				expect(res.completedCount).toBe(0);
				expect(res.totalCount).toBe(16);
			});
		});

		describe("Task 3.13 — Internship Main Flow Checklist", () => {
			it("should count passportReady when true", () => {
				const res = calculateInternshipDokumenChecklist({
					passportReady: true,
				});
				expect(res.completedCount).toBe(1);
			});

			it("should count interviewReady when true", () => {
				const res = calculateInternshipDokumenChecklist({
					interviewReady: true,
				});
				expect(res.completedCount).toBe(1);
			});

			it("should count suhanReady when true", () => {
				const res = calculateInternshipDokumenChecklist(
					{ suhanReady: true },
					"Taiwan",
				);
				expect(res.completedCount).toBe(1);
			});

			it("should count mouReady when true", () => {
				const res = calculateInternshipDokumenChecklist({ mouReady: true });
				expect(res.completedCount).toBe(1);
			});

			it("should count loaConfirmed when true", () => {
				const res = calculateInternshipDokumenChecklist({
					loaConfirmed: true,
				});
				expect(res.completedCount).toBe(1);
			});

			it("should count visaReady and ticketReady when true", () => {
				const res = calculateInternshipDokumenChecklist({
					visaReady: true,
					ticketReady: true,
				});
				expect(res.completedCount).toBe(2);
			});

			it("should return isInternshipReady = true when all main flow items are done", () => {
				const allReady = {
					passportReady: true,
					interviewReady: true,
					mouReady: true,
					loaConfirmed: true,
					contractReady: true,
					suhanReady: true,
					mcuReady: true,
					visaReady: true,
					ticketReady: true,
					asesmenReady: true,
					dokumentasiReady: true,
					agenReady: true,
					asuransiBtnBpjsReady: true,
					asuransiPenempatanReady: true,
					ahliWarisReady: true,
				};
				const res = calculateInternshipDokumenChecklist(allReady, "Taiwan");
				expect(res.isInternshipReady).toBe(true);
				expect(res.completedCount).toBe(15);

				// Non-Taiwan: Suhan tidak dihitung (14 item)
				const nonTaiwan = calculateInternshipDokumenChecklist(
					{ ...allReady, suhanReady: false },
					"Indonesia",
				);
				expect(nonTaiwan.totalCount).toBe(14);
				expect(nonTaiwan.isInternshipReady).toBe(true);
			});
		});
	});

	describe("Panel Magang — syarat ACC (cermin server)", () => {
		const allDone = (gap = false) => ({
			praPasporPasFoto: true,
			praPasporKtm: true,
			praPasporKtp: true,
			praPasporKk: true,
			praPasporAktaKelahiran: true,
			praPasporSuratIzinOrtu: true,
			praPasporSl21: true,
			praPasporLos: true,
			praPasporRekomendasiDisdik: true,
			praPasporKhs: true,
			praPasporKrs: true,
			praPasporTranskrip: true,
			praPasporIjazah: true,
			...(gap ? { praPasporGapYear: true } : {}),
			passportReady: true,
			interviewReady: true,
			moaReady: true,
			loaConfirmed: true,
			contractReady: true,
			suhanReady: true,
			mcuReady: true,
			visaReady: true,
			ticketReady: true,
			pdtReady: true,
			dokumentasiReady: true,
			agenReady: true,
			asuransiBtnBpjsReady: true,
			asuransiPenempatanReady: true,
			ahliWarisReady: true,
			logbookReady: true,
			laporanAkhirReady: true,
			videoDokumentasiReady: true,
		});

		it("counts 13 + 15 = 28 pre-departure items, keeps syaratAkhir non-blocking, and accepts LOS in place of SKMA", () => {
			const r = getInternshipAccRequirements(allDone(), false, "Taiwan");
			expect(r.praPaspor).toEqual({ done: 13, total: 13, ok: true });
			expect(r.dokumen.total).toBe(15);
			expect(r.syaratAkhir).toEqual({ done: 3, total: 3, ok: true });
			expect(r.total).toBe(28);
			expect(r.ok).toBe(true);

			const preDepartureOnly = {
				...allDone(),
				logbookReady: false,
				laporanAkhirReady: false,
				videoDokumentasiReady: false,
			};
			const rPre = getInternshipAccRequirements(
				preDepartureOnly,
				false,
				"Taiwan",
			);
			expect(rPre.syaratAkhir).toEqual({ done: 0, total: 3, ok: false });
			expect(rPre.ok).toBe(true);
		});

		it("adds Gap Year item only for gap-year students", () => {
			const r = getInternshipAccRequirements(allDone(), true, "Taiwan");
			expect(r.praPaspor.total).toBe(14);
			expect(r.ok).toBe(false);
			expect(
				getInternshipAccRequirements(allDone(true), true, "Taiwan").ok,
			).toBe(true);
		});

		it("tidak mewajibkan Suhan untuk tujuan non-Taiwan", () => {
			const data = { ...allDone(), suhanReady: false };
			expect(getInternshipAccRequirements(data, false, "Taiwan").ok).toBe(
				false,
			);
			const nonTaiwan = getInternshipAccRequirements(data, false, "Indonesia");
			expect(nonTaiwan.dokumen.total).toBe(14);
			expect(nonTaiwan.ok).toBe(true);
		});

		it("mewajibkan asuransi BTN BPJS TK, asuransi penempatan, dan ahli waris untuk ACC", () => {
			expect(
				getInternshipAccRequirements(
					{ ...allDone(), asuransiBtnBpjsReady: false },
					false,
					"Taiwan",
				).ok,
			).toBe(false);
			expect(
				getInternshipAccRequirements(
					{ ...allDone(), asuransiPenempatanReady: false },
					false,
					"Taiwan",
				).ok,
			).toBe(false);
			expect(
				getInternshipAccRequirements(
					{ ...allDone(), ahliWarisReady: false },
					false,
					"Taiwan",
				).ok,
			).toBe(false);
		});

		it("ignores languageCertReady (not an ACC requirement)", () => {
			const r = getInternshipAccRequirements({ languageCertReady: true });
			expect(r.completed).toBe(0);
			expect(r.ok).toBe(false);
		});
	});

	describe("Perbaikan uji E2E (T-02, T-04, T-11, T-16)", () => {
		it("T-16: pembiasaan 0/0 sesi atau di bawah 80% tidak boleh disetujui", () => {
			const zero = checkPembiasaanEligible([
				{ label: "Piket", total: 0, rate: 0 },
				{ label: "ODS", total: 5, rate: 100 },
			]);
			expect(zero.ok).toBe(false);
			expect(zero.blockers[0]).toContain("Piket");

			const low = checkPembiasaanEligible([
				{ label: "Baris Pagi", total: 10, rate: 70 },
			]);
			expect(low.ok).toBe(false);
			expect(low.blockers[0]).toContain("70%");

			expect(
				checkPembiasaanEligible([{ label: "ODS", total: 5, rate: 80 }]).ok,
			).toBe(true);
		});

		it("T-02: pos 'Tidak berlaku' tidak dihitung sebagai syarat ACC", () => {
			const fin = {
				metodePembayaran: "mandiri",
				registrasiStatus: true,
				mandiriSemesterStatus: true,
				mandiriInterviewStatus: true,
				mandiriKeberangkatanStatus: true,
				toeicStatus: false,
				pasporStatus: false,
			};
			const before = calculateFinanceChecklist(fin);
			expect(before.totalChecks).toBe(6);
			expect(before.isFinanceReady).toBe(false);

			const after = calculateFinanceChecklist({
				...fin,
				tidakBerlakuItems: [
					{ key: "toeic", note: "Peminatan Indonesia" },
					{ key: "paspor", note: "Tanpa paspor" },
				],
			});
			expect(after.totalChecks).toBe(4);
			expect(after.isFinanceReady).toBe(true);
			expect(after.items.find((i) => i.key === "toeic")?.notApplicable).toBe(
				true,
			);
		});

		it("T-04: label penempatan mengikuti negara tujuan", () => {
			expect(getPenempatanLabel("Taiwan")).toContain("Taiwan");
			expect(getPenempatanLabel("Malaysia")).toContain("Malaysia");
			expect(getPenempatanLabel("Indonesia")).toContain("Indonesia");
			expect(getPenempatanLabel("Timur Tengah")).toContain("Timur Tengah");
			// Tanpa negara dikenali: tidak lagi otomatis "Taiwan"
			expect(getPenempatanLabel(null)).not.toContain("Taiwan");
			expect(isTaiwanDestination("taiwan batch 1")).toBe(true);
			expect(isTaiwanDestination("Indonesia")).toBe(false);
		});

		it("T-11: progres CRM satu sumber, 12 indikator", () => {
			const r = calculateCrmChecklist({
				isMonitoringParent: true,
				odsDetails: JSON.stringify([{ isDone: true }]),
			});
			expect(r.totalChecks).toBe(12);
			expect(r.items).toHaveLength(12);
			expect(r.completedCount).toBe(2);
			expect(r.items.map((i) => i.name)).toContain("Video Konten Bulanan");
		});
	});

	describe("Prasyarat Panel Magang (cermin server)", () => {
		const accAll = {
			pmb: { isAcc: true },
			crm: { isAcc: true },
			academic: { isAcc: true },
		};

		it("lolos bila ACC PMB/CRM/Akademik + registrasi & SPP Sem 1 (mandiri) lunas", () => {
			const r = getMagangPrerequisites({
				...accAll,
				finance: {
					metodePembayaran: "mandiri",
					registrasiStatus: true,
					mandiriSemesterStatus: true,
				},
			});
			expect(r.ok).toBe(true);
			expect(r.missing).toEqual([]);
		});

		it("tidak mewajibkan termin keberangkatan / ACC Finance", () => {
			const r = getMagangPrerequisites({
				...accAll,
				finance: {
					isAcc: false,
					registrasiStatus: true,
					mandiriSemesterStatus: true,
					mandiriKeberangkatanStatus: false,
				},
			});
			expect(r.ok).toBe(true);
		});

		it("talangan 1 tahap: SPP Sem 1 dianggap tercakup talangan", () => {
			const r = getMagangPrerequisites({
				...accAll,
				finance: {
					metodePembayaran: "dana_talangan",
					talanganTipe: "1_tahap",
					registrasiStatus: true,
				},
			});
			expect(r.ok).toBe(true);
		});

		it("menyebut syarat yang belum terpenuhi", () => {
			const r = getMagangPrerequisites({
				pmb: { isAcc: true },
				crm: { isAcc: false },
				academic: null,
				finance: { metodePembayaran: "dana_talangan", talanganTipe: "2_tahap" },
			});
			expect(r.ok).toBe(false);
			expect(r.missing).toEqual([
				"ACC CRM",
				"ACC Akademik",
				"Registrasi lunas",
				"SPP Semester 1 lunas",
			]);
		});
	});

	describe("Pengingat termin agensi", () => {
		it("tidak ada pengingat sebelum Suhan/Visa terbit", () => {
			expect(getAgencyPaymentReminders({})).toEqual([]);
		});
		it("DP diingatkan setelah Suhan (Taiwan), hilang setelah dibayar", () => {
			expect(
				getAgencyPaymentReminders({ suhanReady: true }, "Taiwan").map(
					(r) => r.key,
				),
			).toEqual(["dp"]);
			expect(
				getAgencyPaymentReminders(
					{ suhanReady: true, agenDpPaid: true },
					"Taiwan",
				),
			).toEqual([]);
		});

		it("non-Taiwan: DP memakai acuan kontrak magang, bukan Suhan", () => {
			expect(
				getAgencyPaymentReminders({ suhanReady: true }, "Indonesia"),
			).toEqual([]);
			expect(
				getAgencyPaymentReminders({ contractReady: true }, "Indonesia").map(
					(r) => r.key,
				),
			).toEqual(["dp"]);
		});
		it("pelunasan diingatkan setelah Visa terbit", () => {
			expect(
				getAgencyPaymentReminders(
					{ suhanReady: true, agenDpPaid: true, visaReady: true },
					"Taiwan",
				).map((r) => r.key),
			).toEqual(["pelunasan"]);
		});

		it("getAgencyPaymentTermsSummary mengembalikan ringkasan DP & Pelunasan beserta nominal dan tanggal", () => {
			const terms = getAgencyPaymentTermsSummary(
				{
					suhanReady: true,
					agenDpPaid: true,
					agenDpNominal: 5000000,
					agenDpDate: "2026-11-10T00:00:00.000Z",
					visaReady: true,
					agenPelunasanPaid: false,
					agenPelunasanNominal: 12000000,
				},
				"Taiwan",
			);
			expect(terms).toHaveLength(2);
			expect(terms[0]).toMatchObject({
				key: "dp",
				triggerLabel: "Suhan terbit",
				triggerReady: true,
				paid: true,
				isOverdue: false,
				nominal: 5000000,
			});
			expect(terms[1]).toMatchObject({
				key: "pelunasan",
				triggerLabel: "Visa terbit",
				triggerReady: true,
				paid: false,
				isOverdue: true,
				nominal: 12000000,
				paidDate: null,
			});
		});

		it("getAgencyPaymentTermsSummary memakai pemicu kontrak magang untuk non-Taiwan dan mengabaikan nominal <= 0", () => {
			const terms = getAgencyPaymentTermsSummary(
				{
					contractReady: true,
					agenDpNominal: 0,
				},
				"Jepang",
			);
			expect(terms[0]).toMatchObject({
				key: "dp",
				triggerLabel: "Kontrak magang selesai",
				triggerReady: true,
				isOverdue: true,
				nominal: null,
			});
		});
	});

	describe("Dashboard Magang — status tunggal", () => {
		it("returns BUTUH_PERHATIAN for empty internship", () => {
			expect(getMagangDashboardChecklist(null).completed).toBe(0);
			expect(getMagangDashboardStatus(null)).toBe("BUTUH_PERHATIAN");
		});

		it("returns PROSES above 30% and AMAN when all 6 done", () => {
			expect(
				getMagangDashboardStatus({ passportReady: true, mcuReady: true }),
			).toBe("PROSES");
			const all = {
				passportReady: true,
				loaConfirmed: true,
				suhanReady: true,
				mcuReady: true,
				visaReady: true,
				pdtReady: true,
			};
			expect(getMagangDashboardChecklist(all, "Taiwan").completed).toBe(6);
			expect(getMagangDashboardStatus(all, "Taiwan")).toBe("AMAN");
		});

		it("returns ACC when isAcc regardless of checklist", () => {
			expect(getMagangDashboardStatus({ isAcc: true })).toBe("ACC");
		});
	});

	// ============================================================
	// PANEL: STATUS OVERVIEW & FINAL DECISION (Tasks 3.14, 3.15, & 3.16)
	// ============================================================
	describe("Panel Status Overview & Final Decision", () => {
		describe("Task 3.14 — Status Panel Overall Status Aggregation", () => {
			it("should return overall 'ACC' when all panels are ACC", () => {
				const panels = [
					{ status: "ACC", isAcc: true },
					{ status: "ACC", isAcc: true },
					{ status: "ACC", isAcc: true },
				];
				expect(calculateOverallStatus(panels)).toBe("ACC");
			});

			it("should return overall 'BUTUH_PERHATIAN' if any panel is BUTUH_PERHATIAN", () => {
				const panels = [
					{ status: "ACC", isAcc: true },
					{ status: "BUTUH_PERHATIAN", isAcc: false },
					{ status: "PROSES", isAcc: false },
				];
				expect(calculateOverallStatus(panels)).toBe("BUTUH_PERHATIAN");
			});

			it("should return overall 'PROSES' when one panel is PROSES and the rest are ACC", () => {
				const panels = [
					{ status: "ACC", isAcc: true },
					{ status: "PROSES", isAcc: false },
					{ status: "ACC", isAcc: true },
				];
				expect(calculateOverallStatus(panels)).toBe("PROSES");
			});

			it("should return overall 'AMAN' when all panels are AMAN", () => {
				const panels = ["AMAN", "AMAN", "AMAN"];
				expect(calculateOverallStatus(panels)).toBe("AMAN");
			});

			it("should return overall 'AMAN' for mixture of AMAN and ACC", () => {
				const panels = [
					{ status: "AMAN", isAcc: false },
					{ status: "ACC", isAcc: true },
				];
				expect(calculateOverallStatus(panels)).toBe("AMAN");
			});
		});

		describe("Task 3.15 — Final Decision Keputusan Config Mapping", () => {
			it("should map 'menunggu' to label 'Menunggu Evaluasi' and color 'slate'", () => {
				const conf = getKeputusanConfig("menunggu");
				expect(conf.label).toBe("Menunggu Evaluasi");
				expect(conf.color).toBe("slate");
			});

			it("should map 'lanjut_interview' with label containing 'Interview'", () => {
				const conf = getKeputusanConfig("lanjut_interview");
				expect(conf.label).toContain("Interview");
			});

			it("should map 'ttd_kontrak' with label containing 'Kontrak'", () => {
				const conf = getKeputusanConfig("ttd_kontrak");
				expect(conf.label).toContain("Kontrak");
			});

			it("should map 'layak_berangkat' with label containing 'Berangkat'", () => {
				const conf = getKeputusanConfig("layak_berangkat");
				expect(conf.label).toContain("Berangkat");
			});

			it("should map 'remedial' with label containing 'Remedial'", () => {
				const conf = getKeputusanConfig("remedial");
				expect(conf.label).toContain("Remedial");
			});

			it("should fallback to 'menunggu' when null, undefined, or unknown", () => {
				expect(getKeputusanConfig(null).label).toBe("Menunggu Evaluasi");
				expect(getKeputusanConfig(undefined).label).toBe("Menunggu Evaluasi");
				expect(getKeputusanConfig("unknown_value").label).toBe(
					"Menunggu Evaluasi",
				);
			});
		});

		describe("Task 3.16 — Final Decision ACC Gate dari Semua Panel", () => {
			it("should allow final decision when all core panels have isAcc = true", () => {
				const panels = {
					pmbAcc: { isAcc: true },
					crmAcc: { isAcc: true },
					financeAcc: { isAcc: true },
					academicAcc: { isAcc: true },
					internshipAcc: { isAcc: true },
				};
				expect(canMakeFinalDecision(panels)).toBe(true);
			});

			it("should block final decision if any core panel is not ACC", () => {
				const panels = {
					pmbAcc: { isAcc: true },
					crmAcc: { isAcc: true },
					financeAcc: { isAcc: false }, // not ACC
					academicAcc: { isAcc: true },
					internshipAcc: { isAcc: true },
				};
				expect(canMakeFinalDecision(panels)).toBe(false);
			});

			it("should ignore Dosen & PA: both sit under Akademik", () => {
				const panels = {
					pmbAcc: { isAcc: true },
					crmAcc: { isAcc: true },
					financeAcc: { isAcc: true },
					academicAcc: { isAcc: true },
					internshipAcc: { isAcc: true },
				};
				expect(canMakeFinalDecision(panels)).toBe(true);
			});
		});
	});
});
