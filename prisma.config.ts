import fs from "node:fs";
import path from "node:path";

import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";
import { ensureDatabaseEnv } from "./src/lib/env/resolve-database-env";

if (!process.env.VERCEL) {
  const envPath = path.resolve(process.cwd(), ".env");
  const envLocalPath = path.resolve(process.cwd(), ".env.local");

  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath, override: false });
  }

  if (fs.existsSync(envLocalPath)) {
    loadEnv({ path: envLocalPath, override: true });
  }
}

ensureDatabaseEnv(process.env);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
