import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { validateAndTouchSession } from "../lib/session";

const JWT_SECRET =
	process.env.JWT_SECRET || "super_secret_jwt_key_nusadaya_2026";

// Export JWT_SECRET for reuse
export { JWT_SECRET };

// authSetup is used to define jwt/cookie plugins and session derivation
export const authSetup = new Elysia({ name: "auth-base" })
	.use(
		jwt({
			name: "jwt",
			secret: JWT_SECRET,
		}),
	)
	.use(cookie())
	.derive(async ({ jwt, cookie: { auth }, request }) => {
		let token: string | null = null;

		// 1. Try Bearer token from Authorization header (supports cross-origin dev)
		const authHeader = request.headers.get("authorization");
		if (authHeader?.startsWith("Bearer ")) {
			token = authHeader.slice(7);
		} else if (auth?.value) {
			// 2. Fallback to cookie (same-origin)
			token = auth.value as string;
		} else {
			// 3. Fallback to token in URL query parameter
			try {
				const url = new URL(request.url);
				const queryToken = url.searchParams.get("token");
				if (queryToken) {
					token = queryToken;
				}
			} catch {
				// Ignore URL parse error
			}
		}

		if (!token) {
			return {
				user: null,
				sessionStatus: "unauthenticated" as const,
				sessionId: null,
			};
		}

		const profile = await jwt.verify(token);
		if (!profile) {
			return {
				user: null,
				sessionStatus: "invalid_token" as const,
				sessionId: null,
			};
		}

		const userPayload = profile as {
			id: number;
			username: string;
			role: string;
			roles?: string[];
			sessionId?: string;
		};

		// 4. If token contains sessionId, validate with server-side session in Redis
		if (userPayload.sessionId) {
			const sessionValidation = await validateAndTouchSession(
				userPayload.sessionId,
			);
			if (!sessionValidation.valid) {
				return {
					user: null,
					sessionStatus: sessionValidation.reason || "invalid_session",
					sessionId: userPayload.sessionId,
				};
			}
		}

		return {
			user: userPayload,
			sessionStatus: "valid" as const,
			sessionId: userPayload.sessionId || null,
		};
	});
