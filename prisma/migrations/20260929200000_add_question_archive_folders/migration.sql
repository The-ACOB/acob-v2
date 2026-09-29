CREATE TABLE "question_archive_folders" (
  "id" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "parent_id" TEXT,
  "name" TEXT NOT NULL,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "question_archive_folders_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "question_archives" ADD COLUMN "folder_id" TEXT;

CREATE UNIQUE INDEX "question_archive_folders_subject_id_parent_id_name_key"
  ON "question_archive_folders"("subject_id", "parent_id", "name");
CREATE INDEX "question_archive_folders_subject_id_parent_id_idx"
  ON "question_archive_folders"("subject_id", "parent_id");
CREATE INDEX "question_archives_folder_id_idx"
  ON "question_archives"("folder_id");

ALTER TABLE "question_archive_folders"
  ADD CONSTRAINT "question_archive_folders_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "question_archive_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "question_archive_folders"
  ADD CONSTRAINT "question_archive_folders_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "question_archive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "question_archive_folders"
  ADD CONSTRAINT "question_archive_folders_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "question_archives"
  ADD CONSTRAINT "question_archives_folder_id_fkey"
  FOREIGN KEY ("folder_id") REFERENCES "question_archive_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
