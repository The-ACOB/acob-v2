import type { Metadata } from "next";
import Image from "next/image";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { generateVerifyQrDataUrl } from "@/lib/certificates/qr";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { IssueCertificateForm } from "@/components/dashboard/IssueCertificateForm";
import { RevokeCertificateButton } from "@/components/dashboard/RevokeCertificateButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Certificates" };

const ACHIEVEMENT_LABELS: Record<string, string> = {
  prime: "Prime",
  elite: "Elite",
  merit: "Merit",
  honourable_mention: "Honourable Mention",
  participation: "Participation",
};

type StaffCertRow = {
  id: string;
  certificateId: string;
  achievement: string;
  status: "valid" | "revoked";
  issuedAt: Date;
  recipient: { email: string; profile: { fullName: string } | null } | null;
  olympiad: { title: string } | null;
};

export default async function CertificatesPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const canIssue = await hasPermission("certificate:issue");

  if (canIssue) {
    const [certificates, olympiads]: [
      StaffCertRow[],
      { id: string; title: string }[],
    ] = await Promise.all([
      db.certificate.findMany({
        orderBy: { issuedAt: "desc" },
        take: 50,
        include: {
          recipient: {
            include: {
              profile: true,
            },
          },
          olympiad: true,
        },
      }),
      db.olympiad.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    ]);

    const columns: Column<StaffCertRow>[] = [
      {
        header: "Certificate ID",
        cell: (r) => (
          <span className="font-mono text-xs text-primary">
            {r.certificateId}
          </span>
        ),
      },
      {
        header: "Recipient",
        cell: (r) =>
          r.recipient?.profile?.fullName ?? r.recipient?.email ?? "Unknown",
      },
      { header: "Olympiad", cell: (r) => r.olympiad?.title ?? "—" },
      {
        header: "Achievement",
        cell: (r) => (
          <Badge tone="neutral">{ACHIEVEMENT_LABELS[r.achievement]}</Badge>
        ),
      },
      {
        header: "Status",
        cell: (r) => (
          <Badge tone={r.status === "valid" ? "success" : "error"}>
            {r.status}
          </Badge>
        ),
      },
      {
        header: "",
        hideLabel: true,
        cell: (r) =>
          r.status === "valid" ? <RevokeCertificateButton id={r.id} /> : null,
      },
    ];

    return (
      <div>
        <DashboardPageHeader
          title="Certificates"
          description="Issue and manage ACOB Olympiad certificates."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Certificates" },
          ]}
        />
        <div className="mb-10 max-w-xl">
          <IssueCertificateForm olympiads={olympiads} />
        </div>
        <DataTable
          columns={columns}
          rows={certificates}
          getRowId={(r) => r.id}
          emptyTitle="No certificates issued yet"
        />
      </div>
    );
  }

  // Participant / Ambassador — own certificates only
  const own: {
    id: string;
    certificateId: string;
    verificationToken: string;
    achievement: string;
    status: "valid" | "revoked";
    issuedAt: Date;
    fileUrl: string | null;
    olympiad: { title: string } | null;
  }[] = await db.certificate.findMany({
    where: { userId: session.id },
    orderBy: { issuedAt: "desc" },
    include: {
      olympiad: true,
    },
  });

  return (
    <div>
      <DashboardPageHeader
        title="My Certificates"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Certificates" },
        ]}
      />

      {own.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="Certificates you earn will appear here once issued."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {await Promise.all(
            own
              .filter((c) => c.status === "valid")
              .map(async (c) => {
                const qr = await generateVerifyQrDataUrl(c.verificationToken);
                return (
                  <div
                    key={c.id}
                    className="flex flex-col gap-4 rounded-lg border border-border bg-elevated p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-lg text-primary">
                          {ACHIEVEMENT_LABELS[c.achievement]}
                        </p>
                        <p className="mt-1 text-sm text-secondary">
                          {c.olympiad?.title}
                        </p>
                        <p className="mt-2 font-mono text-xs text-muted">
                          {c.certificateId}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Issued {c.issuedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <Image
                        src={qr}
                        alt="Verification QR code"
                        width={80}
                        height={80}
                        className="shrink-0 rounded"
                        unoptimized
                      />
                    </div>
                    {c.fileUrl ? (
                      <a
                        href={c.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-fit text-xs text-accent underline underline-offset-4"
                      >
                        Download certificate
                      </a>
                    ) : (
                      <p className="text-xs text-muted">
                        File not yet uploaded — contact ACOB if you need this
                        urgently.
                      </p>
                    )}
                  </div>
                );
              }),
          )}
        </div>
      )}
    </div>
  );
}
