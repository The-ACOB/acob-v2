import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("\n=== ACOB LEGACY MIGRATION VERIFICATION ===\n");

  const users = await prisma.user.count();
  const profiles = await prisma.profile.count();
  const participants = await prisma.participant.count();
  const olympiads = await prisma.olympiad.count();
  const questions = await prisma.question.count();
  const options = await prisma.questionOption.count();
  const registrations = await prisma.olympiadRegistration.count();
  const attempts = await prisma.attempt.count();
  const answers = await prisma.attemptAnswer.count();

  console.log("GLOBAL COUNTS");
  console.log("Users:", users);
  console.log("Profiles:", profiles);
  console.log("Participants:", participants);
  console.log("Olympiads:", olympiads);
  console.log("Questions:", questions);
  console.log("Question options:", options);
  console.log("Registrations:", registrations);
  console.log("Attempts:", attempts);
  console.log("Attempt answers:", answers);

  const olympiadsFound = await prisma.olympiad.findMany({
    where: {
      title: {
        in: [
          "Math মেধা Junior Exam",
          "Math মেধা Senior Exam",
        ],
      },
    },
    include: {
      registrations: true,
      questions: true,
      attempts: {
        include: {
          user: {
            select: {
              email: true,
            },
          },
          answers: true,
        },
      },
    },
    orderBy: {
      title: "asc",
    },
  });

  console.log("\n=== OLYMPIAD DETAILS ===\n");

  for (const olympiad of olympiadsFound) {
    const submitted = olympiad.attempts.filter(
      (a) => a.status === "submitted",
    ).length;

    const disqualified = olympiad.attempts.filter(
      (a) => a.status === "disqualified",
    ).length;

    console.log(`\nOlympiad: ${olympiad.title}`);
    console.log("ID:", olympiad.id);
    console.log("Questions:", olympiad.questions.length);
    console.log("Registrations:", olympiad.registrations.length);
    console.log("Attempts:", olympiad.attempts.length);
    console.log("Submitted:", submitted);
    console.log("Disqualified:", disqualified);

    console.log("\nATTEMPTS:");

    for (const attempt of olympiad.attempts) {
      console.log({
        email: attempt.user.email,
        status: attempt.status,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        correct: attempt.correctCount,
        incorrect: attempt.incorrectCount,
        unanswered: attempt.unansweredCount,
        time: attempt.timeSpentSeconds,
        warnings: attempt.integrityViolationCount,
        rank: attempt.rank,
        answers: attempt.answers.length,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
      });
    }
  }

  console.log("\n=== EXPECTED MIGRATION TOTALS ===");
  console.log("Profiles: 58");
  console.log("Olympiads: 2");
  console.log("Questions: 60");
  console.log("Attempts: 17");
  console.log("Registrations: 42");
  console.log("Answers: 307");

  const checks = [
    ["Profiles", profiles === 58],
    ["Olympiads", olympiadsFound.length === 2],
    ["Questions", questions === 60],
    ["Attempts", attempts === 17],
    ["Registrations", registrations === 42],
    ["Answers", answers === 307],
  ] as const;

  console.log("\n=== CHECK RESULTS ===");

  let allPassed = true;

  for (const [name, passed] of checks) {
    console.log(`${passed ? "PASS" : "FAIL"} - ${name}`);

    if (!passed) {
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("\nALL MIGRATION COUNT CHECKS PASSED.");
  } else {
    console.log(
      "\nMIGRATION VERIFICATION FAILED. DO NOT MODIFY MIGRATED DATA YET.",
    );
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("\nVERIFICATION ERROR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });