import Link from "next/link";
import { getReports, updateReportStatus, adminDeleteWorkout, adminDeleteComment } from "@/app/admin/actions";
import SubmitButton from "@/components/SubmitButton";
import BackfillPrCountsButton from "@/components/BackfillPrCountsButton";
import { ArrowLeftIcon } from "@/components/UIIcons";

const STATUS_STYLES: Record<string, string> = {
  open: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  reviewed: "text-green-500 border-green-500/40 bg-green-500/10",
  dismissed: "text-muted border-card-border bg-card",
};

export default async function AdminPage() {
  const reports = await getReports();
  const open = reports.filter((r) => r.status === "open");
  const resolved = reports.filter((r) => r.status !== "open");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Admin</h1>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Tools</h2>
        <div className="rounded-lg border border-card-border bg-card p-4">
          <BackfillPrCountsButton />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          Reports {open.length > 0 && `(${open.length} open)`}
        </h2>

        {reports.length === 0 ? (
          <p className="text-sm text-muted">No reports have been submitted.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {[...open, ...resolved].map((r) => (
              <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-card-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                    {r.status}
                  </span>
                  <span className="text-xs text-muted">{new Date(r.created_at).toLocaleString()}</span>
                </div>

                <p className="text-sm">
                  <span className="text-muted">Reported by</span> @{r.reporter_username ?? "unknown"}
                  {r.reported_username && (
                    <>
                      {" "}
                      <span className="text-muted">against</span> @{r.reported_username}
                    </>
                  )}
                </p>
                <p className="text-sm italic">&ldquo;{r.reason}&rdquo;</p>

                {r.workout_id && (
                  <div className="rounded-md border border-card-border bg-background p-2 text-sm">
                    <Link href={`/workout/${r.workout_id}`} className="text-accent underline">
                      {r.workout_title ?? "View workout"}
                    </Link>
                  </div>
                )}
                {r.comment_id && (
                  <div className="rounded-md border border-card-border bg-background p-2 text-sm text-muted">
                    &ldquo;{r.comment_body}&rdquo;
                  </div>
                )}

                <div className="flex flex-wrap gap-2 border-t border-card-border pt-2">
                  {r.status === "open" && (
                    <>
                      <form action={updateReportStatus.bind(null, r.id, "reviewed")}>
                        <SubmitButton className="rounded-md border border-card-border px-2.5 py-1 text-xs font-medium">
                          Mark reviewed
                        </SubmitButton>
                      </form>
                      <form action={updateReportStatus.bind(null, r.id, "dismissed")}>
                        <SubmitButton className="rounded-md border border-card-border px-2.5 py-1 text-xs font-medium">
                          Dismiss
                        </SubmitButton>
                      </form>
                    </>
                  )}
                  {r.workout_id && (
                    <form action={adminDeleteWorkout.bind(null, r.workout_id)}>
                      <SubmitButton className="rounded-md border border-red-950 px-2.5 py-1 text-xs font-medium text-red-400">
                        Delete workout
                      </SubmitButton>
                    </form>
                  )}
                  {r.comment_id && (
                    <form action={adminDeleteComment.bind(null, r.comment_id)}>
                      <SubmitButton className="rounded-md border border-red-950 px-2.5 py-1 text-xs font-medium text-red-400">
                        Delete comment
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
