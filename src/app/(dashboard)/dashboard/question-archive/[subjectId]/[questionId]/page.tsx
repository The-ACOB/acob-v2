import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { requirePermission } from "@/lib/authz/guards";
import { QuestionArchiveForm } from "@/components/dashboard/QuestionArchiveForm";

type Props = {
  params: Promise<{
    subjectId: string;
    questionId: string;
  }>;
};

export default async function EditQuestionArchivePage({ params }: Props) {
  await requirePermission("question:create");

  const { subjectId, questionId } = await params;

  const [subject, question] = await Promise.all([
    db.questionArchiveSubject.findUnique({
      where: { id: subjectId },
    }),
    db.questionArchive.findUnique({
      where: { id: questionId },
      include: {
        options: {
          orderBy: { order: "asc" },
        },
      },
    }),
  ]);

  if (!subject || !question || question.subjectId !== subjectId) {
    notFound();
  }

  const initialQuestion = {
    id: question.id,
    type: question.type,
    questionEn: question.questionEn,
    questionBn: question.questionBn,
    difficulty: question.difficulty,
    marks: question.marks,
    explanationEn: question.explanationEn,
    explanationBn: question.explanationBn,
    imageUrl: question.imageUrl,
    options: question.options.map((option) => ({
      label: option.label as "A" | "B" | "C" | "D",
      textEn: option.textEn,
      textBn: option.textBn,
      isCorrect: option.isCorrect,
    })),
  };

  return (
    <QuestionArchiveForm
      subjectId={subject.id}
      subjectName={subject.name}
      initialQuestion={initialQuestion}
    />
  );
}
