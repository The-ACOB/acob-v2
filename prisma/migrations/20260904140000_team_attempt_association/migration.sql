ALTER TABLE "attempts" ADD COLUMN "team_id" TEXT;
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "attempts_team_id_idx" ON "attempts"("team_id");
