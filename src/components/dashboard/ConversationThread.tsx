export type ThreadMessage = {
  id: string;
  body: string;
  createdAt: string;
  isOwn: boolean;
  /** True when this message was sent by staff — labeled "ACOB Support Team" instead of a real name. */
  isStaff: boolean;
  senderLabel: string;
};

export function ConversationThread({ messages }: { messages: ThreadMessage[] }) {
  if (messages.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No messages yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.map((m) => (
        <div key={m.id} className={`flex ${m.isOwn ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[75%] rounded-lg border px-4 py-3 ${m.isOwn ? "border-accent/30 bg-accent/5" : "border-border bg-elevated"}`}>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium text-primary">{m.isStaff ? "ACOB Support Team" : m.senderLabel}</span>
              <span className="text-[10px] text-muted">{new Date(m.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm leading-relaxed text-secondary">{m.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
