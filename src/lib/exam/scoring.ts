import "server-only";

export type ScoringQuestion = {
  id: string;
  marks: number;
  options: { id: string; isCorrect: boolean }[];
};

export type ScoringAnswer = {
  questionId: string;
  selectedOptionId: string | null;
};

export type ScoreResult = {
  score: number;
  totalMarks: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  perQuestion: Map<string, { isCorrect: boolean | null; marksAwarded: number }>;
};

/**
 * Pure, server-only scoring function — the single source of truth for
 * how an attempt's score is computed. Never trusts anything from the
 * client beyond which option id was selected; correctness is always
 * looked up from the question's own option data.
 */
export function scoreAttempt(
  questions: ScoringQuestion[],
  answers: ScoringAnswer[],
  negativeMarkingEnabled: boolean,
  negativeMarkingValue: number
): ScoreResult {
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));
  const perQuestion = new Map<string, { isCorrect: boolean | null; marksAwarded: number }>();

  let score = 0;
  let totalMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const q of questions) {
    totalMarks += q.marks;
    const selectedOptionId = answerByQuestion.get(q.id) ?? null;

    if (!selectedOptionId) {
      unansweredCount += 1;
      perQuestion.set(q.id, { isCorrect: null, marksAwarded: 0 });
      continue;
    }

    const selected = q.options.find((o) => o.id === selectedOptionId);
    const isCorrect = Boolean(selected?.isCorrect);

    if (isCorrect) {
      correctCount += 1;
      score += q.marks;
      perQuestion.set(q.id, { isCorrect: true, marksAwarded: q.marks });
    } else {
      incorrectCount += 1;
      const penalty = negativeMarkingEnabled ? -negativeMarkingValue : 0;
      score += penalty;
      perQuestion.set(q.id, { isCorrect: false, marksAwarded: penalty });
    }
  }

  return { score, totalMarks, correctCount, incorrectCount, unansweredCount, perQuestion };
}
