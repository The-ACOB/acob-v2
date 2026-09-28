import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({
  connectionString,
});

const db = new PrismaClient({
  adapter,
});

const permissions = [
  {
    key: "payment:view",
    description:
      "View Olympiad payment submissions and payment approval records",
  },
  {
    key: "payment:approve",
    description: "Approve or reject Olympiad payment submissions",
  },
] as const;

const roles = ["CEO", "COO", "CTO", "ACADEMIC"] as const;

async function main() {
  console.log("Ensuring payment permissions exist...\n");

  for (const permissionData of permissions) {
    const permission = await db.permission.upsert({
      where: {
        key: permissionData.key,
      },
      update: {
        description: permissionData.description,
      },
      create: {
        key: permissionData.key,
        description: permissionData.description,
      },
    });

    console.log(`Permission ready: ${permission.key}`);

    for (const roleKey of roles) {
      const role = await db.role.findUnique({
        where: {
          key: roleKey,
        },
      });

      if (!role) {
        throw new Error(`Role "${roleKey}" does not exist.`);
      }

      await db.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });

      console.log(`  Granted ${permission.key} -> ${roleKey}`);
    }

    console.log();
  }

  console.log("Payment permissions configured successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
