import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { updateParticipantProfileAction } from "@/lib/participants/actions";
import { db } from "@/lib/db/client";

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { gender, institution, gradeLevel } = body;

    // Fetch user record to retrieve the account name
    const user = await db.user.findUnique({
      where: { id: session.id },
    });

    const result = await updateParticipantProfileAction(session.id, {
      fullName: (user as any)?.name || (user as any)?.fullName || "Participant",
      gender,
      institution,
      gradeLevel,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
