import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allows the ngrok tunnel (used for phone testing) to reach the dev server
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app"],
  // hides the dev-only "N" route indicator badge
  devIndicators: false,
  experimental: {
    // default 1mb is too small for a multi-year Strong/Hevy CSV export
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
