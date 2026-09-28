-- Reconcile existing Neon schema with Prisma migration history.

DROP INDEX IF EXISTS "public"."attempt_answers_attempt_id_idx";
DROP INDEX IF EXISTS "public"."attempts_olympiad_id_idx";
DROP INDEX IF EXISTS "public"."career_listings_status_idx";
DROP INDEX IF EXISTS "public"."certificates_user_id_idx";
DROP INDEX IF EXISTS "public"."content_kind_status_idx";
DROP INDEX IF EXISTS "public"."popups_active_priority_idx";
DROP INDEX IF EXISTS "public"."question_options_question_id_idx";
DROP INDEX IF EXISTS "public"."questions_olympiad_id_idx";
DROP INDEX IF EXISTS "public"."recommendation_letters_user_id_idx";

ALTER TABLE "public"."content"
  ADD COLUMN IF NOT EXISTS "cover_image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "file_url" TEXT;

ALTER TABLE "public"."olympiads"
  ADD COLUMN IF NOT EXISTS "poster_url" TEXT;
