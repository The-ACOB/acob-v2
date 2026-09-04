"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { contentSchema } from "@/lib/content/validation";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import type { z } from "zod";
import type { ActionResult } from "@/lib/auth/actions";

type Values = z.infer<typeof contentSchema>;

export function ContentForm({
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
  } = useForm<Values>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      body: defaultValues?.body ?? "",
      externalUrl: defaultValues?.externalUrl ?? "",
    },
  });

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
      <FormField label="Title" htmlFor="title" error={errors.title?.message}>
        <input id="title" className={fieldClasses} {...register("title")} />
      </FormField>
      <FormField label="Description" htmlFor="description" error={errors.description?.message}>
        <textarea id="description" rows={2} className={`${fieldClasses} resize-none`} {...register("description")} />
      </FormField>
      <FormField label="Body / notes (optional)" htmlFor="body" error={errors.body?.message}>
        <textarea id="body" rows={4} className={`${fieldClasses} resize-none`} {...register("body")} />
      </FormField>
      <FormField label="External link (optional)" htmlFor="externalUrl" error={errors.externalUrl?.message}>
        <input id="externalUrl" className={fieldClasses} placeholder="https://…" {...register("externalUrl")} />
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
