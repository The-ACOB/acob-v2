"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Divide,
  Infinity as InfinityIcon,
  Radical,
  Sigma,
  Subscript,
  Superscript,
} from "lucide-react";
import { createQuestionArchiveAction, updateQuestionArchiveAction } from "@/lib/question-archive/actions";
import { translateQuestionArchiveAction } from "@/lib/question-archive/translation-actions";
import katex from "katex";
import "katex/dist/katex.min.css";


function LatexToolbar({
  onInsert,
}: {
  onInsert: (value: string) => void;
}) {
  const buttons = [
    { label: "Superscript", value: "x^{y}", icon: <Superscript className="h-3.5 w-3.5" /> },
    { label: "Subscript", value: "x_{i}", icon: <Subscript className="h-3.5 w-3.5" /> },
    { label: "Fraction", value: "\\frac{a}{b}", icon: <Divide className="h-3.5 w-3.5" /> },
    { label: "Square root", value: "\\sqrt{x}", icon: <Radical className="h-3.5 w-3.5" /> },
    { label: "Summation", value: "\\sum_{i=1}^{n}", icon: <Sigma className="h-3.5 w-3.5" /> },
    { label: "Infinity", value: "\\infty", icon: <InfinityIcon className="h-3.5 w-3.5" /> },
    { label: "Pi", value: "\\pi", text: "π" },
    { label: "Theta", value: "\\theta", text: "θ" },
    { label: "Alpha", value: "\\alpha", text: "α" },
    { label: "Beta", value: "\\beta", text: "β" },
    { label: "Less than or equal", value: "\\leq", text: "≤" },
    { label: "Greater than or equal", value: "\\geq", text: "≥" },
    { label: "Not equal", value: "\\neq", text: "≠" },
    { label: "Times", value: "\\times", text: "×" },
    { label: "Divide", value: "\\div", text: "÷" },
    { label: "Inline math", value: "$", text: "$" },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border/80 bg-black/40 p-1">
      {buttons.map((button) => (
        <button
          key={button.value}
          type="button"
          title={button.label}
          aria-label={button.label}
          onClick={() => onInsert(button.value)}
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-secondary transition-colors hover:bg-white/5 hover:text-primary"
        >
          {"icon" in button ? button.icon : (
            <span className="text-sm font-semibold leading-none">{button.text}</span>
          )}
        </button>
      ))}
    </div>
  );
}

type InitialQuestion = {
  id: string;
  type: "mcq" | "short";
  questionEn: string;
  questionBn: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  explanationEn: string | null;
  explanationBn: string | null;
  imageUrl: string | null;
  options: Option[];
};

type Props = {
  subjectId: string;
  subjectName: string;
  initialQuestion?: InitialQuestion;
};

type Option = {
  label: "A" | "B" | "C" | "D";
  textEn: string;
  textBn: string;
  isCorrect: boolean;
};

const makeOptions = (): Option[] => [
  { label: "A", textEn: "", textBn: "", isCorrect: false },
  { label: "B", textEn: "", textBn: "", isCorrect: false },
  { label: "C", textEn: "", textBn: "", isCorrect: false },
  { label: "D", textEn: "", textBn: "", isCorrect: false },
];

