import fs from "node:fs";
import path from "node:path";

import { config as loadEnv } from "dotenv";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath, override: false });
}

if (fs.existsSync(envPath)) {
  loadEnv({ path: envPath, override: false });
}

const required = ["SUPABASE_PROJECT_REF", "SUPABASE_DB_PASSWORD"];

const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  console.error(
    `[supabase-env] faltam variáveis obrigatórias: ${missing.join(", ")}.`,
  );
  console.error(
    "[supabase-env] defina pelo menos SUPABASE_PROJECT_REF e SUPABASE_DB_PASSWORD para montar as URLs do Prisma.",
  );
  process.exit(1);
}

const projectRef = process.env.SUPABASE_PROJECT_REF.trim();
const password = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD.trim());
const region = process.env.SUPABASE_REGION?.trim() || "us-east-2";
const dbName = process.env.SUPABASE_DB_NAME?.trim() || "postgres";
const dbUser = process.env.SUPABASE_DB_USER?.trim() || "postgres";
const poolerCluster = process.env.SUPABASE_POOLER_CLUSTER?.trim() || "aws-1";

const databaseUrl = `postgresql://${dbUser}.${projectRef}:${password}@${poolerCluster}-${region}.pooler.supabase.com:6543/${dbName}?pgbouncer=true`;
const directUrl = `postgresql://${dbUser}.${projectRef}:${password}@${poolerCluster}-${region}.pooler.supabase.com:5432/${dbName}`;

console.log("# Prisma + Supabase");
console.log(`DATABASE_URL="${databaseUrl}"`);
console.log(`DIRECT_URL="${directUrl}"`);
