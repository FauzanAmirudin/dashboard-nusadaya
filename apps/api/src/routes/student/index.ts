import { Elysia } from "elysia";
import { cacheInvalidatePattern } from "../../lib/cache";
import { academicRoutes } from "./academic";
import { coreRoutes } from "./core";
import { crmRoutes } from "./crm";
import { departureAssessmentRoutes } from "./departure-assessment";
import { documentsRoutes } from "./documents";
import { finalDecisionRoutes } from "./final-decision";
import { financeRoutes } from "./finance";
import { internalNotesRoutes } from "./internal-notes";
import { internshipRoutes } from "./internship";
import { paRoutes } from "./pa";
import { pmbRoutes } from "./pmb";
import { statusRoutes } from "./status";

export const studentsRouter = new Elysia({ prefix: "/students" })
	.onAfterResponse(async ({ request, set }) => {
		if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
			const status = typeof set.status === "number" ? set.status : 200;
			if (status < 400) {
				await Promise.all([
					cacheInvalidatePattern("cache:students:*"),
					cacheInvalidatePattern("cache:student:*"),
					cacheInvalidatePattern("cache:mahasiswa:*"),
					cacheInvalidatePattern("cache:dashboard:*"),
				]);
			}
		}
	})
	.use(departureAssessmentRoutes)
	.use(coreRoutes)
	.use(statusRoutes)
	.use(pmbRoutes)
	.use(crmRoutes)
	.use(financeRoutes)
	.use(academicRoutes)
	.use(paRoutes)
	.use(internshipRoutes)
	.use(finalDecisionRoutes)
	.use(internalNotesRoutes)
	.use(documentsRoutes);
