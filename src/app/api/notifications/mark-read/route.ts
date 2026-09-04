import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/authz/guards";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/notifications";

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

  if (body.all) {
    await markAllNotificationsRead(session.id);
    return NextResponse.json({ ok: true });
  }

  if (typeof body.id === "string") {
    const result = await markNotificationRead(body.id, session.id);
    return NextResponse.json(result, { status: result.ok ? 200 : 403 });
  }

  return NextResponse.json({ ok: false, error: "Missing id or all." }, { status: 400 });
}
