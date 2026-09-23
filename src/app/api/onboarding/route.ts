import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
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

    if (!gender || !institution || !gradeLevel) {
      return NextResponse.json(
        { ok: false, error: "All fields are required." },
        { status: 400 },
      );
    }

    // Clean up gradeLevel (e.g., "Class 11" -> "11" or keep as-is if preferred)
    const cleanGrade = gradeLevel.replace(/class\s*/i, "").trim();
    const gradeNum = parseInt(cleanGrade, 10);

    // Auto-calculate academic level matching your form logic
    let academicLevel = "";
    if (!isNaN(gradeNum)) {
      if (gradeNum >= 6 && gradeNum <= 8) {
        academicLevel = "Junior Secondary";
      } else if (gradeNum >= 9) {
        academicLevel = "Secondary Higher Secondary";
      }
    }

    // Upsert participant profile so it always updates or creates cleanly
    await db.participant.upsert({
      where: { userId: session.id },
      update: {
        gender,
        institution: institution.trim(),
        gradeLevel: cleanGrade,
        academicLevel,
      },
      create: {
        userId: session.id,
        gender,
        institution: institution.trim(),
        gradeLevel: cleanGrade,
        academicLevel,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
