import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactStrictMode: true,
  transpilePackages: ["@repo/design-system"],
};

export default nextConfig;
