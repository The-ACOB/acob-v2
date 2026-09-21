"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import type { ActionResult } from "@/lib/auth/actions";

type Row = {
  id: string;
  userId: string;
  institution: string | null;
  gradeLevel: string | null;
  email: string;
  fullName: string | null;
  roles: string[];
};

export function ParticipantsClientManager({
  initialRows,
  availableRoles,
  bulkAction,
}: {
  initialRows: Row[];
  availableRoles: string[];
  bulkAction: (userIds: string[], roleKey: string) => Promise<ActionResult>;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const validRoles = availableRoles.filter(Boolean);
  const [selectedRole, setSelectedRole] = useState(
    validRoles[0] || "PARTICIPANT",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === initialRows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(initialRows.map((r) => r.userId));
    }
  };

  const toggleSelectRow = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleBulkRoleUpdate = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await bulkAction(selectedIds, selectedRole);
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.error || "Failed to update roles.");
    } else {
      setSelectedIds([]);
    }
  };

  const columns: Column<Row>[] = [
    {
      header: "",
      cell: (r) => {
        const isSelected = selectedIds.includes(r.userId);
        return (
          <div className="flex items-center">
            <div
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation(); // Prevent duplicate trigger from row click
                toggleSelectRow(r.userId);
              }}
              className={`h-4 w-4 rounded-[4px] border transition-all duration-150 flex items-center justify-center cursor-pointer ${
                isSelected
                  ? "bg-white border-white text-black shadow-sm"
                  : "border-border/80 bg-background hover:border-white/40"
              }`}
            >
              {isSelected && (
                <svg
                  className="h-3 w-3 stroke-[3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
        );
      },
      className: "w-10",
      hideLabel: true,
    },
    {
      header: "Name / Email",
      cell: (r) => (
        <div className="flex flex-col py-1">
          <span className="font-medium text-primary">{r.fullName ?? "—"}</span>
          <span className="text-xs text-muted">{r.email}</span>
        </div>
      ),
    },
    {
      header: "Roles",
      cell: (r) => (
        <span className="text-xs font-mono text-secondary">
          {r.roles.join(", ") || "—"}
        </span>
      ),
    },
    {
      header: "Institution",
      cell: (r) => (
        <span className="text-secondary truncate max-w-[200px] block">
          {r.institution ?? "—"}
        </span>
      ),
    },
    {
      header: "Grade",
      cell: (r) =>
        r.gradeLevel ? (
          <Badge tone="neutral">{r.gradeLevel}</Badge>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      header: "",
      hideLabel: true,
      cell: (r) => (
        <Link
          href={`/dashboard/participants/${r.userId}`}
          className="text-xs font-medium text-accent hover:underline underline-offset-4 transition-colors"
        >
          View / Edit
        </Link>
      ),
    },
  ];

  return (
    <div className="relative space-y-3 pb-24">
      {initialRows.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs text-muted font-mono">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="hover:text-primary uppercase tracking-wider transition-colors"
          >
            {selectedIds.length === initialRows.length
              ? "Deselect All"
              : "Select All Visible"}
          </button>
          <span>{selectedIds.length} selected</span>
        </div>
      )}

      {/* Clean Card Container with Controlled Height & Smooth Scroll */}
      <div className="rounded-xl border border-border bg-elevated/20 overflow-hidden shadow-sm">
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          <DataTable
            columns={columns}
            rows={initialRows}
            getRowId={(r) => r.id}
            emptyTitle="No participants found matching criteria"
            onRowClick={(r) => toggleSelectRow(r.userId)}
            rowClassName={(r) =>
              `cursor-pointer transition-colors border-b border-border/40 last:border-0 hover:bg-elevated/40 ${
                selectedIds.includes(r.userId) ? "bg-elevated/60" : ""
              }`
            }
          />
        </div>
      </div>

      {/* Floating Action Bar Matching Native Theme */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-border bg-elevated px-5 py-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 pr-3 border-r border-border">
            <span className="text-xs font-mono font-medium text-secondary">
              {selectedIds.length} selected
            </span>
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-secondary focus:border-border focus:outline-none cursor-pointer"
          >
            {validRoles.map((roleKey) => (
              <option
                key={roleKey}
                value={roleKey}
                className="bg-background text-primary"
              >
                {roleKey}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleBulkRoleUpdate}
            disabled={isSubmitting}
            className="rounded-lg bg-primary text-background px-4 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Change Role"}
          </button>

          {errorMsg && (
            <span className="text-xs text-red-400 pl-2">{errorMsg}</span>
          )}
        </div>
      )}
    </div>
  );
}
