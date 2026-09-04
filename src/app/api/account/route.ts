import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/authz/guards";

/**
 * Returns the authenticated user's own account info. Demonstrates
 * requireAuth() protecting a route handler — no session cookie, no
 * response body beyond a 401.
 */
export async function GET() {
  try {
    const session = await requireAuth();
    return NextResponse.json({
      id: session.id,
      email: session.email,
      roles: session.roleKeys,
      emailVerified: session.emailVerified,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
