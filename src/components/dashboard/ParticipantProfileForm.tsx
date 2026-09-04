"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateParticipantProfileAction } from "@/lib/participants/actions";
import { updateParticipantProfileSchema } from "@/lib/participants/validation";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import type { z } from "zod";

type Values = z.infer<typeof updateParticipantProfileSchema>;

export function ParticipantProfileForm({
  userId,
  defaultValues,
}: {
  userId: string;
  defaultValues: Values;
}) {
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(updateParticipantProfileSchema),
    defaultValues,
  });

  const submit = async (values: Values) => {
    setServerError(null);
    const result = await updateParticipantProfileAction(userId, values);
    if (!result.ok) return setServerError(result.error);
    toast("success", "Profile updated");
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="mt-6 flex max-w-2xl flex-col gap-5 rounded-lg border border-border bg-elevated p-6"
    >
      <FormField
        label="Name"
        htmlFor="fullName"
        error={errors.fullName?.message}
      >
        <input
          id="fullName"
          className={fieldClasses}
          {...register("fullName")}
        />
      </FormField>
      <FormField
        label="School or institution"
        htmlFor="institution"
        error={errors.institution?.message}
      >
        <input
          id="institution"
          className={fieldClasses}
          {...register("institution")}
        />
      </FormField>
      <FormField
        label="Class or grade"
        htmlFor="gradeLevel"
        error={errors.gradeLevel?.message}
      >
        <input
          id="gradeLevel"
          className={fieldClasses}
          {...register("gradeLevel")}
        />
      </FormField>
      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="w-fit text-xs"
      >
        {isSubmitting ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
