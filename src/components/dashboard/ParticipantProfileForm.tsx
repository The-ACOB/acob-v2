"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateParticipantProfileAction } from "@/lib/participants/actions";
import { updateParticipantProfileSchema } from "@/lib/participants/validation";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import type { z } from "zod";

type Values = z.infer<typeof updateParticipantProfileSchema>;

export function ParticipantProfileForm({
  userId,
  showParticipantFields = true,
  allowEmailEdit = true,
  defaultValues,
}: {
  userId: string;
  showParticipantFields?: boolean;
  allowEmailEdit?: boolean;
  defaultValues: Values;
}) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(updateParticipantProfileSchema),
    defaultValues,
  });

  const submit = async (values: Values) => {
    setServerError(null);
    const result = await updateParticipantProfileAction(userId, values);
    if (!result.ok) return setServerError(result.error);
    setSaved(true);
    toast("success", "Profile updated");
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="mt-6 flex max-w-2xl flex-col gap-5 rounded-lg border border-border bg-elevated p-6"
    >
      <FormField
        label="Name"
        htmlFor="fullName"
        error={errors.fullName?.message}
      >
        <input
          id="fullName"
          className={fieldClasses}
          {...register("fullName")}
        />
      </FormField>
      {allowEmailEdit ? (
        <FormField
          label="Email address"
          htmlFor="email"
          error={errors.email?.message}
        >
          <input
            id="email"
            type="email"
            className={fieldClasses}
            {...register("email")}
          />
        </FormField>
      ) : null}
      <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
        <input id="phone" className={fieldClasses} {...register("phone")} />
      </FormField>
      <FormField label="Bio" htmlFor="bio" error={errors.bio?.message}>
        <textarea
          id="bio"
          rows={3}
          className={`${fieldClasses} resize-none`}
          {...register("bio")}
        />
      </FormField>
      {showParticipantFields ? (
        <FormField
          label="Gender"
          htmlFor="gender"
          error={errors.gender?.message}
        >
          <input id="gender" className={fieldClasses} {...register("gender")} />
        </FormField>
      ) : null}
      {showParticipantFields ? (
        <FormField
          label="School or institution"
          htmlFor="institution"
          error={errors.institution?.message}
        >
          <input
            id="institution"
            className={fieldClasses}
            {...register("institution")}
          />
        </FormField>
      ) : null}
      {showParticipantFields ? (
        <FormField
          label="Academic level"
          htmlFor="academicLevel"
          error={errors.academicLevel?.message}
        >
          <input
            id="academicLevel"
            className={fieldClasses}
            {...register("academicLevel")}
          />
        </FormField>
      ) : null}
      {showParticipantFields ? (
        <FormField
          label="District"
          htmlFor="district"
          error={errors.district?.message}
        >
          <input
            id="district"
            className={fieldClasses}
            {...register("district")}
          />
        </FormField>
      ) : null}
      {showParticipantFields ? (
        <FormField
          label="City / Upazila"
          htmlFor="city"
          error={errors.city?.message}
        >
          <input id="city" className={fieldClasses} {...register("city")} />
        </FormField>
      ) : null}
      {showParticipantFields ? (
        <FormField
          label="Address"
          htmlFor="address"
          error={errors.address?.message}
        >
          <textarea
            id="address"
            rows={3}
            className={`${fieldClasses} resize-none`}
            {...register("address")}
          />
        </FormField>
      ) : null}
      <FormField
        label="Class or grade"
        htmlFor="gradeLevel"
        error={errors.gradeLevel?.message}
      >
        <input
          id="gradeLevel"
          className={fieldClasses}
          {...register("gradeLevel")}
        />
      </FormField>
      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="w-fit text-xs"
      >
        {isSubmitting ? "Saving…" : "Save profile"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={isSubmitting}
        onClick={() => {
          reset(defaultValues);
          setServerError(null);
          setSaved(false);
        }}
        className="w-fit text-xs"
      >
        Cancel
      </Button>
      {saved ? (
        <p className="text-xs text-success" role="status">
          Saved successfully
        </p>
      ) : null}
    </form>
  );
}
