import { relations } from "drizzle-orm";
import {
	academicAttitudeLogs,
	academicData,
	academicDocuments,
	courseGradeDocuments,
	courseGrades,
	overseasProgramChecklists,
} from "./academic";
import {
	academicCalendars,
	academicEvents,
	academicPeriods,
} from "./academic-calendar";
import {
	courseMeetingActivities,
	courseMeetingAttendances,
	courseMeetings,
	courses,
} from "./courses";
import { crmData, crmDocuments, crmLogs } from "./crm";
import { finalDecision } from "./final-decision";
import {
	financeData,
	financeDocuments,
	financeSemesterInstallments,
	financeSemesters,
	financeTalanganInstallments,
	practicesBudgetRequests,
	practicesMaterialReports,
	vocationalBudgetRequests,
	vocationalLeftovers,
	vocationalMonthlyBudgets,
} from "./finance";
import {
	departureAssessmentNotes,
	departureAssessments,
	internshipData,
	internshipDocuments,
} from "./internship";
import {
	counselingLogs,
	paData,
	paDocuments,
	paHafalanSessions,
	paInterviewLogs,
	paStudentNotes,
	paTripartiteLogs,
} from "./pa";
import {
	pmbData,
	pmbDocuments,
	pmbFeeDisbursements,
	pmbFormResponses,
	pmbFormTokens,
	pmbPaymentPlan,
} from "./pmb";
import {
	announcements,
	attendanceRecords,
	attendanceSessions,
	classSchedules,
	dutySchedules,
	odsAttendanceRecords,
	practicumSchedules,
	pramagangAttendanceRecords,
} from "./scheduling";
import {
	auditLogs,
	backupJobs,
	files,
	internalNotes,
	studentHealth,
	studentParents,
	students,
	users,
} from "./shared";

// Finance relations
export const financeSemestersRelations = relations(
	financeSemesters,
	({ one, many }) => ({
		student: one(students, {
			fields: [financeSemesters.studentId],
			references: [students.id],
		}),
		installments: many(financeSemesterInstallments),
	}),
);

export const financeSemesterInstallmentsRelations = relations(
	financeSemesterInstallments,
	({ one }) => ({
		semester: one(financeSemesters, {
			fields: [financeSemesterInstallments.semesterId],
			references: [financeSemesters.id],
		}),
	}),
);

export const financeTalanganInstallmentsRelations = relations(
	financeTalanganInstallments,
	({ one }) => ({
		student: one(students, {
			fields: [financeTalanganInstallments.studentId],
			references: [students.id],
		}),
	}),
);

export const practicesBudgetRequestsRelations = relations(
	practicesBudgetRequests,
	({ one, many }) => ({
		dosen: one(users, {
			fields: [practicesBudgetRequests.dosenId],
			references: [users.id],
		}),
		course: one(courses, {
			fields: [practicesBudgetRequests.courseId],
			references: [courses.id],
		}),
		approvedBy: one(users, {
			fields: [practicesBudgetRequests.approvedBy],
			references: [users.id],
		}),
		materialReports: many(practicesMaterialReports),
	}),
);

export const practicesMaterialReportsRelations = relations(
	practicesMaterialReports,
	({ one }) => ({
		budgetRequest: one(practicesBudgetRequests, {
			fields: [practicesMaterialReports.budgetRequestId],
			references: [practicesBudgetRequests.id],
		}),
		dosen: one(users, {
			fields: [practicesMaterialReports.dosenId],
			references: [users.id],
		}),
	}),
);

export const pmbDataRelations = relations(pmbData, ({ one }) => ({
	accBy: one(users, {
		fields: [pmbData.accBy],
		references: [users.id],
	}),
}));

export const pmbPaymentPlanRelations = relations(pmbPaymentPlan, ({ one }) => ({
	student: one(students, {
		fields: [pmbPaymentPlan.studentId],
		references: [students.id],
	}),
}));

export const pmbFeeDisbursementsRelations = relations(
	pmbFeeDisbursements,
	({ one }) => ({
		student: one(students, {
			fields: [pmbFeeDisbursements.studentId],
			references: [students.id],
		}),
	}),
);

export const pmbDocumentsRelations = relations(pmbDocuments, ({ one }) => ({
	uploadedBy: one(users, {
		fields: [pmbDocuments.uploadedBy],
		references: [users.id],
	}),
	verifiedBy: one(users, {
		fields: [pmbDocuments.verifiedBy],
		references: [users.id],
	}),
}));

export const crmDataRelations = relations(crmData, ({ one }) => ({
	accBy: one(users, {
		fields: [crmData.accBy],
		references: [users.id],
	}),
}));