export function QuestionArchiveForm({
  subjectId,
  subjectName,
  initialQuestion,
}: Props) {
  const [type, setType] = useState<"mcq" | "short">(
    initialQuestion?.type ?? "mcq",
  );
  const [questionEn, setQuestionEn] = useState(
    initialQuestion?.questionEn ?? "",
  );
  const [questionBn, setQuestionBn] = useState(
    initialQuestion?.questionBn ?? "",
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    initialQuestion?.difficulty ?? "medium",
  );
  const [marks, setMarks] = useState(
    String(initialQuestion?.marks ?? 1),
  );
  const [explanationEn, setExplanationEn] = useState(
    initialQuestion?.explanationEn ?? "",
  );
  const [explanationBn, setExplanationBn] = useState(
    initialQuestion?.explanationBn ?? "",
  );
  const [imageUrl, setImageUrl] = useState(
    initialQuestion?.imageUrl ?? "",
  );
  const [options, setOptions] = useState<Option[]>(
    initialQuestion?.options?.length
      ? initialQuestion.options.map((option) => ({
          label: option.label,
          textEn: option.textEn,
          textBn: option.textBn,
          isCorrect: option.isCorrect,
        }))
      : makeOptions(),
  );

  const questionEnRef = useRef<HTMLTextAreaElement>(null);
  const questionBnRef = useRef<HTMLTextAreaElement>(null);
  const explanationEnRef = useRef<HTMLTextAreaElement>(null);
  const explanationBnRef = useRef<HTMLTextAreaElement>(null);

  function insertLatex(
    ref: React.RefObject<HTMLTextAreaElement | null>,
    value: string,
    setter: (value: string) => void,
  ) {
    const element = ref.current;

    if (!element) {
      setter(value);
      return;
    }

    const start = element.selectionStart;
    const end = element.selectionEnd;
    const current = element.value;
    const selected = current.slice(start, end);

    let insertion = value;

    if (value === "$") {
      insertion = selected ? `$${selected}$` : "$$";
    } else if (selected) {
      if (value === "x^{y}") {
        insertion = `$${selected}^{y}$`;
      } else if (value === "x_{i}") {
        insertion = `$${selected}_{i}$`;
      } else if (value === "\\sqrt{x}") {
        insertion = `$\\sqrt{${selected}}$`;
      } else if (value === "\\frac{a}{b}") {
        insertion = `$\\frac{${selected}}{}$`;
      } else {
        insertion = `$${value}$`;
      }
    } else {
      insertion = `$${value}$`;
    }

    const next = current.slice(0, start) + insertion + current.slice(end);
    setter(next);

    requestAnimationFrame(() => {
      element.focus();
      const cursor = start + insertion.length;
      element.setSelectionRange(cursor, cursor);
    });
  }

  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateOption(
    index: number,
    field: "textEn" | "textBn",
    value: string,
  ) {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option,
      ),
    );
  }

  function setCorrectOption(index: number) {
    setOptions((current) =>
      current.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === index,
      })),
    );
  }

  async function autoTranslate() {
    if (!questionEn.trim()) {
      setMessage("Enter the English question first.");
      return;
    }

    setTranslating(true);
    setMessage("");

    const result = await translateQuestionArchiveAction({
      questionEn,
      options: type === "mcq" ? options.map((option) => option.textEn) : [],
      explanationEn,
    });

    if (!result.success) {
      setMessage(result.error ?? "Something went wrong.");
      setTranslating(false);
      return;
    }

    if (!result.data) {
      setMessage("Translation returned no data.");
      return;
    }
    setQuestionBn(result.data.questionBn);
    setExplanationBn(result.data.explanationBn);

    if (type === "mcq") {
      setOptions((current) =>
        current.map((option, index) => ({
          ...option,
          textBn: result.data.optionsBn[index] ?? "",
        })),
      );
    }

    setMessage("Bangla translation generated. Review it before saving.");
    setTranslating(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (type === "mcq") {
      if (options.some((option) => !option.textEn.trim())) {
        setMessage("All four English options are required.");
        return;
      }

      if (options.some((option) => !option.textBn.trim())) {
        setMessage("Translate or enter all four Bangla options.");
        return;
      }

      if (!options.some((option) => option.isCorrect)) {
        setMessage("Select the correct MCQ option.");
        return;
      }
    }

    if (!questionBn.trim()) {
      setMessage("Generate or enter the Bangla question before saving.");
      return;
    }

    setSaving(true);
    setMessage("");

    const result = initialQuestion
      ? await updateQuestionArchiveAction(initialQuestion.id, {
          subjectId,
          type,
          questionEn,
          questionBn,
          difficulty,
          marks: Number(marks),
          explanationEn,
          explanationBn,
          imageUrl,
          options: type === "mcq" ? options : [],
        })
      : await createQuestionArchiveAction({
      type,
      questionEn,
      questionBn,
      subjectId,
      difficulty,
      marks: Number(marks),
      explanationEn,
      explanationBn,
      imageUrl,
      options: type === "mcq" ? options : [],
    });

    if (!result.success) {
      setMessage(result.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }

    window.location.href = `/dashboard/question-archive/${subjectId}`;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href={`/dashboard/question-archive/${subjectId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {subjectName}
        </Link>

        <div className="mt-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Add Question
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Adding to <strong>{subjectName}</strong>
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"
      >
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-6">
            <div className="flex gap-2 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setType("mcq")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${type === "mcq" ? "bg-background shadow-sm" : ""}`}
              >
                MCQ
              </button>

              <button
                type="button"
                onClick={() => setType("short")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${type === "short" ? "bg-background shadow-sm" : ""}`}
              >
                Short Question
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value as "easy" | "medium" | "hard")
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2.5"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Marks</span>
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={marks}
                  onChange={(event) => setMarks(event.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2.5"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Question</h2>
                <p className="text-sm text-muted-foreground">
                  English is the source text. Review the Bangla translation before saving.
                </p>
              </div>

              <button
                type="button"
                onClick={autoTranslate}
                disabled={translating}
                className="shrink-0 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {translating ? "Translating..." : "Auto Translate"}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">English Question</span>
                <LatexToolbar
                  onInsert={(value) =>
                    insertLatex(questionEnRef, value, setQuestionEn)
                  }
                />
                <textarea
                  ref={questionEnRef}
                  value={questionEn}
                  onChange={(event) => setQuestionEn(event.target.value)}
                  className="min-h-40 w-full rounded-lg border bg-background p-3"
                  placeholder="Write the English question..."
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Bangla Question</span>
                <LatexToolbar
                  onInsert={(value) =>
                    insertLatex(questionBnRef, value, setQuestionBn)
                  }
                />
                <textarea
                  ref={questionBnRef}
                  value={questionBn}
                  onChange={(event) => setQuestionBn(event.target.value)}
                  className="min-h-40 w-full rounded-lg border bg-background p-3"
                  placeholder="Auto translation will appear here..."
                  required
                />
              </label>
            </div>
          </section>

          {type === "mcq" && (
            <section className="rounded-xl border bg-card p-6">
              <div className="mb-5">
                <h2 className="font-semibold">Options A-D</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the English options, then use Auto Translate.
                </p>
              </div>

              <div className="space-y-4">
                {options.map((option, index) => (
                  <div key={option.label} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-semibold">{option.label}</span>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={option.isCorrect}
                          onChange={() => setCorrectOption(index)}
                        />
                        Correct
                      </label>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={option.textEn}
                        onChange={(event) =>
                          updateOption(index, "textEn", event.target.value)
                        }
                        className="rounded-lg border bg-background px-3 py-2.5"
                        placeholder={`Option ${option.label} English`}
                        required
                      />

                      <input
                        value={option.textBn}
                        onChange={(event) =>
                          updateOption(index, "textBn", event.target.value)
                        }
                        className="rounded-lg border bg-background px-3 py-2.5"
                        placeholder={`Option ${option.label} Bangla`}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold">Solution Explanation</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              Stored with the archive question and intended for display after results are published.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <LatexToolbar
                  onInsert={(value) =>
                    insertLatex(explanationEnRef, value, setExplanationEn)
                  }
                />
                <textarea
                  ref={explanationEnRef}
                  value={explanationEn}
                  onChange={(event) => setExplanationEn(event.target.value)}
                  className="min-h-32 w-full rounded-lg border bg-background p-3"
                  placeholder="English solution explanation..."
                />
              </div>

              <div className="space-y-2">
                <LatexToolbar
                  onInsert={(value) =>
                    insertLatex(explanationBnRef, value, setExplanationBn)
                  }
                />
                <textarea
                  ref={explanationBnRef}
                  value={explanationBn}
                  onChange={(event) => setExplanationBn(event.target.value)}
                  className="min-h-32 w-full rounded-lg border bg-background p-3"
                  placeholder="Bangla solution explanation..."
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-6">
            <label className="space-y-2">
              <span className="text-sm font-medium">Image URL</span>
              <input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5"
                placeholder="https://..."
              />
            </label>
          </section>

          {message && (
            <div className="rounded-lg border px-4 py-3 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Question to Archive"}
          </button>
        </div>

        <aside className="h-fit rounded-xl border bg-card p-6 xl:sticky xl:top-6">
          <h2 className="font-semibold">Live Preview</h2>

          <div className="mt-5 space-y-5">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                English
              </span>
              <p className="mt-2 whitespace-pre-wrap leading-7">
                {questionEn || "Your question will appear here."}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Bangla
              </span>
              <p className="mt-2 whitespace-pre-wrap leading-7">
                {questionBn || <span className="text-muted-foreground">Not provided</span>}
              </p>
            </div>

            {type === "mcq" && (
              <div className="space-y-2">
                {options.map((option) => (
                  <div
                    key={option.label}
                    className={`rounded-lg border p-3 text-sm ${option.isCorrect ? "border-primary/50 bg-primary/5" : ""}`}
                  >
                    <strong>{option.label}.</strong>{" "}
                    {option.textEn || "Empty option"}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border px-2.5 py-1">
                {type === "mcq" ? "MCQ" : "Short"}
              </span>

              <span className="rounded-full border px-2.5 py-1 capitalize">
                {difficulty}
              </span>

              <span className="rounded-full border px-2.5 py-1">
                {marks} marks
              </span>

              <span className="rounded-full border px-2.5 py-1">
                {subjectName}
              </span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}



