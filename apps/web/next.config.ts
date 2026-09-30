import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  typedRoutes: true,
  reactStrictMode: true,
  transpilePackages: ["@repo/design-system"],
  typescript: {
    ignoreBuildErrors: process.env.SKIP_CHECKS === "1",
  },
};

export default nextConfig;
