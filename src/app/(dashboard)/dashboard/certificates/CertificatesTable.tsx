"use client";

import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { RevokeCertificateButton } from "@/components/dashboard/RevokeCertificateButton";

const ACHIEVEMENT_LABELS: Record<string, string> = {
  prime: "Prime",
  elite: "Elite",
  merit: "Merit",
  honourable_mention: "Honourable Mention",
  participation: "Participation",
};

export type StaffCertRow = {
  id: string;
  certificateId: string;
  achievement: string;
  status: "valid" | "revoked";
  issuedAt: Date;
  recipient: { email: string; profile: { fullName: string } | null } | null;
  olympiad: { title: string } | null;
};

export default function CertificatesTable({
  certificates,
}: {
  certificates: StaffCertRow[];
}) {
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
    <DataTable
      columns={columns}
      rows={certificates}
      getRowId={(r) => r.id}
      emptyTitle="No certificates issued yet"
    />
  );
}
