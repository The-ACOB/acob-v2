import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  actorId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Records a security-sensitive event. Never pass passwords, tokens, or
 * other secrets in `metadata` — this table is meant to be safe to
 * display to an admin.
 */
export async function recordAudit({ actorId, action, targetType, targetId, metadata }: AuditInput) {
  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
    userAgent = h.get("user-agent") ?? null;
  } catch {
    // headers() is unavailable outside a request context (e.g. seed scripts).
  }

  await db.auditLog.create({
    data: { actorId, action, targetType, targetId, metadata, ipAddress: ip, userAgent },
  });
}
