import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requirePermission } from "@/lib/authz/guards";

export async function GET() {
  try {
    await requirePermission("question:create");

    const subjects = await db.questionArchiveSubject.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Failed to load archive subjects:", error);

    return NextResponse.json(
      { error: "Failed to load archive subjects." },
      { status: 500 },
    );
  }
}
