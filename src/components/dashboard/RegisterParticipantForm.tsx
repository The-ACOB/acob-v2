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

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}

export function RegisterParticipantForm({ onSubmit }: { onSubmit: (values: Values) => Promise<ActionResult> }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(registerParticipantSchema),
    defaultValues: { emailCredentials: false },
  });
  const password = watch("password") || "";

  const submit = async (values: Values) => {
    setServerError(null);
    const result = await onSubmit(values);
    if (!result.ok) { setServerError(result.error); return; }
    setDone(true); reset({ emailCredentials: false });
  };

  if (done) return <div className="rounded-lg border border-success/30 bg-success/5 px-6 py-8"><p className="font-display text-lg text-primary">Participant registered</p><p className="mt-2 text-sm text-secondary">The account is active immediately and its email is already verified.</p><button type="button" onClick={() => setDone(false)} className="mt-4 text-xs text-accent underline underline-offset-4">Register another</button></div>;

  return <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5 rounded-lg border border-border bg-elevated p-5">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}><input id="fullName" className={fieldClasses} {...register("fullName")} /></FormField>
      <FormField label="Email" htmlFor="email" error={errors.email?.message}><input id="email" type="email" className={fieldClasses} {...register("email")} /></FormField>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Institution (optional)" htmlFor="institution" error={errors.institution?.message}><input id="institution" className={fieldClasses} {...register("institution")} /></FormField>
      <FormField label="Grade level (optional)" htmlFor="gradeLevel" error={errors.gradeLevel?.message}><select id="gradeLevel" className={fieldClasses} {...register("gradeLevel")}><option value="">Select grade level…</option><option>Grade 6</option><option>Grade 7</option><option>Grade 8</option><option>Grade 9</option><option>Grade 10</option><option>Grade 11</option><option>Grade 12</option><option>University / College</option><option>Other</option></select></FormField>
    </div>
    <div className="rounded-lg border border-border bg-black/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-primary">Account password</p><p className="mt-1 text-xs text-muted">This password is set immediately. No verification/password-set link is required.</p></div><button type="button" onClick={() => { const value = generatePassword(); setValue("password", value, { shouldValidate: true }); setValue("confirmPassword", value, { shouldValidate: true }); }} className="rounded-md border border-border px-3 py-2 text-xs text-secondary hover:text-primary">Generate secure password</button></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Password" htmlFor="password" error={errors.password?.message}><input id="password" type="text" autoComplete="new-password" className={`${fieldClasses} font-mono`} {...register("password")} /></FormField>
        <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}><input id="confirmPassword" type="text" autoComplete="new-password" className={`${fieldClasses} font-mono`} {...register("confirmPassword")} /></FormField>
      </div>
      <p className="mt-2 text-[11px] text-muted">{password.length}/10 minimum characters</p>
      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-secondary"><input type="checkbox" className="h-4 w-4 accent-[var(--color-accent)]" {...register("emailCredentials")} /> Email these credentials to the participant</label>
    </div>
    {serverError ? <p className="text-xs text-error">{serverError}</p> : null}
    <Button type="submit" variant="primary" disabled={isSubmitting} className="w-fit text-xs">{isSubmitting ? "Creating account…" : "Create participant account"}</Button>
  </form>;
}
