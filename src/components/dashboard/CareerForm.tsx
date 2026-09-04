"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { careerSchema } from "@/lib/careers/validation";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import type { z } from "zod";
import type { ActionResult } from "@/lib/auth/actions";

type Values = z.infer<typeof careerSchema>;

export function CareerForm({
  defaultValues,
  onSubmit,
  onDone,
}: {
  defaultValues?: Partial<Values>;
  onSubmit: (values: Values) => Promise<ActionResult>;
  onDone: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(careerSchema), defaultValues });

  const submit = async (values: Values) => {
    setServerError(null);
    const result = await onSubmit(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    toast("success", "Saved");
    onDone();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5 rounded-lg border border-border bg-elevated p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Title" htmlFor="title" error={errors.title?.message}>
          <input id="title" className={fieldClasses} {...register("title")} />
        </FormField>
        <FormField label="Department" htmlFor="department" error={errors.department?.message}>
          <input id="department" className={fieldClasses} {...register("department")} />
        </FormField>
      </div>
      <FormField label="Description" htmlFor="description" error={errors.description?.message}>
        <textarea id="description" rows={3} className={`${fieldClasses} resize-none`} {...register("description")} />
      </FormField>
      <FormField label="Requirements (optional)" htmlFor="requirements" error={errors.requirements?.message}>
        <textarea id="requirements" rows={3} className={`${fieldClasses} resize-none`} {...register("requirements")} />
      </FormField>
      <FormField label="Application deadline (optional)" htmlFor="deadline" error={errors.deadline?.message}>
        <input id="deadline" type="date" className={fieldClasses} {...register("deadline")} />
      </FormField>

      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={isSubmitting} className="text-xs">
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} className="text-xs">
          Cancel
        </Button>
      </div>
    </form>
  );
}
