"use client";

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export function Histogram({
  title,
  data,
}: {
  title: string;
  data: ChartDataPoint[];
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-black/40 p-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        {title}
      </span>

      <div className="flex h-36 items-end gap-3 border-b border-border/40 px-2 pt-4">
        {data.map((item, i) => {
          const heightPercent = (item.value / maxVal) * 100;

          return (
            <div
              key={i}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="font-mono text-[10px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
                {item.value}
              </span>

              <div
                className="w-full rounded-t bg-accent/80 transition-all duration-300 hover:bg-accent"
                style={{ height: `${Math.max(heightPercent, 4)}%` }}
              />

              <span className="max-w-full truncate font-mono text-[10px] text-secondary">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PieChart({
  title,
  data,
}: {
  title: string;
  data: ChartDataPoint[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

  const defaultColors = [
    "var(--color-accent)",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
  ];

  const segments = data.map((item, index) => {
    const percentage = item.value / total;

    const accumulatedPercentage = data
      .slice(0, index)
      .reduce((sum, previousItem) => sum + previousItem.value / total, 0);

    return {
      item,
      index,
      percentage,
      strokeDasharray: `${percentage * 100} 100`,
      strokeDashoffset: -accumulatedPercentage * 100,
    };
  });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-black/40 p-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        {title}
      </span>

      <div className="flex items-center gap-6 py-2">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 32 32" className="h-full w-full -rotate-90">
            {segments.map(
              ({ item, index, strokeDasharray, strokeDashoffset }) => (
                <circle
                  key={index}
                  cx="16"
                  cy="16"
                  r="14"
                  fill="transparent"
                  stroke={
                    item.color || defaultColors[index % defaultColors.length]
                  }
                  strokeWidth="4"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:stroke-width-[5]"
                />
              ),
            )}
          </svg>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      item.color || defaultColors[i % defaultColors.length],
                  }}
                />
                <span className="text-secondary">{item.label}</span>
              </div>

              <span className="font-mono text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