export const crmLogsRelations = relations(crmLogs, ({ one }) => ({
	author: one(users, {
		fields: [crmLogs.authorId],
		references: [users.id],
	}),
}));

export const crmDocumentsRelations = relations(crmDocuments, ({ one }) => ({
	uploadedBy: one(users, {
		fields: [crmDocuments.uploadedBy],
		references: [users.id],
	}),
	verifiedBy: one(users, {
		fields: [crmDocuments.verifiedBy],
		references: [users.id],
	}),
}));

export const financeDataRelations = relations(financeData, ({ one }) => ({
	accBy: one(users, {
		fields: [financeData.accBy],
		references: [users.id],
	}),
}));

export const financeDocumentsRelations = relations(
	financeDocuments,
	({ one }) => ({
		uploadedBy: one(users, {
			fields: [financeDocuments.uploadedBy],
			references: [users.id],
		}),
		verifiedBy: one(users, {
			fields: [financeDocuments.verifiedBy],
			references: [users.id],
		}),
	}),
);

export const academicDataRelations = relations(
	academicData,
	({ one, many }) => ({
		student: one(students, {
			fields: [academicData.studentId],
			references: [students.id],
		}),
		accBy: one(users, {
			fields: [academicData.accBy],
			references: [users.id],
		}),
	}),
);

export const overseasProgramChecklistsRelations = relations(
	overseasProgramChecklists,
	({ one }) => ({
		student: one(students, {
			fields: [overseasProgramChecklists.studentId],
			references: [students.id],
		}),
	}),
);

export const academicDocumentsRelations = relations(
	academicDocuments,
	({ one }) => ({
		uploadedBy: one(users, {
			fields: [academicDocuments.uploadedBy],
			references: [users.id],
		}),
		verifiedBy: one(users, {
			fields: [academicDocuments.verifiedBy],
			references: [users.id],
		}),
	}),
);

export const courseGradesRelations = relations(courseGrades, ({ one }) => ({
	accBy: one(users, {
		fields: [courseGrades.accBy],
		references: [users.id],
	}),
	dosen: one(users, {
		fields: [courseGrades.dosenId],
		references: [users.id],
	}),
	course: one(courses, {
		fields: [courseGrades.courseId],
		references: [courses.id],
	}),
}));

export const courseGradeDocumentsRelations = relations(
	courseGradeDocuments,
	({ one }) => ({
		uploadedBy: one(users, {
			fields: [courseGradeDocuments.uploadedBy],
			references: [users.id],
		}),
		verifiedBy: one(users, {
			fields: [courseGradeDocuments.verifiedBy],
			references: [users.id],
		}),
		courseGrade: one(courseGrades, {
			fields: [courseGradeDocuments.courseGradeId],
			references: [courseGrades.id],
		}),
	}),
);

export const paDataRelations = relations(paData, ({ one }) => ({
	accBy: one(users, {
		fields: [paData.accBy],
		references: [users.id],
	}),
}));

export const paDocumentsRelations = relations(paDocuments, ({ one }) => ({
	uploadedBy: one(users, {
		fields: [paDocuments.uploadedBy],
		references: [users.id],
	}),
	verifiedBy: one(users, {
		fields: [paDocuments.verifiedBy],
		references: [users.id],
	}),
}));

export const paTripartiteLogsRelations = relations(
	paTripartiteLogs,
	({ one }) => ({
		createdBy: one(users, {
			fields: [paTripartiteLogs.createdBy],
			references: [users.id],
		}),
	}),
);

export const paInterviewLogsRelations = relations(
	paInterviewLogs,
	({ one }) => ({
		createdBy: one(users, {
			fields: [paInterviewLogs.createdBy],
			references: [users.id],
		}),
	}),
);

export const internshipDataRelations = relations(internshipData, ({ one }) => ({
	accBy: one(users, {
		fields: [internshipData.accBy],
		references: [users.id],
	}),
}));

export const internshipDocumentsRelations = relations(
	internshipDocuments,
	({ one }) => ({
		uploadedBy: one(users, {
			fields: [internshipDocuments.uploadedBy],
			references: [users.id],
		}),
		verifiedBy: one(users, {
			fields: [internshipDocuments.verifiedBy],
			references: [users.id],
		}),
	}),
);

export const internalNotesRelations = relations(internalNotes, ({ one }) => ({
	author: one(users, {
		fields: [internalNotes.authorId],
		references: [users.id],
	}),
	student: one(students, {
		fields: [internalNotes.studentId],
		references: [students.id],
	}),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
	pa: one(users, {
		fields: [students.paId],
		references: [users.id],
	}),
	health: one(studentHealth, {
		fields: [students.id],
		references: [studentHealth.studentId],
	}),
	parents: many(studentParents),
	departureAssessment: one(departureAssessments, {
		fields: [students.id],
		references: [departureAssessments.studentId],
	}),
}));

