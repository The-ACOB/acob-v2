"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  issueCertificateSchema,
  CERTIFICATE_ACHIEVEMENTS,
} from "@/lib/certificates/validation";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import type { z } from "zod";

// Omit fileUrl from the form values since we aren't using it anymore
type Values = z.infer<typeof issueCertificateSchema>;

const ACHIEVEMENT_LABELS: Record<
  (typeof CERTIFICATE_ACHIEVEMENTS)[number],
  string
> = {
  prime: "Prime (1st)",
  elite: "Elite (2nd)",
  merit: "Merit (3rd)",
  honourable_mention: "Honourable Mention (4th–10th)",
  participation: "Participation",
};

export function IssueCertificateForm({
  olympiads,
}: {
  olympiads: { id: string; title: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(issueCertificateSchema) });

  const submit = async (values: Values) => {
    setServerError(null);
    try {
      const achievementMap: Record<string, string> = {
        prime: "Prime",
        elite: "Elite",
        merit: "Merit",
        honourable_mention: "Honourable Mention",
        participation: "Participation",
      };

      const selectedAchievement =
        achievementMap[values.achievement] || values.achievement;

      const response = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          achievementType: selectedAchievement,
          recipientEmail: values.recipientEmail,
          olympiadId: values.olympiadId,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate certificate");
      }

      // Extract generated CUID from header
      const cuidHeader = response.headers.get("X-CUID") || "ACOB-2026-XXXXX";

      // Trigger automatic vector PDF download in browser
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ACOB-Certificate-${cuidHeader}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast(
        "success",
        "Certificate issued & downloaded",
        `CUID: ${cuidHeader}`,
      );
      reset();
      router.refresh();
    } catch (error: any) {
      setServerError(
        error.message || "An error occurred while issuing the certificate.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-5 rounded-xl border border-white/10 bg-[#121212] p-6 text-white max-w-4xl shadow-xl"
    >
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">
          Issue Certificate
        </h2>
        <p className="text-xs text-gray-400">
          Generate and assign verified credentials to participants.
        </p>
      </div>

      {/* Recipient Email */}
      <FormField
        label="Recipient email"
        htmlFor="recipientEmail"
        error={errors.recipientEmail?.message}
      >
        <input
          id="recipientEmail"
          type="email"
          placeholder="name@example.com"
          className={fieldClasses}
          {...register("recipientEmail")}
        />
      </FormField>

      {/* Olympiad & Achievement Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Olympiad"
          htmlFor="olympiadId"
          error={errors.olympiadId?.message}
        >
          <select
            id="olympiadId"
            className={fieldClasses}
            {...register("olympiadId")}
          >
            <option value="">Select olympiad...</option>
            {olympiads.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Achievement"
          htmlFor="achievement"
          error={errors.achievement?.message}
        >
          <select
            id="achievement"
            className={fieldClasses}
            {...register("achievement")}
          >
            <option value="">Select achievement...</option>
            {CERTIFICATE_ACHIEVEMENTS.map((a) => (
              <option key={a} value={a}>
                {ACHIEVEMENT_LABELS[a]}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {serverError ? (
        <p className="text-xs text-red-400">{serverError}</p>
      ) : null}

      <div className="pt-2 flex items-center justify-end">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="text-xs px-6 py-2.5 rounded-lg font-medium shadow-md transition-colors"
        >
          {isSubmitting ? "Generating PDF…" : "Issue certificate"}
        </Button>
      </div>
    </form>
  );
}
