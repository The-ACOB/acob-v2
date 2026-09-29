"use client";

import { useEffect, useState } from "react";
import { Archive, Plus } from "lucide-react";
import { QuestionArchiveSubjectIcon } from "./QuestionArchiveSubjectIcon";
import {
  createQuestionArchiveSubjectAction,
  deleteQuestionArchiveSubjectAction,
} from "@/lib/question-archive/subject-actions";

type Subject = {
  id: string;
  name: string;
  _count?: {
    questions: number;
  };
};

export function QuestionArchiveManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSubjects() {
    setLoading(true);

    try {
      const response = await fetch("/api/question-archive/subjects");

      if (!response.ok) {
        throw new Error("Failed to load subjects.");
      }

      const data = await response.json();
      setSubjects(data.subjects ?? []);
    } catch (error) {
      console.error(error);
      setMessage("Unable to load archive subjects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  async function handleCreateSubject() {
    if (!subjectName.trim()) return;

    setSaving(true);
    setMessage("");

    const result = await createQuestionArchiveSubjectAction(subjectName);

    if (!result.success) {
      setMessage(result.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }

    setSubjectName("");
    setShowAddSubject(false);
    setSaving(false);

    await loadSubjects();
  }

  async function handleDeleteSubject(id: string) {
    const result = await deleteQuestionArchiveSubjectAction(id);

    if (!result.success) {
      setMessage(result.error ?? "Something went wrong.");
      return;
    }

    await loadSubjects();
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Question Archive
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize reusable Olympiad questions by subject.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddSubject(true)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus aria-hidden="true" className="mr-1.5 inline h-4 w-4" strokeWidth={1.75} />
          Add Subject
        </button>
      </div>

      {showAddSubject && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              autoFocus
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleCreateSubject();
                }
              }}
              placeholder="e.g. Physics"
              className="flex-1 rounded-lg border bg-background px-3 py-2.5"
            />

            <button
              type="button"
              disabled={saving}
              onClick={handleCreateSubject}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Subject"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAddSubject(false);
                setSubjectName("");
              }}
              className="rounded-lg border px-4 py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
          </div>

          {message && (
            <p className="mt-3 text-sm text-destructive">{message}</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground">
          Loading subjects...
        </div>
      ) : subjects.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Archive aria-hidden="true" className="mx-auto h-6 w-6 text-accent" strokeWidth={1.65} />
          <h2 className="mt-4 text-lg font-semibold">
            No subjects yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create your first subject to start organizing your question
            archive.
          </p>

          <button
            type="button"
            onClick={() => setShowAddSubject(true)}
            className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Plus aria-hidden="true" className="mr-1.5 inline h-4 w-4" strokeWidth={1.75} />
            Add Your First Subject
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="group rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    `/dashboard/question-archive/${subject.id}`;
                }}
                className="block w-full text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center border border-border bg-background text-accent">
                  <QuestionArchiveSubjectIcon subject={subject.name} />
                </div>

                <h2 className="mt-4 font-semibold">
                  {subject.name}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {subject._count?.questions ?? 0} archived{" "}
                  {(subject._count?.questions ?? 0) === 1 ? "question" : "questions"}
                </p>
              </button>

              <div className="mt-4 flex justify-end border-t pt-3">
                <button
                  type="button"
                  onClick={() => handleDeleteSubject(subject.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && !showAddSubject && (
        <div className="rounded-lg border px-4 py-3 text-sm">
          {message}
        </div>
      )}
    </div>
  );
}

