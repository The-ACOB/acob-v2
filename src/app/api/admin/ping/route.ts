import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/authz/guards";

/**
 * Example executive-only route. Demonstrates requireRole() rejecting
 * anyone who isn't CEO/COO/CTO server-side — authorization is enforced
 * here, not by hiding a link in the UI.
 */
export async function GET() {
  try {
    const session = await requireRole("CEO", "COO", "CTO");
    return NextResponse.json({ ok: true, actor: session.email, roles: session.roleKeys });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
