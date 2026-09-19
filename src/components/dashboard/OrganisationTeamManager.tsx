"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Upload, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { FormField, fieldClasses } from "@/components/ui/FormField";
import { useToast } from "@/components/dashboard/Toast";
import type { ActionResult } from "@/lib/auth/actions";
import { organisationTeamMemberSchema } from "@/lib/organisation-team/validation";

export type OrganisationTeamMemberRow = z.infer<
  typeof organisationTeamMemberSchema
> & { id: string };
type Values = z.infer<typeof organisationTeamMemberSchema>;

export function OrganisationTeamManager({
  members,
  create,
  update,
}: {
  members: OrganisationTeamMemberRow[];
  create: (values: Values) => Promise<ActionResult<{ id: string }>>;
  update: (id: string, values: Values) => Promise<ActionResult>;
}) {
  const [editing, setEditing] = useState<string | "create" | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const current =
    editing && editing !== "create"
      ? members.find((member) => member.id === editing)
      : null;

  const handleEditClick = (id: string | "create") => {
    setEditing(id);
    if (id === "create") {
      setImageUrl("");
    } else {
      const member = members.find((m) => m.id === id);
      setImageUrl(member?.imageUrl ?? "");
    }
  };

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
        setImageUrl(data.url);
        toast("success", "Image uploaded successfully");
      } else {
        toast("error", "Upload failed", data.error ?? "Failed to upload image");
      }
    } catch (error) {
      toast("error", "Upload error", "Something went wrong during upload");
    } finally {
      setIsUploading(false);
    }
  };

  async function submit(formData: FormData) {
    const values = {
      name: String(formData.get("name") ?? ""),
      title: String(formData.get("title") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      imageUrl: imageUrl,
      displayOrder: Number(formData.get("displayOrder") ?? 0),
      active: formData.get("active") === "on",
      linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
      websiteUrl: String(formData.get("websiteUrl") ?? ""),
    };
    const result = current
      ? await update(current.id, values)
      : await create(values);
    if (!result.ok) {
      toast("error", "Could not save member", result.error);
      return;
    }
    toast("success", "Organisation team updated");
    setEditing(null);
    setImageUrl("");
    router.refresh();
  }

  if (editing) {
    return (
      <form
        action={submit}
        className="flex flex-col gap-5 rounded-lg border border-border bg-elevated p-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor="name">
            <input
              id="name"
              name="name"
              required
              defaultValue={current?.name ?? ""}
              className={fieldClasses}
            />
          </FormField>
          <FormField label="Position / title" htmlFor="title">
            <input
              id="title"
              name="title"
              required
              defaultValue={current?.title ?? ""}
              className={fieldClasses}
            />
          </FormField>
        </div>

        <FormField label="Bio (optional)" htmlFor="bio">
          <textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={current?.bio ?? ""}
            className={`${fieldClasses} resize-none`}
          />
        </FormField>

        {/* Profile Photo Upload Section */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-wider text-secondary">
            Profile Photo
          </label>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border bg-elevated-2 flex items-center justify-center shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-mono text-muted">
                  No Image
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-elevated-2 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-border/50">
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-accent" />
                )}
                <span>{isUploading ? "Uploading..." : "Upload photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="sr-only"
                />
              </label>
              <input type="hidden" name="imageUrl" value={imageUrl} />
              <p className="text-[11px] text-muted">
                Stored locally in{" "}
                <code className="text-accent">/public/uploads/team/</code>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Display order" htmlFor="displayOrder">
            <input
              id="displayOrder"
              name="displayOrder"
              type="number"
              min="0"
              defaultValue={current?.displayOrder ?? 0}
              className={fieldClasses}
            />
          </FormField>
          <FormField label="LinkedIn URL" htmlFor="linkedinUrl">
            <input
              id="linkedinUrl"
              name="linkedinUrl"
              defaultValue={current?.linkedinUrl ?? ""}
              className={fieldClasses}
            />
          </FormField>
          <FormField label="Website URL" htmlFor="websiteUrl">
            <input
              id="websiteUrl"
              name="websiteUrl"
              defaultValue={current?.websiteUrl ?? ""}
              className={fieldClasses}
            />
          </FormField>
        </div>

        <label className="flex items-center gap-2 text-sm text-secondary">
          <input
            type="checkbox"
            name="active"
            defaultChecked={current?.active ?? true}
          />{" "}
          Publicly active
        </label>

        <div className="flex gap-3">
          <Button type="submit" className="text-xs" disabled={isUploading}>
            Save member
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEditing(null)}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {members.length === 0 ? (
        <p className="text-sm text-muted">No organisation team members yet.</p>
      ) : (
        members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-elevated-2 flex items-center justify-center shrink-0">
                {member.imageUrl ? (
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-mono text-muted">
                    {member.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-primary">{member.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {member.title} · {member.active ? "Published" : "Inactive"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleEditClick(member.id)}
              aria-label={`Edit ${member.name}`}
              className="text-muted hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        ))
      )}
      <Button
        variant="secondary"
        className="w-fit text-xs"
        onClick={() => handleEditClick("create")}
      >
        <Plus className="h-3.5 w-3.5" /> Add member
      </Button>
    </div>
  );
}
