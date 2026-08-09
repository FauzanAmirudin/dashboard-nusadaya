import { Elysia } from "elysia";
import { exportRoutes } from "./routes/export.routes";

export const exportModule = new Elysia().use(exportRoutes);
