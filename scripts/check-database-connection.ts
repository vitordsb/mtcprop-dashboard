import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";

import { ensureDatabaseEnv } from "../src/lib/env/resolve-database-env";

const envPath = path.resolve(process.cwd(), ".env");
const envLocalPath = path.resolve(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) {
  loadEnv({ path: envPath, override: false });
}

if (fs.existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath, override: true });
}

async function main() {
  const resolved = ensureDatabaseEnv(process.env);

  if (!resolved.databaseUrl || !resolved.directUrl) {
    throw new Error(
      "DATABASE_URL/DIRECT_URL ausentes. Preencha as URLs finais ou as envs-base do Supabase.",
    );
  }

  const prisma = new PrismaClient({
    log: ["error"],
  });

  try {
    const [row] = await prisma.$queryRaw<
      Array<{ current_database: string; current_schema: string; now: Date }>
    >`SELECT current_database(), current_schema(), now()`;

    console.log("[db:check] conexão ok");
    console.log(`[db:check] source=${resolved.source}`);
    console.log(`[db:check] database=${row?.current_database ?? "unknown"}`);
    console.log(`[db:check] schema=${row?.current_schema ?? "unknown"}`);
    console.log(`[db:check] serverTime=${row?.now?.toISOString?.() ?? "unknown"}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("[db:check] falhou");
  console.error(error);
  process.exit(1);
});
