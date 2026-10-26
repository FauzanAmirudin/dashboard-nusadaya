import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	courseEnrollments,
	courseGrades,
	courseMeetingActivities,
	courseMeetingAttendances,
	courseMeetings,
	courses,
	practicesBudgetRequests,
	practicesMaterialReports,
	students,
	users,
} from "../db/schema";
import { cacheInvalidatePattern } from "../lib/cache";
import { getValidUserId, hasRole } from "../lib/permissions";
import {
	checkStudentScheduleConflict,
	getActiveAcademicTerm,
} from "../modules/academic/curriculum.service";
import { GradeCalculationService } from "../modules/academic/grade-calculation.service";

function addDays(baseDateStr: string, days: number): string {
	const d = new Date(baseDateStr + "T00:00:00Z");
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().split("T")[0];
}

const MONTH_NAMES_ID = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

async function computeDosenRekap({
	startDate,
	endDate,
	targetDosenId,
	cohort,
	periodLabel,
	periodType,
	periodDetails,
}: {
	startDate: string;
	endDate: string;
	targetDosenId?: number | null;
	cohort?: number | null;
	periodLabel: string;
	periodType: "bulanan" | "semester";
	periodDetails: Record<string, any>;
}) {
	// 1. Ambil semua mata kuliah yang aktif/ditugaskan (mendukung penambahan dinamis)
	const courseConditions = [];
	if (cohort) {
		courseConditions.push(eq(courses.cohort, cohort));
	}

	const allAssignedCourses = await db.query.courses.findMany({
		where: courseConditions.length > 0 ? and(...courseConditions) : undefined,
		with: {
			dosen: {
				columns: {
					id: true,
					fullName: true,
					username: true,
					email: true,
				},
			},
			dosenPendamping: {
				columns: {
					id: true,
					fullName: true,
					username: true,
					email: true,
				},
			},
		},
		orderBy: [asc(courses.code)],
	});

	// 2. Ambil data pertemuan pada rentang tanggal periode
	const meetingConditions = [
		sql`${courseMeetings.meetingDate} IS NOT NULL`,
		sql`${courseMeetings.meetingDate} >= ${startDate}`,
		sql`${courseMeetings.meetingDate} <= ${endDate}`,
	];

	const allMeetings = await db.query.courseMeetings.findMany({
		where: and(...meetingConditions),
		with: {
			course: {
				with: {
					dosen: {
						columns: {
							id: true,
							fullName: true,
							username: true,
							email: true,
						},
					},
					dosenPendamping: {
						columns: {
							id: true,
							fullName: true,
							username: true,
							email: true,
						},
					},
				},
			},
			dosenPengajar: {
				columns: {
					id: true,
					fullName: true,
					username: true,
					email: true,
				},
			},
		},
		orderBy: [
			asc(courseMeetings.meetingDate),
			asc(courseMeetings.meetingNumber),
		],
	});

	// Filter meetings by cohort if provided
	const filteredMeetings = cohort
		? allMeetings.filter((m) => m.course?.cohort === cohort)
		: allMeetings;

	type DosenCourseSummary = {
		courseId: number;
		courseCode: string;
		courseName: string;
		sks: number;
		rombel: string;
		cohort: number;
		roleDiMatkul: "Utama" | "Pendamping" | "Pengganti";
		totalSesi: number;
		sesiTeori: number;
		sesiPraktik: number;
		sesiSolo: number;
		sesiTeamTeaching: number;
		sesiDetail: Array<{
			meetingId: number;
			meetingNumber: number;
			meetingLabel: string;
			meetingDate: string;
			sessionType: string;
			teachingStatus: string;
			isTeamTeaching: boolean;
			partnerDosenName: string | null;
			teachingNotes: string | null;
		}>;
	};

	type DosenSummary = {
		dosenId: number;
		fullName: string;
		username: string;
		email: string | null;
		totalSesiMengajar: number;
		sesiTeori: number;
		sesiPraktik: number;
		sesiSolo: number;
		sesiTeamTeaching: number;
		totalJamEstimasi: number;
		mataKuliah: DosenCourseSummary[];
	};

	const dosenMap = new Map<
		number,
		{
			id: number;
			fullName: string;
			username: string;
			email: string | null;
		}
	>();

	const statsByDosen = new Map<number, DosenSummary>();

	// Helper function untuk mendaftarkan dosen & memastikan slot statistiknya ada
	const ensureDosen = (u: {
		id: number;
		fullName?: string | null;
		username: string;
		email?: string | null;
	}) => {
		const dId = u.id;
		if (targetDosenId && dId !== targetDosenId) return undefined;

		if (!dosenMap.has(dId)) {
			dosenMap.set(dId, {
				id: dId,
				fullName: u.fullName || u.username,
				username: u.username,
				email: u.email || null,
			});
		}

		let dStats = statsByDosen.get(dId);
		if (!dStats) {
			const info = dosenMap.get(dId)!;
			dStats = {
				dosenId: dId,
				fullName: info.fullName,
				username: info.username,
				email: info.email,
				totalSesiMengajar: 0,
				sesiTeori: 0,
				sesiPraktik: 0,
				sesiSolo: 0,
				sesiTeamTeaching: 0,
				totalJamEstimasi: 0,
				mataKuliah: [],
			};
			statsByDosen.set(dId, dStats);
		}
		return dStats;
	};

	// 3. Daftarkan SEMUA dosen yang sudah ditugaskan untuk mata kuliah
	//    (baik Dosen Utama maupun Dosen Pendamping / Team Teaching)
	for (const c of allAssignedCourses) {
		// Dosen Utama
		if (c.dosen) {
			const dStats = ensureDosen(c.dosen);
			if (dStats) {
				const exists = dStats.mataKuliah.some((mk) => mk.courseId === c.id);
				if (!exists) {
					dStats.mataKuliah.push({
						courseId: c.id,
						courseCode: c.code,
						courseName: c.name,
						sks: c.sks || 2,
						rombel: c.rombel || "Kelas A",
						cohort: c.cohort,
						roleDiMatkul: "Utama",
						totalSesi: 0,
						sesiTeori: 0,
						sesiPraktik: 0,
						sesiSolo: 0,
						sesiTeamTeaching: 0,
						sesiDetail: [],
					});
				}
			}
		}

		// Dosen Pendamping
		if (c.dosenPendamping) {
			const dStats = ensureDosen(c.dosenPendamping);
			if (dStats) {
				const exists = dStats.mataKuliah.some((mk) => mk.courseId === c.id);
				if (!exists) {
					dStats.mataKuliah.push({
						courseId: c.id,
						courseCode: c.code,
						courseName: c.name,
						sks: c.sks || 2,
						rombel: c.rombel || "Kelas A",
						cohort: c.cohort,
						roleDiMatkul: "Pendamping",
						totalSesi: 0,
						sesiTeori: 0,
						sesiPraktik: 0,
						sesiSolo: 0,
						sesiTeamTeaching: 0,
						sesiDetail: [],
					});
				}
			}
		}
	}

	// 4. Proses semua pertemuan yang terlaksana dalam periode yang dipilih
	let distinctMeetingsCount = 0;
	let distinctTeamTeachingMeetingsCount = 0;

	for (const m of filteredMeetings) {
		if (!m.course) continue;
		distinctMeetingsCount++;

		const attendedSet = new Set<number>();

		if (Array.isArray(m.attendedDosenIds) && m.attendedDosenIds.length > 0) {
			for (const id of m.attendedDosenIds) {
				if (typeof id === "number") attendedSet.add(id);
			}
		}

		if (m.dosenPengajarId) {
			attendedSet.add(m.dosenPengajarId);
		}

		if (m.isTeamTeachingAttended) {
			if (m.course.dosenId) attendedSet.add(m.course.dosenId);
			if (m.course.dosenPendampingId)
				attendedSet.add(m.course.dosenPendampingId);
		}

		// Fallback for unassigned meetings: default to primary lecturer
		if (attendedSet.size === 0) {
			if (m.course.dosenId) attendedSet.add(m.course.dosenId);
		}

		const isTeamTeaching =
			Boolean(m.isTeamTeachingAttended) || attendedSet.size > 1;
		if (isTeamTeaching) {
			distinctTeamTeachingMeetingsCount++;
		}

		const sessionType = (
			m.sessionType ||
			m.course.type ||
			"teori"
		).toLowerCase();
		const isPraktik = sessionType === "praktik";

		for (const dId of attendedSet) {
			if (targetDosenId && dId !== targetDosenId) continue;

			let dStats = statsByDosen.get(dId);
			if (!dStats) {
				const guestInfo =
					m.dosenPengajar && m.dosenPengajar.id === dId
						? m.dosenPengajar
						: m.course.dosen && m.course.dosen.id === dId
							? m.course.dosen
							: m.course.dosenPendamping && m.course.dosenPendamping.id === dId
								? m.course.dosenPendamping
								: {
										id: dId,
										fullName: `Dosen #${dId}`,
										username: `dosen_${dId}`,
										email: null,
									};
				dStats = ensureDosen(guestInfo);
				if (!dStats) continue;
			}

			dStats.totalSesiMengajar++;
			if (isPraktik) dStats.sesiPraktik++;
			else dStats.sesiTeori++;

			if (isTeamTeaching) dStats.sesiTeamTeaching++;
			else dStats.sesiSolo++;

			dStats.totalJamEstimasi += m.course.sks || 2;

			let partnerDosenName: string | null = null;
			if (isTeamTeaching) {
				const partnerIds = Array.from(attendedSet).filter((id) => id !== dId);
				if (partnerIds.length > 0) {
					partnerDosenName = partnerIds
						.map((pid) => dosenMap.get(pid)?.fullName || `Dosen #${pid}`)
						.join(", ");
				}
			}

			let cSummary = dStats.mataKuliah.find((c) => c.courseId === m.courseId);
			if (!cSummary) {
				cSummary = {
					courseId: m.courseId,
					courseCode: m.course.code,
					courseName: m.course.name,
					sks: m.course.sks || 2,
					rombel: m.course.rombel || "Kelas A",
					cohort: m.course.cohort,
					roleDiMatkul:
						m.course.dosenId === dId
							? "Utama"
							: m.course.dosenPendampingId === dId
								? "Pendamping"
								: "Pengganti",
					totalSesi: 0,
					sesiTeori: 0,
					sesiPraktik: 0,
					sesiSolo: 0,
					sesiTeamTeaching: 0,
					sesiDetail: [],
				};
				dStats.mataKuliah.push(cSummary);
			}

			cSummary.totalSesi++;
			if (isPraktik) cSummary.sesiPraktik++;
			else cSummary.sesiTeori++;

			if (isTeamTeaching) cSummary.sesiTeamTeaching++;
			else cSummary.sesiSolo++;

			cSummary.sesiDetail.push({
				meetingId: m.id,
				meetingNumber: m.meetingNumber,
				meetingLabel: m.meetingLabel,
				meetingDate: m.meetingDate ? String(m.meetingDate) : "",
				sessionType: m.sessionType || m.course.type,
				teachingStatus: m.teachingStatus || "terlaksana",
				isTeamTeaching: isTeamTeaching,
				partnerDosenName: partnerDosenName,
				teachingNotes: m.teachingNotes || null,
			});
		}
	}

	// 5. Susun daftar dosen:
	//    - Jika targetDosenId (dosen akses mandiri), filter untuk dosen itu saja.
	//    - Jika monitoring akademik, tampilkan SEMUA dosen yang sudah ditugaskan mata kuliah!
	let dosenList = Array.from(statsByDosen.values());
	if (targetDosenId) {
		dosenList = dosenList.filter((d) => d.dosenId === targetDosenId);
	}

	// Urutkan: Dosen dengan sesi terbanyak di atas; jika sesi sama, urutkan berdasarkan nama dosen
	dosenList.sort((a, b) => {
		if (b.totalSesiMengajar !== a.totalSesiMengajar) {
			return b.totalSesiMengajar - a.totalSesiMengajar;
		}
		return a.fullName.localeCompare(b.fullName);
	});

	const totalDosenDitugaskan = dosenList.length;
	const totalDosenAktif = dosenList.filter(
		(d) => d.totalSesiMengajar > 0,
	).length;
	const avgSesiPerDosen =
		totalDosenAktif > 0
			? Number((distinctMeetingsCount / totalDosenAktif).toFixed(1))
			: 0;

	return {
		success: true,
		period: {
			type: periodType,
			label: periodLabel,
			startDate,
			endDate,
			...periodDetails,
		},
		summary: {
			totalDosenDitugaskan,
			totalDosenAktif,
			totalSesiTerlaksana: distinctMeetingsCount,
			totalSesiTeamTeaching: distinctTeamTeachingMeetingsCount,
			rataRataSesiPerDosen: avgSesiPerDosen,
		},
		dosenList,
	};
}

