import "dotenv/config";
import { db } from "./client";
import { PERMISSIONS, PERMISSION_DESCRIPTIONS } from "@/lib/authz/permissions";
import { ROLE_DEFINITIONS, ROLE_PERMISSIONS } from "@/lib/authz/roles";
import { hashPassword } from "@/lib/auth/password";

/**
 * Idempotent seed: safe to re-run. Seeds the fixed role/permission
 * catalogue, and — only if FIRST_ADMIN_EMAIL / FIRST_ADMIN_PASSWORD
 * are set in the environment — creates the first CEO account. No real
 * credentials are ever hard-coded here.
 */
/**
 * ACOB's designated CEO account. Whenever the seed runs, this specific
 * email is guaranteed to hold the CEO role — the highest authority in
 * the system, matching the role hierarchy rules in
 * src/lib/authz/hierarchy.ts (CEO cannot be removed, cannot be demoted,
 * and can only self-manage via another CEO action).
 *
 * This never creates a password on its own: if the account doesn't
 * exist yet, it's only created when FIRST_ADMIN_PASSWORD is supplied
 * (see below). If the account already exists — e.g. they registered
 * themselves through the normal sign-up flow — this promotes them to
 * CEO without touching their password.
 */
const DESIGNATED_CEO_EMAIL = "mdhzarif03@gmail.com";

async function main() {
  console.log("Seeding roles...");
  const roleIdByKey = new Map<string, string>();
  for (const def of ROLE_DEFINITIONS) {
    const role = await db.role.upsert({
      where: { key: def.key },
      update: { label: def.label, rank: def.rank },
      create: { key: def.key, label: def.label, rank: def.rank },
    });
    roleIdByKey.set(role.key, role.id);
  }

  console.log("Seeding permissions...");
  const permissionIdByKey = new Map<string, string>();
  for (const key of PERMISSIONS) {
    const permission = await db.permission.upsert({
      where: { key },
      update: { description: PERMISSION_DESCRIPTIONS[key] },
      create: { key, description: PERMISSION_DESCRIPTIONS[key] },
    });
    permissionIdByKey.set(permission.key, permission.id);
  }

  console.log("Seeding role_permissions...");
  for (const [roleKey, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleIdByKey.get(roleKey);
    if (!roleId) continue;

    // Reset this role's grants to exactly match ROLE_PERMISSIONS.
    await db.rolePermission.deleteMany({ where: { roleId } });

    const permissionIds = perms
      .map((p) => permissionIdByKey.get(p))
      .filter((id): id is string => Boolean(id));

    if (permissionIds.length > 0) {
      await db.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    }
  }

  const firstAdminEmail = process.env.FIRST_ADMIN_EMAIL ?? DESIGNATED_CEO_EMAIL;
  const firstAdminPassword = process.env.FIRST_ADMIN_PASSWORD;
  const firstAdminName = process.env.FIRST_ADMIN_NAME ?? "ACOB Administrator";

  if (firstAdminEmail && firstAdminPassword) {
    const existing = await db.user.findUnique({ where: { email: firstAdminEmail } });
    if (existing) {
      console.log(`First admin (${firstAdminEmail}) already exists — skipping.`);
    } else {
      console.log(`Creating first CEO account for ${firstAdminEmail}...`);
      const passwordHash = await hashPassword(firstAdminPassword);
      const user = await db.user.create({
        data: {
          email: firstAdminEmail,
          passwordHash,
          emailVerifiedAt: new Date(),
          profile: { create: { fullName: firstAdminName } },
        },
      });

      const ceoRoleId = roleIdByKey.get("CEO");
      if (ceoRoleId) {
        await db.userRole.create({ data: { userId: user.id, roleId: ceoRoleId, assignedBy: null } });
      }
    }
  } else {
    console.log(
      "FIRST_ADMIN_PASSWORD not set — skipping first-admin account creation. " +
        `Set FIRST_ADMIN_PASSWORD (and optionally FIRST_ADMIN_EMAIL, which defaults to ${DESIGNATED_CEO_EMAIL}) ` +
        "in .env.local to create the first CEO account on next seed run."
    );
  }

  // Idempotent guarantee, independent of the block above: if the
  // designated CEO account already exists (e.g. self-registered
  // through /register before this seed ran), make sure it holds the
  // CEO role. Never touches their password.
  const designatedCeo = await db.user.findUnique({ where: { email: DESIGNATED_CEO_EMAIL } });
  if (designatedCeo) {
    const ceoRoleId = roleIdByKey.get("CEO");
    if (ceoRoleId) {
      await db.userRole.upsert({
        where: { userId_roleId: { userId: designatedCeo.id, roleId: ceoRoleId } },
        update: {},
        create: { userId: designatedCeo.id, roleId: ceoRoleId, assignedBy: null },
      });
      console.log(`Ensured CEO role for ${DESIGNATED_CEO_EMAIL}.`);
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
