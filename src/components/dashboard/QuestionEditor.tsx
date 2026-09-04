"use client";

import { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const options = useWatch({ control, name: "options" });

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
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <FormField label="Question text" htmlFor="text" error={errors.text?.message}>
        <textarea id="text" rows={2} className={`${fieldClasses} resize-none`} {...register("text")} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Marks" htmlFor="marks" error={errors.marks?.message}>
          <input id="marks" type="number" step="0.25" className={fieldClasses} {...register("marks", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Difficulty" htmlFor="difficulty">
          <select id="difficulty" className={fieldClasses} {...register("difficulty")}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </FormField>
        <FormField label="Subject" htmlFor="subject" error={errors.subject?.message}>
          <input id="subject" className={fieldClasses} {...register("subject")} />
        </FormField>
      </div>

      <FormField label="Image URL (optional)" htmlFor="imageUrl" error={errors.imageUrl?.message}>
        <input id="imageUrl" className={fieldClasses} placeholder="https://…" {...register("imageUrl")} />
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
                fields.forEach((_, j) => setValue(`options.${j}.isCorrect`, j === i));
              }}
              className="h-4 w-4 accent-[var(--color-accent)]"
              aria-label={`Mark option ${i + 1} correct`}
            />
            <input className={`${fieldClasses} flex-1`} placeholder={`Option ${i + 1}`} {...register(`options.${i}.text`)} />
            {fields.length > 2 ? (
              <button type="button" onClick={() => remove(i)} aria-label="Remove option" className="text-muted hover:text-error">
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
        {errors.options?.message ? <p className="text-xs text-error">{errors.options.message}</p> : null}
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

      <FormField label="Explanation (optional)" htmlFor="explanation" error={errors.explanation?.message}>
        <textarea id="explanation" rows={2} className={`${fieldClasses} resize-none`} {...register("explanation")} />
      </FormField>

      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={isSubmitting} className="text-xs">
          {isSubmitting ? "Saving…" : "Save question"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} className="text-xs">
          Cancel
        </Button>
      </div>
    </form>
  );
}
