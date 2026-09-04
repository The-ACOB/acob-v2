-- CreateEnum
CREATE TYPE "olympiad_status" AS ENUM ('draft', 'published', 'unpublished');
CREATE TYPE "question_difficulty" AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE "attempt_status" AS ENUM ('in_progress', 'submitted', 'expired_auto_submitted');

-- CreateTable
CREATE TABLE "olympiads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "status" "olympiad_status" NOT NULL DEFAULT 'draft',
    "duration_minutes" INTEGER NOT NULL,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "publish_at" TIMESTAMP(3),
    "negative_marking_enabled" BOOLEAN NOT NULL DEFAULT false,
    "negative_marking_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "results_published_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "olympiads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "olympiad_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "image_url" TEXT,
    "subject" TEXT,
    "difficulty" "question_difficulty" NOT NULL DEFAULT 'medium',
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" TEXT NOT NULL,
    "olympiad_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "attempt_status" NOT NULL DEFAULT 'in_progress',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "total_marks" DOUBLE PRECISION,
    "correct_count" INTEGER,
    "incorrect_count" INTEGER,
    "unanswered_count" INTEGER,
    "time_spent_seconds" INTEGER,
    "rank" INTEGER,
    "score_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answers" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option_id" TEXT,
    "is_correct" BOOLEAN,
    "marks_awarded" DOUBLE PRECISION,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "change_count" INTEGER NOT NULL DEFAULT 0,
    "first_answered_at" TIMESTAMP(3),
    "last_interaction_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "olympiads_slug_key" ON "olympiads"("slug");
CREATE UNIQUE INDEX "attempts_olympiad_id_user_id_key" ON "attempts"("olympiad_id", "user_id");
CREATE UNIQUE INDEX "attempt_answers_attempt_id_question_id_key" ON "attempt_answers"("attempt_id", "question_id");
CREATE INDEX "questions_olympiad_id_idx" ON "questions"("olympiad_id");
CREATE INDEX "question_options_question_id_idx" ON "question_options"("question_id");
CREATE INDEX "attempts_olympiad_id_idx" ON "attempts"("olympiad_id");
CREATE INDEX "attempt_answers_attempt_id_idx" ON "attempt_answers"("attempt_id");

-- AddForeignKey
ALTER TABLE "olympiads" ADD CONSTRAINT "olympiads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_olympiad_id_fkey" FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_olympiad_id_fkey" FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
