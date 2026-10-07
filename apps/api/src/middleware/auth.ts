import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { validateAndTouchSession } from "../lib/session";

const isProduction = process.env.NODE_ENV === "production";
const INSECURE_DEFAULT_SECRETS = new Set([
	"super_secret_jwt_key_nusadaya_2026",
	"secretkey",
	"secret",
	"ganti_dengan_jwt_secret_acak_minimal_32_karakter",
	"your_secure_jwt_secret_key_minimum_32_characters",
]);

let resolvedJwtSecret = process.env.JWT_SECRET;

if (isProduction) {
	if (
		!resolvedJwtSecret ||
		INSECURE_DEFAULT_SECRETS.has(resolvedJwtSecret) ||
		resolvedJwtSecret.length < 32
	) {
		throw new Error(
			"[SECURITY CRITICAL] Server refusing to start in production: JWT_SECRET environment variable must be set to a secure random string (at least 32 characters) and cannot use default/demo keys.",
		);
	}
} else if (!resolvedJwtSecret) {
	resolvedJwtSecret = "dev_secret_key_nusadaya_local_only_not_for_prod_2026";
}

const JWT_SECRET: string = resolvedJwtSecret;

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
