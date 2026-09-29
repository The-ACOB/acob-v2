"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  Superscript,
  Subscript,
  Divide,
  Radical,
  Sigma,
  Infinity as InfIcon,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Activity,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import katex from "katex";
import "katex/dist/katex.min.css";
import { questionSchema } from "@/lib/olympiads/validation";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import type { z } from "zod";
import type { ActionResult } from "@/lib/auth/actions";

type Values = z.infer<typeof questionSchema>;

interface ChartDataPoint {
  label: string;
  value: number;
  xValue?: number;
}

const CHART_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
];

export function QuestionEditor({
  defaultValues,
  onSubmit,
  onDone,
}: {
  defaultValues?: Partial<Values>;
  onSubmit: (values: Values) => Promise<ActionResult>;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  // Advanced Chart builder state
  const [showChartBuilder, setShowChartBuilder] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "pie" | "line" | "area">(
    "bar",
  );
  const [chartTitle, setChartTitle] = useState("Graph Analysis");
  const [xAxisLabel, setXAxisLabel] = useState("Time (s)");
  const [yAxisLabel, setYAxisLabel] = useState("Velocity (m/s)");
  const [showGrid, setShowGrid] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([
    { label: "Point A", value: 10, xValue: 2 },
    { label: "Point B", value: 25, xValue: 4 },
    { label: "Point C", value: 40, xValue: 6 },
  ]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: defaultValues?.text ?? "",
      imageUrl: defaultValues?.imageUrl ?? "",
      subject: defaultValues?.subject ?? "",
      difficulty: defaultValues?.difficulty ?? "medium",
      marks: defaultValues?.marks ?? 1,
      explanation: defaultValues?.explanation ?? "",
      options: defaultValues?.options ?? [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });
  const options = useWatch({ control, name: "options" });
  const currentQuestionText = useWatch({ control, name: "text" });

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const { ref: registerTextRef, ...textRest } = register("text");

  // Render mixed text and KaTeX math blocks safely
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.innerHTML = "";
      const textToRender = currentQuestionText || "Preview will appear here...";
      const parts = textToRender.split(/(\$.*?\$)/g);

      parts.forEach((part) => {
        if (!part) return;
        if (part.startsWith("$") && part.endsWith("$")) {
          const mathFormula = part.slice(1, -1);
          const mathSpan = document.createElement("span");
          try {
            katex.render(mathFormula, mathSpan, {
              throwOnError: false,
              displayMode: false,
            });
          } catch {
            mathSpan.textContent = part;
          }
          previewRef.current?.appendChild(mathSpan);
        } else {
          const textSpan = document.createElement("span");
          textSpan.textContent = part;
          previewRef.current?.appendChild(textSpan);
        }
      });
    }
  }, [currentQuestionText]);

  const insertAtCursor = (snippet: string) => {
    const el = textAreaRef.current;
    const currentText = getValues("text") ?? "";
    const wrappedSnippet = `$${snippet}$`;

    if (!el) {
      setValue("text", currentText + wrappedSnippet, { shouldValidate: true });
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal =
      currentText.substring(0, start) +
      wrappedSnippet +
      currentText.substring(end);
    setValue("text", newVal, { shouldValidate: true });

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + wrappedSnippet.length,
        start + wrappedSnippet.length,
      );
    }, 0);
  };

  // Capture Recharts SVG container and convert to Data URL for backend compatibility
  const attachGeneratedChart = () => {
    if (!chartContainerRef.current) return;
    const svgElement = chartContainerRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const encodedSvg = encodeURIComponent(svgString);
    const dataUrl = `data:image/svg+xml;utf8,${encodedSvg}`;

    setValue("imageUrl", dataUrl, { shouldValidate: true });
    setShowChartBuilder(false);
    toast("success", "Professional chart attached successfully!");
  };

  const submit = async (values: Values) => {
    setServerError(null);
    const result = await onSubmit(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    toast("success", "Question saved");
    onDone();
  };

  // Render chart based on active selection using Recharts
  const renderChartPreview = () => {
    const formattedData = chartData.map((d, i) => ({
      name: d.label,
      value: d.value,
      x: d.xValue ?? i + 1,
    }));

    return (
      <div className="flex flex-col gap-2 w-full h-52 bg-[#09090b] rounded-xl border border-border/60 p-3 shadow-inner">
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-xs font-semibold text-primary">
            {chartTitle}
          </span>
          <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
            {chartType} view
          </span>
        </div>

        <div className="w-full h-full" ref={chartContainerRef}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "pie" ? (
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#f4f4f5",
                  }}
                />
                <Pie
                  data={formattedData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  innerRadius={25}
                  label
                >
                  {formattedData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            ) : chartType === "line" ? (
              <LineChart
                data={formattedData}
                margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
              >
                {showGrid && (
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                )}
                <XAxis
                  dataKey="name"
                  stroke="#a1a1aa"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#f4f4f5",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: "#6366f1", r: 4 }}
                />
              </LineChart>
            ) : chartType === "area" ? (
              <AreaChart
                data={formattedData}
                margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
              >
                {showGrid && (
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                )}
                <XAxis
                  dataKey="name"
                  stroke="#a1a1aa"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#f4f4f5",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={formattedData}
                margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
              >
                {showGrid && (
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                )}
                <XAxis
                  dataKey="name"
                  stroke="#a1a1aa"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#f4f4f5",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {formattedData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-6"
    >
      {/* Question Text Area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Question text & mathematical notation
          </label>

          <div className="flex flex-wrap items-center gap-1 bg-black/40 p-1 rounded-md border border-border/80">
            <button
              type="button"
              title="Superscript"
              onClick={() => insertAtCursor("x^{y}")}
              className="p-1 text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
            >
              <Superscript className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Subscript"
              onClick={() => insertAtCursor("x_{i}")}
              className="p-1 text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
            >
              <Subscript className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Fraction"
              onClick={() => insertAtCursor("\\frac{a}{b}")}
              className="p-1 text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
            >
              <Divide className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Square Root"
              onClick={() => insertAtCursor("\\sqrt{x}")}
              className="p-1 text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
            >
              <Radical className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Summation"
              onClick={() => insertAtCursor("\\sum_{i=1}^{n}")}
              className="p-1 text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
            >
              <Sigma className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Infinity"
              onClick={() => insertAtCursor("\\infty")}
              className="p-1 text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
            >
              <InfIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <textarea
          id="text"
          rows={3}
          className={`${fieldClasses} resize-none`}
          placeholder="e.g. What is $x^{y}$?"
          {...textRest}
          ref={(e) => {
            registerTextRef(e);
            textAreaRef.current = e;
          }}
        />

        <div className="flex flex-col gap-1 rounded-lg bg-black/30 border border-border/60 p-3">
          <span className="font-mono text-[10px] uppercase text-muted tracking-wider">
            Live Math Render Preview:
          </span>
          <div
            ref={previewRef}
            className="text-sm text-primary min-h-[24px] flex items-center flex-wrap gap-1"
          />
        </div>

        {errors.text?.message ? (
          <p className="text-xs text-error">{errors.text.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Marks" htmlFor="marks" error={errors.marks?.message}>
          <input
            id="marks"
            type="number"
            step="0.25"
            className={fieldClasses}
            {...register("marks", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Difficulty" htmlFor="difficulty">
          <select
            id="difficulty"
            className={fieldClasses}
            {...register("difficulty")}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </FormField>
        <FormField
          label="Subject"
          htmlFor="subject"
          error={errors.subject?.message}
        >
          <input
            id="subject"
            className={fieldClasses}
            {...register("subject")}
          />
        </FormField>
      </div>

      {/* Recharts Powered Graph & Chart Builder Integration */}
      <div className="flex flex-col gap-3 rounded-xl bg-black/20 border border-border/60 p-4">
        <div className="flex items-center justify-between">
          <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Question Visual / Graph Generator
          </label>
          <button
            type="button"
            onClick={() => setShowChartBuilder(!showChartBuilder)}
            className="flex items-center gap-1.5 text-xs text-accent hover:underline font-mono"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {showChartBuilder
              ? "Hide Graph Studio"
              : "Open Professional Recharts Studio"}
          </button>
        </div>

        <FormField
          label="Image or Graph URL"
          htmlFor="imageUrl"
          error={errors.imageUrl?.message}
        >
          <input
            id="imageUrl"
            className={fieldClasses}
            placeholder="https://… or generate via studio below"
            {...register("imageUrl")}
          />
        </FormField>

        {showChartBuilder && (
          <div className="flex flex-col gap-5 mt-3 p-5 rounded-xl bg-[#0d0d0f]/95 border border-border shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
              <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" /> Professional Chart
                & Graph Studio
              </span>
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-border/80 self-start sm:self-auto shadow-sm">
                <button
                  type="button"
                  title="Bar Chart"
                  onClick={() => setChartType("bar")}
                  className={`p-1.5 rounded-md transition-all ${chartType === "bar" ? "bg-accent text-white shadow" : "text-muted hover:text-primary"}`}
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Line Graph"
                  onClick={() => setChartType("line")}
                  className={`p-1.5 rounded-md transition-all ${chartType === "line" ? "bg-accent text-white shadow" : "text-muted hover:text-primary"}`}
                >
                  <LineIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Area Graph"
                  onClick={() => setChartType("area")}
                  className={`p-1.5 rounded-md transition-all ${chartType === "area" ? "bg-accent text-white shadow" : "text-muted hover:text-primary"}`}
                >
                  <Activity className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Pie Chart"
                  onClick={() => setChartType("pie")}
                  className={`p-1.5 rounded-md transition-all ${chartType === "pie" ? "bg-accent text-white shadow" : "text-muted hover:text-primary"}`}
                >
                  <PieIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <FormField label="Chart Title" htmlFor="chartTitleInput">
                <input
                  id="chartTitleInput"
                  type="text"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  className={fieldClasses}
                />
              </FormField>
              {chartType !== "pie" && (
                <>
                  <FormField label="X-Axis Label" htmlFor="xAxisLabelInput">
                    <input
                      id="xAxisLabelInput"
                      type="text"
                      value={xAxisLabel}
                      onChange={(e) => setXAxisLabel(e.target.value)}
                      className={fieldClasses}
                    />
                  </FormField>
                  <FormField label="Y-Axis Label" htmlFor="yAxisLabelInput">
                    <input
                      id="yAxisLabelInput"
                      type="text"
                      value={yAxisLabel}
                      onChange={(e) => setYAxisLabel(e.target.value)}
                      className={fieldClasses}
                    />
                  </FormField>
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="showGrid"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="accent-[var(--color-accent)] h-4 w-4 rounded cursor-pointer"
              />
              <label
                htmlFor="showGrid"
                className="text-xs text-secondary font-mono cursor-pointer select-none"
              >
                Show Background Grid Lines
              </label>
            </div>

            {/* Data Points Controller */}
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase text-muted tracking-wider">
                Configure Data Series
              </span>

              <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                {chartData.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-black/40 border border-border/60"
                  >
                    <span className="font-mono text-[10px] text-accent font-medium w-16">
                      Item {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Label"
                      value={item.label}
                      onChange={(e) => {
                        const updated = [...chartData];
                        updated[idx].label = e.target.value;
                        setChartData(updated);
                      }}
                      className={`${fieldClasses} text-xs flex-1`}
                    />
                    <input
                      type="number"
                      placeholder="Value"
                      value={item.value}
                      onChange={(e) => {
                        const updated = [...chartData];
                        updated[idx].value = parseFloat(e.target.value) || 0;
                        setChartData(updated);
                      }}
                      className={`${fieldClasses} text-xs w-24`}
                    />
                    {chartData.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setChartData(chartData.filter((_, i) => i !== idx))
                        }
                        className="text-muted hover:text-error transition-colors p-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setChartData([
                    ...chartData,
                    { label: `Item ${chartData.length + 1}`, value: 20 },
                  ])
                }
                className="flex items-center gap-1.5 text-xs text-accent mt-1 hover:underline w-fit font-mono font-medium"
              >
                <Plus className="h-3.5 w-3.5" /> Add Data Point
              </button>
            </div>

            {/* Recharts Live Preview Box */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="font-mono text-[10px] uppercase text-muted tracking-wider">
                Live Recharts Output Preview:
              </span>
              {renderChartPreview()}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="primary"
                onClick={attachGeneratedChart}
                className="text-xs"
              >
                <Check className="h-3.5 w-3.5 mr-1.5" /> Use Chart as Question
                Image Asset
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Options Selection */}
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          Options — select the correct one
        </span>
        {fields.map((field, i) => (
          <div key={field.id} className="flex items-center gap-3">
            <input
              type="radio"
              name="correctOption"
              checked={options[i]?.isCorrect ?? false}
              onChange={() => {
                fields.forEach((_, j) =>
                  setValue(`options.${j}.isCorrect`, j === i),
                );
              }}
              className="h-4 w-4 accent-[var(--color-accent)] cursor-pointer"
            />
            <input
              className={`${fieldClasses} flex-1`}
              placeholder={`Option ${i + 1}`}
              {...register(`options.${i}.text`)}
            />
            {fields.length > 2 ? (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-muted hover:text-error transition-colors p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
        {errors.options?.message ? (
          <p className="text-xs text-error">{errors.options.message}</p>
        ) : null}
        {fields.length < 8 ? (
          <button
            type="button"
            onClick={() => append({ text: "", isCorrect: false })}
            className="flex w-fit items-center gap-1.5 text-xs text-accent font-mono"
          >
            <Plus className="h-3.5 w-3.5" /> Add option
          </button>
        ) : null}
      </div>

      <FormField
        label="Explanation (optional)"
        htmlFor="explanation"
        error={errors.explanation?.message}
      >
        <textarea
          id="explanation"
          rows={2}
          className={`${fieldClasses} resize-none`}
          {...register("explanation")}
        />
      </FormField>

      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="text-xs"
        >
          {isSubmitting ? "Saving…" : "Save question"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          className="text-xs"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
