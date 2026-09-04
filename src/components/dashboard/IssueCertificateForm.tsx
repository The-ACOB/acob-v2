"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { issueCertificateSchema, CERTIFICATE_ACHIEVEMENTS } from "@/lib/certificates/validation";
import { issueCertificateAction } from "@/lib/certificates/actions";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import type { z } from "zod";

type Values = z.infer<typeof issueCertificateSchema>;

const ACHIEVEMENT_LABELS: Record<(typeof CERTIFICATE_ACHIEVEMENTS)[number], string> = {
  prime: "Prime (1st)",
  elite: "Elite (2nd)",
  merit: "Merit (3rd)",
  honourable_mention: "Honourable Mention (4th–10th)",
  participation: "Participation",
};

export function IssueCertificateForm({ olympiads }: { olympiads: { id: string; title: string }[] }) {
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
    const result = await issueCertificateAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    toast("success", "Certificate issued", result.data?.certificateId);
    reset();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5 rounded-lg border border-border bg-elevated p-5">
      <FormField label="Recipient email" htmlFor="recipientEmail" error={errors.recipientEmail?.message}>
        <input id="recipientEmail" type="email" className={fieldClasses} {...register("recipientEmail")} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Olympiad" htmlFor="olympiadId" error={errors.olympiadId?.message}>
          <select id="olympiadId" className={fieldClasses} {...register("olympiadId")}>
            <option value="">Select…</option>
            {olympiads.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Achievement" htmlFor="achievement" error={errors.achievement?.message}>
          <select id="achievement" className={fieldClasses} {...register("achievement")}>
            <option value="">Select…</option>
            {CERTIFICATE_ACHIEVEMENTS.map((a) => (
              <option key={a} value={a}>
                {ACHIEVEMENT_LABELS[a]}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Certificate file URL (optional)" htmlFor="fileUrl" error={errors.fileUrl?.message}>
        <input id="fileUrl" className={fieldClasses} placeholder="https://…" {...register("fileUrl")} />
      </FormField>

      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}

      <Button type="submit" variant="primary" disabled={isSubmitting} className="w-fit text-xs">
        {isSubmitting ? "Issuing…" : "Issue certificate"}
      </Button>
    </form>
  );
}
