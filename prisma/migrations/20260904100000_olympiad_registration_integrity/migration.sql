ALTER TABLE "attempts"
  ADD COLUMN "integrity_violation_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "auto_submission_reason" TEXT,
  ADD COLUMN "auto_submitted_at" TIMESTAMP(3);

CREATE TABLE "olympiad_registrations" (
  "id" TEXT NOT NULL,
  "olympiad_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "olympiad_registrations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "olympiad_registrations_olympiad_id_user_id_key" UNIQUE ("olympiad_id", "user_id"),
  CONSTRAINT "olympiad_registrations_olympiad_id_fkey" FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "olympiad_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "olympiad_registrations_user_id_idx" ON "olympiad_registrations"("user_id");