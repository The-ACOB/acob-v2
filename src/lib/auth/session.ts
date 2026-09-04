import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { randomBytes } from "crypto";
import { db } from "@/lib/db/client";

const SESSION_COOKIE = "acob_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 15; // renew past halfway

function generateSessionId(): string {
  return randomBytes(32).toString("base64url");
}

async function getRequestMeta() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;
  return { ip, userAgent };
}

export async function createSession(userId: string) {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const { ip, userAgent } = await getRequestMeta();

  await db.session.create({
    data: { id, userId, expiresAt, ipAddress: ip, userAgent },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return id;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (id) {
    await db.session.deleteMany({ where: { id } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: string;
  email: string;
  status: "active" | "suspended";
  emailVerified: boolean;
  fullName: string | null;
  roleKeys: string[];
};

/**
 * Resolves the current session from the request cookie, validating
 * expiry server-side and transparently renewing sessions that are past
 * the halfway point of their lifetime. Cached per-request so multiple
 * `requireAuth()`-style calls in one render don't hit the database
 * repeatedly.
 */
export const getCurrentSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: {
          profile: true,
          userRoles: { include: { role: true } },
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: sessionId } });
    return null;
  }

  // Sliding expiration: extend if we're past the halfway point. Cookie
  // mutation is only valid from Server Actions/Route Handlers/middleware,
  // not during a Server Component render — this is best-effort and is
  // silently skipped when called from a read-only render context.
  const remaining = session.expiresAt.getTime() - Date.now();
  if (remaining < SESSION_DURATION_MS - SESSION_RENEW_THRESHOLD_MS) {
    try {
      const newExpiry = new Date(Date.now() + SESSION_DURATION_MS);
      await db.session.update({ where: { id: sessionId }, data: { expiresAt: newExpiry } });
      cookieStore.set(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: newExpiry,
      });
    } catch {
      // Called from a Server Component render — renewal will happen on
      // the next request made from a Server Action or Route Handler.
    }
  }

  return {
    id: session.user.id,
    email: session.user.email,
    status: session.user.status,
    emailVerified: Boolean(session.user.emailVerifiedAt),
    fullName: session.user.profile?.fullName ?? null,
    roleKeys: session.user.userRoles.map((ur: { role: { key: string } }) => ur.role.key),
  };
});
