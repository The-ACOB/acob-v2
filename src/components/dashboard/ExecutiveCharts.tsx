"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ExecutiveChartDatum = {
  label: string;
  value: number;
};

const ink = "#1e5145";
const softPalette = ["#1e5145", "#55786c", "#8aa096", "#c84a31", "#b8b8a9", "#728078", "#d3d0c6", "#3b5e54", "#9c9b8c"];

function CompactBarChart({
  data,
  height,
  name,
  color = ink,
}: {
  data: ExecutiveChartDatum[];
  height: number;
  name: string;
  color?: string;
}) {
  const max = Math.max(...data.map(({ value }) => value), 1);

  return (
    <div style={{ height }} className="w-full min-w-0" aria-label={name} role="img">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 2, right: 28, bottom: 2, left: 0 }} barCategoryGap={12}>
          <XAxis type="number" domain={[0, Math.max(1, max * 1.18)]} hide />
          <YAxis
            type="category"
            dataKey="label"
            width={108}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#57625c", fontSize: 12, fontFamily: "Inter Variable, Inter, sans-serif" }}
          />
          <Tooltip
            cursor={{ fill: "#1e5145", fillOpacity: 0.045 }}
            contentStyle={{ border: "1px solid #d6d7ce", borderRadius: 2, background: "#fbfaf6", fontSize: 12 }}
            formatter={(value) => [String(value ?? 0), "Count"]}
          />
          <Bar dataKey="value" fill={color} radius={[0, 1, 1, 0]} maxBarSize={13}>
            {data.map((item) => (
              <Cell key={item.label} fill={item.value === 0 ? "#d6d7ce" : color} />
            ))}
            <LabelList dataKey="value" position="right" style={{ fill: "#202a26", fontSize: 11, fontFamily: "IBM Plex Mono, monospace" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="sr-only">
        {data.map((item) => `${item.label}: ${item.value}`).join(". ")}
      </div>
    </div>
  );
}

export function RoleDistribution({
  roles,
  totalUsers,
  showDonut,
}: {
  roles: ExecutiveChartDatum[];
  totalUsers: number;
  showDonut: boolean;
}) {
  return (
    <div className={showDonut ? "grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-center" : ""}>
      <CompactBarChart data={roles} height={Math.max(250, roles.length * 36)} name="Accounts by role" />
      {showDonut ? (
        <div className="flex flex-col items-center gap-3 border-t border-border pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          <div className="relative h-36 w-36" role="img" aria-label={`Account composition, ${totalUsers} users`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roles} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius="68%" outerRadius="92%" paddingAngle={1} stroke="#fbfaf6" strokeWidth={2}>
                  {roles.map((role, index) => (
                    <Cell key={role.label} fill={softPalette[index % softPalette.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ border: "1px solid #d6d7ce", borderRadius: 2, background: "#fbfaf6", fontSize: 12 }}
                  formatter={(value) => [String(value ?? 0), "Count"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Total</span>
              <span className="mt-0.5 font-mono text-lg tabular-nums text-primary">{totalUsers}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-secondary">users</span>
            </div>
          </div>
          <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5" aria-label="Accounts by role legend">
            {roles.map((role, index) => (
              <li key={role.label} className="flex min-w-0 items-center justify-between gap-2 text-[11px]">
                <span className="flex min-w-0 items-center gap-1.5 text-secondary">
                  <span className="h-2 w-2 shrink-0" style={{ backgroundColor: softPalette[index % softPalette.length] }} aria-hidden="true" />
                  <span className="truncate">{role.label}</span>
                </span>
                <span className="font-mono tabular-nums text-primary">{role.value}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function ComparisonBars({
  data,
  name,
}: {
  data: ExecutiveChartDatum[];
  name: string;
}) {
  return <CompactBarChart data={data} height={Math.max(96, data.length * 54)} name={name} />;
}
