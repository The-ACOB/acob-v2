ALTER TABLE "attempts" DROP CONSTRAINT IF EXISTS "attempts_team_id_fkey";
DROP INDEX IF EXISTS "attempts_team_id_idx";
ALTER TABLE "attempts" DROP COLUMN IF EXISTS "team_id";

DROP TABLE IF EXISTS "team_registrations";
DROP TABLE IF EXISTS "team_invitations";
DROP TABLE IF EXISTS "team_members";
DROP TABLE IF EXISTS "teams";

ALTER TABLE "olympiads" DROP COLUMN IF EXISTS "participation_mode";

CREATE TABLE "organisation_team_members" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "bio" TEXT,
  "image_url" TEXT,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "linkedin_url" TEXT,
  "website_url" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organisation_team_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organisation_team_members_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "organisation_team_members_active_display_order_idx" ON "organisation_team_members"("active", "display_order");