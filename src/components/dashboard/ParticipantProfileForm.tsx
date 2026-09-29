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

  // Initialize gender state based on defaultValues
  const initialGender = defaultValues.gender || "";
  const isStandardGender = ["Male", "Female"].includes(initialGender);
  const [genderOption, setGenderOption] = useState<string>(
    isStandardGender ? initialGender : initialGender ? "Other" : "Male",
  );
  const [genderOtherText, setGenderOtherText] = useState<string>(
    !isStandardGender && initialGender ? initialGender : "",
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(updateParticipantProfileSchema),
    defaultValues,
  });

  const gradeRegistration = register("gradeLevel");

  // Handle class/grade dropdown change and auto-calculate academic level
  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setValue("gradeLevel", val, { shouldValidate: true });

    const gradeNum = parseInt(val.trim(), 10);
    if (!isNaN(gradeNum)) {
      if (gradeNum >= 6 && gradeNum <= 8) {
        setValue("academicLevel", "Junior Secondary", { shouldValidate: true });
      } else if (gradeNum >= 9) {
        setValue("academicLevel", "Secondary Higher Secondary", {
          shouldValidate: true,
        });
      } else {
        setValue("academicLevel", "", { shouldValidate: true });
      }
    } else {
      setValue("academicLevel", "", { shouldValidate: true });
    }
  };

  const handleGenderChange = (option: string) => {
    setGenderOption(option);
    if (option === "Other") {
      setValue("gender", genderOtherText, { shouldValidate: true });
    } else {
      setValue("gender", option, { shouldValidate: true });
    }
  };

  const handleGenderOtherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setGenderOtherText(text);
    if (genderOption === "Other") {
      setValue("gender", text, { shouldValidate: true });
    }
  };

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
    <div className="mt-6 flex max-w-3xl flex-col gap-6">
      {/* Profile Picture Section */}
      <div className="flex items-center gap-6 rounded-lg border border-border bg-elevated p-6 shadow-sm">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-background border border-border flex-shrink-0">
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
        className="flex flex-col gap-6 rounded-lg border border-border bg-elevated p-6 shadow-sm"
      >
        {/* Section 1: Basic Information */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <FormField
              label="Phone"
              htmlFor="phone"
              error={errors.phone?.message}
            >
              <input
                id="phone"
                className={fieldClasses}
                {...register("phone")}
              />
            </FormField>

            {showParticipantFields ? (
              <div className="space-y-1.5 flex flex-col justify-center">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Gender
                </label>
                <div className="flex items-center gap-5 pt-1.5">
                  {["Male", "Female", "Other"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer text-sm text-gray-200 select-none"
                    >
                      <input
                        type="radio"
                        name="genderGroup"
                        value={option}
                        checked={genderOption === option}
                        onChange={() => handleGenderChange(option)}
                        className="accent-white cursor-pointer"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {genderOption === "Other" && (
                  <input
                    type="text"
                    placeholder="Please specify your gender"
                    value={genderOtherText}
                    onChange={handleGenderOtherChange}
                    className="mt-2 w-full bg-[#141414] border border-[#222222] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white transition"
                  />
                )}
                {errors.gender?.message && (
                  <p className="text-xs text-error mt-1">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            <FormField label="Bio" htmlFor="bio" error={errors.bio?.message}>
              <textarea
                id="bio"
                rows={2}
                className={`${fieldClasses} resize-none`}
                {...register("bio")}
              />
            </FormField>
          </div>
        </div>

        {showParticipantFields ? (
          <>
            <hr className="border-border my-1" />

            {/* Section 2: Academic & Institutional Details */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary mb-4">
                Academic Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <FormField
                  label="Class or grade"
                  htmlFor="gradeLevel"
                  error={errors.gradeLevel?.message}
                >
                  <select
                    id="gradeLevel"
                    className={`${fieldClasses} cursor-pointer`}
                    {...gradeRegistration}
                    onChange={(e) => {
                      gradeRegistration.onChange(e);
                      handleGradeChange(e);
                    }}
                  >
                    <option value="" disabled>
                      Select class or grade
                    </option>
                    <option value="6">Class 6</option>
                    <option value="7">Class 7</option>
                    <option value="8">Class 8</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                  </select>
                </FormField>

                <FormField
                  label="Academic level (auto-selected)"
                  htmlFor="academicLevel"
                  error={errors.academicLevel?.message}
                >
                  <input
                    id="academicLevel"
                    readOnly
                    className={`${fieldClasses} bg-[#111] text-gray-400 cursor-not-allowed`}
                    {...register("academicLevel")}
                    placeholder="Auto-calculated from grade"
                  />
                </FormField>
              </div>
            </div>

            <hr className="border-border my-1" />

            {/* Section 3: Location Details */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary mb-4">
                Location Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <FormField
                  label="City / Upazila"
                  htmlFor="city"
                  error={errors.city?.message}
                >
                  <input
                    id="city"
                    className={fieldClasses}
                    {...register("city")}
                  />
                </FormField>
              </div>

              <div className="mt-4">
                <FormField
                  label="Address"
                  htmlFor="address"
                  error={errors.address?.message}
                >
                  <textarea
                    id="address"
                    rows={2}
                    className={`${fieldClasses} resize-none`}
                    {...register("address")}
                  />
                </FormField>
              </div>
            </div>
          </>
        ) : null}

        {serverError ? (
          <p className="text-xs text-error">{serverError}</p>
        ) : null}

        <div className="flex items-center gap-3 pt-2">
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
            <p className="text-xs text-success ml-2" role="status">
              Saved successfully
            </p>
          ) : null}
        </div>
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
