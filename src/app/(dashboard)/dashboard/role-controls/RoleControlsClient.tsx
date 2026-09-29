"use client";

import { useMemo, useState, useTransition } from "react";
import { updateRolePermissionsAction } from "@/lib/authz/role-actions";
import { Check, Save, ShieldCheck } from "lucide-react";

type PermissionGroup = {
  label: string;
  permissions: string[];
};

type RoleData = {
  key: string;
  label: string;
  permissions: string[];
};

type Props = {
  roles: RoleData[];
  permissions: string[];
  permissionDescriptions: Record<string, string>;
  permissionGroups: PermissionGroup[];
};

export default function RoleControlsClient({
  roles,
  permissions,
  permissionDescriptions,
  permissionGroups,
}: Props) {
  const [selectedRole, setSelectedRole] = useState(roles[0]?.key ?? "");
  const [rolePermissions, setRolePermissions] = useState<
    Record<string, string[]>
  >(() =>
    Object.fromEntries(
      roles.map((role) => [role.key, [...role.permissions]]),
    ),
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const role = roles.find((item) => item.key === selectedRole);

  const enabledCount = role
    ? rolePermissions[role.key]?.length ?? 0
    : 0;

  const allEnabled = role
    ? enabledCount === permissions.length
    : false;

  const togglePermission = (permission: string) => {
    if (!role) return;

    setMessage(null);
    setError(null);

    setRolePermissions((current) => {
      const existing = current[role.key] ?? [];

      return {
        ...current,
        [role.key]: existing.includes(permission)
          ? existing.filter((item) => item !== permission)
          : [...existing, permission],
      };
    });
  };

  const setAllPermissions = (enabled: boolean) => {
    if (!role) return;

    setMessage(null);
    setError(null);

    setRolePermissions((current) => ({
      ...current,
      [role.key]: enabled ? [...permissions] : [],
    }));
  };

  const save = () => {
    if (!role) return;

    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await updateRolePermissionsAction(
        role.key,
        rolePermissions[role.key] ?? [],
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMessage(`${role.label} permissions saved.`);
    });
  };

  const groupedPermissions = useMemo(
    () => permissionGroups.filter((group) => group.permissions.length > 0),
    [permissionGroups],
  );

  if (!roles.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        No configurable roles are available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold">Role Permissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Control what each organisation role can access. Sidebar options
              follow these permissions automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="px-3 pb-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Executive Roles
            </p>
          </div>

          <div className="space-y-1">
            {[
              ["CEO", "Chief Executive Officer"],
              ["COO", "Chief Operating Officer"],
              ["CTO", "Chief Technology Officer"],
            ].map(([key, label]) => (
              <div
                key={key}
                className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {key}
                    </span>
                  </div>

                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Full Access
                  </span>
                </div>

                <p className="mt-2 text-[10px] text-muted-foreground">
                  Fixed executive role
                </p>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-border" />

          <div className="px-3 pb-3 pt-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Configurable Roles
            </p>
          </div>

          <div className="space-y-1">
            {roles.map((item) => {
              const active = item.key === selectedRole;
              const count = rolePermissions[item.key]?.length ?? 0;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSelectedRole(item.key);
                    setMessage(null);
                    setError(null);
                  }}
                  className={[
                    "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  ].join(" ")}
                >
                  <span>
                    <span className="block text-sm font-medium">
                      {item.label}
                    </span>
                    <span
                      className={[
                        "mt-0.5 block text-xs",
                        active
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {item.key}
                    </span>
                  </span>

                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      active
                        ? "bg-primary-foreground/15"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-border px-3 pt-4">
            <p className="text-xs leading-5 text-muted-foreground">
              CEO, COO, and CTO permissions are fixed and cannot be edited
              here.
            </p>
          </div>
        </div>

        {role && (
          <div className="rounded-2xl border border-border bg-card">
            <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {role.key}
                </p>
                <h2 className="mt-1 text-xl font-semibold">{role.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {enabledCount} of {permissions.length} permissions enabled
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAllPermissions(!allEnabled)}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  {allEnabled ? "Clear All" : "Enable All"}
                </button>

                <button
                  type="button"
                  onClick={save}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {message && (
              <div className="mx-5 mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            {error && (
              <div className="mx-5 mt-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="divide-y divide-border">
              {groupedPermissions.map((group) => (
                <section key={group.label} className="p-5">
                  <div className="mb-4">
                    <h3 className="font-medium">{group.label}</h3>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {group.permissions.map((permission) => {
                      const checked =
                        rolePermissions[role.key]?.includes(permission) ??
                        false;

                      return (
                        <button
                          key={permission}
                          type="button"
                          onClick={() => togglePermission(permission)}
                          className={[
                            "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                            checked
                              ? "border-primary/30 bg-primary/5"
                              : "border-border hover:bg-muted/50",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border",
                            ].join(" ")}
                          >
                            {checked && <Check className="h-3.5 w-3.5" />}
                          </span>

                          <span className="min-w-0">
                            <span className="block text-sm font-medium">
                              {permission}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                              {permissionDescriptions[permission] ??
                                "Permission for this dashboard capability."}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

