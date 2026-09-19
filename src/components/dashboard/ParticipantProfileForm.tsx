"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateParticipantProfileAction } from "@/lib/participants/actions";
import { updateParticipantProfileSchema } from "@/lib/participants/validation";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import AvatarUploadModal from "@/components/AvatarUploadModal";
import Image from "next/image";
import type { z } from "zod";

type Values = z.infer<typeof updateParticipantProfileSchema>;

export function ParticipantProfileForm({
  userId,
  initialAvatarUrl,
  showParticipantFields = true,
  allowEmailEdit = true,
  defaultValues,
}: {
  userId: string;
  initialAvatarUrl?: string | null;
  showParticipantFields?: boolean;
  allowEmailEdit?: boolean;
  defaultValues: Values;
}) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?"))
      return;
    try {
      const res = await fetch("/api/user/avatar", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setAvatarUrl(null);
      toast("success", "Profile picture removed");
    } catch (err) {
      toast("error", "Failed to remove profile picture");
    }
  };

  return (
    <div className="mt-6 flex max-w-2xl flex-col gap-6">
      {/* Profile Picture Section */}
      <div className="flex items-center gap-6 rounded-lg border border-border bg-elevated p-6">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-background border border-border">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile Avatar"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-secondary">
              NO PFP
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-foreground">
            Profile Picture
          </h3>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="text-xs h-8 px-3"
              onClick={() => setIsModalOpen(true)}
            >
              {avatarUrl ? "Change picture" : "Upload picture"}
            </Button>
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                className="text-xs h-8 px-3 text-error hover:text-error"
                onClick={handleRemoveAvatar}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(submit)}
        noValidate
        className="flex flex-col gap-5 rounded-lg border border-border bg-elevated p-6"
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
            <input
              id="gender"
              className={fieldClasses}
              {...register("gender")}
            />
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
        {serverError ? (
          <p className="text-xs text-error">{serverError}</p>
        ) : null}
        <div className="flex gap-3">
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
        </div>
        {saved ? (
          <p className="text-xs text-success" role="status">
            Saved successfully
          </p>
        ) : null}
      </form>

      <AvatarUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadComplete={(newUrl) => {
          setAvatarUrl(newUrl);
          toast("success", "Profile picture updated");
        }}
      />
    </div>
  );
}
