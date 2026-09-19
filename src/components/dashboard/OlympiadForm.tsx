"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Upload, Loader2, X } from "lucide-react";
import { olympiadSchema } from "@/lib/olympiads/validation";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import type { z } from "zod";
import type { ActionResult } from "@/lib/auth/actions";

type Values = z.infer<typeof olympiadSchema>;

function toLocalInputValue(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function OlympiadForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  redirectPath,
}: {
  defaultValues?: Omit<
    Partial<Values>,
    "registrationStartAt" | "registrationEndAt" | "startAt" | "endAt"
  > & {
    posterUrl?: string | null;
    registrationStartAt?: Date | null;
    registrationEndAt?: Date | null;
    startAt?: Date | null;
    endAt?: Date | null;
  };
  onSubmit: (
    values: Values,
  ) => Promise<ActionResult<{ id: string }> | ActionResult>;
  submitLabel?: string;
  redirectPath?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string>(
    defaultValues?.posterUrl ?? "",
  );
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(olympiadSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      posterUrl: defaultValues?.posterUrl ?? "",
      subject: defaultValues?.subject ?? "",
      durationMinutes: defaultValues?.durationMinutes ?? 60,
      registrationStartAt: toLocalInputValue(
        defaultValues?.registrationStartAt ?? null,
      ),
      registrationEndAt: toLocalInputValue(
        defaultValues?.registrationEndAt ?? null,
      ),
      startAt: toLocalInputValue(defaultValues?.startAt ?? null),
      endAt: toLocalInputValue(defaultValues?.endAt ?? null),
      negativeMarkingEnabled: defaultValues?.negativeMarkingEnabled ?? false,
      negativeMarkingValue: defaultValues?.negativeMarkingValue ?? 0,
      eligibilityMode: defaultValues?.eligibilityMode ?? "open",
      eligibilityGradeLevel: defaultValues?.eligibilityGradeLevel ?? "",
      eligibilityInstitution: defaultValues?.eligibilityInstitution ?? "",
      eligibilityAcademicLevel: defaultValues?.eligibilityAcademicLevel ?? "",
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setPosterUrl(data.url);
        setValue("posterUrl", data.url, { shouldValidate: true });
        toast("success", "Poster uploaded successfully");
      } else {
        toast("error", "Upload failed", data.error ?? "Failed to upload image");
      }
    } catch {
      toast("error", "Upload error", "Something went wrong during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const submit = async (values: Values) => {
    setServerError(null);
    const result = await onSubmit({ ...values, posterUrl });

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    toast("success", "Saved");
    const id = "data" in result ? result.data?.id : undefined;

    if (redirectPath) router.push(redirectPath.replace(":id", id ?? ""));
    else router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <FormField label="Title" htmlFor="title" error={errors.title?.message}>
        <input id="title" className={fieldClasses} {...register("title")} />
      </FormField>

      <FormField
        label="Description"
        htmlFor="description"
        error={errors.description?.message}
      >
        <textarea
          id="description"
          rows={3}
          className={`${fieldClasses} resize-none`}
          {...register("description")}
        />
      </FormField>

      {/* --- OLYMPIAD POSTER UPLOAD SECTION --- */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase tracking-wider text-secondary">
          Olympiad Poster Banner
        </label>
        {posterUrl ? (
          <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-lg border border-border bg-elevated-2">
            <Image
              src={posterUrl}
              alt="Poster preview"
              fill
              unoptimized
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setPosterUrl("");
                setValue("posterUrl", "", { shouldValidate: true });
              }}
              className="absolute top-2 right-2 rounded-md bg-background/80 p-1.5 text-primary hover:bg-background transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-elevated-2 p-6 text-xs text-secondary transition-colors hover:border-accent/50 hover:bg-elevated">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
            ) : (
              <Upload className="h-4 w-4 text-accent" />
            )}
            <span>
              {isUploading
                ? "Uploading..."
                : "Upload poster image (16:9 recommended)"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="sr-only"
            />
          </label>
        )}
        <input type="hidden" {...register("posterUrl")} value={posterUrl} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          label="Subject"
          htmlFor="subject"
          error={errors.subject?.message}
        >
          <input
            id="subject"
            className={fieldClasses}
            placeholder="e.g. Mathematics"
            {...register("subject")}
          />
        </FormField>

        <FormField
          label="Duration (minutes)"
          htmlFor="durationMinutes"
          error={errors.durationMinutes?.message}
        >
          <input
            id="durationMinutes"
            type="number"
            className={fieldClasses}
            {...register("durationMinutes", { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5">
        <FormField
          label="Eligibility"
          htmlFor="eligibilityMode"
          error={errors.eligibilityMode?.message}
        >
          <select
            id="eligibilityMode"
            className={fieldClasses}
            {...register("eligibilityMode")}
          >
            <option value="open">Open to all participants</option>
            <option value="criteria">Match the criteria below</option>
          </select>
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input
            aria-label="Eligible class or grade"
            placeholder="Class / grade"
            className={fieldClasses}
            {...register("eligibilityGradeLevel")}
          />
          <input
            aria-label="Eligible institution"
            placeholder="Institution"
            className={fieldClasses}
            {...register("eligibilityInstitution")}
          />
          <input
            aria-label="Eligible academic level"
            placeholder="Academic level"
            className={fieldClasses}
            {...register("eligibilityAcademicLevel")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 border-t border-border pt-5 sm:grid-cols-2">
        <FormField
          label="Registration opens"
          htmlFor="registrationStartAt"
          error={errors.registrationStartAt?.message}
        >
          <input
            id="registrationStartAt"
            type="datetime-local"
            className={fieldClasses}
            {...register("registrationStartAt")}
          />
        </FormField>

        <FormField
          label="Registration closes"
          htmlFor="registrationEndAt"
          error={errors.registrationEndAt?.message}
        >
          <input
            id="registrationEndAt"
            type="datetime-local"
            className={fieldClasses}
            {...register("registrationEndAt")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-6 border-t border-border pt-5 sm:grid-cols-2">
        <FormField
          label="Exam starts"
          htmlFor="startAt"
          error={errors.startAt?.message}
        >
          <input
            id="startAt"
            type="datetime-local"
            className={fieldClasses}
            {...register("startAt")}
          />
        </FormField>

        <FormField
          label="Exam ends"
          htmlFor="endAt"
          error={errors.endAt?.message}
        >
          <input
            id="endAt"
            type="datetime-local"
            className={fieldClasses}
            {...register("endAt")}
          />
        </FormField>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <label className="flex items-center gap-2 text-sm text-secondary">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--color-accent)]"
            {...register("negativeMarkingEnabled")}
          />
          Enable negative marking
        </label>

        <FormField
          label="Penalty per wrong answer"
          htmlFor="negativeMarkingValue"
          error={errors.negativeMarkingValue?.message}
        >
          <input
            id="negativeMarkingValue"
            type="number"
            step="0.25"
            className={fieldClasses}
            {...register("negativeMarkingValue", { valueAsNumber: true })}
          />
        </FormField>
      </div>

      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="w-fit"
      >
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
