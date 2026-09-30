ALTER TABLE "attempts"
ADD COLUMN "manual_rank" INTEGER;

CREATE INDEX "attempts_olympiad_id_manual_rank_idx"
ON "attempts"("olympiad_id", "manual_rank");
