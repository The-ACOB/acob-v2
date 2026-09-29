import { PrismaClient } from "../node_modules/.prisma/legacy-client";
import { PrismaPg } from "@prisma/adapter-pg";

const legacyUrl = process.env.LEGACY_DATABASE_URL;

if (!legacyUrl) {
  throw new Error("LEGACY_DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString: legacyUrl,
});

const db = new PrismaClient({
  adapter,
});

async function main() {
  const exams = await db.exams.findMany({
    orderBy: {
      start_date: "asc",
    },
    select: {
      id: true,
      title: true,
      event_id: true,
      duration: true,
      start_date: true,
      end_date: true,
      results_published: true,
    },
  });

  console.log("\n=== LEGACY EXAMS ===\n");
  console.log(JSON.stringify(exams, null, 2));
}

main()
  .catch((error) => {
    console.error("\nFAILED:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
