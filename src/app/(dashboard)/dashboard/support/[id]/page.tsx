import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import {
  ConversationThread,
  type ThreadMessage,
} from "@/components/dashboard/ConversationThread";
import { ReplyComposer } from "@/components/dashboard/ReplyComposer";
import { StatusToggle } from "@/components/dashboard/StatusToggle";
import {
  staffReplyAction,
  setConversationStatusAction,
} from "@/lib/messaging/actions";

export const metadata: Metadata = { title: "Conversation" };

export default async function SupportConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requirePermission("support:view");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const { id } = await params;

  const conversation = await db.conversation.findUnique({
    where: { id },
  });

  if (!conversation) notFound();

  const session = await getCurrentSession();

  const rawMessages: {
    id: string;
    body: string;
    createdAt: Date;
    senderUserId: string;
    sender: {
      email: string;
      profile: { fullName: string } | null;
    } | null;
  }[] = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        include: {
          profile: true,
        },
      },
    },
  });

  const thread: ThreadMessage[] = rawMessages.map((m) => {
    const isStaffSender = m.senderUserId !== conversation.participantUserId;

    return {
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      isOwn: m.senderUserId === session?.id,
      isStaff: false,
      senderLabel: isStaffSender
        ? `${m.sender?.profile?.fullName ?? m.sender?.email ?? "Staff"} (Staff)`
        : (m.sender?.profile?.fullName ?? m.sender?.email ?? "Participant"),
    };
  });

  async function reply(body: string) {
    "use server";
    return staffReplyAction(id, body);
  }

  async function setStatus(status: "open" | "resolved") {
    "use server";
    return setConversationStatusAction(id, status);
  }

  return (
    <div>
      <DashboardPageHeader
        title="Conversation"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          {
            label: "Support Conversations",
            href: "/dashboard/support",
          },
          { label: "Conversation" },
        ]}
        actions={
          <StatusToggle status={conversation.status} onChange={setStatus} />
        }
      />

      <div className="max-w-2xl">
        <ConversationThread messages={thread} />

        <div className="mt-8 border-t border-border pt-6">
          <ReplyComposer
            onSubmit={reply}
            placeholder="Reply as ACOB Support Team..."
          />
        </div>
      </div>
    </div>
  );
}
