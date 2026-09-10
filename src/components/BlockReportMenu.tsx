"use client";

import { useState, useTransition } from "react";
import { blockUser, unblockUser } from "@/app/moderation/actions";
import ReportModal from "@/components/ReportModal";
import { MenuDotsIcon } from "@/components/UIIcons";

export default function BlockReportMenu({ userId, isBlocked }: { userId: string; isBlocked: boolean }) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleBlock() {
    setOpen(false);
    startTransition(async () => {
      if (isBlocked) await unblockUser(userId);
      else await blockUser(userId);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-card-border text-muted active:bg-background"
      >
        <MenuDotsIcon size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-20 min-w-[10rem] overflow-hidden rounded-md border border-card-border bg-card shadow-lg">
            <button
              type="button"
              onClick={toggleBlock}
              disabled={isPending}
              className="block w-full px-3 py-2.5 text-left text-sm text-red-400 active:bg-red-400/10 disabled:opacity-50"
            >
              {isBlocked ? "Unblock" : "Block"}
            </button>
            {!isBlocked && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setReportOpen(true);
                }}
                className="block w-full border-t border-card-border px-3 py-2.5 text-left text-sm active:bg-accent/10"
              >
                Report
              </button>
            )}
          </div>
        </>
      )}
      {reportOpen && <ReportModal reportedUserId={userId} onClose={() => setReportOpen(false)} />}
    </div>
  );
}
