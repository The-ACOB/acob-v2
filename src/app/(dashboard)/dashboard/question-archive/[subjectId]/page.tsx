import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { requirePermission } from "@/lib/authz/guards";
import { SubjectQuestionsManager } from "@/components/dashboard/SubjectQuestionsManager";

type Props = {
  params: Promise<{
    subjectId: string;
  }>;
};

export default async function QuestionArchiveSubjectPage({ params }: Props) {
  await requirePermission("question:create");

  const { subjectId } = await params;

  const subject = await db.questionArchiveSubject.findUnique({
    where: { id: subjectId },
  });

  if (!subject) {
    notFound();
  }

  const questions = await db.questionArchive.findMany({
    where: {
      subjectId,
    },
    include: {
      options: {
        orderBy: {
          order: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <SubjectQuestionsManager
      subject={{
        id: subject.id,
        name: subject.name,
      }}
      initialQuestions={questions}
    />
  );
}
