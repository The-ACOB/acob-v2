import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { ConversationThread, type ThreadMessage } from "@/components/dashboard/ConversationThread";
import { ReplyComposer } from "@/components/dashboard/ReplyComposer";
import { StatusToggle } from "@/components/dashboard/StatusToggle";
import { replyToContactAction, setContactStatusAction } from "@/lib/contact/actions";

export const metadata: Metadata = { title: "Contact Message" };

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("contact:view");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const { id } = await params;
  const submission = await db.contactSubmission.findUnique({ where: { id } });
  if (!submission) notFound();

  const replies: { id: string; body: string; createdAt: Date }[] = await db.contactReply.findMany({
    where: { submissionId: id },
    orderBy: { createdAt: "asc" },
  });

  const thread: ThreadMessage[] = [
    {
      id: "original",
      body: submission.message,
      createdAt: submission.createdAt.toISOString(),
      isOwn: false,
      isStaff: false,
      senderLabel: submission.name,
    },
    ...replies.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      isOwn: true,
      isStaff: true,
      senderLabel: "ACOB Support Team",
    })),
  ];

  async function reply(body: string) {
    "use server";
    return replyToContactAction(id, body);
  }

  async function setStatus(status: "open" | "resolved") {
    "use server";
    return setContactStatusAction(id, status);
  }

  return (
    <div>
      <DashboardPageHeader
        title={submission.subject}
        description={`${submission.name} · ${submission.email}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Contact Inbox", href: "/dashboard/contact" },
          { label: submission.subject },
        ]}
        actions={<StatusToggle status={submission.status} onChange={setStatus} />}
      />

      <div className="max-w-2xl">
        <ConversationThread messages={thread} />
        <div className="mt-8 border-t border-border pt-6">
          <ReplyComposer onSubmit={reply} placeholder="Reply as ACOB Support Team..." />
        </div>
      </div>
    </div>
  );
}
