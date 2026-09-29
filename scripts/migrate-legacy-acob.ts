import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as LegacyPrismaClient } from "../node_modules/.prisma/legacy-client";
import { randomUUID, createHash } from "node:crypto";

const legacyUrl = process.env.LEGACY_DATABASE_URL;
const newUrl = process.env.DATABASE_URL;

if (!legacyUrl) {
  throw new Error("LEGACY_DATABASE_URL is not set.");
}

if (!newUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const newDb = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: newUrl,
  }),
});

const legacyDb = new LegacyPrismaClient({
  adapter: new PrismaPg({
    connectionString: legacyUrl,
  }),
});

/*
 * SAFETY:
 * The migration is DRY RUN by default.
 *
 * To actually write to Neon:
 *
 * $env:MIGRATE_LEGACY_CONFIRM="YES"
 *
 * Do not enable that unless you intentionally want to write.
 */
const WRITE = process.env.MIGRATE_LEGACY_CONFIRM === "YES";

const LEGACY_EXAM_IDS = {
  junior: "a5ec79ec-fc10-469f-8929-62507f473ebc",
  senior: "b17ea84f-2690-445c-8fd3-19fc97ebb55c",
} as const;

function deterministicUuid(input: string) {
  const hash = createHash("sha256").update(input).digest();

  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;

  const h = hash.toString("hex");

  return [
    h.slice(0, 8),
    h.slice(8, 12),
    h.slice(12, 16),
    h.slice(16, 20),
    h.slice(20, 32),
  ].join("-");
}

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "legacy-olympiad";
}

function optionList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;

        return String(
          obj.text ??
            obj.label ??
            obj.value ??
            obj.option ??
            JSON.stringify(item),
        );
      }

      return String(item);
    });
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map((item) =>
      typeof item === "string" ? item : JSON.stringify(item),
    );
  }

  return [];
}

function answerEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value as Record<string, unknown>);
}

function getCustomRank(answers: unknown): number | null {
  if (!answers || typeof answers !== "object") {
    return null;
  }

  const value = (answers as Record<string, unknown>)["_custom_rank"];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function isQuestionAnswerKey(key: string) {
  return (
    !key.startsWith("_") &&
    !key.endsWith("_explanation") &&
    /^[0-9a-f-]{36}$/i.test(key)
  );
}

function registeredForExam(registeredEvents: unknown, exam: any) {
  if (!registeredEvents) {
    return false;
  }

  const values = Array.isArray(registeredEvents)
    ? registeredEvents
    : [registeredEvents];

  const needles = [exam.id, exam.event_id, exam.title];

  const text = JSON.stringify(values).toLowerCase();

  return needles.some((needle) =>
    text.includes(String(needle).toLowerCase()),
  );
}

async function getOrCreateUser(profile: any, legacyUser: any) {
  if (!profile.email) {
    throw new Error(`Legacy profile ${profile.id} has no email.`);
  }

  const email = profile.email.trim().toLowerCase();

  let user = await newDb.user.findUnique({
    where: {
      email,
    },
  });

  /*
   * Prefer the Supabase auth bcrypt hash.
   *
   * We intentionally do NOT migrate password_plain.
   */
  const passwordHash = legacyUser?.encrypted_password ?? null;

  if (!passwordHash) {
    throw new Error(
      `No usable encrypted password for legacy account ${email}.`,
    );
  }

  if (!user) {
    user = await newDb.user.create({
      data: {
        id: legacyUser?.id ?? randomUUID(),
        email,
        passwordHash,
        status: legacyUser?.deleted_at ? "suspended" : "active",
        emailVerifiedAt:
          legacyUser?.email_confirmed_at ?? new Date(),
        createdAt:
          legacyUser?.created_at ??
          profile.updated_at ??
          new Date(),
        updatedAt:
          legacyUser?.updated_at ??
          profile.updated_at ??
          new Date(),
      },
    });
  } else {
    user = await newDb.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash,
        status: legacyUser?.deleted_at
          ? "suspended"
          : user.status,
        emailVerifiedAt:
          user.emailVerifiedAt ??
          legacyUser?.email_confirmed_at ??
          new Date(),
      },
    });
  }

  await newDb.profile.upsert({
    where: {
      userId: user.id,
    },

    create: {
      id: deterministicUuid(`profile:${profile.id}`),
      userId: user.id,
      fullName: profile.full_name || "Unknown Participant",
      phone: profile.phone ?? null,
      avatarUrl: profile.avatar_url ?? null,
      createdAt: profile.updated_at ?? new Date(),
      updatedAt: profile.updated_at ?? new Date(),
    },

    update: {
      fullName: profile.full_name || "Unknown Participant",
      phone: profile.phone ?? null,
      avatarUrl: profile.avatar_url ?? null,
    },
  });

  await newDb.participant.upsert({
    where: {
      userId: user.id,
    },

    create: {
      id: deterministicUuid(`participant:${profile.id}`),
      userId: user.id,
      institution: profile.school ?? null,
      gradeLevel: profile.grade ?? null,
      createdAt: profile.updated_at ?? new Date(),
    },

    update: {
      institution: profile.school ?? null,
      gradeLevel: profile.grade ?? null,
    },
  });

  return user;
}

