"use client";

import { useMemo, useState } from "react";
import { Check, Folder, FolderPlus, X } from "lucide-react";
import { createQuestionArchiveFolderAction } from "@/lib/question-archive/folder-actions";
import { archiveOlympiadQuestionsAction } from "@/lib/olympiads/actions";
import { useToast } from "@/components/dashboard/Toast";

type Subject = { id: string; name: string };
type FolderRow = { id: string; subjectId: string; parentId: string | null; name: string };

type Props = {
  olympiadId: string;
  questionIds: string[];
  olympiadSubject: string | null;
  subjects: Subject[];
  folders: FolderRow[];
  onClose: () => void;
  onDone: () => void;
};

export function QuestionArchiveDestinationDialog({
  olympiadId,
  questionIds,
  olympiadSubject,
  subjects,
  folders: initialFolders,
  onClose,
  onDone,
}: Props) {
  const matchingSubject = subjects.find(
    (subject) =>
      olympiadSubject?.trim().toLowerCase() === subject.name.trim().toLowerCase(),
  );

  const [subjectId, setSubjectId] = useState(matchingSubject?.id ?? subjects[0]?.id ?? "");
  const [folderId, setFolderId] = useState<string>("__root__");
  const [folders, setFolders] = useState(initialFolders);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const subjectFolders = useMemo(() => {
    const current = folders.filter((folder) => folder.subjectId === subjectId);
    const byParent = new Map<string | null, FolderRow[]>();

    for (const folder of current) {
      const siblings = byParent.get(folder.parentId) ?? [];
      siblings.push(folder);
      byParent.set(folder.parentId, siblings);
    }

    for (const siblings of byParent.values()) {
      siblings.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    }

    const ordered: Array<FolderRow & { path: string }> = [];

    function visit(parentId: string | null, parentPath = "") {
      for (const folder of byParent.get(parentId) ?? []) {
        const path = parentPath ? `${parentPath} / ${folder.name}` : folder.name;
        ordered.push({ ...folder, path });
        visit(folder.id, path);
      }
    }

    visit(null);
    return ordered;
  }, [folders, subjectId]);

  function changeSubject(nextSubjectId: string) {
    setSubjectId(nextSubjectId);
    setFolderId("__root__");
  }

  async function createFolder() {
    const name = newFolderName.trim();
    if (!name || !subjectId) return;

    setCreatingFolder(true);
    const result = await createQuestionArchiveFolderAction({
      subjectId,
      parentId: null,
      name,
    });

    if (!result.success || !result.data) {
      toast("error", "Could not create folder", result.error ?? "Please try again.");
      setCreatingFolder(false);
      return;
    }

    setFolders((current) => [
      ...current,
      {
        id: result.data.id,
        subjectId: result.data.subjectId,
        parentId: result.data.parentId,
        name: result.data.name,
      },
    ]);
    setFolderId(result.data.id);
    setNewFolderName("");
    setShowCreateFolder(false);
    setCreatingFolder(false);
  }

  async function archiveQuestions() {
    if (!subjectId || questionIds.length === 0) return;

    setSaving(true);
    const result = await archiveOlympiadQuestionsAction(
      olympiadId,
      questionIds,
      subjectId,
      folderId === "__root__" ? null : folderId,
    );

    if (!result.ok) {
      toast("error", "Could not archive questions", result.error);
      setSaving(false);
      return;
    }

    toast(
      "success",
      "Questions added to Question Archive",
      `${result.data?.archived ?? questionIds.length} question${questionIds.length === 1 ? "" : "s"} archived.`,
    );
    setSaving(false);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl border border-border-strong bg-elevated shadow-2xl">
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Question Archive</p>
            <h2 className="mt-1 font-display text-xl text-primary">Archive selected questions</h2>
            <p className="mt-1 text-sm text-secondary">
              {questionIds.length} standalone question{questionIds.length === 1 ? "" : "s"} will be added to the archive and linked to their existing Olympiad copies. Missing Bangla text will be generated automatically.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="text-muted hover:text-primary disabled:opacity-40" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {subjects.length === 0 ? (
            <div className="border border-error/30 bg-error/5 p-4 text-sm text-error">
              No Question Archive subjects exist yet. Create a subject in Question Archive first.
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-muted">Archive subject</span>
            <select
              value={subjectId}
              onChange={(event) => changeSubject(event.target.value)}
              disabled={saving || !subjects.length}
              className="w-full border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-accent"
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
            {olympiadSubject && matchingSubject ? (
              <span className="mt-1 block text-xs text-muted">Matched automatically to the Olympiad subject: {olympiadSubject}</span>
            ) : null}
          </label>

          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-muted">Destination folder</span>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <select
                value={folderId}
                onChange={(event) => setFolderId(event.target.value)}
                disabled={saving || !subjectId}
                className="w-full border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-accent"
              >
                <option value="__root__">Subject root (no folder)</option>
                {subjectFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.path}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCreateFolder((current) => !current)}
                disabled={saving || !subjectId}
                className="inline-flex items-center justify-center gap-1.5 border border-border-strong px-3 py-2.5 text-xs font-medium text-secondary hover:border-accent hover:text-primary disabled:opacity-40"
              >
                <FolderPlus className="h-3.5 w-3.5" /> New folder
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted">Folders show their full path, so nested folders such as <span className="text-secondary">Math মেধা - 2026 / Junior</span> are easy to distinguish from their parent.</p>
          </div>

          {showCreateFolder ? (
            <div className="border border-border bg-background p-3">
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") void createFolder(); }}
                  placeholder="e.g. Math Medha 2026"
                  className="min-w-0 flex-1 border border-border bg-elevated px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                />
                <button type="button" disabled={creatingFolder || !newFolderName.trim()} onClick={() => void createFolder()} className="inline-flex items-center gap-1.5 bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40">
                  <FolderPlus className="h-3.5 w-3.5" /> {creatingFolder ? "Creating..." : "Create"}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">New folders created here are added at the selected subject's root.</p>
            </div>
          ) : null}

          <div className="border border-border bg-background p-3 text-xs text-secondary">
            <div className="flex items-start gap-2">
              <Folder className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>The Olympiad questions will stay in the exam. Their content will be copied into the archive and the existing questions will be linked to those archive documents.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-xs text-muted hover:text-primary disabled:opacity-40">Cancel</button>
          <button
            type="button"
            onClick={() => void archiveQuestions()}
            disabled={saving || !subjectId || questionIds.length === 0}
            className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            {saving ? "Preparing & archiving..." : `Archive ${questionIds.length} question${questionIds.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
