"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
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
  const router = useRouter();
  const { toast } = useToast();
  const current =
    editing && editing !== "create"
      ? members.find((member) => member.id === editing)
      : null;

  async function submit(formData: FormData) {
    const values = {
      name: String(formData.get("name") ?? ""),
      title: String(formData.get("title") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
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
        <FormField label="Photo URL (optional)" htmlFor="imageUrl">
          <input
            id="imageUrl"
            name="imageUrl"
            defaultValue={current?.imageUrl ?? ""}
            className={fieldClasses}
          />
        </FormField>
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
          <Button type="submit" className="text-xs">
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
            <div>
              <p className="text-sm text-primary">{member.name}</p>
              <p className="mt-1 text-xs text-muted">
                {member.title} · {member.active ? "Published" : "Inactive"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(member.id)}
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
        onClick={() => setEditing("create")}
      >
        <Plus className="h-3.5 w-3.5" /> Add member
      </Button>
    </div>
  );
}
