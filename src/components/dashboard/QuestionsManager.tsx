"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LibraryBig, Pencil, Plus, Trash2 } from "lucide-react";
import { QuestionEditor } from "@/components/dashboard/QuestionEditor";
import { QuestionArchivePicker } from "@/components/dashboard/QuestionArchivePicker";
import { QuestionArchiveDestinationDialog } from "@/components/dashboard/QuestionArchiveDestinationDialog";
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
  textBn?: string | null;
  marks: number;
  difficulty: "easy" | "medium" | "hard";
  archiveQuestionId?: string | null;
  options: { id: string; text: string; textBn?: string | null; isCorrect: boolean }[];
};

type ArchiveSubject = { id: string; name: string };
type ArchiveFolder = { id: string; subjectId: string; parentId: string | null; name: string };

export function QuestionsManager({
  olympiadId,
  olympiadSubject,
  questions,
  archiveSubjects,
  archiveFolders,
  editable,
}: {
  olympiadId: string;
  olympiadSubject: string | null;
  questions: QuestionRow[];
  archiveSubjects: ArchiveSubject[];
  archiveFolders: ArchiveFolder[];
  editable: boolean;
}) {
  const [mode, setMode] = useState<"none" | "create" | "archive" | string>("none");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedStandaloneIds, setSelectedStandaloneIds] = useState<Set<string>>(new Set());
  const [showArchiveDestination, setShowArchiveDestination] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const standaloneQuestions = useMemo(
    () => questions.filter((question) => !question.archiveQuestionId),
    [questions],
  );

  const allStandaloneSelected =
    standaloneQuestions.length > 0 &&
    standaloneQuestions.every((question) => selectedStandaloneIds.has(question.id));

  function toggleStandalone(id: string) {
    setSelectedStandaloneIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllStandalone() {
    setSelectedStandaloneIds((current) => {
      const next = new Set(current);
      if (allStandaloneSelected) {
        standaloneQuestions.forEach((question) => next.delete(question.id));
      } else {
        standaloneQuestions.forEach((question) => next.add(question.id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedStandaloneIds(new Set());
  }

  async function handleDelete(id: string) {
    const result = await deleteQuestionAction(olympiadId, id);
    if (!result.ok) {
      toast("error", "Could not delete", result.error);
      return;
    }
    toast("success", "Question deleted");
    router.refresh();
  }

  if (mode === "archive") {
    return (
      <QuestionArchivePicker
        olympiadId={olympiadId}
        onCancel={() => setMode("none")}
        onDone={() => {
          setMode("none");
          router.refresh();
        }}
      />
    );
  }

  if (mode === "create") {
    return (
      <div className="border border-border bg-elevated p-5">
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
      <div className="border border-border bg-elevated p-5">
        <QuestionEditor
          defaultValues={{
            text: editing.text,
            marks: editing.marks,
            difficulty: editing.difficulty,
            options: editing.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
          }}
          onSubmit={(values): Promise<ActionResult> => updateQuestionAction(olympiadId, editing.id, values)}
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
      {editable && selectedStandaloneIds.size > 0 ? (
        <div className="sticky top-3 z-10 flex flex-col gap-3 border border-border-strong bg-elevated p-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex min-w-7 items-center justify-center bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
              {selectedStandaloneIds.size}
            </span>
            <span className="text-xs text-secondary">standalone questions selected</span>
            <button type="button" onClick={clearSelection} className="text-xs text-muted hover:text-primary">Clear</button>
          </div>
          <button
            type="button"
            onClick={() => setShowArchiveDestination(true)}
            className="inline-flex items-center justify-center gap-1.5 border border-accent bg-accent/10 px-3 py-2 text-xs font-medium text-primary hover:bg-accent/20"
          >
            <LibraryBig className="h-3.5 w-3.5" />
            Move to Question Archive
          </button>
        </div>
      ) : null}

      {questions.length === 0 ? (
        <p className="text-sm text-muted">No questions yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {editable && standaloneQuestions.length > 0 ? (
            <div className="flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={allStandaloneSelected}
                onChange={toggleAllStandalone}
                className="h-4 w-4 accent-current"
                aria-label="Select all standalone questions"
              />
              <span>Select standalone questions for archive</span>
              {selectedStandaloneIds.size > 0 ? (
                <span className="ml-auto">{selectedStandaloneIds.size} selected</span>
              ) : null}
            </div>
          ) : null}

          {questions.map((q, i) => {
            const standalone = !q.archiveQuestionId;
            const selected = selectedStandaloneIds.has(q.id);

            return (
              <div key={q.id} className={`border border-border bg-elevated p-4 ${selected ? "border-accent/50 bg-accent/[0.04]" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    {editable && standalone ? (
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleStandalone(q.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-current"
                        aria-label={`Select question ${i + 1} for archive`}
                      />
                    ) : null}
                    <p className="text-sm text-primary">
                      <span className="mr-2 font-mono text-xs text-muted">Q{i + 1}.</span>
                      {q.text}
                    </p>
                  </div>
                  {editable ? (
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => setMode(q.id)} aria-label="Edit" className="text-muted hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => setDeleteTarget(q.id)} aria-label="Delete" className="text-muted hover:text-error"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : null}
                </div>
                {q.textBn ? <p className="mt-2 text-xs text-muted">{q.textBn}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {q.options.map((o) => (
                    <span key={o.id} className={`border px-2.5 py-1 text-xs ${o.isCorrect ? "border-success/40 text-success" : "border-border text-secondary"}`}>{o.text}</span>
                  ))}
                </div>
                <div className="mt-3 flex gap-3">
                  <Badge tone="neutral">{q.marks} marks</Badge>
                  <Badge tone="neutral">{q.difficulty}</Badge>
                  {q.archiveQuestionId ? <Badge tone="success">Archived</Badge> : <Badge tone="neutral">Standalone</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editable ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMode("create")} className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-2 text-xs font-medium text-secondary hover:border-accent hover:text-primary">
            <Plus className="h-3.5 w-3.5" /> Create New Question
          </button>
          <button type="button" onClick={() => setMode("archive")} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
            <LibraryBig className="h-3.5 w-3.5" /> Add From Question Archive
          </button>
        </div>
      ) : null}

      <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)} title="Delete this question?" description="This cannot be undone." confirmLabel="Delete" tone="destructive" onConfirm={async () => { if (deleteTarget) await handleDelete(deleteTarget); }} />

      {showArchiveDestination ? (
        <QuestionArchiveDestinationDialog
          olympiadId={olympiadId}
          questionIds={Array.from(selectedStandaloneIds)}
          olympiadSubject={olympiadSubject}
          subjects={archiveSubjects}
          folders={archiveFolders}
          onClose={() => setShowArchiveDestination(false)}
          onDone={() => {
            setShowArchiveDestination(false);
            clearSelection();
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
