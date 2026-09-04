"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSubmitSchema, CONTACT_CATEGORIES } from "@/lib/contact/validation";
import { submitContactAction } from "@/lib/contact/actions";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { z } from "zod";

type ContactValues = z.infer<typeof contactSubmitSchema>;

const CATEGORY_LABELS: Record<(typeof CONTACT_CATEGORIES)[number], string> = {
  general: "General inquiry",
  olympiads: "Olympiads",
  ambassadors: "Ambassador program",
  media: "Media / press",
  careers: "Careers",
};

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSubmitSchema),
    defaultValues: { category: "general" },
  });

  const onSubmit = async (values: ContactValues) => {
    setServerError(null);
    const result = await submitContactAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setSubmitted(true);
    reset();
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-accent/30 bg-accent/5 px-6 py-8">
        <h3 className="font-display text-xl text-primary">Message sent</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary">
          Thanks for reaching out — a member of the ACOB team will get back to
          you by email as soon as possible.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-5 text-sm text-accent underline underline-offset-4"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="name" error={errors.name?.message}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className={fieldClasses}
            placeholder="Your name"
            {...register("name")}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={fieldClasses}
            placeholder="you@example.com"
            {...register("email")}
          />
        </FormField>
      </div>

      <FormField label="Subject" htmlFor="subject" error={errors.subject?.message}>
        <input
          id="subject"
          type="text"
          className={fieldClasses}
          placeholder="What's this about, in a few words"
          {...register("subject")}
        />
      </FormField>

      <FormField label="What's this about" htmlFor="category" error={errors.category?.message}>
        <select id="category" className={cn(fieldClasses, "appearance-none")} {...register("category")}>
          {CONTACT_CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-elevated">
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Message" htmlFor="message" error={errors.message?.message}>
        <textarea
          id="message"
          rows={6}
          className={cn(fieldClasses, "resize-none")}
          placeholder="Tell us what you need..."
          {...register("message")}
        />
      </FormField>

      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}

      <Button type="submit" variant="primary" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
