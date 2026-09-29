"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  Search,
  X,
} from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";
import { importArchivedQuestionsAction } from "@/lib/olympiads/actions";

type Subject = { id: string; name: string };
type FolderRow = { id: string; subjectId: string; parentId: string | null; name: string };
type Option = { id: string; label: string; textEn: string; textBn: string; isCorrect: boolean; order: number };
type ArchiveQuestion = {
  id: string;
  subjectId: string | null;
  folderId: string | null;
  type: "mcq" | "short";
  questionEn: string;
  questionBn: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  options: Option[];
};

type Props = { olympiadId: string; onDone: () => void; onCancel: () => void };

export function QuestionArchivePicker({ olympiadId, onDone, onCancel }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [questions, setQuestions] = useState<ArchiveQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/question-archive/explorer")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load archive.");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSubjects(data.subjects ?? []);
        setFolders(data.folders ?? []);
        setQuestions(data.questions ?? []);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) toast("error", "Archive unavailable", "Could not load the Question Archive.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [toast]);

  const currentSubject = subjects.find((subject) => subject.id === subjectId) ?? null;
  const currentFolder = folders.find((folder) => folder.id === folderId) ?? null;

  const childFolders = useMemo(
    () => folders.filter((folder) => folder.subjectId === subjectId && folder.parentId === folderId).sort((a, b) => a.name.localeCompare(b.name)),
    [folders, subjectId, folderId],
  );

  const visibleQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return questions
      .filter((question) => question.subjectId === subjectId && question.folderId === folderId)
      .filter((question) => !query || question.questionEn.toLowerCase().includes(query) || question.questionBn.toLowerCase().includes(query))
      .sort((a, b) => a.questionEn.localeCompare(b.questionEn));
  }, [questions, subjectId, folderId, search]);

  const globalSearchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return questions.filter((question) =>
      question.questionEn.toLowerCase().includes(query) || question.questionBn.toLowerCase().includes(query),
    ).slice(0, 30);
  }, [questions, search]);

  const selectedQuestions = questions.filter((question) => selected.includes(question.id));

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function importSelected() {
    if (!selected.length) return;
    setImporting(true);
    const result = await importArchivedQuestionsAction(olympiadId, selected);
    if (!result.ok) {
      toast("error", "Import failed", result.error);
      setImporting(false);
      return;
    }
    toast("success", "Questions imported", `${result.data?.imported ?? 0} added${result.data?.skipped ? `, ${result.data.skipped} already present` : ""}.`);
    setImporting(false);
    onDone();
  }

  function openFolder(id: string) {
    setFolderId(id);
    setSearch("");
  }

  function goBack() {
    if (folderId) {
      const folder = folders.find((item) => item.id === folderId);
      setFolderId(folder?.parentId ?? null);
    } else {
      setSubjectId(null);
    }
    setSearch("");
  }

  if (loading) {
    return <div className="border border-border bg-elevated p-8 text-center text-sm text-muted">Loading Question Archive...</div>;
  }

  return (
    <div className="border border-border bg-elevated">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted">Add from Question Archive</p>
          <p className="mt-1 text-sm text-secondary">Select one or multiple question documents to add in their current archive order.</p>
        </div>
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary"><X className="h-4 w-4" /> Close</button>
      </div>

      <div className="grid min-h-[520px] lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="border-b border-border p-3 lg:border-b-0 lg:border-r">
          <div className="mb-2 px-2 text-[10px] font-mono uppercase tracking-[0.16em] text-muted">Subjects</div>
          {subjects.map((subject) => (
            <button key={subject.id} type="button" onClick={() => { setSubjectId(subject.id); setFolderId(null); setSearch(""); }} className={`flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm ${subjectId === subject.id ? "bg-white/5 text-primary" : "text-secondary hover:bg-white/[0.03]"}`}>
              <Folder className="h-4 w-4 text-accent" />
              <span className="truncate">{subject.name}</span>
            </button>
          ))}
        </aside>

        <section className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 border-b border-border p-3">
            <button type="button" onClick={goBack} disabled={!subjectId} className="p-1 text-muted hover:text-primary disabled:invisible"><ChevronLeft className="h-4 w-4" /></button>
            <div className="min-w-0 flex-1 truncate text-xs text-muted">{currentSubject?.name ?? "Select a subject"}{currentFolder ? ` / ${currentFolder.name}` : ""}</div>
          </div>

          <div className="relative border-b border-border p-3">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search archive questions..." className="w-full border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent" />
          </div>

          {!subjectId ? (
            <div className="p-10 text-center text-sm text-muted">Choose a subject to browse its folders and question documents.</div>
          ) : (
            <div className="divide-y divide-border">
              {search.trim() ? (
                globalSearchResults.map((question) => (
                  <DocumentRow key={question.id} question={question} checked={selected.includes(question.id)} onToggle={() => toggle(question.id)} />
                ))
              ) : (
                <>
                  {childFolders.map((folder) => (
                    <button key={folder.id} type="button" onClick={() => openFolder(folder.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02]">
                      <Folder className="h-5 w-5 text-accent" />
                      <span className="min-w-0 flex-1 truncate text-sm text-primary">{folder.name}</span>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </button>
                  ))}
                  {visibleQuestions.map((question) => (
                    <DocumentRow key={question.id} question={question} checked={selected.includes(question.id)} onToggle={() => toggle(question.id)} />
                  ))}
                  {childFolders.length === 0 && visibleQuestions.length === 0 ? <div className="p-10 text-center text-sm text-muted">This location has no documents.</div> : null}
                </>
              )}
            </div>
          )}
        </section>

        <aside className="flex flex-col p-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-muted">Selected</span>
            <span className="text-xs text-secondary">{selectedQuestions.length}</span>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-auto py-3">
            {selectedQuestions.length === 0 ? <p className="text-sm text-muted">Select question documents from the archive explorer.</p> : selectedQuestions.map((question) => (
              <button key={question.id} type="button" onClick={() => toggle(question.id)} className="w-full border border-border p-3 text-left hover:border-error/40">
                <div className="flex gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted" /><span className="line-clamp-3 text-xs text-primary">{question.questionEn}</span></div>
              </button>
            ))}
          </div>
          <button type="button" disabled={!selected.length || importing} onClick={() => void importSelected()} className="mt-3 inline-flex items-center justify-center gap-2 bg-primary px-4 py-3 text-xs font-medium text-primary-foreground disabled:opacity-40">
            {importing ? "Importing..." : <><Check className="h-4 w-4" /> Add {selected.length || ""} question{selected.length === 1 ? "" : "s"}</>}
          </button>
        </aside>
      </div>
    </div>
  );
}

function DocumentRow({ question, checked, onToggle }: { question: ArchiveQuestion; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-white/[0.02]">
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1 h-4 w-4 accent-current" />
      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
      <span className="min-w-0 flex-1">
        <span className="block line-clamp-2 text-sm text-primary">{question.questionEn}</span>
        <span className="mt-1 block text-[10px] font-mono uppercase tracking-[0.12em] text-muted">{question.type} · {question.difficulty} · {question.marks} marks</span>
      </span>
    </label>
  );
}
