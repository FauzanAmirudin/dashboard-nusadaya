import { Elysia } from "elysia";
import { backupRoutes } from "./routes/backup.routes";

/**
 * backupModule — aggregator router untuk semua endpoint backup.
 * Di-mount di index.ts via .use(backupModule).
 */
export const backupModule = new Elysia().use(backupRoutes);
