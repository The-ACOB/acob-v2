-- CreateEnum
CREATE TYPE "certificate_achievement" AS ENUM ('prime', 'elite', 'merit', 'honourable_mention', 'participation');
CREATE TYPE "certificate_status" AS ENUM ('valid', 'revoked');
CREATE TYPE "letter_status" AS ENUM ('draft', 'published', 'revoked');

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "certificate_id" TEXT NOT NULL,
    "verification_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "olympiad_id" TEXT NOT NULL,
    "attempt_id" TEXT,
    "achievement" "certificate_achievement" NOT NULL,
    "status" "certificate_status" NOT NULL DEFAULT 'valid',
    "file_url" TEXT,
    "issued_by" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_by" TEXT,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_letters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Letter of Recommendation',
    "body" TEXT,
    "file_url" TEXT,
    "status" "letter_status" NOT NULL DEFAULT 'draft',
    "issued_by" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "revoked_by" TEXT,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "recommendation_letters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_id_key" ON "certificates"("certificate_id");
CREATE UNIQUE INDEX "certificates_verification_token_key" ON "certificates"("verification_token");
CREATE INDEX "certificates_user_id_idx" ON "certificates"("user_id");
CREATE INDEX "recommendation_letters_user_id_idx" ON "recommendation_letters"("user_id");

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_olympiad_id_fkey" FOREIGN KEY ("olympiad_id") REFERENCES "olympiads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recommendation_letters" ADD CONSTRAINT "recommendation_letters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recommendation_letters" ADD CONSTRAINT "recommendation_letters_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recommendation_letters" ADD CONSTRAINT "recommendation_letters_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
