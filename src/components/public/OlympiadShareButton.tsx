"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function OlympiadShareButton({ url }: { url: string }) {
  const [message, setMessage] = useState<string | null>(null);

  async function share() {
    setMessage(null);
    try {
      if (navigator.share) {
        await navigator.share({ url });
        setMessage("Share dialog opened");
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("Public link copied");
    } catch {
      setMessage("Could not share the public link");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" variant="secondary" onClick={share}>
        Share Olympiad
      </Button>
      {message ? <span className="text-xs text-muted">{message}</span> : null}
    </div>
  );
}
