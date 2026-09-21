"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { contentSchema } from "@/lib/content/validation";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import type { z } from "zod";
import type { ActionResult } from "@/lib/auth/actions";

type Values = z.infer<typeof contentSchema>;

export function ContentForm({
  defaultValues,
  onSubmit,
  onDone,
}: {
  defaultValues?: Partial<Values>;
  onSubmit: (values: Values) => Promise<ActionResult>;
  onDone: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      body: defaultValues?.body ?? "",
      externalUrl: defaultValues?.externalUrl ?? "",
      fileUrl: defaultValues?.fileUrl ?? "",
      coverImageUrl: defaultValues?.coverImageUrl ?? "",
    },
  });

  const fileUrlValue = watch("fileUrl");
  const coverImageUrlValue = watch("coverImageUrl");

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Handle PDF Upload with Unique Name
  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPdf(true);
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split(".").pop();
      const baseName = file.name.substring(0, file.name.lastIndexOf("."));
      const uniqueFileName = `${baseName}-${uniqueSuffix}.${fileExtension}`;

      const blob = await upload(uniqueFileName, file, {
        access: "public",
        handleUploadUrl: "/api/study-guides/upload",
      });
      setValue("fileUrl", blob.url, { shouldValidate: true });
      toast("success", "PDF uploaded successfully!");
    } catch (error: any) {
      toast("error", "Upload failed", error.message);
    } finally {
      setUploadingPdf(false);
    }
  }

  // Handle Cover Image Upload with Unique Name
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split(".").pop();
      const baseName = file.name.substring(0, file.name.lastIndexOf("."));
      const uniqueFileName = `${baseName}-${uniqueSuffix}.${fileExtension}`;

      const blob = await upload(uniqueFileName, file, {
        access: "public",
        handleUploadUrl: "/api/study-guides/upload",
      });
      setValue("coverImageUrl", blob.url, { shouldValidate: true });
      toast("success", "Cover image uploaded successfully!");
    } catch (error: any) {
      toast("error", "Cover upload failed", error.message);
    } finally {
      setUploadingCover(false);
    }
  }

  const submit = async (values: Values) => {
    setServerError(null);
    const result = await onSubmit(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    toast("success", "Saved");
    onDone();
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-5 rounded-lg border border-border bg-elevated p-5"
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
          rows={2}
          className={`${fieldClasses} resize-none`}
          {...register("description")}
        />
      </FormField>

      <FormField
        label="Body / notes (optional)"
        htmlFor="body"
        error={errors.body?.message}
      >
        <textarea
          id="body"
          rows={4}
          className={`${fieldClasses} resize-none`}
          {...register("body")}
        />
      </FormField>

      {/* PDF Document Drag & Drop Zone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wider text-secondary font-medium">
          Study Guide PDF Document
        </label>
        <div className="border-2 border-dashed border-border hover:border-white/20 rounded-lg p-4 text-center bg-black/20 transition-colors relative">
          {fileUrlValue ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-success font-medium truncate">
                PDF Attached: {fileUrlValue.split("/").pop()}
              </p>
              <button
                type="button"
                onClick={() =>
                  setValue("fileUrl", "", { shouldValidate: true })
                }
                className="text-xs text-error hover:underline px-2 py-1 rounded bg-white/5 border border-border shrink-0"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative cursor-pointer py-2">
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {uploadingPdf ? (
                <p className="text-xs text-secondary">
                  Uploading PDF to Vercel Blob...
                </p>
              ) : (
                <div>
                  <p className="text-xs text-primary">
                    Drag & drop your PDF file here, or{" "}
                    <span className="text-accent underline">browse</span>
                  </p>
                  <p className="text-[10px] text-muted mt-1">
                    PDF documents only
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cover Image Drag & Drop Zone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wider text-secondary font-medium">
          Cover Image / Thumbnail
        </label>
        <div className="border-2 border-dashed border-border hover:border-white/20 rounded-lg p-4 text-center bg-black/20 transition-colors relative">
          {coverImageUrlValue ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 truncate">
                <img
                  src={coverImageUrlValue}
                  alt="Cover Preview"
                  className="h-10 w-8 object-cover rounded border border-border shrink-0"
                />
                <p className="text-xs text-success font-medium truncate">
                  Cover Image Attached ✅
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setValue("coverImageUrl", "", { shouldValidate: true })
                }
                className="text-xs text-error hover:underline px-2 py-1 rounded bg-white/5 border border-border shrink-0"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative cursor-pointer py-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {uploadingCover ? (
                <p className="text-xs text-secondary">
                  Uploading cover image...
                </p>
              ) : (
                <div>
                  <p className="text-xs text-primary">
                    Drag & drop cover image here, or{" "}
                    <span className="text-accent underline">browse</span>
                  </p>
                  <p className="text-[10px] text-muted mt-1">PNG, JPG, WEBP</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="text-xs"
        >
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          className="text-xs"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
