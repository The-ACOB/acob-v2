import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import {
  awardForRank,
  finalizeOlympiadResults,
  isOlympiadFinished,
} from "@/lib/olympiads/results";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Olympiad Rankings" };

type ResultRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  score: number | null;
  totalMarks: number | null;
  position: number | null;
  award: ReturnType<typeof awardForRank>;
};

function statusLabel(status: string) {
  if (status === "registered") return "Not started";
  if (status === "expired_auto_submitted") return "Auto-submitted";
  if (status === "disqualified") return "Disqualified";
  if (status === "submitted") return "Submitted";
  if (status === "in_progress") return "In progress";
  return status.replace(/_/g, " ");
}

export default async function OlympiadResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requirePermission("olympiad:results:view");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard/results");
    throw err;
  }

  const { id } = await params;
  const olympiad = await db.olympiad.findUnique({ where: { id } });
  if (!olympiad) notFound();

  if (isOlympiadFinished(olympiad.endAt)) {
    await finalizeOlympiadResults(id);
  }

  const [freshOlympiad, registrations] = await Promise.all([
    db.olympiad.findUnique({ where: { id } }),
    db.olympiadRegistration.findMany({
      where: { olympiadId: id },
      orderBy: { registeredAt: "asc" },
      include: {
        user: { include: { profile: true } },
      },
    }),
  ]);

  if (!freshOlympiad) notFound();

  const attempts = await db.attempt.findMany({
    where: { olympiadId: id },
    select: {
      id: true,
      userId: true,
      status: true,
      score: true,
      totalMarks: true,
      rank: true,
    },
  });

  const attemptByUser = new Map(attempts.map((attempt) => [attempt.userId, attempt]));

  const rows: ResultRow[] = registrations
    .map((registration) => {
      const attempt = attemptByUser.get(registration.userId);
      const position = attempt?.rank ?? null;
      const eligible = Boolean(
        attempt &&
          (attempt.status === "submitted" || attempt.status === "expired_auto_submitted") &&
          position,
      );

      return {
        id: attempt?.id ?? registration.id,
        name: registration.user.profile?.fullName ?? "Unnamed participant",
        email: registration.user.email,
        phone: registration.user.profile?.phone ?? "Not provided",
        status: attempt?.status ?? "registered",
        score: attempt?.score ?? null,
        totalMarks: attempt?.totalMarks ?? null,
        position: eligible ? position : null,
        award: eligible ? awardForRank(position) : null,
      };
    })
    .sort((a, b) => {
      if (a.position !== null && b.position !== null) return a.position - b.position;
      if (a.position !== null) return -1;
      if (b.position !== null) return 1;
      return a.name.localeCompare(b.name);
    });

  const ranked = rows.filter((row) => row.position !== null);
  const noRecognition = rows.length - ranked.length;

  return (
    <div>
      <DashboardPageHeader
        title={freshOlympiad.title}
        description="Final ranking, participant details, and recognition for this Olympiad only."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Results & Rankings", href: "/dashboard/results" },
          { label: freshOlympiad.title },
        ]}
        actions={
          <Badge tone={freshOlympiad.resultsPublishedAt ? "success" : "warning"}>
            {freshOlympiad.resultsPublishedAt ? "Results published" : "Results ready to publish"}
          </Badge>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Registered", rows.length],
          ["Ranked", ranked.length],
          ["Prime / Elite / Merit", ranked.filter((r) => r.position !== null && r.position <= 3).length],
          ["No recognition", noRecognition],
        ].map(([label, value]) => (
          <div key={String(label)} className="border border-border bg-elevated p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{label}</p>
            <p className="mt-2 font-display text-2xl text-primary">{value}</p>
          </div>
        ))}
      </div>

      {ranked.length > 0 ? (
        <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Top three winners">
          {([1, 2, 3] as const).map((position) => {
            const winner = ranked.find((row) => row.position === position);
            return (
              <div key={position} className="border border-border bg-elevated p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  {position === 1 ? "1st · Prime" : position === 2 ? "2nd · Elite" : "3rd · Merit"}
                </p>
                {winner ? (
                  <>
                    <p className="mt-2 font-display text-lg text-primary">{winner.name}</p>
                    <p className="mt-1 text-xs text-secondary">{winner.email}</p>
                    <p className="mt-2 font-mono text-xs text-muted">
                      {winner.score} / {winner.totalMarks ?? "—"}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted">No participant at this position.</p>
                )}
              </div>
            );
          })}
        </section>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-border bg-elevated p-4 text-sm">
        <div>
          <p className="font-medium text-primary">Recognition rules</p>
          <p className="mt-1 text-secondary">
            1st Prime · 2nd Elite · 3rd Merit · 4th–10th Honourable Mention · 11th+ Participation
          </p>
          <p className="mt-1 text-xs text-muted">
            Registration without an exam attempt and disqualified attempts receive no position or recognition.
          </p>
        </div>
        <Link
          href={`/dashboard/olympiads/${id}`}
          className="text-xs font-medium text-accent underline underline-offset-4"
        >
          Open Olympiad management
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-elevated">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-black/10 text-xs font-mono uppercase tracking-wider text-muted">
              <th className="p-4">Position</th>
              <th className="p-4">Participant</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Status</th>
              <th className="p-4">Score</th>
              <th className="p-4">Recognition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.02]">
                <td className="p-4 font-mono font-medium text-primary">
                  {row.position ? `#${row.position}` : "—"}
                </td>
                <td className="p-4 font-medium text-primary">{row.name}</td>
                <td className="p-4 text-secondary">{row.email}</td>
                <td className="p-4 text-secondary">{row.phone}</td>
                <td className="p-4">
                  <Badge tone={row.status === "disqualified" ? "error" : row.position ? "success" : "neutral"}>
                    {statusLabel(row.status)}
                  </Badge>
                </td>
                <td className="p-4 font-mono tabular-nums text-secondary">
                  {row.score !== null ? `${row.score} / ${row.totalMarks ?? "—"}` : "—"}
                </td>
                <td className="p-4">
                  {row.award ? (
                    <Badge tone={row.position !== null && row.position <= 3 ? "success" : "neutral"}>
                      {row.award}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted">No recognition</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