export const coursesRoutes = new Elysia({ prefix: "/courses" })
	.onAfterResponse(async ({ request, set }) => {
		if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
			const status = typeof set.status === "number" ? set.status : 200;
			if (status < 400) {
				await Promise.all([
					cacheInvalidatePattern("cache:students:*"),
					cacheInvalidatePattern("cache:student:*"),
					cacheInvalidatePattern("cache:attendance:*"),
					cacheInvalidatePattern("cache:dashboard:*"),
				]);
			}
		}
	})
	.derive((context) => {
		const user = (context as any).user;
		return { user };
	})

	// ==========================================
	// 1. MATA KULIAH (COURSES) CRUD
	// ==========================================
	.get("/", async ({ query, user }: any) => {
		const { cohort, type, peminatan, rombel } = query || {};

		const conditions = [];

		// If Dosen (and not akademik/superadmin), only their own courses (dosen utama atau dosen pendamping)
		if (user && hasRole(user, "dosen") && !hasRole(user, "akademik")) {
			const dosenIdNum = Number(user.id);
			conditions.push(
				or(
					eq(courses.dosenId, dosenIdNum),
					eq(courses.dosenPendampingId, dosenIdNum),
				),
			);
		}

		if (cohort)
			conditions.push(eq(courses.cohort, parseInt(cohort as string, 10)));
		if (rombel && rombel !== "all")
			conditions.push(eq(courses.rombel, rombel as string));
		if (type && type !== "all")
			conditions.push(eq(courses.type, type as "teori" | "praktik"));
		if (peminatan && peminatan !== "all")
			conditions.push(eq(courses.peminatan, peminatan as string));

		const data = await db.query.courses.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			with: {
				dosen: {
					columns: { id: true, fullName: true },
				},
				dosenPendamping: {
					columns: { id: true, fullName: true },
				},
				meetings: {
					columns: { id: true },
				},
			},
			orderBy: [desc(courses.createdAt)],
		});

		return { success: true, data };
	})
	.post(
		"/",
		async ({ body, user, set }) => {
			if (!hasRole(user, "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const input = body as any;
			const targetRombel = (input.rombel || "Kelas A").trim();
			const cohortNum = parseInt(input.cohort, 10);
			const sksNum = input.sks ? Number(input.sks) : 2;

			const cleanCode = input.code.trim();

			// Validation: Code must be globally unique (hanya satu per mata kuliah)
			const existingCourse = await db.query.courses.findFirst({
				where: sql`LOWER(${courses.code}) = LOWER(${cleanCode})`,
			});
			if (existingCourse) {
				set.status = 400;
				return {
					success: false,
					message: `Kode mata kuliah '${cleanCode}' sudah digunakan oleh mata kuliah '${existingCourse.name}'. Kode mata kuliah harus unik (hanya satu per mata kuliah).`,
				};
			}

			const cleanDosenPendampingId =
				input.dosenPendampingId &&
				input.dosenPendampingId !== 0 &&
				input.dosenPendampingId !== "none"
					? Number(input.dosenPendampingId)
					: null;

			if (
				cleanDosenPendampingId &&
				cleanDosenPendampingId === Number(input.dosenId)
			) {
				set.status = 400;
				return {
					success: false,
					message:
						"Dosen pendamping tidak boleh sama dengan dosen pengampu utama",
				};
			}

			const [newCourse] = await db
				.insert(courses)
				.values({
					code: input.code.trim(),
					name: input.name.trim(),
					sks: sksNum,
					dosenId: input.dosenId,
					dosenPendampingId: cleanDosenPendampingId,
					peminatan: input.peminatan || null,
					cohort: cohortNum,
					rombel: targetRombel,
					type: input.type,
					createdBy: user.id,
				})
				.returning();

			// Auto-generate meetings: PKKMB (-1), Beginning Class (0), and Pertemuan 1..16 (8=UTS, 16=UAS)
			const meetingsToInsert: {
				courseId: number;
				meetingNumber: number;
				meetingType: "regular" | "uts" | "uas";
				meetingLabel: string;
				description?: string;
			}[] = [];

			for (let i = 1; i <= 16; i++) {
				let mType: "regular" | "uts" | "uas" = "regular";
				let mLabel = `Pertemuan ${i}`;

				if (i === 8) {
					mType = "uts";
					mLabel = "Ujian Tengah Semester (UTS)";
				} else if (i === 16) {
					mType = "uas";
					mLabel = "Ujian Akhir Semester (UAS)";
				}

				meetingsToInsert.push({
					courseId: newCourse.id,
					meetingNumber: i,
					meetingType: mType,
					meetingLabel: mLabel,
					description: "",
				});
			}

			await db.insert(courseMeetings).values(meetingsToInsert);

			return { success: true, data: newCourse };
		},
		{
			body: t.Object({
				code: t.String(),
				name: t.String(),
				dosenId: t.Number(),
				dosenPendampingId: t.Optional(t.Union([t.Number(), t.Null()])),
				peminatan: t.Optional(t.String()),
				cohort: t.Number(),
				type: t.Enum({ teori: "teori", praktik: "praktik" }),
				rombel: t.Optional(t.String()),
				sks: t.Optional(t.Union([t.Number(), t.String()])),
			}),
		},
	)

	// ==========================================
	// 1c. REKAPITULASI PRESENSI DOSEN (TEAM TEACHING)
	// ==========================================
	.get("/rekap-dosen/bulanan", async ({ query, user, set }: any) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}
		if (!hasRole(user, "dosen", "akademik", "finance")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const now = new Date();
		const mNum = query?.month
			? parseInt(query.month as string, 10)
			: now.getMonth() + 1;
		const yNum = query?.year
			? parseInt(query.year as string, 10)
			: now.getFullYear();

		if (isNaN(mNum) || mNum < 1 || mNum > 12) {
			set.status = 400;
			return { success: false, message: "Bulan harus antara 1 dan 12" };
		}

		const lastDay = new Date(yNum, mNum, 0).getDate();
		const startDate = `${yNum}-${String(mNum).padStart(2, "0")}-01`;
		const endDate = `${yNum}-${String(mNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
		const periodLabel = `${MONTH_NAMES_ID[mNum - 1]} ${yNum}`;

		let targetDosenId = query?.dosenId
			? parseInt(query.dosenId as string, 10)
			: null;
		// Jika role adalah dosen (dan bukan akademik/finance/superadmin), hanya lihat dirinya sendiri
		if (hasRole(user, "dosen") && !hasRole(user, "akademik", "finance")) {
			targetDosenId = user.id;
		}

		const cohortFilter = query?.cohort
			? parseInt(query.cohort as string, 10)
			: null;

		return await computeDosenRekap({
			startDate,
			endDate,
			targetDosenId,
			cohort: cohortFilter,
			periodLabel,
			periodType: "bulanan",
			periodDetails: {
				month: mNum,
				year: yNum,
				monthName: MONTH_NAMES_ID[mNum - 1],
			},
		});
	})
	.get("/rekap-dosen/semester", async ({ query, user, set }: any) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}
		if (!hasRole(user, "dosen", "akademik", "finance")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const now = new Date();
		const semesterNum = query?.semester
			? parseInt(query.semester as string, 10)
			: 1;
		const yNum = query?.year
			? parseInt(query.year as string, 10)
			: now.getFullYear();

		let startDate = (query?.startDate as string) || "";
		let endDate = (query?.endDate as string) || "";
		let periodLabel = (query?.label as string) || "";

		if (!startDate || !endDate) {
			if (semesterNum === 1) {
				startDate = `${yNum}-08-01`;
				endDate = `${yNum + 1}-01-31`;
				periodLabel = `Semester Ganjil ${yNum}/${yNum + 1}`;
			} else {
				startDate = `${yNum}-02-01`;
				endDate = `${yNum}-07-31`;
				periodLabel = `Semester Genap ${yNum}`;
			}
		}

		let targetDosenId = query?.dosenId
			? parseInt(query.dosenId as string, 10)
			: null;
		if (hasRole(user, "dosen") && !hasRole(user, "akademik", "finance")) {
			targetDosenId = user.id;
		}

		const cohortFilter = query?.cohort
			? parseInt(query.cohort as string, 10)
			: null;

		return await computeDosenRekap({
			startDate,
			endDate,
			targetDosenId,
			cohort: cohortFilter,
			periodLabel,
			periodType: "semester",
			periodDetails: { semester: semesterNum, year: yNum },
		});
	})

	.get("/:id", async ({ params, user, set }) => {
		const id = parseInt(params.id, 10);
		const course = await db.query.courses.findFirst({
			where: eq(courses.id, id),
			with: {
				dosen: {
					columns: { id: true, fullName: true },
				},
				dosenPendamping: {
					columns: { id: true, fullName: true },
				},
			},
		});

		if (!course) {
			set.status = 404;
			return { success: false, message: "Mata kuliah tidak ditemukan" };
		}

		if (
			hasRole(user, "dosen") &&
			!hasRole(user, "akademik", "superadmin") &&
			course.dosenId !== user.id &&
			course.dosenPendampingId !== user.id
		) {
			set.status = 403;
			return { success: false, message: "Anda bukan pengampu mata kuliah ini" };
		}

		return { success: true, data: course };
	})
	.patch(
		"/:id",
		async ({ params, body, user, set }) => {
			if (!hasRole(user, "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const id = parseInt(params.id, 10);
			const input = body as any;

			const current = await db.query.courses.findFirst({
				where: eq(courses.id, id),
			});

			if (!current) {
				set.status = 404;
				return { success: false, message: "Mata kuliah tidak ditemukan" };
			}

			const newCode = (input.code ?? current.code).trim();
			const newCohort =
				input.cohort !== undefined
					? parseInt(input.cohort, 10)
					: current.cohort;
			const newRombel = (input.rombel ?? current.rombel ?? "Kelas A").trim();
			const newSks = input.sks !== undefined ? Number(input.sks) : current.sks;

			// Validate duplicate course code (must be unique per course) excluding current
			const existingDuplicate = await db.query.courses.findFirst({
				where: and(
					sql`LOWER(${courses.code}) = LOWER(${newCode})`,
					ne(courses.id, id),
				),
			});

			if (existingDuplicate) {
				set.status = 400;
				return {
					success: false,
					message: `Kode mata kuliah '${newCode}' sudah digunakan oleh mata kuliah '${existingDuplicate.name}'. Kode mata kuliah harus unik (hanya satu per mata kuliah).`,
				};
			}

			let newDosenPendampingId = current.dosenPendampingId;
			if (input.dosenPendampingId !== undefined) {
				newDosenPendampingId =
					input.dosenPendampingId &&
					input.dosenPendampingId !== 0 &&
					input.dosenPendampingId !== "none"
						? Number(input.dosenPendampingId)
						: null;
			}

			const finalDosenId =
				input.dosenId !== undefined ? input.dosenId : current.dosenId;

			if (newDosenPendampingId && newDosenPendampingId === finalDosenId) {
				set.status = 400;
				return {
					success: false,
					message:
						"Dosen pendamping tidak boleh sama dengan dosen pengampu utama",
				};
			}

			const [updated] = await db
				.update(courses)
				.set({
					code: newCode,
					name: input.name !== undefined ? input.name.trim() : current.name,
					sks: newSks,
					dosenId: finalDosenId,
					dosenPendampingId: newDosenPendampingId,
					peminatan:
						input.peminatan !== undefined
							? input.peminatan || null
							: current.peminatan,
					cohort: newCohort,
					rombel: newRombel,
					type: input.type !== undefined ? input.type : current.type,
					updatedAt: new Date(),
				})
				.where(eq(courses.id, id))
				.returning();

			return { success: true, data: updated };
		},
		{
			body: t.Object({
				code: t.Optional(t.String()),
				name: t.Optional(t.String()),
				dosenId: t.Optional(t.Number()),
				dosenPendampingId: t.Optional(t.Union([t.Number(), t.Null()])),
				peminatan: t.Optional(t.String()),
				cohort: t.Optional(t.Number()),
				type: t.Optional(t.Enum({ teori: "teori", praktik: "praktik" })),
				rombel: t.Optional(t.String()),
				sks: t.Optional(t.Union([t.Number(), t.String()])),
			}),
		},
	)
	.delete("/:id", async ({ params, user, set }) => {
		if (!hasRole(user, "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const id = parseInt(params.id, 10);

		// Drizzle cannot cascade delete by default easily unless setup,
		// so we delete child items first manually.
		await db.delete(courseGrades).where(eq(courseGrades.courseId, id));
		await db
			.delete(courseEnrollments)
			.where(eq(courseEnrollments.courseId, id));

		const meetings = await db.query.courseMeetings.findMany({
			where: eq(courseMeetings.courseId, id),
		});

		if (meetings.length > 0) {
			const meetingIds = meetings.map((m) => m.id);
			await db
				.delete(courseMeetingActivities)
				.where(inArray(courseMeetingActivities.meetingId, meetingIds));
			await db
				.delete(courseMeetingAttendances)
				.where(inArray(courseMeetingAttendances.meetingId, meetingIds));
			await db.delete(courseMeetings).where(eq(courseMeetings.courseId, id));
		}

		await db.delete(courses).where(eq(courses.id, id));

		return {
			success: true,
			message: "Mata kuliah beserta jadwal mengajar berhasil dihapus",
		};
	})

	// ==========================================
	// 1b. CUSTOM ENROLLMENTS (LINTAS ANGKATAN)
	// ==========================================
	.get("/:id/enrollments", async ({ params, user, set }) => {
		const courseId = parseInt(params.id, 10);
		const course = await db.query.courses.findFirst({
			where: eq(courses.id, courseId),
		});
		if (!course) {
			set.status = 404;
			return { success: false, message: "Mata kuliah tidak ditemukan" };
		}
		const data = await db.query.courseEnrollments.findMany({
			where: eq(courseEnrollments.courseId, courseId),
			with: {
				student: {
					columns: {
						id: true,
						nim: true,
						name: true,
						cohort: true,
						program: true,
						subProgram: true,
						studentStatus: true,
					},
				},
				addedBy: {
					columns: { id: true, fullName: true, username: true },
				},
			},
			orderBy: [desc(courseEnrollments.createdAt)],
		});
		return { success: true, data };
	})
	.get("/:id/enrollments/search", async ({ params, query, set }) => {
		const courseId = parseInt(params.id, 10);
		const q = ((query?.q as string) || "").trim().toLowerCase();

		const course = await db.query.courses.findFirst({
			where: eq(courses.id, courseId),
		});
		if (!course) {
			set.status = 404;
			return { success: false, message: "Mata kuliah tidak ditemukan" };
		}

		// Get already enrolled student IDs
		const existingCustom = await db.query.courseEnrollments.findMany({
			where: eq(courseEnrollments.courseId, courseId),
			columns: { studentId: true },
		});
		const enrolledIds = new Set(existingCustom.map((e) => e.studentId));

		// Helper untuk memeriksa apakah mahasiswa sudah menjadi peserta reguler rombel & peminatan kelas ini
		const isRegularParticipant = (s: {
			cohort: number;
			rombel?: string | null;
			subProgram?: string | null;
		}) => {
			if (s.cohort !== course.cohort) return false;
			if (
				course.rombel &&
				course.rombel.trim().toLowerCase() !== "gabungan" &&
				course.rombel.trim().toLowerCase() !== "semua"
			) {
				if (
					!s.rombel ||
					s.rombel.trim().toLowerCase() !== course.rombel.trim().toLowerCase()
				) {
					return false;
				}
			}
			if (
				course.peminatan &&
				course.peminatan.trim().toLowerCase() !== "umum" &&
				course.peminatan.trim().toLowerCase() !== "semua" &&
				course.peminatan.trim().toLowerCase() !== "gabungan"
			) {
				const cPem = course.peminatan.trim().toLowerCase();
				const sSub = (s.subProgram || "").trim().toLowerCase();
				if (!sSub || sSub !== cPem) {
					return false;
				}
			}
			return true;
		};

		// Fetch active students
		const allStudents = await db.query.students.findMany({
			where: eq(students.isArchived, false),
			columns: {
				id: true,
				nim: true,
				name: true,
				cohort: true,
				rombel: true,
				program: true,
				subProgram: true,
				studentStatus: true,
			},
			orderBy: [asc(students.name)],
			limit: 200,
		});

		const filtered = allStudents
			.filter((s) => {
				// Exclude jika sudah terdaftar di enrollments ATAU sudah menjadi peserta reguler rombel kelas
				if (enrolledIds.has(s.id) || isRegularParticipant(s)) return false;
				if (!q) return true;
				return (
					s.name.toLowerCase().includes(q) ||
					(s.nim && s.nim.toLowerCase().includes(q)) ||
					s.cohort.toString().includes(q) ||
					(s.subProgram && s.subProgram.toLowerCase().includes(q)) ||
					(s.rombel && s.rombel.toLowerCase().includes(q))
				);
			})
			.slice(0, 50);

		return { success: true, data: filtered };
	})
	.post(
		"/:id/enrollments",
		async ({ params, body, user, set }) => {
			if (!hasRole(user, "akademik", "superadmin", "dosen")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const courseId = parseInt(params.id, 10);
			const { studentId, studentIds, notes, allowOverride } = body as {
				studentId?: number;
				studentIds?: number[];
				notes?: string;
				allowOverride?: boolean;
			};

			const targetIds: number[] =
				Array.isArray(studentIds) && studentIds.length > 0
					? studentIds
					: typeof studentId === "number"
						? [studentId]
						: [];

			if (targetIds.length === 0) {
				set.status = 400;
				return {
					success: false,
					message: "Silakan pilih minimal satu mahasiswa",
				};
			}

			const course = await db.query.courses.findFirst({
				where: eq(courses.id, courseId),
			});
			if (!course) {
				set.status = 404;
				return { success: false, message: "Mata kuliah tidak ditemukan" };
			}

			// Fetch candidate student details
			const studentRecords = await db.query.students.findMany({
				where: inArray(students.id, targetIds),
				columns: {
					id: true,
					cohort: true,
					name: true,
					rombel: true,
					subProgram: true,
				},
			});

			const isRegularParticipant = (s: {
				cohort: number;
				rombel?: string | null;
				subProgram?: string | null;
			}) => {
				if (s.cohort !== course.cohort) return false;
				if (
					course.rombel &&
					course.rombel.trim().toLowerCase() !== "gabungan" &&
					course.rombel.trim().toLowerCase() !== "semua"
				) {
					if (
						!s.rombel ||
						s.rombel.trim().toLowerCase() !== course.rombel.trim().toLowerCase()
					) {
						return false;
					}
				}
				if (
					course.peminatan &&
					course.peminatan.trim().toLowerCase() !== "umum" &&
					course.peminatan.trim().toLowerCase() !== "semua" &&
					course.peminatan.trim().toLowerCase() !== "gabungan"
				) {
					const cPem = course.peminatan.trim().toLowerCase();
					const sSub = (s.subProgram || "").trim().toLowerCase();
					if (!sSub || sSub !== cPem) {
						return false;
					}
				}
				return true;
			};

			// 1. Check if any student is already in the course's regular rombel
			const regularParticipantIds = new Set(
				studentRecords.filter((s) => isRegularParticipant(s)).map((s) => s.id),
			);

			// 2. Check if already registered in custom course enrollments
			const existing = await db.query.courseEnrollments.findMany({
				where: and(
					eq(courseEnrollments.courseId, courseId),
					inArray(courseEnrollments.studentId, targetIds),
				),
			});
			const existingIds = new Set(existing.map((e) => e.studentId));

			// Only insert students who are neither in regular rombel nor already in courseEnrollments
			const toInsert = targetIds.filter(
				(id) => !regularParticipantIds.has(id) && !existingIds.has(id),
			);

			if (toInsert.length === 0) {
				set.status = 400;
				return {
					success: false,
					message:
						"Mahasiswa yang dipilih sudah terdaftar di mata kuliah ini (baik sebagai peserta reguler maupun peserta tambahan).",
				};
			}

			// 3. Pengecekan Bentrok Jadwal Mahasiswa
			const activeTerm = await getActiveAcademicTerm();
			const termId = course.termId || activeTerm?.id;
			if (termId && !allowOverride) {
				for (const s of studentRecords) {
					if (!toInsert.includes(s.id)) continue;
					const conflictCheck = await checkStudentScheduleConflict(
						s.id,
						courseId,
						termId,
					);
					if (conflictCheck.hasConflict) {
						set.status = 409;
						const firstConflict = conflictCheck.conflicts[0];
						return {
							success: false,
							message: `Konflik Jadwal: Mahasiswa '${s.name}' sudah memiliki jadwal perkuliahan '${firstConflict?.existingCourse}' pada hari ${firstConflict?.day} (${firstConflict?.existingTime}) yang bertabrakan dengan kelas ini.`,
							conflicts: conflictCheck.conflicts,
						};
					}
				}
			}

			const validUserId = (await getValidUserId(user)) || user?.id || null;

			const recordsToInsert = toInsert.map((sId) => ({
				courseId,
				studentId: sId,
				addedBy: validUserId,
				notes: notes || null,
			}));

			const inserted = await db
				.insert(courseEnrollments)
				.values(recordsToInsert)
				.returning();

			// Auto-synchronize full AKD-06 academic calculation for each newly enrolled student
			for (const sId of toInsert) {
				try {
					await GradeCalculationService.calculateStudentGrades(sId, 1);
				} catch (syncErr) {
					console.error(
						`Gagal sinkron nilai setelah enrollment untuk student ${sId}:`,
						syncErr,
					);
				}
			}

			return {
				success: true,
				message: `${inserted.length} mahasiswa berhasil ditambahkan ke mata kuliah`,
				data: inserted,
			};
		},
		{
			body: t.Object({
				studentId: t.Optional(t.Number()),
				studentIds: t.Optional(t.Array(t.Number())),
				notes: t.Optional(t.Union([t.String(), t.Null()])),
				allowOverride: t.Optional(t.Boolean()),
			}),
		},
	)
	.delete("/:id/enrollments/:enrollId", async ({ params, user, set }) => {
		if (!hasRole(user, "akademik", "superadmin", "dosen")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const enrollId = parseInt(params.enrollId, 10);
		const existing = await db.query.courseEnrollments.findFirst({
			where: eq(courseEnrollments.id, enrollId),
		});
		if (!existing) {
			set.status = 404;
			return { success: false, message: "Data pendaftaran tidak ditemukan" };
		}

		await db
			.delete(courseEnrollments)
			.where(eq(courseEnrollments.id, enrollId));

		// Hapus juga record courseGrades terkait
		await db
			.delete(courseGrades)
			.where(
				and(
					eq(courseGrades.courseId, existing.courseId),
					eq(courseGrades.studentId, existing.studentId),
				),
			);

		try {
			await GradeCalculationService.calculateStudentGrades(
				existing.studentId,
				1,
			);
		} catch (syncErr) {
			console.error(`Gagal sinkron nilai setelah delete enrollment:`, syncErr);
		}

		return {
			success: true,
			message: "Pendaftaran mahasiswa berhasil dihapus dari mata kuliah",
		};
	})

	// ==========================================
	// 2. MEETINGS CRUD
	// ==========================================
	.get("/:id/meetings", async ({ params, user, set }) => {
		const courseId = parseInt(params.id, 10);

		// Verify course
		const course = await db.query.courses.findFirst({
			where: eq(courses.id, courseId),
		});
		if (!course) {
			set.status = 404;
			return { success: false, message: "Not found" };
		}
		if (
			hasRole(user, "dosen") &&
			!hasRole(user, "akademik", "superadmin") &&
			course.dosenId !== user.id &&
			course.dosenPendampingId !== user.id
		) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const data = await db.query.courseMeetings.findMany({
			where: eq(courseMeetings.courseId, courseId),
			with: {
				dosenPengajar: {
					columns: { id: true, fullName: true, username: true },
				},
				activities: true,
				attendances: {
					with: {
						student: {
							columns: { id: true, name: true, nim: true },
						},
					},
				},
			},
			orderBy: [asc(courseMeetings.meetingNumber)],
		});

		return { success: true, data };
	})
	.patch(
		"/:id/meetings/:meetingId",
		async ({ params, body, user, set }) => {
			const meetingId = parseInt(params.meetingId, 10);
			const input = body as any;

			// Verify ownership indirectly
			const meeting = await db.query.courseMeetings.findFirst({
				where: eq(courseMeetings.id, meetingId),
				with: { course: true },
			});
			if (!meeting) {
				set.status = 404;
				return { success: false, message: "Not found" };
			}
			if (
				hasRole(user, "dosen") &&
				!hasRole(user, "akademik", "superadmin") &&
				meeting.course.dosenId !== user.id &&
				meeting.course.dosenPendampingId !== user.id
			) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const updatePayload: Record<string, any> = {
				meetingLabel: input.meetingLabel,
				description: input.description,
				meetingDate: input.meetingDate || null,
				updatedAt: new Date(),
			};

			if (input.sessionType !== undefined) {
				updatePayload.sessionType = input.sessionType;
			}
			if (input.teachingStatus !== undefined) {
				updatePayload.teachingStatus = input.teachingStatus;
			}
			if (input.teachingNotes !== undefined) {
				updatePayload.teachingNotes = input.teachingNotes;
			}

			// Otomatisasi Absensi Akun Dosen yang Login:
			// Jika client tidak mengirimkan attendedDosenIds / dosenPengajarId eksplisit (seperti pada form presensi dosen),
			// sistem secara otomatis merekam absensi sesuai akun dosen yang sedang login.
			// Dosen tidak bisa mengabsenkan orang lain. Jika kedua dosen hadir bersamaan (keduanya menginput sesi ini),
			// sistem otomatis menggabungkan kehadiran keduanya dan menetapkan status Hadir Bersama (Team Teaching).
			if (
				input.attendedDosenIds === undefined &&
				input.dosenPengajarId === undefined
			) {
				const currentUserId = Number(user.id);
				const currentAttended: number[] = Array.isArray(
					meeting.attendedDosenIds,
				)
					? (meeting.attendedDosenIds.filter(
							(id) => typeof id === "number",
						) as number[])
					: meeting.dosenPengajarId
						? [meeting.dosenPengajarId]
						: [];

				const updatedAttended = Array.from(
					new Set([...currentAttended, currentUserId]),
				);

				updatePayload.attendedDosenIds = updatedAttended;
				updatePayload.isTeamTeachingAttended = updatedAttended.length > 1;
				updatePayload.dosenPengajarId = currentUserId;
			} else {
				// Role Akademik / Superadmin tetap memiliki wewenang administratif penuh jika memberikan input eksplisit
				if (input.dosenPengajarId !== undefined) {
					updatePayload.dosenPengajarId = input.dosenPengajarId;
				}
				if (input.attendedDosenIds !== undefined) {
					updatePayload.attendedDosenIds = input.attendedDosenIds;
				}
				if (input.isTeamTeachingAttended !== undefined) {
					updatePayload.isTeamTeachingAttended = input.isTeamTeachingAttended;
				}
			}

			const [updated] = await db
				.update(courseMeetings)
				.set(updatePayload)
				.where(eq(courseMeetings.id, meetingId))
				.returning();

			return { success: true, data: updated };
		},
		{
			body: t.Object({
				meetingLabel: t.String(),
				sessionType: t.Optional(t.Union([t.String(), t.Null()])),
				description: t.Optional(t.Union([t.String(), t.Null()])),
				meetingDate: t.Optional(t.Union([t.String(), t.Null()])),
				dosenPengajarId: t.Optional(t.Union([t.Number(), t.Null()])),
				attendedDosenIds: t.Optional(t.Union([t.Array(t.Number()), t.Null()])),
				isTeamTeachingAttended: t.Optional(t.Union([t.Boolean(), t.Null()])),
				teachingStatus: t.Optional(t.Union([t.String(), t.Null()])),
				teachingNotes: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	)
	.post(
		"/:id/meetings/generate-dates",
		async ({ params, body, user, set }) => {
			if (!hasRole(user, "akademik", "superadmin", "dosen")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const courseId = parseInt(params.id, 10);
			const { startDate, includePkkmbBeginning } = body as {
				startDate: string;
				includePkkmbBeginning?: boolean;
			};

			if (!startDate || isNaN(Date.parse(startDate))) {
				set.status = 400;
				return {
					success: false,
					message: "Format tanggal mulai pertemuan (startDate) tidak valid",
				};
			}

			const course = await db.query.courses.findFirst({
				where: eq(courses.id, courseId),
			});
			if (!course) {
				set.status = 404;
				return { success: false, message: "Mata kuliah tidak ditemukan" };
			}

			if (
				hasRole(user, "dosen") &&
				!hasRole(user, "akademik", "superadmin") &&
				course.dosenId !== user.id &&
				course.dosenPendampingId !== user.id
			) {
				set.status = 403;
				return {
					success: false,
					message: "Anda bukan pengampu mata kuliah ini",
				};
			}

			const meetings = await db.query.courseMeetings.findMany({
				where: eq(courseMeetings.courseId, courseId),
			});

			if (meetings.length === 0) {
				set.status = 400;
				return {
					success: false,
					message: "Tidak ada data pertemuan pada mata kuliah ini",
				};
			}

			let updatedCount = 0;
			for (const meeting of meetings) {
				let targetDate: string | null = null;
				if (meeting.meetingNumber >= 1 && meeting.meetingNumber <= 16) {
					const daysOffset = (meeting.meetingNumber - 1) * 7;
					targetDate = addDays(startDate, daysOffset);
				}

				if (targetDate) {
					await db
						.update(courseMeetings)
						.set({
							meetingDate: targetDate,
							updatedAt: new Date(),
						})
						.where(eq(courseMeetings.id, meeting.id));
					updatedCount++;
				}
			}

			return {
				success: true,
				message: `Berhasil mengatur tanggal untuk ${updatedCount} pertemuan perkuliahan`,
				data: { updatedCount },
			};
		},
		{
			body: t.Object({
				startDate: t.String(),
				includePkkmbBeginning: t.Optional(t.Boolean()),
			}),
		},
	)

	// ==========================================
	// 3. ACTIVITIES CRUD
	// ==========================================
	.post(
		"/:id/meetings/:meetingId/activities",
		async ({ params, body, user, set }) => {
			const meetingId = parseInt(params.meetingId, 10);
			const input = body as any;

			const [newActivity] = await db
				.insert(courseMeetingActivities)
				.values({
					meetingId: meetingId,
					activityType: input.activityType,
					score: input.score || null,
					notes: input.notes || null,
					documentUrl: input.documentUrl || null,
					documentName: input.documentName || null,
				})
				.returning();

			return { success: true, data: newActivity };
		},
		{
			body: t.Object({
				activityType: t.Enum({
					teori: "teori",
					tugas: "tugas",
					praktik: "praktik",
					ujian: "ujian",
				}),
				score: t.Optional(t.Number()),
				notes: t.Optional(t.String()),
				documentUrl: t.Optional(t.Union([t.String(), t.Null()])),
				documentName: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	)
	.patch(
		"/:id/meetings/:meetingId/activities/:activityId",
		async ({ params, body, user, set }) => {
			const activityId = parseInt(params.activityId, 10);
			const input = body as any;

			const [updated] = await db
				.update(courseMeetingActivities)
				.set({
					activityType: input.activityType,
					score: input.score !== undefined ? input.score : undefined,
					notes: input.notes !== undefined ? input.notes : undefined,
					documentUrl:
						input.documentUrl !== undefined ? input.documentUrl : undefined,
					documentName:
						input.documentName !== undefined ? input.documentName : undefined,
					updatedAt: new Date(),
				})
				.where(eq(courseMeetingActivities.id, activityId))
				.returning();

			return { success: true, data: updated };
		},
		{
			body: t.Object({
				activityType: t.Enum({
					teori: "teori",
					tugas: "tugas",
					praktik: "praktik",
					ujian: "ujian",
				}),
				score: t.Optional(t.Number()),
				notes: t.Optional(t.String()),
				documentUrl: t.Optional(t.Union([t.String(), t.Null()])),
				documentName: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	)
	.delete(
		"/:id/meetings/:meetingId/activities/:activityId",
		async ({ params }) => {
			const activityId = parseInt(params.activityId, 10);
			await db
				.delete(courseMeetingActivities)
				.where(eq(courseMeetingActivities.id, activityId));
			return { success: true, message: "Deleted" };
		},
	)

	// ==========================================
	// 4. ATTENDANCES BULK UPSERT & AUTO-SYNC AGGREGATES
	// ==========================================
	.post(
		"/:id/meetings/:meetingId/attendances",
		async ({ params, body, user, set }) => {
			const courseId = parseInt(params.id, 10);
			const meetingId = parseInt(params.meetingId, 10);
			const input = body as any;

			const course = await db.query.courses.findFirst({
				where: eq(courses.id, courseId),
			});
			if (!course) {
				set.status = 404;
				return { success: false, message: "Course not found" };
			}

			if (
				hasRole(user, "dosen") &&
				!hasRole(user, "akademik", "superadmin") &&
				course.dosenId !== user.id &&
				course.dosenPendampingId !== user.id
			) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			// Delete existing attendances for this meeting
			await db
				.delete(courseMeetingAttendances)
				.where(eq(courseMeetingAttendances.meetingId, meetingId));

			if (input.attendances && input.attendances.length > 0) {
				const toInsert = input.attendances.map((a: any) => ({
					meetingId: meetingId,
					studentId: a.studentId,
					status: a.status || null,
					theoryScore:
						a.theoryScore !== undefined &&
						a.theoryScore !== null &&
						a.theoryScore !== ""
							? Math.max(0, Math.min(100, parseInt(a.theoryScore, 10) || 0))
							: null,
					practicalScore:
						a.practicalScore !== undefined &&
						a.practicalScore !== null &&
						a.practicalScore !== ""
							? Math.max(0, Math.min(100, parseInt(a.practicalScore, 10) || 0))
							: null,
					notes: a.notes || null,
				}));

				await db.insert(courseMeetingAttendances).values(toInsert);

				// Auto-synchronize aggregate scores, attendance rate, and full AKD-06 academic calculation for each affected student
				const studentIds = Array.from(
					new Set(input.attendances.map((a: any) => a.studentId)),
				) as number[];

				for (const studentId of studentIds) {
					try {
						await GradeCalculationService.calculateStudentGrades(studentId, 1);
					} catch (calcErr) {
						console.error(
							`Gagal menghitung nilai student ${studentId}:`,
							calcErr,
						);
					}
				}
			}

			return {
				success: true,
				message: "Presensi dan nilai harian berhasil disimpan",
			};
		},
		{
			body: t.Object({
				attendances: t.Array(
					t.Object({
						studentId: t.Number(),
						status: t.Optional(t.Union([t.String(), t.Null()])),
						theoryScore: t.Optional(t.Union([t.Number(), t.Null()])),
						practicalScore: t.Optional(t.Union([t.Number(), t.Null()])),
						notes: t.Optional(t.Union([t.String(), t.Null()])),
					}),
				),
			}),
		},
	)

	// ==========================================
	// 5. BUDGET REQUESTS (ANGGARAN PRAKTIK)
	// ==========================================
	.get("/:id/budget-requests", async ({ params, user, set }) => {
		const courseId = parseInt(params.id, 10);

		const data = await db.query.practicesBudgetRequests.findMany({
			where: eq(practicesBudgetRequests.courseId, courseId),
			with: {
				course: true,
				dosen: {
					columns: { id: true, fullName: true },
				},
				materialReports: true,
			},
			orderBy: [desc(practicesBudgetRequests.createdAt)],
		});

		return { success: true, data };
	})
	.post(
		"/:id/budget-requests",
		async ({ params, body, user, set }) => {
			const courseId = parseInt(params.id, 10);
			const input = body as any;

			const targetCourseId = input.courseId
				? parseInt(input.courseId, 10)
				: courseId;

			const course = await db.query.courses.findFirst({
				where: eq(courses.id, targetCourseId),
			});

			if (!course) {
				set.status = 404;
				return { success: false, message: "Course not found" };
			}

			if (
				hasRole(user, "dosen") &&
				!hasRole(user, "akademik", "superadmin") &&
				course.dosenId !== user.id &&
				course.dosenPendampingId !== user.id
			) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const validDosenId =
				(await getValidUserId(user)) || course.dosenId || user?.id;

			const [newRequest] = await db
				.insert(practicesBudgetRequests)
				.values({
					courseId: targetCourseId,
					dosenId: validDosenId,
					daftarKebutuhan: input.daftarKebutuhan,
					totalNominal: input.totalNominal,
				})
				.returning();

			return { success: true, data: newRequest };
		},
		{
			body: t.Object({
				courseId: t.Optional(t.Number()),
				daftarKebutuhan: t.Array(
					t.Object({
						namaItem: t.String(),
						jumlah: t.Number(),
						satuan: t.String(),
						satuanHarga: t.Number(),
					}),
				),
				totalNominal: t.Number(),
			}),
		},
	)
	.post(
		"/:id/budget-requests/:reqId/report",
		async ({ params, body, user, set }) => {
			const reqId = parseInt(params.reqId, 10);
			const input = body as any;

			// Verify request exists
			const request = await db.query.practicesBudgetRequests.findFirst({
				where: eq(practicesBudgetRequests.id, reqId),
			});

			if (!request) {
				set.status = 404;
				return { success: false, message: "Request not found" };
			}

			const validDosenId =
				(await getValidUserId(user)) || request.dosenId || user?.id;

			const [newReport] = await db
				.insert(practicesMaterialReports)
				.values({
					budgetRequestId: reqId,
					dosenId: validDosenId,
					daftarSisaBahan: input.daftarSisaBahan,
					catatanDosen: input.catatanDosen,
					fileUrl: input.fileUrl,
					fileName: input.fileName,
				})
				.returning();

			return { success: true, data: newReport };
		},
	)
	.put(
		"/:id/budget-requests/:reqId",
		async ({ params, body, user, set }) => {
			const reqId = parseInt(params.reqId, 10);
			const input = body as any;

			if (!hasRole(user, "dosen", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const updateData: any = {
				daftarKebutuhan: input.daftarKebutuhan,
				totalNominal: input.totalNominal,
				status: "menunggu",
				updatedAt: new Date(),
			};

			if (input.courseId) {
				updateData.courseId = parseInt(input.courseId, 10);
			}

			await db
				.update(practicesBudgetRequests)
				.set(updateData)
				.where(eq(practicesBudgetRequests.id, reqId));

			return { success: true };
		},
		{
			body: t.Object({
				courseId: t.Optional(t.Number()),
				daftarKebutuhan: t.Array(t.Any()),
				totalNominal: t.Number(),
			}),
		},
	)
	.delete("/:id/budget-requests/:reqId", async ({ params, user, set }) => {
		const reqId = parseInt(params.reqId, 10);

		if (!hasRole(user, "dosen", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db
			.delete(practicesMaterialReports)
			.where(eq(practicesMaterialReports.budgetRequestId, reqId));
		await db
			.delete(practicesBudgetRequests)
			.where(eq(practicesBudgetRequests.id, reqId));

		return { success: true };
	});
