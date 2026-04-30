import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export", // Disabled for API routes/NextAuth
  // distDir: "dist", // Use default .next for Vercel compatibility
  images: {
    unoptimized: true,
  },
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;
