ALTER TABLE "olympiads"
ADD COLUMN "registration_start_at" TIMESTAMP(3),
ADD COLUMN "registration_end_at" TIMESTAMP(3);

-- Legacy start_at was the first availability boundary. Keep existing
-- Olympiads usable by opening registration at creation and closing it
-- when their former availability window began.
UPDATE "olympiads"
SET
  "registration_start_at" = COALESCE("start_at", "created_at"),
  "registration_end_at" = COALESCE("start_at", "end_at");