"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Plus } from "lucide-react";
import { QuestionArchiveSubjectIcon } from "./QuestionArchiveSubjectIcon";

type QuestionType = "mcq" | "short";
type Difficulty = "easy" | "medium" | "hard";

type Question = {
  id: string;
  type: QuestionType;
  questionEn: string;
  questionBn: string;
  difficulty: Difficulty;
  marks: number;
  createdAt: Date | string;
  options: {
    id: string;
    label: string;
    textEn: string;
    textBn: string;
    isCorrect: boolean;
    order: number;
  }[];
};

type Props = {
  subject: {
    id: string;
    name: string;
  };
  initialQuestions: Question[];
};

export function SubjectQuestionsManager({
  subject,
  initialQuestions,
}: Props) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | QuestionType>("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");

  const questions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return initialQuestions.filter((question) => {
      const matchesSearch =
        !query ||
        question.questionEn.toLowerCase().includes(query) ||
        question.questionBn.toLowerCase().includes(query);

      const matchesType =
        type === "all" || question.type === type;

      const matchesDifficulty =
        difficulty === "all" || question.difficulty === difficulty;

      return matchesSearch && matchesType && matchesDifficulty;
    });
  }, [initialQuestions, search, type, difficulty]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/question-archive"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Question Archive
          </Link>

          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-elevated text-accent">
              <QuestionArchiveSubjectIcon subject={subject.name} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {subject.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {initialQuestions.length} archived{" "}
                {initialQuestions.length === 1 ? "question" : "questions"}
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/dashboard/question-archive/${subject.id}/new`}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus aria-hidden="true" className="mr-1.5 inline h-4 w-4" strokeWidth={1.75} />
          Add Question
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 lg:flex-row">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search questions..."
          className="flex-1 rounded-lg border bg-background px-3 py-2.5"
        />

        <select
          value={type}
          onChange={(event) =>
            setType(event.target.value as "all" | QuestionType)
          }
          className="rounded-lg border bg-background px-3 py-2.5"
        >
          <option value="all">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="short">Short Question</option>
        </select>

        <select
          value={difficulty}
          onChange={(event) =>
            setDifficulty(event.target.value as "all" | Difficulty)
          }
          className="rounded-lg border bg-background px-3 py-2.5"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Archive aria-hidden="true" className="mx-auto h-6 w-6 text-accent" strokeWidth={1.65} />

          <h2 className="mt-4 text-lg font-semibold">
            {initialQuestions.length === 0
              ? "No questions yet"
              : "No questions found"}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {initialQuestions.length === 0
              ? `Start building your ${subject.name} question library.`
              : "Try changing your search or filters."}
          </p>

          {initialQuestions.length === 0 && (
            <Link
              href={`/dashboard/question-archive/${subject.id}/new`}
              className="mt-5 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <Plus aria-hidden="true" className="mr-1.5 inline h-4 w-4" strokeWidth={1.75} />
              Add First Question
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <article
              key={question.id}
              className="rounded-xl border bg-card p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full border px-2.5 py-1 text-xs font-medium uppercase">
                      {question.type === "mcq" ? "MCQ" : "Short"}
                    </span>

                    <span className="rounded-full border px-2.5 py-1 text-xs capitalize">
                      {question.difficulty}
                    </span>

                    <span className="rounded-full border px-2.5 py-1 text-xs">
                      {question.marks} marks
                    </span>

                    <span className="rounded-full border px-2.5 py-1 text-xs">
                      #{index + 1}
                    </span>
                  </div>

                  <h2 className="font-medium leading-7">
                    {question.questionEn}
                  </h2>

                  {question.questionBn && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {question.questionBn}
                    </p>
                  )}

                  {question.type === "mcq" &&
                    question.options.length > 0 && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className={`rounded-lg border p-3 text-sm ${
                              option.isCorrect
                                ? "border-primary/50 bg-primary/5"
                                : ""
                            }`}
                          >
                            <span className="mr-2 font-semibold">
                              {option.label}.
                            </span>
                            {option.textEn}
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/dashboard/question-archive/${subject.id}/${question.id}`}
                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
