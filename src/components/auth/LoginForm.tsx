"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/auth/validation";
import { loginAction } from "@/lib/auth/actions";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { z } from "zod";

type Values = z.infer<typeof loginSchema>;

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: Values) => {
    setServerError(null);
    const result = await loginAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push(returnTo?.startsWith("/") ? returnTo : "/");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <input
          id="email"
          type="email"
          className={fieldClasses}
          autoComplete="email"
          {...register("email")}
        />
      </FormField>
      <FormField
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
      >
        <input
          id="password"
          type="password"
          className={fieldClasses}
          autoComplete="current-password"
          {...register("password")}
        />
      </FormField>
      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="mt-2"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
