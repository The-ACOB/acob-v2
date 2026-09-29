import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { requirePermission } from "@/lib/authz/guards";
import { QuestionArchiveForm } from "@/components/dashboard/QuestionArchiveForm";

type Props = {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ folderId?: string }>;
};

export default async function NewQuestionArchivePage({ params, searchParams }: Props) {
  await requirePermission("question:create");
  const { subjectId } = await params;
  const { folderId } = await searchParams;

  const [subject, folder, folders] = await Promise.all([
    db.questionArchiveSubject.findUnique({ where: { id: subjectId } }),
    folderId ? db.questionArchiveFolder.findUnique({ where: { id: folderId } }) : null,
    db.questionArchiveFolder.findMany({ where: { subjectId }, orderBy: { name: "asc" } }),
  ]);

  if (!subject || (folderId && (!folder || folder.subjectId !== subjectId))) notFound();

  return <QuestionArchiveForm subjectId={subject.id} subjectName={subject.name} folderId={folder?.id ?? null} archiveFolders={folders.map((item) => ({ id: item.id, parentId: item.parentId, name: item.name }))} />;
}
