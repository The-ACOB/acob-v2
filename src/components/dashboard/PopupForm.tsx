"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { popupSchema } from "@/lib/popups/validation";
import { createPopupAction } from "@/lib/popups/actions";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import type { z } from "zod";

type Values = z.infer<typeof popupSchema>;

export function PopupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(popupSchema), defaultValues: { priority: 0 } });

  const submit = async (values: Values) => {
    setServerError(null);
    const result = await createPopupAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    toast("success", "Popup created");
    reset();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5 rounded-lg border border-border bg-elevated p-5">
      <FormField label="Message" htmlFor="content" error={errors.content?.message}>
        <textarea id="content" rows={2} className={`${fieldClasses} resize-none`} {...register("content")} />
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="CTA label (optional)" htmlFor="ctaLabel" error={errors.ctaLabel?.message}>
          <input id="ctaLabel" className={fieldClasses} placeholder="Learn more" {...register("ctaLabel")} />
        </FormField>
        <FormField label="CTA link (optional)" htmlFor="ctaUrl" error={errors.ctaUrl?.message}>
          <input id="ctaUrl" className={fieldClasses} placeholder="https://…" {...register("ctaUrl")} />
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Starts (optional)" htmlFor="startAt" error={errors.startAt?.message}>
          <input id="startAt" type="datetime-local" className={fieldClasses} {...register("startAt")} />
        </FormField>
        <FormField label="Ends (optional)" htmlFor="endAt" error={errors.endAt?.message}>
          <input id="endAt" type="datetime-local" className={fieldClasses} {...register("endAt")} />
        </FormField>
        <FormField label="Priority" htmlFor="priority" error={errors.priority?.message}>
          <input id="priority" type="number" className={fieldClasses} {...register("priority", { valueAsNumber: true })} />
        </FormField>
      </div>

      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}

      <Button type="submit" variant="primary" disabled={isSubmitting} className="w-fit text-xs">
        {isSubmitting ? "Creating…" : "Create popup"}
      </Button>
    </form>
  );
}
