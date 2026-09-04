-- CreateEnum
CREATE TYPE "content_kind" AS ENUM ('podcast', 'study_guide', 'video_tutorial', 'resource');
CREATE TYPE "content_status" AS ENUM ('draft', 'published', 'unpublished', 'archived');
CREATE TYPE "career_status" AS ENUM ('draft', 'published', 'closed');

-- CreateTable
CREATE TABLE "content" (
    "id" TEXT NOT NULL,
    "kind" "content_kind" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "body" TEXT,
    "external_url" TEXT,
    "status" "content_status" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_listings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "status" "career_status" NOT NULL DEFAULT 'draft',
    "publish_at" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "career_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popups" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "cta_label" TEXT,
    "cta_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "popups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_slug_key" ON "content"("slug");
CREATE INDEX "content_kind_status_idx" ON "content"("kind", "status");
CREATE INDEX "career_listings_status_idx" ON "career_listings"("status");
CREATE INDEX "popups_active_priority_idx" ON "popups"("active", "priority");

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "career_listings" ADD CONSTRAINT "career_listings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "popups" ADD CONSTRAINT "popups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
