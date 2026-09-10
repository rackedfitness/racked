"use client";

import { useEffect } from "react";
import { markNotificationsRead } from "@/app/social/actions";

// Fires once per visit to /notifications. The page's own data was already
// fetched (and still shows the pre-read state for this render) before this
// runs, so the unread dots you see on arrival are accurate — only the next
// visit reflects everything as read.
export default function MarkNotificationsReadOnMount() {
  useEffect(() => {
    markNotificationsRead();
  }, []);
  return null;
}
