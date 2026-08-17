import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typescript: {
		ignoreBuildErrors: true,
	},
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination:
					process.env.NODE_ENV === "development"
						? "http://127.0.0.1:3001/:path*"
						: "http://api:3001/:path*",
			},
		];
	},
	experimental: {
		optimizePackageImports: ["lucide-react", "recharts", "@base-ui/react"],
	},
};

export default nextConfig;
