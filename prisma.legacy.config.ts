import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/legacy.schema.prisma",

  datasource: {
    url: env("LEGACY_DATABASE_URL"),
  },
});
