import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient as LegacyPrismaClient,
} from "../node_modules/.prisma/legacy-client";

const legacyUrl = process.env.LEGACY_DATABASE_URL;

if (!legacyUrl) {
  throw new Error("LEGACY_DATABASE_URL is not set.");
}

const db = new LegacyPrismaClient({
  adapter: new PrismaPg({
    connectionString: legacyUrl,
  }),
});

async function main() {
  const exams = await db.exams.findMany({
    orderBy: {
      start_date: "asc",
    },
    select: {
      id: true,
      title: true,
    },
  });

  for (const exam of exams) {
    const submissions =
      await db.exam_submissions.findMany({
        where: {
          exam_id: exam.id,
        },
        select: {
          id: true,
          student_id: true,
          status: true,
          answers: true,
          warnings_count: true,
          time_taken: true,
        },
      });

    console.log("\n========================================");
    console.log(exam.title);
    console.log("========================================");
    console.log("Submissions:", submissions.length);

    for (const submission of submissions) {
      const answers =
        submission.answers &&
        typeof submission.answers === "object"
          ? submission.answers as Record<string, unknown>
          : {};

      console.log({
        submissionId: submission.id,
        studentId: submission.student_id,
        status: submission.status,
        warnings: submission.warnings_count,
        timeTaken: submission.time_taken,
        customRank: answers["_custom_rank"] ?? null,
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
