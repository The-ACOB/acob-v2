INSERT INTO "olympiad_registrations" ("id", "olympiad_id", "user_id", "registered_at")
SELECT gen_random_uuid()::text, a."olympiad_id", a."user_id", a."created_at"
FROM "attempts" a
LEFT JOIN "olympiad_registrations" r
  ON r."olympiad_id" = a."olympiad_id" AND r."user_id" = a."user_id"
WHERE r."id" IS NULL;