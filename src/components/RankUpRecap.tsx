"use client";

import { useState } from "react";
import RankUpOverlay, { type RankUpToast } from "@/components/RankUpOverlay";

export default function RankUpRecap({ events }: { events: RankUpToast[] }) {
  const [queue, setQueue] = useState(events);
  return <RankUpOverlay event={queue[0] ?? null} onDone={() => setQueue((q) => q.slice(1))} />;
}
