import { Elysia } from "elysia";
import { academicRoutes } from "./academic";
import { coreRoutes } from "./core";
import { crmRoutes } from "./crm";
import { documentsRoutes } from "./documents";
import { finalDecisionRoutes } from "./final-decision";
import { financeRoutes } from "./finance";
import { internalNotesRoutes } from "./internal-notes";
import { internshipRoutes } from "./internship";
import { paRoutes } from "./pa";
import { pmbRoutes } from "./pmb";
import { statusRoutes } from "./status";

export const studentsRouter = new Elysia({ prefix: "/students" })
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
