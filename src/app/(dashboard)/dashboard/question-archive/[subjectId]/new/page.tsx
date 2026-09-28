import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { requirePermission } from "@/lib/authz/guards";
import { QuestionArchiveForm } from "@/components/dashboard/QuestionArchiveForm";

type Props = {
  params: Promise<{
    subjectId: string;
  }>;
};

export default async function NewQuestionArchivePage({ params }: Props) {
  await requirePermission("question:create");

  const { subjectId } = await params;

  const subject = await db.questionArchiveSubject.findUnique({
    where: { id: subjectId },
  });

  if (!subject) {
    notFound();
  }

  return (
    <QuestionArchiveForm
      subjectId={subject.id}
      subjectName={subject.name}
    />
  );
}
