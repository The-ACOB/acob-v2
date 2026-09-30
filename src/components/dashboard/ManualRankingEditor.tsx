"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  RotateCcw,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import {
  saveManualRankingAction,
  resetManualRankingAction,
} from "@/lib/olympiads/actions";

export type ManualRankingRow = {
  id: string;
  name: string;
  email: string;
  score: number | null;
  totalMarks: number | null;
  rank: number | null;
  manualRank: number | null;
};

export function ManualRankingEditor({
  olympiadId,
  rows,
  published,
}: {
  olympiadId: string;
  rows: ManualRankingRow[];
  published: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const rankedRows = useMemo(() => {
    return [...rows]
      .filter((row) => row.rank !== null)
      .sort(
        (a, b) =>
          (a.rank ?? Number.MAX_SAFE_INTEGER) -
          (b.rank ?? Number.MAX_SAFE_INTEGER),
      );
  }, [rows]);

  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  const [order, setOrder] = useState<string[]>(rankedRows.map((row) => row.id));

  function beginEditing() {
    setOrder(rankedRows.map((row) => row.id));
    setEditing(true);
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= order.length) {
      return;
    }

    const next = [...order];

    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];

    setOrder(next);
  }

  async function save() {
    if (order.length < 1) {
      return;
    }

    setPending(true);

    const result = await saveManualRankingAction(olympiadId, order);

    setPending(false);

    if (!result.ok) {
      toast("error", "Could not update ranking", result.error);
      return;
    }

    toast(
      "success",
      "Ranking updated",
      "The published ranking now uses the new order.",
    );

    setEditing(false);

    router.refresh();
  }

  async function reset() {
    setPending(true);

    const result = await resetManualRankingAction(olympiadId);

    setPending(false);

    if (!result.ok) {
      toast("error", "Could not reset ranking", result.error);
      return;
    }

    toast("success", "Automatic ranking restored");

    setEditing(false);

    router.refresh();
  }

  const byId = new Map(rankedRows.map((row) => [row.id, row]));

  const visibleRows = order
    .map((id) => byId.get(id))
    .filter((row): row is ManualRankingRow => Boolean(row));

  const hasManualOverride = rankedRows.some((row) => row.manualRank !== null);

  return (
    <section className="rounded-lg border border-border bg-elevated p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-primary">Ranking control</h2>

          <p className="mt-1 text-sm text-secondary">
            {editing
              ? "Move ranked participants into the exact published order. Scores are not changed."
              : hasManualOverride
                ? "A manual ranking override is currently active."
                : "Automatic score-based ranking is currently active."}
          </p>
        </div>

        {!editing ? (
          <div className="flex gap-2">
            {hasManualOverride ? (
              <Button
                variant="secondary"
                className="text-xs"
                disabled={pending}
                onClick={reset}
              >
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Restore automatic
              </Button>
            ) : null}

            <Button
              variant="primary"
              className="text-xs"
              disabled={pending || rankedRows.length < 2}
              onClick={beginEditing}
            >
              Edit ranking
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="text-xs"
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              className="text-xs"
              disabled={pending}
              onClick={save}
            >
              <Save className="mr-2 h-3.5 w-3.5" />

              {pending ? "Saving..." : "Save ranking"}
            </Button>
          </div>
        )}
      </div>

      {published && editing ? (
        <div className="mb-4 rounded-md border border-accent/20 bg-accent/5 px-4 py-3 text-xs text-secondary">
          Results are already published. Saving will immediately change the
          published positions shown to participants.
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-black/20 text-xs font-mono uppercase tracking-wider text-muted">
            <tr>
              <th className="w-14 p-3">#</th>

              <th className="p-3">Participant</th>

              <th className="p-3">Score</th>

              {editing ? <th className="w-32 p-3 text-right">Move</th> : null}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/40 text-sm">
            {visibleRows.map((row, index) => (
              <tr key={row.id} className="hover:bg-white/[0.02]">
                <td className="p-3 font-mono text-muted">#{index + 1}</td>

                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {editing ? (
                      <GripVertical className="h-4 w-4 text-muted" />
                    ) : null}

                    <div>
                      <div className="text-primary">{row.name}</div>

                      <div className="text-xs text-secondary">{row.email}</div>
                    </div>
                  </div>
                </td>

                <td className="p-3 text-secondary">
                  {row.score ?? "—"} / {row.totalMarks ?? "—"}
                </td>

                {editing ? (
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        aria-label={`Move ${row.name} up`}
                        disabled={pending || index === 0}
                        onClick={() => move(index, -1)}
                        className="rounded border border-border p-1.5 text-secondary transition hover:bg-white/5 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        aria-label={`Move ${row.name} down`}
                        disabled={pending || index === visibleRows.length - 1}
                        onClick={() => move(index, 1)}
                        className="rounded border border-border p-1.5 text-secondary transition hover:bg-white/5 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
