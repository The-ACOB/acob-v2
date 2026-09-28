-- CreateEnum
CREATE TYPE "question_language" AS ENUM ('en', 'bn');

-- CreateEnum
CREATE TYPE "question_type" AS ENUM ('mcq', 'short');

-- AlterTable
ALTER TABLE "popups" ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "preferred_language" "question_language" NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "question_options" ADD COLUMN     "text_bn" TEXT;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "archive_question_id" TEXT,
ADD COLUMN     "explanation_bn" TEXT,
ADD COLUMN     "text_bn" TEXT,
ADD COLUMN     "type" "question_type" NOT NULL DEFAULT 'mcq';

-- CreateTable
CREATE TABLE "question_archives" (
    "id" TEXT NOT NULL,
    "type" "question_type" NOT NULL DEFAULT 'mcq',
    "question_en" TEXT NOT NULL,
    "question_bn" TEXT NOT NULL,
    "subject" TEXT,
    "difficulty" "question_difficulty" NOT NULL DEFAULT 'medium',
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "explanation_en" TEXT,
    "explanation_bn" TEXT,
    "image_url" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_archives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_archive_options" (
    "id" TEXT NOT NULL,
    "archive_question_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text_en" TEXT NOT NULL,
    "text_bn" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "question_archive_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_archives_type_idx" ON "question_archives"("type");

-- CreateIndex
CREATE INDEX "question_archives_subject_idx" ON "question_archives"("subject");

-- CreateIndex
CREATE INDEX "question_archives_difficulty_idx" ON "question_archives"("difficulty");

-- CreateIndex
CREATE INDEX "question_archives_created_at_idx" ON "question_archives"("created_at");

-- CreateIndex
CREATE INDEX "question_archive_options_archive_question_id_order_idx" ON "question_archive_options"("archive_question_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "question_archive_options_archive_question_id_label_key" ON "question_archive_options"("archive_question_id", "label");

-- CreateIndex
CREATE INDEX "questions_olympiad_id_order_idx" ON "questions"("olympiad_id", "order");

-- CreateIndex
CREATE INDEX "questions_archive_question_id_idx" ON "questions"("archive_question_id");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_archive_question_id_fkey" FOREIGN KEY ("archive_question_id") REFERENCES "question_archives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_archives" ADD CONSTRAINT "question_archives_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_archive_options" ADD CONSTRAINT "question_archive_options_archive_question_id_fkey" FOREIGN KEY ("archive_question_id") REFERENCES "question_archives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popups" ADD CONSTRAINT "popups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
