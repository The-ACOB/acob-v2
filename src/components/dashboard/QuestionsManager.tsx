"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { QuestionEditor } from "@/components/dashboard/QuestionEditor";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/dashboard/Toast";
import {
  createQuestionAction,
  updateQuestionAction,
  deleteQuestionAction,
} from "@/lib/olympiads/actions";
import type { ActionResult } from "@/lib/auth/actions";

export type QuestionRow = {
  id: string;
  text: string;
  marks: number;
  difficulty: "easy" | "medium" | "hard";
  options: { id: string; text: string; isCorrect: boolean }[];
};

export function QuestionsManager({
  olympiadId,
  questions,
  editable,
}: {
  olympiadId: string;
  questions: QuestionRow[];
  editable: boolean;
}) {
  const [mode, setMode] = useState<"none" | "create" | string>("none");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete(id: string) {
    const result = await deleteQuestionAction(olympiadId, id);
    if (!result.ok) {
      toast("error", "Could not delete", result.error);
      return;
    }
    toast("success", "Question deleted");
    router.refresh();
  }

  if (mode === "create") {
    return (
      <div className="rounded-lg border border-border bg-elevated p-5">
        <QuestionEditor
          onSubmit={(values) => createQuestionAction(olympiadId, values)}
          onDone={() => {
            setMode("none");
            router.refresh();
          }}
        />
      </div>
    );
  }

  const editing = questions.find((q) => q.id === mode);
  if (editing) {
    return (
      <div className="rounded-lg border border-border bg-elevated p-5">
        <QuestionEditor
          defaultValues={{
            text: editing.text,
            marks: editing.marks,
            difficulty: editing.difficulty,
            options: editing.options.map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          }}
          onSubmit={(values): Promise<ActionResult> =>
            updateQuestionAction(olympiadId, editing.id, values)
          }
          onDone={() => {
            setMode("none");
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {questions.length === 0 ? (
        <p className="text-sm text-muted">No questions yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="rounded-lg border border-border bg-elevated p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-primary">
                  <span className="mr-2 font-mono text-xs text-muted">
                    Q{i + 1}.
                  </span>
                  {q.text}
                </p>
                {editable ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode(q.id)}
                      aria-label="Edit"
                      className="text-muted hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(q.id)}
                      aria-label="Delete"
                      className="text-muted hover:text-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {q.options.map((o) => (
                  <span
                    key={o.id}
                    className={`rounded-full border px-2.5 py-1 text-xs ${o.isCorrect ? "border-success/40 text-success" : "border-border text-secondary"}`}
                  >
                    {o.text}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-3">
                <Badge tone="neutral">{q.marks} marks</Badge>
                <Badge tone="neutral">{q.difficulty}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {editable ? (
        <button
          type="button"
          onClick={() => setMode("create")}
          className="flex w-fit items-center gap-1.5 rounded-md border border-border-strong px-3 py-2 text-xs text-secondary transition-colors hover:border-accent hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Add question
        </button>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this question?"
        description="This cannot be undone."
        confirmLabel="Delete"
        tone="destructive"
        onConfirm={async () => {
          if (deleteTarget) await handleDelete(deleteTarget);
        }}
      />
    </div>
  );
}
