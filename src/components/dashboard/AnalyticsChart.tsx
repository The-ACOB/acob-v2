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
    <div className="flex flex-col gap-3 rounded-xl bg-black/40 border border-border/60 p-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        {title}
      </span>
      <div className="flex items-end gap-3 h-36 pt-4 px-2 border-b border-border/40">
        {data.map((item, i) => {
          const heightPercent = (item.value / maxVal) * 100;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
            >
              <span className="text-[10px] font-mono text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                {item.value}
              </span>
              <div
                className="w-full bg-accent/80 hover:bg-accent rounded-t transition-all duration-300"
                style={{ height: `${Math.max(heightPercent, 4)}%` }}
              />
              <span className="text-[10px] font-mono text-secondary truncate max-w-full">
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
  let accumulatedAngle = 0;

  const defaultColors = [
    "var(--color-accent)",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
  ];

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-black/40 border border-border/60 p-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        {title}
      </span>
      <div className="flex items-center gap-6 py-2">
        {/* SVG Pie Representation */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
            {data.map((item, i) => {
              const percentage = item.value / total;
              const strokeDasharray = `${percentage * 100} 100`;
              const strokeDashoffset = -accumulatedAngle * 100;
              accumulatedAngle += percentage;

              return (
                <circle
                  key={i}
                  cx="16"
                  cy="16"
                  r="14"
                  fill="transparent"
                  stroke={item.color || defaultColors[i % defaultColors.length]}
                  strokeWidth="4"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:stroke-width-[5]"
                />
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 flex-1">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
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
