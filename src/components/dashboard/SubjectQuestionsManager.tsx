"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Pencil,
  MoveRight,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { QuestionArchiveSubjectIcon } from "./QuestionArchiveSubjectIcon";
import {
  createQuestionArchiveFolderAction,
  deleteQuestionArchiveFolderAction,
  renameQuestionArchiveFolderAction,
  moveQuestionArchiveQuestionsAction,
} from "@/lib/question-archive/folder-actions";

type QuestionType = "mcq" | "short";
type Difficulty = "easy" | "medium" | "hard";

type FolderRow = {
  id: string;
  name: string;
  parentId: string | null;
  _count?: { questions: number; children: number };
};

type Question = {
  id: string;
  type: QuestionType;
  questionEn: string;
  questionBn: string;
  difficulty: Difficulty;
  marks: number;
  createdAt: Date | string;
  folderId: string | null;
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
  subject: { id: string; name: string };
  initialFolders: FolderRow[];
  initialQuestions: Question[];
  currentFolderId: string | null;
  breadcrumbs: { id: string; name: string }[];
};

export function SubjectQuestionsManager({
  subject,
  initialFolders,
  initialQuestions,
  currentFolderId,
  breadcrumbs,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | QuestionType>("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveDestination, setMoveDestination] = useState<string>("__root__");
  const [moving, setMoving] = useState(false);

  const childFolders = useMemo(
    () => initialFolders.filter((folder) => folder.parentId === currentFolderId),
    [initialFolders, currentFolderId],
  );

  const questions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialQuestions.filter((question) => {
      if (question.folderId !== currentFolderId) return false;
      const matchesSearch =
        !query ||
        question.questionEn.toLowerCase().includes(query) ||
        question.questionBn.toLowerCase().includes(query);
      const matchesType = type === "all" || question.type === type;
      const matchesDifficulty = difficulty === "all" || question.difficulty === difficulty;
      return matchesSearch && matchesType && matchesDifficulty;
    });
  }, [initialQuestions, currentFolderId, search, type, difficulty]);

  const allVisibleSelected = questions.length > 0 && questions.every((q) => selectedIds.has(q.id));
  const someVisibleSelected = questions.some((q) => selectedIds.has(q.id));

  function toggleQuestion(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        questions.forEach((question) => next.delete(question.id));
      } else {
        questions.forEach((question) => next.add(question.id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setMoveDestination("__root__");
  }

  async function moveSelected() {
    if (selectedIds.size === 0) return;
    setMoving(true);
    setMessage("");
    const destination = moveDestination === "__root__" ? null : moveDestination;
    const result = await moveQuestionArchiveQuestionsAction(Array.from(selectedIds), destination);
    if (!result.success) {
      setMessage(result.error ?? "Could not move the selected questions.");
      setMoving(false);
      return;
    }
    clearSelection();
    setMoving(false);
    router.refresh();
  }

  async function createFolder() {
    if (!folderName.trim()) return;
    setBusy(true);
    setMessage("");
    const result = await createQuestionArchiveFolderAction({
      subjectId: subject.id,
      parentId: currentFolderId,
      name: folderName,
    });
    if (!result.success) {
      setMessage(result.error ?? "Could not create folder.");
      setBusy(false);
      return;
    }
    setFolderName("");
    setShowNewFolder(false);
    setBusy(false);
    router.refresh();
  }

  async function renameFolder(folder: FolderRow) {
    const nextName = window.prompt("Rename folder", folder.name);
    if (!nextName || nextName.trim() === folder.name) return;
    const result = await renameQuestionArchiveFolderAction(folder.id, nextName);
    if (!result.success) {
      setMessage(result.error ?? "Could not rename folder.");
      return;
    }
    setMenuId(null);
    router.refresh();
  }

  async function deleteFolder(folder: FolderRow) {
    const result = await deleteQuestionArchiveFolderAction(folder.id);
    if (!result.success) {
      setMessage(result.error ?? "Could not delete folder.");
      setMenuId(null);
      return;
    }
    setMenuId(null);
    router.refresh();
  }

  const folderHref = (folderId: string | null) =>
    folderId
      ? `/dashboard/question-archive/${subject.id}?folderId=${encodeURIComponent(folderId)}`
      : `/dashboard/question-archive/${subject.id}`;

  const folderLabel = (folderId: string) => {
    const chain: string[] = [];
    let cursor = initialFolders.find((folder) => folder.id === folderId);
    while (cursor) {
      chain.unshift(cursor.name);
      cursor = cursor.parentId
        ? initialFolders.find((folder) => folder.id === cursor?.parentId)
        : undefined;
    }
    return chain.join(" / ");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <Link href="/dashboard/question-archive" className="text-xs uppercase tracking-[0.16em] text-muted hover:text-primary">
            Question Archive
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-elevated text-accent">
              <QuestionArchiveSubjectIcon subject={subject.name} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{subject.name}</h1>
              <p className="text-sm text-muted">{initialQuestions.length} documents · {initialFolders.length} folders</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowNewFolder(true)} className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-2 text-xs font-medium text-secondary hover:border-accent hover:text-primary">
            <FolderPlus className="h-3.5 w-3.5" /> New folder
          </button>
          <Link href={`/dashboard/question-archive/${subject.id}/new${currentFolderId ? `?folderId=${encodeURIComponent(currentFolderId)}` : ""}`} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
            <Plus className="h-3.5 w-3.5" /> New question
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 text-xs text-muted">
        <Link href={folderHref(null)} className="hover:text-primary">{subject.name}</Link>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <Link href={folderHref(crumb.id)} className="hover:text-primary">{crumb.name}</Link>
          </span>
        ))}
      </div>

      {showNewFolder ? (
        <div className="border border-border bg-elevated p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input autoFocus value={folderName} onChange={(event) => setFolderName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createFolder(); if (event.key === "Escape") setShowNewFolder(false); }} placeholder="Folder name" className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
            <button type="button" disabled={busy} onClick={() => void createFolder()} className="border border-border px-4 py-2 text-xs font-medium hover:border-accent disabled:opacity-50">{busy ? "Creating..." : "Create folder"}</button>
            <button type="button" onClick={() => setShowNewFolder(false)} className="px-3 py-2 text-xs text-muted hover:text-primary">Cancel</button>
          </div>
        </div>
      ) : null}

      {message ? <div className="border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{message}</div> : null}

      <div className="flex flex-col gap-3 border-y border-border py-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents in this folder..." className="w-full border border-border bg-background py-2.5 pl-9 pr-3 text-sm" />
        </div>
        <select value={type} onChange={(event) => setType(event.target.value as "all" | QuestionType)} className="border border-border bg-background px-3 py-2.5 text-sm">
          <option value="all">All types</option>
          <option value="mcq">MCQ</option>
          <option value="short">Short question</option>
        </select>
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as "all" | Difficulty)} className="border border-border bg-background px-3 py-2.5 text-sm">
          <option value="all">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {selectedIds.size > 0 ? (
        <div className="sticky top-3 z-20 flex flex-col gap-3 border border-border bg-elevated px-4 py-3 shadow-lg lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 min-w-7 items-center justify-center bg-primary px-2 text-xs font-semibold text-primary-foreground">{selectedIds.size}</span>
            <span className="text-sm font-medium text-primary">documents selected</span>
            <button type="button" onClick={clearSelection} className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary"><X className="h-3.5 w-3.5" /> Clear</button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={moveDestination} onChange={(event) => setMoveDestination(event.target.value)} className="min-w-[220px] border border-border bg-background px-3 py-2 text-xs">
              <option value="__root__">Root</option>
              {initialFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>{folderLabel(folder.id)}</option>
              ))}
            </select>
            <button type="button" disabled={moving} onClick={() => void moveSelected()} className="inline-flex items-center justify-center gap-1.5 bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
              <MoveRight className="h-3.5 w-3.5" /> {moving ? "Moving..." : "Move selected"}
            </button>
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-secondary">
              <input type="checkbox" checked={allVisibleSelected} ref={(element) => { if (element) element.indeterminate = !allVisibleSelected && someVisibleSelected; }} onChange={toggleAllVisible} className="h-4 w-4 accent-current" />
              Select visible
            </label>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted">{currentFolderId ? "Folder contents" : "Root"}</p>
          </div>
          <p className="text-xs text-muted">{childFolders.length} folders · {questions.length} documents</p>
        </div>

        <div className="border-y border-border bg-elevated/20">
          {childFolders.map((folder) => (
            <div key={folder.id} className="group flex items-center gap-3 border-b border-border/80 px-3 py-3 transition-colors hover:bg-white/[0.025]">
              <Link href={folderHref(folder.id)} className="flex min-w-0 flex-1 items-center gap-3">
                <Folder className="h-5 w-5 shrink-0 text-accent" />
                <span className="truncate text-sm font-medium text-primary">{folder.name}</span>
                <span className="text-xs text-muted">{folder._count?.children ?? 0} folders · {folder._count?.questions ?? 0} docs</span>
              </Link>
              <div className="relative">
                <button type="button" onClick={() => setMenuId(menuId === folder.id ? null : folder.id)} className="p-2 text-muted hover:text-primary" aria-label="Folder actions"><MoreHorizontal className="h-4 w-4" /></button>
                {menuId === folder.id ? (
                  <div className="absolute right-0 z-20 mt-1 w-36 border border-border bg-elevated p-1 shadow-lg">
                    <button type="button" onClick={() => void renameFolder(folder)} className="flex w-full items-center gap-2 px-2 py-2 text-left text-xs hover:bg-white/5"><Pencil className="h-3.5 w-3.5" /> Rename</button>
                    <button type="button" onClick={() => void deleteFolder(folder)} className="flex w-full items-center gap-2 px-2 py-2 text-left text-xs text-error hover:bg-white/5"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {questions.map((question) => {
            const selected = selectedIds.has(question.id);
            return (
              <div key={question.id} className={`group flex items-start gap-3 border-b border-border/80 px-3 py-4 transition-colors last:border-b-0 ${selected ? "bg-primary/[0.06]" : "hover:bg-white/[0.025]"}`}>
                <div className="pt-1">
                  <input type="checkbox" checked={selected} onChange={() => toggleQuestion(question.id)} aria-label={`Select question ${question.questionEn}`} className="h-4 w-4 accent-current" />
                </div>
                <FileText className={`mt-0.5 h-5 w-5 shrink-0 ${selected ? "text-primary" : "text-muted"}`} />
                <Link href={`/dashboard/question-archive/${subject.id}/${question.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="line-clamp-2 text-sm font-medium leading-6 text-primary group-hover:underline group-hover:underline-offset-4">{question.questionEn}</span>
                    <span className="border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase text-muted">{question.type}</span>
                    <span className="border border-border bg-background px-1.5 py-0.5 text-[10px] capitalize text-muted">{question.difficulty}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs leading-5 text-muted">{question.questionBn}</p>
                  <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.12em] text-muted">{question.marks} marks · document</p>
                </Link>
                <span className="mt-1 hidden text-[10px] uppercase tracking-[0.14em] text-muted sm:block">Open</span>
              </div>
            );
          })}
        </div>

        {childFolders.length === 0 && questions.length === 0 ? (
          <div className="border-b border-border py-16 text-center">
            <FileText className="mx-auto h-6 w-6 text-muted" />
            <h2 className="mt-3 text-base font-medium text-primary">This folder is empty</h2>
            <p className="mt-1 text-sm text-muted">Create a folder or add a question document.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
