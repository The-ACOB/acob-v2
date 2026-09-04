"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { z } from "zod";

type Values = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: Values) => {
    await forgotPasswordAction(values);
    // Always shows the same confirmation, regardless of whether the
    // email exists — the server never reveals that.
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-border-strong bg-elevated px-6 py-8">
        <h2 className="font-display text-xl text-primary">Check your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          If an account exists for that address, a password reset link is on
          its way.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" className={fieldClasses} autoComplete="email" {...register("email")} />
      </FormField>
      <Button type="submit" variant="primary" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
