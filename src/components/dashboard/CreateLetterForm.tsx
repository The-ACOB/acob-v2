"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createLetterSchema } from "@/lib/letters/validation";
import { createLetterAction } from "@/lib/letters/actions";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import type { z } from "zod";

type Values = z.infer<typeof createLetterSchema>;

type ParticipantOption = { id: string; name: string; email: string };

export function CreateLetterForm({
  participants,
}: {
  participants: ParticipantOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(createLetterSchema),
    defaultValues: { title: "Letter of Recommendation" },
  });

  const submit = async (values: Values) => {
    setServerError(null);
    const result = await createLetterAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    toast("success", "Letter drafted");
    reset();
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-5 rounded-lg border border-border bg-elevated p-5"
    >
      <FormField
        label="Participant"
        htmlFor="recipientUserId"
        error={
          errors.recipientUserId?.message ?? errors.recipientEmail?.message
        }
      >
        <select
          id="recipientUserId"
          className={fieldClasses}
          defaultValue=""
          {...register("recipientUserId", {
            onChange: (event) => {
              const participant = participants.find(
                (option) => option.id === event.target.value,
              );
              setValue("recipientEmail", participant?.email ?? "", {
                shouldValidate: true,
              });
            },
          })}
        >
          <option value="">Select a participant</option>
          {participants.map((participant) => (
            <option key={participant.id} value={participant.id}>
              {participant.name} — {participant.email}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Title" htmlFor="title" error={errors.title?.message}>
        <input id="title" className={fieldClasses} {...register("title")} />
      </FormField>
      <FormField
        label="Letter body (optional)"
        htmlFor="body"
        error={errors.body?.message}
      >
        <textarea
          id="body"
          rows={5}
          className={`${fieldClasses} resize-none`}
          {...register("body")}
        />
      </FormField>
      <FormField
        label="File URL (optional)"
        htmlFor="fileUrl"
        error={errors.fileUrl?.message}
      >
        <input
          id="fileUrl"
          className={fieldClasses}
          placeholder="https://…"
          {...register("fileUrl")}
        />
      </FormField>

      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="w-fit text-xs"
      >
        {isSubmitting ? "Saving…" : "Save as draft"}
      </Button>
    </form>
  );
}
