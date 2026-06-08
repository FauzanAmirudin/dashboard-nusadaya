import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";

export const authSetup = new Elysia()
	.use(
		jwt({
			name: "jwt",
			secret: process.env.JWT_SECRET || "super_secret_jwt_key_nusadaya_2026",
		}),
	)
	.use(cookie())
	.derive(async ({ jwt, cookie: { auth } }) => {
		if (!auth.value) {
			return { user: null };
		}
		const profile = await jwt.verify(auth.value);
		if (!profile) {
			return { user: null };
		}
		return {
			user: profile as { id: number; username: string; role: string },
		};
	});
