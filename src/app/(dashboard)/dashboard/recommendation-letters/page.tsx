import type { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { CreateLetterForm } from "@/components/dashboard/CreateLetterForm";
import { LetterActions } from "@/components/dashboard/LetterActions";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Recommendation Letters" };

type LetterRow = {
  id: string;
  title: string;
  status: "draft" | "published" | "revoked";
  createdAt: Date;
  recipient: { email: string; profile: { fullName: string } | null } | null;
};

type ParticipantOption = { id: string; name: string; email: string };

const STATUS_TONE = {
  draft: "neutral",
  published: "success",
  revoked: "error",
} as const;

export default async function RecommendationLettersPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const canCreate = await hasPermission("recommendation_letter:create");

  if (canCreate) {
    const [letters, participants] = await Promise.all([
      db.recommendationLetter.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          recipient: {
            include: {
              profile: true,
            },
          },
        },
      }),
      db.participant.findMany({
        take: 200,
        orderBy: { createdAt: "desc" },
        include: { user: { include: { profile: true } } },
      }),
    ]);

    const participantOptions: ParticipantOption[] = participants.map(
      (participant) => ({
        id: participant.userId,
        name: participant.user.profile?.fullName ?? "Unnamed participant",
        email: participant.user.email,
      }),
    );

    const columns: Column<LetterRow>[] = [
      {
        header: "Recipient",
        cell: (r) =>
          r.recipient?.profile?.fullName ?? r.recipient?.email ?? "Unknown",
      },
      { header: "Title", cell: (r) => r.title },
      {
        header: "Status",
        cell: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>,
      },
      {
        header: "Created",
        cell: (r) => (
          <span className="text-xs text-muted">
            {r.createdAt.toLocaleDateString()}
          </span>
        ),
      },
      {
        header: "",
        hideLabel: true,
        cell: (r) => <LetterActions id={r.id} status={r.status} />,
      },
    ];

    return (
      <div>
        <DashboardPageHeader
          title="Recommendation Letters"
          description="Create, publish, and manage recommendation letters."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Recommendation Letters" },
          ]}
        />

        <div className="mb-10 max-w-xl">
          <CreateLetterForm participants={participantOptions} />
        </div>

        <DataTable
          columns={columns}
          rows={letters}
          getRowId={(r) => r.id}
          emptyTitle="No letters yet"
        />
      </div>
    );
  }

  // Participant / Ambassador — own published letters only
  const own: {
    id: string;
    title: string;
    body: string | null;
    fileUrl: string | null;
    publishedAt: Date | null;
  }[] = await db.recommendationLetter.findMany({
    where: {
      userId: session.id,
      status: "published",
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <DashboardPageHeader
        title="Recommendation Letters"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Recommendation Letters" },
        ]}
      />

      {own.length === 0 ? (
        <EmptyState
          title="No letters available"
          description="Published recommendation letters will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {own.map((l) => (
            <div
              key={l.id}
              className="rounded-lg border border-border bg-elevated p-5"
            >
              <p className="font-display text-lg text-primary">{l.title}</p>

              {l.publishedAt ? (
                <p className="mt-1 text-xs text-muted">
                  Published {l.publishedAt.toLocaleDateString()}
                </p>
              ) : null}

              {l.body ? (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-secondary">
                  {l.body}
                </p>
              ) : null}

              {l.fileUrl ? (
                <a
                  href={l.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-xs text-accent underline underline-offset-4"
                >
                  Download
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
