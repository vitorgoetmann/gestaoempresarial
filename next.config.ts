import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages that should not be bundled by Turbopack (e.g., native modules)
  serverExternalPackages: ["argon2"],
};

export default nextConfig;
