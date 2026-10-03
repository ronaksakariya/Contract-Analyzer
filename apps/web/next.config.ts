import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared package ships TypeScript source, so Next must transpile it.
  transpilePackages: ["@app/shared"],
  // In a monorepo, silence the multiple-lockfile warning by pinning the root.
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
