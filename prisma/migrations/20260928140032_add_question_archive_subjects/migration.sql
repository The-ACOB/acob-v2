/*
  Warnings:

  - You are about to drop the column `subject` on the `question_archives` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "question_archives_subject_idx";

-- AlterTable
ALTER TABLE "question_archives" DROP COLUMN "subject",
ADD COLUMN     "subject_id" TEXT;

-- CreateTable
CREATE TABLE "question_archive_subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_archive_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_archive_subjects_name_key" ON "question_archive_subjects"("name");

-- CreateIndex
CREATE INDEX "question_archives_subject_id_idx" ON "question_archives"("subject_id");

-- AddForeignKey
ALTER TABLE "question_archives" ADD CONSTRAINT "question_archives_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "question_archive_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
