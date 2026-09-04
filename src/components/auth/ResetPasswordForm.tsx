"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/auth/validation";
import { resetPasswordAction } from "@/lib/auth/actions";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { z } from "zod";

type Values = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (values: Values) => {
    setServerError(null);
    const result = await resetPasswordAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1800);
  };

  if (done) {
    return (
      <div className="rounded-lg border border-border-strong bg-elevated px-6 py-8">
        <h2 className="font-display text-xl text-primary">Password updated</h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <input type="hidden" {...register("token")} />
      <FormField label="New password" htmlFor="password" error={errors.password?.message}>
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
        {isSubmitting ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
