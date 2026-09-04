"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { fieldClasses } from "@/components/ui/FormField";
import { useToast } from "@/components/dashboard/Toast";
import type { ActionResult } from "@/lib/auth/actions";

export function ReplyComposer({
  onSubmit,
  placeholder = "Write a reply...",
}: {
  onSubmit: (body: string) => Promise<ActionResult>;
  placeholder?: string;
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSend() {
    if (!body.trim()) return;
    setPending(true);
    const result = await onSubmit(body);
    setPending(false);
    if (!result.ok) {
      toast("error", "Could not send", result.error);
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`${fieldClasses} resize-none`}
      />
      <Button variant="primary" className="w-fit text-xs" disabled={pending || !body.trim()} onClick={handleSend}>
        {pending ? "Sending…" : "Send"}
      </Button>
    </div>
  );
}
