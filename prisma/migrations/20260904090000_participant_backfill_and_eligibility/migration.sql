ALTER TABLE "participants"
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "district" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "academic_level" TEXT;

ALTER TABLE "olympiads"
  ADD COLUMN "eligibility_mode" TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN "eligibility_grade_level" TEXT,
  ADD COLUMN "eligibility_institution" TEXT,
  ADD COLUMN "eligibility_academic_level" TEXT;

INSERT INTO "participants" ("id", "user_id")
SELECT gen_random_uuid()::text, ur."user_id"
FROM "user_roles" ur
JOIN "roles" r ON r."id" = ur."role_id"
LEFT JOIN "participants" p ON p."user_id" = ur."user_id"
WHERE r."key" = 'PARTICIPANT' AND p."user_id" IS NULL;