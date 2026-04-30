import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export", // Disabled for API routes/NextAuth
  distDir: "dist",
  images: {
    unoptimized: true,
  },
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;
