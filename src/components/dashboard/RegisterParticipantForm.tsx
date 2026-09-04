"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerParticipantSchema } from "@/lib/participants/validation";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { z } from "zod";
import type { ActionResult } from "@/lib/auth/actions";

type Values = z.infer<typeof registerParticipantSchema>;

export function RegisterParticipantForm({ onSubmit }: { onSubmit: (values: Values) => Promise<ActionResult> }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(registerParticipantSchema) });

  const submit = async (values: Values) => {
    setServerError(null);
    const result = await onSubmit(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setDone(true);
    reset();
  };

  if (done) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 px-6 py-8">
        <p className="font-display text-lg text-primary">Participant registered</p>
        <p className="mt-2 text-sm text-secondary">An email has been sent to them to set their password.</p>
        <button type="button" onClick={() => setDone(false)} className="mt-4 text-xs text-accent underline underline-offset-4">
          Register another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5 rounded-lg border border-border bg-elevated p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
          <input id="fullName" className={fieldClasses} {...register("fullName")} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" className={fieldClasses} {...register("email")} />
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Institution (optional)" htmlFor="institution" error={errors.institution?.message}>
          <input id="institution" className={fieldClasses} {...register("institution")} />
        </FormField>
        <FormField label="Grade level (optional)" htmlFor="gradeLevel" error={errors.gradeLevel?.message}>
          <input id="gradeLevel" className={fieldClasses} {...register("gradeLevel")} />
        </FormField>
      </div>

      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}

      <Button type="submit" variant="primary" disabled={isSubmitting} className="w-fit text-xs">
        {isSubmitting ? "Registering…" : "Register participant"}
      </Button>
    </form>
  );
}