export const departureAssessmentsRelations = relations(
	departureAssessments,
	({ one, many }) => ({
		student: one(students, {
			fields: [departureAssessments.studentId],
			references: [students.id],
		}),
		assessedByUser: one(users, {
			fields: [departureAssessments.assessedBy],
			references: [users.id],
		}),
		notes: many(departureAssessmentNotes),
	}),
);

export const departureAssessmentNotesRelations = relations(
	departureAssessmentNotes,
	({ one }) => ({
		assessment: one(departureAssessments, {
			fields: [departureAssessmentNotes.assessmentId],
			references: [departureAssessments.id],
		}),
		author: one(users, {
			fields: [departureAssessmentNotes.createdBy],
			references: [users.id],
		}),
	}),
);

export const paHafalanSessionsRelations = relations(
	paHafalanSessions,
	({ one }) => ({
		student: one(students, {
			fields: [paHafalanSessions.studentId],
			references: [students.id],
		}),
		createdByUser: one(users, {
			fields: [paHafalanSessions.createdBy],
			references: [users.id],
		}),
	}),
);

export const paStudentNotesRelations = relations(paStudentNotes, ({ one }) => ({
	student: one(students, {
		fields: [paStudentNotes.studentId],
		references: [students.id],
	}),
	createdByUser: one(users, {
		fields: [paStudentNotes.createdBy],
		references: [users.id],
	}),
}));

export const studentParentsRelations = relations(studentParents, ({ one }) => ({
	student: one(students, {
		fields: [studentParents.studentId],
		references: [students.id],
	}),
}));

export const studentHealthRelations = relations(studentHealth, ({ one }) => ({
	student: one(students, {
		fields: [studentHealth.studentId],
		references: [students.id],
	}),
}));

export const finalDecisionRelations = relations(finalDecision, ({ one }) => ({
	decidedBy: one(users, {
		fields: [finalDecision.decidedBy],
		references: [users.id],
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id],
	}),
}));

export const academicAttitudeLogsRelations = relations(
	academicAttitudeLogs,
	({ one }) => ({
		dosenId: one(users, {
			fields: [academicAttitudeLogs.dosenId],
			references: [users.id],
		}),
	}),
);

export const vocationalMonthlyBudgetsRelations = relations(
	vocationalMonthlyBudgets,
	({ one }) => ({
		creator: one(users, {
			fields: [vocationalMonthlyBudgets.createdBy],
			references: [users.id],
		}),
	}),
);

export const vocationalBudgetRequestsRelations = relations(
	vocationalBudgetRequests,
	({ one }) => ({
		submitter: one(users, {
			fields: [vocationalBudgetRequests.submittedBy],
			references: [users.id],
		}),
	}),
);

export const vocationalLeftoversRelations = relations(
	vocationalLeftovers,
	({ one }) => ({
		reporter: one(users, {
			fields: [vocationalLeftovers.reportedBy],
			references: [users.id],
		}),
	}),
);

export const pmbFormTokensRelations = relations(pmbFormTokens, ({ one }) => ({
	creator: one(users, {
		fields: [pmbFormTokens.createdBy],
		references: [users.id],
	}),
	response: one(pmbFormResponses, {
		fields: [pmbFormTokens.id],
		references: [pmbFormResponses.tokenId],
	}),
}));

export const pmbFormResponsesRelations = relations(
	pmbFormResponses,
	({ one }) => ({
		token: one(pmbFormTokens, {
			fields: [pmbFormResponses.tokenId],
			references: [pmbFormTokens.id],
		}),
		processor: one(users, {
			fields: [pmbFormResponses.processedBy],
			references: [users.id],
		}),
		student: one(students, {
			fields: [pmbFormResponses.studentId],
			references: [students.id],
		}),
	}),
);

export const filesRelations = relations(files, ({ one }) => ({
	student: one(students, {
		fields: [files.studentId],
		references: [students.id],
	}),
	uploader: one(users, {
		fields: [files.uploadedBy],
		references: [users.id],
	}),
}));

export const backupJobsRelations = relations(backupJobs, ({ one }) => ({
	creator: one(users, {
		fields: [backupJobs.createdBy],
		references: [users.id],
	}),
}));

