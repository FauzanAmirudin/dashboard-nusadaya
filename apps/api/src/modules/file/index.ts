import { Elysia } from "elysia";
import { deleteRoute } from "./routes/delete";
import { downloadRoute } from "./routes/download";
import { metadataRoute } from "./routes/metadata";
import { uploadRoute } from "./routes/upload";

/**
 * fileModule — aggregator router untuk semua endpoint file.
 * Di-mount di index.ts via .use(fileModule).
 */
export const fileModule = new Elysia()
	.use(uploadRoute)
	.use(downloadRoute)
	.use(deleteRoute)
	.use(metadataRoute);
