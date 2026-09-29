import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { requirePermission } from "@/lib/authz/guards";
import { SubjectQuestionsManager } from "@/components/dashboard/SubjectQuestionsManager";

type Props = {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ folderId?: string }>;
};

export default async function QuestionArchiveSubjectPage({ params, searchParams }: Props) {
  await requirePermission("question:create");

  const { subjectId } = await params;
  const { folderId } = await searchParams;

  const [subject, folders, questions] = await Promise.all([
    db.questionArchiveSubject.findUnique({ where: { id: subjectId } }),
    db.questionArchiveFolder.findMany({
      where: { subjectId },
      orderBy: { name: "asc" },
      include: { _count: { select: { questions: true, children: true } } },
    }),
    db.questionArchive.findMany({
      where: { subjectId },
      include: { options: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!subject) notFound();

  const currentFolderId = folderId || null;
  if (currentFolderId && !folders.some((folder) => folder.id === currentFolderId)) {
    notFound();
  }

  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const breadcrumbs: { id: string; name: string }[] = [];
  let cursor = currentFolderId ? byId.get(currentFolderId) : undefined;
  while (cursor) {
    breadcrumbs.unshift({ id: cursor.id, name: cursor.name });
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }

  return (
    <SubjectQuestionsManager
      subject={{ id: subject.id, name: subject.name }}
      initialFolders={folders}
      initialQuestions={questions}
      currentFolderId={currentFolderId}
      breadcrumbs={breadcrumbs}
    />
  );
}
