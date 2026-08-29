import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allows the ngrok tunnel (used for phone testing) to reach the dev server
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app"],
  // hides the dev-only "N" route indicator badge
  devIndicators: false,
};

export default nextConfig;