async function main() {
  console.log(
    WRITE
      ? "\n*** WRITE MODE ENABLED ***\n"
      : "\n*** DRY RUN ONLY. No Neon writes will occur. ***\n",
  );

  /*
   * ---------------------------------------------------------
   * 1. READ LEGACY EXAMS
   * ---------------------------------------------------------
   */

  const exams = await legacyDb.exams.findMany({
    orderBy: {
      start_date: "asc",
    },
  });

  const legacyExams = exams.filter((exam: any) =>
    Object.values(LEGACY_EXAM_IDS).includes(exam.id),
  );

  if (legacyExams.length !== 2) {
    throw new Error(
      `Expected Junior + Senior exams, found ${legacyExams.length}.`,
    );
  }

  console.log("\n=== LEGACY EXAMS ===");

  for (const exam of legacyExams) {
    console.log({
      id: exam.id,
      title: exam.title,
      event_id: exam.event_id,
      duration: exam.duration,
      start_date: exam.start_date,
      end_date: exam.end_date,
      results_published: exam.results_published,
    });
  }

  /*
   * ---------------------------------------------------------
   * 2. READ LEGACY PROFILES + AUTH USERS
   * ---------------------------------------------------------
   */

  const profiles = await legacyDb.profiles.findMany({
    orderBy: {
      updated_at: "asc",
    },
  });

  const legacyUsers = await legacyDb.users.findMany({
    select: {
      id: true,
      email: true,
      encrypted_password: true,
      email_confirmed_at: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });

  const usersById = new Map(
    legacyUsers.map((user: any) => [user.id, user]),
  );

  console.log(`\nLegacy profiles: ${profiles.length}`);

  /*
   * ---------------------------------------------------------
   * 3. USER MIGRATION
   * ---------------------------------------------------------
   */

  const userMap = new Map<string, string>();

  if (WRITE) {
    for (const profile of profiles) {
      const legacyUser = usersById.get(profile.id);

      const user = await getOrCreateUser(
        profile,
        legacyUser,
      );

      userMap.set(profile.id, user.id);
    }
  } else {
    for (const profile of profiles) {
      userMap.set(profile.id, profile.id);
    }
  }

  /*
   * ---------------------------------------------------------
   * 4. FIND EXISTING NEON CREATOR
   * ---------------------------------------------------------
   */

  let creator: any = null;

  if (WRITE) {
    creator = await newDb.user.findFirst({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
      },
    });

    if (!creator) {
      throw new Error(
        "Neon has no existing user to use as Olympiad creator.",
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * 5. OLYMPIADS
   * ---------------------------------------------------------
   */

  const olympiadMap = new Map<string, string>();

  for (const exam of legacyExams) {
    const slug = `${slugify(exam.title)}-${exam.id.slice(
      0,
      8,
    )}`;

    console.log(`\nOlympiad: ${exam.title}`);
    console.log(`Legacy ID: ${exam.id}`);
    console.log(`Event ID: ${exam.event_id}`);

    if (!WRITE) {
      olympiadMap.set(exam.id, exam.id);
      continue;
    }

    const olympiad = await newDb.olympiad.upsert({
      where: {
        slug,
      },

      create: {
        id: exam.id,
        title: exam.title,
        slug,
        description:
          "Imported from the legacy ACOB Olympiad system.",
        subject: "Mathematics",
        status: exam.results_published
          ? "published"
          : "unpublished",
        durationMinutes: exam.duration,
        registrationEnabled: false,
        startAt: exam.start_date,
        endAt: exam.end_date,
        resultsPublishedAt: exam.results_published
          ? exam.updated_at
          : null,
        createdBy: creator.id,
        createdAt: exam.created_at,
        updatedAt: exam.updated_at,
      },

      update: {
        title: exam.title,
        durationMinutes: exam.duration,
        startAt: exam.start_date,
        endAt: exam.end_date,
        resultsPublishedAt: exam.results_published
          ? exam.updated_at
          : null,
      },
    });

    olympiadMap.set(exam.id, olympiad.id);
  }

  /*
   * ---------------------------------------------------------
   * 6. QUESTIONS
   * ---------------------------------------------------------
   */

  for (const exam of legacyExams) {
    const questions = await legacyDb.exam_questions.findMany({
      where: {
        exam_id: exam.id,
      },

      orderBy: {
        created_at: "asc",
      },
    });

    console.log(
      `\n${exam.title}: ${questions.length} questions`,
    );

    if (!WRITE) {
      continue;
    }

    const olympiadId = olympiadMap.get(exam.id);

    if (!olympiadId) {
      throw new Error(
        `No Neon Olympiad mapping for legacy exam ${exam.id}`,
      );
    }

    for (
      let index = 0;
      index < questions.length;
      index++
    ) {
      const q: any = questions[index];

      const type =
        q.type === "short"
          ? "short"
          : "mcq";

      const question = await newDb.question.upsert({
        where: {
          id: q.id,
        },

        create: {
          id: q.id,
          olympiadId,
          type,
          text: q.question_text,
          imageUrl: q.image_url ?? null,
          marks: q.points ?? 1,
          order: index,
          difficulty: "medium",
          createdAt: q.created_at,
          updatedAt: q.created_at,
        },

        update: {
          olympiadId,
          type,
          text: q.question_text,
          imageUrl: q.image_url ?? null,
          marks: q.points ?? 1,
          order: index,
        },
      });

      const options = optionList(q.options);

      for (
        let optionIndex = 0;
        optionIndex < options.length;
        optionIndex++
      ) {
        const optionId = deterministicUuid(
          `option:${q.id}:${optionIndex}`,
        );

        await newDb.questionOption.upsert({
          where: {
            id: optionId,
          },

          create: {
            id: optionId,
            questionId: question.id,
            text: options[optionIndex],
            order: optionIndex,
            isCorrect:
              q.correct_option_index === optionIndex,
          },

          update: {
            questionId: question.id,
            text: options[optionIndex],
            order: optionIndex,
            isCorrect:
              q.correct_option_index === optionIndex,
          },
        });
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * 7. REGISTRATIONS + SUBMISSIONS
   * ---------------------------------------------------------
   */

  let registrationCount = 0;
  let attemptCount = 0;
  let answerCount = 0;

  for (const exam of legacyExams) {
    const submissions =
      await legacyDb.exam_submissions.findMany({
        where: {
          exam_id: exam.id,
        },

        orderBy: {
          started_at: "asc",
        },
      });

    const questions =
      await legacyDb.exam_questions.findMany({
        where: {
          exam_id: exam.id,
        },

        orderBy: {
          created_at: "asc",
        },
      });

    const questionMap = new Map(
      questions.map((q: any) => [q.id, q]),
    );

    console.log(
      `\n${exam.title}: ${submissions.length} submissions`,
    );

    /*
     * Registrations are migrated independently
     * from submissions, so users who registered
     * but never started the exam are preserved.
     */

    if (WRITE) {
      const profilesForRegistration =
        profiles.filter((profile: any) =>
          registeredForExam(
            profile.registered_events,
            exam,
          ),
        );

      for (const profile of profilesForRegistration) {
        const userId = userMap.get(profile.id);

        if (!userId) {
          continue;
        }

        await newDb.olympiadRegistration.upsert({
          where: {
            olympiadId_userId: {
              olympiadId: olympiadMap.get(
                exam.id,
              )!,
              userId,
            },
          },

          create: {
            id: deterministicUuid(
              `registration:${exam.id}:${userId}`,
            ),
            olympiadId: olympiadMap.get(
              exam.id,
            )!,
            userId,
            status: "confirmed",
            registeredAt:
              profile.updated_at ??
              exam.created_at,
            confirmedAt:
              profile.updated_at ??
              exam.created_at,
          },

          update: {},
        });

        registrationCount++;
      }
    }

    /*
     * -------------------------------------------------------
     * SUBMISSIONS
     * -------------------------------------------------------
     */

    if (!WRITE) {
      for (const submission of submissions) {
        const profile = profiles.find(
          (p: any) =>
            p.id === submission.student_id,
        );

        console.log({
          submissionId: submission.id,
          studentId: submission.student_id,
          email: profile?.email ?? "UNKNOWN",
          status: submission.status,
          startedAt: submission.started_at,
          submittedAt: submission.submitted_at,
          timeTaken: submission.time_taken,
          warnings: submission.warnings_count,
          version: submission.version_selected,
          answerKeys: Object.keys(
            submission.answers ?? {},
          ).length,
          answers: submission.answers,
        });
      }

      continue;
    }

    /*
     * -------------------------------------------------------
     * WRITE SUBMISSIONS
     * -------------------------------------------------------
     */

    for (const submission of submissions) {
      const userId = userMap.get(
        submission.student_id,
      );

      if (!userId) {
        console.warn(
          `Skipping submission ${submission.id}: user ${submission.student_id} not migrated.`,
        );

        continue;
      }

      const answers = submission.answers ?? {};
      const entries = answerEntries(answers);

      /*
       * Calculate historical result values from the
       * legacy answer data.
       */

      let score = 0;
      let totalMarks = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;

      for (const q of questions) {
        const points = q.points ?? 1;

        totalMarks += points;

        const raw =
          (answers as Record<string, unknown>)[q.id];

        if (typeof raw !== "number") {
          unansweredCount++;
          continue;
        }

        if (
          raw === q.correct_option_index
        ) {
          score += points;
          correctCount++;
        } else {
          incorrectCount++;
        }
      }

      /*
       * Preserve the legacy custom rank when it is
       * numeric. If legacy data contains "N/A", rank
       * remains null, while the complete original answer
       * object is preserved in legacyAnswers.
       */
      const customRank = getCustomRank(answers);

      const attemptStatus =
        submission.status === "disqualified"
          ? "disqualified"
          : submission.status === "submitted"
            ? "submitted"
            : "in_progress";

      const attemptId = deterministicUuid(
        `attempt:${exam.id}:${userId}`,
      );

      const startedAt = submission.started_at;

      const submittedAt =
        submission.submitted_at ?? null;

      const deadlineAt = new Date(
        startedAt.getTime() +
          exam.duration * 60 * 1000,
      );

      /*
       * IMPORTANT:
       *
       * legacyAnswers stores the COMPLETE original
       * legacy answers JSON exactly as received.
       *
       * This preserves:
       * - question answer indexes
       * - _custom_rank
       * - *_explanation fields
       * - any other legacy metadata
       * - future/unknown legacy fields
       */
      const legacyAnswers = answers;

      const attempt =
        await newDb.attempt.upsert({
          where: {
            olympiadId_userId: {
              olympiadId:
                olympiadMap.get(exam.id)!,
              userId,
            },
          },

          create: {
            id: attemptId,
            olympiadId:
              olympiadMap.get(exam.id)!,
            userId,
            status: attemptStatus,
            startedAt,
            deadlineAt,
            submittedAt,
            score,
            totalMarks,
            correctCount,
            incorrectCount,
            unansweredCount,
            timeSpentSeconds:
              submission.time_taken,
            rank: customRank,

            /*
             * COMPLETE RAW LEGACY ANSWER DATA
             */
            legacyAnswers,

            scoreLocked: true,
            integrityViolationCount:
              submission.warnings_count ?? 0,
            autoSubmissionReason:
              submission.status === "disqualified"
                ? "legacy_disqualified"
                : null,
            autoSubmittedAt:
              submission.status === "disqualified"
                ? submittedAt
                : null,
            createdAt: submission.created_at,
            updatedAt: submission.created_at,
          },

          update: {
            status: attemptStatus,
            startedAt,
            deadlineAt,
            submittedAt,
            score,
            totalMarks,
            correctCount,
            incorrectCount,
            unansweredCount,
            timeSpentSeconds:
              submission.time_taken,
            rank: customRank,

            /*
             * COMPLETE RAW LEGACY ANSWER DATA
             */
            legacyAnswers,

            scoreLocked: true,
            integrityViolationCount:
              submission.warnings_count ?? 0,
            autoSubmissionReason:
              submission.status === "disqualified"
                ? "legacy_disqualified"
                : null,
            autoSubmittedAt:
              submission.status === "disqualified"
                ? submittedAt
                : null,
          },
        });

      attemptCount++;

      /*
       * -----------------------------------------------------
       * ANSWERS
       * -----------------------------------------------------
       */

      for (const [key, value] of entries) {
        if (!isQuestionAnswerKey(key)) {
          continue;
        }

        if (typeof value !== "number") {
          continue;
        }

        const legacyQuestion =
          questionMap.get(key);

        if (!legacyQuestion) {
          continue;
        }

        const options = optionList(
          legacyQuestion.options,
        );

        if (
          value < 0 ||
          value >= options.length
        ) {
          continue;
        }

        const selectedOptionId =
          deterministicUuid(
            `option:${key}:${value}`,
          );

        const isCorrect =
          value ===
          legacyQuestion.correct_option_index;

        const marksAwarded = isCorrect
          ? (legacyQuestion.points ?? 1)
          : 0;

        const answerId = deterministicUuid(
          `answer:${attempt.id}:${key}`,
        );

        await newDb.attemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId: key,
            },
          },

          create: {
            id: answerId,
            attemptId: attempt.id,
            questionId: key,
            selectedOptionId,
            isCorrect,
            marksAwarded,
            timeSpentSeconds: 0,
            changeCount: 0,
            createdAt: submission.created_at,
            updatedAt: submission.created_at,
          },

          update: {
            selectedOptionId,
            isCorrect,
            marksAwarded,
            updatedAt: submission.created_at,
          },
        });

        answerCount++;
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * SUMMARY
   * ---------------------------------------------------------
   */

  console.log("\n=== MIGRATION SUMMARY ===");

  console.log(
    `Legacy profiles: ${profiles.length}`,
  );

  console.log(
    `Legacy exams: ${legacyExams.length}`,
  );

  console.log(
    `Registrations written: ${registrationCount}`,
  );

  console.log(
    `Attempts written: ${attemptCount}`,
  );

  console.log(
    `Answers written: ${answerCount}`,
  );

  if (!WRITE) {
    console.log(
      "\nDRY RUN COMPLETE. Neon was NOT modified.",
    );
  } else {
    console.log(
      "\nMIGRATION COMPLETE.",
    );
  }
}

main()
  .catch((error) => {
    console.error("\nMIGRATION FAILED:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await legacyDb.$disconnect();
    await newDb.$disconnect();
  });