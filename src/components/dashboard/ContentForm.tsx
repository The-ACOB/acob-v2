"use client";

import { useRef, useState } from "react";
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
import { deleteUploadedBlobAction } from "@/lib/content/actions";

// Zod input and output types are different because isPaid has a default.
type FormInput = z.input<typeof contentSchema>;
type Values = z.output<typeof contentSchema>;

export function ContentForm({
  defaultValues,
  onSubmit,
  onDone,
  kind,
}: {
  defaultValues?: Partial<FormInput>;
  kind: (typeof import("@/lib/content/validation").CONTENT_KINDS)[number];
  onSubmit: (values: Values) => Promise<ActionResult>;
  onDone: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  /*
   * URLs uploaded during THIS editing session.
   *
   * These are different from existing database files.
   * If the user cancels or removes an unsaved upload,
   * we can safely delete these blobs.
   */
  const uploadedThisSession = useRef<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, Values>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      body: defaultValues?.body ?? "",
      externalUrl: defaultValues?.externalUrl ?? "",
      fileUrl: defaultValues?.fileUrl ?? "",
      coverImageUrl: defaultValues?.coverImageUrl ?? "",
      isPaid: defaultValues?.isPaid ?? false,
      price: defaultValues?.price ?? "",
      paymentQrCodeUrl: defaultValues?.paymentQrCodeUrl ?? "",
    },
  });

  const fileUrlValue = watch("fileUrl");
  const coverImageUrlValue = watch("coverImageUrl");
  const paymentQrCodeUrlValue = watch("paymentQrCodeUrl");
  const isPaidValue = watch("isPaid");

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  /**
   * Delete a file that was uploaded during this form session.
   *
   * Existing database files are NOT passed here unless they were
   * uploaded during the current session.
   */
  async function cleanupSessionUpload(url: string | null | undefined) {
    if (!url || !uploadedThisSession.current.has(url)) {
      return;
    }

    uploadedThisSession.current.delete(url);

    const result = await deleteUploadedBlobAction(url);

    if (!result.ok) {
      console.error("Failed to clean up uploaded Blob:", result.error);
    }
  }

  // Handle PDF Upload
  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    // Allow selecting the same file again later.
    e.target.value = "";

    if (!file) return;

    try {
      setUploadingPdf(true);

      const uniqueSuffix = Math.random().toString(36).substring(2, 8);

      const fileExtension = file.name.split(".").pop() ?? "pdf";

      const baseName =
        file.name.lastIndexOf(".") > 0
          ? file.name.substring(0, file.name.lastIndexOf("."))
          : file.name;

      const uniqueFileName = `${baseName}-${uniqueSuffix}.${fileExtension}`;

      const blob = await upload(uniqueFileName, file, {
        access: "public",
        handleUploadUrl: "/api/study-guides/upload",
      });

      uploadedThisSession.current.add(blob.url);

      /*
       * If there was another newly-uploaded PDF currently attached,
       * it is no longer needed.
       */
      const previousUrl = fileUrlValue;

      setValue("fileUrl", blob.url, {
        shouldValidate: true,
        shouldDirty: true,
      });

      if (previousUrl && uploadedThisSession.current.has(previousUrl)) {
        await cleanupSessionUpload(previousUrl);
      }

      toast("success", "PDF uploaded successfully!");
    } catch (error) {
      toast(
        "error",
        "Upload failed",
        error instanceof Error ? error.message : "Could not upload PDF.",
      );
    } finally {
      setUploadingPdf(false);
    }
  }

  // Handle Cover Image Upload
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    // Allow selecting the same file again later.
    e.target.value = "";

    if (!file) return;

    try {
      setUploadingCover(true);

      const uniqueSuffix = Math.random().toString(36).substring(2, 8);

      const fileExtension = file.name.split(".").pop() ?? "jpg";

      const baseName =
        file.name.lastIndexOf(".") > 0
          ? file.name.substring(0, file.name.lastIndexOf("."))
          : file.name;

      const uniqueFileName = `${baseName}-${uniqueSuffix}.${fileExtension}`;

      const blob = await upload(uniqueFileName, file, {
        access: "public",
        handleUploadUrl: "/api/study-guides/upload",
      });

      uploadedThisSession.current.add(blob.url);

      /*
       * If there was another newly-uploaded cover currently attached,
       * it is no longer needed.
       */
      const previousUrl = coverImageUrlValue;

      setValue("coverImageUrl", blob.url, {
        shouldValidate: true,
        shouldDirty: true,
      });

      if (previousUrl && uploadedThisSession.current.has(previousUrl)) {
        await cleanupSessionUpload(previousUrl);
      }

      toast("success", "Cover image uploaded successfully!");
    } catch (error) {
      toast(
        "error",
        "Cover upload failed",
        error instanceof Error
          ? error.message
          : "Could not upload cover image.",
      );
    } finally {
      setUploadingCover(false);
    }
  }

  // Handle Payment QR Upload
  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("error", "Invalid file", "Please select a QR image.");
      return;
    }

    try {
      setUploadingQr(true);

      const name = `resource-payment-qr-${Date.now()}-${file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "-",
      )}`;

      const blob = await upload(name, file, {
        access: "public",
        handleUploadUrl: "/api/resources/upload",
      });

      uploadedThisSession.current.add(blob.url);

      const previous = paymentQrCodeUrlValue;

      setValue("paymentQrCodeUrl", blob.url, {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (previous && uploadedThisSession.current.has(previous)) {
        await cleanupSessionUpload(previous);
      }

      toast("success", "QR image uploaded");
    } catch (error) {
      toast(
        "error",
        "QR upload failed",
        error instanceof Error ? error.message : "Could not upload QR image.",
      );
    } finally {
      setUploadingQr(false);
    }
  }

  async function handleRemoveQr() {
    const url = paymentQrCodeUrlValue;

    setValue("paymentQrCodeUrl", "", {
      shouldDirty: true,
      shouldValidate: true,
    });

    await cleanupSessionUpload(url);
  }

  async function handleRemovePdf() {
    const url = fileUrlValue;

    setValue("fileUrl", "", {
      shouldValidate: true,
      shouldDirty: true,
    });

    /*
     * If this was uploaded during the current session,
     * delete it immediately.
     *
     * If this was an existing DB file, leave it alone.
     * updateContentAction() will delete it after Save.
     */
    await cleanupSessionUpload(url);
  }

  async function handleRemoveCover() {
    const url = coverImageUrlValue;

    setValue("coverImageUrl", "", {
      shouldValidate: true,
      shouldDirty: true,
    });

    /*
     * Same logic as the PDF.
     */
    await cleanupSessionUpload(url);
  }

  async function handleCancel() {
    /*
     * Delete every Blob created during this form session
     * that has not been successfully saved.
     */
    const urls = Array.from(uploadedThisSession.current);

    uploadedThisSession.current.clear();

    if (urls.length > 0) {
      await Promise.all(
        urls.map(async (url) => {
          const result = await deleteUploadedBlobAction(url);

          if (!result.ok) {
            console.error("Failed to clean up uploaded Blob:", result.error);
          }
        }),
      );
    }

    onDone();
  }

  // Zod resolver supplies validated output values here.
  const submit = async (values: Values) => {
    setServerError(null);

    if (kind === "resource" && !values.isPaid && values.paymentQrCodeUrl) {
      await cleanupSessionUpload(values.paymentQrCodeUrl);
    }

    const result = await onSubmit(values);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    /*
     * Everything uploaded during this session is now referenced
     * by the database, so DON'T delete it during cleanup.
     */
    uploadedThisSession.current.clear();

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

      {/* PDF Document */}
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
                onClick={handleRemovePdf}
                disabled={uploadingPdf || isSubmitting}
                className="text-xs text-error hover:underline px-2 py-1 rounded bg-white/5 border border-border shrink-0 disabled:opacity-50"
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
                disabled={uploadingPdf || isSubmitting}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
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

      {/* Cover Image */}
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
                  Cover Image Attached
                </p>
              </div>

              <button
                type="button"
                onClick={handleRemoveCover}
                disabled={uploadingCover || isSubmitting}
                className="text-xs text-error hover:underline px-2 py-1 rounded bg-white/5 border border-border shrink-0 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative cursor-pointer py-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverUpload}
                disabled={uploadingCover || isSubmitting}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
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

      {/* Paid resource checkout settings */}
      {kind === "resource" ? (
        <section className="rounded-lg border border-border bg-black/20 p-4 space-y-4">
          <label className="flex items-center gap-3 text-sm font-medium text-primary">
            <input
              type="checkbox"
              {...register("isPaid")}
              className="h-4 w-4 accent-current"
            />
            This is a paid resource
          </label>

          {isPaidValue ? (
            <>
              <FormField
                label="Price (BDT)"
                htmlFor="resource-price"
                error={errors.price?.message as string | undefined}
              >
                <input
                  id="resource-price"
                  type="number"
                  min="1"
                  step="0.01"
                  className={fieldClasses}
                  placeholder="e.g. 250"
                  {...register("price", { valueAsNumber: true })}
                />
              </FormField>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-secondary font-medium">
                  Payment QR Code
                </label>

                {paymentQrCodeUrlValue ? (
                  <div className="flex items-center gap-4 rounded-lg border border-border p-3">
                    <img
                      src={paymentQrCodeUrlValue}
                      alt="Payment QR preview"
                      className="h-28 w-28 rounded bg-white object-contain p-2"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-success">QR code attached</p>

                      <button
                        type="button"
                        onClick={handleRemoveQr}
                        className="mt-2 text-xs text-error underline"
                      >
                        Remove QR
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleQrUpload}
                      disabled={uploadingQr || isSubmitting}
                      className="block w-full text-xs text-secondary file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:text-primary"
                    />

                    <p className="mt-2 text-[10px] text-muted">
                      Upload the QR code for this resource. Each resource keeps
                      its own QR.
                    </p>

                    {uploadingQr ? (
                      <p className="mt-2 text-xs text-accent">Uploading QR…</p>
                    ) : null}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {serverError ? <p className="text-xs text-error">{serverError}</p> : null}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={
            isSubmitting || uploadingPdf || uploadingCover || uploadingQr
          }
          className="text-xs"
        >
          {isSubmitting ? "Saving…" : "Save"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={
            isSubmitting || uploadingPdf || uploadingCover || uploadingQr
          }
          className="text-xs"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
