import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide this column in the stacked mobile card view (e.g. a redundant "" action column). */
  hideLabel?: boolean;
};

/**
 * Renders as a real table from `sm` upward, and as stacked label/value
 * cards below that — mobile never has to scroll a data table
 * sideways to read it. The same columns/rows power both layouts, so
 * callers never need to think about which one is showing.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  onRowClick,
  rowClassName,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      {/* Desktop / tablet: real table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col, i) => (
                <th
                  key={col.header ? `${col.header}-${i}` : `col-${i}`}
                  className="whitespace-nowrap px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowId = getRowId(row);
              const customClass = rowClassName
                ? rowClassName(row)
                : "border-b border-border last:border-b-0 hover:bg-elevated/40";
              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick?.(row)}
                  className={customClass}
                >
                  {columns.map((col, i) => (
                    <td
                      key={col.header ? `${col.header}-${i}` : `cell-${i}`}
                      className={`px-4 py-3.5 align-middle text-secondary ${col.className ?? ""}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked label/value cards — no horizontal scroll */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => {
          const rowId = getRowId(row);
          return (
            <div
              key={rowId}
              onClick={() => onRowClick?.(row)}
              className="rounded-lg border border-border bg-elevated p-4 cursor-pointer"
            >
              <dl className="flex flex-col gap-2.5">
                {columns
                  .filter((col) => !col.hideLabel)
                  .map((col, i) => (
                    <div
                      key={col.header ? `${col.header}-${i}` : `m-col-${i}`}
                      className="flex items-baseline justify-between gap-4"
                    >
                      <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                        {col.header}
                      </dt>
                      <dd className="text-right text-sm text-secondary">
                        {col.cell(row)}
                      </dd>
                    </div>
                  ))}
              </dl>
              {columns
                .filter((col) => col.hideLabel)
                .map((col, i) => (
                  <div
                    key={
                      col.header ? `${col.header}-hidden-${i}` : `m-hidden-${i}`
                    }
                    className="mt-3 border-t border-border pt-3"
                  >
                    {col.cell(row)}
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
