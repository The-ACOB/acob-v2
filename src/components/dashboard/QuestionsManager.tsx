"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Archive, X } from "lucide-react";
import { QuestionEditor } from "@/components/dashboard/QuestionEditor";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MathText } from "@/components/questions/MathText";
import { useToast } from "@/components/dashboard/Toast";
import { createQuestionAction, updateQuestionAction, deleteQuestionAction, importArchiveQuestionAction } from "@/lib/olympiads/actions";
import type { ActionResult } from "@/lib/auth/actions";

export type QuestionRow = {
  id: string; text: string; textBn: string | null; marks: number; difficulty: "easy" | "medium" | "hard";
  options: { id: string; text: string; textBn: string | null; isCorrect: boolean }[];
};

type ArchiveQuestion = {
  id: string; type: "mcq" | "short"; questionEn: string; questionBn: string; difficulty: "easy" | "medium" | "hard"; marks: number;
  subject: { id: string; name: string } | null; options: { id: string; label: string; textEn: string; textBn: string; isCorrect: boolean }[];
};

export function QuestionsManager({ olympiadId, questions, editable }: { olympiadId: string; questions: QuestionRow[]; editable: boolean }) {
  const [mode, setMode] = useState<"none" | "create" | string>("none");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archive, setArchive] = useState<ArchiveQuestion[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function loadArchive() {
    setLoadingArchive(true);
    try {
      const params = new URLSearchParams({ q: search, type: "mcq" });
      if (difficulty) params.set("difficulty", difficulty);
      const response = await fetch(`/api/question-archive/search?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to search archive.");
      setArchive(data.questions ?? []);
    } catch (error) {
      toast("error", "Archive search failed", error instanceof Error ? error.message : "Unable to search archive.");
    } finally { setLoadingArchive(false); }
  }

  useEffect(() => { if (archiveOpen) void loadArchive(); }, [archiveOpen, difficulty]);

  async function handleImport(id: string) {
    setImporting(id);
    const result = await importArchiveQuestionAction(olympiadId, id);
    setImporting(null);
    if (!result.ok) { toast("error", "Could not add question", result.error); return; }
    toast("success", "Question added from archive");
    router.refresh();
    setArchiveOpen(false);
  }

  async function handleDelete(id: string) {
    const result = await deleteQuestionAction(olympiadId, id);
    if (!result.ok) { toast("error", "Could not delete", result.error); return; }
    toast("success", "Question deleted"); router.refresh();
  }

  if (mode === "create") return <div className="rounded-lg border border-border bg-elevated p-5"><QuestionEditor onSubmit={(values) => createQuestionAction(olympiadId, values)} onDone={() => { setMode("none"); router.refresh(); }} /></div>;

  const editing = questions.find((q) => q.id === mode);
  if (editing) return <div className="rounded-lg border border-border bg-elevated p-5"><QuestionEditor defaultValues={{ text: editing.text, textBn: editing.textBn ?? "", marks: editing.marks, difficulty: editing.difficulty, options: editing.options.map((o) => ({ text: o.text, textBn: o.textBn ?? "", isCorrect: o.isCorrect })) }} onSubmit={(values): Promise<ActionResult> => updateQuestionAction(olympiadId, editing.id, values)} onDone={() => { setMode("none"); router.refresh(); }} /></div>;

  return (
    <div className="flex flex-col gap-4">
      {questions.length === 0 ? <p className="text-sm text-muted">No questions yet.</p> : <div className="flex flex-col gap-3">
        {questions.map((q, i) => <div key={q.id} className="rounded-lg border border-border bg-elevated p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1"><p className="text-sm text-primary"><span className="mr-2 font-mono text-xs text-muted">Q{i + 1}.</span><MathText text={q.text} /></p>{q.textBn ? <p className="mt-2 text-sm text-secondary"><MathText text={q.textBn} /></p> : null}</div>
            {editable ? <div className="flex shrink-0 gap-2"><button type="button" onClick={() => setMode(q.id)} aria-label="Edit" className="text-muted hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setDeleteTarget(q.id)} aria-label="Delete" className="text-muted hover:text-error"><Trash2 className="h-3.5 w-3.5" /></button></div> : null}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{q.options.map((o) => <div key={o.id} className={`rounded-md border px-3 py-2 text-xs ${o.isCorrect ? "border-success/40" : "border-border"}`}><MathText text={o.text} />{o.textBn ? <div className="mt-1 text-secondary"><MathText text={o.textBn} /></div> : null}</div>)}</div>
          <div className="mt-3 flex gap-3"><Badge tone="neutral">{q.marks} marks</Badge><Badge tone="neutral">{q.difficulty}</Badge></div>
        </div>)}
      </div>}

      {editable ? <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => setMode("create")} className="text-xs"><Plus className="h-3.5 w-3.5" /> Create new question</Button>
        <Button type="button" variant="ghost" onClick={() => setArchiveOpen(true)} className="text-xs"><Archive className="h-3.5 w-3.5" /> Add from Question Archive</Button>
      </div> : null}

      {archiveOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setArchiveOpen(false); }}>
        <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-elevated shadow-2xl">
          <div className="flex items-center justify-between border-b border-border p-5"><div><h3 className="font-display text-lg text-primary">Add from Question Archive</h3><p className="mt-1 text-xs text-muted">Search, preview, then add an archived MCQ without rewriting it.</p></div><button type="button" onClick={() => setArchiveOpen(false)} className="text-muted hover:text-primary"><X className="h-4 w-4" /></button></div>
          <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[1fr_160px_auto]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void loadArchive(); }} placeholder="Search English or Bangla questions…" className="w-full rounded-md border border-border bg-black/20 py-2 pl-9 pr-3 text-sm text-primary outline-none focus:border-accent"/></div><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-primary"><option value="">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select><Button type="button" variant="primary" onClick={() => void loadArchive()} className="text-xs">Search</Button></div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{loadingArchive ? <p className="py-10 text-center text-sm text-muted">Searching archive…</p> : archive.length === 0 ? <p className="py-10 text-center text-sm text-muted">No archive questions found.</p> : <div className="flex flex-col gap-3">{archive.map((q) => <div key={q.id} className="rounded-lg border border-border bg-black/10 p-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap gap-2"><Badge tone="neutral">{q.subject?.name ?? "Uncategorised"}</Badge><Badge tone="neutral">{q.difficulty}</Badge><Badge tone="neutral">{q.marks} marks</Badge></div><div className="text-sm leading-7 text-primary"><MathText text={q.questionEn} /></div><div className="mt-2 text-sm leading-7 text-secondary"><MathText text={q.questionBn} /></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{q.options.map((o) => <div key={o.id} className="rounded-md border border-border px-3 py-2 text-xs"><MathText text={`${o.label}. ${o.textEn}`} /><div className="mt-1 text-secondary"><MathText text={o.textBn} /></div></div>)}</div></div><Button type="button" variant="secondary" disabled={importing === q.id} onClick={() => void handleImport(q.id)} className="shrink-0 text-xs">{importing === q.id ? "Adding…" : "Add"}</Button></div></div>)}</div>}</div>
        </div>
      </div> : null}

      <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)} title="Delete this question?" description="This cannot be undone." confirmLabel="Delete" tone="destructive" onConfirm={async () => { if (deleteTarget) await handleDelete(deleteTarget); }} />
    </div>
  );
}
