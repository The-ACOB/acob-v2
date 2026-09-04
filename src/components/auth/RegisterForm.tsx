"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/auth/validation";
import { registerAction } from "@/lib/auth/actions";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { z } from "zod";

type Values = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: Values) => {
    setServerError(null);
    const result = await registerAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-border-strong bg-elevated px-6 py-8">
        <h2 className="font-display text-xl text-primary">Check your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          If that address isn&apos;t already registered, we&apos;ve sent a
          verification link to confirm your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
        <input id="fullName" className={fieldClasses} autoComplete="name" {...register("fullName")} />
      </FormField>
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" className={fieldClasses} autoComplete="email" {...register("email")} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password?.message}>
        <input
          id="password"
          type="password"
          className={fieldClasses}
          autoComplete="new-password"
          {...register("password")}
        />
      </FormField>
      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}
      <Button type="submit" variant="primary" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
