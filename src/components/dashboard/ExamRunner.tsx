"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { useToast } from "@/components/dashboard/Toast";
import { saveAnswerAction, submitAttemptAction } from "@/lib/exam/actions";
import { cn } from "@/lib/utils";
import type { SanitizedQuestion } from "@/lib/exam/actions";

const SAVE_INTERVAL_MS = 15_000;

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function ExamRunner({
  attemptId,
  deadlineAt,
  questions,
  initialAnswers,
}: {
  attemptId: string;
  deadlineAt: string;
  questions: SanitizedQuestion[];
  initialAnswers: Record<string, string | null>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const deadline = useMemo(() => new Date(deadlineAt).getTime(), [deadlineAt]);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>(initialAnswers);
  const [remainingMs, setRemainingMs] = useState(() => deadline - Date.now());
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const lastSavedTimeRef = useRef<Record<string, number>>({});
  const pendingSinceRef = useRef<Record<string, number>>({});

  const question = questions[current];

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const result = await submitAttemptAction(attemptId);
    setSubmitting(false);
    if (!result.ok) {
      toast("error", "Submission issue", result.error);
      submittedRef.current = false;
      return;
    }
    toast("success", "Submitted");
    router.push("/dashboard/olympiads");
    router.refresh();
  }, [attemptId, router, toast]);

  // Client-side countdown — purely visual. The server independently
  // re-validates the real deadline on every save/submit call, so a
  // manipulated browser clock can't extend the exam.
  useEffect(() => {
    const interval = setInterval(() => {
      const left = deadline - Date.now();
      setRemainingMs(left);
      if (left <= 0 && !submittedRef.current) {
        doSubmit();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, doSubmit]);

  const saveNow = useCallback(
    async (questionId: string) => {
      const now = Date.now();
      const since = pendingSinceRef.current[questionId] ?? now;
      const deltaSeconds = Math.max(0, Math.round((now - since) / 1000));
      pendingSinceRef.current[questionId] = now;
      lastSavedTimeRef.current[questionId] = now;
      const result = await saveAnswerAction(attemptId, questionId, answers[questionId] ?? null, deltaSeconds);
      if (!result.ok) {
        toast("error", "Time may have expired", result.error);
        doSubmit();
      }
    },
    [attemptId, answers, toast, doSubmit]
  );

  // Debounced periodic save for the current question while it's open.
  useEffect(() => {
    if (!question) return;
    pendingSinceRef.current[question.id] = pendingSinceRef.current[question.id] ?? Date.now();
    const interval = setInterval(() => saveNow(question.id), SAVE_INTERVAL_MS);
    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function goTo(index: number) {
    if (question) saveNow(question.id);
    setCurrent(index);
  }

  if (!question) return null;

  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const urgent = remainingMs < 5 * 60 * 1000;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between rounded-lg border border-border-strong bg-elevated px-5 py-3">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
            Question {current + 1} of {questions.length}
          </p>
          <p className={cn("font-mono text-lg tabular-nums", urgent ? "text-error" : "text-primary")}>
            {formatTime(remainingMs)}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-elevated p-6">
          <p className="text-sm text-muted">{question.marks} mark{question.marks !== 1 ? "s" : ""}</p>
          <p className="mt-2 font-display text-xl leading-relaxed text-primary">{question.text}</p>
          {question.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={question.imageUrl} alt="" className="mt-4 max-h-72 rounded-md border border-border object-contain" />
          ) : null}

          <div className="mt-6 flex flex-col gap-3">
            {question.options.map((opt) => (
              <label
                key={opt.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors",
                  answers[question.id] === opt.id
                    ? "border-accent bg-accent/5 text-primary"
                    : "border-border-strong text-secondary hover:border-border-strong/80"
                )}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={answers[question.id] === opt.id}
                  onChange={() => selectOption(question.id, opt.id)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                {opt.text}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" className="text-xs" disabled={current === 0} onClick={() => goTo(current - 1)}>
            Previous
          </Button>
          {current < questions.length - 1 ? (
            <Button variant="secondary" className="text-xs" onClick={() => goTo(current + 1)}>
              Next
            </Button>
          ) : (
            <Button variant="primary" className="text-xs" disabled={submitting} onClick={() => setConfirmSubmit(true)}>
              Submit
            </Button>
          )}
        </div>
      </div>

      <aside className="w-full shrink-0 lg:w-56">
        <div className="rounded-lg border border-border bg-elevated p-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {answeredCount} / {questions.length} answered
          </p>
          <div className="grid grid-cols-6 gap-2 lg:grid-cols-5">
            {questions.map((q, i) => (
              <button
                key={q.id}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border font-mono text-xs transition-colors",
                  i === current
                    ? "border-accent text-accent"
                    : answers[q.id]
                      ? "border-success/40 text-success"
                      : "border-border-strong text-muted"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button variant="primary" className="mt-4 w-full text-xs" disabled={submitting} onClick={() => setConfirmSubmit(true)}>
            Submit exam
          </Button>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title="Submit your exam?"
        description={`You've answered ${answeredCount} of ${questions.length} questions. This cannot be undone.`}
        confirmLabel="Submit"
        onConfirm={doSubmit}
      />
    </div>
  );
}
