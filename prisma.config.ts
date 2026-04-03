import fs from "node:fs";
import path from "node:path";

import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";

if (!process.env.VERCEL) {
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  const envPath = path.resolve(process.cwd(), ".env");

  if (fs.existsSync(envLocalPath)) {
    loadEnv({ path: envLocalPath, override: false });
  }

  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath, override: false });
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
