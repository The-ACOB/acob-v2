import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requirePermission } from "@/lib/authz/guards";
import { QuestionDifficulty, QuestionType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("question:create");
    const params = request.nextUrl.searchParams;
    const q = params.get("q")?.trim() ?? "";
    const subjectId = params.get("subjectId") || undefined;
    const difficulty = params.get("difficulty") || undefined;
    const type = params.get("type") || "mcq";
    const questions = await db.questionArchive.findMany({
      where: {
        type: type as QuestionType,
        ...(subjectId ? { subjectId } : {}),
        ...(difficulty ? { difficulty: difficulty as QuestionDifficulty } : {}),
        ...(q ? { OR: [{ questionEn: { contains: q, mode: "insensitive" } }, { questionBn: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { subject: true, options: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json({ error: "Unable to search question archive." }, { status: 403 });
  }
}
