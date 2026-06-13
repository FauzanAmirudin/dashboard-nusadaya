import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_nusadaya_2026";

// Export JWT_SECRET for reuse
export { JWT_SECRET };

// authSetup is now only used to define the jwt/cookie plugins at the root level.
// The actual user derivation must happen inline in each router to avoid Elysia's plugin caching.
export const authSetup = new Elysia({ name: "auth-base" })
	.use(
		jwt({
			name: "jwt",
			secret: JWT_SECRET,
		}),
	)
	.use(cookie())
	.derive(async ({ jwt, cookie: { auth }, request }) => {
		// 1. Try Bearer token from Authorization header (supports cross-origin dev)
		const authHeader = request.headers.get("authorization");
		if (authHeader?.startsWith("Bearer ")) {
			const token = authHeader.slice(7);
			const profile = await jwt.verify(token);
			if (profile) {
				return {
					user: profile as { id: number; username: string; role: string },
				};
			}
		}

		// 2. Fallback to cookie (same-origin)
		if (auth.value) {
			const profile = await jwt.verify(auth.value as string);
			if (profile) {
				return {
					user: profile as { id: number; username: string; role: string },
				};
			}
		}

		return { user: null };
	});