export const academicCalendarsRelations = relations(
	academicCalendars,
	({ many, one }) => ({
		creator: one(users, {
			fields: [academicCalendars.createdBy],
			references: [users.id],
		}),
		periods: many(academicPeriods),
		events: many(academicEvents),
	}),
);

export const academicPeriodsRelations = relations(
	academicPeriods,
	({ one }) => ({
		calendar: one(academicCalendars, {
			fields: [academicPeriods.calendarId],
			references: [academicCalendars.id],
		}),
	}),
);

export const academicEventsRelations = relations(academicEvents, ({ one }) => ({
	calendar: one(academicCalendars, {
		fields: [academicEvents.calendarId],
		references: [academicCalendars.id],
	}),
}));

export const classSchedulesRelations = relations(classSchedules, ({ one }) => ({
	dosen: one(users, {
		fields: [classSchedules.dosenId],
		references: [users.id],
	}),
	calendar: one(academicCalendars, {
		fields: [classSchedules.calendarId],
		references: [academicCalendars.id],
	}),
}));

export const practicumSchedulesRelations = relations(
	practicumSchedules,
	({ one }) => ({
		dosen: one(users, {
			fields: [practicumSchedules.dosenId],
			references: [users.id],
		}),
		calendar: one(academicCalendars, {
			fields: [practicumSchedules.calendarId],
			references: [academicCalendars.id],
		}),
	}),
);

export const dutySchedulesRelations = relations(dutySchedules, ({ one }) => ({
	calendar: one(academicCalendars, {
		fields: [dutySchedules.calendarId],
		references: [academicCalendars.id],
	}),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
	creator: one(users, {
		fields: [announcements.createdBy],
		references: [users.id],
	}),
}));

export const attendanceSessionsRelations = relations(
	attendanceSessions,
	({ one, many }) => ({
		classSchedule: one(classSchedules, {
			fields: [attendanceSessions.classScheduleId],
			references: [classSchedules.id],
		}),
		practicumSchedule: one(practicumSchedules, {
			fields: [attendanceSessions.practicumScheduleId],
			references: [practicumSchedules.id],
		}),
		dutySchedule: one(dutySchedules, {
			fields: [attendanceSessions.dutyScheduleId],
			references: [dutySchedules.id],
		}),
		creator: one(users, {
			fields: [attendanceSessions.createdBy],
			references: [users.id],
		}),
		records: many(attendanceRecords),
	}),
);

export const attendanceRecordsRelations = relations(
	attendanceRecords,
	({ one }) => ({
		session: one(attendanceSessions, {
			fields: [attendanceRecords.sessionId],
			references: [attendanceSessions.id],
		}),
		student: one(students, {
			fields: [attendanceRecords.studentId],
			references: [students.id],
		}),
		recorder: one(users, {
			fields: [attendanceRecords.recordedBy],
			references: [users.id],
		}),
	}),
);

export const odsAttendanceRecordsRelations = relations(
	odsAttendanceRecords,
	({ one }) => ({
		student: one(students, {
			fields: [odsAttendanceRecords.studentId],
			references: [students.id],
		}),
		recorder: one(users, {
			fields: [odsAttendanceRecords.recordedBy],
			references: [users.id],
		}),
	}),
);

export const pramagangAttendanceRecordsRelations = relations(
	pramagangAttendanceRecords,
	({ one }) => ({
		student: one(students, {
			fields: [pramagangAttendanceRecords.studentId],
			references: [students.id],
		}),
		recorder: one(users, {
			fields: [pramagangAttendanceRecords.recordedBy],
			references: [users.id],
		}),
	}),
);

export const coursesRelations = relations(courses, ({ one, many }) => ({
	dosen: one(users, {
		fields: [courses.dosenId],
		references: [users.id],
	}),
	meetings: many(courseMeetings),
}));

export const courseMeetingsRelations = relations(
	courseMeetings,
	({ one, many }) => ({
		course: one(courses, {
			fields: [courseMeetings.courseId],
			references: [courses.id],
		}),
		activities: many(courseMeetingActivities),
		attendances: many(courseMeetingAttendances),
	}),
);

export const courseMeetingActivitiesRelations = relations(
	courseMeetingActivities,
	({ one }) => ({
		meeting: one(courseMeetings, {
			fields: [courseMeetingActivities.meetingId],
			references: [courseMeetings.id],
		}),
	}),
);

export const courseMeetingAttendancesRelations = relations(
	courseMeetingAttendances,
	({ one }) => ({
		meeting: one(courseMeetings, {
			fields: [courseMeetingAttendances.meetingId],
			references: [courseMeetings.id],
		}),
		student: one(students, {
			fields: [courseMeetingAttendances.studentId],
			references: [students.id],
		}),
	}),
);
