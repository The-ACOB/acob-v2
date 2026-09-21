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
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { questionSchema } from "@/lib/olympiads/validation";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import type { z } from "zod";
import type { ActionResult } from "@/lib/auth/actions";

type Values = z.infer<typeof questionSchema>;

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

  // Helper to insert math snippets wrapped in $...$ with general variables
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

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-5"
    >
      {/* Question Text Area with Math Toolbar & Live Preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Question text & mathematical notation
          </label>

          {/* Math & Equation Toolbar */}
          <div className="flex flex-wrap items-center gap-1 bg-black/30 p-1 rounded-md border border-border">
            <button
              type="button"
              title="Superscript (e.g. x^{y})"
              onClick={() => insertAtCursor("x^{y}")}
              className="p-1 text-xs text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
            >
              <Superscript className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Subscript (e.g. x_{i})"
              onClick={() => insertAtCursor("x_{i}")}
              className="p-1 text-xs text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
            >
              <Subscript className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Fraction"
              onClick={() => insertAtCursor("\\frac{a}{b}")}
              className="p-1 text-xs text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
            >
              <Divide className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Square Root"
              onClick={() => insertAtCursor("\\sqrt{x}")}
              className="p-1 text-xs text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
            >
              <Radical className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Summation"
              onClick={() => insertAtCursor("\\sum_{i=1}^{n}")}
              className="p-1 text-xs text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
            >
              <Sigma className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Infinity"
              onClick={() => insertAtCursor("\\infty")}
              className="p-1 text-xs text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
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

        {/* Live Mathematical Render Preview Box */}
        <div className="flex flex-col gap-1 rounded-md bg-black/40 border border-border/60 p-2.5">
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
        <p className="text-[11px] text-muted">
          Tip: Keep plain text outside of dollar signs (e.g.,{" "}
          <code>{"What is $x^{y}$?"}</code>) for proper spacing and LaTeX math
          rendering.
        </p>
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

      <FormField
        label="Image or Graph URL (optional)"
        htmlFor="imageUrl"
        error={errors.imageUrl?.message}
      >
        <input
          id="imageUrl"
          className={fieldClasses}
          placeholder="https://…"
          {...register("imageUrl")}
        />
      </FormField>

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
              className="h-4 w-4 accent-[var(--color-accent)]"
              aria-label={`Mark option ${i + 1} correct`}
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
                aria-label="Remove option"
                className="text-muted hover:text-error"
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
            className="flex w-fit items-center gap-1.5 text-xs text-accent"
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

      <div className="flex gap-3">
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
