import type { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { ConversationThread, type ThreadMessage } from "@/components/dashboard/ConversationThread";
import { ReplyComposer } from "@/components/dashboard/ReplyComposer";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { sendMyMessageAction } from "@/lib/messaging/actions";

export const metadata: Metadata = { title: "Messages" };

export default async function MyMessagesPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const conversation = await db.conversation.findFirst({ where: { participantUserId: session.id } });

  async function send(body: string) {
    "use server";
    return sendMyMessageAction(body);
  }

  let thread: ThreadMessage[] = [];
  if (conversation) {
    const rawMessages: {
      id: string;
      body: string;
      createdAt: Date;
      senderUserId: string;
    }[] = await db.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "asc" } });

    thread = rawMessages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      isOwn: m.senderUserId === session.id,
      isStaff: m.senderUserId !== session.id,
      senderLabel: m.senderUserId === session.id ? "You" : "ACOB Support Team",
    }));
  }

  return (
    <div>
      <DashboardPageHeader
        title="Messages"
        description="Your conversation with ACOB Support."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Messages" }]}
        actions={
          conversation ? (
            <Badge tone={conversation.status === "open" ? "warning" : "success"}>
              {conversation.status === "open" ? "Open" : "Resolved"}
            </Badge>
          ) : undefined
        }
      />

      <div className="max-w-2xl">
        {!conversation ? (
          <EmptyState
            title="No messages yet"
            description="Send a message below to start a conversation with ACOB Support."
          />
        ) : (
          <ConversationThread messages={thread} />
        )}

        <div className="mt-8 border-t border-border pt-6">
          <ReplyComposer onSubmit={send} placeholder="Message ACOB Support..." />
        </div>
      </div>
    </div>
  );
}
