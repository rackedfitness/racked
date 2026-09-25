"use client";

import dynamic from "next/dynamic";

// Leaflet touches window/document at module scope, which crashes during
// server rendering — next/dynamic's ssr:false isn't allowed directly inside
// a Server Component, so this client-boundary wrapper is what lets a Server
// Component page (e.g. /gyms/detail) still render a map.
const GymMap = dynamic(() => import("@/components/GymMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-card" />,
});

export default GymMap;
