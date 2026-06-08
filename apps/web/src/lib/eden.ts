import { edenTreaty } from "@elysiajs/eden";
import type { App } from "../../../api/src/index";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Create the Eden treaty client with end-to-end type safety from Elysia backend
export const api = edenTreaty<App>(API_URL);
