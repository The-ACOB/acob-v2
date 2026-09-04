import "server-only";
import { db } from "@/lib/db/client";
import type { ActivePopup } from "@/components/effects/PopupBanner";

/** The single highest-priority popup that's active and within its date window, or null. */
export async function getActivePopup(): Promise<ActivePopup | null> {
  const candidates: {
    id: string;
    content: string;
    ctaLabel: string | null;
    ctaUrl: string | null;
    startAt: Date | null;
    endAt: Date | null;
  }[] = await db.popup.findMany({ where: { active: true }, orderBy: { priority: "desc" } });

  const now = Date.now();
  const live = candidates.find(
    (p) => (!p.startAt || p.startAt.getTime() <= now) && (!p.endAt || p.endAt.getTime() >= now)
  );

  if (!live) return null;
  return { id: live.id, content: live.content, ctaLabel: live.ctaLabel, ctaUrl: live.ctaUrl };
}
