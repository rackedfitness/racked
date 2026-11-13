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
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // nothing should ever embed Racked in a frame (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // geolocation is used for nearby-gym search; nothing needs mic/payment APIs
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
