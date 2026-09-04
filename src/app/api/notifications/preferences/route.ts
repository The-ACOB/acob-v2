import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/authz/guards";
import { updateNotificationPreferences } from "@/lib/notifications";

export async function POST(req: Request) {
  let session;
  try {
    session = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    throw err;
  }

  const body = await req.json();

  await updateNotificationPreferences(session.id, {
    emailEnabled: Boolean(body.emailEnabled),
    inAppEnabled: Boolean(body.inAppEnabled),
  });

  return NextResponse.json({ ok: true });
}
