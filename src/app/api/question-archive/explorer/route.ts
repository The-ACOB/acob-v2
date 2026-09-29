import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requirePermission } from "@/lib/authz/guards";

export async function GET() {
  try {
    await requirePermission("question:create");

    const [subjects, folders, questions] = await Promise.all([
      db.questionArchiveSubject.findMany({ orderBy: { name: "asc" } }),
      db.questionArchiveFolder.findMany({ orderBy: { name: "asc" } }),
      db.questionArchive.findMany({
        orderBy: { createdAt: "desc" },
        include: { options: { orderBy: { order: "asc" } } },
      }),
    ]);

    return NextResponse.json({ subjects, folders, questions });
  } catch (error) {
    console.error("Failed to load question archive explorer:", error);
    return NextResponse.json({ error: "Failed to load the question archive." }, { status: 500 });
  }
}
